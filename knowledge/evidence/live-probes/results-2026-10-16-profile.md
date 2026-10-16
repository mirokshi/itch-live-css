# Live probe results: profile, 2026-10-16

Kit v1 (2026-10-14), Run 2, filled in from [`probe-report-profile-2026-10-16.json`](probe-report-profile-2026-10-16.json) (owner, logged in) and [`probe-report-profile-2026-10-16-incognito.json`](probe-report-profile-2026-10-16-incognito.json) (logged out, private window). Predictions are the template's; the project run is [results-2026-10-16-project.md](results-2026-10-16-project.md).

**Scope.** The owner's **public profile** (`mirokshi.itch.io`): the **bio** (33-probe bio set, `probe-bio.html`) and the profile **Custom CSS** (`probe.css`), read back in **Brave 155 (Chromium 155)** on Windows, logged in and logged out. The probe content was live for about 7 minutes and then restored from a backup; the restore was checked byte for byte on the logged-out page.

## 0. Headline results

1. **The profile CSS is handled like the project CSS**: every `</style>` deleted (also `</STYLE >`), leading and trailing whitespace trimmed, everything else stored as sent; all 46 CSS probes have the same outcome and the same `applied` value as on the project, logged in and logged out (c01–c45).
2. **Line breaks are stored as LF on the profile** (0 CR, 52 LF), CRLF on the project, from the same browser and the same paste. So the CRLF on projects comes from itch, not from the browser.
3. **Bio sanitizer = project-description sanitizer** on all 33 bio probes, including the `custom` prefix test (`custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2`, `custom:flex` survive; `Custom-a`, `-custom-f`, `foo` dropped).
4. **Bio iframes stay live**: no click-to-activate placeholder (i01 YouTube with its extra attributes dropped, i04 an arbitrary https host kept whole).
5. **The hand-written spoiler keeps `tabindex="0"` but is not hidden in a bio** (text fill and colour `rgb(238, 243, 255)`, transparent background): bios lack `.user_formatted`, as predicted.
6. **A 3,857-character bio saved without any message.**
7. **Logged-out visitors get a cached page** (`X-Cache-Status: HIT`, no `Cache-Control`); the owner gets `BYPASS` + `no-store`. After the restore the public page kept the old copy for about 2.5 minutes, then went `EXPIRED` and refreshed (M10). A query string did not bypass the cache.

## 1. Run facts

| Field | Owner run | Logged-out run |
|---|---|---|
| Date and time (UTC) | 2026-10-16 10:32:16 | 2026-10-16 10:33:36 |
| Page type (`page.type`, `page.pageName`) | profile, `user` | profile, `user` |
| Visibility | public profile | public profile |
| HTML field and payloads | bio, `probe-bio.html` (3,857 chars); Custom CSS, `probe.css`, both pasted from the clipboard after a byte check | same page |
| Stayed in HTML mode; two empty lines before saving | yes (owner confirmed the two lines with Ctrl+Home) | — |
| Account has CSS access | yes (`canUseCssFlag: true`) | — |
| Browser, viewport | Brave 155, Chromium 155, 2560x708, DPR 1, dark True | Brave 155, Chromium 155, 2560x708 |
| Messages shown on save | none | — |
| Warnings in the report | none | none |
| Backup and restore | bio and CSS copied from the editors to a git-ignored folder (identical to the served copies); restored the same day; logged-out page matched the backup at 10:38:32 UTC | |

## 2. Theme facts (from the report)

| Item | Value |
|---|---|
| Theme block | `style#user_theme`, 966 chars, no line breaks |
| Background declarations | `background-color: #0b1433`; `background-color: #213168`; `background-image: url(…)`; `background-repeat: no-repeat`; `background-position: 50% 0`; `background-attachment: fixed`; `background: #213168` |
| Classes | body `has_header locale_en user_layout_widget layout_widget no_theme_toggle responsive`; `div#wrapper.user_page_wrap`; `div#user_N.user_page.page_widget.base_widget.mode_grid`; `div.inner_column.text_header`; `div#profile_header.header` |

## 3. CSS sheet (probe.css)

| Item | Sent | Owner run | Logged-out run |
|---|---|---|---|
| Block | — | `custom_css` | `custom_css` |
| Stored chars / UTF-16 / bytes / CR / LF | 2717 / 2719 / 2733 / 0 / 52 between the markers | 2700 / 2702 / 2716 / 0 / 52 | 2700 / 2702 / 2716 / 0 / 52 |
| Leading / trailing whitespace | two empty lines and two spaces at each end | `""` / `""`: **both trimmed** | `""` / `""` |
| Identical apart from line endings | — | False; first difference at 2477 (`</style>` removed from the c42 comment) | False |
| Style element closed early | — | False | False |
| CSSOM rule types | — | 14 types, 50 top-level rules (same as the project) | same |

## 4. CSS probes

Every probe has the same outcome, `applied` value and computed value as in the project run, in both views. Not applied: c28 (`random()`, unsupported in Chromium 155) and c43 (its string lost `</STYLE >`).

| Id | Tests | Outcome | Applied | Value |
|---|---|---|---|---|
| c00 | baseline rule | survived | yes | `1` |
| c01 | `@charset` (not first) | survived | n/a |  |
| c02 | `@layer` statement before `@import` | survived | yes | `1 &#124; CSSLayerStatementRule` |
| c03 | non-Google HTTPS `@import` | survived | yes | `CSSImportRule +requested` |
| c04 | `http://` `@import` | survived | yes | `CSSImportRule +requested` |
| c05 | `data:` `@import` | survived | yes | `1` |
| c06 | `@import … layer()` | survived | yes | `1` |
| c07 | `@import … supports()` | survived | yes | `1` |
| c08 | `@import … screen` | survived | yes | `1` |
| c09 | `@font-face` `local()` | survived | yes | `FontFace unloaded` |
| c10 | `@font-face` `http://` src | survived | yes | `FontFace unloaded` |
| c11 | `@layer` block | survived | yes | `1` |
| c12 | `@property` (`<` in syntax) | survived | yes | `7px` |
| c13 | `@container` size query | survived | yes | `1` |
| c14 | `@container style()` | survived | yes | `1` |
| c15 | `@scope` | survived | yes | `1` |
| c16 | nesting `&` | survived | yes | `1` |
| c17 | nested `@media` | survived | yes | `1` |
| c18 | `@starting-style` | survived | yes | `CSSStartingStyleRule` |
| c19 | `@view-transition` | survived | yes | `CSSViewTransitionRule` |
| c20 | `@supports` with `not` | survived | yes | `1` |
| c21 | range media `<=` | survived | yes | `1` |
| c22 | `!important` | survived | yes | `1` |
| c23 | raw `>` combinator | survived | yes | `1` |
| c24 | `& < >` in a string | survived | yes | `"a&b<i>c>d"` |
| c25 | raw non-ASCII string | survived | yes | `"→é漢😀"` |
| c26 | `\hex` escapes incl. `\3c` | survived | yes | `"→" "</x>"` |
| c27 | `content: "x" / ""` | survived | yes | `"[c27]" / ""` |
| c28 | `random()` | survived | no | `0` |
| c29 | `sibling-index()` | survived | yes | `1` |
| c30 | `@function` | survived | yes | `1` |
| c31 | raw `<svg>` in a `data:` URL | survived | yes | `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>")` |
| c32 | `expression()` | survived | n/a |  |
| c33 | `behavior:` | survived | n/a |  |
| c34 | `-moz-binding:` | survived | n/a |  |
| c35 | `url(javascript:)` | survived | n/a |  |
| c36 | `@counter-style` | survived | yes | `CSSCounterStyleRule` |
| c37 | non-ASCII in a comment | survived | yes | `1` |
| c38 | escaped selector `.custom-hover\:x` | survived | yes | `1` |
| c39 | escaped selector `.custom-w-\[3px\]` | survived | yes | `1` |
| c40 | `<!--` in a comment | survived | yes | `1` |
| c41 | `<script>` in a comment | survived | yes | `1` |
| c42 | `</style>` in a comment | rewritten (</style> removed) | yes | `1` |
| c43 | `</STYLE >` in a string | rewritten (</style> removed) | no | `""` |
| c44 | canary after both | survived | yes | `1` |
| c45 | visible end marker | survived | yes | `"[c45] probe.css: end of sheet reached"` |

## 5. HTML probes (bio set)

| Id | Probe | Predicted (library model) | Live outcome (owner = logged out) | vs. project description |
|---|---|---|---|---|
| x00 | PROBE-HTML-START set=full kit=v1 2026-10-14 (temporary test …(+24) | survived | survived | same |
| k01 | Custom-a | stripped: class tokens dropped: Custom-a | stripped: class tokens dropped: Custom-a | same |
| k05 | customer | survived | survived | same |
| k07 | custom-hover:x | H1 survived / H2 stripped: class tokens dropped: custom-hover:x | survived | same |
| k09 | custom-w-[3px] | H1 survived / H2 stripped: class tokens dropped: custom-w-[3px] | survived | same |
| k11 | custom-w-1/2 | H1 survived / H2 stripped: class tokens dropped: custom-w-1/2 | survived | same |
| k14 | custom:flex | H1 survived / H2 stripped: class tokens dropped: custom:flex | survived | same |
| k16 | -custom-f | stripped: class tokens dropped: -custom-f | stripped: class tokens dropped: -custom-f | same |
| k26 | foo | stripped: class tokens dropped: foo | stripped: class tokens dropped: foo | same |
| k31 | all tokens invalid | stripped: `<span.foo.bar>` @class dropped | stripped: `<span.foo.bar>` @class dropped | same |
| k34 | hand-written spoiler | stripped: `<span.spoiler>` @tabindex dropped | survived | same |
| a01 | id | stripped: @id dropped | stripped: @id dropped | same |
| a02 | data-* | stripped: @data-probe dropped | stripped: @data-probe dropped | same |
| a04 | aria-hidden | stripped: @aria-hidden dropped | stripped: @aria-hidden dropped | same |
| a05 | role | stripped: @role dropped | stripped: @role dropped | same |
| a09 | lang | survived | survived | same |
| a12 | popover + id | stripped: `<div>` @popover dropped; `<div>` @id dropped | stripped: `<div>` @popover dropped; `<div>` @id dropped | same |
| a20 | h1 aria-label | stripped: @aria-label dropped | stripped: @aria-label dropped | same |
| s02 | !important | stripped: @style dropped | stripped: @style dropped | same |
| s08 | six never-seen list properties | survived | survived | same |
| s11 | custom property + color | stripped: style declarations dropped: --i:3 | stripped: style declarations dropped: --i:3 | same |
| s18 | no-space list | stripped: style declarations dropped: float:left; border-radius:5px | stripped: style declarations dropped: float:left; border-radius:5px | same |
| t08 | details name open | stripped: `<details.custom-t08d>` @class dropped; `<details.custom-t08d>` @title dropped; `<details.custom-t08d>` @style dropped; `<details.custom-t08d>` @name dropped; … | stripped: `<details.custom-t08d>` @class dropped; `<details.custom-t08d>` @title dropped; `<details.custom-t08d>` @style dropped; `<details.custom-t08d>` @name dropped; `<details.custom-t08d>` @open dropped; `<summary.custom-t08s>` @class dropped; <… | same |
| t21 | link meta | rewritten: `<link>` escaped as visible text; `<link>` escaped as visible text; `<meta>` escaped as visible text | rewritten: `<link>` escaped as visible text; `<link>` escaped as visible text; `<meta>` escaped as visible text | same |
| t23 | Name | survived | survived | same |
| i01 | youtube, all attributes | stripped: `<iframe.custom-i01x>` @title dropped; `<iframe.custom-i01x>` @allow dropped; `<iframe.custom-i01x>` @loading dropped; `<iframe.custom-i01x>` @sandbox dropped; … (project pages: click-to-activate placeholder, observed) | stripped: `<iframe.custom-i01x>` @title dropped; `<iframe.custom-i01x>` @allow dropped; `<iframe.custom-i01x>` @loading dropped; `<iframe.custom-i01x>` @sandbox dropped; `<iframe.custom-i01x>` @referrerpolicy dropped; `<iframe.custom-i01x>` @class d… | differs: no placeholder; the iframe stays live with the same attributes dropped |
| i04 | arbitrary https host | survived (project pages: click-to-activate placeholder, observed) | survived | differs: no placeholder; the iframe stays live |
| l01 | rel=me off-site | rewritten: `<a>` @rel changed: "me" -> "nofollow noopener"; `<a>` @referrerpolicy added: "origin" | rewritten: `<a>` @rel changed: "me" -> "nofollow noopener"; `<a>` @referrerpolicy added: "origin" | same |
| l02 | rel on itch link | stripped: `<a>` @rel dropped | stripped: `<a>` @rel dropped | same |
| l10 | named anchor | survived | survived | same |
| g07 | img unquoted width | rewritten: `<img>` escaped as visible text | rewritten: `<img>` escaped as visible text; extra elements in the stored markup: a | same |
| e04 | html comment | rewritten: HTML comment escaped as visible text | rewritten: HTML comment escaped as visible text | same |
| x99 | PROBE-HTML-END | survived | survived | same |

## 6. Live behaviour of surviving markup (`html.live`)

| Check | Predicted | Live (owner = logged out) |
|---|---|---|
| `target_aName_l10` | matches :target | matches :target |
| `target_id_a01` | element absent | element absent |
| `detailsExclusive_t08` | 0 survived | 0 details[name] element(s) survived |
| `spoiler_k34` | not hidden (bios lack `.user_formatted`) | **not hidden**: tabindex `0`, text fill `rgb(238, 243, 255)`, background `rgba(0, 0, 0, 0)` |
| `liveContainer.iframes` / `placeholders` | bio unknown | 2 / 0: bio iframes stay live |
| `liveContainer.emptyLetterSpans_t23` | 2 | 2 |
| Served size (`rawCharsFromContainerTagToEndMarker`) | sent 3,857 | 3633 (container innerHTML 3482, 32 CR) |
| Container | `div.user_profile.formatted` | `div.user_profile.formatted` |

## 7. Page facts (`dom`, `served`): owner vs logged out (M03)

| Item | Owner | Logged out |
|---|---|---|
| Body classes (live) | `"has_header locale_en user_layout_widget layout_widget no_theme_toggle responsive disable_hover"` | `"locale_en user_layout_widget layout_widget no_theme_toggle responsive disable_hover"` |
| `#wrapper` ancestors | `["div#wrapper.user_page_wrap", "div.theme_editor_primary_column", "div.theme_editor_columns", "body.has_header.locale_en.user_layout_widget.layout_widget.no_theme_toggle.responsive"]` | `["div#wrapper.user_page_wrap", "body.locale_en.user_layout_widget.layout_widget.no_theme_toggle.responsive.disable_hover"]` |
| Body children | `["div#user_profile_header_N.small_logo.user_profile_header_widget.header_widget.base_widget.gray", "div.theme_editor_columns", "script#loading_lightbox_tpl", "script", "script"]` | `["ul#user_tools.user_tools", "div#wrapper.user_page_wrap", "script#loading_lightbox_tpl", "script", "script"]` |
| Stylesheets (live order) | `["link static.itch.io", "link static.itch.io", "style#user_theme", "style#custom_css", "style[itchio-grid-sizer]", "style[itchio-grid-sizer]"]` | `["link static.itch.io", "style#user_theme", "style#custom_css", "style[itchio-grid-sizer]", "style[itchio-grid-sizer]"]` |
| Styles after `#custom_css` | `["style itchio-grid-sizer,type", "style itchio-grid-sizer,type"]` | `["style itchio-grid-sizer,type", "style itchio-grid-sizer,type"]` |
| Inline styles | `{"wrapper": "min-height: 608px;", "innerColumn": null}` | `{"wrapper": "min-height: 658px;", "innerColumn": null}` |
| Counts | `{"h1": 4, "h1Visible": 4, "gameCell": 9, "gameCellTools": 0, "userTools": 0, "userToolsHidden": 0, "headerWidget": 1, "siteHeader": 1, "darkTheme": 0, "purchasedGames": 1, "collectionRow": 2, "servedInlineDisplayNoneInWrapper": 2}` | `{"h1": 3, "h1Visible": 3, "gameCell": 5, "gameCellTools": 0, "userTools": 1, "userToolsHidden": 0, "headerWidget": 0, "siteHeader": 0, "darkTheme": 0, "purchasedGames": 0, "collectionRow": 0, "servedInlineDisplayNoneInWrapper": 0}` |
| Owner config | `{"imageSizeLimit": "3145728", "canUseCssFlag": true}` | `{"imageSizeLimit": null, "canUseCssFlag": null}` |
| Response headers | `{"content-type": "text/html", "cache-control": "no-store", "x-cache-status": "BYPASS", "x-frame-options": "SAMEORIGIN", "vary": "accept-encoding"}` | `{"content-type": "text/html", "x-cache-status": "HIT", "x-frame-options": "SAMEORIGIN", "vary": "accept-encoding"}` |

## 8. Cap tests

Not run (Run 4). Side result for D (bio cap): a 3,857-character bio saved without a message.

## 9. Manual probes

| Id | Result | Notes |
|---|---|---|
| M03 owner / visitor / logged-out views | done for owner vs logged out | §7. Logged out: `#user_tools` visible and not hidden, no site header, `#wrapper` directly under `body`, 5 game cells (owner: 9; the owner page also has 2 collection rows, a purchases section and 2 elements in `#wrapper` with an inline `display:none`, which may or may not be game cells), `disable_hover` on body in both (added at runtime: absent from the served body class). Second account, dark mode and non-English language not tried |
| M07 Custom CSS on the profile | present | `canUseCssFlag: true` |
| M08 upload limit | 3,145,728 bytes (3 MiB) | profile owner config, same as the project |
| M10 publish latency | about 2.5 minutes | the logged-out page served the old copy (`HIT`) from 10:36:08 to 10:38:02 UTC after the restore save, then `EXPIRED` with the new copy at 10:38:32; the probe save had also reached logged-out visitors within about 3 minutes. A `?query` did not bypass the cache |

## 10. Knowledge-base updates

| Section | Claim (short) | Old tag | New tag or correction | Probe id |
|---|---|---|---|---|
| Main R8, §1 | `</style>` deleted, both ends trimmed | project only | also on the profile, logged in and out | live-c42 to live-c44, live-css |
| Main §1 | Line endings | CRLF on projects, origin unclear | LF on the profile from the same paste: itch adds the CR on projects | live-css |
| Main §1 | Logged-out cache | documented · community-05; verified · crawlprofile-46 | owner `BYPASS` + `no-store`; visitors `HIT` ~2.5 min after a save, then `EXPIRED`; a query string doesn't bypass it | live-dom |
| Main §2 | `http://` URLs stored unchanged | project | project and profile | live-c04, live-c10 |
| Main R11, §5 | `custom` prefix test | project descriptions | also bios | live-k01, live-k05, live-k07, live-k09, live-k11, live-k14, live-k16, live-k26 |
| Main §5 | Bio container `div.user_profile.formatted` | observed · N1 | verified | live-html |
| Main §5 | Bio iframes | unverified | **settled**: stay live, same attributes dropped | live-i01, live-i04 |
| Main §5 | Spoiler in a bio | inferred | keeps `tabindex`, not hidden (no `.user_formatted`) | live-k34 |
| Main §5 | Bio cap | community · community-09 | a 3,857-character bio saved silently (cap still unmeasured) | live-html |
| Main §11 | Rows 2 and 3 | open for bios and profiles | settled for bios (bio set) and profiles | — |

The section files were retagged the same way on 2026-10-16: 05 and 09 for the bio (iframes live, spoiler not hidden, class filter, attributes, inline style, open questions), and 01, 02, 03, 04, 06, 08, 10 for the profile CSS (trimming, `</style>`, LF), the owner vs logged-out DOM (`#user_tools` unhidden at runtime, `disable_hover`, two grid sizers after `#custom_css`, `#wrapper` `min-height`), the cache (M10), the upload limit and the missing CSP. Jams and devlogs keep their older tags.

## 11. Before committing

- [x] Both JSON reports reviewed: no csrf token, e-mail address or other personal data; the subdomain is redacted as `<user>` (the owner agreed to publish `mirokshi.itch.io`).
- [x] No `saveRaw()` file was made.
- [x] The probe content was removed and the profile bio and CSS restored (checked logged out, 10:38:32 UTC).
