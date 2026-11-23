// /api/bio: the HTML the title and greeting hook into, to paste into your itch bio (README.md).

import { bioHtml } from '../../web/lib/config.js';
import { readConfig } from './live.js';

export function GET() {
  const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' };
  try {
    const html = bioHtml(readConfig());
    return new Response(html ? `${html}\n` : 'Your config has no title or greeting: nothing to add to the bio.\n', { headers });
  } catch (err) {
    return new Response(`config.json: ${err.message}\n`, { status: 500, headers });
  }
}
