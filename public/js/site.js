(function () {
  // -----------------------------------------------------------------
  // Canonical site navigation
  // Keep the three commercial offers visible across the entire site,
  // while preserving each page's own CTA on the right.
  // -----------------------------------------------------------------
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var inner = nav.querySelector('.site-nav__inner');
    var cta = nav.querySelector('.site-nav__cta');
    var links = nav.querySelector('.site-nav__links');

    if (!links && inner) {
      links = document.createElement('div');
      links.className = 'site-nav__links';
      links.id = 'navLinks';
      if (cta) inner.insertBefore(links, cta);
      else inner.appendChild(links);
    }

    if (links) {
      links.innerHTML = [
        '<a href="/index.html" data-page="index.html">Home</a>',
        '<a href="/fractional-ta.html" data-page="fractional-ta.html">Fractional TA</a>',
        '<a href="/cohort.html" data-page="cohort.html">Recruiter Cohort</a>',
        '<a href="/premium-1-1.html" data-page="premium-1-1.html">Premium 1:1</a>',
        '<a href="/join.html" data-page="join.html">Community</a>'
      ].join('');
    }

    // Sales landing pages previously hid the standard link rail.
    // Override that page-local rule now that all three offers belong
    // in the header everywhere.
    if (nav.classList.contains('sales-nav')) {
      var navStyle = document.createElement('style');
      navStyle.textContent =
        '.site-nav.sales-nav .site-nav__links{display:flex !important;}' +
        '@media(max-width:760px){.site-nav.sales-nav .site-nav__links{display:flex !important;}}';
      document.head.appendChild(navStyle);
    }

    // Ensure every header, including sales pages, has a mobile menu toggle.
    if (cta && !cta.querySelector('.nav-toggle')) {
      var toggleButton = document.createElement('button');
      toggleButton.className = 'nav-toggle';
      toggleButton.id = 'navToggle';
      toggleButton.setAttribute('aria-label', 'Menu');
      toggleButton.setAttribute('aria-expanded', 'false');
      toggleButton.innerHTML = '<span></span>';
      cta.appendChild(toggleButton);
    }
  }

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.site-nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
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
