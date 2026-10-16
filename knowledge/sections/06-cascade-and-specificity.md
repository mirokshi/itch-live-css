## Cascade, specificity and @import behavior

This section covers how your custom CSS ranks against five things: itch's base stylesheets, the theme editor's output, inline `style=""` attributes, the styles itch's JavaScript adds after the page loads, and the sheets you pull in with `@import`.

- **Browsers tested:** Chromium only (Chrome/Edge 147–155). Firefox and Safari were not run.
- **Tags:** `[confidence date · evidence id]`.
- **`s06-*` and `gapfill06-*` ids:** checks made for this section on 2026-10-14 (see Section notes at the end).
- **`live-*` ids:** the live probe runs of 2026-10-16 (Brave 155 = Chromium 155; `evidence/live-probes/`): Run 1 on the owner's draft project page (owner logged in), Run 2 on the owner's profile (logged in and logged out), Run 3 on a draft devlog post of that project (owner logged in). Each holds only for the page types its text names; jams are untested.

### Rules of thumb

1. **Start every selector with `#wrapper`.** No itch rule that styles page content uses an ID selector, so a single ID outranks every normal (non-`!important`) itch rule, base and theme alike **[verified 2026-10-14 · itchcss-03, crawlprofile-23, crawlproject-36, docs-17, community-28]**.
2. **Use `!important` only against three things:** the theme's own `!important` declarations (project and jam themes), itch's base `!important` rules, and inline `style=""` attributes **[verified · docs-17, crawljam-07, crawlprofile-53, localtests-04]**.
3. **Never put overrides inside `@layer`**, and never import an override sheet (your CSS service, a scoped framework build) with `layer()`. Layered normal rules lose to itch's unlayered CSS whatever their specificity **[verified · support-37, localtests-16, external-12, gapfill06-03]**. There is one exception: **layer on purpose when you *want* a sheet to lose** (§6.1).
   - **Keyframes-only library.** `@import url(…animate.min.css) layer(fw);` is fine. itch's unlayered `@keyframes bounce` then keeps winning the name clash, and your own `#wrapper .custom-*` rules can still use the library's non-clashing names (`bounceIn`) **[verified 2026-10-14 against the real `user.css` · gapfill06-01]**.
   - **Low-priority base.** A layered base gives way to anything unlayered. But it is **not scoped**: it still applies wherever itch sets nothing **[verified · gapfill06-02]**.
   - **Layered `!important` reverses.** It beats every unlayered `!important`, your own `#wrapper` fixes included. That is how Tailwind v4's `important` option wins, and why it is hard to override **[verified · gapfill06-03, support-37]**.
4. **Paste `@import` first.** Only `@charset` and `@layer` statements may come before it; with both in front, saved imports applied on a live project page and on the profile **[verified 2026-10-16 · live-c01, live-c02, live-c05]**. **On jam pages `@import` never works**, because the host CSS is appended after the theme rules in the same sheet **[verified · community-15, docs-18, s06-jam]**.
5. **Imported rules lose ties against the rules you paste.** In an external sheet, make selectors strictly more specific **[verified · localtests-01, repo-13, itchcss-09, external-11]**.
6. **Variables alone don't recolor itch.** The theme writes literal colors on more specific selectors. Write explicit `#wrapper …` rules. On profiles, declare variables on `#wrapper .user_page` **[verified · localtests-06; inferred · docs-56, crawlproject-22]**.
7. **Prefix your `@keyframes` names** (e.g. `custom-wave`). itch defines 13 global names, and a rule of yours with the same name replaces itch's on the whole page **[verified · s06-static, s06-kf]**.

---

### 1. Where your CSS sits

| Page | `<head>` order (earliest → latest) | Evidence |
|---|---|---|
| Profile | `link user.css` → scripts → `style#user_theme` → [Google Fonts `link`, only if the theme font needs one] → **`style#custom_css`**. At runtime, itch's JS appends two `style[itchio-grid-sizer]` after it | **[verified · crawlprofile-22 (51/51 pages), repo-03, itchcss-02, localtests-02, s06-heads]**, runtime part **[verified 2026-10-16 · live-dom]** (live profile, owner and logged out) |
| Project / devlog | `link game.css` → scripts → `style#game_theme` → [0–2 Google Fonts links] → **`style#custom_css`** (always the last `<head>` element; also in the owner's views of a draft project and of its draft devlog post, with nothing added after it) | **[verified · crawlproject-36, docs-18, corpus-14, s06-heads; verified 2026-10-16 · live-dom]** |
| Jam overview | `link jam.css` → scripts → **`style#jam_theme`, which holds the generated theme with the host CSS appended in the same element** → [theme font `link`, `@font-face` only] | **[verified · docs-18, corpus-14, s06-heads]** |

What this means:

- **Ties go to you on every page type.** A custom rule with the *same* specificity as a base or theme rule wins, because it comes later.
  - Profile test: `.game_grid_widget .game_cell .game_text` (0,3,0) won. `.game_genre` (0,1,0) still lost **[verified · itchcss-02]**.
  - Jam test: `.view_jam_page .jam_body{background-color:rgb(1,2,3)}` beat the generated rule of equal specificity, with no ID and no `!important` **[verified · crawljam-06]**.
- **`@import`ed sheets are inserted at the position of the `<style>` element.** So they come after the theme and before your own rules (§5) **[verified · crawlprofile-22, localtests-02]**.
- **"Custom CSS is last" holds only for the served HTML.** On profiles, itch's JS appends grid `<style>`s later (§8): two of them followed `style#custom_css` on the live profile, owner and logged out **[source re-read · s06-js; verified 2026-10-16 · live-dom]**. On a project nothing was added after `custom_css` once the scripts had run (owner view of a draft) **[verified 2026-10-16 · live-dom]**.
- **The logged-in owner view differs.** On profiles it also loads `link theme_editor.css` before `user_theme`, but `custom_css` still comes last. Test logged out **[verified · localtests-02]**. On the live profile the owner got two `static.itch.io` links and visitors one, with `custom_css` the last served sheet either way **[verified 2026-10-16 · live-dom]**. On a project's owner view the sheets were two `static.itch.io` links, `style#game_theme` and `style#custom_css`, last again **[verified 2026-10-16 · live-dom]**.
- **Jam host CSS is global.** It is unscoped, so a bare `img{…}` or `body{…}` also hits itch's site header outside `#wrapper` **[documented · docs-18]**.
  - gmtk-2025's host part contains unscoped `img`, `table` and `.owner_tools` rules with `!important` **[verified · s06-heads]**.
  - Scope jam CSS under `#wrapper` too.

### 2. What you are up against

| Opponent | Strongest selector seen | How to beat it |
|---|---|---|
| itch base CSS (`user.css`, `game.css`, `jam.css`) | No IDs on page content. The only IDs are `#lightbox_container` and `#lightbox_shroud`, outside `#wrapper`. Max (0,6,0) / (0,6,1) / (0,5,1) | any `#wrapper …` selector **[verified · itchcss-03, s06-static]** |
| Theme `<style>` (`user_theme` / `game_theme` / `jam_theme`) | Classes and elements only. Profile max (0,4,1): the nested `.game_grid_widget .game_cell .game_title a.title`. Project max (0,5,1). Jam max (0,4,1) | `#wrapper …`. `#wrapper .game_title a` (1,1,1) beat the profile's (0,4,1) in a live-page test **[verified · crawlprofile-23, itchcss-03, crawlproject-36]** |
| Theme `!important` | Profile: **none**. Project: **4 rules / 8 declarations**. Jam: **5 rules / 6 declarations** (lists below) | `#wrapper … { … !important }` **[verified · docs-17, corpus-47, crawljam-07, s06-heads]** |
| Base-CSS `!important` | 7 / 12 / 7 declarations in user / game / jam.css, e.g. `.user_page .purchased_games h2 a, .user_page .collection_row h2 a{color:inherit !important}` | `!important`, or style the parent (`#wrapper .collection_row h2{color:…}`) **[verified · crawlprofile-53, s06-static]** |
| Inline `style=""` | `.game_thumb` `background-color` (about 93% of thumbs). `.game_frame` `width`/`height` on HTML embeds | `!important` only **[verified · crawlprofile-12, crawlproject-17, localtests-04]** |
| Runtime `style[itchio-grid-sizer]` (comes after you; two on the live profile **[verified 2026-10-16 · live-dom]**) | Profile: `.mode_grid .user_game_grid` (0,2,0). Jam overview: `#<generated id>` (1,0,0) | `#wrapper` plus at least one class **[inferred · community-47; verified locally · s06-run S2–S6]** |
| Your own `@import`ed sheet | ordered *before* your pasted rules | more specificity in the imported sheet **[verified · localtests-01]** |
| Anything inside `@layer` | loses to every unlayered normal rule | don't layer overrides; layer only what should lose (§6.1) **[verified · support-37, gapfill06-03]** |

The theme's `!important` declarations, as served on 2026-10-14 **[verified · docs-17, community-28, corpus-47, crawljam-07, s06-heads]**:

- **Project / devlog `game_theme`** (4 rules, 8 declarations):
  - `.inner_column .redactor-box .redactor-toolbar li a:hover/:active`: `background-color`, `color`, `text-shadow`.
  - `.view_game_page .reward_row, .view_game_page .bundle_row`: `border-color`.
  - `.game_comments_widget … .markdown_toolbar button:hover/:active`: `background-color`, `color`, `text-shadow`.
  - `.footer .svgicon, .view_game_page .more_information_toggle .svgicon`: `fill`.
- **Jam `jam_theme`, generated part** (5 rules, 6 declarations):
  - `.view_jam_page .grid_outer .itch_footer`: `border-top`.
  - `… .game_cell .game_text`, `.grid_outer .game_count`, `.grid_outer .footer_submissions`: `color`.
  - `… .game_platform`, `.game_genre`, `.game_author a`, `.grid_outer .powerd_by`: `color`.
  - `.jam_filter_picker .filter_item`: `color`.
  - `.jam_filter_picker .filter_item:hover/.active`: `color` and `border-color`.
- **Profile `user_theme`:** none.

```css
#wrapper .game_title a{color:#ffc857}                          /* beats the profile theme's (0,4,1) */
#wrapper .game_cell .game_text{color:#c9d1e6!important}        /* jam: the theme rule is !important */
#wrapper .game_thumb{background-color:transparent!important}   /* inline style="" on thumbs */
#wrapper .collection_row h2{color:#ffc857}                     /* the h2 a inherits (user.css !important) */
```

### 3. Specificity tools: what adds weight and what doesn't

Every row was tested in Chrome 155 against a theme-like rule `.user_page .x` (0,2,0):

| Your selector | Weight | Result | Evidence |
|---|---|---|---|
| `#wrapper .x` | (1,1,0) | wins | **[verified · localtests-01, localtests-05, s06-run]** |
| `#wrapper { .x{} }` (native nesting) | (1,1,0), same as flat | wins | **[verified · support-15, s06-run A13]** |
| `#wrapper#wrapper .x` | (2,1,0) | wins. It also beats a *later* `#wrapper .user_page .x` (1,2,0) | **[verified · localtests-05]** |
| `#wrapper .x.x` / `#wrapper h1.x` | +1 class / +1 type | Use these to make an imported rule beat a pasted one | **[verified · repo-13]** |
| `:where(#wrapper) .x` | (0,1,0) | **loses** | **[verified · localtests-05]** |
| `@scope (#wrapper){ .x{} }` | (0,1,0): the scope root adds nothing | **loses** | **[verified · localtests-45, support-14]** |
| `@scope (#wrapper){ & .x{} }` | (0,1,0): `&` behaves as `:where(:scope)` | **loses** | **[verified · localtests-45, support-14]** |
| `@scope (#wrapper){ :scope .x{} }` | (0,2,0) | Ties, then wins on scope proximity, even against a *later* unscoped rule | **[verified · localtests-45, support-14]** |
| `@layer x{ #wrapper#wrapper .x{} }` | any | **loses** to any unlayered rule | **[verified · localtests-16, localtests-17, support-37]** |
| `@supports (…){ … }` around a rule | adds nothing | A later `@supports` rule `span{--i:…}` does **not** override an earlier `span:nth-child(3){--i:7}`, because `:nth-child()` adds (0,1,0) | **[verified · localtests-53]** |

- **Nesting is the cheap way to scope.** Native nesting has been Widely available since 2026-06-11, keeps the ID's weight and saves characters. Nested rules that *start with a type selector* (`p{}`) need Chrome 120 / Safari 17.2 **[verified · support-15]**.
- **What survives a save.** Until 2026-10-16 no save was made from an itch account in this work, so the evidence was what live pages serve: whatever is in a served `style#custom_css` or jam tail already went through itch's save pipeline, at whatever date it was saved. On 2026-10-16 the owner saved a probe sheet on a draft project, then on the profile. Every construct in the table except `:has()` (not probed), plus `!important` and `@import … layer()`/`supports()`/media, was stored as sent and applied in Chromium 155 on both (on the profile, logged in and logged out) **[verified 2026-10-16 · live-c06 to live-c08, live-c11 to live-c22]**.

  | Construct | Seen in served custom CSS | Confidence |
  |---|---|---|
  | Native nesting (`&`, `&>`, bare nested selectors) | 62-page corpus: **7 pages** (4 profiles, 3 projects), 142 nested rules, `&` on 4 of them. In a wider same-day sample (every page copy fetched by this project), **11 of 125 distinct sheets** (5 profile, 5 project, 1 jam). One profile's sheet is **byte-identical** (4,759 bytes) to its public source file: 32 `&`, 31 nested rules, `(width>=780px)`/`(width<=900px)` range queries and `:has()`, all intact | **[verified · gapfill06-04, gapfill06-05, community-38, corpus-27; verified 2026-10-16 · live-c16, live-c17]** |
  | Range media queries (raw `<`/`>`) | 1 profile (the one above) | **[verified · gapfill06-05; verified 2026-10-16 · live-c21]** |
  | `:has()` | 8 / 62 pages; 16 / 125 sheets | **[observed · gapfill06-04]** |
  | `@property` (with `syntax:'<number>'` / `'<angle>'`) | **1 jam only** (2 rules); never on a profile or project | **[observed · gapfill06-04]**; saved on a project and the profile **[verified 2026-10-16 · live-c12]** |
  | `@container` (`@container <name> (width < 1px)`) | 0 / 62; **1 project** among the 125 sheets | **[observed · gapfill06-04]**; size and style queries saved on a project and the profile **[verified 2026-10-16 · live-c13, live-c14]** |
  | `@layer`, `@scope`, `@starting-style`, `@view-transition` | **0 / 62** and 0 / 125 | not observed in served pages; saved on a project and the profile **[verified 2026-10-16 · live-c11, live-c15, live-c18, live-c19]** |

  - **For profiles, `@property` survival was first inferred, then observed.** The risky characters already survive there: raw `<`, `>` and `&` in a profile's range queries and nesting **[inferred · gapfill06-05]**. On a project and on the profile, an `@property` with `<` in its syntax was saved and applied **[verified 2026-10-16 · live-c12]**.
  - **The four never-observed at-rules** survived an owner save on a project and on the profile **[verified 2026-10-16 · live-c11, live-c15, live-c18, live-c19]**. On jams they are still only expected to survive, because served CSS is byte-identical to its source **[inferred]** (Section notes).
  - itch's own profile `user_theme` is also served nested (`.user_page{…hr{…}}`) **[verified · s06-heads]**.
- **The sort order is fixed.** Specificity is compared first, then scope proximity, then order of appearance. Chromium matches css-cascade-6 here, and Safari 26.2 aligned `&` with it **[verified · localtests-45, support-14]**.

### 4. `!important`

- **The opposing `!important` decides.** Jam test: `#wrapper .game_cell .game_text{color:rgb(9,9,9)}` stayed at the theme color, and adding `!important` made it win. `.game_title a` has no theme `!important`, so a plain `#wrapper` rule won there **[verified · crawljam-07]**.
- **Inline styles beat every normal rule.** `style=""` wins even over `#wrapper#wrapper …`, and only an `!important` rule overrides it (A8, A8b) **[verified · localtests-04, s06-run]**. Where itch puts inline styles on public pages:
  - **`.game_thumb`:** `background-color:#xxxxxx`, the cover's placeholder color. About 93% of thumbs; 5 of 5 on the sampled profile **[verified · crawlprofile-12, localtests-04, s06-heads]**.
  - **`.game_frame`:** `width:Wpx;height:Hpx` on HTML embeds. Resize with `#wrapper .game_frame:not(.maximized){width:100%!important;height:auto!important;aspect-ratio:16/9}` and leave `.maximized` alone, since it already uses `!important` **[verified · crawlproject-17]**.
  - **Runtime-added inline styles:** see §8.
- **An `!important` in an imported sheet** beats higher-specificity normal pasted rules (A7) **[verified · localtests-04, s06-run]**.
- **`!important` freezes animations of the same property.** A rule `width:5px!important` on an element with a running `width` animation computes to 5px (G10). If an animation does nothing, search for `!important` on that property, yours or the theme's **[verified · localtests-24, s06-run]**.
- **Layers reverse `!important`.** A layered `!important` beats an unlayered `!important` and unlayered normal rules (D2, D3) **[verified · localtests-16, support-37, external-49]**.
- **Real-world use is heavy.** `!important` appears 972 times on 45 of 62 sampled live pages (profiles 8/13, projects 17/26, jams 20/23), often where a `#wrapper` prefix would have been enough **[observed · corpus-28]**.

### 5. `@import`: placement, cascade position, MIME

**Placement.** Each `<style>` element is its own sheet, so "first" means first in the text you paste **[verified · community-15]**:

| What comes before the `@import` | Result (Chrome 155) | Evidence |
|---|---|---|
| nothing | applied | **[verified · s06-run B11a, B13]** |
| `@charset "utf-8";` | Applied. But `@charset` is simply dropped inside `<style>`, so delete it and save 17 characters | **[documented · community-52; verified · community-15, s06-run B5; verified 2026-10-16 · live-c01, live-c05]** |
| an `@layer a, b;` statement | applied, also on a live project page and on the profile | **[verified · localtests-17, s06-run B2; verified 2026-10-16 · live-c02, live-c05]** |
| any style rule, including a nested one | the `@import` is **dropped** (0 `CSSImportRule`) | **[verified · s06-run B1, B12]** |
| `@import a; @layer y; @import b;` | `a` applied, **`b` dropped** | **[verified · s06-run B11]** |
| the `@import` is inside `@media{}` | **dropped** | **[verified · s06-run B10]** |
| an unknown at-rule, or a selector the engine rejects (`::-moz-selection` in Chromium) | Applied in Chromium, because the rejected rule is discarded at parse time. Don't rely on this: a selector that is valid in another engine blocks the import there | **[verified · s06-run B3, B4]** |

- **Forms and conditions** **[verified · s06-run B7, B13]**:
  - `@import url("…");` and `@import "…";` both work.
  - `print`: not applied on screen.
  - `supports(display:grid)`: applied, also from a `data:` URL on a live project page and on the profile **[verified 2026-10-16 · live-c07]**.
  - `supports(<false>)`: skipped.
  - `screen and (min-width:1px)`: applied; plain `screen` also applied on a live project page and on the profile **[verified 2026-10-16 · live-c08]**.
- **Failures are silent.** An import that returns 404 is ignored, and the rest of the sheet still applies (B9) **[verified · s06-run]**.
- **itch keeps `@import` in profile and project custom CSS.** The sampled live profile's `style#custom_css` starts with an `@import url('https://fonts.googleapis.com/…')` and holds 2 `@import` rules **[verified · s06-heads]**. On a project and on the profile, all six forms saved (`https://`, `http://`, `data:`, and `data:` with `layer()`, `supports()` or `screen`) were kept as sent and parsed as `CSSImportRule`s **[verified 2026-10-16 · live-c03 to live-c08]**.
- **On jam pages `@import` is dead.** The host CSS is appended *after* the generated rules inside `style#jam_theme` **[documented + verified · docs-18]**.
  - **Real jam:** a same-day copy of gdevelop-big-game-jam-10's `jam_theme` (3,540 characters, with `@import` at offset 1,733) loaded in Chrome 155 with 27 rules and **0** `CSSImportRule` **[verified · s06-jam]**.
  - **Synthetic sheet `rule → @import → @font-face → rule`:** the import was dropped, while the `@font-face` (registered in `document.fonts`) and the last rule both survived **[verified · s06-jam]**.
  - **Workaround:** paste the `@font-face{src:url(https://…)}` blocks directly.
  - **Open question:** whether itch ever hoists an import. "Never" is inferred from one jam.

**Cascade position of imported rules** (on equal specificity, the later one wins) **[verified · localtests-01, localtests-02, localtests-03, s06-run A1–A6]**:

```text
itch base <link>  <  theme <style>  <  [ imports nested in import #1  <  import #1  <  import #2  <  your pasted rules ]  <  runtime grid-sizer <style>
```

- **Imported vs pasted: the pasted rule wins a tie** (A1). In another lab test, an imported `.c{background:red}` against a local `.c{background:blue}` computed to blue **[verified · localtests-01, external-11, itchcss-09]**.
  - Specificity still comes first: an imported `#wrapper div.a2` (1,1,1) beats a pasted `#wrapper .a2` (1,1,0) (A2) **[verified · localtests-01]**.
  - A live CSS service uses this fix. It writes `#wrapper h1.custom-title` against the pasted `#wrapper .custom-title`, and `#wrapper .custom-hello.custom-hello` against `#wrapper .custom-hello`. If ignored, the imported rule silently loses **[verified · repo-13]**.
- **Imported vs theme: the import wins a tie** (A3), because it sits inside `custom_css`, after `user_theme`. Lower specificity still loses (A4) **[verified · localtests-02, itchcss-09, repo-03]**.
- **Sibling and nested imports.** The later sibling `@import` wins (A5). A sheet imported *by* an imported sheet is ordered before its importer's own rules, so a service's own rules override the font sheet it imports (A6) **[verified · localtests-03]**.

**MIME and encoding.** itch pages start with `<!DOCTYPE HTML>`, so they render in standards mode **[verified · s06-heads]**:

- **The sheet must be served as `text/css`.** `text/plain` (same- and cross-origin) and `application/octet-stream` were silently rejected, and so was a `<link>` to a `text/plain` file (C1, C2, C7, C8) **[verified · s06-run]**.
- **Hosts checked on 2026-10-14** **[verified headers · s06-mime; rejection inferred from C1/C2]**:
  - `raw.githubusercontent.com` sends `text/plain; charset=utf-8` with `nosniff`, so it won't work as an `@import`.
  - jsDelivr, unpkg, cdnjs, Google Fonts and a Vercel function send `text/css; charset=utf-8`.
- **Encoding.** Each of these decoded correctly **[verified · s06-run]**:
  - a UTF-8 imported sheet with no BOM, no `@charset` and no HTTP charset, imported from a UTF-8 page (C3);
  - a sheet with a BOM (C4), or with `@charset "UTF-8"` (C5);
  - an ASCII-only sheet using `\hex` escapes (C6);
  - non-ASCII typed straight into the inline `<style>` (C9).
  For a service, `\hex` escapes are the most robust choice.
- **Debugging.** Reading `cssRules` of a cross-origin imported sheet throws `SecurityError`, while `href` stays readable (B6). Inspect results with `getComputedStyle` **[verified · s06-run]**.

### 6. `@layer` pitfalls (Tailwind v4 and similar)

- **Unlayered beats layered** for normal declarations, regardless of specificity **[verified · localtests-16, support-37, external-12, s06-run D1]**:
  - `@layer custom{#wrapper .d1{…}}` (1,1,0) lost to an unlayered theme rule `.user_page .d1` (0,2,0).
  - `@layer mine{#lyid .lyc{width:21px}} .lyc{width:22px}` computed to 22px.
  - A layered `#box{color:red}` brought in by `@import … layer(x)` lost to an unlayered `.b{color:green}`.
- **Everything you layer loses to itch.** `user.css`, `game.css`, `jam.css` and all three theme blocks contain **0** `@layer` **[verified · support-37, external-12, s06-static, s06-heads]**.
- **`@import url(…) layer(x)`** and the anonymous **`layer`** keyword make the imported rules layered, so they lose (D4, D5) **[verified · external-12, s06-run]**. itch keeps `layer()` on a saved import, on a project and on the profile **[verified 2026-10-16 · live-c06]**.
- **Inside your own CSS:** unlayered beats layered (D8). Between layers, a later-declared layer beats an earlier one even against higher specificity (`@layer low, high;`, D7). An `@layer a, b;` statement before `@import` is valid **[verified · localtests-17, s06-run; verified 2026-10-16 · live-c02]**.
- **The `!important` reversal** **[verified · support-37, external-49, localtests-16]**:
  - Layered `!important` beats unlayered `!important`: `@layer base{.li{width:17px!important}} .li{width:18px!important}` computed to 17px.
  - Layered `!important` beats unlayered normal: a layered `#box{color:red!important}` imported with `layer()` beat `.b{color:green}`.
- **Layered rules still apply** wherever nothing unlayered competes (D6) **[verified · localtests-16]**.
- **Tailwind v4.** Its output is wrapped in `@layer theme, base, components, utilities`, so it loses **[documented · localtests-16]**.
  - **Stripping the layers is not enough.** An unlayered single-class utility (0,1,0) still lost to the base `.user_page a` (0,1,1). Even a layered `#wrapper#wrapper a.v7-lay` (2,1,1) lost **[verified · localtests-16]**.
  - **Option 1:** `@import "tailwindcss" important;` emits `!important` inside `@layer utilities`, which wins through the reversal above **[documented · localtests-16]**. The utilities then also beat your own unlayered `!important` fixes, so plan an earlier-declared override layer (§6.1) **[verified · gapfill06-03]**.
  - **Option 2:** an unlayered build whose selectors carry `#wrapper` **[verified · localtests-16]**.
#### 6.1 When `layer()` is the right tool

Layer a sheet only when you *want* it to lose. Checked on 2026-10-14 against the **real** `user.css` and a real profile's DOM and `user_theme` (scripts stripped, offline) **[verified · gapfill06-01, gapfill06-02, gapfill06-03]**:

| You import… | Result | Use it? |
|---|---|---|
| Animate.css **unlayered** | its `@keyframes bounce` replaces itch's for `.animate_bounce` inside **and** outside `#wrapper` (itch's Follow button uses that class) | **no** |
| Animate.css with **`layer(fw)`** | itch's `bounce` kept everywhere; `#wrapper .custom-pop{animation:bounceIn …}` runs | **yes**, for keyframes |
| `layer(fw)`, then `animation:bounce` in your rule | resolves to **itch's** `bounce`: a layered name that clashes is unusable | rename instead |
| `layer(fw)` plus your own unlayered `@keyframes bounce` | yours wins, and it hijacks itch's Follow button again | prefix your names (§9) |
| a layered base (`@layer fw{body{margin:7px} h1{letter-spacing:3px}}`) | `body` margin stays itch's `0`; the `h1` letter-spacing **applies** (itch sets none) | only if leaking is acceptable |
| Tailwind-v4-style `@layer utilities{.custom-red{color:…!important}}` | **beats** your own unlayered `#wrapper .user_profile a.custom-red{…!important}` (1,2,1) | only with a plan to override it (below) |

- **Overrides go unlayered.** For normal declarations, unlayered rules beat every layer. Your `#wrapper` fixes must stay outside `@layer`.
- **To beat a layered `!important`,** put your `!important` in an *earlier-declared* layer. `@layer custom-override, theme, base, components, utilities;` followed by `@layer custom-override{.custom-red{color:…!important}}` won over the utilities layer's `!important` **[verified · gapfill06-03]**. An unlayered `!important` does not win. This also works when the framework comes in through an import: `@layer custom-override, utilities;` then `@import url(…) layer(utilities);` then the override block. The import loaded into the `utilities` layer, and the override layer's `!important` won **[verified · gapfill06-03 v8]**. An `@layer` statement may precede `@import` (§5).
- **Keyframe names are case-sensitive.** With Animate.css unlayered, itch's `heartbeat` and `bouncein` kept their own frames next to Animate's `heartBeat` and `bounceIn`. Only the exact name `bounce` clashed **[verified · gapfill06-01]**.
- **A layer lowers priority but never scopes.** Global selectors in a layered sheet still reach itch's UI wherever nothing unlayered sets the same property **[verified · gapfill06-02, x08-03]**.

### 7. Custom properties: inheritance, not specificity

- **The nearest declaring ancestor wins.** With `#wrapper{--a:X}` and a theme rule `.user_page{--a:Y}`, everything inside `.user_page` gets Y, whatever the specificity (A11) **[verified · localtests-06, s06-run]**.
- **Where each theme declares its `--itchio_*` variables**, as served on 2026-10-14 **[verified · localtests-06, s06-heads]**:

| Page | Theme declares on | Same node as `#wrapper`? | Override with |
|---|---|---|---|
| Profile | `.user_page` (and `--itchio_ui_bg` on `:root`) | no, it is a child | `#wrapper .user_page{--itchio_link_color:…}` |
| Project / devlog | `.wrapper` (`<div class="main wrapper game_page_wrapper" id="wrapper">`; the same classes in the owner's views of a draft project and of its draft devlog post **[verified 2026-10-16 · live-dom]**) | yes | `#wrapper{--…}` (the ID wins) |
| Jam overview | `.jam_page_wrap` | yes | `#wrapper{--…}` |

- **A variable only reaches rules that read `var()`.** On profiles and projects, the theme writes literal colors on more specific selectors:
  - **Profile.** The theme sets `.user_page a,.footer a{color:#hex}` (0,1,1) and a nested `.game_grid_widget .game_cell .game_title a.title{color:#hex}`. The base rule `a{color:var(--itchio_link_color, #da2c49)}` is only (0,0,1), so changing the variable does not recolor bio links **[inferred · docs-56; rule text verified · s06-heads, s06-static]**.
  - **Project.** `.inner_column a,.inner_column .footer a{color:#hex}` and `.inner_column .button,…:hover,…:active{background-color;color;text-shadow}` are literal in 48/48 sampled themes. Only secondary `game.css` consumers follow the variables, such as the `.button.outline` border, the star picker and tooltips **[inferred · crawlproject-22, docs-56; rule text verified · s06-heads]**.
  - **Jam.** Since the 2026-06 revamp, the generated jam theme has no literal link or button colors except the `!important` game-cell rule (§2), so the variables work there **[inferred · docs-56; generated part checked · s06-heads]**.
- **Focus rings.** Base CSS sets `:focus{outline-color:var(--itchio_input_focus_color)}` (0,1,0), so `#wrapper{--itchio_input_focus_color:…}` recolors link rings. But `.button:focus{outline-color:#361275}` is literal (white under `.dark_theme`).
  - An ID-scoped `:focus-visible` rule recolored all 33 focus stops inside `#wrapper` without `!important`. The variable alone left the 2 `.button` stops at `rgb(54,18,117)`.
  - Leave the 7 stops outside `#wrapper` alone: they are itch UI.
  - **[verified · a11y-53, a11y-58, s06-static]**
- **Runtime grid variables** (`--itchio_grid_cell_width`, `--itchio_grid_gap`, `--itchio_grid_cell_columns`) are readable from your rules (S4) **[inferred · community-47; verified locally · s06-run S4]**.

```css
#wrapper .user_page{--itchio_link_color:#ffc857}             /* profile: reaches var() consumers only */
#wrapper .user_page a,#wrapper .footer a{color:#ffc857}       /* profile links: the theme uses a literal */
#wrapper .inner_column a{color:#ffc857}                       /* project links */
#wrapper :is(a,.button):focus-visible{outline:3px solid #ffc857;outline-offset:3px}
```

### 8. Styles itch's JavaScript adds after yours

- **Profile grid sizer.** Two `style[itchio-grid-sizer]` elements followed `style#custom_css` on the live profile, owner and logged out **[verified 2026-10-16 · live-dom]**. Their rules, below, come from source code **[inferred · community-47; source re-read · s06-js]**.
  - `user.min.js` creates a `GameGridSizer` for `.mode_grid .user_game_grid` (cell margin 10px below a 500px window, 20px otherwise; at least 2 columns), and another for `.game_grid_widget.game_list` (`expected_size` 250).
  - `bundle.min.js` builds the rule `<selector>{--itchio_grid_gap;--itchio_grid_cell_width;--itchio_grid_cell_columns;grid-template-columns:repeat(N, Wpx)}`. It appends it as `<style itchio-grid-sizer type='text/css'>` to `<head>`, after `custom_css`, and rebuilds it on resize.
  - **In a local imitation, the plain selector lost and the prefixed one won** **[verified locally · s06-run S1–S3]**:
    - a pasted `.mode_grid .user_game_grid{grid-template-columns:…}` ties and **loses** (S2);
    - `#wrapper .mode_grid .user_game_grid{…}` **wins** (S3).
- **Jam overview grid.** This one was not tested on a live jam **[source · s06-js; verified locally · s06-run S5, S6]**.
  - `jam.min.js` calls `new I.GameGrid(…)` on `.browse_game_grid`.
  - In `bundle.min.js`, a `GameGrid` gives its element a generated `id` if it has none, and then sizes it with `container_selector:"#"+id`. The sizer rule therefore weighs (1,0,0).
  - In a local imitation, `.view_jam_page .browse_game_grid` (0,2,0) loses (S5), and `#wrapper .browse_game_grid` (1,1,0) wins (S6).
- **GIF hover.** In `bundle.min.js`, `setup_gifs` sets an inline `background-image:url(<gif>)` on `.gif_overlay` at a `.game_cell`'s first `mouseenter`. Overriding that property takes `!important` **[source · s06-js; not render-tested]**.
- **Wide project embeds.** In `game.min.js`, `fit_to_width(w)` is called with the embed width. Above 920px it sets inline `width` and `max-width` on `#inner_column`: `width:auto;max-width:Wpx` when responsive or on mobile, otherwise `width:Wpx;max-width:Wpx`. Changing those takes `!important` **[source · s06-js; not render-tested]**.

### 9. `@property` and `@keyframes` across sheets

- **Both are document-global.** A `@property` registered in a *cross-origin* imported sheet applies to pasted rules (G0). Pasted rules can use `@keyframes` from an import, and the reverse also works (G3, G4) **[verified · s06-run]**.
- **On a name clash, the later definition wins** **[verified · s06-run]**:
  - A pasted rule beats an imported one, for `@keyframes` (G5) and for `@property` (G7: `2deg` over `1deg`).
  - An unlayered `@keyframes` beats a later one of the same name inside `@layer` (G8: 50px, not 60px).
- **itch defines 13 global keyframe names**, identical in `user.css`, `game.css` and `jam.css`: `bounce`, `bouncein`, `drop_down`, `heartbeat`, `intro`, `lightbox_intro`, `loader-left`, `loader-right`, `popin`, `popout`, `pulse_opacity`, `scroll_background`, `spin` **[verified · s06-static]**.
  - A pasted `@keyframes bounce{…}` replaced itch's `bounce` for `.animate_bounce` both inside and outside `#wrapper` (K1, K2) **[verified · s06-kf]**. Prefix your names (`custom-…`).
  - **Why it matters:** itch's Follow button adds `animate_bounce` when a visitor follows and `animate_drop_down` when they unfollow (`follow_button_widget` in `bundle.min.js`). A clash changes that animation **[source · gapfill06-01]**.
  - **An unlayered framework import clashes the same way.** Animate.css 4.1.1 replaced itch's `bounce` on the real `user.css`; `layer(fw)` on the import prevented it (§6.1) **[verified · gapfill06-01]**.
  - itch defines no `@property`, so registrations cannot clash **[verified · s06-static]**.
- **An invalid `@property` is silently ignored.** One with no `initial-value` for a non-`*` syntax leaves the property unregistered (G7b). Unregistered properties animate **discretely**: still `0deg` at 25% (G2r). A registered `<angle>` interpolates: `180deg` at 50% (G2) **[verified · s06-run]**.
- **`inherits:false` hides the parent's value from children** (G6). Register with `inherits:true` when a parent drives its children **[verified · s06-run]**.
- **`animation` is a list.** A second rule that sets `animation` on the same element replaces the whole list. To add motion from another sheet, animate a registered, inherited property on the parent and compute from it in the children, e.g. `font-weight:calc(550 + 150*sin(var(--breath)))` **[verified · repo-45]**.
  - Support: `@property` needs Chrome 85 / Firefox 128 / Safari 16.4; `sin()` needs Chrome 111 / Firefox 108 / Safari 15.4 **[verified · repo-45]**.
- **`!important` on an animated property freezes it** (§4) **[verified · localtests-24]**.

### 10. Relative `url()` resolution

- **In pasted CSS, relative URLs resolve against the page URL** (F1). On itch that is `https://<user>.itch.io/…` or `https://itch.io/jam/…`, where you can't host files. Use absolute `https://` URLs or `data:` URIs **[verified locally · s06-run F1; the itch consequence is inferred]**.
- **In an imported sheet, relative URLs resolve against that sheet's URL.** This also holds for cross-origin sheets (F2, F3) and for an `@import` nested inside one (F7). A CSS service can therefore reference its own assets relatively **[verified · s06-run]**.
- **Trap: an unregistered custom property holding a relative `url()`** **[observed in Chrome 155 · s06-run]**:
  - Chromium resolved it against the sheet where `var()` is *used*, not where it is declared. A service exporting `--bg:url("dot.svg")`, used in pasted CSS, requested `<page folder>/dot.svg` (F4, F8). The reverse case resolved against the import's folder (F5).
  - A value registered with `@property --x{syntax:'<url>';…}` resolved where it was declared (F6).
  - Put only absolute URLs in variables.

### 11. Other cascade traps

- **`z-index` is trapped on Column-layout profiles.** On `.user_page.mode_column` above 800px, both columns are `position:sticky; top:10px`, which makes each a stacking context.
  - A fixed `z-index:5000` layer inside the bio stays under itch's `#user_tools` (z 2).
  - A layer on `#wrapper::before/::after` can rise above it, unless `#wrapper{isolation:isolate}` is set.
  - Test at both widths **[verified · itchcss-56]**.
- **Jam CSS leaks outside `#wrapper`** (§1). Scope every jam rule under `#wrapper` **[documented · docs-18]**.

### Symptom → cause → fix

| Symptom | Likely cause | Fix |
|---|---|---|
| A `#wrapper` rule has no effect on one property | theme `!important` (project/jam), base `!important`, or inline `style=""` | add `!important` (§2, §4) |
| Grid columns snap back on resize | `style[itchio-grid-sizer]` appended after your CSS | `#wrapper` plus a class (§8) |
| A rule from your CSS service is ignored | it ties with a pasted rule and loses | raise its specificity (§5) |
| The whole imported sheet is missing | `@import` not first, wrong MIME, 404, or a jam page | §5 |
| Tailwind or another framework has no effect | rules sit in `@layer`, or single-class utilities lose on specificity | §6 |
| Your `!important` fix can't beat a framework utility | the utility is a layered `!important` (reversal) | `!important` in an earlier-declared layer (§6.1) |
| A variable override does nothing | redeclared on `.user_page` (profile), or the target uses a literal color | §7 |
| An animation is frozen | `!important` on the animated property | §4 |
| An itch widget (e.g. the Follow button) animates strangely | your `@keyframes`, or an unlayered framework import, reuses an itch name such as `bounce` | prefix your names; import keyframe libraries with `layer()` (§6.1, §9) |
| A `url()` held in a variable 404s | an unregistered property resolves where `var()` is used | §10 |
| `@scope` or `:where()` rules lose to the theme | they add no ID weight | use `#wrapper` (§3) |
| An overlay hides under the profile's Follow bar | sticky columns are stacking contexts | layer on `#wrapper::before/::after` (§11) |

---

### Section notes

All checks below were made on 2026-10-14. Scripts are in `knowledge/evidence/section06-tools/`; raw downloads stay in the scratchpad (`…/scratchpad/section-06-v2/`). Request budget: 3 itch pages plus 1 rate-limited attempt (HTTP 429, not retried), 8 `static.itch.io` files, and 6 header checks on non-itch CDNs.

- **s06-run: the existing test pages, re-run in headless Chrome 155** (`chrome.exe` 155.0.8059.79, `--headless=new --virtual-time-budget=8000 --dump-dom`).
  - The `itch-live-css` root was served twice, with `python -m http.server 8090` and `8091` (the second origin is for cross-origin imports).
  - Command: `run.sh <out> <profile> a-import-cascade.html b-import-position.html c-mime-charset.html d-layers.html f-relative-url.html g-property-keyframes.html n-scope-specificity.html s06-runtime-styles.html`, then `python -I parse.py <out>/*.html`.
  - Results (PASS · FAIL · INFO): a 15·0·1, b 17·0·4, c 9·0·1, d 9·0·2, f 4·0·5, g 12·0·4, n 5·0·0, s06-runtime-styles 7·0·0.
  - The INFO values quoted above (B11b, F4–F6, F8, G2r, G8) are from this run.
  - `s06-runtime-styles.html` is a minimal imitation of the sizer `<style>` written for this section, not itch's code.
- **s06-heads: three live pages fetched with curl** (Chrome UA, ≥1 s apart) and parsed by `heads.py`: `https://mirokshi.itch.io/`, `https://maddymakesgamesinc.itch.io/towerfall` and `https://itch.io/jam/gmtk-2025`.
  - **Profile.**
    - Head order: `link user.css` → 7 scripts → `style#user_theme` (966 chars) → `style#custom_css`.
    - `user_theme`: 0 `!important`, 0 ID selectors, served nested. It declares the variables on `.user_page` and writes `.user_page a,.footer a` as a literal color.
    - `custom_css` starts with an `@import` and holds 2 of them.
    - Inline styles: 5 `style="background-color:#…;"`, all on thumbs.
    - Doctype: `<!DOCTYPE HTML>`.
  - **Project.**
    - Head order: `link game.css` → scripts → `style#game_theme` (4,837 chars) → `style#custom_css`.
    - Wrapper: `<div class="main wrapper game_page_wrapper" id="wrapper">`. Variables are declared on `.wrapper`.
    - `!important`: 8 declarations in 4 rules, as listed in §2. 0 ID selectors.
    - `.inner_column a…` and `.inner_column .button…` are literal colors.
  - **Jam.**
    - Head order: `link jam.css` → scripts → `style#jam_theme` (7,031 chars), with nothing after it.
    - Variables are declared on `.jam_page_wrap`.
    - Of 11 `!important`, 6 come before the end of the generated `.divider{…}` rule (offset 1,877) and 5 after it, in the host part (`.custom-footerimg`, `img`, `table`, `.view_jam_page .join_jam_btn`, `.owner_tools`).
    - The generated part has no literal link or button color other than the `!important` game-cell rule.
- **s06-static: an audit (`audit.py`) of `static.itch.io/{user,game,jam}.css?1791981660`**, fetched with curl. All three are `text/css`, at 71,824 / 164,629 / 71,053 bytes.
  - Each has the same 13 `@keyframes` names.
  - Each has 0 `@property`, `@layer`, `@import`, `@scope`, `@container` and `@supports`.
  - `!important` counts: 7 / 12 / 7.
  - ID selectors: only `#lightbox_container` and `#lightbox_shroud`.
  - Notable rules in `user.css`: `a{color:#da2c49;color:var(--itchio_link_color, #da2c49)}`, `.user_page .purchased_games h2 a,.user_page .collection_row h2 a{color:inherit !important;…}`, `:focus{outline-color:var(--itchio_input_focus_color)}` and `.button:focus{outline-color:#361275}`.
- **s06-js: source reads of `bundle.min.js`, `user.min.js`, `jam.min.js` and `game.min.js` (`?1791981660`).**
  - **`bundle.min.js`:**
    - `resize_cells` contains `"<style itchio-grid-sizer type='text/css'>"+n+"</style>").appendTo(w("head"))` and the `grid-template-columns: repeat(N, Wpx)` template.
    - `GameGrid` sets `this.el[0].id=Pe()` when the element has no id, then uses `container_selector:"#"+this.el[0].id`.
    - `setup_gifs` calls `.css("background-image","url("+i.data("gif")+")")` on `mouseenter`.
  - **`user.min.js`:** `container_selector:".mode_grid .user_game_grid"` (with `$(window).width()<500?10:20` and `min_columns:2`) and `".game_grid_widget.game_list"` (with `expected_size:250`).
  - **`jam.min.js`:** `this.grid=new I.GameGrid(t)` on `.browse_game_grid`.
  - **`game.min.js`:**
    - `fit_to_width` with `t>920` sets `$("#inner_column").css({width:…,maxWidth:t+"px"})`.
    - It has no `GameGridSizer` and no `<style` injection.
- **s06-jam: does a late `@import` load on a jam page?**
  - Input: a same-day copy (13:15 UTC) of `https://itch.io/jam/gdevelop-big-game-jam-10`, saved by the jam crawler. My own fetch got HTTP 429 and was not retried.
  - Method: `mkjam.py` copies its `style#jam_theme` text into a local page, which stays in the scratchpad only, alongside a synthetic sheet `.view_jam_page .jam_body{…} @import url("data:text/css,…"); @font-face{…} #wrapper .probe2{…}`.
  - **Real `jam_theme`:** 27 rules, 0 `CSSImportRule`; the `@import` text sits at offset 1,733.
  - **Synthetic sheet:** rule types `CSSStyleRule, CSSFontFaceRule, CSSStyleRule`; the imported color was not applied; the following rule applied; `document.fonts` contains the late `@font-face`.
- **s06-kf: does a pasted `@keyframes` replace itch's?**
  - Test page: `section06-tools/kf-clash.html` links the live `https://static.itch.io/user.css?1791981660` and defines `@keyframes bounce{from{opacity:.25}to{opacity:.25}}` in `style#custom_css`.
  - Measured with `getAnimations()[0].effect.getKeyframes()`: `.animate_bounce` inside and outside `#wrapper` both report `opacity=0.25` frames. The control `.animate_drop_down` keeps itch's `translate3d`/`opacity` frames.
- **s06-mime: response headers from `curl -L` GETs.**

  | Host (file) | Content-Type | `nosniff` |
  |---|---|---|
  | `raw.githubusercontent.com` (normalize.css) | `text/plain; charset=utf-8` | yes |
  | `cdn.jsdelivr.net`, `unpkg.com`, `cdnjs.cloudflare.com` (normalize.css 8.0.1) | `text/css; charset=utf-8` | yes |
  | `fonts.googleapis.com/css2` | `text/css; charset=utf-8` | — |
  | the owner's Vercel `/live.css` | `text/css; charset=utf-8` (`Cache-Control: no-store`) | — |

- **gapfill06-01 … 05: gap-fill pass, 2026-10-14 14:00–14:15 UTC.** Full method, commands and result tables are in `knowledge/evidence/gapfill.md` (section "Gap fill for 06"). Scripts are in `knowledge/evidence/gapfill-06-tools/`. No itch requests were made: everything ran on same-day scratchpad copies, with Chrome 155 offline (`--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"`).
  - **gapfill06-01:** x08-03 p12 re-run with real files: Animate.css unlayered vs `layer(fw)` against the real `user.css` and a real profile (`user_theme`, DOM). Keyframes were read with `getAnimations()[0].effect.getKeyframes()`.
  - **gapfill06-02:** a layered base, to see where it still applies.
  - **gapfill06-03:** a Tailwind-v4-style layered `!important` vs your unlayered `!important`, and vs an earlier-declared layer, both inline (v7) and with the framework imported via `layer(utilities)` (v8).
  - **gapfill06-04:** a construct census (`scan.py`) of the 62-page corpus and of every page copy fetched by this project's agents that day (146 page keys, 125 distinct sheets).
  - **gapfill06-05:** a byte comparison of one profile's served `custom_css` with its public source file, plus the owner's `dist/main.min.css` against the owner's served sheet.
- **Owner save test: done on a project and on the profile, open on jams** (needs an itch account). On 2026-10-16 the probe kit's `probe.css` saved equivalents of all six constructs below on a draft project and on the profile, and each was stored as sent and applied (on the profile, logged in and logged out) **[verified 2026-10-16 · live-c11 to live-c19]**. For a jam, paste this into its custom CSS, save, then `curl` the logged-out overview and diff the end of `style#jam_theme` against what was pasted:

  ```css
  @layer custom-a{#wrapper .custom-x{color:red}}
  @scope (#wrapper){:scope .custom-x{color:blue}}
  @property --custom-a{syntax:'<angle>';inherits:true;initial-value:0deg}
  @container (width<1px){#wrapper .custom-x{color:green}}
  @starting-style{#wrapper .custom-x{opacity:0}}
  @view-transition{navigation:auto}
  ```

  On the project, line breaks were stored as CRLF, on the profile as LF, and the outer whitespace was trimmed on both **[verified 2026-10-16 · live-css]**. Remove the probe afterwards.

**Conflicts resolved:**

- **"Custom CSS is the last stylesheet"** (corpus-14, crawlproject-36, itchcss-02) vs the runtime grid sizer (community-47). Both are true: custom CSS is last in the served HTML, and on profiles (two elements on the live profile, live-dom) and, from source, on jam overviews, itch's JS later appends `style[itchio-grid-sizer]` after it.
- **"`!important` is needed only for inline styles"** (crawlprofile-23). This holds against the *profile theme* only. Base `user.css` has 7 `!important`, e.g. the collection heading links (crawlprofile-53). Project and jam themes have their own `!important` rules (docs-17, crawljam-07).
- **Theme `!important` counts.** docs-17's "8" and crawlproject-36 / community-28's "4 groups" describe the same thing: 4 rules with 8 declarations, recounted on towerfall. For jams, crawljam-07's "6" is the generated part only. The gmtk-2025 `jam_theme` contains 11, of which 5 are in the host's appended CSS (s06-heads).
- **corpus-28's per-type counts.** Its detail field says "profiles 9/13", but the verifier's recount (comments excluded) gives 8/13, 17/26 and 20/23, which is 45 of 62 pages. The recount is used here.
- **localtests-16 "D-util".** The original Tailwind test was confounded. The corrected V7 result is used here: stripping `@layer` alone does not fix single-class utilities on links.
- **external-12 "loses to every unlayered rule".** That is true for normal declarations only. Layered `!important` wins (external-49, support-37).
- **support-14's spec reading.** Chrome's `@scope` behaviour matches css-cascade-6: `&` behaves as `:where(:scope)`, and specificity is compared before scope proximity. It is not a Chromium quirk (localtests-45).
- **`@charset`** (community-15 before its correction). It is harmless inside `<style>` and does not block a following `@import` (community-52; B5 re-run).
- **Jam variables** (docs-56). The claim that jam themes no longer emit per-selector link and button colors is consistent with the generated part of gmtk-2025. The literal `a` colors found in that `jam_theme` are in the host's appended CSS (s06-heads).
- **`@layer` guidance** (this section's old rule 3 and 09 #13 "never layer" vs 08 §12.4/§12.5 "import Animate.css with `layer(fw)`" and 08 §12.3 "Tailwind v4 imports with `layer(...)`"). Both hold, for different jobs:
  - never layer *overrides*;
  - layering a sheet that should lose (keyframes-only libraries, a low-priority base) is fine;
  - layered `!important` wins by reversal.
  
  Rule 3 and §6.1 now say this explicitly, and the p12 result was re-verified on real files (gapfill06-01). 09 #13 needs the same exception; it was not edited in this pass.
- **What survives a save** (old §3 "nesting untested" vs 01 §4 and 07 §7.1 "served unchanged"). Nesting, range queries and `:has()` are seen in served CSS, with one byte-identical source match (gapfill06-04, gapfill06-05, community-38). `@property` is seen only on one jam. `@container` is seen on 1 project outside the 62-page corpus, so 07 §7.1's "0 of 62" is correct, but the wider sample has 1. `@layer`, `@scope`, `@starting-style` and `@view-transition` were never seen in served pages. The owner save tests above settled them for projects and profiles on 2026-10-16 (live-c11 to live-c19); they remain open for jams.
