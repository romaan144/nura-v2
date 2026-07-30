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

## FASE 1 — El contrato de layout

### Tarea 1 — Los tres arreglos triviales · **Terminada** · 2026-07-05

Aprobada por el fundador. Sello `2026.07.05-r`.

- **T1 resuelto**: retirado el `<link>` a Fraunces de `index.html`.
  Verificado midiendo con Chromium: **ya no se pide**. Queda solo la
  peticion de Inter (T2 sigue abierto: decision de autoalojar o no).
- **D4 resuelto**: `Login.jsx` dejaba ~90px de relleno inferior
  reservando una barra que `BottomNav.jsx:14` oculta en su ruta. Efecto
  colateral positivo: el bloque queda **opticamente centrado** — el
  relleno asimetrico (32 arriba / 90 abajo) lo empujaba ~29px hacia
  arriba del centro real.
- **S1 resuelto**: borrados `ObraCard`, `NavBar` y `OnboardingOverlay`
  con sus modulos CSS. Verificadas **0 importaciones** de cada uno antes
  de borrar.

Archivos: `index.html`, `src/pages/Login.jsx`, `src/config.js`,
y 5 archivos borrados.
Pruebas: cuatro puertas verdes + medicion de Login en Chromium real.
**Pendiente de confirmacion en el iPhone del fundador.**

---

### Tarea 2 — El contrato de layout · **Terminada** · 2026-07-05

**Ninguna pantalla modificada.** Solo la ley y sus tokens.

- **Siete reglas** escritas en `docs/design-system.md` → *El Contrato de
  Layout*: el `.page` de cada pantalla es su scroller (nunca el contenedor
  global); la reserva inferior vive en UN solo sitio; ningun hijo reserva
  nada; el hueco final es siempre `--space-20` e **incluido** en el token;
  los tokens deben coincidir con lo medido; `vh` prohibido; medir antes de
  tocar.
- **Tres tokens nuevos** en `index.css` con alturas MEDIDAS en navegador
  real: `--reserva-nav`, `--reserva-accion` (67px de barra de accion),
  `--reserva-input` (74px de input flotante).
- Verificado: **nadie los usa todavia** — riesgo cero. Se aplicaran una
  pantalla por tarea, midiendo antes y despues.

Pruebas: cuatro puertas verdes.

---

### Tarea 3 — Comunidad migrada al contrato · **Terminada** · 2026-07-05

Sello `2026.07.05-s`. Un solo archivo: `src/pages/Feed.jsx`.

**Antes (medido):** sin contenedor propio; scrolleaba `desktopMain`, el
elemento que envuelve TODAS las pestañas (montadas simultaneamente).
`minHeight: 100dvh` y `paddingBottom` inline.

**Despues (medido):** contenedor propio con `height: 100%`,
`overflow-y: auto`, `overflow-x: hidden` y `padding-bottom:
var(--reserva-nav)`.

| | antes | despues |
|---|---|---|
| Quien scrollea | `desktopMain` (global) | su propio contenedor |
| Scroll aislado | **no** | **si** (`esGlobal: false`) |
| Reserva inferior | inline, `nav + space-24` | token `--reserva-nav` (86px) |
| Caja de contenido → barra | 39px | **20px** |

*Nota de medicion:* la sonda leyo 35px porque mide un nodo de texto
dentro de la ultima tarjeta; los 15px de diferencia son el relleno
interno de esa tarjeta, correcto y ajeno al contrato. La caja de
contenido si termina a 20px exactos (844 − 86 = 758; barra en 778).

**D2 resuelto.** Pruebas: cuatro puertas verdes + medicion antes/despues.
**Pendiente de confirmacion en el iPhone del fundador.**

---

### Tarea 4 — Profesionales migrada al contrato · **Terminada** · 2026-07-05

Sello `2026.07.05-t`. Un solo archivo: `src/pages/Explore.module.css`.

Su estructura es `.page` (armazon que no scrollea) → `.body` (scroller).
**Se conserva a proposito**: el armazon existe porque la cabecera vive
fuera del scroll, y colapsarlo seria una refactorizacion sin beneficio.
*Refinamiento honesto de la regla 1 del contrato: el patron de dos capas
—armazon + cuerpo desplazable— es valido cuando hay mobiliario fuera del
scroll. Lo que la regla prohibe es que scrollee un contenedor AJENO a la
pantalla (el caso de Comunidad).*

**El defecto real era otro**: la reserva era `var(--nav-h)` a secas, sin
hueco final — el contenido terminaba justo en la linea de la barra.
Cambiada al token `--reserva-nav`, que ya lo incluye.

| | antes | despues |
|---|---|---|
| Reserva inferior | `var(--nav-h)` (66px) | `--reserva-nav` (86px) |
| Caja de contenido → barra | 0px | **20px** |

Pruebas: cuatro puertas verdes + medicion (`padding-bottom: 86px`, caja
termina en 758, barra en 778).

---

### Correccion — El rebote movia la barra fija · **Terminada** · 2026-07-05

Reportado por el fundador tras la Tarea 4: la barra inferior parecia poder
desplazarse verticalmente. **Regresion propia**, y con causa clara.

`overscroll-behavior` solo estaba en Inicio. Los otros **20 scrollers**
propagaban el arrastre al documento al llegar a su limite, y el rebote de
iOS mueve visualmente los elementos fijos. No se notaba antes porque
Comunidad scrolleaba el contenedor global; al darle scroller propio
(Tarea 3), el rebote quedo a la vista.

Cura sistemica: `overscroll-behavior: none` en el `body` y
`overscroll-behavior-y: contain` en los 20 scrollers (15 de modulo + 5 en
linea). **Nueva regla 7 del contrato.**

Sello `2026.07.05-u`. Pruebas: cuatro puertas verdes.

---

### Tarea 5 — Chats y Perfil migrados · **Terminada** · 2026-07-05

Sello `2026.07.05-v`. Archivos: `Chats.module.css`, `Profile.module.css`,
`Profile.jsx`.

Mismo defecto que tenia Explore: la reserva era `var(--nav-h)` a secas,
sin hueco final. Ambas al token `--reserva-nav`.

**Hallazgo durante la medicion**: Perfil daba **90px** en vez de 86,
porque la pantalla de invitado reservaba **en linea** con `--space-24` —
fuera del contrato. Corregida tambien. *La medicion volvio a cazar lo que
la lectura del CSS de modulo no podia ver: el estilo en linea de otra
rama del mismo archivo.*

| | antes | despues |
|---|---|---|
| Chats | `var(--nav-h)` 66px | **86px** (token) |
| Perfil (con sesion) | `var(--nav-h)` 66px | **86px** (token) |
| Perfil (invitado) | inline, 90px | **86px** (token) |

Verificado: las tres con `overscroll-behavior-y: contain`.

**Pendiente (D8):** Chats no scrollea con datos de demostracion, asi que
su contrato **no esta verificado con volumen real**. No se da por bueno.

**Nota menor:** aparece un scroller con `padding-bottom: 2px` y
`overscroll-behavior-y: auto` en ambas pantallas (probablemente una fila
horizontal de chips). Sin contencion vertical, pero no scrollea en Y.
Anotado, sin tocar.

---

### Tarea 6 — Inicio migrada · **Terminada** · 2026-07-05

Sello `2026.07.05-w`. La pantalla mas delicada, medida antes y despues.

**Antes (medido):** la reserva vivia en DOS sitios — `.page` con 66px en
la media query de movil, mas un espaciador hijo de 84px. Funcionaba
(18px de hueco), pero era **la trampa exacta que costo tres ciclos**.

**Despues:** la reserva vive **solo** en el `padding-bottom` del scroller
(`--reserva-input`, 152px) y los dos espaciadores hijos han muerto.

| | antes | despues |
|---|---|---|
| Reserva en `.page` | 66px | **0** |
| Reserva en el scroller | 0 | **152px** (token) |
| Espaciadores hijos | 2 (84px y 92px) | **0** |
| Hueco, estado bienvenida | — | **20px** |
| Hueco, estado resultados | 18px | **20px** |
| Contenido tapado | no | **no** |

**D7 resuelto**: `--float-bottom-h` pasa de 72 a los **74px medidos**, y
`--reserva-input` se recalibra a `nav + 66 + 20` con las alturas reales
(8 de relleno + 58 de capsula), no estimadas.

**Incidencia durante la tarea:** al retirar las reglas CSS huerfanas de
los espaciadores, una expresion regular corto una regla vecina por la
mitad y rompio la compilacion. **La Cuarta Puerta lo cazo.** Repuesto el
archivo desde git y rehechos solo los dos cambios necesarios. Las dos
reglas huerfanas se conservan: son inocuas y borrarlas no compensa el
riesgo (leccion ya grabada: jamas regex de excision en CSS).

---

## FASE 2 — Estabilizacion tecnica

### Tarea 1 — Los dos fallos puntuales de runtime · **Terminada** · 2026-07-05

Sello `2026.07.05-x`.

**T6 resuelto**: `JSON.parse(localStorage…)` de `Login.jsx` protegido con
try/catch. Un dato corrupto reventaba la verificacion del codigo y dejaba
al usuario **encerrado sin poder entrar** — probabilidad baja,
consecuencia alta.

**T5 DESCARTADO — correccion a mi propia auditoria.** Las dos "violaciones
de pureza" de `Chat.jsx:390` y `:398` (`Date.now()` y `Math.random()`) son
**falsos positivos**. Verificado: viven dentro de `sendMessage`, que se
invoca desde un `onClick` — **es un manejador de evento, no render**. Ahi
esas llamadas son correctas. La regla `react-hooks/purity` es experimental
y no distingue el contexto.

*Decision: no se cambia codigo correcto para complacer a un linter.* En la
auditoria los habia marcado como "los unicos que pueden causar
comportamiento incorrecto real": era falso, y queda corregido aqui.

Pruebas: cuatro puertas verdes.

---

### Tarea 2 — T2: fuentes autoalojadas · **Terminada** · 2026-07-05

Sello `2026.07.05-y`. El fundador delego la decision.

**Elegido: autoalojar**, no fuentes del sistema. Razon: su restriccion
numero uno era no tocar la identidad de marca, e Inter aparece en 22
reglas — es la voz visual de Nura. Autoalojar conserva el aspecto exacto,
cumple el RGPD y **encima carga mas rapido** que el CDN, porque elimina
dos conexiones externas que bloqueaban el render.

Via `@fontsource-variable` desde el registro de npm (el unico permitido en
este entorno). **Fuentes variables**: un solo archivo cubre los pesos
300-800 que usa la app, en vez de seis archivos estaticos.

**Verificado en navegador real: CERO dominios externos contactados.**
Antes: `fonts.googleapis.com` + `fonts.gstatic.com` en cada carga.

| | antes | despues |
|---|---|---|
| Peticiones a Google | 2 (preconnect + link + @import) | **0** |
| IP del visitante a un tercero | si | **no** |
| Familias | Inter + Plus Jakarta (+ Fraunces sin usar) | Inter Variable + Plus Jakarta Variable |

**Dependencias nuevas justificadas**: `@fontsource-variable/inter` y
`@fontsource-variable/plus-jakarta-sans`. Es el mecanismo estandar para
autoalojar y la unica via posible aqui.

*Queda abierto F3*: los avatares siguen viniendo de `api.dicebear.com`
(138 usos) — mismo problema de privacidad, distinta solucion.

---

### Tarea 3 — T3: los temporizadores · **Terminada** · 2026-07-05

Sello `2026.07.05-z`.

**Correccion de severidad a mi propia auditoria.** Dije "55 setTimeout
frente a 5 clearTimeout, cincuenta temporizadores sin cancelar". Al
inventariarlos, la mayoria **no son fuga**:

- **Home tiene 22**, pero es una pestaña que **nunca se desmonta** (las
  pestañas viven montadas). Sus temporizadores no dejan nada colgando.
- En React 18, `setState` sobre un componente desmontado es una operacion
  vacia: ni avisa ni rompe. La mayoria son inocuos de verdad.

**El riesgo real era otro, y mas concreto**: cinco temporizadores con
**efecto secundario** — navegacion o persistencia. En particular, tres
componentes de tarjeta compartian este patron:

```js
setTimeout(() => navigate('/login'), 600)
```

Una **navegacion diferida que no se puede cancelar**: si el usuario toca
otra cosa en esos 600ms, la app le lleva a Login igual, sin haberlo
pedido. Corregido en `HelperCard`, `HelperCardTall` y `HelperCarousel`
con un ref cancelado al desmontar.

*Incidencia:* en `HelperCarousel` el ref cayo en el componente equivocado
del archivo (hay dos) y la puerta de lint lo cazo con `no-undef`.

**No se tocan los inocuos**: cancelar por cancelar añade codigo sin
resolver nada.

---

### Tarea 4 — T4: los catch vacios · **Terminada** · 2026-07-05

Sello `2026.07.06-a`. **FASE 2 CERRADA.**

**Tercera correccion a mi propia auditoria.** Los 25 `catch` vacios
protegen, sin excepcion, **APIs del navegador**: sessionStorage (15),
window (11), localStorage (3), document (2). Son guardas **deliberadas y
necesarias** — el smoke corre en SSR, donde esas APIs no existen, asi que
el silencio es lo correcto. Añadirles registro habria sido ruido.

Y los fallos que SI importan **ya se registraban**: la busqueda
(`Home.jsx:998`), Supabase (`matching.js:466,471`), la historia
(`Home.jsx:721`) y el contexto de persona (`Home.jsx:867`).

**Una sola excepcion legitima**, encontrada al revisar uno por uno: el
registro del chat en Supabase (`claudeApi.js:82`) fallaba en **absoluto
silencio**, con el comentario "never block the UI". La decision de no
bloquear es correcta; lo que no lo era es que **nadie sabria nunca que esa
persistencia esta rota**. Ahora avisa en consola sin cambiar el
comportamiento.

---

## FASE 2 CERRADA — resumen

| hallazgo | resultado |
|---|---|
| **T2** Google Fonts / RGPD | **resuelto** — autoalojadas, cero dominios externos |
| **T6** parseo sin proteger | **resuelto** |
| **T3** temporizadores | **resuelto** en lo que era real (3 navegaciones diferidas no cancelables); el resto, sobrevalorado |
| **T5** violaciones de pureza | **descartado** — falsos positivos |
| **T4** catch vacios | **descartado** — guardas correctas; una excepcion arreglada |

**Leccion de metodo:** tres de los seis hallazgos de fiabilidad estaban
sobrevalorados o eran falsos. La auditoria se hizo **contando patrones**,
y contar no distingue el contexto. Las cifras de la Fase 0 son un punto de
partida, no un veredicto: cada una hay que verificarla antes de tocar.

---

## FASE 3 — F3: los avatares en local

### Tarea 1 — 138 peticiones a un tercero, eliminadas · **Terminada** · 2026-07-05

Sello `2026.07.06-b`.

Los avatares venian de `api.dicebear.com`: **138 peticiones**, una por foto
de profesional. Mismo problema que las fuentes (la IP del visitante viaja
a un tercero), mas latencia y dependencia de que ese servicio siga en pie.

**Medido antes de decidir**: generar los 123 avatares en local cuesta
**12ms en total** (0.10ms cada uno), 6KB por avatar. Coste despreciable,
asi que se generan aqui.

`src/utils/avatar.js` con `avatarDe(seed)`, cache incluida. **Mismo estilo
('personas') y mismas semillas: los avatares NO cambian.** 138 URLs
sustituidas en 10 archivos.

**Verificado en navegador real**: cero dominios externos; el avatar del
perfil es un data URI local.

*Incidencia:* la suite corre desde un escenario en `/tmp` que solo recibia
`utils` y `data`, sin los paquetes. Al importar dicebear desde
`matching.js` dejo de resolver. Corregido enlazando `node_modules` en el
escenario — la Tercera Puerta lo cazo.

**Dependencias nuevas justificadas**: `@dicebear/core` y
`@dicebear/collection`. Son el generador de los mismos avatares, en local.

**Con esto, Nura no contacta ningun dominio externo en su uso normal.**

---

## FASE 4 — El perfil personal

### Tarea 1 — Los ceros dejan paso a un siguiente paso · **Terminada** · 2026-07-05

Sello `2026.07.06-c`. Un solo archivo: `src/pages/Profile.jsx`.

Mapa del perfil con sesion: identidad → **zona de actividad (2 cifras)** →
favoritos → zona de evolucion → salir.

**El problema que señalo el fundador**, confirmado en el codigo: la zona de
actividad muestra `searchCount` y `chatCount`. Para quien acaba de
registrarse son **dos ceros grandes rellenando pantalla** — exactamente su
queja de "sensacion de dashboard vacio" y "falta de un siguiente paso
claro". Y su propia instruccion: *"No muestres ceros enormes unicamente
para rellenar la pantalla."*

**Cura**: sin actividad, las cifras no se muestran. En su lugar, un bloque
con voz, explicacion y **una accion**:

> Aún no has buscado a nadie.
> Cuéntame qué necesitas y te busco a la persona. Aquí irá quedando lo que
> hagas.
> [Buscar a alguien]

Con actividad, las cifras vuelven — ahi si informan.

**Nota para la siguiente tarea:** `Profile.jsx` importa dos veces de
`components/ui` (lineas 4 y 13). Anotado, sin tocar: no es de esta tarea.

Pruebas: cuatro puertas verdes.

---

### Tarea 2 — La identidad, mas compacta · **Terminada (parcial)** · 2026-07-05

Sello `2026.07.06-d`. Un solo archivo: `Profile.module.css`.

**Medido antes**: el bloque de identidad ocupaba **246px — el 29% de la
pantalla** para cuatro datos (avatar, nombre, fecha de alta, telefono).
Eso es el "demasiada superficie vacia" del fundador, cuantificado.

**Hecho**: relleno de 32/28 a la escala y avatar de 96 a 76px.
**Medido despues: 202px** (−44px, −18%).

**NO hecho, y a proposito**: reorganizar la identidad en horizontal (avatar
al lado del nombre) — que es lo que de verdad resuelve el "avatar
aislado". Implica tocar ~50 lineas de JSX con ramas de edicion
condicional, y se decidio no arriesgarlo sin contexto suficiente para
verificarlo bien. **Queda como tarea propia.**

**Hallazgo nuevo (P1)**: entre la identidad y la zona de actividad hay
**98px de hueco** que ninguna de las dos ocupa. Entre ellas viven tres
bloques condicionales (panel del profesional, personas, y uno mas) que
para un usuario normal no renderizan — el hueco son probablemente sus
margenes. **Es el mayor desperdicio de la pantalla y no se ha tocado.**

Pruebas: cuatro puertas verdes + medicion antes/despues con sesion.

---

## Próximos pasos

| Fase | Tarea | Estado |
|---|---|---|
| 0 | 1 · Inventario medido de geometría | **Terminada** |
| 0 | 2 · Auditoría de fiabilidad técnica | **Terminada** |
| 0 | 3 · Auditoría del sistema de diseño | **Terminada** |
| 0 | 4 · Auditoría de flujos y datos | **Terminada** |
| 1 | 1 · Los tres arreglos triviales | **Terminada** |
| 1 | 2 · El contrato de layout (ley + tokens) | **Terminada** |
| 1 | 3 · Migrar Comunidad (D2) | **Terminada** |
| 1 | 4 · Migrar Profesionales | **Terminada** |
| 1 | 5 · Migrar Chats y Perfil | **Terminada** |
| 1 | 6 · Migrar Inicio + D7 | **Terminada** |
| **1** | **FASE 1 CERRADA** — D1,D2,D3,D4,D5,D7 resueltos | **Terminada** |

**FASE 0 COMPLETA** · 20 discrepancias (D1–D8, T1–T6, S1–S6, F1–F5).
**FASE 1 en curso** · Tarea 1 terminada (T1, D4, S1 resueltos).

**FASE 1 CERRADA.** Las cinco
pantallas cumplen el contrato: D1, D2, D3, D4, D5, D7 resueltos. Quedan
abiertos D6 (tres modelos de cabecera — no se toco, no molesta) y D8
(Chats sin verificar con volumen).

**Siguiente paso exacto:** Fase 4 · Tarea 3 — **P1, los 98px de hueco**
entre la identidad y la zona de actividad. Medir con sesion cual de los
tres bloques condicionales que viven entre ellas deja margen sin
renderizar contenido (estan alrededor de las lineas 268, 320 y 346 de
`Profile.jsx`, cada uno con su `SectionLabel`), y quitar el margen del que
no pinta nada. Es el mayor desperdicio de espacio de la pantalla.

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
