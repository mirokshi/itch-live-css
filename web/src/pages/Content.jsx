// The text pages. Docs and privacy come from locales/ (name.title, name.sections: each section has an
// optional title, paragraphs, items (a string, or { text, items }), a table, and paragraphs "after"
// its list). The guide comes from Markdown in content/guia/, one URL per language.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inline, Markdown, Navbar } from '../common.jsx';

// one centred column; long text set by the typography plugin
export const Page = ({ children }) => <main className="mx-auto max-w-5xl px-4 pt-6 pb-12">{children}</main>;

// ---- the side index (table of contents) ----

const plain = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').trim();
const slug = (s) => plain(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';

// [{ id, text, line? }] for these heading texts; repeated texts get -2, -3 …
function withIds(entries) {
  const seen = {};
  return entries.map(({ text, ...rest }) => {
    const base = slug(text);
    seen[base] = (seen[base] ?? 0) + 1;
    return { id: seen[base] > 1 ? `${base}-${seen[base]}` : base, text: plain(text), ...rest };
  });
}

// the "## " headings of a Markdown text (not the ones inside code fences), with their line numbers
export function headingsOf(md) {
  let fence = false;
  const found = [];
  md.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    else if (!fence && /^## /.test(line)) found.push({ text: line.slice(3), line: i + 1 });
  });
  return withIds(found);
}

function TocList({ items, active }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.id}>
          <a href={`#${it.id}`} aria-current={it.id === active ? 'true' : undefined}
            className="block border-l-2 border-transparent py-0.5 pl-3 text-muted-foreground hover:text-foreground aria-[current=true]:border-foreground aria-[current=true]:font-medium aria-[current=true]:text-foreground">
            {it.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

// A column of text with its index: fixed at the side on wide screens (it stays while the text
// scrolls), a folded list above the text on phones.
export function WithToc({ items, children }) {
  const { t } = useTranslation();
  const [active, setActive] = useState(null);
  useEffect(() => {
    // the current section: the last heading that has reached the top of the page (below the menu bar)
    const update = () => {
      const passed = items.filter((it) => (document.getElementById(it.id)?.getBoundingClientRect().top ?? Infinity) <= 100);
      setActive(passed.length ? passed[passed.length - 1].id : null);
    };
    update();
    addEventListener('scroll', update, { passive: true });
    return () => removeEventListener('scroll', update);
  }, [items]);
  if (items.length < 2) return <Page>{children}</Page>;
  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-12 lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10">
      <div className="min-w-0">
        <details className="mb-4 rounded-lg border px-3 py-2 text-sm lg:hidden">
          <summary className="cursor-pointer font-medium">{t('guide.toc')}</summary>
          <div className="mt-2"><TocList items={items} /></div>
        </details>
        {children}
      </div>
      <aside className="hidden lg:block">
        <nav aria-label={t('guide.toc')} className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto text-sm">
          <p className="mb-2 font-medium">{t('guide.toc')}</p>
          <TocList items={items} active={active} />
        </nav>
      </aside>
    </main>
  );
}
export const Title = ({ children }) => <h1 className="font-heading text-2xl font-semibold tracking-tight">{children}</h1>;
const PROSE = 'prose mt-6 max-w-none prose-headings:scroll-mt-20 prose-p:max-w-[72ch] prose-li:max-w-[72ch] prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto';

function Items({ items }) {
  return (
    <ul>
      {items.map((it, i) => (
        <li key={i}>
          <Inline text={typeof it === 'string' ? it : it.text} />
          {it.items && <Items items={it.items} />}
        </li>
      ))}
    </ul>
  );
}

const Paragraphs = ({ list = [] }) => list.map((p, i) => <p key={i}><Inline text={p} /></p>);

export function Doc({ name, path }) {
  const { t } = useTranslation();
  const sections = t(`${name}.sections`, { returnObjects: true });
  const ids = withIds(sections.map((s) => ({ text: s.title ?? '', i: sections.indexOf(s) })).filter((e) => e.text));
  const idOf = (i) => ids.find((e) => e.i === i)?.id;
  return (
    <>
    <Navbar current={path} />
    <WithToc items={ids}>
      <Title>{t(`${name}.title`)}</Title>
      <div className={PROSE}>
        {sections.map((s, i) => (
          <section key={i}>
            {s.title && <h2 id={idOf(i)}>{s.title}</h2>}
            <Paragraphs list={s.paragraphs} />
            {s.table && (
              <div className="not-prose my-4 rounded-lg border">
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow>{s.table.head.map((c, j) => <TableHead key={j}><Inline text={c} /></TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.table.rows.map((row, j) => (
                      <TableRow key={j}>
                        {row.map((c, k) => (k === 0
                          ? <TableHead key={k} scope="row" className="bg-muted/50 align-top"><Inline text={c} /></TableHead>
                          : <TableCell key={k} className="align-top whitespace-normal"><Inline text={c} /></TableCell>))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {s.items && <Items items={s.items} />}
            <Paragraphs list={s.after} />
          </section>
        ))}
      </div>
    </WithToc>
    </>
  );
}

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

// chapters: { es: [{ href, title }], en: [...] }; recipes: file names in public/guia/recetas/
export function GuideIndex({ chapters, recipes }) {
  const { t, i18n } = useTranslation();
  const list = chapters[i18n.language] ?? chapters.es; // only the chapters in the selected language
  return (
    <>
    <Navbar current="/guia/" />
    <Page>
      <Title>{t('guide.title')}</Title>
      <div className={PROSE}>
        <section>
          <h2>{t('guide.steps')}</h2>
          <ol>{list.map((c) => <li key={c.href}><a href={c.href}>{c.title}</a></li>)}</ol>
        </section>
        <section>
          <h2>{t('guide.recipes')}</h2>
          <ul>{recipes.map((f) => <li key={f}><a href={`/guia/recetas/${f}`}>{f}</a></li>)}</ul>
        </section>
      </div>
      <p className="mt-6 text-sm text-muted-foreground">{t('guide.foot')}</p>
    </Page>
    </>
  );
}
