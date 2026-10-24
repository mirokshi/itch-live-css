import { PAGE_NAMES, thumb } from './thumb.js';

const SAMPLE_BIO = '<p>Una página de ejemplo con el CSS de esta persona.</p>';
const list = document.getElementById('list');

// Each card: the owner's served CSS on a mock of their page type, their name and a link to the page.
// Built with textContent and checked URLs: names and addresses come from users.
const { entries } = await (await fetch('/api/showcase')).json();
document.getElementById('empty').hidden = entries.length > 0;
for (const { id, url, name, page } of entries) {
  const li = Object.assign(document.createElement('li'), { className: 'card' });
  const box = Object.assign(document.createElement('div'), { className: 'thumb' });
  const body = Object.assign(document.createElement('div'), { className: 'body' });
  const title = Object.assign(document.createElement('h2'), { textContent: name || new URL(url).hostname });
  const kind = Object.assign(document.createElement('p'), { textContent: PAGE_NAMES[page] ?? page });
  const link = Object.assign(document.createElement('a'), { href: url, textContent: 'Ver en itch.io', className: 'button-link', rel: 'noopener', target: '_blank' });
  const actions = Object.assign(document.createElement('div'), { className: 'actions' });
  actions.append(link);
  body.append(title, kind, actions);
  li.append(box, body);
  list.append(li);
  fetch(`/c/${id}.css`).then((r) => (r.ok ? r.text() : '')).then((css) => thumb(box, { page, css, bio: SAMPLE_BIO }));
}
