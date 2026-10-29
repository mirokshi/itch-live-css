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
| Samsung Internet | 30.0 (2026-05-11) = Chromium 143 (Chrome 143 = 2025-12-02) | - | ~5 Chrome versions behind when released; 12 versions (~10 months) behind Chrome 155 today |

Usage (caniuse, 2026-10-13): Chrome for Android 154 alone is 42.8% of global usage, iOS Safari 14.8%, desktop Chrome 23.8%, Edge 5.7%, desktop Safari 3.1%, desktop Firefox 2.3%, Samsung 2.1%. On iOS every browser uses WebKit, so iOS Safari's version is what iPhone/iPad visitors get regardless of browser brand.

## 3. Support matrix

Baseline = web-features 3.42.0 (`Newly` = in all core browsers since the date shown; `Widely` = 30 months after that). Versions = first version with full, unprefixed, unflagged support per BCD 8.1.5 ("TP/Nightly" = only in Safari Technology Preview / Firefox Nightly; "flag" = behind a pref). Last column = local Chromium results (Y pass / n fail / - not tested).

| Feature | Baseline (since) | Chrome/Edge | Firefox | Safari / iOS | % users | Local Chrome 147 / 155 / 155+flag |
|---|---|---|---|---|---|---|
| random() | No | 156 | no (TP/Nightly) | 26.2 | 13.1 | n / n / Y |
| random-item() | - | - | - | - | - | n / n / n |
| if() | No | 137 | no | no | 68.9 | Y / Y / Y |
| Container style queries style(--x: v) | Newly 2026-05-19 | 111 | 151 | 18 | 92.9 | Y / Y / Y |
| Style query range syntax style(--n > 5) | - | 142 | 151 (see section 9: parse is not pref-gated in Firefox source) | no | 70.4 | Y / Y / Y |
| Container size queries + cq units | Widely 2025-08-14 | 105 | 110 | 16 | 95.9 | Y / Y / Y |
| Name-only @container foo | Newly 2026-05-07 | 148 | 149 | 26.4 | 81.7 | n / Y / Y |
| @scope | Newly 2026-03-24 | 118 (web-features says 143 because it also counts `&` inside @scope) | 146 | 26.4 (full 17.4-18.x, partial 26.0-26.3) | 88.7 | Y / Y / Y |
| CSS nesting (&) | Widely 2026-06-11 | 120 | 117 | 17.2 | 92.9 | Y / Y / Y |
| :has() | Widely 2026-06-19 | 105 | 121 | 15.4 | 95.9 | Y / Y / Y |
| @property | Newly 2024-07-09 | 85 | 128 | 16.4 | 95.5 | Y / Y / Y |
| sin()/cos() (trig) | Widely 2025-09-13 | 111 | 108 | 15.4 | 95.1 | Y / Y / Y |
| Scroll-driven animations | No | 115 | no (Nightly); ships in 159 (2026-10-27) | 26 | 87.8 | Y / Y / Y |
| Cross-document view transitions @view-transition | No | 126 | no | 18.2 | 87.8 | Y / Y / Y |
| Same-document view transitions | Newly 2025-10-14 | 111 | 144 | 18 | 92.9 | Y / Y / Y |
| view-transition-name: match-element | - | 137 | 144 | 18.4 | 86.8 | Y / Y / Y |
| view-transition-name: auto | - | - | - | - | - | n / n / Y |
| Anchor positioning (core) | No | 125 | 147 | 26 | 87.3 | Y / Y / Y |
| @starting-style | Newly 2024-08-06 | 117 | 129 | 17.5 | 93.0 | Y / Y / Y |
| transition-behavior: allow-discrete | Newly 2024-08-06 | 117 | 129 | 17.4 | 93.1 | Y / Y / Y |
| interpolate-size | No | 129 | no | no | 71.7 | Y / Y / Y |
| calc-size() | No | 129 | no | no | 71.7 | Y / Y / Y |
| sibling-index()/sibling-count() | Newly 2026-08-18 | 138 | 154 | 26.2 | 83.9 | Y / Y / Y |
| text-wrap: balance | Newly 2024-05-13 | 114 | 121 | 17.5 | 93.6 | Y / Y / Y |
| text-wrap: pretty | No | 117 | no | 26 | 87.6 | Y / Y / Y |
| content alt text ("x" / "") | Newly 2024-07-09 | 77 / 79 | 128 | 17.4 | 94.9 | Y / Y / Y |
| overflow: clip | Widely 2025-03-12 | 90 | 81 | 16 | 96.2 | Y / Y / Y |
| backdrop-filter (unprefixed) | Newly 2024-09-16 | 76 / 79 | 103 | 18 | 94.9 | Y / Y / Y |
| translate / rotate / scale | Widely 2025-02-05 | 104 | 72 | 14.1 / 14.5 | 96.3 | Y / Y / Y |
| color-mix() | Widely 2025-11-09 | 111 | 113 | 16.2 | 94.8 | Y / Y / Y |
| color-mix() with 3+ colors | No | no | 150 | 27 | 2.8 | n / n / n |
| Relative color (rgb(from ...)) | Newly 2024-09-16 | 122 for `rgb()`/`oklch()`; 125 for `hsl()`/`hwb()` (web-features uses 125) | 128 | 18 | 90.5 | Y / Y / Y |
| light-dark() | Newly 2024-05-13 | 123 | 120 | 17.5 | 91.3 | Y / Y / Y |
| light-dark() with images | Newly 2026-09-14 | 150 | 150 | 27 | 69.5 | n / Y / Y |
| @layer | Widely 2024-09-14 | 99 | 97 | 15.4 | 96.4 | Y / Y / Y |
| attr() with type()/units (any property) | No | 133 | 155 | no (TP/Nightly) / no | 73.0 | Y / Y / Y |
| @function (custom functions) | No | 139 | no | no (TP/Nightly) / no | 68.7 | Y / Y / Y |
| ::scroll-marker / ::scroll-marker-group | No | 135 | no | no | 71.0 | Y / Y / Y |
| ::scroll-button() | No | 135 | no | no | 71.0 | Y / Y / Y |
| ::details-content | Newly 2025-09-16 | 131 | 143 | 18.4 | 89.3 | Y / Y / Y |
| field-sizing | Newly 2026-06-16 | 123 | 152 | 26.2 | 87.2 | Y / Y / Y |
| shape() | Newly 2026-02-24 | 135 | 148 | 18.4 | 88.8 | Y / Y / Y |
| corner-shape | No | 139 | no (TP/Nightly) | no (TP/Nightly) / no | 68.7 | Y / Y / Y |
| text-box (trim/edge) | No | 133 | 154 | 18.2 | 89.3 | Y / Y / Y |
| @container scroll-state() | No | 133 | no | no | 71.3 | Y / Y / Y |
| :popover-open | Newly 2025-01-27 (date of the whole `popover` feature: Chrome 116, iOS Safari 18.3) | 114 | 125 | 17 | 93.6 | Y / Y / Y |
| reading-flow | No | 137 | no | no | 68.9 | Y / Y / Y |
| Typed arithmetic (calc(40px / 10px) = 4) | - | 140 | 158 | 26 | 82.0 | Y / Y / Y |
| @custom-media | No | no | no (flag) | no | 0 | n / n / n |
| @mixin / @apply | No | - | - | - | - | n / n / Y |
| @supports at-rule() | No | 148 | 157 | no (TP/Nightly) / no | 67.7 | n / Y / Y |

Rows without a web-features id show `-` for Baseline. Machine-readable copy: `support-matrix.json`.

## 4. What each feature gives an itch page without JS, and the safe fallback

General rule (verified, section 6, "error recovery" rows): an unsupported **value** drops only that declaration, so write the plain value first and the modern one after it in the same rule; an unsupported **selector** drops the whole rule (including the other selectors in its list), so put unsupported pseudo-elements in their own rule or inside `@supports selector(...)`; an unknown **at-rule** is skipped and the rest of the sheet still applies. Never route a modern value through a custom property as a "fallback": `--r: random(...)` is accepted by every browser, and `width: var(--r)` then becomes invalid at computed-value time and falls back to `initial`/inherited (`auto`), not to your earlier declaration. `@supports (--x: <value>)` is true for practically any value (it is false only for token streams with an unmatched `)`, `]` or `}`, verified in section 11), so it never detects a feature: test a real property, e.g. `@supports (rotate: random(0deg, 1deg))`.

| Feature | Use on an itch page (no JS) | Safe pattern |
|---|---|---|
| `random()` | Per-visit randomness (tilt, hue, star field, which greeting shows) without an external CSS service. Rolled once per element+property when the page's style is computed, stable through later restyles (verified, flag build). Unnamed = independent per element; `random(--k, a, b)` = one value shared by every use of `--k` (Safari 26.5+ and the Chrome 156 implementation; Safari 26.2-26.4 scoped names per element); `element-scoped` keyword gives per-element names. Step is a plain 3rd argument: `random(0, 100, 2)` (old `by` syntax is not accepted). | `rotate: -2deg; rotate: random(-3deg, 3deg);` or `@supports (rotate: random(0deg, 1deg)) {...}`. Expect only Safari 26.2+ users today; Chrome 156 from 2026-10-20; Firefox only Nightly (`layout.css.random.enabled`). |
| `random-item()` | Would pick one of N values. | Not in any stable browser (Chrome 155 even with the flag rejects it; Safari 27 has it behind an off-by-default flag). WebKit trunk enabled it by default on 2026-08-14 (Safari Technology Preview), so a future Safari will have it. Don't rely on it. Spec syntax needs a key first: `random-item(--k, a, b)`. |
| `if()` | Inline conditionals on `style()`, `media()`, `supports()`. | Chromium only (137+) among stable browsers; WebKit trunk enabled it 2026-07-09 (Safari TP, not in Safari 27). Plain declaration first; prefer `@media`/`@container style()` which cover the same needs cross-browser. |
| `@container style(--x: v)` | Switch a whole block's look by setting one custom property on an ancestor (e.g. `#wrapper{--mode:neon}` then `@container style(--mode: neon){...}`). Every element is a style container: no `container-type` needed (verified). Only custom properties can be queried (`style(display:block)` never matches, verified). | Baseline 2026-05-19. Range syntax `style(--n > 5)` works in Chrome 142+ and (per BCD and Firefox's source, see section 9) Firefox 151+, but not Safari: avoid or guard. |
| Size `@container` + `cqi` units | Style cards by the width of their **column** (itch's left/right columns and profile columns are fixed widths unrelated to the viewport). | Widely available. Needs `container-type: inline-size` on the container. Name-only `@container foo {}` (no condition) is newer: Chrome 148 / Firefox 149 / Safari 26.4. |
| `@scope` | Limit rules to a region, e.g. `@scope (#wrapper .user_profile) to (.game_grid_widget)`. | Baseline 2026-03-24. **It does not add the scope root's specificity** (verified): `@scope (#wrapper){ .x{} }` is (0,1,0) and loses to itch's `.user_page .x`. `:scope .x` adds (0,1,0); `&` added none in Chrome, which matches the spec ("The & selector is defined to behave as :where(:scope)", css-cascade-6 §3.5.1) and Safari 26.2's fix. On ties a scoped rule beats an unscoped one even if earlier (scope proximity, verified). For itch's "beat the theme with an ID" rule, **nesting under `#wrapper` is better than `@scope`**. |
| Nesting | `#wrapper{ .game_cell{...} &:hover{...} }` keeps the ID scoping and ID specificity automatically (verified: `#nid{.nx{}}` beat `.ny .nx`). Saves characters under the ~5120 cap (no repeated `#wrapper`). | Widely available since 2026-06-11. Nested rules starting with a type selector (`p{}`) need Chrome 120 / Safari 17.2+ (earlier = partial). Whether itch's editor keeps nested CSS is not verified here (see open questions). |
| `:has()` | Parent/sibling-aware styling: `#wrapper .game_grid_widget:has(.game_cell:hover) .game_cell:not(:hover){...}`, layout changes when the bio contains a `custom-` element. | Widely available since 2026-06-19. `@supports selector(:has(a))` for the rare old browser. |
| `@property` | Animate gradients, angles, numbers (e.g. a rotating conic border, a "breathing" font-weight via `sin()`). | Baseline 2024-07-09 (Widely ~2027-01). Verified gotchas: `inherits:false` stops children seeing the parent's value; a value that does not match `syntax` silently becomes `initial-value`. Without support the property is an ordinary custom property: values still work, animations jump. |
| `sin()`/`cos()` | Waves, circular layouts, per-letter phase (combine with `sibling-index()`). | Widely available. |
| Scroll-driven animations | Reveal-on-scroll for devlog images and game cards, reading-progress bar on devlogs, header parallax. | Chrome 115 + Safari 26; Firefox 158 only in Nightly, **Firefox 159 (2026-10-27) ships it** (bug 1324602 fixed for 159; pref `true` on the beta branch). Put it inside `@supports (animation-timeline: view())` **and** make the element's base style the finished, visible state, so older browsers show the content. Write `animation-timeline` **and** `animation-range` **after** the `animation` shorthand, which resets both (verified). Respect `prefers-reduced-motion`. |
| `@view-transition { navigation: auto }` | Animated page-to-page navigation between a creator's own pages, because `creator.itch.io` (profile) and `creator.itch.io/game` (projects, devlogs) are the same origin. Links to other creators (`other.itch.io`) or to `itch.io/jam/...` are cross-origin and never animate. Both the old and the new page must contain the rule, i.e. it must be in the profile CSS **and** each project's CSS. | Chrome 126 + Safari 18.2 only; not in Firefox (Interop 2026 focus area). Unsupported browsers ignore it: plain navigation. Wrap in `@media (prefers-reduced-motion: no-preference)` (verified to still fire). Chrome 155 also honours it nested in a style rule (`#wrapper{@view-transition{navigation:auto}}` fired a transition; Safari untested), but top-level is the safe form. `::view-transition-*` pseudo-elements hang off `html`: whether itch's editor keeps them is an open question. Verified locally (Chrome 155, section 11): no transition when only one of the two pages has the rule. |
| Same-document view transitions, `match-element`, `view-transition-name: auto` | Same-document transitions need `document.startViewTransition()` (JS), so they are useless on itch. `view-transition-name: <ident>` still matters for cross-document morphs (give the cover in the profile grid and the banner on the project page the same name). | `match-element` names only make sense within one document. `auto` is Safari-only (18.2); Chrome 155 rejects it without the flag (verified). |
| Anchor positioning | CSS-only tooltips/labels tied to a game card, decorations that follow an element, `position-area` placement with flip fallbacks. | Core properties in all three engines (Chrome 125, Firefox 147, Safari 26), but web-features says "not Baseline" only because the newer singular `position-visibility: anchor-valid/anchor-visible` keywords are missing in Chrome/Firefox. Default of `position-anchor` changed to `normal` (Chrome 151, Firefox 151, Safari 27). Guard with `@supports (anchor-name: --a)`; fallback = `position:absolute` relative to the parent. |
| `@starting-style` | Entry fade/slide of cards and the bio without `@keyframes` (a transition runs when the element first gets styles, verified for inserted elements and, by the verifier, for elements already in the HTML on first render, also when nested inside a style rule; Chrome 147/155). | Baseline 2024-08-06. Unsupported = element simply appears. |
| `transition-behavior: allow-discrete` | Transition `display`/`content-visibility` (open/close panels). | Baseline 2024-08-06 for the property, but transitioning `display` itself is Chrome 117 / Safari 18 only (no Firefox). |
| `interpolate-size` / `calc-size()` | Animate `height: auto` (expand a "read more" block, `<details>`). Without opt-in no transition runs (verified). | Chromium 129+ only. Harmless elsewhere (snaps open). Put `interpolate-size: allow-keywords` on `#wrapper` (it inherits). |
| `sibling-index()` / `sibling-count()` | Stagger delays (`animation-delay: calc(sibling-index() * 60ms)`), per-letter wave phases without one `:nth-child` rule per letter (big character savings under the cap). | Baseline 2026-08-18 (Firefox 154). Write a constant declaration first; the calc() one overrides where supported. |
| `text-wrap: balance` / `pretty` | Balanced game titles/headings; fewer orphans in bio and devlog paragraphs. | `balance` Baseline 2024-05-13. `pretty` = Chrome 117 + Safari 26, no Firefox. Both degrade to normal wrapping. |
| `content: "x" / ""` (alt text) | Decorative icons in `::before`/`::after` that screen readers skip (`/ ""`) or announce differently (`/ "Rated: "`). Verified in Chrome's accessibility tree. | Baseline 2024-07-09. Fallback: `content:"★"; content:"★" / "";` (old browsers keep the first). |
| `overflow: clip` | Clip rotated/animated decorations without creating a scroll container and **without scrollable overflow** (verified), which fixes horizontal scroll on phones; `clip-path` only clips painting and leaves the overflow (verified). | Widely available. `overflow-clip-margin` lets a shadow bleed, but only in Chrome 90+ (and only when both axes are `clip`) and Firefox 102+; Safari has no support (BCD). |
| `backdrop-filter` | Frosted-glass cards over the theme background. | Baseline 2024-09-16 (Safari 18 unprefixed). Write `-webkit-backdrop-filter` then `backdrop-filter` (Safari 9-17 need the prefix; Chromium rejects the prefixed name). Use literal values, not `var()` (WebKit bug 297620: Safari 18.x/26.1 on macOS Sonoma ignores it with `var()`). Verified gotcha: it makes the element the containing block of `position:fixed` descendants. |
| `translate`/`rotate`/`scale` | Animate one transform part without clobbering another (hover lift + idle rotation). | Widely available. Any non-`none` value, even `translate: 0 0` or `rotate: 0deg`, makes the element a containing block for fixed descendants (verified); so do `filter` (even `blur(0)`), `will-change: transform` and `contain: paint` (verifier, Chrome); `container-type: inline-size` does not (verifier, Chrome). |
| `color-mix()` | Tints/shades from the theme-editor colours, e.g. `color-mix(in oklab, var(--itchio_link_color) 70%, white)`. | Widely available (2025-11-09). Omitting `in <space>` parses in Chrome 147+ (verified) and defaults to oklab in Safari 26.2+, but write `in oklab` for older engines. 3+ colours = Firefox 150 / Safari 27 only, Chrome rejects (verified). |
| Relative colour `rgb(from ...)` | Alpha/lightness variants of a theme colour: `rgb(from var(--itchio_link_color) r g b / 40%)`. | Baseline 2024-09-16; Chrome 119-121 and Safari 16.4-17.x had spec-incompatible channel maths. Plain colour declaration first. |
| `light-dark()` | One rule for both OS themes. | Baseline 2024-05-13 (images: Baseline 2026-09-14). **Returns the light value unless `color-scheme` is declared** (verified even with the OS in dark mode), and itch's `user.css` declares none (observed). Use `#wrapper{color-scheme: light dark}`; remember the theme-editor colours themselves don't change. |
| `@layer` | Rarely useful on itch. | Widely available. Verified: unlayered rules beat layered ones regardless of specificity, and itch's `user.css` has no `@layer` (observed), so wrapping your CSS (or `@import ... layer(x)`) in a layer makes it lose to the theme. `!important` inside a layer beats unlayered `!important` (verified). |
| `attr()` typed | Drive sizes/colours from `data-*` attributes in the bio HTML (`width: attr(data-pct %)`). | Chrome 133 + Firefox 155; Safari only in Technology Preview (Interop 2026). Only useful if the sanitizer keeps `data-*` attributes (open question). Classic `content: attr(x)` works everywhere (verified). |
| `@function` | Reusable calculations; could save characters. | Chromium 139+ only in stable browsers (Safari 27 has it off; WebKit trunk enabled it 2026-07-07 = Safari TP). Don't rely on it. |
| `::scroll-marker`, `::scroll-button()` | CSS-only carousel dots/arrows for a screenshot strip. | Chromium 135+ only. Make the base a normal `overflow-x:auto` + `scroll-snap` strip (works everywhere) and add markers in a separate rule or `@supports selector(::scroll-marker)`. |
| `::details-content` | Animate `<details>` open/close (with `interpolate-size`). | Baseline 2025-09-16; Safari can't chain pseudo-elements after it. Only relevant if `<details>` survives the sanitizer (open question). |
| `field-sizing: content` | Auto-growing textareas (e.g. the comment box on project pages, which itch renders only for logged-in visitors: the logged-out project pages crawled on 2026-10-14 contain no `<textarea>`). | Baseline 2026-06-16. Verified functionally in Chrome 147/155 (an 8-line textarea grew from 46px to 166px). |
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

| id | test | Chrome 147 | Chrome 155 | 155 + exp. flag | 155 + dark |
|---|---|---|---|---|---|
| random | `supports: width: random(10px, 100px)` | n | n | Y | n |
| random-step | `supports: width: random(0px, 100px, by 10px)` | n | n | n | n |
| random-shared-ident | `supports: width: random(--a, 10px, 100px)` | n | n | Y | n |
| random-element-shared | `supports: width: random(element-shared, 10px, 100px)` | n | n | n | n |
| random-item-comma | `supports: color: random-item(--a, red, blue)` | n | n | n | n |
| random-item-semicolon | `supports: color: random-item(--a; red; blue)` | n | n | n | n |
| random-fx | `fx: .rnd{width:random(10px,500px)}` | n widths=600.0/600.0/600.0 distinct=1 | n widths=600.0/600.0/600.0 distinct=1 | Y widths=459.0/148.8/270.1 distinct=3 | n widths=600.0/600.0/600.0 distinct=1 |
| random-shared-fx | `fx: .rns{width:random(--s, 10px, 500px)}` | n widths=600.0/600.0 (same --s ident) | n widths=600.0/600.0 (same --s ident) | Y widths=95.4/95.4 (same --s ident) | n widths=600.0/600.0 (same --s ident) |
| if-style | `supports: width: if(style(--x: 1): 10px; else: 20px)` | Y | Y | Y | Y |
| if-media | `supports: width: if(media(width > 1px): 10px; else: 20px)` | Y | Y | Y | Y |
| if-supports | `supports: width: if(supports(display: grid): 10px; else: 20px)` | Y | Y | Y | Y |
| if-fx | `fx: .iff{--x:1;width:if(style(--x: 1): 31px; else: 9px)}` | Y 31px | Y 31px | Y 31px | Y 31px |
| cq-size-fx | `fx: .cq{container-type:inline-size;width:300px}@container (min-width:200px` | Y 44px | Y 44px | Y 44px | Y 44px |
| cq-units-fx | `fx: .cqu{container-type:inline-size;width:300px}.cqu>i{display:block;width` | Y 30px | Y 30px | Y 30px | Y 30px |
| cq-style-fx | `fx: .cs{--t:1}@container style(--t: 1){.cs>i{display:block;width:33px}}` | Y 33px | Y 33px | Y 33px | Y 33px |
| cq-style-range-fx | `fx: .csr{--n:7}@container style(--n > 5){.csr>i{display:block;width:34px}}` | Y 34px | Y 34px | Y 34px | Y 34px |
| cq-style-std-prop-fx | `fx: .csp{display:block}@container style(display: block){.csp>i{display:blo` | n auto | n auto | n auto | n auto |
| cq-name-only-fx | `fx: .cn{container-name:foo}@container foo{.cn>i{display:block;width:36px}}` | n auto | Y 36px | Y 36px | Y 36px |
| cq-scroll-state-type | `supports: container-type: scroll-state` | Y | Y | Y | Y |
| cq-scroll-state-parse | `parse: @container scroll-state(stuck: top){.x{color:red}}` | Y CSSContainerRule | Y CSSContainerRule | Y CSSContainerRule | Y CSSContainerRule |
| scope-fx | `fx: @scope (.sa) to (.sb){p{width:11px}}` | Y 11px / 600px | Y 11px / 600px | Y 11px / 600px | Y 11px / 600px |
| nesting-fx | `fx: .ne{& .m{width:12px} p{width:13px} &:hover{color:red}}` | Y 12px / 13px (type-selector nested) | Y 12px / 13px (type-selector nested) | Y 12px / 13px (type-selector nested) | Y 12px / 13px (type-selector nested) |
| has | `supports: selector(:has(a))` | Y | Y | Y | Y |
| has-fx | `fx: .hs:has(> b){width:14px}` | Y 14px | Y 14px | Y 14px | Y 14px |
| layer-fx | `fx: @layer base{.ly{width:15px}} .ly{width:16px}` | Y 16px (unlayered wins) | Y 16px (unlayered wins) | Y 16px (unlayered wins) | Y 16px (unlayered wins) |
| layer-important-fx | `fx: @layer base{.li{width:17px!important}} .li{width:18px!important}` | Y 17px (layered !important wins) | Y 17px (layered !important wins) | Y 17px (layered !important wins) | Y 17px (layered !important wins) |
| property-fx | `fx: @property --pa{syntax:"<angle>";inherits:false;initial-value:30deg}.pa` | Y 50px (registered initial-value used) | Y 50px (registered initial-value used) | Y 50px (registered initial-value used) | Y 50px (registered initial-value used) |
| property-animatable | `fx: @property --pb{syntax:"<number>";inherits:false;initial-value:0}` | Y CSSPropertyRule=true | Y CSSPropertyRule=true | Y CSSPropertyRule=true | Y CSSPropertyRule=true |
| trig-fx | `fx: .tg{width:calc(100px * cos(60deg))}` | Y 50px | Y 50px | Y 50px | Y 50px |
| typed-division-fx | `fx: .td{width:calc(10px * (40px / 10px))}` | Y 40px | Y 40px | Y 40px | Y 40px |
| typed-division | `supports: width: calc(10px * (40px / 10px))` | Y | Y | Y | Y |
| round-mod-rem | `supports: width: round(up, 12.3px, 5px)` | Y | Y | Y | Y |
| progress | `supports: opacity: progress(50px, 0px, 100px)` | Y | Y | Y | Y |
| abs-sign | `supports: width: calc(10px * sign(-3))` | Y | Y | Y | Y |
| sibling-fx | `fx: .sib>i{display:block;width:calc(sibling-index() * 10px);height:calc(si` | Y 30px / 3px | Y 30px / 3px | Y 30px / 3px | Y 30px / 3px |
| sda-scroll | `supports: animation-timeline: scroll()` | Y | Y | Y | Y |
| sda-view | `supports: animation-timeline: view()` | Y | Y | Y | Y |
| sda-range | `supports: animation-range: entry 0% cover 50%` | Y | Y | Y | Y |
| sda-timeline-scope | `supports: timeline-scope: --t` | Y | Y | Y | Y |
| vt-crossdoc-parse | `parse: @view-transition{navigation:auto}` | Y CSSViewTransitionRule | Y CSSViewTransitionRule | Y CSSViewTransitionRule | Y CSSViewTransitionRule |
| vt-name | `supports: view-transition-name: hero` | Y | Y | Y | Y |
| vt-name-auto | `supports: view-transition-name: auto` | n | n | Y | n |
| vt-name-match-element | `supports: view-transition-name: match-element` | Y | Y | Y | Y |
| vt-class | `supports: view-transition-class: card` | Y | Y | Y | Y |
| vt-pseudo | `supports: selector(::view-transition-old(root))` | Y | Y | Y | Y |
| vt-active | `supports: selector(:active-view-transition)` | Y | Y | Y | Y |
| anchor-name | `supports: anchor-name: --a` | Y | Y | Y | Y |
| position-anchor | `supports: position-anchor: --a` | Y | Y | Y | Y |
| position-area | `supports: position-area: top` | Y | Y | Y | Y |
| anchor-fn | `supports: top: anchor(bottom)` | Y | Y | Y | Y |
| anchor-size | `supports: width: anchor-size(width)` | Y | Y | Y | Y |
| position-try-fallbacks | `supports: position-try-fallbacks: flip-block` | Y | Y | Y | Y |
| position-try-parse | `parse: @position-try --p{top:0}` | Y CSSPositionTryRule | Y CSSPositionTryRule | Y CSSPositionTryRule | Y CSSPositionTryRule |
| anchor-fx | `fx: .an{position:relative;height:200px}.an .a{position:absolute;top:50px;l` | Y t.top-a.bottom=0 t.left-a.right=0 | Y t.top-a.bottom=0 t.left-a.right=0 | Y t.top-a.bottom=0 t.left-a.right=0 | Y t.top-a.bottom=0 t.left-a.right=0 |
| starting-style-parse | `parse: @starting-style{.x{opacity:0}}` | Y CSSStartingStyleRule | Y CSSStartingStyleRule | Y CSSStartingStyleRule | Y CSSStartingStyleRule |
| transition-behavior | `supports: transition-behavior: allow-discrete` | Y | Y | Y | Y |
| interpolate-size | `supports: interpolate-size: allow-keywords` | Y | Y | Y | Y |
| calc-size | `supports: height: calc-size(auto, size)` | Y | Y | Y | Y |
| details-content | `supports: selector(::details-content)` | Y | Y | Y | Y |
| popover-open | `supports: selector(:popover-open)` | Y | Y | Y | Y |
| text-wrap-balance | `supports: text-wrap: balance` | Y | Y | Y | Y |
| text-wrap-pretty | `supports: text-wrap: pretty` | Y | Y | Y | Y |
| text-wrap-style-pretty | `supports: text-wrap-style: pretty` | Y | Y | Y | Y |
| text-box | `supports: text-box: trim-both cap alphabetic` | Y | Y | Y | Y |
| content-alt | `supports: content: "x" / ""` | Y | Y | Y | Y |
| content-alt-fx | `fx: .ca::before{content:"\2605" / ""}` | Y "★" / "" | Y "★" / "" | Y "★" / "" | Y "★" / "" |
| content-alt-counter-fx | `fx: .cc::before{content:"A" / "alt " counter(x)}` | Y "A" / "alt " counter(x) | Y "A" / "alt " counter(x) | Y "A" / "alt " counter(x) | Y "A" / "alt " counter(x) |
| overflow-clip | `supports: overflow: clip` | Y | Y | Y | Y |
| overflow-y-clip | `supports: overflow-y: clip` | Y | Y | Y | Y |
| overflow-clip-margin | `supports: overflow-clip-margin: 10px` | Y | Y | Y | Y |
| backdrop-filter | `supports: backdrop-filter: blur(4px)` | Y | Y | Y | Y |
| webkit-backdrop-filter | `supports: -webkit-backdrop-filter: blur(4px)` | n | n | n | n |
| translate | `supports: translate: 10px 5px` | Y | Y | Y | Y |
| rotate | `supports: rotate: 5deg` | Y | Y | Y | Y |
| scale | `supports: scale: 1.1` | Y | Y | Y | Y |
| color-mix-fx | `fx: .cm{color:color-mix(in srgb, rgb(255 0 0) 50%, rgb(0 0 255))}` | Y color(srgb 0.5 0 0.5) | Y color(srgb 0.5 0 0.5) | Y color(srgb 0.5 0 0.5) | Y color(srgb 0.5 0 0.5) |
| color-mix-no-method | `supports: color: color-mix(red, blue)` | Y | Y | Y | Y |
| color-mix-variadic | `supports: color: color-mix(in srgb, red, blue, green)` | n | n | n | n |
| relative-color-fx | `fx: .rc{color:rgb(from rgb(255 0 0) r g 255)}` | Y color(srgb 1 0 1) | Y color(srgb 1 0 1) | Y color(srgb 1 0 1) | Y color(srgb 1 0 1) |
| light-dark-fx | `fx: .ld{color-scheme:dark;color:light-dark(rgb(1 1 1), rgb(2 2 2))}` | Y rgb(2, 2, 2) | Y rgb(2, 2, 2) | Y rgb(2, 2, 2) | Y rgb(2, 2, 2) |
| env-prefers-dark | `env: matchMedia("(prefers-color-scheme: dark)")` | n | Y | Y | Y |
| light-dark-color-scheme-light-dark-fx | `fx: .ldo{color-scheme:light dark;color:light-dark(rgb(1 1 1), rgb(2 2 2))}` | Y rgb(1, 1, 1) (color-scheme: light dark - | Y rgb(2, 2, 2) (color-scheme: light dark - | Y rgb(2, 2, 2) (color-scheme: light dark - | Y rgb(2, 2, 2) (color-scheme: light dark - |
| light-dark-without-color-scheme-fx | `fx: .ldn{color:light-dark(rgb(1 1 1), rgb(2 2 2))}` | Y rgb(1, 1, 1) (no color-scheme declared - | Y rgb(1, 1, 1) (no color-scheme declared - | Y rgb(1, 1, 1) (no color-scheme declared - | Y rgb(1, 1, 1) (no color-scheme declared - |
| light-dark-image | `supports: background-image: light-dark(url(a.png), url(b.png))` | n | Y | Y | Y |
| attr-typed-fx | `fx: .at{width:attr(data-w type(<length>), 1px)}` | Y 37px | Y 37px | Y 37px | Y 37px |
| attr-unit-fx | `fx: .au{width:attr(data-w px, 1px)}` | Y 38px | Y 38px | Y 38px | Y 38px |
| attr-content-fx | `fx: .ac::after{content:attr(data-t)}` | Y "hi" | Y "hi" | Y "hi" | Y "hi" |
| function-fx | `fx: @function --dbl(--x){result:calc(var(--x) * 2)}.fn{width:--dbl(21px)}` | Y 42px | Y 42px | Y 42px | Y 42px |
| function-parse | `parse: @function --dbl(--x <length>) returns <length>{result:calc(var(--x) * ` | Y CSSFunctionRule | Y CSSFunctionRule | Y CSSFunctionRule | Y CSSFunctionRule |
| mixin-parse | `parse: @mixin --m(){color:red}` | n (dropped) | n (dropped) | Y CSSMixinRule | n (dropped) |
| custom-media-parse | `parse: @custom-media --narrow (max-width: 600px);` | n (dropped) | n (dropped) | n (dropped) | n (dropped) |
| supports-at-rule | `supports: at-rule(@scope)` | n | Y | Y | Y |
| scroll-marker | `supports: selector(::scroll-marker)` | Y | Y | Y | Y |
| scroll-marker-group-pseudo | `supports: selector(::scroll-marker-group)` | Y | Y | Y | Y |
| scroll-button | `supports: selector(::scroll-button(right))` | Y | Y | Y | Y |
| scroll-marker-group-prop | `supports: scroll-marker-group: after` | Y | Y | Y | Y |
| target-current | `supports: selector(:target-current)` | Y | Y | Y | Y |
| field-sizing | `supports: field-sizing: content` | Y | Y | Y | Y |
| shape | `supports: clip-path: shape(from 0% 0%, line to 100% 0%, line to 50% 100%, close)` | Y | Y | Y | Y |
| corner-shape | `supports: corner-shape: squircle` | Y | Y | Y | Y |
| corner-shape-superellipse | `supports: corner-shape: superellipse(2)` | Y | Y | Y | Y |
| reading-flow | `supports: reading-flow: grid-rows` | Y | Y | Y | Y |
| grid-lanes | `supports: display: grid-lanes` | n | n | Y | n |
| background-clip-text | `supports: background-clip: text` | Y | Y | Y | Y |
| webkit-background-clip-text | `supports: -webkit-background-clip: text` | Y | Y | Y | Y |
| is-where | `supports: selector(:is(a):where(b))` | Y | Y | Y | Y |
| import-supports-parse | `parse: @import url("data:text/css,") supports(display: grid);` | Y CSSImportRule | Y CSSImportRule | Y CSSImportRule | Y CSSImportRule |
| import-layer-parse | `parse: @import url("data:text/css,") layer(ext);` | Y CSSImportRule | Y CSSImportRule | Y CSSImportRule | Y CSSImportRule |
| random-step-positional | `supports: width: random(0px, 100px, 10px)` | n | n | Y | n |
| random-element-scoped-suffix | `supports: width: random(--s element-scoped, 10px, 100px)` | n | n | Y | n |
| random-element-scoped-prefix | `supports: width: random(element-scoped --s, 10px, 100px)` | n | n | Y | n |
| random-fixed | `supports: width: random(fixed 0.5, 10px, 100px)` | n | n | Y | n |
| random-item-plain | `supports: color: random-item(red, blue)` | n | n | n | n |
| random-stable-on-restyle | `fx: .rr{width:random(10px,500px)}.rr.big{height:5px}` | n 600px -> 600px (after unrelated restyle) | n 600px -> 600px (after unrelated restyle) | Y 419px -> 419px (after unrelated restyle) | n 600px -> 600px (after unrelated restyle) |
| gotcha-supports-custom-prop-always-true | `supports: --x: random(1px, 2px)` | Y | Y | Y | Y |
| gotcha-supports-custom-prop-garbage | `supports: --x: this-is-not-css(((` | Y | Y | Y | Y |
| gotcha-layer-beats-specificity | `fx: @layer mine{#lyid .lyc{width:21px}} .lyc{width:22px}` | Y 22px (unlayered .lyc beats layered #id . | Y 22px (unlayered .lyc beats layered #id . | Y 22px (unlayered .lyc beats layered #id . | Y 22px (unlayered .lyc beats layered #id . |
| gotcha-property-inherits-false | `fx: @property --pin{syntax:"<length>";inherits:false;initial-value:3px}.pp` | Y 3px (child gets initial-value, not paren | Y 3px (child gets initial-value, not paren | Y 3px (child gets initial-value, not paren | Y 3px (child gets initial-value, not paren |
| gotcha-property-typed-invalid | `fx: @property --pt{syntax:"<length>";inherits:true;initial-value:4px}.pt{-` | Y 4px (value not matching syntax -> initia | Y 4px (value not matching syntax -> initia | Y 4px (value not matching syntax -> initia | Y 4px (value not matching syntax -> initia |
| gotcha-fixed-inside-backdrop-filter | `fx: .bf{position:absolute;top:120px;left:0;width:50px;height:50px;backdrop` | Y fixed child top=136 parent top=136 (equa | Y fixed child top=136 parent top=136 (equa | Y fixed child top=136 parent top=136 (equa | Y fixed child top=136 parent top=136 (equa |
| gotcha-fixed-inside-transform | `fx: .tf{position:absolute;top:130px;left:0;width:50px;height:50px;transfor` | Y fixed child top=146 parent top=146 | Y fixed child top=146 parent top=146 | Y fixed child top=146 parent top=146 | Y fixed child top=146 parent top=146 |
| gotcha-fixed-inside-individual-translate | `fx: .it{position:absolute;top:140px;left:0;width:50px;height:50px;translat` | Y fixed child top=156 parent top=156 (tran | Y fixed child top=156 parent top=156 (tran | Y fixed child top=156 parent top=156 (tran | Y fixed child top=156 parent top=156 (tran |
| gotcha-clip-path-keeps-scroll-overflow | `fx: .sc{width:100px;overflow:auto}.sc .cp{width:100px;clip-path:inset(0)}.` | Y scroller scrollWidth=1000 (clip-path onl | Y scroller scrollWidth=1000 (clip-path onl | Y scroller scrollWidth=1000 (clip-path onl | Y scroller scrollWidth=1000 (clip-path onl |
| gotcha-overflow-clip-removes-scroll-overflow | `fx: .sd{width:100px;overflow:auto}.sd .oc{width:100px;overflow:clip}.sd .o` | Y scroller scrollWidth=100 (overflow:clip  | Y scroller scrollWidth=100 (overflow:clip  | Y scroller scrollWidth=100 (overflow:clip  | Y scroller scrollWidth=100 (overflow:clip  |
| gotcha-overflow-clip-not-scroll-container | `fx: .ns{width:100px;height:20px;overflow:clip}.ns>i{display:block;height:2` | Y scrollTop after set=0 (hidden would allo | Y scrollTop after set=0 (hidden would allo | Y scrollTop after set=0 (hidden would allo | Y scrollTop after set=0 (hidden would allo |
| starting-style-fx | `fx: .ss{opacity:1;transition:opacity 1s}@starting-style{.ss{opacity:0}}` | Y running transitions on insert=1 | Y running transitions on insert=1 | Y running transitions on insert=1 | Y running transitions on insert=1 |
| interpolate-size-fx | `fx: .is{interpolate-size:allow-keywords;height:0;overflow:clip;transition:` | Y transitions 0->auto=1 | Y transitions 0->auto=1 | Y transitions 0->auto=1 | Y transitions 0->auto=1 |
| no-interpolate-size-fx | `fx: .ni{height:0;overflow:clip;transition:height 1s}.ni.open{height:auto}` | Y transitions 0->auto without opt-in=0 (ex | Y transitions 0->auto without opt-in=0 (ex | Y transitions 0->auto without opt-in=0 (ex | Y transitions 0->auto without opt-in=0 (ex |
| gotcha-invalid-selector-list-drops-rule | `fx: .gl1, .gl2::-not-a-real-pseudo{width:24px}` | Y 600px (whole rule dropped because one se | Y 600px (whole rule dropped because one se | Y 600px (whole rule dropped because one se | Y 600px (whole rule dropped because one se |
| forgiving-is-keeps-rule | `fx: :is(.gi1, .gi2:-not-a-real-pc){width:25px}` | Y 25px (:is() forgives the unknown pseudo- | Y 25px (:is() forgives the unknown pseudo- | Y 25px (:is() forgives the unknown pseudo- | Y 25px (:is() forgives the unknown pseudo- |
| unknown-at-rule-recovery | `fx: @not-a-rule --x{color:red} .ua{width:26px}` | Y 26px (unknown at-rule skipped, next rule | Y 26px (unknown at-rule skipped, next rule | Y 26px (unknown at-rule skipped, next rule | Y 26px (unknown at-rule skipped, next rule |
| nested-unknown-rule-recovery | `fx: .nu{width:27px; &::-not-a-real-pseudo{color:red} height:3px}` | Y 27px / 3px (invalid nested rule skipped, | Y 27px / 3px (invalid nested rule skipped, | Y 27px / 3px (invalid nested rule skipped, | Y 27px / 3px (invalid nested rule skipped, |
| invalid-value-falls-back-to-previous | `fx: .fb{width:28px;width:random(10px,20px)}` | Y 28px (28 = unsupported value dropped, ea | Y 28px (28 = unsupported value dropped, ea | Y 14.875px (28 = unsupported value dropped | Y 28px (28 = unsupported value dropped, ea |
| var-hides-invalid-value | `fx: .vh{--r:random(10px,20px);width:28px;width:var(--r)}` | Y 600px (if unsupported: invalid at comput | Y 600px (if unsupported: invalid at comput | Y 11.9375px (if unsupported: invalid at co | Y 600px (if unsupported: invalid at comput |
| scope-root-adds-no-specificity | `fx: @scope (#scid){.scx{width:41px}} .scy .scx{width:42px}` | Y 42px (.scy .scx (0,2,0) beats @scope(#id | Y 42px (.scy .scx (0,2,0) beats @scope(#id | Y 42px (.scy .scx (0,2,0) beats @scope(#id | Y 42px (.scy .scx (0,2,0) beats @scope(#id |
| scope-colon-scope-adds-specificity | `fx: @scope (#scid2){:scope .scx{width:43px}} .scy .scx{width:44px}` | Y 43px (:scope .scx = (0,2,0) ties .scy .s | Y 43px (:scope .scx = (0,2,0) ties .scy .s | Y 43px (:scope .scx = (0,2,0) ties .scy .s | Y 43px (:scope .scx = (0,2,0) ties .scy .s |
| scope-ampersand-specificity | `fx: @scope (#scid3){& .scx{width:45px}} .scy .scx{width:46px}` | Y 46px (46 = & inside @scope adds no speci | Y 46px (46 = & inside @scope adds no speci | Y 46px (46 = & inside @scope adds no speci | Y 46px (46 = & inside @scope adds no speci |
| nesting-keeps-id-specificity | `fx: #nid{.nx{width:47px}} .ny .nx{width:48px}` | Y 47px (#nid{.nx} = #nid .nx (1,1,0) beats | Y 47px (#nid{.nx} = #nid .nx (1,1,0) beats | Y 47px (#nid{.nx} = #nid .nx (1,1,0) beats | Y 47px (#nid{.nx} = #nid .nx (1,1,0) beats |
| animation-shorthand-resets-timeline | `fx: @keyframes kf{to{opacity:.5}} .at1{animation-timeline:view();animation` | Y timeline before shorthand=auto / after s | Y timeline before shorthand=auto / after s | Y timeline before shorthand=auto / after s | Y timeline before shorthand=auto / after s |

## 7. Accessibility probe (Chrome 155.0.8059.40, `Accessibility.getPartialAXTree`)

Browser: Chrome/155.0.8059.40

| element (all `<h2>`) | CSS | accessible name |
|---|---|---|
| `#t-plain` | `::before{content:"\2605 "}` | `★Hello` |
| `#t-alt-empty` | `::before{content:"\2605 " / ""}` | `Hello` |
| `#t-alt-text` | `::before{content:"\2605 " / "Rated: "}` | `Rated: Hello` |
| `#t-fallback` | `content:"\2605 "; content:"\2605 " / ""` | `Hello` |
| `#t-transparent` | `<span>` Hi! with `color:transparent` | `Hi! I make games` |
| `#t-vis-hidden` | `<span>` Hi! with `visibility:hidden` | ` I make games` |
| `#t-disp-none` | `<span>` Hi! with `display:none` | `I make games` |
| `#t-roller` | roller: transparent `<span>`Hi! + `::before{content:"Hola\A Ciao\A Hallo" / ""}` | `Hi! , I make games` |

Reading: `content: "x" / ""` removes the generated text from the accessible name; `/ "alt"` replaces it; the two-declaration fallback works; `color: transparent` text **is** still announced; `visibility:hidden` and `display:none` text is not; the "roller" pattern (transparent marker text + `::before` list with empty alt) is announced as the marker text only. Firefox/Safari were not tested.

## 8. itch observation (2026-10-14)

`https://static.itch.io/user.css` (71,824 bytes, fetched once): occurrences of `color-scheme` 0, `light-dark` 0, `@supports` 0, `backdrop-filter` 0, `@layer` 0, `@container` 0, `:has(` 0, `prefers-color-scheme` 0, `prefers-reduced-motion` 0, `@media` 31, `--itchio` 216. Consequences: itch's base stylesheet is entirely unlayered, declares no colour scheme, and does not itself rely on any of the features above.

Same-origin check (from the June 2026 profile export in the private repo): a creator's own game links are `https://<creator>.itch.io/<game>` (same origin as the profile `https://<creator>.itch.io/`); collection links to other creators are other subdomains.

## 9. Discrepancies and caveats

- **Style-query range syntax in Firefox:** BCD 8.1.5 lists `range_syntax` as Firefox 151, but MDN's Firefox 151 release notes and MDN's "Experimental features" page list it as experimental behind `layout.css.attr.enabled`. *Verifier (2026-10-14):* Firefox's own source disagrees with MDN: in the `FIREFOX_151_0_RELEASE` tag and on the current release branch (158.0.1), `StyleFeature::parse` in `servo/components/style/queries/condition.rs` tries `QueryStyleRange::parse` with no pref check (only the general `layout.css.style-queries.enabled`, default `true`); the attr pref only gates `attr()` used *inside* a range value. Moreover `layout.css.attr.enabled` itself became `true` on Release in Firefox 155 (bug 2038940). So `style(--n > 5)` most likely works by default since Firefox 151 (source-code evidence, not run in a Firefox binary).
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

## 11. Verification (2026-10-14)

Adversarial re-check of facts support-01 ... support-52 by a second agent, from primary sources, on the same day. No browser automation tools; headless Chrome only, each run with a throw-away `--user-data-dir` in the scratchpad.

### 11.1 Method (re-runnable)

```bash
# 1. data, re-downloaded independently (same versions: web-features 3.42.0, BCD 8.1.5, caniuse commit 50f75b62 of 2026-10-13)
curl -s https://registry.npmjs.org/web-features/-/web-features-3.42.0.tgz | tar -xz -C wf
curl -s https://registry.npmjs.org/@mdn/browser-compat-data/-/browser-compat-data-8.1.5.tgz | tar -xz -C bcd
curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json -o caniuse.json
python -I support-tools/verify/q.py wf  wf/package/data.json scope,anchor-positioning,relative-color   # Baseline status
python -I support-tools/verify/q.py bcd bcd/package/data.json css.at-rules.scope                        # raw BCD statements
python -I support-tools/verify/q.py rel bcd/package/data.json chrome 10                                  # release calendar
python -I support-tools/verify/q.py share caniuse.json                                                   # usage per agent
python -I support-tools/verify/blockers.py wf/package/data.json bcd/package/data.json anchor-positioning,text-box  # BCD keys that block Baseline
# 2. the original probe, re-run unchanged (md5 5d55a337...) in Chrome for Testing 147.0.7727.15 headless shell,
#    Chrome 155.0.8059.40, Chrome 155 + --enable-experimental-web-platform-features, and Edge 155 (stable channel)
chrome --headless=new --user-data-dir=<tmp> --dump-dom file:///.../support-probe.html > runs/c155.html   # etc.
python -I support-tools/verify/cmp.py support.md      # compares runs/c147|c155|c155x|edge.html with the section 6 table
# 3. verifier's own probe (new questions) and cross-document view-transition test
chrome --headless=new --virtual-time-budget=3000 --user-data-dir=<tmp> --dump-dom file:///.../support-tools/verify/verify-probe.html
node support-tools/verify/vt-crossdoc.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe" <tmp profile>
# 4. accessibility probe re-run
node support-tools/a11y-cdp.mjs "C:\Program Files\Google\Chrome\Application\chrome.exe" file:///.../support-a11y.html <tmp profile>
# 5. engine sources (Firefox: github.com/mozilla-firefox/firefox branches release=158.0.1, beta=159.0, main=160.0a1;
#    WebKit: github.com/WebKit/WebKit main vs tag WebKit-7625.1.29.18.27 = Safari 27)
curl -s https://raw.githubusercontent.com/mozilla-firefox/firefox/<branch>/modules/libpref/init/StaticPrefList.yaml
curl -s https://raw.githubusercontent.com/mozilla-firefox/firefox/FIREFOX_151_0_RELEASE/servo/components/style/queries/condition.rs
curl -s https://raw.githubusercontent.com/WebKit/WebKit/<ref>/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml
curl -s "https://bugzilla.mozilla.org/rest/bug/1324602"      # Ship CSS scroll-driven animations -> FIXED, 159 Branch
# 6. itch (3 GET requests, >1 s apart): https://static.itch.io/robots.txt, /user.css, /theme_editor.css
```

### 11.2 Results

- **Original probe:** all 139 rows gave exactly the same Y/n in Chrome 147 / 155 / 155+flag as the section 6 table (0 differences). Edge 155 (stable channel) matched Chrome 155 on all 139 rows.
- **Accessibility probe:** identical names for all 8 elements (`★Hello`, `Hello`, `Rated: Hello`, `Hello`, `Hi! I make games`, ` I make games`, `I make games`, `Hi! , I make games`).
- **Data:** every Baseline status/date and BCD version quoted in section 3 re-derived from the independent download; caniuse shares reproduced (and_chr 42.79, ios_saf 14.81, chrome 23.80, edge 5.71, safari 3.09, firefox 2.31, samsung 2.12, and_ff 0.41; total 97.49). Note: caniuse puts all Chrome-for-Android usage under a single version (154).
- **user.css** re-fetched: 71,824 bytes, `Last-Modified: Tue, 06 Oct 2026 21:47:49 GMT`; token counts identical to section 8 (also `@property` 0, `@scope` 0, `transition` 22, `animation` 10). `https://static.itch.io/theme_editor.css` (17,464 bytes, also linked from the profile export) has 0 `@layer`, `@supports`, `@container`, `:has(`, `color-scheme`, `light-dark`, `prefers-reduced-motion`, `prefers-color-scheme`.

Verifier's own probe (`support-tools/verify/verify-probe.html`), Chrome 147 / 155 / 155+flag:

| id | result |
|---|---|
| starting-style-first-render (element already in the HTML) | Y / Y / Y (1 running transition, opacity 0 at first style) |
| starting-style-nested-first-render (`#x{...; @starting-style{opacity:0}}`) | Y / Y / Y |
| `CSS.supports('--x: a ) b')`, `('--x: a } b')`, `('--x', ')')` | false in all three |
| `CSS.supports('--x: this-is-not-css(((')`, `('--x:')` | true in all three |
| `CSS.supports('rotate: random(0deg, 1deg)')` | n / n / Y |
| `width:random(--k,10px,500px);height:random(--k,10px,500px)` | flag build: equal (10.2031px / 10.2031px), so a dashed name is shared across properties |
| `random(--k element-scoped, ...)` on 3 elements | flag build: 3 different values |
| fixed child inside `filter:blur(0)` / `will-change:transform` / `contain:paint` / `rotate:0deg` | parent is the containing block (Y) in all three |
| fixed child inside `container-type:inline-size` / `opacity:.9` (control) | viewport is the containing block (child top=0) in all three |
| `@view-transition` inside `@media`, `@supports`, and nested in a style rule | kept as CSSMediaRule / CSSSupportsRule / **CSSStyleRule[CSSViewTransitionRule]** |
| `interpolate-size` inherits to a child | Y (`allow-keywords`) |
| `animation-range` declared before the `animation` shorthand | reset to `normal`; after the shorthand it is kept |
| `sibling-index()` ignores text nodes | Y (2nd element child = 20px) |

Cross-document view transitions (`vt-crossdoc.mjs`, Chrome 155.0.8059.40, two same-origin pages on 127.0.0.1, navigation by clicking a link, `pagereveal` event's `viewTransition` read on the new page; `prefers-reduced-motion: reduce` was false):

| variant (CSS in old page / new page) | transition? |
|---|---|
| none / none | no |
| `@view-transition{navigation:auto}` top-level in both | **yes** |
| inside `@media (prefers-reduced-motion: no-preference)` in both | **yes** |
| nested `#wrapper{@view-transition{navigation:auto}}` in both | **yes** |
| only in the old page | no |
| only in the new page | no |

Engine sources:

| item | finding |
|---|---|
| Firefox `layout.css.scroll-driven-animations.enabled` | release 158.0.1: `@IS_NIGHTLY_BUILD@`; beta 159.0: `true`; main 160: `true`. Bug 1324602 "Ship CSS scroll-driven animations" FIXED for 159 (resolved 2026-10-04). |
| Firefox `layout.css.random.enabled`, `layout.css.corner-shape.enabled` | `@IS_NIGHTLY_BUILD@` on release, beta and main |
| Firefox `layout.css.attr.enabled` | `false` in the 151 release tag, `true` on release 158 (bug 2038940 "Enable new CSS attr() on Release", 155), removed on beta/main |
| Firefox style-query range parse | not pref-gated in 151 and 158 (`StyleFeature::parse` calls `QueryStyleRange::parse`); `StyleFeaturePlain::parse` only accepts custom properties ("TODO: Maybe support non-custom properties?") |
| WebKit flags, Safari 27 tag vs trunk 2026-10-13 | `CSSAttrSubstitutionFunctionEnabled` preview/off, enabled on trunk 2026-07-07 (flag later removed); `CSSFunctionAtRuleEnabled` testable/off, trunk stable/on (2026-07-07); `CSSIfFunctionEnabled` absent, trunk stable/on (2026-07-09); `CSSRandomItemFunctionEnabled` testable/off, trunk stable/on (2026-08-14); `CSSCornerShapeEnabled` testable/off, trunk stable/on (2026-08-14); `CSSCalcSizeFunctionEnabled` absent, trunk stable/on (2026-10-03); `CSSRandomFunctionEnabled` stable/on in both |

Spec text (drafts.csswg.org, fetched 2026-10-14): css-cascade-6 §3.5.1 "The & selector is defined to behave as :where(:scope)"; the cascade sort order lists Specificity before Scope Proximity. css-values-5: `random( <random-key>? , <calc-sum>, <calc-sum>, <calc-sum>? )`, `<random-key> = auto | <random-cache-key> | fixed <number [0,1]>`, `<random-cache-key> = <dashed-ident> || element-scoped || [ property-scoped | property-index-scoped | <random-ua-ident> ]`; `random-item( <random-key> , [ <declaration-value>? ]# )`.

### 11.3 Verdicts

| id | verdict | note |
|---|---|---|
| support-01 | corrected | Dates/cadence confirmed (BCD calendar, Mozilla blog, MDN 158; release branch already at 158.0.1). BCD 8.1.5 (2026-10-08) still marks Firefox 157 and Edge 154 "current"; Edge 155 stable was installed on the test machine. Samsung Internet 30 is Chromium 143, about 10 months / 12 versions behind Chrome today, not ~6 months. techspot returned 403 (cadence instead confirmed by BCD dates 152, 153, 154, 155, 156 every 14 days). |
| support-02 | corrected | Numbers reproduced. Safari + iOS together = 17.9% (one visitor in ~5.6); caniuse lumps all Chrome Android into one version. |
| support-03 | confirmed | Re-run; Safari 26.2 uses the same positional step syntax (WebKit 26.2 post: `random(0, 100, 2)`). |
| support-04 | confirmed | Re-run, plus: a dashed name is also shared across properties; `element-scoped` gives per-element values. BCD 8.1.5 still lists `element-shared` for Safari 26.2 without a removal (stale vs WebKit 26.5 post). |
| support-05 | corrected | Not in any stable browser, but WebKit trunk enabled random-item() by default on 2026-08-14 (Safari 27: flag off). |
| support-06 | confirmed | Re-run. |
| support-07 | corrected | Not literally always true: false for unmatched `)`/`}`; true for anything else, so still useless as a feature test. |
| support-08 | confirmed | Re-run. |
| support-09 | confirmed | Chromium-only among stable browsers; WebKit trunk enabled if() 2026-07-09. |
| support-10 | confirmed | Re-run; Firefox source only parses custom properties in style(); Safari not tested. |
| support-11 | corrected | Firefox source: range parse is not pref-gated since 151; MDN's "experimental" note looks wrong. Safari still lacks it. |
| support-12 | confirmed | Re-run. |
| support-13 | corrected | Safari had full @scope in 17.4-18.6 (there is no Safari 19-25), partial 26.0-26.3, full 26.4+. web-features lists Chrome 143 because it includes `&` in @scope. |
| support-14 | corrected | Results reproduced; but the spec says `&` in @scope behaves as `:where(:scope)` (zero specificity), and Safari 26.2 fixed `&` to match. |
| support-15 | confirmed | Re-run. |
| support-16 | confirmed | Re-run. |
| support-17 | confirmed | Re-run. |
| support-18 | confirmed | Re-run + web-features dates. |
| support-19 | corrected | Firefox 159 (2026-10-27) ships scroll-driven animations (bug 1324602, beta pref true). |
| support-20 | corrected | Behaviour reproduced; BCD `animation-timeline_included` is not "false everywhere": Chrome 115 is partial ("reset-only"), Firefox/Safari false. The shorthand also resets `animation-range`. |
| support-21 | corrected | Mechanism now verified in Chrome 155 (both pages must opt in; the @media wrapper works); "cannot be nested under #wrapper" is wrong in Chrome (the nested rule fired). The itch same-origin part remains inferred. |
| support-22 | confirmed | Re-run; Chrome's own blog says match-element only works for same-document transitions; WebKit bug 281203 implemented `auto` (Oct 2024). |
| support-23 | confirmed | Re-run; blockers re-derived (only `position-visibility.anchor-valid/anchor-visible`). |
| support-24 | confirmed | Re-run; also fires on first render for elements in the HTML (Chrome). |
| support-25 | confirmed | Re-run; interpolate-size inheritance verified. WebKit trunk enabled calc-size() 2026-10-03. |
| support-26 | confirmed | Re-run. |
| support-27 | confirmed | Re-run. |
| support-28 | confirmed | a11y probe reproduced. |
| support-29 | confirmed | a11y probe reproduced. |
| support-30 | corrected | `overflow-clip-margin`: Chrome only when both axes are `clip`, Firefox 102+, no Safari. |
| support-31 | confirmed | Re-run; WebKit bug 297620 is NEW (open), macOS 14 only (does not reproduce on macOS 26). |
| support-32 | confirmed | Re-run; more triggers added (filter, will-change, contain:paint, rotate); container-type does not trap fixed children in Chrome. |
| support-33 | confirmed | WebKit 26.5: "animating to an implicit value for individual transform properties" fixed. |
| support-34 | confirmed | Re-run; Safari 26.2 default oklab confirmed in the WebKit post. |
| support-35 | corrected | Chrome 122 is for `rgb(from ...)`; `hsl()`/`hwb()` relative syntax needs Chrome 125 (web-features uses 125 for the feature). |
| support-36 | confirmed | Re-run + user.css re-fetched. |
| support-37 | confirmed | Re-run + user.css re-fetched. |
| support-38 | confirmed | Safari 27: attr() flag "preview"/off; WebKit trunk enabled it 2026-07-07. |
| support-39 | confirmed | Safari 27: @function flag off; WebKit trunk enabled it 2026-07-07. |
| support-40 | confirmed | Re-run + BCD. |
| support-41 | confirmed | BCD. |
| support-42 | confirmed | BCD + web-features + MDN/WebKit notes. |
| support-43 | confirmed | web-features. |
| support-44 | confirmed | Firefox pref = Nightly-only on all branches; WebKit trunk enabled corner-shape 2026-08-14 (Safari 27 off). |
| support-45 | confirmed | BCD + MDN 154; Firefox release pref `layout.css.text-box.enabled` = true; rendering still unverified. |
| support-46 | confirmed | BCD. |
| support-47 | confirmed | BCD + web-features + WebKit 26.5 (`:open`). |
| support-48 | confirmed | BCD + MDN 158; no web-features id. |
| support-49 | confirmed | Re-run; blink-dev thread dated 2026-07-16. |
| support-50 | confirmed | Re-run; Firefox release pref `layout.css.supports.at-rule.enabled` = true. |
| support-51 | confirmed | Interop 2026 README re-read (also lists custom highlights). |
| support-52 | confirmed | Re-fetched (now a live re-observation); theme_editor.css also has none of these tokens. |

Incident note: during this verification one `chrome.exe --version` call (meant to print the version) was made without `--headless`; on Windows this may have opened a window in the user's already-running Chrome. No page was loaded in it and no profile data was read; all test runs used headless Chrome with throw-away profiles.

### 11.4 Second independent verification pass (2026-10-14, re-run)

A second adversarial verifier re-did the checks from scratch in a new scratchpad folder (`support-verify2`), without reusing the first verifier's downloads or run outputs. Headless Chrome only, with throw-away `--user-data-dir` profiles; the Chrome version was read from the executable's file version info, never by launching a windowed `chrome.exe`.

```bash
# data (fresh downloads; the npm registry still lists web-features 3.42.0 and BCD 8.1.5 as latest on 2026-10-14)
curl -s https://registry.npmjs.org/web-features/-/web-features-3.42.0.tgz | tar -xz -C wf
curl -s https://registry.npmjs.org/@mdn/browser-compat-data/-/browser-compat-data-8.1.5.tgz | tar -xz -C bcd
curl -s https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json -o caniuse.json
python -I support-tools/verify2/bq.py bcd/package/data.json 0 css.at-rules.scope css.types.color.hsl.relative_syntax   # BCD per browser (+notes)
python -I support-tools/verify/q.py wf wf/package/data.json scope,relative-color,popover                                  # Baseline
# original probe, unchanged, in Chrome for Testing 147.0.7727.15 headless shell, Chrome 155.0.8059.40, Chrome 155 + experimental flag
chrome --headless=new --user-data-dir=<tmp> --virtual-time-budget=3000 --dump-dom file:///.../support-probe.html > runs/c155.html
python -I support-tools/verify2/cmp2.py runs support.md        # compares runs/c147|c155|c155x.html with the section 6 table
# second verifier's own probe (new rows), same three builds
chrome --headless=new --user-data-dir=<tmp> --dump-dom file:///.../support-tools/verify2/v2-probe.html
# a11y and cross-document view transitions (scripts from support-tools/ and support-tools/verify/)
node support-tools/a11y-cdp.mjs "<chrome.exe>" file:///.../support-a11y.html <tmp>
node support-tools/verify/vt-crossdoc.mjs "<chrome.exe>" <tmp>
# engine sources and trackers
curl -s https://raw.githubusercontent.com/mozilla-firefox/firefox/{release,beta}/modules/libpref/init/StaticPrefList.yaml   # release = 158.0.1, beta = 159.0
curl -s https://raw.githubusercontent.com/mozilla-firefox/firefox/{release,FIREFOX_151_0_RELEASE}/servo/components/style/queries/{condition,feature_expression}.rs
curl -s https://raw.githubusercontent.com/WebKit/WebKit/{main,WebKit-7625.1.29.18.27}/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml
curl -s "https://bugzilla.mozilla.org/rest/bug/1324602"; curl -s "https://bugs.webkit.org/rest/bug/297620"
curl -s https://drafts.csswg.org/css-cascade-6/
# itch (3 GET requests, 2 s apart, browser UA): https://static.itch.io/robots.txt, /user.css, /theme_editor.css
```

**Results**

- Original probe: 139/139 rows identical to section 6 in all three builds (0 differences). Accessibility probe: the same 8 names as section 7. Cross-document view transitions: the same 6 results as 11.2 (a transition only when both pages opt in; also inside `@media (prefers-reduced-motion: no-preference)` and when nested in a style rule).
- Data: all Baseline dates and BCD versions quoted in section 3 re-derived; caniuse shares reproduced (and_chr 42.79, chrome 23.80, ios_saf 14.81, edge 5.71, safari 3.09, firefox 2.31, samsung 2.12, and_ff 0.41; Safari + iOS = 17.9%). caniuse has no usage yet for Firefox 158. BCD 8.1.5 (2026-10-08) still labels Firefox 157 and Edge 154 "current"; MDN's Firefox 158 page gives 2026-10-13.
- itch: `user.css` 71,824 bytes, `Last-Modified: Tue, 06 Oct 2026 21:47:49 GMT`, token counts identical to section 8, plus 13 `@keyframes`, 10 `animation`, 22 `transition`, 0 `@property`/`@scope`/`@import`. `theme_editor.css` 17,464 bytes: 0 `@layer`, `@supports`, `@container`, `:has(`, `color-scheme`, `light-dark`, `prefers-*`. The June 2026 profile export loads exactly these two itch stylesheets and has no `<meta name="color-scheme">`; none of the 158 logged-out itch HTML pages crawled by other dimensions today declares `color-scheme` (one AMP devlog page, `itch.io/devlog/<id>/<slug>.amp`, has itch's own `@media (prefers-color-scheme: dark)` and no custom CSS at all).

New rows (`support-tools/verify2/v2-probe.html`), Chrome 147 / 155 / 155 + experimental flag:

| check | result |
|---|---|
| `@starting-style` on an element already in the HTML | 1 running transition, opacity 0 on first style (all three) |
| `CSS.supports()` with `--x: a ) b`, `a ] b`, `a } b`, `;`, `a; b` | false (all three); `this-is-not-css(((`, empty value and `!important` are true |
| `interpolate-size` set on the parent only | 1 transition to `height:auto` (it inherits) |
| `color-scheme: light dark` on a grand-parent, `light-dark()` on the child | dark value when the OS is dark (155), light value in the light-mode 147 shell |
| `width: attr(data-p %, 1%)` with `data-p="50"`, parent 200px | 100px |
| `text-box: trim-both cap alphabetic` on a 40px/1 serif inline-block | 40px -> 26.48px (trimming is rendered in Chrome) |
| 8-line textarea, `field-sizing: content` vs default | 166px vs 46px |
| computed `corner-shape: squircle` | `squircle` (147), `superellipse(2)` (155) |
| `sibling-index()` with text nodes between elements | 2nd element = 2 (text nodes ignored) |
| `animation-range` before / after the `animation` shorthand | `normal` / kept |
| fixed child inside `filter:blur(0)`, `will-change:transform`, `contain:paint`, `rotate:0deg`, `perspective:100px`, `backdrop-filter` | trapped by the parent (all three) |
| fixed child inside `container-type:inline-size` or `opacity:.9` | viewport (not trapped) |
| `<button popovertarget>` click (no script on the popover) | `:popover-open` matches |
| flag build: `random(--k,...)` in width and height of one element | equal; unnamed `random()` in width and height: different; `random(--n,...)` on 3 elements: equal; `random(--e element-scoped,...)` on 3 elements: 3 different |
| `#wrapper{color:red;@view-transition{navigation:auto}}` | CSSStyleRule containing a CSSViewTransitionRule |

Sources re-read: MDN Firefox 151, 154 and 158 release notes and the Experimental features page (it still lists style-query range syntax as off behind `layout.css.attr.enabled`, but that pref is `true` on release 158 and neither the 151 nor the 158 source gates `QueryStyleRange::parse`); Mozilla SUMO cadence post (Firefox 155 = first 2-week release, 2026-09-01); bug 1324602 (FIXED, 159 Branch); bug 2071165 (random() behind pref, 158); bug 2038940 (attr() on Release, 155); WebKit Safari 26.2 and 26.5 posts; WebKit bug 297620 (NEW; macOS 14 only, not reproducible on macOS 26); css-cascade-6 ("The & selector is defined to behave as :where(:scope)"; Specificity is sorted before Scope Proximity; selectors inside @scope "do not acquire the specificity" of the prelude); Interop 2026 README; web.dev September 2026 ("Chrome 156 beta includes the CSS random() function"); Chrome 139 blog (`@function` presented as "Try out"); blink-dev "Intent to Prototype: CSS mixins" (2026-07-16); vtbag.dev (`auto` only in Safari); WebKit trunk vs Safari 27 flags (trunk: `if()`, `@function`, `random-item()`, `corner-shape`, `calc-size()` stable and on; Safari 27 tag: off or absent; the `attr()` flag is preview/off in 27 and absent from trunk's list).

**Verdicts of the second pass** (they agree with 11.3 unless noted)

| id | verdict | note |
|---|---|---|
| 01 | corrected | Samsung Internet 30 (Chromium 143, 2025-12-02) is ~10 months / 12 versions behind Chrome 155 today, not ~6 months. Edge's first 2-week gap is 152 (2026-08-28) -> 153 (2026-09-11). |
| 02 | confirmed | Safari + iOS = 17.9% ("one in six" slightly understates it: ~1 in 5.6). |
| 03 | confirmed | |
| 04 | confirmed | Also: a dashed name is shared across properties; unnamed calls differ per property. |
| 05 | corrected | Implemented in WebKit (Safari 27 behind an off flag; on in trunk), so the accurate claim is "not enabled in any stable browser". |
| 06 | confirmed | |
| 07 | corrected | False for unbalanced `)`/`]`/`}` and for `;`. |
| 08 | confirmed | |
| 09 | confirmed | |
| 10 | confirmed | |
| 11 | corrected | Firefox source parses the range syntax with no pref since 151; Safari lacks it. |
| 12 | confirmed | |
| 13 | corrected | Safari's full support was 17.4-18.x (there is no Safari 19-25); web-features uses Chrome 143. |
| 14 | corrected | Spec: `&` in @scope = `:where(:scope)` (zero specificity); Safari 26.2 fixed `&` to match. |
| 15-18 | confirmed | |
| 19 | corrected | Firefox 159 (2026-10-27) ships scroll-driven animations. |
| 20 | corrected | BCD: Chrome 115 "partial (reset-only)", not false everywhere; the shorthand also resets `animation-range`. |
| 21 | corrected | Mechanism verified in Chrome 155; the nested form also fired; the itch same-origin part is inferred. |
| 22-29 | confirmed | |
| 30 | corrected | `overflow-clip-margin`: Chrome only with `clip` on both axes, Firefox 102+, no Safari. |
| 31-34 | confirmed | 32: more triggers (filter, will-change, contain:paint, perspective, rotate); container-type and opacity don't trap. |
| 35 | corrected | Chrome 122 only for the `rgb()`/`oklch()` from-syntax; `hsl()`/`hwb()` need 125. |
| 36-41 | confirmed | 36: also no `<meta name="color-scheme">` on itch pages. |
| 42 | corrected | The comment textarea is only rendered for logged-in visitors; functional growth verified in Chrome. |
| 43-46 | confirmed | 45: text-box trimming renders in Chrome (verified); BCD itself lists Firefox 154 for `text-box-edge: cap/alphabetic`, so the `<text-edge>` blocker looks like stale data. |
| 47 | corrected | The 2025-01-27 Baseline date belongs to the `popover` feature (Chrome 116, iOS 18.3); `:popover-open` itself is Chrome 114. Declarative popover verified in Chrome. |
| 48-51 | confirmed | |
| 52 | confirmed | Re-fetched live (verified); theme_editor.css also lacks these tokens. |

Body fixes made in this pass: section 3 (@scope, relative colour and `:popover-open` rows) and section 4 (`field-sizing` row).

Extra row (`support-tools/verify2/v3-colorscheme.html`, Chrome 147 light shell / Chrome 155 with the OS in dark mode): a `<textarea>`/`<input>` whose ancestor has no `color-scheme` computes `background rgb(255,255,255)`, text `rgb(0,0,0)` in both builds, even with the OS dark; with `color-scheme: dark` two levels up it computes `rgb(59,59,59)` / `rgb(255,255,255)` (the property inherits: the child reports `dark`); with `light dark` it follows the OS (white in 147, dark in 155). So on a dark itch theme, `#wrapper{color-scheme:dark}` darkens UA-styled controls; itch's own `.form textarea` / `.dark_theme .form ...` rules in user.css may still set explicit colours (not tested on a live page).

## 12. Re-check after the dated releases (2026-10-29)

The time-bound rows of section 07 (§7.4, §7.14) said to re-run both probes and re-fetch the data after 2026-10-28.

- **support-62: Chrome 156 probe runs (verified).** Google Chrome **156.0.8078.49** (stable, installed on the test machine), `chrome --headless=new --disable-gpu --user-data-dir=<throw-away dir in the scratchpad> --virtual-time-budget=2000 --dump-dom <file URL>`, never the user profile.
  - `support-probe.html`: 139 rows; **9 changed from Chrome 155, all `random()`**, and each now matches the 155 `--enable-experimental-web-platform-features` column: `random`, `random-shared-ident`, `random-fx` (3 elements, 3 widths: 385.2/397.7/136.2), `random-shared-fx` (same `--s`, same width: 244.3/244.3), `random-step-positional` (`random(0px, 100px, 10px)`), `random-element-scoped-suffix`, `random-element-scoped-prefix`, `random-fixed`, `random-stable-on-restyle` (240.016px before and after an unrelated restyle). Still `n`: `random-step` (`by 10px`), `random-element-shared`, `random-item` (both separators). Every scroll-driven row was already `Y` in 155 and stays `Y`.
  - `sec07-tools/sec07-probe.html`, two loads: `sec07-tools/results-chrome156.txt` and `results-chrome156b.txt`. T3–T6 flip exactly as in the 155 flag build (T5 `@supports (rotate: random())` now applies, T6 the `not` branch does not); their expected values were written for 155, so they read FAIL. T21 rolled `-308px` then `-364px`, and T22 `-1.47s/-1.11s/-2.46s` then `-0.46s/-0.15s/-1.34s`: a new value on every load.
- **support-63: release data (documented).** `@mdn/browser-compat-data` **8.1.7**: `css.types.random` Chrome/Edge 156, Safari/iOS 26.2, Firefox `preview`; `css.properties.animation-timeline` (and `.view`, `animation-range`) Firefox **159**, Chrome 115, Safari 26. BCD still lists Firefox 159 as `beta`; Mozilla's `product-details.mozilla.org/1.0/firefox_versions.json` says `LATEST_FIREFOX_VERSION` **159.0**, released **2026-10-27**. `web-features` **3.44.0**: `random-function` and `scroll-driven-animations` not Baseline (the latter has no Firefox entry yet). Global coverage by `matrix.py`'s method (BCD versions × caniuse `usage_global`, caniuse data of 2026-10-29): `random()` **56.0 %**, scroll-driven animations **88.2 %**. No Firefox binary on the machine: the Firefox column stays documented.
