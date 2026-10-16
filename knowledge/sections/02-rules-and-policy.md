## Hard rules and policy

This section covers every rule that constrains custom CSS on itch.io. For each rule it says **who or what enforces it**:

| Enforcer | What it means | Example |
|---|---|---|
| **Software** (itch) | itch's server, editor or HTML sanitizer acts automatically | An HTML class that doesn't start with `custom` is stripped |
| **Browser** | The visitor's browser acts | An `http://` stylesheet is blocked on the `https://` page |
| **Policy** (staff) | Nothing stops you technically; itch staff can act afterwards | Unscoped selectors that restyle the site header |

**Three things an AI must internalise before writing itch CSS:**

1. **itch serves custom CSS as typed.** It does not add a `#wrapper` prefix, filter selectors or rewrite scope **[verified 2026-10-14 · crawlprofile-28, crawlproject-48, crawljam-16, corpus-16]**. On a project and on the profile the only changes are deleting every `</style>` and trimming whitespace at both ends; the project also stores line breaks as CRLF, the profile as LF **[verified 2026-10-16 · live-css, live-c42, live-c43]**. Almost every CSS rule below is therefore *policy*: the software will not catch your mistake.
2. **"It works on a live page" proves nothing.** About 87.5% of the top-level selectors served on 62 live pages break the `#wrapper` rule **[verified 2026-10-14 · corpus-16]**. Never copy a pattern because it is common.
3. **Sanctions are human and after the fact.** They include removal of CSS access, suspension of CSS access or the account, termination under the Terms of Service, removal of impersonating content, and delisting from discovery **[documented · docs-10, docs-12, docs-13, s02-n3]**.

### Rule index

| # | Rule (as an instruction) | Enforced by | If ignored | Evidence |
|---|---|---|---|---|
| S1 | Have the CSS editor granted to your account first | Software gate, manual staff approval | There is no CSS field to paste into | documented · sanitizer-39, s02-n1 |
| S2 | Expect custom CSS only on project pages (plus devlogs), jam overviews and profiles | Software (where itch emits the CSS) | CSS is never loaded elsewhere | verified · docs-05 |
| S3 | Start every class you author in page **HTML** with `custom-` | Software (HTML sanitizer) | Class stripped; your selector matches nothing | documented · repo-56, s02-n1; verified 2026-10-16 (project description; bio subset) · live-k01 to live-k21 |
| S4 | Fit the page type's size cap | Software (check on save) | CSS can't be saved: the save is refused with an error, never truncated (profile) | documented · repo-60, s02-n4; verified 2026-10-16 (profile, project) · live-cap-A1, live-cap-A2c, live-cap-B1, live-cap-B2 |
| S5 | Leave itch's anti-scam markup working | Software adds it; policy protects it | The external-link warning is disguised (P6) | verified · itchcss-46; documented · sanitizer-39 |
| B1 | Write `https://` in every `url()` and `@import` | Browser (mixed-content blocking) | The resource silently fails to load | documented · s02-n5; verified · s02-n6 |
| P1 | Scope every selector under `#wrapper` | **Policy** (not enforced) | Site header, toolbar or dialogs get restyled; CSS access at risk | documented · docs-09; verified not enforced · corpus-16 |
| P2 | Never alter itch's built-in UI | **Policy** (access agreement) | CSS access may be removed | documented · a11y-02, community-23 |
| P3 | Never hide or obscure the footer links | **Policy** | Breaks an explicit guide rule | documented · docs-11 |
| P4 | Host external images and fonts on a reliable HTTPS host, or Base64-embed them | **Policy** (advice) + browser | Missing fonts and images | documented · external-36 |
| P5 | Enhance existing components; don't rebuild the page | **Policy** (advice) | Silent breakage when itch updates | documented · docs-40, community-25 |
| P6 | Never trick visitors or misrepresent itch's interface | **Policy** (guide + ToS §3) | CSS access and possibly the account suspended; account termination | documented · docs-10, docs-12 |
| P7 | Never impersonate another creator or company | **Policy** (quality guidelines) | Content removed; account suspended or terminated | documented · docs-13 |
| P8 | Keep the page accessible; test on mobile and logged out | **Policy** (access agreement) | Breaches the terms you accepted | documented · a11y-01, a11y-02 |
| P9 | Never track visitors, or read form fields, through CSS requests; escape anything a CSS service reflects | **Policy** (ToS §3) | ToS violation; injected rules | documented · external-33; verified · gapfill02-04 |
| P10 | No flashing or obnoxious material | **Policy** (quality guidelines) | Delisting from browse and search | documented · s02-n3 (applying it to CSS is inferred) |
| P11 | Embed only fonts and images you may distribute | **Policy** (ToS §3) | ToS violation | documented · s02-n2 (applying it to CSS is inferred) |
| P12 | Follow the terms of whatever host serves your external CSS | Third-party policy | Action by the host | inferred · external-23 |

---

### 1. Rules enforced by software or the browser

#### 1.1 S1: the access gate

- **The editor is off by default.** CSS customisation is enabled per account on request, and itch does not grant it to empty accounts **[documented · s02-n1, sanitizer-39]**.
- **Why itch restricts it.** Custom CSS makes it harder for itch to upgrade pages without breaking custom layouts, and itch expects responsible use **[documented · s02-n1]**. An admin also said user HTML and inline CSS are deliberately restricted for security reasons **[documented · sanitizer-39]**.
- **The access request asks for four things** **[documented · a11y-02, s02-n1]**:
  1. confirm that the theme editor can't already do what you want;
  2. briefly describe the kinds of changes;
  3. confirm the page will stay accessible and won't be made hard to operate or read;
  4. confirm you won't alter itch's built-in UI and will scope every change to the visuals of your own page content.
- **Treat items 3 and 4 as binding.** They are the agreement your CSS is later judged against. P2 and P8 below expand on them.

#### 1.2 S2: where custom CSS exists

| Surface | Custom CSS served? | Evidence |
|---|---|---|
| Project page | Yes | documented · docs-05; verified 2026-10-16 · live-css |
| Devlog index and devlog posts; project `/comments` | Yes. It is the same sheet as the project's. | documented · docs-05; observed · s02-n7 |
| Jam overview page (`/jam/<slug>`) | Yes | documented · docs-05 |
| Jam `/entries`, `/results` | **No.** The host's CSS is not loaded there. | observed · s02-n7 |
| Profile page (`<user>.itch.io`) | Yes | documented · docs-05; verified 2026-10-16 · live-css |
| A project's `/community` board, `/purchase` popup, AMP devlog mirror | **No** | observed · s02-n7 |
| Collections, top-level `/blog` posts, `/updates` posts, forum topics | **No.** No `style#custom_css` and no `#wrapper`. | verified 2026-10-14 · docs-05 |

- **The guide lists exactly three surfaces:** project pages (including devlog posts), jam pages and profile pages. The list has been unchanged since at least 2019, apart from the devlog note added in 2021 **[verified · docs-05]**.
- **Never promise a creator CSS on a "No" surface.**

#### 1.3 S3: HTML classes must start with `custom-`

- **The rule.** Any class you put in page HTML (project description, profile bio, jam content) must begin with `custom-`. The sanitizer strips any other class **[documented · repo-56, s02-n1]**.
- **What survives in practice.** In 91 live user-content containers, the only surviving class tokens were:
  - `custom-*`;
  - `custom_*`, seen on one page;
  - the rich-text editor's own `text-center` and `text-justify`. **[observed · s02-n7]**
  
  Always write the documented `custom-` form anyway.
- **What the filter actually tests (project description).** A case-sensitive prefix: every token that starts with lowercase `custom` survives, whatever follows (`customer`, `custom_d`, a bare `custom-`, `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2`, `custom-café`). `Custom-a`, `CUSTOM-b`, `-custom-f`, `md:custom-g`, `!custom-h` and `xcustom-i` are dropped. itch's `text-center`, `text-right`, `text-justify` and `spoiler` survive, `text-left` doesn't **[verified 2026-10-16 · live-k01 to live-k25, live-k34]**. A profile bio gave the same result on the tokens tested there (`customer`, `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2` and `custom:flex` kept; `Custom-a`, `-custom-f` and `foo` dropped) **[verified 2026-10-16 · live-k01, live-k05, live-k07, live-k09, live-k11, live-k14, live-k16, live-k26]**. Devlog posts and jam descriptions are untested.
- **This rule constrains HTML, not CSS.** Your selectors may target itch's own classes (`.game_cell`, `.user_profile`, …). Whether those classes stay stable is a separate matter (P5).
- **Keep editing as HTML once you start.** The guide warns that the rich-text editor may rewrite markup and strip tags you added **[documented · s02-n1]**.

```html
<p class="custom-tagline">Hand-made games</p>   <!-- class kept -->
<p class="tagline">Hand-made games</p>          <!-- class stripped -->
```

```css
#wrapper .custom-tagline { letter-spacing: .05em; }
```

#### 1.4 S4: the size cap

| Page type | Cap | Evidence |
|---|---|---|
| Profile | **5,120 UTF-8 bytes**, after trimming leading and trailing whitespace, comments included. The error says "characters", but 2,603 `é` (5,120 bytes) saved and 2,604 (5,122 bytes) were refused. Over the cap the save is refused with an error lightbox, never truncated. An admin (2023-04-29) called it "5kb" and, asked to raise it, answered "Probably not". | verified 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a to live-cap-A3c; documented · repo-60 |
| Jam | **20 KB** since 2026-06-02. Jam CSS had no limit before the June 2026 revamp. Not measured at the boundary. | documented · s02-n4 |
| Project / devlog | **No CSS cap.** 659,742 single-line ASCII characters saved whole on a draft project; larger saves fail with "missing token", a request-size failure rather than a CSS rule. The admin said in 2023 that game pages "might" lack the size check; a jam host's June 2026 claim of a 5,120-character cap "consistent with profile and project pages" does not hold. | verified 2026-10-16 · live-cap-B1, live-cap-B2; documented · repo-60; community · s02-n4 |

- **The official guide documents no limit** (and nothing about `@import`) **[documented · corpus-41, repo-56]**.
- **Base64 costs space.** Base64-embedded fonts and images count toward the cap. Staff advise linking resources hosted elsewhere instead **[documented · repo-60]**.
- **Budget for the smallest cap.** Generate CSS for the profile cap unless you know the page type allows more; projects and devlogs have no CSS cap **[verified 2026-10-16 · live-cap-B1]**. Precise measurement belongs to the editor section.

#### 1.5 S5: itch's anti-scam markup (added by software, protected by policy)

- **Description links are marked server-side.** On project and devlog pages they are served with `rel="nofollow noopener"` **[verified · itchcss-46]**. On a project description, off-site links get `rel="nofollow noopener" referrerpolicy="origin"`, replacing any `rel` you wrote **[verified 2026-10-16 · live-l01, live-l12, live-l13]**.
- **The "External link" badge.** `game.css` shows a red "External link" badge on hover and focus, through `.user_formatted a[rel~=nofollow]:hover::after` and `:focus::after`, and draws a red ring on linked images.
  - The badge exists only in `game.css`. It is absent from the profile (`user.css`) and jam (`jam.css`) stylesheets **[verified 2026-10-14 · itchcss-46]**.
- **Third-party iframes are click-to-activate.** In descriptions they need a click before they load. itch announced this and the link highlighting in 2023 as anti-scam measures **[documented · sanitizer-39]**. On a project description every host tested (YouTube, youtube-nocookie, Vimeo, CodePen, GitHub Pages, example.com, `http://` and protocol-relative URLs) became a `button.embed_preload` placeholder **[verified 2026-10-16 · live-i01 to live-i07, live-i10]**. A profile bio is different: its iframes stayed live, with no placeholder **[verified 2026-10-16 · live-i01, live-i04]**.
- **CSS can defeat the badge.** In a test, `#wrapper .formatted_description a::after{content:"custom"}` replaced the badge text while the red, absolutely positioned box stayed **[verified · itchcss-46]**. Public snippet collections also offer "hide External Link label" recipes **[community · community-24]**.
- **Calling that a policy breach is an inference.** It falls under P6 (disguising a safety affordance) **[inferred · itchcss-46, docs-10]**.

**Never write:**

- any `::after` rule that matches nofollow links in `.user_formatted`, `.formatted_description` or `.post_body`, because it replaces or restyles the badge;
- `box-shadow:none` on linked images;
- CSS that makes an embed's click-to-activate placeholder look like ordinary content.

```css
/* Decorate links but leave itch's External-link badge (::after on nofollow links) alone */
#wrapper .user_formatted a:not([rel~=nofollow])::after { content: " \2022"; }
```

#### 1.6 B1: the browser blocks insecure resources

- **itch pages are always HTTPS.** `http://itch.io/…` and `http://<user>.itch.io/` answer `301` to the `https://` URL **[verified 2026-10-14 · s02-n6]**. Any `http://` resource in your CSS is therefore mixed content.
- **Stylesheets and web fonts are blockable.** MDN classes stylesheets loaded over `http://` (including `@import`) and web fonts as blockable mixed content **[documented · s02-n5]**. itch itself stores `http://` `@import` and `@font-face` URLs unchanged (project, profile), so only the browser blocks them **[verified 2026-10-16 · live-c04, live-c10]**.
- **CSS images are ambiguous.** MDN lists CSS image properties (`background-image`, `border-image`) as *upgradable*, yet also lists "all cases in CSS where a `<url>` value is used" as *blockable* **[documented · s02-n5]**.
- **Write `https://` everywhere.** Never rely on automatic upgrading.
- **No host allow-list.** Neither page checked sent a `Content-Security-Policy` header, so the browser restricts only the scheme, not the host **[verified 2026-10-14 · s02-n6, two pages]**.

#### 1.7 What itch does *not* check

- **Scope and selectors.** Unscoped `body`, `html`, `:root`, bare `a`/`img`, `.footer`, `.user_page`, `.header_widget .game_search`, `.owner_tools` and `.user_tools` rules are all served unchanged **[verified · crawlprofile-28, crawlproject-48, crawljam-16, corpus-16]**.
- **Unscoped rules do reach itch's own UI.** Tested on a jam page harness **[verified 2026-10-14 · crawljam-16, crawljam-42]**:
  - `img{max-width:5px}` shrank the site header's logo;
  - `:root{--itchio_ui_bg:#ff0000}` turned itch's site header red.
- **One alteration seen.** A creator pasted a whole HTML document into the editor, and the page output everything except that creator's `</style>` **[observed · s02-n7]**. On a project and on the profile itch deletes every `</style>`, in any case and with inner spaces (`</STYLE >`), inside comments and strings too, and trims whitespace at both ends **[verified 2026-10-16 · live-c42, live-c43, live-c44, live-css]**.
- **Dangerous-looking CSS is stored as sent (project, profile).** `url(javascript:)`, `expression()`, `behavior:`, `-moz-binding:`, `http://` and `data:` imports and an `http://` font URL were stored unchanged, with no message on save **[verified 2026-10-16 · live-c04, live-c05, live-c10, live-c32 to live-c35]**. Jams are untested **[unverified]**.

---

### 2. Policy-only rules (enforced by staff, not by software)

#### 2.1 P1: scope every selector under `#wrapper`

- **The rule.** Both layout sections of the guide say to place all custom rules inside `#wrapper` so you don't break or alter itch's core functionality. The jam section adds that site UI such as the header and lightboxes lives outside `#wrapper` **[documented · docs-09, s02-n1]**.
- **Staff restated it in June 2026.** Scope changes to the page container **[documented · docs-09, community-23]**.
- **Pattern.** Write `#wrapper .x { … }`. Never write bare `body`, `html`, `:root`, `img`, `a` or `.header` rules **[documented · docs-09]**.

**What lives outside `#wrapper`:**

| Element | Where | Evidence |
|---|---|---|
| `ul#user_tools` (Follow, Related, …) | Direct child of `body` on project, devlog and profile pages, for visitors; absent from the owner's view of a project and of the profile | verified · docs-09; live profile and owner views verified 2026-10-16 · live-dom |
| Jam site header `.jam_layout_header_widget` | `body` child placed before `#wrapper` | verified · docs-09 |
| Project site header `.game_header_widget` and jam banner `.above_game_banner` (jam entries during voting) | Before `#wrapper` | observed · s02-n7 |
| Screenshot lightbox `#lightbox_container` | Outside `#wrapper` | observed · s02-n7 |
| Profile site header with owner tools ("Edit profile" / "Edit theme") | Absent when logged out; present in the owner's view, even with the theme editor closed (logged-in non-owners untested); outside `#wrapper` | observed · crawlprofile-28, s02-n7; verified 2026-10-16 · live-dom |

**Not enforced: live numbers** (these are not permission):

| Sample | Result | Evidence |
|---|---|---|
| 9 profile sheets | 8 contain selectors without `#wrapper`. One sheet has 25 of 26 selectors unscoped. | verified · crawlprofile-28 |
| 23 project sheets | 1 fully scoped; 3 mostly scoped (about 77–95%); 19 mostly unscoped. A newer set of 16: 0 fully scoped. | verified · crawlproject-48 |
| 7 jams with custom CSS (198–199 selectors) | 0 selectors start with `#wrapper`. 47 bare elements, 5 `html`/`body`/`:root`, 3 site-header selectors. Extended to 11 jams (272 selectors): still 0 start with `#wrapper`. | verified · crawljam-16 |
| 62 pages | 87.5–87.7% of top-level selectors lack `#wrapper`. 55/62 pages have unscoped selectors; only 3/62 scope everything. 19/62 use `:root`/`html`/`body`, 8 style the site header and 5 style `#user_tools`. | verified · corpus-16 |

```css
/* Don't */ body { background:#000 }  a { color:#f6c }  :root { --itchio_ui_bg:#000 }
/* Do    */ #wrapper a { color:#f6c }  #wrapper .game_cell { border-radius:8px }
@media (max-width:600px) { #wrapper .game_cell { border-radius:0 } } /* scope inside at-rules */
```

- **What can carry the prefix.** Only style-rule selectors can be prefixed with `#wrapper`. Put `@import`, `@font-face`, `@keyframes` and `@property` at top level, and scope the selectors inside `@media` and `@supports` **[inferred]**.
- **Theme variables belong on `#wrapper`.** Never set them on `:root` or `html`. On a jam page `:root{--itchio_ui_bg:…}` beats the generated `:root{}` (same specificity, later in the sheet) and recolours itch's site header **[verified · crawljam-42]**. The same declaration on `html{}` happened to have no effect, because it has lower specificity than `:root`. That is luck, not permission **[observed · s02-n7]**. Override variables at `#wrapper` or below; see the theme section for where each page type declares them.

#### 2.2 P2: never alter itch's built-in UI

- **The commitment.** The access request makes you confirm you won't alter built-in UI and will scope changes to the visuals of your own content **[documented · a11y-02]**.
- **The staff warning (2026-06-10).** An itch admin asked a creator to stop using CSS that breaks the itch UI, said "We may remove your CSS access" for that, and asked them to avoid the site header and any dialogs **[documented · community-23, docs-10]**.
  - When the creator then deleted all their CSS, the admin said that wasn't the intent. Decorating your own content is fine.
  - This is the only public staff warning found, and no public report of an actual revocation was found **[documented · community-23]**.
- **Staff advice (2022).** Avoid significant changes to built-in UI: they cause mobile incompatibilities, accessibility problems and breakage on updates **[documented · community-25]**.

| Protected UI | Where it lives | Evidence |
|---|---|---|
| Site header (`.header_widget`, `.primary_header`, `.jam_layout_header_widget`, `.game_header_widget`) | Outside `#wrapper` | documented + verified · docs-09, crawljam-42; observed · s02-n7 |
| `#user_tools` floating toolbar | `body` child | verified · docs-09 |
| Lightboxes and dialogs (login, purchase, screenshots) | Outside `#wrapper` | documented · docs-09, community-23 |
| Download/buy buttons, price, "Name your own price", the "More information" panel | Inside `#wrapper` (project) | community · community-24 |
| "External link" badge, red ring on linked images, click-to-activate placeholders | Inside descriptions | verified + documented · itchcss-46, sanitizer-39 |
| Footer links | See P3 | documented · docs-11 |

- **Download and buy UI.** A user publicly called a CSS-hidden download button an exploit. A moderator noted that hiding files or disabling downloads affects search listing, and that the More information box matters to people **[community · community-24]**.
  - Never hide, cover or relabel the buy/download row, the price or "More information".
- **Live pages break this rule anyway.** One project page hides `.game_header_widget` / `.above_game_banner` with `body:has(…)`. 6 of 39 project sheets target `#user_tools`, and 2 of those hide parts of it **[observed · crawlproject-48, s02-n7]**. Don't imitate them.
- **Restyling vs altering is not defined by itch** **[inferred]**.
  - The guide itself tells jam designers to override `--itchio_button_color` and similar variables on `#wrapper`, and the theme editor recolours buttons **[documented · s02-n1]**.
  - Working reading: visual changes the theme editor could also make (colour, font, radius), applied inside `#wrapper`, are acceptable. Hiding, moving, relabelling, covering or faking itch controls is not. Anything outside `#wrapper` is off-limits.
- **Phone layout collision.** At 650px and below, `#user_tools` on project pages becomes a fixed bottom tab bar (z-index 99). Don't place fixed-bottom custom elements there **[observed · s02-n7]**.

#### 2.3 P3: never hide the footer links

- **The rule.** The guide labels `.footer` with the note "do not hide these links" **[documented · docs-11]**.

| Page | Footer element | Position | Evidence |
|---|---|---|---|
| Profile | `div.footer` | Direct child of `#wrapper.user_page_wrap` | documented + live · docs-11 |
| Project / devlog | `div#view_game_footer.footer` | Inside `#inner_column` | documented + live · docs-11 |
| Jam overview | **No `.footer`** (0 of 16 fresh overviews). The only itch branding inside `#wrapper` is `#entries .itch_footer > span.powerd_by + a > img.header_logo` ("powered by itch.io"), present only when the entries grid is shown. | Inside `#wrapper` | verified structure; extending the rule to it is inferred · crawljam-24 |
| Jam subpages | Site `div.footer` | `body` level, outside `#wrapper`; the host's CSS isn't loaded there | verified · crawljam-24 |

- **Allowed:** restyling colour, border, background, margin and font. 8 of 62 live pages restyle `.footer` (one even animates it), and none hide it **[observed · corpus-17]**.
- **Forbidden:** the guide doesn't list techniques; this reading of the rule's intent was confirmed by fact verification **[documented · docs-11]**:
  - `display:none`, `visibility:hidden`, `opacity:0`;
  - `height:0` with overflow clipped;
  - off-screen positioning;
  - covering the footer with an overlay;
  - text coloured like the background.
- **Jams: treat `.itch_footer` the same way.** Keep it visible and legible. It carries `!important` colours from the theme **[inferred · crawljam-24]**.
- **Mind the positioning.** itch positions the footer `position:absolute; bottom:0` inside reserved bottom padding **[observed · s02-n7]**:
  - profiles: `.user_page_wrap{padding-bottom:50px}`;
  - projects wider than 1000px: the 40px bottom padding of `#inner_column`.
  
  Removing that padding, or adding a fixed or absolute layer above it, can make the footer overlap content or be covered.
- **Target size.** Profile footer links measure 32×16 px. They pass WCAG 2.5.8 only through its spacing exception: their centres are about 74px apart. If you restyle them as pills or icons, keep each at least 24×24 px, or keep their centres at least 24 px from any other target **[verified · a11y-46]**.

```css
#wrapper .footer   { border-top-color:#2a3a6a; font-size:13px }  /* fine */
#wrapper .footer a { color:#ffc857 }   /* fine while contrast stays readable */
/* never: #wrapper .footer { display:none | visibility:hidden | opacity:0 } */
```

#### 2.4 P4: external resources over HTTPS

- **What the guide says.** The "External content" section is two sentences. External images and fonts *should* be hosted somewhere reliable with HTTPS support, or Base64-embedded in the CSS **[documented · external-36, corpus-41]**.
- **This is advice, not a permission list.** The guide never mentions `@import` or whole external stylesheets **[documented · external-36]**.
- **`@import` in practice.** Importing a whole external stylesheet is undocumented but kept on live pages; see the external-CSS section **[documented · external-36]**. On a project and on the profile all six `@import` forms tested (non-Google HTTPS, `http://`, `data:`, and `data:` with `layer()`, `supports()` or a media query) were stored unchanged, and the `data:` ones applied **[verified 2026-10-16 · live-c03 to live-c08]**.
- **Base64 trades reliability for size.** It removes the hosting dependency but counts toward the cap (S4) **[documented · repo-60]**.

#### 2.5 P5: enhance, don't rebuild

- **The guide's main design rule.** Its introduction says enhancing existing components instead of redoing the entire page is the best way to avoid problems, because itch upgrades its pages **[documented · docs-40]**.
- **Only listed selectors are stable.** The classes and IDs listed in the guide are declared stable; any others are used at your own risk. itch says it will *try* to email CSS users about major changes **[documented · s02-n1]**.
- **Profiles have no documented layout.** The guide lists no profile selectors, so every profile selector beyond `#wrapper` is at your own risk **[documented · repo-56]**.
- **Prefer small, additive tweaks.** Staff advise against significant changes to built-in UI, citing mobile, accessibility and update breakage **[documented · community-25]**.
- **Theme editor first.** In 2017 staff reviewed 600+ CSS pages and turned the most common hacks into theme-editor options **[documented · docs-40]**.
- **Do:** restyle colours, typography, spacing, borders, cards, backgrounds, hover states and your own `custom-` elements.
- **Don't:** absolutely reposition the whole layout, rebuild the header, reorder itch widgets, or hide itch components and recreate them **[documented principle; the specific list is inferred · docs-40]**.

#### 2.6 P6 and P7: never mislead visitors or impersonate

- **CSS guide.** Trying to trick visitors into actions they didn't intend gets your CSS access, and maybe your account, suspended **[documented · docs-10]**.
- **Terms of Service §3** (header "Updated April 15 2023") prohibits, among other things **[documented · docs-12, s02-n2]**:
  - hacking, maliciously manipulating or misrepresenting itch.io's interface;
  - creating a false identity to mislead others;
  - posting misleading content;
  - restricting other users' use of the service.
  
  Content that degrades others' experience can lead to termination without prior notice.
- **Quality guidelines: impersonation** **[documented · docs-13, s02-n3]**. This is strictly prohibited, and includes:
  - names, logos or branding closely resembling another creator or company;
  - mimicking the look, feel or functionality of another creator's work without permission;
  - pages that could make users think they are dealing with a different creator or company.
  
  Penalties: content removal, and account suspension or termination. A separate section bans fake or misleading imagery and using other products' assets to represent your own.
- **Quality guidelines: ads and login walls.** Ads must not be obtrusive or misleading, and third-party login walls in front of a game should be avoided. That section says nothing about overlays. The firm grounds against CSS-built fake dialogs are the guide's trick-visitors clause and ToS §3 **[documented · docs-50]**.
- **Admin context.** User HTML and CSS are restricted for security. The 2023 click-to-activate and link-highlighting changes were explicitly anti-scam measures **[documented · sanitizer-39]**.

**Never generate** **[inferred from docs-10, docs-12, docs-13, docs-50, sanitizer-39]**:

- fake itch controls ("Download", "Buy", "Follow", "Rate") built from pseudo-elements, or restyled links that lead elsewhere;
- fake modals, cookie or consent dialogs, or "official"/"verified" badges;
- transparent click-capturing layers over itch UI. Decorative layers need `pointer-events:none` and must not cover itch controls;
- a link shown under a misleading label;
- hidden or disguised External-link badges, prices or "Name your own price" (S5, P2);
- a page styled to pass as another studio, store or creator.

#### 2.7 P8 and P10: accessibility, mobile, logged-out, motion

- **The guide's Considerations** **[documented · a11y-01, s02-n1]**:
  - people with disabilities or using assistive technology must have no trouble accessing the page;
  - project pages, and jam pages, are built for mobile web, so test smaller viewports;
  - test while logged out.
- **Jam pages you can edit** add extra editor wrapper elements, so verify as a regular visitor **[documented · s02-n1]**.
- **Part of the access agreement.** You confirm the page stays accessible and won't be made hard to operate or read **[documented · a11y-02]**.
- **WCAG anchors that turn "accessible" into checks:**
  - **2.2.2 Pause, Stop, Hide (Level A).** Motion that starts automatically, lasts more than 5 s and runs alongside other content needs a pause, stop or hide mechanism. Honouring `prefers-reduced-motion` is **not** listed as sufficient: technique C39 maps only to 2.3.3 (AAA). itch allows no JS, so there can be no pause button. Prefer finite animations that end within 5 s, and always honour reduced motion **[documented · a11y-25]**.
  - **2.5.8 Target Size (AA).** Pointer targets need at least 24×24 CSS px, or enough spacing. Restyled pills and icons lose the inline exception **[verified · a11y-46]**.
  - **2.4.11 Focus Not Obscured (AA).** A fixed or sticky layer you add must never fully hide a focused element. Put decorative full-screen layers at `z-index:-1` with `pointer-events:none` **[inferred · a11y-47]**.
- **Flashing (P10).** The quality guidelines say projects built around shocking images, flashing colours, loud noises or obnoxious material may be delisted from browse and search. Applying that to CSS animation is inferred **[documented · s02-n3]**.

```css
#wrapper { isolation:isolate }   /* keeps the z-index:-1 layer inside #wrapper */
#wrapper::before { content:""; position:fixed; inset:0; z-index:-1; pointer-events:none }
@keyframes custom-bob { to { translate:0 -4px } }   /* custom- prefix: itch owns 13 global keyframe names */
#wrapper .custom-title { animation:custom-bob 1.2s ease-in-out 4 alternate }  /* 4.8 s, ends at rest */
@media (prefers-reduced-motion:reduce) {
  #wrapper, #wrapper::before, #wrapper::after,
  #wrapper *, #wrapper *::before, #wrapper *::after { animation:none!important; transition:none!important }
}
```

**The reduced-motion guard: always use this exact six-selector block** (181 characters minified):

- **List all six selectors.** `#wrapper *` matches descendants only, so it misses `#wrapper` itself and `#wrapper::before`/`::after`, which is where full-page star fields and backdrops usually live. On a test page with 6 infinite animations under emulated `reduce`, the common three-selector guard (`#wrapper *, #wrapper *::before, #wrapper *::after`) left **3 running**: `#wrapper`, `#wrapper::before` and `#wrapper::after`. The six-selector block left **0** **[verified 2026-10-14 · gapfill02-01; same counts in s10-02]**.
- **Use `transition:none!important`, not `transition-duration:.01ms!important;transition-delay:0s!important`.** Both were tested on a hover card and a class-toggled card **[verified 2026-10-14 · gapfill02-02]**:

  | Guard form | Normal timeline | Frozen timeline (CDP playback rate 0) | Transition events |
  |---|---|---|---|
  | `transition:none!important` | End state (`translateY(-8px)`) on the first style read; no transition object is created | End state immediately | none fire |
  | `transition-duration:.01ms` + `transition-delay:0s` | Start value at first read; end state by 100 ms | **Stuck at the start value** (1.2 s later still `translateY(0)`) | `transitionrun`/`transitionend` fire |
  | `.01ms` without `transition-delay:0s` | An authored `.2s` delay still held the change back (start value at 100 ms) | Stuck at the start value | fire |

  `none` reaches the end state deterministically, even in tools with a frozen timeline, and is 40 characters shorter, which matters under the 5,120-byte profile cap (S4). The `.01ms` form exists so that scripts waiting for `transitionend` keep working. Custom pages run no JS, and itch's own bundles (`bundle`, `lib`, `game`, `jam`, `theme_editor` `.min.js`) contain no `transitionend` or `animationend` string at all **[verified 2026-10-14 · gapfill02-03]**. Note that other sections of this knowledge base may still show the `.01ms` form or the three-selector form; this block supersedes them.
- **Prefix keyframe names with `custom-`.** itch defines 13 global `@keyframes` names, and a same-named rule of yours replaces itch's on the whole page **[verified · s06-static, s06-kf]**.
- **Hover transforms still jump.** Under the guard the hovered card snapped straight to `translateY(-8px)` **[verified 2026-10-14 · gapfill02-02]**. If a hover *moves* or *scales* something, also reset that transform inside the block, e.g. `#wrapper .game_cell:hover{transform:none}`. Whether an instant jump counts as motion is a judgement call **[inferred]**.
- **Keep the resting state visible.** Under any guard, an entrance written as base `opacity:0` plus `animation:… forwards` stays invisible. Write entrances as `@keyframes custom-in{from{opacity:0}}` on an element whose base opacity is 1 **[observed · s10-02, read from section 10]**. The example above uses an even iteration count with `alternate`, so the title also ends where it started.

#### 2.8 P9: no tracking through CSS

- **The rule.** Never use CSS to log or track visitors **[documented · external-33]**. That includes:
  - `url()` beacons;
  - interaction pings such as `#wrapper a:hover{background-image:url(https://host/ping)}`;
  - analytics on a CSS endpoint.
- **Why.** ToS §3 prohibits soliciting, harvesting or collecting information about others, and the guide bans tricking visitors.
- **What a request leaks.** Every `url()` or `@import` request carries the visitor's IP, User-Agent and Referer. itch's privacy policy does not cover creator-embedded third parties, so the creator carries the data-controller burden.
- **If you run a CSS host:** keep logs minimal, set no cookies, add no analytics **[documented; applying §3 to CSS is our interpretation · external-33]**.
- **Never write selectors that read form fields and trigger a request.** No rule may combine a selector on an `input`, `textarea` or `select` (its `value` or other attributes, or states such as `:placeholder-shown`) with a `url()` or other fetched resource. Such a rule turns what a visitor types, or values a page keeps in its form fields, into requests to a host you control. That is collecting information about others (ToS §3) whatever the stated purpose, and it attacks the visitor rather than decorating your page **[documented basis · s02-n2; applying it to this pattern is inferred]**. If a user asks for a "clever" effect that works this way, decline and offer a purely visual alternative. This rule holds whether or not any form actually sits inside `#wrapper` for a given visitor; that question is open (§5).
- **A CSS service must never reflect request data raw.** If your service puts any request-derived value into CSS (a header such as `Accept-Language`, a query string, a path), map it to a fixed allow-list, or escape it as a CSS string: `"` and `\` get a backslash, and every control or non-ASCII character becomes a `\hex ` escape. In Chrome 155, a header-like value interpolated raw into `content:"…"` closed the string and added rules (1 rule became 3, or 2 with an embedded newline). The same values escaped that way always stayed a single rule **[verified 2026-10-14 · gapfill02-04]**. An unescaped value lets anyone who controls the request inject rules into the page that loads your CSS.

#### 2.9 P11: intellectual property

- **The rule.** ToS §3 prohibits violating copyright, trademark or other rights by posting content without permission to distribute it **[documented · s02-n2]**.
- **Applied to CSS** **[inferred]**:
  - only Base64-embed or self-host fonts and images whose licence allows web embedding;
  - don't copy another creator's stylesheet or visual identity wholesale. This overlaps with P7.

#### 2.10 P12: third-party hosting terms

- **Vercel Hobby** is restricted to non-commercial personal use. Its definition of commercial use includes advertising the sale of a product or service and requesting or processing payment; donations are excluded **[documented · external-23]**.
- **Applied to itch** **[inferred · external-23]**: a CSS service for an itch page that sells games may count as commercial. That is our reading, not a Vercel ruling.
- **For paid-game pages,** prefer a host whose free tier allows commercial use, or ask the host.

---

### 3. Sanctions: what can actually happen

| Trigger | Sanction | Source |
|---|---|---|
| CSS that messes with site UI (header, dialogs, anything outside `#wrapper`) | CSS access may be removed | documented · community-23, docs-10 |
| Tricking visitors into unintended actions | CSS access suspended, and maybe the account | documented · docs-10 |
| ToS §3 violations (misrepresenting itch's interface, misleading content, harvesting data, IP infringement) | Account termination, possibly without prior notice | documented · docs-12, external-33, s02-n2 |
| Impersonating a creator or company | Content removed; account suspended or terminated | documented · docs-13 |
| Failing the quality guidelines (including shock, flashing or obnoxious material) | Removed from the discovery index (browse, search, recommendations); still reachable by URL | documented · docs-13, s02-n3 |
| Hiding files or disabling downloads | The game may drop out of searches | community (moderator) · community-24 |

- **Enforcement is human.** No automatic check of CSS content has been observed: CSS is served verbatim, and unscoped or UI-altering CSS stays live on many pages **[inferred from crawlprofile-28, corpus-16]**. On a project and on the profile, apart from trimming (and CRLF line breaks on the project), the only automatic change is deleting `</style>`; `expression()` and `url(javascript:)` pass **[verified 2026-10-16 · live-c32 to live-c35, live-c42, live-css]**.
- **Low visible enforcement is not permission.** No public report of an actual revocation was found **[documented · community-23]**, but the commitments in the access request still apply.

### 4. Pre-flight checklist (run it before emitting any itch CSS)

1. **Scope.** Every style-rule selector starts with `#wrapper`. There are no bare `html`, `body`, `:root`, `a`, `img` or `.header_widget` rules, and no variables on `:root`/`html`. (P1)
2. **Built-in UI.** Nothing hides, moves, covers, relabels or fakes:
   - the site header, `#user_tools` or dialogs;
   - buy/download buttons, the price or "More information";
   - the External-link badge or embed placeholders. (P2, S5)
3. **Footer.** `.footer` (profile, project, devlog) and `.itch_footer` (jam) stay visible, legible, uncovered and clickable, with itch's bottom padding intact. (P3)
4. **HTML.** Every class in HTML you hand the user starts with `custom-`. (S3)
5. **URLs.** Every `url()` and `@import` uses `https://`, or the resource is Base64. Fonts and images are licensed for web embedding. (B1, P4, P11)
6. **Size.** The minified CSS fits the page type's cap. Assume 5,120 UTF-8 bytes (the profile cap) unless the page type is known to allow more. (S4)
7. **Honesty.** No fake controls, badges or dialogs, no click-capturing layers, no imitation of another brand. (P6, P7)
8. **Motion and layers.** Animations are finite (≤5 s), and any CSS with motion ships the six-selector reduced-motion block from §2.7 unchanged (`#wrapper, #wrapper::before, #wrapper::after, #wrapper *, #wrapper *::before, #wrapper *::after { animation:none!important; transition:none!important }`). `@keyframes` names start with `custom-`. Nothing flashes. Decorative layers use `z-index:-1; pointer-events:none`. (P8, P10)
9. **Privacy.** No interaction-triggered requests, no analytics through CSS, and no selectors on form fields' values or attributes that load a `url()`. A CSS service escapes or allow-lists every request-derived value. (P9)
10. **Testing.** Tell the user to test logged out, at phone width, and with a keyboard or screen reader. (P8)

### 5. Open questions (evidence missing or weak)

- **Size cap.** Settled on 2026-10-16 for profiles and projects: the profile cap is 5,120 UTF-8 bytes and an over-cap save is refused with an error lightbox; projects and devlogs have no CSS cap **[verified 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-B1, live-cap-B2]**. Still open: the jam cap's exact value and unit, and what an over-cap jam save shows. Needs a jam the account hosts **[unverified]**.
- **Save-time filtering.** Settled for projects and profiles on 2026-10-16: `javascript:` URLs, `expression()` and `http://` imports are stored unchanged, and every `</style>` is deleted **[verified 2026-10-16 · live-c04, live-c32 to live-c35, live-c42 to live-c44]**. Still open: the same on jams, and whether the `</style>` removal happens on save or on render (the probe reads the served page) **[unverified]**.
- **Enforcement in practice.** How often is CSS access actually revoked, and is any of it automated? No public case was found **[unverified]**.
- **Restyle vs alter.** Do staff count recolouring itch buttons inside `#wrapper` (without hiding them) as "altering built-in UI"? The guide's jam section recommends exactly that for variables **[unverified]**.
- **Jam footer.** Does the footer rule extend to the jam `.itch_footer`? The docs are silent **[inferred only · crawljam-24]**.
- **External-link badge.** Has itch ever ruled on CSS that overrides the External-link badge? No staff statement was found **[unverified]**.
- **Form fields inside `#wrapper`.** Do logged-in visitors get comment or reply forms inside `#wrapper` on project, devlog and profile pages? Logged-out pages can't answer this. The P9 form-field rule applies either way **[unverified; needs a logged-in session]**.
- **Reduced-motion guard in Firefox and Safari.** The six-selector block and the `transition:none` choice were measured in Chrome 155 only **[unverified elsewhere]**.

---

### Section notes (evidence added while writing this section, 2026-10-14)

**Method.**

- **Requests.** 8 read-only requests to itch.io between 13:39 and 13:41 UTC: 4 GETs (3 docs pages, 1 forum topic) and 4 `curl -I` HEAD requests (an `http://` and an `https://` URL on each of 2 hosts). Plus 1 GET to MDN.
- **Etiquette.** Desktop Chrome User-Agent, logged out, at least 2–3 s between requests, `robots.txt` respected.
- **Storage.** Raw copies are kept only in the private scratchpad (`…/scratchpad/s02-rules/raw/`). Text was extracted with a small `html.parser` tag-stripper (`tools/strip.py`) and searched with `grep`/`sed`.

```sh
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
curl -s -A "$UA" -o guide.html     https://itch.io/docs/creators/css-guide            # 200, 22,603 B
curl -s -A "$UA" -o terms.html     https://itch.io/docs/legal/terms                   # 200, 38,214 B
curl -s -A "$UA" -o quality.html   https://itch.io/docs/creators/quality-guidelines   # 200, 39,985 B
curl -s -A "$UA" -o jamrevamp.html https://itch.io/t/6429680/jam-theme-editor-revamp  # 200, 43,169 B
curl -s -A "$UA" -L -o mdn.html https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content  # 200
curl -sI -A "$UA" http://itch.io/docs/creators/css-guide ; curl -sI -A "$UA" http://mirokshi.itch.io/  # then the https:// URLs
```

| Id | What was checked | Result |
|---|---|---|
| s02-n1 | CSS guide, re-fetched live | **Access:** enabled per account; not granted to empty accounts. **Stability:** only the listed classes and IDs are declared stable, others at your own risk; itch will "try to" email CSS users about major changes. **HTML:** classes must begin with `custom-`, others stripped by the sanitizer; the rich-text editor may rewrite HTML. **Considerations:** accessibility; mobile viewports; test logged out; trick-visitors suspension. **Jam section:** the site header and lightboxes are outside `#wrapper`; prefer theme variables on `#wrapper` (example overrides `--itchio_button_color`); jam pages you can edit add editor wrappers. **External content:** 2 sentences, no `@import`. **Getting CSS access:** 4 items (theme editor first, describe changes, accessible, no altering built-in UI and scope to the visuals of your page content), with upgrade compatibility and responsible use as the reasons. |
| s02-n2 | Terms of Service, re-fetched | **Header:** "Updated April 15 2023". **§3 Acceptable Use** lists 10 prohibited actions, including misleading content, harvesting information about others, IP infringement by posting content without permission, misrepresenting itch.io's interface, and a false identity. Content that degrades others' experience can lead to termination without prior notice. |
| s02-n3 | Quality guidelines, re-fetched | **Intro:** failing the guidelines lets "our systems or a site moderator" remove a page from the discovery index; the page stays reachable by URL. **Impersonation:** includes "without permission"; content removal, and suspension or termination. **Misleading content:** bans fake or misleading imagery and other products' assets. **Ads and login walls:** no mention of overlays. **Shock/flashing/obnoxious material:** "may delist from our browse and search pages". |
| s02-n4 | Forum topic `/t/6429680` (posts dated 2026-06-01 to 06-09) | **Host (community), 2026-06-02:** the new 5,120-character jam cap is "consistent with profile and project pages", and jams were previously uncapped. **leafo (Admin) reply:** there was no limit before; jams are now set to "20kb"; large CSS is mostly embedded fonts and images. **Later:** the host trimmed their CSS to "a few hundred shy" of the new limit. |
| s02-n5 | MDN *Mixed content* | **Upgradable:** "CSS image elements such as: background-image, border-image". **Blockable:** `<link>` stylesheets, web fonts, and "All cases in CSS where a `<url>` value is used (@font-face, cursor, background-image…)". The page contradicts itself on CSS images. |
| s02-n6 | Headers of `http://itch.io/docs/creators/css-guide` and `http://mirokshi.itch.io/` | Both `301` to `https://`. The `https://` responses (`200`) carry **no** `Strict-Transport-Security` and **no** `Content-Security-Policy` header. |
| s02-n7 | Other agents' evidence files, read but not re-run (`observed`) | **`crawlproject.md`** (§2, §7, §9, §13): devlog posts and `/comments` serve the project's sheet; `/community`, `/purchase` and AMP devlog serve none. At ≤650px `#user_tools` is a fixed bottom bar (z-index 99). The project footer is absolute inside `#inner_column`'s 40px padding above 1000px. `#lightbox_container` sits outside `#wrapper`. Jam entries in voting render `.game_header_widget` and `.above_game_banner` before `#wrapper`. 6/39 sheets target `#user_tools` (2 hide parts of it), and 1 hides the header with `body:has(…)`. **`crawlprofile.md`** (§5, §10): `.footer{position:absolute;bottom:0}`, `.user_page_wrap{padding-bottom:50px}`; a pasted `</style>` was removed from the output; the owner view shows a site header with `.owner_tools`. **`sanitizer.md`** §5.2: class tokens in user content. **`crawljam.md`**: `html{--itchio_ui_bg:#f00}` had no effect, `:root{…}` turned the header red; jam subpages load no host CSS. **`docs.md`** §5: a live project sheet of 10,203 characters (normalised). |

**Conflicts resolved:**

- **Scoping statistics.** The profile count was corrected from 7/9 to **8/9** (crawlprofile-28). Two independent parsers gave 2,227/2,545 (87.5%) and 2,275/2,593 (87.7%), shown as a range (corpus-16). The jam sample counts 199 or 198 selectors (crawljam-16). The project "mostly scoped" share is reported as 77–94%, 0.77/0.87/0.95 and 77–96% depending on how selector lists are split, so it is shown as "about 77–95%" (crawlproject-48).
- **"External content" length and force.** One fact said the section *permits only* HTTPS hosting in 3 sentences. The corrected fact (external-36) and my re-fetch (s02-n1) say **2 sentences**, advisory ("should").
- **Project-page size cap.** The 2023 admin says game pages "might" lack the size check (repo-60). A 2026 jam host claims 5,120 "consistent with project pages" (community, s02-n4). A 10,203-character live project sheet exists (s02-n7). Recorded as unclear at first; live probe Run 4 (2026-10-16) settled it against the host: there is no CSS cap on projects, and 659,742 characters saved (live-cap-B1, live-cap-B2).
- **Impersonation wording and delisting.** The impersonation text includes the "without permission" qualifier. Delisting comes from the guidelines' intro, not from that section (docs-13, confirmed by s02-n3).
- **Ads guideline vs overlays.** The section covers only ads and login walls (docs-50, confirmed by s02-n3). The ban on fake overlays rests on the guide and ToS §3.
- **Footer rule on jams.** The structure is verified, but extending "do not hide" to `.itch_footer` is labelled **inferred** (crawljam-24).
- **Target-size exception.** The footer links pass through the spacing exception, not the inline one (a11y-46 as corrected).
- **`:root` vs `html` for variables.** `:root` recoloured the header (crawljam-42); `html` did not, because of specificity (s02-n7). The rule stays: put variables on neither.
- **"Don't alter built-in UI" vs the guide's own button-variable advice.** Resolved as an inference (§2.2) and kept as an open question.
- **Reduced-motion guard (gap fill, 2026-10-14).** This section and section 04 showed a three-selector guard; sections 07, 09 and 10 showed six selectors, with either `transition:none` or `transition-duration:.01ms`. Re-measured (gapfill02-01, gapfill02-02): six selectors are required, and `transition:none!important` is the chosen form (deterministic end state, 40 characters shorter, no itch script listens for transition events). The example keyframe was renamed `bob` → `custom-bob`. Details in `knowledge/evidence/gapfill.md`.
- **CSS data-exfiltration and reflected strings (gap fill, 2026-10-14).** P9 now names form-field selectors that load URLs, and the escaping rule for CSS services (gapfill02-04).
