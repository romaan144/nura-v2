# NÜRA 2 — CHANGELOG DE DECISIONES

> Una línea por decisión importante, con fecha y **motivo**. Este documento es
> la memoria longitudinal del proyecto: los porqués que el código no puede
> contar. Se escribe hacia arriba (lo más reciente, primero).

---

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
