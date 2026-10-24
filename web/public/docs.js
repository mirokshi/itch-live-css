// Language toggle: shows the Spanish or the English blocks. First visit: the browser's language;
// after that, the last choice (per viewer, in localStorage, optional).
const buttons = document.querySelectorAll('.lang button');
function show(lang) {
  document.body.dataset.show = lang;
  document.documentElement.lang = lang;
  for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.set === lang));
  try {
    localStorage.setItem('docs-lang', lang);
  } catch {}
}
let saved = null;
try {
  saved = localStorage.getItem('docs-lang');
} catch {}
show(saved ?? (navigator.language.startsWith('es') ? 'es' : 'en'));
for (const b of buttons) b.addEventListener('click', () => show(b.dataset.set));
