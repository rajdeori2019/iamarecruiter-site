const PRODUCT = 'Talent Intelligence Starter Pack';
const CURRENCY = 'INR';
const ORIGINAL_PRICE_PAISE = 9900;

function clean(value, max) {
  return String(value || '').trim().slice(0, max || 256);
}

function normalizeEmail(value) {
  return clean(value, 160).toLowerCase();
}

function normalizeMobile(value) {
  return clean(value, 20).replace(/[^0-9+]/g, '');
}

function getCredentials() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured');
  return { keyId, keySecret };
}

function trackerConfigured() {
  return /^https:\/\//i.test(String(process.env.TMS_TRACKER_WEBHOOK_URL || '')) &&
    !!String(process.env.TMS_TRACKER_TOKEN || '').trim();
}

async function razorpayRequest(apiPath) {
  const { keyId, keySecret } = getCredentials();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch('https://api.razorpay.com/v1' + apiPath, {
      headers: {
        Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'),
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data && data.error && data.error.description ? data.error.description : 'Razorpay request failed';
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
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

async function fulfillCapturedPayment(payment) {
  const paymentId = String(payment && payment.id || '');
  const orderId = String(payment && payment.order_id || '');
  if (!paymentId || !orderId || String(payment.status || '') !== 'captured') return false;

  const order = await razorpayRequest('/orders/' + encodeURIComponent(orderId));
  const notes = order && order.notes ? order.notes : {};
  if (String(notes.product || '') !== PRODUCT) return false;
  if (String(order.currency || '') !== CURRENCY || String(payment.currency || '') !== CURRENCY) return false;
  if (Number(payment.amount) !== Number(order.amount)) return false;

  const paymentPayload = {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount_paise: Number(payment.amount || order.amount || 0),
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

  const whatsappGroupUrl = /^https:\/\//i.test(String(process.env.TMS_WHATSAPP_GROUP_URL || ''))
    ? String(process.env.TMS_WHATSAPP_GROUP_URL).trim()
    : '';
  const delivery = await trackerRequest('send_delivery_email', {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    amount_paise: Number(payment.amount || order.amount || 0),
    whatsapp_group_url: whatsappGroupUrl
  });
  if (!delivery || delivery.email_sent !== true) throw new Error('Buyer delivery email did not confirm success');

  console.log('TMS_RECONCILE_FULFILLED ' + JSON.stringify({
    order_id: orderId,
    payment_id: paymentId,
    already_sent: delivery.already_sent === true,
    buyer_row: delivery.buyer_row || null
  }));
  return true;
}

let reconcileRunning = false;

async function reconcileCapturedPayments() {
  if (reconcileRunning || !trackerConfigured()) return;
  reconcileRunning = true;
  try {
    const now = Math.floor(Date.now() / 1000);
    const lookbackSeconds = Math.max(3600, Number(process.env.TMS_RECONCILE_LOOKBACK_SECONDS || 172800));
    const from = now - lookbackSeconds;
    const pageSize = 100;
    const maxPages = Math.max(1, Math.min(10, Number(process.env.TMS_RECONCILE_MAX_PAGES || 3)));

    for (let page = 0; page < maxPages; page += 1) {
      const skip = page * pageSize;
      const data = await razorpayRequest('/payments?from=' + from + '&to=' + now + '&count=' + pageSize + '&skip=' + skip);
      const items = Array.isArray(data && data.items) ? data.items : [];
      if (!items.length) break;

      for (const payment of items) {
        if (!payment || payment.status !== 'captured' || !payment.order_id) continue;
        try {
          await fulfillCapturedPayment(payment);
        } catch (err) {
          console.error('TMS_RECONCILE_PAYMENT_ERROR ' + JSON.stringify({
            order_id: payment.order_id || '',
            payment_id: payment.id || '',
            error: String(err && err.message || err)
          }));
        }
      }

      if (items.length < pageSize) break;
    }
  } catch (err) {
    console.error('TMS_RECONCILE_RUN_ERROR ' + String(err && err.message || err));
  } finally {
    reconcileRunning = false;
  }
}

const intervalMs = Math.max(30000, Number(process.env.TMS_RECONCILE_INTERVAL_MS || 60000));
setTimeout(reconcileCapturedPayments, 10000);
setInterval(reconcileCapturedPayments, intervalMs).unref();

console.log('TMS payment reconciler loaded; interval_ms=' + intervalMs);
