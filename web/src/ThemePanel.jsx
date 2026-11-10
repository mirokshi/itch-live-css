// A look-alike of itch's theme editor. Only changes the mock, never the served CSS; images stay in
// this browser. Rows marked data-only show for one page type (style.css, .app[data-page]).

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FONT_CHOICES } from './preview.js';

const HEX = /^#[0-9a-f]{6}$/i;

// a hex text box and a swatch, kept in step like itch's; a half-typed hex goes back on blur
function Colour({ label, value, onChange, only }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="trow" data-only={only}>
      <span>{label}</span>
      <span className="hex">
        <input value={draft} maxLength={7} spellCheck={false} aria-label={t('theme.hex', { label })} onBlur={() => setDraft(value)}
          onChange={(e) => {
            setDraft(e.target.value);
            if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }} />
        <input type="color" value={value} aria-label={label} onChange={(e) => onChange(e.target.value)} />
      </span>
    </div>
  );
}

// "More options..." folds, as in itch's editor
function More({ id, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="more-btn" data-only="project" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>More options...</button>
      <div id={id} className="more" data-only="project" hidden={!open}>{children}</div>
    </>
  );
}

// image uploads: read in the browser as data: URLs, never sent anywhere
const readImage = (onLoad) => (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => onLoad(reader.result);
  reader.readAsDataURL(file);
};

// itch's own labels (BG, Upload, More options...) stay in English, as on itch
export function ThemePanel({ hidden, theme, setTheme, images, setImages, onClose }) {
  const { t } = useTranslation();
  const set = (k) => (v) => setTheme((t) => ({ ...t, [k]: v }));
  const bind = (k) => ({ value: theme[k], onChange: (e) => set(k)(e.target.value) });
  const files = { bg: useRef(null), banner: useRef(null), bannerP: useRef(null) };
  const setImage = (k) => (url) => setImages((i) => ({ ...i, [k]: url }));
  const clear = (k, ...inputs) => () => {
    setImage(k)('');
    for (const i of inputs) i.current.value = '';
  };
  const box = (url) => ({ backgroundImage: url ? `url("${url}")` : undefined });
  const fonts = FONT_CHOICES.map((f) => <option key={f}>{f}</option>);

  return (
    <aside id="theme" className="itch-theme" aria-label={t('theme.label')} hidden={hidden}>
      <div className="theme-head">
        <p>{t('theme.head')}</p>
        <button type="button" className="theme-x" aria-label={t('theme.hide')} onClick={onClose}>&lsaquo;</button>
      </div>

      <h3>Color</h3>
      <Colour label="BG" value={theme.bg} onChange={set('bg')} />
      <Colour label="BG 2" value={theme.bg2} onChange={set('bg2')} only="project" />
      <Colour label="Text" value={theme.text} onChange={set('text')} />
      <Colour label="Link" value={theme.link} onChange={set('link')} />
      <More id="more-colour">
        <div className="trow"><label htmlFor="t-bg2a">BG2 Alpha</label><input type="range" id="t-bg2a" min="0" max="100" {...bind('bg2_alpha')} /></div>
        <Colour label="Buttons" value={theme.buttons} onChange={set('buttons')} />
        <Colour label="Headers" value={theme.headers} onChange={set('headers')} />
      </More>

      <h3>Text</h3>
      <div className="trow"><label htmlFor="t-font">Font</label><select id="t-font" {...bind('font')}>{fonts}</select></div>
      <div className="trow" data-only="profile"><label htmlFor="t-size">Size</label><input type="range" id="t-size" min="80" max="150" step="5" {...bind('size')} /></div>
      <div className="trow" data-only="project">
        <label htmlFor="t-psize">Size</label>
        <select id="t-psize" {...bind('psize')}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="very_large">Very large</option></select>
      </div>
      <More id="more-text">
        <div className="trow"><label htmlFor="t-hfont">Headings</label><select id="t-hfont" {...bind('hfont')}><option value="">Same as text</option>{fonts}</select></div>
      </More>

      <h3 data-only="project">Layout</h3>
      <div className="trow" data-only="project">
        <label htmlFor="t-shots">Screenshots</label>
        <select id="t-shots" {...bind('shots')}><option value="sidebar">Sidebar</option><option value="hidden">Hidden</option><option value="auto">Auto</option></select>
      </div>

      <h3>Images</h3>
      {/* profile: an Upload button; game page: an image box with its alignment */}
      <div className="trow" data-only="profile">
        <span>Banner</span>
        <label className="itch-btn">Upload<input type="file" accept="image/*" className="sr-only" ref={files.banner} onChange={readImage(setImage('banner'))} /></label>
      </div>
      <button type="button" className="itch-btn-outline" data-only="profile" hidden={!images.banner} onClick={clear('banner', files.banner, files.bannerP)}>Remove banner</button>
      <div className="tcol" data-only="project">
        <span>Banner</span>
        <label className={`bg-box${images.banner ? ' has-image' : ''}`} style={box(images.banner)}>
          <span className="itch-btn">Upload</span>
          <input type="file" accept="image/*" className="sr-only" ref={files.bannerP} onChange={readImage(setImage('banner'))} />
        </label>
      </div>
      <div data-only="project" hidden={!images.banner}>
        <div className="trow indent">
          <label htmlFor="t-balign">Align</label>
          <select id="t-balign" {...bind('balign')}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select>
        </div>
        <button type="button" className="itch-btn-outline" onClick={clear('banner', files.banner, files.bannerP)}>Remove image</button>
      </div>
      <div className="tcol">
        <span>Background</span>
        <label className={`bg-box${images.bg ? ' has-image' : ''}`} style={box(images.bg)}>
          <span className="itch-btn">Upload</span>
          <input type="file" accept="image/*" className="sr-only" ref={files.bg} onChange={readImage(setImage('bg'))} />
        </label>
      </div>
      <div hidden={!images.bg}>
        {/* repeat modes seen per page type (knowledge base §4.8): profiles repeat-x, projects repeat-y */}
        <div className="trow indent" data-only="profile">
          <label htmlFor="t-repeat">Repeat</label>
          <select id="t-repeat" {...bind('repeat')}><option value="no-repeat">None</option><option value="repeat">Repeat</option><option value="repeat-x">Horizontally</option></select>
        </div>
        <div className="trow indent" data-only="project">
          <label htmlFor="t-prepeat">Repeat</label>
          <select id="t-prepeat" {...bind('prepeat')}><option value="no-repeat">None</option><option value="repeat">Repeat</option><option value="repeat-y">Vertically</option></select>
        </div>
        <div className="trow indent">
          <label htmlFor="t-align">Align</label>
          <select id="t-align" {...bind('align')}><option value="0 0">Left</option><option value="50% 0">Center</option><option value="100% 0">Right</option></select>
        </div>
        <div className="trow indent"><label htmlFor="t-fixed">Fixed</label><input type="checkbox" id="t-fixed" checked={theme.fixed} onChange={(e) => set('fixed')(e.target.checked)} /></div>
        <button type="button" className="itch-btn-outline" onClick={clear('bg', files.bg)}>Remove image</button>
      </div>

      <h3 data-only="profile">My projects</h3>
      <div className="trow" data-only="profile">
        <label htmlFor="t-layout">Layout</label>
        <select id="t-layout" {...bind('layout')}><option value="grid">Grid</option><option value="column">Sidebar</option></select>
      </div>
      <div className="trow" data-only="profile"><label htmlFor="t-radius">B. Radius</label><input type="range" id="t-radius" min="0" max="30" {...bind('radius')} /></div>
    </aside>
  );
}
