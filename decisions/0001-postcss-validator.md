# ADR-0001: PostCSS como parser del validador

**Estado:** Aceptado (opción B, 2026-11-07)
**Fecha:** 2026-11-07
**Decide:** el dueño (mirokshi)

## Contexto

El rediseño de la web (React + Vite, CodeMirror 6 y una exportación que elige entre pegar el CSS o usar `@import`) pide parsear y validar el CSS con **PostCSS y un plugin propio** que aplique las reglas R1–R24 de la base de conocimiento (`knowledge/itch-custom-css.md` §0). Hay que responder tres preguntas: si es posible, si funciona con lo que sabemos hoy y si es difícil de mantener cuando la base de conocimiento cambie.

Lo que hay hoy:

- `engine/src/validate.js` (293 líneas, sin dependencias) comprueba R2–R4, R7–R12, R14–R16, R18 y R23.
  - Cerca de un tercio del archivo es infraestructura: un parser tolerante escrito a mano (`parse`, unas 55 líneas), `walk`, `styleRules`, `allRules`, `declarations` y `selectors`, que separa los selectores por comas.
  - El resto es un bloque por regla, y cada bloque añade `{ rule, level, message }`.
- `web/api/validate.js` lo ejecuta en el servidor y añade a cada problema el título de su regla, que lee de §0 del archivo principal al arrancar.
- El engine no tiene `node_modules`. La web lo importa por ruta relativa (`../../engine/src/index.js`). En Vercel, el Root Directory es `web`, así que al desplegar solo se instala `web/package.json`.

**Prueba rápida** (2026-11-07, con postcss 8.5.32 y postcss-safe-parser 7.1.0 en Node 20; el script está en una carpeta temporal):

- `postcss.parse` da todo lo que leen las reglas:
  - `rule.selectors` separa bien `#wrapper a:is(.b, .c), html` por la coma de primer nivel;
  - `decl.important` se marca y el `!important` se quita de `decl.value`;
  - `@media` e `@import` llegan como nodos at-rule con `name` y `params`;
  - un `}{</style>` dentro de una cadena se queda en la cadena.
- El parser estricto **lanza un error** con lo que suele haber en un editor a medio escribir (`Unclosed block`, `Unclosed string`, `Unexpected }`), siempre con línea y columna.
- `postcss-safe-parser` parsea esa misma entrada sin error: cierra el bloque abierto y deja la `}` sobrante como texto en bruto.
- **Peso en el navegador** de los dos paquetes (esbuild, minificado): **60 KB, 19 KB con gzip**. El campo `browser` de postcss ya excluye `fs`, `path`, `url` y los source maps, así que no hacen falta polyfills.

## Decisión

**Sí, con condiciones.** En `engine/src/validate.js`, el parser escrito a mano y sus recorridos se sustituyen por PostCSS. Los bloques de cada regla y el formato de salida se mantienen.

Las mismas comprobaciones se exportan de dos formas:

- `validate(css, page, opts)`, como hoy: una llamada que devuelve el mismo array de resultados;
- `itchRules({ page, served })`, un plugin de PostCSS que informa de cada problema con `result.warn(message, { node, rule, level })`.

La web sigue llamando a `validate()` desde `api/validate`.

Condiciones:

1. **Primero el parser tolerante; el estricto, solo como aviso.** Se parsea con `postcss-safe-parser` para que los problemas sigan apareciendo mientras el CSS está a medio escribir. Además se prueba el parser estricto: si lanza un error, se añade un problema `syntax` con su línea y columna. El motivo es que el navegador descarta la parte rota, mientras que itch la guarda tal cual.
2. **Las reglas de texto en bruto siguen leyendo el texto.** R7 (tamaño, con `measure()`) y R8 (itch borra `</style>` incluso dentro de comentarios y cadenas) no deben leer el árbol, porque el árbol normaliza justo lo que estas reglas cuentan.
3. **Los datos de las reglas pasan a un módulo con ids de evidencia.** Los números y listas que salen de la evidencia y que el validador usa pasan a `engine/src/rules.js`, cada uno con su regla y sus ids de evidencia del archivo principal:
   - los límites de tamaño (R7);
   - los prefijos que ocultan los bloqueadores de anuncios (R11);
   - el prefijo obligatorio de `@keyframes` (R16).

   Solo entran los datos que el validador lee; una lista que ninguna regla usa (los 13 nombres globales de `@keyframes`, los ids estables) no se copia. Un test comprueba que cada id de regla que emite el validador existe en §0, que los ids de evidencia de cada constante aparecen en el texto de su regla y que los límites de R7 coinciden con las cifras del texto de R7.
4. **Instalar las dependencias del engine al desplegar.** `postcss` y `postcss-safe-parser` van en `engine/package.json`, y en `web/vercel.json` se define un `installCommand` que también ejecute `npm ci --prefix ../engine`. Node resuelve los imports del engine desde `engine/`, no desde `web/node_modules`.
5. **Se ejecuta en `api/validate`, como hoy.** Tras este cambio el engine funciona también en el navegador, así que pasar la comprobación a la página más adelante será cuestión del build, no una reescritura. No se hace ahora porque el navegador necesitaría los títulos de las reglas en tiempo de build y cargar unos 19 KB más, sin ganar ninguna regla nueva.

## Cómo entran nuestros errores en el plugin

Las comprobaciones del engine no cambian de contenido: cambian de forma para encajar en la API de plugins de PostCSS.

- **Una regla, un visitor.** Cada regla que mira un nodo concreto es un visitor de PostCSS (`Rule`, `AtRule` o `Declaration`). Cuando encuentra un problema emite `result.warn(mensaje, { node, rule, level })`, con el mismo mensaje que hoy. Al pasar el `node`, el aviso lleva la línea y la columna de ese nodo; con `word` se acota al selector o al nombre del que habla el mensaje.
- **Las reglas que miran la hoja entera usan `Once(root)` y `OnceExit(root)`.**
  - En `Once`, antes de recorrer los nodos: el orden de los `@import` (R9, R10 y el `layer()` de R15) y las propiedades que animan los `@keyframes`, que R14 necesita conocer antes de ver los `!important`.
  - En `OnceExit`, después: los avisos que se agrupan por valor y salen una vez por hoja (R11, R12, R14 congelado, R18 y R23).
- **R7 y R8 siguen leyendo el texto en bruto.** Están en `Once` y leen `root.source.input.css`, el texto tal cual llegó, no el árbol.
- **El estado de cada pasada vive en `prepare(result)`.** Así, dos procesados seguidos no comparten conjuntos.
- **`validate()` no cambia de forma.**
  - Procesa con `postcss([itchRules({ page, served })]).process(css, { from: undefined, parser: safeParser }).sync()`.
  - Convierte cada aviso de `result.messages` en `{ rule, level, message }`, más `line`, `column`, `endLine` y `endColumn` cuando el aviso tiene posición.
  - Antes añade el problema `syntax` si el parser estricto falla sobre el CSS que llega al navegador (el texto sin los `</style>` que itch borra).
- **El orden de los avisos** sigue el de las fases: `syntax`, después lo de `Once`, después los nodos en el orden del documento y al final lo de `OnceExit`. Puede diferir del orden de hoy cuando una hoja rompe varias reglas a la vez; ningún test depende de ese orden.

## Qué reglas puede comprobar PostCSS

Leyenda de la columna «Con PostCSS»:
- **Árbol:** se comprueba solo con el CSS parseado.
- **Texto:** se comprueba sobre el texto original.
- **Parcial:** una parte se comprueba con el árbol y el resto necesita otra cosa.
- **No:** necesita la página renderizada, el HTML de la página, la red o una persona.

| Regla | Tema | Con PostCSS | Hoy | Notas |
|---|---|---|---|---|
| R1 | La cuenta tiene acceso al CSS | No (persona) | – | Hay que preguntárselo al creador. |
| R2 | Los selectores empiezan por `#wrapper` | Árbol | sí | `rule.selectors` sustituye al separador de comas. |
| R3 | Variables en `#wrapper`, no en `:root`/`html` | Árbol | sí | |
| R4 | Nada de `background` abreviado en `#wrapper` | Árbol | sí | |
| R5 | No ocultar ni tapar la interfaz de itch | Parcial | parcial (aviso) | Árbol (hecho 2026-11-23): `display:none`, `visibility`, `opacity:0`, `font-size:0`, `color:transparent`, `clip-path`, `scale(0)`, tamaños a 0 y `content` en selectores que contienen la lista `ITCH_UI` (`.footer`, `#user_tools`, `.buy_row`…), y `::after` en enlaces de proyectos (insignia «External link»). «Tapar» y «mover» necesitan la página renderizada. |
| R6 | No engañar ni rastrear | Parcial | parcial (aviso) | Árbol (hecho 2026-11-23): `url()` que solo carga en un estado de interacción (`:hover`, `:focus`, `:checked`…) y no en otro sitio de la hoja, y selectores `[value…]`. Los controles falsos necesitan a una persona. |
| R7 | Límite de tamaño | Texto | sí | `measure()`, sin cambios. |
| R8 | Nada de `<style>` ni `</style>` | Texto | sí | Sin cambios. |
| R9 | `@import` primero y en el nivel superior | Árbol | sí | Por el orden de `root.nodes`. |
| R10 | `https`, `text/css`, 2xx y versión fijada | Parcial | parcial | Árbol: esquema, hosts raw de GitHub y versión fijada en jsDelivr (hecho). El código de estado y el tipo de contenido necesitan una petición. |
| R11 | Clases `custom-`; nombres que ocultan los bloqueadores | Parcial | parcial | Árbol: nombres de clase del CSS que ocultan los bloqueadores (hecho). El prefijo `custom-` se comprueba en el HTML de la bio o la descripción, no en el CSS. |
| R12 | Nada de ids numerados | Árbol | sí | |
| R13 | La hoja de un proyecto también se aplica al devlog y a los comentarios | No (render) | – | Hay que renderizar los cuatro tipos de página; los mocks de la web cubren proyecto y devlog. |
| R14 | Límites de `!important` | Árbol | sí | Se mantiene la heurística por nombre de propiedad para las animaciones congeladas. |
| R15 | Nada de `@layer` ni `layer()` | Árbol | sí | |
| R16 | Prefijo `custom-` en `@keyframes` | Árbol | sí | |
| R17 | B1 con cualquier movimiento; el movimiento termina en 5 s | Parcial | – | Árbol: hay animación o transición sin un bloque como B1; `infinite` o duraciones de más de 5 s en `animation`. «Que el estado sin animar se lea bien» necesita la página renderizada. |
| R18 | Hover dentro de `(hover:hover)` y con su equivalente de foco | Árbol | sí | |
| R19 | Anillo de foco con contraste ≥ 3:1 | Parcial | – | Árbol: que haya B2 o un `outline` en `:focus-visible`. El contraste necesita los colores que se pintan de verdad. |
| R20 | Un solo `h1` | No (HTML) | – | Se comprueba en el HTML de la bio o la descripción junto con el marcado de itch. Solo «no estilar `#wrapper h1` en jams» sale del árbol. |
| R21 | `display:none` para lo que no debe oírse; alt vacío en el contenido decorativo | Parcial | – | Árbol: `content:"★"` sin la forma de alt `/ ""`. Si un `opacity:0` oculta algo con significado depende de la intención. |
| R22 | Nada de `filter`/`transform`… en los ancestros del embed HTML5 | Árbol | sí (aviso) | Hecho 2026-11-23: selectores que terminan en `#wrapper`, `#inner_column`, `.inner_column`, `.view_game_page`, `.embed_wrapper` o un `:has()` con el juego, en páginas de proyecto; `isolation` y animaciones con fill mode `both`/`forwards` incluidas. No avisa si el selector se salta el juego (`:not(:has(.html_embed_widget))`) o si una regla de `.frame_maximized` lo devuelve a `none`/`auto`. Es aviso porque el validador no sabe si la página tiene un juego HTML5. |
| R23 | `https://` absoluto en cada `url()` | Árbol | sí | |
| R24 | Comprobar sin sesión, a 320/375 px | No (persona) | – | Es un paso de prueba. |

**Totales:**
- 11 reglas se comprueban del todo con el árbol (las 11 hechas; R22 desde el 2026-11-23);
- 2 se comprueban sobre el texto (las dos hechas);
- 7 se comprueban en parte (R5, R6, R10 y R11 están en parte hechas);
- 4 no se pueden comprobar desde el CSS.

PostCSS cambia **cómo** leen el CSS las reglas, no **cuáles** se pueden comprobar: las 4 marcadas «No» quedan fuera de alcance con cualquier parser de CSS.

## Opciones consideradas

### A: mantener el parser escrito a mano (lo actual)

| Dimensión | Valoración |
|---|---|
| Complejidad | Baja: sin dependencias y ya probado |
| Coste | Unas 55 líneas de parser y unas 60 de recorridos que mantenemos nosotros |
| Encaje con reglas nuevas | Cada regla nueva reutiliza los recorridos propios; el CSS anidado y los escapes solo funcionan hasta donde llegan los tests |
| Familiaridad | Código conocido |

**A favor:** cero dependencias; tolerante por diseño; nada que instalar al desplegar.
**En contra:** el parser es nuestro y hay que mantenerlo correcto (escapes, anidamiento, casos raros de `url()`); los problemas no llevan línea ni columna; no informa de errores de sintaxis; la petición pide PostCSS.

### B: PostCSS como parser dentro de `validate()`, más un plugin exportado (recomendada)

| Dimensión | Valoración |
|---|---|
| Complejidad | Baja–media: se cambia la infraestructura y se mantienen los 14 bloques de reglas |
| Coste | 2 dependencias (postcss y safe-parser); 19 KB con gzip si algún día van al navegador |
| Encaje con reglas nuevas | `walkRules`, `walkDecls`, `walkAtRules` y las posiciones de los nodos acortan R5, R17, R21 y R22 |
| Familiaridad | PostCSS es el árbol de CSS estándar en JS; cualquier colaborador lo conoce |

**A favor:**
- un parser mantenido por otros;
- línea y columna en cada problema, que CodeMirror puede subrayar;
- un mensaje real de error de sintaxis;
- el plugin funciona en cualquier cadena de PostCSS (Vite, CLI, otras herramientas);
- el mismo código funciona en Node y en el navegador.

**En contra:** el engine deja de no tener dependencias; el despliegue necesita el paso de instalación extra; hay dos pasadas de parseo cuando se prueba el parser estricto.

### C: Stylelint con reglas propias

| Dimensión | Valoración |
|---|---|
| Complejidad | Media–alta: configuración, empaquetado del plugin y metadatos de cada regla |
| Coste | Árbol de dependencias pesado; no tiene build oficial para el navegador |
| Encaje con reglas nuevas | Bueno: mensajes, niveles de gravedad y `/* stylelint-disable */` incluidos |
| Familiaridad | Conocido por quien escribe CSS |

**A favor:** una experiencia de linter completa, con integraciones de editor que los creadores podrían usar fuera de la web.
**En contra:** mucho más grande que el problema; solo funciona en Node, lo que impide pasar la validación a la página; hay que mantener un formato de configuración además de las reglas.

### D: PostCSS más cssnano o Lightning CSS, también para minificar

No hace falta. `minify()`, en `engine/src/css.js`, ya copia sin tocar las cadenas, los `url()` y los escapes, y tiene tests. cssnano puede fusionar o reordenar reglas, lo que pone en riesgo R9 (`@import` primero) y el orden legible con el que los creadores depuran. Lightning CSS en el navegador es un binario WASM. Solo merece la pena reconsiderarlo si el tamaño pasa a ser el límite que manda en los perfiles.

## Análisis de los trade-offs

El trade-off es **una dependencia a cambio de no mantener un parser propio**:

- **Opción A:** es el diff más pequeño, pero conserva un parser casero en una herramienta cuyo trabajo es acertar con el CSS, y no da números de línea.
- **Opción B:** cuesta dos paquetes pequeños y una línea de despliegue, y abarata cada regla que venga después. Encaja con el rediseño: CodeMirror 6 puede mostrar como marcas en el texto la línea y la columna que da B, cosa que A no puede ofrecer.
- **Opción C:** añade funciones de linter que nadie ha pedido, con un peso que descarta el navegador.

**Mantenimiento cuando cambia la base de conocimiento.** Ninguna opción convierte por sí sola las reglas en prosa en comprobaciones: cada comprobación sigue escrita a mano, así que una regla nueva o cambiada siempre supone un cambio de código y un test. Con B y la condición 3, esto es lo que hay que tocar en cada caso:

| Cambio en la base de conocimiento | Qué hay que tocar |
|---|---|
| Cambia un número o una lista (un límite, un nombre de keyframe, un prefijo de los bloqueadores) | Una entrada de `engine/src/rules.js`, con el id de evidencia al lado. El test de comprobación cruzada falla hasta que coincide con el texto de R7. |
| Cambia el título o la redacción de una regla | Nada: `api/validate` lee los títulos de §0 al arrancar. |
| Se renumeran las reglas | Los ids de regla en `validate.js`. El test de comprobación cruzada lista los que faltan en §0. |
| Una regla nueva que se puede comprobar con el árbol | Un bloque de regla y un test (`walkDecls`/`walkRules`), normalmente de 10 a 30 líneas. |
| Baja la etiqueta de confianza de una regla | Valorar a mano si pasa de `error` a `warning`. Las etiquetas no se leen automáticamente; ver «A revisar». |

Se valoró generar las comprobaciones desde el archivo principal y se descartó: las reglas son prosa con excepciones (el caso `body.frame_maximized` de R2, la variante de perfil de R3), y un parser para esa prosa sería más difícil de mantener correcto que las propias comprobaciones.

## Consecuencias

- **Más fácil:**
  - las reglas nuevas que se comprueban con el árbol (las partes comprobables de R5, R17, R21 y R22);
  - problemas con línea y columna para el editor;
  - usar las reglas desde cualquier herramienta de PostCSS.
- **Más difícil:**
  - el engine ya tiene dependencias, así que hace falta `npm ci` en `engine/` para los tests y el despliegue;
  - la recuperación del parser tolerante decide qué «significa» una hoja rota, y en casos raros puede diferir de cómo se recupera el navegador (una `}` sobrante).
- **A revisar:**
  - pasar `validate()` a la página, con los títulos generados en el build;
  - confianza legible por máquina en cada regla, si los niveles deben seguir a las etiquetas;
  - el límite de las jams cuando se mida (§11).

## Tareas

1. [x] El dueño aprueba o corrige este ADR (opción B aprobada el 2026-11-07).
2. [ ] `engine/`:
   - añadir postcss y postcss-safe-parser;
   - reescribir la infraestructura de `validate.js` sobre el árbol de PostCSS;
   - mantener todos los tests actuales pasando sin cambios;
   - añadir `itchRules()` y el problema `syntax`.
3. [ ] `engine/src/rules.js` con las constantes respaldadas por evidencia y sus ids de evidencia, y el test de comprobación cruzada con §0.
4. [ ] `web/vercel.json`: un `installCommand` que también instale `engine/`.
5. [ ] Tareas posteriores, fuera de este cambio: las partes comprobables de R17 y R21 (R22 y las de R5 y R6 están hechas desde el 2026-11-23, como avisos).
