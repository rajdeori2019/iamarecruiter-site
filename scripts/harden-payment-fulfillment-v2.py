from pathlib import Path
import re

payments = Path('payments-bootstrap.js')
text = payments.read_text()

# Remove temporary diagnostics/probes used only to verify the live Apps Script deployment.
text = re.sub(r"\nasync function recoveryProbe\(req, res\) \{.*?\n\}\n\n(?=function serveCheckoutPage\(res\) \{)", "\n", text, flags=re.S)
text = text.replace("    if (req.method === 'GET' && requestPath === '/api/tms/recovery-probe') return recoveryProbe(req, res);\n", "")
text = re.sub(r"\nasync function runStartupDeliveryProbe_\(\) \{.*?\nif \(process\.env\.TMS_STARTUP_PROBE_ORDER_ID && process\.env\.TMS_STARTUP_PROBE_PAYMENT_ID\) \{\n  setTimeout\(runStartupDeliveryProbe_, 5000\);\n\}\n", "\n", text, flags=re.S)

# Process-wide concurrency guards. Razorpay payment notes provide durable state across restarts.
anchor = "let couponOrderCache = null;\n"
block = """let couponOrderCache = null;\nconst fulfillmentLocks = new Map();\nconst webhookEventIds = new Map();\nlet reconciliationRunning = false;\nconst RECONCILE_INTERVAL_MS = 5 * 60 * 1000;\n\n"""
if "const fulfillmentLocks = new Map();" not in text:
    if anchor not in text:
        raise SystemExit('coupon cache anchor missing')
    text = text.replace(anchor, block, 1)

# Make tracker failures diagnosable instead of throwing the opaque error seen in production.
old = """    const text = await response.text();\n    let data;\n    try { data = JSON.parse(text); } catch (_) { throw new Error('Tracker returned a non-JSON response'); }\n    if (!response.ok || !data || data.ok === false) throw new Error((data && data.error) || 'Tracker request failed');\n    return data;\n"""
new = """    const text = await response.text();\n    let data;\n    try {\n      data = JSON.parse(text);\n    } catch (_) {\n      const sample = String(text || '').replace(/\\s+/g, ' ').trim().slice(0, 220);\n      throw new Error('Tracker ' + action + ' returned non-JSON (HTTP ' + response.status + ', ' + (response.headers.get('content-type') || 'unknown') + '): ' + (sample || '<empty body>'));\n    }\n    if (!response.ok || !data || data.ok === false) {\n      throw new Error('Tracker ' + action + ' failed (HTTP ' + response.status + '): ' + ((data && data.error) || 'unknown error'));\n    }\n    return data;\n"""
if old in text:
    text = text.replace(old, new, 1)
elif "Tracker ' + action + ' returned non-JSON" not in text:
    raise SystemExit('tracker parser block missing')

# Mark the delivery stage as ambiguous if its HTTP response is lost after Gmail may have sent.
old_delivery = """  const delivery = await trackerRequest('send_delivery_email', {\n    razorpay_order_id: orderId,\n    razorpay_payment_id: paymentId,\n    amount_paise: amount,\n    whatsapp_group_url: whatsappGroupUrl\n  });\n  if (!delivery || delivery.email_sent !== true) throw new Error('Buyer delivery email did not confirm success.');\n  return { tracked: true, delivery_status: 'sent' };\n"""
new_delivery = """  let delivery;\n  try {\n    delivery = await trackerRequest('send_delivery_email', {\n      razorpay_order_id: orderId,\n      razorpay_payment_id: paymentId,\n      amount_paise: amount,\n      whatsapp_group_url: whatsappGroupUrl\n    });\n  } catch (err) {\n    err.fulfillmentStage = 'delivery';\n    throw err;\n  }\n  if (!delivery || delivery.email_sent !== true) {\n    const err = new Error('Buyer delivery email did not confirm success.');\n    err.fulfillmentStage = 'delivery';\n    throw err;\n  }\n  return { tracked: true, delivery_status: delivery.already_sent ? 'already_sent' : 'sent' };\n"""
if old_delivery in text:
    text = text.replace(old_delivery, new_delivery, 1)
elif "err.fulfillmentStage = 'delivery';" not in text:
    raise SystemExit('delivery block missing')

# Durable exactly-once orchestration, webhook handling, reconciliation and canonical recovery.
verify_marker = "async function verifyPayment(req, res) {"
if "async function fulfillCapturedPayment_(" not in text:
    helpers = r'''
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

'''
    if verify_marker not in text:
        raise SystemExit('verify marker missing')
    text = text.replace(verify_marker, helpers + verify_marker, 1)

# Browser verification now uses the same durable orchestration as webhook/reconciliation/recovery.
old_verify = """    if (trackerConfigured()) {\n      try {\n        const fulfillment = await syncTrackerAfterPayment(order, paymentId, purchase.amount);\n        deliveryStatus = fulfillment && fulfillment.delivery_status ? fulfillment.delivery_status : 'pending';\n      } catch (fulfillmentErr) {\n        console.error('Post-payment fulfillment failed: ' + String(fulfillmentErr && fulfillmentErr.message || fulfillmentErr));\n        deliveryStatus = 'pending';\n      }\n    }\n"""
new_verify = """    if (trackerConfigured()) {\n      try {\n        const fulfillment = await fulfillCapturedPayment_(orderId, paymentId, 'checkout_handler');\n        deliveryStatus = fulfillment && fulfillment.delivery_status ? fulfillment.delivery_status : 'pending';\n      } catch (fulfillmentErr) {\n        console.error('Post-payment fulfillment failed: ' + String(fulfillmentErr && fulfillmentErr.message || fulfillmentErr));\n        deliveryStatus = 'pending';\n      }\n    }\n"""
if old_verify in text:
    text = text.replace(old_verify, new_verify, 1)
elif "fulfillCapturedPayment_(orderId, paymentId, 'checkout_handler')" not in text:
    raise SystemExit('verify fulfillment block missing')

# Add the production endpoints to the existing preload middleware.
route_anchor = "    if (req.method === 'POST' && requestPath === '/api/razorpay/coupon') return couponStatus(req, res);\n"
route_block = "    if (req.method === 'POST' && requestPath === '/api/razorpay/webhook') return razorpayWebhook(req, res);\n    if (req.method === 'POST' && requestPath === '/api/tms/recover') return recoverFulfillment(req, res);\n" + route_anchor
if "/api/razorpay/webhook" not in text:
    if route_anchor not in text:
        raise SystemExit('route anchor missing')
    text = text.replace(route_anchor, route_block, 1)

# Start the durable Razorpay reconciliation loop only when an explicit cutoff is configured.
log_marker = "console.log('Razorpay payment middleware bootstrap loaded.');"
scheduler = """if (Number(process.env.TMS_RECONCILE_FROM_EPOCH || 0) > 0) {\n  setTimeout(reconcileCapturedPayments_, 60 * 1000);\n  const reconciliationTimer = setInterval(reconcileCapturedPayments_, RECONCILE_INTERVAL_MS);\n  if (reconciliationTimer.unref) reconciliationTimer.unref();\n}\n\n"""
if "setInterval(reconcileCapturedPayments_" not in text:
    if log_marker not in text:
        raise SystemExit('bootstrap log marker missing')
    text = text.replace(log_marker, scheduler + log_marker, 1)

payments.write_text(text)

# Harden the Apps Script source of truth. This still needs the live web-app deployment
# to be updated from this source because Apps Script /exec deployments are versioned.
gs = Path('google-apps-script/TMSCheckoutTracker.gs')
g = gs.read_text()

payment_anchor = """    if (String(values[i][13] || '') !== orderId) continue;\n    sh.getRange(i + 1, 15).setValue(body.razorpay_payment_id || '');\n"""
payment_guard = """    if (String(values[i][13] || '') !== orderId) continue;\n    const incomingPaymentId = String(body.razorpay_payment_id || '').trim();\n    const existingPaymentId = String(values[i][14] || '').trim();\n    const existingPaymentStatus = String(values[i][15] || '').trim().toUpperCase();\n    const existingAccessStatus = String(values[i][17] || '').trim().toUpperCase();\n    if (incomingPaymentId && incomingPaymentId === existingPaymentId && existingPaymentStatus === 'CAPTURED' && existingAccessStatus === 'ACCESS SENT') {\n      return { ok: true, buyer_row: i + 1, already_verified: true, access_sent: true };\n    }\n    sh.getRange(i + 1, 15).setValue(body.razorpay_payment_id || '');\n"""
if payment_anchor in g:
    g = g.replace(payment_anchor, payment_guard, 1)
elif "already_verified: true, access_sent: true" not in g:
    raise SystemExit('Apps Script payment guard anchor missing')

if "function sendDeliveryEmailUnlocked_(body)" not in g:
    old_name = "function sendDeliveryEmail_(body) {"
    wrapper = """function sendDeliveryEmail_(body) {\n  const lock = LockService.getScriptLock();\n  lock.waitLock(30000);\n  try {\n    return sendDeliveryEmailUnlocked_(body);\n  } finally {\n    lock.releaseLock();\n  }\n}\n\nfunction sendDeliveryEmailUnlocked_(body) {"""
    if old_name not in g:
        raise SystemExit('Apps Script delivery function missing')
    g = g.replace(old_name, wrapper, 1)

gs.write_text(g)
