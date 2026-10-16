# Live probe results: [page type], [YYYY-MM-DD]

Kit v1 (2026-10-14). Copy this file once per run as `results-<YYYY-MM-DD>-<page>.md` and keep it next to the JSON report in `knowledge/evidence/live-probes/`. Fill the empty columns from the report. The "predicted" columns are pre-filled. HTML predictions come from leafo's `web_sanitize` with the itch-model whitelist (H1: prefix class filter; H2: strict characters); CSS predictions come from the knowledge base's "itch passes CSS through". The "Chrome 155 applies" column is what the kit's offline test measured when the text survives.

## 1. Run facts

| Field | Value |
|---|---|
| Date and time (UTC) | |
| Kit version | v1 (2026-10-14) |
| Run | 1 draft project / 2 profile / 3 devlog post / 3 jam / 3 no-CSS-access account / 4 caps |
| Page type (`page.type`, `page.pageName`) | |
| Visibility | Draft / Restricted / Public |
| HTML field used | project description / profile bio / devlog post / jam description / none |
| Payload pasted | `probe-description.html` / `probe-bio.html` / `probe.css` / cap step |
| Stayed in HTML mode (`<>`) the whole time | yes / no |
| CSS textarea started with two empty lines before saving | yes / no |
| Viewer | owner logged in / other account / logged out (private window) |
| Account has CSS access | yes / no |
| Browser and version (`page.browser`) | |
| OS, viewport (`page.viewport`) | |
| itch site theme and site language (logged-in runs) | |
| Messages shown on save (exact text) | |
| Report file | `results-<date>-<page>.json` |
| Warnings in the report (`warnings`) | |

## 2. Theme-editor settings at the time of the run

Write what the editor shows; the `theme` section of the report adds the generated CSS facts.

| Setting | Value |
|---|---|
| Background colour(s) | |
| Text colour | |
| Link colour | |
| Header / button colours (if shown) | |
| Font, size, header font | |
| Background image (yes/no) and its repeat / position / size options | |
| Banner (yes/no, fixed or full width) | |
| Layout options (profile: column / grid / collections / "Supported by"; project: page size, embed background, …) | |
| Corners / border radius | |
| Hidden projects (profile) | |
| `theme.backgroundDeclarations` (from the report) | |
| `theme.classes` (from the report) | |

## 3. CSS sheet (probe.css)

| Item | Expected or sent | Live |
|---|---|---|
| Block (`css.block`) | `custom_css` (profile, project, devlog) or `jam_theme` | |
| Stored characters / bytes / CR / LF (`css.stored`) | sent: 2,725 / 2,741 / 0 / 56 (between the markers: `css.sent`) | |
| Leading whitespace (`css.leadingBeforeStartMarker`) | `"\n\n  "` if kept, `""` if trimmed | |
| Trailing whitespace (`css.trailingAfterEndMarker`) | `"\n\n  "` if kept, `""` if trimmed (jam: itch adds `" "`) | |
| Identical apart from line endings (`css.identicalIgnoringLineEndings`, `css.firstDifference`) | yes, unless c42/c43 changed | |
| Style element closed early (`css.styleElementClosedEarly`) | open question (c42) | |
| CSSOM rule types (`css.cssom.types`) | 14 types in Chrome 155 | |
| `[c45]` visible at the start of the description | yes, if the whole sheet applied | |

## 4. CSS probes

| Id | Tests | Predicted at itch | Chrome 155 applies | Live outcome | Applied | Value / notes |
|---|---|---|---|---|---|---|
| c00 | baseline rule | survived | yes |  |  |  |
| c01 | `@charset` (not first) | survived | n/a (text only) |  |  |  |
| c02 | `@layer` statement before `@import` | survived | yes |  |  |  |
| c03 | non-Google HTTPS `@import` | survived | yes |  |  |  |
| c04 | `http://` `@import` | survived | yes |  |  |  |
| c05 | `data:` `@import` | survived | yes |  |  |  |
| c06 | `@import … layer()` | survived | yes |  |  |  |
| c07 | `@import … supports()` | survived | yes |  |  |  |
| c08 | `@import … screen` | survived | yes |  |  |  |
| c09 | `@font-face` `local()` | survived | yes |  |  |  |
| c10 | `@font-face` `http://` src | survived | yes |  |  |  |
| c11 | `@layer` block | survived | yes |  |  |  |
| c12 | `@property` (`<` in syntax) | survived | yes |  |  |  |
| c13 | `@container` size query | survived | yes |  |  |  |
| c14 | `@container style()` | survived | yes |  |  |  |
| c15 | `@scope` | survived | yes |  |  |  |
| c16 | nesting `&` | survived | yes |  |  |  |
| c17 | nested `@media` | survived | yes |  |  |  |
| c18 | `@starting-style` | survived | yes |  |  |  |
| c19 | `@view-transition` | survived | yes |  |  |  |
| c20 | `@supports` with `not` | survived | yes |  |  |  |
| c21 | range media `<=` | survived | yes |  |  |  |
| c22 | `!important` | survived | yes |  |  |  |
| c23 | raw `>` combinator | survived | yes |  |  |  |
| c24 | `& < >` in a string | survived | yes |  |  |  |
| c25 | raw non-ASCII string | survived | yes |  |  |  |
| c26 | `\hex` escapes incl. `\3c` | survived | yes |  |  |  |
| c27 | `content: "x" / ""` | survived | yes |  |  |  |
| c28 | `random()` | survived | no |  |  |  |
| c29 | `sibling-index()` | survived | yes |  |  |  |
| c30 | `@function` | survived | yes |  |  |  |
| c31 | raw `<svg>` in a `data:` URL | survived | yes |  |  |  |
| c32 | `expression()` | survived | n/a (text only) |  |  |  |
| c33 | `behavior:` | survived | n/a (text only) |  |  |  |
| c34 | `-moz-binding:` | survived | n/a (text only) |  |  |  |
| c35 | `url(javascript:)` | survived | n/a (text only) |  |  |  |
| c36 | `@counter-style` | survived | yes |  |  |  |
| c37 | non-ASCII in a comment | survived | yes |  |  |  |
| c38 | escaped selector `.custom-hover\:x` | survived | only if k07/k09 kept |  |  |  |
| c39 | escaped selector `.custom-w-\[3px\]` | survived | only if k07/k09 kept |  |  |  |
| c40 | `<!--` in a comment | survived | yes |  |  |  |
| c41 | `<script>` in a comment | survived | yes |  |  |  |
| c42 | `</style>` in a comment | open | yes if `</style>` is removed |  |  |  |
| c43 | `</STYLE >` in a string | open | yes if `</style>` is removed |  |  |  |
| c44 | canary after both | open | yes if `</style>` is removed |  |  |  |
| c45 | visible end marker | survived | yes |  |  |  |

## 5. HTML probes

Live outcome: `survived` / `stripped` / `rewritten` / `missing` (see README). Copy the first one or two `details` and note anything that differs from the prediction.

| Id | Probe | Predicted (library model) | Live outcome | Live details / differs from prediction? |
|---|---|---|---|---|
| x00 | PROBE-HTML-START set=full kit=v1 2026-10-14 (temporary test …(+24) | survived |  |  |
| k01 | Custom-a | stripped: class tokens dropped: Custom-a |  |  |
| k02 | CUSTOM-b | stripped: class tokens dropped: CUSTOM-b |  |  |
| k03 | customc | survived |  |  |
| k04 | custom_d | survived |  |  |
| k05 | customer | survived |  |  |
| k06 | custom- (bare prefix) | survived |  |  |
| k07 | custom-hover:x | H1 survived / H2 stripped: class tokens dropped: custom-hover:x |  |  |
| k08 | custom-md:flex | H1 survived / H2 stripped: class tokens dropped: custom-md:flex |  |  |
| k09 | custom-w-[3px] | H1 survived / H2 stripped: class tokens dropped: custom-w-[3px] |  |  |
| k10 | custom-mt-[-1rem] | H1 survived / H2 stripped: class tokens dropped: custom-mt-[-1rem] |  |  |
| k11 | custom-w-1/2 | H1 survived / H2 stripped: class tokens dropped: custom-w-1/2 |  |  |
| k12 | custom-bg-red-500/50 | H1 survived / H2 stripped: class tokens dropped: custom-bg-red-500/50 |  |  |
| k13 | custom-d.e | H1 survived / H2 stripped: class tokens dropped: custom-d.e |  |  |
| k14 | custom:flex | H1 survived / H2 stripped: class tokens dropped: custom:flex |  |  |
| k15 | custom:md:flex | H1 survived / H2 stripped: class tokens dropped: custom:md:flex |  |  |
| k16 | -custom-f | stripped: class tokens dropped: -custom-f |  |  |
| k17 | md:custom-g | stripped: class tokens dropped: md:custom-g |  |  |
| k18 | !custom-h | stripped: class tokens dropped: !custom-h |  |  |
| k19 | xcustom-i | stripped: class tokens dropped: xcustom-i |  |  |
| k20 | custom-café | H1 survived / H2 stripped: class tokens dropped: custom-café |  |  |
| k21 | custom-Hero | survived |  |  |
| k22 | text-left | stripped: class tokens dropped: text-left |  |  |
| k23 | text-right | survived |  |  |
| k24 | text-center | survived |  |  |
| k25 | text-justify | survived |  |  |
| k26 | foo | stripped: class tokens dropped: foo |  |  |
| k27 | button | stripped: class tokens dropped: button |  |  |
| k28 | inner_column | stripped: class tokens dropped: inner_column |  |  |
| k29 | extra whitespace in class | rewritten: class re-serialised as "custom-probe-k29 custom-ws" |  |  |
| k30 | duplicate token | survived |  |  |
| k31 | all tokens invalid | stripped: `<span.foo.bar>` @class dropped |  |  |
| k32 | empty class | stripped: `<span>` @class dropped |  |  |
| k33 | bare class | stripped: `<span>` @class dropped |  |  |
| k34 | hand-written spoiler | stripped: `<span.spoiler>` @tabindex dropped |  |  |
| a01 | id | stripped: @id dropped |  |  |
| a02 | data-* | stripped: @data-probe dropped |  |  |
| a03 | aria-label | stripped: @aria-label dropped |  |  |
| a04 | aria-hidden | stripped: @aria-hidden dropped |  |  |
| a05 | role | stripped: @role dropped |  |  |
| a06 | tabindex | stripped: @tabindex dropped |  |  |
| a07 | hidden | stripped: `<span>` @hidden dropped |  |  |
| a08 | title | survived |  |  |
| a09 | lang | survived |  |  |
| a10 | dir | survived |  |  |
| a11 | onclick | stripped: @onclick dropped |  |  |
| a12 | popover + id | stripped: `<div>` @popover dropped; `<div>` @id dropped |  |  |
| a13 | button popovertarget | rewritten: `<button>` escaped as visible text |  |  |
| a14 | a popovertarget | stripped: `<a>` @popovertarget dropped |  |  |
| a15 | accesskey | stripped: @accesskey dropped |  |  |
| a16 | contenteditable | stripped: @contenteditable dropped |  |  |
| a17 | draggable | stripped: @draggable dropped |  |  |
| a18 | translate | stripped: @translate dropped |  |  |
| a19 | inert | stripped: `<span>` @inert dropped |  |  |
| a20 | h1 aria-label | stripped: @aria-label dropped |  |  |
| a21 | p lang title dir | survived |  |  |
| s01 | color (control) | survived |  |  |
| s02 | !important | stripped: @style dropped |  |  |
| s03 | font-size 1.5em | stripped: style declarations dropped: font-size:1.5em |  |  |
| s04 | 150% + line-height | stripped: style declarations dropped: line-height:2 |  |  |
| s05 | display float | stripped: style declarations dropped: display:flex; float:left |  |  |
| s06 | background url no-repeat | stripped: style declarations dropped: background:url('https://example.com/probe-s06.png') no-repeat |  |  |
| s07 | border-radius + slash rgb | stripped: @style dropped |  |  |
| s08 | six never-seen list properties | survived |  |  |
| s09 | border-radius | stripped: style declarations dropped: border-radius:4px |  |  |
| s10 | display | stripped: style declarations dropped: display:block |  |  |
| s11 | custom property + color | stripped: style declarations dropped: --i:3 |  |  |
| s12 | custom property alone | stripped: style declarations dropped: --i:3 |  |  |
| s13 | position top | stripped: style declarations dropped: position:relative; top:1px |  |  |
| s14 | font-family weight | stripped: style declarations dropped: font-family:serif; font-weight:700 |  |  |
| s15 | transform | stripped: style declarations dropped: transform:rotate(5deg) |  |  |
| s16 | decimal percent | stripped: @style dropped |  |  |
| s17 | trailing whitespace | stripped: @style dropped |  |  |
| s18 | no-space list | stripped: style declarations dropped: float:left; border-radius:5px |  |  |
| s19 | gradient | stripped: style declarations dropped: background:linear-gradient(red, blue) |  |  |
| s20 | var() in color | survived |  |  |
| s21 | uppercase property | stripped: style declarations dropped: COLOR:red |  |  |
| s22 | comment in style | stripped: @style dropped |  |  |
| s23 | 8-digit hex | survived |  |  |
| s24 | calc | stripped: style declarations dropped: width:calc(100% - 10px) |  |  |
| s25 | empty style | survived |  |  |
| s26 | line-height letter-spacing | stripped: style declarations dropped: line-height:1.5; letter-spacing:2px |  |  |
| s27 | decoration shadows | stripped: style declarations dropped: text-decoration:underline; text-shadow:0 0 2px red; box-shadow:0 0 2px red |  |  |
| s28 | auto + 100% | stripped: style declarations dropped: height:auto |  |  |
| s29 | em values | stripped: style declarations dropped: padding:0.5em 1em |  |  |
| s30 | comma colour functions | survived |  |  |
| s31 | LF inside style attribute | rewritten: `<span>` style re-serialised as "color: red; width: 10px" |  |  |
| t01 | b and i | survived |  |  |
| t02 | edits | rewritten: `<ins>` escaped as visible text; `<del.custom-t02d>` @class dropped; `<del.custom-t02d>` @datetime dropped; `<del.custom-t02d>` @title dropped |  |  |
| t03 | inline | stripped: `<code.language-css.custom-t03c>` class tokens dropped: language-css |  |  |
| t04 | phrasing | rewritten: `<bdi>` escaped as visible text; `<bdo>` escaped as visible text; `<data>` escaped as visible text |  |  |
| t05 | blocks | survived |  |  |
| t06 | h5 h6 | survived |  |  |
| t07 | lists | stripped: `<ol.custom-t07o>` @start dropped; `<ol.custom-t07o>` @reversed dropped; `<ol.custom-t07o>` @type dropped; `<li>` @value dropped |  |  |
| t08 | details name open | stripped: `<details.custom-t08d>` @class dropped; `<details.custom-t08d>` @title dropped; `<details.custom-t08d>` @style dropped; `<details.custom-t08d>` @name dropped; … |  |  |
| t09 | figure | stripped: `<figure.custom-t09f>` @class dropped; `<figure.custom-t09f>` @style dropped; `<figcaption.custom-t09c>` @class dropped; … |  |  |
| t10 | legacy | rewritten: `<center>` escaped as visible text; `<ruby.custom-t10r>` @class dropped; `<rt.custom-t10t>` @class dropped; `<font>` @color dropped; `<font>` @face dropped; … |  |  |
| t11 | unknown | rewritten: `<marquee>` escaped as visible text; `<wbr>` escaped as visible text |  |  |
| t12 | self-closed span | rewritten: `<span.custom-t12x>` escaped as visible text |  |  |
| t13 | svg math | rewritten: `<svg.custom-t13s>` escaped as visible text; `<circle>` escaped as visible text; `<math>` escaped as visible text; `<mi>` escaped as visible text |  |  |
| t14 | media | rewritten: `<video.custom-t14v>` escaped as visible text; `<source>` escaped as visible text; `<audio>` escaped as visible text |  |  |
| t15 | picture | rewritten: `<picture>` escaped as visible text; `<source>` escaped as visible text; `<img>` @loading added: "lazy" |  |  |
| t16 | widgets | rewritten: `<canvas>` escaped as visible text; `<progress>` escaped as visible text; `<meter>` escaped as visible text |  |  |
| t17 | table | rewritten: `<caption>` escaped as visible text; `<colgroup>` escaped as visible text; `<col>` escaped as visible text; `<table.custom-t17t>` @border dropped; … |  |  |
| t18 | form controls | rewritten: `<label.custom-t18l>` escaped as visible text; `<input.custom-t18i>` escaped as visible text; `<select>` escaped as visible text; … |  |  |
| t19 | sectioning | rewritten: `<section>` escaped as visible text; `<article>` escaped as visible text; `<nav>` escaped as visible text; `<header>` escaped as visible text; … |  |  |
| t20 | style script | rewritten: `<style>` escaped as visible text; `<script>` escaped as visible text |  |  |
| t21 | link meta | rewritten: `<link>` escaped as visible text; `<link>` escaped as visible text; `<meta>` escaped as visible text |  |  |
| t22 | embedded | rewritten: `<object>` escaped as visible text; `<embed>` escaped as visible text; `<dialog>` escaped as visible text; `<template>` escaped as visible text; … |  |  |
| t23 | Name | survived |  |  |
| t24 | empty elements | survived |  |  |
| i01 | youtube, all attributes | stripped: `<iframe.custom-i01x>` @title dropped; `<iframe.custom-i01x>` @allow dropped; `<iframe.custom-i01x>` @loading dropped; `<iframe.custom-i01x>` @sandbox dropped; … (project pages: click-to-activate placeholder, observed) |  |  |
| i02 | youtube-nocookie | survived (project pages: click-to-activate placeholder, observed) |  |  |
| i03 | vimeo | survived (project pages: click-to-activate placeholder, observed) |  |  |
| i04 | arbitrary https host | survived (project pages: click-to-activate placeholder, observed) |  |  |
| i05 | github pages host | survived (project pages: click-to-activate placeholder, observed) |  |  |
| i06 | http host | survived (project pages: click-to-activate placeholder, observed) |  |  |
| i07 | protocol-relative | survived (project pages: click-to-activate placeholder, observed) |  |  |
| i08 | srcdoc only | stripped: `<iframe>` @srcdoc dropped |  |  |
| i09 | data src | stripped: `<iframe>` @src dropped |  |  |
| i10 | codepen host | survived (project pages: click-to-activate placeholder, observed) |  |  |
| l01 | rel=me off-site | rewritten: `<a>` @rel changed: "me" -> "nofollow noopener"; `<a>` @referrerpolicy added: "origin" |  |  |
| l02 | rel on itch link | stripped: `<a>` @rel dropped |  |  |
| l03 | fragment href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l04 | relative href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l05 | javascript href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l06 | tel href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l07 | uppercase scheme | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l08 | leading space | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l09 | mailto | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin" |  |  |
| l10 | named anchor | survived |  |  |
| l11 | data href | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin"; `<a>` @href dropped |  |  |
| l12 | ampersands | rewritten: `<a>` @rel added: "nofollow noopener"; `<a>` @referrerpolicy added: "origin" |  |  |
| l13 | link attributes | rewritten: `<a>` @referrerpolicy changed: "no-referrer" -> "origin"; `<a>` @rel changed: "noreferrer" -> "nofollow noopener"; `<a>` @hreflang dropped; … |  |  |
| g01 | img control | rewritten: `<img>` @loading added: "lazy" |  |  |
| g02 | img no alt | rewritten: `<img>` @loading added: "lazy" |  |  |
| g03 | img empty alt | rewritten: `<img>` @loading added: "lazy" |  |  |
| g04 | img attributes | rewritten: `<img.custom-g04x>` @loading changed: "eager" -> "lazy"; `<img.custom-g04x>` @srcset dropped; `<img.custom-g04x>` @sizes dropped; … |  |  |
| g05 | img http | rewritten: `<img>` @loading added: "lazy" |  |  |
| g06 | img data uri | rewritten: `<img>` @loading added: "lazy"; `<img>` @src dropped |  |  |
| g07 | img unquoted width | rewritten: `<img>` escaped as visible text |  |  |
| g08 | img self-closed | rewritten: `<img>` @loading added: "lazy" |  |  |
| g09 | img relative | rewritten: `<img>` @loading added: "lazy"; `<img>` @src dropped |  |  |
| g10 | img protocol-relative | rewritten: `<img>` @loading added: "lazy" |  |  |
| e01 | entities | survived |  |  |
| e02 | raw ampersand and less-than | survived |  |  |
| e03 | unicode | survived |  |  |
| e04 | html comment | rewritten: HTML comment escaped as visible text |  |  |
| e05 | empty paragraphs: | survived |  |  |
| e06 | multi-line tag | survived |  |  |
| e09 | upper-case tag and attribute | survived |  |  |
| e10 | quoting | survived |  |  |
| e07 | raw less-than before an allowed tag name | rewritten: text changed |  |  |
| e08 | raw less-than before div | rewritten: content after this probe ended up outside the description container: an injected end tag closed it (see raw) |  |  |
| x99 | PROBE-HTML-END | survived |  |  |

## 6. Live behaviour of surviving markup (`html.live`)

| Check | Predicted | Live |
|---|---|---|
| `target_aName_l10`: an `<a name>` matches `:target` | matches :target | |
| `target_id_a01`: an authored `id` matches `:target` | element absent (id stripped) | |
| `detailsExclusive_t08`: `details[name]` accordions | 0 details[name] survived | |
| `spoiler_k34`: computed text fill and background of the hand-written spoiler | not hidden (no tabindex; bios lack `.user_formatted`) | |
| `styleTagVar_t20`: did a `<style>` in the description apply? | (not set) | |
| `linkStylesheetRequested_t21`: did a `<link rel=stylesheet>` load? | false | |
| `liveContainer.emptyLetterSpans_t23` | 2 | |
| `liveContainer.iframes` / `placeholders` | project 0 / 10; devlog and jam 10 / 0; bio unknown | |
| `html.served.rawCharsFromContainerTagToEndMarker` (size as served) | sent: 18,092 (full) or 3,857 (bio) | |
| `html.probesOutsideContainer` | `x99` (after e08) | |

## 7. Page facts (`dom`, `served`)

| Item | Live |
|---|---|
| `dom.bodyClassServed` / `dom.bodyClassLive` | |
| `dom.htmlLang` | |
| `dom.wrapperChain` | |
| `dom.bodyChildren` (first entries) | |
| `dom.sheetsServed` and `dom.sheetsLive` (order) | |
| `dom.afterCustomCssLive` (styles inserted after `#custom_css`) | |
| `dom.inlineStyle` (`#wrapper`, `#inner_column`) | |
| `dom.counts` (h1, h1Visible, gameCell, gameCellTools, userTools, userToolsHidden, siteHeader, darkTheme) | |
| `dom.ownerConfig` (imageSizeLimit, canUseCssFlag) | |
| `served.headers` (x-cache-status, age, content-security-policy) | |
| `page.ownerView` | |

## 8. Cap tests (probe-cap.md)

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

| Id | Result | Notes |
|---|---|---|
| M01 editor normalisation (sent vs file) | | |
| M02 `?redactor=0` | | |
| M03 owner / visitor / logged-out views | | |
| M04 theme-editor emissions | | |
| M05 Readme popup (paraphrase) and link | | |
| M06 `#edit_theme` at 375 px | | |
| M07 Custom CSS on profile / project / jam | | |
| M08 upload limit and formats | | |
| M09 hidden projects in public HTML | | |
| M10 publish latency | | |
| M11 editor spoiler markup | | |
| M12 alt-text fields | | |
| M13 cross-document view transitions | | |
| M14 `random()` per load | | |
| M15 `color-scheme` on itch controls | | |
| M16 browser shares in analytics | | |

## 10. Knowledge-base updates to make

One row per claim this run settles. Tag only what the probe tested: `[verified <date> · live-<id>]`.

| Section | Claim (short) | Old tag | New tag or correction | Probe id |
|---|---|---|---|---|
| | | | | |

## 11. Before committing

- [ ] The JSON report was reviewed: no csrf token, e-mail address, subdomain or other personal data.
- [ ] The `probeKit.saveRaw()` file and any M01 capture are **not** committed.
- [ ] The probe content was removed from the page, and the profile bio and CSS were restored.
