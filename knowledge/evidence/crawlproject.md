# Evidence log — `crawlproject`: live DOM of itch.io project pages and devlogs (logged out)

- **Date of observation:** 2026-10-14 (all requests between 10:07 and 10:35 UTC).
- **Who/what:** an AI agent using `curl` from a residential connection, logged out, no cookies kept.
- **Scope:** project/game pages (`https://<user>.itch.io/<project>`), their devlog index (`/devlog`), devlog posts (`/devlog/<id>/<slug>`), `/comments`, `/community`, community topics (`itch.io/t/…`), `/purchase`, the AMP devlog mirror, two jam submissions during voting, the itch stylesheet `static.itch.io/game.css`, and the response headers of one embedded-game iframe host.
- **Nothing from third parties is reproduced here verbatim.** Raw HTML/CSS stayed in a private scratch folder. This file holds only my own skeletons (tag/id/class names, no text), counts, and short notes.

## 1. Method

### 1.1 Etiquette

- `https://itch.io/robots.txt` disallows `/embed/`, `/embed-upload/`, `/search`, `/checkout/`, `/game/download/`, `/bundle/download/`, `/register-for-purchase/`, `/email-feedback/`.
- **Subdomain robots differ:** `https://kenney.itch.io/robots.txt` (same for any `<user>.itch.io`) disallows `/*/download/`, `/*/rh/`, `/*/rp/`, `/-/`. So the "download interstitial" (`/<project>/download/<key>`) was **not** fetched.
- `https://html-classic.itch.zone/robots.txt` → 404 (no rules).
- GET only, browser User-Agent, no login, no forms, 95 logged requests to itch hosts + 1 WebFetch of an itch blog post. Total < 150.
- **Rate limiting observed:** with 1.3 s spacing the 5th request got `HTTP 429` (body says `openresty`); with 3 s spacing 3 more 429s occurred in ~35 requests; with **4 s spacing, 0 × 429 in ~55 requests**. 429 responses are 568-byte error pages — detect them before parsing. **Verifier (10:37–10:50 UTC, same IP, other agents crawling in parallel):** 3 × 429 in ~50 requests even at **5 s** spacing; a single retry after 60 s always succeeded. **Second verifier (13:06–13:26 UTC, same IP, other agents in parallel):** 6 × 429 in 48 requests at 6–7 s spacing; a single retry after 70 s always succeeded. Treat the 4 s figure as anecdotal: use ≥5 s spacing *and* back off on 429.

### 1.2 Tools (in `knowledge/evidence/crawlproject-tools/`)

| file | what it does |
|---|---|
| `get.sh` | polite fetcher: robots guard, browser UA, saves body + headers, logs, `sleep 4` |
| `skel.py` / `skelmod.py` | stdlib HTML parser that prints a tag/id/class skeleton (collapses `(xN)` repeats, no text) |
| `analyze.py` | per-page feature table (wrapper/inner/header/view_game_page classes, key class counts, iframes) → JSON |
| `cssstats.py` | numbers about each `style#custom_css` (length, comments kept, # selectors, # scoped under `#wrapper`, at-rules, url hosts, classes targeted) — never prints CSS |
| `theme.py` | inventory of selectors and `--itchio_*` variables inside `style#game_theme` across pages |

Re-run (bash, Python ≥3.10):

```bash
export OUT=/tmp/crawlproject; T=knowledge/evidence/crawlproject-tools
while read -r u; do n="p-$(basename "$u")"; $T/get.sh "$n" "$u"; done < urls.txt   # urls = table 2
python -I $T/analyze.py "$OUT/raw/p-*.html" $OUT/analysis.json
python -I $T/cssstats.py "$OUT/raw/p-*.html"
python -I $T/theme.py "$OUT/raw/p-*.html"
python -I $T/skel.py "$OUT/raw/p-<name>.html" 8 '#wrapper'
```

On Windows with Git Bash, pass glob patterns to Python as Windows paths (`$(cygpath -m "$OUT")/raw/p-*.html`). Python's `glob` cannot resolve `/c/...` paths.

### 1.3 How the sample was chosen

1. Browse lists (logged out): `/games/top-rated`, `/games/top-rated/platform-web`, `/physical-games/top-rated`, `/game-assets/top-sellers`, `/comics/top-rated`, `/books/top-rated`, `/games/on-sale`.
2. Only 3 of the first 28 popular pages had `style#custom_css`, so I used itch's **custom-CSS browse filter**: `https://itch.io/games/css`, `/games/css/platform-web`, `/physical-games/css`, `/tools/css` (`/games/on-sale/css` 301-redirects to `/games/css/on-sale`: the `css` facet comes first).
3. Jam submissions: `https://itch.io/jams` → a jam with `during_voting:true` (Trijam #393, voting until 2026-10-14 18:00 UTC) → `https://itch.io/jam/420634/entries.json` → the first two entries (small creators; URLs not listed here on purpose).

## 2. Sample (48 project pages + 2 jam entries)

Columns: embed mode = how the HTML5 frame is rendered server-side; `right_col` = value the theme block gives `.view_game_page .right_col{display}`; header = classes on `#header` besides `header`; flags = classes on the `.view_game_page` element; comments = `widget` (`.game_comments_widget` on the page), `board` (`section.community_summary > .game_community_preview_widget`) or `none (comments off)` (neither element; corrected in §12); custom_css = characters inside `style#custom_css` ("-" = no such element).

| # | page | kind | embed mode | right_col | header | view_game_page flags | comments | custom_css chars |
|---|---|---|---|---|---|---|---|---|
| 1 | https://kenney.itch.io/assetforge | paid tool | - | block | align_left has_image | buy_on_top | board | 1234 |
| 2 | https://creator-110.itch.io/game-84 | DLC download (demo uploads) | - | block | align_center has_image | buy_on_top | widget | 1472 |
| 3 | https://creator-110.itch.io/game-83 | download | - | block | align_center has_image | buy_on_top | widget | 175 |
| 4 | https://creator-48.itch.io/game-12 | web game | fullscreen-start (click) | block | align_center has_image | view_html_game_page direct_download | widget | 7647 |
| 5 | https://creator-54.itch.io/game-18 | download | - | block | align_center has_image | buy_on_top | widget | 160 |
| 6 | https://yellowafterlife.itch.io/gmedit | tool | - | block | align_center has_image | buy_on_top | board | 204 |
| 7 | https://creator-83.itch.io/game-50 | download | - | block | align_center has_image | buy_on_top | widget | 1000 |
| 8 | https://creator-79.itch.io/game-46 | web game | click-to-launch +fs-btn | none | (none) | view_html_game_page buy_on_top | widget | 93105 |
| 9 | https://creator-47.itch.io/game-11 | web game | click-to-launch +fs-btn | none | align_center has_image | view_html_game_page buy_on_top | widget | 9004 |
| 10 | https://deepnight.itch.io/ldtk | tool | - | block | align_center has_image | buy_on_top | widget | 263 |
| 11 | https://creator-45.itch.io/game-09 | physical | - | none | align_center has_image | buy_on_top | widget | 1361 |
| 12 | https://puppetcombo.itch.io/nun-massacre | paid download (bundle row) | - | block | align_center has_image | buy_on_top | widget | 165 |
| 13 | https://creator-71.itch.io/game-36 | download | - | block | align_center has_image | buy_on_top | widget | 198 |
| 14 | https://creator-69.itch.io/game-34 | web game | auto-load | none | align_center has_image | view_html_game_page buy_on_top | widget | 643 |
| 15 | https://creator-112.itch.io/game-86 | physical | - | none | align_center has_image | buy_on_top | widget | 266 |
| 16 | https://creator-55.itch.io/game-19 | physical | - | block | align_center has_image | buy_on_top | widget | 1047 |
| 17 | https://creator-97.itch.io/game-70 | web game | auto-load +fs-btn | none | (none) | view_html_game_page buy_on_top | widget | 3070 |
| 18 | https://scriptwelder.itch.io/waterworks | web game | auto-load | block | align_center has_image | view_html_game_page | widget | 39 |
| 19 | https://alienmelon.itch.io/electric-zine-maker | tool | - | block | align_center has_image | buy_on_top | widget | 4434 |
| 20 | https://alienmelon.itch.io/allthemes | web tool/asset | auto-load +fs-btn | block | (none) | view_html_game_page buy_on_top | widget | - |
| 21 | https://creator-111.itch.io/game-85 | download | - | block | align_center has_image | buy_on_top | board | - |
| 22 | https://ncase.itch.io/anxiety | web game | auto-load | none | (none) | view_html_game_page | none (comments off) | - |
| 23 | https://adamgryu.itch.io/a-short-hike | paid download | - | block | align_center has_image | buy_on_top | board | 533 |
| 24 | https://comigo.itch.io/better-creator-pages | book | - | none | align_center has_image | direct_download | widget | 2615 |
| 25 | https://creator-70.itch.io/game-35 | web tool | fullscreen-start (click) | block | (none) | view_html_game_page | board | - |
| 26 | https://johnharper.itch.io/blades-in-the-dark | physical (paid, bundle row) | - | block | align_center has_image | buy_on_top | widget | - |
| 27 | https://creator-44.itch.io/game-08 | free/PWYW download | - | block | align_center has_image | buy_on_top | widget | - |
| 28 | https://maddymakesgamesinc.itch.io/celeste | paid download | - | block | align_center has_image | buy_on_top | board | - |
| 29 | https://teamsalvato.itch.io/ddlc | free/PWYW download | - | block | align_center has_image | buy_on_top | board | - |
| 30 | https://tobyfox.itch.io/deltarune | free download | - | block | align_center has_image | direct_download | none (comments off) | - |
| 31 | https://creator-59.itch.io/game-24 | web comic | auto-load +fs-btn | none | (none) | view_html_game_page | none (comments off) | - |
| 32 | https://creator-50.itch.io/game-14 | web game | fullscreen-start (click) | none | (none) | view_html_game_page | widget | - |
| 33 | https://creator-56.itch.io/game-20 | web game | click-to-launch | block | align_center has_image | view_html_game_page buy_on_top | widget | - |
| 34 | https://creator-80.itch.io/game-47 | web game | auto-load +fs-btn | block | (none) | view_html_game_page buy_on_top | none (comments off) | - |
| 35 | https://nomnomnami.itch.io/her-tears-were-my-light | web game | click-to-launch +fs-btn | block | align_left has_image | view_html_game_page buy_on_top | widget | - |
| 36 | https://kay-yu.itch.io/holocure | free download | - | none | align_center has_image | direct_download | none (comments off) | - |
| 37 | https://creator-61.itch.io/game-26 | physical (PWYW) | - | block | (none) | buy_on_top | none (comments off) | - |
| 38 | https://kenney.itch.io/kenney-game-assets | asset (PWYW) | - | block | align_center has_image | buy_on_top | board | 1987 |
| 39 | https://creator-73.itch.io/game-40 | physical | - | block | align_center has_image | buy_on_top | widget | - |
| 40 | https://limezu.itch.io/moderninteriors | paid asset (goal banner) | - | block | align_center has_image | buy_on_top | widget | - |
| 41 | https://orama-interactive.itch.io/pixelorama | web tool | click-to-launch +fs-btn | block | align_center has_image | view_html_game_page buy_on_top | widget | - |
| 42 | https://creator-60.itch.io/game-25 | web game + downloads | auto-load | none | (none) | view_html_game_page direct_download | board | - |
| 43 | https://creator-91.itch.io/game-58 | paid download | - | block | align_center has_image | buy_on_top | widget | - |
| 44 | https://poncle.itch.io/vampire-survivors | web game (demo) | click-to-launch +fs-btn | none | align_center has_image | view_html_game_page | widget | - |
| 45 | https://creator-78.itch.io/game-45 | free download | - | block | align_center has_image | buy_on_top | board | - |
| 46 | https://creator-87.itch.io/game-53 | physical (paid, rewards) | - | block | align_left has_image | buy_on_top | widget | - |
| 47 | https://ncase.itch.io/wbwwb | web game | auto-load | none | (none) | view_html_game_page | none (comments off) | - |
| 48 | https://doublefine.itch.io/brutal-legend | paid download, on sale, big video | - | block | align_left has_image | buy_on_top | none (comments off) | 582 |
| J1–J2 | 2 Trijam #393 submissions (voting open) | web games | click-to-launch (one +fs-btn) | — | (none) | view_html_game_page | — | - |

Totals: 48 pages; 18 with an HTML5 frame (5 auto-load, 4 auto-load + fullscreen button, 1 click-to-launch, 5 click-to-launch + fullscreen button, 3 fullscreen-start); 23 with `style#custom_css`; 14 with `right_col{display:none}`; 30 with comments on the page, 10 with a community-board preview, 8 with neither (comments disabled) — corrected by the verifier, see §12.

Other URLs fetched (same date):

| what | URL | custom CSS? | page type (`body[data-page_name]`) |
|---|---|---|---|
| devlog post | https://comigo.itch.io/better-creator-pages/devlog/169754/creating-categories-in-itchio-creator-pages | **same md5 as project** | `game.devlog_post` |
| devlog post | https://creator-55.itch.io/game-19/devlog/<id>/<post> | same | `game.devlog_post` |
| devlog post | https://alienmelon.itch.io/electric-zine-maker/devlog/288222/update-12-the-big-one-new-ui-new-templates | same | `game.devlog_post` |
| devlog post | https://creator-47.itch.io/game-11/devlog/<id>/<post> | same | `game.devlog_post` |
| devlog post | https://adamgryu.itch.io/a-short-hike/devlog/221497/version-1814-brazilian-portuguese-support | same | `game.devlog_post` |
| devlog post (project has no CSS) | https://creator-78.itch.io/game-45/devlog/<id>/<post> | none (project has none) | `game.devlog_post` |
| devlog index | `/devlog` of better-creator-pages, game-11, a-short-hike | same | `game.devlog` |
| comments page | https://creator-47.itch.io/game-11/comments | same | `game.comments` |
| community board | https://kenney.itch.io/kenney-game-assets/community, https://adamgryu.itch.io/a-short-hike/community | **no** (site layout, `main.css`, `style#jam_theme`) | `game.community` |
| community topic | https://itch.io/t/832300/important-macos-catalina-compatibility-issues | **no** | `community.topic_slug` |
| purchase popup | `/purchase` of a-short-hike, kenney-game-assets, game-11 | **no** (`popup.css`, no `#wrapper`) | `game_purchase` |
| AMP devlog | https://itch.io/devlog/288222/update-12-the-big-one-new-ui-new-templates.amp | **no** | (none) |
| download interstitial | `/<project>/download/<key>` | **not fetched (robots)** | — |
| stylesheet | https://static.itch.io/game.css?1791970861 (164,629 bytes, Last-Modified 2026-10-06). At 13:06Z pages linked `game.css?1791981660` instead: byte-identical (md5 `c97fee7b…`), so the query is a site build number, not a CSS version | — | — |
| game iframe | `https://html-classic.itch.zone/html/<id>/index.html` (one game, body discarded) | — | — |
| refetch | a-short-hike fetched twice; desktop vs iPhone UA comparison on kenney-game-assets | — | — |

## 3. `<head>` order on project, devlog and comments pages

Observed on all 32 fetched pages that have custom CSS (project pages, devlog posts/indexes, comments):

1. `<link href="https://static.itch.io/game.css?<build>">` — the only itch stylesheet.
2. inline/external scripts (`lib.min.js`, `bundle.min.js`, `game.min.js`, …).
3. `<style id="game_theme" type="text/css">` — theme-editor output.
4. 0–2 `<link href="https://fonts.googleapis.com/css?family=<Font>%3A400%2C400italic%2C700%2C700italic">` — one link for the body font if it is a Google font, then one for the headings font whenever a Google headings font is set (even when it is the same font as the body: 3 pages load the same family twice). Lato (the default), the generic `sans-serif`/`serif` choices (`family_sans-serif`, `family_serif`) and the pixel font (`family_pixel`, `'04b_03'`, self-hosted by game.css) get no link: `game.css` self-hosts Lato 400/400i/700/900 with `@font-face`. *(Verifier note, §12.)*
5. `<style id="custom_css" type="text/css">` — **always the last element of `<head>`**.

Consequence: custom CSS wins every specificity tie against `game.css` and `game_theme`.

## 4. Canonical DOM skeleton — project page (sanitized, logged out)

```
body.game_layout_widget.layout_widget.responsive.no_theme_toggle.locale_en[data-page_name="view_game"]
     (+ .embedded_game on HTML5 pages, + .has_site_header on some pages; class ORDER is random per request)
  [div.game_header_widget.header_widget …]      only with body.has_site_header (seen on 5/5 jam entries in voting: 2 + 3 verifier; contains a.skip_to_main + h1.title)
  [div.goal_banner_widget > .goal_banner_inner]  fundraising goal (seen 1x; verifier saw 2 more)
  [div.jam_banner.above_game_banner > .jam_banner_inner.above_game_banner_inner > .jam_cover + .jam_information(h3, .banner_cta a.button.outline.forward_link)]   jam in voting
  ul#user_tools.user_tools.hidden               action buttons (fixed top-right only >1300px; absolute <=1300; static bar <=960; fixed bottom tab bar <=650): li > a.action_btn (+ li.community_link, li.devlog_link, li.jam_entry, related_games_btn)
  div#wrapper.main.wrapper.game_page_wrapper
    div#inner_column.inner_column.size_{small|medium|large|very_large}.family_{lato|pixel|<google-font-slug>}
      div#header.header[.align_left|.align_center][.has_image]
        img[alt]                                only with a banner; alt = project title by default (35/37), creator-written alt text on 2/37
        h1.game_title                           hidden by game.css if .has_image OR body.embedded_game
      div#view_game_<random>.view_game_page.page_widget.base_widget[.buy_on_top|.direct_download]
         (HTML5: id view_html_game_<random>, extra classes .view_html_game_page .ready)
        div#html_embed_<random>.html_embed_widget.base_widget.embed_wrapper      HTML5 only
          div.game_frame[.game_loaded|.game_pending][.start_maximized][data-width][data-height][style="width:Wpx;height:Hpx"]
            [button.fullscreen_btn > img]
            iframe#game_drop                                  auto-load mode
            | div.iframe_placeholder[data-iframe="<escaped iframe>"] > button.button.load_iframe_btn   click-to-launch
            | div.restore_wrapper > button.restore_btn.button  + the placeholder                     fullscreen-start
        div.donate > a.button.donate_btn                     HTML5 only (instead of .header_buy_row)
        div.header_buy_row > p + [div.bundle_row] + div.buy_row   non-HTML5 only (bundle_row repeated here when the project is in a bundle)
          | div.header_buy_row > p + div.direct_download_row > button.button.direct_download_btn   on .direct_download pages (5/5); game.css only shows .header_buy_row for .buy_on_top or at <=1000px
        [div.video_embed.big_video > div.video_embed_widget > iframe(youtube)]   "big video" layout (seen 1x)
        div.columns
          div.left_col.column
            div.formatted_description.user_formatted          the description (first child whenever it exists; 1/48 page had none)
            div.more_information_toggle > div.toggle_row > a.toggle_info_btn
                                        + div.info_panel_wrapper > div.game_info_panel_widget > table > tbody > tr > td + td
            h2#download | h2#purchase
            [div.bundle_row > .bundle_info(.bundle_label, .bundle_title > a) + a.button]
            div.buy_row > div.button_message > a.button.buy_btn + span.buy_message
                 (span.buy_message > [a.sale_link > .sale_label > .main_label + .sub_label] [span.dollars.original_price] [span.dollars] span.sub)
            div.uploads > (p | h2#download) + div.upload_list_widget > div.upload
                 > [a.button.download_btn] + div.info_column > div.upload_name(strong.name, span.file_size, span.download_platforms > span.icon.icon-<os>) [+ div.build_row > span.version_name]
            [h2#demo + div.uploads.for_demo.has_buttons]
            [div.rewards > h2#rewards + p.reward_summary + div.rewards_list > div.reward_row(h3, div.user_formatted, div.reward_footer)]   (position varies: before .uploads on 1 page, before h2#demo on 1 page)
            [div.download_instructions > h2#instructions + div.formatted_description.user_formatted]   <- 2nd .formatted_description!
            [h2 + div.app_store_links > a.store_btn]
            [section#devlog.game_devlog > h2 + ul > li > a + div.post_date > abbr]
            div.game_comments_widget#game_comments_<random> > h2#comments + p.form_placeholder + div.community_topic_posts_widget
                 > div.topic_pager + div.community_post_list_widget > div.community_post#post-<id> > div.post_grid(a.avatar_container, div.post_header, div.post_content > div.post_body.user_formatted + div.post_footer)
            | section.community_summary > div.game_community_preview_widget > h2 + div.community_topics > div.community_topic_row … + div.post_links
          div.right_col.column                                ALWAYS present (48/48), even when the theme hides it
            div.video_embed [> div.video_embed_widget > iframe]   empty div when no video (game.css: :empty → display:none); ABSENT from .right_col on the big_video page (it moved up)
            div.screenshot_list > a[href][data-image_lightbox][target] > img.screenshot[data-screenshot_id][srcset][src]   (no alt attribute on 47/48 pages; 1 page had a descriptive alt on all 42 screenshots; in a fresh sample of 8 css-filtered pages, 4 had creator alt text on some or all screenshots; GIF-like screenshots can lack srcset and data-screenshot_id: 7 imgs with class+src only)
      div#view_game_footer.footer > a.icon_logo + a + span.dot + … a.report_game_btn + a.embed_game_btn + div.update_timestamp + div.breadcrumbs
```

`#inner_column` always has exactly 3 children: `#header`, the page widget, `#view_game_footer.footer` (48/48).

Left-column order was the same in 46/48 pages (only optional blocks were missing): description → more-info toggle → download/purchase heading → bundle row → buy row → uploads → demo uploads → rewards → install instructions → app-store links → devlog list → comments widget **or** community preview (or neither: 8/48). **Verifier correction:** `.rewards` came *before* `.uploads` on one physical-game page (no `h2#purchase`/`.buy_row` in the left column) and *before* `h2#demo` on another, so don't rely on the position of `.rewards`.

### 4.1 HTML5 embed variants (server-rendered)

| mode | `.game_frame` classes | children before click |
|---|---|---|
| auto-load ("embed in page", auto start) | `game_frame game_loaded` | `iframe#game_drop` |
| click-to-launch | `game_frame game_pending` | `div.iframe_placeholder[data-iframe] > button.button.load_iframe_btn` |
| fullscreen start ("launch in fullscreen") | `game_frame start_maximized game_pending` | `div.restore_wrapper > button.restore_btn.button` + the placeholder (> `button.load_iframe_btn`); game.css hides `.restore_wrapper` until `.game_loaded`, so before the click visitors see the placeholder |
| any + fullscreen button option | adds `button.fullscreen_btn > img` as first child | |

- The frame carries an inline `style="width:Wpx;height:Hpx"` plus `data-width`/`data-height` (fullscreen-start pages showed 640×360).
- The iframe (direct or inside `data-iframe`) points to `https://html-classic.itch.zone/html/<id>/index.html`, has `allowtransparency="true"`, `allowfullscreen`, `frameborder="0"`, and `allow="autoplay; fullscreen *; geolocation; microphone; camera; midi; monetization; xr-spatial-tracking; gamepad; gyroscope; accelerometer; xr; cross-origin-isolated; web-share"`. It never had a `sandbox` attribute (17/17; verifier: 33 iframes on 28 pages). It also carries `mozallowfullscreen`, `msallowfullscreen`, `webkitallowfullscreen` and usually `scrolling`; some `src` values use `/html/<id>-<id>/index.html?v=<n>`.

## 5. Devlog / comments skeletons

```
devlog post  (body[data-page_name="game.devlog_post"])
#wrapper.main.wrapper.game_page_wrapper > #inner_column.inner_column.size_*.family_*
  #header.header… > a(href=project) > img      + h1.game_title     <- banner is wrapped in a link here
  div#game_devlog_post_<random>.game_devlog_post_page.page_widget.base_widget
    div.split_columns
      div.primary_column
        section.post_header > h1 + div.breadcrumbs + div.post_meta(div.like_button_drop, a, span.author_twitter, div.post_social) + hr
        section#object_text_widget_<random>.object_text_widget_widget.base_widget.user_formatted.post_body
        [section.post_files > h2 + div.upload_list_widget]
        [section.game_download > h2 + div.game_downloader_widget > a.button.buy_btn + span.buy_message]
      div.game_metadata > section(h3, p) + section.add_collection_row + section > div.game_info_panel_widget + section.more_posts
    div.game_comments_widget …
  #view_game_footer.footer

devlog index (body[data-page_name="game.devlog"])
  #header … (banner in a link)
  div.game_devlog_page.page_widget.base_widget > p.breadcrumbs + div.devlog > h2 + ul.blog_post_list_widget
      > li > div > a.title  + div.split_content > div.post_preview(div.meta_row > span + div.post_likes, a.summary_link > div.summary) + img.post_image
  #view_game_footer.footer

comments page (body[data-page_name="game.comments"])
  #header … (banner in a link)
  div.game_comments_page.page_widget.base_widget > p.breadcrumbs + div.game_comments_widget …
  #view_game_footer.footer
```

None of these pages has `.columns`, `.left_col`, `.right_col` or `.formatted_description`.

## 6. `style#game_theme` dissection

- Same **40 selector groups on all 48 pages** (`theme.py`). Only the values change.
- `:root{--itchio_ui_bg; --itchio_ui_bg_dark}`.
- `.wrapper{ --itchio_font_family; --itchio_bg_color; --itchio_bg2_color; --itchio_bg2_sub; --itchio_text_color; --itchio_link_color; --itchio_border_color; --itchio_button_color; --itchio_button_fg_color; --itchio_button_shadow_color; background-color:<BG>; /*! */ [background-image:url(img.itch.zone…); background-repeat; background-position; background-attachment:fixed] /* */ }`. `.wrapper` is the same element as `#wrapper`.
  - 19/48 had a background image (all on `img.itch.zone`). `background-repeat`: repeat 11, no-repeat 7, repeat-y 1. `background-position`: `50% 0` 17, `0 0` 2. `fixed`: 11. *(Corrected by the verifier from 17/10/6/15, §12.)*
- `.inner_column{color:<text>; font-family:<Font>,Lato,LatoExtended,sans-serif; background-color:rgba(<BG2>,<alpha>)}`. Alphas seen: 0, .2, .62, .75, .85, .86, .88, .95, 1 (the BG2 transparency slider).
- `.inner_column h1…h6{font-family:inherit|<headings font>; font-weight:bold|900; color:inherit|<hex>}` (11/48 non-inherit colour, 24/48 use weight 900, 15/48 set a headings font other than `inherit`).
- Colours are **hard-coded hex/rgba**, not `var()`: `.inner_column a, .inner_column .footer a{color}`, `.inner_column .button, …:hover, …:active{background-color; color; text-shadow}`, `.inner_column hr`, `.inner_column table`, `::selection`, plus about 20 `.game_comments_widget …` rules, `.view_game_page .game_info_panel_widget{background}`, `.view_game_page .star_value .star_fill`, `.view_game_page .reward_row, .bundle_row{border-color}`, `.game_devlog_page li .meta_row .post_likes`, `.game_devlog_post_page .post_like_button`, `.game_community_preview_widget .community_topic_row .topic_tag`, `.footer .svgicon, .view_game_page .more_information_toggle .svgicon{fill:… !important}`. The theme's `!important` declarations (48/48) are: the reward/bundle `border-color`, the svgicon `fill`, and redactor/markdown toolbar button colours. Highest theme specificity is (0,5,1); no id selectors.
- `.game_frame{background:<embed bg>; /*! */ [background-image …] /* */}` and `.game_frame .embed_info{background-color}`. 5/48 had an embed background (3 images, 2 linear gradients).
- `.view_game_page .right_col{display:block|none}` = the "Screenshots" option (Auto hides it on HTML5 pages; Sidebar; Hidden). Seen `none` on 14/48: 10 HTML5 and 4 downloadable pages (second verifier's cross-tab; the first pass said 9 + 5). 8 HTML5 pages use `block`.
- Layout options that act through classes instead of the theme block: `#header.align_left|align_center` (`align_right` exists in game.css), `.has_image`; `#inner_column.size_*` and `.family_*`; `.view_game_page.buy_on_top` / `.direct_download`; `.video_embed.big_video`.

Profile pages differ here: the theme puts its variables on `.user_page`, a child of `#wrapper`.

## 7. `game.css` layout rules relevant to custom CSS (summary, not a copy)

| rule (selector → key values) | note |
|---|---|
| no rule uses `#wrapper`, `#inner_column`, `#header`, `#game_drop` | any ID-scoped custom rule outranks game.css |
| `.inner_column` → width 960px, margin 0 auto, position relative, padding-bottom 40px, background white, **overflow hidden** | `.responsive .inner_column` → width auto, max-width 960px |
| `≤1000px .responsive .inner_column` → max-width **600px**, padding-bottom 0 | tablets/phones get a 600px column |
| `.columns` → flex, centered, margin-top 20px; `.left_col` flex 1; `.right_col` width 367px | description = 960 − 367 − 2×20 = 553px (the guide's number) |
| `.view_game_page .formatted_description` → margin 20px, bottom 40px, **top 0**; `>:first-child{margin-top:0}` | |
| `.screenshot_list img/video` → block, max-width 347px | |
| `≤1000px` → `.columns` flex-direction column; `.right_col` order 1, `.left_col` order 2; `.right_col` display block | screenshots move **above** the description on mobile and show even if hidden |
| `≤1000px .screenshot_list` → nowrap, overflow auto, images inline-block 200px tall | horizontal scroller |
| `.responsive .wrapper` → padding 0 20px at ≤1000px, 0 at ≤600px | |
| `.inner_column.size_small/medium/large/very_large` → 11/13/16/19px; very_large → 16px at ≤1000px; `family_pixel` has its own sizes | |
| `.header img{display:none}`, `.header.has_image img{display:inline-block;max-width:100%}`, `.header.has_image{font-size:0}`, `.header.has_image h1{display:none}` | |
| `.embedded_game:not(.embed_disabled) .header .game_title{display:none}` | HTML5 pages never show the h1 title |
| `.view_game_page .header_buy_row{display:none}`; shown with `.buy_on_top` or at ≤1000px | |
| `.view_game_page .info_panel_wrapper{display:none}`; `.more_information_toggle.open` | toggled by JS |
| `.view_game_page .video_embed:empty{display:none}` | |
| `.inner_column .footer` → display flex, **position absolute, bottom 0, left 0, right 0**; static at ≤1000px; extra `padding-bottom:60px` at ≤650px | lives in the 40px bottom padding; the 60px leaves room for the mobile `#user_tools` tab bar |
| `.html_embed_widget .game_frame.maximized` → fixed, 100%/100% `!important`, z-index 1000; `body.frame_maximized{overflow:hidden}`; `.game_pending .fullscreen_btn{display:none}` | |
| `.game_devlog_post_page .split_columns` flex; `.game_metadata` 307px; stacks at ≤1000px | |
| `.has_site_header .user_tools{top:50px}` (≥650px) | |
| `.user_tools` → `position:fixed; top:0; right:0; z-index:2`; `position:absolute` at ≤1300px; static full-width dark bar at ≤960px; **fixed bottom tab bar** (50px, z-index 99) at ≤650px | verifier addition: fixed-bottom custom elements collide with it on phones |
| only id selectors in game.css: `#lightbox_shroud`, `#lightbox_container` (11 rules) | the screenshot lightbox lives in `#lightbox_container`, outside `#wrapper` |
| legacy page-widget classes still styled: `.view_flash_game_page`, `.view_unity_game_page`, `.view_java_game_page` | none seen in the sample |
| breakpoints used (rules per width; 650 = 33 `max-width` + 2 `min-width`, 960 = 7 + 2): 650 (35), 1000 (30), 600 (24), 960 (9), 400 (7), 1300 (3), plus single rules at 700/800/900/920/980/1020/1150/1400 | of the rules that mention `.view_game_page`/`.inner_column`/`.game_frame`/`.html_embed`, 24 are at 1000px, 3 at 400px, 1 at 650px — 1000px is THE project-page breakpoint |

## 8. Response headers

| page type | CSP | X-Frame-Options |
|---|---|---|
| project page (all 52 successful project-page responses, incl. jam entries, refetch and mobile UA) | `Content-Security-Policy: frame-ancestors 'self' https://itch.io` (nothing else) | — |
| devlog post / devlog index / comments / purchase / community / topic | none | `SAMEORIGIN` |
| browse lists | none | `SAMEORIGIN` |
| `html-classic.itch.zone/html/<id>/index.html` | none | none (`Cache-Control` varies: `max-age=1210973` with `?v=…` at 10:21Z, `max-age=2678400` without it at 10:44Z, both Cloudflare HITs; `max-age=1199891` with the same `?v=` at 13:26Z, i.e. 11,082 s less after ~3.08 h: a countdown to a fixed expiry, not a constant) |
| `static.itch.io/game.css` | — | — (`Access-Control-Allow-Origin: *`, `Cross-Origin-Resource-Policy: cross-origin`, `max-age=86400`) |

Every itch HTML response also had `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: no-referrer-when-downgrade`, a Cloudflare front, and set an `itchio_token` cookie (`Domain=.itch.io; HttpOnly; Secure`).

## 9. What real custom CSS looks like (23 project pages, numbers only)

- **Length** (chars in `style#custom_css`): min 39, median about 1,000, max 93,105. **3/23 exceed 5,120** (7,647; 9,004; 93,105, of which 69,436 are `data:` URIs).
- **Served as typed (as far as can be seen):** 10/23 still contain `/* comments */`. Newlines and indentation are preserved, and `>` combinators appear raw (not `&gt;`). No minification, prefixing or scoping is visible. Whether the editor strips anything on save cannot be seen logged out (open question 6).
- **Scoping:** only 1/23 put every selector under `#wrapper`. 3 more scope most selectors (77–96%, depending on how selector lists are split). 19 mostly target bare classes (`.inner_column`, `.header`, `.screenshot`, `.button`, …). One page targets `body.frame_maximized …` and `body:has(.game_frame.maximized) …` to hide `.game_header_widget` / `.above_game_banner`, and another targets `.user_tools`. So itch does not enforce scoping technically; scoping is a rule of the guide.
- **At-rules:** `@media` 6 pages, `@keyframes` 4, `@import` 2 (both Google Fonts, both the first statement). `url()` hosts: `img.itch.zone`, `fonts.googleapis.com`, `data:`.
- **Most-targeted itch classes/ids** (number of pages out of 23): header 7, screenshot 7, inner_column 7, view_game_page 6, #wrapper 6, button 6, header_buy_row 6, user_formatted 5, #inner_column 5, formatted_description 5, uploads 5, buy_row 5, screenshot_list 4, game_comments_widget 4, columns 4, game_devlog 3, game_info_panel_widget 3, right_col 3, game_devlog_post_page 3, vote_counts 3; also seen: #game_drop, #download, load_iframe_btn, game_frame, more_information_toggle, post_body, community_post, footer, user_tools.

## 10. Small verification tests

| test | result |
|---|---|
| Fetch the same project twice | all `*_<number>` widget ids changed (`view_game_`, `upload_list_`, `game_info_panel_`, `game_community_preview_`, `video_embed_`); `custom_css` identical |
| Desktop vs iPhone User-Agent | identical skeleton (155 lines) and identical `custom_css` md5; only the order of body classes differed (verifier: 456-node skeleton with sorted classes identical; attribute order also differs) |
| md5 of `custom_css` on project vs devlog post/index/comments | equal on all 6 projects tested (and the project without CSS has none on its devlog) |
| md5 of `game_theme` on project vs devlog | equal |
| Is `custom_css` the last `<head>` element | yes, 32/32 |
| Jam submission during voting | `.jam_banner.above_game_banner` rendered **before `#wrapper`**; after the jam, only `li.jam_entry` in `#user_tools` (10 sampled pages) |

## 11. Open questions (not testable logged out / out of budget)

1. Does the **project** CSS editor still enforce a ~5,120-character cap? Served CSS of 7.6 KB, 9 KB and 93 KB exists (possibly older or grandfathered). Needs an account: paste 6,000 characters and save.
2. What turns on `body.has_site_header` (the itch site header above a project page)? Seen on 5/5 submissions of a jam in voting (always together with `.jam_banner.above_game_banner`) and 0/75 other project pages. Compare the same entry before and after voting ends.
3. Does the download interstitial (`/<project>/download/<key>`) carry `style#custom_css`? Robots forbids automated fetching; check by hand in a browser.
4. Does `#wrapper{--itchio_link_color:…}` visibly change anything on a project page, given the theme hard-codes hex colours on `.inner_column a`? Test with a saved page in a local harness and `getComputedStyle`.
5. Which editor labels map to `size_*`, the headings colour, `big_video`, and `align_right`? Needs the theme editor.
6. Does saving project CSS rewrite or strip anything (non-Google `@import`, `</style>`, `expression()`, `javascript:` URLs)? Needs an account.
7. Runtime classes (`body.frame_maximized`, `.game_frame.maximized`, `.game_loaded` after click, `.more_information_toggle.open`) are added by JS. Confirm in a real browser.
8. Legacy or rare embed variants (`.embed_disabled`, Unity/Java/Flash classes in game.css, "open in new window") were not in the sample.

## 12. Verification (2026-10-14)

A second agent re-checked facts `crawlproject-01` … `-56` between 10:37 and 10:50 UTC, logged out, using curl only (no browser tools).

### 12.1 Method

- **Independent tools** (own code, not the tools above), in `crawlproject-tools/verify/`:
  - `vget.sh`: fetcher with a robots guard, 5 s spacing and one 60 s retry on 429.
  - `vdom.py`: stdlib tree builder that outputs JSON per page.
  - `vagg.py`: tallies over pages.
  - `vcss.py`: flattens a stylesheet into media/selector/body rows and greps them.
  - `vtheme.py`: inventory of `style#game_theme`.
  - `vcssstats.py`: numbers about `style#custom_css`; it never prints CSS.
- **Fresh fetches:** 47 successful GETs to itch hosts. 3 got HTTP 429 and were retried. 4 had malformed URLs and never left the machine. They covered:
  - `static.itch.io/game.css?1791970861` (md5 `c97fee7b…`, byte-identical to the first agent's copy).
  - 19 pages of the original sample, re-fetched: a-short-hike (twice), holocure, celeste, brutal-legend, blades-in-the-dark, game-53, anxiety, game-20, game-14, pixelorama, moderninteriors, game-83, game-11, game-46, kenney-game-assets (desktop and iPhone UA), better-creator-pages, game-25.
  - **8 new project pages** taken from `https://itch.io/games/css` and `/games/css/platform-web`. They are not listed by name; all 8 have custom CSS.
  - game-11's `/devlog`, one devlog post and `/comments`, plus the game-45 devlog post.
  - a-short-hike `/purchase`, kenney `/community`, the topic `itch.io/t/832300/…`, the AMP devlog and `kenney.itch.io/robots.txt`.
  - `itch.io/jam/420634/entries.json`, then 3 more Trijam #393 entries (still in voting) and the rate page of one of them.
  - The jam rate page linked from game-11's `li.jam_entry` (`itch.io/jam/yanjam25/rate/3367389`).
  - `html-classic.itch.zone/html/1830885/index.html` and the forum topic `itch.io/t/227363/…`.
- **Re-read of the first agent's raw HTML** (48 project pages, the refetch, the mobile fetch and 2 jam entries) with `vdom.py`, `vtheme.py` and `vcssstats.py`, to re-check every count.
- **Docs:** WebFetch of `itch.io/updates/a-new-theme-editor-for-project-pages`, `itch.io/docs/creators/css-guide`, `itch.io/t/960159/…`, `itch.io/t/227363/…`, and MDN `position` and `Containing_block`.

To re-run (Git Bash; pass Windows paths to Python with `cygpath -m`):

```bash
V=knowledge/evidence/crawlproject-tools/verify; export OUT=/tmp/cpv
printf 'p-ashorthike https://adamgryu.itch.io/a-short-hike\n' > list.txt   # one "name url [iphone]" per line
bash $V/vget.sh list.txt
python -I -X utf8 $V/vdom.py $(cygpath -m $OUT/raw)/p-*.html > a.json && python -I -X utf8 $V/vagg.py a.json
python -I -X utf8 $V/vcss.py $(cygpath -m $OUT/raw)/s-gamecss.html '\.columns|right_col'   # grep game.css rules
python -I -X utf8 $V/vtheme.py $V/vcss.py $(cygpath -m $OUT/raw)/p-*.html
python -I -X utf8 $V/vcssstats.py $V/vcss.py $(cygpath -m $OUT/raw)/p-*.html
```

### 12.2 Results that changed the record

| topic | first pass | verifier finding |
|---|---|---|
| Comments vs board | 30 widget, 18 board | 30 widget, **10** board, **8 with neither** (comments off; §2 now marks those 8 rows). New pages: 18 widget, 6 board, 3 neither, out of 27 |
| `.left_col` order | Identical on all pages | `.rewards` came before `.uploads` on 1 page and before `h2#demo` on 1 page. Everything else holds on 48 + 27 pages |
| `.right_col` children | Always `.video_embed` + `.screenshot_list` | The big_video page has **only** `.screenshot_list` (2 fetches) |
| Screenshot `alt` | Never present | Absent on 47/48. One asset page has a descriptive `alt` on all 42 screenshots; the re-fetch still shows it |
| Theme background images | 17/48 | **19/48**: repeat 11, no-repeat 7, repeat-y 1; position `50% 0` 17, `0 0` 2; fixed 11 |
| `size_*` | large 33, very_large 13, medium 1 | **large 35, very_large 12, medium 1** (48 pages) |
| Info-panel labels | Status 47, Rating 47, … | Status 48, Rating 48, Author 45, Tags 45, Platforms 36, Updated 34, Genre 34, … One fresh page has a new "AI Disclosure" label |
| Google Fonts links | A second link if the headings font differs | A headings link appears whenever a Google headings font is set, even if it equals the body font (3 pages load it twice). Generic `sans-serif`/`serif` and `family_pixel` get no link |
| `.header_buy_row` | `p + .buy_row` | `p + [.bundle_row] + .buy_row`: all 3 bundle pages repeat the bundle row at the top |
| `.user_tools` | Fixed top-right | Fixed only above 1300px; absolute at ≤1300px; static bar at ≤960px; fixed bottom tab bar at ≤650px |
| `.restore_wrapper` | Pre-launch screen | Hidden by `.game_frame:not(.game_loaded) .restore_wrapper{display:none}`. Before the click, fullscreen-start pages show `.iframe_placeholder > .load_iframe_btn` |
| Containing block | transform, filter, contain | MDN also lists `backdrop-filter`, `perspective`, `rotate`/`scale`/`translate`, `will-change` and `content-visibility:auto`. So the frosted-panel tip (`backdrop-filter` on `#inner_column`) would trap the maximized game inside the overflow-hidden column |
| `html-classic` cache | max-age ≈ 1.2 M s | Varies: 1,210,973 s with `?v=`, 2,678,400 s without |
| Rate limiting | 4 s spacing is safe | 3 × 429 at 5 s spacing (parallel agents on the same IP) |
| Forum 227363 as the source for `/games/css` | "Admin pointed to /games/css" | The topic (3 posts) never mentions it. The facet itself is confirmed: 27/27 listed pages have custom CSS |
| Large custom CSS | 3/23 over 5,120 chars | 4 of the 8 new pages are too (5,366; 5,968; 9,683; 15,737), so 7/31 |
| Jam rate page | Open question | **No** `custom_css` or `game_theme` there (`main.css` + `style#jam_theme`, `data-page_name="jam_rate_game"`), even for a project with 9,004 chars of custom CSS |
| `.view_game_page` children (48 unique pages) | 28 / 12 / 5 | `.header_buy_row > .columns` 29, `+ .video_embed.big_video` 1, `.embed_wrapper > .donate > .columns` 13, `.embed_wrapper > .columns` 5 |
| headings | 11/47 colour, 23/47 weight 900 | 11/48 colour, 24/48 weight 900 |
| `has_site_header` | 2 jam entries | 5/5 entries during voting, always with the jam banner. The header adds `a.skip_to_main` and an `h1.title` outside `#wrapper` |

These held on the fresh data:
- **Page skeleton:**
  - The wrapper/inner_column skeleton matched on 75/75 project pages, new ones included.
  - `#inner_column` has three children.
  - Numbered ids are random (refetch diff).
  - Body classes match, and class and attribute order is random.
- **Head and headers:**
  - In the head, `style#custom_css` comes last on 42/42 pages with CSS.
  - Project pages send the CSP `frame-ancestors 'self' https://itch.io` (30/30 fresh).
  - Devlog, comments, purchase, community and AMP pages send `X-Frame-Options: SAMEORIGIN` instead.
- **Shared CSS across pages:** the `custom_css` and `game_theme` md5 are identical on the project page, a devlog post, the devlog index and the comments page.
- **Theme and game.css:**
  - The theme has the same 40 selector groups and variable set (48/48).
  - Every quoted `game.css` rule is there.
- **Game iframe:** it has the `allow` list and no `sandbox` (33 iframes on 28 pages).
- **User-Agent:** desktop and iPhone UA get an identical DOM.

### 12.3 Verdicts

| id | verdict | id | verdict | id | verdict | id | verdict |
|---|---|---|---|---|---|---|---|
| 01 | confirmed | 15 | corrected | 29 | confirmed | 43 | confirmed |
| 02 | corrected | 16 | confirmed | 30 | corrected | 44 | confirmed |
| 03 | corrected | 17 | confirmed | 31 | confirmed | 45 | corrected |
| 04 | confirmed | 18 | confirmed | 32 | confirmed | 46 | corrected |
| 05 | confirmed | 19 | corrected | 33 | confirmed | 47 | corrected |
| 06 | corrected | 20 | corrected | 34 | confirmed | 48 | confirmed |
| 07 | confirmed | 21 | confirmed | 35 | confirmed | 49 | confirmed |
| 08 | corrected | 22 | corrected | 36 | corrected | 50 | confirmed |
| 09 | confirmed | 23 | corrected | 37 | confirmed | 51 | corrected |
| 10 | corrected | 24 | corrected | 38 | confirmed | 52 | corrected |
| 11 | corrected | 25 | corrected | 39 | confirmed | 53 | confirmed |
| 12 | corrected | 26 | corrected | 40 | confirmed | 54 | corrected |
| 13 | confirmed | 27 | corrected | 41 | confirmed | 55 | confirmed |
| 14 | corrected | 28 | corrected | 42 | corrected | 56 | corrected |

The verifier added new facts `crawlproject-57` … `-63`:
- 57: the jam rate page.
- 58: site-header headings.
- 59: the `#user_tools` mobile bar.
- 60: the containing-block trap.
- 61: third-party `url()` hosts.
- 62: lightbox and legacy classes.
- 63: the 1000px breakpoint.

## 13. Second verification (2026-10-14)

A third agent re-checked facts `crawlproject-01` … `-56` again, adversarially, between 13:06 and 13:26 UTC. It was logged out and used curl and WebFetch only, no browser tools. It wrote its own parser and did not reuse the first two agents' scripts.

### 13.1 Method

- **Tools** in `crawlproject-tools/verify2/` (stdlib Python, own code):
  - `fetch.sh`: robots guard, browser UA, 6 s spacing, one 70 s retry on 429.
  - `tree.py`: HTML tree builder.
  - `flat.py`: flattens a stylesheet to (media, selector, body) rows.
  - `page.py`: per-page JSON (body/wrapper/inner/header/page widget/columns/embed/head/ids, custom_css and theme md5).
  - `sk.py`: tag/id/class skeleton of one subtree, never text.
  - `agg.py`: census over many pages.
  - `theme.py`: `style#game_theme` inventory.
  - `cssstats.py`: numbers about `style#custom_css`; it never prints CSS.
- **Fresh GETs** (48 logged, 6 × HTTP 429, all retried once successfully):
  - 17 project pages of the original sample, including a-short-hike twice, kenney-game-assets with desktop and iPhone UA, and brutal-legend, holocure, celeste, blades-in-the-dark, game-53, anxiety, game-20, game-14, pixelorama, moderninteriors, game-83, game-11 and game-46.
  - game-11 `/devlog`, `/devlog/<id>/<post>` and `/comments`, plus the game-45 devlog post.
  - `/purchase` (a-short-hike), `/community` (kenney), the forum topic 832300, the AMP devlog and `kenney.itch.io/robots.txt`.
  - `static.itch.io/game.css?1791981660`.
  - `itch.io/game-assets/css` and `itch.io/games/css?page=3`.
  - **8 never-sampled project pages**: the first unseen entries of those two lists (4 + 4, not named here). All 8 have custom CSS.
  - `itch.io/jam/420634/entries.json` and **2 further Trijam #393 entries** (voting still open).
  - `html-classic.itch.zone/html/1830885/index.html?v=…` (headers only) and its `robots.txt`.
- **Re-read with the new tools:** the first agent's 48 raw pages and the previous verifier's 8 new pages, to recount everything.
- **WebFetch:**
  - itch: the 2017 theme-editor post, the live CSS guide, and forum topics 227363 and 960159.
  - MDN: `@import` and *Containing block*.

Re-run (Git Bash; Python paths via `cygpath -m`):

```bash
V=knowledge/evidence/crawlproject-tools/verify2; export OUT=/tmp/cpv2
printf 'p-ashorthike https://adamgryu.itch.io/a-short-hike\np-ashorthike-b https://adamgryu.itch.io/a-short-hike\n' > l.txt
bash $V/fetch.sh l.txt
python -I -X utf8 $V/agg.py   $(cygpath -m $OUT/raw)/p-*.html      # DOM census
python -I -X utf8 $V/theme.py $(cygpath -m $OUT/raw)/p-*.html      # theme inventory
python -I -X utf8 $V/cssstats.py $(cygpath -m $OUT/raw)/p-*.html   # custom_css numbers
python -I -X utf8 $V/sk.py $(cygpath -m $OUT/raw)/p-ashorthike.html .header_buy_row 6
python -I -X utf8 $V/flat.py game.css '\.columns|right_col'        # grep game.css rules
```

### 13.2 Recounts (original 48 pages, own parser)

| item | first pass | recount |
|---|---|---|
| `.view_game_page` children | 28 / 12 / 5 | `.header_buy_row > .columns` 29, `+ .video_embed.big_video` 1, `.embed_wrapper > .donate > .columns` 13, `.embed_wrapper > .columns` 5 |
| distinct `.left_col` sequences | 24 | **27**. Order breaks on 2 pages (`.rewards` before `.uploads`, and before `h2#demo`) |
| comments | 30 widget / 18 board | 30 widget / **10** board / **8** neither / 0 both |
| `.right_col` children | always `.video_embed` + `.screenshot_list` | 47 + **1 page with only `.screenshot_list`** (the big-video page, re-fetched: no empty `.video_embed` left in `.right_col`) |
| `size_*` | large 33, very_large 13, medium 1 | large **35**, very_large **12**, medium 1 |
| `.wrapper` background image | 17; repeat 10 / no-repeat 6; `50% 0` 15; fixed 11 | **19**; repeat 11 / no-repeat 7 / repeat-y 1; `50% 0` 17 / `0 0` 2; fixed 11 (all between `/*! */` markers) |
| headings | 11/47 colour, 23/47 weight 900 | 11/48, 24/48 (15/48 set a headings font) |
| `right_col{display:none}` | 9 HTML5 + 5 downloadable | **10 HTML5 + 4 downloadable** |
| info-panel labels | Status 47, Rating 47, Author 44 … | Status 48, Rating 48, Author 45, Tags 45, Platforms 36, Updated 34, Genre 34, Average session 28, Languages 27, … |
| theme groups touching `.game_comments_widget` | "about 20" | **15** |
| banner `img` alt | = title 36/36 | alt present on 37/37: the title on 35, creator-written text on 2 |
| screenshot alt | none | none on 47/48 original pages, but present (some or all screenshots) on **4 of 8 fresh pages** |
| embed modes | 9 auto / 6 click / 3 fullscreen | same (18/18 inline `style="width;height"` + `data-width/height`; 18/18 iframes on `html-classic.itch.zone`, no `sandbox`, same `allow` list) |
| custom CSS > 5,120 chars | 3/23 | 3/23 confirmed; **8/39** with the 16 newer pages |

### 13.3 New observations

- **game.css build query:** `game.css?1791970861` (10:17Z) and `game.css?1791981660` (13:06Z) are byte-identical.
- **Download buttons:**
  - The main `.uploads` list has `a.button.download_btn` only on `.direct_download` pages (7/7). It has none on any buy-flow page (51/51, paid *and* free or PWYW "Download Now" pages).
  - Demo lists (`.uploads.for_demo.has_buttons`) always have buttons (4/4).
- **`.direct_download` pages:** their `.header_buy_row` holds `p + .direct_download_row > button.button.direct_download_btn`. game.css only sets `display:block` on `.header_buy_row` for `.buy_on_top` or at ≤1000px, so on desktop that row stays hidden.
- **`.buy_message`:** every one ends with `span.sub` (51/51 pages that have a `.buy_row`). 13/64 pages have no `.buy_row` at all.
- **Rewards and store links:**
  - `.reward_footer` holds `em.sold_out_message` (5) or `a.button.reward_btn + span.remaining_count.sub` (1). `.quantity_input` is only in the theme CSS; it was never seen in the DOM.
  - Store links are `a.store_btn.google_play_btn` (4) or `a.store_btn.app_store_btn` (2).
- **Comment posts:** with `.community_post.has_vote_column`, `.post_grid` starts with `div.post_votes` (vote buttons) before `a.avatar_container`. Comment lists also carry `#first-post` / `#last-post` anchors.
- **Jam entries in voting (2 more):**
  - Both again have `body.has_site_header`, `div.game_header_widget` (with `a.skip_to_main` and `h1.title`) and `div.jam_banner.above_game_banner`, all before `#user_tools` / `#wrapper`.
  - The running total is 7/7 voting entries. No other project page has these (0/64).
- **`html-classic.itch.zone` cache:** `max-age` with the same `?v=` dropped from 1,210,973 (10:21Z) to 1,199,891 (13:26Z). It counts down to a fixed expiry. Still no CSP and no X-Frame-Options; `robots.txt` → 404.
- **CSP:** `frame-ancestors 'self' https://itch.io` on 27/27 fresh project-page responses (17 re-fetched, 8 new, 2 jam). Devlog index/post, comments, purchase, community and topic pages have `X-Frame-Options: SAMEORIGIN` and no CSP.
- **Real custom CSS reaching outside `#wrapper`:**
  - 6 of 39 pages target `.user_tools` / `#user_tools`; 2 of them hide parts of it. 1 page hides `.game_header_widget` / `.above_game_banner` while maximized (`body:has(…)`).
  - `:has()` is used in comment styling on 4 pages (5 pages use `:has()` overall).
  - The 16 newer pages: 0 fully scoped, 14 mostly unscoped.
- **Forum 227363:** WebFetch confirms the thread never mentions `/games/css`. The facet works for `/games/css?page=3` and `/game-assets/css` (16/16 sampled pages from css-filtered lists have `style#custom_css`).
- **MDN *Containing block*:** a `position:fixed` descendant gets an ancestor as its containing block when that ancestor has `filter`, `backdrop-filter`, `transform`, `perspective`, `rotate`, `scale` or `translate` other than none, or `contain: layout|paint|strict|content`, or a matching `will-change`, or `content-visibility:auto`.

### 13.4 Verdicts (second pass)

| id | verdict | id | verdict | id | verdict | id | verdict |
|---|---|---|---|---|---|---|---|
| 01 | confirmed | 15 | corrected | 29 | confirmed | 43 | confirmed |
| 02 | corrected | 16 | confirmed | 30 | corrected | 44 | confirmed |
| 03 | corrected | 17 | confirmed | 31 | confirmed | 45 | corrected |
| 04 | confirmed | 18 | confirmed | 32 | confirmed | 46 | confirmed |
| 05 | confirmed | 19 | corrected | 33 | corrected | 47 | confirmed |
| 06 | corrected | 20 | corrected | 34 | confirmed | 48 | confirmed |
| 07 | confirmed | 21 | confirmed | 35 | confirmed | 49 | confirmed |
| 08 | corrected | 22 | corrected | 36 | confirmed | 50 | confirmed |
| 09 | corrected | 23 | corrected | 37 | confirmed | 51 | corrected |
| 10 | corrected | 24 | corrected | 38 | confirmed | 52 | corrected |
| 11 | corrected | 25 | corrected | 39 | confirmed | 53 | confirmed |
| 12 | corrected | 26 | corrected | 40 | confirmed | 54 | corrected |
| 13 | corrected | 27 | corrected | 41 | confirmed | 55 | confirmed |
| 14 | corrected | 28 | corrected | 42 | confirmed | 56 | corrected |

Confidence rule used here:
- `verified`: a live DOM or header observation re-done in this pass.
- `documented`: read from game.css, the guide, the blog or MDN.
- `inferred`: cascade consequences that were not rendered in a browser.

New facts `crawlproject-64` … `-71` were added:
- 64: build query.
- 65: direct-download header row.
- 66: download buttons.
- 67: creator alt text.
- 68: vote column.
- 69: `.header{overflow:hidden}`.
- 70: frosted-panel trap.
- 71: `:has()` in the wild.
