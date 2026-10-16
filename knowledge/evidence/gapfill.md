# Gap-fill evidence log

Append-only. Each block is one gap-fill pass.

## Gap fill for 02-rules-and-policy.md (2026-10-14, 14:05–14:15 UTC)

Two gaps: (1) contradictory reduced-motion guards across sections; (2) P9 didn't name form-field selectors that load URLs, or escaping in CSS services. **0 requests to itch.io** in this pass: all tests are local, and Chrome ran offline.

### Setup

- **Browser.** Headless Chrome **155.0.8059.79**, isolated profile, offline:
  `chrome --headless=new --remote-debugging-port=9482 --user-data-dir=<scratch>/gapfill-02r/chrome-profile --host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE 127.0.0.1" about:blank`
- **Driver.** Node 22.13 with `knowledge/evidence/a11y-tests/cdp.mjs` (`CDP_PORT=9482 CDP_BLOCK_ITCH=1`).
- **Tools** (own code, in `knowledge/evidence/gapfill-02-tools/`):
  - `motion-guard.html`: the 6 infinite animations of `s10-tools/s10-motion.html` (on `#wrapper`, its `::before`/`::after`, a child and the child's `::before`/`::after`), plus `#hcard` (`transition:transform .4s ease .2s`, `:hover` → `translateY(-8px)`) and `#ccard` (`transition:transform .4s ease`, `.on` → `translateY(-8px)`).
  - `motion-guard.mjs`: extends `s10.mjs` (MOTION). For each guard it injects the CSS into `style#guard`, emulates `prefers-reduced-motion`, optionally freezes the timeline (`Animation.setPlaybackRate {playbackRate:0}`), hovers `#hcard` (`Input.dispatchMouseEvent mouseMoved`), adds `.on` to `#ccard`, then samples at 0/100/300/1200 ms: running `CSSAnimation`s, `CSSTransition`s, computed `transform`, and `transitionrun`/`transitionend` counts.
  - `escape-check.mjs`: parses `#wrapper::before{content:<value>}` with `new CSSStyleSheet().replaceSync()` and counts the rules, for raw vs escaped interpolation.
- **Re-run.**
  - `CDP_PORT=9482 CDP_BLOCK_ITCH=1 node motion-guard.mjs file:///<abs>/knowledge/evidence/gapfill-02-tools/motion-guard.html`
  - `CDP_PORT=9482 CDP_BLOCK_ITCH=1 node escape-check.mjs`

### gapfill02-01: guard selector coverage (emulated `reduce`)

| Guard | Running infinite animations (of 6) | Which |
|---|---|---|
| none | 6 | all |
| `#wrapper *, #wrapper *::before, #wrapper *::after` (`animation:none!important;transition:none!important`) | **3** | `#wrapper`, `#wrapper::before`, `#wrapper::after` |
| six selectors (`#wrapper, #wrapper::before, #wrapper::after,` + the three above) with `transition:none!important` | **0** | – |
| six selectors with `transition-duration:.01ms!important;transition-delay:0s!important` | **0** | – |

This matches s10-02 (none 6, 3-selector 3, 6-selector 0).

### gapfill02-02: transition form (six-selector guard, emulated `reduce`)

Computed `transform` of `#hcard` (h) and `#ccard` (c). `-8` means `matrix(1, 0, 0, 1, 0, -8)` (end state); `0` means the start value.

| Guard form | Timeline | t=0 | t=100 ms | t=300 ms | t=1200 ms | CSSTransitions at t=0 | run/end events |
|---|---|---|---|---|---|---|---|
| `transition:none!important` | normal | h −8, c −8 | −8, −8 | −8, −8 | −8, −8 | none | 0/0 |
| `transition:none!important` | frozen | h −8, c −8 | −8, −8 | −8, −8 | −8, −8 | none | 0/0 |
| `.01ms` + `delay:0s` | normal | h 0, c 0 | −8, −8 | −8, −8 | −8, −8 | 2 running | 2/2 |
| `.01ms` + `delay:0s` | frozen | h 0, c 0 | 0, 0 | 0, 0 | **0, 0** | 2 running (never finish) | 2/0 |
| `.01ms`, no delay reset | normal | h 0, c 0 | h **0** (authored .2s delay), c −8 | −8, −8 | −8, −8 | 2 running | 2/2 |
| `.01ms`, no delay reset | frozen | 0, 0 | 0, 0 | 0, 0 | **0, 0** | 2 running | 2/0 |

- **Baseline** (no guard, `no-preference` and `reduce`): `#ccard` transitioned normally (0 → −2.97 → −7.64 → −8, 1 `transitionend`). With a frozen timeline it stayed at 0.
- **Confound.** In the baseline and three-selector runs, `#hcard` never matched `:hover`, because `#wrapper` itself was still rotating under the pointer. The hover results therefore come only from the six-selector runs, where `#wrapper` is still.
- **Decision.** `transition:none!important`:
  - deterministic end state, including frozen timelines (the Browser pane's hidden state, localtests-36);
  - 181 vs 221 characters for the whole minified block;
  - the only cost (no transition events) is irrelevant; see gapfill02-03.
- **Hover transforms** jump to the end state instantly under either form.

### gapfill02-03: do itch's scripts listen for transition/animation events?

- **Method.** Case-insensitive `grep -oi transitionend|animationend | wc -l` over copies of itch's static bundles that earlier agents downloaded to the scratchpad on 2026-10-14. No new requests were made. Paths: `itchcss-v2/raw/{bundle,lib,react}.min.js`, `community-verify2/static/{game,theme_editor}.min.js`, `jam.min.js`.
- **Result.**

| File | Bytes | md5 (first 10) | transitionend | animationend |
|---|---|---|---|---|
| bundle.min.js | 126,589 | 6bf0fd1536 | 0 | 0 |
| lib.min.js | 127,414 | 207451926a | 0 | 0 |
| game.min.js | 226,606 | 5273acb37a | 0 | 0 |
| jam.min.js | 127,981 | ff6826353e | 0 | 0 |
| theme_editor.min.js | 85,760 | dcb4185fbc | 0 | 0 |
| react.min.js | 161,485 | a16e973653 | 8 | 5 |

- **Reading.** The react.min.js hits are React's generic event-name tables, not itch logic. Because the grep is case-insensitive, a component prop `onTransitionEnd` would also have matched in itch's own bundles, and none did. Custom pages can't run JS.

### gapfill02-04: escaping request-derived values in a CSS service

- **Escaper.** Re-implemented from the private repo's `custom-css/lib/util.js` `cssString` (read this session):
  - `"` and `\` are backslash-escaped;
  - code points below 32 or above 126 become `\<hex> `;
  - the result is wrapped in `"…"`.
- **Rules parsed in Chrome 155** for `#wrapper::before{content:<value>}`:

| Input (JSON) | Raw interpolation `"<v>"` | Escaped |
|---|---|---|
| `"es-ES,es;q=0.9"` | 1 rule | 1 rule |
| `"x\"}#wrapper{display:none}#a{b:\""` | **3 rules** (string closed, rules injected) | 1 rule (text kept inside the string) |
| `"x\n}#wrapper{display:none}"` | **2 rules** (newline ends the string; the declaration is dropped, the rule injected) | 1 rule (`\a `) |
| `"a\\\"}#wrapper{display:none}/*"` | 1 rule (by luck: `\"` escaped the quote) | 1 rule |

- **Caveat.** The script's `hidesWrapper` column is unreliable: its regex also matches the text inside the string. Use the rule counts only.
- **Observed.** The private repo's service reads no request headers or query values: there are 0 matches for `req.headers`, `req.query`, `searchParams` or `accept-language` in `custom-css/api/*.js` and `custom-css/lib/*.js`. A grep, not a live test.

### Section 02 edits

- **§2.7.** Snippet replaced:
  - six-selector guard with `transition:none!important`;
  - `bob` renamed to `custom-bob` with its `@keyframes` defined;
  - `1.2s × 4 alternate` (4.8 s, ends at rest).
- **§2.7, new bullets.** Selector coverage, transition-form table, keyframe prefix, hover jump, resting state.
- **§2.8 (P9).** New "Never" bullet on form-field selectors that load URLs. New escaping rule for CSS services.
- **Also updated:** the rule index row P9, checklist items 8 and 9, §5 open questions (form fields inside `#wrapper` for logged-in visitors; Firefox and Safari not tested), and the section notes.

### Follow-ups for other section owners (not edited here)

Align every reduced-motion snippet to exactly:

`@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}`

| Section | Currently | Change |
|---|---|---|
| 04, line ~599 | three-selector form | use the six-selector block |
| 07 §7.5 | `.01ms` form | switch to `transition:none` |
| 09 #112 | `.01ms` form | switch to `transition:none` |
| 10 §5.1 | already matches | none |

To check: `grep -n "prefers-reduced-motion" knowledge/sections/*.md`.

## Gap fill for 06-cascade-and-specificity.md (2026-10-14, 14:00–14:15 UTC)

Two gaps:

1. **`@layer` contradiction.** 06 rule 3 and 09 #13 say "never layer"; 08 §12.3–12.5 recommend `layer(fw)` / `layer(...)` imports. Fix: re-run x08-03 p12 on real itch files.
2. **What survives a save.** 06 §3 said nesting was untested, while 01 §4 and 07 §7.1 cite it as served unchanged. Fix: census of constructs in served custom CSS.

**0 requests to itch.io** in this pass. All inputs are same-day scratchpad copies made by other agents, and Chrome ran with every non-local host unresolvable.

### Setup

- **Browser.** Headless Chrome **155.0.8059.79**, throw-away profile, `--virtual-time-budget=5000 --dump-dom`, `--host-resolver-rules="MAP * ~NOTFOUND, EXCLUDE 127.0.0.1"`. Pages were served by `python -I -m http.server <port> --bind 127.0.0.1`.
- **Tools** (own code, in `knowledge/evidence/gapfill-06-tools/`):
  - `build.py` builds the test pages;
  - `run.sh` serves them, runs Chrome and prints each `RESULT {…}` line;
  - `scan.py` counts constructs;
  - `ctx.py` prints nested-rule contexts, to rule out stray braces;
  - `distinct.py` dedupes sheets by sha1.
- **Inputs** (scratchpad only; md5):

| File | Origin | Fetched (UTC) | md5 |
|---|---|---|---|
| `section-06-v2/raw/profile.html` | a live itch profile (the KB owner's), logged out | 13:40:52 | a063a056738cb2a31101a6aecbda02f1 |
| `section-06-v2/raw/user.css` | `static.itch.io/user.css?1791981660`, 71,824 B, Last-Modified 2026-10-06 | 13:41:45 | 2a073ae494c3e850ceb1d890e78eb95e |
| `extcss-section2/raw/animate.css_4.1.1_animate.min.css` | jsDelivr `animate.css@4.1.1`, 71,750 B | 13:40:39 | c0be8e53226ac34833fd9b5dbc01ebc5 |
| `community-verify2/gh/styles-1.14.2.css` | the public GitHub source file of the profile in community-38 | same day | cfd3db9bde9920d713e88bb74eddfd65 |

- **Re-run, gapfill06-01/02/03:**

```bash
python -I build.py <profile.html> <user.css> <animate.min.css> <www>
sh run.sh <www> <out> 8796 v0-baseline.html v1-animate-unlayered.html v2-animate-layer.html \
   v3-layer-use-bounce.html v4-layer-own-bounce.html v5-tw-like-important.html \
   v6-layer-reset-leak.html v7-earlier-layer-important.html
```

- **What `build.py` does:**
  - rewrites the `static.itch.io/user.css` link to the local copy;
  - deletes every `<script>`;
  - keeps the real `style#user_theme` and DOM;
  - replaces `style#custom_css` with the variant.
- **Probes:**
  - outside `#wrapper`: `.animate_bounce`, `.animate_heartbeat`, `.user_panel_widget .notifications_bubble` (itch's `bouncein`) and `.animate_drop_down`;
  - inside `.user_profile`: `.animate_bounce`, `.custom-pop`, `a.custom-red` and `a.custom-blue`.
- **Measurements.** The probe script runs synchronously at the end of `<body>`. It reads `getAnimations()[0].animationName` and `effect.getKeyframes()` (frame count plus a transform/opacity signature), and computed colors.
- **Telling the two `bounce`s apart.** itch's `bounce` has 9 frames with `rotate(10deg)`; Animate's `bounce` has 9 frames with `scaleY(1.1)`.

### gapfill06-01: Animate.css `layer(fw)` vs real `user.css` (x08-03 p12 re-run)

| Variant (`custom_css`) | Import | itch `.animate_bounce` outside / inside `#wrapper` | itch `heartbeat` / `bouncein` | `#wrapper .custom-pop` |
|---|---|---|---|---|
| v0 none | — | itch `bounce` (rotate frames) / same | itch / itch | none |
| v1 `@import url("animate.min.css");` | 307 rules, unlayered | **Animate `bounce`** (`translate3d(0,-30px,0) scaleY(1.1)`) / same: **hijacked** | itch / itch (case-sensitive: `heartBeat` and `bounceIn` don't clash) | `bounceIn`, 12 frames |
| v2 `… layer(fw);` | 307 rules, layer `fw` | **itch `bounce`** / itch `bounce`: **kept** | itch / itch | `bounceIn` runs |
| v3 `layer(fw)` + pop uses `bounce` | layer `fw` | itch / itch | itch / itch | resolves to **itch's** `bounce` |
| v4 `layer(fw)` + pasted `@keyframes bounce{from,to{opacity:.25}}` | layer `fw` | **pasted** (op 0.25) / pasted | itch / itch | pasted |

- **Source check.** In `bundle.min.js` (`section-06-v2/raw`), `follow_button_widget` defaults `animate_follow` to `"animate_bounce"` and `animate_unfollow` to `"animate_drop_down"`, and calls `setState({animate_class: following ? "animate_bounce" : "animate_drop_down"})`. A `bounce` clash therefore changes the Follow button's animation.

### gapfill06-02: a layered base still applies where itch sets nothing

| Variant | `body` margin-top | `h1.custom-title` letter-spacing |
|---|---|---|
| v0 | 0px | normal |
| v6 `@import … layer(fw); @layer fw{body{margin:7px}h1{letter-spacing:3px}}` | **0px** (itch's `body` rule wins) | **3px** (applies) |

### gapfill06-03: layered `!important` (Tailwind v4 `important` shape)

| Variant | `a.custom-red` | `a.custom-blue` |
|---|---|---|
| v0 | rgb(255, 200, 87) (theme `.user_page a` literal) | rgb(255, 200, 87) |
| v5 `@layer theme,base,components,utilities; @layer utilities{.custom-red{color:rgb(200,0,0)!important}.custom-blue{color:rgb(0,0,200)}}` + unlayered `#wrapper .user_profile a.custom-red{color:rgb(0,150,0)!important}` | **rgb(200, 0, 0)**: the layered `!important` (0,1,0) beats the unlayered `!important` (1,2,1) | rgb(255, 200, 87): the layered normal rule loses to the real theme |
| v7 `@layer custom-override,theme,base,components,utilities;` + `@layer utilities{…rgb(200,0,0)!important}` + `@layer custom-override{.custom-red{color:rgb(0,150,0)!important}}` | **rgb(0, 150, 0)**: the earlier-declared layer's `!important` wins | – |
| v8 `@layer custom-override,utilities;@import url("tw-like.css") layer(utilities);@layer custom-override{.custom-red{color:rgb(0,150,0)!important}}` (`tw-like.css` = `.custom-red{color:rgb(200,0,0)!important}`) | **rgb(0, 150, 0)**: the import loaded (1 rule, `layerName` `utilities`) and the override layer's `!important` won | – |

`user_theme` contains no `@layer` in any variant. Run v8 with `sh run.sh <www> <out> 8798 v8-import-layer-override.html` after re-running `build.py`, which also writes `tw-like.css`.

### gapfill06-04: constructs in served custom CSS

- **Command:** `TSV=1 python -I scan.py corpus=<scratch>/corpus/raw` for the 62-page corpus (first run, 10:08–10:40 UTC). The scan finds 63 pages, because the devlog post shares its project's sheet.
- **Then:** the same with one `label=<dir>` argument per scratchpad `raw/` or `live/` directory containing `id="custom_css"` or `id="jam_theme"` (49 directories, all fetched 2026-10-14 by other agents). Run `distinct.py` over the same directories.
- **Extraction:** as `corpus-tools/getcss.py`.
- **Page key:** `<body data-page_name>` + `itch:path` meta + `og:title` (itch pages have no canonical link). The newest copy wins.
- **Cleaning:** comments stripped; string and `url()` contents blanked before counting `&`. A nested rule is a style-rule `{` opened inside another style rule; `@keyframes` blocks are excluded.

| Construct | 62-page corpus: pages (profile / project / jam) | occurrences | All copies: 125 distinct sheets (19 profile / 71 project / 35 jam) |
|---|---|---|---|
| nesting (nested style rules) | **7** (4 / 3 / 0) | 142 rules | **11** (5 / 5 / 1) |
| `&` outside strings/urls | 4 (2 / 2 / 0) | 129 (73, 32, 23, 1) | 4 (2 / 2 / 0) |
| range media query (`@media(width>=780px)`, `(width<=900px)`) | 1 (1 / 0 / 0) | 2 | 1 profile |
| `:has(` | 8 (2 / 4 / 2) | 27 | 16 (2 / 9 / 5) |
| `@property` | **1** (0 / 0 / 1) | 2: `syntax:'<number>'` and `'<angle>'`, raw `<` | 1 jam |
| `@container` | **0** | 0 | **1 project** (`@container <name> (width < 1px)`) |
| `@supports` | 1 jam | 1 | 2 jams |
| `@layer`, `@scope`, `@starting-style`, `@view-transition` | **0** | 0 | **0** |
| `@charset` | 0 | 0 | 1 project |

- **Brace check** (`ctx.py`). Every nested-rule page closes all its blocks except one project page with 1 unclosed block at end of file (`#wrapper{ .game_frame{…} …`). Its 2 nested rules may be an unbalanced-brace accident; browsers auto-close at the end of the sheet.
- **Files with the rare constructs** (scratchpad):
  - `@property`: `corpus/raw/j_20-second-game-jam-2026.html`;
  - `@container`: `crawlproject-verify/raw/n-prerolled.html`;
  - nesting on a jam: `sanitizer-verify2/live/furries.html`.

### gapfill06-05: served CSS vs its source, byte for byte

| Pair | Bytes | Result |
|---|---|---|
| public source `styles-1.14.2.css` vs the served `custom_css` of the same profile (`corpus/raw/p_nnda.html`, 10:10 UTC) | 4,759 / 4,759 | **identical** (`a == b`) |
| the same source vs the re-fetch `corpus-verify2/raw/p_nnda.html` (13:07 UTC) | – | identical |
| the private repo's `dist/main.min.css` vs the owner's served sheet (`gapfill-05/raw/mirokshi.html`, 11:33 UTC) | 4,726 / 4,725 | identical after `strip()` (trailing newline only) |

- **What the identical source contains** (scan.py): 32 `&`, 31 nested rules, 2 range media queries, 1 `:has()`, 1 `@import`.
- **Conclusion.** For profiles, nesting, raw `<`/`>`/`&` and range queries survived itch's save pipeline unchanged (at an unknown save date).
- **The owner's sheet** has no nesting or `@property`; it only shows that two `@import`s and `@media` survive.

### Section 06 edits

- **Rule 3.** Rewritten: never layer *overrides*; one exception for sheets you want to lose, with sub-bullets on keyframes-only libraries, the low-priority base, and layered `!important`.
- **§2 table.** `@layer` row.
- **§3.** "Nesting untested" replaced by a "What survives a save" table.
- **§6.** Tailwind option 1 now notes that it beats your own `!important`. New §6.1 "When `layer()` is the right tool" (decision table, override layer, case-sensitive names, no scoping).
- **§9.** Follow-button source note, plus the real-file Animate.css result.
- **Symptom table.** Two rows.
- **Section notes.** gapfill06 entries, the owner save-test probe, and two "Conflicts resolved" entries.

### Follow-ups for other section owners (not edited here)

| Section | Change |
|---|---|
| 09 #13 | Add the same exception: `layer()` is fine for sheets that should lose (keyframes-only libraries such as Animate.css `layer(fw)`, a low-priority base). Never use it for overrides. Layered `!important` beats unlayered `!important`; override it from an earlier-declared layer (gapfill06-01, gapfill06-03). |
| 08 §12.3 / §12.4 | Optionally cite gapfill06-01 (real `user.css`) next to x08-03 p12. Note that v4 `important` utilities beat the author's own unlayered `!important` (gapfill06-03). |
| 07 §7.1 | "0 of 62" is correct for `@container`, but 1 of 125 sheets in the wider same-day sample uses it (gapfill06-04). |
| 01 §4 | Nesting survival can cite the byte-identical match (gapfill06-05). `@property` with `<` is only observed on a jam (gapfill06-04). |

## Gap fill for 05-html-in-descriptions.md (2026-10-14, 14:05–14:30 UTC, round 2)

Three gaps:

1. Do empty `<span class="custom-l"></span>` survive inside a bio `<h1>`? This is the letter-split heading pattern of 07 §7.5, 09 #105 and 10 §9.4.
2. Several sanitizer behaviours were still inferred from the library: the class-token filter, `class` on itch-added tags, `popover`, inline `--i`, iframe attributes and `aria-*`.
3. The "exactly 27 properties [observed]" claim was an overclaim.

**0 requests to itch.io** in this pass. There was 1 WebFetch to `developer.spotify.com` (Spotify's own embed docs) and 1 web search (SoundCloud embed code). Nothing was saved on any itch account, so the account-owner probes at the end are still open.

### Setup

- **Corpus.** Same-day downloads made by other agents, in the scratchpad (raw copies never leave it):
  - `sanitizer/live` (incl. Wayback), `crawlprofile/raw`, `crawlproject/raw`, `crawljam/raw`;
  - `sanitizer-verify2/live`, `crawljam-verify2/raw`, `crawlprofile-verify2/raw`, `crawlproject-verify2`;
  - `crawlprofile-verify`, `crawlproject-verify`, `crawljam-verify`;
  - `corpus`, `corpus-verify`, `corpus-verify2`, `community-verify2`.

  That is 885 `.html` files, of which 721 hold itch user-content containers. 10 local harness files were rejected because they have no itch `canonical`, `itch:path` or `og:site_name=itch.io` marker. Without that filter, agent-made test pages inject fake `id`s and Bootstrap classes into the counts.
- **Dedup.** Containers use the same detection as `section05-tools/s05check.py`. They are deduplicated by (kind, body with each tag's attributes sorted), because itch re-orders injected attributes per request.
  - Containers: **50 bios, 145 project pages (155 containers), 22 devlog posts, 99 jam descriptions, and 5,647 comments on 154 pages.**
  - Authored opening tags: **35,801** (bio 735, project 11,238, devlog 819, jam 12,301, comments 10,708).
- **Tools.** Own code in `knowledge/evidence/gapfill-05-tools/`. All print counts only. `--contexts` writes snippets to a scratch file that is never committed.

  | Tool | What it counts |
  |---|---|
  | `g05r2scan.py` | spans, empty inline tags, class-token kinds, special attributes, style properties, iframes, itch-added tags |
  | `g05r2empty.py` | empty elements per tag × attribute shape, with page counts |
  | `g05r2attrs.py` | attribute names on authored tags |
  | `g05r2iframes.py` | iframe host × attribute set, for live tags and for iframes stored in `data-embed_code` |
  | `g05r2styleprops.py` | inline-style properties, with value shapes |
  | `g05r2probe.py` | library-model probes and fixed-point tests; writes `g05r2_probe.json` (own inputs only) |

- **Library.** `web_sanitize` @`1ca8317` (2026-09-29) with LuLPeg, run through lupa 2.8 (Lua 5.5) in the sanitizer venv. Sister-app source read: `leafo/streak.club` @`b5b4679`, `helpers/html.moon`.
- **Re-run** from the scratchpad root, with `$D` = the directory list above:
  - `python -I <kb>/knowledge/evidence/gapfill-05-tools/g05r2scan.py [--contexts out.txt] $D`
  - the same for `g05r2empty.py`, `g05r2attrs.py`, `g05r2iframes.py` and `g05r2styleprops.py`
  - `sanitizer/venv/Scripts/python.exe -I <kb>/knowledge/evidence/gapfill-05-tools/g05r2probe.py sanitizer/src/web_sanitize sanitizer/src/lulpeg_dl/LuLPeg <out.json> $D`

### The "itch model" whitelist used by `g05r2probe.py`

It starts from the default whitelist's `clone()` and changes the following:

- global `style` = `css.sanitize_style`;
- global `class` = a token filter (two hypotheses, below);
- `a.target = true`;
- host-based injection of `rel="nofollow noopener"` and `referrerpolicy="origin"`;
- `img` gets `loading="lazy"`;
- `details`, `summary`, `figure`, `figcaption`, `del`, `ruby`, `rt`, `rp` and `font` are assigned `= true` **after** `clone()`;
- `iframe` is set **after** `clone()` to `{width, height, frameborder, allowfullscreen, scrolling, src (url), style}`.

The two class-filter hypotheses:

- **H1 prefix:** keep a token that starts with `custom` (case-sensitive) or equals `text-center`, `text-justify`, `text-right` or `spoiler`.
- **H2 strict:** the same, but the token must match `^custom[A-Za-z0-9_-]*$`.

Both rejoin the kept tokens with one space and drop the attribute when nothing is left. The iframe and class entries are models built from the live observations, so their iframe and class outputs are hypotheses, not evidence.

### gapfill05-01: empty spans survive storage and re-render (gap 1)

`g05r2empty.py` counts elements whose content is empty (`""`) or only whitespace/`&nbsp;`:

| Element | Bio | Project | Jam | Devlog |
|---|---|---|---|---|
| `<span></span>` (no attributes) | 7 on 4 pages | 77 on 24 | 64 on 31 | 1 |
| empty `<span>` with `style`/`title`/`lang` | 0 | 12 on 8 | 1 | 0 |
| empty `<span class="custom…">` | **0** | **0** | **0** | **0** |
| `<span class="custom…">&nbsp;</span>` | 0 | 15 on 2 pages | 0 | 0 |
| empty `<div class="custom…">` | 8 on 2 | 11 on 3 | 13 on 3 | 0 |
| empty `<h1 class="custom…">` | 0 | 0 | 1 | 0 |
| empty `<strong>` / `<em>` | 4 / 0 | 26 / 19 | 80 / 11 | 1 / 1 |

- Comments add 114 empty attribute-less spans.
- Headings that contain an empty span: project 6, jam 6. They include `<h1><span></span>…</h1>`.
- The only bio heading with 2 or more spans is the KB owner's `h1.custom-title`, and its letter spans are not empty.

Reading:

- Both the save path and the per-render sanitize keep empty spans, empty `custom-` elements (`div` and one `h1`) and empty `strong`/`em`. So no "remove empty inline tags" step reaches stored content.
- Redactor's `removeEmpty` option would have removed exactly these. That the option exists is from memory and is **unverified**: the Redactor build itself was not downloaded.
- **No live sample has an empty span that carries a `custom-` class.**

### gapfill05-02: library model of the letter-split heading (gap 1)

`g05r2probe.py`, under both hypotheses:

- `<h1 class="custom-title"><span class="custom-sr">Miro</span><span class="custom-l"></span><span class="custom-l"></span></h1>` comes out **byte-identical**.
- `<span class="custom-l"></span>` and `<span class="custom-l">&nbsp;</span>` are also unchanged.

`html.moon` has no empty-element pruning. Its only rewrites are attribute filtering, escaping and auto-closing.

### gapfill05-03: class tokens on live pages (gap 2)

| Check | Result |
|---|---|
| authored `custom*` tokens (deduplicated containers) | 1,204: bio 98 (`custom-` 47, hyphenless `customX` 51), project 495, jam 581 (incl. 65 `custom_`), devlog 30 |
| tokens with a character outside `[A-Za-z0-9_-]` (`: / [ ] .` …) | **0** |
| tokens starting with `-` | 0 |
| tokens starting `Custom`/`CUSTOM` (any case variant of the prefix) | 0 |
| tokens with **uppercase after `custom-`** (e.g. `custom-aHero`, or hashed names) | **74 on 3 project pages; kept with case preserved** |
| empty `class=""` | 0 |
| authored tokens that are neither itch's nor `custom*` | 0. Only `text-center`/`-justify`/`-right`, `spoiler`, and itch's own embed/comment classes |
| class values with leading, trailing or double whitespace, tabs or newlines | **0 of 2,293** |
| tokens satisfying H1 / H2 | 1,204 / 1,204, so the live data cannot separate the hypotheses |

### gapfill05-04: library-model predictions for the open class cases (gap 2)

| Input token(s) | H1 prefix | H2 strict |
|---|---|---|
| `Custom-x`, `CUSTOM-x` | dropped | dropped |
| `custom-Ab_C` | kept | kept |
| `class=""`, `class=" "`, bare `class` | attribute removed | attribute removed |
| `custom-md:flex`, `custom-w-1/2`, `custom-[x]`, `custom-a.b` | kept | dropped |
| `-custom-x`, `md:custom-x` | dropped | dropped |
| `custom-card__title--big` (BEM) | kept | kept |
| `foo custom-x  bar text-center` | `custom-x text-center` | same |
| `CLASS="custom-x"` | `CLASS="custom-x"` (the library keeps the name's case) | same |

### gapfill05-05: attributes on itch-added tags (gap 2)

Authored occurrences (deduplicated):

| Page type | `details` | `summary` | `figure` | `figcaption` | `del` | other |
|---|---|---|---|---|---|---|
| project | 79 | 79 | 78 | 10 | 22 | `ruby` 2, `rt` 2, `rp` 4 |
| jam | 188 | 188 | 35 | 14 | 24 | – |
| devlog | – | – | 17 | 15 | 2 | – |
| bio | 1 | 1 | 4 | – | – | `font` 6 |

**None of them carries any attribute.** The only `details` with a class are itch's own `details.toggle_post_body` in comments (10).

Mechanism, from leafo's open-source streak.club:

- `helpers/html.moon` adds `whitelist.tags.del = true` after loading the whitelist, and adds `iframe` as a fixed attribute table.
- In the library's `html.moon`, `check_attribute` returns early and writes nothing when the tag's whitelist entry is not a table.
- So a tag added as `true` loses every attribute, including the global `title`, `lang` and `dir`.

The model reproduces this: `<details class style title open>` becomes `<details>`, and `<figure class style>` becomes `<figure>`.

### gapfill05-06: aria, role, id, data and popover in 35,801 authored tags (gap 2)

`g05r2attrs.py`: the authored attribute names are only these:

- `href src loading rel referrerpolicy target class style alt title lang dir width height frameborder allowfullscreen scrolling colspan name align datetime`;
- the spoiler `span[tabindex]` (jam 2, comments 5);
- one itch-generated `a[data-image_lightbox]` on a devlog image link (`game.min.js` references `image_lightbox`).

There are **0** `aria-*`, `role`, `id`, other `data-*`, `on*`, `popover` or `popovertarget` attributes. The library model drops `popover`, `popovertarget`, `aria-*`, `role`, `tabindex`, `id` and `data-*`, and keeps `custom-` classes.

### gapfill05-07: inline custom properties (gap 2)

There are 0 custom-property declarations in 680 authored style attributes (`g05r2styleprops.py`). The library gives:

| Input | Output |
|---|---|
| `--i:3` | `style=""` |
| `--i: 3` | `style=""` |
| `--i:3;color:red` | `style="color:red"` |
| `color: red; --i: 3` | `style="color: red"` |

### gapfill05-08: iframe attributes and hosts (gap 2)

`g05r2iframes.py` found 261 deduplicated iframe tags, live or stored in placeholders: comments 128, project 95, jam 36, devlog 2.

- **Attribute names.** Only `src width height frameborder allowfullscreen scrolling style` occur. There are **0** `title`, `allow`, `loading`, `referrerpolicy`, `sandbox`, `class` or `seamless`.
- **Hosts.** 11 hosts in all, including two small jam sites. In project descriptions every non-itch iframe is a placeholder.

  | Host | Count | Where |
  |---|---|---|
  | YouTube | 160 | 16 live in jams, 1 live in a devlog, 16 placeholders in projects, 127 in comments |
  | `itch.io/embed` | 77 | live |
  | `hypergame.dev` | 12 | jam |
  | `store.steampowered.com` | 3 | project placeholders |
  | `w.soundcloud.com` | 2 | project placeholders |
  | `trijam.rocknightstudios.com` | 2 | jam |
  | `player.vimeo.com`, `open.spotify.com`, `sketchfab.com`, `discordapp.com`, `bandcamp.com` | 1 each | – |

- **Source vs. stored, using each provider's own embed code:**
  - **Spotify.** Its documented code (WebFetch of developer.spotify.com, today) is `style="border-radius: 12px"`, `src`, `width`, `height`, `frameborder="0"`, `allowfullscreen=""`, `allow="autoplay; …"`, `loading="lazy"`. The one Spotify iframe on a jam page has the same attributes **in the same order**, minus `allow` and `loading`, and with **`style=""`**. So `allow` and `loading` were dropped. The iframe's `style` also went through the CSS filter, which removed `border-radius`.
  - **SoundCloud.** Its code carries `allow="autoplay"` (community sources). The stored SoundCloud iframe keeps `width height scrolling frameborder src` in that order, without `allow`.
  - **Bandcamp.** The stored iframe has no `seamless`. Its inner `<a>` is kept and gets the injected `rel`.
- *(Retracted while writing this block.)* A claim that provider camelCase (`frameBorder`) is stored lowercase was dropped. The Spotify docs page, as fetched, already shows lowercase `frameborder`, so nothing shows the lowercasing.
- **Bios.** 0 iframes in 50 bios, so click-to-activate on profiles is still unknown.

### gapfill05-09: inline-style census and the 27-property list (gap 3)

`g05r2styleprops.py` found 680 authored style attributes (63 of them empty, `style=""`). They use **21 distinct properties, all on web_sanitize's 27-property `css_whitelist.moon` list, and 0 outside it**:

| Property | Declarations | Pages |
|---|---|---|
| `color` | 341 | 59 |
| `font-size` | 192 | 63 |
| `border` | 87 | 10 |
| `padding` | 86 | 10 |
| `margin` | 77 | 14 |
| `background` | 58 | 5 |
| `width` | 55 | 17 |
| `text-align` | 52 | 17 |
| `background-color` | 33 | 21 |
| `max-width` | 25 | 15 |
| `margin-bottom` | 20 | 5 |
| `height` | 19 | 9 |
| `margin-top` | 17 | 6 |
| `margin-right` | 6 | 2 |
| `margin-left` | 6 | 2 |
| `padding-left` | 4 | 4 |
| `opacity` | 4 | 1 |
| `min-height` | 2 | 1 |
| `padding-bottom` | 2 | 2 |
| `padding-right` | 2 | 2 |
| `max-height` | 1 | 1 |

**Never seen live:** `padding-top`, `background-image`, `border-width`, `border-color`, `border-style`, `min-width`.

**Fixed-point test** (`g05r2probe.py`). The 207 distinct live style values (bio 15, project 104, jam 77, comment 11) were each re-run through the library's `sanitize_style`:

- all 207 come back unchanged, and the default grammar would remove no live declaration;
- library positives: each of the 27 properties with a simple value is kept;
- library negatives: `border-radius`, `display`, `font-weight`, `line-height`, `transform`, `position` and `font-family` each give `""`.

Two claims stay **library model**: that the 27-list is itch's list, and that the negatives are dropped. The live data only shows that nothing outside the list has ever been stored.

### Open: needs the account owner (not done)

The probe:

1. Save one probe bio, in HTML mode with one line per element, and keep it for under 2 minutes.
2. Fetch the profile logged out: `curl -A "<browser UA>" https://mirokshi.itch.io/`.
3. Diff the contents of `div.user_profile`.
4. Restore the bio.

```html
<h1 class="custom-title"><span class="custom-sr">Miro</span><span class="custom-l"></span><span class="custom-l"></span></h1>
<div class="custom-probe"><span class="Custom-a">1</span><span class="custom-md:b">2</span><span class="custom-w-1/2">3</span><span class="custom-[c]">4</span><span class="custom-d.e">5</span><span class="-custom-f">6</span><span class="">7</span>
<details class="custom-g" style="color: red"><summary class="custom-h">s</summary>t</details><figure class="custom-i"><figcaption>f</figcaption></figure>
<div class="custom-p" popover>p</div><a popovertarget="x" class="custom-q">q</a><span style="--i:3; color: red">r</span><span class="custom-r" aria-label="x" role="img">s</span>
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="320" height="180" title="t" allow="autoplay" loading="lazy" frameborder="0" allowfullscreen></iframe>
<span style="opacity: .5; background-image: url('https://img.itch.zone/x.png'); border-width: 2px; border-color: #ccc; border-style: dashed; min-width: 10px; padding-top: 4px">u</span><span style="border-radius: 4px">v</span><span style="display: block">w</span></div>
```

Expected under the library model:

- the `h1` is unchanged;
- only `custom-…` tokens without `: / [ ] .` are certainly kept;
- these are gone: the attributes on `details`, `figure` and `summary`, and `popover`, `popovertarget`, `aria-label`, `role`, `--i`, `title`, `allow` and `loading`;
- the bio iframe is either live or a `button.embed_preload` (unknown);
- the 7 declarations on span `u` are kept: the 6 properties never seen live, plus `opacity`, which was seen on only 1 page;
- `border-radius` and `display` give `style=""`.

## Gap fill for 09-gotchas.md (2026-10-14, 14:10–14:40 UTC)

Two gaps: (1) the size advice contradicted itself: 09 #40 said "write non-ASCII as `\hex`" and "under about 5,000", while 01 §3 said prefer raw UTF-8 and budget 5,120. (2) 09 #44 recommended lightningcss/csso without evidence, and the KB relies on duplicate-declaration fallbacks. **0 requests to itch.io** in this pass. Every test is local: the minifier packages were already installed on this machine, Chrome ran against `127.0.0.1`, and remote hosts were blocked.

### Setup

- **Browser.** Headless Chrome **155.0.8059.79**, isolated profile:
  `chrome --headless=new --remote-debugging-port=9479 --user-data-dir=<scratch>/gapfill-09/chrome-profile --no-first-run about:blank`
- **Server.** `python -m http.server 8791 --bind 127.0.0.1`, run in `<scratch>/gapfill-09/out`. It is needed because the fixture's `@import url("imp.css")` must resolve.
- **Driver.** Node 22.13 with `knowledge/evidence/a11y-tests/cdp.mjs`.
- **Minifiers.** These are the user's existing installs, not downloaded for this test. Each was called through its Node API with the options the CLI flags map to (that mapping is inferred):

  | Label | Package (version) | Call | CLI equivalent |
  |---|---|---|---|
  | `lightningcss` | lightningcss **1.33.0** | `transform({code, minify:true})` | `lightningcss --minify` |
  | `lightningcss-targets` | same, plus browserslist 4.28.7 / caniuse-lite 1.0.30001806 | `…, targets: browserslistToTargets(browserslist('>= 0.25%'))` | `lightningcss --minify --targets '>= 0.25%'` |
  | `csso` | csso **5.0.5** | `minify(css)` (restructure on) | `csso` |
  | `csso-norestructure` | same | `minify(css,{restructure:false})` | `csso --no-restructure` |
  | `esbuild` | esbuild **0.28.0** | `transformSync(css,{loader:'css',minify:true})` | `esbuild --minify` |
  | `esbuild-utf8` | same | `…, charset:'utf8'` | `esbuild --minify --charset=utf8` |
  | `repo-regex` | `repo-regex-minify.ps1` (the five regexes of the private repo's `.claude/minify-css.ps1`, read 2026-10-14) | PowerShell 5.1 | – |

  **Not tested:** cssnano and clean-css (not installed), Firefox (no binary; Playwright has only `chromium-1217`) and Safari.
- **Tools and fixtures** (own code, in `knowledge/evidence/gapfill09-tools/`; minified outputs and probe JSON in `outputs/`):
  - `fixture/src.css` + `imp.css`: 6 fallback pairs (F1–F6), string/selector/calc syntax (S1–S4), nesting (S5), `@property` (S6), `@layer` statement + blocks (S7), a tie with the imported sheet (S8), rule-order ties (R1–R5), and media, data-URI and `@starting-style` cases (M1–M4).
  - `fixture/src-layerfirst.css`: `@layer a,b;` **before** `@import`.
  - `fixture/fallbacks.css`: 25 duplicate-declaration fallback patterns (`.f-01`–`.f-25`), plus `min-width` vs range media (`.f-26`, `.f-27`).
  - `fixture/modern.css`: 15 modern constructs, each marked with `order:<n>`.
  - `run-minifiers.mjs`, `build-harness.py`, `build-fb-harness.py`, `probe.mjs`, `probe-fb.mjs`, `fb-table.py`: run the minifiers, wrap each output in an itch-like page (mock `<style id="user_theme">`, then the output inline in `<style id="custom_css">`, then `#wrapper > .user_page` 500px wide), and read computed values.
  - `build-repo-harness.py`, `probe-repo.mjs`: a real-page equivalence check. It takes the private repo's `preview/itch-io.html` export (copied to the scratchpad only), points `user.css` at a local copy, strips the scripts, and swaps `custom_css` for each output. It then compares every computed property of every element under `#wrapper`, plus its `::before`/`::after`, against the unminified source. `Network.setBlockedURLs` blocks `itch.io`, `itch.zone`, `vercel.app`, `googleapis.com` and `gstatic.com`, so runs are deterministic.
  - `mk_size_fixtures.py`: the raw-vs-escaped size files.
- **Re-run** (from `gapfill09-tools/`; `<S>` = a scratch dir):
  ```
  python -I mk_size_fixtures.py <S>/size
  node run-minifiers.mjs fixture/src.css <S>/out main ; node run-minifiers.mjs fixture/src-layerfirst.css <S>/out lf
  node run-minifiers.mjs fixture/fallbacks.css <S>/out fb ; node run-minifiers.mjs fixture/modern.css <S>/out mod
  powershell -File repo-regex-minify.ps1 fixture/src.css <S>/out/main.repo-regex.css   (same for src-layerfirst -> lf.repo-regex.css)
  python -I build-harness.py fixture <S>/out ; python -I build-fb-harness.py fixture <S>/out
  (serve <S>/out on 127.0.0.1:8791, start Chrome as above)
  CDP_PORT=9479 node probe.mjs http://127.0.0.1:8791 <S>/out
  CDP_PORT=9479 node probe-fb.mjs http://127.0.0.1:8791 <S>/out
  python -I fb-table.py <S>/out fb
  ```
  Package paths default to this machine's installs; override them with the env vars `LCSS`, `BL`, `CSSO` and `ESB`.

### gapfill09-01: raw UTF-8 vs `\hex`, measured

The 01 §3 snippet was run verbatim, then extended with UTF-16 units (`len(s.encode('utf-16-le'))//2`). The test file is one rule, `#wrapper .custom-x::before{content:"…"}`, holding the ten characters `→ ★ ñ ¡ é · … ✓ 日 😀`:

| File | Chars | UTF-8 bytes | UTF-16 units |
|---|---|---|---|
| `ten-raw.css` | **48** | **65** | **49** |
| `ten-esc.css` (`\2192\2605\f1\a1\e9\b7\2026\2713\65e5\1f600`) | 81 | 81 | 81 |

Per character (chars / bytes / UTF-16), raw vs escape:

| Char | Raw | Escape |
|---|---|---|
| `→` | 1 / 3 / 1 | 5 / 5 / 5 |
| `ñ` | 1 / 2 / 1 | 3 / 3 / 3 |
| `日` | 1 / 3 / 1 | 5 / 5 / 5 |
| `😀` | 1 / 4 / 2 | 6 / 6 / 6 |

- **Proof (inferred).** An escape is `\` plus h hex digits: h+1 in every unit. UTF-8 needs 2 bytes for h=2 and h=3 (up to U+7FF), 3 for h=3 and h=4, and 4 for h=5 and h=6. So the UTF-8 length is ≤ h < h+1, and an escape is never shorter.
- **Escape followed by a hex digit or space.** A terminating space is needed, which costs one more.

### gapfill09-02: raw and escaped render the same

In `main.source`, `content:"→ ñ"` and `content:"\2192  \f1"` both compute to `"→ ñ"` in Chrome 155. The escape's first space ends it; the second is a real space.

### gapfill09-03: minifiers and escapes

Ten-character rule, input raw or escaped. Output chars / bytes:

| Setting | Output | Size |
|---|---|---|
| lightningcss, lightningcss-targets, esbuild-utf8 | raw | 47 / 64 |
| csso, csso-norestructure | raw | 48 / 65 |
| esbuild (default charset) | escaped | 80 / 80 |

- Escapes in the input are decoded to raw by every setting except default esbuild.
- Default esbuild escapes raw input.

### gapfill09-04: size gain on a real sheet

The input is the private repo's `src/main.css` (source of the live profile CSS). The regex reproduction is **byte-identical** to the repo's committed `dist/main.min.css` (`cmp` silent), 4,725 chars.

| Setting | Chars (= bytes, ASCII only) | vs regex |
|---|---|---|
| repo-regex | 4,725 | – |
| lightningcss | 4,602 | −2.6 % |
| esbuild / esbuild-utf8 | 4,651 | −1.6 % |
| csso | 4,686 | −0.8 % |
| lightningcss-targets | 4,691 | −0.7 % |
| csso-norestructure | 4,712 | −0.3 % |

### gapfill09-05: real-page computed equivalence (Chrome 155)

`probe-repo.mjs` compared 182 boxes, every computed property, at 1280px and at 375px:

| Setting | Differing values | Outside custom properties |
|---|---|---|
| csso, csso-norestructure, esbuild, esbuild-utf8, repo-regex | 0 | 0 |
| lightningcss, lightningcss-targets | 369 | 5 |

- **Custom properties.** lightningcss rewrote colours inside custom-property values (`rgba(10,18,46,.5)` → `#0a122e80`, `rgba(170,195,255,.18)` → `#aac3ff2e`), inherited by every box.
- **The 5 others.** `transform-origin:left` became `0`, so the computed value changed from `0% 50%` to `0px 50%`: the same point.
- **Conclusion.** Every setting is render-equivalent on this real sheet. It has no nesting, no fallback pairs and no range media queries, and its strings survive the regex.

### gapfill09-06: lightningcss drops "overridden" fallbacks

The table shows what was kept for each pattern in `fallbacks.css` (static, from `fb-table.py`). "Chrome" is the computed result where Chrome 155 can tell.

| Pattern | lightningcss (no targets) | lightningcss-targets | csso | csso-norestr. | esbuild(-utf8) |
|---|---|---|---|---|---|
| f-01 `content:"*";content:"*" / ""` | both | both | **2nd only** | both | both |
| f-02 `width:28px;width:random(…)` | both | both | both | both | both |
| f-03 `width:28px;width:future-fn(1)` | both | both | both | both | both |
| f-04 `color:blue;color:future-fn(1)` | **2nd only** (Chrome: inherited `rgb(20,20,20)` instead of blue) | **2nd only** (same) | both | both | both |
| f-05 `color:blue;color:future-fn(var(--x))` | 2nd only | 2nd only | both | both | both |
| f-06 `#123456;color-mix(srgb,#123456 50%,#fff)` | `#899aab` | `#899aab` | both | both | both |
| f-07 `#123456;color-mix(…var(--c)…)` | 2nd only | 2nd only | both | both | both |
| f-08 `#123456;color-mix(in oklch,currentColor 50%,#fff)` | **2nd only** | **2nd only** | both | both | both |
| f-09 `#fff;light-dark(#000,#fff)` | **2nd only** | `#fff` + `var(--lightningcss-light,#000)var(--lightningcss-dark,#fff)` | both | both | both |
| f-10 `100vh;100dvh` | **2nd only** | both | both | both | both |
| f-11 `-webkit-backdrop-filter;backdrop-filter` | **2nd only** | both | both | both | both |
| f-12 `-webkit-background-clip:text;background-clip:text` | both | both | both | both | both |
| f-13 `-webkit-mask-image;mask-image` | both | both | both | both | both |
| f-14 `position:-webkit-sticky;sticky` | both | both | both | both | both |
| f-15 `width:-moz-fit-content;fit-content` | **2nd only** | `-webkit-fit-content` + `fit-content` | both | both | both |
| f-16 `-webkit-user-select;user-select` | both | both | both | both | both |
| f-17 `display:block;display:grid-lanes` | both | both | both | both | both |
| f-18 `animation-delay:.2s;…sibling-index()…` | both | both | both | both | both |
| f-19 `font-weight:550;calc(…sin(var()))` | both | both | both | both | both |
| f-20 `background:#123;linear-gradient(in oklch,…)` | both | both | both | both | both |
| f-21 `text-wrap:wrap;pretty` | both | both | **2nd only** | both | both |
| f-22 `inset:0;inset:anchor(top) 0 0 0` | both | longhands + 2nd | both | both | both |
| f-23 `margin:0 auto;margin-inline:auto` | both | `margin-left/right` | both | both | both |
| f-24 `red;rgb(from red r g b / 50%)` | `#ff000080` | `#ff000080` | both | both | both |
| f-25 `100%;-webkit-fill-available;stretch` | **`stretch` only** | all 3 | **last 2** | all 3 | all 3 |

- **Chrome 155 diffs vs source** (`probe-fb.mjs`):
  - **esbuild** and **esbuild-utf8**: identical.
  - **lightningcss**: f-04 lost the colour. f-06 and f-24 differ in serialisation only.
  - **lightningcss-targets**: the same, plus **f-09 lost the colour** (gapfill09-08).
  - **csso** and **csso-norestructure**: f-27 lost the colour (gapfill09-12).
- **In the main fixture**, F3 (`-webkit-backdrop-filter`) was dropped by lightningcss without targets only. F5 (`color:blue;color:future-fn(1)`) was dropped by both lightningcss settings; Chrome then computes the inherited `rgb(20,20,20)`.

### gapfill09-07: lightningcss rewrites media queries to range syntax

- **Without targets.** `@media (min-width:600px)` became `@media (width>=600px)`, and `(min-width:1px) and (max-width:99999px)` became `(width>=1px) and (width<=99999px)`. On the real repo sheet the output had 3 range comparisons; the source had none.
- **With targets.** Range syntax is lowered instead: `(600px <= width)` became `(min-width:600px)`, and `(400px < width < 9000px)` became `(not (max-width:400px)) and (not (min-width:9000px))`.
- **Support.** Range syntax needs Chrome 104, Firefox 102 or Safari/iOS 16.4 (gapfill09-19).

### gapfill09-08: lightningcss targets and `light-dark()`

`color:#fff;color:light-dark(#000,#fff)` became `color:#fff;color:var(--lightningcss-light,#000)var(--lightningcss-dark,#fff)`.

- No `color-scheme` was declared in the build, so neither variable is defined. The substituted value is `#000#fff`, which is invalid at computed-value time.
- Chrome 155 then computes the inherited `rgb(20,20,20)`. The source gives `rgb(0,0,0)`.
- So the polyfill breaks the colour **even in a browser that supports `light-dark()`**.

### gapfill09-09: lightningcss resolves static colours

- `color-mix(in srgb,#123456 50%,#fff)` became `#899aab`. Chrome computes `color(srgb 0.535 0.602 0.669)` from the source and `rgb(137,154,171)` from the output: the same colour within rounding.
- `rgb(from red r g b/50%)` became `#ff000080`.

### gapfill09-10: a fallback before a `var()` value never applies

In the **source** fixture, Chrome 155 gave:

- f-05 `color:blue;color:future-fn(var(--custom-v))`: the inherited `rgb(20,20,20)`, not blue.
- f-07 `color:#123456;color:color-mix(in srgb,var(--custom-c) 50%,#fff)`, with `--custom-c` undefined: also inherited.

This matches 07 §7.3, s07-n1 T4: a declaration containing `var()` is accepted at parse time and wins the cascade, then becomes invalid at computed-value time. Removing the earlier line changes nothing.

### gapfill09-11: csso deletes native nesting

Both csso modes turned the S5 block (`color`, `& > .p-kid{…}`, `&.p-deep{…}`, nested `@media(…){&{…}}`) into `#wrapper .p-nest{color:#010203}`.

- Chrome 155: `.p-kid` became `rgb(1,2,3)` instead of `rgb(4,5,6)`. `.p-deep` became `rgb(1,2,3)` instead of `rgb(7,8,9)`. Word spacing became `0px` instead of `3px`.
- In `modern.css`, the bare nested `@media (width >= 1px){color:red}` inside `.m-10` was deleted too.

### gapfill09-12: csso deletes range-syntax media blocks

- Both modes deleted `@media (600px <= width){…}` (f-27; Chrome: inherited colour instead of red) and `@media (400px < width < 9000px){…}` (m-09).
- `@media (min-width:600px)` was kept.

### gapfill09-13: csso deletes an `@import` that follows `@layer a,b;`

- `src-layerfirst.css` is valid per css-cascade-5. Both csso modes output `@layer custom-a,custom-b;@layer custom-b{…}…` with no `@import`.
- Chrome 155: 0 `CSSImportRule`, and `.p-imp` is not styled.
- With `@import` first, csso kept it.

### gapfill09-14: csso restructure drops fallbacks

- The default mode removed the first line of f-01 (`content:"*"`), f-21 (`text-wrap:wrap`) and f-25 (`width:100%`). The main fixture's F1 lost `content:"★"` the same way.
- `restructure:false` kept all of them.
- On the main fixture, restructuring also removed the overridden first `.p-x` rule and the earlier duplicate `.p-u` rule. It merged `.p-dbl.p-dbl` into `.p-tie`'s rule, and merged `.p-raw::after` with `.p-esc::after`. All tie probes (R1–R5) stayed correct in Chrome.

### gapfill09-15: esbuild keeps everything

In all four fixtures, esbuild kept every fallback, every at-rule and every nested rule. Computed values in Chrome 155 were identical to the source for `main`, `lf` and `fb`. Syntax rewrites, all applied correctly by Chrome 155:

- `& > .p-kid` became `>.p-kid`, and `@media(…){&{word-spacing:3px}}` became `@media(…){word-spacing:3px}`.
- `@media(min-width:1px)and (max-width:99999px)` lost the spaces after `@media` and before `and`; that is valid.
- `@import"imp.css"`.
- `calc(50px - 0px)` became `50px`.

The default charset escapes non-ASCII (gapfill09-03).

### gapfill09-16: regex minifier damage

- `content:"Hi, you: there  {x}; /* y */"` became `content:"Hi,you:there{x};"`. Chrome: `"Hi,you:there{x};"`.
- `content:"\2192  \f1"` became `"\2192 \f1"`. Chrome: `"→ñ"`, so the space was lost.
- Everything else in the main fixture computed identically, including `#wrapper ::selection` (`rgb(1,2,3)`) and `calc(100% - 2rem)` (468px in the 500px box).

### gapfill09-17: `@layer` statement handling

With the statement after `@import`:

- lightningcss removed the `@layer custom-a,custom-b;` statement and reordered the blocks into statement order (a, then b). The layer order and the result (`rgb(0,0,200)`) were unchanged.
- csso and esbuild kept the statement.
- In `src-layerfirst.css`, lightningcss and esbuild kept both the statement and the `@import`.

### gapfill09-18: kept by every tokenizer setting

- Static checks and Chrome agree that every setting kept:
  - `#wrapper ::selection` with its space (Chrome `::selection` background `rgb(1,2,3)`);
  - `calc(100% - 2rem)` (468px);
  - string contents (S3 identical);
  - `@property` (`rotate` `30deg` from the initial value);
  - `@starting-style`, `@supports not (…)`;
  - the data URI (computed `url("data:image/svg+xml,…")` identical);
  - `@media (prefers-reduced-motion:reduce)` (in lightningcss and csso, `#wrapper *::before` became `#wrapper :before` or `#wrapper ::before`, which is equivalent).
- `modern.css`: markers 1–15 all present except m-09 in csso (gapfill09-12). `@view-transition`, `@position-try`, `container-type`, `@scope`, `:has()`, `:is()`, `@supports selector()`, `anchor-name`, `text-box` and `animation-timeline`/`animation-range` were all kept.
- `calc(50px - 0px)`: lightningcss and esbuild gave `50px`; csso kept `calc(50px - 0px)`; none emitted the invalid `calc(50px - 0)`.

### gapfill09-19: browser versions used (MDN BCD 8.1.5, local `data.json` from the support pass)

| Feature | Chrome | Firefox | Safari / iOS |
|---|---|---|---|
| Media query range syntax | 104 | 102 | 16.4 |
| CSS nesting | 120 | 117 | 17.2 |
| `content` alt text (`/ ""`) | 77 | 128 | 17.4 |
| `backdrop-filter` unprefixed | 76 | 103 | 18 (`-webkit-` from 9) |
| `dvh` | 108 | 101 | 15.4 |
| `color-mix()` | 111 | 113 | 16.2 |
| `light-dark()` | 123 | 120 | 17.5 |
| `width: fit-content` | 46 | 94 (`-moz-` from 3) | 11 |
| `width: stretch` | 138 (`-webkit-fill-available` from 22) | only `-webkit-fill-available`, 146 | 27 (`-webkit-fill-available` from 7) |

### Budget sentence for 01, 02, 07 and 09

Until the characters-vs-bytes question is resolved, use this exact sentence in every section:

> Budget: ≤ 5,120 characters and ≤ 5,120 UTF-8 bytes, keeping at least 30 spare.

09 now uses it in the top-ten table, #40, #41 (projects) and the Section notes. 01, 02 and 07 still say "≤ 5,120 characters, with a margin", "about 5 KB" and "about 5,120 characters". Their own gap-fill passes should adopt the sentence.

### Not resolved here

- Firefox and Safari rendering of the outputs. No binary was available; the static diffs above show what each engine would receive.
- cssnano (default preset): not installed, not run.
- `esbuild --target=…` (nesting lowering) and `--bundle` (`@import` inlining): not tested.
- Whether itch's cap counts characters, bytes or UTF-16 units: needs a save on an account (see 09 #40).

## Gap fill for 03-page-anatomy.md (2026-10-14, 14:10–14:35 UTC, round 2)

Three gaps: (1) logged-in and owner markup, (2) thin samples for project-family variants, (3) contradictory "largest observed" CSS sizes. Logged out, GET only, no browser-pane tools. Raw captures stay in the session scratchpad (`…/scratchpad/gapfill-03-r2/raw/`); nothing third-party is copied here.

### Setup

- **Scripts** (own code, stdlib Python 3, run with `python -I`): `knowledge/evidence/gapfill03-tools/`
  - `fetch.sh`: browser UA, `Accept-Language: en-US`, ≥7 s between requests, one 70 s back-off retry on 429, refuses every path in `itch.io/robots.txt` and the subdomain robots (`/*/download/`, `/*/rh/`, `/*/rp/`, `/-/`).
  - `csssize.py`: measures `style#custom_css` (or the jam tail after the first `.view_jam_page .jam_filter_picker .divider{…}` rule) from the **raw bytes**, in four metrics. Prints numbers only.
  - `inventory.py`, `kinds.py`, `ddl.py`: structural census of project-family captures (class names and counts only).
  - `ddl_harness.py`: builds an offline render harness from a captured direct-download page (scripts, external links, `src`/`srcset` and `style#custom_css` removed; `game.css` served locally).
  - Reused: `knowledge/evidence/section03-tools/skel.py` and `matrix2.py`.
- **Fetches** (`list1.txt` … `list4.txt`): 24 GETs logged, of which 2 were HTTP 429 and retried once successfully (14:13:59–14:25:44 UTC). Plus 2 WebFetch reads of itch forum topics. Total: 26 itch requests.
- **Same-day captures by other agents**, re-parsed read-only: every `scratchpad/*/raw/*.html` (923 files). Of these, 169 distinct project main pages, 43 devlog posts, 12 devlog indexes and 5 comments pages are project-family pages.
- **Owner view**: the private repo's June 2026 owner export of a profile (`itch-io-custom-css/preview/itch-io.html`), read-only. It is one account and has been hand-edited (its `custom_css` was rewired to an `@import`, and `csrf_token` values were redacted), so only its tag and class structure is used.
- **Browser**: Chrome 155.0.8059.79, `--headless=new`, throwaway `--user-data-dir`, `--host-resolver-rules="MAP * ~NOTFOUND"` (no network), `--dump-dom`.

Re-run (Git Bash; convert paths with `cygpath -m` for Python):

```bash
T=knowledge/evidence/gapfill03-tools; S=knowledge/evidence/section03-tools; export OUT=/tmp/gf03
for l in $T/list1.txt $T/list2.txt $T/list3.txt $T/list4.txt; do bash $T/fetch.sh $l; done
python -I $T/csssize.py $OUT/raw/sz_*.html
python -I $S/skel.py $OUT/raw/nb_cm_game-70.html 4
python -I $S/matrix2.py "cm=$OUT/raw/nb_cm_*.html" "dp=$OUT/raw/nb_dp_*.html" "di=$OUT/raw/nb_di_*.html" "kind=$OUT/raw/kd_*.html"
python -I $T/kinds.py "$OUT/raw/*.html"      # plus any other same-day captures
python -I $T/ddl.py   "$OUT/raw/*.html"
python -I $T/ddl_harness.py $OUT/raw/kd_book_cookbook.html $OUT/raw/st_gamecss.html $OUT/ddl
chrome --headless=new --user-data-dir=<tmp> --host-resolver-rules="MAP * ~NOTFOUND" \
  --window-size=1017,900 --virtual-time-budget=2000 --dump-dom file:///$OUT/ddl/ddl-base.html | grep PROBE
```

Do not run `chrome.exe --version` on Windows: it opens a normal browser window with the default profile instead of printing a version (this happened once in this run; the process was killed at once, nothing was navigated).

### gapfill03-01: one size figure per page type, with its metric (gap 3)

`csssize.py` on fresh fetches (14:13–14:15 UTC), cross-checked against the same-day captures of the corpus, crawlproject, crawljam and community passes. All of them gave identical numbers.

| Page type | Largest seen | Served bytes | Code points as served (CRLF = 2) | Code points, CRLF→LF | Notes | Samples that contain it |
|---|---|---:|---:|---:|---|---|
| Profile | pizzadoggy.itch.io | 5,116 | 5,116 | 5,116 | 234 LF, ASCII | corpus (13 profiles with CSS), crawlprofile (9 of 51) |
| Project | creator-79.itch.io/game-46 | **93,948** | 93,898 | **93,105** | 793 CRLF; 69,436 chars in `data:` URIs (69,362 `image/png`, 74 `image/svg+xml`); 50 non-ASCII | crawlproject (39 pages with CSS) only |
| Project, 2nd | creator-88.itch.io/game-54 | 38,576 | 38,560 | 37,874 | 686 CRLF; 8 non-ASCII | corpus (26 projects with CSS) |
| Jam | itch.io/jam/gamelike-jam-010 | 20,411 | 20,411 | 20,411 | **20,410 host chars** + the 1 space itch appends; 864 LF; ASCII | crawljam (11 jams with CSS), community |
| Jam, 2nd | itch.io/jam/20-second-game-jam-2026 | 20,205 | 20,203 | 20,203 | 20,202 host chars + the space; 0 newlines | corpus (23 jams) |

Why the sections disagreed:
- They measured **different pages**. game-46 is not in the corpus sample, and gamelike-jam-010 is not in the corpus jam sample.
- They used **different metrics**:
  - `crawlproject-tools/cssstats.py` opens the file in Python text mode, which turns CRLF into LF, so its "chars" are CRLF→LF code points (93,105).
  - `corpus-stats.csv` reports `bytes` and `chars` as served (CRLF = 2), plus `chars_lf_norm`.
  - The corpus jam figure (20,203) includes itch's appended space. crawljam's 20,410 excludes it.
- **Canonical wording:** "largest seen: profile 5,116 chars; project 93,105 chars CRLF-normalised (93,948 B served), of which 69,436 are `data:` URIs; jam 20,410 chars of host CSS (20,411 with itch's trailing space)". Samples: profile n=13+9, project n=26+39 pages with CSS, jam n=23+11. All re-measured on 2026-10-14.

### gapfill03-02: build query moved again, content unchanged

Pages fetched at 14:20Z link `game.css?1791985261` and `game.min.js?1791985261`. `game.css?1791985261` is 164,629 B with md5 `c97fee7bcbb8a66f1ddcb662f3f44f19` and `Last-Modified: Tue, 06 Oct 2026 21:47:49 GMT`. That is byte-identical to the `?1791970861` and `?1791981660` copies.

### gapfill03-03: bannerless comments pages and devlog indexes keep `#header` (gap 2)

`skel.py` and `matrix2.py` on 5 fresh comments pages of bannerless projects (game-14, game-70, game-46, game-44, game-41). Also on 5 bannerless devlog indexes: 2 fresh (game-14, game-44) plus 3 earlier same-day captures (game-06, game-35, game-70).

| Group | `#header` | Its content | `h1.game_title` | `.user_formatted` |
|---|---|---|---|---|
| Comments, no banner | 5/5 | `div#header.header > h1.game_title`: no `a`, no `img` | 5/5 | 5/5 (comment bodies, median 63) |
| Devlog index, no banner | 5/5 | `div#header.header > h1.game_title`: no `a`, no `img` | 5/5 | 0/5 |
| For comparison: bannered comments (5 captures, 2 projects) | 5/5 | `div#header.header.align_center.has_image > a > img` + `h1.game_title` | | |

- On these pages the way back to the project is `p.breadcrumbs > a`, the first child of the page widget.
- `body.embedded_game` is on the main page of all 4 HTML5 projects in this set (game-14, game-70, game-46, game-41), but on **0 of their 7** fresh comments, index and post pages. So `.embedded_game:not(.embed_disabled) .header .game_title{display:none}` does not apply there, and the title `h1` is **shown** on `/devlog` and `/comments` while it is hidden on the main page.

### gapfill03-04: bannerless devlog posts have no `#header` and no `.game_title` (gap 2)

There are 7 posts of bannerless projects. 2 are fresh (game-46, game-41); 5 are same-day captures (game-06, game-35, game-14, game-70, game-44). The main page of each of those projects has `#header` without `.has_image`.

- **No `#header`:** 7/7 have no `#header` and no `.header`. `#inner_column` has 2 children: the post widget and `#view_game_footer`.
- **No `.game_title`:** `.game_title` matches 0/7, so `#wrapper .game_title` styles nothing there.
- **One `h1`:** `h1` inside `#wrapper` has a median of 1, which is the post title in `section.post_header`.
- **Matches with bannered posts:** `.game_info_panel_widget` 7/7, `.upload_list_widget` 5/7, `.game_comments_widget` 6/7, `.button` 7/7. These are the same leaks as on bannered posts.
- **Larger census:** across all 45 same-day post captures (files, including duplicates), 13 have no `#header`, and the 32 others all have `.has_image`. No post with `#header` lacked a banner.

### gapfill03-05: header alignment has a third value

`inventory.py` over all same-day captures (file counts, not distinct projects):

| Page type | `#header` classes |
|---|---|
| Main page | `align_center has_image` 99, `align_left has_image` 15, bare 50 |
| Devlog post | `align_center has_image` 30, `align_left has_image` 1, **`align_right has_image` 1**, none 13 |

`.align_right` was seen on one bannered devlog post.

### gapfill03-06: classification does not change the skeleton (gap 2)

`kinds.py` read the first `itch.io/<kind>` link in `#view_game_footer .breadcrumbs` of 169 distinct project main pages (same-day captures plus 5 fresh comics and books).

| Kind | Pages | Top-of-widget sequences seen |
|---|---:|---|
| games | 126 | all 7 listed in 03 §6.4 |
| tools | 16 | `.header_buy_row > .columns`; `.html_embed_widget [> .donate] > .columns` |
| game-assets | 9 | `.header_buy_row > .columns` 8; HTML5 1 |
| physical-games | 7 | `.header_buy_row > .columns` 7 (all `buy_on_top`) |
| comics | 4 | HTML5 3 (one with `direct_download`, one `start_maximized`); downloadable `buy_on_top` 1 |
| books | 3 | `.header_buy_row > .columns`: `direct_download` 2, `buy_on_top` 1 |
| misc | 4 | HTML5 3; `direct_download` 1 |

- **Shared skeleton:** 169/169 pages have `#inner_column` = `#header` + page widget + `#view_game_footer`.
- **No kind class:** no classification-specific class appears on `#wrapper`, `#inner_column` or the page widget. The sequence is set only by the HTML5 embed and by `.buy_on_top` / `.direct_download`.
- **Web comics are HTML5 embeds.** They use `view_html_game_page` and `.game_frame`. PDF comics and books are ordinary downloadable pages.
- **"Big video" layout:** still seen on **one** project only (2 captures of the same page). No new instance was found within budget.

### gapfill03-07: direct-download pages (gap 2)

`ddl.py` over 22 distinct `.view_game_page.direct_download` pages (books, tools, games, comics):

| Variant | Pages | `.header_buy_row` | `.buy_row` | Download buttons |
|---|---:|---|---|---|
| Downloadable | 17 | 17/17: `p + div.direct_download_row > button.button.direct_download_btn[type=button]` | 0/17 | `button.direct_download_btn` + one `a.button.download_btn[data-upload_id]` per file in `.uploads` |
| HTML5 + `.direct_download` | 5 | **0/5** (absent) | 0/5 | `a.button.download_btn` per file only |

### gapfill03-08: render test of `.header_buy_row` on a direct-download page (gap 2)

Harness: a fresh direct-download book page (`kd_book_cookbook.html`) with its own `game_theme` and the live `game.css` (gapfill03-02). `style#custom_css` was removed so only itch's CSS applies.

| Variant | window → `innerWidth` | `.header_buy_row` display | `button.direct_download_btn` rendered |
|---|---|---|---|
| itch CSS only | 1280 → 1264 | `none` | no |
| itch CSS only | 1017 → 1001 | `none` | no |
| itch CSS only | 1016 → 1000 | `block` | yes |
| + `#wrapper .view_game_page.direct_download .header_buy_row{display:block}` | 1280 → 1264 | `block` | yes |

- `.uploads .download_btn` rendered at every width (1 button).
- The breakpoint is exactly `max-width:1000px`.
- The candidate rule works at desktop width. This upgrades crawlproject-65 from inferred to verified.

### gapfill03-09: a missing project slug also lies about its page name

`https://leafo.itch.io/gapfill-nonexistent-project-404` returned HTTP **404** with `body[data-page_name=view_game]`. The page has `main.css` only, body children `div#header_N.header_widget` + `div.main` + `div.footer`, and **no `#wrapper`**. Together with S03-N8 (404 jam = `view_jam`) and crawlprofile-52 (404 subdomain = `user`): check the status and `#wrapper`, never the page name.

### gapfill03-10: custom domains (gap 2)

- **itch staff (leafo, forum topics `itch.io/t/179127` and `itch.io/t/185718`, both opened January 2018, read via WebFetch):** custom domains are not supported, because of per-domain HTTPS certificates and cross-domain login. The suggested workaround is a plain 301/302 redirect to the `*.itch.io` page; a free HTTPS proxy was mentioned as a possible route.
- **Web search (2026-10-14):** no later announcement and no documented custom-domain feature.
- **Captures:** 844/844 captured `<body>` tags that carry `data-host` say `data-host="itch.io"`.
- **Consequence:** creator CSS is served only on `*.itch.io` (and `itch.io/jam/…`). A redirecting domain lands there. No creator page served from another host was found.

### gapfill03-11: owner view of a profile (gap 1; one export, June 2026)

- **Body children:** `div#user_profile_header_N.user_profile_header_widget.header_widget.base_widget.gray.small_logo`, then `div.theme_editor_columns > div#user_theme_editor_N + div.theme_editor_primary_column > div#wrapper`. There is **no `ul#user_tools`** (0 matches), and `body` adds `.has_header`.
- **Header widget:**
  - `a.skip_to_main`;
  - `.primary_header > h1.title > a.header_logo`;
  - `.header_buttons > a.dashboard_btn`;
  - `div.header_buttons.owner_tools > a.profile_btn + button.tool_button.edit_theme_btn`;
  - `div#user_panel_N.user_panel_widget.logged_in`, with avatar, notifications and a drop menu that holds `form.theme_toggle_form > input[type=hidden][name=csrf_token]`.
- **Inside `#wrapper`:** the export has **no class** that is absent from 59 logged-out profile captures. But it has:
  - **3 elements with inline `style="display: none"`**: 1 `.game_cell` in `.user_game_grid` and 2 `.collection_row`s (vs **0/59** logged-out captures with any inline `display:none` inside `#wrapper`);
  - `section.purchased_games` although `.user_page` lacks `.mode_show_purchases`. `user.css` hides it with `.user_page:not(.mode_show_purchases) .purchased_games{display:none}`. Logged out, the section is absent without that class on 47/47 (S03-N6).
- **Interpretation [inferred]:** the owner view pre-renders items that visitors don't get (hidden projects and collections, the "Supported by" section), so the theme editor can toggle them.
- **Same account logged out today:** 5 cells in the own grid, and no purchases or collections sections. The dates differ, so this is not a controlled diff.

### gapfill03-12: owner and editor rules in itch's own stylesheets (gap 1)

From `user.css` and `game.css` as served today (same md5 as earlier passes):

**`user.css`:**
- `.theme_editor_columns{display:flex}` and `.theme_editor_columns>.theme_editor_primary_column{flex:1;min-width:0}`.
- `.theme_editor_open .theme_editor_columns{height:calc(100vh - 50px)}` and `.theme_editor_open .theme_editor_columns .theme_editor_primary_column{overflow:auto}`.
- `.has_header .user_tools{top:50px}`.

**`game.css`:**
- `.game_page_apperance_columns{display:flex}` (sic) and `.game_page_apperance_columns>.game_page_primary_column{flex:1}`.
- `.theme_editor_open .game_page_apperance_columns{height:calc(100vh - 50px)}` and `… .game_page_primary_column{overflow:auto}`.
- `.theme_editor_open .user_tools`, `.theme_editor_open .above_game_banner`, `.theme_editor_open .game_layout_widget .goal_banner_widget` and `.theme_editor_open .admin_tag_editor_widget` → `display:none`.
- `.game_header_widget{position:relative;z-index:3}`, plus `.game_header_widget .publish_status .pub_toggle(.published|.private|.restricted)` and `.theme_editor_open .game_header_widget .edit_theme_btn`.
- `.header_widget .owner_tools{…}`, hidden at ≤800px.
- `@media (min-width:650px){.has_site_header .user_tools{top:50px}}`.

**Inferences [inferred, not observed]:**
- In the project editor, `#wrapper` sits inside `.game_page_apperance_columns > .game_page_primary_column`.
- With the editor panel open, the page scrolls inside that column, not the document. Scroll-linked effects that name the root scroller won't move there, and `100vh` is taller than the visible column by the 50px header.
- The owner sees a `div.game_header_widget` (publish status, Edit theme) before `#wrapper` on project pages.

### gapfill03-13: the logged-in comment form is client-rendered (gap 1)

**From `game.min.js?1791985261`** (React components, class names only):
- `form.form.post_form`. Closed, it holds `input.click_input[type=text]` with a "write your comment" placeholder. Open, it holds:
  - a markdown-input component (styled as `.forms_markdown_input_widget` in `game.css`) with a `.markdown_toolbar` of `li > button[type=button][tabindex=-1]` items (Markdown help, bold, …);
  - `textarea.markdown_textarea[name]`;
  - a `.buttons` row with the submit button.
- A `CSRF` component renders `input[type=hidden][name=csrf_token]` from `meta[name=csrf_token]`. That meta tag is also present logged out.
- Reply forms add `.inline_reply`, and edit forms (`PostEditForm`) add `.inline_edit`.

**From `game.css`:**
- `.game_comments_widget .post_form{max-width:600px}`;
- `.game_comments_widget .post_form .forms_markdown_input_widget .markdown_toolbar{height:30px}`;
- `.forms_markdown_input_widget .markdown_toolbar{list-style:none;display:flex;…;height:32px}`;
- `.forms_markdown_input_widget>textarea.markdown_textarea{…font-family:monospace;min-height:160px;resize:vertical;width:100%}`, with `font-size:14px` under `.game_comments_widget .post_form`;
- toolbar buttons `color:var(--itchio_body_color_light)`, hover background `var(--itchio_button_color, #FF2449)`;
- `.community_post_list_widget .post_form.inline_reply{margin:20px 0 0 0}`;
- a legacy `.redactor-box` editor is also styled.

**Logged out**, the server renders `p.form_placeholder` in that slot (crawlproject-15). The form therefore appears inside `.game_comments_widget`, inside `#wrapper`, only for logged-in visitors and only after JS. **[inferred]** It was never observed rendered.

### gapfill03-14: `.game_cell_tools` and `.dark_theme` (gap 1)

**`.game_cell_tools`:**
- Absent from 59/59 logged-out profile captures and from the owner export.
- On logged-out **browse** pages it is in every cell: 36/36 on each of 17 browse captures, as `div.game_cell_tools > a.action_btn.add_to_collection_btn`, inside `.game_thumb`.
- `user.css` and `game.css` style it: `.game_grid_widget .game_cell .game_cell_tools{position:absolute;top:5px;right:10px;opacity:0;transition:…}`, `.game_cell:hover .game_cell_tools{top:10px;opacity:1}`, hidden at ≤650px.
- Whether logged-in visitors get it on profile cards: **unverified**.

**`.dark_theme`:**
- 0 of 839 logged-out page captures with a `body` page name carry it.
- Creator pages carry `body.no_theme_toggle`: user 178/182, view_game 211/213, view_jam 166/169, devlog and comments 72/72. Non-creator pages never do.
- `main.css` hides `.no_theme_toggle .user_panel_widget .drop_menu_wrap .theme_toggle_form`.
- `game.css` has `body.dark_theme{background:#1b1b1b}` plus 49 other `.dark_theme` rules; `user.css` has 30 and `jam.css` 23.
- Whether a logged-in dark-mode visitor gets `body.dark_theme` on creator pages: **unverified**.

### Section 03 edits

- §1 rule 1 (owner wrappers per page type), table 5 (owner and logged-in rows), the editor note under `#user_tools`, and a new rule 6 (logged-in UI inside `#wrapper`) (gapfill03-11 … -14).
- §2: 404 project row, and the custom-domain note (gapfill03-09, -10).
- §3 size context: one figure per type, with its metric and samples (gapfill03-01).
- §5.4 "Owner vs visitor": hidden pre-rendered items and the `:nth-child` caveat (gapfill03-11).
- §6.3 and §6.4: `.align_right`; direct-download verified, plus the HTML5 variant (gapfill03-05, -07, -08).
- New §6.8: classifications (gapfill03-06).
- §7.1 table, §7.2 rules and §10.1 footnote: bannerless comments, index and posts (gapfill03-03, -04).
- §9: the 1000/1001px render boundary (gapfill03-08).
- New §11: what logged-in and owner views add, with probes (gapfill03-11 … -14).
- Section notes: a gapfill03 pointer, plus conflict 9 (size figures).
- Header line: the third build query.

### Follow-ups for other section owners (not edited here)

- **01 §3 and 09 #41:** use gapfill03-01's wording. The project figure is "93,105 chars CRLF-normalised (93,948 B served)", not "93,105 chars". The jam figure is "20,410 host chars (20,411 with itch's trailing space)". 03 §3 now states both with samples.
- **04 §9.1:** add the owner and editor wrappers (`.theme_editor_columns`, `.game_page_apperance_columns`), the `.theme_editor_open` scroll container and the comment-form classes (gapfill03-12, -13).

### Still open (needs an account; not testable logged out)

1. A logged-in **non-owner** visitor's view of a profile, a project page, a devlog post and the comments page:
   - Does `#user_tools` stay?
   - Does a site header (`.has_header` / `.has_site_header`) appear?
   - Does `.game_cell_tools` appear on profile cards?
   - Does the comment form render with the classes above?
   - Does `body.dark_theme` appear for a dark-mode account?
2. The **owner's view of a project page and a devlog post**: is there a `.game_page_apperance_columns` wrapper, and where is `.game_header_widget`?
3. A current (October 2026) owner export of a profile, to confirm the inline-hidden cells and rows and the pre-rendered `section.purchased_games`.

**Probe:** in a browser, use "Save page as… → Webpage, HTML only" (no login data is needed in the file). Then run `skel.py <file> 9`, `matrix2.py` against the logged-out captures, `headseq.py`, and `grep -c 'style="display: none"'`. Redact `csrf_token` values before sharing.

## Gap fill for 01-how-it-works.md (2026-10-14, 14:13–14:45 UTC, retry)

Two gaps: (1) the size cap was unmeasured and overstated (unit, project/devlog cap, over-cap behaviour, jam unit); (2) jam knowledge was thin (how a host opens the editor, what the 20 KB cap counts, CRLF, owner-view wrappers, jam focus order and accessibility, `.itch_footer`). Logged out, GET only, no browser-pane tools. Raw captures stay in the session scratchpad (`…/scratchpad/gapfill-01r/raw/`); nothing third-party is copied here, and no creator names from entry grids are recorded.

### Setup

- **Requests.** 15 itch GETs, all HTTP 200, 0 × 429 (14:13:56–14:19:28 UTC, ≥3 s apart; log `gapfill-01r/requests.log`):
  `itch.io/robots.txt`, `creator-88.itch.io/robots.txt`; project pages `creator-88.itch.io/game-54`, `creator-88.itch.io/game-55`, `creator-96.itch.io/game-69`; `itch.io/docs/creators/css-guide`; `itch.io/t/6429680/jam-theme-editor-revamp`; `itch.io/blog/1572473/…jam-theme-editor…`; jam overviews `itch.io/jam/gamelike-jam-010`, `/gdevelop-big-game-jam-10`, `/tuesday-the-13th-jam`; `static.itch.io/{lib.min.js,bundle.min.js,jam.min.js,jam.css}?1791985261`. Plus 1 WebFetch of a user blog post (`itch.io/blog/950966`). No path is under a robots `Disallow`.
- **GitHub** (`gh api`, ~25 calls): commit lists and file contents per commit for `creator-88/game-54:docs/itch/theme.css`, `creator-88/game-55:docs/itch/theme.min.css`, `creator-96/itch.io_Pages:game-69/game-69_theme.css` (+ commit lists for other corpus sources); `leafo/lapis` files `lapis/validate/types.moon`, `lapis/util/utf8.moon`, `lapis/validate.moon`.
- **Read-only local sources:** `scratchpad/gapfill-01/raw/theme_editor.min.js` (sha1 `ac0b3eadd20e`, same bytes as 4 other same-day copies), my fresh `jam.min.js` (sha1 `5ad8b70c1c66`) and `bundle.min.js` (sha1 `ed585183d86b`), both byte-identical to earlier same-day copies; `scratchpad/itchcss-v2/raw/theme_editor.css` (Last-Modified 2026-08-25); `scratchpad/a11y-verify/raw/{user,game}.css`; the private repo's owner export `itch-io-custom-css/preview/itch-io.html` (tag/class structure only); `scratchpad/corpus/raw/j_*.html` (122 same-day jam captures, 23 with host CSS).
- **Browser:** headless Chrome 155.0.8059.79, `--headless=new --remote-debugging-port=9612 --user-data-dir=<scratch>/chrome-prof`, driven by `a11y-tests/cdp.mjs` with `CDP_BLOCK_ITCH=1` (no itch request from any harness load).
- **Tools** (own code): `knowledge/evidence/gapfill01-tools/` (see its `README.txt`).

Re-run (Git Bash):

```bash
T=knowledge/evidence/gapfill01-tools; export OUTDIR=/tmp/gf01
bash $T/fetch.sh https://creator-88.itch.io/game-54 game-54.html      # etc., one call per URL above
for sha in $(gh api -X GET repos/creator-88/game-54/commits -f path=docs/itch/theme.css --jq '.[].sha'); do
  gh api -H "Accept: application/vnd.github.raw" "repos/creator-88/game-54/contents/docs/itch/theme.css?ref=$sha" > $OUTDIR/od_$sha.css; done
python -I $T/blockstats.py $OUTDIR/raw/*.html
python -I $T/matchsrc.py $OUTDIR/raw/game-54.html $OUTDIR/od_*.css
python -I $T/jamsplit.py $OUTDIR/raw/jam_*.html
python -I $T/jsharness.py $OUTDIR/raw/jam_gamelike010.html $OUTDIR/h/jam_gamelike010.html   # + copy lib/bundle/jam .min.js and jam.css into $OUTDIR/h
CDP_PORT=9612 CDP_BLOCK_ITCH=1 node $T/jamfocus.mjs file:///$OUTDIR/h/jam_gamelike010.html out.json 500 1280
python -I $T/focussum.py out.json
CDP_PORT=9612 node $T/newline.mjs file:///<abs>/gapfill01-tools/newline-test.html      # needs lib.min.js next to the html
```

### gapfill01-01: project pages accepted saves far above 5,120 in 2026 (gap 1)

Method: diff the live `style#custom_css` against every git version of its public source (`matchsrc.py`: CRLF→LF on both sides, trailing whitespace trimmed). A live block equal to commit *N* and different from commit *N−1* was saved after the text of *N* existed.

| Live page | Live `custom_css` | Matching commit | Previous commit |
|---|---|---|---|
| `creator-88.itch.io/game-54` | 38,576 B · 38,560 chars · 686 CRLF · 37,874 chars after CRLF→LF | `c42aa70a5d` 2026-08-13T22:57Z (37,891 B, 687 LF) **equal** | `a039008cde` 2026-08-03 (35,741 B) differs after 1,718 chars; `177bcf740b` 2026-07-29 (5,000 B) differs |
| `creator-88.itch.io/game-55` | 10,586 B · single line | `2223098743` 2026-09-15T20:02Z (10,587 B, 1 final LF) **equal** | only commit |
| `creator-96.itch.io/game-69` | 5,634 B · 5,631 chars · 187 CRLF · 5,444 after CRLF→LF | `13d676d9d7` 2026-03-10T21:33Z (5,447 B) **equal** | `b4aef3ac76` 2026-03-10T21:30Z differs |

Result: a 38,560-character (38,576-byte, CRLF-counted) project CSS was saved after 2026-08-03, two months after a jam host claimed on 2026-06-02 that 5,120 was "consistent with profile and project pages". Any project cap is therefore ≥ 38,576 bytes, or there is none. Confidence **inferred** (the save time is bounded by git history, not observed). Devlog posts, the devlog index and the comments page have no editor of their own (they reuse the project CSS), so this covers them too.

### gapfill01-02: newline transport explains LF vs CRLF, and how line breaks would count (gaps 1, 2)

Source read (`theme_editor.min.js`):
- `Profile` and `JamEdit` editors save with `$.ajax({data: I.with_csrf({theme: JSON.stringify(state.theme)})})`; the CSS comes from the textarea's `.value`.
- `GameEdit` (project) saves with `I.remote_submit($(form))`; `bundle.min.js` shows `remote_submit` calls `t.serializeArray()`.
- `lib.min.js` is jQuery **3.6.0**; its `serializeArray` maps values through `Et=/\r?\n/g` → `"\r\n"`.

Test (`newline.mjs`, itch's own `lib.min.js`): `Input.insertText` of `a{color:red}␍␊b{color:blue}␊c{}` into the textarea gives `.value` = 30 chars with **0 CR, 2 LF**; `JSON.stringify` keeps 0 CR / 2 LF; `serializeArray` gives 32 chars with **2 CR, 2 LF**, and `$.param` carries `%0D%0A`. Setting `.value` with CRLF also reads back LF only.

So the server receives LF from profile and jam editors and CRLF from the project editor, which is exactly what is stored (corpus-03). If the server measures the string it receives, each line break costs 1 on profiles and jams and 2 on projects (**inferred**).

### gapfill01-03: what the jam "20kb" cap counts (gap 2)

`jamsplit.py` on the fresh `gamelike-jam-010` overview: `style#jam_theme` 22,315 chars = **1,904 generated + 20,410 host + 1 appended space**; host CSS is ASCII, **864 LF, 0 CR**, 0 leading whitespace, braces 108/108, last char `}`. Thread `/t/6429680` (re-read, 10 posts, last 2026-06-09): the host was at "around 30kb" on 06-03 and reported cutting it to "a few hundred shy of the new limit" on 06-09, so this text was saved after the cap was set.
- The cap applies to the host's `css` field only: the whole block (22,315) is above 20,480 (**inferred**). The theme JSON keeps `css` as its own key; the generated rules come from a template at render time (`JamEdit.render_to_css` → `css_template(…custom_css…)`).
- The cap is ≥ 20,410 stored characters (= bytes here), so it is not 20,000 in either unit; 20,480 (20 KiB) fits (**inferred**). Counted with CRLF the text would be 21,274, above 20,480, which is consistent with the LF-only transport of gapfill01-02.
- Second-largest: `20-second-game-jam-2026`, 20,202 host chars, single line (same-day corpus capture).
- `jamsplit.py` over the 122 same-day corpus jam captures (`scratchpad/corpus/raw/j_*.html`), one file per call: **23** have host CSS. **0/23** start with whitespace. **2/23** store CRLF (`godot-wild-jam-98` 14 CR, `ostcompjam` 28 CR); the other 21 are LF-only. Adding the fresh gamelike-jam-010 gives 0 of 24 with leading whitespace.

### gapfill01-04: guide, revamp thread and changelog re-read (gaps 1, 2)

- Guide (`css-guide`, 9,373 chars of text): still no size limit (0 hits for `5120`, `5,120`, `KB`, `character`, `maximum`; "limit" appears only in the site nav). Jam layout lists `#wrapper`/`.jam_page_wrap`, `.view_jam_page`, `.jam_banner_outer`/`.jam_banner`, `.jam_body`, `#entries`, theme variables, and "Considerations" (scope to `#wrapper`, background on `#wrapper`, prefer variables, test responsive, test logged out because an editable jam "wraps the content in extra editor elements"). **No footer item** in the jam layout; "do not hide these links" appears only under `.footer` in the project layout. The access request asks you to confirm you "will not alter itch.io's built in UI".
- Thread `/t/6429680`: unchanged since 2026-06-09 (10 posts). leafo 06-02: "Previously there was no limit, but we'll need one going forward. For jams I updated it to 20kb". Earlier the same day the host wrote that hosts "may not even realize they're over that limit until they try making an update" (an expectation, not an observed error). leafo 06-01 post 2 documents the owner-view wrappers (`.theme_editor_columns` > sidebar + `.theme_editor_primary_column` > `.jam_page_wrap`) and that custom CSS is "appended verbatim to the end of the jam's generated theme stylesheet, unscoped (global)".
- Changelog `/blog/1572473` (2026-07-02): restates the revamp; no cap figure.
- Web search (2 queries) found no published over-cap error text; the only hits were community posts repeating "5120 characters" for profiles (e.g. `itch.io/blog/950966`, a user post from 2025-05-23).

### gapfill01-05: client-side length check and error path (gap 1)

- No length check anywhere client-side: `CssEditor` renders `textarea({name, value, onChange})` with no `maxLength`; `theme_editor.min.js`, `jam.min.js` and `bundle.min.js` contain no `5120`, `20480`, `maxLength` or "too long" near the CSS field (the only `maxLength` in `jam.min.js` is a 2048-char report form).
- Save errors: on a 2xx response with `errors`, all three editors open an error lightbox with the server's messages and the sub-text "Your changes were not saved, please try again"; on an HTTP error they show "Server error". A silently truncating server would produce no message.
- No live block ends at a cap boundary: largest profile 5,116, largest jam host 20,410 with balanced braces. Truncation is not observed, but nothing here proves rejection either.

### gapfill01-06: a server-side hypothesis from leafo's open-source framework (gap 1; unverified)

itch's server is closed, but it runs on leafo's Lapis, and itch's open-source forum module (`lapis-community`, same-day copy in `scratchpad/sanitizer/src/`) validates text with `types.limited_text(N)`.
- `limited_text` (`lapis/validate/types.moon` l.360–367): `trimmed_text` (valid UTF-8, printable chars plus `\r\n\t`, trimmed at **both** ends) and then `string_length` (`lapis/util/utf8.moon`) ≤ N. That counts **code points**, so `\r` and `\n` count 1 each. Its description is "text between 1 and N characters".
- The legacy `validate.moon` `max_length` uses `#tostring(input)`, i.e. **UTF-8 bytes**, with the message "%s must be at most N chars".

If itch uses either idiom for theme CSS: the unit is code points or UTF-8 bytes (never UTF-16 units), CRLF counts 2, and leading whitespace is trimmed too. **Unverified.** It is only consistent with the observed trailing trim (corpus-04) and with 0 of 24 jam host blocks (23 same-day corpus captures + gamelike-jam-010) starting with whitespace.

### gapfill01-07: how the editor opens on each page type (gap 2)

- Profile (owner export, read-only): `div.user_profile_header_widget.header_widget … div.header_buttons.owner_tools` > `a.header_button.profile_btn` "Edit profile" + **`button.tool_button.edit_theme_btn`** (`span.icon-brush`) with the text **"Edit theme"**.
- `bundle.min.js`: the `GameHeader` and `UserProfileHeader` widgets bind `click` on `.edit_theme_btn` to `toggle_theme_editor()`, and call it on load when `location.hash` matches `/\bedit_theme\b/`.
- `jam.min.js` (`ViewJam…setup_admin`): a body-level click on any **`.edit_theme_btn`** toggles `I.theme_editor.state.open` and `body.theme_editor_open`; a hash matching `/\bedit_theme\b/` opens it on load. The editor is mounted only by `init_JamThemeEditor` → `JamEdit.ThemeEditor` (initial `open:false`), which is absent from 3/3 logged-out overviews (0 `init_JamThemeEditor`, 0 `.edit_theme_btn`, 0 `.theme_editor_columns`).
- `JamEdit` panel groups (source): **Color** (BG, BG 2, Text, Link; "More options…": Headers, Button) · **Text** (Font, Size 75–175 %; "More options…": Header font) · **Layout** (Corners 0–30, BG 2 opacity 0–100, Shadow None/Subtle/Soft/Floating/Hard/Glow/Outline) · **Images** (Banner fixed/full width, Background) · **Misc** (Custom CSS, only when `can_use_css`) · Save · "Copy theme" / "Paste theme...". Copy puts `{format:"itchio_theme",version:1,source:"jam",theme:{…13 keys incl. css}}` on the clipboard, so a pasted theme replaces the Custom CSS too; images are not copied.
- The jam host's button label was not observed (needs a logged-in host view).

### gapfill01-08: why "Edit theme" disappears in narrow windows (gap 2)

`user.css`, `game.css` and `jam.css` all contain `@media (max-width:980px){.header_widget .owner_tools .tool_button{display:none}}` and `@media (max-width:800px){.header_widget .owner_tools{display:none}}`; the "Manage:" label (`.owner_tools:before`) shows only at ≥1150px. `theme_editor.css` turns `.theme_editor_widget` into an absolute overlay below 650px (`top:50px`), so the editor itself is built to open on phones. Together: the button is hidden ≤980px, but the `#edit_theme` hash path does not depend on it (**inferred**; untested live).

### gapfill01-09: the documented owner-view wrappers change the scroll container (gap 2)

`ownerview.mjs` wraps `#wrapper` in the documented `.theme_editor_columns > (sidebar + .theme_editor_primary_column)` on the gdevelop harness, with itch's real `jam.css`:

| State | `body > #wrapper` | `#wrapper` | document scrollHeight | primary column |
|---|---|---|---|---|
| visitor | 1 | 1 | 4,952 | — |
| owner, editor open (`body.theme_editor_open`) | **0** | 1 | **900 (= viewport)** | `overflow-y:auto`, 850 px tall (`calc(100vh - 50px)`), scrollHeight 4,902 |
| owner, editor closed | 0 | 1 | 4,952 | `overflow-y:visible` |

With the editor open the page scrolls inside the column, not the window, so window-scroll effects (`background-attachment:fixed`, `position:sticky`, scroll-driven animations) can differ from what visitors see.

### gapfill01-10: jam overview focus order, JS enabled (gap 2)

`jsharness.py` keeps every script and serves `lib/bundle/jam .min.js` + `jam.css` locally; `CDP_BLOCK_ITCH=1` blocks images. `jamfocus.mjs` presses Tab until focus wraps (1280×900, logged out). Iframe rows are Tab stops *inside* embedded players (YouTube); they are counted under the region of the iframe.

| Jam (fresh capture) | `#entries` | Host CSS | Stops | Region order (stops) |
|---|---|---|---:|---|
| gdevelop-big-game-jam-10 | no | 1,806 | 47 | site header 11 → jam header 5 → submitter 1 → description 30 (18 in iframes) |
| gamelike-jam-010 | yes, 24 entries | 20,410 | 135 | site header 11 → jam header 6 → submitter 1 → description 44 (42 in iframes) → entries 72 → `.itch_footer` 1 |
| gamelike-jam-010, host CSS removed (control) | yes | 0 | 143 | site header 11 → jam header **9** → submitter 1 → description 49 → entries 72 → `.itch_footer` 1 |
| tuesday-the-13th-jam | yes, 19 entries | 0 | 80 | site header 11 → jam header 8 → description 3 → entries 57 → `.itch_footer` 1 |

- Site header (outside `#wrapper`, 11 stops): "Skip to main content", logo, 5 nav links, search input + button, Log in, Register. Ring `auto 1px` white.
- Each entry gives 3 stops: "Add to collection" (`a.action_btn` in `.game_cell_tools`), title link, author link. The thumbnail link `a.thumb_link.game_link` has `tabindex="-1"`.
- The page has no `.footer` (0/3 overviews), no `main`/`[role=main]`.

### gapfill01-11: skip link (gap 2)

Served HTML: `a.skip_to_main[href="#maincontent"]`, and no element with that id on 3/3 overviews. With JS the href becomes `#view_jam_<id>` and the target exists (3/3). A script-free harness therefore shows a broken skip link that real visitors don't have.

### gapfill01-12: invisible focus stops in itch's own entry grid, and a fix (gap 2)

`.game_grid_widget .game_cell .game_cell_tools{opacity:0}` is revealed only by `.game_cell:hover` (jam.css). Focused by keyboard, "Add to collection" stays at opacity 0: **24/24** (gamelike) and **19/19** (tuesday) entries; `.game_cell` matches `:focus-within`. Appending `#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}` after the host CSS (`fixprobe.mjs`, 260 ms wait for itch's 0.2 s transition) leaves **0** invisible stops on both jams. `.user_formatted .spoiler:focus{outline:0}` also makes focusable spoiler spans ring-less (2 on tuesday).

### gapfill01-13: focus rings on jams (gap 2)

- itch's default ring inside `#wrapper` is `outline: auto 1px #361275` (`:focus{outline-color:var(--itchio_input_focus_color)}`, `:root` value `#361275`). WCAG contrast of `#361275` vs. the dark host panels: **1.29** (gdevelop `#20004b`) and **1.27** (gamelike `#210845`); 14.0 on white. Chrome's `auto` ring adds a white outer edge, so it is not fully invisible (a11y evidence).
- `#wrapper{--itchio_input_focus_color:#ffc857}` appended (`varprobe.mjs`, focus emulation on) recolors description links and entry-title links to `rgb(255,200,87)`. It does **not** recolor `.button` (Join jam stays `#361275`: `.button:focus{outline-color:#361275}` is hardcoded) or the header tabs.
- Host CSS can remove rings: gamelike's host CSS has 1 `outline:none !important` (and 220 `!important` in total). With it, **7 stops** (6 jam-header links/tabs + the submitter link) have `outline-style:none` and no box-shadow; without it, all 10 have a ring. A generic `#wrapper a:focus-visible,…{outline:2px solid #ffc857;outline-offset:2px}` appended afterwards does **not** restore them (no `!important`). On tuesday (no host CSS) the same rule gave rings to the 2 spoilers.
- Recommended snippet (`ringfix.mjs`, real Tab presses, 260 ms settle): `#wrapper a:focus-visible,#wrapper .button:focus-visible,#wrapper summary:focus-visible,#wrapper .spoiler:focus-visible{outline:2px solid #ffc857;outline-offset:2px}` + `#wrapper .game_cell:focus-within .game_cell_tools{opacity:1}`, appended inside `style#jam_theme`.
  - **gdevelop**, as is: header links 3, header tabs 2, `.button` 1 and description links 12, all `auto 1px rgb(54,18,117)`. With the snippet: all 18 `solid 2px rgb(255,200,87)`.
  - **tuesday**, as is: 4 header links, 4 tabs, 1 description link and 58 entry stops `auto 1px #361275`; 2 spoilers `none 0px`. With the snippet: all 69 `solid 2px rgb(255,200,87)`.

### gapfill01-14: `.itch_footer` on jams (gap 2)

Present only when the overview shows entries: inside `#entries` (2/2 jams with entries, 0 on gdevelop), therefore inside `#wrapper`. Markup: `div.itch_footer > span.powerd_by` ("powered by") + `a[title="itch.io"][href="/"] > img.header_logo[alt=""]`. AX name of the link: "itch.io" (from `title`). itch styles it in `jam.css` (`.view_jam_base_page .itch_footer{…border-top:1px solid #dadada;background:#EFEFEF}`) and the generated theme recolors it. The guide never names it: the "do not hide" rule is written for project `.footer`. (In the harness the link reports 0 px width only because the logo image is blocked; not a real-page finding.)

### Edits made to 01-how-it-works.md

- TL;DR item 3 and §3: per-type budgets rewritten; project cap evidence (gapfill01-01); jam cap scope and unit (gapfill01-02, -03); the budget sentence from the 09 gap fill for profiles; gapfill03-01 wording for "largest seen".
- §3 unit/over-cap paragraphs: transport (verified) vs. server unit (unverified hypothesis, gapfill01-06); error path (gapfill01-05).
- §2: how to open the editor on profiles/projects/jams, narrow-window hiding, Copy/Paste theme, owner-view scroll container (gapfill01-07 … -09).
- §4 line-ending row: reason added; leading-whitespace note.
- New §8 "Jam pages in practice" (focus order, skip link, invisible stops, rings, `.itch_footer`).
- Section notes: conflicts and gaps updated.

### Follow-ups for other section owners (not edited here)

- **02 S4** says CSS over the cap "can't be saved [documented]": no source documents the over-cap behaviour. Downgrade to "unverified: a server error lightbox is the expected path (gapfill01-05)". The project row should not claim a 5,120 cap (gapfill01-01).
- **09 #40** title "won't save" overclaims for the same reason; **09 #41** (projects) can now say "a 38,560-char save was accepted in 2026-08 (gapfill01-01)".
- **07 §7.1** tags 5,120 as [verified · community-11]; nothing verified the boundary. Use [documented · docs-32 "5kb"; community · community-06 "5,120"].
- **10 (testing/a11y):** add the jam focus findings (gapfill01-10 … -13) if 10 covers jams.

### Still open (needs an account; not testable logged out)

1. Unit and exact value of each cap: profile 5,120 vs 5,121 ASCII; 5,000 ASCII + 40 `→` (5,040 chars / 5,120 B) and + 40 emoji (5,040 chars / 5,160 B / 5,080 UTF-16); jam 20,480 vs 20,481.
2. What an over-cap save returns (error text, or truncation): record the lightbox text, then `curl` the served length.
3. Whether projects have any cap above 38,576 B: save 60,000 and 100,000 ASCII on a restricted/draft project.
4. Leading whitespace: save `\n\n  #wrapper{}` and check the served first byte.
5. The jam host's button label and the logged-in owner markup (`.theme_editor_columns`): a logged-in "Save page" of an overview the user hosts.
6. Whether `#edit_theme` opens the editor on a phone-width viewport.

## Gap fill for 07-techniques-and-support.md (2026-10-14, 14:09–14:40 UTC, retry)

Eight gaps: (1) contradictory game-grid gap/column rules; (2) infinite idle animations recommended without a WCAG 2.2.2 caveat; (3) no Firefox/WebKit runs; (4) one confidence tag per support row; (5) variable-font weights vs the theme's v1 font link; (6) profile grid recipes without a `.mode_grid` guard; (7) no performance data; (8) time-bound claims without re-check dates.

**itch traffic in this pass:** 5 document GETs (leafo.itch.io ×1, kenney.itch.io ×2, itch.io/jam/tuesday-the-13th-jam ×2), at least 24 s apart, logged out, with a normal Chrome 155 UA. Each load also fetched its static files as a browser does: 9–14 requests to `static.itch.io` and the page host per load, partly from the profile's disk cache, 57 in total. `img.itch.zone`, image extensions, analytics and `/embed/` were blocked through CDP and never left the browser. robots.txt paths were not touched. Nothing was posted and no form was submitted. All other tests were local, contacting only Google Fonts and, once, the repo owner's own Vercel service.

### Setup

- **Browser:** installed Google Chrome **155.0.8059.79**, headless, a throw-away `--user-data-dir` per run.
  - Local tests: `chrome --headless=new --disable-gpu --remote-debugging-port=9488 --user-data-dir=<scratch>/udd-local about:blank`.
  - Performance: port 9490 **without** `--disable-gpu` (GPU compositing, `SkiaOutputSurfaceImplOnGpu` events present), and port 9489 with `--disable-gpu` (software compositing).
- **Driver:** Node 22.13, raw CDP over the global `WebSocket`. Tools are own code, in `knowledge/evidence/gapfill07-tools/`:
  - `livegrid.mjs`, `summ.py`, `v-kenney2.json`, `v-jam2.json`: live grid renders (gaps 1, 6);
  - `finite-motion.html` + `.mjs`: gap 2;
  - `font-weight.html` + `.mjs`: gap 5;
  - `perf.mjs` + `perf-table.py`: gap 7.
- **Raw outputs** (served HTML of the live pages, result dumps, screenshots and the perf harness copy) are in the scratchpad only (`…/scratchpad/gapfill07/`), never in this repo.

### gapfill07-01: runtime grid sizer on a Grid-layout profile (kenney.itch.io, live, JS on)

**Method.** `node livegrid.mjs https://kenney.itch.io/ profile <scratch>/raw/kenney <scratch>/udd1`; second pass with `VARIANTS=v-kenney2.json WIDTHS=1400,700,420,360,320`.

- CDP `Fetch.requestPaused` (Document, response stage) empties the creator's `style#custom_css` and keeps its position: 414 characters on this page.
- After load + 2.5 s, for each width (`Emulation.setDeviceMetricsOverride`, `mobile` when < 768) and each variant, the test CSS is written into `style#custom_css`, `resize` is dispatched, and after 0.7 s the script reads `getComputedStyle` of every `.game_grid_widget` (`display`, `gridTemplateColumns`, `columnGap`, `rowGap`, `--itchio_grid_gap`, width, `scrollWidth`/`clientWidth`, first-row cell widths) and the text of every `style[itchio-grid-sizer]`.
- `python -I summ.py <results>` prints the table.

**Head order seen:** `link > #user_theme > #custom_css > sizer > sizer`. The two sizer rules (values at 1400px):
- `.mode_grid .user_game_grid` → `--itchio_grid_gap: 20px; --itchio_grid_cell_width: 306px; --itchio_grid_cell_columns: 3; grid-template-columns: repeat(3, 306px)`;
- `.game_grid_widget.game_list` → `repeat(4, 225px)`, 20px.

| Viewport | Sizer, own grid | Own grid `cols` / `column-gap` / `row-gap` |
|---|---|---|
| 1400 | `repeat(3, 306px)`, gap 20px | 306×3 / 20px / 25px |
| 700 | `repeat(3, 206px)`, 20px | 206×3 / 20px / 25px |
| 420 | `repeat(2, 185px)`, **10px** | 185×2 / 10px / 25px |
| 360 | `repeat(2, 155px)`, 10px | 155×2 / 10px |
| 320 | `repeat(2, 135px)`, 10px | 135×2 / 10px |

| Variant (in `style#custom_css`) | 1400 | 700 | 420 |
|---|---|---|---|
| `#wrapper{--itchio_grid_gap:40px}` | gap **20px** (unchanged), var 20px | 20px | 10px |
| `#wrapper .user_game_grid{--itchio_grid_gap:40px}` | gap 40px, **scrollWidth 998 / 960** | 40px, 698 / 660 | 40px, 410 / 380 |
| `#wrapper .user_game_grid{column-gap:40px}` | 40px, 998 / 960 (var stays 20px) | 698 / 660 | 410 / 380 |
| `#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(3,1fr)}` | 306.66×3 | 206.67×3 | **120×3** |
| `#wrapper .user_game_grid{grid-template-columns:repeat(3,1fr)}` (unguarded) | same as guarded | same | same |
| `#wrapper .mode_grid .user_game_grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));column-gap:40px}` | **210×4**, 960 / 960 | 310×2 | 380×1 (360: 320×1; 320: 280×1) |
| `@media (max-width:500px){#wrapper .mode_grid .user_game_grid{grid-template-columns:1fr}}` | unchanged 306×3 | unchanged | **380×1** (360: 320×1; 320: 280×1) |

Collection rows (`.game_list`) are `display:flex`; with every variant they kept the sizer's gap (20px, or 10px at ≤420).

### gapfill07-02: Column-layout profile (leafo.itch.io, live, JS on)

`node livegrid.mjs https://leafo.itch.io/ profile …`. The page had no `style#custom_css`, so an empty one was inserted before `</head>`. `.user_page` classes: `mode_column has_banner mode_show_purchases`. The same two sizer rules were emitted, but `.mode_grid` matches nothing here.

| Variant | 1400 (own grid) | 700 | 420 |
|---|---|---|---|
| none | `display:grid`, `315px`, gap 10px, row 25px, scrollWidth 315 / 315 | `display:flex`, `overflow-x:auto`, 315px cells, scrollWidth 3280 / 700 | flex strip, 3280 / 420 |
| `#wrapper{--itchio_grid_gap:40px}` | gap **40px** (unsized grid: inheritance works) | 40px, 3550 / 700 | 40px |
| `#wrapper .user_game_grid{grid-template-columns:repeat(3,1fr)}` (unguarded) | `315px 315px 315px` in a 315px box: **scrollWidth 965 / 315** | no effect (flex) | no effect |
| unguarded auto-fill recipe (`repeat(auto-fill,minmax(200px,1fr));gap:16px` + `.game_cell{width:auto}`) | 1 column 315px, gap 16 | **`display:grid`, 3×209px** (strip gone) | 1×380 |
| the same rules with `.mode_grid` | unchanged | unchanged | unchanged |

### gapfill07-03: jam overview (itch.io/jam/tuesday-the-13th-jam, live, JS on)

`node livegrid.mjs https://itch.io/jam/tuesday-the-13th-jam jam …`. Test CSS is appended to the original text of `style#jam_theme`. Head order: `link > #jam_theme > link > sizer`. One sizer: `#game_grid_0 { --itchio_grid_gap: 10px; … grid-template-columns: repeat(N, Wpx) }` on `div.game_grid_widget.browse_game_grid#game_grid_0`.

| Viewport | Sizer | `#wrapper{--itchio_grid_gap:40px}` | `#wrapper .browse_game_grid{column-gap:40px}` | `#wrapper .game_grid_widget{--itchio_grid_gap:40px}` | `…browse_game_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));column-gap:40px}` | `…{grid-template-columns:repeat(3,1fr)}` |
|---|---|---|---|---|---|---|
| 1400 | 5×261, 10px | 10px (no effect) | 40px, **1485 / 1385** | 40px, 1485 / 1385 | 5×237, no overflow | 3×441.7 |
| 700 | 3×213 | 10px | 739 / 700 | 739 / 700 | 2×310 | 3×213.3 |
| 420 | 2×185 | 10px | 430 / 420 | 430 / 420 | 1×380 | 3×120 |
| 320 | **1×280** | – | – | – | 1×280 | 3×86.7 |

**Conclusion for 01–03.** `#wrapper{--itchio_grid_gap}` works only on grids the sizer doesn't target (the Column-layout own grid). The earlier "verified" results (itchcss-24, crawljam-45) came from harnesses that strip `<script>`. Profiles keep ≥2 columns down to 320px. The "<510px → 1 column" rule of section 03 is the script-free user.css behaviour. Jam overviews do get a runtime sizer. **Sections 03 §5.4/§8.7/§9, 04 §1/§6 and 09 #15 should adopt the rule now in 07 §7.13**; this pass edited only section 07.

### gapfill07-04: finite vs infinite idle motion

`CDP_PORT=9488 CDP_BLOCK_ITCH=1 node finite-motion.mjs file:///…/gapfill07-tools/finite-motion.html`. Each variant is written into `style#variant`, together with the six-selector reduced-motion block. Readings: `document.getAnimations()` (name, `getComputedTiming().iterations` and `endTime`, `playState`), then all animations seeked to `currentTime=5000` **without pausing** (a paused animation reports `paused`, never `finished`). A fresh page then waits a real 5.5 s. Hover is simulated with `Input.dispatchMouseEvent`.

| Variant | Animations at 0.3 s | After the 5 s seek | Real 5.5 s | Rest state | Reduced motion |
|---|---|---|---|---|---|
| infinite (old §7.5 recipe: wave `infinite alternate`, breath 5 s infinite, twinkle infinite) | 10, all `end=inf` | 10 `running`, letters mid-wave (`translate` ±5.9px) | 10 of 10 running | – | 0 |
| finite (new §7.5 recipe) | 10: 8 letters `iter=2`, end 3200–3900 ms; breath `iter=1`, end 4000; twinkle `iter=4`, end 4800 | 10 `finished` | 0 left | `translate:none`, `rotate:none`, weight 646.25, `::after` opacity 1 | 0 |

Hover on the title: 8 `custom-wave-h` animations with `iter=inf` running. Pointer moved away: 8 `custom-wave` animations restarted (`iter=2`, end 3200–3900). 4.6 s later: 0 running and back at rest.

### gapfill07-05: Syne weight matching (theme v1 link vs css2 `wght` import)

`node font-weight.mjs file:///…/font-weight.html <shotDir>`. `?mode=` selects:
- `both`: `<link href="https://fonts.googleapis.com/css?family=Syne%3A400%2C400italic%2C700%2C700italic">` (the theme picker's format, 04 §7), then `style#custom_css` with `@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap")`;
- `v1`: the link only;
- `css2`: the import only.

Each weight runs on a fresh page, either static (`?w=`) or paused in a 4 s 400→800 animation (`?a=` seconds). Readings: computed `fontWeight`, span width, the loaded `document.fonts` faces, and `CSS.getPlatformFontsForNode`.

| Requested weight | both: face loaded → platform font | v1 only | css2 only | Width (px): both / v1 / css2 |
|---|---|---|---|---|
| 400 | static `400` → Syne | `400` → Syne | `400 800` → Syne | 343.6 / 343.6 / 343.6 |
| 450 | `400 800` → Syne-Medium | `400` → Syne | Syne-Medium | 356.3 / **343.6** / 356.3 |
| 500 | `400 800` → Syne-Medium | `400` → Syne | Syne-Medium | 369 / **343.6** / 369 |
| 550 | `400 800` → Syne-SemiBold | **`700` → Syne-Bold** | Syne-SemiBold | 382.3 / **425.8** / 382.3 |
| 600 | Syne-SemiBold | Syne-Bold | Syne-SemiBold | 395.6 / 425.8 / 395.6 |
| 650 | `400 800` → Syne-Bold | Syne-Bold | Syne-Bold | 410.6 / 425.8 / 410.6 |
| 700 | static `700` → Syne-Bold | `700` → Syne-Bold | `400 800` → Syne-Bold | 425.8 / 425.8 / 425.8 |
| 800 | `400 800` → Syne-ExtraBold | Syne-Bold | Syne-ExtraBold | 609.3 / 425.8 / 609.3 |

The paused-animation samples at 500/550/650/700 matched the static rows exactly. The computed `fontWeight` was always the requested value (550, 650…), so only the font list, the width or a screenshot reveals the snap. Screenshots `font-{both,v1,css2}-{550,650}.png` (scratchpad) show regular-vs-bold strokes. **Rule:** with the theme link alone, weights 400–500 render the 400 face and 550–800 the 700 face. A css2 `wght` range makes weights continuous. With both present, the static faces win at exactly 400 and 700, with identical widths, and both sets of files download.

### gapfill07-06: per-effect performance

**Harness.** A scratchpad copy of the private repo's `preview/itch-io-preview.html` (a real profile export):
- all `<script>`s and `theme_editor.css` removed; `user.css` from an earlier scratchpad download (no new itch request);
- the theme image replaced by the owner's local file;
- `src/main.css` with its live service import pointed at **one saved copy** of that service's sheet (1 GET to the owner's Vercel service, 200 `text/css`), so every run sees the same random choices;
- an empty `style#perf_toggle` after `style#custom_css`;
- served by `python -m http.server 8097`.

The page has frosted cards (`backdrop-filter:blur(12px) saturate(1.4)`), three fixed star layers (two twinkling), an 8-letter wave, a breathing `font-weight` driven by an animated `@property`, a greeting roller and entrance animations.

**Run.** `CDP_PORT=9490 SCEN=idle-top,scroll node perf.mjs http://127.0.0.1:8097/preview/index.html 1`, run twice.
- Emulation: 412×823, DPR 1.75, `mobile:true`, `Emulation.setCPUThrottlingRate {rate:4}`; itch hosts blocked.
- Per run: 1.5 s settle, then `Tracing.start` (devtools.timeline, …timeline.frame, cc, viz) for 3.2 s, with a `requestAnimationFrame` counter and a `long-animation-frame` observer (>50 ms). The scroll scenario sends `Input.synthesizeScrollGesture` (mouse, −1500px at 600px/s), which scrolled 1398px.
- Sums of `Layout`, `UpdateLayoutTree` (style), `Paint`, `Display::DrawAndSwap`… and `SkiaOutputSurfaceImplOnGpu::FinishPaintRenderPass` (GPU pass), per second of wall time.
- `python -I perf-table.py <rows…>` averages the runs.

Main table (GPU compositing, 2 runs each; headless display at 75 Hz):

| Config | FPS idle / scroll | Long frames (3 s) idle / scroll | Layout ms/s | Style ms/s | GPU pass ms/s idle / scroll |
|---|---|---|---|---|---|
| E0 no custom CSS | 75 / 75 | 0 / 0 | 0 | 0 | 0 / 7 |
| E1 everything on | 21 / 18 | 21 / 36 | 946 / 862 | 40 / 35 | 34 / 39 |
| E2 no `backdrop-filter` | 19 / 18 | 30 / 43 | 940 / 849 | 41 / 35 | 27 / 18 |
| E3 no star layers | 20 / 17 | 28 / 42 | 941 / 860 | 38 / 33 | 19 / 33 |
| E4 star layers static (no twinkle) | 21 / 18 | 18 / 38 | 947 / 868 | 36 / 34 | 18 / 32 |
| E5 no title wave | 22 / 18 | 20 / 40 | 970 / 868 | 29 / 27 | 31 / 38 |
| E6 no breathing weight | **75 / 75** | 0 / 0 | **0** | 53 / 51 | 34 / 39 |
| E7 no greeting roller | 19 / 17 | 31 / 40 | 951 / 867 | 39 / 33 | 33 / 43 |
| E8 all animations off | 75 / 75 | 0 / 0 | 0 | 0 | 0 / 32 |
| E9 only breathing weight | 21 / 19 | 22 / 30 | 969 / 881 | 31 / 27 | 2 / 28 |
| E10 only title wave | 75 / 75 | 0 / 0 | 0 | 35 / 40 | 12 / 27 |
| E11 only star twinkle | 75 / 75 | 0 / 0 | 0 | 19 / 19 | 28 / 39 |
| E12 breath property running, `font-weight` fixed at 600 | 75 / 75 | 0 / 0 | 0 | 123 / 126 | 32 / 39 |
| F1 breath off | 75 / 75 | 0 / 0 | 0 | 54 / 48 | 33 / 37 |
| F2 breath off, no `backdrop-filter` | 75 / 75 | 0 / 0 | 0 | 54 / 46 | 24 / 17 |
| F3 breath off, no stars | 75 / 75 | 0 / 0 | 0 | 55 / 60 | 15 / 27 |
| F4 breath off, no blur, no stars | 75 / 75 | 0 / 0 | 0 | 54 / 64 | 14 / 14 |

Extra runs on the `--disable-gpu` instance (port 9489, 60 Hz; its touch scroll gesture did not scroll, so treat all its rows as idle):
- **Unthrottled (`CPU=1`):** E1 layout 533 ms/s and E9 592 ms/s, both at 60 fps; E12 style 28 ms/s; E10 style 8 ms/s.
- **4×, software compositing:** the display compositor spent 643 ms/s with breath off (F1) against 120 ms/s with blur and stars also off (F4), from `DEBUG=1` trace totals.

**Limits.** Desktop CPU (throttled) and desktop GPU, not a phone. Itch's JS and cover images were absent. One saved variant of the per-visit sheet. The numbers rank effects; they don't predict device fps.

### gapfill07-07: no Firefox or WebKit engine available (gap 3 unresolved)

`ls ~/AppData/Local/ms-playwright` → `chromium-1217 chromium_headless_shell-1217 ffmpeg-1011 winldd-1007`. `C:\Program Files\Mozilla Firefox` doesn't exist. Global npm has only `corepack` and `npm`. Installing engines (`npx playwright install firefox webkit`, roughly 100–200 MB of browser binaries, size not measured) was **not** done: downloading and running new browser builds needs the user's explicit go-ahead. Every Firefox/Safari cell therefore stays *documented*. Section 07 §7.4 now tags the halves separately, and §7.18/§7.19 give the exact run list.

### gapfill07-08: time-bound facts (re-verify schedule)

From `support.md` §2 (release table), §3 (Baseline dates) and the static asset stamps:
- Chrome 156 and `random()`: 2026-10-20.
- Edge 156: 2026-10-22.
- Firefox 159 and scroll-driven animations: 2026-10-27.
- `text-wrap:balance` Widely: 2026-11-13.
- caniuse data: 2026-10-13.
- Stamps on itch HTML that day: `?1791970861`, `?1791974461` and `?1791981660` (crawljam.md), then `?1791985261` in this pass's live renders. That is 4 different stamps in one day.

Section 07 now has an "as of 2026-10-14 / re-verify after 2026-10-28" box at the top, plus inline re-verify dates on the `random()`, scroll-driven and `text-wrap` rows.

## Gap fill for 08-external-css.md (2026-10-14, 13:55–14:45 UTC, retry)

Three gaps: (1) the Tailwind route was never compiled; (2) the worst case of a render-blocking `@import` was unmeasured, and the Brave block was unexplained; (3) the Bootstrap recipe stopped short of usable output. Fact ids `g08-NN`. All scripts are my own code, in `knowledge/evidence/gapfill08-tools/`. Framework packages, compiled framework CSS, itch's static files and page copies stayed in the session scratchpad (`…/scratchpad/gapfill-08/`) and are not in this repo.

**itch request budget: exceeded, by accident.** The labs for gaps 1–3 made **0** itch requests: they used same-day scratchpad copies of one profile and one project page plus itch's static JS/CSS, and Chrome ran with every non-local host mapped to NOTFOUND. The Brave attempt (g08-21) did reach the live site, because Brave ignored `--host-resolver-rules`. It made about **14 page loads** of `https://mirokshi.itch.io/…`: 13 loads of a non-existent `/control.html` (itch's 404 page), 1 of the profile and 1 of `/variants.html`. The cache was disabled, so each load fetched about 13–16 itch-domain assets (`static.itch.io`, `img.itch.zone`). That is an estimated **200–250 GET requests** in about 4 minutes, in bursts. Nothing else was sent: no login, no forms. It also caused 2 loads of the owner's Vercel `live.css`, 1 Google Fonts load and itch's own gtag/GA beacons. It is above the ~150-request budget and the ~1 req/s pace, so I stopped all itch traffic once I noticed. The tool now carries a warning header.

### Environment

| Item | Value |
|---|---|
| OS | Windows 11 Pro 10.0.26200, Git Bash, Node 22.13.0, Python 3.12.6 |
| Chrome | 155.0.8059.79, headless (`--headless=new`), throw-away `--user-data-dir` per run |
| Firefox / WebKit | Playwright 1.56.1: Firefox **142.0.1** (build firefox-1495), WebKit **26.0** (build webkit-2215, the **Windows** port, which uses its own libcurl-based network stack, not Safari's), with `PLAYWRIGHT_BROWSERS_PATH=<scratch>/gapfill-08/pw-browsers` |
| Brave | 1.97.56 installed (`C:\Program Files\BraveSoftware`), headless, fresh throw-away profile; the user's own Brave profile was not touched |
| npm packages (scratchpad, `npm i --ignore-scripts`) | `tailwindcss@3.4.19`; `tailwindcss@4.1.18` + `@tailwindcss/cli@4.1.18`; `bootstrap@5.3.3`, `postcss@8.5.30`, `postcss-rename@0.8.1`, `postcss-prefix-selector@2.2.1`; `playwright@1.56.1` |
| Sanitizer model | `knowledge/evidence/sanitizer/` venv (`lupa`) + web_sanitize v1.8.0 and LuLPeg sources from the sanitizer verifier's scratchpad |
| Page copies (scratchpad, same day) | `gapfill-05/raw/mirokshi.html` (owner's profile, 19,605 B), `crawlproject/raw/c-game-34.html` (a project page, 136,175 B); itch statics `lib.min.js`, `bundle.min.js`, `user.min.js` (`external-v2/raw`), `game.min.js`, `user.css` (`community-verify2/static`), `game.css` (`a11y-verify2/raw`) |

### Re-run

```bash
T=knowledge/evidence/gapfill08-tools
# gap 1 (Tailwind): in an empty dir with tailwindcss@3.4 installed, copy $T/tw3/* then:
npx tailwindcss -c tailwind.config.js -i in-full.css -o out-full.css   # 08 §12.3 config, @tailwind base+components+utilities
npx tailwindcss -c tailwind.config.js -i in-util.css -o out-util.css   # utilities only
npx tailwindcss -c tw-neg.config.js  -i in-util.css -o out-neg.css     # negative / important / max- variants
# v4: in a dir with tailwindcss@4.1 + @tailwindcss/cli@4.1, copy $T/tw4/* to src/ then e.g.
npx @tailwindcss/cli -i src/b-theme-util.css -o out/b-theme-util.css  # (a-util, a2, a3, c-full, d-theme-inline, e-theme-static, f-anim, g-recipe likewise)
python -I $T/scopecheck.py --classes custom- <file.css> ...            # unscoped selectors, :root/*/::backdrop, @property, unprefixed classes
# gap 3 (Bootstrap) + recipes: in a dir with bootstrap/postcss/postcss-rename/postcss-prefix-selector:
node $T/build-fw.mjs <tw3_dir> <tw4_out_dir> <out_dir>                 # bs-asis/bs-wrapper/bs-bio, tw3-recipe, tw4-recipe + sizes
node $T/check-default.mjs <tw3_dir> <out_dir>/tw3-recipe.css           # plain prefixer() == verified v3 recipe
node $T/check-bs-default.mjs <out_dir>/bs-bio.css                      # plain rename()+prefixer() == verified Bootstrap build
# real-page harness (JS enabled, offline):
python -I $T/gen_real.py <dir with profile.html, project.html> <www>/pages   # + copy itch statics to <www>/static, builds to <www>/css
python -I -m http.server 8821 --bind 127.0.0.1                            # in <www>
node $T/real-diff.mjs <chrome.exe> <profileDir> http://127.0.0.1:8821 <out.json> profile-none profile-bs-asis … project-none@rm project-bs-bio@rm
# token shapes: sanitizer model + local page copies
<sanitizer venv>/python -I $T/tokprobe.py <web_sanitize_dir> <LuLPeg_dir> <out.json>
python -I $T/tokscan.py <list of local page copies>;  python -I $T/collide.py <bs-rename-map.json> <list>
# gap 2 (stall lab):
python -I $T/stallpages.py <pages>; python -I $T/stallserver.py <pages> <log.jsonl>   # :8811 pages, :8812 accept+hang, :8813 headers+stall, :8814 slow OK
node $T/stall-chrome.mjs <chrome.exe> <profilesDir> 330000 http://127.0.0.1:8811/s0-none.html … s6-refused.html
PLAYWRIGHT_BROWSERS_PATH=<dir> node stall-pw.mjs firefox 330000 <same URLs>   # run from a dir whose node_modules has playwright
PLAYWRIGHT_BROWSERS_PATH=<dir> node stall-pw.mjs webkit 330000 <same URLs>
```

Results stored in `gapfill08-tools/results/`: `stall-{chrome,firefox,webkit}.jsonl` and `tokprobe.json`. The real-page diff JSON stays in the scratchpad because it names the owner's account id and another creator's page structure; its numbers are below.

### Gap 1: Tailwind

**g08-01. The 08 §12.3 v3 config leaks out of `#wrapper`** (verified). The config was `prefix:'custom-'`, `important:'#wrapper'`, `corePlugins:{preflight:false}`, with input `@tailwind base; @tailwind components; @tailwind utilities;`. `scopecheck.py` on the 7,712-byte output:

- 10 of 37 selectors are not under `#wrapper`. Two are rules: `*, ::before, ::after { --tw-border-spacing-x:0; … ~50 --tw-* }` and `::backdrop { same }`, together **2,228 bytes** minified. The other is `.custom-container`, plus 5 `@media` copies of it, from `@tailwind components`. `important:'#wrapper'` scopes neither.
- In the real-page harness, this build set `--tw-rotate: 0` on **every element outside `#wrapper`**: 37 of 37 on the profile copy and 95 of 95 on the project copy. Those counts include `<html>`, `<head>` children and one probe element. Only custom properties changed; no visible property changed.

**g08-02. Utilities alone silently break transforms and filters** (verified). With input `@tailwind utilities;` only, nothing is unscoped (27 rules, 0 unscoped). But `#wrapper .custom-rotate-3` computes `transform: none` and `custom-blur-sm` computes `filter: none`. Their `var(--tw-translate-y)` and similar defaults are undefined, so the whole declaration is invalid at computed-value time. `custom-shadow-lg` still works because it has `var()` fallbacks. The same element in the full build gets `matrix(0.99863, 0.052336, -0.052336, 0.99863, 0, 0)` and `blur(4px)`.

**g08-03. Verified v3 recipe** (verified). Run Tailwind 3.4 as a PostCSS plugin (`prefix:'custom-'`, Preflight off, **no `important`**), then `postcss-prefix-selector({prefix:'#wrapper'})`:

- the output has **0 unscoped selectors**. The defaults become `#wrapper *, #wrapper ::before, #wrapper ::after` and `#wrapper ::backdrop`, and the container becomes `#wrapper .custom-container`;
- keyframes come out prefixed (`@keyframes custom-spin`, `custom-bounce`);
- transforms, filter, shadow, `display:flex`, `width:37px` and `rgb(239,68,68)` all apply in the real-page harness;
- the only diff on itch's own elements is the inert `--tw-*` custom properties: 80 elements inside `#wrapper` on the profile, 1,472 on the project. **0 elements outside `#wrapper` changed.**
- `check-default.mjs` shows that the plain `prefixer({prefix:'#wrapper'})` call, without a custom transform, produces byte-identical output after whitespace normalisation.
- Size: 6,932 bytes minified, 1,522 gzip, 1,337 brotli.

**g08-04. Token shapes in v3** (verified compile; sanitizer survival inferred). `-custom-mt-4` compiles to `#wrapper .-custom-mt-4`, `md:custom-flex` to `#wrapper .md\:custom-flex` inside `@media (min-width:768px)`, and `hover:custom-text-red-500` to `…:hover`. The important modifier `!custom-flex` and `max-md:custom-hidden` compile as well. None of these **start with `custom`**. The sanitizer-safe spellings that compile are:

- `custom--mt-4` (margin-top `-1rem`; only letters, digits and hyphens);
- `custom-mt-[-1rem]` (contains brackets, so its survival is unknown).

**g08-05. In v4, `prefix()` on `utilities.css` is ignored** (verified, tailwindcss 4.1.18).

- `@import "tailwindcss/utilities.css" layer(utilities) prefix(custom) source(none)` with a bio containing `flex` and `custom:flex` emits `.flex` only.
- The gap's literal recipe, `@import 'tailwindcss/utilities.css' layer(utilities) important prefix(custom)`, emits **0 utilities** for `custom:` classes: the output is the 85-byte `@layer utilities;`.
- The prefix must go on the `theme.css` import (or on the full `tailwindcss` import).

**g08-06. What v4 emits with `theme.css` + `utilities.css`** (verified; `b-theme-util.css`, 10,659 bytes):

- 32 of 32 selectors are unscoped. v4 has no selector strategy: `important` only appends `!important` to every declaration (54 in the sample), and the classes are `.custom\:flex` etc.;
- `@layer theme { :root, :host { --custom-color-red-500; --custom-spacing; … 7 variables } }`. Only the variables the sample uses are emitted; `theme(static)` emits all of them (30,158 bytes);
- 44 global `@property --tw-*` registrations, unprefixed;
- `@layer properties { @supports (<Safari/old-Firefox test>) { *, ::before, ::after, ::backdrop { --tw-* } } }`;
- unprefixed `@keyframes spin`, `ping`, `pulse` and `bounce`.

Real-page harness: `--custom-spacing` and `--custom-color-red-500` appear on every element of the page (37/37 outside on the profile, 95/95 on the project). That breaks the "no `:root` variables" rule. `theme(inline)` (`d-theme-inline.css`) emits **no** `:root` block.

**g08-07. v4's `bounce` hijacks itch's own animation** (verified, real-page harness). `#lab_bounce` is a `div.animate_bounce` outside `#wrapper` that uses itch's `user.css`/`game.css` `@keyframes bounce`. Restarted and paused at 25 %, it computes:

| Build | Transform at 25 % |
|---|---|
| baseline, and every other build | `matrix(0.997459, 0.0712382, -0.0712382, 0.997459, 0, -8.17021)` |
| `tw4-b-theme-util` | `matrix(1, 0, 0, 1, 0, -3.35698)` (profile), `…-3.14717` (project) |

So an unprefixed Tailwind `bounce` replaces itch's for the whole page. itch's own `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}` has the same effect as Tailwind's `spin`, so that clash is visually harmless.

**g08-08. A v4 recipe that passes the checks** (verified, not recommended):

1. `@import "tailwindcss/theme.css" layer(theme) theme(inline) prefix(custom); @import "tailwindcss/utilities.css" layer(utilities) important source(none); @source "./bio.html";`
2. `postcss-prefix-selector('#wrapper')`, skipping nested (`&`) rules;
3. rename the keyframes to `custom-*` (`build-fw.mjs`).

The result:

- **0 unscoped selectors**, 0 `:root`, 56 `!important` declarations;
- 44 global `@property --tw-*` remain;
- on the real pages only the injected fragment changed. `custom:flex`, `width:37px`, `blur(8px)` and `oklch(0.637 0.237 25.331)` applied, and `custom:animate-bounce` ran `custom-bounce` while itch's bounce stayed intact;
- size: 9,440 bytes minified, 1,953 gzip, 1,710 brotli.

v4's prefix-first syntax (`custom:md:flex`, `custom:-mt-4`) at least starts with `custom`, but `:` survival is unknown (g08-09).

**g08-09. Sanitizer and token shapes** (model: verified; itch's rule: open).

- `tokprobe.py`: with `class` allowed (`class=true`), web_sanitize's parser keeps all 17 shapes intact inside a quoted attribute (`custom:flex`, `custom-w-[37px]`, `custom-w-1/2`, `-custom-mt-4`, `md:custom-flex`, `!custom-flex` …). **itch's own token filter is not in the library**, so the model cannot decide survival.
- Live evidence constrains the rule. `customa`…`customae` (no hyphen) survive on a live bio (`evidence/community.md` §3.2), and so do `custom_*` tokens (`evidence/sanitizer.md` §5.2). So the rule is at least "starts with `custom`" for `[A-Za-z0-9_-]`. A "starts with `custom-`/`custom_`" rule is ruled out.
- Two candidate rules remain. Under both, `-custom-mt-4`, `md:custom-flex`, `hover:…` and `!custom-flex` are **dropped**. They differ on `:`, `[]` and `/`: plain prefix `custom` keeps them, `^custom[A-Za-z0-9_-]*$` drops them.
- `tokscan.py` over 1,508 local itch page copies (5,179 `custom-` and 158 `custom_` occurrences): no live token contains `:`, `[`, `]` or `/`. The only odd tokens (`customa`…) come from a GitHub copy of that same bio. Absence is not proof.

### Gap 3: Bootstrap

**g08-10. The renaming build works** (verified). The build applies `postcss-rename({prefix:'custom-'})` then `postcss-prefix-selector({prefix:P})` to `bootstrap/dist/css/bootstrap.css` 5.3.3.

- **2,025 classes** are renamed. On 2,973 selectors, `scopecheck.py` finds **0 unscoped** and **0 classes not starting with `custom-`**.
- `:root`/`body` become `P` (the plugin's default for global selectors). `[data-bs-theme=…]` becomes `P [data-bs-theme=…]`.
- The 5 `@keyframes` stay top level with their names (`spinner-border` etc.), with no clash with itch's 13 names.
- 1,715 `!important` remain.
- `check-bs-default.mjs` shows that the plain plugin calls (no custom transform) give identical output.

| Build | Minified bytes | gzip -9 | brotli q11 |
|---|---|---|---|
| `bootstrap.min.css` as-is | 232,803 | 30,665 | 22,709 (jsDelivr served it at 33,206, x08-01) |
| renamed + `#wrapper` | 295,006 | 31,609 | 23,396 |
| renamed + `#wrapper .custom-bs` | 327,709 | 32,779 | 23,601 |

The minifier was a naive whitespace stripper. jsDelivr's own brotli level is lower than q11.

**g08-11. Real-page diff, Bootstrap as-is** (verified). Chrome 155, JS on (`window.I` defined), 144 elements on the profile copy and 1,615 on the project copy, compared with the same page without the import:

- **outside `#wrapper`:** 37/37 (profile) and 95/95 (project) changed. Changes include `box-sizing` → `border-box`, `html` `scroll-behavior: smooth` and `--bs-*`.
- **inside `#wrapper`:** 81 (profile) and 1,473 (project) itch elements changed. The `#wrapper` font size went from 14px to 16px, line height from 22.4 to 25.6px, and heights and widths changed.

**g08-12. Renamed + `#wrapper` still restyles itch's UI** (verified). Outside `#wrapper`, only the `html`/`body` height changed, from layout. But **all** itch elements inside `#wrapper` changed: 81 on the profile and 1,473 on the project.

- Reboot's element rules (`*`, `h1`–`h6`, `a`, `p`…) and the `body` → `#wrapper` mapping now carry the ID.
- `#wrapper` got `background-color: rgb(255,255,255)` and a system-ui font (project).
- On the project page, 316 elements changed `color` and 163 changed `text-decoration-line`.

Renaming classes doesn't help with element selectors.

**g08-13. Renamed + `#wrapper .custom-bs` is clean** (verified). Only the injected fragment changed, plus its ancestors' heights from layout (5 wrapper elements, 1 bio element, `html`, `body`). There were **0** other property changes on itch elements. Inside the fragment:

- `.custom-bs` gets Bootstrap's body look: `background-color: #fff`, `color: rgb(33,37,41)`, 16px;
- `.custom-btn.custom-btn-primary` is styled (`rgb(13,110,253)`, 12px padding);
- `.custom-spinner-border` runs `spinner-border` at 0.75 s.

**g08-14. itch-class overlap on the real pages** (verified). After JS ran, the only non-fragment elements carrying `visible`, `invisible`, `active`, `disabled`, `small`, `icon-link` or `text-center` were the editor's `h2.text-center` in the profile bio; there were none on the project page. In the as-is build, Bootstrap's `.text-center` (`text-align:center!important`) matches it. The renamed builds can't match any itch class. Logged-in UI (dropdowns that toggle `.visible`) was not tested.

**g08-15. Reduced motion and color modes** (verified). On the project copy, whose own CSS has no motion rules, under emulated `prefers-reduced-motion: reduce`:

- `--bs-spinner-animation-speed` changed from 0.75s to **1.5s**, so the spinner still spins, only slower;
- `.custom-btn`'s 0.15 s transitions were removed.

The 16 `[data-bs-theme…]`, 5 `[data-bs-target]` and 16 `[data-bs-popper]` selectors become `#wrapper .custom-bs [data-…]`. They are dead because the sanitizer strips `data-*`. Dark mode can't be switched per element; remap `[data-bs-theme=dark]` to the root at build time if you want it.

**g08-16. Renamed names can collide with your own classes** (observed). Of the 2,025 renamed names, 12 already appear as creators' own classes in the local page copies (deduplicated by canonical URL, 1,162 pages): `custom-container` 21 pages, `custom-card` 19, `custom-card-title` 15, `custom-card-header` 15, `custom-badge` 6, `custom-btn` 6, `custom-accordion(-header)` 5, `custom-col` 4, `custom-btn-secondary` 3, `custom-lead` 2, `custom-border` 1.

### Gap 2: worst case of a render-blocking `@import`

**g08-17. Lab.** Each page is `<!DOCTYPE html>`, with `<style id="custom_css">@import url(X);#wrapper p{…}</style>` in `<head>`, a `#wrapper` body and an inline `<script>` at the end of `<body>` (where itch runs its init code). Each Chrome and each Playwright browser was its own instance, all in parallel, with a 330 s cap. "Given up" is the time from request start until the browser reported failure. The page was served from `http://127.0.0.1:8811`.

| Failure | Chrome 155 | Firefox 142 | WebKit 26 (Windows port) |
|---|---|---|---|
| `.invalid` host (NXDOMAIN) | given up in **28 ms**; FCP 316 ms | 11 ms; FCP 227 ms | 34 ms; FCP 80 ms |
| connection refused (`127.0.0.1:8819`) | 7 ms; FCP 276 ms | 2,048 ms ¹ | 2,041 ms ¹ |
| SYN dropped: `10.255.255.1` (http and https) and `192.0.2.1` (https) | **21.02–21.03 s**, `ERR_CONNECTION_TIMED_OUT`; FCP 21.1–21.4 s | 21.04–21.06 s, `NS_ERROR_NET_TIMEOUT`; FCP 21.25–21.27 s ² | 21.05 s, "Timeout was reached"; FCP 21.12 s |
| TCP accepted, TLS never answered (`https://127.0.0.1:8812`) | **30.18 s**, `ERR_TIMED_OUT`; FCP 30.24 s | **88.0 s**, `NS_ERROR_NET_TIMEOUT`; FCP 88.28 s | 30.0 s; FCP 30.08 s |
| TCP accepted, HTTP request never answered (`http://…:8812`) | **still blank at 330 s**: no FCP, `readyState` `loading`, end script not run | **still blank at 330 s** | 60.3 s; FCP 60.38 s |
| 200 + headers + first chunk, then the body stalls (`:8813`) | **still blank at 330 s** | **still blank at 330 s** | 66.4 s; FCP 66.43 s |
| complete answer after 2.5 s (control) | FCP 2.63 s | 2.79 s | 2.54 s |
| no import (control) | FCP 108 ms | 119 ms | 54 ms |

¹ The ~2 s for a refused connection to 127.0.0.1 in Firefox and WebKit is presumably Windows retrying a refused loopback connect; Chrome fails in milliseconds. The cause was not investigated.
² One Firefox instance (`s1b`) recorded no paint entry, though its end script ran at 21.23 s and `load` fired at 21.29 s.

The 21 s matches Windows' default TCP connect timeout (initial SYN plus 2 retransmissions), so it is OS-dependent. Other operating systems were not tested. WebKit's 60 s / 66 s limits come from the Playwright Windows port's network stack, and Safari on macOS/iOS was not tested.

**g08-18. itch's end-of-body scripts wait as well** (verified, all three engines). In every import row, the inline end-of-body script ran only after the import had settled, 3–21 ms before FCP. Without an import it runs before the first paint (Chrome: 14 ms vs FCP 108 ms). So a stalled import also delays every inline script after it, itch's init code included. In the "still blank" rows it had not run after 330 s.

**g08-19. Vercel's own ceiling** (documented). Source: `vercel.com/docs/functions/configuring-functions/duration` (last_updated 2026-08-24), fetched 2026-10-14.

- Hobby with fluid compute: default max duration **300 s**, maximum 300 s.
- Configure it per function in Node `/api` routes with `export const config = { maxDuration: 5 }`, or in `vercel.json` with `"functions": { "api/*.js": { "maxDuration": 5 } }`.
- "If a function runs for longer than its set maximum duration, Vercel will terminate it."
- The status code returned then is not stated on that page (unverified). Any non-2xx response drops only the sheet (external-06).

So a hung function on a default Hobby config can keep the page blank for up to about 5 minutes in Chrome and Firefox (inferred from g08-17 and g08-19).

**g08-20. Time budget derived for 08 §10.2** (inferred from g08-17, g08-19 and external-18):

- set `maxDuration` to a few seconds;
- never wait on an upstream call;
- if you must wait on something, race it against a ~200 ms timer and answer with what you have;
- keep the warm time to first byte under ~300 ms (the measured warm range from Spain is 0.18–0.35 s).

**g08-21. Brave: attempted, inconclusive.**

- Brave 1.97.56 was run headless with a fresh profile, `--host-resolver-rules` mapping `mirokshi.itch.io` to a local HTTPS server and the third-party hosts to NOTFOUND, and `--ignore-certificate-errors`.
- The local server logged **no** Brave request. Every request went to the live hosts, so the flag was ignored.
- Over 4 minutes, 13 loads of a control page plus 1 load of the live profile showed **no blocking at all**. The profile's `live.css` and Google Fonts loaded `ok`. Even itch's own `googletagmanager.com/gtag/js` loaded `ok`, which Shields would normally block as a cross-site tracker. Shields filter lists were evidently not active in the headless fresh profile.
- Nothing can be concluded about the 2026-10-12 block. It needs a person running a normal Brave window (see the open question). Budget impact: see the top of this block.

## Gap fill for 04-theme-editor-and-itch-css.md (2026-10-14, 17:55–18:25 UTC, retry)

Two gaps:
1. The focus-ring recipes contradicted each other across 01, 04, 06, 07, 09 and 10, and the "complete" one (10 §8.2) had been tested against game.css only.
2. The "clipped fullscreen game" hazard (04 §9.2, 09 #22/#23) was inferred from MDN and never rendered.

An earlier attempt had written the tools in `gapfill-s04-tools/` and run them (16:11–16:53 local) but never edited the section. This pass re-ran every check whose result is cited. The re-runs matched the earlier outputs, apart from page heights that differ by a few hundred px. It also added four maximize variants (`maximize_r.mjs`), a three-bundle synthetic run (`focus3x.mjs`), a card-positioning probe (`probe_cellpos.mjs`), an animated-trigger scan (`embed_anim_scan.py`) and recipe V8 (the published block) and V9 (section 01's jam snippet) in `focus_matrix.mjs`.

**0 requests to itch.io.**

### Setup

- **Browser.** Headless Chrome **155.0.8059.79**, two throw-away profiles on ports 9488 and 9489, run offline:
  `chrome --headless=new --remote-debugging-port=9488 --user-data-dir=<scratch>/gapfill-s04r/chrome-profile --no-first-run --allow-file-access-from-files --host-resolver-rules="MAP * ~NOTFOUND , EXCLUDE 127.0.0.1" about:blank`.
  Every script also ran with `CDP_BLOCK_ITCH=1` (Network.setBlockedURLs `*itch.io*`, `*itch.zone*`).
- **Inputs.** Logged-out copies made earlier in this session:
  - `section04/raw/profile_leafo.html`, `crawljam/raw/ov_bubblejam.html` and `docs-verify2/raw/igua.html`;
  - `section04/raw/{user,game,jam}.css` (md5 `2a073ae4…`, `c97fee7b…`, `49c29ed1…`);
  - `community-verify2/static/{bundle,game}.min.js` and `itchcss-v2/raw/lib.min.js`.
- **Pages.** Built with `python -I gapfill-s04-tools/build_pages.py <scratch>`. Outputs go to `<scratch>/gapfill-s04/pages/`, logs to `<scratch>/gapfill-s04r/out/` and screenshots to `<scratch>/gapfill-s04r/shots/`.
  - `focus_profile.html`, `focus_jam.html` and `focus_project.html` have scripts stripped, the creator CSS emptied and an empty `<style id="fix">` as the custom-CSS slot. The jam and project pages get a synthetic `<span class="spoiler" tabindex="0">`; the project page also gets an `<a class="button disabled">`.
  - `game_project.html` keeps itch's real scripts as local copies. Its game iframe points to a local `fake_game.html`, which prints its own viewport size.
- **Re-run.** From `knowledge/evidence/gapfill-s04-tools/`:
  - `CDP_PORT=9488 CDP_BLOCK_ITCH=1 W=<1280|600> node focus_matrix.mjs <pages URL/> V0_none V1_s04_outlineColor V2_s06_isAButton V3_s07_focusWithin V4_s10_block V6_published V7_overlay V8_final V9_s01_jam`
  - `node focus3x.mjs <file URL of focus3x.html> <file URL of the dir holding user/game/jam.css>/`
  - `node focus_shots.mjs <page> "<stop selector>" <out.png> <css|V6>`, then `node scroller_detail.mjs <profile page> "<css>"` and `node probe_cellpos.mjs <pages…>`
  - `SHOTS=<dir> node maximize.mjs <game_project URL> 1280 600`, then `ONLY=… node maximize_r.mjs …`, `node fullscreen_api.mjs …` and `node blur_check.mjs <game_project URL> <dir>`
  - `python -I embed_risk_scan.py <raw dirs…>` and `python -I embed_anim_scan.py <raw dirs…>`, over the 31 scratch directories that hold `view_game` copies (261 unique canonical URLs).

### s04-gf-01: the existing recipes on real pages

Each probe tabs through every stop inside `#wrapper`, with transitions off. Per stop it reads the computed outline, measures the ring box (border box ± width + offset) against every ancestor whose `overflow` isn't visible, and multiplies `opacity` up the tree.

| Recipe | profile (140 stops) | jam (60) | project (305) |
|---|---|---|---|
| V0 none | titles cut 63, title+carousel 4, carousel 3 | spoiler no ring 1; tools invisible 16; titles cut 16 | spoiler and disabled button no ring; breadcrumbs cut 4 |
| V1 `#wrapper :focus{outline-color}` | identical to V0 | identical | identical |
| V2 `:is(a,.button):focus-visible` 3px/3px | titles 62, title+carousel 5, carousel 3 | spoiler no ring; tools-in-`.game_thumb` cut 16; tools invisible 16; titles 16 | spoiler no ring; breadcrumbs 4 |
| V3 `a:focus-visible` + `.game_cell:focus-within` | as V2 + **card ring cut by `.carousel_wrapper` ×114** | as V2 | as V2 |
| V4 10 §8.2–8.3 | titles 63 (thin ring), title+carousel 4, carousel 3, **card ring cut ×114** | tools invisible 16; titles 16 | breadcrumbs 4 |
| V9 01 jam snippet | titles 62, title+carousel 5, carousel 3 | titles 16 | breadcrumbs 4 |

At 600px the same failures recur, plus these:
- jam: `.header_tabs` (overflow auto) cuts 4 rings in V0–V4 and V9;
- project: `.screenshot_list` cuts 1 ring in V0–V4 and V9;
- profile: the column-layout `.user_game_grid` scroller cuts the card ring 10 times in V3 and V4.

Logs: `focus_matrix_{1280,600}.txt` and `focus_v9_{1280,600}.txt`.

### s04-gf-02: the canonical block (V8) and its iterations (V6, V7)

- **V6** uses inset outlines for descendants of `.game_cell`, `.header_tabs`, `.screenshot_list` and `.breadcrumbs`, and an inset outline on the card.
- **V7** replaces the card outline with a `::after` overlay border.
- **V8** is V7 with the tools revealed by `:focus-within` instead of `:has(:focus-visible)`.

All three reached 0 no-ring, 0 cut and 0 invisible stops on all three pages at 1280px and 600px. The only remaining flags are "scrolled-out" cards (s04-gf-03). V8 is the one published in 04 §9.6. Logs: `focus_v8_{1280,600}.txt`.

### s04-gf-03: what the "scrolled-out" cards are

`scroller_detail.mjs` was run with V8 on the profile page. 114 stops at 1280px (124 at 600px) sit inside itch's scrollers. The card's box crosses the scroller edge on the right (38; 54 at 600px) or left (6) because Chrome scrolls the focused link, not the card, into view. The top values of −3 mean flush with the scroller top, and the overlay sits inside the card. Not a cut.

### s04-gf-04: screenshots (viewed)

`f_prof_coll_{V6,V7,S10}.png` and `f_jam_{none,V6,V7}.png`, first card of a profile collection row and first jam entry:
- V6: the inset card outline is hidden under the `position:relative` thumbnail; only the parts below the image show.
- V7: the overlay ring is visible on all four sides, over the thumbnail.
- 10 §8.3 (offset 3px): the card ring is cut on its top and left by `.carousel_wrapper`, and the title's thin ring is cut too.
- Jam: V7 reveals "Add to collection"; with no fix the control is invisible.

### s04-gf-05: mouse click

`focus_matrix.mjs` blurs, then clicks the first card's title. Result: `fv=false` everywhere. The card ring is `solid 3px` with V3 (`:focus-within`). V4 and V8 show none, and V8's overlay content is `none`.

### s04-gf-06: three bundles, one fix

- **Grep.** user.css, game.css and jam.css carry the same 7 outline rules on `:focus`: `.button`, `.dark_theme .button`, `.button.disabled` (`outline:0`), `.user_formatted .spoiler` (`outline:0`), `:focus` (variable), range input and selectize. game.css adds the comment-textarea rule.
- **`focus3x.mjs` + `focus3x.html`.** This is s10's page plus a `.collection_row` with an h2 link and a carousel card, a `#entries` grid card with `.game_cell_tools`, and a disabled `.button`. `#wrapper` gets each page type's wrapper class. Results with each bundle, by variant:

  | Variant | Description link, h2 link, cards | Spoiler and disabled button | Hover-only tools |
  |---|---|---|---|
  | none | `auto 1px rgb(54,18,117)` | `none 0px` | opacity 0 |
  | s04 `:focus{outline-color}` | gold, still `auto 1px` | still `none 0px` | opacity 0 |
  | s06 `:is(a,.button)` | — | spoiler `none 0px` | — |
  | s10 fixes | links stay `auto 1px`; card ring `solid 3px off3px` | `solid 2px` | opacity 0 |
  | canonical | `solid 2px` (offset −2px inside cards); card `::after 3px` | `solid 2px` | visible |

  Results were identical with user.css, game.css and jam.css. Log: `focus3x.txt`.
- **`probe_cellpos.mjs`.** `.game_cell` is `static` on 67/67 profile cards and 16/16 jam cards. The jam tools' offsetParent is `.game_thumb`, and the profile has no tools logged out. No `.game_cell::before/::after` in itch's CSS.

### s04-gf-07: embed census (static triggers)

`embed_risk_scan.py` over 261 unique project pages:
- 111 HTML5 embeds, of which 22 are `start_maximized` and 47 have a `fullscreen_btn`;
- 52 embed pages with custom CSS;
- **0** with a trigger property on an embed ancestor (html, body, wrapper, inner_column, view_game_page, html_embed_widget, embed_wrapper; pseudo-elements excluded).

### s04-gf-08 to s04-gf-11: the maximized frame, rendered

These run on `game_project.html` with itch's real lib, bundle and game scripts. A real CDP mouse click on `.load_iframe_btn` triggers `enter_maximized()`, because the page is `start_maximized`. That gives `.game_frame.maximized` and `body.frame_maximized`, confirmed for every variant. Logs: `maximize.txt` and `maximize_r.txt`; screenshots `max_<W>_<variant>.png`, of which G0, G1, G5, G6 at 1280 and G1 at 600 were viewed.

| Variant | Containing block | Frame rect at 1280 (x, y, w, h) | Frame rect at 600 | Corner hits | z-order vs `#user_tools` |
|---|---|---|---|---|---|
| G0 none | viewport | 0,0,1280,800 | 0,0,600,800 | 5/5 | game over |
| G1 `#inner_column{backdrop-filter:blur(8px)}` | `#inner_column` | 160,0,960,8808 | 0,0,600,9390 | centre only | tools over |
| G2 `.view_game_page{transform:translateY(0)}` | `.view_game_page` | 160,16,960,8752 | 0,16,600,9231 | centre only | tools over |
| G3 entrance `transform` animation, fill `both` | `#inner_column` (`matrix(1,0,0,1,0,0)` kept) | as G1 | as G1 | centre only | tools over |
| G4 `#wrapper{filter:saturate(1.2)}` | `#wrapper` | 0,0,1280,8808 | 0,0,600,9390 | 5/5 | tools over |
| G5 `.embed_wrapper{will-change:transform}` | `.html_embed_widget` (= `.embed_wrapper`) | 160,36,960,**0** | 0,36,600,**0** | 0/5 | — |
| G6 isolated `::before` blur recipe | viewport | full | full | 5/5 | **tools over** |
| G7 `#wrapper:not(:has(.html_embed_widget)) #inner_column{blur}` | viewport | full | full | 5/5 | game over |
| G8 blur + `body.frame_maximized … {backdrop-filter:none}` | viewport | full | full | 5/5 | game over |
| G9 `#inner_column{opacity:.98;isolation:isolate}` | viewport | full | full | 5/5 | **tools over** |
| G10 `#wrapper{position:relative;isolation:isolate}` | viewport | full | full | 5/5 | **tools over** |
| G11 G6 + release on `body.frame_maximized` | viewport | full | full | 5/5 | game over |
| G12 entrance animation, no fill, after it ended | viewport | full | full | 5/5 | game over |
| G13 G10 + `body.frame_maximized #wrapper{isolation:auto}` | viewport | full | full | 5/5 | game over |
| G14 G6 + release via `#wrapper:has(.game_frame.maximized)` | viewport | full | full | 5/5 | game over |
| G15 `.embed_wrapper:not(:has(.maximized)){transform:…}` | viewport | full | full | 5/5 | game over |

- No variant was clipped by an `overflow` ancestor (`clippedBy=-` throughout).
- Frame heights are this copy's page height, with images blocked.
- The G1 screenshot shows the game boxed into the 960px column, with page background on both sides and `#user_tools` drawn over its top right. At 600px the `#user_tools` bottom bar covers it.
- G5 shows the page content with no game.

### s04-gf-12: when itch maximizes (source)

From game.min.js and bundle.min.js:
- `load_iframe_btn` calls `load_frame()`, then `enter_fullscreen()` if `I.is_mobile()` (a UA regex: Android, webOS, iPhone, iPad, iPod, BlackBerry, IEMobile, Opera Mini), else `enter_maximized()` if `opts.start_maximized`.
- `restore_btn` calls `is_mobile ? enter_fullscreen : enter_maximized`.
- `enter_fullscreen()` falls back to `enter_maximized()` when `I.request_fullscreen()` returns false. It does so only when the element has none of `requestFullscreen`, `msRequestFullscreen`, `mozRequestFullScreen` or `webkitRequestFullscreen`.
- `enter_maximized` adds `.maximized` and `body.frame_maximized` and pushes a history state.

### s04-gf-13: does the pseudo-element recipe blur?

`#wrapper` gets a 2px black/white stripe `background-image` (a longhand), the column's background is made transparent, and a 120px spacer region is sampled (R channel):

| Variant | Inside the column | Outside the column |
|---|---|---|
| no blur | 0–255, mean 128 | 0–255 |
| `backdrop-filter` on `#inner_column` | 127–127 | 0–255 |
| isolated `::before` recipe | 127–127 | 0–255 |
| `::before` without `isolation` | 0–255 | 0–255: **no blur** |

### s04-gf-14: Fullscreen API

`requestFullscreen()` was called on `#game_drop` with a user gesture via CDP, after `I.HtmlEmbed.current` ran `load_frame()`. It was granted and gave `fullscreenElement=game_drop`, iframe rect 0,0,1280,800, in all three cases: none, `backdrop-filter` on `#inner_column`, and `will-change:transform` on `.embed_wrapper`.

### s04-gf-15: animated triggers and how common the properties are

`embed_anim_scan.py`: among the 52 embed pages with custom CSS, 0 run an animation whose keyframes animate a trigger property on an embed ancestor. Pages using each property on any selector:

| Property | Pages |
|---|---|
| `transform` | 39 |
| `filter` | 12 |
| `will-change` | 12 |
| `translate` | 7 |
| `scale` | 1 |

Across all 133 project pages with custom CSS, 59 use some trigger property somewhere. In the embed pages the top selectors carrying `transform`, `filter` or `will-change` are keyframe stops, `img:hover`, `.button:hover`, `#wrapper::before`, `.load_iframe_btn(:hover)`, `#inner_column::before/::after` and tooltip classes. Limitation: it's a regex parse, so declarations of a parent rule that uses native nesting are missed.

### s04-gf-16: ring contrast (WCAG 2)

| Ring | `#fff` | `#eee` | `#222` | `#0b1433` | `#000` |
|---|---|---|---|---|---|
| `#ffc857` | 1.54 | 1.33 | 10.34 | 11.75 | 13.65 |
| `#361275` | 14.0 | 12.06 | 1.14 | 1.29 | 1.5 |

### Section 04 edits

- **TL;DR:** two new bullets, on the focus block and on effects on embed ancestors.
- **§9.2:**
  - the MDN-only consequence was replaced by the "when itch maximizes" source facts and the rendered table;
  - the "clipped" claim was corrected to "resized, not clipped", with the stacking finding added;
  - the census numbers were added;
  - "Frosted BG2 panel" was rewritten with the verified blur, the release-while-maximized guard (`:has` and `body.frame_maximized` forms) and the other passing options.
- **§9.5:** caveat that an isolated `#wrapper` puts `#user_tools` over a maximized game, with the verified release.
- **§9.6:**
  - fact that all three bundles share the same focus rules;
  - the `:focus{outline-color}` advice downgraded with the measured failures;
  - the **canonical focus block**, with line-by-line reasons, the colour rule and fallbacks;
  - the recipe comparison table and the scope limits.
- **§10:** the example's `:focus{outline-color}` line was replaced by a pointer to §9.6.
- **§11:** checklist items 6 and 8 updated.
- **Section notes:** conflicts 11 and 12, and the s04-gf-01 to s04-gf-16 list.

### Follow-ups for other section owners (not edited here)

- **01 (jam focus snippet), 06 §7, 07 §7.6, 09 #109/#110, 10 §8.2–8.3:** replace each focus snippet with a pointer to 04 §9.6's canonical block, or quote it.
  - The table in 04 §9.6 lists what each current snippet misses. 07 §7.6 and 09 #110 (`:focus-within` card ring) also show a ring after mouse clicks.
  - 10 §8.3's offset-3px card ring is cut by profile carousels. Its "renders completely" holds only outside itch's scrollers.
- **09 #22/#23:** retag from inferred to verified.
  - The frame is resized to the ancestor (page-tall, or 0-high with `will-change` on `.embed_wrapper`), not clipped.
  - `#wrapper:not(:has(.html_embed_widget))` works (G7).
  - Add the `#user_tools`-over-game stacking issue for `isolation` and `opacity` on embed ancestors, and the release-while-maximized guards (G11, G13, G14).
- **Anything recommending `#wrapper{position:relative;isolation:isolate}`** (04 §9.5 and wherever else it appears) needs the HTML5-page release `body.frame_maximized #wrapper{isolation:auto}`.

### Still open

- **Real mobile browsers (no account needed):** does an HTML5 embed fall back to the maximized mode, and so to this hazard? Open a project page with an HTML5 embed on a phone, logged out, and press "Run game". If the browser's own fullscreen UI does not appear and itch's maximized frame with its exit control does, the fallback ran. The code path is documented (s04-gf-12); which browsers take it isn't.
- **Firefox and Safari:** the focus matrix and the maximize tests ran in Chrome only. No such engine was available offline in this pass (gapfill07-07).
- **Logged-in controls:** the comment form textarea, owner bars and `theme_editor.css` were not in the focus test. The canonical block draws a 2px ring on the comment textarea; game.css otherwise gives it an inset box-shadow. That's untested and needs a logged-in visitor, though no saved content.

## Gap fill for 10-testing-and-a11y.md (2026-10-14, 14:14–14:53 and 18:00–18:40 UTC, retry)

Three gaps: (1) "verified" layout results came from script-free harnesses, and the KB had no JS-enabled method; (2) there was no end-to-end template per page type, and the four checklists disagreed; (3) every screen-reader claim rested on Chrome's computed names. Fact ids `s10-17` to `s10-30` are defined in the section's *Section notes* table. All scripts are my own code, in `knowledge/evidence/gapfill-s10-tools/`. Page copies, itch's static files, the request logs and the result JSON stay in the session scratchpad (`…/scratchpad/gapfill-s10-js/`), not in this repo.

The first attempt (14:14–14:53 UTC) built `lr.mjs`, ran `runtime-checks.mjs` and drafted the templates, but wrote nothing to the section. The retry re-ran everything, fixed two template bugs and one measurement bug, added the accessibility-tree work for gap 3, and edited the section.

**itch requests: 73 GETs in total, all 200, no 429.**

- 5 page documents, fetched once at 14:21 UTC, ≥ 7 s apart: two profiles, one project, one devlog post of that project, and one jam overview.
- 68 static and image files from `static.itch.io` and `img.itch.zone`, ≥ 1.1 s apart between request starts. Only 1 of them came in the retry (`react.min.js`); every other render was served from the mirror.
- Everything else was failed by the interceptor: gtag, the view-counter URLs and XHR.
- No login, no POST, no form.
- Non-itch requests: Google Fonts (the jam template's woff2, and one GET of `fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@700` to confirm its URL).

### Environment

| Item | Value |
|---|---|
| OS / runtimes | Windows 11 Pro 10.0.26200, Node 22.13.0, Python 3.12.6, Windows PowerShell 5.1 |
| Chrome | 155.0.8059.79. Headless on `--remote-debugging-port=9611` with a scratch `--user-data-dir` (live renders); headed with `--force-renderer-accessibility`, a scratch profile and `--host-resolver-rules="MAP * ~NOTFOUND"` (UIA dump only, closed afterwards) |
| Firefox / WebKit | Playwright 1.56.1 with Firefox 142.0.1 and WebKit 26.0 (Windows port), already in the scratchpad from the 08 gap fill; nothing new downloaded |
| Screen readers | none installed besides Narrator (s10-30); nothing installed |

### Re-run

```bash
T=knowledge/evidence/gapfill-s10-tools; S=<scratch>/gapfill-s10-js
chrome --headless=new --remote-debugging-port=9611 --user-data-dir=$S/chrome-lr2 about:blank &
export CDP_PORT=9611 LR_MIRROR=$S/mirror LR_LOG=$S/out/requests.jsonl LR_RAW=$S/raw LR_NEW_IMAGES=placeholder
node $T/fetch-live.mjs <page URLs>                      # once: polite logged-out GETs into $LR_RAW
node $T/runtime-checks.mjs $S/raw $S/out [grid minheight footer usertools cards gif embed jam]
node $T/extra-checks.mjs $S/raw                          # jam margins by width; lazy covers on scroll
node $T/template-checks.mjs $S/raw $S/out [profile@… project@… jam@…]
node $T/ring-shots.mjs $S/raw $S/out                     # devlog banner/breadcrumb rings, with/without inset
python -I $T/minify.py $T/templates/profile.css $T/templates/profile.min.css
# gap 3 (from a dir whose node_modules has playwright@1.56.x, PLAYWRIGHT_BROWSERS_PATH set):
node pw-ax.mjs firefox|webkit file:///…/gapfill-s10-tools/sr-probe.html
node pw-ax-spoiler.mjs chromium|firefox|webkit $T/sr-spoiler.html <same-day game.css copy>
chrome --force-renderer-accessibility --user-data-dir=<scratch> --host-resolver-rules="MAP * ~NOTFOUND" file:///…/sr-probe.html
powershell -File $T/uia-dump.ps1 -TitlePrefix "sr probe" -Out uia-chrome.txt
```

### Gap 1: JS-enabled method and re-checks

- **Method (s10-17).** `lr.mjs` loads the real URL, so itch's own JavaScript runs.
  - The document is answered by `Fetch.fulfillRequest` from a saved logged-out copy, with the test CSS in `style#custom_css`, or at the end of `style#jam_theme` on jams.
  - itch's statics come from a write-once mirror.
  - Google Fonts pass through; everything else is failed.
  - Readings are taken after `load`, 600 ms of network idle, and 1 s more.
  - Smoke test: jQuery and `I` were defined; the head ended `user_theme > custom_css > sizer > sizer`; `#wrapper` had an inline `min-height`.
- **Reproducibility.** The retry re-ran all eight `runtime-checks.mjs` groups. The JSON matched the first attempt's exactly, ignoring only the countdown values.
- **Results (s10-18 to s10-24)** are in the section's §14.8 table, §2.3 (overlap table), §3 (jam margins) and §8.4 (skip link). Key numbers:
  - **Grid.** The sizer gives `repeat(3,306px)` at 1280 px, 268 px after resizing to 900, and `repeat(2,177px)` with a 10 px gap at 420. A class-only override loses; `#wrapper .user_game_grid` wins. Changing the gap there makes the grid's scrollWidth 980 in a 960 grid.
  - **`min-height`.** It equals the window height minus `padding-bottom` (850/550; 900 with padding 0; 790 with 110). Only `!important` beats it.
  - **Footer gap.** 34 px by default; `margin-top` changes nothing; `margin-bottom:20px` → 14; `padding-bottom:0` → −16; `110px` → 94. Same at 400 px high. This confirms repo-24.
  - **`#user_tools`.** Shown, z-index 2. A fixed z5000 layer covers it (the hit test returns `#wrapper`); `isolation:isolate` fixes both paint and hit; `pointer-events:none` fixes only the hit. This confirms itchcss-29. Screenshots viewed.
  - **Cards.** Heights 352/341/335/318/318 with no fix; stretch alone equalises each row; the full repo-33 fix gives all 352 (322 at 900). This confirms repo-33.
  - **Lazy covers** on a 67-game profile: 2 with a `src` at load + 1 s, 25 after scrolling. Thumb boxes stay 250/159 px.
  - **GIF overlay.** Inline `background-image` on hover; only `!important` or `display:none` stop it.
  - **Embed.** With a desktop UA, inline `width:1280px;max-width:1280px` at 1400/1000/800/375 px, and scrollWidth 1300 at 1000 and 800. With a phone UA at 320 px, no overflow.
  - **Jam countdown.** Years and months are `.hidden`.
  - **Jam skip link.** `#maincontent` becomes `#view_jam_<id>` (`tabindex=-1`, inside `#wrapper`). Profile and project have 0 skip links.
  - **Jam margins.** `.jam_body` margin 0 at 651/800/960/961 px and 10 px at 650. This confirms crawljam-47.
- **Retagging.** In section 10, a11y-31 and a11y-45 are now `verified (script-free harness)`. Two new tag kinds were added to the tag table.

### Gap 2: templates (s10-25, s10-26)

- **Files.** Three original templates are in `templates/` (readable `*.css`, paste-ready `*.min.css`).
  - Minified sizes with the 01 §3 snippet: profile **1,643**, project **1,483**, jam **1,450** chars (= UTF-8 bytes, 0 line breaks).
  - Rules: 15, 13 and 10.
  - In every case Chrome parsed the source and the minified file to the same CSSOM.
- **Tested on five live-rendered pages:** grid profile, column profile with a banner, project with a 1280 px HTML5 embed, a devlog post, and a jam.
  - Focus: every stop inside `#wrapper` passed: 8/8, 140/140, 156/156, 82/82 and 29/29.
  - Reduced motion: 0 running animations, and the guard is visible in computed `animation-name:none` / `transition-duration:0s`.
  - 320 px with an Android UA: no horizontal scroll.
  - Forced colours: every panel kept a 1 px edge.
  - h1: 2 / 0 / 0 / 1 / 2. That depends on page HTML; see §15.4.
- **Bugs found and fixed.**
  - (a) The jam panel's only edge was a `box-shadow`, which forced colours removed (`shadow none`, `border none`). It is now an inset `outline`.
  - (b) On the devlog, the banner link (`.header{overflow:hidden}`) and the footer breadcrumbs (`.inner_column .footer .breadcrumbs{overflow:hidden}`) clipped the 2 px ring. `outline-offset:-2px` for those links fixes it. Verified on clipped screenshots and an 8× corner capture, all viewed.
  - (c) The profile template gained a `.button` focus route. Both profiles were re-run with the same results.
- **Measurement bug.** The first ring check added `outline-width` even for negative offsets, and measured a link wrapping a block image as 0×0. Fixed in `template-checks.mjs`: it now uses `max(0, width + offset)` and the union of the children's boxes.
- **Earlier draft.** A draft project template with a 1 px `border` on `#inner_column` measured scrollWidth 1282 under itch's 1280 px embed pin (desktop UA), so the template uses an outline.
- **Contrast** (WCAG 2.x, composited):
  - card at 82% over white: ink 9.72, muted 6.93, accent 7.02;
  - button text 12.01;
  - ring `#ffc857` on white: only 1.54, hence the light-theme caveat.

### Gap 3: beyond Chrome's computed names (s10-27 to s10-30)

- **Probe.** `sr-probe.html` (13 patterns) was checked in Chrome 155 over CDP, and in Firefox 142.0.1 and WebKit 26.0 with Playwright `page.accessibility.snapshot({root, interestingOnly:false})`. All 13 names agree across the three engines. The table is in section 10 §10.4.
  - Examples: the sr-only + `content:"M" / ""` letters give "Miro"; without alt, "Miro x x"; inline-block letters give "M i r o"; `visibility:hidden` "Hi!" is dropped; a transparent one is kept; the roller gives "Hi!, I make games"; `/ ""` silences a star and an arrow.
- **Chrome's Windows UIA tree** was read from a headed window with `System.Windows.Automation` (RawView walk from the Document element).
  - Native UIA: DOM ids appear as AutomationIds.
  - Alt-silenced generated text has **no text element at all**; un-alted generated text appears as "x" leaves.
  - A transparent "Hi!" is a leaf; `visibility:hidden` text is absent.
- **Firefox platform tree.** Playwright's Firefox window was found, but exposed no Document element to UIA, so there is no data.
- **Spoilers (s10-29).** With a same-day `game.css` copy served from a fake origin:
  - unfocused plain spoiler text is in the tree in all three engines (text fill transparent);
  - element-wrapped spoiler text is `visibility:hidden` and absent until focus.
- **Screen readers (s10-30).** No NVDA or JAWS on the machine; only Narrator. Downloading or installing NVDA needs the owner's explicit go-ahead, and Narrator would speak aloud and take over the keyboard. So real speech remains **untested**.
- **Section changes.** §9.4 and §10.2 now say the patterns are verified as accessibility-tree results only, and §10.4 holds the exact NVDA probe.

### Still open

- **Real speech** (NVDA + Chrome/Firefox; VoiceOver + Safari macOS/iOS; Narrator + Edge) for `sr-probe.html`, `sr-spoiler.html` and `s10-tools/s10-letters.html`. No itch account is needed, but a person or the owner's go-ahead to install NVDA is.
- **Template saves.** The templates were injected, not saved. Saving each through the real editors on an itch account would confirm that the sanitizer and the size check accept them (the profile is far below 5,120) and that the served `style#custom_css` matches.
- **Jam template on other jam themes.** The jam test appended the template to one jam's generated theme plus host CSS. A host with a light theme would need different colours. Not tested.
