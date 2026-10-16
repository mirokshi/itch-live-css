export const meta = {
  name: 'itch-css-knowledge-base',
  description: 'Research, test and adversarially verify everything about itch.io custom CSS, then write an AI knowledge base',
  phases: [
    { title: 'Research', detail: '13 independent research/test dimensions (docs, sanitizer source, crawls, corpus, local browser tests, support data…)' },
    { title: 'Verify', detail: 'one skeptic per dimension re-checks every claim from primary sources' },
    { title: 'Write', detail: 'parallel section writers produce knowledge/sections/*.md' },
    { title: 'Critique', detail: 'completeness critic finds gaps and weak claims' },
    { title: 'Fill', detail: 'targeted research per section patches the gaps' },
    { title: 'Probes', detail: 'live probe kit for what can only be tested on an itch account' },
    { title: 'Assemble', detail: 'final itch-custom-css.md + llms.txt' },
    { title: 'Review', detail: 'adversarial review of the final file' },
  ],
}

const A = args
const REPO = A.repo            // new public project (write here)
const OLD = A.oldRepo          // itch-io-custom-css (read only)
const SCR = A.scratch          // scratchpad for raw downloads
const TODAY = A.today

const AREAS = ['access-and-editor','policy','page-profile','page-project','page-devlog','page-jam','theme-editor','itch-stylesheets','html-sanitizer','css-editor-survival','cascade','techniques','browser-support','external-import','gotchas','testing-a11y']

const EVIDENCE_ITEM = {
  type: 'object',
  properties: {
    kind: { type: 'string', enum: ['official-doc','source-code','live-observation','local-test','community-report','repo-history','spec-or-mdn','inference'] },
    ref: { type: 'string', description: 'URL, file path, test file, or command' },
    note: { type: 'string' },
  },
  required: ['kind','ref'],
}
const FACT_ITEM = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'stable id, prefix = dimension key, e.g. corpus-07' },
    area: { type: 'string', enum: AREAS },
    claim: { type: 'string', description: 'one precise, actionable sentence' },
    detail: { type: 'string', description: 'explanation, exact selectors/code, how an AI should apply it, symptoms if ignored' },
    pageTypes: { type: 'array', items: { type: 'string', enum: ['profile','project','devlog','jam','all','other'] } },
    evidence: { type: 'array', items: EVIDENCE_ITEM },
    confidence: { type: 'string', enum: ['verified','documented','observed','community','inferred','unverified'] },
    observedOn: { type: 'string', description: 'date checked, YYYY-MM-DD' },
  },
  required: ['id','area','claim','evidence','confidence'],
}
const QUESTION_ITEM = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    whyItMatters: { type: 'string' },
    howToTest: { type: 'string' },
    needsAccount: { type: 'boolean', description: 'true if it can only be answered by saving content on an itch account (bio HTML, CSS editor, theme editor)' },
  },
  required: ['question','howToTest','needsAccount'],
}
const FACTS_SCHEMA = {
  type: 'object',
  properties: {
    dimension: { type: 'string' },
    facts: { type: 'array', items: FACT_ITEM },
    openQuestions: { type: 'array', items: QUESTION_ITEM },
    artifacts: { type: 'array', items: { type: 'string' }, description: 'files written' },
  },
  required: ['dimension','facts','openQuestions'],
}
const VERIFY_SCHEMA = {
  type: 'object',
  properties: {
    verdicts: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' },
      verdict: { type: 'string', enum: ['confirmed','corrected','refuted','unverifiable'] },
      confidence: { type: 'string', enum: ['verified','documented','observed','community','inferred','unverified'] },
      correctedClaim: { type: 'string' },
      correctedDetail: { type: 'string' },
      reason: { type: 'string' },
      addedEvidence: { type: 'array', items: EVIDENCE_ITEM },
    }, required: ['id','verdict','reason'] } },
    additionalFacts: { type: 'array', items: FACT_ITEM },
    openQuestions: { type: 'array', items: QUESTION_ITEM },
  },
  required: ['verdicts'],
}

const COMMON = `
CONTEXT
We are building a PUBLIC knowledge base ("knowledge for AIs") about authoring custom CSS for itch.io pages (profile, project/game, devlog, jam). An AI assistant reading it must be able to write correct, rule-abiding itch CSS on the first try. The final file will be in English. Today is ${TODAY}. Your knowledge may be outdated — itch.io and browsers change; prefer what you can observe NOW.
- Existing private repo with hard-won, live-verified knowledge (READ ONLY, never modify): ${OLD} (its .claude/CLAUDE.md, README.md, src/main.css, custom-css/, preview/itch-io.html export, docs/custom-css-guide.md).
- New public project (the only place you may write): ${REPO}
- Scratchpad for raw downloads / temp files: ${SCR}\\<your-dimension>\\ (create it).

RULES FOR TESTING
- Every fact needs evidence you actually checked IN THIS SESSION (URL fetched, file read, command run, test executed). Memory-only beliefs → confidence 'unverified' and add them to openQuestions with how to test.
- Confidence: verified = you reproduced it by a direct test or live observation right now; documented = stated by itch's official docs/blog/source; observed = seen on real pages but not systematically; community = reported by third parties only; inferred = logical deduction from verified facts; unverified = not checked.
- itch.io etiquette: honor robots.txt (Disallow: /embed/, /embed-upload/, /search, /checkout/, /game/download/, /bundle/download/, /register-for-purchase/, /email-feedback/), GET requests only, at most ~1 request per second (sleep between curls), at most ~150 itch requests in total, normal browser User-Agent. Never log in, never submit forms, never post anything.
- Use curl via Bash for raw HTML/CSS/headers (WebFetch converts to markdown and loses <style> contents and class names). Use WebSearch/WebFetch for docs, forums, GitHub, MDN, caniuse.
- Do NOT use the mcp__Claude_Browser__* tools unless your task explicitly says so (one shared browser pane). NEVER use mcp__claude-in-chrome__* tools (that is the user's real logged-in Chrome).
- Copyright/privacy: never save third-party content (other creators' CSS/HTML, itch's own stylesheets) verbatim into ${REPO}. Raw copies go to the scratchpad only. In ${REPO} store your own analysis, statistics, and short illustrative snippets (≤10 lines) written by you. Don't record personal data about creators; cite URLs of public pages only when needed as evidence (prefer well-known pages, jams, itch staff).
- Write a reproducible evidence log for your dimension to ${REPO}\\knowledge\\evidence\\<your-dimension>.md: method, exact commands/URLs, sample list, results tables, date. Another agent must be able to re-run it.
- Facts must be concrete and actionable: exact selectors, property names, code, numbers, symptoms. Prefer many precise facts over vague ones. Aim for 25–60 facts for your dimension. Use fact ids prefixed with your dimension key.
- Areas for facts: ${AREAS.join(', ')}.
`

const DIMENSIONS = [
  { key: 'docs', title: 'Official docs & policy', prompt: `
DIMENSION: docs — official itch.io documentation and policy.
1. Find the CURRENT online itch.io custom CSS guide (search itch.io/docs). Fetch it fully (curl the raw HTML too). Diff it against the offline copy ${OLD}\\docs\\custom-css-guide.md: list every change. Include the section on how to request CSS access (the offline copy omits it): procedure, criteria, where to ask.
2. Find every other official source touching custom CSS / page customization: itch.io/docs (creators: theme editor, embedding, HTML in descriptions, devlogs, jams hosting docs), itch.io/updates blog posts about profile customization / custom CSS / theme editor, itch staff (leafo, etc.) posts in the itch community forum about custom CSS rules, the terms of service / content policy items relevant to page styling (misleading visitors, hiding links, impersonation).
3. Extract: which page types support custom CSS (profile, project, jam, devlog inheritance, others like collections/community/bundles?), the documented limits, documented stable classes/ids per page type, documented theme variables, rules (#wrapper scope, custom- classes, footer, HTTPS assets, enhance-not-rebuild), recommended testing (mobile, logged out, accessibility), anything about the character limit, fonts, images, @import.
Return documented facts with exact URLs.` },
  { key: 'sanitizer', title: 'Sanitizer source code', prompt: `
DIMENSION: sanitizer — how itch sanitizes HTML in descriptions/bios (and possibly CSS), from SOURCE CODE.
1. itch.io is built by leaf corcoran (leafo) with Lapis/MoonScript. Investigate the open-source library leafo/web_sanitize on GitHub (clone or fetch raw files with curl/gh: whitelist definitions, html sanitizer, css sanitizer, tests). Extract EXACT lists: allowed tags, allowed attributes per tag, allowed URL protocols, how the class attribute is handled, how style attributes are handled (CSS property whitelist?), iframe/embed handling, self-closing/void tags, what happens to disallowed tags (stripped vs escaped vs content kept).
2. Establish with evidence whether itch.io actually uses web_sanitize (README, leafo's statements, issues, itch blog, forum posts) and what itch adds on top (e.g. the custom- class prefix rule, iframe embed whitelist for YouTube/Vimeo/SoundCloud/Bandcamp/itch embeds, image proxying). Search itch docs and forums for "custom-" class rule, "aria-hidden stripped", "iframe allowed", "style attribute" etc.
3. Cross-check against real evidence: ${OLD}\\.claude\\CLAUDE.md records that itch's sanitizer KEEPS <h1> with a custom- class and <span class="custom-hello"> but STRIPS aria-hidden (seen live 2026-10-08/12). Inspect live public pages (curl) for bios/descriptions using details/summary, tables, iframes, svg, inline styles, data-* attributes, id attributes, classes with ':' or '[' characters, to see what survived.
4. Also look for any sanitization of the custom CSS text itself (e.g. stripping </style>, expression(), javascript: urls, -moz-binding, behavior, @import restrictions) in web_sanitize or itch statements.
Mark facts derived from source code as 'documented' (kind source-code) unless also observed live. Put every unresolved sanitizer question (things that only saving content on an itch account can settle) into openQuestions with needsAccount=true and a precise probe.` },
  { key: 'community', title: 'Community knowledge', prompt: `
DIMENSION: community — what creators report about itch custom CSS (forums, Reddit r/itchio, GitHub repos/gists/READMEs of itch CSS themes, Stack Overflow, blog tutorials, YouTube descriptions).
Collect: reported character limit(s) of the CSS editor and how it behaves when exceeded (truncation? refusal? silent?), what gets stripped or rewritten when saving CSS, @import / @font-face / Google Fonts experiences, background image tricks, theme editor conflicts, mobile issues, breakages after itch updates (with dates), CSS access request experiences (how long, how to ask), common mistakes, things that look like they work while logged in but not logged out, devlog styling, jam page styling tips, game embed (iframe) styling limits, any reported moderation/suspension because of CSS.
Mark everything as 'community' unless you can verify it yourself now (then upgrade with evidence). Flag contradictions between sources explicitly in detail. Put the most important unverified claims into openQuestions with a test.` },
  { key: 'crawlprofile', title: 'Crawl: profile pages', prompt: `
DIMENSION: crawlprofile — live DOM of itch.io PROFILE pages (logged out), by curl.
1. Sample at least 15 diverse public profiles (<user>.itch.io): with/without custom CSS (style#custom_css non-empty), with banner image vs text header, with links/socials, with collections, purchased games shown, multiple game categories, minimal profiles. Start from ${OLD}\\preview\\itch-io.html (June 2026 export of mirokshi.itch.io) and the live https://mirokshi.itch.io/. Find others via itch.io browse pages, game pages' author links, jam hosts, staff (leafo.itch.io).
2. Produce a canonical DOM tree of the profile page with every id/class, which are optional, and variations. Record the <head> order: theme style (style#user_theme) vs custom CSS (style#custom_css) vs itch stylesheet <link>s vs scripts — the order decides cascade ties.
3. Dissect style#user_theme: which selectors and variables the theme editor emits on profiles (e.g. .user_page{--itchio_*}, .user_page_wrap{background-image}), the font loading mechanism.
4. Check response headers (curl -I and -D): Content-Security-Policy, X-Frame-Options, caching, compression, set-cookie on logged-out.
5. Compare https://<user>.itch.io/ with https://itch.io/profile/<user> (community profile): does custom CSS apply there? DOM differences?
6. Note what differs for logged-out vs (from the export/CLAUDE.md) logged-in owner views if anything can be inferred.
Write a sanitized DOM skeleton (classes/ids only, no personal text) into the evidence file.` },
  { key: 'crawlproject', title: 'Crawl: project & devlog pages', prompt: `
DIMENSION: crawlproject — live DOM of itch.io PROJECT/GAME pages and DEVLOG posts (logged out), by curl.
1. Sample at least 20 diverse project pages: HTML5 games embedded in page vs click-to-launch vs fullscreen, downloadable free, paid, pay-what-you-want/donation, with/without screenshots (theme layouts: screenshots on the side vs below), with devlog list, comments, community board link, "More information" panel, ratings, jam submission banners, header/banner images, background images, tools/assets/comics/books/physical games, web-only pages. Prefer pages that have style#custom_css.
2. Canonical DOM map with every id/class (#wrapper, #inner_column, .header, .columns, .left_col, .right_col, .formatted_description, .embed_wrapper, .game_frame, .buy_row, .purchase_banner, .more_information_toggle, .game_info_panel_widget, .screenshot_list, .game_comments_widget, .devlog_*, .footer …) and which are present when. Record the <head> order of theme style vs custom CSS vs itch stylesheets.
3. Dissect the project theme style block (id and selectors, variables like --itchio_*), and how the "layout" options of the theme editor change classes.
4. Devlogs: fetch several devlog posts (/devlog/<id>-<slug>) and devlog index pages: does the project's custom CSS apply (same style#custom_css?), what DOM, what classes. Also check /purchase, /comments?, /community, /devlog index, and the game's "download" interstitial if allowed by robots.txt (do NOT fetch disallowed paths) — which of these carry the project's custom CSS.
5. Response headers (CSP etc.) for project pages and for the embedded game iframe host (html-classic.itch.zone etc. — only headers of the page that contains it, don't fetch /embed/).
Write a sanitized DOM skeleton into the evidence file.` },
  { key: 'crawljam', title: 'Crawl: jam pages', prompt: `
DIMENSION: crawljam — live DOM of itch.io JAM pages (logged out), by curl.
1. Sample at least 10 jams (current and past, big and small, with custom CSS): overview (itch.io/jam/<slug>), /entries, /rate/<id> (entry page), /results, /community, /submit is likely login-gated (only HEAD/GET logged-out view if allowed).
2. Which subpages carry the jam's custom CSS (style#custom_css) and which don't. Canonical DOM map (#wrapper.jam_page_wrap, .view_jam_page, .jam_banner_outer, .jam_body, #entries, countdown widgets, host info, stats, etc.).
3. Jam theme variables (documented in the guide: --itchio_link_color, --itchio_button_*, --itchio_border_*): where they're set, actual values, what they color. Head order of theme style vs custom CSS.
4. Response headers (CSP). Note differences from profile/project pages.
Write a sanitized DOM skeleton into the evidence file.` },
  { key: 'corpus', title: 'Real-world custom CSS corpus', prompt: `
DIMENSION: corpus — statistical analysis of REAL custom CSS as served live (what survives itch's save pipeline).
1. Collect style#custom_css from at least 60 distinct pages across types (profiles, projects, jams) via curl (raw copies to scratchpad only). Sources: jam pages (many have custom CSS), popular/featured games, itch.io/games/... listings, creators known for custom pages, GitHub repos that publish itch CSS (search GitHub for "itch.io custom css", "#wrapper" "itch").
2. Measure and report: length distribution (min/median/p90/max chars and bytes) — the max observed lengths are evidence for the editor's character cap (the private repo believes ~5120 chars); presence of @import (Google Fonts vs other hosts — list hosts), @font-face (url schemes/hosts), @keyframes, @media, @supports, @container, @layer, @property, @scope, CSS nesting, :has(), !important, :root/html/body selectors outside #wrapper (is the #wrapper rule enforced or just policy?), data: URIs (sizes), comments (preserved?), whitespace/minification, non-ASCII characters and escapes, vendor prefixes.
3. Encoding/escaping test: inspect the RAW HTML bytes inside <style id="custom_css">: are '>' (child combinator), '<', '&', quotes HTML-escaped (&gt; etc.)? If '>' were escaped the child combinator would break — this is critical. Is there any sign of rewriting (e.g. itch prefixing selectors, removing at-rules, normalizing)?
4. Source-vs-live diff: find at least 3 public GitHub sources of itch custom CSS that correspond to an identifiable live page; diff source vs live to detect transformations. Report precisely.
Publish only statistics and your own short snippets in the evidence file.` },
  { key: 'itchcss', title: "itch's own stylesheets", prompt: `
DIMENSION: itchcss — analyze itch.io's OWN stylesheets that custom CSS must coexist with.
1. From live profile, project and jam pages (curl), list every stylesheet <link> (static.itch.io / itch.io CSS bundles, Google Fonts) and inline <style> blocks. Download them to the scratchpad (never into ${REPO}).
2. Analyze: media-query breakpoints used for each page type (widths), base styles for the key classes (#wrapper, .inner_column, .columns, .game_grid_widget, .game_cell, .formatted_description, .user_profile, .buy_row, .footer, .header…), fonts (default font stack, how the theme font picker loads fonts), CSS variables defined/consumed (--itchio_*), !important usage that custom CSS must fight, z-index layers (header bars, popups, lightbox), focus styles for links/buttons, existing animations/transitions, prefers-reduced-motion handling, any print styles.
3. Determine typical selector specificities of theme-editor output vs base CSS (e.g. .user_page a, .game_title a.title) and therefore what selector strength a custom rule needs (why #wrapper prefixes win; where !important is still needed).
4. Logged-out page chrome: is there a top header bar on these subdomain pages (the "itch.io" header / user tools), and is it inside or outside #wrapper?
Store only your analysis (tables of breakpoints, selectors, specificity) in the evidence file.` },
  { key: 'localtests', title: 'Local browser cascade tests', prompt: `
DIMENSION: localtests — reproducible LOCAL browser experiments on CSS behaviors that matter for itch custom CSS. You are the ONLY agent allowed to use the built-in browser tools (mcp__Claude_Browser__*; load them with ToolSearch, e.g. "select:mcp__Claude_Browser__preview_start,mcp__Claude_Browser__navigate,mcp__Claude_Browser__javascript_tool,mcp__Claude_Browser__read_page,mcp__Claude_Browser__read_console_messages,mcp__Claude_Browser__resize_window,mcp__Claude_Browser__computer").
Servers: preview_start {name:"knowledge-tests"} serves ${REPO} at http://localhost:8090 and preview_start {name:"knowledge-tests-xorigin"} serves the same folder at http://localhost:8091 (a different origin, to emulate a third-party @import like a Vercel service). Write test pages under ${REPO}\\knowledge\\tests\\ (one small self-describing HTML file per test + any CSS files; each page prints PASS/FAIL results into the DOM via a tiny inline script so they're re-runnable; JS in test pages is fine — they're local harnesses, not itch content). Build a minimal SYNTHETIC itch-like page (your own markup with the same ids/classes and head order as itch: itch stylesheet → style#user_theme → style#custom_css; get the real order from ${OLD}\\preview\\itch-io.html) — do not copy itch's CSS.
Run at least these experiments, record exact results and the browser version (navigator.userAgent):
 a. Rules from an @import'ed sheet vs same-specificity rules in the importing <style>: who wins ties (order of appearance)? Also vs style#user_theme placed before custom_css.
 b. @import placed after other rules is ignored; multiple @imports ordering; @import with a cross-origin URL (8091) applies; cssRules of cross-origin sheet throw.
 c. Served MIME: @import of a file served as text/plain (e.g. .txt) — rejected in standards mode? (python http.server maps by extension.) Also .css served without charset containing non-ASCII in content: — decoded correctly when page is UTF-8? With @charset?
 d. @layer: layered custom rules vs unlayered theme rules (layered lose regardless of specificity) — critical for Tailwind v4 output which uses @layer. @import url() layer(x). !important inside layers.
 e. background shorthand on #wrapper resets a background-image set by a lower-specificity class rule (.user_page_wrap), longhands don't.
 f. Relative url() inside an inline <style> resolves against the PAGE URL; inside an imported sheet, against the SHEET URL (matters for services and for itch where the page is on <user>.itch.io).
 g. @property registered in an imported cross-origin sheet works; @keyframes defined in an imported sheet usable by rules in the inline sheet and vice versa; same-name @keyframes: last wins.
 h. content: var(--x) with a string custom property; content with alt text "…" / ""; counters.
 i. overflow-y:clip vs clip-path on a tall rotated pseudo-element: horizontal scrollable overflow (document.scrollingElement.scrollWidth) — the private repo saw clip-path cause horizontal scroll on mobile.
 j. CSS nesting (#wrapper { .x { } }), :has(), @container, @scope support in this browser.
 k. display:none vs visibility:hidden vs color:transparent vs clip-based visually-hidden — accessibility tree via read_page (note: read_page/find include visibility:hidden text and ignore ::before/::after content — record that tool caveat too).
 l. prefers-reduced-motion emulation isn't available via resize_window; if you can't emulate, write the test page so it reports matchMedia and mark as needing a manual check.
 m. Anything else you judge important for custom-CSS authors (e.g. position:fixed pseudo-elements with z-index:-1 inside an isolation:isolate #wrapper; backdrop-filter needing translucent backgrounds; 100vh vs 100dvh).
CAVEATS (from ${OLD}\\.claude\\CLAUDE.md): the preview browser caches python http.server files — after editing a file, fetch(url,{cache:'reload'}) then navigate; with the pane hidden, requestAnimationFrame never fires and screenshots may be stale — read computed values via javascript_tool instead; CSS animations/transitions may be frozen.
Only Chromium is available here: mark findings as Chromium-verified and add openQuestions for Firefox/Safari behavior where it might differ. Stop both servers at the end (preview_stop).` },
  { key: 'support', title: 'Modern CSS browser support', prompt: `
DIMENSION: support — CURRENT (as of ${TODAY}) browser support for CSS features relevant to JS-free itch pages. Use WebSearch (mode "extended" for recency), MDN, caniuse, web-features/Baseline data, and Chrome/Firefox/Safari release notes from 2025-2026. Your memory is outdated — verify each.
Features: random() / random-item(), if(), style container queries, size container queries, @scope, CSS nesting, :has(), @property, trig functions sin()/cos(), scroll-driven animations (animation-timeline scroll()/view()), cross-document view transitions (@view-transition {navigation:auto}) — relevant for same-origin navigation between a creator's pages, anchor positioning, @starting-style, interpolate-size / calc-size(), sibling-index() / sibling-count(), text-wrap: balance/pretty, content alt text ("x" / ""), overflow: clip, backdrop-filter (unprefixed in Safari?), individual transform properties (translate/rotate/scale), color-mix(), relative color syntax, light-dark(), @layer, attr() with types, CSS @function / custom functions, ::scroll-marker / ::scroll-button (CSS carousels), details::details-content, field-sizing, shape(), corner-shape, text-box, @container scroll-state(), view-transition-name auto, :popover-open, reading-flow, typed arithmetic, @custom-media, @mixin.
For each: Baseline status (newly/widely available or not), first versions in Chrome/Edge, Firefox, Safari (incl. iOS), and a one-line note on how it helps itch custom CSS without JavaScript, plus the safe fallback pattern (@supports). Cite URLs.` },
  { key: 'repo', title: 'Mine the private repo', prompt: `
DIMENSION: repo — mine the existing private repo ${OLD} for every hard-won fact about itch custom CSS: .claude/CLAUDE.md, README.md, src/main.css (read every comment), custom-css/README.md and custom-css/lib/*.js comments, bio/*.html, preview/*.html (the June 2026 export: head order, user_theme contents, DOM), playground/*.html notes, .claude/minify-css.ps1 (minification approach), and git history (git -C "${OLD}" log -p --stat). 
For each fact, record whether the repo says it was CONFIRMED LIVE (and the date) → confidence 'verified' with kind 'repo-history'; otherwise 'observed'/'inferred'. Include: the ~5120 char limit and how to stay under it, background shorthand on #wrapper wiping the theme image, itch's align-items:start on .game_grid_widget, theme variables living on .user_page (child of #wrapper) so #wrapper-level overrides are shadowed, hardcoded theme colors per selector, profile h1 holding the display name, .formatted_description absent on profiles, sanitizer keeping h1/custom- classes and stripping aria-hidden, non-Google @import kept and no CSP on profile, imported rules losing specificity ties, clip-path vs overflow-y:clip scroll bug, Brave Shields blocking the external service, random() Safari-only, encoding gotchas (UTF-8 vs PowerShell ANSI; \\hex escapes in CSS strings), reduced-motion handling, frosted-glass cards via backdrop-filter, the testing workflow with a local harness, etc. Do not include personal preferences of the repo owner as itch facts (e.g. their palette) — only generalizable knowledge. You may verify any fact live by curl against https://mirokshi.itch.io/ (public page).` },
  { key: 'external', title: 'External CSS services (@import)', prompt: `
DIMENSION: external — everything about serving CSS from an external origin into itch via @import (dynamic per-visit CSS, fonts, frameworks).
1. Live check of the existing service (owner's own, fine to request): curl -sD - https://itch-io-custom-css-custom-css.vercel.app/live.css — headers (Content-Type, Cache-Control, CORS, compression), latency (curl -w timing, several runs). Confirm on https://mirokshi.itch.io/ that style#custom_css contains a non-Google @import kept verbatim (no proxying/rewriting by itch).
2. Research with sources: browsers' strict MIME checking for stylesheets (text/css required in standards mode), @import render-blocking and serial chains (an @import inside an imported sheet = waterfall), no way to add <link rel=preconnect> on itch (no head access) — or is there?, Cache-Control no-store vs bfcache/back-forward behavior, HTTP caching semantics for stylesheets, mixed content (http blocked), CORS only needed for CSSOM access/fonts (@font-face cross-origin needs Access-Control-Allow-Origin!), font-display.
3. Content blockers: why would Brave Shields block a third-party stylesheet from *.vercel.app? Check EasyList/EasyPrivacy/uBlock Origin default lists and Brave's lists for rules matching vercel.app, *.workers.dev, *.pages.dev, *.netlify.app, github.io, or generic third-party CSS; Brave's aggressive vs standard mode. Recommend hosting choices less likely to be blocked (custom domain?) with evidence.
4. Free hosting limits as of ${TODAY} (fetch official pricing/limits pages): Vercel Hobby (function invocations, bandwidth, commercial-use clause), Cloudflare Workers free (requests/day, CPU), Cloudflare KV free limits, Netlify functions, Deno Deploy. 
5. Privacy: what a third-party CSS host receives (IP, User-Agent, Referer — what Referer does a stylesheet request from <user>.itch.io send given itch's Referrer-Policy? check the header), GDPR implications, tracking-pixel abuse concerns (url() in CSS) and itch policy.
6. Google Fonts via @import inside itch CSS: URL forms (css2 API, variable axes ranges), display=swap, privacy note (EU rulings on Google Fonts IP transfer).` },
  { key: 'a11y', title: 'Accessibility & testing practice', prompt: `
DIMENSION: a11y — accessibility and verification practice specific to itch custom CSS. Do NOT use the browser tools; work from itch's live markup/CSS (curl), the private repo, WCAG 2.2 and MDN.
Cover: what the itch guide requires (mobile, logged out, assistive tech); keeping exactly one visible h1 when hiding itch's header h1; display:none removes from the accessibility tree; generated content (::before/::after) IS read by screen readers unless alt text "" is given; color contrast between custom colors and the theme editor colors (theme colors are not in custom CSS — both must be checked); focus indicators of itch links/buttons (does itch define :focus-visible styles? don't remove outlines); prefers-reduced-motion patterns (kill infinite animations, keep state readable); forced-colors (Windows High Contrast) — backgrounds and gradients disappear, transparent text tricks may break; text zoom 200% / reflow at 320px; touch devices have no hover (hover-only reveals are inaccessible); itch's mobile breakpoints; logged-out vs logged-in differences (owner sees extra admin UI); testing tools workflow (local harness, DevTools emulation, axe), Safari/iOS specific issues (background-attachment:fixed ignored on iOS, backdrop-filter prefix history).
For each, give the concrete rule for an AI writing itch CSS.` },
]

function researchPrompt(d) {
  return `${COMMON}\n${d.prompt}\n\nReturn structured output: dimension="${d.key}", your facts, openQuestions, and artifacts (files you wrote).`
}

function verifyPrompt(d, r) {
  return `${COMMON}
You are an ADVERSARIAL VERIFIER for dimension "${d.key}" (${d.title}). Another agent produced the facts below. Your job is to try to REFUTE each one by going back to PRIMARY sources yourself (re-fetch the URL, re-run the curl, re-read the source file, re-run the local test page if any — ${d.key === 'localtests' ? 'you MAY use the built-in browser tools and the knowledge-tests servers to re-run the test pages under ' + REPO + '\\knowledge\\tests\\' : 'do NOT use any browser tools'}).
For every fact return a verdict:
- confirmed: you independently checked and it holds (set confidence to what YOUR check supports).
- corrected: partly wrong/imprecise/overstated — give correctedClaim/correctedDetail.
- refuted: wrong or unsupported by the cited evidence.
- unverifiable: you could not check; lower confidence to 'unverified' unless the cited source clearly supports it.
Be strict about overclaiming: "verified" requires a direct test or live observation; docs/source → "documented"; third-party reports → "community". Check for claims that may be outdated (dates!).
You may add additionalFacts that the first agent missed (with evidence) and more openQuestions. If you find errors in ${REPO}\\knowledge\\evidence\\${d.key}.md, fix that file and append a "Verification (${TODAY})" section listing your verdicts.

FACTS TO VERIFY (JSON):
${JSON.stringify(r.facts, null, 1)}

OPEN QUESTIONS SO FAR:
${JSON.stringify(r.openQuestions, null, 1)}`
}

function applyVerdicts(r, v) {
  if (!r) return null
  if (!v) return { ...r, facts: r.facts.map(f => ({ ...f, verifiedBy: 'none' })) }
  const byId = new Map((v.verdicts || []).map(x => [x.id, x]))
  const facts = []
  let refuted = 0, corrected = 0
  for (const f of r.facts) {
    const x = byId.get(f.id)
    if (!x) { facts.push({ ...f, verifiedBy: 'missing-verdict' }); continue }
    if (x.verdict === 'refuted') { refuted++; continue }
    const nf = { ...f, verifiedBy: x.verdict, verifyReason: x.reason }
    if (x.verdict === 'corrected') {
      corrected++
      if (x.correctedClaim) nf.claim = x.correctedClaim
      if (x.correctedDetail) nf.detail = x.correctedDetail
    }
    if (x.confidence) nf.confidence = x.confidence
    if (x.verdict === 'unverifiable' && !x.confidence) nf.confidence = 'unverified'
    if (x.addedEvidence && x.addedEvidence.length) nf.evidence = [...(f.evidence || []), ...x.addedEvidence]
    facts.push(nf)
  }
  for (const af of (v.additionalFacts || [])) facts.push({ ...af, verifiedBy: 'added-by-verifier' })
  return {
    dimension: r.dimension,
    facts,
    openQuestions: [...(r.openQuestions || []), ...(v.openQuestions || [])],
    artifacts: r.artifacts || [],
    stats: { proposed: r.facts.length, refuted, corrected, added: (v.additionalFacts || []).length },
  }
}

// ---------------- Research → Verify (pipelined per dimension) ----------------
const verified = await pipeline(
  DIMENSIONS,
  d => agent(researchPrompt(d), { label: `research:${d.key}`, phase: 'Research', schema: FACTS_SCHEMA }),
  (r, d) => r
    ? agent(verifyPrompt(d, r), { label: `verify:${d.key}`, phase: 'Verify', schema: VERIFY_SCHEMA })
        .then(v => { const m = applyVerdicts(r, v); if (m) log(`${d.key}: ${m.stats.proposed} proposed, ${m.stats.refuted} refuted, ${m.stats.corrected} corrected, +${m.stats.added} added`); return m })
    : null,
)

const dims = verified.filter(Boolean)
const missing = DIMENSIONS.filter((d, i) => !verified[i]).map(d => d.key)
if (missing.length) log(`WARNING: dimensions with no result: ${missing.join(', ')}`)
const allFacts = dims.flatMap(x => x.facts)
const allQuestions = dims.flatMap(x => (x.openQuestions || []).map(q => ({ ...q, from: x.dimension })))
log(`${allFacts.length} facts and ${allQuestions.length} open questions after verification`)

// ---------------- Write sections (barrier: needs all facts) ----------------
const SECTIONS = [
  { file: '01-how-it-works.md', title: 'How custom CSS works on itch.io', areas: ['access-and-editor','css-editor-survival'] , brief: 'Access (how to request), where the editor is per page type, character cap and how to stay under it (minify), what itch keeps/rewrites/escapes when saving CSS, where the CSS is injected in <head> and in which order relative to theme and itch stylesheets, which page types and subpages get it (devlogs inherit project CSS?), what you cannot do (no JS).' },
  { file: '02-rules-and-policy.md', title: 'Hard rules and policy', areas: ['policy'], brief: 'Every enforced or policy rule (#wrapper scope, custom- classes, footer, HTTPS, enhance not rebuild, misleading visitors, suspension risk), separating "enforced by software" from "policy only".' },
  { file: '03-page-anatomy.md', title: 'Page anatomy (profile, project, devlog, jam)', areas: ['page-profile','page-project','page-devlog','page-jam'], brief: 'Canonical DOM trees per page type with stable vs unstable selectors, optional parts, variations, head order, URL forms; tables of the most useful selectors and what they target.' },
  { file: '04-theme-editor-and-itch-css.md', title: 'Theme editor and itch\'s own stylesheets', areas: ['theme-editor','itch-stylesheets'], brief: 'What the theme editor emits (style blocks, selectors, variables per page type, where the background image is painted), itch base CSS that custom CSS fights (breakpoints, !important, align-items, z-index, focus styles), and the selector strength needed.' },
  { file: '05-html-in-descriptions.md', title: 'HTML in bios and descriptions (sanitizer)', areas: ['html-sanitizer'], brief: 'Allowed/stripped tags, attributes, classes (custom- prefix and characters), ids, style attributes, embeds/iframes, what is verified live vs from source code vs unknown; markup patterns that work as hooks for CSS.' },
  { file: '06-cascade-and-specificity.md', title: 'Cascade, specificity and @import behavior', areas: ['cascade'], brief: 'How to win against theme rules, ties with imported rules, @layer pitfalls (layered loses to unlayered — Tailwind v4), !important, @import placement and MIME, relative URLs resolution, @property/@keyframes across sheets.' },
  { file: '07-techniques-and-support.md', title: 'JS-free techniques and browser support', areas: ['techniques','browser-support'], brief: 'Catalog of no-JS techniques useful on itch (animations, hover/focus states, scroll-driven, view transitions, container/style queries, :has, generated content, SVG data URIs, per-visit randomness through an external service) with current support tables and @supports fallbacks.' },
  { file: '08-external-css.md', title: 'External CSS: fonts, frameworks and dynamic services', areas: ['external-import'], brief: 'Requirements for @import from other origins (HTTPS, text/css, caching, CORS for fonts), performance, blockers (Brave etc.), privacy/GDPR, free hosting limits, Google Fonts usage, and how frameworks (Bootstrap/Tailwind/animation libs) must be adapted (scope, custom- renaming, no resets, layers).' },
  { file: '09-gotchas.md', title: 'Gotchas (symptom → cause → fix)', areas: ['gotchas'], brief: 'Numbered list of traps, each with symptom, cause, fix and evidence. Pull relevant gotchas from ALL facts, not only area=gotchas (you receive all facts for this section).' },
  { file: '10-testing-and-a11y.md', title: 'Testing and accessibility checklist', areas: ['testing-a11y'], brief: 'A pre-ship checklist (logged out, mobile widths/breakpoints, touch/no hover, reduced motion, forced colors, contrast with theme colors, focus, one h1, screen readers & generated content, blockers, Safari/Firefox), and how to build a local preview harness.' },
]

const SECTION_RESULT = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    factIdsUsed: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' }, description: 'contradictions between facts and how you resolved them' },
    gaps: { type: 'array', items: { type: 'string' }, description: 'important things this section should say but evidence is missing or weak' },
  },
  required: ['file','gaps'],
}

const STYLE = `
WRITING STYLE for the knowledge base (audience: AI assistants and developers; English):
- Dense, precise, scannable. Markdown headings, short paragraphs, tables, code blocks with real selectors.
- Every non-obvious statement carries an inline confidence tag and evidence id, e.g. "… **[verified 2026-10-12 · repo-07]**", "[documented · docs-03]", "[community · community-12]", "[unverified]". Use the fact ids you were given.
- Prefer rules phrased as instructions: "Do X", "Never Y", with the reason and the symptom if ignored.
- Never present community or unverified claims as facts. Contradictions: state both and what is known.
- No personal data, no third-party CSS copied; short original examples only.`

phase('Write')
const sectionResults = await parallel(SECTIONS.map(s => () => {
  const facts = s.file === '09-gotchas.md' ? allFacts : allFacts.filter(f => s.areas.includes(f.area))
  return agent(`${COMMON}\n${STYLE}\n
You write ONE section of the knowledge base: "${s.title}". Write it to ${REPO}\\knowledge\\sections\\${s.file} (create folders). Scope: ${s.brief}
Use ONLY the verified facts below (refuted facts were already removed; each has confidence + verifiedBy). You may read the evidence files in ${REPO}\\knowledge\\evidence\\ and the test pages in ${REPO}\\knowledge\\tests\\ for more detail, and do small extra checks (curl, docs) to resolve contradictions — record any new evidence you rely on in a short "Section notes" at the end of your section file. Start the file with "## ${s.title}".
Return the file path, the fact ids you used, conflicts you resolved, and gaps (missing or weak evidence for things the section should cover).

FACTS (${facts.length}):
${JSON.stringify(facts, null, 1)}`, { label: `write:${s.file}`, phase: 'Write', schema: SECTION_RESULT })
}))

// ---------------- Critique ----------------
phase('Critique')
const CRITIC_SCHEMA = {
  type: 'object',
  properties: {
    gaps: { type: 'array', items: { type: 'object', properties: {
      section: { type: 'string', description: 'section file name' },
      issue: { type: 'string' },
      kind: { type: 'string', enum: ['missing-topic','weak-evidence','contradiction','overclaim','unclear-for-ai','outdated'] },
      howToResolve: { type: 'string' },
    }, required: ['section','issue','kind','howToResolve'] } },
  },
  required: ['gaps'],
}
const writerGaps = sectionResults.filter(Boolean).map(r => ({ file: r.file, gaps: r.gaps, conflicts: r.conflicts || [] }))
const critique = await agent(`${COMMON}\n${STYLE}\n
You are the COMPLETENESS CRITIC. Read every section in ${REPO}\\knowledge\\sections\\ and the evidence files in ${REPO}\\knowledge\\evidence\\. Imagine an AI assistant asked to: restyle a profile, a game page, a devlog and a jam page; add web fonts; animate things without JS; integrate Tailwind/Bootstrap/Animate.css; serve per-visit dynamic CSS from an external service; keep accessibility; stay under the character cap. What would it still get wrong or not know? What is asserted without adequate evidence, contradicts another section, or looks outdated?
Writers' own reported gaps/conflicts: ${JSON.stringify(writerGaps, null, 1)}
Return a prioritized list of gaps (max 30), each tied to a section file and with a concrete way to resolve it (which test/source).`, { label: 'critic', phase: 'Critique', schema: CRITIC_SCHEMA })

// ---------------- Fill gaps (one agent per affected section) ----------------
phase('Fill')
const gapsBySection = {}
for (const g of (critique && critique.gaps) || []) {
  const k = SECTIONS.find(s => g.section.includes(s.file.replace('.md', ''))) ? SECTIONS.find(s => g.section.includes(s.file.replace('.md', ''))).file : g.section
  ;(gapsBySection[k] = gapsBySection[k] || []).push(g)
}
const FILL_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    resolved: { type: 'array', items: { type: 'string' } },
    unresolved: { type: 'array', items: QUESTION_ITEM },
  },
  required: ['file','resolved','unresolved'],
}
const fills = await parallel(Object.entries(gapsBySection).map(([file, gaps]) => () =>
  agent(`${COMMON}\n${STYLE}\n
You FILL GAPS in one section file: ${REPO}\\knowledge\\sections\\${file}. For each gap below, do the research/test needed (curl live pages, fetch docs/source, read evidence files; do NOT use browser tools), then edit the section file in place: add or correct content with confidence tags; if a claim is overclaimed, downgrade it; if a gap cannot be resolved without saving content on an itch account, record it as unresolved with a precise probe (needsAccount=true). Append new evidence to ${REPO}\\knowledge\\evidence\\gapfill.md (create if missing; other agents may append too — append, don't overwrite).
GAPS:
${JSON.stringify(gaps, null, 1)}`, { label: `fill:${file}`, phase: 'Fill', schema: FILL_SCHEMA })
))
const unresolved = fills.filter(Boolean).flatMap(f => f.unresolved || [])
log(`gap fill: ${fills.filter(Boolean).reduce((n, f) => n + f.resolved.length, 0)} resolved, ${unresolved.length} unresolved`)

// ---------------- Probe kit ----------------
phase('Probes')
const accountQuestions = [...allQuestions, ...unresolved]
const PROBE_SCHEMA = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    probes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, question: { type: 'string' }, where: { type: 'string' } }, required: ['id','question','where'] } },
  },
  required: ['files','probes'],
}
const probes = await agent(`${COMMON}\n
You design the LIVE PROBE KIT: tests that can only be settled by saving content on an itch.io account. The repo owner will run them on a DRAFT (unpublished) project page — or temporarily on their profile — and then we read the result. Create in ${REPO}\\knowledge\\probes\\:
- README.md: step-by-step instructions (in English, short), where to paste each file (project description HTML editor, custom CSS editor, theme editor settings to note), how to collect results (save the rendered page HTML, or run check.js in DevTools console and copy its JSON output), and a table probe-id → question → expected outcomes.
- probe-description.html: one HTML payload for the description/bio exercising every open sanitizer question (tags, attributes, id, style attribute, data-*, aria-*, role, classes with special characters like custom-hover:x and custom-w-[3px], custom- vs non-custom classes, details/summary, svg inline, iframe embeds of allowed/disallowed hosts, input/label (checkbox hack), button popovertarget/popover, a name/id anchors for :target, picture/source, video/audio, table, entities, unicode). Each probe element carries a custom-probe-<id> class or a visible marker text so survival can be checked.
- probe.css: one CSS payload for the custom CSS editor exercising open CSS questions (exact character cap: a filler technique to find the precise limit; at-rules @import non-Google / @font-face / @layer / @property / @container / @scope / @view-transition / nesting / !important / comments / non-ASCII / escapes / '>' '<' '&' characters / '</style>' in a comment / url(data:) / url(javascript:) / expression()). Each probe sets a distinct custom property or visible style on #wrapper so check.js can detect if it survived. Keep it under the cap except the dedicated cap test, which must be a SEPARATE file probe-cap.md describing a binary-search procedure.
- check.js: a DevTools console snippet (the owner runs it on the saved draft page, logged in) that reads style#custom_css text, the description DOM, and computed styles, and prints a JSON report of every probe's outcome.
- results-template.md for recording outcomes.
Open questions gathered so far (dedupe them; prioritize needsAccount=true ones, but include any that the probes can settle):
${JSON.stringify(accountQuestions, null, 1)}`, { label: 'probe-kit', phase: 'Probes', schema: PROBE_SCHEMA })

// ---------------- Assemble ----------------
phase('Assemble')
const ASSEMBLE_SCHEMA = {
  type: 'object',
  properties: {
    mainFile: { type: 'string' },
    llmsTxt: { type: 'string' },
    sizeChars: { type: 'number' },
    notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['mainFile','llmsTxt'],
}
const assembled = await agent(`${COMMON}\n${STYLE}\n
ASSEMBLE the final knowledge base.
1. Read all section files in ${REPO}\\knowledge\\sections\\ (01…10), the evidence files and the probe kit in ${REPO}\\knowledge\\probes\\.
2. Write ${REPO}\\knowledge\\itch-custom-css.md:
   - Title "itch.io Custom CSS — Knowledge Base for AI assistants", a blockquote summary, "Last verified: ${TODAY}", a confidence legend, and how to use the file.
   - "## 0. The rules an AI must never break" — the 15–25 most important rules (one line each, with fact ids).
   - Then sections 1–10 (from the section files; you may lightly edit for consistency, remove duplication, fix cross-references, unify terminology; keep confidence tags and fact ids).
   - "## 11. Open questions and live probes" — what is still unknown, pointing to knowledge/probes/.
   - "## Appendix: Evidence index" — fact id prefix → evidence file (knowledge/evidence/*.md) and test pages (knowledge/tests/).
   Make sure nothing contradicts across sections; resolve or flag.
3. Write ${REPO}\\llms.txt following the llms.txt convention (H1 project name "itch-live-css", blockquote summary, short notes, then "## Docs" with links: knowledge/itch-custom-css.md, sections, probes, evidence) — relative links.
4. Keep the knowledge/sections/ files in sync with any edits you made (or note they're the source and the main file is assembled).
Return paths and the main file size in characters.`, { label: 'assemble', phase: 'Assemble', schema: ASSEMBLE_SCHEMA })

// ---------------- Adversarial review of the final file ----------------
phase('Review')
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    fixed: { type: 'array', items: { type: 'string' } },
    remainingConcerns: { type: 'array', items: { type: 'string' } },
  },
  required: ['fixed','remainingConcerns'],
}
const LENSES = [
  { key: 'accuracy', text: 'ACCURACY lens: pick the 25 most consequential claims (rules, selectors, limits, cascade behaviors, support data) and re-check each against its evidence file or primary source (curl live itch pages, docs). Fix wrong or overclaimed statements in place (main file AND the matching section file).' },
  { key: 'usability', text: 'AI-USABILITY lens: act as an AI that must write itch CSS for 6 tasks (restyle profile, game page with embedded HTML5 game, devlog, jam page with entries grid, add Google Font + Tailwind utilities, per-visit dynamic CSS via external @import). Using ONLY the file, draft the CSS mentally and note where the file is ambiguous, missing a selector, or misleading. Fix the file in place (main file AND the matching section file) where evidence exists; otherwise add the question to section 11.' },
]
const reviews = await parallel(LENSES.map(l => () => agent(`${COMMON}\n${STYLE}\n
You are an adversarial reviewer of ${REPO}\\knowledge\\itch-custom-css.md (and its section files in ${REPO}\\knowledge\\sections\\). ${l.text}
The other reviewer works in parallel with a different lens on the same files: make small, targeted edits (Edit tool with exact strings), re-read before editing, never rewrite whole files.`, { label: `review:${l.key}`, phase: 'Review', schema: REVIEW_SCHEMA })))

return {
  dimensions: dims.map(d => ({ key: d.dimension, ...d.stats, facts: d.facts.length })),
  missingDimensions: missing,
  totalFacts: allFacts.length,
  confidence: allFacts.reduce((m, f) => { m[f.confidence] = (m[f.confidence] || 0) + 1; return m }, {}),
  openQuestions: allQuestions.length,
  sections: sectionResults.filter(Boolean).map(s => s.file),
  critiqueGaps: ((critique && critique.gaps) || []).length,
  unresolvedAfterFill: unresolved.length,
  probes,
  assembled,
  reviews,
}
