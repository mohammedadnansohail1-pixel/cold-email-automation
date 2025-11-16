import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { contacts, companies } from '@/lib/api';
import {
  FiPlus, FiEdit, FiTrash, FiSearch, FiMail,
  FiUsers, FiX, FiUpload, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';

export default function Contacts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contactsList, setContactsList] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    seniority_level: '',
    opted_out: '',
    page: 1,
  });
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadContacts();
  }, [filters]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await contacts.getAll(filters);
      setContactsList(response.data.contacts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await contacts.delete(id);
      loadContacts();
    } catch (error) {
      alert('Failed to delete contact: ' + error.response?.data?.error);
    }
  };

  return (
    <>
      <Head>
        <title>Contacts - AI Cold Email Automation</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <FiUsers className="text-primary-600 text-2xl mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Contacts</h1>
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
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contacts</h2>
              <p className="text-gray-600 mt-1">
                Manage your contact database ({pagination.total || 0} total)
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
              >
                <FiUpload />
                <span>Bulk Import</span>
              </button>
              <button
                onClick={() => setShowNewModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <FiPlus />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={filters.search}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <select
                value={filters.seniority_level}
                onChange={(e) => handleFilterChange('seniority_level', e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Seniority Levels</option>
                <option value="C-Level">C-Level</option>
                <option value="VP">VP</option>
                <option value="Director">Director</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>

          {/* Contacts Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading contacts...</p>
            </div>
          ) : contactsList.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FiUsers className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-600 mb-6">Start by adding your first contact</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-flex items-center space-x-2"
              >
                <FiPlus />
                <span>Add Contact</span>
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contactsList.map((contact) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold">
                                {contact.first_name?.[0]}{contact.last_name?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <FiMail className="mr-1" />
                                {contact.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{contact.title || 'N/A'}</div>
                          {contact.seniority_level && (
                            <div className="text-xs text-gray-500">{contact.seniority_level}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{contact.company_name || 'N/A'}</div>
                          {contact.company_industry && (
                            <div className="text-xs text-gray-500">{contact.company_industry}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900 mr-2">
                              {contact.score || 0}
                            </div>
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${contact.score || 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {contact.opted_out ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Opted Out
                            </span>
                          ) : contact.email_valid ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Invalid Email
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                            className="text-primary-600 hover:text-primary-900 mr-3"
                          >
                            <FiEdit className="inline" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(contact.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash className="inline" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg">
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
            </>
          )}
        </main>

        {/* New Contact Modal */}
        {showNewModal && (
          <NewContactModal
            onClose={() => setShowNewModal(false)}
            onSuccess={() => {
              setShowNewModal(false);
              loadContacts();
            }}
          />
        )}

        {/* Bulk Import Modal */}
        {showBulkModal && (
          <BulkImportModal
            onClose={() => setShowBulkModal(false)}
            onSuccess={() => {
              setShowBulkModal(false);
              loadContacts();
            }}
          />
        )}
      </div>
    </>
  );
}

function NewContactModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [companiesList, setCompaniesList] = useState([]);
  const [formData, setFormData] = useState({
    company_id: '',
    email: '',
    first_name: '',
    last_name: '',
    title: '',
    department: '',
    seniority_level: '',
    linkedin_url: '',
    phone: '',
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await companies.getAll({ limit: 100 });
      setCompaniesList(response.data.companies);
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await contacts.create({
        ...formData,
        company_id: parseInt(formData.company_id),
      });
      onSuccess();
    } catch (error) {
      alert('Failed to create contact: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Add New Contact</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="text-2xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <select
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Company</option>
                {companiesList.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="john@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Chief Technology Officer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Technology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seniority Level
                </label>
                <select
                  name="seniority_level"
                  value={formData.seniority_level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select Level</option>
                  <option value="C-Level">C-Level</option>
                  <option value="VP">VP</option>
                  <option value="Director">Director</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+1 555-123-4567"
              />
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
                {loading ? 'Creating...' : 'Create Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BulkImportModal({ onClose, onSuccess }) {
  const [result, setResult] = useState(null);

  const handleSuccess = (importResult) => {
    setResult(importResult);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Bulk Import Contacts</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FiX className="text-2xl" />
            </button>
          </div>

          {result ? (
            <div className="text-center py-8">
              <FiCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Import Successful!</h4>
              <p className="text-gray-600 mb-4">
                Created: {result.created} | Failed: {result.failed}
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiUpload className="text-gray-300 text-6xl mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">CSV Import Coming Soon</h4>
              <p className="text-gray-600 mb-6">
                Bulk import functionality will be available in the next update.
              </p>
              <p className="text-sm text-gray-500">
                For now, you can use the API endpoint directly:
                <br />
                POST /api/contacts/bulk
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
