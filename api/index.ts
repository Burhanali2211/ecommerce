import type { VercelRequest, VercelResponse } from '@vercel/node';

// Import the Express app from server
import app from '../server/index';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.status(200).end();
    return;
  }

  // Pass request to Express app
  return new Promise((resolve) => {
    app(req as any, res as any);
    res.on('finish', () => {
      resolve(undefined);
    });
  });
}
