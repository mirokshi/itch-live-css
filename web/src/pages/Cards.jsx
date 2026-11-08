// The card pages: ideas (one live sample per effect), the public showcase and its admin review.
// Names and URLs in the showcase come from users: React escapes them, and links only point at the
// itch.io addresses the API checked.

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CodeEditor } from '../CodeEditor.jsx';
import { CopyButton, Inline, Navbar, SavedThumb, Thumb } from '../common.jsx';
import { Page, Title } from './Content.jsx';

const BASE = { page: 'profile', accent: '#d6336c', title: null, greeting: null, cards: false, ascii: false };
export const IDEAS = ['title', 'greeting', 'cards', 'ascii', 'scheme'];
const GREETINGS = ['¡Hola!', 'Hello!', 'Bonjour !', 'Hallo!', 'Olá!', 'Ciao!'];

const GRID = 'mt-6 grid list-none grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 p-0';
// a card with a page mock on top, flush, as an image would be
const MockCard = ({ thumb, children }) => <li><Card className="h-full pt-0">{thumb}{children}</Card></li>;
const Intro = ({ children }) => <p className="mt-4 max-w-[72ch] text-muted-foreground">{children}</p>;

// the server renders only that effect, on a sample page (the sample texts follow the language)
const sampleForm = (t) => ({
  title: { title: { text: t('ideas.sampleName'), fonts: ['fraunces', 'inter', 'grotesk'] } },
  greeting: { greeting: { first: t('ideas.sampleHello'), others: GREETINGS.filter((g) => g !== t('ideas.sampleHello')) } },
  cards: { cards: true },
  ascii: { ascii: true },
  scheme: { scheme: true },
});

// { idea: { css, bio } } for these ideas, filled as the answers arrive (css null: still loading)
function useSamples(ideas) {
  const { t, i18n } = useTranslation();
  const [samples, setSamples] = useState({});
  useEffect(() => {
    let live = true;
    const put = (idea, sample) => live && setSamples((s) => ({ ...s, [idea]: sample }));
    const forms = sampleForm(t);
    for (const idea of ideas) {
      fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...BASE, ...forms[idea] }) })
        .then((r) => r.json())
        .then(({ css, bio }) => put(idea, { css, bio }), () => put(idea, { css: '', bio: '' }));
    }
    return () => { live = false; };
  }, [i18n.language]);
  return samples;
}

function IdeaThumb({ sample }) {
  const { t } = useTranslation();
  return <Thumb css={sample?.css ?? null} bio={`${sample?.bio ?? ''}<p>${t('ideas.sampleBio')}</p>`} />;
}

// read-only code (CodeMirror) with a copy button
function CodeBox({ lang, label, text }) {
  const view = useRef(null);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <CopyButton get={() => text} />
      </div>
      <div className="cm-tall"><CodeEditor lang={lang} label={label} value={text} viewRef={view} readOnly /></div>
    </div>
  );
}

export const ideaUrl = (idea) => `/ideas/${idea}.html`;

export function Ideas() {
  const { t } = useTranslation();
  const samples = useSamples(IDEAS);
  return (
    <>
    <Navbar current="/ideas.html" />
    <Page>
      <Title>{t('ideas.title')}</Title>
      <Intro>{t('ideas.intro')}</Intro>
      <ul className={GRID}>
        {IDEAS.map((idea) => (
          <MockCard key={idea} thumb={<IdeaThumb sample={samples[idea]} />}>
            <CardHeader>
              <CardTitle><h2>{t(`ideas.${idea}_name`)}</h2></CardTitle>
              <CardDescription>{t(`ideas.${idea}_text`)}</CardDescription>
              <CardDescription>{t(`ideas.${idea}_pages`)}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto">
              <Button asChild size="sm"><a href={ideaUrl(idea)}>{t('ideas.show')}</a></Button>
            </CardFooter>
          </MockCard>
        ))}
      </ul>
    </Page>
    </>
  );
}

// one idea on its own page: how it looks, and next to it what goes into itch (CSS, and HTML when it needs any)
export function IdeaPage({ idea }) {
  const { t } = useTranslation();
  const sample = useSamples([idea])[idea];
  return (
    <>
    <Navbar current="/ideas.html" />
    <main className="mx-auto max-w-[1600px] px-4 pt-6 pb-12">
      <a className="text-sm text-muted-foreground underline underline-offset-4" href="/ideas.html">{t('ideas.back')}</a>
      <Title>{t(`ideas.${idea}_name`)}</Title>
      <Intro>{t(`ideas.${idea}_text`)} {t(`ideas.${idea}_pages`)}.</Intro>
      <Card className="mt-6 pt-0"><IdeaThumb sample={sample} /></Card>
      <div className="mt-6 space-y-5">
        <CodeBox lang="css" label={t('ideas.cssLabel')} text={sample?.css ?? ''} />
        {sample?.bio && <CodeBox lang="html" label={t('ideas.htmlLabel')} text={sample.bio} />}
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
    <Navbar current="/showcase.html" />
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
    <Navbar current="/admin.html" />
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
