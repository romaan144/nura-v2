# NÜRA 2 — SISTEMA DE DISEÑO

> Identidad visual y reglas de diseño. La fuente de verdad de los **valores**
> (colores, tamaños, tiempos) es el código: `src/index.css` y
> `src/components/ui/index.jsx`. Este documento fija nombres, reglas y criterios —
> no duplica literales. Última actualización: 2026-07-04

**La Regla Permanente de Diseño vive en `manifesto.md` y gobierna todo lo que
sigue:** consistencia → claridad → rapidez de comprensión → facilidad → confianza.
Sistemas, no componentes.

---

## 1. Tokens

**Color** (nombres canónicos; valores en `src/index.css`):
- `--purple` — color de marca (verificado en código: `#7B2FFF`), voz de Nüra y
  acciones primarias. Tintes `--purple-10` / `--purple-20` para fondos y bordes
  suaves de marca.
- `--green-dot` — **el único verde de "activo/disponible" de toda la app**
  (verificado: `#10B981`). Prohibido reintroducir un segundo verde de actividad.
- `--green` — éxito/positivo (confirmaciones, respuesta rápida).
- Tintas: `--ink`, `--ink-secondary`, `--ink-tertiary`, `--ink-disabled`,
  `--ink-border`. Fondo: `--paper`.
- Warning/ámbar: encapsulado en `Badge variant="warning"` — no usar sueltos.

**Tipografía:** escala de sistema en tokens `--text-*` para toda la UI funcional,
más **`--font-voice`** (Fraunces, serif cálida) para La Voz Tipográfica (§3).

**Forma y elevación:** `--radius-md` / `--radius-xl` / `--radius-full`;
`--shadow-sm` / `--shadow-md` / `--shadow-color`.

[PENDIENTE] Formalizar escala de espaciado como tokens (hoy: valores coherentes
por convención).

### La Voz Moderna (2026-07-04 — corrección de dirección del fundador)

La Voz **no es una serif**: es la sans del sistema con peso alto (700) y
tracking apretado en display. **Prohibidas las serifas y las cursivas** en
toda la app — moderna y futurista, jamás "de libro". El token
`--font-voice` gobierna todas las sedes.

### El Alma Visible (2026-07-04)

El degradado del logo vive también en el producto: **auroras** (lavados
radiales rojo→morado→cian a 5-10%) sobre el papel de las superficies clave
(Home, hero del profesional, Login). La **Voz sube a display**: los nombres
de las personas y los títulos de pantalla, en Fraunces grande. **El hilo**:
línea degradada de 2px que firma los momentos importantes (la Recomendación,
la Comunidad). **El mapa cerrado**: Auroras = {Home, hero del profesional, Login, **cabecera de Comunidad**, la
Carta (interior, ≤6%)} · Hilo = {la Recomendación, el Muro, el Gate,
ConfirmModal} · Voz-display = {nombres de personas, título del Muro, frase-portada de Explorar}.
Explorar queda papel a propósito: el respiro entre atmósferas es parte de
la composición. **Prohibido extender cualquier receta sin editar esta ley
primero.**

### La Tinta Viva (2026-07-04)

**Una sola tinta**: texto y sombras comparten el mismo violeta cálido
(`--ink #211D33` y sus alphas) — la app lee a la misma temperatura que su
papel. **Una sola respiración**: todo movimiento (animaciones y
transiciones) usa la curva de firma `cubic-bezier(0.22, 1, 0.36, 1)`;
prohibido el `ease-out` genérico.

- **Margen superior de la app: `--header-h`** (respeta el notch). Todas las
  pestañas arrancan su contenido a esta altura.
- **Gutter lateral de la app: 16px** (referencia: Explorar). Todas las
  pestañas comparten este margen.

- **Márgenes por tipo de respuesta (chat de Nüra)**: todo lo que dice Nüra
  comparte la alineación izquierda de 48px (avatar + gap). Por la derecha,
  el texto conversacional respeta `max-width: 80%` (aire), mientras tarjetas
  y filtros respiran a ancho completo (evita comprimir información).

- **El Compas (ritmo vertical de las secciones)**: una seccion respira
  IGUAL por arriba que por abajo. La linea separadora queda a la misma
  distancia del contenido que termina y del titulo que empieza
  (`--space-20` a cada lado, `--space-14` bajo el titulo). **Prohibidos los
  margenes-parche** que fingen un hueco que el padding no da.

- **El Ritmo manda (espaciado)**: una sola escala, nombrada por su valor —
  `--space-2 · 3 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 28 · 32`.
  Nacio de MEDIR el producto: `10px` era el valor mas usado de la app y
  ninguna de las dos escalas anteriores lo nombraba. Las escalas viejas
  (xs/sm/md/lg + micro/std/block/section) sobreviven solo como alias.
  **Prohibido escribir un espaciado a mano.**

- **El Velo (superficies tenues)**: `--surface-subtle` (campos, bloques
  secundarios) · `--surface-muted` (chips, railes, inactivos) ·
  `--surface-scrim` (velo de modales). **Prohibido inventar un relleno
  tenue.** Ojo: los mismos alfas en sombras y bordes son OTRA familia y no
  se tocan. Las dos barras fijas de la app (BottomNav y cabecera de Chats)
  comparten receta: papel a 0.86 con blur 32.

- **La Tinta manda (color)**: Nüra **no usa negro puro**. Toda tinta,
  borde, sombra y veladura es `rgba(33,29,51, α)` — violeta cálido sobre
  papel cálido. El morado de marca solo por token
  (`--purple · 05 · 10 · 20 · 30 · 40 · 60`), jamás `#7B2FFF` a mano.
  Excepciones: el blanco es blanco, y las paletas de datos (avatares,
  portadas) no son tokens de diseño.

- **La Curva manda (radios)**: `--radius-xs 4 · sm 10 · card 14 · md 18 ·
  lg 22 · xl 30 · full 100`. **Prohibido escribir un radio a mano.** La
  píldora es `--radius-full`, nunca `99px` ni `100px` (convivían las dos).
  `--radius-card` nacio porque 18 elementos vivian en la banda 12-16 sin
  token que los nombrara: cuando el producto pide un paso que la escala no
  tiene, se amplia la escala — no se doblega el producto.

- **La Escala manda (tipografía)**: `--text-xs 11 · sm 13 · base 15 · md 17 ·
  heading 20 · lg 22 · xl 28 · num 32`. **Prohibido escribir un tamaño de
  letra a mano** en un componente: si ninguno encaja, se discute el token,
  no se inventa el px. (Antes de esta ley convivían 15 tamaños distintos
  para una escala de 8.)

## 2. Componentes base

### La Superficie (la piel de toda tarjeta)
Receta unica: **curva `--radius-md` (18px)**, suave pero compuesta;
`--radius-card` (14) queda para lo que vive DENTRO de una tarjeta —
jerarquia de curvas, no accidentes. **Borde `--ink-border`**, **relleno
`--space-14 --space-16`**, **sombra con jerarquia**: `sm` en reposo
(listas, rios) y `md` reservada al protagonista (la recomendacion).

### SectionLabel (primitiva)
El rotulo de seccion en versalitas. **Un solo tracking: 0.6px** — en 11px
mayusculas lo sano es 0,05-0,08em, asi que es calibrado, no promedio
(convivian SIETE valores: 0.3 a 1px). Tonos `muted` (--ink-tertiary) y
`brand` (--purple). No se queda con el margen: cada sitio pasa el suyo.
**Prohibido dibujar un rotulo a mano.** Las insignias (con fondo y
pildora) son otra familia: les corresponde `Badge`.

### El Acuse (ley del feedback)
**Si la interfaz ya responde a la vista, el aviso sobra. Si la consecuencia
ocurre fuera de la vista, hay que contarla.** Seguir pinta el corazon y
comentar hace aparecer el comentario: nada que decir. Publicar obra la manda
al rio y al motor de recomendacion, y confirmar una conexion crea una
historia publica en el Muro: eso SI se cuenta, porque el usuario no puede
verlo. Los avisos hablan en la voz de Nura y **invitan, no bloquean** —
muere "Inicia sesion para seguir profesionales".

### Skeleton (primitiva)
La espera dibuja **la forma de lo que viene**, no un simbolo abstracto de
que algo pasa: el ojo sabe donde aterrizara el contenido y la espera se
siente mas corta. Variantes `card` (retrato + tres lineas) y `block`.
**Prohibido inventar un indicador de carga**: antes convivian esqueleto en
Explorar y un circulo latiendo en el perfil, el destino mas visitado.

### La Hoja (ley de los paneles)
**Ninguna hoja crece fuera de la pantalla.** Toda hoja o modal lleva
`max-height: 88dvh` (viewport VISUAL: con `vh` se saldria al abrir el
teclado en iOS) y `overflow-y: auto`: el cuerpo se recorre, las acciones
nunca se van. Las ancladas al fondo reservan ademas la barra en su relleno
inferior — `calc(var(--nav-h) + var(--space-12))` — para que la ultima
accion quede por encima del menu y a un pulgar comodo.

### EmptyState (primitiva)
Un vacio **no es un error**: es la mejor ocasion de explicar que hace el
producto. Patron unico: **frase en la Voz de Nura** (humana, jamas
funcional — muere "No encontramos profesionales"), **linea de apoyo** que
cuenta que pasara cuando haya algo, y **SIEMPRE una accion** que saque de
ahi. Dos de los cuatro vacios anteriores eran callejones sin salida.
**Sin icono**: la identidad de Nura es su voz; un pictograma de "no hay
nada" refuerza la ausencia en vez de la promesa.
No confundir con el muro de registro (Perfil sin cuenta): eso no es un
vacio, es una puerta. Otra familia.

### La Barra de Accion (fichas que existen para convertir)
El perfil del profesional existe **para** que le escribas: la accion se
ancla sobre la navegacion y el contenido pasa por debajo. Jerarquia
explicita en el ancho (protagonista ~62%, secundaria ~38%), receta de barra
de la casa (papel 0.86 + blur 32 + `--ink-border` arriba) y reserva del
scroll **una sola vez**. Antes vivian al final de la pagina: habia que
recorrer el perfil entero para escribir.

### Button (primitiva)
`<Button variant="primary|secondary|ghost" full disabled onClick>`.
**`minHeight: 44px` cocido dentro**: el area tactil deja de ser una
decision de cada pantalla. Radio `--radius-full`, texto `--text-sm` peso
700, transicion con la curva de firma. **Prohibido dibujar a mano un boton
de accion**: si hace falta otra forma, se anade variante.
Pendiente: los botones de icono (envio circular) piden un `IconButton`
propio — son otra familia, no se fuerzan aqui.

### Tarjeta Vertical (la Recomendación)
La respuesta de Nüra usa `HelperCardTall`: retrato 96px arriba, nombre 19px,
especialidad, meta (★ · precio · distancia), **su voz** ("En sus propias
palabras", clamp 4 líneas), píldoras de confianza (respuesta · experiencia ·
identidad) y **una acción ancha** ("Escribir
a X"). Las alternativas son la MISMA tarjeta con `small` (retrato 62, sin
acción) en rejilla de tres: coherencia por escala, no por invención. La
Tarjeta canon horizontal sigue rigiendo listas, Explorar, Comunidad y perfil.

### PostCard (la unidad del Muro)
**Un solo idioma.** Antes convivian dos componentes alternandose en el mismo
rio — la obra como tarjeta, la conexion como parrafo suelto + tarjeta de
persona — y por eso Comunidad nunca se leia como una comunidad, sino como
dos listas peleandose. Ahora obra y conexion son **el mismo post con
distinto contenido**: autor arriba (retrato, nombre, rol, tiempo), cuerpo,
resultado si lo hay, y **barra social** (Me sirve · comentarios).
**"Me sirve", no un corazon**: no mide popularidad, mide utilidad — respeta
la decision original (LinkedIn, no Instagram) y le dice algo real a quien
publica.
ObraCard sobrevive para "Su obra" en los perfiles: alli no hay muro.

### ObraCard (Nüra Obra)
Pieza canon de publicación tipada: chip de tipo (morado-10, uppercase) →
título en Voz 16.5 → cuerpo clamp-4 con "ver más" → **Resultado:** si
existe → pie mini-persona tocable + `✓ contrastado` + fecha. Tarjeta blanca
canon; sin hilo. Tipos: caso · trabajo · consejo · evolución · actualidad ·
hito. No existe el post libre.
 — `src/components/ui/index.jsx`

**Regla:** ningún patrón de esta lista se reimplementa inline en ninguna
pantalla. Si un patrón visual se repite, se extrae aquí.

- **`Badge`** — pills de estado y confianza. Variantes: `success` (✓ verificado,
  ✓ funcionó), `warning` (🔥 muy solicitado), `purple` (✓ tu conexión, marca),
  `neutral` (atributos). Tamaños `xs / sm / md`.
- **`LiveDot`** — el punto de "activo". Props `size` y `ring`. Decorativo
  (`aria-hidden`). Siempre `--green-dot`.
- **`Bubble`** — testimonios como conversación: avatar de iniciales en color
  rotatorio, burbuja `0 12px 12px 12px`, autor debajo. Texto en `--font-voice`
  itálica.
- **La Tarjeta Persona** (`src/components/HelperCard.jsx`) — representación
  canónica del profesional en TODA la app (resultados, Explorar, espejo del
  Primer Día, tiras): avatar 54 con LiveDot, nombre + un solo ✓, esencia en
  una línea (especialidad · zona), datos en otra (★ · precio · distancia),
  **una única acción** (Escribir). Sin botón de seguir (vive en el perfil),
  sin líneas de disponibilidad (el punto ya lo dice), sin razón ✦ por
  tarjeta (la convicción vive en la Revelación). Prohibido crear variantes.
- **`StatBar`** — números como logros: 1–3 columnas con separadores, valor
  grande + etiqueta pequeña ("4.9★ / valoraciones").

## 3. La Voz Tipográfica (regla de aplicación)

Fraunces aparece **solo donde hablan los humanos o donde Nüra escribe como
humana**: la cita del profesional en su perfil ("En sus propias palabras"), las
reseñas (`Bubble`), la Carta de Presentación Viva y las historias de El Momento
Cero. **Toda la UI funcional** (botones, navegación, datos, formularios)
permanece en tipografía de sistema. Un solo gesto tipográfico = identidad
inconfundible sin ruido.

## 4. Layout y motion (canónico — `engineering.md` remite aquí)

**Layout tipo chat** (Home, registro conversacional): área de mensajes
scrollable + barra `floatBottom` anclada sobre la BottomNav. **Prohibido** meter
contenido de flujo (stats, historias, tarjetas) dentro de `floatBottom`: todo
contenido va en el área scrollable (bug histórico real).

**Animaciones:**
- Keyframes **globales en `src/index.css`** aplicados con `style` inline.
  **Regla iOS (lección real):** las animaciones definidas dentro de CSS Modules
  no funcionan de forma fiable en iOS Safari — siempre keyframe global + inline.
- Entradas: `cardCascade` (tarjetas: resultados, Muro, Escaparate — la
  Revelación Progresiva la reutiliza montando tarjetas escalonadas por estado),
  `fadeInUp`, `popIn`.
- **La entrada es directa**: un respiro del iso (≤700 ms, fundido sobre
  papel) cubre el arranque; la ceremonia de marca es el saludo en la Voz.
  Momento Cero y Onboarding viven como rutas bajo demanda, no en la entrada.
- **La conversación NO se mueve sola**: cero scroll automático y
  `overflow-anchor: none`. La respuesta entra debajo; el usuario baja cuando
  quiere. Tres intentos de auto-scroll fallaron en dispositivo real.
- **El estado de bienvenida de Home es FIJO**: saludo, mensajes,
  sugerencias e input aparecen sin animación en cada entrada a la pestaña.
- **Las listas y los resultados NO animan su entrada**: aparecen. Tras tres
  escalones de optimización, el listón real (iPhone/Safari) no sostiene
  cascadas sin tiritar — y aparecer al instante siempre se ve mejor que
  aparecer con lag. La animación queda reservada a overlays y transiciones
  de pantalla, donde hay una sola capa y ningún contenido cargando.
- **60fps o nada**: solo se animan `transform` y `opacity`; los elementos
  que entran llevan capa propia (`will-change` + `backface-visibility`), y
  el escalonado nunca deja más de 3 capas animando a la vez.
- Las animaciones de entrada ocurren **una vez por vida de la pestaña**
  (las pestañas viven montadas — keep-alive); nunca por visita.
- `prefers-reduced-motion: reduce` desactiva globalmente toda animación.
- Probar toda animación nueva en iOS antes de darla por buena.

**Superficie especial:** El Momento Cero es la única pantalla oscura de la app
(fondo nocturno con pulso radial morado) — intencionado, no extender a otras.

### El principio "Aire" (Home)

La pantalla inicial es un lugar para respirar y contar: **saludo + input,
nada más**. La prueba social vive donde le corresponde (El Momento Cero y el
Muro); Home no acumula marketing. Regla de conversación: **Nüra habla en
texto abierto** — sin burbuja, una voz, no un bot — y el saludo abre en la
Voz Tipográfica (23px); el usuario responde en burbuja morada suave con
radio amplio.

## 5. Lenguaje e identidad verbal
*(traducción operativa de la esencia de marca de `manifesto.md`)*

- **Español**, tuteo, tono cálido y directo.
- **Categorías en primera persona de necesidad** ("Cuidar a alguien querido",
  "Arreglar algo en casa") — nunca taxonomía de directorio. Los `id` de
  categoría son contrato estable (ver `changelog.md`); solo cambia el lenguaje.
- **Nüra habla en primera persona, con convicción y humildad:** "Lo he entendido
  así", "es mi recomendación", "dime qué he entendido mal y lo ajusto".
- **Prueba social específica y local:** barrios reales de Barcelona, tiempos
  reales, velocidad real ("⚡ 38s") — nunca genérica.
- **Confianza siempre en verde success con ✓:** "✓ Identidad verificada",
  "✓ Conexión verificada", "✓ funcionó".

### La Gramática de la Recomendación (voz post-búsqueda)

Brevedad + certeza + calidez. **Prohibido narrar el algoritmo o volcar cifras
en la prosa** (cronómetros, conteos de perfiles, estadísticas — los números
viven en la tarjeta). El nombre del recomendado suena **una vez** en texto y
una en la tarjeta. Flujo: comprensión en una línea → un beat sereno ("Dame un
segundo…") → recomendación con porqué humano (máx. 2 frases de señales
reales) → tarjeta → "Si prefieres comparar, también encajarían **X**, **Y** y
**Z**." + chips. La urgencia modifica el porqué ("…y puede estar allí hoy
mismo"), nunca añade sirenas. La memoria solo habla cuando la conversación
actual la invoca.

## 6. Accesibilidad (base establecida)

- Todo control de solo-icono lleva `aria-label` (volver, enviar, dictar,
  adjuntar, compartir, seguir, borrar persona…). Inputs con etiqueta.
- BottomNav: `nav` etiquetada + `aria-current="page"` en la pestaña activa.
- `lang="es"`; foco visible con anillo morado (`:focus-visible`) — conservar.
- Decorativos con `aria-hidden` (LiveDot, desde el componente).
- `prefers-reduced-motion` respetado globalmente.
- [PENDIENTE] Touch targets mínimos 44px en botones circulares de cabecera.
