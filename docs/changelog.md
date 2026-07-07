# NÜRA 2 — CHANGELOG DE DECISIONES

> Una línea por decisión importante, con fecha y **motivo**. Este documento es
> la memoria longitudinal del proyecto: los porqués que el código no puede
> contar. Se escribe hacia arriba (lo más reciente, primero).

---

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
