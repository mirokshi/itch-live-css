# Capítulo 6 — Recetas listas para copiar

Siete recetas basadas en los capítulos 1–5. Cada una es un archivo de la carpeta `recetas/` de esta guía. Cada receta pasa el validador de itch-live-css, que comprueba automáticamente las reglas del capítulo 2 que pueden verificarse por máquina. El tamaño indicado es después de minificar, que es lo que pegas.

Pega el código tal cual, o minifícalo antes: en un perfil cada byte cuenta (capítulo 1); en un proyecto, una sola línea evita los saltos de línea dobles.

> Los comentarios dentro de los bloques CSS están en inglés, como en los archivos de `recetas/`. El código es el mismo en ambos idiomas.

## Combinar recetas

- **Define la paleta una sola vez.** Las recetas 1, 2 y 7 empiezan cada una con tokens (`--bg`, `--text`, `--accent`). Al combinar recetas, deja una sola copia de los tokens y cambia los colores ahí.
- **Incluye el bloque de movimiento reducido una sola vez.** Las recetas 1, 2 y 5 lo contienen; si usas dos de ellas, borra la segunda copia.
- **Comprueba el total.** Las recetas 1, 3, 4 y 5 juntas suman unos 2.100 bytes en un perfil, una vez eliminado el bloque duplicado, muy por debajo del límite de 5.120.

## Receta 1 — Base de perfil

**Página:** perfil. **Tamaño:** 1.093 bytes.

Una paleta oscura en tokens, los colores de enlace y pie de itch tomados por ti, texto de tarjeta sólido, un anillo de foco que se ve sobre fondos oscuros y el bloque de movimiento reducido.

```css
/* Profile starter: palette, colours, dark theme, focus ring, reduced motion */
#wrapper {
  --bg: #0b1433;
  --text: #eef3ff;
  --accent: #ffc857;
  --focus-ring: #ffc857;
  --itchio_input_focus_color: var(--focus-ring);
  color-scheme: dark;
  background-color: var(--bg);
}
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--text); }
#wrapper .user_page a, #wrapper .footer a, #wrapper .game_title a { color: var(--accent); }
#wrapper .footer { color: var(--text); }
#wrapper .game_author, #wrapper .game_text, #wrapper .game_genre, #wrapper .game_platform { color: var(--text); }
#wrapper :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#wrapper :is(.game_cell, .header_tabs, .screenshot_list, .breadcrumbs) :focus-visible { outline-offset: -2px; }
#wrapper .game_cell { position: relative; }
#wrapper .game_cell:has(:focus-visible)::after { content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none; border: 3px solid var(--focus-ring); border-radius: inherit; }
#wrapper .game_cell:focus-within .game_cell_tools { opacity: 1; }
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

Cambia los cuatro colores de arriba y toda la página se adapta. Si pasas a una paleta clara, cambia también `color-scheme: dark` por `light` y comprueba el contraste del anillo de foco sobre blanco (capítulo 4).

## Receta 2 — Base de proyecto

**Página:** proyecto (también da estilo a su devlog y sus comentarios). **Tamaño:** 846 bytes.

La misma idea para un proyecto. Aquí las variables de itch viven en `#wrapper`, el color del texto y el panel detrás de tu contenido se estilizan en `.inner_column`, y `min-height` evita que el gris claro de itch se vea debajo de una página corta.

```css
/* Project starter (also styles the devlog and comments): palette, colours, panel, focus ring, reduced motion */
#wrapper {
  --bg: #0b1433;
  --panel: rgba(20, 32, 70, .92);
  --text: #eef3ff;
  --accent: #ffc857;
  --focus-ring: #ffc857;
  --itchio_bg_color: var(--bg);
  --itchio_text_color: var(--text);
  --itchio_link_color: var(--accent);
  --itchio_input_focus_color: var(--focus-ring);
  color-scheme: dark;
  background-color: var(--bg);
  min-height: 100vh;
}
#wrapper .inner_column { color: var(--text); background-color: var(--panel); }
#wrapper .inner_column a { color: var(--accent); }
#wrapper .button { background-color: var(--accent); color: var(--bg); }
#wrapper :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#wrapper :is(.game_cell, .header_tabs, .screenshot_list, .breadcrumbs) :focus-visible { outline-offset: -2px; }
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

Después de pegarla, abre también la página del devlog y la de comentarios: comparten esta hoja (R13).

## Receta 3 — Rejilla de tarjetas de perfil

**Página:** perfil, diseño en rejilla. **Tamaño:** 588 bytes.

Columnas iguales que no se desbordan, una columna en los teléfonos, tarjetas de igual altura, portadas que llenan su caja y un pequeño levantamiento al pasar el ratón o al enfocar con el teclado.

```css
/* Profile card grid: even columns, one column on phones, equal heights, clean covers, a lift on hover and focus */
#wrapper .mode_grid .user_game_grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); column-gap: 40px; }
@media (max-width: 500px) { #wrapper .mode_grid .user_game_grid { grid-template-columns: 1fr; } }
#wrapper .game_grid_widget { align-items: stretch; grid-auto-rows: 1fr; }
#wrapper .game_thumb img { width: 100%; height: 100%; object-fit: cover; }
@media (prefers-reduced-motion: no-preference) {
  #wrapper .game_cell { transition: translate .2s ease-out; }
  #wrapper .game_cell:focus-within { translate: 0 -4px; }
}
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  #wrapper .game_cell:hover { translate: 0 -4px; }
}
```

El levantamiento solo ocurre en los visitantes que no han pedido movimiento reducido, y la versión al pasar el ratón solo en dispositivos que pueden tener ratón (R17, R18). La regla de igual altura también alcanza los carruseles de tus colecciones.

## Receta 4 — Resplandor de página completa

**Página:** perfil o proyecto. **Tamaño:** 334 bytes.

Dos resplandores de color suaves fijos detrás de toda la página, debajo de los botones de itch, sin capturar clics.

```css
/* Full-page glow behind the content (profile or project), released while an HTML5 game is maximised */
#wrapper { position: relative; isolation: isolate; }
#wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: radial-gradient(circle at 20% 10%, rgba(255, 200, 87, .18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(120, 160, 255, .16), transparent 50%);
}
body.frame_maximized #wrapper { isolation: auto; }
```

Cambia los degradados como quieras: la estructura que los rodea es lo que mantiene la capa detrás del contenido y fuera de su camino. La última línea devuelve la pantalla a un juego HTML5 cuando está maximizado. No añadas un `transform` ni un `filter` a `#wrapper` con esta receta, o el resplandor se desplazará con la página (capítulo 3).

## Receta 5 — Entrada del título del perfil

**Página:** perfil. **Tamaño:** 296 bytes.

Tu nombre se desliza una vez hasta su sitio, en 0,7 segundos.

```css
/* Profile title that slides in once, from hidden, and ends at rest */
@keyframes custom-in { from { opacity: 0; translate: 0 18px; } }
#wrapper #profile_header h1 { animation: custom-in .7s ease-out; }
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

El título es visible por defecto; la animación parte del estado oculto, así que si no se ejecuta, no se pierde nada (capítulo 5). Esto apunta al encabezado de texto de itch. Un perfil con imagen de banner no tiene título de texto visible. Da a tu biografía su propio `<h1 class="custom-title">` y apunta a `#wrapper .custom-title` en su lugar (R20).

## Receta 6 — Panel esmerilado de proyecto

**Página:** proyecto. **Tamaño:** 282 bytes.

Difumina lo que hay detrás de la columna de contenido, como una imagen de fondo o el resplandor de la receta 4, hasta convertirlo en cristal esmerilado.

```css
/* Project: frosted glass behind the content, safe with a maximised HTML5 game */
#wrapper #inner_column { isolation: isolate; }
#wrapper #inner_column::before { content: ""; position: absolute; inset: 0; z-index: -1; backdrop-filter: blur(8px); }
#wrapper:has(.game_frame.maximized) #inner_column { isolation: auto; }
#wrapper:has(.game_frame.maximized) #inner_column::before { content: none; }
```

El desenfoque va en un pseudoelemento, nunca en la propia columna, y ambos se liberan mientras un juego HTML5 está maximizado. Un desenfoque directamente en la columna puede estirar un juego maximizado hasta la altura completa de la página (R22). Haz semitransparente el color del panel de la receta 2, o no habrá nada que se vea a través.

## Receta 7 — Superar el límite del perfil con `@import`

**Página:** perfil (también funciona en proyectos; nunca en jams). **Tamaño de la parte pegada:** 291 bytes.

Cuando un diseño de perfil no cabe en 5.120 bytes, pega lo esencial y carga el resto desde un archivo que alojes tú. Solo la línea `@import` cuenta para el límite, no el archivo que carga.

```css
/* Profile over the cap: the import line goes first and loads the extras from a pinned URL; the pasted rules carry the look on their own */
@import url("https://cdn.jsdelivr.net/gh/USER/REPO@1.0.0/profile-extra.css");
#wrapper { --bg: #0b1433; --text: #eef3ff; --accent: #ffc857; background-color: var(--bg); }
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--text); }
#wrapper .user_page a, #wrapper .footer a { color: var(--accent); }
```

Reglas para hacerlo con seguridad:

1. **La línea `@import` debe ser la primera.** Solo pueden ir antes comentarios, `@charset` o una sentencia `@layer`. Cualquier otra cosa, incluso un `@font-face`, y la importación se descarta sin aviso (R9).
2. **Usa una dirección fijada y con versión.** Publica el archivo en un repositorio de GitHub, etiqueta una versión (`1.0.0`) y cárgalo a través de jsDelivr con la etiqueta en la URL, como arriba. Para cambiarlo, etiqueta una versión nueva y actualiza la línea `@import`. Nunca uses `raw.githubusercontent.com` ni un gist: se sirven como texto plano y el navegador los ignora (R10).
3. **La parte pegada debe valer por sí sola.** Si la importación falla, o un bloqueador de anuncios la para, los visitantes solo ven lo que pegaste. Por eso la paleta y los colores van en la parte pegada, y el archivo importado solo añade extras.
4. **Elige un alojamiento fiable.** Un `@import` retiene toda la página hasta que se carga. En una prueba, un servidor que aceptó la conexión y nunca respondió dejó la página en blanco durante más de cinco minutos. Una CDN conocida es la opción segura.
5. **Nunca en jams.** El CSS de una jam va dentro del bloque de estilo propio de itch, donde `@import` nunca se carga. Pega todo, hasta unos 20 KB (capítulo 1).

## Lista de comprobación

- [ ] Cada receta pegada en el tipo de página correcto.
- [ ] Un solo conjunto de tokens y un solo bloque de movimiento reducido en la hoja combinada.
- [ ] Total del perfil medido en bytes, por debajo de 5.120.
- [ ] Páginas de proyecto comprobadas en la principal, el índice del devlog, una entrada del devlog y los comentarios.
- [ ] Con un `@import`: primera línea, etiqueta fijada de jsDelivr, y la página se ve bien con la importación bloqueada.

---

## Fuentes

Cada receta está compuesta a partir de reglas y bloques de la base de conocimiento de itch-live-css (`knowledge/itch-custom-css.md`), citados en el capítulo de donde procede cada técnica:

- Receta 1: capítulo 4 (S3, S4, S8, S9, S13) y capítulo 5 (S4).
- Receta 2: capítulo 4 (S5, S8, S13), capítulo 3 (S2) y capítulo 5 (S4).
- Receta 3: capítulo 3 (S6, S7) y capítulo 5 (S5).
- Receta 4: capítulo 3 (S11, S12).
- Receta 5: capítulo 5 (S3, S4) y capítulo 2 (R20).
- Receta 6: §4 «Maximized HTML5 game», panel esmerilado seguro: verificado · s04-gf-10, s04-gf-11, s04-gf-13; el marco de altura completa de la página: verificado · s04-gf-08, s04-gf-09.
- Receta 7: §8: colocación de `@import`: verificado · localtests-09, localtests-50, itchcss-08; solo cuenta la línea: verificado · external-01, repo-09; fijación en jsDelivr y fallo de raw de GitHub: verificado · external-05, community-12, external-45; la página debe funcionar sin la importación: observado · repo-54; verificado · external-06, localtests-12; un servidor que no responde dejó la página en blanco más de 330 s: verificado · g08-17; jams: verificado · s04-1, crawljam-14.

**Estado de las pruebas.** Cada archivo pasó `engine validate()` para su tipo de página el 7 de noviembre de 2026. Los tamaños proceden del minificador del propio engine. Las recetas aún no se han renderizado en una página real de itch.
