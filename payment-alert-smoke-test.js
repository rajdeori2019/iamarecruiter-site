const core = require('./payment-notification-core');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  try {
    if (!core.smtpConfigured()) throw new Error('SMTP is not configured');
    const now = Math.floor(Date.now() / 1000);
    const payment = {
      id: 'test_payment_' + Date.now(),
      order_id: 'test_order_' + Date.now(),
      amount: 9900,
      currency: 'INR',
      status: 'captured',
      method: 'test',
      created_at: now,
      email: 'test@example.com',
      contact: '+910000000000',
      notes: { iaar_fulfillment: 'test' }
    };
    const order = {
      id: payment.order_id,
      amount: 9900,
      currency: 'INR',
      notes: {
        product: core.PRODUCT,
        customer_name: 'TEST CUSTOMER — NOT A REAL PAYMENT',
        customer_email: 'test@example.com',
        customer_mobile: '+910000000000',
        source: 'synthetic-smoke-test'
      }
    };
    const messageId = await core.sendInstantAlert(payment, order);
    console.log('PAYMENT_ALERT_SMOKE_TEST_SUCCESS message_id=' + String(messageId || ''));
    await sleep(15000);
    process.exit(0);
  } catch (err) {
    console.error('PAYMENT_ALERT_SMOKE_TEST_FAILED ' + String(err && err.message || err));
    await sleep(15000);
    process.exit(1);
  }
})();
