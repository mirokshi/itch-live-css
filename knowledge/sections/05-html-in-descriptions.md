## HTML in bios and descriptions (sanitizer)

This section covers the HTML you write in itch's rich-text fields and what itch's server-side sanitizer keeps, rewrites or destroys. The fields are the profile bio, the project/game description, devlog posts and jam descriptions. That stored markup is what your custom CSS targets.

The CSS editor is a separate path and is **not** run through this sanitizer. Its text is served inside `<style id="custom_css">` with no automatic `#wrapper` scoping, no minification and no escaping of `>` or quotes **[verified 2026-10-14 · itchcss-52]**. On a project and on the profile, itch only trims leading and trailing whitespace and deletes every `</style>`; line breaks are stored as CRLF on the project and LF on the profile **[verified 2026-10-16 · live-css, live-c42 to live-c44]**.

> **How sure is this?** itch publishes **no** tag or attribute allowlist; the guide only says "a subset of HTML" **[documented · docs-36]**. Everything below rests on four kinds of evidence, and the tags keep them apart:
>
> 1. **The official CSS guide.** It documents only the `custom-` class rule and the advice to stay in HTML mode.
> 2. **A census of stored HTML on live pages.** The sanitizer corpus has 2,127 containers. This section re-counted 48 bios, 96 project descriptions, 18 devlog posts, 50 jam descriptions and 3,749 comment bodies (Section notes N1–N9). A later gap-fill pass widened the census to 50 bios, 145 project pages, 22 devlog posts, 99 jam descriptions and 5,647 comments, which hold 35,801 authored opening tags (gapfill05-01 … gapfill05-09 in `evidence/gapfill.md`).
> 3. **A library model.** itch's output matches leafo's open-source Lua library `web_sanitize` running with an itch-specific whitelist **[inferred · sanitizer-01]**. Rules tagged "library model" were reproduced locally against that library, not on itch.
> 4. **Two live probe runs.** On 2026-10-16 the account owner saved the probe kit (`probes/probe-description.html`) in a draft project's description, in HTML mode, and read the page back logged in (Brave 155). 147 of 155 probes matched the library model; the 8 differences are folded in below. The same day the owner saved the 33-probe bio set (`probes/probe-bio.html`) in the profile bio and read it back logged in and logged out: every bio probe gave the project-description result, except that bio iframes stay live (§9). Tags `[verified 2026-10-16 · live-<id>]` hold for **project descriptions**, and for **bios** only where the text says so **[verified 2026-10-16 · live-html]**.
>
> Devlog posts and jam descriptions are still untested on an account, and so is anything in a bio outside the 33-probe set. For them, "stripped" below usually means two things together: it was never seen in stored HTML, **and** the library drops it.

---

### 1. Rules of thumb

1. **Do** give every element you want to style a class that starts with a lowercase `custom-`, and target it as `#wrapper .custom-x`. itch strips any other class you write, in project descriptions and bios **[documented · docs-34, sanitizer-02; verified 2026-10-16 · live-k01, live-k02, live-k16 to live-k19, live-k26 to live-k28; bios: live-k01, live-k16, live-k26]**. Uppercase after the prefix survives **[observed · gapfill05-03; verified 2026-10-16 · live-k21]**. On a project description any characters may follow the prefix: Tailwind-style tokens such as `custom-md:flex`, `custom-w-1/2` or `custom-w-[3px]` survive, and escaped selectors such as `.custom-hover\:x` and `.custom-w-\[3px\]` match them **[verified 2026-10-16 · live-k07 to live-k15, live-k20, live-c38, live-c39]**. A bio keeps `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2` and `custom:flex` too, and the escaped selectors match there **[verified 2026-10-16 · live-k07, live-k09, live-k11, live-k14, live-c38, live-c39]**. On devlogs and jams such tokens are untested, so keep to letters, digits, `-` and `_` there.
2. **Do** write markup in the editor's HTML mode (the `<>` button) and keep editing there. The visual editor "may rewrite your markup and strip tags you have added" **[documented · docs-35]**. Paste with Ctrl+V; a context-menu paste reportedly isn't registered before Save **[community · community-22]**.
3. **Never** rely on `id`, `data-*`, `aria-*`, `role`, `on*`, `tabindex`, `popover` or `popovertarget` in your own markup. None appears in 35,801 authored tags, and the library drops them all. Only itch's own spoiler `tabindex` and image-lightbox `data-*` occur **[observed · sanitizer-05, sanitizer-09, repo-28, gapfill05-06]**. A project-description save drops them all, plus `hidden`, `inert`, `accesskey`, `contenteditable`, `draggable` and `translate`; `tabindex` survives only on a `span.spoiler`, hand-written ones included **[verified 2026-10-16 · live-a01 to live-a07, live-a11 to live-a20, live-k34]**. A bio save drops `id`, `data-*`, `aria-hidden`, `aria-label`, `role` and `popover` as well, and keeps the spoiler's `tabindex` **[verified 2026-10-16 · live-a01, live-a02, live-a04, live-a05, live-a12, live-a20, live-k34]**.
4. **Do** keep inline `style=""` to the library's 27-property list, with simple values: integer units, comma colour syntax, no `!important`, nothing after the last declaration, no line break inside the attribute. Anything else belongs in the CSS editor behind a `custom-` class. 21 of the 27 properties are seen live, and nothing outside the list has ever been stored. That the list is exactly 27 is library model **[observed · gapfill05-09; library model · sanitizer-21; inferred · sanitizer-22, sanitizer-23]**. On a project description every property and value tested behaved as the library predicts, the six never-seen properties included **[verified 2026-10-16 · live-s01 to live-s30]**, except that a line break between declarations drops the whole attribute **[verified 2026-10-16 · live-s31]**. A bio save matched on the four style probes it carried **[verified 2026-10-16 · live-s02, live-s08, live-s11, live-s18]**.
5. **Do** write link targets and image sources as absolute, lowercase `https://` URLs. A `#fragment` href is deleted **[observed · sanitizer-06, sanitizer-12]**; on a project description so are relative, `javascript:`, `tel:`, `data:`, upper-case-scheme and leading-space hrefs, and a relative image `src` **[verified 2026-10-16 · live-l03 to live-l08, live-l11, live-g09]**.
6. **Never** paste tags such as `<svg>`, `<section>`, `<style>`, `<script>` or `<button>`. Expect them to show up as **literal visible text**, not to vanish quietly **[inferred · sanitizer-14; observed · sanitizer-15; verified 2026-10-16 · live-t13, live-t19, live-t20, live-a13]**. `<wbr>` and `<video controls>` do survive on a project description (§4) **[verified 2026-10-16 · live-t11, live-t14]**.
7. **Do** quote every attribute value with `"`, keep each opening tag on one line, and close every non-void tag explicitly: `<span class="custom-x"></span>`, never `<span/>` **[library model · sanitizer-16, sanitizer-17, sanitizer-18]**. On a project description an unquoted `width=40%`, a line break inside a tag and `<span/>` each turned the whole tag into visible text, and in a bio the unquoted `width=40%` did too **[verified 2026-10-16 · live-g07, live-e06, live-t12]**.
8. **Do** write `alt` on every `<img>` yourself. itch injects `loading="lazy"` but never `alt` **[verified · community-20, sanitizer-11; verified 2026-10-16 · live-g01 to live-g04]**.
9. **Do** write `&lt;` for a literal `<` and `&amp;` for a literal `&`. A raw `< div` in prose injects a stray `</div>` that closes itch's own container **[inferred · sanitizer-19, sanitizer-38; verified 2026-10-16 on a project description · live-e07, live-e08]**.
10. **Never** name a class `custom-ad…`, `custom-social…`, `custom-share…` or `custom-cookie…`. Ad-blocker cosmetic lists hide exact names such as `custom-ad`, `custom-cookie-banner` or `custom-social` on every site (the table below lists them); the prefixes are a safety margin **[verified · external-30, external-51]**.
11. **Never** put `<!-- comments -->` in itch HTML: they are shown as visible text, in project descriptions and bios. Keep notes in your local copy **[library model · sanitizer-20; verified 2026-10-16 · live-e04]**.
12. **Do** keep a profile bio's HTML within 5,000 characters as you submit it: 5,001 is refused with an error on the edit page, and what itch adds when serving doesn't count (§13) **[verified 2026-10-16 · live-cap-D1, live-cap-D2]**. Only ASCII was tested, so with non-ASCII text keep both the character and the UTF-8 byte count within 5,000. Back up every HTML and CSS change to a local file **[community · community-22]**.

---

### 2. Where your HTML lands: the containers to scope to

Each field is stored inside a container element whose classes were identical on every sampled page. Scope your rules to the container, not to bare tags.

| Field | Stored container | Page loads | Scope rules as | itch's `.user_formatted …` rules apply? |
|---|---|---|---|---|
| Profile bio | `div.user_profile.formatted` | `user.css` | `#wrapper .user_profile …` | **No**. Only `.formatted …` rules apply. |
| Project description | `div.formatted_description.user_formatted` | `game.css` | `#wrapper .formatted_description …` | Yes |
| Devlog post body | `section.object_text_widget_widget.base_widget.user_formatted.post_body` | `game.css` | `#wrapper section.post_body …` | Yes |
| Jam description | `div.jam_content.user_formatted` | `jam.css` | `#wrapper .jam_content …` | Yes |
| Community comments | `div.post_body.user_formatted` | (host page) | not your content; leave it alone | Yes |

All rows: **[observed 2026-10-14 · N1, N2]**; the project and bio containers also **[verified 2026-10-16 · live-html]**.

- On devlog pages, comments also carry `.post_body`, but on a `div`. `section.post_body` selects only the post.
- The bio container has `.formatted` but **not** `.user_formatted`. So itch's spoiler styling, table borders and the `.user_formatted img, .user_formatted iframe{max-width:100%;border:0}` rule don't reach bio content. `.formatted img{max-width:100%}` and `.formatted img[width][height]{height:auto}` do **[observed · N2; verified · sanitizer-11]**. A live bio save confirms the spoiler case: a hand-written spoiler is not hidden there **[verified 2026-10-16 · live-k34]**. Bio iframes stay live (§9), and itch's `.user_formatted iframe` rule misses them, so size them yourself **[inferred · N2]**.
- The bio has its own type scale in `user.css`: the container is 1.1428571429em, and a bio `h1` is 2em of that (≈32 px), `h2` 1.5em, `h3` 1.25em, `h4` 1.125em **[verified · repo-26; N2]**.

---

### 3. Status matrix: what is live-verified, library-only or unknown

| Behaviour | Seen on itch (live) | Library model only | Unknown / untested |
|---|---|---|---|
| Non-`custom` classes stripped | Guide says so. No foreign token survives in descriptions or bios except itch's own. 0 in 1,204 authored `custom*` tokens plus the editor's tokens (gapfill05-03). Project description: `Custom-a`, `CUSTOM-b`, `-custom-f`, `md:custom-g`, `!custom-h`, `xcustom-i`, `foo`, `button`, `inner_column` and `text-left` dropped; an empty or bare `class` removed (live-k01, live-k02, live-k16 to live-k19, live-k22, live-k26 to live-k28, live-k31 to live-k33). Bio: `Custom-a`, `-custom-f` and `foo` dropped, and an all-invalid `class` removed (live-k01, live-k16, live-k26, live-k31). | The default whitelist has no `class` at all | Devlogs, jams; bio tokens outside the bio set |
| `custom-`, `custom_`, `customfoo` kept | All three seen. Uppercase **after** the prefix kept: 74 tokens on 3 pages (gapfill05-03). Project description: `customc`, `custom_d`, `customer`, a bare `custom-`, `custom-Hero`, non-ASCII and tokens with `: / [ ] .` kept, so the test is a case-sensitive prefix `custom` (live-k03 to live-k15, live-k20, live-k21). Bio: `customer`, `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2` and `custom:flex` kept (live-k05, live-k07, live-k09, live-k11, live-k14). | — | Devlogs, jams; bio tokens outside the bio set |
| `id`, `data-*`, `aria-*`, `role`, `popover*` removed | 0 user-authored in 35,801 tags (gapfill05-06). aria-hidden removed from a bio on save (owner note, 2026-10-08). Project description: all removed (live-a01 to live-a05, live-a12, live-a14). Bio: `id`, `data-*`, `aria-hidden`, `aria-label`, `role` and `popover` removed (live-a01, live-a02, live-a04, live-a05, live-a12, live-a20). | Yes | Devlogs, jams; `popovertarget` in bios |
| Inline `style` limited to the 27-property list | 21 of the 27 seen; 0 of 680 attributes outside the list; all 207 distinct values are library fixed points (gapfill05-09). Project description: the six never-seen properties kept, and every tested property outside the list dropped (live-s01 to live-s30). Bio: the six kept, `float` and `border-radius` dropped, and `!important` removes the attribute (live-s02, live-s08, live-s18). | The list itself, and "dropped" claims for untested properties | Whether itch customised the list. Whether CSS access matters (Runs 1 and 2 had it). Devlogs, jams; other properties in bios. |
| Inline custom properties (`--i:3`) | 0 in 680 style attributes. Project description: dropped (live-s11, live-s12). Bio: dropped (live-s11). | Becomes `style=""` | Devlogs, jams |
| Empty elements kept | Attribute-less empty `<span>` 149 on 60 pages, plus 13 with `style`/`title`/`lang`; empty `div.custom-*` 32 on 8 pages; one empty `h1.custom-*`; empty `strong`/`em` (gapfill05-01). Project description: empty `span.custom-*`, `div.custom-*`, `<span></span>` and `<p></p>` kept, and two empty letter spans in a classed `h1` (live-t23, live-t24). Bio: the same two empty letter spans kept (live-t23). | No pruning step exists | Devlogs, jams |
| Tags itch added (`details`, `figure`, …) keep no attributes | 0 of 771 authored occurrences carry any attribute (gapfill05-05). Project description: `class`, `style`, `title`, `lang`, `name`, `open`, `datetime` and `font[color\|face\|size]` dropped from `details`, `summary`, `figure`, `figcaption`, `del`, `ruby`, `rt` and `font` (live-t02, live-t08 to live-t10). Bio: `details` and `summary` lose theirs (live-t08). | Tags added as `true` lose every attribute (leafo's streak.club does this for `del`) | Devlogs, jams; the other added tags in bios |
| Iframe attributes | Only `src width height frameborder allowfullscreen scrolling style` in 261 iframes. A Spotify embed lost `allow` and `loading`, and its `style` became `""` (gapfill05-08). Project description: `title`, `allow`, `loading`, `sandbox`, `referrerpolicy`, `class` and `name` dropped, and so are `srcdoc` and a `data:` `src` (live-i01, live-i08, live-i09). Bio: the same seven dropped (live-i01). | — (itch's iframe entry is not public) | `srcdoc` and a `data:` `src` in bios |
| Disallowed tag shown as text | A stray `</span>` stored escaped; the HTML-basement guide's `<wbr>` served escaped since 2025. Project description: `svg`, `math`, `marquee`, `center`, `ins`, `audio`, `source`, `picture`, `canvas`, form controls, `button`, sectioning tags, `style`, `script` and more escaped, while `wbr` and `video` (with `controls`) are kept (live-t02, live-t04, live-t10 to live-t22, live-a13). Bio: `link` and `meta` escaped (live-t21). | Yes (`strip_tags=false`), but the library also escapes `wbr` and `video` | Devlogs, jams; other tags in bios |
| `#` href dropped, `<a>` kept | Yes. Project description: `#`, relative, `tel:`, `javascript:`, `data:`, `HTTPS://` and leading-space hrefs dropped (live-l03 to live-l08, live-l11). | Yes | Bios, devlogs, jams |
| `rel="nofollow noopener" referrerpolicy="origin"` on off-site links | Yes, decided by host (live-l01, live-l02, live-l09, live-l12, live-l13). A dropped relative href gets neither (live-l04). Bio: the same for an off-site and an itch link (live-l01, live-l02). | A substring variant in the spec; the library adds the pair after a relative href too | — |
| `loading="lazy"` on every `img` | Yes (live-g01 to live-g05, live-g08 to live-g10) | — | — |
| Third-party iframe → click-to-activate | Project descriptions (every host tested: live-i01 to live-i07, live-i10) and comments. **Not bios:** a YouTube and an arbitrary `https://` iframe stay live, with 0 placeholders (live-i01, live-i04). | — | Other hosts in bios |
| Unquoted values, a line break in a tag, `<x/>`: tag escaped | Older stored markup is always normalised (N8). Project description: an unquoted `width=40%`, a line break inside a tag and `<span/>` escaped their tags; simple unquoted and single-quoted values were kept and re-quoted (live-g07, live-e06, live-t12, live-e10). Bio: the unquoted `width=40%` escaped its `<img>` (live-g07). | Yes, except that the library keeps a tag with an LF inside | Whether the editor or the server escapes them (M01 not run) |
| `<!-- -->` escaped as text | Never seen in stored content (0 cases). Project description and bio: escaped (live-e04). | Yes (default) | Devlogs, jams |
| HTML re-sanitized on every render | Attribute order flips between requests | `pairs()` order varies per process | Cache lifetime |

Evidence for the rows: docs-34, sanitizer-02, -04, -05, -06, -07, -09, -11, -15, -16, -17, -18, -20, -21, -24, -43, -44, repo-28, community-19, corpus-36, gapfill05-01 … -09; `live-*` ids are **[verified 2026-10-16]** on a project description, and in a bio where the cell names bios.

---

### 4. Tags

**Seen surviving in stored descriptions, devlogs, jams and bios** **[observed · sanitizer-13]**:

`a abbr blockquote br cite code dd del details div dl dt em figcaption figure font h1–h6 hr iframe img kbd li mark ol p pre q rp rt ruby s small span strong sub summary sup table tbody td tr u ul`

On a project description every one of these that the run tested survived as a tag; `em`, `strong` and `h2`–`h4` were not tested, and an `iframe` becomes a placeholder (§9), though in a bio it stays live **[verified 2026-10-16 · live-t01 to live-t10, live-t17, live-i01, live-i04]**.

- `iframe`, `details`, `summary`, `figure`, `figcaption`, `del`, `ruby`, `rt`, `rp` and `font` are itch additions to the stock library list **[observed · sanitizer-13]**. So are `wbr` and `video`: on a project description `<wbr>` survives (served as `soft<wbr>break</wbr>`), and `<video controls>` keeps `controls` but loses `class`, `width` and `height`; its `src` is untested **[verified 2026-10-16 · live-t11, live-t14]**.
- The library also allows `b`, `i`, `dfn`, `samp`, `var`, `time`, `strike`, `thead`, `tfoot` and `th`. These were not seen in descriptions; `b`, `i` and `strike` do appear in comments **[observed · sanitizer-13]**. A project-description save keeps all ten **[verified 2026-10-16 · live-t01, live-t02, live-t04, live-t17]**.
- **Bios specifically:** `p a br img strong em span h1–h4 div figure ul li table tbody tr td blockquote hr u font` **[observed · crawlprofile-49]**. A probe bio also kept `details`, `summary` and `iframe` **[verified 2026-10-16 · live-t08, live-i01, live-i04]**.
- **Jam descriptions:** `details`/`summary`, `figure`/`figcaption`, `table`, `h1`, `iframe` and inline `style` all appear **[observed · crawljam-32]**.
- **`<b>`/`<i>` turn into `<strong>`/`<em>` on re-save.** The community HTML guide served 1 `<b>` and 6 `<i>` in 2023–2024 and 0 of each since 2025-04, while its `<strong>`/`<em>` counts rose. Comments still keep `b`/`i` **[observed · N10; cause inferred: editor normalisation]**. A save from HTML mode keeps `<b>` and `<i>` on a project description **[verified 2026-10-16 · live-t01]**, so the conversion probably comes from the visual editor, not the server **[inferred · live-t01, N10]**. Target `strong, b` and `em, i` in CSS.

**Tags itch added carry no attributes.** 771 authored occurrences of `details`, `summary`, `figure`, `figcaption`, `del`, `ruby`/`rt`/`rp` and `font` in bios, project descriptions, devlogs and jam descriptions have **no attribute at all**: no `class`, `style`, `title` or `lang` **[observed · sanitizer-46, gapfill05-05]**. The only classed `details` are itch's own `details.toggle_post_body` in comments.

There is a library mechanism for this. leafo's open-source streak.club adds `del` to the whitelist as `whitelist.tags.del = true`, and web_sanitize's `check_attribute` writes nothing for a tag whose entry is not an attribute table. So a tag added that way loses every attribute, including the global `title`/`lang`/`dir` **[inferred · gapfill05-05]**. A project-description save confirms it: `details`, `summary`, `figure`, `figcaption`, `del`, `ruby`, `rt` and `font` lost every attribute tested, `class`, `style`, `title` and `lang` included **[verified 2026-10-16 · live-t02, live-t08 to live-t10]**, and a bio save stripped them from `details` and `summary` the same way **[verified 2026-10-16 · live-t08]**. Wrap them in a `<div class="custom-…">` and style through the wrapper (pattern F in §11).

**Expect these NOT to work** **[inferred · sanitizer-14; verified 2026-10-16 on a project description · live-t02, live-t10 to live-t22, live-a13; `link` and `meta` also in a bio · live-t21]**:

- `svg`, `math`, `audio`, `source`, `picture`, `canvas`, `progress`, `meter`;
- form controls and `button`;
- `section`, `article`, `header`, `footer`, `nav`, `main`, `aside`;
- `style`, `script`, `link`, `meta`, `object`, `embed`, `dialog`, `template`, `caption`, `colgroup`, `col`, `ins`, `center`, `marquee`.

None of these appears in 2,127 live containers, and the library escapes each one; a project-description save escaped every one as visible text. The community "HTML basement" guide lists most of them as scrubbed, but it omits `center` and `button`. Its claim that `<wbr>` works holds on a project description saved in HTML mode (see below).

The `<button>` and `<section>` elements you do see in stored markup are itch's own. The `button.embed_preload` placeholders are generated by itch (§9), and `section.post_body` is the devlog container. You cannot author either.

Substitutes:

- **icons:** an `<img>`, or CSS `::before` on a `.custom-*` element;
- **video:** a YouTube or Vimeo `<iframe>` (§9). `<video controls>` survives on a project description, but `<source>` is escaped and a `src` on `<video>` is untested;
- **sectioning:** `<div class="custom-…">`;
- **soft line breaks:** `<wbr>` on a project description **[verified 2026-10-16 · live-t11]**, or CSS `overflow-wrap:anywhere`, `word-break` or `hyphens:auto` on a `.custom-*` element.

**A disallowed tag is escaped, not deleted.** `<marquee>x</marquee>` becomes `&lt;marquee&gt;x&lt;/marquee&gt;`, so visitors see the raw tag text **[observed · sanitizer-15; verified 2026-10-16 on a project description · live-t11]**. Live evidence:

- The HTML-basement guide's 9 author-written `<wbr>` were real tags in the 2023-02 and 2024-05 Wayback captures. Since at least 2025-04-18 they are served as visible `&lt;wbr&gt;`, while `<mark>` in the same `<code>` blocks stayed a tag **[observed · sanitizer-44]**. But a fresh `<wbr>` saved in HTML mode on a project description survives as a tag **[verified 2026-10-16 · live-t11]**, so the guide's copies were probably escaped when the page was re-saved between 2024-05 and 2025-04, not by a lasting whitelist change **[inferred · live-t11, sanitizer-44]**.
- A stray `</span>` inside a SoundCloud iframe is stored as `&lt;/span&gt;` text in `data-embed_code` **[observed · sanitizer-15]**.

Symptom: tag soup appears on the page. Fix: delete the unsupported tag rather than hoping it disappears.

**Special cases.**

- **`<font>`** is kept **without attributes**: Google Translate's `<font><font>` wrappers survive in bios and comments, but `<font color>` cannot colour text. Use `<span style="color:#hex">` or a class **[observed · sanitizer-37; verified 2026-10-16 · live-t10]**.
- **`<details>`/`<summary>`** work, but the `open` attribute is reportedly scrubbed, so a disclosure always starts closed. 0 of 60 sampled `details` carry `open`. `details[open]` still matches once a visitor opens it **[community · sanitizer-27]**. On a project description and in a bio `open` and `name` are dropped, so exclusive `details[name]` accordions can't be built **[verified 2026-10-16 · live-t08]**.
- **Tables** keep `table[width]` and `td[width|colspan|rowspan]`. Presentational `border`, `cellpadding` and `align` are dropped **[inferred · sanitizer-36]**. On a project description `table[border|cellpadding]`, `th[scope]` and `td[align]` were dropped, but `table[align]` was kept, as were `table[width]`, `th[colspan]` and `td[width|colspan|rowspan]`; `caption`, `colgroup` and `col` are escaped, while `thead` and `tfoot` survive **[verified 2026-10-16 · live-t17]**. Style tables with CSS. itch's `.user_formatted table` border and padding rules don't reach bios (§2).
- **Headings in the bio.** `<h1>`/`<h2>` with `custom-` classes survive; a probe bio kept two classed `<h1>` **[verified 2026-10-16 · live-a20, live-t23]**. A bio `<h1 class="custom-title">` can replace itch's display-name `h1` if your CSS hides that one, so the page keeps exactly one heading **[verified · repo-26]**. Set `font-size` and `font-weight` explicitly (§2).

---

### 5. Attributes

| Attribute | On itch | Confidence · evidence |
|---|---|---|
| `class` | Kept: `custom*` tokens (case after the prefix preserved) and itch's editor classes `text-center`, `text-justify`, `text-right`; also `spoiler` (§6) and, on `<code>`, `language-css`. Every other token is stripped, `text-left` included; a mixed list keeps the allowed tokens. Stored values are always single-space separated, with 0 of 2,293 having stray whitespace; a class with extra spaces is re-serialised that way, and a duplicate token is kept. Bios behave the same on the tokens tested. | documented · docs-34; observed · sanitizer-03, community-19, gapfill05-03; verified 2026-10-16 · live-k01 to live-k30, live-k34, live-t03; bios: live-k01, live-k05, live-k07, live-k09, live-k11, live-k14, live-k16, live-k26, live-k31, live-k34 |
| `id` | Removed (0 in 2,127 containers; 0 in 35,801 authored tags), in project descriptions and bios | observed · sanitizer-05, gapfill05-06; verified 2026-10-16 · live-a01 |
| `style` | Kept on stock tags and on `iframe`, filtered (§7). Never seen on tags itch added, and dropped from them on a project description and in a bio. | observed · sanitizer-21, sanitizer-46, gapfill05-08; verified · community-18; verified 2026-10-16 · live-s01, live-i01, live-t08, live-t09; bios: live-s08, live-i01, live-t08 |
| `title`, `lang`, `dir` | Allowed on any stock tag. `span[lang]`, `img[title]`, `a[title]` seen; `dir` only from source. A bio keeps `span[lang]`. | observed · sanitizer-10; verified 2026-10-16 · live-a08 to live-a10, live-a21; bio: live-a09 |
| `a[href]` | Only `https://`, `http://`, `//`, `mailto:` (§8). On a project description `#`, relative, `javascript:`, `tel:`, `data:`, `HTTPS://` and leading-space hrefs are dropped; `//` on a link is untested. | observed · sanitizer-06; verified 2026-10-16 · live-l03 to live-l09, live-l11 |
| `a[name]` | Kept, and gets no injected `rel`, in project descriptions and bios | observed · sanitizer-05, sanitizer-07; verified 2026-10-16 · live-l10 |
| `a[target]` | Kept with any value, never injected; a bio keeps `_blank` too | observed · sanitizer-10; verified 2026-10-16 · live-l01, live-l13 |
| `rel` (yours) | Not kept, in project descriptions or bios; itch injects its own on off-site links | verified · sanitizer-07; verified 2026-10-16 · live-l01, live-l02, live-l13 |
| `a[hreflang\|download\|type\|ping]`, authored `a[referrerpolicy]` | Dropped; an authored `referrerpolicy` is replaced by `origin` on off-site links | verified 2026-10-16 · live-l13 |
| `img` | `src`, `alt`, `title`, `width`, `height`, `style`, `class` kept; `loading="lazy"` injected | verified · sanitizer-11; verified 2026-10-16 · live-g04 |
| `img[srcset]`, authored `img[loading]` | `srcset`, `sizes`, `decoding`, `fetchpriority`, `crossorigin` and `referrerpolicy` dropped; an authored `loading="eager"` becomes `lazy`. 0 of 716 live images have `srcset`. | library model + observed · N11; verified 2026-10-16 · live-g04 |
| `table[width]`, `td[width\|colspan\|rowspan]` | Kept; so are `table[align]` and `th[colspan]`. `table[border\|cellpadding]`, `th[scope]` and `td[align]` are dropped (§4). | inferred · sanitizer-36; verified 2026-10-16 · live-t17 |
| `ol[start\|reversed\|type]`, `li[value]` | Dropped | verified 2026-10-16 · live-t07 |
| `iframe` | Only `src`, `width`, `height`, `frameborder`, `allowfullscreen`, `scrolling` and `style` occur in 261 stored iframes. `allow`, `title`, `loading`, `referrerpolicy`, `sandbox`, `class` and `seamless` never do. A pasted Spotify embed lost its documented `allow` and `loading`. On a project description and in a bio `title`, `allow`, `loading`, `sandbox`, `referrerpolicy`, `class` and `name` are dropped. | observed · sanitizer-26, gapfill05-08; verified 2026-10-16 · live-i01 |
| `aria-*`, `role`, `data-*`, `on*` | Removed. `aria-hidden` was seen removed from a bio on save, and a probe bio lost `aria-hidden`, `aria-label`, `role` and `data-*`. 0 in 35,801 authored tags. The only `aria-label`/`data-embed_code` in content belong to itch's own embed buttons, and the only other `data-*` is itch's `a[data-image_lightbox]` on devlog image links. | observed · sanitizer-09, repo-28, gapfill05-06; verified 2026-10-16 · live-a02 to live-a05, live-a11, live-a20 |
| `hidden`, `inert`, `accesskey`, `contenteditable`, `draggable`, `translate` | Removed | verified 2026-10-16 · live-a07, live-a15 to live-a19 |
| `popover`, `popovertarget` | Not in the library whitelist; 0 live. Removed on a project description and in a bio (`popover`), and a `<button popovertarget>` is escaped as text on a project description. Popover markup can't be authored, so build toggles with `details`/`summary` instead. | library model + observed absence · gapfill05-06; verified 2026-10-16 · live-a12 to live-a14 |
| `tabindex` | Removed from authored markup, except on a `span.spoiler`. The editor's spoiler span `<span class="spoiler" tabindex="0">` was seen in jam descriptions (2) and comments (2), and a hand-written one keeps its `tabindex` on a project description and in a bio. | observed · sanitizer-09, crawljam-32; N7; verified 2026-10-16 · live-a06, live-k34 |
| `details[open]`, and any attribute on itch-added tags | Removed (0 of 771 occurrences carry one, §4); in a bio too, for `details` and `summary` | community · sanitizer-27; observed · gapfill05-05; verified 2026-10-16 · live-t02, live-t08 to live-t10 |
| `font[color\|face\|size]` | Removed (`<font>` keeps no attributes) | observed · sanitizer-37; verified 2026-10-16 · live-t10 |

**In-page anchors.** Since `id` is stripped, use `<a name="faq"></a>` as the target. Link to it with the page's **full absolute URL** plus `#faq`, because a bare `href="#faq"` is deleted **[observed · sanitizer-05, sanitizer-06; verified 2026-10-16 · live-a01, live-l03, live-l10]**. On a project page and on a profile (bio) the `<a name>` matches `:target` **[verified 2026-10-16 · live-l10]**.

---

### 6. Classes in detail

**The documented rule.** Classes "must begin with `custom-`", and any other class "will be stripped by the sanitizer" **[documented · docs-34]**. Write `<div class="custom-card">` and style it with `#wrapper .custom-card{…}`.

- Never rely on unprefixed framework classes in HTML, such as Bootstrap or Tailwind utilities; they vanish **[documented · sanitizer-02; verified 2026-10-16 · live-k26, live-k27]**.
- Your **CSS selectors** may still target itch's own classes; the rule is about the classes you write in HTML.
- The class filter is itch's own: the stock library drops `class` entirely **[documented · sanitizer-02]**.

**What is actually observed is looser.** All of these were seen surviving in served HTML:

| Class form | Where seen | Evidence |
|---|---|---|
| `custom_details_text`, `custom_jam_title` and other `custom_*` (30 tokens on one page; 61 across the jam sample) | jam descriptions | observed · sanitizer-04, crawljam-32; N6 |
| `customa` … `customae` (31 hyphenless classes from a build-time renamer that saves characters) | one profile bio (CSS-access account) | verified · community-19; observed · corpus-36 |

So the filter tests the prefix `custom`, not `custom-`: a project-description save keeps `customc`, `custom_d`, `customer` and a bare `custom-`, and a bio save keeps `customer` **[verified 2026-10-16 · live-k03 to live-k06]**. **Still author `custom-`.** The looser behaviour is undocumented and may change.

**What the token filter does with unusual characters.** The census covered 1,204 authored `custom*` tokens on live pages **[observed · gapfill05-03]**:

- **Uppercase after the prefix is kept, case preserved** **[verified 2026-10-16 · live-k21]**. There are 74 such tokens on 3 project pages: camel-case names and build-tool hashes. Class selectors are case-sensitive, so `.custom-HeroText` matches only that exact case.
- **Never seen in the census:** a token whose **prefix** is uppercase (`Custom-x`), a token starting with `-`, an empty `class=""`, or any token with a character outside `[A-Za-z0-9_-]`, such as `:`, `/`, `[`, `]` or `.`.

itch's filter function is not public. Two filters fit every census token. One keeps any token that starts with `custom` (H1); the other also requires `^custom[A-Za-z0-9_-]*$` (H2) **[library model · gapfill05-04]**. The live run settles it for project descriptions: **H1, case-sensitive**. Tokens with `: / [ ] .` or non-ASCII after the prefix survive, and `Custom-a`/`CUSTOM-b` are dropped, so itch does not lowercase first **[verified 2026-10-16 · live-k01, live-k02, live-k07 to live-k20]**. A bio gave the same results for `Custom-a`, `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2` and `custom:flex` **[verified 2026-10-16 · live-k01, live-k07, live-k09, live-k11, live-k14]**:

| Token in your HTML | H1 (prefix test) | H2 (strict charset) | Project description, live | Advice |
|---|---|---|---|---|
| `custom-card__title--big` (BEM) | kept | kept | not tested; H1 keeps it | safe |
| `custom-Hero` | kept | kept | kept (live-k21) | safe |
| `custom-md:flex`, `custom-w-1/2`, `custom-w-[3px]`, `custom-d.e`, `custom-café` | kept | **dropped** | **kept** (live-k07 to live-k15, live-k20) | works on project descriptions, with escaped selectors; in bios `:`, `/` and `[ ]` are kept too (live-k07, live-k09, live-k11, live-k14); untested on devlogs and jams |
| `Custom-x`, `CUSTOM-x` | dropped | dropped | dropped (live-k01, live-k02; bio: live-k01) | avoid |
| `-custom-x`, `md:custom-x`, `!custom-x`, `xcustom-x` (prefix not first) | dropped | dropped | dropped (live-k16 to live-k19; bio: live-k16) | avoid |
| `class=""`, a bare `class` | attribute removed | attribute removed | removed (live-k32, live-k33) | harmless |

A class attribute whose tokens are all dropped disappears entirely, in project descriptions and bios **[verified 2026-10-16 · live-k31]**. The characters `: / [ ] .` need escaping in your selectors; `.custom-hover\:x` and `.custom-w-\[3px\]` match on a project page and on a profile (bio) **[verified 2026-10-16 · live-c38, live-c39]**.

**itch's own classes that survive in your content:**

| Class | Where | Notes | Evidence |
|---|---|---|---|
| `text-center`, `text-justify` | Everywhere; these are the editor's alignment buttons | In this sample: bios 42 / 2, project 390 / 25, jam 318 / 0 (N6). Seen on `p`, `h1`–`h4`, `h6`, `li`, `div`, `pre`, `ul`, `td`, `blockquote`. You may write `class="text-center custom-x"`. | observed · sanitizer-03; verified · repo-27; verified 2026-10-16 · live-k24, live-k25 |
| `text-right` | One bio | Defined in itch CSS. Kept on a project description, while `text-left` is dropped. | verified · community-19; verified 2026-10-16 · live-k22, live-k23 |
| `spoiler` | Jam descriptions (2) and comments (2), always on `<span class="spoiler" tabindex="0">` | 0 in 48 bios, 96 project descriptions and 18 devlogs (N6, N7). A hand-written one survives whole on a project description and in a bio, `tabindex` included, but a bio doesn't hide it (below). | observed · crawljam-32, sanitizer-09; verified 2026-10-16 · live-k34 |
| `language-css` | On `<code>` | Kept on a project description, as in comments | verified 2026-10-16 · live-t03 |

- `.text-center`, `.text-right` and `.text-justify` are global `text-align` rules in `user.css`, `game.css` and `jam.css` **[observed · sanitizer-03]**. Expect them in user content, and don't fight them with low-specificity rules.
- **itch hides spoilers until focus.** All three stylesheets have `.user_formatted .spoiler:not(:focus):not(:focus-within){background-color:currentColor;-webkit-text-fill-color:transparent}`, and the spoiler's children get `visibility:hidden` until focus **[observed · N2]**. On a project page a hand-written spoiler is hidden this way: transparent text fill, with colour and background both `rgb(34, 34, 34)` **[verified 2026-10-16 · live-k34]**.
  - **Never** write broad rules such as `#wrapper .jam_content span{background:none}` or `-webkit-text-fill-color` overrides on `span`; they reveal spoilers.
  - In a bio, `.user_formatted` is absent, so a spoiler renders unstyled, with its text visible. A hand-written spoiler in a live bio kept `tabindex="0"` but was not hidden: text fill and colour `rgb(238, 243, 255)`, transparent background, logged in and logged out **[verified 2026-10-16 · live-k34; cause observed · N2]**.
- **Comment bodies follow different rules.** They also keep itch-generated `details.toggle_post_body`. Don't generalise from comments to your own fields **[observed · N6]**. Their `code.language-css` (7) is not comment-only: `language-css` on `<code>` also survives in a project description **[verified 2026-10-16 · live-t03]**.

**Ad-blocker collisions.** itch forces the `custom-` prefix, and these exact names match generic cosmetic filters, so the elements disappear for uBlock Origin, Brave and similar users **[verified · external-30, external-51]**:

| List | Filtered `custom-` classes |
|---|---|
| EasyList (default) | `.custom-ad`, `.custom-ads`, `.custom-ad-area`, `.custom-ad-container`, `.custom-advert-banner`, `.custom-sticky-ad-container` |
| Brave Cookie notice blocker (default) | `.custom-cookie-banner`, `.custom-cookie-msg`, `.custom-cookie-footer-banner`, `.custom-ch-cookie-notice`, `.custom-container-lgpd` |
| Fanboy Annoyances (optional) | `.custom-social`, `.custom-social-share`, `.custom-sharing`, `.custom-share-button`, `.custom-follow-button`, `.custom-follow-bar`, `.custom-tweet-button`, `.custom-back-to-top`, and others |

Name hooks after their look, not their purpose, e.g. `custom-promo-card` instead of `custom-ad` and `custom-links` instead of `custom-social`.

---

### 7. Inline `style=""`

Inline style is allowed but heavily filtered. leafo (itch admin, 2021) said inline CSS is limited to "a few simple properties" **[observed · sanitizer-21]**.

**Whitelist: the library's 27 properties.** This is web_sanitize's default `css_whitelist.moon`, so the list is a **library model**. itch could run a customised copy. The live census below supports the model; it doesn't prove it **[library model · sanitizer-21; observed · gapfill05-09]**. On a project description every property the run tested, inside or outside the list, was kept or dropped as the model predicts **[verified 2026-10-16 · live-s01 to live-s30]**. A bio save did the same for the four style probes it carried **[verified 2026-10-16 · live-s02, live-s08, live-s11, live-s18]**.

```
margin  margin-top  margin-right  margin-bottom  margin-left
padding padding-top padding-right padding-bottom padding-left
font-size  text-align  color  background-color  background  background-image  opacity
border  border-width  border-color  border-style
width  height  min-width  max-width  min-height  max-height
```

- **Seen live: 21 of the 27, and nothing else.** The census covered 680 authored style attributes on 50 bios, 145 project pages, 99 jam descriptions and comment bodies, 63 of them empty **[observed · gapfill05-09]**.
  - Declarations: `color` 341, `font-size` 192, `border` 87, `padding` 86, `margin` 77, `background` 58, `width` 55, `text-align` 52, `background-color` 33, `max-width` 25, `margin-bottom` 20, `height` 19, `margin-top` 17, `margin-right` 6, `margin-left` 6, `padding-left` 4, `opacity` 4 (on 1 page), `min-height` 2, `padding-bottom` 2, `padding-right` 2, `max-height` 1.
  - 0 properties fall outside the list. The earlier, smaller N4 sample saw 13.
  - **Never seen in the census:** `padding-top`, `background-image`, `border-width`, `border-color`, `border-style`, `min-width`. A project-description save and a bio save keep all six, with `background-image: url('https://…')` quoted **[verified 2026-10-16 · live-s08]**. Devlogs and jams are untested.
- **Fixed-point check.** The 207 distinct live style values were each re-run through the library's `sanitize_style`, and all 207 came back unchanged. So every stored value is a fixed point of the default grammar, and nothing itch stored needs a wider whitelist **[observed · gapfill05-09]**.
- **Dropped (library model):** `display`, `float`, `position`, `font-family`, `font-weight`, `line-height`, `letter-spacing`, `text-decoration`, `border-radius`, `transform` and everything else. None of them occurs in the 680 live attributes **[library model · sanitizer-21; observed absence · gapfill05-09]**. A project-description save drops each one tested: `display`, `float`, `position`/`top`, `font-family`, `font-weight`, `line-height`, `letter-spacing`, `text-decoration`, `text-shadow`, `box-shadow`, `border-radius` and `transform` **[verified 2026-10-16 · live-s04, live-s05, live-s09, live-s10, live-s13 to live-s15, live-s18, live-s26, live-s27]**. A bio save dropped `float` and `border-radius` from a no-space list too **[verified 2026-10-16 · live-s18]**.
  - **One live drop is visible.** Spotify's documented embed code carries `style="border-radius: 12px"`, and a Spotify iframe stored on a jam page has `style=""` **[observed · gapfill05-08]**.
  - A creator's report that `border-radius` is "randomly" ignored fits this **[community · community-18]**.
- **Re-serialised.** Surviving declarations keep their text. The final `;` is removed, and multiple declarations are joined with `"; "`: 0 of 178 values end with `;`, and 69 of 69 multi-declaration values use `"; "` **[inferred · sanitizer-01; verified · community-18; N4]**. So `[style*="color:"]`-style selectors are fragile; use classes.

**Value types are strict** **[inferred · sanitizer-23; library probes · N12]**. On a project description these cells were confirmed: `max-width: 100%`, integer `px`, `opacity: .5`, `font-size` `150%`/`2em`, `margin: 0 auto`, colour identifiers, `#rrggbbaa`, comma `rgba()`/`hsl()`, `var()` in `color`, and `border: 1px solid red` kept; `height: auto`, `padding: 0.5em 1em`, `calc(…)`, `font-size: 1.5em`, `url(…) no-repeat`, gradients, `COLOR: red` and `--i` dropped **[verified 2026-10-16 · live-s01, live-s03, live-s04, live-s06, live-s08, live-s11, live-s12, live-s18 to live-s21, live-s23, live-s24, live-s28 to live-s30, live-g04]**. The other cells are untested on itch:

| Property | Kept | Dropped (that declaration only) |
|---|---|---|
| `width`, `height`, `min-/max-width/height`, `padding(-*)`, `opacity` | one integer+unit, an integer `%`, or a bare number: `width: 100%`, `max-width: 320px`, `opacity: .5`, `opacity: 50%` | `10.5px`, `1.5em`, `-10px`, `auto`, `calc(…)` |
| `font-size` | `150%`, `2em`, and any keyword: `large`, `auto`, even `-10px` (tokenised as an identifier) | `1.5em`, `calc(…)` |
| `margin(-*)` | `0 auto`, `0.5em 1em`, `-10px` | — |
| `color`, `background-color`, `border-color` | an identifier, `#hex` (incl. `#rrggbbaa`), or any function: `rgb(1, 2, 3)`, `rgba(0,0,0,.5)`, `hsl(…)`, `var(--x)` | — |
| `background` | exactly one quoted `url('https://…')`, identifier or `#hex` | `url(…) no-repeat`, gradients, `var(--x)` |
| `border` | a number alone (`0`), or number + style + colour (`1px solid #ccc`, `2px solid var(--x)`) | `none`, `2px dashed` (no colour) |
| any property | lowercase names | `COLOR: red` (names are case-sensitive) |
| custom properties | — | `--i: 1` (library probe; 0 seen live, N6) |

**Whole-attribute killers.** If any of these is present, the parser fails and the **entire** `style` attribute is removed, not just one declaration **[inferred · sanitizer-22]**. On a project description `!important`, the slash colour syntax, a comment, `50.5%`, trailing whitespace and a line break were each confirmed to remove the attribute, and `!important` did so in a bio too **[verified 2026-10-16 · live-s02, live-s07, live-s16, live-s17, live-s22, live-s31]**:

- `!important`, `;;` or `/* … */`;
- slash colour syntax: `rgb(1 2 3 / 50%)`;
- an unquoted `url(https://…)` (a bare `url(x)` without `.`, `:` or `/` drops only its declaration);
- a decimal percentage: `width: 50.5%`;
- trailing whitespace: `"color: red "` or `"color: red; "`;
- a line break between declarations. In the library only a CR kills the attribute, and a plain LF and leading spaces are fine (N12). But on a project description an LF in the pasted HTML removed the whole attribute **[verified 2026-10-16 · live-s31]**. The stored description has CRLF where the payload had LF, so the server most likely saw a CR **[inferred · live-s31, live-e06]**. Keep each `style` value on one line.

If every declaration is dropped, the result is `style=""`; 30 such empty attributes are in the sample **[observed · N4]**. An authored `style=""` is kept as is **[verified 2026-10-16 · live-s25]**.

Safe template: `style="color: #ffc857; font-size: 120%"`.

**No per-element CSS variables.** Expect `style="--i:3"` to become `style=""`, and `style="--i:3;color:red"` to become `style="color:red"` **[library model · sanitizer-23, gapfill05-07]**. No custom-property declaration appears in any of the 680 live style attributes **[observed absence · gapfill05-07]**. A project-description save confirms both, and a bio save the second: `--i:3` is dropped and `color: red` next to it is kept **[verified 2026-10-16 · live-s11, live-s12]**. So you cannot pass data to CSS through inline custom properties. Derive per-item values with `:nth-child()` in the CSS editor instead (§11, pattern B). `var()` *inside* an allowed colour property works: `color: var(--itchio_link_color)` is kept, and 20 such values were seen live **[inferred · sanitizer-23; observed · N6; verified 2026-10-16 · live-s20]**.

> **Conflict: is inline style tied to CSS access?** A 2024 moderator post says "inline CSS is stripped when you save the page" unless you have custom CSS **[community · community-18]**. Against that:
>
> - six properties survive on a CSS-access account, re-serialised, 7 of 7 attributes kept **[verified · community-18]**;
> - inline styles appear in 12 of 48 bios and 19 of 96 project descriptions on pages with **no** `style#custom_css`, and in 8 comment bodies **[observed · N4]**.
>
> No gating was observed. But a page without saved custom CSS doesn't prove its owner lacks access. **Untested:** live probe Runs 1 and 2 used an account with CSS access, so they don't settle this.

---

### 8. Links

- **href schemes.** Every surviving href in the sample is `https`, `http` or `mailto`; there are 0 relative, `#` or protocol-relative hrefs **[observed · sanitizer-06; N5]**. The library keeps only lowercase `http://`, `https://`, `//` and `mailto:`, so `/path`, `tel:`, `javascript:`, `HTTPS://` and a leading space are expected to be dropped. On a project description they are, and so is `data:`, while `mailto:` stays **[verified 2026-10-16 · live-l04 to live-l09, live-l11]**. A protocol-relative `//` href is untested.
- **A dropped href leaves a dead `<a>`.** The guide demo `<a href="#header">` is served as `<a rel="nofollow noopener" referrerpolicy="origin">`: no href, so no longer a link, but still with `rel`, because the original href was not an itch URL **[observed · sanitizer-06]**. 6 such anchors are in the project sample (N5). On a project description a dropped `#`, `javascript:`, `tel:`, `data:`, upper-case or leading-space href leaves the pair, but a dropped relative href (`/probe`) leaves a bare `<a>` with neither, unlike the library, probably because a relative URL counts as an itch URL **[verified 2026-10-16 · live-l03 to live-l08, live-l11; cause inferred]**.
- **Injected attributes, by host.** Links to any host other than itch's get `rel="nofollow noopener" referrerpolicy="origin"` **[verified · sanitizer-07; verified 2026-10-16 on a project description · live-l01, live-l02, live-l09, live-l12, live-l13; in a bio · live-l01, live-l02]**:
  - this includes `mailto:` and URLs that only mention `itch.io` in their query string;
  - links to `itch.io`/`*.itch.io`, including `http://` ones, get neither;
  - links to `img.itch.zone`, itch's image CDN, also get neither: 12 of 12 **[observed · N5]**;
  - injection needs an href in the source, so `<a name>` gets no `rel`, in project descriptions and bios **[verified 2026-10-16 · live-l10]**.

  | Sample | Off-site links with the pair | itch links with neither | Evidence |
  |---|---|---|---|
  | Corpus, 2,127 containers | 533/533 (+ 5/5 mailto) | 291/291 | sanitizer-07 |
  | 36 bios | 80/80 | 35/35 | crawlprofile-49 |
  | 16 fresh jam descriptions | 142/142 | 111/112 | crawljam-33 |
  | One CSS-access bio (source vs. served) | 9/9 gained the pair | 2/2 unchanged | community-20 |

- **Your own `rel` is lost.** `rel="me"` (Mastodon verification) and `rel="author"` cannot be authored on external links **[verified · sanitizer-07]**. On a project description `rel="me"` on an off-site link became `nofollow noopener`, `rel="me author"` on an itch link was removed, and an authored `referrerpolicy="no-referrer"` became `origin` **[verified 2026-10-16 · live-l01, live-l02, live-l13]**. A bio is no exception: `rel="me"` became `nofollow noopener` there too, and `rel="me author"` on an itch link was removed **[verified 2026-10-16 · live-l01, live-l02]**. For `rel="me"` verification, use the profile's links widget, whose links itch gives `rel="me"` itself **[verified · crawlprofile-07]**.
- **`target` is kept verbatim and never injected.** Live values include `_blank` (423), `_new` (2) and even a URL **[observed · sanitizer-10; verified 2026-10-16 · live-l01, live-l13]**. itch does not force new tabs.
- **Raw `&` in a URL** stays as written. Stored output contains both `?a=1&b=2` and `?a=1&amp;b=2`, and both are harmless **[verified · sanitizer-41; verified 2026-10-16 · live-l12]**.
- **"External link" badge.** Only `game.css`, which loads on project and devlog pages, has `.user_formatted a[rel~=nofollow]:hover:after` (an "External link" label) plus a red ring on a **direct-child** image of such a link. `user.css` and `jam.css` have no such rule, so bios and jam pages show no badge **[observed · N2]**.

**CSS hooks that come free** (original snippets):

```css
/* off-site links (add [href]: dead anchors also carry rel) */
#wrapper .formatted_description a[href][rel~=nofollow]{text-decoration-style:dashed}
/* links to itch pages and itch's image CDN */
#wrapper .formatted_description a[href]:not([rel]){font-weight:700}
```

---

### 9. Images and embeds

**Images.**

- **`loading="lazy"` is injected on every stored `<img>`.** Counts: 332/332 in the corpus, 42/42 in bios, all 103 in fresh jam descriptions **[verified · sanitizer-11; observed · crawlprofile-49, crawljam-33]**, and every `<img>` of the project-description probe **[verified 2026-10-16 · live-g01 to live-g05, live-g08 to live-g10, live-t15]**. Below-the-fold images load late, so don't build effects that need the image's natural size at first paint. You can't opt out: an authored `loading="eager"` is overwritten with `lazy` **[library model · N11; verified 2026-10-16 · live-g04]**.
- **Reserve space.** `width` and `height` are kept; use them or `aspect-ratio` in CSS **[verified 2026-10-16 · live-g01]**.
- **`alt` is never added.** In one bio, 13 of 13 images gained `loading="lazy"` and none gained `alt`. A creator's blog says itch "enforces" alt; the served HTML doesn't show that **[verified · community-20]**. On a project description an `<img>` without `alt` stays without it **[verified 2026-10-16 · live-g02]**.
- **No rehosting or proxy.** External `src` URLs are served exactly as written. 329 of 332 sampled images are `img.itch.zone` uploads; the others are two `http://` Creative Commons badges on creator-103.itch.io pages and one gstatic image in a comment **[observed · sanitizer-12]**. On a project description `https://`, `http://` and protocol-relative `//` sources are all kept as written **[verified 2026-10-16 · live-g01, live-g05, live-g10]**. Use `https`.
- **No `data:` or relative images.** `src` must be absolute `http(s)://` or `//`. The editor's paste handler removes `data:` images client-side **[observed · sanitizer-12]**. On a project description saved in HTML mode, an `<img>` with a `data:` src is removed whole, unlike the library, which only drops the `src`; a relative `src` is dropped and the src-less `<img>` stays **[verified 2026-10-16 · live-g06, live-g09]**. Whether the editor or the server removes the `data:` image is unknown.
- **No `srcset`** (§5).
- **itch's own image rules:**
  - `.formatted img{max-width:100%}` and `.formatted img[width][height]{height:auto}` reach bios too;
  - `.user_formatted img, .user_formatted iframe{max-width:100%;border:0}` doesn't reach bios **[verified · sanitizer-11; N2]**.
- **Don't confuse these with grid thumbnails.** Grid images outside your content are `img.lazy_loaded[data-lazy_src]` and have no `src` until JavaScript swaps it in, so never select on `[src]` **[observed · crawljam-33]**.

**Iframes and click-to-activate.**

| Where | What visitors get | Evidence |
|---|---|---|
| Project description (and comments) | Since 2023-05-18, every non-itch iframe is replaced by a placeholder `<button itchio type="button" class="embed_preload youtube_preload\|other_embed" data-embed_code="…" style="…">`. YouTube placeholders are 250×140 with the video thumbnail; others are 300×168 with a `div.embed_url`. `https://itch.io/embed/…` widgets stay live. `game.min.js` swaps in the real iframe on click, or opens a new window on cross-origin-isolated pages. On a project description every tested `src` became a placeholder, its cleaned iframe kept in `data-embed_code`: `www.youtube.com` gives `.youtube_preload`, and youtube-nocookie, Vimeo, CodePen, GitHub Pages, example.com, `http://` and `//` hosts give a 300×168 `.other_embed`. | verified · sanitizer-24; verified 2026-10-16 · live-i01 to live-i07, live-i10 |
| Devlog post, jam description | Raw iframes stay live: 0 placeholders in 18 devlogs and 50 jam descriptions (N3), and again 0 in 22 devlogs and 99 jam descriptions (38 live iframes, gapfill05-08). | observed · sanitizer-25, gapfill05-08 |
| Profile bio | **Raw iframes stay live**: no placeholder. A YouTube iframe and an `https://example.com/` iframe saved in a bio were served live (2 iframes, 0 placeholders, logged in and logged out), the YouTube one minus the same seven attributes as on a project. Before that, 0 iframes were seen in 50 sampled bios (N3, gapfill05-08), and a 2023 user report said profiles were unaffected. | verified 2026-10-16 · live-i01, live-i04 |

- **No narrow host allowlist is evident, but test your host.** 261 stored iframes come from 11 hosts **[observed · sanitizer-26, crawljam-32, gapfill05-08]**:
  - YouTube, `itch.io/embed`, `w.soundcloud.com`, `player.vimeo.com`, `open.spotify.com`, `bandcamp.com`, `store.steampowered.com`, `sketchfab.com`, `discordapp.com`;
  - two small jam sites.

  The 2022 community guide says iframes are scrubbed except for a few widget hosts. A host list that includes small jam sites argues against that. On a project description no tested host was rejected: arbitrary `https://` and `http://` hosts, `//` URLs, GitHub Pages and CodePen all became placeholders **[verified 2026-10-16 · live-i02 to live-i07, live-i10]**. In a bio neither tested host was rejected: YouTube and `https://example.com/` stayed live **[verified 2026-10-16 · live-i01, live-i04]**. Devlogs, jams and other bio hosts are untested.
- **Iframe attributes.**
  - **Write** `src` (https or `//`), `width`, `height` (`100%` works), `frameborder`, `allowfullscreen`, `scrolling` and a simple `style`. Those are the only attribute names in the 261 stored iframes **[observed · gapfill05-08]**, and the only ones a project-description save or a bio save kept from a 14-attribute YouTube iframe **[verified 2026-10-16 · live-i01]**.
  - **`allow` and `loading` are dropped.** Spotify's documented embed code has `style="border-radius: 12px" src width height frameborder allowfullscreen allow loading`. One stored on a jam page keeps that order, minus `allow` and `loading`, with `style=""`. A stored SoundCloud embed likewise lacks the provider's `allow="autoplay"` **[observed · gapfill05-08]**. So you can't grant autoplay or other permission-policy features, and frames load eagerly. On a project description and in a bio `allow`, `loading`, `sandbox`, `referrerpolicy`, `class` and `name` were all dropped **[verified 2026-10-16 · live-i01]**.
  - **`title` is never present** in stored iframes, and a project-description or bio save drops it, so the frame has no accessible name; put a visible caption next to it **[observed absence · sanitizer-26, gapfill05-08; verified 2026-10-16 · live-i01]**.
  - **`style` on an iframe goes through the same 27-property filter** (§7). `style="max-width: 100%"` was kept on a project description and in a bio **[verified 2026-10-16 · live-i01]**.
  - **`srcdoc` and a `data:` src are dropped.** On a project description the iframe stays, src-less and live, not as a placeholder **[verified 2026-10-16 · live-i08, live-i09]**.
- **Placeholders are itch's markup, not yours.** `button`, the `itchio` attribute and `data-*` are stripped from authored HTML **[verified · sanitizer-24; verified 2026-10-16 for `button` and `data-*` · live-a02, live-a13]**.
- **Resizing a placeholder needs `!important`.** The button carries inline `width`/`height`, and inline declarations beat any `#wrapper` selector unless the author rule is `!important`. itch already sets `.embed_preload{max-width:100%;display:inline-flex}` **[inferred · CSS cascade + sanitizer-24; N2]**.

```css
#wrapper .formatted_description .embed_preload{width:100%!important;height:auto!important;aspect-ratio:16/9}
#wrapper .jam_content iframe,#wrapper section.post_body iframe,#wrapper .user_profile iframe{width:100%;height:auto;aspect-ratio:16/9}
```

---

### 10. Parser and text edge cases (mostly library model)

These rules come from `web_sanitize`'s grammar, reproduced locally. Applying them to itch is **inferred** unless tagged otherwise.

**Stored markup in the census is normalised.** In 13,001 stored opening tags across 212 descriptions, devlogs, jams and bios **[observed · N8]**:

- all 8,482 attribute values are double-quoted;
- there are 0 single-quoted or unquoted values, 0 bare boolean attributes and 0 `/>`;
- 0 tags contain a CR or LF.

This once suggested that the editor normalises markup and neutralises hazards 1–3 below. A project-description save from HTML mode shows that they do bite: an unquoted `width=40%`, a tag broken over two lines and `<span/>` were each escaped as text. Single-quoted and simple unquoted values were re-quoted with `"`, and an `<img … />` kept its `/>` **[verified 2026-10-16 · live-g07, live-e06, live-t12, live-e10, live-g08]**. Whether the editor or the server does this is unknown (manual probe M01 not run). Follow hazards 1–3.

1. **Unquoted values.** An unquoted value containing anything outside `[A-Za-z0-9._:-]`, such as `width=100%` or `href=https://x`, makes the whole tag fail, and it is shown as text. `width=100` is fine. leafo calls this output correct **[documented for the library · sanitizer-16]**. On a project description `width=40%` turned the whole `<img>` into visible text, whose bare URL was then auto-linked with the off-site `rel` pair, while `class=custom-x` was kept **[verified 2026-10-16 · live-g07, live-e10]**. A bio save did the same with `width=40%`, auto-link included **[verified 2026-10-16 · live-g07]**.
2. **Attribute names** must match `[A-Za-z0-9._:-]+` **[inferred · sanitizer-17]**:
   - `@click="…"` escapes the whole tag;
   - `x-on:click` is silently dropped;
   - a **CR** inside a tag also escapes it, because only space, tab and LF count as whitespace. Stored content does contain CRLF *between* tags (34 of 48 bios, N8), which is harmless. On a project description a tag broken over two lines with an LF was escaped too, unlike the library's LF rule; the stored text has CRLF at that point, so the break most likely reached the server as CRLF **[verified 2026-10-16 · live-e06; cause inferred]**. Keep every tag on one line.
3. **`/>`** works only on the void tags `<br/>`, `<img/>` and `<hr/>`. `<span/>` and `<div/>` are escaped as text. `input`, `source`, `link`, `meta` and `param` are in the library's self-closing list but not allowed on itch, so they are escaped anyway **[inferred · sanitizer-18]**. On a project description `<img … />` works and `<span/>` is escaped; `input`, `source`, `link` and `meta` are escaped (`link` and `meta` in a bio as well) **[verified 2026-10-16 · live-g08, live-t12, live-t14, live-t15, live-t18, live-t21]**.
4. **Closing tags** **[inferred · sanitizer-19]**:
   - unclosed allowed tags are closed at the end of your content;
   - closing an outer tag closes the inner ones (on a project description `<p>…<wbr>…</p>` is served as `<p>…<wbr>…</wbr></p>` **[verified 2026-10-16 · live-e07, live-t11]**);
   - an unmatched closing tag is escaped as text: `<b>x</i></b></b>` becomes `<b>x&lt;/i&gt;</b>&lt;/b&gt;`.
5. **A raw `<` in prose can break itch's layout.** A `<`, a space and an allowed tag name is parsed as a tag **[inferred · sanitizer-19]**:
   - `a < b and c > d` becomes `a < b > d</b>`, and the words "and c" are lost;
   - `x < div > y` becomes `x < div > y</div>`. A browser reads `< div >` as text, but the appended `</div>` is a real end tag. It closes the nearest open `div`, which is itch's own content container.

   On a project description saved in HTML mode both happen: "and c" was lost, and the stray `</div>` closed `div.formatted_description`, so the content after it rendered outside the container **[verified 2026-10-16 · live-e07, live-e08]**. Always write `&lt;` in HTML mode.
6. **Comments.** `<!-- … -->` is escaped as visible text by default. 0 comments, escaped or raw, were found in any stored container **[documented for the library · sanitizer-20; N8]**. On a project description and in a bio a comment is escaped as visible text, so itch doesn't strip comments there **[verified 2026-10-16 · live-e04]**.
7. **Text escaping** **[verified · sanitizer-38]**. A project-description save confirms the `<`, `>`, `&` and entity rules (raw `'` and `"` were not tested) **[verified 2026-10-16 · live-e01, live-e02]**:
   - raw `<`, `>`, `'` and `"` in text are stored as `&lt; &gt; &#x27; &quot;`;
   - existing entities pass through, named or numeric, with the semicolon optional;
   - a raw `&` is escaped only when no letter, digit or `#` follows it: `a & b` becomes `a &amp; b`, but `R&D` stays raw. So `&copy2026` can render as `©2026`. Write `&amp;`.
8. **Attribute values pass through byte-for-byte**, apart from `<`/`>` being escaped **[verified · sanitizer-41; verified 2026-10-16 · live-l12]**.
9. **HTML is re-sanitized on output.** The same unchanged page serves its injected link attributes in a different order on different requests. That fits a fresh sanitize per render (or per cache fill), so whitelist changes would reach old content **[inferred · sanitizer-43]**. `<wbr>` is not an example: a fresh `<wbr>` survives on a project description, so the HTML-basement guide's escaped copies were most likely stored escaped (§4) **[verified 2026-10-16 · live-t11; inferred · sanitizer-44]**. Never rely on attribute order or exact serialised markup.
10. **`&nbsp;` is everywhere.** It appears 2,231 times, because the editor inserts it, and it blocks wrapping. Consider `#wrapper .formatted_description{overflow-wrap:anywhere}` on narrow screens **[observed · sanitizer-38]**.
11. **Visually empty paragraphs** are usually `<p><br></p>`, which `:empty` does not match. Counts: 235 `<p><br></p>` against 90 `<p></p>`, plus 24 `<p>&nbsp;</p>` **[observed · N9]**. All three forms survive a project-description save **[verified 2026-10-16 · live-e05]**. No pure-CSS selector reliably tells `<p><br></p>` from `<p>text<br></p>`, because `:only-child` ignores text nodes. Delete the empty paragraphs in HTML mode instead of hiding `p:has(>br:only-child)`.

---

### 11. Markup patterns that work as CSS hooks

All examples are original and use only constructs observed to survive. Put the HTML in the bio or description (HTML mode) and the CSS in the CSS editor.

**A. A block wrapper with a `custom-` class.** Empty `custom-` divs survive too: 13 were seen live (N6), and one survived a project-description save **[verified 2026-10-16 · live-t24]**.

```html
<div class="custom-card"><h3>Latest build</h3><p>v1.2 is out.</p></div>
<div class="custom-divider"></div>
```

```css
#wrapper .custom-card{padding:16px;border:1px solid currentColor}
#wrapper .custom-divider{height:2px;margin:24px 0;background:currentColor}
```

**B. A per-letter heading without inline variables.** Inline `--i` is stripped **[verified 2026-10-16 · live-s11, live-s12]**, so index the letters with `:nth-child` **[verified · repo-26 for the h1/span structure in a bio]**.

```html
<h1 class="custom-title"><span>N</span><span>a</span><span>m</span><span>e</span></h1>
```

```css
#wrapper .custom-title{font-size:2.5rem;font-weight:400}
#wrapper .custom-title>span:nth-child(2n){color:var(--itchio_link_color)}
```

Caveat: if the letters become `inline-block` (needed for transforms), Chrome builds the heading's accessible name with spaces between the letters ("N a m e") **[verified · repo-26]**. Plain inline spans read normally.

**B2. The accessible letter-split variant (empty letter spans).** Sections 07, 09 and 10 recommend keeping the real word in one visually hidden span and drawing each letter from an **empty** span's `::before` with empty alt text. That way the name is read once, without spaces:

```html
<h1 class="custom-title"><span class="custom-sr">Name</span><span class="custom-l"></span><span class="custom-l"></span><span class="custom-l"></span><span class="custom-l"></span></h1>
```

```css
#wrapper .custom-l:nth-child(2)::before{content:"N";content:"N" / ""}   /* one rule per letter */
```

On a project description the empty spans survive: a classed `h1` with a hidden-word span and two empty `span.custom-l` was stored intact **[verified 2026-10-16 · live-t23, live-t24]**. In a bio too: the same `h1` was stored intact, with both empty spans in the live page **[verified 2026-10-16 · live-t23]**.

- **For:** stored HTML keeps 149 attribute-less empty `<span></span>` on 60 pages, 32 empty `div.custom-*` on 8 pages, one empty `h1.custom-*`, and empty `strong`/`em`. So neither the editor nor the per-render sanitize prunes empty elements **[observed · gapfill05-01]**. The library model returns the same structure (a hidden-word span plus empty `custom-l` spans in a classed `h1`) byte-identical **[library model · gapfill05-02]**.
- **Against (census):** no live page in the census has an **empty span that carries a `custom-` class**. The 15 `custom-` hook spans seen hold `&nbsp;` **[observed · gapfill05-01]**. Runs 1 and 2 settle this for project descriptions and bios (live-t23, live-t24; bios: live-t23).
- **After saving,** check that the spans arrived (devlogs and jams are untested). In the logged-out page source, `<span class="custom-l"></span>` must appear once per letter, and the visible heading must not be blank. If they are missing, fall back to pattern B with plain letter spans, which is verified.

**C. A marker with fallback text, decorated by CSS.** `aria-hidden` is stripped, so keep the element's real text readable and make only the generated layer silent **[observed · repo-28; verified 2026-10-16 · live-a04]**:

- text with `color:transparent` stays in the accessibility tree;
- `content: … / ""` gives generated content empty alt text, and the plain declaration before it is the fallback for browsers without alt-text support **[verified in Chrome · N13]**.

```html
<p><span class="custom-hello">Hi!</span>, I make small games.</p>
```

```css
#wrapper .custom-hello{position:relative;color:transparent}
#wrapper .custom-hello::before{content:"Hola";content:"Hola" / "";position:absolute;inset:0;color:var(--itchio_link_color)}
```

**D. Hooks itch adds for you.** Use these instead of authoring attributes.

| Selector | What it selects | Evidence |
|---|---|---|
| `a[href][rel~=nofollow]` | off-site links | sanitizer-07, crawljam-33; live-l01 |
| `a[href]:not([rel])` | itch links (itch.io hosts and img.itch.zone) | sanitizer-07; N5; live-l02 |
| `img[loading=lazy]` | every content image | sanitizer-11; live-g01 |
| `.text-center`, `.text-justify` | editor alignment | sanitizer-03; live-k24, live-k25 |
| `.embed_preload` (`.youtube_preload`, `.other_embed`) | click-to-activate placeholders (projects; bio iframes stay live) | sanitizer-24; live-i01, live-i02, live-i04 |
| `details[open]>summary` | an opened disclosure | sanitizer-27 |

**E. Attribute hooks you may author.** `lang` and `title` are global on stock tags **[observed · sanitizer-10; verified 2026-10-16 · live-a08, live-a09, live-a21; `lang` also in a bio · live-a09]**, and `title` can feed generated text through `attr()`.

```html
<span class="custom-tip" title="coming 2027">Sequel</span> <span lang="ja">ありがとう</span>
```

```css
#wrapper .custom-tip::after{content:" (" attr(title) ")"}
#wrapper .user_profile :lang(ja){font-size:110%}
```

**F. Style itch-added tags through a wrapper.** `details`, `summary`, `figure` and `figcaption` never carry a class: 0 of 771 occurrences do. So put the class on a surrounding `div` **[observed · sanitizer-46, gapfill05-05; mechanism inferred]**. On a project description a class on `details`, `summary`, `figure` or `figcaption` is dropped **[verified 2026-10-16 · live-t08, live-t09]**. A bio save drops it from `details` and `summary` too **[verified 2026-10-16 · live-t08]**.

```html
<div class="custom-faq"><details><summary>Is it free?</summary><p>Yes.</p></details></div>
```

```css
#wrapper .custom-faq summary{cursor:pointer;font-weight:700}
#wrapper .custom-faq details[open]>summary{color:var(--itchio_link_color)}
```

**G. Anchors and `:target`.** Use an `a[name]` target plus an absolute-URL link **[observed · sanitizer-05]**. On a project page and on a profile an `<a name>` in the description or bio matches `:target` **[verified 2026-10-16 · live-l10]**; on devlogs and jams it is **[unverified]**.

**Avoid:**

- id selectors inside content, because ids are stripped;
- `[data-*]`, `[aria-*]` and `[role]` hooks, and `popover`/`popovertarget` toggles (use `details`/`summary`);
- an uppercase `Custom` prefix, which is dropped, and class tokens with `:`, `/`, `[`, `]` or `.` on devlogs and jams, where they are untested (`.` is untested in bios too) (§6);
- classes on `details`, `summary`, `figure` or `figcaption` (pattern F);
- `[style*=…]` selectors (§7);
- `b`/`i`-only selectors: a re-save turned them into `strong`/`em` on one page, though an HTML-mode save keeps them (§4);
- class names that ad blockers filter (§6).

---

### 12. Accessibility consequences

- **No ARIA in markup.** `aria-*` and `role` are stripped, in project descriptions and bios, so build meaning from semantic tags: headings, lists, `figure`/`figcaption`, `details`/`summary`, `blockquote` **[observed · sanitizer-09, repo-28; verified 2026-10-16 · live-a03 to live-a05, live-a20]**.
- **The bio `<h1>` becomes the page heading.** If your CSS hides itch's profile `h1`, keep exactly one visible `<h1 class="custom-…">` in the bio **[verified · repo-26]**.
- **Alt and frame titles are your job.**
  - Write `alt` on every image **[verified · community-20; verified 2026-10-16 · live-g02]**.
  - Iframes are never stored with `title` (0 of 261), and a project-description or bio save drops it, so caption them visibly **[observed · sanitizer-26, gapfill05-08; verified 2026-10-16 · live-i01]**.
- **Letter-split headings:** prefer plain letter spans (pattern B, verified). The empty-span variant (B2) reads better. Its empty spans survive on a project description and in a bio **[verified 2026-10-16 · live-t23]**; elsewhere check that they survived your save **[inferred · gapfill05-01, gapfill05-02]**.
- **Spoilers are keyboard-focusable** through the editor's `tabindex="0"`, which a hand-written spoiler also keeps on a project description and in a bio. Don't restyle them so their text shows by default **[observed · sanitizer-09; N2; verified 2026-10-16 · live-k34]**. In a bio a spoiler isn't hidden at all (§6) **[verified 2026-10-16 · live-k34]**.

---

### 13. Size limit

A profile bio's HTML is capped at **5,000 characters of the HTML you submit**, as the community reported **[community · community-09]**. On 2026-10-16 (live probe Run 4, in the bio's HTML mode) 5,000 ASCII characters saved and 5,001 were refused. The error is not a lightbox: the edit-profile page shows "Errors:" and then "data: profile: expected text between 1 and 5000 characters, or empty" **[verified 2026-10-16 · live-cap-D1]**. Only ASCII was tested; whether non-ASCII text counts as characters or bytes is unknown.

What itch adds to the served bio doesn't count. A 4,990-character bio with 10 off-site links saved, and was served at 5,470 characters once every link carried `rel="nofollow noopener"` and `referrerpolicy="origin"` **[verified 2026-10-16 · live-cap-D2]**. Served bios are often longer than their source: on one profile, 4,227 characters became 4,860 after `loading="lazy"` on 13 images and `rel`/`referrerpolicy` on 9 links **[community · community-09]**.

They can also be shorter. A 3,857-character probe bio saved without any message. It was served as 3,633 characters from the container tag to its end marker, with CRLF line breaks (32 CR), about 6 % less: it lost more attributes and class tokens than it gained, and got no embed placeholders **[verified 2026-10-16 · live-html; cause inferred]**. So the growth depends on the markup, and neither direction matters for the cap. Minify the bio HTML, measure the source you paste, and keep a local backup **[community · community-22]**.

This cap is separate from the profile's CSS cap of 5,120 UTF-8 bytes, which the CSS editor reports in a lightbox **[verified 2026-10-16 · live-cap-A1, live-cap-A2c]** (see the CSS-editor section).

Project descriptions grow too. The 18,092-character probe was served as 19,994 characters from the container tag to its end marker, about 10 % more, with CRLF line breaks (155 CR), escaped tags, injected attributes and embed placeholders **[verified 2026-10-16 · live-html]**. No description cap was tested.

---

### 14. Unknowns (need an itch account to settle)

1. Escape vs. strip for unknown tags (`<svg>`, `<marquee>`), and whether `<!-- -->` is escaped or stripped. **Settled for project descriptions:** both are escaped as visible text (live-t11, live-t13, live-e04). **Bios:** a comment, `<link>` and `<meta>` are escaped too (live-e04, live-t21); `<svg>` and `<marquee>` weren't tested there. Open for devlogs and jams.
2. The exact class filter. **Settled for project descriptions:** a case-sensitive prefix test on `custom`; `Custom-x` is dropped, an empty or bare `class` is removed, and tokens with `: / [ ] .` are kept (H1) (live-k01 to live-k21, live-k32, live-k33; §6). **Bios:** the same for every token tested (live-k01, live-k05, live-k07, live-k09, live-k11, live-k14, live-k16, live-k26, live-k31). Open for devlogs and jams.
3. Whether the editor normalises markup (quotes, CR, `/>`, raw `<`) before submitting. **Settled for project descriptions in HTML mode:** the §10 hazards do bite (live-g07, live-e06, live-t12, live-e07, live-e08). Still open: whether the editor or the server does it (M01).
4. Iframes in profile bios: are they allowed, and are they click-to-activate? Which hosts are rejected? Settled live: `allow` and `loading` are dropped. **Settled for project descriptions:** `title` is dropped too, and no tested host is rejected (live-i01 to live-i07, live-i10). **Settled for bios:** allowed and live, never click-to-activate; YouTube and an arbitrary `https://` host were kept, minus the same attributes (live-i01, live-i04). Other bio hosts are untested.
5. Whether inline style depends on custom-CSS access. Runs 1 and 2 used an account with access, so this is still open.
6. Whether itch-added tags (`details`, `figure`, …) really reject `class`/`style` (0 of 771 carry one, and the library mechanism predicts rejection) or were just never given any. **Settled for project descriptions:** they reject them (live-t02, live-t08 to live-t10). **Bios:** `details` and `summary` reject them too (live-t08).
7. Spoiler markup in bios and project descriptions. **Settled for project descriptions:** a hand-written `<span class="spoiler" tabindex="0">` survives whole and is hidden until focus (live-k34). **Settled for bios:** it survives whole, `tabindex` included, but is not hidden, because bios lack `.user_formatted` (live-k34).
8. The bio cap's unit (source vs. stored, characters vs. bytes) and what happens past it. **Settled on 2026-10-16** by the cap probe (`probes/probe-cap.md`, D): 5,000 characters of the submitted HTML, not the served one; 5,001 is refused with an inline error on the edit page (live-cap-D1, live-cap-D2). Still open: whether non-ASCII text counts as characters or bytes.
9. `:target` on `a[name]`. **Settled for project pages and profiles (bio):** it matches (live-l10).
10. Whether an **empty `<span class="custom-…"></span>`** inside a bio `<h1>` survives a save (pattern B2). Library model and indirect live evidence say yes. **Settled for project descriptions and bios:** it survives (live-t23, live-t24; bios: live-t23).
11. Whether inline `--i:3`, `popover` and `popovertarget` are dropped (library model: yes; 0 live samples). Whether the 6 never-seen properties of the 27-list are kept, and whether `border-radius` and `display` really go. **Settled for project descriptions:** all three attributes are dropped, the six properties are kept, and `border-radius` and `display` go (live-s05, live-s08 to live-s12, live-a12, live-a14). **Bios:** `--i:3` and `popover` are dropped, the six properties kept and `border-radius` dropped (live-s08, live-s11, live-s18, live-a12); `popovertarget` and `display` weren't tested there.

**Live probe Run 1 (2026-10-16, a draft project's description) settled the project-description parts above, and Run 2 (the same day, the owner's profile bio with `probes/probe-bio.html`, logged in and logged out) the bio parts it covered.** Still needed: `probes/probe-description.html` on a draft devlog post and a draft jam for those fields (`probes/README.md`), and a non-ASCII bio for the rest of item 8 (Run 4 settled the ASCII cap). The original one-probe recipe and its expected library-model output are in `evidence/gapfill.md` ("Open: needs the account owner"). Only the account owner can run them.

---

### Section notes (evidence added for this section, 2026-10-14)

All checks ran offline in this session over pages other dimensions had already downloaded today. This section made **0 new itch requests**.

- **Raw inputs** (scratchpad only, not in the repo): `sanitizer/live/all`, `crawlprofile/raw`, `crawlproject/raw`, `crawljam/raw`, `sanitizer-verify2/live` (incl. `wayback/`), `crawljam-verify2/raw`, `crawlprofile-verify2/raw`, and the stylesheet copies in `sanitizer-verify2/static` (`?1791981660`, fetched 15:08).
- **Scripts:** `knowledge/evidence/section05-tools/` (`s05containers.py`, `s05check.py`, `s05extra.py`, `s05attrs.py`), plus new counters `hrefs.py`, `norel_hosts.py` and `styleprops.py` in the scratchpad folder `section-05-v2/`. All print counts only, never third-party content.
- **Run:** `python -I <script> [tools-dir] <dirs…>`. Containers are deduplicated by (kind, body hash).

| Id | Check | Result |
|---|---|---|
| N1 | Container class strings (`s05containers.py`), counted per page | bio `div.formatted.user_profile` 75; project `div.formatted_description.user_formatted` 107; devlog `section.base_widget.object_text_widget_widget.post_body.user_formatted` 19; jam `div.jam_content.user_formatted` 62. Deduplicated containers: 48 bios, 96 project, 18 devlog, 50 jam, 3,749 comments. |
| N2 | Stylesheet per page type, and rule grep in itch CSS | profile pages link `user.css`; project and devlog pages `game.css`; jam pages `jam.css`. All three have `.user_formatted .spoiler…` (hidden until focus), `.user_formatted img,.user_formatted iframe{max-width:100%;border:0}`, `.user_formatted table…`, `.formatted img{max-width:100%}`, `.formatted img[width][height]{height:auto}`, `.text-center/.text-right/.text-justify`, and `.embed_preload{…max-width:100%;…display:inline-flex…}`. Only `game.css` has `.user_formatted a[rel~=nofollow]:hover:after` and the `…:hover>img` ring. `user.css` has the `.user_profile.formatted` scale: 1.1428571429em; h1 2em, h2 1.5em, h3 1.25em, h4 1.125em. |
| N3 | Iframes and placeholders (`s05check.py`) | bios 0 iframes; project 74 iframes + 11 placeholders; devlog 2 + 0; jam 22 + 0 |
| N4 | Inline style census (`styleprops.py`, `s05check.py`) | 216 user style attributes (project 96, jam 83, bio 28, comment 9); 178 non-empty, 30 empty; 0 properties outside the 27-list; 0 values ending in `;` or with outer whitespace; 69/69 multi-declaration values joined by `"; "`. Containers with inline style but no `style#custom_css` on the page: bios 12 of 15, project 19 of 28, comments 8 of 8 (jam CSS lives in `jam_theme`, so jams are excluded). |
| N5 | href schemes and `rel` by host (`hrefs.py`, `norel_hosts.py`) | All hrefs are `http`/`https`/`mailto`; 0 relative, `#` or `//`. Off-site with the pair: bios 121/121, project 637/637, jam 419/419, devlog 7/7, comments 131/131. itch hosts with no `rel`: bios 39, project 214, jam 238, devlog 13, comments 128 (0 with `rel`). `img.itch.zone` links with no `rel`: 12/12 (project 10, devlog 1, comment 1). Href-less `<a>`: 6 `a[name]` without `rel`, 6 stripped-href anchors with `rel` (project), 1 bare `<a>` (jam). |
| N6 | Class tokens and style values (`s05extra.py`) | bios: `text-center` 42, `custom-*` 33, `text-justify` 2. Project: `text-center` 390, `custom-*` 132, `text-justify` 25, plus itch's embed classes. Jam: `text-center` 318, `custom-*` 255, `custom_*` 61, `spoiler` 2. Devlog: `custom-*` 1. Comments: `embed_preload` 44, `language-css` 7 (on `code`), `toggle_post_body` 6, `spoiler` 2, `text-center` 1. Empty `<div class="custom…"></div>`: project 10, bio 1, jam 2. `var()` inside inline values: project 15, bio 4, comment 1. Custom-property declarations: 0. |
| N7 | `tabindex` and spoiler markup | `span.spoiler[tabindex]`: jam 2, comments 2. No other `tabindex` in any container. |
| N8 | Serialisation (`s05attrs.py`, `s05check.py`) | Non-comment: 13,001 opening tags (itch's `button` excluded), 8,482 attribute values, all `"`-quoted; 0 single-quoted, unquoted or bare; 0 `/>`. Comments: 6,945 tags, 3 `/>` (`img` 2, `br` 1). 0 tags contain CR or LF. CR bytes between tags in 34/48 bios, 93/96 project, 11/18 devlog and 49/50 jam containers. 0 `&lt;!--`. |
| N9 | Empty paragraphs | `<p><br></p>`: bio 10 (8 containers), project 134 (37), devlog 16 (3), jam 75 (18). `<p></p>`: 12 / 52 / 1 / 25. `<p>&nbsp;</p>`: project 12, jam 12. |
| N10 | `<b>`/`<i>` in the HTML-basement guide across Wayback captures (`sanitizer-verify2/live/wayback`) | 2023-02-02 and 2024-05-04: `<b>` 1, `<i>` 6, `<strong>` 8 and 10, `<em>` 11. 2025-04-18, 2025-11-22, 2026-04-13, 2026-06-10 and today: `<b>` 0, `<i>` 0, `<strong>` 12, `<em>` 19. This is the same window in which `<wbr>` became escaped text. Comments still keep `b`/`i` (sanitizer-13), so the cause is inferred to be editor normalisation on re-save, not the server whitelist. |
| N11 | `srcset` and authored `loading` | Library probe (`sanitizer/ws_results.json`, `ws_verify.json`): `<img … loading="eager" srcset="x 2x" class="custom-i">` keeps `src`, `alt`, `title`, `width`, `height`, `align` and drops `loading`, `srcset` and `class` (default whitelist). Live: 0 of 716 content images carry `srcset`. |
| N12 | Library inline-style probes (read `sanitizer/v2_probe_results.json` and `section05-tools/s05_probe.json`) | `--i: 1` gives `""`; `--i: 1; color: red` gives `color: red`; `background: var(--gold)` gives `""`; `font-size: 2em`, `font-size: auto` and `font-size: -10px` are kept; `opacity: 50%` and `border: 2px solid var(--gold)` are kept; `color: red;\r\nwidth: 10px` gives nil; `color: red;\nwidth: 10px` gives `color: red; width: 10px`; `"  color: red"` gives `color: red`. |
| N13 | Generated-content alt text (read `knowledge/evidence/support.md`) | `content:"x" / ""` removes the generated text from the accessible name, and the two-declaration fallback works, in Chrome's accessibility tree. `color:transparent` text is still announced. Firefox and Safari were not tested. |
| N14 | Official guide wording (read `sanitizer-verify2/live/cssguide.html`, fetched 15:08 today, and the private repo's offline copy) | The "Custom classes" text matches docs-34 and docs-35 word for word. |

**Gap-fill notes (round 2, 2026-10-14).** Full method, commands and tables are in `knowledge/evidence/gapfill.md`, section "Gap fill for 05-html-in-descriptions.md". Tools are in `knowledge/evidence/gapfill-05-tools/`. 0 itch requests; the corpus is 885 same-day scratchpad pages.

| Id | Check | Result |
|---|---|---|
| gapfill05-01 | Empty elements (`g05r2empty.py`) | Attribute-less empty `<span>`: 149 on 60 pages. Empty `div.custom-*`: 32 on 8 pages. One empty `h1.custom-*`. Empty `strong`/`em` kept. Empty `span.custom-*`: 0 (15 hold `&nbsp;`, on 2 pages). |
| gapfill05-02 | Library model, letter-split `h1` (`g05r2probe.py`) | Byte-identical under both class-filter hypotheses; `html.moon` has no empty-element pruning |
| gapfill05-03 | Class tokens | 1,204 authored `custom*` tokens. 74 have uppercase after the prefix (3 pages). 0 contain `: / [ ] .`; 0 start with `-` or an uppercase prefix; 0 empty `class`. 0 of 2,293 values carry stray whitespace. |
| gapfill05-04 | Library predictions for open class cases | H1 (prefix) vs H2 (strict) table in §6 |
| gapfill05-05 | itch-added tags | 0 of 771 occurrences carry an attribute. streak.club `helpers/html.moon` adds `del = true`, and `check_attribute` then drops every attribute. |
| gapfill05-06 | Attribute census (`g05r2attrs.py`) | 35,801 authored tags. 0 `aria-*`/`role`/`id`/`on*`/`popover*`/authored `data-*`. Only itch's spoiler `tabindex` and `a[data-image_lightbox]`. |
| gapfill05-07 | Inline custom properties | 0 in 680 live style attributes. Library: `--i:3` gives `style=""`. |
| gapfill05-08 | Iframes (`g05r2iframes.py`) | 261 iframes, 11 hosts. Attribute names are only `src width height frameborder allowfullscreen scrolling style`. A Spotify embed (documented code fetched today) lost `allow` and `loading`, and its `border-radius` style became `style=""`. 0 iframes in 50 bios. |
| gapfill05-09 | Inline-style census (`g05r2styleprops.py`) + fixed point | 21 of 27 properties seen, 0 outside the list. 6 never seen. 207 of 207 distinct live values are unchanged by the library's `sanitize_style`. |

**Corrections against the previous draft of this section:**

- The claim "your HTML cannot close itch's wrappers" is wrong. A raw `< div` can append a stray `</div>` that closes itch's container (sanitizer-19).
- `font-size` accepts any keyword, including `auto` and `-10px`. Only decimal dimensions and `calc()` are dropped (sanitizer-23).
- Iframe hosts are not known to be open: only four or five hosts were observed (sanitizer-26, crawljam-32).
- `img.itch.zone` links are treated as internal, so `a:not([rel])` selects them too (N5).
- §7 said the inline-style whitelist is "exactly 27 properties [observed]". The list is web_sanitize's default `css_whitelist.moon`: a **library model**, with 21 of its 27 properties observed live (gapfill05-09). The "dropped" list is library-inferred too, apart from one live `border-radius` drop on an iframe (gapfill05-08).
- "About 350" itch-added tag occurrences without attributes is now 771 in the wider census (gapfill05-05).
- Iframe hosts: 11 seen, not "four or five" (gapfill05-08).
- Live probe Run 1 (2026-10-16, a project description) corrected these library-model or inferred claims: that class tokens with `: / [ ] .` are dropped or untested, that `<wbr>` and `<video>` are escaped (and that `<wbr>` was removed from the whitelist), that authored `tabindex` never survives, that an LF inside `style` or inside a tag is harmless, that `language-css` is comment-only, that a dropped relative href gets `rel`, and that a `data:` image keeps its `<img>` (live-k07 to live-k15, live-t11, live-t14, live-k34, live-s31, live-e06, live-t03, live-l04, live-g06).
- Live probe Run 2 (2026-10-16, the owner's profile bio, logged in and logged out) replaced the "unknown" bio iframe row (bio iframes stay live, with no placeholder) and confirmed two inferred bio claims: a spoiler is not hidden there, and empty `custom-` letter spans survive (live-i01, live-i04, live-k34, live-t23).
