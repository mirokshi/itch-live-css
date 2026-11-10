# Chapter 3 — Layouts that fit on a phone

Most broken itch pages look fine on the creator's monitor and fall apart on a phone: a sideways scroll bar, a card grid that spills off the edge, a heading cut in half. This chapter shows the containers you're working inside and the few rules that keep a page inside the screen.

## 3.1 The boxes you're working inside

Every styled page has a `#wrapper`, but what sits inside it depends on the page type. Simplified:

```text
Profile        #wrapper.user_page_wrap
                 .user_page (.mode_grid or .mode_column)
                   #profile_header       your name or banner
                   .profile_content      bio column + game grid
                 .footer                 positioned at the bottom

Project        #wrapper.game_page_wrapper
                 #inner_column           960 px wide; 600 px at 1000 px or less
                   #header               banner or title
                   .view_game_page       the page itself
                   #view_game_footer

Devlog post    same #inner_column, then the post column
                 + a 307 px sidebar that stacks below at 1000 px or less

Jam overview   #wrapper.jam_page_wrap
                 .view_jam_page > .jam_banner_outer, .jam_body, #entries
```

[S1]

What matters for layout:

- **A project's `#inner_column` clips its content** (`overflow: hidden`), and so does a jam's `.jam_body`. Anything you push outside them, such as a shadow, a glow or a rotated card, gets cut. [S1]
- **A project's column jumps from 960 px to 600 px** at 1000 px and below. Your design has to work at both widths. [S1]
- **A project page's `body` stays light grey** (`#eee`). If your page is shorter than the window, that grey shows below it. Fix it with `#wrapper { min-height: 100vh; }`. [S2]

## 3.2 The widths to test

itch's own layout changes at these widths, so test on both sides of each:

| Page | Widths |
|---|---|
| Every page | **320 px** and **375 px** (small phones) |
| Profile | 800, 650, 600 |
| Project, devlog | 1000, 650, 600, 400 |
| Jam | 820, 800, 650, 600 |

The full list of switch points is 1001/1000, 961/960, 801/800, 651/650 and 601/600 px. [S3]

Test by resizing a desktop browser window or with the browser's device toolbar. Changing the user agent isn't needed, with one exception: a wide HTML5 game fixes the project column's width when the browser says it is a desktop. [S3]

## 3.3 Stopping the sideways scroll

A page scrolls sideways when something inside it is wider than the screen: an oversized image, a rotated card, a long word, a fixed width.

First, find the cause and fix it. Then add a safety net:

```css
#wrapper { overflow-x: clip; }
```

Use `clip`, not `hidden`. `overflow-x: hidden` also removes the sideways scroll bar, but it turns `#wrapper` into a scroll container, and anything `position: sticky` inside it stops sticking. `clip-path` won't help either: it hides the overflow visually, but the page still scrolls. [S4]

Avoid `100vw` for widths. On a desktop with a visible scroll bar, `100vw` is wider than the page, which creates the overflow you're trying to remove. Use `100%` instead. [S5]

## 3.4 Game grids that behave

The game grid is where most layouts break, because itch's JavaScript sizes it after your CSS has loaded. It writes the column widths in pixels and its own gap. So:

- Setting `--itchio_grid_gap` on `#wrapper` does nothing.
- Setting only a `gap` makes the grid wider than its box, and it overflows.

Set the columns and the gap together, in one rule that starts with `#wrapper`:

```css
/* Profile, Grid layout only */
#wrapper .mode_grid .user_game_grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  column-gap: 40px;
}

/* Jam entries */
#wrapper .browse_game_grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  column-gap: 40px;
}
```

Keep `.mode_grid` in the profile rule. Without it, the rule also hits profiles set to the Column layout and breaks them. [S6]

A profile grid keeps at least two columns even at 320 px. For one column on phones: [S6]

```css
@media (max-width: 500px) {
  #wrapper .mode_grid .user_game_grid { grid-template-columns: 1fr; }
}
```

Jam grids drop to one column at 320 px on their own. [S6]

### Equal card heights and clean covers

itch aligns cards to the top, so a card with a long title is taller than its neighbours. To make them equal:

```css
#wrapper .game_grid_widget { align-items: stretch; grid-auto-rows: 1fr; }
```

On a profile this selector also reaches the carousels in your collections. [S7]

To make every cover fill its box without stretching:

```css
#wrapper .game_thumb img { width: 100%; height: 100%; object-fit: cover; }
```

Covers load lazily, so never write a selector that depends on the image's `src`. [S7]

## 3.5 Text that fits

- **Large headings kept on one line** (`white-space: nowrap`) with a minimum size in `rem` make the page scroll sideways when a visitor uses a larger default font (tested at 32 px). Let the size follow the screen width, with a ceiling: `font-size: min(10vw, 6rem);`. [S8]
- **Never give a text box a fixed height with `overflow: hidden`.** When a visitor enlarges the text, the bottom of it disappears. Let the height grow with the text. [S8]

## 3.6 Leaving room for itch's own pieces

Some of itch's elements sit on top of your layout. Leave them room:

- **Profile footer.** It is positioned absolutely at the bottom of `#wrapper`, so a `margin-top` on it does nothing. Add space with a `margin-bottom` on the last block above it, or with padding on `#wrapper`. Keep the profile's 50 px of bottom padding. [S9]
- **Project bottom bar.** At 650 px and below, a project page has a fixed 50 px bar at the bottom of the screen. Don't put anything important behind it. [S10]
- **Top-right corner.** The Follow button and the other user tools sit there, outside `#wrapper`. Keep decorations away from that corner. [S10]

## 3.7 Full-page decorations without breaking the layout

A full-screen background layer (a gradient, a pattern, a glow) belongs on a pseudo-element of `#wrapper`, not on the page itself:

```css
#wrapper { position: relative; isolation: isolate; }
#wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
body.frame_maximized #wrapper { isolation: auto; }
```

The last line releases the isolation while an HTML5 game is maximised, so the game stays on top. It is the one allowed exception to starting with `#wrapper` (R2). Then paint the layer with `background-*` properties on `#wrapper::before`.

- `isolation: isolate` keeps the layer behind your content but in front of `#wrapper`'s own background.
- `pointer-events: none` stops it from catching clicks.

[S11]

Two traps:

- **Fixed layers that scroll with the page.** If `#wrapper`, `.user_page` or `#inner_column` has a `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change: transform` or `contain`, a `position: fixed` child stops being fixed to the screen. Put those effects on the pseudo-element or a child instead. [S12]
- **`background-attachment: fixed` is ignored on iPhones and iPads.** The fixed layer above works everywhere. [S12]

## Checklist

- [ ] Tested at 320 and 375 px, and on both sides of your page type's switch points.
- [ ] No sideways scroll. `#wrapper { overflow-x: clip; }` as a safety net, never `hidden`, no `100vw`.
- [ ] Grid columns and gap set together; the profile rule keeps `.mode_grid`.
- [ ] Big headings use `min(…vw, …rem)`; no fixed heights on text boxes.
- [ ] Nothing important behind the project's bottom bar or the top-right tools.
- [ ] Full-page decorations live on `#wrapper::before`, with no `transform` or `filter` on `#wrapper`.
- [ ] Checked logged out, on a live page.

---

## Sources

From the itch-live-css knowledge base, `knowledge/itch-custom-css.md` §3, §7, §9 and §10.

- **S1** Page structure, `#inner_column` widths and clipping, devlog sidebar, jam `.jam_body` clipping: verified · corpus-31, crawlprofile-01, crawlprofile-15, crawlproject-01, crawlproject-11, crawlproject-39, itchcss-35, itchcss-38, crawljam-19, crawljam-20.
- **S2** Project `body` stays `#eee`: verified · itchcss-37.
- **S3** Switch points and test widths, resize vs user agent: verified · a11y-31, a11y-34, s10-01, crawljam-47, crawlproject-50; verified (live render) · s10-23, s10-24.
- **S4** `overflow-x: clip`, `hidden` breaks sticky, `clip-path` still scrolls: verified · localtests-27, localtests-29. The scroll-container explanation is general CSS behaviour.
- **S5** Avoid `100vw`: community · community-30. The scroll-bar explanation is general CSS behaviour, not an itch test.
- **S6** Grid sizer, columns and gap together, `.mode_grid` guard, phone columns: verified · gapfill07-01, gapfill07-02, gapfill07-03.
- **S7** Equal heights, covers, lazy loading: verified · repo-32, repo-33, repo-34, crawlprofile-11, crawlprofile-15.
- **S8** Heading size and fixed heights: verified (script-free harness) · a11y-31, a11y-45.
- **S9** Absolute footer, 50 px bottom padding: verified · crawlprofile-09, repo-24; observed · s02-n7.
- **S10** Project bottom bar at 650 px or less, top-right tools: verified · s10-15, crawlprofile-19, itchcss-32, crawlprofile-60.
- **S11** Full-page layer (block B4): verified · localtests-39, repo-46, itchcss-29, s04-gf-11; verified (live render) · s10-19.
- **S12** Fixed layers scrolling: verified · localtests-37. iOS and `background-attachment: fixed`: documented · s10-12.
