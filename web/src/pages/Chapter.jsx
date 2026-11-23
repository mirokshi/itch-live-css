// A guide chapter. In its own module, with the Markdown renderer: only the chapter routes load
// react-markdown, not every page.

import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import { Navbar } from '../common.jsx';
import { headingsOf, PROSE, WithToc } from './Content.jsx';

// the guide's chapters: tables scroll sideways on phones; raw HTML is shown as text, never rendered
const COMPONENTS = {
  table: ({ node, ...props }) => <div className="overflow-x-auto"><table {...props} /></div>,
  img: ({ node, ...props }) => <img loading="lazy" decoding="async" className="rounded-md border" {...props} />,
};
// ids: { line number: id } for the ## headings, so the side index can link to them
const Markdown = ({ children, ids }) => {
  const components = ids ? { ...COMPONENTS, h2: ({ node, ...props }) => <h2 id={ids[node?.position?.start.line]} {...props} /> } : COMPONENTS;
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>;
};

// prev, next: { href, label } or null; links: the same chapter in each language
export function Chapter({ md, prev, next, links }) {
  const { t } = useTranslation();
  const headings = headingsOf(md);
  return (
    <>
    <Navbar current="/guia/" langLinks={links} />
    <WithToc items={headings}>
      <article className={PROSE}><Markdown ids={Object.fromEntries(headings.map((h) => [h.line, h.id]))}>{md}</Markdown></article>
      <nav className="mt-8 flex flex-wrap justify-between gap-3 text-sm" aria-label={t('guide.steps')}>
        {prev && <a className="underline underline-offset-4" href={prev.href}>{prev.label}</a>}
        {next && <a className="underline underline-offset-4" href={next.href}>{next.label}</a>}
      </nav>
      <p className="mt-6 text-sm text-muted-foreground">{t('guide.foot')}</p>
    </WithToc>
    </>
  );
}
