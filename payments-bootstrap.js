const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');

const originalStatic = express.static;
const PRODUCT = 'Talent Market Snapshot Challenge';
const AMOUNT = 9900;
const CURRENCY = 'INR';
const TEST_COUPON = 'TALENT98';
const TEST_COUPON_DISCOUNT = 9800;
const TEST_COUPON_AMOUNT = AMOUNT - TEST_COUPON_DISCOUNT;
const rateBuckets = new Map();
let couponOrderCache = null;

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
      if (body.length > 30000) {
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

async function razorpayRequest(apiPath, options = {}) {
  const { keyId, keySecret } = getCredentials();
  const response = await fetch('https://api.razorpay.com/v1' + apiPath, {
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

function trackerConfigured() {
  return /^https:\/\//i.test(String(process.env.TMS_TRACKER_WEBHOOK_URL || ''));
}

async function trackerRequest(action, payload) {
  const webhook = String(process.env.TMS_TRACKER_WEBHOOK_URL || '').trim();
  const trackerToken = String(process.env.TMS_TRACKER_TOKEN || '').trim();
  if (!webhook) return null;
  if (!trackerToken) throw new Error('Tracker token is not configured');
  const separator = webhook.includes('?') ? '&' : '?';
  const authenticatedWebhook = webhook + separator + 'token=' + encodeURIComponent(trackerToken);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(authenticatedWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action }, payload || {})),
      signal: controller.signal,
      redirect: 'follow'
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (_) { throw new Error('Tracker returned a non-JSON response'); }
    if (!response.ok || !data || data.ok === false) throw new Error((data && data.error) || 'Tracker request failed');
    return data;
  } finally {
    clearTimeout(timer);
  }
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

function clean(value, max) {
  return String(value || '').trim().slice(0, max || 256);
}

function normalizeMobile(value) {
  return clean(value, 20).replace(/[^0-9+]/g, '');
}

function normalizeEmail(value) {
  return clean(value, 160).toLowerCase();
}

function validateCustomer(body) {
  const customer = {
    name: clean(body.name, 120),
    email: normalizeEmail(body.email),
    mobile: normalizeMobile(body.mobile),
    billing_address: clean(body.billing_address, 240),
    linkedin_url: clean(body.linkedin_url, 240)
  };
  if (customer.name.length < 2) return { error: 'Please enter your full name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return { error: 'Please enter a valid email address.' };
  if (!/^\+?[0-9]{10,15}$/.test(customer.mobile)) return { error: 'Please enter a valid mobile number.' };
  if (customer.billing_address.length < 8) return { error: 'Please enter your billing address.' };
  if (customer.linkedin_url && !/^https?:\/\/(www\.)?linkedin\.com\//i.test(customer.linkedin_url)) return { error: 'Please enter a valid LinkedIn profile URL.' };
  return { customer };
}

function customerKey(customer) {
  return crypto.createHash('sha256').update(customer.email + '|' + customer.mobile).digest('hex').slice(0, 24);
}

async function findExistingCouponOrder() {
  if (couponOrderCache) return couponOrderCache;
  const data = await razorpayRequest('/orders?count=100');
  const items = Array.isArray(data.items) ? data.items : [];
  const found = items.find((order) => order && order.notes && String(order.notes.coupon || '').toUpperCase() === TEST_COUPON);
  if (found) couponOrderCache = found;
  return found || null;
}

async function couponStatus(req, res) {
  if (!allowed(req)) return json(res, 429, { error: 'Too many requests. Please try again shortly.' });
  try {
    const body = await readJson(req);
    const code = clean(body.coupon, 40).toUpperCase();
    const email = normalizeEmail(body.email);
    const mobile = normalizeMobile(body.mobile);
    if (!code) return json(res, 200, { valid: false, amount: AMOUNT, discount: 0, message: 'Enter a coupon code.' });

    if (trackerConfigured()) {
      const result = await trackerRequest('check_coupon', { coupon: code, email, mobile });
      return json(res, 200, {
        valid: !!result.valid,
        coupon: result.valid ? code : '',
        amount: Number(result.amount_paise || AMOUNT),
        discount: Number(result.discount_paise || 0),
        user_type: result.user_type || 'BUYER',
        coupon_counted: result.coupon_counted === false ? false : true,
        message: result.message || (result.valid ? 'Coupon applied.' : 'Coupon is not valid.')
      });
    }

    if (code !== TEST_COUPON) return json(res, 200, { valid: false, amount: AMOUNT, discount: 0, message: 'Coupon code is not valid.' });
    const existing = await findExistingCouponOrder();
    if (existing) return json(res, 200, { valid: false, amount: AMOUNT, discount: 0, message: 'TALENT98 has already been claimed.' });
    return json(res, 200, { valid: true, coupon: TEST_COUPON, amount: TEST_COUPON_AMOUNT, discount: TEST_COUPON_DISCOUNT, message: 'TALENT98 applied. ₹98 discount.' });
  } catch (err) {
    console.error('Coupon check failed:', err.message);
    return json(res, 502, { error: 'Unable to validate coupon right now.' });
  }
}

async function createOrder(req, res) {
  if (!allowed(req)) return json(res, 429, { error: 'Too many requests. Please try again shortly.' });
  let reservationId = '';
  try {
    const body = await readJson(req);
    const validation = validateCustomer(body);
    if (validation.error) return json(res, 400, { error: validation.error });
    const customer = validation.customer;
    const code = clean(body.coupon, 40).toUpperCase();
    const source = clean(body.source, 160) || 'iamarecruiter.in/ai-workflow';
    const { keyId } = getCredentials();
    let amount = AMOUNT;
    let discount = 0;
    let appliedCoupon = '';
    let userType = 'BUYER';
    let couponCounted = false;

    if (code && trackerConfigured()) {
      const reservation = await trackerRequest('reserve_coupon', {
        coupon: code,
        customer,
        product: PRODUCT,
        original_price_paise: AMOUNT,
        source
      });
      if (!reservation.valid) return json(res, 409, { error: reservation.message || 'Coupon is not available.' });
      reservationId = clean(reservation.reservation_id, 120);
      amount = Number(reservation.amount_paise || AMOUNT);
      discount = Number(reservation.discount_paise || 0);
      appliedCoupon = code;
      userType = reservation.user_type || 'BUYER';
      couponCounted = reservation.coupon_counted === true;
    } else if (code) {
      if (code !== TEST_COUPON) return json(res, 400, { error: 'Coupon code is not valid.' });
      const existing = await findExistingCouponOrder();
      if (existing) {
        const existingKey = existing.notes && existing.notes.customer_key ? String(existing.notes.customer_key) : '';
        if (existingKey === customerKey(customer) && existing.status === 'created' && existing.amount === TEST_COUPON_AMOUNT) {
          return json(res, 200, {
            key_id: keyId,
            order_id: existing.id,
            amount: existing.amount,
            currency: existing.currency,
            product: PRODUCT,
            coupon: TEST_COUPON,
            discount: TEST_COUPON_DISCOUNT,
            customer
          });
        }
        return json(res, 409, { error: 'TALENT98 has already been claimed by another user.' });
      }
      amount = TEST_COUPON_AMOUNT;
      discount = TEST_COUPON_DISCOUNT;
      appliedCoupon = TEST_COUPON;
      couponCounted = true;
    }

    const receipt = appliedCoupon ? 'tms_coupon_' + Date.now() : 'tms_' + Date.now();
    const notes = {
      product: PRODUCT,
      source,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_mobile: customer.mobile,
      billing_address: customer.billing_address,
      linkedin_url: customer.linkedin_url || 'not-provided',
      coupon: appliedCoupon || 'none',
      customer_key: customerKey(customer),
      user_type: userType,
      coupon_counted: couponCounted ? 'YES' : 'NO',
      tracker_reservation_id: reservationId || 'none'
    };

    let order;
    try {
      order = await razorpayRequest('/orders', {
        method: 'POST',
        body: { amount, currency: CURRENCY, receipt, notes }
      });
    } catch (err) {
      if (reservationId && trackerConfigured()) {
        await trackerRequest('release_reservation', { reservation_id: reservationId }).catch((releaseErr) => console.error('Tracker reservation release failed:', releaseErr.message));
      }
      throw err;
    }

    if (appliedCoupon && !trackerConfigured()) couponOrderCache = order;

    if (trackerConfigured()) {
      await trackerRequest('order_created', {
        reservation_id: reservationId,
        customer,
        product: PRODUCT,
        original_price_paise: AMOUNT,
        coupon: appliedCoupon,
        discount_paise: discount,
        final_amount_paise: order.amount,
        user_type: userType,
        coupon_counted: couponCounted,
        razorpay_order_id: order.id,
        source
      }).catch((trackerErr) => console.error('Tracker order write failed:', trackerErr.message));
    }

    return json(res, 200, {
      key_id: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      product: PRODUCT,
      coupon: appliedCoupon,
      discount,
      customer,
      user_type: userType
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err.message);
    return json(res, 502, { error: err.message && /coupon/i.test(err.message) ? err.message : 'Unable to start payment right now. Please try again.' });
  }
}

function safeEqualHex(a, b) {
  try {
    const aBuf = Buffer.from(String(a), 'hex');
    const bBuf = Buffer.from(String(b), 'hex');
    return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
  } catch (_) { return false; }
}

async function capturedPurchase(orderId, paymentId) {
  if (!orderId || !paymentId) throw new Error('Missing access details');
  const [order, payment] = await Promise.all([
    razorpayRequest('/orders/' + encodeURIComponent(orderId)),
    razorpayRequest('/payments/' + encodeURIComponent(paymentId))
  ]);
  const amount = Number(order && order.amount);
  const orderMatches = order && order.id === orderId && amount > 0 && order.currency === CURRENCY;
  const paymentMatches = payment && payment.id === paymentId && payment.order_id === orderId && payment.amount === amount && payment.currency === CURRENCY && payment.status === 'captured';
  if (!orderMatches || !paymentMatches) throw new Error('Payment is not captured');
  return { order, payment, amount };
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

    const purchase = await capturedPurchase(orderId, paymentId);
    const order = purchase.order;
    const coupon = order && order.notes ? String(order.notes.coupon || '') : '';

    if (trackerConfigured()) {
      await trackerRequest('payment_verified', {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        amount_paise: purchase.amount,
        coupon: coupon === 'none' ? '' : coupon,
        payment_status: 'CAPTURED'
      }).catch((trackerErr) => console.error('Tracker payment write failed:', trackerErr.message));
    }

    return json(res, 200, {
      verified: true,
      payment_id: paymentId,
      order_id: orderId,
      product: PRODUCT,
      amount: purchase.amount,
      currency: CURRENCY,
      coupon: coupon === 'none' ? '' : coupon
    });
  } catch (err) {
    console.error('Razorpay verification failed:', err.message);
    return json(res, 502, { error: 'Unable to verify payment right now. Please contact support with your payment ID.' });
  }
}

function parseAccess(req) {
  const u = new URL(req.url, 'https://www.iamarecruiter.in');
  return {
    orderId: clean(u.searchParams.get('order_id'), 120),
    paymentId: clean(u.searchParams.get('payment_id'), 120)
  };
}

async function serveProtectedAsset(req, res, fileName) {
  try {
    const access = parseAccess(req);
    await capturedPurchase(access.orderId, access.paymentId);
    const filePath = path.join(process.cwd(), 'protected', fileName);
    const html = fs.readFileSync(filePath, 'utf8');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(html);
  } catch (err) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Verified payment required to access this resource.');
  }
}

function escHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function serveReceipt(req, res) {
  try {
    const access = parseAccess(req);
    const purchase = await capturedPurchase(access.orderId, access.paymentId);
    const order = purchase.order;
    const payment = purchase.payment;
    const notes = order.notes || {};
    const paid = (purchase.amount / 100).toFixed((purchase.amount % 100) ? 2 : 0);
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Receipt</title><link rel="stylesheet" href="/css/site.css"><style>body{padding:48px}.receipt{max-width:760px;margin:auto;border:2px solid #111;padding:34px;box-shadow:8px 8px 0 #E8A400}.row{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #ddd;padding:12px 0}.row:first-of-type{margin-top:24px}.mono{font-family:monospace;font-size:12px}.actions{margin-top:28px}@media print{.actions{display:none}.receipt{box-shadow:none}}</style></head><body><div class="receipt"><img src="/assets/logo_trimmed.png" alt="I AM A RECRUITER" style="max-width:190px"><h1>PAYMENT RECEIPT</h1><p>This confirms a captured payment for the Talent Market Snapshot Challenge.</p><div class="row"><strong>Buyer</strong><span>${escHtml(notes.customer_name || '')}</span></div><div class="row"><strong>Email</strong><span>${escHtml(notes.customer_email || '')}</span></div><div class="row"><strong>Amount paid</strong><span>₹${paid}</span></div><div class="row"><strong>Payment status</strong><span>CAPTURED</span></div><div class="row"><strong>Payment ID</strong><span class="mono">${escHtml(payment.id)}</span></div><div class="row"><strong>Order ID</strong><span class="mono">${escHtml(order.id)}</span></div><div class="row"><strong>Coupon</strong><span>${escHtml(notes.coupon === 'none' ? '' : notes.coupon)}</span></div><p style="margin-top:24px;font-size:12px">This is a payment receipt, not a GST/tax invoice. A tax invoice requires the applicable legal and tax details to be configured.</p><div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div></div></body></html>`;
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(html);
  } catch (err) {
    res.statusCode = 403;
    res.end('Verified payment required to view this receipt.');
  }
}

async function accessConfig(req, res) {
  try {
    const access = parseAccess(req);
    await capturedPurchase(access.orderId, access.paymentId);
    return json(res, 200, {
      whatsapp_group_url: /^https:\/\//i.test(String(process.env.TMS_WHATSAPP_GROUP_URL || '')) ? String(process.env.TMS_WHATSAPP_GROUP_URL).trim() : ''
    });
  } catch (_) {
    return json(res, 403, { error: 'Verified payment required.' });
  }
}

function serveCheckoutPage(res) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'ai-workflow.html');
    let html = fs.readFileSync(filePath, 'utf8');
    html = html
      .replace('The founding beta is currently handled manually, so the purchase conversation starts on WhatsApp. You will receive the payment and access steps there.', 'Payment is completed securely through Razorpay. Add your details first, then continue to secure payment.')
      .replace('Start the ₹99 purchase conversation', 'Complete your checkout details')
      .replace('Tap the CTA and message us on WhatsApp.', 'Enter your details and any coupon code before opening Razorpay Secure Checkout.')
      .replace('Receive the payment/access path', 'Continue to secure payment')
      .replace('The founding-beta payment and access details are shared manually.', 'Your verified details and final payable amount are passed into the secure Razorpay payment step.')
      .replace('Payment and access are currently handled manually during the founding beta. Starting the WhatsApp conversation does not itself charge you.', 'Payment is processed securely through Razorpay after your checkout details and final payable amount are confirmed.')
      .replace('</body>', '<script src="/js/talent-snapshot-checkout.js"></script>\n</body>');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(html);
  } catch (err) {
    console.error('Failed to serve checkout-enabled page:', err.message);
    res.statusCode = 500;
    res.end('Unable to load the page.');
  }
}

express.static = function patchedStatic(...args) {
  const staticMiddleware = originalStatic.apply(express, args);
  return function paymentAwareStatic(req, res, next) {
    const requestPath = req.url.split('?')[0];
    if (req.method === 'GET' && (requestPath === '/ai-workflow.html' || requestPath === '/ai-workflow')) {
      return serveCheckoutPage(res);
    }
    if (req.method === 'GET' && requestPath === '/tms/challenge') return serveProtectedAsset(req, res, 'tms-challenge.html');
    if (req.method === 'GET' && requestPath === '/tms/ebook') return serveProtectedAsset(req, res, 'tms-ebook.html');
    if (req.method === 'GET' && requestPath === '/tms/workbook') return serveProtectedAsset(req, res, 'tms-workbook.html');
    if (req.method === 'GET' && requestPath === '/tms/receipt') return serveReceipt(req, res);
    if (req.method === 'GET' && requestPath === '/api/tms/access-config') return accessConfig(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/coupon') return couponStatus(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/order') return createOrder(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/verify') return verifyPayment(req, res);
    return staticMiddleware(req, res, next);
  };
};

console.log('Razorpay payment middleware bootstrap loaded.');
