import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="p-6 bg-white rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <Package className="h-12 w-12 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Collections</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore our curated collections of premium attars and fragrances
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                <Package className="h-16 w-16 text-amber-600 opacity-50" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Collection {i}
                </h3>
                <p className="text-gray-600 mb-4">
                  Discover our premium selection of attars and fragrances
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center text-amber-600 hover:text-amber-700 font-semibold"
                >
                  Explore →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;

