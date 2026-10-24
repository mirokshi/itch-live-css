# Hoja de ruta · itch-live-css

Un producto para personalizar páginas de itch.io (perfil, proyecto, devlog, jam) **a gusto de cualquiera**,
programe o no: un **motor open source**, un **servicio alojado** que sirve CSS que cambia en cada visita, un
**configurador web**, soporte para **frameworks** (Tailwind, Bootstrap, Animate.css) e **integración con IAs**
(Claude, GPT, Gemini…).

Todo se apoya en la base de conocimiento verificada de [`knowledge/`](knowledge/itch-custom-css.md) (2026-10-14):
731 datos, 472 comprobados directamente. Las referencias `R7`, `§8`, `B1`… apuntan a ese archivo.

Estado: **fase 0 casi cerrada**. Las pruebas en vivo 1 (proyecto en borrador), 2 (perfil), 3 (solo el devlog) y 4 (topes, sin la jam) se hicieron el 2026-10-16; solo faltan las jams. Nada publicado todavía.

---

## 1. Lo que la investigación cambia del plan

Hallazgos de la base de conocimiento que condicionan el diseño. Cada uno es una decisión de producto.

| # | Hallazgo | Consecuencia para el producto |
|---|---|---|
| H1 | En las **jams** el CSS va dentro de `style#jam_theme`: un `@import` **no carga nunca** (R9, §4). | El servicio dinámico **no sirve para jams**. Para jams el configurador exporta CSS para pegar (≤ 20.410 caracteres conocidos) y fuentes con `@font-face`. |
| H2 | **Proyectos y devlogs no tienen tope de CSS**: se guardaron 659.742 caracteres el 2026-10-16; por encima falla la petición ("missing token"), no una regla de CSS (R7). | En proyectos, efectos y frameworks pueden ir **pegados**; el `@import` pasa a ser opcional (solo para lo que cambia por visita). |
| H3 | El **perfil** sí tiene tope: **5.120 bytes UTF-8** (el mensaje dice «characters»), comentarios incluidos y sin contar los espacios de los extremos; si te pasas, rechaza el guardado, no recorta (R7). La bio admite 5.000 caracteres del HTML enviado. | Es donde el servicio más aporta: saca del tope todo lo que no sea imprescindible. |
| H4 | `random()` nativo: Safari 26.2 ya; Chrome 156 lo anuncia para el 2026-10-20 (§7, por confirmar después del 28-10). | El azar por visita será CSS puro en casi todos los navegadores. El motor debe emitir `@supports (rotate: random(0deg, 1deg))` con alternativa, y el servidor queda para Firefox y para lo que el CSS no puede: hora, idioma, datos externos, recursos generados. |
| H5 | Cada `@import` **bloquea el pintado**. Un host que acepta la conexión y no responde dejó la página **en blanco más de 330 s** (§8). | El servicio responde siempre desde memoria, sin llamadas lentas en la ruta del visitante (los datos externos se precalculan), con presupuesto de latencia y alta disponibilidad. **La página tiene que verse bien sin el `@import`**: el CSS pegado lleva el aspecto completo. |
| H6 | Brave Shields bloqueó una hoja servida desde `*.vercel.app`; causa desconocida (§8, pregunta abierta 10). | Dominio propio para la instancia pública, y averiguar qué listas lo bloquean antes de elegir host. |
| H7 | El filtro de itch deja las clases que empiezan por `custom` en minúscula y elimina `id`, `data-*`, `aria-*`, `role`. Comprobado en un proyecto el 2026-10-16: lo que sigue al prefijo da igual, así que `custom-w-1/2`, `custom-w-[3px]` y `custom:md:flex` sobreviven, y `md:custom-…`, `!custom-…` y `-custom-…` caen (R11, §5). | Frameworks: renombrado a `custom-*`. Los valores arbitrarios y las fracciones de Tailwind funcionan tal cual; las variantes de v3 (`hover:`, `md:`) se siguen generando como reglas propias. El HTML que exporte el configurador solo usa etiquetas y atributos que sobreviven. |
| H8 | Las listas de los bloqueadores de anuncios ocultan clases como `custom-ad`, `custom-ads`, `custom-cookie-banner`, `custom-social`, `custom-share-button` (R11). | El validador prohíbe esos nombres y prefijos. |
| H9 | itch tiene 13 `@keyframes` globales (`bounce`, `spin`…); uno con el mismo nombre reemplaza el de itch (R16). | El motor prefija con `custom-` todos los `@keyframes` (también los de Animate.css). |
| H10 | Las reglas en `@layer` siempre pierden frente a itch (R15); las reglas importadas pierden los empates (§6). | Nunca emitir capas para lo que debe ganar. Tailwind en **v3.4** vía PostCSS, no v4 (§8). Las reglas del servicio llevan peso extra. |
| H11 | En páginas con juego HTML5, `filter`, `transform`, `backdrop-filter` o `will-change` en los ancestros del juego rompen el modo maximizado (R22). | El validador lo detecta en configuraciones de proyecto; los efectos de fondo usan la receta segura de §4. |
| H12 | itch no trae reglas de movimiento reducido, y su anillo de foco no llega a 3:1 en temas oscuros (§4, §10). | Toda salida incluye **B1** (movimiento reducido) y **B2** (foco) por defecto. |
| H13 | Un `@import` envía la URL completa de la página como Referer (§8). | Sin cookies ni registros de visitantes; escapar todo dato que llegue en la petición (§2 P9). Política de privacidad (RGPD). |
| H14 | Vercel Hobby: 1 M invocaciones al mes ≈ 33.000 visitas al día, y solo uso no comercial (§8). | Se eligió Vercel igualmente (2026-10-24): vale mientras el proyecto sea gratuito y el tráfico quepa; si crece o se cobra, plan Pro o mudanza. |
| H15 | No hay CSP que limite CSS, fuentes o imágenes externas en ningún tipo de página (§1). | El modelo `@import` es viable en perfil y proyecto. |
| H16 | Las variables del tema solo alcanzan a quien las lee con `var()`; muchos colores y fuentes son literales, y dónde se declaran cambia según el tipo de página (§4). | El motor necesita un **mapa de selectores por tipo de página**, sacado de §3 y §4, no un único juego de reglas. |

---

## 2. Principios

1. **Todo bajo `#wrapper`** y nada que oculte, mueva o imite la interfaz de itch (R2, R5, R6).
2. **La página funciona sin el servicio.** El CSS pegado da el aspecto completo; el servicio solo añade extras.
3. **Un solo `@import`**, rápido y en la primera línea.
4. **Accesible por defecto**: B1, B2, un solo `h1`, contraste medido sobre la imagen de fondo.
5. **Sin rastreo**: ni cookies, ni registros de visitantes, ni balizas.
6. **Cada regla del validador remite a la base de conocimiento** (R1–R24): si la IA o el usuario rompen algo, el error explica el porqué con su evidencia.

---

## 3. Fases

### Fase 0 · Cerrar la base de conocimiento (en curso)

- [x] Investigación, pruebas y verificación adversarial (13 frentes).
- [x] `knowledge/itch-custom-css.md` (~78 KB), 10 secciones (~865 KB), `llms.txt` y `llms-full.txt`.
- [x] 18 páginas de prueba locales, registros de evidencia y kit de pruebas en vivo.
- [x] **Prueba 1: proyecto en borrador** (2026-10-16, [resultados](knowledge/evidence/live-probes/results-2026-10-16-project.md)). Los tokens de clase con `/`, `[ ]` y `:` sobreviven; itch elimina `</style>` y recorta los espacios iniciales y finales del CSS; `@import` de `data:` funciona.
- [x] **Prueba 2: perfil** (2026-10-16, [resultados](knowledge/evidence/live-probes/results-2026-10-16-profile.md)). Mismo trato del CSS que en proyectos, pero con LF; la bio sanea igual que la descripción, sus iframes siguen activos; sin sesión, caché de unos 2,5 minutos tras guardar.
- [x] **Prueba 4: topes** (2026-10-16, [resultados](knowledge/evidence/live-probes/results-2026-10-16-caps.md)): perfil 5.120 bytes, proyecto sin tope de CSS, bio 5.000 caracteres. Falta el tope de las jams.
- [x] **Prueba 3, devlog** (2026-10-16, [resultados](knowledge/evidence/live-probes/results-2026-10-16-devlog.md)): el cuerpo del post se sanea igual que una descripción de proyecto, pero sus iframes siguen activos; el CSS del proyecto se sirve igual.
- [ ] **Prueba 3, jam** ([`knowledge/probes/`](knowledge/probes/README.md)): descripción, CSS y tope, si hay una jam en borrador.
- [ ] Volver a comprobar después del 2026-10-28: `random()` en Chrome 156 y las animaciones ligadas al scroll en Firefox 159.
- [x] Repo preparado (2026-10-16): licencias, aviso de terceros, README en inglés, seudónimos y revisión de limpieza.
- [ ] Primer commit y repo público en GitHub.
- [ ] Rastreador de humo periódico que avise si itch cambia el DOM o sus hojas de estilo (reutiliza las herramientas de `knowledge/evidence/`).

**Salida:** base de conocimiento publicada, con las preguntas que necesitan cuenta resueltas.

### Fase 1 · Motor (open source)

No se publica como paquete npm (decidido 2026-10-24): es una carpeta del repo que usa la web (fases 2 y 3).

- `render(config, contexto) → CSS`, azar con semilla, sin dependencias de plataforma (`Request`/`Response` estándar).
- **Mapa de páginas** (perfil, proyecto, devlog, jam): selectores, dónde van las variables, colores literales, puntos de corte. Datos sacados de §3 y §4.
- **Plugins con esquema de opciones**: el mismo esquema genera el formulario del configurador y las herramientas de la IA.
- **Validador** con una regla por cada R de la base de conocimiento, más H8 y H11.
- **Dos salidas**: *pegada* (minificada con esbuild, medida en caracteres y bytes, saltos de línea de proyecto contados) y *servida* (`@import`).
- Primeros plugins: tus efectos actuales (mezcla de letras, rodillo de saludos, tarjetas «pegatina» con cifras y etiquetas de la API de itch), más color de acento, fuentes, tarjetas, fondo con propiedades sueltas (B3), capa decorativa (B4), B1 y B2. El cielo de estrellas se retiró de tu perfil el 2026-10-16; como plugin genérico para otros sigue siendo posible.
- CLI: `dev` (servidor local) y `measure`.
- Tests: instantáneas con semilla, más las páginas de `knowledge/tests/` como suite de regresión.

**Salida:** tu perfil generado al 100 % por el motor, con el mismo resultado visual y el validador sin errores.

### Fase 2 · Servicio público

Las fases 2 y 3 son **una sola web** en un proyecto nuevo de Vercel (decidido 2026-10-24): creas tu CSS, lo ves en la vista previa y te da el link para pegarlo en itch.

- Proyecto nuevo de Vercel desde este repo, configuraciones en **Upstash Redis**, con **dominio propio** (H6). Tu servicio actual sigue sirviendo tu perfil hasta que lo migres.
- Responde desde memoria, `no-store`, con presupuesto de latencia; los datos externos se precalculan aparte (H5).
- Configuraciones con id y **enlace secreto de edición**, sin cuentas ni login: se pega el `@import` una vez y los cambios aparecen sin volver a pegar.
- Solo configuración declarativa y plugins oficiales; tamaño máximo por configuración, límites por id e interruptor general.
- Sin cookies ni registros; escape de todo dato de entrada; política de privacidad (H13).
- Las configuraciones de jam no se sirven: el servicio avisa y el configurador ofrece la versión pegada (H1).
- Página de estado.

**Salida:** tu perfil servido desde la instancia pública durante 2 semanas sin incidencias.

### Fase 3 · Configurador web (versión mínima para no programadores)

Primera versión: **perfil y proyecto** (decidido 2026-10-24); jam y devlog después.

- Elegir tipo de página → catálogo de efectos con formularios generados desde los esquemas.
- Vista previa sobre **maquetas propias** de cada tipo de página (mismas clases que itch, estilos propios: no se redistribuye el HTML ni el CSS de itch).
- Validación en vivo: tope de caracteres y bytes, contraste sobre la zona más clara del fondo, reglas R.
- Exportación según el tipo de página:
  - **Perfil**: línea de `@import` + CSS de respaldo dentro del tope.
  - **Proyecto**: todo pegado, con `@import` opcional para lo dinámico.
  - **Jam**: todo pegado.
  - En todos los casos, el HTML para la bio o la descripción y una lista de comprobación de accesibilidad.
- Guía para pedir a itch el acceso al CSS (R1).

**Salida:** una persona sin conocimientos de CSS personaliza su perfil en menos de 10 minutos.

### Fase 4 · Frameworks

- **Tailwind v3.4**: contenido tomado del HTML de la bio, prefijo `custom-`, sin Preflight, selectores prefijados con `#wrapper` (§8). Los valores arbitrarios (`custom-w-[3px]`) y las fracciones sobreviven al filtro; las variantes se generan como reglas propias (H7).
- **Bootstrap** (solo la parte CSS): renombrado a `custom-*` y ámbito `#wrapper .custom-bs`.
- **Animate.css / tw-animate-css**: solo los `@keyframes` usados, copiados como `custom-*` (H9), más **animaciones predefinidas** para no programadores (elegir una parte de la página y una animación).
- Compilación al guardar, no en cada visita. Dónde va cada cosa: perfil alojado, proyecto pegado, jam pegado.
- Depende de la fase 0 (tokens con `/`, `[ ]`, `:`).

### Fase 5 · Integración con IAs

- **5a. Conocimiento** (casi hecho): publicar `llms.txt`, añadir un `AGENTS.md` y una skill de Claude Code que carguen la base de conocimiento.
- **5b. Servidor MCP**: herramientas `page_map(tipo)`, `list_plugins`, `validate_css` (devuelve los ids de regla R), `measure`, `preview`, `save_config`. Funciona en Claude, ChatGPT, Gemini CLI, Cursor…
- **5c. Asistente en el configurador**:
  - Cada usuario pone su propia clave (solo en su navegador), con un adaptador para varios proveedores.
  - La IA produce **configuración**, no CSS suelto.
  - Bucle validador → IA hasta que todo pasa, y luego vista previa y confirmación del usuario.

### Fase 6 · Extras para quien programa

- Modo código en el configurador; API y `npx itch-live-css push`; GitHub Action.
- Guía para escribir plugins; los plugins de la comunidad entran por PR revisado.
- Login con itch.io (OAuth) como alternativa al enlace secreto.
- Fuentes de datos precalculadas: RSS de devlogs, GitHub, directo en Twitch, y la **API de itch** (vistas y descargas por juego, como `cards.js` + `itch.js` del repo privado; casa las tarjetas por `data-game_id`, que no es un selector documentado). La API necesita la clave de cada usuario: en la instancia pública eso obliga a guardar secretos cifrados, o a dejarlo solo para quien aloje su propio servicio.

---

## 4. Riesgos

| Riesgo | Mitigación |
|---|---|
| itch cambia su DOM o sus estilos sin avisar | Rastreador de humo (fase 0); preferir los selectores documentados; versionar el mapa de páginas. |
| Un usuario pierde el acceso al CSS por romper las normas | El validador bloquea R5 y R6 (UI, pie de página, engaños); nada que oculte o imite controles. |
| El servicio cae o va lento y deja páginas en blanco | H5: respuesta desde memoria, presupuesto de latencia, CSS pegado completo, página de estado. |
| Costes o abuso de la instancia pública | Límites por id, tamaño máximo, interruptor, solo configuración declarativa. |
| `random()` nativo reduce el valor del servicio para el azar | Enfocar el servidor en lo que el CSS no puede hacer (hora, idioma, datos externos, recursos generados) y en sacar CSS del tope del perfil. |
| Bloqueadores (Brave y otros) | Dominio propio; diseño que funciona sin el `@import`. |
| Legales: marca «itch», RGPD, licencias | Presentarlo como «para itch.io» sin su logo; sin datos de visitantes; revisar licencias de fuentes y frameworks. |

---

## 5. Decisiones

Tomadas el 2026-10-16:

- **Licencias**: MIT para el código y CC BY 4.0 para la base de conocimiento, más un aviso de terceros (`web_sanitize`, MIT; nombres de selectores de itch). Faltan los archivos.
- **Creadores pequeños** citados en las evidencias: seudónimos `creator-NN`, como ya hace `crawlprofile.md`. Falta aplicarlo.
- **Tus identificadores** (perfil, servicio de Vercel, notas del repo privado): se publican.

Tomadas el 2026-10-24:

- **Producto**: una web en Vercel donde creas tu CSS, lo simulas y te llevas el link (`@import`) para itch. El motor no se publica en npm.
- **Plataforma**: proyecto nuevo de Vercel desde este repo, con Upstash Redis para las configuraciones.
- **Edición**: enlace secreto, sin cuentas.
- **Primera versión**: perfil y proyecto.

Pendientes:

- **Nombre** definitivo y **dominio**.
- **Cuándo** crear el repo público en GitHub.
