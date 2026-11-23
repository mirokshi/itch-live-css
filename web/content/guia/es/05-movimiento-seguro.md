# Capítulo 5 — Movimiento que se puede publicar sin riesgo

La animación es la forma más rápida de hacer que una página parezca viva, y también la más rápida de hacerla inutilizable: un movimiento que nunca se detiene, un encabezado que un lector de pantalla deletrea letra a letra, un nombre de animación que sustituye en silencio a uno de itch. Este capítulo te da las reglas, un bloque que siempre debes incluir y patrones que las respetan.

## 5.1 La versión corta

1. Pon a cada `@keyframes` el prefijo `custom-` (R16).
2. El movimiento que se inicia solo se detiene en 5 segundos y termina en reposo (R17).
3. Incluye siempre el bloque de movimiento reducido de 5.4 (R17).
4. Los efectos al pasar el ratón van dentro de `@media (hover: hover)` y tienen un equivalente de foco (R18).
5. Nunca pongas `!important` en una propiedad animada (R14).

## 5.2 Nombra tus keyframes `custom-…`

itch define 13 nombres de animación propios, entre ellos `bounce` y `spin`. Los nombres de keyframes son globales: si escribes `@keyframes spin`, el tuyo sustituye al de itch en toda la página, y lo que itch hacía girar ahora ejecuta tu animación. El prefijo hace imposible el choque. [S1]

```css
@keyframes custom-pop { 50% { scale: 1.08; } }
```

## 5.3 Cinco segundos y después reposo

La norma de accesibilidad (WCAG 2.2.2) dice que el movimiento que se inicia solo, dura más de 5 segundos y convive con otro contenido necesita una forma de pausarlo, detenerlo u ocultarlo. CSS no tiene botón de pausa, y respetar «reducir movimiento» no cuenta como uno. Así que: [S2]

- **Da a cada animación automática un número finito de repeticiones** y una duración total menor de 5 segundos.
- **Termina en reposo.** El último fotograma debe ser el estado normal del elemento.
- **Repite en bucle solo al pasar el ratón o al enfocar**, o cuando el visitante haya elegido claramente iniciarlo.

```css
@keyframes custom-bob { to { translate: 0 -4px; } }
#wrapper .custom-title { animation: custom-bob 1.2s ease-in-out 4 alternate; }
```

Cuatro pasadas de 1,2 s con `alternate` son 4,8 s, y un número par de pasadas con `alternate` vuelve al punto de partida. [S2]

### Entradas: animar *desde* oculto, no *hasta* visible

La forma incorrecta: dar al elemento `opacity: 0` y animarlo hasta `1` con `forwards`. Si la animación nunca se ejecuta (movimiento reducido, un navegador antiguo, una hoja bloqueada), el contenido se queda invisible.

La forma correcta: dejar el elemento visible y animar **desde** el estado oculto:

```css
@keyframes custom-in { from { opacity: 0; translate: 0 18px; } }
![Tres momentos de la entrada del título: casi transparente y más abajo, a medio camino, y en reposo](/guia/img/05-title-entrance.webp)

*La receta 5 a los 0,05 s, 0,25 s y 0,7 s: termina en reposo y no se repite.*

#wrapper .custom-card { animation: custom-in .6s ease-out; }
```

Cuando la animación se omite, el elemento simplemente está ahí. [S3]

## 5.4 El bloque de movimiento reducido (inclúyelo siempre)

Los visitantes que activan «reducir movimiento» en los ajustes de su sistema deben ver una página quieta. Este bloque detiene todas las animaciones y transiciones dentro de `#wrapper`:

```css
@media (prefers-reduced-motion:reduce){#wrapper,#wrapper::before,#wrapper::after,#wrapper *,#wrapper *::before,#wrapper *::after{animation:none!important;transition:none!important}}
```

Tiene 181 caracteres. Cópialo exactamente:

- `#wrapper *` por sí solo no alcanza a `#wrapper` en sí ni a sus `::before` y `::after`, que es donde viven las decoraciones de página completa (capítulo 3). Las versiones más cortas dejaron en marcha 3 o 4 de las 6 animaciones de prueba.
- `transition: none` funciona mejor que el truco habitual `transition-duration: .01ms`, que puede dejar elementos atascados en su valor inicial cuando la línea de tiempo de la animación está congelada.
- Si un efecto al pasar el ratón mueve algo, restablécelo también dentro de la misma consulta de medios, por ejemplo `#wrapper .game_cell:hover { transform: none; translate: none; }`.

[S4]

itch no tiene reglas de movimiento reducido propias, así que sin este bloque nada de tu página respeta el ajuste. [S4]

## 5.5 Pasar el ratón, táctil y teclado

Los teléfonos no tienen ratón, y quienes usan teclado nunca pasan el ratón por encima. Así que:

```css
@media (hover: hover) {
  #wrapper .game_cell { transition: translate .2s ease-out; }
  #wrapper .game_cell:hover { translate: 0 -4px; }
}
#wrapper .game_cell:focus-within { translate: 0 -4px; }
```

- `@media (hover: hover)` mantiene el efecto de paso del ratón lejos de las pantallas táctiles, donde se quedaría pegado tras un toque.
- `:focus-within` da a quienes usan teclado el mismo efecto. En las tarjetas de juego del perfil hace falta: Tab salta el enlace de la portada, así que el foco pasa a los otros enlaces de la tarjeta.

Nada de la página puede funcionar solo con el ratón encima. [S5]

## 5.6 Patrones que siguen las reglas

### Una ola de palabras

Anima palabras completas, no letras. Dividir un encabezado en un `span` `inline-block` por letra cambia su nombre accesible, el texto que anuncia la tecnología de asistencia, a letras separadas («M i r o»). Si de verdad necesitas animar letras, mantén una copia oculta de la palabra para los lectores de pantalla y dibuja las letras como contenido generado decorativo. [S6]

```css
@keyframes custom-wave { 50% { translate: 0 -6px; } }
#wrapper .custom-wave span { display: inline-block; animation: custom-wave 1.6s ease-in-out calc(var(--i) * .1s) 2; }
#wrapper .custom-wave span:nth-child(2) { --i: 1; }
#wrapper .custom-wave span:nth-child(3) { --i: 2; }
```

Los keyframes no tienen `from` ni `to`, así que cada pasada empieza y termina en la posición normal. `translate` necesita `display: inline-block` en los elementos en línea. [S7]

### Una entrada escalonada

```css
#wrapper .game_cell { animation: custom-in .5s ease-out; animation-delay: .2s; animation-delay: calc(sibling-index() * 60ms); }
```

Los navegadores que no conocen `sibling-index()` ignoran el segundo `animation-delay` y se quedan con el primero. Es la forma segura de usar cualquier CSS nuevo: primero el valor sencillo, después el nuevo, en la misma regla. No pases la alternativa por una propiedad personalizada, porque entonces un valor no soportado rompe ambos. [S8]

### Al primer renderizado con `@starting-style`

`@starting-style` define los valores desde los que un elemento hace la transición cuando aparece por primera vez, sin keyframes. Funciona en el primer renderizado de itch. [S9]

### Revelados ligados al desplazamiento

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    #wrapper .custom-reveal { animation: custom-in linear both; animation-timeline: view(); }
  }
}
```

Pon `animation-timeline` **después** de la abreviatura `animation`, porque la abreviatura lo restablece. Los envoltorios `@supports` y de movimiento reducido hacen que los navegadores sin soporte, y los visitantes que pidieron menos movimiento, simplemente vean el contenido. Chrome y, desde octubre de 2026, Firefox soportan las animaciones ligadas al desplazamiento: alrededor del 88 % de los usuarios. [S10]

### Cambios de página suaves entre tu perfil y tus proyectos

```css
@view-transition { navigation: auto; }
```

Ponlo en el nivel superior (no dentro de una regla de `#wrapper`) en **ambas** hojas, la de tu perfil y la del proyecto. Al pasar de una a otra, el cambio se hace con un fundido encadenado en lugar de un parpadeo. [S11]

La norma de movimiento reducido de 5.4 no llega a las transiciones de vista, que se animan fuera de `#wrapper`. Envuelve la regla en `@media (prefers-reduced-motion: no-preference) { … }` para respetar el ajuste. [S11]

### Una inclinación nueva en cada visita

```css
#wrapper .game_cell { rotate: 0deg; }
@supports (rotate: random(0deg, 1deg)) {
  #wrapper .game_cell { rotate: random(-2deg, 2deg); }
}
```

`random()` elige un valor nuevo en cada carga de la página en Chrome y Edge 156 o posterior y en Safari 26.2 o posterior, alrededor del 56 % de los usuarios. Firefox todavía no lo soporta, y esos visitantes ven la versión recta. `@supports (--x: …)` no puede detectar el soporte, así que prueba una propiedad real, como aquí. [S12]

## 5.7 Trampas

- **Una animación se detiene o se ejecuta la equivocada.** Una segunda declaración `animation` sustituyó toda la lista, un `!important` la congeló, o un nombre de keyframe chocó con uno de itch. [S13]
- **Páginas lentas.** Anima `transform`, `translate`, `scale`, `rotate` y `opacity`, que son baratas. Nunca hagas bucles de `font-weight`: en una prueba con la CPU limitada costó unos 0,9 s de trabajo de maquetación por segundo y bajó la página a unos 20 fotogramas por segundo. [S14]
- **Destellos.** No superes tres destellos por segundo. El contenido con destellos puede hacer que una página sea retirada del catálogo. [S15]
- **Páginas de juegos HTML5.** Mantén `transform`, `filter`, `backdrop-filter`, `will-change` y las animaciones de entrada fuera de los contenedores del juego (R22; capítulo 2). [S16]

## Lista de comprobación

- [ ] Todos los nombres de `@keyframes` empiezan por `custom-`.
- [ ] El movimiento automático es finito, dura menos de 5 segundos y termina en reposo.
- [ ] Las entradas animan *desde* oculto; nada empieza en `opacity: 0` con `forwards`.
- [ ] Está incluido el bloque de movimiento reducido, copiado exactamente.
- [ ] Los efectos al pasar el ratón están en `@media (hover: hover)`, con equivalentes `:focus-visible` o `:focus-within`.
- [ ] Los encabezados se animan por palabra, no por letra.
- [ ] Las funciones nuevas tienen primero una alternativa sencilla, o una prueba `@supports` sobre una propiedad real.
- [ ] Ningún `!important` en propiedades animadas; ningún `font-weight` en bucle; menos de 3 destellos por segundo.

---

## Fuentes

De la base de conocimiento de itch-live-css, `knowledge/itch-custom-css.md` §0 (R14, R16–R18, R22), §0.1 (bloque B1), §2, §7, §9 y §10.

- **S1** Los 13 nombres globales de keyframes de itch; un choque sustituye el de itch: verificado · s06-static, s06-kf.
- **S2** Regla de 5 segundos y WCAG 2.2.2, movimiento finito en reposo, el ejemplo `custom-bob`: documentado · a11y-25; verificado · gapfill02-01, gapfill02-02, s10-02, a11y-24.
- **S3** Entradas desde oculto, sin `opacity: 0` base + `forwards`: verificado · a11y-24.
- **S4** Bloque B1, su lista de selectores y `transition: none`, restablecimiento al pasar el ratón; itch no tiene reglas de movimiento reducido: verificado · gapfill02-01, gapfill02-02, s10-02, repo-50, itchcss-26.
- **S5** Acotación de los efectos de paso del ratón y equivalentes de foco; el enlace de portada de la tarjeta se salta con Tab; nada solo con ratón: verificado · s10-03, a11y-18; inferido · s10-03.
- **S6** Los spans de letras cambian el nombre de un encabezado: verificado · repo-59, s10-14, s10-27.
- **S7** Ola finita sin `from`/`to`; `translate` necesita `inline-block`: verificado · gapfill07-04, s07-n2 T29.
- **S8** Escalonado con alternativa de `sibling-index()`; valor sencillo primero; sin alternativa a través de propiedades personalizadas: verificado · s07-n1 T3, T4, T13.
- **S9** `@starting-style` en el primer renderizado: verificado · support-54.
- **S10** Orden y envoltorios de las animaciones ligadas al desplazamiento: verificado · s07-n1 T15. Firefox 159 y la cifra del 88 %: documentado · support-63.
- **S11** `@view-transition` en ambas páginas: verificado · support-21. El envoltorio de movimiento reducido es CSS general, no probado en itch.
- **S12** `random()` nativo y su soporte: verificado · s07-n1 T5, T6, T22, support-03; verificado 2026-10-29 · support-62; documentado · support-63. `@supports (--x: …)` no detecta nada: verificado · s07-n1 T5–T7.
- **S13** Animación detenida o la equivocada: verificado · repo-45, localtests-24, itchcss-28.
- **S14** Coste de `font-weight` en bucle: verificado · gapfill07-06.
- **S15** Destellos y retirada: documentado · s02-n3; inferido · docs-16.
- **S16** Contenedores de juegos HTML5: verificado · s04-gf-08, s04-gf-09, s04-gf-11.
