# Evidence log: `support` (browser support for JS-free itch.io CSS)

- **Date checked:** 2026-10-14
- **Question:** which modern CSS features can an itch.io page (profile, project, devlog, jam) rely on *today*, in which browser versions, and what is the safe fallback when a visitor's browser lacks them? itch forbids JavaScript in custom pages, so everything here is CSS-only.
- **Confidence vocabulary:** *verified* = reproduced here by a local test (Chromium only, see 1.2); *documented* = MDN browser-compat-data / web-features / official release notes; *inferred* = deduced from the above.

## 1. Method

### 1.1 Compatibility data (machine-readable, fetched 2026-10-14)

| Source | Version / date | Used for |
|---|---|---|
| `web-features` (npm) | 3.42.0, published 2026-10-09 (also diffed against `3.42.0-dev-20261013154632-906c64f`: no status change for any feature below) | Baseline status + Baseline dates |
| `@mdn/browser-compat-data` (npm) | 8.1.5, published 2026-10-08 | first version per browser, partial/prefix/flag notes, release calendar |
| caniuse `fulldata-json/data-2.0.json` (GitHub Fyrd/caniuse) | commit 2026-10-13 | global usage share per browser version (for the "% users" column) |

"% users" = sum of caniuse global usage for every browser version whose BCD entry says *full* support (no prefix, flag or partial), mapped chrome/edge/firefox/safari/ios_saf/and_chr/and_ff/samsung/opera/op_mob/android. caniuse tracks 97.5% of usage in total, so ~97 is the ceiling. UC/QQ browsers are counted as unsupported (conservative). Firefox 158 (released 2026-10-13) is not yet in the usage data.

### 1.2 Local tests (what "verified" means here)

- `support-probe.html` (this folder, written for this project): ~140 checks of three kinds: `supports` = `CSS.supports()` parse test; `parse` = insert a rule and read which `CSSRule` subclass the browser built; `fx` = apply the feature and assert a computed value / layout / running transition.
- Run headless, each with a throw-away `--user-data-dir`, never the user's profile:
  - Chrome for Testing **147.0.7727.15** (Playwright `chromium_headless_shell-1217`)
  - Google Chrome **155.0.8059.40** (current stable)
  - Chrome 155 with `--enable-experimental-web-platform-features` (shows what is already implemented behind the flag = likely next releases)
  - Chrome 155 with `--force-dark-mode` (the test machine's OS is already dark, so prefers-color-scheme was `dark` in all 155 runs; it was `light` in the 147 headless shell)
- `support-a11y.html` + `support-tools/a11y-cdp.mjs`: reads the accessible name Chrome computes for generated content and hidden text via the DevTools Protocol (`Accessibility.getPartialAXTree`).
- **No Firefox or Safari binary was available on the test machine**, so every Firefox/Safari claim is *documented*, not *verified*.

### 1.3 itch observation (2 GET requests, robots.txt honoured)

`https://itch.io/robots.txt` (checked), then `https://static.itch.io/user.css` (raw copy kept in the scratchpad only, not here), grepped for modern-CSS tokens. See section 8.

### 1.4 Re-run

```bash
# data
curl -s https://registry.npmjs.org/web-features/-/web-features-3.42.0.tgz -o wf.tgz && tar -xzf wf.tgz          # -> package/data.json
curl -s https://registry.npmjs.org/@mdn/browser-compat-data/-/browser-compat-data-8.1.5.tgz -o bcd.tgz && tar -xzf bcd.tgz
curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json -o caniuse.json
python support-tools/wf_status.py wf/package/data.json random-function,if,scope          # Baseline status
python support-tools/bcd.py bcd/package/data.json 1 css.types.random css.at-rules.scope   # per-browser versions (depth 1 = sub-features)
# local probe (any Chromium; repeat with --enable-experimental-web-platform-features)
chrome --headless=new --user-data-dir=%TEMP%\probe --dump-dom file:///.../support-probe.html > run.html
python support-tools/table.py run147.html run155.html run155exp.html run155dark.html                 # probe table
python support-tools/matrix.py bcd/package/data.json wf/package/data.json caniuse.json run147.html run155.html run155exp.html support-matrix.json
# a11y
node support-tools/a11y-cdp.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe" file:///.../support-a11y.html %TEMP%\a11y
```

Opening `support-probe.html` in a normal Firefox or Safari window shows the same table (green = pass); that is the cheapest way to turn the *documented* Firefox/Safari columns into *verified* ones.

## 2. Browser release snapshot (BCD 8.1.5 + release notes)

| Browser | Current stable on 2026-10-14 | Next | Cadence |
|---|---|---|---|
| Chrome (desktop + Android) | 155 (2026-10-06) | 156 on 2026-10-20 (beta since 2026-09-30) | **every 2 weeks since Chrome 153 (2026-09-08)** |
| Edge | 154 (2026-09-24) per BCD 8.1.5; 155 scheduled 2026-10-08 (Edge 155.0.4283.45 was already installed on the test machine) | 156 on 2026-10-22 | every 2 weeks (switched 2026-08-27 per press reports) |
| Firefox | **158 (2026-10-13)** | 159 on 2026-10-27 | **every 2 weeks since Firefox 155 (2026-09-01)**; 154 was the last 4-week release |
| Safari (macOS + iOS) | 27 (2026-09-14; WebKit post dated 2026-09-17) | 27.2 in beta | yearly major + point releases (26.1 ... 26.6 in 2025-26) |
| Samsung Internet | 30.0 (2026-05-11) = Chromium 143 | - | lags Chrome by ~6 months |

Usage (caniuse, 2026-10-13): Chrome for Android 154 alone is 42.8% of global usage, iOS Safari 14.8%, desktop Chrome 23.8%, Edge 5.7%, desktop Safari 3.1%, desktop Firefox 2.3%, Samsung 2.1%. On iOS every browser uses WebKit, so iOS Safari's version is what iPhone/iPad visitors get regardless of browser brand.

## 3. Support matrix

Baseline = web-features 3.42.0 (`Newly` = in all core browsers since the date shown; `Widely` = 30 months after that). Versions = first version with full, unprefixed, unflagged support per BCD 8.1.5 ("TP/Nightly" = only in Safari Technology Preview / Firefox Nightly; "flag" = behind a pref). Last column = local Chromium results (Y pass / n fail / - not tested).

{{MATRIX}}

Rows without a web-features id show `-` for Baseline. Machine-readable copy: `support-matrix.json`.

## 4. What each feature gives an itch page without JS, and the safe fallback

General rule (verified, section 6, "error recovery" rows): an unsupported **value** drops only that declaration, so write the plain value first and the modern one after it in the same rule; an unsupported **selector** drops the whole rule (including the other selectors in its list), so put unsupported pseudo-elements in their own rule or inside `@supports selector(...)`; an unknown **at-rule** is skipped and the rest of the sheet still applies. Never route a modern value through a custom property as a "fallback": `--r: random(...)` is accepted by every browser, and `width: var(--r)` then becomes invalid at computed-value time and falls back to `initial`/inherited (`auto`), not to your earlier declaration. `@supports (--x: anything)` is always true, so test a real property: `@supports (rotate: random(0deg, 1deg))`.

| Feature | Use on an itch page (no JS) | Safe pattern |
|---|---|---|
| `random()` | Per-visit randomness (tilt, hue, star field, which greeting shows) without an external CSS service. Rolled once per element+property when the page's style is computed, stable through later restyles (verified, flag build). Unnamed = independent per element; `random(--k, a, b)` = one value shared by every use of `--k` (Safari 26.5+ and the Chrome 156 implementation; Safari 26.2-26.4 scoped names per element); `element-scoped` keyword gives per-element names. Step is a plain 3rd argument: `random(0, 100, 2)` (old `by` syntax is not accepted). | `rotate: -2deg; rotate: random(-3deg, 3deg);` or `@supports (rotate: random(0deg, 1deg)) {...}`. Expect only Safari 26.2+ users today; Chrome 156 from 2026-10-20; Firefox only Nightly (`layout.css.random.enabled`). |
| `random-item()` | Would pick one of N values. | Not implemented anywhere (Chrome 155 even with the flag rejects it). Don't use. |
| `if()` | Inline conditionals on `style()`, `media()`, `supports()`. | Chromium only (137+). Plain declaration first; prefer `@media`/`@container style()` which cover the same needs cross-browser. |
| `@container style(--x: v)` | Switch a whole block's look by setting one custom property on an ancestor (e.g. `#wrapper{--mode:neon}` then `@container style(--mode: neon){...}`). Every element is a style container: no `container-type` needed (verified). Only custom properties can be queried (`style(display:block)` never matches, verified). | Baseline 2026-05-19. Range syntax `style(--n > 5)` works in Chrome 142+ but not Safari: avoid. |
| Size `@container` + `cqi` units | Style cards by the width of their **column** (itch's left/right columns and profile columns are fixed widths unrelated to the viewport). | Widely available. Needs `container-type: inline-size` on the container. Name-only `@container foo {}` (no condition) is newer: Chrome 148 / Firefox 149 / Safari 26.4. |
| `@scope` | Limit rules to a region, e.g. `@scope (#wrapper .user_profile) to (.game_grid_widget)`. | Baseline 2026-03-24. **It does not add the scope root's specificity** (verified): `@scope (#wrapper){ .x{} }` is (0,1,0) and loses to itch's `.user_page .x`. `:scope .x` adds (0,1,0); `&` added none in Chrome. On ties a scoped rule beats an unscoped one even if earlier (scope proximity, verified). For itch's "beat the theme with an ID" rule, **nesting under `#wrapper` is better than `@scope`**. |
| Nesting | `#wrapper{ .game_cell{...} &:hover{...} }` keeps the ID scoping and ID specificity automatically (verified: `#nid{.nx{}}` beat `.ny .nx`). Saves characters under the ~5120 cap (no repeated `#wrapper`). | Widely available since 2026-06-11. Nested rules starting with a type selector (`p{}`) need Chrome 120 / Safari 17.2+ (earlier = partial). Whether itch's editor keeps nested CSS is not verified here (see open questions). |
| `:has()` | Parent/sibling-aware styling: `#wrapper .game_grid_widget:has(.game_cell:hover) .game_cell:not(:hover){...}`, layout changes when the bio contains a `custom-` element. | Widely available since 2026-06-19. `@supports selector(:has(a))` for the rare old browser. |
| `@property` | Animate gradients, angles, numbers (e.g. a rotating conic border, a "breathing" font-weight via `sin()`). | Baseline 2024-07-09 (Widely ~2027-01). Verified gotchas: `inherits:false` stops children seeing the parent's value; a value that does not match `syntax` silently becomes `initial-value`. Without support the property is an ordinary custom property: values still work, animations jump. |
| `sin()`/`cos()` | Waves, circular layouts, per-letter phase (combine with `sibling-index()`). | Widely available. |
| Scroll-driven animations | Reveal-on-scroll for devlog images and game cards, reading-progress bar on devlogs, header parallax. | Chrome 115 + Safari 26 only; Firefox Nightly only (Interop 2026 focus area). Put it inside `@supports (animation-timeline: view())` **and** make the element's base style the finished, visible state, so Firefox shows the content. Write `animation-timeline` **after** the `animation` shorthand, which resets it to `auto` (verified). Respect `prefers-reduced-motion`. |
| `@view-transition { navigation: auto }` | Animated page-to-page navigation between a creator's own pages, because `creator.itch.io` (profile) and `creator.itch.io/game` (projects, devlogs) are the same origin. Links to other creators (`other.itch.io`) or to `itch.io/jam/...` are cross-origin and never animate. Both the old and the new page must contain the rule, i.e. it must be in the profile CSS **and** each project's CSS. | Chrome 126 + Safari 18.2 only; not in Firefox (Interop 2026 focus area). Unsupported browsers ignore it: plain navigation. Wrap in `@media (prefers-reduced-motion: no-preference)`. It is a top-level at-rule (cannot live under `#wrapper`), and `::view-transition-*` pseudo-elements hang off `html`: whether itch's editor keeps them is an open question. |
| Same-document view transitions, `match-element`, `view-transition-name: auto` | Same-document transitions need `document.startViewTransition()` (JS), so they are useless on itch. `view-transition-name: <ident>` still matters for cross-document morphs (give the cover in the profile grid and the banner on the project page the same name). | `match-element` names only make sense within one document. `auto` is Safari-only (18.2); Chrome 155 rejects it without the flag (verified). |
| Anchor positioning | CSS-only tooltips/labels tied to a game card, decorations that follow an element, `position-area` placement with flip fallbacks. | Core properties in all three engines (Chrome 125, Firefox 147, Safari 26), but web-features says "not Baseline" only because the newer singular `position-visibility: anchor-valid/anchor-visible` keywords are missing in Chrome/Firefox. Default of `position-anchor` changed to `normal` (Chrome 151, Firefox 151, Safari 27). Guard with `@supports (anchor-name: --a)`; fallback = `position:absolute` relative to the parent. |
| `@starting-style` | Entry fade/slide of cards and the bio without `@keyframes` (a transition runs when the element first gets styles, verified). | Baseline 2024-08-06. Unsupported = element simply appears. |
| `transition-behavior: allow-discrete` | Transition `display`/`content-visibility` (open/close panels). | Baseline 2024-08-06 for the property, but transitioning `display` itself is Chrome 117 / Safari 18 only (no Firefox). |
| `interpolate-size` / `calc-size()` | Animate `height: auto` (expand a "read more" block, `<details>`). Without opt-in no transition runs (verified). | Chromium 129+ only. Harmless elsewhere (snaps open). Put `interpolate-size: allow-keywords` on `#wrapper` (it inherits). |
| `sibling-index()` / `sibling-count()` | Stagger delays (`animation-delay: calc(sibling-index() * 60ms)`), per-letter wave phases without one `:nth-child` rule per letter (big character savings under the cap). | Baseline 2026-08-18 (Firefox 154). Write a constant declaration first; the calc() one overrides where supported. |
| `text-wrap: balance` / `pretty` | Balanced game titles/headings; fewer orphans in bio and devlog paragraphs. | `balance` Baseline 2024-05-13. `pretty` = Chrome 117 + Safari 26, no Firefox. Both degrade to normal wrapping. |
| `content: "x" / ""` (alt text) | Decorative icons in `::before`/`::after` that screen readers skip (`/ ""`) or announce differently (`/ "Rated: "`). Verified in Chrome's accessibility tree. | Baseline 2024-07-09. Fallback: `content:"★"; content:"★" / "";` (old browsers keep the first). |
| `overflow: clip` | Clip rotated/animated decorations without creating a scroll container and **without scrollable overflow** (verified), which fixes horizontal scroll on phones; `clip-path` only clips painting and leaves the overflow (verified). | Widely available. `overflow-clip-margin` lets a shadow bleed. |
| `backdrop-filter` | Frosted-glass cards over the theme background. | Baseline 2024-09-16 (Safari 18 unprefixed). Write `-webkit-backdrop-filter` then `backdrop-filter` (Safari 9-17 need the prefix; Chromium rejects the prefixed name). Use literal values, not `var()` (WebKit bug 297620: Safari 18.x/26.1 on macOS Sonoma ignores it with `var()`). Verified gotcha: it makes the element the containing block of `position:fixed` descendants. |
| `translate`/`rotate`/`scale` | Animate one transform part without clobbering another (hover lift + idle rotation). | Widely available. Any non-`none` value, even `translate: 0 0`, makes the element a containing block for fixed descendants (verified). |
| `color-mix()` | Tints/shades from the theme-editor colours, e.g. `color-mix(in oklab, var(--itchio_link_color) 70%, white)`. | Widely available (2025-11-09). Omitting `in <space>` parses in Chrome 147+ (verified) and defaults to oklab in Safari 26.2+, but write `in oklab` for older engines. 3+ colours = Firefox 150 / Safari 27 only, Chrome rejects (verified). |
| Relative colour `rgb(from ...)` | Alpha/lightness variants of a theme colour: `rgb(from var(--itchio_link_color) r g b / 40%)`. | Baseline 2024-09-16; Chrome 119-121 and Safari 16.4-17.x had spec-incompatible channel maths. Plain colour declaration first. |
| `light-dark()` | One rule for both OS themes. | Baseline 2024-05-13 (images: Baseline 2026-09-14). **Returns the light value unless `color-scheme` is declared** (verified even with the OS in dark mode), and itch's `user.css` declares none (observed). Use `#wrapper{color-scheme: light dark}`; remember the theme-editor colours themselves don't change. |
| `@layer` | Rarely useful on itch. | Widely available. Verified: unlayered rules beat layered ones regardless of specificity, and itch's `user.css` has no `@layer` (observed), so wrapping your CSS (or `@import ... layer(x)`) in a layer makes it lose to the theme. `!important` inside a layer beats unlayered `!important` (verified). |
| `attr()` typed | Drive sizes/colours from `data-*` attributes in the bio HTML (`width: attr(data-pct %)`). | Chrome 133 + Firefox 155; Safari only in Technology Preview (Interop 2026). Only useful if the sanitizer keeps `data-*` attributes (open question). Classic `content: attr(x)` works everywhere (verified). |
| `@function` | Reusable calculations; could save characters. | Chromium 139+ only (Safari TP). Don't rely on it. |
| `::scroll-marker`, `::scroll-button()` | CSS-only carousel dots/arrows for a screenshot strip. | Chromium 135+ only. Make the base a normal `overflow-x:auto` + `scroll-snap` strip (works everywhere) and add markers in a separate rule or `@supports selector(::scroll-marker)`. |
| `::details-content` | Animate `<details>` open/close (with `interpolate-size`). | Baseline 2025-09-16; Safari can't chain pseudo-elements after it. Only relevant if `<details>` survives the sanitizer (open question). |
| `field-sizing: content` | Auto-growing textareas (e.g. the comment box on project pages). | Baseline 2026-06-16. |
| `shape()` | Responsive clip-path shapes with % and curves (wavy banner edges). | Baseline 2026-02-24. Declare a `polygon()` clip-path first. |
| `corner-shape` | Squircle/bevel/notch card corners. | Chromium 139+ only (Firefox 158 Nightly pref, Safari TP). Needs `border-radius`; unsupported = ordinary rounded corners, so it degrades well. |
| `text-box` | Optical vertical centring of text in badges/buttons (`text-box: trim-both cap alphabetic`). | Chrome 133, Firefox 154, Safari 18.2 per BCD/MDN, but web-features does not mark it Baseline (Firefox `<text-edge>` data still "parse only"). Safe to use as enhancement. |
| `@container scroll-state()` | Style sticky headers when stuck, snapped items. | Chromium 133+ only. |
| `:popover-open` | Declarative popovers (`popovertarget`) need no JS. | Baseline 2025-01-27, but useful only if the sanitizer keeps `popover`/`popovertarget` (open question). |
| `reading-flow` | Fix screen-reader/tab order after visual reordering of flex/grid items. | Chromium 137+ only. Prefer not to reorder itch's content with `order`. |
| Typed arithmetic | `calc(40px / 10px)` = 4, e.g. turning a length into a ratio. | Chrome 140, Safari 26, **Firefox 158 (released 2026-10-13)**: all engines as of yesterday; no web-features id yet. Precompute values if older browsers matter. |
| `@custom-media`, `@mixin`/`@apply` | Would shorten CSS. | Not shipped anywhere (`@custom-media` Firefox pref off; `@mixin` parsed only with Chrome's experimental flag, verified). Don't use. |
| `@supports at-rule(...)` | Detect at-rules. | Chrome 148 + Firefox 157 only; Safari no. Unknown at-rules are skipped harmlessly anyway (verified), so it is rarely needed. |

## 5. Interop 2026 (signals what will become cross-browser next)

Official focus areas (github.com/web-platform-tests/interop, 2026/README.md): container style queries, anchor positioning, `attr()`, `contrast-color()`, CSS zoom, custom highlights, dialogs and popovers, media pseudo-classes, scroll-driven animations, scroll snap, `shape()`, view transitions (web.dev's Interop 2026 post says this one includes **cross-document** view transitions), plus non-CSS areas. So scroll-driven animations, cross-document view transitions and typed `attr()` are the gaps most likely to close in Firefox/Safari next.

## 6. Local probe: full results

Columns: Chrome for Testing 147.0.7727.15 headless shell / Chrome 155.0.8059.40 / Chrome 155 + `--enable-experimental-web-platform-features` / Chrome 155 + `--force-dark-mode`. `Y` = assertion passed (for `supports` rows: `CSS.supports()` returned true).

{{PROBE}}

## 7. Accessibility probe (Chrome 155.0.8059.40, `Accessibility.getPartialAXTree`)

{{A11Y}}

Reading: `content: "x" / ""` removes the generated text from the accessible name; `/ "alt"` replaces it; the two-declaration fallback works; `color: transparent` text **is** still announced; `visibility:hidden` and `display:none` text is not; the "roller" pattern (transparent marker text + `::before` list with empty alt) is announced as the marker text only. Firefox/Safari were not tested.

## 8. itch observation (2026-10-14)

`https://static.itch.io/user.css` (71,824 bytes, fetched once): occurrences of `color-scheme` 0, `light-dark` 0, `@supports` 0, `backdrop-filter` 0, `@layer` 0, `@container` 0, `:has(` 0, `prefers-color-scheme` 0, `prefers-reduced-motion` 0, `@media` 31, `--itchio` 216. Consequences: itch's base stylesheet is entirely unlayered, declares no colour scheme, and does not itself rely on any of the features above.

Same-origin check (from the June 2026 profile export in the private repo): a creator's own game links are `https://<creator>.itch.io/<game>` (same origin as the profile `https://<creator>.itch.io/`); collection links to other creators are other subdomains.

## 9. Discrepancies and caveats

- **Style-query range syntax in Firefox:** BCD 8.1.5 lists `range_syntax` as Firefox 151, but MDN's Firefox 151 release notes and MDN's "Experimental features" page list it as experimental/off by default. Treat as not shipped in Firefox.
- **text-box in Firefox:** BCD lists the properties as Firefox 154 but the `<text-edge>` type as "preview, parsing only"; MDN's Firefox 154 release notes announce support. web-features therefore withholds Baseline.
- **random() named values** changed meaning in Safari 26.5 (names became global; `element-shared` keyword removed, `element-scoped` added). Safari 26.2-26.4 users get the old per-element behaviour.
- **caniuse vs BCD lag:** a third-party search summary claimed caniuse's random() page still listed Chrome 157; BCD 8.1.5 and web.dev's September 2026 roundup both say Chrome 156 (beta). Chrome 156 is not stable until 2026-10-20.
- `CSS.supports()` only proves parsing; the `fx` rows prove behaviour. Pseudo-element rows (`::scroll-marker`, `::details-content`) were parse-tested only.
- Usage percentages are global web traffic, not itch's audience (itch is likely more desktop-heavy; unverified).

## 10. Sources (all fetched 2026-10-14)

- web-features 3.42.0: https://registry.npmjs.org/web-features/-/web-features-3.42.0.tgz (repo https://github.com/web-platform-dx/web-features)
- MDN browser-compat-data 8.1.5: https://registry.npmjs.org/@mdn/browser-compat-data/-/browser-compat-data-8.1.5.tgz
- caniuse data: https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json
- WebKit, Safari 26.0: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebKit, Safari 26.2 (2025-12-12): https://webkit.org/blog/17640/webkit-features-for-safari-26-2/
- WebKit, Safari 26.5 (2026-05-11): https://webkit.org/blog/17938/webkit-features-for-safari-26-5/
- WebKit, Safari 27.0 (2026-09-17): https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- WebKit bug 297620 (backdrop-filter + var() on Sonoma): https://bugs.webkit.org/show_bug.cgi?id=297620
- MDN Firefox 147 (anchor positioning on by default, 2026-01-13): https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/147
- MDN Firefox 151 (container style queries, 2026-05-19): https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/151
- MDN Firefox 154 / 155: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154 , https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/155
- MDN Firefox 158 (typed arithmetic, 2026-10-13): https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/158
- MDN Firefox experimental features: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features
- Chrome 139 (@function, corner-shape): https://developer.chrome.com/blog/new-in-chrome-139
- Chrome 156 beta (2026-09-30): https://developer.chrome.com/blog/chrome-156-beta
- web.dev, New to the web platform in September 2026 (Chrome 156 beta includes random()): https://web.dev/blog/web-platform-09-2026
- Interop 2026: https://github.com/web-platform-tests/interop/blob/main/2026/README.md , https://web.dev/blog/interop-2026
- Release cadence: https://blog.mozilla.org/sumo/2026/08/19/firefox-new-release-cadence-and-what-to-expect/ , https://www.techspot.com/news/111565-google-start-shipping-new-chrome-version-every-two.html
- view-transition-name: auto (Safari-only): https://developer.chrome.com/blog/view-transitions-in-2025 , https://vtbag.dev/tips/auto-names/
- CSS mixins Intent to Prototype (Chrome): https://groups.google.com/a/chromium.org/g/blink-dev/c/g0dSC7CvdlA/m/Wz30GgIZAwAJ
- Cascade 6 (@scope specificity, proximity): https://drafts.csswg.org/css-cascade-6/
