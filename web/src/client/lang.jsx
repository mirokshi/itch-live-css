// Guide chapters: their text is static; only the language selector hydrates, in the page's language.
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { LanguageSelector } from '../common.jsx';
import i18n from '../i18n.js';

const root = document.getElementById('lang-root');
i18n.changeLanguage(document.documentElement.lang);
hydrateRoot(root, <I18nextProvider i18n={i18n}><LanguageSelector links={JSON.parse(root.dataset.links)} /></I18nextProvider>);
