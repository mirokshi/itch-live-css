# itch-live-css

A knowledge base, for AI assistants and developers, on styling [itch.io](https://itch.io) pages with custom CSS: profiles, projects (game pages), devlogs and jams. It covers what itch does with your CSS and HTML, which selectors are stable, what the policies forbid, the size limits, and how to keep a styled page accessible.

Every non-obvious claim carries a confidence tag and a fact id that leads to its evidence, for example `[verified 2026-10-16 · live-k07]`. The research combined logged-out checks of live pages, local browser tests, live renders with itch's own JavaScript, and live probes run on the maintainer's account.

`itch-live-css` is a working name.

## Status

**Phase 0: the knowledge base.**
- Done on 2026-10-14.
- Checked against live saves on 2026-10-16: a draft project, a devlog post, the profile, and the size caps. Jam fields are still untested.

Planned on top of it ([ROADMAP.md](ROADMAP.md), in Spanish):
- an open-source engine that turns a configuration into CSS;
- a hosted service for per-visit CSS;
- a web configurator for people who don't code;
- framework adapters and AI integration.

None of these exist yet.

## Start here

| You are… | Read |
|---|---|
| An AI assistant, or setting one up | [`llms.txt`](llms.txt), then [`knowledge/itch-custom-css.md`](knowledge/itch-custom-css.md) (~78,600 characters): the rules an AI must never break, copy-exact CSS blocks, and a digest of each topic |
| A creator writing CSS | The same main file. Start with §0 (rules) and §0.1 (copy-exact blocks), then the section for your page type |
| Looking for detail or evidence | [`knowledge/sections/`](knowledge/sections/) (ten files, ~865 KB in total) and [`knowledge/evidence/`](knowledge/evidence/) (logs and scripts per research dimension) |
| Loading everything at once | [`llms-full.txt`](llms-full.txt): the main file plus all sections in one file (very large) |

## A few facts that surprise people

- **Scope.** Start every selector with `#wrapper`. itch serves your CSS page-wide and adds no scoping (R2).
- **Size caps** (measured 2026-10-16):
  - Profile CSS is capped at **5,120 UTF-8 bytes**, comments included. Over that, the save is refused, never truncated.
  - Project and devlog CSS has **no CSS cap**.
  - A bio takes up to **5,000 characters** of the HTML you submit (R7).
- **Description HTML.** Only classes that start with lowercase `custom` survive; whatever follows the prefix is kept, so `custom-w-[3px]` works. `id`, `data-*`, `aria-*` and `role` are stripped (R11).
- **`</style>`.** It is deleted from your CSS, even inside a comment or a string (R8).
- **Jams.** `@import` never loads on jam pages, because the CSS sits inside `style#jam_theme` (R9).
- **Cascade.** Rules inside `@layer` always lose to itch's unlayered rules (R15).

## Repository layout

```
llms.txt, llms-full.txt     entry points for AIs (llms-full.txt is generated)
knowledge/
  itch-custom-css.md        main file: rules R1–R24, blocks B1–B4, digests, open questions, evidence index
  sections/                 ten detailed section files
  evidence/                 evidence logs and the scripts that produced them; live-probes/ holds the live results
  tests/                    18 self-checking local browser tests
  probes/                   live probe kit for account owners (payloads, read-back script, cap procedure)
  method/                   how the knowledge base was built (workflow scripts, the original open questions)
ROADMAP.md                  product plan (Spanish)
```

## Running the local tests

The tests need two local origins so that third-party `@import` can be emulated:

```bash
python -m http.server 8090
```

```bash
python -m http.server 8091
```

Run both from the repository root, then open `http://localhost:8090/knowledge/tests/index.html`. Each page also runs on its own. `knowledge/tests/_lib/itch-base.css` is a synthetic stand-in, not itch's stylesheet.

## Live probes

Some facts can only be settled by saving content on an itch account: what the sanitizer keeps, what a save does to your CSS, the size caps. [`knowledge/probes/`](knowledge/probes/README.md) has the payloads and a read-back script, `check.js`. The script only reads the page it runs on, and it is meant for the account owner on a **draft** page. Results go to [`knowledge/evidence/live-probes/`](knowledge/evidence/live-probes/).

## Contributing

Issues and pull requests are welcome, especially new live-probe results, Firefox and Safari checks, and screen-reader checks. A few rules keep the knowledge base trustworthy:

- **Tags.** Never upgrade a confidence tag without a new direct check. When two tags disagree, use the weaker one.
- **Both layers.** When a fact changes, edit both the main file and the section that holds the detail. Where they disagree, the main file wins.
- **Rebuild.** After editing either, rebuild `llms-full.txt` from the repository root:

  ```bash
  { head -7 llms-full.txt; for f in knowledge/itch-custom-css.md knowledge/sections/*.md; do printf '\n---\n<!-- file: %s -->\n\n' "$f"; tr -d '\r' < "$f"; done; } > llms-full.tmp && mv llms-full.tmp llms-full.txt
  ```
- **No third-party copies.** Don't commit other creators' CSS or HTML, itch's stylesheets, or page exports. Record statistics and short original snippets instead.
- **No personal data.** No tokens, cookies or personal data. Small creators are named `creator-NN`.
- **Crawling.** If you crawl itch.io, honour `robots.txt`, use GET only, keep to at most one request per second, and never log in.
- **Line endings.** Some section files use CRLF line endings on purpose. Keep them; `.gitattributes` disables conversion.

## License

- **Knowledge base** (the Markdown, text, JSON and CSV content under `knowledge/`, plus `llms.txt`, `llms-full.txt` and `ROADMAP.md`): [Creative Commons Attribution 4.0](knowledge/LICENSE). Credit it as "itch-live-css knowledge base by mirokshi, CC BY 4.0", with a link to this repository.
- **Code** (scripts, test pages, probe payloads, fixtures and tools, wherever they are, `knowledge/` included): [MIT](LICENSE).
- **Third-party material** is listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

This project is not affiliated with or endorsed by itch.io.
