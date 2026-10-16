# Evidence log — `itchcss`: itch.io's own stylesheets that custom CSS must coexist with

- **Date:** 2026-10-14 (all fetches and tests run this day)
- **Question:** what does itch.io itself ship (CSS bundles + theme-editor output) on profile, project, devlog and jam pages, and what does a custom rule need (selector strength, `!important`, scoping) to win against it?
- **Method:** `curl` (GET, browser UA, logged out) of public pages → list `<link rel=stylesheet>` / `<style>` → download the CSS bundles to a scratch dir → parse them with a small home-made CSS parser (`itchcss-tools/cssparse.py`, handles nesting + specificity incl. `:is/:not/:where`) → confirm behaviour by rendering the *real downloaded pages* with *real itch CSS* in **headless Edge 155** (network fully blocked, throwaway profile) and reading computed styles.
- **Nothing third-party is stored here.** Raw HTML/CSS stayed in the session scratchpad. This file holds only counts, selectors, numbers and my own test CSS (`itchcss-tools/tests/`).

## 1. Samples (all public, logged-out)

| key | URL | page type | stylesheet + style blocks in `<head>`, in order |
|---|---|---|---|
| profile_mirokshi | https://mirokshi.itch.io/ | profile (own, has custom CSS) | `static.itch.io/user.css` → `style#user_theme` → `style#custom_css` |
| profile_leafo | https://leafo.itch.io/ (itch founder) | profile (theme font Dosis) | `user.css` → `style#user_theme` → Google Fonts `<link>` |
| project_xmoon | https://leafo.itch.io/x-moon | project (has custom CSS) | `static.itch.io/game.css` → `style#game_theme` → `style#custom_css` |
| project_deltarune | https://tobyfox.itch.io/deltarune | project (theme font Comic Neue) | `game.css` → `style#game_theme` → Google Fonts `<link>` |
| project_cbr | https://creator-43.itch.io/game-07 | project with custom CSS | `game.css` → `game_theme` → GF link → `custom_css` |
| dl_7 | …/game-07/devlog/<id>/… | devlog post of the above | identical to project_cbr (same `custom_css`, sha1 prefix `450d343c3db9`, 154 chars) |
| devlog_post / devlog_index | https://creator-58.itch.io/game-23/devlog[/1473570/…] | devlog post / list | `game.css` → `game_theme` |
| 7 more devlog posts | from https://itch.io/devlogs | devlog | `game.css` → `game_theme` (1 of 7 had `custom_css`) |
| 9 jam pages | https://itch.io/jam/{lve-jam-2026-b-side, metroidvania-month-34, gdevelop-big-game-jam-10, women-game-jam-2026, xr-is-dead-halloween-jam-2026, trijam-394, vampire-horror-jam-3d-vol-3-halloween-edition, witchcraft-jam, untitled-game-jam-134} | jam overview | `static.itch.io/jam.css` → `style#jam_theme` (custom CSS, if any, is **appended inside `jam_theme`**; there is never a `custom_css` block) |
| jam_entries_mm34 | https://itch.io/jam/metroidvania-month-34/entries | jam sub-page | `static.itch.io/main.css` → tiny `style#jam_theme` (only vars on `.page_widget`), **no `#wrapper`, no custom CSS** |

Request budget: 38 itch requests in total (pages + 5 CSS bundles), 5 of them answered `429 Too Many Requests` (openresty) even at 3–6 s spacing — other crawlers shared the IP. A 30 s pause cleared it. Use ≥5 s spacing.

## 2. The bundles (downloaded 2026-10-14, version query `?1791970861` on every bundle = deploy timestamp ≈ 2026-10-14 09:41 UTC; the June 2026 export had `?1780793839`)

> *Second verification pass:* at 13:08 UTC the same day every page linked `?1791981660` (= 12:41 UTC). All five bundles were **byte-identical** to the 09:41 copies, with unchanged `Last-Modified` and `ETag`. The query is a deploy stamp that can change several times a day without any CSS change, so never hard-code it.

| bundle | served on | bytes (decoded) | style rules | Last-Modified | `@media print` | `prefers-reduced-motion` | `prefers-color-scheme` | `:focus-visible` | CSS nesting / `@layer` / `@supports` / `@container` |
|---|---|---|---|---|---|---|---|---|---|
| user.css | profiles | 71 824 | 632 | 2026-10-06 | 1 | **0** | 0 | 0 | none |
| game.css | project, devlog | 164 629 | 1 534 | 2026-10-06 | 3 | **0** | 0 | 1 (video facade only) | none |
| jam.css | jam overview | 71 053 | 633 | 2026-10-06 | 1 | **0** | 0 | 0 | none |
| main.css | itch.io site pages, jam sub-pages | 643 506 | — | 2026-10-12 | 41 | **0** | 0 | 0 | none |
| theme_editor.css | only for the logged-in owner (seen in the June 2026 owner export, absent logged-out) | 17 464 | 153 | 2026-08-25 | 0 | 0 | 0 | 1 | none |

All are `Cache-Control: max-age=86400`, `Access-Control-Allow-Origin: *`, gzip. No bundle uses `@layer` → custom CSS is never fighting cascade layers.

## 3. Media-query breakpoints (counts of rules inside each query)

| bundle | breakpoints (rule count) | what they change in the custom-CSS-relevant layout |
|---|---|---|
| user.css (profile) | max 800 (12), max 650 (11), max 600 (6), max/min 960 (2/2), min 1400, max 920, 1300, min 1020, min 1150, max 980, `print` | **800**: `.user_page.mode_column .columns` → block, game column becomes a horizontal scroller. **650**: `.game_grid_widget` font 14px (but `.user_page .game_grid_widget{font-size:1.1428em}` (0,2,0) wins → stays 16px), `.game_cell_tools` hidden. **960**: `.user_tools.hidden` fade only applies ≥960. Others = header/lightbox only. |
| game.css (project/devlog) | max 650 (33), **max 1000 (30)**, max 600 (24), max 960 (7), max 400 (7), max 1300 (3), print (3), min 960, min 650, max 900, max 700, min 1400, … | **1000**: `.inner_column` max-width 960→600px, `size_very_large` 19→16px, columns stack (`.right_col` screenshots `order:1` on top, `.left_col` `order:2`), footer static, screenshots become a horizontal strip, devlog `.split_columns` → block. **960**: `#user_tools` becomes a static full-width strip above `#wrapper`. **650**: `#user_tools` becomes a fixed bottom bar (50px, z 99), footer gets `padding-bottom:60px`. **600**: `.responsive .wrapper{padding:0}` (20px between 600–1000). **400**: `.buy_row` compact. |
| jam.css | max 650 (17), max 600 (13), max 820 (5), max 960 (2), max 700, min 960, … | **650**: `.jam_body` margins 10px, title 42→20px, tabs scroll. **820**: submit/countdown widget stacks. |

Measured (headless Edge, x-moon project page; `vw` = `innerWidth`):

| vw | `#user_tools` | `#wrapper` padding-x | `.inner_column` width / font | `.columns` | footer |
|---|---|---|---|---|---|
| 1476 | fixed, top-right, opacity 0 until JS | 0 | 960px / 19px | row, left 593 + right 367 | absolute bottom |
| 1176 | **absolute** (≤1300) | 0 | 960 / 19 | row | absolute |
| 956, 876 | **static strip**, bg `#525252` (= theme `--itchio_ui_bg_dark`), opacity 1 | 20px | 600 / 16 | column, right_col first | static |
| 616 | **fixed bottom bar** 50px, z 99 | 20px | 561 / 16 | column | static + 60px bottom padding |
| 492 (min headless width) | fixed bottom bar | **0** | 477 / 16 | column | static |

Profile (mirokshi, grid mode): grid `repeat(auto-fill,minmax(250px,1fr))` with a 10px column gap needs ≥770px of grid width for 3 columns (3×250+2×10) and ≥510px for 2; measured 3 columns at 920/921px grid width, 2 columns at 741/621/521px; content `max-width:960px;padding:0 20px`; `#user_tools` stays `position:fixed` top-right at every width (profile has no mobile bar). *(Corrected in verification: the original "2 columns at ≤741px" was a sample point, not the threshold.)*

## 4. Base styles of the key classes (selector → declarations that matter)

Profile (`user.css`):

| selector (specificity) | declarations |
|---|---|
| `body` (0,0,1) | `font-family:var(--itchio_default_font, Lato),sans-serif; font-size:14px; color:#222; background:#FAFAFA` (user.css only — jam.css uses `font-size:16px; background:white`; game.css only has the reset `font-size:13px; font-family:sans-serif` + `background:#eee`, Lato there comes from the theme's `.inner_column` stack) |
| `.user_page_wrap` (= `#wrapper`) | `display:flow-root; position:relative; padding-bottom:50px` (the footer lives in that 50px) |
| `.footer` | `position:absolute; bottom:0; left:0; right:0; border-top:1px solid #dadada; font-size:12px` — sibling of `.user_page`, inside `#wrapper` |
| `.footer .footer_inner` | `max-width:960px; padding:10px 20px; margin:0 auto` |
| `.inner_column` | `max-width:960px; margin:0 auto; padding:0 20px` |
| `.user_page .header` / `.text_header>h1` | `margin-bottom:20px` / `font-size:2.4286em; margin:40px 0 5px` (=34px) |
| `.user_page .user_profile.formatted` (0,3,0) | `font-size:1.1428em` (=16px); h1 2em, h2 1.5em, h3 1.25em, h4 1.125em; `.formatted p{margin:0 0 20px}`; `.formatted p, .formatted ul, .formatted ol{line-height:1.5}` (the bio container itself is `normal`) |
| `.game_grid_widget` | `display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); grid-gap:25px var(--itchio_grid_gap,10px); align-items:start; font-size:16px` |
| `.game_grid_widget .game_cell .game_title a.title` | `font-weight:bold; color:inherit; text-decoration:none` (hover underline) |
| `.user_page.mode_column .game_column` | `width:315px; margin-left:40px` (Column layout), `.columns>*{position:sticky;top:10px}` (both columns are sticky, which also makes each a stacking context; `position:static` at ≤800px) |
| `.user_page.has_banner .header .text_header` | `display:none` (banner replaces the name) |

Project / devlog (`game.css`; nearly every layout rule is prefixed `.responsive`, a `<body>` class):

| selector | declarations |
|---|---|
| `.inner_column` | `width:960px; margin:0 auto; position:relative; padding-bottom:40px; background:white; **overflow:hidden**` |
| `.inner_column.size_small/medium/large/very_large` | 11 / 13 / 16 / 19px (theme "font size"); `family_pixel` variants 8–40px |
| `.inner_column .footer` (`#view_game_footer`) | absolute bottom (≥1000px), `font-family:Lato; font-size:12px`, `.breadcrumbs a{color:inherit !important; opacity:.7}` |
| `.columns` / `.left_col` / `.right_col` | flex row / `flex:1;width:0;min-width:0` / `width:367px` |
| `.view_game_page .formatted_description` | `margin:0 20px 40px` |
| `.header.has_image` | `font-size:0`; `h1{display:none}` → with a banner the game title `<h1>` is gone (banner `<img alt>` carries the name) |
| `.button` | `height:35px; line-height:33px; border-radius:3px; font-weight:bold; background:var(--itchio_button_color,#FF2449); color:var(--itchio_button_fg_color,white)` |
| `.game_devlog_post_page .split_columns` | flex; `.game_metadata{width:307px}`; block at ≤1000 |
| `.user_formatted a[rel~=nofollow]:hover::after` / `:focus::after` | red "External link" badge (project + devlog only; description links get `rel="nofollow noopener"`) |

Jam (`jam.css`): `.jam_page_wrap{display:flow-root; min-height:calc(100vh - 50px)}`, `.view_jam_page .jam_body{max-width:960px; margin:40px auto; overflow:hidden}`, `.jam_title_header{font-size:2.625em; font-weight:900}`, grid footer `.view_jam_base_page .itch_footer`.

## 5. Fonts

| item | finding |
|---|---|
| Default stack | `body{font-family:var(--itchio_default_font, Lato),sans-serif}`; `--itchio_default_font` is never defined except `body.locale_ru{--itchio_default_font:LatoExtended}` (game.css) |
| Self-hosted @font-face (every bundle) | `Lato` 400, 400i, 700, 900 · `LatoExtended` 400, 400i, 700, 900 · `04b_03` (pixel family) · `icomoon` (icons). No `font-display`. No 300/500/600 or 700-italic faces → those are synthesized. |
| Theme font picker output | Profile: `.user_page{--itchio_font_family:X; font-family:X,Lato,LatoExtended,sans-serif}`. Project: `.inner_column{font-family:X,Lato,LatoExtended,sans-serif}` + class `family_<slug>` on `.inner_column`, plus a heading rule `.inner_column h1…h6{font-family:inherit; font-weight:bold|900; color:…}`. Jam: body font on `.jam_page_wrap{font-family:<Body>,Lato,LatoExtended,sans-serif}` and a **separate heading font** `.view_jam_page h1,…,h6{font-family:'<Heading>'}` (GDevelop jam: body Lato, headings 'Baloo 2' — the Google Fonts link is for the heading font). A non-Lato font adds **after the theme block**: `<link href="https://fonts.googleapis.com/css?family=<Name>:400,400italic,700,700italic">` (Google Fonts CSS API v1, 4 styles only). |
| Icon protection | `[class^="icon-"],[class*=" icon-"]{font-family:'icomoon' !important}` — a custom `#wrapper *{font-family:…}` leaves icons intact (tested). |

## 6. CSS custom properties

Defined by base CSS on `:root`: `--itchio_white_back #fff`, `--itchio_gray_back #F4F4F4`, `--itchio_bg_color`, `--itchio_body_color #222`, `--itchio_body_color_gray/_med/_light/_lighter`, `--itchio_border_color #dadada`, `--itchio_edge_border_color`, `--itchio_input_border_color`, **`--itchio_input_focus_color #361275`**, `--itchio_light_highlight`, `--itchio_warning_bg`, `--itchio_target_bg`, `--itchio_brand_color`, `--itchio_gutter_width 40px`. Re-defined (dark values) on `.header_widget.gray`.

Consumed but never defined by base (= hooks you can set): `--itchio_grid_gap` (column gap of every `.game_grid_widget`, default 10px; no theme sets it either), `--itchio_default_font` (except `body.locale_ru` in game.css), `--itchio_button_hover_color`, `--itchio_button_active_color`, `--itchio_button_border_color`, `--itchio_ui_bg_dark`. *(Verification note: the jam theme does set the three button vars on `.jam_page_wrap`, and the project theme sets `--itchio_ui_bg_dark` on `:root`, so only `--itchio_grid_gap` is unset on every page type.)*

Defined by the **theme output**:

| page | element | variables |
|---|---|---|
| profile | `:root` | `--itchio_ui_bg` |
| profile | `.user_page` (child of `#wrapper`) | `--itchio_font_family`, `--itchio_link_color`, `--itchio_gray_back`, `--itchio_border_radius` |
| project/devlog | `:root` | `--itchio_ui_bg`, `--itchio_ui_bg_dark` |
| project/devlog | `.wrapper` (**same node** as `#wrapper`) | `--itchio_font_family`, `--itchio_bg_color`, `--itchio_bg2_color`, `--itchio_bg2_sub`, `--itchio_text_color`, `--itchio_link_color`, `--itchio_border_color`, `--itchio_button_color`, `--itchio_button_fg_color`, `--itchio_button_shadow_color` |
| jam | `.jam_page_wrap` (**same node** as `#wrapper`) | `--itchio_border_radius`, `--itchio_link_color`, `--itchio_border_color`, `--itchio_button_color`, `--itchio_button_fg_color`, `--itchio_button_shadow_color`, `--itchio_button_border_color`, `--itchio_button_hover_color`, `--itchio_button_active_color` |
| jam sub-pages | `.page_widget` | link + button vars only |

But: the **project theme also hard-codes** the same colours per selector (`.inner_column a{color}`, `.inner_column .button{background-color;color;text-shadow}`), so overriding the variables does **not** recolour links/buttons on project pages (test P1/P2). On jam pages the theme uses only variables for links/buttons, so `#wrapper{--itchio_link_color:…}` works (test J3).

## 7. Theme-editor output: selectors and specificity

Profile `user_theme` (written with **native CSS nesting**: `.user_page{…; hr{…} .user_links .svgicon{…} …}` and `.game_grid_widget .game_cell{.game_thumb,.gif_overlay{…} .game_title a.title{…} …}`):

| selector (as resolved) | specificity | props | `!important` |
|---|---|---|---|
| `:root` / `body` | (0,1,0) / (0,0,1) | `--itchio_ui_bg` / `background-color` | no |
| `.user_page` | (0,1,0) | vars, `color`, `font-size` (%), `font-family` | no |
| `.user_page_wrap` | (0,1,0) | `background-image/-repeat/-position/-attachment` (panel image) | no |
| `.user_page a`, `.footer a` | (0,1,1) | `color` | no |
| `.footer` | (0,1,0) | `border-color` | no |
| nested `.user_page hr` | (0,1,1) | `background-color` | no |
| nested `.user_page .user_links .svgicon` | (0,3,0) | `fill` | no |
| nested `.game_grid_widget .game_cell .game_title a.title` | **(0,4,1)** | `color` | no |
| nested `.game_grid_widget .game_cell .game_text/.game_author/.game_platform/.game_genre/.web_flag/.game_thumb/.gif_overlay` | (0,3,0) | colours, `border-radius` | no |

Project `game_theme` (flat, ~4.7 KB, 60+ selectors): mostly (0,1,0)–(0,5,1). `!important` on: `.view_game_page .reward_row/.bundle_row{border-color}`, `.footer .svgicon, .view_game_page .more_information_toggle .svgicon{fill}`, redactor toolbar hover/active, comment markdown-toolbar button hover/active. Background image is inside `.wrapper{… /*! */ background-image:…; background-repeat:…; background-position:… /* */}`; `.inner_column{color; font-family; background-color}` is the content panel; `.inner_column ::selection` uses the link/button colour.

Jam `jam_theme` (flat, ~1.7–1.9 KB): **many `!important` colours**: `.view_jam_page .game_grid_widget .game_cell .game_text/.game_platform/.game_genre/.game_author a`, `.grid_outer .game_count/.footer_submissions/.powerd_by`, `.jam_filter_picker .filter_item(:hover/.active)`, `.grid_outer .itch_footer{border-top}`.

Base CSS `!important` that custom CSS must fight (complete list, 7/12/7 declarations in user/game/jam.css): `.user_page .purchased_games h2 a, .user_page .collection_row h2 a{color:inherit}` (user), `.inner_column .footer .breadcrumbs a{color:inherit}` (game), `.community_post_list_widget .community_post .post_votes a{color:inherit}` and `.game_community_preview_widget .community_topic_row .topic_author a{color:inherit}` (game — **2** community rules, not 3), `.form.buy_form_widget .checkout_btn .icon{font-size:19px}` (game), `.html_embed_widget .game_frame.maximized{width:100%;height:100%}` (game), `.jam_submitter_widget .countdown *{border-color:inherit}` (jam), and in all three: `.game_grid_widget .game_cell a.meta_tag{color:white}`, `.game_grid_widget .game_cell .meta_tag .sale_tag.reverse_sale{background:#fe4e50}`, `.header_widget.mobile_nav_visible .primary_header{padding-left:5px}`, `#lightbox_container .lightbox:not(dialog){width:auto;max-width:none}` (≤600px), icon font.

Max specificity in base CSS without IDs: (0,6,0) in user.css (`.user_page.mode_column .user_game_grid .game_cell:first-child:last-child`), **(0,6,1) in game.css** (`.html_embed_widget .game_frame.start_maximized.game_loaded:not(.maximized) iframe:fullscreen`), (0,5,1) in jam.css (site-header rules). *(Corrected in verification; the conclusion below is unchanged.)* The **only ID selectors** in any bundle are `#lightbox_container …` / `#lightbox_shroud` (outside `#wrapper`). ⇒ any `#wrapper …` selector (1,x,y) beats every non-`!important` base and theme rule for page content; `!important` is only needed against the `!important` rules listed above and against inline `style=""` attributes (profile `.game_thumb{background-color}` per game, x-moon comment avatars, `.star_fill{width}`).

## 8. Layers, focus, motion, print

z-index inventory (base CSS):

| z | selector | where |
|---|---|---|
| 1002 | `.popup_details` (game.css) | hover card |
| 1001 | `#lightbox_container`, `.lightbox` | modal dialogs |
| 1000 | `.skip_to_main`, `#lightbox_shroud`, `.html_embed_widget .game_frame.maximized` | |
| 999 | `.content_warning_widget` | content-warning overlay |
| 250 / 102 / 101 / 100 / 99 | site header drop menu / user panel / `.global_flash`, tooltip / `.header_widget .primary_header`, sticky header / header dropdown, `#user_tools` (project ≤650) | |
| 3 | `.game_header_widget` (project owner bar) | rule exists in game.css; not seen in logged-out HTML (owner-only is an inference; the profile owner export shows a different bar, `.user_profile_header_widget.header_widget`) |
| 2 | `#user_tools` (`.user_tools`), `.popup_details` (user.css) | |

Focus: the general ring is `:focus{outline-color:var(--itchio_input_focus_color)}` (0,1,0) plus `.button:focus{outline-color:#361275}` (hard-coded); outline-style comes from the UA (`auto`). Computed on a live-profile link: `rgb(54,18,117) auto 1px` — dark purple, poor contrast on dark themes. Other focus rules (same in user/game/jam.css): `.user_formatted .spoiler:focus{outline:0}` (spoilers in bios and descriptions get **no** ring), `.button.disabled:focus{outline:0}`, `.form input[type=range]:focus{outline:2px solid var(--itchio_input_focus_color)}`, `.skip_to_main:focus{top:5px;left:5px}`, `.dark_theme .button:focus{outline-color:white}`.

Animations: keyframes `popin, bouncein, loader-left, loader-right, pulse_opacity, spin, bounce, drop_down, popout, heartbeat, intro, lightbox_intro, scroll_background` (+ `shine` referenced). Transitions are 0.1–0.25 s UI fades (`.user_tools`, `.gif_overlay`, `.game_cell_tools`, lightbox intro, vote buttons), plus one 0.4 s fade on the embed `.fullscreen_btn` (game.css). Animations in all three bundles: `intro`/`lightbox_intro`/`bouncein` 0.2 s, `drop_down`/`popout` 0.25 s, `heartbeat` 0.3 s, `bounce` 0.5 s, and the infinite 0.8 s `loader-left`/`loader-right` spinner. `shine` is used as `animation:shine 5s ease-in-out infinite` by `.winter_sale_active .index_game_cell_widget .sale_flag:before` in game.css, but `@keyframes shine` is only defined in main.css. **No `prefers-reduced-motion` anywhere.** Print: only `.header_widget{display:none}` (all three bundles) and two lightbox shadow resets (game.css only).

## 9. Page chrome outside `#wrapper` (logged out)

| page | before `#wrapper` | inside `#wrapper` |
|---|---|---|
| profile | `ul#user_tools.user_tools.hidden` (Follow button → login link) — fixed top-right, z 2, `opacity:0` until JS removes `.hidden` | `.user_page` + `.footer` (footer is a direct child of `#wrapper`) |
| project / devlog | `ul#user_tools` (Follow, Add to collection, related games …) — fixed (>1300), absolute (961–1300), static strip (≤960), fixed bottom bar (≤650) | `#inner_column` → `#header`, `#view_game_<id>`, `#view_game_footer.footer` (footer inside `.inner_column`) |
| jam | full itch site header `div.header_widget.jam_layout_header_widget.gray` (the div is 50px, `position:relative`, z-index auto; its child `.primary_header` carries `z-index:100` and the `--itchio_ui_bg` background) containing `a.skip_to_main` and an `<h1 class="title">` logo, so a jam page has **two** visible `h1` (logo + `h1.jam_title_header`). The skip link's target `#maincontent` does not exist in the served HTML (also missing on every jam sub-page checked: entries, results, rate, community, feed, topic, submit). *Second pass:* itch's `bundle.min.js` repairs it on load: `init_JamLayoutHeader` runs the shared header constructor, which retargets the link to the first `.page_widget` that has an id (on overviews `.view_jam_page#view_jam_<id>`, inside `#wrapper`) and sets `tabindex=-1`, or assigns `id="maincontent"` to that element. The link is dead only without JS. | `.view_jam_page` → `.jam_banner_outer`, `.jam_body` (no `.footer`) |
| any | `body` classes: `locale_en`, `<type>_layout_widget`, `layout_widget`, `responsive`, `no_theme_toggle` (hides the site dark-mode toggle); no `dark_theme` class seen | |

Headers: no `Content-Security-Policy` on profile, devlog, jam; project pages only send `frame-ancestors 'self' https://itch.io` → no restriction on external styles/fonts/images.

## 10. Headless-browser tests (Edge 155, real page HTML + real itch CSS, network blocked)

| id | page | custom CSS | result |
|---|---|---|---|
| T1 | profile | `#wrapper .game_title a{color:red}` vs theme (0,4,1) | **red** — ID wins |
| T2 | profile | `.game_grid_widget .game_cell .game_text{color:green}` (0,3,0) = theme | **green** — later sheet wins ties |
| T3 | profile | `.game_genre{color:blue}` (0,1,0) | theme colour stays |
| T4a/b | profile | `#wrapper .collection_row h2 a{color:red}` / same with `!important` | `inherit` wins / red wins |
| T5 | profile | `#wrapper{background:rgb(1,2,3)}` | `background-image:none`, repeat→`repeat`, attachment→`scroll` (panel image wiped) |
| T6a/b | profile | `#wrapper{--itchio_link_color:red}` / `#wrapper .user_page{--itchio_gray_back:…}` | var on `.user_page` stays `#ffc857` / changed |
| T7 | profile | `#wrapper{--itchio_input_focus_color:#ffc857}` | focused link outline → gold |
| T8 | profile | `#wrapper{--itchio_grid_gap:30px}` | grid `column-gap:30px` |
| T9 / T9b | profile | `@import` first in `custom_css` / `@import` after a rule | applied / **dropped from CSSOM** |
| T12 | profile | imported `#wrapper .user_profile{color:1}` + later own rule `{color:2}` | own rule wins (imported sheet loses ties) |
| icons/inline | profile | `#wrapper *{font-family:serif}`; `#wrapper .game_thumb{background-color}` | icons stay `icomoon`; inline `style` wins unless `!important` |
| Z | profile (grid layout) | fixed `.custom-cover` z 5000, with/without `#wrapper{isolation:isolate}` | without: covers `#user_tools` button; with: button on top. *(Verification: on a Column-layout profile (leafo, `mode_column`), a layer **inside a column** (bio element, `.user_profile::after`) stays under the button even without isolation, because `.columns>*{position:sticky}` makes each column a stacking context. Second pass: a layer on `#wrapper::after` itself covers the button on **both** layouts without isolation, and isolation fixes both. So the advice to isolate holds for every layout.)* |
| KF | profile | `@keyframes spin{…opacity…}` | replaces itch's own `spin` (rotate) globally |
| P1/P2 | project | `#wrapper{--itchio_button_color;--itchio_link_color}` | buttons/links keep theme colours (hard-coded `.inner_column` rules) |
| P3 | project | `#wrapper{background:…}` | `background-image:none` (project image is on `.wrapper` = `#wrapper`) |
| P5/P6 | project | focus var | button focus stays `#361275` (hard-coded); link focus follows var |
| sticky | project | sticky element in description | broken under `.inner_column{overflow:hidden}`; works with `#wrapper #inner_column{overflow:clip}` (still bounded by its own parent box: with a short `.formatted_description` it scrolls away once the parent does — verification measured -255px at scrollY 1200 with a short parent, 0px at scrollY 400–1600 with a 5000px parent) |
| bodybg | project | none | `body` stays itch `#eee` (theme paints `.wrapper` only); `#wrapper` `min-height:0` → short pages show `#eee` below |
| J1/J2 | jam | `#wrapper .game_text{color}` / with `!important` | theme `!important` wins / custom wins |
| J3 | jam | `#wrapper{--itchio_link_color;--itchio_button_color}` | links and join button recoloured |
| imports | jam (GDevelop jam) | its own `@import` (appended after theme rules inside `jam_theme`) | `jam_theme.sheet` contains **0** import rules → the jam's Google-Font import never loads |
| verbatim | profile (own) | served `style#custom_css` vs the owner's local minified file | identical except a trailing newline (4 725 vs 4 726 chars): itch serves the CSS verbatim — no auto-scoping, no minifying, `>` and quotes not escaped |

## 11. Reproduce

```sh
export WORK=<scratch dir>              # never the repo
sh itchcss-tools/fetch.sh              # pages + bundles into $WORK/raw (≥5 s spacing)
python -I itchcss-tools/analyze.py $WORK/raw/user.css          # breakpoints, fonts, vars, counts
python -I itchcss-tools/dump.py $WORK/raw/game.css z|important|focus|trans|vardefs
python -I itchcss-tools/keyspec.py $WORK/raw/{user,game,jam}.css # max specificity per key class
# theme blocks: cut <style id="user_theme|game_theme|jam_theme"> to $WORK/themes/*.css, then
python -I itchcss-tools/themespec.py $WORK/themes/profile_mirokshi.css
# browser tests (copy itchcss-tools/tests/* to $WORK/tests first):
python -I itchcss-tools/mkharness.py $WORK/raw/profile_mirokshi.html $WORK/tests/profile_t1.html $WORK/tests/profile_t1.css $WORK/tests/probe_profile_t1.js
sh itchcss-tools/run.sh profile_t1.html 1400 900
# jam: pass mode "jam" (appends CSS inside jam_theme); "keep" leaves the page's own CSS
```

## Verification (2026-10-14)

Adversarial re-check of facts itchcss-01…53 by a second agent, from primary sources only (no browser-pane tools, no reuse of the first agent's downloads or harness).

**Method.** Re-fetched 12 pages + 5 bundles myself (17 itch GETs, 6 s spacing, browser UA, logged out, all `200`): `mirokshi.itch.io/`, `leafo.itch.io/`, `leafo.itch.io/x-moon`, `tobyfox.itch.io/deltarune`, `creator-43.itch.io/game-07` (+ its devlog post 1703536), `creator-58.itch.io/game-23/devlog` (+ post 1473570), `itch.io/jam/{metroidvania-month-34, gdevelop-big-game-jam-10, lve-jam-2026-b-side}`, `itch.io/jam/metroidvania-month-34/entries`, `static.itch.io/{user,game,jam,main,theme_editor}.css?1791970861`. Also read (not re-fetched) the jam crawler's same-day raw HTML of 22 jam overviews and 15 jam sub-pages to widen the jam sample, and the caniuse `css-nesting.json` from GitHub. Behaviour was re-tested with my own harness (`itchcss-tools/verify/build.py` + `run.sh`, headless Edge 155, throwaway profile, `--host-resolver-rules="MAP * ~NOTFOUND"`) and my own test CSS/probes (`itchcss-tools/verify/v_*.css|js`).

```sh
export WORK=<scratch dir>; mkdir -p $WORK/raw $WORK/tests; cp itchcss-tools/verify/v_* $WORK/tests/
sh itchcss-tools/verify/fetch1.sh $WORK/raw profile_mirokshi.html https://mirokshi.itch.io/   # one GET per call, sleeps 6 s
python -I itchcss-tools/verify/heads.py $WORK/raw/*.html        # <link>/<style> order, body classes, #wrapper
python -I itchcss-tools/verify/build.py $WORK/raw/profile_mirokshi.html $WORK/tests/a.html $WORK/tests/v_prof_a.css $WORK/tests/v_prof_a.js replace
sh itchcss-tools/verify/run.sh a.html 1400 900                   # modes: replace | jam (append inside jam_theme) | keep | none
```

**Verification test results** (all reproduced 2026-10-14):

| test | page | result |
|---|---|---|
| v_prof_a | mirokshi | ID rule beats nested theme (0,4,1) → `rgb(255,0,1)`; equal (0,3,0) custom wins tie; (0,2,0) loses; collection `h2 a` needs `!important`; `#wrapper{--itchio_link_color}` leaves `.user_page` at `#ffc857`; `#wrapper .user_page{--itchio_gray_back}` works; `--itchio_grid_gap:33px` → column-gap 33px, row 25px; leading `@import` = 1 CSSImportRule and applied; imported rule loses tie to own rule; footer `rgb(34,34,34)`/Lato/12px; focus ring follows `--itchio_input_focus_color` |
| v_prof_b | mirokshi | `@import` after a rule → absent from CSSOM; `#wrapper{background:…}` → image `none`, repeat `repeat`, attachment `scroll` |
| v_imp_tie | mirokshi | imported `.game_grid_widget .game_cell .game_text` beats the theme's identical selector (the import sits after the theme) |
| v_prof_none / v_leafo_none | both profiles, 5 widths | `#wrapper` flow-root/relative/50px; footer absolute, 34px tall; bio 16px (20px at 125%); bio h1 32px, h2 24px; `p` line-height 1.5; grid 3→2 columns between 921 and 741px grid width; grid font 16px at 576px; leafo (`mode_column`) game grid becomes a flex scroller at 756px |
| v_proj_a | x-moon, deltarune, cbr | vars on `#wrapper` do not change `.buy_btn`/description links; bg shorthand → image none; x-moon button focus stays `rgb(54,18,117)`, link focus gold; focused nofollow link shows the `"External link"` badge |
| v_proj_after | x-moon | `#wrapper .formatted_description a::after{content:…}` replaces the badge text but keeps the red background and `position:absolute` of the badge |
| v_proj_w | x-moon, 9 widths | `#user_tools` fixed (vw 1476) → absolute (1176, 976) → static strip `#525252` (956, 876) → fixed bottom bar z 99, 50px (636…496); footer absolute >1000, static ≤1000, `padding-bottom:60px` ≤650; `.inner_column` 960/19px → 600/16px ≤1000; wrapper padding 0 / 20px (601–1000) / 0 (≤600); screenshots `nowrap` + `overflow-x:auto` ≤1000 |
| v_sticky2 | x-moon | sticky in description: `overflow:hidden` → -262/-662/-1462px; `overflow:clip` → 0px (5000px-tall parent) |
| v_bodybg | deltarune, x-moon, mirokshi, mm34 | project body `rgb(238,238,238)`, `#wrapper` min-height 0; profile body = theme BG; jam body = theme BG and `#wrapper` min-height 711px at a 761px viewport |
| v_misc / v_z_* | leafo, mirokshi | `@keyframes spin` override replaces the built-in rotate; icons stay `icomoon` under `#wrapper *{font-family:serif}`; inline `.game_thumb` colour wins unless `!important`; z 5000 overlay covers Follow on mirokshi (grid) without isolation, not with it; on leafo (column layout) never |
| v_jam (mode jam) | lve-jam | `#wrapper .game_text` loses to theme `!important`, wins with `!important`; `--itchio_button_color` on `#wrapper` recolours `.join_jam_btn`; `@font-face` placed after the theme rules is registered in `document.fonts`, an `@import` placed there is not; header outside `#wrapper`, `.primary_header` 50px z 100 bg = `--itchio_ui_bg`; `.jam_body` 960px / `40px auto` / overflow hidden → 10px margins at vw 576; title 42px/900 → 20px |
| v_jam_link | lve-jam | inserted `.jam_content` link and the host links follow `#wrapper{--itchio_link_color}`; title/tab links use the text colour |
| v_jam_bg | lve-jam | `#wrapper{background:…}` wipes the jam theme's `.jam_page_wrap` background image too |
| v_imports (keep) | gdevelop jam, mirokshi | jam_theme: 27 rules, 0 imports although `@import` text is at offset 1733; profile custom_css: 2 CSSImportRules (Google Fonts + external service) |

**Wider jam sample (jam crawler's same-day files):** 22 jam overviews (one more URL was a 404) — every one links `jam.css` + one `style#jam_theme`, never `style#custom_css`; 7 of 22 append custom CSS after the theme (gbjam-15, gdevelop-big-game-jam-10, gmtk-2025, kenney-jam-2025, lowrezjam-2025, metroidvania-month-34, mini-jam-221-autumn); only gdevelop's contains `@import`. 15 jam sub-pages (`/entries`, `/results`, `/rate/<id>`, `/community`, `/feed`, a topic, `/submit`) — all link `main.css`, have no `#wrapper` and at most the 252-char variable block.

**Verdicts:**

| id | verdict | note |
|---|---|---|
| 01 | confirmed | 1000px breakpoint only in game.css; jam sub-pages use main.css on 15/15 |
| 02 | confirmed | |
| 03 | corrected | game.css max non-ID specificity is (0,6,1), not (0,6,0); conclusion holds |
| 04 | confirmed | also nested `.user_page .game_column/.purchased_games/.collection_row{border-color}` (0,2,0) |
| 05 | corrected | no support = before Chrome/Edge 112, Firefox 117, Safari 16.5 (all nested rules dropped, plain declarations kept); Chrome 112–119 / Safari 16.5–17.1: `hr{}` and, by the old parse, the rules after it inside `.user_page` are dropped; game-card rules survive — inferred, not tested in old browsers |
| 06 | confirmed | 7/22 jams with custom CSS, 0 `custom_css` blocks |
| 07 | corrected | verified on the one jam with `@import`; "never" is inferred (open question: does the editor ever hoist it?); `@font-face` workaround verified |
| 08 | confirmed | |
| 09 | confirmed | both halves tested |
| 10 | confirmed | sha1 `450d343c3db9`, 154 chars; theme block also identical |
| 11 | confirmed | 15 sub-pages |
| 12 | confirmed | |
| 13 | confirmed | 3 projects |
| 14 | confirmed | also documented in the official guide (Theme variables) |
| 15 | confirmed | |
| 16 | confirmed | 3 projects + 3 devlogs |
| 17 | confirmed | |
| 18 | corrected | 2 community rules, not 3; complete list in section 7 |
| 19 | confirmed | jam inline thumbs appear on overviews that list entries (e.g. trijam-393: 41) |
| 20 | corrected | also applies to jams (`.jam_page_wrap`) |
| 21 | confirmed | |
| 22 | confirmed | |
| 23 | corrected | threshold is 770px of grid width (3 cols) and 510px (2 cols); 16px holds at 100% theme size (20px at 125%) |
| 24 | corrected | only `--itchio_grid_gap` is unset on every page type |
| 25 | confirmed | `.dark_theme .button:focus{outline-color:white}` also exists, but no page had `dark_theme` |
| 26 | corrected | motion also includes a 0.4s embed-button fade and an infinite `shine` (sale flag; keyframes not in game.css) |
| 27 | corrected | OS dark mode: verified no effect; logged-in site dark mode: unverified |
| 28 | confirmed | |
| 29 | corrected | holds for grid-layout profiles; Column-layout profiles already trap z-index inside the sticky columns |
| 30 | confirmed | |
| 31 | confirmed | |
| 32 | confirmed | |
| 33 | confirmed | |
| 34 | corrected | missing target also on all 15 jam sub-pages; a JS-added target is not ruled out |
| 35 | confirmed | |
| 36 | confirmed | needs a parent taller than the scroll distance |
| 37 | confirmed | |
| 38 | confirmed | wrapper padding is also 0 above 1000px |
| 39 | corrected | both columns (not only the game column) are sticky in Column layout |
| 40 | confirmed | |
| 41 | corrected | body rule differs per bundle (user 14px #FAFAFA, jam 16px white, game 13px sans-serif + #eee); `locale_ru` var only in game.css |
| 42 | corrected | jam font picker writes a heading-font rule; project themes also emit a heading rule |
| 43 | confirmed | jam theme also emits `.jam_page_wrap{font-size:100%}` |
| 44 | confirmed | |
| 45 | confirmed | devlog posts keep a visible `.post_header h1` |
| 46 | confirmed | the override replaces only the text; the red box and position remain |
| 47 | corrected | the number in `#game_devlog_post_<id>` is an internal widget id, not the post id in the URL |
| 48 | confirmed | no `<meta http-equiv>` CSP either |
| 49 | confirmed | version 1791970861 = 2026-10-14 09:41 UTC while Last-Modified is 2026-10-06 → the query tracks deploys, not file changes |
| 50 | confirmed | |
| 51 | corrected | profile owner chrome is `.user_profile_header_widget.header_widget` (+ `theme_editor.css`); `.theme_editor_open .user_tools{display:none}` is in game.css |
| 52 | confirmed | |
| 53 | corrected | bio paragraphs have `line-height:1.5` |

## Verification (2026-10-14), second pass

A second adversarial re-check of itchcss-01…53 by a separate agent. It used fresh downloads, its own parser (`itchcss-tools/verify2/cssmini.py`: independent tokenizer, nesting resolution, specificity incl. `:is/:not/:where/:has`), its own harness and its own test CSS. It reused nothing from the earlier passes except their test *ideas*. No browser-pane tools were used.

**Requests:** 26 GETs to itch.io / static.itch.io between 13:06 and 13:22 UTC. Spacing was 6 s, with a browser UA, logged out, honouring robots.txt. One `429` on `/entries` cleared after a 25 s pause. Also 1 GET to raw.githubusercontent.com for caniuse.

- Pages: `itch.io/robots.txt`; `mirokshi.itch.io/`, `leafo.itch.io/`; `leafo.itch.io/x-moon`, `tobyfox.itch.io/deltarune`, `creator-43.itch.io/game-07` (+ `/devlog/<id>/<post>`); `creator-58.itch.io/game-23/devlog` (+ `/1473570/…`); `itch.io/jam/{metroidvania-month-34, gdevelop-big-game-jam-10, lve-jam-2026-b-side, gmtk-2025}`, `itch.io/jam/metroidvania-month-34/entries`, `itch.io/jam/gmtk-2025/results`, `itch.io/jam/gmtk-2025/rate/3765634`; `itch.io/docs/creators/css-guide`.
- Assets: `static.itch.io/{user,game,jam,main,theme_editor}.css?1791981660` and `static.itch.io/{lib,bundle,react}.min.js?1791981660` (the JS was grepped only).

```sh
export WORK=<scratch dir>; mkdir -p $WORK/raw $WORK/tests $WORK/themes; cp itchcss-tools/verify2/tests/* $WORK/tests/
sh itchcss-tools/verify2/get.sh profile_mirokshi.html https://mirokshi.itch.io/        # one GET, sleeps 6 s
python -I itchcss-tools/verify2/heads.py $WORK/raw/*.html                              # link/style order, body classes, #wrapper
python -I itchcss-tools/verify2/audit.py $WORK/raw/game.css ids maxspec important media kf z focus fonts vars trans queries
python -I itchcss-tools/verify2/themes.py $WORK/raw $WORK/themes                       # theme blocks: nesting, max specificity, !important
python -I itchcss-tools/verify2/mk.py $WORK/raw/profile_mirokshi.html a.html itchcss-tools/verify2/tests/w_prof_a.css itchcss-tools/verify2/tests/w_prof_a.js replace
sh itchcss-tools/verify2/run.sh a.html 1400 900     # headless Edge 155, throwaway profile, every host -> NOTFOUND
# mk.py modes: replace (custom_css), jam (append inside jam_theme), keep, none (empty custom_css)
```

**Test results (all run on 2026-10-14, headless Edge 155):**

| test (page, mode) | result |
|---|---|
| w_prof_a (mirokshi, replace) | `#wrapper .game_title a` → `rgb(255,0,7)` over theme (0,4,1). Equal (0,3,0) `.game_text` → custom wins. `.game_genre` (0,1,0) → theme `rgba(238,243,255,.5)` stays. Imported (0,3,0) `.game_platform` beats the theme. Imported `#wrapper .user_profile` loses to the later own rule (`rgb(2,2,2)`). `#wrapper{--itchio_link_color}` leaves `.user_page` at `#ffc857`; `#wrapper .user_page{--itchio_gray_back}` applies. `--itchio_grid_gap:31px` → gap `31px / 25px`. Non-`!important` thumb colour loses to inline `rgb(0,0,0)`. Focused bio link outline `rgb(255,200,87) auto 1px`. CSSOM: `CSSImportRule` first. |
| w_prof_b (mirokshi) | A rule then `@import` → no import in CSSOM, import not applied. `#wrapper{background:rgb(1,2,3)}` → image `none`, `repeat`, `scroll`, `0% 0%` (baseline: image, `no-repeat`, `fixed`, `50% 0px`). Custom `@keyframes spin{opacity}` → an element inside **and** outside `#wrapper` animate opacity (baseline: `rotate(0→360deg)`). |
| w_z_* (mirokshi grid, leafo column) | Layer on `#wrapper::after` (fixed, z 5000): covers the Follow `a.action_btn` on **both** profiles without isolation; with `#wrapper{isolation:isolate}` the button is hit on both. Layer on `.user_profile::after` (inside a column): covers on mirokshi (grid), not on leafo (sticky columns). `#user_tools` is before `#wrapper`, `fixed`, z 2, opacity 0, `translateY(-20px)`, `pointer-events:none` on the `ul`. |
| w_leafo (leafo, replace) | `#wrapper .collection_row h2 a{color}` loses; the link shows the h2's custom colour (inherit `!important`). `#wrapper *{font-family:serif}` → text serif, `.icon.icon-link` stays `icomoon`. `!important` beats the 61 inline thumb colours. |
| w_plays (both profiles, none, 6 widths) | `#wrapper` flow-root / relative / `padding-bottom:50px`. Footer is a direct child of `#wrapper`, absolute 0/0/0, 34px tall, `rgb(34,34,34)` Lato 12px, links = theme link colour. mirokshi (100%): `.user_page` 14px, bio 16px, bio h1 32px, h2 24px (`0 0 10px`), name h1 34px/700/`40px 0 5px`, `.inner_column` max 960 + 20px padding. Grid: 3 cols at 960/921px grid width; 2 cols at 741/701/621/521px; **1 col at 437px** (narrowest headless viewport, 492px). Card text 16px at vw 576. leafo (125%): user_page 17.5px, bio 20px, bio `p` `0 0 20px` / line-height 30px (=1.5). Column layout ≥800: `.columns` flex, `.game_column` 315px, `margin-left:40px`, sticky top 10px (profile column also sticky); ≤800: block, static, `.user_game_grid` becomes flex. `#user_tools` opacity 0 + `translateY(-20px)` at vw ≥ 960, opacity 1 below. |
| w_proj_a (x-moon, deltarune, cbr) | Vars on `#wrapper` resolve to the test value, but `.buy_btn` / `.direct_download_btn` stay at the theme colour and description links (`rel="nofollow noopener"`) keep the theme link colour. Background shorthand → image `none`. x-moon `.buy_btn` focus `rgb(54,18,117) auto`; nofollow link focus = var. Focused nofollow link: `::after` `"External link"`, red bg, absolute, z 1. Banner projects: `#header.has_image h1` `display:none` → 0 visible h1; banner `alt` = title. |
| w_proj_after (x-moon) | `#wrapper .formatted_description a::after{content:"custom"}` → content replaced; red background and `position:absolute` remain. |
| w_pw (x-moon, none, 11 widths) | `#user_tools`: fixed (vw 1476) → absolute (1176/1000/976) → static strip, `rgb(82,82,82)` (vw 960 still opacity 0 because `min-width:960px` matches, 876 opacity 1) → fixed bottom 50px z 99 (636…492). `#wrapper` padding-x 0 (>1000), 20px (601–1000), 0 (≤600). `.inner_column` 960/19px/`overflow:hidden`/`padding-bottom:40px` → 600 max/16px/`padding-bottom:0` at vw ≤1000. Columns stack with `.right_col` order 1. Screenshots `nowrap` + `overflow-x:auto`. Footer absolute → static (≤1000), `padding-bottom:60px` (≤650). Body `rgb(238,238,238)`, `sans-serif`, 13px; `#wrapper` min-height 0. |
| w_st_* (x-moon) | Sticky element at the top of a 5000px-tall description: `overflow:hidden` → tops -262/-1062/-2262 at scrollY 400/1200/2400; `#wrapper #inner_column{overflow:clip}` → 0/0/0. `#wrapper .footer .svgicon{fill}` loses to the theme's `!important`; with `!important` it wins. |
| w_jam (lve-jam, jam mode, vw 1376 / 576) | `#wrapper .game_text` loses (`rgb(100,97,84)`), wins with `!important`. `#wrapper{--itchio_link_color;--itchio_button_color}` recolours the description link and `.join_jam_btn`. Inside `jam_theme`: 17 style rules + 1 `CSSFontFaceRule`, **0** import rules; `CustomX` is in `document.fonts`. Header outside/before `#wrapper`: outer div 50px, relative, z auto; `.primary_header` 50px, z 100, bg = `--itchio_ui_bg`. Skip link href `#maincontent`, target absent (no JS). Visible h1: `title` + `jam_title_header`. `#wrapper` min-height = 100vh − 50px. `.jam_body` 960px / `40px auto` / hidden → 10px margins at vw 576. Title 42px/900 → 20px. |
| static | `custom_css` of mirokshi = local `dist/main.min.css` minus a trailing newline (4725 / 4726 chars), `>` unescaped. cbr project and devlog `custom_css` identical (154 chars, sha1 `450d343c3db9`). gmtk-2025 jam CSS tail keeps comments and unscoped `img{…!important}`. gdevelop jam `@import` at offset 1733 of `jam_theme`. `/entries`, `/results`, `/rate/<id>`: `main.css`, no `#wrapper`, 252-char `jam_theme` (`:root{--itchio_ui_bg}` + `.page_widget` vars). No `Content-Security-Policy` header or meta on profile/devlog/jam (they send `X-Frame-Options: SAMEORIGIN`); projects send `frame-ancestors 'self' https://itch.io`. `lib/bundle/react.min.js` have 0 `dark_theme`, `prefers-color-scheme` or `matchMedia`. `bundle.min.js` retargets the skip link (see §9). |

**Verdicts (second pass):**

| id | verdict | note |
|---|---|---|
| 01 | corrected | structure holds (also `/results` and `/rate` → main.css); version query moved to `?1791981660` the same day with byte-identical files |
| 02 | confirmed | no itch `<style>` after `custom_css` on 12 pages |
| 03 | corrected | game.css max (0,6,1); main.css (not loaded where `#wrapper` exists) has other IDs |
| 04 | confirmed | |
| 05 | corrected | Chrome/Edge 112–119 and Safari 16.5–17.1 keep the `.`-prefixed game-card rules; only Chrome <112 / FF <117 / Safari <16.5 drop all nested rules; parse details inferred |
| 06 | confirmed | 3 of 4 overviews carry appended custom CSS; never `custom_css` |
| 07 | corrected | "never" holds as long as itch appends after the theme; reproduced with my own `@import` and `@font-face` |
| 08 | confirmed | |
| 09 | confirmed | |
| 10 | confirmed | |
| 11 | confirmed | also `/results` and `/rate/<id>` of gmtk-2025 |
| 12 | confirmed | |
| 13 | confirmed | |
| 14 | confirmed | live guide still documents the vars on `#wrapper` (`.jam_page_wrap`) |
| 15 | confirmed | |
| 16 | confirmed | now tested (svgicon fill) |
| 17 | confirmed | |
| 18 | corrected | 2 community rules, not 3 |
| 19 | confirmed | x-moon now 37 inline avatars |
| 20 | confirmed | |
| 21 | confirmed | |
| 22 | confirmed | |
| 23 | corrected | 1 column below 510px of grid width (phones) |
| 24 | corrected | only `--itchio_grid_gap` is unset on every page type |
| 25 | corrected | spoilers and disabled buttons have `outline:0`; range inputs have their own outline |
| 26 | corrected | the claim holds; the detail's motion inventory was incomplete |
| 27 | corrected | static evidence covers OS dark mode for logged-out visitors; logged-in site dark mode unverified |
| 28 | confirmed | |
| 29 | confirmed | earlier "never on Column layout" applies only to layers inside a column |
| 30 | confirmed | |
| 31 | confirmed | |
| 32 | confirmed | |
| 33 | corrected | z 100 and the background are on `.primary_header`, not the outer div |
| 34 | corrected | JS (`bundle.min.js`) retargets the link to `.view_jam_page`; dead only without JS |
| 35 | confirmed | |
| 36 | confirmed | |
| 37 | confirmed | |
| 38 | confirmed | |
| 39 | corrected | both columns sticky; `.user_game_grid` becomes the scroller |
| 40 | confirmed | |
| 41 | corrected | body rule differs per bundle |
| 42 | corrected | jam picker font goes to headings |
| 43 | confirmed | |
| 44 | confirmed | |
| 45 | confirmed | devlog posts keep a visible `.post_header h1` |
| 46 | confirmed | mechanics verified; the policy reading is an inference |
| 47 | corrected | `<id>` is an internal widget id |
| 48 | confirmed | |
| 49 | confirmed | two deploy stamps in one day without file changes |
| 50 | confirmed | |
| 51 | corrected | `.theme_editor_open .user_tools{display:none}` lives in game.css; profile owner bar is `.user_profile_header_widget` |
| 52 | confirmed | |
| 53 | corrected | bio `p` line-height 1.5 |
