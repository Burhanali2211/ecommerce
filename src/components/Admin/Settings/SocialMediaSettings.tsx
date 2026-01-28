import React, { useState, useEffect } from 'react';
import { Share2, Plus, Edit2, Trash2, Save, X, RefreshCw, ChevronUp, ChevronDown, Eye, EyeOff, CheckSquare, Square, Loader2, Filter, Search, ExternalLink } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface SocialMediaAccount {
  id: string;
  platform: string;
  platform_name: string;
  url: string;
  username: string | null;
  icon_name: string;
  is_active: boolean;
  display_order: number;
  follower_count: number | null;
  description: string | null;
}

const platformOptions = [
  { value: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { value: 'twitter', label: 'Twitter / X', icon: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { value: 'tiktok', label: 'TikTok', icon: 'Music' },
  { value: 'pinterest', label: 'Pinterest', icon: 'Pin' },
  { value: 'snapchat', label: 'Snapchat', icon: 'Ghost' }
];

export const SocialMediaSettings: React.FC = () => {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    platform_name: '',
    url: '',
    username: '',
    icon_name: '',
    follower_count: '',
    description: ''
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  // Fetch accounts
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/settings/social-media');
      if (response.success) {
        setAccounts(response.data.sort((a: SocialMediaAccount, b: SocialMediaAccount) => a.display_order - b.display_order));
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch social media accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Open modal for add/edit
  const openModal = (account?: SocialMediaAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        platform: account.platform,
        platform_name: account.platform_name,
        url: account.url,
        username: account.username || '',
        icon_name: account.icon_name,
        follower_count: account.follower_count?.toString() || '',
        description: account.description || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        platform: '',
        platform_name: '',
        url: '',
        username: '',
        icon_name: '',
        follower_count: '',
        description: ''
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    setFormData({
      platform: '',
      platform_name: '',
      url: '',
      username: '',
      icon_name: '',
      follower_count: '',
      description: ''
    });
  };

  // Handle platform selection
  const handlePlatformChange = (platform: string) => {
    const selected = platformOptions.find(p => p.value === platform);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        platform,
        platform_name: selected.label,
        icon_name: selected.icon
      }));
    }
  };

  // Save account
  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        follower_count: formData.follower_count ? parseInt(formData.follower_count) : null
      };

      const response = editingAccount
        ? await apiClient.put(`/admin/settings/social-media/${editingAccount.id}`, payload)
        : await apiClient.post('/admin/settings/social-media', payload);

      if (response.success) {
        showSuccess(`Account ${editingAccount ? 'updated' : 'added'} successfully!`);
        await fetchAccounts();
        closeModal();
      }
    } catch (error: any) {
      showError(error.message || 'Error saving account');
    }
  };

  // Delete account
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social media account?')) return;

    try {
      const response = await apiClient.delete(`/admin/settings/social-media/${id}`);
      if (response.success) {
        showSuccess('Account deleted successfully!');
        await fetchAccounts();
      }
    } catch (error: any) {
      showError(error.message || 'Error deleting account');
    }
  };

  // Bulk delete accounts
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} social media account(s)?`)) return;

    try {
      const response = await apiClient.post('/admin/settings/social-media/bulk-delete', {
        ids: Array.from(selectedIds)
      });

      if (response.success) {
        showSuccess(response.message || `${count} account(s) deleted successfully!`);
        setSelectedIds(new Set());
        setSelectionMode(false);
        await fetchAccounts();
      }
    } catch (error: any) {
      showError(error.message || 'Error deleting accounts');
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedIds(new Set());
    }
  };

  // Toggle individual selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all accounts
  const selectAll = () => {
    setSelectedIds(new Set(accounts.map(account => account.id)));
  };

  // Deselect all accounts
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Toggle active status
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const account = accounts.find(a => a.id === id);
      if (!account) return;

      const response = await apiClient.put(`/admin/settings/social-media/${id}`, {
        ...account,
        is_active: !currentStatus
      });

      if (response.success) {
        showSuccess(`Account ${!currentStatus ? 'activated' : 'deactivated'}`);
        await fetchAccounts();
      }
    } catch (error: any) {
      showError(error.message || 'Error updating account status');
    }
  };

  // Move account up/down
  const moveAccount = async (id: string, direction: 'up' | 'down') => {
    const index = accounts.findIndex(a => a.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === accounts.length - 1) return;

    const newAccounts = [...accounts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newAccounts[index], newAccounts[targetIndex]] = [newAccounts[targetIndex], newAccounts[index]];

    // Update display orders
    newAccounts.forEach((account, idx) => {
      account.display_order = idx + 1;
    });

    setAccounts(newAccounts);

    // Save to backend
    try {
      await Promise.all(
        newAccounts.map(account =>
          apiClient.put(`/admin/settings/social-media/${account.id}`, account)
        )
      );
    } catch (error: any) {
      showError(error.message || 'Error updating order');
      await fetchAccounts();
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchTerm || 
      account.platform_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.username && account.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlatform = !platformFilter || account.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  // Get unique platforms for filter
  const platforms = Array.from(new Set(accounts.map(a => a.platform))).sort();

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      youtube: '📺',
      linkedin: '💼',
      pinterest: '📌',
      tiktok: '🎵',
      whatsapp: '💬',
      telegram: '✈️',
      snapchat: '👻',
    };
    return icons[platform.toLowerCase()] || '🌐';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading social media accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Share2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Social Media</h1>
              <p className="text-sm text-white/60 mt-0.5">Manage your social media accounts and links</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {selectionMode && selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
            >
              <Trash2 className="h-5 w-5" />
              <span className="hidden sm:inline">Delete ({selectedIds.size})</span>
              <span className="sm:hidden">Delete</span>
            </button>
          )}
          <button
            onClick={toggleSelectionMode}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${
              selectionMode
                ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            {selectionMode ? (
              <>
                <X className="h-5 w-5" />
                <span className="hidden sm:inline">Cancel</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-5 w-5" />
                <span className="hidden sm:inline">Select</span>
              </>
            )}
          </button>
          {!selectionMode && (
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
            >
              <Plus className="h-5 w-5" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {(searchTerm || platformFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPlatformFilter('');
              }}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all"
            />
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform} className="bg-gray-900 capitalize">
                {platform}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selection Mode Controls */}
      {selectionMode && (
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white">
              {selectedIds.size} of {accounts.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <Share2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60 mb-2">No social media accounts found</p>
          {searchTerm || platformFilter ? (
            <p className="text-sm text-white/40">Try adjusting your filters</p>
          ) : (
            <p className="text-sm text-white/40">Get started by adding your first account</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account, index) => (
            <div
              key={account.id}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 transition-all hover:bg-white/10 ${
                !account.is_active ? 'opacity-60' : ''
              } ${selectionMode && selectedIds.has(account.id) ? 'bg-indigo-500/20 border-indigo-500/30' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {selectionMode && (
                    <button
                      onClick={() => toggleSelect(account.id)}
                      className="flex-shrink-0"
                    >
                      {selectedIds.has(account.id) ? (
                        <CheckSquare className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <Square className="h-5 w-5 text-white/40" />
                      )}
                    </button>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl ${
                    account.is_active ? 'bg-blue-500/20' : 'bg-white/10'
                  }`}>
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{account.platform_name}</h3>
                    {account.username && (
                      <p className="text-sm text-white/60 truncate">@{account.username}</p>
                    )}
                  </div>
                </div>
                {!selectionMode && (
                  <button
                    onClick={() => toggleActive(account.id, account.is_active)}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      account.is_active 
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' 
                        : 'bg-white/10 text-white/40 hover:bg-white/20'
                    }`}
                    title={account.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {account.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* URL Display */}
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-white/60">Profile URL</span>
                </div>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 break-all block truncate"
                  title={account.url}
                >
                  {account.url}
                </a>
              </div>

              {account.follower_count && (
                <div className="mb-4 p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                  <p className="text-xs text-white/60 mb-1">Followers</p>
                  <p className="text-lg font-semibold text-white">{account.follower_count.toLocaleString()}</p>
                </div>
              )}

              {account.description && (
                <p className="text-sm text-white/70 mb-4 line-clamp-2">{account.description}</p>
              )}

              {!selectionMode && (
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => moveAccount(account.id, 'up')}
                    disabled={index === 0}
                    className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => moveAccount(account.id, 'down')}
                    disabled={index === filteredAccounts.length - 1}
                    className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(account)}
                    className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center justify-center gap-2 transition-colors border border-blue-500/30"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {accounts.length === 0 && !loading && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/10">
          <Share2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-4">No social media accounts added yet</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 inline-flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-5 w-5" />
            Add Your First Account
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white">
                {editingAccount ? 'Edit' : 'Add'} Social Media Account
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Platform *</label>
                <select
                  value={formData.platform}
                  onChange={(e) => handlePlatformChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white transition-all"
                  required
                >
                  <option value="" className="bg-gray-900">Select a platform</option>
                  {platformOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-gray-900">{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Profile URL *</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="https://facebook.com/yourpage"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Username/Handle</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="@yourhandle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Follower Count</label>
                <input
                  type="number"
                  value={formData.follower_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, follower_count: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all resize-none"
                  rows={3}
                  placeholder="Brief description about this account"
                />
              </div>
            </div>

            <div className="bg-white/5 px-6 py-4 flex items-center justify-end gap-3 border-t border-white/10 rounded-b-2xl sticky bottom-0">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.platform || !formData.url}
                className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-semibold"
              >
                <Save className="h-4 w-4" />
                {editingAccount ? 'Update' : 'Add'} Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

