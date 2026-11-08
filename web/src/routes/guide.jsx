import { chapters, recipes } from '../guide.js';
import { GuideIndex } from '../pages/Content.jsx';
import { metaOf } from '../title.js';

export const loader = () => ({
  chapters: Object.fromEntries(Object.entries(chapters).map(([l, list]) => [l, list.map(({ href, title }) => ({ href, title }))])),
  recipes: recipes(),
});
export default function Guide({ loaderData }) {
  return <GuideIndex {...loaderData} />;
}
export const handle = { title: 'titles.guide' };
export const meta = metaOf(handle);
