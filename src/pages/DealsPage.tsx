import React from 'react';
import { useProducts } from '../contexts/ProductContext';
import { ProductCard } from '../components/Product/ProductCard';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

export const DealsPage: React.FC = () => {
  const { products } = useProducts();

  const dealProducts = products.filter(p => p.originalPrice && p.originalPrice > p.price);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-xl">
              <Tag className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Special Deals</h1>
              <p className="text-gray-600 mt-1">
                Unbeatable prices on your favorite products.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {dealProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <ProductCard 
                product={product} 
                imagePriority={index < 4 ? 'critical' : 'normal'}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default DealsPage;
