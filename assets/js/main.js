/* SHIFT MEDIA — interactions: album cards, album popup (justified mosaic), photo viewer, contribution badge. */
(function () {
  'use strict';

  var ICON_CLOSE = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>';
  var ICON_PREV = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 9H3M8 4L3 9l5 5"/></svg>';
  var ICON_NEXT = '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h12M10 4l5 5-5 5"/></svg>';

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  /* ---------- Contribution badge: tap to reveal on touch screens ---------- */
  document.querySelectorAll('.card--contribution .badge').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var card = b.closest('.card--contribution');
      var open = card.classList.toggle('is-open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); }
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.card--contribution.is-open').forEach(function (c) {
      if (!c.contains(e.target)) c.classList.remove('is-open');
    });
  });

  /* ---------- Photography page ---------- */
  var albums = window.SHIFT_ALBUMS;
  var grid = document.getElementById('album-grid');
  if (!albums || !grid) return;

  function cardHTML(a, featured) {
    return '<img class="card__img" src="' + esc(a.cover) + '" alt="" loading="' + (featured ? 'eager' : 'lazy') + '">' +
      '<span class="album-info"><span class="album-info__title">' + esc(a.title) + '</span>' +
      '<span class="album-info__text">' + esc(a.detail || '') + '</span></span>' +
      '<span class="card__label"><span class="card__title">' + esc(a.short || a.title) + '</span>' +
      '<span class="card__cue">' + (featured ? 'View album →' : '→') + '</span></span>';
  }


  var ordered = albums.filter(function (a) { return a.featured; }).concat(albums.filter(function (a) { return !a.featured; }));
  grid.dataset.count = String(ordered.length);
  ordered.forEach(function (a) {
    var b = el('button', 'card album-card' + (a.featured ? ' album-card--featured' : ''), cardHTML(a, a.featured));
    b.type = 'button';
    b.setAttribute('aria-label', 'Open album ' + a.title);
    b.addEventListener('click', function () { openAlbum(a); });
    grid.appendChild(b);
  });

  /* ---------- Album popup ---------- */
  var modal = el('div', 'modal');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML =
    '<div class="modal__panel">' +
    '<div class="modal__head"><div><h2 class="modal__title"></h2><p class="modal__meta"></p></div>' +
    '<button class="round-btn modal__close" type="button" aria-label="Close album">' + ICON_CLOSE + '</button></div>' +
    '<div class="modal__scroll"><div class="mosaic"></div></div></div>';
  document.body.appendChild(modal);
  var mosaic = modal.querySelector('.mosaic');
  var scroller = modal.querySelector('.modal__scroll');
  var current = null;
  var lastFocus = null;

  modal.querySelector('.modal__close').addEventListener('click', closeAlbum);

  function openAlbum(a) {
    current = a;
    lastFocus = document.activeElement;
    modal.querySelector('.modal__title').textContent = a.title;
    modal.querySelector('.modal__meta').textContent = a.photos.length + ' photos · ' + a.year;
    modal.classList.add('is-open');
    document.body.classList.add('no-scroll');
    scroller.scrollTop = 0;
    layout();
    modal.querySelector('.modal__close').focus();
  }
  function closeAlbum() {
    modal.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    current = null;
    if (lastFocus) lastFocus.focus();
  }

  /* Justified rows: every row fills the full width, photos keep their proportions, no gaps. */
  function rows(photos, width, gap, target) {
    var a = photos.map(function (p) { return p.w / p.h; });
    var n = a.length, maxPerRow = width < 500 ? 3 : 7;
    var dp = [0], br = [0];
    for (var i = 1; i <= n; i++) {
      dp[i] = Infinity;
      for (var j = Math.max(0, i - maxPerRow); j < i; j++) {
        var S = 0;
        for (var k = j; k < i; k++) S += a[k];
        var m = i - j, h = (width - gap * (m - 1)) / S;
        var c = (h - target) * (h - target) * m;
        if (h > target * 1.7) c += 1e7;
        if (h < target * 0.5) c += 1e6;
        if (dp[j] + c < dp[i]) { dp[i] = dp[j] + c; br[i] = j; }
      }
    }
    var out = [], e = n;
    while (e > 0) { out.unshift([br[e], e]); e = br[e]; }
    return out.map(function (r) { return photos.slice(r[0], r[1]); });
  }

  function layout() {
    if (!current) return;
    var width = Math.floor(mosaic.clientWidth) - 1;
    var vw = window.innerWidth;
    var gap = vw < 640 ? 8 : 12;
    var target = vw < 640 ? 150 : vw < 1024 ? 190 : 230;
    mosaic.innerHTML = '';
    var index = 0;
    rows(current.photos, width, gap, target).forEach(function (r) {
      var S = r.reduce(function (s, p) { return s + p.w / p.h; }, 0);
      var h = (width - gap * (r.length - 1)) / S;
      var row = el('div', 'mosaic__row');
      r.forEach(function (p) {
        var i = index++;
        var t = el('button', 'mosaic__tile');
        t.type = 'button';
        t.style.width = (h * p.w / p.h) + 'px';
        t.style.height = h + 'px';
        t.setAttribute('aria-label', 'View photo ' + (i + 1));
        t.innerHTML = '<img src="' + esc(p.src) + '" alt="" loading="lazy">';
        t.addEventListener('click', function () { openViewer(i); });
        row.appendChild(t);
      });
      mosaic.appendChild(row);
    });
  }
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });

  /* ---------- Photo viewer ---------- */
  var viewer = el('div', 'viewer');
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.innerHTML =
    '<img class="viewer__img" alt="">' +
    '<div class="viewer__top"><div><p class="viewer__album"></p><p class="viewer__count"></p></div>' +
    '<button class="ghost-btn viewer__close" type="button" aria-label="Close photo">' + ICON_CLOSE + '</button></div>' +
    '<button class="ghost-btn viewer__nav viewer__prev" type="button" aria-label="Previous photo">' + ICON_PREV + '</button>' +
    '<button class="ghost-btn viewer__nav viewer__next" type="button" aria-label="Next photo">' + ICON_NEXT + '</button>';
  document.body.appendChild(viewer);
  var vImg = viewer.querySelector('.viewer__img');
  var vIndex = 0;

  function show(i) {
    var n = current.photos.length;
    vIndex = (i + n) % n;
    vImg.src = current.photos[vIndex].src;
    viewer.querySelector('.viewer__album').textContent = current.title;
    viewer.querySelector('.viewer__count').textContent = (vIndex + 1) + ' / ' + n;
    [vIndex + 1, vIndex - 1].forEach(function (k) { var im = new Image(); im.src = current.photos[(k + n) % n].src; });
  }
  function openViewer(i) {
    show(i);
    viewer.classList.add('is-open');
    viewer.querySelector('.viewer__close').focus();
  }
  function closeViewer() {
    viewer.classList.remove('is-open');
    var tiles = mosaic.querySelectorAll('.mosaic__tile');
    if (tiles[vIndex]) tiles[vIndex].focus();
  }
  viewer.querySelector('.viewer__close').addEventListener('click', closeViewer);
  viewer.querySelector('.viewer__prev').addEventListener('click', function () { show(vIndex - 1); });
  viewer.querySelector('.viewer__next').addEventListener('click', function () { show(vIndex + 1); });

  document.addEventListener('keydown', function (e) {
    if (!viewer.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft') show(vIndex - 1);
    else if (e.key === 'ArrowRight') show(vIndex + 1);
    else if (e.key === 'Escape') closeViewer();
  });

  var sx = null, sy = null;
  viewer.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  viewer.addEventListener('touchend', function (e) {
    if (sx == null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(vIndex + (dx < 0 ? 1 : -1));
    sx = sy = null;
  });
})();
