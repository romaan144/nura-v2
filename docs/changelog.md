# NÜRA 2 — CHANGELOG DE DECISIONES

> Una línea por decisión importante, con fecha y **motivo**. Este documento es
> la memoria longitudinal del proyecto: los porqués que el código no puede
> contar. Se escribe hacia arriba (lo más reciente, primero).

---

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
