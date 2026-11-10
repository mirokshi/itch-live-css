# Chapter 7 — Debugging: when it doesn't show, and why

Most CSS problems on itch look the same from the outside: the change you made does nothing, or it works for you and not for visitors. The cause is almost always one of five things: a rule that the browser silently dropped, a rule that loses to itch's own, a cache that is still serving the old page, a preview that only you can see, or a tool that is reading the page the wrong way. This chapter goes through them in that order.

## 7.1 Start here: check what visitors actually get

Before you change any CSS, confirm what is being served. Your own view is not what visitors see:

- **You** see unsaved CSS in the editor preview, and your own page is never cached. [S1]
- **Visitors** get a cached copy. After a profile save, logged-out visitors can keep the old page for about two and a half minutes, then get the new one. [S1]

So: test in a private window, logged out, after a few minutes. To see the cache state, open the browser's network panel (F12), reload, and look at the response headers for `X-Cache-Status`. `HIT` means a cached copy; `EXPIRED` followed by a fresh page means the change has arrived. You can also check the text itch is serving: on a profile, look for your `style#custom_css` element logged out. [S1]

Changing the address (adding `?something`) does not skip the cache. [S1]

## 7.2 Your rule is silently ignored

This is the most common problem, and itch never tells you about it. Browsers skip any rule they can't parse, and the rest of the stylesheet carries on. Things that cause it: [S2]

| Mistake | What to do |
|---|---|
| `calc(40px+10px)`: no spaces around `+` or `-` | Write `calc(40px + 10px)` |
| `//` comments | Use `/* … */` |
| A stray or missing `}` | Count braces. A missing one can make everything after it disappear |
| An unknown selector in a list, such as `a, badselector` | The whole rule is dropped. Split the list, or remove the unknown part |
| `and(` inside `@media` | Use `and` with a space: `@media (min-width: 600px) and (hover: hover)` |
| A bad `var()` | The property becomes `unset`. Check the variable name and that it is set |

A strong cause for "nothing happens and there's no error": **the rule doesn't parse**. In your browser's DevTools, a rule with an invalid selector is missing from the Styles panel, and an invalid property is shown crossed out (general browser behaviour, not tested on itch). A rule that parses but doesn't match is a different problem (7.3).

The knowledge base's validator flags many of these before you paste (`node engine/bin/cli.js validate yourfile.css profile`), but it cannot catch everything. [S2]

## 7.3 Your rule parses but loses to itch's

itch's own rules come first in the page. Yours come last, so ties go to you. But these cases lose anyway: [S3]

| Opponent | What beats it |
|---|---|
| itch's normal rules | Any rule starting with `#wrapper` (R2) |
| itch's `!important` | `#wrapper … !important`, or style the parent instead |
| An inline `style=""` attribute (such as on cover images and the game frame) | `!important` only. Inline styles beat even `#wrapper#wrapper` |
| itch's JavaScript, which writes inline sizes and a grid sizer **after** your CSS | `#wrapper` plus a class. On profiles the sizer's specificity is (0,2,0), so a `#wrapper .mode_grid .user_game_grid` rule beats it; on jams the sizer is an ID (1,0,0), so `#wrapper` plus a class is needed |
| A rule inside `@layer` | Layers always lose to normal rules. Don't use them (R15) |

Two more traps:

- **Nesting needs modern browsers.** `#wrapper { .x { } }` works in current browsers but is dropped by older ones. Write essential rules flat. [S4]
- **Imported rules lose to pasted ones.** If you split your CSS with `@import` (chapter 6), the pasted rules win ties. Add weight to the imported rules, for example `#wrapper h1.custom-title`. [S4]

To see which rule wins: open DevTools, select the element, and look at the **Styles** panel. Rules that lost are crossed out, with the rule that won listed above them. This is the fastest way to find a cascade problem.

## 7.4 Custom properties follow the page, not the specificity

A custom property takes the value from the nearest element that declares it, not the most specific rule. If you declare `--accent` on a child and use it on the parent, the parent doesn't see it. Declare tokens on `#wrapper` (chapter 4) and read them below it. [S5]

## 7.5 Animations and names

- **`@keyframes` names are global.** A name that matches one of itch's (`spin`, `bounce`) replaces it on the whole page. Use the `custom-` prefix (R16; chapter 5). [S6]
- **`animation` is a list.** A second `animation` declaration in the same rule replaces the first, so one of your animations stops. Put them in one declaration, or animate a different property. [S6]
- **Animations freeze** if they carry `!important` (R14). An unregistered custom property doesn't freeze, but it animates in steps rather than smoothly. [S6]
- **Relative `url()` paths** resolve against different bases: the visitor's page when pasted, your sheet when imported. Use absolute `https://` addresses everywhere (R23). [S6]

## 7.6 Things that break only in some layouts

- **A fixed decoration never shows.** The element sits behind `#wrapper`'s background because `#wrapper` isn't in its own stacking context. Add `position: relative; isolation: isolate;` to `#wrapper` and put the decoration on `#wrapper::before` (chapter 3). [S7]
- **A decoration covers the Follow button.** Give the decoration `pointer-events: none`, and keep the top-right corner clear. [S7]
- **Fixed layers scroll with the page.** A `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change: transform` or `contain` on `#wrapper`, `.user_page` or `#inner_column` turns it into their containing block. Move the effect to a pseudo-element. HTML5 games: R22. [S7]
- **Sideways scroll on phones.** Usually an oversized element or a rotated one. `overflow-x: hidden` removes the scroll bar but breaks `position: sticky`; use `overflow-x: clip` (chapter 3). [S8]
- **Cards of uneven height.** itch aligns grid items to the top. Stretch them (chapter 3, 3.4). [S8]
- **The footer's margin doesn't work.** The profile footer is absolutely positioned. Use a bottom margin on the last block, or padding on `#wrapper` (chapter 3, 3.6). [S8]

## 7.7 A saved change doesn't appear

Work through this list in order:

1. **Are you looking logged out?** Your own view can be different (7.1). [S1]
2. **Did the save succeed?** Over the profile limit, itch refuses the whole save and shows an error box. Measure the size (chapter 1). [S9]
3. **Is the cache still serving the old copy?** Wait a few minutes, then check in a private window. [S1]
4. **Does the CSS parse?** Check in DevTools (7.2). [S2]
5. **Is something else winning?** Check in DevTools (7.3). [S3]

## 7.8 Shrinking CSS can break it

A minifier that removes whitespace can also remove what the browser needs. Choose the tool deliberately:

- **Use esbuild with `--minify` and `--charset=utf8`.** In the knowledge base's tests it kept the nested rules and range media queries that the others removed, and non-ASCII text intact. The exact command-line flags are inferred from the API options tested. [S10]
- **Avoid csso,** which removes nesting and range media queries, and **lightningcss without targets,** which drops fallbacks. [S10]
- **Don't minify strings by regular expression.** Quick search-and-replace tools can rewrite the text inside `content: "…"`. [S10]
- **Check after minifying.** Run the size measurement (chapter 1) and open the page logged out. A minifier error can be silent.

## 7.9 Reading the page with tools

Automated tools and screen readers read the page differently from a browser:

- **`read_page`-style tools include hidden text and ignore `::before` and `::after`.** Don't use them to check what a visitor sees. Use the browser's accessibility tree (DevTools, or the Chrome DevTools Protocol's accessibility call) instead. [S11]
- **Live pages are a poor guide.** Most top-level selectors on styled pages don't start with `#wrapper`, so a styled page proves little about what your rules will do. Copy the rules from this guide, and test your own page. [S12]
- **A script-free copy of a page is not the real thing.** It doesn't run itch's JavaScript, so grid sizing, the wrapper's minimum height and the lazy covers behave differently. Judge layout on a live render. [S13]

## Checklist when something breaks

- [ ] Checked logged out, in a private window, after the cache had expired (7.1).
- [ ] Looked at the rule in DevTools: is it crossed out, or missing entirely? (7.2, 7.3)
- [ ] Checked the size and the `</style>` rule (chapter 1). Saved text matches what you pasted.
- [ ] Checked the minified version against the source (7.8).
- [ ] Checked the accessibility tree, not text tools, for what a screen reader would hear (7.9).

---

## Sources

From the itch-live-css knowledge base, `knowledge/itch-custom-css.md` §1, §6, §9 and §10.

- **S1** Owner view versus logged-out view, cache headers, `X-Cache-Status`, query strings do not bypass: verified 2026-10-16 · live-dom; documented · community-05; verified · crawlprofile-46.
- **S2** Silent parse failures (`calc`, `//`, braces, unknown selector, `and(`), `var()` to `unset`: verified · localtests-41, localtests-42, localtests-32, support-06, support-08, s01-n6.
- **S3** Cascade losers: inline `style` beats `#wrapper#wrapper`, runtime sizer, `!important`: verified · crawlprofile-12, localtests-04, crawljam-07, docs-17, localtests-24; jam sizer `#<generated id>` (1,0,0): inferred · community-47, verified locally · s06-run.
- **S4** Nesting support and drop in older browsers: verified · support-15; observed · crawlprofile-57. Imported rules lose to pasted ones: verified · localtests-01, repo-13.
- **S5** Custom properties follow the nearest declaring ancestor: verified · localtests-06, s06-heads.
- **S6** Global keyframe names, `animation` list replacement, `!important` freezing animations, unregistered `@property` animating discretely, relative `url()` bases: verified · s06-static, s06-kf, repo-45, s06-run, localtests-24.
- **S7** Stacking context for fixed decorations, Follow button, fixed layers and containing blocks: verified · localtests-39, repo-46, itchcss-29, localtests-37, crawlprofile-60.
- **S8** Sideways scroll and `overflow-x: clip`, grid alignment, absolute footer: verified · localtests-27, localtests-29, repo-32, repo-33, crawlprofile-09, repo-24.
- **S9** Save refused over the cap, with an error box: verified 2026-10-16 · live-cap-A1.
- **S10** Minifier choice and the failures listed: verified · gapfill09-05, gapfill09-15, gapfill09-11, gapfill09-12, gapfill09-06; the CLI flag names are inferred from the API options tested.
- **S11** Tools read hidden text and ignore pseudo-elements: verified · localtests-34, a11y-50.
- **S12** Most top-level selectors on live pages lack `#wrapper`: verified · corpus-16.
- **S13** Script-free harness differences: verified (live render) · s10-17 to s10-24.
