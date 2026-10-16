export const meta = {
  name: 'itch-css-knowledge-finish',
  description: 'Finish the itch CSS knowledge base: remaining gap fills, probe kit, condensed main guide, llms.txt, reviews',
  phases: [
    { title: 'Fill+Digest', detail: 'fill remaining gaps (04, 10) and condense each section' },
    { title: 'Probes', detail: 'live probe kit for account-only questions' },
    { title: 'Assemble', detail: 'condensed itch-custom-css.md + llms.txt + llms-full.txt' },
    { title: 'Review', detail: 'accuracy, AI-usability and hygiene reviews' },
  ],
}

const A = args
const REPO = A.repo, OLD = A.oldRepo, KB = A.kb, TODAY = A.today

const COMMON = `
CONTEXT: We are finishing a PUBLIC knowledge base ("knowledge for AIs") about authoring custom CSS for itch.io pages (profile, project/game, devlog, jam). Audience: AI assistants and developers. English. Today is ${TODAY}.
- Project folder (write here): ${REPO}. Detailed, already-verified section files: ${REPO}\\knowledge\\sections\\01…10 (large). Evidence logs: ${REPO}\\knowledge\\evidence\\*.md. Reproducible local test pages: ${REPO}\\knowledge\\tests\\.
- Private source repo (READ ONLY): ${OLD}.
- Scratchpad: ${KB}.
- Confidence tags used in the sections: [verified DATE · id], [documented · id], [observed · id], [community · id], [inferred · id], [unverified]. Keep them; never upgrade confidence without a new direct check.
- itch.io etiquette if you check live pages: honor robots.txt, GET only via curl, ≤1 req/s, never log in or submit anything. Do NOT use any browser tools (mcp__Claude_Browser__*, mcp__claude-in-chrome__*).
- Never copy third-party content (other creators' CSS/HTML, itch's own stylesheets) verbatim into ${REPO}; short original snippets only. No personal data.`

const SECTIONS = [
  { file: '01-how-it-works.md', title: 'How custom CSS works on itch.io' },
  { file: '02-rules-and-policy.md', title: 'Hard rules and policy' },
  { file: '03-page-anatomy.md', title: 'Page anatomy (profile, project, devlog, jam)' },
  { file: '04-theme-editor-and-itch-css.md', title: "Theme editor and itch's own stylesheets" },
  { file: '05-html-in-descriptions.md', title: 'HTML in bios and descriptions (sanitizer)' },
  { file: '06-cascade-and-specificity.md', title: 'Cascade, specificity and @import behavior' },
  { file: '07-techniques-and-support.md', title: 'JS-free techniques and browser support' },
  { file: '08-external-css.md', title: 'External CSS: fonts, frameworks and dynamic services' },
  { file: '09-gotchas.md', title: 'Gotchas (symptom → cause → fix)' },
  { file: '10-testing-and-a11y.md', title: 'Testing and accessibility checklist' },
]
const NEEDS_FILL = ['04-theme-editor-and-itch-css.md', '10-testing-and-a11y.md']

const QUESTION_ITEM = {
  type: 'object',
  properties: { question: { type: 'string' }, whyItMatters: { type: 'string' }, howToTest: { type: 'string' }, needsAccount: { type: 'boolean' } },
  required: ['question', 'howToTest', 'needsAccount'],
}
const FILL_SCHEMA = {
  type: 'object',
  properties: { file: { type: 'string' }, resolved: { type: 'array', items: { type: 'string' } }, unresolved: { type: 'array', items: QUESTION_ITEM } },
  required: ['file', 'resolved', 'unresolved'],
}
const DIGEST_SCHEMA = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    digestPath: { type: 'string' },
    digestChars: { type: 'number' },
    topRules: { type: 'array', items: { type: 'string' }, description: 'the 3-6 most important must-never-break rules from this section, one line each with fact ids' },
    internalContradictions: { type: 'array', items: { type: 'string' } },
  },
  required: ['file', 'digestPath', 'topRules'],
}

const digestPrompt = s => `${COMMON}
CONDENSE one section. Read ${REPO}\\knowledge\\sections\\${s.file} ("${s.title}") completely. Write a DIGEST to ${KB}\\digests\\${s.file} of at most 6,000 characters that an AI assistant can rely on: the essential rules, exact selectors/values/code it needs most often, the key numbers, and the most important gotchas — each with its confidence tag and fact id copied from the section. Drop narrative, duplicates, low-value detail and long evidence discussion (the full section stays available and will be linked). Start the digest with "## ${s.title}" and end it with a line "Full detail: [sections/${s.file}](sections/${s.file})". Never introduce claims that are not in the section. Report contradictions you notice inside the section.`

phase('Fill+Digest')
const pipelineP = pipeline(SECTIONS, async (s) => {
  let fill = null
  if (NEEDS_FILL.includes(s.file)) {
    fill = await agent(`${COMMON}
You FILL GAPS in one section file: ${REPO}\\knowledge\\sections\\${s.file}. Read ${KB}\\remaining-gaps.json and handle ONLY the gaps whose "section" is ${s.file}. A previous attempt may have partially edited the section — re-read it first and don't duplicate content. For each gap do the research/test needed (curl live pages, fetch docs/source, read evidence files), then edit the section file in place: add or correct content with confidence tags; downgrade overclaims; if a gap can only be resolved by saving content on an itch account, record it as unresolved with a precise probe (needsAccount=true). Append new evidence to ${REPO}\\knowledge\\evidence\\gapfill.md (append, don't overwrite).`, { label: `fill:${s.file}`, phase: 'Fill+Digest', schema: FILL_SCHEMA })
  }
  const digest = await agent(digestPrompt(s), { label: `digest:${s.file}`, phase: 'Fill+Digest', schema: DIGEST_SCHEMA })
  return { s, fill, digest }
})

const PROBE_SCHEMA = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    probes: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, question: { type: 'string' }, where: { type: 'string' } }, required: ['id', 'question', 'where'] } },
  },
  required: ['files', 'probes'],
}
const probeP = agent(`${COMMON}
You design the LIVE PROBE KIT: tests that can only be settled by saving content on an itch.io account. The repo owner will run them on a DRAFT (unpublished) project page — or temporarily on their profile — and then we read the result. Input: ${KB}\\open-questions.json (≈237 questions gathered by research/verify/gap-fill agents; ~115 need an account) — dedupe and prioritize them; also skim ${REPO}\\knowledge\\sections\\05-html-in-descriptions.md and 01-how-it-works.md for their open questions. Create in ${REPO}\\knowledge\\probes\\:
- README.md: short step-by-step instructions: where to paste each file (project description HTML mode, custom CSS editor; profile bio if needed), what theme-editor settings to note, how to collect results (run check.js in the DevTools console on the saved page and copy its JSON; also save the page HTML), and a table probe-id → question → possible outcomes → what each outcome means for the knowledge base.
- probe-description.html: one HTML payload for the description/bio exercising every open sanitizer question (tags, attributes, id, style attribute, data-*, aria-*, role, classes with special characters like custom-hover:x and custom-w-[3px], custom- vs non-custom classes, details/summary (name attr), svg inline, iframe embeds of allowed/disallowed hosts, input/label (checkbox hack), button popovertarget/popover, anchors/ids for :target, picture/source, video/audio, table, entities, unicode, etc.). Every probe element carries a custom-probe-<id> class AND a visible marker text so survival can be checked even if classes are stripped.
- probe.css: one CSS payload for the custom CSS editor exercising open CSS questions (@import non-Google, @font-face, @layer, @property, @container, @scope, @view-transition, nesting, !important, comments, non-ASCII, escapes, '>' '<' '&' characters, '</style>' inside a comment, url(data:), url(javascript:), expression(), etc.). Each probe sets a distinct custom property on #wrapper (e.g. --probe-c07: 1) or a visible style so check.js can detect survival. Keep it well under 5,000 characters.
- probe-cap.md: a binary-search procedure (with a generator snippet) to find the editor's exact character cap and whether it counts characters or bytes and what happens when exceeded (truncation vs refusal).
- check.js: a DevTools console snippet that reads style#custom_css text, the description DOM and computed styles, and prints a JSON report of every probe's outcome (survived / stripped / rewritten, with details).
- results-template.md for recording outcomes, with the date and the page type used.
Return the files and the probe list.`, { label: 'probe-kit', phase: 'Probes', schema: PROBE_SCHEMA })

const [sectionResults, probes] = await Promise.all([pipelineP, probeP])
const done = sectionResults.filter(Boolean)
const topRules = done.flatMap(r => (r.digest && r.digest.topRules ? r.digest.topRules.map(t => `${r.s.file}: ${t}`) : []))
const contradictions = done.flatMap(r => (r.digest && r.digest.internalContradictions) || [])
const unresolved = done.flatMap(r => (r.fill && r.fill.unresolved) || [])
const missingDigests = SECTIONS.filter(s => !done.find(r => r.s.file === s.file && r.digest)).map(s => s.file)
if (missingDigests.length) log(`WARNING: no digest for ${missingDigests.join(', ')}`)

phase('Assemble')
const ASSEMBLE_SCHEMA = {
  type: 'object',
  properties: { mainFile: { type: 'string' }, mainChars: { type: 'number' }, llmsTxt: { type: 'string' }, llmsFull: { type: 'string' }, notes: { type: 'array', items: { type: 'string' } } },
  required: ['mainFile', 'llmsTxt'],
}
const assembled = await agent(`${COMMON}
ASSEMBLE the final knowledge base. The detailed sections are ~700 KB in total — too big to load into an AI's context — so the main file must be a CONDENSED guide that links to the sections.
Inputs: digests in ${KB}\\digests\\*.md (one per section${missingDigests.length ? '; missing: ' + missingDigests.join(', ') + ' — condense those sections yourself' : ''}), the full sections in ${REPO}\\knowledge\\sections\\, the probe kit in ${REPO}\\knowledge\\probes\\ (if present), evidence in ${REPO}\\knowledge\\evidence\\.
Candidate top rules proposed by the digest writers:
${JSON.stringify(topRules, null, 1)}
Contradictions reported inside sections (resolve by checking the section/evidence, or flag):
${JSON.stringify(contradictions, null, 1)}
Unresolved questions from the last gap fills: ${JSON.stringify(unresolved, null, 1)}

1. Write ${REPO}\\knowledge\\itch-custom-css.md, at most ~60,000 characters:
   - "# itch.io Custom CSS — Knowledge Base for AI assistants", a blockquote summary, "Last verified: ${TODAY}", a confidence legend, "How to use this file" (load this file; open a section file only when you need its detail).
   - "## 0. Rules an AI must never break" — 15–25 one-line rules with fact ids, deduplicated from the candidates above.
   - "## 1." … "## 10." from the digests (consistent terminology, no duplication across sections, cross-references fixed; keep confidence tags and fact ids; each ends with its "Full detail:" link).
   - "## 11. Open questions and live probes" — the most important unknowns, pointing to probes/ (relative links).
   - "## Appendix: Evidence index" — fact id prefix → evidence file (evidence/*.md) and local test pages (tests/).
   Links must be relative to the knowledge/ folder.
2. Write ${REPO}\\llms.txt (llms.txt convention: "# itch-live-css", blockquote summary, a few notes, "## Docs" with links to knowledge/itch-custom-css.md and llms-full.txt, "## Sections" listing each section file with a one-line description, "## Optional" with probes/, evidence/, tests/).
3. Create ${REPO}\\llms-full.txt by concatenating, with Bash, a short header + knowledge/itch-custom-css.md + every section file in order (separated by a line "---" and a comment naming the file). Report its size.
Return paths and sizes.`, { label: 'assemble', phase: 'Assemble', schema: ASSEMBLE_SCHEMA })

phase('Review')
const REVIEW_SCHEMA = {
  type: 'object',
  properties: { fixed: { type: 'array', items: { type: 'string' } }, remainingConcerns: { type: 'array', items: { type: 'string' } } },
  required: ['fixed', 'remainingConcerns'],
}
const LENSES = [
  { key: 'accuracy', text: `ACCURACY lens on ${REPO}\\knowledge\\itch-custom-css.md: pick the 30 most consequential claims (rules, selectors, limits, cascade behaviors, sanitizer behavior, support data) and re-check each against its section, its evidence file or a primary source (curl live itch pages, docs). Fix wrong or overclaimed statements in place in the main file AND in the matching section file. Also check that every relative link in the main file and in llms.txt resolves to an existing file.` },
  { key: 'usability', text: `AI-USABILITY lens on ${REPO}\\knowledge\\itch-custom-css.md: act as an AI that must write itch CSS for 6 tasks (restyle a profile; a game page with an embedded HTML5 game; a devlog; a jam page with its entries grid; add a Google Font + Tailwind-style utilities; per-visit dynamic CSS via an external @import service). Using ONLY the main file (open a section only where the main file tells you to), draft the CSS and note where the file is ambiguous, missing a selector, or misleading. Fix the main file in place where the sections/evidence support it; otherwise add the question to section 11.` },
  { key: 'hygiene', text: `PUBLICATION HYGIENE lens on the whole ${REPO} folder (it will become a public GitHub repo): find (a) third-party content copied verbatim (other creators' CSS/HTML, itch's own stylesheets or page exports, cloned third-party source code, large downloaded files) — move such files OUT of ${REPO} into ${KB}\\moved-out\\ (keep relative paths) and fix references to them; check licenses of anything third-party that remains (keep only if clearly permitted and attributed); (b) personal data (emails, usernames beyond well-known public pages needed as evidence, IPs, tokens/keys/cookies, csrf tokens) — redact; (c) junk (temp files, huge tool outputs) — move out. Do not delete anything: move it. List every change.` },
]
const reviews = await parallel(LENSES.map(l => () => agent(`${COMMON}
You are an adversarial reviewer. ${l.text}
Other reviewers work in parallel with different lenses on the same files: make small, targeted edits (Edit tool with exact strings), re-read before editing, never rewrite whole files.`, { label: `review:${l.key}`, phase: 'Review', schema: REVIEW_SCHEMA })))

return {
  fills: done.filter(r => r.fill).map(r => ({ file: r.s.file, resolved: r.fill.resolved.length, unresolved: r.fill.unresolved.length })),
  digests: done.map(r => r.digest && { file: r.digest.file, chars: r.digest.digestChars }),
  missingDigests,
  probes: probes && { files: probes.files, count: probes.probes.length },
  assembled,
  reviews: LENSES.map((l, i) => ({ lens: l.key, ...(reviews[i] || { failed: true }) })),
}
