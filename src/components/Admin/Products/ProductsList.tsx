import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Package } from 'lucide-react';
import { DataTable, Column } from '../../Common/DataTable';
import { ConfirmModal } from '../../Common/Modal';
import { apiClient } from '../../../lib/apiClient';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAdminDashboardSettings } from '../../../hooks/useAdminDashboardSettings';
import { isValidImageUrl, getFirstValidImage } from '../../../utils/imageUrlUtils';

interface Product {
  id: string;
  name: string;
  price: string;
  original_price: string;
  stock: number;
  category_name: string;
  is_active: boolean;
  images: string[];
  created_at: string;
}

export const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showSuccess, showError } = useNotification();
  const { settings } = useAdminDashboardSettings();

  const pageSize = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await apiClient.get(`/admin/products?${params}`);

      if (response.success) {
        setProducts(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalItems(response.pagination.total);
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      await apiClient.delete(`/admin/products/${selectedProduct.id}`);
      showSuccess('Success', 'Product deleted successfully');
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleAdd = () => {
    navigate('/admin/products/add');
  };

  const columns: Column<Product>[] = [
    {
      key: 'images',
      label: 'Image',
      width: '60px',
      render: (product) => {
        // Use utility function to get first valid image
        const imageUrl = getFirstValidImage(
          product.images || [],
          '/placeholder-image.jpg'
        );
        
        const isValidImage = isValidImageUrl(imageUrl);
        
        return (
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 flex items-center justify-center">
            {isValidImage ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/40 text-xs">
                No Image
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (product) => (
        <div className="min-w-0">
          <p className="font-medium text-xs sm:text-sm text-white truncate">{product.name}</p>
          <p className="text-xs text-white/60 truncate">{product.category_name}</p>
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (product) => (
        <div>
          <p className="font-semibold text-xs sm:text-sm text-white">₹{Number(product.price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          {product.original_price && (
            <p className="text-xs text-white/60 line-through">
              ₹{Number(product.original_price).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      sortable: true,
      render: (product) => (
        <span
          className={`px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full border ${product.stock === 0
            ? 'bg-red-500/20 text-red-300 border-red-500/40'
            : product.stock < 10
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
        >
          {product.stock}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (product) => (
        <span
          className={`px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full border ${product.is_active
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : 'bg-white/5 text-white/60 border-white/20'
            }`}
        >
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '80px',
      render: (product) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleEdit(product)}
            className="p-1.5 sm:p-2 text-blue-400 hover:bg-blue-500/20 active:bg-blue-500/30 rounded-lg transition-all hover:scale-110 min-h-[44px] sm:min-h-auto flex items-center justify-center"
            title="Edit"
            aria-label="Edit product"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedProduct(product);
              setShowDeleteModal(true);
            }}
            className="p-1.5 sm:p-2 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all hover:scale-110 min-h-[44px] sm:min-h-auto flex items-center justify-center"
            title="Delete"
            aria-label="Delete product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const activeProducts = products.filter(p => p.is_active).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockProducts = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`
            }}
          >
            <Package className="w-6 h-6" style={{ color: settings.primary_color_from }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Products</h1>
            <p className="text-sm text-white/60 mt-0.5">Manage your product catalog</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          style={{
            background: `linear-gradient(to right, ${settings.primary_color_from}, ${settings.primary_color_to})`
          }}
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Add Product</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Quick Stats */}
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
              <Package className="w-5 h-5" style={{ color: settings.primary_color_from }} />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total Products</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalItems}</p>
        </div>

        <div 
          className="bg-gradient-to-br backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all group"
          style={{
            background: `linear-gradient(to bottom right, ${settings.secondary_color_from}20, ${settings.secondary_color_to}20)`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{
                background: `${settings.secondary_color_from}30`
              }}
            >
              <Package className="w-5 h-5" style={{ color: settings.secondary_color_from }} />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Active Products</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{activeProducts}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-yellow-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5 text-yellow-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Low Stock</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{lowStockProducts}</p>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-red-500/40 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5 text-red-300" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Out of Stock</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{outOfStockProducts}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-white/60" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
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
            <option value="active" className="bg-gray-900">Active</option>
            <option value="inactive" className="bg-gray-900">Inactive</option>
          </select>
          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('');
              setStatusFilter('');
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        pagination={{
          currentPage,
          totalPages,
          pageSize,
          totalItems,
          onPageChange: setCurrentPage
        }}
        emptyMessage="No products found"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

