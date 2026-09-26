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
