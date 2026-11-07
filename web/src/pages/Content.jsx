// The text pages. Docs and privacy come from locales/ (name.title, name.sections: each section has an
// optional title, paragraphs, items (a string, or { text, items }), a table, and paragraphs "after"
// its list). The guide comes from Markdown in content/guia/, one URL per language.

import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inline, Markdown, Navbar } from '../common.jsx';

// one centred column; long text set by the typography plugin
export const Page = ({ children }) => <main className="mx-auto max-w-5xl px-4 pt-6 pb-12">{children}</main>;
export const Title = ({ children }) => <h1 className="font-heading text-2xl font-semibold tracking-tight">{children}</h1>;
const PROSE = 'prose mt-6 max-w-none prose-p:max-w-[72ch] prose-li:max-w-[72ch] prose-code:before:content-none prose-code:after:content-none prose-pre:overflow-x-auto';

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
  return (
    <>
    <Navbar current={path} />
    <Page>
      <Title>{t(`${name}.title`)}</Title>
      <div className={PROSE}>
        {t(`${name}.sections`, { returnObjects: true }).map((s, i) => (
          <section key={i}>
            {s.title && <h2>{s.title}</h2>}
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
    </Page>
    </>
  );
}

// prev, next: { href, label } or null; links: the same chapter in each language
export function Chapter({ md, prev, next, links }) {
  const { t } = useTranslation();
  return (
    <>
    <Navbar current="/guia/" langLinks={links} />
    <Page>
      <article className={PROSE}><Markdown>{md}</Markdown></article>
      <nav className="mt-8 flex flex-wrap justify-between gap-3 text-sm" aria-label={t('guide.steps')}>
        {prev && <a className="underline underline-offset-4" href={prev.href}>{prev.label}</a>}
        {next && <a className="underline underline-offset-4" href={next.href}>{next.label}</a>}
      </nav>
      <p className="mt-6 text-sm text-muted-foreground">{t('guide.foot')}</p>
    </Page>
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
