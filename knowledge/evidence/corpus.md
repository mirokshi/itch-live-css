# Evidence log: corpus (custom CSS as itch.io serves it)

- **Dimension key:** `corpus` (fact ids `corpus-NN`)
- **Run date:** 2026-10-14, 10:08–10:40 UTC (one session)
- **Question:** what does custom CSS look like once it has gone through itch's save pipeline and is
  served live, and what does that tell us about limits, escaping and rewriting?
- **Raw copies:** only in the session scratchpad, never in this repo. This file holds statistics,
  hashes of conclusions and short snippets written by the analyst. Per-page numbers:
  [`corpus-stats.csv`](corpus-stats.csv). Scripts: [`corpus-tools/`](corpus-tools/).

## 1. Method

### 1.1 Etiquette and budget

- `robots.txt` fetched first (Disallow list: `/embed/ /embed-upload/ /search /checkout/
  /game/download/ /bundle/download/ /register-for-purchase/ /email-feedback/`). Only page URLs
  outside those paths were requested.
- GET only, logged out, browser User-Agent, no forms, no login.
- **141 requests to itch.io in total** (138 curl + 1 diagnostic curl + 2 WebFetch):
  128 × 200, 11 × 429, 1 × 403, 1 × 404. Pacing started at 1 request / ~2 s and was slowed to
  1 / ~5 s after the first 429s.
- 36 more curl calls in the log are marked `NOT-SENT`: the URL list had Windows CRLF line endings,
  the `\r` ended up in the output filename and curl aborted with exit 23. A local socket test
  (`127.0.0.1`, raw listener) showed that curl sends nothing in that case. *(Corrected by the
  2026-10-14 verification, see the end of this file: with curl 8.7.1/mingw64 the exit 23 comes from
  the `\r` in the `-D` header-file name, which curl opens before connecting. A `\r` in `-o` alone is
  replaced by `_`, and the request **is** sent with exit 0. A `\r` in the URL gives exit 3, with nothing sent.)*
  They were re-run later with clean names.

### 1.2 Sampling (where the 62 pages came from)

| Source | Pages requested (200) | With custom CSS | Hit rate |
|---|---:|---:|---:|
| Jam pages, `https://itch.io/jams` calendar sorted by "joined" (top ~60) | 60 | 23 | 38 % |
| `https://itch.io/games/featured` (first 14 games) | 12 | 1 | 8 % |
| Targeted pages: GitHub repos that publish itch CSS (code search) + their owners' other pages + theme-catalog creators found by web search + the repo owner's own profile | 48 | 38 | 79 % |
| **Total** | **120** | **62** | |

62 pages with custom CSS: **13 profiles, 26 project pages, 23 jam pages**, from 38 distinct
owners / jam series. Bias: the targeted pages over-represent technically sophisticated authors
(people who keep their itch CSS on GitHub). The heaviest clusters are 7 pages by one author and 6 by
another. Two jam pairs are the same host's CSS reused (mini-jam 220/221, mini-jame-gam 59/60).

GitHub code-search queries used (`gh api -X GET search/code -f q=...`; the endpoint allows about 10
queries per minute):
`formatted_description language:CSS`, `user_page_wrap language:CSS`, `game_frame #inner_column language:CSS`,
`view_jam_page language:CSS`, `embed_wrapper #wrapper language:CSS`, `user_profile #wrapper language:CSS`,
`"user_page" "#wrapper" language:CSS`.

### 1.3 Extraction (exact rule)

```text
profile / project / devlog : bytes between  <style … id="custom_css" …>  and  </style>
jam                        : inside <style … id="jam_theme" …>, everything after the
                             .view_jam_page .jam_filter_picker .divider{...}  rule
```

**Attribute order is not stable** *(added by verification pass 2)*. The first run (10:08–10:40 UTC)
got `<style id="custom_css" type="text/css">`; the 13:05–13:15 UTC re-fetch got
`<style type="text/css" id="custom_css">` on every page. A regex anchored on `<style id=` then
silently finds nothing. Use `<style\b[^>]*\bid="custom_css"[^>]*>`.

`corpus-tools/getcss.py` implements this (fixed in pass 2; the original version required `id` first). Lengths for jam pages include the one trailing space
that itch appends (see §3.6).

### 1.4 Commands (re-run)

```bash
export OUTDIR=/path/to/scratch
corpus-tools/fetch.sh https://itch.io/jams l_jams.html          # listing
corpus-tools/fetch.sh https://itch.io/jam/gmtk-2027 j_gmtk-2027.html
# ... one call per page; names: p_<user>.html, g_<user>_<slug>.html, j_<jam>.html
python -I corpus-tools/getcss.py  $OUTDIR/raw/[gjp]_*.html      # inventory
OUT=corpus.json python -I corpus-tools/analyze.py $OUTDIR/raw/[gjp]_*.html
python -I corpus-tools/summarize.py corpus.json                 # all tables below
python -I corpus-tools/diffpair.py live.css source.css           # source vs live
```

Browser check (@import order): `corpus-tools/import-order-test.html`, run with
`chrome --headless=new --user-data-dir=<temp> --virtual-time-budget=3000 --dump-dom file:///…`
(Chrome 155, a throwaway profile).

## 2. Length distribution (cap evidence)

| Page type | n | min | median | p90 | max (chars) | max (bytes) | > 5120 chars |
|---|---:|---:|---:|---:|---:|---:|---:|
| profile | 13 | 79 | 3,731 | 4,832 | **5,116** | 5,116 | **0** |
| project | 26 | 96 | 5,136 | 11,098 | **38,560** | 38,576 | 13 |
| jam | 23 | 221 | 3,472 | 12,926 | **20,203** | 20,205 | 8 |
| all | 62 | 79 | 4,144 | 10,776 | 38,560 | 38,576 | 21 |

- Profiles: the top 5 are 4,329 / 4,725 / 4,726 / 4,858 / **5,116** chars. Nothing goes past 5,120,
  and four profiles sit within 400 chars of it. That fits a hard cap of about 5,120.
  The longest one (5,116 chars) has 234 newlines stored as LF. If newlines were counted as CRLF,
  it would be 5,350, so the profile cap counts one character per newline. *(Pass 2 caveat: this
  holds only if the cap was already in force when that CSS was last saved. The save date is not
  visible, so it stays an inference.)*
- Community sources agree on 5,120 characters for profiles only. One example is a public build
  script (`nndda/itchio-profile`) that splits CSS at `5120 - 30 - importTemplate.length` and
  names its function "…ProfilePageHave5120CharacterCountLimitButOtherPagesDont…".
  In an itch forum thread (`https://itch.io/t/2818377`), admin *leafo* declined to raise the
  ~5 KB profile limit and said game pages "might actually be missing the size check".
- Project pages: a **38,576-byte** stylesheet (686 CRLF) is served intact. It is identical to its
  public source apart from line endings (§4), so nothing was truncated at 5 K, 10 K or 32 K.
- The official guide (`https://itch.io/docs/creators/css-guide`, fetched 2026-10-14) gives no
  size limit at all.
- Bytes vs chars: no profile in the sample can tell them apart. The biggest non-ASCII profile is
  4,759 B / 4,726 chars, well under either reading. This stays an open question.

## 3. What survives, and in what form

### 3.1 Escaping: none

| Check (62 pages) | Result |
|---|---|
| HTML entities `&gt; &lt; &amp; &quot; &#…` inside the CSS | **0 occurrences** |
| raw `>` outside comments and strings (child combinators, nesting `&>`) | 397 in 26 pages |
| raw `<` | 17 in 5 pages: `@media(width<=900px)`, `@property … syntax:'<number>'`, inline SVG markup in a `data:` URI including `</filter>` and `</svg>`, comments |
| raw `&` | 162 in 21 pages (Google Fonts query strings, nesting `&`) |
| raw quotes | `"` 462 in 43 pages, `'` 823 in 32 pages |

itch writes the stored CSS into `<style>` as raw text. A `>` combinator works as typed. Never
pre-escape it.

### 3.2 Line endings and whitespace

| Page type | multi-line pages | CRLF only | LF only | single-line (minified) |
|---|---:|---:|---:|---:|
| profile | 8 | 0 | **8** | 5 |
| project (incl. devlog) | 22 | **22** | 0 | 4 |
| jam | 20 | 2 | 18 | 3 |

- One profile source that was authored with CRLF is served with LF.
- Nine project sources authored with LF are served with CRLF.
- *(Pass 2.)* 8 jams outside the sample: 2 of the 4 multi-line ones are CRLF (`kenney-jam-2025`,
  `scream-jam-2025`). The same host's CSS is CRLF on `scream-jam-2025` and LF on `scream-jam-2026`.
  The two differ only in a few colour values and are identical once newlines are normalised. So on
  jams the newline style seems to depend on when the CSS was saved, not on the page type alone.
- Leading and trailing whitespace: 0 of 39 profile/project CSS start or end with whitespace. In the
  5 pairs whose source ended with a newline, the live copy does not, so **trailing** whitespace is
  trimmed. No source in the sample started with whitespace, so leading trimming is untested.

### 3.3 No rewriting

Across 14 source/live pairs (§4), the only differences are newline style and trailing whitespace.
Comments, `!important`, selector text, at-rules, URLs, `\hex` escapes and raw UTF-8 (Japanese kana, no kanji; `ω`,
`★`, `⚓`, astral `U+13080`) all come back as written.

Whole-corpus totals that were stored verbatim:

- 401 comments, making up 9.3 % of stored bytes (14.2 % on project pages, 3.6 % on profiles).
- Median whitespace ratio: 17.3 %.
- 973 `!important` in 46 pages. *(Verification: outside comments it is 972 in **45** pages. On
  `creator-62.itch.io` the only `!important` is inside a comment, so profiles are 8/13, not 9/13.)*
- 23 `\hex` escapes in 4 pages.
- Non-ASCII in 11 pages, with 0 × U+FFFD, 0 × BOM and 0 × NBSP.

### 3.4 `#wrapper` scoping is policy, not enforced

| Measure | Value |
|---|---|
| top-level selectors without the literal `#wrapper` | **2,227 of 2,545 (87.5 %)** |
| pages with at least one such selector | 55 / 62 |
| pages where every top-level selector is scoped to `#wrapper` | 3 / 62 |
| pages that mention `#wrapper` at all | 19 / 62 |
| pages with `:root` / `html` / `body` selectors | 19 / 62 (13 of 23 jams) |
| pages styling the site header (`.header_widget`, `.primary_header`) | 8 |
| pages styling `#user_tools` / `.user_tools` (game-page top bar) | 5 |
| pages hiding `.footer` (display:none / visibility:hidden / opacity:0 / height:0) | **0** (8 restyle it) |

### 3.5 Feature presence (pages, out of 62; profile / project / jam)

| Feature | All | prof /13 | proj /26 | jam /23 |
|---|---:|---:|---:|---:|
| `@import` | 21 | 7 | 11 | 3 |
| `@import` that a browser will ignore | 3 | 0 | 0 | **3 (all jams)** |
| `@font-face` | 6 | 1 | 1 | 4 |
| `@keyframes` | 34 | 5 | 18 | 11 |
| `@media` | 32 | 6 | 13 | 13 |
| `@supports` / `@property` | 1 / 1 | 0 | 0 | 1 / 1 |
| `@container`, `@layer`, `@scope`, `@starting-style`, `@charset`, `@-webkit-keyframes` | 0 | 0 | 0 | 0 |
| CSS nesting (142 nested rules in total) | 7 | 4 | 3 | 0 |
| `:has()` | 8 | 2 | 4 | 2 |
| `:is()` / `:where()` | 3 | 0 | 2 | 1 |
| `::before` / `::after` | 41 | 6 | 19 | 16 |
| `!important` | 46 | 9 | 17 | 20 |
| custom properties defined / `var()` used | 28 / 30 | 5 / 5 | 11 / 13 | 12 / 12 |
| `--itchio_*` theme variables referenced | 11 | 4 | 7 | 0 |
| `.custom-*` class in selectors | 25 | 4 | 8 | 13 |
| `data:` URI | 9 | 0 | 7 | 2 |
| comments kept | 31 | 4 | 16 | 11 |
| minified (no newline, or > 300 chars per line) | 13 | 5 | 5 | 3 |
| `-webkit-` / `-moz-` / `-ms-` prefixes | 24 / 2 / 0 | | | |
| `animation` / `transition` | 34 / 33 | 5 / 6 | 18 / 14 | 11 / 13 |
| `prefers-reduced-motion` | **5** | 2 | 2 | 1 |
| `backdrop-filter` | 6 | 3 | 0 | 3 |
| `clamp()` / `color-mix()` / `calc()` | 7 / 4 / 15 | | | |
| `dvh` / `svh` / `lvh`, `prefers-color-scheme` | 0 / 0 | | | |
| `dvw` (pass 2) | 1 | 1 | 0 | 0 |
| `http://` (insecure) `url()` | 0 | | | |

### 3.6 Jam pages: CSS shares one sheet with the theme

- In all 60 jam pages fetched, `<style id="jam_theme">` starts with the theme output
  `:root{--itchio_ui_bg: #……;}…`.
- That theme part is 1,705–1,993 bytes and ends with
  `.view_jam_page .jam_filter_picker .divider{color: #……;}`.
- The host's CSS follows it immediately, with no separator. itch then emits one space. All 23 jams
  with CSS end in `"} "`, and all 37 without CSS have a tail of exactly `" "`.
- No jam page has a `style#custom_css`.

**Consequence:** an `@import` in jam CSS always comes after style rules, so browsers drop it. The
local test (Chrome 155) gave these results:

- The jam-like sheet's `cssRules` contain no `CSSImportRule`, and the imported rule did not apply.
- The rules after the dead `@import` still applied.
- `@import` first in a separate `<style>` (the profile/project layout) worked.
- `@font-face` placed after rules worked.

3 of the 23 jams in the sample load Google Fonts with `@import`. Two of them partly get the font
anyway, because the same family is also picked in the jam theme editor, and that makes itch emit
`<link href="https://fonts.googleapis.com/css?family=<Name>%3A400%2C400italic%2C700%2C700italic">`.
That link only covers weights 400 and 700. Other weights, and any second family requested only
through the dead `@import`, never load.
The jams whose fonts do load use `@font-face` with direct `fonts.gstatic.com` or other file URLs.
One jam has 28 `@font-face` blocks.

A pattern that works on jams (written for this log):

```css
@font-face{font-family:"MyFont";font-display:swap;
  src:url("https://example-cdn.example/myfont-400.woff2") format("woff2")}
#wrapper .jam_title_header{font-family:"MyFont",sans-serif}
```

### 3.7 Order in `<head>` (cascade)

| Type | Order observed |
|---|---|
| profile | `link static.itch.io/user.css` → scripts → `style#user_theme` (783–998 B over 24 fetches) → theme font `link` (if a font is picked) → **`style#custom_css`** |
| project / devlog | `link static.itch.io/game.css` → scripts → `style#game_theme` (4,648–5,010 B over 53 fetches) → theme font `link` → **`style#custom_css`** |
| jam | `link static.itch.io/jam.css` → scripts → **`style#jam_theme` = theme rules + host CSS** → theme font `link` (if a font is picked; it comes **after** jam_theme on 19/19 such jams) |

Wrappers: profile `<div class="user_page_wrap" id="wrapper">`, project
`<div id="wrapper" class="main wrapper game_page_wrapper">`, jam `<div class="jam_page_wrap" id="wrapper">`.
*(Verification: the attribute order is not stable. Profiles were seen both as `class…id` (15) and
`id…class` (4), jams as `class…id` (60) and `id…class` (3). Theme font `<link>` attributes came in 3
different orders. Match on attributes, not on a fixed string.)*
When a profile or project has no custom CSS, the `style#custom_css` element is absent.

### 3.8 Devlog and AMP

- `https://nnda.itch.io/pitch/devlog/1565390/...` serves the same `style#custom_css` as its project
  page: byte-identical, 23,059 B, inside the same `#wrapper.game_page_wrapper`.
- Its AMP version (`….amp`, advertised by `<link rel="amphtml">`) has only `style[amp-boilerplate]`
  and itch's own `style[amp-custom]` (14,359 B). It contains no `#wrapper` and none of the
  project's CSS (0 of 116 sampled 40-byte chunks found). *(Verification: the `amphtml` href is on
  the main domain, `https://itch.io/devlog/<id>/<slug>.amp`. The `<user>.itch.io/…/devlog/…amp`
  URL 301-redirects there. Two more projects were checked the same way (creator-64/game-28,
  creator-88/game-54). On both, the devlog serves the project CSS byte-identical and the AMP
  page has none of it.)*

### 3.9 External resources

- `@import` hosts (count of pages):
  - `fonts.googleapis.com`: 16
  - `cdn.jsdelivr.net`: 5
  - a `*.vercel.app` stylesheet: 1
- On profiles and projects, every `@import` sits at the very top. Non-Google `@import` is kept on
  both profiles and projects.
- `@font-face src` hosts:
  - `fonts.gstatic.com`: 33 srcs
  - `cdn.jsdelivr.net` (fontsource): 2
  - a `github.io` site and a personal domain: 1 each
- `url()` hosts (count of pages):
  - `fonts.googleapis.com` 16, `img.itch.zone` 11 (10 outside comments), `cdn.jsdelivr.net` 11, `fonts.gstatic.com` 3, `i.imgur.com` 2
  - 1 page each: `raw.githubusercontent.com`, `files.catbox.moe`, `cdn.simpleicons.org`, `s2.svgbox.net`, cloudfront, personal domains
- `data:` URIs: 17 in 9 pages, of which 15 are `image/svg+xml` and 2 `image/png`. Sizes run from
  146 to 2,098 B. Profiles have none. *(Verification: by SVG encoding, 6 pages percent-encode the
  markup (`%3Csvg …`), 2 pages base64-encode it, and only 1 jam page has raw `<svg …>…</svg>`.)*
- Cap bypass seen on profiles:
  - 2 profiles whose whole custom CSS is a single ~80-char `@import` of a jsDelivr-hosted
    stylesheet (about 13 KB and 17 KB at each repo's current HEAD).
  - 1 profile that builds a ≤ 5,120-char inline part and `@import`s the remainder.
- jsDelivr headers (`curl -I`, 2026-10-14):
  - all three: `Content-Type: text/css; charset=utf-8`, `access-control-allow-origin: *`
  - tag URLs (`@v2.0.1`, `@1.14.2`): `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
  - branch URL (`@main`): `max-age=604800, s-maxage=43200`
- CSP:
  - project pages, 45 of 45: only `Content-Security-Policy: frame-ancestors 'self' https://itch.io`
  - profiles (0 of 15) and jams (0 of 60): no CSP header
  - so no `style-src` / `font-src` / `img-src` restriction applies to custom CSS.

### 3.10 Selectors people target (pages using the token; `.custom*` excluded)

- **profile (13):**
  - `.user_page` 10, `.game_grid_widget` 9, `.game_cell` 9, `.user_links` 7, `.inner_column` 7
  - `.footer` 6, `.game_cell_data` 6, `.game_title` 5, `.user_page_wrap` 5, `.game_thumb` 5
  - `.text_header` 4, `.link_group` 4, `.collection_row` 4, `.collection_description` 4
  - `#profile_header` 3, `.carousel_wrapper` 3, `.user_game_grid` 3
- **project (26):**
  - `#wrapper` 15, `.formatted_description` 15, `#inner_column` 13, `.inner_column` 12
  - `.game_frame` 10, `.header` 8, `.left_col` / `.right_col` 8, `.game_comments_widget` 8
  - `.game_info_panel_widget` 8, `.button` 8, `.buy_btn` 7, `.more_information_toggle` 7
  - `.upload_list_widget` 7, `.view_game_page` 7, `.screenshot_list` 7
  - `.iframe_placeholder` 6, `.start_game_btn` 6, `.game_devlog_post_page` 5
- **jam (23):**
  - `.jam_body` 19, `.view_jam_page` 17, `.jam_header_widget` 17, `.jam_page_wrap` 16
  - `.stat_box` 13, `.jam_title_header` 13, `.jam_submitter_widget` 12, `.jam_content` 11
  - `.header_tabs` 10, `.stat_value` 9, `.submitter_outer` 9, `.header_columns` 8
  - `.jam_host_header` 8, `.jam_banner_outer` 7, `.countdown` 7

### 3.11 Sanitizer side-observation (bio HTML)

A profile's bio uses classes `customa` … `customad`, with no hyphen after `custom`, plus
`text-right`. Its CSS targets `.customm`, `.customn` and so on. Both survive live, so the class
filter keeps any class that starts with `custom`, not only `custom-`. This was observed on one
live page and has not been tested by saving.

## 4. Source vs live diffs (14 clean pairs)

Each pair is a public source file paired with the live `style#custom_css` it was pasted into.
`=` means identical after the stated normalisation.

| # | Live page (type) | Source | Live size | Result |
|---|---|---|---:|---|
| 1 | `mirokshi.itch.io` (profile) | private repo `dist/main.min.css` (owner's) | 4,725 B | = after removing source's trailing LF |
| 2 | `nnda.itch.io` (profile) | `nndda/itchio-profile` `dist/styles.css` | 4,759 B | **byte-identical** (UTF-8 kana + `ω`/`≈`, nesting `&>`, `width<=900px`) |
| 3 | `creator-96.itch.io` (profile) | `creator-96/itch.io_Pages` `HomePage/HomePage_Theme.css` | 4,858 B | **byte-identical** (LF) |
| 4 | `gourangadas.itch.io` (profile) | `GourangaDasSamrat/itch-io-theme` `steam-inspired/style.css` | 3,731 B | = after CRLF→**LF** + trailing CRLF trimmed |
| 5 | `creator-68.itch.io/game-32` | `creator-68/game-32` `itch_page.css` | 1,032 B | = after LF→**CRLF** (65), comments kept |
| 6 | `creator-68.itch.io/game-33` | `creator-68/game-33` `itch_page.css` | 2,267 B | = after LF→CRLF (100) |
| 7 | `creator-64.itch.io/game-28` | `creator-64/game-28` `misc/itch/release-custom.css` | 10,569 B | = after LF→CRLF (366) |
| 8 | `creator-96.itch.io/game-64` | `…/game-64/game-64_theme.css` | 4,032 B | = after LF→CRLF (125) |
| 9 | `creator-96.itch.io/game-67` | `…/game-67/game-67_theme.css` | 3,523 B | = after LF→CRLF (82) |
| 10 | `creator-96.itch.io/game-68` | `…/game-68/game-68_theme.css` | 9,463 B | = after LF→CRLF (351) |
| 11 | `creator-96.itch.io/game-69` | `…/game-69/game-69_theme.css` | 5,634 B | = after LF→CRLF (187), astral char kept |
| 12 | `creator-96.itch.io/game-66` | `…/game-66/game-66_theme.css` | 7,356 B | = after LF→CRLF + trailing LF trimmed |
| 13 | `creator-88.itch.io/game-54` | `creator-88/game-54` `docs/itch/theme.css` | **38,576 B** | = after LF→CRLF (686) + trailing LF trimmed |
| 14 | `creator-88.itch.io/game-55` | `creator-88/game-55` `docs/itch/theme.min.css` | 10,586 B | = after trailing LF trimmed (single line) |

Pairs left out because the source is out of date, not because of any itch transformation:
`comigo.itch.io/ct`, `nnda.itch.io/pitch`, `creator-96.itch.io/game-65` and
`aieseattle.itch.io` all have more or different rules live. On `nnda.itch.io/timekeeper` the
author pasted a minified build of an unminified source.

## 5. Scraping gotchas seen

- **429.** Responses came from openresty behind Cloudflare. 11 of 141 requests got one, even at
  1 request every ~5 s, usually after 6–8 quick requests. Retrying a few minutes later always worked.
  *(Pass 2: 2 of 41 requests got 429, one at 6 s pacing (3rd request) and one at 10 s pacing
  (6th request in a row). A 20–40 s pause, then a retry, worked each time. No fixed pace is safe,
  so retry with backoff.)*
- **403.** One featured game returned 403 with `<title>Just a moment...</title>`, a Cloudflare
  challenge. It carried its own strict CSP, so it is not the page.
- **WebFetch.** Converting to Markdown loses `<style>` contents. Use curl and keep the raw bytes.

## 6. Limitations

- Logged-out render only.
- The sample is biased toward GitHub-publishing authors and popular jams.
- Profiles are n = 13.
- Nothing was saved on an account, so nothing about the editor UI, its error messages or the
  bytes-vs-chars question was tested directly. See the open questions in the structured output of
  this run.

## Verification (2026-10-14)

An adversarial re-check run on the same day, about 10:45–11:05 UTC. All new scripts are in
[`corpus-tools/verify/`](corpus-tools/verify/). Raw copies stayed in the scratchpad.

### Method

- **Fresh live fetches.** 30 itch.io requests at 1 per 5–8 s, with `verify/vfetch.sh`. 29 got
  200 and 1 got 429, the 8th request (`nnda.itch.io/pitch`, retried later and fine).
  - Profiles: mirokshi, nnda, pizzadoggy, gourangadas, creator-113, hamgarian, creator-74, deskcansaw, jyunaut.
  - Projects: creator-64/game-28, creator-88/game-54, nnda/pitch, creator-96/game-69.
  - Devlogs and their AMP pages, 3 of each: nnda/pitch, creator-64/game-28, creator-88/game-54.
  - Jams: gmtk-2027, cookie-jam-5, 20-second-game-jam-2026, scream-jam-2026, revival-jam-2026,
    defold-game-jam-2026, gdevelop-big-game-jam-10.
  - Other: `robots.txt`, `/docs/creators/css-guide` and forum thread `/t/2818377`.
- **Sources.** GitHub raw sources were downloaded again for 7 pairs. `verify/vdiff.py` re-ran the
  diffs.
- **Corpus statistics.** They were recomputed with a parser written from scratch
  (`verify/indep.py`, `verify/misc.py`, `verify/nonascii.py`) over the first run's 62 raw pages.
- **Browser test.** `verify/order.html` runs in headless Chrome 155 with
  `--allow-file-access-from-files --virtual-time-budget=3000 --dump-dom`.
- **jsDelivr.** Headers were checked again with `curl -D -`.

### Results that changed something

| Topic | First run | Verified |
|---|---|---|
| Theme font `<link>` on jams | "placed before the custom CSS" | On jams it comes **after** `style#jam_theme` (19/19 jams with a theme font). On profiles and projects it comes before `custom_css` (17/17). |
| Wrapper / link attribute order | one fixed string per page type | The order varies between responses (profile 15 `class…id` / 4 `id…class`, jam 60 / 3). Font `<link>` attributes appear in 3 orders. `<style id=…>` was always id-first. |
| Theme `<style>` sizes | user_theme 790–966 B, game_theme 4.6–4.9 KB | user_theme 783–998 B (n=24), game_theme 4,648–5,010 B (n=53) |
| Game pages without `custom_css` | 22 | **19** HTTP-200 game pages. The other 3 were error responses (2 × 429, 1 × 403). |
| `!important` | 46 pages / 973 | **45** pages / 972 outside comments (profiles 8/13) |
| `img.itch.zone` in `url()` | 11 pages | 10 pages outside comments (the 11th has it only in a comment) |
| Non-ASCII | "kanji/kana" | Kana only (U+3055…U+30ED). 0 CJK ideographs in the corpus. |
| Single-line projects | 5/26 | 4/26 have no newline. A 5th is "minified" only by the >300-chars-per-line rule. |
| Bio classes on nnda.itch.io | customa…customad | customa…**customae** (31 distinct), plus `text-right` |
| SVG data URIs | "raw SVG markup … stored unescaped" | 1 page raw `<svg>`, 6 pages percent-encoded `%3Csvg`, 2 pages base64 |
| curl and `\r` | "curl sends nothing (exit 23 for `\r` in -o)" | curl 8.7.1/mingw64: `\r` in `-o` becomes `_` and the request **is sent** (exit 0). `\r` in the `-D` file gives exit 23 before connecting. `\r` in the URL gives exit 3 with nothing sent. |
| Whitespace trimming | "leading and trailing" | Only trailing trimming is evidenced. Leading is untested. |
| Devlog CSP | not stated | Devlog pages send **no** CSP header (0/3). Game pages send `frame-ancestors` (4/4 now, 45/45 before). |
| AMP URL | "URL ending in .amp" | `amphtml` → `https://itch.io/devlog/<id>/<slug>.amp`. The subdomain `.amp` URL 301s there. 3/3 AMP pages contain none of the project CSS. |

### Results that held

- **Source vs live pairs.** Re-diffed byte for byte: mirokshi (only the trailing LF differs), nnda
  profile (byte-identical), gourangadas (CRLF→LF and a trailing CRLF trimmed), creator-64/game-28
  (366 LF→CRLF), creator-88/game-54 (687 LF → 686 CRLF and the final LF trimmed; 38,576 B
  served intact) and game-69 (LF→CRLF, U+13080 kept). Devlog CSS was byte-identical to project
  CSS on 3/3 projects.
- **Lengths.** Profile max 5,116 chars (pizzadoggy, 234 LF), 0/13 over 5,120. Projects: 13/26 over
  5,120. Jams: 8/23 over, max 20,203 chars.
- **Jam sheet.** The jam theme part is 1,705–1,993 B and starts `:root{--itchio_ui_bg:` (60/60). 23
  tails end with `"} "` and 37 empty tails are exactly `" "`. No jam has `style#custom_css`.
- **@import in jam CSS.** cookie-jam-5, defold-game-jam-2026 and gdevelop-big-game-jam-10 each
  start their tail with `@import`, directly after theme rules.
- **Browser test (headless Chrome 155, `verify/order.html`).**
  - In a jam-like sheet both a `data:` and a relative-file `@import` are dropped. The rule after
    them still applies.
  - `@import` first works, including when only a comment precedes it.
  - An `@import` after an `@font-face` is **also dropped**.
  - An `@font-face` after style rules works.
  - A pre-escaped `#p &gt; #k` rule is dropped by the parser.
  - A literal `</style` inside a CSS comment ends the `<style>` element and leaks the rest as HTML.
- **Corpus-wide counts that held:**
  - entities 0; raw `>` 397 in 26 pages; `<` 17 in 5 pages; `&` 162 in 21 pages
  - comments 401 in 31 pages (9.3 % of bytes); median whitespace 17.3 %
  - 23 `\hex` escapes in 4 pages; data URIs 17 in 9 pages, 146–2,098 B
  - `@font-face` 37 blocks, 33 of them gstatic; scream-jam-2026 has 28 gstatic blocks
  - `--itchio_*` in 11 pages and 0 jams; reduced-motion in 5 pages; animation in 34, transition in 33
  - `:root`/`html`/`body` in 19 pages (13 jams); header-widget styling 8, `user_tools` 5
  - `.footer` restyled on 8 pages and hidden on 0 (one profile animates it)
  - top-level selectors without `#wrapper`: 87.7 % by this parser (87.5 % before); 55 pages have
    some, 3 pages have none
  - selector-token tables (profile, project, jam) match
  - featured games: 1 of 12 with CSS
  - jsDelivr headers match (creator-113@v2.0.1 16,704 B; hamgarian@main 12,824 B; nndda@1.14.2 i.css 5,606 B)
  - css-guide has no size limit, no `@import`, and HTTPS + Base64 guidance
  - forum leafo reply (Apr 2023) quoted as stated

## Verification pass 2 (2026-10-14, 13:05–13:30 UTC)

A second adversarial re-check, done independently of pass 1. It used a new parser and new live
fetches. Scripts are in [`corpus-tools/verify2/`](corpus-tools/verify2/). Raw copies stayed in the
scratchpad.

### Method

- **Live fetches.** 41 itch.io requests with `verify2/f.sh` (GET, logged out, browser UA, 6 s then
  10 s pauses): 39 × 200 and 2 × 429, both retried fine. `robots.txt` was fetched first.
  - In sample: profiles mirokshi, nnda, pizzadoggy, gourangadas, creator-113, hamgarian, creator-74 and
    deskcansaw; projects creator-64/game-28, creator-88/game-54 and nnda/pitch; devlog nnda/pitch
    and its AMP page; jams gmtk-2027, cookie-jam-5, 20-second-game-jam-2026, scream-jam-2026,
    revival-jam-2026 and defold-game-jam-2026.
  - **Out of sample:** 8 jams from `https://itch.io/jams/past` (brackeys-15, gmtk-jam-2026,
    game-off-2025, acerola-jam-0, scream-jam-2025, kenney-jam-2025, pirate17, boss-rush-jam-2025),
    5 featured games (creator-60/game-25, maddymakesgamesinc/celeste, ncase/anxiety,
    nomnomnami/charm-studies, hempuli/baba) and 2 profiles (nomnomnami, ncase).
  - Also fetched: the css-guide, forum thread `/t/2818377`, and the `/jams/past` and
    `/games/featured` listings.
- **Sources.** Downloaded again from `raw.githubusercontent.com/<owner>/<repo>/HEAD/…`: nndda
  `dist/styles.css` and `src/scripts/build.ts`, creator-88 `docs/itch/theme.css`, GourangaDasSamrat
  `steam-inspired/style.css`, creator-64 `misc/itch/release-custom.css` and SebasKoria `creator-113.css`. The
  private repo's `dist/main.min.css` was read locally. Compared with `verify2/cmp.py`.
- **Corpus statistics.** Recomputed over the first run's 62 raw pages with a new tokenizer and
  rule walker (`verify2/stats.py` + `verify2/report.py`, attribute-order independent).
- **Browser test.** `verify2/parse-test.html` in headless Chrome 155
  (`chrome --headless=new --user-data-dir=<tmp> --virtual-time-budget=3000 --dump-dom file:///…`).
- **Other checks.**
  - MDN `@import` page fetched with curl.
  - jsDelivr headers checked with `curl -I`; gstatic font URLs checked with `curl`.
  - curl CR behaviour tested against a local `python -m http.server` on 127.0.0.1.

### New findings (not in pass 1)

- **itch's HTML attribute order changes over time, so it is not a fixed markup string.** Each run
  was internally consistent, but the runs differed:
  - first run (10:08–10:40 UTC): `<style id=… type=…>`,
    `<div id="wrapper" class="main wrapper game_page_wrapper">`, `<div class="user_page_wrap" id="wrapper">`;
  - pass 1 (10:45–11:05): `id` first on everything;
  - pass 2 (13:05–13:15): `<style type="text/css" id="custom_css">` on 12/12 pages and `class`
    before `id` on 33/33 wrappers.

  **Consequence:** the original `getcss.py` (regex anchored on `<style id="custom_css"`) returned
  NONE for every page fetched in pass 2. It is now fixed. Always match
  `<style\b[^>]*\bid="custom_css"[^>]*>`.
- **Theme variables live on different elements by page type:**
  - project/devlog `game_theme`: `:root{--itchio_ui_bg…}` plus `.wrapper{--itchio_link_color,
    _bg_color, _bg2_color, _bg2_sub, _text_color, _border_color, _button_*, _font_family}`. The
    `.wrapper` class is on `#wrapper` itself.
  - profile `user_theme`: `.user_page{…}`, a child of `#wrapper`.
  - jam `jam_theme`: `.jam_page_wrap{…}`, which is `#wrapper`.
  - Most variables that live CSS reads besides `--itchio_link_color` (`bg_color`, `bg2_color`,
    `text_color`, …) are defined only on project pages.
- **Theme-font `<link>`.** 73 of 73 theme-font links seen in all runs use
  `fonts.googleapis.com/css?family=<Name>%3A400%2C400italic%2C700%2C700italic`. Variable families
  (Inter, Manrope, Roboto, Montserrat, Nunito, Noto Serif JP) get the same 400/700 request. On jams
  the link comes **after** `style#jam_theme` (cookie-jam-5, revival-jam-2026).
- **Jam newline style.** Out of sample, 2 of 4 multi-line jams are CRLF. The same host CSS is CRLF on
  scream-jam-2025 and LF on scream-jam-2026 (see §3.2).
- **Viewport units.** `100dvw` occurs once (nnda.itch.io profile,
  `width:calc(min(1200px,100dvw))`). Dynamic viewport units are not completely absent.
- **Response headers.**
  - `Content-Type: text/html` carries no charset. The charset comes only from
    `<meta charset="UTF-8"/>`, the first element in `<head>`.
  - No page has a `<meta http-equiv="Content-Security-Policy">`.
  - Devlog pages send no CSP header. Game pages send `frame-ancestors` (8/8).
- **Stylesheets in `<body>`.** None on 46 pages. The last stylesheet in `<head>` is
  `style#custom_css` on profiles and projects. On jams it is the theme font link, when one is set.

### Verdicts

| Fact | Verdict | Note |
|---|---|---|
| corpus-01 | corrected | 5 pairs re-diffed (nnda byte-identical; mirokshi, gourangadas, creator-64 and creator-88 differ only in newlines and trailing whitespace). Only **trailing** trimming is evidenced, because no source starts with whitespace. A literal `</style` is untested. |
| corpus-02 | confirmed (verified) | 0 entities; `>` 397/26 pages, `<` 17/5, `&` 162/21 reproduced. In Chrome 155 a `#a &gt; #b{}` rule is dropped and a raw `>` applies. |
| corpus-03 | corrected | Profile, project and in-sample jam numbers are reproduced. Out of sample, 2 of 4 multi-line jams are CRLF, and the scream-jam pair suggests jam newline style depends on when the CSS was saved. |
| corpus-04 | corrected | Leading trimming is untested. The mirokshi 4,726 → 4,725 B example was reproduced live. |
| corpus-05 | confirmed (observed) | 0/13 over 5,120, max 5,116 and 4 within 400 reproduced. The build script and leafo's reply (29–30 Apr 2023, "5kb") were re-read. The guide has no limit. |
| corpus-06 | corrected (inferred) | Valid only if the cap applied when pizzadoggy last saved; the save date is unknown. |
| corpus-07 | confirmed (verified) | 38,576 B served live and equal to its source after CRLF→LF plus the trailing LF. 13/26 projects are over 5,120. |
| corpus-08 | confirmed (verified) | 20,203 / 14,318 / 13,872 chars live. Out-of-sample scream-jam-2025 is 14,301 B. |
| corpus-09 | confirmed (verified) | Holds on 15/15 jams in pass 2, 8 of them new. Theme part 1,711–1,926 B. Use the first divider match. |
| corpus-10 | confirmed (verified) | Live placement re-checked. Chrome 155 drops the import, and the rule after it applies. MDN's placement rule was re-read. |
| corpus-11 | confirmed (verified) | Re-tested. An `@import` after `@font-face` is also dropped, and one after an `@layer` statement works. |
| corpus-12 | confirmed (observed) | 37 blocks, 33 gstatic srcs, scream-jam-2026 28 blocks (5 subsets). The `v30` URLs still return `font/woff2` 200. |
| corpus-13 | corrected | On jams the link comes after `jam_theme`, not before the custom CSS. The pattern holds for 73/73 links, variable fonts included. |
| corpus-14 | corrected | Correct for profile, project and devlog. On jams a theme font link follows `jam_theme`. user_theme is 783–998 B. |
| corpus-15 | corrected | Absence was re-confirmed (deskcansaw, ncase and 5 featured games). The quoted regex is order-dependent and fails on current HTML. First-run count: 19 HTTP-200 game pages without CSS (not 22). |
| corpus-16 | confirmed (verified) | 55/62, 3/62, 19/62 (13 jams), header 8 and user_tools 5 reproduced. The new parser finds 2,275/2,593 = 87.7 % unscoped (pass 1 tool: 2,227/2,545). |
| corpus-17 | confirmed (observed) | 8 pages with `.footer` rules, 0 hide it. One animates it with an infinite rotation. |
| corpus-18 | corrected | Counts reproduced, except projects: 4/26 have no newline (5/26 only under the >300 chars/line rule). "Counts against the cap" is inferred. |
| corpus-19 | corrected | 11 pages, 0 U+FFFD/BOM/NBSP and byte-identical nnda reproduced. There is **kana but no kanji** (0 CJK ideographs). |
| corpus-20 | confirmed (verified) | creator-64's three hex escapes (`25B6`, `FE0E`, `2197` in `content`) are unchanged in the CRLF-normalised diff. 23 escapes in 4 pages. |
| corpus-21 | confirmed (verified) | Hosts 16/5/1. All 18 profile/project `@import`s come first. creator-113, hamgarian and mirokshi were re-fetched. |
| corpus-22 | confirmed (observed) | creator-113 80 B → 16,704 B; hamgarian 79 B → 12,824 B; nnda 4,759 B inline + 5,606 B `i.css`. |
| corpus-23 | confirmed (verified) | Headers reproduced, plus `x-jsd-version-type: version` / `branch`. |
| corpus-24 | confirmed (verified) | Games 8/8 frame-ancestors only; profiles 10/10, jams 14/14 and devlog 1/1 have none; no meta CSP. |
| corpus-25 | confirmed (observed) | Host counts reproduced (img.itch.zone 10 outside comments). 0 `http://`. |
| corpus-26 | corrected | Counts and sizes (146–2,098 B) reproduced. Only 1 page (revival-jam-2026) has raw `<svg>`; most are percent-encoded or base64. |
| corpus-27 | corrected | All listed features reproduced, but `100dvw` occurs once, so dynamic viewport units are not absent. Nested rules counted 145 vs 142 (parser). |
| corpus-28 | corrected | 45/62 pages (8/17/20) and 972 outside comments. Pass 1 counted a case-insensitive `!IMPORTANT` inside a comment. |
| corpus-29 | confirmed (verified) | Devlog CSS is 23,059 B and byte-identical (sha256 prefix 4be8f70bd08c2195). |
| corpus-30 | confirmed (verified) | The AMP URL is `https://itch.io/devlog/<id>/<slug>.amp` with 3 style elements (2 amp-boilerplate, 1 amp-custom of 14,359 B), no `#wrapper` and 0/116 chunks. It is styled by itch, not unstyled. |
| corpus-31 | corrected | Classes and ids are right, but attribute order is not fixed: pass 2 saw `class="main wrapper game_page_wrapper" id="wrapper"`. The `.wrapper` class exists only on project and devlog pages. |
| corpus-32 | confirmed (observed) | Counts match when tokens are counted anywhere in code; counting selector preludes only gives −1 for some. |
| corpus-33 | confirmed (observed) | Same as corpus-32. |
| corpus-34 | confirmed (observed) | Exact match. |
| corpus-35 | confirmed (observed) | 11 pages, 0 jams, and all per-variable counts reproduced. |
| corpus-36 | corrected | Live classes run customa…**customae** (31 distinct) plus `text-right`. The build script's class map was confirmed. |
| corpus-37 | confirmed (observed) | 5/62, 34 and 33 reproduced. The suggested guard misses `#wrapper` itself and its own `::before`/`::after`. |
| corpus-38 | corrected | 429s also hit at 6–10 s pacing. curl 8.7.1: a CR in `-o` becomes `_` and the request is **sent**; a CR in `-D` gives exit 23 and a CR in the URL exit 3, with nothing sent. |
| corpus-39 | confirmed (observed) | Out of sample: 3/8 jams and 0/5 featured games carry CSS. The guide says access is enabled per account. |
| corpus-40 | confirmed (verified) | Re-fetched 4,725 B. The only difference is the trailing LF, with 1 raw `>` and 0 entities. |
| corpus-41 | confirmed (documented) | The headings are exact. There is no size limit, no `@import` and no "character"; External content asks for HTTPS and Base64. |
| corpus-42 | confirmed (observed) | nnda has 31 nested rules. creator-74 has 3 gstatic `.woff2` `@font-face` blocks and no `@import`. The forum OP mentions one-letter animation names. |
