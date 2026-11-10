// The guide's chapters, from the Markdown in content/guia/ (only loaders import this: build time).
import { readdirSync } from 'node:fs';
import { splitTitle } from './common.jsx';
import { LANGS } from './i18n.js';

const md = import.meta.glob('/content/guia/*/*.md', { query: '?raw', import: 'default', eager: true });

// /content/guia/<lang>/<name>.md → /guia/<lang>/<name>, in file order
export const chapters = Object.fromEntries(
  Object.keys(LANGS).map((lang) => [
    lang,
    Object.keys(md).filter((k) => k.startsWith(`/content/guia/${lang}/`)).sort().map((k) => ({
      href: k.replace('/content', '').replace(/\.md$/, ''),
      title: splitTitle(md[k])[0],
      md: md[k],
    })),
  ]),
);

// relative to the project: the build runs this from a bundle in build/, so import.meta.url is no help
export const recipes = () => readdirSync('public/guia/recetas').sort();
