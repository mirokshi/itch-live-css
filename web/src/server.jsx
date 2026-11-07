// Every page of the site: URL → React tree → full HTML. prerender.mjs writes them into dist/ at build
// time; the dev server (vite.config.js) renders one per request. asset(path) gives the URL of a file
// under src/ (the stylesheet index.css, a client entry client/<entry>.jsx). Pages render in Spanish, guide chapters in their own
// language; in the browser the language selector switches the rest.

import { readdirSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { splitTitle } from './common.jsx';
import i18n, { LANGS } from './i18n.js';
import { Admin, Ideas, Showcase } from './pages/Cards.jsx';
import { Chapter, Doc, GuideIndex } from './pages/Content.jsx';
import { Editor } from './pages/Editor.jsx';

const md = import.meta.glob('/content/guia/*/*.md', { query: '?raw', import: 'default', eager: true });

// /content/guia/<lang>/<name>.md → /guia/<lang>/<name>.html, in file order
const chapters = Object.fromEntries(
  Object.keys(LANGS).map((lang) => [
    lang,
    Object.keys(md).filter((k) => k.startsWith(`/content/guia/${lang}/`)).sort().map((k) => ({
      href: k.replace('/content', '').replace(/\.md$/, '.html'),
      title: splitTitle(md[k])[0],
      md: md[k],
    })),
  ]),
);

const PAGES = {
  '/': { title: 'titles.editor', entry: 'editor', element: <Editor /> },
  '/ideas.html': { title: 'titles.ideas', entry: 'ideas', element: <Ideas /> },
  '/showcase.html': { title: 'titles.showcase', entry: 'showcase', element: <Showcase /> },
  '/admin.html': { title: 'titles.admin', entry: 'admin', element: <Admin />, noindex: true },
  '/docs.html': { title: 'titles.docs', entry: 'docs', element: <Doc name="docs" path="/docs.html" /> },
  '/privacy.html': { title: 'titles.privacy', entry: 'privacy', element: <Doc name="privacy" path="/privacy.html" /> },
};

function page(url) {
  if (Object.hasOwn(PAGES, url)) return PAGES[url];
  if (url === '/guia/' || url === '/guia/index.html') {
    const data = {
      chapters: Object.fromEntries(Object.keys(LANGS).map((l) => [l, chapters[l].map(({ href, title }) => ({ href, title }))])),
      recipes: readdirSync(new URL('../public/guia/recetas/', import.meta.url)).sort(),
    };
    return { title: 'titles.guide', entry: 'guide', data, element: <GuideIndex {...data} /> };
  }
  for (const [lang, list] of Object.entries(chapters)) {
    const i = list.findIndex((c) => c.href === url);
    if (i < 0) continue;
    const name = (c) => c.href.split('/').pop(); // same folder, so bare file names
    const links = Object.fromEntries(Object.keys(LANGS).map((l) => [l, chapters[l][i].href]));
    return {
      title: 'titles.chapter',
      titleParams: { title: list[i].title },
      lang,
      entry: 'lang',
      element: (
        <Chapter md={list[i].md} links={links}
          prev={list[i - 1] && { href: name(list[i - 1]), label: `← ${list[i - 1].title}` }}
          next={list[i + 1] && { href: name(list[i + 1]), label: `${list[i + 1].title} →` }} />
      ),
    };
  }
  return null;
}

export const routes = [...Object.keys(PAGES), '/guia/', ...Object.values(chapters).flat().map((c) => c.href)];

const esc = (s) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

// → the page's HTML, or null for a URL that isn't a page
export function render(url, asset) {
  const p = page(url);
  if (!p) return null;
  const lang = p.lang ?? 'es';
  const t = i18n.cloneInstance({ lng: lang });
  const body = renderToString(<I18nextProvider i18n={t}>{p.element}</I18nextProvider>);
  // props for hydration, as JSON that can't close the script element
  const data = p.data ? `\n<script type="application/json" id="guide-data">${JSON.stringify(p.data).replace(/</g, '\\u003c')}</script>` : '';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">${p.noindex ? '\n<meta name="robots" content="noindex">' : ''}
<title>${esc(t.t(p.title, p.titleParams))}</title>
<link rel="stylesheet" href="${asset('index.css')}">
</head>
<body>
<div id="root" data-title="${p.title}">${body}</div>${data}${p.entry ? `\n<script type="module" src="${asset(`client/${p.entry}.jsx`)}"></script>` : ''}
</body>
</html>
`;
}
