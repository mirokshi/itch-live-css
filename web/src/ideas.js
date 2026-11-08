// the effects with an idea page (/ideas/<key>)
export const IDEAS = ['title', 'greeting', 'foil', 'badges', 'ascii', 'scheme'];

// the pages each effect works on (the keys of pageNames in locales/); jams are left out: their CSS sits
// inside the page, so the per-visit effects can't run there and the static ones are not checked
const ALL = ['profile', 'project', 'devlog'];
export const IDEA_PAGES = { title: ALL, greeting: ALL, foil: ['profile'], badges: ['profile'], ascii: ALL, scheme: ALL };
