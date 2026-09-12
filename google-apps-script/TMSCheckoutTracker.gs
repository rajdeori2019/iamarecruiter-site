const SPREADSHEET_ID = '1P6bj6JUBqyFfUMh0AFrlbN1VYs580_Pp0QkaoNn3k74';
const BUYERS_SHEET = 'TMS Buyers';
const COUPONS_SHEET = 'TMS Coupons';
const ADMINS_SHEET = 'TMS Admins';
const DELIVERY_SENDER = 'hello@iamarecruiter.in';
const DELIVERY_BRAND = 'I AM A RECRUITER';
const DELIVERY_BASE_URL = 'https://www.iamarecruiter.in';
const PRODUCT_NAME = 'Talent Intelligence Starter Pack';
const PRODUCT_IMAGE_URL = DELIVERY_BASE_URL + '/assets/talent-intelligence-starter-pack-delivery.png';
const BUYER_ASSETS = [
  { label: 'Stop Sourcing Blind Playbook', fileId: '1W5YNcv0slqtslxLGwMVOeTrbQqVPN3hB' },
  { label: 'Talent Intelligence Workbook', fileId: '1wmmBJhDHFQgvI406n98XeGmabSOy3jMM' },
  { label: 'Recruiter AI Prompt Sheet — 8 reusable prompts', fileId: '1h4y-f2AgPGFIFIQ4sqKSjWz2s_WAhev-' },
  { label: 'Worked Example — Stop Sourcing Blind', fileId: '1JVcPRIvJ5kITwQkANEXnkMHA-lTSYrDC' }
];

function doPost(e) {
  try {
    const expectedToken = PropertiesService.getScriptProperties().getProperty('TMS_TRACKER_TOKEN');
    const suppliedToken = String((e && e.parameter && e.parameter.token) || '');
    if (!expectedToken || suppliedToken !== expectedToken) return out_({ ok: false, error: 'Unauthorized' });
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');
    if (action === 'check_coupon') return out_(checkCoupon_(body));
    if (action === 'reserve_coupon') return out_(reserveCoupon_(body));
    if (action === 'release_reservation') return out_(releaseReservation_(body));
    if (action === 'order_created') return out_(orderCreated_(body));
    if (action === 'payment_verified') return out_(paymentVerified_(body));
    if (action === 'send_delivery_email') return out_(sendDeliveryEmail_(body));
    return out_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out_({ ok: false, error: err.message || String(err) });
  }
}

function out_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name);
  return sh;
}
function normEmail_(v) { return String(v || '').trim().toLowerCase(); }
function normMobile_(v) { return String(v || '').replace(/[^0-9+]/g, ''); }
function now_() { return new Date(); }
function rupees_(paise) { return Number(paise || 0) / 100; }
function uuid_() { return Utilities.getUuid(); }
function html_(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}
function validHttps_(v) {
  const s = String(v || '').trim();
  return /^https:\/\//i.test(s) ? s : '';
}
function money_(paise) {
  const value = Number(paise || 0) / 100;
  return '₹' + value.toFixed(Number.isInteger(value) ? 0 : 2);
}
function assetUrl_(fileId) {
  return 'https://drive.google.com/file/d/' + encodeURIComponent(fileId) + '/view';
}
function grantBuyerAssetAccess_(email) {
  BUYER_ASSETS.forEach(function(asset) {
    DriveApp.getFileById(asset.fileId).addViewer(email);
  });
}

function adminStatus_(email, mobile) {
  const sh = sheet_(ADMINS_SHEET);
  const values = sh.getDataRange().getValues();
  const targetEmail = normEmail_(email);
  const targetMobile = normMobile_(mobile);
  for (let i = 1; i < values.length; i++) {
    const rowEmail = normEmail_(values[i][0]);
    const rowMobile = normMobile_(values[i][1]);
    const status = String(values[i][2] || '').trim().toUpperCase();
    const access = String(values[i][3] || '').trim().toUpperCase();
    if (status !== 'ACTIVE') continue;
    const matched = (targetEmail && rowEmail && targetEmail === rowEmail) || (targetMobile && rowMobile && targetMobile === rowMobile);
    if (matched && (access === 'ALL' || access === 'TALENT98' || access === 'UNLIMITED')) return true;
  }
  return false;
}

function couponRow_(code) {
  const sh = sheet_(COUPONS_SHEET);
  const values = sh.getDataRange().getValues();
  const target = String(code || '').trim().toUpperCase();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toUpperCase() === target) return { sheet: sh, row: i + 1, values: values[i] };
  }
  return null;
}

function existingReservation_(email, mobile, coupon) {
  const sh = sheet_(BUYERS_SHEET);
  const values = sh.getDataRange().getValues();
  const e = normEmail_(email);
  const m = normMobile_(mobile);
  const c = String(coupon || '').trim().toUpperCase();
  for (let i = 1; i < values.length; i++) {
    const rowEmail = normEmail_(values[i][2]);
    const rowMobile = normMobile_(values[i][3]);
    const rowCoupon = String(values[i][9] || '').trim().toUpperCase();
    const status = String(values[i][15] || '').trim().toUpperCase();
    if (rowEmail === e && rowMobile === m && rowCoupon === c && ['COUPON_RESERVED','ORDER_CREATED','CAPTURED'].includes(status)) {
      return { row: i + 1, values: values[i] };
    }
  }
  return null;
}

function checkCoupon_(body) {
  const code = String(body.coupon || '').trim().toUpperCase();
  const email = normEmail_(body.email);
  const mobile = normMobile_(body.mobile);
  const found = couponRow_(code);
  if (!found) return { ok: true, valid: false, amount_paise: 9900, discount_paise: 0, message: 'Coupon code is not valid.' };

  const row = found.values;
  const status = String(row[9] || '').trim().toUpperCase();
  if (status !== 'ACTIVE') return { ok: true, valid: false, amount_paise: 9900, discount_paise: 0, message: 'Coupon is not active.' };

  const isAdmin = adminStatus_(email, mobile);
  const discountValue = Number(row[2] || 0);
  const original = Number(row[3] || 99);
  const finalPrice = Number(row[4] || Math.max(0, original - discountValue));
  const maxUses = Number(row[5] || 0);
  const publicUses = Number(row[6] || 0);
  const adminUnlimited = row[7] === true || String(row[7]).toUpperCase() === 'TRUE';

  if (isAdmin && adminUnlimited) {
    return { ok: true, valid: true, amount_paise: Math.round(finalPrice * 100), discount_paise: Math.round(discountValue * 100), user_type: 'ADMIN', coupon_counted: false, message: code + ' applied for admin test.' };
  }

  const existing = existingReservation_(email, mobile, code);
  if (existing) {
    return { ok: true, valid: true, amount_paise: Math.round(finalPrice * 100), discount_paise: Math.round(discountValue * 100), user_type: 'BUYER', coupon_counted: true, message: code + ' is already reserved for this buyer.' };
  }

  if (publicUses >= maxUses) {
    return { ok: true, valid: false, amount_paise: Math.round(original * 100), discount_paise: 0, user_type: 'BUYER', coupon_counted: true, message: code + ' has already been used.' };
  }

  return { ok: true, valid: true, amount_paise: Math.round(finalPrice * 100), discount_paise: Math.round(discountValue * 100), user_type: 'BUYER', coupon_counted: true, message: code + ' applied. ₹' + discountValue + ' discount.' };
}

function reserveCoupon_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const customer = body.customer || {};
    const code = String(body.coupon || '').trim().toUpperCase();
    const eligibility = checkCoupon_({ coupon: code, email: customer.email, mobile: customer.mobile });
    if (!eligibility.valid) return eligibility;

    const existing = existingReservation_(customer.email, customer.mobile, code);
    if (existing) {
      return { ok: true, valid: true, reservation_id: String(existing.values[23] || 'existing-' + existing.row), amount_paise: eligibility.amount_paise, discount_paise: eligibility.discount_paise, user_type: eligibility.user_type, coupon_counted: eligibility.coupon_counted, message: 'Existing coupon reservation reused.' };
    }

    const reservationId = uuid_();
    const isAdmin = eligibility.user_type === 'ADMIN';
    const sh = sheet_(BUYERS_SHEET);
    const row = [
      now_(), customer.name || '', normEmail_(customer.email), normMobile_(customer.mobile), customer.billing_address || '', customer.linkedin_url || '', eligibility.user_type, body.product || PRODUCT_NAME, rupees_(body.original_price_paise || 9900), code, rupees_(eligibility.discount_paise), rupees_(eligibility.amount_paise), eligibility.coupon_counted ? 'YES' : 'NO', '', '', 'COUPON_RESERVED', '', 'PENDING', 'NO', 'NO', 'NOT SHOWN', 'UNKNOWN', body.source || '', reservationId
    ];
    sh.appendRow(row);

    const c = couponRow_(code);
    if (isAdmin) c.sheet.getRange(c.row, 9).setValue(Number(c.values[8] || 0) + 1);
    else c.sheet.getRange(c.row, 7).setValue(Number(c.values[6] || 0) + 1);
    c.sheet.getRange(c.row, 11).setValue(normEmail_(customer.email));
    c.sheet.getRange(c.row, 12).setValue(normMobile_(customer.mobile));
    c.sheet.getRange(c.row, 13).setValue(eligibility.user_type);
    c.sheet.getRange(c.row, 14).setValue(eligibility.coupon_counted ? 'YES' : 'NO');

    return { ok: true, valid: true, reservation_id: reservationId, amount_paise: eligibility.amount_paise, discount_paise: eligibility.discount_paise, user_type: eligibility.user_type, coupon_counted: eligibility.coupon_counted, message: 'Coupon reserved.' };
  } finally {
    lock.releaseLock();
  }
}

function releaseReservation_(body) {
  const reservationId = String(body.reservation_id || '');
  if (!reservationId) return { ok: true };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_(BUYERS_SHEET);
    const values = sh.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][23] || '') !== reservationId) continue;
      const status = String(values[i][15] || '').toUpperCase();
      if (status !== 'COUPON_RESERVED') return { ok: true };
      const coupon = String(values[i][9] || '').toUpperCase();
      const userType = String(values[i][6] || '').toUpperCase();
      const counted = String(values[i][12] || '').toUpperCase() === 'YES';
      sh.getRange(i + 1, 16).setValue('RESERVATION_RELEASED');
      const c = couponRow_(coupon);
      if (c) {
        if (userType === 'ADMIN') c.sheet.getRange(c.row, 9).setValue(Math.max(0, Number(c.values[8] || 0) - 1));
        else if (counted) c.sheet.getRange(c.row, 7).setValue(Math.max(0, Number(c.values[6] || 0) - 1));
      }
      return { ok: true };
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function orderCreated_(body) {
  const sh = sheet_(BUYERS_SHEET);
  const reservationId = String(body.reservation_id || '');
  const values = sh.getDataRange().getValues();
  if (reservationId) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][23] || '') === reservationId) {
        sh.getRange(i + 1, 14).setValue(body.razorpay_order_id || '');
        sh.getRange(i + 1, 16).setValue('ORDER_CREATED');
        return { ok: true, buyer_row: i + 1 };
      }
    }
  }

  const customer = body.customer || {};
  const row = [
    now_(), customer.name || '', normEmail_(customer.email), normMobile_(customer.mobile), customer.billing_address || '', customer.linkedin_url || '', body.user_type || 'BUYER', body.product || PRODUCT_NAME, rupees_(body.original_price_paise || 9900), body.coupon || '', rupees_(body.discount_paise || 0), rupees_(body.final_amount_paise || 9900), body.coupon_counted ? 'YES' : 'NO', body.razorpay_order_id || '', '', 'ORDER_CREATED', '', 'PENDING', 'NO', 'NO', 'NOT SHOWN', 'UNKNOWN', body.source || '', reservationId || uuid_()
  ];
  sh.appendRow(row);
  return { ok: true, buyer_row: sh.getLastRow() };
}

function paymentVerified_(body) {
  const sh = sheet_(BUYERS_SHEET);
  const values = sh.getDataRange().getValues();
  const orderId = String(body.razorpay_order_id || '');
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][13] || '') !== orderId) continue;
    sh.getRange(i + 1, 15).setValue(body.razorpay_payment_id || '');
    sh.getRange(i + 1, 16).setValue(body.payment_status || 'CAPTURED');
    sh.getRange(i + 1, 17).setValue(now_());
    sh.getRange(i + 1, 18).setValue('PAID - ACCESS PENDING');

    const coupon = String(values[i][9] || '').trim().toUpperCase();
    if (coupon) {
      const c = couponRow_(coupon);
      if (c) {
        c.sheet.getRange(c.row, 15).setValue(orderId);
        c.sheet.getRange(c.row, 16).setValue(body.razorpay_payment_id || '');
        c.sheet.getRange(c.row, 17).setValue(now_());
      }
    }
    return { ok: true, buyer_row: i + 1 };
  }
  return { ok: false, error: 'Buyer order was not found in tracker.' };
}

function buyerByOrder_(orderId) {
  const sh = sheet_(BUYERS_SHEET);
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][13] || '') === String(orderId || '')) return { sheet: sh, row: i + 1, values: values[i] };
  }
  return null;
}

function senderOptions_() {
  const effective = normEmail_(Session.getEffectiveUser().getEmail());
  const aliases = GmailApp.getAliases().map(normEmail_);
  if (effective === DELIVERY_SENDER) return { name: DELIVERY_BRAND, replyTo: DELIVERY_SENDER };
  if (aliases.indexOf(DELIVERY_SENDER) >= 0) return { name: DELIVERY_BRAND, replyTo: DELIVERY_SENDER, from: DELIVERY_SENDER };
  throw new Error('Delivery email blocked: Apps Script must execute as hello@iamarecruiter.in or have hello@iamarecruiter.in configured as a Gmail send-as alias.');
}

function assetButtonHtml_(asset, index) {
  const step = ['LEARN','APPLY','STRUCTURE + VERIFY','SEE IT DONE'][index] || 'ASSET';
  return '<tr><td style="padding:0 0 12px 0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #dedbd3;background:#ffffff">' +
      '<tr><td style="padding:18px 20px">' +
        '<div style="font-family:monospace;font-size:10px;letter-spacing:1px;color:#7b5a00;font-weight:700">0' + (index + 1) + ' · ' + step + '</div>' +
        '<div style="font-family:Arial,sans-serif;font-size:18px;line-height:1.35;font-weight:700;color:#0e0e10;margin-top:7px">' + html_(asset.label) + '</div>' +
        '<div style="margin-top:14px"><a href="' + html_(assetUrl_(asset.fileId)) + '" style="display:inline-block;background:#f4c400;color:#0e0e10;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:14px;padding:11px 16px;border-radius:3px">OPEN PDF →</a></div>' +
      '</td></tr>' +
    '</table>' +
  '</td></tr>';
}

function sendDeliveryEmail_(body) {
  const orderId = String(body.razorpay_order_id || '').trim();
  const paymentId = String(body.razorpay_payment_id || '').trim();
  if (!orderId || !paymentId) return { ok: false, error: 'Missing order or payment ID.' };

  const buyer = buyerByOrder_(orderId);
  if (!buyer) return { ok: false, error: 'Buyer order was not found in tracker.' };

  const row = buyer.values;
  const trackedPaymentId = String(row[14] || '').trim();
  const paymentStatus = String(row[15] || '').trim().toUpperCase();
  if (trackedPaymentId !== paymentId || paymentStatus !== 'CAPTURED') {
    return { ok: false, error: 'Tracker does not show a matching captured payment.' };
  }

  const name = String(row[1] || '').trim();
  const email = normEmail_(row[2]);
  if (!email) return { ok: false, error: 'Buyer email is missing.' };

  grantBuyerAssetAccess_(email);

  const amountPaise = Number(body.amount_paise || Math.round(Number(row[11] || 0) * 100));
  const q = '?order_id=' + encodeURIComponent(orderId) + '&payment_id=' + encodeURIComponent(paymentId);
  const toolUrl = DELIVERY_BASE_URL + '/tms-v2.html' + q;
  const receiptUrl = DELIVERY_BASE_URL + '/tms/receipt' + q;
  const whatsappUrl = validHttps_(body.whatsapp_group_url || PropertiesService.getScriptProperties().getProperty('TMS_WHATSAPP_GROUP_URL'));
  const greeting = name ? 'Hi ' + html_(name) + ',' : 'Hi,';
  const assetsHtml = BUYER_ASSETS.map(assetButtonHtml_).join('');
  const assetText = BUYER_ASSETS.map(function(asset, idx) {
    return (idx + 1) + '. ' + asset.label + ': ' + assetUrl_(asset.fileId);
  }).join('\n');

  const htmlBody = '<div style="margin:0;padding:0;background:#f5f3ee">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f5f3ee"><tr><td align="center" style="padding:28px 12px">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:760px;border-collapse:collapse;background:#ffffff">' +
        '<tr><td style="padding:24px 28px 14px 28px;border-top:8px solid #f4c400">' +
          '<img src="' + PRODUCT_IMAGE_URL + '" alt="Talent Intelligence Starter Pack" width="704" style="display:block;width:100%;max-width:704px;height:auto;border:0">' +
        '</td></tr>' +
        '<tr><td style="padding:10px 34px 8px 34px;font-family:Arial,sans-serif;color:#0e0e10">' +
          '<p style="margin:0 0 14px 0;font-size:17px;line-height:1.6">' + greeting + '</p>' +
          '<div style="background:#0e0e10;color:#ffffff;padding:18px 22px;border-left:6px solid #f4c400;font-size:27px;line-height:1.2;font-weight:800">Your Talent Intelligence Starter Pack is ready.</div>' +
          '<p style="margin:20px 0 0 0;font-size:16px;line-height:1.65;color:#2c2c2f">Your payment of <strong>' + html_(money_(amountPaise)) + '</strong> has been verified. Your access now includes the four final buyer PDFs plus the Talent Market Snapshot Tool.</p>' +
          '<p style="margin:12px 0 24px 0;font-size:14px;line-height:1.6;color:#666">Recommended sequence: <strong>Playbook → Workbook → Prompt Sheet → Worked Example → Talent Market Snapshot Tool.</strong></p>' +
        '</td></tr>' +
        '<tr><td style="padding:0 34px 4px 34px">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + assetsHtml + '</table>' +
        '</td></tr>' +
        '<tr><td style="padding:8px 34px 0 34px">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fff8d6;border:2px solid #0e0e10"><tr><td style="padding:20px">' +
            '<div style="font-family:monospace;font-size:10px;letter-spacing:1px;color:#7b5a00;font-weight:700">BONUS APPLICATION TOOL</div>' +
            '<div style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#0e0e10;margin-top:6px">Talent Market Snapshot Tool</div>' +
            '<div style="margin-top:14px"><a href="' + html_(toolUrl) + '" style="display:inline-block;background:#0e0e10;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-weight:700;font-size:14px;padding:12px 17px;border-radius:3px">OPEN TOOL →</a></div>' +
          '</td></tr></table>' +
        '</td></tr>' +
        (whatsappUrl ? '<tr><td style="padding:22px 34px 0 34px;font-family:Arial,sans-serif"><a href="' + html_(whatsappUrl) + '" style="display:inline-block;border:1px solid #0e0e10;color:#0e0e10;text-decoration:none;font-weight:700;font-size:14px;padding:11px 16px">JOIN CLOSED WHATSAPP GROUP</a></td></tr>' : '') +
        '<tr><td style="padding:26px 34px 12px 34px;font-family:Arial,sans-serif;color:#0e0e10">' +
          '<a href="' + html_(receiptUrl) + '" style="color:#0e0e10;text-decoration:underline;font-weight:700">View payment receipt</a>' +
          '<p style="margin:22px 0 0 0;font-family:monospace;font-size:11px;line-height:1.7;color:#555">Payment ID: ' + html_(paymentId) + '<br>Order ID: ' + html_(orderId) + '</p>' +
          '<p style="margin:20px 0 0 0;font-size:14px;line-height:1.6;color:#333">Need help? Reply to this email or write to <a href="mailto:' + DELIVERY_SENDER + '" style="color:#0e0e10">' + DELIVERY_SENDER + '</a>.</p>' +
          '<p style="margin:18px 0 0 0;font-size:14px;line-height:1.6">Regards,<br><strong>I AM A RECRUITER</strong></p>' +
        '</td></tr>' +
        '<tr><td style="padding:18px 34px 28px 34px;font-family:Arial,sans-serif;font-size:11px;line-height:1.55;color:#777;border-top:1px solid #e5e2da">These buyer files are shared with the email used at checkout. Please keep this email for your records. The payment receipt is not a GST/tax invoice.</td></tr>' +
      '</table>' +
    '</td></tr></table>' +
  '</div>';

  const textBody = (name ? 'Hi ' + name + ',\n\n' : 'Hi,\n\n') +
    'Your Talent Intelligence Starter Pack is ready.\n\n' +
    'Payment verified: ' + money_(amountPaise) + '\n\n' +
    assetText + '\n\n' +
    'Bonus — Talent Market Snapshot Tool: ' + toolUrl + '\n' +
    'Payment Receipt: ' + receiptUrl + '\n' +
    (whatsappUrl ? 'Closed WhatsApp Group: ' + whatsappUrl + '\n' : '') +
    '\nRecommended sequence: Playbook → Workbook → Prompt Sheet → Worked Example → Talent Market Snapshot Tool.\n' +
    '\nPayment ID: ' + paymentId + '\nOrder ID: ' + orderId + '\n\n' +
    'Need help? Reply to this email or write to ' + DELIVERY_SENDER + '.\n\n' +
    'Regards,\nI AM A RECRUITER';

  GmailApp.sendEmail(email, 'Your Talent Intelligence Starter Pack is ready', textBody, Object.assign(senderOptions_(), { htmlBody: htmlBody }));
  buyer.sheet.getRange(buyer.row, 18).setValue('ACCESS SENT');

  return { ok: true, email_sent: true, buyer_row: buyer.row, recipient: email, sender: DELIVERY_SENDER, product: PRODUCT_NAME };
}

function testDeliverySender() {
  Logger.log('Effective user: ' + Session.getEffectiveUser().getEmail());
  Logger.log('Available aliases: ' + JSON.stringify(GmailApp.getAliases()));
  Logger.log('Sender config: ' + JSON.stringify(senderOptions_()));
}
