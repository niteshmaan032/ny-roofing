/* NY Roofing: Blog page (nyroofing4-blog.html). Loaded after js/nyroofing4.js.
   Topic chips + search filter the article grid. With no filter, the featured
   article shows on its own and the grid shows the first nine posts behind a
   "Show more" button; any filter or search hides the featured block and lists
   every match (the featured post included) in the grid. */
(function () {
  'use strict';

  var grid = document.querySelector('[data-blog-grid]');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.bpost'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.btopics__chip[data-filter]'));
  var featured = document.querySelector('[data-featured-section]');
  var count = document.querySelector('[data-blog-count]');
  var empty = document.querySelector('[data-blog-empty]');
  var moreBtn = document.querySelector('[data-blog-more]');
  var moreWrap = moreBtn ? moreBtn.parentNode : null;
  var input = document.getElementById('blog-search');
  var clearBtn = document.querySelector('.bsearch__clear');
  var reset = document.querySelector('[data-blog-reset]');
  var total = cards.length;

  var state = { topic: 'all', query: '', expanded: false };

  function words(q) {
    return q.toLowerCase().replace(/[^a-z0-9&\- ]+/g, ' ').split(/\s+/).filter(Boolean);
  }

  function render() {
    var q = words(state.query);
    var filtering = state.topic !== 'all' || q.length > 0;
    var shown = 0;

    cards.forEach(function (card) {
      var isFeatured = card.hasAttribute('data-featured');
      var show;
      if (!filtering) {
        show = !isFeatured && (state.expanded || !card.hasAttribute('data-more'));
      } else {
        var hay = card.getAttribute('data-search') || '';
        var topicOk = state.topic === 'all' || card.getAttribute('data-topic') === state.topic;
        var textOk = q.every(function (w) { return hay.indexOf(w) !== -1; });
        show = topicOk && textOk;
      }
      card.hidden = !show;
      if (show) shown += 1;
    });

    if (featured) featured.hidden = filtering;
    if (empty) empty.hidden = shown > 0;
    if (moreWrap) moreWrap.hidden = filtering || state.expanded;

    if (count) {
      if (!filtering) count.innerHTML = '<strong>' + total + '</strong> articles in <strong>' + (chips.length - 1) + '</strong> topics';
      else count.innerHTML = 'Showing <strong>' + shown + '</strong> of <strong>' + total + '</strong> articles';
    }
    if (clearBtn) clearBtn.hidden = state.query.length === 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      state.topic = chip.getAttribute('data-filter');
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      render();
    });
  });

  if (input) {
    input.addEventListener('input', function () {
      state.query = input.value.trim();
      render();
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        var list = document.getElementById('articles');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      state.query = '';
      render();
      input.focus();
    });
  }

  if (reset) {
    reset.addEventListener('click', function () {
      if (input) input.value = '';
      state.query = '';
      state.topic = 'all';
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-filter') === 'all' ? 'true' : 'false'); });
      render();
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener('click', function () {
      var firstNew = grid.querySelector('.bpost[data-more]');
      state.expanded = true;
      render();
      // Move focus to the first newly shown article for keyboard users.
      var link = firstNew && firstNew.querySelector('a');
      if (link) link.focus({ preventScroll: true });
    });
  }

  render();
})();
