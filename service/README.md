# Your own itch-live-css service

The per-visit CSS for your itch.io page (mixed-letter title, rolling greeting, card foil and figures), served from your own Vercel account instead of the public site. Step by step, for non-coders too: [chapter 9 of the guide](https://itch-live-css-web.vercel.app/guia/en/09-your-own-service) ([en español](https://itch-live-css-web.vercel.app/guia/es/09-tu-propio-servicio)).

In short:

1. **Fork** [mirokshi/itch-live-css-service](https://github.com/mirokshi/itch-live-css-service).
2. In the site's editor, **Download config.json** and upload it to your fork (it replaces the example).
3. On Vercel, import your fork and deploy. No settings to change.
4. Optional: `ITCH_API_KEY` in the project's environment variables puts your games' views and downloads on the cards.
5. On itch, first line of your CSS: `@import url("https://<your-project>.vercel.app/live.css");`. If you use the title or the greeting, paste what `https://<your-project>.vercel.app/api/bio` shows into your bio.

To change the design, upload a new `config.json`. To get fixes and new effects, click **Sync fork**: your `config.json` stays.

| File | What it does |
|---|---|
| `config.json` | Your design: the editor's form (page, accent, effects, your own CSS) |
| `api/live.js` | `/live.css`: `config.json` → CSS, new on every visit, with Google Fonts inlined and your itch data |
| `api/bio.js` | `/api/bio`: the bio HTML the title and greeting hook into |
| `lib/`, `engine/` | The public site's code that both use |

This repository is generated from the `service/` folder of [mirokshi/itch-live-css](https://github.com/mirokshi/itch-live-css) (`service/publish.mjs`), where the code, the issues and the pull requests go. MIT licence.
