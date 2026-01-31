/**
 * Seed Supabase with Kashmir / Himalayan spices data only.
 * Run: node scripts/seedSupabaseData.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const categories = [
  { name: 'Kashmiri Saffron', slug: 'kashmiri-saffron', description: 'Premium saffron from Kashmir valleys', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 1, is_active: true },
  { name: 'Whole Spices', slug: 'whole-spices', description: 'Authentic whole spices from the Himalayas', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 2, is_active: true },
  { name: 'Ground Spices', slug: 'ground-spices', description: 'Freshly ground spice blends', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 3, is_active: true },
  { name: 'Kashmiri Chilli', slug: 'kashmiri-chilli', description: 'Mild, vibrant red chilli from Kashmir', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 4, is_active: true },
  { name: 'Tea & Kahwa', slug: 'tea-kahwa', description: 'Kashmiri kahwa and Himalayan teas', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 5, is_active: true },
  { name: 'Dry Fruits & Nuts', slug: 'dry-fruits-nuts', description: 'Premium dry fruits from Kashmir', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 6, is_active: true },
  { name: 'Honey & Natural', slug: 'honey-natural', description: 'Pure Himalayan honey and natural products', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 7, is_active: true },
  { name: 'Gift Boxes', slug: 'gift-boxes', description: 'Curated spice and dry fruit gift sets', image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80', sort_order: 8, is_active: true },
];

const products = [
  { name: 'Kashmiri Saffron (1g)', slug: 'kashmiri-saffron-1g', description: 'Pure Kashmiri saffron strands, hand-picked from Kashmir valleys. Rich aroma and deep colour. Ideal for biryanis, desserts and beverages.', short_description: 'Pure Kashmiri saffron strands', price: 499, original_price: 599, category_slug: 'kashmiri-saffron', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 100, sku: 'KAS-001', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.9, review_count: 240, tags: ['saffron', 'kashmir', 'premium'] },
  { name: 'Kashmiri Saffron (2g)', slug: 'kashmiri-saffron-2g', description: 'Premium Kashmiri saffron in a larger pack. Authentic, lab-tested. Perfect for gifting and regular use.', short_description: 'Premium Kashmiri saffron 2g', price: 899, original_price: 1099, category_slug: 'kashmiri-saffron', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 60, sku: 'KAS-002', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.8, review_count: 156, tags: ['saffron', 'kashmir'] },
  { name: 'Kashmiri Red Chilli Powder', slug: 'kashmiri-red-chilli-powder', description: 'Mild, vibrant red chilli powder from Kashmir. Adds colour and mild heat to curries, biryanis and tandoori dishes.', short_description: 'Mild red chilli from Kashmir', price: 199, original_price: 249, category_slug: 'kashmiri-chilli', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 150, sku: 'KCH-001', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.7, review_count: 320, tags: ['chilli', 'kashmir', 'spices'] },
  { name: 'Himalayan Garam Masala', slug: 'himalayan-garam-masala', description: 'Traditional garam masala blend with cardamom, cinnamon, clove and black pepper. Sourced from Himalayan region.', short_description: 'Traditional garam masala blend', price: 299, original_price: 349, category_slug: 'ground-spices', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 80, sku: 'GMS-001', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.8, review_count: 189, tags: ['garam masala', 'blend', 'himalayan'] },
  { name: 'Whole Cardamom (Green)', slug: 'whole-cardamom-green', description: 'Premium green cardamom from the hills. Aromatic and fresh. Essential for biryani, chai and desserts.', short_description: 'Premium green cardamom', price: 449, original_price: 499, category_slug: 'whole-spices', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 70, sku: 'WCD-001', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.9, review_count: 275, tags: ['cardamom', 'whole spices'] },
  { name: 'Turmeric Powder (Haldi)', slug: 'turmeric-powder-haldi', description: 'Pure turmeric powder from Himalayan farms. Natural colour and earthy flavour. Good for curries and wellness.', short_description: 'Pure Himalayan turmeric', price: 149, original_price: 179, category_slug: 'ground-spices', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 120, sku: 'TUR-001', is_featured: false, show_on_homepage: true, is_active: true, rating: 4.6, review_count: 410, tags: ['turmeric', 'haldi', 'spices'] },
  { name: 'Kashmiri Kahwa (100g)', slug: 'kashmiri-kahwa-100g', description: 'Traditional Kashmiri green tea with saffron, cardamom, cinnamon and almonds. Fragrant and soothing.', short_description: 'Traditional Kashmiri green tea', price: 349, original_price: 399, category_slug: 'tea-kahwa', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 90, sku: 'KAH-001', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.8, review_count: 167, tags: ['kahwa', 'kashmir', 'tea'] },
  { name: 'Himalayan Honey (500g)', slug: 'himalayan-honey-500g', description: 'Raw, pure honey from Himalayan forests. Unprocessed and natural. Great for immunity and daily use.', short_description: 'Pure raw Himalayan honey', price: 599, original_price: 699, category_slug: 'honey-natural', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 50, sku: 'HON-001', is_featured: true, show_on_homepage: true, is_active: true, rating: 4.9, review_count: 98, tags: ['honey', 'himalayan', 'natural'] },
  { name: 'Kashmiri Almonds (250g)', slug: 'kashmiri-almonds-250g', description: 'Premium almonds from Kashmir. Crunchy, nutritious. Ideal for snacking and cooking.', short_description: 'Premium Kashmir almonds', price: 399, original_price: 449, category_slug: 'dry-fruits-nuts', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 100, sku: 'DRY-001', is_featured: false, show_on_homepage: true, is_active: true, rating: 4.7, review_count: 203, tags: ['almonds', 'dry fruits', 'kashmir'] },
  { name: 'Cumin Seeds (Jeera)', slug: 'cumin-seeds-jeera', description: 'Aromatic cumin seeds from Himalayan region. Essential for tempering and spice blends.', short_description: 'Aromatic cumin seeds', price: 129, original_price: 149, category_slug: 'whole-spices', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80'], stock: 200, sku: 'WCM-001', is_featured: false, show_on_homepage: true, is_active: true, rating: 4.5, review_count: 356, tags: ['cumin', 'jeera', 'whole spices'] },
];

const siteSettings = [
  { setting_key: 'site_name', setting_value: 'Himalayan Spices Exports', setting_type: 'text', category: 'general', description: 'Website name', is_public: true },
  { setting_key: 'site_description', setting_value: 'Premium Kashmir & Himalayan Spices – Saffron, Whole Spices, Teas & Dry Fruits', setting_type: 'text', category: 'general', description: 'Website tagline', is_public: true },
  { setting_key: 'contact_email', setting_value: 'support@himalayanspicesexports.com', setting_type: 'email', category: 'contact', description: 'Contact email', is_public: true },
  { setting_key: 'contact_phone', setting_value: '+91-9876543210', setting_type: 'text', category: 'contact', description: 'Contact phone', is_public: true },
  { setting_key: 'currency', setting_value: 'INR', setting_type: 'text', category: 'general', description: 'Default currency', is_public: true },
  { setting_key: 'free_shipping_threshold', setting_value: '2000', setting_type: 'number', category: 'shipping', description: 'Free shipping above this amount', is_public: true },
  { setting_key: 'logo_url', setting_value: '/logo.png', setting_type: 'text', category: 'general', description: 'Site logo URL', is_public: true },
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding Supabase – Kashmir / Himalayan spices only...\n');

    console.log('📁 Seeding categories...');
    for (const category of categories) {
      const { error } = await supabase.from('categories').upsert(category, { onConflict: 'slug' });
      if (error) console.error(`  ❌ ${category.name}:`, error.message);
      else console.log(`  ✅ ${category.name}`);
    }

    const { data: categoryData } = await supabase.from('categories').select('id, slug');
    const categoryMap = {};
    categoryData?.forEach(cat => { categoryMap[cat.slug] = cat.id; });

    console.log('\n📦 Seeding products...');
    for (const product of products) {
      const categoryId = categoryMap[product.category_slug];
      if (!categoryId) {
        console.error(`  ⚠️ Category not found for ${product.name}`);
        continue;
      }
      const { category_slug, ...productData } = product;
      productData.category_id = categoryId;
      const { error } = await supabase.from('products').upsert(productData, { onConflict: 'slug' });
      if (error) console.error(`  ❌ ${product.name}:`, error.message);
      else console.log(`  ✅ ${product.name}`);
    }

    console.log('\n⚙️ Seeding site settings...');
    for (const setting of siteSettings) {
      const { error } = await supabase.from('site_settings').upsert(setting, { onConflict: 'setting_key' });
      if (error) console.error(`  ❌ ${setting.setting_key}:`, error.message);
      else console.log(`  ✅ ${setting.setting_key}`);
    }

    console.log('\n🎉 Seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
