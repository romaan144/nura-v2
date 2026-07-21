# NÜRA 2 — CHANGELOG DE DECISIONES

> Una línea por decisión importante, con fecha y **motivo**. Este documento es
> la memoria longitudinal del proyecto: los porqués que el código no puede
> contar. Se escribe hacia arriba (lo más reciente, primero).

---

## 2026-07-04 — La Voz Moderna (corrección de dirección del fundador)

- **La serif sale de toda la app** ("letra de lápiz de libro"): el token
  `--font-voice` pasa a la sans del sistema — una línea, ~20 sedes curadas
  a la vez. **Cursivas exterminadas** globalmente. Pesos display a 700 con
  tracking -0.8 en las sedes clave (portada Explorar, Comunidad, nombres).
  Explorar recupera músculo: portada con 8 profesionales (uno por
  categoría). Ley nueva en design-system: prohibidas serifas y cursivas.
- Sello `NURA_BUILD` → `2026.07.04-af`.

## 2026-07-04 — La Revelación aterriza arriba, de verdad (segundo intento)

- `scrollIntoView` no bastaba: pelea con el crecimiento del contenedor y el
  ancla estaba en el bloque de tarjetas, no en el mensaje. Ahora el ancla es
  **el mensaje completo** (frase + tarjeta) y el scroll se posiciona **a
  mano** sobre el contenedor (`offsetTop` menos la cabecera flotante), con
  **doble pasada** (80 ms tras layout, 420 ms tras cargar avatares, que
  cambian la altura). La respuesta queda arriba y el usuario baja cuando
  quiere.
- Sello `NURA_BUILD` → `2026.07.04-aw`.

## 2026-07-04 — La Revelación aterriza arriba (feedback del fundador)

- Con la tarjeta vertical, el anclaje del navegador al fondo dejaba la
  recomendación por encima del viewport: había que subir para verla. Ahora
  el bloque de resultados lleva ref y **su inicio** se lleva a la parte alta
  (`block: 'start'`) al aparecer: se lee de arriba abajo, como debe.
- Sello `NURA_BUILD` → `2026.07.04-av`.

## 2026-07-04 — La Tarjeta Vertical gana voz (feedback del fundador)

- La recomendación grande incorpora **"En sus propias palabras"** (campo
  `quote`, respaldo `bio`, clamp de 4 líneas, en la Voz) y **tres señales de
  confianza** que ya existían en los datos y se perdían: tiempo de
  respuesta, experiencia e identidad verificada. Convence sin salir de la
  tarjeta. Las miniaturas siguen limpias.
- Sello `NURA_BUILD` → `2026.07.04-au`.

## 2026-07-04 — La Tarjeta Vertical (mandato del fundador)

- La recomendación deja de ser una fila: **tarjeta vertical grande** (retrato
  96, nombre 19px, meta centrada, acción ancha "Escribir a X"). Las
  alternativas dejan de ser chips y pasan a ser **la misma tarjeta en
  miniatura** (retrato 62, sin acción) en rejilla de tres. Mismo flujo de
  invitado, mismos datos, misma navegación — cambia la arquitectura, no el
  contrato. Registrada en design-system.
- Sello `NURA_BUILD` → `2026.07.04-at`.

## 2026-07-04 — La bienvenida, fija (feedback del fundador)

- El estado de bienvenida animaba en cada entrada a Buscar: cabecera del
  saludo (fadeInUp), mensajes en cascada (cardCascade escalonado) y barra
  inferior con input y sugerencias (fadeInUp con retardo). **Todo fijo**:
  la pestaña se abre y ya está ahí. Retirada también la cascada de las
  recientes en el module. Ley extendida en design-system.
- Sello `NURA_BUILD` → `2026.07.04-as`.

## 2026-07-04 — Fuera la animación de entrada (decisión final)

- Tras tres escalones (capa GPU, capa única, reflow de avatares) el lag
  persiste en iPhone/Safari. **Decisión: los resultados y las listas dejan
  de animar su entrada** — aparecen. Nüra no necesita coreografía para ser
  premium; necesita no tiritar nunca. Retiradas: revealBlock en la
  Revelación, fadeInUp en el río de Comunidad y las cascadas de Explorar.
  Las keyframes sobreviven para overlays y transiciones de pantalla (una
  sola capa, sin contenido cargando). Ley escrita en design-system.
- Sello `NURA_BUILD` → `2026.07.04-ar`.

## 2026-07-04 — Safari iOS: el reflow de los avatares (tercer escalón)

- Pista del fundador (iPhone/Safari) → sospechoso correcto: cada avatar que
  termina de decodificar durante la entrada **repinta y reflowa** (sin
  dimensiones reservadas, cuatro tarjetas = cuatro golpes de layout en plena
  animación). Cura: `width/height` explícitos + `decoding="async"` en el
  avatar, `contain: layout paint` en el bloque, `content-visibility: auto`
  en sus imágenes, y `translateZ(0)` + 30 ms de arranque para que la capa
  exista antes del primer fotograma.
- Sello `NURA_BUILD` → `2026.07.04-aq`.

## 2026-07-04 — La Revelación, una sola capa (segundo escalón)

- El fundador sigue viendo tirones tras la promoción a GPU: se sube al
  escalón anunciado. **La Revelación entera entra como un único elemento**
  (`revealBlock`, una capa, `contain: paint`) y dentro **nada se mueve** —
  mueren la animación propia de la tarjeta y el popIn escalonado de los
  chips. En Comunidad, solo las dos primeras piezas del río entran
  animadas; el resto aparece sin animación. Menos vida, más calidad.
- Sello `NURA_BUILD` → `2026.07.04-ap`.

## 2026-07-04 — Animaciones a 60fps (feedback del fundador)

- **Diagnóstico honesto**: las keyframes ya eran correctas (solo transform y
  opacity, cero layout). El tirón venía de **cuántas animaciones arrancan a
  la vez** sobre un árbol en reconciliación, sin promoción a capa GPU.
- Cura: `will-change` + `backface-visibility` en los tres entrantes
  (cardCascade/fadeInUp/popIn) para que el compositor les dé capa propia;
  escalonados recortados (chips 140→60 ms, río 70→50 ms con tope 3) para que
  nunca haya más de tres capas animando simultáneas.
- Sello `NURA_BUILD` → `2026.07.04-ao`.

## 2026-07-04 — El Panel del Profesional: "Tu semana" (Nura Copilot)

- **La cocina del profesional deja de estar vacía**: una tarjeta abre su
  Acto II con la voz de Nüra (Gramática: frase humana, cifras discretas,
  cero vanidad) — conversaciones abiertas, cita próxima, obra publicada — y
  **una sola acción sugerida** por prioridad (responder > ver la cita >
  publicar). Composición pura: todos los datos ya vivían en contexto.
- Sello `NURA_BUILD` → `2026.07.04-an`.

## 2026-07-04 — La Cuarta Puerta (Nura Copilot)

- **`npm run smoke`**: 8 pantallas × 2 escenarios (invitado / profesional con
  obra) renderizadas con Vite SSR sobre un UserProvider real. Cubre el punto
  ciego que causó la mala racha: build, lint y suite no ven si una pantalla
  renderiza. **Prueba de fuego**: con Feed saboteado, el build salió verde y
  el smoke cazó el fallo en ambos escenarios. Límite escrito: SSR no ejecuta
  efectos. Cuarta puerta obligatoria en engineering.md.
- Sello `NURA_BUILD` → `2026.07.04-am`.

## 2026-07-04 — El profesional publica su obra (bucle de oferta cerrado)

- **ObraComposer**: seis tipos, título, cuerpo y **Resultado exigido** en
  caso/trabajo/evolución — el formulario es el filtro anti-humo. Publicar
  guarda en `nura_obra_mias` y la pieza aparece al instante en su perfil,
  en el río de Comunidad y **en `obraSignal`**: lo que escribe mejora su
  propia recomendación desde el segundo siguiente.
- **Fusión única** (`ALL()` sobre el espejo `window.__nuraMisObras`,
  poblado por el provider): las tres funciones de obra beben de la misma
  fuente — cero divergencia entre escaparate y motor.
- Sello `NURA_BUILD` → `2026.07.04-al`.

## 2026-07-04 — La Obra alimenta a la IA (Obra F3 · el foso)

- **Publicar en Nüra entrena a tu propia recomendadora**: `obraSignal`
  puntúa (tope +6, escala verificada contra distancia -2/km y rating x2)
  solo cuando el contenido de una pieza casa de verdad con la consulta —
  jamás por tener obra. Vive dentro del scoring, después de LA PUERTA: no
  puede colar incompatibles. `buildWhy` la cita en última prioridad ("ha
  documentado un caso muy parecido al tuyo"). Suite +4 casos que verifican
  que la señal nunca desordena ni distorsiona.
- Sello `NURA_BUILD` → `2026.07.04-ak`.

## 2026-07-04 — Los Comentarios Profesionales (Obra F2 completo)

- **La Obra deja de ser monólogo**: contador 💬 en el pie de ObraCard, hilo
  desplegable bajo la tarjeta (sin modal), **arranques guiados del mandato**
  como chips de un toque, e input firmado. Invitados leen y encuentran la
  puerta de siempre (nura_return_to → Login). Semillas: 6 comentarios
  vecinales en 4 piezas. Persistencia `nura_obra_comments`; el estado vive
  en contexto, así que el contador coincide en Comunidad y en el perfil.
  Sin likes, sin anonimato — palabra firmada, como la obra.
- Sello `NURA_BUILD` → `2026.07.04-aj`.

## 2026-07-04 — Seguir cobra vida (Obra F2 · Nura Copilot)

- **Seguir deja de ser un favorito muerto**: filtro Todos|Siguiendo en la
  cabecera de Comunidad (río entero filtrado, vacío honesto), **el susurro
  del saludo** ("Marc, al que sigues, publicó hace 2 días — trabajo: …")
  solo en la rama default, y la marca **"Siguiendo ✓"** en ObraCard.
  getWelcome ya recibía `following` — cero cambios de firma. Bug reparado:
  favorites compartía clave con following ('nura_following') → ahora
  'nura_favorites' en load y save (favoritos demo previos se vacían).
  Comentarios profesionales → siguiente ciclo.
- Sello `NURA_BUILD` → `2026.07.04-ai`.

## 2026-07-04 — Restauración II: las subcategorías vuelven

- Cayeron en el mismo commit que la Plaza, así que la restauración del grid
  no las trajo. Extraídas verbatim de 785b191 (misma fuente que el grid) y
  reinsertadas en su sitio: tras el contador de resultados, antes de los
  filtros. Sus estados y clases del module seguían vivos.
- Sello `NURA_BUILD` → `2026.07.04-ah`.

## 2026-07-04 — Restauración dirigida (el ojo del fundador manda)

- **El grid de categorías VUELVE** ("era de lo más bonito de la app"):
  restaurado verbatim desde git; la Plaza de píldoras se retira. El
  Escaparate sigue muerto (nadie lo lloró).
- **Colaterales de los regex de cursivas, reparados de raíz**: el forense
  encontró una línea `}}>` y una declaración CSS completas devoradas junto
  a los italics ("textos sin márgenes"). Cura: `src` restaurado íntegro
  desde 111d5cb y reaplicado quirúrgico — token sans (1 línea), pesos
  display (4 sedes exactas), cursivas por sede SIN comodines de
  whitespace. Lección grabada: jamás `\s*` en regex de excisión.
- Sello `NURA_BUILD` → `2026.07.04-ag`.

## 2026-07-04 — Explorar, la Plaza (Nura diseño)

- **Muere la portada v1**: EscaparateVivo (liveness fingida — la especie que
  la Gramática extirpó del chat) y el grid con subcategorías (dos niveles de
  fricción). **Nace la Plaza**: frase-portada en Voz ("El barrio, a una
  búsqueda."), fila de píldoras con labels humanos e icono con su color de
  acento, y "Cerca de ti, esta semana" con Destacados canon. List-view canon
  intacta. Enmienda Voz-display; subcategorías → keywords futuras.
  Lecciones de la cirugía: comentarios decorativos llevan NBSP (anclar en
  código) y verificar la aguja contra el texto literal del guard.
- Sello `NURA_BUILD` → `2026.07.04-ae`.

## 2026-07-04 — Nüra Obra F1 (visión aprobada del fundador)

- **Nace la Obra**: publicación tipada (caso/trabajo/consejo/evolución/
  actualidad/hito) con resultado — no existe el post libre. 12 semillas
  contra profesionales reales del pool (el caso de la R, la instalación
  del 87, los seis meses de Jordi…), 4 marcadas `✓ contrastado`.
- **ObraCard** canon (chip+Voz+resultado+pie tocable) · Comunidad pasa a
  **río mixto 2:1** (la oferta demuestra, la demanda verifica) · el perfil
  gana **"Su obra"** antes del catálogo — la confianza primero.
- Sello `NURA_BUILD` → `2026.07.04-ad`.

## 2026-07-04 — Comunidad: El Latido del Barrio (mandato del fundador)

- **Reescrita desde 0**: muere el feed genérico (posts, sugeridos, carruseles
  legacy) y el ConnectionCard artesanal. Nace: cabecera con aurora + Voz +
  **pulso del día** (determinista + tus conexiones reales sumando), **tu
  historia primero**, el río de conexiones sobre la **Tarjeta Persona canon**
  (texto de historia en Voz itálica), tres **destacados del barrio**
  (deterministas, diversos por categoría) y el cierre que alimenta el
  círculo: "¿Y tú? Cuéntale a Nüra". Ley del mapa enmendada: la cabecera de
  Comunidad entra en Auroras.
- Sello `NURA_BUILD` → `2026.07.04-ac`.

## 2026-07-04 — El Alma Completa (Nura diseño)

- La dirección artística se cierra: la **Carta gana atmósfera interior**
  (radial morado ≤6% sobre su papel, en el chat y en el compositor); los
  **umbrales firman con hilo** (Gate y ConfirmModal, bajo sus títulos);
  Chats se evalúa contra el sistema compartido. **El mapa cerrado** entra
  en design-system con prohibición de extender recetas sin editar la ley.
- Sello `NURA_BUILD` → `2026.07.04-ab`.

## 2026-07-04 — El Alma Visible (mandato artístico del fundador)

- El degradado del logo entra al producto: **auroras** sobre Home, el hero
  del profesional y Login; la **Voz a display** en los nombres (perfil
  propio y profesional) y el título del Muro; **el hilo** degradado firmando
  la Recomendación y la Comunidad. Arte visible, tres pinceladas de sistema.
- Sello `NURA_BUILD` → `2026.07.04-aa`.

## 2026-07-04 — La Tinta Viva (mandato estético del fundador)

- **Una sola tinta**: el texto era negro frío (#0D0D1A + alphas de negro
  puro) sobre papel cálido; ahora tinta violeta cálida (#211D33) en texto,
  jerarquías y sombras — toda la app lee y flota a una misma temperatura.
- **Una sola respiración**: la curva de firma cubic-bezier(0.22,1,0.36,1)
  sustituye a cada `ease-out` genérico del código (31 sitios) — animaciones
  y transiciones laten igual en todas las pantallas. Ley en design-system.
- "Más no es mejor": cuatro gestos de token, cero componentes tocados.
- Sello `NURA_BUILD` → `2026.07.04-z`.

## 2026-07-04 — El Perfil como Casa (Nura diseño)

- **Tres actos con dramaturgia**: Identidad → Tu mundo (el Primer Día del
  Profesional sube a su hogar; nace la tarjeta de **cita próxima** — "El
  martes, Elena está con tu madre. Todo listo 💜") → Tu actividad y ajustes.
- **ZONA 3 "Búsquedas recientes" extirpada del Perfil** (15L): la especie
  que la ley del fundador exterminó en Home sobrevivía aquí.
- Sello `NURA_BUILD` → `2026.07.04-y`.

## 2026-07-04 — Los chips son parámetros (mandato del fundador)

- Tocar un chip de comprensión abría el sistema del input (historial v1
  sobre la conversación). Ahora: toggle ✓ en el mensaje, refuerzo
  silencioso del análisis, resultados **in-place** bajo el Contrato (no-op
  si el top no cambia). **Ley de separación**: el dropdown del input solo
  existe en estado vacío. Elemento del chip reescrito como canon.
- Sello `NURA_BUILD` → `2026.07.04-x`.

## 2026-07-04 — El Muro que crece contigo (Nura Copilot)

- **El ciclo deja de morir en privado**: al confirmar "✓ funcionó", Nüra
  escribe la historia (Gramática: nombre de pila, persona de El Espejo,
  primera visita de La Cita) con snapshot del helper y la añade al Muro
  delante de las semilla — `nura_my_stories`, una historia por conexión.
  El Muro L312 ya esperaba `myStories`: un andamio antiguo, ahora vivo.
  Celebración en el propio flujo de Confirmación. El flywheel del pitch,
  dentro del producto.
- Sello `NURA_BUILD` → `2026.07.04-w`.

## 2026-07-04 — Entrada directa (feedback del fundador)

- **Mueren las ceremonias encadenadas de la entrada** (Splash siempre →
  Momento Cero condicional → OnboardingOverlay): dos-tres animaciones
  redundantes, cargadas y ajenas a Aire, con early-returns que además
  retrasaban el montaje de las pestañas vivas. Ahora: la app monta al
  instante bajo un único **respiro del iso** (~700 ms sobre papel) y la
  ceremonia de marca es el saludo en la Voz. Momento Cero y Onboarding
  sobreviven como rutas bajo demanda para demos.
- Sello `NURA_BUILD` → `2026.07.04-v`.

## 2026-07-04 — La Gramática llega al perfil (feedback del fundador)

- **Una sola fuente del porqué**: buildWhy(helper, analysis) alimenta el
  chat Y el mapa de razones que consume la caja del perfil (incluido su
  persistidor a sessionStorage). Muere buildMatchReason (38 líneas), que
  producía "**Elena** es mi recomendación: … 164 clientes satisfechos.
  4.9★" — nombre repetido tras la plantilla, markdown crudo y cifras en
  prosa. La puerta de lint cazó un llamador huérfano antes del push.
- La caja del perfil gana cinturón anti-asteriscos y punto final único.
- Sello NURA_BUILD → 2026.07.04-u.

## 2026-07-04 — Las pestañas viven (feedback del fundador)

- **Muere el parpadeo de navegación**: `<Routes key={pathname}>` remontaba
  el árbol entero en cada cambio y `PageTransition` lo fundía — toda entrada
  a una pestaña re-nacía (animaciones replay, búsqueda de Home re-animada al
  volver). Ahora las 5 pestañas viven montadas tras su primera visita y solo
  alternan visibilidad: estado y scroll intactos, animaciones una vez por
  vida. Detalles (perfil, carta, chat) conservan su transición como overlay.
- Sello `NURA_BUILD` → `2026.07.04-t`.

## 2026-07-04 — El Ancla de Dominio (colisiones de categoría)

- **Los sustantivos mandan sobre los verbos** (feedback: "cuidado de
  mascotas" recomendaba una niñera; la inversa también viva: "pasear a mi
  abuela" → mascotas). DOMAIN_ANCHORS (+4) por categoría — personas,
  animales, oficios, objetos — deciden los empates que las acciones
  genéricas provocaban; el ancla ganadora alimenta el chip de comprensión.
- **Lección de la suite en su primer run rojo**: las anclas deben casar por
  palabra EXACTA — por tallo, los oficios ('cuidadora','paseador') sangraban
  hacia sus verbos ('cuidado','pasear') y regalaban el +4 al lado equivocado.
- Suite: +6 colisiones bidireccionales +2 negativas → **32 casos**.
- Sello NURA_BUILD → 2026.07.04-s.

## 2026-07-04 — Reconstrucción de la búsqueda: El Contrato (mandato del fundador)

- **Cuatro raíces, con evidencia**: (R1) temporizador del pensando sin dueño
  → disparaba tras los resultados y quedaba infinito; (R2) frontera de
  palabra sin morfología → 'entrenamiento' no tocaba 'entrenador' y caía en
  'otro' con comprensión vacía; (R3) el fallback difuso era la tercera sede
  de la subcadena, y la red de seguridad devolvía cualquier profesión por
  rating (reproducido: paseadora ★5 para entrenamiento; en dispositivo, un
  cerrajero); (R4) monolito handleSend.
- **Entra El Contrato**: identidad de búsqueda (`sid`/`alive()`, catch
  invalida), pensando cancelable con dueño, **puerta de compatibilidad** en
  los dos returns de matchHelpers, **honestidad sin comprensión** (cero
  tarjetas + petición de reformular), tallos con género en el scorer,
  señales por palabra completa, `matchedTerm` como primer chip de
  comprensión ("Entrenamiento personal").
- **Suite v2 como nueva puerta**: 24 casos (10 del mandato + morfología +
  honestidad + 4 negativas) en verde, gateando cada push. Memo de
  ResultsBlock evaluado y descartado: estabilidad ya garantizada por
  snapshot + keys + Contrato.
- Sello `NURA_BUILD` → `2026.07.04-r`.

## 2026-07-04 — La Gramática de la Recomendación (mandato del fundador)

- **La voz post-búsqueda, reescrita entera**: mueren el cronómetro (⚡2.1s),
  el "Filtrando entre 743 perfiles" con número aleatorio, el "mejor
  candidato", el "De 1.008 profesionales", la línea estadística de precios,
  la justificación extra del match, el "👆 Pulsa en cualquier tarjeta" y la
  triple repetición del nombre. Cinco líneas de sistema → **una de Nüra**:
  "Creo que ya tengo a la persona. Mi recomendación es **Elena**: [porqué
  humano de señales reales]".
- Comprensión en una línea; pensando sereno sin teatro; alternativas como
  "Si prefieres comparar, también encajarían…" + chips; bloque mudo.
  Regla registrada en design-system §5-bis.
- Sello `NURA_BUILD` → `2026.07.04-q`.

## 2026-07-04 — Aire, pasada 8: la Revelación sin desplazamiento

- **La recomendación ya no se desplaza a sí misma** (feedback del fundador):
  muere la cascada de tarjetas completas que crecía el bloque y empujaba a
  la estrella fuera de pantalla. Nuevo patrón: **una tarjeta protagonista +
  fila de persona-chips** (avatar · nombre · ★, popIn escalonado sin
  crecimiento — la altura queda reservada al montar). El scroll aterriza una
  vez, sobre la respuesta. "Una respuesta, no una estantería" — ahora
  también físicamente.
- Sello `NURA_BUILD` → `2026.07.04-p`.

## 2026-07-04 — Aire, afinado de La Interacción (6-bis)

- **Los chips conversacionales viejos también mueren al buscar** (Pregunta,
  seguimientos): eran "los botones que sobran una vez buscas" — la cirugía
  anterior solo retiraba los de refinamiento.
- **Timeouts recortados** (Supabase 4000→2500, race del matcher →2200): el
  peor caso con red lenta baja de ~7s a ~3.5s de puntos pensando.
- Sello NURA_BUILD → 2026.07.04-o.

## 2026-07-04 — Aire, pasada 7: Los Umbrales (Login e IntroLetter)

- **Login habla**: el título en la Voz, y si llegas para escribir a alguien,
  el umbral lo recuerda ("Para escribir a **Elena** ✨" desde el contexto de
  invitado pendiente) — la interrupción se vuelve parte del viaje. Inputs a
  16px (iOS sin zoom), botón píldora.
- **IntroLetter, mismo papel que el chat**: la carta se escribe sobre la
  tarjeta cálida con borde morado tenue que luego luce en la conversación;
  chrome transparente, Regenerar como píldora fantasma, Enviar como píldora
  primaria.
- Sello `NURA_BUILD` → `2026.07.04-n`.

## 2026-07-04 — Fe de errores: el zombi de getWelcome + el lint entra en la puerta

- La excisión de "recientes" (anclada al siguiente comentario de sección) se
  tragó vecinos: el cierre de `getWelcome`, `detectIntent` entero y la
  cabeza de `getDynamicSuggestions` — cuyo cuerpo huérfano quedó absorbido
  como zombi dentro de `getWelcome` (llaves balanceadas → build ciego) con
  5 `no-undef` minando el saludo por defecto. **Salió a main porque el lint
  era informativo, no puerta.** Reconstruido quirúrgicamente desde HEAD~1.
- **Regla permanente**: el push exige tres puertas con exit real — build,
  lint (`no-undef` = 0) y suite. La puerta que faltaba, instalada.
- Sello `NURA_BUILD` → `2026.07.04-m`.

## 2026-07-04 — Aire, pasada 6: La Interacción (feedback del fundador)

- **`stopThinking()` — autoridad única del estado "pensando"** con
  autocuración: cualquier pensamiento anterior muere al iniciar una nueva
  interacción (14 `setLoading` dispersos + puntos huérfanos = "se queda
  pillado"). Los refineChips de resultados viejos se retiran en cada envío:
  una conversación, no capas superpuestas.
- **Chips al trío universal con handler real** (Más cerca · Mejor valorado ·
  Más barato): los contextuales sin handler ('Primera consulta gratis',
  'Solo mañanas'…) caían como búsqueda literal basura — eran los "botones
  que sobran".
- **Búsquedas recientes, fuera** de sus dos sedes (override del init con
  chips 'Buscar de nuevo' + rama lastSearch de getWelcome) — la memoria
  valiosa (personas, citas, conexiones) permanece.
- **Spacer constante**: muere el hack `data-chips`; nada vuelve a solaparse
  con la barra flotante.
- Sello `NURA_BUILD` → `2026.07.04-l`.

## 2026-07-04 — Aire, pasada 5: La Tarjeta Persona (feedback del fundador)

- **La tarjeta del profesional, reescrita como canon único** — el fundador
  no la sentía bonita ni unificada, y el código le daba la razón: dos marcas
  de verificado compitiendo por la misma esquina del avatar, nueve iconos,
  doble botonera y razón duplicada. La nueva: persona protagonista, una
  línea de esencia, una de datos, **una sola acción** (Escribir, flujo de
  invitado intacto).
- **Tres eliminaciones deliberadas**: botón Seguir (vive en el perfil),
  línea "Disponible ahora·Responde en X" (el LiveDot y la StatBar del perfil
  ya lo dicen), y la razón ✦ por tarjeta (la convicción vive en la
  Revelación — "una respuesta, no una estantería").
- Cascada automática a las 4 superficies que la consumen. Registrada como
  componente canon en design-system §4 con prohibición de variantes.
- Sello `NURA_BUILD` → `2026.07.04-k`.

## 2026-07-04 — Aire, pasada 4: perfil profesional y modales

- **El hero del perfil pierde dos capas redundantes**: el bloque "Disponible
  ahora" (triplicaba el punto verde del avatar y el tiempo de la StatBar) y
  los chips decorativos de días L-V (sin semántica real). Once capas → nueve.
- **RegisterGate cálido**: sombra tibia, papel de Aire y el título en la Voz
  — el gate es Nüra pidiéndote conocerte, no un formulario.
- ConfirmModal suavizado al mismo lenguaje.
- Sello `NURA_BUILD` → `2026.07.04-j`.

## 2026-07-04 — Aire, pasada 3: la conversación

- **La Carta se lee como carta**: dentro del chat, el primer mensaje llega en
  papel cálido con la Voz Tipográfica y el sello "Carta de presentación ·
  escrita con Nüra" — momento de Voz según la regla del sistema.
- **Nüra en el chat es ceremonia, no globo**: sus intervenciones (✓ Acordado,
  seguimientos) pasan a línea serena centrada en tinta terciaria.
- **BottomNav entibiada** al papel de Aire (fondo cálido, borde más ligero) —
  respira en las cinco pestañas a la vez.
- Sello `NURA_BUILD` → `2026.07.04-i`.

## 2026-07-04 — Aire, pasada 2: Explorar y Chats

- **Explorar sin tablón**: extirpada la línea de marketing ("47 personas en
  Barcelona… · 1.008 verificados") — misma especie que la de Home. La Voz se
  muda a donde ya había un elemento: **el buscador pregunta "¿Qué
  necesitas?"** — cero elementos nuevos.
- **Chats vacío, cálido**: el estado vacío habla en la Voz ("Cuando conectes
  con alguien, vuestra conversación vivirá aquí").
- La puerta de build atrapó un envoltorio vacío tras la extirpación —
  corregido antes de que nada saliera al remoto: el sistema de puertas
  funcionando.
- Sello `NURA_BUILD` → `2026.07.04-h`.

## 2026-07-04 — Rediseño "Aire" (feedback directo del fundador)

- **La pantalla inicial vuelve a respirar**: extirpados los tres bloques de
  marketing del estado vacío (línea de stats, historia de María, grid de
  métricas — 46 líneas) — motivo: el fundador la sintió "fea y con demasiada
  información", y tenía razón: cinco rondas de features la habían convertido
  en un tablón. La prueba social vive en el Momento Cero y el Muro.
- **Nüra habla en texto abierto**: muere la burbuja-bot con blur; el saludo
  abre en la Voz Tipográfica (23px). El usuario, en burbuja morada suave.
- **Suavizado global por tokens**: papel cálido (#F7F6F2), bordes más
  ligeros, radios más amplios — la app entera se destensa con tres líneas.
- Sello `NURA_BUILD` → `2026.07.04-g`.

## 2026-07-04 — El Primer Día del Profesional (Nura Copilot mejora 5)

- **El lado oferta deja de morir en el minuto uno**: el Perfil del
  profesional registrado se convierte en su hogar — espejo de su tarjeta
  real, señales deterministas del día (`proSignals`: fecha+nombre, el número
  no baila entre pantallas), primer paso guiado (su cita personal, un solo
  campo → `helperProfile.quote`) y reputación naciente honesta, sin ✓
  falsos. El saludo de Home cobra vida también para él — motivo: el viaje
  de la demanda estaba completo; era el turno del otro pulmón del
  marketplace, ensamblado con piezas ya certificadas.
- Sello `NURA_BUILD` → `2026.07.04-f`.

## 2026-07-04 — La Cita (Nura Copilot mejora 4)

- **El acuerdo de la Conversación Viva se convierte en un objeto vivo**
  (`nura_citas`): el saludo de Home cambia de tiempo verbal y anuncia la
  visita próxima, Chats la muestra (📅 martes por la mañana) y la
  Confirmación Humana deja de preguntar a ciegas — pregunta por la visita
  real. Ciclo de vida sin timers: la cita es "próxima" mientras su contacto
  siga sin confirmar — motivo: Nüra ya recordaba el pasado; ahora cuida lo
  que va a pasar.
- Sello `NURA_BUILD` → `2026.07.04-e`.

## 2026-07-04 — Nura Copilot por fases + Nura Resume

- **El flujo Copilot pasa a cinco fases con aprobación entre fases**
  (Análisis → Plan → Implementación → Verificación → Finalización) y nace
  «Nura Resume» para retomar trabajo interrumpido exactamente donde quedó —
  motivo: evitar agotar la ventana de contexto a mitad de una implementación
  y mejorar la calidad del razonamiento. Sustituye al flujo de una respuesta.

## 2026-07-04 — La Inteligencia Medible (Nura Copilot mejora 3)

- **Puente de vocabulario `toApp()`**: el análisis emitía ids legacy
  ('matematicas', 'limpieza') mientras los datos y la app ya hablaban el
  vocabulario nuevo ('clases', 'hogar'). Normalización en las 3 fronteras
  (retorno del análisis + 2 comparaciones del matcher), tablas internas
  intactas — motivo: el pool garantizado de "clases" pasaba de 1 helper a 14;
  chips de comprensión y refinamiento correctos.
- **Suite dorada de comprensión** (`npm run test:matching`): 17 consultas
  humanas reales ejecutadas contra el pipeline real, con expectativas de
  categoría y resultados no vacíos. Rojo = no se pushea. La técnica que ganó
  la guerra de bugs, institucionalizada como paso del flujo (engineering §2).
- 2 filas legacy normalizadas en los datos de profesionales.
- **Primer run de la suite: rojo (4/17) — y destapó el mecanismo enfermo**:
  coincidencia por subcadena ('forma' ⊂ 'reforma' → entrenador) + desempates
  por orden de tabla. Endurecido a **palabra completa** y listas reforzadas
  con especificidad (logopedia: 'pronuncia/no pronuncia/la r'; mascotas:
  'pasee/mi perro/mi gato').
- **Fe de errores del propio proceso**: el primer push salió con la suite en
  rojo porque su salida se encadenó a un pipe que tragó el exit code — la
  clase de error que engineering §2.3 ya prohibía para el build. Corregido:
  la suite gatea el push con su exit real.
- **Segundo hallazgo de la suite — la subcadena tenía dos sedes**: la
  expansión semántica (`expandText`) casaba sus disparadores por `includes`,
  y el disparador 'forma' ⊂ 'reforma' inyectaba vocabulario fitness al texto
  expandido → +1×4 puntos falsos a entrenador. Endurecida también a palabra
  completa. Fe de errores intermedia: un falso diagnóstico (backslashes
  "dobles" que solo eran el render JSON de la herramienta) se descartó por
  ejecución real — la única fuente de verdad.
- Sello `NURA_BUILD` → `2026.07.04-c`, y `2026.07.04-d` tras el endurecimiento.

## 2026-07-04 — La Conversación Viva (Nura Copilot mejora 2)

- **El chat tras la Carta deja de ser plantilla**: la respuesta del profesional
  se construye desde el contexto real (persona de El Espejo, señales de la
  situación, su especialidad), llega en dos mensajes con ritmo humano de
  escritura y propone un siguiente paso concreto — día y franja — aceptable
  con un toque ("✓ Acordado: martes por la mañana").
- **Decisión de límites**: la simulación existe **solo en DEMO_MODE**; en
  producción aquí responden humanos reales — motivo: el manifiesto ("la IA no
  reemplaza humanos"). El andamio muestra cómo se sentirá; no sustituye a nadie.
- Sello `NURA_BUILD` → `2026.07.04-b`.

## 2026-07-04 — Certificación de Estabilidad (primera mejora Nura Copilot)

- **Análisis estático real instaurado** (ESLint + reglas React, script
  `npm run lint`) — motivo: la clase de bug "compila pero explota en runtime"
  (identificadores sin definir) es indetectable por el build; dos incidentes
  reales lo demostraron.
- **Corregidos 8 errores encontrados por el barrido**: `RegisterGate` sin
  importar en Chat (crash del gate al 4º mensaje), `Clock` sin importar en
  HelperProfile, `personalizationLine` sin declarar en el camino principal de
  resultados de Home (granada latente con usuario + profesional seguido),
  `following` sin destructurar en Profile, `navigate` huérfano en un
  subcomponente de Chat, `analysis` fuera de scope en el refinamiento, y dos
  claves duplicadas (RegisterGate 'follow', matching 'inglés').
- **Pipeline verificado por ejecución real**: tres consultas (incluida una
  basura) → matches correctos en <250ms con la red de seguridad activa.
  Auditoría de rutas: cero navegaciones sin destino.
- Sello `NURA_BUILD` → `2026.07.04-a`.

## 2026-07-04 — Sistema de trabajo Nura Copilot / Nura Debug

- **Dos comandos operativos definidos por el fundador**: «Nura Copilot» (el
  socio-producto lee `docs/`, propone la siguiente mejora de máximo impacto y
  espera aprobación) y «Nura Debug» (modo exclusivo de caza y corrección de
  errores en toda la app) — motivo: un único sistema de trabajo estable,
  gobernado por la documentación, para todas las sesiones futuras.

## 2026-07-04 — Estructura documental definitiva

- **Aprobada la base documental de Nüra 2** (`docs/`: manifesto, context,
  architecture, design-system, engineering, ai-collaboration, changelog) —
  motivo: que cualquier persona o IA se incorpore al proyecto sin depender de
  conversaciones antiguas. `business.md` y `state.md` quedan pospuestos a
  propósito.
- **Regla anti-duplicación documental** — cada dato vive en un solo documento y
  los valores concretos viven en el código (fuente de verdad: `src/config.js` y
  módulos citados); los docs fijan nombres, reglas y criterios.

## 2026-07-04 — Registro fundacional (retroactivo)

Decisiones tomadas durante la construcción de Nüra 2 (junio–julio 2026),
registradas retroactivamente con su motivo:

- **Dos proyectos: Nüra 1 congelada, Nüra 2 activa** — proteger una demo
  estable para inversores mientras se construye la visión sin miedo a romper.
- **Supabase es opcional por diseño** (timeout en toda lectura + pool local de
  profesionales demo que sostiene búsqueda, Explorar y Muro) — una dependencia
  externa jamás puede tumbar la búsqueda ni colgar una pantalla.
- **El input nunca se deshabilita por `loading`** y `loading` se libera en
  todos los caminos — un fallo aguas arriba no puede dejar la app muda.
- **Los interceptores conversacionales solo actúan ante sus chips exactos** —
  la mera existencia de un mensaje (Confirmación, Pulso) no puede secuestrar
  el flujo de búsqueda de la sesión.
- **Los `id` de categoría son contrato estable** — el lenguaje visible puede
  evolucionar (categorías en primera persona de necesidad); los ids que usan
  matching y filtros, no.
- **Un solo verde de "activo" (`--green-dot`) y componentes base únicos**
  (Badge, LiveDot, Bubble, StatBar) — ningún patrón visual se reimplementa
  inline; la coherencia es sistema, no disciplina.
- **La Voz Tipográfica (Fraunces) solo donde hablan los humanos** — identidad
  inconfundible sin contaminar la UI funcional.
- **La Revelación Progresiva sustituye a las alternativas plegadas** — la IA
  trabaja a la vista: recomendación con convicción primero, alternativas
  cayendo una a una dentro del chat.
- **La memoria de Nüra es transparente y borrable** (El Espejo visible en el
  perfil, con borrado por persona) — la confianza nace del control del usuario,
  no de la opacidad.
- **Push condicionado al resultado real del build** — nunca más un build roto
  en `main` (incidente real; regla en `engineering.md` §2.3).
- **`src/config.js` como único interruptor demo/producción + sello
  `NURA_BUILD` visible en el Perfil** — lanzar es cambiar una línea; verificar
  qué versión corre un dispositivo es mirar el Perfil.

---

*Formato de nuevas entradas:*
`## AAAA-MM-DD — Título` seguido de viñetas `- **Decisión** — motivo.`
