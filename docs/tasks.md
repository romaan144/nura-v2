# Trabajo compartido

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

### Tarea activa · La búsqueda entiende el OFICIO, no solo la categoría

**Responsable:** Claude. **Rama:** `claude/funny-clarke-e6m64r`, desde `main` (5790adc).
**Motivo:** prioridad del fundador. «reparar altavoces 2.1» devolvió un fontanero: la búsqueda elige una categoría amplia («técnico» mezcla fontaneros, cerrajeros, fotógrafos, SEO e informáticos) y dentro gana el mejor valorado.
**Objetivo:** entender qué oficio concreto hace falta (electricista, informático, reparación de electrónica…), buscarlo por especialidad en toda la base (no por categoría) y, si no hay nadie de ese oficio, decirlo y ofrecer lo más parecido. Medido con una batería amplia de frases reales.
**Archivos previstos:** nuevo `src/data/oficios.js`, `src/utils/matching.js`, `src/utils/supabase.js`, `src/pages/Home.jsx` (solo el texto de los mensajes de resultado; sin cambiar la presentación), nuevos `scripts/test-busqueda.mjs` y `scripts/fixtures/profesionales.json`, `package.json` (un guion), documentación.

### Última tarea integrada · El servidor lee la ciudad entre comas de la zona

Integrada el 2026-09-26 (ver `docs/changelog.md`, 2026-10-15). Tocó `supabase/functions/helpers-write/index.ts` (v24) y `scripts/test-avisos.mjs`. Esos archivos quedan libres.

**Deuda existente observada:** lint general con variables sin uso, bloques vacíos y advertencias de hooks. Se conserva fuera del alcance visual; el detalle se obtiene ejecutando `npm run lint`. No confundir una compilación correcta con lint completamente limpio.

## Rutina de cada tarea

1. Actualizar información de `origin/main`; comprobar estado local y no sobrescribir cambios ajenos.
2. Anotar responsable, objetivo, rama y archivos previstos antes de tocar archivos compartidos.
3. Hacer un cambio acotado y probarlo.
4. Antes de integrar, comprobar si `main` cambió, incorporar esos cambios y repetir las pruebas afectadas.
5. Registrar qué cambió y cómo se comprobó. Para diseño, publicar después de las pruebas sin pedir aprobación estética a Sergio ni a Claude.
6. La siguiente herramienta lee los cambios al iniciar su turno. Ninguna afirma que ha avisado automáticamente a la otra.
