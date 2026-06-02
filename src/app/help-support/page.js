'use client';
import { useState } from 'react';
import {
  FiPlus,
  FiMessageSquare,
  FiChevronDown,
  FiPaperclip
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('my-tickets');
  const [tickets, setTickets] = useState([
    {
      id: 'TKT-1001',
      subject: 'Payment issue',
      status: 'Open',
      lastUpdated: '2 hours ago',
      messages: 3,
      category: 'Billing',
      priority: 'High'
    },
    {
      id: 'TKT-1002',
      subject: 'Account access problem',
      status: 'Resolved',
      lastUpdated: '1 day ago',
      messages: 5,
      category: 'Account',
      priority: 'Medium'
    },
    {
      id: 'TKT-1003',
      subject: 'Feature request',
      status: 'In Progress',
      lastUpdated: '3 days ago',
      messages: 2,
      category: 'Technical',
      priority: 'Low'
    }
  ]);

  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'Technical',
    priority: 'Medium',
    message: '',
    attachments: []
  });

  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.message) return;

    const ticket = {
      id: `TKT-${1000 + tickets.length + 1}`,
      subject: newTicket.subject,
      status: 'Open',
      lastUpdated: 'Just now',
      messages: 1,
      category: newTicket.category,
      priority: newTicket.priority
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({
      subject: '',
      category: 'Technical',
      priority: 'Medium',
      message: '',
      attachments: []
    });
    setActiveTab('my-tickets');
    setActiveTicket(ticket.id);
  };

  const handleSendReply = () => {
    if (!replyMessage || !activeTicket) return;

    const updatedTickets = tickets.map((ticket) => {
      if (ticket.id === activeTicket) {
        return {
          ...ticket,
          lastUpdated: 'Just now',
          messages: ticket.messages + 1
        };
      }
      return ticket;
    });

    setTickets(updatedTickets);
    setReplyMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-tickets')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-tickets'
                  ? 'border-[#342B9A] text-[#342B9A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Tickets
            </button>
            <button
              onClick={() => setActiveTab('new-ticket')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new-ticket'
                  ? 'border-[#342B9A] text-[#342B9A]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Driver Ticket
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'my-tickets' ? (
            <motion.div
              key="my-tickets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition ${
                      activeTicket === ticket.id ? 'bg-gray-50' : ''
                    }`}
                    onClick={() => setActiveTicket(ticket.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-2 rounded-lg ${
                            ticket.status === 'Open'
                              ? 'bg-blue-100 text-blue-800'
                              : ticket.status === 'Resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <FiMessageSquare className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {ticket.subject}
                          </h3>
                          <p className="text-sm text-gray-500">
                            #{ticket.id} • {ticket.category} • {ticket.priority}{' '}
                            priority
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            ticket.status === 'Open'
                              ? 'bg-blue-100 text-blue-800'
                              : ticket.status === 'Resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {ticket.status}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {ticket.lastUpdated}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="new-ticket"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Create New Support Ticket
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, subject: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#342B9A] focus:border-[#342B9A]"
                    placeholder="Briefly describe your issue"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={newTicket.category}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            category: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#342B9A] focus:border-[#342B9A] appearance-none"
                      >
                        <option>Technical</option>
                        <option>Billing</option>
                        <option>Account</option>
                        <option>General Inquiry</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <div className="relative">
                      <select
                        value={newTicket.priority}
                        onChange={(e) =>
                          setNewTicket({
                            ...newTicket,
                            priority: e.target.value
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#342B9A] focus:border-[#342B9A] appearance-none"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTicket.message}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, message: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#342B9A] focus:border-[#342B9A]"
                    placeholder="Please describe your issue in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attachments
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer">
                      <span className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        <FiPaperclip className="mr-2" />
                        Add Files
                        <input type="file" className="hidden" multiple />
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      Maximum 5MB per file
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateTicket}
                    className="px-6 py-2 bg-[#342B9A] text-white rounded-lg hover:bg-[#4a3fd3] flex items-center"
                  >
                    <FiPlus className="mr-2" />
                    Create Ticket
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket Conversation */}
        {activeTicket && activeTab === 'my-tickets' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {tickets.find((t) => t.id === activeTicket)?.subject}
              </h3>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  tickets.find((t) => t.id === activeTicket)?.status === 'Open'
                    ? 'bg-blue-100 text-blue-800'
                    : tickets.find((t) => t.id === activeTicket)?.status ===
                      'Resolved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {tickets.find((t) => t.id === activeTicket)?.status}
              </span>
            </div>

            <div className="space-y-6 mb-8">
              {/* Sample messages */}
              <div className="flex space-x-4">
                <div className="h-10 w-10 rounded-full bg-[#342B9A] flex items-center justify-center text-white">
                  SU
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Support Team
                      </span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <p className="text-gray-700">
                      Hello, thank you for reaching out. We&apos;ve received your
                      ticket and will get back shortly.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  YT
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">You</span>
                      <span className="text-xs text-gray-500">1 hour ago</span>
                    </div>
                    <p className="text-gray-700">
                      Thanks for the response. Here&apos;s more info on the issue…
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reply to this ticket
              </label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#342B9A] focus:border-[#342B9A] mb-4"
                placeholder="Type your reply here..."
              />
              <div className="flex justify-between items-center">
                <label className="cursor-pointer">
                  <span className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    <FiPaperclip className="mr-2" />
                    Attach Files
                    <input type="file" className="hidden" multiple />
                  </span>
                </label>
                <button
                  onClick={handleSendReply}
                  className="px-6 py-2 bg-[#342B9A] text-white rounded-lg hover:bg-[#4a3fd3]"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
