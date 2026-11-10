// The site's texts: locales/es.json and locales/en.json, one id per text. Pages are prerendered in
// Spanish (guide chapters in their own language); in the browser the language selector switches
// them. English validator messages are the engine's own (engine/src/messages.json, same ids).

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import messages from '../../engine/src/messages.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

export const LANGS = { es: 'Español', en: 'English' };

i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: { ...en, validator: messages } } },
  lng: 'es',
  fallbackLng: 'es',
  initAsync: false, // resources are inline: ready at once, also on the server
  interpolation: { escapeValue: false }, // React escapes
});

export default i18n;
