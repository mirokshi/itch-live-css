## Gotchas (symptom → cause → fix)

Every item below has three parts:

- **Symptom**: what you, the creator or a visitor actually sees.
- **Cause**: the mechanism, with evidence tags.
- **Fix**: what to write instead.

Tags read `[confidence · fact-id]`. Evidence was checked on **2026-10-14** unless a tag carries another date. Confidence levels: *verified* (reproduced by a test or live observation), *documented* (itch docs, staff posts, specs, source code), *observed* (seen live, not systematically), *community* (third-party reports only), *inferred* (deduced from verified facts). Conventions:

- **The box** means the theme editor's Custom CSS textarea.
- **Chrome** means Chrome 155; some lab tests ran in Chromium 152. Firefox and Safari were not tested unless a tag says so.
- All code is short, original example code.

### If you read only ten

| # | Trap | Item |
|---|---|---|
| 1 | Writing any selector that does not start with `#wrapper` | 2 |
| 2 | Using the `background` shorthand on `#wrapper` (it erases the theme image) | 19 |
| 3 | Putting an `@import` anywhere but the very top, or in jam CSS at all | 47, 48 |
| 4 | Overriding only `--itchio_link_color` and expecting links to change | 8, 9 |
| 5 | Pasting unminified CSS into a profile. Budget: ≤ 5,120 UTF-8 bytes after trimming leading and trailing whitespace, comments included. | 40, 42, 44 |
| 6 | Authoring HTML classes without the `custom-` prefix | 62 |
| 7 | Putting `transform`/`filter`/`backdrop-filter` on `#wrapper` when fixed layers exist | 22, 23 |
| 8 | Styling `.formatted_description` on a profile or devlog (it doesn't exist there) | 74 |
| 9 | Infinite animations with an incomplete reduced-motion guard | 112, 113 |
| 10 | Checking the result while logged in as the owner | 88 |

| Group | Items |
|---|---|
| A. Access, scope and policy | 1–7 |
| B. Cascade and specificity | 8–18 |
| C. Backgrounds, layout, stacking, overflow | 19–39 |
| D. The CSS box: size, storage, saving | 40–46 |
| E. `@import`, external hosts and fonts | 47–61 |
| F. HTML in bios and descriptions (sanitizer) | 62–73 |
| G. Page-type surprises | 74–88 |
| H. Syntax that fails silently | 89–97 |
| I. Browser support | 98–103 |
| J. Accessibility | 104–117 |
| K. Testing, tooling and research | 118–124 |

---

### A. Access, scope and policy

**1. There is no "Custom CSS" field.**
- *Symptom:* Edit theme opens with no Custom CSS textarea (it would sit in a "Misc" group near Save), or the Edit theme button itself is missing.
- *Cause:*
  - CSS is off by default. Staff enable it by hand, per account [documented · docs-01].
  - The theme editor renders the field only when the server sends `can_use_css` [documented · community-48, repo-64].
  - Edit theme opens from the page itself while logged in as owner, not from the dashboard [community · docs-04].
  - Users report the button disappears on narrow windows and phones [community · community-03].
- *Fix:*
  - Before writing CSS, ask whether the user already has access.
  - If not, they must email support@itch.io from the account's address, or go through https://itch.io/support. The message should cover four points: the theme editor can't do it; what will change; the page stays accessible; itch's built-in UI is left alone [documented · docs-02]. Empty accounts are refused [documented · docs-03].
  - Don't use the editor's README popup link "send us a message": it resolves to `<user>.itch.io/support`, a 404 [community · docs-04].
  - Reported waits range from 30 minutes to more than two months [community · community-02].
  - On a phone, try desktop-site mode in landscape. Opening the page with `#edit_theme` in the URL should toggle the editor for the owner, but this is untested [inferred · community-49].
  - Without access, only bio/description HTML with `custom-` classes and whitelisted inline styles is available [documented · sanitizer-49].

**2. Unscoped rules restyle itch itself.**
- *Symptom:* a font, colour or `img` rule also changes the jam site header, the floating Follow button (`#user_tools`), lightboxes or the owner's header bar.
- *Cause:*
  - itch serves box CSS verbatim and globally. It never adds, checks or rejects a `#wrapper` prefix [verified · docs-19, crawlprofile-28, crawlproject-48].
  - In a test, an unscoped `img{max-width:5px}` shrank the jam header's logo [verified · crawljam-16]. A creator's `body` font changed itch's UI instead of the profile [community · community-21].
  - The site header, `#user_tools` and dialogs live outside `#wrapper` [documented · docs-09; verified · crawlprofile-19].
- *Fix:*
  - Start every selector with `#wrapper `, or nest everything inside one `#wrapper{…}` block (item 14).
  - Never write bare `html`, `body`, `:root`, `*`, `a`, `img`, `.header`, `.header_widget` or `.user_tools`.
  - Staff have said CSS access may be removed for CSS that "messes with the site UI" [documented · docs-10, community-23].
  - 87.5% of live top-level selectors are unscoped [verified · corpus-16]. That shows itch tolerates it, not that it is allowed.

**3. A pasted community theme or framework leaks.**
- *Symptom:* after pasting a GitHub theme or `@import`ing a framework, itch UI outside the page changes. In one case, the whole site loses its scrollbar.
- *Cause:*
  - Only 1 of 11 sampled public theme files scopes most of its selectors. One sets `html, body{overflow-x:hidden;scrollbar-width:none;touch-action:pan-y}`, another uses 23 `!important` [verified · community-39].
  - Imported frameworks such as Bootstrap, normalize.css and Tailwind CDN builds style `html`, `body`, `*` and `button` document-wide. `layer()` only lowers their priority [inferred · external-44].
- *Fix:*
  - Prefix every selector with `#wrapper `.
  - Turn `body` background rules into `#wrapper` longhands (item 19).
  - Drop the `!important`s that an ID prefix makes unnecessary.
  - Re-minify and re-measure (item 40).
  - Host only pre-scoped framework builds.

**4. Hiding or faking itch UI is a policy breach, not a style choice.**
- *Symptom:* nothing visibly breaks. The risk is losing CSS access or the account.
- *Cause:*
  - The guide marks `.footer` links "do not hide" [documented · docs-11].
  - Tricking visitors gets CSS access, and maybe the account, suspended [documented · docs-10].
  - ToS §3 bans "misrepresenting itch.io's interface" [documented · docs-12]. The quality guidelines ban impersonating other creators or stores [documented · docs-13]. Together these rule out CSS-built fake modals, consent dialogs and click-capturing layers [documented · docs-50].
  - The forum calls hiding a download button "an exploit" [community · community-24].
  - The "External link" badge and click-to-activate embeds are anti-scam features [documented · docs-14, sanitizer-39].
  - Jam main pages have no `.footer`. Their only itch branding is `#entries .itch_footer` ("powered by itch.io") [verified · docs-53]. Treating it like the footer is inference [inferred · crawljam-24].
- *Fix:*
  - Restyle colour, type, spacing and borders only.
  - Never apply `display:none`, `visibility:hidden`, `opacity:0`, off-screen positioning or a covering overlay to `.footer`, `.itch_footer`, buy/download rows, "More information", `.embed_preload` or the external-link badge.
  - Decorative overlays get `pointer-events:none` and a z-index below content.

**5. Your `a::after` swallows itch's "External link" warning.**
- *Symptom:* on a project or devlog page, hovering or focusing an outbound description link shows your glyph inside a red, absolutely positioned box. itch's warning text is gone.
- *Cause:*
  - game.css has `.user_formatted a[rel~=nofollow]:hover::after` and `:focus::after` with `content:"External link"`, a red background and `position:absolute`, plus a red ring on images that are direct children of the link [verified · sanitizer-08].
  - A `#wrapper … a::after{content:…}` rule replaces the text but keeps the red box [verified · itchcss-46].
  - user.css and jam.css have no such rule [verified · sanitizer-08].
  - itch adds the `rel` even when it strips a fragment, `javascript:`, `tel:`, `data:`, upper-case-scheme or leading-space `href`, so dead links can carry the badge too [observed · sanitizer-45; verified 2026-10-16 · live-l03, live-l05 to live-l08, live-l11]. A relative `href` is dropped without adding a `rel` on a project description [verified 2026-10-16 · live-l04].
- *Fix:* decorate with `::before`, or exclude outbound links. Never set `content:none` or `display:none` on those pseudo-elements [inferred · docs-59].
  ```css
  #wrapper .formatted_description a:not([rel~=nofollow])::after{content:" \2192" / ""}
  ```

**6. CSS used as a visitor beacon.**
- *Symptom:* nothing visible. It is a ToS and privacy problem.
- *Cause:*
  - Each `url()` and `@import` is a request. Chrome sends your host the visitor's IP, User-Agent, client hints, Accept-Language and a Referer [verified · external-31].
  - itch pages use `no-referrer-when-downgrade`, so an `@import` from the box reveals the full itch page URL, query included [verified · external-32].
  - A `SameSite=None; Secure` cookie set on the stylesheet response was sent back later, even when another top-level site imported the sheet (Chrome defaults) [verified · external-47].
  - ToS §3 forbids "harvesting or collecting information about others" [documented · external-33].
- *Fix:* no analytics, logging or cookies on CSS endpoints, and no `:hover{background-image:url(beacon)}` pings.

**7. Declaring variables on `:root` recolours itch's header.**
- *Symptom:* on a jam page, itch's site header bar turns your colour. Elsewhere, a recoloured header gets blamed on CSS.
- *Cause:*
  - `--itchio_ui_bg` lives on `:root`, and only itch's site header reads it. The theme derives it from BG as about 20% BG + 80% `#333`, truncated per channel [verified · community-26, crawlprofile-34].
  - On jams your CSS shares one stylesheet with the theme, so a later `:root{--itchio_ui_bg:#f00}` wins. In a test it turned the header red [verified · crawljam-42].
  - Without any custom CSS, the theme's BG setting already tints that header [verified · community-26].
- *Fix:*
  - Never declare variables on `:root` or `html`.
  - Put overrides on `#wrapper` (jam, project) or `#wrapper .user_page` (profile, item 9).
  - Leave `--itchio_ui_bg` alone.

---

### B. Cascade and specificity

**8. Changing `--itchio_link_color` doesn't recolour links or buttons (project, profile).**
- *Symptom:* the variable computes to your colour, but links, buttons and game-card titles keep the theme colour.
- *Cause:*
  - The project theme also writes literal colours: `.inner_column a,.inner_column .footer a{color:#…}` and `.inner_column .button`, `:hover` and `:active` with `background-color`, `color` and `text-shadow`. These beat game.css's `a{color:var(--itchio_link_color,…)}`. Tested: the vars resolved, while `.buy_btn` and links kept theme colours [verified · itchcss-13; inferred · crawlproject-22, docs-56].
  - The profile theme hardcodes `.user_page a,.footer a{color}` and `.game_grid_widget .game_cell .game_title a.title{color}` [verified · repo-21].
  - Jams are the exception. Since 2026-06 the jam theme colours links and buttons only through the variables [verified · crawljam-05, itchcss-14].
- *Fix:* override the selectors themselves.
  ```css
  #wrapper .inner_column a,#wrapper .user_page a,#wrapper .game_title a{color:#ffc857}
  #wrapper .inner_column .button,#wrapper .inner_column .button:hover{background-color:#ffc857;color:#0b1433;text-shadow:none}
  ```

**9. A variable set on `#wrapper` is ignored on profiles.**
- *Symptom:* `#wrapper{--itchio_link_color:red}` changes nothing on a profile.
- *Cause:*
  - The profile theme declares `--itchio_font_family`, `--itchio_link_color`, `--itchio_gray_back` and `--itchio_border_radius` on `.user_page`, a child of `#wrapper`. Children inherit from the nearest declaration, whatever its specificity [verified · itchcss-12, localtests-06, repo-20].
  - Even when overridden correctly, these variables reach only user.css consumers (carousel scrollbars, some links), not the theme's literal colours [verified · crawlprofile-41].
  - `--itchio_text_color`, `--itchio_bg2_color` and the button variables exist only on project pages [verified · corpus-44].
- *Fix:* `#wrapper .user_page{--itchio_link_color:#ffc857}`, plus explicit selector rules (item 8).

**10. A `#wrapper` rule loses to an itch `!important`.**
- *Symptom:* DevTools shows your rule crossed out by an itch rule with lower specificity.
- *Cause:*
  - **Project theme:** toolbar hover colours, `.view_game_page .reward_row,.bundle_row{border-color}` and `.footer .svgicon, .view_game_page .more_information_toggle .svgicon{fill}` are `!important` [verified · itchcss-16, docs-17].
  - **Jam theme:**
    - `.game_text`, `.game_count` and `.footer_submissions` colours.
    - `.game_platform`, `.game_genre`, `.game_author a` and `.powerd_by` colours.
    - `.jam_filter_picker .filter_item` with `:hover` and `.active`, including a border-color that is the link colour written as a literal.
    - The `.grid_outer .itch_footer` border-top [verified · crawljam-07, crawljam-08, itchcss-15].
  - **Profile theme:** none [verified · docs-58].
  - **user.css:** forces `.user_page .collection_row h2 a,.user_page .purchased_games h2 a{color:inherit!important}` [verified · crawlprofile-53, itchcss-17].
  - **game.css:** has `!important` on `.footer .breadcrumbs a`, two community `color:inherit` rules and `.game_frame.maximized` sizes [verified · itchcss-18].
  - Tested: `#wrapper .game_cell .game_text{color}` stayed the theme colour until `!important` was added [verified · crawljam-07].
- *Fix:* use `!important` for exactly those properties. For collection headings, colour the `h2` and let the link inherit.

**11. An inline `style` attribute beats every `#wrapper` rule.**
- *Symptom:* `#wrapper .game_thumb{background-color:transparent}` or `#wrapper .game_frame{width:100%}` does nothing.
- *Cause:* itch writes inline styles:
  - `.game_thumb{background-color:#xxxxxx}` on about 93% of profile cards [verified · crawlprofile-12].
  - `.game_frame` width and height [verified · crawlproject-17].
  - Comment avatar `background-image` and rating `.star_fill` width [verified · itchcss-19].
- *Fix:* add `!important` only for those properties. Cover `<img width height>` attributes are presentational, so plain CSS overrides them [verified · repo-34].

**12. Rules in an `@import`ed sheet lose ties to the box.**
- *Symptom:* your external service's rule shows as overridden by the same selector in the box.
- *Cause:*
  - Imported rules count as written at the `@import`, which comes before the box's own rules [verified · localtests-01, repo-13, external-11, itchcss-09].
  - They still come after the theme `<style>`, so they beat theme rules of equal specificity [verified · localtests-02].
  - Order: nested imports < the importing sheet < later sibling imports < the box's own rules [verified · localtests-03].
- *Fix:* make external selectors strictly more specific, for example `.custom-x.custom-x`, `h1.custom-title` or `#wrapper#wrapper` [verified · localtests-05, repo-13]. `!important` in the import also wins [verified · localtests-04].

**13. `@layer` (including Tailwind v4 output and `@import … layer(x)`) makes your CSS lose.**
- *Symptom:* even `#wrapper#wrapper a.x` inside a layer loses to itch's `.user_page a`.
- *Cause:*
  - Unlayered normal declarations beat layered ones whatever their specificity, and itch's user.css is entirely unlayered [verified · localtests-16, support-37, external-12, support-52].
  - Layered `!important` reverses this and wins [verified · external-49].
  - Even unlayered, a Tailwind utility (0,1,0) loses to `.user_page a` (0,1,1) on specificity [verified · localtests-16].
- *Fix:* never wrap overrides in `@layer`. Emit unlayered CSS with `#wrapper` prefixes.

**14. `@scope (#wrapper)`, `:where(#wrapper)` and `&` inside `@scope` throw away the ID.**
- *Symptom:* `@scope (#wrapper){ .x{…} }` loses to the theme's `.user_page .x`.
- *Cause:*
  - Inside `@scope`, `.x` weighs (0,1,0) and `&` behaves as `:where(:scope)` (0). Only `:scope .x` adds (0,1,0) [verified · localtests-45, support-14].
  - `:where(#wrapper) .x` is (0,1,0) [verified · localtests-05].
- *Fix:* use nesting. `#wrapper{ .x{…} }` keeps (1,1,0), exactly like `#wrapper .x` [verified · localtests-07, support-15].

**15. Your profile grid columns snap back.**
- *Symptom:* `.mode_grid .user_game_grid{grid-template-columns:…}` works briefly, then itch's columns return.
- *Cause:* itch's JS appends `<style itchio-grid-sizer>` to `<head>` after `style#custom_css`. It sets `grid-template-columns:repeat(N, Wpx)` and `--itchio_grid_cell_width` on `.mode_grid .user_game_grid` (0,2,0) and rebuilds it on resize [inferred · community-47; documented · community-27].
- *Fix:* `#wrapper .user_game_grid{grid-template-columns:…}`. The ID wins. You can also read `var(--itchio_grid_cell_width)`.

**16. An animation or an `@supports` override does nothing.**
- *Symptom:* the element doesn't move, or the new value never applies.
- *Cause:*
  - `animation` is a list. A second rule setting `animation` on the same element replaces the whole list [verified · repo-45].
  - An `!important` on the animated property (yours or the theme's) beats the running animation [verified · localtests-24].
  - An `@supports(…){ span{--i:…} }` block adds no specificity, so earlier `span:nth-child(n){--i:n}` rules keep winning [verified · localtests-53].
- *Fix:*
  - Add extra motion on a parent: animate a registered custom property and read it in the child [verified · repo-45].
  - Remove `!important` from animated properties.
  - Inside `@supports`, match the specificity you want to replace.

**17. The theme's variables are on a different element on each page type.**
- *Symptom:* a variable override copied from a jam tutorial does nothing on a profile, or the reverse.
- *Cause:* theme variables are declared on different elements [verified · corpus-44]:
  - Project: `.wrapper`, the same element as `#wrapper`.
  - Profile: `.user_page`, a child of `#wrapper`.
  - Jam: `.jam_page_wrap`, the same element as `#wrapper`.
  - All page types: `--itchio_ui_bg` on `:root`.
- *Fix:* jam and project take `#wrapper{--…}`, profile takes `#wrapper .user_page{--…}`. Check which variables exist before using them.

**18. Equal-specificity overrides behave differently on jams.**
- *Symptom:* on a jam a plain `.view_jam_page .jam_body{…}` rule wins, but on a profile the same pattern loses.
- *Cause:*
  - On jams your CSS sits at the end of the same `<style id="jam_theme">` as the theme, so it wins equal-specificity ties [verified · crawljam-06, crawljam-01].
  - On profiles and projects, `style#custom_css` is the last stylesheet in `<head>`, so it also wins ties [verified · crawlprofile-22, crawlproject-36]. Lower specificity still loses there (item 8).
- *Fix:* always prefix with `#wrapper`. The guide asks for it, and it beats every non-`!important` itch rule on content. itch's base CSS has no IDs except the lightbox ones [verified · itchcss-03].

---

### C. Backgrounds, layout, stacking, overflow

**19. `background:` on `#wrapper` erases the theme's background image.**
- *Symptom:* the uploaded panel image, and its grain or detail, disappears and leaves a flat colour.
- *Cause:*
  - The theme writes the image as longhands on the very element you are styling: `.user_page_wrap` on profiles, `.wrapper` on projects (between `/*! */` markers) and `.jam_page_wrap` on jams. All three are the `#wrapper` element [verified · repo-18, crawlproject-23, crawljam-10, itchcss-57].
  - The shorthand resets `background-image` to `none`, and the ID wins [verified · itchcss-20, localtests-18].
  - Even `.user_page_wrap{background:…}` in the box wipes it: same specificity, later sheet [verified · localtests-18].
- *Fix:*
  - Use longhands only.
  - The shorthand is fine on pseudo-elements, and on `#wrapper` only when you deliberately replace the image. itch's own jam migration example does that [verified · crawljam-10].
  ```css
  #wrapper{background-repeat:no-repeat;background-size:cover;background-position:center;background-attachment:fixed}
  ```

**20. A light-grey band appears under a short project page.**
- *Symptom:* below the content of a short project page, the viewport shows `#eee` instead of the theme colour.
- *Cause:* project themes set no `body` colour, so body keeps game.css's `#eee`. `#wrapper` has `min-height:0` [verified · itchcss-37]. Profile and jam themes do set `body{background-color}` [verified · docs-58, docs-27].
- *Fix:* `#wrapper{min-height:100vh}`. Don't style `body`, which is outside `#wrapper` [inferred · crawlprofile-50].

**21. A jam `body{background:…}` rule shows nothing.**
- *Symptom:* a background copied from a pre-2026 jam tutorial is invisible.
- *Cause:* since the 2026-06-01 revamp, `.jam_page_wrap` (= `#wrapper`) paints its own background on top of `body`. `body` still receives the BG colour, but your image rules hide behind it [verified · docs-27; documented · crawljam-17].
- *Fix:* put background longhands on `#wrapper` (item 19).

**22. A `position:fixed` backdrop or star layer scrolls with the page, or is sized to a box.**
- *Symptom:* `#wrapper::before{position:fixed;inset:0}` covers only `#wrapper`'s box, or moves when you scroll.
- *Cause:* an ancestor with any of the following becomes the containing block for fixed descendants:
  - `transform` (even `translateZ(0)`), or `translate`/`rotate`/`scale` (even identity values)
  - `filter` (even `blur(0)`), `backdrop-filter`, `perspective`
  - `will-change:transform`, `contain:paint|layout`, `content-visibility:auto`
  - an animation with fill-mode holding a transform

  These do **not** trap fixed descendants: `opacity`, `isolation`, `mix-blend-mode`, `clip-path`, `overflow:clip`, `mask-image`, `container-type:inline-size` [verified · localtests-37, support-32, support-53].
- *Fix:* keep all of these off `#wrapper`, `.user_page` and `#inner_column`. Put entrance animations and tilts on inner elements such as the header and the bio.

**23. The HTML5 game's fullscreen button shows a clipped game.**
- *Symptom:* clicking itch's maximize button leaves the game inside the 960px column, cut off.
- *Cause:*
  - Maximizing uses `.html_embed_widget .game_frame.maximized{position:fixed;top:0;left:0;width:100%!important;height:100%!important;z-index:1000}` [documented · crawlproject-20].
  - Any trigger from item 22 on `#wrapper`, `#inner_column`, `.view_game_page` or `.embed_wrapper` confines it, and `#inner_column{overflow:hidden}` clips it [documented · crawlproject-32; inferred · crawlproject-70].
  - A frosted `backdrop-filter` on `#inner_column` is one such trigger [verified · crawlproject-24].
- *Fix:* blur a pseudo-element behind the content, or exclude embed pages. Then click fullscreen to test.
  ```css
  #wrapper:not(:has(.html_embed_widget)) #inner_column{backdrop-filter:blur(8px)}
  ```

**24. A `position:fixed; z-index:-1` layer is invisible.**
- *Symptom:* your full-screen decoration never shows, even though DevTools says it's there.
- *Cause:* without a stacking context on `#wrapper`, the layer paints behind `#wrapper`'s own background, which is the theme image [verified · localtests-39, repo-46].
- *Fix:*
  ```css
  #wrapper{position:relative;isolation:isolate}
  #wrapper::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none}
  ```

**25. A decorative layer covers the Follow button or other itch UI.**
- *Symptom:* the top-right "Follow" button can't be clicked, or your layer paints over it.
- *Cause:*
  - `#wrapper` is `position:relative; z-index:auto`, so it creates no stacking context. A fixed z-index 5000 layer covered `#user_tools` (z-index 2) [verified · itchcss-29, crawlprofile-60].
  - On Column-layout profiles the sticky columns trap layers placed inside them, but `#wrapper::before/::after` still escape [verified · itchcss-56].
  - itch's z-indexes: `#user_tools` 2, owner bar 3, header menus 99–250, maximized game and `#lightbox_shroud` 1000, lightboxes 1001 [verified · itchcss-30].
- *Fix:* `#wrapper{isolation:isolate}`, `pointer-events:none` on decorations, and keep the top-right corner clear. WCAG 2.4.11 also forbids hiding a focused control under an author layer [inferred · a11y-47].

**26. Shadows, tilts, glows and focus rings are cut off.**
- *Symptom:* a lifted card's shadow or a rotated banner is sliced at the column or panel edge.
- *Cause:*
  - Project `.inner_column{overflow:hidden}` and `.header{overflow:hidden}` [documented · crawlproject-32, crawlproject-69; verified · itchcss-35].
  - Jam `.view_jam_page .jam_body{overflow:hidden}` [verified · crawljam-26].
  - Profile `.game_thumb` (overflow:hidden) [verified · crawlprofile-56] and `.game_title` (2-line clamp) [verified · a11y-17].
- *Fix:* keep effects inside the padding, or set `#wrapper #inner_column{overflow:visible}` and `#wrapper #header{overflow:visible}`, then re-check the footer (item 29). Use `overflow:clip` when you still need clipping (item 27).

**27. `position:sticky` doesn't stick.**
- *Symptom:* a sticky element in a project description scrolls away. Or, after adding a horizontal-scroll guard, sticky elements anywhere stop working.
- *Cause:*
  - The project `#inner_column{overflow:hidden}` makes the column the scroll ancestor [verified · itchcss-36].
  - `overflow-x:hidden` on `#wrapper` computes `overflow-y:auto`, turning it into a scroll container (`#wrapper` scrollHeight 823 vs clientHeight 59 in a test) [verified · localtests-29].
- *Fix:* use `#wrapper #inner_column{overflow:clip}` and `#wrapper{overflow-x:clip}`. Both keep clipping without creating a scroller [verified · itchcss-36, localtests-29].

**28. Phones scroll sideways although nothing visibly overflows.**
- *Symptom:* a horizontal scrollbar or "wiggle" on mobile.
- *Cause:*
  - `clip-path` only clips painting. A tall rotated pseudo-element still counts as scrollable overflow (+90px at 375px in a test) [verified · localtests-27, support-30, repo-43].
  - `overflow-y:clip` leaves the x axis visible. A 0-width grid column still added +9px [verified · localtests-28].
- *Fix:* `overflow:clip` (both axes) on the windowing element, plus `#wrapper{overflow-x:clip}` as a global guard.

**29. The footer overlaps content, or `margin-top` on it does nothing.**
- *Symptom:* the itch.io footer sits on top of your last block, or adding space above it fails.
- *Cause:*
  - **Profile:** user.css sets `.user_page_wrap{display:flow-root;position:relative;padding-bottom:50px}` and `.footer{position:absolute;bottom:0;left:0;right:0}` [verified · crawlprofile-09, itchcss-21]. In renders, `margin-top` on `.footer` changed nothing, `margin-bottom` pushed the footer up into the content, and `padding-bottom:0` made it overlap by 15px [verified · repo-24].
  - **Project:** `.inner_column .footer{position:absolute;bottom:0}` sits in the 40px bottom padding above 1000px [documented · crawlproject-35].
- *Fix:* add space with `margin-bottom` on the last content block or a larger `#wrapper` `padding-bottom` (the footer is about 35px tall). Never hide the footer (item 4).

**30. Footer text is unreadable on a dark profile.**
- *Symptom:* the " · " separator and the footer border are dark on dark.
- *Cause:* the theme sets text colour and font only on `.user_page`. `.footer` is its sibling, so it keeps `#222` Lato 12px. Only its links get the link colour [verified · itchcss-22, repo-23].
- *Fix:* `#wrapper .footer{color:#c9d3ef;border-color:#2a3a6a}`

**31. Game cards have uneven heights.**
- *Symptom:* cards in one row end at different heights.
- *Cause:*
  - itch sets `.game_grid_widget{display:grid;…;align-items:start}` in user.css and jam.css [verified · repo-32, crawljam-45].
  - A creator who deleted an explicit `align-items:stretch` "because stretch is the default" brought the bug back [verified · repo-57].
- *Fix:* [verified · repo-33]
  ```css
  #wrapper .game_grid_widget{align-items:stretch;grid-auto-rows:1fr}
  #wrapper .game_cell{display:flex;flex-direction:column}
  #wrapper .game_cell_data{flex:1 0 auto}
  ```

**32. A grid rule also turns collection carousels into grids, or gets squeezed into 315px.**
- *Symptom:* the horizontal "collections" or "Supported by" strips become grids, or your 4-column grid is crushed.
- *Cause:*
  - Carousels reuse `.game_grid_widget` (`.game_list` inside `.carousel_wrapper`) [verified · crawlprofile-15].
  - On Column-layout profiles (`.user_page.mode_column`), your own games sit in a 315px side column. At ≤800px that column stacks and the grid turns into a horizontal scroller [verified · crawlprofile-17, a11y-33].
- *Fix:* target `#wrapper .user_game_grid`, and guard with `.mode_grid` or `.mode_column` when the layout matters [inferred · crawlprofile-51].

**33. Cards collapse before covers load, or `img[src]` selectors miss.**
- *Symptom:* cards jump in height while loading, or styles keyed on `[src]` never apply.
- *Cause:* in the server HTML, cover `<img>`s carry only `data-lazy_src` with `width=315 height=250`, and itch's JS sets `src` later [verified · crawlprofile-11]. Jam grid images are the same [observed · crawljam-33].
- *Fix:* keep the 315:250 box [verified · crawlprofile-56]. Never select by `[src]`.
  ```css
  #wrapper .game_thumb{aspect-ratio:315/250}
  #wrapper .game_thumb img{width:100%;height:100%;object-fit:cover}
  ```

**34. `container-type:size` makes a block vanish.**
- *Symptom:* after enabling container queries, the bio or a card collapses to 0px.
- *Cause:* size containment ignores content height, so an auto-height block computes 0px [verified · localtests-38].
- *Fix:* use `container-type:inline-size` for width-based `@container` queries.

**35. "Screenshots: Hidden" comes back on phones.**
- *Symptom:* the theme option hides screenshots on desktop only.
- *Cause:* the theme writes `.view_game_page .right_col{display:none}` (0,2,0). game.css at ≤1000px writes `.responsive .view_game_page .columns .right_col{display:block}` (0,4,0) [documented · crawlproject-25].
- *Fix:* `#wrapper .view_game_page .right_col{display:none}`, or keep the trailer and hide only `#wrapper .screenshot_list`.

**36. The layout breaks at tablet and phone widths.**
- *Symptom:* a desktop-perfect page looks wrong between 600px and 1000px.
- *Cause:*
  - **Projects at ≤1000px:** `.inner_column` shrinks to max 600px, columns stack with screenshots first, and `size_very_large` text drops from 19px to 16px [documented · crawlproject-32, crawlproject-34; verified · itchcss-38].
  - **Jams:** between 651px and 960px `.jam_body` has 0 side margin, so its corners and shadow touch the screen edge [verified · crawljam-47].
  - **Projects:** `#user_tools` becomes a static strip at ≤960px and a 50px fixed bottom bar (z-index 99) at ≤650px [verified · itchcss-32].
- *Fix:*
  - Test at 1001/1000, 961/960, 651/650, 601/600 and about 400px.
  - Restore desktop column order with `#wrapper .columns .left_col{order:0}` if needed [documented · crawlproject-34].
  - Put no custom `position:fixed; bottom:0` element on phones.

**37. Edge cards look like trapezoids, or the fade-in replays on hover-out.**
- *Symptom:* 3D hover tilts deform the outer cards, and a card's entrance animation runs again when the pointer leaves.
- *Cause:* one `perspective` on the whole grid puts the vanishing point at the grid centre. An entrance `@keyframes` animation on the hovered card restarts when its `animation` value changes [observed · repo-48].
- *Fix:* use per-card `transform:perspective(800px) rotateY(…)` or a 2D lift, build hover effects as transitions, and keep entrance animations off the hovered element [observed · repo-48].

**38. A "fixed" background scrolls on iPhone and iPad.**
- *Symptom:* `background-attachment:fixed` (from the theme or your longhands) does nothing on iOS, and `cover` over-zooms the image.
- *Cause:* iOS Safari recognises `fixed` but ignores it [documented · a11y-43].
- *Fix:* for a truly viewport-fixed backdrop, use a fixed pseudo-element layer (item 24).

**39. Custom text ignores the creator's font-size setting.**
- *Symptom:* the theme's font size slider changes itch's text but not yours.
- *Cause:*
  - **Profiles:** the theme sets `.user_page{font-size:N%}` (75–175% seen) over a 14px body [verified · crawlprofile-39, itchcss-43].
  - **Projects:** the theme adds `.inner_column.size_small|medium|large|very_large` (11, 13, 16, 19px) [verified · itchcss-43; documented · crawlproject-26].
  - In both cases `px` and `rem` values don't follow these settings.
- *Fix:* size custom text in `em` inside `#wrapper`.

---

### D. The CSS box: size, storage, saving

**40. Profile CSS over 5,120 bytes won't save.**
- *Symptom:* Save fails on a long profile stylesheet. A lightbox says "We encountered an error", then "css: expected empty, or text between 1 and 5120 characters", then "Your changes were not saved, please try again". Nothing is saved: the page keeps its previous CSS, never a truncated copy [verified 2026-10-16 · live-cap-A1].
- *Cause:*
  - An itch admin said the profile limit is "5kb", that raising it is "Probably not" happening, and that resources should be linked rather than embedded [documented · repo-60, docs-32].
  - The cap is 5,120 **UTF-8 bytes**, checked after trimming leading and trailing whitespace, comments included: 5,120 ASCII characters save and 5,121 don't; 2,603 `é` (5,120 bytes) save and 2,604 (5,122 bytes) don't, although the message says "characters" [verified 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a to live-cap-A3c].
  - Creators cite 5,120 characters [community · community-06], which is right only for ASCII. The largest live profile sheet is 5,116 characters [observed · crawlprofile-27, corpus-05].
  - The textarea has no `maxLength`, so the browser won't stop you; the check runs server-side, at save [documented · repo-04; inferred · community-04].
  - So non-ASCII costs more than it looks: one live sheet is 1,765 characters but 1,767 bytes, and it is the 1,767 that counts [observed · crawlprofile-27].
  - The official guide states no limit [verified · docs-38].
- *Fix:*
  - Paste minified CSS (item 44 lists the minifier settings that are safe).
  - **Budget: ≤ 5,120 UTF-8 bytes after trimming leading and trailing whitespace, comments included** [verified 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a to live-cap-A3c]. The boundary is exact, so a spare margin is optional; a creator's build script keeps 30 [community · community-06]. Measure with the snippet in `01-how-it-works.md` §3, which trims trailing whitespace the way itch does, and read its byte count. The two counts are equal for ASCII-only CSS. With non-ASCII, the byte count is higher [verified · gapfill09-01], and it is the one itch checks [verified 2026-10-16 · live-cap-A2c].
  - **Write non-ASCII characters raw, not as `\hex` escapes. Raw is smaller in every unit a cap could use** [verified · gapfill09-01]:

    | Whole rule `#wrapper .custom-x::before{content:"…"}` holding ten mixed characters (`→★ñ¡é·…✓日😀`) | Characters | UTF-8 bytes | UTF-16 units |
    |---|---|---|---|
    | Characters written raw | 48 | 65 | 49 |
    | Characters escaped (`\2192\2605\f1…\1f600`) | 81 | 81 | 81 |

    - An escape costs 1 + its hex digits in every unit: `\2192` is 5, while raw `→` is 1 character, 3 bytes and 1 UTF-16 unit. An emoji is 1 character, 4 bytes and 2 units raw, against 6 for `\1f600`. A code point's UTF-8 length never exceeds its hex-digit count, so an escape is never the shorter form [inferred · gapfill09-01].
    - An escape followed by a hex digit or a space also needs a terminating space, which costs one more.
  - Use `\hex` escapes only for encoding safety:
    - when a toolchain might mangle UTF-8 (item 45);
    - in CSS generated by a service, whose decoding you don't control (`07-techniques-and-support.md` §7.10) [verified · repo-16, localtests-15].
    - Both forms survive itch's storage [verified · corpus-19, corpus-20; verified 2026-10-16 · live-c25, live-c26] and render the same: Chrome 155 computes `"→ ñ"` for both `"→ ñ"` and `"\2192  \f1"` [verified · gapfill09-02].
  - Your minifier may undo the choice. lightningcss and csso turn escapes back into raw characters. esbuild without `--charset=utf8` escapes raw ones. The rule in the table minified to 47 characters with raw output, and to 80 with esbuild's default escaping [verified · gapfill09-03].
  - Move extras to an `@import` (item 47).

**41. Project and jam limits are different, and the jam's is partly unknown.**
- *Symptom:* CSS that "works on a project" fails on a profile, or an old jam stylesheet suddenly won't re-save.
- *Cause:*
  - **Projects:**
    - There is no CSS cap. Single-line ASCII CSS of 659,742 characters saved whole on a draft project; 659,743 and more fail with "missing token", because the request is too big for its form to be read. That is a request-size limit, not a CSS rule, and the exact number depends on the rest of the form [verified 2026-10-16 · live-cap-B1, live-cap-B2; inferred for the cause]. Devlogs and the comments page use the project's CSS, so the same holds for them.
    - Live sheets of 9,004 to 93,105 characters exist [verified · crawlproject-47], and a 38,576-byte sheet is served intact [verified · corpus-07].
    - An admin said game pages "might actually be missing the size check" [documented · repo-60].
    - A jam host claimed in 2026 that 5,120 now also applies to projects. That report is quoted in [observed · community-08, docs-33] and does not hold [verified 2026-10-16 · live-cap-B1].
  - **Jams:**
    - The limit has been "20kb" since 2026-06-02. Before that there was none [documented · community-07, crawljam-29].
    - A post-cap jam serves 20,410 characters (20,411 with the space itch appends) [documented · crawljam-29; inferred · docs-52].
    - Hosts over the cap reportedly find out only at their next save [inferred · community-04].
- *Fix:*
  - Projects: no CSS budget. Keep the sheet lean anyway, because every byte is page weight on the project, devlog and comments pages, and paste it as one line, because each line break is stored as CRLF [verified 2026-10-16 · live-cap-B1, live-css].
  - Jams: stay at or under 20,410 characters (known to save; the cap itself is unmeasured), counted with LF line endings.

**42. Comments, whitespace and CRLF are stored, and comments count toward the profile cap.**
- *Symptom:* "my CSS is only 4 KB" (by your editor's count), yet the page serves more.
- *Cause:*
  - itch stores and serves the box as pasted. No minification, comment stripping or reformatting [verified · community-10, crawlprofile-24, corpus-01, crawlproject-46]. On a project and on the profile a 45-probe sheet came back identical apart from line endings, trimmed ends and deleted `</style>` sequences, comments included [verified 2026-10-16 · live-css, live-c37, live-c40, live-c41].
  - 31 of 62 live pages keep comments, about 9.3% of stored bytes [verified · corpus-18].
  - Newlines: profiles LF, projects CRLF, regardless of what was pasted [verified · corpus-03; verified 2026-10-16 · live-css]. The same paste from the same browser came back LF on the profile and CRLF on the project, so itch adds the CR [verified 2026-10-16 · live-css]. Jams are mostly LF, but some older saves are CRLF [observed · corpus-48]. One project serves 10,569 characters that are 10,203 with LF endings [observed · docs-57].
  - Trailing whitespace is trimmed on save. Jams get one space appended after your CSS [verified · corpus-04, corpus-09]. On projects and profiles both leading and trailing whitespace are trimmed [verified 2026-10-16 · live-css].
  - On the profile, comments count toward the cap (5,121 characters inside a comment were refused), and leading and trailing whitespace don't, because they are trimmed before the check [verified 2026-10-16 · live-cap-A3a, live-cap-A3b, live-cap-A3c]. Projects have no CSS cap, so there all of it is only page weight [verified 2026-10-16 · live-cap-B1].
- *Fix:* paste one-line minified CSS, so line endings don't matter [observed · sanitizer-47]. Count after CRLF→LF normalisation.

**43. HTML pasted into the box: `</style>`, `<style>` and `&gt;`.**
- *Symptom:* the first rule or a whole block is ignored, HTML junk shows up in the stylesheet, or a string that contained `</style>` comes back without it.
- *Cause:*
  - The editor's live preview strips only the first case-insensitive `</style>` (no `g` flag) [verified · community-31; documented · repo-05].
  - On a project or a profile the saved CSS loses **every** `</style>`, in any case and with inner whitespace (`</STYLE >`), inside comments and strings too. The text around it stays, and the `<style>` element is not closed early [verified 2026-10-16 · live-c42, live-c43, live-c44]. Jams are untested.
  - One live page whose author pasted a whole HTML document was served without its `</style>`. The leading `<!DOCTYPE …><style> body{` became the first rule's selector, so that rule was dropped [observed · crawlprofile-25].
  - itch does not entity-escape anything, and a pre-escaped `#a &gt; #b` is dropped by the browser [verified · corpus-02]. On a project a raw `>` combinator and `& < >` inside a string are stored raw [verified 2026-10-16 · live-c23, live-c24].
- *Fix:* paste plain CSS only. Never include `</style>`, even inside strings, comments or SVG data URIs. Write `>` raw.

**44. A minifier silently changes your CSS.**
- *Symptom:* after minifying, something is missing and nothing reports an error. It may be a fallback line, a nested rule, a whole `@media` block or the `@import`. Or `content` strings lose spaces, or a selector or `calc()` stops working.
- *Cause, regex minifiers:*
  - A regex minifier turned `"a, b ; c { d }"` into `"a,b;c{d}"`, `"/* x */"` into `""`, `"time: 10:30"` into `"time:10:30"` and collapsed double spaces [verified · repo-07].
  - The private repo's five regexes, re-run: `content:"Hi, you: there  {x}; /* y */"` became `"Hi,you:there{x};"`. `"\2192  \f1"` lost its real space and rendered `→ñ` [verified · gapfill09-16].
  - A safe minifier must keep the space in `#wrapper ::selection` and the spaces in `calc(100% - 2rem)` [verified · repo-06].
  - `calc(40px+10px)`, `calc(50px - 0)` and `@media (…) and(…)` are invalid, and the browser drops them silently [verified · localtests-41].
- *Cause, tokenizer minifiers:* they are string-safe, but they also "optimise". The test ran four fixture files through each setting. They contain fallback pairs, nesting, `@property`, `@layer`, an `@import`, range media queries, rule-order ties and modern at-rules. Three files were compared with their source by computed styles in Chrome 155; the modern-syntax file was checked by its text only [verified · gapfill09-05 to gapfill09-18]. Firefox, Safari and cssnano were not tested:

  | Setting (version) | What changed | Use it? |
  |---|---|---|
  | `esbuild --minify --charset=utf8` (0.28.0) | Nothing that matters. Every fallback, at-rule and nested rule was kept. Computed values matched in every Chrome-compared fixture and on a real profile page (182 boxes, every property, 1280 and 375px wide) [verified · gapfill09-05, gapfill09-15] | **Yes. Best tested.** |
  | `esbuild --minify` (default charset) | The same, but non-ASCII is re-escaped, which is larger (item 40) [verified · gapfill09-03] | Yes; add `--charset=utf8` |
  | `lightningcss --minify`, no targets (1.33.0) | It drops a fallback before any value it treats as overriding it: `color:blue;color:future-fn(1)` keeps only the second, so Chrome shows the inherited colour. It also drops `height:100vh` before `100dvh`, `-webkit-backdrop-filter`, `width:-moz-fit-content`, `width:100%` before `stretch`, and `#fff` before `light-dark()`. It rewrites `(min-width:600px)` as `(width>=600px)`, which needs Chrome 104, Firefox 102 or Safari 16.4; older browsers drop the block [verified · gapfill09-06, gapfill09-07; documented · gapfill09-19] | **No** |
  | `lightningcss --minify --targets '>= 0.25%'` | It keeps prefixes and `100vh`, and lowers nesting and range queries, so the output grows. It still drops the fallback before an unknown value. `light-dark(#000,#fff)` becomes a `var(--lightningcss-light,…)` polyfill that renders the inherited colour, in Chrome 155 too, unless the same build declares `color-scheme` [verified · gapfill09-06, gapfill09-08] | Only after diffing |
  | `csso` default, restructure on (5.0.5) | It **deletes** nested rules, `@media (600px <= width)` blocks, and an `@import` placed after `@layer a,b;`. It also drops `content:"★"` before `content:"★" / ""`, and visitors on Firefox before 128 or Safari before 17.4 then get no glyph [verified · gapfill09-11 to gapfill09-14; documented · gapfill09-19] | **No** |
  | `csso --no-restructure` | It keeps the fallbacks, but makes the same three deletions [verified · gapfill09-11 to gapfill09-13] | Only for flat CSS without range queries |
  | Regex (the repo's script) | Strings are damaged (above). Nothing else changed: the real profile page computed identically [verified · gapfill09-05, gapfill09-16] | Only without `content` strings |
  | cssnano, default preset | Not installed locally, not tested [unverified] | Diff before use |

  - **Kept by every tokenizer setting:**
    - the space in `#wrapper ::selection`;
    - `calc(100% - 2rem)` and string contents;
    - `@property`, `@starting-style`, `@scope`, `@container`, `:has()`, `@view-transition` and `@position-try`;
    - the fallback pairs `width:28px;width:random(…)` and `animation-delay:.2s;animation-delay:calc(sibling-index()*60ms)`;
    - `-webkit-background-clip:text` and `position:-webkit-sticky`.
    - None produced the invalid `calc(50px - 0)`: lightningcss and esbuild fold `calc(50px - 0px)` to `50px`, and csso leaves it [verified · gapfill09-18].
  - **Some "lost" fallbacks never worked.** A plain value placed before a value that contains `var()` is useless: the `var()` line always wins the cascade, then fails at computed-value time and falls back to inherit/initial. In Chrome 155, `color:blue;color:future-fn(var(--x))` gave the inherited colour. Dropping such a line changes nothing [verified · gapfill09-10; s07-n1 T4]. A fallback before `color-mix(…)` therefore only helps when the mix contains no `var()`.
  - **lightningcss resolves static colours at build time.** `color-mix(in srgb,#123456 50%,#fff)` becomes `#899aab` and `rgb(from red r g b/50%)` becomes `#ff000080`. It also rewrites colours inside custom-property values, e.g. `rgba(10,18,46,.5)` becomes `#0a122e80`. The render is the same, but if you compare stylesheet text or computed custom-property strings, they differ [verified · gapfill09-05, gapfill09-09].
  - **The size gain is small.** The private repo's real profile sheet is 4,725 characters from its regex minifier. The tokenizer settings gave lightningcss 4,602, esbuild 4,651, lightningcss with targets 4,691, csso 4,686 and csso without restructure 4,712, i.e. at most 2.6 % less [verified · gapfill09-04]. Switching minifier will not rescue a sheet that is over the cap.
- *Fix:*
  - Minify with `esbuild --minify --charset=utf8`, or from Node with `esbuild.transformSync(css,{loader:'css',minify:true,charset:'utf8'})`. The CLI flags are [inferred] from the API options tested.
  - Never use csso on CSS that has nesting or range media queries, or that puts `@layer` before `@import`.
  - Never use lightningcss without `--targets`.
  - After any minifier:
    - check that each fallback pair is still two declarations;
    - count `@import`, `@media` and `&` in the input and the output;
    - compare computed styles in a harness (gapfill09-05 method).
  - With a regex minifier, keep `content` strings free of `,;:{}`, comments and double spaces.

**45. Non-ASCII characters turn into mojibake.**
- *Symptom:* `→` becomes `â†’`, `ñ` becomes `Ã±`.
- *Cause:* Windows PowerShell 5.1 `Get-Content -Raw` reads BOM-less UTF-8 as ANSI. Writing the result back as UTF-8 makes the damage permanent [verified · repo-08]. itch itself stores raw UTF-8 correctly, and pages declare `<meta charset="UTF-8">` [verified · corpus-19, corpus-49; verified 2026-10-16 · live-c25, live-c37].
- *Fix:*
  - Read and write with explicit UTF-8 (`-Encoding utf8`, `[IO.File]::ReadAllText(path,[Text.Encoding]::UTF8)`).
  - Or use `\hex` escapes [verified · repo-16, corpus-20]. They cost more of the cap than raw characters (item 40), and lightningcss and csso turn them back into raw UTF-8 (item 44) [verified · gapfill09-01, gapfill09-03].

**46. Visitors don't see your change (yet).**
- *Symptom:* the page looks right in the editor but old for visitors, or a change seems not to have saved.
- *Cause:*
  - The editor applies box CSS live, throttled to 100ms, to the owner's DOM only. Visitors get it after Save [documented · community-05].
  - Logged-out profile HTML is cached server-side for a few minutes (`X-Cache-Status: HIT`) [verified · crawlprofile-46]. Project pages were rendered fresh on each request (`MISS`, see Section notes).
- *Fix:*
  - Press Save.
  - Check from a private window.
  - Before assuming failure, read `<style id="custom_css">` and `X-Cache-Status` with curl [verified · crawlprofile-58].

---

### E. `@import`, external hosts and fonts

**47. An `@import` silently does nothing.**
- *Symptom:* the font or external sheet never loads. DevTools shows no network request and no console warning.
- *Cause:*
  - An `@import` is valid only before every other rule. Only `@charset` and `@layer a,b;` statements may precede it; the current draft also allows `@supports`-condition rules. On a project, six imports after an `@charset` and an `@layer` statement all stayed import rules, and the `data:` ones applied [verified 2026-10-16 · live-c01 to live-c08].
  - It is dropped, and never requested, in these cases:
    - after a style rule, `@font-face`, `@property` or `@keyframes`, or even after an empty `@media screen{}`;
    - when nested inside `@media{}` or `@supports{}` [verified · external-03, localtests-09, localtests-50, external-50, corpus-46, corpus-11].
  - Rules after a dead `@import` still apply, so nothing looks broken [verified · corpus-11].
  - An `@layer x;` placed *between* two imports kills the second one. Chrome's preload scanner still downloads it, though [verified · localtests-10].
- *Fix:* put every `@import` on the first lines of the box. For a conditional import, use its own condition, e.g. `@import url(x.css) supports(display:grid) (min-width:700px);` [verified · external-50].
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap');
  @import url('https://example.com/extra.css');
  #wrapper .user_profile{font-family:Syne,sans-serif}
  ```

**48. `@import` never works in jam CSS.**
- *Symptom:* a Google Fonts `@import` in a jam's CSS has no effect.
- *Cause:*
  - Jams have no `style#custom_css`. Your CSS is appended after about 1.9 KB of generated rules inside `<style id="jam_theme">`, so any `@import` follows style rules and is dropped [verified · crawljam-01, corpus-09].
  - On a real jam, the stylesheet had 0 `CSSImportRule` [verified · crawljam-02, corpus-10, itchcss-07; inferred · community-16]. 3 of 23 sampled jams ship such a dead import [verified · corpus-10].
- *Fix:*
  - Use the theme editor's font picker. It costs no CSS, but loads only 400/700 (item 57).
  - Or paste `@font-face` blocks with direct `woff2` URLs. They parse anywhere in the sheet [verified · crawljam-43; observed · corpus-12].
  - Keep only the `unicode-range` subsets you need: one jam spent most of 13,872 characters on 28 such blocks [verified · crawljam-43].

**49. The external sheet is fetched but ignored.**
- *Symptom:* the request returns 200 (or 404), yet no rule applies.
- *Cause:*
  - On itch's standards-mode pages a stylesheet must be `text/css`. `text/plain`, `text/html` and `application/octet-stream` are silently rejected [verified · external-04, localtests-14].
  - raw.githubusercontent.com and gist raw URLs serve `text/plain` with `nosniff` [verified · external-05; documented · community-13].
  - 404 and 500 responses are ignored even with a CSS body [verified · external-06].
  - Cloudflare's free-tier over-limit error 1027 is an HTML page, so it fails the same way [documented · external-24].
  - "itch blocks external stylesheets via CORS" is a myth: no page sends a style CSP [verified · community-14].
- *Fix:* host CSS on jsDelivr, unpkg, cdnjs, GitHub Pages or your own server with `Content-Type: text/css`. Check the response type in DevTools.

**50. Edits to an external sheet take days to appear.**
- *Symptom:* you pushed a fix, but visitors still get the old CSS.
- *Cause:*
  - jsDelivr branch (`@main`), version-less and short-SHA URLs are cached `max-age=604800, s-maxage=43200` (7 days in browsers, 12 hours at the CDN).
  - Only a semver tag or a full 40-character commit SHA is cached as immutable, for a year [verified · external-45, community-12, corpus-23].
  - Pushing to the branch doesn't change a version-less URL while a tag exists [verified · external-45].
- *Fix:*
  - Publish a new tag (or full SHA) and re-paste the box with the new URL.
  - On your own host, serve per-visit sheets with `Cache-Control: no-store` and static ones with real caching [verified · repo-12, external-17; documented · external-21].

**51. The page stays blank before rendering.**
- *Symptom:* a noticeable delay before anything paints, worse on first visits.
- *Cause:*
  - An `@import` from the box is render-blocking. A 2.5 s import gave a first paint at 2.54 s [verified · external-07].
  - Nested imports load in series [verified · external-09].
  - itch's inline scripts after `custom_css` also wait for the import chain [inferred · external-10].
  - A Vercel function in its default region (iad1) costs European visitors about 0.1–0.15 s extra per request [verified · external-18; documented · external-19].
  - A community README calls this "FOUC". The spec and lab tests show a delayed first paint instead [verified · community-11, external-07; observed · community-36].
- *Fix:* one flat, fast endpoint with no chained imports and no slow upstream calls. Pin its region near your audience.

**52. Styles from the external host vanish for some visitors.**
- *Symptom:* some visitors (often Brave users) see the page without the extras.
- *Cause:*
  - Brave Shields blocked a Vercel-hosted import on a profile [observed 2026-10-12 · repo-14; observed · community-36].
  - No rule in Brave's 30 default filter-list sources matches that URL, so the cause is unexplained [verified · external-27]. In Standard mode, Brave applies its lists to third-party requests [documented · external-28].
  - Ad-like paths such as `/adverts.css` and `/advert.css` match generic EasyList rules [inferred · external-29].
  - When the import fails, the rest of the box still applies [verified · external-06, localtests-12].
- *Fix:*
  - The box alone must give a complete, readable page: layout, contrast and the heading fix stay in the box. Use the import only for extras.
  - Use neutral file names (`/live.css`, `/theme.css`). A custom domain is probably safer [inferred · external-29].

**53. You can't read the imported sheet's rules from DevTools snippets or scripts.**
- *Symptom:* `importRule.styleSheet.cssRules` throws `SecurityError`.
- *Cause:* `@import` from an inline `<style>` is fetched in no-cors mode, so the sheet is opaque even with `Access-Control-Allow-Origin: *` [verified · localtests-13, external-15].
- *Fix:*
  - Verify with `getComputedStyle()`.
  - To test without the service, `deleteRule()` the import in memory [observed 2026-10-12 · repo-54].

**54. Self-hosted web fonts (and CSS masks) fail.**
- *Symptom:* `FontFace.status` is `error`, or the console shows a CORS error for the `.woff2` or `mask-image` file.
- *Cause:* fonts and masks are fetched in CORS mode with `Origin: https://<user>.itch.io`, even when declared in a sheet on the font's own host [verified · external-16, localtests-40]. `background-image` needs no CORS [verified · localtests-19].
- *Fix:* serve font and mask files with `Access-Control-Allow-Origin: *`.

**55. Relative or `http://` URLs point at nothing.**
- *Symptom:* images or fonts 404, or are blocked as mixed content.
- *Cause:*
  - A relative `url()` in the box resolves against the itch page. In an imported sheet it resolves against that sheet [verified · localtests-19].
  - A relative URL stored in an unregistered custom property resolves where `var()` is used, not where it was declared [verified · localtests-20].
  - itch pages are HTTPS. `http://` stylesheets and fonts are blocked; only CSS images may be auto-upgraded [documented · external-35, docs-37]. itch itself stores `http://` `@import` and `@font-face` URLs unchanged (project, profile), so only the browser blocks them [verified 2026-10-16 · live-c04, live-c10].
- *Fix:* use absolute `https://` URLs everywhere, and never put relative URLs in custom properties.

**56. Conditional imports still download, and `scope()` imports never apply.**
- *Symptom:* a `print` or `(min-width:…)` import costs a request on every visit. An `@import url(x) scope(#wrapper)` sheet never applies at all.
- *Cause:*
  - Chrome fetches media-mismatched imports (marked render-blocking) and skips only `supports(false)` ones [verified · external-13].
  - Chrome 155 parses `scope(#wrapper)` as an unknown media query that never matches [verified · external-14].
- *Fix:* don't rely on media conditions to save bytes. Scope external CSS by writing `#wrapper` into every selector on the server.

**57. A Google font silently falls back, or loads in the wrong weight.**
- *Symptom:* the fallback font shows, text is invisible for a moment, or `font-weight:600` looks fake.
- *Cause:*
  - A wrong-case or unknown family, or an axis range outside the font's real range (e.g. `Syne:wght@100..900`; Syne is 400..800), returns HTTP 400 `text/html`, which the browser ignores [verified · external-38].
  - Without `&display=swap`, css2 emits no `font-display`, so the browser default applies [verified · external-39].
  - Theme-editor fonts load only 400, 400italic, 700 and 700italic through the v1 API, even for variable fonts [verified · corpus-45, crawlprofile-37, crawlproject-27; documented · repo-63].
  - itch self-hosts Lato only at 400, 400i, 700 and 900 [verified · itchcss-41]. Other weights are synthesised or snapped.
- *Fix:*
  - Copy the exact URL from fonts.google.com and add `&display=swap`.
  - For other weights, `@import` a css2 URL with axes on profiles and projects, or paste `@font-face` on jams (item 48).

**58. Fonts eat the CSS budget.**
- *Symptom:* a Base64 font pushes a profile past the cap.
- *Cause:*
  - Base64 fonts hit the profile's 5,120-byte cap quickly [verified · community-17; cap: verified 2026-10-16 · live-cap-A2c].
  - Even a one-word `&text=` subset (a 2,548-byte woff2) costs 3,400 Base64 characters [verified · external-40].
- *Fix:* use the theme font picker, or link a hosted subset. Adding `&text=<letters>` to a css2 URL cuts a display font by about 93% [verified · external-40].

**59. Google Fonts reveals visitors to Google.**
- *Symptom:* a legal risk for EU-facing pages, not a visual problem.
- *Cause:* each font request sends Google the visitor's IP, UA and Referer. A German first-instance court awarded €100 under GDPR for embedding Google Fonts without consent (2022). The same court later found crawler-driven mass claims abusive [community · external-43].
- *Fix:* where this matters, self-host the fonts (item 54). This is not legal advice.

**60. Free hosting tiers bite.**
- *Symptom:* the CSS endpoint stops working, or its terms don't allow the use.
- *Cause:*
  - Vercel per-deploy hash URLs can sit behind Vercel's login; only the production domain is public [verified · repo-12].
  - Vercel Hobby is non-commercial only, and selling games may count as commercial [inferred · external-23].
  - A per-visit `no-store` sheet costs one function invocation per page view: Hobby includes 1M per month, about 33k views per day [documented · external-22].
  - Cloudflare Workers Free allows 100k requests per day, then serves error 1027 (HTML) or bypasses [documented · external-24].
  - Netlify Free spends credits per deploy and per GB [documented · external-25].
- *Fix:* use the stable production domain, check the plan's terms, and cache static sheets.

**61. Debugging a font or import with curl misleads you.**
- *Symptom:* Google's CSS downloaded with curl contains a single `.ttf`, unlike what browsers get.
- *Cause:* Google Fonts picks CSS by User-Agent. curl gets one TrueType face, while Chrome and Firefox UAs get `woff2` faces split by `unicode-range` [verified · external-41].
- *Fix:* send a modern browser UA when downloading Google CSS to self-host or inspect.

---

### F. HTML in bios and descriptions (the sanitizer)

**62. A class in your bio or description HTML vanishes.**
- *Symptom:* `<div class="card">` saves as `<div>`, so your CSS never matches.
- *Cause:*
  - Only classes beginning with `custom-` survive. Framework classes (Tailwind, Bootstrap) are stripped [documented · docs-34, sanitizer-02].
  - On a project description the filter is a case-sensitive prefix test on lowercase `custom`, and whatever follows the prefix is kept, `:`, `/`, `[ ]`, `.` and non-ASCII included (`custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2`, `custom:md:flex`, `custom-café`). `Custom-a`, `CUSTOM-b`, `-custom-f`, `md:custom-g`, `!custom-h`, `xcustom-i` and unprefixed classes such as `button` are dropped [verified 2026-10-16 · live-k01 to live-k21, live-k26 to live-k28]. A bio save gave the same results for the tokens it carried (`Custom-a`, `customer`, `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2`, `custom:flex`, `-custom-f`, `foo`) [verified 2026-10-16 · live-k01, live-k05, live-k07, live-k09, live-k11, live-k14, live-k16, live-k26]. So prefixed framework classes survive; variant forms that start with something else don't.
  - itch's own alignment classes `text-center` and `text-justify` are also kept [observed · sanitizer-03]. On a project description `text-right`, `spoiler` and `language-css` on `<code>` survive too, while `text-left` is dropped [verified 2026-10-16 · live-k22 to live-k25, live-k34, live-t03]. `spoiler` survives in a bio too [verified 2026-10-16 · live-k34].
  - `custom_x` and hyphen-less `customa` classes were seen surviving, but that is undocumented [observed · sanitizer-04, corpus-36; verified · community-19]. On a project description `customc`, `custom_d`, `customer` and a bare `custom-` survive, and `customer` also survives in a bio [verified 2026-10-16 · live-k03 to live-k06].
- *Fix:*
  - Use `class="custom-…"` and select it as `#wrapper .custom-…`. Escape special characters in the selector: on a project and in a profile bio `#wrapper .custom-hover\:x` and `#wrapper .custom-w-\[3px\]` matched [verified 2026-10-16 · live-c38, live-c39].
  - When "my CSS does nothing", check the served HTML for `style#custom_css` and for whether the class survived [community · community-21].

**63. Markup disappears after a later edit.**
- *Symptom:* spans and wrappers you added are gone after someone edits the text visually.
- *Cause:*
  - The rich-text editor (Redactor) may rewrite markup and strip tags. The guide says to stay in HTML (`<>`) mode once you write HTML [documented · docs-35; observed · sanitizer-29].
  - Saved `<b>`/`<i>` come back as `<strong>`/`<em>` [observed · sanitizer-28].
  - A paste made through the context menu may not register before Save [community · community-22].
- *Fix:*
  - Edit only in HTML mode and paste with Ctrl+V.
  - Keep the HTML source in a file.
  - Target `strong` and `em` in CSS.

**64. `id`, `aria-*`, `role` and `data-*` attributes are gone.**
- *Symptom:* `#my-id` rules, `[data-x]` selectors and `aria-hidden` do nothing.
- *Cause:*
  - No author-written `id`, `aria-*`, `role`, `data-*` or `on*` attribute survives in 2,127 sampled containers [observed · sanitizer-05, sanitizer-09].
  - On a project description `id`, `data-*`, `aria-label`, `aria-hidden`, `role`, `tabindex`, `hidden`, `onclick`, `popover`, `popovertarget`, `accesskey`, `contenteditable`, `draggable`, `translate` and `inert` are all dropped [verified 2026-10-16 · live-a01 to live-a07, live-a11 to live-a20]. The one exception: a hand-written `<span class="spoiler" tabindex="0">` keeps its `tabindex` [verified 2026-10-16 · live-k34]. A bio save drops `id`, `data-*`, `aria-hidden`, `aria-label`, `role` and `popover` too, and keeps the spoiler's `tabindex` [verified 2026-10-16 · live-a01, live-a02, live-a04, live-a05, live-a12, live-a20, live-k34].
  - `aria-hidden` was stripped from a bio on save [observed 2026-10-08 · repo-28], and a probe bio confirmed it [verified 2026-10-16 · live-a04].
- *Fix:* use `custom-` classes for CSS hooks, and semantic elements (headings, `img alt`, `abbr`, `figure`) for accessibility [inferred · sanitizer-40].

**65. In-page links break, and dead links get the "External link" badge.**
- *Symptom:* a table-of-contents link does nothing, or shows the red badge, or your `rel="me"` is gone.
- *Cause:*
  - A fragment-only `href="#x"` is removed, but because the original href was non-itch, itch still injects `rel="nofollow noopener"` [observed · sanitizer-06, sanitizer-45; verified 2026-10-16 · live-l03].
  - An author-written `rel` is replaced on external links [verified · sanitizer-07], and dropped on itch.io links [verified 2026-10-16 · live-l01, live-l02, live-l13]. Bios are no exception: `rel="me"` on an off-site link became `nofollow noopener`, and `rel="me author"` on an itch link was removed [verified 2026-10-16 · live-l01, live-l02].
- *Fix:*
  - Make the target `<a name="x"></a>` and link to the full page URL plus `#x`. On a project description and in a bio `<a name>` survives and matches `:target` [verified 2026-10-16 · live-l10]. Same-page itch links are internal and get no badge [observed · sanitizer-42].
  - Select real outbound links with `a[href][rel~=nofollow]`.
  - Profile links in the links widget get `rel="me"` from itch itself [verified · crawlprofile-07], so use the widget, not a bio link, for `rel="me"` verification.

**66. Raw tag text appears on the page.**
- *Symptom:* visible `<svg …>`, `<marquee>` or `</span>` text in a description.
- *Cause:*
  - Disallowed tags are escaped as visible text, not deleted [observed · sanitizer-15; verified 2026-10-16 · live-t02, live-t04, live-t10 to live-t22, live-a13, live-e04]. A bio escaped `<link>`, `<meta>` and a comment the same way [verified 2026-10-16 · live-t21, live-e04].
  - `<wbr>` was accepted until 2024 and has been shown as text since at least 2025-04 [observed · sanitizer-44]. Yet on a project description on 2026-10-16 it survived, served as `soft<wbr>break</wbr>` [verified 2026-10-16 · live-t11]. Stored descriptions are re-sanitised on output, so whitelist changes reach old content [inferred · sanitizer-43].
  - Not expected to work: `svg`, `video`, `audio`, `picture`, `canvas`, form controls, `section`/`article`/`nav`, `style`, `script`, `button`, `center` [inferred · sanitizer-14]. On a project description all of these were escaped as text except `video`, which survives with `controls` (its class, width and height are dropped) [verified 2026-10-16 · live-t10, live-t13 to live-t20, live-a13].
  - Library-level rules, now checked on a project description (in a bio only the unquoted value and the comment were tested; devlogs and jams are untested):
    - An unquoted value with `%` or `/` escapes the whole tag [documented · sanitizer-16]. Confirmed for `width=40%`, in project descriptions and bios; the bare URL inside the escaped text is also auto-linked [verified 2026-10-16 · live-g07].
    - `@click` attributes and a CR inside a tag do the same [inferred · sanitizer-17]. A line break inside a tag escaped it [verified 2026-10-16 · live-e06].
    - `<span/>` self-closing is escaped [inferred · sanitizer-18; verified 2026-10-16 · live-t12].
    - `<!-- comments -->` show as text by default, in project descriptions and bios [documented · sanitizer-20; verified 2026-10-16 · live-e04].
    - A raw `x < div > y` gets a `</div>` appended that can close itch's container [inferred · sanitizer-19]. It did: the content after it landed outside `div.formatted_description` [verified 2026-10-16 · live-e08].
- *Fix:*
  - Quote every attribute value, keep each tag on one line, and write explicit closing tags.
  - Write `&lt;` for a literal `<`, and keep notes out of the HTML.
  - Use CSS `overflow-wrap:anywhere` rather than relying on `<wbr>`, which is kept on project descriptions but untested elsewhere [verified 2026-10-16 · live-t11].

**67. Inline `style=""` is partly or completely dropped.**
- *Symptom:* `float`, `display`, `border-radius` or `font-family` inline styles do nothing. Sometimes the whole `style` attribute is gone.
- *Cause:*
  - Only 27 properties survive (margin/padding families, `font-size`, `text-align`, `color`, `background*`, `opacity`, `border*`, sizes) [observed · sanitizer-21]. On a project description every property tested matched this list; `display`, `float`, `position`, `font-family`, `font-weight`, `border-radius`, `transform`, `line-height` and custom properties were dropped [verified 2026-10-16 · live-s01 to live-s30]. A bio save matched on the four style probes it carried: the six never-seen list properties kept, `float`, `border-radius` and `--i` dropped, and `!important` removing the whole attribute [verified 2026-10-16 · live-s02, live-s08, live-s11, live-s18].
  - The whole attribute is dropped on `!important`, `;;`, comments, slash colours, an unquoted `url(https://…)`, a decimal percentage like `50.5%`, or even a trailing space [inferred · sanitizer-22, sanitizer-48]. On a project description `!important`, the slash `rgb()`, `50.5%`, the trailing space and a comment were confirmed, and a line break inside the value drops the whole attribute too [verified 2026-10-16 · live-s02, live-s07, live-s16, live-s17, live-s22, live-s31].
  - Values like `font-size:1.5em` or `width:calc()` drop that one declaration [inferred · sanitizer-23; verified 2026-10-16 · live-s03, live-s24].
  - On a CSS-enabled account, all 7 inline styles of a live bio survived [verified · community-18]. A moderator's claim, quoted in the same fact, says inline CSS is stripped without CSS access. That is a community report, untested: live probe Runs 1 and 2 used a CSS-enabled account.
- *Fix:* write compact inline styles (`style="color:#f80;font-size:150%"`), or better, a `custom-` class plus box CSS.

**68. Attributes on some tags never stick.**
- *Symptom:* `<font color>` is ignored, `<details open>` starts closed, and a class on `<details>` or `<figure>` is gone.
- *Cause:*
  - `<font>` survives without attributes [observed · sanitizer-37; verified 2026-10-16 · live-t10].
  - `open` is scrubbed, and so is `name`, in project descriptions and bios [community · sanitizer-27; verified 2026-10-16 · live-t08].
  - About 350 live `details`, `summary`, `figure`, `figcaption`, `del`, `ruby` and `font` elements carried no attribute at all [inferred · sanitizer-46]. On a project description their `class`, `title`, `style` and other attributes were all dropped [verified 2026-10-16 · live-t02, live-t08 to live-t10]. A bio save did the same to `details` and `summary` [verified 2026-10-16 · live-t08].
- *Fix:* wrap these elements in `<div class="custom-…">` and style through the wrapper, e.g. `#wrapper .custom-faq details > summary`.

**69. Description images load late, and `data:` images are impossible.**
- *Symptom:* layout shifts below the fold, or a pasted `data:` image disappears.
- *Cause:*
  - Every `<img>` gets `loading="lazy"`, overwriting an authored `eager` [verified · sanitizer-11; verified 2026-10-16 · live-g01 to live-g04].
  - `src` must be absolute `http(s)://` or `//`, and the editor's paste filter removes `data:` images [observed · sanitizer-12]. On a project description a relative `src` is dropped, `http://` and `//` stay, and an `<img>` with a `data:` `src` is removed whole [verified 2026-10-16 · live-g05, live-g06, live-g09, live-g10].
- *Fix:* give images `width`/`height` attributes or a CSS `aspect-ratio`, and host them on https (e.g. an itch upload on img.itch.zone).

**70. Embedded videos become small buttons on project pages.**
- *Symptom:* a YouTube iframe shows as a 250×140 thumbnail button, not a player.
- *Cause:*
  - Since 2023, third-party iframes in project descriptions are replaced by `button.embed_preload` click-to-activate placeholders with inline sizes. Authors can't write such buttons themselves [verified · sanitizer-24]. On a project description YouTube became `.youtube_preload` and every other host tested `.other_embed`, with the cleaned iframe kept in `data-embed_code` [verified 2026-10-16 · live-i01 to live-i07, live-i10].
  - Devlog bodies and jam descriptions keep live iframes [observed · sanitizer-25], and so do profile bios: a YouTube and an arbitrary `https://` iframe stayed live, with 0 placeholders [verified 2026-10-16 · live-i01, live-i04]. Iframe `title`, `allow` and `loading` attributes were never seen surviving [observed · sanitizer-26]; on a project description they, `sandbox`, `srcdoc` and a `data:` `src` were dropped, and in a bio `title`, `allow`, `loading` and `sandbox` were too [verified 2026-10-16 · live-i01, live-i08, live-i09].
- *Fix:*
  - Restyle via `#wrapper .embed_preload`. The inline width and height probably need `!important` (inferred from item 11).
  - Put a visible caption next to embeds.

**71. Empty paragraphs add stray gaps.**
- *Symptom:* uneven vertical spacing in descriptions.
- *Cause:* saved descriptions often contain `<p></p>` (40 in 17 of 91 containers) and more often `<p><br></p>` (96), which `:empty` doesn't match [observed · sanitizer-31].
- *Fix:* `#wrapper .formatted_description p:empty{display:none}` removes only part of the gaps. Clean the HTML instead.

**72. Ad blockers hide your `custom-` elements.**
- *Symptom:* a bio block named `custom-ad`, `custom-social` or `custom-share-button` is invisible for some visitors.
- *Cause:* EasyList has generic cosmetic filters for `.custom-ad`, `.custom-ads`, `.custom-ad-container`, `.custom-advert-banner` and similar. Fanboy Annoyances and Brave's default cookie list hide `.custom-social`, `.custom-sharing`, `.custom-follow-button`, `.custom-cookie-banner` and others [verified · external-30, external-51].
- *Fix:* choose neutral names such as `custom-links` or `custom-promo-row`, and check new names against these lists.

**73. The bio has its own size cap, counted on the HTML you submit.**
- *Symptom:* a long bio won't save: the edit-profile page shows "Errors:" and then "data: profile: expected text between 1 and 5000 characters, or empty". Or the served HTML is bigger than what you pasted.
- *Cause:*
  - The bio cap is 5,000 characters of the submitted HTML: 5,000 ASCII characters save and 5,001 are refused [verified 2026-10-16 · live-cap-D1], as one creator reported [community · community-09]. Only ASCII was tested; whether non-ASCII counts as characters or bytes is unknown.
  - itch adds `loading="lazy"`, `rel` and `referrerpolicy` to the served bio, growing one bio from 4,227 to 4,860 characters [community · community-09]. That growth doesn't count: a 4,990-character bio with 10 off-site links saved and was served at 5,470 characters [verified 2026-10-16 · live-cap-D2].
  - A 3,857-character probe bio saved without a message and was served shorter (3,633 characters), because it lost more attributes than it gained [verified 2026-10-16 · live-html; cause inferred].
- *Fix:* minify the bio HTML and keep the source you paste within 5,000 characters; no headroom is needed for what itch adds. With non-ASCII text, keep both the character and the UTF-8 byte count within 5,000 until that unit is tested.

---

### G. Page-type surprises

**74. Description rules don't reach the profile bio, devlog posts or jam text.**
- *Symptom:* `#wrapper .formatted_description p{…}` styles the project page but nothing else.
- *Cause:* each page type has its own container [verified · sanitizer-30].
  - Profile bio: `.user_profile.formatted`. There are 0 `.formatted_description` on the live profile [verified · repo-29]. The bio has no `.user_formatted`, so itch's table, spoiler and external-link rules don't apply there [verified · sanitizer-30]. A probe bio confirms it: container `div.user_profile.formatted`, and a hand-written spoiler stayed visible [verified 2026-10-16 · live-html, live-k34].
  - Devlog post: `section.object_text_widget_widget.user_formatted.post_body`. Devlogs have no `.columns`, `.left_col` or `.formatted_description` [verified · docs-06, crawlproject-39].
  - Jam: `.jam_content.user_formatted` [verified · sanitizer-30].
- *Fix:* list every container you mean.
  ```css
  #wrapper .user_profile p,#wrapper .left_col>.formatted_description p,
  #wrapper .post_body p,#wrapper .jam_content p{line-height:1.6}
  ```

**75. A description rule also hits comments and install instructions, but misses itch's own headings.**
- *Symptom:* comment bodies change style, while "Purchase" and "Download" headings don't match your description `h2`s.
- *Cause:*
  - Project pages have a second `.formatted_description.user_formatted` inside `.download_instructions`. `.user_formatted` is also on comment bodies, reward rows and devlog bodies [verified · crawlproject-04].
  - The site-generated `h2`s (Purchase, Download, devlog list, comments) are children of `.left_col`, outside the description [documented · docs-25].
- *Fix:*
  - Style the description as `#wrapper .left_col > .formatted_description`.
  - Theme all headings together with `#wrapper .left_col h2`.

**76. Project CSS also styles every devlog post and the comments page.**
- *Symptom:* a rule written for the main page breaks devlog posts. For example, `#wrapper .header{display:none}` removes the project title and banner link on every devlog post.
- *Cause:*
  - `/devlog`, each post and `/comments` serve a byte-identical `custom_css` and `game_theme` [verified · docs-06, crawlproject-37, corpus-29, itchcss-10, community-35].
  - The header differs: `#header > img` on the main page, `#header > a > img` elsewhere [verified · crawlproject-38].
  - The h1 layout of posts varies [observed · a11y-07].
- *Fix:* scope page-specific rules with the page widget class: `.view_game_page` (main), `.game_devlog_post_page`, `.game_devlog_page`, `.game_comments_page` [verified · crawlproject-38]. Test both page kinds.

**77. Your CSS doesn't appear on some itch URLs.**
- *Symptom:* the user expects themed pages that stay itch-default.
- *Cause:* custom CSS is **not** applied on:
  - a project's `/purchase` popup [verified · docs-54, crawlproject-42];
  - the project's `/community` board and topics [verified · crawlproject-42];
  - AMP devlog copies [verified · corpus-30; observed · support-61];
  - the community profile at `itch.io/profile/<user>` [verified · crawlprofile-21]. An account without a creator page redirects its subdomain there with a 302 [verified · crawlprofile-20];
  - jam `/entries`, `/results`, `/feed`, `/community` and `/rate/<id>`, which carry only a 252-character variables block and an itch-darkened link colour [verified · crawljam-03, crawljam-04, crawljam-35, itchcss-11];
  - collections, top-level blog posts and forum topics [verified · docs-05; documented · docs-08].

  A jam without a results tab answers `/results` with a 302 to the overview, which *does* show the CSS [verified · crawljam-44].
- *Fix:* tell the creator which pages their CSS reaches. Never promise a themed checkout, board or entries grid.

**78. Rules on numeric widget ids stop matching.**
- *Symptom:* `#view_game_123456`, `#user_789` or `#jam_header_555` works once, then never again.
- *Cause:*
  - Numbered ids are random per server render. Project and jam pages re-render on every request [verified · crawlproject-05, crawljam-22].
  - Profiles are cached for a few minutes, so their ids look stable for a while [verified · crawlprofile-02, repo-36].
  - A fresh check of both page types is in the Section notes.
- *Fix:* use classes. The only stable ids are `#wrapper`, plus:
  - Projects: `#inner_column`, `#header`, `#view_game_footer` [verified · crawlproject-06].
  - Profiles: `#profile_header` [verified · crawlprofile-02].
  - Jams: `#entries` [verified · crawljam-22].

**79. Profile elements you rely on are sometimes missing.**
- *Symptom:* a bio or column rule works on one profile but not another.
- *Cause:*
  - `.user_profile.formatted` exists only when the bio is non-empty (36 of 51 profiles) [verified · crawlprofile-08].
  - On 5 of 51 profiles there is no `.columns`, `.profile_column` or `.game_column`: links and bio sit directly in `.profile_content` [verified · crawlprofile-06].
  - Profiles have no `#inner_column` id, only `.inner_column` classes, used in the header, content, purchases and every collection row [verified · crawlprofile-18, repo-30].
- *Fix:* write `#wrapper .user_profile` (never through `.profile_column`) and `#wrapper .inner_column`. Remember that widening `.inner_column` widens all of those rows.

**80. itch hides some profile parts on purpose.**
- *Symptom:* "Supported by", an author name or the name heading is missing, and a rule to show it seems needed.
- *Cause:*
  - `.purchased_games` is `display:none` unless the creator ticked show purchases (`.mode_show_purchases`) [documented · repo-61; verified · crawlprofile-16].
  - `.game_author` is hidden in the own-games grid and on `.is_owner` carousel cells [verified · crawlprofile-14].
  - A collection grid caps at 20 cells [verified · crawlprofile-16].
  - Banner profiles hide the name block, and itch's `h1` with it [verified · repo-25].
- *Fix:* don't override the creator's settings. To show the author in the own grid, use `#wrapper .user_game_grid .game_author{display:flex}` [verified · crawlprofile-14].

**81. Old CSS silently stops matching after an itch update.**
- *Symptom:* a theme that worked last year now partly does nothing. There is no error.
- *Cause:*
  - Live profile CSS still targets `.collection_list_widget` and `.antiscroll-*`, which no longer exist [observed · crawlprofile-29].
  - Only the classes and ids listed in the guide are promised stable. itch will "try to email" CSS users about major changes [documented · docs-39].
  - The guide lists no profile selectors at all [verified · docs-41].
- *Fix:* prefer documented hooks, flag the others in comments as "may break", and re-check computed styles after itch deploys.

**82. Pre-2026 jam selectors and jam `#wrapper` rules don't work.**
- *Symptom:* `.jam_page_wrap .header`, old `#wrapper` rules or `body > .jam_page_wrap` do nothing.
- *Cause:*
  - Since 2026-06-01 the jam site header is a sibling *before* `.jam_page_wrap` [verified · docs-27].
  - Jam pages had no `#wrapper` before. The migration deleted existing `#wrapper` rules [documented · docs-30].
  - Owners see `.jam_page_wrap` wrapped in `.theme_editor_columns > .theme_editor_primary_column` [documented · docs-28, crawljam-18].
  - Legacy "raw" jam pages (e.g. a 2014 jam) still lack `#wrapper` and `.jam_page_wrap` [observed · docs-51].
  - The guide's jam section only arrived between 2026-05-12 and 2026-06-13 [verified · docs-46].
- *Fix:*
  - Use plain `#wrapper …` descendant selectors, never `body >`.
  - Check that the page has `div#wrapper.jam_page_wrap > .view_jam_page` before writing jam CSS.
  - Treat jam advice older than mid-2026 as outdated.

**83. Overriding a jam's button colour leaves old shades behind.**
- *Symptom:* buttons take your colour, but hover, active, shadow, the filter underline and the "powered by" border keep the old one.
- *Cause:*
  - The generated jam theme writes hover, active, shadow and border variables as literal shades derived from the old button colour [verified · crawljam-34].
  - The filter tab border (an `!important` literal equal to the link colour), the `.itch_footer` border-top and the community-activity badge are literals that ignore the variables [verified · crawljam-08].
- *Fix:* set every button variable, then override those three explicitly, with `!important` where the theme uses it.
  ```css
  #wrapper{--itchio_button_color:#6c4cff;--itchio_button_hover_color:#7d61ff;--itchio_button_active_color:#5a3ce6;
    --itchio_button_shadow_color:#4a2fc0;--itchio_button_border_color:#4a2fc0}
  ```

**84. Jam overview parts aren't where (or what) you expect.**
- *Symptom:* `.jam_body` rules miss the entries grid, the countdown shows six empty boxes, or a banner frame appears with no banner.
- *Cause:*
  - `#entries.grid_outer` is a sibling *after* `.jam_body`, not inside it [verified · crawljam-23].
  - The server sends countdown `.block_value`s empty. JavaScript fills them and hides unused units, so without JS all six blocks show [verified · crawljam-21].
  - `img.jam_banner` is always in the DOM, without `src` when no banner is uploaded. It is shown only under `.has_banner` [verified · crawljam-25].
- *Fix:*
  - Style `#wrapper #entries` separately.
  - Gate banner decoration on `#wrapper .view_jam_page.has_banner`.
  - Style per phase with `.before_start`, `.during_submit`, `.during_voting`, `.after_voting` [verified · crawljam-20].

**85. The project buttons you styled aren't on the page.**
- *Symptom:* `#wrapper .upload .download_btn` styles nothing, or a top download button never appears on desktop.
- *Cause:*
  - Per-file `a.download_btn` exists only on `.direct_download` pages and in demo lists. All 51 sampled buy-flow pages (free and pay-what-you-want included) use `a.buy_btn` in `.buy_row` [verified · crawlproject-66, crawlproject-13].
  - On `.buy_on_top` pages `.buy_row` appears twice [verified · crawlproject-12]. `.header_buy_row` is rendered only on non-HTML5 pages [verified · crawlproject-11].
  - On `.direct_download` pages game.css shows the top download row only at ≤1000px [inferred · crawlproject-65].
- *Fix:* style all three: `#wrapper .buy_row .buy_btn`, `#wrapper .upload .download_btn` and `#wrapper .direct_download_btn`.

**86. You can't style the game, and the pre-launch screen differs.**
- *Symptom:* CSS aimed at the game's canvas or `#game_drop` does nothing.
- *Cause:*
  - HTML5 games run in a cross-origin iframe on html-classic.itch.zone [verified · community-33, crawlproject-18].
  - On click-to-launch pages `iframe#game_drop` doesn't exist until the click. Only `.iframe_placeholder` and `button.load_iframe_btn` do [documented · crawlproject-19].
  - "Big video" layouts move the trailer out of `.right_col` [verified · crawlproject-30].
- *Fix:* style only `.embed_wrapper`, `.game_frame` and the placeholder button. Use `#wrapper .video_embed`, not `.right_col .video_embed`.

**87. itch puts UI above `#wrapper` that you didn't plan for.**
- *Symptom:* a fixed custom header collides with itch's bar, or the page doesn't start at the top of the viewport.
- *Cause:*
  - During jam voting, entry pages get itch's site header and a jam banner as `body` children before `#wrapper` (7 of 7 entries in voting) [observed · crawlproject-54; verified · crawlproject-53].
  - Fundraising goal banners also sit there [verified · crawlproject-08].
  - On projects, `#user_tools` changes with width: fixed top-right above 1300px, absolute from 961 to 1300px, a strip at ≤960px, a bottom bar at ≤650px [verified · itchcss-32].
- *Fix:* don't assume `#wrapper` starts at y=0. Avoid fixed top and bottom custom elements. Never restyle those itch elements.

**88. The owner sees a different page than visitors do.**
- *Symptom:* it looks right while logged in, and the layout, heading count or tab order differ for visitors.
- *Cause:*
  - The owner gets a site header with a second `h1`, `body.has_header`, Edit theme and Dashboard buttons, `.is_owner` cells, editor wrappers around `#wrapper`, and inline `display:none` on hidden games [observed · crawlprofile-43, repo-37, a11y-21].
  - Jam owners get editor wrappers too [documented · docs-28].
  - With the editor open, `.theme_editor_primary_column` becomes the scroll container, so sticky, fixed and scroll effects differ [inferred · crawlprofile-44].
  - One creator traced a width shift to the owner's dashboard bar [community · community-30].
- *Fix:* the guide requires testing logged out [documented · docs-15, docs-48]. Judge final results in a private window. Never write `body > #wrapper`.

---

### H. Syntax that fails silently

**89. One unknown selector drops the whole rule.**
- *Symptom:* `#wrapper .a, #wrapper .b::-moz-range-thumb{…}` doesn't style `.a` in Chrome.
- *Cause:*
  - A selector list is invalid if any member is unknown to the browser [verified · support-08, localtests-32].
  - `:is()` forgives unknown pseudo-*classes* but cannot hold pseudo-*elements*: `:is(.x::before)` generates nothing [verified · localtests-52].
  - Unknown at-rules and invalid nested rules are skipped harmlessly [verified · support-08].
- *Fix:* give each vendor or new pseudo-element (`::-webkit-scrollbar-thumb`, `::scroll-marker`, `::details-content`) its own rule.

**90. A typo breaks a rule far away from the typo.**
- *Symptom:* the rule *after* a mistake stops working.
- *Cause:* [verified · localtests-42, localtests-43]
  - A `// comment` swallows the next rule's selector.
  - A stray top-level `}` kills the next rule.
  - A missing `}` turns the following rule into a nested child rule that no longer matches.
  - A declaration missing its `;` is dropped.
  - Typographic quotes in `content:“x”` drop that declaration.
- *Fix:* use only `/* */` comments and run the CSS through a linter or parser before pasting.

**91. `var()` doesn't fall back to your earlier declaration.**
- *Symptom:* `width:28px; width:var(--r)` gives `width:auto`, or `content:var(--msg)` shows nothing.
- *Cause:*
  - A `var()` that is undefined or of the wrong type makes the declaration invalid at computed-value time. The property becomes `unset`: the inherited value for colour, the initial value for width. It does not keep the previous declaration [verified · localtests-43, support-06].
  - `content:var(--x)` works only if `--x` holds a quoted string [verified · localtests-25].
- *Fix:*
  - Always give a fallback: `var(--x, 12px)`.
  - Write new syntax directly in the property, after a plain fallback declaration.
  - Quote strings meant for `content`.

**92. Feature queries that always say yes, or never match.**
- *Symptom:* an `@supports` branch applies in browsers without the feature, or a style query never fires.
- *Cause:*
  - `@supports (--x: <anything>)` is true for practically any value, so it detects nothing [verified · support-07].
  - `@container style(display:block)` never matches: style queries only test custom properties [verified · support-10]. A custom-property style query applied on a live project in Chromium 155 [verified 2026-10-16 · live-c14].
- *Fix:* test a real property, e.g. `@supports (rotate: random(0deg, 1deg))`, or `@supports selector(::scroll-marker)`.

**93. An SVG data URI shows nothing.**
- *Symptom:* a `url("data:image/svg+xml,…")` background is blank.
- *Cause:* a raw `#` (e.g. `fill='#f00'`) starts the URL fragment and truncates the SVG [verified · localtests-44, repo-17].
- *Fix:* percent-encode `#` as `%23`, plus `<`, `>`, `%` and `"`. Use single quotes inside the SVG.

**94. Your `@keyframes spin` changes itch's own spinner.**
- *Symptom:* itch's loaders or popups animate strangely, even outside `#wrapper`.
- *Cause:* keyframe names are global. itch defines `popin`, `bouncein`, `loader-left`, `loader-right`, `pulse_opacity`, `spin`, `bounce`, `drop_down`, `popout`, `heartbeat`, `intro`, `lightbox_intro` and `scroll_background`, and a same-named custom rule replaced itch's page-wide [verified · itchcss-28].
- *Fix:* prefix every keyframe name, e.g. `custom-wave`.

**95. Registered custom properties behave unexpectedly.**
- *Symptom:* children don't see a value the parent sets or animates, or a wrong value silently becomes the default.
- *Cause:*
  - A property registered with `inherits:false` isn't inherited, so children get `initial-value` [verified · localtests-23, support-17].
  - A value that doesn't match `syntax` falls back to `initial-value` [verified · support-17].
  - An *unregistered* property holding `sibling-index()` or a relative `url()` is evaluated where `var()` is used, not where it was declared [verified · localtests-51, localtests-20].
- *Fix:*
  - Register parent-driven values with `inherits:true`.
  - Register index values as `<integer>`.
  - Keep only absolute URLs in custom properties.

**96. Scroll-driven animations ignore your timeline or range.**
- *Symptom:* a reveal on scroll plays over the wrong range or not at all.
- *Cause:* the `animation` shorthand resets `animation-timeline` to `auto` and `animation-range` to `normal`. No browser accepts the timeline inside the shorthand [verified · support-20, support-55].
- *Fix:* declare `animation-timeline` and `animation-range` *after* the shorthand.

**97. `light-dark()` always returns the light colour, and form controls stay white on dark themes.**
- *Symptom:* dark variants never apply, and unstyled inputs stay bright.
- *Cause:* `light-dark()` and UA control colours need `color-scheme`, and itch declares none [verified · support-36, support-59].
- *Fix:* `#wrapper{color-scheme:dark}` (or `light dark`). It inherits to every descendant [verified · support-59].

---

### I. Browser support

**98. `random()` works for only a minority of visitors.**
- *Symptom:* per-visit random tilts, hues or star positions work in Safari but not in Chrome or Firefox.
- *Cause:*
  - Today (2026-10-14) `random()` works in Safari/iOS 26.2+ only (about 13% of global users). Chrome 155 rejects it, Chrome 156 ships it on 2026-10-20, and Firefox has it only in Nightly [verified · support-03; documented · repo-15]. On a project itch stores `random()` unchanged, and Chromium 155 doesn't apply it [verified 2026-10-16 · live-c28].
  - Safari 26.2–26.4 scoped named values (`random(--k,…)`) per element. Safari 26.5 and Chrome share them globally [verified · support-04, support-56].
  - `random-item()` is enabled in no stable browser [documented · support-05].
- *Fix:*
  - Put a constant first and the random value second in the same rule, never via `var()` (item 91).
  - Prefer unnamed `random()` calls.
  - Per-visit variety for everyone still needs an external `no-store` sheet, with the trade-offs in items 50–52.
  ```css
  #wrapper .game_cell{rotate:-1deg;rotate:random(-2deg,2deg)}
  ```

**99. The profile theme's colours disappear in older browsers.**
- *Symptom:* game-title colour, column borders or link-icon fill fall back to defaults on older Chrome or Safari.
- *Cause:*
  - The theme-editor output in `style#user_theme` uses native CSS nesting, including a bare `hr{…}` inside `.user_page{…}` [verified · docs-58, repo-22].
  - Browsers without nesting (Chrome <112, Firefox <117, Safari <16.5) drop all nested theme rules. Chrome 112–119 and Safari 16.5–17.1 drop `hr{…}` and what follows it inside `.user_page` [inferred · crawlprofile-33, itchcss-05].
- *Fix:* restate the theme colours your design depends on in flat `#wrapper` rules. Keep essential custom rules un-nested if old browsers matter [verified · community-38].

**100. Chromium-only features fail silently in Safari and Firefox.**
- *Symptom:* the effect works in Chrome only, and the declaration simply vanishes elsewhere.
- *Cause:* these are Chromium-only (or nowhere) as of 2026-10-14:
  - `if()` [verified · support-09] and `@function` [verified · support-39]
  - `interpolate-size` and `calc-size()` [verified · support-25]
  - `corner-shape` [verified · support-44]
  - `::scroll-marker` and `::scroll-button()` [verified · support-40]
  - scroll-state queries and `reading-flow` [verified · support-46]
  - typed `attr()`, missing in Safari [verified · support-38]
  - `@supports at-rule()`, missing in Safari [verified · support-50]
  - `@custom-media` and `@mixin`, shipped nowhere [verified · support-49]

  WebKit trunk has several of these on, but Safari 27 doesn't [documented · support-57].
- *Fix:* write a plain declaration first and the new one second. Put new pseudo-elements in their own rules (item 89). Treat these as polish only.

**101. Frosted glass shows no blur in older Safari.**
- *Symptom:* cards are translucent but unblurred on iOS 17 and older.
- *Cause:*
  - Safari 9–17 needs `-webkit-backdrop-filter`, while Chrome rejects the prefixed name [verified · support-31, a11y-42, localtests-47].
  - WebKit bug 297620 reports `backdrop-filter` ignored when it uses `var()` in Safari 18.x on macOS 14 [verified · support-31].
- *Fix:* write both, with literal values: `-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)`. Choose the background alpha so text passes contrast even with no blur [verified · a11y-42].

**102. A scroll reveal leaves content invisible.**
- *Symptom:* cards stay at `opacity:0` in browsers without scroll-driven animations.
- *Cause:* `animation-timeline` works in Chrome 115+ and Safari 26+. Firefox 158 has it only in Nightly, and 159 ships it on 2026-10-27 [documented · support-19].
- *Fix:* keep the element's base style as its finished, visible state. Put the reveal inside `@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){…}}` [documented · support-19].

**103. View transitions between your pages don't fire.**
- *Symptom:* `@view-transition{navigation:auto}` has no effect.
- *Cause:*
  - Both the old and the new page must contain the rule.
  - Navigations to other creators' subdomains or to `itch.io/jam/…` are cross-origin and never animate.
  - Firefox has no support.
  - Whether it fires on live itch pages is untested [inferred · support-21]. On a project itch stores the rule and Chromium 155 parses it as a `CSSViewTransitionRule`; whether a navigation animates was not tested [verified 2026-10-16 · live-c19].
- *Fix:* add it top-level in the box (the CSS also applies to devlogs). Treat it as optional polish.

---

### J. Accessibility

**104. The page ends up with zero, or several, `h1`s.**
- *Symptom:* screen-reader users find no page heading, or several competing ones.
- *Cause:*
  - **Profile:** custom rules such as `#wrapper .text_header>h1{display:none}` hide itch's name `h1`, and itch hides it itself on banner profiles, whose banner `img` has no `alt` [verified · a11y-04, repo-25; observed · a11y-05].
  - **Projects:** itch hides the title `h1` with a banner (`.header.has_image h1`) or an embedded game. With a banner, the `img alt` carries the title. Embed pages without a banner have nothing [verified · a11y-06, itchcss-45, crawlproject-10].
  - **Jams and devlogs** can have two to four `h1`s: itch's logo `h1`, the hidden project title, the post or jam title, and author `h1`s inside descriptions [observed · a11y-07, a11y-08, a11y-55; verified · itchcss-54; observed · crawljam-46].
- *Fix:*
  - On profiles, keep exactly one exposed `h1`: a bio `<h1 class="custom-…">` survives the sanitizer [verified · repo-26; verified 2026-10-16 · live-a20, live-t23].
  - Never hide `#wrapper .header img` on projects.
  - Don't hide `.jam_title_header` or a devlog `.post_header h1`.
  - Start your own description headings at `h2` where a title already exists.

**105. A letter-by-letter title is read as "M i r o".**
- *Symptom:* a per-letter animated name is announced spelled out, or makes the page scroll sideways on phones.
- *Cause:*
  - Per-letter `translate`/`rotate` needs `display:inline-block` spans, and Chrome then builds the accessible name with spaces between letters [verified · a11y-12, repo-59, repo-44].
  - A `nowrap` title sized `clamp(3rem,…)` overflowed 320px when the browser's default font was 32px [verified · a11y-31].
- *Fix:*
  - Put the word in a visually hidden `<span class="custom-sr">` and render the letters from `::before` with empty alt. Engines without alt syntax will read the word twice [verified · a11y-13].
  - Size the name with `min(10vw,6rem)` and keep it on one line. `white-space:normal` splits it mid-word [verified · a11y-56].

**106. Decorative glyphs are read aloud, sometimes twice.**
- *Symptom:* a screen reader says "Link arrow", or "NEWOLD" for a replaced label.
- *Cause:*
  - `::before`/`::after` text joins the accessible name in Chrome, although MDN says generated content isn't in the accessibility tree [verified · a11y-09, a11y-57].
  - Image-replacement tricks (`font-size:0` + `::before` label) make both strings read [verified · a11y-11].
- *Fix:* give decoration empty alt text, with a plain fallback line first. Supported in Chrome 77, Firefox 128 and Safari 17.4 [verified · a11y-10, repo-51, support-28]. On a project itch stores `content:"x" / ""` unchanged and Chromium 155 applies it [verified 2026-10-16 · live-c27].
  ```css
  #wrapper .custom-star::before{content:"\2605";content:"\2605" / ""}
  ```

**107. "Hidden" text is still announced, or text you meant to keep is not.**
- *Symptom:* transparent or faded text is read out, or text you only wanted visually hidden disappears for screen readers.
- *Cause:*
  - In Chrome's accessibility tree, `opacity:0`, `color:transparent`, `font-size:0`, `text-indent:-9999px` and clip "sr-only" text stay exposed. `display:none` and `visibility:hidden` remove it [verified · a11y-03, support-29].
  - Transparent text is also copied and selectable [verified · localtests-33].
  - Switching a widget from `visibility:hidden` to `color:transparent` kept its real text announced [verified · repo-41].
- *Fix:* hide decoration with `display:none`. Keep accessible-but-invisible text with the clip pattern. Use `color:transparent` only when the DOM text *should* be read.

**108. Forced-colors (Windows contrast) mode breaks transparent-text and shadow-only designs.**
- *Symptom:* hidden marker text reappears over other text, card edges vanish, and gradient decorations disappear.
- *Cause:*
  - Forced colors repaint `color:transparent` text in CanvasText (a greeting roller showed "¡Hola!Hi!" overlapping the text) [verified · a11y-27].
  - Gradients, `box-shadow` and `text-shadow` are removed, while `url()` images stay [verified · a11y-26, a11y-28].
  - Gradient text stayed readable in Chrome [verified · a11y-29].
  - itch's own spoilers reveal plain text [verified · a11y-54].
- *Fix:*
  - Give cards a real (even transparent) `border`.
  - Never build focus rings from `box-shadow` alone.
  - Add a small `@media (forced-colors:active){…}` fallback for transparent-text widgets.
  - Don't let descendant rules (`#wrapper .formatted_description *{color:…}`) touch `.spoiler`; use `:not(.spoiler)` [verified · a11y-49].

**109. Keyboard focus is nearly invisible on dark themes.**
- *Symptom:* tabbing through a dark page shows almost no ring.
- *Cause:*
  - itch keeps the UA ring but colours it `--itchio_input_focus_color` (`#361275`), about 1.1–1.5:1 against dark blues [verified · a11y-15, a11y-16].
  - `.button:focus{outline-color:#361275}` is hardcoded, so overriding the variable recolours links but not buttons [verified · a11y-58, itchcss-25].
  - itch removes the ring on spoilers and disabled buttons [verified · itchcss-25].
- *Fix:* an ID-scoped rule wins without `!important` [verified · a11y-53, a11y-58].
  ```css
  #wrapper :is(a,.button):focus-visible{outline:3px solid #ffc857;outline-offset:3px}
  ```

**110. The focus ring on game-card titles is cut off.**
- *Symptom:* only the right and bottom edges of the ring show.
- *Cause:* `.game_grid_widget .game_cell .game_title` has `overflow:hidden` for its 2-line clamp [verified · a11y-17].
- *Fix:* draw the ring on the card instead. It follows `border-radius` [verified · a11y-17].
  ```css
  #wrapper .game_cell:focus-within{outline:3px solid #ffc857;outline-offset:3px}
  ```

**111. Hover-only effects fail for keyboard and touch users.**
- *Symptom:* keyboard users never see a card's reveal, and on phones a tapped card stays "lifted".
- *Cause:*
  - Keyboard users skip thumbnails (`tabindex="-1"`) and focus title and author links, so `.game_cell:hover` never fires for them [verified · a11y-18].
  - With touch emulation, one tap left `:hover` stuck on the card [verified · a11y-36].
- *Fix:* pair `:hover` with `:focus-within`, never hide information behind hover, and gate hover motion.
  ```css
  @media (hover:hover) and (pointer:fine){#wrapper .game_cell:is(:hover,:focus-within){translate:-4px -4px}}
  ```

**112. A reduced-motion block misses some animations, or leaves content invisible.**
- *Symptom:* with "reduce motion" on, a star layer or a `::after` still animates, or the bio stays transparent.
- *Cause:*
  - `#wrapper *, #wrapper *::before` does not match `#wrapper` itself, `#wrapper::before/::after` or descendant `::after`. One such layer kept twinkling [verified · repo-50, a11y-23].
  - itch's own CSS has no reduced-motion queries at all [verified · a11y-14, itchcss-26].
  - Only 5 of 62 live pages honour it [observed · corpus-37].
  - If an element's base style is `opacity:0` and an animation reveals it, `animation:none` leaves it invisible [verified · a11y-24].
- *Fix:* animate *from* hidden states and never set them as the base style. Also null hover transforms inside the block. [verified · a11y-23]
  ```css
  @media (prefers-reduced-motion:reduce){
    #wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{
      animation:none!important;transition-duration:.01ms!important;transition-delay:0s!important}}
  ```

**113. Endless decorative motion fails WCAG 2.2.2 even with reduced-motion support.**
- *Symptom:* an infinite title wave or twinkle runs for every visitor who hasn't set the OS preference.
- *Cause:* SC 2.2.2 (Level A) requires pause/stop/hide for auto-starting motion longer than 5 s shown alongside other content. The Understanding document doesn't accept `prefers-reduced-motion` as meeting it, and itch allows no JS for a pause button [documented · a11y-25].
- *Fix:* prefer finite runs that stop within 5 s. Never blink. itch's quality guidelines cite WCAG's seizure rules and may delist pages with flashing imagery [documented · docs-16].

**114. Contrast is checked against the wrong background.**
- *Symptom:* text passes against the theme BG colour but is hard to read over the background image or on light themes.
- *Cause:*
  - Over a theme image, check the brightest region. `#eef3ff` is 16.3:1 on `#0b1433` but 4.52:1 on a `#3d6fba` highlight, and gold `#ffc857` drops to 3.26:1 [verified · a11y-41].
  - The profile theme derives secondary text by alpha. `.game_genre` at 50% scored 3.59:1 on a translucent card [verified · a11y-38].
  - itch's default accent `#fa5c5c` is 3.11:1 on white. 16 of 44 popular projects had sub-4.5 link contrast [observed · a11y-39]. A jam theme used `#8c8c8c` on white (3.36:1) with `!important` [observed · a11y-40].
- *Fix:*
  - Composite your panel alpha over the image's lightest pixels and target ≥4.5:1.
  - Override weak theme colours with `#wrapper` rules, adding `!important` on jam literals.
  - A `rgba(10,18,46,.5)` card raised those ratios to 9.17:1 and 6.63:1 [verified · a11y-41].

**115. Text selection reveals hidden text, or is blocked.**
- *Symptom:* selecting a sentence paints a hidden marker in the selection colour, or visitors can't select text at all.
- *Cause:*
  - A page-wide `#wrapper ::selection{color:…}` overrides `color:transparent` [verified · a11y-48].
  - Some community themes set `user-select:none` across the profile [community · community-40].
- *Fix:* add `.custom-x::selection{color:transparent;background:transparent}` to transparent-text widgets. Keep `::selection` itself legible (`#0b1433` on `#ffc857` is 11.75:1) [verified · a11y-48]. Never block selection, and never set `touch-action:none` on large containers, since pinch zoom is allowed [verified · a11y-35].

**116. Some accessibility problems can't be fixed from CSS.**
- *Symptom:* audits flag errors your CSS didn't cause.
- *Cause:*
  - Thumbnail links have empty or "GIF" names, cover `img`s and profile banners have no `alt` [verified · a11y-19].
  - Logged-out profiles are always `<html lang="en">` [observed · a11y-52].
  - The jam skip link targets a missing `#maincontent` until itch's JS retargets it [documented · itchcss-34; observed · a11y-08].
- *Fix:* report these as platform issues. Don't hide thumbnails to "fix" them: they are already out of the tab order [verified · a11y-19].

**117. Text-size settings expose fixed heights.**
- *Symptom:* with a larger default font, or WCAG 1.4.12 spacing, a widget clips its text.
- *Cause:*
  - itch sizes its own UI in `px`, so the browser font setting scales only your `rem`/`em` text [verified · a11y-32].
  - The 1.4.12 override clipped only a fixed-height roller with `overflow:hidden` on a real profile [verified · a11y-45].
- *Fix:* avoid fixed em/px heights plus `overflow:hidden` on text containers. Test with a 32px default font and at 320px width [verified · a11y-31].

---

### K. Testing, tooling and research

**118. Agent accessibility tools don't show what a screen reader announces.**
- *Symptom:* an AI agent "verifies" a heading's name or a hidden text, and the result is wrong.
- *Cause:*
  - `read_page` and `find` include `display:none`, `visibility:hidden` and `aria-hidden` text, and ignore `::before/::after` and its alt text [verified · localtests-34; observed 2026-10-12 · repo-52].
  - Page JS has no AOM `computedName` either [verified · localtests-34].
- *Fix:* use DevTools' Accessibility pane, CDP `Accessibility.getPartialAXTree`, or a real screen reader [verified · a11y-50].

**119. The agent's preview pane distorts time, motion and viewport.**
- *Symptom:* animations look frozen or jump, and reduced-motion or `dvh` behaviour seems wrong.
- *Cause:*
  - In a hidden pane `requestAnimationFrame` never fires, and new transitions stay pending at their start value [verified · localtests-36].
  - `prefers-reduced-motion` can't be emulated [verified · localtests-35].
  - `100vh`, `dvh`, `svh` and `lvh` are all equal [verified · localtests-48].
  - Widths under 768px emulate a touch device without hover [verified · localtests-35; observed 2026-10-12 · repo-54].
- *Fix:* pause animations (`animation-play-state:paused` plus a negative delay, or `Animation.currentTime`), read computed values, and test hover at ≥768px. Check reduced motion and mobile toolbars on real devices.

**120. A local test harness gives false passes.**
- *Symptom:* CSS works in the harness and fails on itch, or the reverse.
- *Cause:*
  - A doctype-less harness runs in quirks mode and accepts same-origin `text/plain` CSS; itch pages are standards-mode UTF-8 [verified · localtests-14, localtests-49; observed · localtests-55].
  - A stale `user_theme` snapshot gives wrong theme colours [observed · repo-53].
  - Stripping scripts freezes JS state: the Follow button keeps `.hidden` (opacity 0) and covers keep `data-lazy_src` [verified · a11y-20, a11y-50].
  - A 200 in the network log doesn't prove an imported sheet applied [verified · localtests-10].
  - Colours from `color-mix()` serialise as `color(srgb …)` [verified · localtests-46].
- *Fix:*
  - Copy the doctype, `<meta charset>`, head order and skeleton exactly.
  - Re-export the theme block, and serve a second origin for third-party tests.
  - Verify with computed styles, normalising colours before comparing.

**121. Crawls count error pages as "no custom CSS".**
- *Symptom:* statistics say a page has no CSS when it does.
- *Cause:*
  - itch answers `429 Too Many Requests` (openresty, about 568 bytes, no Retry-After) even at 5–30 s spacing, because the budget is shared per IP [verified · corpus-38, crawlproject-52, crawlprofile-47; observed · repo-55, crawljam-39].
  - Cloudflare sometimes serves a 200 "Just a moment..." page [observed · external-52].
  - This section's own check hit a 429 at about 13 s spacing (Section notes).
- *Fix:* check every status code and require a page marker (`#wrapper`, `view_game_page`, `user_page`). Space requests 10 s or more, and back off 30–120 s on a 429.

**122. Scripts that parse itch HTML break between fetches.**
- *Symptom:* an extractor that worked in the morning returns nothing in the afternoon.
- *Cause:*
  - Attribute order and class-token order change between renders: `<style id="custom_css" type="text/css">` became `<style type="text/css" id="custom_css">` [verified · corpus-43, crawljam-41, repo-58].
  - `curl -L` hides a 302 from `<user>.itch.io` to `itch.io/profile/<user>` [verified · crawlprofile-20].
  - Unknown subdomains answer 404 with `data-page_name="user"` [verified · crawlprofile-52].
- *Fix:*
  - Match loosely, e.g. `<style\b[^>]*\bid="custom_css"[^>]*>`. Never write CSS attribute selectors on the class string.
  - Read the first status line yourself rather than following redirects blindly [verified · crawlprofile-58].

**123. The `?<number>` on itch's stylesheets is not a CSS version.**
- *Symptom:* you think itch changed its CSS because the URL changed, or you hardcode the number.
- *Cause:* the query is a site-wide deploy stamp. It changed twice on 2026-10-14 while user/game/jam/main.css stayed byte-identical [verified · itchcss-01, crawlproject-64, a11y-59, crawlprofile-48; observed · community-51, repo-65].
- *Fix:* cite itch CSS without the query. Detect real changes by content hash, ETag or Last-Modified.

**124. Docs, offline copies and version numbers mislead.**
- *Symptom:* an AI cites the guide for things it never says, or reasons in stale browser versions.
- *Cause:*
  - The guide says nothing about `@import`, size limits, animations, `!important` or reduced motion [verified · docs-38; documented · corpus-41].
  - An offline copy of the guide may omit the "Getting CSS access" section [verified · docs-45].
  - Chrome, Edge and Firefox now ship a major version every two weeks [documented · support-01].
- *Fix:* label such knowledge as observed or community, not documented. Re-fetch the guide before quoting. Reason with feature detection and Baseline status rather than "requires Chrome N".

---

### Section notes

**New evidence gathered for this section (2026-10-14, about 13:40 UTC).** Facts crawlproject-05 and crawlprofile-02 seemed to disagree on whether widget ids change per request. To check, I fetched one project page twice and one profile twice, logged out, with a Chrome User-Agent. That is four itch requests, 12–13 s apart, with raw copies kept in the scratchpad only:

```
curl -sS --compressed -A '<Chrome 155 UA>' -D projN.hdr -o projN.html https://adamgryu.itch.io/a-short-hike
curl -sS --compressed -A '<Chrome 155 UA>' -D profN.hdr -o profN.html https://mirokshi.itch.io/
```

| Fetch | Date (GMT) | Status | `X-Cache-Status` | Widget id | `custom_css` |
|---|---|---|---|---|---|
| project 1 | 13:40:36 | 200 | `MISS` | `view_game_1752651` | 533 chars, sha1 `b3277f0e3dc2` |
| project 2 | 13:40:49 | 200 | `MISS` | `view_game_6891869` | 533 chars, sha1 `b3277f0e3dc2` |
| profile 1 | 13:41:02 | **429** | n/a | n/a | n/a |
| profile 2 | 13:41:15 | 200 | `HIT` | `user_9328277` | (not compared) |

- The project page was rendered fresh each time: new ids, identical CSS.
- The profile came from the server-side page cache.
- Ids are random per render on both page types. How long one id stays visible depends on caching (item 78).
- The 429 came about 13 s after this session's previous itch request, which supports the shared per-IP budget (item 121).

**Conflicts resolved:**
- **Widget ids:** "change on every request" (crawlproject-05, crawljam-22) and "stable for a few minutes" (crawlprofile-02, crawlprofile-46) are both right, for different page types (table above).
- **Size caps:**
  - Profile: an admin said "5kb", and creators cite 5,120. Live probe Run 4 (2026-10-16) settled the unit and the behaviour: 5,120 UTF-8 bytes after trimming both ends, comments included; over it the save is refused with an error, never truncated (live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a to live-cap-A3c). Every section uses one sentence. Budget: ≤ 5,120 UTF-8 bytes after trimming leading and trailing whitespace, comments included.
  - Jam: "20kb". The live 20,410 vs 20,411 figures differ only by the single space itch appends after jam CSS (corpus-09). Not measured at the boundary.
  - Project: once disputed. Large live sheets exist (corpus-07, crawlproject-47), and a 2026 host claimed 5,120 now applies (community-08, docs-33). Run 4 settled it against the host: there is no CSS cap; 659,742 characters saved, and larger saves fail as a request with "missing token" (live-cap-B1, live-cap-B2). Item 41 now says so.
  - Bio: one creator's 5,000 characters is confirmed for the submitted HTML, and what itch adds when serving doesn't count (live-cap-D1, live-cap-D2). Item 73 now says so.
  - Size advice: this section used to say "write non-ASCII as `\hex` escapes" and keep counts "under about 5,000", which contradicted `01-how-it-works.md` §3. The arithmetic and a measurement agree with 01: raw UTF-8 is smaller in characters, bytes and UTF-16 units (gapfill09-01). Item 40 now says so.
- **Minifier advice:** item 44 used to recommend "lightningcss, csso" without a test. Tested on 2026-10-14 (gapfill09-04 to gapfill09-18), both turned out risky with default settings. csso deletes nesting, range media queries and an `@import` after `@layer`. lightningcss without targets drops fallbacks. The recommendation is now `esbuild --minify --charset=utf8`, which is verified in Chromium only.
- **Line endings:**
  - Profile sheets have 0 CR (crawlprofile-26, corpus-03; a live profile save on 2026-10-16 stored 0 CR for 52 LF, live-css). Project sheets are CRLF (docs-57, corpus-03; a live save on 2026-10-16 stored 52 CR for 52 LF, live-css).
  - Jams look LF-only in one 12-jam sample (crawljam-28), but 4 of 24 multi-line jam sheets in another sample are CRLF (corpus-48). The same host's sheet is CRLF on its 2025 jam and LF on its 2026 jam, so the format depends on when the sheet was saved.
- **`</style>` in the box:**
  - The client preview strips only the first match (repo-05, community-31).
  - One live page was served without its `</style>` (crawlprofile-25).
  - On a project and on a profile every occurrence is removed, in any case and with inner whitespace, inside comments and strings (live-c42, live-c43, live-c44). Jams are untested. The advice is the same in every case: never include it.
- **Jam `body` background:** the revamp post says `body` no longer carries the jam background, yet live generated CSS still sets `body{background-color}` (docs-27). Only the colour is on `body`. Images, text colour and fonts are on `.jam_page_wrap`, which paints over `body`.
- **Follow button visibility:** a script-stripped harness showed it at opacity 0. itch's JS removes `.hidden` after 200 ms, and `.hidden` only applies at ≥960px, so real visitors see it (a11y-20). Item 120 treats the harness result as an artefact.
- **"FOUC" from `@import`:** a community README warns of FOUC. The HTML spec and a lab test show render-blocking, i.e. a delayed first paint (community-11, external-07).
- **Jam skip link:** "no `#maincontent`, don't rely on it" (a11y-08) and "bundle.min.js retargets it" (itchcss-34) are both right. The link is dead only without JavaScript.
- **`@import` placement:** older wording allows only `@charset` and `@layer` statements before `@import`. The current css-cascade-5 draft also exempts `@supports`-condition rules (external-03). Item 47 gives the safe rule: imports first.
- **The `custom-` prefix:** the guide requires `custom-`, but `custom_x` and hyphen-less `customa` classes were seen surviving (sanitizer-04, community-19, corpus-36). Live probe Run 1 (2026-10-16) showed why: on a project description the filter is a case-sensitive prefix test on `custom` (live-k01 to live-k21), and Run 2 found the same in a bio (live-k01, live-k05, live-k07, live-k09, live-k11, live-k14, live-k16, live-k26). Item 62 still follows the guide.
- **Inline styles in HTML:**
  - Library analysis says only 27 properties and strict syntax survive (sanitizer-21/22/23).
  - A CSS-enabled profile kept simple properties (community-18).
  - A moderator claims inline CSS is stripped entirely without CSS access.
  - All three are stated in item 67. Accounts without CSS access are untested.
  - Live probe Run 1 (2026-10-16), on a CSS-enabled account's project description, matched the library on every property tested, except that a line break inside `style` drops the whole attribute (live-s01 to live-s31). Run 2, on the same account's profile bio, matched on its four style probes (live-s02, live-s08, live-s11, live-s18).
- **Generated content and accessibility:** MDN says generated content is not in the accessibility tree. Chrome 155 includes it in accessible names (a11y-57). Item 106 follows the measured behaviour.
- **Background shorthand:** it wipes the theme image (crawljam-10), yet itch's jam migration guide uses it. It is correct only when you supply your own image (item 19).
- **Brave blocking:** the blocking was observed (repo-14, community-36), but no Brave default list rule matches the URL (external-27). The cause is unexplained, and items 52 and 72 treat blocking as a risk to design around.
- **Nesting fallout in older browsers:** the corrected crawlprofile-33 and itchcss-05 agree. Browsers without nesting drop every nested theme rule. Partial-support Chrome 112–119 and Safari 16.5–17.1 drop `hr{…}` and the rest of the `.user_page{}` block, and keep the separate game-cell block.
- **External-link badge vs click-to-activate on devlogs:** the badge is a game.css rule and applies to devlog `.user_formatted` bodies (docs-14, sanitizer-08). Click-to-activate iframes do not apply on devlogs (sanitizer-25). These are two different features.
- **Safe crawl spacing:** thresholds from 4 s to 30 s were reported (crawljam-39, corpus-38, crawlproject-52, crawlprofile-47). The budget is shared per IP (repo-55, plus this section's own 429), so item 121 advises ≥10 s plus backoff.

**Limits of this section:**
- Firefox and Safari behaviour was not tested for most rendering traps (items 22–28, 108–110).
- Real screen-reader output (NVDA, JAWS, VoiceOver) was not tested; only Chrome's accessibility tree was.
- Sanitizer rules marked *inferred* come from the open-source library itch appears to use, not from saving content on itch. Tags `[verified 2026-10-16 · live-…]` come from the owner's live probe runs in Brave 155 = Chromium 155: Run 1 on a draft project (description and Custom CSS, owner logged in) and Run 2 on the profile (its bio with the 33-probe bio set, and its Custom CSS; read logged in and logged out). Run 4 (`live-cap-…`) measured the size caps of the profile's CSS and bio and of the draft project's CSS. They hold for projects unless the text names bios or profiles too. The jam cap was not measured.
