import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { ConfirmModal } from '../../Common/Modal';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { normalizeImageUrl, isValidImageUrl, getSafeImageUrl } from '../../../utils/imageUrlUtils';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string | null;
  parent_name: string | null;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

export const CategoriesList: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'parent_name' | 'product_count' | 'is_active' | null>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCategories();
  }, [searchTerm, statusFilter]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      setCategories((data || []).map((c: any) => ({ ...c, parent_name: null, product_count: c.product_count ?? 0 })));
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      setDeleteLoading(true);
      const { error } = await supabase.from('categories').delete().eq('id', selectedCategory.id);
      if (error) throw error;
      showSuccess('Success', 'Category deleted successfully');
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    navigate(`/admin/categories/edit/${category.id}`);
  };

  const handleAdd = () => {
    navigate('/admin/categories/add');
  };

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term)
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === 'active';
      result = result.filter((cat) => cat.is_active === isActive);
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        // Normalize values for comparison
        const aNorm = typeof aVal === 'string' ? aVal.toLowerCase() : aVal;
        const bNorm = typeof bVal === 'string' ? bVal.toLowerCase() : bVal;

        if (aNorm === bNorm) return 0;
        if (aNorm == null) return 1;
        if (bNorm == null) return -1;

        const comparison = aNorm > bNorm ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [categories, searchTerm, statusFilter, sortKey, sortDirection]);

  const totalCategories = categories.length;
  const activeCategories = categories.filter((c) => c.is_active).length;
  const topLevelCategories = categories.filter((c) => !c.parent_id).length;

  const getValidImageUrl = (category: Category) => {
    // Use utility function to normalize and validate image URL
    const normalizedUrl = getSafeImageUrl(
      category.image_url,
      '/placeholder-image.jpg'
    );
    const isValid = isValidImageUrl(normalizedUrl);

    return {
      src: normalizedUrl,
      isValid: isValid,
    };
  };

  const hasActiveFilters = searchTerm || statusFilter;

  const handleSort = (key: 'name' | 'parent_name' | 'product_count' | 'is_active') => {
    setSortKey((currentKey) => {
      if (currentKey === key) {
        // Toggle direction when clicking the same column
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        return currentKey;
      }

      // Switch to a new sort column, reset to ascending
      setSortDirection('asc');
      return key;
    });
  };

  const getSortIndicator = (key: 'name' | 'parent_name' | 'product_count' | 'is_active') => {
    if (sortKey !== key) {
      return '↕';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-6">
      {/* Header with icon */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Tag className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Categories</h1>
            <p className="text-sm text-white/60 mt-0.5">
              Organize and manage your product categories
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20 min-h-[44px]"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Category</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-amber-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total Categories</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalCategories}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-emerald-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5 text-emerald-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Active Categories</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{activeCategories}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5 text-blue-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Top-level Categories</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{topLevelCategories}</p>
        </div>

        <div className="hidden lg:block bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-purple-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Tag className="w-5 h-5 text-purple-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Sub-categories</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {totalCategories - topLevelCategories}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">
              All Status
            </option>
            <option value="active" className="bg-gray-900">
              Active
            </option>
            <option value="inactive" className="bg-gray-900">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No categories found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left text-white/60 text-sm font-medium p-4 w-[60px]">
                    Image
                  </th>
                  <th className="text-left text-white/60 text-sm font-medium p-4">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span>Name</span>
                      <span className="text-xs opacity-70">
                        {getSortIndicator('name')}
                      </span>
                    </button>
                  </th>
                  <th className="text-left text-white/60 text-sm font-medium p-4">
                    <button
                      type="button"
                      onClick={() => handleSort('parent_name')}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span>Parent</span>
                      <span className="text-xs opacity-70">
                        {getSortIndicator('parent_name')}
                      </span>
                    </button>
                  </th>
                  <th className="text-left text-white/60 text-sm font-medium p-4">
                    <button
                      type="button"
                      onClick={() => handleSort('product_count')}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span>Products</span>
                      <span className="text-xs opacity-70">
                        {getSortIndicator('product_count')}
                      </span>
                    </button>
                  </th>
                  <th className="text-left text-white/60 text-sm font-medium p-4">
                    <button
                      type="button"
                      onClick={() => handleSort('is_active')}
                      className="inline-flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <span>Status</span>
                      <span className="text-xs opacity-70">
                        {getSortIndicator('is_active')}
                      </span>
                    </button>
                  </th>
                  <th className="text-left text-white/60 text-sm font-medium p-4 w-[90px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredCategories.map((category) => {
                  const image = getValidImageUrl(category);
                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
                          {image.isValid ? (
                            <img
                              src={image.src}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-image.jpg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="min-w-0">
                          <p className="font-medium text-xs sm:text-sm text-white truncate">
                            {category.name}
                          </p>
                          <p className="text-xs text-white/60 truncate">
                            {category.slug}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs sm:text-sm text-white/80 truncate">
                          {category.parent_name || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          {category.product_count || 0}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            category.is_active
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/5 text-white/60 border-white/20'
                          }`}
                        >
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 active:bg-blue-500/30 rounded-lg transition-all hover:scale-110"
                            title="Edit"
                            aria-label="Edit category"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCategory(category);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all hover:scale-110"
                            title="Delete"
                            aria-label="Delete category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

