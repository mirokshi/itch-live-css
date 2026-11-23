// The configurator: the user's CSS and HTML, the optional effects ("Ideas"), a mock of the page with
// itch's theme panel, the validator's problems, and what to take to itch (export.js decides: the
// CSS to paste, or the @import link). Saving is needed for the link, optional otherwise.

import { XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { FONTS } from '../../lib/fonts.js';
import { CodeEditor } from '../CodeEditor.jsx';
import { Copy, Inline, Navbar } from '../common.jsx';
import { exportFor } from '../export.js';
import { IDEA_PAGES, TOGGLES } from '../ideas.js';
import * as keychain from '../keychain.js';
import { applyTheme, itchSanitize, PAGES, THEME_COLOURS, THEME_DEFAULTS } from '../preview.js';
import { ThemePanel } from '../ThemePanel.jsx';

// the first texts of the effects are the user's to change, so they don't follow later language switches
const ideasDefaults = (t) => ({
  accent: '#d6336c',
  titleOn: false, titleText: t('editor.defaultTitle'), fonts: ['fraunces', 'inter', 'grotesk'],
  greetingOn: false, greetingFirst: t('editor.defaultGreeting'), greetingOthers: 'Hello!\nBonjour !\nHallo!\nOlá!\nCiao!',
  foil: false, foilColor: '#2f27ce', foilWidth: 1.5, foilSpeed: 1, foilSync: false, badges: false, ascii: false, scheme: false,
  ...Object.fromEntries(TOGGLES.map((k) => [k, false])),
});
const IDEA_FIELDS = { title: 'titleOn', greeting: 'greetingOn', foil: 'foil', badges: 'badges', ascii: 'ascii', scheme: 'scheme', ...Object.fromEntries(TOGGLES.map((k) => [k, k])) };

async function api(path, method, body, auth) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && { Authorization: `Bearer ${auth}` }) },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

const Hint = ({ children, className = '' }) => <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
const Section = ({ title, children, ...props }) => (
  <section className="mt-6 space-y-2" {...props}>
    {title && <h2 className="text-sm font-medium">{title}</h2>}
    {children}
  </section>
);

// a read-only field with its copy button
// a checkbox with its label (Radix checkbox: a button with role="checkbox")
function Check({ id, checked, onChange, children }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id}>{children}</Label>
    </div>
  );
}

// the validator's problems under the editor, each with its rule from the knowledge base
function Lint({ lint }) {
  const { t } = useTranslation();
  if (!lint) return <div aria-live="polite" />;
  if (lint.error) return <div aria-live="polite"><Hint>{t('lint.failed', { error: lint.error })}</Hint></div>;
  const errors = lint.problems.filter((p) => p.level === 'error').length;
  const warnings = lint.problems.length - errors;
  return (
    <div aria-live="polite" className="space-y-2">
      <Hint>
        {lint.problems.length
          ? t('lint.summary', { errors: t('lint.errors', { count: errors }), warnings: t('lint.warnings', { count: warnings }) })
          : t('lint.none')}
      </Hint>
      {lint.problems.length > 0 && (
        <ul className="max-h-56 space-y-2 overflow-y-auto">
          {lint.problems.map(({ rule, level, title, message, line }, i) => (
            <li key={i}>
              <Alert variant={level === 'error' ? 'destructive' : 'default'} className={level === 'error' ? '' : 'border-muted-foreground/60'}>
                <AlertTitle className="whitespace-normal">
                  {[t(`lint.${level}`), rule === 'syntax' ? null : rule, title, line && t('lint.line', { line })].filter(Boolean).join(' · ')}
                </AlertTitle>
                <AlertDescription className="break-all">{message}</AlertDescription>
              </Alert>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Editor() {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState('profile');
  const [css, setCss] = useState('');
  const [html, setHtml] = useState('');
  const [html5, setHtml5] = useState(false); // a project's game runs in the browser: itch hides its title (R20)
  const [ideas, setIdeas] = useState(() => ideasDefaults(t));
  const [showcase, setShowcase] = useState({ on: false, url: '', name: '' });
  const [theme, setTheme] = useState(THEME_DEFAULTS);
  const [images, setImages] = useState({ bg: '', banner: '' });
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(true);
  const [saved, setSaved] = useState(null); // { id, key }
  const [exported, setExported] = useState(null); // the last save's { bio, link, showcase }
  const [status, setStatus] = useState(null); // { id, params }: a text of locales/
  const [lint, setLint] = useState(null); // { text, problems } | { error }
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // 'css' | 'html' while in the dialog
  const [asking, setAsking] = useState(false); // the save dialog, with the showcase consent

  const served = page !== 'jam'; // a jam's CSS sits inside the page: no link, so no per-visit effects (nor scheme)
  const config = {
    page,
    accent: ideas.accent,
    title: served && ideas.titleOn ? { text: ideas.titleText, fonts: Object.keys(FONTS).filter((k) => ideas.fonts.includes(k)) } : null,
    greeting: served && ideas.greetingOn
      ? { first: ideas.greetingFirst, others: ideas.greetingOthers.split('\n').map((s) => s.trim()).filter(Boolean) }
      : null,
    foil: page === 'profile' && ideas.foil,
    foilColor: ideas.foilColor,
    foilWidth: Number(ideas.foilWidth),
    foilSpeed: Number(ideas.foilSpeed),
    foilSync: !!ideas.foilSync,
    badges: page === 'profile' && ideas.badges,
    ascii: served && ideas.ascii,
    scheme: served && ideas.scheme,
    ...Object.fromEntries(TOGGLES.map((k) => [k, IDEA_PAGES[k].includes(page) && ideas[k]])),
    css,
    html,
    html5: (page === 'project' || page === 'devlog') && html5,
    showcase: showcase.on ? { url: showcase.url.trim(), name: showcase.name } : null,
  };
  const out = exportFor(config);
  const num = (n) => n.toLocaleString(i18n.language);
  // the validator's problems in the viewer's language: rule titles and messages by id
  const shownLint = useMemo(() => lint?.problems
    ? { text: lint.text, problems: lint.problems.map((pr) => ({
      ...pr,
      title: pr.rule === 'syntax' ? t('lint.syntax') : t(`rules.${pr.rule}`),
      message: pr.code ? t(`validator.${pr.code}`, pr.params) : pr.message,
    })) }
    : lint, [lint, i18n.language]);

  // The preview iframe is same-origin: the CSS and the bio go straight into its DOM.
  // · effects (server, random): style#live, behind a loading screen so the swap doesn't jump;
  // · the user's CSS and HTML: style#custom_css and the bio, without re-rolling the effects;
  // · the theme panel: what itch's theme editor would write.
  const frame = useRef(null);
  const effects = useRef({ bio: '' });
  const latest = useRef();
  latest.current = { config, theme, images, page, sample: `<p>${t(`pages.${page}.sample`)}</p>` };
  const doc = () => frame.current?.contentDocument;
  const ready = () => !!doc()?.getElementById('bio');

  function applyUser() {
    if (!ready()) return;
    const { config, theme, images, sample } = latest.current;
    applyTheme(doc(), theme, images);
    doc().getElementById('custom_css').textContent = config.css;
    doc().getElementById('bio').innerHTML = config.html.trim() ? itchSanitize(config.html) : effects.current.bio + sample;
  }

  const timer = useRef();
  const generation = useRef(0);
  // delay: wait for the user to stop typing; 0 when the preview (re)loads, so it shows at once
  function refreshEffects(delay = 300) {
    clearTimeout(timer.current);
    if (delay === 0) setLoading(true); // edits re-roll the effects in place: no cover, or it flashes on every keystroke
    timer.current = setTimeout(async () => {
      const mine = ++generation.current;
      try {
        const { css, bio } = await api('/api/preview', 'POST', { ...latest.current.config, css: '', html: '' });
        if (mine !== generation.current || !ready()) return; // a newer change, or a reload, is on its way
        doc().getElementById('live').textContent = css;
        effects.current = { bio };
        applyUser();
        await doc().fonts.ready;
        setStatus(null);
      } catch (err) {
        setStatus({ id: 'editor.error', params: { error: err.message } });
      }
      if (mine === generation.current) setLoading(false);
    }, delay);
  }

  // effects: when an idea changes (a page switch reloads the mock, whose load refreshes them)
  const effectsKey = JSON.stringify([config.accent, config.title, config.greeting, ideas.foil, ideas.foilColor, ideas.foilWidth, ideas.foilSpeed, ideas.foilSync, ideas.badges, config.ascii, config.scheme, ...TOGGLES.map((k) => config[k])]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else refreshEffects();
  }, [effectsKey]);

  // the user's CSS and HTML, a moment after typing stops
  useEffect(() => {
    const timer = setTimeout(applyUser, 200);
    return () => clearTimeout(timer);
  }, [css, html, i18n.language]);

  useEffect(() => {
    if (ready()) applyTheme(doc(), theme, images);
  }, [theme, images]);

  // the validator, a moment after typing stops (the problems quote the user's selectors: React escapes them);
  // with the HTML, the banner and the HTML5 box it also counts the page's h1s (R20)
  const lintRun = useRef(0);
  const banner = !!images.banner;
  useEffect(() => {
    const timer = setTimeout(async () => {
      const mine = ++lintRun.current;
      if (!css.trim() && !html.trim()) return setLint(null);
      try {
        const { problems } = await api('/api/validate', 'POST', { css, page, html, banner, html5: config.html5 });
        if (mine === lintRun.current) setLint({ text: css, problems });
      } catch (err) {
        if (mine === lintRun.current) setLint({ error: err.message });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [css, page, html, banner, config.html5]);

  // The page type: its mock (whose load refreshes everything) and its theme's default colours.
  function choosePage(next) {
    setPage(next);
    setTheme((t) => ({ ...t, ...THEME_COLOURS[next === 'profile' || next === 'jam' ? next : 'game'] }));
  }

  function fillForm(f) {
    choosePage(f.page ?? 'profile');
    setIdeas((i) => ({
      ...i,
      accent: f.accent,
      titleOn: !!f.title,
      ...(f.title && { titleText: f.title.text, fonts: f.title.fonts }),
      greetingOn: !!f.greeting,
      ...(f.greeting && { greetingFirst: f.greeting.first, greetingOthers: f.greeting.others.join('\n') }),
      foil: !!(f.foil ?? f.cards),
      foilColor: f.foilColor ?? (f.cards ? '#ffc857' : '#2f27ce'),
      foilWidth: f.foilWidth ?? 1.5,
      foilSpeed: f.foilSpeed ?? 1,
      foilSync: !!f.foilSync,
      badges: !!(f.badges ?? f.cards),
      ascii: f.ascii,
      scheme: !!f.scheme,
      ...Object.fromEntries(TOGGLES.map((k) => [k, !!f[k]])),
    }));
    setCss(f.css ?? '');
    setHtml(f.html ?? '');
    setHtml5(!!f.html5);
    setShowcase({ on: !!f.showcase, url: f.showcase?.url ?? '', name: f.showcase?.name ?? '' });
  }

  const ideasPanel = useRef(null);
  const themeButton = useRef(null);
  useEffect(() => {
    if (ideasOpen) ideasPanel.current.scrollIntoView({ block: 'start' }); // on phones the panel sits below the preview
  }, [ideasOpen]);

  useEffect(() => {
    // the preview may have loaded before this script ran
    if (doc()?.readyState === 'complete' && ready()) refreshEffects(0);
    // ?idea=<key>, from the ideas page: turn that effect on and open the ideas panel
    const idea = new URLSearchParams(location.search).get('idea');
    if (Object.hasOwn(IDEA_FIELDS, idea)) {
      if (idea === 'foil' || idea === 'badges') choosePage('profile'); // the cards effects only exist on profiles
      setIdeas((i) => ({ ...i, [IDEA_FIELDS[idea]]: true }));
      setIdeasOpen(true);
    }
    // The edit link carries "id.key" in the fragment, so the key never reaches a server log or a Referer.
    const [id, key] = (location.hash.match(/^#edit=([\w-]+)\.([\w-]+)$/) ?? []).slice(1);
    if (id) {
      api(`/api/configs?id=${id}`, 'GET', null, key).then(
        (got) => {
          setSaved({ id, key });
          keychain.merge([{ id, key, page: got.form.page ?? 'profile', name: '' }]); // an edit link opened on a new device
          fillForm(got.form);
          setExported(got);
        },
        (err) => setStatus({ id: 'editor.editFailed', params: { error: err.message } }),
      );
    }
  }, []);

  // The dialog only asks for the showcase consent: cancelling still saves, without the showcase.
  async function save(e, share = true) {
    e?.preventDefault();
    e?.stopPropagation(); // the dialog sits in a portal: its submit would bubble to the outer form
    setAsking(false);
    const body = share ? config : { ...config, showcase: null };
    try {
      let got;
      if (saved) got = await api(`/api/configs?id=${saved.id}`, 'PUT', body, saved.key);
      else {
        got = await api('/api/configs', 'POST', body);
        setSaved({ id: got.id, key: got.key });
        keychain.merge([{ id: got.id, key: got.key, page, name: '' }]);
        history.replaceState(null, '', `#edit=${got.id}.${got.key}`);
      }
      setExported(got);
      setStatus({ id: 'editor.saved' });
    } catch (err) {
      setStatus({ id: 'editor.error', params: { error: err.message } });
    }
  }

  // "Dar formato" (js-beautify, loaded on first use) and "Ampliar": a dialog the editor itself moves
  // into, so its text, cursor and undo history stay; it goes back to its place before the dialog
  // closes (Radix then returns focus to the "Ampliar" button).
  const views = { css: useRef(null), html: useRef(null) };
  const home = useRef(null);
  async function tidy(key) {
    try {
      const { default: beautify } = await import('js-beautify');
      if (key === 'css') setCss((s) => beautify.css(s, { indent_size: 2 }));
      else setHtml((s) => beautify.html(s, { indent_size: 2, wrap_line_length: 0 }));
    } catch {
      setStatus({ id: 'editor.tidyFailed' });
    }
  }
  // a callback ref: Radix mounts the dialog's content in a portal a render later than `expanded` changes
  const moveIn = useCallback((el) => {
    if (!el || !expanded) return;
    const view = views[expanded].current;
    home.current = view.dom.parentNode;
    el.append(view.dom);
    view.focus();
  }, [expanded]);
  function collapse() {
    home.current.append(views[expanded].current.dom);
    setExpanded(null);
  }

  // for your own service (service/ in the repo): the form without the preview-only HTML and the showcase
  function downloadConfig() {
    const { html: _html, showcase: _showcase, ...form } = config;
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(form, null, 2)}\n`], { type: 'application/json' }));
    Object.assign(document.createElement('a'), { href: url, download: 'config.json' }).click();
    URL.revokeObjectURL(url);
  }

  const editLink = saved && `${location.origin}/#edit=${saved.id}.${saved.key}`;
  const setIdea = (k) => (v) => setIdeas((i) => ({ ...i, [k]: v?.target ? v.target.value : v }));
  const toggleFont = (k) => (on) => setIdeas((i) => ({ ...i, fonts: on ? [...i.fonts, k] : i.fonts.filter((f) => f !== k) }));
  const setShow = (k) => (v) => setShowcase((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));
  const tools = (key) => (
    <div className="flex justify-end gap-1.5">
      <Button type="button" variant="ghost" size="sm" onClick={() => tidy(key)}>{t('editor.format')}</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setExpanded(key)}>{t('editor.expand')}</Button>
    </div>
  );

  return (
    <>
      <Navbar current="/" />
      <form className={`app${ideasOpen ? ' ideas-open' : ''}`} data-page={page} autoComplete="off" onSubmit={(e) => { e.preventDefault(); setAsking(true); }}>
        <section className="panel">
          <h1 className="sr-only">{t('titles.editor')}</h1>
          <Hint>{t('editor.lead')}</Hint>

          {/* each saved CSS is for one kind of page; a devlog uses its game's CSS */}
          <Section title={<span id="page-label">{t('editor.where')}</span>}>
            <ToggleGroup type="single" variant="outline" value={page} onValueChange={(v) => v && choosePage(v)} aria-labelledby="page-label">
              {Object.keys(PAGES).map((v) => <ToggleGroupItem key={v} value={v}>{t(`pageNames.${v}`)}</ToggleGroupItem>)}
            </ToggleGroup>
            <Hint>{t(`pages.${page}.hint`)}</Hint>
            {(page === 'project' || page === 'devlog') && <Check id="html5" checked={html5} onChange={setHtml5}>{t('editor.html5')}</Check>}
          </Section>

          <Section title={t('editor.cssLegend')}>
            <Hint>{t('editor.cssHint')}</Hint>
            {tools('css')}
            <CodeEditor lang="css" label={t('editor.cssLegend')} value={css} onChange={setCss} lint={shownLint?.problems ? shownLint : null} viewRef={views.css} />
            <Lint lint={shownLint} />
          </Section>

          <Section title={t(`pages.${page}.html`)}>
            <Hint><Inline text={t('editor.htmlHint')} /></Hint>
            {tools('html')}
            <CodeEditor lang="html" label={t(`pages.${page}.html`)} value={html} onChange={setHtml} viewRef={views.html} />
          </Section>

          {/* nothing to take to itch yet (no CSS, no effects): no card */}
          {(out.mode === 'import' || out.css) && (
          <Card className="mt-6" aria-live="polite">
            <CardHeader>
              <CardTitle><h2>{t('export.title')}</h2></CardTitle>
              {out.mode === 'paste' ? (
                <CardDescription>
                  {t('export.paste', { into: t(`pages.${page}.into`) })}{' '}
                  {page === 'jam'
                    ? t(out.over ? 'export.jamOver' : 'export.jamSize', { chars: num(out.chars), max: num(out.max) })
                    : out.max ? t('export.size', { bytes: num(out.bytes), max: num(out.max) }) : t('export.noLimit')}
                </CardDescription>
              ) : (
                <CardDescription>
                  {out.reason === 'effects'
                    ? t(exported ? 'export.effectsSaved' : 'export.effects', {
                      effects: ['title', 'greeting', 'foil', 'badges', 'ascii'].filter((k) => config[k]).map((k) => t(`ideasPanel.${k}Label`)).join(', '),
                    })
                    : t(exported ? 'export.tooBigSaved' : 'export.tooBig', { bytes: num(out.bytes), max: num(out.max) })}
                </CardDescription>
              )}
            </CardHeader>
            {out.mode === 'paste' && out.css && (
              <CardContent className="space-y-2">
                <Copy text={out.css} rows={3} label={t('export.pasteLabel')} pretty="css" />
                <Hint>{t('export.optional')}</Hint>
              </CardContent>
            )}
            {out.mode === 'import' && exported && (
              <CardContent className="space-y-2">
                <Hint><Inline text={t('result.linkHint', { where: t(`pages.${page}.where`) })} /></Hint>
                <Copy text={exported.link} label={t('result.linkLabel')} />
              </CardContent>
            )}
            {out.mode === 'import' && (
              <CardContent className="space-y-2">
                <Hint><Inline text={t('export.own')} /></Hint>
                <Button type="button" variant="outline" size="sm" onClick={downloadConfig}>{t('export.ownButton')}</Button>
              </CardContent>
            )}
          </Card>
          )}

          <p role="status" className="mt-6 min-h-6 text-sm text-muted-foreground">{status && t(status.id, status.params)}</p>
          <Hint>{t('editor.exportNote')}</Hint>
          <div className="mt-4 flex justify-end">
            <Button type="submit">{t('editor.proceed')}</Button>
          </div>

          {exported && (
            <Card className="mt-6">
              <CardContent className="space-y-3">
                {exported.bio && (
                  <>
                    <Hint>{t('result.bioHint', { text: t(`pages.${page}.text`) })}</Hint>
                    <Copy text={exported.bio} rows={3} label={t('result.bioLabel')} pretty="html" />
                  </>
                )}
                <Hint>{t('result.editHint')}</Hint>
                <Copy text={editLink ?? ''} label={t('result.editLabel')} />
                <Hint><Inline text={t('result.keysHint')} /></Hint>
                <Hint>{t(out.mode === 'import' ? 'result.againLink' : 'result.againPaste')}</Hint>
                {exported.showcase && <Hint>{t(`showcaseForm.${exported.showcase}`)}</Hint>}
              </CardContent>
            </Card>
          )}
        </section>

        <div className={`stage${loading ? ' is-loading' : ''}`}>
          <div className="stage-main">
            {/* the framed box holds itch's theme panel and the simulated page side by side */}
            <div className="sim">
              <ThemePanel hidden={!themeOpen} theme={theme} setTheme={setTheme} images={images} setImages={setImages}
                onClose={() => {
                  setThemeOpen(false);
                  requestAnimationFrame(() => themeButton.current.focus());
                }} />
              <Button type="button" variant="outline" size="sm" className="absolute top-2.5 left-2.5 z-10" hidden={themeOpen} ref={themeButton} onClick={() => setThemeOpen(true)}>
                {t('editor.themeOpen')}
              </Button>
              {/* no allow-scripts: nothing pasted into the preview can run; allow-same-origin lets this page fill it */}
              <div className="relative flex min-h-0 min-w-0 flex-1">
                <iframe ref={frame} src={PAGES[page].file} title={t(`pages.${page}.title`)} sandbox="allow-same-origin" onLoad={() => refreshEffects(0)} />
                {/* a page-shaped skeleton over the preview, only while the preview itself (re)loads */}
                <div className="loading absolute inset-0 space-y-4 bg-white p-6" aria-hidden="true">
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-64 w-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside id="ideas" className="panel space-y-4" hidden={!ideasOpen} ref={ideasPanel}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">{t('ideasPanel.title')}</h2>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t('ideasPanel.close')} onClick={() => setIdeasOpen(false)}><XIcon /></Button>
          </div>
          <Hint>{t('ideasPanel.hint')}</Hint>
          <div className="flex items-center gap-3">
            <Label htmlFor="accent">{t('ideasPanel.accent')}</Label>
            <input id="accent" type="color" className="h-8 w-11 cursor-pointer rounded-md border bg-transparent p-0.5" value={ideas.accent} onChange={setIdea('accent')} />
          </div>
          <Card size="sm" data-only="profile project">
            <CardContent className="space-y-2">
              <Check id="title-on" checked={ideas.titleOn} onChange={setIdea('titleOn')}>{t('ideasPanel.titleLabel')}</Check>
              <Hint>{t('ideasPanel.titleHint')}</Hint>
              <div className="grid gap-1.5">
                <Label htmlFor="title-text">{t('ideasPanel.titleText')}</Label>
                <Input id="title-text" maxLength={24} value={ideas.titleText} onChange={setIdea('titleText')} />
              </div>
              <Hint>{t('ideasPanel.fonts')}</Hint>
              <div className="space-y-1.5">
                {Object.entries(FONTS).map(([k, f]) => (
                  <Check key={k} id={`font-${k}`} checked={ideas.fonts.includes(k)} onChange={toggleFont(k)}>{f.name}</Check>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card size="sm" data-only="profile project">
            <CardContent className="space-y-2">
              <Check id="greeting-on" checked={ideas.greetingOn} onChange={setIdea('greetingOn')}>{t('ideasPanel.greetingLabel')}</Check>
              <Hint>{t('ideasPanel.greetingHint')}</Hint>
              <div className="grid gap-1.5">
                <Label htmlFor="greeting-first">{t('ideasPanel.greetingFirst')}</Label>
                <Input id="greeting-first" maxLength={40} value={ideas.greetingFirst} onChange={setIdea('greetingFirst')} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="greeting-others">{t('ideasPanel.greetingOthers')}</Label>
                <Textarea id="greeting-others" rows={5} value={ideas.greetingOthers} onChange={setIdea('greetingOthers')} />
              </div>
            </CardContent>
          </Card>
          <Card size="sm" data-only="profile">
            <CardContent className="space-y-2">
              <Check id="foil-on" checked={ideas.foil} onChange={setIdea('foil')}>{t('ideasPanel.foilLabel')}</Check>
              <Hint>{t('ideasPanel.foilHint')}</Hint>
              {ideas.foil && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="foil-color">{t('ideasPanel.foilColor')}</Label>
                  <input id="foil-color" type="color" className="h-8 w-11 cursor-pointer rounded-md border bg-transparent p-0.5" value={ideas.foilColor} onChange={setIdea('foilColor')} />
                </div>
              )}
              {ideas.foil && (
                <div className="grid gap-1.5">
                  <Label htmlFor="foil-width">{t('ideasPanel.foilWidth')}: {ideas.foilWidth} px</Label>
                  <input id="foil-width" type="range" min="1" max="4" step="0.5" className="w-full accent-primary" value={ideas.foilWidth} onChange={setIdea('foilWidth')} />
                </div>
              )}
              {ideas.foil && (
                <div className="grid gap-1.5">
                  <Label htmlFor="foil-speed">{t('ideasPanel.foilSpeed')}: {ideas.foilSpeed}×</Label>
                  <input id="foil-speed" type="range" min="0.5" max="3" step="0.25" className="w-full accent-primary" value={ideas.foilSpeed} onChange={setIdea('foilSpeed')} />
                </div>
              )}
              {ideas.foil && <Check id="foil-sync" checked={ideas.foilSync} onChange={setIdea('foilSync')}>{t('ideasPanel.foilSync')}</Check>}
            </CardContent>
          </Card>
          <Card size="sm" data-only="profile">
            <CardContent className="space-y-2">
              <Check id="badges-on" checked={ideas.badges} onChange={setIdea('badges')}>{t('ideasPanel.badgesLabel')}</Check>
              <Hint>{t('ideasPanel.badgesHint')}</Hint>
            </CardContent>
          </Card>
          <Card size="sm" data-only="profile project">
            <CardContent className="space-y-2">
              <Check id="ascii-on" checked={ideas.ascii} onChange={setIdea('ascii')}>{t('ideasPanel.asciiLabel')}</Check>
              <Hint>{t('ideasPanel.asciiHint')}</Hint>
            </CardContent>
          </Card>
          <Card size="sm" data-only="profile project">
            <CardContent className="space-y-2">
              <Check id="scheme-on" checked={ideas.scheme} onChange={setIdea('scheme')}>{t('ideasPanel.schemeLabel')}</Check>
              <Hint>{t('ideasPanel.schemeHint')}</Hint>
            </CardContent>
          </Card>
          {TOGGLES.map((k) => (
            // data-only: the page types whose controls show it (a devlog uses the project's)
            <Card size="sm" key={k} data-only={[...new Set(IDEA_PAGES[k].map((p) => (p === 'devlog' ? 'project' : p)))].join(' ')}>
              <CardContent className="space-y-2">
                <Check id={`${k}-on`} checked={ideas[k]} onChange={setIdea(k)}>{t(`ideasPanel.${k}Label`)}</Check>
                <Hint>{t(`ideasPanel.${k}Hint`)}</Hint>
              </CardContent>
            </Card>
          ))}
        </aside>
      </form>

      <Dialog open={asking} onOpenChange={(open) => (open ? setAsking(true) : save(null, false))}>
        <DialogContent className="sm:max-w-md">
          <form className="space-y-4" onSubmit={save}>
            <DialogHeader>
              <DialogTitle>{t('showcaseForm.title')}</DialogTitle>
              <DialogDescription><Inline text={t('showcaseForm.hint')} /></DialogDescription>
            </DialogHeader>
            <Check id="showcase-on" checked={showcase.on} onChange={setShow('on')}>{t('showcaseForm.label')}</Check>
            <div className="grid gap-1.5">
              <Label htmlFor="showcase-url">{t('showcaseForm.url')}</Label>
              <Input id="showcase-url" type="url" required={showcase.on} disabled={!showcase.on} placeholder={t('showcaseForm.urlPlaceholder')} maxLength={200} value={showcase.url} onChange={setShow('url')} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="showcase-name">{t('showcaseForm.name')}</Label>
              <Input id="showcase-name" disabled={!showcase.on} maxLength={40} value={showcase.name} onChange={setShow('name')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => save(null, false)}>{t('showcaseForm.cancel')}</Button>
              <Button type="submit">{t('editor.proceed')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!expanded} onOpenChange={(open) => !open && collapse()}>
        <DialogContent className="flex h-[min(85vh,900px)] flex-col sm:max-w-[min(1100px,calc(100vw-32px))]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{expanded === 'html' ? t(`pages.${page}.html`) : t('editor.cssLegend')}</DialogTitle>
            <DialogDescription className="sr-only">{t('editor.expand')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => tidy(expanded)}>{t('editor.format')}</Button>
          </div>
          <div className="dialog-body min-h-0 flex-1" ref={moveIn} />
        </DialogContent>
      </Dialog>
    </>
  );
}
