import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { campaigns, contacts as contactsApi, ai } from '@/lib/api';
import {
  FiArrowLeft, FiPlay, FiPause, FiUsers, FiMail, FiEye,
  FiMousePointer, FiMessageCircle, FiSettings, FiPlus,
  FiCheckCircle, FiClock, FiAlertCircle, FiZap
} from 'react-icons/fi';

export default function CampaignDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  useEffect(() => {
    if (id) {
      loadCampaignData();
    }
  }, [id]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const [campaignRes, analyticsRes, contactsRes] = await Promise.all([
        campaigns.getOne(id),
        campaigns.getAnalytics(id),
        contactsApi.getAll({ limit: 100 })
      ]);

      setCampaign(campaignRes.data.campaign);
      setAnalytics(analyticsRes.data.analytics);
      setAvailableContacts(contactsRes.data.contacts);
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await campaigns.start(id);
      loadCampaignData();
    } catch (error) {
      alert('Failed to start campaign: ' + error.response?.data?.error);
    }
  };

  const handlePause = async () => {
    try {
      await campaigns.pause(id);
      loadCampaignData();
    } catch (error) {
      alert('Failed to pause campaign: ' + error.response?.data?.error);
    }
  };

  const handleAddContacts = async () => {
    if (selectedContacts.length === 0) {
      alert('Please select at least one contact');
      return;
    }

    try {
      await campaigns.addContacts(id, selectedContacts);
      setShowAddContacts(false);
      setSelectedContacts([]);
      loadCampaignData();
    } catch (error) {
      alert('Failed to add contacts: ' + error.response?.data?.error);
    }
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h2>
          <button
            onClick={() => router.push('/campaigns')}
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

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
        <title>{campaign.name} - Campaign Details</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/campaigns')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <FiArrowLeft className="mr-2" />
              Back to Campaigns
            </button>

            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 mr-3">{campaign.name}</h1>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
                {campaign.description && (
                  <p className="text-gray-600">{campaign.description}</p>
                )}
              </div>

              <div className="flex space-x-2">
                {campaign.status === 'draft' && (
                  <button
                    onClick={handleStart}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <FiPlay />
                    <span>Start Campaign</span>
                  </button>
                )}
                {campaign.status === 'active' && (
                  <button
                    onClick={handlePause}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                  >
                    <FiPause />
                    <span>Pause Campaign</span>
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button
                    onClick={handleStart}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <FiPlay />
                    <span>Resume Campaign</span>
                  </button>
                )}
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
                  <FiSettings />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<FiMail />}
              label="Emails Sent"
              value={analytics?.sent || 0}
              color="blue"
            />
            <StatCard
              icon={<FiEye />}
              label="Open Rate"
              value={`${analytics?.open_rate || 0}%`}
              subtitle={`${analytics?.opened || 0} opens`}
              color="green"
            />
            <StatCard
              icon={<FiMousePointer />}
              label="Click Rate"
              value={`${analytics?.click_rate || 0}%`}
              subtitle={`${analytics?.clicked || 0} clicks`}
              color="purple"
            />
            <StatCard
              icon={<FiMessageCircle />}
              label="Reply Rate"
              value={`${analytics?.reply_rate || 0}%`}
              subtitle={`${analytics?.replied || 0} replies`}
              color="orange"
            />
          </div>

          {/* Contacts Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiUsers className="mr-2" />
                Campaign Contacts
              </h2>
              <button
                onClick={() => setShowAddContacts(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <FiPlus />
                <span>Add Contacts</span>
              </button>
            </div>

            {campaign.contacts && campaign.contacts.length > 0 ? (
              <div className="space-y-3">
                {campaign.contacts.slice(0, 10).map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        Step: {contact.current_step || 0}
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        contact.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : contact.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {contact.status}
                      </span>
                    </div>
                  </div>
                ))}
                {campaign.contacts.length > 10 && (
                  <div className="text-center text-sm text-gray-500">
                    And {campaign.contacts.length - 10} more contacts...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiUsers className="text-gray-300 text-6xl mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No contacts added yet</p>
                <button
                  onClick={() => setShowAddContacts(true)}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  Add Contacts to Campaign
                </button>
              </div>
            )}
          </div>

          {/* Email Sequence */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Email Sequence</h2>
              <button
                onClick={() => setShowAIGenerator(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center space-x-2"
              >
                <FiZap />
                <span>Generate with AI</span>
              </button>
            </div>

            {campaign.sequence_data && campaign.sequence_data.length > 0 ? (
              <div className="space-y-4">
                {campaign.sequence_data.map((step, index) => (
                  <div key={index} className="flex items-start p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary-600 font-bold">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Step {step.step}
                        </h3>
                        {step.delay_days > 0 && (
                          <span className="ml-3 text-sm text-gray-500 flex items-center">
                            <FiClock className="mr-1" />
                            Wait {step.delay_days} days
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Template ID: {step.template_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiMail className="text-gray-300 text-6xl mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No email sequence configured</p>
                <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700">
                  Configure Sequence
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {campaign.recent_activities && campaign.recent_activities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {campaign.recent_activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        activity.status === 'sent' ? 'bg-blue-100' :
                        activity.opened_at ? 'bg-green-100' :
                        activity.clicked_at ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.status === 'sent' ? <FiMail className="text-blue-600" /> :
                         activity.opened_at ? <FiEye className="text-green-600" /> :
                         activity.clicked_at ? <FiMousePointer className="text-purple-600" /> :
                         <FiClock className="text-gray-600" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {activity.subject_line || 'Email sent'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.sent_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{activity.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Add Contacts Modal */}
        {showAddContacts && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Contacts to Campaign</h3>
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                  {availableContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddContacts(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContacts}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add {selectedContacts.length} Contacts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, subtitle, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}
