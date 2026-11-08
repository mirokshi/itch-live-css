import { metaOf } from '../title.js';

export { Admin as default } from '../pages/Cards.jsx';
export const handle = { title: 'titles.admin' };
export const meta = metaOf(handle, [{ name: 'robots', content: 'noindex' }]);
