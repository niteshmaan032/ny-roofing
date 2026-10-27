/* NY Roofing: Flat Roofing page (nyroofing4-flat-roofing.html).
   Lightbox for the "Recent Flat Roofs" gallery: any photo opens larger in a
   native <dialog> (focus stays inside, Esc closes, focus returns to the photo
   that opened it). Prev/next buttons and the arrow keys step through the six
   photos. Everything else on the page runs on the shared js/nyroofing4.js. */
(function () {
  'use strict';

  var gallery = document.querySelector('[data-fr-gallery]');
  var dlg = document.getElementById('fr-lightbox');
  if (!gallery || !dlg || typeof dlg.showModal !== 'function') return;

  var items = Array.prototype.slice.call(gallery.querySelectorAll('.fr-work__open'));
  var img = dlg.querySelector('[data-lb-img]');
  var tag = dlg.querySelector('[data-lb-tag]');
  var title = dlg.querySelector('[data-lb-title]');
  var count = dlg.querySelector('[data-lb-count]');
  var index = 0;
  var opener = null;

  function text(el, sel) {
    var found = el.querySelector(sel);
    return found ? found.textContent.trim() : '';
  }

  function show(i) {
    index = (i + items.length) % items.length;
    var item = items[index];
    var thumb = item.querySelector('img');
    img.src = item.getAttribute('data-full') || thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    tag.textContent = text(item, '.fr-work__tag');
    title.textContent = text(item, '.fr-work__title');
    count.textContent = (index + 1) + ' / ' + items.length;
    // Warm the next photo so stepping feels instant.
    var next = items[(index + 1) % items.length];
    if (next) { var pre = new Image(); pre.src = next.getAttribute('data-full'); }
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () {
      opener = item;
      show(i);
      dlg.showModal();
      document.documentElement.classList.add('fr-lb-open');
    });
  });

  dlg.querySelector('[data-lb-prev]').addEventListener('click', function () { show(index - 1); });
  dlg.querySelector('[data-lb-next]').addEventListener('click', function () { show(index + 1); });
  dlg.querySelector('[data-lb-close]').addEventListener('click', function () { dlg.close(); });

  dlg.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
  });

  // A click on the dark backdrop (outside the photo panel) closes it.
  dlg.addEventListener('click', function (event) {
    if (event.target === dlg) dlg.close();
  });

  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('fr-lb-open');
    if (opener) opener.focus();
  });
}());
