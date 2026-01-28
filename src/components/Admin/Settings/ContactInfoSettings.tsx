import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, Save, X, RefreshCw, Mail, MapPin, MessageCircle, Star, Eye, EyeOff, CheckSquare, Square, Loader2, Filter, Search } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';

interface ContactInfo {
  id: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
  is_active: boolean;
  display_order: number;
  icon_name: string;
  additional_info: any;
}

const contactTypes = [
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'address', label: 'Address', icon: MapPin },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle }
];

export const ContactInfoSettings: React.FC = () => {
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactInfo | null>(null);
  const [formData, setFormData] = useState({
    contact_type: '',
    label: '',
    value: '',
    icon_name: ''
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/settings/contact-info');
      if (response.success) {
        setContacts(response.data.sort((a: ContactInfo, b: ContactInfo) => a.display_order - b.display_order));
      }
    } catch (error: any) {
      showError(error.message || 'Failed to fetch contact information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Open modal
  const openModal = (contact?: ContactInfo) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        contact_type: contact.contact_type,
        label: contact.label,
        value: contact.value,
        icon_name: contact.icon_name
      });
    } else {
      setEditingContact(null);
      setFormData({
        contact_type: '',
        label: '',
        value: '',
        icon_name: ''
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      contact_type: '',
      label: '',
      value: '',
      icon_name: ''
    });
  };

  // Handle type change
  const handleTypeChange = (type: string) => {
    const selected = contactTypes.find(t => t.value === type);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        contact_type: type,
        icon_name: selected.icon.name || type
      }));
    }
  };

  // Save contact
  const handleSave = async () => {
    try {
      const response = editingContact
        ? await apiClient.put(`/admin/settings/contact-info/${editingContact.id}`, formData)
        : await apiClient.post('/admin/settings/contact-info', formData);

      if (response.success) {
        showSuccess(`Contact ${editingContact ? 'updated' : 'added'} successfully!`);
        await fetchContacts();
        closeModal();
      }
    } catch (error: any) {
      showError(error.message || 'Error saving contact');
    }
  };

  // Delete contact
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact information?')) return;

    try {
      const response = await apiClient.delete(`/admin/settings/contact-info/${id}`);
      if (response.success) {
        showSuccess('Contact deleted successfully!');
        await fetchContacts();
      }
    } catch (error: any) {
      showError(error.message || 'Error deleting contact');
    }
  };

  // Bulk delete contacts
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} contact information entry/entries?`)) return;

    try {
      const response = await apiClient.post('/admin/settings/contact-info/bulk-delete', {
        ids: Array.from(selectedIds)
      });

      if (response.success) {
        showSuccess(response.message || `${count} contact(s) deleted successfully!`);
        setSelectedIds(new Set());
        setSelectionMode(false);
        await fetchContacts();
      }
    } catch (error: any) {
      showError(error.message || 'Error deleting contacts');
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

  // Select all contacts
  const selectAll = () => {
    setSelectedIds(new Set(contacts.map(contact => contact.id)));
  };

  // Deselect all contacts
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Toggle active
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const contact = contacts.find(c => c.id === id);
      if (!contact) return;

      const response = await apiClient.put(`/admin/settings/contact-info/${id}`, {
        ...contact,
        is_active: !currentStatus
      });

      if (response.success) {
        showSuccess(`Contact ${!currentStatus ? 'activated' : 'deactivated'}`);
        await fetchContacts();
      }
    } catch (error: any) {
      showError(error.message || 'Error updating contact status');
    }
  };

  // Set as primary
  const setPrimary = async (id: string) => {
    try {
      const contact = contacts.find(c => c.id === id);
      if (!contact) return;

      const response = await apiClient.put(`/admin/settings/contact-info/${id}`, {
        ...contact,
        is_primary: true
      });

      if (response.success) {
        showSuccess('Contact set as primary');
        await fetchContacts();
      }
    } catch (error: any) {
      showError(error.message || 'Error setting primary contact');
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contact_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || contact.contact_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Group by type
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    if (!acc[contact.contact_type]) {
      acc[contact.contact_type] = [];
    }
    acc[contact.contact_type].push(contact);
    return acc;
  }, {} as Record<string, ContactInfo[]>);

  // Get unique types for filter
  const contactTypesList = Array.from(new Set(contacts.map(c => c.contact_type))).sort();

  // Stats
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.is_active).length;
  const primaryContacts = contacts.filter(c => c.is_primary).length;
  const totalTypes = contactTypesList.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading contact information...</p>
        </div>
      </div>
    );
  }

  const getIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      phone: Phone,
      email: Mail,
      address: MapPin,
      whatsapp: MessageCircle
    };
    return iconMap[type] || Phone;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Contact Information</h1>
              <p className="text-sm text-white/60 mt-0.5">Manage your contact details and information</p>
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
              <span>Add Contact</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats List - 2 per row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total Contacts</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalContacts}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Active Contacts</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{activeContacts}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-amber-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-amber-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Primary Contacts</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{primaryContacts}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Filter className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Contact Types</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalTypes}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {(searchTerm || typeFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
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
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Types</option>
            {contactTypesList.map((type) => (
              <option key={type} value={type} className="bg-gray-900 capitalize">
                {type}
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
              {selectedIds.size} of {contacts.length} selected
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

      {/* Grouped Contacts */}
      {Object.keys(groupedContacts).length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <Phone className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60 mb-2">No contact information found</p>
          {searchTerm || typeFilter ? (
            <p className="text-sm text-white/40">Try adjusting your filters</p>
          ) : (
            <p className="text-sm text-white/40">Get started by adding your first contact</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedContacts).map(([type, typeContacts]) => {
            const Icon = getIcon(type);
            return (
              <div key={type} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold text-white capitalize">{type}</h2>
                    <span className="ml-auto text-sm text-white/60">{typeContacts.length} {typeContacts.length === 1 ? 'entry' : 'entries'}</span>
                  </div>
                </div>

                <div className="divide-y divide-white/10">
                  {typeContacts
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((contact) => (
                      <div 
                        key={contact.id} 
                        className={`p-4 sm:p-6 hover:bg-white/5 transition-colors ${!contact.is_active ? 'opacity-60' : ''} ${selectionMode && selectedIds.has(contact.id) ? 'bg-indigo-500/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {selectionMode && (
                              <button
                                onClick={() => toggleSelect(contact.id)}
                                className="mt-1 flex-shrink-0"
                              >
                                {selectedIds.has(contact.id) ? (
                                  <CheckSquare className="h-5 w-5 text-indigo-400" />
                                ) : (
                                  <Square className="h-5 w-5 text-white/40" />
                                )}
                              </button>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-sm sm:text-base font-medium text-white">{contact.label}</h3>
                                {contact.is_primary && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-current" />
                                    Primary
                                  </span>
                                )}
                                {contact.is_active ? (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-white/10 text-white/60 border border-white/10 rounded-full">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/80 font-mono bg-white/5 px-3 py-2 rounded-lg break-all">
                                {contact.value}
                              </p>
                            </div>
                          </div>

                          {!selectionMode && (
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              {!contact.is_primary && contact.is_active && (
                                <button
                                  onClick={() => setPrimary(contact.id)}
                                  className="px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 flex items-center gap-1 transition-colors text-sm border border-amber-500/30"
                                  title="Set as primary"
                                >
                                  <Star className="h-4 w-4" />
                                  <span className="hidden sm:inline">Set Primary</span>
                                </button>
                              )}
                              <button
                                onClick={() => toggleActive(contact.id, contact.is_active)}
                                className={`p-2 rounded-lg transition-colors ${contact.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-white/10 text-white/40 hover:bg-white/20'
                                  }`}
                                title={contact.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {contact.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => openModal(contact)}
                                className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center gap-2 transition-colors border border-blue-500/30"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(contact.id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {contacts.length === 0 && !loading && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/10">
          <Phone className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-4">No contact information added yet</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 inline-flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-5 w-5" />
            Add Your First Contact
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-white/10">
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingContact ? 'Edit' : 'Add'} Contact Information
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
                <label className="block text-sm font-medium text-white/80 mb-2">Contact Type *</label>
                <select
                  value={formData.contact_type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white transition-all"
                  required
                >
                  <option value="" className="bg-gray-900">Select a type</option>
                  {contactTypes.map(type => (
                    <option key={type.value} value={type.value} className="bg-gray-900">{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Label *</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="e.g., Customer Support, Main Office"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Value *</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder={
                    formData.contact_type === 'email' ? 'email@example.com' :
                      formData.contact_type === 'phone' ? '+1 234 567 8900' :
                        formData.contact_type === 'address' ? '123 Main St, City, Country' :
                          'Contact value'
                  }
                  required
                />
              </div>
            </div>

            <div className="bg-white/5 px-6 py-4 flex items-center justify-end gap-3 border-t border-white/10 rounded-b-2xl">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.contact_type || !formData.label || !formData.value}
                className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-semibold"
              >
                <Save className="h-4 w-4" />
                {editingContact ? 'Update' : 'Add'} Contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

