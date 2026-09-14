const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');

const originalStatic = express.static;
const PRODUCT = 'Talent Intelligence Starter Pack';
const AMOUNT = 9900;
const CURRENCY = 'INR';
const TEST_COUPON = 'TALENT98';
const TEST_COUPON_DISCOUNT = 9800;
const TEST_COUPON_AMOUNT = AMOUNT - TEST_COUPON_DISCOUNT;
const rateBuckets = new Map();
let couponOrderCache = null;
const fulfillmentLocks = new Map();
const webhookEventIds = new Map();
let reconciliationRunning = false;
const RECONCILE_INTERVAL_MS = 5 * 60 * 1000;


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
  const timeoutMs = action === 'send_delivery_email' ? 60000 : 30000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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
    try {
      data = JSON.parse(text);
    } catch (_) {
      const sample = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 220);
      throw new Error('Tracker ' + action + ' returned non-JSON (HTTP ' + response.status + ', ' + (response.headers.get('content-type') || 'unknown') + '): ' + (sample || '<empty body>'));
    }
    if (!response.ok || !data || data.ok === false) {
      throw new Error('Tracker ' + action + ' failed (HTTP ' + response.status + '): ' + ((data && data.error) || 'unknown error'));
    }
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

    // Coupon orders already have a reservation row, so linking the Razorpay order
    // can happen in the background. Non-coupon orders are created in the tracker
    // after payment verification, avoiding an unnecessary checkout delay.
    if (trackerConfigured() && reservationId) {
      trackerRequest('order_created', {
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

function trackerOrderPayload_(order) {
  const notes = order && order.notes ? order.notes : {};
  const coupon = String(notes.coupon || '');
  const reservationRaw = String(notes.tracker_reservation_id || '');
  const finalAmount = Number(order && order.amount || AMOUNT);
  return {
    reservation_id: reservationRaw === 'none' ? '' : clean(reservationRaw, 120),
    customer: {
      name: clean(notes.customer_name, 120),
      email: normalizeEmail(notes.customer_email),
      mobile: normalizeMobile(notes.customer_mobile),
      billing_address: clean(notes.billing_address, 240),
      linkedin_url: String(notes.linkedin_url || '') === 'not-provided' ? '' : clean(notes.linkedin_url, 240)
    },
    product: clean(notes.product, 160) || PRODUCT,
    original_price_paise: AMOUNT,
    coupon: coupon === 'none' ? '' : coupon,
    discount_paise: Math.max(0, AMOUNT - finalAmount),
    final_amount_paise: finalAmount,
    user_type: clean(notes.user_type, 40) || 'BUYER',
    coupon_counted: String(notes.coupon_counted || '').toUpperCase() === 'YES',
    razorpay_order_id: String(order && order.id || ''),
    source: clean(notes.source, 160)
  };
}

async function paymentVerifiedWithRetry_(payload, attempts = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await trackerRequest('payment_verified', payload);
    } catch (err) {
      lastErr = err;
      const message = String(err && err.message || err);
      if (/Buyer order was not found in tracker/i.test(message)) throw err;
      console.warn('Tracker payment verification attempt ' + attempt + ' failed: ' + message);
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 750 * attempt));
    }
  }
  throw lastErr || new Error('Tracker payment verification failed');
}

async function syncTrackerAfterPayment(order, paymentId, amount) {
  if (!trackerConfigured()) return { tracked: false, delivery_status: 'not_configured' };
  const orderId = String(order && order.id || '');
  const notes = order && order.notes ? order.notes : {};
  const coupon = String(notes.coupon || '');
  const whatsappGroupUrl = /^https:\/\//i.test(String(process.env.TMS_WHATSAPP_GROUP_URL || ''))
    ? String(process.env.TMS_WHATSAPP_GROUP_URL).trim()
    : '';
  const paymentPayload = {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount_paise: amount,
    coupon: coupon === 'none' ? '' : coupon,
    payment_status: 'CAPTURED'
  };

  try {
    await paymentVerifiedWithRetry_(paymentPayload);
  } catch (err) {
    const message = String(err && err.message || err);
    if (!/Buyer order was not found in tracker/i.test(message)) throw err;

    try {
      await trackerRequest('order_created', trackerOrderPayload_(order));
    } catch (orderErr) {
      console.warn('Tracker order write response was not confirmed: ' + String(orderErr && orderErr.message || orderErr));
    }

    await paymentVerifiedWithRetry_(paymentPayload);
  }

  let delivery;
  try {
    delivery = await trackerRequest('send_delivery_email', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount_paise: amount,
      whatsapp_group_url: whatsappGroupUrl
    });
  } catch (err) {
    err.fulfillmentStage = 'delivery';
    throw err;
  }
  if (!delivery || delivery.email_sent !== true) {
    const err = new Error('Buyer delivery email did not confirm success.');
    err.fulfillmentStage = 'delivery';
    throw err;
  }
  return { tracked: true, delivery_status: delivery.already_sent ? 'already_sent' : 'sent' };
}


function paymentNotesObject_(payment) {
  return payment && payment.notes && !Array.isArray(payment.notes) && typeof payment.notes === 'object' ? payment.notes : {};
}

async function updatePaymentNotes_(payment, patch) {
  if (!payment || !payment.id) throw new Error('Cannot update fulfillment state without a Razorpay payment ID.');
  const notes = Object.assign({}, paymentNotesObject_(payment), patch || {});
  return razorpayRequest('/payments/' + encodeURIComponent(payment.id) + '/', {
    method: 'PATCH',
    body: { notes }
  });
}

function isStarterPackOrder_(order) {
  const notes = order && order.notes && !Array.isArray(order.notes) ? order.notes : {};
  return String(notes.product || '').trim() === PRODUCT;
}

function fulfillmentState_(payment) {
  return String(paymentNotesObject_(payment).iaar_fulfillment || '').trim().toLowerCase();
}

async function fulfillCapturedPayment_(orderId, paymentId, trigger, options = {}) {
  const key = String(paymentId || '');
  if (fulfillmentLocks.has(key)) return fulfillmentLocks.get(key);

  const work = (async () => {
    const purchase = await capturedPurchase(orderId, paymentId);
    if (!isStarterPackOrder_(purchase.order)) throw new Error('Captured payment is not for the Talent Intelligence Starter Pack.');
    if (!trackerConfigured()) throw new Error('TMS tracker is not configured.');

    const state = fulfillmentState_(purchase.payment);
    if (state === 'delivered') {
      return { tracked: true, delivery_status: 'already_sent', idempotent: true };
    }

    const ambiguous = state === 'processing' || state === 'delivery_unknown';
    const allowAmbiguousRetry = options.allowAmbiguousRetry === true || String(process.env.TMS_IDEMPOTENT_DELIVERY_CONFIRMED || '').toLowerCase() === 'true';
    if (ambiguous && !allowAmbiguousRetry) {
      console.warn('FULFILLMENT_REVIEW_REQUIRED payment=' + paymentId + ' state=' + state + ' trigger=' + trigger);
      return { tracked: true, delivery_status: 'pending_review', idempotent: true };
    }

    let payment = await updatePaymentNotes_(purchase.payment, {
      iaar_fulfillment: 'processing',
      iaar_fulfill_trigger: clean(trigger, 80),
      iaar_fulfill_started: String(Math.floor(Date.now() / 1000)),
      iaar_last_error: ''
    });

    try {
      const fulfillment = await syncTrackerAfterPayment(purchase.order, paymentId, purchase.amount);
      payment = await updatePaymentNotes_(payment, {
        iaar_fulfillment: 'delivered',
        iaar_fulfilled_at: String(Math.floor(Date.now() / 1000)),
        iaar_last_error: ''
      });
      console.log('FULFILLMENT_OK payment=' + paymentId + ' order=' + orderId + ' trigger=' + trigger + ' status=' + String(fulfillment.delivery_status || 'sent'));
      return fulfillment;
    } catch (err) {
      const deliveryWasAttempted = err && err.fulfillmentStage === 'delivery';
      const failureState = deliveryWasAttempted ? 'delivery_unknown' : 'retry_pending';
      const errorText = clean(String(err && err.message || err), 220);
      await updatePaymentNotes_(payment, {
        iaar_fulfillment: failureState,
        iaar_last_error: errorText
      }).catch((noteErr) => console.error('FULFILLMENT_STATE_WRITE_FAILED payment=' + paymentId + ' error=' + String(noteErr && noteErr.message || noteErr)));
      console.error('FULFILLMENT_FAILED payment=' + paymentId + ' order=' + orderId + ' trigger=' + trigger + ' state=' + failureState + ' error=' + errorText);
      throw err;
    }
  })();

  fulfillmentLocks.set(key, work);
  try {
    return await work;
  } finally {
    fulfillmentLocks.delete(key);
  }
}

function readRawBody_(req, maxBytes = 250000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Webhook body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function rememberWebhookEvent_(eventId) {
  if (!eventId) return false;
  if (webhookEventIds.has(eventId)) return true;
  webhookEventIds.set(eventId, Date.now());
  if (webhookEventIds.size > 1000) {
    const oldest = [...webhookEventIds.entries()].sort((a, b) => a[1] - b[1]).slice(0, 250);
    oldest.forEach(([id]) => webhookEventIds.delete(id));
  }
  return false;
}

async function razorpayWebhook(req, res) {
  const secret = String(process.env.RAZORPAY_WEBHOOK_SECRET || '');
  if (!secret) return json(res, 503, { ok: false, error: 'Webhook is not configured.' });
  try {
    const raw = await readRawBody_(req);
    const signature = String(req.headers['x-razorpay-signature'] || '');
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!signature || !safeEqualHex(expected, signature)) return json(res, 400, { ok: false, error: 'Invalid webhook signature.' });

    const eventId = String(req.headers['x-razorpay-event-id'] || '');
    if (rememberWebhookEvent_(eventId)) return json(res, 200, { ok: true, duplicate: true });

    const body = JSON.parse(raw.toString('utf8'));
    const event = String(body.event || '');
    if (event !== 'payment.captured' && event !== 'order.paid') return json(res, 200, { ok: true, ignored: true });

    const payment = body && body.payload && body.payload.payment && body.payload.payment.entity;
    const order = body && body.payload && body.payload.order && body.payload.order.entity;
    const paymentId = String(payment && payment.id || '');
    const orderId = String(payment && payment.order_id || order && order.id || '');
    if (!paymentId || !orderId) return json(res, 200, { ok: true, ignored: true, reason: 'missing_payment_or_order' });

    // Acknowledge quickly. Reconciliation is the durable fallback if this async attempt fails.
    json(res, 202, { ok: true, accepted: true });
    Promise.resolve()
      .then(() => fulfillCapturedPayment_(orderId, paymentId, 'razorpay_webhook'))
      .catch((err) => console.error('WEBHOOK_FULFILLMENT_FAILED payment=' + paymentId + ' error=' + String(err && err.message || err)));
  } catch (err) {
    console.error('RAZORPAY_WEBHOOK_ERROR ' + String(err && err.message || err));
    if (!res.headersSent) return json(res, 400, { ok: false, error: 'Invalid webhook request.' });
  }
}

async function capturedPaymentForOrder_(order) {
  if (order && order.payments && Array.isArray(order.payments.items)) {
    return order.payments.items.find((p) => p && p.status === 'captured') || null;
  }
  const payments = await razorpayRequest('/orders/' + encodeURIComponent(order.id) + '/payments');
  const items = Array.isArray(payments && payments.items) ? payments.items : [];
  return items.find((p) => p && p.status === 'captured') || null;
}

async function reconcileCapturedPayments_() {
  if (reconciliationRunning || !trackerConfigured()) return;
  const fromEpoch = Number(process.env.TMS_RECONCILE_FROM_EPOCH || 0);
  if (!Number.isFinite(fromEpoch) || fromEpoch <= 0) return;
  reconciliationRunning = true;
  try {
    const toEpoch = Math.floor(Date.now() / 1000);
    let skip = 0;
    while (skip < 500) {
      const path = '/orders?from=' + encodeURIComponent(String(fromEpoch)) + '&to=' + encodeURIComponent(String(toEpoch)) + '&count=100&skip=' + skip;
      const page = await razorpayRequest(path);
      const orders = Array.isArray(page && page.items) ? page.items : [];
      for (const order of orders) {
        if (!order || order.status !== 'paid' || !isStarterPackOrder_(order)) continue;
        try {
          const payment = await capturedPaymentForOrder_(order);
          if (!payment) continue;
          const state = fulfillmentState_(payment);
          if (state === 'delivered') continue;
          const allowAmbiguous = String(process.env.TMS_IDEMPOTENT_DELIVERY_CONFIRMED || '').toLowerCase() === 'true';
          if ((state === 'processing' || state === 'delivery_unknown') && !allowAmbiguous) {
            console.warn('RECONCILE_REVIEW_REQUIRED payment=' + payment.id + ' state=' + state);
            continue;
          }
          await fulfillCapturedPayment_(order.id, payment.id, 'razorpay_reconciliation', { allowAmbiguousRetry: allowAmbiguous });
        } catch (err) {
          console.error('RECONCILE_ORDER_FAILED order=' + String(order.id || '') + ' error=' + String(err && err.message || err));
        }
      }
      if (orders.length < 100) break;
      skip += 100;
    }
  } catch (err) {
    console.error('RECONCILIATION_FAILED ' + String(err && err.message || err));
  } finally {
    reconciliationRunning = false;
  }
}

async function recoverFulfillment(req, res) {
  const expected = String(process.env.TMS_RECOVERY_TOKEN || '');
  const supplied = String(req.headers['x-tms-recovery-token'] || '');
  if (!expected || supplied !== expected) return json(res, 403, { ok: false, error: 'Forbidden' });
  try {
    const body = await readJson(req);
    const orderId = clean(body.order_id || body.razorpay_order_id, 120);
    const paymentId = clean(body.payment_id || body.razorpay_payment_id, 120);
    if (!orderId || !paymentId) return json(res, 400, { ok: false, error: 'Missing order or payment ID.' });
    const result = await fulfillCapturedPayment_(orderId, paymentId, 'canonical_recovery', { allowAmbiguousRetry: body.force_unknown_retry === true });
    return json(res, 200, { ok: true, result });
  } catch (err) {
    return json(res, 500, { ok: false, error: String(err && err.message || err) });
  }
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
    let deliveryStatus = trackerConfigured() ? 'pending' : 'not_configured';

    if (trackerConfigured()) {
      try {
        const fulfillment = await fulfillCapturedPayment_(orderId, paymentId, 'checkout_handler');
        deliveryStatus = fulfillment && fulfillment.delivery_status ? fulfillment.delivery_status : 'pending';
      } catch (fulfillmentErr) {
        console.error('Post-payment fulfillment failed: ' + String(fulfillmentErr && fulfillmentErr.message || fulfillmentErr));
        deliveryStatus = 'pending';
      }
    }

    return json(res, 200, {
      verified: true,
      payment_id: paymentId,
      order_id: orderId,
      product: PRODUCT,
      amount: purchase.amount,
      currency: CURRENCY,
      coupon: coupon === 'none' ? '' : coupon,
      delivery_status: deliveryStatus
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
  return String(value || '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
}

async function serveReceipt(req, res) {
  try {
    const access = parseAccess(req);
    const purchase = await capturedPurchase(access.orderId, access.paymentId);
    const order = purchase.order;
    const payment = purchase.payment;
    const notes = order.notes || {};
    const paid = (purchase.amount / 100).toFixed((purchase.amount % 100) ? 2 : 0);
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment Receipt</title><link rel="stylesheet" href="/css/site.css"><style>body{padding:48px}.receipt{max-width:760px;margin:auto;border:2px solid #111;padding:34px;box-shadow:8px 8px 0 #E8A400}.row{display:flex;justify-content:space-between;gap:20px;border-top:1px solid #ddd;padding:12px 0}.row:first-of-type{margin-top:24px}.mono{font-family:monospace;font-size:12px}.actions{margin-top:28px}@media print{.actions{display:none}.receipt{box-shadow:none}}</style></head><body><div class="receipt"><img src="/assets/logo_trimmed.png" alt="I AM A RECRUITER" style="max-width:190px"><h1>PAYMENT RECEIPT</h1><p>This confirms a captured payment for the Talent Intelligence Starter Pack.</p><div class="row"><strong>Buyer</strong><span>${escHtml(notes.customer_name || '')}</span></div><div class="row"><strong>Email</strong><span>${escHtml(notes.customer_email || '')}</span></div><div class="row"><strong>Amount paid</strong><span>₹${paid}</span></div><div class="row"><strong>Payment status</strong><span>CAPTURED</span></div><div class="row"><strong>Payment ID</strong><span class="mono">${escHtml(payment.id)}</span></div><div class="row"><strong>Order ID</strong><span class="mono">${escHtml(order.id)}</span></div><div class="row"><strong>Coupon</strong><span>${escHtml(notes.coupon === 'none' ? '' : notes.coupon)}</span></div><p style="margin-top:24px;font-size:12px">This is a payment receipt, not a GST/tax invoice. A tax invoice requires the applicable legal and tax details to be configured.</p><div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div></div></body></html>`;
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
      .replace('</body>', '<script src="/js/talent-snapshot-checkout.js"></script>\
</body>');
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
    if (req.method === 'GET' && (requestPath === '/ai-workflow.html' || requestPath === '/ai-workflow')) return serveCheckoutPage(res);
    if (req.method === 'GET' && requestPath === '/tms/challenge') return serveProtectedAsset(req, res, 'tms-challenge.html');
    if (req.method === 'GET' && requestPath === '/tms/ebook') return serveProtectedAsset(req, res, 'tms-ebook.html');
    if (req.method === 'GET' && requestPath === '/tms/workbook') return serveProtectedAsset(req, res, 'tms-workbook.html');
    if (req.method === 'GET' && requestPath === '/tms/receipt') return serveReceipt(req, res);
    if (req.method === 'GET' && requestPath === '/api/tms/access-config') return accessConfig(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/webhook') return razorpayWebhook(req, res);
    if (req.method === 'POST' && requestPath === '/api/tms/recover') return recoverFulfillment(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/coupon') return couponStatus(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/order') return createOrder(req, res);
    if (req.method === 'POST' && requestPath === '/api/razorpay/verify') return verifyPayment(req, res);
    return staticMiddleware(req, res, next);
  };
};



if (Number(process.env.TMS_RECONCILE_FROM_EPOCH || 0) > 0) {
  setTimeout(reconcileCapturedPayments_, 60 * 1000);
  const reconciliationTimer = setInterval(reconcileCapturedPayments_, RECONCILE_INTERVAL_MS);
  if (reconciliationTimer.unref) reconciliationTimer.unref();
}

console.log('Razorpay payment middleware bootstrap loaded.');
