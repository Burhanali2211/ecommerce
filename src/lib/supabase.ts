import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const db = {
  // Products
  async getProducts(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { data, total: count, page, limit };
  },

  async getProduct(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getFeaturedProducts(limit = 8) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(limit)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getLatestProducts(limit = 8) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(limit)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getHomepageProducts(limit = 4) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('show_on_homepage', true)
      .limit(limit)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getCategory(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Public Settings
  async getPublicSettings() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('is_public', true);
    
    if (error) throw error;
    return data;
  },

  async getSocialMedia() {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getContactInfo() {
    const { data, error } = await supabase
      .from('contact_information')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getFooterLinks() {
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .eq('is_active', true)
      .order('section_name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getBusinessHours() {
    const { data, error } = await supabase
      .from('business_hours')
      .select('*')
      .order('day_of_week', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Combined public settings
  async getAllPublicSettings() {
    try {
      const [settings, social, contact, footer, hours] = await Promise.all([
        this.getPublicSettings(),
        this.getSocialMedia(),
        this.getContactInfo(),
        this.getFooterLinks(),
        this.getBusinessHours(),
      ]);

      return {
        siteSettings: settings,
        socialMedia: social,
        contactInfo: contact,
        footerLinks: footer,
        businessHours: hours,
      };
    } catch (error) {
      console.error('Error fetching public settings:', error);
      throw error;
    }
  },

  // Cart
  async getCart(userId: string) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async addToCart(userId: string, productId: string, quantity: number) {
    const { data, error } = await supabase
      .from('cart_items')
      .insert([{ user_id: userId, product_id: productId, quantity }])
      .select();
    
    if (error) throw error;
    return data;
  },

  async updateCartItem(cartItemId: string, quantity: number) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .select();
    
    if (error) throw error;
    return data;
  },

  async removeFromCart(cartItemId: string) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
    
    if (error) throw error;
  },

  // Orders
  async getOrders(userId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createOrder(orderData: any) {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();
    
    if (error) throw error;
    return data;
  },

  // Addresses
  async getAddresses(userId: string) {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async createAddress(addressData: any) {
    const { data, error } = await supabase
      .from('addresses')
      .insert([addressData])
      .select();
    
    if (error) throw error;
    return data;
  },

  async updateAddress(addressId: string, addressData: any) {
    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
      .eq('id', addressId)
      .select();
    
    if (error) throw error;
    return data;
  },

  async deleteAddress(addressId: string) {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);
    
    if (error) throw error;
  },
};

export default supabase;
