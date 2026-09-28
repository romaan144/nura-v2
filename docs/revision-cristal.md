# Revisión del cristal · 28 de septiembre de 2026

Responsable: Codex. Base `637b3ff`. Revisión de presentación con datos aislados: ninguna escritura, notificación, reserva o valoración real. Las vistas privadas usan ejemplos locales que no forman parte del despliegue.

## Recorrido, en orden

| Pantalla o estado | Comprobado en navegador y ajuste |
| --- | --- |
| Inicio | Ver todos, perfil, decisiones y campo de texto; cristal también con foco. Panel flotante con desenfoque. |
| Catálogo | Categorías, búsqueda, selección de categoría, filtros, volver y reinicio; limpieza y selector con material común. |
| Conversación | Volver, identidad, contratar, respuestas rápidas, burbujas y escribir. Texto de prueba sin enviar. |
| Carta de presentación | Tarjeta de destinatario, carta, regenerar y envío sobre el menú. Sin enviar. |
| Lista de chats | Buscador, conversaciones e indicador de no leído. |
| Perfil invitado | Tarjeta de cuenta y tres acciones; acceso profesional con borde y reflejo. |
| Perfil usuario | Nombre, teléfono, ciudad (abrir/cancelar), listas, acceso profesional y ajustes. |
| Perfil profesional | Vista previa, edición y publicación; editor de obra abierto, campos y tipos comprobados sin publicar. |
| Editar ficha | Campos, cerrar/cancelar, guardar, modalidad y horario presentes; cierre sin guardar. |
| Ficha pública | Volver, compartir, trayectoria expandida, publicaciones, comentarios y contacto. Campo de comentario enfocado sin enviar. |
| Siguiendo | Tarjetas, volver y botones de seguimiento. Sin cambios de seguimiento. |
| Comunidad | Pestañas Todo/A quien sigues, temas, invitación a publicar y tarjetas. Selección del filtro comprobada. |
| Mis servicios | Tarjeta completada y acceso a valoración; filtros y botones. |
| Reserva | Apertura desde chat, controles, selección inicial y envío desactivado. Sin reservar. |
| Valoración | Abrir, seleccionar estrellas y cerrar. Estrellas, campo, botones y pie adaptados; sin enviar. |
| Aviso de búsqueda | Zona larga, correo largo, móvil, controles seleccionados y pie; cerrar sin activar. |
| Avisos guardados | Renovar, quitar y nuevo profesional con datos locales; sin activar acciones. |
| Bandeja y agenda profesional | Propuesta y cancelación ficticias, bloquear, notificación y acceso a responder. |
| Responder | Propuesta local, respuestas rápidas, textarea y envío desactivado; enlace inválido y fallo de conexión. |
| Alta profesional | Introducción, volver, logotipo, burbuja y entrada de respuesta. Usa Home.module.css; estilos corregidos allí. |
| Cómo funciona para profesionales | Botones principales y secundarios, navegación y paneles. |
| Entrar y recuperar | Mostrar contraseña, recuperación y botones; sin transmitir credenciales. |
| Restablecer | Estado sin enlace válido y acciones de retorno. |
| Login | Paso de teléfono y código con número ficticio local; no se completa una cuenta. |
| Privacidad y términos | Volver y panel de lectura compartido; contenido intacto. |
| Página inexistente | Volver a Nüra y Explorar profesionales. |
| Baja de aviso | Estado final mediante función local simulada; ningún aviso real eliminado. |

## Componentes comprobados por código

FotoPerfil (incluido recorte), ConfirmarDeclarado, ErrorBoundary y estados de guardado/conflicto reutilizan las recetas de cristal. No se fuerza un fallo global ni se sube una foto para validar una tarea visual. Los estados completos de citas y errores de red no se ejercitan exhaustivamente: se comprueban los controles comunes y la conservación estructural de sus manejadores.

## Comprobaciones y límites

- Navegador a 390×844 en el recorrido; catálogo a 320×568 e Inicio a 1280×900 sin desbordamiento horizontal.
- Inicio y chat con teclado simulado y desplazamiento Safari de 90 px. Campo de Inicio 30,8 px por encima del menú; material calculado con blur(22px), conservado al enfocar.
- No equivale a probar un iPhone físico ni al componente nativo de iOS.
- Build correcto; matching 255/255; smoke 8 pantallas × 2 escenarios y 120 profesionales × 4 variantes.
- Lint conserva deuda anterior, sin diagnósticos nuevos (comparación por archivo, regla y mensaje sin fragmentos de código desplazados), no-undef=0.
- Comparación estructural de todos los JSX modificados: mismos manejadores, disabled, value, checked, href/to y atributos de selección.
- Alternativas existentes sin desenfoque, con transparencia reducida y contraste alto conservadas. Texto de lectura más opaco; señales de error/éxito y acciones destructivas mantienen su significado.

La comprobación local no certifica publicación: usar la PR y el estado del despliegue del commit integrado en main.
