(function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.site-nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('is-open'); });
    });
  }

  // Mark active nav link
  var path = location.pathname.replace(/\/index\.html$/, '/').split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav__links a[data-page]').forEach(function (a) {
    if (a.getAttribute('data-page') === path || (path === '' && a.getAttribute('data-page') === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  // Ensure core policy links are reachable from existing site footers.
  var legalFooter = document.querySelector('.site-footer__legal');
  var alreadyHasPolicyLinks = document.querySelector('footer a[href="/privacy.html"]');
  if (legalFooter && !alreadyHasPolicyLinks) {
    var policyLinks = document.createElement('span');
    policyLinks.className = 'site-footer__policy-links';
    policyLinks.innerHTML = '<a href="/contact.html">Contact</a> &nbsp;·&nbsp; <a href="/privacy.html">Privacy</a> &nbsp;·&nbsp; <a href="/terms.html">Terms</a> &nbsp;·&nbsp; <a href="/cancellation.html">Cancellation &amp; Refunds</a>';
    legalFooter.appendChild(policyLinks);
  }

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
})();
