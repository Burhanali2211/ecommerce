import React, { Suspense, useEffect, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/pwa-responsive.css';
import { CombinedProvider } from '@/contexts/CombinedProvider';
import { Layout } from '@/components/Layout/Layout';
import { DatabaseErrorOverlay } from '@/components/Common/DatabaseErrorOverlay';
import { ErrorBoundary } from '@/components/Common/ErrorBoundary';
import { ScrollToTop } from '@/components/Common/ScrollToTop';
import { PageLoader } from '@/components/Common/UniversalLoader';
import { GlobalMediaErrorHandler } from '@/components/Common/MediaErrorHandler';
import { ProfessionalLoader } from '@/components/Common/ProfessionalLoader';
import { usePageTracking } from '@/hooks/usePageTracking';
import { ProtectedRoute } from '@/components/Common/ProtectedRoute';
import { PublicRoute } from '@/components/Common/PublicRoute';

// Lazy-loaded pages for code splitting - optimized for performance
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const ProductsPage = React.lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = React.lazy(() => import('@/pages/ProductDetailPage'));
const SearchPage = React.lazy(() => import('@/pages/SearchPage'));
const WishlistPage = React.lazy(() => import('@/pages/WishlistPage'));
const ComparePage = React.lazy(() => import('@/pages/ComparePage'));
const NewArrivalsPage = React.lazy(() => import('@/pages/NewArrivalsPage'));
const DealsPage = React.lazy(() => import('@/pages/DealsPage'));
const CategoriesPage = React.lazy(() => import('@/pages/CategoriesPage'));
const CollectionsPage = React.lazy(() => import('@/pages/CollectionsPage'));
const AuthPage = React.lazy(() => import('@/pages/AuthPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage')); // Added About page
const ContactPage = React.lazy(() => import('@/pages/ContactPage')); // Added Contact page

// Legal pages
const PrivacyPolicyPage = React.lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsOfServicePage = React.lazy(() => import('@/pages/TermsOfServicePage'));
const RefundPolicyPage = React.lazy(() => import('@/pages/RefundPolicyPage'));
const ShippingPolicyPage = React.lazy(() => import('@/pages/ShippingPolicyPage'));

// Heavy admin/dashboard pages - loaded only when needed
const DashboardPage = React.lazy(() =>
  import('@/pages/DashboardPage').then(module => ({ default: module.default }))
);
const CheckoutPage = React.lazy(() =>
  import('./pages/ImprovedCheckoutPage.tsx').then(module => ({ default: module.default }))
);
const OrderTrackingPage = React.lazy(() =>
  import('@/pages/OrderTrackingPage').then(module => ({ default: module.default }))
);
const ProfileRedirect = React.lazy(() =>
  import('@/components/Common/ProfileRedirect').then(module => ({ default: module.ProfileRedirect }))
);



// Universal optimized loading fallback component
const PageLoadingFallback = memo(() => (
  <ProfessionalLoader
    fullPage={true}
    text="Loading your experience..."
    showBrand={true}
  />
));

PageLoadingFallback.displayName = 'PageLoadingFallback';

// Component to track page views
const PageTracker = () => {
  usePageTracking();
  return null;
};

function App() {
  // Unregister any Service Workers on mount to prevent caching issues
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister().catch(() => {
            // Ignore errors during unregistration
          });
        });
      }).catch(() => {
        // Ignore errors
      });
    }
  }, []);

  // Handle media errors globally
  useEffect(() => {
    const handleMediaError = (e: Event) => {
      const target = e.target as HTMLMediaElement;
      // Prevent the error from propagating
      e.stopImmediatePropagation();
    };

    // Add event listeners for media elements
    document.addEventListener('error', handleMediaError, true);

    return () => {
      document.removeEventListener('error', handleMediaError, true);
    };
  }, []);

  // Handle dynamic import errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      const errorSource = event.filename || '';
      
      // Suppress ServiceWorker-related errors
      if (
        errorMessage.includes('ServiceWorker intercepted') ||
        errorMessage.includes('error loading dynamically imported module') ||
        errorSource.includes('sw.js') ||
        errorMessage.includes('Failed to load')
      ) {
        event.preventDefault();
        // Try to reload the page if it's a critical error
        if (errorMessage.includes('error loading dynamically imported module')) {
          // Don't reload immediately, let the error boundary handle it
          console.warn('[App] Dynamic import error suppressed:', errorMessage);
        }
        return true;
      }
      return false;
    };

    window.addEventListener('error', handleError, true);
    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  // Initialize accessibility features
  useEffect(() => {
    // This will add skip links and other accessibility features
    const initializeAccessibility = async () => {
      const { initializeAccessibility } = await import('./utils/accessibilityEnhancements');
      initializeAccessibility();
    };

    initializeAccessibility();
  }, []);



  return (
    <ErrorBoundary>
      <CombinedProvider>
        <Router>
          <PageTracker />
          <GlobalMediaErrorHandler />
          <ScrollToTop />
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              {/* Admin routes - Protected, requires admin role, NO Layout wrapper (has its own AdminLayout) */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />

              {/* Regular routes - WITH Layout wrapper */}
              <Route path="/*" element={
                <Layout>
                  <main id="main-content" className="focus:outline-none">
                    <Routes>
                      {/* Public routes - No authentication required */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/compare" element={<ComparePage />} />
                      <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/categories" element={<CategoriesPage />} />
                      <Route path="/categories/:slug" element={<ProductsPage />} />
                      <Route path="/collections" element={<CollectionsPage />} />
                      <Route path="/collections/:slug" element={<ProductsPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/contact" element={<ContactPage />} />
                      
                      {/* Legal pages - Public */}
                      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                      <Route path="/refund-policy" element={<RefundPolicyPage />} />
                      <Route path="/shipping-policy" element={<ShippingPolicyPage />} />

                      {/* Auth page - Redirect if already authenticated */}
                      <Route 
                        path="/auth" 
                        element={
                          <PublicRoute redirectIfAuthenticated={true}>
                            <AuthPage />
                          </PublicRoute>
                        } 
                      />

                      {/* Protected routes - Require authentication */}
                      <Route 
                        path="/dashboard/*" 
                        element={
                          <ProtectedRoute>
                            <DashboardPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/wishlist" 
                        element={
                          <ProtectedRoute>
                            <WishlistPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/checkout" 
                        element={
                          <ProtectedRoute>
                            <CheckoutPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/track-order/:orderId" 
                        element={
                          <ProtectedRoute>
                            <OrderTrackingPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/orders/:orderId" 
                        element={
                          <ProtectedRoute>
                            <OrderTrackingPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/profile" 
                        element={
                          <ProtectedRoute>
                            <ProfileRedirect />
                          </ProtectedRoute>
                        } 
                      />

                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                </Layout>
              } />
            </Routes>
          </Suspense>
          <DatabaseErrorOverlay />
        </Router>
      </CombinedProvider>
    </ErrorBoundary>
  );
}

export default App;