/* NY Roofing: Projects page (nyroofing4-projects.html).
   1. Filter chips + pagination: six cards per page; the count line and the
      page buttons follow the current filter.
   2. Lightbox: any card opens its photo larger in a native <dialog>
      (focus stays inside, Esc closes, focus returns to what opened it).
      Prev/next and the arrow keys step through every card in the filter. */
(function () {
  'use strict';

  var grid = document.querySelector('[data-pj-grid]');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.pj-card[data-service]'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.pj-chip[data-filter]'));
  var countEl = document.querySelector('[data-pj-count]');

  /* 1. Filter + pages (six cards per page) ------------------------------- */

  var PER_PAGE = 6;
  var pager = document.querySelector('[data-pj-pager]');
  var gallery = document.getElementById('gallery');
  var filter = 'all';
  var page = 1;

  function matching() {
    return cards.filter(function (card) {
      return filter === 'all' || card.getAttribute('data-service') === filter;
    });
  }

  function pagerButton(html, label, target, opts) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pj-pager__btn' + (opts.step ? ' pj-pager__btn--step' : '');
    b.innerHTML = html;
    b.setAttribute('aria-label', label);
    if (opts.current) b.setAttribute('aria-current', 'page');
    if (opts.disabled) b.disabled = true;
    b.addEventListener('click', function () { render(target, true); });
    return b;
  }

  function render(newPage, scroll) {
    var list = matching();
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    page = Math.min(Math.max(1, newPage), pages);
    var from = (page - 1) * PER_PAGE;
    var to = Math.min(from + PER_PAGE, list.length);

    cards.forEach(function (card) { card.hidden = true; });
    list.slice(from, to).forEach(function (card) { card.hidden = false; });

    if (countEl) {
      countEl.textContent = list.length <= PER_PAGE
        ? (filter === 'all' ? 'Showing all ' + list.length + ' projects' : 'Showing ' + list.length + ' of ' + cards.length + ' projects')
        : 'Showing ' + (from + 1) + '\u2013' + to + ' of ' + list.length + ' projects';
    }

    if (pager) {
      pager.innerHTML = '';
      pager.hidden = pages < 2;
      if (pages > 1) {
        pager.appendChild(pagerButton('<i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>Previous</span>', 'Previous page', page - 1, { step: true, disabled: page === 1 }));
        for (var n = 1; n <= pages; n++) {
          pager.appendChild(pagerButton(String(n), 'Page ' + n, n, { current: n === page }));
        }
        pager.appendChild(pagerButton('<span>Next</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i>', 'Next page', page + 1, { step: true, disabled: page === pages }));
      }
    }

    if (scroll && gallery) {
      var top = gallery.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      filter = chip.getAttribute('data-filter');
      chips.forEach(function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      render(1, false);
    });
  });
  render(1, false);

  /* 2. Lightbox ------------------------------------------------------------- */

  var dlg = document.getElementById('pj-lightbox');
  if (!dlg || typeof dlg.showModal !== 'function') return;

  var img = dlg.querySelector('[data-lb-img]');
  var tag = dlg.querySelector('[data-lb-tag]');
  var title = dlg.querySelector('[data-lb-title]');
  var scope = dlg.querySelector('[data-lb-scope]');
  var roof = dlg.querySelector('[data-lb-roof]');
  var count = dlg.querySelector('[data-lb-count]');
  var prev = dlg.querySelector('[data-lb-prev]');
  var next = dlg.querySelector('[data-lb-next]');
  var closeBtn = dlg.querySelector('[data-lb-close]');

  var list = [];
  var index = 0;
  var opener = null;

  function text(card, sel) {
    var el = card.querySelector(sel);
    return el ? el.textContent.trim() : '';
  }

  function preload(card) {
    if (!card) return;
    var i = new Image();
    i.src = card.getAttribute('data-full');
  }

  function show(i) {
    index = (i + list.length) % list.length;
    var card = list[index];
    var thumb = card.querySelector('.pj-card__media img');
    img.src = card.getAttribute('data-full') || thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    tag.textContent = text(card, '.pj-tag');
    title.textContent = text(card, '.pj-card__open');
    scope.textContent = text(card, '.pj-card__scope');
    roof.textContent = text(card, '[data-roof]');
    count.textContent = 'Photo ' + (index + 1) + ' of ' + list.length;
    var single = list.length < 2;
    prev.hidden = single;
    next.hidden = single;
    if (!single) {
      preload(list[(index + 1) % list.length]);
      preload(list[(index - 1 + list.length) % list.length]);
    }
  }

  function open(card, from) {
    // Step through every card in the current filter, across pages.
    list = matching();
    if (list.indexOf(card) === -1) list = cards.slice();
    opener = from || null;
    show(list.indexOf(card));
    dlg.showModal();
    document.documentElement.classList.add('pj-lb-open');
    closeBtn.focus();
  }

  cards.forEach(function (card) {
    var btn = card.querySelector('.pj-card__open');
    if (btn) btn.addEventListener('click', function () { open(card, btn); });
  });

  prev.addEventListener('click', function () { show(index - 1); });
  next.addEventListener('click', function () { show(index + 1); });
  closeBtn.addEventListener('click', function () { dlg.close(); });

  dlg.addEventListener('keydown', function (e) {
    if (list.length < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });

  // A click on the backdrop (the dialog box itself, outside the panel) closes.
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) dlg.close();
  });

  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('pj-lb-open');
    if (opener && document.contains(opener)) opener.focus();
  });
})();
