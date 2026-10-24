// A page mock shrunk into a card: thumb(container, { page, css, bio }). The iframe has no
// allow-scripts (nothing in it runs); allow-same-origin lets this page fill it, as the editor does.
export const MOCKS = { profile: 'preview.html', project: 'preview-project.html', devlog: 'preview-devlog.html' };
export const PAGE_NAMES = { profile: 'Perfil', project: 'Página de juego', devlog: 'Devlog' };

const fit = new ResizeObserver((entries) => {
  for (const { target, contentRect } of entries) target.style.setProperty('--scale', String(contentRect.width / 1200));
});

export function thumb(container, { page = 'profile', css = '', bio = '' }) {
  const frame = Object.assign(document.createElement('iframe'), {
    src: MOCKS[page] ?? MOCKS.profile,
    title: `Vista previa: ${PAGE_NAMES[page] ?? page}`,
    tabIndex: -1,
    loading: 'lazy',
  });
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.setAttribute('aria-hidden', 'true');
  frame.addEventListener('load', () => {
    const d = frame.contentDocument;
    d.getElementById('live').textContent = css;
    d.getElementById('bio').innerHTML = bio; // our own text only, never a user's HTML
  });
  container.append(frame);
  fit.observe(container);
  return frame;
}
