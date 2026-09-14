const core = require('./payment-notification-core');

const POLL_MS = Math.max(15000, Number(process.env.PAYMENT_ALERT_POLL_MS || 30000));
const START_EPOCH = Math.floor(Date.now() / 1000) - 120;
let lastSeenEpoch = START_EPOCH;
let running = false;

function alertNoteKey(status) {
  return status === 'captured' ? 'iaar_admin_alert_captured_at' : 'iaar_admin_alert_failed_at';
}

async function processPayment(payment) {
  if (!payment || !payment.id || !payment.order_id) return;
  if (payment.status !== 'captured' && payment.status !== 'failed') return;
  const noteKey = alertNoteKey(payment.status);
  if (core.notes(payment)[noteKey]) return;

  let order;
  try { order = await core.getOrder(payment.order_id); }
  catch (err) {
    console.warn('PAYMENT_ALERT_ORDER_LOOKUP_FAILED payment=' + payment.id + ' error=' + String(err && err.message || err));
    return;
  }
  if (!core.isProductOrder(order)) return;

  try {
    await core.sendInstantAlert(payment, order);
    await core.markPayment(payment, { [noteKey]: String(Math.floor(Date.now() / 1000)) });
    console.log('PAYMENT_ADMIN_ALERT_SENT status=' + payment.status + ' payment=' + payment.id + ' order=' + payment.order_id + ' recipients=' + core.recipients());
  } catch (err) {
    console.error('PAYMENT_ADMIN_ALERT_FAILED status=' + payment.status + ' payment=' + payment.id + ' error=' + String(err && err.message || err));
  }
}

async function poll() {
  if (running || !core.smtpConfigured()) return;
  running = true;
  const to = Math.floor(Date.now() / 1000);
  const from = Math.max(START_EPOCH, lastSeenEpoch - 90);
  try {
    const payments = await core.listPayments(from, to);
    payments.sort((a,b) => Number(a.created_at || 0) - Number(b.created_at || 0));
    for (const p of payments) await processPayment(p);
    lastSeenEpoch = to;
  } catch (err) {
    console.error('PAYMENT_ALERT_POLL_FAILED ' + String(err && err.message || err));
  } finally {
    running = false;
  }
}

if (core.smtpConfigured()) {
  console.log('Payment admin alerts enabled; recipients=' + core.recipients() + '; poll_ms=' + POLL_MS);
  setTimeout(poll, 5000);
  const timer = setInterval(poll, POLL_MS);
  if (timer.unref) timer.unref();
} else {
  console.warn('Payment admin alerts disabled: PAYMENT_SMTP_HOST/PAYMENT_SMTP_USER/PAYMENT_SMTP_PASSWORD are not fully configured.');
}
