# Evidence log: `crawljam` (live DOM of itch.io jam pages, logged out)

- **Date:** 2026-10-14 (all fetches between ~10:05 and ~10:40 UTC)
- **Static asset version seen:** `?1791970861` on `jam.css`, `main.css`, `lib.min.js`, `jam.min.js` (`jam.css` `Last-Modified: Tue, 06 Oct 2026 21:47:49 GMT`). *(2nd verifier: this is a site-wide deploy stamp, not a per-file version. `?1791974461` was also seen in the morning, and by 13:06 UTC every page referenced `?1791981660` for jam.css, main.css, user.css, game.css and the JS bundles, while jam.css stayed byte-identical (same MD5 and Last-Modified). Never hard-code it. The same deploy also changed the attribute order in the HTML, e.g. `<style type="text/css" id="jam_theme">` and `<div class="grid_outer" id="entries">`. `harness.py`, `theme.py`, `selectors.py` and `verify/{mk,an,gen,sel,vars,desc_bounded}.py` were patched to match loosely.)*
- **Test browser:** local headless Chrome 155 (`HeadlessChrome/155.0.0.0`), offline (every host blocked with `--host-resolver-rules`)
- **Tools:** `knowledge/evidence/crawljam-tools/` holds the scripts I wrote. Raw itch HTML/CSS stays in a local `raw/` folder, which is git-ignored and never committed.
- **itch requests:** 49 GETs with curl (log kept locally in `requests.log`), plus 3 WebFetch reads of itch docs and forum posts. `robots.txt` was honoured: no `/embed/`, `/search` and so on. I never logged in and never submitted anything.

## 1. Method (re-runnable)

```bash
cd knowledge/evidence/crawljam-tools
./fetch.sh https://itch.io/robots.txt robots           # check robots first
./fetch.sh https://itch.io/jams jams_index             # pick live jams from the index
./fetch.sh https://itch.io/jam/<slug> ov_<slug>        # overview pages
./fetch.sh https://itch.io/jam/<slug>/entries sp_<slug>_entries   # also /results /community /feed
./fetch.sh https://itch.io/jam/<slug>/rate/<id> rate_<slug>       # rate ids come from /results links
python -I theme.py raw/ov_*.html        # finds style#jam_theme, splits generated theme vs custom CSS, gives stats
python -I skel.py raw/ov_<slug>.html 14 wrapper     # sanitized DOM skeleton (tags#id.classes only, ids with digits -> N)
python -I selectors.py raw/ov_*.html    # classifies every selector of the custom part
python -I desc.py raw/ov_*.html         # tag/attr/class stats inside .jam_content.user_formatted (UNDERCOUNTS: stops early; use verify/desc_bounded.py)
python -I cssrules.py raw/jam.css '<regex>'   # reads itch's jam.css rules (with @media context)
# cascade tests: offline copy of a real overview + itch's jam.css + my custom CSS appended where itch appends it
./fetch.sh "https://static.itch.io/jam.css?1791970861" jam_css && cp raw/jam_css.html tests/jam.css
python -I harness.py raw/ov_lve-jam-2026-b-side.html tests/h_lve_v1_vars.html tests/v1_vars.css
./run.sh h_lve_v1_vars.html 1280        # prints RESULT {...computed styles...}
./run.sh h_lve_base.html 375            # mobile (headless Chrome clamps the viewport to 500px)
# border/variable test: temporarily copy probe2.js over probe.js, rebuild the harness, run, then restore probe.js
# @import-order test (no itch content needed)
chrome --headless=new --dump-dom file:///.../tests/import-order.html
```

Splitting rule: every generated jam theme ends with the rule `.view_jam_page .jam_filter_picker .divider{color:…;}`. Everything after that closing brace is the host's custom CSS. This held on 22 of 22 jams.

**Rate limit:** itch answered `HTTP 429 Too Many Requests` (served by `openresty` behind Cloudflare) 3 times. Two came at ~1 request per 2.5 s (`/jam/mini-jam-221-autumn/entries` and the profile) and one at ~1 request per 4 s (an overview). So crawl at ≥4 s per request, and expect a 429 on bursts. *(Verifier, 2026-10-14: I also got a 429 with requests spaced ~5–6 s apart, probably because other crawlers were running from the same IP at the same time. No spacing is guaranteed to be safe. Check the status code, back off and retry.)* *(2nd verifier: 0 × 429 in 33 GETs at ~7.5 s spacing, 13:05–13:23 UTC.)*

## 2. Sample

### Overview pages: 22 jams (+1 slug that returned 404: `gmtk-2026`)

| jam slug | state classes on `.view_jam_page` | custom CSS (chars) | bg image | `#entries` on overview | theme extras |
|---|---|---:|:-:|:-:|---|
| gmtk-2025 | after_voting is_over has_banner | 5152 | yes | – | pos 0% 0% |
| brackeys-14 | after_voting is_over has_banner | 0 | yes | – | |
| 7drl-challenge-2026 | after_voting is_over has_banner | 0 | yes | – | |
| gamedevjs-2026 | after_voting is_over has_banner | 0 | – | – | |
| kenney-jam-2025 | after_voting is_over has_banner | 1412 | yes | – | |
| lowrezjam-2025 | after_voting is_over has_banner | 1245 | yes | – | |
| wholesome-games-game-jam-2026 | after_voting is_over has_banner | 0 | yes | yes | body font Source Sans 3, header font Sora + header color, size 115%, radius 15px |
| bubblejam | after_voting is_over | 0 | yes | yes | radius 30px, size 105%, shadow preset |
| mini-jam-221-autumn | during_voting has_banner | 6650 | – | – | |
| trijam-393 | during_voting has_banner | 0 | – | yes | outline preset |
| tuesday-the-13th-jam | during_voting has_banner | 0 | yes | yes | body font Host Grotesk, radius 24px, glow preset |
| ttrpg-manifesto-2 | during_submit has_banner | 0 | – | yes | radius 30px |
| untitled-game-jam-134 | during_submit has_banner | 0 | – | – | |
| vampire-horror-jam-3d-vol-3-halloween-edition | during_submit has_banner | 0 | yes | yes | `background-attachment: fixed`, panel alpha .9, radius 30px |
| xr-is-dead-halloween-jam-2026 | during_submit has_banner | 0 | – | – | |
| gbjam-15 | before_start | 1567 | – | – | |
| gdevelop-big-game-jam-10 | before_start has_banner | 1806 | – | – | header font Baloo 2 |
| metroidvania-month-34 | before_start | 2526 | yes | – | |
| lve-jam-2026-b-side | before_start has_banner | 0 | yes | – | |
| witchcraft-jam | before_start has_banner | 0 | yes | – | `background-size: contain`, panel alpha .86, radius 30px, glow preset |
| women-game-jam-2026 | before_start has_banner | 0 | – | – | |
| yuri-comic-jam-2027 | before_start has_banner | 0 | yes | – | body font Comic Neue, radius 26px |

Totals: 8 after_voting, 3 during_voting, 4 during_submit and 7 before_start. 7 of the 22 jams have custom CSS.

### Subpages (all logged out)

| URL | `data-page_name` | `style#jam_theme` | host custom CSS | `#wrapper` |
|---|---|---|:-:|:-:|
| /jam/gmtk-2025/entries | view_jam_entries | 252 chars, vars only | **no** | **no** |
| /jam/gmtk-2025/results | jam_results | vars only | no | no |
| /jam/gmtk-2025/feed | view_jam_feed | vars only | no | no |
| /jam/gmtk-2025/rate/3765634 | jam_rate_game | vars only | no | no |
| /jam/kenney-jam-2025/entries, /results, /community | view_jam_entries / jam_results / jam.community | vars only | no | no |
| /jam/kenney-jam-2025/rate/3734883 | jam_rate_game | vars only | no | no |
| /jam/kenney-jam-2025/topic/4663110/… | jam.community_topic | vars only | no | no |
| /jam/lowrezjam-2025/results | jam_results | vars only | no | no |
| /jam/mini-jam-221-autumn/community, /feed | jam.community / view_jam_feed | vars only | no | no |
| /jam/metroidvania-month-34/community, /jam/gbjam-15/community | jam.community | vars only | no | no |
| /jam/gbjam-15/submit (logged out, before start) | default_route (404) | – | – | – |
| /jam/mini-jam-221-autumn/entries | (429, no data) | | | |
| /jam/tuesday-the-13th-jam/entries, /jam/witchcraft-jam/community (2nd verifier) | view_jam_entries / jam.community | 252 chars, vars only | no | no |
| /jam/bubblejam/results (2nd verifier) | **302 → /jam/bubblejam** (jam has no results tab), so the overview, with host CSS, is served | – | – | – |

Overview pages have `data-page_name="view_jam"` on all 22. The rate page also does **not** include the game's own `style#custom_css` or `game_theme`.

Comparison pages: `https://mirokshi.itch.io` (profile) and `https://leafo.itch.io/x-moon` (project, itch staff).

## 3. Where the custom CSS lives (head order)

| page | stylesheet order in `<head>` |
|---|---|
| jam overview | `link jam.css` → scripts → **`style#jam_theme` (generated theme + host CSS appended in the SAME element)** → `link fonts.googleapis.com/css?family=…` (only if a theme font is chosen) |
| jam subpages | `link main.css` → `style#jam_theme` (6 link/button vars + `--itchio_ui_bg`) → scripts |
| profile | `link user.css` → `style#user_theme` → `style#custom_css` |
| project | `link game.css` → `style#game_theme` → `style#custom_css` |

No jam page has a `style#custom_css` (0 of 22 overviews and 0 of 14 subpages). On all 14 subpages, `style#jam_theme` is exactly 252 characters: only the variables, with no host CSS and no `#wrapper`. The host CSS follows the generated rule `….divider{…;}` directly, sometimes with no whitespace at all (gdevelop: `}@import url(…)`). It looks verbatim: comments, newlines and `!important` are kept, there are no HTML entities, `>` stays raw (2 in gdevelop), and nothing is minified. gmtk-2025 has 24 comments, for example. *(Verifier: none of the 7 custom stylesheets, nor the 20 KB one checked later, contains a CR. Line breaks are LF only. So itch may normalize CRLF→LF, and "exactly as typed" cannot be proven from the outside.)*

### The generated jam theme (template, the same structure on all 22 jams)

```
:root{--itchio_ui_bg:H}
body{background-color:BG}
.jam_page_wrap{color:T;background-color:BG;font-family:F;font-size:N%;
  --itchio_border_radius:R;--itchio_link_color:L;--itchio_border_color:B;
  --itchio_button_color:BTN;--itchio_button_fg_color:FG;--itchio_button_shadow_color:S;
  --itchio_button_border_color:S;--itchio_button_hover_color:HV;--itchio_button_active_color:AC;
  [background-image:url('https://img.itch.zone/…');background-repeat:repeat|repeat-y;background-position:50% 0%|0% 0%;
   [background-size:contain|cover];[background-attachment:fixed]]}
.jam_body{border-radius:var(--itchio_border_radius,0)}
.view_jam_page h1,…,.view_jam_page h6{[font-family:HF;][color:HC]}
.view_jam_page .jam_body,.view_jam_page .grid_outer{background-color:rgba(r,g,b,ALPHA)}
.view_jam_page .jam_body{box-shadow:0 0 0 2px transparent[, preset]}
.view_jam_page .grid_outer .itch_footer{border-top:1px solid X !important;background-color:B}
… .game_text/.game_count/.footer_submissions{color:X !important}
… .game_platform/.game_genre/.game_author a/.powerd_by{color:X !important}
.view_jam_page .header_tabs .community_activity{background-color:B;color:T}
.view_jam_page .jam_filter_picker .filter_item{color:X !important}  (+ :hover/.active with border-color:L !important — the LINK colour as a hex literal, checked on trijam-393 and wholesome-games-game-jam-2026 where link≠button)
.view_jam_page .jam_filter_picker .divider{color:X}
<host custom CSS starts here>
```

Observed values:
- `font-family`: default `Lato,Lato,LatoExtended,sans-serif` (19 jams). A chosen body font gives `'Comic Neue',Lato,LatoExtended,sans-serif` and the like.
- `font-size`: 100% / 105% / 115%.
- `--itchio_border_radius`: `initial` (15 jams) or 15 / 24 / 26 / 30px.
- Panel `ALPHA`: 1 (20 jams), .9, .86.
- Shadow presets:
  - none: `0 0 0 2px transparent`
  - outline: `0 0 0 2px <border>`
  - shadow: `…, 0 4px 12px rgba(…,.28)`
  - glow: `…, 0 0 12px|24px rgba(…)`
- `--itchio_button_border_color` always equals `--itchio_button_shadow_color`.
- `--itchio_link_color` equals `--itchio_button_color` on 20 of 22 jams. Two jams differ, which shows the separate "button colour" option in use:
  - trijam-393: link `#dd4a4a`, button `#FA5C5C`;
  - wholesome-games-game-jam-2026: link `#e2382a`, button `#ba90ce`.
- `shadow`, `hover` and `active` are derived from the button colour by an offset, usually equal on every channel and clamped at 0 and 255:
  - shadow: −39 to −11 per channel, or +32 for a very dark button;
  - hover: within ±13;
  - active: within ±7.

### Subpage theme (example: gmtk-2025)

```
:root{--itchio_ui_bg:#282828;}.page_widget{--itchio_link_color:#df5a04;--itchio_button_color:#ff7a24;
 --itchio_button_fg_color:#ffffff;--itchio_button_shadow_color:#e8630d;--itchio_button_hover_color:#f7721c;--itchio_button_active_color:#ff7f29;}
```

On subpages the link colour is the overview link colour darkened by the same amount on every channel. *(2nd verifier: this holds for light links only. The rule that reproduces 7 of 8 jams exactly is "subtract the same amount from R, G and B until the YIQ brightness (299R+587G+114B)/1000 is ≤ 120". A link that is already dark stays the same within ±1 (witchcraft-jam #744918 → #744917). Contrast against white therefore ranges from 3.34 to 7.75, not 3.7–4.5. This rule is inferred from the data, not documented.)*

| jam | overview link | subpage link | Δ per channel | contrast vs #fff (overview → subpage) |
|---|---|---|---:|---|
| gmtk-2025 | #ff7a24 | #df5a04 | −32 | 2.61 → 3.75 |
| kenney-jam-2025 | #9266ff | #8559f2 | −13 | 3.77 → 4.46 |
| lowrezjam-2025 | #e0bd99 | #94714d | −76 | 1.76 → 4.44 |
| metroidvania-month-34 | #e3e3e3 | #787878 | −107 | 1.28 → 4.42 |
| mini-jam-221-autumn | #D8663E | #cc5a32 | −12 | 3.57 → 4.14 |
| gbjam-15 | #6675ed | #5f6ee6 | −7 | 3.94 → 4.32 |
| tuesday-the-13th-jam (2nd verifier) | #95dd49 | #569e0a | −63 | 1.65 → **3.34** |
| witchcraft-jam (2nd verifier) | #744918 | #744917 | 0/0/−1 | 7.75 → 7.75 |

## 4. Sanitized DOM skeletons (my own reduction: tags, ids and classes only; `N` = random number)

### Jam overview, logged out (`body.locale_en.jam_layout_widget.layout_widget.responsive.no_theme_toggle[data-page_name=view_jam]`)

```
body
├─ div#jam_layout_header_N.small_logo.gray.jam_layout_header_widget.header_widget.base_widget   ← SITE HEADER, outside #wrapper
│   ├─ a.skip_to_main
│   ├─ div.primary_header  (h1.title > a.header_logo > img.full_logo|img.minimal_logo; div.header_buttons > a.header_button…;
│   │                       form.game_search; div#user_panel_N.user_panel_widget)
│   └─ div.header_dropdown
├─ div#wrapper.jam_page_wrap                                  ← theme vars + bg + text colour live here
│   └─ div#view_jam_N.view_jam_page.view_jam_base_page.page_widget.base_widget.view_jam_default.<state>[.is_over][.has_banner]
│       ├─ div.jam_banner_outer > img.jam_banner[.full_width]          (img present even without a banner; hidden unless .has_banner)
│       ├─ div.jam_body                                                 (max-width 960px, overflow hidden)
│       │   ├─ div#jam_header_N.jam_header_widget.base_widget > div.header_inner
│       │   │   ├─ div.header_columns
│       │   │   │   ├─ div.title_colum  (sic)
│       │   │   │   │   ├─ h1.jam_title_header > a
│       │   │   │   │   └─ div.jam_host_header > a ×n                     ("Hosted by …")
│       │   │   │   └─ div.stats_container > div.stat_box ×1–2 > [a >] div.stat_value + div.stat_label   (Joined | Entries | Ratings)
│       │   │   └─ div.header_tabs > a.header_tab[.active] …, div.tab_group > a.header_tab + span.community_activity
│       │   ├─ div.submitter_outer > div#jam_submitter_N.jam_submitter_widget.base_widget.<state>[.is_over]
│       │   │   ├─ div.date_data > span.date_format ×2                    (not on after_voting: a <p> with dates instead)
│       │   │   ├─ div.countdown > span.countdown_label + div.times > div.time_block[data-name=years|months|days|hours|minutes|seconds] ×6
│       │   │   │                                                       > div.block_value + div.block_label
│       │   │   └─ div.state_action > button.button.fat.submitter_button.join_jam_btn   (before_start/during_submit only)
│       │   └─ div.jam_content.user_formatted                            ← host description HTML (custom-* classes)
│       ├─ div#entries.grid_outer                                       (only some jams: 6/22)
│       │   ├─ div.header_row > h2 > span.game_count
│       │   ├─ div.jam_filter_picker > div.filter_item[.active] / span.divider …
│       │   ├─ div.jam_filter_empty
│       │   ├─ div.game_grid_widget.base_widget.browse_game_grid > div.game_cell[.has_cover][.filter_*].lazy_images ×n
│       │   │       > div.game_thumb (a.thumb_link.game_link, div.game_cell_tools) + div.game_cell_data
│       │   │         (div.game_title > a.title.game_link, div.game_text, div.game_author > a, div.game_genre, div.game_platform)
│       │   └─ div.itch_footer > span.powerd_by (sic) + a > img.header_logo     ← the ONLY itch branding inside #wrapper
│       └─ script#add_game_to_jam_lightbox_tpl
├─ script#loading_lightbox_tpl
└─ script …
```

There is **no** `div.footer` on any jam overview (0 of 22). The site footer only exists on subpages, at body level.

### Jam subpages (`body.locale_en.wide_layout_widget.layout_widget.responsive[.flexible]`)

```
body
├─ div#header_N.header_widget.base_widget            (standard site header)
├─ div#<page>_N.<page>_page[.jam_page_base_page].page_widget.base_widget     ← theme vars set on .page_widget
│   │   view_jam_entries_page.jam_page_base_page.browse_column_base_page | view_jam_results_page.jam_page_base_page
│   │   view_jam_feed_page.jam_page_base_page.events_page | jam_rate_game_page.jam_page_base_page
│   │   jam_community_page.community_category_page.community_page_page            (NO .jam_page_base_page)
│   │   jam_community_topic_page.community_topic_page.community_page_page          (NO .jam_page_base_page)
│   ├─ div#jam_header_N.jam_header_widget.base_widget > div.header_inner
│   │   ├─ div.header_columns > div.cover_column > a.cover_image > img ; div.title_colum ; div.stats_container
│   │   └─ div.header_tabs
│   └─ (page body: entries = div.jam_browse_entries_widget.browse_columns …; results = div.jam_summary, div.criteria_sort.header_nav,
│       div.game_ranking > div.game_rank.first_place …; rate = div.jam_game_header, div.entry_columns > div.jam_columns …)
└─ div.footer > div.primary, div.secondary           (site footer, outside any #wrapper)
```

## 5. Cascade tests (headless Chrome 155, offline harness built from real overviews + real `jam.css`)

Harness: `harness.py` strips `<script>`, points `jam.css` to a local copy, and appends the test CSS inside `style#jam_theme` right after the host's CSS, which is exactly where itch appends it. `probe.js` reads computed styles.

Base page `lve-jam-2026-b-side`: theme link `#60d276`, `--itchio_ui_bg #3f5642`, panel `#f6f3e6`.

| variant (appended CSS) | result |
|---|---|
| base | content and host links `rgb(96,210,118)`; join button bg the same; site-header bg `rgb(63,86,66)` = `--itchio_ui_bg`; `.jam_body` radius 0px; `.jam_submitter_widget` radius 4px |
| `#wrapper{--itchio_link_color:#00ff00;--itchio_button_color:#0000ff;--itchio_border_radius:12px}` | content and host links → `rgb(0,255,0)`; join button → `rgb(0,0,255)`; `.jam_body` and submitter radius → 12px; **site header links unchanged** `rgb(238,238,238)` |
| `#wrapper{background:#123456}` | `#wrapper` `background-image` → **`none`** (the theme's image is wiped) |
| `a{color:rgb(255,0,0)}img{max-width:5px}` | content links red; the site header's `img` gets `max-width:5px` (**unscoped rule leaks into the site header**). Header links keep their own colour (more specific itch rule) |
| `.view_jam_page .jam_body{background-color:rgb(1,2,3)}` | wins: same specificity as the generated rule, but later in the same sheet |
| `:root{--itchio_link_color:#ff00ff}` | **no effect** inside `#wrapper` (shadowed by `.jam_page_wrap`'s own declaration) |
| `.jam_page_wrap{--itchio_link_color:#00ffff}` | wins (later in the same sheet, equal specificity) |
| Trijam grid: `#wrapper .game_cell .game_text{color:rgb(9,9,9)}` | **loses**: stays `rgb(174,166,187)` because the generated rule has `!important` |
| same with `!important` | wins → `rgb(9,9,9)` |
| `#wrapper .game_cell .game_title a{color:rgb(8,8,8)}` | wins (no `!important` on game titles) |
| Trijam: `#wrapper{--itchio_button_color:#0000ff;--itchio_border_color:#ff0000}` (`probe2.js`) | `.header_tab.active` border → blue; `.jam_header_widget` and `.grid_outer .header_row` borders → red. **Unchanged:** `.jam_filter_picker .filter_item.active` border (`rgb(221,74,74)` = the link-colour literal), `.grid_outer .itch_footer` border-top and `.header_tabs .community_activity` bg (generated hex literals) |
| width 500px (headless minimum) vs 1280px | `.jam_body` margin-top 10px vs 40px; `.jam_title_header` 20px vs 42px; `.stats_container` `display:none` vs `block`; submitter radius 0 vs 4px (stacked below 820px) |

`@import` test (`tests/import-order.html`, a synthetic page shaped like `style#jam_theme`):

```
jam_theme_rule_types: [Style,Style,Style,Style,FontFace,LayerBlock,Style,Style,Style]   → @import and @charset dropped
probe-late (@import placed after theme rules): rgb(34,34,34)  → NOT applied
probe-top  (@import first in its own <style>):  rgb(10,11,12) → applied
@font-face and @layer placed mid-sheet: parsed; rules after the invalid @import still apply
#wrapper{--itchio_link_color:#00ff00} overrides .jam_page_wrap's value → links rgb(0,255,0)
```

On the real `gdevelop-big-game-jam-10` overview, the CSSOM of `style#jam_theme` has 27 rules and **0** `CSSImportRule`. The host's `@import url('https://fonts.googleapis.com/css2?family=Titan+One…')` is ignored.

## 6. What the host CSS actually does (7 jams with CSS, 199 selectors)

| category of first compound | count |
|---|---:|
| starts with `#wrapper` | **0** |
| `.view_jam_page …` / `.jam_page_wrap` | 47 |
| other itch classes (`.jam_body`, `.jam_submitter_widget`, `.block_value`…) | 53 |
| `.custom-*` | 44 |
| bare elements (`img`, `p`, `a`, `h1`, `table`, `details`…) — unscoped | 47 |
| `html` / `body` / `:root` (incl. `html::before`) | 5 |
| site header (`.header_widget.gray .primary_header`, `.user_panel_widget …`) | 3 (mini-jam-221-autumn) |

- No host overrides any `--itchio_*` variable.
- 1 of 7 uses `@import`, and it is dead (see §5).
- `url()` targets are `img.itch.zone` uploads (3 jams) and Google Fonts (1 jam).
- Other at-rules: `@keyframes` (2 jams), one `@media` (gmtk), and no `@font-face`.
- Sizes are 1245 to 6650 characters, so 2 jams exceed 5120.

## 7. Jam description (`.jam_content.user_formatted`) markup, all 22 overviews

> **Corrected 2026-10-14 by the verifier.** The first version of this section came from `desc.py`, whose depth counter stops early on some pages, so it undercounted. The numbers below come from `verify/desc_bounded.py`. That script cuts the description from `<div class="jam_content user_formatted">` up to `<div id="entries"` or `<script id="add_game_to_jam_lightbox_tpl"`, whichever comes first. The same numbers were reproduced with an `html.parser` walk.

- **Tags:** p 439, a 395, strong 304, li 272, br 206, img 113, h2 89, div 88, h3 61, ul 57, h1 41, em 41, td 30, h4 27, span 22, **details/summary 21**, **figure 16**, tr 14, del 12, **iframe 10** (youtube 7, discordapp 1, a third-party poll host 2), figcaption 10, table/tbody 7, u 5, hr 4, ol 1.
- **Classes:**
  - 121 `custom-*`.
  - Non-`custom-` classes that survived:
    - `text-center` ×148: itch's own utility class; `jam.css` has `.text-center{text-align:center}` and `.text-right`.
    - `spoiler` ×2, on `<span class="spoiler" tabindex="0">` (tuesday-the-13th-jam). This is itch's own spoiler markup; `jam.css` styles `.user_formatted .spoiler`, which is hidden until it is focused.
    - `custom_backing` ×1 (underscore prefix).
  - **0 `id` attributes.**
- **Inline `style` attributes survive** (20 in total), for example `color:#…`, `font-size:inherit`, `color:inherit`, `font-size:16px`, and `width:100%; min-height:650px|1200px` on an iframe.
- itch adds attributes:
  - Links get `rel="nofollow noopener" referrerpolicy="origin"` **only when they point off itch**: 253 of 395 links. The 142 links to `itch.io` or `*.itch.io` have no `rel`. `target` is set on 249 links, both with and without `rel`.
  - **All** 113 description images get `loading="lazy"`.

## 8. Response headers (logged out)

| page | CSP | X-Frame-Options | other |
|---|---|---|---|
| jam overview, entries, rate (`itch.io/jam/…`) | **none** | `SAMEORIGIN` | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer-when-downgrade`, `X-Cache-Status: MISS/EXPIRED`, `Server: cloudflare` |
| profile (`mirokshi.itch.io`) | none | `SAMEORIGIN` | origin-trial header |
| project (`leafo.itch.io/x-moon`) | `frame-ancestors 'self' https://itch.io` | (none) | origin-trial header |

`static.itch.io/jam.css` is `text/css` with `Cache-Control: max-age=86400` and is cache-busted by `?<version>`.

## 9. itch's `jam.css`: what each theme variable paints (read from `static.itch.io/jam.css?1791970861`)

- `--itchio_link_color`: `a`, `.button.outline` (text), `button.textlike`, `.view_jam_page .jam_header_widget .stat_box a:hover`.
- `--itchio_button_color`: `.button` bg, `.button.outline` border, `.skip_to_main`, the active/hovered `.header_tab` border-bottom, the active/hovered `.jam_filter_picker .filter_item` border.
- `--itchio_button_fg_color`: `.button` text. `--itchio_button_hover_color`: `.button:hover`. `--itchio_button_active_color`: `.button:active`.
- `--itchio_button_shadow_color`: `.button` text-shadow. `--itchio_button_border_color`: `.button` border.
- `--itchio_border_color`: `.jam_submitter_widget` border, `.jam_header_widget` and `.grid_outer .header_row` / `.jam_filter_picker` border-bottom, `.user_formatted table` and `hr`.
- `--itchio_border_radius`: `.jam_submitter_widget` (fallback 4px) and, via the generated rule, `.jam_body` (fallback 0).
- `--itchio_ui_bg` (`:root`): the site-header bar `.header_widget.gray .primary_header` (fallback `#111`).
- Layout defaults:
  - `.jam_page_wrap{display:flow-root;min-height:calc(100vh - 50px)}`;
  - `.view_jam_page .jam_body{max-width:960px;margin:40px auto;overflow:hidden}`;
  - `.jam_banner` max-width 960px (≥960px viewport) unless `.full_width`.
- Breakpoints used: 600, 650, 700, 800, 820, 920, 960, 980, 1020, 1150 and 1300px.

## 10. Official / staff sources read this session

- `https://itch.io/docs/creators/css-guide`: jam layout, the theme-variable list, "scope to `#wrapper`", "test logged out". It gives no character limit.
- `https://itch.io/t/6429680/jam-theme-editor-revamp` (topic created 2026-06-01, by leafo/itch staff):
  - host CSS is "appended verbatim to the end of the jam's generated theme stylesheet", unscoped;
  - background and text colour moved from `body` to `.jam_page_wrap`;
  - the site header is a sibling before `.jam_page_wrap`;
  - owners see extra `.theme_editor_columns` / `.theme_editor_primary_column` wrappers;
  - `#wrapper` is new on jam pages, and old `#wrapper` rules were removed by the migration;
  - the jam CSS limit was 5120 and was then raised: "For jams I updated it to 20kb";
  - new theme options (Google Fonts for body and header, font-size slider, button colour, header colour, corner radius, shadow presets, bg cover/contain/fixed, opacity slider, theme copy/paste JSON).
- `https://itch.io/post/16223698`: a host asked for 32 KB and later fitted "a few hundred shy of the new limit". The exact new value is not stated.

## Verification (2026-10-14)

An adversarial verifier re-checked every fact against primary sources. The verifier fetched pages again and wrote and ran its own scripts and tests. It did not use the browser tools.

### Method

- **itch requests:** 19 fresh GETs between 10:31 and 10:43 UTC with `verify/fetch.sh` (≥5 s apart). One returned a **429** (`/jam/lve-jam-2026-b-side`, ~5 s after the previous request) and was retried 80 s later.
  - Overviews: gmtk-2025, gdevelop-big-game-jam-10, trijam-393, mini-jam-221-autumn, witchcraft-jam, lve-jam-2026-b-side, and gamelike-jam-009/010 (the jams linked in the revamp thread).
  - Subpages: `/jam/gmtk-2025/entries` and `/jam/gmtk-2025/rate/3765634`.
  - Stylesheets: `jam.css` and `main.css` (`?1791970861`).
  - Comparison pages: the profile and project pages.
  - Docs: `https://itch.io/t/6429680/jam-theme-editor-revamp`, `https://itch.io/post/16223698`, `https://itch.io/docs/creators/css-guide` (curl plus `verify/txt.py`).
- **Raw files:** kept in a git-ignored scratchpad. The first agent's 22 raw overviews and 14 subpages were re-analysed with independent scripts. Their 3 overlapping overviews matched the fresh copies: the `style#jam_theme` text was byte-identical.
- **Scripts:** all in `crawljam-tools/verify/` (written by the verifier):
  - `an.py` / `vars.py` / `gen.py`: theme split and template;
  - `sel.py`: selector classes;
  - `desc_bounded.py`: description markup;
  - `tree.py`: skeletons;
  - `rules.py`: jam.css rules containing a regex, with `@media` context;
  - `mk.py` + `run.sh` + `tests/probe.js`: offline harness in headless Chrome 155 with its own profile and all hosts unresolvable;
  - `tests/atrules.html`: which at-rules survive mid-sheet.

```bash
cd knowledge/evidence/crawljam-tools/verify
./fetch.sh https://itch.io/jam/trijam-393 ov_trijam-393; ./fetch.sh "https://static.itch.io/jam.css?1791970861" jam_css; cp raw/jam_css.html tests/jam.css
python -I gen.py raw/ov_*.html                       # 1 distinct 14-rule selector sequence on all overviews
python -I mk.py raw/ov_lve.html tests/h_lve_c1.html tests/c1.css tests/probe.js && ./run.sh h_lve_c1.html 1280
python -I mk.py raw/ov_trijam-393.html tests/h_tri_t8.html tests/t8.css tests/probe.js && ./run.sh h_tri_t8.html 1280
./run.sh atrules.html                                # at-rule survival test, no itch content needed
python -I rules.py raw/jam_css.html 'var\(--itchio'  # every jam.css declaration that reads a theme variable
```

### Harness results (fresh lve-jam-2026-b-side and trijam-393 copies + fresh jam.css)

| appended CSS | result |
|---|---|
| (base, lve) | links/join `rgb(96,210,118)`, site-header bg `rgb(63,86,66)`, header links `rgb(238,238,238)`, jam_body radius 0px, submitter 4px, jam_body max-width 960px / margin-top 40px / overflow hidden, `#wrapper` display flow-root, parent BODY, previous sibling = site header |
| c1 `#wrapper{--itchio_link_color:#00ff00;--itchio_button_color:#0000ff;--itchio_border_radius:12px}` | links green, join blue, both radii 12px; site header unchanged |
| c2 `#wrapper{background:#123456}` | bg-image `none` |
| c2b `#wrapper{background-color:#123456}` | colour changes, image kept |
| c10 `.jam_page_wrap{background:#1a1a2e}` (the shape of the official migration-guide example) | bg-image `none` too |
| c3 `a{color:red}img{max-width:5px}` | content and host links red, site-header `img` max-width 5px, header links unchanged |
| c4 `.view_jam_page .jam_body{background-color:rgb(1,2,3)}` | wins |
| c6 `:root{--itchio_link_color:#ff00ff}` | no effect in `#wrapper` |
| c7 `.jam_page_wrap{--itchio_link_color:#00ffff}` | wins |
| c9 `html{--itchio_ui_bg:#ff0000}` | no effect: the generated `:root{}` has higher specificity |
| t5 (trijam) `#wrapper .game_cell .game_text{…}` / `.game_title a{…}` | game_text stays `rgb(174,166,187)`, game_title wins |
| t5b same + `!important` | game_text wins |
| t8 `#wrapper{--itchio_button_color:#00f;--itchio_border_color:#f00}` | tab underline blue, header/header_row borders red; filter_item.active border `rgb(221,74,74)`, itch_footer border `rgb(78,70,91)` and community_activity `rgb(69,61,82)` unchanged |
| t8b `#wrapper{--itchio_link_color:#0f0}` | content links green; filter_item.active border still the literal `rgb(221,74,74)` |
| widths 375 (clamped to 500) / 620 / 800 / 1000 | margin-top 10/10/40/40; title 20/20/42/42px; stats none/block/block/block; submitter radius 0/0/0/4px; tabs overflow auto/auto/visible/visible; banner max-width 100%/100%/100%/960px; grid margin-top 0 at 500 |
| gdevelop computed `h1` font-family | `"Baloo 2"`: the generated heading rule has **no fallback stack** |

`atrules.html` (one sheet, at-rules placed after style rules):
- **Dropped:** `@import`, `@charset` and `@namespace` (no CSSOM rule).
- **Parsed:** `@font-face`, `@layer` block **and** statement, `@media`, `@supports`, `@container`, `@keyframes`, `@property` and `@scope`, and each one applied.
- **Layers:** a layered `#wrapper .x{}` lost to an unlayered `.view_jam_page .x{}`. A layered `!important` declaration beat the unlayered normal one.
- **Real page:** the fresh gdevelop `style#jam_theme` CSSOM has 27 rules and none of them is a CSSImportRule.

### Data re-derived

- **Generated theme:** 8 fresh overviews and 22 earlier ones all have the same 14 selectors in the same order (`gen.py`: 1 distinct sequence). The generated part is 1708–1921 chars long (fresh gamelike pages: 1904). It contains 6 `!important`. On 22 of 22 jams `--itchio_button_border_color` equals `--itchio_button_shadow_color`, and the link colour equals the button colour on 20 of 22.
  - Button-colour offsets per channel: shadow −39…−11, or +32 on one dark button; hover −13…+10; active −7…+6; clamped at 0 and 255.
  - Shadow presets seen:
    - `0 0 0 2px transparent` ×18;
    - outline `0 0 0 2px #453d52` = border colour (trijam);
    - `…, 0 4px 12px rgba(140,140,140,0.28)` (bubblejam);
    - `…, 0 0 12px rgba(114,114,114,0.18)` (tuesday);
    - `…, 0 0 24px rgba(116,73,24,0.9)` = link colour (witchcraft).
  - Panel alpha: `1` ×20, `0.9` and `0.86` (written with a leading zero).
  - Background: `background-position` is `50% 0%` ×10 or `0% 0%` ×3. `background-size:contain` ×1. `background-attachment:fixed` ×1 in the 22, and on both gamelike jams. `cover` was never seen.
- **Banner:** `has_banner` is on **19 of 22** jams, and `.full_width` on **4 of those 19** (gamedevjs-2026, gdevelop-big-game-jam-10, lowrezjam-2025, women-game-jam-2026). `img.jam_banner` is always present. Without a banner it has **no `src` attribute**.
- **Subpages:** the 14 earlier subpages plus the 2 fresh ones all have a 252-char `style#jam_theme` and load `main.css`; none has `#wrapper` or `custom_css`. They carry `:root{--itchio_ui_bg}` plus 6 variables on `.page_widget`. Only the link colour differs from the overview: it is darker by the same amount on every channel (6 jams; contrast against #fff is 3.75–4.46). The button, fg, shadow, hover, active and ui_bg values are copied unchanged.
- **Countdown:** server HTML has all 6 `.time_block` with **empty** `.block_value` and no `.hidden` class (0 occurrences). JS fills the values and hides the unused blocks. `.state_action` also exists during voting, but holds plain text instead of the join button.
- **Widget ids:** they change on every request (gmtk, trijam and gbjam each fetched twice). The only ids without digits are `wrapper`, `entries` (only when the grid is shown), `jam_theme` and the script templates `add_game_to_jam_lightbox_tpl`, `loading_lightbox_tpl` and `lib_react_src`.
- **Grid links:** during voting, trijam's 52 overview grid links all go to `<creator>.itch.io/<game>` pages; none goes to `/rate/`. Grid images are `<img class="lazy_loaded" data-lazy_src=…>` with no `src` attribute.
- **Custom CSS size:** gamelike-jam-010 serves **20,411 chars** of custom CSS (864 LF, 14 comments, ASCII only) and gamelike-jam-009 serves 20,238. This is the host who said they cut their CSS to "a few hundred shy of the new limit". So the jam editor accepts **≥20,411 chars** including whitespace and comments. That fits a 20 KiB (20,480) cap, but this is not proven.
- **Selectors (`sel.py`, own classifier):** 199 selectors. 0 start with `#wrapper`; 48 are bare elements; 4 are `html`/`body`/`:root`; 3 target the site header; 47 start with `.view_jam_page`/`.jam_page_wrap`; 52 start with another itch class; 45 are `custom-*`/`custom_*`. The small differences from §6 come from how edge cases are classified.
- **Response headers:** the fresh overview, entries and rate pages have `X-Frame-Options: SAMEORIGIN` and no CSP. The profile has XFO and no CSP. The project page has `Content-Security-Policy: frame-ancestors 'self' https://itch.io` and no XFO. The 429 response carries neither header.
- **Stylesheet sizes:** `jam.css` is 71,053 bytes decoded, `Last-Modified 2026-10-06`, `max-age=86400`. `main.css` is 643,506 bytes decoded, `Last-Modified 2026-10-12`.
- **jam.css variable map (`rules.py`):** everything in §9 holds. Uses that the fact list left out:
  - `--itchio_button_color` also paints the `.button.outline:hover` border and the active/hovered `.view_jam_base_page .grid_outer .jam_filter_picker .filter_item` border. That border is always overridden by the generated `!important` literal.
  - `--itchio_button_fg_color` also colours the `.skip_to_main` text.
  - `--itchio_border_color` also paints `.formatted hr`, `fieldset`, lightbox `h2` and lists, and `.game_cell .meta_tag.free_tag>div`.
  - `--itchio_link_color` is also used in the site header's user menu (`.user_panel_widget .link_row:hover`). That menu is outside `#wrapper`, so it uses the fallback.
  - `--itchio_ui_bg` also paints `.header_widget .header_dropdown`, the header-button hover underline and the search-button colour.

### Verdicts

| id | verdict | note |
|---|---|---|
| 01 | confirmed | fresh gmtk/gdevelop/minijam/gamelike + leafo's post |
| 02 | confirmed | `@namespace` is also dropped |
| 03 | confirmed | |
| 04 | confirmed | |
| 05 | confirmed | official migration guide recommends `.jam_page_wrap{--…}`; guide recommends `#wrapper{--…}`; both work |
| 06 | confirmed | |
| 07 | confirmed | |
| 08 | confirmed | overriding the link variable does not move the filter border either |
| 09 | corrected | the lists are incomplete; see the variable map above |
| 10 | corrected | "never" is too strong. The shorthand is correct when you deliberately replace the whole background (the official migration example does this on `.jam_page_wrap`). It wipes the theme's image whether it is set on `#wrapper` or on `.jam_page_wrap` |
| 11 | confirmed | 1 distinct 14-rule sequence across 30 page copies |
| 12 | confirmed | |
| 13 | confirmed | glow colour varies (grey .18 alpha or link colour .9 alpha) |
| 14 | confirmed | header font has no fallback stack; one `<link>` per chosen font |
| 15 | confirmed | |
| 16 | confirmed | counts within ±1 by classifier |
| 17 | confirmed | documented |
| 18 | confirmed | documented (owner view); logged-out part verified |
| 19 | confirmed | |
| 20 | confirmed | |
| 21 | corrected | block values are empty in the server HTML; JS fills them and adds `.hidden` |
| 22 | confirmed | |
| 23 | confirmed | margin-top comes from jam.css, not from the generated theme |
| 24 | confirmed | the "do not hide" part stays an inference |
| 25 | corrected | full_width is on 4 of 19 bannered jams, not 3 of 13. With no banner the img has no src. The selector is `.view_jam_page .jam_banner.full_width` |
| 26 | confirmed | |
| 27 | confirmed | |
| 28 | corrected | lowered to observed. LF only, so CRLF normalization cannot be ruled out |
| 29 | confirmed | documented, plus live ≥20,411 chars on gamelike-jam-010 |
| 30 | confirmed | |
| 31 | confirmed | |
| 32 | corrected | text-center ×148 not ×90; `spoiler` class also survives; 20 style attributes |
| 33 | corrected | rel and referrerpolicy are added only to off-itch links (253 of 395); all 113 images are lazy; grid images have no src |
| 34 | confirmed | |
| 35 | corrected | wording: 6 variables on `.page_widget` plus `--itchio_ui_bg` on `:root` |
| 36 | corrected | a layered `!important` beats unlayered normal declarations; `@property`, `@scope` and `@layer` statements also parse; `@namespace` is dropped |
| 37 | corrected | `cover` was never seen live; everything else confirmed |
| 38 | corrected | the guide asks you to *ensure* the theme editor can't do it and to *describe* the changes, not to justify it |
| 39 | corrected | a 429 also arrived at ~5 s spacing; use backoff and retry, not a fixed interval |
| 40 | confirmed | |

### Extra tests behind the verifier's additional facts

| harness (trijam-393, 1280px) | result |
|---|---|
| base `tests/probe_grid.js` | `.game_grid_widget`: 4 columns of 294.75px, column-gap 10px, row-gap 25px, `align-items:start`, so cell heights are uneven (328/349/346…) |
| g1 `#wrapper{--itchio_grid_gap:40px}` | column-gap 40px (row-gap stays 25px) |
| g2 `#wrapper .game_grid_widget{align-items:stretch}` | every cell in a row is the same height (349) |
| lve at 800px | `.jam_body` margin-left 0: between 651 and 960px the panel touches the viewport edges, and the 10px gutters only start at ≤650px |

## Verification (2026-10-14), second pass

A second, independent adversarial verifier ran 13:05–13:25 UTC. It wrote its own scripts (`crawljam-tools/verify2/`), fetched fresh copies, and re-derived every claim. No browser tools were used, and nothing was logged in or submitted.

### Method

- **itch requests:** 33 GETs, all `200`, 0 × 429, at ~7.5 s spacing (`verify2/scripts/fetch.sh`). One of them (`/jam/bubblejam/results`) followed a `302`.
  - robots.txt (`/jam/` allowed) and `/jams`.
  - **16 overviews:** gbjam-15 ×2, kenney-jam-2025, metroidvania-month-34, bubblejam, tuesday-the-13th-jam, wholesome-games-game-jam-2026, gdevelop-big-game-jam-10, gmtk-2025, mini-jam-221-autumn, lowrezjam-2025, gamelike-jam-010, plus 6 jams not sampled before (scream-jam-2026, godot-wild-jam-98, game-off-2026, gamedevtv-halloween-jam-2026, 1-bit-jam-15, micro-jam-067).
  - **Subpages:** `/jam/tuesday-the-13th-jam/entries`, `/jam/witchcraft-jam/community`, `/jam/gmtk-2025/rate/3765634`, `/jam/bubblejam/results`.
  - **Static files:** `jam.css` (both version stamps), `main.css`, `jam.min.js`.
  - **Docs:** the revamp topic, post 16223698 and the css-guide.
  - **Comparison pages:** `mirokshi.itch.io` and `leafo.itch.io/x-moon`.
- **Earlier raw copies** from the first crawl and the first verifier were only re-analysed with the new scripts: 14 subpages, plus 42 overview copies in total for the template statistics.
- **Harness:** `verify2/scripts/mk2.py` + `probe2.js` + `run2.sh`, run in headless Chrome 155 with a throwaway profile and `--host-resolver-rules="MAP * ~NOTFOUND"`. It works with any `?version` and any attribute order. Test CSS is in `verify2/tests/a_*.css`, and the at-rule pages are `atr2.html` and `atr3.html`.

```bash
cd knowledge/evidence/crawljam-tools/verify2
scripts/fetch.sh https://itch.io/jam/game-off-2026 ov_game-off-2026      # repeat per URL; check the printed [status]
scripts/fetch.sh "https://static.itch.io/jam.css?<stamp from the page>" jam_css_new && cp raw/jam_css_new.html tests/jam.css
python -I scripts/jt.py raw/ov_*.html | python -I scripts/show.py        # split, vars, head order, ids, footer, page_name
python -I scripts/tmpl.py raw/ov_*.html                                  # generated-template statistics
python -I scripts/shadow.py raw/ov_*.html                                # shadow presets + filter-border literal
python -I scripts/cssq.py raw/jam_css_new.html 'var\(--itchio_' decl     # jam.css rules (with @media context)
python -I scripts/cust.py raw/ov_*.html                                  # host-CSS text stats + selector classes
python -I scripts/desc2.py raw/ov_*.html                                 # description markup, #wrapper depth
python -I scripts/mk2.py raw/ov_game-off-2026.html tests/g_vars.html tests/a_vars.css && scripts/run2.sh g_vars.html 1280
scripts/run2.sh atr2.html; scripts/run2.sh atr3.html                    # at-rule survival, no itch content
```

### Results

**Theme split and template (42 overview copies, about 33 distinct jams)**
- There is 1 distinct 14-rule selector sequence, with 6 `!important` in every copy.
- The generated part is **1705**–1921 chars long (1-bit-jam-15 is 1705).
- `background-repeat` was **`repeat-y`** on scream-jam-2026 and `repeat` on 24 copies.
- `background-size:contain` ×2; `cover` was never seen; `background-attachment:fixed` ×3.
- `--itchio_button_border_color` equals the shadow colour on 42 of 42 copies. Link ≠ button only on trijam-393 and wholesome-games-game-jam-2026.
- The filter-tab active border is always the link-colour literal.

**Host CSS (fresh)**
- The custom part always starts right after the divider rule. Jams without custom CSS still end with one space after it.
- The 11 jams with CSS:
  - sizes 77 to 13,872 chars, and gamelike-jam-010 serves **20,410**;
  - 0 CR, 0 HTML entities, and raw `>` in 4 of them.
- **Selectors (272):**
  - 0 start with `#wrapper`;
  - 60 are bare elements;
  - 7 target `html`/`body`/`:root` (including `HTML{` and `html::before`);
  - 3 target the site header.
- On the original 7 jams the classifier reproduces 198 selectors, 47 bare, 5 html/body/:root and 3 header.
- scream-jam-2026 pastes **28 Google-Fonts `@font-face` blocks** (src `fonts.gstatic.com`) as an `@import` substitute. All of them parse as `CSSFontFaceRule`.
- gdevelop's `@import` (Titan One) is still dead: its CSSOM has 27 style rules and no import rule.

**Subpage link colour**
- 8 jams. Only the link value differs from the overview.
- Overview → subpage: #ff7a24→#df5a04, #9266ff→#8559f2, #e0bd99→#94714d, #e3e3e3→#787878, #D8663E→#cc5a32, #6675ed→#5f6ee6, **#95dd49→#569e0a** and **#744918→#744917**.
- The rule "subtract the same amount per channel until YIQ ≤ 120" reproduces 7 of 8 exactly.

**Harness, game-off-2026 (before_start, no host CSS) and tuesday-the-13th-jam (bg image, grid, radius 24px, glow), 1280px**

| appended CSS | result |
|---|---|
| (base) | `#wrapper` is `.jam_page_wrap`, its parent is BODY, the previous sibling is the site header; `flow-root`; links/join `rgb(255,50,197)`; site header `rgb(45,41,54)` = `--itchio_ui_bg`; header links `rgb(238,238,238)`; jam_body 0px, submitter 4px; max-width 960px, margin-top 40px, overflow hidden |
| `#wrapper{--itchio_link_color:#00ff00;--itchio_button_color:#0000ff;--itchio_border_radius:12px}` | links green, join blue, tab underline blue, both radii 12px, site header unchanged |
| `a{color:rgb(255,0,0)}img{max-width:5px}` | links red; **site-header logo `max-width:5px`** |
| `.view_jam_page .jam_body{background-color:rgb(1,2,3)}` | wins |
| `:root{--itchio_link_color:#ff00ff}` | no effect |
| `.jam_page_wrap{--itchio_link_color:#00ffff}` | wins |
| **`:root{--itchio_ui_bg:#ff0000}`** | **the site header turns red**: host CSS can recolour itch's own UI this way, so don't |
| `@import url(data:…)` appended | dropped (15 CSSStyleRule, no import) |
| tuesday `#wrapper{background:#123456}` | bg-image `none`. `background-color` alone keeps the image |
| tuesday `#wrapper .game_cell .game_text{color}` / `.game_title a{color}` | game_text loses (`rgb(153,153,153)`), title wins; with `!important` game_text wins |
| tuesday `#wrapper{--itchio_button_color:#00f;--itchio_border_color:#f00}` | tab underline blue; jam_header_widget and header_row borders red; filter_item.active border, itch_footer border and community_activity bg unchanged |
| tuesday `#wrapper{--itchio_link_color:#0f0}` | content links green; filter-tab border unchanged |
| tuesday `#wrapper{--itchio_grid_gap:40px}#wrapper .game_grid_widget{align-items:stretch}` | column gap 10px → 40px (row gap stays 25px); cell heights 328/349/349/328 → equal |
| widths 375 (→500) / 620 / 800 / 1000 | jam_body margin-top 10/10/40/40, margin-left 10/10/0/4.5; title 20/20/42/42px; stats none/block/block/block; submitter radius 0/0/0/4 (24 on tuesday at 1000); tabs overflow auto/auto/visible/visible; banner max-width 100%/100%/100%/960px; grid margin-top 0/0/40/40 |

**At-rules mid-sheet (`atr2.html`, `atr3.html`)**
- **Dropped:** `@import`, `@charset`, `@namespace`.
- **Parsed and applied:** `@font-face`, `@layer` (block and statement), `@media`, `@supports`, `@keyframes`, `@container`, `@property`, `@scope`. `@counter-style`, `@font-feature-values` and `@page` also parse.
- A layered `#wrapper .x` lost to an unlayered `.view_jam_page .x`. A layered `!important` beat an unlayered normal declaration.

**Description markup (16 fresh overviews, bounded to `.jam_content.user_formatted`)**
- 133 `custom-*`, 141 `text-center`, 2 `spoiler`, 1 `custom_backing`, 0 `id`.
- 11 `style` attributes.
- Iframes: youtube.com ×4 and **itch.io ×3**.
- Hosts use `h1` 30 times inside descriptions.
- Links: all 142 off-site links have `rel="nofollow noopener" referrerpolicy="origin"`; 111 of 112 itch/relative links have no `rel`.
- All 103 images have `loading="lazy"`.
- `#wrapper` is a direct child of `body` on 16 of 16.

**Countdown**
- 6 `.time_block[data-name]` with empty `.block_value` and no `.hidden` in the server HTML, in all 3 running states.
- `jam.min.js` `I.ViewJam` calls `setup_countdown()`, which uses `I.Countdown`, so JS fills and hides the blocks.
- After voting, the dates are `span.date_format` inside a `<p>`.

**Subpages**
- On all 17 subpage copies: `style#jam_theme` is 252 chars with 7 variables, `main.css` is loaded, there is no `#wrapper` and no `custom_css`, and `div.footer` sits at body level.
- `/results` of a jam without results **302-redirects to the overview**.
- Community and topic pages have **no `.jam_page_base_page`**.

**Headers**
- Jam overview, entries and rate pages: XFO SAMEORIGIN, no CSP.
- Profile: XFO, no CSP.
- Project: `Content-Security-Policy: frame-ancestors 'self' https://itch.io`, no XFO.
- jam.css: 71,053 B, `Last-Modified 2026-10-06`, `max-age=86400`. main.css: 643,506 B, `Last-Modified 2026-10-12`.

**Volatile markup**
- Attribute order: e.g. `<style id="jam_theme" type="text/css">` in the morning vs `<style type="text/css" id="jam_theme">` now.
- Class order: the site-header div showed 3 different orders in 17 copies.
- Widget ids: differ between two gbjam-15 fetches, while `style#jam_theme` was byte-identical.

### Verdicts (second pass)

| id | verdict | note |
|---|---|---|
| 01 | confirmed | 17 fresh copies + leafo's post |
| 02 | confirmed | fresh gdevelop CSSOM + own at-rule page |
| 03 | confirmed | plus: `/results` without a results tab redirects to the overview |
| 04 | **corrected** | darkening applies only to bright links (rule: YIQ ≤ 120); tuesday → 3.34:1; a dark link stays the same (7.75:1) |
| 05 | confirmed | |
| 06 | confirmed | |
| 07 | confirmed | |
| 08 | confirmed | |
| 09 | corrected | lists incomplete (filter-tab border, selectize, `.skip_to_main` text, many `--itchio_border_color` uses) |
| 10 | corrected | "never" → "unless you mean to replace the theme image"; the official migration example uses the shorthand |
| 11 | corrected | 1705–1921 chars; `background-repeat` can be `repeat-y` |
| 12 | confirmed | |
| 13 | confirmed | alpha written as `0.9`/`0.86`; glow is grey .18 (12px) or link .9 (24px) |
| 14 | corrected | font link is percent-encoded, one per font; header font has no fallback; size is a free slider (only 100/105/115 seen) |
| 15 | confirmed | class order in the header div varies |
| 16 | confirmed | 11 jams / 272 selectors; plus `:root{--itchio_ui_bg}` recolours the site header |
| 17 | confirmed | documented |
| 18 | confirmed | documented; logged-out direct child on 16/16 |
| 19 | confirmed | |
| 20 | confirmed | |
| 21 | corrected | values empty and no `.hidden` server-side; JS (`I.Countdown`) fills them |
| 22 | confirmed | |
| 23 | confirmed | margin-top comes from jam.css, not the generated theme |
| 24 | corrected | structure verified; the "do not hide" mapping is inference (confidence lowered) |
| 25 | corrected | full_width counts; img has no `src` without a banner |
| 26 | confirmed | |
| 27 | confirmed | |
| 28 | corrected | observed only; "exactly as typed" cannot be proven (LF only) |
| 29 | confirmed | documented + 20,410 chars live |
| 30 | confirmed | |
| 31 | corrected | `?1791970861` is outdated: a site-wide deploy stamp (`?1791981660` now) |
| 32 | corrected | counts; itch.io iframes; observed |
| 33 | corrected | rel/referrerpolicy only on off-site links |
| 34 | confirmed | |
| 35 | confirmed | |
| 36 | corrected | layered `!important` wins; more at-rules parse; `@namespace` dropped |
| 37 | corrected | `cover` never seen; `repeat-y` seen |
| 38 | corrected | "contact us"; ensure/describe/confirm, not "explain why" |
| 39 | corrected | 429 is real but intermittent; 0/33 at 7.5 s; back off on 429 |
| 40 | corrected | community/topic pages lack `.jam_page_base_page`; use `.page_widget` |
