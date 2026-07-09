# Chart hosting on Cloudflare R2

As of July 2026, the full Plotly chart HTML files (~3.6 GB) live in a
Cloudflare R2 bucket instead of this repo. The files in `btconchain/`,
`macroeconomic/`, `partners/`, `framework/` and `testing/` are small
wrapper pages that iframe the real chart from the CDN.

## Layout

- Bucket: `checkonchain-charts-legacy-html` (account `8e5707...9044`)
- Public CDN domain: `https://charts-cdn.checkonchain.com` (R2 custom domain)
- Object paths mirror the repo exactly, e.g.
  `btconchain/pricing/pricing_mayermultiple/pricing_mayermultiple_light.html`
- The CDN base URL is defined in `webassets/js/config.js` (homepage) and
  `scripts/build-wrappers.mjs` (wrapper generator).

## Publishing new or updated charts

1. Upload the chart HTML to R2 (same path layout). With the `r2` rclone
   remote configured (`~/.config/rclone/rclone.conf`):

   ```bash
   rclone copy <local-chart-dir> r2:checkonchain-charts-legacy-html/<path> --progress
   ```

   Updated versions of existing charts need nothing else - the wrappers
   point at the same URL.

2. For NEW charts, also update the search index and wrappers so the
   homepage search finds them and a wrapper page exists:

   ```bash
   node scripts/extract-titles.mjs      # fetch real chart titles from R2
   node scripts/build-search-index.mjs  # merge new charts into the index
   node scripts/build-wrappers.mjs      # create wrapper pages
   ```

## Search index

`webassets/search-index.json` is the editable source of truth for the
homepage search. Each entry has `title`, `category` (badge shown in
results), `tags` (extra searchable words) and optional `hidden`. Edit it
freely - `build-search-index.mjs` only merges chart additions/removals
and never overwrites manual edits to those fields.

## Scripts

- `scripts/extract-titles.mjs` - extracts real Plotly titles from the
  chart files on R2 (range requests; cached in scripts/chart-titles.json).
- `scripts/build-search-index.mjs` - merges chart folders on disk into
  `webassets/search-index.json`, preserving manual edits.
- `scripts/build-wrappers.mjs` - replaces full chart exports with iframe
  wrapper pages. Destructive: only run after the originals are uploaded
  (`rclone check` should report 0 differences). Supports `--dry-run`.

## Credentials

The rclone remote uses an R2 API token ("legacy-upload") scoped to this
bucket with Object Read & Write. Manage tokens in the Cloudflare
dashboard under R2 -> API -> Manage API tokens. If the token is rotated,
update `~/.config/rclone/rclone.conf`.

## Caching note

All objects carry `Cache-Control: no-cache` (set July 2026): browsers
may store charts but must revalidate before reuse, so visitors always
see the latest data (unchanged files revalidate with a tiny 304). Any
new uploads MUST set the same header (see docs/UPLOADING_CHARTS.md),
otherwise browsers fall back to heuristic caching and can show stale
charts for hours. Cloudflare's edge does not cache these responses
(`cf-cache-status: DYNAMIC`); do not add an edge Cache Rule without
also handling revalidation, or stale data will come back.
