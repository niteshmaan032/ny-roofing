/* NY Roofing — header behaviour.
   Self-contained: dropdowns, the scrolled state, and the mobile drawer.
   Nothing here touches main.js, which still drives index/nyc2. */

(function () {
  'use strict';

  /* Must stay in lockstep with the `min-width: 80em` block in nyroofing.css.
     If they drift, hover opens panels the stylesheet has already hidden. */
  var DESKTOP = window.matchMedia('(min-width: 80em)');


  /* Scrolled state — lifts the bar off the page with a shadow. ------------- */

  (function scrolled() {
    var header = document.getElementById('site-header');
    if (!header) return;

    // The class only paints a shadow now — nothing collapses, so the document
    // height never changes and the old 80px of anti-flicker hysteresis is no
    // longer load-bearing. A few pixels of gap is enough to settle the toggle
    // at the very top of the page.
    var ON = 24;
    var OFF = 8;
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.scrollY;
      if (y > ON) header.classList.add('is-scrolled');
      else if (y < OFF) header.classList.remove('is-scrolled');
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }());


  /* Desktop dropdowns ------------------------------------------------------ */

  (function menus() {
    var triggers = Array.prototype.slice.call(
      document.querySelectorAll('.primary-nav__link[aria-controls]')
    );
    if (!triggers.length) return;

    function panelOf(trigger) {
      return document.getElementById(trigger.getAttribute('aria-controls'));
    }

    function close(trigger) {
      var panel = panelOf(trigger);
      if (!panel) return;
      trigger.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');

      // Wait out the fade before re-hiding, so the panel does not vanish on
      // the first frame of its own exit transition.
      var done = function () {
        if (trigger.getAttribute('aria-expanded') === 'false') panel.hidden = true;
        panel.removeEventListener('transitionend', done);
      };
      panel.addEventListener('transitionend', done);
      window.setTimeout(done, 400);
    }

    function closeAll(except) {
      triggers.forEach(function (t) {
        if (t !== except && t.getAttribute('aria-expanded') === 'true') close(t);
      });
    }

    function open(trigger) {
      var panel = panelOf(trigger);
      if (!panel) return;
      closeAll(trigger);
      panel.hidden = false;
      // Unhiding and adding the class in the same frame gives the transition
      // no start state to move from, so the panel would just pop in.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { panel.classList.add('is-open'); });
      });
      trigger.setAttribute('aria-expanded', 'true');
    }

    triggers.forEach(function (trigger) {
      var item = trigger.closest('.primary-nav__item');
      var hoverTimer;

      trigger.addEventListener('click', function () {
        if (trigger.getAttribute('aria-expanded') === 'true') close(trigger);
        else open(trigger);
      });

      if (!item) return;

      item.addEventListener('mouseenter', function () {
        if (!DESKTOP.matches) return;
        window.clearTimeout(hoverTimer);
        open(trigger);
      });

      // A grace period covers the gap between trigger and panel, and forgives
      // a cursor that clips a neighbouring item on the way down.
      item.addEventListener('mouseleave', function () {
        if (!DESKTOP.matches) return;
        hoverTimer = window.setTimeout(function () { close(trigger); }, 180);
      });

      var panel = panelOf(trigger);
      if (panel) {
        panel.addEventListener('mouseenter', function () { window.clearTimeout(hoverTimer); });
        panel.addEventListener('mouseleave', function () {
          if (!DESKTOP.matches) return;
          hoverTimer = window.setTimeout(function () { close(trigger); }, 180);
        });
      }
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('.primary-nav__item--menu')) closeAll();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      triggers.forEach(function (t) {
        if (t.getAttribute('aria-expanded') === 'true') {
          close(t);
          t.focus();
        }
      });
    });

    // Focus leaving the item entirely — tabbing past the last panel link.
    document.addEventListener('focusin', function (event) {
      triggers.forEach(function (t) {
        if (t.getAttribute('aria-expanded') !== 'true') return;
        var item = t.closest('.primary-nav__item');
        if (item && !item.contains(event.target)) close(t);
      });
    });

    DESKTOP.addEventListener('change', function () { closeAll(); });
  }());


  /* Mobile drawer ---------------------------------------------------------- */

  (function drawer() {
    var root = document.getElementById('mobile-nav');
    var toggle = document.querySelector('.nav-toggle');
    if (!root || !toggle) return;

    var panel = root.querySelector('.mobile-nav__panel');
    var closeBtn = root.querySelector('.mobile-nav__close');
    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      root.hidden = false;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { root.classList.add('is-open'); });
      });
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      root.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');

      var done = function () {
        if (!root.classList.contains('is-open')) root.hidden = true;
        panel.removeEventListener('transitionend', done);
      };
      panel.addEventListener('transitionend', done);
      window.setTimeout(done, 400);

      if (lastFocus) lastFocus.focus();
    }

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    // Clicks on the scrim, not the panel.
    root.addEventListener('click', function (event) {
      if (event.target === root) close();
    });

    root.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { close(); return; }
      if (event.key !== 'Tab') return;

      var focusables = panel.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // Following an in-page link should reveal the section, not the drawer.
    root.querySelectorAll('a[href]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (link.getAttribute('href').indexOf('tel:') !== 0) close();
      });
    });

    // Accordions
    root.querySelectorAll('.mobile-nav__group').forEach(function (group) {
      var trigger = group.querySelector('.mobile-nav__trigger');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        var expanded = group.getAttribute('aria-expanded') === 'true';
        group.setAttribute('aria-expanded', String(!expanded));
      });
    });

    // Widening past the breakpoint leaves an unreachable open drawer behind.
    DESKTOP.addEventListener('change', function (event) {
      if (event.matches && !root.hidden) close();
    });
  }());



  /* Hero video ------------------------------------------------------------- */

  (function backgroundVideos() {
    var videos = Array.prototype.slice.call(
      document.querySelectorAll('#hero-video, #cta-band-video'));
    if (!videos.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    videos.forEach(function (video) {

    function play() {
      if (reduced.matches) return;
      // Autoplay can still be refused (low power mode, data saver); swallowing
      // the rejection keeps the console clean and leaves the poster showing.
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    // No visible control any more, so this preference is the only way a viewer
    // who needs stillness gets it — the poster frame carries the hero instead.
    if (reduced.matches) {
      video.removeAttribute('autoplay');
      video.pause();
    }

    reduced.addEventListener('change', function (event) {
      if (event.matches) video.pause();
      else play();
    });

    // Decoding a video nobody can see is wasted battery.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) play();
          else video.pause();
        });
      }, { threshold: 0.15 }).observe(video);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause();
      else play();
    });
    });
  }());


  /* Quote form ------------------------------------------------------------- */

  (function quoteForm() {
    var form = document.getElementById('quote-form');
    var done = document.getElementById('quote-done');
    if (!form || !done) return;

    // Kept to a few words each: these render on one line in the gap above the
    // next field, so anything longer would truncate rather than wrap.
    var MESSAGES = {
      'q-name': 'Enter your name',
      'q-phone': 'Enter your phone number',
      'q-email': 'Enter your email',
      'q-address': 'Enter the property address'
    };

    function fieldOf(input) { return input.closest('.field'); }

    function errorOf(input) {
      return form.querySelector('[data-error-for="' + input.id + '"]');
    }

    function setError(input, message) {
      var wrap = fieldOf(input);
      var slot = errorOf(input);
      if (!wrap || !slot) return;
      wrap.classList.toggle('is-invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      slot.textContent = message || '';
      slot.hidden = !message;
    }

    function validate(input) {
      var value = (input.value || '').trim();
      var message = '';
      if (!value) message = MESSAGES[input.id] || 'Required';
      // Loose on purpose: NYC numbers arrive in a dozen shapes and rejecting a
      // real one costs far more than accepting a typo an estimator can fix.
      else if (input.type === 'tel' && value.replace(/\D/g, '').length < 10) {
        message = 'Include the area code';
      }
      // Deliberately not a strict RFC pattern: the only failure worth catching
      // here is a missing @ or domain, and stricter rules reject valid addresses.
      else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = 'Enter a valid email';
      }
      setError(input, message);
      return !message;
    }

    var inputs = Array.prototype.slice.call(
      form.querySelectorAll('input[required], select[required]')
    );

    inputs.forEach(function (input) {
      // Validate on the way out, then live once it has already failed — so
      // nobody is scolded mid-word on their first attempt.
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input).classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstBad = null;
      inputs.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });

      if (firstBad) { firstBad.focus(); return; }

      // No endpoint is wired yet — POST the collected values from here.
      form.hidden = true;
      done.hidden = false;
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  }());






  /* Stat counters ----------------------------------------------------------- */

  (function statCounters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll('.stats-strip__num[data-count]'));
    if (!nums.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Thousands separator, so 1158 reads as 1,158 both mid-count and at rest.
    function format(n, el) {
      return n.toLocaleString('en-US') + (el.getAttribute('data-suffix') || '');
    }

    function settle(el) {
      el.textContent = format(parseInt(el.getAttribute('data-count'), 10), el);
    }

    function animate(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var start = null;
      var DURATION = 1100;

      function frame(ts) {
        if (!start) start = ts;
        var t = Math.min((ts - start) / DURATION, 1);
        // ease-out cubic, so the count lands softly instead of stopping dead
        var eased = 1 - Math.pow(1 - t, 3);
        el.textContent = format(Math.round(target * eased), el);
        if (t < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    if (reduced.matches || !('IntersectionObserver' in window)) {
      nums.forEach(settle);
      return;
    }

    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        // requestAnimationFrame is throttled to a standstill in a background
        // tab, so animating there would leave the number frozen at 0 for
        // anyone who opens the page in a tab and switches to it later. When
        // the document is hidden there is nothing to watch anyway — settle it.
        if (document.hidden) settle(entry.target);
        else animate(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach(function (el) { io.observe(el); });

    // Backstop: anything counted-as-seen while hidden gets its final value the
    // moment the tab is actually looked at.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) return;
      nums.forEach(function (el) {
        if (seen.has(el) && el.textContent.trim() !== format(parseInt(el.getAttribute('data-count'), 10), el)) {
          settle(el);
        }
      });
    });
  }());


  /* Carousels ---------------------------------------------------------------- */

  /* Both scripts are deferred, so Swiper is defined by the time this runs;
     the guard covers the CDN failing rather than a race. */
  (function sliders() {
    if (typeof window.Swiper !== 'function') return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var testi = document.querySelector('.testi-swiper');
    if (testi) {
      new window.Swiper(testi, {
        slidesPerView: 1,
        spaceBetween: 24,
        speed: reduced ? 0 : 450,
        navigation: {
          prevEl: '.testi__prev',
          nextEl: '.testi__next'
        },
        breakpoints: {
          640: { slidesPerView: 2 },
          1100: { slidesPerView: 3 }
        }
      });
    }

    var blog = document.querySelector('.blog-swiper');
    if (blog) {
      new window.Swiper(blog, {
        slidesPerView: 1,
        spaceBetween: 24,
        speed: reduced ? 0 : 450,
        navigation: {
          prevEl: '.blog__prev',
          nextEl: '.blog__next'
        },
        breakpoints: {
          640: { slidesPerView: 2 },
          1100: { slidesPerView: 3 }
        }
      });
    }
  }());


  /* Contact form ------------------------------------------------------------ */

  (function contactForm() {
    var form = document.getElementById('contact-form');
    var done = document.getElementById('contact-done');
    if (!form || !done) return;

    var MESSAGES = {
      'c-name': 'Enter your name',
      'c-phone': 'Enter your phone number',
      'c-email': 'Enter your email',
      'c-address': 'Enter the property address'
    };

    function fieldOf(input) { return input.closest('.field'); }

    function errorOf(input) {
      return form.querySelector('[data-error-for="' + input.id + '"]');
    }

    function setError(input, message) {
      var wrap = fieldOf(input);
      var slot = errorOf(input);
      if (!wrap || !slot) return;
      wrap.classList.toggle('is-invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      slot.textContent = message || '';
      slot.hidden = !message;
    }

    function validate(input) {
      var value = (input.value || '').trim();
      var message = '';
      if (!value) message = MESSAGES[input.id] || 'Required';
      else if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = 'Enter a valid email';
      }
      setError(input, message);
      return !message;
    }

    var inputs = Array.prototype.slice.call(
      form.querySelectorAll('input[required], select[required]')
    );

    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input).classList.contains('is-invalid')) validate(input);
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstBad = null;
      inputs.forEach(function (input) {
        if (!validate(input) && !firstBad) firstBad = input;
      });

      if (firstBad) { firstBad.focus(); return; }

      // No endpoint is wired yet — POST the collected values from here.
      form.hidden = true;
      done.hidden = false;
      done.setAttribute('tabindex', '-1');
      done.focus();
    });
  }());



  /* Roofing systems picker — a plain tab list. Click or arrow between the
     tabs; only the chosen panel is in the document's flow. */
  (function () {
    var root = document.querySelector('[data-systab]');
    if (!root) return;

    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        if (panels[i]) panels[i].hidden = !on;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });
  }());

}());
