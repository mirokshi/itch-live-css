// Hydrates a prerendered page and keeps <html lang> and the tab title in the selected language
// (the root's data-title is the title's id in locales/).
import { I18nextProvider } from 'react-i18next';
import { hydrateRoot } from 'react-dom/client';
import i18n from '../i18n.js';

export function mount(element) {
  const root = document.getElementById('root');
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
    document.title = i18n.t(root.dataset.title);
  });
  hydrateRoot(root, <I18nextProvider i18n={i18n}>{element}</I18nextProvider>);
}
