
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Minimal handler for /api endpoint
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
	message: 'API root. Please use a specific endpoint such as /api/products, /api/categories, etc.'
  });
}
