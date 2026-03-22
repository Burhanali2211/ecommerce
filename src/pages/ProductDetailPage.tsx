import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart, ShieldCheck, Truck, Plus, Minus,
  MessageSquare, ShoppingCart, Check,
  ArrowRight, Package, TrendingUp, FileText, Star
} from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReview } from '../components/Product/ProductReview';
import { ReviewForm } from '../components/Product/ReviewForm';
import { ProductRecommendations } from '../components/Product/ProductRecommendations';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Review, Product } from '../types';
import { useCartButtonState } from '../hooks/useCartButtonState';
import { LuxuryGallery } from '../components/Product/LuxuryGallery';
import { StockUrgency } from '../components/Trust';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProductById, fetchReviewsForProduct, submitReview } = useProducts();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { showNotification } = useNotification();
  const { showAuthModal } = useAuthModal();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const dummyProduct: Product = {
    id: '', name: '', price: 0, stock: 0, images: [], rating: 0,
    description: '', reviews: [], sellerId: '', sellerName: '',
    tags: [], featured: false, showOnHomepage: true, createdAt: new Date()
  };

  const cartButtonState = useCartButtonState(product || dummyProduct);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await getProductById(id);
        setProduct(productData || null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, getProductById]);

  useEffect(() => {
    if (!product) return;
    (async () => {
      setReviewsLoading(true);
      const r = await fetchReviewsForProduct(product.id);
      setReviews(r);
      setReviewsLoading(false);
    })();
  }, [product, fetchReviewsForProduct]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow max-w-sm w-full">
          <Package className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Product Not Found</h2>
          <p className="text-stone-500 text-sm mb-6">The product you're looking for is unavailable.</p>
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-900 hover:underline">
            Browse All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) { showAuthModal(product, 'cart'); return; }
    if (!cartButtonState.isInCart) {
      addToCart(product, quantity);
      cartButtonState.markAsJustAdded();
    } else {
      showNotification({ type: 'info', title: 'Already in Cart', message: `${product.name} is already in your cart.`, duration: 3000 });
    }
  };

  const handleToggleWishlist = () => product && addToWishlist(product);

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user) {
      showNotification({ type: 'error', title: 'Login Required', message: 'Please login to leave a review.' });
      return;
    }
    await submitReview({ productId: product.id, userId: user.id, rating, comment });
    const updatedReviews = await fetchReviewsForProduct(product.id);
    setReviews(updatedReviews);
    showNotification({ type: 'success', title: 'Review Submitted', message: 'Thank you for your feedback!' });
    setIsReviewModalOpen(false);
  };

  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const tabs = [
    { id: 'description', name: 'Description', icon: FileText },
    { id: 'reviews', name: `Reviews (${reviews.length})`, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-16">

        {/* ── MAIN PRODUCT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 xl:gap-20 items-start">

          {/* LEFT: Gallery */}
          <div className="lg:sticky lg:top-24">
            <LuxuryGallery images={product.images} name={product.name} />
          </div>

          {/* RIGHT: Info & Actions */}
          <div className="space-y-4 sm:space-y-6">

            {/* 1. Category + badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {product.category && (
                <span className="text-xs font-semibold text-stone-400 tracking-widest uppercase">
                  {product.category}
                </span>
              )}
              {product.featured && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wide">
                  <TrendingUp className="h-2.5 w-2.5" /> Popular
                </span>
              )}
              {hasDiscount && (
                <span className="inline-flex items-center bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  -{discountPct}% OFF
                </span>
              )}
            </div>

            {/* 2. Product name */}
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-serif text-stone-900 leading-tight">
              {product.name}
            </h1>

            {/* 3. Rating row — social proof right after name */}
            {product.rating > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'fill-stone-200 text-stone-200'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-stone-700">{product.rating.toFixed(1)}</span>
                {reviews.length > 0 && (
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-sm text-stone-400 hover:text-stone-600 hover:underline transition-colors"
                  >
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>
            )}

            {/* 4. Price — anchored, prominent */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 leading-none">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-stone-400 line-through font-light">
                    ₹{product.originalPrice!.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">
                    Save ₹{(product.originalPrice! - product.price).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </div>

            {/* 5. Short description */}
            {(product.shortDescription || product.description) && (
              <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                {product.shortDescription || product.description.split('.')[0] + '.'}
              </p>
            )}

            {/* 6. Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 7. Quantity + stock */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center bg-white rounded-full border border-stone-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-stone-50 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5 text-stone-600" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-stone-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-stone-50 transition-colors disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5 text-stone-600" />
                </button>
              </div>
              <StockUrgency stock={product.stock} lowStockThreshold={5} />
            </div>

            {/* 8. CTAs — Add to Cart (primary) + Wishlist (secondary) */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                whileTap={{ scale: 0.97 }}
                className={`flex-1 h-12 sm:h-14 rounded-full text-sm sm:text-base font-semibold tracking-wide transition-all flex items-center justify-center gap-2 ${
                  product.stock === 0
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : cartButtonState.buttonState === 'added' || cartButtonState.buttonState === 'in-cart'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 text-white hover:bg-stone-800 shadow-md active:scale-95'
                }`}
              >
                {cartButtonState.buttonState === 'added' || cartButtonState.buttonState === 'in-cart'
                  ? <Check className="h-5 w-5" />
                  : <ShoppingCart className="h-5 w-5" />}
                {product.stock === 0
                  ? 'Out of Stock'
                  : cartButtonState.buttonState === 'added'
                  ? 'Added!'
                  : cartButtonState.buttonState === 'in-cart'
                  ? 'In Cart'
                  : 'Add to Cart'}
              </motion.button>

              <button
                onClick={handleToggleWishlist}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                  isInWishlist(product.id)
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : 'border-stone-200 hover:border-stone-900 text-stone-600 hover:text-stone-900'
                }`}
                aria-label="Add to wishlist"
              >
                <Heart className="h-5 w-5" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* 9. Trust markers */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-stone-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-800">Quality Guaranteed</p>
                  <p className="text-[11px] text-stone-400">100% authentic</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-stone-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-stone-800">Fast Delivery</p>
                  <p className="text-[11px] text-stone-400">Safe & secure shipping</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS: Description / Reviews ── */}
        <div className="mt-10 sm:mt-16 lg:mt-20">
          <div className="flex border-b border-stone-200 mb-6 sm:mb-10 gap-6 sm:gap-10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                  activeTab === tab.id
                    ? 'border-stone-900 text-stone-900'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {tab.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl"
            >
              {activeTab === 'description' && (
                <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
                  {product.description}
                </p>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">Customer Reviews</h3>
                      <p className="text-sm text-stone-400">What our customers say</p>
                    </div>
                    <button
                      onClick={() => setIsReviewModalOpen(true)}
                      className="h-10 px-6 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all w-full sm:w-auto"
                    >
                      Write a Review
                    </button>
                  </div>
                  {reviewsLoading ? <LoadingSpinner /> : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map(review => <ProductReview key={review.id} review={review} />)}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-stone-100">
                      <MessageSquare className="mx-auto h-10 w-10 text-stone-200 mb-3" />
                      <p className="font-medium text-stone-700">Be the First to Review</p>
                      <p className="text-stone-400 text-sm mt-1">Share your experience with this product.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RECOMMENDATIONS ── */}
        <div className="mt-10 sm:mt-16 lg:mt-24 pt-8 sm:pt-12 border-t border-stone-200">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <h2 className="text-xl sm:text-3xl font-serif text-stone-900">You May Also Like</h2>
              <p className="text-stone-400 text-sm mt-1">Curated picks to go with this</p>
            </div>
            <Link to="/products" className="text-sm font-medium text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ProductRecommendations
            currentProduct={product}
            type="related"
            maxItems={4}
            layout="grid"
            className="curated-grid"
          />
        </div>
      </div>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Write a Review">
        <div className="p-4">
          <p className="text-stone-500 text-sm mb-4">Share your thoughts about this product.</p>
          <ReviewForm onSubmit={handleReviewSubmit} />
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetailPage;
