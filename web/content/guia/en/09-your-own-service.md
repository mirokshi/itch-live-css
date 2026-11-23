# Chapter 9 — Your own service: per-visit effects on your Vercel account

The effects that change on every visit (the mixed-letter title, the greeting that switches language, the cards with figures) can't be pasted: a service serves them, and itch loads them with an `@import`. This chapter shows how to run that service on your own account, the same one this site uses, so you don't depend on this site.

## 9.1 When it's worth it

- **You don't depend on this site.** If this site goes down or closes, your page stays as it is.
- **Your itch figures on the cards.** Your games' views and downloads come from itch's API with a key of your own. The public site only shows figures on its author's profile, because they are each account's private stats.
- **Your own limits.** Vercel's free plan is yours alone.

You don't need it if everything you use can be pasted. The editor tells you: if the "For itch" card gives you CSS to paste, no service is needed.

## 9.2 What you need

- A **GitHub** account and a **Vercel** account (the Hobby plan is free, and you sign in with GitHub).
- Your design, made in this site's editor.
- About 15 minutes. No coding needed.

## 9.3 Step by step

1. **Download your design.** In the editor, with your effects on, the "For itch" card has a **Download config.json** button. Save the file.
2. **Fork the** `itch-live-css` **repository** on GitHub (the *Fork* button). You get your own copy.
3. **Upload your design.** In your fork, open the `service/` folder, click *Add file → Upload files*, drop your `config.json` (it replaces the example) and click *Commit changes*.
4. **Create the Vercel project.** *Add New → Project*, import your fork and, under **Root Directory**, pick `service`. Click *Deploy*.
5. **Check that it serves.** Open `https://<your-project>.vercel.app/live.css`: you should see CSS. If you see a comment that starts with `/* config.json:`, the rest says which field is wrong.
6. **Optional: your games' figures.** On itch: *Settings → API keys → Generate new API key*, and copy the key. [S1] On Vercel: your project → *Settings → Environment Variables* → name `ITCH_API_KEY`, value the key. Then *Deployments* → the latest → *Redeploy* (variables only reach new deployments). Without a key, the cards get the foil border, without figures.
7. **Paste the link into itch.** In your page's CSS field, as the **first line**:

   ```css
   @import url("https://<your-project>.vercel.app/live.css");
   ```

   Nothing may come before it: a rule ahead of the `@import` silently cancels it. [S2] On a profile, only that line counts toward the 5,120-byte cap. [S3]
8. **Paste the bio.** If you use the title or the greeting, open `https://<your-project>.vercel.app/api/bio` and copy what it shows into your bio: it's the HTML the effects hook into.
9. **Look at your page logged out**, in a private window, a few minutes after saving: itch serves visitors a cached copy for a few minutes, while you, logged in, always see the latest. [S4]

## 9.4 Changing the design

Go back to the editor, change what you like, download `config.json` again and upload it to `service/` as in step 3. Vercel redeploys by itself in a minute or two. **Nothing to change on itch**: the `@import` still points to the same place, and the service answers uncached, so the next visit already sees the change.

To get the engine's improvements, click *Sync fork* in your fork. Your `config.json` stays.

## 9.5 What you should know

- **A service that doesn't answer blanks the page.** An `@import` to a server that accepts the connection and never answers kept the page blank for over 330 seconds. [S5] That's why the service waits at most 1.5 seconds for itch or Google Fonts. If you change the code, don't add slow calls without a time limit.
- **If it fails fast, only that sheet is lost.** A blocked or failing `@import` doesn't break the rest of your CSS. [S6] So, if your CSS fits, paste it below the `@import` too: if the service fails, the page keeps its look and only loses the effects.
- **Blockers.** Brave once blocked a sheet served from `vercel.app`, for an unknown reason. [S6] A domain of your own (Vercel → *Settings → Domains*) may avoid it; that isn't tested.
- **Jams: it doesn't work.** On jams the CSS sits inside a different tag and the `@import` never loads. [S7]
- **Privacy.** The visitor's browser sends your service your page's address (the *Referer*). [S8] Don't add cookies or log visits.
- **Vercel Hobby limits.** One million invocations a month, about 33,000 visits a day, and non-commercial use only. A page that sells games might count as commercial; it isn't clear. [S9]
- **Your fork is public.** Anyone can read your `config.json` (it's your CSS, which your visitors already get). The itch key goes only in Vercel's environment variables, never in a file.

## 9.6 If you code

`service/api/live.js` is about 30 lines: it reads `config.json`, checks it and turns it into CSS with the same code as the public site (`web/lib/config.js` and the engine's `render()`). You can swap in your own `render({ plugins })` call and write new plugins in `engine/src/plugins/`. To try it on your computer without deploying: `node --watch engine/bin/cli.js dev <your-config.js>` serves `http://localhost:3000/live.css`, new on every request.

## Sources

- **S1** itch API key and where to create it: observed · the author's original service notes (`itch-io-custom-css/custom-css/README.md`); the call is the one in `web/lib/itch.js` (`api.itch.io/profile/games`).
- **S2** `@import` first (R9): verified · localtests-09, localtests-50, itchcss-08.
- **S3** Only the `@import` line counts toward the cap: verified · external-01, repo-09.
- **S4** Cache for logged-out visitors: documented · community-05; verified · crawlprofile-46.
- **S5** A server that never answers, page blank for over 330 s: verified · g08-17.
- **S6** A blocked `@import` drops only that sheet: verified · external-06, localtests-12. Brave and `vercel.app`: observed 2026-10-12 · repo-14.
- **S7** `@import` dead on jams (`style#jam_theme`): verified · s04-1, crawljam-14.
- **S8** Referer with the page URL: verified · external-32, external-47.
- **S9** Vercel Hobby limits and non-commercial use: documented · external-22, external-23. Pages that sell games: inferred · x08-08.
