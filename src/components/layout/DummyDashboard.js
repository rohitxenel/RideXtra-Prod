'use client'
import { useState } from 'react';
import { FiCreditCard, FiTrendingUp, FiUsers, FiPieChart, FiDownload, FiUpload, FiShoppingBag, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });


export default function DashboardPage() {
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [walletBalance] = useState(34250.80);

    // Chart data
    const earningsChartOptions = {
        chart: {
            type: 'area',
            height: 350,
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        colors: ['#4F46E5'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.3,
            }
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
        },
        tooltip: { theme: 'dark' }
    };

    const earningsChartSeries = [{
        name: 'Earnings',
        data: [4500, 5200, 7800, 9200, 12500, 15600, 18900]
    }];

    const performanceChartOptions = {
        chart: {
            type: 'radialBar',
            height: 280,
            toolbar: { show: false }
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { margin: 0, size: '70%' },
                dataLabels: {
                    name: { fontSize: '16px', color: undefined, offsetY: 120 },
                    value: {
                        offsetY: 76,
                        fontSize: '22px',
                        color: undefined,
                        formatter: function (val) {
                            return val + '%';
                        }
                    }
                }
            }
        },
        colors: ['#10B981'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 65, 91]
            }
        },
        stroke: { dashArray: 4 },
        labels: ['Target Achievement']
    };

    const performanceChartSeries = [82];

    const recentTransactions = [
        { id: 1, amount: 5200, description: 'Merchant Commission', date: '15 Jul 2023', status: 'completed', type: 'credit' },
        { id: 2, amount: -2500, description: 'Bank Transfer', date: '10 Jul 2023', status: 'completed', type: 'debit' },
        { id: 3, amount: 1800, description: 'Bonus Payment', date: '5 Jul 2023', status: 'completed', type: 'credit' },
        { id: 4, amount: 3200, description: 'Quarterly Reward', date: '28 Jun 2023', status: 'completed', type: 'credit' },
    ];

    const topMerchants = [
        { id: 1, name: 'Urban Bistro', revenue: 12500, growth: 12.5 },
        { id: 2, name: 'TechGadgets', revenue: 9800, growth: 8.2 },
        { id: 3, name: 'Fashion Haven', revenue: 8450, growth: 5.7 },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Partner Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here&apos;s your business overview</p>
            </div>

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Wallet Balance</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                <FiCreditCard className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                            >
                                Withdraw Funds
                            </button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Monthly Earnings</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">$18,900.00</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                                <FiTrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <FiTrendingUp className="mr-1" /> +24.5% from last month
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Active Merchants</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">24</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                                <FiUsers className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                3 new onboardings
                            </span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Commission Rate</p>
                                <p className="text-2xl font-semibold text-gray-900 mt-1">15%</p>
                            </div>
                            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                                <FiPieChart className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-6">
                            <button className="text-sm font-medium text-purple-600 hover:text-purple-700 transition">
                                View tier benefits →
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Earnings Chart */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
                            <div className="flex space-x-2">
                                <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                                    Monthly
                                </button>
                                <button className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                                    Quarterly
                                </button>
                                <button className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                    Annual
                                </button>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <Chart
                                options={earningsChartOptions}
                                series={earningsChartSeries}
                                type="area"
                                height="100%"
                            />
                        </div>
                    </div>
                </div>

                {/* Performance Radial Chart */}
                <div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quarterly Performance</h2>
                        <div className="h-[250px]">
                            <Chart
                                options={performanceChartOptions}
                                series={performanceChartSeries}
                                type="radialBar"
                                height="100%"
                            />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-gray-600">You&apos;ve achieved 82% of your Q3 target</p>
                            <button className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                                View full report →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Recent Transactions */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                                View All
                            </button>
                        </div>
                        <div className="space-y-4">
                            {recentTransactions.map((transaction) => (
                                <motion.div
                                    key={transaction.id}
                                    whileHover={{ x: 5 }}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition"
                                >
                                    <div className="flex items-center">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${transaction.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {transaction.type === 'credit' ? <FiDownload /> : <FiUpload />}
                                        </div>
                                        <div className="ml-4">
                                            <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                                            <p className="text-xs text-gray-500">{transaction.date}</p>
                                        </div>
                                    </div>
                                    <div className={`text-right ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        <p className="text-sm font-medium">
                                            {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Merchants */}
                <div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Merchants</h2>
                        <div className="space-y-5">
                            {topMerchants.map((merchant) => (
                                <div key={merchant.id} className="flex items-center">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-4">
                                        <FiShoppingBag />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{merchant.name}</p>
                                        <p className="text-xs text-gray-500">${merchant.revenue.toLocaleString()} revenue</p>
                                    </div>
                                    <span className={`text-xs font-medium ${merchant.growth >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {merchant.growth >= 0 ? '+' : ''}{merchant.growth}%
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                            View All Merchants
                        </button>
                    </div>
                </div>
            </div>
            {/* Withdraw Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl w-full max-w-md"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Withdraw Funds</h3>
                                    <button
                                        onClick={() => setShowWithdrawModal(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <FiX className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500">$</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={withdrawAmount}
                                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <span className="text-gray-500 text-sm">USD</span>
                                            </div>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">Available balance: ${walletBalance.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                                        <select className="block w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                                            <option>Primary Account (•••• 6789)</option>
                                            <option>Secondary Account (•••• 4321)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex space-x-3">
                                    <button
                                        onClick={() => setShowWithdrawModal(false)}
                                        className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            // Handle withdrawal
                                            setShowWithdrawModal(false);
                                        }}
                                        className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                                    >
                                        Confirm Withdrawal
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
