const crypto = require('crypto');
const express = require('express');

const originalStatic = express.static;
const PRODUCT = 'Talent Market Snapshot Challenge';
const AMOUNT = 9900;
const CURRENCY = 'INR';
const rateBuckets = new Map();

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 20000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (_) { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function getCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured');
  return { keyId, keySecret };
}

function basicAuth(keyId, keySecret) {
  return 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
}

async function razorpayRequest(path, options = {}) {
  const { keyId, keySecret } = getCredentials();
  const response = await fetch('https://api.razorpay.com/v1' + path, {
    method: options.method || 'GET',
    headers: {
      Authorization: basicAuth(keyId, keySecret),
      'Content-Type': 'application/json'
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data && data.error && data.error.description ? data.error.description : 'Razorpay request failed';
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return data;
}

function allowed(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  const now = Date.now();
  const bucket = rateBuckets.get(ip) || { start: now, count: 0 };
  if (now - bucket.start > 60000) { bucket.start = now; bucket.count = 0; }
  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return bucket.count <= 30;
}

async function createOrder(req, res) {
  if (!allowed(req)) return json(res, 429, { error: 'Too many requests. Please try again shortly.' });
  try {
    const { keyId } = getCredentials();
    const receipt = 'tms_' + Date.now();
    const order = await razorpayRequest('/orders', {
      method: 'POST',
      body: {
        amount: AMOUNT,
        currency: CURRENCY,
        receipt,
        notes: { product: PRODUCT, source: 'iamarecruiter.in/ai-workflow' }
      }
    });
    return json(res, 200, {
      key_id: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      product: PRODUCT
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err.message);
    return json(res, 502, { error: 'Unable to start payment right now. Please try again.' });
  }
}

function safeEqualHex(a, b) {
  try {
    const aBuf = Buffer.from(String(a), 'hex');
    const bBuf = Buffer.from(String(b), 'hex');
    return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
  } catch (_) { return false; }
}

async function verifyPayment(req, res) {
  if (!allowed(req)) return json(res, 429, { error: 'Too many requests. Please try again shortly.' });
  try {
    const body = await readJson(req);
    const orderId = String(body.razorpay_order_id || '');
    const paymentId = String(body.razorpay_payment_id || '');
    const signature = String(body.razorpay_signature || '');
    if (!orderId || !paymentId || !signature) return json(res, 400, { error: 'Missing payment verification details.' });

    const { keySecret } = getCredentials();
    const expected = crypto.createHmac('sha256', keySecret).update(orderId + '|' + paymentId).digest('hex');
    if (!safeEqualHex(expected, signature)) return json(res, 400, { error: 'Payment signature verification failed.' });

    const [order, payment] = await Promise.all([
      razorpayRequest('/orders/' + encodeURIComponent(orderId)),
      razorpayRequest('/payments/' + encodeURIComponent(paymentId))
    ]);

    const orderMatches = order && order.id === orderId && order.amount === AMOUNT && order.currency === CURRENCY;
    const paymentMatches = payment && payment.id === paymentId && payment.order_id === orderId && payment.amount === AMOUNT && payment.currency === CURRENCY && payment.status === 'captured';
    if (!orderMatches || !paymentMatches) return json(res, 400, { error: 'Payment could not be confirmed as captured.' });

    return json(res, 200, { verified: true, payment_id: paymentId, order_id: orderId, product: PRODUCT, amount: AMOUNT, currency: CURRENCY });
  } catch (err) {
    console.error('Razorpay verification failed:', err.message);
    return json(res, 502, { error: 'Unable to verify payment right now. Please contact support with your payment ID.' });
  }
}

express.static = function patchedStatic(...args) {
  const staticMiddleware = originalStatic.apply(express, args);
  return function paymentAwareStatic(req, res, next) {
    if (req.method === 'POST' && req.url.split('?')[0] === '/api/razorpay/order') {
      return readJson(req).then(() => createOrder(req, res)).catch((err) => json(res, 400, { error: err.message }));
    }
    if (req.method === 'POST' && req.url.split('?')[0] === '/api/razorpay/verify') {
      return verifyPayment(req, res);
    }
    return staticMiddleware(req, res, next);
  };
};

console.log('Razorpay payment middleware bootstrap loaded.');
