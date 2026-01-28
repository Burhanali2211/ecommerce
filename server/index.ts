import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { autoInitializeDatabase } from './scripts/autoInitDb'; // Use our new auto-init script
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { apiLimiter, adminLimiter } from './middleware/rateLimiter';
import { isServerless } from './utils/serverless';
import { performanceMonitor } from './middleware/performanceMonitor';
import { logger } from './utils/logger';
import { query } from './db/connection';

// Get __dirname - handle both ES modules and serverless environments
let __dirname: string;
if (typeof import.meta !== 'undefined' && import.meta.url) {
  const __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} else {
  // Fallback for serverless environments where import.meta.url is undefined
  // Use process.cwd() as base, which in Netlify Functions is /var/task
  __dirname = process.cwd();
}

// Import routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import addressRoutes from './routes/addresses';
import orderRoutes from './routes/orders';
import paymentMethodRoutes from './routes/paymentMethods';
import notificationPreferenceRoutes from './routes/notificationPreferences';
import shippingRoutes from './routes/shipping';
import sitemapRoutes from './routes/sitemap';
import razorpayRoutes from './routes/razorpay';
import uploadRoutes from './routes/upload';
import contactRoutes from './routes/contact';

// Import admin routes
import adminAnalyticsRoutes from './routes/admin/analytics';
import adminProductsRoutes from './routes/admin/products';
import adminUsersRoutes from './routes/admin/users';
import adminOrdersRoutes from './routes/admin/orders';
import adminSettingsRoutes from './routes/admin/settings';
import adminRateLimitRoutes from './routes/admin/rateLimit';
import adminContactSubmissionsRoutes from './routes/admin/contactSubmissions';
import adminInventoryRoutes from './routes/admin/inventory';
import adminPosRoutes from './routes/admin/pos';

// Import public routes
import publicSettingsRoutes from './routes/public/settings';

// Import seller routes
import sellerProductsRoutes from './routes/seller/products';
import sellerOrdersRoutes from './routes/seller/orders';

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ==========================================
// CRITICAL: Validate Required Environment Variables
// ==========================================
function validateEnvironment(): void {
  const requiredEnvVars = [
    'JWT_SECRET',
  ];

  // DB_PASSWORD is only required if DATABASE_URL is not provided
  if (!process.env.DATABASE_URL) {
    requiredEnvVars.push('DB_PASSWORD');
  }

  // Check for production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    // DATABASE_URL is required in production
    if (!process.env.DATABASE_URL) {
      requiredEnvVars.push('DATABASE_URL');
    }
    // FRONTEND_URL is required in production
    requiredEnvVars.push('FRONTEND_URL');
    // RAZORPAY_KEY_SECRET is optional - only required if using payment features
    // Payment routes will handle missing credentials gracefully
  }

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    logger.error('FATAL: Missing required environment variables');
    missing.forEach(varName => logger.error(`   - ${varName}`));
    logger.error('Please check your .env file and ensure all required variables are set.');
    logger.error('See .env.example for reference.');
    // Don't exit in serverless mode - allow app to be exported
    if (!process.env.IS_SERVERLESS) {
      process.exit(1);
    } else {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32) {
    logger.error('FATAL: JWT_SECRET must be at least 32 characters long.');
    logger.error('Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    if (!process.env.IS_SERVERLESS) {
      process.exit(1);
    } else {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
  }

  // Warn about weak JWT secrets
  if (jwtSecret.includes('your-secret-key') || jwtSecret.includes('change-in-production')) {
    logger.error('FATAL: JWT_SECRET contains placeholder text. This is a security risk!');
    logger.error('Generate a secure secret with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    if (!process.env.IS_SERVERLESS) {
      process.exit(1);
    } else {
      throw new Error('JWT_SECRET contains placeholder text');
    }
  }

  logger.success('Environment variables validated successfully');
}

// Validate environment before starting server
// In serverless mode, be more lenient - don't fail if some vars are missing
if (!isServerless()) {
  validateEnvironment();
} else {
  // In serverless mode, only validate critical vars, warn about others
  try {
    validateEnvironment();
  } catch (error) {
    logger.warn('Environment validation warning in serverless mode:', error);
    // Don't throw - allow app to be exported
  }
}


const app: Express = express();
const PORT = Number(process.env.PORT) || 5000;

// CRITICAL: Trust proxy for serverless environments (Vercel/Netlify Functions)
if (isServerless()) {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', true);
}

// 1️⃣ CORS — MUST BE FIRST MIDDLEWARE
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    const allowed = [
      'https://www.himalayanspicesexports.com',
      'https://himalayanspicesexports.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5001'
    ];
    if (process.env.NODE_ENV === 'development' || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('/{*path}', cors(corsOptions));

// 2️⃣ HELMET — AFTER CORS, NO SERVER CSP
app.use(helmet({
  contentSecurityPolicy: false, // IMPORTANT: CSP only in HTML
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CRITICAL: Aggressive body parsing for serverless environments
// This handles cases where express.json() or serverless-http didn't parse the body
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = (req.headers['content-type'] || '').toLowerCase();
    const isJsonRequest = contentType.includes('application/json');
    const isAuthEndpoint = req.path.includes('/auth');
    
    // Log for auth endpoints to debug
    if (isAuthEndpoint) {
      console.log('BodyParser Middleware - Auth request:', {
        path: req.path,
        method: req.method,
        contentType,
        bodyType: typeof req.body,
        bodyIsArray: Array.isArray(req.body),
        bodyKeys: req.body ? Object.keys(req.body) : [],
        hasBody: !!req.body,
        bodyValue: req.body,
        bodyString: typeof req.body === 'string' ? req.body.substring(0, 200) : null,
        hasRawBody: !!(req as any).rawBody
      });
    }
    
    // Case 1: Body is a string (serverless-http sometimes passes it as string)
    if (typeof req.body === 'string' && req.body.length > 0) {
      // Try to parse if it looks like JSON
      if (req.body.trim().startsWith('{') || req.body.trim().startsWith('[')) {
        try {
          req.body = JSON.parse(req.body);
          if (isAuthEndpoint) {
            console.log('BodyParser Middleware - Parsed body from string:', { keys: Object.keys(req.body) });
          }
          logger.debug('Parsed body from string in middleware', { 
            context: 'BodyParser', 
            data: { keys: Object.keys(req.body), path: req.path } 
          });
        } catch (e) {
          if (isAuthEndpoint) {
            console.error('BodyParser Middleware - Failed to parse body as JSON:', e);
            console.error('BodyParser Middleware - Body content:', req.body.substring(0, 200));
          }
          logger.warn('Failed to parse body as JSON string', { 
            context: 'BodyParser', 
            data: { path: req.path, bodyPreview: req.body.substring(0, 100) } 
          });
        }
      }
    }
    
    // Case 2: Body is empty or undefined but we have raw body
    if ((!req.body || Object.keys(req.body).length === 0) && (req as any).rawBody) {
      const rawBody = (req as any).rawBody;
      if (typeof rawBody === 'string' && rawBody.length > 0) {
        try {
          req.body = JSON.parse(rawBody);
          if (isAuthEndpoint) {
            console.log('BodyParser Middleware - Parsed body from rawBody:', { keys: Object.keys(req.body) });
          }
          logger.debug('Parsed body from rawBody in middleware', { 
            context: 'BodyParser', 
            data: { keys: Object.keys(req.body), path: req.path } 
          });
        } catch (e) {
          if (isAuthEndpoint) {
            console.error('BodyParser Middleware - Failed to parse rawBody:', e);
          }
          logger.warn('Failed to parse rawBody as JSON', { context: 'BodyParser', data: { path: req.path } });
        }
      }
    }
    
    // Case 3: Body is completely missing for JSON requests - log warning
    if (isJsonRequest && (!req.body || Object.keys(req.body).length === 0)) {
      if (isAuthEndpoint) {
        console.warn('BodyParser Middleware - Empty body for JSON auth request:', {
          path: req.path,
          contentType,
          contentLength: req.headers['content-length'],
          hasRawBody: !!(req as any).rawBody
        });
      }
      logger.warn('Empty body for JSON request', {
        context: 'BodyParser',
        data: {
          path: req.path,
          method: req.method,
          contentType,
          contentLength: req.headers['content-length'],
          hasRawBody: !!(req as any).rawBody
        }
      });
    }
  }
  next();
});

app.use(requestLogger);
app.use(performanceMonitor);

// Serve uploaded images - check database first, then filesystem
app.use('/uploads', async (req, res, next) => {
  // Set CORS headers for static files
  res.setHeader('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL || '*')
    : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  // Set timeout for image requests (important for serverless)
  // Netlify Functions: 10s free tier, 26s pro tier - use 8s to leave buffer
  const timeout = process.env.IS_SERVERLESS ? 8000 : 25000;
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: {
          status: 408,
          code: 'REQUEST_TIMEOUT',
          message: 'Image request timed out',
          userMessage: 'The image took too long to load. Please try again.',
        }
      });
    }
  }, timeout);

  // Try to serve from database first (for serverless)
  try {
    const urlPath = req.path; // e.g., /uploads/products/image.jpg
    
    // Use Promise.race to handle timeout
    // Reduced to 5 seconds for Netlify Functions (10s limit, need buffer for processing)
    // Using prepared statement for better performance and security
    const dbQuery = query(
      `SELECT file_data, mime_type, file_size, filename 
       FROM public.uploaded_files 
       WHERE url_path = $1 
       LIMIT 1`,
      [urlPath]
    );

    const dbTimeout = process.env.IS_SERVERLESS ? 5000 : 20000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), dbTimeout);
    });

    const result = await Promise.race([dbQuery, timeoutPromise]) as any;

    if (result.rows && result.rows.length > 0) {
      const file = result.rows[0];
      
      // Validate file data exists
      if (!file.file_data) {
        clearTimeout(timeoutId);
        return res.status(404).json({
          error: {
            status: 404,
            code: 'FILE_NOT_FOUND',
            message: 'Image data not found',
            userMessage: 'The requested image could not be found.',
          }
        });
      }

      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(file.file_data, 'base64');
        
        // Validate buffer size matches file_size
        if (buffer.length !== file.file_size) {
          logger.warn('Image buffer size mismatch', {
            context: 'Uploads',
            data: { path: urlPath, expected: file.file_size, actual: buffer.length }
          });
        }
        
        // Set headers FIRST (before sending data) - helps browser start processing
        res.setHeader('Content-Type', file.mime_type || 'image/jpeg');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year, immutable
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Clear timeout since we're sending response
        clearTimeout(timeoutId);
        
        // Send the image buffer
        // Use res.end() for better control over response completion
        res.end(buffer);
        return;
      } catch (bufferError) {
        clearTimeout(timeoutId);
        logger.error('Failed to convert image data to buffer', {
          context: 'Uploads',
          error: bufferError,
          data: { path: urlPath }
        });
        return res.status(500).json({
          error: {
            status: 500,
            code: 'IMAGE_PROCESSING_ERROR',
            message: 'Failed to process image data',
            userMessage: 'The image could not be processed. Please try again.',
          }
        });
      }
    }
    
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // If timeout error, return 408
    if (error.message === 'Database query timeout') {
      return res.status(408).json({
        error: {
          status: 408,
          code: 'REQUEST_TIMEOUT',
          message: 'Image request timed out',
          userMessage: 'The image took too long to load. Please try again.',
        }
      });
    }
    
    // If database lookup fails, continue to filesystem
    logger.debug('Database image lookup failed, trying filesystem', { 
      context: 'Uploads', 
      data: { path: req.path, error: error.message } 
    });
  }

  // Fallback to filesystem (development mode)
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1y', // Cache images for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Additional headers for image files
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  },
  fallthrough: true // Allow 404 if file not found
}));

// Apply rate limiting to all API routes (except health check)
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
}

// Sitemap route (before API routes)
app.use('/', sitemapRoutes);

// Health check routes (no rate limiting)
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/notification-preferences', notificationPreferenceRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

// Admin API Routes (with stricter rate limiting in production)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/admin', adminLimiter);
}
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);
app.use('/api/admin/rate-limit', adminLimiter);
app.use('/api/admin/contact-submissions', adminContactSubmissionsRoutes);
app.use('/api/admin/inventory', adminInventoryRoutes);
app.use('/api/admin/pos', adminPosRoutes);

// Public API Routes
app.use('/api/public/settings', publicSettingsRoutes);

// Seller API Routes
app.use('/api/seller/products', sellerProductsRoutes);
app.use('/api/seller/orders', sellerOrdersRoutes);

// 404 handler - must be before error handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      status: 404,
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
      userMessage: 'The requested endpoint does not exist.',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      availableEndpoints: process.env.NODE_ENV === 'development' ? [
        'GET /api/products',
        'GET /api/categories',
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/cart',
        'POST /api/orders',
        'See server/index.ts for full list'
      ] : undefined
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server (only if not in serverless mode)
async function startServer() {
  try {
    // Auto-initialize database with schema and sample data
    await autoInitializeDatabase();

    // Only start listening if not in serverless mode
    if (!process.env.IS_SERVERLESS) {
      app.listen(PORT, '0.0.0.0', () => {
        logger.success(`Server running on:`);
        logger.info(`  - Local:   http://localhost:${PORT}`);
        logger.info(`  - Network: http://<your-ip>:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        if (process.env.NODE_ENV === 'development') {
          logger.info(`\n📱 To access from mobile on same network:`);
          logger.info(`  1. Find your computer's IP address`);
          logger.info(`  2. On mobile, open: http://<your-ip>:5173`);
        }
      });
    } else {
      // In serverless mode, just initialize the database
      logger.info('Running in serverless mode - database initialized');
    }
  } catch (error) {
    logger.error('Failed to start server', error);
    if (!process.env.IS_SERVERLESS) {
      process.exit(1);
    }
  }
}

// Only start server if not in serverless mode
if (!process.env.IS_SERVERLESS) {
  startServer();
} else {
  // In serverless mode, initialize database asynchronously (don't block export)
  // The app must be exported even if DB init fails
  autoInitializeDatabase().catch((error) => {
    logger.error('Failed to initialize database in serverless mode', error);
    // Don't throw - allow the app to be exported even if DB init fails
  });
}

// Always export the app, even in serverless mode
// This ensures the export happens regardless of initialization state
export default app;