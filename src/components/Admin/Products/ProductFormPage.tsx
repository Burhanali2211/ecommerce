import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Package } from 'lucide-react';
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
  short_description: string;
  price: string;
  original_price: string;
  category_id: string;
  stock: string;
  min_stock_level: string;
  sku: string;
  weight: string;
  dimensions_length: string;
  dimensions_width: string;
  dimensions_height: string;
  tags: string;
  specifications: string;
  is_featured: boolean;
  is_active: boolean;
  show_on_homepage: boolean;
  meta_title: string;
  meta_description: string;
  images: string[];
}

interface FormErrors {
  [key: string]: string;
}

export const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { settings } = useAdminDashboardSettings();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    original_price: '',
    category_id: '',
    stock: '0',
    min_stock_level: '5',
    sku: '',
    weight: '',
    dimensions_length: '',
    dimensions_width: '',
    dimensions_height: '',
    tags: '',
    specifications: '',
    is_featured: false,
    is_active: true,
    show_on_homepage: true,
    meta_title: '',
    meta_description: '',
    images: []
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    fetchCategories();
    if (isEditMode && id) {
      fetchProduct(id);
    }
  }, [id, isEditMode]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setFetching(true);
      const { data: product, error } = await supabase.from('products').select('*').eq('id', productId).single();
      if (error) throw error;
      if (product) {
        const dimensions = product.dimensions || {};
        
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          short_description: product.short_description || '',
          price: product.price?.toString() || '',
          original_price: product.original_price?.toString() || '',
          category_id: product.category_id || '',
          stock: product.stock?.toString() || '0',
          min_stock_level: product.min_stock_level?.toString() || '5',
          sku: product.sku || '',
          weight: product.weight?.toString() || '',
          dimensions_length: dimensions.length?.toString() || '',
          dimensions_width: dimensions.width?.toString() || '',
          dimensions_height: dimensions.height?.toString() || '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : '',
          is_featured: product.is_featured || false,
          is_active: product.is_active !== undefined ? product.is_active : true,
          show_on_homepage: product.show_on_homepage !== undefined ? product.show_on_homepage : true,
          meta_title: product.meta_title || '',
          meta_description: product.meta_description || '',
          images: product.images || []
        });
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to load product');
      navigate('/admin/products');
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
      newErrors.name = 'Product name is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (formData.stock && parseInt(formData.stock) < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (formData.original_price && parseFloat(formData.original_price) < parseFloat(formData.price)) {
      newErrors.original_price = 'Original price must be greater than sale price';
    }

    if (formData.weight && parseFloat(formData.weight) < 0) {
      newErrors.weight = 'Weight cannot be negative';
    }

    // Validate specifications JSON if provided
    if (formData.specifications) {
      try {
        JSON.parse(formData.specifications);
      } catch {
        newErrors.specifications = 'Specifications must be valid JSON';
      }
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

      // Build dimensions object
      const dimensions: any = {};
      if (formData.dimensions_length) dimensions.length = parseFloat(formData.dimensions_length);
      if (formData.dimensions_width) dimensions.width = parseFloat(formData.dimensions_width);
      if (formData.dimensions_height) dimensions.height = parseFloat(formData.dimensions_height);

      // Parse tags
      const tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Parse specifications
      let specifications = null;
      if (formData.specifications) {
        try {
          specifications = JSON.parse(formData.specifications);
        } catch {
          throw new Error('Invalid JSON in specifications');
        }
      }

      const payload: any = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        short_description: formData.short_description || undefined,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id,
        stock: parseInt(formData.stock),
        min_stock_level: parseInt(formData.min_stock_level),
        sku: formData.sku || undefined,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: Object.keys(dimensions).length > 0 ? dimensions : null,
        tags: tags.length > 0 ? tags : null,
        specifications: specifications,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        show_on_homepage: formData.show_on_homepage,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        images: Array.isArray(formData.images) ? formData.images : (formData.images ? [formData.images] : [])
      };

      if (isEditMode && id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
        showSuccess('Success', 'Product updated successfully');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        showSuccess('Success', 'Product created successfully');
      }

      navigate('/admin/products');
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AdminDashboardLayout title={isEditMode ? 'Edit Product' : 'Add Product'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: settings.primary_color_from }} />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout 
      title={isEditMode ? 'Edit Product' : 'Add New Product'}
      subtitle={isEditMode ? 'Update product information' : 'Create a new product for your store'}
    >
      <div className="space-y-6">
        {/* Style override for form inputs in dark theme */}
        <style>{`
          .product-form-page label {
            color: rgba(255, 255, 255, 0.9) !important;
          }
          .product-form-page .text-gray-500 {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          .product-form-page .text-red-600 {
            color: #ef4444 !important;
          }
          .product-form-page .text-gray-700 {
            color: rgba(255, 255, 255, 0.9) !important;
          }
          .product-form-page input[type="checkbox"] {
            accent-color: ${settings.primary_color_from};
          }
        `}</style>
        
        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8 product-form-page">
          {/* Basic Information */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(to bottom right, ${settings.primary_color_from}20, ${settings.primary_color_to}20)`
                }}
              >
                <Package className="w-5 h-5" style={{ color: settings.primary_color_from }} />
              </div>
              <h2 className="text-xl font-bold text-white">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <FormInput
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name || ''}
                  required
                  placeholder="Enter product name"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>

              <FormInput
                label="Slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                error={errors.slug || ''}
                helperText="URL-friendly version of the name"
                placeholder="product-slug"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

                <FormSelect
                label="Category"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                error={errors.category_id || ''}
                required
                options={[
                  { value: '', label: 'Select a category' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
                className="bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-offset-0 [&>option]:bg-gray-900"
              />

              <div className="lg:col-span-2">
                <FormTextarea
                  label="Short Description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Brief product description (appears in product listings)"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>

              <div className="lg:col-span-2">
                <FormTextarea
                  label="Full Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Detailed product description"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormInput
                label="Price (₹)"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                error={errors.price || ''}
                required
                placeholder="0.00"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Original Price (₹)"
                name="original_price"
                type="number"
                step="0.01"
                value={formData.original_price}
                onChange={handleChange}
                error={errors.original_price || ''}
                placeholder="0.00"
                helperText="Leave empty if no discount"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Stock Quantity"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
                error={errors.stock || ''}
                required
                placeholder="0"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Min Stock Level"
                name="min_stock_level"
                type="number"
                value={formData.min_stock_level}
                onChange={handleChange}
                placeholder="5"
                helperText="Low stock alert threshold"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="SKU"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="PROD-001"
                helperText="Stock Keeping Unit"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Weight (kg)"
                name="weight"
                type="number"
                step="0.001"
                value={formData.weight}
                onChange={handleChange}
                error={errors.weight || ''}
                placeholder="0.000"
                helperText="Product weight in kilograms"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Dimensions</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormInput
                label="Length (cm)"
                name="dimensions_length"
                type="number"
                step="0.1"
                value={formData.dimensions_length}
                onChange={handleChange}
                placeholder="0.0"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Width (cm)"
                name="dimensions_width"
                type="number"
                step="0.1"
                value={formData.dimensions_width}
                onChange={handleChange}
                placeholder="0.0"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <FormInput
                label="Height (cm)"
                name="dimensions_height"
                type="number"
                step="0.1"
                value={formData.dimensions_height}
                onChange={handleChange}
                placeholder="0.0"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Product Images</h2>

            <ImageUpload
              value={formData.images}
              onChange={(images) => {
                if (typeof images === 'function') {
                  setFormData(prev => {
                    const currentImages = Array.isArray(prev.images) ? prev.images : prev.images ? [prev.images] : [];
                    const newImages = images(currentImages);
                    const imageArray = Array.isArray(newImages) ? newImages : [newImages];
                    return { ...prev, images: imageArray };
                  });
                } else {
                  const imageArray = Array.isArray(images) ? images : [images];
                  setFormData(prev => ({ ...prev, images: imageArray }));
                }
              }}
              onMainImageChange={(index) => {
                const imageArray = Array.isArray(formData.images) ? formData.images : [formData.images];
                if (imageArray.length > 0 && index < imageArray.length) {
                  const newImages = [imageArray[index], ...imageArray.filter((_, i) => i !== index)];
                  setFormData(prev => ({ ...prev, images: newImages }));
                }
              }}
              mainImageIndex={0}
              multiple={true}
              maxFiles={10}
              folder="products"
              label="Upload Product Images"
              helperText="Upload up to 10 product images. Click any image to set it as the main product image."
            />
          </div>

          {/* Tags & Specifications */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Tags & Specifications</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <FormTextarea
                  label="Tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter tags separated by commas (e.g., perfume, luxury, men)"
                  helperText="Separate multiple tags with commas"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>

              <div>
                <FormTextarea
                  label="Specifications (JSON)"
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleChange}
                  rows={6}
                  placeholder='{"brand": "Example", "volume": "100ml", "type": "Eau de Parfum"}'
                  error={errors.specifications || ''}
                  helperText="Enter specifications as JSON format"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* SEO & Display Settings */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">SEO & Display Settings</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FormInput
                label="Meta Title"
                name="meta_title"
                value={formData.meta_title}
                onChange={handleChange}
                placeholder="SEO title for search engines"
                helperText="Leave empty to use product name"
                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
              />

              <div className="space-y-4">
                <FormCheckbox
                  label="Featured Product"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                />

                <FormCheckbox
                  label="Active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />

                <FormCheckbox
                  label="Show on Homepage"
                  name="show_on_homepage"
                  checked={formData.show_on_homepage}
                  onChange={handleChange}
                />
              </div>

              <div className="lg:col-span-2">
                <FormTextarea
                  label="Meta Description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="SEO description for search engines"
                  helperText="Leave empty to use short description"
                  className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 left-0 right-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-4 pt-6 pb-4 border-t border-white/10 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
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
              <span>{isEditMode ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </AdminDashboardLayout>
  );
};

