# How this knowledge base was built

On 2026-10-14 the knowledge base was produced with Claude Code's Workflow tool. These are the scripts, kept so the research can be re-run or extended.

| File | What it is |
|---|---|
| `research-workflow.js` | The main run. 13 research and test dimensions (docs, sanitizer source, community, profile/project/jam crawls, CSS corpus, itch's stylesheets, local browser tests, browser support, the owner's private repo, external `@import`, accessibility). Each dimension then gets an adversarial verifier, followed by section writers, a completeness critic, gap fills, the probe kit, assembly and reviews. |
| `finish-workflow.js` | The continuation run, made after a usage limit cut the main run short. It does the remaining gap fills, per-section digests, the probe kit, the condensed main file with `llms.txt` and `llms-full.txt`, and the accuracy, AI-usability and publication-hygiene reviews. |
| `open-questions.json` | The 237 open questions raised by the research, verify and gap-fill agents. 115 of them need an itch account; the probe kit (`../probes/`) groups them into 22 clusters. |

Both scripts take their paths from `args`:

- `repo`: this project;
- `oldRepo`: the owner's private repo, read only;
- `scratch` or `kb`: a temp folder for raw downloads;
- `today`.

The prompts encode the project's rules: confidence tags, evidence logs, itch.io crawling etiquette, and no third-party content stored verbatim.

To re-run one dimension, copy its entry from `DIMENSIONS` into a small workflow of its own. The full run took about 1.5 hours and roughly 14M subagent tokens.
