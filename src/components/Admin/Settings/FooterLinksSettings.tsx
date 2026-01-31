import React, { useState, useEffect } from 'react';
import { Link2, Plus, Edit2, Trash2, Save, X, RefreshCw, ChevronUp, ChevronDown, Eye, EyeOff, ExternalLink, CheckSquare, Square, Loader2, Filter, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';

interface FooterLink {
  id: string;
  section_name: string;
  link_text: string;
  link_url: string;
  display_order: number;
  is_active: boolean;
  opens_new_tab: boolean;
}

export const FooterLinksSettings: React.FC = () => {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState({
    section_name: '',
    link_text: '',
    link_url: '',
    opens_new_tab: false
  });
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const { showSuccess, showError } = useNotification();

  // Fetch footer links
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      showError(error.message || 'Failed to fetch footer links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Open modal
  const openModal = (link?: FooterLink) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        section_name: link.section_name,
        link_text: link.link_text,
        link_url: link.link_url,
        opens_new_tab: link.opens_new_tab
      });
    } else {
      setEditingLink(null);
      setFormData({
        section_name: '',
        link_text: '',
        link_url: '',
        opens_new_tab: false
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingLink(null);
    setFormData({
      section_name: '',
      link_text: '',
      link_url: '',
      opens_new_tab: false
    });
  };

  // Save link
  const handleSave = async () => {
    try {
      if (editingLink) {
        // Update existing link
        const { error } = await supabase
          .from('footer_links')
          .update(formData)
          .eq('id', editingLink.id);
        
        if (error) throw error;
      } else {
        // Create new link
        const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.display_order)) + 1 : 1;
        const { error } = await supabase
          .from('footer_links')
          .insert({ ...formData, display_order: maxOrder, is_active: true });
        
        if (error) throw error;
      }
      
      showSuccess(`Link ${editingLink ? 'updated' : 'added'} successfully!`);
      await fetchLinks();
      closeModal();
    } catch (error: any) {
      showError(error.message || 'Error saving link');
    }
  };

  // Delete link
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this footer link?')) return;

    try {
      const { error } = await supabase
        .from('footer_links')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      showSuccess('Link deleted successfully!');
      await fetchLinks();
    } catch (error: any) {
      showError(error.message || 'Error deleting link');
    }
  };

  // Bulk delete links
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`Are you sure you want to delete ${count} footer link(s)?`)) return;

    try {
      const { error } = await supabase
        .from('footer_links')
        .delete()
        .in('id', Array.from(selectedIds));
      
      if (error) throw error;
      showSuccess(`${count} link(s) deleted successfully!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      await fetchLinks();
    } catch (error: any) {
      showError(error.message || 'Error deleting links');
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

  // Select all links
  const selectAll = () => {
    setSelectedIds(new Set(links.map(link => link.id)));
  };

  // Deselect all links
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Toggle active
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('footer_links')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      await fetchLinks();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  // Move link up/down within section
  const moveLink = async (id: string, direction: 'up' | 'down') => {
    const link = links.find(l => l.id === id);
    if (!link) return;

    const sectionLinks = links.filter(l => l.section_name === link.section_name);
    const index = sectionLinks.findIndex(l => l.id === id);

    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sectionLinks.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    // Add non-null assertions since we've already validated the indices
    [sectionLinks[index]!, sectionLinks[targetIndex]!] = [sectionLinks[targetIndex]!, sectionLinks[index]!];

    // Update display orders
    sectionLinks.forEach((link, idx) => {
      link.display_order = idx + 1;
    });

    // Update state
    const newLinks = links.map(l => {
      const updated = sectionLinks.find(sl => sl.id === l.id);
      return updated || l;
    });
    setLinks(newLinks);

    // Save to backend
    try {
      for (const link of sectionLinks) {
        await supabase
          .from('footer_links')
          .update({ display_order: link.display_order })
          .eq('id', link.id);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      await fetchLinks();
    }
  };

  // Filter links
  const filteredLinks = links.filter(link => {
    const matchesSearch = !searchTerm || 
      link.link_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.link_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.section_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = !sectionFilter || link.section_name === sectionFilter;
    return matchesSearch && matchesSection;
  });

  // Group by section
  const groupedLinks = filteredLinks.reduce((acc: Record<string, FooterLink[]>, link: FooterLink) => {
    if (!acc[link.section_name]) {
      acc[link.section_name] = [];
    }
    acc[link.section_name]!.push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  // Get unique sections for filter
  const sections = Array.from(new Set(links.map(link => link.section_name))).sort();

  // Stats
  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.is_active).length;
  const totalSections = sections.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading footer links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Link2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Footer Links</h1>
              <p className="text-sm text-white/60 mt-0.5">Manage footer navigation links and sections</p>
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
              <span>Add Link</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-indigo-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Link2 className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total Links</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalLinks}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Active Links</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{activeLinks}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Filter className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Sections</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalSections}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ExternalLink className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">New Tab Links</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {links.filter(l => l.opens_new_tab).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {(searchTerm || sectionFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSectionFilter('');
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
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all"
            />
          </div>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section} className="bg-gray-900">
                {section}
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
              {selectedIds.size} of {links.length} selected
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

      {/* Grouped Links */}
      {Object.keys(groupedLinks).length === 0 ? (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
          <Link2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60 mb-2">No footer links found</p>
          {searchTerm || sectionFilter ? (
            <p className="text-sm text-white/40">Try adjusting your filters</p>
          ) : (
            <p className="text-sm text-white/40">Get started by adding your first footer link</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLinks).map(([section, sectionLinks]) => (
            <div key={section} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-lg font-semibold text-white">{section}</h2>
                  <span className="ml-auto text-sm text-white/60">{sectionLinks.length} {sectionLinks.length === 1 ? 'link' : 'links'}</span>
                </div>
              </div>

              <div className="divide-y divide-white/10">
                {sectionLinks
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((link, index) => (
                    <div 
                      key={link.id} 
                      className={`p-4 sm:p-6 hover:bg-white/5 transition-colors ${!link.is_active ? 'opacity-60' : ''} ${selectionMode && selectedIds.has(link.id) ? 'bg-indigo-500/20' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {selectionMode && (
                            <button
                              onClick={() => toggleSelect(link.id)}
                              className="mt-1 flex-shrink-0"
                            >
                              {selectedIds.has(link.id) ? (
                                <CheckSquare className="h-5 w-5 text-indigo-400" />
                              ) : (
                                <Square className="h-5 w-5 text-white/40" />
                              )}
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-sm sm:text-base font-medium text-white">{link.link_text}</h3>
                              {link.opens_new_tab && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  New Tab
                                </span>
                              )}
                              {link.is_active ? (
                                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-xs font-medium bg-white/10 text-white/60 border border-white/10 rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <a
                              href={link.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-400 hover:text-indigo-300 block truncate"
                            >
                              {link.link_url}
                            </a>
                          </div>
                        </div>

                        {!selectionMode && (
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={() => moveLink(link.id, 'up')}
                              disabled={index === 0}
                              className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveLink(link.id, 'down')}
                              disabled={index === sectionLinks.length - 1}
                              className="p-2 bg-white/10 text-white/60 rounded-lg hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(link.id, link.is_active)}
                              className={`p-2 rounded-lg transition-colors ${link.is_active ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-white/10 text-white/40 hover:bg-white/20'
                                }`}
                              title={link.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {link.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => openModal(link)}
                              className="px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 flex items-center gap-2 transition-colors"
                            >
                              <Edit2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(link.id)}
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
          ))}
        </div>
      )}

      {links.length === 0 && !loading && (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/10">
          <Link2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-4">No footer links added yet</p>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 inline-flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-5 w-5" />
            Add Your First Link
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-white/10">
            <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">
                {editingLink ? 'Edit' : 'Add'} Footer Link
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
                <label className="block text-sm font-medium text-white/80 mb-2">Section Name *</label>
                <input
                  type="text"
                  value={formData.section_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, section_name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="e.g., Shop, Customer Care, Company"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Link Text *</label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_text: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="e.g., About Us, Contact"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Link URL *</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all"
                  placeholder="/about or https://example.com"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="opens_new_tab"
                  checked={formData.opens_new_tab}
                  onChange={(e) => setFormData(prev => ({ ...prev, opens_new_tab: e.target.checked }))}
                  className="w-4 h-4 text-amber-500 border-white/20 rounded focus:ring-amber-500 bg-white/5"
                />
                <label htmlFor="opens_new_tab" className="text-sm text-white/80">
                  Open in new tab
                </label>
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
                disabled={!formData.section_name || !formData.link_text || !formData.link_url}
                className="px-6 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-semibold"
              >
                <Save className="h-4 w-4" />
                {editingLink ? 'Update' : 'Add'} Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};