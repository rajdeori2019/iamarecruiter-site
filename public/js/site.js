(function () {
  // -----------------------------------------------------------------
  // Canonical site navigation
  // Preserve the original site pages and add the three commercial
  // offers without removing Join, Event or Videos.
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
        '<a href="/join.html" data-page="join.html">Join</a>',
        '<a href="/fractional-ta.html" data-page="fractional-ta.html">Fractional TA</a>',
        '<a href="/cohort.html" data-page="cohort.html">Cohort</a>',
        '<a href="/premium-1-1.html" data-page="premium-1-1.html">Premium 1:1</a>',
        '<a href="/event.html" data-page="event.html">Event</a>',
        '<a href="/videos.html" data-page="videos.html">Videos</a>'
      ].join('');
    }

    // Sales landing pages previously hid the standard link rail.
    // Keep the full navigation visible there as well.
    var navStyle = document.createElement('style');
    navStyle.textContent =
      '@media(min-width:761px){' +
        '.site-nav .site-nav__links{gap:14px;font-size:11px;white-space:nowrap;}' +
        '.site-nav .site-nav__inner{gap:14px;}' +
        '.site-nav.sales-nav .site-nav__links{display:flex !important;}' +
      '}' +
      '@media(max-width:760px){' +
        '.site-nav.sales-nav .site-nav__links{display:flex !important;}' +
      '}';
    document.head.appendChild(navStyle);

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

  // Premium 1:1 conversion framing.
  // Keep the working form/backend intact; reduce first-step friction by
  // framing the existing application as a Senior Interview Conversion Check.
  if (path === 'premium-1-1.html' || document.getElementById('premiumForm')) {
    var premiumTopCta = document.querySelector('.sales-nav .site-nav__cta > a.btn--accent[href="#apply"]');
    if (premiumTopCta) premiumTopCta.textContent = 'Check My Interview Bottleneck';

    var heroPrimaryCta = document.querySelector('#hCta a.btn--accent[href="#apply"]');
    if (heroPrimaryCta) heroPrimaryCta.textContent = 'Check My Interview Bottleneck →';

    var heroFine = document.querySelector('#hCta .hero__fine');
    if (heroFine) heroFine.textContent = '2-minute check · no payment · no hiring-outcome guarantee';

    var applySection = document.getElementById('apply');
    if (applySection) {
      var eyebrow = applySection.querySelector('.section-head .eyebrow');
      var heading = applySection.querySelector('.section-head h2');
      var lede = applySection.querySelector('.section-head .lede');
      if (eyebrow) eyebrow.textContent = 'Senior Interview Conversion Check';
      if (heading) heading.textContent = 'Already getting interviews but not consistently converting?';
      if (lede) lede.textContent = 'Answer a few questions about your target role, interview stage and recent outcomes. I’ll review where the bottleneck may be before recommending any paid intervention.';

      var submitButton = document.getElementById('premiumSubmit');
      if (submitButton) submitButton.textContent = 'Submit My Interview Conversion Check';

      var formNote = applySection.querySelector('.form-note');
      if (formNote) formNote.textContent = 'No payment is collected on this page. Your answers are used only to review the likely interview bottleneck, assess fit and follow up with an appropriate next step.';

      var successHeading = document.querySelector('#premiumSuccess h3');
      var successCopy = document.querySelector('#premiumSuccess p');
      if (successHeading) successHeading.textContent = 'Your Interview Conversion Check is received.';
      if (successCopy) successCopy.textContent = 'Your details are recorded. If you have an active interview, keep your JD and interview date ready. If there appears to be a strong fit, the next step is a focused diagnostic conversation.';
    }

    document.querySelectorAll('#offer a.btn--accent[href="#apply"], .cta-band a.btn--accent[href="#apply"]').forEach(function (a) {
      a.textContent = 'Check My Interview Bottleneck →';
    });

    var finalCtaCopy = document.querySelector('.cta-band p');
    if (finalCtaCopy) finalCtaCopy.textContent = 'If you are already getting interviews, start with the evidence. Complete the Senior Interview Conversion Check and let the diagnosis determine whether Premium 1:1 is the right intervention.';
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
