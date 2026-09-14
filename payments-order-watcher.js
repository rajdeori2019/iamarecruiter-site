const express = require('express');

const PRODUCT = 'Talent Intelligence Starter Pack';
const CURRENCY = 'INR';
const ORIGINAL_PRICE_PAISE = 9900;
const previousStatic = express.static;
const activeOrders = new Map();

function clean(value, max) {
  return String(value || '').trim().slice(0, max || 256);
}
function normalizeEmail(value) {
  return clean(value, 160).toLowerCase();
}
function normalizeMobile(value) {
  return clean(value, 20).replace(/[^0-9+]/g, '');
}
function credentials() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured');
  return { keyId, keySecret };
}
function trackerConfigured() {
  return /^https:\/\//i.test(String(process.env.TMS_TRACKER_WEBHOOK_URL || '')) && !!String(process.env.TMS_TRACKER_TOKEN || '').trim();
}
async function razorpayRequest(apiPath) {
  const { keyId, keySecret } = credentials();
  const response = await fetch('https://api.razorpay.com/v1' + apiPath, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'),
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data && data.error && data.error.description) || 'Razorpay request failed');
  return data;
}
async function trackerRequest(action, payload) {
  const webhook = String(process.env.TMS_TRACKER_WEBHOOK_URL || '').trim();
  const token = String(process.env.TMS_TRACKER_TOKEN || '').trim();
  if (!webhook || !token) throw new Error('Tracker is not configured');
  const separator = webhook.includes('?') ? '&' : '?';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), action === 'send_delivery_email' ? 60000 : 30000);
  try {
    const response = await fetch(webhook + separator + 'token=' + encodeURIComponent(token), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action }, payload || {})),
      redirect: 'follow',
      signal: controller.signal
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
function trackerOrderPayload(order) {
  const notes = order && order.notes ? order.notes : {};
  const coupon = String(notes.coupon || '');
  const reservationRaw = String(notes.tracker_reservation_id || '');
  const finalAmount = Number(order && order.amount || ORIGINAL_PRICE_PAISE);
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
    original_price_paise: ORIGINAL_PRICE_PAISE,
    coupon: coupon === 'none' ? '' : coupon,
    discount_paise: Math.max(0, ORIGINAL_PRICE_PAISE - finalAmount),
    final_amount_paise: finalAmount,
    user_type: clean(notes.user_type, 40) || 'BUYER',
    coupon_counted: String(notes.coupon_counted || '').toUpperCase() === 'YES',
    razorpay_order_id: String(order && order.id || ''),
    source: clean(notes.source, 160)
  };
}
async function canonicalFulfill(order, payment) {
  if (!trackerConfigured()) throw new Error('Tracker is not configured');
  const orderId = String(order.id || '');
  const paymentId = String(payment.id || '');
  const notes = order.notes || {};
  if (!orderId || !paymentId) throw new Error('Missing payment identifiers');
  if (String(notes.product || '') !== PRODUCT) throw new Error('Unexpected product');
  if (payment.status !== 'captured' || payment.order_id !== orderId) throw new Error('Payment is not captured for this order');
  if (String(order.currency || '') !== CURRENCY || String(payment.currency || '') !== CURRENCY) throw new Error('Currency mismatch');
  if (Number(payment.amount) !== Number(order.amount)) throw new Error('Amount mismatch');

  const paymentPayload = {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount_paise: Number(payment.amount),
    coupon: String(notes.coupon || '') === 'none' ? '' : String(notes.coupon || ''),
    payment_status: 'CAPTURED'
  };
  try {
    await trackerRequest('payment_verified', paymentPayload);
  } catch (err) {
    if (!/Buyer order was not found in tracker/i.test(String(err && err.message || err))) throw err;
    await trackerRequest('order_created', trackerOrderPayload(order));
    await trackerRequest('payment_verified', paymentPayload);
  }

  // Deliberately use the same tracker action as the normal browser-verification
  // path. This guarantees recovery uses the canonical branded HTML template and
  // the same Drive-access/idempotency logic; no separate recovery email exists.
  const whatsappGroupUrl = /^https:\/\//i.test(String(process.env.TMS_WHATSAPP_GROUP_URL || ''))
    ? String(process.env.TMS_WHATSAPP_GROUP_URL).trim()
    : '';
  const delivery = await trackerRequest('send_delivery_email', {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount_paise: Number(payment.amount),
    whatsapp_group_url: whatsappGroupUrl
  });
  if (!delivery || delivery.email_sent !== true) throw new Error('Canonical buyer delivery did not confirm success');
  console.log('TMS_ORDER_WATCHER_FULFILLED ' + JSON.stringify({
    order_id: orderId,
    payment_id: paymentId,
    already_sent: delivery.already_sent === true,
    buyer_row: delivery.buyer_row || null
  }));
}

function watchOrder(orderId) {
  if (!orderId || activeOrders.has(orderId) || !trackerConfigured()) return;
  const startedAt = Date.now();
  const maxAgeMs = Math.max(5 * 60 * 1000, Number(process.env.TMS_ORDER_WATCH_MAX_MS || 30 * 60 * 1000));
  const pollMs = Math.max(10000, Number(process.env.TMS_ORDER_WATCH_INTERVAL_MS || 15000));
  let completed = false;

  async function check() {
    if (completed) return;
    if (Date.now() - startedAt > maxAgeMs) {
      completed = true;
      activeOrders.delete(orderId);
      console.warn('TMS_ORDER_WATCHER_TIMEOUT ' + JSON.stringify({ order_id: orderId }));
      return;
    }
    try {
      const [order, payments] = await Promise.all([
        razorpayRequest('/orders/' + encodeURIComponent(orderId)),
        razorpayRequest('/orders/' + encodeURIComponent(orderId) + '/payments')
      ]);
      if (!order || String(order.id || '') !== orderId || String((order.notes || {}).product || '') !== PRODUCT) {
        completed = true;
        activeOrders.delete(orderId);
        return;
      }
      const items = Array.isArray(payments && payments.items) ? payments.items : [];
      const captured = items.find((p) => p && p.status === 'captured' && p.order_id === orderId && Number(p.amount) === Number(order.amount));
      if (captured) {
        // Give the normal browser /verify path a short head start. If it already
        // completed, the tracker returns already_sent and no duplicate is sent.
        const capturedAtMs = Number(captured.created_at || 0) * 1000;
        const settleDelayMs = 20000;
        if (capturedAtMs && Date.now() < capturedAtMs + settleDelayMs) {
          setTimeout(check, Math.max(1000, capturedAtMs + settleDelayMs - Date.now()));
          return;
        }
        await canonicalFulfill(order, captured);
        completed = true;
        activeOrders.delete(orderId);
        return;
      }
    } catch (err) {
      console.error('TMS_ORDER_WATCHER_ERROR ' + JSON.stringify({ order_id: orderId, error: String(err && err.message || err) }));
    }
    if (!completed) setTimeout(check, pollMs);
  }

  activeOrders.set(orderId, { startedAt: startedAt });
  setTimeout(check, pollMs);
  console.log('TMS_ORDER_WATCHER_STARTED ' + JSON.stringify({ order_id: orderId }));
}

express.static = function orderWatcherStatic(...args) {
  const downstream = previousStatic.apply(express, args);
  return function orderWatcherMiddleware(req, res, next) {
    const requestPath = String(req.url || '').split('?')[0];
    if (req.method === 'POST' && requestPath === '/api/razorpay/order') {
      const originalEnd = res.end;
      let bodySeen = false;
      res.end = function patchedEnd(chunk, encoding, callback) {
        if (!bodySeen) {
          bodySeen = true;
          try {
            const raw = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk || '');
            const payload = JSON.parse(raw);
            if (res.statusCode >= 200 && res.statusCode < 300 && payload && payload.order_id) {
              watchOrder(String(payload.order_id));
            }
          } catch (_) {}
        }
        return originalEnd.call(this, chunk, encoding, callback);
      };
    }
    return downstream(req, res, next);
  };
};

console.log('TMS order watcher bootstrap loaded.');
