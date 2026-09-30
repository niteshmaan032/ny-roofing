/* ==========================================================================
   CTA selection — preview layer for ctaselection.html only.

   Builds a floating "Select CTA's" button and a drawer of the uiverse.io
   designs the client supplied, plus a shaped set and a professional set. Choosing one puts
   `cta-themed cta-NN` on every CTA in the page, so the client sees the design
   in place rather than in a swatch. Nothing is stored: "Reset" and a refresh
   both put the page back to its own button design.

   nyroofing.html does not load this file.
   ========================================================================== */
(function () {
  'use strict';

  /* Every CTA on the page. The drawer's own previews are excluded: they carry
     the theme classes but never .btn. */
  var TARGET_SELECTOR = '.btn, .quote__submit';

  /* The twenty designs, in the order they were supplied, each credited to its
     uiverse.io author. */
  var STYLES = [
    { n:  1, name: 'Split Skew',       author: 'Ali-Tahmazi99' },
    { n:  2, name: 'Diagonal Reveal',  author: 'doniaskima' },
    { n:  3, name: 'Letter Roll',      author: 'KINGFRESS' },
    { n:  4, name: 'Gradient Sweep',   author: 'Madflows' },
    { n:  5, name: 'Skew Meet',        author: 'nikk7007' },
    { n:  6, name: 'Wipe Left',        author: 'abrahamcalsin' },
    { n:  7, name: 'Bubble Rise',      author: 'cssbuttons-io' },
    { n:  8, name: 'Panel Sweep',      author: 'doniaskima' },
    { n:  9, name: 'Border Draw',      author: 'Nawsome' },
    { n: 10, name: 'Shutter',          author: 'TISEPSE' },
    { n: 11, name: 'Corner Bloom',     author: 'yaasiinaxmed' },
    { n: 12, name: 'Cut Corner',       author: 'niat786' },
    { n: 13, name: 'Corner Flyout',    author: 'Itskrish01' },
    { n: 14, name: 'Skew Fill',        author: 'mrhyddenn' },
    { n: 15, name: 'Circle Swell',     author: 'nathAd17' },
    { n: 16, name: 'Hard Shadow Skew', author: 'mobinkakei' },
    { n: 17, name: 'Skew Grow',        author: 'SujitAdroja' },

    { n: 18, name: 'Ticket Notch',     set: 'shaped' },

    /* Professional set: restrained, for a business-first look. */
    { n: 19, name: 'Split Action',     set: 'professional' },
    { n: 20, name: 'Fine Rule',        set: 'professional' },
    { n: 21, name: 'Elevated Ink',     set: 'professional' },

    /* Custom set: an edge treatment, a travelling outline, an ambient ring. */
    { n: 22, name: 'Gradient Edge',    set: 'custom' },
    { n: 23, name: 'Marching Dashes',  set: 'custom' },
    { n: 24, name: 'Ripple Out',       set: 'custom' }
  ];

  function classOf(style) { return 'cta-' + String(style.n).padStart(2, '0'); }

  var targets = Array.prototype.slice.call(document.querySelectorAll(TARGET_SELECTOR));
  if (!targets.length) return;

  /* ---- Structure ---------------------------------------------------------
     The page has two kinds of CTA: .btn wraps its label in .btn__text, while
     .quote__submit has a bare label span. Several of these designs need a
     container to clip against and the label text as an attribute, so both
     kinds are normalised to .cta-wrap > .cta-text once, up front. */

  function normalise(el) {
    var wrap = el.querySelector('.btn__text');
    var text = el.querySelector('.btn__number') || el.querySelector('.quote__submit-label');
    if (!text) return;

    if (!wrap) {
      wrap = document.createElement('span');
      wrap.className = 'cta-wrap';
      text.parentNode.insertBefore(wrap, text);
      wrap.appendChild(text);
    }

    wrap.classList.add('cta-wrap');
    text.classList.add('cta-text');

    var label = text.textContent.trim();
    wrap.setAttribute('data-cta-label', label);
    text.setAttribute('data-cta-label', label);
  }

  targets.forEach(normalise);

  var current = null;
  var lastFocus = null;

  /* ---- Applying ---------------------------------------------------------- */

  function apply(style) {
    targets.forEach(function (el) {
      // Drop whatever was on before, then dress with the new one.
      Array.prototype.slice.call(el.classList).forEach(function (name) {
        if (/^cta-\d\d$/.test(name)) el.classList.remove(name);
      });
      if (style) {
        el.classList.add('cta-themed', classOf(style));
      } else {
        el.classList.remove('cta-themed');
      }
    });

    current = style;
    paintSelection();
  }

  /* ---- Building the picker ----------------------------------------------- */

  var fab = document.createElement('button');
  fab.className = 'ctafab';
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.innerHTML =
    '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>' +
    '<span class="ctafab__text">Select CTA&rsquo;s</span>' +
    '<span class="ctafab__count">' + STYLES.length + '</span>';

  var panel = document.createElement('div');
  panel.className = 'ctapanel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="ctapanel__scrim" data-cta-close></div>' +
    '<div class="ctapanel__sheet" role="dialog" aria-modal="true" aria-label="Choose a CTA style">' +
      '<div class="ctapanel__head">' +
        '<div>' +
          '<h2 class="ctapanel__title">Choose a CTA style</h2>' +
          '<p class="ctapanel__sub">Seventeen designs from uiverse.io plus three in-house sets, in the NY Roofing colours. ' +
            'Pick one and it is applied to every button on this page straight away.</p>' +
        '</div>' +
        '<button class="ctapanel__close" type="button" data-cta-close aria-label="Close">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
      '</div>' +
      '<div class="ctapanel__list"></div>' +
      '<div class="ctapanel__foot">' +
        '<p class="ctapanel__current"></p>' +
        '<button class="ctapanel__reset" type="button">Reset</button>' +
      '</div>' +
    '</div>';

  var toast = document.createElement('div');
  toast.className = 'ctatoast';
  toast.setAttribute('role', 'status');

  document.body.appendChild(fab);
  document.body.appendChild(panel);
  document.body.appendChild(toast);

  var list = panel.querySelector('.ctapanel__list');
  var footText = panel.querySelector('.ctapanel__current');
  var resetBtn = panel.querySelector('.ctapanel__reset');

  var DEMO_LABEL = 'Get Free Estimate';

  STYLES.forEach(function (style) {
    var card = document.createElement('button');
    card.className = 'ctacard';
    card.type = 'button';
    card.dataset.n = String(style.n);
    card.innerHTML =
      '<span class="ctacard__stage">' +
        '<span class="cta-themed ' + classOf(style) + '">' +
          '<span class="btn__pip" aria-hidden="true"><i class="fa-solid fa-phone"></i></span>' +
          '<span class="cta-wrap" data-cta-label="' + DEMO_LABEL + '">' +
            '<span class="cta-text" data-cta-label="' + DEMO_LABEL + '">' + DEMO_LABEL + '</span>' +
          '</span>' +
        '</span>' +
      '</span>' +
      '<span class="ctacard__name">' + style.name +
        '<span class="ctacard__meta">Style ' + String(style.n).padStart(2, '0') +
          ' &middot; ' + (style.author ? 'by ' + style.author : style.set + ' set') + '</span>' +
      '</span>' +
      '<span class="ctacard__tick" aria-hidden="true"><i class="fa-solid fa-check"></i></span>';
    card.addEventListener('click', function () {
      apply(style);
      showToast(style.name + ' applied');
    });
    list.appendChild(card);
  });

  function paintSelection() {
    list.querySelectorAll('.ctacard').forEach(function (card) {
      var on = Boolean(current) && Number(card.dataset.n) === current.n;
      card.classList.toggle('is-selected', on);
      card.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    footText.innerHTML = current
      ? '<strong>' + current.name + '</strong><code>.' + classOf(current) +
          (current.author ? ' &middot; by ' + current.author : '') + '</code>'
      : '<strong>Site default</strong><code>the page&rsquo;s own button</code>';
  }

  var toastTimer = null;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 1800);
  }

  /* ---- Open and close ---------------------------------------------------- */

  function open() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    panel.querySelector('.ctapanel__close').focus();
  }

  function close() {
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  fab.addEventListener('click', open);
  panel.querySelectorAll('[data-cta-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) close();
  });
  resetBtn.addEventListener('click', function () {
    apply(null);
    showToast('Back to the site default');
  });

  paintSelection();

}());
