import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { campaigns } from '@/lib/api';
import {
  FiPlus, FiPlay, FiPause, FiEdit, FiTrash, FiActivity,
  FiMail, FiEye, FiMousePointer, FiMessageCircle, FiX
} from 'react-icons/fi';

export default function Campaigns() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaignsList, setCampaignsList] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
  });
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadCampaigns();
  }, [filters]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaigns.getAll(filters);
      setCampaignsList(response.data.campaigns);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (id) => {
    try {
      await campaigns.start(id);
      loadCampaigns();
    } catch (error) {
      alert('Failed to start campaign: ' + error.response?.data?.error);
    }
  };

  const handlePause = async (id) => {
    try {
      await campaigns.pause(id);
      loadCampaigns();
    } catch (error) {
      alert('Failed to pause campaign: ' + error.response?.data?.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      await campaigns.delete(id);
      loadCampaigns();
    } catch (error) {
      alert('Failed to delete campaign: ' + error.response?.data?.error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Campaigns - AI Cold Email Automation</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <FiActivity className="text-primary-600 text-2xl mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
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
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Email Campaigns</h2>
              <p className="text-gray-600 mt-1">
                Create and manage your outreach campaigns
              </p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
            >
              <FiPlus />
              <span>New Campaign</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Campaigns List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading campaigns...</p>
            </div>
          ) : campaignsList.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FiActivity className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-6">Create your first email campaign to get started</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-flex items-center space-x-2"
              >
                <FiPlus />
                <span>Create Campaign</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {campaignsList.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onStart={handleStart}
                  onPause={handlePause}
                  onDelete={handleDelete}
                  onView={() => router.push(`/campaigns/${campaign.id}`)}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{filters.page}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </main>

        {/* New Campaign Modal */}
        {showNewModal && (
          <NewCampaignModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              loadCampaigns();
            }}
          />
        )}
      </div>
    </>
  );
}

function CampaignCard({ campaign, onStart, onPause, onDelete, onView, getStatusColor }) {
  const totalContacts = campaign.total_contacts || 0;
  const completedContacts = campaign.completed_contacts || 0;
  const emailsSent = campaign.emails_sent || 0;
  const progress = totalContacts > 0 ? (completedContacts / totalContacts) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-xl font-bold text-gray-900 mr-3">{campaign.name}</h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
              {campaign.status}
            </span>
          </div>
          {campaign.description && (
            <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
            {campaign.target_industry && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Industry: {campaign.target_industry}
              </span>
            )}
            {campaign.target_company_size && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Size: {campaign.target_company_size}
              </span>
            )}
            <span className="px-2 py-1 bg-gray-100 rounded">
              Daily Limit: {campaign.daily_limit}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 ml-4">
          {campaign.status === 'draft' && (
            <button
              onClick={() => onStart(campaign.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
              title="Start Campaign"
            >
              <FiPlay className="text-xl" />
            </button>
          )}
          {campaign.status === 'active' && (
            <button
              onClick={() => onPause(campaign.id)}
              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
              title="Pause Campaign"
            >
              <FiPause className="text-xl" />
            </button>
          )}
          {campaign.status === 'paused' && (
            <button
              onClick={() => onStart(campaign.id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
              title="Resume Campaign"
            >
              <FiPlay className="text-xl" />
            </button>
          )}
          <button
            onClick={onView}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
            title="View Details"
          >
            <FiEdit className="text-xl" />
          </button>
          <button
            onClick={() => onDelete(campaign.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            title="Delete Campaign"
          >
            <FiTrash className="text-xl" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center text-gray-600 mb-1">
            <FiMail className="mr-1" />
            <span className="text-xs">Sent</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{emailsSent}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center text-gray-600 mb-1">
            <FiEye className="mr-1" />
            <span className="text-xs">Opens</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">-</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center text-gray-600 mb-1">
            <FiMousePointer className="mr-1" />
            <span className="text-xs">Clicks</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">-</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center text-gray-600 mb-1">
            <FiMessageCircle className="mr-1" />
            <span className="text-xs">Replies</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">-</div>
        </div>
      </div>

      {/* Progress */}
      {totalContacts > 0 && (
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{completedContacts} / {totalContacts} contacts</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewCampaignModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'email',
    target_industry: '',
    target_company_size: '',
    daily_limit: 50,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await campaigns.create({
        ...formData,
        daily_limit: parseInt(formData.daily_limit),
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create campaign: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Create New Campaign</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="text-2xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Q1 Finance Outreach Campaign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Brief description of your campaign goals..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Industry
                </label>
                <select
                  name="target_industry"
                  value={formData.target_industry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Industries</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Company Size
                </label>
                <select
                  name="target_company_size"
                  value={formData.target_company_size}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Sizes</option>
                  <option value="1-99">1-99</option>
                  <option value="100-499">100-499</option>
                  <option value="500-999">500-999</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Email Limit
              </label>
              <input
                type="number"
                name="daily_limit"
                value={formData.daily_limit}
                onChange={handleChange}
                min="1"
                max="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: Start with 50-100 emails per day for better deliverability
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Next steps after creating:</strong> Add contacts to your campaign and configure
                email sequences in the campaign details page.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
