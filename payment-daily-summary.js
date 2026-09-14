const core = require('./payment-notification-core');

(async () => {
  try {
    if (!core.smtpConfigured()) throw new Error('Payment notification SMTP is not configured');
    const id = await core.sendDailySummary(Date.now());
    console.log('PAYMENT_DAILY_SUMMARY_SENT recipients=' + core.recipients() + ' message_id=' + String(id || ''));
    process.exit(0);
  } catch (err) {
    console.error('PAYMENT_DAILY_SUMMARY_FAILED ' + String(err && err.stack || err));
    process.exit(1);
  }
})();
