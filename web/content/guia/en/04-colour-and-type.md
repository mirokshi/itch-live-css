# Chapter 4 — Colour and type, with tokens and dark themes

Colour and fonts are where most custom CSS starts, and where itch's theme quietly fights back: a link colour that won't change, a font that only applies to half the page, card text you can't read on a dark background. This chapter shows where itch writes each colour and font, and how to take them over cleanly with a handful of tokens.

## 4.1 Try the theme editor first

The theme editor already sets background, text, link and button colours, a background image and a Google font. If an option there does what you want, use it: it costs you no CSS bytes and survives itch's changes. Write CSS for what the editor can't do. [S1]

## 4.2 Why your rules win

None of the theme's rules use ID selectors, and itch's own stylesheets only use IDs for its lightbox. So any rule that starts with `#wrapper` beats every normal itch rule. That's another reason for R2. [S2]

The only exceptions are a few itch rules marked `!important`. Those are the only places where you need `!important` too (R14). [S2]

## 4.3 Your own tokens

Define your palette once, as custom properties on `#wrapper`, and use them everywhere:

```css
#wrapper {
  --bg: #0b1433;
  --panel: #142046;
  --text: #eef3ff;
  --accent: #ffc857;
  --focus-ring: #ffc857;
}
```

Why `#wrapper` and not `:root`: properties on `:root` leak into itch's own UI. On a jam they recoloured the site header (R3). Everything inside `#wrapper`, footer included, can read tokens set on `#wrapper`. [S3]

Changing the palette later means changing these lines and nothing else.

## 4.4 Taking over itch's colours

itch has theme variables (`--itchio_link_color` and friends), but on profiles and projects many colours are written as plain values, not variables. Setting a variable changes only the things that read it. So you have to set the variable **and** restyle the elements that ignore it.

### Profile

itch declares its variables on `.user_page`, so override them there. Links, game titles and the footer use plain colours, so set those as well:

```css
#wrapper { background-color: var(--bg); }
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--text); }
#wrapper .user_page a, #wrapper .footer a, #wrapper .game_title a { color: var(--accent); }
#wrapper .footer { color: var(--text); }
```

[S4]

### Project, devlog and comments

Here itch declares ten variables on `#wrapper` itself. The text colour and the semi-transparent panel behind your content are plain values on `.inner_column`:

```css
#wrapper {
  --itchio_bg_color: var(--bg);
  --itchio_text_color: var(--text);
  --itchio_link_color: var(--accent);
  background-color: var(--bg);
}
#wrapper .inner_column { color: var(--text); background-color: var(--panel); }
#wrapper .inner_column a { color: var(--accent); }
```

Buttons also need their own rule (`#wrapper .button { … }`). [S5]

### Jam

Since itch's mid-2026 jam redesign, jam links and buttons follow the variables on `#wrapper`. If you change `--itchio_button_color`, also set its `_hover_color`, `_active_color`, `_shadow_color` and `_border_color` partners, or the hover, pressed and border states keep itch's colours. Some text in the entries grid is coloured with `!important` and needs `!important` from you as well. [S6]

### Background colour and image

Use `background-color`, `background-image` and the other longhands on `#wrapper`, never the `background` shorthand (R4). The theme's background image lives on that same element, and the shorthand erases it. [S7]

## 4.5 Dark themes

itch has no dark-mode rules of its own. When you go dark:

- **Tell the browser.** `#wrapper { color-scheme: dark; }` switches scroll bars and form controls inside the page to their dark versions. `light-dark()` returns the light value unless `color-scheme` is set, and itch never sets it. [S8]
- **Fix the faded card text.** On profiles, itch draws card authors at 75 % of the text colour and platforms and genres at 50 %. On dark backgrounds that can fall below readable contrast. Give them a solid colour:

  ```css
  #wrapper .game_genre, #wrapper .game_platform { color: var(--text); }
  ```

  [S9]
- **Recolour the profile footer** (shown in 4.4). It doesn't follow the theme. [S9]

### Following the visitor's light or dark setting

Because everything reads tokens, switching with the visitor's system setting is a few lines:

```css
@media (prefers-color-scheme: light) {
  #wrapper { --bg: #f6f4ef; --panel: #ffffff; --text: #1d1f2b; --accent: #8a4b00; color-scheme: light; }
}
```

This is standard CSS, not something itch does for you. On a profile, every extra palette costs bytes against the 5,120 limit, so measure (chapter 1). [S10]

## 4.6 Contrast you can trust

- **Body text needs at least 4.5:1** against what is behind it, and focus rings at least 3:1 (WCAG). [S11]
- **Measure against the brightest part of your background image**, not the background colour. A pale text colour measured 16.3:1 against the page's dark blue, but only 4.6:1 over the brightest patch of its background image. [S11]
- **Make panels semi-transparent, never text.** A translucent panel behind the text keeps contrast predictable. Translucent text depends on whatever is underneath. [S11]
- **High-contrast mode** (Windows "forced colours") removes shadows and gradients. Give cards `border: 1px solid transparent` so they still have an outline there. [S12]

## 4.7 A focus ring that matches your palette

itch's focus ring is a dark purple that almost disappears on dark themes (R19). This block (it reads the `--focus-ring` token from 4.3) replaces it everywhere, including on game cards, where a plain outline gets cut off:

```css
#wrapper { --itchio_input_focus_color: var(--focus-ring); }
#wrapper :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#wrapper :is(.game_cell, .header_tabs, .screenshot_list, .breadcrumbs) :focus-visible { outline-offset: -2px; }
#wrapper .game_cell { position: relative; }
#wrapper .game_cell:has(:focus-visible)::after {
  content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  border: 3px solid var(--focus-ring); border-radius: inherit;
}
#wrapper .game_cell:focus-within .game_cell_tools { opacity: 1; }
```

Pick a `--focus-ring` with at least 3:1 contrast on every surface it can land on. `#ffc857` gives 11.75:1 on `#0b1433`, but only 1.54:1 on white. [S13]

## 4.8 Fonts

### Where to set the font

The theme writes the font family as a plain value, not through `--itchio_font_family`. Changing the variable alone doesn't change the text. Set the family where itch does: [S14]

| Page | Selector |
|---|---|
| Profile | `#wrapper .user_page` |
| Project, devlog | `#wrapper .inner_column` |
| Jam | `#wrapper` |

### Extra weights and other fonts

A font picked in the theme editor loads only regular (400) and bold (700), plus their italics. For other weights, or a font the picker doesn't offer:

```css
/* Profile or project: the @import must be the very first line (R9) */
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");
#wrapper .user_page { font-family: "Syne", sans-serif; } /* project: #wrapper .inner_column */
```

[S15]

- **Copy the URL exactly** from Google Fonts and keep `&display=swap`. A wrong letter case, an unknown family or a weight range the font doesn't have makes Google answer with an error page. The whole import is then dropped without warning, and the fallback font shows. [S16]
- **Jams can't `@import`** (R9). Use `@font-face` with an absolute `https://` link to one font file per weight, from a host that allows cross-site font loading. [S16]
- **Privacy:** Google Fonts sees every visitor's IP address, which is a GDPR concern in the EU. Bunny Fonts offers a compatible `css2` address, or you can host the files yourself with cross-origin access enabled. [S17]
- **Only the `@import` line counts toward the profile limit**, not the size of the font file. [S18]

### Font size on profiles

A profile sets its font size as a percentage on `.user_page`. Sizes in `em` follow it; sizes in `px` or `rem` don't. [S19]

## Checklist

- [ ] Used the theme editor for what it can do.
- [ ] Palette defined once as tokens on `#wrapper`, never on `:root`.
- [ ] itch's variables set where the theme declares them, **and** links, titles, buttons and the footer restyled directly.
- [ ] Background set with longhands only.
- [ ] Dark theme: `color-scheme: dark`, solid card text colours, profile footer recoloured.
- [ ] Text at 4.5:1 or more over the brightest part of the background image; focus ring at 3:1 or more.
- [ ] Font family set on the right selector; Google Fonts URL copied exactly; no `@import` on jams.

---

## Sources

From the itch-live-css knowledge base, `knowledge/itch-custom-css.md` §0.1 (blocks B2, B3), §4, §7, §8 and §10.

- **S1** Theme editor first: documented · docs-44.
- **S2** No IDs in theme rules; `!important` counts: verified · crawlproject-31, s04-2, s04-4, itchcss-18, s04-1, docs-17, crawljam-07.
- **S3** Variables on `#wrapper`, `:root` leaked on a jam: verified · crawljam-42, itchcss-12, crawljam-05.
- **S4** Profile variables and plain colours: verified · itchcss-12, repo-20, repo-21, crawlprofile-32; footer colour: verified · itchcss-22.
- **S5** Project variables and plain values on `.inner_column`: verified · corpus-44, itchcss-13, crawlproject-21, crawlproject-24; inferred · s04-2.
- **S6** Jam variables, button partners, `!important` grid text: verified · crawljam-05, crawljam-08, crawljam-11, crawljam-34, itchcss-14.
- **S7** Background longhands: verified · itchcss-57, crawlprofile-35, crawlproject-23, itchcss-20, localtests-18.
- **S8** No dark-mode rules in itch, `color-scheme: dark`, `light-dark()`: verified · a11y-14, support-52, itchcss-27, support-59, s07-n2 T27; observed · s07-n11.
- **S9** Faded card text, footer: verified · a11y-38, crawlprofile-54, itchcss-22.
- **S10** `prefers-color-scheme` switch: general CSS, not tested on itch. The byte cost follows from R7.
- **S11** Contrast measured on the brightest image region, translucent panels: verified · s10-06; panels: inferred · s10-06. The 4.5:1 and 3:1 thresholds are WCAG 2.2.
- **S12** Forced colours and transparent borders: verified · s10-05, a11y-28.
- **S13** Focus block B2 and its contrast figures: verified · s04-gf-02, s04-gf-06, s04-gf-16. Reformatted onto several lines here; same rules.
- **S14** Font family is a plain value; where to set it: verified · crawlprofile-32, crawlprofile-37, crawlproject-24, crawlproject-28, crawljam-14; inferred for the variable.
- **S15** Theme fonts load 400/700 + italics: verified · corpus-13, corpus-45, gapfill07-05.
- **S16** Google Fonts errors drop the import; jam `@font-face`: verified · external-38, external-39, crawljam-02, itchcss-07, external-16.
- **S17** Privacy and alternatives: community · external-43; verified · x08-05.
- **S18** Only the `@import` line counts: verified · external-01, repo-09.
- **S19** Profile font size in `%`: verified · crawlprofile-39, itchcss-43.
