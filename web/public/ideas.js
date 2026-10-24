import { thumb } from './thumb.js';

// One card per effect: a live sample (the server renders only that effect) and a link that opens
// the editor with it turned on (?idea=<key>, read by app.js).
const BASE = { page: 'profile', accent: '#d6336c', title: null, greeting: null, cards: false, ascii: false };
const IDEAS = [
  {
    key: 'title', name: 'Título de letras mezcladas', pages: 'Perfil, juego y devlog',
    text: 'Cada letra de tu nombre con una fuente distinta, y el grosor «respira» despacio. Las fuentes se mezclan de nuevo en cada visita.',
    form: { title: { text: 'Tu nombre', fonts: ['fraunces', 'inter', 'grotesk'] } },
  },
  {
    key: 'greeting', name: 'Saludo que cambia de idioma', pages: 'Perfil, juego y devlog',
    text: 'Un saludo de tu texto rueda como un panel de aeropuerto por otros idiomas. Los lectores de pantalla leen tu texto real.',
    form: { greeting: { first: '¡Hola!', others: ['Hello!', 'Bonjour !', 'Hallo!', 'Olá!', 'Ciao!'] } },
  },
  {
    key: 'cards', name: 'Tarjetas con borde foil', pages: 'Solo perfil',
    text: 'Un brillo dorado recorre el borde de cada juego de tu perfil, con un ritmo distinto en cada tarjeta y más rápido al pasar el ratón.',
    form: { cards: true },
  },
  {
    key: 'ascii', name: 'Fondo de caracteres ASCII', pages: 'Perfil, juego y devlog',
    text: 'Un campo de letras y números detrás de la página, con ondas que lo reescriben. Se queda quieto si el visitante pide menos movimiento.',
    form: { ascii: true },
  },
];

const list = document.getElementById('list');
for (const idea of IDEAS) {
  const li = Object.assign(document.createElement('li'), { className: 'card' });
  const box = Object.assign(document.createElement('div'), { className: 'thumb' });
  const body = Object.assign(document.createElement('div'), { className: 'body' });
  const actions = Object.assign(document.createElement('div'), { className: 'actions' });
  actions.append(Object.assign(document.createElement('a'), { href: `/?idea=${idea.key}`, textContent: 'Usar esta idea', className: 'button-link' }));
  body.append(
    Object.assign(document.createElement('h2'), { textContent: idea.name }),
    Object.assign(document.createElement('p'), { textContent: idea.text }),
    Object.assign(document.createElement('p'), { textContent: idea.pages }),
    actions,
  );
  li.append(box, body);
  list.append(li);

  fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...BASE, ...idea.form }) })
    .then((r) => r.json())
    .then(({ css, bio }) => thumb(box, { css, bio: `${bio}<p>Una página de ejemplo.</p>` }));
}
