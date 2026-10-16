# Evidence log — dimension `docs` (official itch.io documentation and policy)

- **Date of all checks:** 2026-10-14 (UTC ~10:07–10:30).
- **Scope:** every official itch.io source that says something about custom CSS or page styling: the CSS Customization Guide, the other `/docs` pages, `/updates` + `/blog` posts by staff, staff (Admin badge) replies in the community forum, itch's public GitHub issue tracker, the Terms of Service, the quality guidelines and community rules. A handful of live pages were fetched only to check whether the documented selectors still exist.
- **Not done:** no login, no form, no posting. Anything that needs a CSS-enabled account is listed as an open question at the end.
- **Copyright:** raw HTML was kept in a private scratchpad only. This file holds my own summaries, counts and short paraphrases. Quotes are limited to a few words where the exact wording matters.

## 1. Method

### 1.1 Tools (my own scripts, in `knowledge/evidence/scripts/docs/`)

| Script | Purpose |
|---|---|
| `fetch.sh` | Polite `curl` GET with a normal browser User-Agent and a 3 s pause after each request. Logs one TSV row per request. |
| `fetch_retry.sh` | Wraps `fetch.sh`. On HTTP 429 it waits 30 s and retries, at most 3 times. |
| `totext.py` | Extracts the `.content_column` of an itch `/docs` page as text, with headings and link targets. |
| `posts.py` | Extracts the posts of an itch forum topic or `/post/N` page: author, Admin flag (`author_flag admin`), ISO date taken from the `title` attribute, and body text. |
| `diffguide.py` | Word-level diff of the online guide against the offline Markdown copy. |
| `diffversions.py` | Word-level diff of the guide body across Wayback Machine snapshots. |
| `selcheck.py` | Reports which documented ids and classes are present in a page, the `<style id>` blocks, the `#wrapper` tag and the `--itchio_*` variables. |
| `tree.py` | Prints the `<body>` element skeleton (`tag#id.class`) to a given depth. |

Reproduce with, for example:

```sh
OUT=./raw sh fetch.sh guide.html https://itch.io/docs/creators/css-guide
python -I diffguide.py raw/guide.html path/to/offline/custom-css-guide.md
python -I totext.py raw/guide.html txt/guide.txt
python -I selcheck.py raw/live_project_igua.html
```

### 1.2 Request budget and etiquette

- I checked `https://itch.io/robots.txt` first. Its disallow list is `/embed/`, `/embed-upload/`, `/search`, `/checkout/`, `/game/download/`, `/bundle/download/`, `/register-for-purchase/` and `/email-feedback/`, and none of the URLs below falls under it.
- **55 itch.io GETs** in total: 50 returned 200 and 5 returned 429.
- The 429s are an `openresty` "Too Many Requests" page. They appeared even with 1.3–3 s spacing, probably because parallel agents share the IP. Waiting about 30 s and retrying worked every time.
- Separately: 15 Wayback Machine requests (CDX + `id_` raw snapshots) and about 12 GitHub REST API requests.

### 1.3 Pages fetched (itch.io)

| Group | URLs |
|---|---|
| Guide | https://itch.io/docs/creators/css-guide |
| Other docs | `/docs/creators/design`, `/docs/creators/game-jams`, `/docs/creators/quality-guidelines`, `/docs/general/community-rules`, `/docs/legal/terms`, `/docs/creators/faq`, `/docs/creators/getting-started`, `/docs/creators/html5`, `/docs/creators/interact`, `/docs/general/faq`, `/support` |
| Staff posts | `/updates/a-new-theme-editor-for-project-pages` (2017-11-14), `/updates/game-collections-and-updated-profile-pages` (2013-12-28), `/updates/you-can-now-display-your-user-profile-in-a-grid` (2014-03-10), `/blog/1572473/itchio-changelog-sale-explorer-bundle-hosting-revamp-jam-theme-editor-patreon-integration-more` (2026-07-02) |
| Forum (staff answers) | `/t/6429680/jam-theme-editor-revamp` (leafo, 2026-06-01..09), `/t/2818377/increase-profile-custom-css-size-limit-currently-5kb` (leafo, 2023-04-29), `/post/396734` (a user's question; leafo's reply on that page is `/post/396757`, 2018-04-09), `/post/16268153` (leafo, 2026-06-10/11), `/t/2864176/click-to-activate-iframes-and-outbound-link-highlighting-on-project-pages` (leafo, 2023-05-18), `/t/2480029/top-level-blogging-available-for-all` (leafo, 2022-11-14), `/t/4291217/user-profile-links-update` (leafo, 2024-11-13), `/board/1901010/developer-updates` (2 pages, topic list) |
| Forum (community / volunteer moderators) | `/t/227363/...`, `/t/2887418/...`, `/t/1932521/...`, `/t/3846998/...`, `/post/391384`, `/post/12259179`, `/post/12258523`, `/post/13118368`, `/post/7499761`, `/post/5007559`, `/post/14182120`, `/post/14202663`, `/post/13710781` |
| Live checks | `https://itch.io/c/241703/css-showcase` (staff collection), `https://maddymakesgamesinc.itch.io/towerfall`, `https://creator-64.itch.io/game-28` (both listed in leafo's CSS Showcase), the game-28 devlog index + one devlog post, `https://leafo.itch.io/` (staff profile), `https://itch.io/jam/tojam9` (jam linked from the jam docs), `https://itch.io/jam/gmtk-2025` + `/entries` + `/results`, `https://itch.io/blog/790882/customised-profile-page` (user top-level post) |

Other sources:

- **Wayback:** `https://web.archive.org/cdx/search/cdx?url=itch.io/docs/creators/css-guide&output=json&fl=timestamp,statuscode,digest,length&collapse=digest` lists 99 captures (2019-07-21 to 2026-10-06). Raw captures were fetched as `https://web.archive.org/web/<ts>id_/https://itch.io/docs/creators/css-guide` for 2019-07-21, 2019-10-13, 2020-05-07, 2020-10-21, 2021-02-08, 2021-04-22, 2021-06-18, 2023-11-27, 2025-06-01, 2026-04-10, 2026-05-12, 2026-06-13, 2026-06-17 and 2026-10-06.
- **GitHub:** the issue tracker linked from `/support` (`leafo/itch.io`) now redirects to `itchio/itch.io`. Searched with `https://api.github.com/search/issues?q=repo:itchio/itch.io+css+in:title`, which returned 10 results. Read in detail: #1148, #1006, #1462, #1558 and #1661.

## 2. Online guide compared with the offline copy

Command: `python -I diffguide.py raw/guide.html <offline>/docs/custom-css-guide.md`. The offline copy is dated 2026-10-08.

- **Similarity ratio:** 0.929. The offline copy has 1105 words and the online one 1264.
- **What makes up the whole difference:**
  1. The online page has the `## Getting CSS access` section (anchor `#getting-css-access`) and a matching TOC entry. The offline copy left it out on purpose.
  2. The offline TOC has two extra entries ("CSS Customization Guide", "Table of contents"). These are Markdown-export artifacts, not content.
- **Everything else is word-for-word identical:** intro, considerations, custom classes, project layout, embedded games, jam layout, theme variables, jam considerations and external content.
- **No images.** The online "diagrams" are 18 nested `<fieldset>`/`<legend>` elements and the page body has no `<img>`. So the offline copy is missing no picture; it already keeps the fieldsets as raw HTML.
- **Stability:** the SHA-1 of the normalized guide body (`289a318c84a53279`) is identical in the 2026-06-13 and 2026-10-06 Wayback captures and in today's live copy.

### 2.1 Getting CSS access (online only), paraphrased

- **Where to ask:** the "contact us" link goes to https://itch.io/support. That page says to email **support@itch.io** from the address that owns the account, and you get a receipt with a Ticket ID.
- **What to include:** say what changes you want to make. itch gives its reasons for restricting the editor: custom CSS makes it harder to upgrade pages without breaking custom layouts, and they expect responsible use.
- **The message must:**
  - confirm that the goal can't already be reached with the built-in theme editor;
  - briefly describe the kinds of changes;
  - confirm you know the page must stay accessible, and that you won't make it hard to operate or read;
  - confirm you won't alter itch.io's built-in UI and will scope all changes to the visuals of your own page content.
- **Elsewhere in the guide:** read the whole guide first, and access is not granted to empty accounts.
- **Creator FAQ:** approval is manual "due to implications about accessibility and long term support".
- **Corroboration (community reports, not staff):**
  - The 2025-06 support reply quoted by a user in `/post/13118368` repeats the same four points.
  - A volunteer moderator said the project must be public before access is considered.
  - Turnaround reports range from about 30 minutes (2018) to "weeks without answer" (2025).

### 2.2 How the guide changed over time (Wayback)

| Period | Change |
|---|---|
| 2017-11-14 | The guide is introduced (`/updates/a-new-theme-editor-for-project-pages`). |
| By 2019-07-21 | Sections: Introduction, Considerations, Custom classes, Project page layout, Embedded games, External content. The editor is listed for Project, Jam and Profile pages. Access is just "contact us". The guide promised "We'll email all CSS users" when markup changes. |
| 2021-02-08 → 2021-04-22 | Added: "review this entire guide", "We do not grant CSS access to empty accounts", "(Including Devlog posts)", the whole "Getting CSS access" section, and the rich-text-editor warning. The email promise was softened to "If we make major changes, we'll try to email". |
| 2021-04 → 2026-05-12 | No change to the body text (797 words). |
| 2026-05-12 → 2026-06-13 | Added "Jam page layout", "Theme variables" and "Considerations for jam theme designers". The forum announced this on 2026-06-01. |
| 2026-06-13 → 2026-10-14 | No change (1264 words). |

## 3. Live check of the documented selectors (2026-10-14, logged out)

`selcheck.py` + `tree.py` results:

| Page | `#wrapper` tag | Documented selectors present | Style blocks (in order) | `--itchio_*` vars set by the theme on |
|---|---|---|---|---|
| Project, downloadable (towerfall) | `div#wrapper.main.wrapper.game_page_wrapper` | `#wrapper #inner_column .header .columns .left_col.column .formatted_description .right_col.column .footer` (all) | `style#game_theme` (40 flat rules, no ID selectors, but **8 `!important` declarations**: redactor toolbar hover, `.reward_row`/`.bundle_row` border-color, comment markdown-toolbar button hover, `.footer .svgicon` fill) → `style#custom_css` (735 chars) | `:root` (ui_bg, ui_bg_dark); `.wrapper` (font_family, bg_color, bg2_color, bg2_sub, text_color, link_color, border_color, button_color, button_fg_color, button_shadow_color + `background-*` longhands) |
| Project, HTML5 (game-28) | same | all of the above, plus `.embed_wrapper` (`div.html_embed_widget.embed_wrapper`) > `.game_frame`, placed before `.columns` | `game_theme` → `custom_css` (**10,203 chars** after CRLF→LF normalization; **10,569 chars as served**, because the stored CSS keeps 366 `\r\n` line endings. 0 occurrences of `#wrapper`, 5 `@media`, 25 `!important`, 1 `data:` URI) | same as above |
| Devlog index + devlog post (game-28) | same | `#wrapper #inner_column .header .footer`. **No** `.columns`, `.left_col` or `.formatted_description`: the post body is `.game_devlog_post_page > .split_columns` | `game_theme` → `custom_css`, SHA-1 `e6b63d535126`, identical to the project page | same |
| Profile (leafo) | `div#wrapper.user_page_wrap` | `.user_page #profile_header .inner_column .columns .user_links .user_profile .footer` (`.footer` inside `#wrapper`) | `style#user_theme` (785 chars; no custom CSS on this account). It uses **native CSS nesting** (8 nested blocks, e.g. rules nested inside `.user_page{…}` and `.game_grid_widget .game_cell{…}`) and also sets `body{background-color}` outside `#wrapper`. | `:root` (ui_bg); `.user_page` (font_family, link_color, gray_back, border_radius) |
| Jam main page (gmtk-2025) | `div#wrapper.jam_page_wrap` | `.view_jam_page .jam_banner_outer .jam_banner .jam_body .jam_header_widget .jam_submitter_widget .jam_content.user_formatted`. `#entries` is absent on this jam. The site header (`.jam_layout_header_widget`) is a sibling **before** `#wrapper`. No itch `.footer` element and no `#user_tools` anywhere on this page (logged out). | only `style#jam_theme` (7,031 chars after CRLF→LF; 7,339 as served: the 1,877-char generated part is followed by 5,154 chars of host CSS stored with CRLF line endings). The host's custom rules come after the generated rules **inside the same block**, and some are unscoped (`img`, `html::before`, `body`). | `:root` (ui_bg); `.jam_page_wrap` (all 9 documented vars + color, background, font) |
| Jam `/entries`, `/results` | none | none | `style#jam_theme` of 252 chars (only `:root` and `.page_widget`), **without** the host's custom CSS | — |
| Legacy "raw" jam (tojam9, 2014) | none | none. Markup is `div#view_raw_jam_N.view_raw_jam_page.view_jam_base_page` (`data-page_name=view_jam`) | no `style#jam_theme`; the host's own page content contains an **inline `<style>` without id** (1,556 chars, unscoped `div.header`/`ul.menu` rules, an `http://` background image) | — |
| Staff collection, top-level blog posts, forum topic | none | none | none | — |

Other GitHub evidence:

- **#1148 (2021, user-filed, closed):** custom CSS is emitted into `<style id="custom_css" type="text/css">`. A stray "0" after it was fixed by leafo.
- **#1462 (2023, open):** a creator's custom CSS restyled itch's floating toolbar (`#user_tools`), so itch does not scope custom CSS for you.
- **#1661 (2024, open):** the profile Edit Theme panel has a "Custom CSS" field with a "READ ME" popup. Its "send us a message" link points to `<user>.itch.io/support`, which is a 404.

## 4. Keyword scan of the guide (absence check)

`grep -o -i` over `txt/guide.txt` found **0** hits for each of: `5120`, `limit`, `character`, `@import`, `Google`, `animation`, `!important`, `JavaScript` (apart from a `javascript:void(0)` link), `user_page`, `collection`, `bundle`, `community`, `dark`, `reduced`, `minif`.

What the guide does mention:

- `media quer`: 1 hit, in the jam considerations.
- `font`: 4 hits — page font/size in the jam section, and "images, fonts" under External content.
- `Base64`, `HTTPS`: 1 hit each.
- `profile`: 2 hits — the availability list and the custom-classes sentence.

## 5. Staff statements on limits (exact sources)

| Date | Source | Statement (paraphrased) |
|---|---|---|
| 2023-04-29 | leafo (Admin) in `/t/2818377` | The profile CSS limit is 5 KB; asked to raise it, he answered "Probably not". Reduce your CSS and link to resources hosted elsewhere rather than embedding them. Game pages "might actually be missing the size check". |
| 2026-06-02 | leafo (Admin) in `/t/6429680` | Jam CSS had no limit before the revamp. It was set to "20kb" after a host pointed out the new cap; the host had described that cap as 5120, "consistent with profile and project pages". Large CSS is mostly embedded fonts and images. |
| 2025-02-26 | community (`/post/12259179`) | "itch.io limits profile page's CSS to 5120 characters". |
| live 2026-10-14 | game-28 project page | Serves a 10,203-char `custom_css` (10,569 chars as served, CRLF line endings). Project CSS over 5120 exists; whether it was saved before a cap or no cap is enforced is unknown. |
| live 2026-10-14 (second pass) | https://itch.io/jam/gamelike-jam-010 (the jam the host linked in `/t/6429680`) | `jam_theme` = 1,904 generated chars + **20,411 chars of host CSS** (ASCII, LF only, braces balanced, ends cleanly). The host trimmed it after the 2026-06-02 "20kb" change, so the jam cap is at least 20,411 characters as stored, not 20,000. |

## Verification (2026-10-14)

An adversarial second pass re-checked every `docs-*` fact against primary sources, with **new downloads** and **independently written scripts** (`knowledge/evidence/scripts/docs-verify/`). The first pass's raw files were not reused. No browser tools, no login.

### V.1 Method

- **Requests (UTC 10:27–10:42):**
  - 43 GETs to itch.io / static.itch.io: 39 × 200, 1 × 404 (expected) and 3 × 429. Each 429 was retried after 30 s and then succeeded.
  - 7 Wayback raw captures and 1 CDX query.
  - 6 GitHub REST calls (#1148, #1462, #1661 and their comments).
  - 1 raw README from `leafo/web_sanitize`.
  - `robots.txt` was re-checked first; no URL used falls under its disallow list.
- **Fetch:** `OUT=./v sh get.sh <name> <url>`.
- **Docs text:** `python -I txt.py raw/x.html txt/x.txt`.
- **Forum posts:** `python -I posts.py raw/t.html`, which prints author, `[ADMIN]` flag, ISO date and post id.
- **Markup:** `python -I inspect.py raw/page.html` (style blocks with length/SHA-1/counts, `data-page_name`, `#wrapper` tag).
- **Containment:** `python -I dom.py raw/page.html '#wrapper' '.footer' '#user_tools' ...` reports, for each selector, the count, whether it sits inside `#wrapper`, and its ancestor path.
- **Theme blocks:** `python -I themecss.py raw/page.html game_theme|user_theme|jam_theme` lists selectors and `--itchio_*` declarations.
- **Guide history:** `python -I guidebody.py raw/wb/*.html raw/guide.html` (normalized body word count and SHA-1), then `python -I wdiff.py old.html new.html`.
- **Wayback captures used:** 20190721222335, 20210208062035, 20210422193635, 20260512143118, 20260613103324, 20260617022717 and 20261006084436. Some arrive gzip-compressed (first bytes `1f 8b`); run `gzip -d` first.
- **Pages fetched:**
  - Guide and other docs: `/docs/creators/css-guide`, `/design`, `/quality-guidelines`, `/faq`, `/getting-started`, `/html5`, `/docs/legal/terms`, `/support`.
  - Forum: `/post/396734`, `/post/13118368`, `/post/16268153`, `/post/12259179`, `/post/7499761`, `/t/6429680`, `/t/2818377`, `/t/2864176`, `/t/2480029`, `/t/3846998`, `/t/4291217`.
  - Updates and blog: the 2013, 2014 and 2017 update posts and `/blog/1572473`.
  - Live pages: towerfall; game-28 (plus `/devlog`, one devlog post, `/purchase` and `/comments?before=18`); `leafo.itch.io` and `leafo.itch.io/support`; `jam/gmtk-2025` (plus `/entries` and `/results`); `jam/tojam9`; collections `c/241703` and `c/1536`; `blog/790882`.
  - Static CSS: `static.itch.io/game.css?1791970861`.

### V.2 Results that reproduced exactly

- **Online guide vs offline copy:** word-diff ratio 0.929. The only differences are the "Getting CSS access" section, its TOC line and code-block tokenization. The page's two `<img>` tags are the site logos outside the article, and the article has 18 `<fieldset>` / 18 `<legend>`.
- **Guide stability:**
  - My normalized body hash `98166fdfe499693e` is identical for 2026-06-13, 2026-06-17, 2026-10-06 and live today.
  - 2021-04-22 and 2026-05-12 are identical to each other (`5d3c1a10012080c9`).
  - Word counts with my extraction are 586 (2019), 788 (2021-04 to 2026-05) and 1257 (since 2026-06). The first pass's 594/797/1264 differ only because of how the text was extracted.
- **2021-02 to 2021-04 additions:**
  - "review this entire guide" and "empty accounts"
  - "(Including Devlog posts)"
  - the whole "Getting CSS access" section
  - "only editing as HTML"
  - "We'll email all CSS users when we make these changes" became "If we make major changes, we'll try to email all CSS users about the updates"
  - The `<>` button sentence already existed in 2019.
- **Devlog pages:** the devlog index (`game.devlog`), a devlog post (`game.devlog_post`) and `/comments` (`game.comments`) all carry `game_theme` followed by `custom_css` with the project's SHA-1 `e6b63d535126` (10,203 chars = 10,203 bytes, 0 x `#wrapper`).
  - **New:** `/purchase` (`game_purchase`, `popup_layout_widget`) has no theme, no custom CSS and no `#wrapper`.
- **Elements outside `#wrapper`:**
  - `#user_tools` is a direct child of `body`, outside `#wrapper`, on project, devlog and profile pages.
  - On gmtk-2025 the site header `.jam_layout_header_widget` comes before `#wrapper.jam_page_wrap` (byte offsets 10846 < 13487).
- **Jam theme blocks:**
  - gmtk-2025 `jam_theme`: 7,031 chars and 64 rules. The generated rules are followed by host rules with bare `img`, `a img:hover`, `table`, `html::before`, `body`, `details` and `summary` selectors.
  - `.jam_page_wrap` sets all 9 documented variables, and the generated `body{background-color:#000000}` is still emitted.
  - `/entries` and `/results` carry a 252-char `jam_theme`: `:root{--itchio_ui_bg}` plus `.page_widget{link + 5 button vars}`.

### V.3 Errors found and fixed in this file

- **§1.3:** `/post/396734` is the user's question; leafo's answer is `/post/396757`.
- **§3, project row:** `game_theme` is not free of `!important`. It has 8 such declarations, so an ID selector alone does not beat the theme for those properties (this corrects docs-17).
- **§3, tojam9 row:** it is a "raw" jam page (`view_raw_jam_page`) whose own content contains an inline host `<style>`. It is not "no style".
- **§3, jam row:** gmtk-2025 has **no itch `.footer`** and no `#user_tools`.
- **§3, profile row:** `user_theme` uses native CSS nesting and sets `body{background-color}`.
- **§3, GitHub list:** #1148 is a user-filed issue, not an official doc.
- **§5:** leafo's 2023 reply was "Probably not", not a flat refusal.

### V.4 New findings

- **Variables vs literal colours (project pages):** `static.itch.io/game.css` reads `var(--itchio_link_color)` for `a` and `var(--itchio_button_color)` for `.button`. But project `game_theme` still sets **literal** colours on `.inner_column a` and `.inner_column .button`, so changing only the variable does not recolour links or buttons inside `#inner_column`. This is inferred from the cascade and was not tested in a browser.
- **Outbound-link highlight:** game.css implements it as `.user_formatted a[rel~=nofollow]`, with a `:hover`/`:focus` `::after` label and a `:hover>img` box-shadow.
  - `.user_formatted` is present on the project description, devlog post bodies, comment bodies and the jam description.
  - The profile bio is `.user_profile.formatted`, without `.user_formatted`.
  - No third-party description iframe was in the sample, so click-to-activate rendering for those was **not** observed.
  - The only `.iframe_placeholder` on game-28 is the game's own click-to-play placeholder: `.game_frame > div.iframe_placeholder[data-iframe]`, which holds the escaped `<iframe>` until the visitor starts the game.
- **Support link:** `leafo.itch.io/support` returns HTTP 404, consistent with #1661's broken "send us a message" link.
- **Volunteer moderator:** "No Time To Play" shows a "Moderator" badge on `/t/3846998` (2024-06-17).
- **Showcase collections:** both are titled "Collection by leafo". Page 1 of CSS Showcase has 29 unique `data-game_id` values and page 1 of Cool Game Pages has 30. Both pages end with a "Next page" link (`?page=2`), so these are **page-1 counts, not totals**. The second pass counted at least 77 CSS Showcase entries over pages 1–3, and page 3 links to a page 4.
- **Mixed content:** MDN classifies `@font-face` and web fonts as blockable. It lists `background-image` as upgradable in one place and blockable in another (the page contradicts itself). An `http://` image therefore may be auto-upgraded, but an `http://` font is blocked.

### V.5 Verdicts

| Verdict | Facts |
|---|---|
| Confirmed | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 15, 16, 18, 19, 20, 21, 22, 24, 28, 29, 31, 32, 33, 34, 35, 36, 38, 40, 42, 43, 44, 45, 46, 47, 49 |
| Corrected | 13 ("without permission"), 14 (scope and mechanism), 17 (`!important` in theme), 23 (variable override doesn't recolour `.inner_column a`/`.button`), 25 (site headers are h2 outside `.formatted_description`), 26 (`.full_width` only when set), 27 (body rules still apply but are painted over; body still gets bg colour), 30 (game CSS is not reusable on jams beyond `#wrapper`), 37 (mixed-content detail), 39 ("about the updates", not "before"), 41 (other official profile mentions exist), 48 (editor wrappers documented only for jams), 50 (guideline covers ads and login walls, not overlays), 51 (raw jam page with inline host `<style>`) |
| Refuted | none |
| Unverifiable | none |

## Verification (2026-10-14), second pass

A third agent re-ran the adversarial check after the first verification run ended without returning its verdicts. Scripts are in `knowledge/evidence/scripts/docs-verify2/`. No browser tools, no login, GET only.

### W.1 Method

- **New requests (UTC 13:05–13:16):**
  - 15 GETs: `robots.txt` (unchanged), the CSS guide, `jam/gmtk-2025` and its `/entries`, `game-28` and one of its devlog posts, `leafo.itch.io`, `towerfall`, `jam/gamelike-jam-010` and its `/entries`, `static.itch.io/jam.css` and `user.css` (`?1791981660`), and `c/241703/css-showcase?page=2` and `?page=3`.
  - One 429, which succeeded on retry after 35 s.
  - Plus 1 GET of MDN "Mixed content".
- **Downloads from the first verification run reused:** the other docs, forum, update and Wayback files that run downloaded earlier in this session (`scratchpad/docs-verify/raw`). The second pass read them with its own parsers.

| Command | What it does |
|---|---|
| `OUT=./raw sh g.sh <name> <url>` | Polite fetch: browser User-Agent, 3 s pause, retry on 429. |
| `python -I an.py page.html '#wrapper' '.footer' ...` | Style blocks (length, SHA-1, `#wrapper`/`!important`/`@media`/`data:` counts), body `data-page_name`, and each selector's count, whether it sits inside `#wrapper`, and its ancestor path. |
| `python -I th.py page.html game_theme` | Selector list of a theme block, with `--itchio_*` and `!important` declarations. |
| `python -I fp.py topic.html N` | Forum posts: id, author, flag (`admin`/`owner`), date, body. |
| `python -I doc.py page.html` | Text of a `/docs` page. |
| `python -I cmp.py a.txt b.txt` | Word diff (ratio, word counts, SHA-1, non-equal opcodes). |
| `python -I jamsplit.py jam.html` | Splits `jam_theme` into the generated part and the host CSS. |

### W.2 Results

- **Guide is unchanged.**
  - My extraction gives the same word SHA-1 (`06604abe55bc`, 1,241 words) for the Wayback captures of 2026-06-13, 2026-06-17 and 2026-10-06, the first verification run's download and today's download.
  - Version history:
    - 2019-07 → 2021-02: two-word edits only.
    - 2021-02 → 2021-04: the access rules, the devlog note, the HTML-mode warning, and the email wording changed to "try to email … about the updates".
    - 2021-04 → 2026-05: only the social footer line changed.
    - 2026-05 → 2026-06: the jam sections were added.
  - The 10 heading anchors are exactly those listed in docs-47.
  - The offline copy differs from the online guide only in the TOC lines and the "Getting CSS access" section.
  - Word counts and ratios depend on the extraction method: mine are 1,241 vs 1,097 words, ratio 0.912 including Markdown bullets, against the first pass's 1,264/1,105 and 0.929.
- **Lengths as served include CR characters.** Older saved CSS keeps CRLF line endings:

  | Page | Style block | As served | After CRLF→LF |
  |---|---|---|---|
  | game-28 | `custom_css` | 10,569 | 10,203 |
  | towerfall | `custom_css` | 788 | 735 |
  | gmtk-2025 | `jam_theme` | 7,339 | 7,031 |

  gamelike-jam-010's host CSS, saved after the 2026-06 revamp, is LF-only.
- **Jam cap.** gamelike-jam-010 serves 1,904 generated chars + **20,411 host chars**, with balanced braces and no truncation. Its host had trimmed the CSS to fit after leafo set "20kb" on 2026-06-02. So the jam cap is at least 20,411 characters (likely 20 KiB = 20,480); it is not 20,000.
- **Jam subpages.**
  - gamelike-jam-010 `/entries` also has only a 252-char `jam_theme` (`:root` + `.page_widget` variables) and no `#wrapper`. That makes two jams where the host CSS is absent from `/entries`.
  - New-markup jam main pages (gmtk-2025, gamelike-jam-010) have **no `.footer` and no `#user_tools`**.
  - gamelike-jam-010 shows `#entries.grid_outer` (which ends in a `.itch_footer`) inside `#wrapper`; gmtk-2025 has no `#entries`.
  - `/entries` and `/results` have a `.footer` as a direct child of `body`.
- **Generated themes still contain `!important`:**
  - project `game_theme`: 8 declarations;
  - jam generated part: 6 (`.itch_footer` border-top, game-cell text colours, filter-picker colours);
  - profile `user_theme`: 0.
- **Static stylesheets:**
  - Each page type loads one: project and devlog pages `game.css`, profiles `user.css`, jam main pages `jam.css`, jam `/entries` `main.css`.
  - `jam.css` reads all 9 jam variables, for example `.button:hover{background:var(--itchio_button_hover_color, var(--itchio_button_color, …))}`.
  - The outbound-link rule `.user_formatted a[rel~=nofollow]` is in `game.css` only: `jam.css` and `user.css` have 0 `nofollow` rules.
- **Literal colours beat the variables.** Project `game_theme` sets literal `.inner_column a{color}` and `.inner_column .button{background-color;color}`. Profile `user_theme` sets literal `.user_page a,.footer a{color}`. The static CSS uses `a{color:var(--itchio_link_color, …)}` with lower specificity, so overriding only the variable will not recolour those links or buttons. This is inferred from the cascade, not tested in a browser.
- **Site h2 headers sit outside the description.** On project pages the site-generated `h2` headers (Purchase, Download, devlog, comments) are under `.left_col`, outside `.formatted_description`.
- **CSS Showcase is paginated:** 29 + 22 + 26 = **at least 77** unique entries on pages 1–3, and page 3 links to page 4.
- **No Time To Play** carries the forum "Moderator" flag (`author_flag owner`, `data-slug="moderator"`) on `/t/3846998`.
- **Mixed content (MDN):** MDN lists CSS `background-image` as upgradable in one place, while its blockable list includes "all cases in CSS where a `<url>` value is used". Fonts are blockable.

### W.3 Verdicts (second pass)

| Verdict | Facts |
|---|---|
| Confirmed | 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 15, 16, 18, 19, 20, 21, 22, 24, 28, 29, 33, 34, 35, 36, 38, 40, 42, 43, 44, 45, 46, 47 |
| Corrected | 13 ("without permission"), 14 (user-formatted content only; `game.css` only), 17 (8 `!important` in `game_theme`), 23 (literal colours on `.inner_column a`/`.button`), 25 (site h2 outside `.formatted_description`), 26 (`.full_width` only when set; `.jam_banner` is an `img`), 27 (body rules still apply but are painted over), 30 (game CSS is not generally reusable on jams), 31 (cap ≥ 20,411 chars, not 20,000), 32 ("Probably not"; 5120 is a community/assumed figure), 37 (mixed content), 39 ("about the updates"), 41 (other official profile mentions exist), 48 (editor wrappers documented only for jams), 49 (paginated, ≥ 77 entries), 50 (guideline is about ads and login walls), 51 (raw jam page with host `<style>` inside `.jam_content`) |
| Refuted | none |
| Unverifiable | none |
