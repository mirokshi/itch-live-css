// Pieces every page shares: the site menu with the language selector, inline formatting for the
// texts in locales/, Markdown for the guide, and the page mock shrunk into a card (ideas, showcase,
// admin).

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGS } from './i18n.js';

const LINKS = [['/', 'editor'], ['/ideas.html', 'ideas'], ['/showcase.html', 'showcase'], ['/guia/', 'guide'], ['/docs.html', 'docs'], ['/privacy.html', 'privacy']];

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
        <SelectContent>
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
export const Markdown = ({ children }) => <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>{children}</ReactMarkdown>;

// "# Title\n\nbody" → [title, body]
export const splitTitle = (md) => {
  const m = md.match(/^# (.+)\r?\n([\s\S]*)$/);
  return [m[1].replace(/\*\*/g, ''), m[2]];
};

export const MOCKS = { profile: '/preview.html', project: '/preview-project.html', devlog: '/preview-devlog.html' };

// A page mock in a card, filled once css arrives (null: still loading). No allow-scripts: nothing in
// it runs; allow-same-origin lets this page fill it. bio is our own text only, never a user's HTML.
export function Thumb({ page = 'profile', css, bio = '' }) {
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
  }, [loaded, css, bio]);
  return (
    <div className="thumb" ref={box}>
      <iframe ref={frame} src={MOCKS[page] ?? MOCKS.profile} title={t('thumb.title', { page: t(`pageNames.${page}`) })} tabIndex={-1} loading="lazy"
        sandbox="allow-same-origin" aria-hidden="true" onLoad={() => setLoaded(true)} />
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
