(function () {
  var nav = document.querySelector('.site-nav');
  if (nav) {
    var inner = nav.querySelector('.site-nav__inner');
    var cta = nav.querySelector('.site-nav__cta');
    var links = nav.querySelector('.site-nav__links');
    if (!links && inner) {
      links = document.createElement('div');
      links.className = 'site-nav__links';
      links.id = 'navLinks';
      if (cta) inner.insertBefore(links, cta); else inner.appendChild(links);
    }
    if (links) {
      links.innerHTML = [
        '<a href="/index.html" data-page="index.html">Home</a>',
        '<a href="/join.html" data-page="join.html">Join</a>',
        '<a href="/event.html" data-page="event.html">Event</a>',
        '<a href="/videos.html" data-page="videos.html">Videos</a>'
      ].join('');
    }
    var navStyle = document.createElement('style');
    navStyle.textContent =
      '@media(min-width:761px){.site-nav .site-nav__links{gap:24px;font-size:12px;white-space:nowrap}.site-nav .site-nav__inner{gap:16px}.site-nav.sales-nav .site-nav__links{display:flex!important}}' +
      '@media(max-width:760px){.site-nav.sales-nav .site-nav__links{display:flex!important}}';
    document.head.appendChild(navStyle);
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

  var path = location.pathname.replace(/\/index\.html$/, '/').split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav__links a[data-page]').forEach(function (a) {
    if (a.getAttribute('data-page') === path || (path === '' && a.getAttribute('data-page') === 'index.html')) a.classList.add('is-active');
  });

  var footer = document.querySelector('.site-footer');
  var legalFooter = document.querySelector('.site-footer__legal');
  if (footer && legalFooter && !document.querySelector('.site-footer__directory')) {
    legalFooter.querySelectorAll('.site-footer__offers,.site-footer__policy-links').forEach(function (el) { el.remove(); });
    var directory = document.createElement('div');
    directory.className = 'site-footer__directory';
    directory.innerHTML =
      '<div class="site-footer__col"><div class="site-footer__label">Explore</div><a href="/index.html">Home</a><a href="/join.html">Join the Community</a><a href="/event.html">Events</a><a href="/videos.html">Videos</a></div>' +
      '<div class="site-footer__col"><div class="site-footer__label">Services</div><a href="/fractional-ta.html">Fractional TA</a><a href="/premium-1-1.html">Premium 1:1</a></div>' +
      '<div class="site-footer__col"><div class="site-footer__label">Learn & Grow</div><a href="/ai-workflow.html">Talent Intelligence Challenge</a><a href="/cohort.html">Recruiter Cohort</a><a href="/diagnostic.html">Strategic Recruiter Diagnostic</a></div>' +
      '<div class="site-footer__col"><div class="site-footer__label">Company</div><a href="/contact.html">Contact</a><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><a href="/cancellation.html">Cancellation &amp; Refunds</a></div>';
    legalFooter.parentNode.insertBefore(directory, legalFooter);
    legalFooter.innerHTML = '<span>© 2026 I AM A RECRUITER™</span>';

    var footerStyle = document.createElement('style');
    footerStyle.textContent =
      '.site-footer__directory{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:48px;padding:34px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-top:28px}' +
      '.site-footer__col{display:flex;flex-direction:column;align-items:flex-start;gap:10px}' +
      '.site-footer__label{font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px}' +
      '.site-footer__col a{font-family:var(--font-body);font-size:14px;text-decoration:none;color:var(--text);line-height:1.45}' +
      '.site-footer__col a:hover{color:var(--accent-ink)}' +
      '.site-footer__legal{display:flex!important;justify-content:flex-start!important;gap:0!important;padding-top:20px!important}' +
      '@media(max-width:800px){.site-footer__directory{grid-template-columns:repeat(2,minmax(0,1fr));gap:32px}}' +
      '@media(max-width:520px){.site-footer__directory{grid-template-columns:1fr;gap:26px;padding:28px 0}}';
    document.head.appendChild(footerStyle);
  }

  if (path === 'cohort.html' || document.getElementById('cohortForm')) {
    function diagnosticUrl(content) {
      return '/diagnostic.html?utm_source=cohort&utm_medium=website&utm_campaign=cohort_launch_sep26&utm_content=' + content;
    }
    var cohortNavSecondary = document.querySelector('.sales-nav .site-nav__cta > a.btn--ghost');
    if (cohortNavSecondary) { cohortNavSecondary.href = diagnosticUrl('nav_diagnostic'); cohortNavSecondary.textContent = 'Take Free Diagnostic'; }
    var cohortHeroSecondary = document.querySelector('#hCta a.btn--ghost');
    if (cohortHeroSecondary) { cohortHeroSecondary.href = diagnosticUrl('hero_diagnostic'); cohortHeroSecondary.textContent = 'Take Free 5-Min Diagnostic'; }
    var cohortHeroFine = document.querySelector('#hCta .hero__fine');
    if (cohortHeroFine) cohortHeroFine.textContent = '₹10,000 cohort · or start free with the 5-minute readiness diagnostic';
    var heroSection = document.getElementById('hero');
    if (heroSection && !document.getElementById('diagnostic-entry')) {
      var diagnosticSection = document.createElement('section');
      diagnosticSection.className = 'section section--surface';
      diagnosticSection.id = 'diagnostic-entry';
      diagnosticSection.innerHTML = '<div class="container"><div class="section-head section-head--wide reveal"><div class="eyebrow">Not ready to apply yet?</div><h2>First, find out where your strategic recruiting capability actually stands.</h2><p class="lede">Take the free 5-minute Strategic Recruiter Readiness Diagnostic. You’ll get a 0–100 readiness score, all 8 capability ratings, your strongest capability and your top 3 development priorities.</p></div><div class="apply-grid reveal"><div class="apply-copy"><h3>Start with evidence, not a course decision.</h3><p>If the diagnostic shows meaningful gaps in hiring diagnosis, talent intelligence, stakeholder advisory, sourcing, assessment, analytics or responsible AI, you’ll know exactly what needs strengthening before deciding whether the cohort is relevant.</p><div class="hero__cta"><a class="btn btn--accent" href="' + diagnosticUrl('entry_primary') + '">Take My Free Diagnostic →</a><a class="btn btn--ghost" href="#curriculum">See the 6 Applied Pillars</a></div><p class="form-note">16 scenarios · about 5 minutes · instant personalized result · no payment</p></div><div class="apply-copy"><h3>What you’ll see immediately</h3><ol class="apply-steps"><li><b>1</b><span>Your Strategic Recruiter Readiness Score out of 100.</span></li><li><b>2</b><span>Your level: execution-first, developing, emerging, strategic or advanced.</span></li><li><b>3</b><span>Your strongest capability across 8 strategic TA dimensions.</span></li><li><b>4</b><span>Your top 3 development priorities and what they mean.</span></li></ol></div></div></div>';
      heroSection.insertAdjacentElement('afterend', diagnosticSection);
    }
    var offerSecondary = document.querySelector('#offer a.btn--ghost');
    if (offerSecondary) { offerSecondary.href = diagnosticUrl('offer_diagnostic'); offerSecondary.textContent = 'Take Free Diagnostic First'; }
    var finalCtaCopy = document.querySelector('.cta-band p');
    if (finalCtaCopy) finalCtaCopy.textContent = 'If you already know you want to build these capabilities, apply. If you are not sure where your gaps are yet, take the free readiness diagnostic first.';
    var finalSecondary = document.querySelector('.cta-band a.btn--ghost');
    if (finalSecondary) { finalSecondary.href = diagnosticUrl('final_diagnostic'); finalSecondary.removeAttribute('target'); finalSecondary.removeAttribute('rel'); finalSecondary.textContent = 'Take Free Diagnostic'; }
  }

  if (path === 'premium-1-1.html' || document.getElementById('premiumForm')) {
    var premiumUrl = new URL(window.location.href);
    var premiumContent = premiumUrl.searchParams.get('utm_content');
    if (premiumContent) {
      var cleanContent = premiumContent.slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '-');
      var premiumCampaign = premiumUrl.searchParams.get('utm_campaign') || 'premium_content';
      if (premiumCampaign.indexOf('__content_') === -1) {
        premiumUrl.searchParams.set('utm_campaign', premiumCampaign + '__content_' + cleanContent);
        window.history.replaceState({}, '', premiumUrl.pathname + '?' + premiumUrl.searchParams.toString() + premiumUrl.hash);
      }
    }
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
    document.querySelectorAll('#offer a.btn--accent[href="#apply"], .cta-band a.btn--accent[href="#apply"]').forEach(function (a) { a.textContent = 'Check My Interview Bottleneck →'; });
    var premiumFinalCopy = document.querySelector('.cta-band p');
    if (premiumFinalCopy) premiumFinalCopy.textContent = 'If you are already getting interviews, start with the evidence. Complete the Senior Interview Conversion Check and let the diagnosis determine whether Premium 1:1 is the right intervention.';
  }

  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }
})();