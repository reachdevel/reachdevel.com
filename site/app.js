/* reachdevel.com — reads projects.json and renders the page.
   No framework. Edit projects.json to change content. */
(function () {
  'use strict';

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var state = { site: {}, projects: [], query: '', cat: 'All', lastFocus: null };

  /* ---------- helpers ---------- */
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  function statusClass(s) { return 'st-' + String(s || '').toLowerCase(); }
  /* A project without a public repo must not render a dead link. */
  function ghButton(p, ariaLabel) {
    var url = safeUrl(p.githubUrl);
    return url
      ? '<a class="btn" href="' + esc(url) + '" target="_blank" rel="noopener" aria-label="' + esc(ariaLabel || (p.title + ' GitHub repository')) + '">GitHub ↗</a>'
      : '<span class="btn btn-off" aria-disabled="true">Repo not public</span>';
  }
  function copyText(text) {
    function legacy() {
      var t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(legacy);
    } else { legacy(); }
  }
  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = 'copied ✓';
    setTimeout(function () { btn.textContent = old; }, 1600);
  }
  function mailto(subject) {
    return 'mailto:' + state.site.email + '?subject=' + encodeURIComponent(subject);
  }

  /* ---------- data ---------- */
  function visible() {
    var q = state.query.trim().toLowerCase();
    var list = state.projects.filter(function (p) {
      if (state.cat !== 'All' && p.category !== state.cat) return false;
      if (!q) return true;
      return [p.title, p.tagline, p.description, p.category, p.status, (p.techStack || []).join(' ')]
        .join(' ').toLowerCase().indexOf(q) !== -1;
    });
    return list.filter(function (p) { return p.featured; })
      .concat(list.filter(function (p) { return !p.featured; }));
  }

  /* ---------- render ---------- */
  function renderChrome() {
    var s = state.site;
    var active = state.projects.filter(function (p) { return p.status === 'Active'; }).length;
    $('#stat').innerHTML = '<i>●</i> ' + active + ' active / ' + state.projects.length + ' pkgs';
    ['#gh-link', '#gh-link-2'].forEach(function (id) { $(id).href = s.github; });
    $('#feedback-link').href = mailto('reachdevel.com feedback');
    $('#mail-link-2').href = 'mailto:' + s.email;
    var cta = $('#cta-mail');
    cta.href = mailto("Let's build together");
    cta.textContent = s.email + ' →';
    $('#copy-line').textContent = '© ' + new Date().getFullYear() + ' ' + s.name + ' — all rights reserved';
  }

  function renderTabs() {
    var cats = (state.site.categories || []).slice();
    state.projects.forEach(function (p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
    cats.unshift('All');
    $('#tabs').innerHTML = cats.map(function (c) {
      var n = c === 'All' ? state.projects.length : state.projects.filter(function (p) { return p.category === c; }).length;
      return '<button type="button" class="tab" role="tab" data-cat="' + esc(c) + '" aria-selected="' + (c === state.cat) + '">' +
        esc(c) + '<span class="n">' + n + '</span></button>';
    }).join('');
  }

  function cardHTML(p, i) {
    var n = state.projects.indexOf(p) + 1;
    var demo = safeUrl(p.demoUrl);
    return '<article class="card' + (p.featured ? ' wide' : '') + '" data-id="' + esc(p.id) + '" style="animation-delay:' + (120 + i * 110) + 'ms">' +
      '<div class="card-top"><span class="pkg">PKG-' + String(n).padStart(2, '0') + ' · ' + esc(p.category) + '</span>' +
      '<span class="stamp ' + statusClass(p.status) + '">' + esc(p.status) + '</span></div>' +
      '<div class="card-body"><h3 class="ttl">' + esc(p.title) + '</h3><p class="tagline">' + esc(p.tagline) + '</p></div>' +
      '<div class="tags">' + (p.techStack || []).map(function (t) { return '<span class="tag">' + esc(t.toLowerCase()) + '</span>'; }).join('') + '</div>' +
      '<div class="cmd"><span class="p">$</span><code>' + esc(p.command) + '</code>' +
      '<button type="button" data-copy="' + esc(p.command) + '" aria-label="Copy command for ' + esc(p.title) + '">copy</button></div>' +
      '<div class="card-foot"><span class="stars">★ ' + esc(p.stars) + '</span><div class="actions">' +
      (demo ? '<a class="btn btn-primary" href="' + esc(demo) + '" target="_blank" rel="noopener">Live demo ↗</a>'
            : '<span class="btn btn-off" aria-disabled="true">No demo yet</span>') +
      ghButton(p) +
      '<button type="button" class="btn" data-open="' + esc(p.id) + '" aria-label="Open details for ' + esc(p.title) + '">Details →</button>' +
      '</div></div></article>';
  }

  function renderGrid() {
    var list = visible();
    $('#grid').innerHTML = list.map(cardHTML).join('');
    $('#count').textContent = list.length + ' package(s) found';
    $('#empty').hidden = list.length > 0;
    $('#grid').hidden = list.length === 0;
  }

  /* ---------- modal ---------- */
  function openModal(id, trigger) {
    var p = state.projects.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    state.lastFocus = trigger || document.activeElement;
    var demo = safeUrl(p.demoUrl);
    $('#modal-box').innerHTML =
      '<div class="m-bar"><span>REACHDEVEL(7)</span><span class="hide-sm">PROJECT MANUAL</span><span>' + esc(p.slug || p.id) + '(1)</span>' +
      '<button type="button" class="m-x" id="m-close" aria-label="Close details">×</button></div>' +
      '<div class="m-body">' +
      '<div class="m-head"><div class="row"><span class="pkg">' + esc(p.category) + '</span><span class="stamp ' + statusClass(p.status) + '">' + esc(p.status) + '</span></div>' +
      '<h2 id="m-title">' + esc(p.title) + '</h2></div>' +
      '<section class="m-sec"><h3>NAME</h3><p class="ind name">' + esc(p.slug || p.id) + ' — ' + esc(p.tagline) + '</p></section>' +
      '<section class="m-sec"><h3>SYNOPSIS</h3>' +
      '<div class="cmd"><span class="p">$</span><code>' + esc(p.command) + '</code><button type="button" data-copy="' + esc(p.command) + '" aria-label="Copy command">copy</button></div>' +
      '<pre>' + (p.setup || []).map(function (l) { return l ? '$ ' + esc(l) : ''; }).join('\n') + '</pre></section>' +
      '<section class="m-sec"><h3>DESCRIPTION</h3><p class="ind">' + esc(p.description) + '</p></section>' +
      '<section class="m-sec"><h3>DEPENDS</h3><div class="tags ind">' + (p.techStack || []).map(function (t) { return '<span class="tag">' + esc(t.toLowerCase()) + '</span>'; }).join('') + '</div></section>' +
      '<section class="m-sec"><h3>STATS</h3><dl><dt>metrics</dt><dd style="color:var(--primary)">' + esc(p.metrics) + '</dd><dt>stars</dt><dd>★ ' + esc(p.stars) + '</dd><dt>created</dt><dd>' + esc(p.createdAt) + '</dd></dl></section>' +
      '<section class="m-sec"><h3>SEE ALSO</h3><div class="m-links">' +
      (demo ? '<a class="btn btn-primary" href="' + esc(demo) + '" target="_blank" rel="noopener">Live demo ↗</a>' : '<span class="btn btn-off" aria-disabled="true">No demo yet</span>') +
      ghButton(p) +
      '<a class="btn" href="' + esc(mailto('About ' + p.title)) + '">Ask about this project</a>' +
      '</div></section></div>';
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#m-close').focus();
  }

  function closeModal() {
    if ($('#modal').hidden) return;
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  /* ---------- events ---------- */
  function bind() {
    $('#q').addEventListener('input', function (e) { state.query = e.target.value; renderGrid(); });
    $('#tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      renderTabs(); renderGrid();
    });
    $('#reset').addEventListener('click', function () {
      state.query = ''; state.cat = 'All'; $('#q').value = '';
      renderTabs(); renderGrid();
    });
    $('#grid').addEventListener('click', function (e) {
      var copy = e.target.closest('[data-copy]');
      if (copy) { copyText(copy.getAttribute('data-copy')); flashCopied(copy); return; }
      if (e.target.closest('a')) return;
      var open = e.target.closest('[data-open]');
      var card = e.target.closest('.card');
      if (e.target.closest('.cmd')) return;
      if (open) openModal(open.getAttribute('data-open'), open);
      else if (card) openModal(card.getAttribute('data-id'), card);
    });
    $('#modal').addEventListener('click', function (e) {
      var copy = e.target.closest('[data-copy]');
      if (copy) { copyText(copy.getAttribute('data-copy')); flashCopied(copy); return; }
      if (e.target.id === 'modal' || e.target.id === 'm-close') closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'Tab' && !$('#modal').hidden) { /* simple focus trap */
        var f = $('#modal-box').querySelectorAll('a[href],button:not([disabled])');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- boot ---------- */
  fetch('projects.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (data) {
      state.site = data.site || {};
      state.projects = data.projects || [];
      renderChrome(); renderTabs(); renderGrid(); bind();
    })
    .catch(function () {
      $('#grid').innerHTML = '<div class="empty" style="grid-column:1/-1"><span class="empty-title">Could not load projects.json</span>' +
        '<span class="mono dim">Open this folder through a local server, not file://. Try: python3 -m http.server 8000</span></div>';
    });
})();
