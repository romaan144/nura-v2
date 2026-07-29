# Nüra 2 — Roadmap de mejora

> Registro operativo. Se actualiza al cerrar una tarea o ante una decisión
> estructural. No es un documento narrativo.

**Objetivo general:** que Nüra se sienta una sola aplicación coherente —
más clara, fiable, cómoda y humana — sin rehacer lo que funciona.

**Estado del proyecto al abrir el roadmap:** sello `2026.07.05-q`,
cuatro puertas verdes (build · lint · suite 32/32 · smoke 16/16).

---

## FASE 0 — Auditoría medida

### Tarea 1 — Inventario medido de geometría · **Terminada** · 2026-07-05

Medido con Chromium real (390×844, viewport de iPhone) sobre el build,
recorriendo cada pantalla y haciendo scroll hasta el fondo.
**Cero archivos de `src/` modificados.**

#### Tabla de contratos de layout (valores REALES, no calculados)

| Pantalla | Contenedor raíz | Quién scrollea | Reserva de barra |
|---|---|---|---|
| Inicio | `.page` **fixed** h=844 | `.messages` (hijo) | en `.page` (66px) |
| Profesionales | `.page` static | `_body` (nieto) | en el scroller (66px) |
| Comunidad | **ninguno** | **`desktopMain`** (¡global!) | inline en su raíz |
| Chats | `.page` static | no scrollea aún | en `.page` (66px) |
| Perfil (invitado) | ninguno (inline) | no scrollea | inline |
| Perfil profesional | `.page` static | **el propio `.page`** | en `.scroll` |
| Login | ninguno (inline) | no scrollea | inline — **sobra** |

#### Elementos fijos medidos

| Pantalla | Cabecera | Barra inferior | Otros |
|---|---|---|---|
| Inicio | `.floatTop` **absoluto** 46px @t=12 | nav 66px @778 | `.floatBottom` abs 74px @704 |
| Profesionales | header **fijo** 68px @0 | nav 66px | — |
| Comunidad | **ninguna** | nav 66px | — |
| Chats | header fijo 68px | nav 66px | — |
| Perfil profesional | header fijo 68px | nav 66px | `.actionBar` 67px @711 |
| Login | ninguna | **ninguna** | — |

#### Hueco entre el último contenido y el primer elemento fijo

| Pantalla | medido |
|---|---|
| Inicio (resultados) | **14px** |
| Comunidad | **39px** |
| Perfil profesional | **40px** |
| Profesionales | **45px** |

---

### Discrepancias detectadas (evidencia para la Fase 1)

**D1 · Cinco contratos de layout distintos.** Ninguna pantalla comparte
modelo con otra: raíz fixed vs static vs inexistente; scroller hijo vs
nieto vs el propio raíz vs el contenedor global. *Impacto: alto — es la
causa raíz de todos los problemas de geometría de las últimas semanas.*

**D2 · Comunidad scrollea `desktopMain`**, el contenedor global que
envuelve TODAS las pestañas (montadas simultáneamente por las pestañas
vivas). Su scroll no está aislado. *Impacto: alto — riesgo de
interferencia entre pestañas.* Archivo: `src/pages/Feed.jsx` (raíz sin
contenedor propio).

**D3 · La reserva de la barra vive en cuatro sitios distintos**: en el
raíz (Inicio, Chats), en el scroller (Profesionales), en un hijo
(`.scroll` del perfil) o inline (Comunidad, Login). Ningún sitio es
"el" sitio. *Impacto: alto — es el origen de las reservas duplicadas
corregidas en `-n` y `-o`.*

**D4 · Login reserva sitio para una barra que no existe.**
`BottomNav.jsx:14` la oculta en `/login`, pero `Login.jsx:32` reserva
`calc(var(--nav-h) + var(--space-24))` ≈ 90px de relleno inferior
muerto. *Impacto: medio · Prioridad: alta (arreglo trivial).*

**D5 · Huecos inconsistentes al final del scroll**: 14 / 39 / 40 / 45px
para el mismo concepto. *Impacto: medio.*

**D6 · Tres modelos de cabecera**: absoluta de 46px (Inicio), fija de
68px (Profesionales, Chats, Perfil profesional), ninguna (Comunidad,
Perfil invitado, Login). *Impacto: medio — explica que "la barra
superior no se integra igual en todas las vistas".*

**D7 · `--float-bottom-h` dice 72px; medido: 74px.** Número mágico que
no coincide con la realidad. *Impacto: bajo.*

**D8 · Chats no scrollea con datos demo.** Con datos reales sí lo hará y
su contrato de layout no está verificado. *Pendiente de medir con
volumen.*

#### Limitación declarada

El entorno de medición es Chromium sin notch: **no reproduce safe-area,
teclado de iOS ni barra de Safari**. Todo lo anterior es independiente
del dispositivo. Lo específico de Safari queda **pendiente de
confirmación en el iPhone del fundador**, no dado por bueno.

---

### Tarea 2 — Auditoría de fiabilidad técnica · **Terminada** · 2026-07-05

Lectura estática (ESLint con reglas de hooks) **más** ejecución real en
Chromium con captura de consola, excepciones y red en las 8 rutas.
**Cero archivos de `src/` modificados.**

#### Lo que está bien

- **Cero excepciones de JavaScript** en las 8 rutas, con carga y scroll.
- **Cero listeners sin limpiar** (0 `addEventListener` en componentes).

#### Discrepancias

**T1 · Se descarga una fuente que no se usa.** `index.html:44` pide
**Fraunces** a Google —con ejes de itálica y tamaño óptico, pesada— y
tiene **0 usos en el CSS**: murió en el ciclo de La Voz Moderna pero el
`<link>` nunca se retiró. Petición que bloquea el render, para nada.
*Impacto: alto · arreglo trivial.*

**T2 · Google Fonts desde el CDN de Google.** Dos peticiones externas
(`index.html` + `@import` en `index.css`). Además del coste, hay
**consideración legal**: servir Google Fonts desde su CDN envía la IP del
visitante a un tercero y hay sentencias en la UE que lo consideran
incompatible con el RGPD. Nüra es un producto español. *Impacto: alto
para lanzar · decisión del fundador: autoalojar o usar fuentes del
sistema.*

**T3 · 55 `setTimeout` frente a 5 `clearTimeout`.** Cincuenta
temporizadores sin cancelar al desmontar. Con pestañas vivas —todas
montadas a la vez— puede provocar actualizaciones sobre componentes ya
invisibles. *Impacto: medio · produce parpadeos y estados fantasma.*

**T4 · 25 errores silenciados** (`catch` vacío). Muchos deliberados y
correctos (acceso a `localStorage` en SSR), pero entre ellos puede haber
fallos reales que nunca se ven. *Impacto: medio.*

**T5 · 18 avisos de React**: 9 de dependencias de efectos, 7 de
`setState` dentro de efectos y **2 de pureza de render**
(`Chat.jsx:391` y `:399`). Los de pureza son los únicos que pueden causar
comportamiento incorrecto real. *Impacto: medio-alto en esos 2.*

**T6 · `JSON.parse(localStorage…)` sin proteger** en `Login.jsx`. Dato
corrupto = revienta la verificación del código. *Impacto: bajo ·
probabilidad baja, consecuencia alta.*

---

### Tarea 3 — Auditoría del sistema de diseño · **Terminada** · 2026-07-05

Inventario de primitivas, deudas censadas y patrones repetidos.
**Cero archivos de `src/` modificados.**

#### Lo que ya existe (el sistema está más cerrado de lo que parecía)

**8 primitivas**: `Badge`, `LiveDot`, `Bubble`, `StatBar`, `Button`,
`SectionLabel`, `EmptyState`, `Skeleton`.
**21 componentes** con archivo propio.

Los cinco ejes del sistema están cerrados y con ley escrita: escala
tipográfica, radios, tinta/color, ritmo de espaciado y superficie de
tarjeta.

**Corrección al plan inicial:** `AppHeader` **no hace falta** —
`PageHeader` ya existe y lo usan 8 pantallas. `StickyActionBar` tampoco:
solo hay una barra de acción en toda la app (el perfil profesional), y
un componente para un solo uso es abstracción prematura.

#### Discrepancias

**S1 · Tres componentes huérfanos**: `ObraCard`, `NavBar` y
`OnboardingOverlay` — **nadie los importa**. `ObraCard` quedó sin uso al
nacer `PostCard`; los otros dos son herencia de v1. *Impacto: bajo en
runtime, medio en mantenimiento — código muerto que confunde.*

**S2 · `--rule` sobrevive en 14 usos** (censado en 18; bajó al corregir
el perfil). Token duplicado de `--ink-border`, con valor distinto
(#E4E4F0 frío vs violeta cálido). *Impacto: medio.*

**S3 · 8 tamaños de letra fuera de escala**: 16px (×2), 24px (×3),
26px, 34px, 44px. Los grandes son piezas de impacto deliberado; los
16px y 24px deberían caer a token. *Impacto: bajo.*

**S4 · 4 radios fuera de escala**: 2px (×3) y un 99px superviviente que
debería ser `--radius-full`. *Impacto: bajo.*

**S5 · Patrón `InfoRow` repetido 8 veces** (fila de icono + texto con
el mismo flex, centrado y separación). Candidato claro a primitiva.
*Impacto: medio — es el patrón más repetido sin componente.*

**S6 · Cinco componentes de tarjeta conviven**: `HelperCard`,
`HelperCardTall`, `ObraCard` (huérfano), `PostCard`, `HelperCarousel`.
Cuatro vivos para representar personas y publicaciones. *Impacto: medio
— revisar si `HelperCarousel` sigue aportando o es la sexta forma de
dibujar lo mismo.*

---

### Tarea 4 — Auditoría de flujos y datos · **Terminada** · 2026-07-05

**Cero archivos de `src/` modificados.**

#### Lo que está bien

- **El bucle del producto cierra**: buscar → conectar → confirmar →
  publicar → mejorar el matching. `confirmContact`, `addStory`, `addObra`
  y `obraSignal` están todos conectados y en uso.
- **Ninguna pantalla es un callejón sin salida**, salvo una huérfana.

#### Discrepancias

**F1 · Todo el estado vive en el navegador.** **33 claves de
localStorage** sostienen la app entera: usuario, chats, citas, contactos,
obra, comentarios, reacciones, historial, demanda no cubierta. **No hay
backend para los datos propios.** Consecuencias: nada se comparte entre
dispositivos, el fundador no ve ningún dato de sus usuarios, y borrar los
datos del navegador borra la cuenta. *Impacto: bloqueante para lanzar.*

**F2 · El código de verificación no se verifica.** `Login.jsx` solo
comprueba que tenga 4 dígitos: **cualquier número entra con cualquier
código**. No hay autenticación real ni envío de SMS. Correcto para una
demo; **inaceptable al abrir**, porque cualquiera entra como cualquiera.
*Impacto: bloqueante para lanzar.*

**F3 · 138 peticiones externas para los avatares** (`api.dicebear.com`).
Cada foto de profesional es una llamada a un tercero: coste de red en
cada pantalla, dependencia de un servicio ajeno y la misma consideración
de privacidad que las fuentes (T2). *Impacto: medio-alto.*

**F4 · `/onboarding` no tiene salida.** Ruta huérfana de v1: si alguien
llega, no puede volver. *Impacto: bajo — no es alcanzable desde la
navegación normal, pero existe.*

**F5 · Todo el contenido es de demostración**: 123 profesionales
semilla, historias de conexión, obra, comentarios y reacciones. **No hay
oferta real.** Es el problema de negocio, no técnico: sin profesionales
de verdad no hay producto que abrir. *Impacto: bloqueante para lanzar ·
no se resuelve con código.*

---

## Próximos pasos

| Fase | Tarea | Estado |
|---|---|---|
| 0 | 1 · Inventario medido de geometría | **Terminada** |
| 0 | 2 · Auditoría de fiabilidad técnica | **Terminada** |
| 0 | 3 · Auditoría del sistema de diseño | **Terminada** |
| 0 | 4 · Auditoría de flujos y datos | **Terminada** |
| 1 | Modelo de layout común (basado en D1–D7) | Pendiente |

**FASE 0 COMPLETA.** 20 discrepancias registradas (D1–D8 geometría,
T1–T6 fiabilidad, S1–S6 sistema de diseño, F1–F5 flujos y datos).

**Siguiente paso exacto:** presentar al fundador el resumen de la Fase 0
y la propuesta de Fase 1 (modelo de layout común, basado en D1–D7), y
**esperar su aprobación explícita** antes de tocar código.

---

## Deudas heredadas (censadas antes de este roadmap)

- **[BLOQUEO DE LANZAMIENTO]** RLS de Supabase: el rol anónimo puede
  escribir en la tabla `helpers` (`claudeApi.js` hace PATCH con la clave
  anon). Revisar antes de abrir al público.
- `DEMO_MODE` sigue activo por defecto (`npm run preflight` lo verifica).
- Token `--rule` en 18 usos, debe morir en favor de `--ink-border`.
- 7 tamaños tipográficos y 3 radios díscolos, censados.
- Pantalla `/intro/:id` huérfana: decidir si se retira.
- `nura_demanda_no_cubierta` debe subirse al backend el día del enchufe.
- Chats y Comunidad necesitarán estado de carga cuando haya backend.
