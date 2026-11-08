import { IdeaPage } from '../pages/Cards.jsx';
import { mount } from './mount.jsx';

mount(<IdeaPage idea={location.pathname.match(/\/ideas\/(\w+)\.html$/)[1]} />);
