import i18n from '../i18n.js';
import { chapters } from '../guide.js';
import { Chapter } from '../pages/Chapter.jsx';

export function loader({ request }) {
  const url = new URL(request.url).pathname.replace(/\/$|\.data$/, '');
  const lang = url.split('/')[2];
  const list = chapters[lang];
  const i = list.findIndex((c) => c.href === url);
  if (i < 0) throw new Response('Not found', { status: 404 });
  const name = (c) => c.href;
  return {
    lang,
    md: list[i].md,
    title: list[i].title,
    links: Object.fromEntries(Object.entries(chapters).map(([l, c]) => [l, c[i].href])),
    prev: list[i - 1] && { href: name(list[i - 1]), label: `← ${list[i - 1].title}` },
    next: list[i + 1] && { href: name(list[i + 1]), label: `${list[i + 1].title} →` },
  };
}
export default function ChapterRoute({ loaderData: { md, links, prev, next } }) {
  return <Chapter md={md} links={links} prev={prev} next={next} />;
}
export const handle = { title: 'titles.chapter' };
export const meta = ({ loaderData }) => [{ title: i18n.t('titles.chapter', { title: loaderData.title, lng: loaderData.lang }) }];
