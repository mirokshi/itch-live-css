## Page anatomy (profile, project, devlog, jam)

This section maps the server-rendered DOM that a **logged-out visitor** receives on each page type. It shows which nodes your CSS can reach, which selectors itch promises to keep, and which parts are optional or vary. What logged-in visitors and owners get is collected in §11. Everything was observed on 2026-10-14, except the `live-*` facts of 2026-10-16 (owner views of a draft project and of the profile, and the logged-out profile).

The static bundles were served with three build queries that day: `?1791970861` in the morning, then `?1791981660`, then `?1791985261` from about 14:20 UTC. Their content was byte-identical: `game.css` is 164,629 B with md5 `c97fee7b…` under all three **[verified 2026-10-14 · gapfill03-02]**. Never pin a build query.

How to read it:
- **Trees are sanitized skeletons** written for this knowledge base. The notation is `tag#id.class` only. `N` stands for a random number, `[…]` marks an optional part and `|` separates alternatives. They contain no third-party text or CSS.
- **Confidence tags:**
  - **[verified 2026-10-14 · id]**: reproduced live or by a test;
  - [documented · id]: itch docs or staff;
  - [observed · id]: seen on real pages, not exhaustively;
  - [inferred · id]: deduced from verified facts;
  - [community · id]: third-party reports only.
  - `S03-N*` ids point to the extra checks in the **Section notes** at the end.
  - `gapfill03-*` ids point to the round-2 gap fill in `knowledge/evidence/gapfill.md`.
  - `live-*` ids point to the live probe runs of 2026-10-16 (`knowledge/evidence/live-probes/`). Run 1 read the **owner's logged-in view** of one draft project; Run 2 read the owner's **profile**, logged in and logged out (private window). Both read the page after itch's scripts ran, with the theme editor closed, so each fact holds only for the view and page type its text names. Run 4 (`live-cap-*`) saved generated CSS of set sizes on the profile and the draft project to measure the size caps.
- **This is the HTML before itch's JavaScript runs.** Where it matters, the trees flag what JS changes later: lazy image `src`, removal of `.hidden`, `.game_loaded` after a click, and countdown values.

---

### 1. Rules that hold on every page type

**1. `#wrapper` is the only shared anchor, and it is a different element on each page type.** Scope every rule under it **[verified 2026-10-14 · corpus-31, crawlprofile-01, crawlproject-01, community-29]**.

| Page type | Wrapper element | Parent | What else is on it |
|---|---|---|---|
| Profile | `div#wrapper.user_page_wrap` (no other class; the same on the live profile, owner and logged out **[verified 2026-10-16 · live-dom]**) | `body` (logged out) | The theme paints the background image on `.user_page_wrap`, which is this same node **[verified 2026-10-14 · repo-18]** |
| Project, devlog, comments | `div#wrapper.main.wrapper.game_page_wrapper` (also in a project's owner view **[verified 2026-10-16 · live-dom]**) | `body` (logged out) | The theme sets its variables on `.wrapper`, again this node [observed · docs-23] |
| Jam overview | `div#wrapper.jam_page_wrap` | `body` | It has existed on jams only since the June 2026 revamp [documented · docs-30, crawljam-17] |

- The `.wrapper` class matches only on project and devlog pages. `#wrapper` matches on all three **[verified 2026-10-14 · corpus-31]**.
- Attribute order on the wrapper tag is not stable. In one minute, game-28 served `class…id` and x-moon served `id…class` **[verified 2026-10-14 · corpus-31, S03-N1]**. Tools that string-match `<div id="wrapper"` will miss pages.
- **Never write `body > #wrapper` or `body > .jam_page_wrap`.** Logged out, `#wrapper` is a direct child of `body` on every type **[verified 2026-10-14 · crawljam-18, crawlprofile-01, crawlproject-01]**, and so it was on the live logged-out profile **[verified 2026-10-16 · live-dom]**. In the owner's view, itch wraps it:
  - on jams, in `.theme_editor_columns > .theme_editor_primary_column` [documented · docs-28, crawljam-18];
  - on profiles, in the same wrappers (`div.theme_editor_columns > div.theme_editor_primary_column`, a child of `body`), even with the theme editor closed: first seen in one export **[verified 2026-10-14 · S03-N7, gapfill03-11]**, then on the owner's live profile **[verified 2026-10-16 · live-dom]**;
  - on project pages, in `div.game_page_apperance_columns > div#maincontent.game_page_primary_column` (itch's spelling), a child of `body`, even with the theme editor closed. This was first deduced from `game.css` rules [inferred · gapfill03-12], then seen on the owner's draft project **[verified 2026-10-16 · live-dom]**.

**2. Never target numbered ids.**
- Widget ids such as `#user_N`, `#view_game_N`, `#view_html_game_N`, `#html_embed_N`, `#game_devlog_post_N`, `#user_links_N`, `#jam_header_N` and `#jam_submitter_N` are random per render **[verified 2026-10-14 · crawlproject-01]**.
- The number in `#game_devlog_post_<n>` is an internal widget id, not the post id from the URL **[verified 2026-10-14 · itchcss-47]**.
- Ids without digits that are safe to target:

  | Page | Safe ids |
  |---|---|
  | All with a wrapper | `#wrapper` |
  | Profile | `#profile_header` |
  | Project family | `#inner_column`, `#header`, `#view_game_footer` |
  | Project family, in-page anchors | `h2#download`, `#purchase`, `#demo`, `#rewards`, `#instructions`, `section#devlog`, `h2#comments` |
  | Project family, auto-load embeds only | `#game_drop`, server-rendered on those pages; on other embeds it is created after the click |
  | Jam overview | `#entries`, only when the entries grid is shown |

  **[verified 2026-10-14 · crawlproject-06, crawljam-23]**

**3. `<body>` is outside your scope, and its classes are shuffled.**
- Class order and attribute order on `<body>` change between responses, so never match `[class="…"]` exactly **[verified 2026-10-14 · crawlprofile-45, crawlproject-07]**. itch's scripts also add classes after load: on the live profile `body` gained `disable_hover`, owner and logged out **[verified 2026-10-16 · live-dom]**.
- To scope by page type, use the page-widget class inside `#wrapper` (see §10.2), not body classes.

**4. `style#custom_css` is absent when nothing was saved.** There is no empty placeholder on profiles or projects. Match it in any attribute order, because `<style type="text/css" id="custom_css">` and `<style id="custom_css" type="text/css">` both occur **[verified 2026-10-14 · corpus-15, S03-N1]**.

**5. Some itch UI sits as a body-level sibling before `#wrapper`.** `#wrapper`-scoped CSS cannot style it, and the policy section forbids hiding or covering it.

| Element (child of `body`, before `#wrapper`) | Page types | When present | Evidence |
|---|---|---|---|
| `ul#user_tools.user_tools.hidden` | profile, project, devlog, comments | Always, logged out. Profile: one `li > a.action_btn`, "Follow <name>", linking to login. Projects add more `li`, including `li.jam_entry` for jam entries. `.hidden` is in the served HTML only: on the live logged-out profile, after itch's scripts, it was `ul#user_tools.user_tools`, the first child of `body`. | **[verified 2026-10-14 · crawlprofile-19, crawlproject-08, crawlproject-53]**; live profile **[verified 2026-10-16 · live-dom]** |
| `div.goal_banner_widget` | project | Project has a fundraising goal | **[verified 2026-10-14 · crawlproject-08]** |
| `div.jam_banner.above_game_banner > .jam_banner_inner > .jam_cover + .jam_information` | project | Project is an entry of a jam currently in voting | **[verified 2026-10-14 · crawlproject-53]** |
| `div.game_header_widget.header_widget` (+ `body.has_site_header`) | project, devlog | On 7/7 jam entries in voting and 0/64 other project pages; also on one devlog post, and in the owner's view of a draft project (next rows). Its trigger for visitors is not documented. | [observed · crawlproject-54, a11y-55]; owner view **[verified 2026-10-16 · live-dom]** |
| `div#jam_layout_header_N.jam_layout_header_widget.header_widget.small_logo.gray` | jam overview | Always: the 50px site header with `a.skip_to_main` and a logo `h1.title` | **[verified 2026-10-14 · crawljam-15, itchcss-33]**; [observed · a11y-08] |
| `div.header_widget` … `div.footer` (site chrome, no `#wrapper` at all) | jam subpages, community profiles, 404s | Always | **[verified 2026-10-14 · crawljam-40, crawlprofile-21, crawlprofile-52]** |
| `div#user_profile_header_N.small_logo.user_profile_header_widget.header_widget.base_widget.gray` (with `.owner_tools > button.edit_theme_btn` and `#user_panel_N.user_panel_widget.logged_in`) + `div.theme_editor_columns`. **`#user_tools` is absent**, and `body` adds `.has_header`. | profile, **owner only** | Owner logged in (seen with the theme editor closed) | **[verified 2026-10-14 · S03-N7, gapfill03-11]**, from one June 2026 export; the header widget, `.owner_tools`, `.edit_theme_btn`, `.theme_editor_columns`, `.has_header` and the missing `#user_tools` also on the live profile **[verified 2026-10-16 · live-dom]** (`#user_panel_N` not checked) |
| `div#game_header_N.small_logo.game_header_widget.header_widget.base_widget.gray` with `.owner_tools` and `.edit_theme_btn` (and, from `game.css`, `.publish_status .pub_toggle`), then `div.game_page_apperance_columns > div#maincontent.game_page_primary_column > #wrapper`. `body` adds `.has_site_header`, and **`#user_tools` is absent**. | project, devlog, **owner only** | Owner logged in (seen with the theme editor closed) | Project: **[verified 2026-10-16 · live-dom]**, one draft. `.pub_toggle` and devlogs: [inferred · gapfill03-12], from `game.css` rules only |
| Site header / `#user_tools` for a logged-in **non-owner** | all creator pages | Any logged-in visitor | **Unknown.** `user.css` has `.has_header .user_tools{top:50px}` and `game.css` has `.has_site_header .user_tools{top:50px}`, so both can coexist [inferred · gapfill03-12]; see §11 |

Where `#user_tools` sits:
- **Profile (`user.css`):** `position:fixed;top:0;right:0;z-index:2;pointer-events:none`. Only `li>*` takes clicks.
  - At ≥960px, `.hidden` sets `opacity:0;transform:translate(0,-20px)`. itch's JS removes `.hidden` about 200 ms after load, so real visitors do see it. On the live logged-out profile the class was gone once the scripts had run **[verified 2026-10-16 · live-dom]**.
  - Sources: **[verified 2026-10-14 · crawlprofile-19, crawlprofile-60, itchcss-31, a11y-20]**
- **Project and devlog (`game.css`):** the position depends on width **[verified 2026-10-14 · itchcss-32, crawlproject-08]**.
  - Fixed top-right above 1300px.
  - Absolute from 961 to 1300px.
  - A static full-width strip above `#wrapper` at ≤960px.
  - A 50px fixed bottom tab bar (z-index 99) at ≤650px. The project footer then gets `padding-bottom:60px`.
- Keep fixed or high-z-index custom layers out of the top-right corner. On project pages, also keep them out of the bottom 50px on phones.
- `game.css` hides `#user_tools`, `.above_game_banner` and `.goal_banner_widget` under `.theme_editor_open` with `display:none`. These rules exist **[verified 2026-10-14 · gapfill03-12]**. So the owner's editor preview most likely omits these strips while visitors see them [inferred · gapfill03-12]. On the owner's draft project, `#user_tools` was absent from the DOM even with the editor closed **[verified 2026-10-16 · live-dom]**. Check spacing logged out.

**6. Logged-in UI also lands *inside* `#wrapper`.** Examples are the comment form in `.game_comments_widget` and possibly `.game_cell_tools` on cards [inferred · gapfill03-13, gapfill03-14]. On the owner's profile, there are also pre-rendered hidden items **[verified 2026-10-14 · gapfill03-11; verified 2026-10-16 · live-dom]**. Never write bare `#wrapper textarea`, `#wrapper button`, `#wrapper input`, `#wrapper ul`/`li` or `#wrapper form` rules. Scope them to the user-written containers listed in §10.3. Details and confidence are in §11.

---

### 2. URL forms: which pages your CSS reaches

| Page | URL form | `body[data-page_name]` | `#wrapper` | itch sheet | Theme block | Your custom CSS served? |
|---|---|---|---|---|---|---|
| Creator profile | `https://<user>.itch.io/` (`http://` answers **301** to it) | `user` | `.user_page_wrap` | `user.css` | `style#user_theme` | **Yes**, profile editor → `style#custom_css` |
| Project | `https://<user>.itch.io/<project>` | `view_game` | `.game_page_wrapper` | `game.css` | `style#game_theme` | **Yes**, project editor → `style#custom_css` |
| Devlog index | `…/<project>/devlog` | `game.devlog` | same | `game.css` | same | **Yes**, byte-identical to the project's |
| Devlog post | `…/<project>/devlog/<id>/<slug>` | `game.devlog_post` | same | `game.css` | same | **Yes**, byte-identical |
| Comments | `…/<project>/comments` (pager: `?before=N`, `?after=0`) | `game.comments` | same | `game.css` | same | **Yes**, byte-identical |
| Purchase popup | `…/<project>/purchase` | `game_purchase` | none | `popup.css` | none | **No** |
| Project board | `…/<project>/community` | `game.community` | none | `main.css` | `style#jam_theme`, variables only | **No** |
| Forum topic | `https://itch.io/t/<id>/<slug>` | `community.topic_slug` | none | `main.css` | `style#jam_theme`, variables only | **No** |
| AMP devlog | `https://itch.io/devlog/<id>/<slug>.amp` (advertised by `link[rel=amphtml]` on the post) | — | none | itch's `style[amp-custom]` | none | **No** |
| Jam overview | `https://itch.io/jam/<slug>` | `view_jam` | `.jam_page_wrap` | `jam.css` | `style#jam_theme` | **Yes**, appended **inside** `jam_theme` |
| Jam subpages | `/jam/<slug>/entries`, `/results`, `/feed`, `/community`, `/topic/…`, `/rate/<id>` | `view_jam_entries`, `jam_results`, `view_jam_feed`, `jam.community`, `jam.community_topic`, `jam_rate_game` | none | `main.css` | 252-char `jam_theme`, variables only | **No**: neither the jam's CSS nor the entry project's CSS |
| `/jam/<slug>/results` on a jam with no voting | 302 → the overview | `view_jam` (after the redirect) | `.jam_page_wrap` | `jam.css` | full | Yes, because it *is* the overview |
| Legacy "raw" jam (e.g. 2014) | `https://itch.io/jam/<slug>` | `view_jam` | none | `main.css` + `jam.css` | none; the host's inline `<style>` sits in the content | n/a |
| Non-existent jam slug | HTTP **404** | `view_jam` | none | `main.css` | none | No |
| Non-existent project slug | `https://<user>.itch.io/<missing>`: HTTP **404** | `view_game` | none | `main.css` | none | No |
| Community profile | `https://itch.io/profile/<user>` | `community.profile` | none | `main.css` | none | **No** |
| Subdomain of an account with no creator page | `https://<user>.itch.io/` answers **302** → `itch.io/profile/<user>` | `community.profile` | none | `main.css` | none | No |
| Non-existent subdomain | HTTP **404** | `user` (the same value as a real profile) | none | `main.css` | none | No |
| Top-level blog post | `https://itch.io/blog/<id>/<slug>` | `blog_post` | none | — | none | No: default blog template |

Evidence:
- Project family: **[verified 2026-10-14 · docs-06, crawlproject-37, community-35, corpus-29, itchcss-10, docs-54, crawlproject-41]**; the project row's page name, wrapper, theme block and `style#custom_css` also in the owner's view of a draft project **[verified 2026-10-16 · live-dom]**
- Pages without project CSS: **[verified 2026-10-14 · crawlproject-42, docs-54, corpus-30]**; [observed · support-61]
- Jams: **[verified 2026-10-14 · docs-07, crawljam-01, crawljam-03, crawljam-35, crawljam-44, itchcss-11]**; [observed · docs-51]
- Profiles: **[verified 2026-10-14 · crawlprofile-20, crawlprofile-21, crawlprofile-52]**; the profile row's page name, wrapper, theme block and `style#custom_css` also on the live profile, owner and logged out **[verified 2026-10-16 · live-dom]**
- Blog: [documented · docs-08]
- `http://` 301, the 404 jam slug and the raw jam's stylesheets: **[verified 2026-10-14 · S03-N1, S03-N8]**
- 404 project slug: **[verified 2026-10-14 · gapfill03-09]**

**There are no custom domains.**
- itch staff said in 2018 that creator and project pages can't be served on your own domain, and suggested a plain 301/302 redirect to the `*.itch.io` page instead [documented · gapfill03-10] (staff forum replies).
- Nothing newer was found. All 844 captured page bodies carry `data-host="itch.io"` **[verified 2026-10-14 · gapfill03-10]**.
- Your CSS is therefore only ever served on `https://<user>.itch.io/…` and `https://itch.io/jam/…`. A redirecting domain lands on the same DOM.

Consequences:
- **One project stylesheet styles four page types:** the main page, the devlog index, devlog posts and `/comments`. Rules aimed at the main page leak into the other three, so test all four **[verified 2026-10-14 · crawlproject-37]**.
- **Never promise that custom CSS styles** checkout, forums, the jam entries grid, results, or the jam rating page. Voters often see an entry on `/jam/<slug>/rate/<id>`, which gets neither the jam's nor the game's custom CSS or theme **[verified 2026-10-14 · crawlproject-42, crawljam-03, crawljam-35]**.
- **Devlog text must read well unstyled.** The AMP mirror carries none of the project's CSS, so text hidden by CSS shows there **[verified 2026-10-14 · corpus-30]**.
- **Detect a real page by structure, not by page name.** In a harness, check the HTTP status and the presence of `#wrapper`. `data-page_name` alone lies: 404 profiles say `user`, 404 jams say `view_jam` and 404 projects say `view_game` **[verified 2026-10-14 · crawlprofile-52, S03-N8, gapfill03-09]**.

---

### 3. `<head>` order (cascade order)

| Page | Stylesheet order in `<head>` | Where your CSS sits |
|---|---|---|
| Profile | `link user.css` → scripts → `style#user_theme` → [`link` Google font, only if the theme font is a Google font] → [`style#custom_css`] | Its own element, the **last** element of `<head>` (9/9 pages with CSS). On the live logged-out profile, itch's scripts then added two `style[itchio-grid-sizer]` after it |
| Project, devlog index, devlog post, comments | `link game.css` → scripts → `style#game_theme` → [0–2 Google-font `link`s] → [`style#custom_css`] | Its own element, the **last** element of `<head>` (32/32 pages with CSS) |
| Jam overview | `link jam.css` → scripts → `style#jam_theme` = generated theme **+ host CSS appended** → [Google-font `link`, only if a theme font is chosen] | Inside `jam_theme`, directly after the last generated rule `.view_jam_page .jam_filter_picker .divider{…}` (exactly one occurrence) |
| Jam subpages | `link main.css` → `style#jam_theme` (252 chars) → scripts | Not served |
| Profile, **owner view** | `link user.css` → `link theme_editor.css` → `style#user_theme` → [font link] → [`style#custom_css`]. Live: two `static.itch.io` links → `style#user_theme` → `style#custom_css` (no font link), then two `style[itchio-grid-sizer]` after the scripts | Still last in the served HTML |
| Project, **owner view** | two `static.itch.io` `link`s → `style#game_theme` → `style#custom_css` (a Lato theme, so no font link), the same in the served HTML and after scripts; nothing is added after it | Still last |

Evidence: **[verified 2026-10-14 · S03-N1, S03-N2, crawljam-01, corpus-09, itchcss-06, itchcss-10, crawlproject-37]**. Owner view: profile **[verified 2026-10-14 · S03-N7]**, one export, and the live profile **[verified 2026-10-16 · live-dom]**; project **[verified 2026-10-16 · live-dom]**, one draft (neither run recorded which two itch sheets were linked). The logged-out live profile, with its single itch link and the two runtime sizers: **[verified 2026-10-16 · live-dom]**.

What the order means:
- **Profile and project.** Your CSS comes after itch's sheet and the theme, so it wins every specificity tie **[verified 2026-10-14 · S03-N2]**. itch's own `!important` declarations still beat a normal declaration: those in the project theme, and `user.css`'s `color:inherit !important` on collection headings (see the selector tables) **[verified 2026-10-14 · itchcss-16, itchcss-17]**.
- **Jam.** Host CSS also wins ties against the generated rules, because it is later in the same sheet. Generated `!important` colours on the entries grid still need `!important` **[verified 2026-10-14 · corpus-09, itchcss-15]**.
- **`@import` is dead in jam CSS.** It can never be first in its sheet. Use `@font-face` with direct font URLs, or the theme editor's font picker **[verified 2026-10-14 · corpus-10]**; [inferred · community-16].
- **Splitting a jam sheet.** The generated part is about 1.7–2.0 KB and ends with that divider rule. itch appends one trailing space after the host CSS. To extract the host CSS, split after the first divider match **[verified 2026-10-14 · corpus-09, crawljam-01]**.
- **Every page type ships** `<meta name="viewport" content="width=device-width, initial-scale=1">`, with no `maximum-scale` or `user-scalable` **[verified 2026-10-14 · a11y-35]**.
- **The document is `<html lang="en">` with `body.locale_en`** for logged-out visitors, whatever language the creator writes in [observed · a11y-52]. The owner's logged-in view of a draft project had the same, and so did the profile, owner and logged out **[verified 2026-10-16 · live-dom]**.

Size context (details in other sections). Each "largest seen" figure is one page, given in every metric so it can't be misquoted. It was re-measured from the raw served bytes on 2026-10-14 **[verified 2026-10-14 · gapfill03-01]**.

| Page type | Editor limit | Largest seen (served bytes · code points as served · CRLF→LF code points) | Samples |
|---|---|---|---|
| Profile | **5,120 UTF-8 bytes** after trimming both ends (the error message says "characters"); over it the save is refused **[verified 2026-10-16 · live-cap-A1, live-cap-A2c]** | 5,116 B · 5,116 · 5,116 (LF only, ASCII). Nothing above the cap. | 13 + 9 profiles with CSS (corpus, crawlprofile) |
| Project | **No CSS cap**: 659,742 single-line ASCII characters saved on a draft project; larger saves fail as a request ("missing token") **[verified 2026-10-16 · live-cap-B1, live-cap-B2]**. The 2026 claim that 5,120 applies [observed · community-08] doesn't hold. | **93,948 B · 93,898 · 93,105**: 793 CRLF, and 69,436 of the chars are `data:` URIs (69,362 PNG, 74 SVG). Runner-up: 38,576 B · 38,560 · 37,874, served intact and equal to its public source [verified · corpus-07]. | 26 + 39 project pages with CSS (corpus, crawlproject) |
| Jam | "20 KB" according to the admin [documented · community-07] | **20,410 chars of host CSS**: 20,411 B with the space itch appends, LF only, ASCII. Runner-up: 20,202 host chars (20,205 B with the space). | 23 + 11 jams with CSS (corpus, crawljam) |

- **Quote "93,105 chars, CRLF-normalised" or "93,948 B served".** Never quote 93,105 and 38,576 side by side as if they used the same unit. 38,576 is bytes on a different page.
- **Quote "20,410 host chars" for jams.** The corpus figure of 20,203 is a different, smaller jam and includes itch's trailing space.
- **The project giant is mostly embedded images,** and its save date is unknown, so it says nothing about what the project editor accepts today. Run 4 settled that separately: there is no CSS cap on projects **[verified 2026-10-16 · live-cap-B1]**.

#### Where the theme writes (which node carries what)

| Page | Theme variables live on | Background image painted on | `body` background | Evidence |
|---|---|---|---|---|
| Profile | `.user_page`, a **child** of `#wrapper`: `--itchio_font_family`, `--itchio_link_color`, `--itchio_gray_back`, `--itchio_border_radius`. `:root` holds `--itchio_ui_bg`. | `.user_page_wrap` (= `#wrapper`), as longhands | Set to the theme BG | [observed · docs-42]; **[verified 2026-10-14 · docs-58, repo-18, itchcss-37]** |
| Project, devlog | `.wrapper` (= `#wrapper`): 10 variables. `:root` holds `--itchio_ui_bg` and `--itchio_ui_bg_dark`. `.inner_column` gets literal text colour, font and the BG2 panel colour. | `#wrapper` | **Not set**: stays at `game.css`'s `#eee` | [observed · docs-23]; **[verified 2026-10-14 · itchcss-13, itchcss-35, itchcss-37]** |
| Jam overview | `.jam_page_wrap` (= `#wrapper`): the 9 documented variables, plus colour, font, size and background | `.jam_page_wrap` (= `#wrapper`) | Gets the jam BG **colour** only | **[verified 2026-10-14 · docs-29, itchcss-14, docs-27]** |

- **Never use the `background` shorthand on `#wrapper`.** It resets `background-image` and wipes the theme image. Use the `background-*` longhands **[verified 2026-10-14 · repo-18, localtests-18]**.
- **On profiles, override variables at `#wrapper .user_page{…}`.** A variable declared on `#wrapper` is shadowed by `.user_page`'s own declaration [observed · docs-42].
- **On projects, variables alone don't recolour links or buttons.** The theme hard-codes `.inner_column a{color}` and `.inner_column .button{…}`, so write explicit `#wrapper` rules **[verified 2026-10-14 · itchcss-13]**.
- **On jams, the variables do the job.** `#wrapper{--itchio_link_color:…}` recolours links and the Join button **[verified 2026-10-14 · itchcss-14]**.

---

### 4. Stability tiers

| Tier | What it covers | How to use it |
|---|---|---|
| **1 · Documented** in the official guide | **Project:** `#wrapper`, `#inner_column`, `.header` (+ its `h1`, `img`), `.columns`, `.left_col.column`, `.formatted_description`, `.right_col.column`, `.footer`, `.embed_wrapper`, `.game_frame`. **Jam:** `#wrapper`/`.jam_page_wrap`, `.view_jam_page`, `.jam_banner_outer`, `.jam_banner` (+ `.full_width`), `.jam_body`, `.jam_header_widget`, `.jam_submitter_widget`, `.jam_content.user_formatted`, `#entries`, and the 9 `--itchio_*` jam variables. **Profile:** nothing. Profiles are listed as CSS-capable, but no layout is documented. | Prefer these. They are the only ids and classes itch promises to keep. |
| **2 · De facto**: consistent on every sampled page that has the feature, and widely used by live CSS | **Profile:** `.user_page`, `#profile_header`, `.inner_column`, `.user_links`, `.user_profile`, `.game_grid_widget`, `.game_cell`, `.game_title`, `.collection_row`. **Project:** `#header`, `.view_game_page`, `#view_game_footer`, `.screenshot_list`, `.more_information_toggle`, `.buy_row`, `.game_comments_widget`. **Devlog:** `.game_devlog_post_page`, `.game_devlog_page`, `.post_body`. **Jam:** phase classes, `.stat_box`, `.jam_title_header`, `.header_tabs`. | Usable. Comment them as "undocumented, may break on itch updates". |
| **3 · Unstable** | Numbered ids; body class and attribute order; exact generated theme selectors and values; state added by JS at runtime (`.game_loaded` after a click, removal of `.hidden`, countdown values, `.time_block.hidden`); info-panel row labels | Never depend on them for layout |

Evidence:
- Tier 1: [documented · docs-20, docs-21, docs-26, docs-29]; **[verified 2026-10-14 · docs-41]**
- Tier 2: [observed · corpus-32, corpus-33, corpus-34, docs-22]
- Tier 3: **[verified 2026-10-14 · crawlproject-01, crawlproject-07, crawlproject-14, crawljam-21]**

Usage frequency in live custom CSS (pages using each token):

| Page type | Most-used tokens |
|---|---|
| Profiles (n=13) | `.user_page` 10, `.game_grid_widget` 9, `.game_cell` 9, `.user_links` 7, `.inner_column` 7, `.footer` 6, `.game_cell_data` 6 |
| Projects (n=26) | `#wrapper` 15, `.formatted_description` 15, `#inner_column` 13, `.inner_column` 12, `.game_frame` 10, then `.header`, `.left_col`, `.right_col`, `.game_comments_widget` and `.game_info_panel_widget` 8 each |
| Jams (n=23) | `.jam_body` 19, `.view_jam_page` 17, `.jam_header_widget` 17, `.jam_page_wrap` 16, `.stat_box` 13, `.jam_title_header` 13 |

[observed · corpus-32, corpus-33, corpus-34]

---

### 5. Profile page (`https://<user>.itch.io/`)

The guide documents **no** profile layout, selectors or variables. Everything below comes from live observation and is tier 2 or 3 **[verified 2026-10-14 · docs-41]**.

#### 5.1 Canonical tree (logged out)

```
body.user_layout_widget.layout_widget.responsive.no_theme_toggle.locale_en [data-page_name=user][data-host=itch.io]
├─ ul#user_tools.user_tools.hidden > li > a.action_btn            OUTSIDE #wrapper; fixed top-right
└─ div#wrapper.user_page_wrap                                      theme background image painted here
   ├─ div#user_N.user_page.page_widget.base_widget.(mode_grid|mode_column)
   │      [.has_banner] [.mode_collection_grid] [.mode_show_purchases]
   │  ├─ div#profile_header.header                                  always
   │  │  ├─ div.image_header > img.profile_banner                   src/width/height only with a banner; never alt
   │  │  └─ div.inner_column.text_header > h1                       display name; hidden when .has_banner
   │  ├─ div.inner_column.profile_content
   │  │  └─ [div.columns]                                           absent on 5/51 profiles (see 5.3)
   │  │     ├─ div.column.profile_column
   │  │     │  ├─ div#user_links_N.user_links.user_links_widget.base_widget   always; :empty without links
   │  │     │  │  └─ span.link_group > (svg.svgicon.icon_<site> | span.icon.icon-link) + a   (×n)
   │  │     │  └─ [div.user_profile.formatted]                       bio; absent when empty
   │  │     └─ div.column.game_column
   │  │        └─ div.game_grid_widget.base_widget.user_game_grid > div.game_cell …
   │  ├─ [section.purchased_games]                                  only with .mode_show_purchases
   │  │  └─ div.inner_column > h2 + div.carousel_wrapper > div.game_grid_widget.base_widget.game_list
   │  └─ [section.collections]                                      25/51 profiles
   │     └─ div.collection_row[data-collection_id] (×n) > div.inner_column
   │          > h2 > a, [p.collection_description],
   │            div.carousel_wrapper > div.game_list_widget.game_grid_widget.base_widget.game_list
   └─ div.footer > div.footer_inner > a + a                         sibling of .user_page; position:absolute
```

Evidence:
- Root structure, on 51/51 creator profiles: **[verified 2026-10-14 · crawlprofile-01, repo-23]**; the live profile served the same `body` classes, `div#user_N.user_page.page_widget.base_widget.mode_grid`, `div#profile_header.header` and `div.inner_column.text_header`, owner and logged out **[verified 2026-10-16 · live-dom]**
- Header and banner: **[verified 2026-10-14 · crawlprofile-04, repo-25]**
- Columns, links, bio and sections: **[verified 2026-10-14 · crawlprofile-06, crawlprofile-07, crawlprofile-08, crawlprofile-15]**; [observed · repo-62]; **[verified 2026-10-14 · S03-N1 (leafo), S03-N6]**

Facts the tree implies:
- **The footer is not inside `.user_page`.** Variables and colours set on `.user_page` don't reach it. The footer keeps the body defaults (Lato, `#222`, 12px); only its links take the theme link colour **[verified 2026-10-14 · repo-23, itchcss-22]**.
- **The footer is absolutely positioned.** `.user_page_wrap{display:flow-root;position:relative;padding-bottom:50px}` and `.footer{position:absolute;bottom:0;left:0;right:0}`. To make room above it, raise `#wrapper`'s `padding-bottom`, or set `#wrapper .footer{position:static}` **[verified 2026-10-14 · itchcss-21]**.
- **Collections and purchases sit outside the game column.** They are children of `.user_page`, after `.profile_content`, so selectors scoped to `.game_column` never reach them **[verified 2026-10-14 · crawlprofile-15]**; [observed · repo-62].
- **There is no `#inner_column` id.** `.inner_column` (`max-width:960px;margin:0 auto;padding:0 20px`) appears in the header, the content, purchases and every collection row, so one width rule changes all of them **[verified 2026-10-14 · crawlprofile-18, repo-30]**.
- **There are no `.button` elements inside `#wrapper`** on profiles (0/51), so project-style `.button` rules have nothing to hit **[verified 2026-10-14 · S03-N3]**.

#### 5.2 Game card (the same markup in the own grid, purchases and collections)

```
div.game_cell[.has_cover].lazy_images[.is_owner][data-game_id][dir=auto]
├─ div.game_thumb[style="background-color:#hex;"]      inline style on most thumbs (61/67 on one profile)
│  └─ a.thumb_link.game_link[tabindex=-1]
│     ├─ img.lazy_loaded[width=315][height=250][data-lazy_src]   no src until itch's JS runs
│     ├─ [div.gif_label + div.gif_overlay[data-gif]]             animated covers
│     └─ [div.no_cover_text > span.icon.icon-star2]              no cover (the cell then lacks .has_cover)
└─ div.game_cell_data
   ├─ div.game_title > a.title.game_link [+ price tag]   always; line-clamped to 2 lines by user.css
   ├─ [div.game_text[title]]
   ├─ [div.game_author > a]                               user.css hides it in .user_game_grid
   ├─ [div.game_genre]
   └─ [div.game_platform > span.web_flag | span.icon.icon-windows8|icon-apple|icon-tux|icon-android]
```

Price tags are children of `div.game_title`, after `a.title`. The variants in 114 priced cells were:
- `div.price_tag.meta_tag > div.price_value` (66);
- `a.price_tag.meta_tag.sale > div.price_value + div.sale_tag` (25);
- `a.price_tag.meta_tag > div.price_value + div.sale_tag`, **without** `.sale` (21);
- `a.price_tag.meta_tag.sale > div.sale_tag` (2).

Don't rely on `.sale` being present.

Evidence: **[verified 2026-10-14 · crawlprofile-10, crawlprofile-13, repo-34, a11y-18, S03-N9]**.

- **The thumbnail link is not keyboard-reachable** (`tabindex=-1`). Pair every card `:hover` effect with `:focus-within` **[verified 2026-10-14 · a11y-18]**.
- **Cover sizing.** `width`/`height` are HTML attributes, so `#wrapper .game_thumb img{width:100%;height:100%;object-fit:cover}` works without `!important`. Only the inline `background-color` needs `!important` **[verified 2026-10-14 · repo-34]**.

#### 5.3 Variations

| Condition | What changes in the DOM | Profiles (of 51) |
|---|---|---|
| Layout option | Exactly one of `.mode_grid` / `.mode_column` on `.user_page`. `user.css` has 0 `.mode_grid` rules (grid is the default) and 17 `.mode_column` rules. | 38 / 13 |
| Banner uploaded | `.has_banner`. `img.profile_banner` gets `src`, `width` and `height`, but never `alt`. `user.css` hides `.text_header`, so the name `h1` disappears. | 23 |
| Collections as grid | `.mode_collection_grid`. Collections render as grids that hide cells after the 20th. | 9 |
| "Supported by" shown | `.mode_show_purchases`. `section.purchased_games` is rendered only with this class (2 of the 4 pages that have it); without the class it was absent on 47/47. `user.css` also hides it unless the class is set. | 4 |
| No visible own projects | No `.columns`, `.profile_column` or `.game_column`. `.user_links` and `.user_profile` become direct children of `.profile_content`. | 5 |
| Empty bio | `div.user_profile` is not rendered | 15 |
| No links | `.user_links` is truly `:empty`, and `user.css` sets `display:none` on it | 5 |

Evidence: **[verified 2026-10-14 · crawlprofile-03, crawlprofile-04, crawlprofile-06, crawlprofile-07, crawlprofile-08, S03-N6]**; [documented · repo-31, repo-61]; [observed · a11y-05].

#### 5.4 Most useful profile selectors (all tier 2)

| Target | Selector | Notes |
|---|---|---|
| Page background | `#wrapper`, **longhands only** | Same node as `.user_page_wrap`, where the theme paints its image **[verified 2026-10-14 · repo-18]** |
| Theme variables | `#wrapper .user_page{--itchio_link_color:…}` | [observed · docs-42] |
| Layout-conditional rules | `#wrapper .user_page.mode_column …`, `#wrapper .user_page.has_banner …` | **[verified 2026-10-14 · crawlprofile-03]** |
| Banner | `#wrapper .profile_banner` | Present but `src`-less without a banner **[verified 2026-10-14 · crawlprofile-04]** |
| itch's name heading | `#wrapper .text_header > h1` | Hide it only if the bio supplies another `h1` **[verified 2026-10-14 · repo-25, a11y-04]** |
| Content width | `#wrapper .inner_column` | Write `#wrapper #inner_column, #wrapper .inner_column` to share one rule with project pages **[verified 2026-10-14 · repo-30]** |
| Links / socials | `#wrapper .user_links .link_group` | Style `.link_group`, so the icon and text form one pill **[verified 2026-10-14 · repo-35, crawlprofile-07]** |
| Bio | `#wrapper .user_profile` | Never `.formatted_description` (0 matches on profiles) or `.profile_column .user_profile` (the column can be missing) **[verified 2026-10-14 · repo-29, crawlprofile-06]** |
| Own games only | `#wrapper .user_game_grid` | **[verified 2026-10-14 · crawlprofile-15]** |
| Every game list | `#wrapper .game_grid_widget` | Also hits the purchases and collection carousels: a `display:grid` here turns them into grids **[verified 2026-10-14 · crawlprofile-15]** |
| Cards | `#wrapper .game_cell`, `.game_thumb`, `.game_cell_data`, `.game_title a.title`, `.game_text`, `.game_platform .web_flag` | **[verified 2026-10-14 · crawlprofile-10]** |
| Prices | `#wrapper .game_title .price_value`, `#wrapper .price_tag .sale_tag` | **[verified 2026-10-14 · crawlprofile-13]** |
| Collections | `#wrapper .collection_row`, `.collection_description`, `.carousel_wrapper` | `user.css` forces `color:inherit !important` on `.collection_row h2 a`. Colour the `h2`, or use `!important` **[verified 2026-10-14 · itchcss-17]** |
| Purchases | `#wrapper .purchased_games` | Don't force it visible **[documented · repo-61]** |
| Footer | `#wrapper .footer` (**never hide it**) | Sibling of `.user_page` **[verified 2026-10-14 · repo-23]** |

Profile-specific traps:
- **`.game_title` means different things per page.** On profiles it is the card title (median 12 per page). On projects it is the page's `h1` **[verified 2026-10-14 · S03-N3]**.
- **Bio sizes at 100% theme size:**
  - `.user_page` is 14px and the bio 16px, from `.user_page .user_profile.formatted{font-size:1.1428571429em}`.
  - Bio headings: `h1` 2em (32px), `h2` 1.5em (24px), `h3` 1.25em, `h4` 1.125em.
  - Bio `p`/`ul`/`ol` have `line-height:1.5`, and `p` has `margin:0 0 20px`.
  - Everything scales with the theme's font-size option.
  - Sources: **[verified 2026-10-14 · sanitizer-30, crawlprofile-08, itchcss-53]**
- **The bio is `.formatted`, not `.user_formatted`.** itch's `.user_formatted` rules for tables, figures, spoilers and embeds don't apply to it **[verified 2026-10-14 · sanitizer-30]**. On the live profile the bio container was `div.user_profile.formatted`, and a hand-written `.spoiler` in it stayed visible **[verified 2026-10-16 · live-html, live-k34]**.
- **Bannered profiles lose their name heading.** Add a `<h1 class="custom-…">` in the bio [observed · a11y-05].
- **The grid is `repeat(auto-fill,minmax(250px,1fr))` with a 25px × 10px gap, aligned `start`.**
  - Grid width ≥770px gives 3 columns, 510–769px gives 2, and less gives 1.
  - For equal card heights, add `#wrapper .game_grid_widget{align-items:stretch;grid-auto-rows:1fr}`.
  - **[verified 2026-10-14 · itchcss-23]**
- **Column layout (`.mode_column`):**
  - Above 800px, `.columns` is flex with sticky children and a 315px `.game_column`.
  - At ≤800px the columns stack and `.user_game_grid` becomes a horizontal flex scroller.
  - **[verified 2026-10-14 · itchcss-39, a11y-33]**
- **Owner vs visitor.** The owner's view adds things visitors don't get, even with the theme editor closed: a site header, the `.theme_editor_columns` wrappers and `body.has_header`. It also lacks the `#user_tools` strip that visitors do get. Always check logged out **[verified 2026-10-14 · S03-N7, crawlprofile-45, gapfill03-11; verified 2026-10-16 · live-dom]**.
- **The owner's view contains items visitors never receive.** In the one owner export, inside `#wrapper`, there were:
  - one own-grid `.game_cell` and two `.collection_row`s carrying inline `style="display: none"` (0 of 59 logged-out profile captures have any inline `display:none` inside `#wrapper`);
  - a `section.purchased_games` without `.mode_show_purchases`, which `user.css` hides.

  **[verified 2026-10-14 · gapfill03-11]** (one June 2026 export). The live profile showed the same pattern on 2026-10-16: the owner's view had 9 `.game_cell`s, two `.collection_row`s, a `section.purchased_games` and two elements inside `#wrapper` served with inline `display:none`, while the logged-out view had 5 cells and none of the rest **[verified 2026-10-16 · live-dom]**. Consequences [inferred · gapfill03-11]:
  - Never force `display` with `!important` on `.game_cell`, `.collection_row` or `.purchased_games`. That reveals hidden items in the owner's preview only, so the owner sees things visitors don't.
  - Never key layout on `:nth-child()` / `:nth-of-type()` of cards or collection rows. The hidden siblings shift the count in the owner's view, so the preview and the public page disagree. Prefer classes such as `.has_cover`, or the `:hover`/`:focus-within` state.

---

### 6. Project page (`https://<user>.itch.io/<project>`)

#### 6.1 Documented layout

The guide's layout, with its default widths [documented · docs-20, docs-21]:

```
#wrapper                       100%
└─ #inner_column               960px
   ├─ .header                  h1 = title (hidden when a banner exists), img = banner
   ├─ .embed_wrapper > .game_frame      HTML5 only, above .columns, sized as configured
   ├─ .columns
   │  ├─ .left_col.column      .formatted_description (553px) + downloads, buy, devlog, comments, community
   │  └─ .right_col.column     screenshots
   └─ .footer
```

All of these exist live in that nesting **[verified 2026-10-14 · docs-20, docs-21]**. The live markup adds undocumented layers between them [observed · docs-22].

#### 6.2 Canonical tree (logged out)

```
body.game_layout_widget.layout_widget.responsive.no_theme_toggle.locale_en [data-page_name=view_game]
     [.embedded_game: HTML5] [.has_site_header]
├─ [div.game_header_widget.header_widget] [div.goal_banner_widget] [div.jam_banner.above_game_banner]
├─ ul#user_tools.user_tools.hidden                              OUTSIDE #wrapper
└─ div#wrapper.main.wrapper.game_page_wrapper                    (exactly 1 child)
   └─ div#inner_column.inner_column.size_(…).family_(…)          (exactly 3 children)
      ├─ div#header.header[.has_image][.align_left|.align_center]
      │  ├─ [img[alt]]                                          only with a banner
      │  └─ h1.game_title                                       hidden with .has_image or on HTML5 pages
      ├─ div#view_game_N.view_game_page.page_widget.base_widget[.buy_on_top][.direct_download]
      │  │    HTML5 pages: div#view_html_game_N.view_html_game_page.view_game_page….ready
      │  ├─ [div#html_embed_N.html_embed_widget.base_widget.embed_wrapper > div.game_frame…]   HTML5 only
      │  ├─ [div.donate > a.button.donate_btn]                      HTML5 only
      │  ├─ [div.header_buy_row > p + [div.bundle_row] + (div.buy_row | div.direct_download_row)]  non-HTML5 only
      │  ├─ [div.video_embed.big_video]                             "big video" layout only
      │  └─ div.columns
      │     ├─ div.left_col.column                                  blocks in 6.5
      │     └─ div.right_col.column                                 always in the DOM
      │        ├─ div.video_embed                                   empty without a trailer; absent with big_video
      │        └─ div.screenshot_list > a[data-image_lightbox] > img.screenshot
      └─ div#view_game_footer.footer > a.icon_logo + a … + a.report_game_btn + a.embed_game_btn
                                       [+ div.update_timestamp] + div.breadcrumbs
```

Evidence: **[verified 2026-10-14 · crawlproject-01, crawlproject-02, crawlproject-07, crawlproject-08, crawlproject-09, crawlproject-11, S03-N1]**; [observed · docs-22]. The owner's view of a draft project had the same `body` classes plus `.has_site_header`, page name `view_game`, `div#wrapper.main.wrapper.game_page_wrapper` and `div#inner_column.inner_column` **[verified 2026-10-16 · live-dom]**; its `#wrapper` parents are in §1.

- **The wrapper chain is fixed.** On 48/48 project pages (and 2 jam entries), `#wrapper` has exactly one child and `#inner_column` has exactly three: `#header`, the page widget and `#view_game_footer`. Unlike on profiles, **the footer is inside `#inner_column`** **[verified 2026-10-14 · crawlproject-01]**.
- **`#inner_column` classes vary:** `size_small|medium|large|very_large` (the theme's font size) and `family_<font>`, e.g. `family_sans-serif`, `family_manrope` [observed · docs-22]; **[verified 2026-10-14 · S03-N1]**. The owner's draft project had `size_large family_lato` **[verified 2026-10-16 · live-dom]**.
- **`#inner_column` clips.** It has `width:960px;margin:0 auto;position:relative;padding-bottom:40px;overflow:hidden` (`max-width:960px;width:auto` under `.responsive`). Shadows, transforms and tooltips that leave it are clipped. The footer is absolutely positioned in that 40px above 1000px and static below **[verified 2026-10-14 · itchcss-35]**.
- **After itch's scripts, `#inner_column` carries an inline `min-height`.** In the owner's view of a draft project it was `min-height: 618px` in a 708 px tall window **[verified 2026-10-16 · live-dom]**. The 90 px difference fits a 50 px header bar plus the column's 40 px bottom padding, so it is most likely the same `max_height` helper that sizes profile `#wrapper` (04 §9.1); whether logged-out visitors get it too, and with what offset, was not checked [inferred · live-dom]. Like any inline style it beats `#wrapper #inner_column{min-height:…}` unless you add `!important` [inferred].

#### 6.3 Header variants

| Case | `#header` classes | Children | Title `h1` exposed? |
|---|---|---|---|
| Banner uploaded (37/48) | `.has_image` + `.align_center` (33) or `.align_left` (4) | `img` (alt = title by default; creator-written on 2/37), then `h1.game_title` | No: `.header.has_image h1{display:none}`, plus `.header.has_image{font-size:0}` |
| No banner, downloadable (11/48 have no extra class) | `.header` | `h1.game_title` | Yes |
| No banner, HTML5 | `.header` | `h1.game_title` | No: `.embedded_game:not(.embed_disabled) .header .game_title{display:none}`. Nothing exposed names the game (7 of 39 hidden-title pages). |

Evidence: **[verified 2026-10-14 · crawlproject-09, itchcss-45, a11y-06]**.

- **There is a third alignment class.** `.align_right` occurred once, on a bannered devlog post, next to `.align_center` and `.align_left`. Write banner rules for all three, or for `.has_image` alone [observed · gapfill03-05].
- **`.header` clips:** `.header{overflow:hidden}` **[verified 2026-10-14 · crawlproject-09]**.
- **Never hide `#wrapper #header img` without restoring a heading.** On bannered pages it is the only element carrying the title **[verified 2026-10-14 · a11y-06]**.

#### 6.4 Top of the page widget (children before `.columns`, 48 pages)

| Sequence | Pages | Kind of project |
|---|---|---|
| `.header_buy_row` → `.columns` | 29 | downloadable, physical or asset |
| `.header_buy_row` → `.video_embed.big_video` → `.columns` | 1 | "big video" layout |
| `.embed_wrapper` → `.donate` → `.columns` | 13 | HTML5 |
| `.embed_wrapper` → `.columns` | 5 | HTML5 |

Evidence: **[verified 2026-10-14 · crawlproject-11, crawlproject-02]**.

- **`.header_buy_row` is hidden by default.** `game.css` shows it only on `.view_game_page.buy_on_top` or at ≤1000px **[verified 2026-10-14 · crawlproject-11]**.
- **On downloadable `.direct_download` pages** (17/17 distinct pages), it holds `p + div.direct_download_row > button.button.direct_download_btn[type=button]`. Such a page has **no `.buy_row`** at all (0/17); each file also gets an `a.button.download_btn` in `.uploads` **[verified 2026-10-14 · crawlproject-65, gapfill03-07]**.
  - A render with the live `game.css` showed `.header_buy_row{display:none}` at viewport 1001px and wider, and `block` at 1000px. So the "Download Now" button at the top is mobile-only by default.
  - To show it on desktop, use `#wrapper .view_game_page.direct_download .header_buy_row{display:block}`. Tested: it renders at 1264px.
  - **[verified 2026-10-14 · gapfill03-08]** (headless Chrome 155, itch CSS only)
- **HTML5 pages can also be `.direct_download`** (5 pages: `view_html_game_page.direct_download`). They have **no `.header_buy_row`** at all, only per-file `a.button.download_btn`, so the rule above matches nothing there **[verified 2026-10-14 · gapfill03-07]**.
- **On `.buy_on_top` pages, `.buy_row` and `.bundle_row` appear twice**, in `.header_buy_row` and in `.left_col`. Style both with `#wrapper .buy_row .buy_btn` **[verified 2026-10-14 · crawlproject-12]**.
- **HTML5 pages get `div.donate` instead**, shown only on `.view_html_game_page.ready` **[verified 2026-10-14 · crawlproject-11]**.

#### 6.5 `.left_col` blocks

Select blocks by class, **never by position**. The usual order is as listed, but `.rewards` moved on 2 of 48 pages. Missing blocks are simply absent **[verified 2026-10-14 · crawlproject-03, crawlproject-56]**.

| Block (usual order) | Markup | Present |
|---|---|---|
| Description | `div.formatted_description.user_formatted` **[verified 2026-10-16 · live-html]** | 47/48; first child when present |
| More information | `div.more_information_toggle > div.toggle_row > a.toggle_info_btn(svg.icon_down_tick)` + `div.info_panel_wrapper > div.game_info_panel_widget > table > tbody > tr > td + td`. The wrapper is `display:none` until JS opens it. | 48/48 |
| Download / purchase heading | `h2#download` or `h2#purchase` | optional |
| Bundle | `div.bundle_row > div.bundle_info(.bundle_label, .bundle_title > a) + a.button` | optional |
| Buy | `div.buy_row > div.button_message > a.button.buy_btn + span.buy_message`. The message always ends with `span.sub`. Paid pages add `span.dollars`; sales add `a.sale_link` and `span.dollars.original_price`. | absent on 13/64 pages, e.g. direct-download |
| Files | `div.uploads > (p \| h2#download) + div.upload_list_widget > div.upload > [a.button.download_btn] + div.info_column > div.upload_name(strong.name, span.file_size, span.download_platforms > span.icon.icon-<os>) [+ .build_row]` | optional; per-file buttons only on `.direct_download` pages |
| Demo files | `h2#demo + div.uploads.for_demo.has_buttons` | optional; always with buttons |
| Rewards | `div.rewards > h2#rewards + p.reward_summary + div.rewards_list > div.reward_row[data-reward_id][data-reward_price]` | optional; position varies |
| Install instructions | `div.download_instructions > h2#instructions + div.formatted_description.user_formatted` | optional: **a second `.formatted_description`** |
| App stores | `h2 + div.app_store_links > a.store_btn(.google_play_btn \| .app_store_btn) > img` | optional |
| Devlog list | `section#devlog.game_devlog > h2 + ul > li` | optional |
| Comments **or** board **or** neither | `div.game_comments_widget > h2#comments + p.form_placeholder + div.community_topic_posts_widget > div.community_post_list_widget > div.community_post …` **/** `section.community_summary > div.game_community_preview_widget` **/** nothing (comments off) | 30 / 10 / 8 of 48, never both |

Evidence: **[verified 2026-10-14 · crawlproject-03, crawlproject-12, crawlproject-13, crawlproject-14, crawlproject-15, crawlproject-56, crawlproject-66]**.

A comment post is `div.community_post[.has_vote_column] > div.post_grid > [div.post_votes(a.vote_up_btn, a.vote_down_btn)] + a.avatar_container + div.post_header + div.post_content > div.post_body.user_formatted + div.post_footer`. Replies sit in `.community_post_replies`, and the lists carry `#first-post`/`#last-post` anchors **[verified 2026-10-14 · crawlproject-15, crawlproject-68]**.

Consequences:
- **`#wrapper .formatted_description` also styles the install instructions.** To target only the description, use `#wrapper .left_col > .formatted_description` [inferred · crawlproject-56, crawlproject-03].
- **`.user_formatted` is everywhere.** It covers the description, install instructions, reward texts and every comment body (median ≈45 per project page), which makes `#wrapper .user_formatted` very broad **[verified 2026-10-14 · S03-N3]**.
- **`.post_header` / `.post_body` are not devlog-only.** One project page had 47 `div.post_header` and 46 `div.post_body.user_formatted`, all from comments **[verified 2026-10-14 · S03-N5]**.
- **Site-generated section titles sit outside `.formatted_description`.** Purchase, Download, demo, "Development log" and comments are `h2`s directly under `.left_col`. To theme all section titles alike, target `#wrapper .left_col h2` [documented · docs-25].
- **`#wrapper .upload .download_btn` styles nothing on most pages.** The primary action there is `.buy_row .buy_btn` ("Download Now" / "Buy Now"). Style `#wrapper .buy_row .buy_btn, #wrapper .upload .download_btn, #wrapper .direct_download_btn` together **[verified 2026-10-14 · crawlproject-66]**.
- **Theme `!important` you must match.** The project theme marks these `!important`:
  - `.view_game_page .reward_row/.bundle_row{border-color}`;
  - `.footer .svgicon, .more_information_toggle .svgicon{fill}`;
  - the comment-editor toolbar hover/active colours.

  **[verified 2026-10-14 · itchcss-16]**

#### 6.6 HTML5 embed modes (server-rendered, before any click)

| Mode | `.game_frame` classes | Children | Pages (of 18 HTML5) |
|---|---|---|---|
| Auto-load | `game_frame game_loaded` | `iframe#game_drop` | 9 |
| Click to launch | `game_frame game_pending` | `div.iframe_placeholder[data-iframe] > button.button.load_iframe_btn` | 6 |
| Launch fullscreen | `game_frame game_pending start_maximized` | `div.restore_wrapper > button.restore_btn.button` + the placeholder | 3 |
| Any mode + fullscreen button | adds `button.fullscreen_btn > img` as the first child (hidden while `.game_pending`) | | |

Evidence: **[verified 2026-10-14 · crawlproject-16, docs-21, S03-N1 (game-28: fullscreen start)]**; [documented · community-50].

- **The game runs in a cross-origin iframe.** It loads from `https://html-classic.itch.zone/html/<id>/index.html`, so page CSS styles the frame box, never the game.
  - The iframe has `allowtransparency`; a transparent game shows the `.game_frame` background.
  - It has no `sandbox` attribute.
  - **[verified 2026-10-14 · crawlproject-18, community-33]**
- **On click, `game.min.js` swaps the placeholder for the stored iframe.** It also swaps `.game_pending` → `.game_loaded`. Only `.embed_wrapper` and `.game_frame` are documented, so the state classes are at your own risk [documented · community-50].
- **The frame carries inline `width`/`height`.** Mobile-friendly games launch fullscreen on phones, so `.game_frame` sizing mostly matters on desktop **[verified 2026-10-14 · docs-21]**.
- **Old community tips:**
  - `.game_frame:fullscreen{margin:0!important}` (2016), against a gap above fullscreen games. Possibly stale; scope it as `#wrapper .game_frame:fullscreen` [community · community-34].
  - Hiding `.right_col` (screenshots) on phones. Wrap it in a media query, scope it under `#wrapper` and prefer `display:none` [community · community-32].

#### 6.7 Most useful project selectors

| Target | Selector | Tier |
|---|---|---|
| Page background | `#wrapper` (longhands). The `body` stays `#eee`, so add `#wrapper{min-height:100vh}` on short pages **[verified 2026-10-14 · itchcss-37]** | 1 |
| Content column | `#wrapper #inner_column`: 960px with `overflow:hidden`; max 600px at ≤1000px **[verified 2026-10-14 · itchcss-35, itchcss-38]** | 1 |
| Title / banner | `#wrapper #header`, `#wrapper #header img` (also matches the linked banner on devlogs), `#wrapper .header h1` | 1 (`.header`) |
| Description only | `#wrapper .left_col > .formatted_description` | 1 |
| Columns | `#wrapper .columns`, `#wrapper .left_col`, `#wrapper .right_col` | 1 |
| Screenshots / trailer | `#wrapper .screenshot_list img`, not attribute selectors (`srcset`/`data-screenshot_id` are sometimes missing); `#wrapper .video_embed`, not `.right_col .video_embed`, which `big_video` moves **[verified 2026-10-14 · crawlproject-02]** | 2 |
| Buy / bundle | `#wrapper .buy_row .buy_btn`, `#wrapper .bundle_row` (both copies) | 2 |
| Downloads | `#wrapper .upload_list_widget .upload`, `#wrapper .download_btn`, `#wrapper .direct_download_btn` | 2 |
| Info panel | `#wrapper .more_information_toggle`, `#wrapper .game_info_panel_widget` | 2 |
| Comments | `#wrapper .game_comments_widget`, `.community_post`, `.post_body` (15 theme groups restyle `.game_comments_widget`; the `#wrapper` prefix beats them) | 2 |
| Game frame | `#wrapper .embed_wrapper`, `#wrapper .game_frame`, `#wrapper .load_iframe_btn` | 1 / 1 / 2 |
| Links and buttons | `#wrapper .inner_column a{color}`, `#wrapper .button{background-color;color}`, not the variables alone **[verified 2026-10-14 · itchcss-13]** | 1 / 2 |
| Footer | `#wrapper #view_game_footer` (**never hide it**) | 1 (`.footer`) |
| Page-type scope | `#wrapper .view_game_page` (main page), `#wrapper .view_html_game_page` (HTML5) | 2 |

#### 6.8 Classifications share one skeleton (book, comic, physical, asset, tool)

The project's classification is visible only in the footer breadcrumbs (`#view_game_footer .breadcrumbs > a[href="https://itch.io/<kind>"]`). It never appears as a class on `#wrapper`, `#inner_column` or the page widget. 169 distinct project main pages were captured on 2026-10-14 **[verified 2026-10-14 · gapfill03-06]**:

| Kind | Pages | What sets the layout |
|---|---:|---|
| games | 126 | all sequences of §6.4 |
| tools | 16 | downloadable or HTML5 |
| game-assets | 9 | downloadable `buy_on_top` (8), HTML5 (1) |
| physical-games | 7 | downloadable `buy_on_top` (7) |
| comics | 4 | HTML5 web comics (3, one of them `direct_download` + fullscreen start), downloadable (1) |
| books | 3 | downloadable: `direct_download` (2), `buy_on_top` (1) |
| misc | 4 | HTML5 (3), `direct_download` (1) |

- **All 169** have `#inner_column` = `#header` + page widget + `#view_game_footer`.
- The top of the widget depends only on three things: the HTML5 embed, `.buy_on_top` and `.direct_download`.
- **Write one project stylesheet for all classifications.** A web comic needs the same `.embed_wrapper` / `.game_frame` rules as a web game. A PDF book or zine needs the same `.buy_row` / `.direct_download_btn` rules as a downloadable game.
- **No CSS hook exists for "this is a book".** If you need one, put a `custom-` class on an element in your own description and scope with `:has()`, e.g. `#wrapper .view_game_page:has(.custom-book) .buy_row{…}` [inferred · gapfill03-06].
- **The "big video" layout** (§6.4) is still seen on **one** project only. Treat its tree as provisional [observed · crawlproject-02, gapfill03-06].

---

### 7. Devlog index, devlog posts, comments page

These three pages get the project's own `game_theme` and `custom_css`, byte for byte. They keep `#wrapper.game_page_wrapper > #inner_column` and `#view_game_footer.footer`, but have **no `.columns`, `.left_col`, `.right_col` or `.formatted_description`** **[verified 2026-10-14 · docs-06, crawlproject-37, community-35, corpus-29, itchcss-10, itchcss-47, S03-N3]**.

```
devlog post   [data-page_name=game.devlog_post]   …/<project>/devlog/<id>/<slug>
#inner_column
├─ [div#header.header.has_image.align_* > a(→ project) > img[alt] + h1.game_title (hidden)]
│                                              ONLY when the project has a banner
├─ div#game_devlog_post_N.game_devlog_post_page.page_widget.base_widget
│  ├─ div.split_columns                                       flex; block at ≤1000px
│  │  ├─ div.primary_column                                    flex:1; margin 0 20px
│  │  │  ├─ section.post_header > h1 (post title) + div.breadcrumbs + div.post_meta + hr
│  │  │  ├─ section#object_text_widget_N.object_text_widget_widget.base_widget.user_formatted.post_body
│  │  │  ├─ [section.post_files > h2 + div.upload_list_widget]
│  │  │  └─ [section.game_download > h2 + div.game_downloader_widget > a.button.buy_btn + span.buy_message]
│  │  └─ div.game_metadata                                     307px sidebar, margin-left 40px
│  │     > section…, section.add_collection_row, section > div.game_info_panel_widget, [section.more_posts]
│  └─ div.game_comments_widget …
└─ div#view_game_footer.footer

devlog index  [data-page_name=game.devlog]   …/<project>/devlog
#inner_column
├─ div#header.header…            with banner: > a > img + h1.game_title · without: > h1.game_title
├─ div#game_devlog_N.game_devlog_page.page_widget.base_widget
│  └─ p.breadcrumbs + div.devlog > h2 + ul.blog_post_list_widget > li
│       > (div > a.title) + div.split_content > (div.post_preview > div.meta_row(span, .post_likes[, span.tags])
│                                                + a.summary_link > div.summary) [+ img.post_image]
└─ div#view_game_footer.footer

comments page [data-page_name=game.comments]   …/<project>/comments
#inner_column
├─ div#header.header…            with banner: > a > img + h1.game_title · without: > h1.game_title (no link)
├─ div#game_comments_N.game_comments_page.page_widget.base_widget > p.breadcrumbs + div.game_comments_widget …
└─ div#view_game_footer.footer
```

Evidence: **[verified 2026-10-14 · crawlproject-39, crawlproject-40, crawlproject-41, itchcss-47, S03-N1, S03-N4, gapfill03-03, gapfill03-04]**; [observed · a11y-07].

#### 7.1 `#header` presence depends on page type and banner

| Page | Project has a banner | Project has no banner |
|---|---|---|
| Main project page | `#header.has_image` > `img` + hidden `h1.game_title` | `#header` > `h1.game_title` (hidden on HTML5 pages by `body.embedded_game`) |
| Devlog index | `#header.has_image` > `a` > `img`, + `h1.game_title` | `#header` > `h1.game_title`: no link, **visible** (5/5) |
| Devlog post | `#header.has_image` > `a` > `img`, + hidden `h1.game_title` | **No `#header` and no `.game_title` at all** (7/7). `#inner_column` holds only the post widget and the footer. |
| Comments page | `#header` > `a` > `img`, + `h1.game_title` | `#header` > `h1.game_title`: no link, **visible** (5/5) |

Evidence: **[verified 2026-10-14 · crawlproject-09, crawlproject-41, S03-N1, S03-N4, gapfill03-03, gapfill03-04]**; [observed · a11y-07].

- Bannerless samples: 5 projects for comments, 5 for indexes and 7 for posts, each checked against the project's bannerless main page. Across all 45 same-day post captures (files), the 32 with a `#header` all had `.has_image`, and 13 had no `#header` at all.
- `body.embedded_game` sits only on the HTML5 **main** page (0 of the 7 sub-pages of 4 HTML5 projects). An HTML5 project without a banner therefore shows its title `h1` on `/devlog` and `/comments`, though itch hides it on the main page **[verified 2026-10-14 · gapfill03-03]**.

#### 7.2 Rules for devlog-safe project CSS

- **Don't rely on `#header` for spacing or a "back to project" visual.** It does not exist on posts of bannerless projects (7/7). On those pages the way back is `.breadcrumbs > a`, and `#wrapper .game_title` matches nothing **[verified 2026-10-14 · gapfill03-04]**.
- **Don't hide `#wrapper .header` wholesale.** On bannered projects, the banner link is the way back to the project from every devlog [observed · a11y-07].
- **If you hide or restyle `h1.game_title` on the main page, repeat it for `/devlog` and `/comments`.** There it is visible even on HTML5 projects (§7.1). For example, `#wrapper .game_devlog_page .header h1, #wrapper .game_comments_page .header h1{…}` **[verified 2026-10-14 · gapfill03-03]**.
- **Scope page-only rules:**
  - devlog posts: `#wrapper .game_devlog_post_page …`;
  - devlog index: `#wrapper .game_devlog_page …`;
  - comments page: `#wrapper .game_comments_page …`;
  - main page only: `#wrapper .view_game_page …`.
  - **[verified 2026-10-14 · community-35, crawlproject-37, S03-N3]**
- **Main-page rules leak into posts.** Posts reuse several main-page classes, so rules on them match posts too **[verified 2026-10-14 · S03-N3, crawlproject-39]**:
  - `.game_info_panel_widget`, in the sidebar (6/6 posts);
  - `.upload_list_widget` (4/6);
  - `.game_comments_widget` (6/6);
  - `a.button.buy_btn`, inside `section.game_download`.
- **Post text is `.post_body`, not `.formatted_description`.** To target the post title, use `#wrapper .game_devlog_post_page section.post_header h1`; plain `.post_header` also matches every comment header **[verified 2026-10-14 · crawlproject-39, S03-N5]**.
- **Devlog posts usually have more than one `h1`:**
  - the visible post title;
  - the hidden project `h1` when there is a banner;
  - itch's logo `h1.title` when the site header is shown;
  - any `h1` the author wrote in the post.

  Keep your own description headings at `h2` and below [observed · a11y-07, a11y-55]; **[verified 2026-10-14 · itchcss-45]**.

---

### 8. Jam pages (`https://itch.io/jam/<slug>`)

#### 8.1 Documented layout

[documented · docs-26]; all of it is live in this nesting **[verified 2026-10-14 · docs-26, crawljam-19]**:

```
#wrapper = .jam_page_wrap      background colour/image, text colour, font, size, theme variables
└─ .view_jam_page              100%
   ├─ .jam_banner_outer > img.jam_banner[.full_width]
   ├─ .jam_body                max-width 960px; bg_color2 panel
   │  ├─ .jam_header_widget
   │  ├─ .jam_submitter_widget
   │  └─ .jam_content.user_formatted
   └─ #entries                 full-width grid, only on jams that show entries on the overview
```

#### 8.2 Canonical overview tree (logged out)

```
body.jam_layout_widget.layout_widget.responsive.no_theme_toggle.locale_en [data-page_name=view_jam]
├─ div#jam_layout_header_N.jam_layout_header_widget.header_widget.base_widget.small_logo.gray     OUTSIDE #wrapper
│     > a.skip_to_main(→ #maincontent, no such id), .primary_header (logo h1.title, …)
└─ div#wrapper.jam_page_wrap                                      display:flow-root; min-height:calc(100vh - 50px)
   └─ div#view_jam_N.view_jam_page.view_jam_base_page.page_widget.base_widget.view_jam_default
         .(before_start|during_submit|during_voting|after_voting) [.is_over] [.has_banner]
      ├─ div.jam_banner_outer > img.jam_banner[.full_width]       img always present; no src without a banner
      ├─ div.jam_body                                             max-width 960px; margin 40px auto; overflow:hidden
      │  ├─ div#jam_header_N.jam_header_widget.base_widget > div.header_inner
      │  │  ├─ div.header_columns
      │  │  │  ├─ div.title_colum (sic) > h1.jam_title_header > a ; div.jam_host_header > a…
      │  │  │  └─ div.stats_container > div.stat_box > [a >] div.stat_value + div.stat_label
      │  │  └─ div.header_tabs > a.header_tab[.active]…, [div.tab_group > a.header_tab + span.community_activity]
      │  ├─ div.submitter_outer > div#jam_submitter_N.jam_submitter_widget.base_widget.<phase>[.is_over]
      │  │  ├─ div.date_data > span.date_format ×2                 running phases; after voting: a <p> with dates
      │  │  ├─ [div.countdown > span.countdown_label + div.times > div.time_block[data-name=years…seconds] ×6
      │  │  │                        > div.block_value (EMPTY in server HTML) + div.block_label]
      │  │  └─ div.state_action > button.button.fat.submitter_button.join_jam_btn   (text only during voting)
      │  └─ div.jam_content.user_formatted                          the host's description
      └─ [div#entries.grid_outer]                                  sibling AFTER .jam_body; 6/22 jams
         ├─ div.header_row > h2 > span.game_count
         ├─ div.jam_filter_picker > div.filter_item[.active] / span.divider
         ├─ div.jam_filter_empty
         ├─ div.game_grid_widget.base_widget.browse_game_grid > div.game_cell > div.game_thumb + div.game_cell_data
         └─ div.itch_footer > span.powerd_by (sic) …                 itch's attribution inside #wrapper
```

Evidence: **[verified 2026-10-14 · crawljam-15, crawljam-19, crawljam-21, crawljam-23, crawljam-25, crawljam-26, docs-27, docs-53, S03-N1 (gmtk-2025)]**; [observed · a11y-08].

What the overview does **not** have:
- **No `.footer` and no `#user_tools`.** The only itch branding inside `#wrapper` is `.itch_footer` in `#entries`. Don't hide it **[verified 2026-10-14 · docs-53]**.
- **No `.inner_column`, `#inner_column`, `.header` or `.formatted_description` inside `#wrapper`** (0/22 overviews) **[verified 2026-10-14 · S03-N3]**.
- **`.jam_page_wrap .header` matches nothing.** The site header moved out, before `#wrapper`, on 2026-06-01 **[verified 2026-10-14 · docs-27, community-29]**.
- **Two `h1`s by design:** the logo `h1.title` outside `#wrapper` and `h1.jam_title_header`. Don't add a third from the description [observed · a11y-08]. Host descriptions often contain `h1`s anyway (30 across 16 jams) **[verified 2026-10-14 · crawljam-19]**.

#### 8.3 Variations

| Hook | Values | Seen | Notes |
|---|---|---|---|
| Phase, on `.view_jam_page` and on `.jam_submitter_widget` | `.before_start`, `.during_submit`, `.during_voting`, `.after_voting.is_over` | 7 / 4 / 3 / 8 of 22 (one fetch); 7 / 1 / 3 / 6 of 17 (a later fetch) | Phases change over time. `jam.css` already hides some text per phase. Example: `#wrapper .view_jam_page.during_voting .jam_submitter_widget{…}` |
| Banner | `.has_banner` on `.view_jam_page`; `.full_width` on `img.jam_banner` | `.has_banner` on 14/17, `.full_width` on 2 of those 14 | The banner displays only with `.has_banner`. Without `.full_width` it is at most 960px wide on ≥960px viewports. Gate banner decorations on `.has_banner`. |
| Entries grid | `#entries.grid_outer` | 6/22 | `margin-top:40px` (0 at ≤650px). During voting its cards link to the game pages, not to `/rate/`. |
| Countdown | `.time_block[data-name=…]` | before the jam ends | JS fills `.block_value` and adds `.hidden` to unused units. Without JS, all 6 blocks show empty. |

Evidence: **[verified 2026-10-14 · crawljam-20, crawljam-21, crawljam-23, crawljam-25]**.

#### 8.4 Where the host's CSS lives

- **There is no `style#custom_css` on jam pages.** The host CSS is appended verbatim inside `style#jam_theme`, right after `.view_jam_page .jam_filter_picker .divider{…}`, sometimes with no separator **[verified 2026-10-14 · crawljam-01, corpus-09, S03-N1]**; [observed · itchcss-06, sanitizer-34].
- **Old jam CSS and tutorials predate `#wrapper` on jams.**
  - Before 2026-06-01 jams had no `#wrapper`.
  - The migration deleted `#wrapper` rules from existing jam CSS, and moved background, colour and font from `body` to `.jam_page_wrap`.
  - The jam stylesheets sampled still use unscoped selectors (`p`, `body`, `:root`) and no `#wrapper` (0 of 11 jams).
  - Write new jam CSS under `#wrapper`.
  - [documented · docs-30, crawljam-17]; **[verified 2026-10-14 · community-29]**; [observed · sanitizer-34]
- **Game-page CSS mostly doesn't transfer.** `#inner_column`, `.columns` and `.formatted_description` don't exist on jams; only rules on `#wrapper` itself carry over [documented · docs-30].

#### 8.5 Jam subpages (no host CSS)

`/entries`, `/results`, `/feed`, `/community`, `/topic/…` and `/rate/<id>` share a different skeleton:

```
body.wide_layout_widget.layout_widget.responsive.locale_en [data-page_name=view_jam_entries|jam_results|…]
├─ div#header_N.header_widget.base_widget                       standard site header
├─ div#<page>_N.<page>_page[.jam_page_base_page].page_widget.base_widget
│    └─ div.jam_header_widget … (+ .cover_column > a.cover_image > img)
└─ div.footer                                                    body-level
```

- **The page containers:**
  - `view_jam_entries_page.jam_page_base_page.browse_column_base_page`
  - `view_jam_results_page.jam_page_base_page`
  - `view_jam_feed_page.jam_page_base_page.events_page`
  - `jam_rate_game_page.jam_page_base_page`
  - `jam_community_page.community_category_page.community_page_page`
  - `jam_community_topic_page.community_topic_page.community_page_page`
  - Community and topic pages lack `.jam_page_base_page`.
- **Only a 252-char `jam_theme` styles them:** `:root{--itchio_ui_bg}` plus 6 link/button variables on `.page_widget`. There is no `#wrapper` and no `.view_jam_page`.
- **The rate page** is `.jam_rate_game_page > .jam_header_widget, .jam_game_header, .entry_columns.responsive_column > .jam_columns > .data_column + .main_column`.

Evidence: **[verified 2026-10-14 · crawljam-40, crawljam-03, crawljam-35, docs-07, itchcss-11, S03-N1]**.

#### 8.6 Legacy and owner variants

- **Raw jams.** Some old jams, such as one from 2014, render as `div#view_raw_jam_N.view_raw_jam_page.view_jam_base_page`:
  - no `#wrapper`, no `.jam_page_wrap` and no generated `jam_theme`;
  - the site header and a body-level `.footer`;
  - the host's styling in an inline `<style>` inside the content.

  They report `data-page_name=view_jam`, like modern overviews. Before writing jam CSS, check for `div#wrapper.jam_page_wrap > .view_jam_page`, not for the page name [observed · docs-51]; **[verified 2026-10-14 · S03-N8]**.
- **Owner view.** `.jam_page_wrap` sits inside `.theme_editor_columns > .theme_editor_primary_column`. It could not be observed without an account [documented · docs-28, crawljam-18].

#### 8.7 Most useful jam selectors

| Target | Selector | Tier |
|---|---|---|
| Page background, theme variables | `#wrapper` (= `.jam_page_wrap`): longhands for the background; `#wrapper{--itchio_link_color:…;--itchio_button_color:…}` recolours links and buttons **[verified 2026-10-14 · itchcss-14, docs-29]** | 1 |
| Banner | `#wrapper .jam_banner_outer`, `#wrapper .view_jam_page.has_banner .jam_banner` | 1 |
| Main panel | `#wrapper .jam_body`: its `overflow:hidden` clips glows and transforms; override with `overflow:visible` and test **[verified 2026-10-14 · crawljam-26, itchcss-40]** | 1 |
| Title / host / stats / tabs | `#wrapper .jam_header_widget`, `.jam_title_header` (42px/900, 1.25em at ≤650px), `.jam_host_header`, `.stat_box`, `.stat_value`, `.header_tabs .header_tab` | 1 / 2 |
| Submit box, countdown | `#wrapper .jam_submitter_widget`, `.countdown .time_block[data-name=seconds]`, `.join_jam_btn` | 1 / 2 |
| Description | `#wrapper .jam_content` (`margin:20px`, 10px sides at ≤650px) | 1 |
| Entries grid | `#wrapper #entries`, `#wrapper .browse_game_grid .game_cell`. Gap: `#wrapper{--itchio_grid_gap:…}`. Equal heights: `#wrapper .game_grid_widget{align-items:stretch}` **[verified 2026-10-14 · crawljam-45]**. Generated `!important` colours on `.game_text`, `.game_author a`, `.game_genre`, `.game_platform`, the filter items and `.itch_footer` need `!important` **[verified 2026-10-14 · itchcss-15]**. | 1 / 2 |
| Phase | `#wrapper .view_jam_page.during_voting …` | 2 |

---

### 9. Layout breakpoints that reshape the tree

| Page | Width | What changes | Evidence |
|---|---|---|---|
| Profile | grid width ≥770 / 510–769 / <510px | 3 / 2 / 1 card columns (`auto-fill`, `minmax(250px,1fr)`) | **[verified 2026-10-14 · itchcss-23]** |
| Profile | ≤800px | `.mode_column`: columns stack, `.user_game_grid` becomes a horizontal flex scroller | **[verified 2026-10-14 · itchcss-39, a11y-33]** |
| Profile | ≤650px | `.game_cell_tools` hidden; `.game_grid_widget` gets `font-size:14px`, but `.user_page .game_grid_widget{font-size:1.1428em}` outranks it | **[verified 2026-10-14 · itchcss-23, a11y-33]** |
| Project, devlog | ≤1000px | `#inner_column` max 600px; `size_very_large` text 19→16px; `.columns` stack with `.right_col` **first**; screenshots become a horizontal strip; `.header_buy_row` shown (rendered: `none` at 1001px, `block` at 1000px); devlog `.split_columns` becomes `display:block` | **[verified 2026-10-14 · itchcss-38, crawlproject-11, gapfill03-08]** |
| Project, devlog | ≤960px / ≤650px | `#user_tools` becomes a static strip / a fixed 50px bottom bar | **[verified 2026-10-14 · itchcss-32]** |
| Project, devlog | ≤600px / ≤400px | `#wrapper` side padding (0 above 1000px, 20px from 601 to 1000px) drops back to 0 / the buy row is compacted | **[verified 2026-10-14 · itchcss-38]** |
| Jam | ≥960px | `img.jam_banner` max 960px unless `.full_width` | **[verified 2026-10-14 · crawljam-25]** |
| Jam | ≤820px | the submitter and countdown widget stacks | **[verified 2026-10-14 · itchcss-40]** |
| Jam | ≤650px | `.jam_body` 10px side margins; title 1.25em; `#entries` `margin-top:0` | **[verified 2026-10-14 · itchcss-40, crawljam-23, crawljam-26]** |

Media-query counts: `game.css` uses `max-width` 650 ×21, 600 ×18, 1000 ×6, 960 ×4 and 400 ×4; `jam.css` uses 650 ×15 and 600 ×11 **[verified 2026-10-14 · a11y-34]**. Test custom layouts at 1001/1000, 961/960, 801/800, 651/650 and 601/600px.

---

### 10. Cross-page quick reference

#### 10.1 Does the selector exist inside `#wrapper`?

Each cell is pages with ≥1 match / pages with a `#wrapper`. Captures are logged out and from the same day **[verified 2026-10-14 · S03-N3]**.

| Selector | Profile (51) | Project (48) | Devlog post (6) | Devlog index (3) | Comments (1) | Jam overview (22) |
|---|---|---|---|---|---|---|
| `#inner_column` | **0** | 48 | 6 | 3 | 1 | **0** |
| `.inner_column` | 51 (median 2 per page) | 48 | 6 | 3 | 1 | **0** |
| `#header` / `.header` | 0 / 51 (`#profile_header.header`) | 48 / 48 | 6 / 6\* | 3 / 3 | 1 / 1 | **0 / 0** |
| `.columns` | 46 | 48 | 0 | 0 | 0 | 0 |
| `.left_col` / `.right_col` | 0 | 48 | 0 | 0 | 0 | 0 |
| `.formatted_description` | **0** | 47 | **0** | 0 | 0 | 0 |
| `.formatted` | 36 (the bio) | 0 | 0 | 0 | 0 | 0 |
| `.user_formatted` | **0** | 47 (median ≈45: comments) | 6 | 0 | 1 | 22 (`.jam_content`) |
| `.post_header` / `.post_body` | 0 | 30 (comments) | 6 | 0 | 1 | 0 |
| `.footer` | 51 | 48 | 6 | 3 | 1 | **0** |
| `.itch_footer` | 0 | 0 | 0 | 0 | 0 | 6 |
| `.game_title` | 50 (card titles, median 12) | 48 (the `h1`) | 6 | 3 | 1 | 6 (grid cards) |
| `.game_grid_widget` / `.game_cell` | 50 | 0 | 0 | 0 | 0 | 6 |
| `.game_info_panel_widget` | 0 | 48 | 6 | 0 | 0 | 0 |
| `.game_comments_widget` | 0 | 30 | 6 | 0 | 1 | 0 |
| `.button` | **0** | 46 | 6 | 0 | 0 | 11 |
| `.page_widget` (page-type root) | 51 | 48 | 6 | 3 | 1 | 22 |

\* All 6 sampled posts belong to projects with banners. On posts of bannerless projects, `#header`, `.header` and `.game_title` all match 0/7; on bannerless comments pages and devlog indexes, `#header` and `h1.game_title` match 5/5 each **[verified 2026-10-14 · S03-N4, gapfill03-03, gapfill03-04]**.

#### 10.2 Page-type scoping hooks (inside `#wrapper`, independent of `body`)

| Page | Root hook (the `.page_widget` element) | Use for |
|---|---|---|
| Profile | `#wrapper .user_page` | Variables and layout modes |
| Project main page | `#wrapper .view_game_page` | Main-page-only rules, so they don't hit devlogs and comments |
| HTML5 project | `#wrapper .view_html_game_page` | Embed-page tweaks |
| Devlog post | `#wrapper .game_devlog_post_page` | Post-only rules |
| Devlog index | `#wrapper .game_devlog_page` | Index-only rules |
| Comments page | `#wrapper .game_comments_page` | Comments-page-only rules |
| Jam overview | `#wrapper .view_jam_page` | Everything on jams, including phase classes |

Evidence: **[verified 2026-10-14 · crawlproject-37, crawlproject-39, crawlproject-40, crawlproject-41, community-35, crawljam-19, S03-N3]**.

#### 10.3 Where user-written HTML lands

| Page | Container | Notes |
|---|---|---|
| Profile bio | `div.user_profile.formatted` (**no** `.user_formatted`) | Bio-specific sizes from `.user_page .user_profile.formatted …` |
| Project description | `div.formatted_description.user_formatted`, plus a second one inside `.download_instructions` | Site `h2`s are siblings under `.left_col`, not inside it |
| Devlog post | `section.object_text_widget_widget.base_widget.user_formatted.post_body` (id varies per request) | |
| Jam description | `div.jam_content.user_formatted` | |
| Comments | `div.post_body.user_formatted[dir=auto]` | Present on project, devlog and comments pages |

Evidence: **[verified 2026-10-14 · sanitizer-30, crawlproject-56]**; [documented · docs-25]; the project description container **[verified 2026-10-16 · live-html]**.

---

### 11. Logged-in and owner views

Everything in §1–§10 is what a **logged-out** visitor receives. No logged-in page was saved for this knowledge base. What is known about other views comes from four sources:
- one owner export of a profile (June 2026);
- itch's own stylesheets (`user.css`, `game.css`);
- `game.min.js`;
- the live probe runs of 2026-10-16, which recorded DOM facts (no page copy) from the owner's view of one draft project and of the profile, and from the logged-out profile (`live-dom`).

Rows marked inferred or unverified were never seen rendered.

| Node | Where | Who gets it | Confidence |
|---|---|---|---|
| Comment form `form.form.post_form`. Closed: `input.click_input[type=text]`. Open: a markdown widget (`.forms_markdown_input_widget`) with `.markdown_toolbar > li > button[type=button][tabindex=-1]`, `textarea.markdown_textarea` (`min-height:160px`, monospace, `resize:vertical`), a `.buttons` row and a hidden `input[name=csrf_token]` | **Inside `#wrapper`**, in `.game_comments_widget` on the main page, devlog posts and `/comments`, in place of the logged-out `p.form_placeholder` | Logged-in visitors; built by `game.min.js` after load | [inferred · gapfill03-13]: code and CSS read, never seen rendered |
| Reply and edit forms `.post_form.inline_reply` / `.post_form.inline_edit` | Inside comment lists (`.community_post_list_widget`) | Logged-in visitors (edit: the comment's author) | [inferred · gapfill03-13] |
| `.game_cell_tools > a.action_btn.add_to_collection_btn` | Inside `.game_thumb` of a grid card: `position:absolute;top:5px;right:10px`, faded in on `.game_cell:hover`, hidden at ≤650px | Present on 36/36 cards of every logged-out browse page. Found on 0 of 59 logged-out profile captures, and absent from the owner export and from the live profile, owner and logged out. Logged-in non-owners: unknown. | **[verified 2026-10-14 · gapfill03-14]** for presence and absence; live profile **[verified 2026-10-16 · live-dom]**; [unverified] logged-in non-owners |
| `body.dark_theme` (`game.css`: `body.dark_theme{background:#1b1b1b}` + 49 more rules; `user.css` 30; `jam.css` 23) | `body` | Never logged out (0/839 captures). Creator pages carry `body.no_theme_toggle`, which hides the site's theme toggle. The owner's view of a draft project, with the OS in dark mode, also had `no_theme_toggle` and no `.dark_theme`, and so did the profile, owner and logged out (the account's site-theme setting wasn't recorded). Dark-mode accounts: unknown. | **[verified 2026-10-14 · gapfill03-14]** for absence and rules; owner views and logged-out profile **[verified 2026-10-16 · live-dom]**; [unverified] for dark-mode accounts |
| Owner's profile chrome: site header with `.owner_tools > button.edit_theme_btn`, `.theme_editor_columns`, no `#user_tools` | Body level | Profile owner, with the theme editor closed too | **[verified 2026-10-14 · S03-N7, gapfill03-11]**, from one export; live profile **[verified 2026-10-16 · live-dom]** |
| Hidden pre-rendered items: inline `display:none` cards and collection rows; `section.purchased_games` without `.mode_show_purchases` | **Inside `#wrapper`** | Profile owner | **[verified 2026-10-14 · gapfill03-11]**, from one export; on the live profile, two inline `display:none` elements, two collection rows and a purchases section in the owner's view only **[verified 2026-10-16 · live-dom]** |
| Editor scroll container: `.theme_editor_open .theme_editor_columns{height:calc(100vh - 50px)}`, primary column `overflow:auto` (`user.css`); the same on `.game_page_apperance_columns` (`game.css`) | Around `#wrapper` | Owner with the theme editor open | Rules **[verified 2026-10-14 · gapfill03-12]**; the `.game_page_apperance_columns` wrapper (project) and the `.theme_editor_columns` wrapper (profile) are there with the editor closed too **[verified 2026-10-16 · live-dom]**; the effect is [inferred] |
| Project owner header `div.game_header_widget` (`.publish_status .pub_toggle.published\|.private\|.restricted`, `.edit_theme_btn`) | Body level, before `#wrapper` | Project owner | The bar with `.owner_tools` and `.edit_theme_btn` **[verified 2026-10-16 · live-dom]**, one draft; the `.pub_toggle` states [inferred · gapfill03-12], from `game.css` only |

Rules that follow:
- **Never style bare form controls or lists under `#wrapper`** [inferred · gapfill03-13]. Logged in, the comment toolbar is `li > button` and the editor is a `textarea`, both inside `#wrapper`.
  - Rules such as `#wrapper li::before{content:"★"}`, `#wrapper button{padding:12px 24px}` or `#wrapper textarea{background:transparent}` restyle UI you never see while testing logged out.
  - Scope list and typography rules to the containers in §10.3.
  - Scope button rules to itch's own button classes (`.buy_btn`, `.download_btn`, `.direct_download_btn`, `.load_iframe_btn`).
- **Keep the comment form readable if you recolour `.game_comments_widget`.** Its toolbar takes `var(--itchio_body_color_light)` and hovers with `var(--itchio_button_color)`. The `textarea` uses itch's `.form textarea` styles [inferred · gapfill03-13].
- **Don't cover the top-right of profile cards with a stacked overlay.** For example, avoid a `::after` on `.game_thumb` with `z-index:1` and `pointer-events:auto`. If itch shows `.game_cell_tools` there for logged-in visitors, as it does on browse pages, the overlay would hide or block "Add to collection" [inferred · gapfill03-14].
- **Don't trust the owner's preview for scroll effects.** With the theme editor open, the page scrolls inside the primary column, not the document. So a `position:sticky` element sticks to that column, `scroll(root)` timelines don't advance, and `min-height:100vh` overshoots the visible area by 50px. Re-check scroll-driven CSS logged out [inferred · gapfill03-12].

Still open, because it needs an account:
1. A logged-in **non-owner's** view of a profile, a project page, a devlog post and `/comments`. Does `#user_tools` stay, a site header appear, `.game_cell_tools` show on cards, the comment form render as above, and `body.dark_theme` apply for a dark-mode account?
2. The **owner's** view of a devlog post (`.game_page_apperance_columns`, `.game_header_widget`). The project page's owner view was read on 2026-10-16 (`live-dom`, §1): the wrappers and the owner bar are there, `#user_tools` is not.
3. A current owner export of a profile. Run 2 (2026-10-16) recorded its key DOM facts (`live-dom`: wrappers, site header, no `#user_tools`, hidden items) but no page copy.

Probe: use "Save page as… → Webpage, HTML only", then `skel.py <file> 9` and `matrix2.py` against the logged-out captures. Redact `csrf_token` values before sharing (see gapfill03 in `evidence/gapfill.md`).

---

### Section notes

New checks for this section, run 2026-10-14. All were logged out and GET-only, with 5 s spacing, and used 8 itch requests in total. Raw HTML stayed in the session scratchpad (`…/scratchpad/section03-v2/raw/`). The scripts are in `knowledge/evidence/section03-tools/`:
- `fetch.sh` and `skel.py` were reused from an earlier pass of this section;
- `matrix2.py`, `head.py` and `headseq.py` are new.

Run every script with `python -I`.

- **S03-N1: fresh fetches, 13:40–13:41 UTC.**
  - Command: `OUT=<scratch> bash fetch.sh <url> <name>`, then `python -I skel.py <file> 7` and `python -I head.py <file>`. Pages: `https://leafo.itch.io/`, `https://creator-64.itch.io/game-28`, its post `/devlog/<id>/<post>`, `https://leafo.itch.io/x-moon`, `https://itch.io/jam/gmtk-2025` and `/jam/gmtk-2025/entries`. All returned 200.
  - `https://mirokshi.itch.io/` returned 429 and was not retried.
  - `curl` without `-L` on `http://leafo.itch.io/` returned **301** with `Location: https://leafo.itch.io/`.
  - **Head order:**
    - leafo: `user.css` → 7 scripts → `user_theme` (785 chars) → Google font link, with no `custom_css`.
    - igua project and its post: `game.css` → scripts → `game_theme` (4,941) → font link → `custom_css` (10,203, identical), which is the last `<head>` element.
    - x-moon: `game.css` → `game_theme` → `custom_css`.
    - gmtk overview: `jam.css` → scripts → `jam_theme` (7,031 chars; the single divider rule ends at char 1,877).
    - gmtk entries: `main.css` → `jam_theme` (252) → scripts. The page has no `#wrapper` and no `view_jam_page`, but does have `.jam_header_widget` with `.cover_column`.
  - **Wrapper attribute order** within the same minute: igua `<div class="main wrapper game_page_wrapper" id="wrapper">` vs x-moon `<div id="wrapper" class="main wrapper game_page_wrapper">`. The `custom_css` tag attribute order also differed (`type` first on igua, `id` first on x-moon).
  - **game-28** is a fullscreen-start embed: `.game_frame.game_pending.start_maximized > .restore_wrapper + .iframe_placeholder[data-iframe] > button.load_iframe_btn`, followed by `div.donate` and `.columns`.
  - **gmtk-2025:** `.view_jam_page.after_voting.is_over.has_banner`, and the submitter holds a `<p>` with two `span.date_format`.
- **S03-N2: head-order census** over the same-day raw captures of the crawl dimensions. Command: `python -I headseq.py "<crawlprofile>/raw/p_*.html"`, then the same for `<crawlproject>/raw/[pcsd]-*.html` + `x-*.html` and `<crawljam>/raw/ov_*.html` + `sp_*.html` + `rate_*.html`.

  | Pages | Stylesheet sequences |
  |---|---|
  | 51 creator profiles | `user.css > user_theme` 29; `+ font` 13; `+ custom_css` 5; `+ font + custom_css` 4. `custom_css` was the last head element 9/9. |
  | 4 community-profile redirects | `main.css` |
  | Project family (48 projects, 6 posts, 3 indexes, 1 comments page) | Always `game.css > game_theme [> font links] [> custom_css]`; `custom_css` last 32/32 |
  | Purchase pages | `popup.css` only |
  | Board and topic | `main.css > jam_theme` |
  | 22 jam overviews | `jam.css > jam_theme [> font]` (18 + 4) |
  | 13 jam subpages | `main.css > jam_theme` |
  | 1 non-existent jam slug | `main.css` |
- **S03-N3: selector-presence matrix.** Command: `python -I matrix2.py "profile=<crawlprofile>/raw/p_*.html" "project=<crawlproject>/raw/[pcs]-*.html" "devpost=…/d-*-post.html" "devindex=…/d-*-index.html" "comments=…/x-game-11-comments.html" "jamov=<crawljam>/raw/ov_*.html"`.
  - Pages without `#wrapper` match nothing: 4 community-redirect profiles and 1 404 jam. Table 10.1 shows counts over pages that have `#wrapper`.
  - Matching is per single compound selector inside the `#wrapper` subtree, using a stdlib HTML parser.
  - Notable results:
    - `.button` 0/51 on profiles;
    - `.post_header` / `.post_body` on 30/48 project pages;
    - `.game_info_panel_widget` 6/6 and `.upload_list_widget` 4/6 on devlog posts;
    - `.user_formatted` 22/22 on jam overviews and 0/51 on profiles.
- **S03-N4: bannerless devlog.** Captures from an earlier pass of this section in the same session (11:08 UTC), re-parsed now with `skel.py`: `https://creator-42.itch.io/game-06`, `/game-06/devlog` and `/game-06/devlog/<id>/<post>`.
  - Project page: `#inner_column > #header.header + .view_game_page + #view_game_footer`.
  - Devlog index: `#header.header + .game_devlog_page + footer`.
  - Devlog post: **no `#header`**, only `.game_devlog_post_page + footer`.
  - This confirms a11y-07 and refines crawlproject-01, which describes the main project page.
- **S03-N5: `.post_header` / `.post_body` on project pages.** A grep of the game-28 project capture finds 47 `<div class="post_header">` and 46 `<div class="post_body user_formatted">` (+1 bare `post_body`), all comment markup. The post page has exactly one `section.post_header` and one `section.…user_formatted.post_body`.
- **S03-N6: profile sections vs mode classes** over the 51 creator-profile captures, using a python one-off that reads `.user_page` classes and the section tags.
  - `section.purchased_games`: on 2 of the 4 pages with `.mode_show_purchases`, and on 0 of the 47 without it.
  - `section.collections`: on 25 pages, 7 of them with `.mode_collection_grid`.
- **S03-N7: owner view of a profile.** I read, read-only, the private repo's June 2026 owner export (`itch-io-custom-css/preview/itch-io.html`) with `skel.py`.
  - `body` adds `.has_header`.
  - Its children are `div#user_profile_header_N.user_profile_header_widget.header_widget…` and `div.theme_editor_columns`.
  - Character offsets: `.theme_editor_columns` 10,124 < `.theme_editor_primary_column` 10,210 < `#wrapper` 10,274.
  - The head is `user.css` → `theme_editor.css` → `user_theme` → font link → `custom_css`.
  - This is one export from one account.
- **S03-N8: 404 jam and raw jam.** The same-day crawljam capture of a non-existent jam slug (`ov_gmtk-2026.html`, headers say `HTTP/1.1 404 Not Found`) has:
  - `body[data-page_name=view_jam]` and `main.css`;
  - body children `div#header_N.header_widget`, `div.main` and `div.footer`;
  - no `#wrapper`.

  The docs-verify capture of the 2014 raw jam (`live_tojam9.html`) loads `main.css` + `jam.css`, with the site header, `div#view_raw_jam_N.view_raw_jam_page.view_jam_base_page`, a body-level `.footer` and no `#wrapper`.
- **S03-N9: leafo card markup**, from the S03-N1 capture, using grep.
  - `.game_thumb` divs: 67, 61 of them with an inline `background-color`.
  - `img.lazy_loaded[width=315][height=250][data-lazy_src]`: 67, of which 0 have a `src`.
  - `a.thumb_link.game_link[tabindex="-1"]`: 67.
- **gapfill03-01 … -14: round-2 gap fill, 14:10–14:35 UTC.** The full method, commands and tables are in `knowledge/evidence/gapfill.md` ("Gap fill for 03-page-anatomy.md"); the scripts are in `knowledge/evidence/gapfill03-tools/`.
  - 24 logged-out GETs, 2 of them HTTP 429 retried once, plus 2 WebFetch reads of itch forum topics.
  - Fresh pages: size re-measures, bannerless comments, devlog indexes and posts, comics and books, a 404 project slug, and the current `game.css` / `game.min.js`.
  - Re-parsed read-only: all 923 same-day raw captures of the other passes, and the private repo's owner export.
  - One headless Chrome 155 render with the network blocked.

Conflicts resolved in this section:
1. **`#header` on project-family pages.** crawlproject-01 says every project page has `#header`, while a11y-07 says bannerless devlog posts have none. Both hold (S03-N4): main pages, indexes and comments always have it, and posts only when the project has a banner.
2. **`#user_tools` position.** The profile facts (crawlprofile-19, crawlprofile-60, itchcss-31, a11y-20) describe `user.css`: fixed top-right at every width. The project facts (crawlproject-08, itchcss-32) describe `game.css`: fixed, then absolute, then a static strip, then a bottom bar. Each page follows its own stylesheet.
3. **Jam `body` background.** The revamp post and community-29 say the background moved off `body`. docs-27 and the guide say the BG colour is still emitted on `body`. Only the colour stays on `body`; the image, text colour and font live on `.jam_page_wrap`. Paint on `#wrapper` either way.
4. **Click-to-launch classes.** community-33 found no `.iframe_placeholder`, `.game_pending` or `.load_iframe_btn` on Pitch, which auto-loads. crawlproject-16, community-50 and S03-N1 (game-28) show them server-rendered on click-to-launch and fullscreen-start pages. They are real, but only in those modes.
5. **Counts that differ between passes.** I used the verifier-corrected values:
   - collections on 25/51 profiles (crawlprofile-15);
   - 114 priced cells and 4 tag variants (crawlprofile-13);
   - `has_banner` on 14/17 jams with `.full_width` on 2 (crawljam-25; an earlier pass saw 4 of 19);
   - 10 board pages and 8 with neither comments nor board (crawlproject-15).

   The phase counts are given from both fetches (crawljam-20), because phases change over time.
6. **How many jams carry host CSS.** sanitizer-34 (3/16), itchcss-06 (2/9), crawljam-01 (7/22) and corpus-09 (23/60) used different samples and don't conflict. This section relies only on where the CSS sits, which they all agree on.
7. **Site header on project pages.** crawlproject-54 links it to jam entries in voting (7/7 vs 0/64). a11y-55 saw it on a devlog post without establishing a jam context. The trigger is therefore stated as "not documented".
8. **Bio heading size.** The sanitizer-30 detail mentions the generic `.formatted h1–h4{font-size:18px}`. The verifier showed that `.user_page .user_profile.formatted h1{2em}` (32px) outranks it, and I used the corrected value. S03-N3 also shows that `.formatted` exists only on profiles, so the generic `.formatted` rules never reach project, devlog or jam content.
9. **"Largest observed" CSS sizes.** 03 §3 said projects reach 38,576 B and jams 20,203 chars (corpus-07, corpus-08). 01 §3 said 93,105 and 20,410 (crawlproject-47, crawljam-29). Both were right about different pages, measured in different units (gapfill03-01):
   - 38,576 is **bytes** on the corpus's largest project.
   - 93,105 is **CRLF→LF code points** on a page outside the corpus sample (93,948 B served). crawlproject's script reads files in text mode.
   - 20,203 is a smaller jam measured **with** itch's trailing space.
   - 20,410 excludes that space (20,411 with it).

   §3 now gives one row per page type with every metric and the samples. 01 §3 and 09 #41 should quote the same row.
