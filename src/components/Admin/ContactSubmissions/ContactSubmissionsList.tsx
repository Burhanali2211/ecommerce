import React, { useEffect, useState } from 'react';
import { 
  Search, Eye, Filter, X, Mail, Clock, 
  CheckCircle, AlertCircle, Loader2, ChevronLeft, ChevronRight,
  RefreshCw, Archive, MessageSquare, User, Phone
} from 'lucide-react';
import { apiClient } from '../../../config/api';
import { useNotification } from '../../../contexts/NotificationContext';
import { ContactSubmissionDetails } from './ContactSubmissionDetails';
import { useAdminDashboardSettings } from '../../../hooks/useAdminDashboardSettings';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  admin_notes?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  replied_at?: string;
  replied_by?: string;
  replied_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const ContactSubmissionsList: React.FC = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const { settings } = useAdminDashboardSettings();

  const pageSize = 20;

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await apiClient.get(`/admin/contact-submissions?${params}`);

      if (response.data.success) {
        setSubmissions(response.data.data.submissions);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalItems(response.data.data.pagination.total);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error?.userMessage || error.message || 'Failed to load contact submissions'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const response = await apiClient.patch(`/admin/contact-submissions/${id}`, {
        status,
        admin_notes: adminNotes
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Contact submission updated successfully'
        });
        fetchSubmissions();
        if (selectedSubmissionId === id) {
          setSelectedSubmissionId(null);
        }
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error?.userMessage || error.message || 'Failed to update submission'
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'read': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'replied': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  };

  if (selectedSubmissionId) {
    const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
    if (selectedSubmission) {
      return (
        <ContactSubmissionDetails
          submission={selectedSubmission}
          onBack={() => setSelectedSubmissionId(null)}
          onUpdate={updateStatus}
        />
      );
    }
  }

  const newCount = submissions.filter(s => s.status === 'new').length;
  const readCount = submissions.filter(s => s.status === 'read').length;
  const repliedCount = submissions.filter(s => s.status === 'replied').length;
  const archivedCount = submissions.filter(s => s.status === 'archived').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`
            }}
          >
            <Mail className="w-6 h-6" style={{ color: settings.primary_color_from }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Contact Submissions</h2>
            <p className="text-sm text-white/60 mt-0.5">Manage customer inquiries and messages</p>
          </div>
        </div>
        <button
          onClick={fetchSubmissions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="bg-gradient-to-br backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group"
          style={{
            background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{
                background: `${settings.primary_color_from}30`
              }}
            >
              <MessageSquare className="w-5 h-5" style={{ color: settings.primary_color_from }} />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalItems}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail className="w-5 h-5 text-blue-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">New</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{newCount}</p>
        </div>

        <div 
          className="bg-gradient-to-br backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group"
          style={{
            background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{
                background: `${settings.primary_color_from}30`
              }}
            >
              <Clock className="w-5 h-5" style={{ color: settings.primary_color_from }} />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Read</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{readCount}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Replied</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{repliedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {(searchTerm || statusFilter) && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear All
            </button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, email, subject, or message..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:border-white/20 text-sm text-white placeholder-white/40 transition-all"
              style={{
                '--tw-ring-color': `${settings.primary_color_from}50`
              } as React.CSSProperties}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:border-white/20 text-sm text-white transition-all"
            style={{
              '--tw-ring-color': `${settings.primary_color_from}50`
            } as React.CSSProperties}
          >
            <option value="" className="bg-gray-900">All Status</option>
            <option value="new" className="bg-gray-900">New</option>
            <option value="read" className="bg-gray-900">Read</option>
            <option value="replied" className="bg-gray-900">Replied</option>
            <option value="archived" className="bg-gray-900">Archived</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: settings.primary_color_from }} />
          <p className="text-white/60 ml-3">Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <Mail className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No submissions found</h3>
          <p className="text-white/60">
            {searchTerm || statusFilter 
              ? 'Try adjusting your filters' 
              : 'No contact submissions yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-white">{submission.name}</div>
                          <div className="text-sm text-white/60">{submission.email}</div>
                          {submission.phone && (
                            <div className="text-xs text-white/40">{submission.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white max-w-xs truncate">
                          {submission.subject}
                        </div>
                        <div className="text-xs text-white/60 max-w-xs truncate mt-1">
                          {submission.message.substring(0, 60)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedSubmissionId(submission.id)}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 p-2 rounded-lg transition-all hover:scale-110"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10">
              <div className="text-sm text-white/60">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} submissions
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

