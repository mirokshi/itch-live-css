# Evidence log: itch.io HTML sanitizer (and CSS text handling)

- **Dimension key:** `sanitizer`
- **Date of all checks:** 2026-10-14
- **Scripts and raw results:** `knowledge/evidence/sanitizer/` (my own code; no third-party page content is stored there)
- **Raw downloads:** only in the session scratchpad. They are not in this repo, because other creators' HTML/CSS and itch's stylesheets are not ours to republish.

## 1. Summary

1. **Engine.** itch.io's server output for user-authored HTML matches leafo's open-source Lua library
   [`leafo/web_sanitize`](https://github.com/leafo/web_sanitize) on every fingerprint I could measure, but with an
   itch-specific whitelist. The fingerprints:
   - text `'` is stored as `&#x27;` and `"` as `&quot;`, with 0 raw quotes in 2,127 containers;
   - inline `style` is re-serialized as `a; b` with no trailing `;`, and an empty `style=""` is kept;
   - `rel="nofollow noopener"` is injected only on links that don't point to itch.io, exactly the dynamic
     `add_attributes` pattern from the library's own spec, which uses itch.io as its example;
   - only properties from web_sanitize's CSS whitelist survive in `style=""`.

   - *(Second verification, §9.)* the two injected link attributes come out in Lua `pairs()` order, which flips
     between requests for the same unchanged page (`rel` first on one fetch, `referrerpolicy` first on the next);
   - *(Second verification, §9.)* in 2023–2024 Wayback captures, `<wbr>` (then allowed) was followed by
     sanitizer-inserted `</wbr>` closers, exactly web_sanitize's handling of a whitelisted tag missing from
     `self_closing`.

   leafo (itch's founder and admin) wrote the library. Its README says it runs "on production commercial
   applications". itch itself is closed source, so the claim "itch uses web_sanitize" is **inferred**, not proven.
   The per-request attribute order also implies the HTML is (re)sanitized at render time, so whitelist changes reach
   old content (see §9.3).
2. **What itch adds** on top of the library default (all observed live):
   - a `class` filter: `custom*` tokens plus the editor classes `text-center` and `text-justify` (the `.text-right` CSS
     rule also exists); in comments also `spoiler` (see §8);
   - `style` filtered through `sanitize_style`;
   - extra tags: `iframe`, `details`/`summary`, `figure`/`figcaption`, `del`, `ruby`/`rt`/`rp`, `font`;
   - `a[target]` kept with any value;
   - injected `referrerpolicy="origin"` on external links and `loading="lazy"` on every `img`;
   - click-to-activate rewriting of non-itch iframes in project descriptions and comments.
3. **What dies:** `id`, `data-*`, `aria-*`, `role`, `on*`, relative or `#hash` hrefs, non-`custom` classes, inline CSS
   outside the 27-property whitelist, `!important`, and anything that makes the style parser fail (that drops the
   whole `style` attribute).
4. **Custom CSS text** (the CSS editor) is served verbatim inside `<style id="custom_css">`:
   - `>` is not escaped;
   - `@import` is kept, for Google Fonts and for other https hosts;
   - comments are kept.

   web_sanitize has **no** stylesheet sanitizer, and how itch treats `</style>` and similar text is unknown (account
   probe needed).

## 2. Method and environment

| Item | Value |
|---|---|
| OS / shell | Windows 11, Git Bash, curl 8.x, Python 3.12 |
| Library source | `git clone https://github.com/leafo/web_sanitize` at `1ca8317` (2026-09-29, v1.8.0); GitHub Actions CI green on that commit (`gh run list -R leafo/web_sanitize`) |
| Sister apps (same author, open source) | `leafo/streak.club` @ `b5b4679` (`helpers/html.moon`: whitelist customisation), `leafo/lapis-community` @ `2c43c30` (powers itch.io community; sanitising is left to the host app) |
| Local execution | `lupa` 2.8 (PyPI) LuaJIT 2.1 runtime + `pygy/LuLPeg` @ `f07f5be` (pure-Lua LPeg 0.12 port) standing in for C LPeg; web_sanitize's compiled `.lua` files loaded unmodified. **27/27 spec vectors from the library pass** → environment trusted for the probes. |
| itch requests | 113 GET in total (≤ 1 req/s, browser UA, robots.txt honoured, never logged in). Two `429` responses: one was retried 3 s later and the other (a music page) was skipped. |
| Live sample | 91 user-content containers (10 profile bios, 53 project descriptions, 12 devlog bodies, 16 jam descriptions) + 2,036 community comment bodies on the same pages; list in `sanitizer/sample_urls.txt` |
| itch statics | `https://static.itch.io/game.css`, `user.css`, `game.min.js` (`?1791970861`) grepped in scratchpad only |

### Reproduce

```bash
# 1. library
git clone https://github.com/leafo/web_sanitize && git -C web_sanitize checkout 1ca8317
git clone https://github.com/pygy/LuLPeg
python -m venv venv && venv/Scripts/python -m pip install lupa
venv/Scripts/python -I knowledge/evidence/sanitizer/run_ws.py web_sanitize LuLPeg knowledge/evidence/sanitizer/cases.lua out.json
# 2. live sample (sleep >= 1.2 s between requests; UA = desktop Chrome)
while read -r kind url; do curl -s -A "$UA" -o "pages/$(echo $url | md5sum | cut -c1-8).html" "$url"; sleep 1.5; done < <(grep -v '^#' sample_urls.txt)
python -I analyze.py pages analysis.json      # tags/attrs/classes/styles per container kind
python -I links.py pages                      # rel/referrerpolicy by link host
python -I fingerprint.py pages                # escaping fingerprint
python -I customcss.py pages                  # <style id="custom_css"> traits (no CSS copied)
```

Container detection (by class tokens):

- project: `formatted_description user_formatted`
- devlog: `object_text_widget_widget … user_formatted post_body`
- jam: `jam_content user_formatted`
- profile: `user_profile formatted`
- comments: `post_body user_formatted`

## 3. Source code: web_sanitize v1.8.0

### 3.1 Default HTML whitelist (`web_sanitize/whitelist.moon`)

| Scope | Allowed |
|---|---|
| any tag | `title`, `dir`, `lang` |
| `a` | `href` (must match `^https?://`, `^//` or `^mailto:`; **case-sensitive**), `name` |
| `img` | `align`, `alt`, `height`, `width`, `src` (`^https?://` or `^//` only) |
| `abbr`, `dfn` | `title` |
| `blockquote`, `q` | `cite` |
| `table` | `summary`, `width` |
| `td`, `th` | `colspan`, `rowspan`, `width` |
| `time` | `datetime`, `pubdate` |
| no attributes beyond "any tag" | `b br cite code dd div dl dt em h1-h6 hr i kbd li mark ol p pre s samp small span strike strong sub sup thead tbody tfoot tr u ul var` |
| injected | `a` → `rel="nofollow"` (default; can be a function of the original attributes) |
| self-closing `/>` accepted only for | `br img hr input source link meta param` (only matters if the tag is whitelisted) |

Not in the default list: `class`, `style`, `id`, `data-*`, `aria-*`, `iframe`, `details`, `summary`, `figure`,
`figcaption`, `del`, `ins`, `font`, `center`, `ruby`/`rt`/`rp`, `wbr`, `svg`, `video`, `audio`, `button`, `form`,
sectioning elements, `style`, `script`. A host app adds what it wants with `whitelist:clone()`. streak.club, for
example, adds `iframe{width,height,frameborder,allowfullscreen,scrolling,src}`, `del`, `a.target` and global
`style = sanitize_style`.

### 3.2 Parser behaviour (`web_sanitize/html.moon`, `patterns.moon`)

- Tag names and unquoted attribute values: `[A-Za-z0-9._:-]+`.
- Attribute names: `[A-Za-z0-9._:-]+`.
- Whitespace inside tags: space, tab and LF only (**no CR**).
- An open tag that fails to parse fails as a whole. Its `<` is then escaped, so the **entire tag shows up as visible
  text** (`&lt;img … width=100%&gt;`). leafo calls this "correct" in issue #2.
- A non-whitelisted tag is escaped as text (default `strip_tags=false`). A non-whitelisted attribute is silently
  removed.
- Unclosed tags are closed at the end of the fragment. Closing an outer tag closes the inner ones. A closing tag for
  an element that isn't open is escaped as text.
- `<!-- -->` comments are escaped as text unless `strip_comments=true`.
- Approved attribute values pass through as written. Only `<` and `>` are replaced, so a raw `&` in a URL stays raw.
- A function-filtered value is re-quoted with `"` and HTML-escaped.
- Text: `< > ' " &` become `&lt; &gt; &#x27; &quot; &amp;`. An existing entity (`&name;`, `&#…;`, semicolon optional)
  passes through.
- Edge case: `<` followed by whitespace and a whitelisted tag name is parsed as a tag. `x < div > y` gives
  `x < div > y</div>`, which appends a stray `</div>`. *(Second verification.)* A browser reads `< div >` as text
  (HTML tokenizer: `<` + space is not a tag), but the stray `</div>` is a real end tag, so it closes the nearest open
  `div`, which is itch's own content container. Whether itch's editor lets such raw text reach the server is unknown.

### 3.3 Inline-style sanitizer (`css.moon`, `css_whitelist.moon`, `css_types.moon`)

`sanitize_style` only parses a declaration list. It is not a stylesheet parser. The ruleset grammar, which only allows
plain identifier selectors, isn't exported, so web_sanitize **cannot** be what sanitizes itch's CSS editor.

**Token types:**

- `n`: number, dimension or percentage. The dimension must be an integer followed by a unit (`10px`, `150%`). A
  decimal like `1.5em` is tokenized as number + ident.
- `i`: identifier. This includes negative values such as `-10px`, because the identifier pattern allows `-`.
- `h`: `#hex`.
- `f`: any `name(...)` function.
- `u`: `url("http(s)://…")` with a quoted URL only.
- `s`: string.

**Whitelist** (property: accepted type pattern):

| Property | Pattern |
|---|---|
| `margin-top/-right/-bottom/-left` | `n` or `i` |
| `margin` | 1–4 × (`n` or `i`) |
| `padding-top/-right/-bottom/-left` | `n` |
| `padding` | 1–4 × `n` |
| `font-size` | `n` or `i` |
| `text-align` | `i` |
| `color`, `background-color`, `border-color` | `i`, `h` or `f` |
| `background` | exactly one of `u`, `i`, `h` |
| `background-image` | `u` or `i` |
| `opacity` | `n` |
| `border` | `n` [`i` + color] |
| `border-width` | 1–4 × `n` |
| `border-style` | 1–4 × `i` |
| `width`, `height`, `max-width`, `min-width`, `max-height`, `min-height` | `n` |

**Failure modes:**

- An unknown property, or a value of the wrong type, removes that declaration.
- A **parse failure removes the whole attribute** (the function returns `nil`). Causes include `!important`, `;;`,
  `/* */`, `/` inside `rgb()`, and an unquoted `url()` whose URL contains `.`, `:` or `/` (e.g.
  `url(https://…)`, `behavior: url(x.htc)`). *(Verifier correction: `behavior:url(x)` with a bare identifier parses as
  a function and only that declaration is dropped → `""`.)*
- *(Added by verifier, see §8.)* Also `nil`: **trailing whitespace** (`color: red ` or `color: red; `), a **CR**
  between declarations (`color: red;\r\nwidth: 10px`), and a **decimal percentage** (`width: 50.5%`, tokenized as
  number `50.5` + an unparseable `%`). Leading whitespace and LF are fine.
- The output joins the surviving declarations with `"; "` and has no trailing `;`.

### 3.4 Local probe results (`sanitizer/ws_results.json`, 161 cases)

These cases ran on the library defaults, plus `sanitize_style` called directly.

| Input | Output |
|---|---|
| `<div class="custom-x">a</div>` | `<div>a</div>` (default has no class) |
| `<span aria-hidden="true" role="img">x</span>` | `<span>x</span>` |
| `<div id="x" data-y="1" tabindex="0" onclick="…">` | `<div>` |
| `<a href="#top">` / `href="/rel"` / `HTTPS://…` / `tel:` / `javascript:` / `" https://…"` | `<a rel="nofollow">` (href dropped) |
| `<img src="…" width=100%>` | whole tag escaped as text |
| `<div @click="x">` | whole tag escaped as text |
| `<div x-on:click="x">` | `<div>` |
| `<div\r\n title="x">` | whole tag escaped as text |
| `<span/>after` | `&lt;span/&gt;after` |
| `a<wbr>b` | `a&lt;wbr&gt;b` |
| `a < b and c > d` | `a < b > d</b>` (the words "and c" are lost) |
| `display:flex;color:red` | `color:red` |
| `color: red !important` | **nil** (attribute removed) |
| `font-size: 1.5em` | `""` |
| `font-size: 150%` | kept |
| `margin: 0.5em 1em` | kept |
| `width: 10.5px` | `""` |
| `width: calc(…)` | `""` |
| `width: -10px` | `""` |
| `margin-top: -10px` | kept |
| `color: var(--itchio_link_color)` | kept |
| `color: hsl(120deg, 50%, 50%)` | kept |
| `color: rgb(1 2 3 / 50%)` | nil |
| `background: url('https://…')` | kept |
| `… no-repeat` appended | `""` |
| `background: linear-gradient(…)` | `""` |
| `border: none` / `border: 2px dashed` | `""` |
| `border: 2px dashed rgb(1,2,3)` | kept |
| `line-height`, `letter-spacing`, `font-family`, `font-weight`, `border-radius`, `position`, `float`, `display`, `transform`, `content`, `vertical-align` | removed |
| `COLOR: red` | `""` (property names are case-sensitive) |

## 4. itch-specific documentation and statements

- **Official CSS guide** (`https://itch.io/docs/creators/css-guide`, offline copy in the private repo, refreshed
  2026-10-08). Two points:
  - Classes must begin with `custom-`; "any other classes you provide will be stripped by the sanitizer".
  - Use the `<>` HTML mode, and keep editing in it, because the rich-text editor "may rewrite your markup and strip
    tags".
- **leafo (admin), thread `https://itch.io/t/1580976`.** Responding to a `style="float: right"` question, he said the
  allowed HTML/CSS is restricted for security, and inline CSS is limited to "a few simple properties". This matches
  §3.3: `float` is not whitelisted.
- **leafo (admin), 2023-05-18, `https://itch.io/t/2864176`.** All iframes in project descriptions and other
  developer-provided fields became click-to-activate. The exception is itch.io embeds. Comments and community posts
  already worked this way. The same post introduced highlighting of outbound links and warnings on suspicious links.
  A user reply notes that profiles and devlogs were not affected. leafo also says the outbound-link change only
  applies to "user-formatted content".
- **Community guide "itch.io's HTML basement"** (`https://speakthesky.itch.io/itchios-html-basement`, v2, 2022). It
  lists tags that worked and tags that got scrubbed. Its own saved markup is the evidence used in §5.4.

## 5. Live observations (sample of 2026-10-14)

### 5.1 Tags found inside user content (count / pages)

| Context | Tags present |
|---|---|
| project (53) | p, a, br, strong, li, img, code, em, ul, h1–h6, abbr, iframe (itch.io/embed only, 57), span, figure, div, details, summary, table/tbody/tr/td, hr, dl/dt/dd, pre, kbd, mark, u, blockquote, q, ol, del, cite, small, s, ruby/rt/rp, figcaption, sub, sup, button (itch-generated only) |
| profile (10) | p, br, a, span, img, strong, font (attribute-less), h1, h2, h3, li, em, ul, small, hr |
| devlog (12) | p, br, li, strong, img, a, h1–h4, ul, em, figure, span, iframe (YouTube **and** itch.io, not click-to-activate), div |
| jam (16) | p, strong, li, br, a, span, em, h1–h4, ul, div, details, summary, img, hr, table…, blockquote, ol, figure, figcaption, iframe (YouTube, not click-to-activate) |
| comments (2,036) | adds `b`, `i`, `strike`, and 172 `<font>` (Google-Translate artefacts) |

Never seen in any container: `svg`, `video`, `audio`, `source`, `picture`, `canvas`, `input`, `form`, `section`,
`article`, `header`, `footer`, `nav`, `style`, `script`, `caption`, `col`, `wbr`, `ins`, `center`.

### 5.2 Attributes

| Finding | Numbers |
|---|---|
| `id` attributes in user content | **0** in 2,127 containers |
| user-authored `data-*` / `aria-*` / `role` | **0**. The only ones are itch's own `button[itchio][data-embed_code][aria-label]` placeholders. |
| `class` tokens in the 91 non-comment containers | `text-center` (300+), `text-justify` (18), `custom-*` (many), `custom_*` (30, on one jam page), plus itch-generated `embed_preload youtube_preload/other_embed`, `embed_url`. **No other token.** Mixed lists survive (`text-center custom-main-text`). *(Verifier addition.)* In **comments**, `<span class="spoiler" tabindex="0">` (Redactor spoiler plugin) survives twice, so `spoiler` and `span[tabindex]` pass there; `details.toggle_post_body` in comments is itch-generated. |
| External links (not itch.io) | 533/533 (plus 5/5 `mailto:`) have `rel="nofollow noopener" referrerpolicy="origin"` |
| Links to `*.itch.io` | 291/291 have neither |
| `target` | kept verbatim: `_blank`, `_new`, even a URL value; never injected |
| `img` | 332/332 have `loading="lazy"`. Kept attributes: `src`, `alt`, `title`, `width`, `height`, `style`, `class`. |
| image hosts | 329/332 are `img.itch.zone` uploads. *(Verifier correction.)* External `src` kept unchanged: `http://i.creativecommons.org/…/88x31.png` in the descriptions of **two creator-103.itch.io pages** (game-76, game-77; **not** pizzadoggy cozy-tunes), plus one `https://encrypted-tbn0.gstatic.com/…` image in a comment. So there is no rehosting or proxying. |
| `href` schemes | https 792, http 32, mailto 5; **no relative or `#` hrefs** |
| `style` values | 149 non-empty (122 user-authored, 27 on itch's embed buttons), **0 end with `;`**; 9 are `style=""` |
| style properties (user-authored) | `color`, `font-size`, `background-color`, `text-align`, `width`, `height`, `margin-right`, `max-width`, all in §3.3. `background`+`background-size` appear only on itch's own embed buttons. |
| iframe attributes (live and inside `data-embed_code`) | `src`, `width`, `height` (incl. `100%`), `frameborder`, `allowfullscreen`, `scrolling`, `style`. Not seen: `allow`, `title`, `loading`, `sandbox`. |
| iframe hosts | `itch.io/embed/…` (kept live); `www.youtube.com`, `w.soundcloud.com`, `player.vimeo.com` (wrapped in click-to-activate buttons in projects and comments) |

### 5.3 Escaping fingerprint (text nodes, all containers)

| Item | Count |
|---|---|
| raw `'` | 0 |
| `&#x27;` | 1,930 |
| raw `"` | 0 |
| `&quot;` | 527 |
| raw `>` | 0 |
| `&gt;` | 351 |
| `&nbsp;` | 2,231 (the editor inserts it heavily) |

Browsers never serialize text this way, so the escaping is server-side and uses exactly web_sanitize's map. `&#x27;`
is hex, not `&#39;`.

### 5.4 Decisive single observations

- The guide page's demo `<a href="#header">` is stored as `<a rel="nofollow noopener" referrerpolicy="origin">`.
  The relative href was dropped, and rel was still injected because the original href isn't an itch URL. This is the
  same behaviour as the local probe.
- The guide demonstrates `<b>` and `<i>`, but the stored markup has `<strong>` and `<em>`. Its `<wbr>` uses inside
  `<code>` are stored as visible `&lt;wbr&gt;` (11×). *(Second verification: 9 of the 11 were real tags. Wayback
  captures from 2023-02 and 2024-05 serve them as `<wbr>`, plus auto-inserted `</wbr>`. The other 2 are deliberate
  mentions of the tag name. Since at least 2025-04-18 all 11 are escaped. In the same `<code>` blocks `<mark>` stayed a
  real tag, so the escaping comes from the sanitizer's whitelist and not from the editor encoding code. See §9.3.)*
- A SoundCloud embed's stray `</span>` inside `<iframe>` is stored as `&lt;/span&gt;` text in `data-embed_code`. That
  is the library's "escape unmatched closing tag" rule, so itch does **not** use `strip_tags`.
- The user's own bio (`mirokshi.itch.io`) keeps `<h1 class="custom-title">` with `<span class="custom-fs|fh|fp">`,
  `<h2 class="text-center">` and `<span class="custom-hello">`. The private repo also records `aria-hidden` being
  stripped on save (2026-10-08).
- `game.min.js` handles clicks with `button.embed_preload[itchio][data-embed_code]` and replaces the button with
  `data-embed_code` (it opens a new window when `crossOriginIsolated`). The Redactor defaults are:
  - plugins `source`, `table`, `alignment`, `video`, `details`, `spoiler`, `addimage`;
  - buttons `format`, `bold`, `italic`, `deleted`, `lists`, `link`;
  - a paste filter that removes `<img src="data:…">`;
  - a `?redactor=0` URL switch that skips Redactor initialisation.
- `game.css` contains `.user_formatted a[rel~=nofollow]:hover:after{content:"External link"…}` and a red ring on
  images inside such links. `user.css` (profile) has no such rule, and the profile bio container is
  `.user_profile.formatted`, which has no `user_formatted` class.
- Empty `<p></p>`: 40 occurrences in 17/91 containers.

### 5.5 Custom CSS text

| Page | Length | Notes |
|---|---|---|
| user's profile (`#custom_css`) | 4,725 | byte-identical to `dist/main.min.css` minus the trailing newline; raw `>` kept; 2 `@import` (Google Fonts + a Vercel host) kept |
| 9 other project pages | 45–10,073 | 3 of the 10 project/profile blocks exceed 5,120 chars (5,968; 9,967; 10,073 — the last two are the same creator); *(verifier correction)* `/* comments */` kept in **1** project block (6 comments). *(Second verification.)* Those lengths count each line break once (LF). The served bytes keep the **CRLF** line endings of the form submission, so the raw blocks are 6,219 / 10,478 / 10,574 chars. Without any whitespace they are still 5,339 / 8,324 / 8,431. |
| jam pages | up to **13,515** *(verifier correction; was 12,274)* | custom CSS is appended **inside `<style id="jam_theme">`** (no `#custom_css`) on **3 of 16** jams *(verifier correction; was 2)*: rpg-maker-themed-game-jam-17 (4,585 chars, 17 comments), furries (13,515, 1), goedware-game-jam-halloween-3 (12,274, 14). The plain theme output alone is ~1,700–1,960 chars. None of the 3 uses `#wrapper` scoping |
| any block | | `&gt;`/`&lt;` escapes: 0; `<`: 0 |

No `Content-Security-Policy` header on the profile response.

## 6. Reconstructed itch whitelist (best estimate)

| Item | Status | Confidence |
|---|---|---|
| web_sanitize default tags | allowed | observed (subset seen live) |
| `iframe`, `details`, `summary`, `figure`, `figcaption`, `del`, `ruby`, `rt`, `rp`, `font` | allowed (added by itch) | observed |
| `class` | `custom*` + `text-center`/`text-justify` (+ probably `text-right`) | observed |
| `style` (global) | `sanitize_style` | observed |
| `a[target]` | any value | observed |
| injected on external `a` | `rel="nofollow noopener"`, `referrerpolicy="origin"` | verified |
| injected on `img` | `loading="lazy"` | verified |
| `id`, `data-*`, `aria-*`, `role`, `on*`, `details[open]` | stripped | observed / community |
| `tabindex` | stripped per library model, **but** `span.spoiler[tabindex="0"]` survives in comments | observed (verifier) |
| `class="spoiler"` | kept in comments (editor spoiler plugin) | observed (verifier) |
| relative hrefs | stripped | verified (one live case + source) |
| disallowed tags | escaped as text (not removed) | observed (`<wbr>`: real tag in 2024, escaped text since 2025; §9.3) |
| tags itch added (`details`, `summary`, `figure`, `figcaption`, `del`, `ruby`/`rt`/`rp`, `font`) | 0 attributes on ~350 occurrences, even `class`/`style` | inferred from absence (§9.3) |

## 7. Open questions (need an itch account; see the structured output for probes)

1. Escape or strip for unknown tags (`<marquee>`, `<wbr>`, `<svg>`).
2. The exact class prefix rule and whether an empty `class` is dropped.
3. `aria-*` and `id` stripping on every page type.
4. `!important` and decimal units in `style` (does `style` vanish?).
5. Arbitrary iframe hosts, and attributes such as `allow`, `title`, `sandbox`.
6. Click-to-activate on profile bios.
7. Whether Redactor normalises unquoted attributes and CRLF before the server sees them.
8. `?redactor=0` on edit pages.
9. CSS editor handling of `</style>`, `javascript:`, `expression()`, http `@import`, and comments; the real cap and how
   it is counted.
10. Whether HTML comments are escaped or stripped.
11. Behaviour for accounts without CSS access.

## 8. Verification (2026-10-14)

An adversarial verifier re-checked every fact against primary sources in the same session, without browser tools.

### 8.1 Method

| Step | What was done |
|---|---|
| Library source | Fresh `git clone https://github.com/leafo/web_sanitize`, checked out `1ca8317` (2026-09-29). Read `whitelist.moon`, `css.moon`, `css_types.moon`, `css_whitelist.moon`, `html.moon`, `patterns.moon`, README, `spec/css_spec.moon`, `spec/web_sanitize_spec.moon`. |
| Local probes | Own harness `sanitizer/verify_ws.py` (85 cases), fresh `pygy/LuLPeg` clone `f07f5be`, lupa 2.8 LuaJIT. 8/8 spec sanity vectors pass. Results: `sanitizer/ws_verify.json`. Key results were also hand-traced through the LPeg grammar, so they don't depend on LuLPeg quirks. |
| Live re-fetch | 20 itch GETs at 1.5 s spacing, desktop Chrome UA, robots.txt re-read: mirokshi profile, html-basement guide, cozy-tunes, game-60, devlog 1706784, terror-jam, rpg-maker jam 17, goedware jam, creator-56 profile, game-21, creator-103 game-76, threads `t/1580976` and `t/2864176`, the CSS guide. Also `static.itch.io/{game.css,user.css,jam.css,game.min.js,user.min.js}?1791974461` (the asset version moved from `?1791970861` during the day). |
| Re-count | Own analyzer `sanitizer/vanalyze.py`, written independently of `analyze.py`, run over the first agent's raw corpus (scratchpad) and the fresh pages: `python -I vanalyze.py <dirs>`. |
| Other sources | `gh api repos/leafo/web_sanitize/issues/2` (+ comments); `raw.githubusercontent.com/leafo/streak.club/b5b4679/helpers/html.moon`. |

The independent re-count reproduced exactly these numbers:

- 2,127 containers (10 / 53 / 12 / 16 / 2,036);
- 0 ids;
- 0 raw `'` `"` `>` in text;
- `&#x27;` 1,930, `&quot;` 527, `&nbsp;` 2,231;
- external links 533/533 and mailto 5/5 with `rel="nofollow noopener" referrerpolicy="origin"`, itch links 291/291 with neither;
- `img[loading=lazy]` 332/332;
- style values: 149 without a trailing `;`, 9 empty;
- `<p></p>` 40 in 17/91 containers;
- custom_css lengths 5,968 / 9,967 / 10,073.

The fresh pages agree: external 114/114 with rel, itch 68/68 without, 38/38 lazy images, and no ids.

### 8.2 Errors found and fixed above

- **§3.3:** `behavior:url(x)` does not fail parsing. It is a function token and only that declaration is dropped. The
  first agent's actual probe was `behavior: url(x.htc)`, which fails because of the `.`.
- **New `nil` causes, added to §3.3:**
  - trailing whitespace: `color: red ` → nil, and `color: red; ` → nil;
  - CR between declarations;
  - decimal percentages such as `width: 50.5%`.
- **§5.2 external images:** the `i.creativecommons.org` badge is on the two **creator-103.itch.io** pages, not on
  pizzadoggy cozy-tunes; it is still there on today's fetch of game-76. There is also one external gstatic
  image in a comment. Itch-hosted: 329/332 overall, 300/302 outside comments.
- **§5.5 comments:** only **1** project custom_css block contains `/*` (6 comments); "3 blocks (5–6 each)" was wrong.
- **§5.5 jam custom CSS:** it is appended to `jam_theme` on **3** of 16 jams (adds `jam/furries`, 13,515 chars), so
  the maximum is 13,515, not 12,274.
- **Spoiler markup in comments:** `<span class="spoiler" tabindex="0">` survives in comments, so `tabindex` is not
  universally stripped and `spoiler` is an allowed class there.
- **Fact 30:** itch's `user.css` has `.user_page .user_profile.formatted{font-size:1.1428571429em}` and
  `.user_page .user_profile.formatted h1{font-size:2em}` (h2 1.5em, h3 1.25em, h4 1.125em, h5/h6 1em). These outrank
  `.formatted h1{font-size:18px}`, so a bio `<h1>` is about 32 px, not 18 px.

### 8.3 Additional observations

- **itch's internal-link test is by host, not substring.** Links to `craftpix.net/?utm_source=itch.io`,
  `furrygamejam.com/?utm_source=itch.io`, and a YouTube URL whose query contains `creator-107.itch.io` all got
  `rel="nofollow noopener"`. The library's spec example would have exempted them, because it uses a substring match.
- **Style declarations are kept verbatim.** The guide's demo `<mark style="background-color:lightGreen;" >` is stored as
  `<mark style="background-color:lightGreen">`: the trailing `;` is removed and the original spacing kept. That is
  exactly `sanitize_style`'s behaviour. Multi-declaration user styles are always joined with `"; "` (65/65).
- **Placeholders.**
  - `game.css`, `user.css` and `jam.css` also define `.embed_preload.twitch_preload` ("Click to activate Twitch video").
  - `other_embed` buttons carry `title="<iframe src>"` and `style="height: 168px; width: 300px"`.
  - YouTube placeholders are `width: 250px; height: 140px`.
- **External-link badge scope.** `jam.css` and `user.css` have **no** `a[rel~=nofollow]` "External link" rule; only
  `game.css` (project and devlog pages, including comments there) has it. The hover ring targets only **direct-child**
  images (`a[rel~=nofollow]:hover>img`).
- **Visually empty paragraphs.** `<p><br></p>` (96 in 27/91 containers) is more common than `<p></p>` (40 in 17), and
  `:empty` does not match it.
- **Thread `t/2864176`.** The "profiles and devlogs unaffected" report is by a user, dated 2023-07-04. A user post dated
  2026-06-17 reports that custom CSS can hide the "External link" warning.
- **Iframe markup.** Live iframes in the devlog and jam descriptions carry `allowfullscreen=""` (DOM-serialized form).
  That hints that the editor round-trips markup through the browser DOM before submitting; this is unproven.
  *(Second verification.)* There is counter-evidence. The decoded YouTube and Vimeo embeds on creator-103
  game-76 keep a bare `allowfullscreen`, so not every save is DOM-serialized.
- **Docker.** The daemon is not running, so the real C-LPeg cross-check is still open.

### 8.4 Verdicts

| Fact | Verdict | Confidence after check | Note |
|---|---|---|---|
| 01 | confirmed | inferred | fingerprints re-counted; itch's rel test is host-based (stricter than spec example) |
| 02 | confirmed | documented | guide text + live bio classes |
| 03 | confirmed | observed | 334 text-center / 18 text-justify; `.text-right` in all 3 sheets; `spoiler` survives in comments |
| 04 | confirmed | observed | 30 `custom_*` on rpg-maker jam 17 |
| 05 | confirmed | observed | 0 ids; 6 `a[name]`; 10 absolute ToC links |
| 06 | corrected | observed | live: `#header` and one other relative href dropped; tel:/javascript:/uppercase/leading-space only from library |
| 07 | confirmed | verified | fresh 114/114 + corpus 533/533; author `rel` loss is library-inferred |
| 08 | confirmed | verified | rules in game.css only; direct-child img |
| 09 | corrected | observed | `span.spoiler[tabindex=0]` survives in comments |
| 10 | confirmed | observed | target `_blank` 423, `_new` 2, URL 1 |
| 11 | confirmed | verified | 332/332 + 38/38 |
| 12 | corrected | observed | wrong page cited; 329/332 |
| 13 | confirmed | observed | tag list reproduced |
| 14 | confirmed | community | guide list re-read; `<wbr>` live-escaped |
| 15 | confirmed | observed | `&amp;lt;/span&amp;gt;` and 11× `&lt;wbr&gt;` re-seen |
| 16 | confirmed | documented | issue #2 (leafo, 2022-04-09) re-read |
| 17 | confirmed | inferred | library-only; no itch test |
| 18 | corrected | inferred | in practice only `br`/`img`/`hr` (others not whitelisted) |
| 19 | confirmed | inferred | library-only |
| 20 | confirmed | documented | README `strip_comments` default false |
| 21 | confirmed | observed | 27 props counted; leafo quote re-read |
| 22 | corrected | inferred | more nil triggers (trailing space, CR, decimal %) |
| 23 | corrected | inferred | font-size accepts keywords; `width:50.5%` kills the whole attribute |
| 24 | confirmed | verified | buttons + game.min.js handler re-seen |
| 25 | confirmed | observed | fresh devlog + jam pages: raw iframes, 0 placeholders |
| 26 | confirmed | observed | decoded 31 embed codes |
| 27 | confirmed | community | 0 `details[open]` |
| 28 | confirmed | observed | basement `<b>` demo stored as `<strong>` |
| 29 | confirmed | observed | config, paste filter, `redactor=0` re-seen in `?1791974461` |
| 30 | corrected | verified | bio h1 = 2em (~32px) |
| 31 | confirmed | observed | 40 in 17/91 reproduced |
| 32 | confirmed | verified | 4,725 = dist minus trailing `\n` |
| 33 | corrected | observed | 1 project block with comments; jam max 13,515 |
| 34 | corrected | observed | 3 of 16 jams |
| 35 | confirmed | documented | css.moon exports only `sanitize_style` |
| 36 | confirmed | inferred | kept attrs seen live; dropped ones library-only |
| 37 | confirmed | observed | 4 `<font>` in creator-56 bio, 172 in comments |
| 38 | corrected | verified | `&` + letters/digits is left raw (`R&D`) |
| 39 | confirmed | documented | guide + leafo post |
| 40 | confirmed | inferred | — |
| 41 | confirmed | verified | raw `&` (game-21) and `&amp;` (game-62) both in output |
| 42 | confirmed | observed | navigation to `a[name]` is per HTML spec, not clicked |

### 8.5 Reproduce the verification

```bash
git clone https://github.com/leafo/web_sanitize && git -C web_sanitize checkout 1ca8317
git clone https://github.com/pygy/LuLPeg     # f07f5be
python -m venv venv && venv/Scripts/python -m pip install lupa==2.8
venv/Scripts/python -I knowledge/evidence/sanitizer/verify_ws.py web_sanitize LuLPeg ws_verify.json
python -I knowledge/evidence/sanitizer/vanalyze.py <dir-of-saved-pages> > stats.json
```

## 9. Verification (2026-10-14, second pass)

A second adversarial verifier re-checked all 42 facts from primary sources, independently of §8. It used new
clones, a new harness and analyzer, and fresh fetches. No browser tools were used and nothing was logged in.

### 9.1 Method

| Step | What was done |
|---|---|
| Library source | `git clone https://github.com/leafo/web_sanitize`, then `git checkout 1ca8317` (2026-09-29, `VERSION: "1.8.0"`). Read `whitelist.moon`, `css.moon`, `css_types.moon`, `css_whitelist.moon`, `html.moon`, `patterns.moon`, `init.moon`, README (Security note, options, changelog 1.4.0–1.8.0) and the spec test "injects attributes on tags by function". |
| Local probes | `sanitizer/v2_probe.py`: own harness with 7/7 spec sanity vectors. It runs 43 HTML cases on the default whitelist and on an itch-like clone (`style` = `sanitize_style`, `a[target]`, host-based `rel` function, `img` `loading=lazy`), plus 52 `sanitize_style` cases. Runtimes: lupa 2.8 default **Lua 5.5**, and **LuaJIT 2.1** (`LUPA_JIT=1`), with a fresh `pygy/LuLPeg` at `f07f5be`. The two runtimes agree on 137/137 outputs. Results: `sanitizer/v2_probe_results.json`. |
| Live re-fetch | **21 itch GETs**, 1.5 s apart, desktop Chrome UA, robots.txt re-read (unchanged). Pages: mirokshi profile, html-basement guide, cozy-tunes, game-60, devlog 1706784, terror-jam-2026, rpg-maker jam 17, goedware jam, jam/furries, creator-56 profile, game-21, creator-103 game-76, threads `t/1580976` (one `429`, retried after 5 s) and `t/2864176`, the CSS guide. Statics: `static.itch.io/{game.css,user.css,jam.css,game.min.js}?1791981660` (the asset version moved again). |
| Re-count | `sanitizer/v2_analyze.py`, written independently, run over the first agent's raw corpus (scratchpad `sanitizer/live/all`) and over the fresh pages. |
| History | Wayback CDX (`web.archive.org/cdx/search/cdx?url=speakthesky.itch.io/itchios-html-basement&output=json&filter=statuscode:200&collapse=timestamp:6`) plus raw `id_` captures 20230202232638, 20240504205022, 20250418054119, 20251122175427, 20260413163757 and 20260610184616. Some came back gzip-encoded; they were decompressed with `gzip -dc`. |
| Other | `gh api repos/leafo/web_sanitize/issues/2` (+ comments); `raw.githubusercontent.com/leafo/streak.club/b5b4679/helpers/html.moon`; `v2_pairs_order_{lua55,luajit}.py` run 12–20 times each. |

The re-count over the first agent's corpus reproduced these numbers exactly:

- 2,127 containers;
- 0 ids;
- 0 raw `'` `"` `>` in text;
- `&#x27;` 1,930 (and `&#39;` 0), `&quot;` 527, `&nbsp;` 2,231;
- external links 533/533 and mailto 5/5 with `rel="nofollow noopener" referrerpolicy="origin"`, itch links 291/291 with neither;
- `img[loading=lazy]` 332/332, with image hosts img.itch.zone 329, i.creativecommons.org 2 and gstatic 1;
- style values: 158 in total, 9 empty, 0 with a trailing `;`;
- `<p></p>` 40 in the 91 non-comment containers, and `<p><br></p>` 96;
- `details[open]` 0;
- `target`: `_blank` 423, `_new` 2, one URL value;
- `text-center` 335, `text-justify` 18, `custom_*` 30;
- user-authored style properties: `color`, `font-size`, `background-color`, `text-align`, `width`, `height`,
  `margin-right` and `max-width` (all whitelisted).

Fresh pages, 333 containers: external links 128/128 with both attributes, itch links 99/99 with neither, 40/40 lazy
images, 0 ids, 0 raw quotes.

### 9.2 Corrections made to this file

- **§5.4 `<wbr>`.** Of the 11 escaped `&lt;wbr&gt;`, 9 were real tags in 2023–2024 and 2 are deliberate mentions. The
  history is in §9.3.
- **§5.5 lengths.** Stored custom CSS keeps CRLF line endings. Raw served lengths are 6,219 / 10,478 / 10,574; the
  quoted 5,968 / 9,967 / 10,073 count LF only.
- **§3.2 edge case.** In a browser, the stray `</div>` closes itch's own container, so user HTML *can* close an itch
  wrapper.
- **§8.3 iframe markup.** A bare `allowfullscreen` survives in some decoded embeds, so not every save is
  DOM-serialized.
- **§6.** Escaping of disallowed tags is now directly observed. Added a row for the tags itch added, which never carry
  attributes.
- **§1.** Added the two new fingerprints and the render-time inference.

### 9.3 New observations

**1. The injected attribute order changes per request.**

On every page, all external links share one order: `rel` before `referrerpolicy`, or the reverse. Mixed order was seen
on 0 of 86 pages. But the same page fetched at different times today flips:

| Page | ~12:20 | 12:43 | 15:08 |
|---|---|---|---|
| game-60 | rp-first | rel-first | rel-first |
| cozy-tunes | n/a | rel-first | rp-first |
| goedware jam | rel-first | rel-first | rp-first |
| terror-jam | rel-first | rp-first | rel-first |
| creator-56 profile | n/a | rp-first | rel-first |

The basement guide's description is byte-identical in the 2025-04, 2025-11, 2026-04, 2026-06 and 2026-10-14 captures
once all 47 links are normalized to one order. The 2026-04 and 2026-06 captures use rp-first; the others use
rel-first.

`pairs()` over `{rel=…, referrerpolicy=…}` gives a different order per process locally: LuaJIT 2.1 split 6/6 over 12
processes, and Lua 5.5 split 4/16 over 20. web_sanitize's `inject_attributes` iterates exactly such a table with
`pairs`.

Conclusion (inferred): the stored HTML is sanitized again on output, per request or per cache fill, by Lua workers.
That is a further web_sanitize fingerprint, and it means whitelist changes reach old content.

**2. History of `<wbr>`.**

- In the 2023-02 and 2024-05 captures, the guide's 9 `<wbr>` are served as tags, followed by auto-inserted
  `</wbr></wbr></wbr>`. That is web_sanitize closing a whitelisted tag that isn't in `self_closing`.
- From 2025-04-18 to today, they are served as visible `&lt;wbr&gt;`.
- `<mark>` inside the same `<code>` blocks stayed a real tag. So the change comes from the whitelist and not from the
  editor encoding code.
- The guide's own claim that `<wbr>` "works" is therefore outdated. The page content changed between 2024-05 and
  2025-04, so this alone does not tell whether the change was applied at save time or at render time.

**3. `rel` injection needs an `href` in the source.**

- 7 anchors that never had an `href` got no `rel`. Six are `<a name>`; the seventh is an `<a target="https://…">`
  whose author put the URL in `target`.
- `<a href="#header">` lost its `href` but still got `rel="nofollow noopener" referrerpolicy="origin"`.
- `http://` links to itch.io were treated as internal: 20/20 had no `rel`.
- Links to other hosts with `itch.io` in the query string got `rel`.

**4. Tags that itch added never carry attributes in the sample.**

These tags are not in the library whitelist: `details` 57, `summary` 57, `figure` 47, `figcaption` 4, `del` 3,
`ruby`/`rt`/`rp` 4 and `font` 176. None had any attribute. By contrast, in project descriptions `p` carries `class` in
205 of 1,064 cases and `div` carries `class` in 33 of 37. In the library, a tag added after `clone()` as `true` drops every attribute, including global
ones. This is inferred and needs an account probe.

**5. Custom CSS blocks.**

- All 13 `custom_css` blocks start and end without whitespace.
- Project blocks keep CRLF line endings, while jam custom CSS in `jam_theme` uses LF.
- The attribute order is `<style type="text/css" id="custom_css">`.
- Comments appear in 1 project block (6 comments) and in 3 jam blocks (17, 14 and 1).

**6. Community guide versus facts.**

- The basement guide's scrubbed list does **not** include `<center>`, `<button>` or `<wbr>`.
- It says `<iframe>` is scrubbed except for some widget hosts (Spotify, YouTube, itch).
- It says `open` is scrubbed from `<details>`.

**7. Forum quotes.**

- leafo's post 4264795 (2021-08-14, user_id 1) says only "a few simple properties" may be inlined. It does not
  mention `float` by name.
- The 2023-05-18 announcement (post 7811314) confirms click-to-activate iframes, outbound-link and image
  highlighting, and "user-formatted content" scope.

### 9.4 Verdicts (second pass)

| Fact | Verdict | Confidence | Note |
|---|---|---|---|
| 01 | confirmed | inferred | fingerprints re-counted; plus `pairs()` order flips and `</wbr>` auto-closers |
| 02 | confirmed | documented | guide text re-read; live bio classes |
| 03 | confirmed | observed | 335/18; `.text-right` in game, user and jam css |
| 04 | confirmed | observed | 30 `custom_*` on rpg-maker jam 17, mixed with `text-center` |
| 05 | confirmed | observed | 0 ids; a[name] ×6; absolute ToC links |
| 06 | corrected | observed | only `#…` hrefs proven live (2); other schemes are library-only |
| 07 | confirmed | verified | counts reproduced; authored `rel` loss is library-only; needs `href` |
| 08 | confirmed | verified | game.css only; ring on direct-child `img` only |
| 09 | corrected | observed | `span.spoiler[tabindex=0]` survives in comments |
| 10 | confirmed | observed | `dir` is from source only |
| 11 | confirmed | verified | 332/332 + 40/40 |
| 12 | corrected | observed | CC image is on creator-103, not cozy-tunes; 329/332 itch-hosted |
| 13 | confirmed | observed | tag union reproduced |
| 14 | corrected | inferred | guide does not list `wbr`/`center`/`button`; library escapes them |
| 15 | corrected | observed | 9 real `<wbr>` (proven by Wayback) now escaped; `&lt;/span&gt;` in embed |
| 16 | confirmed | documented | issue #2 (leafo 2022-04-09); local test |
| 17 | confirmed | inferred | library-only, reproduced in 2 runtimes |
| 18 | corrected | inferred | in practice `br`/`img`/`hr` only |
| 19 | corrected | inferred | stray `</div>` from `< div >` closes itch's container in browsers |
| 20 | confirmed | documented | README default `strip_comments=false`; 0 comments in sample |
| 21 | corrected | observed | leafo didn't name `float`; the list of 27 is right |
| 22 | corrected | inferred | also nil: trailing whitespace, CR, decimal %; bare `url(x)` is only dropped |
| 23 | corrected | inferred | `font-size` accepts any ident (`auto`, `large`, even `-10px`); `width:50.5%` wipes the whole attribute |
| 24 | confirmed | verified | buttons, sizes and `game.min.js` handler re-seen |
| 25 | confirmed | observed | fresh devlog + terror-jam: raw YouTube iframes |
| 26 | corrected | observed | host allowlist unknown; community guide says widget hosts only |
| 27 | confirmed | community | guide states `open` scrubbed; 0/60 `details[open]` |
| 28 | confirmed | observed | — |
| 29 | confirmed | observed | config, paste filter and `redactor=0` re-seen in `?1791981660` |
| 30 | corrected | verified | bio h1 = 2em of ~16px (~32px); devlog section also has `base_widget` |
| 31 | confirmed | observed | 40 `<p></p>`; `<p><br></p>` 96 not matched by `:empty` |
| 32 | confirmed | verified | 4,725 = dist minus trailing LF; 1 `>`, 2 `@import` |
| 33 | corrected | observed | comments: 1 project + 3 jam blocks; CRLF-inclusive lengths |
| 34 | corrected | observed | 3 of 16 jams |
| 35 | confirmed | documented | css.moon exports only `sanitize_style` |
| 36 | confirmed | inferred | table/td width live; dropping of `border`/`cellpadding`/`align` is library-only |
| 37 | confirmed | observed | itch-added tags carry no attributes at all |
| 38 | corrected | verified | `&` + letter/digit/`#` passes raw (`R&D` stays `R&D`) |
| 39 | confirmed | documented | guide + leafo posts |
| 40 | confirmed | inferred | — |
| 41 | confirmed | verified | raw `&` (game-21) and `&amp;` (game-62) |
| 42 | confirmed | observed | markup observed; navigation per HTML spec, not clicked |

### 9.5 Reproduce the second pass

```bash
git clone https://github.com/leafo/web_sanitize && git -C web_sanitize checkout 1ca8317
git clone https://github.com/pygy/LuLPeg                       # f07f5be
python -m venv venv && venv/Scripts/python -m pip install lupa==2.8
venv/Scripts/python -I knowledge/evidence/sanitizer/v2_probe.py web_sanitize LuLPeg out_lua55.json
LUPA_JIT=1 venv/Scripts/python -I knowledge/evidence/sanitizer/v2_probe.py web_sanitize LuLPeg out_jit.json
for i in $(seq 12); do venv/Scripts/python -I knowledge/evidence/sanitizer/v2_pairs_order_luajit.py; done | sort | uniq -c
venv/Scripts/python -I knowledge/evidence/sanitizer/v2_analyze.py <dir-of-saved-pages> > stats.json
# attribute order per page (repeat the fetch later and compare):
grep -o 'rel="nofollow noopener" referrerpolicy="origin"' page.html | wc -l
grep -o 'referrerpolicy="origin" rel="nofollow noopener"' page.html | wc -l
# wbr history:
curl -s "https://web.archive.org/web/20240504205022id_/https://speakthesky.itch.io/itchios-html-basement" | grep -c '<wbr>'
```
