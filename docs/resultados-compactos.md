# Resultados compactos y estados claros

## Decisión de Sergio · 2026-09-27

La búsqueda debe dejar espacio a la conversación. Primera opción y alternativas usan tarjetas horizontales con la misma altura; la información extensa se consulta al entrar al perfil. No usar emojis decorativos en la interfaz: usar iconos de trazo del sistema de Nüra. No eliminar ni transformar los mensajes o publicaciones que escriban las personas.

## Implementación · Codex

Rama `codex/resultados-compactos`, base `17214cd` (PR #88). La publicación se verifica en GitHub y Vercel; este documento no certifica por sí solo un despliegue.

- `HelperCardTall`: nueva variante `compact`, 116 px de alto; foto, nombre, especialidad en una línea, valoración/precio, Ver perfil y botón de chat de 44 px. La primera opción usa un fondo suave, sin ocupar más. El nombre con tratamiento toma correctamente la inicial del apellido.
- `Home`: conserva hasta cuatro resultados y su orden; listado horizontal uniforme, alternativas separadas por una etiqueta breve. Ajustes en dos columnas móviles/tres de escritorio, con los mismos textos y manejadores de ordenación/corrección.
- `MyServices`: estado con icono y texto encima del nombre; fecha y acciones separadas. Perfil accesible con botón nativo y teclado. Conserva filtros, permisos, cancelación en dos pasos, cambio de hora y valoración.
- Iconos de publicaciones/tipos/reacciones y estados vacíos, calendario de Chats y plantillas decorativas de la app sustituyen emojis. `ObraTypeIcon` evita mezclar iconos y objetos React en los datos. Contenidos de usuarios intactos.

## Coordinación con Claude

Traer `main` antes de continuar. No se ha cambiado matching, análisis, Supabase ni contratos de datos. En Home conservar ResultsBlock, variante compacta e iconos al añadir la búsqueda por oficio. La tarea de comprensión por oficio sigue siendo responsabilidad de Claude: durante una prueba local «Busco psicólogo para mí en Barcelona» todavía devolvió primero una médica internista; es el problema preexistente de categoría amplia, no un cambio de orden introducido por este diseño.

Los cambios de Chat y de `utils/chatReplies.js`/`utils/feedGenerator.js` solo retiran emojis de texto predeterminado; no cambian envío ni datos remotos. No se ha enviado un aviso automático a Claude.

## Verificación

- Compilación de producción correcta.
- Suite de búsqueda 255/255.
- Smoke: ocho pantallas en dos escenarios; 120 profesionales en tres variantes de tarjeta (se amplía el censo existente a la compacta).
- Lint: sin nuevos problemas frente a la base; `no-undef` cero. Queda deuda previa de lint, no se presenta como limpio.
- Navegador: 390 px y 360 px sin desbordamiento; tarjetas de 116 px, independientemente de especialidad/datos; cuatro tarjetas iguales también a 1280 px. Orden por precio, perfil por teclado, acceso de invitado al login y acceso autenticado al chat con contexto conservado. Consola sin errores observados.
- Historial en entorno aislado con cinco estados ficticios: pendiente, confirmada, completada, cancelada y rechazada. Filtro de completadas y confirmación de cancelación legibles. No se contacta ni modifica ninguna cita real.

Siguientes revisiones visuales: conversaciones largas, lectura de mensajes y barra de escritura con teclado móvil. Conservar este criterio de iconos y tarjetas compactas en futuras pantallas.
