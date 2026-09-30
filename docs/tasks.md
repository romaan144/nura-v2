# Trabajo compartido

## Contacto directo con borrador breve · Codex · 2026-09-28

**Estado:** implementado y comprobado localmente; integración/despliegue se verifican en GitHub/Vercel. **Rama:** `codex/contacto-directo-chat`, desde `48e073e`.
**Petición de Sergio:** eliminar la carta de presentación intermedia al escribir desde la ficha; abrir el chat normal con un texto breve en la entrada.
**Cambio:** la ficha siempre navega a Chat tras la comprobación de cuenta. `/intro/:id` queda como redirección compatible al chat y descarta cualquier antiguo introLetterText. Se elimina de Chat la rama que convertía esa carta en mensaje automáticamente. Sin historial, se prepara un borrador en primera persona: saludo, búsqueda corta y pregunta. Sin búsqueda o con más de 120 caracteres, saludo y pregunta de disponibilidad. Sin motivos promocionales, valoraciones ni afirmaciones de disponibilidad. Editable y solo se envía al pulsar Enviar. Las conversaciones existentes abren con el campo vacío.
**Contrato para Claude:** cambio de flujo autorizado por Sergio. Se conserva historial original (incluidas cartas antiguas ya enviadas), llamadas de envío, registro, avisos y solicitud de citas. El profesional recibido desde la ficha se usa si su id coincide con la ruta. Se retira hayContexto, sin usos restantes. Las funciones antiguas de generación de cartas permanecen disponibles pero no se usan en este recorrido. No se cambia scroll ni teclado.
**Validación:** build, matching 255/255, smoke 8×2 +120×4 y test-chat-scroll. Lint sin aumento de diagnósticos por archivo/regla y no-undef=0; advertencias previas de hooks pierden referencias a la rama eliminada. Navegador aislado: ficha con búsqueda abre directamente borrador corto, editar no añade mensaje, enviar demo añade solo el texto editado, volver a escribir conserva conversación/campo vacío; enlace /intro/5 abre /chat/5 con saludo breve sin enviar. Ningún mensaje ni dato real enviado.


## Gesto del chat y Contratar destacado · Codex · 2026-09-28

**Estado:** implementado y comprobado localmente; integración/despliegue se verifican en GitHub/Vercel. **Rama:** `codex/chat-scroll-contratar`, desde `dba3d1f`.
**Problema reproducido:** al abrir teclado, desktopMain era desplazable (844 px dentro de 484, scrollTop=360) y el historial también. Además, cada cambio de messages/typing forzaba una animación al final, incluso durante la lectura.
**Corrección:** solo en Chat, appCanvas ocupa la ventana visible y desktopMain deja de ser desplazable. Cabecera/campo conservan posición y el historial usa el espacio disponible. `attachChatScroll` sigue el final solo si ya se estaba cerca, al entrar o al enviar un mensaje propio. Llegadas, escritura y redimensionados respetan la lectura anterior y el gesto táctil; sin animación ni preventDefault. Contratar usa el degradado morado principal, texto blanco y relieve. Se mantienen formas flotantes y desvanecido.
**Contrato para Claude:** sin cambios de consultas, texto/historial, permisos, solicitud/valoración o dictado. Cambio de comportamiento exclusivamente del desplazamiento. Nuevos `src/utils/chatScroll.js` y `scripts/test-chat-scroll.mjs`; `test:chat-scroll` en package.json. keyboardViewport no se modifica; Inicio y formularios mantienen el lienzo anterior. El observador/eventos se limpian al desmontar.
**Validación:** build, matching 255/255, smoke 8×2 +120×4, lint sin diagnósticos nuevos/no-undef=0; pruebas nuevas de lectura, llegadas, envío, teclado, toque/cancelación y limpieza, más test-keyboard-viewport existente. Navegador local aislado con 18 mensajes: teclado deja una sola zona desplazable de 484 px, cabecera visible y campo en 430..484. Scroll en ambos sentidos, respuesta demo sin mover scrollTop=2135; pan de Safari y cierre mantienen ese punto. 320×568 y 390×844; solicitud abre sin enviar. No prueba física de iPhone ni envío de datos reales.


## Chat flotante y compacto · Codex · 2026-09-28

**Estado:** implementado y comprobado localmente; integración/despliegue se verifican en GitHub/Vercel. **Rama:** `codex/chat-flotante-compacto`, desde `0b75d70`.
**Corrección solicitada:** la cabecera anterior ocupaba demasiado y el historial se cortaba horizontalmente bajo la cabecera y sobre la entrada. Foto de 44 px, cápsula unida por solapamiento de 5 px, nombre/especialidad en líneas compactas con elipsis. Identidad de unos 77 px frente a 122 px; controles laterales mantienen 44 px táctiles.
**Diseño:** historial absoluto de borde a borde detrás de cabecera y campo, sin paneles rectangulares de fondo. Reserva interna al principio/final para leer el primer/último mensaje y desvanecido superior gradual. Pie flotante transparente con solo la cápsula y safe-area. El historial sigue visible por los laterales al desplazarlo.
**Contrato para Claude:** CSS de Chat y comentario JSX; ningún cambio de mensajes, consultas, handlers, citas, dictado ni keyboardViewport. Datos de prueba únicamente en un servidor local externo al repositorio.
**Validación:** build, matching 255/255, smoke 8×2 +120×4; lint sin diagnósticos nuevos y no-undef=0. Ordenador 1280×900 sin desbordamiento horizontal. Historial local ficticio de 18 mensajes, desplazamiento intermedio y final, 390×844 y 320×568; región desplazable ocupa 0..844 px, entrada 790..844 y teclado simulado 430..484. Pan simulado de Safari de 90 px conserva el anclaje. Solicitud abre/cierra sin enviar. No se ha probado en iPhone físico.


## Chat con identidad centrada · Codex · 2026-09-28

**Estado:** implementado y comprobado localmente; integración y despliegue se verifican en GitHub/Vercel. **Rama:** `codex/chat-cabecera-simple`, desde `24e653a`.
**Cambio:** foto circular de 64 px centrada, pequeña cápsula con nombre y especialidad debajo, Volver a la izquierda y Contratar a la derecha. Se retiran puntuación, insignias, disponibilidad y aviso de escudo del chat, también en el estado vacío. Pie con solo la entrada de cristal de 54 px, sin margen inferior artificial; conserva la zona segura del dispositivo. Sugerencias y respuestas rápidas pasan al área desplazable.
**Contrato para Claude:** consultas, mensajes, envíos, dictado, fechas y permisos sin cambios. Foto/nombre siguen abriendo la ficha. Contratar conserva el estado del servicio y los handlers de solicitud/valoración. No se altera keyboardViewport ni la navegación. Las valoraciones y acreditaciones siguen en la ficha profesional; solo se elimina su repetición en el chat.
**Pruebas:** build, matching 255/255 y smoke 8×2 +120×4; lint sin diagnósticos nuevos y no-undef=0. Vista aislada a 390×844, 320×568 y 1280×900: sin desbordamiento horizontal, apertura/cierre de solicitud sin enviar, ficha y vuelta, envío y respuesta exclusivamente demo. Teclado simulado deja la cápsula en el límite visible (484 px); desplazamiento de Safari de 90 px mantiene su posición relativa. No equivale a una prueba en iPhone físico. No se enviaron mensajes ni citas reales.


## Avisos de error y reintentos · Codex · 2026-09-28

**Estado:** implementados y comprobados localmente; integración y despliegue se verifican en GitHub/Vercel. **Rama:** `codex/avisos-error`, desde `be92e5a`.
**Cambio:** `ErrorPanel` reutiliza la tarjeta de cristal de `EmptyPanel`, con icono de aviso ámbar, título y explicación anunciados mediante role=alert, y acciones separadas de 48 px. Aplicado al fallo general, ficha, chat, categoría y enlace de respuesta profesional. Fallos de formulario de acceso conservan tinta de error con borde definido y superficie clara. Detalle técnico plegable, con aria-expanded y texto largo adaptable; se añade Volver a la cabecera del error de Chat.
**Contrato para Claude:** mismos estados, consultas, reintentos, recarga de versión, tokens de enlace, handlers y destinos. Los enlaces no disponibles conservan su rama propia sin Reintentar. No se envían mensajes al reintentar abrirlos. `EmptyPanel` admite tono, rol del texto y contenido adicional sin cambiar sus estados vacíos anteriores. Sin cambios de teclado, navegación inferior ni datos. MisAlertas y errores de envío dentro de conversaciones no se reestructuran en esta tarea.
**Pruebas:** build, matching 255/255 y smoke 8×2 +120×4; lint sin diagnósticos nuevos y no-undef=0. Fixture externa sin servicios reales: error/reintento persistente y recuperación de ficha, chat, catálogo y enlace de mensaje; enlace de chat antiguo permite salir a Inicio. Error general: detalle largo, plegar/desplegar y recarga con recuperación. 390×844 y 320×568; sin desbordamiento horizontal, acciones de 48 px y detalle de 44 px. Validación local de correo incompleto mantiene el aviso junto al campo. Ningún mensaje, cita o cuenta real enviado/modificado. No probado en iPhone físico.

## Redacción natural de Nüra · Codex · 2026-09-28

**Estado:** implementada y comprobada localmente; integración y despliegue se verifican en GitHub/Vercel. **Rama:** `codex/textos-naturales`, desde `fee378a`.
**Petición:** respuestas más cuidadas en toda la app, sin rayas largas ni símbolos de relleno.
**Cambio:** recomendaciones de Inicio en frases separadas; puntuación de comprensión, corrección, errores y ajustes; textos de precio, presentación, sugerencias y conversación demo, avisos, perfil, registro y publicaciones demo. Se retiran rayas de atribución y se escribe «entre 1 y 3 h» en la respuesta temporal. Se corrigen «te contacto Hola» y «Hola Hola» en sugerencias. Urgencia invita a preguntar si puede venir hoy, en lugar de afirmar disponibilidad no comprobada.
**Contrato para Claude:** se cambian plantillas, sin limpieza global del texto. Mismos datos, consultas, orden de recomendaciones, chips exactos, rutas y manejadores. `matching.js` solo cambia las tres frases de precio, no el motor. Mensajes originales, publicaciones guardadas, nombres y fechas conservados; no hay migración del historial ni cambios de Supabase. Datos de ejemplo de perfiles y nombres de categorías no se renombraron. Pauta editorial en `docs/diseno-integral.md`.
**Validación:** build, matching 255/255 y smoke 8×2 +120×4; lint sin diagnósticos nuevos y no-undef=0. Pruebas locales de cartas con/sin nombre y respuestas demo; consulta del usuario con raya permanece intacta. Búsqueda «Técnico urgente hoy» muestra Tomàs, 16 años y 4,9/138 opiniones; Mejor valorado sigue funcionando. Verificación visual a 390×844 y comprobación de paginación en 320×568. Sin envíos ni modificaciones reales; no equivale a prueba de iPhone físico.

## Pantallas sin conversaciones, seguidos ni citas · Codex · 2026-09-28

**Estado:** implementadas y comprobadas localmente; integración y despliegue se verifican en GitHub/Vercel. **Rama:** `codex/estados-vacios`, desde `09196f1`.
**Cambio:** `EmptyPanel` comparte tarjeta de cristal, icono Lucide decorativo, título h2, explicación y acciones de 48 px. Chats sin conversaciones y sin resultados, Siguiendo sin guardados y los tres filtros vacíos de Mis servicios. Textos orientan al siguiente paso y conservan las diferencias entre cliente y profesional.
**Contrato para Claude:** listas, filtros, datos y destinos existentes conservados. Única acción nueva: Borrar búsqueda limpia el filtro local de Chats. Con búsqueda escrita no se muestra además la invitación de bandeja vacía. No se cambia BandejaProfesional, consultas, permisos, teclado ni navegación. `scroll-padding-block` en las tres páginas reserva cabecera/menú al desplazar hacia un control; no altera sus alturas. `EmptyState` antiguo sigue disponible para catálogo/Feed, fuera de esta tarea.
**Pruebas:** build, matching 255/255 y smoke 8×2 +120×4; lint sin diagnósticos nuevos y no-undef=0. Navegador aislado sin demo: Chats vacío, búsqueda larga sin resultados y borrar; ambos destinos de Siguiendo; Todos/Próximos/Completados de Mis servicios; textos cliente/profesional. 390×844, 320×568 y 1280×900. En 320 px, Tab desplaza el botón de citas por encima del menú (borde inferior 417 px frente a menú en 496 px). Sin desbordamiento horizontal, sin envíos ni cambios reales. No equivale a prueba física de iPhone.

## Espera de perfiles y chats · Codex · 2026-09-28

**Estado:** integrada en PR #119 y despliegue Vercel verificado (`09196f1`). **Rama:** `codex/carga-perfiles-chats`, desde `af31ff2`.
**Cambio:** PageLoading comparte cuatro vistas de espera (ficha, perfil propio, chat y lista de chats). Se usa tanto en Suspense de esas rutas/pestañas como mientras se consulta un profesional. Cabecera, salida en ficha/chat, mensaje de estado y siluetas de cristal; sin controles ficticios ni animaciones repetidas. Contenido final aparece en 180 ms por opacidad, sin espera artificial.
**Contrato para Claude:** mismas consultas, condiciones loading/buscando, cachés, reintentos, errores y rutas. No se añaden temporizadores ni cambios de datos; tampoco se toca keyboardViewport. La descarga y la consulta usan el mismo kind de PageLoading para evitar dos vistas distintas. Siluetas aria-hidden; estado legible por asistentes. Movimiento reducido omite las nuevas entradas. La navegación del chat sigue sin menú inferior.
**Pruebas:** build, matching 255/255 y smoke 8×2 +120×4; lint sin diagnósticos nuevos y no-undef=0. Fixture externa detiene descarga y datos por separado: ficha pasa de espera a contenido; chat pasa a error, reintenta y permite volver; chat exitoso muestra campo operativo; lista de chats y perfil invitado pasan de espera a pantalla real. 390×844, perfil a 320×568 y chat a 1280×900, sin desbordamiento horizontal. Ningún mensaje, cita ni dato real enviado. Sin prueba física de iPhone; retardos exclusivamente locales y fuera del repositorio.


## Pulsación uniforme de controles · Codex · 2026-09-28

**Estado:** implementada y comprobada localmente; publicación por comprobar en GitHub/Vercel. **Rama:** `codex/respuesta-pulsacion`, desde `3b8af6b`.
**Cambio:** se retiran las escalas y bajadas de opacidad dispersas. Botones y superficies con role=button comparten escala .985 y brillo .97, con recuperación en 160 ms. El texto conserva opacidad; se retiran saltos hover de controles en Inicio, catálogo y chats. Se usa scale independiente para no sustituir transforms de posición.
**Contrato para Claude:** no cambia ningún onClick, navegación, selección, dato o permiso. Solo se retiran los tres manejadores de estilo pointer de HelperCardTall y transiciones inline que impedían compartir CSS. La regla excluye controles disabled/aria-disabled y padres con una acción descendiente activa. Movimiento reducido usa --press-scale:none y conserva feedback de color. Portales incluidos; inputs y enlaces de texto no se encogen. No añadir de nuevo opacidad/transform de pulsación por pantalla.
**Pruebas:** build, matching 255/255 y smoke 8×2 +120×4 pasan; lint sin diagnósticos nuevos y no-undef=0. Navegador aislado 390×844: Ver todos, tarjeta de categoría, filtro Online, Contratar/cancelar reserva, acceso profesional y pestaña Buscar. Registro en pointerdown confirma :active, opacidad 1 y transición hacia .985; reposo vuelve a scale:none. Enviar solicitud desactivado conserva scale/filter:none; no se envía. Sin desbordamiento horizontal. Preferencia reducida y exclusión de controles anidados revisadas en CSS; pendientes contraste físico de iPhone y prueba visual de movimiento reducido del sistema.


## Transiciones de respuestas de Inicio · Codex · 2026-09-28

**Estado:** implementado y comprobado localmente; integración/publicación se verifican en GitHub y Vercel. **Rama:** `codex/transiciones-inicio`, desde `0981021`.
**Cambio:** ResponseScreen anima únicamente el contenido medido (240 ms, opacidad y desplazamiento vertical de 8 px). Avanzar entra desde abajo y retroceder desde arriba. El marco de cristal, cabecera, controles inferiores, campo y navegación permanecen fijos; se retira la animación del marco completo.
**Contrato para Claude:** no se retiene contenido anterior, ni se introduce espera, temporizador o estado de transición. Se conserva paginación, foco, selección y bloques inertes. El efecto se cancela al cambiar de paso o desmontar; no se reinicia al medir/redimensionar. Movimiento reducido omite la animación y un cambio de preferencia la cancela. Sin cambios de Home, matching ni keyboardViewport.
**Pruebas:** build, paginación 200 escenarios, matching 255/255 y smoke 8×2 +120×4 pasan; lint sin diagnósticos nuevos y no-undef=0. Navegador aislado 390×844: primera recomendación, alternativas agrupadas, ajustes y retroceso consecutivo. Marco/campo/menú con rectángulos idénticos antes/después. Registro local confirma duración y dirección, foco en contenido y bloques ocultos inertes. Redimensionar a 320×568 no crea otra animación. Rama de movimiento reducido simulada en fixture: cero animaciones y navegación operativa. Sin mensajes ni datos reales. Pendiente contraste en iPhone físico.


## Repaso completo del cristal · Codex · 2026-09-28

**Estado:** implementado y verificado localmente; integración y despliegue se comprueban por GitHub/Vercel. **Rama:** `codex/repaso-cristal-completo`, desde `637b3ff`.
**Petición:** revisar página por página los controles que quedaron fuera del material compartido, especialmente Ver todos, perfil, escribir y volver.
**Cambio:** tokens más translúcidos con borde y reflejo definidos; clases explícitas y `components/ui/glass.js` para estilos inline. Inicio deja de reutilizar el estilo del logotipo para el botón del perfil. Se corrigen fondos blancos al enfocar y piezas propias de registro, agenda, respuesta profesional, publicaciones, acceso, citas, valoraciones y avisos.
**Contrato para Claude:** solo presentación y nombres accesibles de botones de registro. Comparación estructural de JSX confirma que manejadores, disabled, value, checked, enlaces y selección no cambian. No se modifica matching, rutas, datos, permisos, reservas del menú ni keyboardViewport. Usar los tokens o `glass` al añadir controles; no reintroducir fondos blancos en focus/hover.
**Validación:** build y matching 255/255 pasan; smoke 8×2 + censo 120×4 pasa; lint sin diagnósticos nuevos respecto a main y no-undef=0 (deuda anterior permanece). Recorrido y límites en `docs/revision-cristal.md`. Sin envíos, reservas ni cambios reales de cuenta.


## Transiciones de ventanas · Codex

**Estado:** implementadas y comprobadas localmente. **Rama:** `codex/transiciones-ventanas`, desde `1dbfe93`.
**Alcance:** CitaModal, RatingModal, AlertaSheet, RegisterGate y EditarFicha comparten entrada suave (240–280 ms) y cierre voluntario de 180 ms. Sin animar altura ni desenfoque; movimiento reducido cierra inmediatamente.
**Contrato para Claude:** `useModalMotion` devuelve `dismiss` para cerrar visualmente y `motionProps` para bloquear acciones durante la salida. `useModalSheet` lo integra con Escape, foco y restauración. Navegación, confirmaciones y guardado conservan callbacks inmediatos: no sustituirlos por `dismiss`, pues algunos padres permanecen montados al navegar. Temporizador cancelado al desmontar, cierre único y callback actualizado. RegisterGate añade semántica de diálogo y foco contenido. No se cambian datos, solicitudes, rutas, reservas ni keyboardViewport.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0. Fixture externa: cierre medido 182–184 ms; doble cierre se ejecuta una vez; acción posterior bloqueada incluso en el mismo evento; desmontar cancela callback y reapertura conserva nuevo callback. Rama JS de movimiento reducido simulada: cierre en 0 ms. Navegador móvil 390×844: reserva abrir/Escape/cancelar/restaurar foco; valoración con teclado simulado (campo sobre pie), sin enviar; aviso cerrar/reabrir/acceso sin portal residual; editar/cerrar sin guardar; acceso con Tab/Escape y navegación. No se han realizado envíos reales. Pendiente prueba física de iPhone.

## Cristal en toda la aplicación · Codex

**Estado:** implementado y comprobado localmente. **Rama:** `codex/cristal-toda-la-app`, desde `73d1d94`.
**Petición:** extender el aspecto del menú a botones y burbujas por toda Nüra, tomando también el chat de Tinder como referencia.
**Alcance:** tokens de material compartidos, 27 módulos visuales y presentación de Button/Bubble y edición de ficha/horario/bloqueos. Inicio, resultados, chats, perfiles, catálogo, servicios, publicaciones, acceso, alta y ventanas de reserva/valoración/avisos comparten cristal claro, bordes definidos y controles redondeados. Lectura más opaca; mensajes propios lila claro con tinta oscura; selección lila y CTA morado. Estados semánticos y superficies de carta conservados.
**Contrato para Claude:** sin cambios de rutas, controladores, permisos, datos, ranking ni textos de producto. JSX modifica únicamente objetos de estilos. No cambiar reservas ni keyboardViewport. Reutilizar `--glass-control`, `--glass-panel`, `--glass-floating`, `--glass-selected` y sus tintas/bordes; no usar texto blanco sobre la selección lila. Formas iguales en botones habilitados y deshabilitados. Desenfoque para controles flotantes; evitar añadirlo a cada fila de listas.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0. Navegador local: 320×568, 390×844 y 1280×900; Inicio, envío de chat ficticio y respuesta demo, filtros, perfil/seguidos, trayectoria, acceso, servicios, reserva sin envío, valoración sin envío y canales de aviso. Horarios/bloqueos probados y cerrados sin guardar. Tinta de disponibilidad seleccionada corregida; estados desactivados conservados. Ficha: CTA 21 px sobre navegación en 320 px. Teclado simulado y pan de 90 px: campo de Inicio a 30,8 px sobre menú, sin desbordamiento horizontal. No equivale a prueba física de iPhone; no se enviaron mensajes, citas, valoraciones ni avisos reales.

## Barra de navegación de cristal · Codex

**Estado:** implementada y verificada localmente. **Rama:** `codex/navegacion-cristal`, desde `7df412f`.
**Petición:** acercar Buscar/Chats/Perfil al cristal y la selección móvil del vídeo de Tinder aportado por Sergio, con colores integrados en Nüra.
**Alcance:** BottomNav JSX/CSS. Cristal translúcido, borde definido, tinte lila/menta y una lente que se desplaza al cambiar de pestaña. Adaptación web inspirada en Liquid Glass; no es el componente nativo de iOS ni certifica una versión futura del sistema.
**Contrato para Claude:** se mantienen los tres destinos, criterios de selección, rutas ocultas, cálculo de avisos y navegación. La lente es decorativa y no intercepta pulsaciones. Altura 62 px, botones 48 px y reserva `--nav-h` sin cambios; tampoco se modifica keyboardViewport. CSS consolidado con alternativa opaca sin backdrop-filter, movimiento reducido y mayor contraste.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4 pasan; lint sin diagnósticos nuevos, no-undef=0. Navegador local 320×568, 390×844, 430×932 y 1280×900: las tres selecciones, indicador de mensajes, navegación y barra de escritorio conservadas. Carta de presentación: envío 14 px sobre la barra, ninguna pestaña falsamente seleccionada. Teclado simulado y pan de Safari de 90 px mantienen el campo visible sobre la barra. Pendiente iPhone físico. Sin envíos ni datos de prueba en producción.

## Ventana de avisos clara · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/avisos-ventana-clara`, desde `15fea09`.
**Alcance:** presentación de AlertaSheet, misma selección y confirmación. Separar búsqueda, zona, canales y privacidad; pie visible en móvil, foco y cierre accesibles. Sin cambios de servidor ni activaciones reales durante las pruebas.
**Contrato para Claude:** estados iniciales, selección de zona/ciudad y controlador confirmar conservados (comparados literalmente). El resumen distingue móvil, correo y solo perfil. useModalSheet comparte foco, Escape y restauración, sin tocar el hook. El enlace de correo llama a onClose antes de navegar: Home persiste montado y su portal de lo contrario permanece sobre Entrar. Sin cambios de suscripción, payload ni onHecho.
**Pruebas:** build, matching 255/255, smoke 8×2 + 120×4; lint sin nuevos diagnósticos y no-undef=0. Navegador aislado: ambos canales/ninguno, barrio/ciudad/sin zona, correo largo, iPhone sin instalar simulado, móvil no disponible, payloads y envío ficticio, guardando deshabilitado, Escape y ciclo de Tab, restauración de foco. 390×844, 320×568, 390×484 y 1280×900 sin desbordamiento; pie visible. Recorrido integrado en Home local: búsqueda sin resultados → aviso → acceso por correo, sin portal residual. No se pidieron permisos de notificación ni se guardaron avisos reales.

## Textos de acceso según el motivo · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/textos-acceso-contexto`, desde `7810648`.
**Alcance:** textos de Entrar según publicación, avisos, mensajes, ficha profesional o regreso genérico. AlertaSheet añade motivo=avisos para distinguir su entrada de otras que vuelven a Inicio. Solo presentación; autenticación, validaciones, permisos y destinos se conservan.
**Contrato para Claude:** `motivo=avisos` solo selecciona el texto; no activa avisos ni altera el regreso. El ancla comentarios identifica la publicación, /chat/ y /chats identifican mensajes, sin volver mantiene el acceso profesional y otros destinos usan texto general. Crear/entrar tienen sus propios textos; recuperación no cambia.
**Pruebas:** navegador aislado: cinco contextos, alternar crear/entrar y recuperación, pantalla 320 px sin desbordamiento ni errores. Build, matching 255/255, smoke 8×2 + 120×4 y lint sin nuevos diagnósticos, no-undef=0. Sin cuentas, correos ni envíos reales.

## Volver a la publicación después de entrar · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/volver-a-comentarios`, desde `d0a8b92`.
**Autorización:** Sergio pide expresamente corregir el regreso desde «Entra para comentar»; excepción funcional al reparto habitual.
**Alcance:** PostCard, apertura de Su obra en HelperProfile y desplazamiento al destino. Conservar autenticación, comentarios y datos.
**Contrato para Claude:** PostCard guarda pathname + search + ancla de comentarios en `nura_return_to`; la reacción conserva la ruta sin abrir un hilo nuevo. HelperProfile despliega la obra al regresar a comentarios. El estado de apertura distingue el hash para soportar cambios de publicación sin desmontar la ficha. ScrollToTop busca únicamente el destino visible (hay pestañas montadas y ocultas) y espera la carga del perfil; cancela al cambiar de ruta o a los 10 segundos. Autenticación y publicación no se modifican. No se envía automáticamente ningún comentario ni reacción al entrar.
**Pruebas:** reproducido antes: ficha → login → /feed. Después: primera y última publicación → acceso demo → misma ficha/hilo; acceso por nombre y correo con servicios ficticios; recarga y cambio de hash; cerrar/reabrir hilo; comentario publicado solo localmente. Móvil 390/320 y ordenador 1280, ancla a 96 px bajo cabecera. Build, matching 255/255, smoke 8×2 + 120×4; lint sin nuevos diagnósticos y no-undef=0. Sin credenciales ni comentarios de prueba en producción.

## Su obra en la ficha profesional · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/obra-profesional-diseno`, desde `b6c31b6`.
**Alcance:** PostCard y su CSS, sección Su obra en HelperProfile. Mejorar lectura, resultado y acciones; una publicación inicial y acceso claro al resto. Conservar publicaciones, datos, reacciones, comentarios y condiciones de cuenta. No se añade Comunidad al menú.
**Contrato para Claude:** PostCard mantiene irAlPerfil, pedirCuenta, publicar y acciones de UserContext; solo cambia presentación, ids accesibles y bloqueo visual del envío vacío (ya era un no-op). El sello confirmado sigue condicionado a post.confirmado. HelperProfile mantiene selección y límite de publicaciones; el mismo estado permite desplegar y recoger. No cambiar el mapeo obraAPost ni añadir pruebas al dataset publicado.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin nuevos diagnósticos y no-undef=0. Navegador aislado a 390×844, 320×720 y 1280×900: reaccionar/deshacer, comentarios propios y rápidos, hilo vacío, acceso sin sesión, desplegar cuatro publicaciones y recoger a una, textos largos sin desbordamiento, acciones de al menos 44 px. Teclado simulado 484 px y pan de 90 px: campo 16 px sobre menú. Regresión visual de Profile y Feed sin desbordamiento ni errores. Sin publicaciones ni reacciones de prueba en producción.
**Incidencia posterior resuelta:** el regreso desde acceso conserva ahora la ficha y el hilo; ver la tarea superior «Volver a la publicación después de entrar».

## Acceso y recuperación claros · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/acceso-recuperacion-diseno`, desde `383504c`.
**Alcance:** Login, Entrar, Restablecer y estilos/campo de contraseña compartidos. Etiquetas, bordes, foco, mensajes y estados legibles; conservar validaciones, sesiones, envíos y destinos. Pruebas solo con servicios locales simulados.
**Contrato para Claude:** los estados y controladores de Login, Entrar y Restablecer se conservan literalmente; PasswordField solo alterna visibilidad local y recibe los props del formulario. Se conservan mínimos, sugerencia de correo, autocompletado, sesión y destinos. Access.module.css sustituye estilos inline y dependencia de Siguiendo en estas pantallas. La demo dice expresamente que no envía SMS; no se cambia su recorrido.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0. Navegador local 390×844, 320×568 y 1280×900: errores, mostrar/ocultar contraseña, mínimo de caracteres, sugerencia de correo, confirmaciones simuladas, enlace ausente y recuperación simulada, demo teléfono/código/nombre y acceso sin demo. Teclado simulado: campo 16 px por encima del menú con viewport 484 y también con pan de 90 px. Nueva carga sin errores de consola. Sin cuentas creadas, correos enviados ni contraseñas reales modificadas. No equivale a prueba de autenticación real ni de iPhone físico.

## Explorar: filtros y tarjetas · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/explorar-filtros-tarjetas`, desde `d5b7559`.
**Alcance:** Explore JSX/CSS y presentación compartida de HelperCard. Categorías más compactas, filtros claros, fotos con mayor presencia y acciones accesibles. Conservar búsqueda, filtros, paginación, orden, contacto, datos y destinos; comprobar también Feed y vista previa de perfil que usan HelperCard.
**Contrato para Claude:** el selector nativo reemplaza solo la fila de especialidades; mantiene las mismas opciones y condiciones. Quitar filtros restablece los estados existentes. HelperCard mantiene handleTap/handleContact, contexto de navegación y comprobación de sesión; perfil y contacto son botones hermanos. La vista previa de Profile sigue dentro de inert. Explore muestra también la tarifa existente.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin nuevos diagnósticos y no-undef=0. Navegador aislado a 390×844, 320×720 y 1280×900: categorías de 112 px en móvil, tarjetas de 186–187 px uniformes, textos largos, datos opcionales ausentes y sin desbordamiento horizontal. Fixture externa de 34 profesionales: carga de más resultados y tres filtros combinados; vacío por filtros y recuperación; vacío real sin demo. Apertura de perfil con Enter, contacto hacia chat/sin sesión hacia login, búsqueda hacia Inicio. Feed y vista previa profesional sin desbordamiento; la vista previa continúa inert. Ningún dato ni envío de prueba en producción.

## Valoración clara y cómoda · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/valoracion-diseno-claro`, desde `deb0547`.
**Alcance:** RatingModal JSX/CSS, comportamiento de foco/teclado compartido con CitaModal. Preguntas separadas, estrellas legibles, contador de cualidades, comentario y consentimiento claros, envío visible. Conservar reglas, payload, permisos y callbacks. Sin cambios de servidor.
**Contrato para Claude:** RatingModal conserva estados, máximo de tres cualidades, consentimiento desmarcado, payload y callbacks. `useModalSheet` comparte solo foco, Escape y visibilidad del textarea con CitaModal; no controla envíos.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0. Navegador aislado: marcar/desmarcar tres cualidades, estrellas por teclado y deselección, comentario/contador, consentimiento inicialmente desmarcado y envío de prueba local. 390×844, 320×420 y 1280×900 sin desbordamiento. Nombre largo, foco contenido y Escape; regresión de selección de cita y cierre sin envío. Teclado simulado de 484 px: textarea termina 12 px antes del pie, también con desplazamiento de 90 px. Pendiente comprobación física en iPhone; ningún envío real.

## Solicitar cita: día, hora y confirmación · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/reserva-diseno-claro`, desde `0eb6723`.
**Alcance:** presentación común para las reservas de ficha y chat; ElegirCita, nuevo contenedor visual y uso en HelperProfile/Chat. Conservar disponibilidad, prefijado, envío, cambio de hora y estados de cada entrada. Sin cambios de servidor ni del motor de horarios.
**Contrato para Claude:** `CitaModal` contiene solo la presentación. BookingModal (ficha) y ConfirmModal (chat) conservan sus estados y callbacks de envío. ElegirCita sigue usando las mismas ocupaciones y franjas.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4. Lint sin nuevos diagnósticos y no-undef=0. Navegador aislado: ambas entradas, selección y reinicio de hora al cambiar día, horas ocupadas/propias bloqueadas, solicitud de prueba y cambio de hora hasta Mis servicios, foco contenido/tecla Escape. 390×844, 320×420 y 1280×900 sin desbordamiento. Teclado visual simulado: la nota queda 12 px sobre el pie, también con offsetTop=90; no equivale a verificar un iPhone físico.

## Mis servicios: estados y citas legibles · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/servicios-estados-visuales`, desde `75f106d`.
**Alcance:** MyServices.jsx y CSS. Estado, identidad y fecha/hora diferenciados; filtros con recuentos y acciones con espacio suficiente. Mantener filtros, orden, cancelación, cambio de hora, valoración y destinos. Sin cambios de servidor ni de estado compartido.
**Pruebas:** build, matching 255/255 y smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0. Navegador aislado a 390×844, 320×720 y 1280×900: cinco estados, valorado, reprogramada, textos largos, filtros y recuentos, vacíos, teclado, confirmación de cancelación sin envío, apertura de valoración y agenda. Sin desbordamiento horizontal; botones de al menos 44 px.

## Seguidos sincronizados · Codex

**Estado:** implementado y verificado localmente. **Rama:** `codex/seguidos-sincronizados`, desde `09bf282`.
**Autorización:** Sergio responde «Sigue» a la propuesta de corregir la lista y el contador al dejar de seguir. Excepción funcional al reparto habitual.
**Alcance:** UserContext, utilidad de seguimiento, Siguiendo y filtro de Feed. Un único estado compatible con favoritos, migración de preferencias antiguas, lista vacía persistente y comparación de identificadores numéricos/texto. Sin cambios en Supabase.
**Pruebas:** `npm run test:following` (15 comprobaciones), build, matching 255/255 y smoke 8×2 + 120×4. Lint sin diagnósticos nuevos; no-undef=0. Navegador aislado: retirar uno actualiza lista y contador del perfil; retirar todos y recargar mantiene vacío; migrar favoritos antiguos deduplica IDs; lista vacía tiene prioridad sobre favoritos obsoletos; altas/alternancias consecutivas no pierden cambios; cierre de sesión limpia ambas claves.
**Contrato para Claude:** `favorites` es alias de `following`, no un segundo estado. Usar `follow`, `unfollow`, `toggleFollow` e `isFollowing`; no escribir listas independientes. La persistencia sigue siendo local al dispositivo.

## Siguiendo: fotos y acciones claras · Codex

**Estado:** diseño implementado y verificado. **Rama:** `codex/siguiendo-fotos`, desde `235598a`.
**Alcance:** Siguiendo.jsx y CSS. Retratos mayores, valoración/zona/tarifa legibles y controles separados para abrir el perfil y seguir/dejar de seguir. Mantener favoritos, demo, datos y destinos.
**Incidencia previa detectada (resuelta en la tarea de sincronización superior):** Siguiendo filtra por `favorites`, pero los controles `follow/unfollow` actualizan `following`. Al dejar de seguir cambia el botón, pero la tarjeta permanece durante la sesión. Comprobado localmente; ambos caminos ya estaban en main. Esta entrega no modifica UserContext ni migra estado. Revisar sincronización y comportamiento demo en una tarea funcional separada.

## Lista de conversaciones más legible · Codex

**Estado:** implementado y verificado. **Rama:** `codex/lista-conversaciones`, desde `2d4d6de`.
**Alcance:** Chats.jsx y CSS. Más presencia de fotos, vista previa en dos líneas, nombre/fecha sin competir y avisos sin leer claros. Mantener búsqueda, orden, lectura, datos y navegación.

## Cabecera de chat legible en móvil · Codex

**Estado:** implementado y verificado. **Rama:** `codex/chat-cabecera-movil`, desde `9599b60`.
**Alcance:** Chat.jsx y CSS. Dos filas en móvil, fotografía mayor, texto legible y acceso al perfil como botón; cabecera en el flujo para reservar su altura real. Conservar acciones de contratación/valoración, conversación y teclado.

## Botones secundarios coherentes · Codex

**Estado:** implementado y verificado. **Rama:** `codex/botones-secundarios`, desde `054698b`.
**Alcance:** tokens de borde y fondo, primitiva Button y acciones secundarias locales de perfil, profesionales, chat, carta, seguidos, servicios y página no encontrada. Revisar contraste y texto adaptable; conservar destinos y funciones.

## Botones informativos del perfil · Codex

**Estado:** implementado y verificado. **Rama:** `codex/botones-perfil-contraste`, desde `6ae1d19`.
**Alcance:** presentación de los dos botones de acceso profesional e información para profesionales en Profile.jsx. Borde lila visible, fondo suave, espacio entre acciones y texto adaptable en móvil; mismos destinos. Comprobado en navegador a 390 y 320 px, ambos destinos de navegación, build, matching 255/255 y smoke. Lint sin nuevos diagnósticos y no-undef=0.

## Corrección del desplazamiento de Safari · Codex

**Estado:** implementado y verificado con reproducción del pan completo; pendiente confirmar en iPhone físico. **Rama:** `codex/safari-teclado-desplazamiento`, desde `d0596ee`.
**Alcance:** utilidad compartida de teclado, posición de ventana y menú, regresión de viewport desplazado. La captura real posterior a PR #96 muestra el contenido fuera de pantalla. Reproducir el pan visual completo, conservar scroll interno nativo y altura de contenido; no tocar funcionalidades ni Supabase.

## Teclado sin comprimir y desplazamiento natural · Codex

**Estado:** implementado y verificado; detalle en `docs/teclado-movil.md`. **Rama:** `codex/teclado-sin-comprimir`, desde `cd1b22a`.
**Alcance:** contenedor compartido de la app, utilidad de teclado, retirar ajustes contradictorios de Inicio/carta y adaptar alturas de pantallas de escritura. Mantener el tamaño previo al teclado y desplazar mediante scroll nativo, sin perseguir visualViewport.offsetTop ni interceptar gestos. Pruebas con viewport visual simulado, además de escritorio.

## Espacio entre sugerencias y escritura del chat · Codex

**Estado:** implementado y verificado. **Rama:** `codex/chat-sugerencias-espacio`, desde `94c010b`.
**Alcance:** estructura visual de Chat.jsx y CSS. Reproducido a 390×844: sugerencias hasta y=770, entrada desde y=768 (solapan 2 px). Sugerencias y entrada comparten ahora un pie en el flujo con separación de 18 px; etiquetas con huecos de 10 px entre filas y 12 px entre columnas. La conversación ocupa el espacio restante, sin reservas fijas que dejen mensajes bajo los controles. Se conservan los manejadores.
**Pruebas:** navegador a 390×844 (dos filas), 320×420 (tres filas) y 1280×900; separación medida de 18 px en todos, documento sin scroll exterior. Sugerencia pulsada y texto llegado al chat solo en servidor local aislado; consola sin errores. Build, matching 255/255, smoke 8×2 pantallas + 120×4 tarjetas; lint sin nuevos diagnósticos y no-undef=0 (107 errores y 6 avisos previos).

## Envío de carta visible sobre el menú · Codex

**Estado:** implementado y verificado. **Rama:** `codex/carta-boton-visible`, desde `cbcea61`.
**Alcance:** IntroLetter.jsx y su CSS. Reproducido en 390×844: botón entre y=782,5 y 830, menú entre 772 y 834. La página reserva `--nav-h`; botón con 14 px de separación del menú. Altura y desplazamiento del visualViewport adaptan carta y menú al teclado, con limpieza al salir. Editor de 16 px para evitar zoom al enfocar en iOS; botón limitado al ancho de lectura en ordenador. Sin cambiar el envío.
**Verificación:** a 390×844 botón hasta y=758 y menú desde 772; a 390×420 botón hasta 334 y menú desde 348. Editor y envío probados únicamente en servidor local aislado: el texto editado llega al chat y se limpian los ajustes del teclado. A 1280×900 no se reserva navegación móvil. Build, matching 255/255 y smoke 8×2 + censo 120×4 pasan; lint sin nuevos diagnósticos y no-undef=0 (deuda previa: 107 errores y 6 avisos). Pruebas de altura reducida en navegador; no equivalen a un teclado físico de iPhone.

## Tarjetas neutras y fotos protagonistas · Codex

**Estado:** implementado y verificado. **Rama:** `codex/tarjetas-foto-protagonista`, desde `2aaea8c`.
**Alcance:** CSS de HelperCardTall y documentación. Sergio pide que la tarjeta principal use la superficie neutra de las secundarias, con fotos mayores en todas. Conservar altura compacta, alternativas juntas y funciones.
**Entrega:** principal con fondo blanco, borde y contacto como las secundarias. Retrato principal de 76 × 88 px (antes 48 × 48); secundarios de 60 × 68 (antes 38 × 38), adaptados a pantallas pequeñas y teclado. Sin aumentar alturas de tarjeta.
**Pruebas:** build, matching 255/255, smoke 8 × 2 pantallas y 120 × 4 tarjetas; paginación 200 casos. Lint sin nuevos diagnósticos y no-undef=0. Navegador a 390 × 844, 320 × 568, 390 × 380 y 1280 × 900: fotos mayores, alternativas iguales, sin scroll ni errores de consola.

## Más cerca con ubicación automática · Codex

**Estado:** implementado y verificado; ver `docs/ubicacion-automatica.md`. **Rama:** `codex/mas-cerca-ubicacion`, desde `d806436`.
**Encargo explícito de Sergio:** al pulsar Más cerca, solicitar ubicación del dispositivo y ordenar sin preguntar el barrio. Excepción funcional al reparto habitual. Archivos: Home.jsx, nueva utilidad de ubicación, formato de distancia, pruebas y documentación. No cambia matching.js ni Supabase.

## Contraste y alternativas juntas · Codex

**Estado:** implementado y verificado; detalle en `docs/alternativas-juntas.md`. **Rama:** `codex/alternativas-juntas`, desde `32cbf93`.
**Alcance:** Home, ResponseScreen y variante visual de HelperCardTall. Quitar navegación sin destino en la bienvenida, aumentar ligeramente el contraste del cristal y agrupar alternativas en un único paso. Sin cambios en búsqueda ni datos.


## Búsqueda por pantallas sin scroll · Codex

**Estado:** implementado y verificado; detalle en `docs/busqueda-pantalla.md`. **Rama:** `codex/busqueda-pantalla`, desde `3d32a74`.
**Alcance:** Home, nuevo componente de presentación paginada, resumen de RecordatorioCita, adaptación al teclado, CSS y documentación. Sergio sustituye el historial visible de chat por una burbuja que cambia con cada respuesta, conservando escritura y navegación. Se conservan comprensión, datos y manejadores de Claude.


## Resultados compactos e historial · Codex

**Estado:** implementado y verificado; detalle en `docs/resultados-compactos.md`. **Rama:** `codex/resultados-compactos`, desde `17214cd`.
**Alcance:** presentación de resultados y ajustes de Inicio; variante compacta de HelperCardTall y CSS; presentación de MyServices; sustitución de emojis decorativos en PostCard, ObraComposer, Chats, Chat, IntroLetter, HelperProfile y ErrorBoundary por iconos y limpieza de texto decorativo en plantillas de chat/feed; smoke y documentación. Se conservan todos los manejadores, textos de comprensión, ordenación y datos de Claude. Preferencia de Sergio: iconos de trazo de Nüra, sin emojis decorativos en la interfaz.


## Ficha profesional, citas y valoraciones · Codex

**Estado:** implementado y verificado; detalle en `docs/ficha-trayectoria.md`. **Rama:** `codex/ficha-trayectoria`, desde `d92af78`.
**Alcance:** trayectoria/formación en bloque propio antes de Su obra; revisión visual del selector de citas y valoración. Archivos: `HelperProfile.jsx` y su CSS, `ElegirCita.jsx` y nuevo CSS, `RatingModal.jsx` y su CSS. Sin cambios en búsquedas, permisos ni envío de datos.

## Diseño de detalle · Codex · integrado en PR #87

**Estado:** implementado y verificado, desde `0884d7f`; integración y despliegue comprobables en GitHub. **Rama:** `codex/diseno-detalle`.
**Alcance:** quitar el eslogan repetido de Inicio y navegación; evolucionar superficies, perfiles, tarjetas, formularios y movimiento. CSS de páginas/componentes, `design-system.css`, y cambios exclusivamente de presentación en Home, Explore, HelperCardTall, UI, Login, Legal, PostCard y ObraComposer. Conservar la búsqueda que Claude está desarrollando. Detalle: `docs/diseno-detalle.md`.

## Diseño integral · Codex · integrado

Primera entrega integrada mediante PR #65 y publicada en Vercel el 2026-09-26. La nueva iteración se registra arriba.

**Alcance:** presentación de todas las rutas actuales, empezando por Inicio.
**Rama:** `codex/diseno-integral`.
**Entrega y comprobaciones:** `docs/diseno-integral.md`; el commit y la integración reales se comprueban en GitHub.

**Áreas de diseño:** `src/design-system.css`, CSS de páginas y componentes, estructura visual de `Home`, `Explore`, `Chats`, `Profile`, formularios, marca, navegación, tarjetas y `UserAvatar`.

Mientras esta tarea siga sin integrar, Claude no debe editar esos mismos archivos. Tras integrarla, empezar desde el `main` actualizado y preservar sus clases, tokens y estructura al añadir funciones.

## Funcionalidades · Claude

La siguiente funcionalidad la decide Sergio con Claude. Preferir trabajo independiente en datos, servicios y lógica. Si necesita tocar una pantalla activa de Codex, coordinar el archivo antes de editar; una rama distinta por sí sola no evita conflictos.

### Última tarea integrada · El profesional sin correo en su ficha: no confundirle

Desde 2026-09-30. Rama `claude/funny-clarke-e6m64r`. Quien se dio de alta con un teléfono no puede vincular su acceso (se comprueba por correo). Hoy «Responder» le pide «el mismo correo que diste» y, si crea el acceso igualmente, Nüra le deja dentro como cliente (bandeja vacía). Ahora el acceso que se crea desde un mensaje recibido se marca como de profesional: sin ficha con ese correo, no entra como cliente y se le explica qué pasa. La vinculación por teléfono queda como decisión de Sergio. Archivos: `src/pages/Responder.jsx` y `src/components/BandejaProfesional.jsx` (texto y enlace), `src/pages/Entrar.jsx`, `src/pages/Profile.jsx` (solo lógica), `scripts/recorrido-real.mjs`. Comprobado: build, recorrido, recorrido-real (con el código anterior fallaba), smoke, test:vista, test:chat-scroll, test:busqueda 100%, test:matching 257, test:avisos 204; lint igual que en `main`.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
