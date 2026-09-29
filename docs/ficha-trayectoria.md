# Ficha profesional: trayectoria, citas y valoración

## Cambio solicitado por Sergio · 2026-09-27

El botón de trayectoria estaba pegado a «Ver los casos», fuera de cualquier sección, y no dejaba claro dónde consultar experiencia y formación.

Ahora «Trayectoria y formación» es un bloque propio después de «Puedo ayudarte con» y antes de «Su obra». Muestra un puesto y una formación que ya existen en la ficha. El botón «Ver experiencia y estudios» despliega el contenido original dentro del mismo bloque y permite volver a cerrarlo. Se conservan todos los puestos, estudios, periodos, detalles y pruebas originales. Solo aparece cuando existen esos datos; no se inventan credenciales.

El botón declara su estado con `aria-expanded` y está asociado a los detalles. Funciona con teclado y tiene foco visible. Los detalles usan encabezados de tercer nivel dentro de la sección.

## Continuación de citas y valoraciones

- Selector de fecha compartido entre ficha y chat: días y horas más cómodos de pulsar, estado seleccionado más claro y fecha completa visible. Sin cambios en disponibilidad, bloqueos ni manejadores.
- La reserva de la ficha y la valoración se muestran sobre la navegación mediante portal. Antes la barra podía dibujarse encima. La reserva tiene nombre accesible y cabe con desplazamiento interno en móvil.
- Valoración: preguntas separadas, estrellas sin seleccionar más visibles, controles de 44 px o más y «Enviar valoración» explícito. Se conserva el límite de tres cualidades y el consentimiento de comentario público desmarcado.

## Comprobación

Build, matching (255/255) y smoke (8 pantallas × 2 escenarios y censo de 120 tarjetas × 2 tamaños) correctos. Lint: sin hallazgos nuevos; 111 errores y 6 avisos previos, frente a 112 y 6 del punto de partida. `no-undef`: 0. La reducción corresponde a una variable de formación antes sin uso que ahora alimenta el resumen.

Navegador en 360, 390 y 1280 px: abrir/cerrar trayectoria, teclado, separación de 16 px respecto a Su obra y expansión de sus cuatro casos. Reserva simulada: elegir día/hora, comprobar que cambiar el día borra la hora, enviar y abrir Mis servicios. Valoración simulada: tres cualidades, cuarta deshabilitada, estrellas, comentario no público por defecto y confirmación local. Sin errores de consola en el recorrido comprobado.

Las pruebas de interacción usan una copia local que intercepta peticiones externas: no se crean citas ni valoraciones reales. No se prueba entrega real al profesional.

## Coordinación

Responsable Codex, rama `codex/ficha-trayectoria`, desde `d92af78` (PR #87). Leer este documento y actualizar desde main antes de continuar. La lógica de búsqueda de Claude no se modifica. Publicación autorizada por Sergio tras las comprobaciones, sin aprobación estética adicional. El despliegue efectivo se comprueba en GitHub/Vercel.
