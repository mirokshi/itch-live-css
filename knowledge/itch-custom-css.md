# itch.io Custom CSS — Knowledge Base for AI assistants

> How to write custom CSS, and the description HTML it styles, for itch.io profile, project (game), devlog and jam pages without breaking itch's UI, its policies or accessibility. Condensed from ten detailed section files (~865 KB) built on logged-out checks of live pages, local browser tests, live renders with itch's JavaScript, and itch's documentation. Every claim carries a confidence tag and a fact id.

Last verified: 2026-10-14; live probe Runs 1 (draft project), 2 (profile), 3 (devlog post) and 4 (size caps) on 2026-10-16

**Confidence legend.** Tags read `[confidence · fact-id]`. Dates are 2026-10-14 unless shown.

| Tag | Meaning |
|---|---|
| verified | Re-checked directly: a logged-out GET of live pages, a byte diff, or a local browser test (Chromium 147–155 unless noted) |
| verified (live render) | A real itch page with itch's JavaScript running and the test CSS injected locally |
| verified (script-free harness) | A saved copy of a real page with itch's scripts stripped, so JS-driven layout is frozen |
| documented | Official itch docs, staff (admin) statements, itch's shipped JS/CSS read as source (`documented (itch JS)`), or MDN/spec text |
| observed | Seen on live pages or in the corpus of 62 styled pages, without a causal test |
| community | Creator reports, forum posts, community tools |
| library model | Reproduced locally with the sanitizer library itch appears to use; not tested on itch |
| inferred | Reasoned from the evidence above |
| unverified | A hypothesis with no direct check |

Never upgrade a tag without a new direct check; where two tags for one claim disagree, use the weaker.

**Live probes.** `[verified 2026-10-16 · live-<id>]` marks a result of the [probe kit](probes/README.md) run on the owner's account. Run 1 covered a **draft project page** (its description and Custom CSS, owner logged in); Run 2 the owner's **profile** (its bio with the 33-probe bio set, and its Custom CSS, logged in and logged out); Run 3 a **draft devlog post** of that project (its body, and the project CSS as served there); all in Brave 155 = Chromium 155. The same probe id is used in every run; the text names the page types each tag covers. Ids are probe ids (`live-c42`, `live-k07`), cap steps from `probe-cap.md` (`live-cap-A2c`) or report sections (`live-css` for the stored sheet, `live-html` for the description container, `live-dom` for page facts). check.js reads the page as served, so it can't tell a change made at save from one made at render. Such a tag holds for the page types named; jams keep their older tags ([project results](evidence/live-probes/results-2026-10-16-project.md), [profile results](evidence/live-probes/results-2026-10-16-profile.md)).

## How to use this file

- **Load this file**; it covers most tasks. Open a section file (`sections/NN-*.md`, 47–111 KB) only for its tables, measurements or edge cases ("Full detail:" links).
- `NN §x` = section file NN, subsection x; `§n` = a section of this file; `R7` = rule 7 in §0; `B1`–`B4` = the blocks in §0.1. Fact ids resolve through the Appendix.
- Before writing CSS, ask which page type it is for and whether the account has CSS access (R1), and check the size budget (R7).

## 0. Rules an AI must never break

1. **Ask first whether the account has CSS access.** Staff grant it by hand, per account. Without it the Custom CSS field isn't rendered; the fallback is the theme editor plus description HTML [documented · docs-01, community-48].
2. **Start every style-rule selector with `#wrapper`**, inside `@media`/`@supports` too. itch adds no scoping and serves the text page-wide. Never bare `html`, `body`, `*`, `a`, `img`; never `body > #wrapper` [documented · docs-09; verified · corpus-01, corpus-16, S03-N7]. One exception: the HTML5 release `body.frame_maximized #wrapper …` (B4, §4) styles only inside `#wrapper`; `#wrapper:has(.game_frame.maximized) …` also passed [verified · s04-gf-10].
3. **Set theme variables on `#wrapper` or below, never on `:root`/`html`** (`:root` recoloured the jam site header). Profile: `#wrapper .user_page`. Project and jam: `#wrapper` [verified · crawljam-42, itchcss-12, crawljam-05].
4. **Never use the `background` shorthand on `#wrapper`.** The theme paints the creator's image as longhands on that same node, and the shorthand wipes it. Use `background-*` longhands (B3) [verified · repo-18, itchcss-57, crawlprofile-35, crawlproject-23].
5. **Never hide, move, cover, relabel or fake itch's UI**: footer links (`.footer`, `#view_game_footer`, jam `.itch_footer` [inferred · crawljam-24]), site header, `#user_tools`, dialogs, buy/download rows, prices, "More information", `.embed_preload`, the External-link badge. It can cost CSS access [documented · docs-10, docs-11, docs-12, community-23; community · community-24; verified · itchcss-46].
6. **Never mislead or track**: no fake controls, modals or badges, click-capturing layers or impersonation; no `url()` beacons, form-field selectors, cookies or visitor logging from a CSS host [documented · docs-10, docs-12, docs-13, external-33; verified · external-32, external-47].
7. **Budget the size and report it.** Profile: ≤ **5,120 UTF-8 bytes** after trimming leading and trailing whitespace, comments included; over it the save is refused, never truncated [verified 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a to live-cap-A3c]. Project/devlog: no CSS cap (659,742 ASCII characters saved; larger saves fail as a request, with "missing token") [verified 2026-10-16 · live-cap-B1, live-cap-B2]. Jam: 20,410 chars of your CSS are known to save [documented · crawljam-29; inferred · gapfill01-03].
8. **Paste minified CSS only**: no HTML, no `<style>` wrapper, never the string `</style>`: on projects and profiles itch deletes it from the served sheet, in any case and with inner spaces (`</STYLE >`), inside comments and strings, so the text around it changes silently [verified 2026-10-16 · live-c42, live-c43, live-c44]; a data URI is a string, so expect the same there [inferred]. Write `>` raw, never `&gt;` [documented · repo-05; observed · crawlprofile-25; verified · corpus-02].
9. **Put every `@import` first** (only comments, `@charset` or an `@layer a,b;` statement before it), at top level, or it is dropped silently. On jams it never loads: use `@font-face` or the font picker [verified · repo-10, external-03, s06-run, crawljam-02].
10. **Import only `https://`, `text/css`, 2xx, version-pinned URLs** (never `raw.githubusercontent.com` or gist raw; a per-visit service is the one unpinned exception, served `no-store` from one production URL, §8), and keep the pasted CSS usable if the import fails or is blocked [verified · external-04, external-05, external-06, localtests-12; observed · repo-14].
11. **Classes in page HTML must start with `custom-`** (the filter tests the lowercase prefix `custom`; whatever follows survives, `:`, `/` and `[ ]` included, in project descriptions and bios [verified 2026-10-16 · live-k03 to live-k15]); `id`, `data-*`, `aria-*`, `role`, `on*` and `tabindex` (except on `.spoiler`) are stripped [verified 2026-10-16 · live-a01 to live-a06, live-a11, live-k34]. Avoid names starting `custom-ad`, `custom-social`, `custom-share`, `custom-cookie`: default filter lists hide exact names such as `custom-ad`, `custom-ads`, `custom-cookie-banner` (and optional lists `custom-social`, `custom-share-button`) [documented · docs-34; observed · sanitizer-05, gapfill05-06; verified · external-30, x08-07].
12. **Never target numbered ids** (`#user_N`, `#view_game_N`…), which change per render. Stable: `#wrapper`, `#profile_header`, `#inner_column`, `#header`, `#view_game_footer`, `#entries` [verified · crawlproject-01, crawlproject-06].
13. **A project's sheet also styles its `/devlog`, devlog posts and `/comments`.** Scope with the page widget inside `#inner_column`: `#wrapper .view_game_page …` (main page; HTML5 pages carry both `.view_game_page` and `.view_html_game_page`), `.game_devlog_page` (index), `.game_devlog_post_page`, `.game_comments_page`; test all four [verified · s01-n2, crawlproject-37, S03-N3].
14. **`!important` only against itch's `!important`, inline `style=""` or a layered `!important`**; never on an animated property (it freezes), never `outline:none!important` [verified · docs-17, crawljam-07, localtests-04, localtests-24, gapfill01-13].
15. **Never put overrides in `@layer` or `@import … layer()`**: itch has no layers, so layered normal rules always lose [verified · support-37, external-12, s06-static].
16. **Prefix `@keyframes` names with `custom-`.** itch has 13 global names (`bounce`, `spin`…); a same-name rule replaces itch's page-wide [verified · s06-static, s06-kf].
17. **Ship B1 with any motion.** Auto-starting motion ends within 5 s, at rest; the un-animated state stays readable (never base `opacity:0` + `forwards`) [verified · gapfill02-01, gapfill02-02, s10-02, a11y-24; documented · a11y-25].
18. **Gate hover effects in `@media (hover:hover)`** and give each a focus equivalent [verified · s10-03, a11y-18].
19. **Keep a visible focus ring of ≥ 3:1 (B2).** itch's `#361275` ring is 1.14–1.5:1 on the dark backgrounds tested (`#222`, `#0b1433`, black) [verified · s04-5, s04-gf-02, s04-gf-16].
20. **Expose exactly one `h1` naming the page.** Where itch hides its own (bannered profiles; projects with a banner or HTML5 embed), add `<h1 class="custom-…">` to the bio or description. On jams keep `.jam_title_header`, never style `#wrapper h1` [verified · itchcss-54, crawlproject-10; verified (live render) · s10-25; observed · crawljam-46].
21. **Hide silent things with `display:none`**; `opacity:0`, `color:transparent` and sr-only text stay in the accessibility tree. Decorative generated content gets empty alt: `content:"★";content:"★" / ""` [verified · a11y-03, a11y-10].
22. **On HTML5 project pages keep `filter`, `backdrop-filter`, `transform`, `will-change` and fill-mode entrance animations off the embed's ancestors** (`#wrapper`, `#inner_column`, `.view_game_page`, `.embed_wrapper`); release `isolation` while the game is maximized (§4) [verified · s04-gf-08, s04-gf-09, s04-gf-11].
23. **Absolute `https://` URLs** in every `url()` and `@import` [verified · s02-n6, localtests-19].
24. **Verify logged out**, at 320/375 px plus the page type's breakpoints, on a live render with itch's JS. `read_page`/`find`-style tools can't tell what a screen reader hears [documented · docs-15; verified · a11y-31, localtests-34; verified (live render) · s10-17].

### 0.1 Copy-exact blocks

**B1: reduced-motion guard** (181 chars). `#wrapper *` misses `#wrapper` and its pseudo-elements; shorter guards left 3–4 of 6 test animations running. `transition:none` beats the `.01ms` form, which sticks at the start value on frozen timelines [verified · gapfill02-01, gapfill02-02, s10-02]. If a hover moves things, reset it inside too (`#wrapper .game_cell:hover{transform:none;translate:none}`).

```css
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

**B2: focus block** (04 §9.6, every page type): 0 missing, clipped or invisible rings across 505 Tab stops on copies of real pages with itch's bundles [verified · s04-gf-02, s04-gf-06]. `--focus-ring` must reach ≥ 3:1 on every surface (`#ffc857`: 11.75:1 on `#0b1433`, 1.54:1 on white) [verified · s04-gf-16].

```css
#wrapper{--focus-ring:#ffc857;--itchio_input_focus_color:var(--focus-ring)}
#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}
#wrapper .game_cell{position:relative}
#wrapper .game_cell:has(:focus-visible)::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;border:3px solid var(--focus-ring);border-radius:inherit}
#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}
```

**B3: tune the theme's background image** (iOS ignores `fixed`) [verified · itchcss-20, localtests-18; documented · s10-12]:

```css
#wrapper{background-repeat:no-repeat;background-size:cover;background-position:50% 0;background-attachment:fixed}
```

**B4: full-page decorative layer** under itch's UI (Follow button included), released while an HTML5 game is maximized [verified · localtests-39, repo-46, itchcss-29, s04-gf-11; verified (live render) · s10-19]:

```css
#wrapper{position:relative;isolation:isolate}
#wrapper::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none}
body.frame_maximized #wrapper{isolation:auto}
```

## 1. How custom CSS works

**Access and editor**
- Request access at https://itch.io/support, covering the guide's four points; empty accounts are refused; expect weeks [documented · docs-01, docs-02, docs-03; community · community-02].
- Owner, on the page: "Edit theme" (`button.edit_theme_btn`, hidden at ≤ 980 px) → "Misc" → "Custom CSS" → Save [observed · gapfill01-07; verified · gapfill01-08]. No field = no access [documented · community-48, repo-64].
- Unsaved CSS previews only for the owner, and pages are cached for minutes: confirm saves logged out and check `X-Cache-Status` [documented · community-05; verified · crawlprofile-46]. The owner gets `BYPASS` + `no-store`; logged-out visitors got `HIT` for about 2.5 minutes after a profile save, then `EXPIRED` and the new copy; a query string doesn't bypass the cache [verified 2026-10-16 · live-dom].
- On jams, "Paste theme..." also replaces Custom CSS [documented (itch JS) · gapfill01-07], and the host's view has another scroll container: judge fixed/sticky/scroll effects logged out [verified · gapfill01-09].

**Size caps.** The profile and project caps and the bio cap were measured on 2026-10-16 (Run 4, [cap log](evidence/live-probes/results-2026-10-16-caps.md)); the jam cap was not (§11).

| Page | Budget | Tag |
|---|---|---|
| Profile | ≤ **5,120 UTF-8 bytes**: 5,120 ASCII characters and 2,603 `é` (5,120 bytes) save; 5,121 ASCII and 2,604 `é` (5,122 bytes) are refused, although the message says "characters". Staff, 2023: "5kb"; asked to raise it: "Probably not" | [verified 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c]; [documented · docs-32] |
| Project, devlog | No CSS cap. Single-line ASCII CSS of 659,742 characters saved whole; 659,743 and more fail with "missing token": the request is too big for the form to be read, so the exact number depends on the rest of the form [inferred]. The June 2026 community claim of 5,120 doesn't hold | [verified 2026-10-16 · live-cap-B1, live-cap-B2] |
| Jam | Staff: "20kb" (likely 20,480). 20,410 chars of host CSS are live, so stay ≤ 20,410 | [documented · crawljam-29; inferred · gapfill01-03] |

- Only the server checks [documented (itch JS) · gapfill01-05]. Over the profile cap the save is refused, never truncated, with a lightbox: "We encountered an error", "css: expected empty, or text between 1 and 5120 characters", "Your changes were not saved, please try again" [verified 2026-10-16 · live-cap-A1]. The unit is UTF-8 bytes despite that wording [verified 2026-10-16 · live-cap-A2c]: measure bytes.
- Comments count toward the cap [verified 2026-10-16 · live-cap-A3a]; leading and trailing whitespace don't, because they are trimmed before the check [verified 2026-10-16 · live-cap-A3b, live-cap-A3c]. Trailing whitespace is trimmed from storage [verified · corpus-04], and on projects and profiles leading whitespace too [verified 2026-10-16 · live-css]. Line breaks go as LF on profiles and jams, CRLF (2 bytes) on projects, so ship project CSS as one line [verified · gapfill01-02, corpus-03; verified 2026-10-16 · live-css]. The same paste from the same browser was stored with LF on the profile and CRLF on the project, so itch, not the browser, adds the CR [verified 2026-10-16 · live-css]. Non-ASCII is 1 char but 2–4 bytes; raw `→` (3 B) beats `\2192` (5) [verified · corpus-19].
- Measure every build (projects: add the line-break count to both numbers) [verified · s01-n8]:

```sh
python -c "import sys;s=open(sys.argv[1],encoding='utf-8').read().strip();print(len(s),len(s.encode()),s.count('\n'))" dist/main.min.css
```

- Don't Base64 fonts or images into profile CSS: a 2,548-byte font subset costs 3,400 chars [documented · docs-32; verified · x08-06]. Over the cap, `@import` the rest from a pinned URL (not on jams) [verified · community-11].

**What a save does**
- **Meaning is preserved**: no minifying, scoping, entity handling or validation; comments, `@import`, nesting and non-ASCII are kept [verified · corpus-01, corpus-02, community-10, corpus-19]. Bytes do change: line breaks are normalised (jams: LF on recent saves, CRLF on 2 of 23 older ones), trailing whitespace is trimmed, jams append one space, and one pasted `</style>` was missing from the output [verified · corpus-03, s01-n3; observed · crawljam-28, crawlprofile-25]. On a project and on the profile the served sheet has every `</style>` deleted and leading whitespace trimmed (whether at save or at render is not known), logged in and logged out; nothing else changes: `@charset`, all six `@import` forms, `http://` font URLs, `expression()`, `behavior:`, `-moz-binding:`, `url(javascript:)`, and `<!--` or `<script>` in comments are stored as sent [verified 2026-10-16 · live-c01 to live-c45].
- **Browsers drop errors silently**: `calc(40px+10px)`, `calc(50px - 0)`, `and(` in `@media`, `//` comments, unbalanced braces, regex minifiers rewriting `content:` strings [verified · localtests-41, localtests-42, s01-n6]. One unknown selector drops its whole rule [verified · support-08].

**Injection order** [verified · s01-n2, s01-n3; observed · s04-6]

```text
profile         user.css → style#user_theme → [font link] → style#custom_css → (JS) style[itchio-grid-sizer]
project/devlog  game.css → style#game_theme → [font links] → style#custom_css
jam overview    jam.css  → style#jam_theme (generated rules + YOUR CSS + " ") → [font link]
```

- `style#custom_css` is last in the served `<head>`, so you win ties; it is omitted when nothing is saved [verified · sanitizer-32, crawlprofile-24].
- No CSP restricts external CSS, fonts or images on profile, project, devlog or jam pages [verified · s01-n2, crawlprofile-31, crawlproject-43, crawljam-30].

**Which pages get it**: the profile; the project with `/devlog`, devlog posts and `/comments` (R13); the jam overview. Never `/purchase`, project boards, forums, AMP devlogs, collections, `/blog`, or jam `/entries`, `/results`, `/feed`, `/community`, `/rate/<id>` (a jam without voting 302s `/results` to its styled overview) [verified · s01-n2, crawlproject-42, crawljam-03, crawljam-35, crawljam-44, docs-05]. No custom domains (staff, 2018; nothing newer found) [documented · gapfill03-10]. No JavaScript; per-visit behaviour needs an external sheet (§8) [documented · repo-04].

Full detail: [sections/01-how-it-works.md](sections/01-how-it-works.md)

## 2. Rules and policy

- **Most rules are policy, not software.** itch serves the CSS as typed; sanctions are human and after the fact: CSS access removed, account suspended, content removed or delisted [documented · docs-10, docs-12, docs-13, s02-n3]. No public revocation was found, which is not permission [documented · community-23].
- **Live pages prove nothing**: 87.5–87.7 % of top-level selectors on 62 styled pages lack `#wrapper` [verified · corpus-16]; an unscoped `img{max-width:5px}` shrank the site logo [verified · crawljam-16].

**Enforced by software or the browser**
- **S1:** access per account, on request; you agree to keep the page accessible and itch's UI unaltered [documented · s02-n1, a11y-02]. **S2:** where CSS loads, §1 [documented · docs-05; observed · s02-n7]. **S3:** `custom-` HTML classes, R11 [documented · repo-56]. **S4:** caps, R7; Base64 counts [documented · repo-60].
- **S5 anti-scam markup.** On project and devlog pages game.css shows a red "External link" badge on hovered or focused `rel~=nofollow` links in `.user_formatted` and rings linked images; not on profiles or jams [verified · itchcss-46]. Don't override it (P6) [inferred · itchcss-46, docs-10]: scope your link decorations as `#wrapper .user_formatted a:not([rel~=nofollow])::after`, and never `box-shadow:none` linked images.
- **HTTPS.** `http://` itch URLs 301 to `https://`; plain-http stylesheets and fonts are blockable mixed content [verified · s02-n6; documented · s02-n5]. itch itself stores `http://` `@import` and `@font-face` URLs unchanged (project, profile), so only the browser blocks them [verified 2026-10-16 · live-c04, live-c10].

**Policy, enforced by staff**
- **P1 scope** (R2, R3). `@import`, `@font-face`, `@keyframes`, `@property` stay top level [inferred]. `ul#user_tools`, the site header and `#lightbox_container` sit outside `#wrapper` [verified · docs-09; observed · s02-n7].
- **P2 built-in UI** (R5). An admin (2026-06-10): UI-breaking CSS may cost access; avoid the site header and dialogs [documented · community-23, docs-10]. Theme-editor-like changes inside `#wrapper` are fine; hiding, moving, covering or faking controls is not [inferred]. Projects at ≤ 650 px: `#user_tools` is a fixed 50 px bottom bar [observed · s02-n7].
- **P3 footer.** Never hide its links [documented · docs-11]; restyling is fine [observed · corpus-17]. By the rule's intent, no `display:none`, `visibility:hidden`, `opacity:0`, `height:0` + clipping, off-screen moves, overlays or background-coloured text [inferred · docs-11]. Keep the profile's 50 px bottom padding [observed · s02-n7]; restyled links stay ≥ 24×24 px or 24 px apart [verified · a11y-46].
- **P4/P5.** Fonts and images over HTTPS or Base64 [documented · external-36]. Enhance, don't rebuild: only guide-listed selectors are stable, and profiles have none [documented · docs-40, s02-n1].
- **P6/P7** (R6) also covers look-alike pages and click-capturing layers [documented · docs-10, docs-12, docs-13; inferred · docs-50, sanitizer-39].
- **P8/P10 accessibility.** Test with assistive technology, small viewports, logged out [documented · a11y-01, s02-n1]. WCAG 2.2.2 (A): auto motion over 5 s alongside content needs pause/stop/hide; reduced motion doesn't satisfy it and CSS has no pause button, so prefer finite ≤ 5 s motion and loop only with the user's explicit consent or on hover/focus [documented · a11y-25]. Decorative layers: `z-index:-1;pointer-events:none` (2.4.11) [inferred · a11y-47]. Flashing content may be delisted [documented · s02-n3]; stay under 3 flashes/s [inferred · docs-16].
- **P9** (R6). A CSS service echoing request data must allow-list or escape it (backslash before `"` and `\`; non-ASCII and controls as `\hex `) [verified · gapfill02-04].
- **P11/P12.** Embed only licensed assets [documented · s02-n2]; Vercel Hobby is non-commercial [documented · external-23].

Policy-safe motion (`custom-` name, finite, ends at rest, plus B1) [verified · gapfill02-01]:

```css
@keyframes custom-bob{to{translate:0 -4px}}
#wrapper .custom-title{animation:custom-bob 1.2s ease-in-out 4 alternate}
```

Full detail: [sections/02-rules-and-policy.md](sections/02-rules-and-policy.md)

## 3. Page anatomy

Logged-out DOM as served, before itch's JS runs. Owner views add wrappers and hidden items (§10).

**Every page**
- `#wrapper` is `div#wrapper.user_page_wrap` (profile), `div#wrapper.main.wrapper.game_page_wrapper` (project, devlog, comments) or `div#wrapper.jam_page_wrap` (jam) [verified · corpus-31]. The owner's view of a profile or project wraps it in the theme editor's columns, even with the editor closed, hence no `body > #wrapper` [verified · S03-N7; verified 2026-10-16 · live-dom]; a devlog post's owner view doesn't [verified 2026-10-16 · live-dom].
- `body` is out of scope; its classes vary [verified · crawlproject-07]. `ul#user_tools` sits before `#wrapper`, top right [verified · crawlprofile-19, itchcss-32]. No bare `#wrapper textarea/button/input/ul/li/form`: logged-in comment forms live inside `#wrapper` [inferred · gapfill03-13].
- **Documented (most stable) selectors.** Project: `#inner_column .header .columns .left_col .right_col .formatted_description .footer .embed_wrapper .game_frame`. Jam: `.view_jam_page .jam_banner_outer .jam_body .jam_header_widget .jam_submitter_widget .jam_content #entries` [documented · docs-20, docs-26]. Profile: none [verified · docs-41].

**Profile** [verified · crawlprofile-01, crawlprofile-15]

```text
#wrapper.user_page_wrap
├ .user_page.(mode_grid|mode_column)[.has_banner]       theme variables live here
│ ├ #profile_header.header  (.image_header | .text_header > h1)
│ ├ .inner_column.profile_content > .columns
│ │   ├ .profile_column > .user_links, .user_profile.formatted   (bio)
│ │   └ .game_column > .user_game_grid.game_grid_widget > .game_cell…
│ └ [section.purchased_games] [section.collections > .collection_row]
└ .footer   (absolute, at the bottom of #wrapper)
```

- **Bio:** `#wrapper .user_profile`; never `.formatted_description` (project only), `.user_formatted` (absent) or `.profile_column …` (`.columns` is missing on 5/51) [verified · repo-29, crawlprofile-06, sanitizer-30]. No `#inner_column` id, no `.button` [verified · crawlprofile-18, S03-N3].
- `#wrapper .game_grid_widget` also hits collection carousels; the own grid is `.user_game_grid` [verified · crawlprofile-15]. Equal-height cards: `align-items:stretch;grid-auto-rows:1fr` (itch sets `start`) [verified · itchcss-23, repo-32]. Covers: `#wrapper .game_thumb img{width:100%;height:100%;object-fit:cover}`; they load lazily, so never select `[src]` [verified · repo-34, crawlprofile-11].
- The thumbnail link is `tabindex=-1`: pair `:hover` with `:focus-within` [verified · a11y-18]. `.collection_row h2 a` is `color:inherit!important`: colour the `h2` [verified · itchcss-17]. The owner view has hidden extra items: no `display:…!important`, no `:nth-child` on cards or rows [inferred · gapfill03-11].

**Project** [verified · crawlproject-01, crawlproject-11, itchcss-35, itchcss-38]

```text
#wrapper.game_page_wrapper > #inner_column.inner_column   (960 px; 600 px at ≤ 1000 px; overflow:hidden)
├ #header.header[.has_image] > [banner img] + h1.game_title
├ .view_game_page[.view_html_game_page][.buy_on_top][.direct_download]     the page widget
│ ├ [.embed_wrapper > .game_frame]     HTML5 only, above .columns
│ ├ [.header_buy_row]                  non-HTML5 only
│ └ .columns > .left_col (.formatted_description …), .right_col (screenshots)
└ #view_game_footer.footer             inside #inner_column
```

- `body` stays `#eee`: add `#wrapper{min-height:100vh}` [verified · itchcss-37]. A banner hides `h1.game_title`, leaving the banner `img` (alt = title by default) as the only title: never hide it without a heading [verified · a11y-06, crawlproject-10].
- Select `.left_col` children by class, not position [verified · crawlproject-03]. Description only: `#wrapper .left_col > .formatted_description` [inferred · crawlproject-56]; `.user_formatted` and `.post_body` also match comments [verified · S03-N3, S03-N5].
- Buttons: `.buy_row .buy_btn`, `.upload .download_btn`, `.direct_download_btn` [verified · crawlproject-66]; `.header_buy_row` is hidden above 1000 px unless `.buy_on_top` [verified · crawlproject-11, gapfill03-08]. HTML5 games are cross-origin iframes: CSS reaches only the `.game_frame` box (inline size: `!important`) [verified · crawlproject-18, crawlproject-17]. Click-to-launch frames hold `.iframe_placeholder > button.load_iframe_btn` until the click (no `iframe#game_drop` yet); style `.embed_wrapper`, `.game_frame`, `.load_iframe_btn` [verified · crawlproject-16; documented · crawlproject-19].

**Devlog and comments** (same sheet, R13): no `.columns`, `.left_col`, `.right_col`, `.formatted_description` [verified · S03-N3]. Post title: `.game_devlog_post_page section.post_header h1` [verified · crawlproject-39]. Post: `.game_devlog_post_page > .split_columns > .primary_column` (`section.post_header`, `section.post_body.user_formatted`) + `.game_metadata` (307 px sidebar; stacks at ≤ 1000 px), then `.game_comments_widget`. Index: `.game_devlog_page .blog_post_list_widget > li` (`a.title`, `.post_preview .summary`, `img.post_image`) [verified · crawlproject-39, crawlproject-40, itchcss-38]. Main-page rules on `.game_info_panel_widget`, `.upload_list_widget`, `.game_comments_widget`, `.buy_btn` also hit posts [verified · S03-N3]. Bannerless projects: posts lack `#header`/`.game_title`; `/devlog` and `/comments` keep the title `h1` [verified · gapfill03-03, gapfill03-04].

**Jam overview** [verified · crawljam-19, crawljam-20, crawljam-26, docs-53]: `#wrapper.jam_page_wrap > .view_jam_page.<phase>[.has_banner] > .jam_banner_outer, .jam_body, [#entries]`; phases `.before_start`, `.during_submit`, `.during_voting`, `.after_voting.is_over`. `.jam_body` clips (`overflow:hidden`) and holds `.jam_header_widget` (`h1.jam_title_header`, `.stats_container`, `.header_tabs`), `.submitter_outer > .jam_submitter_widget` and `.jam_content`. `#entries.grid_outer`, a sibling after `.jam_body` on only 6/22 overviews, holds `.header_row`, `.jam_filter_picker`, `.game_grid_widget.browse_game_grid#game_grid_N > .game_cell` (size it with §7's jam line) and `.itch_footer`, the footer (no `.footer`; absent without entries) [verified · crawljam-15, crawljam-21, crawljam-23, gapfill07-03]. Sub-pages have no `#wrapper` and no host CSS (§1).

**Breakpoints to test:** 1001/1000, 961/960, 801/800, 651/650 and 601/600 px [verified · a11y-34].

Full detail: [sections/03-page-anatomy.md](sections/03-page-anatomy.md)

## 4. Theme editor and itch's own CSS

Check whether a theme-editor option does the job before writing CSS [documented · docs-44].

**Who wins.** Theme blocks have no ID selectors and itch's bundles only `#lightbox_*`, so any `#wrapper …` beats every normal itch rule [verified · crawlproject-31, s04-2, s04-4]. `!important` counts: user.css 7, game.css 12, jam.css 7; user_theme 0, game_theme 8 declarations (4 rules), jam_theme 6 (5 rules); only these need `#wrapper … !important` [verified · itchcss-18, s04-1, docs-17, crawljam-07]. Profile JS sets an inline `min-height` on `#wrapper` [observed · s04-7; verified 2026-10-16 · live-dom]. Never hard-code itch's `?<number>` cache stamp or `@import` its bundles [verified · community-51, itchcss-49]. `theme_editor.css` is owner-only: judge logged out [observed · itchcss-51].

**Background** (R4, B3): longhands on `.user_page_wrap`/`.wrapper`/`.jam_page_wrap`, i.e. the `#wrapper` node [verified · itchcss-57, crawlprofile-35, crawlproject-23].

**Variables** reach only `var()` readers; override them where the theme declares them.

| Page | Declared on → override at | Do links and titles follow? |
|---|---|---|
| Profile | `.user_page` (`--itchio_font_family`, `_link_color`, `_gray_back`, `_border_radius`) → `#wrapper .user_page` | No: literal colours. Also set `#wrapper .user_page a`, `#wrapper .footer a`, `#wrapper .game_title a` [verified · itchcss-12, repo-20, repo-21, crawlprofile-32] |
| Project, devlog | `#wrapper` node (10 variables: `--itchio_font_family`, `_bg_color`, `_bg2_color`, `_bg2_sub`, `_text_color`, `_link_color`, `_border_color`, `_button_color`, `_button_fg_color`, `_button_shadow_color`) → `#wrapper` | No: also set `#wrapper .inner_column a`, `#wrapper .button` [verified · corpus-44, itchcss-13, crawlproject-21; inferred · s04-2] |
| Jam | `#wrapper` node (9 variables: `--itchio_link_color`, `_border_color`, `_border_radius`, `_button_color`, `_button_fg_color`, `_button_hover_color`, `_button_active_color`, `_button_shadow_color`, `_button_border_color`) → `#wrapper` | Yes, since the 2026-06 revamp. Literal exceptions: `.filter_item.active` border (`!important`), `.itch_footer` border-top, `.community_activity` background, grid text colours (`!important`: `.game_text`, `.game_platform`, `.game_genre`, `.game_author a`, the count, `.footer_submissions`, `.powerd_by`) [verified · crawljam-05, crawljam-08, crawljam-11, itchcss-14] |

- **Text colour, font and panel are literals, not variables**: profile `.user_page{color;font-family}`; project `.inner_column{color;font-family;background-color:rgba(BG2,α)}` (the panel) with headings on `.inner_column h1…h6`; jam `.jam_page_wrap{color;font-family}` with headings on `.view_jam_page h1…h6` (no fallback stack). Restyle them as `#wrapper .user_page{…}`, `#wrapper .inner_column{…}`, `#wrapper{…}`; setting `--itchio_font_family` alone won't change the text font [verified · crawlprofile-32, crawlprofile-37, crawlproject-24, crawlproject-28, crawljam-14; inferred for the variable].
- Jams: a new `--itchio_button_color` also needs `_hover`, `_active`, `_shadow`, `_border_color` [verified · crawljam-34]. Dark themes: `#wrapper{color-scheme:dark}` [verified · support-59]. Derived shades can fail contrast: profile card text `.game_text`, `.game_author` (Text at .75) and `.game_platform`, `.game_genre` (.5); fix with ID rules such as `#wrapper .game_genre{color:…}` [verified · a11y-38, crawlprofile-54].
- Theme-picked Google fonts load only 400/700 + italics; other weights need a css2 `@import` (not jams) or `@font-face` [verified · corpus-13, corpus-45, gapfill07-05].

**Profile specifics**
- itch's JS appends `style[itchio-grid-sizer]` (0,2,0, `min_columns:2`) after your CSS: size grids with `#wrapper .mode_grid .user_game_grid` (§7) [inferred · s04-6, crawlprofile-17]. Two such elements follow `#custom_css` on a live profile, owner and logged out [verified 2026-10-16 · live-dom].
- The footer is absolute in `#wrapper`'s 50 px `padding-bottom` (its `margin-top` does nothing); dark themes need `#wrapper .footer{color:…}` [verified · crawlprofile-09, repo-24, itchcss-22]. Font size is a `%` on `.user_page`: `em` follows it, `px`/`rem` don't [verified · crawlprofile-39, itchcss-43].

**Project specifics**
- `.inner_column` and `.header` clip [documented · crawlproject-32, crawlproject-69]. "Screenshots: Hidden" returns at ≤ 1000 px: `#wrapper .view_game_page .right_col{display:none}` [documented · crawlproject-25].
- **Maximized HTML5 game** (R22), rendered in Chrome 155 [verified · s04-gf-08, s04-gf-09]: `backdrop-filter` on `#inner_column`, `transform` on `.view_game_page`, a `both`-fill transform entrance on `#inner_column`, or `filter` on `#wrapper` → page-tall frame (other property/ancestor pairs follow from the same containing-block rule [inferred]); `will-change:transform` on `.embed_wrapper` → 0 px tall, game gone; `isolation` on `#wrapper`, or `opacity`+`isolation` on `#inner_column` → `#user_tools` over the game. `perspective`, `contain`, `content-visibility` and individual transforms weren't rendered [documented · crawlproject-20]; the Fullscreen-API path was unaffected [verified · s04-gf-14]. Safe frosted panel [verified · s04-gf-10, s04-gf-11, s04-gf-13]:

```css
#wrapper #inner_column{isolation:isolate}
#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;backdrop-filter:blur(8px)}
#wrapper:has(.game_frame.maximized) #inner_column{isolation:auto}
#wrapper:has(.game_frame.maximized) #inner_column::before{content:none}
```

**Jam specifics:** host CSS sits inside `style#jam_theme`, so `@import` is dead (R9) [verified · s04-1, crawljam-14]; a runtime grid sizer follows your CSS (§6).

**itch ships no** reduced-motion, forced-colors, `prefers-color-scheme` or `color-scheme` rules, and its focus ring fails on dark themes: add B1, B2 and §10's fixes [verified · a11y-14, support-52, itchcss-27, s04-5].

Full detail: [sections/04-theme-editor-and-itch-css.md](sections/04-theme-editor-and-itch-css.md)

## 5. HTML in bios and descriptions (the sanitizer)

The Custom CSS field is not sanitized [verified · itchcss-52]; descriptions are. itch publishes no allowlist [documented · docs-36]; its output matches leafo's `web_sanitize` plus an itch whitelist [inferred · sanitizer-01]; on a project description 147 of 155 probes matched that model exactly, and the 8 differences are folded in below; a bio gave the same results on its 33-probe subset, and a devlog post on all 155, except that their iframes stay live [verified 2026-10-16 · live-html].

**Containers** [observed · N1, N2]: profile bio `div.user_profile.formatted` [verified 2026-10-16 · live-html] → `#wrapper .user_profile` (no `.user_formatted`, so itch's spoiler/table/img styles miss it); project `.formatted_description.user_formatted` → `#wrapper .formatted_description` [verified 2026-10-16 · live-html]; devlog `section.post_body` (live: `section#object_text_widget_N.object_text_widget_widget.base_widget.user_formatted.post_body`, so itch's spoiler styles apply [verified 2026-10-16 · live-html, live-k34]; comments are `div.post_body`) → `#wrapper section.post_body`; jam `.jam_content.user_formatted` → `#wrapper .jam_content`.

**Classes and attributes**
- Only `custom-` classes survive (R11) [documented · docs-34]. The filter is a case-sensitive prefix test on `custom` in project descriptions and bios (bio set: k01, k05, k07, k09, k11, k14, k16, k26, k31): on a project description `customc`, `custom_d`, `customer`, a bare `custom-`, `custom-Hero` and tokens with `: / [ ] .` or non-ASCII after the prefix (`custom-hover:x`, `custom-w-1/2`, `custom-w-[3px]`, `custom-bg-red-500/50`, `custom:md:flex`, `custom-café`) survive; `Custom-a`, `CUSTOM-b`, `-custom-f`, `md:custom-g`, `!custom-h` and `xcustom-i` are dropped [verified 2026-10-16 · live-k01 to live-k21]. Author `custom-` anyway [observed · sanitizer-04, corpus-36]; case after the prefix is kept [observed · gapfill05-03]. itch's `text-center`, `text-justify`, `text-right` and `spoiler` survive, `text-left` doesn't, and `<code>` keeps `language-css` [observed · sanitizer-03, sanitizer-09; verified 2026-10-16 · live-k22 to live-k25, live-k34, live-t03]. A hand-written `<span class="spoiler" tabindex="0">` keeps its `tabindex` in descriptions and bios; it is hidden on a project page but not in a bio, which lacks `.user_formatted` [verified 2026-10-16 · live-k34].
- **Stripped:** `id`, `data-*`, `aria-*` (incl. `aria-hidden`), `role`, `on*`, `tabindex` (except on `.spoiler`), `popover*`: none in 35,801 authored tags [observed · sanitizer-05, sanitizer-09, repo-28, gapfill05-06]. On a project description these, plus `hidden`, `inert`, `accesskey`, `contenteditable`, `draggable` and `translate`, are dropped [verified 2026-10-16 · live-a01 to live-a07, live-a11 to live-a20]. Your own `rel` is lost [verified 2026-10-16 · live-l01, live-l02, live-l13].
- **Kept:** `title`, `lang`, `dir`, `a[name]`, `a[target]` [observed · sanitizer-05, sanitizer-10; verified 2026-10-16 · live-a08 to live-a10, live-a21, live-l01, live-l10]. `img` keeps `src alt title width height style class` and gets `loading="lazy"` (an authored `eager` is overwritten), never `alt`: write it; `srcset sizes decoding fetchpriority crossorigin referrerpolicy` are dropped [verified · sanitizer-11, community-20; verified 2026-10-16 · live-g01 to live-g04].
- Off-site links get `rel="nofollow noopener" referrerpolicy="origin"`, itch.io links none; hooks `a[href][rel~=nofollow]`, `a[href]:not([rel])` [verified · sanitizer-07; observed · N5; verified 2026-10-16 · live-l01, live-l02, live-l12]. `href="#x"` is deleted, and so are relative, `javascript:`, `tel:`, `data:`, upper-case-scheme and leading-space hrefs; `mailto:` stays [verified 2026-10-16 · live-l03 to live-l09, live-l11]. Use absolute lowercase `https://` URLs; anchors are `<a name="faq"></a>` plus the full page URL with `#faq` [observed · sanitizer-06].

**Tags**
- Seen surviving: `a abbr blockquote br cite code dd del details div dl dt em figcaption figure font h1–h6 hr iframe img kbd li mark ol p pre q rp rt ruby s small span strong sub summary sup table tbody td tr u ul` [observed · sanitizer-13; verified 2026-10-16 · live-t01 to live-t10, live-t17].
- Escaped as visible text on a project description: `svg math audio source picture canvas progress meter button`, forms (`form label input select option textarea`), `section article nav header footer main aside`, `style script link meta object embed dialog template slot`, `marquee center ins bdi bdo data caption colgroup col`, `<!-- -->` and a self-closed `<span/>` [verified 2026-10-16 · live-t02, live-t04, live-t10 to live-t22, live-a13, live-e04]. Expect literal visible text, not removal [observed · sanitizer-15, sanitizer-44]. `video` survives with `controls` (class and size dropped; `src` untested) and `wbr` survives [verified 2026-10-16 · live-t14, live-t11].
- `details summary figure figcaption del ruby font` keep no attributes (0/771): class a wrapping `<div class="custom-…">` [observed · gapfill05-05; verified 2026-10-16 · live-t02, live-t08 to live-t10]. `details[open]` and `details[name]` are scrubbed [community · sanitizer-27; verified 2026-10-16 · live-t08]; `<font color>` can't colour [observed · sanitizer-37; verified 2026-10-16 · live-t10]; `<b>`/`<i>` become `<strong>`/`<em>` on re-save [observed · N10], though a save in HTML mode keeps them [verified 2026-10-16 · live-t01].

**Inline `style`**
- 27 properties in the library [library model · sanitizer-21], 21 seen live, none outside [observed · gapfill05-09]: `margin(-*)`, `padding(-*)`, `font-size`, `text-align`, `color`, `background(-color/-image)`, `opacity`, `border(-width/-color/-style)`, `width`, `height`, `min-/max-width/height`. `display`, `position`, `font-weight`, `border-radius`, `transform` are dropped [verified 2026-10-16 · live-s05, live-s09, live-s10, live-s13 to live-s15]. On a project description every property tested matched the library, including `opacity`, quoted `background-image:url('https://…')`, `border-width/-color/-style`, `min-width` and `padding-top` [verified 2026-10-16 · live-s01 to live-s30].
- Sizes (`width`, `height`, min/max, `padding`) need an integer + unit or integer `%` [inferred · sanitizer-23]. The whole attribute dies on `!important`, `;;`, comments, `rgb(1 2 3 / 50%)`, unquoted `url(https://…)`, `50.5%`, trailing whitespace or CR [inferred · sanitizer-22], and on a line break inside the value [verified 2026-10-16 · live-s31]; `!important`, the slash `rgb()`, `50.5%`, trailing whitespace and comments are confirmed [verified 2026-10-16 · live-s02, live-s07, live-s16, live-s17, live-s22]. `--i:3` is removed: index with `:nth-child()` in the CSS field [library model · sanitizer-23, gapfill05-07; verified 2026-10-16 · live-s11, live-s12]. Safe: `style="color: #ffc857; font-size: 120%"`; it is re-serialised, so never select `[style*=…]` [verified · community-18].

**Images and embeds**
- No `data:` images: on a project description the whole `<img>` is removed. Relative `src` is dropped; `http://` and protocol-relative `src` stay; `src` isn't proxied [observed · sanitizer-12; verified 2026-10-16 · live-g05, live-g06, live-g09, live-g10]. An unquoted `width=40%` turns the whole tag into visible text, and the bare URL inside it is auto-linked [verified 2026-10-16 · live-g07].
- Project descriptions turn non-itch iframes into a click-to-activate `button.embed_preload` (`.youtube_preload` for YouTube, `.other_embed` for every other host tested: youtube-nocookie, Vimeo, CodePen, GitHub Pages, example.com, `http://` and protocol-relative URLs), keeping the cleaned iframe in `data-embed_code` [verified · sanitizer-24; verified 2026-10-16 · live-i01 to live-i07, live-i10]; devlog and jam iframes stay live [observed · sanitizer-25, gapfill05-08; verified 2026-10-16 on a devlog post · live-i01 to live-i10], and so do bio iframes, with the same attributes dropped [verified 2026-10-16 · live-i01, live-i04]. Stored iframes keep only `src width height frameborder allowfullscreen scrolling style` [observed · gapfill05-08]; `srcdoc` and a `data:` `src` are dropped [verified 2026-10-16 · live-i01, live-i08, live-i09].
- Resize (never hide) placeholders with `!important`: `#wrapper .formatted_description .embed_preload{width:100%!important;height:auto!important;aspect-ratio:16/9}` [inferred · sanitizer-24].

**Parser gotchas**
- Edit in HTML mode (`<>`); the visual editor rewrites markup [documented · docs-35]. Keep each tag on one line (a line break inside a tag escapes it), close non-void tags (`<span/>` is escaped), write no `<!-- -->` (escaped as text) and quote values that hold `%` [verified 2026-10-16 · live-e04, live-e06, live-t12, live-g07]; double quotes are safest [library model · sanitizer-16, sanitizer-17, sanitizer-18, sanitizer-20].
- Write `&lt;` and `&amp;`: a raw `< div` appends a stray `</div>` that closes itch's container, and a raw `<` before an allowed tag name swallows text (`a < b and c > d` is stored as `a < b > d`) [verified 2026-10-16 · live-e07, live-e08]; `&copy2026` renders `©2026` [verified · sanitizer-38]. Blank lines become `<p><br></p>` (not `:empty`): delete them [observed · N9]. Bio HTML cap: **5,000 characters of the HTML you submit** (ASCII tested): 5,001 is refused with an error on the edit page, "data: profile: expected text between 1 and 5000 characters, or empty"; what itch adds later doesn't count (a 4,990-character bio with 10 links saved and was served at 5,470) [verified 2026-10-16 · live-cap-D1, live-cap-D2]. The served size can be larger or smaller than the submitted one [verified 2026-10-16 · live-html].

**Patterns:** per-letter headings `<h1 class="custom-title"><span>N</span>…</h1>` + `:nth-child` (accessibility: §10) [verified · repo-26]; marker swaps (§7) [verified in Chrome · N13]; toggles with `details`/`summary` in a classed `div`; tabs with `#wrapper a[name]:target + .custom-panel{display:block}` [verified · s07-n3].

Full detail: [sections/05-html-in-descriptions.md](sections/05-html-in-descriptions.md)

## 6. Cascade and specificity

**Where you sit.** Last on profiles and projects, so ties go to you. On jams, inside `style#jam_theme` after the generated rules [verified · crawlprofile-22, crawlproject-36, docs-18]. With imports, the order is: base < theme < [nested imports < import 1 < import 2 < pasted rules] < runtime grid sizer [verified · localtests-01, localtests-03].

| Opponent | Beat it with |
|---|---|
| Base and theme rules (no IDs on page content) | any `#wrapper …` [verified · itchcss-03, crawlprofile-23, crawlproject-36] |
| Theme or base `!important` (inventory in §4) | `#wrapper … !important`, or style the parent [verified · docs-17, crawljam-07, crawlprofile-53] |
| Inline `style=""` (`.game_thumb`, `.game_frame`) | `!important` only; inline beats even `#wrapper#wrapper` [verified · crawlprofile-12, localtests-04] |
| Runtime `style[itchio-grid-sizer]` after you: profile (0,2,0), jam `#<generated id>` (1,0,0) | `#wrapper` plus a class [inferred · community-47; verified locally · s06-run S2–S6] |
| A framework's layered `!important` | `!important` in an earlier-declared layer (below) [verified · gapfill06-03] |

```css
#wrapper .game_title a{color:#ffc857}
#wrapper .game_cell .game_text{color:#c9d1e6!important} /* jam */
#wrapper .game_thumb{background-color:transparent!important}
#wrapper .collection_row h2{color:#ffc857} /* its a inherits */
#wrapper .game_frame:not(.maximized){width:100%!important;height:auto!important;aspect-ratio:16/9}
```

The `.game_frame` line beats the inline size and leaves itch's maximized mode alone; use your game's own ratio [verified · crawlproject-17]. How the iframe and `#inner_column` follow the resized box with itch's JS running was never rendered (§11) [unverified].

**Specificity tools**
- Nesting `#wrapper{.x{}}` keeps (1,1,0) [verified · support-15], but browsers without nesting (Chrome < 112, Firefox < 117, Safari < 16.5) drop it: keep essential rules flat [observed · crawlprofile-57]. `#wrapper#wrapper .x` beats a later (1,2,0) [verified · localtests-05]. `:where(#wrapper) .x`, `@scope (#wrapper){.x{}}` and top-level `& .x{}` lose the ID weight [verified · localtests-05, localtests-45].
- Imported rules lose ties to pasted ones (they still beat the theme): add weight inside the imported sheet, e.g. `#wrapper h1.custom-title` [verified · localtests-01, repo-13]. An imported `!important` beats more specific pasted normal rules [verified · localtests-04].

**`@layer`** (R15)
- A layered `!important` beats an unlayered one [verified · support-37, external-49]. Tailwind v4 (§8 prefers v3.4): use its `important` option or an unlayered `#wrapper` build [verified · localtests-16]. To beat a layered `!important`, declare your layer first: `@layer custom-override, utilities; @import url(…) layer(utilities); @layer custom-override{…!important}` [verified · gapfill06-03].
- Layer only what should lose, e.g. `@import url(…/animate.min.css) layer(fw);` keeps itch's `bounce` [verified · gapfill06-01]. Layers never scope [verified · gapfill06-02].

**Custom properties** follow the nearest declaring ancestor, not specificity (where to declare: §4) [verified · localtests-06, s06-heads]. `.button:focus` uses a literal colour, and an ID-scoped `:focus-visible` rule recolours every ring [verified · a11y-53, a11y-58].

**Runtime styles, globals, URLs**
- itch's JS sets inline `background-image` on `.gif_overlay` (hover) and `width`/`max-width` on `#inner_column` (embeds > 920 px): override with `!important` [documented (itch JS) · s06-js].
- `@keyframes` and `@property` are global; the later one wins (R16). An `@property` with a non-`*` syntax and no `initial-value` is invalid, so the property stays unregistered and animates discretely [verified · s06-run]. `animation` is a list, so a second rule replaces it: animate a registered, inherited property on the parent instead [verified · repo-45].
- A relative `url()` resolves against the itch page when pasted, the sheet when imported, and where `var()` is used inside an unregistered variable [verified · s06-run].
- Column-layout profiles > 800 px: sticky columns trap layers inside the bio under `#user_tools`; `#wrapper::before/::after` escape unless `#wrapper` is isolated [verified · itchcss-56].

Full detail: [sections/06-cascade-and-specificity.md](sections/06-cascade-and-specificity.md)

## 7. JS-free techniques and browser support

Only Chromium was run; Firefox/Safari data is MDN BCD [verified · gapfill07-07]. Re-checked 2026-10-29: Chrome 156.0.8078.49 has `random()` and re-rolls it on every load; the support probe changed only its 9 `random()` rows from Chrome 155 [verified 2026-10-29 · support-62]. Firefox 159 shipped scroll-driven animations on 2026-10-27; `random()` covers about 56 % of global users, scroll-driven animations 88 % [documented · support-63]. Re-checked 2026-11-15: `text-wrap:balance` passed its *Widely* date (2026-11-13) but `web-features` and MDN still label it Newly, with browser support unchanged [documented 2026-11-15 · support-64]. Safari + iOS Safari ≈ 17.9 % of global usage (caniuse, 2026-10-13) [documented · support-02]. On a project page, itch stores `@layer`, `@property`, `@container` (size and style), `@scope`, nesting, `@starting-style`, `@view-transition`, `@counter-style`, `@function`, range media and `sibling-index()` intact, and Chromium 155 applied them all; `random()` was stored but not applied [verified 2026-10-16 · live-c11 to live-c21, live-c28 to live-c30, live-c36].

**Fallbacks** (Chrome 155)
- Plain value first, modern value second, in one rule: only the unsupported one drops [verified · s07-n1 T3]. Never fall back through a custom property: `--r:random(…);width:28px;width:var(--r)` computes `auto` [verified · s07-n1 T4].
- `@supports (--x: …)` detects nothing; test a real property, e.g. `@supports (rotate: random(0deg, 1deg))`, with the specificity of the rule it overrides [verified · s07-n1 T5–T7, s07-n2 T24].
- Give new pseudo-elements (`::scroll-marker`, `::scroll-button()`, `::details-content`) their own rule [verified · s07-n1 T1]. Scope modern selectors under `#wrapper`, not `body:has()` [observed · crawlproject-71].

**Motion** (always with B1, R17)
- Finite wave: keyframes without `from`/`to`, `animation:custom-wave 1.6s ease-in-out calc(var(--i)*.1s) 2`, `--i` set per `:nth-child` [verified · gapfill07-04]. `translate` on letter spans needs `display:inline-block` [verified · s07-n2 T29], which changes the accessible name (§10).
- Entrances animate from hidden: `@keyframes custom-in{from{opacity:0;translate:0 18px}}` [verified · a11y-24]. `@starting-style` works on first render [verified · support-54]. Stagger: `animation-delay:.2s;animation-delay:calc(sibling-index()*60ms)` [verified · s07-n1 T13].
- Scroll-driven: `animation-timeline` after the `animation` shorthand, inside `@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){…}}` [verified · s07-n1 T15]. `@view-transition{navigation:auto}` at top level on both pages (profile ⇄ own projects) [verified · support-21].
- Never loop `font-weight`: ~0.9 s of layout per second, 21/18 fps vs 75 without it at 4× CPU throttling; `transform`/`opacity` stay cheap [verified · gapfill07-06].

**Content tricks**
- Mute decorative generated text with `content:"★";content:"★" / ""` (R21). `content:var(--x)` needs a quoted string [verified · localtests-25]; escape non-ASCII if your toolchain may mangle it: `"\a1 Hola!"` [verified · repo-16].
- **Marker swap** keeping the real text for screen readers: `display:inline-grid;grid-template-columns:auto 0;color:transparent`, new text in `::before`. Not `visibility:hidden` (drops the text from the accessibility tree); clip with `overflow-y:clip`, never `clip-path` (still scrolls) [verified · repo-41; observed · s07-n12].
- `light-dark()` returns the light value unless `color-scheme` is set; itch sets none [verified · s07-n2 T27; observed · s07-n11]. SVG data URIs: `#` → `%23` or nothing paints [verified · localtests-44, repo-17].

**Layout**
- Full-page decorative layer: B4. `backdrop-filter`: `-webkit-backdrop-filter` (Safari 9–17) first, then unprefixed, literal values, no `var()` [documented · support-31; Chromium rejects the prefix: verified · support-31].
- **Game grids.** itch's JS writes px tracks and `--itchio_grid_gap` after your CSS, so `#wrapper{--itchio_grid_gap:…}` does nothing and a gap alone overflows. Set columns and gap together at ID strength, keeping `.mode_grid` on profiles (unguarded, it breaks Column-layout profiles). The jam sizer is `#game_grid_N` (1,0,0), so `#wrapper` plus a class wins [verified · gapfill07-01, gapfill07-02, gapfill07-03]:

```css
#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));column-gap:40px}
#wrapper .browse_game_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));column-gap:40px} /* jam #entries */
```

Profiles keep ≥ 2 columns down to 320 px; for one column on phones add `@media (max-width:500px){#wrapper .mode_grid .user_game_grid{grid-template-columns:1fr}}`. Jams drop to 1 column at 320 px by themselves [verified · gapfill07-01, gapfill07-03].

**Per-visit randomness**
- Native: `#wrapper .game_cell{rotate:0deg}@supports (rotate: random(0deg, 1deg)){#wrapper .game_cell{rotate:random(-2deg, 2deg)}}`. Chrome/Edge 156+ and Safari 26.2+ support it, Firefox doesn't yet [verified · s07-n1 T5, T6, T22, support-03; verified 2026-10-29 · support-62].
- Otherwise use an external per-visit stylesheet (§8). It is render-blocking (a 2.5 s import pushed FCP to 2.53 s) and can be blocked [verified · s07-n9; observed · community-36].

Full detail: [sections/07-techniques-and-support.md](sections/07-techniques-and-support.md)

## 8. External CSS: fonts, frameworks, dynamic services

**Placement** (R9): any valid rule before an `@import` (even `@font-face`, `@keyframes` or an empty `@media{}`) drops it without a console warning [verified · localtests-09, localtests-50, itchcss-08]. An `@layer x;` *between* imports lets the next sheet load but never apply [verified · localtests-10]. `@import` inside `@media{}`/`@supports{}` is invalid; a non-matching media query still downloads and blocks [verified · localtests-11]. Jams: `@font-face` with an absolute `https://` `src` [verified · crawljam-02, itchcss-07]. Only the `@import` line counts toward the cap [verified · external-01, repo-09].

**No host: `data:` imports.** On a project, `@import url("data:text/css,…")` applies, with `layer()`, `supports()` and media too [verified 2026-10-16 · live-c05 to live-c08]. It splits a sheet without a server but saves no characters [inferred].

**Host requirements** (R10)
- `Content-Type: text/css` (`text/plain` is ignored silently) and a 2xx status [verified · external-04, external-06]. CORS (ACAO) is needed for fonts and `mask-image` files (the cases tested), even with `@font-face` on the font's host, and not for the sheet itself or `background-image` [verified · external-16, localtests-40, localtests-19].
- `raw.githubusercontent.com` and gist raw (`text/plain` + `nosniff`) fail. Use `https://cdn.jsdelivr.net/gh/USER/REPO@1.2.3/file.css`, npm, unpkg, cdnjs or GitHub Pages [verified · external-05, community-12]. jsDelivr caches a tag or full SHA for a year; `@main`, short SHAs or no ref up to 12 h (CDN) and 7 days (browser). Release = new tag + new `@import` URL [verified · community-12, external-45].

**Performance and failure**
- Every import blocks first paint and end-of-body scripts; nested imports run serially (+803 ms). Aim for one Google Fonts URL plus one flat sheet [verified · external-07, external-09, g08-18].
- A host that accepted the connection but never answered kept Chrome and Firefox blank for over 330 s; a dropped SYN cost 21 s; NXDOMAIN fails in ms [verified · g08-17]. A failed or blocked import drops only that sheet [verified · external-06, localtests-12]; Brave Shields blocked a Vercel-hosted sheet, cause unknown [observed 2026-10-12 · repo-14].
- Cross-origin `cssRules` throws even with ACAO `*`: read `getComputedStyle()` [verified · localtests-13, external-15].

**Fonts**
- Google Fonts: copy the exact URL, keep `&display=swap`; wrong case, an unknown family or an axis past the real range (`Syne:wght@100..900`) returns HTTP 400 (`text/html`), so the whole import is dropped silently and the fallback font shows [verified · external-38, external-39]. Fontsource `npm/@fontsource-variable/syne@5.2.6/index.css` is family `'Syne Variable'`; the static package's `index.css` is 400 only [verified · x08-05].
- Google sees every visitor's IP, a GDPR risk in the EU [community · external-43]: self-host with ACAO or use Bunny Fonts (its css2 `wght` range returns static weights) [verified · x08-05].
- Apply the family where the theme writes the font (§4), not through `--itchio_font_family`. Jams take `@font-face` with one HTTPS file per weight; the Fontsource file below serves `font/woff2` with ACAO `*`, while Google's `fonts.gstatic.com/s/<font>/v<N>/…` files aren't documented as stable [verified · x08-05, crawljam-02; unverified for gstatic]:

```css
/* profile or project only; the import is the sheet's first line */
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");
#wrapper .user_page{font-family:"Syne",sans-serif} /* project: #wrapper .inner_column */
/* jam only (no @import there) */
@font-face{font-family:"Syne";src:url("https://cdn.jsdelivr.net/npm/@fontsource/syne@5.2.6/files/syne-latin-400-normal.woff2") format("woff2");font-display:swap}
#wrapper{font-family:"Syne",sans-serif}
```

**Dynamic (per-visit) services**
- Send `Content-Type: text/css; charset=utf-8` and `Cache-Control: no-store` [verified · external-17]. On Vercel set `export const config = { maxDuration: 5 };` (Hobby default and max: 300 s) [documented · g08-19]. Answer from memory [inferred · g08-17]; one endpoint on the production domain, not per-deploy URLs [verified · repo-12]. TTFB 0.18–0.35 s warm, 0.79–1.0 s cold [verified · external-18]; pin the region (default `iad1`) [documented · external-19].
- An `@import` sends the full itch page URL as Referer: never set cookies (a `SameSite=None` one tracked across sites) or log visitors [verified · external-32, external-47]; escape echoed data (§2 P9). Vercel Hobby: 1 M invocations/month ≈ 33 k views/day, non-commercial only, which may exclude pages selling games [documented · external-22; inferred · x08-08].
- The pasted CSS carries the full look; the service only adds extras, and its rules lose ties to the pasted ones, so give overriding rules more weight (`#wrapper#wrapper …`, an extra class). Register any `@property` it animates in the service itself. Handler sketch: 08 §10.1 [verified · localtests-01, localtests-21, repo-13; observed · repo-14].

**Frameworks.** Never import Bootstrap, Tailwind or Animate.css as-is: resets restyle itch's UI, `layer()` doesn't scope, and nesting in `#wrapper{}` drops `@keyframes` [verified · x08-03]. Their class names don't survive the sanitizer unless renamed to `custom-*` [observed · evidence/sanitizer.md §1].
- **Bootstrap:** `postcss-rename({prefix:'custom-'})` + `postcss-prefix-selector({prefix:'#wrapper .custom-bs'})`, with the bio inside `<div class="custom-bs">`. Plain `#wrapper` prefixing restyled 81 of 81 itch elements on a profile [verified · g08-10, g08-12, g08-13].
- **Tailwind v3.4** via PostCSS: `content:['./bio.html']` (it emits only classes found there), `prefix:'custom-'`, Preflight off, keep `@tailwind base` (its `--tw-*` defaults make transforms and filters work), then `postcss-prefix-selector` with `#wrapper` (safe only because Preflight is off). Not the `important:'#wrapper'` build, not v4 [verified · g08-01, g08-02, g08-03, g08-05]. A small bio's build is ~7 KB minified, over the profile cap: host it on a tagged URL and `@import` it; on jams paste it [verified · g08-03; inferred for the hosting].
  - In HTML, tokens that start with `custom` survive whatever follows, so arbitrary values, fractions and opacity modifiers work (`custom-w-[37px]`, `custom-w-1/2`, `custom-bg-red-500/50`); v3's variant, important and negative forms start with something else (`md:custom-flex`, `hover:custom-…`, `!custom-…`, `-custom-mt-4`) and are stripped [verified 2026-10-16 · live-k09 to live-k12, live-k16 to live-k18]. v4's `prefix(custom)` form (`custom:md:flex`) survives too [verified 2026-10-16 · live-k14, live-k15], but v4's layers are why this guide uses v3.4. Write breakpoints and hover states as your own `#wrapper` rules [inferred · g08-04]. For a handful of utilities, hand-written `#wrapper .custom-flex{display:flex}` rules are cheaper [inferred].
- **Animate.css:** import it with `layer(fw)` (or its `bounce` replaces itch's), use its keyframe names in `#wrapper .custom-*` rules and add B1. Better: copy one keyframe in as `custom-*` [verified · x08-02, x08-03].

Full detail: [sections/08-external-css.md](sections/08-external-css.md)

## 9. Gotchas (symptom → cause → fix)

| Symptom | Cause → fix |
|---|---|
| The background image vanished, leaving a flat colour | `background` shorthand on `#wrapper` → longhands, B3 [verified · itchcss-20, localtests-18] |
| Links ignore a new `--itchio_link_color` | Literal theme colours on profiles and projects → explicit selectors (§4) [verified · itchcss-13, repo-21] |
| A rule does nothing, with no error | Unknown selector in the list, `//` comment, stray brace, `calc()` spacing (§1); a bad `var()` → `unset` [verified · localtests-32, localtests-42, support-06] |
| A fixed decoration never shows | No stacking context, so it paints behind `#wrapper`'s background → B4 [verified · localtests-39, repo-46] |
| A decoration covers the Follow button | `#wrapper` is not isolated → B4, `pointer-events:none`, keep the top right clear [verified · itchcss-29, crawlprofile-60] |
| Fixed layers scroll with the page | `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change:transform` or `contain` on `#wrapper`, `.user_page` or `#inner_column` → move the effect to a pseudo-element; HTML5 games: R22 [verified · localtests-37] |
| Horizontal scroll on mobile; sticky stops working | Oversized or rotated content, or `overflow-x:hidden` → `#wrapper{overflow-x:clip}`; `clip-path` doesn't remove scroll overflow [verified · localtests-27, localtests-29] |
| Cards have uneven heights | itch's `align-items:start` → `#wrapper .game_grid_widget{align-items:stretch;grid-auto-rows:1fr}` [verified · repo-32, repo-33] |
| Footer `margin-top` ignored | Absolute footer → give the last block a `margin-bottom`, or pad `#wrapper` [verified · crawlprofile-09, repo-24] |
| An animation stops, or the wrong one runs | A second `animation` replaced the list; `!important` froze it; a keyframe name clashed with itch's (`spin`) [verified · repo-45, localtests-24, itchcss-28] |
| Over the cap after minifying | Use `esbuild --minify --charset=utf8`, not csso (deletes nesting and range media queries) or lightningcss without targets (drops fallbacks) [verified · gapfill09-05, gapfill09-15, gapfill09-11, gapfill09-12, gapfill09-06]; the CLI flags are [inferred] from the API options tested |
| A saved change doesn't show | Owner-only preview or a cached page → logged-out window, `X-Cache-Status` [documented · community-05; verified · crawlprofile-46] |
| Agent tools list hidden text or miss `::before` | `read_page`/`find` read DOM text → CDP accessibility tree (§10) [verified · localtests-34] |

Full detail: [sections/09-gotchas.md](sections/09-gotchas.md)

## 10. Testing and accessibility

"Live render" = a real page with itch's JS running. Real screen-reader speech and Firefox/Safari layout are untested [verified · s10-30].

**Ship gate** (itch asks for assistive tech, small viewports, logged out [documented · docs-15])
- Review logged out: owners get an extra `h1`, editor wrappers, `.is_owner` [observed · crawlprofile-43, a11y-21]. Never select `#wrapper`'s ancestors or siblings (`body.has_header …`) [observed · repo-37]; avoid `100vw` [community · community-30]. Confirm what is served: `curl https://<user>.itch.io/` (GET, no `-L`), read `style#custom_css` [verified · crawlprofile-58].
- Widths: 320 and 375 px [verified · a11y-31]; profile 800/650/600, project 1000/650/600/400 [verified · s10-01]; jam 820/650/600 and ~800 (`.jam_body` margin is 0 at 651–960 px, cutting radius and glow) [verified · crawljam-47; verified (live render) · s10-24]. Resize instead of switching UA, except that a wide HTML5 embed pins `#inner_column` under a desktop UA [verified · crawlproject-50; verified (live render) · s10-23]. Headless `--window-size` < 500 gives 500: use `Emulation.setDeviceMetricsOverride` [verified · s10-13].
- A script-free harness freezes the grid sizer, `#wrapper` min-height, `#user_tools`, lazy covers and the embed pin: judge layout on a live render (10 §14.7) [verified (live render) · s10-17 to s10-24].

**Motion:** only B1 stopped all six test animations [verified · repo-50, s10-02]; itch has no reduced-motion rules [verified · itchcss-26]. Nothing may be hover-only [inferred · s10-03].

**Focus** (B2): itch colours rings `#361275` through `--itchio_input_focus_color`, hard-codes it on `.button:focus` and sets `outline:0` on spoilers and disabled buttons [verified · a11y-15, itchcss-55, s10-16]. The variable alone fixes links only; `#wrapper :focus{outline-color}` keeps a thin ring that itch's `overflow` cuts; `:focus-within` card rings fire on clicks and get cut in carousels [verified · s04-gf-01, s04-gf-02, s10-04, s10-16]. CSS can't reach `#user_tools` or the site header [verified · itchcss-25].

**Contrast and forced colours**
- Measure on the background image's brightest region, alpha composited: `#eef3ff` is 16.26:1 on BG `#0b1433` but 4.58:1 on the image's brightest 64 px block `#386fb7`, `#ffc857` 3.31:1 there [verified · s10-06]. Make cards semi-transparent, never text [inferred · s10-06].
- Forced colours drop shadows and gradients but show `color:transparent` text and transparent borders: give cards `border:1px solid transparent`; drop text overlays in `@media (forced-colors:active)` [verified · s10-05, a11y-28].

**Headings and names** (R20)

| Page | itch's h1 | Do |
|---|---|---|
| Profile | `.text_header > h1`, hidden on `.has_banner` (banner img has no alt) | Banner: one bio `<h1 class="custom-…">` [inferred · crawlprofile-05, sanitizer-40; verified (live render) · s10-25]. No banner: keep itch's, or hide it with `#wrapper .text_header>h1{display:none}` only when a bio `h1` replaces it [verified · repo-25, a11y-04] |
| Project | `h1.game_title`, hidden with a banner or HTML5 embed | `<h1 class="custom-…">` in the description; `/devlog` and `/comments` keep a visible `h1.game_title` on bannerless projects [verified · itchcss-54, crawlproject-10, gapfill03-03] |
| Devlog post | Visible `.post_header h1` | Keep it, add none [verified · itchcss-54] |
| Jam | `h1.jam_title_header` (+ site logo h1) | Keep it; style `.jam_content h1`, never `#wrapper h1` [observed · crawljam-46] |

- Keep `<img>` with alt, never swap images for CSS backgrounds [verified · crawlproject-67]. ARIA is stripped, so use semantic HTML: `h1`–`h6`, `img[alt]`, `span[lang]`, `abbr`, `details` [inferred · sanitizer-40].
- Accessibility tree: `display:none`, `visibility:hidden` out; `opacity:0`, `color:transparent`, sr-only, `font-size:0` in; `::before` text in unless its alt is `/ ""` [verified · a11y-03, a11y-57]. Chrome, Firefox 142, WebKit 26 and Chrome's UIA tree agree where checked [verified · s10-27, s10-28].
- `inline-block` letter spans rename a heading "M i r o": animate whole words, or pair an sr-only word with letters drawn as `content:"M" / ""`; keep punctuation inside the span [verified · repo-59, s10-14, s10-27].
- `read_page`/`find` include hidden text and ignore `::before`: use CDP `Accessibility.getPartialAXTree` or DevTools [verified · localtests-34, a11y-50].

**Other:** `nowrap` text with a `rem` minimum scrolls at a 32 px default font: `font-size:min(10vw,6rem)`; no fixed height + `overflow:hidden` on text [verified (script-free harness) · a11y-31, a11y-45]. Projects ≤ 650 px have a 50 px fixed bottom bar [verified · s10-15]. The page must work with the `@import` deleted [observed · repo-54]. iOS ignores `background-attachment:fixed`; Safari lacks `forced-color-adjust` [documented · s10-12].

**Starter templates** (10 §15, [evidence/gapfill-s10-tools/templates/](evidence/gapfill-s10-tools/templates/)): `profile.min.css` 1,643 chars, `project.min.css` 1,483 (also devlog and comments), `jam.min.css` 1,450. Live renders passed reduced motion, forced colours, keyboard rings and 320 px reflow [verified (live render) · s10-25, s10-26]. They predate B2 (their card outline can be cut in profile carousels [verified · s04-gf-02]) and were never saved through itch (§11).

Full detail: [sections/10-testing-and-a11y.md](sections/10-testing-and-a11y.md)

## 11. Open questions and live probes

The research never logged in. The [probe kit](probes/README.md) settles 115 open questions on the owner's **draft** project plus two short profile runs; [`check.js`](probes/check.js) reports what itch stored, [`results-template.md`](probes/results-template.md) records a run. Retag facts only after a direct check. Runs 1 (draft project), 2 (profile), 3 (devlog post only) and 4 (size caps) were done on 2026-10-16: [project](evidence/live-probes/results-2026-10-16-project.md), [profile](evidence/live-probes/results-2026-10-16-profile.md), [devlog](evidence/live-probes/results-2026-10-16-devlog.md), [caps](evidence/live-probes/results-2026-10-16-caps.md).

| # | Unknown (affects) | How to settle |
|---|---|---|
| 1 | Jam cap (20,410 known, 20,480?) and its unit; the bio cap's unit for non-ASCII text. Settled on 2026-10-16: profile 5,120 bytes, refused not truncated, comments count, edge whitespace doesn't; project no CSS cap; bio 5,000 characters of submitted HTML (R7) | [probes/probe-cap.md](probes/probe-cap.md), part C (account) |
| 2 | The sanitizer on jam descriptions, and the bio probes outside the 33-probe bio set. Settled on 2026-10-16 for project descriptions (escape vs strip, attributes, the inline-style list, the `custom` prefix, class tokens with `/`, `[ ]` or `:`), for bios and for devlog posts (same results; their iframes stay live) (§5, §8) | [probe-description.html](probes/probe-description.html), [probe-bio.html](probes/probe-bio.html) (account) |
| 3 | `</style>` deletion and leading-whitespace trimming on jams. Settled for projects and profiles on 2026-10-16: both happen (R8, §1) | [probes/probe.css](probes/probe.css), Run 3 (account) |
| 4 | Do the starter templates survive saving byte for byte? (§10) | Paste, `curl` logged out, diff `style#custom_css` (account) |
| 5 | What real screen readers say for letter-split headings, alt-silenced generated text, transparent markers, spoilers (§7, §10) | NVDA Speech Viewer on [sr-probe.html](evidence/gapfill-s10-tools/sr-probe.html), [s10-letters.html](evidence/s10-tools/s10-letters.html) |
| 6 | B2, `:has()` card rings, inset offsets and maximized frames in Firefox, Safari, iOS | Pages from `evidence/gapfill-s04-tools/build_pages.py` |
| 7 | Which phones fall back from the Fullscreen API to itch's maximized mode (R22 scope) | Tap "Run game", check `body.frame_maximized` |
| 8 | `perspective`, `contain`, `content-visibility`, individual transforms on embed ancestors (R22) | Variants in `evidence/gapfill-s04-tools/maximize_r.mjs` |
| 9 | B2 on logged-in-only controls (comment textarea, owner bars) | Logged-in visitor, devtools override, no posting (account) |
| 10 | Why Brave Shields blocked a vercel.app import (R10) | Brave defaults against several hosts |
| 11 | `random()` in Chrome 156, scroll-driven animations in Firefox 159 (§7). Settled on 2026-10-29: Chrome 156 runs `random()` (support-62); Firefox 159 shipped scroll timelines, documented only (support-63). Still open: a live itch page re-rolling per load, and a Firefox run | A guarded `random()` rule on a scratch itch page, reloaded twice; the probes in Firefox 159 |
| 12 | Does `#wrapper .game_frame:not(.maximized){width:100%!important;height:auto!important;aspect-ratio:…}` render well with itch's JS: auto-load, click-to-launch and fullscreen-start frames, and embeds wider than 920 px whose `#inner_column` width the JS pins (§6) | Live render of an HTML5 page with the rule injected, as in `evidence/gapfill-s04-tools/maximize.mjs`, at 1280/1000/600 px |

## Appendix: Evidence index

| Fact-id prefix | Evidence | Covers |
|---|---|---|
| `docs-` | [evidence/docs.md](evidence/docs.md) | The official CSS guide, policies, staff posts |
| `community-` | [evidence/community.md](evidence/community.md) | Forums, creator repos, blogs |
| `repo-` | [evidence/repo.md](evidence/repo.md) | A private, hand-maintained profile-CSS workspace |
| `corpus-` | [evidence/corpus.md](evidence/corpus.md), [corpus-stats.csv](evidence/corpus-stats.csv) | Custom CSS as served on 62 live pages |
| `crawlprofile-`, `crawlproject-`, `crawljam-` | [crawlprofile.md](evidence/crawlprofile.md), [crawlproject.md](evidence/crawlproject.md), [crawljam.md](evidence/crawljam.md) | Logged-out live DOM per page type |
| `itchcss-` | [evidence/itchcss.md](evidence/itchcss.md) | itch's bundles and theme blocks |
| `sanitizer-` | [evidence/sanitizer.md](evidence/sanitizer.md) | The description HTML sanitizer |
| `localtests-` | [evidence/localtests.md](evidence/localtests.md) | Local browser experiments (pages in `tests/`) |
| `support-` | [evidence/support.md](evidence/support.md), [support-matrix.json](evidence/support-matrix.json) | Browser support |
| `external-` | [evidence/external.md](evidence/external.md) | `@import`, hosts, fonts |
| `a11y-` | [evidence/a11y.md](evidence/a11y.md), `evidence/a11y-tests/` | Accessibility checks |
| `live-` | [evidence/live-probes/](evidence/live-probes/): `results-2026-10-16-project.md`, `-profile.md`, `-devlog.md`, `-caps.md` and their JSON reports | Live probe runs on the owner's account (Run 1: draft project; Run 2: profile, logged in and out; Run 3: devlog post; Run 4: size caps) |
| `gapfill01-`…`gapfill09-` | [evidence/gapfill.md](evidence/gapfill.md), one block per section | Gap-fill passes |
| `s01-n`, `s02-n`, `S03-N`, `s04-`, `s04-gf-`, `N` (05), `s06-`, `s07-n`, `x08-`, `g08-`, `s10-` | "Section notes" of the matching section file; `s04-gf-`, `g08-` and `s10-17`+ also in [gapfill.md](evidence/gapfill.md) | Checks made while writing each section; scripts in `evidence/sectionNN-tools/`, `evidence/sec07-tools/`, `evidence/s10-tools/`, `evidence/gapfill*-tools/` |

**Names in the evidence.** Small creators appear as `creator-NN` and their games as `game-NN`, with devlog links as `devlog/<id>/<post>`: `creator-01`–`creator-37` in `crawlprofile.md`, `creator-38` onward in the other files, one number per creator across them. Named on purpose: itch staff, the owner, well-known studios and tools, and authors cited as sources for itch-CSS guides, themes or tools. The mapping is kept privately, so URL lists in the tool folders can't be re-fetched as published.

**Local test pages** ([tests/index.html](tests/index.html) runs them all): serve `tests/` on two ports (e.g. `python -m http.server 8090` and `8091`) so third-party imports can be emulated. 18 pages (`a-import-cascade.html` … `n-scope-specificity.html`) plus `s06-runtime-styles.html`; each runs standalone too. `tests/_lib/itch-base.css` is a synthetic stand-in, not itch's CSS.

**Known inconsistencies in the section files.** Where a section disagrees with this file, follow this file.
- **Superseded snippets:** B1 replaces the `.01ms` and shorter guards (07 §7.5, 09); B2 replaces the focus snippets in 01 §8, 06 §7, 07 §7.6, 09. 04 §9.5's unconditional `isolation:isolate` and 09 #23's `backdrop-filter` on `#inner_column` need §4's guarded recipes. Grid advice from script-free harnesses (03 §8.7 `#wrapper{--itchio_grid_gap}`, 03 §9's "< 510 px → 1 column", 04 §6/§9.1 gap-only rules, 09 #15's unguarded `#wrapper .user_game_grid`) is superseded by §7's live-render rule [verified · gapfill07-01, gapfill07-02, gapfill07-03]. The starter template `jam.css`/`jam.min.css` (10 §15) colours `#wrapper .view_jam_page h1`, which R20 rules out on jams: give the colour to `.jam_title_header` and `.jam_content h1` instead [observed · crawljam-46]. Its live render (s10-25) checked motion, forced colours, rings and reflow, not headings.
- **Live probe Run 1 (2026-10-16) supersedes the sections** where they say that class tokens with `:`, `/` or `[ ]` are stripped or untested, that `video` and `wbr` are escaped, that `tabindex` never survives, that a line break in `style` is re-serialised, or that `</style>` handling is unknown: follow §1, §5 and §8 of this file.
- **Facts:** "stored exactly as pasted" holds for meaning only, and `</style>` is deleted (§1). The admin's jam "20kb" reply is undated; whether jams briefly had a 5,120 cap in June 2026 is unsettled. Projects have no 5,120 cap as of 2026-10-16 (live-cap-B1). 07 §7.5's "8–21 fps"/"60 fps" should read 21/18 and 75 fps, and §7.17's GPU-time deltas don't match its table. 10 §7 mixes image figures from s10-06 (`#11274d`, `#386fb7`) with the private repo's (`#1b3367`, `#3d6fba`).
- **Read at the weaker level:** 02's S2 index and P3 technique list, 04's background-shorthand and project "literal colours" TL;DR tags, 07 §7.10 (a11y-09, support-45), 08 §2.3 (untested jam hoist), 08 §1.2/§3.2 (`community-13` tagged documented), 08 TL;DR #8 (observed), 09 #44 (esbuild CLI flags inferred).
- **Unreconciled samples:** 03 §5.3 and §6.3–6.5 counts; 05's empty `div.custom-*` (13 vs 32). 05's "four or five iframe hosts" is stale (11 seen). 06 rules 1 and 6 hold for served sheets and for profiles/projects only (jam grid sizer; jam variables work).
