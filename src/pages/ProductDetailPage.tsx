import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Heart, ShieldCheck, Truck, Plus, Minus, 
    MessageSquare, ShoppingCart, Check,
    ArrowRight, Package, TrendingUp, FileText
} from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductReview } from '../components/Product/ProductReview';
import { ReviewForm } from '../components/Product/ReviewForm';
import { ProductRecommendations } from '../components/Product/ProductRecommendations';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Review, Product } from '../types';
import { useCartButtonState } from '../hooks/useCartButtonState';
import { LuxuryGallery } from '../components/Product/LuxuryGallery';
import {
  ReviewSummary,
  TrendingIndicator,
  StockUrgency,
} from '../components/Trust';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getProductById, fetchReviewsForProduct, submitReview } = useProducts();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { showNotification } = useNotification();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const dummyProduct: Product = {
    id: '',
    name: '',
    price: 0,
    stock: 0,
    images: [],
    rating: 0,
    description: '',
    reviews: [],
    sellerId: '',
    sellerName: '',
    tags: [],
    featured: false,
    showOnHomepage: true,
    createdAt: new Date()
  };
  
  const cartButtonState = useCartButtonState(product || dummyProduct);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const productData = await getProductById(id);
        if (productData && productData.data) {
          setProduct(productData.data);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, getProductById]);

  useEffect(() => {
    if (product) {
      const getReviews = async () => {
        setReviewsLoading(true);
        const fetchedReviews = await fetchReviewsForProduct(product.id);
        setReviews(fetchedReviews);
        setReviewsLoading(false);
      };
      getReviews();
    }
  }, [product, fetchReviewsForProduct]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center p-12 bg-white rounded-luxury-xl shadow-luxury max-w-md">
            <Package className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h2 className="font-serif text-3xl text-stone-900 mb-4">Product Not Found</h2>
            <p className="text-stone-500 mb-8">The product you're looking for is currently unavailable.</p>
            <Link to="/products" className="inline-flex items-center gap-2 text-stone-900 font-medium hover:gap-3 transition-all">
              Browse All Products <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (product) {
      if (!cartButtonState.isInCart) {
        addToCart(product, quantity);
        cartButtonState.markAsJustAdded();
      } else {
        showNotification({
          type: 'info',
          title: 'Already in Cart',
          message: `${product.name} is already in your cart.`,
          duration: 3000
        });
      }
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

  const tabs = [
    { id: 'description', name: 'Description', icon: FileText },
    { id: 'reviews', name: `Reviews (${reviews.length})`, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Dynamic Header / Breadcrumbs could go here */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          
          {/* Left Column: Sticky Gallery */}
          <div className="lg:sticky lg:top-32">
            <LuxuryGallery images={product.images} name={product.name} />
          </div>

          {/* Right Column: Info & Actions */}
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-stone-400 text-sm tracking-[0.2em] uppercase font-medium">
                  {product.category || 'Collection'}
                </span>
                <span className="h-px w-8 bg-stone-200" />
                <TrendingIndicator isHot={product.featured} />
              </div>

                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-stone-900 mb-6 leading-tight">
                  {product.name}
                </h1>

                  <div className="flex items-center gap-8 mb-4">
                    <ReviewSummary rating={product.rating} reviewCount={reviews.length} />
                    {product.category && (
                      <>
                        <div className="h-6 w-px bg-stone-200" />
                        <div className="flex items-center gap-2 text-stone-500 text-sm">
                          <Package className="h-4 w-4" /> {product.category}
                        </div>
                      </>
                    )}
                  </div>

                  {product.featured && (
                    <div className="flex items-center gap-2 mb-8 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 w-fit">
                       <TrendingUp className="h-4 w-4" />
                       <span className="text-xs font-bold uppercase tracking-wider">Popular Choice</span>
                    </div>
                  )}


              <div className="flex items-baseline gap-4 mb-10">
                <span className="text-4xl font-light text-stone-900 tracking-tight">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-stone-400 line-through font-light">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <p className="text-stone-600 text-lg leading-relaxed mb-10 font-light">
                {product.shortDescription || product.description.split('.')[0] + '.'}
              </p>
            </div>

              {/* Product Highlights */}
              {(product.tags && product.tags.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.slice(0, 4).map((tag, index) => (
                    <span key={index} className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            {/* Actions Section */}
            <div className="space-y-6 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-white rounded-full border border-stone-200 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 transition-colors"
                  >
                    <Minus className="h-4 w-4 text-stone-600" />
                  </button>
                  <span className="w-12 text-center text-stone-900 font-medium">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-50 transition-colors"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4 text-stone-600" />
                  </button>
                </div>
                <StockUrgency stock={product.stock} lowStockThreshold={5} />
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`flex-1 h-16 rounded-full text-lg font-medium tracking-wide transition-all flex items-center justify-center gap-3 ${
                    product.stock === 0
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : cartButtonState.buttonState === 'added' || cartButtonState.buttonState === 'in-cart'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 text-white hover:bg-stone-800 shadow-luxury hover:shadow-luxury-lg active:scale-95'
                  }`}
                >
                  {cartButtonState.buttonState === 'added' || cartButtonState.buttonState === 'in-cart' ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <ShoppingCart className="h-6 w-6" />
                  )}
                    {product.stock === 0 ? 'Out of Stock' : cartButtonState.buttonState === 'added' ? 'Added' : cartButtonState.buttonState === 'in-cart' ? 'In Cart' : 'Add to Cart'}
                  </motion.button>
                
                <button 
                  onClick={handleToggleWishlist}
                  className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all ${
                    isInWishlist(product.id) 
                      ? 'bg-stone-900 border-stone-900 text-white' 
                      : 'border-stone-200 hover:border-stone-900 text-stone-900'
                  }`}
                >
                  <Heart className="h-6 w-6" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Trust Markers */}
            <div className="grid grid-cols-2 gap-6 pt-10 border-t border-stone-200">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-stone-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-stone-900">Quality Guaranteed</h4>
                  <p className="text-xs text-stone-500">100% authentic products</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="h-6 w-6 text-stone-400 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-stone-900">Fast Delivery</h4>
                  <p className="text-xs text-stone-500">Safe & secure shipping</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div className="mt-24">
          <div className="flex justify-center border-b border-stone-200 mb-12">
            <div className="flex gap-12">
              {tabs.map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`py-6 flex items-center gap-2 border-b-2 transition-all font-medium uppercase tracking-[0.2em] text-xs ${
                    activeTab === tab.id ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.name}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
              {activeTab === 'description' && (
                <div className="prose prose-stone max-w-none">
                  <p className="text-xl text-stone-700 leading-loose font-light text-center px-8">
                    {product.description}
                  </p>
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-stone-100">
                    <div className="text-center md:text-left">
                      <h3 className="font-serif text-3xl text-stone-900">Customer Reviews</h3>
                      <p className="text-stone-500 mt-1">What our customers say</p>
                    </div>
                    <button 
                      onClick={() => setIsReviewModalOpen(true)} 
                      className="h-12 px-8 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all shadow-luxury"
                    >
                      Write a Review
                    </button>
                  </div>
                  {reviewsLoading ? <LoadingSpinner /> : reviews.length > 0 ? (
                    <div className="grid gap-8">
                      {reviews.map(review => <ProductReview key={review.id} review={review} />)}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-luxury border border-stone-100">
                      <MessageSquare className="mx-auto h-12 w-12 text-stone-200 mb-4" />
                      <h3 className="font-medium text-stone-900">Be the First to Review</h3>
                      <p className="text-stone-400 mt-1">Share your experience with this product.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Curated Recommendations Section */}
        <div className="mt-32 pt-24 border-t border-stone-200">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-serif text-4xl text-stone-900">You May Also Like</h2>
              <p className="text-stone-500 mt-2">Curated selections to complement your style</p>
            </div>
            <Link to="/products" className="text-stone-900 font-medium hover:gap-2 flex items-center gap-1 transition-all">
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
          <p className="text-stone-500 text-sm mb-6">Share your thoughts about this product.</p>
          <ReviewForm onSubmit={handleReviewSubmit} />
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetailPage;
