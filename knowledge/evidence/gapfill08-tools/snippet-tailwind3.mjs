// npm i tailwindcss@3.4 postcss postcss-prefix-selector
import postcss from 'postcss'; import tailwind from 'tailwindcss'; import prefixer from 'postcss-prefix-selector';
const config = { content: ['./bio.html'], prefix: 'custom-', corePlugins: { preflight: false } };
const { css } = await postcss([tailwind(config), prefixer({ prefix: '#wrapper' })])
  .process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });
process.stdout.write(css);
