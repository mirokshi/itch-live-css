// Pieces every page shares: the site menu with the language selector, inline formatting for the
// texts in locales/, Markdown for the guide, and the page mock shrunk into a card (ideas, showcase,
// admin).

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LANGS } from './i18n.js';

const LINKS = [['/', 'editor'], ['/ideas', 'ideas'], ['/showcase', 'showcase'], ['/claves', 'keys'], ['/docs', 'docs'], ['/guia/', 'guide']];

// links: { es: href, en: href } on pages whose language is in the URL (guide chapters): choosing
// goes to that URL. Elsewhere it switches the texts in place, and the choice is kept for the next
// visit (localStorage, optional).
export function LanguageSelector({ links }) {
  const { t, i18n } = useTranslation();
  useEffect(() => {
    if (links) return;
    let saved = null;
    try {
      saved = localStorage.getItem('lang');
    } catch {}
    const lng = saved ?? (navigator.language.startsWith('es') ? 'es' : 'en');
    if (lng !== i18n.language) i18n.changeLanguage(lng);
  }, []);
  const choose = (l) => {
    try {
      localStorage.setItem('lang', l);
    } catch {}
    if (links) location.href = links[l];
    else i18n.changeLanguage(l);
  };
  return (
    <div className="mt-2">
      <Select value={i18n.language} onValueChange={choose}>
        <SelectTrigger size="sm" aria-label={t('lang.label')} className="w-auto">
          <SelectValue>{LANGS[i18n.language]}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="end" sideOffset={4}>
          {Object.entries(LANGS).map(([l, name]) => <SelectItem key={l} value={l} lang={l}>{name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

// The bar at the top of every page: name, the site's pages, and the language selector.
export function Navbar({ current, langLinks }) {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-40 border-b bg-background md:h-14">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 md:h-full md:flex-nowrap md:py-0">
        <a href="/" className="font-heading text-base font-semibold tracking-tight">itch-live-css</a>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm md:flex-nowrap" aria-label={t('nav.label')}>
          {LINKS.map(([href, id]) => (
            <a key={href} href={href} aria-current={href === current ? 'page' : undefined}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline aria-[current=page]:font-medium aria-[current=page]:text-foreground">
              {t(`nav.${id}`)}
            </a>
          ))}
        </nav>
        {langLinks ? (
          // guide chapters ship no other script: only this selector hydrates (src/client/lang.jsx)
          <div id="lang-root" className="ml-auto" data-links={JSON.stringify(langLinks)}><LanguageSelector links={langLinks} /></div>
        ) : (
          <div className="ml-auto"><LanguageSelector /></div>
        )}
      </div>
    </header>
  );
}

// The bottom of every page. Rendered by server.jsx outside #root, so it is static HTML and never hydrates.
export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4 text-sm text-muted-foreground">
        <p>{t('footer.copyright', { year: 2026, name: 'mirokshi' })}</p>
        <a href="/privacy" className="text-foreground underline underline-offset-4 hover:text-muted-foreground">{t('nav.privacy')}</a>
      </div>
    </footer>
  );
}

// The few inline marks the texts in locales/ use: **bold**, *em*, `code` and [label](href). Only our
// own texts go through here; anything else stays plain text (React escapes it).
const MARKS = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/;
export function Inline({ text }) {
  return text.split(MARKS).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{part.slice(1, -1)}</code>;
    if (part.startsWith('[')) {
      const [, label, href] = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      return <a key={i} href={href} className="underline underline-offset-4">{label}</a>;
    }
    return <em key={i}>{part.slice(1, -1)}</em>;
  });
}

// the guide's chapters: tables scroll sideways on phones; raw HTML is shown as text, never rendered
const COMPONENTS = { table: ({ node, ...props }) => <div className="overflow-x-auto"><table {...props} /></div> };
// ids: { line number: id } for the ## headings, so the side index can link to them
export const Markdown = ({ children, ids }) => {
  const components = ids ? { ...COMPONENTS, h2: ({ node, ...props }) => <h2 id={ids[node?.position?.start.line]} {...props} /> } : COMPONENTS;
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>;
};

// "# Title\n\nbody" → [title, body]
export const splitTitle = (md) => {
  const m = md.match(/^# (.+)\r?\n([\s\S]*)$/);
  return [m[1].replace(/\*\*/g, ''), m[2]];
};

export const MOCKS = { profile: '/preview.html', project: '/preview-project.html', devlog: '/preview-devlog.html' };

// A page mock in a card, filled once css arrives (null: still loading). No allow-scripts: nothing in
// it runs; allow-same-origin lets this page fill it. bio is our own text only, never a user's HTML.
// show: 'bio' | 'games' keeps only that part of the mock (an idea's own effect); omitted: the whole page.
// h: the mock's height in its own pixels (the box takes its shape); zoom: enlarges the part shown.
function onlyCss(show, h, zoom) {
  const hide = { bio: '#profile_header,.user_links,.game_column,.footer', games: '#profile_header,.profile_column,.footer' }[show];
  if (!hide) return '';
  return `html,body{overflow:hidden}${hide}{display:none!important}#wrapper{min-height:${h}px;display:flex;align-items:center}.user_page{width:100%;zoom:${zoom}}`;
}
export function Thumb({ page = 'profile', css, bio = '', show, h = 800, zoom = 1, extra = '', interactive }) {
  const { t } = useTranslation();
  const box = useRef(null);
  const frame = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const fit = new ResizeObserver(([{ contentRect }]) => box.current.style.setProperty('--scale', String(contentRect.width / 1200)));
    fit.observe(box.current);
    // a lazy frame can finish loading before hydration attaches onLoad
    if (frame.current.contentDocument?.readyState === 'complete' && frame.current.contentDocument.getElementById('live')) setLoaded(true);
    return () => fit.disconnect();
  }, []);
  useEffect(() => {
    if (!loaded || css == null) return;
    const d = frame.current.contentDocument;
    d.getElementById('live').textContent = css;
    d.getElementById('bio').innerHTML = bio;
    let only = d.getElementById('only');
    if (!only) {
      only = d.createElement('style');
      only.id = 'only';
      d.head.append(only);
    }
    only.textContent = onlyCss(show, h, zoom) + extra;
  }, [loaded, css, bio, show, h, zoom, extra]);
  return (
    <div className="thumb" ref={box} style={{ aspectRatio: `1200 / ${h}` }}>
      <iframe ref={frame} src={MOCKS[page] ?? MOCKS.profile} title={t('thumb.title', { page: t(`pageNames.${page}`) })} tabIndex={-1} loading="lazy" style={{ height: h, ...(interactive && { pointerEvents: 'auto' }) }}
        sandbox="allow-same-origin" aria-hidden="true" onLoad={() => setLoaded(true)} />
      {(!loaded || css == null) && (
        <div className="absolute inset-0 space-y-2 bg-white p-[8%]" aria-hidden="true">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-2 w-1/4" />
          <Skeleton className="h-2 w-3/4" />
          <div className="grid grid-cols-3 gap-2 pt-1"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        </div>
      )}
    </div>
  );
}

// A thumb with a saved config's served CSS
export function SavedThumb({ id, page, bio }) {
  const [css, setCss] = useState(null);
  useEffect(() => {
    fetch(`/c/${id}.css`).then((r) => (r.ok ? r.text() : '')).then(setCss, () => setCss(''));
  }, [id]);
  return <Thumb page={page} css={css} bio={bio} />;
}

// the copy button; get() gives the text to copy
export function CopyButton({ get }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(get());
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return <Button type="button" variant="outline" size="sm" onClick={copy}>{t(done ? 'copy.done' : 'copy.copy')}</Button>;
}

// the text as js-beautify writes it ('css' | 'html'), or the text itself until the formatter loads
function usePretty(text, kind) {
  const [pretty, setPretty] = useState(text);
  useEffect(() => {
    if (!kind) return;
    let live = true;
    import('js-beautify').then(({ default: b }) => {
      if (live) setPretty(kind === 'css' ? b.css(text, { indent_size: 2 }) : b.html(text, { indent_size: 2, wrap_line_length: 0 }));
    }, () => {});
    return () => { live = false; };
  }, [text, kind]);
  return kind ? pretty : text;
}

// a read-only field with a copy button; `pretty` shows the text formatted, but the button still copies `text`
export function Copy({ text, label, rows, pretty }) {
  const field = 'font-mono text-xs';
  const shown = usePretty(text, pretty);
  return (
    <div className="flex items-start gap-2">
      {rows ? <Textarea rows={rows} readOnly value={shown} aria-label={label} className={field} /> : <Input readOnly value={shown} aria-label={label} className={field} />}
      <CopyButton get={() => text} />
    </div>
  );
}
