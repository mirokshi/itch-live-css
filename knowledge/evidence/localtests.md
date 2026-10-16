# Evidence log — `localtests` (local browser experiments)

- **Date:** 2026-10-14
- **Browser:** Chromium **152.0.7977.130** (Windows 11, embedded browser pane of the Claude desktop app).
  `navigator.userAgent` = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/2.37337.1 Chrome/152.0.7977.130 Safari/537.36 MSIX`;
  `userAgentData.brands` = `Chromium 152`. With the pane's "mobile" preset the UA becomes `… Android 14; Pixel 8 … Chrome/152.0.0.0 Mobile Safari/537.36`.
- **Scope:** every result below is **Chromium-only**. Firefox and Safari were not available; differences to check are listed at the end.
- **Nothing here touched itch.io.** All pages are synthetic: my own markup with itch's ids/classes and itch's `<head>` order, and my own stand-in CSS (no itch CSS copied).

## Method

1. Serve the public repo root twice (two origins, to emulate a third-party `@import` such as a Vercel service):
   ```sh
   python -m http.server 8090 --directory <repo>   # page origin
   python -m http.server 8091 --directory <repo>   # "foreign" origin
   ```
   python 3.12 `http.server` serves `.css` as `text/css` **without** a charset parameter, `.txt` as `text/plain`, extensionless files as
   `application/octet-stream`, and sends **no** `Access-Control-Allow-Origin` header (checked with `curl -sI`).
2. Open `http://localhost:8090/knowledge/tests/index.html` — it loads every test page in an iframe and prints a PASS/FAIL/INFO table per page
   (`?only=a-,b-` runs a subset). Each test page also runs standalone and prints its own table; results are exposed as `window.__results`.
3. Every test page reproduces itch's head order, taken from the private repo's export of a live profile page (`preview/itch-io.html`, June 2026,
   lines 18–115): `link user.css` → `link theme_editor.css` → `style#user_theme` → `link fonts.googleapis.com (Inter)` → `style#custom_css`.
   Locally: `link _lib/itch-base.css` (synthetic stand-in) → `style#user_theme` (synthetic theme rules) → `style#custom_css`.
   *Correction (verification, 2026-10-14):* that export was a **logged-in** owner view. The same profile fetched **logged out** on
   2026-10-14 (one `curl` of the profile page) has `link user.css` → scripts → `style#user_theme` → `style#custom_css`: no `theme_editor.css`
   and no Google Fonts `<link>` (the theme font is now Lato). `style#custom_css` is the last stylesheet in the document in both cases.
   Markup: `<div class="user_page_wrap" id="wrapper"><div class="user_page"><div class="user_profile formatted">…`.
4. Cascade winners are identified with **marker colors** (`rgb(1,1,1)` = theme, `rgb(2,2,2)` = imported sheet, `rgb(3,3,3)` = inline custom_css, …)
   read with `getComputedStyle`. Animations are made deterministic with `animation: … paused` + a negative delay (the agent's browser pane does not
   advance the animation timeline, see L). Layout-dependent tests (E, I, M1) run in `srcdoc` iframes, each its own mini document.
5. Accessibility-tool behaviour (K) was recorded by running the agent tools `read_page`, `find`, `get_page_text` on `k-a11y.html`.
   Network/console facts (B, F, M2) were read with `read_network_requests` / `read_console_messages`.

Re-run caveat: the pane caches files served by `http.server`; after editing a test, run
`await fetch(url, {cache: 'reload'})` for the changed files, then navigate again.

## Final run (all pages): 168 PASS · 0 FAIL · INFO rows recorded below

*(Corrected in the second verification pass: the per-page PASS counts below add up to **168**, not 163 as first written. Re-run 2026-10-14: 168 PASS · 0 FAIL.)*

| page | PASS | FAIL | INFO |
|---|---|---|---|
| a-import-cascade.html | 15 | 0 | 1 |
| b-import-position.html | 17 | 0 | 4 |
| c-mime-charset.html | 9 | 0 | 1 |
| c-quirks.html | 2 | 0 | 2 |
| c-win1252.html | 3 | 0 | 3 |
| d-layers.html | 9 | 0 | 2 |
| e-background.html | 7 | 0 | 0 |
| f-relative-url.html | 4 | 0 | 5 |
| g-property-keyframes.html | 12 | 0 | 4 |
| h-content.html | 10 | 0 | 2 |
| i-overflow-clip.html | 10 | 0 | 7 |
| j-support.html | 15 | 0 | 55 |
| k-a11y.html | 0 | 0 | 4 |
| l-media.html | 0 | 0 | 26 |
| m-containing-block.html | 27 | 0 | 1 |
| m-font-cors.html | 0 | 0 | 5 |
| m-syntax-gotchas.html | 23 | 0 | 0 |
| n-scope-specificity.html | 5 | 0 | 0 |

(Expectations were written from the specs first; four expectations were wrong on the first run and were corrected to the observed Chromium
behaviour: H2 `none` not `normal`, H6 attr() is resolved in the computed value, H7 adjacent strings are merged, M1 `container-type` does not
trap `position:fixed`; N3 `&` inside `@scope` adds no specificity.)

## A — `@import` vs inline `style#custom_css` vs `style#user_theme` (`a-import-cascade.html`)

| id | case | winner |
|---|---|---|
| A1 | same selector `#wrapper .a1` in imported sheet and in inline custom_css | **inline** (later in order) |
| A2 | import `#wrapper div.a2` (1,1,1) vs inline `#wrapper .a2` (1,1,0) | import (specificity first) |
| A3 | same selector `.user_page .a3` in import vs earlier `style#user_theme` | **import** (it sits inside custom_css, after user_theme) |
| A4 | import `.a4` (0,1,0) vs theme `.user_page .a4` (0,2,0) | theme |
| A5 | same rule in two sibling `@import`s | second import |
| A6 | nested `@import` (inside imported-1) vs imported-1's own rule | imported-1's own rule (nested import is ordered first) |
| A7 | `!important` in import vs `#wrapper#wrapper .a7` inline normal | import |
| A8 / A8b | `style=""` attribute vs `#wrapper .a8` / vs `#wrapper .a8b{…!important}` | style attr / the `!important` rule |
| A9 | `:where(#wrapper) .a9` vs theme `.user_page .a9` | theme (`:where()` = 0 specificity) |
| A10 | `#wrapper#wrapper .a10` (2,1,0) vs later `#wrapper .user_page .a10` (1,2,0) | doubled id |
| A11 | `#wrapper{--a-var}` vs theme `.user_page{--a-var}`; child uses `var(--a-var)` | theme (closer ancestor's declaration) |
| A12 | theme rule written nested `.user_page { .a12 {} }` vs `#wrapper .a12` | custom |
| A13 | custom rule written nested `#wrapper { .a13 {} }` vs theme `.user_page .a13` | custom |

Order of the effective cascade: `itch-base` < `user_theme` < (nested imports < import 1 < import 2 < inline rules of custom_css).

## B — `@import` placement and conditions (`b-import-position.html`)

| id | sheet content (each its own `<style>`) | applied? |
|---|---|---|
| B1 | `#wrapper .b1-own{…} @import url(late.css);` | import **dropped** (0 `CSSImportRule` in CSSOM, never requested); the rule before it applies |
| B2 | `@layer x; @import …` | applied |
| B3 | `@foo-unknown; @import …` | applied |
| B4 | rule with invalid selector (`::-moz-selection`) then `@import` | applied |
| B5 | `@charset "utf-8"; @import …` (inline style) | applied |
| B6 | `@import url(http://localhost:8091/…)` | applied; `importRule.styleSheet.cssRules` throws `SecurityError`; `href` readable |
| B7 | `@import … print` / `supports(display:grid)` / `supports(display:nonsense-value)` / `screen and (min-width:1px)` | no / yes / no / yes. The print sheet is still downloaded; the false `supports()` import is not requested and is absent from `cssRules` |
| B9 | `@import url(does-not-exist.css); #wrapper .b9{…}` | 404 is silent (one console "Failed to load resource"); the rest applies |
| B10 | `@media screen { @import … }` | dropped |
| B11 | `@import a; @layer y; @import b;` | a applied, **b dropped** (b is still fetched by the preload scanner but not applied) |
| B12 | nested style rule, then `@import` | dropped |
| B13 | `@import "file.css";` (string form) | applied |

No console warning is printed for any dropped `@import`.

## C — MIME type and charset (`c-mime-charset.html`, `c-quirks.html`, `c-win1252.html`)

Headers (curl): `plain.txt` → `text/plain`; `noext` → `application/octet-stream`; `*.css` → `text/css` (no charset).

| id | case | result |
|---|---|---|
| C1 / C2 / C7 / C8 | same-origin text/plain `@import` / cross-origin text/plain `@import` / text/plain `<link>` / octet-stream `@import` — standards mode | all **rejected** |
| CQ1 / CQ2 / CQ8 | same three in **quirks mode** (no doctype) | same-origin text/plain **applied**, cross-origin rejected, same-origin octet-stream applied |
| C3–C6, C9 | UTF-8 page: sheet without BOM/@charset/HTTP charset · with BOM · with `@charset` · ASCII + `\hex` escapes · non-ASCII directly in inline style | all decoded correctly (`"¡Hola! → ✓ 안녕"`) |
| CW3 | windows-1252 page, UTF-8 sheet with no BOM/@charset, **@import'ed from the inline style** | decoded as UTF-8 (correct) |
| CW10 | windows-1252 page, same kind of sheet via **`<link>`** | decoded with the page encoding → mojibake `"Â¡Hola! â†’ âœ“ ì•ˆë…•"` |
| CW4–CW6 | windows-1252 page: BOM / `@charset "UTF-8"` / `\hex` escapes | correct |

## D — cascade layers (`d-layers.html`)

| id | case | winner |
|---|---|---|
| D1 | `@layer custom { #wrapper .d1 }` (1,1,0) vs unlayered theme `.user_page .d1` (0,2,0) | **theme** |
| D2 | layered `!important` vs unlayered `!important` | **layered** |
| D3 | layered `!important` vs unlayered normal | layered |
| D4 / D5 | `@import url(…) layer(imp)` / `@import url(…) layer` | theme (imported rules become layered) |
| D-util | Tailwind-like `@layer utilities { .text-marker }` vs unlayered `.user_page a` | unlayered base rule (**confounded**: an *unlayered* `.text-marker` (0,1,0) also loses to `.user_page a` (0,1,1) on specificity, see Verification) |
| D6 | layered rule where nothing unlayered competes | applies |
| D7 | `@layer low, high;` higher-specificity rule in `low` vs rule in `high` | high |
| D8 | unlayered custom `#wrapper .d8` vs layered `#wrapper#wrapper .d8` | unlayered |

`@layer theme, base, components, utilities;` before `@import` is valid (Tailwind v4's output order).

## E — `background` shorthand on `#wrapper` (`e-background.html`)

Theme: `.user_page_wrap{background-image:url(_lib/panel.svg);background-repeat:repeat;background-position:50% 0}`.

| id | custom CSS | panel image |
|---|---|---|
| E1 | none | kept |
| E2 | `#wrapper{background:#123456}` | **removed** (image → `none`, repeat → `repeat`) |
| E3 | `#wrapper{background-color;background-repeat:no-repeat;background-size:cover;background-position:center;background-attachment:fixed}` | kept (and re-tuned) |
| E4 | `#wrapper{background-image:none}` | removed |
| E5 | `#wrapper{background-color:rgb(0 0 40/.5);background-blend-mode:multiply}` | kept (tinted) |
| E6 | `.user_page_wrap{background:#123456}` (same class, later sheet) | removed |
| E7 | `#wrapper{background:url(...) #123456}` | kept (re-specified) |

## F — relative `url()` resolution (`f-relative-url.html`, page at `/knowledge/tests/`)

| id | where the url() is written → where it is used | resolved to |
|---|---|---|
| F1 | inline custom_css `url("f/img/dot.svg")` | `…:8090/knowledge/tests/f/img/dot.svg` (page base) |
| F2 | imported `f/sub/imported.css` `url("dot.svg")` | `…:8090/knowledge/tests/f/sub/dot.svg` (sheet base) |
| F3 | cross-origin `:8091/…/f/sub/imported-x.css` `url("dot.svg")` | `…:8091/knowledge/tests/f/sub/dot.svg` (loaded fine, 200) |
| F7 | relative `@import` inside an imported sheet | resolved against the importing sheet |
| F4 | **unregistered** `--f-img: url("dot.svg")` declared in `f/sub/imported.css`, used `var(--f-img)` in the inline sheet | `…:8090/knowledge/tests/dot.svg` → **404** (resolved where `var()` is used) |
| F5 | `--f-img2: url("f/img/dot.svg")` declared inline, used in `f/sub/imported.css` | `…/f/sub/f/img/dot.svg` → **404** |
| F8 | unregistered `url()` custom property declared in the **cross-origin** sheet, used inline | resolved against the page → `…:8090/knowledge/tests/dot.svg` → **404** |
| F6 | **registered** `@property --f-reg { syntax:'<url>' }` declared in the imported sheet, used inline | `…/f/sub/dot.svg` (resolved where declared) |

Network log confirmed the two 404s (`/knowledge/tests/dot.svg`, `/knowledge/tests/f/sub/f/img/dot.svg`).

## G — `@property` / `@keyframes` across sheets (`g-property-keyframes.html`, import from :8091)

| id | case | result |
|---|---|---|
| G0 | `@property --g-angle` registered only in the cross-origin import; unset element | `0deg` (registered initial-value) |
| G2 | registered `<angle>` animated 0→360deg, paused at 50% | `180deg` (interpolates) |
| G2r | unregistered custom property animated, at 25% | `0deg` (discrete) |
| G3 / G4 | inline rule uses keyframes from the import / import rule uses keyframes from inline | both work (60px / 120px) |
| G5 | same `@keyframes` name in import and inline | inline (later) wins |
| G6 | `inherits:false` vs `inherits:true`, value set on the parent | child sees initial `0deg` / child sees `90deg` |
| G7 | `@property --g-twice` in import (1deg) and inline (2deg) | `2deg` (last wins) |
| G7b | `@property` without `initial-value` for `<length>` | ignored (unregistered) |
| G8 | unlayered `@keyframes g-lay` (50px) vs later one in `@layer L` (60px) | 50px (unlayered wins) |
| G9 | `calc(100px + 50px * sin(var(--g-angle)))`, `--g-angle:90deg` | 150px |
| G10 | `width:5px !important` + animation on width | 5px (`!important` beats the animation) |

## H — generated content (`h-content.html`)

Computed `content` values: `var(--msg)` with `--msg:"Hola"` → `"Hola"`; unquoted `--raw: Hola` → `none` (invalid at computed-value time);
`"★" / ""` → `"★" / ""`; `"★" / "star"`; `counter(h) ". "` kept as a function; `attr(data-h)` → `"from-attr"` (resolved);
`var(--msg) " world"` → `"Hola world"` (merged); typed `attr(data-w type(<length>), 10px)` → `123px`; alt text from `var()` → `"Hi" / "Hola"`;
`innerText` never includes `::before` text.

## I — roller overflow (`i-overflow-clip.html`, 375px iframes, roller flush with the right edge)

| id | clipping | doc scrollWidth/clientWidth | doc scrollHeight/clientHeight | #wrapper overflow-x/y |
|---|---|---|---|---|
| I0 | none | 450/360 (**+90px**) | 823/245 | visible/visible |
| I1 | `.roll{overflow-y:clip}` | 384/375 (+9px: the "Hi!" left in the 0-wide grid column) | 245/245 | visible/visible |
| I1b | `.roll{overflow:clip}` | 375/375 | 260/260 | visible/visible |
| I2 | `.roll{clip-path:inset(0)}` | 450/360 (**+90px**, same as no clipping) | 823/245 (+~580px of blank scroll) | visible/visible |
| I3 | `.roll{overflow:hidden}` | 375/375 | 260/260 | visible/visible |
| I4 | clip-path + `#wrapper{overflow-x:clip}` | 360/360 | 823/260 (vertical overflow remains) | clip/visible |
| I5 | clip-path + `#wrapper{overflow-x:hidden}` | 375/375 | 260/260 | **hidden/auto**; #wrapper scrollHeight 823 vs clientHeight 59 → inner scroll box |

Sticky (`position:sticky;top:0` inside #wrapper, document scrolled 300px): `#wrapper{overflow-x:clip}` → sticks (top 0);
`#wrapper{overflow-x:hidden}` → **broken** (computed overflow-y becomes `auto`); no overflow → sticks.

## J — feature support, Chromium 152 (`j-support.html`)

Functional (a rule must apply): nesting (`#wrapper { .x{} }`, bare type selector `p.x`, `&`, nested `@media`), `:has()`, `@container` size and
`style()` queries, `@scope … to …`, `:is()` forgiving list, `:nth-child(2 of .k)`, relative color `rgb(from …)`, `color-mix()`, `light-dark()`,
`sibling-index()` (30px for the 3rd span), `if(style(--x: 1): …; else: …)`, `@function --double()` (42px) — all **work**.
A plain selector list containing `::-moz-focus-inner` drops the whole rule.
Computed colors produced by `color-mix()` / `rgb(from …)` serialize as `color(srgb 0 0.501961 0)`, not `rgb(…)`.

`CSS.supports` / API presence: true for `selector(&)`, `:has`, `nth-child(of)`, `::-webkit-scrollbar`, `backdrop-filter`, `text-wrap: balance|pretty`,
`dvh`, `oklch`, trig/`round`/`mod`, anchor positioning, `position-try-fallbacks`, `animation-timeline: view()`, `@starting-style`, `@scope`,
`@container`, `@layer`, `@property`, `@function`, individual transforms, `interpolate-size`, `calc-size()`, `field-sizing`, `text-box`,
`corner-shape`, `shape()`, `sibling-index()`, `if()`, typed `attr()`, content alt text, `scrollbar-color`, `scrollbar-gutter`,
`content-visibility`, `view-transition-name`, unprefixed `mask-image`, `overflow: clip`, `overflow-clip-margin`, `dynamic-range-limit`,
`reading-flow`, `::scroll-marker`, `appearance: base-select`. **False:** `random()`, `-webkit-backdrop-filter`, `selector(::-moz-selection)`.

## K — hiding techniques vs text APIs and agent tools (`k-a11y.html`)

| marker | technique | innerText | textContent | `read_page` | `get_page_text` | checkVisibility() / with opacity+visibility |
|---|---|---|---|---|---|---|
| ALPHA | `display:none` | – | ✓ | **✓** | – | false/false |
| BRAVO | `visibility:hidden` | – | ✓ | **✓** | – | true/false |
| CHARLIE | `color:transparent` | ✓ | ✓ | ✓ | ✓ | true/true |
| DELTA | clip-path visually-hidden | ✓ | ✓ | ✓ | ✓ | true/true |
| ECHO | `opacity:0` | ✓ | ✓ | ✓ | ✓ | true/false |
| FOXTROT | `font-size:0` | ✓ | ✓ | ✓ | ✓ | true/true |
| GOLF | `::before` generated text | – | – | **–** | – | n/a |
| INDIA/JULIET | `::before` text / its alt text | – | – | **–** | – | n/a |
| LIMA | `aria-hidden="true"` | ✓ | ✓ | **✓** | ✓ | true/true |
| MIKE | `hidden` attribute | – | ✓ | **✓** | – | false/false |
| NOVEMBER | `left:-9999px` | ✓ | ✓ | ✓ | ✓ | true/true |
| OSCAR | `content-visibility:hidden` on an inline span | ✓ (no effect on inline) | ✓ | ✓ | ✓ | true/true |
| PAPA | roller `::before` (`"…" / ""`) | – | – | **–** (`find` → no match) | – | n/a |
| QUEBEC | transparent marker text under the roller | ✓ | ✓ | ✓ | ✓ | true/true |

`color:transparent` text is still selectable/copyable (`getSelection().toString()` returned it). `element.computedRole/computedName`
(AOM) are not exposed, so no page-script can read the real accessibility tree; screen-reader output needs a manual check.

## L — media features and the agent's preview environment (`l-media.html`)

| setting | hover:hover | pointer | DPR | maxTouchPoints | viewport | 100vh/dvh/svh/lvh | `(hover:hover) and (pointer:fine)` rule |
|---|---|---|---|---|---|---|---|
| desktop (pane) | true | fine | 1 | 0 | 411×371 (pane-size dependent: 1024×768 in the second pass) | all 371px (768px in the second pass) | applied |
| `resize_window` preset mobile | **false** (hover:none) | **coarse** | 2 | 5 | 375×812 | all 812px | **not applied** |

`prefers-color-scheme`: followed the app theme (dark); `resize_window {colorScheme:"light"}` flipped `matchMedia` live without reload.
`prefers-reduced-motion: reduce` was false and **cannot be emulated** with the available tools → manual check (OS setting) needed.
Environment: `requestAnimationFrame` did **not** fire within 1 s, `document.timeline.currentTime` advanced 0 ms over 500 ms, and a 10 s width
transition stayed at its start value after 1 s — although `document.visibilityState` was `visible`. *(Verification: the pane was **hidden** in
all runs. A new transition stays `pending` with `startTime` null, so it never progresses. `document.timeline` is not reliably frozen: in a fronted
tab it advanced ~1:1 with wall time in two probes taken right after a zoom screenshot, and 0 ms in later probes.)* Screenshots worked (the first attempt
timed out after 5 s; the retry succeeded).

## M1 — what turns `position:fixed` into "fixed to an ancestor" (`m-containing-block.html`)

Trapped (fixed child's top = ancestor's top, 200px): `transform: translateZ(0)`, `rotate: 0deg`, `translate: 0`, `scale: 1`, `filter: blur(0)`,
`backdrop-filter: blur(1px)`, `will-change: transform`, `perspective: 100px`, `contain: paint`, `contain: layout`, `content-visibility: auto`,
and an `animation` holding a transform (`fill-mode: both`).
Not trapped (top 0): `transform: none`, `will-change: opacity`, `container-type: inline-size`, `isolation: isolate`, `opacity: .99`,
`mix-blend-mode`, `clip-path`, `overflow: clip`, `mask-image`.
`container-type: size` on an auto-height block collapses it to **0px**; `inline-size` keeps the content height (18px).

Paint order of a `position:fixed; inset:0; z-index:-1` layer inside `#wrapper` that has an opaque `background-color`
(`document.elementsFromPoint`, confirmed by screenshot, also with a real `#wrapper::before`):
`#wrapper{position:relative;isolation:isolate}` → layer painted **above** #wrapper's background (visible);
`#wrapper{position:relative}` → layer **below** #wrapper's background (invisible); `isolation:isolate` alone → above; `position:relative;z-index:0` → above.

## M2 — CORS for fonts and masks (`m-font-cors.html`)

Console (verbatim gist): `Access to font at 'http://localhost:8091/knowledge/tests/m/fake.woff2' from origin 'http://localhost:8090' has been blocked by CORS policy`;
the same for `fake-imp.woff2`, which is declared in a sheet **imported from :8091 itself** (relative `url("fake-imp.woff2")`);
`Access to image at 'http://localhost:8091/knowledge/tests/m/mask.svg' … blocked by CORS policy` for `mask-image`.
Same-origin `m/fake.woff2` → fetched 200, then `Failed to decode downloaded font` / `OTS parsing error: invalid sfntVersion` (the file is
deliberately not a font). `background-image` from :8091 (F3) loaded fine without CORS headers.

## M3 — syntax mistakes (`m-syntax-gotchas.html`)

Dropped silently: `calc(40px+10px)`, `calc(50px - 0)`, `@media (…) and(…)`, the rule right after a `// comment` line, the rule right after a stray
top-level `}`, the rule after a missing `}` (it becomes a nested rule; CSSOM: one top-level rule `#wrapper .s-unclosed` whose child is
`& #wrapper .s-unclosed-next`, i.e. `#wrapper .s-unclosed #wrapper .s-unclosed-next`), a declaration missing its `;`
(`color: green font-weight: 700` drops `color`), `content: “curly”` (only that declaration), a selector list containing `::-moz-range-thumb`,
`var(--undefined)` without fallback (→ unset → inherited theme color), `var()` resolving to the wrong type (→ unset, not the earlier value).
Kept: `calc(40px + 10px)`, `calc(50px - 0px)`, `! important` with a space, an unclosed block at the end of the sheet, `<!-- -->` between rules,
a selector list containing `::-webkit-scrollbar-thumb` (known to Chromium).
SVG data URI with a raw `#` (`fill='#f00'`) fails to load; with `%23` it loads (tested via `<img>`; re-verified as a CSS `background-image` in the
verification pass: computed value shows the part after `#` percent-encoded as a fragment, and a screenshot shows nothing painted vs a red square for `%23`).

## N — `@scope (#wrapper)` specificity (`n-scope-specificity.html`)

Theme `.user_page .nX` (0,2,0). Inside `@scope (#wrapper)`: `.n1` (0,1,0) → **theme wins**; `:scope .n2` (0,2,0) → custom wins (scope proximity);
`& .n3` → **theme wins** (`&` adds no specificity here); `:scope .n5` vs a *later* unscoped `.user_page .n5` → scoped wins (proximity beats order).
Plain `#wrapper .n4` → custom.

## Observed in the private repo's export (read this session, not re-tested live)

`preview/itch-io.html` (export of the live profile, June 2026), lines 40–109: itch's own `style#user_theme` uses **CSS nesting**
(`.user_page { … hr {…} .user_links .svgicon {…} }`, `.game_grid_widget .game_cell { .game_thumb, .gif_overlay {…} … }`) and contains an empty
`.user_page_wrap {}`. Head order as listed in Method §3.
*Verification (2026-10-14, one logged-out `curl` of the same profile):* the live `style#user_theme` is **minified** and still nested (2 nested blocks).
Now that a panel image is set, `.user_page_wrap` holds the image as longhands (`background-image`, `background-repeat: no-repeat`,
`background-position: 50% 0`, `background-attachment: fixed`). So "empty when no panel image is set" is an inference, not an observation. The only
inline `style=""` attributes on the logged-out page are `background-color:#…` on 5 `.game_thumb` divs; the `display: none` ones in the export were
logged-in only.

## Not verifiable here (see openQuestions)

Firefox/Safari behaviour; real screen-reader output; `prefers-reduced-motion` emulation; render-blocking time of a slow `@import`;
anything that needs saving content on itch (editor cap, sanitizer).

## Verification (2026-10-14)

Adversarial re-check by a second agent, same day, same machine (Chromium 152.0.7977.130, Browser pane **hidden** throughout).

**How it was re-run**
1. `preview_start knowledge-tests` (:8090) + `knowledge-tests-xorigin` (:8091), fresh tab, `http://localhost:8090/knowledge/tests/index.html`
   → **0 FAIL**, all page totals identical to the table above (they sum to 168 PASS; "163" was an arithmetic slip, see the second pass); every INFO row matched the log (B1-cssom 0, B7-cssom 3 imports,
   B11b not-applied, CQ8 applied, CW3 UTF-8 / CW10 mojibake, F4/F5/F8 URLs, G2r 0deg, G8 50px, H9 `counter(h, upper-roman)` / `h 3`,
   I0–I5 dims, J-sibling-index 30px, J-if works, J-function 42px, the 55 `S:` rows, K rows, CT-inline-size 18px).
2. `curl -sI` on :8090/:8091: `.txt` → `text/plain`, extensionless → `application/octet-stream`, `.css` → `text/css` (no charset),
   `.woff2` → `application/octet-stream` (python on Windows), no `Access-Control-Allow-Origin` anywhere.
3. `read_network_requests` on b-import-position.html: late.css, after-nesting.css, in-media.css and supports-no.css were **never requested**;
   after-layer-between.css → 200 (not applied); print.css → 200; does-not-exist.css → 404. f-relative-url.html: `/knowledge/tests/dot.svg` and
   `/knowledge/tests/f/sub/f/img/dot.svg` → 404, `:8091/.../f/sub/dot.svg` → 200. `read_console_messages`: the font/mask CORS errors and the OTS
   decode warning as logged; no warning for any dropped `@import` or syntax error.
4. `read_page`, `find` (GOLF, PAPA-roller → no match; ALPHA-display → match) and `get_page_text` on k-a11y.html matched the K table.
   `'computedRole' in Element.prototype` → false, `'computedName'` → false.
5. `resize_window` mobile preset on l-media.html: hover:none, pointer:coarse, any-pointer:coarse, 375×812, DPR 2, 5 touch points, Android UA,
   100vh/dvh/svh/lvh = 812px; desktop pane 411×371, all units 371px; `colorScheme: light` flipped `matchMedia` without reload;
   reduced motion false throughout.

**Extra counter-tests** (injected `srcdoc` iframes, my own CSS, in the same tab):

| check | result |
|---|---|
| `#wrapper { .x{A} } #wrapper .x{B}` and reversed order | later rule wins both ways → nested = flat specificity |
| unlayered `.text-marker{color}` vs base `.user_page a{color}` | **base wins** (specificity) → D-util does not isolate layering |
| layered `@layer u { #wrapper#wrapper a.tm2 }` (2,1,1) vs `.user_page a` | base wins → layering does beat specificity |
| `#wrapper .v{color:green} #wrapper .v{--c:12px;color:var(--c)}` | inherited rgb(1,1,1), not green (same for `var(--nope)`); `var(--nope, X)` → X |
| `@starting-style { width:10px }` + `transition: width 10s`, element inserted | 10px, a CSSTransition running → @starting-style works functionally |
| roller `overflow-y:clip`, marker "Hi!" / "" / "Hello there!", padding 16/0 | 384 / 375 / 409 (scrollWidth vs 375); padding 0 → 400 → overflow = marker text |
| parent animates `inherits:false` `--p` (paused at 50%) | parent 180deg, child 0deg; `inherits:true` child 180deg |
| `@property --bad{syntax:"<length>";inherits:false}` (no initial-value), `--bad: foo` | `foo` → rule ignored, property unregistered |
| `#wrapper#wrapper{--v}` vs theme `.user_page{--v}`, child uses var() | theme value (inheritance, not specificity) |
| CSSOM of the missing-`}` sheet | 1 top-level rule, child `& #wrapper .s-unclosed-next` |
| raw `#` vs `%23` SVG data URI as CSS `background-image` | screenshot: nothing painted vs red square |
| real `#wrapper::before{position:fixed;inset:0;z-index:-1}` over an opaque #wrapper bg | screenshot: isolate → visible; relative → hidden; none → hidden; relative+z-index:0 → visible |
| rAF / transition / `document.timeline` (pane hidden, tab fronted) | rAF never fired; a new transition stays `pending` (startTime null, 10px); timeline advanced 516 ms/1017 ms right after a screenshot, then 0 ms in 3 later probes |

**Primary sources re-read:** private repo `preview/itch-io.html` lines 1–120 and its `style=` attributes; `custom-css/lib/title.js` (`@property --breath`
registered with `inherits:true`). One logged-out `curl` of the user's own profile page (see the correction in §"Observed in the private repo's
export"). Docs: Cascade 5 (`https://www.w3.org/TR/css-cascade-5/`): @import must precede everything but @charset and empty @layer statements,
with no rule between consecutive @imports; a false `supports()` import must not be fetched and its `CSSImportRule.styleSheet` is null. Chromium
instead **drops the rule from `cssRules`**. MDN `@scope`: `&` and bare selectors act as `:where(:scope)` (zero specificity), "handled differently
according to the browser engine and release version"; proximity is outranked by specificity and outranks order. Tailwind docs (Preflight page):
`@import "tailwindcss"` = `@layer theme, base, components, utilities;` + layered imports; `@import "tailwindcss" important;` emits `!important`
inside `@layer utilities`. Google Fonts (`curl`): `fonts.googleapis.com/css2` → `text/css; charset=utf-8` + `Access-Control-Allow-Origin: *`;
`fonts.gstatic.com/*.woff2` → `font/woff2` + `Access-Control-Allow-Origin: *`. The private repo's Vercel service `/live.css` →
`text/css; charset=utf-8`, `Cache-Control: no-store`.

**Verdicts:** confirmed: 01, 03, 04, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
32, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49.
Corrected:
- **02:** the head order was the logged-in export. Logged-out today there is no theme_editor.css and no Google Fonts link; user_theme still precedes custom_css.
- **08:** live user_theme verified minified and nested. "Empty `.user_page_wrap {}` when no panel image is set" is inferred.
- **16:** D-util is confounded. Stripping @layer is not enough against `.user_page a`; use a #wrapper-prefixed build or Tailwind's `important` flag.
- **36:** the timeline is not reliably frozen. What is reliable: rAF never fires and new transitions stay pending.

Refuted: none.

## Verification (2026-10-14) — second adversarial pass

Independent re-check, same day, same machine: Chromium **152.0.7977.130** (`Claude/2.37337.1` UA), Browser pane **hidden**, tab fronted.

**Re-run**
1. `preview_start knowledge-tests` (:8090) + `knowledge-tests-xorigin` (:8091); `http://localhost:8090/knowledge/tests/index.html`
   → **168 PASS · 0 FAIL**, every page total equal to the table at the top; every INFO row equal to the log (B1-cssom 0, B7-cssom 3 imports,
   B11b not-applied, CQ8 applied, CW3 UTF-8 / CW10 mojibake, F4/F5/F8 URLs, G2r 0deg, G8 50px, H9, I0–I5 dims, J-sibling-index 30px, J-if works,
   J-function 42px, the 55 `S:` rows incl. `random()` false, K rows, CT-inline-size 18px).
2. `curl -sI` on both ports: `.txt` → `text/plain`, extensionless and `.woff2` → `application/octet-stream`, `.css` → `text/css` (no charset),
   `.svg` → `image/svg+xml`; no `Access-Control-Allow-Origin`. Python 3.12.6.
3. `read_network_requests` (b-import-position.html standalone + the index run): `late.css`, `after-nesting.css`, `in-media.css`, `supports-no.css`
   never requested; `after-layer-between.css` 200 (not applied); `print.css` 200; `does-not-exist.css` 404. f-relative-url: `/knowledge/tests/dot.svg`
   and `/knowledge/tests/f/sub/f/img/dot.svg` 404, `:8091/.../f/sub/dot.svg` 200. m-font-cors: `:8091` `fake.woff2`, `fake-imp.woff2`, `mask.svg`
   → `net::ERR_FAILED`; `:8090/m/fake.woff2` 200. `read_console_messages`: only 404 / CORS / OTS messages, nothing for dropped `@import`s or syntax errors.
4. k-a11y.html: `read_page` lists ALPHA, BRAVO, LIMA, MIKE and no GOLF/INDIA/JULIET/PAPA; `find("GOLF")`, `find("PAPA-roller")` → no match,
   `find("ALPHA-display")` → match; `get_page_text` = innerText (no ALPHA/BRAVO/MIKE, includes LIMA). `computedRole`/`computedName` not in `Element.prototype`.
5. l-media.html standalone: desktop 1024×768, DPR 1, 0 touch points, hover:hover/pointer:fine, all four vh units 768px; preset mobile → 375×812, DPR 2,
   5 touch points, hover:none, pointer:coarse, Android UA, units 812px, hover-gated rule not applied; `colorScheme: light` flipped `matchMedia` without reload;
   `prefers-reduced-motion: reduce` false throughout. rAF did not fire; timeline 0 ms; transition 10px (fresh page).
6. One logged-out `curl` of the user's own profile (`https://mirokshi.itch.io/`, browser UA, raw copy in the scratchpad only):
   `<!DOCTYPE HTML>`, `<meta charset="UTF-8"/>`, HTTP `Content-Type: text/html` (no charset). Head: `link static.itch.io/user.css` → 6 scripts →
   `style#user_theme` (966 chars, minified, nested: `.user_page{…hr{…}…}`, `.game_grid_widget .game_cell{.game_thumb,.gif_overlay{…}…}`) →
   `style#custom_css` (last stylesheet). `.user_page` declares `--itchio_font_family/link_color/gray_back/border_radius`; `.user_page_wrap` holds the panel
   image as longhands (`background-image`, `background-repeat: no-repeat`, `background-position: 50% 0`, `background-attachment: fixed`);
   `.header .image_header img{}` is an empty block. The only `style=""` attributes: 5 × `background-color:#…` on `.game_thumb`.

**Counter-tests** — `knowledge/evidence/localtests-verify-tools/verify.html` (open from :8090; fixtures in the same folder, `x-mask.css` + `mask.svg`
served from :8091). All CSS written for this pass.

| id | test | result |
|---|---|---|
| V1 | `#wrapper{.x{A}} #wrapper .x{B}` and the reverse order | later rule wins both ways → nested = flat specificity |
| V2 / V2w / V2f | earlier valid rule, then `--c:12px; color:var(--c)` / `width:50px` then `--c2:red; width:var(--c2)` / `var(--nope, X)` | inherited theme color rgb(1,1,1) / **width auto (1009px = initial, not 50px)** / X |
| V3 | element inserted with `transition:width 10s` + `@starting-style{width:10px}`; control without it | 10px + a running `CSSTransition` / control 110px, no transition → `@starting-style` works |
| V4 | `width:7px; width:random(10px,10px)`; `CSS.supports` for `random(10px,20px)`, `random(--x,…)`, `random(element-shared,…)`, `random(…, by 1px)` | 7px; all false |
| V5 | unregistered custom property animated `aaa→bbb`, paused at 49% / 51% | `aaa` / `bbb` (discrete flip at 50%) |
| V6 | parent **animates** registered `--v-ni` (inherits:false) and `--v-in` (inherits:true), paused at 50% | parent 180deg; child `--v-ni` 0deg, `--v-in` 180deg |
| V7 | links vs base `.user_page a` (0,1,1): unlayered `.v7-unl` / `#wrapper .v7-id` / `@layer u{#wrapper#wrapper a.v7-lay}` / `@layer u{.v7-imp{…!important}}` | base / custom / base / custom |
| V8 | SVG data URI in a CSS `background-image`, raw `#` vs `%23` | computed value shows the tail after `#` percent-encoded as a fragment (`/%3E%3C/svg%3E`); zoom screenshot: raw box empty, `%23` box red |
| V9 | real `#wrapper::before{position:fixed;inset:0;z-index:-1;background:red}` over `#wrapper{background-color:blue}`: isolate / relative / nothing / relative+z-index:0 | zoom screenshot: red / blue (red only outside #wrapper) / blue / red |
| V10 | `mask-image:url("mask.svg")` declared in a sheet imported **from :8091** | console: `Access to image at 'http://localhost:8091/…/localtests-verify-tools/mask.svg' from origin 'http://localhost:8090' has been blocked by CORS policy` |
| V12 | computed overflow-x/y for `overflow-y:clip` / `overflow-y:hidden` / `overflow-x:clip` | `visible/clip` / `auto/hidden` / `clip/visible` |
| V14 | `@import` after `@font-face` / `@property` / `@keyframes` / an empty `@media screen{}` / control | dropped / dropped / dropped / dropped / applied |
| V18 | `span:nth-child(2){--i:1}`, `span:nth-child(3){--i:7}` (deliberately wrong) + `@supports(sibling-index){ #wrapper .v18 span{--i:calc(sibling-index() - 1)} }` | widths 1px 11px **71px** 31px → the `@supports` rule does NOT override the `:nth-child` rules (lower specificity); it only fills spans without one |
| V18b / V18c | span (3rd child) sets `--j: sibling-index()`, its first child `<b>` uses `var(--j)`; same with `--v-kreg` registered as `<integer>` | unregistered: **10px** (evaluated on `<b>`, where `var()` is used; computed `--j` stays the token `sibling-index()`); registered: 30px (`--v-kreg` = 3 on both) |
| V19 | `#wrapper :is(.v19::before){content:"X"}` / plain `.v19c::before` / list `.q, .q:-moz-focusring` / `:is(.r, .r:-moz-focusring)` | `none` / `"X"` / dropped / applied → pseudo-elements are invalid inside `:is()` |
| env | after zoom screenshots in the hidden pane | `document.timeline` advanced ~1:1 (1016 ms / 1 s, then 700/700/717 ms), the V3 10 s transition had **completed** (110px); rAF still never fired; a transition created afterwards stayed `running` with `startTime` null at 10px after 1.5 s |

**Docs re-read:** CSS Cascade 6 editor's draft (`https://drafts.csswg.org/css-cascade-6/`): sort order Origin/Importance → Context → Style attribute → Layers →
Specificity → **Scope Proximity** → Order of Appearance; ":scope has a specificity of (0,1,0), whereas & has a specificity of 0" (so N3 follows the spec and
is not a Chromium quirk). Tailwind docs: Preflight page (`@import "tailwindcss"` = `@layer theme, base, components, utilities;` + `layer(theme|base|utilities)`
imports) and "Styling with utility classes" (`@import "tailwindcss" important;` → `!important` declarations still inside `@layer utilities`). MDN
`backdrop-filter`: "Baseline 2024, newly available since September 2024".

**Verdicts (second pass):**
- Confirmed: 01, 03, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 33, 34, 35, 37, 38, 39, 40, 41, 42, 44,
  45, 46, 47, 48.
- Corrected:
  - **02**: the head-order detail came from the logged-in export. Logged out, the order is `user.css` → scripts → `user_theme` → `custom_css`.
  - **04**: the `display: none` inline styles appear only when logged in. Logged out, the only inline style is `background-color` on `.game_thumb`, which then needs `!important`.
  - **08**: the live `user_theme` is minified and nested. "Empty `.user_page_wrap {}` without a panel image" was observed once, in the June export. Today that rule holds
    the panel longhands, and another unset option (`.header .image_header img{}`) is emitted as an empty block.
  - **16**: D-util is confounded (V7: an unlayered `.v7-unl` also loses to `.user_page a`). Stripping `@layer` is not enough: prefix with `#wrapper` or use
    `!important` (Tailwind's `important` flag).
  - **31**: the suggested `@supports` rule does not override the `:nth-child` rules (V18). Also, `sibling-index()` in an unregistered custom property is
    evaluated where `var()` is used (V18b).
  - **32**: the forgiving parsing of `:is()`/`:where()` only rescues pseudo-classes. A pseudo-element inside `:is()` never matches (V19), so vendor pseudo-elements
    need their own rule.
  - **36**: the timeline is not simply frozen. In the hidden pane rAF never fires and new transitions stay pending. The timeline can still advance, and pending
    transitions run once a screenshot renders frames.
  - **43**: a var() that is invalid at computed-value time makes the property `unset`. That gives the inherited value for inherited properties (color) and the **initial** value
    otherwise (V2w: width auto).
  - **49**: the run totals 168 PASS, not 163.
- Refuted: none.
