# Capítulo 7 — Depuración: cuando no se ve, y por qué

La mayoría de los problemas de CSS en itch se ven igual desde fuera: el cambio que hiciste no hace nada, o funciona para ti pero no para los visitantes. La causa casi siempre es una de cinco cosas: una regla que el navegador descartó en silencio, una regla que pierde frente a la de itch, una caché que sigue sirviendo la página antigua, una vista previa que solo tú ves, o una herramienta que lee la página de forma incorrecta. Este capítulo las repasa en ese orden.

## 7.1 Empieza aquí: comprueba lo que reciben los visitantes

Antes de cambiar cualquier CSS, confirma qué se está sirviendo. Tu propia vista no es lo que ven los visitantes:

- **Tú** ves el CSS sin guardar en la vista previa del editor, y tu propia página nunca se guarda en caché. [S1]
- **Los visitantes** reciben una copia en caché. Tras guardar un perfil, los visitantes sin sesión pueden seguir viendo la página antigua unos dos minutos y medio, y luego reciben la nueva. [S1]

Así que: prueba en una ventana privada, sin sesión iniciada, pasados unos minutos. Para ver el estado de la caché, abre el panel de red del navegador (F12), recarga y mira las cabeceras de respuesta de `X-Cache-Status`. `HIT` significa una copia en caché; `EXPIRED` seguido de una página nueva significa que el cambio ha llegado. También puedes comprobar el texto que sirve itch: en un perfil, busca tu elemento `style#custom_css` sin sesión iniciada. [S1]

Cambiar la dirección (añadir `?algo`) no salta la caché. [S1]

## 7.2 Tu regla se ignora en silencio

Es el problema más frecuente, e itch nunca te lo dice. Los navegadores saltan cualquier regla que no puedan interpretar, y el resto de la hoja sigue. Lo que lo provoca: [S2]

| Error | Qué hacer |
|---|---|
| `calc(40px+10px)`: sin espacios alrededor de `+` o `-` | Escribe `calc(40px + 10px)` |
| Comentarios `//` | Usa `/* … */` |
| Una `}` sobrante o que falta | Cuenta las llaves. Una que falte puede hacer que desaparezca todo lo que va después |
| Un selector desconocido en una lista, como `a, badselector` | Se descarta la regla entera. Separa la lista o quita la parte desconocida |
| `and(` dentro de `@media` | Usa `and` con un espacio: `@media (min-width: 600px) and (hover: hover)` |
| Un `var()` mal escrito | La propiedad pasa a `unset`. Revisa el nombre de la variable y que esté definida |

Una causa habitual de «no pasa nada y no hay ningún error» es que **la regla no se interpreta**. En las herramientas de desarrollo de tu navegador, una regla con un selector no válido no aparece en el panel de estilos, y una propiedad no válida aparece tachada (comportamiento general del navegador, no probado en itch). Una regla que se interpreta pero no coincide es otro problema (7.3).

El validador de la base de conocimiento detecta muchos de estos errores antes de pegar (`node engine/bin/cli.js validate tuarchivo.css profile`), pero no puede detectarlos todos. [S2]

## 7.3 Tu regla se interpreta pero pierde frente a la de itch

Las reglas propias de itch van primero en la página. Las tuyas van al final, así que los empates las ganan. Pero estos casos pierden igualmente: [S3]

| Rival | Qué lo vence |
|---|---|
| Las reglas normales de itch | Cualquier regla que empiece por `#wrapper` (R2) |
| El `!important` de itch | `#wrapper … !important`, o dar estilo al elemento padre |
| Un atributo `style=""` en línea (como en las portadas y el marco del juego) | Solo `!important`. Los estilos en línea vencen incluso a `#wrapper#wrapper` |
| El JavaScript de itch, que escribe tamaños en línea y un dimensionador de rejilla **después** de tu CSS | `#wrapper` más una clase. En perfiles, el dimensionador tiene especificidad (0,2,0), así que una regla `#wrapper .mode_grid .user_game_grid` lo vence; en las jams el dimensionador es un ID (1,0,0), así que hace falta `#wrapper` más una clase |
| Una regla dentro de `@layer` | Las capas siempre pierden frente a las reglas normales. No las uses (R15) |

Dos trampas más:

- **El anidamiento necesita navegadores modernos.** `#wrapper { .x { } }` funciona en los navegadores actuales, pero los antiguos lo descartan. Escribe las reglas esenciales sin anidar. [S4]
- **Las reglas importadas pierden frente a las pegadas.** Si divides tu CSS con `@import` (capítulo 6), las reglas pegadas ganan los empates. Da más peso a las reglas importadas, por ejemplo `#wrapper h1.custom-title`. [S4]

Para ver qué regla gana: abre las herramientas de desarrollo, selecciona el elemento y mira el panel **Styles** (Estilos). Las reglas que han perdido aparecen tachadas, con la regla ganadora encima. Es la forma más rápida de encontrar un problema de cascada.

## 7.4 Las propiedades personalizadas siguen a la página, no a la especificidad

Una propiedad personalizada toma su valor del elemento más cercano que la declara, no de la regla más específica. Si declaras `--accent` en un hijo y la usas en el padre, el padre no la ve. Declara los tokens en `#wrapper` (capítulo 4) y léelos por debajo. [S5]

## 7.5 Animaciones y nombres

- **Los nombres de `@keyframes` son globales.** Un nombre que coincide con uno de itch (`spin`, `bounce`) lo sustituye en toda la página. Usa el prefijo `custom-` (R16; capítulo 5). [S6]
- **`animation` es una lista.** Una segunda declaración `animation` en la misma regla sustituye a la primera, y una de tus animaciones se detiene. Ponlas en una sola declaración, o anima otra propiedad. [S6]
- **Las animaciones se congelan** si llevan `!important` (R14). Una propiedad personalizada sin registrar no se congela, pero se anima a saltos en lugar de suavemente. [S6]
- **Las rutas `url()` relativas** se resuelven respecto a bases distintas: la página del visitante cuando se pega, tu hoja cuando se importa. Usa direcciones `https://` absolutas en todas partes (R23). [S6]

## 7.6 Cosas que se rompen solo en algunos diseños

- **Una decoración fija nunca se ve.** El elemento queda detrás del fondo de `#wrapper` porque `#wrapper` no tiene su propio contexto de apilamiento. Añade `position: relative; isolation: isolate;` a `#wrapper` y pon la decoración en `#wrapper::before` (capítulo 3). [S7]
- **Una decoración tapa el botón Follow.** Dale a la decoración `pointer-events: none`, y mantén despejada la esquina superior derecha. [S7]
- **Las capas fijas se desplazan con la página.** Un `transform`, `filter`, `backdrop-filter`, `perspective`, `will-change: transform` o `contain` en `#wrapper`, `.user_page` o `#inner_column` convierte ese elemento en su bloque contenedor. Mueve el efecto a un pseudoelemento. Para juegos HTML5: R22. [S7]
- **Desplazamiento lateral en los teléfonos.** Normalmente un elemento demasiado grande o girado. `overflow-x: hidden` quita la barra de desplazamiento pero rompe `position: sticky`; usa `overflow-x: clip` (capítulo 3). [S8]
- **Tarjetas de altura desigual.** itch alinea los elementos de la rejilla arriba. Estíralos (capítulo 3, 3.4). [S8]
- **El margen del pie no funciona.** El pie del perfil está posicionado de forma absoluta. Usa un margen inferior en el último bloque, o padding en `#wrapper` (capítulo 3, 3.6). [S8]

## 7.7 Un cambio guardado no aparece

Sigue esta lista en orden:

1. **¿Estás mirando sin sesión iniciada?** Tu propia vista puede ser distinta (7.1). [S1]
2. **¿Se guardó bien?** Por encima del límite del perfil, itch rechaza todo el guardado y muestra un cuadro de error. Mide el tamaño (capítulo 1). [S9]
3. **¿La caché sigue sirviendo la copia antigua?** Espera unos minutos y comprueba en una ventana privada. [S1]
4. **¿Se interpreta el CSS?** Comprueba en las herramientas de desarrollo (7.2). [S2]
5. **¿Está ganando otra regla?** Comprueba en las herramientas de desarrollo (7.3). [S3]

## 7.8 Reducir el CSS puede romperlo

Un minificador que elimina espacios en blanco también puede eliminar lo que necesita el navegador. Elige la herramienta con cuidado:

- **Usa esbuild con `--minify` y `--charset=utf8`.** En las pruebas de la base de conocimiento mantuvo las reglas anidadas y las consultas de rango que otras eliminaban, y el texto no ASCII intacto. Los indicadores exactos de línea de comandos son inferidos de las opciones de la API probadas. [S10]
- **Evita csso,** que elimina el anidamiento y las consultas de rango, y **lightningcss sin objetivos,** que descarta los respaldos. [S10]
- **No minifiques las cadenas con expresiones regulares.** Las herramientas rápidas de buscar y reemplazar pueden reescribir el texto dentro de `content: "…"`. [S10]
- **Comprueba después de minificar.** Ejecuta la medición de tamaño (capítulo 1) y abre la página sin sesión iniciada. Un error del minificador puede pasar en silencio.

## 7.9 Leer la página con herramientas

Las herramientas automáticas y los lectores de pantalla leen la página de forma distinta a un navegador:

- **Las herramientas tipo `read_page` incluyen el texto oculto e ignoran `::before` y `::after`.** No las uses para comprobar lo que ve un visitante. Usa en su lugar el árbol de accesibilidad del navegador (las herramientas de desarrollo, o la llamada de accesibilidad del Chrome DevTools Protocol). [S11]
- **Las páginas en vivo son una mala guía.** La mayoría de los selectores de nivel superior de las páginas con estilo no empiezan por `#wrapper`, así que una página con estilo demuestra poco sobre lo que harán tus reglas. Copia las reglas de esta guía y prueba tu propia página. [S12]
- **Una copia de la página sin scripts no es la real.** No ejecuta el JavaScript de itch, así que el dimensionado de la rejilla, la altura mínima del contenedor y las portadas de carga diferida se comportan de otra manera. Juzga el diseño en una página renderizada en vivo. [S13]

## Lista de comprobación cuando algo se rompe

- [ ] Comprobado sin sesión iniciada, en una ventana privada, después de que expirara la caché (7.1).
- [ ] Revisada la regla en las herramientas de desarrollo: ¿está tachada o no aparece? (7.2, 7.3)
- [ ] Comprobado el tamaño y la regla de `</style>` (capítulo 1). El texto guardado coincide con lo que pegaste.
- [ ] Comprobada la versión minificada frente al original (7.8).
- [ ] Revisado el árbol de accesibilidad, no las herramientas de texto, para lo que oiría un lector de pantalla (7.9).

---

## Fuentes

De la base de conocimiento de itch-live-css, `knowledge/itch-custom-css.md` §1, §6, §9 y §10.

- **S1** Vista del propietario frente a la vista sin sesión, cabeceras de caché, `X-Cache-Status`, las cadenas de consulta no saltan la caché: verificado 2026-10-16 · live-dom; documentado · community-05; verificado · crawlprofile-46.
- **S2** Fallos de interpretación silenciosos (`calc`, `//`, llaves, selector desconocido, `and(`), `var()` que pasa a `unset`: verificado · localtests-41, localtests-42, localtests-32, support-06, support-08, s01-n6.
- **S3** Perdedores de cascada: el estilo en línea vence a `#wrapper#wrapper`, el dimensionador en tiempo de ejecución, `!important`: verificado · crawlprofile-12, localtests-04, crawljam-07, docs-17, localtests-24; dimensionador de jam `#<id generado>` (1,0,0): inferido · community-47, verificado localmente · s06-run.
- **S4** Soporte del anidamiento y descarte en navegadores antiguos: verificado · support-15; observado · crawlprofile-57. Las reglas importadas pierden frente a las pegadas: verificado · localtests-01, repo-13.
- **S5** Las propiedades personalizadas siguen al ancestro declarante más cercano: verificado · localtests-06, s06-heads.
- **S6** Nombres globales de keyframes, sustitución en la lista de `animation`, `!important` que congela animaciones, `@property` sin registrar que anima a saltos, bases de `url()` relativas: verificado · s06-static, s06-kf, repo-45, s06-run, localtests-24.
- **S7** Contexto de apilamiento de las decoraciones fijas, botón Follow, capas fijas y bloques contenedores: verificado · localtests-39, repo-46, itchcss-29, localtests-37, crawlprofile-60.
- **S8** Desplazamiento lateral y `overflow-x: clip`, alineación de la rejilla, pie absoluto: verificado · localtests-27, localtests-29, repo-32, repo-33, crawlprofile-09, repo-24.
- **S9** Guardado rechazado por encima del límite, con cuadro de error: verificado 2026-10-16 · live-cap-A1.
- **S10** Elección del minificador y los fallos enumerados: verificado · gapfill09-05, gapfill09-15, gapfill09-11, gapfill09-12, gapfill09-06; los nombres de los indicadores de línea de comandos son inferidos de las opciones de la API probadas.
- **S11** Las herramientas leen el texto oculto e ignoran los pseudoelementos: verificado · localtests-34, a11y-50.
- **S12** La mayoría de los selectores de nivel superior en páginas en vivo no tienen `#wrapper`: verificado · corpus-16.
- **S13** Diferencias del arnés sin scripts: verificado (render en vivo) · s10-17 a s10-24.
