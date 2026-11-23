# Capítulo 9 — Tu propio servicio: los efectos por visita, en tu cuenta de Vercel

Los efectos que cambian en cada visita (el título de letras mezcladas, el saludo que cambia de idioma, las tarjetas con cifras) no se pueden pegar: los sirve un servicio, y itch los carga con un `@import`. Este capítulo explica cómo montar ese servicio en tu propia cuenta, igual que el que usa esta web, para no depender de ella.

## 9.1 Cuándo te conviene

- **No dependes de esta web.** Si esta web se cae o cierra, tu página sigue igual.
- **Tus cifras de itch en las tarjetas.** Las visitas y descargas de tus juegos salen de la API de itch con una clave tuya. La web pública solo pone cifras en el perfil de su autor, porque son datos privados de cada cuenta.
- **Tus límites.** El plan gratuito de Vercel es para ti solo.

No lo necesitas si todo lo que haces se puede pegar. El editor te lo dice: si la tarjeta «Para itch» te da CSS para pegar, no hace falta ningún servicio.

## 9.2 Lo que necesitas

- Una cuenta de **GitHub** y una de **Vercel** (el plan Hobby es gratis y entras con GitHub).
- Tu diseño hecho en el editor de esta web.
- Unos 15 minutos. No hace falta programar.

## 9.3 Paso a paso

![Esquema: el editor te da config.json, lo subes a tu fork de GitHub, Vercel lo despliega como /live.css y tu página de itch lo importa en cada visita](/guia/img/09-flow.svg)

1. **Descarga tu diseño.** En el editor, con tus efectos activados, la tarjeta «Para itch» tiene el botón **Descargar config.json**. Guarda el archivo.

   ![La tarjeta «Para itch» del editor con el botón Descargar config.json (en la captura, la web está en inglés)](/guia/img/09-download-button.webp)

2. **Haz un fork del repositorio** `itch-live-css` en GitHub (botón *Fork*). Tendrás tu propia copia.
3. **Sube tu diseño.** En tu fork, entra en la carpeta `service/`, pulsa *Add file → Upload files*, arrastra tu `config.json` (sustituye al de ejemplo) y pulsa *Commit changes*.
4. **Crea el proyecto en Vercel.** *Add New → Project*, importa tu fork y, en **Root Directory**, elige `service`. Pulsa *Deploy*.
5. **Comprueba que sirve.** Abre `https://<tu-proyecto>.vercel.app/live.css`: tienes que ver CSS. Si ves un comentario que empieza por `/* config.json:`, el resto dice qué campo está mal.
6. **Opcional, las cifras de tus juegos.** En itch: *Settings → API keys → Generate new API key* y copia la clave. [S1] En Vercel: tu proyecto → *Settings → Environment Variables* → nombre `ITCH_API_KEY`, valor la clave. Después, *Deployments* → el último → *Redeploy* (las variables solo entran en despliegues nuevos). Sin clave, las tarjetas llevan el borde foil, sin cifras.
7. **Pega el link en itch.** En el campo de CSS de tu página, como **primera línea**:

   ```css
   @import url("https://<tu-proyecto>.vercel.app/live.css");
   ```

   Nada puede ir delante: una regla antes del `@import` lo anula sin avisar. [S2] En el perfil, solo esa línea cuenta para el tope de 5.120 bytes. [S3]
8. **Pega la bio.** Si usas el título o el saludo, abre `https://<tu-proyecto>.vercel.app/api/bio` y copia lo que sale en tu bio: es el HTML al que se enganchan los efectos.
9. **Mira tu página sin sesión**, en una ventana privada, unos minutos después de guardar: itch sirve a los visitantes una copia en caché durante unos minutos; tú, con sesión, ves siempre lo último. [S4]

## 9.4 Cambiar el diseño

Vuelve al editor, cambia lo que quieras, descarga otra vez `config.json` y súbelo a `service/` como en el paso 3. Vercel vuelve a desplegar solo en un minuto o dos. **En itch no tienes que tocar nada**: el `@import` sigue apuntando al mismo sitio, y el servicio responde sin caché, así que la siguiente visita ya ve el cambio.

Para traer las mejoras del motor, en tu fork pulsa *Sync fork*. Tu `config.json` se queda.

## 9.5 Lo que tienes que saber

- **Un servicio que no contesta deja la página en blanco.** Un `@import` a un servidor que acepta la conexión y no responde dejó la página en blanco más de 330 segundos. [S5] Por eso el servicio no espera más de 1,5 segundos ni a itch ni a Google Fonts. Si cambias el código, no añadas llamadas lentas sin tope.
- **Si falla rápido, solo se pierde esa hoja.** Un `@import` bloqueado o con error no rompe el resto de tu CSS. [S6] Así que, si tu CSS cabe, pégalo también debajo del `@import`: si el servicio falla, la página conserva tu aspecto y solo pierde los efectos.
- **Bloqueadores.** Brave bloqueó una vez una hoja servida desde `vercel.app`, por una causa que no se sabe. [S6] Un dominio propio (Vercel → *Settings → Domains*) puede evitarlo; no está comprobado.
- **Jams: no funciona.** En las jams, el CSS va dentro de otra etiqueta y el `@import` nunca carga. [S7]
- **Privacidad.** El navegador del visitante manda a tu servicio la dirección de tu página (el *Referer*). [S8] No añadas cookies ni guardes las visitas.
- **Límites de Vercel Hobby.** Un millón de invocaciones al mes, unas 33.000 visitas al día, y solo uso no comercial. Una página que vende juegos podría contar como comercial; no está claro. [S9]
- **Tu fork es público.** Cualquiera puede leer tu `config.json` (es tu CSS, que tus visitantes ya reciben). La clave de itch va solo en las variables de entorno de Vercel, nunca en un archivo.

## 9.6 Si programas

`service/api/live.js` tiene unas 30 líneas: lee `config.json`, lo valida y lo convierte en CSS con el mismo código que la web pública (`web/lib/config.js` y `render()` del motor). Puedes cambiarlo por tu propia llamada a `render({ plugins })` y escribir plugins nuevos en `engine/src/plugins/`. Para probar en tu ordenador sin desplegar: `node --watch engine/bin/cli.js dev <tu-config.js>` sirve `http://localhost:3000/live.css`, nuevo en cada petición.

## Fuentes

- **S1** Clave de la API de itch y dónde se crea: observado · notas del servicio original del autor (`itch-io-custom-css/custom-css/README.md`); la llamada es la de `web/lib/itch.js` (`api.itch.io/profile/games`).
- **S2** `@import` primero (R9): verificado · localtests-09, localtests-50, itchcss-08.
- **S3** Solo la línea del `@import` cuenta para el tope: verificado · external-01, repo-09.
- **S4** Caché para visitantes sin sesión: documentado · community-05; verificado · crawlprofile-46.
- **S5** Servidor que no responde, página en blanco más de 330 s: verificado · g08-17.
- **S6** Un `@import` bloqueado solo quita esa hoja: verificado · external-06, localtests-12. Brave y `vercel.app`: observado 2026-10-12 · repo-14.
- **S7** `@import` muerto en las jams (`style#jam_theme`): verificado · s04-1, crawljam-14.
- **S8** Referer con la URL de la página: verificado · external-32, external-47.
- **S9** Límites y uso no comercial de Vercel Hobby: documentado · external-22, external-23. Páginas que venden juegos: inferido · x08-08.
