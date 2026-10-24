# CLAUDE.md

Guidance for Claude Code in this repository.

## What this project is

**itch-live-css**: knowledge and tooling for customizing itch.io pages (profile, project/game, devlog, jam) with custom CSS, for creators who code and for those who don't. Planned layers (full plan in `ROADMAP.md`, in Spanish):

1. An AI-ready **knowledge base** on itch custom CSS (`knowledge/`). **Done** 2026-10-14; checked with live probes on 2026-10-16 (only jam fields still open).
2. An open-source **engine** (npm): config → CSS, plugins with option schemas, a validator whose rules map to the knowledge base's R1–R24, two outputs (pasted / served).
3. A public **hosted service** that serves per-visit CSS through `@import` (profile and project only; `@import` never loads on jams).
4. A **web configurator**: forms generated from plugin schemas, mock previews per page type, exports per page type.
5. **Framework adapters** (Tailwind v3.4, Bootstrap's CSS, Animate.css) and **AI integration** (llms.txt, an MCP server, a bring-your-own-key assistant in the configurator).

**Status (2026-10-16): phase 0.** Live probe Runs 1 (draft project), 2 (profile), 3 (devlog post; the jam part is not done) and 4 (size caps, without the jam part) are done; their results are in `knowledge/evidence/live-probes/` and the knowledge base is retagged. Nothing is published. A local git repo exists (branch `main`, first commit 2026-10-16) with no remote yet: commit or push only when the owner asks. The current next step and the open tasks are in `HANDOFF.md` (local, git-ignored). Read it first when it exists.

## Origin: the owner's private repo

The project grew out of the owner's private repo `itch-io-custom-css` (sibling folder `../itch-io-custom-css`, private on GitHub as `mirokshi/itch-io-custom-css`). That repo holds:

- The live profile `https://mirokshi.itch.io/`, styled by `src/main.css` (pasted into itch).
- A Vercel service `custom-css/` (`https://itch-io-custom-css-custom-css.vercel.app/live.css`, imported by the profile) that generates per-visit CSS:
  - a letter-mix title (`lib/title.js`);
  - a greeting roller driven by a bio marker (`lib/greeting.js`);
  - sticker-tilted game cards with view/download stats and badges from the itch API (`lib/cards.js`, `lib/itch.js`; the API key lives only in Vercel's env vars).

  A star field (`stars.js`) existed from 2026-10-12 to 2026-10-16 and was removed at the owner's request.

These effects are the first example plugins. Treat that repo as **read-only** from here. Its `.claude/CLAUDE.md` has detailed, live-verified notes, and the knowledge base's `repo-*` facts come from it. The owner agreed (2026-10-16) to publish its identifiers (profile, service URL, notes) as evidence.

## Layout

```
ROADMAP.md                   product plan (Spanish): findings H1–H16, principles, phases 0–6, risks, decisions
llms.txt                     llms.txt index for AIs
llms-full.txt                GENERATED: main file + all sections (rebuild after edits, see below)
knowledge/
  itch-custom-css.md         MAIN FILE (~78 KB): rules R1–R24, copy-exact blocks B1–B4, §1–§10 digests,
                             §11 open questions, evidence index, known inconsistencies
  sections/01…10-*.md        detailed sections (~865 KB in total); 03, 05, 06 and 08 use CRLF, the rest LF
  evidence/<dimension>.md    reproducible evidence logs, plus *-tools/ scripts (Python/Node, headless Chrome via CDP)
  evidence/live-probes/      results of live probe runs, 2026-10-16: Run 1 (project), 2 (profile), 3 (devlog), 4 (caps); JSON reports + results-*.md
  tests/                     18 self-checking local browser tests (_lib/ = synthetic itch stand-in, not itch's CSS)
  probes/                    live probe kit: README, probe-description.html, probe-bio.html, probe.css,
                             probe-cap.md, check.js, results-template.md, build.py
  method/                    how the knowledge base was built: research-workflow.js and finish-workflow.js
                             (Claude Code Workflow scripts, parameterised by args), open-questions.json (237 questions)
engine/                      phase 1, started 2026-10-24: render() (served) and paste() (pasted) from a config, seeded rng,
                             plugins/ (title, greeting, cards, ascii: the owner's 4 effects, ported 1:1 from the private repo),
                             importLine() and measure() (src/output.js), validate() (src/validate.js: R2, R3, R7–R12, R14–R16, R23 so far),
                             CLI bin/cli.js measure|validate; tests: cd engine && npm test
.claude/launch.json          preview servers: knowledge-tests (8090) and knowledge-tests-xorigin (8091)
```

## Knowledge-base conventions

- Written in English, for AI assistants and developers.
- **Confidence tags.** Every non-obvious claim carries `[confidence · fact-id]`. The levels are verified, verified (live render), verified (script-free harness), documented, observed, community, library model, inferred and unverified.
  - **Never upgrade a tag without a new direct check.** When two tags disagree, use the weaker one.
  - Live-probe results are tagged `[verified <date> · live-<id>]` (e.g. `live-k07`, `live-cap-A2a`), and only for the page type and field that was tested.
- **Main file and sections.** The main file is a digest; the sections hold the detail. When a fact changes, edit **both**. The main file's Appendix lists the known inconsistencies in the sections; where the two disagree, the main file wins.
- **After editing either, rebuild `llms-full.txt`** from the project root:

  ```bash
  { head -7 llms-full.txt; for f in knowledge/itch-custom-css.md knowledge/sections/*.md; do printf '\n---\n<!-- file: %s -->\n\n' "$f"; tr -d '\r' < "$f"; done; } > llms-full.tmp && mv llms-full.tmp llms-full.txt
  ```

  Then update the main file's size in `llms.txt` (~78,600 characters on 2026-10-16, after Runs 1–4 and the pseudonyms).
- **Publication hygiene.** This folder will become a public repo.
  - Never store third-party content verbatim: other creators' CSS/HTML, itch's own stylesheets or page exports, cloned code. Raw downloads go to a temp/scratch folder; only analysis, statistics and short original snippets belong here.
  - No personal data, tokens, csrf values or cookies.
  - **Small creators are pseudonymized** (decided and done 2026-10-16): subdomains as `creator-NN` (`crawlprofile.md` uses 01–37; every other file 38–113, one number per creator), their games as `game-NN`, devlog links as `devlog/<id>/<post>`. The private mapping is `raw/pseudonyms-2026-10-16.json` (git-ignored); new names get the next free number and go into it.
  - May be named: itch staff, the owner's pages, jams, well-known studios and tools (the list is the `KEEP` set recorded in the mapping file), and authors cited as sources for itch-CSS guides, themes or tools (e.g. nnda, speakthesky, narehop, gourangadas, hamgarian, comigo, gamesprinter, and their GitHub repos).
- **Licenses** (added 2026-10-16): `LICENSE` (**MIT**, code anywhere, `knowledge/` included), `knowledge/LICENSE` (official **CC BY 4.0** text, for the knowledge-base content), `THIRD_PARTY_NOTICES.md` (`web_sanitize` test vectors, itch.io names). `README.md` says which files fall under which. Repo docs are in English; `ROADMAP.md` stays in Spanish.
- `.gitattributes` sets `* -text`: git never converts line endings, so the CRLF section files and the probe kit stay byte-exact.
- **Crawling itch.io:**
  - Honour robots.txt (Disallow `/embed/`, `/embed-upload/`, `/search`, `/checkout/`, `/game/download/`, `/bundle/download/`, `/register-for-purchase/`, `/email-feedback/`).
  - GET only, at most 1 request per second; never log in or submit anything.
  - Anything that needs an itch account (saving a bio, CSS or theme) is done **by the owner**, never by Claude. Prepare the payload and step-by-step instructions instead.

## Local tests and live probes

- **Local tests.** `preview_start {name:"knowledge-tests"}` → http://localhost:8090/knowledge/tests/index.html. `knowledge-tests-xorigin` serves the same folder on port 8091 to emulate a third-party `@import`.
- **Preview caveats:**
  - The preview browser caches Python's server: call `fetch(url,{cache:'reload'})` before navigating again.
  - `read_page`/`find` include `visibility:hidden` text and ignore `::before`/`::after`. For screen-reader questions use the CDP accessibility tree.
- **Evidence tools** drive headless Chrome over CDP with throwaway profiles under `**/tests/prof/` (git-ignored), never the owner's real Chrome profile.
- **Live probes:** see `knowledge/probes/README.md`.
  - `check.js` is read-only: one same-origin GET of the page itself, plus downloads only when `probeKit.saveJson()` or `probeKit.saveRaw()` is called.
  - Results go to `knowledge/evidence/live-probes/`: the JSON report and a filled-in `results-template.md`.
  - **Never commit** the `saveRaw()` HTML or a network capture: they are logged-in pages.
  - After editing a payload, run `python -I knowledge/probes/build.py`.

## Product facts to design around

From the knowledge base; details in ROADMAP §1.

- **Jams:** `@import` never loads there (the CSS sits inside `style#jam_theme`), so the per-visit service can't work on jams. Jam CSS of up to 20,410 characters is known to save.
- **Size caps (measured 2026-10-16):** profile CSS ≤ **5,120 UTF-8 bytes** (the error message says characters), comments included, edge whitespace not; over it the save is refused, not truncated. Projects and devlogs have **no CSS cap** (659,742 characters saved; bigger saves fail as a request, "missing token"). Bio ≤ 5,000 characters of submitted HTML. Jam cap still unmeasured (20,410 known to save).
- **`@import` blocks rendering.** A hanging host blanked a page for more than 330 s. So the pasted CSS must carry the full look, and the service must answer from memory.
- **Native `random()`:** Safari 26.2+; announced for Chrome 156 on 2026-10-20. Re-check after 2026-10-28, together with scroll-driven animations in Firefox 159.
- **Sanitizer:** a class survives only if it starts with lowercase `custom`; whatever follows is kept, so `custom-w-1/2`, `custom-w-[3px]` and `custom:md:flex` survive, while `md:custom-…`, `!custom-…` and `-custom-…` are dropped (verified on a project description, a bio and a devlog post, 2026-10-16). Iframes become click-to-activate placeholders only in project descriptions; bios and devlog posts keep them live. `id`, `data-*`, `aria-*` and `role` are stripped.
- **Saved CSS as served (project and profile, 2026-10-16):** itch deletes every `</style>` (any case, `</STYLE >` too) and trims leading and trailing whitespace; everything else is served as pasted. Whether this happens at save or at render is unknown. Profiles store LF, projects CRLF.
- **Logged-out cache:** after a save, visitors keep the old page for about 2.5 minutes (`X-Cache-Status: HIT`, then `EXPIRED`); the owner always sees the new one (`BYPASS`). A `data:` `@import` applies, so CSS can be split without a host.
- **Cascade and naming:**
  - Layered rules always lose to itch's unlayered rules.
  - Prefix every `@keyframes` name with `custom-`.
  - Ad-block lists hide `custom-ad*`, `custom-social`, `custom-share*` and `custom-cookie*`.

## Gotchas

- The Edit/Write tools decode `\uXXXX` escapes in the text you pass into real (often invisible) characters. To write a literal escape, go through Python with `chr(92)`.
- Never round-trip non-ASCII files through PowerShell 5.1's `Get-Content`/`Set-Content` without `-Encoding utf8`.
- Some section files are CRLF; keep their line endings when editing.
- **Workflow resume:** on 2026-10-14, resuming a big Workflow re-ran agents that had already finished. The pipeline's call order differed between runs, so the cached prefix broke early. After a partial failure, write a new script for the remaining steps instead, feeding it the finished results read from the old run's `journal.jsonl`.
