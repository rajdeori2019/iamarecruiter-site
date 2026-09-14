from pathlib import Path

p = Path('google-apps-script/TMSCheckoutTracker.gs')
text = p.read_text()

if 'deliveryAlreadySent_' in text and 'already_exists: true' in text:
    print('TMS tracker source already hardened.')
    raise SystemExit(0)

old_order = """function orderCreated_(body) {
  const sh = sheet_(BUYERS_SHEET);
  const reservationId = String(body.reservation_id || '');
  const values = sh.getDataRange().getValues();
  if (reservationId) {
"""
new_order = """function orderCreated_(body) {
  const sh = sheet_(BUYERS_SHEET);
  const reservationId = String(body.reservation_id || '');
  const values = sh.getDataRange().getValues();
  const orderId = String(body.razorpay_order_id || '').trim();

  // Idempotency: if this Razorpay order is already linked, never append a
  // second buyer row. This makes retries safe after transient Apps Script or
  // proxy failures where the write succeeded but the HTTP response was lost.
  if (orderId) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][13] || '').trim() === orderId) {
        return { ok: true, buyer_row: i + 1, already_exists: true };
      }
    }
  }

  if (reservationId) {
"""
if old_order not in text:
    raise SystemExit('orderCreated_ anchor not found; refusing to patch.')
text = text.replace(old_order, new_order, 1)

old_sender = """function assetButtonHtml_(asset, index) {
"""
new_sender = """function deliveryAlreadySent_(email, paymentId) {
  // The payment ID is unique and is included in every delivery email body.
  // Searching Sent Mail gives us a durable idempotency check even if Gmail
  // sent successfully but Apps Script failed before writing ACCESS SENT.
  const query = 'in:sent to:' + email + ' "' + paymentId + '" subject:"Your Talent Intelligence Starter Pack is ready"';
  try {
    return GmailApp.search(query, 0, 1).length > 0;
  } catch (_) {
    return false;
  }
}

function assetButtonHtml_(asset, index) {
"""
if old_sender not in text:
    raise SystemExit('assetButtonHtml_ anchor not found; refusing to patch.')
text = text.replace(old_sender, new_sender, 1)

old_email_guard = """  const name = String(row[1] || '').trim();
  const email = normEmail_(row[2]);
  if (!email) return { ok: false, error: 'Buyer email is missing.' };

  grantBuyerAssetAccess_(email);
"""
new_email_guard = """  const name = String(row[1] || '').trim();
  const email = normEmail_(row[2]);
  if (!email) return { ok: false, error: 'Buyer email is missing.' };

  const accessStatus = String(row[17] || '').trim().toUpperCase();
  if (accessStatus === 'ACCESS SENT') {
    return { ok: true, email_sent: true, already_sent: true, buyer_row: buyer.row, recipient: email, sender: DELIVERY_SENDER, product: PRODUCT_NAME };
  }

  // If a previous invocation sent the email but died before updating the
  // tracker, detect the unique payment ID in Sent Mail and repair the tracker
  // without sending a duplicate.
  if (deliveryAlreadySent_(email, paymentId)) {
    buyer.sheet.getRange(buyer.row, 18).setValue('ACCESS SENT');
    return { ok: true, email_sent: true, already_sent: true, buyer_row: buyer.row, recipient: email, sender: DELIVERY_SENDER, product: PRODUCT_NAME };
  }

  grantBuyerAssetAccess_(email);
"""
if old_email_guard not in text:
    raise SystemExit('sendDeliveryEmail_ guard anchor not found; refusing to patch.')
text = text.replace(old_email_guard, new_email_guard, 1)

p.write_text(text)
print('Hardened TMS tracker source for idempotent order writes and email delivery.')
