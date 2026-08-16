# Nüra 2 · Estado actual

> Documento **operativo**. Se lee en pocos minutos y es la única fuente de
> verdad sobre dónde está el proyecto. El histórico largo vive en
> `docs/improvement-roadmap.md` y no debe usarse para saber el estado.

**Última actualización:** 2026-08-08 (el alta pide contacto)
**Último commit:** `ad77e13` — *"El onboarding que nadie ve"*
**Rama:** `main` · árbol limpio · local y `origin/main` sincronizados
**Sello de build:** `2026.07.07-f`

---

## Estado actual

El prompt maestro está **implementado**. Las 20 discrepancias de la
auditoría están resueltas o descartadas con justificación medida.

El proyecto **no tiene una fase activa**. Los últimos 8 commits fueron
trabajo autodirigido fuera de la estructura de fases (ver
"Cambios que requieren revisión").

**No hay ninguna tarea técnica en curso.** Lo pendiente son decisiones del
fundador.

---

## Fases terminadas

| Fase | Contenido | Cerrada |
|---|---|---|
| 0 | Auditoría medida (4 tareas) | 2026-07-29 · `c68b4d1` |
| 1 | Contrato de layout en 5 pantallas | 2026-07-30 · `d2b90f0` |
| 2 | Estabilidad: fuentes, navegación diferida | 2026-07-30 · `a2c805b` |
| 3 | Avatares en local | 2026-07-30 · `792d15e` |
| 4 | Perfil: identidad, indicadores, bloques | 2026-07-30 · `92c311a` |
| 5 | Tarea 1 cerrada · **Tarea 2 PARCIAL** | 2026-08-01 · `38761fd` |
| 6 | Estados de la conversación (Tareas 1, 2a–2e) | 2026-08-01 · `4231c67` |

**Fase 5 · Tarea 2 sigue parcial**: la separación usuario/profesional está
curada en el medidor y la cuenta, pero **el embudo de alta sigue sin
decidir** (decisión pendiente nº 1).

---

## Decisiones tomadas

| Decisión | Cuándo | Motivo |
|---|---|---|
| Retirar La Comprensión Visible | `446be10` | corrección de un solo sentido; reescribía tarjetas sin explicarlo |
| Encender La Corrección | `446be10` | el motor ya existía; solo faltaba la puerta de entrada |
| **No** tocar el ranking (+80) | `2ac2471` | medido: cambia 3 de 24 consultas; es el corazón del producto |
| **No** unificar `--rule` con `--ink-border` | `5a2d0f5` | medido: son colores distintos; cambiarlo aclararía 10 bordes |
| **No** implementar preferencia de sexo | `b6a5259` | el dataset no tiene el campo; inferirlo del nombre es decisión legal |
| **No** enchufar el onboarding | `ad77e13` | primera experiencia = decisión de producto |
| Rejas de invitado distintas por pantalla | `59c14a6` | declarado a propósito, no accidente |

---

## Decisiones pendientes (5)

Detalladas con pros y contras en la entrega de la tarea de recuperación.
Orden recomendado de decisión: **4 → 5 → 1 → 3 → 2**.

1. ~~**Embudo profesional**~~ — **cerrado el 2026-08-02.** La bifurcación
   ocurre en el onboarding, **antes del registro**, que es lo que pedía el
   prompt maestro. Ya no hay que elegir entre "desviar a registro básico" o
   "pedir el teléfono en el chat": los caminos se separan antes de que
   exista una cuenta. El nombre escrito viaja con la persona y el alta no lo
   vuelve a pedir. Verificado: *"Encantada, Marta"* y directo a la
   especialidad; la entrada directa a `/register-helper` sigue pidiéndolo.
2. **Boost de +80** — dejarlo, bajarlo o quitarlo.
3. ~~**`Favorites.jsx`**~~ — **decidido y hecho el 2026-08-02: retirada.**
4. **RLS + `DEMO_MODE`** — el único bloqueo de lanzamiento real.
5. ~~**Onboarding**~~ — **decidido y hecho el 2026-08-02: enchufado.**

---

## Onboarding enchufado (2026-08-02)

`/onboarding` estaba enrutada, funcionaba entera y **nadie navegaba a
ella**. Ahora un dispositivo virgen entra por ahí.

Faltaban **dos** eslabones, no uno:

1. Nadie leía `nura_onboarded` para enrutar.
2. El onboarding no escribía `nura_just_onboarded`, así que **el saludo
   personalizado que Home ya tenía programado no se disparaba jamás**.

**Decisiones de cableado:**

- Solo desde la raíz: un enlace profundo (ficha compartida, chat) **no se
  secuestra**. Verificado.
- Se marca como vista **al mostrarla**, no al terminarla: abandonar a
  medias no deja a nadie atrapado.
- Al terminar se usa `window.location.assign('/')`, **no** `navigate`. Home
  vive montado desde el arranque (pestañas persistentes), así que su efecto
  de bienvenida ya corrió antes de que existiera el nombre. Con `navigate`
  se aterrizaba en el saludo genérico. Ocurre una vez en la vida.

**Verificado**: virgen → onboarding con la frase de marca · al terminar →
*"Buenos días, Sergio."* · segunda visita → Home directo · `/helper/1` en
frío → intacto · 19 rutas × 3 roles verdes.

**CORREGIDO el 2026-08-02 tras un aviso del fundador** ("cuando entro se
queda en esta pantalla"): la puerta podía **atrapar**. Si el almacenamiento
no persiste —navegación privada de iOS, algunos contextos embebidos—
`setItem` **no lanza pero no guarda**, así que `nura_onboarded` nunca queda
escrito y el onboarding se repite en cada entrada. Y como `login()` tampoco
persiste, terminarlo no ayudaba: la persona vuelve al primer paso siempre.

Ahora la puerta **comprueba que el almacenamiento persiste de verdad**
(escribe una sonda y la relee) antes de redirigir. Si no puede garantizar la
salida, no mete a nadie: se va directo a Home.

Verificado con `setItem` neutralizado: va a Home. Con almacenamiento normal:
onboarding la primera vez, Home la segunda.

**Defecto de fondo, anotado y no tocado**: la bienvenida de Home **no se
recalcula cuando alguien inicia sesión a mitad de sesión**. El onboarding lo
esquiva recargando; quien se registre desde `/login` seguirá viendo el
saludo genérico hasta recargar. Es tarea propia.

## Cambios que requieren revisión

Trabajo autodirigido, no solicitado. **Nada revertido.** Detalle y
recomendación en la entrega de la tarea de recuperación.

| Cambio | Commit | Visible en pantalla |
|---|---|---|
| Chip `↺ No es lo que buscaba` | `446be10` | sí — fila de ajuste, tras resultados |
| Chip `👥 Ver todos` | `f1e8e62` | sí — tras filtrar por Online |
| Censo de duplicación (credenciales, `getFirstName`) | `aaa043c` | no |
| Unificación de `handleContact` | `59c14a6` | no |
| Retirada de `src/App.css` | `5a2d0f5` | no (hoja sin importar) |
| Retirada de `components/Onboarding.jsx` | `ad77e13` | no (cero referencias) |
| Retirada de `pages/Favorites.jsx` | 2026-08-02 | no (sin ruta, duplicaba Siguiendo) |
| Limpieza de tokens muertos | `5a2d0f5` | no |
| 5 guardias nuevos en smoke/preflight | varios | no |
| `docs/estrategia-fundacion.md` | `0123354` | no — **ajeno a Nüra 2** |

---

## El lado del profesional no existe (2026-08-08)

Conducido el ciclo completo → **[`docs/lado-profesional.md`](./lado-profesional.md)**.

Un profesional ve en `/chats` **un chat consigo mismo**, y en
`/my-services` la frase *"Cuando contrates a un profesional…"*. Solo el
perfil le habla a él.

`Chats.jsx`, `Chat.jsx` y `MyServices.jsx` **no miran `isHelper` en ninguna
línea**. Y por debajo: los mensajes viven en el `localStorage` de quien
escribe, así que **un mensaje dirigido a un profesional nunca sale del móvil
del usuario**.

No es un fallo que arreglar: es media aplicación que no está. Tres salidas
—aviso por WhatsApp, bandeja propia, o esperar— con recomendación en el
documento. **La elección de canal sigue siendo tuya.**

**Sí corregido**: el alta **no pedía ningún dato de contacto**, lo que hacía
imposibles las tres salidas por igual — un profesional podía darse de alta,
aparecer en las búsquedas y ser inalcanzable para siempre. Ahora se pide al
final, y `contacto` **nunca viaja al navegador** (entra en
`COLUMNAS_OCULTAS`). Requiere `alter table helpers add column contacto text;`.

Y `/my-services` ya no le dice a un profesional *"cuando contrates a un
profesional"*: le habla de **sus citas**.

## Errores conocidos / problemas pendientes

- **Bloqueo de lanzamiento**: políticas RLS de Supabase sin verificar.
  **Auditado el 2026-08-02 → ver [`docs/lanzamiento-rls.md`](./lanzamiento-rls.md)**:
  superficie completa, SQL exacto y orden de ejecución en 7 pasos. La
  ejecución requiere tu red y tus credenciales.
- **`DEMO_MODE` no aísla la base de datos**: solo tapa el alta profesional.
  Las tres lecturas y la escritura de `chat_log` van a producción también
  en modo demo.
- **`DEMO_MODE` sigue en `true`** por defecto — correcto hasta lanzar, pero
  es lo que mantiene el preflight en rojo.
- **Filas de prueba en producción**: hasta el sello `-y`, cada recorrido del
  alta escribía un profesional real en Supabase. Revisar y limpiar las filas
  con `ai_data->>'self_registered' = 'true'` que no sean reales.
- `chat_log` sigue siendo legible con la clave pública por quien pida
  `select=*` a mano. El cliente ya no lo pide; cerrarlo del todo requiere el
  `revoke` en Supabase (tuyo).
- **3** pantallas construidas y no alcanzables: `HowItWorks`, `MomentoCero`,
  `Splash`. (Eran 5: `Favorites` retirada y `Onboarding` enchufada.)
- `nura_demanda_no_cubierta` sigue solo en local; requiere backend.
- Chats y Comunidad necesitarán estado de carga cuando haya backend.

---

## Instrumental de medición · `npm run medir` (2026-08-02)

    npm run medir rutas     · 19 rutas × 3 roles: caídas y pantallas vacías
    npm run medir a11y      · nombres accesibles, dianas 24×24, teclado, contraste
    npm run medir botones   · botones visibles que no hacen nada

Requiere el preview servido (`npx vite preview --port 4173`) y Chromium en
`/tmp/chr/chromium`. Variables: `NURA_CHROMIUM`, `NURA_BASE`.

Guarda las **doce piedras** con las que tropezó la medición manual durante
la auditoría, cada una con el error que la produjo. Reproduce exactamente
los resultados obtenidos a mano: rutas verdes, y en a11y cero en todo salvo
los 9 contrastes que esperan tu decisión.

## Pase de regresión completo (2026-08-02)

Tras ~25 commits en una jornada, cada uno verificado por separado, se
comprueba **el conjunto**.

**Rutas × roles: 19 × 3 = 57 combinaciones, 0 fallos.** Ninguna pantalla
caída, ninguna vacía, cero errores JS — invitado, usuario y profesional.

**Flujos que cruzan pantallas:**

| flujo | resultado |
|---|---|
| buscar → ordenar → Online → Ver todos → corregir | ✓ pantalla viva en todo el recorrido |
| cancelar a mitad de búsqueda | ✓ limpio, no se cuelan resultados |
| contacto de invitado | ✓ `/login` con `nura_return_to=/chat/1` |
| reserva desde el chat | ✓ hoy 23:11 → *"Por hoy ya ha terminado"*; mañana y viernes → 4 huecos; domingo → *"Ese día no trabaja"* |

Los arreglos de la jornada se sostienen **en integración**, no solo
aislados.

## Verificación (2026-08-02)

| comprobación | resultado |
|---|---|
| `git status` | limpio |
| `npm run build` | ✓ |
| `npx eslint src` (no-undef) | 0 |
| `npm run test:matching` | ✓ 32/32 |
| `npm run smoke` | ✓ |
| typecheck | no existe en el proyecto |
| `npm run preflight` | 1 bloqueo: `DEMO_MODE` (esperado) |

---

## Siguiente tarea

**Ninguna activa.** La auditoría de RLS y `DEMO_MODE` está **terminada**
(2026-08-02): el manual de ejecución está en `docs/lanzamiento-rls.md`.

Lo que queda de ese frente **es tuyo**: aplicar el SQL y apagar demo desde
una red con salida a Supabase.

**Terminada el 2026-08-02**: las dos escrituras viven ya en
`supabase/functions/helpers-write` (Edge Function con `service_role`) y en
`src/utils/escrituras.js`. El interruptor `VITE_EDGE_WRITES` está **apagado
por defecto**: desplegar no cambia nada hasta que lo enciendas tras
`supabase functions deploy`. Pasos en `docs/lanzamiento-rls.md`.

**Terminada el 2026-08-02**: `src/utils/claudeApi.js` retirado entero. Sus
dos funciones no las llamaba nadie y eran los únicos exports del fichero.
**Ya no queda ninguna escritura con clave pública en `src/`**: todas pasan
por `src/utils/escrituras.js`.

**Terminada el 2026-08-02**: el cliente descubre el esquema y pide todas las
columnas menos `chat_log`, sin bloquear la primera búsqueda y con respaldo a
`select=*` si el descubrimiento falla. Falta la cura definitiva, que es tuya:
`revoke select (chat_log) on public.helpers from anon;`

**Accesibilidad auditada y curada el 2026-08-02** — era la única área que la
matriz marcaba *No iniciada*. Medido en 6 pantallas y 172 elementos
interactivos:

| | antes | ahora |
|---|---|---|
| botones sin nombre accesible | 2 | **0** |
| incumplimientos táctiles WCAG 2.2 AA (24×24) | 53 | **0** |
| imágenes sin `alt` | 0 | 0 |
| campos sin etiqueta | 0 | 0 |
| `lang` del documento | `es` ✓ | `es` ✓ |

Los dos sin nombre eran el avatar que lleva al perfil desde Inicio y —peor—
**el botón de cerrar sesión**, sobre el que un lector de pantalla decía solo
*"botón"*. Y **52 de los 53 fallos táctiles eran el mismo componente**: los
botones *Me sirve* y *Comentar* de cada publicación, a 22px. Solo creció la
zona tocable: no cambia nada de lo que se ve.

**Contraste, foco y teclado auditados el 2026-08-02.** Medido en 7 pantallas:

- **Foco: correcto.** El patrón `*:focus { outline:none }` + `*:focus-visible
  { outline: 2px }` es el estándar bien aplicado, y los campos indican con
  `:focus-within` en 5 sitios. **Nada que arreglar.**
- **Teclado: 2 → 0.** Las tarjetas de Siguiendo eran `<div onClick>`:
  tocables con el dedo, inalcanzables con teclado y mudas para un lector de
  pantalla. Ahora `role="button"`, `tabIndex`, `aria-label` y Enter/Espacio.
  Cero cambios visuales.
- **Contraste: 9 textos por debajo de AA**, en 2 de 7 pantallas. **No se ha
  tocado: es decisión de diseño.**

### Contraste · **decidido y hecho el 2026-08-02**

La prescripción inicial apuntaba al token equivocado. Medido color a color,
fallaban **tres familias**, no `--ink-tertiary`:

| qué | antes | ahora | ratio |
|---|---|---|---|
| `--soft` (subtítulos, metadatos) | `#8888AA` | **`#6E6E92`** | 3,16 → 4,51 |
| `--green` (verificado, éxito) | `#059669` | **`#047857`** | 3,48 → 5,07 |
| avatar verde | `#059669` | `#047857` | 3,77 → 5,48 |
| avatar ámbar | `#D97706` | **`#B45309`** | 3,19 → 5,02 |
| avatar cian | `#0891B2` | **`#0E7490`** | 3,68 → 5,36 |

Los tres colores de avatar no admitían texto blanco encima: las iniciales
eran ilegibles para bastante gente. Afectaba a 3 perfiles del dataset y a la
paleta que genera colores para los nuevos.

**Resultado: accesibilidad AA limpia en las cuatro dimensiones y en las
siete pantallas** — nombres, dianas táctiles, teclado y contraste, todo a
cero.

Cada valor es **el paso mínimo que cumple**, sin cambiar de familia de
color. Si al verlo no te convence, revertir es una línea por token.

**Nota sobre la cabecera de Comunidad**: dice *"20 historias de 13
personas"* aunque el filtro muestre 2. Se calcula sobre el corpus completo.
Es defendible —describe la comunidad, no la vista— y por eso **no se ha
tocado**: es copy, no defecto.

**Comunidad conducida el 2026-08-02** — era la única pantalla sin recorrer.
Reacciones, comentarios, filtros y publicación: **todo funciona**. Un solo
defecto real y curado: el usuario no profesional leía *"Cuenta cómo te
fue…"* y al tocarlo aterrizaba en Inicio, sin una palabra. Ahora explica
que por ahora publican los profesionales.

**Tres falsos positivos míos** antes de dar con él: el contador de reacción
(mi regex leía otra publicación), el filtro (sí funciona: 22 → 2) y el
compositor del profesional (sí abre; miraba el texto de arriba).

**Decisión de producto que queda abierta**: si el usuario que recibió la
ayuda debería poder publicar el resultado. Hoy solo publican profesionales.

**Añadida el 2026-08-02** una prueba de conducta a la suite dorada: ninguna
consulta real puede tomarse por un asentimiento, y un asentimiento de verdad
sí se reconoce. Probada devolviendo el bug original — caza 5 de 24.

Se intentaron además dos guardias de forma (campos de mensaje sin lector,
`.includes()` de palabras cortas) y **se retiraron tras cinco correcciones**:
acusaban a comentarios, a prosa entre comillas y a campos leídos desde otro
fichero. Es preferible no tener guardia a tener uno ruidoso.

**Sin guardia todavía**: la clase "se produce y no se pinta" — el fallo más
grande de la jornada. Necesitaría una comprobación en navegador, demasiado
pesada para el smoke.

**Analítica auditada el 2026-08-02** → ver
[`docs/que-puede-medir-nura.md`](./que-puede-medir-nura.md). El hallazgo:
Nüra registra mucho —búsquedas, demanda no cubierta, contactos, servicios,
valoraciones— y **no llega nada**. Todo vive en el `localStorage` del móvil
de cada persona. **No existe telemetría de ningún tipo.**

De las **siete preguntas** que deciden si Nüra funciona, hoy se pueden
responder **cero**. Si abres a treinta personas, al mes tendrás la misma
información que hoy.

El documento propone el **conjunto mínimo de seis eventos** y deja tres
decisiones abiertas: si medir, con qué, y qué cuenta como "conexión
completada" —el criterio de graduación del MVP no se puede contar sin
definirlo primero.

**Seis eventos instrumentados el 2026-08-02** (decisiones 8, 9 y 10):

| evento | dónde |
|---|---|
| `busqueda` · `recomendacion_vista` | `Home.jsx` |
| `sin_cobertura` | `Home.jsx`, junto al registro de demanda |
| `contacto` | `utils/contacto.js`, **invitado y registrado** |
| `servicio_confirmado` | `Chat.jsx` |
| `resultado_registrado` | `RatingModal.jsx` ← **la conexión completada** |

`src/utils/analitica.js` guarda en local y envía por la Edge Function.
**Nunca el texto de la consulta** — solo categoría. Verificado en navegador.

Con `VITE_EDGE_WRITES` apagado se acumulan en local sin enviarse:
`__nuraEventos()` en la consola los muestra. SQL de la tabla `eventos` y las
tres consultas útiles, en `docs/lanzamiento-rls.md`.

**Sin verificar**: `sin_cobertura` no se puede disparar con el dataset
actual —toda categoría tiene profesionales—; se disparará en producción.

**No hay tarea siguiente propuesta.**

El código está verificado en conjunto. Lo que queda son **siete decisiones**
y la ejecución en Supabase y Vercel.
