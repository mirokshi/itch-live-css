# Evidence log — dimension `community`

What creators report about itch.io custom CSS (forums, GitHub repos, blogs), cross-checked
against live pages and itch's public static files wherever a cheap, read-only check was possible.

- **Date of all checks:** 2026-10-14
- **Fact ids:** `community-NN` (see the structured output of this run)
- **Confidence vocabulary:** verified / documented / observed / community / inferred / unverified
  (same meaning as in the knowledge-base brief).

## 1. Method

1. **Discovery** with a web search engine (queries listed in §6). Reddit and Stack Overflow
   returned **nothing relevant** for any query; almost all community knowledge lives on the
   itch.io forum (`itch.io/t/...`, `itch.io/post/...`), itch blogs/devlogs and a handful of GitHub repos.
2. **Reading threads** with a fetch-to-markdown tool (forum pages are plain HTML; markdown is fine
   for prose). For each thread: title, creation date, roles (Admin / Moderator / user) and the claim.
3. **Live verification** with `curl` (GET only, browser User-Agent, ≥1 s between itch requests,
   robots.txt honoured — no `/embed/`, `/search`, etc.). Raw downloads stayed in a scratchpad, never
   in this repo. Analysis scripts (written for this log) are in `scripts/community/`.
4. **GitHub sample** of community itch CSS: `gh search repos` / `gh search code`, raw files via
   `raw.githubusercontent.com`, statistics with `scripts/community/cssstats.py`.
5. **Static source reading**: itch's public JS bundles (`static.itch.io/bundle.min.js`,
   `theme_editor.min.js`, `user.css`) grepped for editor behaviour (no execution).

itch request budget used: ~14 `curl` requests + ~38 page fetches ≈ 52 (< 150). Two `curl`
requests got `HTTP 429` (openresty) — itch rate-limits bursts; waiting ~20 s fixed it.

## 2. Commands (re-runnable)

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
S=<scratch dir>; mkdir -p $S/raw $S/raw/static $S/gh $S/repos
curl -s -A "$UA" https://itch.io/robots.txt
sleep 2; curl -s -A "$UA" -D $S/raw/nnda.h      https://nnda.itch.io/                      -o $S/raw/nnda.html
sleep 2; curl -s -A "$UA" -D $S/raw/pitch.h     https://nnda.itch.io/pitch                 -o $S/raw/pitch.html
sleep 2; curl -s -A "$UA" -D $S/raw/pdev.h      https://nnda.itch.io/pitch/devlog/1565390/rewrite-release-2-long-overdue-devlog -o $S/raw/pitch-devlog.html
sleep 2; curl -s -A "$UA" -D $S/raw/jam010.h    https://itch.io/jam/gamelike-jam-010       -o $S/raw/jam010.html
sleep 2; curl -s -A "$UA" -D $S/raw/am.h        https://alienmelon.itch.io/allthemes       -o $S/raw/am-allthemes.html
sleep 2; curl -s -A "$UA" -D $S/raw/self.h      https://mirokshi.itch.io/                  -o $S/raw/self.html   # maintainer's own profile
for f in bundle.min.js user.min.js theme_editor.min.js user.css; do sleep 2; curl -s -A "$UA" "https://static.itch.io/$f" -o $S/raw/static/$f; done
git clone --depth 50 https://github.com/nndda/itchio-profile $S/repos/nndda-itchio-profile
python -I scripts/community/inspect.py $S/raw/nnda.html $S/repos/nndda-itchio-profile/dist/styles.css   # style blocks + verbatim check
python -I scripts/community/bio.py     $S/raw/nnda.html user_profile                                      # what survived the sanitizer
python -I scripts/community/cssstats.py $S/gh/*.css                                                       # community CSS stats
grep -o -E '.{20}strip_css.{120}' $S/raw/static/bundle.min.js
grep -o -E 's\("CssEditor".{600}' $S/raw/static/theme_editor.min.js
for u in https://raw.githubusercontent.com/nndda/itchio-profile/main/dist/i.css \
         https://cdn.jsdelivr.net/gh/nndda/itchio-profile@1.14.2/dist/i.css \
         https://cdn.jsdelivr.net/gh/nndda/itchio-profile@main/dist/i.css ; do
  curl -sI -H "Origin: https://example.itch.io" "$u" | grep -iE '^HTTP|content-type|access-control|cache-control|nosniff'; done
```

## 3. Live results

### 3.1 Where the custom CSS ends up (per page type)

| Page (URL) | `<style>` blocks in served HTML | Custom CSS size | Notes |
|---|---|---|---|
| Profile `nnda.itch.io` | `#user_theme` (833) + `#custom_css` (4,726 chars / 4,759 UTF-8 bytes) | 4,726 | **byte-identical** to `dist/styles.css` at repo tag 1.14.2; first statement is `@import url("https://cdn.jsdelivr.net/gh/…@1.14.2/dist/i.css")`; 32 `&` nesting selectors kept; no HTML entities |
| Profile (maintainer's) | `#user_theme` (966) + `#custom_css` (4,725) | 4,725 | identical to the pasted minified file except the trailing newline; two `@import` (Google Fonts, Vercel) kept |
| Project `nnda.itch.io/pitch` | `#game_theme` (4,657) + `#custom_css` (21,944) | **21,944** | unminified, 45 comments and newlines kept → project pages store ≫ 5,120 chars |
| Devlog post of the same project | `#game_theme` + `#custom_css` (21,944) | 21,944 | `#custom_css` **identical** to the project's; root widget class `game_devlog_post_page` |
| Project `alienmelon.itch.io/allthemes` | `#game_theme` only | — | no custom CSS on that page (control sample) |
| Jam `itch.io/jam/gamelike-jam-010` | **`#jam_theme` only** (22,315) | ≈20,411 (after the 1,904-char generated part) | custom CSS appended verbatim after generated rules inside the same `<style>`; 14 comments kept; no separate `#custom_css` |

Response headers on all five pages: **no `Content-Security-Policy` restricting styles/fonts/images**
(project page only sends `frame-ancestors 'self' https://itch.io`); `X-Content-Type-Options: nosniff`.

### 3.2 Profile bio sanitizer (nnda.itch.io, source = `dist/content.html` at the deployed commit)

| Check | Source HTML | Served HTML |
|---|---|---|
| classes `customa` … `customae` (prefix `custom` **without** hyphen) | 31 distinct | all 31 present |
| class `text-right` (not custom-prefixed) | 2 | 2 present (`.text-center/.text-right/.text-justify` are defined in `static.itch.io/user.css`) |
| `style=""` attributes (margin, height, width, font-size, text-align, color) | 7 | 7 present, re-serialized (trailing `;` dropped) |
| `<img>` `loading` attribute | 0 / 13 | **13 / 13 `loading="lazy"` added** |
| `<img>` `alt` attribute | 0 / 13 | 0 / 13 (no alt added) |
| external `<a target="_blank">` | 11 | `rel="nofollow noopener" referrerpolicy="origin"` added to the 9 non-itch links (patreon, ko-fi, artstation, github); the 2 `*.itch.io` links got nothing (re-checked 2026-10-14) |
| bio length | 4,227 chars | ≈4,860 chars inner HTML of `.user_profile.formatted` (≈4,915 with a looser cut); grew because of added attributes |

### 3.3 Third-party hosting headers

| URL | Content-Type | ACAO | Cache-Control |
|---|---|---|---|
| raw.githubusercontent.com …/i.css | `text/plain; charset=utf-8` + nosniff | `*` | max-age=300 |
| raw.githubusercontent.com …/font.ttf | `application/octet-stream` + nosniff | `*` | max-age=300 |
| cdn.jsdelivr.net …@1.14.2/dist/i.css | `text/css` | `*` | `max-age=31536000, immutable` |
| cdn.jsdelivr.net …@main/dist/i.css (branch) | `text/css` | `*` (re-check 2026-10-14) | `max-age=604800, s-maxage=43200` |
| cdn.jsdelivr.net …/dist/i.css (no version → latest tag 1.14.2) | `text/css` | `*` | `max-age=604800, s-maxage=43200` (same short cache as a branch) |
| cdn.jsdelivr.net …@1.14.2/dist/i.woff2 | `font/woff2` | `*` | 1 year, immutable |

### 3.4 itch static source (public files, read-only grep)

- `bundle.min.js`: `strip_css` = `t.replace(/<\s*\/\s*style\s*>/i,"")` — removes only the **first** `</style>`
  (no `g` flag). Used by the theme editor before writing the live preview into `<style id="custom_css">`.
- `theme_editor.min.js`: `CssEditor` = label "Custom CSS" + expand button (↗) + "Readme" button + a
  plain `<textarea>` **without `maxLength`**; expanded editor says "Changes are automatically applied."
  (live preview, throttled 100 ms); saving and, if the server returns `errors`,
  an error lightbox with "Your changes were not saved, please try again".
  **Correction (verification pass 2):** only the project editor saves with `I.remote_submit(form)`
  (field `layout[css]`); the profile and jam editors `POST` the whole theme as JSON
  (`$.ajax({data: I.with_csrf({theme: JSON.stringify(state.theme)})})`), and a network failure shows
  `errors:["Server error"]` with the same sub-text. The "Misc" group holding the field is rendered only
  when the server passes `can_use_css` (`render_css_editor: if(this.props.can_use_css) …`).
  `bundle.min.js` also opens the editor when the page URL hash matches `/\bedit_theme\b/`.
- `user.css` (profile stylesheet): no `--itchio_grid_cell_width` variable (used in a 2022 admin snippet).
  **Correction (verification pass):** the variable is still set **at runtime** by `bundle.min.js`
  (`I.GameGridSizer.resize_cells` appends `<style itchio-grid-sizer>` with `--itchio_grid_gap`,
  `--itchio_grid_cell_width`, `--itchio_grid_cell_columns` and `grid-template-columns:repeat(N,Wpx)`),
  and `user.min.js` instantiates it on profiles with `container_selector:".mode_grid .user_game_grid"`.
  The 2022 admin recipe is therefore not stale.
- Maintainer's own logged-in export (June 2026, private repo): theme editor config has
  `"image_size_limit": 3145728` (3 MiB) and a `css_template` that starts with
  `:root{--itchio_ui_bg: mix_color(bg_color,'#333',0.2)}` (theme BG tints itch's site header).

## 4. Community sources (sample list)

| # | Source | Date | Role(s) | Claim used |
|---|---|---|---|---|
| S1 | itch.io/t/2818377 "Increase profile custom CSS size limit (5KB)" | 2023-04-29 | user + Admin | profile limit 5KB; admin: reduce usage, host files elsewhere; "game pages might be missing the size check"; user: their own profile CSS cannot be shrunk below ≈4.5K Unicode chars (a floor of their CSS, **not** an effective limit) |
| S2 | itch.io/blog/950966 + github.com/nndda/itchio-profile (README, build.ts) | 2025-05-23 → 2026-10-13 | creator | 5120-char profile limit; split+jsDelivr `@import`; FOUC; version-bump because jsDelivr caches; 30-char margin |
| S3 | itch.io/blog/1536605 | 2026-05-28 | creator | profile bio HTML limit 5000 chars; itch "enforces" lazy loading and alt |
| S4 | itch.io/blog/1459365 | 2026-03-15 | creator | itch desktop app Electron upgrade → modern CSS works in app; nesting to save chars |
| S5 | itch.io/t/6429680 + post 16216309 "Jam Theme Editor Revamp" / migration guide | 2026-06-01 | Admin + organizer | jam CSS appended verbatim, unscoped; background body→`.jam_page_wrap`; header moved out; editor wrappers; `#wrapper` added; jam limit first 5120 then **20kb**; backups/diffs on request |
| S6 | itch.io/post/16268153 (thread "My games are being deindexed") | ≈2026-06 | Admin | CSS access may be removed if it messes with site UI; don't touch header or dialogs |
| S7 | itch.io/t/2092340 "layout change?" | 2022-05-05 | Admin, Moderator | grids moved to CSS grid site-wide; no centered trailing items; tagline fix; advice against big UI changes |
| S8 | itch.io/updates/a-new-theme-editor-for-project-pages | 2017-11-14 | Admin | lower-precedence theme classes; ~646 public games used custom CSS; CSS users emailed |
| S9 | itch.io/post/4264795 | ≈2021 | Admin | inline CSS limited to "a few simple properties"; profile CSS can be requested |
| S10 | itch.io/post/10173021 | ≈2024 | Moderator | "inline CSS is stripped on save" (contradicted by S9 and §3.2) |
| S11 | itch.io/post/5921328 | ≈2022 | creator | some inline properties (border-radius) not respected |
| S12 | itch.io/post/13118368 (ticket thread) | ≈2025 | user relaying support | support asks: describe changes, theme editor can't do it, keep accessible, don't alter UI; page must be public |
| S13 | itch.io/t/5366273, itch.io/t/6711878, itch.io/post/14182120 | 2025-09 → 2026-07 | users + Moderator | 3–4 weeks, 1 month, 2 months without reply; moderator can only notify admins |
| S14 | itch.io/t/227363 | 2018-05-07 | user | creator-page CSS enabled ~30 min after asking (via Discord) |
| S15 | itch.io/t/1717986 | 2021-10-24 | Moderator | "custom CSS is only for individual project pages" (contradicted by guide + S9) |
| S16 | github.com/micahmv/anyfont4itch README | 2024-12 → 2026-03 | creator | email support@itch.io; 1–2 weeks; base64 fonts hit 5,120; woff2/URL instead; project pages higher/no limit |
| S17 | itch.io/t/3846998, itch.io/t/2056197 | 2024-06, 2022-04 | Moderator + users | editor is "Edit theme" on the page itself; hidden on narrow/mobile/low-DPI windows |
| S18 | itch.io/post/2091056 | ≈2020 | creator | layout shift only when logged in (owner dashboard bar); hide `.right_col.column` on mobile |
| S19 | itch.io/t/42741 | 2016-10-09 (one follow-up question 2019-03-04) | user | `.game_frame:fullscreen{margin:0!important}` fullscreen fix (no other workarounds reported in that thread) |
| S20 | itch.io/t/3898162 | 2024-07-07 | user | font on `body` changed itch's whole UI; custom class on a div worked |
| S21 | itch.io/t/2724812, itch.io/t/2342553 | 2023-03, 2022-09 | users, Moderator | classes without `custom-` / CSS not enabled → rules silently do nothing |
| S22 | itch.io/t/3896796, itch.io/post/10581272, itch.io/t/1301251 | 2021–2024 | users, Moderator | hiding download button = "exploit"; hiding downloads affects search |
| S23 | itch.io/post/8830756 | 2023-11-02 | users | header-bar colour dispute → caused by theme BG, not custom CSS |
| S24 | itch.io/t/1671609 | 2021-09-29 (follow-up 2026-01-09) | Moderator | translucent content panel: theme editor "More options…" → BG2 Alpha, no CSS |
| S25 | nnda.itch.io/pitch (description) | 2025–2026 | creator | paste with Ctrl+V; copy buttons fail in Chromium; back up CSS/HTML; test in itch app |
| S26 | github.com/GourangaDasSamrat/itch-io-theme README | 2026-08 | creator | claims itch blocks external stylesheets "due to CORS" (contradicted, §3.1/3.3) |
| S27 | itch.io/docs/creators/css-guide (official) | fetched 2026-10-14 | itch | access request contents; empty accounts refused; **no size limit stated** |
| S28 | itch.io/post/9827074 | ≈2024 | creator (plugin dev) | "limited to 5000 characters"; works around it with an iframe to GitHub Pages |
| S29 | itch.io/blog/790882 | 2024-08-30 | creator | profile CSS example: unscoped `:root`, `.game_cell`, `.inner_column h2`, `@media (max-width:800px)` |
| S30 | narehop.itch.io/css-itchio-tips-tricks | ≈2025 | creator | CodePen snippets incl. hiding itch labels ("External Link", "Name your own price") — policy-risky |
| S31 | itch.io/blog/1536605 + nnda README (Firefox workflow) | 2026 | creator | develop in Firefox DevTools Style Editor with the CSS field cleared; Firefox may break non-ASCII on file import |

## 5. Community CSS sample statistics (`cssstats.py`, 11 files from 8 public GitHub repos)

| File (repo) | chars | selectors | under `#wrapper` | `!important` | notable |
|---|---|---|---|---|---|
| kp.css (Eneskp3441/ItchioCSS) | 6,512 | 46 | 0 | 0 | styles `body` |
| itch.io.css (FurkanKambay) | 4,277 | 37 | 1 | 0 | derived from Pitch |
| style.css (GourangaDasSamrat/itch-io-theme) | 3,732 | 31 | 4 | 23 | styles `.footer`, `.header`, `user-select:none` |
| .profile_column.css (Gustavobb) | 1,255 | 7 | 0 | 0 | 5 keyframes |
| jusqua-….css (charles-masse) | 584 | 5 | 2 | 3 | — |
| profile.css (charles-masse) | 4,719 | 67 | 0 | 6 | `@font-face` from raw.githubusercontent.com |
| main.css (hamgarian) | 12,816 | 63 | 60 | 6 | Google Fonts `@import`; styles `html, body` |
| anyfont4itchpage.css (micahmv) | 1,291 | 4 | 0 | 0 | base64 `@font-face` template |
| anyfont4itchprofile.css (micahmv) | 1,244 | 5 | 0 | 0 | sets font on `.footer` |
| game_page.css (nndda/Timekeeper) | 2,323 | 35 | 2 | 14 | — |
| src/styles.css (nndda/itchio-profile) | 23,045 | 165 | 1 | 11 | relies on `custom*` classes; built down to 4,726 |

Only **1 of 11** files scopes most selectors under `#wrapper`; 4 touch `html`/`body`/`:root`/`.footer`
globally. Copy-pasted community themes therefore usually need re-scoping before use.

> **Recount (verification pass 2, `scripts/community/verify2_scope2.py`, a different parser):** counting
> only selectors that *start with* `#wrapper` (or sit inside a rule that does), GourangaDasSamrat = 0/31 and
> nnda src = 0/165 instead of 4 and 1; the other rows match. Counting `.user_page_wrap`/`.user_page`/
> `.wrapper` prefixes as scoped too: gds 6/31, kp 10/46, charles-masse profile 18/67, nnda src 17/165,
> hamgarian 60/63. Either way only hamgarian (95 %) scopes most selectors — and it is also the file with the
> global `html, body{overflow-x:hidden;scrollbar-width:none;-ms-overflow-style:none;touch-action:pan-y}`.
> The gds `user-select:none` is `.user_page_wrap *{…}` (the whole profile).

## 6. Search queries used

`itch.io custom CSS character limit editor` · `itch.io "CSS access" request how long community forum` ·
`itch.io custom css @import google fonts not working` · `reddit r/itchio custom CSS profile page` ·
`site:reddit.com itch.io custom css page` · `stackoverflow itch.io css game page` ·
`"itch.io" "5120" css characters` · `itch.io custom css "logged out" …` · `itch.io custom CSS broke after update …` ·
`itch.io css access suspended …` · `itch.io custom css removed stripped when saving …` ·
`itch.io custom css game page iframe embed fullscreen "game_frame"` · `itch.io custom css mobile layout broken …` ·
`itch.io devlog post custom CSS styling` · `itch.io jam page custom css tips …` ·
`itch.io css "Name your own price" hide OR "download button" …` · `itch.io theme editor css "too long" …` ·
GitHub: `gh search repos "itch.io css"`, `"itch.io theme"`, `"itchio-css"`, `"itch.io custom css"`;
`gh search code "itch.io" --extension css`.

## 7. Contradictions found (details in the facts)

1. **Profile limit unit:** 5120 "characters" (S2, S16) vs "5KB" (S1 title) vs "5000 characters" (S28, a plugin dev talking about his own *project/plugin* page, page type not stated). Bytes vs UTF-16 units vs code points is untested. (The "≈4.5K Unicode characters" in S1 is the size floor of that user's own CSS, not a limit — corrected in the verification pass.)
2. **Project-page limit:** none / "missing size check" (S1 admin 2023, S16) vs "5120 … now consistent with profile and project pages" (jam organiser, itch.io/t/6429680, 2026-06-02) vs "5000 characters" (S28, 2024); one live project page serves 21,944 chars (possibly saved before any cap).
3. **Inline `style`:** "stripped on save" (S10, Moderator) vs "a few simple properties allowed" (S9, Admin) — live bio keeps 6 properties.
4. **Class prefix:** guide says `custom-`; live bio keeps `customa…` (no hyphen) and `text-right`.
5. **`alt` on images:** S3 says itch enforces `alt`; served HTML has none.
6. **Profile CSS availability:** Moderator 2021 "only for project pages" vs guide (profile listed) and Admin 2021 (S9).
7. **External stylesheets:** S26 "blocked by CORS" vs live `@import` from jsDelivr/Vercel/Google Fonts and no CSP.
8. **Jam limit:** one summary implied 32k; the admin's own words set **20kb** (organizer asked for 32k, then fit under 20kb).

## Verification (2026-10-14)

An adversarial pass re-checked every `community-NN` fact against primary sources. All sources were re-fetched independently into a separate scratchpad, and no browser tools were used.

**Method.** I re-fetched the 6 live pages (nnda profile, Pitch, a Pitch devlog post, gamelike-jam-010, alienmelon/allthemes and the maintainer's profile) and `static.itch.io/{bundle.min.js,theme_editor.min.js,user.css,user.min.js}?1791970861`, plus 37 forum, blog and doc pages. That is about 50 itch GET requests at 3–8 s spacing. Five requests got `429` and were retried after 20–30 s. I also fetched the 11 GitHub sample files and the nnda/anyfont4itch/steam-theme READMEs, ran the jsDelivr and raw.githubusercontent header checks, and read the HTML spec (`semantics.html`, the style element and render-blocking sections) and MDN `X-Content-Type-Options`. The new scripts are in `scripts/community/verify_*.py`:

```bash
python -I -X utf8 scripts/community/verify_styles.py  <page>.html ...        # style blocks, head/body, CSP meta
python -I -X utf8 scripts/community/verify_cmp.py     nnda.html styles-1.14.2.css   # served == built file?
python -I -X utf8 scripts/community/verify_biodiff.py nnda.html content-main.html   # sanitizer diff
python -I -X utf8 scripts/community/verify_scope.py   sample/*.css              # #wrapper scoping
python -I -X utf8 scripts/community/verify_posts.py   <thread>.html 1500        # forum post text + dates
node -e 'console.log(JSON.stringify("a</style>b</STYLE >c".replace(/<\s*\/\s*style\s*>/i,"")))'  # strip_css
```

**New findings that changed facts**

- `--itchio_grid_cell_width` is **not stale**. `bundle.min.js` → `I.GameGridSizer.resize_cells` injects `<style itchio-grid-sizer>` at runtime into `<head>`, after `#custom_css`. It sets `--itchio_grid_gap`, `--itchio_grid_cell_width`, `--itchio_grid_cell_columns` and `grid-template-columns:repeat(N,Wpx)`. `user.min.js` creates it for `.mode_grid .user_game_grid` and for `.game_grid_widget.game_list` (profiles carry `.user_page.mode_grid`).
- The `@import` inside `style#custom_css` sits in `<head>`, in a parser-created `<style>`. Per the HTML spec that style is "implicitly potentially render-blocking", and rendering stays blocked until its critical subresources (imports) load. So the expected symptom is a **delayed first paint**, not FOUC. The nnda README's FOUC warning is unconfirmed in a browser.
- In t/2818377 the "≈4.5K Unicode characters" is that user's minimum CSS size, **not** an effective limit.
- In t/6429680 the jam organiser (2026-06-02) said 5120 "is now consistent with profile and project pages". That is a community hint that project pages may now be capped.
- Pitch's served game embed is `div.game_frame.game_loaded > iframe#game_drop`. `.iframe_placeholder`, `.game_pending` and `button.load_iframe_btn` appear only as selectors inside Pitch's custom CSS, not in the served markup.
- `--itchio_ui_bg` equals 80 % `#333` + 20 % of the BG colour, floored. This was checked numerically on 2 profiles, 1 project and 1 jam. In logged-out HTML only the jam page has a site header (`div.jam_layout_header_widget.header_widget.gray`); profile and project subdomain pages start with the floating `ul#user_tools` and have no `.header_widget`.
- Date fixes: post/8830756 is 2023-11-02. The t/1671609 follow-up is 2026-01-09. t/42741 contains no workaround other than the `:fullscreen` margin rule.
- In t/2342553 the user said CSS access *had* been granted a year earlier. It was the moderator who asked whether it was enabled.
- Pitch's `@charset "UTF-8";` is only in a derived copy (FurkanKambay), not in Pitch's served CSS. `@charset` has no effect inside a `<style>` element.

**Verdicts**

| id | verdict | note |
|---|---|---|
| 01 | confirmed (documented) | guide also says access is off by default because it complicates upgrades |
| 02 | confirmed (community) | all wait reports re-read with dates |
| 03 | corrected | source part = documented; visibility = community; factor is CSS viewport width, not "DPI" |
| 04 | confirmed (inferred) | no maxLength in either textarea; error lightbox text verified in source |
| 05 | corrected | profile/project preview → `#custom_css`; jam preview → `#jam_theme` via `css_template({custom_css})` |
| 06 | corrected | the 4.5K was a misreading; "5000 chars" quote is about a plugin/project page |
| 07 | confirmed (documented) | organiser said "a few hundred shy" while live custom part is 20,411 → cap ≥20,411 only if saved after the cap |
| 08 | corrected | live 21,944 verified; current cap disputed (2026 organiser: project = 5120) |
| 09 | corrected | served bio ≈4,860 chars by a strict cut (4,227 source) |
| 10 | confirmed (verified) | byte-identical again |
| 11 | corrected | split is size-based (first chunk imported, rest pasted), and render-blocking rather than FOUC |
| 12 | confirmed (verified) | version-less URL also gets the 7-day/12-h cache |
| 13 | confirmed (documented) | headers verified; blocking per MDN (not tested in a browser) |
| 14 | confirmed (verified) | no CSP header or `<meta>` CSP on 6 pages |
| 15 | corrected | `@charset` advice wrong for `<style>`; Pitch's served CSS has no `@charset` |
| 16 | confirmed (inferred) | theme_editor source confirms jam CSS goes through the template |
| 17 | confirmed (verified) | |
| 18 | corrected | 6 properties verified kept; float only "reported not working" |
| 19 | confirmed (verified) | |
| 20 | confirmed (verified) | rel/referrerpolicy only on non-itch.io links |
| 21 | corrected | t/2342553 user claimed access was on |
| 22 | corrected | "no history" reason not stated by Pitch |
| 23 | confirmed (documented) | 2026-06-10 |
| 24 | confirmed (community) | |
| 25 | confirmed (documented) | |
| 26 | corrected | date 2023-11; header present logged-out on jam pages only; formula verified |
| 27 | corrected | "stale" refuted: variable set at runtime by JS |
| 28 | confirmed (documented) | |
| 29 | confirmed (verified) | |
| 30 | confirmed (community) | also documented in the guide for jams |
| 31 | confirmed (verified) | regex re-run locally with node |
| 32 | confirmed (community) | the community snippet has no media query, so it hides screenshots on desktop too |
| 33 | corrected | placeholder/pending classes not in served markup |
| 34 | corrected | thread has no fullscreen-button/click-to-launch reports |
| 35 | confirmed (verified) | |
| 36 | corrected | FOUC → render-blocking delay; Brave report stays "observed" |
| 37 | confirmed (community) | upgrade was ≈Feb 2026 ("last month" in a 2026-03-15 post) |
| 38 | confirmed (verified) | 32 / 74 `&` outside url() and strings |
| 39 | confirmed (verified) | independent recount: hamgarian 60/63, others ≤40 % |
| 40 | corrected | "white-on-light" has no evidence; Minimal theme verified live (not just a search summary) |
| 41 | corrected | follow-up is 2026; slider names verified in source ("BG2 Alpha" project, "BG 2 opacity" jam) |
| 42 | confirmed (observed) | `max_size:this.props.image_size_limit` in source |
| 43 | confirmed (community) | |
| 44 | confirmed (observed) | post 2025-02-26 |
| 45 | confirmed (verified) | |
| 46 | corrected | sets/hosts differ, not all names (`--itchio_link_color`, `--itchio_font_family` shared) |


## Verification pass 2 (2026-10-14, re-run)

This is a second, independent adversarial pass. It did not reuse the first pass's verdicts. Every fact was re-checked from primary sources fetched again into a new scratchpad (`community-verify2/`), using new scripts (`scripts/community/verify2_*.py`). No browser tools were used. itch requests: 6 live pages, 5 static files and 37 forum, blog and doc pages, plus 6 retries (5 × `429` and 1 redirect). That is about 55 GETs at 3–12 s spacing.

**Method (re-runnable).**

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36"
# live pages (same 6 URLs as §2), headers kept; sleep 4 between
curl -s -A "$UA" -D nnda.h -o nnda.html https://nnda.itch.io/          # … pitch, pdev, jam010, am, self
# itch static files at the version the pages reference TODAY (changed since §2: 1791970861 → 1791981660)
for f in theme_editor.min.js bundle.min.js user.css user.min.js game.min.js; do
  curl -s -A "$UA" -o $f "https://static.itch.io/$f?1791981660"; sleep 3; done
# forum/blog/doc pages: the 37 URLs of §4, sleep 3, retry 429s after 12 s (curl -L for post/4965997)
python -I -X utf8 scripts/community/verify2_styles2.py page.html --dump css/   # style blocks, sizes, comments, @import, '&', CSP meta
python -I -X utf8 scripts/community/verify2_posts2.py  thread.html 1500        # posts: role flag + date + text (no names)
python -I -X utf8 scripts/community/verify2_bio2.py    nnda.html content-1.14.2.html   # bio sanitizer diff (counts only)
SCOPE='#wrapper' python -I -X utf8 scripts/community/verify2_scope2.py sample/*.css    # scoping recount
grep -o -E '.{0,40}"CssEditor".{0,1500}' theme_editor.min.js; grep -c maxLength theme_editor.min.js   # → 0
grep -o -E '.{0,900}--itchio_grid_cell_width.{0,300}' bundle.min.js
grep -o -E '.{0,160}(iframe_placeholder|load_iframe_btn|game_pending).{0,160}' game.min.js
curl -sI -H "Origin: https://nnda.itch.io" <jsDelivr @1.14.2 | @main | version-less ; raw.githubusercontent css + ttf>
curl -s https://html.spec.whatwg.org/multipage/semantics.html   # style element: "implicitly potentially render-blocking"
curl -s https://www.w3.org/TR/css-cascade-5/ ; curl -s https://www.w3.org/TR/css-syntax-3/   # @import placement, @charset
```

**Re-observed numbers.** All of these match §3 unless noted.

- **nnda profile:** `#custom_css` is 4,726 chars / 4,759 B and identical to `dist/styles.css`@1.14.2. Neither has a trailing newline.
- **Maintainer's profile:** 4,725 chars served vs 4,726 in the local dist. Only the trailing `\n` is missing.
- **Pitch and its devlog post:** `#custom_css` is 21,944 chars with 45 comments and 1,115 newlines, byte-identical on both pages.
- **Jam:** `#jam_theme` is 22,315 chars = 1,904 generated + 20,411 custom. The custom part starts at `:root{\n  --dk-prp…`, has 14 comments, and ends with `} `, so a trailing space was kept.
- **Headers:** profile, devlog and jam pages send `X-Frame-Options: SAMEORIGIN`. The project page sends `Content-Security-Policy: frame-ancestors 'self' https://itch.io`. No page has a `<meta>` CSP.
- **Head order:** `user.css`/`game.css` link → theme `<style>` → theme Google Fonts `<link>` → `#custom_css`.
- **Bio:**
  - All 31 `custom*` classes and `text-right` were kept.
  - All 7 `style` attributes (6 distinct properties) were kept, with every trailing `;` dropped.
  - 13 of 13 `<img>` gained `loading="lazy"`; none gained `alt`.
  - The 9 non-itch links gained `rel="nofollow noopener" referrerpolicy="origin"`; the 2 `*.itch.io` links gained nothing.
  - The served bio is 4,860 chars.
- **`--itchio_ui_bg`** = floor(0.2·BG + 0.8·#333) per channel. It matches on 5 of 5 pages (2 profiles, 2 projects, 1 jam).

**New or refined findings**

- `game.min.js` *does* define the click-to-launch classes. `load_frame()` replaces `.iframe_placeholder` with the stored iframe and switches `.game_frame` from `game_pending` to `game_loaded`; `.load_iframe_btn` is the click target. Pitch's own game loads directly, so its served markup only has `.game_frame.game_loaded`.
- `bundle.min.js` opens the theme editor when the URL hash matches `/\bedit_theme\b/`. This is owner-only and untested.
- The Custom CSS field, and the preview `#custom_css` element, exist only when the server sets `can_use_css`. Jam previews pass `custom_css: can_use_css && css` into the jam `css_template`, so the preview goes through `#jam_theme`.
- nnda's split puts the **beginning** of the source CSS into the imported file and pastes the **tail**. The function `whyDoes…(cssArr, 5120-30-importLen)` walks the rules from the end, which keeps the source order in the cascade. It is not a "critical rules first" split.
- nnda's HTML build strips `alt=""` and `loading` from images before pasting. So "0 alt" in the served bio only proves that itch does not *add* alt; it says nothing about whether itch keeps an author's alt.
- `@charset` inside a `<style>` element is dropped as an unrecognized rule (CSS Syntax 3 §8.3). CSS Cascade 5 also ignores it when checking `@import` placement, so it never invalidates an `@import`.
- The 2024 "limited to 5000 characters" quote (post/9827074) is about the plugin developer's **project/plugin page**, not a profile.
- Exact dates in t/6429680: organiser's 5120 concern 2026-06-02 16:46, admin's "20kb" 2026-06-02 18:23, organiser's "a few hundred shy" 2026-06-09 20:52.
- Pitch's description says that a missing Custom CSS field means you don't have CSS access. It also tells users to back up their HTML and CSS to a file, but gives no "no history" reason.

**Verdicts (pass 2)**

| id | verdict | confidence | note |
|---|---|---|---|
| 01 | confirmed | documented | guide: per-account, `/support`, 4 points, empty accounts refused; support reply relayed 2025-06-15 |
| 02 | confirmed | community | all waits re-read with dates |
| 03 | corrected | documented | source verified; visibility is community; cause is a narrow CSS viewport; `#edit_theme` hash |
| 04 | corrected | inferred | profile/jam save = JSON `$.ajax`, project = `remote_submit`; no maxLength confirmed |
| 05 | corrected | documented | preview path differs for jams (`#jam_theme` via template) |
| 06 | corrected | community | 4.5K misread; "5000" quote is about a project/plugin page |
| 07 | confirmed | documented | admin 2026-06-02; live custom part 20,411 |
| 08 | corrected | observed | 21,944 live, but a 2026-06 report says project pages are now capped at 5120 |
| 09 | corrected | community | served ≈4,860 chars (not 4,915) |
| 10 | confirmed | verified | identical again; jam keeps a trailing space |
| 11 | corrected | verified | split pastes the tail; render-blocking per spec rather than FOUC |
| 12 | corrected | verified | version-less URLs also get the 7-day/12-h cache |
| 13 | confirmed | documented | headers verified; blocking per MDN, not browser-tested |
| 14 | confirmed | verified | |
| 15 | corrected | verified | `@charset` part wrong; it comes from a derived copy |
| 16 | confirmed | inferred | spec + verified placement; no jam tested |
| 17 | confirmed | verified | |
| 18 | corrected | verified | 6 properties on a CSS-access account; float only "reported" |
| 19 | confirmed | verified | |
| 20 | corrected | verified | rel/referrerpolicy only on non-itch.io links |
| 21 | corrected | community | t/2342553 user said access was on |
| 22 | corrected | community | "no history" reason not in source |
| 23 | confirmed | documented | 2026-06-10 |
| 24 | confirmed | community | |
| 25 | confirmed | documented | 2022-05-11 |
| 26 | corrected | verified | dispute 2023-11-02; header only on jam pages logged out |
| 27 | corrected | documented | variable injected at runtime → recipe not stale |
| 28 | confirmed | documented | |
| 29 | confirmed | verified | |
| 30 | confirmed | community | |
| 31 | confirmed | verified | |
| 32 | confirmed | community | |
| 33 | corrected | verified | click-to-launch classes live in game.min.js, not in Pitch's markup |
| 34 | corrected | community | thread has no other workarounds |
| 35 | confirmed | verified | |
| 36 | corrected | observed | render-blocking delay, not FOUC |
| 37 | confirmed | community | upgrade ≈Feb 2026 |
| 38 | confirmed | verified | 32 / 73 nesting `&` outside url()/strings |
| 39 | confirmed | verified | recount differs in 2 rows, same conclusion |
| 40 | corrected | community | no evidence for "white-on-light"; Minimal theme verified live |
| 41 | corrected | community | follow-up 2026-01-09; labels in source |
| 42 | confirmed | observed | |
| 43 | confirmed | community | |
| 44 | confirmed | observed | |
| 45 | confirmed | verified | |
| 46 | corrected | verified | host elements differ; several names are shared |
