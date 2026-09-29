# Teclado móvil: desplazar sin comprimir

Encargo de Sergio, 2026-09-27. Sustituye la compresión de Inicio y la gestión local del teclado en la carta.

## Corrección tras la captura real de Safari (PR #96)

La primera solución conservaba la altura, pero ignoraba el desplazamiento del viewport visual. Sergio aportó otra captura: menú arriba, entrada fuera de pantalla y un gran hueco. El simulador anterior emitía cambios de offsetTop sin desplazar físicamente el contenido: esa prueba no cubría el fallo.

Se reproduce ahora el pan completo en una vista local aislada: un desplazamiento exterior de 360 px, además de reducir el área visible de 844 a 484 px. Antes de la corrección, el marco quedaba entre -360 y 124 y la entrada entre -1 y 21; el menú aparecía arriba, como en la captura.

El marco de `.desktopMain` se ancla al `visualViewport.offsetTop`. El menú usa el borde inferior del mismo viewport (`innerHeight - height - offsetTop`). Un listener de scroll visual actualiza exclusivamente estas posiciones: nunca escribe scrollTop del contenido, no cambia alturas, ni intercepta gestos. Se conserva el desplazamiento nativo interno y la altura estable de `.appCanvas`.

Referencia: [MDN, VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport), especialmente la distinción entre viewport de layout y visual y el ejemplo de posicionamiento con offsetTop. No confundir desplazar el marco para compensar el pan de Safari con volver a desplazar el contenido del marco.

## Verificación de esta corrección

- Reproducción visual antes/después con el mismo pan de 360 px. Después: marco 0–484, entrada de Inicio 359–381, menú 412–474; altura del contenido 844. La zona inferior de la vista de prueba representa el área ocupada por el teclado, no un hueco de la app.
- Scroll nativo de Inicio en ambos sentidos: 360→0→360; marco permanece en y=0. Al cerrar: scroll=0 y altura=844.
- Chat: compositor y sugerencias visibles tras el pan. Carta: editor 194–396, separado del menú desde 412. Sin envíos ni escrituras reales.
- Regresión automatizada: pan completo/parcial/inverso, conservación del scroll manual, navegación, cierre y limpieza; además de los casos previos iOS/Android.
- Build, matching 255/255, smoke 8×2 pantallas y 120×4 tarjetas; lint sin diagnósticos nuevos, no-undef=0. Persisten los problemas de lint previos.

## Arquitectura conservada

La altura previa al teclado se conserva; la ventana se desplaza mediante scroll nativo para mostrar el campo. Inicio mantiene tarjetas, tipografía y número de pasos. Al cerrar el teclado vuelve el espacio completo, sin scroll en Inicio.

Un único controlador, `utils/keyboardViewport.js`, cubre la app. En Inicio, chat y alta se muestra el pie; en formularios se muestra el campo activo sin cubrirlo con el menú. El chat y el alta desplazan únicamente su lista al recibir mensajes, sin scrollIntoView exterior. Campos móviles a 16 px para evitar zoom automático. Se conservan funciones, datos, permisos y handlers; no cambia Supabase ni el envío.

## Pruebas anteriores y límites (no validaban el pan físico)

- Servidor local aislado con visualViewport de prueba independiente: layout 390×844, área visible 390×484. No es simplemente encoger la ventana.
- Inicio: burbuja 614 px, tarjeta 116 px y 1 de 3 pasos antes/después. Scroll exterior de 360 px al abrir; escritura y menú sobre el teclado. Recorrido nativo en ambos sentidos: scroll 360→0→360, contenido -286→74→-286. Cambiar offsetTop y emitir scroll no recoloca la página.
- Chat: después de llegar el saludo, compositor hasta y=468 dentro de 484 px visibles; sugerencias separadas 18 px. No salta el contenedor exterior.
- Carta, login y alta: campos visibles con contenido de 844 px preservado. Alta con un único menú. Formularios de prueba sin enviar credenciales ni altas.
- Sin teclado: Inicio a 320×568 sin scroll exterior; escritorio 1280×900 conserva el layout. Consola sin errores en la revisión.
- `scripts/test-keyboard-viewport.mjs`: altura estable, teclado que reduce solo viewport visual (iOS) o también innerHeight (Android), cierre, foco entre campos, scroll no secuestrado, reserva del menú, escritorio y limpieza.
- Build, matching 255/255, paginación 200 casos, smoke 8×2 pantallas y 120×4 tarjetas. Lint sin nuevos diagnósticos, no-undef=0; persisten 107 errores y 6 avisos previos.

La apertura del teclado y el desplazamiento de Safari se simulan en navegador. No se ha ejecutado un teclado físico de iPhone; la captura de Sergio aporta el fallo real y la comprobación final en su dispositivo sigue siendo valiosa. Ninguna prueba simulada se presenta como validación de hardware.
