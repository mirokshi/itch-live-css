# Your own itch-live-css service

The per-visit CSS for your itch.io page (mixed-letter title, rolling greeting, card foil and figures), served from your own Vercel account instead of the public site. Step by step, for non-coders too: [chapter 9 of the guide](https://itch-live-css-web.vercel.app/guia/en/09-your-own-service) ([en español](https://itch-live-css-web.vercel.app/guia/es/09-tu-propio-servicio)).

In short:

1. In the site's editor, **Download config.json** and put it in this folder (replace the example).
2. On Vercel, import your fork with **Root Directory** `service`, and deploy.
3. Optional: `ITCH_API_KEY` in the project's environment variables puts your games' views and downloads on the cards.
4. On itch, first line of your CSS: `@import url("https://<your-project>.vercel.app/live.css");`. If you use the title or the greeting, paste `https://<your-project>.vercel.app/api/bio` into your bio.

| File | What it does |
|---|---|
| `config.json` | Your design: the editor's form (page, accent, effects, your own CSS) |
| `api/live.js` | `/live.css`: `config.json` → CSS, new on every visit, with Google Fonts inlined and your itch data |
| `api/bio.js` | `/api/bio`: the bio HTML the title and greeting hook into |
| `vercel.json` | Installs `../engine`, maps `/live.css` |

It reuses the engine (`../engine`) and the public site's code (`../web/lib`), so a *Sync fork* brings their fixes. Vercel must include source files outside the Root Directory: that's the default, and the switch sits next to the Root Directory setting.
