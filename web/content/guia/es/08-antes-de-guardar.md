# Capítulo 8 — Antes de guardar: la comprobación final

Repasa este capítulo cada vez que cambies tu CSS, en orden. Cada paso detecta un tipo distinto de fallo, y los últimos son los que la gente se salta.

## 8.1 Mide el tamaño

- **Perfil:** 5.120 bytes o menos, después de recortar el principio y el final, con los comentarios incluidos. Mídelo con los comandos del capítulo 1. [S1]
- **Proyecto y devlog:** sin límite práctico, pero pega una sola línea minificada. Cuenta también los saltos de línea: en los proyectos se guardan como dos bytes cada uno. [S1]
- **Jam:** mantenla en 20.410 caracteres o menos. Es el tamaño más grande que se sabe que se guarda; el límite real no se ha medido. [S2]

Si te pasas, el guardado se rechaza, no se corta. Nada cambia en tu página hasta que corrijas el tamaño. [S1]

## 8.2 Comprueba el texto en sí

Antes de pegar, busca en tu CSS lo siguiente:

- `<style` o `</style` en cualquier parte, en cualquier combinación de mayúsculas y minúsculas, incluso dentro de un comentario. itch borra `</style>` y el CSS que lo rodea cambia en silencio (R8). [S3]
- Cualquier `@import` que no esté en la primera línea, o cualquier `@import` en una jam (R9). [S3]
- Selectores que no empiezan por `#wrapper` (R2), IDs numerados como `#user_123` (R12) y abreviaturas `background` en `#wrapper` (R4). [S3]
- Nombres de `@keyframes` sin el prefijo `custom-` (R16). [S3]
- Efectos al pasar el ratón fuera de `@media (hover: hover)` (R18), y `!important` en propiedades animadas (R14). [S3]

Si tienes el validador de itch-live-css, ejecútalo sobre el archivo para tu tipo de página. Comprueba la mayor parte de la lista anterior e indica el número de regla de cada problema. No puede comprobar lo que oye un lector de pantalla, ni cómo se ve la página. [S4]

## 8.3 Guarda y después comprueba lo que reciben los visitantes

Guardar no es el final. Revisa la página guardada, sin sesión iniciada, después de que expire la caché (unos tres minutos, capítulo 7):

1. Abre una ventana privada, o cierra la sesión.
2. Carga la página y compruébala a **320 px** y **375 px**, además de los puntos de cambio de tu tipo de página (capítulo 3).
3. Páginas que revisar:
   - **Perfil:** la página principal.
   - **Proyecto:** la página principal, el índice `/devlog`, una entrada de devlog y `/comments`. Las cuatro comparten tu hoja (R13).
   - **Jam:** la página de resumen.
4. Confirma el CSS que se sirve. Descarga la página como texto y busca `custom_css`, para comprobar que tu CSS ha llegado. El comando siguiente lo hace para un perfil. Sustituye el marcador por tu dirección y no añadas `-L`, que sigue las redirecciones:

   ```bash
   curl -s https://TU-NOMBRE.itch.io/ -o page.html && grep -c custom_css page.html
   ```

   Un recuento de `1` o más significa que el elemento está ahí. [S5]

Las comprobaciones sin sesión iniciada son las que importan. Los propietarios ven encabezados adicionales y envoltorios del editor que los visitantes no ven. [S6]

## 8.4 Comprobaciones de accesibilidad y comportamiento

Haz estas comprobaciones en la página guardada, sin sesión iniciada:

- **Teclado:** pulsa Tab recorriendo toda la página. Cada enlace y botón debe mostrar un anillo de foco visible con contraste de 3:1 o más (R19). [S7]
- **Movimiento reducido:** activa «reducir movimiento» en los ajustes de tu sistema. Nada debe moverse. [S8]
- **Contraste:** comprueba el texto contra la zona más clara de tu imagen de fondo, no contra el color de fondo (capítulo 4). [S9]
- **Colores forzados:** activa el modo de alto contraste. Las tarjetas deben seguir teniendo contorno. [S9]
- **Encabezados:** debe haber exactamente un `h1` que nombre la página, también en los perfiles con banner (R20). Usa el árbol de accesibilidad del navegador para ver lo que recibe un lector de pantalla. Las herramientas de texto que leen la página pueden incluir texto oculto, así que no bastan. [S10]
- **Sin la importación:** si usas `@import`, comprueba que la página sigue viéndose aceptable con la importación bloqueada (capítulo 6, receta 7). [S11]

## 8.5 Lo que no cubren las pruebas de esta guía

Sé honesto con tus visitantes sobre lo que has probado y lo que no. La base de conocimiento probó estas áreas y no las demás:

- **Navegadores.** Para los diseños y las técnicas solo se ejecutó Chromium. El comportamiento de Firefox y Safari se tomó de datos públicos de compatibilidad, no se probó en itch. Revisa tu página en ambos antes de darla por terminada. [S12]
- **Lectores de pantalla.** No se probó la salida de voz con un lector de pantalla real. Sí se probó el árbol de accesibilidad. [S12]
- **Jams.** La hoja de CSS de jam más grande que se sabe que se guarda tiene 20.410 caracteres. El límite real no se ha medido. [S2]
- **Vista del propietario.** Tu propia vista puede diferir de lo que ven los visitantes. Úsala solo para editar, y juzga el resultado sin sesión iniciada. [S6]

## 8.6 Que siga funcionando

itch cambia su marcado y sus reglas. Una página que funciona hoy puede romperse tras una actualización, y nada te avisará. Crea estos hábitos:

- **Una comprobación diaria.** Una petición al día a tu perfil sin sesión iniciada que confirme que el marcado del que depende tu CSS sigue ahí. Elige dos o tres selectores de tu CSS y comprueba que aún aparecen en la página. Basta con un script sencillo que descargue la página y los busque. [S13]
- **Un registro de cambios.** Cada vez que guardes, escribe una línea: la fecha, qué cambió, el tamaño en bytes, y las páginas y navegadores que comprobaste. Cuando algo se rompa más adelante, ese registro te dice qué cambió por última vez. [S14]
- **Revisa la guía.** Los datos de esta guía tienen fecha. Cuando itch cambie algo que la guía describe, el capítulo correspondiente debe actualizarse y volver a fecharse. [S14]

## 8.7 La lista de comprobación final

- [ ] Tamaño medido: perfil en bytes por debajo de 5.120; proyecto o devlog como una línea; jam por debajo de 20.410 caracteres.
- [ ] Ningún `<style>` ni `</style>` en ninguna parte; `@import` primero y fijado; ningún `@import` en una jam.
- [ ] Cada selector empieza por `#wrapper`; ningún ID numerado; ninguna abreviatura `background` en `#wrapper`.
- [ ] `@keyframes` con nombre `custom-…`; movimiento finito, de menos de 5 segundos, que termina en reposo; bloque de movimiento reducido incluido.
- [ ] Efectos al pasar el ratón dentro de `@media (hover: hover)`; el foco del teclado muestra un anillo de 3:1.
- [ ] Guardado, y después comprobado sin sesión iniciada, con la caché expirada, a 320 y 375 px.
- [ ] Revisado cada tipo de página que comparte tu hoja (proyecto: principal, devlog, entrada, comentarios).
- [ ] Un solo `h1`; contraste comprobado sobre la zona más clara de la imagen; colores forzados y movimiento reducido comprobados.
- [ ] Firefox y Safari comprobados, o la página dice que no lo están.
- [ ] Línea de registro de cambios escrita.

---

## Fuentes

De la base de conocimiento de itch-live-css, `knowledge/itch-custom-css.md` §1, §9 y §10 (la «Ship gate» y la tabla de encabezados), más los capítulos 1–7 de esta guía.

- **S1** Límites de tamaño, bytes, recorte, saltos de línea: verificado 2026-10-16 · live-cap-A1, live-cap-A2c, live-cap-A3a a live-cap-A3c, live-cap-B1, live-cap-B2.
- **S2** Límite de jam: documentado · crawljam-29; inferido · gapfill01-03. No medido, según §1.
- **S3** Reglas R2, R4, R8, R9, R12, R14, R16, R18: ver las fuentes del capítulo 2.
- **S4** Validador: `engine validate()` cubre R2–R12, R14–R19 y R21–R23 por ahora (R5, R6, R10, R11, R17, R19 y R21 en parte) (notas del proyecto). No comprueba la accesibilidad ni la página renderizada.
- **S5** Comprobación del CSS servido: verificado · crawlprofile-58 (un GET sin `-L`, leyendo `style#custom_css`).
- **S6** Vista del propietario y comprobaciones sin sesión: observado · crawlprofile-43, a11y-21; verificado · s10-17 (hace falta una página renderizada en vivo con los scripts de itch).
- **S7** Anillos de foco en las paradas de Tab: verificado · s04-gf-02, s04-gf-06, s04-gf-16.
- **S8** Bloque de movimiento reducido probado: verificado · gapfill02-01, gapfill02-02, s10-02, repo-50.
- **S9** Contraste sobre la zona más clara de la imagen; colores forzados: verificado · s10-06, s10-05, a11y-28.
- **S10** Encabezados y el árbol de accesibilidad: verificado · a11y-03, a11y-57, localtests-34, a11y-50, repo-59.
- **S11** La página debe funcionar sin la importación: observado · repo-54; verificado · localtests-12.
- **S12** Cobertura de navegadores y lectores de pantalla: verificado · s10-30, gapfill07-07; datos de Firefox y Safari documentados · support-02.
- **S13** Comprobación diaria del marcado como hábito: el propio flujo de vigilancia de la base hace esto para una página (observado en `.github/workflows/watch.yml` del repositorio); el consejo de hacerlo es de esta guía.
- **S14** Datos con fecha y registro de cambios: la base de conocimiento tiene fecha y se revisa (por ejemplo, la revisión del 29 de octubre de 2026 de Chrome 156 y Firefox 159; support-62, support-63).
