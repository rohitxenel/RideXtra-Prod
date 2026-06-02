'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getticketById,
  ChangeStatus,
  SendReply
} from '@/services/rideManagementService ';
import {
  FiArrowLeft,
  FiUser,
  FiEdit3,
  FiSend,
  FiXCircle
} from 'react-icons/fi';
import Snackbar from '@/components/layout/Snackbar';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // ---------- Helpers ----------
  const showSnackbar = (message, type = 'success') =>
    setSnackbar({ visible: true, message, type });
  const hideSnackbar = () =>
    setSnackbar((s) => ({ ...s, visible: false }));

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

  // ---------- Fetch Ticket ----------
  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await getticketById(id);
      if (res?.statusCode === 200 && res?.status) {
        const data = res.data?.data || res.data;
        setTicket(data);
        setSubject(
          `Response to Your Support Ticket – ${process.env.NEXT_PUBLIC_APP_NAME || 'RideXtra'} Team`
        );
      } else {
        showSnackbar('Failed to fetch ticket', 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('Error loading ticket', 'error');
    } finally {
      setLoading(false);
    }
  };

  // call once when page loads
  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);


  // ---------- Handle Status Change ----------
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === ticket.Status) return;

    try {
      setStatusLoading(true);
      const res = await ChangeStatus(id, newStatus);
      if (res?.statusCode === 200) {
        setTicket((prev) => ({ ...prev, Status: newStatus }));
        showSnackbar(`Ticket status changed to ${newStatus}`, 'success');
      } else {
        showSnackbar('Failed to change status', 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('API error while updating status', 'error');
    } finally {
      setStatusLoading(false);
    }
  };

  // ---------- Handle Reply ----------
  const handleReply = async () => {
    if (!replyMessage.trim()) {
      showSnackbar('Please write a reply message', 'error');
      return;
    }

    try {
      setSendingReply(true);
      const res = await SendReply(id, ticket?.email, subject, replyMessage);

      if (res?.statusCode === 200 || res?.status) {
        showSnackbar('Reply sent successfully', 'success');
        await fetchTicket();
        setReplyMessage('');
      } else {
        console.log("message", res.message)
        showSnackbar(res?.message || 'Failed to change status', 'error');
      }
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiXCircle className="text-red-400 mx-auto h-12 w-12 mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Ticket not found
          </h2>
          <button
            onClick={() => router.back()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md border border-gray-100 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-indigo-50">
          <button
            onClick={() => router.back()}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <FiArrowLeft className="mr-1" /> Back
          </button>

          <div className="flex items-center gap-3">
            <select
              onChange={handleStatusChange}
              value={ticket.Status}
              disabled={statusLoading}
              className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="OPEN">OPEN</option>
              <option value="CLOSE">CLOSE</option>
            </select>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${ticket.Status === 'OPEN'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
                }`}
            >
              {ticket.Status}
            </span>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <FiUser className="text-indigo-500 w-5 h-5" />
            <h2 className="text-xl font-semibold text-gray-900">
              Ticket Details
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Name</p>
              <p className="font-medium text-gray-800">{ticket?.name}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="font-medium text-gray-800">{ticket?.email}</p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Type</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${ticket?.type === 'USER'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                  }`}
              >
                {ticket?.type}
              </span>
            </div>

            <div>
              <p className="text-gray-500 text-sm">Created On</p>
              <p className="font-medium text-gray-800">
                {formatDate(ticket?.createdAt)} — {formatTime(ticket?.createdAt)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-gray-500 text-sm mb-1">Title</p>
            <p className="text-lg font-semibold text-gray-900 mb-3">
              {ticket?.title}
            </p>

            <p className="text-gray-500 text-sm mb-1">Description</p>
            <p className="text-gray-800 leading-relaxed">
              {ticket?.description}
            </p>
          </div>
        </div>

        {/* Reply Section */}
        <div className="border-t border-gray-100 p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-3">
            <FiEdit3 className="mr-2 text-indigo-600" /> Reply to Ticket
          </h3>

          {/* Subject input */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Message textarea */}
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Write your reply here..."
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
          />

          <div className="flex justify-end">
            <button
              onClick={handleReply}
              disabled={sendingReply}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition ${sendingReply
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
            >
              <FiSend className="w-4 h-4" />{' '}
              {sendingReply ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>

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
