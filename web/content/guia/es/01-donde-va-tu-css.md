# Capítulo 1 — Dónde va tu CSS y cuánto cabe

Antes de escribir una sola regla necesitas saber tres cosas: si puedes pegar CSS, a qué páginas llega y cuánto acepta itch. Si fallas en esto, nada de lo demás de la guía importa.

## 1.1 ¿Tienes acceso?

El CSS personalizado no viene activado por defecto. El personal de itch lo activa a mano, cuenta por cuenta, cuando lo pides a través de la página de soporte de itch. Las cuentas sin nada publicado suelen recibir una negativa, y la espera puede ser de semanas. [S1]

La prueba rápida: abre el editor de tema de tu página (siguiente sección). Si no hay un campo **Custom CSS**, todavía no tienes acceso. Mientras tanto conservas los colores y las fuentes del editor de tema, además del HTML que puedes escribir en tu biografía o en la descripción del proyecto. [S1]

## 1.2 Dónde está el campo

En tu propia página, con la sesión iniciada:

1. Haz clic en **Edit theme**.
2. Abre la pestaña **Misc**.
3. Pega en **Custom CSS**.
4. Haz clic en **Save**.

El botón **Edit theme** desaparece cuando la ventana tiene 980 px de ancho o menos, así que hazlo en una ventana de escritorio. [S2]

## 1.3 A qué páginas llega tu CSS

Cada lugar donde puedes pegar CSS tiene su propio campo, y cada campo da estilo a un conjunto fijo de páginas:

| Dónde lo pegas | Páginas que estiliza |
|---|---|
| Tu perfil (`tunombre.itch.io`) | Solo la página del perfil |
| Un proyecto | La página del proyecto **y** su índice `/devlog`, todas las entradas de devlog y la página `/comments` |
| Una jam que organizas | Solo la página de resumen de la jam |

Hay dos consecuencias que pillan desprevenido a mucha gente:

- **Una hoja de proyecto, cuatro tipos de página.** Una regla pensada para la página de tu juego también llega a tus entradas de devlog. El capítulo 2 explica cómo apuntar una regla a una sola de ellas. [S3]
- **Algunas páginas nunca se estilizan**: la página de compra, los tableros y foros de proyectos, las colecciones, el blog de itch y las páginas de entradas, resultados, feed, comunidad y valoraciones de la jam. Ningún CSS llega a ellas, hagas lo que hagas. [S3]

No hay JavaScript en ninguna parte: itch no lo permite. Todo lo de esta guía es CSS puro. [S3]

## 1.4 Cuánto cabe

| Página | Límite | Qué pasa si se supera |
|---|---|---|
| Perfil | **5.120 bytes** | Se rechaza el guardado, nada cambia |
| Proyecto y devlog | Sin límite práctico (más de 650.000 caracteres guardados) | Un pegado enorme falla como petición rota |
| Jam | Unos 20 KB; se sabe que funcionan 20.410 caracteres | Sin medir |

[S4]

### El límite del perfil se cuenta en bytes, no en caracteres

El mensaje de error de itch dice «caracteres», pero cuenta **bytes**. Las letras, los dígitos y los signos de puntuación básicos ASCII ocupan un byte cada uno. Las letras acentuadas, como `é`, ocupan dos bytes; muchos símbolos (`→`, `★`) ocupan tres, y los emojis cuatro. Así que una hoja de perfil con texto acentuado cabe en menos caracteres de los que sugiere el mensaje de 5.120. [S4]

Otros detalles del límite del perfil:

- **Los comentarios cuentan.** Quítalos antes de pegar.
- **Los espacios y saltos de línea al principio y al final no cuentan**, porque itch los recorta antes.
- **Si se supera el límite, se rechaza todo el guardado.** Aparece un cuadro de error que dice que los cambios no se guardaron. itch nunca corta tu CSS a la mitad, así que no acabarás con una hoja a medias, pero tampoco se guardará nada. [S4]

### Medir antes de pegar

Pega esto en la consola de tu navegador (F12 → Console), pon tu CSS entre las comillas invertidas y pulsa Intro:

```js
new TextEncoder().encode(String.raw`PEGA AQUÍ TU CSS`.trim()).length
```

El número es el recuento de bytes que comprobará itch. Para un perfil, mantenlo en 5.120 o menos. Si tu CSS contiene una comilla invertida o `${`, usa la versión de Python:

```sh
python -c "import sys;s=open(sys.argv[1],encoding='utf-8').read().strip();print(len(s),len(s.encode()))" mi-perfil.css
```

Muestra primero los caracteres y después los bytes. [S5]

### Cómo caber más en un perfil

- **Minifica.** Quita comentarios, saltos de línea y espacios que no necesitas. Usa un minificador de CSS de verdad. Algunos «minificadores» rápidos de buscar y reemplazar estropean el texto dentro de `content:"…"`. [S6]
- **Escribe los símbolos tal cual.** Un `→` directo ocupa 3 bytes; el escape que significa lo mismo ocupa 5. [S6]
- **No incrustes fuentes ni imágenes en Base64.** Base64 hace un archivo aproximadamente un tercio más grande: un subconjunto de fuente de 2,5 KB se convierte en 3,4 KB de CSS. [S6]
- **¿Sigue siendo demasiado?** Aloja el resto en un archivo y cárgalo con `@import`. El capítulo 6 explica cómo hacerlo con seguridad. No funciona en las jams. [S6]

## 1.5 Qué hace itch con tu CSS al guardar

itch guarda tu CSS casi exactamente como lo escribiste. No lo minifica, no lo comprueba, no lo corrige ni lo limita a tu página. Solo cambian tres cosas: [S7]

1. **Se borra cada `</style>`**, en cualquier combinación de mayúsculas y minúsculas, incluso dentro de un comentario o de una cadena. Si tu CSS contiene ese texto, el código que lo rodea cambia en silencio. Nunca pegues las etiquetas `<style>`, solo lo que va entre ellas. [S7]
2. **Los espacios y saltos de línea al principio y al final se recortan.** [S7]
3. **Los saltos de línea de un proyecto se guardan como dos bytes (CRLF) en lugar de uno.** No es grave, pero es una razón más para pegar el CSS de proyecto como una sola línea minificada. [S7]

Cuando tu CSS tiene un error, el navegador salta la regla rota sin avisarte, e itch tampoco te avisa. Fallos silenciosos habituales:

- `calc(40px+10px)`: `calc` necesita espacios alrededor de `+` y `-`.
- Comentarios `//`: en CSS solo existen los `/* … */`.
- Una `}` que falta.
- Un selector desconocido en una lista, que hace caer la regla entera. [S8]

El capítulo 7 trata de cómo encontrarlos.

## 1.6 Cómo ver tu cambio

- **Tú** ves tus cambios al momento, e incluso ves el CSS sin guardar mientras el editor está abierto. [S9]
- **Los visitantes** pueden seguir viendo la página antigua durante unos dos minutos y medio tras un guardado, porque itch la tiene en caché. Añadir `?algo` a la dirección no salta la caché. [S9]

Por eso comprueba siempre el resultado **sin sesión iniciada**: en una ventana privada, pasados unos minutos.

## Lista de comprobación

- [ ] El campo **Custom CSS** está disponible (tienes acceso).
- [ ] Sabes a qué páginas llega tu hoja. En un proyecto, eso incluye el devlog y los comentarios.
- [ ] El CSS del perfil ocupa **5.120 bytes o menos**, medidos en bytes, con comentarios incluidos.
- [ ] Solo pegaste CSS: ni etiquetas `<style>`, ni `</style>` en ninguna parte.
- [ ] El CSS del proyecto es una sola línea minificada.
- [ ] Revisaste la página guardada sin sesión iniciada, después de que expirara la caché.

---

## Fuentes

Cada afirmación de arriba corresponde a un dato de la base de conocimiento de itch-live-css (`knowledge/itch-custom-css.md`, §0–§1). «Verificado» significa que se reprodujo directamente; las entradas con fecha proceden de pruebas en vivo en itch.io en octubre de 2026.

- **S1** Acceso por solicitud, campo ausente = sin acceso: documentado · docs-01, docs-02, docs-03, community-48.
- **S2** Ruta del editor, botón oculto a ≤ 980 px: observado · gapfill01-07; verificado · gapfill01-08.
- **S3** Páginas estilizadas y no estilizadas, sin JavaScript: verificado · s01-n2, crawlproject-42, crawljam-03, crawljam-35, crawljam-44; documentado · docs-05, repo-04.
- **S4** Límites de tamaño, bytes y no caracteres, los comentarios cuentan, recorte de extremos, mensaje de rechazo: verificado 2026-10-16 · live-cap-A1, live-cap-A2a, live-cap-A2c, live-cap-A3a a live-cap-A3c, live-cap-B1, live-cap-B2; jam: documentado · crawljam-29; inferido · gapfill01-03.
- **S5** Script de medición: verificado · s01-n8. El comando de consola es propio de esta guía y cuenta igual (texto recortado, bytes UTF-8); `String.raw` mantiene intactas las barras invertidas como `\2192`.
- **S6** Consejos para ahorrar bytes: verificado · corpus-19, s01-n6, x08-06, community-11; documentado · docs-32.
- **S7** Qué cambia un guardado: verificado 2026-10-16 · live-c01 a live-c45, live-css; verificado · corpus-01, corpus-02, corpus-03, gapfill01-02.
- **S8** Fallos silenciosos: verificado · localtests-41, localtests-42, support-08.
- **S9** Vista previa y caché: documentado · community-05; verificado · crawlprofile-46; verificado 2026-10-16 · live-dom.
