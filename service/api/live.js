// /live.css: your own copy of the itch-live-css service (README.md). Serves the design in
// ../config.json, downloaded from the web's editor, rolled again on every visit; itch loads it with
// @import. Same code as the public web's /c/<id>.css, without the store: the config is a file.
// Must answer fast (a hanging @import blanks the page): itch's API and Google Fonts are capped at 1.5 s.

import { readFileSync } from 'node:fs';
import { build, check } from '../../web/lib/config.js';
import { inlineGoogleFonts } from '../../web/lib/googlefonts.js';
import { ownerGames } from '../../web/lib/itch.js';

const headers = { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' };

// Throws on a missing or broken config.json, with a message that says which field.
export const readConfig = () => check(JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8')));

export async function GET() {
  let form;
  try {
    form = readConfig();
  } catch (err) {
    // open /live.css in a browser to read it; itch ignores a sheet that fails
    return new Response(`/* config.json: ${err.message.replaceAll('*/', '* /')} */\n`, { status: 500, headers });
  }
  let css;
  try {
    // the figures on the cards: your own games, with ITCH_API_KEY (no key: the cards show the foil only)
    css = build(form, form.badges ? { data: { games: await ownerGames() } } : {});
  } catch (err) {
    // itch's data in an unexpected shape: the effects without it beat no CSS at all
    console.error(err.message);
    css = build(form);
  }
  return new Response(await inlineGoogleFonts(css), { headers });
}
