# Evidence log: `external` (serving CSS to itch.io from another origin via `@import`)

- **Date:** 2026-10-14 (all checks below were run on this date)
- **Scope:** `@import` of external CSS (dynamic per-visit CSS, Google Fonts, frameworks, self-hosted fonts) into itch.io custom CSS; headers, render blocking, caching, CORS, Referer/privacy, content blockers, free hosting limits.
- **Browser used for lab tests:** Google Chrome 155.0.8059.40, headless (`--headless=new`), run with its own throw-away `--user-data-dir` (never the user's profile), driven over CDP by `external-tools/cdp.mjs`.
- **curl:** Git-for-Windows curl 8.7.1 (Schannel, no HTTP/2), so every timing below is HTTP/1.1.
- **itch etiquette:** GET only, normal browser User-Agent, at least 1.2 s between itch requests, robots.txt honoured. About 75 itch requests in total: 1 robots, about 10 page/header checks, 3 listing pages, 60 sampled project pages and 3 WebFetch doc pages.
- **Raw downloads** (itch HTML, filter lists, Google CSS) stayed in the session scratchpad. They are not stored in this repo.

Tools (all written for this log, in `external-tools/`):

| File | What it does |
|---|---|
| `server.py` | Lab HTTP server. Run it twice: `8701` is the page origin (`http://localhost:8701`) and `8702` is the asset origin (`http://127.0.0.1:8702`, cross-site like `user.itch.io` → `*.vercel.app`). `/css?n=NAME&ct=&status=&delay=&imp=&extra=&acao=&cc=&rp=&link=&redirect=` returns `:root{--NAME:applied}` with the requested headers. `/font?acao=` serves a woff2 file from `fonts/f.woff2`. `/img` serves a 1x1 gif. Every request is logged with all its headers to `log-<port>.jsonl`. Pages are served with `Referrer-Policy: no-referrer-when-downgrade`, the same as itch. |
| `gen.py` | Writes the test pages into `pages/`. |
| `cdp.mjs` | Starts an isolated headless Chrome, opens each page and prints the JSON from `window.__result()`: computed custom properties, Resource Timing, FCP and a per-test `extra`. `bf` runs the bfcache scenario. |
| `sockwatch.py` | Raw TCP listener that logs every accepted connection (used to detect preconnects). |
| `match_lists.py` | Approximate ABP/uBO network-filter matcher (`||`, `|`, `^`, `*`, regex, `$third-party/1p/3p`, resource types, `domain=`/`from=`, `@@`). It checks which list rules could block a given URL. |
| `results/*.jsonl` | Raw outputs of the lab runs quoted below. |

Re-run the lab:

```bash
cd external-tools && mkdir -p pages fonts
# any small woff2 works; we used the Google Fonts text-subset of Syne (see section 6)
python -I gen.py
python -I server.py 8701 &  python -I server.py 8702 &  python -I sockwatch.py 8703 &  python -I sockwatch.py 8704 &
node cdp.mjs "C:/Program Files/Google/Chrome/Application/chrome.exe" "$TMP/chrome-prof" \
  mime.html mime-quirks.html order.html font.html cssom.html waterfall.html block.html noblock.html \
  refused.html "ref.html?visit=42#frag" "ref2.html?visit=7" scanner.html linkhdr.html bodypreconnect.html scope.html \
  validity.html bodyscript.html bf reload
python -I analyze_logs.py .            # request counts, arrival offsets, font CORS headers, Referer table
```

Notes for re-runs (added by the verifier):

- The raw server logs (`log-<port>.jsonl`) and socket logs are **not** stored in `results/`. Every claim that rests on "the server log shows …" must be re-checked by re-running the lab and then `analyze_logs.py`. `results/results-verify-logsummary.txt` is the verifier's summary of its own run.
- `results/results-7.jsonl` is truncated mid-line in this repo; `results/results-verify.jsonl` holds a complete re-run (ports 8721/8722 there).
- `sockwatch.py` writes its log line only after its 3 s `recv` timeout, so a logged timestamp is the accept time **plus about 3 s** for a preconnect, which sends no bytes.
- In Git Bash on Windows, MSYS path conversion rewrites a leading `/` argument or env value: `EXTRA_PATHS=/live.css,…` reaches Python as `C:/Program Files/Git/live.css,…`, so the first path is silently tested wrong. Prefix the command with `MSYS_NO_PATHCONV=1`, or don't put a `/…` path first (second verifier).
- Pages, servers and `cdp.mjs` hardcode ports 8701–8704 and CDP 9339. If another agent may be running the same lab, change them in all three files (the verifier used 8721–8724 and 9359). Stop only your own server PIDs; never kill every `python.exe`.

---

## 1. The live service and the live itch page

### 1a. `https://itch-io-custom-css-custom-css.vercel.app/live.css` (the owner's own service)

Command (first run with `-H "Accept-Encoding: gzip, deflate, br"`, then 8 more runs with `--compressed`, 1.5 s apart):

```bash
curl -sS --compressed -o runN.css -D hN.txt -A "<Chrome UA>" -H "Accept: text/css,*/*;q=0.1" \
  -H "Referer: https://mirokshi.itch.io/" \
  -w "code=%{http_code} http=%{http_version} size=%{size_download} connect=%{time_connect} tls=%{time_appconnect} ttfb=%{time_starttransfer} total=%{time_total}\n" \
  https://itch-io-custom-css-custom-css.vercel.app/live.css
```

Response headers:

| Header | Value |
|---|---|
| Status | `200` (HTTP/1.1 in curl) |
| `Content-Type` | `text/css; charset=utf-8` |
| `Cache-Control` | `no-store` |
| `Content-Encoding` | `br` when br is offered, `gzip` when only gzip is offered, none otherwise |
| `X-Vercel-Cache` | `MISS` on every request |
| `X-Vercel-Id` | `cdg1::iad1::…`: Paris edge, function runs in Washington `iad1` (the default region) |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Access-Control-Allow-Origin` | absent, even with `Origin: https://mirokshi.itch.io` |
| `Vary` | absent |
| `http://…/live.css` | `308 Permanent Redirect` to https |
| unknown path `/nope.css` | `404`, `text/plain` |

Timing from Spain over HTTP/1.1:

| Run | Wire size (br) | TTFB (s) | Total (s) |
|---|---|---|---|
| cold (first request) | 3,346 | 0.999 | 1.001 |
| 1 | 3,289 | 0.192 | 0.194 |
| 2 | 3,329 | 0.184 | 0.185 |
| 3 | 3,282 | 0.354 | 0.355 |
| 4 | 3,318 | 0.237 | 0.238 |
| 5 | 3,284 | 0.189 | 0.190 |
| 6 | 3,293 | 0.322 | 0.323 |
| 7 | 3,321 | 0.215 | 0.216 |
| 8 | 3,294 | 0.179 | 0.180 |

Decompressed bodies were about 14.8 KB (14,830–14,845 bytes). All 8 bodies were different (8 distinct md5), so the CSS is random per request. For comparison, the Google Fonts css2 request had a TTFB of 0.13 s.

### 1b. `https://mirokshi.itch.io/` (the owner's own profile)

Commands: `curl -sS -A "<UA>" --compressed -D headers -o page.html https://mirokshi.itch.io/`. A Python regex then extracted `<style id="custom_css">` and compared it with the repo's `dist/main.min.css`.

- `style#custom_css` is 4,725 chars and is **byte-identical** to `dist/main.min.css` once its trailing newline is removed. Both `@import` rules (Google Fonts css2 and `https://itch-io-custom-css-custom-css.vercel.app/live.css`) are present verbatim. itch does not proxy, rewrite or HTML-escape anything; for example `>` stays a raw `>`.
- Head order: `<meta charset>` … `<link href="https://static.itch.io/user.css?…" rel="stylesheet">`, sync `<script src>` for `lib.min.js`, `bundle.min.js` and `user.min.js`, inline scripts, `<style id="user_theme">`, then `<style id="custom_css">`. Two inline `<script>` blocks come after `custom_css` in the document.
- The page has no `<link rel=preconnect>` or `dns-prefetch`.
- The doctype is `<!DOCTYPE HTML>`, so the page renders in standards mode.
- Response headers include `Referrer-Policy: no-referrer-when-downgrade`, `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN`. There is **no** `Content-Security-Policy` and **no** `Cache-Control` on the document.
- `https://static.itch.io/user.css` is 71,824 bytes, `text/css`, `Cache-Control: max-age=86400` and `ACAO: *`. It has **0 `@layer`** rules (it is unlayered), no `@import` and 10 `@font-face` rules.

### 1c. Other page types (headers only)

| URL | Status | Referrer-Policy | CSP |
|---|---|---|---|
| `https://leafo.itch.io/x-moon` (project) | 200 | `no-referrer-when-downgrade` | `frame-ancestors 'self' https://itch.io` only |
| `https://itch.io/jam/gmtk-2024` (jam) | 200 | `no-referrer-when-downgrade` | none |
| `https://itch.io/games`, `https://itch.io/devlogs` | 200 | `no-referrer-when-downgrade` | none |
| one devlog post linked from `/devlogs` | 200 | `no-referrer-when-downgrade` | none |

### 1d. Sample: how common are external imports?

Method: collected 94 unique game URLs from `/games/top-rated`, `/games/featured` and `/games/top-sellers`, then fetched 60 of them (`shuf -n 60`) at 1.2 s intervals. For each page, extracted `style#custom_css` and searched it for `@import`, `url(` and `@font-face`.

Result: **3 of the 60 fetched files were not project pages**: `p33` and `p57` are itch HTTP 429 "Too Many Requests" pages (openresty), and `p54` is a Cloudflare "Just a moment..." challenge page (second verifier). So **57** project pages were really analysed. 5 of those 57 had non-empty `custom_css`, and **0** of them used `@import`, external `url()` or `@font-face`. Pages without custom CSS have no `style#custom_css` element at all.

Verifier cross-check (2026-10-14): 12 more URLs from the same 94-URL pool that were *not* in the first sample, fetched 3 s apart, all 200 (re-counted by the second verifier: 12 valid, 3 with custom CSS, 0 external). 3 of 12 had non-empty `custom_css`, and 0 used `@import`, `@font-face` or external `url()`. Combined: 8 of 69 pages had custom CSS, and 0 of 69 imported anything. External imports are rare on popular project pages.

Check for blocked fetches before counting a sample: grep each saved page for `Too Many Requests` and `Just a moment` (and require a marker such as `view_game_page` or `inner_column`).

---

## 2. Lab results (Chrome 155 headless, standards mode unless noted)

### 2a. MIME, status and failure handling: `mime.html` / `mime-quirks.html` (results-mime.jsonl)

| Import (cross-origin unless noted) | Standards mode | Quirks mode |
|---|---|---|
| `text/css` | applied | applied |
| `text/css; charset=utf-8` | applied | applied |
| `text/plain` | **ignored** | ignored |
| `text/html` | **ignored** | ignored |
| `application/octet-stream` | **ignored** | ignored |
| no Content-Type header | applied | applied |
| status 404 (CSS body, `text/css`) | **ignored** | ignored |
| status 500 (CSS body, `text/css`) | **ignored** | ignored |
| 302 redirect → 200 `text/css` | applied | applied |
| same-origin `text/plain` | ignored | **applied** (quirks exception) |
| connection refused (`127.0.0.1:1`) | ignored, fails in about 4 ms | same |
| style rule placed *after* the imports in the same `<style>` | applied | applied |
| `@import` placed after a style rule | **ignored and never requested** | same |

Every import from an inline `<style>` reported `renderBlockingStatus: "blocking"`.

### 2b. Cascade and conditions: `order.html` (results-2.jsonl)

| Case | Result |
|---|---|
| `@import url(A) layer(ext)` with `#box{color:red}`, against local unlayered `.b{color:green}` | **green**: the layered ID loses to the unlayered class |
| Unlayered import `.c{background:red}`, against the same selector in the local sheet `.c{background:blue}` | **blue**: on a specificity tie the importing sheet wins |
| `@import … print` | not applied, but **requested** (blocking) |
| `@import … (min-width:100000px)` | not applied, but **requested** |
| `@import … (prefers-reduced-motion: reduce)` (headless reports no-preference) | not applied, but **requested** |
| `@import … supports(display:nonexistentvalue)` | not applied and **not requested** |
| `@import … supports(display:grid)` | applied |

### 2c. `@import … scope(#wrapper)` from the css-cascade-6 draft: `scope.html` (results-9.jsonl)

Chrome keeps the rule text, but `CSSImportRule.media.mediaText` is `"scope(#wrapper)"`: the parser treats it as an unknown media query, which never matches. The sheet is requested but never applied, neither inside nor outside `#wrapper`. `'scope' in CSSImportRule.prototype` returns `false`. (The stored `results-9.jsonl` predates the `media`/`scopeProp` fields in `gen.py`; the verifier's re-run in `results-verify.jsonl` shows `media: "scope(#wrapper)"`, `scopeProp: false`, `layerName: null`.)

### 2d. Fonts and CORS: `font.html` (results-2.jsonl, server log)

| `@font-face` declared in | Font URL | ACAO | `FontFace.status` |
|---|---|---|---|
| inline sheet | cross-origin B | none | **error** |
| inline sheet | cross-origin B | `*` | loaded |
| inline sheet | cross-origin B | `http://localhost:8701` | loaded |
| inline sheet | same origin as page | none | loaded |
| imported sheet on B | B (same host as the sheet) | none | **error** |
| imported sheet on B | B | `*` | loaded |

The server log shows that font requests carry `Origin: http://localhost:8701` (the **page** origin) with `Sec-Fetch-Mode: cors` and `Sec-Fetch-Dest: font`. This holds even when the font sits next to the stylesheet that declares it.

### 2e. CSSOM access: `cssom.html` (results-2.jsonl)

Reading `importRule.styleSheet.cssRules` gave:

- cross-origin import without ACAO: `SecurityError`
- cross-origin import **with** `ACAO: *`: still `SecurityError` (`@import` from an inline sheet is fetched `no-cors`)
- same-origin import: readable

### 2f. Waterfall, render blocking and the preload scanner (results-3.jsonl, results-5.jsonl)

| Page | Setup | Observation |
|---|---|---|
| `waterfall.html` | `w1` (800 ms, contains `@import w2` of 800 ms) and sibling `p1` (800 ms) | `w1` and `p1` both start at 30 ms and end at 833 ms. Server log: `w2` arrived **+803 ms** after `w1`. An inline script placed after the `<style>` ran at **1636 ms**. FCP was 1652 ms. |
| `block.html` | one import with a 2500 ms delay | **FCP 2532 ms** |
| `noblock.html` | no import | FCP 44 ms |
| `refused.html` | import from a closed port, then a local rule | FCP 36 ms; the local rule was applied |
| `scanner.html` | `<script src>` delayed 1500 ms, then `<style>@import (200 ms)</style>` | CSS requested at **+1 ms** after the script (in parallel); FCP 1548 ms |

### 2g. Referer and request headers (results-4.jsonl, results-6.jsonl, results-8.jsonl, server logs)

The page was served with `Referrer-Policy: no-referrer-when-downgrade`, the same as itch. A = `localhost:8701` (the page), B = `127.0.0.1:8702` (cross-site to A), C = `localhost:8702` (cross-origin to B). Caveat (verifier): C is **same-site** with A, because sites ignore ports, so requests to C log `Sec-Fetch-Site: same-site`. This does not change the Referer results (referrer policy compares origins), but don't read the C rows as a cross-site sample.

| Request | Referer received |
|---|---|
| `@import` from inline `<style>` | `http://localhost:8701/pages/ref.html?visit=42`: full URL including the query, without the `#frag` |
| `url()` image in inline `<style>` | `http://localhost:8701/` (origin only) |
| `@font-face` font in inline `<style>` | `http://localhost:8701/` (origin only) |
| nested `@import` from sheet on B → B | full URL of the B sheet |
| nested `@import` from sheet on B → C | **full** URL of the B sheet |
| `url()` image from sheet on B → B | full URL of the B sheet |
| `url()` image / font from sheet on B → C | `http://127.0.0.1:8702/` (origin only) |

Every header the CSS host received for the stylesheet request: `Host`, `Connection`, `User-Agent`, `sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`, `Accept: text/css,*/*;q=0.1`, `Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: no-cors`, `Sec-Fetch-Dest: style`, `Sec-Fetch-Storage-Access: active`, `Referer`, `Accept-Encoding: gzip, deflate, br, zstd` and `Accept-Language`. There was no `Origin` and no `Cookie`, because none had been set.

### 2h. bfcache with a `no-store` import (results-4.jsonl, server log)

Steps: open `bf1.html` (its document has no Cache-Control; it imports CSS with `Cache-Control: no-store`), navigate to `bf2.html`, then go back in history.

Result: `pageshow` events reported `persisted = [false, true]`, CDP sent no `Page.backForwardCacheNotUsed`, and the server received **no** new request for `bf1.html` or for the no-store CSS. The page was restored from bfcache with the same CSS variant.

### 2i. Preconnect channels: `linkhdr.html`, `bodypreconnect.html` (results-7.jsonl, sockwatch)

- Imported CSS response with the header `Link: <http://127.0.0.1:8703>; rel=preconnect`: **a TCP connection was opened to :8703**, and no bytes were sent on it. (Verifier re-run: accepted about 31 ms after the CSS request; the log line itself is written 3 s later, after the `recv` timeout.)
- `<link rel=preconnect href=http://127.0.0.1:8704>` in `<body>`: a TCP connection was opened to :8704.

---

## 3. Third-party hosts: Content-Type and caching

Each host was fetched with `curl -sS -L -o /dev/null -D - -A "<UA>" -H "Accept: text/css,*/*;q=0.1" <url>`.

| URL | Content-Type | nosniff | Cache-Control | ACAO |
|---|---|---|---|---|
| `raw.githubusercontent.com/necolas/normalize.css/master/normalize.css` | **`text/plain`** | yes | `max-age=300` | `*` |
| `cdn.jsdelivr.net/gh/necolas/normalize.css@8.0.1/normalize.css` | `text/css` | yes | `public, max-age=31536000, s-maxage=31536000, immutable` | `*` |
| `cdn.jsdelivr.net/gh/necolas/normalize.css@master/…` (branch) | `text/css` | yes | `public, max-age=604800, s-maxage=43200` | `*` |
| `cdn.jsdelivr.net/gh/necolas/normalize.css/normalize.css` (**no ref**; verifier) | `text/css` | yes | `public, max-age=604800, s-maxage=43200` | `*` |
| `cdn.jsdelivr.net/gh/necolas/normalize.css@<full 40-char SHA>/…` (second verifier) | `text/css` | yes | `public, max-age=31536000, s-maxage=31536000, immutable` (`x-jsd-version-type: commit`) | `*` |
| `cdn.jsdelivr.net/gh/necolas/normalize.css@<7- or 12-char short SHA>/…` (second verifier) | `text/css` | yes | **`public, max-age=604800, s-maxage=43200`** (`x-jsd-version-type: branch`) | `*` |
| `gist.githubusercontent.com/<user>/<id>/raw` (verifier) | **`text/plain`** | yes | `max-age=300` | `*` |
| `cdn.jsdelivr.net/npm/normalize.css@8.0.1/…` | `text/css` | yes | `…max-age=31536000…immutable` | `*` |
| `unpkg.com/normalize.css@8.0.1/…` | `text/css` | yes | `public, max-age=31536000` | `*` |
| `cdnjs.cloudflare.com/…/normalize.min.css` | `text/css` | yes | `…max-age=30672000, immutable` | `*` |
| `necolas.github.io/normalize.css/8.0.1/normalize.css` (GitHub Pages) | `text/css` | | `max-age=600` | `*` |

Verifier note: the **no-ref** jsDelivr URL answered `x-jsd-version: 8.0.1`, `x-jsd-version-type: version`. A version-less `gh` URL resolves to the repository's latest semver **tag**, not to its default branch. jsDelivr's README (github.com/jsdelivr/jsdelivr) says it "Falls back to the repository's default branch if there are no tagged releases". So pushing to `main` never changes a version-less URL while a tag exists.

## 4. Content blockers

Method:

1. Downloaded Brave's `filter_lists/list_catalog.json` (`raw.githubusercontent.com/brave/adblock-resources/master/…`).
2. Downloaded every source of the default-enabled desktop lists: Brave Default Adblock Filters (uBO filters 2020–2026, general, badware, resource-abuse, unbreak, quick-fixes, link-shorteners, EasyList, URLhaus online, Brave unbreak/specific/social/sugarcoat/android), Brave Default Privacy Filters (EasyPrivacy, uBO privacy) and Brave First Party filters. That is 26 files.
3. Separately downloaded EasyList Spanish, AdGuard Spanish/Portuguese (uBO build), Fanboy Annoyances (uBO) and Peter Lowe's list.
4. Ran `python -I match_lists.py <dir>`. 131,223 network rules were parsed from the Brave defaults.

Correction (verifier): `list_catalog.json` marks **30** sources as `default_enabled` for desktop, not 26. Steps 2–3 missed "Cookie notice blocker" (`fanboy-cookiemonster_ubo.txt`, uBO `annoyances-cookies.txt`, `brave-cookie-specific.txt`) and "Mobile app promo blocker" (`fanboy-mobile-notifications.txt`). "Brave IOS-Specific Filters" is iOS-only. The verifier re-downloaded all 30 plus EasyList Spanish and AdGuard Spanish/Portuguese, and re-ran `match_lists.py`:

- 26-source set: 131,229 network rules; all 30 sources: 133,425 network rules.
- The live.css and title.css URLs, Google Fonts, and `/live.css` on every listed platform: **no match** in either set. A plain `grep` finds no line naming `itch-io-custom-css`, `itch.io` or `itch.zone`.
- Path check, verifier's own list of 32 names: `/adverts.css` **and `/advert.css`** match (EasyList generic `/advert.$~script,~xmlhttprequest,domain=~…`). `/ads.css`, `/ad.css`, `/advertising.css`, `/banner.css`, `/banners.css`, `/analytics.css`, `/track.css`, `/tracking.css`, `/tracker.css`, `/stats.css`, `/beacon.css`, `/pixel.css`, `/counter.css`, `/popup.css`, `/sponsor.css`, `/promo.css`, `/affiliate.css`, `/social.css`, `/cookie.css`, `/style.css`, `/theme.css`, `/custom.css`, `/fonts.css` and `/main.css` don't match.
- The suffix table below reproduces exactly on the 26-source set. With all 30, the totals are github.io 50 / jsdelivr.net 134 network lines; the rest are unchanged.

| URL (as a third-party request from `mirokshi.itch.io`) | Result |
|---|---|
| `https://itch-io-custom-css-custom-css.vercel.app/live.css` and `/title.css` | no match |
| Google Fonts css2 / gstatic woff2 | no match |
| `/live.css` on `*.pages.dev`, `*.workers.dev`, `*.netlify.app`, `*.github.io`, `cdn.jsdelivr.net/gh`, `*.deno.dev`, custom domain | no match |
| 32 path names on a neutral domain (`/ads.css`, `/ad.css`, `/analytics.css`, `/track.css`, `/stats.css`, `/beacon.css`, `/pixel.css`, `/counter.css`, `/banner.css`, `/style.css`, `/theme.css`, `/custom.css`, `/fonts.css` …) | only **`/adverts.css`** matched (EasyList generic `/adverts.$~script,~xmlhttprequest,…`) |
| `https://css.example.com/pixel.gif?u=1` (image) | blocked by EasyPrivacy `/pixel.gif?` |

Lines that mention each hosting suffix (network rules, cosmetic excluded):

| Suffix | Lines | Of those, in badware + URLhaus | Platform-wide rules |
|---|---|---|---|
| `vercel.app` | 53 | 45 | only path-specific (`||vercel.app/js/esc.js`, …) or `from=`-restricted |
| `pages.dev` | 115 | 102 | `||pages.dev^$script,domain=<3 sites>` |
| `workers.dev` | 40 | 13 | `||workers.dev^$domain=<3 sites>` |
| `netlify.app` | 19 | 12 | path-specific |
| `github.io` | 49 | 19 | path-specific |
| `jsdelivr.net` | 126 | 1 | path-specific (anti-adblock scripts) |
| `deno.dev` | 0 | 0 | none |

Peter Lowe's list (3,549 hosts) contains `plausibleio.workers.dev` (an analytics proxy) and two `*.pages.dev` hosts.

EasyList generic cosmetic filters that hide `custom-` classes: `##.custom-ad`, `##.custom-ad-area`, `##.custom-ad-container`, `##.custom-ads`, `##.custom-advert-banner`, `##.custom-sticky-ad-container`. (Verifier: Brave First Party filters repeat `##.custom-sticky-ad-container`. The default-enabled Cookie notice blocker (`fanboy-cookiemonster_ubo.txt`) also has generic `##.custom-ch-cookie-notice`, `##.custom-container-lgpd`, `##.custom-cookie-banner`, `##.custom-cookie-footer-banner` and `##.custom-cookie-msg`, plus `###custom-cookie-*` id filters.)

No rule in Brave's default lists mentions `itch.io`.

Brave documentation (wiki "Blocking goals and policy"): Standard mode applies no network filter-list blocking to first-party requests. Aggressive mode blocks first- and third-party requests and also enables CNAME uncloaking. Optional and custom lists always run in Aggressive mode. Regional lists are default-enabled in their region.

**Conclusion:** as of 2026-10-14, no rule in the lists we checked explains why Brave blocked `live.css` on 2026-10-12. This stays an open question.

## 5. Free hosting limits (official pages fetched 2026-10-14)

| Platform | Free limits (quoted from the official page) | Source |
|---|---|---|
| Vercel Hobby | 1,000,000 function invocations; 4 CPU-hrs Active CPU; 360 GB-hrs provisioned memory; 100 GB Fast Data Transfer; 10 GB Fast Origin Transfer; 1,000,000 CDN requests per month. Over the limit you usually wait 30 days. Non-commercial personal use only. Single function region; default region `iad1`. | vercel.com/docs/plans/hobby (last_updated 2026-09-14), /docs/limits/fair-use-guidelines, /docs/functions/configuring-functions/region (2026-08-11) |
| Vercel commercial use | Includes "Advertising the sale of a product or service", any payment processing and ads. Donations are not commercial. | fair-use-guidelines |
| Vercel CDN cache | Caches only with `s-maxage`. Not cacheable if the response has `private`/`no-cache`/`no-store` or a `set-cookie`. `CDN-Cache-Control` and `Vercel-CDN-Cache-Control` are supported. `s-maxage` and `stale-while-revalidate` are stripped from the browser copy unless `CDN-Cache-Control` is used. | vercel.com/docs/caching/cdn-cache (2026-09-14) |
| Cloudflare Workers Free | 100,000 requests/day (reset at 00:00 UTC); 10 ms CPU per request; 128 MB; 50 subrequests. Over the limit: error 1027 (fail closed) or bypass (fail open, routes). Static asset requests are free and unlimited. | developers.cloudflare.com/workers/platform/limits/, …/pricing/ (updated 2026-10-02) |
| Cloudflare KV Free | 100,000 reads/day; 1,000 writes/day (different keys); 1 write/s per key; 1 GB storage; 25 MiB values; 512-byte keys | developers.cloudflare.com/kv/platform/limits/ |
| Netlify Free | 300 credits ("300 credit limit"; the page doesn't say whether it resets monthly or what happens at 0). Bandwidth costs 20 credits/GB, web requests 2 credits/10k, compute 10 credits/GB-hr, each production deploy 15 credits. Community threads (answers.netlify.com, mid-2026) report paused deploys/sites; the thread cited in fact external-25 now returns 404 to WebFetch, but several similar threads appear in search results. | netlify.com/pricing |
| Deno Deploy Free | 1M requests/month, 20 GiB egress, 10 h active CPU, KV 1 GiB / 1M read units / 500k write units, 5 custom domains | deno.com/deploy/pricing |

## 6. Google Fonts

The css2 requests were sent with a Chrome UA unless stated otherwise.

| Request | Status | Content-Type | Faces |
|---|---|---|---|
| `css2?family=Syne:wght@400..800&display=swap` | 200 | text/css | 3 (woff2) |
| `css2?family=Syne:wght@100..900` (range outside the font's 400–800) | **400** | **text/html** | 0 |
| `css2?family=syne` (lowercase) | **400** | text/html | 0 |
| `css2?family=Nonexistent+Font` | **400** | text/html | 0 |
| `css2?family=Syne:wght@700;400` (unsorted tuples) | 200 | text/css | 6 |
| `css2?family=Playfair+Display:wght,ital@400,1` (non-alphabetical axes) | 200 | text/css | 4 (italic 400) |
| `css2?family=Playfair%20Display` | 200 | text/css | 4 |
| `css?family=Syne:400,700&display=swap` (v1 API) | 200 | text/css | 6 |
| `css2?family=Syne` (no `display`) | 200 | text/css | 0 `font-display` lines |
| `css2?family=Syne&display=swap` with the curl UA | 200 | text/css | 1 face, `.ttf` `format('truetype')` |
| same request with the Firefox 144 UA | 200 | text/css | 3 woff2 |
| `css2?family=Syne:wght@400..800&text=Mirokshi&display=swap` | 200 | text/css | 1 face, `unicode-range: U+4d, U+68-69, U+6b, U+6f, U+72-73` |

- File sizes: the `text=Mirokshi` subset woff2 is **2,548 bytes** (3,400 chars in base64). The Syne latin woff2 is 34,608 bytes.
- The css2 response for the live profile URL: `Content-Type: text/css; charset=utf-8`, `ACAO: *`, `Cache-Control: private, max-age=86400, stale-while-revalidate=604800`, `Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin`, and no `Set-Cookie`. It contains 9 `@font-face` rules, all with `font-display: swap`.
- The woff2 response: `font/woff2`, `ACAO: *`, `Cache-Control: public, max-age=31536000`.
- Google's css2 docs say axes must be listed "alphabetically", tuples must be "sorted numerically" and must not overlap. `display` accepts `auto|block|swap|fallback|optional` and defaults to `auto`. `text=` must be URL-encoded and can cut file size by up to 90%.
- **Privacy:** Google's Fonts privacy FAQ (`developers.google.com/fonts/faq/privacy`, which now redirects to the JavaScript-rendered `fonts.google.com/faq`) says the API sets no cookies, but Google receives the visitor's IP, the requested URL, the User-Agent and the Referer. We read this via the search index, not the page itself. The LG München I judgment (3 O 17493/20, 2022-01-20) awarded €100 under GDPR Art. 82 for dynamically loading Google Fonts without consent; this comes from secondary sources such as wptavern and forge12.

## 7. itch policy texts (WebFetch, 2026-10-14)

- **CSS guide, "External content":** two sentences. External resources (images, fonts) "should" be hosted somewhere reliable with HTTPS support (advice, not a hard rule), or embedded as Base64. The guide never mentions `@import`. It also says: do not trick visitors, do not hide the footer links, do not make the page hard to operate or read, and keep rules inside `#wrapper`.
- **Terms §3 Acceptable Use** prohibits "Soliciting, harvesting or collecting information about others" and "Uploading viruses or malicious code".
- **The privacy policy** does not cover third-party resources that creators embed on their pages.

## 8. Other specs and docs (fetched 2026-10-14)

| Source | Point used |
|---|---|
| drafts.csswg.org/css-cascade-5 (`@import`) | `@import` must come before all rules except `@charset`, `@supports-condition` (newer draft text, checked by the verifier) and `@layer` statements, or it is invalid. A missing Content-Type is treated as `text/css`. Same-origin non-CSS types are allowed only in quirks mode; other types are a network error. A UA "may avoid fetching" while a media condition doesn't match. A false `supports()` must not be fetched. `layer()` puts the rules in a cascade layer. `@import` "does not apply the CORS protocol". |
| html.spec.whatwg.org (links) | A stylesheet whose Content-Type is not `text/css` fails (except same-origin in quirks mode). Parser-inserted sheets are render-blocking. `rel=preconnect` is "body-ok". |
| drafts.csswg.org/cssom-1 | Reading `cssRules` throws `SecurityError` when the sheet's origin-clean flag is unset. |
| drafts.csswg.org/css-cascade-6 | Defines `@import url() scope(<scope-start>)`. Chrome 155 does not support it (see 2c). |
| developer.mozilla.org Mixed_content | Stylesheets and web fonts are blockable mixed content. CSS image `url()` values are upgradable. |
| web.dev/articles/bfcache (updated 2026-09-03) | `Cache-Control: no-store` only matters on the main document. A restored page comes from memory, with no revalidation. |

---

## Verification (2026-10-14)

An adversarial verifier re-checked every fact from primary sources on the same day, without browser-pane tools.

**Method**

- **Live re-fetch with curl:** itch profile, `user.css`, project, jam, `/games`, `/devlogs`, one devlog post, robots.txt; `live.css` ×9 plus encoding, Origin, `http://`, 404 and `/title.css` variants; Google Fonts (16 css2 variants, UA comparison, `text=` kit, `Sec-Fetch-Dest` variants); 9 CDN URLs; 12 fresh project pages.
- **Lab re-run:** a full re-run of the tools on separate ports (8721–8724, CDP 9359), plus the new pages `validity.html` and `bodyscript.html` and a new `reload` scenario. Output is in `results/results-verify.jsonl` and `results/results-verify-logsummary.txt`, made with `analyze_logs.py`.
- **Filter lists:** fresh download of Brave's catalog and all 30 default desktop sources, EasyList Spanish, AdGuard ES and Peter Lowe.
- **Docs:** official docs re-read with WebFetch or raw curl (Vercel ×4, Cloudflare ×3, Netlify, Deno, Brave wiki, itch guide/terms/privacy, MDN, css-cascade-5/6, web.dev, Google css2 docs, jsDelivr README).
- **itch rate limit:** one `HTTP 429 Too Many Requests` (openresty, `text/html`) came back from `leafo.itch.io/x-moon` during a burst of 4 itch requests 1.5 s apart, while other agents were also crawling. A retry a few minutes later returned 200. The verifier made about 25 itch requests in total.

**New lab results (Chrome 155 headless)**

| Page / scenario | Result |
|---|---|
| `validity.html`: `@layer base;` then `@import` | applied (1 request) |
| `@charset "utf-8";` then `@import` | applied |
| `@font-face{…}` then `@import` | **not applied, 0 requests** |
| `@media screen{ @import … }` | **not applied, 0 requests** |
| `@supports (display:grid){ @import … }` | **not applied, 0 requests** |
| the same URL imported twice in one sheet | **1 request** (deduplicated) |
| `@import '<url>';` (string form) | applied |
| `bodyscript.html`: 1,200 ms import in `<head>`, inline script at the end of `<body>` (where itch's `init_User…` and `new I.UserLayout` scripts sit) | script ran at **1,262 ms**; FCP 1,268 ms |
| `reload`: no-store import; navigate, reload, navigate | **3 page loads → 3 CSS requests** (new variant each time) |
| `bf` | `pageshows [false,true]`; 1 page load and 1 CSS request in total (restored from bfcache) |

Reproduced unchanged:

- MIME, status and failure table (standards and quirks)
- the order and conditions table (`o_print`, `o_rm` and `o_wide` requested 1× each; `o_sup_false` and `m_late` 0×)
- font CORS: FA and FD error; FB, FC, FE and FS loaded; every font request `mode=cors` with `Origin` = the page
- CSSOM: `SecurityError` with and without ACAO
- waterfall: w2 arrived +802 ms after w1; p1 +1 ms; inline script at 1,623 ms
- render blocking: block FCP 2,540 ms, noblock 60 ms, refused 36 ms
- scanner: the CSS reached the server −1 ms relative to the script
- Referer table
- stylesheet request headers, including `Sec-Fetch-Storage-Access: active` and `Accept-Encoding: gzip, deflate, br, zstd`
- `scope()`: `media: "scope(#wrapper)"`, `scopeProp: false`
- both preconnects

**Other re-measurements**

- **`live.css`:** 9 more runs, all 200 and all different bodies (14,823–14,852 bytes, br wire 3,278–3,358). Every run `X-Vercel-Cache: MISS` and `x-vercel-id cdg1::iad1::…`; none had ACAO, Vary or Set-Cookie. TTFB 0.202–0.268 s with TLS 0.060–0.129 s (curl opens a new connection per run). No cold start was observed this time.
- **Google css2:**
  - also sends `Vary: Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site,Accept-Encoding`, but the body was byte-identical for `Sec-Fetch-Dest: style`, `document` and `empty`.
  - `Syne:wght@400..900` (upper bound past the font's 800) → 400.
  - `Syne:wght@400..600;500..800` (overlapping ranges) → 400.
  - `display=bogus` → 200 with no `font-display`.
  - Two `text=` parameters → 200; the docs say `text=` "can only be specified once".
- **Profile document headers:** also `Set-Cookie: itchio_token=…; Domain=.itch.io; HttpOnly; Secure`, `X-Cache-Status: HIT` and `CF-RAY …-MAD`. Still no CSP and no Cache-Control.

**Verdicts**

| Fact | Verdict | Note |
|---|---|---|
| 01 | confirmed | custom_css 4,725 chars, identical to `dist/main.min.css` minus its trailing newline; 1 raw `>`, 0 `&gt;` |
| 02 | confirmed | head order re-read; custom_css at offset 2,927 < `</head>` 7,692; the 3 later scripts are at the end of `<body>` |
| 03 | corrected (detail) | current draft also allows `@supports-condition` before `@import`; lab adds the `@layer`, `@charset` and `@font-face` cases |
| 04 | confirmed | |
| 05 | confirmed | gist raw also verified `text/plain` + nosniff (was inferred) |
| 06 | confirmed | only a same-origin 302 was tested |
| 07 | confirmed | |
| 08 | confirmed | −1 ms this run: the two requests are effectively simultaneous |
| 09 | confirmed | |
| 10 | confirmed (inferred) | the end-of-body script test mirrors itch's script positions; the effect on itch is still not measured |
| 11 | confirmed | |
| 12 | confirmed | user.css 71,824 bytes, 0 `@layer`, 0 `@import`, 10 `@font-face` |
| 13 | confirmed | |
| 14 | confirmed | the stored result lacked the `media` field; the re-run has it |
| 15 | confirmed | |
| 16 | confirmed | |
| 17 | confirmed | |
| 18 | corrected | warm 0.18–0.35 s across both runs; the ~1 s cold run was seen once and not reproduced; curl TTFB includes TCP+TLS; the iad1 cause is inferred |
| 19 | confirmed (documented) | |
| 20 | confirmed | the reload refetch is now verified, not just stated |
| 21 | confirmed (documented) | the CDN cache is segmented per region |
| 22 | confirmed (documented) | |
| 23 | confirmed (inferred) | |
| 24 | confirmed (documented) | the "static assets free and unlimited" quote is on the pricing page, not the limits page; the docs don't state the default fail mode |
| 25 | confirmed (documented) | the cited thread now returns 404; similar threads exist |
| 26 | confirmed (documented) | |
| 27 | corrected | 30 default desktop sources, not 26; still no match with all 30 |
| 28 | confirmed (documented) | |
| 29 | corrected | `/advert.css` also matches; the custom-domain advice stays inferred |
| 30 | confirmed | plus cookie-list `custom-cookie-*` filters (new fact) |
| 31 | corrected | header set measured in Chrome only; `sec-ch-ua*` and `Sec-Fetch-Storage-Access` are Chromium-specific |
| 32 | confirmed | lab C origin is same-site with A (no effect on Referer) |
| 33 | confirmed (documented) | applying §3 to CSS beacons is our interpretation |
| 34 | confirmed | jam, `/games`, `/devlogs` and a devlog post also have no CSP |
| 35 | confirmed (documented) | |
| 36 | corrected | the section is 2 sentences and says "should" |
| 37 | confirmed | |
| 38 | confirmed | |
| 39 | confirmed | |
| 40 | confirmed | |
| 41 | confirmed | |
| 42 | confirmed | |
| 43 | confirmed (community) | |
| 44 | confirmed (inferred) | |
| 45 | corrected | a version-less `gh` URL resolves to the latest tag, not the branch |
| 46 | corrected | 57 valid pages, not 60 (2 were 429 pages and 1 a Cloudflare challenge page; second verifier); 69 pages in total with the cross-check |
| 47 | confirmed (inferred) | MDN: `active` = "context has unpartitioned cookie access" |
| 48 | confirmed (inferred) | |

---

## Verification run 2 (2026-10-14, second adversarial verifier)

A second verifier re-checked all 48 facts independently, without browser-pane tools.

**Method**

- **itch, about 22 requests at least 2 s apart:** profile HTML and headers; `static.itch.io` `user.css`, `lib.min.js`, `bundle.min.js` and `user.min.js`; project, jam, `/games`, `/devlogs` and one devlog post (headers); CSS guide, terms and privacy policy. Three 429s came back (jam, terms, devlog post) while other agents were crawling, and a later retry returned 200 for each.
- **Vercel `live.css`:** 9 runs plus encoding, `http://`, 404 and `/title.css` checks. Then 5 paired runs of `/live.css` against `/nope.css`, an edge-only 404, to isolate the function hop.
- **Google Fonts:** 15 css2/css variants, UA comparison, the `text=` kit, and a WOFF2 table-directory parse (a small script in the scratchpad) to check whether variable axes survive subsetting.
- **CDNs:** 9 URLs, plus jsDelivr with a full, 7-char and 12-char commit SHA, and one public gist raw URL (headers only).
- **Lab:** full re-run of `external-tools` in a scratchpad copy on ports 8751–8754, CDP 9389 and a fresh `--user-data-dir`, plus new pages:
  - `redirxo.html`: cross-origin 302 redirects
  - `order2.html`: a layered `!important` import
  - `cookie1.html` / `cookie2.html`: Set-Cookie round trip, with `cookie2` also loaded under the top-level site `127.0.0.2`

  These additions are now in `external-tools` (`server.py` `loc=`/`setcookie=`; `gen.py`; `cdp.mjs` accepts absolute URLs). Outputs: `results/results-verify2.jsonl`, `results-verify2-cookie.jsonl`, `results-verify2-logsummary.txt` (ports 875x there).
- **Filter lists:** fresh download of Brave's `list_catalog.json`. It has 31 `default_enabled` sources, 30 without the iOS-only list, and all 30 were fetched. Also EasyList Spanish, AdGuard ES/PT (uBO), Peter Lowe and Fanboy Annoyances (uBO). Two checks were run:
  - `match_lists.py` over the 30-source set and the combined set
  - an independent literal-substring `grep` that doesn't depend on the matcher's parser

**New measurements**

Lab (Chrome 155 headless):

| Case | Result |
|---|---|
| `redirxo.html`: B → **cross-origin** C 302 → 200 `text/css` | applied |
| B → C 302 → 404 | not applied |
| `order2.html`: `@import … layer(ext)` with `#box{color:red !important}` against unlayered `.b{color:green}` | **red** (important declarations reverse layer order) |
| `cookie1.html`: stylesheet response `Set-Cookie: vis=abc123; Path=/; SameSite=None; Secure` from cross-site B | stored |
| next stylesheet request to B, same top-level site | carried `Cookie: vis=abc123` |
| next stylesheet request to B, **different top-level site** (`http://127.0.0.2:8751`) | **also carried `Cookie: vis=abc123`** (unpartitioned) |
| a `Set-Cookie` without SameSite (Lax default) | never sent cross-site |
| every stylesheet request | `Sec-Fetch-Storage-Access: active` |
| preconnect via `Link` header on the imported CSS | TCP accept on :8753 about 17 ms after the CSS request; the log line is written 3 s later |
| `<link rel=preconnect>` in `<body>` | TCP accept on :8754 about 37 ms after the page request |

Reproduced unchanged:

- MIME/status table, standards and quirks
- the order table (`o_print`, `o_rm`, `o_wide` 1 request each; `o_sup_false`, `m_late` 0)
- validity table (`@font-face`, `@media` or `@supports` before or around an import: 0 requests)
- font CORS (FA and FD error; FB, FC, FE and FS loaded; all `mode=cors` with `Origin` = the page)
- CSSOM `SecurityError` with and without ACAO
- waterfall: w2 +802 ms, p1 +0 ms, inline script at 1,622 ms, FCP 1,632 ms
- render blocking: block FCP 2,540 / noblock 40 / refused 36 ms
- scanner: CSS +0 ms after the script
- `bodyscript`: end-of-body script at 1,222 ms behind a 1,200 ms import
- Referer table
- `scope()`: `media "scope(#wrapper)"`, `scopeProp false`
- `bf`: `[false,true]`, 1 request
- `reload`: 3 loads, 3 CSS requests

`live.css`:

- First run TTFB 0.785 s; then 0.182–0.242 s.
- All 9 bodies different, 14,810–14,850 bytes; br wire 3,278–3,316 bytes.
- No ACAO even with `Origin`, no Vary, no Set-Cookie.
- Paired runs, time after TLS:

  | Path | X-Vercel-Id | Time after TLS |
  |---|---|---|
  | `/live.css` | `cdg1::iad1::…` | 0.127–0.202 s |
  | `/nope.css` (edge only) | `cdg1::…` | 0.025–0.066 s (one outlier 0.188 s) |

  So the Paris → iad1 function path adds roughly 0.1–0.15 s per request.

Google Fonts:

- The `text=Mirokshi` kit still contains `fvar`, `gvar`, `avar`, `HVAR` and `STAT` (20 tables, the same set as the full latin file), so the variable axis survives subsetting.
- Two `text=` parameters → 200 with 1 face.
- `display=bogus` → 200 with no `font-display`.
- Overlapping ranges → 400.

jsDelivr:

- A full SHA is `version-type: commit`, cached 1 year, immutable.
- A **short SHA (7 or 12 chars) is treated as `branch`**, cached 7 days in the browser and 12 h on the CDN.
- A version-less URL resolves to the latest semver tag (`version-type: version`) but gets the branch cache times (7 d / 12 h).

Gist raw: `text/plain; charset=utf-8` + `nosniff`, `max-age=300`.

itch pages:

- No `<meta http-equiv=Content-Security-Policy>` and no `<meta name=referrer>` in the profile, project, jam, devlog-listing or devlog-post HTML.
- Header-level `Referrer-Policy: no-referrer-when-downgrade` on all of them; CSP only on the project page (`frame-ancestors`).

itch JS:

- `lib.min.js` registers `unload` only when `window.top !== window`, which is jQuery's iframe case.
- `bundle.min.js` uses `beforeunload`, which doesn't block bfcache in Chrome.
- Nothing obvious blocks bfcache, but this was not tested in a browser.

Filter lists:

- 30-source set: 133,415 network rules. Combined with the extras: 143,084.
- No match for live.css or title.css, Google Fonts, or `/live.css` on any listed platform.
- `grep` finds **0** lines with `itch-io-custom-css`, `itch.io`, `itch.zone` or `live.css` in any list.
- `/adverts.css` and `/advert.css` match (EasyList generic); `/pixel.gif?` matches (EasyPrivacy).
- Network-line counts per suffix, 30-source set: vercel.app 53 (45 badware/URLhaus), pages.dev 115, workers.dev 40, netlify.app 19, github.io 50, jsdelivr.net 134, deno.dev 0.
- Generic `custom-` cosmetic filters in the 30-source set:
  - EasyList: `##.custom-ad`, `-ad-area`, `-ad-container`, `-ads`, `-advert-banner`, `-sticky-ad-container`
  - Brave First Party: `##.custom-sticky-ad-container`
  - Cookie notice blocker (default-enabled): 9 `custom-cookie…`, `custom-ch-cookie-notice` and `custom-container-lgpd` filters
- The **optional** Fanboy Annoyances (uBO) list adds `##.custom-social`, `##.custom-share-button`, `##.custom-sharing`, `##.custom-sharing-link`, `##.custom-social-share`, `##.custom-social-share-wrapper`, `##.custom-social-widgets`, `##.custom-follow-button`, `##.custom-follow-bar`, `##.custom-tweet-button`, `##.custom-soc`, `##.custom-nav-social-media`, `##.custom-back-to-top`, `###custom-social` and `###custom-tweet-button`.

Docs re-read:

- **css-cascade-5:** `@import` must precede everything except `@charset`, `@supports-condition` and `@layer` statements. A UA "may … avoid fetching" a non-matching conditional import and must not fetch a supports-false one.
- **Mixed Content spec §3.1:** CSS `background-image`/`border-image` are upgradeable unless the host is an IP address. Stylesheets and fonts are blockable. MDN's page is internally inconsistent on CSS images.
- **Cloudflare static-assets billing page:** static-asset requests are "free and unlimited". With `run_worker_first`, Free-plan requests over the limit get **429**.
- **Vercel CDN cache:** `CDN-Cache-Control` / `Vercel-CDN-Cache-Control` with `max-age` also enable CDN caching (not only `s-maxage`). A `Vary: Cookie` response is never cached.
- **Netlify:** the community thread cited in fact 25 returns 404. Many mid-2026 threads report Free-plan production deploys paused with an "operational credits" banner.
- **LG München I, 3 O 17493/20:** confirmed via several secondary sources. The same court later (reported 2023-05-05) held that crawler-driven mass Google-Fonts claims were abusive.

**Verdicts (run 2)**

| Fact | Verdict | Note |
|---|---|---|
| 01 | confirmed | 4,725 chars, identical after rstrip; 1 raw `>`, 0 `&gt;` |
| 02 | confirmed | inline script before `lib.min.js`; the 3 later scripts (1 template + 2 JS) are at the end of `<body>` |
| 03 | corrected | `@supports-condition` is also allowed before `@import` (draft); `@layer` statement and `@charset` verified in the lab |
| 04 | confirmed | |
| 05 | confirmed | gist raw verified `text/plain` + nosniff |
| 06 | confirmed | a cross-origin redirect is now verified too |
| 07 | confirmed | |
| 08 | confirmed | |
| 09 | confirmed | |
| 10 | confirmed (inferred) | mechanism verified (inline script after the style, and at the end of body); the effect on itch's features is not measured |
| 11 | confirmed | |
| 12 | corrected | holds for normal declarations only: a layered `!important` beats unlayered normal declarations (lab `order2.html`) |
| 13 | confirmed | Chrome only |
| 14 | confirmed | |
| 15 | confirmed | |
| 16 | confirmed | |
| 17 | confirmed | |
| 18 | corrected | first request 0.79–1.0 s, warm 0.18–0.35 s; the function path adds about 0.1–0.15 s against an edge-only 404 |
| 19 | confirmed (documented) | |
| 20 | confirmed | itch's bfcache eligibility is still untested |
| 21 | corrected | `CDN-Cache-Control` / `Vercel-CDN-Cache-Control` `max-age` also caches; `Vary: Cookie` is never cached |
| 22 | confirmed (documented) | |
| 23 | confirmed (inferred) | |
| 24 | corrected (detail) | static assets "free and unlimited" (pricing and static-assets pages); not explicitly excluded from the 100k count; `run_worker_first` gives 429 |
| 25 | corrected (evidence) | the cited thread is 404; the docs don't say what happens at 0 credits |
| 26 | confirmed (documented) | |
| 27 | corrected | 30 default desktop sources / 133,415 rules today, not 26 / 131,223; still no match |
| 28 | confirmed (documented) | |
| 29 | corrected | `/advert.css` also matches |
| 30 | confirmed | plus the Fanboy Annoyances `custom-social`/`custom-share*` filters (new fact) |
| 31 | corrected | Chrome-specific header set; the host also receives its own cookies if it set any |
| 32 | confirmed | |
| 33 | confirmed (documented) | |
| 34 | confirmed | covers all 4 page types that take custom CSS (profile, project, jam, devlog post) plus `/games` and `/devlogs`; no meta CSP either |
| 35 | corrected (detail) | the Mixed Content spec confirms it; but the itch guide only *advises* HTTPS ("should"), it doesn't require it |
| 36 | corrected | 2 sentences, advisory "should" |
| 37 | confirmed | |
| 38 | confirmed | |
| 39 | confirmed | |
| 40 | confirmed | variable tables kept in the kit |
| 41 | confirmed | |
| 42 | confirmed | |
| 43 | confirmed (community) | add the 2023 abuse ruling |
| 44 | confirmed (inferred) | |
| 45 | corrected | only a **full** commit SHA is immutable; a short SHA gets branch caching |
| 46 | corrected | 57 valid pages, not 60 |
| 47 | corrected → verified | the cookie round trip and unpartitioned cross-site reuse were tested directly |
| 48 | corrected | sibling imports run in parallel whatever their order; order only sets cascade order |
