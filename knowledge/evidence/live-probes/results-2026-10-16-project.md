# Live probe results: project, 2026-10-16

Kit v1 (2026-10-14), Run 1, filled in from [`probe-report-project-2026-10-16.json`](probe-report-project-2026-10-16.json). The "predicted" columns are the template's: HTML predictions come from leafo's `web_sanitize` with the itch-model whitelist (H1: prefix class filter; H2: strict characters); CSS predictions come from the knowledge base's "itch passes CSS through". The "Chrome 155 applies" column is what the kit's offline test measured when the text survives.

**Scope.** Everything below holds for a **draft project page**, its **description** and its **Custom CSS**, viewed by the **owner, logged in**, in **Brave 155 (Chromium 155)** on Windows. It says nothing yet about profiles, bios, devlogs or jams, or about logged-out visitors.

## 0. Headline results

1. **Class filter = a `custom` prefix test (H1).** Every token that starts with lowercase `custom` survives, whatever follows: `custom-hover:x`, `custom-md:flex`, `custom-w-[3px]`, `custom-mt-[-1rem]`, `custom-w-1/2`, `custom-bg-red-500/50`, `custom-d.e`, `custom:flex`, `custom-café`, and also `customc`, `custom_d`, `customer` and a bare `custom-`. `Custom-a`, `CUSTOM-b`, `-custom-f`, `md:custom-g`, `!custom-h` and `xcustom-i` are dropped (k01–k20). The escaped selectors `.custom-hover\:x` and `.custom-w-\[3px\]` match (c38, c39). This removes the Tailwind blocker.
2. **`</style>` is removed from the CSS**, case-insensitively and with inner whitespace (`</STYLE >`), wherever it appears (comment or string); nothing else in the sheet changes and the `<style>` element is not closed early (c42–c44).
3. **Leading and trailing whitespace of the CSS is trimmed**, and line endings are stored as CRLF (52 CR for 52 LF). Everything else is stored as sent, including `@charset`, every `@import` form, an `http://` `@font-face` src, `expression()`, `behavior:`, `-moz-binding:` and `url(javascript:)` (c01–c41, c45).
4. **`data:` `@import` applies** on a project page, with `layer()`, `supports()` and media (c05–c08): a no-host way to split CSS.
5. **The description sanitizer matches the library model** on 147 of 155 probes. The 8 differences: the hand-written spoiler keeps `tabindex` (k34); a line break inside `style` drops the whole attribute (s31); `language-css` survives on `<code>` (t03); `<wbr>` survives (t11); `<video controls>` survives (t14); a relative `href` gets no `rel` (l04); an `<img>` with a `data:` src is removed whole (g06); a tag with a line break inside is escaped as text (e06).
6. **A raw `< div` in the text closes the description container** (e08, as predicted): `x99` landed outside `div.formatted_description`.

## 1. Run facts

| Field | Value |
|---|---|
| Date and time (UTC) | 2026-10-16 09:34:40 |
| Kit version | v1 (2026-10-14) |
| Run | 1 draft project |
| Page type (`page.type`, `page.pageName`) | project, `view_game` |
| Visibility | Draft |
| HTML field used | project description |
| Payload pasted | `probe-description.html` and `probe.css`, from the clipboard (both verified identical to the kit files before pasting) |
| Stayed in HTML mode (`<>`) the whole time | yes (instructed; not separately confirmed) |
| CSS textarea started with two empty lines before saving | not confirmed for the first save; confirmed on a re-save the same day (see §3) |
| Viewer | owner logged in |
| Account has CSS access | yes (`dom.ownerConfig.canUseCssFlag: true`) |
| Browser and version (`page.browser`) | Brave 155 (Chromium 155), default Shields |
| OS, viewport (`page.viewport`) | Windows, 2560×708, DPR 1, `prefers-color-scheme: dark`, motion not reduced |
| itch site theme and site language (logged-in runs) | not recorded; body has `locale_en no_theme_toggle` |
| Messages shown on save (exact text) | none reported |
| Report file | `probe-report-project-2026-10-16.json` |
| Warnings in the report (`warnings`) | none |

## 2. Theme-editor settings at the time of the run

The editor settings were not written down. The report gives the generated facts.

| Setting | Value |
|---|---|
| Background colour(s), text, links, buttons | not recorded (theme block: `#eeeeee` page, white column, `#fa5c5c` buttons, `#e5e5e5`/`#d8d8d8` accents, so close to itch's defaults) |
| Font, size | not recorded (`#inner_column.size_large.family_lato`) |
| Background image, banner, layout, corners | not recorded |
| `theme.backgroundDeclarations` (from the report) | 20 declarations in `style#game_theme` (4,649 chars, no line breaks), none on `#wrapper` with an image |
| `theme.classes` (from the report) | body `has_site_header locale_en game_layout_widget layout_widget responsive no_theme_toggle`; `div#wrapper.main.wrapper.game_page_wrapper`; `div#inner_column.inner_column.size_large.family_lato`; `div#header.header` |

## 3. CSS sheet (probe.css)

| Item | Expected or sent | Live |
|---|---|---|
| Block (`css.block`) | `custom_css` (profile, project, devlog) or `jam_theme` | `custom_css` (one block) |
| Stored characters / bytes / CR / LF (`css.stored`) | sent: 2,725 / 2,741 / 0 / 56 (between the markers: `css.sent` 2,717 / 2,733 / 0 / 52) | 2,752 / 2,768 / 52 / 52: the 52 LF became CRLF; the rest is c42/c43 |
| Leading whitespace (`css.leadingBeforeStartMarker`) | `"\n\n  "` if kept, `""` if trimmed | `""`: **trimmed**. Re-checked on 2026-10-16: `probe.css` pasted again, the two empty lines confirmed with Ctrl+Home before saving, `check.js` re-run: still `""` |
| Trailing whitespace (`css.trailingAfterEndMarker`) | `"\n\n  "` if kept, `""` if trimmed (jam: itch adds `" "`) | `""`: **trimmed** |
| Identical apart from line endings (`css.identicalIgnoringLineEndings`, `css.firstDifference`) | yes, unless c42/c43 changed | no: first difference at 2,477, where `</style>` was removed from the c42 comment; the c43 string lost `</STYLE >` |
| Style element closed early (`css.styleElementClosedEarly`) | open question (c42) | no |
| CSSOM rule types (`css.cssom.types`) | 14 types in Chrome 155 | 14 types, 50 top-level rules: layer statement 1, import 6, style 27, layer block 2, font-face 2, property 3, container 2, scope 1, starting-style 1, view-transition 1, supports 1, media 1, function 1, counter-style 1 |
| `[c45]` visible at the start of the description | yes, if the whole sheet applied | yes (c45 applied with its full text) |

The CRLF may come from the browser, which submits textarea line breaks as CRLF, rather than from itch. Run 2 settled it: the same paste from the same browser was stored with LF on the profile, so itch adds the CR on projects ([profile results](results-2026-10-16-profile.md)). The four probe requests (`example.com` CSS, an `http://` font, an `example.com` image) report status 0: blocked or failed, which can't be told apart here (Brave Shields was on).

## 4. CSS probes

| Id | Tests | Predicted at itch | Chrome 155 applies | Live outcome | Applied | Value / notes |
|---|---|---|---|---|---|---|
| c00 | baseline rule | survived | yes | survived | yes | `1` |
| c01 | `@charset` (not first) | survived | n/a (text only) | survived | n/a | |
| c02 | `@layer` statement before `@import` | survived | yes | survived | yes | `1 \| CSSLayerStatementRule` |
| c03 | non-Google HTTPS `@import` | survived | yes | survived | yes | `CSSImportRule +requested` |
| c04 | `http://` `@import` | survived | yes | survived | yes | `CSSImportRule +requested` |
| c05 | `data:` `@import` | survived | yes | survived | yes | `1` |
| c06 | `@import … layer()` | survived | yes | survived | yes | `1` |
| c07 | `@import … supports()` | survived | yes | survived | yes | `1` |
| c08 | `@import … screen` | survived | yes | survived | yes | `1` |
| c09 | `@font-face` `local()` | survived | yes | survived | yes | `FontFace unloaded` |
| c10 | `@font-face` `http://` src | survived | yes | survived | yes | `FontFace unloaded` |
| c11 | `@layer` block | survived | yes | survived | yes | `1` |
| c12 | `@property` (`<` in syntax) | survived | yes | survived | yes | `7px` |
| c13 | `@container` size query | survived | yes | survived | yes | `1` |
| c14 | `@container style()` | survived | yes | survived | yes | `1` |
| c15 | `@scope` | survived | yes | survived | yes | `1` |
| c16 | nesting `&` | survived | yes | survived | yes | `1` |
| c17 | nested `@media` | survived | yes | survived | yes | `1` |
| c18 | `@starting-style` | survived | yes | survived | yes | `CSSStartingStyleRule` |
| c19 | `@view-transition` | survived | yes | survived | yes | `CSSViewTransitionRule` |
| c20 | `@supports` with `not` | survived | yes | survived | yes | `1` |
| c21 | range media `<=` | survived | yes | survived | yes | `1` |
| c22 | `!important` | survived | yes | survived | yes | `1` |
| c23 | raw `>` combinator | survived | yes | survived | yes | `1` |
| c24 | `& < >` in a string | survived | yes | survived | yes | `"a&b<i>c>d"` |
| c25 | raw non-ASCII string | survived | yes | survived | yes | `"→é漢😀"` |
| c26 | `\hex` escapes incl. `\3c` | survived | yes | survived | yes | `"→" "</x>"` |
| c27 | `content: "x" / ""` | survived | yes | survived | yes | `"[c27]" / ""` |
| c28 | `random()` | survived | no | survived | no | `0`: Chromium 155 lacks `random()` (expected) |
| c29 | `sibling-index()` | survived | yes | survived | yes | `1` |
| c30 | `@function` | survived | yes | survived | yes | `1` |
| c31 | raw `<svg>` in a `data:` URL | survived | yes | survived | yes | `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>")` |
| c32 | `expression()` | survived | n/a (text only) | survived | n/a | |
| c33 | `behavior:` | survived | n/a (text only) | survived | n/a | |
| c34 | `-moz-binding:` | survived | n/a (text only) | survived | n/a | |
| c35 | `url(javascript:)` | survived | n/a (text only) | survived | n/a | |
| c36 | `@counter-style` | survived | yes | survived | yes | `CSSCounterStyleRule` |
| c37 | non-ASCII in a comment | survived | yes | survived | yes | `1` |
| c38 | escaped selector `.custom-hover\:x` | survived | only if k07/k09 kept | survived | yes | `1` |
| c39 | escaped selector `.custom-w-\[3px\]` | survived | only if k07/k09 kept | survived | yes | `1` |
| c40 | `<!--` in a comment | survived | yes | survived | yes | `1` |
| c41 | `<script>` in a comment | survived | yes | survived | yes | `1` |
| c42 | `</style>` in a comment | open | yes if `</style>` is removed | rewritten (`</style>` removed from the comment) | yes | `1` |
| c43 | `</STYLE >` in a string | open | yes if `</style>` is removed | rewritten (`</STYLE >` removed from the string) | no | `""`: the string is now empty, so the sentinel reads as not applied |
| c44 | canary after both | open | yes if `</style>` is removed | survived | yes | `1` |
| c45 | visible end marker | survived | yes | survived | yes | `"[c45] probe.css: end of sheet reached"` |

## 5. HTML probes

Live outcome: `survived` / `stripped` / `rewritten` / `missing` (see README). Copy the first one or two `details` and note anything that differs from the prediction.

| Id | Probe | Predicted (library model) | Live outcome | Live details / differs from prediction? |
|---|---|---|---|---|
| x00 | PROBE-HTML-START set=full kit=v1 2026-10-14 (temporary test …(+24) | survived | survived | as predicted |
| k01 | Custom-a | stripped: class tokens dropped: Custom-a | stripped: class tokens dropped: Custom-a | as predicted |
| k02 | CUSTOM-b | stripped: class tokens dropped: CUSTOM-b | stripped: class tokens dropped: CUSTOM-b | as predicted |
| k03 | customc | survived | survived | as predicted |
| k04 | custom_d | survived | survived | as predicted |
| k05 | customer | survived | survived | as predicted |
| k06 | custom- (bare prefix) | survived | survived | as predicted |
| k07 | custom-hover:x | H1 survived / H2 stripped: class tokens dropped: custom-hover:x | survived | H1 confirmed: a `custom` prefix test, any characters after it |
| k08 | custom-md:flex | H1 survived / H2 stripped: class tokens dropped: custom-md:flex | survived | H1 confirmed |
| k09 | custom-w-[3px] | H1 survived / H2 stripped: class tokens dropped: custom-w-[3px] | survived | H1 confirmed |
| k10 | custom-mt-[-1rem] | H1 survived / H2 stripped: class tokens dropped: custom-mt-[-1rem] | survived | H1 confirmed |
| k11 | custom-w-1/2 | H1 survived / H2 stripped: class tokens dropped: custom-w-1/2 | survived | H1 confirmed |
| k12 | custom-bg-red-500/50 | H1 survived / H2 stripped: class tokens dropped: custom-bg-red-500/50 | survived | H1 confirmed |
| k13 | custom-d.e | H1 survived / H2 stripped: class tokens dropped: custom-d.e | survived | H1 confirmed |
| k14 | custom:flex | H1 survived / H2 stripped: class tokens dropped: custom:flex | survived | H1 confirmed |
| k15 | custom:md:flex | H1 survived / H2 stripped: class tokens dropped: custom:md:flex | survived | H1 confirmed |
| k16 | -custom-f | stripped: class tokens dropped: -custom-f | stripped: class tokens dropped: -custom-f | as predicted |
| k17 | md:custom-g | stripped: class tokens dropped: md:custom-g | stripped: class tokens dropped: md:custom-g | as predicted |
| k18 | !custom-h | stripped: class tokens dropped: !custom-h | stripped: class tokens dropped: !custom-h | as predicted |
| k19 | xcustom-i | stripped: class tokens dropped: xcustom-i | stripped: class tokens dropped: xcustom-i | as predicted |
| k20 | custom-café | H1 survived / H2 stripped: class tokens dropped: custom-café | survived | H1 confirmed (non-ASCII kept) |
| k21 | custom-Hero | survived | survived | as predicted |
| k22 | text-left | stripped: class tokens dropped: text-left | stripped: class tokens dropped: text-left | as predicted |
| k23 | text-right | survived | survived | as predicted |
| k24 | text-center | survived | survived | as predicted |
| k25 | text-justify | survived | survived | as predicted |
| k26 | foo | stripped: class tokens dropped: foo | stripped: class tokens dropped: foo | as predicted |
| k27 | button | stripped: class tokens dropped: button | stripped: class tokens dropped: button | as predicted |
| k28 | inner_column | stripped: class tokens dropped: inner_column | stripped: class tokens dropped: inner_column | as predicted |
| k29 | extra whitespace in class | rewritten: class re-serialised as "custom-probe-k29 custom-ws" | rewritten: class re-serialised as "custom-probe-k29 custom-ws" | as predicted |
| k30 | duplicate token | survived | survived | as predicted |
| k31 | all tokens invalid | stripped: `<span.foo.bar>` @class dropped | stripped: `<span.foo.bar>` @class dropped | as predicted |
| k32 | empty class | stripped: `<span>` @class dropped | stripped: `<span>` @class dropped | as predicted |
| k33 | bare class | stripped: `<span>` @class dropped | stripped: `<span>` @class dropped | as predicted |
| k34 | hand-written spoiler | stripped: `<span.spoiler>` @tabindex dropped | survived | DIFFERS: `span.spoiler[tabindex=0]` kept whole; tabindex is allowed on the spoiler class only (a06 still dropped) |
| a01 | id | stripped: @id dropped | stripped: @id dropped | as predicted |
| a02 | data-* | stripped: @data-probe dropped | stripped: @data-probe dropped | as predicted |
| a03 | aria-label | stripped: @aria-label dropped | stripped: @aria-label dropped | as predicted |
| a04 | aria-hidden | stripped: @aria-hidden dropped | stripped: @aria-hidden dropped | as predicted |
| a05 | role | stripped: @role dropped | stripped: @role dropped | as predicted |
| a06 | tabindex | stripped: @tabindex dropped | stripped: @tabindex dropped | as predicted |
| a07 | hidden | stripped: `<span>` @hidden dropped | stripped: `<span>` @hidden dropped | as predicted |
| a08 | title | survived | survived | as predicted |
| a09 | lang | survived | survived | as predicted |
| a10 | dir | survived | survived | as predicted |
| a11 | onclick | stripped: @onclick dropped | stripped: @onclick dropped | as predicted |
| a12 | popover + id | stripped: `<div>` @popover dropped; `<div>` @id dropped | stripped: `<div>` @popover dropped; `<div>` @id dropped | as predicted |
| a13 | button popovertarget | rewritten: `<button>` escaped as visible text | rewritten: `<button>` escaped as visible text | as predicted |
| a14 | a popovertarget | stripped: `<a>` @popovertarget dropped | stripped: `<a>` @popovertarget dropped | as predicted |
| a15 | accesskey | stripped: @accesskey dropped | stripped: @accesskey dropped | as predicted |
| a16 | contenteditable | stripped: @contenteditable dropped | stripped: @contenteditable dropped | as predicted |
| a17 | draggable | stripped: @draggable dropped | stripped: @draggable dropped | as predicted |
| a18 | translate | stripped: @translate dropped | stripped: @translate dropped | as predicted |
| a19 | inert | stripped: `<span>` @inert dropped | stripped: `<span>` @inert dropped | as predicted |
| a20 | h1 aria-label | stripped: @aria-label dropped | stripped: @aria-label dropped | as predicted |
| a21 | p lang title dir | survived | survived | as predicted |
| s01 | color (control) | survived | survived | as predicted |
| s02 | !important | stripped: @style dropped | stripped: @style dropped | as predicted |
| s03 | font-size 1.5em | stripped: style declarations dropped: font-size:1.5em | stripped: style declarations dropped: font-size:1.5em | as predicted |
| s04 | 150% + line-height | stripped: style declarations dropped: line-height:2 | stripped: style declarations dropped: line-height:2 | as predicted |
| s05 | display float | stripped: style declarations dropped: display:flex; float:left | stripped: style declarations dropped: display:flex; float:left | as predicted |
| s06 | background url no-repeat | stripped: style declarations dropped: background:url('https://example.com/probe-s06.png') no-repeat | stripped: style declarations dropped: background:url('https://example.com/probe-s06.png') no-repeat | as predicted |
| s07 | border-radius + slash rgb | stripped: @style dropped | stripped: @style dropped | as predicted |
| s08 | six never-seen list properties | survived | survived | as predicted |
| s09 | border-radius | stripped: style declarations dropped: border-radius:4px | stripped: style declarations dropped: border-radius:4px | as predicted |
| s10 | display | stripped: style declarations dropped: display:block | stripped: style declarations dropped: display:block | as predicted |
| s11 | custom property + color | stripped: style declarations dropped: --i:3 | stripped: style declarations dropped: --i:3 | as predicted |
| s12 | custom property alone | stripped: style declarations dropped: --i:3 | stripped: style declarations dropped: --i:3 | as predicted |
| s13 | position top | stripped: style declarations dropped: position:relative; top:1px | stripped: style declarations dropped: position:relative; top:1px | as predicted |
| s14 | font-family weight | stripped: style declarations dropped: font-family:serif; font-weight:700 | stripped: style declarations dropped: font-family:serif; font-weight:700 | as predicted |
| s15 | transform | stripped: style declarations dropped: transform:rotate(5deg) | stripped: style declarations dropped: transform:rotate(5deg) | as predicted |
| s16 | decimal percent | stripped: @style dropped | stripped: @style dropped | as predicted |
| s17 | trailing whitespace | stripped: @style dropped | stripped: @style dropped | as predicted |
| s18 | no-space list | stripped: style declarations dropped: float:left; border-radius:5px | stripped: style declarations dropped: float:left; border-radius:5px | as predicted |
| s19 | gradient | stripped: style declarations dropped: background:linear-gradient(red, blue) | stripped: style declarations dropped: background:linear-gradient(red, blue) | as predicted |
| s20 | var() in color | survived | survived | as predicted |
| s21 | uppercase property | stripped: style declarations dropped: COLOR:red | stripped: style declarations dropped: COLOR:red | as predicted |
| s22 | comment in style | stripped: @style dropped | stripped: @style dropped | as predicted |
| s23 | 8-digit hex | survived | survived | as predicted |
| s24 | calc | stripped: style declarations dropped: width:calc(100% - 10px) | stripped: style declarations dropped: width:calc(100% - 10px) | as predicted |
| s25 | empty style | survived | survived | as predicted |
| s26 | line-height letter-spacing | stripped: style declarations dropped: line-height:1.5; letter-spacing:2px | stripped: style declarations dropped: line-height:1.5; letter-spacing:2px | as predicted |
| s27 | decoration shadows | stripped: style declarations dropped: text-decoration:underline; text-shadow:0 0 2px red; box-shadow:0 0 2px red | stripped: style declarations dropped: text-decoration:underline; text-shadow:0 0 2px red; box-shadow:0 0 2px red | as predicted |
| s28 | auto + 100% | stripped: style declarations dropped: height:auto | stripped: style declarations dropped: height:auto | as predicted |
| s29 | em values | stripped: style declarations dropped: padding:0.5em 1em | stripped: style declarations dropped: padding:0.5em 1em | as predicted |
| s30 | comma colour functions | survived | survived | as predicted |
| s31 | LF inside style attribute | rewritten: `<span>` style re-serialised as "color: red; width: 10px" | stripped: `<span>` @style dropped | DIFFERS: a line break inside `style` drops the whole attribute (library: re-serialised) |
| t01 | b and i | survived | survived | as predicted |
| t02 | edits | rewritten: `<ins>` escaped as visible text; `<del.custom-t02d>` @class dropped; `<del.custom-t02d>` @datetime dropped; `<del.custom-t02d>` @title dropped | rewritten: `<ins>` escaped as visible text; `<del.custom-t02d>` @class dropped; `<del.custom-t02d>` @datetime dropped; `<del.custom-t02d>` @title dropped | as predicted |
| t03 | inline | stripped: `<code.language-css.custom-t03c>` class tokens dropped: language-css | survived | DIFFERS: `language-css` kept on `<code>` (allowed class, like the editor's code blocks) |
| t04 | phrasing | rewritten: `<bdi>` escaped as visible text; `<bdo>` escaped as visible text; `<data>` escaped as visible text | rewritten: `<bdi>` escaped as visible text; `<bdo>` escaped as visible text; `<data>` escaped as visible text | as predicted |
| t05 | blocks | survived | survived | as predicted |
| t06 | h5 h6 | survived | survived | as predicted |
| t07 | lists | stripped: `<ol.custom-t07o>` @start dropped; `<ol.custom-t07o>` @reversed dropped; `<ol.custom-t07o>` @type dropped; `<li>` @value dropped | stripped: `<ol.custom-t07o>` @start dropped; `<ol.custom-t07o>` @reversed dropped; `<ol.custom-t07o>` @type dropped; `<li>` @value dropped | as predicted |
| t08 | details name open | stripped: `<details.custom-t08d>` @class dropped; `<details.custom-t08d>` @title dropped; `<details.custom-t08d>` @style dropped; `<details.custom-t08d>` @name dropped; … | stripped: `<details.custom-t08d>` @class dropped; `<details.custom-t08d>` @title dropped; `<details.custom-t08d>` @style dropped; `<details.custom-t08d>` @name dropped; `<details.custom-t08d>` @open dropped; `<summary.custom-t08s>` @class dropped; `<summary… | as predicted |
| t09 | figure | stripped: `<figure.custom-t09f>` @class dropped; `<figure.custom-t09f>` @style dropped; `<figcaption.custom-t09c>` @class dropped; … | stripped: `<figure.custom-t09f>` @class dropped; `<figure.custom-t09f>` @style dropped; `<figcaption.custom-t09c>` @class dropped; `<figcaption.custom-t09c>` @style dropped | as predicted |
| t10 | legacy | rewritten: `<center>` escaped as visible text; `<ruby.custom-t10r>` @class dropped; `<rt.custom-t10t>` @class dropped; `<font>` @color dropped; `<font>` @face dropped; … | rewritten: `<center>` escaped as visible text; `<ruby.custom-t10r>` @class dropped; `<rt.custom-t10t>` @class dropped; `<font>` @color dropped; `<font>` @face dropped; `<font>` @size dropped | as predicted |
| t11 | unknown | rewritten: `<marquee>` escaped as visible text; `<wbr>` escaped as visible text | rewritten: `<marquee>` escaped as visible text | DIFFERS: `<wbr>` kept, served as `soft<wbr>break</wbr>`; `<marquee>` escaped as predicted |
| t12 | self-closed span | rewritten: `<span.custom-t12x>` escaped as visible text | rewritten: `<span.custom-t12x>` escaped as visible text | as predicted |
| t13 | svg math | rewritten: `<svg.custom-t13s>` escaped as visible text; `<circle>` escaped as visible text; `<math>` escaped as visible text; `<mi>` escaped as visible text | rewritten: `<svg.custom-t13s>` escaped as visible text; `<circle>` escaped as visible text; `<math>` escaped as visible text; `<mi>` escaped as visible text | as predicted |
| t14 | media | rewritten: `<video.custom-t14v>` escaped as visible text; `<source>` escaped as visible text; `<audio>` escaped as visible text | rewritten: `<source>` escaped as visible text; `<audio>` escaped as visible text; `<video.custom-t14v>` @class dropped; `<video.custom-t14v>` @width dropped; `<video.custom-t14v>` @height dropped | DIFFERS: `<video controls>` allowed (class, width, height dropped); `<source>` and `<audio>` escaped |
| t15 | picture | rewritten: `<picture>` escaped as visible text; `<source>` escaped as visible text; `<img>` @loading added: "lazy" | rewritten: `<picture>` escaped as visible text; `<source>` escaped as visible text; `<img>` @loading added: "lazy" | as predicted |
| t16 | widgets | rewritten: `<canvas>` escaped as visible text; `<progress>` escaped as visible text; `<meter>` escaped as visible text | rewritten: `<canvas>` escaped as visible text; `<progress>` escaped as visible text; `<meter>` escaped as visible text | as predicted |
| t17 | table | rewritten: `<caption>` escaped as visible text; `<colgroup>` escaped as visible text; `<col>` escaped as visible text; `<table.custom-t17t>` @border dropped; … | rewritten: `<caption>` escaped as visible text; `<colgroup>` escaped as visible text; `<col>` escaped as visible text; `<table.custom-t17t>` @border dropped; `<table.custom-t17t>` @cellpadding dropped; `<th>` @scope dropped; `<td.custom-t17d>` @align dropped | as predicted |
| t18 | form controls | rewritten: `<label.custom-t18l>` escaped as visible text; `<input.custom-t18i>` escaped as visible text; `<select>` escaped as visible text; … | rewritten: `<label.custom-t18l>` escaped as visible text; `<input.custom-t18i>` escaped as visible text; `<select>` escaped as visible text; `<option>` escaped as visible text; `<textarea>` escaped as visible text; `<form.custom-t18f>` escaped as visible text | as predicted |
| t19 | sectioning | rewritten: `<section>` escaped as visible text; `<article>` escaped as visible text; `<nav>` escaped as visible text; `<header>` escaped as visible text; … | rewritten: `<section>` escaped as visible text; `<article>` escaped as visible text; `<nav>` escaped as visible text; `<header>` escaped as visible text; `<footer>` escaped as visible text; `<main>` escaped as visible text; `<aside>` escaped as visible text | as predicted |
| t20 | style script | rewritten: `<style>` escaped as visible text; `<script>` escaped as visible text | rewritten: `<style>` escaped as visible text; `<script>` escaped as visible text | as predicted |
| t21 | link meta | rewritten: `<link>` escaped as visible text; `<link>` escaped as visible text; `<meta>` escaped as visible text | rewritten: `<link>` escaped as visible text; `<link>` escaped as visible text; `<meta>` escaped as visible text | as predicted |
| t22 | embedded | rewritten: `<object>` escaped as visible text; `<embed>` escaped as visible text; `<dialog>` escaped as visible text; `<template>` escaped as visible text; … | rewritten: `<object>` escaped as visible text; `<embed>` escaped as visible text; `<dialog>` escaped as visible text; `<template>` escaped as visible text; `<slot>` escaped as visible text | as predicted |
| t23 | Name | survived | survived | as predicted |
| t24 | empty elements | survived | survived | as predicted |
| i01 | youtube, all attributes | stripped: `<iframe.custom-i01x>` @title dropped; `<iframe.custom-i01x>` @allow dropped; `<iframe.custom-i01x>` @loading dropped; `<iframe.custom-i01x>` @sandbox dropped; … (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe.custom-i01x>` replaced by click-to-activate placeholder button.embed_preload.youtube_preload; `<iframe.custom-i01x>` (inside data-embed_code) @title dropped; `<iframe.custom-i01x>` (inside data-embed_code) @allow dropped; `<iframe.custom… | as predicted for project pages: `button.embed_preload.youtube_preload`; the original iframe sits in `data-embed_code` with the listed attributes dropped |
| i02 | youtube-nocookie | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| i03 | vimeo | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| i04 | arbitrary https host | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| i05 | github pages host | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| i06 | http host | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| i07 | protocol-relative | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| i08 | srcdoc only | stripped: `<iframe>` @srcdoc dropped | stripped: `<iframe>` @srcdoc dropped | as predicted |
| i09 | data src | stripped: `<iframe>` @src dropped | stripped: `<iframe>` @src dropped | as predicted |
| i10 | codepen host | survived (project pages: click-to-activate placeholder, observed) | rewritten: `<iframe>` replaced by click-to-activate placeholder button.embed_preload.other_embed | as predicted for project pages: `button.embed_preload.other_embed` |
| l01 | rel=me off-site | rewritten: `<a>` @rel changed: "me" -> "nofollow noopener"; `<a>` @referrerpolicy added: "origin" | rewritten: `<a>` @rel changed: "me" -> "nofollow noopener"; `<a>` @referrerpolicy added: "origin" | as predicted |
| l02 | rel on itch link | stripped: `<a>` @rel dropped | stripped: `<a>` @rel dropped | as predicted |
| l03 | fragment href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener"; `<a>` @href dropped | as predicted |
| l04 | relative href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | stripped: `<a>` @href dropped | DIFFERS (minor): href dropped and no rel/referrerpolicy added (l03, l05–l08 do get them) |
| l05 | javascript href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener"; `<a>` @href dropped | as predicted |
| l06 | tel href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener"; `<a>` @href dropped | as predicted |
| l07 | uppercase scheme | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener"; `<a>` @href dropped | as predicted |
| l08 | leading space | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener"; `<a>` @href dropped | as predicted |
| l09 | mailto | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin" | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener" | as predicted |
| l10 | named anchor | survived | survived | as predicted |
| l11 | data href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener"; `<a>` @href dropped | as predicted |
| l12 | ampersands | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin" | rewritten: `<a>` @referrerpolicy added: "origin"; `<a>` @rel added: "nofollow noopener" | as predicted |
| l13 | link attributes | rewritten: `<a>` @referrerpolicy changed: "no-referrer" -> "origin"; `<a>` @rel changed: "noreferrer" -> "nofollow noopener"; `<a>` @hreflang dropped; … | rewritten: `<a>` @referrerpolicy changed: "no-referrer" -> "origin"; `<a>` @rel changed: "noreferrer" -> "nofollow noopener"; `<a>` @hreflang dropped; `<a>` @download dropped; `<a>` @type dropped; `<a>` @ping dropped | as predicted |
| g01 | img control | rewritten: `<img>` @loading added: "lazy" | rewritten: `<img>` @loading added: "lazy" | as predicted |
| g02 | img no alt | rewritten: `<img>` @loading added: "lazy" | rewritten: `<img>` @loading added: "lazy" | as predicted |
| g03 | img empty alt | rewritten: `<img>` @loading added: "lazy" | rewritten: `<img>` @loading added: "lazy" | as predicted |
| g04 | img attributes | rewritten: `<img.custom-g04x>` @loading changed: "eager" -> "lazy"; `<img.custom-g04x>` @srcset dropped; `<img.custom-g04x>` @sizes dropped; … | rewritten: `<img.custom-g04x>` @loading changed: "eager" -> "lazy"; `<img.custom-g04x>` @srcset dropped; `<img.custom-g04x>` @sizes dropped; `<img.custom-g04x>` @decoding dropped; `<img.custom-g04x>` @fetchpriority dropped; `<img.custom-g04x>` @crossorigin … | as predicted |
| g05 | img http | rewritten: `<img>` @loading added: "lazy" | rewritten: `<img>` @loading added: "lazy" | as predicted |
| g06 | img data uri | rewritten: `<img>` @loading added: "lazy"; `<img>` @src dropped | stripped: `<img>` removed | DIFFERS: the whole `<img>` with a data: src is removed (library: src dropped, img kept) |
| g07 | img unquoted width | rewritten: `<img>` escaped as visible text | rewritten: `<img>` escaped as visible text; extra elements in the stored markup: a | as predicted, plus: the bare URL inside the escaped text was auto-linked (`a[rel="nofollow noopener"][referrerpolicy=origin]`) |
| g08 | img self-closed | rewritten: `<img>` @loading added: "lazy" | rewritten: `<img>` @loading added: "lazy" | as predicted |
| g09 | img relative | rewritten: `<img>` @loading added: "lazy"; `<img>` @src dropped | rewritten: `<img>` @loading added: "lazy"; `<img>` @src dropped | as predicted |
| g10 | img protocol-relative | rewritten: `<img>` @loading added: "lazy" | rewritten: `<img>` @loading added: "lazy" | as predicted |
| e01 | entities | survived | survived | as predicted |
| e02 | raw ampersand and less-than | survived | survived | as predicted |
| e03 | unicode | survived | survived | as predicted |
| e04 | html comment | rewritten: HTML comment escaped as visible text | rewritten: HTML comment escaped as visible text | as predicted |
| e05 | empty paragraphs: | survived | survived | as predicted |
| e06 | multi-line tag | survived | rewritten: `<span.custom-e06x>` escaped as visible text | DIFFERS: a tag with a line break inside is escaped as visible text (editor or server: M01 not run) |
| e09 | upper-case tag and attribute | survived | survived | as predicted |
| e10 | quoting | survived | survived | as predicted |
| e07 | raw less-than before an allowed tag name | rewritten: text changed | rewritten: text changed | as predicted |
| e08 | raw less-than before div | rewritten: content after this probe ended up outside the description container: an injected end tag closed it (see raw) | rewritten: content after this probe ended up outside the description container: an injected end tag closed it (see raw) | as predicted |
| x99 | PROBE-HTML-END | survived | survived | as predicted |

## 6. Live behaviour of surviving markup (`html.live`)

| Check | Predicted | Live |
|---|---|---|
| `target_aName_l10`: an `<a name>` matches `:target` | matches :target | matches :target |
| `target_id_a01`: an authored `id` matches `:target` | element absent (id stripped) | element absent |
| `detailsExclusive_t08`: `details[name]` accordions | 0 details[name] survived | 0 survived |
| `spoiler_k34`: computed text fill and background of the hand-written spoiler | not hidden (no tabindex; bios lack `.user_formatted`) | **hidden**: tabindex `0` kept, text fill transparent, colour and background both `rgb(34, 34, 34)` |
| `styleTagVar_t20`: did a `<style>` in the description apply? | (not set) | (not set) |
| `linkStylesheetRequested_t21`: did a `<link rel=stylesheet>` load? | false | false |
| `liveContainer.emptyLetterSpans_t23` | 2 | 2 |
| `liveContainer.iframes` / `placeholders` | project 0 / 10; devlog and jam 10 / 0; bio unknown | 2 / 8: every iframe with a kept `src` became a placeholder; the 2 left are i08 and i09, whose `srcdoc`/`data:` src was dropped |
| `html.served.rawCharsFromContainerTagToEndMarker` (size as served) | sent: 18,092 (full) or 3,857 (bio) | 19,994 (container innerHTML 19,364; 155 CR: served with CRLF) |
| `html.probesOutsideContainer` | `x99` (after e08) | `x99` |

## 7. Page facts (`dom`, `served`)

| Item | Live |
|---|---|
| `dom.bodyClassServed` / `dom.bodyClassLive` | both `has_site_header locale_en game_layout_widget layout_widget responsive no_theme_toggle` |
| `dom.htmlLang` | `en` |
| `dom.wrapperChain` | `div#wrapper.main.wrapper.game_page_wrapper` → `div#maincontent.game_page_primary_column` → `div.game_page_apperance_columns` → `body` (owner view, editor closed) |
| `dom.bodyChildren` (first entries) | `div#game_header_N.small_logo.game_header_widget.header_widget.base_widget.gray`, `div.game_page_apperance_columns`, `script`, `script#loading_lightbox_tpl`, `script` |
| `dom.sheetsServed` and `dom.sheetsLive` (order) | both: `link` static.itch.io ×2, `style#game_theme`, `style#custom_css` |
| `dom.afterCustomCssLive` (styles inserted after `#custom_css`) | none |
| `dom.inlineStyle` (`#wrapper`, `#inner_column`) | `#wrapper` none; `#inner_column` `min-height: 618px;` |
| `dom.counts` (h1, h1Visible, gameCell, gameCellTools, userTools, userToolsHidden, siteHeader, darkTheme) | h1 4, h1Visible 4, gameCell 0, gameCellTools 0, userTools 0, userToolsHidden 0, headerWidget 1, siteHeader 1, darkTheme 0 (with the OS in dark mode) |
| `dom.ownerConfig` (imageSizeLimit, canUseCssFlag) | 3,145,728 (3 MiB), true |
| `served.headers` (x-cache-status, age, content-security-policy) | `BYPASS`, no `age`, `frame-ancestors 'self' https://itch.io`; `cache-control: no-store` (owner, logged in) |
| `page.ownerView` | editThemeBtn 1, ownerTools 1, gameHeaderWidget 1, themeEditorColumns 0, editor closed |

## 8. Cap tests (probe-cap.md)

Not run in this session (Run 4).

Verdict: accepted / refused with an error / refused silently / truncated. Generator measures are what `capCss` or `capBio` printed; stored measures are what `capRead` or `capReadBio` printed.

| Step | Page | Call | Generator: code points / UTF-16 / bytes / LF | Verdict | Lightbox text (exact) | Stored: code points / bytes / CR | Notes |
|---|---|---|---|---|---|---|---|
| A1 | profile | `capCss(5120)` | 5,120 / 5,120 / 5,120 / 0 | | | | |
| A1 | profile | `capCss(5121)` | 5,121 / 5,121 / 5,121 / 0 | | | | |
| A1 bisect | profile | | | | | | |
| A2a | profile | `capCss(C, 'é')` | | | | | |
| A2b | profile | `capCss(C, '😀')` | | | | | |
| A2c | profile | only if A2a refused | | | | | |
| A3a | profile | `capCss(C, 'a', 'comment')`, then C + 1 | | | | | |
| A3b | profile | `capCss(C)` + trailing whitespace | | | | | |
| A3c | profile | leading whitespace + `capCss(C)` | | | | | |
| B1 | project | `capCss(40000)` … `capCss(1000000)` | | | | | |
| B2 | project | bisect | | | | | |
| B3 | project | unit at C | | | | | |
| B4 | project | `capCss(C, 'a', 'comment', 100)` | | | | | |
| C1 | jam | `capCss(20480)`, `capCss(20481)` | | | | | |
| C2 | jam | unit at C | | | | | |
| D1 | bio | `capBio(5000)`, `capBio(5001)` | | | | | |
| D2 | bio | `capBio(B - 10, 10)` | | | | | `injectedRel`: |

## 9. Manual probes

Only M07, M08 and M14 have data from this run; the rest were not run.

| Id | Result | Notes |
|---|---|---|
| M01 editor normalisation (sent vs file) | | |
| M02 `?redactor=0` | | |
| M03 owner / visitor / logged-out views | | |
| M04 theme-editor emissions | | |
| M05 Readme popup (paraphrase) and link | | |
| M06 `#edit_theme` at 375 px | | |
| M07 Custom CSS on profile / project / jam | project: present | `canUseCssFlag: true`; profile and jam not checked |
| M08 upload limit and formats | 3,145,728 bytes (3 MiB) | read from the project page's owner config; formats not checked |
| M09 hidden projects in public HTML | | |
| M10 publish latency | | |
| M11 editor spoiler markup | | |
| M12 alt-text fields | | |
| M13 cross-document view transitions | | |
| M14 `random()` per load | not yet | Chromium 155 doesn't support `random()` (c28 = `0`); repeat after Chrome 156 |
| M15 `color-scheme` on itch controls | | |
| M16 browser shares in analytics | | |

## 10. Knowledge-base updates to make

One row per claim this run settles. Tag only what the probe tested: `[verified <date> · live-<id>]`.

| Section | Claim (short) | Old tag | New tag or correction | Probe id |
|---|---|---|---|---|
| Main R8, §1 | `</style>` in the CSS | documented · repo-05; observed · crawlprofile-25 | deleted on save (any case, inner spaces), project | live-c42, live-c43, live-c44 |
| Main R11, §5 | Class filter | library model · gapfill05-04 (avoid `: / [ ] .`) | **corrected**: prefix test on `custom`; `: / [ ] .` and non-ASCII survive | live-k01 to live-k21 |
| Main §1 | Leading whitespace | unknown (§11 #3) | trimmed on projects | live-css |
| Main §1 | CRLF on projects | verified · gapfill01-02, corpus-03 | re-verified | live-css |
| Main §1 | Everything else stored as sent | verified · corpus-01… | re-verified for 44 CSS probes on a project | live-c01 to live-c45 |
| Main §2 | `http://` imports and fonts | verified · s02-n6 | itch stores them unchanged; only the browser blocks | live-c04, live-c10 |
| Main §5 | Output matches `web_sanitize` | inferred · sanitizer-01 | 147/155 probes matched on a project description | live-html |
| Main §5 | Project container `.formatted_description.user_formatted` | observed · N1, N2 | verified | live-html |
| Main §5 | Spoiler: `tabindex` stripped | library model | **corrected**: kept on `span.spoiler`, hidden on projects | live-k34 |
| Main §5 | Stripped attributes | observed · sanitizer-05… | verified, plus `hidden inert accesskey contenteditable draggable translate` | live-a01 to live-a07, live-a11 to live-a20 |
| Main §5 | Own `rel` lost | library model · sanitizer-07 | verified | live-l01, live-l02, live-l13 |
| Main §5 | Kept attributes, `img` attributes | observed / verified | verified; `srcset` etc. dropped, `eager` overwritten | live-a08 to live-a10, live-a21, live-l01, live-l10, live-g01 to live-g04 |
| Main §5 | Href schemes | observed · sanitizer-06 | verified; relative, `javascript:`, `tel:`, `data:`, upper-case, leading-space dropped; `mailto:` kept | live-l03 to live-l09, live-l11 |
| Main §5 | Escaped tags | inferred · sanitizer-14 | verified list; **corrected** for `video` (kept with `controls`) and `wbr` (kept) | live-t02, live-t04, live-t10 to live-t22, live-a13, live-e04, live-t11, live-t14 |
| Main §5 | `details`/`figure`/`font` attributes | observed · gapfill05-05; community · sanitizer-27 | verified | live-t02, live-t08 to live-t10 |
| Main §5 | Inline-style whitelist and killers | library model / inferred | verified; **added**: a line break inside `style` drops it | live-s01 to live-s31 |
| Main §5 | `data:` images | observed · sanitizer-12 | verified: whole `<img>` removed; relative `src` dropped | live-g05, live-g06, live-g09, live-g10 |
| Main §5 | Unquoted `width=40%` | library model | escapes the tag; bare URL auto-linked | live-g07 |
| Main §5 | Project iframes → placeholders | verified · sanitizer-24 | verified for 8 hosts; `srcdoc`, `data:` src dropped | live-i01 to live-i10 |
| Main §5 | Parser gotchas | library model / inferred | verified; **added**: a line break inside a tag escapes it | live-e04, live-e06, live-e07, live-e08, live-t12, live-g07 |
| Main §8 | Tailwind tokens with `/`, `[ ]` | untested | survive; v3 variant/negative/important forms dropped; v4 `custom:` form survives | live-k09 to live-k18 |
| Main §11 | Rows 2 and 3 | open | settled for projects | — |

**Section files** (retagged the same way on 2026-10-16; each file's tag legend now explains `live-` ids):
- **01, 02, 09:** "stored exactly as pasted" became "as pasted" with the three project changes (`</style>` deleted, both ends trimmed, CRLF); untested `javascript:`, `expression()` and `http://` imports are now stored-as-sent on projects; 09's class-filter, attribute, inline-style, tag, image and iframe gotchas confirmed or corrected (#5 relative href, #62 class filter, #66 `wbr`/`video`, #69 `data:` img).
- **05:** every rule, the §3 matrix, §4 tag lists, §5 attribute table, §6 class filter (H1 settled), §7 inline styles, §8 links, §9 images and iframes, §10 parser hazards and §14 open questions updated, with the eight corrections; new facts: `table[align]` kept while `td[align]` and `th[scope]` are dropped, single-quoted and unquoted values are re-quoted, `<img/>` keeps `/>`, served description ~10 % longer (CRLF).
- **03, 04, 06, 07, 08, 10:** project owner-view wrappers and chrome (`div.game_page_apperance_columns > div#maincontent`, no `#user_tools`), head order with nothing after `#custom_css`, `#inner_column` inline `min-height`, upload limit 3,145,728 bytes, at-rules stored and applied on a project, `data:` `@import`, Tailwind token tables (`/`, `[ ]`, `custom:` survive; variant-first, `!` and `-` forms dropped), spoiler focus.

## 11. Before committing

- [x] The JSON report was reviewed: no csrf token, e-mail address, subdomain or other personal data (2026-10-16; the subdomain is redacted as `<user>`).
- [ ] The `probeKit.saveRaw()` file and any M01 capture are **not** committed.
- [ ] The probe content was removed from the page, and the profile bio and CSS were restored. (Kept on purpose: the draft is reused for the cap tests.)
