import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Power, Users as UsersIcon, Filter, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DataTable, Column } from '../../Common/DataTable';
import { ConfirmModal } from '../../Common/Modal';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { UserForm } from './UserForm';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  order_count: number;
  total_spent: string;
}

export const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (roleFilter) query = query.eq('role', roleFilter);
      if (statusFilter === 'active') query = query.eq('is_active', true);
      if (statusFilter === 'inactive') query = query.eq('is_active', false);
      if (searchTerm) query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      const rows = (data || []).map((p: any) => ({
        id: p.id,
        email: p.email || '',
        full_name: p.full_name || '',
        role: p.role || 'customer',
        is_active: p.is_active !== false,
        email_verified: true,
        created_at: p.created_at,
        order_count: 0,
        total_spent: '0'
      }));
      setUsers(rows);
      setTotalItems(count ?? 0);
      setTotalPages(Math.max(1, Math.ceil((count ?? 0) / pageSize)));
    } catch (error: any) {
      showError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setDeleteLoading(true);
      const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', selectedUser.id);
      if (error) throw error;
      showSuccess('User deactivated successfully');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showError(error.message || 'Failed to deactivate user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
      if (error) throw error;
      showSuccess(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error: any) {
      showError(error.message || 'Failed to update user status');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowFormModal(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setShowFormModal(true);
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setSelectedUser(null);
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      seller: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      customer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[role] || 'bg-white/10 text-white/60 border-white/10';
  };

  const columns: Column<User>[] = [
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (user) => (
        <div className="min-w-0">
          <p className="font-medium text-xs sm:text-sm text-white truncate">{user.full_name}</p>
          <p className="text-xs text-white/60 truncate">{user.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      render: (user) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getRoleBadgeColor(user.role)}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      )
    },
    {
      key: 'order_count',
      label: 'Orders',
      sortable: true,
      render: (user) => (
        <span className="text-xs sm:text-sm text-white/80">{user.order_count || 0}</span>
      )
    },
    {
      key: 'total_spent',
      label: 'Spent',
      sortable: true,
      render: (user) => (
        <span className="text-xs sm:text-sm font-semibold text-amber-400">
          ₹{Number(user.total_spent || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-lg border ${user.is_active
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (user) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => handleToggleStatus(user)}
            className={`p-2 rounded-lg transition-all hover:scale-110 ${user.is_active
              ? 'text-orange-400 hover:bg-orange-500/20 active:bg-orange-500/30'
              : 'text-emerald-400 hover:bg-emerald-500/20 active:bg-emerald-500/30'
              }`}
            title={user.is_active ? 'Deactivate' : 'Activate'}
            aria-label={user.is_active ? 'Deactivate user' : 'Activate user'}
          >
            <Power className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleEdit(user)}
            className="p-2 text-blue-400 hover:bg-blue-500/20 active:bg-blue-500/30 rounded-lg transition-all hover:scale-110"
            title="Edit"
            aria-label="Edit user"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(user);
              setShowDeleteModal(true);
            }}
            className="p-2 text-red-400 hover:bg-red-500/20 active:bg-red-500/30 rounded-lg transition-all hover:scale-110"
            title="Delete"
            aria-label="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Users</h1>
              <p className="text-sm text-white/60 mt-0.5">Manage user accounts and permissions</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-indigo-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-indigo-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Total Users</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">{totalItems}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-emerald-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Active Users</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {users.filter(u => u.is_active).length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Admins</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-white/60 text-sm font-medium mb-1">Sellers</p>
          <p className="text-2xl lg:text-3xl font-bold text-white">
            {users.filter(u => u.role === 'seller').length}
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
                setRoleFilter('');
                setStatusFilter('');
                setCurrentPage(1);
              }}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white placeholder-white/40 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Roles</option>
            <option value="admin" className="bg-gray-900">Admin</option>
            <option value="seller" className="bg-gray-900">Seller</option>
            <option value="customer" className="bg-gray-900">Customer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm text-white transition-all"
          >
            <option value="" className="bg-gray-900">All Status</option>
            <option value="active" className="bg-gray-900">Active</option>
            <option value="inactive" className="bg-gray-900">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
            <p className="text-white/60">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="text-left text-white/60 text-sm font-medium p-4"
                      style={{ width: column.width }}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    {columns.map((column) => (
                      <td key={column.key} className="p-4">
                        {column.render ? column.render(user) : (user as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-white/60">
              Showing{' '}
              <span className="font-medium text-white">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-white">
                {Math.min(currentPage * pageSize, totalItems)}
              </span>{' '}
              of <span className="font-medium text-white">{totalItems}</span> users
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white/60 hover:text-white"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          page === currentPage
                            ? 'bg-amber-500 text-white'
                            : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span key={page} className="px-2 text-white/40">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white/60 hover:text-white"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {showFormModal && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setShowFormModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${selectedUser?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

