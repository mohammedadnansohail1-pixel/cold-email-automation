import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'head';
import { analytics, campaigns as campaignsApi } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FiTrendingUp, FiMail, FiEye, FiMousePointer, FiMessageCircle,
  FiCalendar, FiFilter, FiDownload
} from 'react-icons/fi';

export default function Analytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [selectedCampaign, dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, campaignsRes] = await Promise.all([
        analytics.getDashboard(),
        campaignsApi.getAll({ limit: 100 })
      ]);

      setDashboardData(analyticsRes.data);
      setCampaigns(campaignsRes.data.campaigns);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};

  // Sample data for charts (in production, this would come from the API)
  const dailyData = [
    { date: 'Mon', sent: 45, opened: 32, clicked: 12, replied: 5 },
    { date: 'Tue', sent: 52, opened: 38, clicked: 15, replied: 7 },
    { date: 'Wed', sent: 48, opened: 35, clicked: 14, replied: 6 },
    { date: 'Thu', sent: 55, opened: 42, clicked: 18, replied: 8 },
    { date: 'Fri', sent: 50, opened: 40, clicked: 16, replied: 7 },
    { date: 'Sat', sent: 30, opened: 22, clicked: 9, replied: 4 },
    { date: 'Sun', sent: 25, opened: 18, clicked: 7, replied: 3 },
  ];

  const industryData = dashboardData?.industry_breakdown || [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <>
      <Head>
        <title>Analytics - AI Cold Email Automation</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <FiTrendingUp className="text-primary-600 text-2xl mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </button>
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
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header with Filters */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Performance Analytics</h2>
              <p className="text-gray-600 mt-2">Deep insights into your email campaigns</p>
            </div>
            <div className="flex space-x-3">
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>

              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2">
                <FiDownload />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              icon={<FiMail />}
              label="Total Emails Sent"
              value={stats.total_emails_sent || 0}
              change="+12%"
              changeType="positive"
            />
            <MetricCard
              icon={<FiEye />}
              label="Open Rate"
              value={`${stats.open_rate || 0}%`}
              change="+3.2%"
              changeType="positive"
            />
            <MetricCard
              icon={<FiMousePointer />}
              label="Click-Through Rate"
              value={`${((stats.total_clicks || 0) / (stats.total_emails_sent || 1) * 100).toFixed(1)}%`}
              change="-1.5%"
              changeType="negative"
            />
            <MetricCard
              icon={<FiMessageCircle />}
              label="Reply Rate"
              value={`${stats.reply_rate || 0}%`}
              change="+5.1%"
              changeType="positive"
            />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Email Activity Over Time */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Activity Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#3b82f6" name="Sent" />
                  <Line type="monotone" dataKey="opened" stroke="#10b981" name="Opened" />
                  <Line type="monotone" dataKey="clicked" stroke="#8b5cf6" name="Clicked" />
                  <Line type="monotone" dataKey="replied" stroke="#f59e0b" name="Replied" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Industry Performance */}
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
                      label={(entry) => `${entry.industry}: ${entry.count}`}
                      outerRadius={100}
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
                <div className="flex items-center justify-center h-64 text-gray-400">
                  No industry data available
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Engagement Funnel */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Funnel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { stage: 'Sent', count: stats.total_emails_sent || 0 },
                    { stage: 'Delivered', count: (stats.total_emails_sent || 0) - (stats.total_bounced || 0) },
                    { stage: 'Opened', count: stats.total_opens || 0 },
                    { stage: 'Clicked', count: stats.total_clicks || 0 },
                    { stage: 'Replied', count: stats.total_replies || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Best Performing Days */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Time Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="opened" fill="#10b981" name="Opened" />
                  <Bar dataKey="replied" fill="#f59e0b" name="Replied" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Campaign Comparison Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reply Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{campaign.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {campaign.emails_sent || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-600 font-medium">-</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-purple-600 font-medium">-</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-orange-600 font-medium">-</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function MetricCard({ icon, label, value, change, changeType }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-medium ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
