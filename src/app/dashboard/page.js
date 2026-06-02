'use client'
import { useState, useEffect } from 'react';
import {
  FiTruck,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiCalendar,
} from 'react-icons/fi';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { dashboardState, RecentOrder, TopRider, Performance } from '@/services/admincontrol';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function RiderAdminDashboard() {
  const [timeFilter, setTimeFilter] = useState('week'); // 'today' | 'week' | 'month' | 'total'
  const [kpis, setKpis] = useState({
    scope: 'week',
    totalRides: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    inProgress: 0,
    totalRevenue: 0,
    completedToday: 0,
  });
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [weekData, setPerformance] = useState([]);
  const [orderLimit, setOrderLimit] = useState(10); // dropdown state
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [err, setErr] = useState('');

  // Load KPIs when filter changes
  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        setLoading(true);
        setErr('');
        const res = await dashboardState(timeFilter);
        const payload = res?.data ?? res;
        const api = payload?.data ?? payload;
        if (!abort) setKpis(api || {});
      } catch (e) {
        if (!abort) setErr('Failed to load dashboard stats');
        console.error(e);
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => { abort = true; };
  }, [timeFilter]);

  // Load Recent Orders when dropdown changes
  useEffect(() => {
    let abort = false;
    async function loadOrders() {
      try {
        setLoadingOrders(true);
        const res = await RecentOrder(orderLimit);
        const resData = await TopRider();
        const PerformanceData = await Performance();
        setPerformance(PerformanceData?.data)
        console.log("response", PerformanceData?.data)
        setRiders(resData?.data)
        if (!abort) setOrders(res?.data?.data || []);
      } catch (e) {
        console.error('Failed to fetch recent orders', e);
        if (!abort) setOrders([]);
      } finally {
        if (!abort) setLoadingOrders(false);
      }
    }
    loadOrders();
    return () => { abort = true; };
  }, [orderLimit]);

  const isToday = timeFilter === 'today';
  const fmtINR = (n) => `$${Number(n || 0).toLocaleString('en-IN')}`;

  // Build cards from API data
  const stats = isToday
    ? [
      { title: 'Pending Rides', value: kpis.pending, icon: <FiClock className="h-6 w-6" />, color: 'bg-yellow-500' },
      { title: 'Cancelled Rides', value: kpis.cancelled, icon: <FiAlertCircle className="h-6 w-6" />, color: 'bg-red-500' },
      { title: 'Completed Today', value: kpis.completedToday, icon: <FiTruck className="h-6 w-6" />, color: 'bg-purple-500' },
      { title: 'Total Rides', value: kpis.totalRides, icon: <FiTruck className="h-6 w-6" />, color: 'bg-blue-500' },
      { title: 'Total Revenue', value: kpis.totalRevenue, icon: <FiDollarSign className="h-6 w-6" />, color: 'bg-amber-500' },
    ]
    : [
      { title: 'Completed', value: kpis.completed, icon: <FiTruck className="h-6 w-6" />, color: 'bg-purple-500' },
      { title: 'Cancelled', value: kpis.cancelled, icon: <FiAlertCircle className="h-6 w-6" />, color: 'bg-red-500' },
      { title: 'Total Rides', value: kpis.totalRides, icon: <FiTruck className="h-6 w-6" />, color: 'bg-blue-500' },
      { title: 'Total Revenue', value: kpis.totalRevenue, icon: <FiDollarSign className="h-6 w-6" />, color: 'bg-amber-500' },
    ];

  // Demo charts (unchanged)
  const deliveryChartData = {
    labels: weekData.labels, // backend labels (Tue → Mon or last 7 days)
    datasets: [
      {
        label: 'Completed Deliveries',
        data: weekData.completed,
        backgroundColor: 'rgba(54,162,235,0.2)',
        borderColor: 'rgba(54,162,235,1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Cancelled Deliveries',
        data: weekData.cancelled,
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  // build performanceChartData from riders state
  const performanceChartData = {
    labels: riders.map(r => r.name), // ["User6", "Neha Gupta", ...]
    datasets: [
      {
        label: 'Completed Rides',
        data: riders.map(r => r.completedRides), // [5,3,2,2,2]
        backgroundColor: [
          'rgba(54,162,235,0.7)',
          'rgba(75,192,192,0.7)',
          'rgba(153,102,255,0.7)',
          'rgba(255,159,64,0.7)',
          'rgba(255,99,132,0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rider Management Dashboard</h1>
        <p className="text-gray-600">Monitor and manage your delivery fleet performance</p>
      </div>

      {/* Time Filter */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="total">Total</option>
          </select>
        </div>

        {loading && <span className="text-sm text-gray-500">Loading…</span>}
        {!loading && err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {/* Stats */}
      <div className="mb-8">
        {isToday ? (
          <div className="flex gap-6 overflow-x-auto pb-2 snap-x">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 min-w-[16rem] shrink-0 snap-start">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                      <FiTrendingUp className="mr-1" /> Updated via {timeFilter}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center">
                      <FiTrendingUp className="mr-1" /> Updated via {timeFilter}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Delivery Trends</h2>
          <div className="h-80"><Line data={deliveryChartData} options={chartOptions} /></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Rider Performance</h2>
          <div className="h-80"><Bar data={performanceChartData} options={chartOptions} /></div>
        </div>
      </div>

      {/* Most Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Most Recent Orders</h2>

          {/* Dropdown to select limit */}
          <select
            value={orderLimit}
            onChange={(e) => setOrderLimit(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            {[10, 20, 30, 40, 50 ,100].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-center">
            <thead>
              <tr>
                <th className="px-4 py-3 text-gray-600 font-medium">S.No</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Customer</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Driver</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Amount</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingOrders ? (
                <tr><td colSpan="6" className="py-4 text-gray-500">Loading orders…</td></tr>
              ) : orders.length > 0 ? (
                orders.map((order, idx) => (
                  <tr key={order._id}>
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">{order?.userId?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{order?.driverId?.name || 'Unassigned'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{`${order?.fareDetails?.totalFare || order?.payment?.amount || 0} $` }</td>
                    <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="py-4 text-gray-500">No recent orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
