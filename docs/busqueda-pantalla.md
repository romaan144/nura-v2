# Inicio: una respuesta por pantalla

## Petición de Sergio

Una sola burbuja grande, como la bienvenida, sin conversación acumulada ni scroll. Cada búsqueda o clic cambia su contenido. El campo de escritura y el menú se mantienen debajo.

## Implementación

Codex, rama `codex/busqueda-pantalla`, desde `3d32a74` (PR #89).

- `Home` mantiene su historial interno y todos los manejadores. Un límite de presentación marca el inicio de cada nueva acción; solo se muestra esa respuesta. Se conserva el texto completo de ese turno, incluidas explicaciones y seguimientos.
- `ResponseScreen` mide los bloques con ResizeObserver y los reparte en páginas según el espacio real. Los bloques inactivos son invisibles e inertes: no quedan en el recorrido del teclado ni se anuncian como contenido actual. Al avanzar o retroceder, el foco pasa al contenido sin mover la pantalla.
- Los textos largos se dividen en fragmentos legibles conservando el contenido y las negritas. Los resultados mantienen su orden y los cuatro perfiles que ya enseñaba Inicio. Los ajustes disponen de página propia y acceso directo desde la cabecera.
- Escritura y menú se muestran debajo en móvil y ordenador. El teclado usa visualViewport para reservar el espacio visible. Esta adaptación se activa solo en la ruta Inicio; Home permanece montada al visitar otras rutas, por lo que se limpia al cambiar de ruta.
- Las citas próximas aparecen como resumen con acceso a Mis servicios, donde se conservan las acciones de gestión.
- Transición breve al cambiar de respuesta, sin movimiento continuo y respetando movimiento reducido.

Esta decisión de Sergio sustituye las reglas anteriores de Inicio como scroller. No convertir esta pantalla de nuevo en un historial de mensajes.

## Coordinación con Claude

Archivos compartidos: Home.jsx/CSS, RecordatorioCita.jsx, HelperCardTall.module.css, CSS de BottomNav/DesktopSidebar, design-system.css. Nuevos ResponseScreen.jsx/CSS, utils/responseLayout.js y scripts/test-response-layout.mjs.

La búsqueda por oficio sigue a cargo de Claude. No se han cambiado matching, Supabase, permisos, mensajes enviados ni ordenación. `handleRefine` contiene la lógica existente extraída del JSX; conserva todas las acciones. Traer main y preservar el nuevo contenedor al continuar las funcionalidades. No hay aviso automático entre herramientas.

## Comprobaciones

- Build correcto; matching 255/255.
- Smoke: ocho pantallas × dos escenarios y 120 profesionales × tres variantes.
- Paginación: 200 combinaciones de alturas/listas; ningún bloque perdido ni repetido, orden conservado, secciones separadas y texto completo con negritas.
- Lint sin diagnósticos nuevos; no-undef cero. La deuda previa permanece (107 errores y seis advertencias en la revisión).
- Navegador: móvil 390×844, 320×568, 390×600, espacio reducido 390×380 y escritorio 1280×900. Respuestas sin desbordamiento en las medidas revisadas; menú y escritura visibles. La prueba de altura reducida no sustituye una comprobación en un iPhone físico.
- Recorrido de cuatro profesionales y ajustes: cinco pasos a 390×600, cero desbordamientos; scroll del documento igual a la altura de pantalla en todos los pasos.
- Respuesta larga aislada: ocho detalles íntegros en cuatro pasos a 320×568; ninguna parte recortada.
- Bienvenida, elegir familia, búsqueda sin resultados, ampliar zona, ordenar por precio, corregir una búsqueda, avanzar/retroceder y cambio a Perfil. La navegación habitual de otras páginas se restaura al salir de Inicio.
- No se han enviado mensajes ni modificado citas reales. Las pruebas con datos ficticios se ejecutan solo en servidores locales aislados.

La integración y el despliegue se comprueban en GitHub y Vercel, no se deducen de este documento.
