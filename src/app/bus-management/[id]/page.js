'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getrideById, AssignBusDriver } from '@/services/rideManagementService ';
import {
  FiArrowLeft,
  FiMapPin,
  FiPhone,
  FiMail,
  FiDollarSign,
  FiCreditCard,
  FiUser,
  FiCalendar,
  FiGlobe,
  FiXCircle,
  FiClock,
  FiNavigation,
  FiTruck,
  FiCreditCard as FiCard,
  FiDollarSign as FiCash,
  FiCopy,
  FiHash
} from 'react-icons/fi';
import { MdOutlineDirectionsCar, MdDirectionsBus } from 'react-icons/md';
import Snackbar from '@/components/layout/Snackbar';

export default function RideDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });
  const [copied, setCopied] = useState('');

  // new state for modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ busNumber: '', driverName: '', contact: '' });
  const [submitting, setSubmitting] = useState(false);

  const getSafe = (v, fb = '—') => (v !== undefined && v !== null && v !== '' ? v : fb);

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const formatTime = (val) => {
    if (!val) return '—';
    if (typeof val === 'string' && (val.includes('AM') || val.includes('PM'))) return val;
    try {
      const t = String(val);
      const parts = t.split('T')[1]?.split(':');
      if (parts?.length >= 2) {
        let h = parseInt(parts[0], 10);
        const m = parts[1];
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
      }
      return t;
    } catch {
      return String(val);
    }
  };

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopied(type);
    setTimeout(() => setCopied(''), 1200);
  };

  const showSnackbar = (message, type = 'success') => setSnackbar({ visible: true, message, type });
  const hideSnackbar = () => setSnackbar((s) => ({ ...s, visible: false }));

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

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Bike':
        return <FiNavigation className="text-indigo-500" />;
      case 'Sedan':
      case 'SUV':
      case 'Hatchback':
        return <FiTruck className="text-indigo-500" />;
      case 'BUS':
        return <MdDirectionsBus className="text-indigo-500" />;
      default:
        return <MdOutlineDirectionsCar className="text-gray-500" />;
    }
  };

  // ------- data fetch -------
  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const res = await getrideById(id);
        if (res?.statusCode === 200 && res?.status) {
          const t = res.data?.data || res.data;
          setTrip(t || null);
        } else {
          setTrip(null);
        }
      } catch (err) {
        console.error(err);
        showSnackbar(err?.message || 'Failed to load trip', 'error');
        setTrip(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTrip();
    else {
      showSnackbar('Trip ID is required', 'error');
      setLoading(false);
    }
  }, [id]);

  const statusNormalized = (trip?.status ?? '').toString().trim().toLowerCase();
  const isCompleted = statusNormalized === 'completed';

  const driverAssigned =
    !!trip &&
    typeof trip.driverId === 'object' &&
    trip.driverId !== null &&
    !!(trip.driverId._id && String(trip.driverId._id).trim().length > 0);

  const showCustomerInfo = true;
  const showLocation = true;
  const showDriverInfo = driverAssigned || isCompleted;
  const showVehicle = driverAssigned || isCompleted;
  const showFareAndPayment = isCompleted;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto h-16 w-16 text-red-400 mb-4">
            <FiXCircle className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Trip Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn’t load this trip.</p>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.busNumber || !form.driverName || !form.contact) {
      showSnackbar('All fields are required', 'error');
      return;
    }
    try {
      setSubmitting(true);
      const res = await AssignBusDriver({
        OrderId: id,
        BusNumber: form.busNumber,
        driverName: form.driverName,
        contact: form.contact,
        SeatNo: form.SeatNo,
      });
      if (res?.statusCode === 200) {
        showSnackbar('Bus driver assigned successfully!');
        setShowModal(false);
      } else {
        showSnackbar(res?.message || 'Failed to assign driver', 'error');
      }
    } catch (err) {
      showSnackbar('Something went wrong', 'error');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // ------- UI -------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="border-b border-gray-200 flex items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-gray-700 font-medium py-4 px-6 transition-colors border-b-2 border-transparent"
            >
              <FiArrowLeft className="mr-1" /> Back
            </button>

            <div className="ml-auto pr-6 py-4 text-sm text-gray-600 flex items-center gap-4">
              <div>
                <span className="mr-2">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : statusNormalized === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {trip.status || '—'}
                </span>
              </div>

              {/* Assign Button */}
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition"
              >
                Assign Bus Driver
              </button>
            </div>
          </div>

          {/* your full existing content below remains same */}
<div className="p-6">
            {/* Row 1: Customer (always) + Driver (conditional) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Customer Information — ALWAYS */}
              {showCustomerInfo && (
                <div className={`bg-white rounded-lg p-5 border border-gray-200 shadow-sm ${!showDriverInfo ? 'lg:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FiUser className="mr-2 text-indigo-600" /> Customer Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Full Name</p>
                        <p className="font-medium text-gray-900">{getSafe(trip?.userId?.name)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                        <p className="font-medium text-gray-900 text-sm">{getSafe(trip?.userId?._id)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Email */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500 mb-1">Email Address</p>
                          <div className="flex items-center">
                            <FiMail className="mr-2 text-gray-400 flex-shrink-0" />
                            <p className="font-medium text-gray-900 truncate">{getSafe(trip?.userId?.email)}</p>
                            <button
                              onClick={() => handleCopy(getSafe(trip?.userId?.email, ''), 'email')}
                              className="ml-2 text-gray-500 hover:text-blue-600"
                              title="Copy Email"
                            >
                              <FiCopy />
                            </button>
                            {copied === 'email' && <span className="ml-2 text-xs text-green-600">Copied!</span>}
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                          <div className="flex items-center">
                            <FiPhone className="mr-2 text-gray-400 flex-shrink-0" />
                            <p className="font-medium text-gray-900 break-all">{getSafe(trip?.userId?.phone)}</p>
                            <button
                              onClick={() => handleCopy(getSafe(trip?.userId?.phone, ''), 'phone')}
                              className="ml-2 text-gray-500 hover:text-blue-600"
                              title="Copy Phone"
                            >
                              <FiCopy />
                            </button>
                            {copied === 'phone' && <span className="ml-2 text-xs text-green-600">Copied!</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Country</p>
                        <div className="flex items-center">
                          <FiGlobe className="mr-2 text-gray-400" />
                          <p className="font-medium text-gray-900 text-sm">{getSafe(trip?.userId?.country)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Currency</p>
                        <div className="flex items-center">
                          <FiDollarSign className="mr-2 text-gray-400" />
                          <p className="font-medium text-gray-900 text-sm">{getSafe(trip?.userId?.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Driver Information — ONLY if driver assigned OR Completed */}
              {showDriverInfo && (
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
                        <p className="font-medium text-gray-900">{getSafe(trip?.driverId?.name)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Driver ID</p>
                        <p className="font-medium text-gray-900 text-sm">{getSafe(trip?.driverId?._id)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500 mb-1">Email Address</p>
                          <div className="flex items-center">
                            <FiMail className="mr-2 text-gray-400 flex-shrink-0" />
                            <p className="font-medium text-gray-900 truncate">{getSafe(trip?.driverId?.email)}</p>
                            <button
                              onClick={() => handleCopy(getSafe(trip?.driverId?.email, ''), 'email')}
                              className="ml-2 text-gray-500 hover:text-blue-600"
                              title="Copy Email"
                            >
                              <FiCopy />
                            </button>
                            {copied === 'email' && <span className="ml-2 text-xs text-green-600">Copied!</span>}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                          <div className="flex items-center">
                            <FiPhone className="mr-2 text-gray-400 flex-shrink-0" />
                            <p className="font-medium text-gray-900 break-all">{getSafe(trip?.driverId?.phone)}</p>
                            <button
                              onClick={() => handleCopy(getSafe(trip?.driverId?.phone, ''), 'phone')}
                              className="ml-2 text-gray-500 hover:text-blue-600"
                              title="Copy Phone"
                            >
                              <FiCopy />
                            </button>
                            {copied === 'phone' && <span className="ml-2 text-xs text-green-600">Copied!</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Country</p>
                        <div className="flex items-center">
                          <FiGlobe className="mr-2 text-gray-400" />
                          <p className="font-medium text-gray-900 text-sm">{getSafe(trip?.driverId?.country)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Currency</p>
                        <div className="flex items-center">
                          <FiDollarSign className="mr-2 text-gray-400" />
                          <p className="font-medium text-gray-900 text-sm">{getSafe(trip?.driverId?.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Vehicle (conditional) + Location (always) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Vehicle Details — ONLY if driver assigned OR Completed */}
              {showVehicle && (
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      {getVehicleIcon(trip?.vehicleType)} <span className="ml-2">Vehicle Details</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.vehicleType)}</span>
                    </div>

                    {/* Safe from driver vehicle info if present */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Brand</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.driverId?.VehicalDetails?.brand)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Model</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.driverId?.VehicalDetails?.model)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Plate Number</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.driverId?.VehicalDetails?.plateNumber)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Details — ALWAYS */}
              <div className={`bg-white rounded-2xl p-6 border border-gray-200 shadow-md ${!showVehicle ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FiMapPin className="mr-2 text-indigo-600" /> Location Details
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="block text-xs  text-gray-400">Departure Location</span>
                    <p className="text-sm font-medium text-gray-900">{getSafe(trip?.pickupLocation?.address)}</p>
                  </div>

                  <div>
                    <span className="block text-xs  text-gray-400">Destination Location</span>
                    <p className="text-sm font-medium text-gray-900">{getSafe(trip?.dropLocation?.address)}</p>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="flex items-center text-gray-500">
                      <FiCalendar className="mr-1 text-indigo-500" /> Date Of Travel
                    </span>
                    <span className="font-medium text-gray-900">{formatDate(trip?.travelDate)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="flex items-center text-gray-500">
                      <FiClock className="mr-1 text-indigo-500" />Departure Time
                    </span>
                    <span className="font-medium text-gray-900">{formatTime(trip?.travelTime)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Fare + Payment — ONLY when Completed */}
            {showFareAndPayment && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Fare Breakup */}
                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FiDollarSign className="mr-2 text-indigo-600" /> Fare Breakup
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Base Fare</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.fareDetails?.baseFare, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Distance Fare</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.fareDetails?.distanceFare, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Time Fare</span>
                      <span className="font-medium text-gray-900">{getSafe(trip?.fareDetails?.timeFare, 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Platform Fee</span>
                      <span className="font-medium text-gray-900">
                        {getSafe(trip?.fareDetails?.platformFee, 0)}
                        {trip?.fareDetails?.platformFeePercentage !== undefined &&
                          ` (${trip.fareDetails.platformFeePercentage}%)`}
                      </span>
                    </div>

                    {trip?.fareDetails?.surge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Surge</span>
                        <span className="font-medium text-gray-900">{trip?.fareDetails?.surge}</span>
                      </div>
                    )}

                    {trip?.fareDetails?.tollFees > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Toll Fees</span>
                        <span className="font-medium text-gray-900">{trip?.fareDetails?.tollFees}</span>
                      </div>
                    )}

                    {trip?.fareDetails?.cancelFare > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Cancel Fee</span>
                        <span className="font-medium text-gray-900">{trip?.fareDetails?.cancelFare}</span>
                      </div>
                    )}

                    <hr className="my-2 border-gray-200" />

                    <div className="flex justify-between text-base font-semibold">
                      <span>Total Fare</span>
                      <span>{getSafe(trip?.fareDetails?.totalFare, 0)}</span>
                    </div>

                    {trip?.fareDetails?.driverGets !== undefined && (
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Driver Gets</span>
                        <span className="font-semibold">{trip?.fareDetails?.driverGets}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FiCreditCard className="mr-2 text-indigo-600" /> Payment Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <FiHash className="mr-1" /> Transaction ID
                      </span>
                      <span className="font-medium text-gray-900">
                        {getSafe(trip?.payment?.paymentDetails?.transactionId)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Method</span>
                      <div className="font-medium text-gray-900 flex items-center">
                        {getPaymentMethodIcon(trip?.payment?.method)}
                        <span className="ml-2">{getSafe(trip?.payment?.method)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <FiClock className="mr-1" /> Payment Time
                      </span>
                      <span className="font-medium text-gray-900">
                        {trip?.payment?.paymentDetails?.paymentTime
                          ? new Date(trip.payment.paymentDetails.paymentTime).toLocaleString()
                          : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <FiDollarSign className="mr-1" /> Amount
                      </span>
                      <span className="font-semibold text-gray-900">{getSafe(trip?.payment?.amount, 0)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          trip?.payment?.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {trip?.payment?.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* end Fare+Payment */}
          </div>        </div>
      </div>

      {/* --- Modal Form --- */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Assign Bus Driver</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                <input
                  type="text"
                  value={form.busNumber}
                  onChange={(e) => setForm({ ...form, busNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter Bus Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                <input
                  type="text"
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter Driver Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Number</label>
                <input
                  type="text"
                  value={form.SeatNo}
                  onChange={(e) => setForm({ ...form, SeatNo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter Seat Number"
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter Contact Number"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg font-medium text-white ${
                    submitting ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {submitting ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
