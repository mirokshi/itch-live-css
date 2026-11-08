// The page shell around every route: <html lang>, the stylesheet, the language and the footer.
// Guide chapters carry their own language (loader data), the rest start in Spanish and switch in
// the browser with the selector.
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useMatches } from 'react-router';
import './index.css';
import { Footer } from './common.jsx';
import i18n from './i18n.js';

export function Layout({ children }) {
  const matches = useMatches();
  const { pathname } = useLocation();
  const route = matches.at(-1);
  const lang = (route?.loaderData ?? route?.data)?.lang; // v8 renamed data to loaderData
  // on the server the shared i18n instance is reset on every page; in the browser the visitor's choice stays
  if (typeof window === 'undefined') i18n.changeLanguage(lang ?? 'es');
  else if (lang && i18n.language !== lang) i18n.changeLanguage(lang);
  const title = route?.handle?.title;
  useEffect(() => {
    const retitle = (lng) => {
      if (lang) return; // a chapter keeps its own language
      document.documentElement.lang = lng;
      if (title) document.title = i18n.t(title, route.handle.params?.(pathname));
    };
    retitle(i18n.language); // the selector may have switched before this effect ran (children's effects run first)
    i18n.on('languageChanged', retitle);
    return () => i18n.off('languageChanged', retitle);
  }, [title, lang]);
  return (
    <html lang={lang ?? 'es'}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          {children}
          <Footer />
        </I18nextProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
