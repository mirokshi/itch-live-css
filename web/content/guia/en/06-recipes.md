# Chapter 6 — Copy-ready recipes

Seven recipes built on chapters 1–5. Each one is a file in this guide's `recetas/` folder. Every recipe passes the itch-live-css validator, which checks the rules from chapter 2 that can be checked by machine. The size shown is after minifying, which is what you paste.

Paste the code as it is, or minify it first: on a profile every byte counts (chapter 1); on a project, one line avoids the doubled line breaks.

## Combining recipes

- **Define the palette once.** Recipes 1, 2 and 7 each start with tokens (`--bg`, `--text`, `--accent`). When you combine recipes, keep one copy of the tokens and change the colours there.
- **Include the reduced-motion block once.** Recipes 1, 2 and 5 contain it; if you use two of them, delete the second copy.
- **Check the total.** Recipes 1, 3, 4 and 5 together come to about 2,100 bytes on a profile once the duplicate block is removed, well under the 5,120 limit.

## Recipe 1 — Profile starter

**Page:** profile. **Size:** 1,093 bytes.

A dark palette as tokens, itch's link and footer colours taken over, solid card text, a focus ring that shows on dark backgrounds, and the reduced-motion block.

```css
/* Profile starter: palette, colours, dark theme, focus ring, reduced motion */
#wrapper {
  --bg: #0b1433;
  --text: #eef3ff;
  --accent: #ffc857;
  --focus-ring: #ffc857;
  --itchio_input_focus_color: var(--focus-ring);
  color-scheme: dark;
  background-color: var(--bg);
}
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--text); }
#wrapper .user_page a, #wrapper .footer a, #wrapper .game_title a { color: var(--accent); }
#wrapper .footer { color: var(--text); }
#wrapper .game_author, #wrapper .game_text, #wrapper .game_genre, #wrapper .game_platform { color: var(--text); }
#wrapper :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#wrapper :is(.game_cell, .header_tabs, .screenshot_list, .breadcrumbs) :focus-visible { outline-offset: -2px; }
#wrapper .game_cell { position: relative; }
#wrapper .game_cell:has(:focus-visible)::after { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; border: 3px solid var(--focus-ring); border-radius: inherit; }
#wrapper .game_cell:focus-within .game_cell_tools { opacity: 1; }
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

Change the four colours at the top and the whole page follows. If you switch to a light palette, also change `color-scheme: dark` to `light` and check the focus ring's contrast on white (chapter 4).

## Recipe 2 — Project starter

**Page:** project (also styles its devlog and comments). **Size:** 846 bytes.

The same idea for a project. Here itch's variables live on `#wrapper`, the text colour and the panel behind your content are restyled on `.inner_column`, and `min-height` stops itch's light grey from showing below a short page.

```css
/* Project starter (also styles the devlog and comments): palette, colours, panel, focus ring, reduced motion */
#wrapper {
  --bg: #0b1433;
  --panel: rgba(20, 32, 70, .92);
  --text: #eef3ff;
  --accent: #ffc857;
  --focus-ring: #ffc857;
  --itchio_bg_color: var(--bg);
  --itchio_text_color: var(--text);
  --itchio_link_color: var(--accent);
  --itchio_input_focus_color: var(--focus-ring);
  color-scheme: dark;
  background-color: var(--bg);
  min-height: 100vh;
}
#wrapper .inner_column { color: var(--text); background-color: var(--panel); }
#wrapper .inner_column a { color: var(--accent); }
#wrapper .button { background-color: var(--accent); color: var(--bg); }
#wrapper :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#wrapper :is(.game_cell, .header_tabs, .screenshot_list, .breadcrumbs) :focus-visible { outline-offset: -2px; }
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

Open the devlog and the comments page too after pasting: they share this sheet (R13).

## Recipe 3 — Profile card grid

**Page:** profile, Grid layout. **Size:** 588 bytes.

Even columns that don't overflow, one column on phones, cards of equal height, covers that fill their box, and a small lift on hover and on keyboard focus.

```css
/* Profile card grid: even columns, one column on phones, equal heights, clean covers, a lift on hover and focus */
#wrapper .mode_grid .user_game_grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); column-gap: 40px; }
@media (max-width: 500px) { #wrapper .mode_grid .user_game_grid { grid-template-columns: 1fr; } }
#wrapper .game_grid_widget { align-items: stretch; grid-auto-rows: 1fr; }
#wrapper .game_thumb img { width: 100%; height: 100%; object-fit: cover; }
@media (prefers-reduced-motion: no-preference) {
  #wrapper .game_cell { transition: translate .2s ease-out; }
  #wrapper .game_cell:focus-within { translate: 0 -4px; }
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  #wrapper .game_cell:hover { translate: 0 -4px; }
}
```

The lift only happens for visitors who haven't asked for reduced motion, and the hover version only on devices that can hover (R17, R18). The equal-height rule also reaches the carousels of your collections.

## Recipe 4 — Full-page glow

**Page:** profile or project. **Size:** 334 bytes.

Two soft colour glows fixed behind the whole page, under itch's buttons, catching no clicks.

```css
/* Full-page glow behind the content (profile or project), released while an HTML5 game is maximised */
#wrapper { position: relative; isolation: isolate; }
#wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: radial-gradient(circle at 20% 10%, rgba(255, 200, 87, .18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(120, 160, 255, .16), transparent 50%);
}
body.frame_maximized #wrapper { isolation: auto; }
```

Change the gradients freely: the structure around them is what keeps the layer behind the content and out of the way. The last line hands the screen back to an HTML5 game when it is maximised. Don't add a `transform` or `filter` to `#wrapper` with this recipe, or the glow scrolls with the page (chapter 3).

## Recipe 5 — Profile title entrance

**Page:** profile. **Size:** 296 bytes.

Your name slides up into place once, in 0.7 seconds.

```css
/* Profile title that slides in once, from hidden, and ends at rest */
@keyframes custom-in { from { opacity: 0; translate: 0 18px; } }
#wrapper #profile_header h1 { animation: custom-in .7s ease-out; }
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

The title is visible by default; the animation starts from the hidden state, so if it doesn't run, nothing is lost (chapter 5). This targets itch's text header. A profile with a banner image has no visible text title. Give your bio its own `<h1 class="custom-title">` and target `#wrapper .custom-title` instead (R20).

## Recipe 6 — Project frosted panel

**Page:** project. **Size:** 282 bytes.

Blurs whatever is behind the content column, such as a background image or recipe 4's glow, into frosted glass.

```css
/* Project: frosted glass behind the content, safe with a maximised HTML5 game */
#wrapper #inner_column { isolation: isolate; }
#wrapper #inner_column::before { content: ""; position: absolute; inset: 0; z-index: -1; backdrop-filter: blur(8px); }
#wrapper:has(.game_frame.maximized) #inner_column { isolation: auto; }
#wrapper:has(.game_frame.maximized) #inner_column::before { content: none; }
```

The blur sits on a pseudo-element, never on the column itself, and both are released while an HTML5 game is maximised. A blur on the column directly can stretch a maximised game to the full page height (R22). Make the panel colour from recipe 2 semi-transparent, or there is nothing to see through.

## Recipe 7 — Going past the profile limit with `@import`

**Page:** profile (also works on projects; never on jams). **Size of the pasted part:** 291 bytes.

When a profile design doesn't fit in 5,120 bytes, paste the essentials and load the rest from a file you host. Only the `@import` line counts toward the limit, not the file it loads.

```css
/* Profile over the cap: the import line goes first and loads the extras from a pinned URL; the pasted rules carry the look on their own */
@import url("https://cdn.jsdelivr.net/gh/USER/REPO@1.0.0/profile-extra.css");
#wrapper { --bg: #0b1433; --text: #eef3ff; --accent: #ffc857; background-color: var(--bg); }
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--text); }
#wrapper .user_page a, #wrapper .footer a { color: var(--accent); }
```

Rules for doing it safely:

1. **The `@import` must be the very first line.** Only comments, `@charset` or an `@layer` statement may come before it. Anything else, even an `@font-face`, and the import is dropped without warning (R9).
2. **Use a pinned, versioned address.** Publish the file in a GitHub repository, tag a release (`1.0.0`), and load it through jsDelivr with the tag in the URL, as above. To change it, tag a new release and update the `@import` line. Never use `raw.githubusercontent.com` or a gist: they are served as plain text and the browser ignores them (R10).
3. **The pasted part must stand on its own.** If the import fails, or an ad blocker stops it, visitors see only what you pasted. So the palette and colours live in the pasted part, and the imported file only adds extras.
4. **Pick a reliable host.** An `@import` holds back the whole page until it loads. In a test, a host that accepted the connection and never answered kept the page blank for more than five minutes. A well-known CDN is the safe choice.
5. **Not on jams.** A jam's CSS sits inside itch's own style block, where `@import` never loads. Paste everything, up to about 20 KB (chapter 1).

## Checklist

- [ ] Each recipe pasted on the right page type.
- [ ] One set of tokens and one reduced-motion block in the combined sheet.
- [ ] Profile total measured in bytes, under 5,120.
- [ ] Project pages checked on the main page, the devlog index, a devlog post and the comments.
- [ ] With an `@import`: first line, pinned jsDelivr tag, and the page still looks right with the import blocked.

---

## Sources

Every recipe is assembled from rules and blocks in the itch-live-css knowledge base (`knowledge/itch-custom-css.md`), cited in the chapter each technique comes from:

- Recipe 1: chapter 4 (S3, S4, S8, S9, S13) and chapter 5 (S4).
- Recipe 2: chapter 4 (S5, S8, S13), chapter 3 (S2) and chapter 5 (S4).
- Recipe 3: chapter 3 (S6, S7) and chapter 5 (S5).
- Recipe 4: chapter 3 (S11, S12).
- Recipe 5: chapter 5 (S3, S4) and chapter 2 (R20).
- Recipe 6: §4 "Maximized HTML5 game", safe frosted panel: verified · s04-gf-10, s04-gf-11, s04-gf-13; the page-tall frame: verified · s04-gf-08, s04-gf-09.
- Recipe 7: §8: `@import` placement: verified · localtests-09, localtests-50, itchcss-08; only the line counts: verified · external-01, repo-09; jsDelivr pinning and raw GitHub failing: verified · external-05, community-12, external-45; the page must work without the import: observed · repo-54; verified · external-06, localtests-12; a hanging host blanked the page over 330 s: verified · g08-17; jams: verified · s04-1, crawljam-14.

**Testing status.** Each file passed `engine validate()` for its page type on 2026-11-07. Sizes come from the engine's own minifier. The recipes have not yet been rendered on a live itch page.
