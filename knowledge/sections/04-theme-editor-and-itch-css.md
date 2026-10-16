## Theme editor and itch's own stylesheets

Your custom CSS never runs alone. On every creator page it sits on top of two layers you don't control:

1. **itch's static bundle**: exactly one of `user.css`, `game.css`, `jam.css` or `main.css`, chosen by page type.
2. **The theme-editor output**: a generated `<style>` block (`#user_theme`, `#game_theme` or `#jam_theme`) built from the creator's colour, font, size and background choices.

This section covers both layers per page type. It describes what the theme editor emits, where the background image is painted and where the `--itchio_*` variables live. It also covers which itch rules use `!important`, inline styles or runtime `<style>` blocks, the breakpoints, z-index values and focus styles, and how strong your selectors must be to win.

How to read it:
- **[verified 2026-10-14 · id]** = reproduced by a direct test or live observation. [documented · id] = itch docs, staff posts or itch's own source files. [observed · id] = seen on real pages but not systematically. [community · id] = third-party reports only. [inferred · …] = deduced from verified facts.
- Ids such as `crawlprofile-35` point to facts backed by `knowledge/evidence/<dimension>.md`. Ids `s04-N` point to the checks made for this section, and `s04-gf-N` to the later gap-fill checks; both are listed under "Section notes" at the end.
- Everything was observed logged out on 2026-10-14 unless a tag says otherwise. `live-*` ids come from the live probe runs of 2026-10-16 in Brave 155 (`evidence/live-probes/`): Run 1 on the owner's draft project, viewed logged in, Run 2 on the owner's profile, viewed logged in and logged out, and Run 3 on a draft devlog post of that project, viewed logged in; each holds only for the page types and views its text names. No third-party CSS is reproduced here. Code blocks are paraphrases or original examples.

---

### Rules first (TL;DR)

- **Check the theme editor before writing CSS.** itch keeps turning popular CSS patterns into editor options, and the CSS-access request asks whether the editor can already do what you want. The June 2026 jam editor has fonts, a size slider, button and header colours, radius, shadow presets, cover/contain/fixed backgrounds and panel opacity. The project editor hides a "BG2 Alpha" slider under *More options…*. [documented · docs-44, docs-24, docs-43] [community · community-41]
- **Prefix every selector with `#wrapper`.** No theme block contains an ID selector. The only ID selectors in `user.css`, `game.css` and `jam.css` are `#lightbox_container` and `#lightbox_shroud`, which belong to itch's lightbox overlay. So any `#wrapper …` selector outranks every non-`!important` bundle or theme rule that styles your page content. **[verified 2026-10-14 · crawlproject-31, s04-2, s04-3, s04-4]** This is by design: since the 2017 rewrite the editor emits "lower precedence CSS classes" so that creator ID selectors win. [documented · crawlproject-55]
- **Never use the `background` shorthand on `#wrapper`.** The theme writes the panel image as longhands on `.user_page_wrap` (profile), `.wrapper` (project) or `.jam_page_wrap` (jam). Each of those is the `#wrapper` element itself, so the shorthand resets `background-image` and wipes the creator's image. Use longhands. **[verified 2026-10-14 · itchcss-57, crawlprofile-35, crawlproject-23, localtests-54]**
- **Override `--itchio_*` variables where the theme declares them.**
  - Profiles: on `#wrapper .user_page{…}`. A declaration on `#wrapper{…}` is shadowed.
  - Projects and jams: on `#wrapper{…}`.

  **[verified 2026-10-14 · itchcss-12, repo-20, crawljam-05, corpus-44]**

  A variable only reaches rules that read it through `var()`. The profile and project themes hard-code their colours per selector, so recolour those selectors directly. **[verified 2026-10-14 · repo-21, crawlprofile-32, s04-2]**
- **Use `!important` only against `!important` or inline styles.** The counts are:
  - itch bundles: 7 in user.css, 12 in game.css, 7 in jam.css;
  - generated themes: 8 in the project theme, 6 in the jam theme, 0 in the profile theme;
  - inline `style` attributes, such as the runtime `min-height` on the profile's `#wrapper`.

  Full list in §9.4. **[verified 2026-10-14 · itchcss-18, s04-1, s04-2, s04-3, s04-7]**
- **On profiles, your CSS is not the last word.** itch's JS appends two `<style itchio-grid-sizer>` blocks after `style#custom_css` that set `grid-template-columns` on the game grids. It also writes an inline `min-height` on `#wrapper`. [documented · community-27] [observed · s04-6, s04-7] Both were on the live profile, owner and logged out **[verified 2026-10-16 · live-dom]**.
- **Add the adaptations itch doesn't have.** itch's stylesheets contain no `prefers-reduced-motion`, `forced-colors`, `prefers-color-scheme`, hover/pointer media queries or `color-scheme`. **[verified 2026-10-14 · a11y-14, support-52, itchcss-27]**
- **For keyboard focus, paste the one block in §9.6.** It was the only recipe tested that gave every Tab stop a visible, uncut ring on profile, project and jam pages. Recolouring `:focus` alone leaves spoilers and disabled buttons without a ring, and cuts the rings on game titles. **[verified 2026-10-14 · s04-gf-01, s04-gf-02]**
- **On HTML5 project pages, keep effects off the embed's ancestors.** A `backdrop-filter`, `filter`, `transform` or `will-change` on `#wrapper`, `#inner_column`, `.view_game_page` or `.embed_wrapper` breaks the maximized game: it grows to the page height or disappears. `isolation` there puts itch's tool bar over the game. §9.2 has guarded recipes. **[verified 2026-10-14 · s04-gf-08, s04-gf-09]** for the pairs rendered: `backdrop-filter` on `#inner_column`, `transform` on `.view_game_page`, a `both`-fill transform entrance on `#inner_column`, `filter` on `#wrapper`, `will-change:transform` on `.embed_wrapper`, `isolation` on `#wrapper`, `opacity`+`isolation` on `#inner_column`. The other pairings follow from the same containing-block and stacking rules **[inferred]**.
- **Read the live theme block before you pick colours.** The theme's colours, and the alphas and shades derived from them, never appear in the CSS editor. **[verified 2026-10-14 · a11y-38, crawlprofile-54]**
- **Judge every design logged out.** The owner gets `theme_editor.css` and owner bars that visitors never see. [observed · itchcss-51] On projects, the owner bar (`.game_header_widget` with `.owner_tools` and `.edit_theme_btn`) and the `.game_page_apperance_columns` wrappers around `#wrapper` are confirmed **[verified 2026-10-16 · live-dom]**. A draft devlog post of that project shows the owner less: `.owner_tools` but no `.edit_theme_btn`, and no wrappers, `#wrapper` being a direct child of `body` **[verified 2026-10-16 · live-dom]**. On the profile, the owner's view had a second itch stylesheet link, the site header with `.owner_tools` and `.edit_theme_btn`, `body.has_header`, the `.theme_editor_columns` wrappers around `#wrapper` (editor closed) and no `#user_tools` **[verified 2026-10-16 · live-dom]**.

---

### 1. What loads on each page type

| Page | itch bundle (exactly one) | Theme block | Where your CSS ends up | Theme Google Fonts `<link>` | Added after your CSS at runtime |
|---|---|---|---|---|---|
| Profile `<user>.itch.io/` | `static.itch.io/user.css` (71,824 B) | `style#user_theme`: one line, native CSS nesting | `style#custom_css`, the last `<style>` in the served `<head>` | between `user_theme` and `custom_css` | 2 × `<style itchio-grid-sizer>` (also on the live profile, owner and logged out **[verified 2026-10-16 · live-dom]**) |
| Project, devlog post | `game.css` (164,629 B) | `style#game_theme`: flat, always 40 rules | `style#custom_css`, after the theme and font links | 0–2 links between `game_theme` and `custom_css` | none seen (none in the owner's view of a draft project or of its draft devlog post either **[verified 2026-10-16 · live-dom]**) |
| Jam overview `itch.io/jam/<slug>` | `jam.css` (71,053 B) | `style#jam_theme`: flat, 14 generated rules | **inside `style#jam_theme`**, appended after the generated rules. There is no `style#custom_css` | after `jam_theme`'s closing `</style>` | none seen |
| Jam sub-pages (`/entries`, `/results`, `/rate/<id>`) | site-wide `main.css` (643,506 B) | `style#jam_theme` with only `:root` + `.page_widget` variables | **not applied**: host CSS never reaches these pages | — | — |

Sources: **[verified 2026-10-14 · docs-55, itchcss-01, crawljam-31, crawlprofile-48, crawlproject-31, external-02, corpus-13, crawlprofile-37, crawlproject-27, crawljam-04, s04-1]** [documented · community-27] [observed · s04-6]

**Head order.**
- **Profile:** `link user.css` → itch's synchronous scripts (`lib.min.js`, `bundle.min.js`, `user.min.js`) and inline scripts → `style#user_theme` → [Google Fonts link] → `style#custom_css` → `</head>`. There is no preconnect or dns-prefetch. **[verified 2026-10-14 · external-02, crawlprofile-37]** The live profile (no theme font link) served one `static.itch.io` link logged out and two to the owner, then `style#user_theme` and `style#custom_css`; after the scripts, two `style[itchio-grid-sizer]` followed `custom_css` **[verified 2026-10-16 · live-dom]**.
- **Project:** `link game.css` → `style#game_theme` → [font links] → `style#custom_css`. **[verified 2026-10-14 · docs-55]** The owner's view of a draft project had two `static.itch.io` links, then `style#game_theme` and `style#custom_css`, in the served HTML and after scripts alike **[verified 2026-10-16 · live-dom]**.
- **Jam overview:** `link jam.css` → scripts → `style#jam_theme` (generated rules + host CSS) → font link(s). **[verified 2026-10-14 · crawljam-31, s04-1]**

In every case your CSS wins equal-specificity ties against both the bundle and the generated theme. On profiles the one exception is the runtime grid sizer (§9.1).

**Versioning and caching.**
- The `?<number>` on every `static.itch.io` URL is a site-wide deploy stamp shared by all CSS and JS. It is not a file version.
- On 2026-10-14 it moved from `1791970861` to `1791974461` to `1791981660`, while user/game/jam/main.css stayed byte-identical. Last-Modified was 2026-10-06 21:47:49 GMT for user/game/jam.css and 2026-10-12 for main.css. The June 2026 stamp was `1780793839`.
- Never hard-code the stamp. Never `@import` itch's bundles; the page already links its own.
- To detect a real change, compare ETag, Last-Modified or a content hash. Cite itch stylesheet URLs without the query.
- Bundles are served with `Cache-Control: max-age=86400` and `Access-Control-Allow-Origin: *`.

**[verified 2026-10-14 · community-51, crawlproject-64, repo-65, a11y-59, itchcss-49, crawlprofile-48, crawljam-31]**

**Stability.** Only the classes and IDs listed in the official guide are "stable". The guide lists **no profile selectors**, so every profile class in this section is unstable by definition. For major changes itch only says it will "try to email all CSS users", with no promise of advance notice. [documented · docs-39] itch redeploys often, so re-check computed values after updates. **[verified 2026-10-14 · itchcss-49]**

**Other facts about the delivery:**
- **Your CSS is served as written** inside `<style id="custom_css" type="text/css">`: no minification, no reformatting, and `@import` lines are kept. **[verified 2026-10-14 · repo-02]** It is not strictly byte for byte: on a project and on the profile itch trims leading and trailing whitespace and deletes every `</style>`, and on the project it stores line breaks as CRLF (the profile keeps LF), while all six `@import` forms tested are kept **[verified 2026-10-16 · live-css, live-c03 to live-c08, live-c42, live-c43]**.
- **Standards mode.** Profiles start with `<!DOCTYPE HTML>` and `<meta charset="UTF-8"/>`. The HTTP `Content-Type` is bare `text/html`. A local harness must declare both to behave the same. [observed · localtests-55] A project page and the profile (owner and logged out) were served as bare `text/html` too **[verified 2026-10-16 · live-dom]**.
- **Owner-only extras.** Logged out, none of 15 pages linked `theme_editor.css`. The owner's logged-in June 2026 profile export linked `user.css` plus `theme_editor.css` and showed a `.user_profile_header_widget.header_widget` owner bar. So "profiles load two itch stylesheets" (support-58) describes the owner's view only. [observed · itchcss-51, support-58] The owner's view of a draft project likewise had two `static.itch.io` stylesheet links (the run didn't record which) and a `div.game_header_widget` owner bar **[verified 2026-10-16 · live-dom]**. On the live profile the owner got two `static.itch.io` links and logged-out visitors one, and only the owner got the `.user_profile_header_widget` bar **[verified 2026-10-16 · live-dom]**.

---

### 2. What the theme editor offers, per page type

| Option | Profile | Project / devlog | Jam overview |
|---|---|---|---|
| Colours | BG, Text, Link | BG, BG2 (+ "BG2 Alpha" under *More options…*), Text, Link, Buttons, Headers | BG, BG2 (+ content-opacity slider), Text, Link, Button (separate from Link), Header |
| Fonts | 1 font | body font + headings font | body font + header font |
| Font size | `%` on `.user_page` | class `size_small/medium/large/very_large` on `.inner_column` | free `%` slider on `.jam_page_wrap` |
| Corner radius | yes | — | yes |
| Background image | repeat, position (left/center/right), fixed | repeat, position, fixed | repeat, position, cover/contain, fixed |
| Other | banner (+ full width), layout grid/column, game order, hidden games, show purchases, collections as grid | banner + alignment, Screenshots *Sidebar / Hidden / Auto*, embed background, big-video layout | shadow / outline / glow presets, Copy / Paste theme as JSON |

Sources: [documented · docs-24, docs-43, crawljam-37, crawlproject-55] **[verified 2026-10-14 · crawlprofile-16, crawlprofile-36, crawlprofile-39, crawlproject-26, crawlproject-30, repo-19]** [observed · repo-39] [community · community-41]

- **Copy/Paste theme is jam-only.** The code lives only in the `JamEdit` package of `theme_editor.min.js`. It writes JSON `{format:'itchio_theme',version:1,source:'jam',theme}`, which includes colours, fonts, radius, `bg2_alpha`, `body_shadow` and **the `css` key**, but not the images (re-upload them). docs-43 calls the jam editor "the same theme editor UI" as profiles and projects; that refers to the UI, not this feature. [documented · repo-40, docs-43]
- **Upload limit.** In the June 2026 profile editor config, background and banner uploads were capped at 3 MiB (`image_size_limit: 3145728`). The value comes from the server and can't be re-checked logged out. [observed · community-42, repo-39] The owner's profile and project page carried the same `image_size_limit: 3145728` on 2026-10-16 **[verified 2026-10-16 · live-dom]**; which uploads it governs on the project, and the accepted formats, were not checked.
- **The CSS box** is gated by `can_use_css` in the editor config. Your CSS is stored as the theme's `css` key, next to `bg_color`, `text_color`, `link_color`, `font_family`, `font_size`, `border_radius`, `layout`, `game_order` and `hidden_games`. [observed · repo-39] On the owner's draft project and profile `can_use_css` was `true` and the Custom CSS field was there **[verified 2026-10-16 · live-dom]**.
- **Jam backgrounds.** `background-size:cover` is documented but was never emitted in 42 generated jam themes. `contain` (×2) and `background-repeat:repeat-y` were, so the editor also has a repeat mode the announcement doesn't mention. [documented · crawljam-37]
- **Why use the option.** It keeps your CSS short (the editor's size cap) and survives itch updates. [documented · docs-44]

---

### 3. Profile theme: `style#user_theme`

#### 3.1 Shape

One fixed template on all 70 profiles sampled (51 earlier + 19 fresh); only the values change. **[verified 2026-10-14 · crawlprofile-32]** A paraphrase of its shape:

```text
:root{--itchio_ui_bg:<BG mixed with #333>}   body{background-color:<BG>}
.user_page{4 variables; color:<Text>; font-size:<N>%; font-family:<Font>,Lato,LatoExtended,sans-serif;
  hr{…}  .user_links .svgicon{fill}  .game_column,.purchased_games,.collection_row{border-color}}
.user_page_wrap{<background longhands, or empty>}   .header .image_header img{<width:100%, or empty>}
.user_page a,.footer a{color:<Link>}   .footer{border-color}
.game_grid_widget .game_cell{ .game_thumb,.gif_overlay{border-radius}  .game_title a.title{color:<Link>}
  .web_flag{color;background}  .game_text,.game_author{<Text at .75>}  .game_platform,.game_genre{<Text at .5>} }
```

- **Format.** One line (785 and 966 characters on the two pages checked), with spaces after the colons (e.g. `color: #eef3ff`). So it is compact template output, not minified. It uses native nesting and contains 0 `!important` and 0 ID selectors. **[verified 2026-10-14 · repo-22, itchcss-04, s04-3]** The owner's profile still served its 966-character block on one line on 2026-10-16, logged in and logged out **[verified 2026-10-16 · live-dom]**.
- **Unset options leave empty blocks.** `.header .image_header img{}` appears when the banner option is off. `.user_page_wrap{}` appears when no image is set (seen live on leafo.itch.io today, and in a June export). [observed · localtests-08] **[verified 2026-10-14 · s04-3]**

#### 3.2 Specificity of each theme rule

| Theme rule (nesting resolved) | Specificity | Sets |
|---|---|---|
| `:root` / `body` | (0,1,0) / (0,0,1) | `--itchio_ui_bg` / `background-color` |
| `.user_page` | (0,1,0) | 4 variables, `color`, `font-size:%`, `font-family` |
| `.user_page_wrap` (= `#wrapper`) | (0,1,0) | panel background longhands |
| `.user_page a`, `.footer a` | (0,1,1) | link colour as a literal |
| `.user_page hr` | (0,1,1) | `background-color` |
| `.user_page .game_column / .purchased_games / .collection_row` | (0,2,0) | `border-color` |
| `.user_page .user_links .svgicon` | (0,3,0) | `fill` |
| `.game_grid_widget .game_cell .game_thumb / .gif_overlay / .game_text / .game_author / .game_platform / .game_genre / .web_flag` | (0,3,0) | colours, `border-radius` |
| `.game_grid_widget .game_cell .game_title a.title` | **(0,4,1)** | link colour as a literal |

**[verified 2026-10-14 · itchcss-04, crawlprofile-32, repo-21]** Any `#wrapper …` selector beats all of them.

#### 3.3 Variables and hard-coded colours

- **Where they live.** The theme sets exactly four variables on `.user_page`, a **child** of `#wrapper`: `--itchio_font_family`, `--itchio_link_color`, `--itchio_gray_back` and `--itchio_border_radius`. It also sets `--itchio_ui_bg` on `:root`. No `--itchio_button_*` variable is set on profiles. **[verified 2026-10-14 · crawlprofile-41, corpus-44]**
- **Defaults.** `user.css :root` supplies `--itchio_white_back:#fff`, `--itchio_gray_back:#F4F4F4`, `--itchio_body_color:#222`, `--itchio_border_color:#dadada` and others. **[verified 2026-10-14 · crawlprofile-41]**
- **Override on `.user_page`.** In a test, `#wrapper{--itchio_link_color:…}` left `.user_page` at the theme's value, while `#wrapper .user_page{--itchio_gray_back:…}` applied. **[verified 2026-10-14 · itchcss-12, repo-20]**
- **Variables don't recolour links or cards.** The theme writes literal colours on `.user_page a`, `.footer a`, `.game_title a.title`, `.web_flag`, `.game_text`, `.game_author`, `.game_platform`, `.game_genre`, `hr`, `.svgicon` and the column, footer and thumb borders and radii. In a test, overriding `--itchio_link_color` left game titles at the old colour; only `#wrapper .game_title a{color:…}` changed them. **[verified 2026-10-14 · repo-21, crawlprofile-32]**
- **What a variable override does reach:** `user.css`'s own `var()` consumers, for example the carousel scrollbars (`scrollbar-color:var(--itchio_link_color) var(--itchio_gray_back)`). **[verified 2026-10-14 · crawlprofile-16, crawlprofile-41]**

#### 3.4 Derived colours the creator never picks

- **`--itchio_ui_bg`** = floor(0.2·BG + 0.8·#333) per channel (template `mix_color(bg_color,'#333',0.2)`). For example, `#0b1433` → `#2b2c33`. Truncation matches 70/70 profiles; rounding matches only 8/70. The same formula also matched 5/5 pages in a mixed sample of profile, project and jam themes. **[verified 2026-10-14 · crawlprofile-34, community-26, repo-19]**
  - It colours only itch's site header: 7 `.header_widget …` rules in user.css. Logged-out profile and project pages have no `.header_widget`; jam overviews do (`div.jam_layout_header_widget.header_widget.gray`).
  - A recoloured header bar is therefore not evidence that your CSS leaked. Don't override this variable: it is site UI and lives outside `#wrapper`.

  **[verified 2026-10-14 · community-26, crawlprofile-34]**
- **Two BG shades.** `--itchio_gray_back` = `sub_color2(BG, 0.05)`, used by carousel scrollbar tracks. `sub_color(BG)` paints the bio `hr`, the column, purchases and collection borders, the footer border and the `.web_flag` background. For BG `#0b1433` they are `#161f3e` and `#213168`. Neither is editable in the editor; override them under `#wrapper` (e.g. `#wrapper .footer{border-color:…}`). **[verified 2026-10-14 · crawlprofile-54]**
- **Secondary card text by alpha.** `.game_text` and `.game_author` = Text at .75; `.game_platform` and `.game_genre` = Text at .5. Chrome computed `.game_genre` as `rgba(238,243,255,.5)`. On a translucent navy card over the image's brightest area that is 3.56–3.59:1, a fail for normal text.
  - Get the creator's BG, Text and Link values, or read the live `<style id="user_theme">`.
  - Compute the contrast of both the theme colours and yours.
  - Fix weak ones with ID rules, e.g. `#wrapper .game_genre{color:…}`.

  **[verified 2026-10-14 · a11y-38]**

#### 3.5 Size, radius, banner and sections

- **Font size** is a `%` on `.user_page`: 100% on 30/51 pages, range 75–175%. leafo.itch.io's 125% gives `.user_page` 17.5px. It scales `user.css`'s `body{font-size:14px}` (an earlier rule says 13px).
  - At 100% the bio is 16px (`1.1428571429em`) and the header `h1` (`.text_header>h1`) is `2.4285714286em`. Cards also use `1.1428571429em`.
  - `em` inside `#wrapper` follows the creator's setting; `px` and `rem` don't.

  **[verified 2026-10-14 · crawlprofile-39, itchcss-43]**
- **Border radius** is `--itchio_border_radius` on `.user_page`: 0px on 32/51 pages, 3–29px elsewhere. The theme applies it only to `.game_thumb` and `.gif_overlay`; user.css applies it to carousel scrollbars. Reuse it with `border-radius:var(--itchio_border_radius)` on elements under `.user_page` (it isn't defined on `#wrapper`). **[verified 2026-10-14 · crawlprofile-40]**
- **Banner "full width"** emits `.header .image_header img{width: 100%}` (4/51 pages); otherwise the rule is empty. By default user.css shows the banner at intrinsic size, with `max-width:100%;max-height:1024px;width:auto;height:auto;display:block;margin:0 auto`. Without the option, use `#wrapper .image_header img{width:100%}` (the 1024px max-height still applies). **[verified 2026-10-14 · crawlprofile-36]**
- **Purchases and collections.**
  - `.user_page:not(.mode_show_purchases) .purchased_games{display:none}` hides purchases unless the option is on.
  - `.mode_collection_grid` turns collection carousels into grids capped at 20 cells (`.game_cell:nth-child(n+21){display:none}`).

  **[verified 2026-10-14 · crawlprofile-16]**

#### 3.6 Nesting needs a modern browser

The template's nested rules, including the type-led `hr{…}`, need *relaxed* nesting: Chrome 120+, Firefox 117+ or Safari 17.2+. Chrome 112–119 and Safari 16.5–17.1 have partial nesting that rejects nested rules starting with a type selector. Browsers without nesting drop every nested rule: the `hr` colour, icon fill, column borders, game-title colour, card text colours and thumb radius. That last part is inferred from CSS error recovery. If a theme colour matters to your design, restate it in a flat `#wrapper …` rule. **[verified 2026-10-14 · repo-22]**

---

### 4. Project and devlog theme: `style#game_theme`

The same 40 selector groups appear on 48/48 pages; only the values differ. The theme is flat (no nesting), uses no IDs, has a highest specificity of (0,5,1), contains 0 `var()` uses and has 8 `!important` declarations. Devlog posts get the same structure. **[verified 2026-10-14 · crawlproject-21, s04-2]** On the owner's draft project, with near-default colours, `style#game_theme` was 4,649 characters on a single line, and its draft devlog post served a block of the same length with the same background declarations **[verified 2026-10-16 · live-dom]**.

| Emitted | What to know |
|---|---|
| `:root{--itchio_ui_bg;--itchio_ui_bg_dark}` | game.css reads `--itchio_ui_bg_dark` only once, as the `.user_tools` strip background at ≤960px **[verified 2026-10-14 · crawlproject-21, s04-4]** |
| `.wrapper{10 variables; background-color:<BG>; /*! */ [background-image; background-repeat; background-position; background-attachment:fixed] /* */}` | `.wrapper` is the `#wrapper` node (`div#wrapper.main.wrapper.game_page_wrapper`). An image was set on 19/48 pages; see §8 **[verified 2026-10-14 · crawlproject-23, community-46]** |
| `.inner_column{color; font-family:<F>,Lato,LatoExtended,sans-serif; background-color:rgba(<BG2>,<alpha>)}` | This is the BG2 panel. The alpha comes from the BG2 Alpha slider: 1 on 37/48 pages, 0 on 4, and .2/.62/.75/.85/.86/.88/.95 once each. game.css's own default is `.inner_column{background:white}` **[verified 2026-10-14 · crawlproject-24]** |
| `.inner_column h1,…,.inner_column h6{font-family:inherit\|<H>; font-weight:bold\|900; color:inherit\|#hex}` | (0,1,1), so `#wrapper .formatted_description h2{…}` wins. 11/48 pages set a heading colour, 24/48 use weight 900 and 15/48 set a headings font **[verified 2026-10-14 · crawlproject-28]** |
| class `size_small/medium/large/very_large` on `.inner_column` | 11 / 13 / 16 / 19px; `very_large` drops to 16px at ≤1000px. `family_pixel` has its own sizes: 8/16/24px text, 8/24/40px headings. Seen on 48 pages: large 35, very_large 12, medium 1 [documented · crawlproject-26] **[verified 2026-10-14 · itchcss-43]**; `size_large` on the owner's draft project **[verified 2026-10-16 · live-dom]** |
| class `family_<slug>` on `.inner_column` (e.g. `family_comic-neue`, or `family_lato` for Lato **[verified 2026-10-16 · live-dom]**) + Google Fonts link(s) | see §7 **[verified 2026-10-14 · crawlproject-27, itchcss-42]** |
| `.game_frame{background:#hex; /*! */ [background-image] /* */}` and `.game_frame .embed_info{background-color:rgba(<BG2>,.85)}` | The embed background, shown behind the click-to-launch placeholder and transparent games. 5/48 pages set an image or gradient **[verified 2026-10-14 · crawlproject-29]** |
| `.view_game_page .right_col{display:block\|none}` | the Screenshots option; see below [documented · crawlproject-25] |
| literal colours: `.inner_column a, .inner_column .footer a{color:<Link>}`, `.inner_column .button, …:hover, …:active{background-color;color;text-shadow}`, `.inner_column ::selection`, `.inner_column hr`, star fill, loader bar, comment and toolbar widgets | 8 `!important` declarations: 3 on the redactor toolbar, 3 on the comment markdown toolbar, 1 `.reward_row/.bundle_row` `border-color` and 1 `.footer .svgicon, .more_information_toggle .svgicon` `fill` **[verified 2026-10-14 · s04-2]** |

**Variables don't recolour project links or buttons.**
- `#wrapper{--itchio_link_color:…}` does beat `.wrapper` on the same element. **[verified 2026-10-14 · community-46, corpus-44]**
- But the content's links and buttons get their colour from the literal rules above: `.inner_column a` (0,1,1) beats game.css's `a{color:var(--itchio_link_color)}` (0,0,1).
- A variable override therefore reaches only game.css's own consumers: 8 `var(--itchio_link_color)`, 21 `var(--itchio_button_color)` and 30 `var(--itchio_border_color)`.
- Recolour content with selectors: `#wrapper .inner_column a{color:…}`, `#wrapper .inner_column .button{…}`. [inferred · s04-2]

Some pages alias the variables on `#wrapper` (e.g. `--b:var(--itchio_bg_color)`) to follow the creator's theme in fewer characters. **[verified 2026-10-14 · community-46]**

**"Screenshots: Hidden" is desktop-only.**
- The option emits `.view_game_page .right_col{display:none}`, which is (0,2,0).
- game.css's `@media (max-width:1000px)` rule `.responsive .view_game_page .columns .right_col{display:block}` is (0,4,0), so the screenshots come back on tablets and phones.
- To hide them everywhere: `#wrapper .view_game_page .right_col{display:none}`. To keep only the trailer: `#wrapper .screenshot_list{display:none}`.
- 14/48 pages used `none` (10 HTML5 and 4 downloadable).

[documented · crawlproject-25]

**Default accent contrast.**
- The default accent `#fa5c5c` is 3.11:1 on the white panel and 2.68:1 on the `#eeeeee` page; white button text on it is also 3.11:1. On black it passes at 6.75:1.
- In 44 popular project pages, 16 had a link colour below 4.5:1 against the panel and 23 had button text below 4.5:1. 13 used `#fa5c5c`, 3 of them on a light panel, and 12 had a translucent panel, where real contrast depends on the image.

[observed · a11y-39] Fix it with ID-scoped colour rules, not variables (see above).

**Big-video layout.** It moves the trailer out of the sidebar into `div.video_embed.big_video`, between `.header_buy_row` and `.columns`; `.right_col` then holds only `.screenshot_list`. Target `#wrapper .video_embed`, not `.right_col .video_embed`. game.css's ≤1000px `.right_col .video_embed` rule doesn't apply to it either. Seen on 1 of 64 pages. **[verified 2026-10-14 · crawlproject-30]**

---

### 5. Jam overview theme: `style#jam_theme`

#### 5.1 Generated structure, and where your CSS goes

One fixed sequence of 14 rules across 42 generated themes (about 33 jams); the generated part is 1705–1921 characters. **[verified 2026-10-14 · crawljam-11, s04-1]**

| # | Rule | Contents |
|---|---|---|
| 1–2 | `:root`, `body` | `--itchio_ui_bg`; `background-color` |
| 3 | `.jam_page_wrap` (= `#wrapper`) | `color`, `background-color`, `font-family`, `font-size:N%`, 9 variables, then optional `background-image`, `background-repeat:repeat\|repeat-y`, `background-position:50% 0%\|0% 0%`, `[background-size:contain]`, `[background-attachment:fixed]` |
| 4 | `.jam_body` | `border-radius:var(--itchio_border_radius,0)` |
| 5 | `.view_jam_page h1,…,h6` | `[font-family][color]` |
| 6 | `.view_jam_page .jam_body, .view_jam_page .grid_outer` | `background-color:rgba(…,ALPHA)` (the opacity slider) |
| 7 | `.view_jam_page .jam_body` | `box-shadow` (the preset) |
| 8–14 | `.grid_outer .itch_footer`, grid text/count/footer colours, platform/genre/author colours, `.header_tabs .community_activity`, `.filter_item`, `.filter_item:hover/.active`, `.jam_filter_picker .divider` | 6 `!important` declarations |

- **Host CSS is appended inside the same element**, right after rule 14. There is no `style#custom_css` on jam pages. So equal-specificity ties go to the host's CSS. **[verified 2026-10-14 · s04-1]**
- **`@import` is dead in jam CSS.** It can't come first in the sheet, because the generated rules always precede it, and the CSS spec drops an `@import` that follows other rules. crawljam-14 records it as dead, and corpus-13 likewise limits `@import` to profiles and projects. Use the theme's font picker or `@font-face`. **[verified 2026-10-14 · crawljam-14, corpus-13, s04-1]** (mechanism from the spec)
- **Jam themes have no ID selectors.** The highest generated specificity is (0,4,1), e.g. `.view_jam_page .game_grid_widget .game_cell .game_author a`. **[verified 2026-10-14 · s04-1]**

#### 5.2 Variables

- **Where they live.** They are declared on `.jam_page_wrap`, which is the `#wrapper` element. In a harness with jam.css and real themes, `#wrapper{--itchio_link_color:#00ff00;--itchio_button_color:#0000ff;--itchio_border_radius:12px}` recoloured content and host links, the Join button and the tab underline, and rounded `.jam_body` and `.jam_submitter_widget`. **[verified 2026-10-14 · crawljam-05]**
  - `.jam_page_wrap{…}` also wins: it ties on specificity and comes later in the same sheet.
  - `:root{…}` has no effect inside the page.
  - The official guide recommends this `#wrapper` route for jams.
- **The 9 variables:** `--itchio_border_radius`, `_link_color`, `_border_color`, `_button_color`, `_button_fg_color`, `_button_shadow_color`, `_button_border_color`, `_button_hover_color` and `_button_active_color`. **[verified 2026-10-14 · crawljam-11, corpus-44]**
- **What they paint in jam.css** (partial list):

  | Variable | Paints |
  |---|---|
  | `--itchio_link_color` | `a`, `.button.outline` text, `button.textlike`, the selectize active item |
  | `--itchio_button_color` | the `.button` background, `.button.outline` borders, `.skip_to_main`, the active/hover `.header_tab` underline; fallback for hover/active |
  | `--itchio_button_fg_color` | `.button` and `.skip_to_main` text |
  | `--itchio_button_hover_color`, `--itchio_button_active_color` | `.button:hover` / `:active` background |
  | `--itchio_button_shadow_color` / `--itchio_button_border_color` | `.button` text-shadow / border |
  | `--itchio_border_color` | the `.jam_submitter_widget` border, the bottom borders of `.jam_header_widget`, `.grid_outer .header_row` and `.jam_filter_picker`, `hr`, `table`, `fieldset`, lightbox borders |
  | `--itchio_border_radius` | `.jam_submitter_widget` (fallback 4px), `.jam_body` (fallback 0) |

  [documented · crawljam-09]

#### 5.3 Literal colours and `!important`

- **Three things ignore the variables**, because the generator writes them as hex literals:
  - the `.jam_filter_picker .filter_item.active` border. It is the *link* colour, written `border-color:#… !important`, so even overriding `--itchio_link_color` doesn't move it;
  - the `.grid_outer .itch_footer` border-top;
  - the `.header_tabs .community_activity` background.

  Override them explicitly, adding `!important` where the generated rule has it. **[verified 2026-10-14 · crawljam-08]**
- **Grid text colours carry `!important`**: `.view_jam_page .game_grid_widget .game_cell .game_text / .game_platform / .game_genre / .game_author a`, the count, `.footer_submissions` and `.powerd_by`. A custom override needs `#wrapper … !important`. **[verified 2026-10-14 · crawljam-11]**
  - GMTK 2024's generated `#8c8c8c` on white is 3.36:1, so these overrides are sometimes needed for accessibility. [observed · a11y-40]
  - These rules only match the **overview's own** submissions grid, `div.grid_outer#entries`. That grid was server-rendered on 6/23 and 4/17 fetched overviews (19 cells on one of them) and absent on the rest. a11y-40 likewise found no cells on the GMTK 2024 overview.
  - Sub-pages such as `/entries` and `/results` carry none of these rules, only the six variables (§5.6), and host CSS can't reach them.

  **[verified 2026-10-14 · s04-9]**

#### 5.4 Button shades, radius, panel and shadows

- **Button shades** are derived per channel from the button colour, then hard-coded: shadow −39…−10 (or +32 on very dark buttons), hover −13…+10, active −7…+6. `--itchio_button_border_color` always equals the shadow colour (42/42 theme copies). The link colour differed from the button colour on only 2 jams (trijam-393 and wholesome-games) across the 42 copies. If you override `--itchio_button_color`, also set `_hover_color`, `_active_color`, `_shadow_color` and `_border_color`, or they keep the old shades. **[verified 2026-10-14 · crawljam-34]**
- **Radius** defaults to `--itchio_border_radius: initial`. The `var()` fallbacks then give `.jam_body` 0px and `.jam_submitter_widget` 4px. Any px value rounds both. Below 820px, jam.css forces the submitter's radius to 0. **[verified 2026-10-14 · crawljam-12]**
- **Panel opacity** is the alpha of rule 6: 1 on 39/42 themes, .9 on 1 and .86 on 2.
- **Shadow presets** go into rule 7:
  - none: `0 0 0 2px transparent`;
  - outline: `0 0 0 2px <border colour>`;
  - shadow: `…, 0 4px 12px rgba(…,.28)`;
  - glow: `…, 0 0 12px|24px rgba(…)`.

  To restyle the panel, override these two rules; your later rule wins the tie. **[verified 2026-10-14 · crawljam-13]**

#### 5.5 Fonts

- The **body font** goes to `.jam_page_wrap{font-family:<Name>,Lato,LatoExtended,sans-serif}`. The default is `Lato,Lato,LatoExtended,sans-serif`.
- The **header font** goes to `.view_jam_page h1,…,h6{font-family:<Name>}` with **no fallback stack**. When you reuse it, add your own fallbacks.
- One Google Fonts `<link>` is emitted per chosen font, after `jam_theme`. A jam that uses the same font for body and header gets two identical links.

**[verified 2026-10-14 · crawljam-14]** On a jam that set only a header font, `.jam_page_wrap` kept Lato and the Google font applied only to headings. **[verified 2026-10-14 · itchcss-42]**

#### 5.6 Jam sub-pages

`/entries`, `/results` and `/rate/<id>` carry only `:root{--itchio_ui_bg}` and `.page_widget{--itchio_link_color; _button_color; _button_fg_color; _button_shadow_color; _button_hover_color; _button_active_color}`. Everything except the link colour is copied from the overview.
- The link colour is darkened only when it is bright: an equal step is subtracted per channel until YIQ brightness ≤ 120. This matched 7 of 8 observed pairs, e.g. `#95dd49` → `#569e0a`.
- The resulting contrast on white is 3.3–4.5:1 for bright links, so it is not guaranteed ≥ 4.5:1.
- Host CSS never reaches these pages. To fix sub-page contrast, pick a darker link colour in the theme.

**[verified 2026-10-14 · crawljam-04, itchcss-01]**

---

### 6. Variable map: where each `--itchio_*` is declared

| Variable | Profile | Project / devlog | Jam overview | Jam sub-page |
|---|---|---|---|---|
| `--itchio_ui_bg` | `:root` | `:root` | `:root` | `:root` |
| `--itchio_ui_bg_dark` | — | `:root` | — | — |
| `--itchio_font_family` | `.user_page` | `.wrapper` | — | — |
| `--itchio_link_color` | `.user_page` | `.wrapper` | `.jam_page_wrap` | `.page_widget` |
| `--itchio_gray_back` | `.user_page` (user.css `:root` default `#F4F4F4`) | — | — | — |
| `--itchio_border_radius` | `.user_page` | — | `.jam_page_wrap` | — |
| `--itchio_bg_color`, `_bg2_color`, `_bg2_sub`, `_text_color` | — | `.wrapper` | — | — |
| `--itchio_border_color` | only user.css `:root` default `#dadada` | `.wrapper` | `.jam_page_wrap` (jam.css default `#dadada`) | — |
| `--itchio_button_color`, `_fg_color`, `_shadow_color` | — | `.wrapper` | `.jam_page_wrap` | `.page_widget` |
| `--itchio_button_border_color` | — | — | `.jam_page_wrap` | — |
| `--itchio_button_hover_color`, `_active_color` | — | — | `.jam_page_wrap` | `.page_widget` |
| `--itchio_grid_gap`, `_grid_cell_width`, `_grid_cell_columns` | **set by JS at runtime** on `.mode_grid .user_game_grid` and `.game_grid_widget.game_list` | — | — | — |
| `--itchio_input_focus_color` | bundle `:root` default `#361275` | same | same | same |
| **Override at** | `#wrapper .user_page{…}` (grid vars: `#wrapper .user_game_grid`) | `#wrapper{…}`, but content links and buttons are literals | `#wrapper{…}`, minus the literals in §5.3 | not possible (no custom CSS) |

Sources: **[verified 2026-10-14 · corpus-44, crawlprofile-41, crawlproject-21, crawljam-05, crawljam-11, crawljam-04, crawljam-31, a11y-15, s04-2, s04-10]** [documented · community-27] [observed · s04-6]

- `.wrapper` and `.jam_page_wrap` are the `#wrapper` node itself, so an ID rule on `#wrapper` wins outright. `.user_page` is a child, so a declaration on `#wrapper` is shadowed there. **[verified 2026-10-14 · itchcss-12, crawljam-05]**
- **Usage in the wild.** Only 11 of 62 sampled pages with custom CSS reference any `--itchio_*` variable (4 profiles, 7 projects), and none of 23 jams do. The guide recommends them for jams. [observed · corpus-35]
- **Deriving tints from theme variables.**
  - `color-mix(in oklab, var(--itchio_link_color) 70%, white)` has been Widely available since 2025-11-09. Always write the colour space. Mixes of 3+ colours are rejected by Chrome.
  - Relative colour syntax, e.g. `rgb(from var(--itchio_link_color) r g b / 40%)`, has been Baseline since 2024-09-16 (Chrome 125, Firefox 128, Safari 18). Older engines implemented a different spec, so declare a plain colour first.
  - On profiles these only resolve inside `.user_page`.

  **[verified 2026-10-14 · support-34, support-35]**
- **Dark themes:** add `#wrapper{color-scheme:dark}`. itch declares no `color-scheme`, so unstyled form controls and `light-dark()` stay light even when the OS is dark. The property inherits from `#wrapper`. itch's own `.form` inputs keep their `--itchio_*` colours. **[verified 2026-10-14 · support-59]**

---

### 7. Fonts chosen in the theme editor (all page types)

- **A Google font choice** emits `https://fonts.googleapis.com/css?family=<URL-encoded name>%3A400%2C400italic%2C700%2C700italic`. This is CSS API **v1**, requesting **only 400, 700 and their italics**, even for variable families such as Inter, Manrope, Roboto, Montserrat, Nunito or Noto Serif JP; all 73 links seen had this form. Weights 300/500/600/800/900 of the theme font are therefore synthesized or snapped to 400/700. **[verified 2026-10-14 · corpus-13, corpus-45, crawlprofile-37]** [documented · repo-63]
  - Position: between the theme block and `style#custom_css` on profiles and projects, and after `jam_theme` on jams.
  - Projects add a second link whenever a Google headings font is set, even when it is the same family as the body font. **[verified 2026-10-14 · crawlproject-27]**
- **Built-in choices emit no link:** Lato (the default, on 30/51 profiles), `sans-serif`, `serif` and Pixel (`'04b_03'`). That `serif` emits no link is inferred, since no live page used it. **[verified 2026-10-14 · crawlprofile-37]** [observed · repo-38] A draft project set to Lato (`family_lato`) had no font link either **[verified 2026-10-16 · live-dom]**.
- **Self-hosted faces.** Every bundle self-hosts only Lato and LatoExtended (400, 400 italic, 700, 900) plus `'04b_03'` and `icomoon`, with no `font-display`. Lato 700 italic and 300/500/600 are synthesized. **[verified 2026-10-14 · itchcss-41]**
- **The font stack** is always `<Font>,Lato,LatoExtended,sans-serif`: on `.user_page` (profile), `.inner_column` (project, plus class `family_<slug>`) and `.jam_page_wrap` (jam body). The jam header font has no stack (§5.5). **[verified 2026-10-14 · crawlprofile-37, itchcss-42, crawlproject-24]**
- **Other weights or variable axes:**
  - `@import` a css2 URL (e.g. `family=Syne:wght@400..800`) as the **first** statement of your CSS. This works on profiles and projects only.
  - Or use `@font-face`, which works on every page type, jams included.
  - Either way it counts against the profile's 5,120-byte cap; project CSS has no cap **[verified 2026-10-16 · live-cap-A2c, live-cap-B1]**.

  [documented · repo-63] **[verified 2026-10-14 · corpus-13]**
- **The editor's list** is `https://static.itch.io/fonts.json`: 1725 families (sans-serif 621, display 436, serif 333, handwriting 284, monospace 51), Last-Modified 2024-11-28. The editor emits only a family name. **[verified 2026-10-14 · crawlprofile-38]**

---

### 8. The background image: where it's painted and how to tune it

| Page | Element (= `#wrapper`) | What the theme emits | Seen |
|---|---|---|---|
| Profile | `.user_page_wrap` | `background-image:url(https://img.itch.zone/…/original/…)`; `background-repeat:` `repeat` (default) \| `no-repeat` \| `repeat-x`; `background-position:` `0 0` \| `50% 0` \| `100% 0`; optional `background-attachment:fixed`. BG goes on `body{background-color}`, outside `#wrapper` | image on 11/51 profiles: no-repeat 50% 0 fixed ×4, no-repeat ×1, repeat ×3, repeat fixed ×2, repeat-x 0 0 ×1 **[verified 2026-10-14 · crawlprofile-35, repo-19, localtests-54]** |
| Project / devlog | `.wrapper` | `background-color:<BG>`, then between `/*! */` and `/* */`: `background-image`, `background-repeat`, `background-position`, optional `background-attachment:fixed`. No `body` colour | 19/48: repeat 11, no-repeat 7, repeat-y 1; `50% 0` ×17, `0 0` ×2; fixed ×11 **[verified 2026-10-14 · crawlproject-23, itchcss-57]** |
| Jam overview | `.jam_page_wrap` | `background-color` and optional longhands (`repeat\|repeat-y`, `50% 0%\|0% 0%`, `contain`, `fixed`), plus `body{background-color}` | `cover` never seen in 42 themes **[verified 2026-10-14 · crawljam-11, itchcss-57]** [documented · crawljam-37] |

- **Always longhands.** The editor never emits the `background` shorthand. **[verified 2026-10-14 · itchcss-57]** The theme's longhands sit on a class (0,1,0), so `#wrapper{background-…}` longhands override them one by one, while a `#wrapper{background:…}` shorthand wipes the image. [observed · localtests-54]
- **Profile defaults** in the editor source: `{repeat:'repeat', position:'align_center'}`, where align_center → `50% 0`, align_right → `100% 0` and anything else → `0 0`. **[verified 2026-10-14 · repo-19]**
- **Below a short page.**
  - Projects: the theme sets no `body` colour, so the area below a short `#wrapper` shows game.css's `body{background:#eee}`.
  - Profiles and jams: `body` gets BG.

  **[verified 2026-10-14 · itchcss-57, itchcss-41]**
- **Tuning recipe.** Read the page's theme block first; don't assume `repeat` or `fixed`. An original example:

```css
/* cover the viewport with the creator's own image; never write `background:` on #wrapper */
#wrapper{background-repeat:no-repeat;background-size:cover;background-position:50% 0;background-attachment:fixed}
```

---

### 9. itch base CSS that custom CSS fights

#### 9.1 Profiles: `user.css`

The file is 71,824 bytes and minified. It has 31 `@media` blocks, 13 `@keyframes`, 10 `animation` and 22 `transition` declarations, and **no rule for `#wrapper` or `.mode_grid`**. **[verified 2026-10-14 · crawlprofile-48, support-52, support-58, s04-4]**

**`#wrapper` and the footer.**
- user.css sets `.user_page_wrap{display:flow-root;position:relative;padding-bottom:50px}` and an absolutely positioned footer: `.footer{position:absolute;bottom:0;left:0;right:0;border-top:1px solid #dadada;font-size:12px}`.
- Measured effects:
  - `#wrapper .footer{margin-top:48px}` changes nothing; the footer's top was identical with and without it.
  - `#wrapper{padding-bottom:0}` makes the footer overlap content by 15px.
  - `.footer{margin-bottom:20px}` moves it 20px up into content.
- To add space, give the last content block a bottom margin or increase `#wrapper`'s `padding-bottom`; the footer is about 35px tall, plus your gap.
- `#wrapper{position:static}` would let the footer escape to an ancestor.
- Never hide the footer. Its markup is `.footer > .footer_inner > a[href="https://itch.io/"]`, plus " · " and a "Community profile" link when the user has one (45/51 pages).

**[verified 2026-10-14 · crawlprofile-09, repo-24]**

**JS writes an inline `min-height` on `#wrapper`.**
- `user.min.js` (`I.UserLayout`) calls `$(".user_page_wrap").max_height(<site-header height or 0>)`.
- `bundle.min.js`'s `$.fn.max_height` then sets `min-height = window height − #wrapper's vertical padding/border/margin − offset` in px and repeats it on every resize.
- Headless DOM dumps of the live page show `<div id="wrapper" class="user_page_wrap" style="min-height: 758px;">`.
- On 2026-10-16, in a 708 px tall Brave window, the live profile had `min-height: 658px` logged out and `608px` for the owner **[verified 2026-10-16 · live-dom]**. Both fit the formula: 708 minus the 50 px bottom padding, minus the owner's 50 px site header as the offset [inferred · s04-7].
- An inline style beats `#wrapper{min-height:…}`, so add `!important` if you need another value. That consequence is inferred.

**[observed · s04-7]**

**The game grid has three layers.**

1. **user.css default.** `.game_grid_widget{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));grid-gap:25px var(--itchio_grid_gap,10px);align-items:start}`. **[verified 2026-10-14 · repo-32]**
2. **Runtime sizer, appended after your CSS (grid layout only).**
   - In May 2022 itch moved every grid to CSS grid and dropped support for centred trailing items.
   - Today `user.min.js` creates two `I.GameGridSizer`s, for `.mode_grid .user_game_grid` and `.game_grid_widget.game_list`. They use cell widths of 315 and 250px, `min_columns:2`, and a gap of 20px, or 10px when the window is under 500px wide.
   - `bundle.min.js` (`resize_cells`) appends one `<style itchio-grid-sizer>` per grid to `<head>`, after `style#custom_css`, and recomputes it on resize. Each sets `--itchio_grid_gap`, `--itchio_grid_cell_width`, `--itchio_grid_cell_columns` and `grid-template-columns:repeat(N, Wpx)`.
   - Live DOM dumps showed `repeat(4, 245px)` with a 20px gap in a wide window, and `repeat(2, 217px)` with a 10px gap in a narrow one.
   - On the live profile on 2026-10-16 both sizers followed `style#custom_css`, owner and logged out **[verified 2026-10-16 · live-dom]**.
   - The profile root carries `.user_page.mode_grid`.

   [documented · community-27] [observed · s04-6]
3. **Your rules.** The sizer's selectors are (0,2,0) and come *after* your CSS. So:
   - **Columns:** use an ID and guard with `.mode_grid`, e.g. `#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(3,1fr)}`. The guard matters because Column-layout profiles squeeze the grid into 315px. Note the sizer's `min_columns:2`: a one-column phone layout needs your own media query at ID strength. [inferred · s04-6, crawlprofile-17]
   - **Gap:** set `gap` or `column-gap` on `#wrapper .user_game_grid`, or redeclare `--itchio_grid_gap` there. A value set on `#wrapper` is shadowed, because the sizer declares the variable on the grid element itself. [inferred · s04-6]
   - **Equal-height cards:** `align-items:start` is itch's choice, not the browser default. In a test, `grid-auto-rows:1fr` alone left the cards at 305/337/353/369px; adding `align-items:stretch` made all four 369px. Keep `#wrapper .game_grid_widget{align-items:stretch}`. **[verified 2026-10-14 · repo-32]**
   - **Centred trailing row:** the admin's 2022 flexbox recipe still works, because `--itchio_grid_cell_width` is live (here with `#wrapper` added):
     ```css
     #wrapper .mode_grid .user_game_grid{display:flex;flex-wrap:wrap;justify-content:center}
     #wrapper .mode_grid .user_game_grid .game_cell{width:var(--itchio_grid_cell_width)}
     ```
     [documented · community-27]

**Column layout (`.user_page.mode_column`).**
- `.columns` is a flex row (`min-height:400px;align-items:flex-start`). `.game_column` is 315px wide with `margin-left:40px`, and own-grid cells are 315px.
- Both columns are `position:sticky;top:10px`.
- At ≤800px the columns stack (and become static), and `.user_game_grid` turns into a horizontal flex scroller.
- Guard grid CSS with `.mode_grid` or `.mode_column`, or override the column widths.

**[verified 2026-10-14 · crawlprofile-17]**

**Collection and purchase carousels.**
- Cells are a fixed 200px wide (`.game_grid_widget.game_list{display:flex}`, cells `width:200px;flex:none`).
- `.carousel_wrapper` has `overflow-x:auto`, with `scrollbar-color:var(--itchio_link_color) var(--itchio_gray_back)` and `scrollbar-width:thin`.
- `.mode_collection_grid` resets the cells to `width:auto` and makes the carousels grids capped at 20 cells.

**[verified 2026-10-14 · crawlprofile-16]**

**Card fields hidden by context.**
- Every cell contains `.game_author`. The own grid hides it (`.user_page .game_grid_widget.user_game_grid .game_cell .game_author{display:none}`), and so do `.is_owner` carousel cells. Non-owner carousel cells hide `.game_text`, `.game_genre`, `.game_platform`, `.price_flag` and `.game_promo`.
- `.is_owner` marks a project owned by the profile's owner. It is not a logged-in indicator.
- To show the author in the own grid: `#wrapper .user_game_grid .game_author{display:flex}`. Its base display is `flex`, not `block`.

**[verified 2026-10-14 · crawlprofile-14]**

**Bio typography.**
- user.css sets `.formatted p{margin:0 0 20px 0;line-height:1.5}`, `.formatted ul,.formatted ol{margin:0 0 20px 0;padding-left:2em}`, `.formatted img{max-width:100%}`, `.formatted img[width][height]{height:auto}` and `.formatted hr{border:0;height:1px;background:var(--itchio_border_color)}`. The theme then recolours that `hr`.
- `.formatted{font-size:16px}` is overridden by `.user_page .user_profile.formatted{font-size:1.1428571429em}`.

**[verified 2026-10-14 · crawlprofile-55]**

**Hover-only tools.** `.game_grid_widget .game_cell .game_cell_tools` ("Add to collection") is `opacity:0` until `.game_cell:hover`, and `display:none` at ≤650px. It appears logged out on itch's browse pages, but was absent from the profile both logged out and in the owner's export, and from the live profile in both views on 2026-10-16 **[verified 2026-10-16 · live-dom]**. Don't copy this hover-only pattern for your own content. If logged-in non-owners do get the tools on profiles (untested), card transforms or `overflow:hidden` could clip them. **[verified 2026-10-14 · a11y-37]**

**`.dark_theme` hooks.** user.css has 30 `.dark_theme …` occurrences, e.g. one that removes the thumb box-shadow. No logged-out profile body carried `.dark_theme` in 70 fetches; all carry `no_theme_toggle`. Neither did the live profile, owner (OS in dark mode) and logged out **[verified 2026-10-16 · live-dom]**. Don't rely on these hooks. [observed · crawlprofile-59] **[verified 2026-10-14 · itchcss-27]**

**Breakpoints in user.css** (`@media` block counts):

| Query | Blocks | Notable effects |
|---|---|---|
| `max-width: 650px` | 10 | `.game_cell_tools` hidden **[verified 2026-10-14 · a11y-37]** |
| `max-width: 800px` | 5 (+1 combined with 650px) | column layout stacks; own grid becomes a scroller **[verified 2026-10-14 · crawlprofile-17]** |
| `max-width: 600px` | 5 | lightbox `width:auto;max-width:none !important` **[verified 2026-10-14 · itchcss-18]** |
| 960 / 980 / 920 / 1300 (max), 960 / 1020 / 1150 / 1400 (min), print | 1–2 each | minor rules, not itemized here (print: §9.7) |

Source: **[verified 2026-10-14 · s04-4]**

**Text sizing.** itch sizes its UI text in px: user.css has 61 px font-sizes and 0 rem, with body at 14px and the footer at 12px. The browser's default-font-size setting therefore doesn't enlarge itch's text; only page zoom does. With a 32px default font, body stayed 14px and the bio 16px, while a rem-based title grew from 48 to 96px. Your `rem` values do scale with the setting. **[verified 2026-10-14 · a11y-32]**

#### 9.2 Projects and devlogs: `game.css`

The file is 164,629 bytes. Project, devlog and comments pages link only this itch stylesheet. It has **no rule using `#wrapper`, `#inner_column`, `#header` or `#game_drop`**. Its only ID selectors are `#lightbox_container` and `#lightbox_shroud`. **[verified 2026-10-14 · crawlproject-31, s04-4]**

**The content column clips.**
- `.inner_column{width:960px;margin:0 auto;position:relative;padding-bottom:40px;background:white;overflow:hidden}`.
- `.responsive .inner_column{max-width:960px;width:auto}`, which becomes `max-width:600px` (and `padding-bottom:0`) at ≤1000px. So tablets (601–1000px) get a fixed 600px column, not a fluid one.
- `.responsive .wrapper` padding is `0 20px` at ≤1000px and `0` at ≤600px.
- Box-shadows, transforms, negative margins and absolute decorations that poke out are clipped. Override with `#wrapper #inner_column{overflow:visible}` if needed, then check that the footer still fits.

[documented · crawlproject-32]

**The header clips too:** `.header{overflow:hidden}`. Scaled or rotated banners, banner shadows and absolute decorations are cut at `#header`. Use `#wrapper #header{overflow:visible}`; `#inner_column` still clips at the column edge unless it is opened as well. [documented · crawlproject-69]

**Two columns.**
- `.columns{display:flex;justify-content:center}`, `.left_col{flex:1;width:0;min-width:0}`, `.right_col{width:367px}`.
- The description has margins of 0 at the top, 20px at the sides and 40px at the bottom.
- The guide's 553px description width is 960 − 367 − 2×20, so it only holds while the sidebar is visible. Without the sidebar it is about 920px.
- Screenshots are capped by `.screenshot_list img{max-width:347px}`. Give wide description images `max-width:100%`.

[inferred · crawlproject-33]

**≤1000px is the project breakpoint.**
- `.columns` stacks, with `.right_col` (trailer and screenshots) **first** (`order:1`) and `.left_col` second (`order:2`).
- `.screenshot_list` becomes a `nowrap` horizontal scroller of 200px-tall images.
- These rules are (0,3,0) to (0,4,0).
- Max-width rules per breakpoint: 650px 33, 1000px 30, 600px 24, 960px 7, 400px 7.
- Test at 1001/1000, 650, 600 and 400px.
- Restore the desktop order on mobile with `#wrapper .columns .left_col{order:0}`, which is (1,2,0).

[documented · crawlproject-34]

**The maximized game frame.**
- `.html_embed_widget .game_frame.maximized{position:fixed;top:0;left:0;width:100% !important;height:100% !important;z-index:1000;margin:0;background-image:none}`, plus `body.frame_maximized{overflow:hidden}`.
- Any of the following on an ancestor of `.game_frame` makes that ancestor the containing block of the "fullscreen" game:
  - `filter`, `backdrop-filter`, `perspective`;
  - `transform`, `rotate`, `scale` or `translate`, or a `will-change` naming any of them;
  - `contain:layout|paint|strict|content`;
  - `content-visibility:auto`.

[documented · crawlproject-20]

- **When itch maximizes.** `enter_maximized()` runs in three cases:
  - on desktop, after "Run game" on an embed set to start maximized (`.game_frame.start_maximized`);
  - from the restore button;
  - as the fallback of `enter_fullscreen()`, used by the fullscreen button and, on a mobile user agent, by "Run game" on **every** embed. The fallback fires only when the iframe has no `requestFullscreen` method at all, vendor-prefixed ones included. Which mobile browsers reach it wasn't tested.

  When the method exists, the game goes into the browser's top layer, which ignores every ancestor. [documented · s04-gf-12] In 22 of 111 sampled HTML5 embeds the frame was `start_maximized`, and 47 had a fullscreen button. [observed · s04-gf-07]
- **What a trigger on an ancestor does, rendered.** Tested on a real HTML5 project page with itch's own scripts and a real click on "Run game", in Chrome 155 at 1280×800 and 600×800 **[verified 2026-10-14 · s04-gf-08, s04-gf-09, s04-gf-11]**:

  | Custom CSS | Frame becomes (1280 / 600 wide; tall values = this page's full height) | Effect |
  |---|---|---|
  | none | 1280×800 / 600×800 | fills the viewport, above everything |
  | `#wrapper #inner_column{backdrop-filter:blur(8px)}` | 960×8,808 at x=160 / 600×9,390 | boxed into the column and stretched to the **whole page height**. The game's own viewport becomes about 9,000px tall, so most of it is off-screen. |
  | entrance animation of `transform` on `#inner_column`, `animation-fill-mode:both` | same as the row above | `both`/`forwards` keep `transform:matrix(1,0,0,1,0,0)` after the animation ends, so the trap is permanent |
  | the same animation with no fill mode, measured after it ended | 1280×800 / 600×800 | fine: the transform is back to `none` |
  | `#wrapper .view_game_page{transform:translateY(0)}` | 960×8,752 / 600×9,231 | as for `#inner_column` |
  | `#wrapper{filter:saturate(1.2)}` | 1280×8,808 / 600×9,390 | full width but page-tall |
  | `#wrapper .embed_wrapper{will-change:transform}` | 960×**0** / 600×**0** | **the game disappears**. The frame takes 100% of an ancestor whose height came from the frame itself, and `body.frame_maximized{overflow:hidden}` locks scrolling. |
  | `isolation:isolate` or `opacity:.98` on `#inner_column`, or `#wrapper{position:relative;isolation:isolate}` | 1280×800 / 600×800 | full size, but **itch's `#user_tools` bar paints over the game**. The bar sits outside `#wrapper` at z-index 2 (99 at ≤650px); the new stacking context caps the frame's `z-index:1000` inside the column. |

  - No case was clipped by `overflow:hidden`. The damage comes from the frame resizing to its new containing block, and from stacking. This corrects the earlier "confined to, and clipped by, the column" claim. **[verified 2026-10-14 · s04-gf-08]**
  - `perspective`, `contain`, `content-visibility` and the individual `rotate`/`scale`/`translate` properties weren't rendered. They remain [documented · crawlproject-20].
  - The Fullscreen-API path stayed at 1280×800 with a `backdrop-filter` on `#inner_column` and with `will-change:transform` on `.embed_wrapper`. **[verified 2026-10-14 · s04-gf-14]**
- **How common.** In 261 sampled project pages, 111 had an HTML5 embed and 52 of those had custom CSS. None of the 52 put a static or animated trigger on an embed ancestor. Triggers on other elements were common: `transform` on 39 of them, `filter` and `will-change` on 12 each, mostly on hover states, keyframes and pseudo-elements. So the hazard is rare in the wild but severe when it hits. [observed · s04-gf-07, s04-gf-15]

**Frosted BG2 panel, safely.**
- **Put the blur on a pseudo-element, never on `#inner_column`.** Two rules make the panel:
  - `#wrapper #inner_column{isolation:isolate}`
  - `#wrapper #inner_column::before{content:"";position:absolute;inset:0;z-index:-1;backdrop-filter:blur(8px)}`

  These really blur what is behind the column: a 2px black-and-white stripe background became uniform grey 127 inside the column and stayed 0/255 outside. **Without `isolation:isolate` the pseudo-element blurs nothing.** **[verified 2026-10-14 · s04-gf-13]**
- **Release the isolation while the game is maximized.** The isolation alone still puts `#user_tools` over a maximized game (last table row), so add:

  ```css
  #wrapper:has(.game_frame.maximized) #inner_column{isolation:auto}
  #wrapper:has(.game_frame.maximized) #inner_column::before{content:none}
  ```

  With these lines the frame filled the viewport above `#user_tools` at both widths. **[verified 2026-10-14 · s04-gf-10, s04-gf-11]**
- **Without `:has()`** (Firefox before 121), write the same guard as `body.frame_maximized #wrapper #inner_column{…}`, which also passed. That selector starts outside `#wrapper` but only styles elements inside it. **[verified 2026-10-14 · s04-gf-10]**
- **Other passing options** **[verified 2026-10-14 · s04-gf-10, s04-gf-11]**:
  - skip the effect on embed pages with `#wrapper:not(:has(.html_embed_widget)) #inner_column{backdrop-filter:…}`;
  - cancel it while maximized with `body.frame_maximized #wrapper #inner_column{backdrop-filter:none}`;
  - give entrance animations on embed ancestors no fill mode.

**The "External link" badge.**
- On project pages and devlogs, game.css decorates outbound links inside user-formatted content: `.user_formatted a[rel~=nofollow]{position:relative}`, with an "External link" `::after` badge on `:hover` and `:focus`.
- Images that are *direct* children of such links get a red `box-shadow:0 0 0 5px red` ring.
- It is an anti-scam feature: never hide or restyle it away, since the guide warns that tricking visitors gets CSS access suspended. If your own `a::after` decoration collides with it, scope yours to `a:not([rel~=nofollow])`.
- Profiles (`.user_profile.formatted`, no `user_formatted` class) and jams have no such rule.

**[verified 2026-10-14 · sanitizer-08]**

**Base text.**
- game.css's `body` has only `font-size:13px;font-family:sans-serif` and `background:#eee`. Project text gets Lato from the theme's `.inner_column` stack, not from `body`.
- At ≤650px, game.css puts `.user_tools` (the `#user_tools` bar) at z-index 99.

**[verified 2026-10-14 · itchcss-41, itchcss-30]**

#### 9.3 Jam overviews: `jam.css`

- **Base styles.** The file is 71,053 bytes. `:root` defaults include `--itchio_border_color:#dadada`, `--itchio_body_color:#222` and `--itchio_input_focus_color:#361275`. The body is `font-size:16px;color:#222;background:white`, and there are utility classes `.text-center` and `.text-right`. **[verified 2026-10-14 · crawljam-31]**
- **Page and panel.**
  - `.jam_page_wrap{display:flow-root;min-height:calc(100vh - 50px)}`.
  - `.view_jam_page .jam_body{max-width:960px;margin:40px auto;overflow:hidden}`, so the panel clips like the project column.
  - At ≤650px the panel's margins drop to 10px.

  **[verified 2026-10-14 · s04-8]**
- **At ≤820px** the submitter and countdown widget stacks and loses its radius. **[verified 2026-10-14 · crawljam-12, s04-8]** Other `@media` widths in jam.css: 650 (15 blocks), 600 (11), 960, 980, 920, 800, 700, 1300 and print. **[verified 2026-10-14 · s04-4]**
- **The site header is before `#wrapper`.** The overview renders itch's full site header (`div.jam_layout_header_widget.header_widget.gray`), painted from `--itchio_ui_bg`. Unscoped rules leak into it, which is one more reason to scope everything under `#wrapper`. **[verified 2026-10-14 · community-26]**
- No External-link badge rule exists in jam.css. **[verified 2026-10-14 · sanitizer-08]**

#### 9.4 `!important` inventory (all bundles and themes)

These are the declarations an ID selector alone can't beat. Fight them with `#wrapper … !important`, and only where you must; among important declarations, specificity decides again.

| Source | Count | Declarations |
|---|---|---|
| user.css | 7 | `.user_page .purchased_games h2 a, .user_page .collection_row h2 a{color:inherit}` · `.game_grid_widget .game_cell a.meta_tag{color:white}` · `.game_grid_widget .game_cell .meta_tag .sale_tag.reverse_sale{background:#fe4e50}` · `.header_widget.mobile_nav_visible .primary_header{padding-left:5px}` · at ≤600px `#lightbox_container .lightbox:not(dialog){width:auto;max-width:none}` (2) · `[class^="icon-"],[class*=" icon-"]{font-family:'icomoon'}` |
| game.css | 12 | the 6 shared rules above (meta tag, reverse sale, header padding, 2 × lightbox, icon font) + `.inner_column .footer .breadcrumbs a{color:inherit}` · `.community_post_list_widget .community_post .post_votes a{color:inherit}` · `.game_community_preview_widget .community_topic_row .topic_author a{color:inherit}` · `.form.buy_form_widget .checkout_btn .icon{font-size:19px}` · `.html_embed_widget .game_frame.maximized{width:100%;height:100%}` (2) |
| jam.css | 7 | the 6 shared + `.jam_submitter_widget .countdown *{border-color:inherit}` |
| `user_theme` | 0 | — |
| `game_theme` | 8 | redactor toolbar (3), comment markdown toolbar (3), `.reward_row/.bundle_row` `border-color`, `.footer .svgicon/.more_information_toggle .svgicon` `fill` |
| `jam_theme` (generated) | 6 | grid text/count/footer colour, platform/genre/author/powered-by colour, `.itch_footer` border-top, `.filter_item` colour, `.filter_item:hover/.active` colour + border |

Sources: **[verified 2026-10-14 · itchcss-18, s04-1, s04-2, s04-3, s04-4, crawljam-11]**

Example: collection-row headings need `#wrapper .collection_row h2 a{color:…!important}`, because user.css forces `color:inherit !important`. [inferred · itchcss-18]

#### 9.5 z-index ladder

| z-index | Element |
|---|---|
| 1002 | `.popup_details` (game.css) |
| 1001 | `#lightbox_container`, `.lightbox` |
| 1000 | `.skip_to_main`, `#lightbox_shroud`, maximized `.game_frame` |
| 999 | `.content_warning_widget` |
| 250 / 102 / 101 / 100 / 99 | site-header menus, flash messages, tooltips, the sticky header, header dropdown |
| 99 | `.user_tools` at ≤650px (game.css, project pages) |
| 3 | `.game_header_widget` (project owner bar) |
| 2 | `.user_tools` |

**[verified 2026-10-14 · itchcss-30]** In the bundles these are class selectors (`.user_tools`, not `#user_tools`). Keep decorative layers at negative or small z-index inside an isolated `#wrapper` (`#wrapper{position:relative;isolation:isolate}`), so they never cover itch's UI. [inferred · itchcss-30]

**HTML5 project pages need a release.** The isolation also traps the maximized game's `z-index:1000`, so itch's `#user_tools` bar, outside `#wrapper`, paints over the running game. Add `body.frame_maximized #wrapper{isolation:auto}`, which restored the game above the bar at 1280 and 600px. **[verified 2026-10-14 · s04-gf-09, s04-gf-11]**

The same happened with `opacity:.98` plus `isolation:isolate` on `#inner_column` **[verified 2026-10-14 · s04-gf-09]**. Any other stacking context on an embed ancestor, such as a positioned element with a z-index, should behave alike unless its z-index exceeds the bar's (2, or 99 at ≤650px). [inferred · s04-gf-09] See §9.2.

#### 9.6 Focus styles

- **itch keeps the UA outline and only recolours it.** `:root{--itchio_input_focus_color:#361275}` plus `:focus{outline-color:var(--itchio_input_focus_color)}`, so every focused link computes `outline: auto 1px rgb(54,18,117)`. **[verified 2026-10-14 · a11y-15]**
  - **Buttons are separate:** `.button:focus{outline-color:#361275}` is hard-coded (white under `.dark_theme`), so overriding the variable doesn't recolour button rings.
  - The variable is white inside `.header_widget.gray` (and under `body.dark_theme` in main.css).
  - `.form input[type=range]:focus` gets `outline:2px solid var(--itchio_input_focus_color)`.
- **Where itch removes outlines:** `.button.disabled:focus`, `.user_formatted .spoiler:focus`, `.form .selectize-input:focus`, the comment markdown textarea (which gets an inset box-shadow instead), `.forms_color_input_widget input.color_text_input` (always), and a collections-page live-edit input in main.css. **[verified 2026-10-14 · a11y-15]**
- **The same focus rules are in all three creator bundles.** user.css, game.css and jam.css each carry the same seven `:focus` outline rules: `.button`, `.dark_theme .button`, `.button.disabled`, `.user_formatted .spoiler`, `:focus`, range input and selectize. game.css adds the comment textarea. One fix therefore serves every page type. **[verified 2026-10-14 · s04-gf-06]**
- **Dark themes break it.** `#361275` is 1.29:1 on BG `#0b1433`, 1.14:1 on `#222` and 1.5:1 on black, all far below the 3:1 minimum for focus indicators. **[verified 2026-10-14 · s04-5]**
  - Recolouring alone is not enough. `#wrapper :focus{outline-color:<light colour>}` does win on specificity: (1,1,0) beats `:focus` (0,1,0) and `.button:focus` (0,2,0). But it keeps the browser's thin `auto 1px` ring, which itch's `overflow:hidden` boxes cut on every game title. It also leaves spoilers and disabled buttons with no ring at all, and the jam's "Add to collection" control invisible (table below). **[verified 2026-10-14 · s04-gf-01, s04-gf-06]**
  - Redeclaring `--itchio_input_focus_color` on `#wrapper` recolours everything that reads the variable, but not `.button` rings.
  - Never add a global `outline:none`. A creator `outline:none !important` can't be undone by a later non-important rule (gapfill01-13).
- **`:focus-visible`:** exactly one rule across user, game, jam and main.css (the game.css video facade). **[verified 2026-10-14 · a11y-14]**

**Canonical focus block (profile, project, devlog and jam pages).** Use this one block instead of the shorter recipes found elsewhere in this knowledge base:

```css
#wrapper{--focus-ring:#ffc857;--itchio_input_focus_color:var(--focus-ring)}
#wrapper :focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}
#wrapper :is(.game_cell,.header_tabs,.screenshot_list,.breadcrumbs) :focus-visible{outline-offset:-2px}
#wrapper .game_cell{position:relative}
#wrapper .game_cell:has(:focus-visible)::after{content:"";position:absolute;inset:0;z-index:1;
  pointer-events:none;border:3px solid var(--focus-ring);border-radius:inherit}
#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}
```

What each line does:
1. **The variable.** One colour for everything. The itch variable keeps range inputs and other `var()` readers in step.
2. **One ring for every stop.** The `:focus-visible` rule draws a solid ring on links, `.button`, disabled buttons and `.spoiler[tabindex]`. Your ID selector beats itch's `outline:0` rules, which are (0,3,0).
3. **Inset rings where itch clips.** Line-clamped game titles, the card thumbnail, the jam header tabs (a scroller at ≤600px), the project screenshot strip (≤1000px) and the project breadcrumbs all have `overflow` set. A ring drawn inside the element survives that.
4. **A card ring that is never cut.**
   - It is drawn as an overlay border, because an outline on `.game_cell` gets cut by profile carousels. An inset outline doesn't work either: it is painted under the `position:relative` thumbnail.
   - `.game_cell` is `position:static` in all three bundles, and the cell tools (where present) are positioned against `.game_thumb`. So `position:relative` on the card moves nothing.
   - The ring keys on `:has(:focus-visible)`, so a mouse click shows no ring.

   **[verified 2026-10-14 · s04-gf-03, s04-gf-04, s04-gf-05, s04-gf-06]**
5. **Visible cell tools.** This line reveals the hover-only "Add to collection" control when it, or anything else in the card, has focus.

- **Colour.** Pick `--focus-ring` with ≥3:1 against every surface it lands on. Gold `#ffc857` gives 11.75:1 on `#0b1433` and 10.34:1 on `#222`, but **only 1.54:1 on white and 1.33:1 on `#eee`**. On light pages use a dark ring instead, which is what itch's own `#361275` already is (14:1 on white). **[verified 2026-10-14 · s04-gf-16]**
- **Older browsers.** If `:has()` is unsupported (Firefox before 121), the browser drops only the overlay rule; links keep their inset ring. [inferred]
- **If your own design already uses `.game_cell::after`,** move the ring to `::before` or to the card's `box-shadow`. [inferred]

**How the recipes in this knowledge base compare.** Each recipe was pasted into the custom-CSS slot of three logged-out page copies run against itch's real bundles, with scripts stripped:
- profile (user.css): 140 Tab stops, incl. collection carousels;
- jam overview with an entries grid (jam.css): 60 stops;
- HTML5 project page (game.css): 305 stops, with a spoiler and a disabled `.button` added.

Every Tab stop inside `#wrapper` was checked at 1280px and 600px. Counts below are at 1280px; extra failures at 600px are noted. **[verified 2026-10-14 · s04-gf-01, s04-gf-02, s04-gf-05]**

| Recipe (where it appeared) | Stops with no ring | Rings cut by itch's `overflow` | Focusable but invisible | Card ring after a mouse click |
|---|---|---|---|---|
| none (itch default `auto 1px #361275`) | spoiler (jam, project), disabled button (project) | game titles: 63 profile (+7 in carousels), 16 jam; breadcrumbs 4. At 600px also jam header tabs 4 and project screenshots 1. | 16 "Add to collection" (jam) | — |
| `#wrapper :focus{outline-color:…}` (old §9.6 and §10 here) | same as none | same as none | 16 | — |
| `#wrapper :is(a,.button):focus-visible{3px, offset 3px}` (06 §7, 09 #109) | spoiler (jam, project) | titles 62 + carousels 8 (profile); titles 16 + tools-in-thumbnail 16 (jam); breadcrumbs 4 | 16 | — |
| `a:focus-visible` + `.game_cell:focus-within` ring (07 §7.6, 09 #110) | spoiler (jam, project) | as above, plus the **card ring cut by profile carousels at 114 stops**. At 600px it is also cut by the column-layout grid scroller (10). | 16 | **yes** |
| variable + `.button/.spoiler` rule + `.game_cell:has(:focus-visible)` at offset 3px (10 §8.2–8.3) | 0 | titles (thin ring) 63 / 16; **card ring cut in carousels at 114 stops**. At 600px also the grid scroller (10). | 16 | no |
| `a, .button, summary, .spoiler` rule + `:focus-within` tools (01, jam) | 0 | titles 62 + carousels 8 (profile), 16 (jam); breadcrumbs 4; at 600px jam tabs 4 and project screenshots 1 | 0 | no card ring |
| **canonical block above** | **0** | **0** | **0** | **no** |

In itch's horizontal scrollers, focusing a title scrolls the link into view, not the whole card. So for 32 of 140 profile stops (59 at 600px) part of the card stays scrolled out, and so does that side of its ring. That comes from itch's scrolling, not from a cut. **[verified 2026-10-14 · s04-gf-03]**

The synthetic page from s10-16, extended with a collection row and a jam grid card, gave the same computed rings with user.css, game.css and jam.css. **[verified 2026-10-14 · s04-gf-06]** Not covered: logged-in-only controls (the comment form, owner bars), Firefox and Safari, and real screen-reader or high-contrast runs.

#### 9.7 What itch does not do

- **No `prefers-reduced-motion`, `forced-colors`, `prefers-contrast` or hover/pointer media queries** in user, game, jam or main.css. **[verified 2026-10-14 · a11y-14]**
  - user.css still defines 13 `@keyframes` with 10 `animation` and 22 `transition` declarations, and `theme_editor.css` has no reduced-motion query either.
  - If you add motion, add your own `@media (prefers-reduced-motion: reduce){#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}` or a narrower variant.

  **[verified 2026-10-14 · support-52]** [observed · support-58]
- **No `@layer`, `@supports`, `@container`, `:has()`, `color-scheme`, `light-dark()` or `backdrop-filter`** in user.css. Theme and base rules are unlayered, so an unlayered custom rule never loses to a layer. **[verified 2026-10-14 · support-52]**
- **No automatic dark mode.**
  - There is no `prefers-color-scheme` in any bundle.
  - Logged-out creator pages (profile, project, devlog, jam overview) carry `body.no_theme_toggle` and never `dark_theme`, and itch's page scripts never add it. So a visitor's OS dark mode doesn't change a themed page.
  - For variants, write your own `@media (prefers-color-scheme: …)` under `#wrapper`. Whether a logged-in visitor's site dark mode affects creator pages is untested. The owner's own logged-in views of a draft project, of its draft devlog post and of the profile, with the OS in dark mode, also had `no_theme_toggle` and no `dark_theme`; the account's site-theme setting wasn't recorded **[verified 2026-10-16 · live-dom]**.

  **[verified 2026-10-14 · itchcss-27]**
- **Print:** `@media print` only hides `.header_widget`, plus two lightbox resets in game.css. Add your own `@media print` under `#wrapper` if print matters, e.g. to drop fixed backgrounds and animations. **[verified 2026-10-14 · itchcss-50]**

---

### 10. Selector strength: what it takes to win

| Opponent | Its strength | What wins |
|---|---|---|
| Base bundle rules | no IDs except `#lightbox_*`; at most about (0,6,0) in user.css and game.css and (0,5,1) in jam.css **[verified 2026-10-14 · s04-4]** | any `#wrapper …` selector |
| Generated theme rules | no IDs; up to (0,4,1) on profiles, (0,5,1) on projects and (0,4,1) on jams **[verified 2026-10-14 · itchcss-04, s04-2, s04-1]** | any `#wrapper …` selector |
| `!important` in a bundle or theme (§9.4) | important | `#wrapper … !important` |
| Inline `style=""` (e.g. the runtime `min-height` on profile `#wrapper`, seen live owner and logged out, and the one on project `#inner_column` seen in an owner view **[verified 2026-10-16 · live-dom]**) | inline | `!important` [observed · s04-7] |
| Runtime grid sizer (profiles) | (0,2,0), placed **after** your CSS | anything above (0,2,0), e.g. `#wrapper .mode_grid .user_game_grid` [inferred · s04-6] |
| Equal specificity | — | your CSS: it comes last on profiles and projects, and is appended after the generated rules on jams. The profile grid sizer is the exception **[verified 2026-10-14 · external-02, docs-55, s04-1]** |
| Theme variables | declared on `.user_page` (profile) or on `#wrapper` itself (project, jam) | redeclare on the same element or a descendant **[verified 2026-10-14 · itchcss-12, crawljam-05]** |
| Literal theme colours | (0,1,1)–(0,5,1) class selectors | an ID-scoped colour rule; variables won't do it **[verified 2026-10-14 · repo-21, s04-2]** |

A compact, rule-abiding override set for a dark profile (original example):

```css
#wrapper{color-scheme:dark;background-size:cover;background-attachment:fixed} /* longhands only */
#wrapper .user_page{--itchio_link_color:#ffc857;--itchio_gray_back:#161f3e}   /* var consumers */
#wrapper .user_page a,#wrapper .game_title a{color:#ffc857}                    /* theme literals */
#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(3,1fr);align-items:stretch}
/* focus: paste the canonical block from §9.6 (--focus-ring:#ffc857 suits this dark theme) */
```

Don't shorten the focus part to `#wrapper :focus{outline-color:…}`. That recolours the ring but leaves spoilers and disabled buttons ringless, and title rings cut (§9.6). **[verified 2026-10-14 · s04-gf-01]**

---

### 11. Pre-flight checklist for an AI writing itch CSS

1. **Identify the page type.** It tells you the bundle (§1), where the variables live (§6) and where your CSS ends up. On jam sub-pages, nothing you write applies.
2. **Read the live theme block** (`style#user_theme`, `#game_theme` or `#jam_theme`), or ask the creator for BG, BG2, Text, Link, the font and the background settings. The editor won't show you the derived alphas and shades (§3.4).
3. **Check whether a theme-editor option already does it** (§2): background fit and fixed attachment, fonts, radius, BG2 alpha, jam panel opacity and shadows.
4. **Prefix everything with `#wrapper`.** Use `!important` only against §9.4 and inline styles. Never use the `background` shorthand on `#wrapper`.
5. **Profiles:** override variables on `#wrapper .user_page`, and recolour the literal theme selectors. Size the grid with `#wrapper .mode_grid .user_game_grid` and keep `align-items:stretch`.
6. **Projects:** recolour links and buttons with selectors, not variables. Remember that "Hidden" screenshots return at ≤1000px.
   - On HTML5 pages, keep `filter`, `transform`, `backdrop-filter`, `will-change` and fill-mode entrance animations off `#wrapper`, `#inner_column`, `.view_game_page` and `.embed_wrapper`.
   - Release any `isolation` or `opacity` on them while the game is maximized.
   - Otherwise the "fullscreen" game is resized to the page height, disappears, or sits under itch's tool bar (§9.2).
7. **Jams:** put fonts in the picker or in `@font-face` (never `@import`), and override the literal and `!important` grid colours explicitly.
8. **Add reduced-motion, focus, contrast and `color-scheme` fixes.** itch provides none. For focus, paste the canonical block from §9.6, with a `--focus-ring` colour of ≥3:1 on your surfaces.
9. **Test logged out, at the breakpoints:**
   - profile: 800 and 650px, and below 500px (the sizer gap changes);
   - project: 1001/1000, 650, 600 and 400px;
   - jam: 820 and 650px.

---

### Section notes

New checks made while writing this section, on 2026-10-14. **No new itch requests** were made: every check re-read logged-out copies that other passes of this session had already fetched with curl (13:06–13:22 UTC) or dumped with headless Edge (13:09–13:11 local).
- Checks s04-1 to s04-7 are reproducible with `knowledge/evidence/section04-tools/s04_checks.py`: `python -I s04_checks.py <RAW_DIR> [<dom dump> …]`. The file inputs are listed in its docstring.
- s04-8 to s04-10 are grep one-liners over the same copies:
  - `grep -o '[^{}]*\.jam_page_wrap[^{}]*{[^}]*}' jam.css`
  - `grep -l 'class="[^"]*grid_outer' ov_*.html`
  - `grep -o -- '--itchio_input_focus_color:[^;}]*' {user,game,jam,main}.css`
- Raw copies stay in the session scratchpad only (`scratchpad/section04/raw/`, copied from `itchcss-v2/raw/`, `community-verify2/static/` and `themeitchcss/raw/`). The script's output is in `scratchpad/section04/out/s04_checks.txt`.

**The checks:**
- **s04-1: jam host CSS location** (jam_lve, jam_gdev10, jam_gmtk25 overviews, `?1791981660`).
  - None of the pages has a `style#custom_css`.
  - `style#jam_theme` holds the 14 generated selectors (6 `!important`, 1733–1877 characters, no ID selectors, max specificity (0,4,1)) and then the host's CSS: 0, 1806 and 5152 characters respectively.
  - On gdev10 the host part starts with an `@import` that follows the generated rules, and the theme's Google Fonts `<link>` comes after `</style>`.
- **s04-2: project theme literals** (x-moon, deltarune, a third project, plus one devlog post, which was checked ad hoc and had 8 `!important` and 0 `var()`).
  - `style#game_theme` has 40 rules, 0 `var()`, 8 `!important` and 0 ID selectors; the max specificity is (0,5,1).
  - The link colour appears as a literal in `.inner_column a,.inner_column .footer a`, `.inner_column .button…`, `::selection`, the toolbar, star and loader rules.
  - game.css `var()` consumers: `--itchio_link_color` 8, `--itchio_button_color` 21, `--itchio_border_color` 30, `--itchio_ui_bg_dark` 1 (`.user_tools` at ≤960px). The base rule is `a{color:var(--itchio_link_color,#da2c49)}`.
- **s04-3: profile theme format** (mirokshi.itch.io, which belongs to this knowledge base's maintainer, and leafo.itch.io, itch's founder).
  - One line each (966 and 785 characters), 0 newlines, 24 and 20 `": "` pairs, 0 `!important`, 0 ID selectors.
  - leafo's block contains an empty `.user_page_wrap{}`.
- **s04-4: bundle scan** of user.css (71,824 B, md5 `2a073ae4…`), game.css (164,629 B, md5 `c97fee7b…`) and jam.css (71,053 B, md5 `49c29ed1…`). All three have Last-Modified Tue, 06 Oct 2026 21:47:49 GMT.
  - ID selectors in all three: only `#lightbox_container` and `#lightbox_shroud`.
  - `!important`: 7, 12 and 7, matching itchcss-18 rule by rule.
  - `@media` blocks: user.css 31 (650px ×10, 800px ×5, 600px ×5, …), game.css 69 and jam.css 39 (650px ×15, 600px ×11, 820px ×2, …).
  - The max specificity of a non-ID selector was computed with a rough regex.
- **s04-5: contrast arithmetic** (WCAG 2 relative luminance in Python). `#361275` gives 1.29:1 against `#0b1433`, 1.50 against `#000`, 1.14 against `#222`, 14.0 against `#fff` and 12.06 against `#eee`.
- **s04-6: runtime grid sizer.**
  - Source, from the `bundle.min.js` and `user.min.js` fetched at 13:06 UTC:
    - `setup_grid` creates `I.GameGridSizer` for `.mode_grid .user_game_grid` (default `expected_size` 315) and for `.game_grid_widget.game_list` (`expected_size:250`), both with `min_columns:2` and `cell_margin` = 10 when `$(window).width()<500`, else 20.
    - `resize_cells` computes N = max(min_columns, ceil((width + gap)/(size + gap))) and the cell width. The `<style itchio-grid-sizer>` element was confirmed in source.
  - Headless-Edge DOM dumps of mirokshi.itch.io in a wide and a narrow window (files `mirokshi_live_1400.html` and `mirokshi_live_420.html`) contain two `<style itchio-grid-sizer>` blocks after `style#custom_css`, with `repeat(4, 245px)` at a 20px gap and `repeat(2, 217px)` at a 10px gap.
  - Tagged "observed" because the dumps were re-read here, not re-rendered.
- **s04-7: inline `min-height` on profile `#wrapper`.**
  - `user.min.js`: `UserLayout` → `$(".user_page_wrap").max_height($(".header_widget").outerHeight(!0)||0)`.
  - `bundle.min.js`: `$.fn.max_height` sets `css("min-height", $(window).height() − (outerHeight(true) − height()) − offset + "px")` and binds it to `resize`.
  - Both DOM dumps show `style="min-height: 758px;"` on `div#wrapper.user_page_wrap`.
- **s04-8: jam.css panel rules** (grep on the jam.css copy).
  - `.jam_page_wrap{display:flow-root;min-height:calc(100vh - 50px)}` and `.view_jam_page .jam_body{max-width:960px;margin:40px auto;…;overflow:hidden}`.
  - At max-width 650px the margins become 10px.
  - At max-width 820px, `.jam_submitter_widget{display:block;…;border-radius:0}`.
- **s04-9: where the jam grid rules can match.** Checked by grepping `class="…grid_outer…"` and `class="…game_cell…"` in the jam pages fetched earlier in this session (`crawljam/raw`, `crawljam-verify2/raw`, `itchcss-v2/raw`).
  - The overview renders `div.grid_outer#entries` (header row "Submissions", filter picker, cells) on 6/23 and 4/17 overviews, e.g. tuesday-the-13th-jam with 19 cells.
  - It is absent on lve-jam-2026-b-side, gmtk-2025, gdevelop-big-game-jam-10 and metroidvania-month-34; there `grid_outer` appears only inside the theme CSS.
  - The sub-pages `/entries`, `/results` and `/rate/<id>` (mm34, gmtk-2025) have a 252-character `jam_theme` holding only `:root` and `.page_widget` variables, with no `.game_text` rule.
- **s04-10: focus variable defaults.** `grep -o -- '--itchio_input_focus_color:[^;}]*'` over user, game, jam and main.css:
  - Each defines `#361275` (twice) plus `white` (once, or twice in main.css).
  - Each has `:focus{outline-color:var(--itchio_input_focus_color)}`.

**Conflicts resolved:**
1. **How many stylesheets a profile loads.** support-58 says profiles load `user.css` + `theme_editor.css`, based on the owner's logged-in June export. itchcss-01 and itchcss-51 found only `user.css` on 15 logged-out pages, and s04-3 agrees. Resolution: `theme_editor.css` is owner-only. On 2026-10-16 the live profile linked one itch stylesheet logged out and two for the owner (live-dom), which fits; which two was not recorded.
2. **"Minified" vs "compact".** localtests-08 calls `user_theme` "served minified"; repo-22 says it is compact template output. s04-3 shows one line with spaces after the colons, so the section says *compact, single line*.
3. **When `.user_page_wrap{}` appears.** crawlprofile-35 says the background longhands appear "only when an image is set", while localtests-08 saw an empty `.user_page_wrap {}` only in a June export. s04-3 shows the empty block live today (leafo). Resolution: the rule is always emitted; the longhands only with an image.
4. **Project contrast fixes.** a11y-39 suggests fixing contrast "via the theme variables (`#wrapper{--itchio_link_color}`) or ID-scoped colour rules". community-46 and corpus-44 show the variable override does win on `#wrapper`, but s04-2 shows content links and buttons are literal colours in `game_theme`. The section therefore recommends ID-scoped colour rules for project content.
5. **Copy/Paste theme.** docs-43 says the jam editor is "the same theme editor UI" as profiles and projects; repo-40 finds copy/paste only in the `JamEdit` package. Resolution: the feature is jam-only.
6. **Jam fonts.** itchcss-42 says "the picked Google font is a heading font", while crawljam-14 and docs-43 list both body and header pickers. On gdevelop-big-game-jam-10 only a header font had been chosen. Resolution: both pickers exist.
7. **Font-link position.** It comes before `custom_css` on profiles and projects (crawlprofile-37, crawlproject-27, docs-55). On jams it comes after `style#jam_theme`, which already contains the host CSS (corpus-13, s04-1).
8. **Version stamps.** crawlprofile-48, crawljam-31 and itchcss-01 quote different `?<number>` values. Per community-51, crawlproject-64, repo-65 and a11y-59, the stamp is site-wide and took three different values on 2026-10-14 while the files stayed byte-identical. The section cites no stamp as a version.
9. **`--itchio_grid_gap` set on `#wrapper`.** The fallback `var(--itchio_grid_gap,10px)` in user.css suggests it can be set from `#wrapper`. On live pages, though, the runtime sizer declares the variable on the grid element itself (s04-6), so the section tells authors to set it on `#wrapper .user_game_grid`. This consequence is inferred, not rendered.
10. **Where jam grid colours apply.** a11y-40 says the generated `!important` grid colours "show on grid pages (entries/results)". crawljam-04 and s04-9 show that sub-pages carry only six variables. Resolution: the rules apply only to the overview's `#entries` grid, when the overview renders one. a11y-40's contrast measurement of the generated colours still stands.
11. **Focus recipes.** The recipes disagreed across sections:
    - 04 §9.6/§10 used `:focus{outline-color}`;
    - 06 §7 and 09 #109 used `:is(a,.button):focus-visible`;
    - 07 §7.6 and 09 #110 used a `.game_cell:focus-within` card ring;
    - 10 §8.2–8.3 used the variable, a `.button/.spoiler` rule and `.game_cell:has(:focus-visible)` at offset 3px, tested on game.css only;
    - 01 had a jam-only snippet.

    s04-gf-01 to s04-gf-06 ran all of them on real profile, jam and project markup with each page's own bundle. Every one left at least one class of failure: no ring, a ring cut by itch's `overflow`, an invisible control, or a card ring after a mouse click. Resolution: §9.6's canonical block, which had none. The other sections should point to it (see `evidence/gapfill.md`, "Gap fill for 04", follow-ups).
12. **Maximized-frame hazard.** crawlproject-20 inferred from MDN that a containing-block trigger on an embed ancestor would confine the game frame and get it clipped by the column. The rendered test (s04-gf-08 to s04-gf-11) confirms the confinement, but the effect is different: no clipping, a page-tall frame (or a 0-height one with `will-change` on `.embed_wrapper`), plus a stacking-context problem that wasn't predicted (`#user_tools` over the game). The pseudo-element recipe needs a "release while maximized" guard. §9.2 and §9.5 now carry the measured results.

**Gap-fill checks (2026-10-14, retry pass).** **No itch requests.** Everything ran offline in headless Chrome 155.0.8059.79 (`--host-resolver-rules` mapping every host but 127.0.0.1 to NOTFOUND, plus `CDP_BLOCK_ITCH=1`). The inputs were logged-out copies fetched earlier in this session:
- leafo's profile, the bubblejam overview and the game-28 HTML5 project;
- user.css, game.css and jam.css with the md5 values of s04-4;
- itch's `lib`, `bundle` and `game.min.js`.

Pages are built by `knowledge/evidence/gapfill-s04-tools/build_pages.py`. Full method and outputs are in `knowledge/evidence/gapfill.md`, "Gap fill for 04".
- **s04-gf-01: existing recipes, real pages.** `focus_matrix.mjs` with variants V0–V4 and V9, a Tab walk over every stop inside `#wrapper`, at 1280px and 600px. A probe measures each ring against every clipping ancestor.
- **s04-gf-02: the canonical block.** `focus_matrix.mjs` V8: no ringless, cut or invisible stop on any page at either width.
- **s04-gf-03: scrolled-out cards.** `scroller_detail.mjs` shows that the remaining "partial" card rings come from cards partly scrolled out of itch's carousels and grid scroller, not from cuts.
- **s04-gf-04: screenshots** (`focus_shots.mjs`, viewed):
  - an inset outline on `.game_cell` is hidden under the thumbnail;
  - the `::after` overlay is fully visible;
  - the 10 §8.3 ring at offset 3px is cut on two sides by a profile carousel.
- **s04-gf-05: mouse click on a card title.** `:focus-within` shows the card ring (solid 3px); `:has(:focus-visible)` and the overlay don't.
- **s04-gf-06: three bundles, one fix.** Three parts:
  - a grep of the `:focus` outline rules in user, game and jam.css: identical;
  - `focus3x.mjs` + `focus3x.html`, i.e. s10-16's page plus a collection row and a jam grid card, run against all three bundles;
  - `probe_cellpos.mjs`: `.game_cell` is `static` on all 67 profile and 16 jam cards, and the tools' offsetParent is `.game_thumb`.
- **s04-gf-07: embed census.** `embed_risk_scan.py` over 261 unique project pages: 111 HTML5 embeds, 22 `start_maximized`, 47 with a fullscreen button, 52 with custom CSS, and 0 with a trigger on an embed ancestor.
- **s04-gf-08: maximize with triggers.** `maximize.mjs` G0–G5 renders the real "Run game" click path and measures the containing block, the frame rect and the corner hits; screenshots were viewed.
- **s04-gf-09: stacking.** `maximize.mjs` G9 and G10: an `isolation` or `opacity` stacking context puts `#user_tools` over the game.
- **s04-gf-10: guarded recipes** (`maximize.mjs`): G6 pseudo-element recipe, G7 `:not(:has())` guard, G8 cancel on `body.frame_maximized`, G11 release on `body.frame_maximized`.
- **s04-gf-11: more variants** (`maximize_r.mjs`):
  - G12: an entrance animation without a fill mode is fine after it ends;
  - G13: `#wrapper` isolation released on `body.frame_maximized`;
  - G14: the pseudo-element recipe released with `#wrapper:has(.game_frame.maximized)`;
  - G15: an embed transform guarded with `:not(:has(.maximized))`.
- **s04-gf-12: when itch maximizes.** Read from `game.min.js` and `bundle.min.js`: `load_iframe_btn` → fullscreen on a mobile UA, maximized if `start_maximized`. `enter_fullscreen()` falls back to `enter_maximized()` only when `request_fullscreen()` finds no method. `is_mobile` is a user-agent regex.
- **s04-gf-13: blur.** `blur_check.mjs` reads the pixels of a 2px stripe background behind the column: unchanged with no blur and with the pseudo-element minus isolation; uniform 127 with `backdrop-filter` on the column and with the isolated pseudo-element.
- **s04-gf-14: Fullscreen API.** `fullscreen_api.mjs`: `requestFullscreen()` on the iframe was granted, and the frame was 1280×800 with and without the triggers.
- **s04-gf-15: animated triggers.** `embed_anim_scan.py`: 0 embed pages animate a trigger on an embed ancestor. On any selector, 39 of the 52 use `transform`, 12 `filter`, 12 `will-change`, 7 `translate` and 1 `scale`. It's a regex parse, so declarations of a native-nesting parent rule are missed.
- **s04-gf-16: contrast** (WCAG 2 luminance in Python):
  - `#ffc857` against `#fff`, `#eee`, `#222`, `#0b1433` and `#000`: 1.54, 1.33, 10.34, 11.75 and 13.65;
  - `#361275` against `#fff` and `#0b1433`: 14.0 and 1.29.
