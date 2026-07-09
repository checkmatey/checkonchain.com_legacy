// Site-wide configuration.
// CHART_CDN_BASE is the Cloudflare R2 custom domain that hosts the full
// chart HTML files. Wrapper pages iframe charts from here.
window.CHART_CDN_BASE = 'https://charts-cdn.checkonchain.com';

// The search index (webassets/search-index.json) is the editable list of
// charts used by the homepage search and theme-aware links.
window.COC_INDEX_PROMISE = fetch('webassets/search-index.json')
  .then(function (r) { return r.json(); })
  .catch(function () { return []; });
