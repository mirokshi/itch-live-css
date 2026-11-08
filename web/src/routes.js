// The site's URLs (no .html). Guide chapters come from the folders in
// content/guia/<lang>/, one route each, all served by routes/chapter.jsx.
import { index, route } from '@react-router/dev/routes';
import { readdirSync } from 'node:fs';
import { IDEAS } from './ideas.js';

const chapters = readdirSync(new URL('../content/guia/', import.meta.url)).flatMap((lang) =>
  readdirSync(new URL(`../content/guia/${lang}/`, import.meta.url)).filter((f) => f.endsWith('.md')).sort()
    .map((f) => `guia/${lang}/${f.replace(/\.md$/, '')}`),
);

export default [
  index('routes/editor.jsx'),
  route('ideas', 'routes/ideas.jsx'),
  ...IDEAS.map((idea) => route(`ideas/${idea}`, 'routes/idea.jsx', { id: `idea-${idea}` })),
  route('showcase', 'routes/showcase.jsx'),
  route('admin', 'routes/admin.jsx'),
  route('docs', 'routes/docs.jsx'),
  route('privacy', 'routes/privacy.jsx'),
  route('guia', 'routes/guide.jsx'),
  ...chapters.map((href) => route(href, 'routes/chapter.jsx', { id: href })),
];
