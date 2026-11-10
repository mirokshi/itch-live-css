import { Doc } from '../pages/Content.jsx';
import { metaOf } from '../title.js';

export default () => <Doc name="privacy" path="/privacy" />;
export const handle = { title: 'titles.privacy' };
export const meta = metaOf(handle);
