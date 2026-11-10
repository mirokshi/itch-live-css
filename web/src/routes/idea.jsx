import { useLocation } from 'react-router';
import { IdeaPage } from '../pages/Cards.jsx';
import i18n from '../i18n.js';

const keyOf = (pathname) => pathname.match(/\/ideas\/(\w+)\/?$/)[1];
const nameOf = (pathname) => ({ name: i18n.t(`ideas.${keyOf(pathname)}_name`) });

export default function Idea() {
  return <IdeaPage idea={keyOf(useLocation().pathname)} />;
}
// params: the title's placeholders for this URL, so the root can re-read it when the language changes
export const handle = { title: 'titles.idea', params: nameOf };
export const meta = ({ location }) => [{ title: i18n.t('titles.idea', nameOf(location.pathname)) }];
