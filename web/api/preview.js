// /api/preview — POST form → { css, bio } for the page's preview. Nothing is saved.

import { bioHtml, build, check } from '../lib/config.js';
import { handle, json, readJson } from '../lib/http.js';

// made-up games, matching the data-game_id of the cards in public/preview.html
const DAY = 24 * 60 * 60 * 1000;
const GAMES = [
  { id: 1, views: 1840, downloads: 0, published: Date.now() - 600 * DAY },
  { id: 2, views: 920, downloads: 312, published: Date.now() - 900 * DAY },
  { id: 3, views: 45, downloads: 3, published: Date.now() - 20 * DAY },
];

export const POST = (request) =>
  handle(async () => {
    const form = check(await readJson(request));
    return json({ css: build(form, { data: { games: GAMES } }), bio: bioHtml(form) });
  });
