import React, { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { useCartButtonStyles } from '../../hooks/useCartButtonStyles';
import { useCartButtonState } from '../../hooks/useCartButtonState';
import { useCart } from '../../contexts/CartContext';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  const { addItem: addToCart } = useCart();
  const { cartButtonText, cartButtonStyle, cartButtonHoverStyle } = useCartButtonStyles();
  const { buttonState, markAsJustAdded } = useCartButtonState(product);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock > 0 && !isAdding) {
      setIsAdding(true);
      try {
        await addToCart(product, 1);
        markAsJustAdded();
      } finally {
        setIsAdding(false);
      }
    }
  };

  const isOutOfStock = product.stock === 0;
  const isAdded = buttonState === 'added' || buttonState === 'in-cart';

  // Dynamic sizing
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  // Base transition for color and shadow
  const transition = { duration: 0.2, ease: 'easeInOut' };

  return (
    <motion.button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleAddToCart}
      disabled={isOutOfStock || isAdding}
      className={`
        relative overflow-hidden flex items-center justify-center gap-2 font-bold rounded-lg
        transition-all duration-300 select-none touch-manipulation
        ${isOutOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
        ${isAdded ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg' : ''}
        ${sizeClasses[size]}
        ${className}
      `}
      style={!isOutOfStock && !isAdded ? {
        ...cartButtonStyle,
        ...(isHovered ? cartButtonHoverStyle : {}),
      } : undefined}
      whileTap={!isOutOfStock ? { scale: 0.96 } : {}}
    >
      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={transition}
          >
            <Loader2 className="animate-spin" size={iconSize[size]} />
          </motion.div>
        ) : isAdded ? (
          <motion.div
            key="added"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
            transition={transition}
          >
            {showIcon && <Check size={iconSize[size]} strokeWidth={3} />}
            <span>{buttonState === 'added' ? 'Added!' : 'In Cart'}</span>
          </motion.div>
        ) : isOutOfStock ? (
          <motion.div
            key="outofstock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span>Out of Stock</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2"
            transition={transition}
          >
            {showIcon && <ShoppingCart size={iconSize[size]} />}
            <span>{cartButtonText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glossy overlay on hover */}
      {!isOutOfStock && !isAdded && isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
        />
      )}
    </motion.button>
  );
};

export default AddToCartButton;
