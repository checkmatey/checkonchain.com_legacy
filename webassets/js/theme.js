// Light/dark theme handling for the homepage.
// Loaded in <head> so the data-theme attribute is set before first paint.
(function () {
  var KEY = 'coc-theme';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function current() {
    var t = stored();
    if (t === 'light' || t === 'dark') return t;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  var chartsByPath = null;
  if (window.COC_INDEX_PROMISE) {
    window.COC_INDEX_PROMISE.then(function (index) {
      chartsByPath = {};
      index.forEach(function (c) { chartsByPath[c.path] = c; });
      rewriteChartLinks(current());
    });
  }

  // Point every chart link at the variant matching the active theme,
  // falling back to whichever variant exists for one-theme-only charts.
  function rewriteChartLinks(theme) {
    if (!chartsByPath) return;
    var links = document.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var m = (a.getAttribute('href') || '').trim().match(/^(.+)_(light|dark)\.html$/);
      if (!m) continue;
      var entry = chartsByPath[m[1]];
      if (!entry) continue;
      var variant = entry[theme] ? theme : (entry.light ? 'light' : 'dark');
      a.setAttribute('href', m[1] + '_' + variant + '.html');
    }
  }

  function updateToggle(theme) {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateToggle(theme);
    rewriteChartLinks(theme);
  }

  window.COC_THEME = {
    current: current,
    set: function (theme) {
      try { localStorage.setItem(KEY, theme); } catch (e) {}
      apply(theme);
    },
    toggle: function () {
      window.COC_THEME.set(current() === 'dark' ? 'light' : 'dark');
    }
  };

  // Before first paint: set the attribute so CSS variables kick in immediately.
  document.documentElement.setAttribute('data-theme', current());

  document.addEventListener('DOMContentLoaded', function () { apply(current()); });
})();
