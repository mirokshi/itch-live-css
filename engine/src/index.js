import { greeting } from './plugins/greeting.js';
import { title } from './plugins/title.js';
import { rng } from './random.js';

export const plugins = { title, greeting };

// config: { plugins: [{ use: 'title', options: {...} }, ...] }
// seed: anything; the same seed gives the same CSS. Omit it for a fresh result each call.
export function render(config, { seed = crypto.randomUUID() } = {}) {
  const r = rng(seed);
  const rules = config.plugins.flatMap(({ use, options = {} }) => {
    if (!Object.hasOwn(plugins, use)) throw new Error(`unknown plugin "${use}"`);
    return plugins[use](options, r);
  });
  return rules.join('\n') + '\n';
}
