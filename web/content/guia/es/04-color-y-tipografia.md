# Capítulo 4 — Color y tipografía, con tokens y temas oscuros

El color y las fuentes son donde empieza la mayoría del CSS personalizado, y donde el tema de itch se resiste sin avisar: un color de enlace que no cambia, una fuente que solo se aplica a media página, un texto de tarjeta ilegible sobre un fondo oscuro. Este capítulo muestra dónde escribe itch cada color y cada fuente, y cómo tomar el control de ellos limpiamente con unos pocos tokens.

## 4.1 Prueba primero el editor de tema

El editor de tema ya define el color de fondo, del texto, de los enlaces y de los botones, una imagen de fondo y una fuente de Google. Si una opción de ahí hace lo que quieres, úsala: no te cuesta bytes de CSS y sobrevive a los cambios de itch. Escribe CSS para lo que el editor no puede hacer. [S1]

## 4.2 Por qué ganan tus reglas

Ninguna regla del tema usa selectores de ID, y las hojas de estilo propias de itch solo usan IDs para su visor de imágenes. Así que cualquier regla que empiece por `#wrapper` vence a todas las reglas normales de itch. Es otra razón para la R2. [S2]

Las únicas excepciones son algunas reglas de itch marcadas con `!important`. Solo ahí necesitas tú también `!important` (R14). [S2]

## 4.3 Tus propios tokens

Define tu paleta una vez, como propiedades personalizadas en `#wrapper`, y úsalas en todas partes:

```css
#wrapper {
  --bg: #0b1433;
  --panel: #142046;
  --text: #eef3ff;
  --accent: #ffc857;
  --focus-ring: #ffc857;
}
```

Por qué `#wrapper` y no `:root`: las propiedades en `:root` se filtran a la interfaz propia de itch. En una jam recolorearon la cabecera del sitio (R3). Todo lo que hay dentro de `#wrapper`, incluido el pie, puede leer los tokens definidos en `#wrapper`. [S3]

Cambiar la paleta más adelante significa cambiar estas líneas y nada más.

## 4.4 Tomar el control de los colores de itch

itch tiene variables de tema (`--itchio_link_color` y compañía), pero en perfiles y proyectos muchos colores están escritos como valores fijos, no como variables. Definir una variable cambia solo lo que la lee. Así que tienes que definir la variable **y** dar estilo a los elementos que la ignoran.

### Perfil

itch declara sus variables en `.user_page`, así que sobrescríbelas ahí. Los enlaces, los títulos de juego y el pie usan colores fijos, así que defínelos también:

```css
#wrapper { background-color: var(--bg); }
#wrapper .user_page { --itchio_link_color: var(--accent); color: var(--text); }
#wrapper .user_page a, #wrapper .footer a, #wrapper .game_title a { color: var(--accent); }
#wrapper .footer { color: var(--text); }
```

[S4]

### Proyecto, devlog y comentarios

Aquí itch declara diez variables en el propio `#wrapper`. El color del texto y el panel semitransparente detrás de tu contenido son valores fijos en `.inner_column`:

```css
#wrapper {
  --itchio_bg_color: var(--bg);
  --itchio_text_color: var(--text);
  --itchio_link_color: var(--accent);
  background-color: var(--bg);
}
#wrapper .inner_column { color: var(--text); background-color: var(--panel); }
#wrapper .inner_column a { color: var(--accent); }
```

Los botones también necesitan su propia regla (`#wrapper .button { … }`). [S5]

### Jam

Desde el rediseño de jams de mediados de 2026, los enlaces y botones de las jams siguen las variables de `#wrapper`. Si cambias `--itchio_button_color`, define también sus compañeras `_hover_color`, `_active_color`, `_shadow_color` y `_border_color`; si no, los estados al pasar el ratón, al pulsar y del borde conservan los colores de itch. Parte del texto de la rejilla de entradas se colorea con `!important`, y tú también necesitas `!important` para cambiarlo. [S6]

### Color y imagen de fondo

Usa `background-color`, `background-image` y las demás propiedades individuales en `#wrapper`, nunca la abreviatura `background` (R4). La imagen de fondo del tema vive en ese mismo elemento, y la abreviatura la borra. [S7]

## 4.5 Temas oscuros

itch no tiene reglas de modo oscuro propias. Cuando pases a oscuro:

- **Avísale al navegador.** `#wrapper { color-scheme: dark; }` cambia las barras de desplazamiento y los controles de formulario dentro de la página a sus versiones oscuras. `light-dark()` devuelve el valor claro salvo que se defina `color-scheme`, y itch nunca lo define. [S8]
- **Arregla el texto de tarjeta desvanecido.** En los perfiles, itch pinta los autores de las tarjetas al 75 % del color del texto, y las plataformas y géneros al 50 %. Sobre fondos oscuros eso puede quedar por debajo de un contraste legible. Dales un color sólido:

  ```css
  #wrapper .game_genre, #wrapper .game_platform { color: var(--text); }
  ```

  [S9]
- **Recolorea el pie del perfil** (mostrado en 4.4). No sigue al tema. [S9]

### Seguir la preferencia clara u oscura del visitante

Como todo lee tokens, cambiar según el ajuste de sistema del visitante son unas pocas líneas:

```css
@media (prefers-color-scheme: light) {
  #wrapper { --bg: #f6f4ef; --panel: #ffffff; --text: #1d1f2b; --accent: #8a4b00; color-scheme: light; }
}
```

Esto es CSS estándar, no algo que itch haga por ti. En un perfil, cada paleta extra cuesta bytes del límite de 5.120, así que mídela (capítulo 1). [S10]

## 4.6 Contraste en el que puedes confiar

- **El texto normal necesita al menos 4,5:1** frente a lo que tiene detrás, y los anillos de foco al menos 3:1 (WCAG). [S11]
- **Mide contra la zona más clara de tu imagen de fondo**, no contra el color de fondo. Un color de texto pálido medía 16,3:1 frente al azul oscuro de la página, pero solo 4,6:1 sobre la mancha más clara de su imagen de fondo. [S11]
- **Haz los paneles semitransparentes, nunca el texto.** Un panel translúcido detrás del texto mantiene el contraste predecible. El texto translúcido depende de lo que haya debajo. [S11]
- **El modo de alto contraste** (los «colores forzados» de Windows) elimina sombras y degradados. Da a las tarjetas `border: 1px solid transparent` para que sigan teniendo contorno allí. [S12]

## 4.7 Un anillo de foco que combine con tu paleta

El anillo de foco de itch es un morado oscuro que casi desaparece en los temas oscuros (R19). Este bloque (lee el token `--focus-ring` de 4.3) lo sustituye en todas partes, incluidas las tarjetas de juego, donde un contorno normal se corta:

```css
#wrapper { --itchio_input_focus_color: var(--focus-ring); }
#wrapper :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }
#wrapper :is(.game_cell, .header_tabs, .screenshot_list, .breadcrumbs) :focus-visible { outline-offset: -2px; }
#wrapper .game_cell { position: relative; }
#wrapper .game_cell:has(:focus-visible)::after {
  content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
  border: 3px solid var(--focus-ring); border-radius: inherit;
}
#wrapper .game_cell:focus-within .game_cell_tools { opacity: 1; }
```

Elige un `--focus-ring` con al menos 3:1 de contraste en cada superficie en la que pueda aparecer. `#ffc857` da 11,75:1 sobre `#0b1433`, pero solo 1,54:1 sobre blanco. [S13]

## 4.8 Fuentes

### Dónde definir la fuente

El tema escribe la familia tipográfica como valor fijo, no a través de `--itchio_font_family`. Cambiar la variable por sí sola no cambia el texto. Define la familia donde lo hace itch: [S14]

| Página | Selector |
|---|---|
| Perfil | `#wrapper .user_page` |
| Proyecto, devlog | `#wrapper .inner_column` |
| Jam | `#wrapper` |

### Pesos extra y otras fuentes

Una fuente elegida en el editor de tema carga solo las versiones regular (400) y bold (700), más sus cursivas. Para otros pesos, o una fuente que el selector no ofrece:

```css
/* Perfil o proyecto: el @import debe ser la primera línea (R9) */
@import url("https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap");
#wrapper .user_page { font-family: "Syne", sans-serif; } /* proyecto: #wrapper .inner_column */
```

[S15]

- **Copia la URL exactamente** desde Google Fonts y conserva `&display=swap`. Una mayúscula mal puesta, una familia desconocida o un rango de pesos que la fuente no tiene hace que Google responda con una página de error. La importación entera se descarta sin aviso y aparece la fuente de respaldo. [S16]
- **Las jams no pueden usar `@import`** (R9). Usa `@font-face` con un enlace `https://` absoluto a un archivo de fuente por peso, desde un servidor que permita cargar fuentes desde otros sitios. [S16]
- **Privacidad:** Google Fonts ve la dirección IP de cada visitante, lo que es un problema de RGPD en la UE. Bunny Fonts ofrece una dirección `css2` compatible, o puedes alojar los archivos tú mismo con acceso de origen cruzado activado. [S17]
- **Solo la línea `@import` cuenta para el límite del perfil**, no el tamaño del archivo de fuente. [S18]

### Tamaño de fuente en los perfiles

Un perfil fija su tamaño de fuente como porcentaje en `.user_page`. Los tamaños en `em` lo siguen; los tamaños en `px` o `rem` no. [S19]

## Lista de comprobación

- [ ] Usé el editor de tema para lo que puede hacer.
- [ ] Paleta definida una vez como tokens en `#wrapper`, nunca en `:root`.
- [ ] Las variables de itch definidas donde las declara el tema, **y** enlaces, títulos, botones y pie con estilo propio directamente.
- [ ] Fondo definido solo con propiedades individuales.
- [ ] Tema oscuro: `color-scheme: dark`, colores de texto de tarjeta sólidos, pie del perfil recoloreado.
- [ ] Texto a 4,5:1 o más sobre la zona más clara de la imagen de fondo; anillo de foco a 3:1 o más.
- [ ] Familia tipográfica en el selector correcto; URL de Google Fonts copiada exactamente; sin `@import` en jams.

---

## Fuentes

De la base de conocimiento de itch-live-css, `knowledge/itch-custom-css.md` §0.1 (bloques B2, B3), §4, §7, §8 y §10.

- **S1** Primero el editor de tema: documentado · docs-44.
- **S2** Sin IDs en las reglas del tema; `!important` cuenta: verificado · crawlproject-31, s04-2, s04-4, itchcss-18, s04-1, docs-17, crawljam-07.
- **S3** Variables en `#wrapper`; `:root` se filtró en una jam: verificado · crawljam-42, itchcss-12, crawljam-05.
- **S4** Variables del perfil y colores fijos: verificado · itchcss-12, repo-20, repo-21, crawlprofile-32; color del pie: verificado · itchcss-22.
- **S5** Variables del proyecto y valores fijos en `.inner_column`: verificado · corpus-44, itchcss-13, crawlproject-21, crawlproject-24; inferido · s04-2.
- **S6** Variables de jam, compañeras de botón, texto de rejilla con `!important`: verificado · crawljam-05, crawljam-08, crawljam-11, crawljam-34, itchcss-14.
- **S7** Propiedades individuales de fondo: verificado · itchcss-57, crawlprofile-35, crawlproject-23, itchcss-20, localtests-18.
- **S8** Sin reglas de modo oscuro en itch, `color-scheme: dark`, `light-dark()`: verificado · a11y-14, support-52, itchcss-27, support-59, s07-n2 T27; observado · s07-n11.
- **S9** Texto de tarjeta desvanecido, pie: verificado · a11y-38, crawlprofile-54, itchcss-22.
- **S10** Cambio por `prefers-color-scheme`: CSS general, no probado en itch. El coste en bytes se deduce de R7.
- **S11** Contraste medido sobre la zona más clara de la imagen, paneles translúcidos: verificado · s10-06; paneles: inferido · s10-06. Los umbrales 4,5:1 y 3:1 son de WCAG 2.2.
- **S12** Colores forzados y bordes transparentes: verificado · s10-05, a11y-28.
- **S13** Bloque de foco B2 y sus cifras de contraste: verificado · s04-gf-02, s04-gf-06, s04-gf-16. Aquí reformateado en varias líneas; mismas reglas.
- **S14** La familia tipográfica es un valor fijo; dónde definirla: verificado · crawlprofile-32, crawlprofile-37, crawlproject-24, crawlproject-28, crawljam-14; inferido para la variable.
- **S15** Las fuentes del tema cargan 400/700 + cursivas: verificado · corpus-13, corpus-45, gapfill07-05.
- **S16** Los errores de Google Fonts descartan la importación; `@font-face` en jams: verificado · external-38, external-39, crawljam-02, itchcss-07, external-16.
- **S17** Privacidad y alternativas: comunidad · external-43; verificado · x08-05.
- **S18** Solo cuenta la línea `@import`: verificado · external-01, repo-09.
- **S19** Tamaño de fuente del perfil en `%`: verificado · crawlprofile-39, itchcss-43.
