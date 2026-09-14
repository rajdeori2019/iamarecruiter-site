from pathlib import Path

path = Path('payments-bootstrap.js')
text = path.read_text()
marker = "console.log('Razorpay payment middleware bootstrap loaded.');"
block = r'''
async function runStartupDeliveryProbe_() {
  const orderId = String(process.env.TMS_STARTUP_PROBE_ORDER_ID || '').trim();
  const paymentId = String(process.env.TMS_STARTUP_PROBE_PAYMENT_ID || '').trim();
  if (!orderId || !paymentId) return;
  try {
    const purchase = await capturedPurchase(orderId, paymentId);
    const delivery = await trackerRequest('send_delivery_email', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount_paise: purchase.amount,
      whatsapp_group_url: /^https:\/\//i.test(String(process.env.TMS_WHATSAPP_GROUP_URL || '')) ? String(process.env.TMS_WHATSAPP_GROUP_URL).trim() : ''
    });
    console.log('TMS_STARTUP_PROBE_RESULT ' + JSON.stringify(delivery || null));
  } catch (err) {
    console.error('TMS_STARTUP_PROBE_ERROR ' + String(err && err.message || err));
  }
}

if (process.env.TMS_STARTUP_PROBE_ORDER_ID && process.env.TMS_STARTUP_PROBE_PAYMENT_ID) {
  setTimeout(runStartupDeliveryProbe_, 5000);
}

'''
if "async function runStartupDeliveryProbe_()" not in text:
    if marker not in text:
        raise SystemExit('bootstrap log marker missing')
    text = text.replace(marker, block + marker, 1)
path.write_text(text)
