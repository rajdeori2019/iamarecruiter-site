from pathlib import Path

path = Path('payments-bootstrap.js')
text = path.read_text()

marker = "function serveCheckoutPage(res) {"
if "async function recoveryProbe(req, res)" not in text:
    insert = r'''
async function recoveryProbe(req, res) {
  const u = new URL(req.url, 'https://www.iamarecruiter.in');
  const expectedToken = String(process.env.TMS_RECOVERY_TOKEN || '');
  const suppliedToken = clean(u.searchParams.get('token'), 160);
  if (!expectedToken || suppliedToken !== expectedToken) return json(res, 403, { ok: false, error: 'Forbidden' });
  const orderId = clean(u.searchParams.get('order_id'), 120);
  const paymentId = clean(u.searchParams.get('payment_id'), 120);
  if (!orderId || !paymentId) return json(res, 400, { ok: false, error: 'Missing order or payment ID.' });
  try {
    const purchase = await capturedPurchase(orderId, paymentId);
    const delivery = await trackerRequest('send_delivery_email', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount_paise: purchase.amount,
      whatsapp_group_url: /^https:\/\//i.test(String(process.env.TMS_WHATSAPP_GROUP_URL || '')) ? String(process.env.TMS_WHATSAPP_GROUP_URL).trim() : ''
    });
    return json(res, 200, { ok: true, delivery: delivery || null });
  } catch (err) {
    console.error('Temporary TMS recovery probe failed:', String(err && err.message || err));
    return json(res, 500, { ok: false, error: String(err && err.message || err) });
  }
}

'''
    if marker not in text:
        raise SystemExit('serveCheckoutPage marker missing')
    text = text.replace(marker, insert + marker, 1)

route_marker = "    if (req.method === 'GET' && requestPath === '/api/tms/access-config') return accessConfig(req, res);"
route = "    if (req.method === 'GET' && requestPath === '/api/tms/recovery-probe') return recoveryProbe(req, res);\n"
if route not in text:
    if route_marker not in text:
        raise SystemExit('route marker missing')
    text = text.replace(route_marker, route + route_marker, 1)

path.write_text(text)
