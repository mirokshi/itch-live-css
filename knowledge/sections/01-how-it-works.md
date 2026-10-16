## How custom CSS works on itch.io

This section explains the mechanics of custom CSS on itch.io:

- how to get access, and where the editor is on each page type;
- how much CSS fits, and what itch does to the text you save;
- where that text lands in the page, and which pages receive it;
- what you cannot do.

Selectors and page structure are in [03-page-anatomy](03-page-anatomy.md), the cascade against itch's own CSS is in [06-cascade-and-specificity](06-cascade-and-specificity.md), and `@import` details are in [08-external-css](08-external-css.md).

**How to read the tags.** Each tag has the form `[confidence · evidence-id]`.
- The confidence levels are `verified`, `documented`, `observed`, `community`, `inferred` and `unverified`.
- Ids like `corpus-01` point to the evidence logs in `knowledge/evidence/<dimension>.md`.
- Ids `s01-n1` to `s01-n8` are re-checks made for this section. They are listed in [Section notes](#section-notes).
- Ids `gapfill01-01` to `gapfill01-14` come from a later gap fill on the same day. They are logged in `knowledge/evidence/gapfill.md` ("Gap fill for 01-how-it-works.md").
- Unless stated otherwise, everything was observed logged out on **2026-10-14**.
- Tags `[verified 2026-10-16 · live-…]` come from live probe runs in Brave 155 (Chromium 155): Run 1, a draft project's Custom CSS and description, saved and viewed by the owner (logged in); Run 2, the owner's profile (bio and Custom CSS), viewed logged in and logged out; Run 4, the size caps (`live-cap-…`), saved by the owner on the profile (CSS and bio) and on the draft project. Each holds only for the page types its text names, never for devlogs or jams (except that devlogs share the project's CSS save); see `knowledge/evidence/live-probes/results-2026-10-16-project.md`, `results-2026-10-16-profile.md` and `results-2026-10-16-caps.md`.

### TL;DR for an AI writing itch CSS

1. **Ask whether the user has CSS access before writing anything.**
   - Access is off by default, and itch staff grant it by hand, per account. Without it, the "Custom CSS" field is not rendered at all **[documented · docs-01, community-48]**.
   - If the user has no access, offer a theme-editor-only fallback.
2. **Paste plain CSS, minified.** itch stores the text as pasted. It does not minify it, strip comments, add a `#wrapper` scope or escape characters **[verified · corpus-01, community-10]**. On a project and on the profile the only changes are that every `</style>` is deleted and whitespace is trimmed at both ends; line breaks become CRLF on the project and stay LF on the profile **[verified 2026-10-16 · live-css, live-c42, live-c43]**. Comments are stored too and count toward the profile cap **[verified 2026-10-16 · live-cap-A3a]**; inner whitespace very likely counts the same way **[inferred · corpus-18]**, while leading and trailing whitespace are trimmed before the check **[verified 2026-10-16 · live-cap-A3b, live-cap-A3c]**.
3. **Size budget.** The profile and project caps were measured at their boundaries on 2026-10-16; the jam cap was not (§3). Over the profile cap the save is refused with an error, never truncated **[verified 2026-10-16 · live-cap-A1]**.
   - Profile: ≤ **5,120 UTF-8 bytes**, counted after trimming leading and trailing whitespace, comments included. The error message says "characters", but 2,603 `é` (5,120 bytes) saved and 2,604 (5,122 bytes) were refused, so measure bytes **[verified 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a]**. Staff said "5kb" **[documented · docs-32]**.
   - Project or devlog: no CSS cap. 659,742 single-line ASCII characters saved whole on a draft project; larger saves fail as a request ("missing token"), not on a CSS rule **[verified 2026-10-16 · live-cap-B1, live-cap-B2]**. Keep it lean anyway: every byte is page weight.
   - Jam: ≤ 20,410 characters of **your** CSS is known to save. "20kb" most likely means 20,480. itch's generated rules don't count, and each line break counts once **[documented · crawljam-29; inferred · gapfill01-03]**.
4. **Write the child combinator as a plain `>`, never `&gt;`.** Nothing is entity-decoded, so `&gt;` breaks the selector **[verified · corpus-02]**. On a project and on the profile a raw `>` is stored and applied **[verified 2026-10-16 · live-c23]**.
5. **Put every `@import` first and at top level** **[verified · repo-10, external-03, external-50]**. On jam pages `@import` can never work, because itch places your CSS after its own generated rules **[verified · s01-n3, s01-n4]**.
6. **Never write `</style>` anywhere**: not in strings, data URIs or comments **[documented · repo-05; observed · crawlprofile-25]**. On a project and on the profile itch deletes every one, in any case and with inner spaces (`</STYLE >`), inside comments and strings too, so the text around it changes silently **[verified 2026-10-16 · live-c42, live-c43, live-c44]**.
7. **A project's CSS also styles its devlog index, its devlog posts and its comments page** **[documented · s01-n1; verified · s01-n2]**. Write selectors that tolerate each of those DOMs.
8. **You cannot run JavaScript.** The only code field is the CSS textarea **[documented · repo-04, repo-64; observed · crawlprofile-42]**.
9. **Check a saved change from a logged-out window.** While you type, the editor previews unsaved CSS on your own screen only **[documented · community-05]**. Logged-out pages are also cached: after a profile save, visitors got the old copy for about 2.5 minutes (§2) **[verified 2026-10-16 · live-dom]**.
10. **Expect no syntax errors to be reported.** itch does not validate CSS syntax: it stores whatever text fits, and browsers drop the invalid parts silently **[verified · support-08, localtests-41, localtests-42]**. On a project and on the profile, `expression()`, `behavior:`, `-moz-binding:` and `url(javascript:)` were saved unchanged and without a message **[verified 2026-10-16 · live-c32 to live-c35]**. The only save error to expect is a server error, shown in a "Your changes were not saved" lightbox **[documented (itch JS) · gapfill01-05]**. A too-long profile save produces one ("css: expected empty, or text between 1 and 5120 characters") **[verified 2026-10-16 · live-cap-A1]**, and so does a project save too large to be read as a form ("missing token") **[verified 2026-10-16 · live-cap-B2]**.
11. **On jams, also check keyboard focus.**
    - Hosts open the editor with an `.edit_theme_btn`, or by adding `#edit_theme` to the jam URL while logged in **[documented (itch JS) · gapfill01-07]**.
    - Never remove outlines with `!important`, and reveal itch's hidden "Add to collection" stops (§8) **[verified · gapfill01-12, gapfill01-13]**.

---

### 1. Getting access

| Question | Answer | Evidence |
|---|---|---|
| Who grants it | itch staff, by hand, **per account**. It is "restricted by default" because custom layouts make it harder for itch to upgrade pages. The Creator FAQ also cites accessibility and long-term support of pages. | **[documented · docs-01, community-01]** |
| Where to ask | Use https://itch.io/support (the guide's "contact us" link points there). That page says to email **support@itch.io** from the address that owns the account, and the receipt carries a Ticket ID. | **[documented · docs-01, s01-n1]** |
| What not to use | `https://<user>.itch.io/support` returns **404** ("We couldn't find your page"). | **[verified · s01-n7]** |
| Known bug | The profile editor's Readme popup reportedly links to that 404 URL (GitHub itchio/itch.io#1661, still open). | **[community · docs-04]** |
| Before asking | Read the whole guide and have real content. The guide says "We do not grant CSS access to empty accounts"; that sentence has been there since 2021-04. | **[documented · docs-03, sanitizer-49]** |
| Public project? | A forum moderator added that the project must be public first. This is not in the docs. | **[community · docs-03]** |
| What to write | The four points from the guide's "Getting CSS access" list (template below). A support reply quoted in 2025-06 asked for exactly these points. | **[documented · docs-02, crawljam-38]** · **[community · docs-02]** |
| How long it takes | Reported waits range from ~30 min (2018, helped by itch's Discord) to 1–2 weeks, to 3–4 weeks with follow-ups (2026), to 2+ months with no reply (2025). There is no official turnaround. Tell users to expect weeks and to follow up on the **same ticket**. Forum moderators can only forward requests to admins. | **[community · community-02]** |
| After access | itch says it will "try to email all CSS users" before major page changes. | **[documented · s01-n1]** |

Request template. The wording is mine; it covers the four required points:

```text
Subject: Custom CSS access for <account name>
1. What the theme editor can't do: <e.g. per-letter fonts, card hover effects>.
2. Planned changes (visual only): <short list>.
3. I confirm my pages will stay accessible and won't become hard to read or operate.
4. I confirm I won't alter itch.io's built-in UI and will scope all changes to my own page content.
```

**What a grant covers.**
- Access is per account. The guide lists the editor on "Project pages (Including Devlog posts)", "Jam pages" and "Profile pages" **[documented · s01-n1]**.
- Forum moderators have written that access is "for one of your projects" and, in 2021 (adding "I could be wrong"), that it is only for project pages. The guide, an admin reply and live profiles that serve `style#custom_css` all contradict this, so treat the remarks as wrong or outdated **[verified · community-45; community · community-01]**.

**Don't assume the user has access.**
- Custom CSS appears on 23 of 60 top jam pages, but on only 1 of 12 sampled featured games **[observed · corpus-39]**.
- Without access, the user still has the theme editor and description HTML. Whether `custom-*` classes in descriptions survive without CSS access is an open question **[documented · sanitizer-49]**.

**"Access was granted but I can't find the field."** Check these in order:
1. **Is the "Edit theme" button visible at all?** itch's own stylesheets hide it in narrow windows.
   - On a profile, the button is `button.tool_button.edit_theme_btn` (brush icon, text "Edit theme"). It sits in `.header_buttons.owner_tools` inside the site header **[observed · gapfill01-07]** (owner export, June 2026).
   - `user.css`, `game.css` and `jam.css` all hide `.header_widget .owner_tools .tool_button` at `max-width: 980px`, and the whole `.owner_tools` bar at `max-width: 800px` **[verified · gapfill01-08]**. That matches users' reports that the button vanishes on phones **[community · community-03, docs-04]**.
   - Workarounds:
     - widen the window past 980 px (desktop-site mode plus landscape, or an Android display-size setting);
     - or run `document.querySelector('.edit_theme_btn').click()` in the console **[community · community-03]**;
     - or add `#edit_theme` to the page URL while logged in as the owner, e.g. `https://<user>.itch.io/#edit_theme`. itch's JS opens the editor on load when the hash matches `/\bedit_theme\b/`: `GameHeader` and `UserProfileHeader` in `bundle.min.js`, and the jam page in `jam.min.js`. This is untested live **[documented (itch JS) · gapfill01-07]**.
   - Below 650 px, `theme_editor.css` turns the editor into an overlay under the 50 px header. So the editor is built to open on phones even though its button is hidden **[verified · gapfill01-08]**.
2. **Is the "Custom CSS" textarea in the editor's "Misc" group?** The editor renders it only when the server sends `can_use_css`. If the button opens the editor and the field is absent, the account has no access yet. No setting can turn it on **[documented · community-48, repo-64]**.

**Inspiration (look, don't copy).** leafo curates two collections, [CSS Showcase](https://itch.io/c/241703/css-showcase) (paginated, ≥ 77 entries) and [Cool Game Pages](https://itch.io/c/1536/cool-game-pages) **[verified · docs-49]**. The CSS on those pages belongs to their creators.

---

### 2. Where the editor is, per page type

Every page type uses the same `CssEditor` component, inside the theme editor. The theme editor opens **on the page itself, while you are logged in as its owner**, not from the dashboard **[documented · community-48, repo-64; community · docs-04, community-03]**.

| Page type | How to reach the field | What a save sends | Evidence |
|---|---|---|---|
| Profile `https://<user>.itch.io/` | "Edit theme" (`button.edit_theme_btn` in `.header_buttons.owner_tools`) → group "Misc" → "Custom CSS" → **Save** | The whole theme as JSON. The CSS is its `css` string; the other keys are `bg_color, text_color, link_color, font_family, font_size, border_radius, layout, game_order, hidden_games`. The same config caps background uploads at `image_size_limit` 3,145,728 B (3 MiB); the live profile's owner config still had that value, and `can_use_css` true, on 2026-10-16. | **[observed · crawlprofile-42]** (owner export, June 2026) · **[documented · repo-64, community-04]** · live config **[verified 2026-10-16 · live-dom]** |
| Project `https://<user>.itch.io/<game>` | "Edit theme" in the owner bar at the top of the game page → "Custom CSS" | Form field `layout[css]`. The theme form is posted by `I.remote_submit` → jQuery `serializeArray()`, which turns every line break into CRLF | **[community · docs-04, community-03]** · **[documented · community-04]** · **[verified · gapfill01-02]** |
| Devlog index, devlog posts, comments page | **No editor of their own.** They get the project's CSS (§6). | — | **[documented · s01-n1]** · **[verified · s01-n2]** |
| Jam `https://itch.io/jam/<slug>` | On the jam page, logged in as a host. A click on any `.edit_theme_btn` toggles the editor and `body.theme_editor_open`, and a URL hash matching `edit_theme` opens it on load. The editor (`JamEdit.ThemeEditor`) is only mounted for people who can edit the jam. The host's button label hasn't been observed. Then go to group "Misc" → "Custom CSS" → **Save**. | The whole theme as JSON, with your CSS in its `css` key. Your CSS is rendered through the jam theme template into `style#jam_theme` (§5). | **[documented (itch JS) · gapfill01-07; documented · s01-n1, community-04, community-05]** |

**What the field looks like** **[documented · repo-04, community-03]**:
- a plain `<textarea>` labelled "Custom CSS", with **no `maxLength`** and no syntax checking;
- a "↗" button (title "Expand") that opens an "Edit CSS" lightbox with the text "Changes are automatically applied.";
- a "Readme" button that opens a lightbox linking the CSS guide.

**A live preview is not a save** **[documented · community-05, repo-64]**.
- While you type, the editor applies your CSS to the open page, throttled to 100 ms.
  - On profiles and projects it writes `I.strip_css(css)` into `#custom_css`, and creates that element if it is missing.
  - On jams it re-renders `#jam_theme` instead.
- Visitors only get the CSS after you press **Save**.
- Logged-out visitors get a cached page. After a profile save they were served the old copy (`X-Cache-Status: HIT`, no `Cache-Control`) for about 2.5 minutes, then `EXPIRED` and the new one; adding a query string did not bypass the cache. The owner's own view is never cached (`BYPASS`, `Cache-Control: no-store`) **[verified 2026-10-16 · live-dom]**.
- Typical symptom when you skip the check: "it worked while I was editing, but nobody else sees it". Always confirm from a logged-out or private window.

**Save errors.**
- If the server answers with `errors`, all three editors (profile, project, jam) open an error lightbox listing them, with the sub-text "Your changes were not saved, please try again".
- If the request fails, the lightbox shows "Server error" **[documented · community-04; documented (itch JS) · gapfill01-05]**.
- An over-cap profile save returns such an error: the lightbox reads "We encountered an error", then "css: expected empty, or text between 1 and 5120 characters", then "Your changes were not saved, please try again", and the page keeps its previous CSS **[verified 2026-10-16 · live-cap-A1]** (§3).

**Jam editor specifics** **[documented (itch JS) · gapfill01-07]**:
- **Panel groups:**
  - Color: BG, BG 2, Text, Link, plus Headers and Button under "More options…";
  - Text: Font, Size 75–175 %, plus Header font;
  - Layout: Corners 0–30, BG 2 opacity 0–100, Shadow presets None/Subtle/Soft/Floating/Hard/Glow/Outline;
  - Images: Banner (fixed or full width), Background;
  - Misc: Custom CSS, only with CSS access.
- **"Copy theme" copies your CSS too.** It puts `{"format":"itchio_theme","version":1,"source":"jam","theme":{…}}` on the clipboard, and `theme.css` is part of it. "Paste theme..." therefore **replaces the Custom CSS field** along with the colours. Images are not copied. Use it to carry a style to the next jam, and never paste someone else's theme over CSS you want to keep.
- **The owner's preview scrolls differently.** For an editor, the page wraps `#wrapper` in `.theme_editor_columns > .theme_editor_primary_column` (documented in /t/6429680). While the editor is open, itch's `jam.css` makes that column the scroll container: `height: calc(100vh - 50px)` with `overflow-y: auto`. In a simulation with the real `jam.css`, the document stopped scrolling (scrollHeight = viewport), `body > #wrapper` matched 0 elements, and `#wrapper` still matched **[verified · gapfill01-09]**.
  - So `background-attachment: fixed`, `position: sticky` and scroll-driven effects can look different to the host than to visitors **[inferred · gapfill01-09]**.
  - Judge them logged out.

**Two different editors.** Descriptions and the profile bio use the Redactor rich-text editor, which may rewrite your markup. Stay in its `<>` HTML mode **[observed · sanitizer-29]**. The CSS field is a plain textarea that Redactor never touches. HTML rules are in [05-html-in-descriptions](05-html-in-descriptions.md).

---

### 3. Size cap and how to stay under it

The official guide states **no** size limit. It has 0 hits for `5120`, `5,120`, `KB`, `character` or `maximum`, and "limit" appears only in the site navigation **[documented · docs-32, s01-n1, gapfill01-04]**. The numbers below come from staff forum replies, community tools, live pages, git history and one live cap run.

**The profile and project caps were measured at their boundaries on 2026-10-16** (live probe Run 4: the owner saved generated CSS on the profile and on a draft project; `knowledge/evidence/live-probes/results-2026-10-16-caps.md`). The jam cap was not, so its exact value, its unit and what an over-cap jam save does remain open (see Gaps at the end).

| Page type | Cap | Evidence |
|---|---|---|
| **Profile** | **5,120 UTF-8 bytes.** 5,120 ASCII characters saved and 5,121 were refused. 5,120 `é` (10,240 B) and 2,604 `é` (5,122 B) were refused, while 2,603 `é` (5,120 B) saved, although the error says "between 1 and 5120 characters". <br>Staff: **"5kb"** per leafo (Admin, 2023-04-29). Asked to raise it, he answered "Probably not" and suggested linking resources hosted elsewhere. Creator tools treat it as 5,120 characters, which is right only for ASCII. | **[verified 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c]** · **[documented · docs-32, repo-01]** · 5,120 characters **[community · community-06]** |
| Profile, observed live | Largest live profile CSS: **5,116 chars**, ASCII, 234 LF. Other sizes: 4,725, 4,690, 2,558, 2,520, 2,189, 1,765, 449, 414. A 4,808-char file was saved successfully in June 2026. | **[observed · crawlprofile-27]** · **[documented · repo-01]** |
| **Project / devlog** | **No CSS cap.** On a draft project, single-line ASCII CSS from 40,000 up to **659,742 characters** saved whole. 659,743 and more fail with "missing token" in the error lightbox; a reload ruled out an expired token, so the request is too large for its form to be read. That is a request-size limit, not a CSS rule, and its exact value depends on the rest of the form and on how the text is encoded in the request, so CSS with multi-byte or escaped characters would reach it sooner **[inferred]**. <br>Older evidence fits: one project's live CSS is 38,560 chars (38,576 B served, 686 CRLF). It is byte-equal, after CRLF→LF, to its public source at a commit dated 2026-08-13; the previous commit (2026-08-03) differs. So it was saved after the 2026-06 jam revamp. Two more 2026 saves fit the same pattern: 10,586 chars (source dated 2026-09-15) and 5,631 chars (2026-03-10). <br>This contradicts a jam host's 2026-06-02 claim that 5,120 was now "consistent with profile and project pages". It fits leafo's 2023 remark that game pages "might actually be missing the size check". <br>Largest seen live: **93,105 chars after CRLF→LF (93,948 B served)**, 69,436 of them in `data:` URIs; its save date is unknown. Devlogs and the comments page have no editor of their own, so the same applies to them. | **[verified 2026-10-16 · live-cap-B1, live-cap-B2]** · **[inferred · gapfill01-01]** · **[documented · docs-33]** · **[observed · crawlproject-47, gapfill03-01]** · host claim **[community · docs-33]** |
| **Jam** | **"20kb"** since 2026-06-02; there was no limit before. The unit is undocumented. <br>On one jam, itch's 1,904 generated chars are followed by **20,410 chars of host CSS** (ASCII, 864 LF, balanced braces), plus the space itch appends (§4). The host trimmed it after the cap was set. <br>So the cap is at least 20,410, is not 20,000 in any unit, and most likely means 20,480 (20 KiB). It applies to **your CSS only**: the whole `style#jam_theme` block is 22,315 chars. | **[documented · crawljam-29, docs-31, gapfill01-04]** · **[inferred · gapfill01-03, docs-52]** |

**What to do:**

- **Profile.** Budget: ≤ 5,120 UTF-8 bytes after trimming leading and trailing whitespace, comments included **[verified 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a to live-cap-A3c]**. The boundary is exact (5,120 saves, 5,121 is refused), so a spare margin is optional; nnda's build script reserves 30 characters **[community · community-06]**.
- **Project or devlog.** No CSS cap: 659,742 characters saved, and larger saves fail as a request, not on a CSS rule **[verified 2026-10-16 · live-cap-B1, live-cap-B2]**.
  - The practical limit is page weight: every byte is loaded on the project, devlog and comments pages.
- **Jam.** Budget ≤ 20,410 characters of your own CSS, whitespace and comments included. That size is known to have saved; 20,480 is likely but untested **[inferred · gapfill01-03]**.
  - leafo noted that large jam CSS was mostly embedded fonts and images, which the Google Fonts picker now makes unnecessary **[documented · docs-31]**.
- **Unit (characters vs bytes).** On the profile the cap counts **UTF-8 bytes**, whatever the message says: 5,120 `é` (5,120 characters, 10,240 B) were refused, and so were 2,604 `é` (5,122 B), while 2,603 `é` (5,120 B) saved **[verified 2026-10-16 · live-cap-A2a, live-cap-A2c]**. Measure bytes; for ASCII-only CSS the two counts are equal. On jams the unit is untested: there, measure both and use the larger number **[documented · repo-01; community · community-06]**. What the server receives is known too:
  - **Profile and jam editors send LF.** They post `JSON.stringify(theme)` built from the textarea's `.value`. Browsers normalise that value to LF even when you paste CRLF.
  - **The project editor sends CRLF.** It posts the form through jQuery 3.6.0 `serializeArray()`, which rewrites every line break to CRLF.
  - Tested in Chrome 155 with itch's own `lib.min.js`: pasted `CRLF + LF` became 0 CR / 2 LF in `.value` and in the JSON, and 2 CR / 2 LF after `serializeArray()` **[verified · gapfill01-02]**. On the live site the same paste, from the same Brave 155, was stored with LF on the profile and CRLF on the project **[verified 2026-10-16 · live-css]**.
  - So a line break costs 1 byte of the profile cap, and 1 on jams if their server counts what it receives **[inferred · gapfill01-02]**. On projects, which have no CSS cap, the CRLF only adds page weight.
  - **A hypothesis, not a fact.** itch runs on leafo's Lapis. Lapis' `types.limited_text(N)`, which itch's open-source forum code uses, trims both ends and counts **code points**, counting `\r` and `\n` once each. Its legacy `max_length` counts **UTF-8 bytes**. Neither counts UTF-16 units. Whether itch's theme CSS uses either is **[unverified · gapfill01-06]**. The profile cap trims both ends and then counts bytes **[verified 2026-10-16 · live-cap-A2c, live-cap-A3b, live-cap-A3c]**, which matches neither function exactly as described, so the code behind it stays unknown.
- **Where the cap is enforced.** Only on the server, at save time. The textarea has no `maxLength`, and `theme_editor.min.js`, `jam.min.js` and `bundle.min.js` contain no length check **[documented · repo-04, community-04; documented (itch JS) · gapfill01-05]**.
- **What happens when you exceed it.** On the profile the save is **refused, never truncated**: the lightbox shows "We encountered an error", "css: expected empty, or text between 1 and 5120 characters" and "Your changes were not saved, please try again", and the page keeps its previous CSS **[verified 2026-10-16 · live-cap-A1]**.
  - That is the editor's generic error lightbox for server `errors` (§2) **[documented (itch JS) · gapfill01-05]**.
  - On a project nothing up to 659,742 characters is refused; above that the same lightbox shows "missing token" **[verified 2026-10-16 · live-cap-B2]**.
  - On jams it is untested. No live jam block ends at a cap boundary (largest host CSS 20,410, braces balanced), so truncation has not been observed there **[observed · gapfill01-05]**. A jam host expected over-cap hosts to find out "when they try making an update". That is an expectation, not an observed error **[community · gapfill01-04]**.
  - Always report the minified length to the user before they paste, and ask them to reload the page logged out after saving.

**What counts toward the cap.** itch stores the text as pasted (§4), so:

| Item | Effect on the stored size | Evidence |
|---|---|---|
| Comments, indentation, newlines | Stored. Comments count toward the profile cap: 5,120 characters inside a comment saved, 5,121 were refused. Indentation and newlines inside the sheet very likely count the same way. Across 62 live pages, comments are 9.3% of stored bytes, and whitespace is a median 17.3%. | stored **[verified · community-10, crawlproject-46; verified 2026-10-16 · live-c37, live-c40, live-c41]** · comments count **[verified 2026-10-16 · live-cap-A3a]** · inner whitespace counts **[inferred · corpus-18]** |
| The file's final newline | Free: leading and trailing whitespace are trimmed before the profile cap is checked (5,120 characters plus 5 whitespace characters saved, at either end). The private repo's file is 4,726 B with its final LF, and its live copy is 4,725 B. On projects and profiles leading whitespace is trimmed from storage too, so leading blank lines are not stored there. | **[verified · corpus-04, corpus-40, s01-n5; verified 2026-10-16 · live-css, live-cap-A3b, live-cap-A3c]** |
| Each line break | Stored as LF on profiles and jams, and as CRLF (2 bytes) on projects, whatever the source used. That is how each editor sends it: profiles and jams send JSON built from `.value`, projects send jQuery `serializeArray()` (above). The same paste from the same browser was stored with LF on the profile and CRLF on the project, so the CR comes from itch's project editor, not from the browser. On projects, prefer a single-line minified file: a 686-line file carries 686 extra bytes. | **[verified · corpus-03, gapfill01-02; verified 2026-10-16 · live-css]** |
| Non-ASCII (`→`, `★`, kana, emoji) | 1 code point each, but 2–4 UTF-8 bytes (and 2 UTF-16 units for astral characters such as emoji). The profile cap counts the bytes. | **[verified · corpus-19]** · bytes count **[verified 2026-10-16 · live-cap-A2c]** |

**How to stay under the cap:**

1. **Keep a commented source file and paste only a minified build.** The private repo works this way: its source is `src/main.css`, and it pastes `dist/main.min.css`. The live profile serves that file byte for byte (4,725 chars) **[verified · corpus-40, s01-n5]**.
2. **Keep bulk out of the pasted CSS.**
   - Don't Base64-embed fonts or images in profile CSS. leafo's advice is to link resources hosted elsewhere **[documented · docs-32]**.
   - Extra rules can live in an external sheet loaded with `@import` (not on jams, §5). The owner's profile imports one from a vercel.app host **[verified · corpus-40]**.
3. **Prefer raw UTF-8 over `\hex` escapes when space is tight.**
   - Both survive verbatim **[verified · corpus-19, corpus-20; verified 2026-10-16 · live-c25, live-c26]**. Pages are `text/html` with `<meta charset="UTF-8">` first in `<head>`, so no `@charset` is needed **[verified · corpus-49, s01-n2]**.
   - `→` costs 1 char / 3 bytes, while `\2192` costs 5 / 5. Use escapes only when your toolchain might mangle encodings.
4. **Don't rely on nesting to save space.**
   - Native nesting is stored verbatim **[verified 2026-10-16 · live-c16, live-c17]**. But once the parent selector is short it saves no characters.
   - Visitors need Chrome/Edge 120+, Firefox 117+ or Safari 17.2+ for full support **[observed · crawlprofile-57]**.
   - Use flat `#wrapper …` rules for anything essential.
5. **Measure after every build.** This snippet is mine. It mirrors itch's trailing trim, and Python reads CRLF as LF. On a **profile**, the byte count is the one the cap checks **[verified 2026-10-16 · live-cap-A2c]**. On a **project**, add the line-break count to both numbers, because each break is sent as CRLF:

```sh
python -c "import sys;s=open(sys.argv[1],encoding='utf-8').read().rstrip();print(len(s),'chars',len(s.encode()),'UTF-8 bytes',s.count('\n'),'line breaks')" dist/main.min.css
```

   Two test runs:
   - On the repo's profile file it prints `4725 chars 4725 UTF-8 bytes 0 line breaks`, which matches the live block **[verified · s01-n8]**.
   - On the 2026-08-13 project source it prints `37874 … 37890 … 686`. Adding 686 to each gives 38,560 chars and 38,576 B, which is exactly what that project serves **[verified · gapfill01-01]**.

**Minifier and typing pitfalls.** All of these fail **silently**, with no console message:

| Broken output | Effect | Fix | Evidence |
|---|---|---|---|
| `calc(40px+10px)` | Declaration dropped | Keep spaces around `+` and `-` in `calc()` | **[verified · localtests-41]** |
| `calc(50px - 0)` | Declaration dropped | Write `0px` inside `calc()` | **[verified · localtests-41]** |
| `@media (…) and(…)` | Whole block dropped | Keep the space: `and (` | **[verified · localtests-41]** |
| `#wrapper::selection` (space removed) | Means `#wrapper`'s own selection, not its descendants' | Never strip whitespace *before* `:` | **[verified · repo-06]** |
| `// note` line | Swallows the next rule's selector | Use `/* */` only | **[verified · localtests-42]** |
| Stray `}` | Kills the next rule | Balance braces | **[verified · localtests-42]** |
| Missing `}` | The next rule becomes a **nested** rule (`.a #wrapper .b`) that never matches | Balance braces | **[verified · localtests-42]** |
| Regex minifier applied inside strings | `content:"Hi, you: there"` becomes `"Hi,you:there"` | Use a string-aware minifier, or check `content:` values after minifying | **[verified · s01-n6]** |

---

### 4. What itch does to your CSS when you save it

**Nothing that changes its meaning: itch passes the text through.**
- Public source files were diffed against the live CSS. Each is byte-identical or differs only in newline style and trailing whitespace **[verified · corpus-01]**.
- The owner's profile is byte-identical to the pasted minified file, minus its final LF **[verified · corpus-40, crawlprofile-24, s01-n5]**.
- A 45-probe sheet saved on a draft project came back identical apart from CRLF line breaks, whitespace trimmed at both ends and the deleted `</style>` sequences. Saved on the profile, the same sheet came back the same way except that its LF line breaks were kept, logged in and logged out **[verified 2026-10-16 · live-css, live-c01 to live-c45]**.

| Aspect | What happens | Evidence |
|---|---|---|
| Minification, reformatting | None | **[verified · community-10, crawlprofile-24, crawlproject-46; verified 2026-10-16 · live-css]** |
| `/* comments */` | Kept (e.g. 45 on one project page, 24 on one jam). On a project and on the profile also with non-ASCII, `<!--` or `<script>` inside. | **[verified · community-10; verified 2026-10-16 · live-c37, live-c40, live-c41]** · **[observed · crawljam-28]** |
| `#wrapper` prefixing / scoping | None. Unscoped selectors reach itch's own UI. | **[verified · corpus-01, crawlproject-46]** |
| HTML entities | None. `>`, `<`, `&` and `"` are served raw: 0 entities and 397 raw `>` across 62 pages. A pre-escaped `&gt;` makes Chrome drop the rule. On a project and on the profile a raw `>` combinator and `& < >` inside a string were stored raw and applied. | **[verified · corpus-02, sanitizer-32; verified 2026-10-16 · live-c23, live-c24]** |
| `@import` | Kept, for Google Fonts and for non-Google HTTPS hosts. On a project and on the profile also `http://` and `data:` imports and imports with `layer()`, `supports()` or a media query; the `data:` ones applied. | **[verified · sanitizer-32, corpus-40; verified 2026-10-16 · live-c03 to live-c08]** |
| Nesting `&`, `!important`, `@media`, `@property` syntax with `<`, data-URI SVG markup | Kept as written. On a project and on the profile also `@charset` (not first), an `@layer` statement and block, `@font-face` with `local()` or an `http://` src, `@container` size and style queries, `@scope`, nested and range `@media`, `@starting-style`, `@view-transition`, `@supports not`, `@counter-style`, `@function`, `random()`, `sibling-index()` and `content:"x" / ""`. All applied in Chromium 155 except `random()`, which it doesn't support yet. | **[verified · corpus-02, community-10; verified 2026-10-16 · live-c01, live-c02, live-c09 to live-c22, live-c27 to live-c31, live-c36]** · **[observed · crawlprofile-57, crawljam-28]** |
| Non-ASCII UTF-8 and `\hex` escapes | Kept byte for byte, including astral characters; 0 U+FFFD | **[verified · corpus-19, corpus-20; verified 2026-10-16 · live-c25, live-c26, live-c37]** |
| Line endings | **Profile: LF.** **Project/devlog: CRLF.** Both are converted whatever the source used: a CRLF source becomes LF on a profile, and an LF source becomes CRLF on a project. **Jam:** LF on recent saves, CRLF on some older ones (2 of 23 sampled jams). The CR comes from itch, not from the browser: the same paste from the same browser was stored with LF on the profile and CRLF on the project. That fits itch's editor code, which converts before the save: `.value` → JSON on profiles and jams, jQuery `serializeArray()` on projects (§3). | **[verified · corpus-03, s01-n2, gapfill01-02; verified 2026-10-16 · live-css]** · **[observed · crawlprofile-26, crawljam-28]** |
| Trailing whitespace | Trimmed (profile, project). | **[verified · corpus-04; verified 2026-10-16 · live-css]** |
| Leading whitespace | **Trimmed on projects and profiles**: a sheet sent with two blank lines and two spaces before its first comment was stored starting at the comment, on both. Jams are untested; none of 24 sampled jam host blocks starts with whitespace, which is consistent with a trim at both ends but also with nobody writing leading blank lines. | **[verified 2026-10-16 · live-css]** · jams **[unverified · gapfill01-06]** |
| Jam only | itch appends **one space** after your CSS. A jam with no host CSS has a tail of exactly `" "`. | **[verified · s01-n3]** |
| `</style>` | **On a project and on the profile every `</style>` is deleted**, case-insensitively and with inner whitespace (`</STYLE >`), inside comments and strings alike. The rest of the sheet is unchanged and the `<style>` element is not closed early. The editor's live preview runs `strip_css`, which removes only the **first** case-insensitive `</style>` (regex without `g`). On the live site, one profile whose owner had pasted a whole HTML document was served without its `</style>`, while the other HTML tags stayed. Jams are untested, and so is whether the removal happens on save or on render (the probe read the served page). | **[verified 2026-10-16 · live-c42, live-c43, live-c44]** · **[documented · repo-05]** · **[observed · crawlprofile-25]** |
| Empty CSS | `style#custom_css` is omitted (present on 9 of 51 sampled profiles) | **[verified · crawlprofile-24]** |
| Syntax validation | None. Invalid text is stored as-is, and the browser's error recovery decides what survives (§7). On a project and on the profile, `expression()`, `behavior:`, `-moz-binding:` and `url(javascript:)` were stored unchanged, with no message on save. | **[observed · crawlprofile-25]** · **[verified · support-08; verified 2026-10-16 · live-c32 to live-c35]** |

What this means in practice:

- **Paste CSS only.** HTML or a `<style>` wrapper turns into junk selectors, and the first real rule is lost with it **[observed · crawlprofile-25]**.
- **Don't trust editor round-trips to clean anything up.** What you paste is what visitors' browsers parse.
- **Normalise before comparing scraped CSS to a source**: convert CRLF to LF and trim both ends **[verified · corpus-03; verified 2026-10-16 · live-css]**.
  - Quoted sizes differ for the same reason. The game-28 project CSS is 10,569 bytes as served (366 CRLF) and 10,203 characters once normalised **[verified · docs-33, s01-n2]**.

---

### 5. Where the CSS is injected, and in which order

Observed `<head>` order (logged out; `[…]` = optional) **[verified · s01-n2, s01-n3, sanitizer-32]**:

```text
profile         meta charset → link user.css → scripts → style#user_theme → [theme font link] → style#custom_css
project/devlog  meta charset → link game.css → scripts → style#game_theme → [theme font link] → style#custom_css
jam overview    meta charset → link jam.css  → scripts → style#jam_theme (= generated theme + YOUR CSS + " ") → [theme font link]
```

**Profile, project, devlog and comments pages**
- **`style#custom_css` is the last element of `<head>`.** No `<link>` or `<style>` follows it on any of the five pages checked **[verified · s01-n2]**. It is therefore the last author stylesheet in the served HTML, and **wins specificity ties** against the itch bundle (`user.css`/`game.css`) and the theme block **[verified · sanitizer-32]**. After itch's scripts, two `style[itchio-grid-sizer]` elements follow it on the profile, owner and logged out **[verified 2026-10-16 · live-dom]**; runtime-inserted styles are covered in [06-cascade-and-specificity](06-cascade-and-specificity.md).
- **Theme output is class-based, so ID selectors beat it.** The guide says the theme editors' CSS is applied with classes and recommends ID selectors for precedence, which is why rules start with `#wrapper` **[documented · s01-n1]**.
- **`@import` must come first, at top level.**
  - An `@import` after any style rule or `@font-face`, or nested in `@media{}`/`@supports{}`, is dropped without a network request.
  - Only `@charset`, `@layer x;` statements and (per the current draft) `@supports-condition` may precede it. On a project and on the profile, six imports placed after an `@charset` and an `@layer` statement all stayed import rules **[verified 2026-10-16 · live-c01 to live-c08]**.
  - To make an import conditional, put the condition on the import itself **[verified · repo-10, external-03, external-50]**. On a project and on the profile, `data:` imports with `supports()` and `screen` applied **[verified 2026-10-16 · live-c07, live-c08]**.
- **Imported rules lose ties to your own rules.** An imported sheet behaves as if written where its `@import` sits, so its rules lose specificity ties to your later rules. This follows from the CSS cascade spec and was not re-tested here; see [08-external-css](08-external-css.md) **[inferred]**.
- **Nothing blocks external resources.**
  - No Content-Security-Policy is sent on profile, devlog, comments or jam pages.
  - Project pages send only `frame-ancestors 'self' https://itch.io`.

  So no CSP stops external stylesheets, fonts or images **[verified · s01-n2]**.

```css
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");
@import url("https://example.com/extra.css") screen;
#wrapper .user_profile{font-family:"Syne",sans-serif}
```

**Jam pages**
- **There is no `style#custom_css` on a jam.** Your CSS is appended after itch's generated theme rules, inside `style#jam_theme`, followed by one space **[verified · s01-n3; documented · community-05]**.
- **Every `@import` in jam CSS is therefore dead,** because it always follows style rules.
  - On a live jam, the host's CSS starts with `@import` at offset 1,733, right after the generated rules.
  - In Chrome 155 that sheet parses to 27 style rules and **0** import rules. Moving the same `@import` to the top yields 1 import rule **[verified · s01-n3, s01-n4]**.
- **On jams, load fonts another way:**
  - with `@font-face`, which parses fine after style rules **[verified · s01-n4]**;
  - or with the theme editor's font picker, whose `<link>` comes after `jam_theme` **[verified · s01-n3]**.

```css
@font-face{font-family:"HostFont";font-display:swap;
  src:url("https://example.com/hostfont.woff2") format("woff2")}
#wrapper .jam_title_header{font-family:"HostFont",sans-serif}
```

**Blanket font rules are safe for icons.** `#wrapper *{font-family:…}` does not break itch's icon glyphs, because `[class^="icon-"]` carries `font-family:"icomoon" !important` **[verified · itchcss-44]**.

---

### 6. Which pages get the CSS

| Page | URL pattern | Gets your CSS? | Evidence |
|---|---|---|---|
| Profile | `<user>.itch.io/` | Yes: `style#custom_css` | **[verified · s01-n2; verified 2026-10-16 · live-css]** |
| Project | `<user>.itch.io/<game>` | Yes: `style#custom_css` | **[verified · s01-n2; verified 2026-10-16 · live-css]** |
| Devlog index | `…/<game>/devlog` | **Yes, the project's CSS** (identical SHA-1) | **[verified · s01-n2]** · guide: "Project pages (Including Devlog posts)" **[documented · s01-n1]** |
| Devlog post | `…/<game>/devlog/<id>/<slug>` | **Yes, the project's CSS** | **[verified · s01-n2]** |
| Comments page | `…/<game>/comments` | **Yes, the project's CSS** | **[verified · s01-n2]** |
| Purchase popup | `…/<game>/purchase` | No: only `popup.css`, and no `#wrapper` | **[verified · s01-n2]** |
| Jam overview | `itch.io/jam/<slug>` | Yes, inside `style#jam_theme` | **[verified · s01-n3]** |
| Jam entries | `itch.io/jam/<slug>/entries` | No: `main.css` plus a 252-char `jam_theme` with variables only, and no `#wrapper` | **[verified · s01-n3]** |
| Other jam sub-pages (`/results`, `/rate/<id>`, `/community`, `/feed`) | — | No (variables only) | **[observed · evidence/crawljam.md §2]** (not re-checked here) |

**One stylesheet, several DOMs.** The same project CSS lands on four page types with different markup **[verified · s01-n2]**:

| Element | Project page | Devlog index | Devlog post | Comments page |
|---|---|---|---|---|
| `#wrapper`, `#inner_column`, `.footer` | yes | yes | yes | yes |
| `.columns`, `.left_col`, `.formatted_description` | yes | — | — | — |
| `.game_devlog_page` | — | yes | — | — |
| `.game_devlog_post_page`, `.split_columns` | — | — | yes | — |
| `.game_comments_page` | — | — | — | yes |

- A layout rule written against `.columns` does nothing on devlogs.
- A broad rule such as `#wrapper #inner_column{…}` changes all four page types.
- To target one page type, start the selector at that page's own widget class, e.g. `#wrapper .game_devlog_post_page …`.

---

### 7. What you cannot do

- **No JavaScript.**
  - The editor's only code field is the CSS textarea, and the stored theme has no script key **[documented · repo-04, repo-64; observed · crawlprofile-42]**.
  - The CSS guide never mentions JavaScript **[documented · s01-n1]**.
  - For per-visit or live behaviour, serve a stylesheet from your own HTTPS endpoint and `@import` it (profile and project pages only). The owner's profile does exactly this **[verified · corpus-40, s01-n5]**.
- **No separate CSS for devlogs or the comments page,** and none at all on jam sub-pages (§6) **[verified · s01-n2, s01-n3]**.
- **No automatic scoping.** itch does not prefix your selectors **[verified · corpus-01]**. The guide asks you to place all rules inside `#wrapper`, so that you don't break itch's core UI; the site header lives outside it **[documented · s01-n1]**. Policy is in [02-rules-and-policy](02-rules-and-policy.md).
- **No HTML through the CSS field.** Markup belongs in the description or bio (`<>` mode), where a separate sanitizer applies **[observed · crawlprofile-25, sanitizer-29]**.
- **No raising the cap on request.** leafo declined for profiles **[documented · docs-32]**.
- **No `@import` on jam pages** (§5) **[verified · s01-n4]**.
- **No preview for visitors.** Unsaved editor changes exist only in the owner's browser **[documented · community-05]**.
- **No syntax feedback.** itch stores any text that fits the cap, and browsers drop invalid parts without a message **[verified · support-08, localtests-42]**:
  - an unknown selector in a selector list drops the **whole** rule, including its valid selectors;
  - an unknown value drops only that declaration;
  - an unknown at-rule or an invalid nested rule is skipped, and the rest of the sheet survives;
  - `:is()` forgives unknown pseudo-classes.

  Put new pseudo-elements (e.g. `::scroll-marker`) in rules of their own.

---

### 8. Jam pages in practice

The guide's jam section only arrived with the 2026-06-01 revamp, so older advice about jams is mostly obsolete (body backgrounds, no `#wrapper`, `!important` button hacks) **[documented · gapfill01-04]**. This section adds what a host needs beyond §2–§6.

**Checklist for jam CSS:**
1. **Open the editor on the jam page itself** (§2): use the host's `.edit_theme_btn`, or `https://itch.io/jam/<slug>#edit_theme` while logged in. Custom CSS is under "Misc".
2. **Stay within the size cap:** ≤ 20,410 characters of your own CSS is known to save (§3). Never use `@import`, because it is dead on jams (§5).
3. **Judge the result logged out.** The host's own view adds editor wrappers and a different scroll container (§2).
4. **Run a keyboard pass.** The facts below come from Tab runs through three live jam overviews with itch's scripts enabled (1280 px, logged out, images blocked) **[verified · gapfill01-10]**.

**Focus order on a jam overview:**

| Order | Region | Stops | Inside `#wrapper`? |
|---|---|---|---|
| 1 | Site header: "Skip to main content", logo, 5 nav links, search box and button, Log in, Register | 11 | no |
| 2 | `.jam_header_widget`: host links, stat links, `.header_tab`s | 5–9 | yes |
| 3 | `.jam_submitter_widget`: Join jam / View results | 0–1 | yes |
| 4 | `.jam_content` (your description). Embedded iframes add their own inner stops. | 3–49 | yes |
| 5 | `#entries`, only on some jams: **3 stops per entry**: "Add to collection", title, author. The thumbnail link has `tabindex="-1"`. | 57–72 | yes |
| 6 | `.itch_footer` itch.io link, only when `#entries` is shown | 1 | yes |

There is no `.footer` and no `<main>` on the overview (0 of 3).

**Skip link.** The served HTML points "Skip to main content" at `#maincontent`, which doesn't exist. itch's JS rewrites it to `#view_jam_<id>`, which does (3 of 3). A script-free harness therefore shows a broken skip link that real visitors don't have **[verified · gapfill01-11]**.

**Invisible stops in itch's entry grid.** "Add to collection" sits in `.game_cell_tools`. Its `opacity:0` is lifted only on `:hover`, so keyboard users land on an invisible control on every entry: 24 of 24 and 19 of 19 in the two grids tested **[verified · gapfill01-12]**. Spoilers (`.user_formatted .spoiler:focus{outline:0}`) are focusable but have no ring.

**Default focus ring.** Inside `#wrapper` it is `outline: auto 1px #361275`.
- On dark jam panels that ring is nearly invisible: WCAG contrast 1.27–1.29 on the two dark hosts tested **[verified · gapfill01-13]**.
- `#wrapper{--itchio_input_focus_color:…}` recolours links and entry titles, but **not** `.button` (hardcoded `#361275`) or the header tabs **[verified · gapfill01-13]**.
- Use an explicit rule instead. Appended after a host's CSS, this snippet gave a 2 px gold ring to every stop inside `#wrapper` on two jams (header links and tabs, the Join jam `.button`, description links, spoilers, entry links), and left 0 invisible entry stops **[verified · gapfill01-12, gapfill01-13]**:

```css
#wrapper a:focus-visible,#wrapper .button:focus-visible,#wrapper summary:focus-visible,
#wrapper .spoiler:focus-visible{outline:2px solid #ffc857;outline-offset:2px}
#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}
```

**Never remove outlines with `!important`.**
- One live jam's CSS contains `outline:none !important`. It leaves 7 header and submitter stops with no ring at all. Without that CSS, all 10 had one.
- A later `:focus-visible` rule without `!important` could not restore them **[verified · gapfill01-13]**.
- The access request already asks you to confirm your pages stay "accessible" and operable **[documented · s01-n1]**.

**`.itch_footer` (the "powered by itch.io" strip).**
- **Markup:** `div.itch_footer > span.powerd_by + a[title="itch.io"] > img.header_logo[alt=""]`. It exists only inside `#entries`, so only on jams that show entries, and it is inside `#wrapper`. The link's accessible name comes from its `title`. itch's `jam.css` and the generated theme both style it **[verified · gapfill01-14]**.
- **Policy is not documented.** The guide's "do not hide these links" is written for the project page's `.footer`. The jam layout lists no footer **[documented · gapfill01-04]**.
- **Treat it as protected anyway.** Hiding it would hide itch branding and a link, and the access request asks you to confirm you "will not alter itch.io's built in UI" **[documented · s01-n1]** **[inferred · gapfill01-14]**. Recolouring it for contrast is a smaller step, but no source says it is allowed either.

---

### Section notes

New evidence for this section was gathered on **2026-10-14, 13:40–13:45 UTC**.
- **Requests:** 14 GETs to itch.io: two `robots.txt` files and 12 pages. One page returned 429 and was retried once after 45 s.
- **Fetching:** curl with a desktop Chrome User-Agent, logged out, at least 2.5 s between requests.
- **Storage:** raw files stay in the session scratchpad only.
- **Analysis:** `heads.py` (in the scratchpad) lists the `<head>` order and per-block chars, bytes, CR, LF, entity count, raw `>`, `@import` offsets, SHA-1 and the tags after each block. It never prints CSS text.
- **Re-running:** to reproduce, fetch the URLs below with the same pacing and parse `<head>` the same way.

| id | Check | Result |
|---|---|---|
| s01-n1 | `https://itch.io/docs/creators/css-guide`, text extracted | The guide still states: <br>• access is per account, empty accounts are refused, and you must read the whole guide; <br>• the editor is on "Project pages (Including Devlog posts)", "Jam pages" and "Profile pages"; <br>• "contact us" → `/support`; <br>• the four request points; <br>• theme CSS uses classes, so ID selectors win; <br>• itch will "try to email all CSS users" about major changes; <br>• place rules inside `#wrapper` (project and jam layouts); <br>• the jam page gets extra editor wrappers for a host; <br>• test logged out; <br>• external resources over HTTPS, or Base64. <br>0 hits for `limit`, `5120`, `character`, `minif`. "JavaScript" appears only in the site's footer nav (API docs). |
| s01-n2 | `mirokshi.itch.io/`; `creator-64.itch.io/game-28` plus its `/devlog`, `/devlog/<id>/<post>`, `/comments`, `/purchase` | **Head order:** <br>• profile: `meta charset → user.css → scripts → user_theme → custom_css`; <br>• project, devlog index, devlog post and comments: `meta charset → game.css → scripts → game_theme → Google Fonts link → custom_css`; <br>• `/purchase`: `popup.css` only, with no `#wrapper` and no `custom_css`. <br>Nothing follows `custom_css` in `<head>` on the five pages. <br>**Same CSS on four pages:** the igua pages serve an identical `custom_css` (10,569 B, 366 CR + 366 LF, SHA-1 `7a7c0185d61b`) and an identical `game_theme`. <br>**Body page names:** `user`, `view_game`, `game.devlog`, `game.devlog_post`, `game.comments`, `game_purchase`. The DOM markers in the §6 table were read from these bodies. <br>**Headers:** `Content-Type: text/html` (no charset) everywhere; a CSP (`frame-ancestors 'self' https://itch.io`) only on the project page; `X-Frame-Options: SAMEORIGIN` and no CSP on the others. |
| s01-n3 | `itch.io/jam/gdevelop-big-game-jam-10`, its `/entries`, `itch.io/jam/game-off-2026` (no host CSS) | **Head order:** <br>• overview: `jam.css → scripts → jam_theme → Google Fonts link`, with no `custom_css`; <br>• `/entries`: `main.css → jam_theme (252 chars, variables only) → scripts`, with no `#wrapper`. <br>**gdevelop `jam_theme`:** 3,540 chars. The generated part ends at offset 1,733, and the host part starts there with `@import`. 109 LF, 0 CR, 0 entities. It ends in `"} "`. <br>**game-off-2026:** the generated part ends at 1,711, and the tail is exactly `" "`. |
| s01-n4 | Headless Chrome 155.0.8059.79, local synthetic pages in the scratchpad: the gdevelop `jam_theme` text, and a control with its `@import` moved to the top | Real order: 27 rules, all `CSSStyleRule`, 0 `CSSImportRule`. Control: 1 `CSSImportRule` + 27 style rules. <br>A second page with `.x{} @font-face{…} #wrapper .y{}` parses as `CSSStyleRule, CSSFontFaceRule, CSSStyleRule`. |
| s01-n5 | Live `mirokshi.itch.io` `style#custom_css` vs `itch-io-custom-css/dist/main.min.css` (read-only) | 4,725 B vs 4,726 B; equal after removing the file's final LF. `@import` at offsets 0 and 176, first rule brace at 257. The tag is `<style type="text/css" id="custom_css">`. |
| s01-n6 | The repo's minify regexes (`.claude/minify-css.ps1`) run in PowerShell 5.1 on crafted input | `#wrapper ::selection { color : red; }` → `#wrapper ::selection{color :red}` (descendant space kept). `calc(100% - 2rem)` kept. `content: "Hi, you: there"` → `content:"Hi,you:there"` (string altered). |
| s01-n7 | `https://mirokshi.itch.io/support` | HTTP 404, "We couldn't find your page". |
| s01-n8 | Size snippet from §3 run on `dist/main.min.css` | `4725 chars 4725 UTF-8 bytes`, matching the live block. |

**Gap fill, 2026-10-14, 14:13–14:45 UTC.**
- **Requests:** 15 itch GETs, all 200 and no 429. GitHub API reads of three public CSS sources and of leafo/lapis.
- **Browser:** headless Chrome 155 on JS-enabled local copies of three jam overviews, with itch requests blocked.
- **Where it is logged:** the full method, commands and tables are in `knowledge/evidence/gapfill.md` ("Gap fill for 01-how-it-works.md"), and the scripts are in `knowledge/evidence/gapfill01-tools/`.

| id | Finding |
|---|---|
| gapfill01-01 | Live project CSS equal to git commits dated 2026-08-13 (38,576 B), 2026-09-15 (10,586 B) and 2026-03-10 (5,634 B), each different from the previous commit. So the project editor accepted saves far above 5,120. |
| gapfill01-02 | Profile and jam editors post JSON from `.value` (LF). The project editor posts jQuery 3.6.0 `serializeArray()` (CRLF). Tested with itch's `lib.min.js`. |
| gapfill01-03 | gamelike-jam-010 `jam_theme` = 1,904 generated + 20,410 host (864 LF, ASCII, braces balanced) + 1 space, saved after the 20 KB cap was set. |
| gapfill01-04 | Guide, `/t/6429680` (10 posts, unchanged since 2026-06-09) and the 2026-07-02 changelog re-read. No size limit in the guide; no footer in its jam layout. |
| gapfill01-05 | No client-side length check. Server `errors` are shown in the "Your changes were not saved…" lightbox. No live block ends at a cap boundary. |
| gapfill01-06 | Lapis `limited_text` counts code points after trimming both ends; legacy `max_length` counts bytes. A hypothesis only. |
| gapfill01-07 | Profile button `button.tool_button.edit_theme_btn` "Edit theme". The `#edit_theme` hash handlers in `bundle.min.js` and `jam.min.js`. `JamEdit` groups and Copy/Paste theme. |
| gapfill01-08 | `.owner_tools .tool_button` hidden ≤ 980 px and `.owner_tools` hidden ≤ 800 px in user.css, game.css and jam.css. The editor becomes an overlay ≤ 650 px. |
| gapfill01-09 | Owner-view simulation with the real `jam.css`: the editor column becomes the scroll container, and `body > #wrapper` stops matching. |
| gapfill01-10 | Jam overview focus order: region sequence and stop counts on 3 jams plus a no-host-CSS control. |
| gapfill01-11 | Skip link: `#maincontent` is missing in the served HTML; JS rewrites it to `#view_jam_<id>`. |
| gapfill01-12 | "Add to collection" is focusable at opacity 0 (24/24 and 19/19 entries). The `:focus-within` fix was tested. |
| gapfill01-13 | Ring `#361275` has 1.27–1.29 contrast on dark jams. The variable doesn't reach `.button`. Host `outline:none !important` removed 7 rings. The snippet in §8 was tested. |
| gapfill01-14 | `.itch_footer` markup, position and styling. Not named by the guide. |

**Conflicts resolved in this section:**
- **Line endings.** sanitizer-47 says CRLF is "kept" byte for byte; corpus-03 and crawlprofile-26 say newlines are normalised.
  - Resolution: newlines are converted by page type (profile → LF, project → CRLF), as diffed source/live pairs show in both directions. Jam style depends on when the CSS was saved.
  - The cause is client-side (gapfill01-02): the browser normalises `.value` to LF, and jQuery's `serializeArray()` rewrites line breaks to CRLF for the project form. Live probe Run 2 (2026-10-16) fits: the same paste from the same browser was stored with LF on the profile and CRLF on the project, so itch's project editor, not the browser, adds the CR (live-css).
  - The rest of sanitizer-47 (served byte for byte, trailing trim) stands.
- **Jam trailing space.** community-10 read the jam CSS's final `"} "` as evidence that itch keeps trailing spaces on jams. s01-n3 shows the space is itch's own: a jam with no host CSS has a tail of exactly `" "`.
- **Jam cap figure.** docs-52 counts 20,411 host characters; crawljam-29 counts 20,410 stripped. The 1-character difference is itch's appended space. The host's own CSS is 20,410 characters, consistent with a 20 KiB cap.
  - The cap covers the host's CSS only, because the whole block is 22,315 characters (gapfill01-03).
- **Profile cap.** "5kb" (admin) and "5,120 characters" (community tools) agree on the number. The often-quoted "5,000 characters" is about a project/plugin page (the profile bio's own cap is also 5,000 characters, live-cap-D1), and "~4.5K" was one user's smallest achievable CSS, not a limit (community-06).
  - Live probe Run 4 (2026-10-16) settled it: 5,120 **UTF-8 bytes** after trimming both ends, comments included; over it the save is refused with an error, never truncated (live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a to live-cap-A3c; [results](../evidence/live-probes/results-2026-10-16-caps.md)).
  - Recommendation (the shared budget sentence): ≤ 5,120 UTF-8 bytes after trimming leading and trailing whitespace, comments included.
  - Earlier drafts of other sections tagged 5,120 as "verified" and said an over-cap CSS "won't save" before anyone had tested it; Run 4 has since confirmed both for the profile, with bytes as the unit.
- **Project cap.** "Same 5,120 as profiles" (host, 2026-06-02) conflicted with "might be missing the size check" (admin, 2023) and with 8 of 39 live blocks above 5,120.
  - Resolved against the host's claim: a 38,560-character project CSS was saved after 2026-08-03 (gapfill01-01). Run 4 confirmed it on 2026-10-16: there is no CSS cap; 659,742 characters saved, and larger saves fail as a request with "missing token" (live-cap-B1, live-cap-B2).
  - The 5,120 cap the host met was probably the profile-style JSON theme path that jams moved to on 2026-06-01. leafo then raised the jam cap to "20kb", and project pages still save through the older form path. This is inferred from gapfill01-02 and gapfill01-04.
  - Recommendation: no CSS budget on projects; keep them lean for page weight.
- **Largest jam block.** sanitizer-33 reports a 13,515-char maximum and crawljam-29 reports 20,410. These are different samples, not a contradiction; the larger one is used.
- **Access scope.** The guide's "per account" wins over a moderator's "for one of your projects" and a 2021 "only project pages" remark (community-01, community-45).
- **`</style>`.** The text is otherwise verbatim (corpus-01). The only observed removal is the single live case (crawlprofile-25), plus the client preview's `strip_css` (repo-05). Rule: never write it.
  - Live probe Run 1 (2026-10-16) settled it for projects: every `</style>` is removed, in any case and with inner whitespace, inside comments and strings, and leading whitespace is trimmed too (live-c42 to live-c44, live-css; [results](../evidence/live-probes/results-2026-10-16-project.md)). Run 2 found the same on the profile, logged in and logged out ([results](../evidence/live-probes/results-2026-10-16-profile.md)).
- **Readme label.** The source shows "Readme" (repo-04, community-03); GitHub #1661 writes "READ ME" (docs-04). Same control.

**Gaps (need a CSS-enabled account; probes the account owner can run, then restore the live CSS):**
- **Exact cap value and unit.** Settled for the profile on 2026-10-16: 5,120 UTF-8 bytes after trimming both ends, comments included (live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a to live-cap-A3c).
  - Still open on jams: save 20,480 characters, then 20,481, then the unit test as on the profile (`probes/probe-cap.md`, part C).
  - Newlines are no longer a question of "before or after conversion": itch's editor code converts them client-side before sending (gapfill01-02; Run 2's LF-on-profile, CRLF-on-project result fits, live-css). On the profile the server then counts bytes (live-cap-A2c); on jams the unit is still open.
- **What an over-cap save returns.** Settled for the profile on 2026-10-16: refused with the error lightbox ("css: expected empty, or text between 1 and 5120 characters"), never truncated (live-cap-A1). Still open on jams.
- **Whether projects have any cap above 38,576 B.** Settled on 2026-10-16: no CSS cap; 659,742 single-line ASCII characters saved on a draft project, and larger saves fail with "missing token", a request-size failure (live-cap-B1, live-cap-B2).
- **`</style>`, `<!--` and `<script`.** Settled for projects and profiles on 2026-10-16: every `</style>` is removed, and `<!--` and `<script>` inside comments are kept (live-c40 to live-c44). Still open: the same on jams, and whether `</style>` is removed on save or on render (the probe reads the served page).
- **Leading whitespace.** Settled for projects and profiles on 2026-10-16: trimmed (live-css). Still open on jams: save `\n\n  #wrapper{}` and check the served first byte.
- **The jam host's own markup.** The host's button label and the logged-in owner markup (`.theme_editor_columns`). Ask for a logged-in "Save page" of an overview the user hosts. (The profile's owner view has these wrappers around `#wrapper` even with the editor closed, live-dom; jams are unchecked.)
- **`#edit_theme` on phones.** Whether the hash opens the editor at phone width. The code path doesn't depend on width (gapfill01-07, -08).
- **Readme popup.** Whether the profile Readme popup still links to the 404 `<user>.itch.io/support`.
