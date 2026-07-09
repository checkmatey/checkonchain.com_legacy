// Homepage chart search over webassets/search-index.json (editable).
(function () {
  var STOPWORDS = { the: 1, a: 1, an: 1, of: 1, and: 1 };
  var MAX_RESULTS = 12;

  function normalize(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s/-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function stripStopwords(s) {
    return s.split(' ').filter(function (w) { return !STOPWORDS[w]; }).join(' ');
  }

  // Score a chart against query tokens. Word-prefix matches beat plain
  // substring matches; more matched tokens beat fewer.
  function score(chart, tokens) {
    var haystack = chart._search;
    var words = chart._words;
    var matched = 0;
    var prefixBonus = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (haystack.indexOf(t) === -1) {
        if (STOPWORDS[t]) continue; // "The Realised" still matches "Realised Cap"
        return 0;
      }
      matched++;
      for (var w = 0; w < words.length; w++) {
        if (words[w].indexOf(t) === 0) { prefixBonus++; break; }
      }
    }
    if (matched === 0) return 0;
    var s = matched * 10 + prefixBonus * 5;
    // Query is a prefix of the title (ignoring stopwords like "the")
    var q = stripStopwords(tokens.join(' '));
    var t = stripStopwords(chart._title);
    if (q && t.indexOf(q) === 0) s += 40;
    if (q === t) s += 40; // exact title match wins outright
    return s;
  }

  function chartUrl(chart) {
    var theme = window.COC_THEME ? window.COC_THEME.current() : 'light';
    if (chart.plain && !chart.light && !chart.dark) return chart.path + '.html';
    var variant = chart[theme] ? theme : (chart.light ? 'light' : 'dark');
    return chart.path + '_' + variant + '.html';
  }

  function init(index) {
    var input = document.getElementById('chartSearch');
    var resultsEl = document.getElementById('chartSearchResults');
    if (!input || !resultsEl || !index.length) return;

    var charts = index.filter(function (c) { return !c.hidden; });
    for (var i = 0; i < charts.length; i++) {
      var c = charts[i];
      c._title = normalize(c.title);
      c._search = normalize(c.title + ' ' + (c.tags || []).join(' ') + ' ' + (c.category || ''));
      c._words = c._search.split(' ');
    }

    var activeIdx = -1;
    var current = [];

    function close() {
      resultsEl.classList.remove('open');
      resultsEl.innerHTML = '';
      activeIdx = -1;
      current = [];
    }

    function render(list) {
      resultsEl.innerHTML = '';
      if (!list.length) {
        var empty = document.createElement('div');
        empty.className = 'coc-search-empty';
        empty.textContent = 'No charts found';
        resultsEl.appendChild(empty);
      }
      list.forEach(function (chart) {
        var a = document.createElement('a');
        a.className = 'coc-search-result';
        a.href = chartUrl(chart);
        a.target = '_blank';
        a.rel = 'noopener';
        var title = document.createElement('span');
        title.className = 'coc-search-title';
        title.textContent = chart.title;
        a.appendChild(title);
        if (chart.category) {
          var badge = document.createElement('span');
          badge.className = 'badge badge-secondary';
          badge.textContent = chart.category;
          a.appendChild(badge);
        }
        resultsEl.appendChild(a);
      });
      resultsEl.classList.add('open');
      activeIdx = -1;
      current = list;
    }

    function search() {
      var q = normalize(input.value);
      if (!q) { close(); return; }
      var tokens = q.split(' ');
      var scored = [];
      for (var i = 0; i < charts.length; i++) {
        var s = score(charts[i], tokens);
        if (s > 0) scored.push([s, charts[i]]);
      }
      scored.sort(function (a, b) { return b[0] - a[0] || a[1].title.localeCompare(b[1].title); });
      render(scored.slice(0, MAX_RESULTS).map(function (x) { return x[1]; }));
    }

    function setActive(idx) {
      var items = resultsEl.querySelectorAll('.coc-search-result');
      for (var i = 0; i < items.length; i++) items[i].classList.toggle('active', i === idx);
      if (idx >= 0 && items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
      activeIdx = idx;
    }

    input.addEventListener('input', search);
    input.addEventListener('focus', function () { if (input.value) search(); });
    input.addEventListener('keydown', function (e) {
      if (!current.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(activeIdx + 1, current.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(activeIdx - 1, 0)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var chart = current[activeIdx >= 0 ? activeIdx : 0];
        if (chart) window.open(chartUrl(chart), '_blank', 'noopener');
      } else if (e.key === 'Escape') { close(); }
    });

    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !resultsEl.contains(e.target)) close();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (window.COC_INDEX_PROMISE) window.COC_INDEX_PROMISE.then(init);
  });
})();
