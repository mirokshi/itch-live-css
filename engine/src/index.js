import { ascii } from './plugins/ascii.js';
import { cards } from './plugins/cards.js';
import { greeting } from './plugins/greeting.js';
import { title } from './plugins/title.js';
import { rng } from './random.js';

export const plugins = { title, greeting, cards, ascii };

// config: { plugins: [{ use: 'title', options: {...} }, ...] }
// seed: anything; the same seed gives the same CSS. Omit it for a fresh result each call.
// data: outside inputs fetched by the caller, e.g. { games } for cards. now: ms, for date checks.
export function render(config, { seed = crypto.randomUUID(), data = {}, now = Date.now() } = {}) {
  const r = rng(seed);
  const rules = config.plugins.flatMap(({ use, options = {} }) => {
    if (!Object.hasOwn(plugins, use)) throw new Error(`unknown plugin "${use}"`);
    return plugins[use](options, r, { data, now });
  });
  return rules.join('\n') + '\n';
}
