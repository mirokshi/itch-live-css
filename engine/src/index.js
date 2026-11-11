import { ascii } from './plugins/ascii.js';
import { badges, cards, foil } from './plugins/cards.js';
import { css } from './plugins/css.js';
import { greeting } from './plugins/greeting.js';
import { entrance, lift, pagefade, tilt } from './plugins/motion.js';
import { parallax, progress, reveal, shrink, stagger, unveil, zoom } from './plugins/scroll.js';
import { scheme } from './plugins/scheme.js';
import { title } from './plugins/title.js';
import { rng } from './random.js';

export { importLine, measure } from './output.js';
export { validate } from './validate.js';

export const plugins = { title, greeting, cards, foil, badges, ascii, scheme, reveal, progress, parallax, zoom, stagger, shrink, unveil, pagefade, lift, tilt, entrance, css };

// config: { plugins: [{ use: 'title', options: {...} }, ...] }
// seed: anything; the same seed gives the same CSS. Omit it for a fresh result each call.
// data: outside inputs fetched by the caller, e.g. { games } for cards. now: ms, for date checks.
function rules(config, { seed = crypto.randomUUID(), data = {}, now = Date.now() } = {}) {
  const r = rng(seed);
  return config.plugins.flatMap(({ use, options = {} }) => {
    if (!Object.hasOwn(plugins, use)) throw new Error(`unknown plugin "${use}"`);
    return plugins[use](options, r, { data, now });
  });
}

// Served output: what the service answers to the @import, one rule per line.
export const render = (config, options) => rules(config, options).join('\n') + '\n';

// Pasted output: one line for itch's CSS field. Plugins already write minified rules, so joining
// them is the minifying. Pass a seed to get the same paste twice.
export const paste = (config, options) => rules(config, options).join('');
