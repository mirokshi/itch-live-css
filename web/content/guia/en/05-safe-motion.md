# Chapter 5 — Motion that's safe to ship

Animation is the fastest way to make a page feel alive, and the fastest way to make it unusable: motion that never stops, a heading that a screen reader spells letter by letter, an animation name that silently replaces one of itch's. This chapter gives you the rules, one block you always include, and patterns that respect them.

## 5.1 The short version

1. Name every `@keyframes` with a `custom-` prefix (R16).
2. Motion that starts by itself stops within 5 seconds and ends at rest (R17).
3. Always include the reduced-motion block in 5.4 (R17).
4. Hover effects go behind `@media (hover: hover)` and get a focus equivalent (R18).
5. Never put `!important` on an animated property (R14).

## 5.2 Name your keyframes `custom-…`

itch defines 13 animation names of its own, among them `bounce` and `spin`. Keyframe names are global: if you write `@keyframes spin`, yours replaces itch's on the whole page, and whatever itch was spinning now does your animation. The prefix makes a clash impossible. [S1]

```css
@keyframes custom-pop { 50% { scale: 1.08; } }
```

## 5.3 Five seconds, then rest

The accessibility standard (WCAG 2.2.2) says that motion which starts by itself, lasts more than 5 seconds and sits alongside other content needs a way to pause, stop or hide it. CSS has no pause button, and honouring "reduce motion" doesn't count as one. So: [S2]

- **Give every automatic animation a finite iteration count** and a total length under 5 seconds.
- **End at rest.** The final frame should be the element's normal state.
- **Loop only on hover or focus**, or after the visitor has clearly chosen to start it.

```css
@keyframes custom-bob { to { translate: 0 -4px; } }
#wrapper .custom-title { animation: custom-bob 1.2s ease-in-out 4 alternate; }
```

Four runs of 1.2 s, alternating, is 4.8 s. An even count with `alternate` ends back where it started. [S2]

### Entrances: animate *from* hidden, not *to* visible

The wrong way: give the element `opacity: 0` and animate it to `1` with `forwards`. If the animation never runs (reduced motion, an old browser, a blocked stylesheet), the content stays invisible.

The right way: leave the element visible and animate **from** the hidden state:

```css
@keyframes custom-in { from { opacity: 0; translate: 0 18px; } }
#wrapper .custom-card { animation: custom-in .6s ease-out; }
```

When the animation is skipped, the element is simply there. [S3]

## 5.4 The reduced-motion block (always include it)

Visitors who turn on "reduce motion" in their system settings should get a still page. This block stops every animation and transition inside `#wrapper`:

```css
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

It is 181 characters. Copy it exactly:

- `#wrapper *` alone misses `#wrapper` itself and its `::before` and `::after`, which is where full-page decorations live (chapter 3). Shorter versions left 3 or 4 of 6 test animations running.
- `transition: none` works better than the common `transition-duration: .01ms` trick, which can leave elements stuck at their starting value when the animation timeline is frozen.
- If a hover effect moves something, reset it inside the same media query too, for example `#wrapper .game_cell:hover { transform: none; translate: none; }`.

[S4]

itch has no reduced-motion rules of its own, so without this block nothing on your page respects the setting. [S4]

## 5.5 Hover, touch and keyboard

Phones have no hover, and keyboard users never hover at all. So:

```css
@media (hover: hover) {
  #wrapper .game_cell { transition: translate .2s ease-out; }
  #wrapper .game_cell:hover { translate: 0 -4px; }
}
#wrapper .game_cell:focus-within { translate: 0 -4px; }
```

- `@media (hover: hover)` keeps the hover effect away from touch screens, where it gets stuck after a tap.
- `:focus-within` gives keyboard users the same effect. On profile game cards it's needed: the cover link is skipped by Tab, so the card's other links carry the focus.

Nothing on the page may work only on hover. [S5]

## 5.6 Patterns that follow the rules

### A word wave

Animate whole words, not letters. Splitting a heading into one `inline-block` span per letter changes its accessible name, the text assistive technology announces, to separate letters ("M i r o"). If you must animate letters, keep a hidden copy of the word for screen readers and draw the letters as decorative generated content. [S6]

```css
@keyframes custom-wave { 50% { translate: 0 -6px; } }
#wrapper .custom-wave span { display: inline-block; animation: custom-wave 1.6s ease-in-out calc(var(--i) * .1s) 2; }
#wrapper .custom-wave span:nth-child(2) { --i: 1; }
#wrapper .custom-wave span:nth-child(3) { --i: 2; }
```

The keyframes have no `from` or `to`, so every run starts and ends at the normal position. `translate` needs `display: inline-block` on inline elements. [S7]

### A staggered entrance

```css
#wrapper .game_cell { animation: custom-in .5s ease-out; animation-delay: .2s; animation-delay: calc(sibling-index() * 60ms); }
```

Browsers that don't know `sibling-index()` ignore the second `animation-delay` and keep the first. This is the safe way to use any new CSS: plain value first, new value second, in the same rule. Don't route the fallback through a custom property, because then an unsupported value breaks both. [S8]

### On first render with `@starting-style`

`@starting-style` sets the values an element transitions *from* when it first appears, with no keyframes. It works on itch's first render. [S9]

### Scroll-driven reveals

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    #wrapper .custom-reveal { animation: custom-in linear both; animation-timeline: view(); }
  }
}
```

Put `animation-timeline` **after** the `animation` shorthand, because the shorthand resets it. The `@supports` and reduced-motion wrappers mean browsers without support, and visitors who asked for less motion, simply see the content. Chrome and, since October 2026, Firefox support scroll-driven animations: about 88 % of users. [S10]

### Smooth page changes between your profile and your projects

```css
@view-transition { navigation: auto; }
```

Put it at the top level (not inside a `#wrapper` rule) in **both** sheets, your profile's and the project's. Moving between them then cross-fades instead of flashing. [S11]

The reduced-motion block in 5.4 doesn't reach view transitions, which animate outside `#wrapper`. Wrap the rule in `@media (prefers-reduced-motion: no-preference) { … }` to respect the setting. [S11]

### A new tilt on every visit

```css
#wrapper .game_cell { rotate: 0deg; }
@supports (rotate: random(0deg, 1deg)) {
  #wrapper .game_cell { rotate: random(-2deg, 2deg); }
}
```

`random()` picks a new value on each page load in Chrome and Edge 156+ and Safari 26.2+, about 56 % of users. Firefox doesn't support it yet, and those visitors get the straight version. `@supports (--x: …)` can't detect support, so test a real property, as here. [S12]

## 5.7 Pitfalls

- **An animation stops or the wrong one runs.** A second `animation` declaration replaced the whole list, `!important` froze it, or a keyframe name clashed with one of itch's. [S13]
- **Slow pages.** Animate `transform`, `translate`, `scale`, `rotate` and `opacity`, which are cheap. Never loop `font-weight`: in a throttled test it took about 0.9 s of layout work per second and dropped the page to around 20 frames per second. [S14]
- **Flashing.** Stay under three flashes per second. Flashing content can get a page delisted. [S15]
- **HTML5 game pages.** Keep `transform`, `filter`, `backdrop-filter`, `will-change` and entrance animations off the game's containers (R22; chapter 2). [S16]

## Checklist

- [ ] Every `@keyframes` name starts with `custom-`.
- [ ] Automatic motion is finite, under 5 seconds, and ends at rest.
- [ ] Entrances animate *from* hidden; nothing starts at `opacity: 0` with `forwards`.
- [ ] The reduced-motion block is included, copied exactly.
- [ ] Hover effects sit in `@media (hover: hover)`, with `:focus-visible` or `:focus-within` equivalents.
- [ ] Headings animate by word, not by letter.
- [ ] New features have a plain fallback first, or an `@supports` test on a real property.
- [ ] No `!important` on animated properties; no looping `font-weight`; under 3 flashes per second.

---

## Sources

From the itch-live-css knowledge base, `knowledge/itch-custom-css.md` §0 (R14, R16–R18, R22), §0.1 (block B1), §2, §7, §9 and §10.

- **S1** itch's 13 global keyframe names, clash replaces itch's: verified · s06-static, s06-kf.
- **S2** 5-second rule and WCAG 2.2.2, finite motion at rest, the `custom-bob` example: documented · a11y-25; verified · gapfill02-01, gapfill02-02, s10-02, a11y-24.
- **S3** Entrances from hidden, no base `opacity: 0` + `forwards`: verified · a11y-24.
- **S4** Block B1, its selector list and `transition: none`, hover reset; itch has no reduced-motion rules: verified · gapfill02-01, gapfill02-02, s10-02, repo-50, itchcss-26.
- **S5** Hover gating and focus equivalents, card cover link skipped by Tab, nothing hover-only: verified · s10-03, a11y-18; inferred · s10-03.
- **S6** Letter spans rename a heading: verified · repo-59, s10-14, s10-27.
- **S7** Finite wave without `from`/`to`; `translate` needs `inline-block`: verified · gapfill07-04, s07-n2 T29.
- **S8** Stagger with `sibling-index()` fallback; plain value first; no fallback through custom properties: verified · s07-n1 T3, T4, T13.
- **S9** `@starting-style` on first render: verified · support-54.
- **S10** Scroll-driven animation order and wrappers: verified · s07-n1 T15. Firefox 159 and the 88 % figure: documented · support-63.
- **S11** `@view-transition` on both pages: verified · support-21. The reduced-motion wrapper is general CSS, not tested on itch.
- **S12** Native `random()` and its support: verified · s07-n1 T5, T6, T22, support-03; verified 2026-10-29 · support-62; documented · support-63. `@supports (--x: …)` detects nothing: verified · s07-n1 T5–T7.
- **S13** Animation stops or wrong one runs: verified · repo-45, localtests-24, itchcss-28.
- **S14** Looping `font-weight` cost: verified · gapfill07-06.
- **S15** Flashing and delisting: documented · s02-n3; inferred · docs-16.
- **S16** HTML5 game containers: verified · s04-gf-08, s04-gf-09, s04-gf-11.
