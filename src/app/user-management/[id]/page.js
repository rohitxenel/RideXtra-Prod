'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAllUserById, getAllUserTripById, getUserTripState, ChangeUserStatus } from '@/services/userManagementService';
import {
    FiArrowLeft,
    FiMapPin,
    FiPhone,
    FiMail,
    FiDollarSign,
    FiCreditCard,
    FiShield,
    FiUser,
    FiCalendar,
    FiGlobe,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiNavigation,
    FiTruck,
    FiCreditCard as FiCard,
    FiDollarSign as FiCash,
    FiAlertCircle,
    FiMap,
    FiTrendingUp,
    FiLock,
    FiEye,
    FiX
} from 'react-icons/fi';
import Snackbar from '@/components/layout/Snackbar';
import Link from 'next/link';
import { useUserStore } from '@/store/userStore'; // Assuming you have a user store

export default function UserProfilePage() {
    const { id } = useParams();
    const router = useRouter();

    const { users, setUsers, currentPage, setCurrentPage } = useUserStore();
    const [isLoading, setIsLoading] = useState(users.length === 0);
    const [fetchError, setFetchError] = useState(null);
    const [rowsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [inputValue, setInputValue] = useState(""); // Store raw input without +
    const [selectedCountry, setSelectedCountry] = useState("us");
    const [user, setUser] = useState(null);
    const [TripState, setUserTripState] = useState(null);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'trips'
    const [snackbar, setSnackbar] = useState({
        visible: false,
        message: '',
        type: 'success'
    });
    const [status, setStatus] = useState("active");
    const [showPopup, setShowPopup] = useState(false);
    const [pendingStatus, setPendingStatus] = useState(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            const resUser = await getAllUserById(id);
            const TripState = await getUserTripState(id);
            console.log("tripState", TripState);

            if (resUser?.statusCode === 200 && resUser?.status) {
                setUser(resUser?.data);
                setStatus(resUser?.data.isBlocked ? "inactive" : "active");
                setUserTripState(TripState?.data);

                // fetch trips
                await fetchUserTrips();
            } else {
                throw new Error(resUser?.message || 'Failed to fetch user data');
            }
        } catch (err) {
            console.error('Failed to fetch user:', err);
            showSnackbar(err.message || 'Failed to load user data', 'error');
        } finally {
            setLoading(false);
        }
    };


    // now use it inside useEffect
    useEffect(() => {
        if (id) {
            fetchUser();
        } else {
            showSnackbar('User ID is required', 'error');
            setLoading(false);
        }
    }, [id]);
    const fetchUserTrips = async (page = 1) => {
        try {
            setIsLoading(true);
            const response = await getAllUserTripById(id, page, rowsPerPage);

            if (response?.statusCode === 200 && response?.status) {
                console.log("totaltrips", response?.data?.totalDocuments)
                setTrips(response?.data?.data || []);
                setTotalPages(response?.data?.totalPages || 1);
            } else {
                throw new Error(response?.message || 'Failed to fetch user trips');
            }
        } catch (err) {
            console.error("Failed to fetch user trips:", err);
            setFetchError("Failed to load user trip data");
            showSnackbar(err.message || 'Failed to load trip data', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setPendingStatus(newStatus);
        setShowPopup(true);
    };

    // confirm API call
    const confirmChange = async () => {
        if (!pendingStatus) return;
        setLoading(true);
        try {
            const Data = await ChangeUserStatus(id, pendingStatus);
            setStatus(pendingStatus);
            console.log("Status updated successfully:", Data);
            fetchUser(); // reload data
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setLoading(false);
            setShowPopup(false);
            setPendingStatus(null);
        }
    };

    const cancelChange = () => {
        setShowPopup(false);
        setPendingStatus(null);
    };
    const showSnackbar = (message, type = 'success') => {
        setSnackbar({ visible: true, message, type });
    };

    const hideSnackbar = () => {
        setSnackbar({ ...snackbar, visible: false });
    };

    // Handle refresh for clearing search
    const handleRefresh = () => {
        setInputValue("");
        setSelectedCountry("us");
        setIsSearching(false);
        fetchUserTrips(1);
    };

    // Format date for better readability
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

    // Format time for better readability
    const formatTime = (timeString) => {
        if (!timeString) return '';

        try {
            // Handle both "06:45 PM" format and ISO time format
            if (timeString.includes('PM') || timeString.includes('AM')) {
                return timeString;
            }

            // If it's in ISO format, extract the time part
            const timeParts = timeString.split('T')[1]?.split(':');
            if (timeParts) {
                let hours = parseInt(timeParts[0]);
                const minutes = timeParts[1];
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                return `${hours}:${minutes} ${ampm}`;
            }

            return timeString;
        } catch (error) {
            return timeString;
        }
    };

    // Get status badge with appropriate colors
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

    // Get payment method icon
    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'CASH':
                return <FiCash className="text-green-500" />;
            case 'CARD':
                return <FiCard className="text-blue-500" />;
            case 'PAYPAL':
                return <FiDollarSign className="text-blue-400" />;
            default:
                return <FiCreditCard className="text-gray-500" />;
        }
    };

    // Get vehicle type icon
    const getVehicleIcon = (type) => {
        switch (type) {
            case 'Bike':
                return <FiNavigation className="text-indigo-500" />;
            case 'Sedan':
            case 'SUV':
            case 'Hatchback':
                return <FiTruck className="text-indigo-500" />;
            default:
                return <FiTruck className="text-gray-500" />;
        }
    };

    // Safely get nested properties
    const getSafeValue = (value, fallback = 'Not provided') => {
        return value !== null && value !== undefined ? value : fallback;
    };

    // Calculate trip statistics
    const calculateTripStats = () => {
        const completedTrips = trips.filter(trip => trip.status === 'Completed').length;
        const cancelledTrips = trips.filter(trip => trip.status === 'Cancelled').length;
        const totalSpent = trips
            .filter(trip => trip.status === 'Completed' && trip.fareDetails?.totalFare)
            .reduce((sum, trip) => sum + trip.fareDetails.totalFare, 0);

        return {
            total: trips.length,
            completed: completedTrips,
            cancelled: cancelledTrips,
            totalSpent: totalSpent
        };
    };

    const tripStats = calculateTripStats();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="mx-auto h-16 w-16 text-red-400 mb-4">
                        <FiXCircle className="w-full h-full" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
                    <p className="text-gray-600 mb-6">The user you're looking for doesn't exist or couldn't be loaded.</p>
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

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="mx-auto">
                {/* Header with Back Button */}
                <div className="flex items-center mb-2">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-600 hover:text-gray-800 font-medium transition-colors mr-4"
                    >
                        <FiArrowLeft className="" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">User Profile</h1>
                </div>

                {/* Tabs for Profile and Trip History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="border-b border-gray-200 flex items-center">
                        {/* Tabs */}
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Profile Details
                            </button>
                            <button
                                onClick={() => setActiveTab('trips')}
                                className={`py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${activeTab === 'trips' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Trip History ({TripState?.totalRides})
                            </button>
                        </nav>
                    </div>

                    <>
                        {activeTab === 'profile' ? (
                            <div className='p-4'>
                                {/* User Stats Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                                <FiTrendingUp className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-indigo-700">Total Trips</p>
                                                <p className="text-xl font-bold text-indigo-900">{TripState.totalRides}</p>
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
                                                <p className="text-xl font-bold text-green-900">{TripState.completedRides}</p>
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
                                                <p className="text-xl font-bold text-red-900">{TripState.cancelledRides}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                                <FiDollarSign className="text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-purple-700">Total Spent</p>
                                                <p className="text-xl font-bold text-purple-900">{TripState.totalSpent}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile details */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* Personal Information */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm relative">
                                        {/* Header with Title + Status Dropdown */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiUser className="mr-2 text-indigo-600" /> Personal Information
                                            </h3>

                                            {/* Right Corner: Dropdown or Deleted Status */}
                                            {user.isDeleted ? (
                                                <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-md">
                                                    Account deleted by user
                                                </span>
                                            ) : (
                                                <select
                                                    disabled={loading}
                                                    className={`px-3 py-1 text-sm font-medium rounded-md border cursor-pointer ${status === "inactive"
                                                        ? "bg-red-100 text-red-700 border-red-300"
                                                        : "bg-green-100 text-green-700 border-green-300"
                                                        }`}
                                                    value={status}
                                                    onChange={handleStatusChange}
                                                >
                                                    <option value="active" className="text-green-700">
                                                        Active
                                                    </option>
                                                    <option value="inactive" className="text-red-700">
                                                        Inactive
                                                    </option>
                                                </select>
                                            )}
                                            {/* Confirmation Popup */}
                                            {showPopup && (
                                                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                                                    <div className="bg-white rounded-lg shadow-lg p-6 w-96 relative">
                                                        {/* Close Button */}
                                                        <button
                                                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                                                            onClick={cancelChange}
                                                        >
                                                            <FiX size={20} />
                                                        </button>

                                                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                                                            Confirm Status Change
                                                        </h2>
                                                        <p className="text-sm text-gray-600 mb-6">
                                                            Are you sure you want to set this account as{" "}
                                                            <span
                                                                className={`font-semibold ${pendingStatus === "inactive" ? "text-red-600" : "text-green-600"
                                                                    }`}
                                                            >
                                                                {pendingStatus}
                                                            </span>
                                                            ?
                                                        </p>

                                                        <div className="flex justify-end space-x-3">
                                                            <button
                                                                onClick={cancelChange}
                                                                className="px-4 py-2 text-sm rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={confirmChange}
                                                                disabled={loading}
                                                                className={`px-4 py-2 text-sm rounded-md text-white ${pendingStatus === "inactive"
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                                    }`}
                                                            >
                                                                {loading ? "Saving..." : "Confirm"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* --- User Info Content --- */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                                    <p className="font-medium text-gray-900">{getSafeValue(user.name)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">User ID</p>
                                                    <p className="font-medium text-gray-900 text-sm">
                                                        {getSafeValue(user._id, "N/A")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 pt-4">
                                                <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiMail className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(user.email)}
                                                        </p>
                                                    </div>
                                                    {user.isEmailVerified ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                                            <FiCheckCircle className="mr-1" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                                                            <FiXCircle className="mr-1" /> Unverified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiPhone className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900">
                                                            {getSafeValue(user.phone)}
                                                        </p>
                                                    </div>
                                                    {user.isPhoneVerified ? (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                                                            <FiCheckCircle className="mr-1" /> Verified
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center">
                                                            <FiXCircle className="mr-1" /> Unverified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Account Created</p>
                                                    <div className="flex items-center">
                                                        <FiCalendar className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {formatDate(user.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                                                    <div className="flex items-center">
                                                        <FiCalendar className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {formatDate(user.updatedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location & Preferences */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiMapPin className="mr-2 text-indigo-600" /> Location & Preferences
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Country</p>
                                                    <div className="flex items-center">
                                                        <FiGlobe className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900">{getSafeValue(user.country)}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Currency</p>
                                                    <div className="flex items-center">
                                                        <FiDollarSign className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900">{getSafeValue(user.currency)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">Location Coordinates</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FiMap className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {user.location?.coordinates ?
                                                                `${user.location.coordinates[0]}, ${user.location.coordinates[1]}` :
                                                                'Not set'
                                                            }
                                                        </p>
                                                    </div>
                                                    {/* <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                                        View Map
                                                    </button> */}
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-4">
                                                <p className="text-sm text-gray-500 mb-1">Preferred Payment Method</p>
                                                <div className="flex items-center">
                                                    <FiCreditCard className="mr-2 text-gray-400" />
                                                    <p className="font-medium text-gray-900">{getSafeValue(user.paymentmode)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Financial Information */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiDollarSign className="mr-2 text-indigo-600" /> Financial Information
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                                <p className="text-sm text-indigo-700 mb-1">Wallet Balance</p>
                                                <p className="text-2xl font-bold text-indigo-900">{getSafeValue(user.WalletBalance, 0)}</p>
                                            </div>
                                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                                <p className="text-sm text-amber-700 mb-1">Due Payments</p>
                                                <p className="text-2xl font-bold text-amber-900">{getSafeValue(user.duePay, 0)}</p>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                                <p className="text-sm text-purple-700 mb-1">Xtra Coins</p>
                                                <p className="text-2xl font-bold text-purple-900">{getSafeValue(user.xtracoin, 0)}</p>
                                            </div>
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                <p className="text-sm text-gray-700 mb-1">Avg. Trip Cost</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {(TripState?.avgTripCost).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Status */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiShield className="mr-2 text-indigo-600" /> Account Status
                                            </h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col p-3 bg-white rounded-lg border border-gray-200">
                                                <span className="text-sm text-gray-500 mb-1">Account Status</span>
                                                {user.isBlocked ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full self-start flex items-center">
                                                        <FiLock className="mr-1" /> Blocked
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full self-start flex items-center">
                                                        <FiCheckCircle className="mr-1" /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col p-3 bg-white rounded-lg border border-gray-200">
                                                <span className="text-sm text-gray-500 mb-1">Deletion Status</span>
                                                {user.isDeleted ? (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full self-start flex items-center">
                                                        <FiXCircle className="mr-1" /> Deleted
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full self-start flex items-center">
                                                        <FiCheckCircle className="mr-1" /> Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col p-3 bg-white rounded-lg border border-gray-200">
                                                <span className="text-sm text-gray-500 mb-1">Email Verification</span>
                                                {user.isEmailVerified ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full self-start flex items-center">
                                                        <FiCheckCircle className="mr-1" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full self-start flex items-center">
                                                        <FiXCircle className="mr-1" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col p-3 bg-white rounded-lg border border-gray-200">
                                                <span className="text-sm text-gray-500 mb-1">Phone Verification</span>
                                                {user.isPhoneVerified ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full self-start flex items-center">
                                                        <FiCheckCircle className="mr-1" /> Verified
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full self-start flex items-center">
                                                        <FiXCircle className="mr-1" /> Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
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
                                                <th className="px-4 py-3 text-gray-600 font-medium">DriverName</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">DriverPhone</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">PickUp</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Drop</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">TotalFare</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">PaymentType</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Cancel By</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">RideType</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">BookingType</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">ReviewComment</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Review</th>
                                                <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-gray-700">
                                            {trips.length > 0 ? (
                                                trips.map((trip, index) => (

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


                                                        <td className="px-4 py-3">{trip?.driverId?.name || 'N/A'}</td>
                                                        <td className="px-4 py-3">+{trip?.driverId?.phone}</td>
                                                        <td className="px-4 py-3">{trip?.pickupLocation?.address || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.dropLocation?.address || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.fareDetails?.totalFare || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.payment?.method || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.cancelby || 'N/A'}</td>

                                                        <td className="px-4 py-3">{trip?.rideType || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.bookingType || 'N/A'}</td>
                                                        <td className="px-4 py-3">{trip?.userreview?.comment || 'N/A'}</td>
                                                        <td className="px-4 py-3">
                                                            {trip?.userreview
                                                                ? (
                                                                    (trip.userreview.driverBehavior +
                                                                        trip.userreview.drivingSkill +
                                                                        trip.userreview.security +
                                                                        trip.userreview.hygiene) / 4
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
                                                fetchUserTrips(currentPage - 1);
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
                                                fetchUserTrips(currentPage + 1);
                                            }}
                                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                </div>
            </div>

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