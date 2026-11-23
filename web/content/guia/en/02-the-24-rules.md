# Chapter 2 — The 24 rules, in plain words

These are the rules that decide whether your CSS works, whether it stays on your page, and whether a visitor can still use the page. The numbers match the knowledge base (R1–R24), so you can look up any rule's evidence there.

Most of them are not technical limits. itch serves whatever CSS you paste. The rules exist because itch can remove access, and because a visitor can be harmed by a page that breaks or hides things. [policy]

## Access and scope

### R1 — Check that you have the field first
Staff grant custom CSS by hand. Without the field, nothing you paste does anything. The fallback is the theme editor plus HTML in your bio or description. (Chapter 1 shows how to check.) [R1]

### R2 — Start every rule with `#wrapper`
itch doesn't scope your CSS. Whatever you write is applied to the whole page, so a bare `body`, `html`, `a`, `img` or `*` restyles the site around your content, including the header and footer. Start every selector with `#wrapper`, even inside `@media` and `@supports`.

```css
@media (min-width: 700px) {
  #wrapper .user_page { max-width: 720px; }
}
```

Never write `body > #wrapper`: the knowledge base lists it as a forbidden selector. [R2]

### R3 — Set your variables on `#wrapper`, not `:root`
Custom properties on `:root` or `html` leak into itch's own UI. On a jam it recoloured the site header. Put your variables on `#wrapper` (or on `#wrapper .user_page` for a profile), and they stay inside the page. [R3]

### R4 — Never use the `background` shorthand on `#wrapper`
The theme already paints your background image on that element, using separate properties. The shorthand resets all of them, so your image disappears. Use the longhands (`background-color`, `background-image`, `background-size` and so on). [R4]

### R13 — On a project, your sheet also styles the devlog and comments
A project's CSS reaches `/devlog`, every devlog post and `/comments`. Target the page you mean with the page classes: the main page, the index, a post and the comments page are all different. Test all four before you publish. [R13]

## Not breaking or faking itch's UI

### R5 — Never hide, move, cover or fake itch's own controls
That includes footer links, the site header, the "User tools" bar, dialogs, buy and download buttons, prices, the "More information" box and the external-link badge. Restyling them is fine; hiding or moving them can cost you CSS access. [R5]

### R6 — Never mislead visitors or track them
No fake buttons, fake modals, fake badges, layers that catch clicks, or impersonation of a site or a person. Your CSS can't call home either: no `url()` requests that act as beacons, no form-field selectors, no cookies, no visitor logging. [R6]

### R12 — Don't target numbered IDs
Ids like `#user_123` or `#view_game_456` change with every render. Use stable hooks: `#wrapper`, `#profile_header`, `#inner_column`, `#header`, `#view_game_footer` and `#entries`. [R12]

### R20 — Keep exactly one `h1`
Each page should have one `h1` that names it. Some layouts hide itch's own heading (a profile with a banner, a project with a banner or an HTML5 embed). Then add an `<h1>` with a `custom-` class to your bio or description. On jams keep itch's `.jam_title_header`, and never style `#wrapper h1`. [R20]

## Size and pasting

### R7 — Measure your size and say what it is
Profile CSS may be at most **5,120 bytes** after leading and trailing whitespace is trimmed; comments count. Over that, the save is refused, not cut. Projects and devlogs have no practical limit. Jams are about 20 KB. Measure every build; chapter 1 has the commands. [R7]

### R8 — Paste minified CSS only
No `<style>` tags. Never the text `</style>`, in any letter case, even inside a comment, because itch deletes it from the stored sheet. Write `>` as is, not as `&gt;`. [R8]

### R9 — Put every `@import` first
Only comments, `@charset` or an `@layer` line may come before an `@import`. Anywhere else it is dropped without warning. On jams `@import` never loads; use `@font-face` or the font picker instead. [R9]

### R10 — Import only safe, pinned, `https://` files
Use `https://`, a stylesheet (`text/css`), a successful response and a fixed version URL. Don't import from `raw.githubusercontent.com` or GitHub gists, which change under you. Keep your CSS usable if the import fails or is blocked: the page should still look acceptable without it. [R10]

### R23 — Use absolute `https://` URLs everywhere
In every `url()` and every `@import`, write the full address. Relative paths resolve against the page the visitor is on, not against your file. [R23]

## Naming

### R11 — Give HTML classes the `custom-` prefix
In bios and descriptions, itch keeps a class only if it starts with a lowercase `custom`. Anything after the prefix survives, but `id`, `data-*`, `aria-*`, `role`, event handlers and `tabindex` (except on a `spoiler`) are removed. Also avoid names starting with `custom-ad`, `custom-social`, `custom-share` and `custom-cookie`: ad blockers hide them. [R11]

### R16 — Prefix every `@keyframes` name with `custom-`
itch already defines about a dozen animation names, such as `bounce` and `spin`. A rule with the same name replaces itch's animation on every page. `custom-bob` is safe; `bob` is not. [R16]

## Motion and interaction

### R14 — Use `!important` only to beat itch's own `!important`
Use it against itch's `!important`, inline `style=""`, or another `!important` that is also yours. Never on an animated property (it freezes the animation), and never `outline: none !important`. [R14]

### R15 — Don't use `@layer` for your overrides
itch has no layers. Any rule inside a layer loses to every normal rule of itch's, however specific yours is. Write normal rules instead. [R15]

### R17 — Animation starts, runs briefly and stops
Any motion that starts on its own must finish within 5 seconds and end at rest. A looping animation alongside content breaks WCAG 2.2.2, and reduced-motion settings don't fix that. Keep the resting state readable: never start from `opacity: 0` with `forwards`. Loop only on hover or focus, or after the visitor's explicit choice. [R17]

```css
@keyframes custom-bob { to { translate: 0 -4px; } }
#wrapper .custom-title { animation: custom-bob 1.2s ease-in-out 4 alternate; }
```

That is the pattern: named with the prefix, finite, and ending at rest.

### R18 — Put hover effects behind `@media (hover: hover)`
Touch screens have no hover. Wrap hover effects in `@media (hover: hover)`, and give each one a focus equivalent so keyboard users get the same effect. [R18]

### R21 — Hide silent things with `display: none`
`opacity: 0`, `color: transparent` and screen-reader-only text remain in the accessibility tree, so a screen reader still announces them. `display: none` removes them. Decorative generated content (`content: "★"`) should also be announced as nothing: give it an empty alternative with `content: "★" / ""`. [R21]

### R22 — On HTML5 project pages, keep effects off the game's ancestors
`filter`, `backdrop-filter`, `transform`, `will-change` and entrance animations on `#wrapper`, `#inner_column`, `.view_game_page` or `.embed_wrapper` can interfere with the embedded game. Put them on elements inside the page, and release `isolation` while the game is maximised. [R22]

## Accessibility

### R19 — Keep a focus ring that is easy to see
itch's default focus ring is a dark purple that measures only 1.1–1.5:1 against the dark backgrounds tested. WCAG asks for at least 3:1 for focus indicators. Set a ring that meets it, and keep a visible outline on every focusable element. [R19]

### R24 — Check logged out, at phone widths
Test at 320 px and 375 px, plus the breakpoints of your page type, logged out, with itch's scripts running. Screen-reader checks by reading the page as text miss what a visitor hears, so test with a screen reader too. [R24]

## Checklist

- [ ] I have the Custom CSS field (R1).
- [ ] Every selector starts with `#wrapper` (R2), and variables are on `#wrapper` or below (R3).
- [ ] No `background` shorthand on `#wrapper` (R4).
- [ ] I don't hide, move or fake itch's UI, and I don't track anyone (R5, R6).
- [ ] No numbered ids (R12). One `h1` (R20).
- [ ] Size measured in bytes, minified, no `</style>` (R7, R8).
- [ ] `@import` lines come first, pinned and `https://` (R9, R10, R23).
- [ ] Classes and keyframes start with `custom-` (R11, R16).
- [ ] Motion is finite and at rest (R17); hover effects are gated (R18).
- [ ] Focus ring meets 3:1 (R19); checked logged out at 320 and 375 px (R24).

---

## Sources

Each rule comes from the knowledge base's §0 ("Rules an AI must never break") and §2. Fact ids are listed so you can check the evidence and its tag. The tags stay as they are in the knowledge base: a rule can't be stronger here than there.

- **Policy framing** (most rules are policy, enforced by staff): documented · docs-10, docs-12, docs-13, community-23; no public revocation found.
- **R1** documented · docs-01, community-48.
- **R2** documented · docs-09; verified · corpus-01, corpus-16, S03-N7. The `body.frame_maximized` exception is in §4 (s04-gf-10).
- **R3** verified · crawljam-42, itchcss-12, crawljam-05.
- **R4** verified · repo-18, itchcss-57, crawlprofile-35, crawlproject-23.
- **R5** documented · docs-10, docs-11, docs-12, community-23; community · community-24; verified · itchcss-46.
- **R6** documented · docs-10, docs-12, docs-13, external-33; verified · external-32, external-47.
- **R7** verified 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a to live-cap-A3c, live-cap-B1, live-cap-B2; jam: documented · crawljam-29; inferred · gapfill01-03.
- **R8** verified 2026-10-16 · live-c42 to live-c44; documented · repo-05; observed · crawlprofile-25; verified · corpus-02.
- **R9** verified · repo-10, external-03, s06-run, crawljam-02.
- **R10** verified · external-04, external-05, external-06, localtests-12; observed · repo-14. Pinned imports are shown in chapter 6, recipe 7; the per-visit service exception is outside this guide.
- **R11** verified 2026-10-16 · live-k03 to live-k15, live-a01 to live-a06, live-a11, live-k34; documented · docs-34; observed · sanitizer-05, gapfill05-06; verified · external-30, x08-07.
- **R12** verified · crawlproject-01, crawlproject-06.
- **R13** verified · s01-n2, crawlproject-37, S03-N3.
- **R14** verified · docs-17, crawljam-07, localtests-04, localtests-24, gapfill01-13.
- **R15** verified · support-37, external-12, s06-static.
- **R16** verified · s06-static, s06-kf.
- **R17** verified · gapfill02-01, gapfill02-02, s10-02, a11y-24; documented · a11y-25.
- **R18** verified · s10-03, a11y-18.
- **R19** verified · s04-5, s04-gf-02, s04-gf-16.
- **R20** verified · itchcss-54, crawlproject-10; verified (live render) · s10-25; observed · crawljam-46.
- **R21** verified · a11y-03, a11y-10.
- **R22** verified · s04-gf-08, s04-gf-09, s04-gf-11.
- **R23** verified · s02-n6, localtests-19.
- **R24** documented · docs-15; verified · a11y-31, localtests-34; verified (live render) · s10-17.
- **[policy]** documented · docs-10, docs-12, docs-13 (see the policy framing above).
