// Netlify Function: payment-process
// Handles Razorpay order creation and payment verification
//
// Required environment variables in Netlify dashboard:
//   RAZORPAY_KEY_ID      — Razorpay Key ID
//   RAZORPAY_KEY_SECRET  — Razorpay Key Secret
//   SUPABASE_URL         — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (bypasses RLS)

const https = require('https');
const crypto = require('crypto');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function razorpayRequest(path, method, body, keyId, keySecret) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const data = JSON.stringify(body);
    const options = {
      hostname: 'api.razorpay.com',
      port: 443,
      path,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch (e) { reject(new Error('Invalid JSON from Razorpay')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function updateOrderInSupabase(supabaseUrl, serviceKey, orderId, updateData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(updateData);
    const url = new URL(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Prefer': 'return=minimal',
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const action = event.queryStringParameters?.action;
    const body = JSON.parse(event.body || '{}');

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: 'Payment gateway not configured' }),
      };
    }

    // 1. Create Razorpay Order
    if (action === 'create-order') {
      const { amount, currency = 'INR', receipt, notes } = body;
      const order = await razorpayRequest('/v1/orders', 'POST', {
        amount: Math.round(amount * 100),
        currency,
        receipt,
        notes,
      }, razorpayKeyId, razorpayKeySecret);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: order }),
      };
    }

    // 2. Verify Payment
    if (action === 'verify-payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid payment signature' }),
        };
      }

      // Update order in Supabase if order_id provided
      if (order_id && supabaseUrl && supabaseServiceKey) {
        await updateOrderInSupabase(supabaseUrl, supabaseServiceKey, order_id, {
          payment_status: 'paid',
          status: 'confirmed',
          razorpay_payment_id,
          razorpay_order_id,
          updated_at: new Date().toISOString(),
        });
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Payment verified' }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action. Use ?action=create-order or ?action=verify-payment' }),
    };

  } catch (error) {
    console.error('payment-process error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
