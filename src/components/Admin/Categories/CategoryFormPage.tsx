import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Tag } from 'lucide-react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from '../../Common/FormInput';
import { ImageUpload } from '../../Common/ImageUpload';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAdminDashboardSettings } from '../../../hooks/useAdminDashboardSettings';
import { AdminDashboardLayout } from '../Layout/AdminDashboardLayout';

interface FormData {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  parent_id: string;
  sort_order: string;
  is_active: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const CategoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { settings } = useAdminDashboardSettings();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    parent_id: '',
    sort_order: '0',
    is_active: true
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) {
      fetchCategory(id);
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      const availableCategories = isEditMode && id
        ? (data || []).filter((cat: any) => cat.id !== id)
        : (data || []);
      setCategories(availableCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCategory = async (categoryId: string) => {
    try {
      setFetching(true);
      const { data: category, error } = await supabase.from('categories').select('*').eq('id', categoryId).single();
      if (error) throw error;
      if (category) {
        setFormData({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          image_url: category.image_url || '',
          parent_id: category.parent_id || '',
          sort_order: (category.sort_order != null ? category.sort_order : 0).toString(),
          is_active: category.is_active !== undefined ? category.is_active : true
        });
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load category');
      navigate('/admin/categories');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Auto-generate slug from name
    if (name === 'name' && !isEditMode) {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    }

    if (formData.sort_order && parseInt(formData.sort_order) < 0) {
      newErrors.sort_order = 'Sort order cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        image_url: formData.image_url || null,
        parent_id: formData.parent_id || null,
        sort_order: parseInt(formData.sort_order) || 0,
        is_active: formData.is_active
      };

      if (isEditMode && id) {
        const { error } = await supabase.from('categories').update(payload).eq('id', id);
        if (error) throw error;
        showSuccess('Success', 'Category updated successfully');
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        showSuccess('Success', 'Category created successfully');
      }

      navigate('/admin/categories');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminDashboardLayout title={isEditMode ? 'Edit Category' : 'Add Category'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: settings.primary_color_from }} />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout 
      title={isEditMode ? 'Edit Category' : 'Add New Category'}
      subtitle={isEditMode ? 'Update category information' : 'Create a new category for your store'}
    >
      <div className="space-y-6">
        {/* Style override for form inputs in dark theme */}
        <style>{`
          .category-form-page label {
            color: rgba(255, 255, 255, 0.9) !important;
          }
          .category-form-page .text-gray-500 {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          .category-form-page .text-red-600 {
            color: #ef4444 !important;
          }
          .category-form-page .text-gray-700 {
            color: rgba(255, 255, 255, 0.9) !important;
          }
          .category-form-page input[type="checkbox"] {
            accent-color: ${settings.primary_color_from};
          }
        `}</style>
        
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/categories')}
            className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Categories</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 category-form-page">
          {/* Basic Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`
                }}
              >
                <Tag className="w-5 h-5" style={{ color: settings.primary_color_from }} />
              </div>
              <h2 className="text-xl font-bold text-white">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <FormInput
                  label="Category Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name || ''}
                  required
                  placeholder="Enter category name"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>

              <FormInput
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                error={errors.slug || ''}
                required
                helperText="URL-friendly version of the name"
                placeholder="category-slug"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Sort Order"
                name="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={handleChange}
                error={errors.sort_order || ''}
                placeholder="0"
                helperText="Lower numbers appear first"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <div className="lg:col-span-2">
                <FormTextarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Category description"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Category Image */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Category Image</h2>

            <div className="space-y-4">
              <ImageUpload
                value={formData.image_url}
                onChange={(image) => {
                  const imageUrl = Array.isArray(image) ? image[0] : image;
                  setFormData(prev => ({ ...prev, image_url: imageUrl || '' }));
                }}
                multiple={false}
                label="Upload Category Image"
                helperText="Upload a category image or enter URL below"
                folder="categories"
              />

              <FormInput
                label="Or Enter Image URL"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                helperText="Direct URL to category image"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Hierarchy & Settings */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Hierarchy & Settings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormSelect
                label="Parent Category"
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None (Top Level)' },
                  ...categories
                    .filter(cat => cat.is_active)
                    .map(cat => ({ value: cat.id, label: cat.name }))
                ]}
                helperText="Select a parent category to create a subcategory"
                className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-offset-0 [&>option]:bg-gray-900"
              />

              <div className="space-y-4">
                <FormCheckbox
                  label="Active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 left-0 right-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-4 pt-6 pb-4 border-t border-white/10 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
            <button
              type="button"
              onClick={() => navigate('/admin/categories')}
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-white/80 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 active:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[48px]"
              style={{
                background: loading 
                  ? `${settings.primary_color_from}80`
                  : `linear-gradient(to right, ${settings.primary_color_from}, ${settings.primary_color_to})`
              }}
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />}
              <Save className="h-5 w-5" />
              <span>{isEditMode ? 'Update Category' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};

