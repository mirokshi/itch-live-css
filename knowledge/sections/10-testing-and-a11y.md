## Testing and accessibility checklist

itch's CSS guide asks for three things before custom CSS ships **[documented · docs-15]**:

- the page stays usable with assistive technologies;
- it works at small viewports;
- it works for a **logged-out** visitor.

itch's own stylesheets won't do this for you. None of its bundles has a `prefers-reduced-motion` query **[verified 2026-10-14 · itchcss-26]**, its focus ring is a dark purple that nearly vanishes on dark themes **[verified 2026-10-14 · itchcss-25]**, and spoilers get no ring at all **[documented · itchcss-55; verified 2026-10-14 · s10-16]**. Every item below is your job.

**How to read the tags.**

| Tag | Meaning |
|---|---|
| `verified` | Reproduced by a test or a live observation on the date shown |
| `verified (live render)` | Reproduced on a real logged-out page **with itch's own JavaScript running** and the test CSS injected into the page's CSS slot (§14.7) |
| `verified (script-free harness)` | Reproduced on a saved real page with every `<script>` removed (§14.1). State that itch's JS sets at runtime (§14.8) was frozen, so check such results against a live render before relying on them |
| `observed` | Seen on real pages, but not systematically |
| `documented` | itch's docs or itch's source say so |
| `community` | Third-party reports only |
| `inferred` | Deduced from verified facts |

`s10-NN` ids are checks re-run for this section, listed in *Section notes* at the end. Unless a tag says otherwise, browser results come from Chromium: headless Chrome 155 over CDP, or the Chromium 152 preview pane. `s10-17` to `s10-30` were added later the same day: live renders with itch's JavaScript (§14.7), starter templates tested end to end (§15), and accessibility trees read in Firefox 142, WebKit 26 and through Windows UI Automation (§10.4). **Firefox and Safari layout, and what real screen readers speak, were not tested** (§10.4, §13). `live-*` ids come from the live probe runs of 2026-10-16 in Brave 155 (`evidence/live-probes/`): Run 1 on the owner's draft project page, viewed logged in, Run 2 on the owner's profile, viewed logged in and logged out, and Run 3 on a draft devlog post of that project, viewed logged in; each holds only for the page types and views its text names.

---

### 1. Pre-ship checklist

This is the **merged pre-flight checklist** for every page type. The shorter lists in 02 §4, 04 §11 and 09's top 10 overlap with it. Where their snippets differ, follow this list, the focus fix in §8.2 and the starter templates in §15. Each template passed rows 7, 9 and 11, and row 3 at 320 px, on real pages with itch's JavaScript running **[verified (live render) 2026-10-14 · s10-25]**. Row 12 depends on the page's own HTML, which CSS can't fix (§15.4).

| # | Check | How | Pass when | Refs |
|---|---|---|---|---|
| 1 | Logged-out render | Private window, or `curl` with no cookies | Layout, headings and tab order match your design; nothing depends on owner-only markup | docs-15, docs-48, crawlprofile-43, a11y-21 |
| 2 | Saved CSS is live | `curl` the page logged out and read `style#custom_css`, checking `X-Cache-Status` (§2.4) | Your latest rules are in the served HTML | crawlprofile-58, crawlprofile-46 |
| 3 | Narrow widths | 320 and 375 px, then the page type's breakpoints (§3) | No horizontal scroll; nothing clipped or overlapping | docs-15, a11y-31, crawljam-27, crawljam-47, s10-01 |
| 4 | Large text | Browser default font 32 px at 320/375 px; 200% zoom | No horizontal scroll; names don't break mid-word | a11y-31 |
| 5 | Text spacing | Inject the WCAG 1.4.12 override (§11) | No essential text clipped | a11y-45 |
| 6 | Touch, no hover | Touch emulation, then tap cards and links | No stuck hover transforms; nothing reachable by hover only | localtests-35, s10-03 |
| 7 | Reduced motion | Emulate `prefers-reduced-motion: reduce` | `document.getAnimations()` shows 0 running; all content visible | repo-50, corpus-37, s10-02 |
| 8 | Flashing | Watch every animation | Nothing flashes more than 3 times per second | docs-16 |
| 9 | Forced colors | Emulate `forced-colors: active` | Cards keep an edge; hidden text doesn't reappear on top of other text | s10-05 |
| 10 | Contrast | Measure against the **brightest** region of the background image, compositing alpha first | Text ≥ 4.5:1 (large text ≥ 3:1); focus ring ≥ 3:1 | s10-06 |
| 11 | Keyboard | Tab through the whole page | Every stop (links, `.button`, spoilers) has a visible, unclipped ring | itchcss-25, itchcss-55, s10-04, s10-16, s10-25, s10-26 |
| 12 | Headings | List the exposed (not `display:none`) h1–h6 | Exactly one exposed h1 that names the page (on jams: itch's own, §8) | itchcss-54, crawlprofile-05, crawlproject-10, crawljam-46 |
| 13 | Images | Look for `display:none` or background-image swaps on `img` | Banner and screenshot `<img>` (and their alt) are kept | crawlproject-67, sanitizer-40 |
| 14 | Accessible names | CDP AX tree or the DevTools Accessibility pane, **not** `read_page`/`find`; Firefox and WebKit via Playwright snapshots (§10.4) | Decorative generated text is silent; hidden words aren't announced by accident. These are tree checks: real speech is untested (§10.4) | a11y-03, a11y-57, localtests-34, repo-59, s10-27, s10-28 |
| 15 | Without external CSS | Delete the `@import` in memory (§14.5) | The page is complete and readable | repo-54, s10-10 |
| 16 | Blocker-safe names | grep your `custom-` classes | No `custom-ad`, `custom-ads` or `custom-advert…` names | s10-11 |
| 17 | itch overlays | Look at top-right (profile) and the bottom 50 px at ≤650 px (project) | Nothing important sits under `#user_tools`, and no fixed layer of yours covers it (§2.3) | s10-15, s10-19 |
| 18 | Firefox and Safari | Real browsers, including iOS | Everything you rely on is supported or degrades cleanly | s10-12 |
| 19 | Size | 01 §3 snippet on the minified file | Profile ≤ 5,120 UTF-8 **bytes** after trimming both ends, comments included; project: no cap, but every byte is page weight; jam ≤ 20,410 chars | 01 §3, live-cap-A1, live-cap-A2c, live-cap-B1 |
| 20 | JS-managed state | A live render with itch's JS (§14.7), not only a script-free harness | Grid columns and gaps, footer spacing, `#user_tools`, loaded covers, GIF overlays, wide embeds and jam countdowns look right after itch's scripts ran (§14.8) | s10-17 to s10-24 |

---

### 2. Test as a logged-out visitor

#### 2.1 The owner's view is a different page

- **Do the final review in a private window.** The guide asks for logged-out testing on every page type **[documented · docs-15, docs-48]**.
- **Jam pages (documented).** When you view a jam you can edit, itch wraps the content in extra editor elements. Scoping to `#wrapper` keeps your rules working, but verify as a visitor anyway **[documented · a11y-22, docs-48]**.
- **Profile pages (observed, then verified live).** Compared with a logged-out fetch of 2026-10-14, a logged-in owner export from June 2026 had these extras **[observed · crawlprofile-43, repo-37, a11y-21]**:
  - `body.has_header` and a site header `.user_profile_header_widget` containing a skip link, a **second `<h1 class="title">`** (the itch logo), Dashboard, Edit profile and Edit theme;
  - `#wrapper` wrapped in `.theme_editor_columns > .theme_editor_primary_column`;
  - `.game_cell.is_owner` on your own games;
  - content hidden by theme settings, still rendered with inline `display:none` (collection rows, hidden games).

  None of that reaches visitors. The h1 count was 3 logged in vs 2 logged out **[observed · a11y-21]**. On 2026-10-16 the owner's live profile, with the theme editor closed, confirmed `body.has_header`, the site header (with `.owner_tools` and `.edit_theme_btn`), the `.theme_editor_columns > .theme_editor_primary_column` wrappers and no `#user_tools`. It had 4 `h1`s against 3 logged out, plus two collection rows, a purchases section and two elements served with inline `display:none` that the logged-out view lacked **[verified 2026-10-16 · live-dom]**. No official source documents owner-only markup on profiles or projects **[documented · docs-48]**.
- **Project pages (community).** One creator traced a page-width shift that appeared only while logged in to the owner's admin bar. Logged out, everything lined up (around 2020) **[community · community-30]**.
- **Project pages (owner view, verified).** The owner's view of a draft project, with the theme editor closed, had **[verified 2026-10-16 · live-dom]**:
  - `body.has_site_header` and an owner bar `div.game_header_widget` (with `.owner_tools` and `.edit_theme_btn`) as a child of `body`;
  - `#wrapper` wrapped in `div.game_page_apperance_columns > div#maincontent.game_page_primary_column`;
  - no `#user_tools`;
  - an inline `min-height` on `#inner_column` (§14.8).

#### 2.2 Selector rules that follow from this

- Never depend on `#wrapper`'s ancestors or siblings: `body > #wrapper`, `#wrapper:first-child`, `body.has_header …` **[observed · crawlprofile-43, repo-37]**. In the owner's view of a project and of the profile `#wrapper` sits inside two wrapper elements **[verified 2026-10-16 · live-dom]**.
- Prefer descendant selectors over child combinators from `#wrapper` **[inferred · a11y-22]**.
- Avoid `100vw` widths **[community · community-30]**.
- Don't count owner-only headings, links or buttons when you audit headings and tab order **[observed · a11y-21]**.

#### 2.3 What visitors get that owners don't

- **Profiles.** A `ul#user_tools` "Follow" button sits **before and outside** `#wrapper` **[observed · repo-37]**. On the live logged-out profile it was the first child of `body`, right before `#wrapper`, with no `.hidden` class left once the scripts had run **[verified 2026-10-16 · live-dom]**. itch styles it `position:fixed; top:0; right:0; z-index:2` with a 10 px margin. Its JS removes `.hidden` about 200 ms after load **[verified 2026-10-14 · s10-15]**. With itch's JS running, the button was showing 1 s after `load` on a grid profile and a column profile: class `user_tools` only, opacity 1, about 10 px from the top-right corner **[verified (live render) 2026-10-14 · s10-19]**. Keep important content out of the top-right corner, or check that the button doesn't cover it.
- **Your fixed layers can cover the Follow button.** `#wrapper` creates no stacking context, so a `position:fixed` layer with a z-index above 2 inside it (a star field, a vignette, a scan-line overlay) is painted over `#user_tools` and takes its clicks. Results on both profiles, with a `#wrapper::after{position:fixed;inset:0;z-index:5000}` tint layer **[verified (live render) 2026-10-14 · s10-19]**:

  | Your CSS | Button visible on top | Click reaches the button |
  |---|---|---|
  | layer only | no (tinted) | no: the hit test returns `#wrapper` |
  | layer + `#wrapper{isolation:isolate}` | **yes** | **yes** |
  | layer + `pointer-events:none` on it | no (still tinted) | yes |

  Use `isolation:isolate` on `#wrapper`, or keep fixed layers at a negative z-index. A layer inside the bio (`.user_profile::after`) covered the button on the grid profile but not on the column profile. The cause was not investigated, so don't rely on either outcome.
- **Project pages at ≤650 px.** `game.css` turns `.user_tools` into a fixed **50 px bar at the bottom** of the screen (`z-index:99`) and pads the footer by 60 px **[verified 2026-10-14 · s10-15]**. Don't place your own fixed or sticky content at the bottom on mobile project pages **[inferred · s10-15]**.

#### 2.4 Confirm what is actually served

- **Fetch the page logged out** with `curl https://<user>.itch.io/` and read `<style id="custom_css">` **[verified 2026-10-14 · crawlprofile-58]**. Read the status before anything else:

  | Status | Meaning |
  |---|---|
  | 200 | Page served; read `style#custom_css` |
  | 302 | The account has no creator page |
  | 404 | The subdomain doesn't exist |

  - Don't use `curl -L`: it follows a redirect onto a different page.
  - Don't use `HEAD`: it returns `X-Cache-Status: BYPASS` and no body.
  - The cache varies only by `accept-encoding`, so one fetch shows what every logged-out visitor gets at that moment **[verified 2026-10-14 · crawlprofile-58]**.
- **Allow for itch's cache.** The logged-out profile body is cached server-side for a few minutes (`X-Cache-Status` HIT/MISS/EXPIRED); only the csrf token changes per request **[verified 2026-10-14 · crawlprofile-46]**. A freshly saved change needs a few minutes to reach visitors: after a profile save, logged-out requests got the old copy (`HIT`, no `Cache-Control`) for about 2.5 minutes, then `EXPIRED` with the new one, and adding a query string did not bypass the cache **[verified 2026-10-16 · live-dom]**. Before concluding that a save failed, check whether the response was a HIT. The logged-in owner's view of a project and of the profile bypasses that cache (`X-Cache-Status: BYPASS`, `Cache-Control: no-store`) **[verified 2026-10-16 · live-dom]**, so what the owner sees proves nothing about what visitors get.

---

### 3. Viewports and breakpoints

- **Test by resizing, not by switching the User-Agent.** An iPhone UA gets the same DOM and the same `custom_css` as desktop Chrome, so all responsiveness comes from media queries **[verified 2026-10-14 · crawlproject-50]**. All four page types ship `<meta name="viewport" content="width=device-width, initial-scale=1">` **[verified 2026-10-14 · s10-07]**.
- **Always test 320 and 375 px.** 320 CSS px is the WCAG 1.4.10 reflow width (1280 px at 400% zoom) **[verified 2026-10-14 · a11y-31]**. The guide's own wording is only "small viewports" **[documented · docs-15]**.
- **Then test at itch's breakpoints for the page type:**

| Page | Test at | What itch changes there |
|---|---|---|
| Profile (`user.css`) | **800**, **650**, 600 | ≤800 px, column-layout profiles only (`.user_page.mode_column`): the columns stack, `.user_game_grid` becomes a horizontal `display:flex; overflow-x:auto` strip with cells capped at `max-width:calc(100vw - 80px)`, and carousels get −20 px side margins. ≤650 px: `.game_grid_widget{font-size:14px}` and `.game_cell_tools` hidden. **[verified 2026-10-14 · s10-01]** |
| Project / devlog (`game.css`) | **1000**, 650, 600, 400 | ≤1000 px: `.inner_column{max-width:600px}`; `.columns` becomes a flex column with **`.right_col` (screenshots) first**; `.header_buy_row` shows; the footer becomes static; devlog `.split_columns` stack. ≤650 px: `.user_tools` bottom bar (§2.3). ≤600 px: `.wrapper{padding:0}`. ≤400 px: `.buy_row` scrolls horizontally. **[verified 2026-10-14 · s10-01]** |
| Jam overview (`jam.css`) | **650**, 600, **820**, ~800 | ≤600 px: `.stats_container` hidden. ≤650 px: `.jam_body` margins drop to 10 px, the title shrinks from 2.625em to 1.25em, and the header tabs scroll horizontally. ≤820 px: `.jam_submitter_widget` goes full width with radius 0 **[verified 2026-10-14 · crawljam-27]**. **Between 651 and 960 px** `.jam_body` has 0 side margin and touches the viewport edges, so the theme's radius and outer glow are cut off. Test borders and shadows at ~800 px **[verified 2026-10-14 · crawljam-47]**. A live render with itch's JS confirmed 0 px margins at 651, 800, 960 and 961 px windows (the 961 px window has a 946 px page next to a 15 px scrollbar), and 10 px at 650 px **[verified (live render) 2026-10-14 · s10-24]**. |

- **Some widths come from itch's JavaScript, not from these media queries** **[verified (live render) 2026-10-14 · s10-18, s10-23]**:
  - On grid-layout profiles, the game grid's column count and width are written by a script into `<style itchio-grid-sizer>` elements placed **after** `style#custom_css`, and rewritten on every resize.
  - On project pages with an HTML5 embed wider than the column, a script pins `#inner_column` to the embed's width with inline styles when the browser reports a desktop user agent, whatever the viewport width.

  A script-free harness shows neither, so test these at real widths with itch's JS running (§14.7, §14.8).
- **Viewport-height units.** Emulation has no browser toolbars, so `100vh`, `100dvh`, `100svh` and `100lvh` are always equal there **[verified 2026-10-14 · localtests-48]**. Check vh-vs-dvh behaviour on a real phone.
- **Headless widths below 500 px.** `chrome --headless=new --window-size=320,800` gives `innerWidth` 500, not 320. Use `Emulation.setDeviceMetricsOverride` over CDP, or the DevTools device toolbar, for exact 320/375 px **[verified 2026-10-14 · s10-13]**.

---

### 4. Touch and hover

- **Gate hover effects behind `(hover:hover)`.** After a tap under touch emulation, `:hover` stays matched, and an ungated `:hover{transform:…}` stays applied (a "sticky hover"). The same rule inside `@media (hover:hover)` isn't applied on touch and still works with a mouse **[verified 2026-10-14 · s10-03, localtests-35]**:

```css
@media (hover: hover) {
  #wrapper .game_cell:hover { transform: translate(-4px, -4px); }
}
```

- Never put information or controls behind hover alone **[inferred · s10-03]**.
- Under touch emulation, `(hover:none)`, `(pointer:coarse)` and `navigator.maxTouchPoints = 5` all report touch **[verified 2026-10-14 · s10-03, localtests-35]**.

---

### 5. Motion

#### 5.1 Write a complete reduced-motion guard

- **Every animation you add needs its own reduced-motion fallback.** itch's bundles (user, game, jam, main, theme_editor) have no `prefers-reduced-motion` query **[verified 2026-10-14 · itchcss-26]**. Only 5 of 62 live custom-CSS pages honour it, although 34 animate and 33 use transitions **[observed · corpus-37]**.
- **List all six selectors.** `#wrapper *` matches descendants only. It misses `#wrapper` itself and its own `::before`/`::after`, which is exactly where full-page star fields and backdrops live **[verified 2026-10-14 · repo-50, s10-02]**:

```css
@media (prefers-reduced-motion: reduce) {
  #wrapper, #wrapper::before, #wrapper::after,
  #wrapper *, #wrapper *::before, #wrapper *::after {
    animation: none !important; transition: none !important;
  }
}
```

Animations still running under emulated `reduce`, on a test page with 6 infinite animations **[verified 2026-10-14 · s10-02]**:

| Guard | Still running |
|---|---|
| none | 6 |
| `#wrapper *, #wrapper *::before` (a real-world block) | 4 |
| `#wrapper *, #wrapper *::before, #wrapper *::after` | 3: `#wrapper` and its `::before`/`::after` |
| all six selectors | **0** |

- **Cancel hover transforms there too**, e.g. `#wrapper .game_cell:hover{transform:none}` **[verified 2026-10-14 · repo-50]**.

#### 5.2 Make the un-animated state the visible one

With the guard active, an entrance written as `opacity:0` plus `animation:… forwards` (fading *to* 1) **stays at opacity 0**: the content disappears for reduced-motion users. Write entrances as `@keyframes in{from{opacity:0}}` on an element whose base opacity is 1; that one stays visible **[verified 2026-10-14 · s10-02]**. This is the check corpus-37 asks for: anything whose resting state depends on an end keyframe.

#### 5.3 Flashing and long loops

- **Flashing.** itch's quality guidelines cite the WCAG seizure guideline for animated covers, and itch may delist pages built around flashing imagery **[documented · docs-16]**. Apply the same limit to CSS: no more than 3 flashes per second **[inferred · docs-16]**.
- **Long loops.** WCAG 2.2.2 (Pause, Stop, Hide) covers auto-playing motion that lasts more than 5 s next to other content. Its sufficient techniques are G4, SCR33, G11, G152, SCR22, G186 and G191. The CSS reduced-motion technique C39 is listed only under 2.3.3 (Animation from Interactions) **[verified 2026-10-14 · s10-08]**. A reduced-motion guard is the minimum, not proof of 2.2.2 conformance. Prefer finite animations, or subtle decorative loops **[inferred]**.

#### 5.4 Don't copy these community anti-patterns

- `user-select:none` over the whole page **[community · community-40]**.
- Infinite background animations with no reduced-motion fallback **[community · community-40]**.

---

### 6. Forced colors

Results with Chrome 155 emulating `forced-colors: active` (dark system palette) **[verified 2026-10-14 · s10-05]**:

| Your CSS | Under forced colors |
|---|---|
| `background-image: linear-gradient(…)` | removed |
| `background-image: url(…)` | kept; text gets an opaque backplate |
| `box-shadow`, `text-shadow` | `none` |
| `color: transparent` text | **painted in the system text color, so visible** |
| gradient text (`background-clip:text` + transparent fill) | gradient removed; text painted in the system color (readable) |
| `border: 2px solid transparent` | **a visible system-color border** |
| card defined only by background + shadow | **loses its edge** |
| `rgba(10,18,46,.5)` background | `rgba(0,0,0,.5)` (alpha kept, color forced) |
| link color | system `LinkText` |
| `forced-color-adjust: none` | author colors and gradient kept |
| `backdrop-filter` | unchanged |

What to do **[inferred · s10-05]**:

- Give cards and buttons `border: 1px solid transparent` (or a real border), so they keep an outline.
- Text you hide with `color:transparent` reappears. If generated text is drawn over it (a "roller" or label overlay), the two overlap. Remove the overlay inside `@media (forced-colors: active)`.
- Use `forced-color-adjust:none` only for things like color swatches. Safari doesn't support it (§13).

### 7. Contrast with the theme's colors

- **Measure against the image, not the theme's BG color.** When the panel has a background image, the theme editor's BG color isn't what your text sits on. Composite any alpha first. Example: a dark-blue theme whose image has a brightest 64 px block of `#386fb7` (overall mean `#11274d`) **[verified 2026-10-14 · s10-06]**:

| Pair (WCAG 2.x) | Ratio |
|---|---|
| text `#eef3ff` on theme BG `#0b1433` | 16.26 |
| `#eef3ff` on the image's brightest block `#386fb7` | **4.58** (barely passes) |
| accent `#ffc857` on `#386fb7` | **3.31** (fails for body text) |
| muted `#a9b9e0` on `#386fb7` | **2.59** (fails) |
| `#eef3ff` / `#ffc857` on a 50% `#0a122e` card over `#3d6fba` | 9.13 / 6.60 |
| `#eef3ff` at 50% alpha, on that card | **3.56** (fails for body text) |
| itch's focus `#361275` on `#0b1433` / `#1b3367` | **1.29 / 1.14** (fails) |
| itch's default accent `#fa5c5c` on white / `#eeeeee` / `#e8e8e8` | 3.11 / 2.68 / 2.54 |
| white on `#fa5c5c` (default button) | 3.11 (large text only) |

- **Semi-transparent cards fix contrast over busy images.** Semi-transparent *text* breaks it **[inferred · s10-06]**.
- **The theme editor doesn't enforce contrast.** Check the theme's link and button colors, not only your CSS **[inferred · s10-06]**.

---

### 8. Keyboard focus

#### 8.1 itch's defaults

- itch's general rule is `:focus{outline-color:var(--itchio_input_focus_color)}` (default `#361275`), plus a hard-coded `.button:focus{outline-color:#361275}`. The browser supplies `outline-style:auto` **[verified 2026-10-14 · itchcss-25]**. On dark blues that ring is 1.1–1.5:1 **[verified 2026-10-14 · s10-06]**.
- `user.css`, `game.css` and `jam.css` all contain `.user_formatted .spoiler:focus{outline:0}` and `.button.disabled:focus{outline:0}` **[documented · itchcss-55]**. Spoilers are revealed on focus but show **no ring** **[verified 2026-10-14 · s10-16]**. A hand-written `<span class="spoiler" tabindex="0">` keeps its `tabindex` in a project description, so it is a Tab stop **[verified 2026-10-16 · live-k34]**. In a bio it keeps `tabindex` too, but its text is not hidden, because bios lack `.user_formatted` **[verified 2026-10-16 · live-k34]**.

#### 8.2 Fix all three routes

Tested against itch's real `game.css` **[verified 2026-10-14 · s10-16, itchcss-25]**:

```css
#wrapper { --itchio_input_focus_color: #ffc857; }      /* links and inputs */
#wrapper .button:focus-visible,
#wrapper .spoiler:focus-visible { outline: 2px solid #ffc857; outline-offset: 2px; }
```

| Focused element | Default | Variable only | Variable + rule above |
|---|---|---|---|
| description link | `auto 1px #361275` | `auto 1px #ffc857` | `auto 1px #ffc857` |
| `.button` | `auto 1px #361275` | **unchanged** | `solid 2px #ffc857` |
| `.spoiler[tabindex]` | **`none 0px`** | **`none 0px`** | `solid 2px #ffc857` |

Pick a ring color with ≥ 3:1 against every background it can land on (§7). Rules scoped to `#wrapper` don't reach itch's stops outside `#wrapper`, such as `#user_tools` and the site header **[verified 2026-10-14 · itchcss-25]**.

The fix also holds on `user.css` and `jam.css` pages with itch's JavaScript running. Tabbing through five real pages with the §15 templates, every stop inside `#wrapper` had a visible ring that wasn't clipped **[verified (live render) 2026-10-14 · s10-25]**. The project and jam templates contain all three routes. The profile template has the link and `.button` routes plus the card ring of §8.3; it has no spoiler route because itch's spoiler styling doesn't reach profile bios (05).

| Page | Stops inside `#wrapper` that passed |
|---|---|
| Profile, grid layout | 8 of 8 (5 through the card ring) |
| Profile, column layout | 140 of 140 (76 through the card ring) |
| Project with an HTML5 embed | 156 of 156 (the run stopped at 160 Tab presses) |
| Devlog post | 82 of 82, after the inset fix in §8.3 (79 of 82 without it) |
| Jam overview | 29 of 29 |

#### 8.3 Put the ring on the card, not the title

- **Game-title rings get clipped.** Titles in grids are line-clamped with `overflow:hidden`, so a focused title link's ring is cut off at the top and left. A custom 3 px ring with an offset shrinks to a sliver **[verified 2026-10-14 · s10-04]**.
- **A ring on `.game_cell` renders completely** and follows `border-radius` **[verified 2026-10-14 · s10-04]**.
- **Use `:has(:focus-visible)` for that card ring, not `:focus-within`.** `:focus-within` also matches after a **mouse click** on the title; `:has(:focus-visible)` matches only keyboard focus **[verified 2026-10-14 · s10-04]**:

```css
#wrapper .game_cell:has(:focus-visible) { outline: 3px solid #ffc857; outline-offset: 3px; }
```

- **Other links inside `overflow:hidden` boxes: draw the ring inside.** On devlog posts, `game.css` clips two kinds of link **[verified (live render) 2026-10-14 · s10-26]**:
  - the banner link, because `.header` has `overflow:hidden`: a 2 px ring with a 2 px offset was invisible;
  - the footer breadcrumbs, because `.inner_column .footer .breadcrumbs` has `overflow:hidden`: only the left and right edges of the ring showed.

  A negative offset puts the ring inside the link, where it shows in full. Checked on zoomed screenshots, before and after:

```css
#wrapper .header a:focus-visible, #wrapper .breadcrumbs a:focus-visible { outline-offset: -2px; }
```

#### 8.4 Other rules

- **Never remove an outline without a replacement**, as in `#wrapper a{outline:none}`. Keyboard users lose all indication of where they are **[inferred]**.
- **Skip links.** Profile, project and devlog pages have none. On jam pages, the site header's "Skip to main content" link is served pointing at a missing `#maincontent`. itch's `bundle.min.js` repairs it on load: it retargets the link to the first `.page_widget` (on jam overviews, `.view_jam_page#view_jam_<id>`, inside `#wrapper`). The link is dead only when JS doesn't run **[documented · itchcss-34]**. A live render confirmed it: the served HTML has `href="#maincontent"`; after itch's JS ran it was `#view_jam_<id>`, pointing at the `div.view_jam_page…page_widget` inside `#wrapper`, which has `tabindex="-1"`. The profile and project page had no skip link after JS either **[verified (live render) 2026-10-14 · s10-24]**. Custom CSS can neither fix nor break the link, because it sits outside `#wrapper`. Keep a clear heading structure instead **[documented · itchcss-34]**.

---

### 9. Headings: exactly one h1 that names the page

#### 9.1 Heading rules per page type

| Page (logged out) | itch's h1 | What you do |
|---|---|---|
| **Profile** | `.text_header > h1` (display name). On `.has_banner` profiles `user.css` hides `.text_header` with `display:none`, and the banner `<img>` has **no alt**. The page then has no h1 and no text alternative for the name; only `<title>` ("Name - itch.io") and any collection `<h2>`s remain **[inferred · crawlprofile-05]**. | If itch hides it, or you do, put exactly one `<h1 class="custom-…">` in the bio. itch's sanitizer keeps it, and it is in today's served HTML **[inferred · sanitizer-40]**. |
| **Project** | `.header h1.game_title`. It is `display:none` on banner (`.header.has_image`) and HTML5-embed pages, which leaves **zero visible h1** **[verified 2026-10-14 · itchcss-54, crawlproject-10]**. The banner `img` alt is the project title by default (35/37); 2/37 had creator-written alt **[verified 2026-10-14 · crawlproject-10]**. | If you hide or replace the banner, add a visible heading in the description; h1–h6 with `custom-` classes survive (h1, h5 and h6 checked on a project description **[verified 2026-10-16 · live-t06, live-t23, live-a20]**). Never hide description headings with `display:none` **[verified 2026-10-14 · crawlproject-10]**. |
| **Devlog post** | The post title is a visible `.post_header h1` **[verified 2026-10-14 · itchcss-54]**. The h1 count in the markup varies: 2 on a post whose project has a banner (the hidden project h1 + the post title), and 4 on a post that shows itch's site header (`body.has_site_header`) **[verified 2026-10-14 · s10-07]**. Never assume a fixed number. | Don't hide `.post_header h1`. Don't add another h1. |
| **Jam overview** | Two visible h1s: the site header's `h1.title` (logo, outside `#wrapper`) and `h1.jam_title_header` **[verified 2026-10-14 · itchcss-54]**. Descriptions often add their own h1s too: 30 across 16 jams **[observed · crawljam-46]**. | Don't hide or demote `.jam_title_header`. Scope title styles to `.jam_title_header` and description styles to `.jam_content h1`, never to `#wrapper h1` **[observed · crawljam-46]**. Prefer `h2` and lower in the description **[inferred]**. |

#### 9.2 Hiding and alt text

- `display:none` removes a heading from the accessibility tree entirely **[verified 2026-10-14 · a11y-03]**. Hiding itch's h1 is fine only if yours replaces it.
- **Keep images and their alt.** 59 of 64 sampled project pages had no screenshot alt, but some creators do write it: 5/64 pages, and 4 of 8 recent CSS-styled pages **[verified 2026-10-14 · crawlproject-10, crawlproject-67]**. Never hide banner or screenshot `<img>` elements, and never swap them for CSS background images. Restyle the `img` itself instead (radius, border, shadow) **[verified 2026-10-14 · crawlproject-67]**.

#### 9.3 Accessibility has to come from semantic HTML

`aria-*`, `role` and `id` don't survive the sanitizer **[inferred · sanitizer-40]**. The private repo saw `aria-hidden` stripped on save (2026-10-08) **[observed · s10-10]**, and a project description lost `id`, `aria-label`, `aria-hidden` and `role` **[verified 2026-10-16 · live-a01, live-a03 to live-a05, live-a20]**, as did a bio **[verified 2026-10-16 · live-a01, live-a04, live-a05, live-a20]**. Build accessibility from elements the sanitizer keeps **[inferred · sanitizer-40]**. On a project description every element below survived, with `figure`, `figcaption`, `details` and `summary` losing all their attributes **[verified 2026-10-16 · live-t04, live-t06, live-t08, live-t09, live-t23, live-g01, live-a09]**:

- headings `h1`–`h6`;
- `img[alt]`;
- `span[lang]`;
- `abbr`;
- `figure`/`figcaption`;
- `details`/`summary`.

For icon links, use visible text, not `aria-label`.

#### 9.4 Letter-split headings change the name

- **What happens.** Wrapping each letter in `display:inline-block` (also `inline-grid`, or making the letters flex children) makes Chrome name the heading "M i r o k s h i". Plain inline spans keep "Mirokshi" **[verified 2026-10-14 · repo-59, s10-14]**. Firefox 142 and WebKit 26 do the same ("M i r o" vs "Miro"), and so does Chrome's Windows UI Automation tree, where each inline-block letter becomes its own group **[verified 2026-10-14 · s10-27, s10-28]**.
- **Why you can't just use inline spans.** Per-letter waves and tilts need inline-block, because transforms don't apply to inline boxes **[inferred]**.
- **Why `aria-label` doesn't help.** It restores the name in Chrome, but `aria-*` doesn't survive the sanitizer: on a project description and in a bio an `h1`'s `aria-label` was dropped **[verified 2026-10-14 · repo-59; inferred · sanitizer-40; verified 2026-10-16 · live-a20]**.
- **Two patterns that keep the name.** Both names were verified in Chrome 155, Firefox 142 and WebKit 26. In Chrome's UI Automation tree the alt-silenced letters carry no text at all **[verified 2026-10-14 · s10-14, s10-27, s10-28]**. These are accessibility-tree results: what NVDA, JAWS or VoiceOver actually **speak** for these patterns is untested (§10.4). Recommend them as the best-supported option, not as proven.
  - Animate whole words, separated by a real space: `<span>Hello</span> <span>world</span>` is named "Hello world".
  - Put the word in an sr-only span, and draw the letters as generated content with empty alt text. The heading is named "Miro":

```html
<h1 class="custom-title"><span class="custom-sr">Miro</span><span class="custom-l"></span><span class="custom-l"></span>…</h1>
```
```css
#wrapper .custom-l:nth-child(2)::before { content: "M"; content: "M" / ""; }   /* one rule per letter */
```

  - Caveats for the second pattern: without the `/ ""` part (or in an engine without alt syntax) the letters are read **as well**, giving "Miro x x" in all three engines **[verified 2026-10-14 · s10-14, s10-27]**. itch's sanitizer keeps **empty** `custom-` spans: a project description and a bio kept exactly this `h1`, an sr-only span plus two empty `custom-l` spans **[verified 2026-10-16 · live-t23]**.
- **Inline-block markers before punctuation.** `<span>Hi!</span>, I am` is named "Hi! , I am" once the span is `inline-block`/`inline-grid` **[verified 2026-10-14 · repo-59]**. Put the punctuation inside the span: an `inline-grid` roller span holding "Hi!," gave "Hi!, I make games" in Chrome, Firefox and WebKit **[verified 2026-10-14 · s10-27]**.

---

### 10. Screen readers, hidden text and generated content

#### 10.1 What each technique exposes

Each technique, checked in Chrome's accessibility tree (CDP), in `innerText` and in copied text **[verified 2026-10-14 · a11y-03, localtests-33, support-29, support-28, a11y-57]**:

| Technique | In Chrome's AX tree | In `innerText` / copy |
|---|---|---|
| `display:none` | no (`notRendered`) | no |
| `visibility:hidden` | no (`notVisible`) | no |
| `opacity:0`, `color:transparent`, clip-pattern sr-only, `font-size:0`, `text-indent:-9999px` | **yes**, full text in the name | yes (transparent text is selectable and copied) |
| `::before`/`::after` `content:"x"` | **yes**, part of the name | no |
| `content:"x" / ""` | no (excluded from the name) | no |
| `content:"x" / "label"` | the alt replaces the glyph | no |

- `[hidden]` and `left:-9999px` were checked only for `innerText`: `[hidden]` is excluded and `left:-9999px` included **[verified 2026-10-14 · localtests-33]**.
- These started as Chrome's *computed names*. Firefox 142, WebKit 26 and Chrome's Windows UI Automation tree agree on every row they were checked on: `color:transparent`, `visibility:hidden`, generated content with and without alt (§10.4) **[verified 2026-10-14 · s10-27, s10-28]**. What NVDA, JAWS or VoiceOver actually **speak** is still **not tested** **[verified 2026-10-14 · a11y-03, s10-30]**.

#### 10.2 Rules

- **Choose the hiding technique on purpose.**
  - Silent decoration: `display:none`.
  - Text only screen readers should get: `position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap`.
  - Never `opacity:0` or transparent text for something that must stay silent: it stays in the AX tree **[verified 2026-10-14 · a11y-03]**.
- **Don't trust MDN's sentence** that generated content "will not be represented in the accessibility tree". Chrome 155 names `h2::before{content:"PRE "}` as "PRE Base" and a link with `::after{content:" →"}` as "Next →" **[verified 2026-10-14 · a11y-57]**. Treat generated text as spoken unless it has empty alt. Since some browser/AT pairs may skip it, never put essential information only in `content` **[verified 2026-10-14 · a11y-57]**.
- **Give decorative generated text an empty alt, with a fallback line first** **[verified 2026-10-14 · support-28, repo-51, localtests-26]**:

```css
#wrapper .custom-rating::before { content: "\2605"; content: "\2605" / ""; }
```

  - Alt text for `content` is Baseline since 2024-07-09 (Chrome 77, Firefox 128, Safari 17.4).
  - In Chrome's AX tree, `"★Hello"` becomes `"Hello"`, and `/ "Rated: "` replaces the glyph.
  - The alt part can come from `var()` **[verified 2026-10-14 · localtests-26]**.
  - Engines without alt syntax drop the second declaration and keep the first, so they still announce the glyph **[verified 2026-10-14 · repo-51]**.
  - Firefox 142 and WebKit 26 give the same names: "★Plain star", "Silent star" and "Rated: Labelled star". A link with `::after{content:" →"}` is named "Next →" unless the arrow has `/ ""` **[verified 2026-10-14 · s10-27]**.
- **Transparent-text replacement keeps the real words.** `<span style="color:transparent">Hi!</span> I make games` is announced in full; `visibility:hidden` would drop "Hi!" **[verified 2026-10-14 · support-29]**. Remember that it reappears under forced colors (§6). If you style `::selection`, give the transparent span its own `::selection{color:transparent;background:transparent}`, or selecting the sentence reveals it **[observed · s10-10]**. The roller variant, an `inline-grid` span with transparent text and a generated `::before` list with `/ ""`, is named "Hi!, I make games" in Chrome, Firefox and WebKit, and the generated list is absent from Chrome's UI Automation tree **[verified 2026-10-14 · s10-27, s10-28]**.
- **itch's spoilers don't hide plain text from screen readers.** `.spoiler` conceals plain text with a transparent text fill, so the text stays in the accessibility tree before any focus ("Before SECRET TEXT after." in Chrome 155, Firefox 142 and WebKit 26). Text wrapped in an element inside the spoiler is `visibility:hidden` until focus, so it is absent until the spoiler is focused **[verified 2026-10-14 · s10-29]**. On a live project description a hand-written spoiler was hidden the same way before focus: text fill transparent, colour and background both `rgb(34, 34, 34)` **[verified 2026-10-16 · live-k34]**. So plain spoiler text reaches screen-reader users at once, while bold or otherwise wrapped spoiler text stays hidden from them until focus **[inferred · s10-29]**. Whether a screen-reader user can find and open a spoiler is untested. Custom CSS doesn't change any of this unless it restyles `.spoiler`.

#### 10.3 Know your tools' limits

- **Agent browser tools.** `read_page`/`find` report the text of `display:none`, `visibility:hidden`, `[hidden]` and `aria-hidden` elements, and never show `::before`/`::after` text or its alt. `get_page_text` follows `innerText` **[verified 2026-10-14 · localtests-34; observed 2026-10-12 · repo-52]**.
- **Page JavaScript.** It can't read the AX tree either: `computedRole`/`computedName` aren't exposed **[verified 2026-10-14 · localtests-34]**.
- **What to use instead.** CDP `Accessibility.getPartialAXTree`/`getFullAXTree`, or the DevTools Accessibility pane **[verified 2026-10-14 · a11y-50]**.
- **Across engines.** Playwright's `page.accessibility.snapshot({root, interestingOnly:false})` reads Firefox's and WebKit's own accessibility trees. On Windows, PowerShell's `System.Windows.Automation` reads a headed browser's UI Automation tree, the platform layer screen readers consume (`knowledge/evidence/gapfill-s10-tools/pw-ax.mjs`, `uia-dump.ps1`) **[verified 2026-10-14 · s10-27, s10-28]**.

#### 10.4 Cross-engine results, and what is still unverified

The recommended patterns were re-checked outside Chrome's computed name, on one probe page (`gapfill-s10-tools/sr-probe.html`, own code) **[verified 2026-10-14 · s10-27, s10-28]**:

- Chrome 155 over CDP.
- Firefox 142.0.1 and WebKit 26.0 (the Windows port, not Safari), through Playwright 1.56.1 accessibility snapshots.
- Chrome 155's **Windows UI Automation (UIA) tree**, read from a headed window started with `--force-renderer-accessibility`. Chrome exposes it natively: DOM ids appear as UIA AutomationIds.

| Pattern | Name in Chrome, Firefox and WebKit | Text leaves in Chrome's UIA tree |
|---|---|---|
| sr-only word + inline-block letters drawn with `content:"M" / ""` | "Miro" (all three) | "Miro", plus 4 empty groups with no text |
| same, letters **without** alt | "Miro x x" (all three) | "Miro", "x", "x" |
| inline-block letters `<span>M</span>…` | "M i r o" (all three) | 4 groups: "M", "i", "r", "o" |
| plain inline letters | "Miro" (all three) | "M", "i", "r", "o" (no groups) |
| inline-block words with a real space | "Hello world" (all three) | "Hello", "world" in 2 groups; no leaf for the space (Firefox has one, WebKit doesn't) |
| `::before{content:"★ "}` | "★Plain star" (all three) | "★", "Plain star" |
| `content:"★ " / ""` | "Silent star" (all three) | "Silent star" only |
| `content:"★ " / "Rated: "` | "Rated: Labelled star" (all three) | "Rated: ", "Labelled star" |
| `color:transparent` "Hi!" + " I make games" | "Hi! I make games" (all three) | "Hi!", " I make games" |
| `visibility:hidden` "Hi!" | "I make games" (all three) | " I make games" |
| roller: transparent "Hi!," + generated list with `/ ""` | "Hi!, I make games" (all three) | "Hi!,", " I make games" |
| link + `::after{content:" →"}` | "Next →" (all three) | link "Next →" |
| link + `::after` with `/ ""` | "More" (all three) | link "More" |

**What this shows.** Three engines' accessible-name implementations agree, so none of the recommendations rests on a Chrome-only quirk. In the platform tree that Windows screen readers read, alt-silenced generated text has **no text node at all**, so a reader walking that tree has nothing to speak for it **[inferred · s10-28]**.

**What it doesn't show.** It doesn't prove what anyone hears:

- No screen reader was run. NVDA and JAWS are not installed on the Windows test machine, and installing one needs the owner's go-ahead **[verified 2026-10-14 · s10-30]**. VoiceOver needs a Mac or an iPhone. Narrator was not run either: it speaks aloud and takes over the keyboard.
- NVDA and JAWS read Chrome and Firefox through IAccessible2/MSAA, not UIA. That layer was not read. It is presumably built from the same internal tree **[inferred]**.
- Firefox's platform tree could not be read: Playwright's Firefox build exposed no document to UIA **[verified 2026-10-14 · s10-28]**.
- WebKit 26 here is the Windows port. Safari with VoiceOver on macOS or iOS was not tested.
- MDN's warning that some browser and screen-reader pairs ignore generated content is therefore neither confirmed nor refuted for real assistive technology.

**Probe that would close it.** No itch account is needed, but a person or the owner's go-ahead is:

1. Install NVDA from nvaccess.org and open *Tools → Speech Viewer*.
2. Serve the folder with `python -m http.server`. Open `knowledge/evidence/gapfill-s10-tools/sr-probe.html` and `s10-tools/s10-letters.html` in Chrome, then in Firefox. For `sr-spoiler.html`, also put a same-day copy of itch's `game.css` next to it as `itch.css`.
3. On each page:
   - press `H` through the headings;
   - read the whole page in browse mode (`NVDA+↓`);
   - open the links list (`NVDA+F7`);
   - copy the Speech Viewer text.
4. **Pass** when the first heading is spoken as "Miro" (not "M i r o", and not "Miro" plus letters), the silent star and the `/ ""` arrow are not spoken, and the roller line has no "Hola". Also record whether the inline-block letters are spelled out, and whether "Hello world" runs together.
5. Optionally repeat with VoiceOver (Safari on macOS and iOS) and with Narrator (Edge). Then add a speech column to the table above and retag the §9.4 and §10.2 claims.

---

### 11. Text size, zoom and spacing

- **itch sizes its text in px.** Font sizes in `user.css` are 61 px / 0 rem / 17 em; in `game.css` 172 px / 0 rem / 10 em **[verified 2026-10-14 · s10-09]**. The browser's default-font-size setting therefore scales only *your* `rem` text. itch's text scales only with page zoom **[inferred · s10-09]**.
- **Never combine `white-space:nowrap` with `rem` minimum sizes.** Tested on a real profile title with `nowrap` and `font-size:clamp(3rem,10vw,6rem)` **[verified (script-free harness) 2026-10-14 · a11y-31]**:

  | Change | Result |
  |---|---|
  | none (default 16 px font) | passed reflow at 320, 375, 640, 800 and 1280 px |
  | browser default font raised to 32 px | horizontal scroll at 320/375 px (scrollWidth ~480–515, varying per visit because that profile randomizes its fonts) |
  | `white-space:normal` | removes the scroll but splits the letter-split name mid-word ("Mir / oksh / i") |
  | keep `nowrap`, use `font-size:min(10vw,6rem)` | removes the scroll **and** keeps the word whole |

  Test at 320 px with a 200% default font (WCAG 1.4.4) as well as at 400% zoom (1.4.10). If text must wrap, wrap between words, not between inline-block letters **[verified (script-free harness) 2026-10-14 · a11y-31]**. itch's JS doesn't touch bio text, so the harness should not matter here **[inferred · s10-17]**; at the default font size, both live-rendered profiles had no horizontal scroll at 320 px **[verified (live render) 2026-10-14 · s10-25]**.
- **Text spacing (WCAG 1.4.12).**
  1. Inject the override:
     ```css
     *{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}
     p{margin-bottom:2em!important}
     ```
  2. Scan for `overflow:hidden`/`clip` elements whose scroll size exceeds their client size.

  On the reference profile, the only clipped element was a fixed-height decorative widget **[verified (script-free harness) 2026-10-14 · a11y-45]**. Avoid fixed em/px heights plus `overflow:hidden` on text containers. itch already clamps `.game_title` to 2 lines, so don't add clamps to essential text **[verified (script-free harness) 2026-10-14 · a11y-45]**. The scan finds clipping, not overlap.

---

### 12. External imports and content blockers

- **The page must work with every external `@import` gone.** Delete the import rule in memory to simulate a blocker or an outage (§14.5) **[observed 2026-10-12 · repo-54]**. On 2026-10-12, the private repo's owner saw Brave Shields block their own CSS service; the profile fell back to its static design **[observed · s10-10]**.
- **Avoid `custom-` class names that ad blockers hide.** EasyList's generic hiding list contains `##.custom-ad`, `##.custom-ad-area`, `##.custom-ad-container`, `##.custom-ads`, `##.custom-advert-banner` and `##.custom-sticky-ad-container` **[verified 2026-10-14 · s10-11]**. An element with any of those classes vanishes for blocker users.

### 13. Firefox and Safari

No Firefox, Safari or iOS browser was run for layout or visuals. Firefox 142 and WebKit 26 (the Windows port, through Playwright) were run only to read accessibility trees (§10.4). The versions below are MDN browser-compat-data, fetched 2026-10-14 **[documented · s10-12]**:

| Feature | Chrome | Firefox | Safari | Note for itch CSS |
|---|---|---|---|---|
| `content: "x" / "alt"` | 77 | 128 | 17.4 | Use the two-declaration fallback (§10.2) |
| `@media (prefers-reduced-motion)` | 74 | 63 | 10.1 | Safe everywhere |
| `@media (forced-colors)` | 89 | 89 | 16 | |
| `forced-color-adjust` | 89 | 113 | **no** | |
| `@media (prefers-contrast)` | 96 | 101 | 14.1 | |
| `:focus-visible` | 86 | 85 | 15.4 | |
| `:has()` | 105 | 121 | 15.4 | Needed for the card ring in §8.3 |
| `@media (hover)` | 38 | 64 | 9 | |
| `backdrop-filter` | 76 | 103 | 18 | Safari 9–17 need `-webkit-backdrop-filter`; declare it **before** the unprefixed one. Chrome 155 rejects the prefixed form **[verified 2026-10-14 · s10-12]**. |
| `background-attachment: fixed` | 1 | 2 | 15.4 | **iOS Safari: "recognized but has no effect"** (WebKit bug 275247). Expect a scrolling background on iPhones. |
| `overflow: clip` | 90 | 81 | 16 | |

How Firefox and Safari draw `outline-style:auto` with itch's outline color is untested. Their accessible names for generated content match Chrome's (Firefox 142, WebKit 26; §10.4), but what their screen readers actually speak is untested. Check both by hand.

---

### 14. Building a local preview harness

#### 14.1 Script-free real-page harness

This harness is fast, fully offline and fine for colors, the cascade, text and accessible names. But it **freezes everything itch's JavaScript changes at runtime** (listed in §14.8). For layout, overlays, covers, embeds and countdowns, the live render in §14.7 is the more faithful method. Results from this harness are tagged `verified (script-free harness)`.

1. **Fetch once, logged out.** Fetch the page and the itch bundle it links (`static.itch.io/user.css`, `game.css` or `jam.css`, with its `?<build>` query) using GET and a normal browser UA. Keep the raw copies git-ignored: they are itch's and other creators' content, so never publish them.
2. **Strip and rewrite.** Remove every `<script>` and the `csrf_token` meta, and point stylesheet and image URLs at local copies **[verified 2026-10-14 · a11y-50, repo-53]**. `knowledge/evidence/a11y-tests/build-harness.py` does this with `old=>new` pairs. **Never split pairs on `=`**: itch CDN image URLs contain base64 with `==` padding, and a naive split silently breaks the panel background **[verified 2026-10-14 · a11y-50]**.

```sh
curl -sS -A "$UA" -o raw/page.html "https://<user>.itch.io/"
python -I build-harness.py raw/page.html pages/page.html \
  "https://static.itch.io/user.css?<build>=>../raw/user.css"
python -m http.server 8080        # open http://localhost:8080/pages/page.html
```

3. **Point the custom-CSS slot at your source.** Keep itch's head order, so the cascade is reproduced: your CSS wins ties against the theme **[verified 2026-10-14 · s10-07, localtests-49]**.

   | Page | Head order (logged out) | Where your CSS goes |
   |---|---|---|
   | Profile | `link user.css` → scripts → `style#user_theme` → `style#custom_css` | replace `style#custom_css`'s contents with `@import url("../src/main.css");` **[observed · repo-53]** |
   | Project / devlog | `link game.css` → scripts → `style#game_theme` → `style#custom_css` (absent when the project has no CSS) | same |
   | Jam overview | `link jam.css` → scripts → `style#jam_theme` (generated theme **and** host CSS) | append at the **end** of `style#jam_theme` **[observed · crawljam-39]** |

   For jams, `crawljam-tools/verify2/scripts/mk2.py` does this. Match `style[…id="jam_theme"]` and `jam.css?\d+` loosely, because attribute order and the build stamp change between deploys **[observed · crawljam-39]**.
4. **Keep the theme block current.** Re-sync `style#user_theme` / `game_theme` / `jam_theme` whenever the theme changes; a stale copy gives wrong colors **[observed · repo-53]**. Also copy the live panel background rule, e.g. `.user_page_wrap{background-image:…;background-repeat:repeat;background-position:50% 0}`, so you can prove your `#wrapper` background longhands override it **[observed · repo-53]**.
5. **Know what freezes without scripts.** `#user_tools` keeps its `hidden` class, and lazy thumbnails keep `data-lazy_src` with no `src`. Judge those elements from itch's JS or from a JS-enabled run, not from the harness **[verified 2026-10-14 · a11y-50]**. The full list, measured with a live render, is in §14.8.

#### 14.2 Synthetic harness (isolated experiments)

Write your own markup with itch's ids and classes (`<div class="user_page_wrap" id="wrapper"><div class="user_page">…`) in itch's head order: base CSS → theme `<style>` → `style#custom_css` as the last stylesheet. It needs **[verified 2026-10-14 · localtests-49]**:

- **a doctype.** Quirks mode masks MIME errors.
- **`<meta charset="UTF-8">`.**
- **a second local origin** (the same folder served on another port), to reproduce third-party `@import` behaviour: the `cssRules` `SecurityError` and font/mask CORS failures.

`python -m http.server` sends MIME types by extension, with no charset and no CORS headers. `knowledge/tests/index.html` runs 18 such pages (168 PASS, 0 FAIL on 2026-10-14) from `http://localhost:8090`, with the same folder on `:8091` **[verified 2026-10-14 · localtests-49]**.

#### 14.3 Automated checks with headless Chrome over CDP

Start an isolated Chrome: `chrome --headless=new --remote-debugging-port=N --user-data-dir=<temp>`. Then run one CDP call per check. `knowledge/evidence/a11y-tests/cdp.mjs` needs only Node 22. Set `CDP_BLOCK_ITCH=1` so repeated harness loads never reach itch.io or itch.zone. After injecting CSS, wait ~300 ms before reading computed values **[verified 2026-10-14 · a11y-50]**.

| Check | CDP method | DevTools equivalent |
|---|---|---|
| Accessible names | `Accessibility.getPartialAXTree` / `getFullAXTree` | Elements → Accessibility pane |
| Reduced motion, forced colors, contrast preference | `Emulation.setEmulatedMedia` | Rendering panel |
| Touch / no hover | `Emulation.setTouchEmulationEnabled` + `Input.dispatchTouchEvent` | Device toolbar |
| Exact widths (320, 375…) | `Emulation.setDeviceMetricsOverride` | Device toolbar |
| Large default font | `Page.setFontSizes` | Browser font settings |
| Tab order and rings | `Input.dispatchKeyEvent` (Tab) + `Page.captureScreenshot` with a clip | Keyboard |
| Running animations | `Runtime.evaluate` → `document.getAnimations().filter(a => a.playState === 'running')` | Animations panel |

#### 14.4 Claude's Browser preview pane: caveats

- **Emulation.** The `mobile` preset emulates a touch phone: `hover:none`, `pointer:coarse`, DPR 2, 5 touch points, 375×812. `colorScheme` flips `prefers-color-scheme` live. **`prefers-reduced-motion` can't be emulated there**: use CDP or the OS setting **[verified 2026-10-14 · localtests-35]**. In that pane, any width below 768 px emulates a touch device, so test hover effects at ≥768 px **[observed 2026-10-12 · repo-54]**.
- **Frozen time while hidden.** In a hidden pane, `requestAnimationFrame` never fires, and new transitions and animations stay pending at their start value. `document.timeline` may advance after a screenshot, making pending transitions jump ahead. Never verify motion by waiting: pause it and seek (`animation-play-state:paused` with a negative delay, or `Animation.currentTime`), then read computed styles **[verified 2026-10-14 · localtests-36]**.
- **Caching.** The pane caches files from `http.server`. After an edit, run `await fetch(url,{cache:'reload'})` for each changed file, then navigate again **[verified 2026-10-14 · localtests-49; observed · repo-53]**.
- **Accessibility.** `read_page`/`find` can't validate CSS-hidden or generated text (§10.3) **[verified 2026-10-14 · localtests-34]**.

#### 14.5 Verifying values

- **Read `getComputedStyle`, not the stylesheet text.** Normalize colors before comparing: in Chromium 152, `color-mix()` and relative-color results serialize as `color(srgb 0 0.501961 0)`, not `rgb(0, 128, 0)` **[verified 2026-10-14 · localtests-46]**.
- **Freeze an animation at a moment.** Take `el.getAnimations({subtree:true})` (it includes pseudo-elements), `pause()` it and set `currentTime` **[observed 2026-10-12 · repo-54]**.
- **Swap or remove an external import without editing your source** **[observed 2026-10-12 · repo-54]**:
  1. Find your sheet: walk `document.styleSheets` → `CSSImportRule.styleSheet`. Wrap every `cssRules` read in try/catch, because cross-origin sheets throw `SecurityError`.
  2. `deleteRule(i)` removes the import, which simulates a blocker or an outage.
  3. To swap instead, follow it with `insertRule("@import url('http://localhost:3000/x.css')", i)` at the **same index**, which keeps the real cascade order.

#### 14.6 Checking live pages politely

- **Expect throttling.** itch throttles anonymous traffic with `429 Too Many Requests` (openresty, about 568 bytes, no `Retry-After`) **[verified 2026-10-14 · crawlprofile-47; observed · external-52]**. The budget appears to be shared per IP **[observed · repo-55]**:
  - 429s came at 2.5–5 s spacing, at 30 s when other clients shared the IP, and once 7.5 minutes after the client's own previous request;
  - 33 requests at ~7.5 s spacing got none **[observed · crawljam-39, repo-55, crawlprofile-47]**.
- **Space requests ≥ 7 s apart, check every status code, and back off 60–120 s on a 429.** Retries after 10–20 s sometimes succeeded **[observed · crawljam-39, repo-55, external-52]**.
- **Validate every saved response before analysing it.** Cloudflare sometimes serves a "Just a moment..." challenge with **status 200**. Require a page marker such as `user_page`, `view_game_page` or `inner_column` **[observed · external-52]**.
- **Honor `robots.txt`.** It disallows `/embed/`, `/embed-upload/`, `/search`, `/checkout/`, `/game/download/`, `/bundle/download/`, `/register-for-purchase/` and `/email-feedback/`. Profile and browse pages are allowed **[verified 2026-10-14 · crawlprofile-47]**.
- **Find real examples to inspect.** Add the `css` facet to a browse URL: `https://itch.io/games/css`, `/game-assets/css`, `/tools/css`, `/physical-games/css`, `/games/css/platform-web`, with `?page=N` for more. 16/16 sampled pages from those lists had `style#custom_css`, against 3/28 popular unfiltered pages **[verified 2026-10-14 · crawlproject-51]**. No official documentation of this facet was found.

#### 14.7 Live render with itch's JavaScript (most faithful)

Load the **real page URL** in an isolated headless Chrome and let itch's own scripts run, while CDP's `Fetch` domain swaps in your CSS **[verified (live render) 2026-10-14 · s10-17]**:

1. Start `chrome --headless=new --remote-debugging-port=N --user-data-dir=<temp>`.
2. Call `Fetch.enable` with the pattern `*` at the `Request` stage.
3. Answer the document request with `Fetch.fulfillRequest`. Serve a saved logged-out copy of the page (one polite GET) with your test CSS:
   - profile, project or devlog: put it in `style#custom_css` (add that element before `</head>` if the page has none);
   - jam: append it at the **end** of `style#jam_theme`.
4. Serve `static.itch.io` and `img.itch.zone` from a write-once local mirror. Fill any miss with a GET, at most one per 1.1 s, counted against a budget.
5. Let Google Fonts through. Fail everything else: analytics, itch's view-counter URLs, XHR to itch.io, game iframes and any non-GET request.
6. Wait for `load`, then until nothing has been pending for 600 ms, then 1 s more. Read computed values, the AX tree, or screenshots.
7. Re-render more CSS variants from the same saved copy. They cost no further itch requests.

`knowledge/evidence/gapfill-s10-tools/lr.mjs` implements this in Node 22 with no dependencies; `runtime-checks.mjs`, `template-checks.mjs` and `extra-checks.mjs` use it.

- `LR_NEW_IMAGES=placeholder` answers images missing from the mirror with a grey PNG of the size in their URL.
- Hover GIFs get a 1×1 placeholder unless `LR_REAL_GIFS=1`.
- Cost in this session: 5 page GETs (≥ 7 s apart, §14.6) and 68 static and image GETs filled the mirror for several hundred renders. That is 73 itch requests in all: all 200, no 429 **[verified 2026-10-14 · s10-17]**.

**Caveats** **[verified (live render) 2026-10-14 · s10-17]**:

- **Headers.** The rewritten document carries only a `Content-Type` header. That loses nothing CSS-relevant: itch sends no CSP on profiles, jams or devlogs, and only `frame-ancestors` on projects **[documented · corpus-24]**; the project header, and its absence on the profile (owner and logged out) and on a draft devlog post (owner), were confirmed live **[verified 2026-10-16 · live-dom]**.
- **User agent.** The UA is `HeadlessChrome` unless you override it. itch's JS reads it (`I.is_mobile()`), so set a phone UA with `Emulation.setUserAgentOverride` for mobile checks: the embed-width pin in §14.8 depends on it.
- **Blocked requests.** Blocked counters and analytics don't change layout; game iframes stay blank.
- **Stale mirrors.** The bundles' `?<build>` stamp changed during this session (`?1791981660`, then `?1791985261`). Refetch the page and its bundles before trusting an old mirror.

#### 14.8 What itch's JavaScript changes (measured)

All of the following is invisible in a script-free harness (§14.1). Each row was measured on real logged-out pages with itch's JS running **[verified (live render) 2026-10-14 · s10-18 to s10-24]**. The `runtime-checks.mjs` rows were run twice, hours apart, with identical results. The lazy-cover scroll and the jam margins were run once:

| What | With itch's JS | What it means for your CSS |
|---|---|---|
| **Grid sizer** (grid-layout profiles) | Two `<style itchio-grid-sizer>` elements are appended **after** `style#custom_css`. They set `--itchio_grid_gap` (20 px; 10 px at 420 px), the cell width and the column count, plus `grid-template-columns: repeat(3, 306px)` at 1280 px. A resize rewrites them: 268 px columns at 900 px, `repeat(2, 177px)` at 420 px. | A class-only rule such as `.mode_grid .user_game_grid{grid-template-columns:…}` loses, because it has the same specificity and comes earlier. `#wrapper .user_game_grid{…}` wins at every width and survives resizes. Setting `--itchio_grid_gap` on `#wrapper` or `.user_page` does nothing, because the sizer redeclares it on the grid itself. Setting it, or `column-gap`, on `#wrapper .user_game_grid` widens the gap, but the sizer still sizes columns for 20 px, so the grid overflows (980 px of content in a 960 px grid). Set the columns too when you change the gap **[inferred · s10-18]**. |
| **`#wrapper` min-height** (profiles) | An inline `min-height` equal to the viewport height minus `#wrapper`'s bottom padding. With itch's 50 px padding that is 850 px in a 900 px window, and 550 px after resizing to 600. It was 900 with padding 0 and 790 with 110. | `#wrapper{min-height:0}` loses to the inline style, and only `!important` wins. Every profile is at least one window tall. |
| **Footer spacing** (profiles) | Same results at 900 and 400 px window heights. `margin-top` on `.footer` changed nothing (the gap above it stayed 34 px). `margin-bottom:20px` cut the gap to 14 px. `#wrapper{padding-bottom:0}` made the footer overlap the content by 16 px; `110px` gave a 94 px gap. | To add space above the footer, raise `#wrapper`'s `padding-bottom`. This confirms repo-24 with JS running. |
| **`#user_tools`** (profiles) | `.hidden` removed; Follow button shown at top-right. | See §2.3, including the fixed-layer overlap. |
| **Lazy covers** | 5-game grid profile: all 5 covers loaded at load + 1 s. 67-game column profile: 2 of 67 had a `src` at load + 1 s, and 25 after scrolling through the page. Thumbnail boxes were 250 or 159 px tall before and after loading. | Lazy loading didn't move the layout, but judge cover styling (`object-fit`, aspect) only on loaded covers. |
| **Equal-height cards** | 1280 px, no fix: 352, 341, 335, 318 and 318 px. `align-items:stretch` alone equalised each row (352 ×3, 318 ×2). Stretch + `grid-auto-rows:1fr` + flex-column cells: all 352 px (all 322 at 900 px). | Use the full fix (§15, profile template). This confirms repo-33 with real covers loaded. |
| **GIF hover overlay** | On hover, a script sets an inline `background-image:url(…gif)` on `.gif_overlay`, and its opacity goes from 0 to 1. | `#wrapper .gif_overlay{background-image:none}` does **not** stop it. `!important` does (computed `none`), and `display:none` hides the overlay. |
| **Wide HTML5 embed** (project, 1280×720 frame) | With a desktop UA, inline `width:1280px; max-width:1280px; min-height:…` lands on `#inner_column` at 1400, 1000, 800 and 375 px windows, so the page scrolls horizontally (scrollWidth 1300 at 1000 and 800 px). With an Android Chrome UA at 320 px, nothing overflowed. | `#wrapper #inner_column{max-width:960px}` loses to the inline style. With `max-width:960px!important; width:auto!important` the column is 960 px, but the 1280 px frame is then clipped by its `overflow-x:hidden`. Don't fight the pin. Don't add a border to `#inner_column` either: an earlier template draft with a 1 px border measured 1282 px. Use an inset `outline` (§15). |
| **Jam countdown** | The server sends six empty `.block_value`s. JS fills them, and adds `.hidden` (`display:none`) to zero units: years and months here, with label "Starts in". | Style the blocks that are shown. Don't assume there are six. |
| **Jam skip link** | `#maincontent` is retargeted to `#view_jam_<id>`. | See §8.4. |

Projects have an inline `min-height` too, on `#inner_column`: 618 px in a 708 px tall window in the owner's view of a draft project, and 548 px in a 638 px window on its draft devlog post **[verified 2026-10-16 · live-dom]**. That a script sets it, as on profiles, and that logged-out visitors get it as well, is **[inferred]**.

The live profile matched the profile rows above on 2026-10-16 (Brave, 708 px tall window, after itch's scripts): two `style[itchio-grid-sizer]` followed `style#custom_css`, `#wrapper` had `min-height: 658px` logged out (708 − 50 px padding) and `608px` for the owner, and the logged-out `#user_tools` had lost `.hidden` **[verified 2026-10-16 · live-dom]**. The owner's 50 px less fits `user.min.js` passing the site header's height as the offset (04 §9.1) **[inferred]**.

---

### 15. Starter templates (profile, project + devlog, jam)

Three original, minimal starting points. They combine only rules that were verified elsewhere in this knowledge base: `#wrapper` scoping, background longhands, a complete focus fix, card rings, a six-selector reduced-motion guard, forced-colour edges, equal-height cards and contrast-checked colours. Each one was then tested end to end, on real logged-out pages with itch's JavaScript running (§14.7) **[verified (live render) 2026-10-14 · s10-25, s10-26]**. Source files: `knowledge/evidence/gapfill-s10-tools/templates/` (`*.css` readable, `*.min.css` to paste).

#### 15.1 Sizes

- **How they were built.** Each file was minified with the string-aware `gapfill-s10-tools/minify.py` and measured with the 01 §3 snippet. Chrome parsed source and minified output to identical CSSOM rules.
- **Profile cap.** All three fit the profile cap with room to spare, so you have space for your own rules.

| Template | Paste into | Readable source | Minified (chars = UTF-8 bytes, 0 line breaks) | Rules |
|---|---|---|---|---|
| `profile.css` | Edit theme → CSS (profile) | 2,211 B | **1,643** | 15 |
| `project.css` | Edit game → custom CSS; also styles that project's devlog posts and comments page | 2,280 B | **1,483** | 13 |
| `jam.css` | Edit jam → Theme → Custom CSS | 1,984 B | **1,450** | 10 |

#### 15.2 The templates

Change the palette tokens first. The colours are a dark theme; check them against your own background image (§7).

```css
/* PROFILE starter. Every selector starts with #wrapper. */
#wrapper {
  --ink: #eef3ff; --muted: #c3cfee; --accent: #ffc857;
  --card: rgba(10, 18, 46, .82); --line: rgba(238, 243, 255, .25);
  --itchio_input_focus_color: var(--accent);
  position: relative; isolation: isolate; overflow-x: clip;
  /* longhands only: the background shorthand would erase the theme image */
  background-size: cover; background-position: center; background-attachment: fixed; background-repeat: no-repeat;
}
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--ink); }
#wrapper .user_page a, #wrapper .footer a { color: var(--accent); }
#wrapper .user_profile {
  background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px 20px;
  animation: custom-in .5s ease-out;
}
@keyframes custom-in { from { opacity: 0; transform: translateY(8px); } }
#wrapper .game_grid_widget { align-items: stretch; grid-auto-rows: 1fr; }
#wrapper .game_cell {
  display: flex; flex-direction: column; background: var(--card);
  border: 1px solid var(--line); border-radius: 12px; padding: 8px; transition: transform .2s;
}
#wrapper .game_cell_data { flex: 1 0 auto; }
#wrapper .game_title a { color: var(--ink); }
#wrapper .game_text, #wrapper .game_author, #wrapper .game_author a, #wrapper .game_genre, #wrapper .game_platform { color: var(--muted); }
#wrapper .footer { color: var(--muted); border-color: var(--line); }
#wrapper a:focus-visible, #wrapper .button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
#wrapper .game_cell:has(:focus-visible) { outline: 3px solid var(--accent); outline-offset: 3px; }
@media (hover: hover) { #wrapper .game_cell:hover { transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) {
  #wrapper, #wrapper::before, #wrapper::after, #wrapper *, #wrapper *::before, #wrapper *::after {
    animation: none !important; transition: none !important;
  }
  #wrapper .game_cell:hover { transform: none; }
}
```

```css
/* PROJECT starter: also styles the project's devlog posts, devlog index and comments page. */
#wrapper {
  --ink: #eef3ff; --muted: #c3cfee; --accent: #ffc857;
  --panel: rgba(12, 20, 48, .94); --line: rgba(238, 243, 255, .25);
  --itchio_input_focus_color: var(--accent);
  min-height: 100vh; background-color: #0b1433;
  background-size: cover; background-position: center; background-attachment: fixed;
}
/* outline, not border: itch's JS can pin #inner_column to a wide embed's width */
#wrapper #inner_column { background-color: var(--panel); color: var(--ink); outline: 1px solid var(--line); outline-offset: -1px; border-radius: 12px; }
#wrapper .inner_column a { color: var(--accent); }
#wrapper .inner_column .button {
  background-color: var(--accent); color: #1a1300; border-color: transparent; text-shadow: none; transition: background-color .15s;
}
@media (hover: hover) { #wrapper .inner_column .button:hover { background-color: #ffd77e; } }
#wrapper .formatted_description, #wrapper .post_body { line-height: 1.6; }
#wrapper .inner_column h2, #wrapper .inner_column h3 { color: var(--accent); }
#wrapper .game_devlog_post_page section.post_header h1 { color: var(--ink); }
#wrapper .game_comments_widget .community_post { border-top: 1px solid var(--line); }
#wrapper .game_info_panel_widget, #wrapper .post_meta, #wrapper .footer { color: var(--muted); }
#wrapper a:focus-visible, #wrapper .button:focus-visible, #wrapper .spoiler:focus-visible {
  outline: 2px solid var(--accent); outline-offset: 2px;
}
/* the banner link and the footer breadcrumbs sit in overflow:hidden boxes: draw their ring inside */
#wrapper .header a:focus-visible, #wrapper .breadcrumbs a:focus-visible { outline-offset: -2px; }
@media (prefers-reduced-motion: reduce) {
  #wrapper, #wrapper::before, #wrapper::after, #wrapper *, #wrapper *::before, #wrapper *::after {
    animation: none !important; transition: none !important;
  }
}
```

```css
/* JAM overview starter. No @import on jams: use the font picker or @font-face. */
@font-face {
  font-family: "Custom Hyperlegible"; font-weight: 700; font-display: swap;
  src: url(https://fonts.gstatic.com/s/atkinsonhyperlegible/v12/9Bt73C1KxNDXMspQ1lPyU89-1h6ONRlW45G8Wbc9dCWP.woff2) format("woff2");
}
#wrapper {
  /* jam themes declare their variables on #wrapper itself, so overriding them here works */
  --itchio_link_color: #ffc857; --itchio_button_color: #ffc857; --itchio_button_fg_color: #1a1300;
  --itchio_button_hover_color: #ffd77e; --itchio_button_active_color: #f0b73f;
  --itchio_button_shadow_color: #f0b73f; --itchio_button_border_color: #f0b73f;
  --itchio_border_color: rgba(238, 243, 255, .25); --itchio_border_radius: 12px; --itchio_input_focus_color: #ffc857;
  color: #eef3ff; background-color: #0b1433;
}
/* outline, not box-shadow: forced colours remove shadows, and a border would change the box size */
#wrapper .view_jam_page .jam_body { background-color: rgba(12, 20, 48, .94); outline: 1px solid rgba(238, 243, 255, .25); outline-offset: -1px; }
#wrapper .view_jam_page h1, #wrapper .view_jam_page h2, #wrapper .view_jam_page h3 { color: #eef3ff; }
#wrapper .jam_title_header { font-family: "Custom Hyperlegible", Lato, sans-serif; }
#wrapper .jam_content { line-height: 1.6; }
#wrapper .jam_content h2 { color: #ffc857; }
/* the generated grid colours carry !important, so these need it too */
#wrapper .view_jam_page .game_grid_widget .game_cell .game_text,
#wrapper .view_jam_page .game_grid_widget .game_cell .game_author a { color: #c3cfee !important; }
#wrapper a:focus-visible, #wrapper .button:focus-visible, #wrapper .spoiler:focus-visible {
  outline: 2px solid #ffc857; outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  #wrapper, #wrapper::before, #wrapper::after, #wrapper *, #wrapper *::before, #wrapper *::after {
    animation: none !important; transition: none !important;
  }
}
```

The `@font-face` URL is the Latin-subset woff2 that `fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@700` lists (checked 2026-10-14). It loaded in the jam test (`document.fonts` status `loaded`). Characters outside that subset fall back to the next font. For another font, copy the `src` from `https://fonts.googleapis.com/css2?family=<Name>:wght@<w>&display=swap` **[verified (live render) 2026-10-14 · s10-25]**.

#### 15.3 Test results

Each template was injected into a real logged-out page with itch's JS running (§14.7):

- two profiles: one grid layout with a theme image, one column layout with a banner and 67 games;
- one project page with a 1280 px HTML5 embed;
- one of that project's devlog posts;
- one jam overview.

Results **[verified (live render) 2026-10-14 · s10-25, s10-26]**:

| Check (§1 row) | Profile (grid) | Profile (column) | Project | Devlog post | Jam |
|---|---|---|---|---|---|
| Source CSSOM = minified CSSOM | yes | yes | yes | yes | yes |
| Rules applied (computed values) | yes; cards all 356 px | yes; cards all 417 px | yes | yes | yes; font `loaded` |
| 7. Reduced motion | 0 running; bio `animation-name:none`, transitions `0s` | same | 0 running; button transition `0s` | same | same |
| 9. Forced colours: edges kept | bio and cards: 1 px border | same | panel: 1 px outline | same | `.jam_body`: 1 px outline |
| 11. Keyboard: visible, unclipped ring | 8 of 8 stops | 140 of 140 | 156 of 156 | 82 of 82 | 29 of 29 |
| 3. 320 px, phone UA: no horizontal scroll | pass | pass | pass | pass | pass |
| 12. Exposed h1 | 2 (itch's display-name h1 + the bio's own h1) | **0** (banner hides itch's) | **0** (banner and embed hide it) | 1 | 2 (logo + jam title, as §9.1 expects) |

Two template bugs were caught and fixed on the way:

- On jams, `box-shadow` was the panel's only edge. Forced colours remove shadows, so it became an inset `outline`.
- On devlogs, three rings were clipped (§8.3), so the inset ring rule was added.

**Contrast of the template colours**, composited (WCAG 2.x). These are for the brightest backdrop a card can sit on:

| Colour | On the profile card (82% alpha) over white | Over `#3d6fba` |
|---|---|---|
| ink `#eef3ff` | 9.72 | 13.93 |
| muted `#c3cfee` | 6.93 | 9.93 |
| accent `#ffc857` | 7.02 | 10.06 |

The project panel (94% alpha) is at least 10.05 for all three. Button text `#1a1300` is 12.01 on `#ffc857` and 13.43 on the hover colour. The ring `#ffc857` is 11.75 on `#0b1433`, but only **1.54 on white**. On light themes, or wherever the ring can land on a light background, pick a darker ring colour **[verified 2026-10-14 · s10-25]**.

#### 15.4 What CSS can't do for you

- **One exposed h1** (§9) depends on your HTML:
  - On a profile with a banner, itch hides its own h1, so add `<h1 class="custom-…">` to the bio.
  - On a profile whose bio already has an h1 and **no** banner, hide itch's with `#wrapper .text_header>h1{display:none}`. Only do this when your heading replaces it.
  - On a banner or HTML5-embed project page, add a heading to the description.
- **Spacing and colours of your own HTML** (bio widgets, description layouts) need their own rules. Re-run rows 3, 9, 11 and 14 after adding them.
- **Projects count line breaks twice.** The project editor sends CRLF (01 §3), and a sheet saved on a project held CRLF line breaks, while the same paste saved on the profile kept LF **[verified 2026-10-16 · live-css]**. Paste the single-line `.min.css`.
- **Saving the templates is untested.** They were injected into served pages, not saved through itch's editors. That they survive saving unchanged is **[inferred]**: they use only plain CSS, and no `@import`. A probe sheet saved on a project and on the profile came back intact apart from `</style>` deletion, outer-whitespace trimming and (on the project) CRLF line breaks, none of which changes a single-line template's rules **[verified 2026-10-16 · live-css, live-c01 to live-c45]**.

---

#### Section notes (evidence added for this section, 2026-10-14)

**Environment.**
- Checks were re-run this session in an isolated, offline headless **Chrome 155.0.8059.79**: `--remote-debugging-port=9481`, a scratch `--user-data-dir`, `--host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE 127.0.0.1"`.
- Runners: Node 22.13 and Python 3.12.6.
- Scripts and test pages (own code) are in `knowledge/evidence/s10-tools/` (s10-01 to s10-16) and `knowledge/evidence/gapfill-s10-tools/` (s10-17 to s10-30); some reuse `../a11y-tests/`. The gap-fill log is in `knowledge/evidence/gapfill.md`.
- **The first pass (s10-01 to s10-16) made no itch.io requests.** itch files were read from logged-out copies fetched earlier the same day by the a11y verifier (build `?1791981660`). They stay in the scratchpad, never in this repo.
- **The gap fill (s10-17 to s10-26) made 73 logged-out GET requests to itch**: 5 page documents (≥ 7 s apart) and 68 static or image files (≤ 1 per 1.1 s), all status 200, no 429. Nothing was logged in to, posted or submitted. Its own headless Chrome 155 ran on `--remote-debugging-port=9611` with a scratch profile. Page copies and the mirror stay in the scratchpad. Pages used: two profiles (one grid layout, one column layout with a banner), one project with a 1280 px HTML5 embed, one of its devlog posts, and one jam overview.
- s10-27 to s10-30 made no itch requests. They used local probe pages, Playwright 1.56.1 with Firefox 142.0.1 and WebKit 26.0 (browsers already in the scratchpad from an earlier gap fill), a headed Chrome 155 window with a scratch profile and all hosts mapped to NOTFOUND, and Windows PowerShell 5.1 UI Automation.
- Non-itch requests (GET, 1 s apart): MDN BCD and `w3c/wcag` on raw.githubusercontent.com, and EasyList.
- To re-run a check: `CDP_PORT=<port> node <script> <file-URL>`.

| id | What | Method | Result |
|---|---|---|---|
| s10-01 | itch breakpoints | `grep -o '@media[^{]*' {user,game,jam}.css \| sort \| uniq -c`; `python -I s10-tools/mediarules.py <css> 'max-width: (800\|650\|1000\|600\|400)px'` | user.css: 650 ×10, 800 ×5, 600 ×5 blocks. game.css: 650 ×21, 600 ×18, 1000 ×6, 960 ×4, 400 ×4. jam.css: 650 ×15, 600 ×11, 820 ×2. Rules as in §3 (≤800 rules are scoped to `.user_page.mode_column`; game.css rules to `.responsive`). |
| s10-02 | Reduced-motion guard coverage; entrance base state | `s10.mjs` (MOTION) on `s10-motion.html`: 6 infinite animations on `#wrapper`, its `::before`/`::after`, a child, and the child's `::before`/`::after`; emulated `reduce` | Running: none 6, 2-selector 4, 3-selector 3, 6-selector **0**. `opacity:0` + `forwards` entrance stays at opacity 0 under any guard; a `from{opacity:0}` entrance stays at 1. |
| s10-03 | Sticky hover | `s10.mjs` (HOVER): touch emulation + `Input.dispatchTouchEvent` tap vs mouse `mouseMoved` | Touch: `(hover:none)`, `(pointer:coarse)`. Ungated card `:hover=true`, transform `matrix(1,0,0,1,-4,-4)`. Gated card `:hover=true`, transform `none`. Mouse: both transform. |
| s10-04 | Focus rings in line-clamped titles; card ring; click vs Tab | `s10.mjs` (FOCUS) + 2× zoomed screenshots (viewed); `focus2.mjs` | Link ring `auto 1px rgb(54,18,117)` inside `overflow:hidden` title. Custom 3 px ring clipped to a sliver. Card ring complete and rounded. Click: `:focus-within` true, `:has(:focus-visible)` false. Tab: both true. |
| s10-05 | Forced colors | `a11y-tests/t5-forced.mjs` on `t5-forced.html`, none vs active, + screenshot (viewed) | As in the §6 table: transparent text → `rgb(255,255,255)`; transparent border → white; card with no border has no edge; link `rgb(255,255,0)`; opt-out keeps the gradient. |
| s10-06 | Contrast | `python -I a11y-tests/r2-contrast.py` (WCAG 2.x, unrounded compositing); `a11y-tests/r2-bgstat.mjs` on the theme image (2752×1536) | Ratios as in §7. Image: mean `#11274d`, corners `#071028`/`#02040f`, brightest 64 px block `#386fb7`. |
| s10-07 | Head order, viewport meta, h1 count | `python -I s10-tools/headorder.py` on logged-out raw copies: profile, project, 2 devlog posts, jam | Orders as in §14.1. Viewport meta on all 5. h1 in markup: profile 2, project 1, devlog 2 (banner) and 4 (site header), jam 2. |
| s10-08 | WCAG technique mapping | `curl raw.githubusercontent.com/w3c/wcag/main/understanding/understanding.11tydata.js` | 2.2.2 sufficient: G4, SCR33, G11, G152, SCR22, G186, G191. 2.3.3: C39, SCR40. 2.3.1: G19, G176, G15. |
| s10-09 | itch font units | `grep -oE 'font-size:[0-9.]+(px\|rem\|em)'` | user.css 61 / 0 / 17; game.css 172 / 0 / 10 |
| s10-10 | Private repo observations | Read the private repo's `.claude/CLAUDE.md` (read only) this session | Brave Shields blocked the owner's CSS service (2026-10-12); `aria-hidden` stripped on save (2026-10-08); bio `<h1 class="custom-title">` kept (2026-10-08); a `::selection` rule had to be neutralised on transparent text |
| s10-11 | Blocker class names | `curl https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_general_hide.txt` (236,782 bytes); `grep -E '^##[.#]custom-'` | The 6 rules listed in §12 |
| s10-12 | Browser support | `curl` MDN BCD `css/{properties/content, background-attachment, backdrop-filter, forced-color-adjust, overflow; selectors/focus-visible, has; at-rules/media}.json`; `python -I s10-tools/bcd.py <dir>`; `supports.mjs` | Versions as in §13. `background-attachment: fixed` on iOS is partial ("recognized but has no effect"). Chrome 155 `CSS.supports`: `-webkit-backdrop-filter` false; `backdrop-filter`, content alt and `selector(:has(a))` true. |
| s10-13 | Headless widths | `chrome --headless=new --window-size=W,800 --dump-dom s10-width.html` vs `width.mjs` (CDP override) | `--window-size` 320/375 → `innerWidth` 500; 600 → 584. CDP override 320/375 → exact. |
| s10-14 | Accessible names of animated headings | `axname.mjs` on `s10-letters.html` (`Accessibility.getPartialAXTree`) | sr-only word + empty inline-block spans with `content:"M" / ""` → "Miro". Without alt → "Miro x x". Inline-block words with a real space → "Hello world". |
| s10-15 | `#user_tools` overlays | `python -I a11y-tests/v-rules.py user.css user_tools .`; `mediarules.py game.css 'max-width: 650px'`; grep `user.min.js` | Profile: `.user_tools{position:fixed;top:0;right:0;z-index:2;margin:10px…}`, `.hidden` faded only at ≥960 px; JS `removeClass("hidden")` after 200 ms. game.css ≤650 px: `.user_tools{position:fixed;bottom:0;left:0;right:0;height:50px;z-index:99…}` and `.footer{padding-bottom:60px}`. |
| s10-16 | Focus fixes against itch's real `game.css` | New `focus3.mjs` + `s10-itchfocus.html` (game.css injected at runtime from the scratchpad copy; 3 Tab stops) | No fix: link/button `auto 1px rgb(54,18,117)`, spoiler `none 0px`. Variable only: link gold, button and spoiler unchanged. Variable + `#wrapper .button:focus-visible,#wrapper .spoiler:focus-visible{outline:2px solid}`: all three gold. |
| s10-17 | Live render method | `gapfill-s10-tools/lr.mjs`; `fetch-live.mjs` (5 page GETs); `smoke.mjs`; request log audited | itch's JS ran (jQuery and `I` defined). After load + 1 s the profile head order was `user_theme > custom_css > sizer > sizer`, and `#wrapper` had an inline `min-height`. 73 itch GETs in total, all 200. |
| s10-18 | Grid sizer | `runtime-checks.mjs grid`: 8 CSS variants at 1280 px, then resized to 900; 2 variants at 420 px | As in §14.8. Gap set on `#wrapper .user_game_grid`: grid scrollWidth 980 in a 960 px grid (866 in 845 after resize). |
| s10-19 | `#user_tools` and fixed layers | `runtime-checks.mjs usertools`: `elementFromPoint` at the button's centre, 5 variants × 2 profiles, plus clipped screenshots (viewed) | Button: class `user_tools`, opacity 1, fixed, z-index 2. Hit target: layer → `#wrapper`; + isolation → button; + `pointer-events:none` → button, still tinted. Bio layer: grid profile covered, column profile not. |
| s10-20 | `#wrapper` min-height; footer | `runtime-checks.mjs minheight footer` at 900/600 and 900/400 px heights | min-height = window height − padding-bottom, updated on resize; `min-height:0` loses, `!important` wins. Footer gaps 34 / 34 / −16 / 14 / 94 px for none / margin-top / padding 0 / margin-bottom / padding 110. |
| s10-21 | Cards with loaded covers; lazy covers | `runtime-checks.mjs cards`; `extra-checks.mjs` (scroll through a 67-game profile) | Heights as in §14.8. Covers 315×250 loaded. Lazy: 2/67 → 25/67 with `src` after scrolling; thumbnail boxes 250/159 px throughout. |
| s10-22 | GIF overlay | `runtime-checks.mjs gif`: CDP `mouseMoved` over the card | Inline `background-image` set on hover; only `!important` (computed `none`) or `display:none` stop it. |
| s10-23 | Wide embed | `runtime-checks.mjs embed` at 1400/1000/800/375 px (desktop UA); `template-checks.mjs` 320 px with an Android UA | Inline `width:1280px;max-width:1280px` at every desktop width; none at 320 px with the phone UA. Override results as in §14.8. |
| s10-24 | Jam countdown, skip links, jam margins | `runtime-checks.mjs jam`; `extra-checks.mjs` at 1280/961/960/800/651/650 px | Years/months blocks `.hidden`. Skip link `#maincontent` → `#view_jam_<id>` (`tabindex=-1`, inside `#wrapper`); 0 skip links on the profile and project. `.jam_body` margin 0 from 651 to 961 px, 10 px at 650 px. |
| s10-25 | Starter templates end to end | `minify.py`; 01 §3 snippet; `template-checks.mjs` (5 pages × 6 loads: desktop, reduced motion, 320 px with a phone UA, the same without the template, 320 px with a desktop UA, forced colours); contrast in Python (WCAG 2.x) | As in §15.1 and §15.3. Three runs: before the two template fixes, after them, and after correcting the ring-clipping measure (it had counted inset rings as clipped). Only the third is reported. The profile template then gained a `.button` focus route, and both profiles were re-run with the same results. |
| s10-26 | Clipped rings on devlog posts | `ring-shots.mjs` and a 30×30 px corner capture at 8× (viewed) | Banner link ring invisible and breadcrumb ring missing top and bottom with `outline-offset:2px`; both complete with `-2px`. |
| s10-27 | Accessible names in Firefox and WebKit | `pw-ax.mjs` on `sr-probe.html` (Playwright 1.56.1: Firefox 142.0.1, WebKit 26.0); `s10-tools/axname.mjs` for Chrome 155 | All 13 probes give the same name in the three engines (§10.4 table). Firefox keeps empty static-text leaves for alt-silenced content; WebKit drops them. |
| s10-28 | Windows UI Automation tree | Headed Chrome 155 (`--force-renderer-accessibility`, scratch profile, all hosts NOTFOUND) + `uia-dump.ps1`; Playwright Firefox held open with `pw-hold.mjs` | Chrome: native UIA (DOM ids as AutomationIds); leaves as in §10.4. Firefox: window found, but no Document element exposed, so no data. |
| s10-29 | itch spoilers in AX trees | `pw-ax-spoiler.mjs` on `sr-spoiler.html` with a same-day `game.css` copy (served from a fake origin, not stored in the repo), in Chrome 155, Firefox 142 and WebKit 26 | Unfocused: text fill transparent, plain text exposed; wrapped text `visibility:hidden` and absent. After focus: both exposed. |
| s10-30 | Screen readers available | Checked `Program Files`, `%APPDATA%\nvda` and the uninstall registry keys | No NVDA, JAWS or other third-party screen reader installed; only Narrator. Nothing was downloaded or installed, so speech is untested. |

**Conflicts resolved:**

- **Reduced-motion guard.** corpus-37 and repo-50 report that common guards miss `#wrapper` and its own pseudo-elements. s10-02 measured each variant; only the 6-selector block stops everything.
- **Title overflow fix.** The earlier fix, `white-space:normal`, splits letter-split names. a11y-31's corrected fix (`nowrap` + `font-size:min(10vw,6rem)`) is the one given.
- **Jam skip link.** It was described earlier as dead. itchcss-34 (bundle.min.js source) shows JS repairs it, so it is dead only without JS.
- **Rate-limit spacing.** crawlprofile-47 (4–5 s, 30 s), crawljam-39 (≥7 s safe in one run), repo-55 (7.5 min after one's own last request) and external-52 (10–20 s retries succeeded) all fit a per-IP budget shared with other clients. The section gives ≥7 s plus status checks plus 60–120 s backoff, and calls no interval safe.
- **`aria-label`.** repo-59 shows `aria-label` restoring a heading name in Chrome, but sanitizer-40 and s10-10 say `aria-*` is stripped. The section recommends the semantic and generated-content routes instead.
- **MDN vs Chrome on generated content.** a11y-57 shows Chrome exposes it. The section follows the browser, not MDN's sentence.
- **Minimum width.** docs-15's "~360px" was the original agent's own inference. WCAG's 320 px plus 375 px is used instead.
- **repo-52.** It was "unverifiable" for its verifier, but localtests-34 reproduced it directly. Both are cited.
- **Viewport units.** localtests-48's desktop-pane figure (371 vs 768 px) depends on the pane size; only "all four units are equal" is stated.
- **Owner-view differences.** These are documented only for jams (docs-48, a11y-22), observed on a profile export (crawlprofile-43, repo-37, a11y-21), community-reported for projects (community-30) and read live on one draft project's owner view and on the profile's owner and logged-out views (live-dom). Each is tagged accordingly.
- **"Most faithful" harness.** §14.1 used to call the script-free real-page harness the most faithful. s10-17 to s10-24 show eight kinds of runtime state it freezes. It is now labelled script-free, and its results here are tagged `verified (script-free harness)` (a11y-31, a11y-45). The live render (§14.7) is the reference method for layout.
- **Script-free results re-checked with JS.** repo-24 (footer spacing), repo-33 (equal-height cards), itchcss-29 (fixed layer over `#user_tools`), crawljam-47 (jam margins) and itchcss-34 (jam skip link) all held with itch's JS running (s10-19 to s10-24). s10-15's runtime claim (`.hidden` removed) is now observed directly as well as read in the source.
- **Screen-reader claims.** They were Chrome-only computed names. They now agree across Chrome, Firefox and WebKit and in Chrome's UIA tree (s10-27, s10-28). They are still not speech: §9.4 and §10 say so where they recommend the patterns, and §10.4 gives the NVDA probe.
