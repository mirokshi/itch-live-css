// The card pages: ideas (one live sample per effect), the public showcase and its admin review.
// Names and URLs in the showcase come from users: React escapes them, and links only point at the
// itch.io addresses the API checked.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CodeEditor } from '../CodeEditor.jsx';
import { FONTS } from '../../lib/fonts.js';
import { IDEA_PAGES, NO_PREVIEW, PREVIEW, TOGGLES } from '../ideas.js';
import { CopyButton, Inline, Navbar, SavedThumb, Thumb } from '../common.jsx';
import { Page, Title } from './Content.jsx';

const BASE = { page: 'profile', accent: '#d6336c', title: null, greeting: null, cards: false, ascii: false };

const GREETINGS = ['¡Hola!', 'Hello!', 'Bonjour !', 'Hallo!', 'Olá!', 'Ciao!'];

const GRID = 'mt-6 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 p-0';
// a card with a page mock on top, flush, as an image would be
const MockCard = ({ thumb, children }) => <li><Card className="h-full pt-0">{thumb}{children}</Card></li>;
const Intro = ({ children }) => <p className="mt-4 max-w-[72ch] text-muted-foreground">{children}</p>;

// the server renders only that effect, on a sample page (the sample texts follow the language)
const sampleForm = (t) => ({
  title: { title: { text: t('ideas.sampleName'), fonts: ['fraunces', 'inter', 'grotesk'] } },
  greeting: { greeting: { first: t('ideas.sampleHello'), others: GREETINGS.filter((g) => g !== t('ideas.sampleHello')) } },
  foil: { foil: true },
  badges: { badges: true },
  ascii: { ascii: true },
  scheme: { scheme: true },
  ...Object.fromEntries(TOGGLES.map((k) => [k, { [k]: true }])),
  progress: { progress: true, page: 'devlog' },
  unveil: { unveil: true, page: 'devlog' },
  zoom: { zoom: true, page: 'project' },
});

// { idea: { css, bio } } for these ideas, filled as the answers arrive (css null: still loading)
function useSamples(ideas, again = 0, extra = {}) {
  const { t, i18n } = useTranslation();
  const [samples, setSamples] = useState({});
  useEffect(() => {
    let live = true;
    const put = (idea, sample) => live && setSamples((s) => ({ ...s, [idea]: sample }));
    const forms = sampleForm(t);
    for (const idea of ideas) {
      fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...BASE, ...forms[idea], ...extra[idea] }) })
        .then((r) => r.json())
        .then(({ css, bio }) => put(idea, { css, bio }), () => put(idea, { css: '', bio: '' }));
    }
    return () => { live = false; };
  }, [i18n.language, again, JSON.stringify(extra)]);
  return samples;
}

// the pages an idea works on, as chips
function PageChips({ idea, className = '' }) {
  const { t } = useTranslation();
  return (
    <ul className={`flex list-none flex-wrap gap-1.5 p-0 ${className}`} aria-label={t('ideas.worksOn')}>
      {IDEA_PAGES[idea].map((page) => <li key={page}><Badge variant="secondary">{t(`pageNames.${page}`)}</Badge></li>)}
    </ul>
  );
}

// a font's checkbox; disabled where the font count would leave 2–4
function FontCheck({ id, checked, disabled, onChange, children }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id}>{children}</Label>
    </div>
  );
}

// the mock of one idea (FRAME); with a part only, the sample sentence is left out too
function IdeaThumb({ idea, sample, interactive }) {
  const { t } = useTranslation();
  const f = FRAME[idea] ?? {};
  return <Thumb css={sample?.css ?? null} bio={`${sample?.bio ?? ''}${f.show ? '' : `<p>${t('ideas.sampleBio')}</p>`}${f.html ?? ''}`} {...f} scroll={interactive ? 0 : f.scroll} interactive={interactive} />;
}

// read-only code (CodeMirror) with a copy button
function CodeBox({ lang, label, text }) {
  const view = useRef(null);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="font-bold">{label}</Label>
        <CopyButton get={() => text} />
      </div>
      <div className="cm-tall"><CodeEditor lang={lang} label={label} value={text} viewRef={view} readOnly /></div>
    </div>
  );
}

// a gradient picture for the mocks (our own, as a data: SVG)
function picture([a, b]) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='420'><linearGradient id='g'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient><rect width='800' height='420' fill='url(#g)'/></svg>`;
  return `<p><img alt="" width="800" height="420" src="data:image/svg+xml,${encodeURIComponent(svg)}"></p><p>Lorem ipsum dolor sit amet.</p>`;
}

export const ideaUrl = (idea) => `/ideas/${idea}`;

export function Ideas() {
  const { t } = useTranslation();
  const samples = useSamples(PREVIEW);
  return (
    <>
    <Navbar current="/ideas" />
    <Page>
      <Title>{t('ideas.title')}</Title>
      <Intro>{t('ideas.intro')}</Intro>
      <ul className={GRID}>
        {PREVIEW.map((idea) => (
          <MockCard key={idea} thumb={<IdeaThumb idea={idea} sample={samples[idea]} />}>
            <CardHeader>
              <CardTitle><h2>{t(`ideas.${idea}_name`)}</h2></CardTitle>
              <CardDescription>{t(`ideas.${idea}_text`)}</CardDescription>
              <PageChips idea={idea} className="mt-auto w-full justify-end" />
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button asChild size="sm"><a href={ideaUrl(idea)}>{t('ideas.show')}</a></Button>
            </CardFooter>
          </MockCard>
        ))}
      </ul>
      <h2 className="mt-10 text-xl font-semibold">{t('ideas.noPreviewTitle')}</h2>
      <p className="mt-2 max-w-[72ch] text-muted-foreground">{t('ideas.noPreviewIntro')}</p>
      <ul className="mt-4 max-w-[72ch] list-disc space-y-3 pl-5">
        {NO_PREVIEW.map((idea) => (
          <li key={idea}>
            <a className="font-medium underline underline-offset-4" href={ideaUrl(idea)}>{t(`ideas.${idea}_name`)}</a>
            <span className="text-muted-foreground"> — {t(`ideas.${idea}_text`)}</span>
          </li>
        ))}
      </ul>
    </Page>
    </>
  );
}

// The scheme idea follows the visitor's system, which a button can't change: for the preview, the
// dark rules are unwrapped from their @media (dark) or removed (light). Only the preview; the CSS shown stays whole.
function forceScheme(css, mode) {
  const m = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/);
  if (!m) return css;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  for (; i < css.length && depth; i++) depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0;
  return css.slice(0, m.index) + (mode === 'dark' ? css.slice(start, i - 1) : '') + css.slice(i);
}

// the open tab in the primary colour (the generated tab styles key on data-active, which Radix does not set)
const TAB = 'px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:hover:text-primary-foreground';

// what each idea shows of the mock: title and greeting live in the bio, the cards in the game grid;
// the background field and the colour scheme need the whole page (no entry). h and zoom fit the box to that part
const FRAME = {
  title: { show: 'bio', h: 260, zoom: 1.6 },
  greeting: { show: 'bio', h: 220, zoom: 2.4 },
  // the ring follows the card's corners: rounded, with room inside, on the same light page as the other ideas
  foil: { show: 'games', h: 520, zoom: 1.3, extra: '.user_game_grid{grid-template-columns:repeat(3,1fr)!important}.game_cell{padding:12px;border-radius:14px}' },
  badges: { show: 'games', h: 500, zoom: 1 },
  // the scroll effects need a page taller than the box: the whole mock, stretched; the list thumbs
  // (not scrollable) start already scrolled, to show the effect midway
  reveal: { h: 520, scroll: 250, extra: '.game_column{max-width:360px;margin:0 auto}.user_game_grid{grid-template-columns:1fr!important}' },
  progress: { page: 'devlog', h: 520, scroll: 700, extra: '.user_formatted{min-height:1800px;background:repeating-linear-gradient(#0000 0 78px,#0001 78px 80px)}' },
  parallax: { h: 520, scroll: 150, extra: '#profile_header .text_header h1{font-size:4em;padding:60px 0}#wrapper{min-height:1500px}' },
  stagger: { h: 520, scroll: 330, extra: '.game_column{padding:440px 0 700px}' },
  unveil: { page: 'devlog', h: 520, scroll: 420, html: [['#ff2449', '#ffc857'], ['#2f27ce', '#38d9a9'], ['#7048e8', '#ff2449']].map(picture).join(''), extra: '.user_formatted img{display:block;width:100%;height:auto}#wrapper{min-height:1800px}' },
  zoom: { page: 'project', h: 520, scroll: 160, extra: '#header img{display:block!important;width:100%;height:340px;background:linear-gradient(135deg,#ff2449,#2f27ce);font-size:0;color:transparent}#wrapper{min-height:1600px}' },
  shrink: { h: 520, scroll: 140, extra: '#profile_header .text_header h1{font-size:3em}#wrapper{min-height:1600px}' },
  entrance: { h: 400, extra: '#profile_header .text_header h1{font-size:4em;padding:40px 0}' },
  lift: { show: 'games', h: 520, zoom: 1.3, extra: '.user_game_grid{grid-template-columns:repeat(3,1fr)!important}' },
  tilt: { show: 'games', h: 520, zoom: 1.3, extra: '.user_game_grid{grid-template-columns:repeat(3,1fr)!important}' },
  pagefade: { h: 520 },
};
// what to do in an idea's own preview to see it (ideas.<id> in locales/); 'replayHint' ones get a Replay
// that reloads the frame, so the load-time effects run (and re-roll) again
const HINTS = {
  reveal: 'scrollHint', stagger: 'scrollHint', unveil: 'scrollHint', progress: 'scrollHint', parallax: 'scrollHint', zoom: 'scrollHint', shrink: 'scrollHint',
  lift: 'hoverHint', pagefade: 'navHint', entrance: 'replayHint', tilt: 'replayHint',
};

// one idea on its own page: how it looks, and next to it what goes into itch (CSS, and HTML when it needs any)
export function IdeaPage({ idea }) {
  const { t } = useTranslation();
  const [again, setAgain] = useState(0); // +1 asks for a new sample: random effects come out different
  const [mode, setMode] = useState('light');
  useEffect(() => {
    if (matchMedia('(prefers-color-scheme: dark)').matches) setMode('dark');
  }, []);
  const [ctl, setCtl] = useState(() => ({
    foilColor: '#2f27ce', foilWidth: 1.5, foilSpeed: 1, foilSync: false,
    titleText: t('ideas.sampleName'), fonts: ['fraunces', 'inter', 'grotesk'],
    greetFirst: t('ideas.sampleHello'), greetOthers: GREETINGS.filter((g) => g !== t('ideas.sampleHello')).join('\n'),
  }));
  const [opts, setOpts] = useState(ctl);
  useEffect(() => {
    const id = setTimeout(() => setOpts(ctl), 250);
    return () => clearTimeout(id);
  }, [ctl]);
  const extra = idea === 'foil' ? { foil: opts }
    : idea === 'title' ? { title: { title: { text: opts.titleText, fonts: Object.keys(FONTS).filter((k) => opts.fonts.includes(k)) } } }
    : idea === 'greeting' ? { greeting: { greeting: { first: opts.greetFirst, others: opts.greetOthers.split('\n').map((s) => s.trim()).filter(Boolean) } } }
    : {};
  const found = useSamples([idea], again, extra)[idea];
  const sample = idea === 'scheme' && found?.css ? { ...found, css: forceScheme(found.css, mode) } : found;
  return (
    <>
    <Navbar current="/ideas" />
    <main className="mx-auto max-w-[1600px] px-4 pt-6 pb-12">
      <a className="text-sm text-muted-foreground underline underline-offset-4" href="/ideas">{t('ideas.back')}</a>
      <Title>{t(`ideas.${idea}_name`)}</Title>
      <Intro>{t(`ideas.${idea}_text`)}</Intro>
      <div className="mt-3"><PageChips idea={idea} /></div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <Card size="sm">
          <CardHeader><CardTitle><h2>{t('ideas.controls')}</h2></CardTitle></CardHeader>
          <div className="flex flex-col gap-3 px-3 pb-3">
            {idea === 'scheme' ? (
              <div className="flex gap-2">
                {['light', 'dark'].map((m) => (
                  <Button key={m} type="button" size="sm" variant={mode === m ? 'default' : 'outline'} aria-pressed={mode === m} onClick={() => setMode(m)}>
                    {t(`ideas.${m}`)}
                  </Button>
                ))}
              </div>
            ) : null}
            {idea === 'foil' && (
              <>
                <div className="flex items-center gap-2">
                  <Label htmlFor="foil-color">{t('ideas.foilColor')}</Label>
                  <input id="foil-color" type="color" className="h-8 w-11 cursor-pointer rounded-md border bg-transparent p-0.5" value={ctl.foilColor} onChange={(e) => setCtl((p) => ({ ...p, foilColor: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="foil-width">{t('ideas.foilWidth')}: {ctl.foilWidth} px</Label>
                  <input id="foil-width" type="range" min="1" max="4" step="0.5" className="w-full accent-primary" value={ctl.foilWidth} onChange={(e) => setCtl((p) => ({ ...p, foilWidth: Number(e.target.value) }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="foil-speed">{t('ideas.foilSpeed')}: {ctl.foilSpeed}×</Label>
                  <input id="foil-speed" type="range" min="0.5" max="3" step="0.25" className="w-full accent-primary" value={ctl.foilSpeed} onChange={(e) => setCtl((p) => ({ ...p, foilSpeed: Number(e.target.value) }))} />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" checked={ctl.foilSync} onChange={(e) => setCtl((p) => ({ ...p, foilSync: e.target.checked }))} />
                  {t('ideas.foilSync')}
                </label>
              </>
            )}
            {idea === 'title' && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="title-text">{t('ideasPanel.titleText')}</Label>
                  <Input id="title-text" maxLength={24} value={ctl.titleText} onChange={(e) => setCtl((p) => ({ ...p, titleText: e.target.value }))} />
                </div>
                <p className="text-sm text-muted-foreground">{t('ideasPanel.fonts')}</p>
                <div className="space-y-1.5">
                  {Object.entries(FONTS).map(([k, f]) => {
                    const on = ctl.fonts.includes(k);
                    return (
                      <FontCheck key={k} id={`font-${k}`} checked={on} disabled={on ? ctl.fonts.length <= 2 : ctl.fonts.length >= 4}
                        onChange={(v) => setCtl((p) => ({ ...p, fonts: v ? [...p.fonts, k] : p.fonts.filter((x) => x !== k) }))}>{f.name}</FontCheck>
                    );
                  })}
                </div>
              </>
            )}
            {idea === 'greeting' && (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="greeting-first">{t('ideasPanel.greetingFirst')}</Label>
                  <Input id="greeting-first" maxLength={40} value={ctl.greetFirst} onChange={(e) => setCtl((p) => ({ ...p, greetFirst: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="greeting-others">{t('ideasPanel.greetingOthers')}</Label>
                  <Textarea id="greeting-others" rows={5} value={ctl.greetOthers} onChange={(e) => setCtl((p) => ({ ...p, greetOthers: e.target.value }))} />
                </div>
              </>
            )}
            {HINTS[idea] && <p className="text-sm text-muted-foreground">{t(`ideas.${HINTS[idea]}`)}</p>}
            {idea !== 'scheme' && (!HINTS[idea] || HINTS[idea] === 'replayHint') && (
              <Button type="button" size="sm" className="mt-1 self-start" onClick={() => setAgain((n) => n + 1)}>{t('ideas.replay')}</Button>
            )}
          </div>
        </Card>
        <Card size="sm">
          <Tabs defaultValue="preview" className="px-3 pb-3">
            <TabsList>
              <TabsTrigger value="preview" className={TAB}>{t('ideas.preview')}</TabsTrigger>
              <TabsTrigger value="css" className={TAB}>CSS</TabsTrigger>
              {sample?.bio && <TabsTrigger value="html" className={TAB}>HTML</TabsTrigger>}
            </TabsList>
            {/* forceMount: the preview keeps its state (and its frame) while another tab shows */}
            <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden">
              <div className="overflow-hidden rounded-lg border"><IdeaThumb key={HINTS[idea] === 'replayHint' ? again : 0} idea={idea} sample={sample} interactive /></div>
            </TabsContent>
            <TabsContent value="css"><CodeBox lang="css" label={t('ideas.cssLabel')} text={sample?.css ?? ''} /></TabsContent>
            {sample?.bio && <TabsContent value="html"><CodeBox lang="html" label={t('ideas.htmlLabel')} text={sample.bio} /></TabsContent>}
          </Tabs>
        </Card>
      </div>
      <Button asChild variant="outline" size="sm" className="mt-6"><a href={`/?idea=${idea}`}>{t('ideas.use')}</a></Button>
    </main>
    </>
  );
}

export function Showcase() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState(null); // null: loading
  useEffect(() => {
    fetch('/api/showcase').then((r) => r.json()).then((d) => setEntries(d.entries), () => setEntries([]));
  }, []);
  return (
    <>
    <Navbar current="/showcase" />
    <Page>
      <Title>{t('showcase.title')}</Title>
      <Intro>{t('showcase.intro')}</Intro>
      <p className="mt-2 max-w-[72ch] text-muted-foreground"><Inline text={t('showcase.join')} /></p>
      <ul className={GRID} aria-live="polite">
        {entries === null && (
          <li aria-hidden="true">
            <Card className="h-full pt-0">
              <Skeleton className="aspect-[3/2] rounded-none" />
              <CardHeader><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/4" /></CardHeader>
              <CardFooter className="mt-auto"><Skeleton className="h-7 w-24" /></CardFooter>
            </Card>
          </li>
        )}
        {(entries ?? []).map(({ id, url, name, page }) => (
          <MockCard key={id} thumb={<SavedThumb id={id} page={page} bio={`<p>${t('showcase.sampleBio')}</p>`} />}>
            <CardHeader>
              <CardTitle><h2>{name || new URL(url).hostname}</h2></CardTitle>
              <CardDescription>{t(`pageNames.${page}`)}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button asChild size="sm"><a href={url} rel="noopener" target="_blank">{t('showcase.view')}</a></Button>
            </CardFooter>
          </MockCard>
        ))}
      </ul>
      <p className="mt-6 rounded-xl border border-dashed p-6 text-muted-foreground" hidden={entries === null || entries.length > 0}>{t('showcase.empty')}</p>
    </Page>
    </>
  );
}

const DECISIONS = [['approved', 'approve'], ['rejected', 'reject'], ['pending', 'leave']];

// The key is the ADMIN_KEY env var; it is kept only in this tab (sessionStorage).
export function Admin() {
  const { t, i18n } = useTranslation();
  const [key, setKey] = useState('');
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState(null); // { id, params }: a text of locales/

  async function call(method, body, k = key) {
    const res = await fetch(method === 'GET' ? '/api/showcase?all=1' : '/api/showcase', {
      method,
      headers: { Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  }
  async function load(k = key) {
    const { entries } = await call('GET', null, k);
    setEntries(entries);
    setStatus({ id: 'admin.count', params: { count: entries.length, pending: entries.filter((e) => e.status === 'pending').length } });
  }
  const fail = (err) => setStatus({ id: 'admin.failed', params: { error: err.message } });
  useEffect(() => {
    let saved = '';
    try {
      saved = sessionStorage.getItem('admin-key') ?? '';
    } catch {}
    if (!saved) return;
    setKey(saved);
    load(saved).catch(fail);
  }, []);

  async function login(ev) {
    ev.preventDefault();
    try {
      await load();
      try {
        sessionStorage.setItem('admin-key', key);
      } catch {}
    } catch (err) {
      fail(err);
    }
  }
  async function decide(id, decision) {
    try {
      await call('POST', { id, status: decision });
      await load();
    } catch (err) {
      fail(err);
    }
  }

  return (
    <>
    <Navbar current="/admin" />
    <Page>
      <Title>{t('admin.title')}</Title>
      <form className="mt-6 flex max-w-md items-end gap-2" onSubmit={login}>
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="admin-key">{t('admin.key')}</Label>
          <Input id="admin-key" type="password" autoComplete="off" required value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <Button type="submit">{t('admin.enter')}</Button>
      </form>
      <p role="status" className="mt-3 text-sm text-muted-foreground">{status && t(status.id, status.params)}</p>
      <ul className={GRID}>
        {entries.map((e) => (
          <MockCard key={e.id} thumb={<SavedThumb id={e.id} page={e.page} />}>
            <CardHeader>
              <CardTitle><h2>{e.name || t('admin.noName')}</h2></CardTitle>
              <CardDescription>{`${t(`pageNames.${e.page}`)} · ${t(`admin.${e.status}`)} · ${new Date(e.at).toLocaleDateString(i18n.language)}`}</CardDescription>
              <a className="text-sm break-all underline underline-offset-4" href={e.url} rel="noopener" target="_blank">{e.url}</a>
            </CardHeader>
            <CardFooter className="mt-auto flex-wrap gap-2">
              {DECISIONS.filter(([s]) => s !== e.status).map(([s, label]) => (
                <Button key={s} type="button" size="sm" variant={s === 'approved' ? 'default' : 'outline'} onClick={() => decide(e.id, s)}>{t(`admin.${label}`)}</Button>
              ))}
            </CardFooter>
          </MockCard>
        ))}
      </ul>
    </Page>
    </>
  );
}
