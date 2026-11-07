// the guide's index: its chapter list is prerendered into the page, so hydration reads it back
import { GuideIndex } from '../pages/Content.jsx';
import { mount } from './mount.jsx';

mount(<GuideIndex {...JSON.parse(document.getElementById('guide-data').textContent)} />);
