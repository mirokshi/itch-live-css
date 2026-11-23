# Capítulo 2 — Las 24 reglas, en palabras sencillas

Estas son las reglas que deciden si tu CSS funciona, si se queda en tu página y si un visitante puede seguir usándola. Los números coinciden con la base de conocimiento (R1–R24), así que puedes buscar la evidencia de cualquier regla allí.

La mayoría no son límites técnicos. itch sirve cualquier CSS que pegues. Las reglas existen porque itch puede retirarte el acceso, y porque un visitante puede salir perjudicado si una página se rompe o esconde cosas. [policy]

## Acceso y alcance

### R1 — Comprueba primero que tienes el campo
El personal de itch concede el CSS personalizado a mano. Sin el campo, nada de lo que pegues tiene efecto. La alternativa es el editor de tema más HTML en tu biografía o descripción. (El capítulo 1 explica cómo comprobarlo.) [R1]

### R2 — Empieza cada regla con `#wrapper`
itch no limita tu CSS a tu zona. Todo lo que escribas se aplica a la página entera, así que un `body`, `html`, `a`, `img` o `*` sueltos dan estilo al sitio alrededor de tu contenido, incluida la cabecera y el pie. Empieza cada selector con `#wrapper`, incluso dentro de `@media` y `@supports`.

```css
@media (min-width: 700px) {
  #wrapper .user_page { max-width: 720px; }
}
```

No escribas nunca `body > #wrapper`: la base de conocimiento lo incluye entre los selectores prohibidos. [R2]

### R3 — Define tus variables en `#wrapper`, no en `:root`
Las propiedades personalizadas en `:root` o `html` se filtran a la interfaz propia de itch. En una jam recoloreron la cabecera del sitio. Pon tus variables en `#wrapper` (o en `#wrapper .user_page` para un perfil), y se quedarán dentro de la página. [R3]

### R4 — Nunca uses la abreviatura `background` en `#wrapper`
El tema ya pinta tu imagen de fondo en ese mismo elemento, con propiedades separadas. La abreviatura las restablece todas, así que tu imagen desaparece. Usa las propiedades individuales (`background-color`, `background-image`, `background-size` y demás). [R4]

### R13 — En un proyecto, tu hoja también da estilo al devlog y a los comentarios
El CSS de un proyecto llega a `/devlog`, a cada entrada de devlog y a `/comments`. Apunta a la página que quieres con las clases de cada página: la página principal, el índice, una entrada y la página de comentarios son distintas. Compruébalas las cuatro antes de publicar. [R13]

## No romper ni falsear la interfaz de itch

### R5 — Nunca ocultes, muevas, tapes ni falsees los controles de itch
Incluye los enlaces del pie, la cabecera del sitio, la barra «User tools», los diálogos, los botones de compra y descarga, los precios, el cuadro «More information» y la insignia de enlace externo. Darles estilo está bien; ocultarlos o moverlos puede costarte el acceso al CSS. [R5]

### R6 — Nunca engañes ni rastrees a los visitantes
Nada de botones falsos, modales falsos, insignias falsas, capas que capturan clics ni suplantación de un sitio o una persona. Tu CSS tampoco puede «llamar a casa»: nada de peticiones `url()` que actúen como balizas, nada de selectores de campos de formulario, nada de cookies ni registro de visitantes. [R6]

### R12 — No apuntes a IDs numerados
Los IDs como `#user_123` o `#view_game_456` cambian en cada renderizado. Usa anclas estables: `#wrapper`, `#profile_header`, `#inner_column`, `#header`, `#view_game_footer` y `#entries`. [R12]

### R20 — Mantén exactamente un `h1`
Cada página debe tener un `h1` que la nombre. Algunos diseños ocultan el encabezado propio de itch (un perfil con banner, un proyecto con banner o con un juego HTML5 incrustado). Entonces añade un `<h1>` con una clase `custom-` a tu biografía o descripción. En las jams conserva el `.jam_title_header` de itch, y nunca des estilo a `#wrapper h1`. [R20]

## Tamaño y pegado

### R7 — Mide tu tamaño y di qué es
El CSS de un perfil puede ocupar como máximo **5.120 bytes** después de recortar los espacios del principio y del final; los comentarios cuentan. Por encima de eso, el guardado se rechaza, no se corta. Los proyectos y devlogs no tienen límite práctico. Las jams rondan los 20 KB. Mide cada versión; el capítulo 1 tiene los comandos. [R7]

### R8 — Pega solo CSS minificado
Nada de etiquetas `<style>`. Nunca el texto `</style>`, en ninguna combinación de mayúsculas y minúsculas, ni siquiera dentro de un comentario, porque itch lo borra de la hoja guardada. Escribe `>` tal cual, no como `&gt;`. [R8]

### R9 — Pon cada `@import` primero
Solo pueden ir antes de un `@import` comentarios, una línea `@charset` o una línea `@layer`. En cualquier otro caso se descarta sin aviso. En las jams `@import` nunca se carga; usa `@font-face` o el selector de fuentes. [R9]

### R10 — Importa solo archivos seguros, fijados a una versión y por `https://`
Usa `https://`, una hoja de estilos (`text/css`), una respuesta correcta y una dirección con versión fija. No importes desde `raw.githubusercontent.com` ni desde gists de GitHub, que cambian sin avisar. Mantén tu CSS utilizable si la importación falla o se bloquea: la página debe seguir viéndose aceptable sin ella. [R10]

### R23 — Usa URLs `https://` absolutas en todas partes
En cada `url()` y cada `@import`, escribe la dirección completa. Las rutas relativas se resuelven respecto a la página que visita la persona, no respecto a tu archivo. [R23]

## Nombres

### R11 — Da a las clases HTML el prefijo `custom-`
En biografías y descripciones, itch solo conserva una clase si empieza por `custom` en minúsculas. Lo que venga después del prefijo sobrevive, pero `id`, `data-*`, `aria-*`, `role`, los manejadores de eventos y `tabindex` (salvo en un `spoiler`) se eliminan. Además, evita nombres que empiecen por `custom-ad`, `custom-social`, `custom-share` y `custom-cookie`: los bloqueadores de anuncios los ocultan. [R11]

### R16 — Pon el prefijo `custom-` a cada nombre de `@keyframes`
itch ya define una docena de nombres de animación, como `bounce` y `spin`. Una regla con el mismo nombre sustituye la animación de itch en todas las páginas. `custom-bob` es seguro; `bob` no lo es. [R16]

## Movimiento e interacción

### R14 — Usa `!important` solo para vencer al `!important` de itch
Úsalo contra el `!important` de itch, contra `style=""` en línea o contra otro `!important` que también sea tuyo. Nunca en una propiedad animada (la congela), y nunca `outline: none !important`. [R14]

### R15 — No uses `@layer` para tus sobrescrituras
itch no tiene capas. Cualquier regla dentro de una capa pierde frente a todas las reglas normales de itch, sea cual sea tu especificidad. Escribe reglas normales. [R15]

### R17 — La animación empieza, dura poco y se detiene
Todo movimiento que se inicie solo debe terminar en 5 segundos y quedar en reposo. Una animación en bucle junto al contenido incumple WCAG 2.2.2, y los ajustes de movimiento reducido no lo arreglan. Haz que el estado de reposo sea legible: nunca empieces desde `opacity: 0` con `forwards`. Haz bucles solo al pasar el ratón o al enfocar, o tras una elección explícita del visitante. [R17]

```css
@keyframes custom-bob { to { translate: 0 -4px; } }
#wrapper .custom-title { animation: custom-bob 1.2s ease-in-out 4 alternate; }
```

Ese es el patrón: con prefijo, finito y que termina en reposo.

### R18 — Pon los efectos de pasar el ratón dentro de `@media (hover: hover)`
Las pantallas táctiles no tienen ratón. Envuelve los efectos de paso del ratón en `@media (hover: hover)`, y dale a cada uno un equivalente de foco para que quienes usan teclado tengan el mismo efecto. [R18]

### R21 — Oculta lo que no debe leerse con `display: none`
`opacity: 0`, `color: transparent` y el texto solo para lectores de pantalla siguen en el árbol de accesibilidad, así que un lector de pantalla los anuncia igualmente. `display: none` los elimina. El contenido decorativo generado (`content: "★"`) también debe anunciarse como nada: dale una alternativa vacía con `content: "★" / ""`. [R21]

### R22 — En las páginas de proyecto HTML5, mantén los efectos fuera de los ancestros del juego
`filter`, `backdrop-filter`, `transform`, `will-change` y las animaciones de entrada sobre `#wrapper`, `#inner_column`, `.view_game_page` o `.embed_wrapper` pueden interferir con el juego incrustado. Ponlos en elementos dentro de la página, y libera `isolation` mientras el juego está maximizado. [R22]

## Accesibilidad

### R19 — Mantén un anillo de foco fácil de ver
El anillo de foco por defecto de itch es un morado oscuro que mide solo 1,1–1,5:1 frente a los fondos oscuros probados. WCAG exige al menos 3:1 para los indicadores de foco. Define un anillo que lo cumpla y mantén un contorno visible en cada elemento enfocable. [R19]

### R24 — Compruébalo sin sesión iniciada, en anchos de teléfono
Prueba a 320 px y 375 px, más los puntos de cambio de tu tipo de página, sin sesión iniciada y con los scripts de itch funcionando. Las comprobaciones con lector de pantalla que leen la página como texto no muestran lo que oye un visitante, así que prueba también con un lector de pantalla. [R24]

## Lista de comprobación

- [ ] Tengo el campo Custom CSS (R1).
- [ ] Cada selector empieza por `#wrapper` (R2), y las variables están en `#wrapper` o por debajo (R3).
- [ ] Ninguna abreviatura `background` en `#wrapper` (R4).
- [ ] No oculto, muevo ni falseo la interfaz de itch, y no rastreo a nadie (R5, R6).
- [ ] Ningún ID numerado (R12). Un solo `h1` (R20).
- [ ] Tamaño medido en bytes, minificado, sin `</style>` (R7, R8).
- [ ] Las líneas `@import` van primero, fijadas y por `https://` (R9, R10, R23).
- [ ] Clases y keyframes empiezan por `custom-` (R11, R16).
- [ ] El movimiento es finito y termina en reposo (R17); los efectos de paso del ratón están acotados (R18).
- [ ] El anillo de foco cumple 3:1 (R19); comprobado sin sesión iniciada a 320 y 375 px (R24).

---

## Fuentes

Cada regla procede del §0 («Reglas que una IA nunca debe romper») y del §2 de la base de conocimiento. Los identificadores de cada dato están listados para que puedas comprobar la evidencia y su etiqueta. Las etiquetas se mantienen tal como están en la base: una regla no puede ser más firme aquí que allí.

- **Marco de política** (la mayoría de las reglas son política, aplicada por el personal): documentado · docs-10, docs-12, docs-13, community-23; no se ha encontrado ninguna revocación pública.
- **R1** documentado · docs-01, community-48.
- **R2** documentado · docs-09; verificado · corpus-01, corpus-16, S03-N7. La excepción `body.frame_maximized` está en §4 (s04-gf-10).
- **R3** verificado · crawljam-42, itchcss-12, crawljam-05.
- **R4** verificado · repo-18, itchcss-57, crawlprofile-35, crawlproject-23.
- **R5** documentado · docs-10, docs-11, docs-12, community-23; comunidad · community-24; verificado · itchcss-46.
- **R6** documentado · docs-10, docs-12, docs-13, external-33; verificado · external-32, external-47.
- **R7** verificado 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a a live-cap-A3c, live-cap-B1, live-cap-B2; jam: documentado · crawljam-29; inferido · gapfill01-03.
- **R8** verificado 2026-10-16 · live-c42 a live-c44; documentado · repo-05; observado · crawlprofile-25; verificado · corpus-02.
- **R9** verificado · repo-10, external-03, s06-run, crawljam-02.
- **R10** verificado · external-04, external-05, external-06, localtests-12; observado · repo-14. Las importaciones fijadas se muestran en el capítulo 6, receta 7; el servicio por visita queda fuera de esta guía.
- **R11** verificado 2026-10-16 · live-k03 a live-k15, live-a01 a live-a06, live-a11, live-k34; documentado · docs-34; observado · sanitizer-05, gapfill05-06; verificado · external-30, x08-07.
- **R12** verificado · crawlproject-01, crawlproject-06.
- **R13** verificado · s01-n2, crawlproject-37, S03-N3.
- **R14** verificado · docs-17, crawljam-07, localtests-04, localtests-24, gapfill01-13.
- **R15** verificado · support-37, external-12, s06-static.
- **R16** verificado · s06-static, s06-kf.
- **R17** verificado · gapfill02-01, gapfill02-02, s10-02, a11y-24; documentado · a11y-25.
- **R18** verificado · s10-03, a11y-18.
- **R19** verificado · s04-5, s04-gf-02, s04-gf-16.
- **R20** verificado · itchcss-54, crawlproject-10; verificado (render en vivo) · s10-25; observado · crawljam-46.
- **R21** verificado · a11y-03, a11y-10.
- **R22** verificado · s04-gf-08, s04-gf-09, s04-gf-11.
- **R23** verificado · s02-n6, localtests-19.
- **R24** documentado · docs-15; verificado · a11y-31, localtests-34; verificado (render en vivo) · s10-17.
- **[policy]** documentado · docs-10, docs-12, docs-13 (ver el marco de política arriba).
