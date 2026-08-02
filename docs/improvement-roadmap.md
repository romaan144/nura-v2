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

### Tarea 3 — El indicador de perfil, honesto · **Terminada** · 2026-07-05

Sello `2026.07.06-e`. Un solo archivo: `src/pages/Profile.jsx`.

**P1 era un hallazgo FALSO y queda corregido.** No habia 98px de hueco: hay
un **bloque real de 87px con contenido** que no habia identificado al
contar clases. Medido hijo por hijo, aparecio.

Y es justo el que el fundador llamo provisional:
> "Tu perfil está al 60% · Mejora tus matches · Añade: hacer tu primera búsqueda"

**Dos problemas de fondo:**

1. **Mezclaba datos con actividad.** Los cinco campos del porcentaje eran
   nombre, telefono, **haber buscado**, **seguir a alguien** y foto. "Haz una
   busqueda" no es un dato del perfil que rellenar — por eso se sentia
   arbitrario y provisional.
2. **Duplicaba lo que yo mismo añadi en la Tarea 1.** El estado vacio de la
   zona de actividad ya invita a buscar, y encima con un boton. Dos bloques
   diciendo lo mismo, uno de ellos peor.

**Cura**: el indicador cuenta **solo datos del perfil** (nombre, telefono,
foto). La actividad la cubre el estado vacio, que para eso esta.

Pruebas: cuatro puertas verdes.

---

### Tarea 4 — La identidad en horizontal · **Terminada** · 2026-07-05

Sello `2026.07.06-f`. Archivos: `Profile.jsx` (2 lineas insertadas),
`Profile.module.css`.

**Es el primer cambio de esta fase que el fundador va a notar de verdad.**

El avatar estaba centrado y solo arriba, con el nombre, la fecha y el
telefono apilados debajo: el "avatar aislado" que señalo. Ahora el avatar
va a la izquierda y el texto a su lado, en columna.

| | original | ahora |
|---|---|---|
| Alto del bloque | **246px** (29% de la pantalla) | **112px** |
| Recorte | — | **−134px, −54%** |
| Inicio de la zona de actividad | 420 | **287** |

Los 133px recuperados hacen que quepa mucho mas contenido sin desplazar.

Ejecucion: envolver el texto en `.identityText` fueron **dos lineas
insertadas por numero de linea** (no regex), verificando antes que los
cierres estaban donde se esperaba. El JSX compilo a la primera.

Pruebas: cuatro puertas verdes + medicion antes/despues con sesion.

---

### Tarea 5 — Los bloques inferiores, al canon · **Terminada** · 2026-07-05

Sello `2026.07.06-g`. Un solo archivo: `Profile.module.css`.

Queja del fundador: "bloques inferiores separados de manera poco natural",
"acciones que no parecen pertenecer a una estructura unica".

**Causa encontrada**: estaban **fuera del canon de La Superficie**. Radio
`--radius-lg` en vez de la curva de la casa (18px), **sin borde y sin
sombra**. Por eso flotaban como piezas sueltas en vez de leerse como un
grupo: no compartian piel con ninguna otra tarjeta de la app.

Aplicada la receta: curva `--radius-md`, borde `--ink-border`, sombra de
reposo, rellenos a la escala. Y la zona de evolucion pasa del margen de
14px al gutter de 16 de la app.

Pruebas: cuatro puertas verdes.

---

## FASE 5 — El registro

### Tarea 1 — Los botones desactivados dicen que falta · **Terminada** · 2026-07-05

Sello `2026.07.06-h`. Un solo archivo: `src/pages/Login.jsx`.

Queja del prompt maestro: *"botones desactivados que no explican por que"*.
Confirmado: los tres botones del registro se desactivaban en silencio
(`phone.length < 9`, `code.length < 4`, `!name.trim()`).

Ahora aparece una pista — "Faltan 3 cifras" — **solo cuando ya has
empezado a escribir**. Explicarlo antes de que nadie lo intente seria
regañar de entrada; el nombre no la lleva porque ahi no hay nada que
contar.

Pruebas: cuatro puertas verdes.

---

### Tarea 6 — El perfil personal adopta el lenguaje del profesional · **Terminada** · 2026-07-05

Sello `2026.07.06-i`. Un solo archivo: `Profile.module.css`.

**El fundador: "no tiene el mismo nivel estetico que el perfil de los
profesionales".** Su comparacion era el diagnostico exacto.

**Medido:**

| | perfil profesional | perfil personal |
|---|---|---|
| Secciones con ritmo (`.section`) | **14** | **0** |
| Rotulos | `SectionLabel` | uno propio duplicado |

El profesional tiene un **sistema de secciones**: planas sobre el papel,
ritmo simetrico de `--space-20` y **una linea fina de separacion**. El
personal era una **pila de bloques sueltos**, cada uno con su tratamiento.

**Y un error de criterio mio, reconocido:** en la Tarea 5 les di a esos
bloques **tarjetas blancas con borde y sombra**. Eso los alejaba del
lenguaje que al fundador le gusta, en vez de acercarlos — el perfil
profesional NO usa tarjetas flotantes, usa secciones planas.

**Cura:** filas y zonas planas sobre el papel, separadas por linea fina,
con el gutter de 16 (estaban a 14) y el ritmo de `--space-20`. Las dos
cifras de actividad pasan a superficie tenue, que ahi si son piezas.
El rotulo propio se alinea con `SectionLabel`.

Pruebas: cuatro puertas verdes.

---

### Tarea 7 — El compas del perfil personal · **Terminada** · 2026-07-05

Sello `2026.07.06-j`.

**El fundador: "separaciones mas pequeñas que otras, secciones pegadas sin
separacion, no hay orden ni logica".** Medido contra el profesional:

| | profesional (el que gusta) | personal (antes) |
|---|---|---|
| Relleno por seccion | **20/20 en TODAS** | 14, 16, 20, 13, **0** |
| Huecos entre secciones | **0 en todas** | 12, 16, 20 |
| Simetria | perfecta | una con 14 arriba / 8 abajo |

**Causa**: varios hijos traian margen y relleno **en estilo en linea**, que
gana siempre al CSS. Por eso el compas del ciclo anterior no basto: se
aplicaba, pero los estilos en linea lo pisaban.

**Cura**: una sola regla sobre los hijos directos del scroll, con
`!important` a proposito — porque el compas debe gobernar a todos por
igual. Mas cinco margenes en linea retirados del JSX.

**Medido despues: 20/20 en las ocho secciones, cero huecos, linea en cada
separacion. Identico al perfil profesional.**

Pruebas: cuatro puertas verdes + medicion comparada de los dos perfiles.

---

## FASE 6 — Los estados de la conversacion (seccion 2 del prompt maestro)

### Tarea 1 — El error de red · **Terminada** · 2026-07-05

Sello `2026.07.06-k`. Un solo archivo: `src/pages/Home.jsx`.

**Antes**, si fallaba la busqueda:
> "Algo fue mal. Inténtalo de nuevo."
> "⚠️ Failed to fetch"

Dos problemas, ambos contra las reglas del prompt maestro:
1. **Mostraba el error tecnico al usuario** (`err.message`) — "evita
   tecnicismos".
2. **Decia "intentalo de nuevo" sin dar forma de hacerlo**: habia que
   reescribir la consulta entera.

**Ahora**: se distingue la falta de conexion de un fallo del sistema, el
mensaje habla en la voz de Nura, y **el reintento se ofrece como chip con
la consulta original** — un toque y se repite, sin reescribir nada.

> Sin red: "Parece que te has quedado sin conexión. Cuando vuelvas, lo
> intento otra vez."
> Fallo nuestro: "Se me ha atascado la búsqueda. No es culpa tuya —
> inténtalo otra vez."

Pruebas: cuatro puertas verdes.

**Pendientes de la seccion 2**: busqueda cancelada, resultados parciales,
repeticion de una busqueda anterior, y el estado de carga tras mostrar
resultados.

---

### Tarea 2a — La tarjeta que tumbaba la pantalla · **Terminada** · 2026-08-01

Sello `2026.07.06-l`. Un solo archivo: `src/components/HelperCardTall.jsx`.

**Encontrado midiendo, no leyendo.** Al preparar la Tarea 2 se midio el DOM
con Chromium real y la busqueda de *"logopeda infantil"* devolvia
**`Error de la aplicacion · React error #31`**: la pantalla entera caida.

**Causa**: `experience` llega en **dos formas** segun el perfil — texto
("10 años") en unos y **trayectoria (array de puestos)** en otros. La
tarjeta lo pintaba como texto. React no renderiza un objeto.

| consulta | `experience` del primero |
|---|---|
| logopeda infantil | **ARRAY[2]** ← caia |
| fontanero urgente | `undefined` |
| cuidar a mi madre | `undefined` |

**CORRECCION (2026-08-01, al construir el censo de la Cuarta Puerta):**
esta cifra estaba mal. No eran dos perfiles: son **12 de 123**, ids 1-12,
repartidos por **9 categorias** — practicamente todo el marketplace. Y
**ninguno** trae `experience` como texto: o es array o no esta.

Lo medi a traves de busquedas y por eso solo vi logopedia: los perfiles de
demo (`id >= 2000`) ganan al ranking en todas las categorias salvo en
logopedia, donde solo existen esos dos. **El crash estaba latente en toda
la app**; en logopedia estaba garantizado. Medir por el camino del usuario
encuentra lo que se ve; medir el dato encuentra lo que hay.

Consecuencia honesta de la cura: la pildora de experiencia **no se pinta
para nadie**, porque nunca tuvo una fuente valida. Antes se pintaba mal o
mataba la pantalla.

**Cura**: `experienciaTexto` se deriva una vez y solo se pinta si es texto.
Es el unico sitio de la app con este patron (grep verificado).

**Por que ninguna puerta lo vio**: el smoke monta las pantallas con SSR
pero **no ejecuta una busqueda**. El fallo vivia detras de una interaccion.

---

### Tarea 2b — Los chips que nunca se pintaron · **Terminada** · 2026-08-01

Sello `2026.07.06-l`. Un solo archivo: `src/pages/Home.jsx`.

**El hallazgo mas grande del roadmap hasta ahora, y estaba a plena vista.**

Home **producia chips en nueve sitios y no los pintaba en ninguno**. El
unico que renderizaba `msg.chips` era `Chat.jsx` — otra pantalla.

Medido en navegador antes de tocar nada:

| caso | lo que decia Nura | botones reales |
|---|---|---|
| invitado nuevo | "¿Para quien necesitas ayuda?" | **ninguna respuesta** |
| consulta incomprensible | "¿me lo cuentas con otras palabras?" | **ninguno** |

Nura hacia preguntas que **no se podian contestar**. Quedaban invisibles:
La Pregunta, Los Dos Silencios, El Pulso, La Confirmacion Humana, los
ejemplos del onboarding y **el chip de reintento de la Tarea 1** — que por
tanto nunca llego a existir en pantalla. `comprehensionChips` y
`handleComprehensionChip` (La Comprension Visible) son codigo muerto:
quedan censados, no se tocan en esta tarea.

**Indicio de que se perdio en un refactor**: la autocuracion que retira los
chips viejos al empezar un turno nuevo ya estaba escrita.

**Tres piezas inseparables:**

1. **La rama que faltaba**, con `.refineRow` / `.refineChip` — la pildora
   que Home ya tenia. Cero CSS nuevo. Va **antes** que las sugerencias:
   quien tiene una pregunta delante no necesita ademas tres ejemplos
   genericos (evita los seis botones apilados).
2. **Destino real para cada chip.** Todos caian en `handleSend`, que los
   trata como BUSQUEDA. Verificado que cinco no los interceptaba nadie:
   `Escribir a X`, `Ampliar la zona`, `Avisame cuando tengas a alguien`,
   `Si, busca otra persona`, `Ya lo resolvi de otra forma`. Encenderlos sin
   esto habria creado callejones nuevos. `Ampliar la zona` responde con
   honestidad — el vacio no es de zona, es de oferta.
3. **`text` → `msg`**: el chip de reintento solo existia si la busqueda
   venia de otro chip; al escribir a mano, `text` era `undefined`. La misma
   variable metia `undefined` en `nura_demanda_no_cubierta`.

**Medido despues, con toque real:**

| caso | pantalla | chips | al tocarlos |
|---|---|---|---|
| invitado · La Pregunta | viva | 3 | responde y continua |
| incomprensible · Dos Silencios | viva | 3 | **lanza una busqueda real** |
| logopedia (antes caida) | **viva** | ok | — |
| fontanero · 4 resultados | viva | sin regresion | — |

Pruebas: cuatro puertas verdes + medicion en Chromium antes y despues.

### Tarea 2c — La busqueda cancelada · **Terminada** · 2026-08-01

Sello `2026.07.06-n`. `src/pages/Home.jsx`.

**Reproducido en navegador antes de tocar nada**, los dos caminos:

| | antes | ahora |
|---|---|---|
| hablar mientras busca | *"tragado en silencio"* — el texto se quedaba en el input y no pasaba nada | el mensaje entra y el input se limpia |
| reiniciar a mitad | *"Mi recomendacion es Antoni"* aparecia **bajo el saludo nuevo** | saludo limpio, sin restos |

**El guardia de secuencia (`sid`/`alive`) ya existia y funcionaba.** Solo le
faltaban dos llamadas:

- **El reinicio no cancelaba**: no incrementaba `searchSeqRef` ni liberaba
  `loading`. El usuario borraba la conversacion y dos segundos despues le
  llegaba una recomendacion que ya no habia pedido. Ahora reiniciar
  incrementa la secuencia, para el pensando y limpia `correctionRef` (una
  enmienda a medias no debe colarse en la conversacion siguiente).
- **`if (loading) return` se traga el mensaje**: se cambia por
  `if (loading) stopThinking()`. Nura es una conversacion, no un
  formulario: si hablas otra vez mientras busca, te escucha a ti y suelta
  lo anterior. El guardia ya mataba la busqueda vieja; solo sobraba la
  burbuja huerfana de "Dame un segundo".

---

### Tarea 2d — Los resultados parciales · **Terminada** · 2026-08-01

Sello `2026.07.06-n`. `src/pages/Home.jsx`.

La rejilla de alternativas se dimensionaba con `repeat(alts.length, 1fr)`:
**el tamaño de una tarjeta dependia de cuantas hermanas tuviera**.

**Medido en Chromium, 390px:**

| caso | columnas | ancho de la tarjeta | avatar |
|---|---|---|---|
| logopedia (1 alt) — antes | `358px` | **358px** | 62px |
| logopedia (1 alt) — ahora | `114px 114px 114px` | **114px** | 62px |
| fontanero (3 alts) | `114px 114px 114px` | 114px | 62px |

Un avatar de 62px flotando en una tarjeta del triple de ancho, y le pasaba
a **toda la categoria de logopedia** — la unica con dos profesionales, y
una de las tres sugerencias que la app ofrece al entrar.

**Cura (NURA DISEÑO: sistema, no pantalla)**: la rejilla es **siempre de
tres**. Una tarjeta pequeña mide lo mismo tenga tres hermanas o ninguna.
El caso lleno no cambia: 114px antes y despues.

**Y la concordancia**: con una sola alternativa decia *"tambien
encajarian"*. Ahora *"Tambien encajaria:"*. Un plural mal puesto es lo que
delata que detras hay una maquina.

**Deuda anotada**: con **un solo** resultado los chips siguen ofreciendo
"Mas cerca / Mejor valorado / Mas barato" — ordenar una lista de uno es
teatro. Hoy no se alcanza buscando (toda categoria tiene >= 2), pero **si
filtrando por Online**. Candidata propia, no se toca aqui.

---

### Tarea 2e — La Comprension Visible se retira; La Correccion se enciende · **Terminada** · 2026-08-01

Sello `2026.07.06-m`. Un solo archivo: `src/pages/Home.jsx`.

Al censar el codigo muerto aparecieron **dos** features, no una — y la
segunda era la buena.

**Retirada · La Comprension Visible.** Chips que mostraban lo entendido
("Cuidadora", "Para tu madre", "Vive sola") para confirmarlos. Se retira
por cuatro razones, no por estar muerta:

1. **La correccion era de un solo sentido.** `if (off) return`: destocar un
   chip no quitaba la palabra del analisis ni devolvia los resultados
   anteriores. La feature que existia "para corregirme" no se podia
   corregir.
2. **Reescribia las tarjetas en silencio.** Tocar un chip relanzaba el
   match y cambiaba las personas ya en pantalla **sin una linea de prosa
   que lo explicara** — justo lo que La Gramatica de la Recomendacion
   prohibe.
3. **Confirmar lo ya acertado no da nada.** No habia "no es eso": solo
   "si, eso". El valor estaba en la enmienda, y la enmienda no estaba.
4. **Densidad.** Cinco botones mas en cada busqueda, recien resuelto el
   problema de los seis apilados en la 2b.

**Encendida · La Correccion.** El motor **ya funcionaba**: `correctionRef`
se consume en `handleSend` y fusiona consulta original + enmienda
(`"fontanero urgente. mejor por la tarde"`). Lo unico que faltaba era
**como entrar**: nadie llamaba a `startCorrection`.

Se le da su puerta: el chip **`↺ No es lo que buscaba`** en la fila de
ajuste. Los otros tres chips reordenan lo mismo; este admite que lo mismo
no sirve. Cubre el hueco real que quedaba: Los Dos Silencios atiende "no
te he entendido", pero **no habia camino para "te entendi y me equivoque"**
— que es el fallo mas frecuente de un buscador de personas.

**Medido, no deducido** (Chromium, 390px, control contra real):

| fila de ajuste | alto | lineas |
|---|---|---|
| 3 chips (antes) | **103px** | 2 |
| 4 chips (ahora) | **103px** | 2 |

El cuarto chip ocupa hueco que ya estaba vacio: **cero altura añadida**.

**Bucle completo verificado en navegador**: tocar el chip → Nura responde
"Vale — dime que he entendido mal" → **el foco salta al input** → se
escribe la enmienda → busqueda fusionada con resultados reales.

`no-unused-vars` en Home: **19 → 17**. La retirada no deja huerfanos.

**Deuda anotada**: la enmienda "mejor si es mujer" no altera el orden — el
analisis no lee preferencia de genero. Es calidad de matching, no de
cableado. Candidata propia.

---

**Hallazgo abierto para la 2d**: con 2 resultados, la rejilla de
alternativas mide **358px con un solo hijo** — una tarjeta estirada a todo
el ancho donde deberian ir tres. Es el caso de resultados parciales, ya
medible ahora que la pantalla no se cae.

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
pantallas cumplen el contrato: D1, D2, D3, D4, D5, D7 resueltos.
**D6 y D8 cerrados el 2026-08-01** (sello `2026.07.07-b`): D8 verificada
con 18 conversaciones reales —cumple el contrato, hueco final de 20px
exactos— y D6 reducida a un modelo (`PageHeader`) con dos excepciones
declaradas, tras retirar una cabecera fantasma en `Chats.module.css`.
**Las 20 discrepancias del prompt maestro quedan resueltas o declaradas.**

**Siguiente paso exacto:** Fase 6 · Tarea 2c — la **busqueda cancelada**
(el reinicio no cancela: no incrementa `searchSeqRef` ni libera `loading`,
y enviar durante la carga se traga el mensaje en silencio) y **2d** — los
**resultados parciales** (rejilla de 358px con un solo hijo; chips que
prometen ordenar una lista de dos).

### FASE 5 · Tarea 2 — La separacion entre usuario y profesional · **Parcial** · 2026-08-01

Sello `2026.07.06-o`. `src/pages/Profile.jsx`, `src/pages/RegisterHelper.jsx`.

**Recorrida el alta profesional entera en navegador**, respondiendo las seis
preguntas como una logopeda real. Lo que salio:

| quien | preguntas respondidas | su perfil decia |
|---|---|---|
| usuario basico | **2** (nombre, telefono) | **67%** |
| profesional | **6** (nombre, especialidad, formacion, zona, tarifa, diferencial) | **33%** |

**Al que mas daba se le decia que era el que menos tenia.** El medidor
contaba `[name, phone, avatar]` — la regla de un usuario aplicada a un
profesional, que no tiene telefono por ese camino y cuyos seis campos no
se contaban. Y la coletilla decia *"Mejora tus matches"*: un profesional
no busca match, **el ES el match**.

**Curado:**

- El medidor tiene **regla propia** para el profesional: sus seis campos
  mas la foto. Medido despues: **33% → 86%**. El usuario basico no se
  mueve (67%, verificado). Un alta interrumpida marca 29% y **nombra lo
  que falta**: "tu formacion · tu zona · tu tarifa · que te diferencia".
- Coletilla propia: *"Mas completo, mas contactos"*.
- El alta ya no **pisa** la cuenta previa: `login({...cuenta anterior, ...})`.
  Antes, un usuario con telefono que se daba de alta como profesional
  **perdia el telefono**.
- Se anota `joined`. Antes el profesional no tenia fecha de alta y
  *"En Nüra desde…"* no le aparecia. Verificado: ahora si.
- `answers.experience` **no se pregunta en ninguna parte** y la `bio` se
  construia con el: codigo muerto que se lleva media biografia por delante.
  Se retira la referencia.

**PENDIENTE — decision de negocio, no tecnica.** Queda la mitad de fondo:
hoy hay **dos puertas que crean cuentas de forma distinta**. Medidas en el
perfil de invitado, ambas **308×44**, 54px de separacion, identicas salvo
el relleno:

- `Crear cuenta gratis` → `{name, phone, joined}`
- `Quiero ser Profesional` → `{name, isHelper, helperProfile, joined}` — **sin telefono**

El prompt maestro pide que el alta profesional *"no se mezcle con el
registro basico"*. Dos lecturas, con consecuencias opuestas en el embudo:

- **A · registro basico primero.** Tocar "Quiero ser Profesional" pasa por
  `/login` y vuelve (`nura_return_to` ya existe, ~5 lineas). Una sola forma
  de cuenta. Añade friccion **al lado escaso del marketplace**.
- **B · el alta absorbe el telefono.** Una pregunta mas en el mismo chat
  calido, sin desvio. Menos friccion, pero se mantienen dos caminos.

No se implementa ninguna sin decision del fundador: afecta a la captacion
de oferta.

**Deuda anotada**: `formation` se pregunta y solo viaja a `ai_data` — no
entra en la bio publica. Candidata propia.

---

**Siguiente paso anterior, aun pendiente:** Fase 5 · Tarea 2 — la **separacion entre
usuario y profesional**. El prompt maestro: "el alta profesional requiere
mas informacion y no debe mezclarse con el registro basico". Revisar
`RegisterHelper.jsx` y como se llega a el desde el perfil de invitado, que
hoy ofrece los dos caminos con el mismo peso visual.

---

## El titular de la trayectoria · **Terminada** · 2026-08-01

Sello `2026.07.06-q`. `src/components/HelperCardTall.jsx`, `src/utils/matching.js`.

Consecuencia directa del censo. Al arreglar el crash deje la pildora de
experiencia sin pintar para nadie — correcto, pero desperdiciado: **12
perfiles llevan trayectoria real dentro** y la tarjeta no decia nada.

La ficha (`/helper/:id`) ya pinta la trayectoria entera en linea de tiempo
(comprobado — mi sospecha de que era invisible era falsa). Lo que faltaba
era **su titular en la tarjeta**: los periodos son uniformes
(`"2015–presente"`), asi que el año mas antiguo da los años de oficio.

Medido antes de escribirlo, los 12 valores derivados: de 4 a 19 años,
ninguno absurdo. Verificado en navegador: *"7 años"* en la logopeda, y los
perfiles sin trayectoria siguen mostrando *"Responde en < 1 hora"* sin
cambios.

### Y un comentario que mentia en el corazon del motor

`matching.js` decia: *"Demo helpers (id >= 2000) get priority boost — rich
profiles, verified data"*. **Medido, es al reves:**

| grupo | n | campos | trayectoria |
|---|---|---|---|
| manuales (`id < 2000`) | 12 | **37.1** | **1.7** |
| demo (`id >= 2000`) | 110 | 16.1 | **0** |

El boost de **+80** va al grupo mas pobre, y pesa **el doble que acertar la
categoria** (+40). Comentario corregido con lo medido.

**No se toca el ranking.** Medido el impacto real con un motor paralelo sin
el boost: solo cambia el primer recomendado en **3 de 24** consultas
doradas — no es un veto, los demas terminos deciden. Perfil rico como
primero: 1 de 24 con boost, 4 de 24 sin el. Es una mejora modesta y toca el
corazon del producto y de la demo: **decision del fundador**, no mia.

---

## La coma que rompio 110 fichas · **Terminada** · 2026-08-01

Sello `2026.07.06-r`. `src/data/helpers.js`, `src/pages/HelperProfile.jsx`,
`scripts/smoke.mjs`.

Encontrada **barriendo en navegador** las pantallas que nadie habia
conducido esta sesion. `/helper/2020` mostraba 195 caracteres frente a los
3.355 de `/helper/3`. No era una ficha pobre: era **el error boundary**
("Algo fue mal por mi lado"). Mi barrido lo habia marcado "ok" porque
buscaba otro texto de error — corregido el detector, y a mirar.

**La causa, tras aislarla:** una **coma suelta** en `helpers.js`, entre el
perfil `id=12` y el `id=2001`:

```
  },
,        ← una elision: deja un AGUJERO en el array
  {
```

`HELPERS` declaraba 123 elementos y tenia **122 reales**, con un agujero en
el indice 12. Y ahi esta la trampa: **`filter`, `map` y `forEach` saltan los
agujeros; `find` los pisa** y entrega `undefined`. Como
`HelperProfile` resuelve con `HELPERS.find(x => String(x.id) === String(id))`:

| ids | posicion | resultado |
|---|---|---|
| 1–12 (manuales) | antes del agujero | `find` acierta → **ficha viva** |
| 2001–2128 (110 perfiles) | despues | `find` pisa el hueco → **pantalla caida** |

**Por que no se veia**: al TOCAR una tarjeta, la ficha recibe el perfil por
`location.state` y `find` no llega a ejecutarse. Solo rompia por **enlace
directo en frio** — es decir, exactamente el caso *"comparte tu perfil"*,
que en un marketplace es como un profesional trae a sus propios clientes.

**Curado en tres capas:**

1. La coma. Ahora: 122 declarados, 122 reales, cero agujeros.
2. `find(x => x && ...)` — un agujero no debe volver a tumbar una pantalla.
3. **Guardia permanente** en la Cuarta Puerta: el censo verifica que el
   dataset sea denso. Verde: *"Dataset denso [122 perfiles, sin agujeros]"*.

Verificado en frio despues: `/helper/2020`, `/helper/2080` y `/helper/2120`
vivas (1.5-1.7k caracteres cada una).

**Leccion**: ninguna puerta miraba el dataset como estructura. El censo de
la sesion anterior paso los 123 por la tarjeta con `for...of` — que tambien
salta agujeros. Un guardia puede estar verde y no ver el hueco por el que
se cae la casa.

---

## El enlace antiguo tiene puerta · **Terminada** · 2026-08-01

Sello `2026.07.06-s`. `Chat.jsx`, `HelperProfile.jsx`, `IntroLetter.jsx`.

Barrido en frio de **las 23 rutas** (pestaña nueva, sin visitar Home antes
— el camino del enlace compartido, que es donde vivia la coma). Con el
detector de error corregido: el anterior no reconocia el texto real del
error boundary y por poco pierdo el fallo de las 110 fichas.

**Tres pantallas, una misma situacion, tres tratos distintos:**

| ruta | antes |
|---|---|
| `/chat/9999` | **logo latiendo para siempre** — 0 caracteres, sin cabecera ni salida |
| `/helper/9999` | *"Perfil no encontrado."* a secas |
| `/intro/9999` | *"Perfil no encontrado."* a secas |

El chat era el peor: `getHelperById` no devolvia a nadie y **nada apagaba
la espera** (el efecto no tenia `.catch` ni apagaba el estado cuando la
respuesta llegaba vacia). Prometia algo que no iba a llegar. Un callejon
sin puerta es peor que un error — es la misma queja que cerro la Fase 6
Tarea 1 con el error de red.

**Cura (NURA DISEÑO: una situacion, una respuesta, en toda la app):** las
tres dicen lo mismo, con la voz de Nura y **una salida**:

> 🤍 Esta persona ya no está en Nüra.
> Puede que el enlace sea antiguo. Puedo buscarte a alguien ahora mismo.
> **[Buscar a alguien]**

El chat conserva el logo latiendo mientras **de verdad** busca, y solo
entonces pasa al estado honesto.

**Verificado:** barrido completo, **0 de 23 rutas con problema** (antes 3).

**Anotado, sin tocar**: `ALL_PROFILES` en `companies.js` es un array vacio
sin consumidores — marcador muerto, inofensivo.

---

## El español de la propia app · **Terminada** · 2026-08-01

Sello `2026.07.06-t`. `Siguiendo.jsx`, `Explore.jsx`.

Buscando botones mudos aparecieron **tres errores de castellano visibles**
en producto en español:

1. **`profesionals`** (Siguiendo). `profesional{n !== 1 ? 's' : ''}` —
   en castellano la palabra acabada en consonante hace plural en **-es**.
   Con dos seguidos, la pantalla decia *"2 profesionals guardados"*.
2. **`guardarlo aquílo aquí.`** (Siguiendo, estado vacio). Texto roto de un
   pegado a medias. `Favorites.jsx` tiene la frase **correcta** — las dos
   pantallas ya han divergido.
3. **`hace 1 horas`** (Explore). El numero y su plural salian de **dos
   tiradas de dado distintas**: `${rand()} hora${rand() > 1 ? 's' : ''}`.
   Verificado tras la cura: **0 concordancias rotas en 30 recargas**.

Censadas las cuatro pluralizaciones ingenuas del codigo (`? 's' : ''`): las
de `notifications.js` son correctas (palabras acabadas en vocal).

### Sobre el metodo: tres falsos positivos mios antes de acertar

El detector de botones mudos marco `Para mí | Para alguien de mi familia |
Para mi hogar o negocio` como muertos en **las cinco pantallas**. Falso:
Home queda montado detras de cada pantalla con `display:none`, y sus
botones miden 0×0 — ni clicables ni enfocables. Luego `offsetParent` fallo
con `position:fixed`, y despues un filtro de longitud (`<40`) descarto
todos los botones reales de Explorar, cuyas etiquetas son largas.

Tres veces el instrumento estaba mal, no la app. Queda anotado porque el
patron del dia se repite: **una medicion que acusa a todo a la vez suele
estar acusando al medidor**.

**Anotado, sin tocar**: `Favorites.jsx` **no esta enrutada** — pantalla
huerfana que duplica Siguiendo con otro almacen. Ya han divergido (una
tiene el plural roto, la otra el texto roto). Retirarla o darle puerta es
decision del fundador.

---

## El bloqueo de lanzamiento deja de ser un aviso · **Terminada** · 2026-08-01

Sello `2026.07.06-u`. `scripts/preflight.mjs`.

El unico punto marcado **[BLOQUEO DE LANZAMIENTO]** llevaba desde su censo
siendo un parrafo en prosa: *"REVISION MANUAL OBLIGATORIA"*. Un aviso se
lee y se sigue adelante. Y ademas se quedaba corto.

**La exposicion completa, auditada:**

| via | quien | que puede hacer |
|---|---|---|
| `PATCH /helpers` (`claudeApi.js` ×2) | cualquiera con la clave publica | reescribir `ai_data` y `chat_log` de cualquier profesional |
| `POST /helpers` (`RegisterHelper.jsx`) | idem | dar de alta **profesionales falsos** |
| `GET /helpers?select=*` (×3) | idem | leerse `chat_log` — **las conversaciones de los usuarios** |

Lo tercero no estaba censado y es lo que mas me preocupa: `normalize()`
**nunca lee `chat_log`**, pero `select=*` se lo descarga igual al navegador
de cada visitante. En Nura esas frases no son metadatos — son *"mi madre
vive sola"*, *"mi hijo no pronuncia la R"*.

**Curado:** el aviso pasa a **sonda real** en la quinta puerta. Inofensiva:
`PATCH` sobre `id=-1`, que no existe. Si el RLS bloquea, 401/403; si esta
abierto, 204 tocando cero filas. Nunca modifica un dato. Y el fallo trae
**el SQL listo para pegar**, no una tarea de investigacion.

### El falso verde, que casi se queda dentro

La primera version dio **`✓ RLS: el rol anonimo NO puede escribir`**. Mentira:
el 403 venia del proxy de egress de la maquina
(`x-deny-reason: host_not_allowed`), y la peticion **no llego a salir**.

Un verde que no significa nada es peor que no tener sonda: crea confianza
falsa justo en el unico punto que bloquea el lanzamiento. Ahora la sonda
exige **prueba positiva de que la respuesta viene de Supabase** (sin
cabecera de denegacion del proxy, y cuerpo con forma de error de PostgREST).
Si no puede probarlo dice **SIN COMPROBAR**, con el motivo:

```
~ RLS: SIN COMPROBAR — la respuesta (HTTP 403) no viene de Supabase.
   Motivo probable: host_not_allowed.
```

Añadido tambien un aviso de `select=*` y una nota manual sobre el INSERT,
que la sonda no puede probar sin crear una fila.

**Leccion**: una puerta debe distinguir *"he comprobado y esta bien"* de
*"no he podido comprobar"*. Colapsar las dos en un tick verde es el peor
fallo posible en un gate.

---

## El filtro Online, de ida y vuelta · **Terminada** · 2026-08-01

Sello `2026.07.06-v`. `src/pages/Home.jsx`, `src/App.jsx`.

Deuda que yo mismo habia anotado ("ordenar una lista de uno es teatro").
Al abrirla, la rama tenia **cuatro** fallos, no uno:

1. **Sin vuelta atras.** `setLastMatches(online)` pisaba el conjunto con el
   subconjunto: filtrar por Online era irreversible. Es la misma trampa de
   un solo sentido que retiramos en La Comprension Visible.
2. **Concordancia rota.** Con un resultado decia *"1 de ellos **ofrecen**
   sesiones online"*. Tercer error de castellano de la jornada, misma
   familia que *"profesionals"* y *"hace 1 horas"*.
3. **Teatro de ordenacion.** Con uno o cero, los chips seguian ofreciendo
   "Más barato / Más cerca / Mejor valorado". Ordenar una lista de uno
   responde *"X es el mas economico"* sobre el unico que hay.
4. **Callejon sin salida.** *"Ninguno de estos profesionales ofrece sesiones
   online."* se emitia **sin chips**: fin del camino.

**Curado:** un `todosRef` guarda el conjunto sin filtrar; nace el chip
**`👥 Ver todos`**; los chips de orden solo aparecen con **dos o mas**
(`ordenar(n, propios)`); y el vacio recibe salida (`No es lo que buscaba`).

**Verificado en navegador, ida y vuelta completa:**

```
buscar → ordenar → Online   → "4 de ellos ofrecen sesiones online."  + Ver todos
                 → Ver todos → "Aquí los tienes todos otra vez."
```

### Y el sello de build deja de bloquear el lanzamiento

La quinta puerta marcaba `console.log('[Nüra] build', NURA_BUILD)` en
`App.jsx` como resto de desarrollo. **No lo es**: el sello es como se sabe
que hay desplegado, y no lleva dato de nadie. La puerta ya tenia su via
declarada (`preflight-ok` en la misma linea); al sello nunca se le puso.
Una puerta que grita por algo intencionado enseña a ignorarla.

Preflight queda con **un solo bloqueo, y es el correcto**: `DEMO_MODE`,
que debe seguir rojo hasta que el fundador lo apague.

**Anotado, sin tocar**: los chips de turnos anteriores siguen activos en el
historial (cada mensaje pinta su propia fila). Es coherente con un chat,
pero se acumulan. Tocar eso es decidir si el pasado de la conversacion
sigue siendo interactivo — decision de diseño, no de arreglo.

---

## "necesito" contenia un "si" · **Terminada** · 2026-08-01

Sello `2026.07.06-w`. `src/pages/Home.jsx`.

Buscando **caminos de ida sin vuelta** (el patron que compartian tres
fallos de la jornada) aparecio el peor defecto de uso de todo el dia.

### El interceptor que se tragaba una de cada cinco peticiones

```js
if (t.includes('sí') || t.includes('si') || … || t.includes('ese') || t.includes('bien'))
```

**Subcadena, no palabra.** `'si'` esta dentro de *nece**si**to*,
*p**si**cologa*, *fi**si**oterapeuta*, ***si**on*. `'ese'` dentro de
*m**ese**s*. `'bien'` dentro de *tam**bien***.

Como la rama solo vive tras una primera busqueda, el efecto era: **pides
otra cosa y Nura responde "es una muy buena eleccion"** sobre la persona
anterior. La busqueda no llegaba a ejecutarse.

**Medido sobre las consultas doradas: 21%** se lo tragaba.

| consulta | por que |
|---|---|
| Necesito un cerrajero urgente | nece**si**to |
| mi madre tiene alzheimer y vive sola, necesito ayuda… | nece**si**to |
| Psicóloga cerca de mí | p**si**cologa |
| fisioterapeuta a domicilio | fi**si**oterapeuta |
| Sesión de entrenamiento personal | **si**on |

Las dos primeras son las mas graves del catalogo: una urgencia y la
consulta mas delicada de la suite.

**Cura**: `palabra(...)` con limite de letra Unicode (`\p{L}`, flag `u`) y
la regla de que **un asentimiento es corto** (≤ 6 palabras). Una peticion
de doce palabras no es un "si". `/\bno\b/` ya usaba limite de palabra —
la tecnica estaba en el archivo, sin aplicar al resto.

**Verificado**: 21% → **0%** en las doradas, y en navegador 5/5 —
"Necesito un cerrajero urgente" busca; "Sí, perfecto" y "vale" confirman.

### Y la correccion que yo mismo deje de un solo sentido

`startCorrection` (Tarea 2e, de esta misma jornada) era **un modo
invisible**: el campo tenia aspecto normal y llevaba la consulta anterior
pegada por delante, sin señal y **sin salida**.

Reproducido: buscas *"clases de inglés"*, tocas `No es lo que buscaba`,
escribes *"necesito un fontanero urgente"* — y la consulta real pasaba a
ser *"clases de inglés. necesito un fontanero urgente"*, que el analizador
clasifica como **clases**. Pedias un fontanero y te daban un profesor.

**Tres capas de cura:**

1. **Visible**: el campo pasa a decir *"Dime qué he entendido mal…"*.
2. **Con salida**: chip `Era otra cosa`, que apaga el modo.
3. **Sin secuestro**: una enmienda *afina* ("mejor por la tarde" → `otro`,
   se fusiona); una **categoria distinta** es una pregunta nueva y se deja
   intacta. Comprobado en navegador con `cambiaDeOficio: true`.

**Nota de metodo**: al verificar la capa 3 la pantalla seguia dando un
profesor de ingles y estuve a punto de dar la cura por rota. La
instrumentacion demostro que la guarda SI funcionaba — lo que fallaba era
el interceptor del `si`, un fallo distinto y mayor escondido detras. Sin
instrumentar habria "arreglado" lo que ya estaba bien.

---

## Un `await` que hacia invisible a cada profesional · **Terminada** · 2026-08-01

Sello `2026.07.06-x`. `RegisterHelper.jsx`, `scripts/smoke.mjs`.

**El peor fallo de negocio encontrado hasta ahora**, y era una palabra.

```js
const specialtyAnalysis = analyzeNeed(answers.specialty || '')   // sin await
const inferredCategory = specialtyAnalysis.categoria !== 'otro' ? … : 'otro'
```

`analyzeNeed` devuelve una **promesa**. Sin `await`:

| paso | valor |
|---|---|
| `specialtyAnalysis` | `Promise` |
| `.categoria` | `undefined` |
| `inferredCategory` | `undefined` (porque `undefined !== 'otro'` es **cierto**) |
| `JSON.stringify({category: undefined})` | **`{}`** — la clave desaparece |

El alta viajaba a Supabase **sin categoria**. Y el emparejador filtra por
categoria exacta:

```js
compatibles = finalPool.filter(h => toApp(h?.category) === analysis.categoria)
```

Resultado: **todo profesional dado de alta desde la app quedaba invisible
en todas las busquedas, para siempre.** Respondia seis preguntas, obtenia
su perfil, y no recibia un solo contacto — sin error en consola, sin aviso,
y con las cuatro puertas verdes. En un marketplace es el fallo mas caro
posible: se rompe el lado escaso, la oferta, justo despues de captarla.

**Cura**: `await`, y `specialtyAnalysis?.categoria || 'otro'` (que ademas
corrige la logica invertida). Verificado: *Logopeda infantil* → `logopedia`,
*Fontanero* → `tecnico`, *Abogada laboralista* → `legal`, *Malabarista* →
`otro`.

**Y la formacion, que tampoco se veia**: se preguntaba en el alta y solo
viajaba a `ai_data`. Es la credencial que gana la confianza — ahora entra
en la bio publica junto al diferencial.

### Guardia permanente: la promesa cruda

Añadido a la Cuarta Puerta: ninguna llamada a `analyzeNeed` sin `await`.
**Probado devolviendo el bug a proposito** — lo caza, lo señala con archivo
y linea, y sale con codigo 1. (Primer intento: falso positivo en un
comentario JSDoc; se excluyen lineas de comentario.)

### Dos cosas que decidi NO tocar

- **La rama de refinamiento** del interceptor, que deje señalada ayer.
  Medida: **0 de 24** consultas doradas la disparan — el arreglo de
  `palabra()` ya la habia cerrado, y las subcadenas de dentro son
  inalcanzables sin que `isRefinement` sea cierto primero. Sin cambios.
- **La preferencia de sexo** ("mejor si es mujer"). El dataset **no tiene
  campo de sexo** (39 campos, ninguno) y el analizador no lee la
  preferencia. Implementarla exigiria inferir el sexo del nombre de pila
  — poco fiable con "Fátima Benali" o "Antoni" — y **filtrar profesionales
  por sexo inferido es una decision de producto y legal**, no un arreglo
  silencioso. Requiere: (a) campo autodeclarado por el profesional, (b)
  decision del fundador sobre si ofrecerlo y en que categorias.

---

## La demo escribia en produccion, y el alta mentia · **Terminada** · 2026-08-01

Sello `2026.07.06-y`. `src/pages/RegisterHelper.jsx`.

Recorriendo el ciclo completo del profesional autodado de alta — de donde
ya habian salido tres fallos — aparecieron los dos ultimos, encadenados.

### 1 · Cada demo creaba un profesional real y permanente

`saveHelperToSupabase(newAnswers)` se llamaba **sin puerta de `DEMO_MODE`**.
Cada recorrido del alta escribia una fila en la base de datos viva.

Y lo urgente: **hasta el sello `-x` esas filas eran inofensivas porque
viajaban sin categoria** y el emparejador nunca las devolvia. Al arreglar
el `await`, todos esos perfiles de prueba **pasaron a salir en las
busquedas de gente real**. La cura de ayer activo una contaminacion que
llevaba dormida desde siempre.

**Cura**: en demo no se escribe. La cuenta local se crea igual, asi que la
demostracion no pierde nada.

**Accion pendiente del fundador**: revisar la tabla `helpers` y borrar las
filas de prueba con `ai_data->>'self_registered' = 'true'` que no
correspondan a profesionales reales.

### 2 · "¡Ya formas parte de la red!" se decia aunque no fuera verdad

El guardado era **fuego y olvido**: no se esperaba el resultado, no se
miraba `res.ok`, y el mensaje de exito se emitia siempre. Si Supabase
fallaba, o si el insert era rechazado, la persona quedaba **fuera de la
red y convencida de estar dentro**.

Esto se agrava justo con el trabajo del sello `-u`: **en cuanto se cierren
las politicas RLS, el insert anonimo empezara a devolver 401/403** — y sin
esta cura, cada alta profesional fallaria en silencio dando la enhorabuena.

**Cura**: se espera el guardado, se comprueba `res.ok`, y el mensaje final
depende del resultado. Verificado en navegador con build de produccion
(red sin salida a Supabase, que reproduce exactamente un insert
rechazado):

> *"Perfecto, Marta Ferrer. Tu perfil está guardado aquí, pero todavía no
> he podido publicarlo para que te encuentren. Lo reintento; si mañana no
> apareces en las búsquedas, vuelve a entrar y avísame."*

Y en modo demo: **cero escrituras a Supabase**, cuenta local creada.

**Balance del alta profesional**: cinco fallos en un solo flujo — el
medidor con regla ajena, la cuenta pisada, el `await` que hacia invisible
a todos, la demo contaminando produccion y el exito que se anunciaba solo.
Era el flujo menos recorrido de la app y el que decide la oferta.

---

## Las conversaciones que nadie tuvo · **Terminada** · 2026-08-01

Sello `2026.07.06-z`. `Chats.jsx`, `Siguiendo.jsx`, `MyServices.jsx`,
`scripts/preflight.mjs`.

Recorrido el dia uno del profesional: dada de alta, cero actividad.

**`/profile` y `/my-services` aguantan**: *"Tu perfil está al 86%"*, *"TU
SEMANA — Semana tranquila"*, *"Aún no has contratado nada"*. Los arreglos
de los sellos `-o` y `-y` se sostienen.

**Pero `/chats` mostraba CINCO conversaciones que Marta nunca tuvo**, con
nombres y citas concretas:

> *"Elena Fernández Ros · 12m · Mañana a las 9:30 en su domicilio entonces.
> Le mando la ubicación por aquí."*

Y `/siguiendo`, dos profesionales que nunca siguio.

**Lo grave no es que existan** —son datos de demostracion legitimos— sino
que **no miraban `DEMO_MODE`**. Apagar `DEFAULT_DEMO`, que es justo lo que
la quinta puerta exige antes de abrir, **no las quitaba**. Habrian salido
en produccion el primer dia.

Y solo caben dos lecturas para quien abre la app y ve eso, las dos
demoledoras para un producto cuya tesis es la confianza: o la app le esta
enseñando **los chats de otra persona**, o **ha reservado algo sin
enterarse**.

**Cura**: las tres atadas a `DEMO_MODE`. Verificado en las dos ramas — en
produccion salen los estados vacios reales, en demo sigue todo rico y la
demostracion no pierde nada.

**Detalle revelador**: el estado vacio de Siguiendo **no se habia podido
ver nunca**. Por eso su texto roto (*"guardarlo aquílo aquí"*, corregido en
el sello `-t`) sobrevivio tanto tiempo: nadie podia leerlo.

`MyServices` servia el escaparate solo a invitados —defendible como
escaparate— pero presentado como *"Mis servicios"* con sello *Confirmado*
es una invencion. En demo se conserva; en produccion el invitado ve la
verdad.

### Guardia permanente en la quinta puerta

Cualquier pantalla **enrutada** con constantes `DEMO_*` debe importar
`DEMO_MODE`. Limitado a las enrutadas a proposito: `Favorites.jsx` es
huerfana y una puerta siempre roja enseña a ignorarse — la misma leccion
que el sello de build.

### Nota de metodo: el cuarto instrumento roto del dia

El primer barrido dijo que `/profile` mostraba **el muro de invitado** a una
profesional. Falso: use `waitUntil:'domcontentloaded'`, asi que escribia en
`localStorage` **antes de que la app arrancara**, y el efecto de
`UserContext` (`useEffect(..., [user])`, que corre tambien al montar) lo
sobrescribia. Barri toda la app como invitada creyendo ser profesional.

Cuarta vez en la jornada que el instrumento miente y no el codigo. La regla
del sello `-t` se confirma: **una medicion que acusa a todo a la vez suele
estar acusando al medidor**.

---

## Dos hojas de reserva con dos logicas · **Terminada** · 2026-08-01

Sello `2026.07.07-a`. `Chat.jsx`, `HelperProfile.jsx`, `horarios.js`.

Conducido el momento que convierte: buscar → escribir → **reservar**. El
chat funciona (Carlos responde y ofrece los chips siguientes). La reserva,
no.

### La Agenda no llegaba al chat

`HelperProfile.jsx` usaba `slotsDe(helper, date, ocupadas)` — horario por
oficio, horas pasadas filtradas, ocupacion de **los dos almacenes**.
`Chat.jsx:188` **hardcodeaba** las mismas ocho horas para todo el mundo:

```js
['9:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00']
```

Y el chat es el camino mas transitado: la conversacion lleva sola al chip
*"Me interesa, ¿cómo lo reservamos?"*.

**Medido a las 23:35: ofrecia los ocho huecos de HOY. Los ocho ya pasados.**
Ademas ignoraba el oficio (una logopeda no trabaja como un tecnico) y la
ocupacion real — se podia reservar una hora ya cogida, que es **exactamente
el fallo que `ocupacionesDe` nacio para cerrar**. Toda esa obra estaba
puenteada por la puerta principal.

**Cura**: el chat usa `slotsDe` + `ocupacionesDe`, con el mismo trato visual
que la ficha (ocupada = tachada, deshabilitada, con su motivo en el title).

### Y "lo tiene completo" era mentira tres veces de cada tres

`slotsDe` devuelve `[]` por **tres motivos distintos** y las dos pantallas
los contaban todos como *"Ese día lo tiene completo"*:

| motivo | antes | ahora |
|---|---|---|
| no trabaja ese dia | *"lo tiene completo"* | **"Ese día no trabaja. Prueba con otro."** |
| ya ha pasado su jornada | *"lo tiene completo"* | **"Por hoy ya ha terminado. Prueba con mañana."** |
| lleno de verdad | *"lo tiene completo"* | *"Ese día lo tiene completo."* |

Decirle a alguien que una logopeda esta llena cuando **simplemente no
trabaja los domingos** la hace parecer mas ocupada de lo que esta y le
esconde al usuario el dato con el que elegiria otro dia.
`motivoSinHuecos()` vive en `horarios.js`: una sola verdad para las dos
pantallas.

**Verificado en navegador:**

```
logopeda · domingo → "Ese día no trabaja."
logopeda · lunes   → 16:00 17:00 18:00 19:00   (su tarde real)
fontanero · domingo→ "Ese día no trabaja."
hoy 23:35          → ningun hueco pasado
```

---

## D6 y D8 — las dos discrepancias que quedaban abiertas · **Cerradas** · 2026-08-01

Sello `2026.07.07-b`. `Chats.module.css`, `docs/design-system.md`.

Con esto **las 20 discrepancias del prompt maestro estan resueltas o
declaradas**. Ninguna queda abierta sin motivo escrito.

### D8 · "Chats no scrollea con datos demo" — **verificada, cumple**

No era un defecto: era un hueco de verificacion. Medido con **18
conversaciones reales** sembradas (no las de demostracion), con scroll
hasta el fondo:

| regla del contrato | medido |
|---|---|
| 1 · el `.page` es el scroller | ✓ `_page_` con `overflow-y:auto`, scrollH 1730 |
| 2 · la reserva en un solo sitio | ✓ `padding-bottom: 86px` = `--reserva-nav` |
| 3 · ningun hijo reserva | ✓ `._list_` con `padding-bottom: 0` |
| 4 · el hueco final es `--space-20` | ✓ **20px exactos** |
| 7 · `overscroll-behavior-y: contain` | ✓ |

Se cierra sin tocar codigo. **Un no-defecto verificado vale tanto como un
arreglo**: retira una duda del inventario.

### D6 · "Tres modelos de cabecera" — **cerrada: uno y dos excepciones**

La Fase 1 ya la habia resuelto casi entera sin que nadie lo anotara.
Medido hoy en siete pantallas: **cinco comparten `fixed 68px @0`**, y las
dos que no lo hacen es **por diseño**.

El origen esta en `PageHeader`, componente compartido por ocho pantallas
que ademas aplica el mismo `max(env(safe-area-inset-top,0px), 12px)` que
la reserva `--header-h`: cabecera y hueco se mueven juntos con el notch.

**Lo unico que quedaba era un fantasma**: `Chats.module.css` definia una
cabecera `sticky` propia —un **cuarto** modelo— que **no usaba nadie**
(`Chats.jsx` renderiza `<PageHeader />`, y `styles.header`, `styles.title`
y `styles.count` tienen cero referencias). Retirada: una definicion muerta
engaña a quien lee el archivo, que es como nacen los modelos duplicados.

Y se declara el sistema en `design-system.md` (regla 9), con las dos
excepciones **escritas y razonadas** en vez de toleradas en silencio:
Inicio lleva cabecera flotante de 46px porque una pesada compite con la
conversacion; Comunidad no lleva porque su primer bloque ya se presenta
solo.

Medido despues: **las siete pantallas idénticas al antes. Cero regresión.**

### Nota de metodo: cinco instrumentos rotos antes de un numero fiable

Para llegar a los 20px de D8 hubo que corregir la medicion **cinco veces**:
buscaba el `.page` equivocado (encontraba el de Inicio, oculto detras),
media sin haber hecho scroll al fondo, contaba los botones de la barra
inferior como conversaciones, filtraba por `<button>` cuando las filas no
lo son, y usaba `offsetParent` —que falla con `position: fixed`—.

Ninguna de las cinco veces fallaba la app. **La regla del sello `-t` ya es
ley de esta casa: una medicion que acusa suele estar acusando al medidor.**

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
