const nodemailer = require('nodemailer');

const PRODUCT = 'Talent Intelligence Starter Pack';
const CURRENCY = 'INR';
const DEFAULT_RECIPIENTS = 'prafulladeori@gmail.com,hello@iamarecruiter.in';
const IST_OFFSET_SECONDS = 19800;

function clean(v, max = 500) { return String(v == null ? '' : v).trim().slice(0, max); }
function money(paise) {
  const n = Number(paise || 0) / 100;
  return '₹' + n.toFixed(Number.isInteger(n) ? 0 : 2);
}
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function credentials() {
  const keyId = clean(process.env.RAZORPAY_KEY_ID, 200);
  const keySecret = clean(process.env.RAZORPAY_KEY_SECRET, 300);
  if (!keyId || !keySecret) throw new Error('Razorpay credentials are not configured');
  return { keyId, keySecret };
}
function authHeader() {
  const { keyId, keySecret } = credentials();
  return 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64');
}
async function razorpay(path, options = {}) {
  const response = await fetch('https://api.razorpay.com/v1' + path, {
    method: options.method || 'GET',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data && data.error && data.error.description) || ('Razorpay HTTP ' + response.status));
  return data;
}
function notes(entity) {
  return entity && entity.notes && !Array.isArray(entity.notes) && typeof entity.notes === 'object' ? entity.notes : {};
}
function isProductOrder(order) { return clean(notes(order).product, 200) === PRODUCT; }
async function getOrder(orderId) {
  if (!orderId) return null;
  return razorpay('/orders/' + encodeURIComponent(orderId));
}
async function listPayments(fromEpoch, toEpoch) {
  const all = [];
  let skip = 0;
  while (skip < 1000) {
    const page = await razorpay('/payments?from=' + encodeURIComponent(String(fromEpoch)) + '&to=' + encodeURIComponent(String(toEpoch)) + '&count=100&skip=' + skip);
    const items = Array.isArray(page && page.items) ? page.items : [];
    all.push(...items);
    if (items.length < 100) break;
    skip += 100;
  }
  return all;
}
async function markPayment(payment, patch) {
  if (!payment || !payment.id) return payment;
  return razorpay('/payments/' + encodeURIComponent(payment.id) + '/', {
    method: 'PATCH',
    body: { notes: Object.assign({}, notes(payment), patch || {}) }
  });
}
function smtpConfigured() {
  return !!(process.env.PAYMENT_SMTP_HOST && process.env.PAYMENT_SMTP_USER && process.env.PAYMENT_SMTP_PASSWORD);
}
let transporter;
function mailer() {
  if (transporter) return transporter;
  if (!smtpConfigured()) throw new Error('Payment notification SMTP is not configured');
  transporter = nodemailer.createTransport({
    host: clean(process.env.PAYMENT_SMTP_HOST, 200),
    port: Number(process.env.PAYMENT_SMTP_PORT || 465),
    secure: String(process.env.PAYMENT_SMTP_SECURE || 'true').toLowerCase() !== 'false',
    auth: { user: clean(process.env.PAYMENT_SMTP_USER, 200), pass: String(process.env.PAYMENT_SMTP_PASSWORD || '') }
  });
  return transporter;
}
function recipients() {
  return clean(process.env.PAYMENT_ALERT_RECIPIENTS || DEFAULT_RECIPIENTS, 500);
}
function sender() {
  const address = clean(process.env.PAYMENT_ALERT_FROM || process.env.PAYMENT_SMTP_USER || 'hello@iamarecruiter.in', 200);
  return 'I AM A RECRUITER Payments <' + address + '>';
}
async function sendMail(subject, html, text) {
  const info = await mailer().sendMail({ from: sender(), to: recipients(), subject, text, html });
  return info && info.messageId;
}
function istDateLabel(epochSeconds) {
  const d = new Date((Number(epochSeconds) + IST_OFFSET_SECONDS) * 1000);
  return d.toISOString().slice(0, 10);
}
function formatIst(epochSeconds) {
  if (!epochSeconds) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(Number(epochSeconds) * 1000));
}
function eventDetails(payment, order) {
  const orderNotes = notes(order);
  const paymentNotes = notes(payment);
  return {
    buyer: clean(orderNotes.customer_name || payment.email || 'Unknown buyer', 160),
    email: clean(orderNotes.customer_email || payment.email || '', 180),
    mobile: clean(orderNotes.customer_mobile || payment.contact || '', 40),
    amount: money(payment.amount),
    amountPaise: Number(payment.amount || 0),
    orderId: clean(payment.order_id || order && order.id || '', 160),
    paymentId: clean(payment.id, 160),
    status: clean(payment.status, 40).toUpperCase(),
    source: clean(orderNotes.source || '', 300),
    coupon: clean(orderNotes.coupon === 'none' ? '' : orderNotes.coupon || paymentNotes.coupon || '', 100),
    method: clean(payment.method || '', 80),
    bank: clean(payment.bank || payment.wallet || payment.vpa || '', 160),
    errorCode: clean(payment.error_code || '', 120),
    errorDescription: clean(payment.error_description || '', 500),
    createdAt: Number(payment.created_at || 0),
    fulfillment: clean(paymentNotes.iaar_fulfillment || '', 80)
  };
}
async function sendInstantAlert(payment, order) {
  const d = eventDetails(payment, order);
  const ok = payment.status === 'captured';
  const subject = (ok ? '✅ Payment confirmed' : '❌ Payment failed') + ' — ' + d.amount + ' — ' + d.buyer;
  const headline = ok ? 'PAYMENT CAPTURED & CONFIRMED' : 'PAYMENT FAILED';
  const accent = ok ? '#167a3f' : '#a12622';
  const errorBlock = ok ? '' : '<tr><td style="padding:8px 0"><strong>Failure reason:</strong> ' + esc(d.errorDescription || d.errorCode || 'No reason returned by Razorpay') + '</td></tr>';
  const html = '<div style="font-family:Arial,sans-serif;background:#f5f3ee;padding:24px"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:auto;background:#fff;border-top:7px solid #f4c400"><tr><td style="padding:28px 32px"><div style="font-size:12px;letter-spacing:1px;color:' + accent + ';font-weight:800">' + headline + '</div><h2 style="margin:8px 0 20px;color:#0e0e10">' + esc(d.amount) + ' · ' + esc(d.buyer) + '</h2><table width="100%" style="font-size:14px;line-height:1.55"><tr><td style="padding:8px 0"><strong>Buyer:</strong> ' + esc(d.buyer) + '</td></tr><tr><td style="padding:8px 0"><strong>Email:</strong> ' + esc(d.email || '—') + '</td></tr><tr><td style="padding:8px 0"><strong>Mobile:</strong> ' + esc(d.mobile || '—') + '</td></tr><tr><td style="padding:8px 0"><strong>Status:</strong> ' + esc(d.status) + '</td></tr><tr><td style="padding:8px 0"><strong>Payment ID:</strong> ' + esc(d.paymentId) + '</td></tr><tr><td style="padding:8px 0"><strong>Order ID:</strong> ' + esc(d.orderId) + '</td></tr><tr><td style="padding:8px 0"><strong>Method:</strong> ' + esc(d.method || '—') + '</td></tr><tr><td style="padding:8px 0"><strong>Source:</strong> ' + esc(d.source || '—') + '</td></tr><tr><td style="padding:8px 0"><strong>Time:</strong> ' + esc(formatIst(d.createdAt)) + '</td></tr>' + errorBlock + '</table></td></tr></table></div>';
  const text = [headline, '', 'Amount: ' + d.amount, 'Buyer: ' + d.buyer, 'Email: ' + (d.email || '—'), 'Mobile: ' + (d.mobile || '—'), 'Status: ' + d.status, 'Payment ID: ' + d.paymentId, 'Order ID: ' + d.orderId, 'Method: ' + (d.method || '—'), 'Source: ' + (d.source || '—'), 'Time: ' + formatIst(d.createdAt), ok ? '' : 'Failure reason: ' + (d.errorDescription || d.errorCode || 'No reason returned by Razorpay')].filter(Boolean).join('\n');
  return sendMail(subject, html, text);
}
function istDayRange(nowMs = Date.now()) {
  const nowSec = Math.floor(nowMs / 1000);
  const shifted = new Date((nowSec + IST_OFFSET_SECONDS) * 1000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  const startUtcMs = Date.UTC(y, m, d, 0, 0, 0) - IST_OFFSET_SECONDS * 1000;
  return { from: Math.floor(startUtcMs / 1000), to: nowSec, label: shifted.toISOString().slice(0, 10) };
}
async function buildDailySummary(nowMs = Date.now()) {
  const range = istDayRange(nowMs);
  const payments = await listPayments(range.from, range.to);
  const relevant = [];
  for (const p of payments) {
    if (!p || !p.order_id) continue;
    let order;
    try { order = await getOrder(p.order_id); } catch (_) { continue; }
    if (!isProductOrder(order)) continue;
    relevant.push({ payment: p, order, details: eventDetails(p, order) });
  }
  const captured = relevant.filter(x => x.payment.status === 'captured');
  const failed = relevant.filter(x => x.payment.status === 'failed');
  const revenue = captured.reduce((sum, x) => sum + Number(x.payment.amount || 0), 0);
  const fulfillmentIssues = captured.filter(x => {
    const s = clean(notes(x.payment).iaar_fulfillment || '', 80).toLowerCase();
    return s && s !== 'delivered';
  });
  return { range, relevant, captured, failed, revenue, fulfillmentIssues };
}
async function sendDailySummary(nowMs = Date.now()) {
  const s = await buildDailySummary(nowMs);
  const subject = '📊 Daily Razorpay summary — ' + s.range.label + ' — ' + s.captured.length + ' paid / ' + s.failed.length + ' failed';
  const rows = s.relevant.sort((a,b) => (b.payment.created_at || 0) - (a.payment.created_at || 0)).map(x => '<tr><td style="padding:8px;border-bottom:1px solid #eee">' + esc(formatIst(x.payment.created_at)) + '</td><td style="padding:8px;border-bottom:1px solid #eee">' + esc(x.details.buyer) + '</td><td style="padding:8px;border-bottom:1px solid #eee">' + esc(x.details.amount) + '</td><td style="padding:8px;border-bottom:1px solid #eee">' + esc(x.details.status) + '</td><td style="padding:8px;border-bottom:1px solid #eee">' + esc(x.details.source || '—') + '</td></tr>').join('');
  const html = '<div style="font-family:Arial,sans-serif;background:#f5f3ee;padding:24px"><table width="100%" style="max-width:760px;margin:auto;background:#fff;border-top:7px solid #f4c400"><tr><td style="padding:28px 32px"><div style="font-size:12px;letter-spacing:1px;color:#7b5a00;font-weight:800">DAILY RAZORPAY SUMMARY · 8 PM IST</div><h2 style="margin:8px 0 18px">' + esc(s.range.label) + '</h2><p><strong>Captured:</strong> ' + s.captured.length + ' &nbsp; <strong>Revenue:</strong> ' + esc(money(s.revenue)) + ' &nbsp; <strong>Failed:</strong> ' + s.failed.length + ' &nbsp; <strong>Fulfilment issues:</strong> ' + s.fulfillmentIssues.length + '</p><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:12px"><tr style="background:#0e0e10;color:#fff"><th align="left" style="padding:8px">Time</th><th align="left" style="padding:8px">Buyer</th><th align="left" style="padding:8px">Amount</th><th align="left" style="padding:8px">Status</th><th align="left" style="padding:8px">Source</th></tr>' + (rows || '<tr><td colspan="5" style="padding:18px">No Starter Pack payment activity today.</td></tr>') + '</table></td></tr></table></div>';
  const lines = ['Daily Razorpay summary — ' + s.range.label, '', 'Captured: ' + s.captured.length, 'Revenue: ' + money(s.revenue), 'Failed: ' + s.failed.length, 'Fulfilment issues: ' + s.fulfillmentIssues.length, ''];
  s.relevant.forEach(x => lines.push(formatIst(x.payment.created_at) + ' | ' + x.details.status + ' | ' + x.details.amount + ' | ' + x.details.buyer + ' | ' + (x.details.source || '—')));
  return sendMail(subject, html, lines.join('\n'));
}

module.exports = { PRODUCT, razorpay, listPayments, getOrder, notes, isProductOrder, markPayment, smtpConfigured, sendInstantAlert, sendDailySummary, buildDailySummary, eventDetails, recipients, formatIst, istDayRange, istDateLabel };
