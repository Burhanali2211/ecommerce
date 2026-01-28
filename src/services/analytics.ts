/**
 * Google Analytics 4 Service
 * Tracks user interactions, page views, and e-commerce events
 */

import ReactGA from 'react-ga4';

// Initialize Google Analytics
export const initGA = (measurementId?: string) => {
  const gaId = measurementId || import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!gaId) {
    // Only warn in production - silent in development
    if (import.meta.env.PROD) {
      console.warn('Google Analytics Measurement ID not found. Analytics disabled.');
    }
    return;
  }

  try {
    ReactGA.initialize(gaId, {
      gaOptions: {
        anonymizeIp: true, // GDPR compliance
        cookieFlags: 'SameSite=None;Secure'
      }
    });

    // Only log in development
    if (import.meta.env.DEV) {
      console.log('Google Analytics initialized:', gaId);
    }
  } catch (error) {
    // Silently fail if blocked by ad blocker in development
    if (import.meta.env.PROD) {
      console.error('Failed to initialize Google Analytics:', error);
    }
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  try {
    ReactGA.send({ 
      hitType: 'pageview', 
      page: path,
      title: title || document.title
    });
  } catch (error) {
    console.error('Failed to track page view:', error);
  }
};

// Track custom events
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
) => {
  try {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

// E-commerce tracking
export const trackEcommerce = {
  // View product
  viewProduct: (product: {
    id: string;
    name: string;
    price: number;
    category?: string;
    brand?: string;
  }) => {
    try {
      ReactGA.event('view_item', {
        currency: 'INR',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          item_brand: product.brand || 'HimalayanSpicesExports',
          price: product.price
        }]
      });
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  },

  // Add to cart
  addToCart: (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }) => {
    try {
      ReactGA.event('add_to_cart', {
        currency: 'INR',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          item_category: product.category,
          price: product.price,
          quantity: product.quantity
        }]
      });
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  },

  // Remove from cart
  removeFromCart: (product: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }) => {
    try {
      ReactGA.event('remove_from_cart', {
        currency: 'INR',
        value: product.price * product.quantity,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: product.quantity
        }]
      });
    } catch (error) {
      console.error('Failed to track remove from cart:', error);
    }
  },

  // Begin checkout
  beginCheckout: (cart: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    total: number;
  }) => {
    try {
      ReactGA.event('begin_checkout', {
        currency: 'INR',
        value: cart.total,
        items: cart.items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });
    } catch (error) {
      console.error('Failed to track begin checkout:', error);
    }
  },

  // Purchase
  purchase: (order: {
    orderId: string;
    total: number;
    tax?: number;
    shipping?: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      category?: string;
    }>;
  }) => {
    try {
      ReactGA.event('purchase', {
        transaction_id: order.orderId,
        currency: 'INR',
        value: order.total,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        items: order.items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity
        }))
      });
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  },

  // View cart
  viewCart: (cart: {
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    total: number;
  }) => {
    try {
      ReactGA.event('view_cart', {
        currency: 'INR',
        value: cart.total,
        items: cart.items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });
    } catch (error) {
      console.error('Failed to track view cart:', error);
    }
  },

  // Search
  search: (searchTerm: string) => {
    try {
      ReactGA.event('search', {
        search_term: searchTerm
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }
};

// User engagement tracking
export const trackUserEngagement = {
  // Login
  login: (method: string = 'email') => {
    try {
      ReactGA.event('login', {
        method
      });
    } catch (error) {
      console.error('Failed to track login:', error);
    }
  },

  // Sign up
  signUp: (method: string = 'email') => {
    try {
      ReactGA.event('sign_up', {
        method
      });
    } catch (error) {
      console.error('Failed to track sign up:', error);
    }
  },

  // Share
  share: (contentType: string, itemId: string) => {
    try {
      ReactGA.event('share', {
        content_type: contentType,
        item_id: itemId
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  },

  // Add to wishlist
  addToWishlist: (product: {
    id: string;
    name: string;
    price: number;
  }) => {
    try {
      ReactGA.event('add_to_wishlist', {
        currency: 'INR',
        value: product.price,
        items: [{
          item_id: product.id,
          item_name: product.name,
          price: product.price
        }]
      });
    } catch (error) {
      console.error('Failed to track add to wishlist:', error);
    }
  }
};

// Set user properties
export const setUserProperties = (properties: {
  userId?: string;
  userType?: 'customer' | 'admin';
  [key: string]: any;
}) => {
  try {
    if (properties.userId) {
      ReactGA.set({ userId: properties.userId });
    }
    ReactGA.set(properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
};

// Track timing
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  try {
    ReactGA.event('timing_complete', {
      name: variable,
      value,
      event_category: category,
      event_label: label
    });
  } catch (error) {
    console.error('Failed to track timing:', error);
  }
};

