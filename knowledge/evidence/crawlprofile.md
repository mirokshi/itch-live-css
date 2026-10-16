# Evidence log: `crawlprofile`, the live DOM of itch.io profile pages (logged out)

- **Date:** 2026-10-14 (all requests between 10:08 and 10:22 UTC).
- **Goal:** document the server-rendered DOM, the `<head>` order, the theme-editor output (`style#user_theme`), the custom-CSS output (`style#custom_css`) and the response headers of **creator profile pages** (`https://<user>.itch.io/`). Compare them with the **community profile** (`https://itch.io/profile/<user>`) and with the logged-in **owner** view.
- **Viewer:** logged out (no cookies sent). Plain `curl` with a desktop Chrome User-Agent. No JavaScript ran, so this is the DOM *before* itch's JS (lazy images, user_tools, carousels).
- **Owner-view source:** the June 2026 export of `mirokshi.itch.io` saved by the profile owner while logged in (private repo `itch-io-custom-css/preview/itch-io.html`, read only). Its `csrf_token` was redacted.
- **Etiquette:** honored `robots.txt` (fetched first; profile pages and browse pages are not disallowed). GET/HEAD only, no logins, no forms. At least 1.2 s between requests at first, then 3 s once 429s appeared. **80 requests** in total: 78 to itch.io plus 2 to the static.itch.io CDN. **6 were answered `429 Too Many Requests`** (openresty). Other crawlers probably shared the IP. Retried pages succeeded after a pause.
- **Raw copies** (third-party HTML/CSS) stayed in the session scratchpad and are **not** in this repo. Only statistics, class/id skeletons and short snippets I wrote myself are recorded here.
- **Tools:** [`crawlprofile-tools/`](crawlprofile-tools/).
  - `fetch.sh` is a polite fetcher that writes the body, the headers and a TSV log.
  - `analyze.py` is a stdlib HTMLParser tree builder. It records the head order, the theme and custom-CSS text, the class and id census inside `#wrapper`, a sanitized skeleton, and the bio, link and grid structure.
  - `cssrules.py` is a crude rule splitter used to grep itch's `user.css`.

## 1. Method / how to re-run

```bash
export OUT=/tmp/crawlprofile/raw; mkdir -p $OUT
T=knowledge/evidence/crawlprofile-tools
curl -s https://itch.io/robots.txt                     # check Disallow list first
$T/fetch.sh https://mirokshi.itch.io/ p_mirokshi       # repo owner, has custom CSS
# sample: creators linked from 4 browse pages (any day's listing works; it changes daily)
for p in games/top-rated game-assets/top-rated tools/top-rated games/newest; do
  $T/fetch.sh https://itch.io/$p browse_${p//\//_}; done
grep -ohE 'https://[a-z0-9-]+\.itch\.io' $OUT/browse_*.html | sort -u   # ~130 subdomains
# fetch ~55 of them as p_<user> (seeded random pick; strip CR if the list was written on Windows!)
$T/fetch.sh https://itch.io/profile/<user> cp_<user>   # community profile, 4 users
python -I $T/analyze.py $OUT p_ analysis.json           # per-page JSON
python -I $T/cssrules.py $OUT/static_user_css.html has_banner text_header mode_column ...
```

Extra probes, one request each:
- `curl -I` (a HEAD request).
- A GET without `Accept-Encoding`.
- A GET with `Accept-Encoding: br, gzip`.
- An Android Chrome User-Agent.
- `Accept-Language: es-ES`.
- `http://` to check the redirect to https.
- A subdomain that does not exist.
- `https://static.itch.io/user.css?<build>` and `https://static.itch.io/fonts.json`.

Pitfall I hit: the sample list was written by Python on Windows with CRLF line endings, so `curl` received URLs ending in `\r` and returned code `000` without sending anything. Strip CR first.

Second pitfall (found in verification pass 2): `fetch.sh` uses `curl -L`, which hides redirects. Check the first status line in the saved `.headers` file (or fetch without `-L`) before classifying a subdomain.

**Sample:** 57 subdomains fetched, 55 with a usable 200 response, plus mirokshi. 2 stayed at 429 after retrying.
- 51 were **creator profiles**: `data-page_name="user"`, with `#wrapper`.
- 4 were **not creator pages**: the subdomain answered `302 Found` with `Location: https://itch.io/profile/<user>` (the community profile). `fetch.sh` follows redirects (`curl -L`), so the saved body is the community profile, not a page served on the subdomain. Correction from verification pass 2; see §7.

To avoid recording personal data, small creators are listed as `creator-NN` in the table below. Well-known accounts are named because their pages are useful as evidence:
- `leafo` (itch.io founder).
- `kenney`, `pixel-boy`, `pizzadoggy`, `prominent`, `dacap` (Aseprite), `nesbox` (TIC-80), `thorbjorn` (Tiled), `terrycavanagh`, `ncase`, `adamgryu`, `mikeklubnika`, `alienmelon`, `kaylousberg`, `azagaya`, `deep-fold`, `game-endeavor`.
- `mirokshi` (the owner of the private repo).

## 2. Per-page results (51 creator pages + 4 subdomains that redirect to the community profile)

Columns:
- **`.user_page` modifiers:** the classes after `user_page page_widget base_widget`.
- **banner:** the banner img has a `src`.
- **links:** the number of `.link_group` spans.
- **bio:** `.user_profile.formatted` exists.
- **cols:** `.columns` and `.game_column` exist.
- **cells:** the number of `.game_cell` elements.
- **sections:** the `<section>` children of `.user_page`.
- **ftr:** the number of footer links.
- **css:** the length of `style#custom_css` in characters.

| page | `.user_page` modifiers | banner | links | bio | cols | cells | sections | ftr | css |
|---|---|---|---|---|---|---|---|---|---|
| creator-01 | mode_grid has_banner | Y | 3 | - | Y | 60 | collections | 2 | - |
| adamgryu.itch.io | mode_grid | - | 3 | Y | Y | 19 | - | 2 | - |
| creator-02 | mode_grid | - | 3 | - | Y | 1 | - | 2 | - |
| alienmelon.itch.io | mode_grid has_banner | Y | 5 | Y | Y | 127 | collections | 2 | 2189 |
| creator-03 | 302 → `itch.io/profile/<user>` (community profile) | n/a | | | | | | | |
| creator-04 | mode_grid has_banner | Y | 1 | Y | Y | 6 | - | 2 | - |
| creator-05 | mode_column | - | 0 | - | Y | 5 | - | 1 | - |
| azagaya.itch.io | mode_grid | - | 3 | - | Y | 27 | collections | 2 | - |
| creator-06 | mode_column mode_show_purchases | - | 0 | Y | **-** | 42 | collections | 1 | - |
| creator-07 | mode_grid | - | 3 | Y | Y | 6 | - | 2 | - |
| creator-08 | mode_column | - | 1 | - | Y | 32 | - | 2 | - |
| creator-09 | mode_grid has_banner | Y | 3 | Y | Y | 29 | collections | 2 | - |
| dacap.itch.io | mode_grid has_banner | Y | 3 | Y | Y | 11 | collections | 2 | - |
| creator-10 | mode_grid has_banner | Y | 5 | Y | Y | 9 | - | 2 | 2520 |
| deep-fold.itch.io | mode_grid mode_collection_grid | - | 1 | Y | **-** | 12 | collections | 2 | - |
| creator-11 | mode_column | - | 0 | - | Y | 1 | - | 1 | - |
| creator-12 | mode_grid | - | 1 | Y | Y | 6 | - | 1 | - |
| game-endeavor.itch.io | mode_grid has_banner mode_collection_grid | Y | 3 | Y | Y | 7 | collections | 2 | - |
| creator-13 | mode_grid has_banner mode_show_purchases | Y | 3 | Y | Y | 53 | collections | 2 | - |
| creator-14 | mode_grid has_banner mode_collection_grid | Y | 4 | - | Y | 30 | collections | 2 | - |
| creator-15 | mode_grid mode_collection_grid | - | 1 | Y | Y | 35 | collections | 2 | 449 |
| creator-16 | 302 → `itch.io/profile/<user>` (community profile) | n/a | | | | | | | |
| creator-17 | mode_grid | - | 2 | - | Y | 24 | - | 2 | - |
| creator-18 | mode_column | - | 2 | Y | Y | 8 | - | 2 | - |
| kaylousberg.itch.io | mode_grid has_banner | Y | 5 | Y | Y | 38 | collections | 2 | - |
| kenney.itch.io | mode_grid has_banner | Y | 5 | Y | Y | 24 | collections | 2 | 414 |
| leafo.itch.io | mode_column has_banner mode_show_purchases | Y | 5 | Y | Y | 67 | purchased_games collections | 2 | - |
| creator-19 | mode_grid has_banner mode_collection_grid | Y | 2 | Y | Y | 1 | - | 2 | 1765 |
| creator-20 | mode_column | - | 3 | Y | Y | 13 | - | 2 | - |
| creator-21 | mode_grid has_banner | Y | 5 | Y | Y | 6 | - | 2 | - |
| creator-22 | 302 → `itch.io/profile/<user>` (community profile) | n/a | | | | | | | |
| mikeklubnika.itch.io | mode_grid | - | 2 | Y | **-** | 0 | - | 2 | - |
| mirokshi.itch.io | mode_grid | - | 1 | Y | Y | 5 | - | 2 | 4725 |
| creator-23 | mode_grid has_banner | Y | 0 | - | Y | 2 | - | 1 | - |
| creator-24 | mode_grid has_banner | Y | 3 | - | Y | 6 | - | 2 | - |
| ncase.itch.io | mode_column | - | 3 | Y | Y | 4 | - | 2 | - |
| creator-25 | 302 → `itch.io/profile/<user>` (community profile) | n/a | | | | | | | |
| nesbox.itch.io | mode_grid | - | 3 | - | Y | 26 | collections | 2 | - |
| creator-26 | mode_grid mode_show_purchases | - | 3 | Y | Y | 33 | purchased_games | 2 | - |
| creator-27 | mode_grid | - | 2 | Y | Y | 15 | collections | 2 | - |
| creator-28 | mode_grid has_banner mode_collection_grid | Y | 2 | - | Y | 5 | - | 2 | - |
| creator-29 | mode_grid | - | 2 | - | Y | 6 | - | 2 | - |
| pixel-boy.itch.io | mode_grid has_banner | Y | 3 | Y | Y | 60 | collections | 2 | 2558 |
| pizzadoggy.itch.io | mode_grid has_banner mode_collection_grid | Y | 1 | Y | Y | 53 | collections | 2 | **5116** |
| creator-30 | mode_column | - | 0 | - | Y | 1 | - | 1 | - |
| prominent.itch.io | mode_grid mode_collection_grid | - | 3 | Y | Y | 40 | collections | 2 | - |
| creator-31 | mode_grid has_banner | Y | 3 | Y | Y | 32 | collections | 2 | 4690 |
| creator-32 | mode_grid | - | 4 | Y | **-** | 81 | collections | 2 | - |
| creator-33 | mode_column | - | 4 | Y | Y | 31 | collections | 2 | - |
| creator-34 | mode_column has_banner | Y | 1 | Y | Y | 3 | collections | 2 | - |
| creator-35 | mode_grid | - | 1 | - | Y | 13 | - | 2 | - |
| creator-36 | mode_grid | - | 3 | Y | Y | 2 | - | 2 | - |
| creator-37 | mode_column has_banner | Y | 2 | Y | Y | 3 | - | 2 | - |
| terrycavanagh.itch.io | mode_grid has_banner mode_collection_grid | Y | 2 | Y | **-** | 18 | collections | 2 | - |
| thorbjorn.itch.io | mode_column | - | 3 | Y | Y | 46 | collections | 2 | - |

**Totals over the 51 creator pages:**

| Feature | Pages |
|---|---|
| `mode_grid` | 38 |
| `mode_column` | 13 |
| `has_banner` | 23 |
| `mode_collection_grid` | 9 |
| `mode_show_purchases` | 4 |
| bio present | 36 |
| `.columns` present | 46 (5 without: no visible own projects) |
| `user_links` empty | 5 |
| footer with "Community profile" link | 45 (exactly the pages whose `user_links` has `a.internal_link`) |
| theme uses a Google font (`<link>` emitted) | 17 |
| theme background image | 11 |
| `style#custom_css` present | 9 |
| custom CSS scoped entirely under `#wrapper` | 1 (mirokshi). pixel-boy mixes scoped and unscoped rules. 8/9 have unscoped selectors (corrected from 7/9). |
| `section.collections` present | 25 (verification count; not 26) |
| custom CSS with `@import` | 2 |

## 3. `<head>` order (cascade order)

The order was identical in all 51 creator pages. Optional items are in [brackets]:

```
1  <link rel=stylesheet href="https://static.itch.io/user.css?<build>">
2  <script> window.itchio_translations_url = ... </script>
3  <script src=".../lib.min.js?<build>">
4  <script src=".../bundle.min.js?<build>">
5  <script data-src=".../react.min.js?<build>" id="lib_react_src">   (lazy; not executed)
6  <script src=".../user.min.js?<build>">
7  <script> I.current_user = null; I.subdomain = true; </script>
8  <script> gtag(...) </script>
9  <style id="user_theme" type="text/css"> ...theme editor output... </style>
10 [<link rel=stylesheet href="https://fonts.googleapis.com/css?family=<Font>%3A400%2C400italic%2C700%2C700italic">]  (only if the theme font is a Google font)
11 [<style id="custom_css" type="text/css"> ...your CSS, verbatim... </style>]  (only if CSS was saved)
</head>
```

The four observed variants are present or absent combinations of items 10 and 11:

| Variant | Pages |
|---|---|
| neither | 29 |
| font only | 13 |
| CSS only | 5 |
| font + CSS | 4 |

Everything up to and including `style#user_theme` was identical in all 51 pages (1 distinct prefix).

Owner view (export, logged in) differs in these ways:
- `<link href="https://static.itch.io/theme_editor.css?...">` comes right after the translations script.
- `react.min.js` loads eagerly, and `theme_editor.min.js` is added.
- `I.current_user = {"id": …}`.

Items 9 to 11 are in the same order in both views. The page has **no `<link>` or `<style>` after `style#custom_css`**. Custom CSS is therefore the last author stylesheet, and it wins every tie in specificity. Sheets that it pulls in with `@import` are inserted *before* its own rules, at the position of the `<style>`.

Cache-busting `<build>` values seen:
- `1780793839` (June export).
- `1791970861` (2026-10-14, about 2026-10-14 09:41 UTC). `user.css` has `Last-Modified: Tue, 06 Oct 2026`, `Cache-Control: max-age=86400`.
- `1791981660` (2026-10-14 13:05 UTC, verification pass 2). The number changed within the same day, but `user.css?1791981660` is **byte-identical** (71,824 bytes, `cmp`) to `user.css?1791970861`, with the same `Last-Modified`. The number is a site-wide deploy stamp, not a version of `user.css`.

## 4. `style#user_theme` (theme editor output)

All 51 pages normalize, once colors, fonts, sizes, radius and URLs are masked, to **one fixed template**. The only differences are whether `.user_page_wrap{…}` and `.header .image_header img{…}` are empty. Shape of the emitted CSS (my paraphrase; `$bg`, `$text`, `$link` are the three editor colors):

```css
:root{--itchio_ui_bg: mix($bg 20%, #333 80%);}
body{background-color: $bg;}
.user_page{--itchio_font_family:F;--itchio_link_color:$link;--itchio_gray_back:shade($bg);
  --itchio_border_radius:Npx;color:$text;font-size:N%;font-family:F,Lato,LatoExtended,sans-serif;
  hr{…} .user_links .svgicon{fill:$text} .game_column,.purchased_games,.collection_row{border-color:…}}
.user_page_wrap{ /* empty, or background-image/-repeat/-position/-attachment longhands */ }
.header .image_header img{ /* empty, or width: 100% */ }
.user_page a,.footer a{color:$link}  .footer{border-color:…}
.game_grid_widget .game_cell{ .game_thumb,.gif_overlay{border-radius:Npx} .game_title a.title{color:$link}
  .web_flag{color:$text;background:…} .game_text,.game_author{color:$text/.75} .game_platform,.game_genre{color:$text/.5} }
```

Observations:
- **Native CSS nesting** is used, including the bare type selector `hr{`. This needs the "relaxed" nesting syntax: Chrome/Edge 120+, Firefox 117+, Safari 17.2+ (caniuse `css-nesting`: Chrome 112–119 and Safari 16.5–17.1 are only "partial").
- **No ID selectors**, so every theme rule has class-level specificity. For example, the nested game-title rule expands to `.game_grid_widget .game_cell .game_title a.title`, which is (0,4,1). Any `#wrapper …` selector wins.
- **`--itchio_ui_bg` is verified numerically.** With BG `#0b1433`, 0.2·bg + 0.8·#333 = `#2b2c33` per channel, which is the emitted value. In `user.css`, `--itchio_ui_bg` is consumed only by the **site header** (`.header_widget .primary_header`, `.header_widget .header_dropdown`, …). Logged-out profile pages do not render that header.
- **Background block.** The block is empty on 40/51 pages. Otherwise it holds `background-image: url(https://img.itch.zone/…/original/…); background-repeat: <r>; background-position: <p>[; background-attachment: fixed]`, joined with `; ` and without a final semicolon.
  - Combinations seen in the 11 pages:

    | repeat | position | fixed | pages |
    |---|---|---|---|
    | no-repeat | `50% 0` | yes | 4 (mirokshi among them) |
    | no-repeat | `50% 0` | no | 1 |
    | repeat | `50% 0` | no | 3 |
    | repeat | `50% 0` | yes | 2 |
    | **repeat-x** | `0 0` | no | 1 |

  - The owner-export template maps the alignment option to `0 0` (default), `50% 0` (center) or `100% 0` (right), and defaults repeat to `repeat`.
  - The image is painted on `.user_page_wrap`, which is the same element as `#wrapper`.
- **Header image option.** `width: 100%` appeared on 4/51 pages. Otherwise the block is empty, and user.css keeps the banner at its intrinsic size: `max-width:100%; max-height:1024px; width:auto`.
- **Font size.** 30/51 pages use 100%. The others range from 75% to 175%. user.css sets body to 14px, so 100% means 14px, and the bio (`.user_profile.formatted{font-size:1.1428571429em}`) is 16px.
- **Border radius.** 32/51 pages use 0px. Values from 3 to 29px were also seen.
- **Fonts.**
  - Seen: Lato ×30 (built in, no `<link>`), sans-serif ×2, `'04b_03'` ("Pixel", built in) ×2, and 17 pages with Google families such as Josefin Sans, Oswald, Ubuntu, Roboto Slab and Quicksand.
  - Google fonts are loaded through the **CSS API v1** with **only 400, 400italic, 700 and 700italic**.
  - `user.css` itself has `@font-face` for Lato 400/400i/700/900, LatoExtended 400/400i/700/900, `'04b_03'` and `icomoon` (the icon font).
  - `https://static.itch.io/fonts.json` (the editor's list) has **1725 families**, in the categories display, handwriting, monospace, sans-serif and serif.
- **Template source.** The owner export embeds the editor config `init_UserThemeEditor(... {"css_template": ..., "image_size_limit": 3145728, "can_use_css": true, "fonts_url": ".../fonts.json", "theme": {bg_color, layout:"grid", font_size, text_color, border_radius, link_color, font_family, game_order, hidden_games, css}})`.
  - `layout` maps to `.user_page.mode_<layout>`.
  - `css` is the custom CSS string.
  - `image_size_limit` 3145728 is a 3 MiB background upload cap.

## 5. `style#custom_css` (your CSS)

- The element exists only when CSS has been saved: 9/51 pages. There is no empty placeholder.
- **The output is verbatim.** The live mirokshi block, 4725 characters, is byte-identical to the repo's `dist/main.min.css` minus its trailing newline. There is no minification, no rewriting and no HTML escaping: `>` in `.text_header>h1` and the `"` quotes are kept. Other pages keep their comments (`/* */`) and hundreds of newlines.
- **Line endings: 0 CR bytes** in all 8 multi-line samples, while the bios on 6 of those 8 pages contain CRs (correction: not all 8). CRLF looks normalized to LF on save. This is observed, not tested.
- **Not all ASCII** (correction): creator-19's sheet is 1765 characters but 1767 UTF-8 bytes (it contains a Portuguese "ú" twice). The other 8 are pure ASCII.
- **Largest observed: 5116 characters** (pizzadoggy). This matches the ~5120-character editor cap.
- **`</style>` is stripped.** One creator pasted an entire HTML document (`<!DOCTYPE html>…<style>…</style></head><body>…</html>`) into the editor. The page outputs everything *except* the user's `</style>`. The trailing `</head><body>…</html>` text ends up as junk inside the CSS, and itch's own `</style>` closes the block. The pasted `<!DOCTYPE…><html>…<style> body` was parsed as the prelude of the first rule, so that rule was dropped.
- **No scoping and no validation.**
  - 7/9 sheets contain selectors outside `#wrapper`: bare `a`, `body`, `.game_cell`, `.footer`, `.user_page`, `.header_widget .game_search`, `.owner_tools`, `.user_tools`. They are served unchanged.
  - Correction (verification): it is **8/9**, not 7/9. Every sheet except mirokshi's has at least one selector without a `#wrapper` prefix; pixel-boy has 25 of 26 unscoped.
  - Some target the logged-in site header, which suggests that logged-in visitors who are not the owner do see `.header_widget` on profiles. This is unverified.
  - One sheet targets `.collection_list_widget`, which **does not exist** in today's DOM. itch's markup changed and that CSS silently stopped matching.
- **`@import`:** 2/9 use it, always at character 0:
  - Google Fonts `css?family=`.
  - `css2?family=` together with a non-Google HTTPS host (Vercel).
- **`url()` targets seen:** `img.itch.zone` (3 pages: images uploaded to itch), `data:image/svg+xml` (1), and the two imports above.
- **Feature counts:** `!important` in 6/9 sheets, `@keyframes` in 7/9, `@media` in 2/9, `@font-face` in 0/9, `var(--itchio_*)` in 0/9.

## 6. Response headers (creator profile, logged out)

These were checked with `grep -i` over every saved `*.headers` file.

| Header | Value |
|---|---|
| `Content-Security-Policy` | **absent in all 72 captured header sets** (59 profile/community 200s, 429s, HEAD, static, 404). External `@import`, fonts and images are not blocked by CSP. |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `no-referrer-when-downgrade` |
| `Cache-Control` / `Strict-Transport-Security` / `Permissions-Policy` / COOP / COEP | absent |
| `Set-Cookie` | `itchio_token=…; Path=/; Domain=.itch.io; HttpOnly; Secure` on every logged-out GET and HEAD. The same token appears in `<meta name="csrf_token">`. |
| `Content-Encoding` | `gzip` (also when `br` is offered). Uncompressed + chunked when no `Accept-Encoding`. `vary: accept-encoding`. |
| `X-Cache-Status` | HIT 14, MISS 14, EXPIRED 31, BYPASS on HEAD. **Correction (verification):** the page *body* is cached server-side for a few minutes. The widget ids stay identical across requests under `HIT` (mirokshi: the same `user_N` from 10:31:42 to 10:35:40, then a new one from 10:36:41 to 10:39:44). Only the csrf token (`<meta name="csrf_token">` + `Set-Cookie`) is per request; its embedded timestamp equals `Date`. The earlier "ids differ on every fetch" came from comparing fetches 9 minutes apart. |
| `Server` | `cloudflare`, `cf-cache-status: DYNAMIC` |
| `http://` | `301` → `https://<user>.itch.io/` |
| 429 body | `openresty`. No `Retry-After`. |

## 7. Subdomain creator page vs community profile

| | `https://<user>.itch.io/` (creator page) | `https://itch.io/profile/<user>` (community profile) |
|---|---|---|
| `body[data-page_name]` | `user` | `community.profile` |
| stylesheet | `user.css` | `main.css` |
| `style#user_theme` | yes | **no** |
| `style#custom_css` | yes, if saved | **no** (checked for kenney, pixel-boy, mirokshi and one more, all of which have custom CSS on the subdomain) |
| `#wrapper` | `div.user_page_wrap#wrapper` | absent: `div.main > div.inner_column > div#community_profile_N.community_profile_page` |
| site header | absent when logged out | present (`div#header_N.header_widget`) |
| bio | `.user_profile.formatted` | not shown |
| canonical | (none) | `<link rel=canonical href="https://<user>.itch.io">` |

Accounts **without a creator page** (players or curators found as collection authors on browse pages; 4/55) do **not** get a page on their subdomain. `https://<user>.itch.io/` answers **`302 Found` → `https://itch.io/profile/<user>`** (seen in the first pass's own `.headers` files for all 4, and re-fetched without `-L` in verification pass 2). The first pass followed the redirect and misread the result as "community profile served on the subdomain". The page they land on is the ordinary community profile:
- `data-page_name="community.profile"`, `main.css`, `community.min.js`. `<meta name="robots" content="noindex">` is on only **2 of the 4** (correction).
- No `#wrapper`, no theme and no custom CSS.
- Its `<link rel=canonical>` still points to `https://<user>.itch.io`, the URL that redirects.

On those pages the creator-page selectors do not exist at all.

## 8. Logged-out vs owner (inferred from the June export plus the live page)

| | Logged out (live) | Owner (export) |
|---|---|---|
| body classes | `locale_en user_layout_widget layout_widget responsive no_theme_toggle` (order varies between responses) | same + `has_header` |
| body children | `ul#user_tools.user_tools.hidden` (one `li > a.action_btn` "Follow <name>" → itch.io/login), `div#wrapper`, `script#loading_lightbox_tpl`, 2 inline scripts | `div#user_profile_header_N.user_profile_header_widget.header_widget.base_widget.gray.small_logo` (site header with `.header_buttons.owner_tools` "Edit profile" / "Edit theme"), then `div.theme_editor_columns > div#user_theme_editor_N + div.theme_editor_primary_column > div#wrapper` |
| hidden content | not rendered: mirokshi live has no collections or purchases section | rendered for live toggling: `div.collection_row[style="display: none"]`, `section.purchased_games` present but hidden by `.user_page:not(.mode_show_purchases) .purchased_games{display:none}`, hidden game `div.game_cell[style="display: none"]` |
| scroll container | the viewport | when the editor is open, `.theme_editor_columns{height:calc(100vh - 50px)}` and `.theme_editor_primary_column{overflow:auto}` (user.css) make the column the scroller |

Mobile User-Agent: the DOM is identical to the desktop one apart from random ids and the csrf token. `Accept-Language: es-ES` still gives `locale_en` and `lang="en"`.

## 9. Sanitized canonical DOM skeleton (classes and ids only; `N` = random number)

```
html[lang=en]
 body.locale_<xx>.user_layout_widget.layout_widget.responsive.no_theme_toggle[.has_header*]
     [data-host=itch.io][data-page_name=user]
  ul#user_tools.user_tools.hidden                    (logged-out only; position:fixed top-right; OUTSIDE #wrapper)
    li > a.action_btn > svg.svgicon.icon_itchio_new
  div#user_profile_header_N.user_profile_header_widget.header_widget ... (*owner/logged-in only)
  div.theme_editor_columns > div.theme_editor_primary_column          (*owner only; wraps #wrapper)
  div#wrapper.user_page_wrap                         ← theme background-image is painted HERE
    div#user_N.user_page.page_widget.base_widget.mode_grid|mode_column[.has_banner][.mode_collection_grid][.mode_show_purchases]
      div#profile_header.header                      (always)
        div.image_header                             (display:none unless .has_banner)
          img.profile_banner                         (no src/width/height when no banner; never has alt)
        div.inner_column.text_header                 (display:none when .has_banner)
          h1                                         (display name; always present)
      div.inner_column.profile_content
        div.columns                                  (absent when no visible own projects — 5/51)
          div.column.profile_column
            div#user_links_N.user_links.user_links_widget.base_widget   (always; may be :empty)
              span.link_group > svg.svgicon.icon_itchio_new + a.internal_link[rel=me]      (itch community profile)
              span.link_group > svg.svgicon.icon_twitter|icon_bluesky|icon_mastodon|icon_threads + a[rel=me]
              span.link_group > span.icon.icon-link + a[rel="nofollow me"]                (website)
            div.user_profile.formatted               (bio; absent when empty — 36/51 present)
          div.column.game_column
            div.game_grid_widget.base_widget.user_game_grid
              div.game_cell.has_cover.lazy_images[.is_owner][data-game_id][dir=auto]   (see cell below)
        (when no .columns: user_links + user_profile are direct children of .profile_content)
      section.purchased_games                        (only some pages; hidden unless .mode_show_purchases)
        div.inner_column > h2 + div.carousel_wrapper > div.game_grid_widget.base_widget.game_list > div.game_cell…
      section.collections
        div.collection_row[data-collection_id]       (×N)
          div.inner_column
            h2 > a
            p.collection_description                 (optional)
            div.carousel_wrapper > div.game_list_widget.game_grid_widget.base_widget.game_list > div.game_cell…
    div.footer                                       (sibling of .user_page, inside #wrapper)
      div.footer_inner > a[href="https://itch.io/"] [· a "Community profile"]

game cell:
div.game_cell.has_cover.lazy_images[.is_owner]
  div.game_thumb[style="background-color:#hex;"]   (inline style on 1103/1184 thumbs, absent on 81)
    a.thumb_link.game_link[tabindex=-1]
      img.lazy_loaded[data-lazy_src][width=315][height=250]   (no src until JS)
      [div.gif_label] [div.gif_overlay[data-gif]]              (animated covers)
      [div.no_cover_text > span.icon.icon-star2]               (no cover; cell lacks .has_cover)
  div.game_cell_data
    div.game_title > a.title.game_link
        [div.price_tag.meta_tag > div.price_value]
        [a.price_tag.meta_tag[.sale] > [div.price_value] + div.sale_tag]   (114 cells: 66 div / 27 a.sale / 21 a without .sale; 2 a.sale have no price_value)
    [div.game_text[title]] div.game_author > a  [div.game_genre]
    [div.game_platform > span.web_flag | span.icon.icon-windows8|icon-apple|icon-tux|icon-android]
```

Cell census across 1184 cells:
- 915 `has_cover`, 266 `is_owner has_cover`, 3 without a cover.
- `game_cell_data` children come in 8 orderings. `game_title` and `game_author` are always present. `game_text`, `game_genre` and `game_platform` are optional.

Bio census across 36 bios:
- Classes seen are only `text-center` (11 bios) and `custom-*` (the verifier's parser counts 5 bios and 22 distinct classes; the first pass said 6 and 21).
- External `<a>` (80 of 80) get `rel="nofollow noopener" referrerpolicy="origin"`, sometimes with `target=_blank`. Links to `*.itch.io` (35 of 35) get no `rel`.
- Every `<img>` (42 of 42) gets `loading="lazy"`.
- Inline `style=""` attributes survive in 11 bios.
- Tags seen: p, a, br, img, strong, em, span, h1–h4, div, figure, ul/li, table/tbody/tr/td, blockquote, hr, u, font.

## 10. Relevant `user.css` rules (paraphrased; selectors exact)

- `.user_page_wrap{display:flow-root;position:relative;padding-bottom:50px}`
- `.footer{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #dadada;font-size:12px}`
- `.footer .footer_inner{max-width:960px;padding:10px 20px;margin:0 auto}`
- `.inner_column{max-width:960px;margin:0 auto;padding:0 20px}`
- `.user_page .header .image_header{display:none}`, `.user_page.has_banner .header .image_header{display:block}`, `.user_page.has_banner .header .text_header{display:none}`, `.user_page .text_header>h1{font-size:2.43em;margin:40px 0 5px}`
- mode_column:
  - `.user_page.mode_column .columns{display:flex;min-height:400px}`, with children `position:sticky;top:10px`.
  - `.game_column{width:315px;margin-left:40px}`.
  - ≤800px: the layout stacks, and `.user_game_grid` becomes a horizontal scroller.
- `.user_page:not(.mode_show_purchases) .purchased_games{display:none}`
- `.user_page.mode_collection_grid .game_grid_widget.game_list{display:grid}`, with `.game_cell:nth-child(n+21){display:none}`, so at most 20 cells are shown.
- `.user_page .game_grid_widget.user_game_grid .game_cell .game_author{display:none}`
- Carousels (added in verification):
  - `.user_page .game_grid_widget.game_list .game_cell.is_owner .game_author{display:none}`.
  - `.user_page .game_grid_widget.game_list .game_cell:not(.is_owner)` hides `.price_flag`, `.game_text`, `.game_genre`, `.game_platform` and `.game_promo`.
  - `.game_grid_widget.game_list{display:flex}`, with `>.game_cell{width:200px;flex:none;margin-bottom:20px}`.
- Default grid (added in verification): `.game_grid_widget{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));grid-gap:25px var(--itchio_grid_gap,10px);align-items:start}`, and `.user_page .game_grid_widget{font-size:1.1428571429em}`.
- Carousels: `.carousel_wrapper{overflow-x:auto;scrollbar-color:var(--itchio_link_color) var(--itchio_gray_back);scrollbar-width:thin}`
- `.user_links_widget{display:flex;gap:2px 12px;flex-wrap:wrap}`, `.user_links_widget:empty{display:none}`
- `.user_tools{position:fixed;top:0;right:0;z-index:2}`. At ≥960px, `.user_tools.hidden{opacity:0;transform:translate(0,-20px)}`. `.has_header .user_tools{top:50px}`.
- `:root` defaults: `--itchio_white_back:#fff; --itchio_gray_back:#F4F4F4; --itchio_bg_color; --itchio_body_color:#222; --itchio_border_color:#dadada; …`. The profile theme overrides only `--itchio_gray_back`, `--itchio_link_color`, `--itchio_font_family` and `--itchio_border_radius` (on `.user_page`), plus `--itchio_ui_bg` (on `:root`).
- No rule targets `#wrapper` or `.mode_grid`; grid is simply the default.

## 11. Open questions (not answerable logged out)

1. **Logged-in non-owner visitors.** Do they get `body.has_header` and the site header `.header_widget`? Third-party CSS targets `.header_widget .game_search` and `.owner_tools`, which suggests they do.
2. **CRLF and the ~5120 cap.** Does the cap count CRLF as 2 characters before the LF normalization?
3. **`</style>` stripping.** Does it happen on save or on render? Are other sequences such as `<script` or `<!--` altered?
4. **Freshness after saving CSS.** Is it immediate for logged-out visitors? The HTML is fresh per request, but `X-Cache-Status` exists.
5. **Hidden games.** Are games hidden through the theme editor omitted from logged-out HTML? The owner export renders them with `display:none`.
6. **Other background-repeat values.** Does the editor offer values other than repeat, no-repeat and repeat-x, and right alignment (`100% 0`)?
7. **Body classes.** Does `body.dark_theme` or a non-`en` `locale_xx` ever appear on profile pages, for example through the language picker?

## Verification (2026-10-14)

An adversarial second pass, run 10:31–10:41 UTC. It used its own fetcher and its own parser and did not reuse `analyze.py`. Its scripts are in [`crawlprofile-tools/verify/`](crawlprofile-tools/verify/):
- `tree.py`: a stdlib DOM builder.
- `census.py`: a structural census.
- `customcss.py`: statistics on `style#custom_css`.
- `owner_export.py`: parses `init_UserThemeEditor(…)` from the owner export.
- `vfetch.sh`: a polite fetcher.
- `cacheprobe.sh`: 10 GETs, 30 s apart.

### Method

1. **Fresh primary fetches (logged out, GET, 3 s or more apart).**
   - `robots.txt` (unchanged).
   - `mirokshi.itch.io` twice in a row.
   - `kenney`, `leafo`, `mikeklubnika`, `deep-fold`, `terrycavanagh`, `pixel-boy`, `pizzadoggy` and `alienmelon`.
   - `itch.io/profile/kenney` and `itch.io/profile/mirokshi`.
   - `zz-no-such-user-9q7x.itch.io`.
   - `static.itch.io/user.css?1791970861` and `static.itch.io/fonts.json`.
   - `http://mirokshi.itch.io/` and `kenney.itch.io` with `Accept-Encoding: br, gzip`.
   - The cache probe.
   - About 26 requests to itch.io and 3 to static.itch.io. Two cache-probe requests got **429 even at 30 s spacing**, because other agents share the IP.
2. **Re-analysis.** The first pass's 55 saved pages were re-analysed with the independent parser (`python -I census.py <raw> p_`), plus the 9 fresh creator pages.
3. **user.css.** Split into 675 rules and grepped for every rule cited.
4. **Owner export.** `owner_export.py` was run on the read-only owner export to get the theme JSON, `css_template` and built-in font list.
5. **caniuse.** `curl https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/css-nesting.json` → Chrome/Edge 112–119 and Safari 16.5–17.1 are partial (note 3: no bare type selectors), with full support from Chrome/Edge 120, Firefox 117 and Safari 17.2.

### Results that changed facts

**Cache.**
- Ids stay stable while the cached body lives:

  | time (UTC) | X-Cache-Status | `#user_N` |
  |---|---|---|
  | 10:31:42 / 10:31:46 | HIT / HIT | 5873780 |
  | 10:35:10 / 10:35:40 | HIT / HIT | 5873780 |
  | 10:36:41 … 10:39:44 (5 GETs) | HIT | 7179622 |

- Earlier fetches by the first pass:
  - 10:08:00 → 1446967.
  - 10:16:58 → 3493491.
  - 10:20:51 (EXPIRED) and 10:21:17 → 9390667.
- The csrf token was different on every request.
- **Conclusion:** the logged-out body is cached server-side for about 5 minutes, and the token is injected per request.

**Thumbs.** 1103 of 1184 `.game_thumb` have the inline `background-color`; 81 do not.

**Carousels.**
- All 266 `.is_owner` cells are in carousels. None of the 469 own-grid cells has it.
- 246 of the 266 have a `.game_author` link to the profile's own subdomain.
- user.css hides `.game_author` on `.is_owner` carousel cells. On non-owner carousel cells it hides `.game_text`, `.game_genre`, `.game_platform`, `.price_flag` and `.game_promo`.

**Price tags.** 114 cells, not 112:
- 66 `div.price_tag`.
- 27 `a.price_tag.sale`.
- 21 `a.price_tag` without `.sale`, which still has a `sale_tag`.
- 2 `a.sale` with no `price_value`.

**Collections.** `section.collections` is on 25 of 51 pages, not 26.

**Community profiles on the subdomain.** `meta robots noindex` is on 2 of the 4.

**Custom CSS.**
- 8 of 9 sheets have unscoped selectors.
- creator-19's sheet is not ASCII (1765 characters, 1767 bytes).
- Bios contain CRs on 6 of the 8 multi-line pages.

**`--itchio_ui_bg`.** It equals `floor(0.2·bg + 0.8·0x33)` per channel: floor matches 51/51 pages and rounding only 5/51. For example, G: 0.2·0x14 + 0.8·0x33 = 44.8 → `0x2c`.

**Banners.** 21 `/original/…png`, 1 `/original/…gif` and 1 `/originalm/…gif`. None has `alt`. Sizes range from 64×10 to 2592×864.

**404 page.** The non-existent subdomain has the itch site header (`div#header_N.header_widget`), `main.css` and `div.main > div.inner_column > div#not_found_N.not_found_page`.

**Attribute and query order vary between responses.** Examples are `<script id data-src>` vs `<script data-src id>`, and the Follow link's `intent=`/`return_to=` order. The body tag has 3 attribute orders and 2 class orders over 51 pages.

### Verdicts

| id | verdict | note |
|---|---|---|
| 01 | confirmed | 51/51 + 9 fresh |
| 02 | **corrected** | ids are stable for about 5 min (server cache), not regenerated per response; still never target them |
| 03 | confirmed | 38/13/23/9/4 reproduced; 17 `mode_column`, 0 `mode_grid` in user.css |
| 04 | confirmed | detail: one GIF banner uses `/originalm/` |
| 05 | corrected | the `<title>` still names the page, and collection `h2`s can exist; what is missing is an `h1` or name heading |
| 06 | confirmed | 5/51; fresh mikeklubnika, deep-fold and terrycavanagh reproduce it |
| 07 | confirmed | |
| 08 | confirmed | |
| 09 | confirmed | user.css rules verbatim; footer "Community profile" on 45/51 |
| 10 | confirmed | `data-lazy_src` uses `315x250%23c` (1126) or `%23cb` (55) |
| 11 | confirmed | |
| 12 | corrected | inline style on 1103/1184, not every thumb |
| 13 | corrected | 114 cells, plus 2 more variants |
| 14 | **corrected** | `.is_owner` carousel cells hide the author; non-owner carousel cells hide text, genre and platform |
| 15 | corrected | collections 25/51 |
| 16 | confirmed | |
| 17 | confirmed | also `align-items:flex-start` |
| 18 | confirmed | |
| 19 | confirmed | |
| 20 | corrected | noindex on 2/4 only |
| 21 | confirmed | 4/4, 2 of them re-fetched |
| 22 | confirmed | 51/51 + 9 fresh; nothing after `custom_css` |
| 23 | confirmed (inferred) | the template has no `#` selectors |
| 24 | confirmed | 4725 B live == `dist/main.min.css` minus `\n` |
| 25 | confirmed (observed) | the user's `  </style>` line is left as `"  \n"` before `</head>` |
| 26 | corrected | bios with CR on 6/8, not all |
| 27 | corrected | not all ASCII |
| 28 | corrected | 8/9, not 7/9 |
| 29 | confirmed (observed) | `collection_list_widget` occurs only inside kenney's CSS |
| 30 | confirmed | |
| 31 | confirmed | 0 CSP in 93 header sets |
| 32 | confirmed | 1 normalized template over 51 pages |
| 33 | corrected | partial-support browsers lose only `hr{…}` and the rest of the `.user_page{}` block after it; browsers without nesting lose all nested rules |
| 34 | corrected | floor, not exact 20/80 |
| 35 | confirmed | |
| 36 | confirmed | |
| 37 | confirmed | built-in list in the export: serif, sans-serif, `'04b_03'`, Lato |
| 38 | confirmed | `fonts.json` Last-Modified 2024-11-28 |
| 39 | confirmed | `.user_page .game_grid_widget{font-size:1.1428571429em}`, so cards scale too |
| 40 | confirmed | also used by `mode_column` ≤800px own-grid scrollbars |
| 41 | confirmed | |
| 42 | confirmed (observed) | |
| 43 | confirmed (observed) | live mirokshi has no `<section>` at all |
| 44 | confirmed (inferred) | |
| 45 | confirmed | |
| 46 | **corrected** | body served from cache; the per-request part is the token |
| 47 | corrected | 429 seen even at 30 s spacing |
| 48 | confirmed | 71,820 characters, 31 `@media` |
| 49 | corrected | `custom-*` in 5 bios / 22 distinct (parser-dependent) |
| 50 | confirmed | |
| 51 | confirmed (inferred) | user.css already makes `.game_grid_widget` a grid with `minmax(250px,1fr)` |
| 52 | corrected | the 404 page has the site header and `main.css`; the skeleton is `div.main > div.inner_column > div.not_found_page` |

## Verification pass 2 (2026-10-14)

A second adversarial pass ran 13:05–13:17 UTC. It used new scripts in [`crawlprofile-tools/verify2/`](crawlprofile-tools/verify2/) and did not reuse `analyze.py` or `verify/`:
- `f.sh`: a polite GET fetcher. It does **not** follow redirects, waits 4 s, and logs the status code.
- `v2.py`: a stdlib HTML tree builder that writes a per-page census as JSON.
- `agg.py` and `agg2.py`: tallies of structure, cells, bios and sections.
- `theme.py`: normalizes `style#user_theme` and checks the `--itchio_ui_bg` formula.
- `cc.py`: statistics for `style#custom_css`, measured on raw bytes.
- `rules.py`: splits `user.css` into rules.
- `owner.py`: decodes `init_UserThemeEditor(...)` from the owner export.

### Method / how to re-run

```bash
export OUT=<scratch>/raw; T=knowledge/evidence/crawlprofile-tools/verify2
$T/f.sh https://itch.io/robots.txt robots                 # Disallow list unchanged
$T/f.sh https://mirokshi.itch.io/ mirokshi_1
for u in kenney leafo mikeklubnika pixel-boy pizzadoggy alienmelon deep-fold terrycavanagh thorbjorn \
         ncase dacap nesbox prominent game-endeavor kaylousberg azagaya adamgryu; do $T/f.sh https://$u.itch.io/ p_$u; done
$T/f.sh https://<creator-03>.itch.io/ p_commsub1          # one of the 4 "community" accounts, no -L
$T/f.sh https://itch.io/profile/kenney cp_kenney; $T/f.sh https://itch.io/profile/pixel-boy cp_pixel-boy
$T/f.sh https://itch.io/profile/mirokshi cp_mirokshi; $T/f.sh https://zz-no-such-user-k3v9q.itch.io/ nonexist
$T/f.sh "https://static.itch.io/user.css?<build from mirokshi_1>" user_css; $T/f.sh https://static.itch.io/fonts.json fonts_json
$T/f.sh http://mirokshi.itch.io/ http_mirokshi; $T/f.sh https://mirokshi.itch.io/ head_mirokshi -I
$T/f.sh https://mirokshi.itch.io/ mobile_mirokshi -A "<Android Chrome UA>"
$T/f.sh https://mirokshi.itch.io/ es_mirokshi -H "Accept-Language: es-ES,es;q=0.9"
$T/f.sh https://mirokshi.itch.io/ mirokshi_2; $T/f.sh https://mirokshi.itch.io/ mirokshi_3   # ~11 min later
python -I $T/v2.py fresh.json $OUT/p_*.html $OUT/mirokshi_1.html $OUT/mobile_mirokshi.html $OUT/es_mirokshi.html
python -I $T/v2.py old.json <first-pass raw p_*.html minus the 4 redirects and the 2 stuck at 429>
python -I $T/agg.py old.json; python -I $T/agg2.py old.json; python -I $T/theme.py old.json  # same for fresh.json
python -I $T/cc.py <pages with style#custom_css>
python -I $T/rules.py $OUT/user_css.html . > user_css_rules.txt
python -I $T/owner.py <itch-io-custom-css>/preview/itch-io.html
curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/css-nesting.json   # nesting support data
```

**Requests:** 35 in total: 33 to itch.io hosts and 2 to static.itch.io, plus 1 to GitHub. **2 got `429`** (openresty, no `Retry-After`) even at 4–5 s spacing. Both succeeded on retry after about 10 s.

**Sample:**
- **Fresh:** 18 creator pages, plus mirokshi fetched 3 more times. The mobile and es-ES fetches were cache HITs and are excluded from the counts.
- **Old:** the first pass's 51 creator pages, re-parsed with `v2.py`.

### Results that changed facts

**Community accounts redirect (fact 20).**
- All 4 "community.profile on subdomain" accounts answer `302 Found` with `Location: https://itch.io/profile/<user>` on their subdomain.
- Evidence: the first status line of the first pass's own `.headers` files, plus a fresh GET without `-L` (creator-03, 13:07:42 UTC).
- No account was seen with the community page served on a `*.itch.io` subdomain. The landing page's `<link rel=canonical>` still points to the subdomain.

**Widget ids are not per response (facts 02 and 46).**

| fetch | Date (UTC) | X-Cache-Status | `#user_N` / `#user_links_N` |
|---|---|---|---|
| mirokshi_1 | 13:05:51 | HIT | 8508547 / 6659522 |
| mobile UA | 13:08:19 | HIT | 8508547 / 6659522 |
| es-ES | 13:08:24 | HIT | 8508547 / 6659522 |
| mirokshi_2 | 13:16:37 | HIT | 1269394 / 482975 |
| mirokshi_3 | 13:16:42 | HIT | 1269394 / 482975 |

- The desktop, mobile-UA and es-ES bodies are **byte-identical** once the csrf token is masked.
- The csrf token differs on every request, and its embedded timestamp equals `Date`.
- **Conclusion:** the server caches the body for a few minutes and does not vary it by User-Agent or Accept-Language (`Vary: accept-encoding` only).

**user.css build (fact 48).**
- `?1791981660` replaced `?1791970861` within the same day.
- The file is byte-identical (71,824 bytes, `cmp`), with `Last-Modified: Tue, 06 Oct 2026 21:47:49 GMT`.

**--itchio_ui_bg (fact 34).**
- Truncation, `int(0.2*bg + 0.8*0x33)`, matches 51/51 old and 19/19 fresh pages. Rounding matches only 5/51 and 3/19.
- The owner-export template is `mix_color(bg_color, '#333', 0.2)`.
- The variable is consumed only by 7 `.header_widget ...` rules in user.css.

**Theme template (fact 32).**
- 1 normalized template over 51 old and 19 fresh pages, with no `#id` selector.
- The variables on `.user_page` are always exactly `--itchio_font_family`, `--itchio_link_color`, `--itchio_gray_back` and `--itchio_border_radius`.
- The template derives `--itchio_gray_back` as `sub_color2(bg_color, 0.05)`. The hr, the borders and the `.web_flag` background use `sub_color(bg_color)`.

**Custom CSS (facts 24–30).**
- mirokshi live: 4725 bytes, equal to `dist/main.min.css` (4726 bytes) minus its final `\n`.
- 8/9 sheets have selectors without a `#wrapper` prefix.
- pizzadoggy's 5116-character sheet holds the `.header_widget ...`, `.owner_tools` and `.user_tools` selectors. It also uses **native nesting** (`& .game_title a.title`), served verbatim.
- creator-19's sheet is 1765 characters and 1767 bytes (non-ASCII). It contains `<style>` but no `</style>`, and line 78 is two spaces followed by `</head>`.
- No sheet contains a CR byte (0/9). CRs appear **inside the bio** on 6 of the 8 multi-line pages, and on mirokshi.
- The vercel `@import` sits at char 176, as the 2nd statement. Only the first `@import` is at char 0.
- Stale classes: kenney targets `.collection_list_widget`, and pixel-boy targets `.antiscroll-wrap` and `.antiscroll-scrollbar-horizontal`. None of them exists in any DOM or in user.css.

**Cells (old / fresh).**
- Inline `background-color` on `.game_thumb`: 1103/1184 and 539/585.
- `is_owner` cells sit in `.game_list` carousels: 266/266 and 123/123. None is in `.user_game_grid`.
- Every own-grid cell has `game_author`: 469/469 and 193/193.
- Price tags: 114 old and 41 fresh. The old 114 are 66 `div`, 25 `a.sale` with a price, 21 `a` without `.sale` but with a `sale_tag`, and 2 `a.sale` without a price.

**Headers.**
- 0 CSP in 31 fresh header sets.
- Profile HTML comes back `gzip` although curl offered `br` and `zstd`; only `robots.txt` came back `br`.
- `http://` → `301`. HEAD → `X-Cache-Status: BYPASS`.

**404 page (fact 52).** It has `data-page_name="user"` (the same value as a creator profile), `main.css`, the site header, and `div.main > div.inner_column > div#not_found_N.not_found_page`.

**Accessibility (fact 05).**
- The banner `img` never has an `alt` (23/23 old, 10/10 fresh).
- `<title>` still names the profile ("Name - itch.io").
- Collection `h2`s exist on banner pages (kenney 2, pixel-boy 4). What is missing is an `h1` or name heading, not all headings.

**Owner export (`owner.py`).**
- Config keys: `image_upload_url`, `image_size_limit` 3145728, `user_settings_url`, `games`, `fonts_url` (`https://static.itch.io/fonts.json?1780793839`), `css_guide_url` (`https://itch.io/docs/creators/css-guide`), `css_template`, `fonts`, `can_use_css` true, `theme` and `submit_url`.
- The `fonts` list is serif, sans-serif, `'04b_03'`, Anonymous Pro, Lato and Inter: the built-ins plus fonts the owner used.
- The game that was hidden in June (`hidden_games`) is present in today's logged-out HTML with no inline `display:none`. It is unknown whether it is still hidden, so open question 5 stays open.

### Verdicts (pass 2)

| id | verdict | note |
|---|---|---|
| 01 | confirmed | 51/51 old + 19 fresh |
| 02 | corrected | ids stay stable while the server cache lives (minutes) and change on refresh |
| 03 | confirmed | 38/13/23/9/4; user.css has 17 `mode_column` and 0 `mode_grid` |
| 04 | confirmed | `has_banner` iff the banner has a `src` (51/51); one GIF banner uses `/originalm/` |
| 05 | corrected | no `h1` or name heading; the title and collection `h2`s still exist |
| 06 | confirmed | 5/51; 3 fresh pages reproduce it |
| 07 | confirmed | |
| 08 | confirmed | heading scale in the bio: h1 2em, h2 1.5em, h3 1.25em, h4 1.125em, h5/h6 1em |
| 09 | confirmed | |
| 10 | confirmed | `no_cover_text` sits inside `a.thumb_link` |
| 11 | confirmed | 0 cover imgs with a `src` (1181 old, 584 fresh) |
| 12 | corrected | most thumbs, not every one |
| 13 | corrected | 114 cells; `a.price_tag` without `.sale` also exists |
| 14 | corrected | carousels hide the author on `.is_owner` cells; the default is `display:flex` |
| 15 | corrected | collections on 25/51 |
| 16 | confirmed | the carousel rules also cover `.purchased_games` |
| 17 | confirmed | `.columns{align-items:flex-start}`; own-grid cells get `width:315px` |
| 18 | confirmed | |
| 19 | confirmed | "Follow <name>" is `a.action_btn > svg.icon_itchio_new` |
| 20 | **corrected** | 302 redirect to `itch.io/profile/<user>`, not served on the subdomain |
| 21 | confirmed | kenney, pixel-boy and mirokshi re-fetched |
| 22 | confirmed | 51/51 + 19 fresh |
| 23 | confirmed (inferred) | |
| 24 | confirmed | |
| 25 | confirmed (observed) | |
| 26 | corrected | bio CRs on 6/8 multi-line pages |
| 27 | corrected | creator-19's sheet is non-ASCII |
| 28 | corrected | 8/9 |
| 29 | confirmed (observed) | plus pixel-boy's `.antiscroll-*` |
| 30 | corrected | only the first `@import` is at char 0 |
| 31 | confirmed | |
| 32 | confirmed | |
| 33 | corrected | caniuse numbers are documented; old-syntax browsers drop `hr{...}` and the rest of the `.user_page` block |
| 34 | corrected | truncation, not rounding |
| 35 | confirmed | |
| 36 | confirmed | |
| 37 | confirmed | `serif` was never seen live, so its no-link behavior is inferred |
| 38 | confirmed | 1725 families: sans-serif 621, display 436, serif 333, handwriting 284, monospace 51 |
| 39 | confirmed | |
| 40 | confirmed | also the own-grid scrollbars in mode_column at ≤800px |
| 41 | confirmed | user.css consumes `--itchio_button_*` only in `.button`, `.skip_to_main` and header widgets |
| 42 | confirmed (observed) | |
| 43 | confirmed (observed) | |
| 44 | confirmed (inferred) | |
| 45 | corrected | the mobile and es-ES results were cache HITs; the cache ignores UA and language |
| 46 | **corrected** | the body is cached; only the token is per request |
| 47 | corrected | 429s also at 4–5 s spacing |
| 48 | corrected | the build stamp changes without user.css changing |
| 49 | corrected | 22 distinct `custom-*` classes in 5 bios; the 80 non-itch links include 1 `mailto:` |
| 50 | corrected | confidence is inferred (no render test) |
| 51 | confirmed (inferred) | |
| 52 | corrected | `div.main > div.inner_column > div.not_found_page`; has the site header and main.css |
