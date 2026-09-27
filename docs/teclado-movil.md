# Teclado móvil: desplazar sin comprimir

Encargo de Sergio, 2026-09-27. Sustituye la compresión de Inicio y la gestión local del teclado en la carta.

## Causa y cambio

Inicio seguía `visualViewport.height` para la altura de la burbuja y `offsetTop` en cada evento de scroll. El teclado remaquetaba y repaginaba una respuesta ya visible, mientras seguir el offset podía contrarrestar el desplazamiento nativo. Su `overscroll-behavior: none` también impedía transferir el gesto al contenedor exterior.

Se separan una ventana visible móvil (`desktopMain`) y un contenido de altura estable (`appCanvas`). La altura previa al teclado se conserva; la ventana se desplaza mediante scroll nativo para mostrar el campo. No se interceptan gestos ni se escucha el scroll del visualViewport. Inicio mantiene tarjetas, tipografía y número de pasos. Al cerrar el teclado vuelve el espacio completo, sin scroll en Inicio.

Un único controlador, `utils/keyboardViewport.js`, cubre la app. En Inicio, chat y alta se muestra el pie; en formularios se muestra el campo activo sin cubrirlo con el menú. Se distinguen una reducción significativa con campo activo, el redimensionado normal, escritorio y zoom. El foco entre campos conserva la altura, y el scroll manual no se recoloca ante cambios menores posteriores.

El chat y el alta desplazan únicamente su lista de mensajes al recibir texto: `scrollIntoView` movía también el contenedor exterior y volvía a ocultar el compositor. Se retira el menú duplicado dentro del alta, que ya renderiza App. Campos móviles a 16 px para evitar el zoom automático al enfocar.

Se conservan funciones, datos, permisos y handlers. No se cambia Supabase ni el envío. Alturas completas explícitas de chat, carta, login, perfil y respuesta profesional usan la misma referencia estable. Los diálogos conservan sus scrollers y el comportamiento nativo de foco.

Referencia: [MDN, VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) distingue la ventana visual del viewport de layout; el teclado puede modificar solo la primera.

## Pruebas y límites

- Servidor local aislado con visualViewport de prueba independiente: layout 390×844, área visible 390×484. No es simplemente encoger la ventana.
- Inicio: burbuja 614 px, tarjeta 116 px y 1 de 3 pasos antes/después. Scroll exterior de 360 px al abrir; escritura y menú sobre el teclado. Recorrido nativo en ambos sentidos: scroll 360→0→360, contenido -286→74→-286. Cambiar offsetTop y emitir scroll no recoloca la página.
- Chat: después de llegar el saludo, compositor hasta y=468 dentro de 484 px visibles; sugerencias separadas 18 px. No salta el contenedor exterior.
- Carta, login y alta: campos visibles con contenido de 844 px preservado. Alta con un único menú. Formularios de prueba sin enviar credenciales ni altas.
- Sin teclado: Inicio a 320×568 sin scroll exterior; escritorio 1280×900 conserva el layout. Consola sin errores en la revisión.
- `scripts/test-keyboard-viewport.mjs`: altura estable, teclado que reduce solo viewport visual (iOS) o también innerHeight (Android), cierre, foco entre campos, scroll no secuestrado, reserva del menú, escritorio y limpieza.
- Build, matching 255/255, paginación 200 casos, smoke 8×2 pantallas y 120×4 tarjetas. Lint sin nuevos diagnósticos, no-undef=0; persisten 107 errores y 6 avisos previos.

La apertura del teclado y el desplazamiento de Safari se simulan en navegador. No se ha ejecutado un teclado físico de iPhone; la captura de Sergio aporta el fallo real y la comprobación final en su dispositivo sigue siendo valiosa. Ninguna prueba simulada se presenta como validación de hardware.
