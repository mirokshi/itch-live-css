import { Doc } from '../pages/Content.jsx';
import { metaOf } from '../title.js';

export default () => <Doc name="docs" path="/docs" />;
export const handle = { title: 'titles.docs' };
export const meta = metaOf(handle);
