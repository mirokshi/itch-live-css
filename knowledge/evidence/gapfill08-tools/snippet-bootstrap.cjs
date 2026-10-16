// build.cjs: npm i bootstrap@5.3.3 postcss postcss-rename postcss-prefix-selector
const fs = require('fs'), postcss = require('postcss');
const rename = require('postcss-rename'), prefixer = require('postcss-prefix-selector');
const src = fs.readFileSync(require.resolve('bootstrap/dist/css/bootstrap.css'), 'utf8');
postcss([rename({ prefix: 'custom-' }), prefixer({ prefix: '#wrapper .custom-bs' })])
  .process(src, { from: undefined })
  .then((r) => fs.writeFileSync('bootstrap-itch.css', r.css));
