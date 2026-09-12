(function () {
  if (!/\/(?:ai-workflow|talent-intelligence-starter)(?:\.html)?$/.test(window.location.pathname)) return;

  var isStarter = /talent-intelligence-starter/.test(window.location.pathname);
  var productName = isStarter ? 'Talent Intelligence Starter Pack' : 'Talent Market Snapshot Challenge';
  var checkoutUrl = 'https://checkout.razorpay.com/v1/checkout.js';
  var loading = false;
  var modal;
  var verifyOverlay;

  function initMetaPixel() {
    if (!isStarter) return;
    if (!window.fbq) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    }
    fbq('init', '1619647492829039');
    fbq('track', 'PageView');
    fbq('track', 'ViewContent', { content_name: productName, content_type: 'product', value: 99, currency: 'INR' });
  }

  function metaTrack(eventName, params, standard) {
    if (!isStarter || typeof window.fbq !== 'function') return;
    try { fbq(standard ? 'track' : 'trackCustom', eventName, params || {}); } catch (_) {}
  }

  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + checkoutUrl + '"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      var script = document.createElement('script');
      script.src = checkoutUrl;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function postJson(url, payload) {
    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function money(paise) {
    return '₹' + (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
  }

  function ensureVerifyOverlay() {
    if (verifyOverlay) return verifyOverlay;
    var style = document.createElement('style');
    style.textContent =
      '.tms-verify-overlay{position:fixed;inset:0;z-index:10001;background:#0e0e10;display:none;align-items:center;justify-content:center;padding:24px}' +
      '.tms-verify-overlay.is-open{display:flex}' +
      '.tms-verify-box{width:min(620px,100%);background:#fff;border:2px solid #fff;padding:34px;box-shadow:10px 10px 0 #e8a400;text-align:center}' +
      '.tms-verify-badge{display:inline-block;background:#e8a400;color:#0e0e10;padding:7px 10px;font:700 10px monospace;letter-spacing:.08em;text-transform:uppercase}' +
      '.tms-verify-box h2{margin:18px 0 8px;font-size:clamp(2rem,5vw,3.2rem);line-height:1}' +
      '.tms-verify-box p{margin:0;color:#5a5a5a;line-height:1.55}' +
      '.tms-verify-dots{margin:22px auto 0;width:46px;height:8px;background:linear-gradient(90deg,#e8a400 0 28%,transparent 28% 36%,#e8a400 36% 64%,transparent 64% 72%,#e8a400 72% 100%);animation:tmsPulse 1s infinite alternate}' +
      '@keyframes tmsPulse{from{opacity:.35}to{opacity:1}}';
    document.head.appendChild(style);
    verifyOverlay = document.createElement('div');
    verifyOverlay.className = 'tms-verify-overlay';
    verifyOverlay.innerHTML = '<div class="tms-verify-box"><span class="tms-verify-badge">Payment received</span><h2>VERIFYING SECURELY…</h2><p>Your payment is complete. We are confirming it with Razorpay and preparing your Starter Pack.</p><div class="tms-verify-dots"></div></div>';
    document.body.appendChild(verifyOverlay);
    return verifyOverlay;
  }

  function showVerifyOverlay() {
    ensureVerifyOverlay().classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function hideVerifyOverlay() {
    if (verifyOverlay) verifyOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function ensureModal() {
    if (modal) return modal;
    var style = document.createElement('style');
    style.textContent =
      '.tms-checkout-overlay{position:fixed;inset:0;background:rgba(14,14,16,.72);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px}' +
      '.tms-checkout-overlay.is-open{display:flex}' +
      '.tms-checkout-card{width:min(720px,100%);max-height:92vh;overflow:auto;background:var(--paper,#fff);border:2px solid var(--ink,#0e0e10);box-shadow:10px 10px 0 var(--accent,#e8a400);padding:28px;position:relative}' +
      '.tms-checkout-close{position:absolute;right:16px;top:12px;border:0;background:none;font-size:28px;cursor:pointer}' +
      '.tms-checkout-card h2{font-size:clamp(1.8rem,4vw,2.7rem);margin:4px 36px 8px 0}' +
      '.tms-checkout-card .lede{color:var(--text-muted,#666);margin-bottom:22px}' +
      '.tms-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
      '.tms-field{display:flex;flex-direction:column;gap:7px}.tms-field.full{grid-column:1/-1}' +
      '.tms-field label{font-weight:700;font-size:13px}.tms-field input,.tms-field textarea{width:100%;border:1px solid var(--border,#d8d8d8);background:#fff;padding:13px 14px;font:inherit}' +
      '.tms-field textarea{min-height:84px;resize:vertical}' +
      '.tms-coupon-row{display:grid;grid-template-columns:1fr auto;gap:10px}' +
      '.tms-coupon-msg{font-size:12px;margin-top:7px;min-height:18px}.tms-coupon-msg.ok{color:#126b2f}.tms-coupon-msg.err{color:#9b1c1c}' +
      '.tms-summary{margin-top:22px;border-top:2px solid var(--ink,#0e0e10);border-bottom:1px solid var(--border,#ddd);padding:14px 0}' +
      '.tms-summary-row{display:flex;justify-content:space-between;gap:20px;padding:5px 0}.tms-summary-row.total{font-weight:800;font-size:1.1rem;border-top:1px dashed var(--border,#ddd);margin-top:6px;padding-top:11px}' +
      '.tms-checkout-error{margin-top:12px;color:#9b1c1c;font-size:13px;min-height:18px}' +
      '.tms-pay-btn{width:100%;margin-top:16px}.tms-secure{margin-top:9px;font-family:var(--font-mono,monospace);font-size:10px;color:var(--text-muted,#666);text-transform:uppercase;letter-spacing:.05em;text-align:center}' +
      '@media(max-width:640px){.tms-form-grid{grid-template-columns:1fr}.tms-checkout-card{padding:22px 18px}.tms-field.full{grid-column:auto}}';
    document.head.appendChild(style);

    modal = document.createElement('div');
    modal.className = 'tms-checkout-overlay';
    modal.innerHTML =
      '<div class="tms-checkout-card" role="dialog" aria-modal="true" aria-labelledby="tmsCheckoutTitle">' +
      '<button class="tms-checkout-close" type="button" aria-label="Close">×</button>' +
      '<div class="eyebrow">Secure checkout</div><h2 id="tmsCheckoutTitle">Complete your details</h2>' +
      '<p class="lede">Enter your details first. We will confirm the final amount, then open Razorpay Secure Checkout.</p>' +
      '<form id="tmsCheckoutForm" novalidate><div class="tms-form-grid">' +
      '<div class="tms-field"><label for="tmsName">Full Name *</label><input id="tmsName" name="name" autocomplete="name" required></div>' +
      '<div class="tms-field"><label for="tmsMobile">Mobile / WhatsApp *</label><input id="tmsMobile" name="mobile" inputmode="tel" autocomplete="tel" placeholder="+91 9876543210" required></div>' +
      '<div class="tms-field full"><label for="tmsEmail">Email *</label><input id="tmsEmail" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="tms-field full"><label for="tmsAddress">Billing Address *</label><textarea id="tmsAddress" name="billing_address" autocomplete="street-address" required></textarea></div>' +
      '<div class="tms-field full"><label for="tmsLinkedin">LinkedIn Profile URL</label><input id="tmsLinkedin" name="linkedin_url" type="url" placeholder="https://www.linkedin.com/in/..."></div>' +
      '<div class="tms-field full"><label for="tmsCoupon">Coupon Code</label><div class="tms-coupon-row"><input id="tmsCoupon" name="coupon" autocomplete="off" placeholder="Enter coupon"><button id="tmsApplyCoupon" class="btn btn--ghost" type="button">Apply</button></div><div id="tmsCouponMsg" class="tms-coupon-msg"></div></div>' +
      '</div><div class="tms-summary"><div class="tms-summary-row"><span>Price</span><strong>₹99</strong></div><div class="tms-summary-row"><span>Discount</span><strong id="tmsDiscount">₹0</strong></div><div class="tms-summary-row total"><span>Total</span><strong id="tmsTotal">₹99</strong></div></div>' +
      '<div id="tmsCheckoutError" class="tms-checkout-error"></div><button id="tmsPayButton" class="btn btn--accent tms-pay-btn" type="submit">Continue to Secure Payment — ₹99</button><div class="tms-secure">Payment processed securely by Razorpay</div></form></div>';
    document.body.appendChild(modal);

    modal.querySelector('.tms-checkout-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    modal.querySelector('#tmsApplyCoupon').addEventListener('click', applyCoupon);
    modal.querySelector('#tmsCheckoutForm').addEventListener('submit', submitCheckout);
    return modal;
  }

  function openModal(sourceLabel) {
    metaTrack('StarterPackCTAClick', { content_name: productName, source_label: sourceLabel || 'Get Starter Pack' }, false);
    ensureModal().classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modal.querySelector('#tmsName').focus(); }, 50);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function setCouponState(valid, amount, discount, message) {
    modal.dataset.couponValid = valid ? '1' : '0';
    modal.dataset.amount = String(amount || 9900);
    modal.dataset.discount = String(discount || 0);
    var msg = modal.querySelector('#tmsCouponMsg');
    msg.textContent = message || '';
    msg.className = 'tms-coupon-msg ' + (valid ? 'ok' : (message ? 'err' : ''));
    modal.querySelector('#tmsDiscount').textContent = money(discount || 0);
    modal.querySelector('#tmsTotal').textContent = money(amount || 9900);
    modal.querySelector('#tmsPayButton').textContent = 'Continue to Secure Payment — ' + money(amount || 9900);
  }

  async function applyCoupon() {
    var code = modal.querySelector('#tmsCoupon').value.trim().toUpperCase();
    var email = modal.querySelector('#tmsEmail').value.trim();
    var mobile = modal.querySelector('#tmsMobile').value.trim();
    if (!code) { setCouponState(false, 9900, 0, 'Enter a coupon code.'); return; }
    if (!email || !mobile) { setCouponState(false, 9900, 0, 'Enter your email and mobile number first so we can validate coupon eligibility.'); return; }
    var btn = modal.querySelector('#tmsApplyCoupon');
    btn.disabled = true; btn.textContent = 'Checking…';
    try {
      var result = await postJson('/api/razorpay/coupon', { coupon: code, email: email, mobile: mobile });
      setCouponState(!!result.valid, result.amount || 9900, result.discount || 0, result.message || '');
      if (result.valid) modal.querySelector('#tmsCoupon').value = result.coupon || code;
    } catch (err) {
      setCouponState(false, 9900, 0, err.message || 'Unable to validate coupon.');
    } finally {
      btn.disabled = false; btn.textContent = 'Apply';
    }
  }

  function checkoutSource() {
    var params = new URLSearchParams(window.location.search);
    var parts = [];
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function (key) {
      if (params.get(key)) parts.push(key + '=' + params.get(key));
    });
    parts.push('landing=' + (isStarter ? 'starter-pack' : 'ai-workflow'));
    return parts.join('&');
  }

  function formPayload() {
    return {
      name: modal.querySelector('#tmsName').value.trim(),
      email: modal.querySelector('#tmsEmail').value.trim(),
      mobile: modal.querySelector('#tmsMobile').value.trim(),
      billing_address: modal.querySelector('#tmsAddress').value.trim(),
      linkedin_url: modal.querySelector('#tmsLinkedin').value.trim(),
      coupon: modal.dataset.couponValid === '1' ? modal.querySelector('#tmsCoupon').value.trim().toUpperCase() : '',
      source: checkoutSource()
    };
  }

  async function submitCheckout(event) {
    event.preventDefault();
    if (loading) return;
    var form = modal.querySelector('#tmsCheckoutForm');
    if (!form.reportValidity()) return;

    var intendedAmount = Number(modal.dataset.amount || 9900) / 100;
    metaTrack('CheckoutFormSubmitted', { content_name: productName, value: intendedAmount, currency: 'INR' }, false);
    metaTrack('InitiateCheckout', { content_name: productName, content_type: 'product', value: intendedAmount, currency: 'INR' }, true);

    loading = true;
    var payButton = modal.querySelector('#tmsPayButton');
    var errorBox = modal.querySelector('#tmsCheckoutError');
    errorBox.textContent = '';
    payButton.disabled = true;
    payButton.textContent = 'Opening Secure Payment…';

    try {
      await loadRazorpay();
      var payload = formPayload();
      var order = await postJson('/api/razorpay/order', payload);
      var options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'I AM A RECRUITER',
        description: productName,
        order_id: order.order_id,
        prefill: {
          name: order.customer && order.customer.name ? order.customer.name : payload.name,
          email: order.customer && order.customer.email ? order.customer.email : payload.email,
          contact: order.customer && order.customer.mobile ? order.customer.mobile : payload.mobile
        },
        handler: async function (response) {
          showVerifyOverlay();
          try {
            var result = await postJson('/api/razorpay/verify', response);
            if (!result.verified) throw new Error('Payment could not be verified');
            sessionStorage.setItem('tms_payment_verified', JSON.stringify({
              payment_id: result.payment_id,
              order_id: result.order_id,
              coupon: result.coupon || '',
              amount: Number(result.amount || order.amount || 9900),
              product: productName,
              landing: isStarter ? 'starter-pack' : 'ai-workflow',
              verified_at: new Date().toISOString()
            }));
            window.location.assign('/talent-snapshot-payment-success.html');
          } catch (err) {
            hideVerifyOverlay();
            alert('Payment was received but verification could not be completed on this page. Please keep your Razorpay payment ID and contact hello@iamarecruiter.in.');
          }
        },
        theme: { color: '#E8A400' },
        modal: {
          ondismiss: function () {
            loading = false;
            payButton.disabled = false;
            payButton.textContent = 'Continue to Secure Payment — ' + money(order.amount);
          }
        },
        notes: { product: productName, coupon: order.coupon || 'none' }
      };
      closeModal();
      var razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function () {
        loading = false;
        payButton.disabled = false;
        payButton.textContent = 'Continue to Secure Payment — ' + money(order.amount);
      });
      razorpay.open();
    } catch (err) {
      loading = false;
      payButton.disabled = false;
      var amount = Number(modal.dataset.amount || 9900);
      payButton.textContent = 'Continue to Secure Payment — ' + money(amount);
      errorBox.textContent = err.message || 'Secure checkout could not be opened right now.';
    }
  }

  initMetaPixel();
  document.querySelectorAll('a.btn--accent').forEach(function (button) {
    var text = (button.textContent || '').trim();
    var href = button.getAttribute('href') || '';
    if (text.indexOf('₹99') !== -1 || href.indexOf('secure-checkout') !== -1 || href.indexOf('wa.me/919742944825') !== -1) {
      button.removeAttribute('target');
      button.removeAttribute('rel');
      button.setAttribute('href', '#secure-checkout');
      button.addEventListener('click', function (event) {
        event.preventDefault();
        openModal(text || 'Get Starter Pack');
      });
    }
  });
})();
