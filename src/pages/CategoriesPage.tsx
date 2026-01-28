import React from 'react';
import { useProducts } from '../contexts/ProductContext';
import { motion } from 'framer-motion';
import { Grid } from 'lucide-react';
import { CategoryDisplayCard } from '../components/Category/CategoryDisplayCard';

export const CategoriesPage: React.FC = () => {
  const { categories } = useProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Grid className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Categories</h1>
              <p className="text-gray-600 mt-1">
                Explore products across all our categories.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {categories.slice(0, 6).map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <CategoryDisplayCard category={category} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default CategoriesPage;
