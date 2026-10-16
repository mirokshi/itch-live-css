# Evidence log — dimension `repo`

Mining a private, hand-maintained itch.io custom-CSS workspace (a profile page, styled and shipped
between June and October 2026) for hard-won facts, then re-checking the ones that can be checked
without an itch account against the live page, itch's public static files and MDN
browser-compat-data.

- **Date:** 2026-10-14
- **Collector:** AI agent (dimension `repo`)
- **Source repo (read only, private, on the author's machine):**
  `itch-io-custom-css` (local checkout; 7 commits, 2026-10-12 → 2026-10-13;
  history restarted 2026-10-12, so older dates only survive in the repo's notes).
- **Live page used for re-checks (repo owner's own public profile):** `https://mirokshi.itch.io/`
- **Raw downloads** (never copied into this project): the session scratchpad,
  `…/scratchpad/repo/raw/` and `…/scratchpad/repo/bcd/`.

Confidence labels follow the knowledge base convention. A note the repo marks "confirmed live
(date)" is `verified` + `repo-history`. If it was re-observed today, the evidence also lists
`live-observation`.

---

## 1. Method

### 1.1 Repo files read (all of them)

| File | What it contributed |
|---|---|
| `.claude/CLAUDE.md` | Main notebook: constraints, DOM map, confirmed-live dates, gotchas, preview workflow |
| `README.md` | Workflow (edit source → minify → paste), rules list |
| `src/main.css` | Every comment (why each rule exists, rejected attempts) |
| `dist/main.min.css` | Size check (4,726 bytes incl. trailing newline) |
| `.claude/minify-css.ps1` | Minification regexes, UTF-8 handling |
| `custom-css/README.md`, `api/live.js`, `lib/*.js`, `dev.js`, `vercel.json` | External per-visit CSS service: headers, specificity tricks, escaping, a11y notes |
| `bio/custom-mix.html`, `bio/custom-hello.html` | Bio HTML that survives the sanitizer |
| `preview/itch-io.html`, `preview/itch-io-preview.html`, `preview/main-preview.css` | June 2026 owner-view export: head order, `user_theme`, DOM, theme-editor config JSON |
| `playground/cards.html`, `mix.html`, `title-dots.html` | Effect benches and notes on rejected effects |
| `docs/custom-css-guide.md` | Offline copy of itch's official guide (re-checked live, §2.6) |
| `git log -p --stat` | Removed notes: the Accept-Language greeting, `visibility:hidden` → `color:transparent`, the temporary alias |

Commands:

```bash
git -C "<repo>" ls-files
git -C "<repo>" log --stat --format='==== %h %ad %s' --date=iso
git -C "<repo>" log -p --format='==== %h %s' -- .claude/CLAUDE.md | grep -E '^(====|-[^-])'
git -C "<repo>" log -p e642378^..HEAD -- custom-css src/main.css
```

### 1.2 Network requests (GET only, browser UA, ≥1.5 s apart)

| # | URL | Result |
|---|---|---|
| 1 | `https://mirokshi.itch.io/robots.txt` | 200 (subdomain robots: disallows `/*/download/`, `/*/rh/`, `/*/rp/`, `/-/`) |
| 2 | `https://mirokshi.itch.io/` (with `-D` headers) | 200, 19,603 bytes, `X-Cache-Status: HIT` |
| 3 | `https://static.itch.io/user.css?1791970861` | 200, 71,824 bytes, `Last-Modified: Tue, 06 Oct 2026` |
| 4 | `https://mirokshi.itch.io/` (repeat; file timestamps show it came ~68 s after #2 and ~29 s after #3, not "immediately") | **429 Too Many Requests** (openresty), most likely caused by parallel agents crawling itch from the same IP |
| 5 | `https://static.itch.io/robots.txt` | 200 |
| 6 | `https://static.itch.io/theme_editor.min.js?1791970861` | 200, 85,760 bytes |
| 7 | `https://static.itch.io/lib.min.js?1791970861` | 200 |
| 8 | `https://static.itch.io/bundle.min.js?1791970861` | 200 |
| 9 | `https://mirokshi.itch.io/` (~140 s after the 429, per file timestamps) | 200, same widget ids as #2 (later fetches got different ids, see Verification) |
| 10 | `https://itch.io/docs/creators/css-guide` | 200 |
| – | the external stylesheet that the profile `@import`s (Vercel), fetched twice | 200 both times, different bodies |
| – | `raw.githubusercontent.com/mdn/browser-compat-data/main/…` | BCD JSON for `random`, `content`, `overflow`, `@property`, `sin`, `backdrop-filter`, `translate`, plus `browsers/chrome.json` and `browsers/safari.json` |

That is 10 itch requests in total.

Template:

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
curl -sS -A "$UA" --compressed -D page.hdr -o page.html https://mirokshi.itch.io/ ; sleep 1.5
```

### 1.3 Local tests (scratchpad only)

1. **Minifier behaviour.** Copied `.claude/minify-css.ps1` into `scratchpad/repo/minitest/.claude/`,
   so its `$PSScriptRoot\..\dist` output lands in the scratchpad. Fed it a crafted `src/main.css`
   through a fake hook event:
   `@{tool_input=@{file_path="…\src\main.css"}} | ConvertTo-Json | powershell -File minify-css.ps1`.
2. **PowerShell 5.1 encoding.** Wrote `content:"→ · ñ"` as BOM-less UTF-8. Read it with
   `Get-Content -Raw`, then (a) wrote it back with `Set-Content`, and (b) wrote it back with
   `[IO.File]::WriteAllText(…, UTF8)`.
3. **CSS string escaping.** `node` (v22.13.0) imported the repo's `lib/util.js` `cssString()`
   and ran it on sample strings.

---

## 2. Results

### 2.1 Live profile `<head>` order (logged out, 2026-10-14)

`link user.css` → inline `<script>`s → `script lib.min.js` → `script bundle.min.js` → `script[data-src] react.min.js` (lazy)
→ `script user.min.js` → `<style id="user_theme">` → `<style id="custom_css" type="text/css">` (last).

The owner view (June export, logged in) also loads `theme_editor.css` and `theme_editor.min.js`.
It adds a Google Fonts `<link>` between `user_theme` and `custom_css` when the theme font is a
Google font (Inter at the time). None of these appear logged out with a built-in font (Lato).

### 2.2 Stored CSS vs pasted CSS

| Item | Value |
|---|---|
| `style#custom_css` text length (live) | 4,725 chars |
| `dist/main.min.css` (trimmed) | 4,725 chars |
| Identical? | **yes, byte for byte** (itch neither reformats nor minifies) |
| June 2026 saved `theme.css` (owner export JSON) | 4,808 chars, so at least 4,808 chars can be saved |
| External `@import`ed sheet size | 14,837 / 14,824 bytes (two fetches; bodies differ) |

### 2.3 Response headers of the profile

No `Content-Security-Policy` header and no `<meta http-equiv>` CSP. The response does have
`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`
and `Referrer-Policy: no-referrer-when-downgrade`. Served through Cloudflare (`cf-cache-status: DYNAMIC`, `X-Cache-Status: HIT`).

### 2.4 Selector presence on the live profile (logged out)

| Pattern | Count |
|---|---|
| `formatted_description` | 0 |
| `id="inner_column"` | 0 (only the `.inner_column` class) |
| `class="user_page_wrap" id="wrapper"` | 1 |
| `id="profile_header"` | 1 |
| `text_header"><h1>` (non-empty h1 with the display name) | 1 |
| `user_profile formatted` | 1 |
| `mode_grid` | 1 |
| `has_banner` | 0 |
| `aria-hidden` inside the bio | 0 |
| Classes inside the bio | `custom-title`, `custom-fs/fh/fp`, `text-center`, `custom-hello` |
| `purchased_games` / `collection_row` elements | 0 (only in the theme CSS); the June owner export had a `section.purchased_games` |
| Widget ids | `user_1446967`, `user_links_364934` at 12:09 and 12:12; `user_9390667` / `user_links_9448707` at 12:22 and `user_7179622` / `user_links_8368685` at 12:36 (all logged out, same day; see Verification); `user_6839842`, `user_links_3877660` in the June owner export |

### 2.5 itch `user.css` (build `?1791970861`, last-modified 2026-10-06), relevant rules (paraphrased)

| Selector | Declarations that matter |
|---|---|
| `.game_grid_widget` | `display:grid`, `repeat(auto-fill,minmax(250px,1fr))` columns, `grid-gap:25px var(--itchio_grid_gap,10px)`, **`align-items:start`**, `font-size:16px` (14px ≤650px) |
| `.user_page_wrap` | `display:flow-root; position:relative; padding-bottom:50px` |
| `.footer` | `position:absolute; bottom:0; left:0; right:0` + top border, 12px |
| `.inner_column` | `max-width:960px; margin:0 auto; padding:0 20px` |
| `.user_page.has_banner .header .text_header` | `display:none` |
| `.user_page .text_header>h1` | ~2.43em, `margin:40px 0 5px` |
| `.user_page .user_profile.formatted` | 1.1428em; its h1 2em, h2 1.5em, h3 1.25em |
| `.text-center` | `text-align:center` |
| `.user_page.mode_column …` | 315px game column, sticky columns, breakpoint 800px |
| `.user_page.mode_grid` | **no rules at all** (grid is the default look; added in verification) |
| `.user_page:not(.mode_show_purchases) .purchased_games` | `display:none` (added in verification) |
| `.formatted h1,…h4` | `font-size:18px; margin:0 0 10px 0` (sizes then overridden by `.user_page .user_profile.formatted hN`; added in verification) |
| `.game_grid_widget .game_cell .game_thumb` | `overflow:hidden; position:relative; background:rgba(0,0,0,.1)` |

### 2.6 Official guide, live (2026-10-14)

`https://itch.io/docs/creators/css-guide` still says: classes must begin with `custom-` (others
are stripped by the sanitizer), put rules inside `#wrapper`, don't hide the footer links, and
external images/fonts must be HTTPS or Base64. It lists profile pages as supported but has **no profile
layout section** and **no mention of a character limit or of `@import`**.

### 2.7 Theme editor script findings (`theme_editor.min.js`, `bundle.min.js`)

- `CssEditor` is a plain `<textarea>`, with an "Expand ↗" button (a lightbox titled "Edit CSS", subtitled "Changes are
  automatically applied.") and a "Readme" button. **No `maxLength` or length-related string** turns up anywhere
  in `theme_editor.min.js`, `bundle.min.js` or `lib.min.js` (searched for `5120`, `maxLength`,
  `too long`, `characters`).
- The live preview writes the CSS into `#custom_css` via `I.strip_css(css)`, which (in
  `bundle.min.js`) removes the **first** `</style>` match, case-insensitive and without the `g` flag.
- `BackgroundImageUploader` defaults: `repeat: "repeat"`, `position: "align_center"`.
- The June owner export's `css_template` maps position `align_right` → `100% 0`,
  `align_center` → `50% 0`, anything else → `0 0`. Repeat defaults to `repeat` and attachment is optional.
  Background color goes on `body`, and `--itchio_ui_bg` on `:root`.
- A "Copy theme / Paste theme" feature serialises the theme as JSON (`format: "itchio_theme"`,
  `version: 1`, `source: "jam"`). It is defined only in the `JamEdit` package of
  `theme_editor.min.js` (no occurrence in the `GameEdit` or `Profile` packages), so it belongs to
  the **jam** theme editor. The copied keys include `css`.

### 2.8 Local test results

**Minifier.** Input → output (the regex minifier the repo uses):

| Input | Output | Verdict |
|---|---|---|
| `#wrapper ::selection{…}` | `#wrapper ::selection{…}` | OK (space kept: removing it would mean `#wrapper::selection`) |
| `width:calc(100% - 2rem)` | unchanged | OK (spaces around `-` kept) |
| `content:"a, b ; c { d }"` | `content:"a,b;c{d}"` | **corrupted**: the minifier doesn't know about strings |
| `content:"/* not a comment */"` | `content:""` | **corrupted** |
| `content:"→ ñ"` | unchanged | OK (UTF-8 read and write) |
| `margin : 0` | `margin :0` | OK (valid) |
| `content:"time: 10:30"` | `content:"time:10:30"` | **corrupted** (added in verification) |
| `content:"two  spaces"` | `content:"two spaces"` | **corrupted** (added in verification) |
| `content:";}"` | `content:"}"` | **corrupted**: the string loses its `;` but the rule stays valid (added in verification; this row first claimed the rule broke, which pass 2 found wrong) |
| `grid-template-areas:"a b" "c d"` | unchanged | OK (added in verification) |

**PowerShell 5.1.**

| Step | Result |
|---|---|
| `Get-Content -Raw` on BOM-less UTF-8 | in-memory text is `â†’ Â· Ã±` |
| …then `Set-Content` (ANSI) | bytes happen to round-trip unchanged |
| …then `WriteAllText(UTF8)` | file now contains `â†’ Â· Ã±` (**mojibake persisted**) |
| Length of a 35-char sample | 35 chars, 39 bytes on disk |

**cssString escaping.**

| Input | Escaped |
|---|---|
| `¡Hola!` | `"\a1 Hola!"` |
| `é1` | `"\e9 1"` |
| `café 1` | `"caf\e9  1"` |
| `a⏎b` | `"a\a b"` |
| `→` | `"\2192 "` |

The live external sheet contains **0** non-ASCII characters.

### 2.9 MDN browser-compat-data (main branch, read 2026-10-14)

| Feature | Chrome | Firefox | Safari |
|---|---|---|---|
| `random()` | **156** (beta; stable 2026-10-20; current is 155) | preview only | **26.2** |
| `content` alt text (`"x" / "alt"`) | 77 | 128 | 17.4 |
| `overflow: clip` | 90 | 81 | 16 |
| `@property` | 85 | 128 | 16.4 |
| `sin()` | 111 | 108 | 15.4 |
| `backdrop-filter` (unprefixed) | 76 | 103 | 18 (`-webkit-` prefix since 9) |
| `translate` property | 104 | 72 | 14.1 |

---

## 3. Short illustrative snippets (my own wording)

Background tuning that keeps the theme image (longhands only):

```css
#wrapper{background-repeat:no-repeat;background-size:cover;
  background-position:center;background-attachment:fixed}
```

Overriding a theme variable where the theme actually sets it:

```css
#wrapper .user_page{--itchio_link_color:#ffc857}
```

Winning a tie from inside an `@import`ed sheet:

```css
#wrapper .custom-x.custom-x{color:gold} /* doubled class beats #wrapper .custom-x */
```

---

## 4. How to re-run

1. Read the repo files listed in §1.1 and run the `git` commands.
2. Make the ten itch requests in §1.2, at least 1.5 s apart. Back off for 30 s or more after a 429.
3. Parse `style#custom_css` and compare it with the repo's `dist/main.min.css`. List the `<head>` elements and
   count the patterns in §2.4.
4. Grep `user.css` for the selectors in §2.5. Grep the three `static.itch.io` scripts for
   `strip_css`, `CssEditor`, `maxLength`, `5120`.
5. Repeat the local tests in §1.3 in a scratch folder. Never run the hook script in place: it writes
   into `<repo>/dist/`.

---

## Verification (2026-10-14)

An adversarial pass by a second agent. It re-read every source itself, re-fetched every live
resource, and re-ran or extended every local test. It never used the browser-pane tools.
Rendering tests ran in **headless Chrome 155.0.8059.40** driven over the DevTools Protocol by
a local Node script, against local files only.

### V.1 Requests made by the verifier (GET only, browser UA, ≥2 s apart)

| # | URL | Result |
|---|---|---|
| 1 | `https://mirokshi.itch.io/` (12:22 CEST) | 200, `X-Cache-Status: HIT`, no CSP header or meta |
| 2–5 | `https://static.itch.io/{user.css,theme_editor.min.js,bundle.min.js,lib.min.js}?1791970861` | 200, same sizes as §1.2 (user.css `Last-Modified: Tue, 06 Oct 2026 21:47:49 GMT`) |
| 6 | `https://itch.io/docs/creators/css-guide` | 200 |
| 7 | `https://itch.io/t/2818377/increase-profile-custom-css-size-limit-currently-5kb` | 200 (forum thread, admin reply 2023-04-29) |
| 8 | `https://mirokshi.itch.io/` (12:36 CEST) | 200, `X-Cache-Status: EXPIRED` |
| – | external `live.css` (Vercel), twice | 200, `Cache-Control: no-store`, `Content-Type: text/css; charset=utf-8`, `X-Vercel-Cache: MISS`, bodies differ (14,853 / 14,829 bytes), 0 non-ASCII chars |
| – | BCD JSON (`raw.githubusercontent.com/mdn/browser-compat-data/main/…`) | random, content, overflow, @property, sin, backdrop-filter, translate, rotate, nesting, :has, browsers/{chrome,safari,firefox} |
| – | `https://vercel.com/docs/deployment-protection` (WebFetch) | "Standard Protection: protects all deployments except production domains" |

That is 8 itch requests.

### V.2 Local tests

The tools live in `knowledge/evidence/repo-verify-tools/`:

- `cdp.mjs` is the runner: `node cdp.mjs "<chrome.exe>" "<temp profile dir>" spec.json`. The spec holds
  `{url, width?, height?, reducedMotion?, eval?, ax?:[selectors], screenshot?}`. It prints the `eval`
  result, Chrome's computed accessibility name and role per selector, and can save a PNG.
- `px.py` reads RGB pixels from a PNG using only the Python standard library.
- `tests/*.html` are self-written pages. `footer.html` expects itch's `user.css`, downloaded into
  `tests/itch/user.css`.
- `build_replicas.py` regenerates the two pages that embed itch content (never stored here) from a
  fresh download. `profile-sim.html` is the live theme, `user.css` and synthetic cards, with no
  custom CSS. `live-replica.html` is the live HTML and custom CSS, with scripts stripped and the
  theme image replaced by a data URI, so it makes no itch requests. Its external `@import`s still
  load from Google Fonts and Vercel.

| Test | Page | Result |
|---|---|---|
| Minifier (copy of the repo hook in scratch) | crafted `src/main.css` | Same outputs as §2.8, plus the extra string corruptions added there |
| PS 5.1.26100.9444, ANSI = Windows-1252 | 3 small files | `Get-Content -Raw` gives `â†’ Â· Ã±`; `Set-Content` restores the bytes; `WriteAllText(UTF8)` persists the mojibake; `-Encoding utf8` reads correctly |
| `cssString()` (Node 22.13.0) | repo `lib/util.js` | Same as §2.8; `😀x` → `"\1f600 x"` |
| Footer | `footer.html` with real `user.css` | `.user_page_wrap` = flow-root/relative/pb 50px; `.footer` absolute, bottom 0. `#wrapper .footer{margin-top:48px}` **changes nothing**; `#wrapper{padding-bottom:0}` makes the footer **overlap content by 15px**; padding 100px adds space; `.footer{margin-bottom:20px}` moves the footer **up** |
| Same, on the live DOM | `live-replica.html` | Footer top 1080.47px with and without the live `margin-top:48px` rule: **a dead rule** |
| Cascade | `cascade.html` | Imported `#wrapper .tie` loses to the box's equal rule (red); `.dbl.dbl` and `h1.typ` win (green); an imported equal-specificity rule beats the earlier `<style id=user_theme>` (green); `@import` placed after a rule is dropped from the CSSOM (1 rule) |
| Background | `profile-sim.html` | Theme alone: image, no-repeat, `50% 0`, fixed. `#wrapper{background:#123}` → `background-image:none`. Longhands keep the image |
| Grid | `profile-sim.html` | `align-items:start` from `user.css`; heights 305/337/353/369; `grid-auto-rows:1fr` **alone: unchanged**; `+ align-items:stretch` gives 369 ×4. Live replica: 5 cells all 367px |
| Covers | `profile-sim.html` | `#wrapper .game_thumb img{width:100%;height:100%}` works **without** `!important` (313×248.7, i.e. 63:50); the inline `background-color` is only overridden **with** `!important` |
| Theme vars | `profile-sim.html` and live replica | `#wrapper{--itchio_link_color:red}` leaves `.user_page` at `#ffc857`; `#wrapper .user_page{…}` sets it, yet game title and footer link colors stay `rgb(255,200,87)` (hardcoded); only `#wrapper .game_title a{color}` recolors |
| Nesting | `profile-sim.html` | The theme's nested rules apply in Chrome 155 (title `rgb(255,200,87)`, `.game_text` `rgba(238,243,255,.75)`) |
| External import | `live-replica.html` | Both `CSSImportRule`s have a `styleSheet`, `cssRules` throws `SecurityError`; effects applied (`.custom-hello` inline-grid and transparent, `#wrapper::before` data-SVG, h1 `breath`); Google css2 variable fonts loaded (Edu AU VIC WA NT Hand, Playfair Display, Syne) |
| A11y names | `a11y.html`, `letters.html`, replica | The roller with `/ ""`: `Hi! , I am…`; without alt: all greetings are read; `visibility:hidden` marker: `, I am…`. **Per-letter `inline-block` / `inline-grid` / flex children: `M i r o`** (inline spans: `Miro`; `aria-label` on the h1: `Miro`); the live title computes as **`M i r o k s h i`**. The real `h1` is ignored in the tree |
| Reduced motion | `motion.html` (emulated) | `#wrapper *,#wrapper *::before{animation:none!important}` stops kid, kid::before; **not** `#wrapper::before`, `#wrapper::after` or `kid::after` |
| Animation list | `motion.html` | A later `animation:a1` replaces `a1,a2` (1 animation); registered `--breath` on the h1 drives the child span's `font-weight` 700/550/400/550 at 0/1/2/3 s with 0 animations on the span |
| Clip | `clip.html` at 375px | rotated 30-line `::before`: none or `clip-path:inset(0)` → scrollWidth 372 > clientWidth 360 and the page is 1287px tall; `overflow-y:clip` → 375 = 375, 700 tall |
| Stacking | `stack-iso.html` / `stack-noiso.html` screenshots | With `isolation:isolate` the fixed `z-index:-1` `::before` covers `#wrapper`'s background, under its content; without it, `#wrapper`'s background covers the layer |
| Data URI | `misc.html` screenshot | `fill='%23ff0000'` renders red; raw `#ff0000` renders **nothing** (fragment); raw `<`/`>` render fine in Chrome 155 |
| Support | `misc.html` | Chrome 155: `CSS.supports('rotate','random(-10deg, 10deg)')` = false; nesting and `content` alt = true |

### V.3 Verdicts

| Id | Verdict | Note |
|---|---|---|
| 01 | corrected | itch admin (forum, 2023-04-29): profile CSS limit "5KB"; game pages "might actually be missing the size check". Chars vs bytes still unknown → documented |
| 02 | confirmed | Re-fetched: 4,725 chars, identical to `dist/` |
| 03 | confirmed | Head order re-parsed; import-vs-user_theme order tested |
| 04 | confirmed | Source → documented, not verified; also `render_css_editor` only when `can_use_css`, in a "Misc" group |
| 05 | confirmed | Source; also applied to the `game_theme`, `jam_theme` and `user_theme` previews |
| 06 | corrected | Selector and `calc` rules hold, but "safe" is overstated: `: ` removal and whitespace collapse also hit strings |
| 07 | corrected | More corruptions found; `grid-template-areas` is not affected |
| 08 | confirmed | Reproduced (Windows-1252 code page) |
| 09 | confirmed | Kept live and loaded when the exact live CSS renders; no CSP |
| 10 | confirmed | Late `@import` dropped (tested) → verified |
| 11 | confirmed | Headers re-checked |
| 12 | confirmed | Headers and bodies re-checked; Vercel docs state the protection scope |
| 13 | confirmed | Tested → verified |
| 14 | unverifiable | Owner report only (Brave) |
| 15 | confirmed | BCD re-read; Chrome 155 rejects `random()` |
| 16 | confirmed | Re-run |
| 17 | confirmed | `#` must be `%23` (tested); raw `<>` also OK in Chrome |
| 18 | confirmed | Tested |
| 19 | confirmed | Template mapping + live output (`--itchio_ui_bg` = 20 % BG + 80 % #333 → `#2b2c33`) |
| 20 | confirmed | Tested on live replica |
| 21 | confirmed | Tested in isolation |
| 22 | corrected | Add relaxed-nesting versions: a nested rule starting with a type selector (`hr{}`) needs Chrome 120 / Safari 17.2 / Firefox 117 |
| 23 | confirmed | DOM re-parsed |
| 24 | confirmed | Rendered: margin-top no-op, padding-bottom 0 overlaps → verified |
| 25 | confirmed | `user.css` 2.4285714286em, `40px 0 5px 0` |
| 26 | confirmed | Live bio re-parsed (but see the new spelled-out-name fact) |
| 27 | confirmed | — |
| 28 | unverifiable | Needs an account; live absence is not proof (the bio source no longer contains `aria-hidden`) |
| 29, 30 | confirmed | Counts 0 / 0 on two fresh fetches |
| 31 | corrected | `layout` → mode_grid or mode_column (exclusive); `collection_layout:"grid"` → mode_collection_grid **independently**; "Supported by me" → mode_show_purchases; no `.mode_grid` rules in `user.css` |
| 32, 33 | confirmed | Rendered → verified |
| 34 | corrected | The inline style only sets `background-color`; width/height need no `!important` |
| 35 | confirmed | — |
| 36 | corrected | Ids change between logged-out renders minutes apart → verified |
| 37 | corrected | `ul#user_tools` is a **sibling** before `#wrapper`; the owner side is a June export → observed; `.purchased_games` is hidden by `user.css` when the setting is off |
| 38, 39 | confirmed | June export (observed) |
| 40 | corrected | Copy/Paste theme exists only in the **jam** theme editor |
| 41 | confirmed | Chrome AX tree → verified (not a screen reader) |
| 42 | confirmed | Live `roll 79.65s` = 27 × 2.95 s (the repo's "~83 s" is stale) |
| 43 | confirmed | Tested → verified |
| 44 | corrected | Add caveat: inline-block letters make Chrome announce "M i r o k s h i" |
| 45, 46 | confirmed | Tested → verified |
| 47, 48, 49 | confirmed | Repo sources + BCD (`:has` Chrome 105 / Firefox 121 / Safari 15.4) |
| 50 | confirmed | Tested → verified |
| 51 | confirmed | Chrome AX tree → verified |
| 52 | unverifiable | Cannot run those tools here; a removed note did claim "verified: the heading reads 'Mirokshi'", while Chrome computes "M i r o k s h i" |
| 53 | confirmed | The same approach worked for this verification |
| 54 | corrected | The <768px touch emulation and hidden-pane rAF stall are specific to Claude's preview pane, not to browsers in general |
| 55 | corrected | The 429 came ~68 s after the first profile GET (not 1.5 s) and the 200 ~140 s after the 429; cause probably the shared IP |
| 56, 57 | confirmed | Guide re-grepped; `user.css` re-read |

---

## Verification (2026-10-14, second pass)

A second adversarial pass ran from 15:05 to 15:20 CEST. It re-downloaded everything into a fresh
scratch folder (`…/scratchpad/repo-verify2/`), re-read the repo files and its git history, and
re-ran every local test. It did not use the earlier pass's downloads or outputs. No browser-pane
tools were used. Rendering tests ran in headless Chrome 155.0.8059.40 through
`repo-verify-tools/cdp.mjs`.

### P2.1 Requests (GET only, browser UA)

| Time (CEST) | URL | Result |
|---|---|---|
| 15:05:42 | `https://mirokshi.itch.io/` | 200, `X-Cache-Status: HIT`, no CSP header or `<meta http-equiv>` |
| 15:05:45–58 (3 s apart) | `static.itch.io/{user.css,theme_editor.min.js,bundle.min.js,lib.min.js}?1791970861`, `itch.io/docs/creators/css-guide` | all 200; byte sizes identical to pass 1 |
| 15:06:02 | `itch.io/t/2818377/…` (forum thread) | 200 |
| 15:13:32 | `https://mirokshi.itch.io/` | **429** (openresty, no `Retry-After`), although this client's previous itch request was 7.5 min earlier |
| 15:15:05 | `https://mirokshi.itch.io/` | 200, `X-Cache-Status: EXPIRED` |
| 15:1x | `static.itch.io/user.css?1791981660` (the page's new build number) | 200, byte-identical to the `?1791970861` copy, `Last-Modified` still 2026-10-06 |
| – | the Vercel `live.css`, twice | 200, `text/css; charset=utf-8`, `no-store`, `X-Vercel-Cache: MISS`, bodies differ (14,851 / 14,828 bytes), 0 non-ASCII; `animation:roll 79.65s` |
| – | 13 BCD JSON files from `raw.githubusercontent.com/mdn/browser-compat-data/main/` | same versions as §2.9 |
| – | `vercel.com/docs/deployment-protection` (WebFetch) | "Standard Protection: Protects all deployments except production domains" |

That is 11 itch requests.

### P2.2 New observations

- **Renders vary**: between the 12:22 page and the 15:05 page, and again at 15:15, the widget ids
  changed (`user_8508547`/`user_links_6659522` at 15:05, `user_1269394`/`user_links_482975` at
  15:15). The **attribute order** of nearly every tag changed too (`<style id="user_theme"
  type="text/css">` became `<style type="text/css" id="user_theme">`), and so did the **order of
  the class tokens on `<body>`** (`… no_theme_toggle responsive` became `… responsive
  no_theme_toggle`). Compared tag by tag with sorted attributes and numbers masked, the two documents are
  otherwise identical (298 parse events each). The `?build` number in asset URLs changed from
  `1791970861` to `1791981660`, but `user.css` stayed byte-identical. `build_replicas.py` matched
  the exact attribute order, so it failed on the new render. It has been fixed to match
  `id="user_theme"` anywhere in the tag.
- **June owner export structure**: `section.purchased_games` and `section.collections >
  .collection_row ×2` are direct children of `.user_page`, after `.inner_column.profile_content`.
  They are not inside `.game_column`. The export's `.user_page` had no `mode_show_purchases`, so
  `user.css` (`.user_page:not(.mode_show_purchases) .purchased_games{display:none}`) hid
  "Supported by" there anyway. The logged-out page today has neither section.
- **Theme editor source**: Profile package `render_css_editor` returns nothing unless
  `can_use_css`, and otherwise draws the CSS box in a "Misc" group above a "Save" button. The shared
  font picker's "Select Google Font..." builds
  `https://fonts.googleapis.com/css?family=<Name>:400,400italic,700,700italic` (helper `zt`), so a
  theme font only ever gets weights 400 and 700.
- **itch admin on the cap** (forum thread above, 2023-04-29, user flagged "Admin"): the profile
  custom CSS limit is "5kb". The same admin said game pages "might actually be missing the size check".

### P2.3 Local tests re-run

| Test | Result (pass 2) |
|---|---|
| Minifier (fresh copy of the hook, new crafted input) | `#wrapper ::selection` and `calc(100% - 2rem)` kept. Strings corrupted: `"a,b;c{d}"`, `""` for `"/* … */"`, `"time:10:30"`, `"two spaces"`, `";}"` → `"}"` (rule stays valid). `grid-template-areas:"a  b" "c   d"` → `"a b" "c d"`, and an unencoded data-URI SVG `circle{ fill: red; }` → `circle{fill:red}`: both changed, but harmlessly. Percent-encoded data URI unchanged. Output 489 chars / 492 bytes, and the hook reports chars |
| PS 5.1.26100.9444, code page 1252 | Same as pass 1. `Get-Content -Raw -Encoding utf8` reads correctly |
| `cssString()` | Same as §2.8. Also `a\b"c` → `"a\\b\"c"` |
| `strip_css` regex (node) | `"</style>"` removed, the second `"</STYLE >"` kept: first match only, case-insensitive |
| footer / cascade / motion / profile-sim / clip / a11y / letters / misc / stacking / live replica | Every number in V.2 reproduced exactly (footer 35 → 35 → −15 → 85 → 15 px; cells 305/337/353/369 → 369 ×4; replica 5 × 367 px; footer top 1080.47 with and without `margin-top:48px`; clip 372 > 360 vs 375 = 375; AX names `Hi! , I am…`, `M i r o k s h i`; `#b` raw-`#` SVG paints nothing) |

### P2.4 Verdicts (second pass)

| Id | Verdict | Confidence | Note |
|---|---|---|---|
| 01 | corrected | documented | Admin: profile limit "5kb" (2023); ≥4,808 ASCII chars saved (June); chars vs bytes unknown |
| 02 | confirmed | verified | 4,725 chars identical at 15:05 and 15:15 |
| 03 | confirmed | verified | custom_css is the last element in `<head>` |
| 04 | confirmed | documented | Source; also gated by `can_use_css`, "Misc" group, Save button |
| 05 | confirmed | documented | Source + node test of the regex |
| 06 | confirmed | verified | Necessary rules hold; strings still unsafe (see 07) |
| 07 | corrected | verified | `grid-template-areas` and data URIs get whitespace collapsed but stay valid unless they contain `/*`, `: `, or spaces next to `{};,` |
| 08 | confirmed | verified | — |
| 09 | confirmed | verified | — |
| 10 | confirmed | verified | Late `@import` dropped from CSSOM |
| 11 | confirmed | verified | — |
| 12 | confirmed | verified | Vercel docs back the hash-URL point |
| 13 | confirmed | verified | — |
| 14 | unverifiable | observed | Owner report only |
| 15 | confirmed | documented | BCD; Chrome 155 `CSS.supports` false |
| 16, 17, 18, 19, 20, 21 | confirmed | verified | — |
| 22 | corrected | verified | Compact but not minified (`color: #eef3ff`); nested `hr{}` needs relaxed nesting (Chrome 120 / Firefox 117 / Safari 17.2) |
| 23 | confirmed | verified | — |
| 24 | corrected | verified | Rendered: `margin-top` is a no-op, `padding-bottom:0` overlaps by 15 px, `.footer{margin-bottom}` lifts the footer |
| 25, 26, 27 | confirmed | verified | 26: see the a11y caveat on per-letter spans |
| 28 | unverifiable | observed | The bio source has no `aria-hidden`, so its absence live proves nothing |
| 29, 30 | confirmed | verified | — |
| 31 | corrected | documented | `layout` → `mode_grid`/`mode_column`; `collection_layout` → `mode_collection_grid`; `show_purchases` → `mode_show_purchases`; `user.css` has no `mode_grid` rule |
| 32, 33 | confirmed | verified | — |
| 34 | corrected | verified | The inline style is only `background-color`; width/height overrides need no `!important` |
| 35 | confirmed | verified | — |
| 36 | corrected | verified | Ids change between renders minutes apart |
| 37 | corrected | observed | `ul#user_tools` is a sibling before `#wrapper`; "Supported by" was in the June DOM but hidden by `user.css` |
| 38, 39 | confirmed | observed | June export |
| 40 | corrected | documented | Copy/Paste theme only in `JamEdit` |
| 41 | confirmed | verified | Chrome AX tree, not a screen reader |
| 42 | confirmed | verified | 27 steps × 2.95 s = 79.65 s |
| 43 | confirmed | verified | — |
| 44 | corrected | verified | Inline-block letters → Chrome name "M i r o k s h i" |
| 45, 46 | confirmed | verified | — |
| 47 | confirmed | documented | BCD: Safari 9–17.x support only `-webkit-backdrop-filter` |
| 48, 49 | confirmed | observed | Repo notes and benches |
| 50, 51 | confirmed | verified | — |
| 52 | unverifiable | observed | Cannot run those tools here; repo states it was tested |
| 53 | confirmed | observed | — |
| 54 | corrected | observed | The touch emulation under 768 px and the rAF stall are Claude preview-pane behaviours |
| 55 | corrected | observed | A 429 arrived 7.5 min after this client's previous itch request; shared-IP traffic, no `Retry-After` |
| 56 | confirmed | documented | — |
| 57 | confirmed | verified | — |
