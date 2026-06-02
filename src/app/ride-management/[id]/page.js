'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAllRide, getrideById } from '@/services/rideManagementService ';
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
    FiCopy,
    FiStar,
    FiHash
    
} from 'react-icons/fi';
import Snackbar from '@/components/layout/Snackbar';
import { MdOutlineDirectionsCar } from "react-icons/md";
export default function UserProfilePage() {
    const { id } = useParams();
    const router = useRouter();

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'trips'
    const [snackbar, setSnackbar] = useState({
        visible: false,
        message: '',
        type: 'success'
    });
    const [copied, setCopied] = useState("");
    const [showFullUserComment, setShowFullUserComment] = useState(false);
    const [showFullDriverComment, setShowFullDriverComment] = useState(false);

    const renderComment = (comment, showFull, setShowFull) => {
        if (!comment) return "—";
        const isLong = comment.length > 100; // Adjust the length threshold
        if (!isLong) return comment;

        return (
            <>
                {showFull ? comment : `${comment.slice(0, 100)}...`}
                <button
                    onClick={() => setShowFull(!showFull)}
                    className="ml-2 text-indigo-600 text-sm"
                >
                    {showFull ? "See Less" : "See More"}
                </button>
            </>
        );
    };
    const StarRating = ({ value = 0, max = 5 }) => {
        return (
            <div className="flex">
                {[...Array(max)].map((_, i) => (
                    <FiStar
                        key={i}
                        className={`w-4 h-4 ${i < value ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };


    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(""), 1500); // reset after 1.5s
    };
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);


                // fetch trips
                const resTrips = await getrideById(id);
                if (resTrips?.statusCode === 200 && resTrips?.status) {
                    // Check if data is nested in a data property
                    console.log()
                    const tripsData = resTrips.data.data || resTrips.data;
                    setTrips(tripsData);
                } else {
                    setTrips([]); // fallback
                }

            } catch (err) {
                console.error('Failed to fetch user:', err);
                showSnackbar(err.message || 'Failed to load user data', 'error');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUser();
        } else {
            showSnackbar('User ID is required', 'error');
            setLoading(false);
        }
    }, [id]);

    const showSnackbar = (message, type = 'success') => {
        setSnackbar({ visible: true, message, type });
    };

    const hideSnackbar = () => {
        setSnackbar({ ...snackbar, visible: false });
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



    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!trips) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="mx-auto h-16 w-16 text-red-400 mb-4">
                        <FiXCircle className="w-full h-full" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Trip Not Found</h2>
                    <p className="text-gray-600 mb-6">The Trip you're looking for doesn't exist or couldn't be loaded.</p>
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
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Tabs for Profile and Trip History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="border-b border-gray-200 flex items-center">
                        {/* Back button */}
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-500 hover:text-gray-700 font-medium py-4 px-6 transition-colors border-b-2 border-transparent"
                        >
                            <FiArrowLeft className="mr-1" /> Back
                        </button>

                        {/* Tabs */}
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                            >
                                Trip Details
                            </button>

                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'profile' ? (
                            <>
                                {/* User Stats Overview */}
                                {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                                                <FiTrendingUp className="text-indigo-600" />
                                            </div>
                                            
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                                <FiCheckCircle className="text-green-600" />
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
                                                <p className="text-xl font-bold text-red-900">{tripStats.cancelled}</p>
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
                                                <p className="text-xl font-bold text-purple-900">₹{tripStats.totalSpent}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div> */}

                                {/* Trip details */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* Driver Information */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiUser className="mr-2 text-indigo-600" /> Driver Information
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                                    <p className="font-medium text-gray-900">{getSafeValue(trips?.driverId?.name)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">DriverId</p>
                                                    <p className="font-medium text-gray-900 text-sm">{getSafeValue(trips?.driverId?._id, 'N/A')}</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-4">
                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Email */}
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                                        <div className="flex items-center">
                                                            <FiMail className="mr-2 text-gray-400 flex-shrink-0" />
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {getSafeValue(trips?.driverId?.email)}
                                                            </p>
                                                            <button
                                                                onClick={() => handleCopy(getSafeValue(trips?.driverId?.email), "email")}
                                                                className="ml-2 text-gray-500 hover:text-blue-600"
                                                                title="Copy Email"
                                                            >
                                                                <FiCopy />
                                                            </button>
                                                            {copied === "email" && (
                                                                <span className="ml-2 text-xs text-green-600">Copied!</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Phone */}
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                                        <div className="flex items-center">
                                                            <FiPhone className="mr-2 text-gray-400 flex-shrink-0" />
                                                            <p className="font-medium text-gray-900 break-all">
                                                                {getSafeValue(trips?.driverId?.phone)}
                                                            </p>
                                                            <button
                                                                onClick={() => handleCopy(getSafeValue(trips?.driverId?.phone), "phone")}
                                                                className="ml-2 text-gray-500 hover:text-blue-600"
                                                                title="Copy Phone"
                                                            >
                                                                <FiCopy />
                                                            </button>
                                                            {copied === "phone" && (
                                                                <span className="ml-2 text-xs text-green-600">Copied!</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>



                                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Country</p>
                                                    <div className="flex items-center">
                                                        <FiGlobe className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">{getSafeValue(trips?.driverId?.country)}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Currency</p>
                                                    <div className="flex items-center">
                                                        <FiDollarSign className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">{getSafeValue(trips?.driverId?.currency)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Information */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiUser className="mr-2 text-indigo-600" /> Customer Information
                                            </h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                                    <p className="font-medium text-gray-900">{getSafeValue(trips?.userId?.name)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">CustomerId</p>
                                                    <p className="font-medium text-gray-900 text-sm">{getSafeValue(trips?.userId?._id, 'N/A')}</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-gray-100 pt-4">
                                                <div className="grid grid-cols-2 gap-6">
                                                    {/* Email */}
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-gray-500 mb-1">Email Address</p>
                                                        <div className="flex items-center">
                                                            <FiMail className="mr-2 text-gray-400 flex-shrink-0" />
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {getSafeValue(trips?.userId?.email)}
                                                            </p>
                                                            <button
                                                                onClick={() => handleCopy(getSafeValue(trips?.userId?.email), "email")}
                                                                className="ml-2 text-gray-500 hover:text-blue-600"
                                                                title="Copy Email"
                                                            >
                                                                <FiCopy />
                                                            </button>
                                                            {copied === "email" && (
                                                                <span className="ml-2 text-xs text-green-600">Copied!</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Phone */}
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                                                        <div className="flex items-center">
                                                            <FiPhone className="mr-2 text-gray-400 flex-shrink-0" />
                                                            <p className="font-medium text-gray-900 break-all">
                                                                {getSafeValue(trips?.userId?.phone)}
                                                            </p>
                                                            <button
                                                                onClick={() => handleCopy(getSafeValue(trips?.userId?.phone), "phone")}
                                                                className="ml-2 text-gray-500 hover:text-blue-600"
                                                                title="Copy Phone"
                                                            >
                                                                <FiCopy />
                                                            </button>
                                                            {copied === "phone" && (
                                                                <span className="ml-2 text-xs text-green-600">Copied!</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>



                                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Country</p>
                                                    <div className="flex items-center">
                                                        <FiGlobe className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">{getSafeValue(trips?.userId?.country)}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">Currency</p>
                                                    <div className="flex items-center">
                                                        <FiDollarSign className="mr-2 text-gray-400" />
                                                        <p className="font-medium text-gray-900 text-sm">{getSafeValue(trips?.userId?.currency)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                </div>

                                {/* Vehicle Details */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiTruck className="mr-2 text-indigo-600" /> Vehicle Details
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Brand</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.brand}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Model</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.model}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Year</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.year}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Color</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.color}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Plate Number</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.plateNumber}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Seating Capacity</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.seatingCapacity}</span>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Electric</span>
                                                <span className="font-medium text-gray-900">{trips?.driverId?.VehicalDetails?.electric}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fare Breakup */}
                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiDollarSign className="mr-2 text-indigo-600" /> Fare Breakup
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Base Fare */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Base Fare</span>
                                                <span className="font-medium text-gray-900">${getSafeValue(trips?.fareDetails?.baseFare)}</span>
                                            </div>

                                            {/* Distance Fare */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Distance Fare</span>
                                                <span className="font-medium text-gray-900">${getSafeValue(trips?.fareDetails?.distanceFare)}</span>
                                            </div>

                                            {/* Time Fare */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Time Fare</span>
                                                <span className="font-medium text-gray-900">${getSafeValue(trips?.fareDetails?.timeFare)}</span>
                                            </div>

                                            {/* Platform Fee */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Platform Fee</span>
                                                <span className="font-medium text-gray-900">
                                                    ${getSafeValue(trips?.fareDetails?.platformFee)} ({getSafeValue(trips?.fareDetails?.platformFeePercentage)}%)
                                                </span>
                                            </div>

                                            {/* Surge */}
                                            {trips?.fareDetails?.surge > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Surge</span>
                                                    <span className="font-medium text-gray-900">${getSafeValue(trips?.fareDetails?.surge)}</span>
                                                </div>
                                            )}

                                            {/* Toll Fees */}
                                            {trips?.fareDetails?.tollFees > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Toll Fees</span>
                                                    <span className="font-medium text-gray-900">${getSafeValue(trips?.fareDetails?.tollFees)}</span>
                                                </div>
                                            )}

                                            {/* Cancel Fare */}
                                            {trips?.fareDetails?.cancelFare > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Cancel Fee</span>
                                                    <span className="font-medium text-gray-900">${getSafeValue(trips?.fareDetails?.cancelFare)}</span>
                                                </div>
                                            )}

                                            {/* Divider */}
                                            <hr className="my-2 border-gray-200" />

                                            {/* Total Fare */}
                                            <div className="flex justify-between text-base font-semibold">
                                                <span>Total Fare</span>
                                                <span>${getSafeValue(trips?.fareDetails?.totalFare)}</span>
                                            </div>

                                            {/* Driver Earnings */}
                                            <div className="flex justify-between text-sm text-green-700">
                                                <span>Driver Gets</span>
                                                <span className="font-semibold">${getSafeValue(trips?.fareDetails?.driverGets)}</span>
                                            </div>
                                        </div>
                                    </div>

{/* 💳 Payment Details */}
<div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
  <div className="flex items-center justify-between mb-5">
    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
      <FiCreditCard className="mr-2 text-indigo-600" /> Payment Details
    </h3>
  </div>

  <div className="space-y-4">
    {/* Transaction ID */}
    <div className="flex justify-between text-sm">
      <span className="flex items-center text-gray-500">
        <FiHash className="mr-1" /> Transaction ID
      </span>
      <span className="font-medium text-gray-900">
        {trips?.payment?.paymentDetails?.transactionId || "—"}
      </span>
    </div>

    {/* Payment Method */}
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Method</span>
      <span className="font-medium text-gray-900">
        {trips?.payment?.method || "—"}
      </span>
    </div>

    {/* Payment Time */}
    <div className="flex justify-between text-sm">
      <span className="flex items-center text-gray-500">
        <FiClock className="mr-1" /> Payment Time
      </span>
      <span className="font-medium text-gray-900">
        {trips?.payment?.paymentDetails?.paymentTime
          ? new Date(trips.payment.paymentDetails.paymentTime).toLocaleString()
          : "—"}
      </span>
    </div>

    {/* Amount */}
    <div className="flex justify-between text-sm">
      <span className="flex items-center text-gray-500">
        <FiDollarSign className="mr-1" /> Amount
      </span>
      <span className="font-semibold text-gray-900">
        ${trips?.payment?.amount || 0}
      </span>
    </div>

    {/* Status */}
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">Status</span>
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
          trips?.payment?.isPaid
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {trips?.payment?.isPaid ? "Paid" : "Unpaid"}
      </span>
    </div>
  </div>
</div>

                                    {/* 🌍 Location Details */}
                                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                                        <div className="flex items-center justify-between mb-5">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiMapPin className="mr-2 text-indigo-600" /> Location Details
                                            </h3>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Pickup */}
                                            <div>
                                                <span className="block text-xs uppercase text-gray-400">Pickup</span>
                                                <p className="text-sm font-medium text-gray-900">{trips?.pickupLocation?.address}</p>
                                            </div>

                                            {/* Drop */}
                                            <div>
                                                <span className="block text-xs uppercase text-gray-400">Drop</span>
                                                <p className="text-sm font-medium text-gray-900">{trips?.dropLocation?.address}</p>
                                            </div>

                                            {/* Date */}
                                            <div className="flex justify-between text-sm">
                                                <span className="flex items-center text-gray-500">
                                                    <FiCalendar className="mr-1 text-indigo-500" /> Date
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {trips?.travelDate ? new Date(trips.travelDate).toLocaleDateString() : "—"}
                                                </span>
                                            </div>

                                            {/* Time */}
                                            <div className="flex justify-between text-sm">
                                                <span className="flex items-center text-gray-500">
                                                    <FiClock className="mr-1 text-indigo-500" /> Time
                                                </span>
                                                <span className="font-medium text-gray-900">{trips?.travelTime || "—"}</span>
                                            </div>

                                            {/* Distance */}
                                            <div className="flex justify-between text-sm">
                                                <span className="flex items-center text-gray-500">
                                                    <MdOutlineDirectionsCar className="mr-1 text-indigo-500" /> Distance
                                                </span>
                                                <span className="font-medium text-gray-900">{trips?.fareDetails?.distanceKm} km</span>
                                            </div>

                                            {/* Duration */}
                                            <div className="flex justify-between text-sm">
                                                <span className="flex items-center text-gray-500">
                                                    <FiClock className="mr-1 text-indigo-500" /> Duration
                                                </span>
                                                <span className="font-medium text-gray-900">{trips?.fareDetails?.timeMin} min</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Review */}

                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiCreditCard className="mr-2 text-indigo-600" /> Driver Review
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Comment */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Comment</span>
                                                <span className="font-medium text-gray-900">
                                                    {renderComment(trips?.driverreview?.comment)}
                                                </span>
                                            </div>

                                            {/* Behavior */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Behavior</span>
                                                <StarRating value={trips?.driverreview?.customerBehavior || 0} />
                                            </div>

                                            {/* Waiting Time */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Waiting Time</span>
                                                <StarRating value={trips?.driverreview?.waitingTime || 0} />
                                            </div>

                                            {/* Hygiene */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Hygiene</span>
                                                <StarRating value={trips?.driverreview?.hygiene || 0} />
                                            </div>

                                            {/* Generosity */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Generosity</span>
                                                <StarRating value={trips?.driverreview?.generosity || 0} />
                                            </div>

                                        </div>
                                    </div>
                                    {/* Review */}

                                    <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                                                <FiCreditCard className="mr-2 text-indigo-600" /> Customer Review
                                            </h3>
                                        </div>

                                        <div className="space-y-3">
                                            {/* Comment */}
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Comment</span>
                                                <span className="font-medium text-gray-900">
                                                    {renderComment(trips?.userreview?.comment)}
                                                </span>
                                            </div>

                                            {/* Behavior */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Behavior</span>
                                                <StarRating value={trips?.userreview?.customerBehavior || 0} />
                                            </div>

                                            {/* Waiting Time */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Waiting Time</span>
                                                <StarRating value={trips?.userreview?.waitingTime || 0} />
                                            </div>

                                            {/* Hygiene */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Hygiene</span>
                                                <StarRating value={trips?.userreview?.hygiene || 0} />
                                            </div>

                                            {/* Generosity */}
                                            <div className="flex justify-between text-sm items-center">
                                                <span className="text-gray-500">Generosity</span>
                                                <StarRating value={trips?.userreview?.generosity || 0} />
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* Trip History Content */
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">Trip History</h2>

                                {trips.length === 0 ? (
                                    <div className="text-center py-10">
                                        <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No trips found</h3>
                                        <p className="mt-1 text-sm text-gray-500">This user hasn't taken any trips yet.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {trips.map((trip) => (
                                                    <tr key={trip._id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{formatDate(trip.travelDate)}</div>
                                                            <div className="text-sm text-gray-500 flex items-center">
                                                                <FiClock className="mr-1" /> {formatTime(trip.travelTime)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {trip.pickupLocation?.address || 'N/A'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                to {trip.dropLocation?.address || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {getVehicleIcon(trip.vehicleType)}
                                                                <span className="ml-2 text-sm text-gray-900">{trip.vehicleType}</span>
                                                            </div>
                                                            {trip.bookingType === 'PoolRide' && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                                                    Shared Ride
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            ${trip.fareDetails?.totalFare || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {getPaymentMethodIcon(trip.payment?.method)}
                                                                <span className="ml-2 text-sm text-gray-900">{trip.payment?.method}</span>
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {trip.payment?.isPaid ? 'Paid' : 'Not Paid'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {getStatusBadge(trip.status)}
                                                            {trip.status === 'Cancelled' && trip.cancelreason && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Reason: {trip.cancelreason}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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