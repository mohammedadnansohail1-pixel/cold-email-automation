import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { analytics, companies, contacts, campaigns } from '@/lib/api';
import {
  FiMail, FiUsers, FiBriefcase, FiTrendingUp,
  FiActivity, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analytics.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <FiAlertCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const industryData = dashboardData?.industry_breakdown || [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <>
      <Head>
        <title>Dashboard - AI Cold Email Automation</title>
        <meta name="description" content="AI-powered cold email automation dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <FiMail className="text-primary-600 text-3xl mr-3" />
                <h1 className="text-xl font-bold text-gray-900">AI Cold Email Automation</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/companies')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Companies
                </button>
                <button
                  onClick={() => router.push('/contacts')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Contacts
                </button>
                <button
                  onClick={() => router.push('/campaigns')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Campaigns
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-2">Overview of your cold email campaigns and performance metrics</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Companies"
              value={stats.total_companies || 0}
              icon={<FiBriefcase />}
              color="blue"
            />
            <StatCard
              title="Active Contacts"
              value={stats.total_contacts || 0}
              icon={<FiUsers />}
              color="green"
            />
            <StatCard
              title="Active Campaigns"
              value={stats.active_campaigns || 0}
              icon={<FiActivity />}
              color="purple"
            />
            <StatCard
              title="Emails Sent"
              value={stats.total_emails_sent || 0}
              icon={<FiMail />}
              color="orange"
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Open Rate"
              value={`${stats.open_rate || 0}%`}
              subtitle={`${stats.total_opens || 0} opens`}
              color="green"
            />
            <MetricCard
              title="Reply Rate"
              value={`${stats.reply_rate || 0}%`}
              subtitle={`${stats.total_replies || 0} replies`}
              color="blue"
            />
            <MetricCard
              title="Conversion"
              value="Coming Soon"
              subtitle="Track meetings booked"
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Industry Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h3>
              {industryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={industryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.industry}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {industryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-center py-12">No data available</p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {dashboardData?.recent_activity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FiMail className="text-primary-600 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.email}
                      </p>
                      <p className="text-xs text-gray-500">{activity.company_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Status: <span className="font-medium">{activity.status}</span>
                      </p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActionButton
                title="Create Campaign"
                description="Start a new cold email campaign"
                icon={<FiActivity />}
                onClick={() => router.push('/campaigns/new')}
              />
              <ActionButton
                title="Add Contacts"
                description="Import or add new contacts"
                icon={<FiUsers />}
                onClick={() => router.push('/contacts/new')}
              />
              <ActionButton
                title="View Analytics"
                description="Deep dive into performance"
                icon={<FiTrendingUp />}
                onClick={() => router.push('/analytics')}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, color }) {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h4 className="text-sm text-gray-600 mb-2">{title}</h4>
      <p className={`text-4xl font-bold ${colorClasses[color]} mb-1`}>{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}

function ActionButton({ title, description, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
    >
      <div className="flex-shrink-0 text-primary-600 text-2xl mr-3">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </button>
  );
}
