// the effects with an idea page (/ideas/<key>)
// the static effects that are one checkbox each and get pasted (engine/src/plugins/scroll.js and motion.js)
export const TOGGLES = ['reveal', 'stagger', 'unveil', 'progress', 'parallax', 'zoom', 'shrink', 'entrance', 'lift', 'tilt', 'pagefade'];
export const IDEAS = ['title', 'greeting', 'foil', 'badges', 'ascii', 'scheme', ...TOGGLES];
// effects that can't be seen in the preview (the browser's own navigation): listed on /ideas, not as cards
export const NO_PREVIEW = ['pagefade'];
export const PREVIEW = IDEAS.filter((k) => !NO_PREVIEW.includes(k));

// the pages each effect works on (the keys of pageNames in locales/); jams are left out: their CSS sits
// inside the page, so the per-visit effects can't run there and the static ones are not checked
const ALL = ['profile', 'project', 'devlog'];
export const IDEA_PAGES = { title: ALL, greeting: ALL, foil: ['profile'], badges: ['profile'], ascii: ALL, scheme: ALL, reveal: ALL, stagger: ['profile'], unveil: ['project', 'devlog'], progress: ALL, parallax: ALL,
  zoom: ALL, shrink: ALL, entrance: ALL, lift: ['profile'], tilt: ['profile'], pagefade: ALL,
};
