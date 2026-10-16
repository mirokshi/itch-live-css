## External CSS: fonts, frameworks and dynamic services

This section covers everything your itch custom CSS loads from **another origin**: a Google Fonts `@import`, a CDN-hosted stylesheet (jsDelivr, unpkg, cdnjs, GitHub Pages), a self-hosted `@font-face`, a framework (Bootstrap, Tailwind, Animate.css), or a small server that returns different CSS on every visit. Read it before you write any `@import`, `@font-face` or absolute `url()`.

Tags: `verified YYYY-MM-DD` = reproduced by a direct test or live observation; `documented` = vendor docs, specs or MDN; `observed` = seen live but not systematically; `community` = third parties only; `inferred` = deduced from verified facts; `unverified` = not checked. Ids starting with `x08-` are checks made while writing this section (see **Section notes**). `evidence/<file>.md §n` points to the evidence logs in `knowledge/evidence/`. Ids starting with `g08-` come from the gap-fill pass in `evidence/gapfill.md` ("Gap fill for 08-external-css.md"); its scripts are in `evidence/gapfill08-tools/`. Lab results come from **Chromium** (Chrome 152/155) unless a row says otherwise. Only the import-failure timings in §5.1 were also measured in Firefox 142 and WebKit 26 (Playwright's Windows port, not Safari). Ids starting with `live-` come from the live probe runs of 2026-10-16 (Brave 155 = Chromium 155; `evidence/live-probes/`): Run 1 on the owner's draft project page (owner logged in), Run 2 on the owner's profile (logged in and logged out). Each holds only for the page types its text names.

### TL;DR for an AI writing itch CSS

1. **Put every `@import` on the first lines of the pasted CSS, before any rule.** A late `@import` is dropped with no console message **[verified 2026-10-14 · localtests-09, itchcss-08]**.
2. **On jam pages `@import` never loads.** Declare fonts with `@font-face` and an absolute `https://` URL instead **[verified 2026-10-14 · crawljam-02, itchcss-07]**.
3. **Always use `https://`.** Browsers block `http://` stylesheets and fonts as mixed content **[documented · external-35]**. itch itself stores `http://` `@import` and `@font-face` URLs unchanged (project, profile), so only the browser stops them **[verified 2026-10-16 · live-c04, live-c10]**.
4. **The imported file must be served as `text/css`.** Never import from `raw.githubusercontent.com` or gist raw URLs. Use jsDelivr with a **pinned semver tag**: `https://cdn.jsdelivr.net/gh/USER/REPO@1.2.3/file.css` **[verified 2026-10-14 · external-04, external-05, external-45]**.
5. **Fonts need CORS** (`Access-Control-Allow-Origin`); stylesheets and background images don't **[verified 2026-10-14 · external-16, localtests-40]**.
6. **Every `@import` delays first paint** until the file arrives. Keep it to one fast, flat file **[verified 2026-10-14 · external-07, external-09]**. If a host accepts the connection and then never answers, Chrome and Firefox showed a blank page for more than 330 s, with no timeout. Give a dynamic service a short `maxDuration` (§5.1, §10.2) **[verified 2026-10-14 · g08-17; documented · g08-19]**.
7. **The pasted CSS must look complete without the import.** Outages and content blockers drop the import silently **[verified 2026-10-14 · external-06, localtests-12; observed 2026-10-12 · repo-14]**.
8. **Never import a CSS framework as-is.** Its resets restyle itch's own UI outside `#wrapper`, and its class names don't survive itch's HTML sanitizer anyway **[verified 2026-10-14 · x08-03, g08-11]**. Prefixing it with `#wrapper` is still not enough, because itch's own header, game grid and footer live inside `#wrapper` (§12.2) **[verified 2026-10-14 · g08-12]**.
9. **Google Fonts:** copy the URL from fonts.google.com, keep `&display=swap`, and remember that every visitor's IP goes to Google, which is a GDPR risk in the EU **[verified 2026-10-14 · external-38, external-39; community · external-43]**.
10. **Never set cookies or log visitors from a CSS host.** Your host sees the full itch page URL of every view **[verified 2026-10-14 · external-32, external-47]**.

---

### 1. What itch allows

#### 1.1 itch keeps imports verbatim and never fetches them

- **itch stores the pasted CSS as written.** The live `style#custom_css` of a profile (4,725 chars) matched the pasted file exactly, including a non-Google `@import` and a raw `>` combinator. itch doesn't proxy, rewrite or HTML-escape the URL, so each visitor's browser fetches it straight from your host **[verified 2026-10-14 · external-01]**.
  - On a project and on the profile, all six `@import` forms tested (non-Google `https://`, `http://`, `data:`, and `data:` with `layer()`, `supports()` or a media query) were stored as sent and parsed as `CSSImportRule`s, and so was a raw `>` combinator **[verified 2026-10-16 · live-c03 to live-c08, live-c23]**.
  - It is not strictly byte for byte there: on both, itch trims leading and trailing whitespace and deletes every `</style>`; line breaks are stored as CRLF on the project and as LF on the profile **[verified 2026-10-16 · live-css, live-c42, live-c43]**.
- **Only the `@import` line counts toward the editor cap.** itch never sees the imported file, so it can be any size and change at any time. The owner's profile imports a sheet of about 14.8 KB, roughly 3× the profile cap of 5,120 UTF-8 bytes **[verified 2026-10-14 · repo-09, external-01; cap: verified 2026-10-16 · live-cap-A2c]**. The cap per page type is covered in `01-how-it-works.md`; project CSS has none **[verified 2026-10-16 · live-cap-B1]**, so on projects an import is for hosting or per-visit output, not for size.
- **Google and non-Google hosts both survive on profile and project pages.** In a 62-page corpus, 21 pages used `@import`: `fonts.googleapis.com` on 16, `cdn.jsdelivr.net` on 5 and a `vercel.app` service on 1. On all 18 profile and project pages, the imports came before every rule, with only comments in front **[verified 2026-10-14 · corpus-21]**. A non-Google `https://` `@import` saved on a draft project and on the profile was kept and requested by the browser **[verified 2026-10-16 · live-c03]**.
  - On a live profile the first `@import` sits at char 0 and the second one follows it directly (char 176) **[verified 2026-10-14 · crawlprofile-30]**.
- **External imports are rare on popular games.** 0 of 69 sampled top, featured and best-selling project pages used `@import`, `@font-face` or an external `url()` (8 of them had custom CSS at all) **[verified 2026-10-14 · evidence/external.md §1d]**.

#### 1.2 No Content-Security-Policy blocks external resources

| Page type | CSP sent | Effect on `@import`, fonts, images | Evidence |
|---|---|---|---|
| Profile (`<user>.itch.io/`) | **none**, neither header nor `<meta>` (0 of 72 header sets; no CSP header in the owner's or the logged-out view on 2026-10-16) | not restricted | [verified 2026-10-14 · crawlprofile-31, repo-11, external-34; verified 2026-10-16 · live-dom] |
| Project page | only `frame-ancestors 'self' https://itch.io` (52/52 responses; also on the owner's logged-in view of a draft project) | not restricted | [verified 2026-10-14 · crawlproject-43, corpus-24; verified 2026-10-16 · live-dom] |
| Devlog post, devlog index, comments | none | not restricted | [verified 2026-10-14 · crawlproject-43, corpus-24, external-34] |
| Jam overview, entries, rate | none | not restricted (but `@import` itself is invalid there, §2.3) | [verified 2026-10-14 · crawljam-30, itchcss-48, corpus-24] |

- Every itch response also sends `X-Frame-Options: SAMEORIGIN` (except project pages, which use the CSP above), `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block` and `Referrer-Policy: no-referrer-when-downgrade` **[verified 2026-10-14 · crawlprofile-31, crawljam-30]**. The live profile sent `X-Frame-Options: SAMEORIGIN` to the owner and to logged-out visitors alike **[verified 2026-10-16 · live-dom]**.
- Live custom CSS loads images from `img.itch.zone`, `i.imgur.com`, `i.ibb.co`, `i.postimg.cc` and a cursor site, and fonts from `fonts.googleapis.com` and `fonts.gstatic.com` **[verified 2026-10-14 · crawlproject-43; observed · crawljam-48]**.
- **The claim "itch blocks external stylesheets because of CORS"**, found in a public GitHub theme README, is **false** **[verified 2026-10-14 · community-14]**. Its likely origin is importing from `raw.githubusercontent.com`, which fails because of the MIME type (§3.2). That origin story is speculation **[documented · community-13]**.
- What does limit you: HTTPS, a correct MIME type, CORS for fonts, and the visitor's own blockers **[verified 2026-10-14 · community-14]**.
- **This can change.** If itch ever adds a `style-src` CSP, every external import would fail silently, so keep the pasted CSS self-sufficient **[verified 2026-10-14 · external-34]**.

#### 1.3 What the official guide says (and doesn't)

- The guide's whole "External content" rule is two sentences: external images and fonts "should" be on **reliable HTTPS hosting**, or Base64-embedded in the CSS **[documented · docs-37, external-35]**. Browsers enforce the HTTPS part anyway (§3.1).
- The guide never mentions `@import`, Google Fonts, JavaScript, animations, `!important`, reduced motion or dark mode. **Never cite it as allowing or forbidding any of these** **[verified 2026-10-14 · docs-38]**.
- No public itch statement describes filtering of the CSS text. itch's open-source sanitizer library has no stylesheet sanitizer, only one for `style=""` attributes **[documented · sanitizer-35]**. In practice itch does filter one thing: on a project and on the profile every `</style>` is deleted from the served sheet (whether at save or at render is not known), in any case and with inner spaces (`</STYLE >`), even inside comments and strings. Apart from trimming the outer whitespace (and, on the project, storing CRLF line breaks), nothing else in the sheet changes **[verified 2026-10-16 · live-c01 to live-c45, live-css]**.
- Policy rules that also touch external CSS (no tracking, hosting terms) are in `02-rules-and-policy.md`.

---

### 2. Where `@import` works

#### 2.1 Placement rules (profile, project, devlog)

On these pages `style#custom_css` is its own stylesheet, placed after itch's base CSS and the theme's `<style>` **[verified 2026-10-14 · evidence/external.md §1b; documented · crawlproject-44]**. On the owner's view of a draft project the order was two `static.itch.io` links, `style#game_theme`, then `style#custom_css` **[verified 2026-10-16 · live-dom]**. On the live profile it was one `static.itch.io` link logged out (two for the owner), `style#user_theme`, then `style#custom_css` **[verified 2026-10-16 · live-dom]**. Standard CSS placement rules apply:

```css
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");
@import url("https://cdn.jsdelivr.net/gh/USER/REPO@1.4.0/extra.css");
/* every other rule comes after the imports */
#wrapper .custom-title { font-family: "Syne", sans-serif; }
```

| What comes before (or between) the imports | Result | Evidence |
|---|---|---|
| nothing, or only comments | works | [verified 2026-10-14 · itchcss-08, corpus-21; documented · crawlproject-44] |
| `@charset "UTF-8";` or an `@layer a, b;` statement **before the first** import | works, also on a live project page and on the profile | [verified 2026-10-14 · localtests-09, localtests-50; verified 2026-10-16 · live-c01, live-c02, live-c05 to live-c08] |
| any style rule, nested ones included | import **dropped**: absent from the CSSOM, never requested, no console warning. Rules before it still apply | [verified 2026-10-14 · localtests-09, itchcss-08] |
| `@font-face`, `@property`, `@keyframes`, even an empty `@media screen{}` | import **dropped** | [verified 2026-10-14 · localtests-50] |
| an `@layer y;` statement **between** two imports | the second import is downloaded (200 in DevTools) but **never applied** | [verified 2026-10-14 · localtests-10] |
| `@import` inside `@media{}` or `@supports{}` | invalid, not requested | [verified 2026-10-14 · localtests-11; evidence/external.md "Verification"] |
| a rule the browser discards as invalid (`@foo;`, a `::-moz-selection` rule in Chromium) | doesn't count; the import still works | [verified 2026-10-14 · localtests-50] |

- **Lesson:** a 200 in the Network panel does not prove that an imported sheet applies. Check computed styles **[verified 2026-10-14 · localtests-10]**.
- **Cross-browser trap:** whether a rule counts depends on whether *this* browser considers it valid. A `::-moz-selection{}` rule before an `@import` is harmless in Chromium but would kill the import in Firefox, where the selector is valid **[inferred · localtests-50]**. Put nothing but comments before the imports.

#### 2.2 Conditional imports

- `@import url(x.css) supports(display:grid)` and `@import url(x.css) screen and (min-width:1px)` work in Chromium. The string form `@import "x.css";` works too **[verified 2026-10-14 · localtests-11]**. On a live project page and on the profile, imports with `supports(display:grid)` and with `screen` applied as well **[verified 2026-10-16 · live-c07, live-c08]**.
- **A `data:` URL works as an import target.** On a live project page and on the profile, `@import url("data:text/css,…")` applied on its own, with `layer()`, with `supports()` and with a media query **[verified 2026-10-16 · live-c05 to live-c08]**. It needs no host, so it can give part of the pasted CSS a condition or a layer. It saves no characters: the imported text is still in the pasted CSS, percent-encoded (at least `#` as `%23`), and counts toward the cap. It is dead on jams like every `@import` (§2.3) **[inferred]**.
- A **false `supports()`** import is neither fetched nor kept in `cssRules` **[verified 2026-10-14 · localtests-11]**.
- A **non-matching media** import (`print`, `(min-width:100000px)`, `(prefers-reduced-motion: reduce)` on a no-preference browser) is **still downloaded and still render-blocking**, just not applied **[verified 2026-10-14 · localtests-11; evidence/external.md §2b]**. A media condition saves neither bandwidth nor paint time.
- The same URL imported twice in one sheet produces 1 request **[verified 2026-10-14 · evidence/external.md "Verification"]**.
- `@import url(…) scope(#wrapper)` (a css-cascade-6 draft) is **not supported** in Chrome 155. The condition is parsed as an unknown media query, so the sheet is fetched and never applied **[verified 2026-10-14 · evidence/external.md §2c]**. You cannot scope a third-party sheet at import time.

#### 2.3 Jam pages: `@import` is dead, use `@font-face`

- On jam pages, itch appends your custom CSS **after the theme's rules inside `style#jam_theme`**, so any `@import` in it is invalid and dropped. `@charset` is dropped the same way **[verified 2026-10-14 · crawljam-02, itchcss-07]**.
- Live proof: the GDevelop Big Game Jam 10 overview has a Google Fonts `@import` at offset 1,733 of that sheet, and its CSSOM holds 27 style rules and 0 `CSSImportRule`. Its heading font never loads **[verified 2026-10-14 · crawljam-02, itchcss-07]**.
- Nothing visibly breaks, because the rules after the dead import still apply. The only symptom is a missing font **[verified 2026-10-14 · crawljam-02]**.
- `@font-face`, `@layer`, `@media` and `@keyframes` placed mid-sheet parse fine. A live jam pastes 28 Google Fonts `@font-face` blocks directly, and all of them parse as `CSSFontFaceRule` **[verified 2026-10-14 · crawljam-02]**.
- Jam CSS may reference HTTPS assets on other domains (`img.itch.zone`, `fonts.gstatic.com`, a host's own site), since jam pages send no CSP **[observed · crawljam-48; verified 2026-10-14 · crawljam-30]**.
- Whether itch's jam editor could ever place an `@import` first is untested. Treat it as never working **[verified 2026-10-14 · itchcss-07]**. Alternatives are `@font-face` with an HTTPS `src` (§8.4) or the theme editor's Google Fonts picker, which adds its own `<link>` **[verified 2026-10-14 · crawljam-02, itchcss-07]**.

#### 2.4 What external CSS can't reach

Embedded HTML5 games run on `html-classic.itch.zone`, a separate origin (no CSP, no X-Frame-Options, long Cloudflare cache). Neither pasted nor imported CSS reaches inside the game; style only `.game_frame`, `.embed_wrapper` and the placeholder buttons **[verified 2026-10-14 · crawlproject-45]**.

---

### 3. Requirements for the imported file

#### 3.1 Host checklist

| Requirement | Why | Symptom if ignored | Evidence |
|---|---|---|---|
| `https://` URL | itch pages are HTTPS. Stylesheets and fonts are *blockable* mixed content. Only CSS images (`background-image`, `border-image`) may be auto-upgraded, and never when the host is an IP address. MDN's page is inconsistent on CSS images; the Mixed Content spec is clear. itch saves `http://` `@import` and `@font-face` URLs unchanged (project, profile), so nothing stops you before the browser does | nothing loads | [documented · external-35, docs-37; verified 2026-10-16 · live-c04, live-c10] |
| `Content-Type: text/css` (charset optional) | itch pages have `<!DOCTYPE HTML>` (standards mode), which rejects `text/plain`, `text/html` and `application/octet-stream` sheets, same-origin or cross-origin, via `@import` or `<link>` | sheet silently ignored | [verified 2026-10-14 · external-04, localtests-14] |
| HTTP 2xx | 404 and 500 are ignored even with a CSS body. Redirects are followed, cross-origin ones too (302 → 200 applies, 302 → 404 doesn't) | sheet ignored; the rest of your CSS still applies | [verified 2026-10-14 · external-06] |
| UTF-8, declared | on a UTF-8 page like itch's, a `text/css` file without a charset decoded correctly. To be safe everywhere, send `text/css; charset=utf-8`, start the file with `@charset "UTF-8";`, or write non-ASCII as `\hex` escapes | mojibake in `content:` strings | [verified 2026-10-14 · localtests-15] |
| CORS **for fonts** and `mask-image` files (the cases tested; not for sheets or `background-image`) | they are fetched in CORS mode with the itch page as `Origin`, even when the `@font-face` sits in a sheet on the font's own host | `FontFace.status` = `error`, fallback font, console CORS error | [verified 2026-10-14 · external-16, localtests-40] |
| no CORS for the stylesheet or `background-image` | `@import` from an inline `<style>` is fetched in `no-cors` mode | n/a | [verified 2026-10-14 · localtests-13, localtests-19] |
| a stable production URL | Vercel per-deployment hash URLs sit behind Vercel's login when deployment protection is on, so visitors can't load them | sheet ignored for everyone except you | [verified 2026-10-14 · repo-12] |

Two traps:

- **A doctype-less local test page hides MIME bugs.** In quirks mode a *same-origin* `text/plain` sheet is applied, but the same file fails on itch **[verified 2026-10-14 · localtests-14, external-04]**.
- **A response with no `Content-Type` header** was applied in Chrome (the spec treats it as text/css). Don't rely on it **[verified 2026-10-14 · external-04]**.

#### 3.2 Which hosts serve CSS correctly

| Host / URL shape | `Content-Type` | Use for `@import`? | Evidence |
|---|---|---|---|
| `raw.githubusercontent.com/USER/REPO/BRANCH/file.css` | `text/plain` + `nosniff`, `max-age=300` | **No**, the browser ignores it | [verified 2026-10-14 · external-05, community-13] |
| `gist.githubusercontent.com/USER/ID/raw` | `text/plain` + `nosniff` | **No** | [verified 2026-10-14 · external-05] |
| `cdn.jsdelivr.net/gh/USER/REPO@TAG/file.css` | `text/css; charset=utf-8`, ACAO `*` | **Yes** (preferred for GitHub-hosted CSS) | [verified 2026-10-14 · community-12, corpus-23] |
| `cdn.jsdelivr.net/npm/PKG@VERSION/file.css` | `text/css`, ACAO `*`, immutable | Yes | [verified 2026-10-14 · external-05, x08-01] |
| `unpkg.com/PKG@VERSION/…`, `cdnjs.cloudflare.com/…` | `text/css`, ACAO `*` | Yes | [verified 2026-10-14 · external-05] |
| `USER.github.io/…` (GitHub Pages) | `text/css`, `max-age=600` | Yes | [verified 2026-10-14 · external-05, external-45] |
| your own function (Vercel etc.) | whatever you set | Yes, if it sends `text/css` | [verified 2026-10-14 · external-17] |

- **Fonts from `raw.githubusercontent.com` do load.** They come as `application/octet-stream` with ACAO `*`, and `nosniff` only blocks *style* (and script) destinations. A community profile uses such a TTF **[documented · community-13]**.

#### 3.3 Relative URLs

- A relative `url()` typed **in the itch editor** resolves against the **page URL** (`https://<user>.itch.io/…`), which is almost never what you want. Always write absolute `https://` URLs in the editor **[verified 2026-10-14 · localtests-19]**.
- A relative `url()` **inside an imported sheet** resolves against **that sheet's URL**, also cross-origin and through nested imports. A service or CDN file may use URLs relative to itself, as Fontsource's CSS does with `url(./files/…woff2)` **[verified 2026-10-14 · localtests-19, x08-05]**.

---

### 4. Caching: pin versions or wait up to a week

jsDelivr URL forms (all return `text/css; charset=utf-8`, ACAO `*` and `nosniff`):

| URL form | `x-jsd-version-type` | `Cache-Control` | Effect of a `git push` |
|---|---|---|---|
| `…/gh/USER/REPO@1.2.3/file.css` (semver tag) | `version` | `public, max-age=31536000, s-maxage=31536000, immutable` | none: the URL never changes |
| `…@<full 40-char commit SHA>/file.css` | `commit` | same 1-year immutable | none |
| `…@main/file.css` (branch) | `branch` | `public, max-age=604800, s-maxage=43200` | visible after up to **12 h** at the CDN and **7 days** in returning browsers |
| `…@<7- or 12-char short SHA>/file.css` | **`branch`** | 7 days / 12 h, not immutable | — |
| `…/gh/USER/REPO/file.css` (no ref) | `version`: resolves to the **latest semver tag**, not the default branch | 7 days / 12 h, not immutable | **none while a tag exists** |

Evidence: **[verified 2026-10-14 · community-12, corpus-23, external-45]**. Live pages import both pinned tags and `@main` URLs **[verified 2026-10-14 · corpus-21]**.

- **Publishing workflow:** commit → create a tag (`v1.2.4`) → change the version in the itch `@import` → paste the CSS into itch again. Each release is then live at once and cached for a year **[verified 2026-10-14 · external-45, corpus-23]**. Purging jsDelivr's cache is the other option (not tested here).
- **GitHub Pages** answers with `max-age=600`, so edits show after about 10 minutes **[verified 2026-10-14 · external-45]**.
- **Google Fonts CSS** is cached `private, max-age=86400, stale-while-revalidate=604800`, and its woff2 files `public, max-age=31536000` **[verified 2026-10-14 · external-37]**.
- **Per-visit CSS must not be cached** (`no-store`, §10); static CSS should be (§10.2).

---

### 5. Performance: every import blocks rendering

- **First paint waits for every `@import`.** In the lab, a 2,500 ms import gave a First Contentful Paint of about 2,530 ms, against 40–60 ms without it. Every import from an inline `<style>` reported `renderBlockingStatus: "blocking"` **[verified 2026-10-14 · external-07]**.
- **itch's own end-of-body scripts wait too.** In a lab page that mirrors itch's script positions, an inline script at the end of `<body>` ran at about 1,220–1,260 ms behind a 1,200 ms import. The effect on itch's features wasn't measured **[verified 2026-10-14 · evidence/external.md "Verification"; inferred for itch]**.
- **Imports start early.** Chrome's preload scanner finds `@import` in an inline `<style>` even behind a blocking `<script src>`, so the download runs in parallel with itch's head scripts **[verified 2026-10-14 · external-08]**.
- **Nested imports are a serial waterfall.** An `@import` *inside* an imported file is found only after its parent arrives (+803 ms in the lab). Sibling imports in itch's `<style>` run in parallel **[verified 2026-10-14 · external-09]**. Google Fonts is two steps by design: the CSS, then the woff2 files.
- **A refused connection fails fast** in Chrome (about 1–7 ms on localhost) and the page paints without the sheet. A slow or hanging host leaves the page blank until it answers or the browser gives up. How long that takes depends on how the host fails (§5.1) **[verified 2026-10-14 · external-06, external-07, g08-17]**.
- **Real numbers.** Measured from Spain, the owner's Vercel service adds 0.18–0.35 s of render-blocking time to first byte on warm requests, and 0.79–1.0 s on a first (cold) request. Google Fonts css2 took about 0.13 s **[verified 2026-10-14 · external-18]**.
- **Frameworks are heavy.** Bootstrap 5.3.3 is 232,803 bytes raw (33,206 brotli) and Animate.css 4.1.1 is 71,750 bytes (5,352 brotli) of render-blocking CSS **[verified 2026-10-14 · x08-01]**.

**Do:**

- Keep imports **few** (ideally one Google Fonts URL plus one sheet of your own) and **flat** (no `@import` inside imported files).
- Use **immutable, versioned** CDN URLs (§4).
- Keep a dynamic endpoint fast: no slow upstream calls, and the function region near your audience (§10.3).
- Treat the endpoint's time-to-first-byte as time every visitor stares at a blank page **[verified 2026-10-14 · external-07, external-09]**.

#### 5.1 Worst case: how long a broken host blanks the page

Lab: an itch-shaped page (`style#custom_css` in `<head>` with the `@import` first, a `#wrapper` body, an inline script at the end of `<body>`). Each browser ran on its own, with a 330 s cap, on Windows 11 **[verified 2026-10-14 · g08-17]**. "Blank until" means first contentful paint.

| How the CSS host fails | Chrome 155 | Firefox 142 | WebKit 26 (Playwright, Windows) |
|---|---|---|---|
| DNS name doesn't exist (`.invalid`) | fails in 28 ms; paints at once | 11 ms | 34 ms |
| connection refused | 7 ms | ~2 s ¹ | ~2 s ¹ |
| host unreachable, SYN dropped (`10.255.255.1`, `192.0.2.1`) | **blank 21 s** (`ERR_CONNECTION_TIMED_OUT`) | blank 21 s | blank 21 s |
| TCP accepted, TLS handshake never answered | **blank 30 s** (`ERR_TIMED_OUT`) | **blank 88 s** | blank 30 s |
| TCP accepted, HTTP request never answered | **still blank after 330 s** | **still blank after 330 s** | blank 60 s |
| `200` headers + first bytes, then the body stalls | **still blank after 330 s** | **still blank after 330 s** | blank 66 s |
| complete answer after 2.5 s (control) | 2.6 s | 2.8 s | 2.5 s |

¹ Presumably Windows retrying a refused loopback connect; Chrome fails at once.

- **Chrome and Firefox have no response timeout for a render-blocking import.** A host that accepts the connection but never answers keeps the page **blank and non-interactive indefinitely**. More than 5.5 minutes was measured, and `readyState` stayed `loading` **[verified 2026-10-14 · g08-17]**.
- **A CDN-fronted service finishes TLS at the edge,** so its realistic hang is the "request never answered" row, not the TLS row. That row ends only when the platform kills the request **[inferred · g08-17, g08-19]**. A Vercel Hobby function's default (and maximum) duration is **300 s** **[documented · g08-19]**.
- **itch's own scripts wait too.** The inline script at the end of `<body>` ran only after the import had settled, in all three engines, so itch's init code is delayed by the same amount **[verified 2026-10-14 · g08-18]**.
- **Unreachable hosts cost about 21 s on Windows.** That matches Windows' TCP connect timeout, so it differs on other operating systems (not measured) **[verified 2026-10-14 · g08-17; inferred for other OSes]**.
- **Dead domains are cheap.** NXDOMAIN fails in milliseconds, so an expired custom domain degrades gracefully **[verified 2026-10-14 · g08-17]**. Whether a deleted `*.vercel.app` project answers NXDOMAIN or a fast 404 was not checked **[unverified]**.
- **WebKit numbers are from Playwright's Windows port,** which has its own network stack. Safari on macOS and iOS was not tested **[verified 2026-10-14 · g08-17]**.

So: **a per-visit service is safe to recommend only with a hard server-side deadline** (§10.2). Static CSS on jsDelivr or GitHub Pages carries the same risk only during a CDN incident **[inferred · g08-17]**.

---

### 6. Failure modes and content blockers

#### 6.1 What happens when an import fails

- A 404, 500, wrong MIME type, refused connection or blocked request **drops only that sheet**. The rest of `style#custom_css` still applies, and the console shows one "Failed to load resource" line **[verified 2026-10-14 · localtests-12, external-06, external-04]**. On a live project page (Brave Shields on) and on the profile, two imports that failed or were blocked (status 0) left the rest of the sheet applying, down to its last rule **[verified 2026-10-16 · live-c03, live-c04, live-c45]**.
- So design the external sheet as **pure enhancement**. Never move essential layout, contrast fixes or the hidden-`h1` fix into an import **[observed 2026-10-12 · repo-14; verified 2026-10-14 · external-06]**.
- **How to test:** on the live page, delete the import through the CSSOM and check that the page still looks right. For example, run `document.getElementById('custom_css').sheet.deleteRule(0)` in DevTools when the import is the first rule **[observed 2026-10-12 · repo-14]**.
- If the service registers `@property` types that your pasted CSS animates, those animations jump instead of interpolating while the service is missing **[verified 2026-10-14 · localtests-21]**.

#### 6.2 Content blockers

- **Observed:** Brave Shields blocked the owner's Vercel-hosted `live.css` on 2026-10-12. The profile fell back to the pasted CSS, as designed **[observed 2026-10-12 · repo-14]**.
- **A headless re-test was inconclusive.** Brave 1.97.56 ran headless with a fresh profile. It loaded the live profile's `live.css` and Google Fonts without blocking, but it also let itch's own `googletagmanager.com` script through. So Shields' filter lists were evidently not active in that headless profile, and the result says nothing about real Brave windows **[verified 2026-10-14 · g08-21]**. A test in a normal Brave window is still needed (Open questions).
- **Filter lists don't explain it.** A scan of all 30 default-enabled Brave desktop filter sources (133,415 network rules, 2026-10-14) found no rule matching that URL, Google Fonts, or `/live.css` on Vercel, Cloudflare Pages/Workers, Netlify, GitHub Pages, jsDelivr or Deno Deploy. No line in any list names `itch.io`, `itch.zone` or `live.css`. The cause remains unknown **[verified 2026-10-14 · evidence/external.md §4]**.
- **Hosting platforms aren't blocked wholesale.** `*.deno.dev` appears in 0 lines of Brave's default lists **[verified 2026-10-14 · external-26]**. The other platforms only have path-specific or site-restricted rules **[verified 2026-10-14 · evidence/external.md §4]**.
- **File names that get blocked:** EasyList's generic rules match `/advert.css` and `/adverts.css`. The other 30 tested names didn't, including `/ads.css`, `/analytics.css`, `/track.css`, `/pixel.css`, `/style.css` and `/main.css` **[verified 2026-10-14 · evidence/external.md §4; x08-07]**.
- **Class names that get hidden.** Blockers hide these with `display:none`, whatever your CSS says, so **never name an itch class `custom-ad…`, `custom-cookie…`, `custom-social…` or `custom-share…`** **[verified 2026-10-14 · x08-07; evidence/external.md §4]**:
  - EasyList (default): `##.custom-ad`, `##.custom-ad-area`, `##.custom-ad-container`, `##.custom-ads`, `##.custom-advert-banner`, `##.custom-sticky-ad-container`;
  - the cookie-notice list (default in Brave): `##.custom-cookie-banner`, `##.custom-cookie-msg`, `##.custom-cookie-footer-banner`, `##.custom-ch-cookie-notice`, `##.custom-container-lgpd`, plus `###custom-cookie-*` id rules;
  - Fanboy Annoyances (optional): `##.custom-social`, `##.custom-share-button`, `##.custom-sharing`, `##.custom-follow-button`, `##.custom-back-to-top` and others.
- **Don't serve tracking pixels from the CSS host.** `https://<host>/pixel.gif?u=1` matched EasyPrivacy's `/pixel.gif?` **[verified 2026-10-14 · evidence/external.md §4]**, and tracking through CSS breaks itch's rules (see §9 and `02-rules-and-policy.md`).

---

### 7. Debugging imported CSS

- **You can't read an imported cross-origin sheet's rules.** `importRule.styleSheet.cssRules` throws `SecurityError` even when the host sends `Access-Control-Allow-Origin: *`, because the import is fetched `no-cors`. `href` stays readable **[verified 2026-10-14 · localtests-13, external-15]**. Check `getComputedStyle()` values instead.
- **A 200 in the Network panel doesn't mean "applied"** (see the `@layer` case in §2.1) **[verified 2026-10-14 · localtests-10]**.
- **When an import "does nothing", check its response `Content-Type` first** **[verified 2026-10-14 · external-04]**.
- **Cascade position.** Imported rules sit at the import's position inside `custom_css`, after the theme. So, on equal specificity, they **beat** the theme and **lose** to your pasted rules **[verified 2026-10-14 · evidence/localtests.md §A]**:

  `itch base CSS` < `theme <style>` < `nested imports` < `import 1` < `import 2` < `pasted rules`

  A service that must override the pasted CSS needs higher specificity, such as `#wrapper h1.custom-title`. Cascade details are in `06-cascade-and-specificity.md`.
- **`@import … layer(x)` changes the fight.** A layered import loses to the unlayered theme even with an ID selector. But a layered `!important` beats both unlayered normal and unlayered `!important` declarations **[verified 2026-10-14 · evidence/external.md §2b and "Verification run 2"; evidence/localtests.md §D]**.
- **Global definitions are shared across sheets.**
  - An `@property` registered in an imported sheet is honored by pasted rules (typed value, smooth interpolation) **[verified 2026-10-14 · localtests-21]**.
  - `@keyframes` work in both directions, and on a name clash the later definition wins. Unlayered `@keyframes` beat layered ones of the same name **[verified 2026-10-14 · evidence/localtests.md §G (G3–G5, G8)]**.

---

### 8. Web fonts

#### 8.1 Google Fonts

**Headers** **[verified 2026-10-14 · external-37]**:

| Request | Answer |
|---|---|
| `fonts.googleapis.com/css2?…` | `text/css; charset=utf-8`, ACAO `*`, `Cache-Control: private, max-age=86400, stale-while-revalidate=604800`, `Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin`, **no cookie** |
| `fonts.gstatic.com/…woff2` | `font/woff2`, ACAO `*`, `public, max-age=31536000` |

A Google Fonts `@import` is therefore technically fine on profile, project and devlog pages, and it is the most common import on live pages (16 of 21 pages that import) **[verified 2026-10-14 · external-37, corpus-21]**. Mind the GDPR point in §9.

**A bad URL fails silently.** Copy the exact URL from fonts.google.com **[verified 2026-10-14 · external-38]**:

| URL | Result |
|---|---|
| exact URL from fonts.google.com | 200 `text/css` |
| wrong case or unknown family (`family=syne`, `family=Nonexistent+Font`) | **400 `text/html`**, ignored → fallback font |
| axis range beyond the font's real range, even only at the top (`Syne:wght@100..900` or `@400..900`; Syne is 400..800) | **400** |
| overlapping ranges (`wght@400..600;500..800`) | **400** |
| unsorted tuples or axes (`wght@700;400`, `wght,ital@400,1`) | tolerated (200), but the docs require alphabetical axes and numerically sorted tuples |
| `+` or `%20` for spaces; the v1 API `/css?family=Syne:400,700` | 200 |

**Rules:**

- **Always end the URL with `&display=swap`** (or `fallback` / `optional`). Without it, css2 emits no `font-display` at all, and text uses the browser default `auto`, typically invisible during a block period. A bogus value (`display=bogus`) is silently dropped **[verified 2026-10-14 · external-39]**. The owner's live URL yields 9 `@font-face` rules, all `font-display: swap` **[verified 2026-10-14 · external-37]**.
- **Request a range** (`wght@400..800`) for variable fonts if you animate weight, and keep it inside the font's real range **[inferred · external-38]**.
- **Never copy Google's css2 response into your CSS.** Google picks the format by User-Agent: curl got one `.ttf` face, while Chrome and Firefox UAs got 3 woff2 faces split by `unicode-range` **[verified 2026-10-14 · evidence/external.md §6]**. Import the URL instead.
- **`&text=` subsets a font** to the characters you list, such as a title. `Syne:wght@400..800&text=Mirokshi` returned one 2,548-byte woff2 face, and it still contains the variable-font tables **[verified 2026-10-14 · evidence/external.md §6 and "Verification run 2"]**.
- **The theme's own font** (chosen in the theme editor) is loaded by `<link>`s that come before `custom_css`, so you don't need to re-import it **[documented · crawlproject-44]**. If you need weights or axes the theme's link doesn't request, import them yourself **[inferred]**.

#### 8.2 Self-hosted fonts and CDN font packages

- **CORS is mandatory.** The font request carries `Origin: https://<user>.itch.io` with `Sec-Fetch-Mode: cors`, so the font host must answer `Access-Control-Allow-Origin: *` (or that exact origin). This holds **even when the `@font-face` lives in a sheet on the font's own host**. Without it you get `FontFace.status = "error"` and a console CORS error **[verified 2026-10-14 · external-16, localtests-40]**.
- `mask-image` files need CORS the same way; `background-image` doesn't **[verified 2026-10-14 · localtests-40, localtests-19]**.
- Write `font-display: swap` yourself in every self-hosted `@font-face` **[verified 2026-10-14 · external-39]**.
- **Fontsource on jsDelivr** needs no server and sends the right headers **[verified 2026-10-14 · x08-01, x08-05]**:
  - `https://cdn.jsdelivr.net/npm/@fontsource/syne@5.2.6/index.css` gives `text/css`, ACAO `*`, immutable. It holds only **weight 400** (3 faces: latin, latin-ext, greek), each with `font-display: swap` and relative `./files/*.woff2` URLs. Other weights have their own files (`…/700.css`).
  - The woff2 files are `font/woff2`, ACAO `*`, immutable.
  - `@fontsource-variable/syne@5.2.6/index.css` gives `font-weight: 400 800` (variable) under the family name **`'Syne Variable'`**, not `'Syne'`.

```css
@import url("https://cdn.jsdelivr.net/npm/@fontsource-variable/syne@5.2.6/index.css");
#wrapper .custom-title { font-family: "Syne Variable", sans-serif; }
```

Always read the `font-family` line of an imported font CSS before using the name.

#### 8.3 Base64-embedded fonts

- The guide allows Base64 embedding **[documented · docs-37]**, and a `data:` font needs **no CORS**: a `data:font/woff2;base64,…` face reached `status: "loaded"` in the lab **[verified 2026-10-14 · x08-06]**.
- **It is expensive.** An 8-glyph `text=` subset (2,548 bytes) becomes 3,400 Base64 characters. With one rule using it, the CSS was 3,537 characters, about **69 % of the 5,120-byte profile cap** **[verified 2026-10-14 · x08-06; cap: verified 2026-10-16 · live-cap-A2c]**.
- Base64 therefore only fits tiny subsets on profiles. Prefer a linked HTTPS font.

#### 8.4 Fonts on jam pages

`@import` is dead on jams (§2.3), so declare the face directly **[verified 2026-10-14 · crawljam-02, itchcss-07]**. Any HTTPS font file served with ACAO works:

```css
@font-face {
  font-family: "Syne";
  src: url("https://cdn.jsdelivr.net/npm/@fontsource/syne@5.2.6/files/syne-latin-400-normal.woff2") format("woff2");
  font-display: swap;
}
#wrapper .jam_title_header { font-family: "Syne", sans-serif; }
```

This URL's headers (`font/woff2`, ACAO `*`, immutable) were checked **[verified 2026-10-14 · x08-05]**. Jam selectors are listed in `03-page-anatomy.md`. Google's own `fonts.gstatic.com/s/<font>/v<N>/…` URLs embed a version number and are not documented as stable for direct use **[unverified]**.

---

### 9. Privacy and GDPR

**What your CSS host learns on every page view:**

- **The Referer.** itch pages send `Referrer-Policy: no-referrer-when-downgrade` **[verified 2026-10-14 · external-32]**:
  - an `@import` sends your host the **full itch page URL** (path and query, no fragment);
  - `url()` images and fonts written in the pasted CSS send only the origin (`https://<user>.itch.io/`);
  - requests made from inside your imported sheet send your sheet's URL.

  So the host learns exactly which itch page or devlog was viewed.
- **Request headers.** A Chrome visitor sends no `Origin` on the stylesheet request, but does send **[verified 2026-10-14 · external-31]**:
  - the IP, `User-Agent`, `Accept-Language` and `Accept: text/css,*/*;q=0.1`;
  - the `sec-ch-ua*` client hints;
  - `Sec-Fetch-Dest: style`, `Sec-Fetch-Mode: no-cors`, `Sec-Fetch-Site: cross-site` and `Sec-Fetch-Storage-Access: active`;
  - any cookie the host itself set earlier with `SameSite=None; Secure`.

  The `sec-ch-ua*` and `Sec-Fetch-Storage-Access` headers are Chromium-specific. The Firefox and Safari header sets were not tested.
- **Cookies work as trackers here.** In Chrome 155 with default settings, a `SameSite=None; Secure` cookie set on a stylesheet response was stored. It was sent back on later stylesheet requests even when a **different top-level site** imported the sheet (not partitioned). So a CSS host could recognise the same browser across visits and across every site that imports it **[verified 2026-10-14 · external-47]**. **Never set cookies from a CSS host.** It also stops Vercel's CDN from caching the response. Browsers that block third-party cookies by default were not tested.
- **itch's rules:** the Terms (§3, Acceptable Use) prohibit "Soliciting, harvesting or collecting information about others" **[documented · evidence/external.md §7]**. Never log, profile or fingerprint visitors through CSS; see `02-rules-and-policy.md`.

**Google Fonts and the GDPR:**

- Google Fonts receives each visitor's IP, User-Agent and Referer. Its css2 response sets no cookie **[verified 2026-10-14 · external-37; community · external-43]**.
- A German first-instance court (LG München I, 3 O 17493/20, 20 Jan 2022) awarded €100 GDPR damages for loading Google Fonts dynamically without consent. In 2023 the same court reportedly held that crawler-driven mass Google Fonts claims were abusive **[community · external-43]**. This is not legal advice.
- For EU-facing pages, the lower-risk options are:
  - **self-hosting** on a host you control, with ACAO (§8.2);
  - **Bunny Fonts** (`fonts.bunny.net`). Its about page says it is run by "an EU-based company", has a "zero-tracking and no-logging policy", and that its API is "fully compatible with the Google Fonts CSS v1 API" **[documented, vendor claim · x08-05]**. It returned `text/css` / `font/woff2` with ACAO `*`, `max-age=2592000` and no cookie **[verified 2026-10-14 · x08-05]**.
    - ⚠️ A css2-style `wght@400..800` request to Bunny returned **five static weights** (400–800), not a variable range, so weight animations step between instances **[verified 2026-10-14 · x08-05]**.
  - Note that any CDN, jsDelivr included, still receives the visitor's IP **[inferred · external-31]**.

**Using request data legitimately:** `Sec-Fetch-Dest: style` lets a host tell real stylesheet loads from direct visits, and `Accept-Language` allows localisation. If the output varies on a request header **and** is cached, send a matching `Vary` **[verified 2026-10-14 · external-31]**.

---

### 10. Dynamic (per-visit) CSS services

itch allows no JavaScript in pages, and native CSS `random()` is not yet available in every browser (see `07-techniques-and-support.md`). A small server that returns different CSS on each request is the way to get per-visit variation for every visitor today, except on jam pages. The owner's profile runs one on Vercel **[verified 2026-10-14 · repo-09, repo-12]**.

#### 10.1 The minimum header set

The reference service (`live.css`) answers with **[verified 2026-10-14 · external-17]**:

- `Content-Type: text/css; charset=utf-8`;
- `Cache-Control: no-store`;
- brotli, gzip or identity, depending on `Accept-Encoding`;
- `X-Vercel-Cache: MISS` on every request, no ACAO, no `Vary`, no `Set-Cookie`;
- a `308` redirect from `http://` to `https://`.

Every response was different, about 14.8 KB raw and 3.3 KB on the wire. Add `Access-Control-Allow-Origin: *` only if the same host also serves fonts **[verified 2026-10-14 · external-17, external-16]**.

```js
// api/live.js (Vercel Node function), minimal sketch
export const config = { maxDuration: 5 };           // a hang ends in ≤5 s instead of 300 s (§10.2)
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/css; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');      // a new variant on every page view
  res.end(buildRules().join('\n'));                 // one flat sheet: no nested @import
}
```

#### 10.2 Design rules

- **Time budget.** Every millisecond before the first byte is a blank page for every visitor, and a hung response can blank it for minutes (§5.1) **[verified 2026-10-14 · g08-17]**. Then:
  - **Answer from memory.** No database, KV store or upstream fetch on the request path **[inferred · g08-17, external-18]**.
  - **Aim for a warm time to first byte under about 300 ms.** The reference service measured 0.18–0.35 s warm from Spain **[verified 2026-10-14 · external-18]**.
  - **Set a hard deadline.** Vercel Hobby's default and maximum duration is **300 s**. Lower it per function, e.g. `export const config = { maxDuration: 5 };` in a Node `/api` file, or `"functions": {"api/*.js": {"maxDuration": 5}}` in `vercel.json`. Vercel then terminates the function **[documented · g08-19]**. The browser drops any non-2xx sheet and paints **[verified 2026-10-14 · external-06]**. The exact status Vercel returns on timeout was not checked **[unverified]**.
  - **If the code must wait on anything,** race it against a ~200 ms timer and answer with the fallback when the timer wins **[inferred · g08-20]**.
- **One endpoint.** Every import blocks rendering, so merge all modules into one response instead of importing several services **[verified 2026-10-14 · repo-12, external-09]**.
- **Use the stable production domain** (`<project>.vercel.app`), never a per-deployment URL **[verified 2026-10-14 · repo-12]**.
- **Degrade gracefully.** The pasted CSS carries the full look and the service only adds extras (§6.1) **[observed 2026-10-12 · repo-14]**.
- **Out-specify the pasted CSS** where the service must override it, since imported rules lose ties (§7) **[verified 2026-10-14 · evidence/localtests.md §A]**.
- **Register `@property` in the service** when your CSS animates typed custom properties; registration works across sheets **[verified 2026-10-14 · localtests-21]**.
- **bfcache is fine.** `no-store` on the *imported CSS* doesn't block the back/forward cache: Back restores the page with the same variant and no refetch, while a reload or a new visit fetches a new one **[verified 2026-10-14 · external-20]**. Whether real itch pages are bfcache-eligible was not tested in a browser.
- **Cache static CSS; don't mark it `no-store`.** Vercel's CDN caches function output only with `s-maxage`, or with `CDN-Cache-Control` / `Vercel-CDN-Cache-Control` carrying a `max-age`. It never caches responses with `private`, `no-cache`, `no-store`, `Set-Cookie`, `Vary: *` or `Vary: Cookie`. Example: `Cache-Control: public, max-age=300, s-maxage=86400, stale-while-revalidate=604800` **[documented · external-21]**.
  - Compromise for "random-ish" CSS: `s-maxage=60`, which gives about one variant per region per minute **[inferred · external-21]**.
  - For truly static CSS, a tagged jsDelivr URL is simpler (§4).
- **No cookies, no logging** (§9) **[verified 2026-10-14 · external-47]**.

#### 10.3 Latency and region

- **Measured from Spain over a fresh connection** (TCP and TLS included) **[verified 2026-10-14 · external-18]**:
  - first request 0.79–1.0 s;
  - then 0.18–0.35 s.
- Every request went through the Paris edge to a function in **iad1** (US East, Vercel's default region), `x-vercel-id: cdg1::iad1::…`. Compared with an edge-only 404 on the same host, the function hop added about 0.1–0.15 s per request **[verified 2026-10-14 · external-18]**.
- **Fix:** pin the function region near your audience, e.g. `{ "regions": ["cdg1"] }` in `vercel.json` or Settings → Functions. New projects default to `iad1`, and Hobby allows exactly one region **[documented · external-19]**. With `no-store` there is no edge cache to hide the hop, so the region is the main latency lever **[documented · external-19]**. Whether `cdg1` actually cuts EU latency was not measured.

---

### 11. Free hosting limits (as of 2026-10-14)

With `no-store`, **every itch page view costs one function invocation and one CDN request**. On Vercel Hobby that is about 33k page views a day **[documented · external-22]**.

| Platform | Free tier | Over the limit | Evidence |
|---|---|---|---|
| **Vercel Hobby** | per month: 1,000,000 invocations; 4 CPU-h Active CPU; 360 GB-h provisioned memory; 100 GB Fast Data Transfer; 10 GB Fast Origin Transfer; 1,000,000 CDN requests. Also 100 deployments/day, 300 s max duration, 1 function region (default `iad1`) | you usually wait 30 days | [documented · external-22, external-19] |
| Vercel Hobby, **use terms** | "non-commercial personal use only". Commercial use includes "Any method of requesting or processing payment from visitors of the site" and "Advertising the sale of a product or service". Asking for donations is not commercial | — | [documented · x08-08] |
| **Cloudflare Workers Free** | 100,000 requests/day (reset at 00:00 UTC); 10 ms CPU per request; 128 MB; 50 subrequests. Static-asset requests are "free and unlimited" (the docs don't say whether they count toward the 100k). KV: 100,000 reads/day, 1,000 writes/day, 1 write/s per key | error **1027** (fail closed; an HTML page, so the import is silently ignored), or bypass (fail open) on routes; with `run_worker_first`, **429** | [documented · external-24] |
| **Netlify Free** | 300 credits: 20 per GB bandwidth, 2 per 10k requests, 10 per GB-hour compute, **15 per production deploy** (20 deploys use them all) | not stated on the pricing page; users report paused deploys | [documented · external-25] |
| **Deno Deploy Free** | 1M requests/month, 20 GiB egress, 10 h active CPU, KV 1 GiB, 5 custom domains; "For personal use and smaller projects" | not checked | [documented · external-26] |
| **GitHub Pages** (static only) | site ≤ 1 GB; *soft* 100 GB/month bandwidth; *soft* 10 builds/hour; 429 when rate-limited; not allowed as free hosting "to run your online business" | 429 | [documented · x08-08] |
| **jsDelivr** (static, from GitHub or npm) | no quota found in this session | unknown | gap |

- **Paid games and Vercel Hobby:** whether a CSS service for an itch page that **sells** games counts as "commercial use" is our inference, not a Vercel ruling **[inferred · x08-08]**. For pages that sell, prefer static CSS on a tagged jsDelivr URL, or a host whose free tier allows commercial use.
- Netlify's own pricing page doesn't say whether credits reset monthly or what happens at 0. The community thread cited earlier now returns 404, and newer threads report Free-plan deploys paused under an "operational credits" banner **[documented · external-25]**.

---

### 12. Frameworks: Bootstrap, Tailwind, Animate.css

#### 12.1 What happens when you import one

Lab: headless Chrome 155, standards mode, an itch-like page **[verified 2026-10-14 · x08-03]**. The page has:

- a header *outside* `#wrapper`, with an `h1`, a link and an `.animate_bounce` element that uses an itch-like `@keyframes bounce`;
- a theme sheet with `.user_page a{color:rgb(1,2,3)}`;
- `style#custom_css` with the variant under test.

| Variant (imported from `custom_css`) | Outside `#wrapper` (itch's UI) | Inside `#wrapper` | Framework keyframes |
|---|---|---|---|
| none (baseline) | `body` margin 8px; `h1` 32px/700; link `rgb(0,0,238)`; itch bounce = opacity animation | theme link `rgb(1,2,3)` | — |
| **Bootstrap 5.3.3 as-is** | **changed:** body margin 0 and a system-ui font; `h1` 33.46px/500, margin 0; links Bootstrap blue | theme link kept (`.user_page a` is more specific); `.text-danger` red (`!important`); `.btn` styled | run |
| Bootstrap with `layer(fw)` | **same leaks**: a layer lowers priority but doesn't scope | theme link kept; `.text-danger` still red (layered `!important` wins) | run |
| Bootstrap wrapped naively in `#wrapper{…}` (nesting) | untouched | **links turn black**: `:root{--bs-*}` became `#wrapper :root`, which never matches | **dropped** (`@keyframes` inside a style rule is invalid) |
| Bootstrap nested, `:root`/`body` remapped to `&`, keyframes hoisted to top level | untouched | links Bootstrap blue (the `#wrapper` ID beats the theme); `.text-danger` red; `.btn` styled | run |
| Bootstrap in `@scope (#wrapper){…}`, roots remapped to `:scope`, keyframes hoisted | untouched | theme link **kept** (`@scope` adds no specificity); `.text-danger` red; `.btn` styled | run |
| **Tailwind** `tailwindcss@4.1.13/index.css` from the CDN | **changed:** Preflight sets body margin 0, `h1` 16px/400 with margin 0, links `inherit` (black) | **no utilities**: `.flex` stays `block` | — |
| **Animate.css 4.1.1 as-is** | itch's `.animate_bounce` is **hijacked**: it now runs Animate's `bounce` (transform) | `#wrapper .custom-pop{animation:bounceIn…}` runs | 194 kept, global |
| Animate.css with `layer(fw)` | itch bounce **kept** (unlayered keyframes win name clashes) | `bounceIn` runs | kept, layered |
| Animate.css wrapped in `#wrapper{…}` | untouched | **nothing runs** (0 of 194 keyframe rules kept) | dropped |
| Animate.css in `@scope (#wrapper){…}` | itch bounce **hijacked** (keyframes inside `@scope` are kept but still global) | `bounceIn` runs | kept, global |
| Animate.css with every keyframe renamed `custom-*` | itch bounce kept | `custom-bounceIn` runs | kept, no clash |

Why "just import it" fails on itch:

1. **Global selectors hit itch's UI.** Bootstrap 5.3.3 has 121 selectors with no class or id (`:root`, `*`, `body`, `h1`–`h6`, `a`, `button`, form elements…), and Tailwind's Preflight has 81 **[verified 2026-10-14 · x08-02]**.
   - itch's `user.css` has its own `body{…}` rules (font-family, margin, font-size). Bootstrap's `body{}` has the same specificity and comes later, so on a real profile it would restyle the whole page, header and footer included **[inferred · x08-02, x08-03]**.
   - Restyling itch's built-in UI breaks the `#wrapper`-scope rule (`02-rules-and-policy.md`).
2. **Framework class names don't survive itch's HTML sanitizer.** In user HTML, only tokens that start with `custom` and itch's own `text-center`, `text-justify`, `text-right` and `spoiler` survive (plus `language-css` on `<code>`). So `class="btn btn-primary"` or `class="flex gap-4"` is stripped from your bio or description **[observed · evidence/sanitizer.md §1, §5.2, §6]**; on a project description `foo`, `button` and `text-left` were dropped **[verified 2026-10-16 · live-k22 to live-k28, live-k34, live-t03]**, and in a bio `foo` was dropped too **[verified 2026-10-16 · live-k26]**. Importing a framework for its classes gives you nothing in user HTML.
3. **No JavaScript components.** The sanitizer also strips `data-*` and `on*` attributes (confirmed on a project description), and itch runs none of your JS, so Bootstrap dropdowns, modals and tooltips can't work **[observed · evidence/sanitizer.md §1; verified 2026-10-16 · live-a02, live-a11]**.
4. **Generic names collide with itch's own classes.** Bootstrap defines `.active`, `.disabled`, `.small`, `.visible`, `.invisible`, `.icon-link` and `.text-center`, which itch also uses **[verified 2026-10-14 · x08-02]**.
   - Bootstrap: `.visible{visibility:visible!important}` and `.invisible{visibility:hidden!important}`.
   - itch toggles `.visible` itself, e.g. `.header_widget .header_dropdown:not(.visible)`.
   - **On real logged-out pages the overlap is small.** In JS-enabled copies of a profile and a project page, the only elements carrying any of these classes were the editor's `h2.text-center` in the bio, which Bootstrap's `.text-center{text-align:center!important}` matches. Logged-in UI, such as dropdowns that toggle `.visible`, was not tested **[verified 2026-10-14 · g08-14]**.
   - **Real-page damage comes from the element rules instead.** Imported as-is, Bootstrap changed every element outside `#wrapper` (`box-sizing`, `--bs-*`, `html{scroll-behavior:smooth}`). It also changed 81 of 81 itch elements inside `#wrapper` on the profile and 1,473 on the project. For example, `#wrapper` went from 14px/22.4px to 16px/25.6px **[verified 2026-10-14 · g08-11]**.
5. **`!important` everywhere.** Bootstrap 5.3.3 has 1,715 `!important` declarations, mostly its utilities. Inside a layer they get *stronger*: a layered `!important` beats unlayered `!important` **[verified 2026-10-14 · x08-02; evidence/localtests.md §D]**.
6. **No import-time scoping.** `@import … scope(#wrapper)` is unsupported (§2.2) **[verified 2026-10-14 · evidence/external.md §2c]**.

#### 12.2 Scoping a framework yourself

**Scope to a container you own, not to `#wrapper`.** itch's own UI lives inside `#wrapper`: the profile header, the game grid, the buttons and the footer.

- **`#wrapper` alone is not enough.** A Bootstrap build with every class renamed and every selector prefixed with `#wrapper` left the outside of `#wrapper` alone. But Reboot's element rules (`*`, `h1`–`h6`, `a`, `p`, and `body` mapped to `#wrapper`) restyled **all** of itch's elements inside it: 81 of 81 on a profile and 1,473 on a project page **[verified 2026-10-14 · g08-12]**.
  - `#wrapper` got a white `background-color`.
  - Text went from 14px to 16px, with new line heights.
  - On the project page, 316 elements changed `color` and 163 their link underline.
  - Since the ID wins, these rules beat the theme.
- **Prefixed with `#wrapper .custom-bs`, nothing of itch's changed.** Only the fragment inside your own `<div class="custom-bs">` was restyled; its ancestors merely grew taller **[verified 2026-10-14 · g08-13]**.

**Verified build** (Bootstrap 5.3.3; `postcss-rename` 0.8.1 + `postcss-prefix-selector` 2.2.1; same output as the lab build) **[verified 2026-10-14 · g08-10, g08-13]**:

```js
// build.cjs: npm i bootstrap@5.3.3 postcss postcss-rename postcss-prefix-selector
const fs = require('fs'), postcss = require('postcss');
const rename = require('postcss-rename'), prefixer = require('postcss-prefix-selector');
const src = fs.readFileSync(require.resolve('bootstrap/dist/css/bootstrap.css'), 'utf8');
postcss([rename({ prefix: 'custom-' }), prefixer({ prefix: '#wrapper .custom-bs' })])
  .process(src, { from: undefined })
  .then((r) => fs.writeFileSync('bootstrap-itch.css', r.css));
```

Then host `bootstrap-itch.css` on a versioned URL (§4), `@import` it, and write your bio as `<div class="custom-bs"><a class="custom-btn custom-btn-primary" href="https://…">Play</a></div>`.

What the build gives you:

- **Clean output.** All 2,025 classes are renamed (`.btn` → `.custom-btn`). Across 2,973 selectors there are **0** outside `#wrapper .custom-bs` and **0** classes without `custom-` **[verified 2026-10-14 · g08-10]**.
  - `:root` and `body` become the container itself (the plugin's default for global selectors).
  - The 5 `@keyframes` stay top level with their original names, none of which clashes with itch's.
  - 1,715 `!important` declarations remain.
  - Use `postcss-rename` from CommonJS: its package exports have no ESM entry, so `import` fails.
- **The container looks like Bootstrap's `body`:** `background-color:#fff`, `color:rgb(33,37,41)`, 16px system font. Override it in your pasted CSS if your theme is dark **[verified 2026-10-14 · g08-13]**.
- **Reduced motion still works.** Bootstrap's own `prefers-reduced-motion` rules survive the scoping, so button transitions are removed. But the spinner only slows from 0.75 s to 1.5 s and keeps spinning. Add `#wrapper .custom-spinner-border{animation:none}` under `reduce` yourself **[verified 2026-10-14 · g08-15]**.
- **Color modes and JS hooks are dead code.** 16 `[data-bs-theme…]`, 5 `[data-bs-target]` and 16 `[data-bs-popper]` selectors remain, but the sanitizer strips `data-*`, so they never match. If you want dark tokens, remap `[data-bs-theme=dark]` to the container at build time **[verified 2026-10-14 · g08-15; inferred for the remap]**.
- **Watch for name clashes with your own classes.** 12 renamed names already appear as creators' own classes in 1,162 local page copies: `custom-container` (21 pages), `custom-card` (19), `custom-card-title`, `custom-btn`, `custom-badge` and others **[observed · g08-16]**. If you also hand-write `custom-` classes, use a longer prefix such as `rename({ prefix: 'custom-bs-' })` **[inferred]**.
- **Cost.** The full build is 327,709 bytes minified, about 32.8 KB gzip or 23.6 KB brotli (q11), all render-blocking. jsDelivr served the stock `bootstrap.min.css` at 33,206 brotli bytes **[verified 2026-10-14 · g08-10, x08-01]**. Trimming unused components with Bootstrap's Sass sources should cut this; not tested **[unverified]**.

Other wrappers, for reference **[verified 2026-10-14 · x08-03, g08-12]**:

| Wrapper | Effect | Verdict |
|---|---|---|
| prefix every selector with `#wrapper .custom-bs` (PostCSS, above) | rules gain (1,1,0) and only touch your container | **use this** |
| prefix or nest with `#wrapper` alone (`#wrapper{…}` with roots → `&`, keyframes hoisted, as in x08-03) | element rules restyle itch's header, grid and footer | don't |
| `@scope (#wrapper){…}` | no extra specificity, so the theme's `.user_page a` keeps winning on links; Reboot's other element rules still reach itch's elements [inferred] | rarely; `@scope` is Baseline only since 2026-03-24 (`07-techniques-and-support.md`) |
| `@import … layer(x)` | lowers priority but **does not scope** | never on its own |

- If you nest by hand, hoist `@keyframes`, `@font-face` and `@property` to top level. Inside a style rule they are invalid and silently dropped **[verified 2026-10-14 · x08-03]**. The PostCSS prefixer leaves them at top level by itself **[verified 2026-10-14 · g08-10]**.
- **Keyframe names stay global** with any wrapper. Rename clashing ones (§12.4).
- Framework *classes* only reach your HTML under `custom-` names (point 2 above), and its JS components can't run (point 3).

#### 12.3 Tailwind specifics

- **The Play CDN is JavaScript** (`<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4">`) and is "designed for development purposes only". It can't run on itch **[documented · x08-04]**.
- **Importing Tailwind's source from a CDN gives you resets only.** `tailwindcss/index.css` contains `@layer theme, base, components, utilities;`, `@theme` blocks, Preflight in `@layer base`, and the directive `@tailwind utilities`. Browsers ignore `@theme` and `@tailwind`, so you get Preflight and zero utilities **[verified 2026-10-14 · x08-02, x08-03]**. You must **compile** Tailwind and host the output.

**Use Tailwind v3.4 through PostCSS.** This build was compiled and tested on JS-enabled copies of a real profile and a real project page **[verified 2026-10-14 · g08-03]**:

```js
// build.mjs: npm i tailwindcss@3.4 postcss postcss-prefix-selector
import postcss from 'postcss'; import tailwind from 'tailwindcss'; import prefixer from 'postcss-prefix-selector';
const config = { content: ['./bio.html'], prefix: 'custom-', corePlugins: { preflight: false } };
const { css } = await postcss([tailwind(config), prefixer({ prefix: '#wrapper' })])
  .process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });
process.stdout.write(css);
```

- **The result:**
  - **0 selectors outside `#wrapper`.** Tailwind's defaults become `#wrapper *, #wrapper ::before, #wrapper ::after{--tw-…}` and `#wrapper ::backdrop{…}`, and `.custom-container` becomes `#wrapper .custom-container`.
  - Keyframes come out prefixed (`custom-spin`, `custom-bounce`), so they can't clash with itch's `spin` or `bounce`.
  - Utilities get `#wrapper .custom-x` (1,1,0), which beats the theme's class rules. No `important` option is needed.
  - On the real pages, 0 elements outside `#wrapper` changed. Inside it, the only change on itch's own elements was the inert `--tw-*` custom properties.
  - About 7 KB minified (1.3 KB brotli) for a small bio.
- **Don't use the earlier config** (`important:'#wrapper'`, Preflight off, compiled by the Tailwind CLI). It was compiled this time, and it leaks **[verified 2026-10-14 · g08-01]**:
  - `@tailwind base` still emits unscoped `*, ::before, ::after{…}` and `::backdrop{…}` rules with about 50 `--tw-*` defaults (2,228 bytes minified). `important` doesn't scope them.
  - On the real pages, `--tw-rotate:0` appeared on every element outside `#wrapper`.
  - `@tailwind components` emits an unscoped `.custom-container`.
- **Don't drop `@tailwind base` to avoid the leak.** With utilities only, `custom-rotate-3` computes `transform:none` and `custom-blur-sm` computes `filter:none`, because the `--tw-*` defaults they reference are missing. `custom-shadow-lg` still works because its `var()`s have fallbacks **[verified 2026-10-14 · g08-02]**.
- **Write class names the sanitizer can keep.** The token is what you type in the bio HTML **[verified 2026-10-14 · g08-04 for the compile; sanitizer column per g08-09 and, for project descriptions, the 2026-10-16 live probes]**:

  | v3 token | Compiles to | Survives itch's sanitizer? |
  |---|---|---|
  | `custom-flex`, `custom-p-4`, `custom-rotate-3` | `#wrapper .custom-…` | yes: plain `custom…` words survive live **[observed · g08-09; verified 2026-10-16 · live-k03 to live-k06, live-k21]** |
  | `custom--mt-4` (negative value after the prefix) | `margin-top:-1rem` | yes: the filter only tests the `custom` prefix **[inferred · live-k06, live-k10]** |
  | `-custom-mt-4`, `md:custom-flex`, `hover:custom-text-red-500`, `max-md:custom-hidden`, `!custom-flex` | valid rules | **no**: they don't start with `custom`; the same shapes (`-custom-f`, `md:custom-g`, `!custom-h`) were dropped from a project description **[verified 2026-10-16 · live-k16 to live-k18]** |
  | `custom-w-1/2`, `custom-w-[37px]`, `custom-mt-[-1rem]`, `custom-bg-red-500/50` | valid rules | **yes** on a project description: `custom-w-1/2`, `custom-w-[3px]`, `custom-mt-[-1rem]` and `custom-bg-red-500/50` survived, and escaped selectors such as `.custom-w-\[3px\]` matched them **[verified 2026-10-16 · live-k09 to live-k12, live-c38, live-c39]**; in a bio `custom-w-1/2` and `custom-w-[3px]` survived too, and `.custom-w-\[3px\]` matched **[verified 2026-10-16 · live-k09, live-k11, live-c39]** |

  Write breakpoints, hover states and `!important` as your own `#wrapper` rules in the pasted CSS instead of variant classes.
- **List your real bio HTML in `content`.** Tailwind only emits classes it finds there **[verified 2026-10-14 · g08-03]**.

**Tailwind v4 is not recommended for itch** **[verified 2026-10-14 · g08-05 to g08-08]**:

- **`prefix()` must go on the `theme.css` import.** On `utilities.css` alone it is ignored, so the recipe `@import "tailwindcss/utilities.css" layer(utilities) important prefix(custom)` emits **zero** utilities for `custom:` classes.
- **Nothing is scoped.** v4 has no selector strategy: `important` only appends `!important` to every declaration. The output has unscoped `.custom\:flex` rules. It also has a `:root, :host{--custom-…}` theme block, which puts variables on every element of the page; `theme(static)` emits all of them, about 30 KB. On top of that come 44 global `@property --tw-*` registrations and an `@supports(…){*, ::before, ::after, ::backdrop{--tw-…}}` fallback for older Safari and Firefox.
- **Its keyframes are not prefixed.** v4 emits `@keyframes spin`, `ping`, `pulse` and `bounce`. Its `bounce` **replaced itch's own `bounce`** for the whole page in the real-page test. itch's `spin` happens to be identical.
- **A cleaned-up build is possible but fragile.** `theme(inline)` (no `:root` block) + `prefix(custom)` + `important`, then `postcss-prefix-selector('#wrapper')` skipping nested `&` rules, then renaming the keyframes to `custom-*`. That build left itch's UI untouched, but the 44 global `@property` rules remain. It also depends on `custom:` class tokens surviving the sanitizer, which they do on a project description (next point).
- **Prefix-first syntax.** v4 classes are written prefix-first (`custom:md:flex`, `custom:-mt-4`): they start with `custom`, but contain `:`. `custom:flex` and `custom:md:flex` survived on a project description **[verified 2026-10-16 · live-k14, live-k15]**, and `custom:flex` in a bio **[verified 2026-10-16 · live-k14]**.
- **Cascade caveat.** Compiled v4 utilities are layered, so without `important` they lose to itch's **unlayered** theme rules whatever their specificity. With `important` they become layered `!important`, which beats every unlayered declaration, `!important` included, and your own pasted rules too **[documented · x08-04; verified 2026-10-14 · evidence/localtests.md §D]**.

#### 12.4 Animate.css and other animation libraries

- **Use the library by keyframe name, never by class.** Its classes (`animate__animated`, `animate__bounce`) would be stripped from your HTML. Reference the keyframes from your own scoped rules **[verified 2026-10-14 · x08-03]**:

```css
@import url("https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css") layer(fw);
#wrapper .custom-pop { animation: bounceIn .8s both; }
@media (prefers-reduced-motion: reduce) { #wrapper .custom-pop { animation: none; } }
```

- **As-is, it hijacks itch's own animation.** Animate.css defines `@keyframes bounce`, and so does itch's `user.css` (used by itch's `.animate_bounce` class). An unlayered import comes later, so Animate's version wins for the **whole page** **[verified 2026-10-14 · x08-02, x08-03]**.
- **`layer(fw)` on the import fixes the clash.** Unlayered itch keyframes then win name clashes, while `bounceIn` (no clash) still runs **[verified 2026-10-14 · x08-03]**. The flip side: a layered `bounce` is unusable for you.
- **Wrapping the library doesn't help.** Inside `#wrapper{…}` all 194 keyframe rules are dropped. Inside `@scope (#wrapper){…}` they are kept but stay global, so the clash remains **[verified 2026-10-14 · x08-03]**.
- **The clash list.** itch's `user.css` defines 13 keyframes: `popin`, `bouncein`, `loader-left`, `loader-right`, `pulse_opacity`, `spin`, `bounce`, `drop_down`, `popout`, `heartbeat`, `intro`, `lightbox_intro` and `scroll_background`. Names are case-sensitive, so Animate's `bounceIn` and `heartBeat` don't clash with itch's `bouncein` and `heartbeat` **[verified 2026-10-14 · x08-02]**.
- **Its reduced-motion support doesn't reach you.** Animate.css's only `@media (prefers-reduced-motion:reduce),print` block targets `.animate__animated`, a class itch strips. Write your own reduced-motion rule, as in the snippet above **[verified 2026-10-14 · x08-02]**.
- **Cost:** 71,750 bytes (5,352 brotli) of render-blocking CSS, plus global `:root{--animate-duration…}` variables, usually for one or two keyframes **[verified 2026-10-14 · x08-01, x08-02]**.
- **Better:** copy the one `@keyframes` you need into your own CSS under a `custom-` name (e.g. `@keyframes custom-bounce-in`). That avoids the import, the size and the clash; the renamed build ran fine in the lab **[verified 2026-10-14 · x08-03]**. Keep the library's licence notice (Animate.css is MIT).

#### 12.5 Framework decision table

| Goal | Do | Don't |
|---|---|---|
| a few animations | copy and rename the keyframes (`custom-*`); or import Animate.css with `layer(fw)` and use keyframe names from `#wrapper .custom-*` rules, plus your own reduced-motion rule | rely on `animate__*` classes in HTML; import it unlayered |
| utility classes in your bio or description | Tailwind v3.4 via PostCSS: `prefix:'custom-'`, Preflight off, then `postcss-prefix-selector('#wrapper')` (§12.3); use only tokens that start with `custom-` (arbitrary `[…]` values and `/` modifiers included); host on jsDelivr `@tag` | Play CDN; raw `tailwindcss/index.css`; the CLI build with `important:'#wrapper'` (leaks `*{--tw-…}`); utilities-only builds (transforms break); v4; variant, important or negative-first tokens (`md:custom-…`, `!custom-…`, `-custom-…`) |
| Bootstrap components | `postcss-rename({prefix:'custom-'})` + `postcss-prefix-selector('#wrapper .custom-bs')`, your HTML inside `<div class="custom-bs">` (§12.2); no JS components | importing `bootstrap.min.css` as-is or only in a `layer()`; scoping to plain `#wrapper` (restyles itch's header, grid and footer) |
| a CSS reset | none; itch's theme is the base | Preflight, Reboot or normalize on the whole page |

---

### Open questions

1. **Why Brave blocked `live.css`** on 2026-10-12, when no default filter rule matches. A headless Brave with a fresh profile ignored `--host-resolver-rules` and had no active filter lists, so it can't answer this (g08-21). Test: a person loads `https://mirokshi.itch.io/` in a normal Brave window, first with Shields at Standard and then at Aggressive. Note whether `live.css` shows as blocked in the Shields panel, and copy the matching line from `brave://adblock-internals`. Also note which filter lists are enabled under `brave://settings/shields/filters`; regional lists and the user's custom filters are candidates.
2. **Firefox and Safari:** MIME strictness, preload-scanner behaviour, the request header set, cookie partitioning on stylesheet requests, `data:` fonts and the framework lab were tested in Chromium only. Import-failure timing was also measured in Firefox 142 and Playwright's Windows WebKit (§5.1), but not in Safari's own network stack. Test: re-run `knowledge/evidence/external-tools`, `section08-tools` and `gapfill08-tools/stall-pw.mjs` in Firefox and in Safari on macOS.
3. **Sanitizer and framework class tokens outside project descriptions.** Settled for project descriptions on 2026-10-16: `custom:flex`, `custom:md:flex`, `custom-w-1/2`, `custom-w-[3px]`, `custom-mt-[-1rem]` and `custom-bg-red-500/50` survive, while `md:custom-g`, `-custom-f` and `!custom-h` are dropped (live-k07 to live-k18). A bio settled part of it the same day: `custom-hover:x`, `custom-w-[3px]`, `custom-w-1/2` and `custom:flex` survive there and `-custom-f` is dropped (live-k07 to live-k16, profile run). Still open for devlog posts and jam descriptions, and in bios for `custom:md:flex`, `custom-mt-[-1rem]`, `custom-bg-red-500/50`, `md:custom-g` and `!custom-h`: save one `<span>` per token, then curl the public page and diff the `class` attributes.
4. **jsDelivr quotas and fair-use limits** for heavy itch traffic: no official numbers were found.
5. **Whether a European Vercel region** cuts first-byte time for EU visitors. Test: deploy a copy with `"regions":["cdg1"]` and repeat the curl timing.
6. **Import-failure timing on other operating systems** (unreachable host: 21 s on Windows) and the exact status Vercel returns when `maxDuration` is exceeded. Test: run `gapfill08-tools/stall-*.mjs` on Linux and macOS. For Vercel, deploy a function that sleeps past a 1 s `maxDuration` and curl it.
7. **Whether real itch pages are bfcache-eligible** (the lab only shows that a `no-store` import doesn't prevent it).
8. **Logged-in itch UI and frameworks.** Do Bootstrap's `.visible`, `.active` or `.disabled` (as-is builds) hit itch's logged-in header dropdowns? Only logged-out pages were diffed (g08-14).

### Section notes

Checks made while writing this section on 2026-10-14 (about 13:40–13:50 UTC). curl 8.7.1 (Git for Windows, HTTP/1.1) and Chrome 155.0.8059.40 headless with a throw-away `--user-data-dir`. **No itch.io requests were made for this first pass.** The later gap fill made some by accident (g08-21). The itch `user.css` and three itch page copies used in x08-02 are other agents' same-day scratchpad copies. Third-party files (framework CSS, filter lists, fonts) stayed in the session scratchpad (`…/scratchpad/extcss-section2/`) and were not stored in this repo. The scripts written for this section are in `knowledge/evidence/section08-tools/` (`build.py`, `gen.py`, `analyze.py`).

- **x08-01: framework and font-package files on jsDelivr.** `curl -sS -A "<Chrome 155 UA>" -H "Origin: https://example.itch.io" -D <hdr> -o <file> https://cdn.jsdelivr.net/<path>`, then the same with `-H "Accept-Encoding: br"` to measure wire size:

  | Path | Raw bytes | Brotli bytes |
  |---|---|---|
  | `npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` | 232,803 | 33,206 |
  | `npm/animate.css@4.1.1/animate.min.css` | 71,750 | 5,352 |
  | `npm/tailwindcss@4.1.13/index.css` | 27,442 | 7,421 |
  | `npm/tailwindcss@4.1.13/preflight.css` | 8,382 | 2,844 |
  | `npm/@fontsource/syne@5.2.6/index.css` | 1,219 | 390 |
  | `npm/@fontsource-variable/syne@5.2.6/index.css` | 1,125 | 396 |

  All six answered `text/css; charset=utf-8`, ACAO `*`, `public, max-age=31536000, s-maxage=31536000, immutable`, `x-jsd-version-type: version` and `nosniff`.

- **x08-02: static analysis.** `python -I analyze.py <raw_dir> <scratchpad_root>` is a brace walker that strips comments and descends into `@media`/`@supports`/`@layer`. Plus `grep -o` for the quoted rules.
  - **Bootstrap 5.3.3:** 2,556 style rules, 2,973 selectors, 121 without class or id, 18 `:root`/`[data-bs-theme]` rules, 1,715 `!important`, 5 `@keyframes`, 0 `@layer`, 32 `prefers-reduced-motion` mentions. `.visible{visibility:visible!important}`, `.invisible{visibility:hidden!important}`, `.text-center{text-align:center!important}`.
  - **Animate.css 4.1.1:** 97 `@keyframes` plus 97 `@-webkit-keyframes`; all 111 classes prefixed `animate__`; one `:root{--animate-duration:1s;--animate-delay:1s;--animate-repeat:1}`; one `@media (prefers-reduced-motion:reduce),print{.animate__animated{…}}`.
  - **Tailwind 4.1.13:** `preflight.css` has 81 selectors, all global. `index.css` has 1 `@layer` statement, `@layer theme/base/utilities` blocks, 2 `@theme` blocks and `@tailwind utilities`.
  - **itch `user.css`** (71,824 bytes): 316 classes, the 13 keyframes listed in §12.4, `.animate_bounce{animation:bounce 0.5s ease}`, two `body{…}` rules (margin, font-family, font-size), `.header_widget .header_dropdown:not(.visible)`, `.button.small{…}`.
  - **Class overlap:** Bootstrap ∩ (`user.css` classes ∪ classes in one profile, one project and one devlog HTML) = `active, disabled, icon-link, invisible, small, text-center, visible`. Animate.css ∩ itch = none. Keyframe overlap: Animate `bounce` = itch `bounce`; Bootstrap none.

- **x08-03: framework lab.** `python -I build.py raw www && python -I gen.py www`; `python -I -m http.server 8771 --bind 127.0.0.1` in `www/`; then for each page `chrome --headless=new --virtual-time-budget=4000 --dump-dom http://127.0.0.1:8771/<page>.html` and read the `RESULT {…}` line.
  - **Page model** (`gen.py`): `<!DOCTYPE html>`. A `.header_widget` *outside* `#wrapper` holds an `h1`, an `a`, `span.button.small`, `div.animate_bounce` and `div.header_dropdown.visible`. Then a `style#user_theme` mock (`.user_page a{color:rgb(1,2,3)}`, `@keyframes bounce{from,to{opacity:.25}}`, `.animate_bounce{animation:bounce 1s linear -0.5s paused}`), then `style#custom_css` with the variant. `#wrapper.user_page_wrap > .user_page > .user_profile` holds `h1.custom-title`, two links (one `.text-danger`), `.custom-pop`, `.flex`, `span.btn.btn-primary` and `.spinner-border`.
  - **Variants** (`build.py`): p1 Tailwind `index.css`; p2 Animate.css (`.custom-pop{animation:bounceIn …paused}`); p3 Animate in `#wrapper{}`; p4 Bootstrap; p5 Bootstrap in `#wrapper{}`; p6 Bootstrap `layer(fw)`; p7 Bootstrap nested, roots → `&`, 5 keyframes hoisted; p9 the same in `@scope (#wrapper)` with roots → `:scope`; p10 Animate in `@scope (#wrapper){}`; p11 Animate with all 97 keyframe names prefixed `custom-` (pop uses `custom-bounceIn`); p12 Animate `layer(fw)`.
  - **Results** (computed values):

    | Page | Result |
    |---|---|
    | p0 | body margin 8px; outside h1 21.44px / 32px / 700; outside link `rgb(0,0,238)`; itch bounce opacity 0.25; inside link `rgb(1,2,3)` |
    | p1 | imported sheet = 1 layer statement + 3 layer blocks; body margin 0; outside h1 0px / 16px / 400; outside link `rgb(0,0,0)`; `.flex` `block` |
    | p2 | 307 rules (112 style, 1 media, 194 keyframes); pop `bounceIn:paused` with transform `matrix3d(0.965,…)`; itch bounce transform `matrix(1,0,0,1.08577,0,-25.7313)`, opacity 1 (hijacked) |
    | p3 | 1 top-level rule holding 112 style + 1 media rules and **0 keyframes**; pop has no animation |
    | p4 | outside body margin 0, font `system-ui…`; h1 0px / 33.46px / 500; outside link `rgb(13,110,253)`; inside link `rgb(1,2,3)`; `.text-danger` `rgb(220,53,69)`; `.btn` padding 12px, bg `rgb(13,110,253)`; spinner `spinner-border:running` |
    | p5 | outside unchanged; inside links `rgb(0,0,0)`; `.btn` styled; spinner none |
    | p6 | same leaks as p4 |
    | p7 | outside unchanged; inside link `rgb(13,110,253)`; `.text-danger` red; spinner running; `--bs-body-font-family` set on `#wrapper`, empty on `html` |
    | p9 | 1 `CSSScopeRule` + 5 keyframes; outside unchanged; inside link `rgb(1,2,3)`; `.text-danger` red; `.btn` styled; spinner running |
    | p10 | `CSSScopeRule` with 194 nested `CSSKeyframesRule`; pop runs; itch bounce **hijacked** |
    | p11 | pop `custom-bounceIn:paused`; itch bounce opacity 0.25 (untouched) |
    | p12 | layer `fw`; pop `bounceIn:paused`; itch bounce opacity 0.25 (untouched) |

  The page model is a mock, not the real itch DOM or `user.css`.

- **x08-04: Tailwind docs** (WebFetch 2026-10-14):
  - `tailwindcss.com/docs/installation/play-cdn`: a script tag; "designed for development purposes only, and is not intended for production".
  - `tailwindcss.com/docs/styling-with-utility-classes`: `@import "tailwindcss" prefix(tw);` compiles to `.tw\:text-red-500` and prefixes theme variables (`--tw-color-red-500`). `@import "tailwindcss" important;` makes all utilities `!important`.
  - `tailwindcss.com/docs/preflight`: the default import expands to `theme.css`/`preflight.css`/`utilities.css` layered imports. To disable Preflight, omit its import; `important` and `prefix()` go on the individual imports.
  - `v3.tailwindcss.com/docs/configuration`:
    - `prefix: 'tw-'` gives `.tw-text-left`;
    - variant example `md:tw-text-xl`;
    - `important: '#app'` "will prefix all of your utilities with the given selector", with the warning about including the root-selector template in `content`;
    - `preflight` is listed among the core plugins.
- **x08-05: font hosts.**
  - **Fontsource:** the woff2 `npm/@fontsource/syne@5.2.6/files/syne-latin-400-normal.woff2` returned `font/woff2`, ACAO `*`, immutable. The static `index.css` has 3 faces, all `font-family: 'Syne'; font-weight: 400`, relative `./files/` URLs. The variable `index.css` has 3 faces `font-family: 'Syne Variable'; font-weight: 400 800`.
  - **Bunny Fonts:**
    - `curl -D - "https://fonts.bunny.net/css2?family=Syne:wght@400..800&display=swap"` returned 200, `text/css; charset=utf-8`, ACAO `*`, `public, max-age=2592000`, no `Set-Cookie`, and 15 `@font-face`, all `font-display: swap`, at weights 400/500/600/700/800 × 3 subsets;
    - `/css?family=syne:400,700` returned 200 with 6 faces;
    - a woff2 returned `font/woff2`, ACAO `*`;
    - the quotes come from `fonts.bunny.net/about` (WebFetch).
- **x08-06: Base64 font.** `base64 -w0` of a 2,548-byte WOFF2 (`text=Mirokshi` subset of Syne, the same-day copy in `scratchpad/external-v2/raw/kit.woff2`) gives 3,400 chars. Page `p8-datafont.html`: `@font-face{font-family:KitData;src:url(data:font/woff2;base64,…) format("woff2");font-display:swap}` plus one `#wrapper` rule. `document.fonts.load('16px KitData','Mirokshi')` gave 1 face, `status: "loaded"`; `custom_css` text length 3,537.
- **x08-07: filter lists** (grep of copies downloaded earlier on 2026-10-14 by this section's first draft; the full 30-source scan is in `evidence/external.md` §4):
  - EasyList `Version: 202610141058`: lines 10790–10795 are the six `##.custom-ad…` rules; lines 281 and 283 are the generic `/advert.` and `/adverts.` rules.
  - Easylist Cookie List (last modified 2026-10-14 09:25 UTC): `###custom-cookie-accept`, `###custom-cookie-container`, `###custom-cookie-message-banner`, `###custom-header-cookie`, `##.custom-ch-cookie-notice`, `##.custom-container-lgpd`, `##.custom-cookie-banner`, `##.custom-cookie-footer-banner`, `##.custom-cookie-msg`.
- **x08-08: hosting terms** (WebFetch 2026-10-14):
  - `vercel.com/docs/limits/fair-use-guidelines` (last_updated 2026-09-14): "Hobby teams are restricted to non-commercial personal use only". Commercial examples include payment requests, "Advertising the sale of a product or service", paid site creation, affiliate-first sites and ads. "Asking for Donations does not fall under commercial usage".
  - `docs.github.com/…/github-pages-limits`: 1 GB site, soft 100 GB/month, soft 10 builds/hour, 429 when rate-limited, "not intended for or allowed to be used as a free web-hosting service to run your online business".
- **Gap fill (2026-10-14, 13:55–14:45 UTC; full log in `evidence/gapfill.md`, "Gap fill for 08-external-css.md"; scripts in `evidence/gapfill08-tools/`):**
  - **g08-01 to g08-09, Tailwind.**
    - Compiled builds: tailwindcss 3.4.19, and 4.1.18 with `@tailwindcss/cli` 4.1.18.
    - `scopecheck.py` listed selectors outside `#wrapper`, `:root`/`*`/`::backdrop` rules, `@property` and unprefixed classes.
    - Real-page harness (`gen_real.py`, `real-diff.mjs`): same-day copies of one profile and one project page, with itch's own JS/CSS served locally (`window.I` present) and every other host mapped to NOTFOUND in Chrome 155. A sanitizer-compatible fragment was injected into the bio. Computed styles of every element were diffed against the same page without the framework (144 and 1,615 elements).
    - Token shapes: web_sanitize model (`tokprobe.py`) and a scan of 1,508 local page copies (`tokscan.py`).
  - **g08-10 to g08-16, Bootstrap.** `postcss-rename` 0.8.1 and `postcss-prefix-selector` 2.2.1 on `bootstrap@5.3.3`, in the same harness, plus emulated `prefers-reduced-motion`. `collide.py` compared renamed names with creators' classes.
  - **g08-17 to g08-20, import failures.** `stallserver.py` and `stallpages.py` with `stall-chrome.mjs` (Chrome 155) and `stall-pw.mjs` (Playwright 1.56.1: Firefox 142.0.1, WebKit 26.0 Windows port). 10 failure modes, 330 s cap, one browser instance per page. The Vercel duration docs were fetched with WebFetch.
  - **g08-21, Brave.** Headless Brave 1.97.56 with a fresh profile: inconclusive. Brave ignored `--host-resolver-rules`, so that run reached the live site with about 200–250 GETs to itch domains, above this pass's request budget. The labs above made 0 itch requests.
- **Corrections to this section's first draft (same day):**
  - The scoped-Bootstrap recipe's keyframes are now actually hoisted and tested (the spinner runs). The first draft left them nested.
  - Fontsource's static `index.css` is weight 400 only, not three weights.
  - `@scope` keeps `@keyframes`, but they stay global (new, p10).
  - `layer()` on an Animate.css import resolves the `bounce` clash (new, p12).
  - jsDelivr short SHAs and version-less URLs get the branch cache.
  - The cold-start range and the function-hop cost follow the corrected fact external-18.
  - The cookie claim is now verified (external-47).
