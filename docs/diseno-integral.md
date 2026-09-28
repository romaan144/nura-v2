# Nüra · diseño compartido de la aplicación

Actualizado el 26 de septiembre de 2026. Responsable: Codex.
Base inicial: `a436ece`; integrada posteriormente con `cb6d6c1` de `main`, incluyendo agenda, bloqueos, recordatorios, mensajes sin conexión y validaciones nuevas de Claude. Se conserva la entrada directa a Inicio decidida por Sergio.

## Dirección visual

Papel claro, tinta oscura y morado como acento. La marca se reconoce por la tipografía, el espacio y la forma de los controles, no por animaciones constantes. Las fotos de las personas se conservan; quien no tiene foto de cuenta aparece con sus iniciales.

- **Valores comunes:** `src/design-system.css`, cargado después de `src/index.css`. Extiende los tokens existentes; no renombrar los que usan las pantallas.
- **Textos:** Inter para controles y lectura; Plus Jakarta Sans para títulos e identidad. Fuentes ya incluidas en el proyecto, sin servicio externo nuevo.
- **Superficies:** fondo claro, tarjetas blancas con borde fino, radios compartidos, sombras breves. Morado para acciones y selección; colores de estado conservan su significado.
- **Movimiento:** transiciones cortas de foco, pulsación y elevación. Se respeta `prefers-reduced-motion`, incluyendo las animaciones heredadas.
- **Móvil:** controles principales de 44 px o más, campos de 16 px, reserva para la navegación inferior y desplazamiento propio de cada pantalla.
- **Ordenador:** barra lateral visible, contenido con ancho de lectura y controles fijos contenidos en el área de la app. El registro ocupa el ancho completo.

## Pantallas incluidas

| Pantalla | Presentación |
| --- | --- |
| Inicio | Saludo breve, necesidad como protagonista, buscador en la bienvenida y decisiones iniciales en tarjetas. Al conversar, el campo vuelve a su posición inferior. |
| Explorar | Título y explicación, buscador común, catálogo adaptable y filtros con área táctil. |
| Perfil propio | Identidad con foto o iniciales, secciones y acciones agrupadas, tarjetas y listas coherentes. Incluye invitado y profesional. |
| Ficha de profesional | Identidad, biografía y pruebas legibles; acción de contacto fija con espacio reservado. |
| Chats y conversación | Cabecera, búsqueda, filas, burbujas y campo de mensaje con el mismo lenguaje visual. |
| Servicios y Siguiendo | Títulos, tarjetas y filtros; ancho limitado en ordenador. |
| Comunidad | Columna de lectura, publicaciones compartidas y controles coherentes. |
| Presentación | Carta editable y datos del profesional con superficies comunes. |
| Acceso, crear acceso y recuperar contraseña | Tarjetas de formulario, foco y estados; se conserva cada flujo existente. |
| Registro profesional | Conversación y controles comunes; progreso y lógica existentes. |
| Página para profesionales | Jerarquía editorial, pasos en cuadrícula en ordenador y llamada a la acción. |
| Privacidad y términos | Ancho y tipografía comunes. Texto legal sin cambios. |
| Responder, baja de aviso y página inexistente | Superficies y estados coherentes. Sin cambios en permisos ni tokens. |

Las pantallas de bienvenida retiradas no se reactivan. Los modales y piezas reutilizadas heredan los tokens comunes; no se han inventado citas, cifras ni controles sin función.

## Qué se conserva

Rutas, datos, motor de búsqueda, condiciones de acceso, llamadas al servidor, claves de conversación, estados y manejadores existentes. El código visual de `Home.jsx` cambia la posición del mismo campo, no su lógica de búsqueda. Las tarjetas de recomendación se pueden abrir también con teclado.

Los datos ficticios de revisión viven fuera del repositorio de la app, en servidores locales aislados. No se añaden a la compilación ni cambian las variables de Vercel. No se ha consultado ni modificado la base de datos de producción.

## Verificación

- Compilación de producción.
- Suite de búsqueda tras integrar Claude: 203/203.
- Suite de avisos con servidor y base de datos ficticios: 162/162. Suite de vista previa al compartir: correcta.
- Smoke: 8 pantallas × 2 escenarios y 120 profesionales × 2 tamaños.
- Recorridos en navegador a 390 px y 1280 px, con comprobación adicional a 360 px. Búsqueda → ficha; edición del nombre; bandeja → chat y mensaje simulado; rutas secundarias y estados vacíos.
- Tras integrar Claude, se repite el recorrido de las pantallas afectadas y la selección de horarios y bloqueos en «Editar mi ficha», sin guardar cambios reales.
- Revisión adicional con demo desactivada y servidor ficticio: Inicio, acceso, catálogo, chats vacíos y perfil invitado/profesional.
- No se prueba un restablecimiento de contraseña real, un token real de respuesta ni la entrega de correos: requieren credenciales o acciones ajenas a un rediseño.
- El lint general de `cb6d6c1` tiene 113 errores y 6 avisos; esta entrega deja 112 errores y 6 avisos, sin hallazgos nuevos. Se corrige el entorno Node de `api/` en ESLint (sin modificar esa API); los demás hallazgos heredados se registran para Claude. No se desactivan reglas para ocultarlos. La puerta `no-undef` queda a cero.

## Continuidad con Claude

Leer `docs/ai-collaboration.md` y `docs/tasks.md` antes de trabajar. Codex mantiene la presentación; Claude mantiene lógica, datos y funcionalidades. Los archivos JSX pueden contener ambas cosas: repartirse responsabilidades no los convierte en archivos independientes. Si una tarea necesita el mismo archivo activo, se realiza después de integrar y actualizar la otra rama, o se acuerda una separación real.

La autorización de Sergio para integrar y publicar diseño está dada. No se añade una aprobación estética previa; se mantienen pruebas técnicas y comprobación de lo publicado. GitHub es el registro compartido, no un canal de aviso instantáneo: la otra herramienta conoce los cambios cuando actualiza y lee el repositorio.

## Evolución · 2026-09-27

Primera entrega integrada en PR #65. La segunda iteración se documenta en `diseno-detalle.md`; el código actual de `src/design-system.css` y los módulos es la referencia vigente.

## Actualización de Inicio · 2026-09-27

La instrucción posterior de Sergio sustituye la presentación de Inicio descrita arriba: una burbuja de respuesta que ocupa el espacio disponible, sin scroll ni historial visible. Campo de escritura y menú debajo en móvil y escritorio. El contenido que no cabe se recorre con botones, sin recortarlo. Ver `docs/busqueda-pantalla.md`. El resto de pantallas conserva su navegación habitual.

## Acciones secundarias · 2026-09-27

Los botones secundarios usan `--action-border` (#C7B2DF) y `--action-surface` (#F7F3FC), separados del borde tenue de las tarjetas. La primitiva Button y las acciones locales de carta, servicios, profesionales, seguidos y error comparten el contorno. Las sugerencias del chat refuerzan solo el borde para mantener su superficie blanca. Botones de texto ghost sin sombra y con subrayado: no simular una cápsula sin borde. Texto largo con altura flexible y línea 1.4; controles secundarios de al menos 44 px, 48 en Button. Mantener los estados y manejadores existentes.

Verificación: navegador a 390×844, 320×720 y escritorio; ficha/disponibilidad y cierre de solicitud, carta, acciones de citas y confirmación de conservarlas, pie para profesionales. Build, matching 255/255, smoke 8×2 + 120×4; lint sin nuevos diagnósticos y no-undef=0. Las comprobaciones de comportamiento usan datos locales aislados.

## Cabecera del chat · 2026-09-27

En móvil la identidad ocupa la primera fila y valoración/verificación/acción la segunda. Foto de 48 px (antes 30), nombre y especialidad con espacio y ajuste de texto. El acceso al perfil es un botón con nombre accesible. En ordenador se conserva una sola fila. La cabecera participa en el flujo: la conversación reserva su altura real, sin una separación fija que pueda solaparse. Se conservan estados, contratación, valoración y envío.

Comprobado en 320×720, 320×568, 390×844 y 1280×900. Antes: especialidad invisible y nombre apretado a 320 px. Después: textos visibles, cero desbordamientos de botones, cabecera hasta y=140 y aviso de chat desde y=156; Próxima visita cabe en 320 px. Apertura/cierre de contratación y acceso al perfil verificados en servidor local. Simulación del teclado/pan Safari: campo y=427–449 dentro de 484 px visibles, lienzo 844 px. No equivale a una prueba física de iPhone. Build, matching 255/255, smoke 8×2 + 120×4; lint sin nuevos diagnósticos y no-undef=0.

## Lista de conversaciones · 2026-09-27

Fotos de 64×72 px (56×64 en móviles menores de 360), nombre y vista previa de hasta dos líneas. Fecha y contador sin leer tienen espacio propio y ya no estrechan la vista previa. Tarjeta sin leer con borde lila y fondo tenue; contador con nombre accesible. Introducción más breve para mostrar antes la lista. Altura regular de 132 px en móvil y 116 en escritorio para los ejemplos sin datos adicionales; las etiquetas de contexto pueden ampliar la tarjeta. Se conservan filtro, orden, markRead, historiales, datos y destino.

Verificación: 390×844, 320×720 y 1280×900, sin desbordamientos; búsqueda por nombre, búsqueda sin coincidencias, apertura de Carlos y retorno con historial de prueba; lista vacía sin demo. Sin envíos reales. Build, matching 255/255, smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0.

## Siguiendo · 2026-09-27

Retratos de 80×104 px, 68×92 en móviles estrechos, y bloques separados para nombre, especialidad, valoración/zona y tarifa. El perfil se abre desde un botón nativo con indicación Ver perfil; seguir/dejar de seguir es un botón independiente de 44 px con etiqueta y aria-pressed. Evita controles interactivos anidados y que Enter/Espacio en seguimiento abran el perfil. Fondo blanco, borde definido, una columna móvil y dos en escritorio. Se conservan datos y handlers.

Verificado en 390×844, 320×720 y 1280×900: tarjetas sin desbordamiento, alturas iguales en los ejemplos, acceso al perfil con Enter, cambio de estado de seguimiento sin navegación, y vacío sin demo. La desincronización preexistente entre favorites/following está anotada en tasks; no se presenta como corregida. Build, matching 255/255, smoke 8×2 + 120×4; lint sin diagnósticos nuevos y no-undef=0. Pruebas de interacción solo locales.


## Mis servicios: estados y fecha de la cita · 2026-09-27

Tarjetas blancas con una banda discreta de estado: ámbar por confirmar, verde confirmada, gris/lila completada y rojo cancelada. Siempre se incluye texto e icono; el color no es la única señal. La identidad tiene retrato de 60×70 px, nombre y acceso al perfil; día/hora viven en un bloque independiente. Las notas y avisos se leen completos fuera del botón del perfil.

Filtros Todos/Próximos/Completados con recuento y `aria-pressed`. A 480 px o menos, todos los recuentos se sitúan debajo del texto de manera uniforme. Acciones de 46 px como mínimo, separación de 10 px y confirmación de cancelación dentro de su propio panel. Una sola reserva para la navegación inferior; ancho de lectura en escritorio. Se consolida el CSS local para evitar capas de reglas contradictorias.

Verificado en navegador aislado a 390×844, 320×720 y 1280×900, con estados pendientes, confirmados, completados, cancelados, rechazados, valorados, reprogramados y vacíos. Textos largos sin recorte ni desbordamiento. Filtros/teclado, cancelar y mantener, valoración y agenda conservan sus destinos. No se envían solicitudes ni valoraciones reales. Build, matching 255/255 y smoke pasan; lint sin nuevos diagnósticos y no-undef=0.


## Solicitud de cita compartida · 2026-09-27

`CitaModal` da la misma presentación a la ficha y al chat sin unificar sus controladores de envío. Cabecera y pie permanecen visibles; el cuerpo se desplaza por dentro. Profesional con foto/inicial, precio, selección en dos pasos y nota opcional con etiqueta. Antes de enviar se ve el día completo y la hora; después se indica que falta confirmación del profesional.

ElegirCita conserva sus cálculos de disponibilidad, pero presenta días con mes y fecha accesible completa, selección con marca e indicador, franjas uniformes y horas ocupadas/propias diferenciadas. El foco queda en la ventana, Escape la cierra y se devuelve el foco anterior cuando existe. La ventana usa el viewport visual compartido: al reducirse por teclado, solo ajusta el scroll de su nota, sin modificar el scroll de la app.

Probado en navegador aislado a 390×844, 320×420 y 1280×900; solicitud y cambio de hora llegan a Mis servicios en demo. Bloqueos, reinicio de hora, teclado, Escape y recorrido de foco comprobados. Con altura visual simulada de 484 px: nota termina en y=349, pie empieza en 361; con pan de 90 px, ambos se desplazan 90 px. Pendiente la comprobación física en iPhone. Build, matching 255/255 y smoke correctos; lint sin nuevos diagnósticos, no-undef=0.


## Valorar al profesional · 2026-09-27

Preguntas en bloques independientes, Sí/No de 48 px, cualidades en dos columnas de altura uniforme y contador de máximo tres. Cinco estrellas con cifra propia, área táctil de 66 px de alto y estado seleccionado de contraste dorado. El grupo usa botones nativos con aria-pressed, compatible con volver a tocar para deseleccionar. Comentario con etiqueta, contador de 500 caracteres y consentimiento de publicación separado/desmarcado inicialmente.

Cabecera y pie permanecen visibles; el cuerpo tiene scroll propio. Se extrae el comportamiento visual de CitaModal a `useModalSheet`, incluyendo el checkbox en el recorrido de foco. No se cambian estados de negocio, payload, analítica, callbacks, requisitos de envío ni tiempo de cierre. Los avatares sin fotografía usan iniciales.

Verificado a 390×844, 320×420 y 1280×900, con nombre largo, máximo de cualidades, selección/deselección de estrellas, consentimiento, contador, envío local, Escape y foco contenido. Con teclado simulado de 484 px, el comentario termina 12 px sobre el pie; se conserva con pan de 90 px. Regresión de CitaModal: día/hora, nota, foco y cierre correctos. Pendiente comprobación física de iPhone. Build, matching 255/255 y smoke pasan; lint sin nuevos diagnósticos, no-undef=0. Sin datos ni envíos de prueba en producción.


## Explorar: filtros y tarjetas · 2026-09-27

Categorías en filas de 112 px en móvil, con icono propio y acceso de flecha; dos columnas a partir de 1000 px. Cabecera contextual al entrar en una categoría. Especialidades en selector nativo etiquetado, preferencias de 44 px con aria-pressed y botón Quitar filtros. Recuento anunciado; el vacío filtrado permite recuperar la categoría completa. Los algoritmos y opciones son los existentes.

HelperCard pasa de estilos inline a su módulo CSS consolidado. Retrato de 80×104 px (68×100 en móvil estrecho), nombre completo en el dato y nombre accesible, especialidad de hasta dos líneas, valoración/zona y tarifa. Se reservan los mismos espacios para evitar tamaños dispares: las tarjetas probadas miden 186–187 px. Textos largos se abrevian visualmente; el perfil conserva el detalle. Fotografía conservada e inicial si falta, sin emojis añadidos. El botón de perfil y Escribir son hermanos nativos y conservan los manejadores. Feed y la vista previa inerte del profesional reutilizan el componente.

Navegador aislado a 390×844, 320×720 y 1280×900: categorías, selección de especialidad, tres preferencias combinadas, quitar filtros, vacío y catálogo sin demo. Fixture externa de 34 profesionales para paginación, texto largo, tarifa larga y ausencia de datos. Enter abre el perfil; Escribir abre chat o login según sesión. Feed y Profile comprobados sin desbordamiento. Build, matching 255/255 y smoke pasan; lint sin diagnósticos nuevos, no-undef=0. Sin escrituras ni datos de prueba en producción.


## Acceso y recuperación · 2026-09-27

`Access.module.css` reúne las superficies de Login, Entrar y Restablecer. Tarjeta blanca de hasta 460 px sobre fondo de marca, iconos de trazo, etiquetas de 13 px y campos de 16 px/52 px de alto. Botones principales y alternativos definidos, áreas de 44 px como mínimo y foco visible. Errores en panel rojizo; confirmaciones en verde, con roles alert/status conservados. La opción de crear acceso queda separada por una línea y un botón con borde.

`PasswordField` comparte solo la visibilidad de la contraseña; no cambia valores, autocompletado, validación ni guardado. El código de demostración conserva un input único con cuatro casillas decorativas y foco visible. La demo explica que no envía SMS; fuera de demo sigue pidiendo nombre y ofrece el acceso por correo. No se cambia el sistema común de teclado.

Verificado en navegador aislado a 390×844, 320×568 y 1280×900, sin desbordamiento horizontal: mostrar/ocultar, mínimo de caracteres, error de acceso, sugerencia de dominio, confirmación de correo, enlace ausente y guardado simulado con error/éxito. Recorrido completo de demo y entrada sin demo conservados. Con teclado simulado a 484 px y pan de 90 px, el campo queda 16 px por encima del menú. Pendiente dispositivo físico; los estados de autenticación usan un módulo ficticio externo al repositorio. No se han enviado correos ni cambiado cuentas reales. Build, matching 255/255 y smoke pasan; lint sin nuevos diagnósticos y no-undef=0.


## Su obra dentro de la ficha · 2026-09-27

La sección mantiene su lugar después de Trayectoria y formación, pero deja el ancho a cada publicación sin otra tarjeta alrededor. Cabecera breve, una publicación inicial y botón definido para ver todas/recoger, con aria-expanded y aria-controls. Se conserva el conjunto y límite de publicaciones; no se vuelve a añadir Comunidad al menú.

PostCard comparte un módulo CSS: autor de 44×48 px, nombre/rol/fecha diferenciados, título legible y texto completo que conserva párrafos. Resultado en bloque lila con etiqueta, sin presentarlo como validado. El sello de confirmación solo se muestra con post.confirmado. Acciones Me sirve y Comentarios de al menos 44 px, selección visible y contadores claros. Hilo separado, comentarios con espacio propio, respuestas rápidas identificadas como envío directo y campo de 16 px con botón de 48 px. Autor sin helperId deja de ser un botón sin acción.

Verificado en navegador local a 390×844, 320×720 y 1280×900: reacciones reversibles, comentarios manuales y rápidos, hilo vacío, entrada sin sesión, desplegar/recoger cuatro publicaciones y versiones antiguas sin resultado/título. Fixture externa de texto largo, párrafos y palabra sin espacios: cero desbordamiento horizontal. Teclado simulado: campo a 16 px del menú, también con pan de 90 px; no equivale a iPhone físico. Profile y Feed conservan la pieza compartida. Build, matching 255/255 y smoke pasan; lint sin nuevos diagnósticos y no-undef=0. No hay escrituras de prueba en producción.

## Avisos de búsqueda · 2026-09-28

La ventana agrupa necesidad y zona en una tarjeta, canales en controles independientes y privacidad en un bloque breve. Cabecera y confirmación siempre visibles; el cuerpo se desplaza. El pie resume lo elegido, incluido solo perfil. Se mantienen las selecciones existentes, el permiso de notificaciones se pide únicamente al confirmar y el acceso por correo cierra la ventana antes de navegar.


## Navegación de cristal · 2026-09-28

Cápsula única de 62 px, máximo 340 px de ancho y margen seguro inferior. Cristal claro de papel/menta, borde continuo y reflejo interior; la selección es una lente translúcida lila que se desplaza en 360 ms. Iconos y etiquetas mantienen tinta legible, con violeta en la pestaña activa; la selección también se expresa por forma y peso. Los botones conservan 48 px de área táctil y foco visible. La lente es aria-hidden y no intercepta eventos.

No se altera el contrato de teclado ni la navegación de escritorio. Fuera de las tres rutas principales, la lente se oculta. Sin desenfoque se usa una superficie opaca; movimiento reducido elimina transiciones, y mayor contraste/reducir transparencia refuerzan el material. Referencia: vídeo de Tinder aportado por Sergio y materiales Liquid Glass de Apple (https://developer.apple.com/design/human-interface-guidelines/materials). Esta es una adaptación web; al desarrollar una app iOS nativa se valorará la barra del sistema vigente.
