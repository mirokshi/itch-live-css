# Live probe kit

Kit v1, 2026-10-14. These tests can only be settled by saving content on an itch.io account. The research for this knowledge base never logged in, so 115 of its open questions wait on these probes. The account owner runs them on a **draft** project page (only the owner can see it), plus two short runs on the profile. Then `check.js` reads back what itch stored and prints a JSON report.

| File | What it is | Where it goes |
|---|---|---|
| `probe-description.html` | 155 HTML probes: tags, attributes, classes, inline styles, iframes, links, images, text | Project description, in HTML mode (`<>`) |
| `probe-bio.html` | 33 of those probes, chosen for questions about bios. 3,857 characters, under the reported 5,000-character bio cap | Profile bio, in HTML mode (`<>`) |
| `probe.css` | 46 CSS probes, 2,725 characters (fits the profile cap) | The Custom CSS field of the theme editor |
| `check.js` | Console snippet that reads the page as served and reports every probe | DevTools console, on the saved page |
| `probe-cap.md` | Procedure and generator for the size caps (profile, project, jam, bio) | — |
| `results-template.md` | Form for recording a run; library-model predictions are pre-filled | Copy it per run |
| `build.py` | Regenerates `probe-bio.html` and the payload copies inside `check.js` | Run after editing a payload |

**What the payloads load when the page is viewed.** Broken images and stylesheets from `example.com` (reserved for documentation), one public-domain image from `upload.wikimedia.org`, and iframes for YouTube, Vimeo, example.com, pages.github.com and codepen.io. On project pages itch turns third-party iframes into click-to-activate buttons, so nothing loads until you click. Nothing in the kit runs script on the page, submits a form or sends data anywhere. `check.js` makes one GET of the page's own URL.

## Steps

### Run 1: draft project (the main run, about 10 minutes)

1. **Make a draft project**, or reuse one, with visibility "Draft". Back up any description and CSS it already has.
2. **Description.** Edit the project, switch the description editor to HTML mode (`<>`), select everything and paste the whole of `probe-description.html`. Stay in HTML mode.
   - Optional, M01: before you click Save, open DevTools → Network. After saving, find the form POST, open its Payload tab and copy the description field into a private file. This shows what the editor sent, before the server sanitized it.
   - Click **Save**.
3. **CSS.** Open the project page, then Edit theme. Write down the theme settings (colours, fonts, layout options); `results-template.md` has a table for them. In Custom CSS, select everything and paste the whole of `probe.css`.
   - The textarea must start with two empty lines; they test whether leading whitespace is kept.
   - Click **Save**, then close the editor.
4. **Read back.** Reload the page. Open DevTools → Console and paste the whole of `check.js` (Chrome may ask you to type `allow pasting` first). Press Enter.
   - The JSON report is copied to the clipboard. If not, run `copy(probeKit.json)`, or `probeKit.saveJson()` to download it.
   - `probeKit.saveRaw()` downloads the page as served, with csrf tokens, e-mail addresses and your subdomain redacted. Keep that file private.
   - Quick visual check: the description should begin with `[c45] probe.css: end of sheet reached` and end with `[c27]`. If `[c45]` is missing, part of the stylesheet did not apply; c42–c44 explain why.
5. **Record.** Copy `results-template.md` to `results-<date>-project.md` and fill it in from the report.
6. **Clean up.** Remove the probe description and CSS, or delete the draft.

### Run 2: profile (public, keep it under 5 minutes)

1. Back up your bio HTML (`<>` mode) and your Custom CSS to local files.
2. Paste `probe-bio.html` into the bio in HTML mode and save. Paste `probe.css` into the profile's Custom CSS and save.
   - If the bio save is refused, write down the exact message: it answers the bio-cap question (D in `probe-cap.md`). Then save the file again without the two `custom-probe-i0…` lines.
3. Run `check.js` on the profile while logged in. Then open the profile in a private window (logged out) and run it again. The logged-out run shows the public page and its cache headers.
4. Restore the bio and the CSS from your backups, and check the profile logged out.

### Run 3: optional

- **Devlog post and jam description.** Paste `probe-description.html` into a draft devlog post of the draft project, and into the description of a draft jam you host. Run `check.js` on each. These fields have their own iframe and spoiler behaviour.
- **Jam CSS.** Paste `probe.css` into a draft jam's Custom CSS. Expect c03–c08 (`@import`) to be stored but not applied: on jams your CSS follows itch's generated rules.
- **Account without CSS access.** If you have one, paste `probe-description.html` into a draft project there and run `check.js`. Compare the `k` and `s` rows with Run 1.

### Run 4: size caps

Follow `probe-cap.md`: profile CSS, project CSS, jam CSS (if you host a draft jam) and the bio.

## How check.js scores a probe

Every HTML probe is a wrapper element with the class `custom-probe-<id>` and the visible text `[<id>]`. `check.js` finds the wrapper by class, or by its text if the class did not survive. Then it compares the stored copy with the sent copy (embedded in `check.js`), element by element and attribute by attribute.

| Outcome | Meaning |
|---|---|
| `survived` | Stored exactly as sent |
| `stripped` | Only removals: attributes, class tokens, style declarations, elements or comments dropped |
| `rewritten` | Anything else: a tag escaped as visible text, `b` renamed to `strong`, an iframe replaced by a click-to-activate placeholder, attributes added (`rel`, `loading`), values or text changed, or only whitespace re-serialised |
| `missing` | Neither the probe class nor its marker text is on the page |

`details` lists every difference. `raw` is the served HTML around the marker, with tokens and your subdomain redacted. Check `raw` before you trust a surprising outcome.

For CSS probes, `outcome` says what itch did to the text: `survived`, `stripped`, or `rewritten` with a `how` (for example `</style> removed` or `HTML-escaped`). `applied` says whether **this browser** honoured it, and `value` gives the computed result. A probe can survive at itch and still not apply, because the browser lacks the feature. `kit-error` means the kit itself is out of sync: run `build.py`.

The report also has these sections:

- `css`: stored size (characters, UTF-16 units, bytes, CR, LF), leading and trailing whitespace, and the CSSOM rule types;
- `html.live`: behaviour of the surviving markup, such as `:target`, `details` exclusivity and spoiler styling;
- `theme`: the theme block's size and background declarations;
- `dom`: body classes, ancestors of `#wrapper`, stylesheet order and owner-only elements;
- `cap`: present only during the cap tests.

## Manual probes

| Id | Question | Steps | What to record |
|---|---|---|---|
| M01 | Does the editor normalise HTML before sending? (quotes, raw `<`, line breaks inside tags) | Network capture of the description POST (Run 1 step 2) | Does the sent `g07`, `e06`, `e07`, `e08` and `s31` text equal the file? |
| M02 | Does `?redactor=0` give a plain textarea? | Open the project's edit URL with `?redactor=0` appended | Field type. If it is a plain textarea, repeat Run 1 through it and compare. |
| M03 | What changes for owners and logged-in visitors? | Compare the `dom` section of the owner run, a logged-out run (profile only) and, if possible, a run from a second account, with itch's dark mode and a non-English site language | `bodyClassLive`, `wrapperChain`, `bodyChildren`, `counts`, `htmlLang` |
| M04 | What does each theme-editor control emit? | Change one background or layout option, save, run `check.js`, repeat | `theme.backgroundDeclarations`, `theme.classes` per option |
| M05 | What does the editor's Readme popup say, and where does its "contact us" link point? | Edit theme → Misc → Readme | A paraphrase (not a copy), and the link's href |
| M06 | Does `#edit_theme` open the editor at phone width? | DevTools device mode at 375 px; open `<page>#edit_theme` as the owner | Does the editor open, and is Custom CSS usable? |
| M07 | Is CSS access per account for all page types? | Look for Custom CSS in the profile, project and jam theme editors | Present / absent for each |
| M08 | Background image upload limit and formats | Owner run on the profile: `dom.ownerConfig.imageSizeLimit`; optionally try a 3.2 MB upload | Limit, error text, accepted formats |
| M09 | Are hidden projects left out of the public HTML? | Hide one project in the profile theme editor; run `check.js` logged out | `dom.counts.gameCell`, `servedInlineDisplayNoneInWrapper` |
| M10 | How fast do logged-out visitors see a saved change? | Profile, private window: change one CSS value, save, run `check.js` every 30 s for 10 minutes | `served.headers` (`x-cache-status`, `age`) and when the value changed |
| M11 | Is the editor's own spoiler button markup kept in descriptions and bios? | Use the visual editor's spoiler button on a word, save | `.spoiler[tabindex]` in the served HTML (`probeKit.saveRaw()`) |
| M12 | Where are alt-text fields for screenshots and banners? | Look through the project edit page | Field locations; `img.screenshot[alt]` in the served page |
| M13 | Do cross-document view transitions run between profile and project? | Keep `probe.css` (c19) on both pages; navigate between them in Chrome 126+ | Crossfade yes or no |
| M14 | Does `random()` give a new value per load? | After Chrome 156 ships (2026-10-20), reload the probe page twice and run `check.js` | `css.probes.c28.value` in each run |
| M15 | Does `#wrapper{color-scheme:dark}` change itch's own controls? | Add the rule to the draft project's CSS; view logged in with the OS in dark and in light mode | Computed `background-color` of the comment textarea |
| M16 | Do the dashboard analytics show browser shares? | Look at the project's analytics | Yes or no, and the top browsers |

## Probe reference

"Pred." is the library model's prediction (leafo's `web_sanitize` with the itch-model whitelist, `../sections/05-html-in-descriptions.md` §6). Where its two class-filter hypotheses differ, H1 (prefix test) and H2 (strict characters) are both given. Each "means" cell says what to change in the knowledge base. Unless a row says otherwise, the matching outcome lets you retag the existing claim `[verified <date> · live-<id>]`.

### CSS (probe.css)

| Id | Question | Outcomes | What each means for the KB |
|---|---|---|---|
| c00 | Is the CSS stored and applied at all? | applied / not | Not applied: stop. The save failed, or the page is showing a stale preview. |
| c01 | Is `@charset` kept? It is not first in the sheet, so browsers ignore it. | survived / stripped | Stripped: itch filters at-rules. Correct 01 §4, which says the text is passed through. |
| c02 | Is an `@layer` statement before `@import` kept and valid? | survived + applied / not | Confirms the 01 §5 rule about what may precede `@import` |
| c03 | Is a non-Google HTTPS `@import` kept? | survived / stripped | Already verified on profiles; this adds the page type (01 §4, 08) |
| c04 | Is an `http://` `@import` kept? The browser blocks it as mixed content. | survived / stripped / rewritten | Survived: itch does not check URL schemes; record "kept, browser-blocked" in 08 |
| c05 | Does a `data:` `@import` apply? | applied / not | Applied: a no-host way to split CSS (08) |
| c06 | `@import … layer()` | applied / not | 06 and 08 layered imports |
| c07 | `@import … supports()` | applied / not | 01 §5: conditional imports |
| c08 | `@import … screen` | applied / not | 01 §5 |
| c09 | `@font-face` with `local()` | FontFace present / absent | 07 |
| c10 | `@font-face` with an `http://` src | survived / stripped | Stripped: itch enforces the guide's HTTPS rule; add to 01 §4 and 02 |
| c11 | `@layer` block | applied / not | 06 |
| c12 | `@property`, whose syntax contains `<` | applied (`7px`) / not | 01 §4 (`<` kept); 07 |
| c13 | `@container` size query (`#wrapper` as container) | applied / not | 07 |
| c14 | `@container style()` query | applied / not | 07 |
| c15 | `@scope` | applied / not | 06, 07 |
| c16 | Nesting with `&` | applied / not | 01 §3 point 4 |
| c17 | `@media` nested inside a rule | applied / not | 07 |
| c18 | `@starting-style` | CSSOM rule present / not | 07 |
| c19 | `@view-transition` | CSSOM rule present / not | 07; see M13 |
| c20 | `@supports` with `not` | applied / not | 07 |
| c21 | Range media query with `<=` | applied / not | 01 §4 (`<` kept) |
| c22 | `!important` on a custom property | applied / not | 01 §4 |
| c23 | Raw `>` combinator | applied / not | 01 TL;DR 4: write `>`, never `&gt;` |
| c24 | `&`, `<`, `>` inside a string | value equal / changed | Changed: itch entity-escapes CSS. Rewrite 01 §4. |
| c25 | Raw non-ASCII, including an astral emoji | value equal / changed | 01 §3, 01 §4 |
| c26 | `\hex` escapes, including `\3c` (an escaped `<`) | value `"→" "</x>"` / other | `\3c /style>` is the safe way to write `</style>` in a string (09) |
| c27 | `content: "x" / ""` (alt text for generated content) | value shows `/ ""` / not | 05 §11 C, 10 |
| c28 | `random()` | survived; applied only in browsers that support it | Text kept: 07's time-bound row can say "itch keeps it". Applied: see M14. |
| c29 | `sibling-index()` | applied / not | 07 |
| c30 | `@function` | applied / not | 07 |
| c31 | Raw `<svg …>` markup inside a `data:` URL | survived / rewritten | 01 §4 |
| c32–c35 | `expression()`, `behavior:`, `-moz-binding:`, `url(javascript:)`; all inert in today's browsers | survived / stripped / rewritten | Survived: itch filters no keywords (01 §4). Otherwise document the filter in 01 §4 and 09. |
| c36 | `@counter-style` | CSSOM rule present / not | 07 |
| c37 | Non-ASCII inside a comment | survived / changed | 01 §4 |
| c38–c39 | Escaped selectors `.custom-hover\:x` and `.custom-w-\[3px\]` | applied only if k07/k09 kept the class | Both applied: Tailwind-style tokens work end to end (05 §6, 08) |
| c40 | `<!--` inside a comment | survived / rewritten / stripped | 01 §4 row for `<!--` |
| c41 | `<script>` inside a comment | survived / rewritten / stripped | 01 §4 |
| c42 | `</style>` inside a comment, then a canary | **survived and not applied**: itch keeps it, the style element closes early, and the rest of the sheet shows as page text. **Rewritten, `</style> removed`, applied**: itch removes it on save or render. **Rewritten, HTML-escaped**: itch escapes `<`. | Settles the 01 §4 `</style>` row and 01 TL;DR 6. The `raw` HTML shows whether removal happened before serving. |
| c43 | A second, different spelling: `</STYLE >` in a string | Same outcomes as c42 | With c42: does itch remove every occurrence, case-insensitively, or only the first (like the editor preview's `strip_css`)? |
| c44 | Canary after both | applied / not | c42 applied but c44 not: only the first occurrence is removed |
| c45 | Visible end-of-sheet marker | shown / not | Quick visual check of the whole run |
| sheet | Leading whitespace: two empty lines and two spaces before the start marker | kept (`"\n\n  "`) / trimmed (`""`) | 01 §4 "Leading whitespace: untested" |
| sheet | Trailing whitespace after the end marker | kept / trimmed | Trimming is verified for profiles and projects; jams are unknown |
| sheet | Line endings (`stored.cr`) | 0 / equal to the LF count | 01 §3: profiles and jams store LF, projects CRLF |
| sheet | Whole text identical apart from line endings | yes / no, with `firstDifference` | 01 §4 "passes the text through" |

### Classes (k)

| Id | Token tested | Pred. | Outcomes and meaning |
|---|---|---|---|
| k01, k02 | `Custom-a`, `CUSTOM-b` (upper-case prefix) | dropped | Kept: the filter lowercases first. Change the 05 §6 table row "Custom-x" to kept. |
| k03, k04 | `customc`, `custom_d` | kept | Both have been seen live: these are controls for the `custom` prefix test |
| k05 | `customer` | kept | Dropped: itch requires `custom` plus a separator, and the live `customa…` tokens need re-explaining |
| k06 | `custom-` alone | kept | 05 §6 |
| k07–k13 | `custom-hover:x`, `custom-md:flex`, `custom-w-[3px]`, `custom-mt-[-1rem]`, `custom-w-1/2`, `custom-bg-red-500/50`, `custom-d.e` | H1 kept, H2 dropped | Kept: H1 is itch's filter, and 05 §6 can allow these with escaped selectors (see c38–c39). Dropped: H2 confirmed; keep "avoid" and retag. |
| k14, k15 | `custom:flex`, `custom:md:flex` (Tailwind v4 prefix form) | H1 kept, H2 dropped | 08, framework section |
| k16–k19 | `-custom-f`, `md:custom-g`, `!custom-h`, `xcustom-i` (prefix not first) | dropped | Kept: the filter is a substring test. 05 §6 needs rewriting. |
| k20 | `custom-café` (non-ASCII) | H1 kept, H2 dropped | Tells whether the filter is byte- or character-based |
| k21 | `custom-Hero` | kept | Control (seen live) |
| k22–k25 | `text-left`, `text-right`, `text-center`, `text-justify` | left dropped, others kept | `text-left` is unknown; 05 §6 lists only the other three |
| k26–k28 | `foo`, `button`, `inner_column` | dropped | Kept: the documented `custom-` rule is wrong (05 §6, 02) |
| k29 | Extra whitespace in the class value | re-serialised | 05 §5: "single-space separated" |
| k30 | Duplicate token | kept twice | Minor |
| k31–k33 | All tokens invalid, `class=""`, bare `class` | attribute removed | `class=""` kept: harmless; update the 05 §6 last row |
| k34 | Hand-written `<span class="spoiler" tabindex="0">` | `tabindex` dropped (itch keeps it on editor spoilers) | Kept: authored spoilers work. In the bio run, `html.live.spoiler_k34` shows whether bios hide spoilers (05 §6 says they render unstyled). |

### Attributes (a)

| Id | Attribute | Pred. | Outcomes and meaning |
|---|---|---|---|
| a01 | `id` | dropped | Kept: in-page anchors and `#id` hooks become possible (05 §5). `html.live.target_id_a01` confirms. |
| a02 | `data-*` | dropped | 05 §5 |
| a03 | `aria-label` | dropped | 05 §5, 05 §12 |
| a04 | `aria-hidden` | dropped (once seen dropped on a bio) | Dropped on every field: retag 05 §5 |
| a05 | `role` | dropped | 05 §5 |
| a06 | `tabindex` | dropped | 05 §5 |
| a07 | `hidden` | dropped | 05 §5 |
| a08–a10 | `title`, `lang`, `dir` | kept | Controls for the library's global attributes (05 §5) |
| a11 | `onclick` | dropped | Kept would be a security bug: report it to itch and do not publish a recipe |
| a12 | `popover` and `id` on a `div` | dropped | 05 §5: popovers can't be authored |
| a13 | `<button popovertarget>` | escaped as text | 05 §4: `button` is not allowed |
| a14 | `popovertarget` on `<a>` | dropped | 05 §5 |
| a15–a19 | `accesskey`, `contenteditable`, `draggable`, `translate`, `inert` | dropped | 05 §5 (new rows) |
| a20 | `aria-label` on an `h1` | dropped | Kept: letter-split headings can carry an accessible name (05 §11 B, 10); otherwise keep the B2 recipe |
| a21 | `lang`, `title`, `dir` together on `p` | kept | 05 §5, 10 |

### Inline style (s)

Pred. is the library's 27-property grammar (05 §7). Each live result either confirms that model or shows that itch uses its own list.

| Id | Style | Pred. | Meaning if live differs |
|---|---|---|---|
| s01 | `color: red` | kept | Control |
| s02 | `… !important` | whole attribute dropped | 05 §7 "whole-attribute killers" |
| s03 | `font-size: 1.5em` | declaration dropped | Decimal units allowed: 05 §7 value table |
| s04 | `font-size: 150%; line-height: 2` | `line-height` dropped | |
| s05 | `display: flex; float: left` | both dropped | |
| s06 | `background: url('…') no-repeat` | dropped | |
| s07 | `border-radius` plus slash `rgb()` | whole attribute dropped | |
| s08 | The six properties never seen live, plus `opacity` | all kept | Any dropped: itch's list is not the library's (05 §7) |
| s09, s10 | `border-radius`, `display` | dropped | |
| s11, s12 | `--i: 3` with and without `color` | `--i` dropped | Kept: per-element CSS variables become possible (05 §7, 05 §11 B) |
| s13–s15 | `position`/`top`, `font-family`/`font-weight`, `transform` | dropped | |
| s16 | `width: 50.5%` | whole attribute dropped | |
| s17 | Trailing whitespace | whole attribute dropped | |
| s18 | Eight properties with no spaces | `float` and `border-radius` dropped | Also answers whether CSS access changes the list (Run 3) |
| s19 | Gradient | dropped | |
| s20 | `var()` in `color` | kept | |
| s21 | `COLOR: red` | dropped | |
| s22 | Comment in the style | whole attribute dropped | |
| s23 | 8-digit hex | kept | |
| s24 | `calc()` | dropped | |
| s25 | `style=""` | kept empty | |
| s26, s27 | `line-height`, `letter-spacing`, `text-decoration`, shadows | dropped | |
| s28 | `height: auto; max-width: 100%` | `auto` dropped | |
| s29 | `2em`, `0 auto`, `0.5em 1em` | padding dropped | |
| s30 | Comma-syntax `rgba()` and `hsl()` | kept | |
| s31 | A line break inside the style value | re-serialised | Escaped or dropped: the form sends CRLF inside tags. Add a hazard to 05 §10. |

### Tags (t)

| Id | Tags | Pred. | Outcomes and meaning |
|---|---|---|---|
| t01 | `b`, `i` | kept | Renamed to `strong`/`em`: confirms the 05 §4 re-save normalisation |
| t02 | `u` (class), `s`, `strike`, `ins`, `del` (class, datetime, title) | `ins` escaped; `del` loses all attributes | 05 §4 |
| t03 | `mark`, `small`, `sub`, `sup`, `kbd`, `code.language-css` | `language-css` dropped | 05 §6 (comments keep it) |
| t04 | `abbr`, `q`, `cite`, `dfn`, `var`, `samp`, `time`, `bdi`, `bdo`, `data` | `bdi`, `bdo`, `data` escaped | 05 §4 lists |
| t05 | `pre`, `blockquote`, `hr`, `br` with classes | kept | 05 §4 |
| t06 | `h5`, `h6` with classes | kept | 05 §4 |
| t07 | `dl`, `ol[start reversed type]`, `li[value]` | list attributes dropped | 05 §5 (new rows) |
| t08 | `details`/`summary` with class, title, style, `name`, `open` | every attribute dropped | Kept: 05 §4 "itch-added tags carry no attributes" is wrong. `name` kept: exclusive accordions work (`html.live.detailsExclusive_t08`). |
| t09 | `figure`/`figcaption` with class and style | every attribute dropped | Same as t08 |
| t10 | `ruby`/`rt` (class), `font` (color, face, size), `center` | attributes dropped, `center` escaped | 05 §4 special cases |
| t11 | `marquee`, `wbr` | escaped as text | Removed: 05 §4 "escaped, not deleted" must change |
| t12 | `<span/>` (self-closed) | escaped | 05 §10 hazard 3 |
| t13 | Inline `svg`, `math` | escaped | 05 §4 |
| t14–t16 | `video`/`source`/`audio`, `picture`, `canvas`/`progress`/`meter` | escaped (the `img` inside `picture` is kept) | 05 §4 |
| t17 | `table` with `caption`, `colgroup`, `col`, `thead`, `th`, `tfoot` and presentational attributes | `caption`, `colgroup`, `col` escaped; `border`, `cellpadding`, `align` and `th[scope]` dropped | 05 §4 tables |
| t18 | `label`, `input[type=checkbox]`, `select`, `textarea`, `form` | escaped | Kept: the checkbox hack works. Document in 07. |
| t19 | `section`, `article`, `nav`, `header`, `footer`, `main`, `aside` | escaped | 05 §4 |
| t20 | `style`, `script` | escaped | `style` kept: CSS without CSS access (big). `script` kept: a security bug, report it to itch. |
| t21 | `link rel=stylesheet`, `link rel=preconnect`, `meta` | escaped | 05 §4, 08 |
| t22 | `object`, `embed`, `dialog`, `template`, `slot` | escaped | 05 §4 |
| t23 | `h1.custom-*` holding an empty `span.custom-l` per letter (pattern B2) | kept | Removed or emptied: B2 fails, use pattern B (05 §11, 07, 09, 10). `html.live.liveContainer.emptyLetterSpans_t23` should be 2. |
| t24 | Empty elements with and without classes | kept | 05 §11 |

### Iframes (i), links (l), images (g)

| Id | What | Pred. | Outcomes and meaning |
|---|---|---|---|
| i01 | YouTube with title, allow, loading, sandbox, referrerpolicy, style, class, name, frameborder, scrolling, allowfullscreen | kept, minus title, allow, loading, sandbox, referrerpolicy, class, name; placeholder on project pages | The surviving attributes complete 05 §9. On a bio, a live `iframe` versus `button.embed_preload` answers "click-to-activate on profiles?". |
| i02, i03 | youtube-nocookie, Vimeo | kept | Removed: a host allowlist exists |
| i04 | An arbitrary HTTPS host (example.com) | kept | Removed: allowlist. Settles 05 §9 "No narrow host allowlist is evident". |
| i05 | GitHub Pages host | kept | Same |
| i06, i07 | `http://` and protocol-relative `src` | kept | 05 §9 |
| i08, i09 | `srcdoc` only, `data:` src | `srcdoc` and `src` dropped | Kept would be a security issue: report it to itch |
| i10 | codepen.io | kept | Same as i04 |
| l01 | `rel="me"` on an off-site link | replaced by `nofollow noopener` | 05 §8: Mastodon verification is impossible |
| l02 | `rel` on an itch.io link (no rel is injected there) | dropped | Kept: authored `rel` survives where itch adds none |
| l03–l08 | `#fragment`, `/relative`, `javascript:`, `tel:`, `HTTPS://`, leading space | href dropped, `rel` still added | 05 §8 |
| l09 | `mailto:` | kept, plus `rel` | Control (seen live) |
| l10 | `<a name>` | kept | `html.live.target_aName_l10` = matches: 05 §11 pattern G is verified |
| l11 | `data:` href | dropped | 05 §8 |
| l12 | Raw `&` and `&amp;` in an href | kept | 05 §8 |
| l13 | `target`, `referrerpolicy`, `rel`, `hreflang`, `download`, `type`, `ping` | `target` kept, `rel`/`referrerpolicy` replaced, the rest dropped | 05 §5, 05 §8 |
| g01 | A real external image (Wikimedia) | `src` unchanged, `loading="lazy"` added | `src` rewritten: itch rehosts images. Correct 05 §9. |
| g02, g03 | No `alt`, `alt=""` | no `alt` added; `""` kept | 05 §9 (community claim that itch "enforces" alt) |
| g04 | `srcset`, `sizes`, `loading`, `decoding`, `fetchpriority`, `crossorigin`, `referrerpolicy`, class, style, title | `loading` forced to `lazy`; the other six new attributes dropped; class, style, title kept | 05 §5 |
| g05 | `http://` src | kept | 05 §9 |
| g06 | `data:` src | dropped | 05 §9 |
| g07 | Unquoted `width=40%` | tag escaped | Kept: the editor normalises markup (05 §10 hazard 1 cannot bite). Compare with M01. |
| g08 | `<img … />` | kept | 05 §10 |
| g09 | Relative src | dropped | 05 §9 |
| g10 | Protocol-relative src | kept | 05 §9 |

### Text and parser (e), markers (x)

| Id | What | Pred. | Outcomes and meaning |
|---|---|---|---|
| e01 | Named and numeric entities, including `&copy2026` with no semicolon | text identical | 05 §10 point 7 |
| e02 | Raw `&`, `&notanentity;`, `1<2`, `3>2` | text identical | 05 §10 point 7 |
| e03 | Emoji, a ZWJ sequence, Hebrew, a combining accent | text identical | Changed: itch normalises Unicode (new gotcha) |
| e04 | `<!-- comment -->` | escaped as visible text | Removed or kept: correct 05 §10 point 6 and 05 §1 rule 11 |
| e05 | `<p></p>`, `<p><br></p>`, `<p>&nbsp;</p>` | kept | 05 §10 point 11 |
| e06 | A tag split across two lines | kept | Escaped: the form sends CRLF inside tags (05 §10 hazard 2) |
| e09 | Upper-case tag and attribute names | kept | 05 §10 |
| e10 | Single-quoted and unquoted (safe) attribute values | kept, re-quoted | 05 §10 hazard 1 |
| e07 | `a < b and c > d` | words lost (`a < b > d`) | 05 §10 hazard 5 confirmed, or the editor escapes `<` (M01) |
| e08 | `x < div > y`, followed by the end marker | `x99` ends up outside the container (an injected `</div>`) | Confirmed: 05 §10 hazard 5 and rule 9 become verified. Text kept literally: the editor or server escapes raw `<`. |
| x00, x99 | Start and end markers | kept | `x99.insideContainer` false: see e08 |

## What was deduplicated and why these probes

The question pool held 237 questions from research, verify and gap-fill passes; 115 need an account. They collapse into 22 questions. Priority 1 items change rules the knowledge base gives every AI; priority 3 items refine explanations.

| Pri. | Cluster | Questions merged | Settled by | KB sections |
|---|---|---|---|---|
| 1 | Profile CSS cap: value, unit (characters, bytes or UTF-16 units), comments and whitespace, over-cap behaviour | 13 | `probe-cap.md` A | 01 §3, 09 |
| 1 | Dangerous text in saved CSS: `</style>`, `<!--`, `<script`, `javascript:`, `expression()` | 9 | c32–c35, c40–c44 | 01 §4, 09 |
| 1 | Modern syntax and `@import` variants kept verbatim; `http://` URLs; `random()` | 9 | c01–c31, c36–c39, M14 | 01 §4, 06, 07, 08 |
| 1 | Class-token filter (prefix, case, `: / [ ] .`, non-custom classes) | 6 | k01–k34 | 05 §6, 08 |
| 1 | Attributes per field: `id`, `aria-*`, `role`, `lang`, `data-*`, `popover`, `tabindex` | 7 | a01–a21, Run 2, Run 3 | 05 §5, 10 |
| 1 | Inline-style allowlist; does CSS access gate it? | 5 | s01–s31, Run 3 | 05 §7 |
| 2 | Iframes: hosts, attributes, click-to-activate on bios | 4 | i01–i10, Run 2 | 05 §9 |
| 2 | Unknown tags escaped or deleted; HTML comments; `link`/`meta`; the overall allowlist | 5 | t11–t22, e04 | 05 §4, 05 §10 |
| 2 | Attributes on itch-added tags (`details`, `figure`, …) | 2 | t08–t10 | 05 §4 |
| 2 | Empty `span.custom-*` in a bio `h1` (pattern B2) | 1 | t23, Run 2 | 05 §11, 07, 09, 10 |
| 2 | Editor normalisation, `?redactor=0`, raw `<` | 3 | g07, e06–e10, e07, e08, M01, M02 | 05 §10 |
| 2 | Project and devlog cap; jam cap | 5 + 5 | `probe-cap.md` B, C | 01 §3 |
| 2 | Leading and trailing whitespace; line endings | 6 | probe.css sheet rows, `probe-cap.md` A3 | 01 §3, 01 §4 |
| 2 | Bio HTML cap | 1 | `probe-cap.md` D | 05 §13 |
| 2 | Links, images, `rel=me`, spoilers | 4 | l01–l13, g01–g10, k34, M11 | 05 §8, 05 §9 |
| 2 | CSS-only pause control for animations (`:target`, `details`) | 1 | l10, t08 + `html.live` | 10 |
| 3 | Owner and logged-in views (site header, dark mode, locale, editor wrappers) | 11 | `dom` section, M03 | 03, 01 §2 |
| 3 | Theme-editor output (backgrounds, layout classes, hidden games, upload limit) | 6 | `theme`/`dom` sections, M04, M08, M09 | 04 |
| 3 | Editor UI and access (Readme text, `#edit_theme` on phones, access per page type, turnaround) | 6 | M05–M07 | 01 §1, 01 §2 |
| 3 | Publish latency and cache | 2 | M10 | 01 §2 |
| 3 | Live behaviour: cross-document view transitions, `color-scheme`, alt-text fields, browser mix | 4 | M12, M13, M15, M16 | 07, 10 |

Not settled by this kit: request turnaround for CSS access (it needs a new request), and every question that needs no account (other browsers, real screen readers, Brave's blocking of external CSS). Those are tracked in the sections themselves.

## Recording results in the knowledge base

- Keep one filled `results-template.md` per run in `knowledge/evidence/live-probes/` (create it), together with the JSON report. Review the JSON before committing it: it is redacted, but you are its last check.
- **Never commit** the file from `probeKit.saveRaw()` or the M01 capture: they are your logged-in pages.
- Tag what a run settles as `[verified <date> · live-<id>]` (for example `live-k07`, `live-c42`, `live-cap-A2a`). Change only the claims the probe tested, and keep library-model and observed tags elsewhere as they are.
- A result holds for the page type and field it ran on. A description result is not a bio result until Run 2 shows it.

## Maintaining the kit

- Each HTML probe sits on its own line with a unique `custom-probe-<letter><2 digits>` class and the matching `[<id>]` marker text. Risky features go on an inner element, so the wrapper survives.
- After editing any payload, run `python -I build.py`. It writes `probe-bio.html`, refreshes the embedded copies in `check.js`, and fails if `probe.css` exceeds 5,000 characters or `probe-bio.html` exceeds 4,000.
- The kit was tested offline before release. `check.js` ran in headless Chrome 155 against mock pages: an unchanged copy, the library model under H1 and H2, simulated click-to-activate placeholders, a profile bio, a jam block, `</style>` removed once or everywhere, HTML-escaped CSS, and a truncated sheet on an owner-style page. The cap generator and readers ran against truncated and expanded mocks. No itch.io page was requested.
