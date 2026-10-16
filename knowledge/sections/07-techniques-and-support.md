## JS-free techniques and browser support

itch.io runs no author JavaScript, so everything dynamic on a custom page has to come from CSS. That covers motion, hover and focus states, scroll-driven effects, page-to-page transitions, container and style queries, `:has()`, generated content, SVG data URIs, and per-visit randomness (native `random()` or an external stylesheet regenerated on every request). This section lists those techniques with their browser support as of **2026-10-14**, and gives a fallback for each that keeps the page correct where the feature is missing.

How to read it:

- Tags are **[confidence · evidence id]**. Undated observations are from 2026-10-14. `s07-nN` ids point to the *Section notes* at the end, which hold the checks made for this section. `live-*` ids come from the live probe run of 2026-10-16 on the owner's draft project page (Brave 155 = Chromium 155; `evidence/live-probes/`): they show what itch stored there and what that browser applied, not browser support in general.
- Browser behaviour was run **only in Chromium**: headless Chrome 147 and 155, Chrome 155 with `--enable-experimental-web-platform-features` (the "flag build"), Edge 155, and Chromium 152 for some local tests. The Firefox and Safari columns come from MDN browser-compat-data (BCD) 8.1.5, web-features 3.42.0, release notes and engine source. They are *documented*, not run. **A `verified` tag on a support row covers the Chromium result only**; §7.4 shows the two halves separately. No Firefox or WebKit engine was available on the test machine (Playwright's cache holds only Chromium 1217), so every cross-browser warning in this section is documented or inferred **[verified · gapfill07-07]**.
- Related sections: 02 §2.7 (P8: motion and WCAG 2.2.2), 05 (HTML sanitizer), 06 (cascade and `@import` order), 08 (external CSS, fonts and per-visit services in depth), 10 (testing and accessibility).

> **Time-bound facts: as of 2026-10-14.** These rows change on known dates. Re-run `knowledge/evidence/support-probe.html` and `sec07-tools/sec07-probe.html` and re-fetch BCD, web-features and caniuse **after 2026-10-28** before trusting them **[documented · gapfill07-08]**:
> - `random()`: Chrome 156 ships it on **2026-10-20** (§7.4, §7.14). After that date "Chrome 155 rejects it" is history; Chromium plus Safari 26.2+ have it.
> - Scroll-driven animations: Firefox 159 ships them on **2026-10-27** (§7.4, §7.7).
> - `text-wrap:balance` becomes Baseline *Widely* on **2026-11-13**.
> - Edge 156 on 2026-10-22; caniuse usage shares (2026-10-13 data) drift monthly.
> - itch's own grid script and stylesheets (§7.13) were last checked on 2026-10-14, with asset stamp `?1791985261`. That stamp changed at least three times that day, so re-test the grid rules after any visible itch redesign.

### 7.1 Ground rules

1. **itch passes custom CSS through as written; only the visitor's browser filters features.** Nesting with `&>`, `:has()`, range media queries, `@property`, `color-mix()`, `clamp()` and `dvw` are all served live, unchanged **[verified · corpus-27, community-38; observed · crawlproject-71]**. `@container`, `@layer`, `@scope`, `@starting-style` and `@view-transition` appear on 0 of the 62 sampled pages. On a draft project those five, plus `@property`, a container style query, `@counter-style`, `@function`, `sibling-index()`, nesting and range media, survived saving and applied in Chromium 155; `random()` was stored but not applied **[verified 2026-10-16 · live-c11 to live-c21, live-c28 to live-c30, live-c36]**. The only changes itch made were to delete `</style>` and trim the outer whitespace **[verified 2026-10-16 · live-c42 to live-c44, live-css]**. On profiles and jams, survival of the five at-rules is still **[inferred]** from the verbatim storage.
2. **Feature-detect; don't target version numbers.** Chrome, Edge and Firefox now ship a major version every two weeks **[documented · support-01]**. Use in-rule fallbacks and `@supports` (§7.3).
3. **The element's base style must be its finished, readable state.** Animate *from* hidden and never set `opacity:0` on the element itself. Unsupported browsers, and `animation:none` under reduced motion, then leave the content visible **[verified · a11y-24; documented · support-19]**.
4. **Always ship a reduced-motion block, and keep auto-starting motion finite (≤ 5 s).** 34 of 62 sampled pages use `@keyframes`, but only 5 honour `prefers-reduced-motion` **[observed · s07-n6]**. A block tested on a real profile is in §7.5 **[verified · a11y-23]**. The guard does not satisfy WCAG 2.2.2, so endless loops need the user's explicit consent (§7.5, 02 §2.7) **[documented · a11y-25]**.
5. **Safari is the gap that matters.** Safari and iOS Safari together are 17.9 % of global usage, about one visitor in 5.6. A feature that only Chromium and Firefox have misses all of them **[documented · support-02]**.
6. **Profile CSS is capped at 5,120 UTF-8 bytes** (5,120 ASCII characters; non-ASCII costs 2–4 each) **[verified 2026-10-16 · live-cap-A1, live-cap-A2c]**. Prefer techniques that save characters (nesting, `sibling-index()`), and keep data URIs and fonts out of the pasted CSS **[verified · community-11; observed · corpus-42]**. Project CSS has no cap **[verified 2026-10-16 · live-cap-B1]**.
7. **Scope modern selectors under `#wrapper` too.** Write `#wrapper .game_comments_widget .post_body p:has(a)`; a `body:has(…)` rule sits outside `#wrapper` and goes against the guide **[observed · crawlproject-71]**.

### 7.2 The browser landscape (2026-10-14)

| Browser | Current stable | Next | Notes |
|---|---|---|---|
| Chrome (desktop and Android) | 155 (2026-10-06) | 156 on 2026-10-20 (re-verify after) | 2-week cadence since 153 (2026-09-08) |
| Edge | 155 (2026-10-08) | 156 on 2026-10-22 | Edge 155 matched Chrome 155 on all 139 rows of the support probe **[verified · s07-n5]** |
| Firefox | 158 (2026-10-13) | 159 on 2026-10-27 (re-verify after) | 2-week cadence since 155 (2026-09-01) |
| Safari (macOS and iOS) | 27 (2026-09-14) | point releases | On iOS every browser uses WebKit, so iOS Safari's version is what iPhone visitors get **[documented · s07-n5]** |
| Samsung Internet | 30 (= Chromium 143) | – | about 12 Chrome versions (~10 months) behind Chrome 155 |

**[documented · support-01]**

- **Usage** (caniuse, global, 2026-10-13; these shares drift, so re-fetch before quoting them after 2026-11): Chrome Android 42.8 %, desktop Chrome 23.8 %, iOS Safari 14.8 %, Edge 5.7 %, desktop Safari 3.1 %, desktop Firefox 2.3 %, Samsung 2.1 %, Firefox Android 0.4 %. These are global web figures; itch's own audience is unknown and probably more desktop-heavy **[documented · support-02]**.
- **itch desktop app.** Its Electron was upgraded around February 2026 and reportedly supports modern CSS, but older installs may not. Its Chromium version is not stated, so test there too **[community · community-37]**.
- **Gaps most likely to close next.** Interop 2026 focus areas include container style queries, anchor positioning, `attr()`, `contrast-color()`, CSS zoom, dialogs and popovers, media pseudo-classes, scroll-driven animations, scroll snap, `shape()` and view transitions, including cross-document ones **[documented · support-51]**.
- **Coming to Safari, but not in Safari 27.** WebKit trunk, which Safari Technology Preview builds from, has `if()`, `@function`, `random-item()`, `corner-shape` and `calc-size()` on by default. Safari 27 ships them off or not at all. Treat them as Chromium-only (or, for `random-item()`, as unavailable) for now **[documented · support-57]**.

### 7.3 How CSS fails, and how to write fallbacks

#### Failure modes (Chrome 155, re-run for this section)

| What you write | What happens | Evidence |
|---|---|---|
| A plain value, then a modern value, in the same rule: `width:28px;width:random(10px,20px)` | Only the unsupported declaration is dropped; 28px applies | **[verified · s07-n1 T3]** |
| An unknown pseudo-element in a selector list: `.a, .b::-x{…}` | The **whole rule** is dropped, including the valid `.a` | **[verified · s07-n1 T1]** |
| The same unknown selector in a rule of its own | The other rule survives | **[verified · s07-n1 T2]** |
| The unknown part inside `:is(…)` | `:is()` forgives it; the rule applies | **[verified · s07-n1 T18]** |
| An unknown at-rule | Skipped; the rest of the sheet applies | **[verified · support-50]** |
| A modern value routed through a custom property: `--r:random(…);width:28px;width:var(--r)` | Every browser accepts `--r`, so `width:var(--r)` wins the cascade. It is then invalid at computed-value time and becomes `auto`, **not** 28px | **[verified · s07-n1 T4]** |
| `@supports (--x: random(0deg, 1deg))` | True (custom properties accept almost any tokens), so it **detects nothing** | **[verified · s07-n1 T7]** |
| `@supports (rotate: random(0deg, 1deg))` | A real feature test: false in Chrome 155, true in the flag build | **[verified · s07-n1 T5/T6, support-03]** |
| A generic override inside `@supports` (`span{--i:…}`) against existing `span:nth-child(3){--i:7}` rules | The `:nth-child` rule keeps winning, because it is more specific | **[verified · localtests-31, s07-n2 T23]** |
| `content:var(--x)` where `--x` holds an unquoted word | The declaration is invalid at computed time; the pseudo-element disappears (`none`) | **[verified · localtests-25]** |
| `@import` placed after any style rule or `@font-face` | The import is dropped silently; later rules still apply | **[verified · corpus-11, corpus-46]** |

Rules derived from these results:

- **Do** write the plain value first and the modern value second, in the same rule.
- **Never** put a risky pseudo-element (`::scroll-button()`, `::scroll-marker`, `::details-content`, vendor pseudos) in a selector list with selectors that must work everywhere. If one engine lacks it, the whole list dies: run in Chromium with an unknown pseudo-element **[verified (Chromium) · s07-n1 T1, support-40]**; other engines follow the same selector-list rule **[documented · support-40]**.
- **Never** use a custom property as the fallback mechanism, and never feature-test through one. Test a real property with a real value.
- **Give an `@supports` override at least the specificity of what it replaces.** `#wrapper .x span:nth-child(n){…}` ties with `#wrapper .x span:nth-child(3){…}` and wins on source order **[verified · s07-n2 T24]**.
- `@supports at-rule(@scope)` exists only in Chrome 148+ and Firefox 157+, not in Safari. Test a property that ships with the at-rule instead, e.g. `@supports (anchor-name: --a)` before `@position-try`. Chromium half **[verified · support-50]**; Firefox and Safari **[documented · support-50]**.

#### Guard patterns

```css
/* 1. In-rule fallback: plain first, modern second */
#wrapper .game_cell{animation-delay:.2s;animation-delay:calc(sibling-index()*60ms)}
/* 2. Positive / negative guards on a real property */
@supports (animation-timeline: view()){ /* enhancement */ }
@supports not (animation-timeline: view()){ /* alternative look, rarely needed */ }
/* 3. Selector guard */
@supports selector(::scroll-marker){ /* carousel markers */ }
/* 4. Motion enhancement: a media query wrapping a feature query */
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){ /* … */ }}
```

Patterns 3 and 4 apply in Chrome 155, and `@supports` also works nested inside a nested `#wrapper{…}` rule **[verified · s07-n1 T8, T16, T17]**.

#### Nesting: worth it, with one caveat

- `#wrapper{ .x{} p.x{} & .x{} @media(…){} }` all apply. A nested rule has the **same specificity** as the flat `#wrapper .x` (1,1,0): the later one wins either way. The ID therefore still beats the theme, and `#wrapper` is written once **[verified · localtests-07]**. Creators use nesting to fit the cap: one live profile has 32 `&` selectors and one project page 73 **[verified · community-38]**.
- **Support:** full in Chrome/Edge 120+, Firefox 117+ and Safari 17.2+. Chrome/Edge 112–119 and Safari 16.5–17.1 are partial: a nested rule that starts with a bare type selector (`hr{…}`) is not accepted **[documented · crawlprofile-33, itchcss-05]**. Widely available since 2026-06-11, ~92.9 % of users **[documented · s07-n5]**.
- **itch's own profile theme is nested**, including a bare `hr{…}` inside `.user_page{…}` **[observed · crawlprofile-33, itchcss-05]**. What older browsers lose follows from the parsing rules but was not tested in old browsers **[inferred · crawlprofile-33, itchcss-05]**:
  - In partial-support browsers, `hr{` is parsed as an invalid declaration that swallows the rest of the `.user_page{…}` block: the hr colour, the `.user_links` svg fill, and the column and collection border colours. The separate `.game_grid_widget .game_cell{…}` block survives.
  - Browsers with no nesting support lose every nested theme rule: the game-title link colour, the thumb radius and the text colours.
  - If your design relies on those theme colours, restate them in flat `#wrapper …` rules.
- Keep rules the page cannot do without (layout, readable colours) flat if pre-2023 browsers matter. Nest the rest **[inferred · community-38, crawlprofile-33]**.

#### At-rules and the cascade

- Mid-sheet at-rules that parse and apply: `@media`, `@supports`, `@container`, `@keyframes`, `@font-face`, `@property`, `@scope` and `@layer`. Mid-sheet `@import`, `@charset` and `@namespace` are dropped **[verified · crawljam-36]**. On a project, all of them except `@keyframes` (not probed) parsed and applied mid-sheet too **[verified 2026-10-16 · live-c09 to live-c21]**. On profile and project pages, put every `@import` first; only comments, `@charset` and `@layer` statements may precede it **[verified · corpus-11, corpus-46; verified 2026-10-16 · live-c01, live-c02, live-c05]**.
- **Don't wrap overrides in `@layer`.** Layered normal declarations lose to every unlayered rule, whatever their specificity, and itch's CSS is unlayered. Only a layered `!important` beats an unlayered normal declaration **[verified · crawljam-36]**.
- **Prefer nesting under `#wrapper` to `@scope (#wrapper)`.** In Chrome 155, `@scope (#wrapper){ .x{…} }` lost to a theme-like `.user_page .x` rule, while `#wrapper{ .x{…} }` won. The scope root adds no specificity **[verified · s07-n2 T26]**.
- **`@keyframes` names are global across sheets.** Inline rules can use keyframes from an imported (even cross-origin) sheet and vice versa. With duplicate names the later one wins, and an unlayered `@keyframes` beats a layered one. Give yours a prefix such as `custom-` **[verified · localtests-22]**.

### 7.4 Support matrix

Columns give the first version with full, unprefixed, unflagged support. **Users** is the approximate share of global usage with support, from caniuse; Firefox 158 is too new to appear in that data. **Baseline** is the web-features status: *Widely* means in all core browsers for 30+ months; *Newly* means in all core browsers since the date shown. Unless a row says otherwise, the Users column comes from s07-n5. Data as of 2026-10-14 (BCD 8.1.5, web-features 3.42.0, caniuse 2026-10-13); re-fetch after 2026-10-28.

**Read the evidence column in two halves.** *Cr* is what was run in Chromium (Chrome 147/155, the flag build, Edge 155, Chromium 152). *FF/Sa* is what BCD 8.1.5 and web-features 3.42.0 say about Firefox and Safari: it is **documented, never verified**, even when the Chromium half is verified. *all* means no engine was run for that row. Retag the FF/Sa half only after a Firefox or WebKit run (§7.18, §7.19) **[verified · gapfill07-07]**.

An independent functional suite in Chromium 152, where each rule had to actually apply, confirmed the Chromium column for these features **[verified · localtests-30]**:

- `:has()` and `:nth-child(n of S)`;
- `@container` size and `style()` queries;
- `@scope` with a lower boundary;
- `color-mix()`, relative colour and `light-dark()`;
- trig in `calc()`, `sibling-index()`, `if()`, `@function` and typed `attr()`;
- `@property`, `@layer` and `@starting-style`.

`random()` was **not** supported there.

On a live project page (Brave 155 = Chromium 155), itch stored, and the browser applied, `@property`, size and style `@container` queries, `@scope`, `@layer`, `@starting-style`, `@view-transition`, `@counter-style`, `@function`, `sibling-index()`, nesting, range media and `content: "x" / ""`. A `random()` declaration was stored but not applied **[verified 2026-10-16 · live-c11 to live-c21, live-c27 to live-c30, live-c36]**. That is a save-and-apply check, not a support result: the columns below are unchanged.

#### Selectors, queries, structure

| Feature | Baseline | Chrome/Edge | Firefox | Safari/iOS | Users | Fallback / guard | Evidence: Chromium (Cr) · Firefox/Safari (FF/Sa) |
|---|---|---|---|---|---|---|---|
| `:has()` | Widely (2026-06-19) | 105 | 121 | 15.4 | 95.9 % | none needed; `@supports selector(:has(a))` for very old browsers | Cr **[verified · support-16]** · FF/Sa **[documented · support-16]** |
| Size `@container` + `cq*` units | Widely (2025-08-14) | 105 | 110 | 16 | 95.9 % | layout must work without the query | Cr **[verified · support-12]** · FF/Sa **[documented · support-12]** |
| Name-only `@container foo{}` | Newly (2026-05-07) | 148 | 149 | 26.4 | 81.7 % | always add a size condition | Cr **[verified · support-12]** · FF/Sa **[documented · support-12]** |
| `@container style(--x: v)` | Newly (2026-05-19) | 111 | 151 | 18 | 92.9 % | default look outside the query | Cr **[verified · support-10]** · FF/Sa **[documented · support-10]** |
| Style-query range `style(--n > 5)` | – | 142 | 151 | no | 70.4 % | use equality queries | all **[documented · support-11]** |
| `@container scroll-state()` | no | 133 | no | no | 71.3 % | Chromium-only polish | Cr **[verified · support-46]** · FF/Sa **[documented · support-46]** |
| CSS nesting | Widely (2026-06-11) | 120 (112–119 partial) | 117 | 17.2 (16.5–17.1 partial) | 92.9 % | flat rules for essentials | Cr **[verified · localtests-07]**; versions **[documented · crawlprofile-33, itchcss-05]** |
| `@scope … to …` | Newly (2026-03-24) | 118 (143 for `&` inside `@scope`) | 146 | 26.4 | 88.7 % | nesting under `#wrapper` | Cr **[verified · support-13]** · FF/Sa **[documented · support-13]** |
| `@layer` | Widely (2024-09-14) | 99 | 97 | 15.4 | 96.4 % | don't use for overrides (§7.3) | Cr **[verified · crawljam-36]**; versions **[documented · s07-n5]** |
| `:popover-open` / popover | Newly (2025-01-27) | 114 / 116 | 125 | 17 (iOS 18.3) | 93.6 % | attributes likely stripped (§7.11) | all **[documented · support-47]** |
| `::details-content` | Newly (2025-09-16) | 131 | 143 | 18.4 | 89.3 % | instant open/close | all **[documented · support-41]** |
| `::scroll-marker`, `::scroll-button()`, `:target-current` | no | 135 | no | no | 71.0 % | separate rules; plain scroll-snap strip | Cr **[verified · support-40]** · FF/Sa **[documented · support-40]** |
| `reading-flow` | no | 137 | no | no | 68.9 % | don't reorder content visually | Cr **[verified · support-46]** · FF/Sa **[documented · support-46]** |
| `@supports at-rule()` | no | 148 | 157 | no | 67.7 % | test a companion property | Cr **[verified · support-50]** · FF/Sa **[documented · support-50]** |

Notes:

- Safari supported `@scope` fully in 17.4–18.x, but 26.0–26.3 did not apply `@scope` rules to `input`/`textarea` **[documented · support-13]**.
- Container style queries match **custom properties only** and need no `container-type` **[verified · support-10]**.
- Style-query range syntax in Firefox: MDN says it is behind a pref, but Firefox's own source parses it unconditionally since 151, and BCD agrees with the source. No Firefox binary was run **[documented · support-11]**.

#### Motion

| Feature | Baseline | Chrome/Edge | Firefox | Safari/iOS | Users | Fallback / guard | Evidence: Chromium (Cr) · Firefox/Safari (FF/Sa) |
|---|---|---|---|---|---|---|---|
| `translate` / `rotate` / `scale` | Widely (2025-02-05) | 104 | 72 | 14.1 (iOS 14.5) | 96.3 % | – | Cr **[verified · s07-n1 T12]**; versions **[documented · support-33]** |
| `@property` (animatable typed custom properties) | Newly (2024-07-09) | 85 | 128 | 16.4 | 95.5 % | unregistered values jump, no tween | Cr **[verified · s07-n1 T9/T10]**; versions **[documented · s07-n5]** |
| `@starting-style` | Newly (2024-08-06) | 117 | 129 | 17.5 | 93.0 % | the element just appears | Cr **[verified · support-24, localtests-56]** · FF/Sa **[documented · support-24]** |
| `transition-behavior: allow-discrete` | Newly (2024-08-06) | 117 | 129 | 17.4 | 93.1 % | – | all **[documented · support-24]** |
| Transitioning `display` itself | not Baseline | 117 | no | 18 | – | instant toggle | all **[documented · support-24]** |
| `interpolate-size` / `calc-size()` | no | 129 | no | no | 71.7 % | snaps open | Cr **[verified · support-25]** · FF/Sa **[documented · support-25]** |
| Scroll-driven animations | no | 115 | **159** (2026-10-27) | 26 | 87.8 % | base = final state + `@supports` | Cr **[verified · s07-n1 T15]**; versions **[documented · support-19]** · re-verify after 2026-10-27 |
| Cross-document `@view-transition` | no | 126 | no | 18.2 | 87.8 % | plain navigation | Cr **[verified · support-21]** · FF/Sa **[documented · support-21]** |
| Same-document view transitions | Newly (2025-10-14) | 111 | 144 | 18 | – | need JS, so useless on itch | all **[documented · support-22]** |
| `view-transition-name: match-element` | – | 137 | 144 | 18.4 | 86.8 % | same-document only | all **[documented · support-22]** |
| `view-transition-name: auto` | – | no | – | 18.2 | – | avoid | all **[documented · support-22]** |
| `sibling-index()` / `sibling-count()` | Newly (2026-08-18) | 138 | 154 | 26.2 | 83.9 % | constant declaration first | Cr **[verified · support-26]** · FF/Sa **[documented · support-26]** |

#### Values and functions

| Feature | Baseline | Chrome/Edge | Firefox | Safari/iOS | Users | Fallback / guard | Evidence: Chromium (Cr) · Firefox/Safari (FF/Sa) |
|---|---|---|---|---|---|---|---|
| `sin()`/`cos()` and other trig | Widely (2025-09-13) | 111 | 108 | 15.4 | 95.1 % | – | Cr **[verified · support-18]** · FF/Sa **[documented · support-18]** |
| `round()`/`mod()`/`rem()` · `abs()`/`sign()` · `progress()` | Newly (2024-05-17) · Newly (2025-06-26) · Newly (2026-09-01) | | | | | – | all **[documented · support-18]** |
| Typed arithmetic `calc(10px*(40px/10px))` = 40px | – | 140 | 158 | 26 | 82.0 % (before Firefox 158) | precompute | Cr **[verified · support-48]** · FF/Sa **[documented · support-48]** |
| `color-mix()` | Widely (2025-11-09) | 111 | 113 | 16.2 | 94.8 % | plain colour first | Cr **[verified · localtests-30]**; versions **[documented · s07-n5]** |
| Relative colour `rgb(from …)` | Newly (2024-09-16) | 122 (125 for `hsl`/`hwb`) | 128 | 18 | 90.5 % | plain colour first | Cr **[verified · localtests-30]**; versions **[documented · s07-n5]** |
| `light-dark()` | Newly (2024-05-13) | 123 | 120 | 17.5 | 91.3 % | needs `color-scheme`, which itch's page CSS doesn't set (§7.10) | Cr **[verified · s07-n2 T27]**; versions **[documented · s07-n5]** |
| `content: "x" / "alt"` | Newly (2024-07-09) | 77 | 128 | 17.4 | 94.9 % | plain `content` line first | Cr **[verified · a11y-10]** · FF/Sa **[documented · a11y-10]** |
| Typed `attr(data-x type(<length>))` | no | 133 | 155 | Technology Preview only | 73.0 % | unusable with user HTML: `data-*` is stripped | Cr **[verified · support-38]** · FF/Sa **[documented · support-38]**; `data-*` stripped **[observed · s07-n7]** |
| `if()` | no | 137 | no | no | 68.9 % | plain declaration first | Cr **[verified · support-09]** · FF/Sa **[documented · support-09]** |
| `@function` | no | 139 | no | Technology Preview | 68.7 % | don't use | Cr **[verified · support-39]** · FF/Sa **[documented · support-39]** |
| `random()` | no | **156** (2026-10-20) | Nightly only | 26.2 | 13.1 % | constant first, or `@supports` | Cr **[verified · support-03]** · FF/Sa **[documented · support-03, repo-15]** · re-verify after 2026-10-20 |
| `random-item()` | – | no | no | flag off in 27 | 0 | don't use | all **[documented · support-05]** |
| `@custom-media`, `@mixin`/`@apply` | no | no | pref off | no | 0 | write the query out | Cr **[verified · support-49]** · FF/Sa **[documented · support-49]** |

#### Visual

| Feature | Baseline | Chrome/Edge | Firefox | Safari/iOS | Users | Fallback / guard | Evidence: Chromium (Cr) · Firefox/Safari (FF/Sa) |
|---|---|---|---|---|---|---|---|
| `backdrop-filter` | Newly (2024-09-16) | 76 | 103 | 18 (9–17 need `-webkit-`) | 94.9 % | a readable translucent background | Cr **[verified · support-31, a11y-42, localtests-47]** · FF/Sa **[documented · support-31]** |
| `overflow: clip` | Widely (2025-03-12) | 90 | 81 | 16 | 96.2 % | – | Cr **[verified · localtests-29]**; versions **[documented · s07-n5]** |
| `text-wrap: balance` | Newly (2024-05-13; Widely on 2026-11-13) | 114 | 121 | 17.5 | 93.6 % | normal wrapping | Cr **[verified · support-27]** · FF/Sa **[documented · support-27]** · Widely on 2026-11-13 |
| `text-wrap: pretty` | no | 117 | no | 26 | 87.6 % | normal wrapping | Cr **[verified · support-27]** · FF/Sa **[documented · support-27]** |
| `shape()` in `clip-path` | Newly (2026-02-24) | 135 | 148 | 18.4 | 88.8 % | `polygon()` first | all **[documented · support-43]** |
| `corner-shape` | no | 139 | Nightly | Technology Preview | 68.7 % | plain `border-radius` | Cr **[verified · support-44]** · FF/Sa **[documented · support-44]** |
| `text-box` (trim/edge) | no¹ | 133 | 154 | 18.2 | 89.3 % | normal half-leading | all **[documented · support-45]** |
| `field-sizing: content` | Newly (2026-06-16) | 123 | 152 | 26.2 | 87.2 % | fixed-size textarea | all **[documented · support-42]** |
| Anchor positioning (core) | no² | 125 | 147 | 26 | 87.3 % | `@supports (anchor-name: --a)` | Cr **[verified · support-23]** · FF/Sa **[documented · support-23]** |

¹ BCD lists `text-box` for Firefox 154, but its `<text-edge>` data says "parsing only", and that keeps web-features from marking it Baseline. BCD is internally inconsistent here **[documented · support-45]**.
² All three engines support the core. web-features withholds Baseline only because the newer `position-visibility: anchor-valid/anchor-visible` keywords are missing in Chrome and Firefox. The initial value of `position-anchor` changed to `normal` in Chrome 151, Firefox 151 and Safari 27, so always set it explicitly **[verified · support-23]**.

#### User-preference media features and focus

| Feature | Chrome | Firefox | Safari | Evidence |
|---|---|---|---|---|
| `prefers-reduced-motion` | 74 | 63 | 10.1 | **[documented · a11y-30]** |
| `prefers-contrast` | 96 | 101 | 14.1 | **[documented · a11y-30]** |
| `prefers-reduced-transparency` | 118 | flag only | no | **[documented · a11y-51]** |
| `@media (forced-colors)` / `forced-color-adjust` | 89 / 89 | 89 / 113 | 16 / no | **[documented · a11y-30]** |
| `:focus-visible` | 86 | 85 | 15.4 | **[documented · a11y-44]** |
| `outline` follows `border-radius` | 94 | 88 | 16.4 | **[documented · a11y-44]** |
| `@media (hover)` | 38 (41 reliable) | 64 | 9 | **[documented · s07-n8]** |

### 7.5 Motion: animations and transitions

#### Reduced motion (always include)

This block stopped all 23 running animations on a real profile, 20 of them infinite, and cut the card transition to 0.01 ms **[verified · a11y-23]**:

```css
@media (prefers-reduced-motion:reduce){
  #wrapper,#wrapper *,#wrapper *::before,#wrapper *::after,
  #wrapper::before,#wrapper::after{
    animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}
  #wrapper .game_cell:hover{transform:none;translate:none} /* an instant jump is still motion */
}
```

- `#wrapper *` does **not** match `#wrapper` itself or `#wrapper::before`/`::after`, so list them explicitly. With only `#wrapper *,#wrapper *::before`, one infinite twinkle on `#wrapper::after` kept running **[verified · a11y-23]**.
- A sheet that adds animated layers should carry its own reduced-motion rule for them. The owner's per-visit sheet does: it stops `#wrapper::after` and `.user_page::before` itself **[observed · s07-n4]**.

#### Entrance effects

- **Keyframes that animate *from* hidden.** The live owner profile uses `@keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}` with `animation:rise .7s both` on the header and bio. Under reduced motion the bio computes `opacity:1` **[verified · a11y-24]**. Anti-pattern: `.x{opacity:0;animation:fadein forwards}`, because killing the animation leaves it invisible.
- **`@starting-style` (no keyframes).** A transition runs the first time an element gets styles **[verified · support-24]**:
  - It also runs for elements already in the server HTML on first render, which is what itch pages are **[verified · support-54]**.
  - It works nested inside a style rule: 1 running transition and opacity 0 at the first style read, against 0 transitions for the control **[verified · s07-n2 T25]**.
  - Without support, the element simply appears in its final state **[verified · localtests-56]**.
  - First-render behaviour in Firefox (129+) and Safari (17.5+) is untested.

```css
#wrapper .game_cell{transition:opacity .4s,translate .4s;
  @starting-style{opacity:0;translate:0 12px}}
```

- **Don't put entrance keyframes on an element that also has hover effects.** On the owner's profile, `animation:rise` on `.game_cell` re-triggered the fade-in when the pointer left a card, so it was removed; the card keeps only its hover transition (cause not investigated) **[observed · s07-n12]**.
- **Staggering without one rule per child:** `animation-delay:.2s;animation-delay:calc(sibling-index()*60ms)` gave 0.06 s / 0.12 s / 0.18 s for children 1–3 **[verified · s07-n1 T13, support-26]**. `sibling-index()` counts **element** siblings only; text nodes between them don't shift it **[verified · support-60]**.

#### Idle animations: finite by default

> **Stance (read before animating anything that loops).** WCAG 2.2.2 *Pause, Stop, Hide* (Level A) covers motion that starts automatically, lasts more than 5 s and runs next to other content: it needs a pause, stop or hide control. itch runs no JS, so the page can't offer one, and a `prefers-reduced-motion` guard is **not** a sufficient technique for 2.2.2 (C39 maps only to 2.3.3) **[documented · a11y-25, s10-08]**. See 02 §2.7 (P8), 09 #113 and 10 §5.3.
> - **Default: finite.** Keep each animation's delay + duration × iterations ≤ 5 s, and make it end at the element's resting state.
> - **Replay on request.** Run it again, or loop it, only while the visitor hovers or focuses (`:hover`, `:focus-within`). Motion the visitor starts and stops is user-initiated, so 2.2.2's "starts automatically" doesn't apply; 2.3.3 (AAA) still does, and the reduced-motion block covers it **[inferred · a11y-25]**.
> - **Infinite loops only as a trade-off the user explicitly accepts** (the owner's live profile is such a case), and always with the six-selector reduced-motion block above.

**Finite recipes** for the wave and the twinkle (`--i` comes from the index pattern below; the one-cycle breath is further down). All three were checked together in Chrome 155 through the Web Animations API **[verified · gapfill07-04]**:

```css
@keyframes custom-wave{25%{translate:0 -.13em;rotate:-4deg}75%{translate:0 .13em;rotate:4deg}}
@keyframes custom-wave-h{25%{translate:0 -.13em;rotate:-4deg}75%{translate:0 .13em;rotate:4deg}}
#wrapper .custom-title span{display:inline-block;animation:custom-wave 1.6s ease-in-out calc(var(--i)*.1s) 2}
#wrapper .custom-title:hover span{animation-name:custom-wave-h;animation-iteration-count:infinite}
@keyframes custom-tw{50%{opacity:.4}}
#wrapper::after{animation:custom-tw 1.2s ease-in-out 4}      /* star layer: 4.8 s, then still */
```

- **Results.** Every animation ended between 3.2 s (first letter) and 4.8 s (twinkle). Seeked to 5 s, all 10 animations reported `playState:'finished'`; after a real 5.5 s wait none was left running. At rest the letters computed `translate:none;rotate:none` and the layer `opacity:1`. The infinite version still had 10 of 10 running at 5.5 s and after the 5 s seek, with the letters mid-wave **[verified · gapfill07-04]**.
- **Hover replay.** Hovering the title started 8 infinite `custom-wave-h` animations. Moving away restarted `custom-wave`: it played its 2 iterations once more (≤3.9 s) and stopped **[verified · gapfill07-04]**.
- **Why the keyframes have no `from`/`to`:** omitted 0 %/100 % keyframes use the element's own value, so the motion starts and ends at rest. An `alternate` animation with an even iteration count ends on its `from` value and then snaps to the base value **[inferred]**.
- **Why a second keyframes name:** changing `animation-name` creates a new animation that starts from 0, as the hover test shows. Changing only the iteration count would keep the old timeline **[inferred]**.
- **Use small positive delays** in a finite run, so each letter waits at rest for its turn. The negative delays of an endless wave (`calc(var(--i)*.4s - 3.2s)`) would skip part of a finite run.
- **Under emulated `prefers-reduced-motion:reduce`,** both versions had 0 animations with the six-selector block **[verified · gapfill07-04]**.

**Building blocks** (apply to finite and infinite motion alike):

- **Animate one transform part at a time.** `translate`, `rotate` and `scale` compose with `transform` in the order translate → rotate → scale → transform **[documented · support-33]**. A hover lift on `translate` therefore doesn't clobber an idle `rotate`: `transform:translateX(10px);translate:5px 0` moved the box 15px **[verified · s07-n1 T12]**.
- **Per-letter offsets** (a title widget in the bio, one `<span>` per letter under a `custom-` class). The owner's live title, an accepted infinite loop, runs two `alternate ease-in-out` keyframes, `wy` on `translate` (±.13em) and `wr` on `rotate` (±7°), 1.6 s each. Each letter is offset by `--i` with a negative delay, so every letter is mid-wave from the first frame **[verified · repo-44]**. The index pattern is the same for both forms:

```css
#wrapper .custom-title span{display:inline-block;--i:0}
#wrapper .custom-title span:nth-child(2){--i:1} /* …one rule per letter… */
@supports (width:calc(sibling-index()*1px)){
  #wrapper .custom-title span:nth-child(n){--i:calc(sibling-index() - 1)}}
/* endless form, only if the user accepts it (keyframes custom-wy: from{translate:0 -.13em} to{translate:0 .13em}):
   animation:custom-wy 1.6s ease-in-out infinite alternate;animation-delay:calc(var(--i)*.4s - 3.2s) */
```

  Notes on this pattern:
  - `display:inline-block` is required: `translate` moved an inline span 0px and an inline-block span 20px **[verified · s07-n2 T29]**.
  - The `:nth-child(n)` in the `@supports` rule is what lets it replace the per-letter rules. Without it, the override loses to them **[verified · localtests-31, s07-n2 T23/T24]**.
  - Dropping the per-letter fallback saves characters, but ~16 % of users then get a flat word **[documented · support-26]**.
  - `--i:sibling-index()` in an *unregistered* property is evaluated where `var()` is read, so a child reading it gets its own index. Register it (`@property --i{syntax:'<integer>';inherits:true;initial-value:0}`) if children must inherit the parent's index; reading it on the span itself, as here, is fine **[verified · localtests-31, s07-n2 T30]**.
- **Accessibility cost of letter spans.** Chrome names an inline-block letter heading letter by letter ("M i r o k s h i") **[verified · repo-44]**. `aria-label` is no fix, because itch strips `aria-*` from user HTML **[observed · s07-n7; verified 2026-10-16 · live-a03, live-a20]**. What works in Chrome 155 **[verified · a11y-13]**:
  - put the real word in a visually hidden `<span class="custom-sr">Word</span>`;
  - draw the letters from empty spans with `::before{content:"W";content:"W" / ""}`.

  Engines without alt-text syntax (Firefox < 128, Safari < 17.4) use the fallback line and read the word twice. itch keeps empty spans inside an `h1`: a project description kept an sr-only span and two empty `custom-l` spans **[verified 2026-10-16 · live-t23]**; bios are untested.
- **Keep a split title on one line on phones.** Size it with `font-size:min(10vw,6rem)` and `white-space:nowrap`. `white-space:normal` also stops the overflow but breaks the name between letters ("Mir / oksh / i" at 320px) **[verified · a11y-56]**.
- **Breathing weight with `@property`: avoid it, or play one cycle.** Register an angle, animate it on the parent, and derive each child's weight with `sin()`:

```css
@property --custom-breath{syntax:"<angle>";inherits:true;initial-value:0deg}
@keyframes custom-breath{to{--custom-breath:360deg}}
#wrapper .custom-title{animation:custom-breath 4s linear 1}  /* one cycle; ends where it began */
#wrapper .custom-title span{font-weight:calc(550 + 150*sin(var(--custom-breath) + 40deg))}
```

  - *Mechanics.* A registered `<angle>` interpolates: 180deg at 50 %. An unregistered custom property animates discretely: still `0deg` at 25 %. `sin(var(--angle))` resolves inside `calc()`: 150px for 90deg **[verified · s07-n1 T9–T11]**. Trig functions are Widely available **[documented · support-18]**. One 360° cycle ends seamlessly: the property returns to `0deg`, and `sin()` is periodic, so the weight at rest equals the weight at the start **[verified · gapfill07-04]**. The owner's per-visit sheet ships this pattern live and endless, with a random phase per letter **[observed · s07-n4]**.
  - ⚠ **It needs a variable font loaded with a `wght` range.** The theme editor's font picker loads only 400 and 700 (CSS API v1, 04 §7). With only that link, Syne snapped from the 400 face (requested 400–500) to the 700 face (550–800), so the "breath" became a two-step flip. Importing `css2?family=Syne:wght@400..800` made every weight render its own instance: Medium at 450–500, SemiBold at 550–600, Bold at 650–700, ExtraBold at 800. When the theme link and the import declare the same family, the theme's static face wins at exactly 400 and 700, and the variable face at every other weight. Their metrics were identical, so nothing jumps, but both files download **[verified · gapfill07-05]**. Rule: `@import` the `wght` range of any family whose weight you animate or set to values other than 400/700.
  - ⚠ **It is the most expensive effect measured.** Animating `font-weight` re-lays out text every frame. On a decorated profile with 4× CPU throttling it took about 0.9 s of layout per second, and the page fell to 8–21 fps. With the breath off, or with the property animating but `font-weight` fixed, the page held 60 fps (§7.17) **[verified · gapfill07-06]**. Prefer `transform`/`opacity` motion; if you keep the breath, keep it finite.
- **Twinkling full-screen layers:** animate only the **opacity** of the layer, never an SVG inside it. An animated SVG re-rasterizes full-screen every frame **[verified · repo-46]**. Two opacity-animated fixed layers held 60 fps under 4× throttling (§7.17) **[verified · gapfill07-06]**.

#### Expanding to `height:auto`

`interpolate-size: allow-keywords` makes `height:0 → auto` transitions run; without it no transition runs at all. Put it on `#wrapper`, since it inherits. Chromium 129+ only **[verified (Chromium) · support-25]**; other browsers snap open, which is an acceptable fallback **[documented · support-25]**. Combined with `::details-content` and `transition: block-size .3s, content-visibility .3s allow-discrete`, it animates `<details>` open and closed (Chromium); Safari can't chain pseudo-elements after `::details-content` **[documented · support-41]**.

### 7.6 Hover and focus states

- **Card lift:** use a transition, not keyframes, so a pointer that only brushes the card reverses smoothly. The owner's live profile uses `transition:transform .35s cubic-bezier(.34,1.56,.64,1)`, an overshooting curve that gives a small bounce **[observed · s07-n12]**.
- **Dim the other cards with `:has()`.** This rule fires only while a card is actually hovered. A grid-level `:hover` would also fire while the pointer sits in a gap **[observed · repo-49]**. `:has()` reaches ~96 % of users **[documented · support-16]**.

```css
#wrapper .game_grid_widget:has(.game_cell:hover) .game_cell:not(:hover){opacity:.7}
```

- **Touch devices keep `:hover` after a tap.** Under touch emulation `(hover:none)` is true, and after one tap on a card `.game_cell:hover` stays true with its hover transform applied **[verified · s07-n8]**. Put hover-only motion inside `@media (hover:hover)`, or force the plain state with `@media (hover:none),(prefers-reduced-motion:reduce){…}` **[observed · repo-49]**. Desktop headless Chrome matches `(hover:hover) and (pointer:fine)` **[verified · s07-n1 T19]**.
- **Mirror hover for keyboard users** with `:focus-within` and `:focus-visible`. `:focus-visible` shows rings for keyboard focus but not for mouse clicks, and outlines follow `border-radius` in every current engine **[documented · a11y-44]**.
- **Draw your own focus ring on dark themes.** itch's default focus colour `#361275` is only 1.1–1.5:1 against dark blues. Chrome's `outline:auto` adds an outer white line; other engines are untested **[verified · a11y-16]**.

```css
#wrapper a:focus-visible{outline:3px solid #ffc857;outline-offset:3px}
#wrapper .game_cell:focus-within{outline:3px solid #ffc857;outline-offset:3px}
```

  A ring on the game-title link is clipped at its top and left by itch's `.game_title{overflow:hidden}`. The `.game_cell:focus-within` ring renders whole and follows the card radius **[verified · s07-n8]**.
- **Never build focus rings or card edges from `box-shadow` alone.** Forced colours set `box-shadow` to `none`, while outlines and borders survive as system colours (§7.16) **[verified · a11y-28]**.
- **Additive badges on itch UI.** A project page can tag the developer's comments with `.game_comments_widget .avatar_container[href="https://itch.io/profile/NAME"] + .post_header > .post_author::after{content:"Developer"}`. `NAME` must be the itch **username**, not the display name. These comment classes are not on the stable list, so keep such rules purely additive **[observed · community-44]**.

### 7.7 Scroll-driven animations

Use them for reveal-on-scroll on game cards and devlog images without JS:

```css
@keyframes custom-reveal{from{opacity:0;translate:0 20px}}
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){
  #wrapper .game_cell{animation:custom-reveal linear both;
    animation-timeline:view();animation-range:entry 0% cover 30%}}}
```

- **Support (as of 2026-10-14; re-verify after 2026-10-27):** Chrome 115+ and Safari 26+ (~88 %). Firefox 158 has it only in Nightly. **Firefox 159 (2026-10-27) ships it**: bug 1324602 is fixed for 159, and the pref is `true` on the 159 beta branch **[documented · support-19]**. Re-check after that date in case the change is backed out.
- **Write `animation-timeline` and `animation-range` after the `animation` shorthand.** The shorthand resets the timeline: written before it, the timeline computed `auto`; written after it, `view()` **[verified · s07-n1 T15]**.
- Never set `opacity:0` outside the guard; the base style must be the visible end state **[documented · support-19]**.
- To limit the effect to devlog posts in a project's CSS, scope it with `#wrapper .game_devlog_post_page` **[verified · crawlproject-38]**.

### 7.8 Cross-document view transitions (profile ⇄ own projects)

A creator's profile (`https://<creator>.itch.io/`) and their projects and devlogs (`https://<creator>.itch.io/<game>`) share one origin, so navigation between them can animate. Links to other creators and to `itch.io/jam/…` are cross-origin and never animate **[inferred · support-21]**.

```css
@media (prefers-reduced-motion:no-preference){
  @view-transition{navigation:auto}
}
```

- **Both pages must opt in.** In Chrome 155 a transition fired only when both the old and the new page had the rule, so put it in the profile CSS **and** in every project's CSS. Inside the reduced-motion media query it still fires **[verified · support-21]**.
- Chrome also honours the nested form `#wrapper{@view-transition{navigation:auto}}`. Safari's handling of it is untested, so use the top-level form **[verified · support-21]**.
- **Support:** Chrome 126+ and Safari 18.2+, no Firefox. Unsupported browsers navigate normally **[documented · support-21]**.
- **Same-document transitions need `document.startViewTransition()`, which is JS, so they are useless on itch.** `match-element` names only pair elements within one document. `view-transition-name:auto` is Safari-only, and Chrome 155 rejects it **[documented · support-22]**.
- **Morphing one element across pages.** Give the same `view-transition-name:<ident>` to a cover in the profile grid and to the banner on that project page **[documented · support-22]**. Profile cards carry an itch-generated `data-game_id` attribute that can single out one card, e.g. `#wrapper .game_cell[data-game_id="123"] .game_thumb{view-transition-name:custom-g123}` **[observed · s07-n10]**. The attribute is not on the documented stable list. Two elements with the same name on one page are expected to cancel the transition **[unverified]**.
- itch keeps `@view-transition{navigation:auto}` when a project's CSS is saved **[verified 2026-10-16 · live-c19]**. Whether a real itch navigation fires a transition is an open question (§7.19). `::view-transition-*` rules weren't probed; since nothing but `</style>` changed in the saved sheet, they should survive too **[inferred · live-css]**.

### 7.9 Container queries, style queries, `:has()`, `@scope`, anchors

- **Size container queries** style cards by the width of their column rather than the viewport. That matters on itch, where the profile and project columns have fixed widths unrelated to the viewport. `container-type:inline-size` plus `@container (min-width:200px)` applied, and `10cqi` computed 30px in a 300px container **[verified · support-12]**.
- **Style queries as a theme switch.** Set one token and restyle a whole block. Every element is a style container (no `container-type` needed), and only custom properties can be queried **[verified · support-10]**. The token is inherited, so a descendant three levels below matched the query **[verified · s07-n2 T28]**:

```css
#wrapper{--custom-mode:neon}
@container style(--custom-mode: neon){
  #wrapper .game_cell{border-color:#ff4fd8}}
```

  In Safari the root element cannot be a container (WebKit bug 271040) **[documented · support-10]**. Rules inside `#wrapper` query ancestors below the root, so this shouldn't matter on itch **[inferred]**. Range syntax (`style(--n > 5)`) is Chromium and Firefox only **[documented · support-11]**.
- **`:has()` for parent-aware styling,** e.g. a bio layout that changes when it contains a `custom-` element, or reacting to a hovered card (§7.6). It is Widely available **[documented · support-16]**. 5 of 39 sampled project pages already use it, 4 of them for comment styling **[observed · crawlproject-71]**.
- **`@scope`** limits rules to a region: `@scope (.a) to (.b){p{…}}` styled the inner `p` and not the one inside `.b` **[verified · support-13]**. On itch, nesting under `#wrapper` keeps the ID specificity and `@scope` does not (§7.3).
- **CSS-only tooltips tied to a card:** anchor positioning (`anchor-name`, `position-anchor`, `anchor()`, `position-area`) inside `@supports (anchor-name: --a)`. In Chrome the positioned element landed exactly on the anchor's corner. The fallback is `position:absolute` relative to the parent **[verified · support-23]**.
- **Sticky-header polish:** `container-type: scroll-state` with `@container scroll-state(stuck: top)` is Chromium-only (133+) **[verified · support-46]**.
- **Real-world adoption:** 0 of 62 corpus pages use `@container`, `@layer`, `@scope` or `@starting-style`. These features are untapped **[verified · corpus-27]**, but they work on itch: on a draft project all four survived saving and applied in Chromium 155 **[verified 2026-10-16 · live-c11, live-c13 to live-c15, live-c18]**.

### 7.10 Generated content and text tricks

- **Generated text is announced.** In Chrome, `::before`/`::after` content becomes part of the accessible name: a link with `::after{content:" →"}` is named "Next →" **[verified · a11y-09]**. Silence decorations with alt text, keeping a plain line first for old engines **[verified · a11y-10, s07-n1 T20]**; itch stores that two-declaration form unchanged on a project **[verified 2026-10-16 · live-c27]**:

```css
#wrapper .custom-rating::before{content:"★";content:"★" / ""}        /* silent */
#wrapper .custom-rating::before{content:"★";content:"★" / "Rated "} /* spoken label */
```

  Never put essential information *only* in generated content: MDN warns that some screen reader and browser combinations don't announce it **[verified · a11y-09]**.
- **`content:var(--x)` needs a quoted string.** `--x:"Hola"` works, and `content:var(--msg) " world"` merges into one string. `attr(data-h)`, `counter()` and `counter-reset:h var(--n)` work too **[verified · localtests-25]**.
- **Escape non-ASCII in generated strings** as `\hex` followed by a space: "¡Hola!" becomes `"\a1 Hola!"`, and two spaces keep a real space. Write line breaks as `\a` and render them with `white-space:pre`. The result then doesn't depend on the charset the sheet is decoded with **[verified · repo-16]**. On a project, both `\hex` escapes and raw non-ASCII strings were stored unchanged and rendered **[verified 2026-10-16 · live-c25, live-c26]**.
- **Replace a bio marker's text without editing its HTML.** Make the `custom-` span `display:inline-grid;grid-template-columns:auto 0;color:transparent` and put the new text in its `::before`. The original text falls into the 0-width column **[verified · repo-41]**:
  - Use `color:transparent`, not `visibility:hidden`: screen readers keep reading the author's own words, and `visibility:hidden` would drop them **[verified · repo-41]**.
  - Add `#wrapper .custom-x::selection{color:transparent;background:transparent}`. Otherwise a page-wide `::selection` colour paints the hidden text when the visitor selects the sentence **[verified · a11y-48]**.
  - Keep selection legible elsewhere: `#0b1433` text on a `#ffc857` selection is 11.75:1 **[verified · a11y-48]**.
- **Rolling ticker** (greetings, titles):
  - Put every item in `::before`, separated by `\a`, with `white-space:pre`.
  - Make the host exactly one line tall (`height:1.4em;line-height:1.4`) with `overflow-y:clip`.
  - Step `translate:0 calc(-N*1.4em)` in `@keyframes`, and repeat the first item at the end so the loop restarts invisibly.
  - `text-align:right` keeps a variable-width item next to the text that follows. The window is as wide as the longest item: CJK greetings were about twice the width of short ones.

  **[verified · repo-42]**
- **Clip tall generated columns with `overflow-y:clip`, not `clip-path`.** `clip-path` only clips painting, so the tall column still counts as scrollable overflow; rotated, it caused horizontal scroll on phones in the owner's preview **[observed · s07-n12]**. A global guard also helps: `#wrapper{overflow-x:clip}` removed the horizontal scroll even with a `clip-path` roller, and it keeps `overflow-y` visible and `position:sticky` working. `overflow-x:hidden` instead turns `overflow-y` into `auto`, breaks sticky, and can create an inner scroll box **[verified · localtests-29]**.
- **Headings:** `text-wrap:balance` is safe for game titles and headings. `text-wrap:pretty` is Chromium and Safari only. Both degrade to normal wrapping. Chromium half **[verified · support-27]**; Firefox and Safari **[documented · support-27]**. `text-box:trim-both cap alphabetic` trims half-leading for optical centring in badges; it cut a 40px box to 26.48px in Chrome **[documented · support-45]**.
- **`light-dark()` follows `color-scheme`, not itch's theme.** Without `color-scheme`, `light-dark(A, B)` returns A. With `color-scheme:light dark` it follows the visitor's OS preference **[verified · s07-n2 T27]**. itch's page CSS (`user.css`, `game.css`, `jam.css`) sets no `color-scheme` **[observed · s07-n11]**. So on a dark custom theme, `light-dark()` picks the *light* value unless you set `color-scheme` on `#wrapper` yourself.

### 7.11 CSS-only interactivity from HTML that survives the sanitizer

The bio and description sanitizer removes `id`, `data-*`, `aria-*`, `role` and `on*` attributes, and keeps only class tokens that start with `custom`, plus itch's `text-center`, `text-justify`, `text-right` and `spoiler` (and `language-css` on `<code>`). `details`/`summary` survive, but every tag itch adds to the library allowlist (`details`, `summary`, `figure`, `font`…) was seen with **no attributes at all**, `class` included **[observed · s07-n7]**. A project description confirmed all of this, and showed `tabindex` kept on `.spoiler` only **[verified 2026-10-16 · live-a01 to live-a06, live-a11, live-k01 to live-k34, live-t03, live-t08 to live-t10]**. That decides which no-JS widgets are possible:

| Widget | Works on itch? | How |
|---|---|---|
| Accordion / "read more" | **Yes** | `<div class="custom-faq"><details><summary>Q</summary>A</details></div>`, styled through the wrapper (`#wrapper .custom-faq details[open] summary`). Don't rely on a class on `details` itself: none was ever seen there **[inferred · s07-n7]**, and on a project description it was dropped **[verified 2026-10-16 · live-t08]**. The `open` attribute is stripped, so all start closed; `name` is stripped too, so they are never exclusive **[observed · s07-n7; verified 2026-10-16 · live-t08]**. Animate with `::details-content` plus `interpolate-size` (Chromium) **[documented · support-41]** |
| In-page table of contents | **Yes** | Target an empty `<a name="x"></a>`. The href must be the **full page URL** + `#x`, because relative `#x` hrefs are removed **[verified 2026-10-16 · live-l03, live-l10]**. Same-page absolute links get no `nofollow` and no "External link" badge **[observed · sanitizer-42]** |
| Tabs / show-on-click panels | **Yes, with caveats** | `#wrapper a[name]:target + .custom-panel{display:block}`. Loading a local page with `#custom-tab2` made `a[name="custom-tab2"]` match `:target` once the fragment was processed, and the sibling panel computed `display:block` **[verified · s07-n3]**. On a live project description an `<a name>` matched `:target` once the hash was set **[verified 2026-10-16 · live-l10]**; click navigation was not tested. The browser scrolls to the anchor and adds a history entry |
| Declarative popover (`popover`/`popovertarget`) | **No** | Works without script in Chrome **[documented · support-47]**, but on a project description `popover` and `popovertarget` were dropped and a `<button>` was escaped as visible text **[verified 2026-10-16 · live-a12 to live-a14]** |
| Sizes driven by `attr()` from `data-*` | **No** | `data-*` is stripped **[observed · s07-n7; verified 2026-10-16 · live-a02]**. Typed `attr()` itself works in Chrome 133+ **[verified · support-38]** and Firefox 155+ **[documented · support-38]** |
| Per-element values via inline `style="--i:3"` | **No** | Inline `style` is filtered to a 27-property whitelist with no custom properties. In the library model `style="--i: 1"` comes out as `""` **[inferred · s07-n7]**, and on a project description `--i:3` was removed **[verified 2026-10-16 · live-s11, live-s12]** |
| Auto-growing comment box (`field-sizing:content`) | Logged-in visitors only | `#wrapper textarea{field-sizing:content;min-height:4lh;max-height:20lh}`. Logged-out project pages render no `<textarea>`, so test it logged in **[documented · support-42]** |

### 7.12 SVG data URIs and images

- **Encode every `#` as `%23`.** A raw `#` starts a URL fragment, the SVG is truncated, and **nothing paints, with no error**. This was tested both as `<img>` and directly as a CSS `background-image` **[verified · localtests-44, repo-17]**.
- A compact, safe encoder is `svg.replace(/[<>#%"]/g, encodeURIComponent)`, with **single-quoted** attributes inside `url("data:image/svg+xml,…")`. Raw `<` and `>` also rendered in Chrome; only `#` is strictly required **[verified · repo-17]**.
- Percent-encoding is smaller than Base64, which adds about 33 % **[verified · repo-17]**. In the corpus there are 17 data URIs on 9 pages (15 SVG, 2 PNG), 146–2,098 bytes each. Most are percent-encoded or Base64; one jam pastes raw `<svg>` markup, which also survives (a raw `<svg …/>` data URL saved on a project was stored and applied **[verified 2026-10-16 · live-c31]**). None are on profiles, where the cap makes them expensive; prefer a hosted file there **[observed · corpus-26]**.
- **Images:** creators mostly reuse files already uploaded to itch (`img.itch.zone`, 11 pages) or GitHub files through jsDelivr (11 pages). Every external URL in the corpus is HTTPS **[observed · corpus-25]**.
- Forced colours drop gradient `background-image`s but keep `url()` images (§7.16) **[verified · a11y-26]**. That data-URI images count as `url()` here is **[inferred]**.

### 7.13 Layers, stacking and layout building blocks

- **Make `#wrapper` a stacking context:** `#wrapper{position:relative;isolation:isolate}`.
  - A `position:fixed;inset:0;z-index:-1` layer (`#wrapper::before`, or a child) is visible above `#wrapper`'s own background (itch's panel image) only when `#wrapper` is a stacking context. With plain `position:relative` it paints **behind** the background **[verified · localtests-39]**.
  - Isolation also keeps high custom `z-index` values below itch's UI outside `#wrapper`. Without it, a fixed z-index 5000 layer covered the Follow button on both grid and column profiles **[verified · itchcss-29]**.
- **Decorative full-screen layers:** `#wrapper::before`, `#wrapper::after` and `.user_page::before`, each with `position:fixed;inset:0;z-index:-1;pointer-events:none`. A `background` shorthand on a *pseudo-element* doesn't touch the theme image on `#wrapper` **[verified · repo-46]**.
- **Viewport-fixed backdrop on iOS.** iOS Safari ignores `background-attachment:fixed`, which some theme panels emit, so the panel image scrolls with the page there. A fixed pseudo-element layer is the portable way to pin a backdrop **[documented · a11y-43]**.
- **Sticky inside project pages.** `#inner_column` has `overflow:hidden`, which kills `position:sticky`. `#wrapper #inner_column{overflow:clip}` keeps the clipping and makes sticky work **[verified · itchcss-36]**.
- **Frosted-glass cards:** a semi-transparent background plus `-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)` **[documented · repo-47]**.
  - Write both forms, with literal values. Chromium rejects the prefixed name **[verified · support-31, a11y-42, localtests-47]**, and Safari 9–17 need it **[documented · support-31]**.
  - Avoid `var()` inside the value: WebKit bug 297620 reports `backdrop-filter` ignored when it references a variable (Safari 18.x and 26.1 on macOS Sonoma) **[documented · support-31]**. Not reproduced: no WebKit engine was run **[verified · gapfill07-07]**.
  - `backdrop-filter` also makes the card the containing block of `position:fixed` descendants **[verified · localtests-47]**.
  - Choose an alpha that passes contrast **without** the blur. Over a highlight of the theme image, `#eef3ff` text measured 4.52:1 bare and 9.17:1 on an `rgba(10,18,46,.5)` card **[verified · a11y-41]**.
  - Cost: frosted cards roughly doubled compositor GPU time while scrolling, without dropping frames in a GPU-composited test (§7.17) **[verified · gapfill07-06]**. Blur small elements such as cards; a blurred full-screen layer would re-blur the whole viewport whenever anything behind it moves **[inferred]**.
  - Offer an opaque variant under `@media (prefers-reduced-transparency:reduce),(prefers-contrast:more)`. Only the `prefers-contrast` branch reaches Firefox and Safari. Chromium half **[verified · a11y-51]**; Firefox and Safari **[documented · a11y-51]**.
- **Game grids: itch's JS re-sizes them after your CSS.** On profiles and jam overviews, itch's script appends one `<style itchio-grid-sizer>` per grid to `<head>`, **after** the custom CSS, and rewrites it on every resize. Each one declares, on the grid element itself, `--itchio_grid_gap`, `--itchio_grid_cell_width`, `--itchio_grid_cell_columns` and `grid-template-columns:repeat(N, Wpx)`, with **fixed pixel tracks**. Rendered live, logged out, with itch's JS running, in Chrome 155 on 2026-10-14 **[verified · gapfill07-01, gapfill07-02, gapfill07-03]**:

  | Page | Sizer selector (specificity) | Gap it sets | Columns it set (viewport → N × track) |
  |---|---|---|---|
  | Profile, Grid layout: own games | `.mode_grid .user_game_grid` (0,2,0) | 20px; 10px when the window is under 500px | 1400 → 3×306 · 700 → 3×206 · 420 → 2×185 · 360 → 2×155 · 320 → 2×135. Never fewer than 2 |
  | Profile: collections and purchases | `.game_grid_widget.game_list` (0,2,0) | same | these rows are `display:flex` carousels, so only the gap takes effect |
  | Profile, Column layout: own games | the `.mode_grid` rule is emitted but doesn't match | none (user.css: 10px column, 25px row) | user.css only: one 315px column beside the content at 1400; a `display:flex;overflow-x:auto` strip of 315px cards at 700 and 420 |
  | Jam overview entries | `#game_grid_0` (1,0,0) | 10px | 1400 → 5×261 · 700 → 3×213 · 420 → 2×185 · 320 → 1×280 |

  What follows for your CSS, all measured on those pages:

  - **`#wrapper{--itchio_grid_gap:…}` does nothing on a sized grid.** The sizer's own declaration on the grid element shadows the inherited value: 20px stayed 20px on a Grid profile, and 10px stayed 10px on a jam. It changed only the unsized Column-layout grid (10 → 40px) **[verified · gapfill07-01, gapfill07-02, gapfill07-03]**. Tests that reported it working ran in harnesses that strip itch's `<script>` (itchcss-24, crawljam-45), so the sizer never ran.
  - **A gap change alone overflows.** `#wrapper .user_game_grid{--itchio_grid_gap:40px}` or `{column-gap:40px}` applies, but the sizer's pixel tracks don't shrink: at 1400px the grid's `scrollWidth` became 998 in a 960px box. On the jam, `#wrapper .browse_game_grid{column-gap:40px}` gave 1485 in 1385 **[verified · gapfill07-01, gapfill07-03]**.
  - **Change columns and gap together, with `fr` tracks, at ID strength,** and guard profile rules with `.mode_grid`. The row gap stays 25px from user.css unless you set `row-gap` **[verified · gapfill07-01, gapfill07-03]**:

    ```css
    #wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));column-gap:40px}
    #wrapper .browse_game_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));column-gap:40px} /* jam CSS */
    ```

    Profile result: 4×210px at 1400, 2×310px at 700, 1×380px at 420, with no overflow. Jam result: 5×237px, 2×310px and 1×380px. `#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(3,1fr)}` also beat the sizer, but it kept 3 columns of 120px at 420.
  - **Phones get 2 profile columns unless you say otherwise.** The sizer keeps at least 2 columns down to 320px (135px cards). A one-column phone layout needs your own rule: `@media (max-width:500px){#wrapper .mode_grid .user_game_grid{grid-template-columns:1fr}}` gave 1×380px at 420 and 1×280px at 320, and changed nothing at 700 or 1400. Jam overviews drop to 1 column at 320px by themselves **[verified · gapfill07-01, gapfill07-03]**.
  - **Never leave out the `.mode_grid` guard on profiles.** On a Column-layout profile **[verified · gapfill07-02]**:
    - the unguarded `#wrapper .user_game_grid{grid-template-columns:repeat(3,1fr)}` built three 315px tracks inside the 315px column at 1400 (`scrollWidth` 965 vs 315), so cards spill over the main content;
    - the unguarded auto-fill recipe turned the 700px horizontal strip into a 3×209px grid;
    - the guarded versions left the Column layout untouched at 1400, 700 and 420.
    
    To restyle the Column layout on purpose, target `#wrapper .mode_column .user_game_grid` and keep its single column, or its strip, in mind. `.user_page` carried `mode_column` on that profile, but no rule through it was tested **[inferred · gapfill07-02]**.
  - Equal-height cards: `grid-auto-rows:1fr;align-items:stretch` + `.game_cell{width:auto!important;min-width:0;display:flex;flex-direction:column}` + `.game_cell_data{flex:1 0 auto}` **[verified · repo-33]**.
  - Covers: keep `aspect-ratio:315/250` and `object-fit:cover` when restyling thumbs, so lazy covers and no-cover placeholders line up **[verified · crawlprofile-56]**.
- **One project CSS, many pages:** scope per page type with `#wrapper .view_game_page`, `.game_devlog_post_page`, `.game_devlog_page` and `.game_comments_page` **[verified · crawlproject-38]**. Creators most often restyle the header, screenshots, `inner_column`, buttons, the buy row, the description and comments, so write examples for those first **[observed · crawlproject-49]**.
- **Small Chromium-only polish that degrades cleanly:**
  - `border-radius:18px;corner-shape:squircle` looks rounded everywhere and squircled in Chromium **[verified · support-44]**;
  - `clip-path:shape(…)` for wavy edges, with a `polygon()` declaration first **[documented · support-43]**;
  - `text-box` and `text-wrap` (§7.10).
- **Carousels:** build a normal `overflow-x:auto` + `scroll-snap` strip, then add `::scroll-marker` and `::scroll-button()` (Chromium 135+) in **separate** rules **[verified · support-40]**.

### 7.14 Per-visit randomness

itch runs no JS, so "different on every visit" has two routes: native CSS `random()`, rolled by the browser, or an external stylesheet regenerated by a server on every request.

#### Native `random()`: Safari today, Chrome from 2026-10-20

- **Support (as of 2026-10-14; re-verify after 2026-10-20):** Safari/iOS 26.2+ (~13 % of users), Chrome 156 (stable 2026-10-20), Firefox Nightly only **[documented · support-03, repo-15]**. Chrome 155 rejects it and the flag build accepts it **[verified · support-03]**. A `random()` declaration saved on a project was stored unchanged and not applied in Brave 155 (Chromium 155) **[verified 2026-10-16 · live-c28]**. Once Chrome 156 ships, a guarded `random()` in the pasted CSS covers Chromium and Safari; Firefox and older browsers still get the constant **[documented · repo-15]**.
- **Semantics,** tested in the Chrome 155 flag build, which has the Chrome 156 implementation:
  - A value is rolled **once per element and property** when style is first computed, and it does **not** re-roll on later restyles **[verified · support-04]**.
  - Unnamed `random()` calls are independent per element and per property **[verified · support-56]**.
  - A dashed name, `random(--k, a, b)`, shares one value everywhere, across properties too: `width` and `height` with the same `--k` gave a square **[verified · support-56]**.
  - `random(--k element-scoped, a, b)` gives a different value per element **[verified · support-56]**.
  - The step is a plain third argument, `random(0, 100, 2)`. The old `by 10px` syntax and the `element-shared` keyword are rejected **[verified · support-04]**.
- **Safari 26.2–26.4 scoped named values per element; 26.5 made them global.** Prefer unnamed `random()` when the result must match across engines **[documented · support-04]**.
- **Picking one of N** (a greeting, an image tile): `random-item()` is in no stable browser **[documented · support-05]**. Compute a number instead. `translate:0 calc(random(0, 26, 1) * -1.4em)` picked a line of a roller (`-70px` = 5 lines in one flag-build run) and fell back to `0` in Chrome 155 **[verified · s07-n1 T21]**.

```css
#wrapper .game_cell{rotate:0deg}                    /* every browser */
@supports (rotate: random(0deg, 1deg)){
  #wrapper .game_cell{rotate:random(-2deg, 2deg)}   /* a different tilt per card */
  #wrapper .custom-star{animation-delay:random(-3s, 0s)} /* desync identical loops */
}
```

In Chrome 155 the guard is false and the constant applies. In the flag build, three elements got three different negative delays **[verified · s07-n1 T5, T6, T22]**. **Never** write `--r:random(…)` and use `var(--r)` as a "fallback": it computes to `auto` **[verified · s07-n1 T4]**. Whether `random()` re-rolls on every page load of a real itch page is untested: the 2026-10-16 project run couldn't check it, because Chromium 155 has no `random()` (live-c28) (§7.19).

#### External per-visit stylesheet (every visitor today, except on jam pages)

A small server returns new CSS on every request, imported at the top of the pasted CSS. The owner's service has done this live since 2026-10-12. Its randomized parts, all plain CSS, are:

- per-letter fonts (via `:nth-child`);
- the phase of a breathing weight;
- the order of a 27-greeting roller;
- a star field drawn from generated SVG data URIs.

**[verified · repo-41, repo-42, repo-46; observed · s07-n4]**. Three requests today returned `200`, `text/css; charset=utf-8` and `Cache-Control: no-store`, with three different bodies of about 14.8 KB and no non-ASCII bytes **[verified · s07-n4]**. Section 08 §10 covers headers, latency, regions and caching in depth.

```css
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");
@import url("https://your-service.example/live.css");   /* no-store, text/css, fast */
/* …pasted rules: the page must look complete if either line above fails… */
```

Design rules:

1. **Every `@import` goes at the very top.** Sibling imports download in parallel whatever their order; order only sets the cascade between them. The endpoint must return 200 `text/css` fast, and every selector it emits stays under `#wrapper` **[inferred · external-48]**. An import after any rule or `@font-face` is dropped silently **[verified · corpus-11, corpus-46]**.
2. **Imported rules lose same-specificity ties to the pasted rules,** because they count as written at the `@import`, before the pasted CSS. Make generated selectors more specific than the rules they must override (e.g. `#wrapper h1.custom-title` vs `#wrapper .custom-title`) **[verified · community-11, external-48]**.
3. **It delays first paint while it loads.** A parser-created `<style>` in `<head>` is render-blocking, and its imports are critical subresources **[documented · community-11]**. In a local Chrome lab, a 2.5 s import delayed first contentful paint to 2.53 s, while a refused connection painted at once with the local rules applied **[verified · s07-n9]**. The flash of unstyled content that some creators report is the less likely symptom; it was not reproduced **[community · corpus-22]**.
4. **It can be blocked.** Brave Shields blocked the owner's Vercel import on 2026-10-12 **[observed · community-36]**. Keep critical layout in the pasted CSS, and make the page acceptable with every import missing.
5. **No conditional savings in Chrome.** `@import url(x) print;` or a media condition such as `(min-width:…)` is still downloaded and render-blocking when it doesn't match; only `supports(<false>)` skips the fetch **[verified · external-13]**. `@import … scope(#wrapper)` is parsed as an unknown media query and **never applies** **[verified · external-14]**.
6. **Variants:** a `no-store` sheet gave 3 requests for 3 page loads. The same URL imported twice in one sheet was fetched once. A back/forward (bfcache) restore reused the old variant with no request **[verified · s07-n9]**.
7. **Name generated keyframes uniquely** (names are global across sheets) **[verified · localtests-22]**, and **escape non-ASCII** in generated strings (§7.10) **[verified · repo-16]**.
8. **Hint connections from the response.** Chrome 155 honours a `Link: <https://host>; rel=preconnect` header on an imported stylesheet, so your service can point the browser at its font host early. The gain is small **[verified · external-42]**.
9. **Jam pages can't do this.** Mid-sheet `@import` is dropped there (§7.3) **[verified · crawljam-36]**.

#### Fitting more CSS than the cap

- **Split the CSS.** On a profile, paste a part of at most 5,120 UTF-8 bytes **[verified 2026-10-16 · live-cap-A2c]** whose first statement imports the rest from a **version-pinned** URL, e.g. `https://cdn.jsdelivr.net/gh/USER/REPO@1.4.0/dist/rest.css`. Put the *earlier* part of your source order in the imported file and the *later* part in the pasted CSS, which keeps the cascade order intact. Bump the tag on every change **[verified · community-11]**.
- Two live profiles paste only an ~80-character `@import` of a 13–17 KB sheet; one splits inline and imported parts **[observed · corpus-22]**.
- Cheaper alternatives **[observed · corpus-42]**:
  - minify to one line;
  - shorten `custom-` class names;
  - use nesting **[verified · community-38]**;
  - point `@font-face` at font files instead of importing a font CSS.

### 7.15 Fonts without JS

- **First choice: the theme editor's Google Font picker.** itch adds the `<link>` itself, so it costs none of your CSS budget **[verified · community-17]**. It offers 400/700 and italics only **[verified · crawljam-43]**. Any other weight snaps to those faces: with only the picker's link, Syne rendered its 400 face for 400–500 and its 700 face for 550–800. For intermediate or animated weights, `@import` the css2 `wght` range as well; the picker's static faces still win at exactly 400 and 700, with the same metrics (§7.5) **[verified · gapfill07-05]**.
- **Scope `font-family` to `#wrapper` or `custom-` classes.** A font set on `body` changed the whole itch UI for one creator **[verified · community-17]**.
- **Display-title subsets:** add `&text=<letters>` to the css2 URL. For "Mirokshi" this returned a 2,548-byte woff2 instead of 34,608 bytes (about 93 % smaller), with the full variable axis kept. Base64-inlining even that costs 3,400 characters, two-thirds of the profile cap **[verified · external-40]**.
- **When downloading Google's CSS to self-host or paste, send a modern browser User-Agent.** A curl UA gets a single TTF face; Chrome and Firefox UAs get woff2 faces split by `unicode-range` **[verified · external-41]**.
- **Where `@import` can't be used** (jam CSS, or below other rules), paste `@font-face` blocks with direct file URLs **[verified · crawljam-43; observed · corpus-12]**:

```css
@font-face{font-family:"MyFont";font-display:swap;
  src:url("https://…/myfont-400.woff2") format("woff2")}
```

  One live jam pastes 28 Google blocks (13,872 characters, mostly font-face boilerplate); keep only the `unicode-range` subsets you need. gstatic URLs are versioned (`/v30/`) and may change **[verified · crawljam-43; observed · corpus-12]**.
- For a non-Google font, host a subsetted woff2 (e.g. made with fonttools' `pyftsubset`). Base64-embedded fonts quickly exceed the profile cap **[verified · community-17]**.

### 7.16 Forced colours and user preferences

In Chrome's forced-colours mode (Windows contrast themes) **[verified · a11y-26]**:

- **Removed:** gradient `background-image`s, `box-shadow` and `text-shadow`.
- **Replaced with system colours:** `color`, `border-color`, `outline-color` and the colour of `::before`.
- **Kept:** `url()` images, including the theme-editor panel image, with text backplates added; `backdrop-filter`.

Consequences:

- Gradient-only decorations and shadow-only card edges vanish. Give cards and panels a real border; `1px solid transparent` is enough, since it is forced to a system colour **[verified · a11y-28]**.
- Per-letter inline-block titles get one black backplate per letter over the panel image **[verified · s07-n8]**.
- Gradient text (`background-clip:text` + transparent fill) stayed readable in Chrome. For untested engines add `@media (forced-colors:active){#wrapper .custom-grad{-webkit-text-fill-color:currentColor;background:none}}` **[verified · a11y-29]**.
- Inside `@media (forced-colors:active)`, make small fixes with system colours (`Canvas`, `CanvasText`, `LinkText`), not a separate design. Safari supports the media feature (16+) but not `forced-color-adjust` **[documented · a11y-30, a11y-29]**.
- `prefers-reduced-transparency` is Chromium-only, so a frosted card must pass contrast without it **[verified · a11y-51]**.

### 7.17 Performance: what each effect costs

Chrome Android is the largest single share of visitors (42.8 %, §7.2), and itch pages run every effect at once. These numbers come from a local copy of a real decorated profile: frosted cards, three fixed star layers, a per-letter title wave, a breathing font weight, a greeting roller and a twinkle. Each effect was switched off in turn **[verified · gapfill07-06]**.

- **Setup.** Headless Chrome 155 with GPU compositing, 412×823 at DPR 1.75 (`mobile:true`), CPU throttled 4×. The page was traced for 3.2 s per run, 2 runs each, idle at the top and during a 1,400px wheel scroll. The frame rate counts `requestAnimationFrame` callbacks (the headless display ran at 75 Hz). "Long frames" are `long-animation-frame` entries over 50 ms. The ms/s columns are trace time per second of wall time.
- **Not a phone.** This is a desktop CPU slowed down, with the desktop GPU. Read the numbers as relative costs between effects, not as device frame rates.

| Configuration | FPS idle / scroll | Long frames per 3 s | Layout ms/s | Style ms/s | Compositor GPU ms/s, idle / scroll |
|---|---|---|---|---|---|
| No custom CSS | 75 / 75 | 0 | 0 | 0 | 0 / 7 |
| **Everything on** | **21 / 18** | 21–36 | **≈ 900** | 35–40 | 34 / 39 |
| Everything except the breathing weight | 75 / 75 | 0 | 0 | 51–53 | 34 / 39 |
| Only the breathing weight (`font-weight` from an animated `@property`) | 21 / 19 | 22–30 | ≈ 900 | 27–31 | 2 / 28 |
| Breath property animating, `font-weight` fixed | 75 / 75 | 0 | 0 | 123–126 | 32 / 39 |
| Only the title wave (8 spans, `translate` + `rotate`) | 75 / 75 | 0 | 0 | 35–40 | 12 / 27 |
| Only the twinkle (opacity of 2 fixed layers) | 75 / 75 | 0 | 0 | 19 | 28 / 39 |
| Breath off, `backdrop-filter` off | 75 / 75 | 0 | 0 | 46–54 | 24 / 17 |
| Breath off, star layers off | 75 / 75 | 0 | 0 | 55–60 | 15 / 27 |
| Breath off, `backdrop-filter` and stars off | 75 / 75 | 0 | 0 | 54–64 | 14 / 14 |
| All animations off (layers and blur still drawn) | 75 / 75 | 0 | 0 | 0 | 0 / 32 |

What to take from it:

1. **Never animate `font-weight` in a loop.** Other properties that trigger layout should behave the same way **[inferred]**. It was the only effect that broke the frame rate: about 0.9 s of layout per second at 4× throttling, 0.53–0.59 s even unthrottled. Animating the same registered property without feeding it into `font-weight` cost style time only, with no layout and a steady frame rate. Ship the weight as a one-cycle intro (§7.5) or not at all **[verified · gapfill07-06]**.
2. **`transform`, `translate`/`rotate` and `opacity` animations are cheap.** Eight letters waving, or two twinkling full-screen layers, held the full frame rate with no layout **[verified · gapfill07-06]**.
3. **`backdrop-filter` and fixed full-screen layers cost compositor (GPU) time, not frames.** During scroll, the frosted cards roughly doubled compositor GPU time (17 → 37 ms/s); the star layers added 10–18 ms/s. The frame rate stayed at 75 in this setup. With software compositing (`--disable-gpu`), the same two effects took the display compositor from about 120 to 640 ms per second while idle **[verified · gapfill07-06]**. On weak or blocklisted GPUs, expect blur and stacked fixed layers to be the next bottleneck **[inferred]**.
4. **Inherited registered properties restyle the whole subtree every frame** (123 ms/s of style for one `@property` on the title), even when nothing visible changes. Animate them on the smallest element that needs them **[verified · gapfill07-06]**.
5. **Static layers are nearly free once painted.** With every animation off, the decorated page did no main-thread work while idle; scrolling cost compositor time only **[verified · gapfill07-06]**.
6. **A render-blocking per-visit `@import` costs first paint, not frame rate:** a 2.5 s import delayed first contentful paint to about 2.5 s (§7.14) **[verified · s07-n9]**.

### 7.18 Testing techniques across browsers

- **Run the probes in Firefox and Safari.** Open `knowledge/evidence/support-probe.html` (139 rows) and `knowledge/evidence/sec07-tools/sec07-probe.html` plus `sec07-probe2.html` (the fallback patterns of this section). That is the cheapest way to turn the *documented* columns above into *verified* ones **[verified · s07-n1, s07-n2]**.
  - Without a Mac or a Firefox install, Playwright's engines are the next best thing: `npx playwright install firefox webkit`, then load the same files in `firefox.launch()` and `webkit.launch()`. Tag those results "verified (Playwright WebKit)": Playwright's WebKit build is not Safari, and iOS-only behaviour such as `background-attachment:fixed` or `dvh` needs a real iPhone. On the test machine this was not done; its Playwright cache holds only Chromium 1217 **[verified · gapfill07-07]**.
- **Re-check dated items** after 2026-10-20 (Chrome 156: `random()`), 2026-10-27 (Firefox 159: scroll-driven animations) and 2026-11-13 (`text-wrap:balance` Widely). After 2026-10-28, re-run the two probes in Chrome 156 and Firefox 159 and re-fetch BCD, web-features and caniuse before editing §7.4 **[documented · gapfill07-08]**.
- **Render live pages with itch's JS running** when a rule touches game grids. Harnesses that strip `<script>` miss the runtime grid sizer and show rules working that do nothing live (§7.13). `gapfill07-tools/livegrid.mjs` loads a live page, swaps test rules into `style#custom_css` (or appends them to `style#jam_theme`), and reads the grids at several widths for about 1 document GET per page **[verified · gapfill07-01]**.
- **Measure cost, not just looks,** for any always-running effect: CPU throttling ×4 with Moto-G-class emulation, then frames, long frames and layout time per second (§7.17, `gapfill07-tools/perf.mjs`) **[verified · gapfill07-06]**.
- **Community iteration workflow** **[community · community-43]**:
  1. Open the live page and clear the custom CSS field **without saving**.
  2. Load the local CSS in Firefox DevTools' Style Editor and iterate there.
  3. Minify and paste.

  If the CSS contains non-ASCII text, paste its content over the imported sheet instead of importing the file, because Firefox can mangle it.
- **Also test** in the itch desktop app (older installs may run an older Electron) **[community · community-37]**, at a viewport under 768px (touch, no hover), with reduced motion, and with forced colours (sections 10 §4–§6).

### 7.19 Open questions

| Question | How to test |
|---|---|
| Does itch keep `@view-transition`, `@container`, `@starting-style`, `@scope` and `::view-transition-*` when saving? None appear in the 62-page corpus. Settled for the four at-rules on a project (live-c13 to live-c15, live-c18, live-c19); `::view-transition-*`, profiles and jams remain | Save a test rule in a scratch profile's (or jam's) CSS editor, then curl `style#custom_css` |
| Does a real profile → project navigation on itch fire a cross-document view transition? Do duplicate `view-transition-name`s on one page cancel it? | Opt in on both pages, navigate in Chrome, read `pagereveal`'s `event.viewTransition` |
| Does clicking an absolute same-page link update `:target` on `<a name>` like loading with the hash? | A bio with two `<a name>` panels; click the links in Chrome, Firefox and Safari |
| Are `class` on `<details>`, `popover`/`popovertarget`, inline `style="--i:…"` and empty spans inside an `h1` kept by the sanitizer? On a project description the first three are dropped and the empty spans kept (live-t08, live-a12 to live-a14, live-s11, live-s12, live-t23); bios remain | Save them in a scratch bio, then curl the page |
| Does native `random()` give a fresh value on every load of a live itch page? Not checkable in the 2026-10-16 run: Chromium 155 has no `random()` (live-c28) | After 2026-10-20, a guarded `random()` rule on a scratch page; reload in Chrome 156 and Safari 26.2+ |
| Do `@starting-style` (first render), scroll reveal and the fallback patterns behave in Firefox and Safari as in Chrome? More broadly, which FF/Sa cells of §7.4 hold when run? | `npx playwright install firefox webkit`; load `support-probe.html`, `sec07-probe.html`, `sec07-probe2.html`, `sec07-target.html`, `support-tools/verify2/v2-probe.html` and `knowledge/tests/index.html` (served on :8090/:8091) in both engines; also run `gapfill07-tools/finite-motion.html`. Tag results "verified (Playwright WebKit ≠ Safari)" |
| Safari: nested `@view-transition` inside `#wrapper{}`; `backdrop-filter` with `var()` on macOS 26; alt text for generated content; `outline:auto` colour | Safari 18.2+/26+ device test (Playwright WebKit first, then real Safari) |
| iOS only: does the theme image with `background-attachment:fixed` scroll with the page, and do `dvh` units resize with the toolbar? | Real iPhone (or a BrowserStack iOS session) on a test profile |
| Do the §7.17 costs hold on real phones with GPU compositing (Chrome Android, iOS Safari)? Headless numbers are relative, not device numbers | Chrome DevTools remote debugging on a mid-range Android phone: Performance panel with and without the breathing weight; Safari Web Inspector timeline on an iPhone |
| Which content blockers block jsDelivr or Google Fonts imports on `*.itch.io`? | Load a profile that imports both with Brave Shields, uBlock Origin and AdGuard |

---

### Section notes (evidence added for this section, 2026-10-14)

All browser runs: Chrome 155.0.8059.40, `chrome --headless=new --disable-gpu --user-data-dir=<scratch dir> --virtual-time-budget=2000 --dump-dom <file URL>`, once plain and, where stated, once with `--enable-experimental-web-platform-features`. Result rows are saved in `knowledge/evidence/sec07-tools/`.

- **s07-n1: fallback probe, re-run.** `sec07-tools/sec07-probe.html` (T1–T22, 24 rows). Results: `results-chrome155.txt` and `results-chrome155x.txt`.
  - Chrome 155: 24/24 PASS. Key rows:
    - T1 selector list dropped (600px), T2 own rule survives (25px), T3 in-rule fallback 28px;
    - T4 var trap `auto`, T5/T6 `@supports (rotate: random())` false, T7 `@supports (--x: random())` true;
    - T9 registered angle 180deg at 50 %, T10 unregistered still 0deg at 25 %, T11 `sin()` 150px;
    - T12 translate + transform 15px, T13 `sibling-index()` delays 0.06/0.12/0.18 s;
    - T15 timeline before/after the shorthand `auto`/`view()`, T16 `@media{@supports{}}` applies, T17 nested `@supports` 38px;
    - T18 `:is()` forgiving, T19 `(hover:hover) and (pointer:fine)` true, T20 computed `"*" / ""`;
    - T21 `0px`, T22 delays `0s`.
  - Flag build: T3–T6 flip as expected, because `random()` is supported there (T3 18.66px, T4 19.05px, T5 applied, T6 not). T21 gave `-70px` and T22 three distinct delays (`-2.95s`, `-0.39s`, `-1.76s`); every other row is unchanged.
- **s07-n2: pattern probe, new.** `sec07-tools/sec07-probe2.html` (T23–T30). Results: `results2-chrome155.txt`; the flag build gave identical rows. Rows:
  - T23: a generic `@supports` `span{--i:calc(sibling-index() - 1)}` against `span:nth-child(2){--i:1}`/`span:nth-child(3){--i:7}` gives `1px,11px,71px,31px`, so the `:nth-child` rules win;
  - T24: the same override written as `span:nth-child(n){…}` gives `1px,11px,21px,31px`, so the override wins;
  - T25: nested `@starting-style` inside `#wrapper .t25{…}` on a static element gives 1 running transition and opacity 0 at first read; the control gives 0;
  - T26: `@scope (#wrapper){.x}` loses to `.user_page .x` (45px), while `#wrapper{.x}` wins (46px);
  - T27: `light-dark()` without `color-scheme` gives the light value; with `color-scheme:light dark` it gives the dark value (the OS preference was dark);
  - T28: a style query matches 3 levels below the token;
  - T29: `translate:20px 0` moves an inline span 0px and an inline-block span 20px;
  - T30: unregistered `--x:sibling-index()` read by children gives the children's own indexes (10px, 20px).
- **s07-n3: `:target` on `<a name>`.** `sec07-tools/sec07-target.html`, loaded with `#custom-tab2` and with `#ctl-id` (control). After 300 ms, `a[name="custom-tab2"]` matches `:target` and the sibling panel computes `display:block;width:41px`; the id control behaves the same. Synchronously at parse time neither matches yet. Results: `results-target-chrome155.txt`. Click navigation was not tested.
- **s07-n4: live per-visit service.** The repo owner's own Vercel service, not itch; its URL and the command are in `sec07-tools/live-css-check.txt`. 3 × `curl -s --compressed -A "<Chrome 155 UA>"`, 1.2 s apart. Each returned 200, `text/css; charset=utf-8` and `Cache-Control: no-store`, with 3 distinct md5s and 14,822–14,840 bytes, 0 non-ASCII bytes. It contains `@keyframes breath`, `hello`, `roll` and `twinkle`, `@property --breath`, 3 `data:image/svg+xml` URIs, and its own `@media (prefers-reduced-motion:reduce){#wrapper::after,#wrapper .user_page::before{animation:none}}`. Bodies are kept in the scratchpad only.
- **s07-n5: support data not covered by a fact id,** read from `knowledge/evidence/support.md`:
  - §2: release table, and the fact that on iOS every browser is WebKit;
  - §3: the `Users` percentages, plus the `@property`, nesting (Widely 2026-06-11), `@layer`, `overflow:clip`, `color-mix()`, relative colour, `light-dark()` and same-document view-transition rows (BCD 8.1.5, web-features 3.42.0, caniuse 2026-10-13);
  - §11.2: Edge 155 matched Chrome 155 on all 139 probe rows.
- **s07-n6: corpus feature counts,** `knowledge/evidence/corpus.md` §3.5 (62 pages): `@keyframes` on 34, `prefers-reduced-motion` on 5, `::before`/`::after` on 41, `backdrop-filter` on 6, `animation`/`transition` on 34/33; `@container`, `@layer`, `@scope`, `@starting-style` on 0.
- **s07-n7: sanitizer,** read from `knowledge/evidence/sanitizer.md` (live sample of 2026-10-14 plus the web_sanitize library model):
  - §5.2: 0 `id`, 0 user-authored `data-*`/`aria-*`/`role` in 2,127 containers; class tokens limited to `custom*`, `text-center` and `text-justify`;
  - §6: `details[open]` stripped;
  - §9.3 point 4: `details` 57, `summary` 57, `figure` 47 and `font` 176 occurrences carry **no attribute at all**, while `div` carries `class` in 33 of 37;
  - §3.3: the inline-style whitelist has no custom properties; section 05 note N9 shows `style="--i: 1"` becoming `""` in the library model;
  - `popover`/`popovertarget` are absent from the reconstructed allowlist, and `<button>` was only seen itch-generated (inferred).
  - The private repo also records itch stripping `aria-hidden` from a bio on 2026-10-08.
- **s07-n8: touch, focus, forced colours,** read from `knowledge/evidence/a11y.md`:
  - §2.3: the title-link ring is clipped by `.game_title{overflow:hidden}`, while the `.game_cell:focus-within` ring renders whole;
  - §2.7: touch emulation gives `(hover:none)` true, and `.game_cell:hover` stays true after a tap;
  - forced-colours notes: each title letter gets a black backplate over the `url()` background;
  - BCD table: `@media (hover)` in Chrome 38 (41 reliable), Firefox 64, Safari 9.
- **s07-n9: external-import lab,** read from `knowledge/evidence/external.md` §2f–2h and its verification re-runs (Chrome 155):
  - a 2,500 ms import gave FCP 2,532 ms (re-run 2,540 ms); no import gave 44 ms; a refused import gave 36 ms with the local rule applied;
  - a `no-store` import gave 3 CSS requests for 3 page loads, and the same URL imported twice gave 1 request;
  - a bfcache restore made no new request.
- **s07-n10: `data-game_id`.** `knowledge/evidence/crawlprofile.md` (DOM census: `div.game_cell…[data-game_id]`) and the private profile export, which has 9 `data-game_id="…"` cells. The attribute is generated by itch, so the sanitizer doesn't apply. It is not on the documented stable list.
- **s07-n11: `color-scheme` in itch CSS.** Count of `color-scheme` in the copies of `user.css`, `game.css` and `jam.css` downloaded today by another dimension (scratchpad, not re-fetched): 0, 0 and 0. `main.css` (site UI and jam sub-pages) has one, inside its dark-mode variable block. The saved profile, project, devlog and jam HTML pages contain none.
- **s07-n12: owner's live CSS** (private repo `src/main.css`, live on the owner's profile; read-only check):
  - the card hover is a transition with `cubic-bezier(.34,1.56,.64,1)`;
  - a comment records that `animation:rise` on `.game_cell` re-fired the fade-in when the pointer left, so it was removed;
  - its reduced-motion block covers only `#wrapper *,#wrapper *::before`; the service sheet covers its own layers (s07-n4).
  - The private notes record that a `clip-path` roller window caused horizontal scroll on mobile in the preview, which is why `overflow-y:clip` is used.

- **gapfill07-01 … gapfill07-08: gap-fill pass (2026-10-14, 14:09–14:45 UTC).** Methods, commands, raw numbers and re-run instructions are in `knowledge/evidence/gapfill.md` (block "Gap fill for 07-techniques-and-support.md"); own tools are in `knowledge/evidence/gapfill07-tools/`. Summary:
  - 01–03: live logged-out renders with itch's JS running (Chrome 155 over CDP, 5 document GETs to itch, images blocked) of a Grid-layout profile, a Column-layout profile and a jam overview, at 1400/700/420/360/320px, with test rules swapped into the custom-CSS position;
  - 04: finite vs infinite motion through the Web Animations API (`finite-motion.html`);
  - 05: Syne weight matching with a theme-style v1 link, a css2 `wght` import, or both (`font-weight.html`, `CSS.getPlatformFontsForNode`);
  - 06: per-effect cost on a local copy of a decorated profile (`perf.mjs`, CPU ×4, 412×823 DPR 1.75, GPU and software compositing);
  - 07: no Firefox or WebKit engine on the machine (Playwright cache: `chromium-1217`, `chromium_headless_shell-1217`, `ffmpeg`, `winldd` only; no Firefox install). No engine was downloaded;
  - 08: time-bound facts and their re-verify dates, from `support.md` §2–§3 and the asset stamps seen on 2026-10-14 (`?1791970861`, `?1791974461`, `?1791981660`, `?1791985261`).

**Conflicts resolved in this section:**

- **FOUC vs delayed paint** (community-11, corpus-22, community-36). The spec predicts render-blocking, and the external lab measured it (s07-n9), so the section states delayed first paint. FOUC is kept as a community report. community-11's "not tested in a browser" is superseded by that lab.
- **`sibling-index()` override** (localtests-31 vs the naive pattern). A generic `@supports` override loses to `:nth-child(n)` rules. The wave example uses `:nth-child(n)` to tie the specificity (s07-n2 T24).
- **Safari share:** support-02 says "one in six"; the reproduced 17.9 % is one in ~5.6, which the section uses.
- **Style-query range in Firefox:** MDN says pref-gated, while Firefox source and BCD say on since 151. The section follows the source and flags it as untested (support-11).
- **`text-box` Baseline:** BCD is internally inconsistent; both sides are stated (support-45).
- **Nested `@view-transition`:** an early claim said it can't be nested. Chrome fires the nested form (support-21); top-level is still recommended for Safari.
- **`aria-label` for split letters** (repo-44 "unknown"): sanitizer evidence says `aria-*` is stripped (s07-n7), so the a11y-13 pattern is recommended instead.
- **`<details>` "unverified"** (support-41): `details`/`summary` survive, but were never seen with attributes (s07-n7), so the section hooks them through a classed wrapper.
- **Typed `attr()` from `data-*`** (support-38): `data-*` is stripped, so the technique is unusable with user HTML.
- **Safari and forced colours** (a11y-29): BCD lists Safari 16 support for the `forced-colors` media feature. Whether any macOS setting triggers it is unknown.
- **Nesting fallout** (crawlprofile-33 vs itchcss-05): both, after correction, agree that partial-support browsers lose `hr{}` and the rest of `.user_page{…}` but keep the `.`-prefixed game-cell block.
- **`:target` on `a[name]`:** section 05 lists it as unverified. The section reports a Chrome test on page load (s07-n3), with click navigation still open.
- **Game-grid gap and columns** (itchcss-24, crawljam-45 vs community-47 and section 04's source reading). Script-free harnesses showed `#wrapper{--itchio_grid_gap}` working; live pages with itch's JS show the runtime sizer shadowing it on every sized grid (gapfill07-01, -03). §7.13 now gives the JS-on result. The same renders settle two side questions: profiles keep at least 2 columns down to 320px, so "1 column under 510px of grid width" holds only without JS; and jam overviews do get a runtime sizer (`#game_grid_0`).
- **Infinite idle motion** (the owner's live profile vs WCAG 2.2.2 in 02 P8 and 10 §5.3): §7.5 now defaults to finite motion and treats loops as an accepted trade-off.
- **Support-row confidence** (one tag per row): the Chromium and Firefox/Safari halves are now tagged separately (§7.4).
