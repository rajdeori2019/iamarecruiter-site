(function () {
  if (!/\/ai-workflow(?:\.html)?$/.test(window.location.pathname)) return;

  var checkoutUrl = 'https://checkout.razorpay.com/v1/checkout.js';
  var loading = false;

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

  function setButtonState(button, busy) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.textContent = 'Opening Secure Checkout…';
      button.setAttribute('aria-disabled', 'true');
      button.style.pointerEvents = 'none';
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.removeAttribute('aria-disabled');
      button.style.pointerEvents = '';
    }
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

  async function startCheckout(button) {
    if (loading) return;
    loading = true;
    setButtonState(button, true);
    try {
      await loadRazorpay();
      var order = await postJson('/api/razorpay/order', {});
      var options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: 'I AM A RECRUITER',
        description: 'Talent Market Snapshot Challenge',
        order_id: order.order_id,
        handler: async function (response) {
          try {
            var result = await postJson('/api/razorpay/verify', response);
            if (!result.verified) throw new Error('Payment could not be verified');
            sessionStorage.setItem('tms_payment_verified', JSON.stringify({
              payment_id: result.payment_id,
              order_id: result.order_id,
              verified_at: new Date().toISOString()
            }));
            window.location.assign('/talent-snapshot-payment-success.html');
          } catch (err) {
            alert('Payment was received but verification could not be completed on this page. Please keep your Razorpay payment ID and contact hello@iamarecruiter.in.');
          }
        },
        theme: { color: '#E8A400' },
        modal: {
          ondismiss: function () {
            loading = false;
            setButtonState(button, false);
          }
        },
        notes: { product: 'Talent Market Snapshot Challenge' }
      };
      var razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function () {
        loading = false;
        setButtonState(button, false);
      });
      razorpay.open();
    } catch (err) {
      loading = false;
      setButtonState(button, false);
      alert('Secure checkout could not be opened right now. Please try again in a moment.');
    }
  }

  document.querySelectorAll('a.btn--accent').forEach(function (button) {
    var text = (button.textContent || '').trim();
    var href = button.getAttribute('href') || '';
    if (text.indexOf('₹99') !== -1 || href.indexOf('wa.me/919742944825') !== -1) {
      button.removeAttribute('target');
      button.removeAttribute('rel');
      button.setAttribute('href', '#secure-checkout');
      button.addEventListener('click', function (event) {
        event.preventDefault();
        startCheckout(button);
      });
    }
  });
})();
