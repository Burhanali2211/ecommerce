/**
 * Netlify Serverless Function - API Handler
 * 
 * This function wraps the Express.js application using serverless-http
 * to make it compatible with Netlify Functions.
 * 
 * Routing:
 * - Netlify redirects /api/* to /.netlify/functions/api/:splat
 * - The function name "api" is stripped, so /api/auth/login becomes /auth/login
 * - We need to prepend /api back to match Express routes
 */

// @ts-ignore - serverless-http may not have types
import serverless from 'serverless-http';
// @ts-ignore - Types should be available but may not be resolved in this context
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Set serverless mode before importing the app
process.env.IS_SERVERLESS = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the Express app from the compiled server code
// The build process compiles server/ to server/dist/
// We'll lazy-load it in the handler to avoid issues with top-level await
let app: any = null;
let appLoadError: Error | null = null;

// Lazy load the Express app
async function loadApp() {
  if (app) {
    return app;
  }
  
  if (appLoadError) {
    throw appLoadError;
  }
  
  try {
    // Dynamic import to handle ES modules
    // Path is relative to netlify/functions/api.ts -> ../../server/dist/index.js
    const serverModule = await import('../../server/dist/index.js');
    app = serverModule.default;
    
    if (!app) {
      throw new Error('Express app not exported from server/index.ts');
    }
    
    return app;
  } catch (error: any) {
    console.error('Failed to import Express app:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      path: error.path,
    });
    
    appLoadError = error;
    throw error;
  }
}

/**
 * Netlify Function Handler
 * 
 * @param event - Netlify function event
 * @param context - Netlify function context
 * @returns Response from Express app
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<any> => {
  // Load the Express app (lazy loading)
  let expressApp: any;
  try {
    expressApp = await loadApp();
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: {
          status: 500,
          code: 'SERVER_ERROR',
          message: 'Server initialization failed',
          userMessage: 'The server is currently unavailable. Please try again later.',
          timestamp: new Date().toISOString(),
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      }),
    };
  }

  // Netlify strips the function name from the path
  // So /api/auth/login -> /.netlify/functions/api/auth/login -> event.path = "/auth/login"
  // We need to prepend /api to match our Express routes
  const originalPath = event.path;
  let modifiedPath = originalPath;
  
  // Debug logging for path transformation
  console.log('Netlify Function - Path transformation:', {
    originalPath,
    httpMethod: event.httpMethod,
    rawPath: event.rawPath,
    pathParameters: event.pathParameters,
  });

  // Handle the path transformation
  // The path from Netlify will be like "/auth/login" (function name stripped)
  // We need to add "/api" prefix to match Express routes
  // EXCEPTION: /uploads/* paths should go directly to Express without /api prefix
  if (modifiedPath.startsWith('/uploads')) {
    // Keep /uploads path as-is - Express middleware handles it directly
    modifiedPath = originalPath;
  } else if (!modifiedPath.startsWith('/api')) {
    // If path is just "/", it becomes "/api"
    // Otherwise, prepend "/api"
    modifiedPath = modifiedPath === '/' ? '/api' : `/api${modifiedPath}`;
  }
  
  console.log('Netlify Function - Modified path:', {
    originalPath,
    modifiedPath,
    httpMethod: event.httpMethod,
  });

  // Also handle query string if present
  const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
  const fullPath = `${modifiedPath}${queryString}`;

  // CRITICAL: Ensure body is properly formatted for serverless-http
  // Netlify Functions pass body as a string in event.body
  // serverless-http needs it in the correct format
  let eventBody = event.body;
  let isBase64Encoded = false;
  
  // Log for debugging (only in development or for auth endpoints)
  const isAuthEndpoint = originalPath.includes('/auth');
  if (isAuthEndpoint) {
    console.log('Netlify Function - Event received:', {
      path: originalPath,
      method: event.httpMethod,
      hasBody: !!eventBody,
      bodyType: typeof eventBody,
      bodyLength: typeof eventBody === 'string' ? eventBody.length : 0,
      bodyPreview: typeof eventBody === 'string' ? eventBody.substring(0, 100) : null,
      headers: event.headers,
    });
  }
  
  // CRITICAL: Parse JSON body BEFORE passing to serverless-http
  // serverless-http expects the body to be a string, but we need to ensure
  // it's properly formatted and content-type is set
  let parsedBody: any = null;
  
  if (typeof eventBody === 'string' && eventBody.length > 0) {
    // Check if it's already valid JSON
    try {
      parsedBody = JSON.parse(eventBody);
      // Body is valid JSON string - keep as string for serverless-http
      // but we'll also store parsed version for the request transformer
      if (isAuthEndpoint) {
        console.log('Netlify Function - Body is valid JSON string, parsed successfully');
      }
    } catch (e) {
      // Not valid JSON, might be base64 encoded or other format
      // Try to decode if it's base64
      try {
        const decoded = Buffer.from(eventBody, 'base64').toString('utf-8');
        // Check if decoded looks like JSON
        try {
          parsedBody = JSON.parse(decoded);
          eventBody = decoded; // Use decoded string
          isBase64Encoded = true;
          if (isAuthEndpoint) {
            console.log('Netlify Function - Body was base64 encoded, decoded and parsed successfully');
          }
        } catch (parseError) {
          // Decoded but not JSON, use original
          if (isAuthEndpoint) {
            console.log('Netlify Function - Decoded body is not valid JSON');
          }
        }
      } catch (decodeError) {
        // Not base64, use as-is
        if (isAuthEndpoint) {
          console.log('Netlify Function - Body is not base64, using as-is');
        }
      }
    }
  }

  // CRITICAL: For JSON bodies, ensure content-type is set BEFORE creating the event
  // serverless-http uses content-type to determine how to parse the body
  const contentType = event.headers?.['content-type'] || 
                      event.headers?.['Content-Type'] || 
                      (eventBody && typeof eventBody === 'string' && eventBody.trim().startsWith('{') ? 'application/json' : undefined);
  
  // Create a modified event with the correct path and body
  // serverless-http expects AWS Lambda format, so we need to structure it correctly
  const modifiedEvent: any = {
    ...event,
    path: modifiedPath,
    rawPath: fullPath,
    body: eventBody, // Keep as string - serverless-http will parse it
    // Update the URL to include the /api prefix
    url: fullPath,
    // CRITICAL: Ensure headers include content-type for JSON
    // This is essential for serverless-http to parse the body correctly
    headers: {
      ...event.headers,
      'content-type': contentType || 'application/json',
      'Content-Type': contentType || 'application/json',
    },
    // serverless-http might need isBase64Encoded flag
    isBase64Encoded: isBase64Encoded,
    // Ensure httpMethod is set
    httpMethod: event.httpMethod || event.requestContext?.http?.method || 'POST',
    // Request context for serverless-http
    requestContext: event.requestContext || {
      requestId: context.requestId || 'netlify-request',
      http: {
        method: event.httpMethod || 'POST',
        path: modifiedPath,
      },
    },
  };
  
  if (isAuthEndpoint) {
    console.log('Netlify Function - Modified event prepared:', {
      path: modifiedEvent.path,
      httpMethod: modifiedEvent.httpMethod,
      contentType: modifiedEvent.headers['content-type'],
      hasBody: !!modifiedEvent.body,
      bodyType: typeof modifiedEvent.body,
      bodyLength: typeof modifiedEvent.body === 'string' ? modifiedEvent.body.length : 0,
      isBase64Encoded: modifiedEvent.isBase64Encoded,
    });
  }

  // Wrap the Express app with serverless-http
  // Store parsedBody and isAuthEndpoint in closure for request transformer
  const requestTransformerData = {
    parsedBody,
    isAuthEndpoint
  };
  
  const serverlessHandler = serverless(expressApp, {
    // Request transformation
    request: (request: any, event: HandlerEvent, context: HandlerContext) => {
      // Update the path in the request
      request.url = modifiedPath;
      request.path = modifiedPath;
      
      // Preserve original path for logging
      request.originalPath = originalPath;
      
      // Set headers for serverless environment
      request.headers = request.headers || {};
      request.headers['x-netlify-event'] = 'true';
      request.headers['x-original-path'] = originalPath;
      
      // CRITICAL: Manually inject body into request object
      // serverless-http might not parse it correctly, so we force it here
      // Set both body and rawBody to ensure Express middleware can access it
      if (requestTransformerData.parsedBody) {
        // Set the parsed body directly
        request.body = requestTransformerData.parsedBody;
        // Also set rawBody in case Express middleware needs it
        (request as any).rawBody = typeof eventBody === 'string' ? eventBody : JSON.stringify(requestTransformerData.parsedBody);
        // Force content-type to ensure Express knows it's JSON
        if (!request.headers['content-type'] && !request.headers['Content-Type']) {
          request.headers['content-type'] = 'application/json';
          request.headers['Content-Type'] = 'application/json';
        }
        if (requestTransformerData.isAuthEndpoint) {
          console.log('Netlify Function - Request transformer: INJECTED body from pre-parsed data:', {
            keys: Object.keys(requestTransformerData.parsedBody),
            hasEmail: !!requestTransformerData.parsedBody.email,
            hasPassword: !!requestTransformerData.parsedBody.password,
            emailValue: requestTransformerData.parsedBody.email,
            bodySet: !!request.body,
            bodyKeys: request.body ? Object.keys(request.body) : [],
            hasRawBody: !!(request as any).rawBody
          });
        }
      } else if (event.body && typeof event.body === 'string' && event.body.length > 0) {
        // Fallback: try to parse from event body
        const contentType = (request.headers['content-type'] || '').toLowerCase();
        if (contentType.includes('application/json') || event.body.trim().startsWith('{')) {
          try {
            // Try to parse the body if it's a string
            if (typeof event.body === 'string') {
              const parsed = JSON.parse(event.body);
              request.body = parsed;
              (request as any).rawBody = event.body;
              // Ensure content-type is set
              if (!request.headers['content-type'] && !request.headers['Content-Type']) {
                request.headers['content-type'] = 'application/json';
                request.headers['Content-Type'] = 'application/json';
              }
              if (requestTransformerData.isAuthEndpoint) {
                console.log('Netlify Function - Request transformer: Parsed and injected body from event:', {
                  keys: Object.keys(request.body),
                  hasEmail: !!request.body.email,
                  hasPassword: !!request.body.password
                });
              }
            } else if (event.body) {
              request.body = event.body;
              (request as any).rawBody = JSON.stringify(event.body);
            }
          } catch (parseError) {
            console.error('Netlify Function - Failed to parse body in request transformer:', parseError);
            if (requestTransformerData.isAuthEndpoint) {
              console.error('Netlify Function - Event body that failed to parse:', {
                type: typeof event.body,
                length: event.body.length,
                preview: event.body.substring(0, 100)
              });
            }
          }
        }
      } else if (requestTransformerData.isAuthEndpoint) {
        // Log what we have
        console.log('Netlify Function - Request transformer: Body status:', {
          hasParsedBody: !!requestTransformerData.parsedBody,
          hasRequestBody: !!request.body,
          requestBodyKeys: request.body ? Object.keys(request.body) : [],
          requestBodyType: typeof request.body
        });
      }
    },
    // Response transformation
    response: (response: any) => {
      // Ensure CORS headers are set
      if (!response.headers) {
        response.headers = {};
      }
      
      // Add CORS headers if not already present
      if (!response.headers['Access-Control-Allow-Origin']) {
        const origin = event.headers?.origin || event.headers?.Origin;
        if (origin) {
          response.headers['Access-Control-Allow-Origin'] = origin;
        } else {
          response.headers['Access-Control-Allow-Origin'] = '*';
        }
      }
      
      if (!response.headers['Access-Control-Allow-Credentials']) {
        response.headers['Access-Control-Allow-Credentials'] = 'true';
      }
      
      if (!response.headers['Access-Control-Allow-Methods']) {
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
      }
      
      if (!response.headers['Access-Control-Allow-Headers']) {
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
      }
    },
  });

  try {
    // Call the serverless handler
    const result = await serverlessHandler(modifiedEvent, context);
    return result;
  } catch (error: any) {
    console.error('Error in Netlify function handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: {
          status: 500,
          code: 'FUNCTION_ERROR',
          message: error.message || 'Internal server error',
          userMessage: 'An error occurred processing your request.',
          timestamp: new Date().toISOString(),
          path: originalPath,
        },
      }),
    };
  }
};

