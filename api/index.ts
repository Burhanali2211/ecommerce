import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';

let appPromise: Promise<any> | null = null;
let serverlessHandler: any = null;

async function loadApp() {
	if (appPromise) return appPromise;
	
	appPromise = (async () => {
		try {
			const mod = await import('../dist/server/index.js');
			return mod.default || mod;
		} catch (err) {
			console.log('Loading from source (dist not found):', err);
			const mod = await import('../server/index');
			return mod.default || mod;
		}
	})();
	
	return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	try {
		if (!serverlessHandler) {
			const app = await loadApp();
			serverlessHandler = serverless(app as any, {
				binary: ['image/*', 'application/pdf'],
			});
		}
		return serverlessHandler(req, res);
	} catch (error) {
		console.error('API Handler Error:', error);
		res.status(500).json({ 
			error: { 
				status: 500, 
				code: 'INTERNAL_ERROR', 
				message: 'Failed to initialize server' 
			} 
		});
	}
}
