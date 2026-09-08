const SPREADSHEET_ID = '1P6bj6JUBqyFfUMh0AFrlbN1VYs580_Pp0QkaoNn3k74';
const BUYERS_SHEET = 'TMS Buyers';
const COUPONS_SHEET = 'TMS Coupons';
const ADMINS_SHEET = 'TMS Admins';

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

  if (publicUses >= maxUses) return { ok: true, valid: false, amount_paise: Math.round(original * 100), discount_paise: 0, user_type: 'BUYER', coupon_counted: true, message: code + ' has already been used.' };

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
      now_(), customer.name || '', normEmail_(customer.email), normMobile_(customer.mobile), customer.billing_address || '', customer.linkedin_url || '', eligibility.user_type, body.product || 'Talent Market Snapshot Challenge', rupees_(body.original_price_paise || 9900), code, rupees_(eligibility.discount_paise), rupees_(eligibility.amount_paise), eligibility.coupon_counted ? 'YES' : 'NO', '', '', 'COUPON_RESERVED', '', 'PENDING', 'NO', 'NO', 'NOT SHOWN', 'UNKNOWN', body.source || '', reservationId
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
    now_(), customer.name || '', normEmail_(customer.email), normMobile_(customer.mobile), customer.billing_address || '', customer.linkedin_url || '', body.user_type || 'BUYER', body.product || 'Talent Market Snapshot Challenge', rupees_(body.original_price_paise || 9900), body.coupon || '', rupees_(body.discount_paise || 0), rupees_(body.final_amount_paise || 9900), body.coupon_counted ? 'YES' : 'NO', body.razorpay_order_id || '', '', 'ORDER_CREATED', '', 'PENDING', 'NO', 'NO', 'NOT SHOWN', 'UNKNOWN', body.source || '', reservationId || uuid_()
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
