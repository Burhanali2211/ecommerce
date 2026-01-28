import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API Configuration
 * 
 * Automatically detects environment and sets correct API base URL:
 * - Development: Uses VITE_API_URL or VITE_API_BASE_URL, falls back to /api (proxied)
 * - Production: Uses VITE_API_URL or defaults to /api
 */

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use environment variable or default to /api
  return import.meta.env.VITE_API_URL || '/api';
};

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    // Use auth_token to match the rest of the application
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add cache-busting for dashboard settings to prevent stale data
    if (config.url?.includes('/admin/settings/dashboard')) {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
      // Also set cache control headers
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - only redirect if it's a real auth error
    if (error.response?.status === 401) {
      // Check if it's an authentication error (not just missing token)
      const errorData = error.response?.data as any;
      const isAuthError = errorData?.error?.code === 'UNAUTHORIZED' || 
                         error.message?.includes('token') ||
                         error.message?.includes('authentication');
      
      if (isAuthError) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        // Only redirect if we're not already on the auth page
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/auth/') {
          window.location.href = '/auth';
        }
      }
    }

    // Log errors in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url,
      });
    }

    return Promise.reject(error);
  }
);

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // Products
  PRODUCTS: {
    LIST: '/products',
    GET: (id: string) => `/products/${id}`,
    SEARCH: '/products/search',
    FEATURED: '/products?featured=true',
    LATEST: '/products?latest=true',
  },

  // Categories
  CATEGORIES: {
    LIST: '/categories',
    GET: (id: string) => `/categories/${id}`,
  },

  // Cart
  CART: {
    GET: '/cart',
    ADD: '/cart/add',
    UPDATE: '/cart/update',
    REMOVE: '/cart/remove',
    CLEAR: '/cart/clear',
  },

  // Wishlist
  WISHLIST: {
    GET: '/wishlist',
    ADD: '/wishlist/add',
    REMOVE: '/wishlist/remove',
  },

  // Orders
  ORDERS: {
    LIST: '/orders',
    GET: (id: string) => `/orders/${id}`,
    CREATE: '/orders',
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },

  // Addresses
  ADDRESSES: {
    LIST: '/addresses',
    CREATE: '/addresses',
    UPDATE: (id: string) => `/addresses/${id}`,
    DELETE: (id: string) => `/addresses/${id}`,
  },

  // Payment Methods
  PAYMENT_METHODS: {
    LIST: '/payment-methods',
    CREATE: '/payment-methods',
    DELETE: (id: string) => `/payment-methods/${id}`,
  },

  // Contact
  CONTACT: {
    SUBMIT: '/contact',
  },

  // Admin
  ADMIN: {
    ANALYTICS: '/admin/analytics',
    ORDERS: '/admin/orders',
    PRODUCTS: '/admin/products',
    USERS: '/admin/users',
    CONTACT_SUBMISSIONS: '/admin/contact-submissions',
    SETTINGS: {
      THEME: '/admin/settings/theme',
      SITE_SETTINGS: '/admin/settings/site-settings',
      SOCIAL_MEDIA: '/admin/settings/social-media',
      CONTACT_INFO: '/admin/settings/contact-info',
      BUSINESS_HOURS: '/admin/settings/business-hours',
      FOOTER_LINKS: '/admin/settings/footer-links',
      DASHBOARD: '/admin/settings/dashboard'
    }
  },

  // Seller
  SELLER: {
    PRODUCTS: '/seller/products',
    ORDERS: '/seller/orders',
  },
};

/**
 * Helper function to make API calls
 */
export const api = {
  BASE_URL: getApiBaseUrl(),
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
  patch: (url: string, data?: any, config?: any) => apiClient.patch(url, data, config),
  delete: (url: string, config?: any) => apiClient.delete(url, config),
};

export default apiClient;

