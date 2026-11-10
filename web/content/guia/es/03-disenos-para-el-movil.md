# Capítulo 3 — Diseños que caben en un teléfono

La mayoría de las páginas de itch rotas se ven bien en el monitor del creador y se deshacen en un teléfono: una barra de desplazamiento lateral, una rejilla de tarjetas que se sale por el borde, un encabezado partido por la mitad. Este capítulo muestra los contenedores en los que trabajas y las pocas reglas que mantienen una página dentro de la pantalla.

## 3.1 Las cajas en las que trabajas

Cada página estilizada tiene un `#wrapper`, pero lo que hay dentro depende del tipo de página. Simplificado:

```text
Perfil         #wrapper.user_page_wrap
                 .user_page (.mode_grid o .mode_column)
                   #profile_header       tu nombre o banner
                   .profile_content      columna de biografía + rejilla de juegos
                 .footer                 posicionado abajo

Proyecto       #wrapper.game_page_wrapper
                 #inner_column           960 px de ancho; 600 px a 1000 px o menos
                   #header               banner o título
                   .view_game_page       la página en sí
                   #view_game_footer

Entrada devlog  misma #inner_column, luego la columna de la entrada
                 + una barra lateral de 307 px que se apila debajo a 1000 px o menos

Resumen jam    #wrapper.jam_page_wrap
                 .view_jam_page > .jam_banner_outer, .jam_body, #entries
```

[S1]

Lo que importa para el diseño:

- **El `#inner_column` de un proyecto recorta su contenido** (`overflow: hidden`), y lo mismo hace el `.jam_body` de una jam. Todo lo que sobresalga, como una sombra, un resplandor o una tarjeta girada, se corta. [S1]
- **La columna de un proyecto pasa de 960 px a 600 px** a 1000 px o menos. Tu diseño tiene que funcionar en ambos anchos. [S1]
- **El `body` de una página de proyecto sigue en gris claro** (`#eee`). Si tu página es más corta que la ventana, ese gris se ve debajo. Arréglalo con `#wrapper { min-height: 100vh; }`. [S2]

## 3.2 Los anchos que hay que probar

El diseño de itch cambia en estos anchos, así que prueba a ambos lados de cada uno:

| Página | Anchos |
|---|---|
| Todas las páginas | **320 px** y **375 px** (teléfonos pequeños) |
| Perfil | 800, 650, 600 |
| Proyecto, devlog | 1000, 650, 600, 400 |
| Jam | 820, 800, 650, 600 |

La lista completa de puntos de cambio es 1001/1000, 961/960, 801/800, 651/650 y 601/600 px. [S3]

Prueba cambiando el tamaño de la ventana del escritorio o con la barra de dispositivo del navegador. No hace falta cambiar el user agent, con una excepción: un juego HTML5 ancho fija el ancho de la columna del proyecto cuando el navegador dice que es un escritorio. [S3]

## 3.3 Cómo evitar el desplazamiento lateral

Una página se desplaza lateralmente cuando algo dentro es más ancho que la pantalla: una imagen demasiado grande, una tarjeta girada, una palabra larga, un ancho fijo.

Primero, encuentra la causa y corrígela. Después añade una red de seguridad:

```css
#wrapper { overflow-x: clip; }
```

Usa `clip`, no `hidden`. `overflow-x: hidden` también quita la barra de desplazamiento lateral, pero convierte `#wrapper` en un contenedor con desplazamiento, y todo lo que tenga `position: sticky` dentro deja de quedarse fijo. `clip-path` tampoco sirve: oculta el desbordamiento visualmente, pero la página sigue desplazándose. [S4]

Evita `100vw` para los anchos. En un escritorio con la barra de desplazamiento visible, `100vw` es más ancho que la página, y eso crea el desbordamiento que intentas eliminar. Usa `100%` en su lugar. [S5]

## 3.4 Rejillas de juegos que se comportan

La rejilla de juegos es donde más diseños se rompen, porque el JavaScript de itch la dimensiona después de cargarse tu CSS. Escribe los anchos de columna en píxeles y su propio espaciado. Por eso:

- Definir `--itchio_grid_gap` en `#wrapper` no hace nada.
- Definir solo un `gap` hace que la rejilla sea más ancha que su caja, y se desborda.

Define las columnas y el espaciado juntos, en una sola regla que empiece por `#wrapper`:

```css
/* Perfil, solo diseño en rejilla */
#wrapper .mode_grid .user_game_grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  column-gap: 40px;
}

/* Entradas de la jam */
#wrapper .browse_game_grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  column-gap: 40px;
}
```

Mantén `.mode_grid` en la regla del perfil. Sin él, la regla también afecta a los perfiles con diseño en columna y los rompe. [S6]

En un perfil la rejilla mantiene al menos dos columnas incluso a 320 px. Para una sola columna en teléfonos: [S6]

```css
@media (max-width: 500px) {
  #wrapper .mode_grid .user_game_grid { grid-template-columns: 1fr; }
}
```

Las rejillas de las jams pasan a una columna a 320 px por sí solas. [S6]

### Tarjetas de igual altura y portadas limpias

itch alinea las tarjetas arriba, así que una tarjeta con un título largo es más alta que sus vecinas. Para igualarlas:

```css
#wrapper .game_grid_widget { align-items: stretch; grid-auto-rows: 1fr; }
```

En un perfil, este selector también alcanza los carruseles de tus colecciones. [S7]

Para que cada portada llene su caja sin deformarse:

```css
#wrapper .game_thumb img { width: 100%; height: 100%; object-fit: cover; }
```

Las portadas se cargan de forma diferida, así que nunca escribas un selector que dependa del `src` de la imagen. [S7]

## 3.5 Texto que cabe

- **Los encabezados grandes mantenidos en una línea** (`white-space: nowrap`) con un tamaño mínimo en `rem` hacen que la página se desplace lateralmente cuando el visitante usa una fuente predeterminada más grande (probado a 32 px). Deja que el tamaño siga el ancho de la pantalla, con un tope: `font-size: min(10vw, 6rem);`. [S8]
- **Nunca pongas una altura fija a una caja de texto con `overflow: hidden`.** Cuando el visitante agranda el texto, la parte inferior desaparece. Deja que la altura crezca con el texto. [S8]

## 3.6 Dejar sitio para los elementos propios de itch

Algunos elementos de itch se colocan encima de tu diseño. Déjales sitio:

- **Pie del perfil.** Está posicionado de forma absoluta en la parte inferior de `#wrapper`, así que un `margin-top` no le hace nada. Añade espacio con un `margin-bottom` en el último bloque de encima, o con padding en `#wrapper`. Conserva los 50 px de padding inferior del perfil. [S9]
- **Barra inferior de proyecto.** A 650 px o menos, una página de proyecto tiene una barra fija de 50 px en la parte inferior de la pantalla. No pongas nada importante detrás. [S10]
- **Esquina superior derecha.** El botón Follow y las otras herramientas de usuario están ahí, fuera de `#wrapper`. Mantén las decoraciones lejos de esa esquina. [S10]

## 3.7 Decoraciones de página completa sin romper el diseño

Una capa de fondo a pantalla completa (un degradado, un patrón, un resplandor) debe ir en un pseudoelemento de `#wrapper`, no en la página en sí:

```css
#wrapper { position: relative; isolation: isolate; }
#wrapper::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
body.frame_maximized #wrapper { isolation: auto; }
```

La última línea libera el aislamiento mientras un juego HTML5 está maximizado, para que el juego quede por encima. Es la única excepción permitida a empezar por `#wrapper` (R2). Después pinta la capa con propiedades `background-*` sobre `#wrapper::before`.

- `isolation: isolate` mantiene la capa detrás de tu contenido pero delante del propio fondo de `#wrapper`.
- `pointer-events: none` evita que capture clics.

[S11]

Dos trampas:

- **Capas fijas que se desplazan con la página.** Si `#wrapper`, `.user_page` o `#inner_column` tienen un `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change: transform` o `contain`, un hijo con `position: fixed` deja de quedarse fijo en la pantalla. Pon esos efectos en el pseudoelemento o en un hijo. [S12]
- **`background-attachment: fixed` se ignora en iPhone y iPad.** La capa fija de arriba funciona en todas partes. [S12]

## Lista de comprobación

- [ ] Probado a 320 y 375 px, y a ambos lados de los puntos de cambio de tu tipo de página.
- [ ] Sin desplazamiento lateral. `#wrapper { overflow-x: clip; }` como red de seguridad, nunca `hidden`, nada de `100vw`.
- [ ] Columnas y espaciado de la rejilla definidos juntos; la regla del perfil conserva `.mode_grid`.
- [ ] Los encabezados grandes usan `min(…vw, …rem)`; ninguna caja de texto tiene altura fija.
- [ ] Nada importante detrás de la barra inferior del proyecto ni de las herramientas de la esquina superior derecha.
- [ ] Las decoraciones de página completa están en `#wrapper::before`, sin `transform` ni `filter` en `#wrapper`.
- [ ] Comprobado sin sesión iniciada, en una página en vivo.

---

## Fuentes

De la base de conocimiento de itch-live-css, `knowledge/itch-custom-css.md` §3, §7, §9 y §10.

- **S1** Estructura de la página, anchos y recorte de `#inner_column`, barra lateral del devlog, recorte de `.jam_body` en jams: verificado · corpus-31, crawlprofile-01, crawlprofile-15, crawlproject-01, crawlproject-11, crawlproject-39, itchcss-35, itchcss-38, crawljam-19, crawljam-20.
- **S2** El `body` de un proyecto sigue en `#eee`: verificado · itchcss-37.
- **S3** Puntos de cambio y anchos de prueba, redimensionar frente a user agent: verificado · a11y-31, a11y-34, s10-01, crawljam-47, crawlproject-50; verificado (render en vivo) · s10-23, s10-24.
- **S4** `overflow-x: clip`, `hidden` rompe sticky, `clip-path` sigue desplazando: verificado · localtests-27, localtests-29. La explicación del contenedor con desplazamiento es comportamiento general de CSS.
- **S5** Evitar `100vw`: comunidad · community-30. La explicación de la barra de desplazamiento es comportamiento general de CSS, no una prueba en itch.
- **S6** Dimensionado de la rejilla, columnas y espaciado juntos, protección `.mode_grid`, columnas en teléfono: verificado · gapfill07-01, gapfill07-02, gapfill07-03.
- **S7** Alturas iguales, portadas, carga diferida: verificado · repo-32, repo-33, repo-34, crawlprofile-11, crawlprofile-15.
- **S8** Tamaño de los encabezados y alturas fijas: verificado (arnés sin scripts) · a11y-31, a11y-45.
- **S9** Pie absoluto, padding inferior de 50 px: verificado · crawlprofile-09, repo-24; observado · s02-n7.
- **S10** Barra inferior de proyecto a 650 px o menos, herramientas de la esquina superior derecha: verificado · s10-15, crawlprofile-19, itchcss-32, crawlprofile-60.
- **S11** Capa de página completa (bloque B4): verificado · localtests-39, repo-46, itchcss-29, s04-gf-11; verificado (render en vivo) · s10-19.
- **S12** Capas fijas que se desplazan: verificado · localtests-37. iOS y `background-attachment: fixed`: documentado · s10-12.
