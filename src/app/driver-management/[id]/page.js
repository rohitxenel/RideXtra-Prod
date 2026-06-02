'use client';
import { useParams, useRouter } from 'next/navigation';
import { FiMaximize } from "react-icons/fi";
import { getdriverById, getAllUserTripById, changeStatus, getdriverState } from '@/services/driverManagement';
import { IMAGE_URL } from '@/lib/apiConfig'
import { useUserStore } from '@/store/userStore';
import { useEffect, useState, useRef, useMemo } from 'react';

import {
    FiArrowLeft,
    FiPhone,
    FiMail,
    FiDollarSign,
    FiUser,
    FiCalendar,
    FiGlobe,
    FiCheckCircle,
    FiXCircle,
    FiTruck,
    FiCreditCard as FiCard,
    FiDollarSign as FiCash,
    FiAlertCircle,
    FiTrendingUp,
    FiUserX,
    FiTrash2,
    FiAward,
    FiFileText,
    FiEdit,
    FiStar
} from 'react-icons/fi';
import Snackbar from '@/components/layout/Snackbar';
import Image from 'next/image';
import { FaBuilding, FaCar, FaRegFileAlt } from "react-icons/fa";

/* ===== Helpers for Recent Reviews ===== */

const timeAgo = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const diffMs = Date.now() - d.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(months / 12);
        return `${years}y ago`;
    } catch {
        return '';
    }
};

const ReviewRow = ({ review, isExpanded, onToggle }) => {
    const rounded = Math.round(review?.rating ?? 0); // 1..5
    const comment = review?.comment || '';
    const LONG = 120;
    const showToggle = comment.length > LONG;
    const displayText = isExpanded ? comment : comment.slice(0, LONG) + (showToggle ? '…' : '');
    const stamp = review?.updatedAt || review?.createdAt;

    // Initial letter for avatar
    const initial = (comment?.trim()?.charAt(0) || 'R').toUpperCase();

    return (
        <div className="flex items-start">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-xs font-medium text-indigo-600">{initial}</span>
            </div>
            <div className="flex-1">
                <div className="flex items-center mb-1">
                    <div className="flex mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                                key={star}
                                className={`h-3 w-3 ${star <= rounded ? 'text-amber-400' : 'text-gray-300'}`}
                                fill={star <= rounded ? 'currentColor' : 'none'}
                            />
                        ))}
                    </div>
                    {stamp && <span className="text-xs text-gray-500">{timeAgo(stamp)}</span>}
                </div>
                <p className="text-sm text-gray-700">
                    {displayText}{' '}
                    {showToggle && (
                        <button
                            onClick={onToggle}
                            className="ml-1 text-indigo-600 text-xs font-medium hover:underline"
                        >
                            {isExpanded ? 'See less' : 'See more'}
                        </button>
                    )}
                </p>
            </div>
        </div>
    );
};

const RecentReviewsCard = ({ driverState }) => {
    const [expanded, setExpanded] = useState({});
    const reviews = useMemo(() => {
        const arr = driverState?.recentReviews || [];
        const sorted = [...arr].sort((a, b) => {
            const da = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const db = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return db - da;
        });
        return sorted.slice(0, 2);
    }, [driverState]);

    const toggleExpand = (orderId) =>
        setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));

    return (
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Recent Reviews</h3>
            </div>

            {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No recent reviews.</p>
            ) : (
                <div className="space-y-3">
                    {reviews.map((r) => (
                        <ReviewRow
                            key={r.orderId || Math.random()}
                            review={r}
                            isExpanded={!!expanded[r.orderId]}
                            onToggle={() => toggleExpand(r.orderId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ===== Page Component ===== */

export default function DriverProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [driver, setDriver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [snackbar, setSnackbar] = useState({
        visible: false,
        message: '',
        type: 'success'
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [actionType, setActionType] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showUnverifyForm, setShowUnverifyForm] = useState(false);
    const [unverifyReason, setUnverifyReason] = useState('');
    const [selectedReasons, setSelectedReasons] = useState([]);
    const [trips, setTrips] = useState([]);
    const { users, setUsers, currentPage, setCurrentPage } = useUserStore();
    const [isLoading, setIsLoading] = useState(users.length === 0);
    const [fetchError, setFetchError] = useState(null);
    const [rowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [totalhistory, setTotalHistory] = useState(0);
    const [driverState, setDriverState] = useState();

    const filterMap = {
        active: { isBlocked: false },
        inactive: { isBlocked: true },
        verified: { isadminVerified: true },
        unverified: { isadminVerified: false },
    };

    const timeoutRef = useRef(null);
    const handleFilterChange = (e) => {
        const value = e.target.value;
        setSelectedFilter(value);

        if (value && filterMap[value]) {
            fetchTrips(1, filterMap[value]); // Apply filter
        } else {
            fetchTrips(1, {}); // Reset filter
        }
    };

    const fetchTrips = async (page = currentPage, filter = {}) => {
        try {
            setIsLoading(true);
            setIsSearching(Object.keys(filter).length > 0);

            const driverStateData = await getdriverState(id)
            if (driverStateData.statusCode === 200 && driverStateData.status === true) {
                setDriverState(driverStateData?.data)
            }
            const response = await getAllUserTripById(id, page, rowsPerPage, filter);
            setUsers(response?.data?.data || []);
            setTotalPages(response?.data?.totalPages || 1);
            setTotalHistory(response?.data?.totalDocuments)
            // If we're searching and got results, stay on page 1
            if (Object.keys(filter).length > 0 && page !== 1) {
                setCurrentPage(1);
            }
        } catch (err) {
            setFetchError("Failed to load user data");
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (!isSearching) {
            fetchTrips(currentPage, {});
        }
    }, [currentPage]);


    // ✅ fetch driver details only once
    const fetchDriver = async () => {
        try {
            setLoading(true);
            const resDriver = await getdriverById(id);

            if (resDriver?.statusCode === 200 && resDriver?.status) {
                setDriver(resDriver.data);
            } else {
                throw new Error(resDriver?.message || 'Failed to fetch driver data');
            }
        } catch (err) {
            showSnackbar(err.message || 'Failed to load driver data', 'error');
        } finally {
            setLoading(false);
        }
    };


    // ✅ fetch driver once when id changes
    useEffect(() => {
        if (id) {
            fetchDriver();
            fetchTrips(1); // load first page
        } else {
            showSnackbar('Driver ID is required', 'error');
            setLoading(false);
        }
    }, [id]);

    // ✅ Dropdown click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isDropdownOpen && !event.target.closest('.relative')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);




    const showSnackbar = (message, type = 'success') => {
        setSnackbar({ visible: true, message, type });
    };

    const hideSnackbar = () => {
        setSnackbar({ ...snackbar, visible: false });
    };

    const handleActionClick = (action) => {
        setActionType(action);
        if (action === 'unverify') {
            setUnverifyReason('');
            setShowUnverifyForm(true);
        } else {
            setShowConfirmation(true);
        }

        setIsDropdownOpen(false);
    };

    const handleConfirmAction = async () => {
        try {
            setIsUpdating(true);

            if (actionType === 'block') {
                setDriver(prev => ({ ...prev, isBlocked: true }));
            } else if (actionType === 'unblock') {
                setDriver(prev => ({ ...prev, isBlocked: false }));
            } else if (actionType === 'delete') {
                setDriver(prev => ({ ...prev, isDeleted: true }));
            }

            // 👇 pass array instead of string
            const Status = await changeStatus(id, actionType, selectedReasons);
            console.log("new driver side clone", actionType)
            if (Status.statusCode === 200 && Status.status === true) {
                fetchDriver()
                showSnackbar(
                    actionType === "verify"
                        ? "Documents verified successfully"
                        : actionType === "unverify"
                            ? "Documents unverified successfully"
                            : actionType === "block"
                                ? "Driver blocked successfully"
                                : actionType === "unblock"
                                    ? "Driver unblocked successfully"
                                    : actionType === "delete"
                                        ? "Driver deleted successfully"
                                        : "Action completed",
                    "success"
                );

            }

        } catch (error) {
            showSnackbar('Failed to update driver status', 'error');
        } finally {
            setIsUpdating(false);
            setShowConfirmation(false);
            setShowUnverifyForm(false);
        }
    };

    const getStatusColor = () => {
        if (driver.isDeleted) return 'text-red-600 bg-red-100';
        if (driver.isBlocked) return 'text-yellow-600 bg-yellow-100';
        return 'text-green-600 bg-green-100';
    };

    const getStatusText = () => {
        if (driver.isDeleted) return 'Deleted';
        if (driver.isBlocked) return 'Inactive';
        return 'Active';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Completed':
                return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>;
            case 'Cancelled':
                return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Cancelled</span>;
            case 'Accepted':
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Accepted</span>;
            case 'Pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
        }
    };

    const getVerificationStatus = (isVerified) => {
        return isVerified ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                <FiCheckCircle className="mr-1" /> Verified
            </span>
        ) : (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center">
                <FiXCircle className="mr-1" /> Pending
            </span>
        );
    };

    const getSafeValue = (value, fallback = 'Not provided') => {
        return value !== null && value !== undefined ? value : fallback;
    };

    const calculateTripStats = () => {
        const completedTrips = trips.filter(trip => trip.status === 'Completed').length;
        const cancelledTrips = trips.filter(trip => trip.status === 'Cancelled').length;
        const totalEarnings = trips
            .filter(trip => trip.status === 'Completed' && trip.fareDetails?.totalFare)
            .reduce((sum, trip) => sum + trip.fareDetails.totalFare, 0);

        return {
            total: trips.length,
            completed: completedTrips,
            cancelled: cancelledTrips,
            totalEarnings: totalEarnings
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!driver) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="mx-auto h-16 w-16 text-red-400 mb-4">
                        <FiXCircle className="w-full h-full" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Driver Not Found</h2>
                    <p className="text-gray-600 mb-6">The driver you're looking for doesn't exist or couldn't be loaded.</p>
                    <button
                        onClick={() => router.back()}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const tripStats = calculateTripStats();

    return (
        <div className="min-h-screen bg-gray-50 p-3">
            <div className="mx-auto">
                {/* Header with Back Button */}
                <div className="flex items-center mb-2">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors mr-4"
                    >
                        <FiArrowLeft className="" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Driver Profile</h1>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Profile Details
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Documents
                            </button>
                            <button
                                onClick={() => setActiveTab('trips')}
                                className={`py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${activeTab === 'trips' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Trip History ({totalhistory})
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'profile' ? (
                            <>
                                {/* Personal Information Card */}
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                                    {/* Driver Image - Rectangle */}
                                    <div className="relative">
                                        <div className="w-24 h-24 bg-indigo-200 rounded-lg flex items-center justify-center text-indigo-600 text-3xl font-bold border-2 border-white shadow-lg">
                                            {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-indigo-100">
                                            <div className={`w-4 h-4 rounded-full ${driver.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        </div>
                                    </div>

                                    {/* Driver Basic Info */}
                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900 mb-1">{getSafeValue(driver.name)}</h1>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                                                        <FiUser className="mr-1 h-3 w-3" />
                                                        ID: {driver._id?.substring(0, 8)}...
                                                    </span>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                                                        {getStatusText()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Performance Stats */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-indigo-700">{driverState?.overallRating || 0}</div>
                                                    <div className="text-xs text-gray-600">Rating</div>
                                                </div>
                                                <div className="h-6 w-px bg-gray-300"></div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-indigo-700">{driverState?.totalTrips || 0}</div>
                                                    <div className="text-xs text-gray-600">Trips</div>
                                                </div>
                                                <div className="h-6 w-px bg-gray-300"></div>
                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-indigo-700">{driverState?.completionPercentage || 0}%</div>
                                                    <div className="text-xs text-gray-600">Completion</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badges */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                <div className={`w-2 h-2 rounded-full mr-2 ${driver.status === 'ONLINE' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                {driver.status || 'OFFLINE'}
                                            </span>

                                            {driver.isadminVerified && (
                                                <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                                    <FaRegFileAlt className="mr-1 h-3 w-3" />
                                                    Documents Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Management Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-md"
                                        >
                                            <FiEdit className="mr-2 h-4 w-4" />
                                            Manage
                                        </button>

                                        {isDropdownOpen && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                <div className="p-2">
                                                    <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                        Account Actions
                                                    </div>

                                                    {!driver.isBlocked && !driver.isDeleted && (
                                                        <button
                                                            onClick={() => handleActionClick('block')}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 rounded-md transition-colors"
                                                        >
                                                            <FiUserX className="mr-2 h-4 w-4" />
                                                            Mark Inactive
                                                        </button>
                                                    )}

                                                    {driver.isBlocked && !driver.isDeleted && (
                                                        <button
                                                            onClick={() => handleActionClick('unblock')}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                                        >
                                                            <FiCheckCircle className="mr-2 h-4 w-4" />
                                                            Mark Active
                                                        </button>
                                                    )}

                                                    {!driver.isDeleted && (
                                                        <button
                                                            onClick={() => handleActionClick('delete')}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                        >
                                                            <FiTrash2 className="mr-2 h-4 w-4" />
                                                            Delete Driver
                                                        </button>
                                                    )}

                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    <button
                                                        onClick={() => handleActionClick('verify')}
                                                        className="flex items-center w-full px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                                                    >
                                                        <FiCheckCircle className="mr-2 h-4 w-4" />
                                                        Verify Account
                                                    </button>

                                                    <button
                                                        onClick={() => handleActionClick('unverify')}
                                                        className="flex items-center w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-md transition-colors group"
                                                    >
                                                        <FiXCircle className="mr-2 h-4 w-4 text-amber-600 group-hover:text-amber-700" />
                                                        Unverify Account
                                                    </button>

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Detailed Information Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                                    {/* Contact Information Card */}
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-gray-800 flex items-center">
                                                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                                    <FiPhone className="text-indigo-600" />
                                                </div>
                                                Contact Information
                                            </h4>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Phone Number */}
                                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone Number</span>
                                                    {getVerificationStatus(driver.isPhoneVerified)}
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-blue-100 rounded-full mr-3">
                                                        <FiPhone className="text-blue-600 h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-lg">{getSafeValue(driver.phone)}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Primary contact number</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email Address */}
                                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email Address</span>
                                                    {getVerificationStatus(driver.isEmailVerified)}
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                                                        <FiMail className="text-purple-600 h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-lg">{getSafeValue(driver.email)}</p>
                                                        <p className="text-xs text-gray-500 mt-1">Primary email address</p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                                                    <button className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full hover:bg-purple-100 transition">
                                                        Send Email
                                                    </button>
                                                    <button className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-100 transition">
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Information Card */}
                                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-semibold text-gray-800 flex items-center">
                                                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                                    <FiCalendar className="text-indigo-600" />
                                                </div>
                                                Account Information
                                            </h4>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Account Dates */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Created Date */}
                                                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                                    <div className="flex items-center mb-3">
                                                        <div className="p-2 bg-green-100 rounded-full mr-3">
                                                            <FiCalendar className="text-green-600 h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500">Account Created</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-900 text-lg">{formatDate(driver.createdAt)}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Member for 2 years</p>
                                                </div>

                                                {/* Updated Date */}
                                                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                                    <div className="flex items-center mb-3">
                                                        <div className="p-2 bg-blue-100 rounded-full mr-3">
                                                            <FiCalendar className="text-blue-600 h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500">Last Updated</span>
                                                    </div>
                                                    <p className="font-semibold text-gray-900 text-lg">{formatDate(driver.updatedAt)}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Recently active</p>
                                                </div>
                                            </div>

                                            {/* Location Information */}
                                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center">
                                                        <div className="p-2 bg-orange-100 rounded-full mr-3">
                                                            <FiGlobe className="text-orange-600 h-4 w-4" />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500">Location & Region</span>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <p className="font-semibold text-gray-900 text-lg">{getSafeValue(driver.country)}</p>
                                                    <p className="text-xs text-gray-500">Registered country</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Currency</p>
                                                        <p className="font-medium text-gray-900 text-sm">{getSafeValue(driver.currency)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Language</p>
                                                        <p className="font-medium text-gray-900 text-sm">English</p>
                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                    </div>
                                </div>

                                {/* Driver Stats Overview */}
                                <div className="border-t border-gray-100 pt-6 mt-6">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                        <FiTruck className="mr-2 text-indigo-600" /> Trip Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                                    <FiTrendingUp className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-indigo-700">Total Trips</p>
                                                    <p className="text-xl font-bold text-indigo-900">{driverState?.totalTrips || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-green-100 rounded-lg mr-3">
                                                    <FiCheckCircle className="text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-green-700">Completed</p>
                                                    <p className="text-xl font-bold text-green-900">{driverState?.completedTrips || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-red-100 rounded-lg mr-3">
                                                    <FiXCircle className="text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-red-700">Cancelled</p>
                                                    <p className="text-xl font-bold text-red-900">{driverState?.cancelledTrips}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                            <div className="flex items-center">
                                                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                                    <FiDollarSign className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-purple-700">Total Earnings</p>
                                                    <p className="text-xl font-bold text-purple-900">{driverState?.totalEarn}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Driver Rating Overview */}
                                <div className="mb-6 border-t border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center mt-4 mb-4">
                                        <FiStar className="mr-2 text-amber-500" /> Driver Rating & Performance
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Overall Rating */}
                                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                            {/* Overall Rating */}
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm text-amber-700">Overall Rating</p>
                                                <div className="flex items-center">
                                                    <FiStar className="text-amber-400 mr-1" />
                                                    <span className="font-semibold text-amber-900">
                                                        {driverState?.overallRating ?? 0}
                                                    </span>
                                                    <span className="text-xs text-amber-600 ml-1">/5.0</span>
                                                </div>
                                            </div>

                                            {/* Overall Progress */}
                                            <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-amber-500 h-2 rounded-full"
                                                    style={{
                                                        width: `${((driverState?.overallRating ?? 0) / 5) * 100}%`,
                                                    }}
                                                ></div>
                                            </div>

                                            <p className="text-xs text-amber-600 mb-3">
                                                Based on {driverState?.totalTrips ?? 0} trips
                                            </p>

                                            {/* Rating Breakdown (Counts only, color-coded) */}
                                            <div className="grid grid-cols-5 gap-2 text-center">
                                                {[5, 4, 3, 2, 1].map((star) => {
                                                    const count = driverState?.ratingBreakdown?.[`star${star}`] ?? 0;

                                                    const colors = {
                                                        5: "text-green-600",
                                                        4: "text-emerald-600",
                                                        3: "text-blue-600",
                                                        2: "text-orange-600",
                                                        1: "text-red-600",
                                                    };

                                                    return (
                                                        <div key={star} className="flex flex-col items-center">
                                                            <span className={`text-xs font-semibold ${colors[star]}`}>
                                                                {star}★
                                                            </span>
                                                            <span className={`text-sm font-bold ${colors[star]}`}>
                                                                {count}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Rating Breakdown (percent bars) */}
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <p className="text-sm text-gray-700 mb-3">Rating Breakdown</p>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">5 Stars</span>
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.floor(driverState?.ratingBreakdownPercent?.star5)}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-800">{Math.floor(driverState?.ratingBreakdownPercent?.star5)}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">4 Stars</span>
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.floor(driverState?.ratingBreakdownPercent?.star4)}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-800">{Math.floor(driverState?.ratingBreakdownPercent?.star4)}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">3 Stars</span>
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                            <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${Math.floor(driverState?.ratingBreakdownPercent?.star3)}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-800">{Math.floor(driverState?.ratingBreakdownPercent?.star3)}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">2 Stars</span>
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.floor(driverState?.ratingBreakdownPercent?.star2)}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-800">{Math.floor(driverState?.ratingBreakdownPercent?.star2)}%</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-600">1 Stars</span>
                                                    <div className="flex items-center">
                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                                                            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.floor(driverState?.ratingBreakdownPercent?.star1)}%` }}></div>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-800">{Math.floor(driverState?.ratingBreakdownPercent?.star1)}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Reviews + Financial side-by-side */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        {/* Recent Reviews (dynamic, 2 most recent with see more) */}
                                        <RecentReviewsCard driverState={driverState} />

                                        {/* Financial Information (unchanged content) */}
                                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                                <FiDollarSign className="mr-2 text-indigo-600" /> Financial Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                                    <p className="text-sm text-indigo-700 mb-1">Wallet Balance</p>
                                                    <p className="text-2xl font-bold text-indigo-900">{getSafeValue(driver.Wallet, 0)}</p>
                                                </div>
                                                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                                    <p className="text-sm text-amber-700 mb-1">Daily Wallet</p>
                                                    <p className="text-2xl font-bold text-amber-900">{getSafeValue(driver.DailyWallet, 0)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Trip History / Table */}
                                {/* (unchanged below) */}
                            </>
                        ) : activeTab === 'trips' ? (
                            /* Trip History Content */
                            <div className='mt-4'>
                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-gray-600 font-medium">S.No.</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Date</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Time</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">CustomerName</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">CustomerPhone</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">PickUp</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Drop</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">TotalFare</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">DriverFare</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">RideType</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">BookingType</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">CancelBy</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">PaymentType</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">ReviewComment</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Review</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-700">
                                            {users.length > 0 ? (
                                                users.map((trip, index) => (

                                                    <tr key={trip._id}>
                                                        <td className="px-4 py-3">
                                                            {isSearching
                                                                ? index + 1
                                                                : (currentPage - 1) * rowsPerPage + index + 1
                                                            }
                                                        </td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">{new Date(trip?.travelDate).toISOString().split("T")[0] || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                            {trip?.travelTime
                                                                ? (([h, m]) => `${(h % 12 || 12)}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`)(
                                                                    trip.travelTime.split(":").slice(0, 2).map(Number)
                                                                )
                                                                : "N/A"}
                                                        </td>


                                                        <td className="px-4 py-3">{trip?.name || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.phone}</td>
                                                        <td className="px-4 py-3">{trip?.pickupLocation?.address || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.dropLocation?.address || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.fareDetails?.totalFare || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.fareDetails?.driverGets || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.rideType || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.bookingType || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.cancelby || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.payment?.method || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.driverreview?.comment || 'N/A'}</td>
                                                        <td className="px-4 py-3">
                                                            {trip?.driverreview
                                                                ? (
                                                                    (trip.driverreview.driverBehavior +
                                                                        trip.driverreview.drivingSkill +
                                                                        trip.driverreview.security +
                                                                        trip.driverreview.hygiene) / 4
                                                                ).toFixed(1)
                                                                : "N/A"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {getStatusBadge(trip?.status)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                                                        No trips found for this user
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination - Only show if multiple pages exist */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center mt-6 gap-2">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => {
                                                setCurrentPage(currentPage - 1);
                                                fetchTrips(currentPage - 1);
                                            }}
                                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                        >
                                            Prev
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => {
                                                setCurrentPage(currentPage + 1);
                                                fetchTrips(currentPage + 1);
                                            }}
                                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                            : (
                                /* Documents Content */
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-gray-800">Driver Documents</h2>
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-md"
                                            >
                                                <FiEdit className="mr-2 h-4 w-4" />
                                                Manage
                                            </button>

                                            {isDropdownOpen && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                                    <div className="p-2">
                                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                                            Account Actions
                                                        </div>
                                                        <div className="border-t border-gray-100 my-1"></div>

                                                        <button
                                                            onClick={() => handleActionClick("verify")}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
                                                        >
                                                            <FiCheckCircle className="mr-2 h-4 w-4" />
                                                            Verify Account
                                                        </button>

                                                        <button
                                                            onClick={() => handleActionClick("unverify")}
                                                            className="flex items-center w-full px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-md transition-colors group"
                                                        >
                                                            <FiXCircle className="mr-2 h-4 w-4 text-amber-600 group-hover:text-amber-700" />
                                                            Unverify Account
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Driving License */}
                                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                                <FiFileText className="mr-2 text-indigo-600" /> Driving License
                                            </h3>

                                            {driver.drivinglicense ? (
                                                <div className="space-y-4">
                                                    {/* License Preview */}
                                                    <div className="border rounded-lg overflow-hidden">
                                                        <div className="relative h-48 bg-gray-100">
                                                            <Image
                                                                src={driver?.drivinglicense || "https://t4.ftcdn.net/jpg/06/16/17/77/360_F_616177772_bEXNr996NEmDliBSma3dRNloodTYR3cN.jpg"}
                                                                alt="Driving License"
                                                                fill
                                                                className="object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.src = "https://t4.ftcdn.net/jpg/06/16/17/77/360_F_616177772_bEXNr996NEmDliBSma3dRNloodTYR3cN.jpg";
                                                                }}
                                                            />
                                                        </div>
                                                    </div>




                                                    {/* Status & View Button */}
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm text-gray-500 mb-1">License Upload</p>
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-medium ${driver.isaddlicense
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-red-100 text-red-700"
                                                                    }`}
                                                            >
                                                                {driver.isaddlicense ? "Uploaded" : "Not Uploaded"}
                                                            </span>
                                                        </div>

                                                        {driver.isaddlicense && (
                                                            <button
                                                                onClick={() => setIsOpen(true)}
                                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                                            >
                                                                <FiMaximize className="w-4 h-4" />
                                                                View Full Size
                                                            </button>
                                                        )}
                                                    </div>

                                                </div>
                                            ) : (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                    <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                                    <p className="text-gray-500">No driving license uploaded</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Modal for Full Image */}
                                        {isOpen && (
                                            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                                                <div className="relative">
                                                    {/* Close button */}
                                                    <button
                                                        onClick={() => setIsOpen(false)}
                                                        className="absolute top-2 right-2 text-white text-2xl"
                                                    >
                                                        ✕
                                                    </button>

                                                    {/* Only Image */}
                                                    <img
                                                        src={`${IMAGE_URL}${driver.drivinglicense}`}
                                                        alt="Driving License"
                                                        className="max-h-[90vh] max-w-[90vw] object-contain"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Bank Account Information */}
                                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                                <FaBuilding className="mr-2 text-indigo-600" /> Bank Account Details
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Beneficiary Name</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.bankDetails?.BeneficiaryName)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Account Number</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.bankDetails?.bankAccount)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.bankDetails?.bankName)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Account Type</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.bankDetails?.AccountType)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Branch</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.bankDetails?.branch)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">IFSC Code</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.bankDetails?.Code)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Bank Account Added</p>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${driver.isaddlicense
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {driver.isaddbank ? "Details Available" : "Not Provided"}
                                                        </span>
                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                        {/* Vehicle Information */}
                                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                                <FaCar className="mr-2 text-indigo-600" /> Vehicle Information
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Vehicle Type</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalType)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Electric Vehicle</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.electric)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Brand</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.brand)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Model</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.model)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Year</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.year)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Color</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.color)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Plate Number</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.plateNumber)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Seating Capacity</p>
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(driver.VehicalDetails?.seatingCapacity)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm text-gray-500 mb-1">Vehicle Details Added</p>
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${driver.isaddlicense
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {driver.isaddlicense ? "Details Available" : "Not Provided"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Vehicle Documents */}
                                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                                <FaCar className="mr-2 text-indigo-600" /> Vehicle Documents
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    {/* <div className="bg-gray-50 p-4 rounded-lg text-center">
                                                        <FiFileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600">RC Document</p>
                                                        <button className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                                            View Document
                                                        </button>
                                                    </div> */}
                                                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                                                        <FiFileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600">Insurance</p>
                                                        <button className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                                            View Document
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                                            <FiAward className="mr-2 text-indigo-600" /> Verification Status
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                                                <div className="mb-2 p-2 rounded-full bg-indigo-100 text-indigo-600">
                                                    <FiUser className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm text-gray-500 mb-1">Profile</span>
                                                {getVerificationStatus(driver.isEmailVerified && driver.isPhoneVerified)}
                                            </div>

                                            <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                                                <div className="mb-2 p-2 rounded-full bg-indigo-100 text-indigo-600">
                                                    <FaCar className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm text-gray-500 mb-1">Vehicle</span>
                                                {getVerificationStatus(driver.isvehicleVerified)}
                                            </div>

                                            <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                                                <div className="mb-2 p-2 rounded-full bg-indigo-100 text-indigo-600">
                                                    <FiFileText className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm text-gray-500 mb-1">License</span>
                                                {getVerificationStatus(driver.islicenseVerified)}
                                            </div>

                                            <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
                                                <div className="mb-2 p-2 rounded-full bg-indigo-100 text-indigo-600">
                                                    <FaBuilding className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm text-gray-500 mb-1">Bank</span>
                                                {getVerificationStatus(driver.isbankVerified)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>

            {/* Show UnVerifie Popup */}
            {showUnverifyForm && (
                <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-white">
                            <div className="flex items-center">
                                <div className="p-3 bg-white/20 rounded-xl mr-4">
                                    <FiXCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Unverify Account</h3>
                                    <p className="text-amber-100 text-sm mt-1">
                                        Please provide a reason for unverification
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="px-5 py-4">
                            <div className="space-y-3">
                                {/* Reason buttons */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Reason(s)
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { value: "Vehicle", label: "Wrong Vehicle Details" },
                                            { value: "License", label: "Wrong Driver License" },
                                            { value: "Bank", label: "Wrong Bank Details" },
                                            { value: "Insurance", label: "Wrong Insurance Details" },
                                        ].map((reason) => {
                                            const isSelected = selectedReasons.includes(reason.value);
                                            return (
                                                <button
                                                    key={reason.value}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedReasons(
                                                                selectedReasons.filter((r) => r !== reason.value)
                                                            );
                                                        } else {
                                                            setSelectedReasons([...selectedReasons, reason.value]);
                                                        }
                                                    }}
                                                    className={`p-2.5 text-left rounded-lg border text-sm transition-all ${isSelected
                                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                                        : "border-gray-200 hover:border-amber-300 hover:bg-amber-50"
                                                        }`}
                                                >
                                                    <div className="flex items-center">
                                                        <div
                                                            className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 ${isSelected
                                                                ? "border-amber-500 bg-amber-500 text-white"
                                                                : "border-gray-300"
                                                                }`}
                                                        >
                                                            {isSelected && <FiCheckCircle className="h-3 w-3" />}
                                                        </div>
                                                        {reason.label}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                </div>


                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="bg-gray-50 px-5 py-3 flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setSelectedReasons([]);   // ✅ clear selections
                                    setUnverifyReason("");    // clear notes
                                    setShowUnverifyForm(false); // close popup
                                }}
                                className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={() => {
                                    if (!selectedReasons.length) {
                                        showSnackbar("Please select at least one reason", "error");
                                        return;
                                    }

                                    // 👉 pass array of reasons + notes
                                    handleConfirmAction({
                                        reasons: selectedReasons,
                                        notes: unverifyReason,
                                    });

                                    setSelectedReasons([]);   // ✅ clear selections after confirm
                                    setUnverifyReason("");    // clear notes
                                    setShowUnverifyForm(false); // close popup
                                }}
                                disabled={!selectedReasons.length}
                                className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-amber-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Confirmation Popup */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-95 hover:scale-100">
                        <div className={`p-6 text-white ${actionType === 'delete' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            actionType === 'block' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}>
                            <div className="flex items-start">
                                <div className="p-3 bg-white/20 rounded-xl mr-4 flex-shrink-0">
                                    {actionType === 'delete' ? <FiTrash2 className="h-7 w-7" /> :
                                        actionType === 'block' ? <FiUserX className="h-7 w-7" /> :
                                            <FiCheckCircle className="h-7 w-7" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold mb-2">
                                        {actionType === 'delete' ? 'Delete Account' :
                                            actionType === 'block' ? 'Mark as Inactive' :
                                                'Mark as Active'}
                                    </h3>
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        {actionType === 'delete' ? 'This action cannot be undone. All driver data will be permanently removed from our systems.' :
                                            actionType === 'block' ? 'Driver will be temporarily suspended and won\'t be able to access their account or receive trips.' :
                                                'Driver account will be fully restored with all previous access and functionality.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 max-h-60 overflow-y-auto">
                            <div className="space-y-4">
                                <p className="text-gray-700 leading-relaxed">
                                    {actionType === 'delete' && 'Permanently deleting this account will remove all driver information, trip history, and associated data. This action is irreversible.'}
                                    {actionType === 'block' && 'Temporarily blocking this account will prevent the driver from logging in, accepting trips, or accessing any platform features.'}
                                    {actionType === 'unblock' && 'Reactivating this account will restore the driver\'s ability to login, accept trips, and use all platform features immediately.'}
                                </p>

                                {actionType === 'delete' && (
                                    <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 backdrop-blur-sm">
                                        <div className="flex items-start">
                                            <FiAlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="text-sm font-semibold text-red-800 block mb-1">Critical Warning</span>
                                                <span className="text-sm text-red-700">This action is permanent and cannot be reversed. All driver data will be completely erased from our database.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {actionType === 'block' && (
                                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 backdrop-blur-sm">
                                        <div className="flex items-start">
                                            <FiAlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="text-sm font-semibold text-amber-800 block mb-1">Temporary Action</span>
                                                <span className="text-sm text-amber-700">This is a reversible action. The driver can be reactivated at any time from the admin panel.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50/80 backdrop-blur-sm px-6 py-5 flex justify-end space-x-4 border-t border-gray-200/50">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100/80 transition-all duration-200 font-medium hover:shadow-sm disabled:opacity-50"
                                disabled={isUpdating}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className={`px-5 py-2.5 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                                    actionType === 'block' ? 'bg-amber-600 hover:bg-amber-700' :
                                        'bg-green-600 hover:bg-green-700'
                                    }`}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        {actionType === 'delete' ? <FiTrash2 className="mr-2 h-4 w-4" /> :
                                            actionType === 'block' ? <FiUserX className="mr-2 h-4 w-4" /> :
                                                <FiCheckCircle className="mr-2 h-4 w-4" />}
                                        {actionType === 'delete' ? 'Delete Permanently' :
                                            actionType === 'block' ? 'Confirm Inactive' :
                                                'Confirm Active'}
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Snackbar for notifications */}
            <Snackbar
                visible={snackbar.visible}
                message={snackbar.message}
                type={snackbar.type}
                onClose={hideSnackbar}
                position="bottom-right"
            />
        </div>
    );
}
