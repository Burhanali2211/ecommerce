/**
 * Netlify Serverless Function - API Handler
 * 
 * This function wraps the Express.js application using serverless-http
 * to make it compatible with Netlify Functions.
 */

// @ts-ignore - serverless-http may not have types
import serverless from 'serverless-http';
// @ts-ignore - Types should be available but may not be resolved in this context
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

// Set serverless mode before importing the app
process.env.IS_SERVERLESS = 'true';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the Express app from the compiled server code
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
    // Path is relative to netlify/functions/api.ts
    // Server is compiled to server/dist/index.js
    const serverModule = await import('../../server/dist/index.js');
    app = serverModule.default;
    
    if (!app) {
      throw new Error('Express app not exported from server/index.ts');
    }
    
    return app;
  } catch (error: any) {
    console.error('Failed to import Express app:', error);
    appLoadError = error;
    throw error;
  }
}

/**
 * Netlify Function Handler
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
): Promise<any> => {
  try {
    // Load the Express app
    const expressApp = await loadApp();
    
    // Get the original path
    const originalPath = event.path || '/';
    
    // Netlify strips the function name from the path
    // So /api/auth/login -> /.netlify/functions/api/auth/login -> event.path = "/auth/login"
    // We need to prepend /api to match our Express routes
    let modifiedPath = originalPath;
    
    if (!modifiedPath.startsWith('/api') && !modifiedPath.startsWith('/uploads')) {
      modifiedPath = modifiedPath === '/' ? '/api' : `/api${modifiedPath}`;
    }
    
    // Parse body if it's a string
    let body = event.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        const contentType = (event.headers?.['content-type'] || '').toLowerCase();
        if (contentType.includes('application/json') || body.trim().startsWith('{')) {
          body = JSON.stringify(JSON.parse(body));
        }
      } catch (e) {
        // Keep body as-is if not JSON
      }
    }
    
    // Create modified event for serverless-http
    const modifiedEvent: any = {
      ...event,
      path: modifiedPath,
      body: body,
      httpMethod: event.httpMethod || 'GET',
      headers: {
        ...event.headers,
        'content-type': event.headers?.['content-type'] || 'application/json',
      },
      requestContext: event.requestContext || {
        requestId: context.requestId || 'netlify-request',
        http: {
          method: event.httpMethod || 'GET',
          path: modifiedPath,
        },
      },
    };
    
    // Wrap Express app with serverless-http
    const serverlessHandler = serverless(expressApp, {
      request: (request: any, event: HandlerEvent) => {
        // Ensure path is correct
        request.url = modifiedPath;
        request.path = modifiedPath;
        
        // Parse body if needed
        if (event.body && typeof event.body === 'string' && !request.body) {
          try {
            const contentType = (event.headers?.['content-type'] || '').toLowerCase();
            if (contentType.includes('application/json') || event.body.trim().startsWith('{')) {
              request.body = JSON.parse(event.body);
              (request as any).rawBody = event.body;
            }
          } catch (e) {
            // Keep as string
            request.body = event.body;
          }
        }
        
        // Ensure content-type header
        if (!request.headers['content-type']) {
          request.headers['content-type'] = 'application/json';
        }
      },
      response: (response: any) => {
        // Ensure CORS headers
        if (!response.headers) {
          response.headers = {};
        }
        if (!response.headers['Access-Control-Allow-Origin']) {
          response.headers['Access-Control-Allow-Origin'] = '*';
        }
        if (!response.headers['Access-Control-Allow-Methods']) {
          response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
        }
        if (!response.headers['Access-Control-Allow-Headers']) {
          response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        }
      },
    });
    
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
        },
      }),
    };
  }
};
