// The tab title of a route: its handle.title is an id in locales/ (the root re-reads it when the
// language changes).
import i18n from './i18n.js';

export const metaOf = (handle, extra = []) => () => [{ title: i18n.t(handle.title) }, ...extra];
