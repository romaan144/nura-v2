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

## 2026-07-04 — El borde inferior: un solo número (sin tocar anclajes)

- En vez de cambiar el patrón de layout (que descolocaba los tres anclajes),
  se mantiene `.page` en `position: fixed` y se sube **solo su lado inferior**
  de `inset: 0` a `bottom: var(--nav-h)`. La caja termina en la línea de la
  nav en lugar del borde del viewport. Los hijos absolutos (`.floatTop`,
  `.floatBottom`) y el spacer conservan sus referencias — no puede desplazar
  nada. Reversión inmediata a 97095ae si el límite no encaja.
- Sello `NURA_BUILD` → `2026.07.04-bn`.

## 2026-07-04 — El avatar del hero deja de animar (riesgo real)

- Al verificar el conteo de popIn tras la barra quedaban 2: el avatar del
  perfil. Ademas de violar la ley de -ar, el primero llevaba **opacity:0 en
  linea** con la animacion: si no llegaba a ejecutarse, la foto del
  profesional no aparecia nunca. Retirados.
- Sello NURA_BUILD 2026.07.04-cw.

## 2026-07-04 — El scroller no era el documento

- `window.scrollTo(0,0)` no corregia nada porque **el elemento que se
  desplaza no es el documento**: segun la ruta puede serlo un contenedor
  interno (las pestañas viven dentro de un contenedor fijo, los overlays
  no). En vez de seguir adivinando cual, ScrollToTop resetea el
  desplazamiento de **cualquier** elemento que lo tenga. Corre solo al
  cambiar de ruta.
- Sello NURA_BUILD 2026.07.04-dx.

## 2026-07-05 — La Conversacion se asienta (Nura diseño)

- Tras una busqueda corta quedaban ~200px de vacio entre los filtros y el
  input: el contenido ocupaba unos 400px de 750, se apilaba desde arriba y
  el input estaba anclado abajo. Todos los saltos de la conversacion son de
  12-20px y de pronto habia uno de 200 — no se lee como aire, se lee como
  que falta algo.
- Comprobado antes de tocar: el espaciador esta bien calculado (84 del input
  + 73 de la barra) y con conversacion larga los filtros quedan justo sobre
  el input. El problema era solo el caso corto.
- Cura de una linea: **`margin-top: auto` en el primer mensaje** — absorbe
  el sobrante cuando el contenido no llena la pantalla (la conversacion se
  apoya en el input, como cualquier chat) y pasa a cero cuando crece.
- **Muere el conmutador `justify-content: flex-end / flex-start`**:
  bienvenida y conversacion pasan al MISMO mecanismo. Y con el desaparece de
  Home el `flex-end`, que fue lo que saco el contenido de la pantalla
  durante cinco ciclos.
- Sello NURA_BUILD 2026.07.05-j.

## 2026-07-05 — La Barra que se ve (Nura diseño)

- El fundador: la barra inferior esta apagada y no se sabe donde empieza,
  porque mucho contenido tiene su mismo color. Medido y confirmado: la linea
  separadora era **0.5px al 5% de opacidad** — por debajo del umbral de
  percepcion, mas tenue incluso que `--ink-border` (6%) — el fondo era el
  **mismo papel que el contenido** al 86%, y **no habia sombra**.
- **Tres capas de separacion**, porque cada una falla en un caso distinto:
  la linea sobre fondos claros, la sombra sobre fondos oscuros y el
  contraste de superficie cuando el contenido es del mismo tono (el caso del
  fundador). Linea a 1px/12%, sombra ascendente 0 -2px 16px al 7%, papel al
  93%.
- **Iconos y etiquetas inactivos**: estaban al 35% y **30%** — a 11px eso no
  se lee, se adivina. Pasan a `--ink-tertiary`. La barra habia quedado fuera
  del ciclo que subio los grises del sistema.
- Intactos a proposito: altura, posicion, safe-area y desenfoque. La
  geometria de esta barra costo demasiado como para rozarla.
- Sello NURA_BUILD 2026.07.05-i.

## 2026-07-05 — El desplazamiento lateral (el falso zoom)

- El fundador noto que el perfil del profesional se podia mover de lado a
  lado, no solo arriba y abajo. Causa: **`.aurora::before` sangraba 24px por
  cada lado** (`inset: -24px -24px auto`) y desbordaba el ancho.
- El detonante es una regla de CSS poco conocida: **un contenedor con
  `overflow-y: auto` convierte el eje X de `visible` a `auto`**, asi que
  cualquier desbordamiento horizontal se vuelve desplazable. Por eso pasaba
  en las paginas con scroll propio y no en otras.
- Doble cura: fuera el sangrado lateral del aurora (causa raiz, sistemica —
  el aurora vive en Inicio, el hero del profesional, Comunidad y la Carta) y
  **18 contenedores con scroll vertical blindados** con `overflow-x: hidden`,
  para que ningun desbordamiento futuro vuelva a hacerse desplazable.
- Sello NURA_BUILD 2026.07.05-h.

## 2026-07-05 — El centrado, de verdad

- El contenido seguia arriba con hueco debajo: sintoma de que `height: 100%`
  no resolvia, asi que no habia espacio libre que repartir y `margin: auto`
  no tenia nada que centrar.
- Añadido `minHeight: 100dvh`: altura garantizada sin depender de la cadena
  de padres. **Seguro junto a margin:auto** — lo peligroso era 100dvh CON
  justify-content:center y overflow hidden, que dejaba contenido
  inalcanzable; con margin:auto el margen se reduce a cero en cuanto el
  contenido crece y vuelve al flujo normal.
- Sello NURA_BUILD 2026.07.05-g.

## 2026-07-05 — Las dos, centradas (sin repetir el fallo)

- El fundador las quiere mas centradas. Se hace con **margin: auto** sobre
  el hijo de un contenedor flex, **no** con justify-content:center.
- La diferencia importa y es la del fallo de once ciclos:
  `justify-content: center` **corta el contenido por arriba** cuando no cabe
  y lo deja inalcanzable; `margin: auto` cede el centrado y vuelve al flujo
  normal en cuanto el contenido crece. Mismo resultado visual, imposible
  reproducir el problema.
- Aplicado identico en Login y en el Perfil de invitado.
- Sello NURA_BUILD 2026.07.05-f.

## 2026-07-05 — Union de diseño: registro y Login, la misma pantalla

- El fundador: las dos pantallas del registro no estaban a la misma altura y
  el salto se notaba. Ahora el Perfil de invitado usa **la receta exacta de
  Login**: mismo contenedor, mismo relleno, mismas auroras de fondo, misma
  tarjeta de cristal, mismo maxWidth. **El logo cae en el mismo pixel**, asi
  que al pulsar "Crear cuenta gratis" la cabecera no se mueve — solo cambia
  el contenido de la tarjeta.
- De paso, la pantalla gana la piel de la app: titulo en la Voz, ventajas
  dentro de la tarjeta, los dos botones con la primitiva Button (44px de
  area tactil heredados) y la misma linea de confianza.
- Retiradas 7 reglas CSS que quedaron huerfanas (.pageGuest, .noUser y las
  suyas): la pantalla ya no usa CSS de modulo.
- Sello NURA_BUILD 2026.07.05-e.

## 2026-07-05 — Login recupera su belleza (sobre la estructura buena)

- Via libre del fundador: "hazla mucho mas bonita, parecida a como estaba
  antes". Vuelve lo que la hacia bonita, pero como SUPERFICIE sobre la
  estructura simple que por fin funciona — nunca como colocacion.
- **El logotipo real** (logo-text.png) en vez de texto, y el isotipo con su
  respiracion (pulse 3s), como en la original.
- **Las casillas del codigo**: cuatro cajas de 54x62 que se encienden en
  morado al rellenarse, con el campo real invisible encima. Se lee como un
  codigo, no como un formulario.
- **Tarjeta de cristal**: papel translucido con desenfoque y sombra suave,
  la misma receta que las barras de la app.
- **Las tres auroras** (rojo, morado, cian) vuelven como `background-image`
  del contenedor. Los blobs originales eran `<div>` posicionados; estos no
  pueden afectar al layout.
- Sello NURA_BUILD 2026.07.05-d.

## 2026-07-05 — Login, vestida (sin tocar la estructura)

- La altura quedo bien con la reescritura, asi que este ciclo es solo piel:
  **la estructura no se toca** (contenedor con altura del padre, flujo
  normal, cero elementos posicionados). Todo lo añadido es superficie.
- **Tarjeta canon** para el formulario (curva 18, sombra de reposo, borde
  del sistema): el registro deja de ser texto suelto sobre papel.
- **Indicador de tres pasos** sobre la tarjeta — telefono, codigo, nombre —
  para que se vea cuanto queda.
- **El degradado vuelve, pero como FONDO**, no como elemento posicionado
  (los blobs de la version anterior eran divs; estos son background-image).
  Cero riesgo para el layout.
- **La confianza donde mas se duda**: una linea antes de dar el telefono —
  "no se muestra a nadie, solo sirve para entrar".
- Codigo de verificacion a 24px con separacion: se lee como un codigo.
- Sello NURA_BUILD 2026.07.05-c.

## 2026-07-05 — Login, reescrita desde cero

- Diez ciclos de parches sobre el mismo archivo. El fundador: "hazla desde
  0 si hace falta". Hecho, de verdad esta vez.
- La nueva no hereda NADA: sin CSS de modulo (eliminado), sin blobs
  decorativos, sin aurora, sin centrado vertical, sin medidas de viewport,
  sin scrollIntoView, sin reglas duplicadas en media queries. Un contenedor
  que ocupa lo que le dan y desplaza si hace falta, con el contenido
  apilado de arriba abajo.
- Se conserva la logica intacta (telefono → codigo → nombre, el retorno a
  nura_return_to, las notificaciones) y gana la primitiva Button, asi que
  hereda los 44px de area tactil.
- Detalle de iOS: los campos a 16px. Por debajo, Safari hace zoom al
  enfocar y descoloca la pantalla — posible sospechoso de la saga.
- Sello NURA_BUILD 2026.07.05-b.

## 2026-07-05 — Login, escrita como las demas (la causa de todo)

- Nueve intentos parcheando. El fundador zanjo la discusion: "¿tan dificil
  es hacer una pagina normal, como todas las demas?". Tenia razon, y al
  buscar POR QUE Login no era normal aparecio la causa raiz de los nueve:
- **`AppShell` tenia `/login` en `SELF_LAYOUT`** — la lista de pantallas que
  se renderizan **sin el contenedor de la app**. Explorar, Perfil, Chats y
  Comunidad si lo reciben (de ahi que funcionen); Login no, asi que flotaba
  sin altura de referencia. Todo lo demas —los centrados, los vh, los
  min-height, los scrollIntoView— eran intentos de recrear a mano lo que el
  contenedor da gratis.
- Cura: Login sale de la excepcion, el envoltorio de rutas gana altura
  definida (como ya tenia el de las pestañas) y `.page` pasa a la receta
  estandar: `height: 100%`, scroll propio, relleno normal. **Sin centrados,
  sin medidas de viewport, sin parches.**
- Retirados los nueve apaños acumulados.
- Sello NURA_BUILD 2026.07.05-a.

## 2026-07-04 — NO ERA LAYOUT, ERA SCROLL

- Siete intentos corrigiendo el CSS de Login. La pregunta correcta
  ("¿subiendo con el dedo aparece bien?") lo resolvio en un mensaje: **si**.
  Es posicion de scroll, no layout — el CSS llevaba dias correcto.
- Mecanismo: las pestañas renderizan dentro de un contenedor `fixed` (el
  documento no se desplaza) y Login esta en `SELF_LAYOUT` de AppShell, asi
  que renderiza fuera (el documento SI se desplaza). Al navegar de una a
  otro, el navegador **restauraba la posicion anterior** y la pantalla
  llegaba ya desplazada.
- Cura: `history.scrollRestoration = 'manual'` y ScrollToTop con dos pasadas
  (la segunda tras el layout tardio de imagenes y fuentes).
- Leccion grabada en engineering: ante "se ve desplazado", preguntar SIEMPRE
  si se recupera con scroll antes de tocar una linea de CSS.
- Sello NURA_BUILD 2026.07.04-dw.

## 2026-07-04 — El sello, donde se puede ver

- Circulo cerrado descubierto: el sello solo se mostraba en el Perfil **con
  sesion iniciada**. El fundador no puede iniciar sesion (Login falla) y por
  tanto no puede ver que version esta ejecutando — el unico dato que
  distingue "el arreglo no funciona" de "el arreglo no ha llegado".
- El sello pasa a verse tambien en **Login** y en el **Perfil de invitado**.
  Un diagnostico que solo funciona cuando todo va bien no sirve de nada.
- Sello NURA_BUILD 2026.07.04-du.

## 2026-07-04 — Verificado en el bundle + NotFound

- **Comprobado en el CSS compilado** (no en el fuente): la regla de Login
  sale correcta del build —
  `._page_17c29_6{padding:...;background:var(--paper);position:relative}` —
  sin flex, sin min-height y sin centrado. El arreglo ESTA en el paquete.
- Inspeccionando el bundle aparecio **otra `.page` con el patron roto
  intacto** (`justify-content:center` + `min-height:100dvh` + `overflow`):
  era **NotFound**. Mismo defecto, misma cura.
- Sello NURA_BUILD 2026.07.04-dt.

## 2026-07-04 — Login: el layout mas simple que existe

- Cinco intentos fallidos deduciendo sobre codigo sin poder ver la pantalla.
  Se abandona el diagnostico y se elimina la clase entera de fallo: Login
  pasa a **flujo normal** — sin flex, sin min-height, sin centrado vertical,
  sin overflow. Los hijos se apilan de arriba abajo.
- Con este layout es **imposible** que el contenido acabe al fondo de la
  pantalla. Si el sintoma persiste, la causa NO esta en Login, y eso ya es
  informacion: habra que buscar en lo que renderiza por encima.
- Sello NURA_BUILD 2026.07.04-ds.

## 2026-07-04 — Login: el teclado, y el contenedor que no existia

- **El eslabon que faltaba**: `AppShell` tiene `SELF_LAYOUT` con `/login`
  dentro, y para esas rutas **devuelve los hijos sin el contenedor .shell**.
  Toda mi cadena de contenedores (shell → desktopMain → wrap) **no existe en
  Login**. Por eso ninguna deduccion sobre ella valia, y por eso
  `min-height: 100%` no resolvia: el padre no tiene altura definida.
- **La causa del sintoma**: el campo del telefono tiene `autoFocus`. En iOS
  eso abre el teclado nada mas entrar; el teclado ocupa casi media pantalla
  y el contenido estaba **centrado en la altura completa del viewport**, asi
  que el centro caia detras del teclado y arriba solo quedaba el degradado.
  Con `overflow: hidden`, sin forma de alcanzarlo.
- Cura doble: altura determinista (`100dvh`, sin depender de ancestros que
  en esta ruta no existen) y **fuera el autoFocus del telefono** — abrir el
  teclado antes de que nadie haya visto la pantalla es hostil ademas de
  romper el layout. Los pasos de codigo y nombre lo conservan: alli el
  usuario ya viene escribiendo.
- Sello NURA_BUILD 2026.07.04-dr.

## 2026-07-04 — Login: la regla duplicada que anulaba el arreglo

- Login.module.css tenia **DOS reglas `.page`**: la base y otra dentro de
  `@media (min-width: 768px)` que **reintroducia `min-height: 100dvh`**,
  justo lo que el ciclo anterior habia quitado. En pantalla ancha, el
  arreglo quedaba anulado por la cascada.
- Corregida tambien. Leccion repetida (ya paso con `.section` del perfil):
  **al cambiar una regla, comprobar si existe otra con el mismo selector**
  mas abajo o dentro de una media query.
- Sello NURA_BUILD 2026.07.04-dq.

## 2026-07-04 — Login: disposicion a prueba de fallos

- **Dos ciclos arreglando la pantalla equivocada.** El fundador describio
  "logo, Nura, encuentra a la persona adecuada" — eso NO es el Perfil de
  invitado (que dice "Crea tu cuenta gratis"), es **Login**, la pantalla a
  la que lleva ese boton. Lo entendi al leer su descripcion del contenido,
  no antes.
- Login tenia `min-height: 100dvh` + `justify-content: center` +
  `overflow: hidden`. Ese trio **solo funciona si el contenedor mide
  exactamente el viewport**: si mide de mas, el centro cae fuera de la
  pantalla y overflow hidden impide llegar a el. Encaja con el sintoma
  (contenido abajo, degradado vacio arriba).
- No pude identificar POR QUE el contenedor mide de mas sin poder medir en
  dispositivo. Asi que en vez de seguir adivinando: **disposicion que no
  puede fallar** — alineada arriba, ocupando lo que le den (`100%`, no
  `100dvh`), con scroll y reservando la barra. Peor caso posible: hacer
  scroll. Nunca contenido inalcanzable.
- Sello NURA_BUILD 2026.07.04-dp.

## 2026-07-04 — La Puerta de Registro: la causa real

- El arreglo anterior (vh→dvh) era correcto pero **no era la causa**. La
  verdadera, verificada en las dos ramas del archivo: la rama con sesion
  dibuja `<PageHeader />` (L129) y la de invitado **no** (L81), pero **las
  dos compartian `.page`**, que lleva `padding-top: var(--header-h)`.
- En la rama de invitado eran **76px de vacio empujando todo hacia abajo**,
  reservados para una cabecera que nunca se pinta. Y esa rama tampoco
  reservaba la barra inferior (no pasa por `.scroll`), asi que el ultimo
  boton se iba por debajo.
- Cura: `.pageGuest` propio — sin reserva de cabecera, con reserva de barra
  — y `min-height: 100%` en vez de restar al viewport una cabecera que no
  existe. El contenedor ya sabe cuanto mide.
- Sello NURA_BUILD 2026.07.04-do.

## 2026-07-04 — La Puerta de Registro no se sale de la pantalla

- El fundador reporto que al entrar en Perfil sin cuenta, todo se desplazaba
  hacia abajo y desaparecia. Causa: `.noUser` usaba
  `min-height: calc(100vh - ...)`. **En Safari iOS `vh` mide el viewport de
  LAYOUT** — incluye la franja del navegador — asi que la caja salia mas
  alta que la pantalla y, con `justify-content: center`, el centro caia
  fuera. Era el UNICO `100vh` de toda la app: por eso solo pasaba ahi.
- Es el mismo mal que curamos en La Hoja; este bloque quedo fuera de aquel
  barrido porque entonces mire modales y hojas, no pantallas de contenido.
- Comprobado antes de tocar (y volvio limpio): la rama de invitado devuelve
  `.page > .noUser` sin pasar por `.scroll`, asi que **no hay doble reserva**
  — el bloque resta la barra el mismo y la aritmetica era correcta.
- **La ley se extiende**: `vh` prohibido en toda la app, no solo en paneles.
  Y `npm run preflight` lo vigila: nos ha mordido dos veces, merece
  verificacion automatica y no confianza.
- Sello NURA_BUILD 2026.07.04-dn.

## 2026-07-04 — La Simetria: el input invadia la pantalla (Nura diseño)

- El fundador señalo que las sugerencias estaban mas pegadas al input que al
  texto. Medido: no era falta de aire, era **solapamiento**. La barra ocupa
  12 + 60 + 12 = **84px** y `--float-bottom-h` reservaba **76**: el input se
  comia 8px de lo que hubiera encima. El error venia de antes (con el boton
  a 38px ya faltaban 6), pero subirlo a 44 lo agravo.
- **Daño colateral que esto explica**: `.chatSpacer` usa la misma variable,
  asi que **la ultima tarjeta de cualquier conversacion quedaba tapada**.
  Corregir la variable arregla las dos pantallas.
- Compas simetrico en bienvenida: saludo → space-20 → sugerencias →
  space-20 → input.
- **El input no estaba alineado con nada**: inset de 20px cuando la cabecera
  y el contenido usan 16. La capsula caia 4px por dentro de la linea
  vertical de la pantalla. Al gutter de la app.
- Se conserva a proposito la asimetria interna de la capsula (8/8/8/20): el
  texto necesita sangria y el boton no. Es una asimetria con razon.
- Sello NURA_BUILD 2026.07.04-dm.

## 2026-07-04 — Una sola puerta a la IA (pregunta del fundador)

- El fundador pregunto si el buscador de Explorar era necesario. Al mirarlo:
  **no filtraba la lista — llamaba a `runAiSearch`, un motor PARALELO** con
  su propio analisis y su propia llamada a la API.
- Habia dos puertas al corazon del producto y la segunda servia su version
  pobre: sin comprension, sin "creo que ya tengo a la persona", sin el
  porque, sin el silencio honesto, sin la carta. Solo una lista. Quien
  entraba por ahi podia concluir que Nura es un buscador con filtros.
- **Convertido en umbral** (opcion elegida por el fundador): la frase viaja
  a Inicio y responde Nura con su motor. Se conserva el habito de quien usa
  ese buscador sin traicionar la voz del producto. Retiradas las 25 lineas
  del motor paralelo y su estado huerfano.
- Sello NURA_BUILD 2026.07.04-dl.

## 2026-07-04 — El Umbral: que la puerta de entrada no mienta

- **Un boton que no hacia nada**: el `+` de la barra decia
  `aria-label="Adjuntar"` y **no tenia onClick**. Ocupaba 34px del sitio mas
  valioso de la app, prometia adjuntar archivos y al pulsarlo no pasaba
  nada. Verificado antes de tocar: estaba en **tres pantallas** (Inicio,
  Chat y RegisterHelper) y **ninguno** tenia funcion. Retirados los tres.
  Un control que no responde daña mas que la ausencia de una funcion que
  nadie ha pedido.
- **El boton de enviar estaba por debajo del area tactil**: 38px, cuando la
  primitiva Button cuece 44px precisamente para no depender de que alguien
  se acuerde. Es el boton mas pulsado del producto. Corregido.
- La caja de entrada **nombra a Nura en la primera visita**: quien abre por
  primera vez no sabe con quien habla.
- De paso: import huerfano preexistente en DesktopSidebar, destapado al
  revisar (no lo habia tocado este ciclo).
- Sello NURA_BUILD 2026.07.04-dk.

## 2026-07-04 — El logo vuelve al centro (correccion)

- Al retirar la columna vacia de la cabecera, el logo quedo descentrado. Esa
  columna no era desperdicio: era el contrapeso que lo mantenia en el eje.
  Restaurada. Anotado en design-system para no repetirlo.
- Sello NURA_BUILD 2026.07.04-dj.

## 2026-07-04 — La Primera Pantalla: la promesa deja de depender del reloj

- **Tercera correccion seguida a mi propio analisis**: en Fase 1 afirme que
  la primera pantalla "no promete nada". Falso — el saludo ya decia
  "Cuentame que necesitas y lo encontramos", exactamente la frase que yo
  iba a proponer como novedad. Habia leido el saludo del PROFESIONAL y
  asumido el del visitante sin verificarlo.
- **Lo que si era real y pesa**: esa frase solo aparecia **por la tarde**.
  Quien abria por la mañana leia "¿En que puedo ayudarte esta mañana?", una
  pregunta educada que no explica a que viene el producto. La unica linea
  que convierte a un desconocido estaba condicionada al reloj.
- Ahora la promesa es fija para quien no conoce Nura, y a quien ya ha
  buscado antes se le saluda sin explicarle la casa. La variacion horaria se
  queda donde aporta: en "Buenos dias / Buenas tardes".
- La cabecera dejaba **una columna vacia** (`<div />`) para centrar el logo:
  el sitio de mas valor de la pantalla, gastado en decoracion. Logo a la
  izquierda, rejilla de 2 columnas.
- Las sugerencias respiran (7px→escala): el generador dinamico cruza hora,
  dia e historial, y la presentacion no lo acompañaba.
- Sello NURA_BUILD 2026.07.04-di.

## 2026-07-04 — La Burbuja: el ultimo metro, a la altura (Nura diseño)

- **Correccion a mi propio analisis, la segunda seguida**: en Fase 1 afirme
  que la burbuja del usuario estaba rota porque `--card-radius` no existia.
  **Falso** — existe en index.css:150. Busque el token con el nombre nuevo
  (`--radius-card`) y no encontre el viejo. La burbuja funcionaba.
- **Lo que si era real**: convivian `--card-radius` (18px) y `--radius-card`
  (14px) — nombres casi identicos, valores distintos. Una trampa para quien
  escriba uno esperando el otro. El heredado pasa a apuntar a `--radius-md`
  y queda marcado; `--radius-card` conserva su significado (lo anidado).
- **La hora del mensaje era ilegible**: 10px con opacidad 0.28 sobre blanco
  y 0.45 sobre morado — el mismo caso del Badge de ayer. En un chat sobre
  cuando viene alguien a tu casa, la hora importa. Siete sitios a
  `--text-xs` y opacidades subidas.
- Barrido de rellenos y curvas literales a sistema. **No se tocan** las tres
  reglas con `!important` (sobreescrituras de un componente ajeno): tocarlas
  sin ver el resultado es pedir una regresion.
- Sello NURA_BUILD 2026.07.04-dh.

## 2026-07-04 — La Conversacion: Chats entra en la ley (Nura diseño)

- `.chatRow` — la fila que el usuario abrira cada vez que vuelva a Nura —
  **incumplia cuatro leyes a la vez**: curva 30px (la ley dice 18), sombra
  `md` (la `md` se reserva al protagonista; una lista va en `sm`), borde
  `rgba(...,0.07)` a mano y relleno `13px` (valor que no existe en la
  escala). Quedo fuera del censo de La Superficie porque aquel dia mire las
  tarjetas de persona y de obra, no las de conversacion.
- Barrido del modulo entero para no dejar la mitad arreglada (el error de
  `--rule`): curva del chip, rellenos de cabecera y buscador.
- **Correccion a mi propio analisis**: en Fase 1 afirme que Chats era "la
  unica superficie que no muestra la Confirmacion". **Falso** — la fila ya
  mostraba "✓ funciono", la persona a quien ayudaba y la cita viva. Lei la
  anatomia de la fila pero no su interior antes de afirmarlo.
- **Hallazgo real en su lugar**: el `Badge` size `xs` usaba **9px** — el
  discolo por debajo del minimo legible que reporte en La Escala — y es
  justo el tamaño de "✓ funciono". El sello de confianza no puede ser lo
  mas pequeño de la pantalla. Corregido a `--text-xs`.
- Verificado: el verde de `Badge success` coincide exactamente con el del
  sello del Muro. Confirmar significa lo mismo en las dos pantallas.
- Sello NURA_BUILD 2026.07.04-dg.

## 2026-07-04 — La Puerta de Produccion (Nura Copilot)

- **El interruptor deja de ser manual**: DEMO_MODE deriva de VITE_DEMO con
  DEFAULT_DEMO de respaldo, para que una compilacion de produccion no pueda
  salir en modo demo por olvido. **Se deja en true a proposito**: cambiarlo
  hoy le quitaria al fundador la Confirmacion Humana a los 30s en su
  dispositivo. El dia del lanzamiento se pone a false.
- **Correccion de un pendiente que daba seguridad falsa**: el pendiente
  decia "clave anon Supabase → env". Una anon key esta DISEÑADA para viajar
  al navegador, y Vite incrusta cualquier VITE_* en el paquete: moverla no
  esconde nada. El riesgo real es otro y es concreto — claudeApi.js hace
  PATCH sobre `helpers` con esa clave; si el rol anon tiene escritura,
  cualquiera reescribe los datos de los profesionales. Anotado como BLOQUEO
  DE LANZAMIENTO. La clave pasa a .env igualmente, para poder ROTARLA.
- **Quinta puerta** `npm run preflight`: modo demo, restos de desarrollo y
  el aviso de RLS. Con excepciones declarables (`// preflight-ok`) — el
  sello en consola es util y no se borra por complacer a una puerta.
- Sello NURA_BUILD 2026.07.04-df.

## 2026-07-04 — Los Dos Silencios (Nura Copilot)

- **74 lineas de codigo muerto**: habia DOS `if (!matches?.length)` seguidos.
  El primero respondia y hacia return, asi que el segundo — un sistema
  completo de recuperacion con alternativas por categoria, bien pensado —
  no podia ejecutarse jamas. Rescatado su mapa antes de borrarlo.
- **El fallo de producto**: Nura confundia dos silencios que no se parecen.
  Quien decia "logopeda infantil para mi hijo de 6 años" — con toda
  claridad — recibia "no estoy segura de haberte entendido, ¿me lo cuentas
  con otras palabras?" y tres chips ajenos. Es peor que no encontrar:
  **es culpar al usuario de un vacio de oferta que es del producto**.
- Ahora se separan por `analysis.categoria === 'otro'` (la misma señal que
  usa LA PUERTA del matching): si no comprendio, se pide reformular; si
  comprendio, la verdad va delante — "Te he entendido: buscas apoyo con el
  habla. Ahora mismo no tengo a nadie asi cerca de ti" — con salidas reales
  (alternativa por categoria, ampliar zona, avisarme cuando haya alguien).
- **La demanda insatisfecha se registra** desde ahora. Hoy vive en el movil
  y el fundador no la ve; su valor llega con el backend, pero si no se
  empieza a guardar ya, ese dia habra cero historico. Anotado en context.
- Suite +2 casos. Sello NURA_BUILD 2026.07.04-de.

## 2026-07-04 — Fuera la palabra "barrio" de la voz de Nura

- Decision de marca del fundador: en español connota baja calidad. Corregidas
  las 9 apariciones visibles (titulo de Comunidad, filtro, compositor,
  rotulo, estado vacio, autor de las historias, dos avisos y la ficha de un
  profesional) con la alternativa que pedia cada contexto: "cerca de ti",
  "tu zona", "la comunidad" — no un buscar-y-reemplazar ciego.
- **Se conserva a proposito en el diccionario del matching**: el usuario si
  puede escribir "busco alguien en mi barrio" y Nura debe entenderle.
  **Comprender no es hablar.** Documentado en el propio codigo y en la ley.
- Sello NURA_BUILD 2026.07.04-dd.

## 2026-07-04 — El Muro de Conexiones: que la prueba pese

- Lectura completa de manifesto y context antes de tocar nada. El documento
  ya definia esta pestaña — **"El Muro de Conexiones: prueba social
  verificada, con las del propio usuario primero"** — y su trabajo:
  "la confianza se demuestra, no se declara; verificacion visible,
  resultados confirmados por quien los vivio, prueba social especifica y
  local".
- Contraste honesto: un muro social (posts, reacciones) lo copia cualquiera
  en un mes. El foso que declara el manifiesto es **la reputacion construida
  ayudando de verdad**. La pestaña debe pesar como prueba, no como feed.
- **① El sello, en primera linea**: `confirmContact()` ya guardaba
  `confirmed`/`confirmedAt` desde la Confirmacion Humana y **no se mostraba
  en ninguna parte**. Ahora cada pieza confirmada lo lleva. Y si no hay
  confirmacion real, NO se finge: sale sin sello.
- **② Localidad**: zone y distance vivian en los datos sin usarse. Ahora
  "Gràcia · a 800 m de ti" — prueba especifica y local, como pide el
  manifiesto.
- **③ Regresion propia corregida**: context.md pedia "las del propio usuario
  primero" y mi reescritura anterior las disolvio en el rio. "Tu conexion"
  recupera su bloque de honor.
- **④ El orden pasa a ser jerarquia de prueba**, no cronologia.
- context.md actualizado: la descripcion de la pestaña vuelve a ser fiel a
  lo construido.
- Sello NURA_BUILD 2026.07.04-dc.

## 2026-07-04 — Unificacion perfil/muro + Comunidad completa

- **Una sola pieza en todas partes**: nace `obraAPost()`, la UNICA
  traduccion de obra a post. Perfil y muro parten de ella, asi que dibujan
  literalmente lo mismo. Dos mapeos separados acabarian siendo dos disenos.
- **Hallazgo**: el perfil tenia DOS conceptos de publicacion conviviendo —
  "Su obra" (nuevo) y una seccion "Publicaciones" heredada de v1, con su
  propio componente local, sus likes y su diseno. Eso era justo lo que hacia
  que perfil y muro no se parecieran. Fusionados: `publicacionesDe()` reune
  obra y posts antiguos en una sola forma, y el componente local muere.
- **CAT_HUMANA extraido** a `src/data/categorias.js`: vivia dentro de Home y
  Comunidad lo necesitaba. Se extrae en vez de duplicarse.
- **Comunidad, mas completa**: fila de **temas** (recorrer el barrio por lo
  que te preocupa), **"Lo que mas ha servido"** (ordenado por la senal real
  de Me sirve, no por una cifra inventada), **"A quien seguir"**
  (profesionales con obra a los que aun no sigues) y los destacados.
- Sello NURA_BUILD 2026.07.04-db.

## 2026-07-04 — EL MURO: rediseño total de Comunidad (mandato del fundador)

- **La causa real de la fealdad, encontrada**: no era el orden. Eran DOS
  idiomas visuales en el mismo rio — la obra dibujada como tarjeta blanca
  con chip y titulo, la conexion como parrafo suelto + tarjeta de persona +
  linea gris. Dos componentes alternandose nunca se leen como una
  comunidad. Mientras el rio los mezclaba la alternancia lo disimulaba; al
  agruparlos quedo a la vista.
- **PostCard, la unidad unica**: autor arriba, contenido, barra social.
  Obra y conexion pasan a ser el mismo post con distinto contenido. Las
  conexiones tienen ahora AUTOR (el vecino, o tu si es tu historia) y citan
  al profesional como mencion tocable.
- **Motor social**: reaccion **"Me sirve"** con contador y persistencia,
  comentarios en primera linea (contador visible, hilo desplegable, los
  arranques guiados), y **compositor arriba** — el gesto de publicar deja
  de estar escondido en el Perfil.
- **"Me sirve" y no un corazon**: no mide popularidad, mide utilidad.
  Respeta la decision original del fundador (LinkedIn, no Instagram) y le
  dice algo real a quien publica.
- Contadores de arranque: **semillas curadas escritas a mano**, no cifras
  generadas al vuelo — la leccion del pulso inventado, aplicada.
- El pulso vuelve a ser verificable: historias y personas que se pueden
  contar bajando por la pantalla.
- Sello NURA_BUILD 2026.07.04-da.

## 2026-07-04 — Comunidad deja de ser un feed (replanteamiento)

- **La prueba incomoda**: la primera linea de Comunidad eran numeros
  inventados. `pulsoDelDia` hasheaba la fecha de hoy y devolvia
  "N conexiones · M citas": no describia nada. En el producto que extirpo el
  cronometro falso del chat y prefiere cero tarjetas antes que una
  recomendacion equivocada, **la pantalla cuyo trabajo es dar confianza
  abria mintiendo**.
- **El pulso honesto**: un numero solo es honesto si puedes verificarlo
  bajando por la pantalla. Ahora cuenta lo que la pestaña muestra de verdad
  — vecinos que encontraron a su persona y profesionales que han
  documentado su trabajo — y reconoce la tuya si la tienes.
- **Muere el rio mixto 2:1.** Un feed ordena por novedad y exige caudal: el
  dia del lanzamiento hay 16 semillas y ningun flujo, y un rio sin agua no
  parece tranquilo, parece un barrio vacio. Ahora se ordena por EVIDENCIA.
- **La demanda testifica primero**: quien llega con miedo necesita oir a otro
  vecino, no a un profesional presentandose. Las conexiones ✓ suben al
  frente; la obra pasa a respaldarlas ("Quien lo ha demostrado").
- **Y el giro**: el historial guarda `{query, category}`, asi que Comunidad
  responde a tu caso — "Porque buscaste una logopeda" abre con una historia
  resuelta de TU categoria y la obra de quien la resolvio. Si no hay nada de
  lo tuyo, el bloque no aparece: nunca un hueco vacio.
- Sello NURA_BUILD 2026.07.04-cz.

## 2026-07-04 — La Hoja: ningun panel se sale de la pantalla

- El fundador encontro que en el muro de registro el boton "Ya tengo cuenta"
  quedaba escondido tras el menu inferior. Causa: la hoja **no limitaba su
  altura** (0 max-height, 0 overflow) y su relleno inferior era de 32px,
  pensado para una pantalla sin barra — la navegacion ocupa ~73px.
- Y era **fallo de familia, no de una pantalla**: las TRES hojas del
  producto estaban igual. La mas expuesta era la de disponibilidad, que
  acababa de ganar hasta doce horas en la rejilla del tecnico: habriamos
  entregado el calendario nuevo con su boton de enviar fuera de pantalla.
- Ley aplicada a las tres: `max-height: 88dvh` (viewport visual, para que el
  teclado de iOS no la saque) + `overflow-y: auto`, y las ancladas al fondo
  reservan la barra en su relleno inferior.
- Sello NURA_BUILD 2026.07.04-cy.

## 2026-07-04 — La Agenda: disponibilidad real, por horas (Nura Copilot)

- Diagnostico peor que el sintoma: ya habia horas, pero eran de mentira —
  ocho pildoras fijas escritas a mano (9,10,11,12,16,17,18,19), **iguales
  para los 123 profesionales y para los siete dias**, sin ningun dato
  detras. Un cerrajero de urgencias ofrecia el mismo horario que una
  logopeda infantil, y dos personas podian pedir las 17:00 del martes.
- `src/data/horarios.js`: horario por categoria (tecnico y hogar con franja
  amplia y sabados; logopedia y clases por la tarde; salud y legal de
  mañana; cuidado y mascotas todos los dias), `slotsDe()` con estados
  **libre / pendiente / ocupada**, y filtro de horas ya pasadas si es hoy.
- **Hallazgo clave**: la ocupacion vivia en DOS almacenes — `services`
  (reservas desde el perfil) y `citas` (acuerdos del chat). Mirar solo uno
  dejaba huecos falsamente libres. `ocupacionesDe()` los normaliza.
- El modal deja de mentir: dias sin huecos apagados, horas ocupadas
  tachadas y pendientes con borde punteado (mostrarlas es lo que hace
  creibles las libres), y "Ese dia lo tiene completo" en su voz.
- Decision aprobada: una hora pedida y no confirmada **se bloquea como
  pendiente** — perder un hueco cuesta menos que hacer quedar mal al
  profesional con dos vecinos.
- La puerta de lint caza `citas` fuera del ambito del modal antes de que
  llegara a produccion. Suite +3 casos.
- Sello NURA_BUILD 2026.07.04-cx.

## 2026-07-04 — La Barra de Accion (encargo del fundador)

- Medido: los dos CTA del perfil vivian en la linea 398 de 410 — despues del
  hero, los idiomas, la formacion, la obra y las valoraciones. Para
  escribirle habia que **recorrer el perfil entero**: la inversion exacta de
  la jerarquia real.
- Nace la barra fija sobre la navegacion, con la jerarquia explicita en el
  ancho (Escribir ~62%, Disponibilidad ~38%). "Ver disponibilidad" pierde el
  verbo: en una barra cada palabra cuesta ancho al protagonista.
- Ambas usan la primitiva Button (44px de area tactil heredados). El
  secundario cede su borde morado: dos tratamientos morados en una barra
  compiten. El principal conserva su sombra morada, que ahi si lo despega.
- handleContact intacto (incluye el flujo de invitado). Los CTA del fondo
  mueren con sus popIn (ley -ar) y sus reglas huerfanas.
- Sello NURA_BUILD 2026.07.04-cv.

## 2026-07-04 — El Compas: el ritmo vertical de las secciones

- El fundador señalo que la linea separadora aparecia pegada al contenido
  (ej. Idiomas). Causa medida: `.section` tenia `padding: 20px 20px 0` —
  **20px de aire arriba y CERO abajo** — mas un `margin-top: 4px` que fingia
  el hueco. Asimetria 20 contra 4.
- Cura: compas simetrico (--space-20 a cada lado de la linea) y muere el
  margen-parche. El perfil pasa a separar con --ink-border como el resto.
- **Correccion a mi propio analisis**: en Fase 1 afirme que `.section`
  estaba definida dos veces. Era falso — habia leido mal mi recon (la otra
  linea era `.sectionFirst`). Solo hay una definicion.
- `--rule` sobrevive en 8 archivos de estructura, fuera del encargo: queda
  como DEUDA censada en context.md.
- Sello NURA_BUILD 2026.07.04-cu.

## 2026-07-04 — El Perfil, de borde a borde (encargo del fundador)

- Dos errores reales de geometria en las paginas de perfil:
  **① Doble reserva abajo**: .page reservaba var(--nav-h) Y .scroll añadia
  40px (profesional) o 20px (propio) — 113px y 93px de aire muerto.
  **② Banda vacia arriba**: la cabecera es transparente y flotante (solo sus
  botones llevan fondo con blur), pero la pagina reservaba --header-h como
  si fuera barra solida: 76px de papel desnudo antes del hero blanco.
- Cura: el hero del profesional sube al borde (asume el --header-h en su
  propio padding, su blanco y su aurora pasan BAJO la cabecera) y la barra
  se reserva una sola vez en .scroll. **Tu perfil no tiene hero**, asi que
  conserva su padding-top: aplicarle lo mismo habria metido el nombre bajo
  los botones. Verificado antes de tocar.
- Colateral: el hero arrastraba un fadeInUp en linea — entrada de contenido,
  prohibida por la ley de -ar. Retirada.
- Sello NURA_BUILD 2026.07.04-ct.

## 2026-07-04 — El Acuse: que Nura reconozca lo que consigues

- Auditoria del feedback: de los seis avisos del producto, **cuatro servian
  para impedirte algo** y solo dos para celebrar. Y los actos que mas
  importan ocurrian en silencio.
- El peor: **confirmar que una conexion funciono** crea una publicacion en
  el Muro del barrio — el corazon del producto — y ocurria sin decir nada,
  en otra pestaña. Ahora: "Me alegro mucho. Lo he contado en el barrio — a
  alguien le va a servir."
- Publicar obra gana el unico momento en que el producto explica el foso al
  profesional: "Cuando alguien busque algo asi, tu caso hablara por ti."
- Los avisos de bloqueo dejan de sonar a portero: "Inicia sesion para seguir
  profesionales" pasa a "Entra y podras seguir su evolucion."
- **Ley del acuse** en design-system, para que mas avisos no sea la
  respuesta a todo: si la vista ya responde, el aviso sobra.
- Sello NURA_BUILD 2026.07.04-cs.

## 2026-07-04 — La Espera: un solo lenguaje para el tiempo en blanco

- Tres lenguajes para lo mismo: esqueleto en Explorar, un circulo morado
  latiendo en el perfil (el destino mas visitado de la app) y nada en
  Chats/Comunidad.
- Alcance reducido tras el recon, por honestidad: **Chats y Comunidad no
  tienen espera** — sus datos vienen del contexto ya montado. Fabricarles un
  esqueleto seria teatro. Queda LEY en context.md para el dia del backend.
- Nace `Skeleton` (card / block) extraida de lo que ya funcionaba; Explorar
  deja de escribir el marcado a mano y el perfil cambia el pulso abstracto
  por el esqueleto de su propio contenido.
- Verificado antes de borrar: @keyframes pulse lo usan varios logos, se
  queda; solo muere la clase .loadingPulse, huerfana.
- Sello NURA_BUILD 2026.07.04-cr.

## 2026-07-04 — El Vacio: la pantalla que mas se ve el primer dia

- Auditoria del primer dia: en la primera sesion de Nura casi todo esta
  vacio, y habia cuatro estados vacios que eran cuatro productos distintos
  (voz de Nura / funcional / plana), con estructuras distintas. **Dos eran
  callejones sin salida**: el de Chats decia "cuentale a Nura que
  necesitas"... sin boton para ir a contarselo.
- Nace `EmptyState`: voz + apoyo + **accion siempre**. Migrados los tres
  vacios reales; el de Chats conserva su frase (la mejor de las cuatro) y
  gana la salida; el de Explorar deja de hablar como buscador roto.
- Excluido por disciplina: el "Perfil sin cuenta" NO es un vacio, es un
  muro de registro — otra familia, se queda como esta.
- Sello NURA_BUILD 2026.07.04-cq.

## 2026-07-04 — El Velo, completado (fallo de censo corregido)

- Mi censo de Fase 1 solo conto los .jsx, asi que los rellenos que viven en
  los .module.css usaban alfas que ni aparecian en el cuadro (0.02, 0.06).
  Familia completada con --surface-faint y --surface-soft, mismo criterio:
  nombrar lo que existe sin mover un pigmento.
- Verificado ademas que ninguna sombra ni borde cambio: las lineas que el
  diff marcaba contenian fondo Y borde juntos; solo cambio el fondo.
- Sello NURA_BUILD 2026.07.04-cp.

## 2026-07-04 — El Velo: la superficie tenue, con nombre (Nura diseno)

- 22 sitios pintaban el mismo concepto con cuatro intensidades (0.03, 0.04,
  0.05, 0.10). Al mirar PARA QUE se usaba cada una, no eran cuatro
  decisiones: eran dos conceptos y tres accidentes. Nacen
  --surface-subtle / muted / scrim.
- Sustitucion acotada a `background`: los mismos alfas en sombras y bordes
  son otra familia y quedan intactos.
- La cabecera de Chats abandona su gris azulado (rgba(245,245,248,0.95)) y
  su borde blanco: adopta la receta de la BottomNav. Si la app tiene dos
  barras fijas, son la misma barra.
- Sello NURA_BUILD 2026.07.04-co.

## 2026-07-04 — El Rotulo: la tipografia menuda, bajo control (Nura diseno)

- El rotulo de seccion (TU SEMANA, CERCA DE TI, EN SUS PROPIAS PALABRAS...)
  aparecia 17 veces en 8 archivos. Tamano y peso coincidian, pero el
  **tracking tenia SIETE valores** (0.3 a 1px) — y en versalitas pequenas el
  espaciado ES el diseno.
- Nace `SectionLabel` con tracking **0.6px calibrado** (0,05-0,08em es el
  rango sano en 11px) y dos tonos. Migrados los rotulos reales conservando
  margen y color: cero movimiento de layout, cero cambio de color.
- Clasificacion previa: de los 17, seis son **insignias** (fondo + pildora),
  otra familia — les corresponde `Badge`, no se fuerzan aqui.
- Falsa alarma verificada antes de tocar: el color sospechoso de la tarjeta
  vertical era correcto; mi censo habia capturado el borde del padre.
- Sello NURA_BUILD 2026.07.04-cn.

## 2026-07-04 — La Superficie: una sola piel (Nura diseno)

- Tres tarjetas, tres pieles: HelperCard curvaba 30px con sombra md y borde
  rgba a mano; ObraCard 18 con sm; HelperCardTall 14/18. En el rio de
  Comunidad aparecen una sobre otra — se veia sin buscarlo.
- **La curva de Nura es 18px**: los 30 se leian blandos y competian con los
  botones (que si son pildoras); los 14, secos. Receta unica: curva 18,
  borde --ink-border, relleno --space-14/16 (muere el 15px fuera de escala)
  y **sombra con jerarquia** — sm en reposo, md solo para el protagonista.
  Antes era al reves: la tarjeta de lista flotaba mas que la recomendacion.
- **Hallazgo colateral**: .card conservaba `animation: cardIn` — una
  animacion de entrada que violaba la ley de -ar (las listas no animan;
  aparecen). Retirada.
- Sello NURA_BUILD 2026.07.04-cm.

## 2026-07-04 — El Boton: la primitiva que faltaba (Nura diseno)

- Hallazgo: **138 botones en la app y 0 componentes compartidos**. En
  components/ui vivian Badge, LiveDot, Bubble y StatBar, pero no Button:
  cada pantalla se dibujaba el suyo, con paddings de 13px, 15px o
  var(--space-14) segun quien lo escribiera.
- Nace `<Button>` con variantes primary/secondary/ghost y **minHeight 44px
  cocido dentro** — el pendiente de area tactil que arrastrabamos, resuelto
  de raiz y para todos a la vez.
- Migrados los 6 botones de accion principal (Escribir a X, Publicar en tu
  obra, Crear cuenta gratis, Buscar a mi persona, Enviar solicitud, Enviar
  valoracion), uno a uno, conservando cada onClick. El `disabled` del
  boton de cita ahora lo atenua la primitiva, no un opacity a mano.
- No migrados a proposito: los botones circulares de envio (Chat, ObraCard)
  son iconos, otra familia — piden un IconButton en otra pasada.
- Sello NURA_BUILD 2026.07.04-cl.

## 2026-07-04 — El Ritmo: la escala de espaciado, viva (Nura diseno)

- Cifra mas extrema de la auditoria: 216 espaciados a mano, **0 usos de
  token**. Causa encontrada: habia DOS escalas compitiendo en index.css
  (semantica micro/std/block/section y camiseta xs/sm/md/lg/xl/2xl), con
  valores solapados. Cuando hay dos sistemas, no hay ninguno.
- Y el ritmo real las desmentia a ambas: **10px era el valor mas usado de
  toda la app (53 veces) y ninguna escala lo nombraba**; con 6, 14 y 24
  sumaban 117 usos huerfanos. La leccion de --radius-card, a mayor escala.
- Aplicado: escala unica nombrada por su valor (2-32), las dos viejas como
  alias (nada se rompe), y **333 sustituciones de coincidencia exacta**:
  cero pixeles movidos, la app se ve identica.
- Pendiente de decision del fundador: 64 valores fuera de escala (impares y
  grandes) y la pregunta grande — alinear a reticula de 4px movería 6, 10 y
  14 (117 elementos), cambio real y visible.
- Sello NURA_BUILD 2026.07.04-ck.

## 2026-07-04 — La Tinta Viva, terminada (Nura diseno)

- Hallazgo raiz: la direccion artistica estaba a medias EN LOS PROPIOS
  TOKENS. --ink-secondary y --ink-tertiary eran violeta calido, pero
  --ink-primary (0.85), --ink-disabled (0.25) y **--ink-border (0.06)**
  seguian en negro puro: cada borde de cada tarjeta de la app estaba
  trazado en frio. Tres lineas corrigieron cientos de elementos.
- Barrido: **313 negros puros** convertidos a tinta calida a la misma
  opacidad (299 en componentes y modulos + 14 en index.css: sombras, borde
  de tarjeta, scrollbar y degradado del esqueleto). **49 morados** a token.
  Nacen --purple-05/30/60, pasos que el producto ya usaba sin nombre.
- Excepciones declaradas: el blanco no se toca; #7B2FFF sobrevive solo como
  definicion del token y en paletas de DATOS (avatares, portadas), que no
  son tokens de diseno.
- Riesgo de layout: cero (solo pigmento). Integridad: 0 lineas eliminadas
  sin color.
- Sello NURA_BUILD 2026.07.04-cj.

## 2026-07-04 — La Curva: el radio como identidad (Nura diseno)

- Diagnostico: 59 radios a mano frente a 18 con token, y la pildora escrita
  31 veces con DOS numeros distintos (100px x17, 99px x14) — la misma
  intencion, dos verdades.
- Hallazgo que cambio el plan: la escala tenia un agujero. 18 elementos
  vivian en la banda 12-16 y el 14px caia equidistante entre sm(10) y
  md(18). No era que los componentes desobedecieran: el sistema no nombraba
  el radio que la app mas usa. Nace **--radius-card: 14px** — cuando el
  producto pide un paso que la escala no tiene, se amplia la escala.
- Aplicado: 58 sustituciones (31 de pildora con cero efecto visual; el resto
  <=2px). 3 discolos de 2px intactos (el salto a xs duplicaria la curva).
- Disciplina: los +2 sobre las 56 previstas eran segundas ramas de ternarios
  (no contables por el patron del censo); integridad verificada en 0 lineas
  eliminadas sin borderRadius.
- Sello NURA_BUILD 2026.07.04-ci.

## 2026-07-04 — La Escala: el sistema manda sobre el componente (Nura diseno)

- Diagnostico: la app tenia una escala de 8 pasos y 15 tamanos en uso; 110
  px sueltos escritos a mano frente a 65 usos de token. Cada componente
  elegia su tamano a ojo — justo lo que la regla NURA DISENO prohibe.
- Aplicado: 109 sustituciones a token (39 ya coincidian exactamente: cero
  efecto visual; el resto se mueve 0,5-1px, imperceptible pieza a pieza).
  Los 7 discolos (>1px de salto) quedan INTACTOS y listados para decision
  del fundador. Hallazgo: --text-num (32px) existia y nadie lo usaba.
- Disciplina: patron acotado (jamas \\s*), recuento antes/despues, y
  verificacion de que 0 lineas sin fontSize fueron eliminadas. La diferencia
  109 vs 102 previstas eran segundas ramas de ternarios, no contables por el
  patron de la prevision.
- Ley nueva en design-system: prohibido escribir un tamano de letra a mano.
- Sello NURA_BUILD 2026.07.04-ch.

## 2026-07-04 — La Carta: Nura escribe el primer mensaje (Nura Copilot)

- Hallazgo del recon: la pantalla IntroLetter (/intro/:id) esta construida
  pero NADIE navega a ella — codigo muerto. Y el chat prellenaba con
  buildPreFill, siete lineas que repetian la consulta cruda sin aportar nada.
- La prueba impresa antes de conectar salvo el ciclo: buildIntroLetter esta
  escrita en voz de NURA y tercera persona ("soy Nura, te escribo en nombre
  de Sergio"), correcta para /intro pero absurda en el chat, donde el
  remitente es el usuario. Ademas la rama de invitado perdia la consulta.
- Solucion: nueva buildChatOpener — primera persona, las palabras del propio
  usuario, y el porque que Nura vio ("Nura te ha recomendado por tu
  experiencia como auxiliar de geriatria"). buildPreFill jubilada;
  buildIntroLetter intacta para su pantalla.
- Sello NURA_BUILD 2026.07.04-cg.

## 2026-07-04 — Tarjetas secundarias: filas alineadas entre si

- El punto de conectado (LiveDot) era inline-block dentro del avatar: se
  apilaba debajo y empujaba nombre/especialidad/meta hacia abajo solo en las
  tarjetas con punto, desalineandolas de las demas. Ahora va posicionado
  encima del avatar (esquina inf. derecha), sin ocupar flujo. Ademas la
  rejilla de alternativas usa align-items:start. Nombre con nombre, meta con
  meta, tengan punto o no.
- Sello NURA_BUILD 2026.07.04-cf.

## 2026-07-04 — Grises mas legibles (menos translucidos)

- Los textos secundarios ("si prefieres comparar", "AJUSTAR ESTA BUSQUEDA" y
  demas) se veian deslavados: --ink-secondary estaba a 58% de opacidad y
  --ink-tertiary a 40%. Subidos a 72% y 55% respectivamente — mas presentes
  y comodos de leer, en toda la app.
- Sello NURA_BUILD 2026.07.04-ce.

## 2026-07-04 — El logo no se repite en mensajes seguidos de Nura

- Dos mensajes seguidos de Nura repetian el logo. Ahora solo en el primero
  de la tanda (firstOfNuraRun); los siguientes reservan su ancho
  (nuraAvatarSpacer 38px) para alinear el texto, como en chats reales.
- Sello NURA_BUILD 2026.07.04-cd.

## 2026-07-04 — Fuera "Lo he entendido así"

- Eliminado el bloque de comprensión (chips "Lo he entendido así" + pie "toca
  cualquier dato si algo no encaja"). Se sobreentiende que Nüra entendió la
  búsqueda: mostrarlo era ruido. La respuesta va directa a la recomendación.
- Sello NURA_BUILD → 2026.07.04-cc.

## 2026-07-04 — Tarjetas de lado a lado, centradas, con respiro

- La indentación de 48px descentraba las tarjetas y quedaba mal. Vuelven a
  lado-a-lado (centradas en la pantalla) con 8px de respiro lateral para que
  no parezcan tan anchas. El TEXTO de Nüra conserva su indentación de
  burbuja (eso estaba bien); solo las tarjetas y filtros van a ancho
  centrado.
- Sello NURA_BUILD → 2026.07.04-cb.

## 2026-07-04 — Márgenes inteligentes por tipo de respuesta

- El 20% derecho comprimía las tarjetas. Regla por tipo: el TEXTO
  conversacional de Nüra se indenta como burbuja (48px izq + max-width 80%,
  poco ancho, mucho aire); las TARJETAS y filtros comparten la misma
  alineación izquierda (48px, para leerse como respuesta de Nüra) pero
  respiran a la derecha (necesitan el ancho para no comprimir la
  información). Cada respuesta con el margen que su contenido pide.
- Sello NURA_BUILD → 2026.07.04-ca.

## 2026-07-04 — El bloque de resultados iguala el ANCHO de la burbuja de Nüra

- La indentación izquierda (48px) ya estaba; faltaba la derecha: la burbuja
  de Nüra tiene `max-width: 80%` (deja aire a la derecha) mientras las
  tarjetas llegaban al borde. Ahora el bloque de tarjetas y los filtros
  llevan `margin-right: 20%` además del `margin-left: 48px`: la respuesta
  completa ocupa exactamente el mismo ancho que el texto de Nüra.
- Sello NURA_BUILD → 2026.07.04-bz.

## 2026-07-04 — Todo el bloque de resultados se alinea con Nüra (48px)

- La tarjeta principal, la frase "si prefieres comparar" con sus
  alternativas, y los filtros "ajustar esta búsqueda" vivían a la altura del
  logo. Ahora todo el bloque lleva la indentación de 48px (avatar + gap),
  igual que la comprensión y las burbujas: la respuesta completa de Nüra
  queda alineada, con el logo siempre más a la izquierda.
- Sello NURA_BUILD → 2026.07.04-by.

## 2026-07-04 — La comprensión se alinea con las burbujas de Nüra

- Los chips "Lo he entendido así" y el pie "si algo no encaja" vivían fuera
  de la fila flex (tras cerrar la burbuja), así que pegaban al margen
  izquierdo, a la altura del logo. Ahora llevan `margin-left: 48px` =
  avatar(38) + gap(10), quedando indentados como el resto de respuestas de
  Nüra.
- Sello NURA_BUILD → 2026.07.04-bx.

## 2026-07-04 — Margen superior unificado (--header-h en toda la app)

- Había dos sistemas: Explore/Chats/Perfil usaban `--header-h` (respeta el
  notch); Home usaba 64px crudo (sin safe-area, más pegado en iPhone) y
  Comunidad 54px crudo (el más pegado). Ambos alineados a `--header-h`, la
  variable que ya respetaba el notch. Armonía superior en las cinco pestañas.
- Sello NURA_BUILD → 2026.07.04-bw.

## 2026-07-04 — Gutter de 16px en TODA la app

- Barrido completo tras unificar Home: Chats (header 20→16, búsqueda 14→16),
  Comunidad (cabecera aurora 20→16; el río ya iba a 16) y Perfil (secciones
  24/20→16). Solo se tocó el margen LATERAL de página; paddings verticales e
  interiores de tarjetas/botones intactos. Toda la app comparte 16px.
- Sello NURA_BUILD → 2026.07.04-bv.

## 2026-07-04 — Márgenes laterales unificados (16px, el de Explorar)

- El fundador notó que Home tenía menos margen lateral que Profesionales.
  Medido: Home usaba 14px, Explore 16px. Home se iguala a 16px en el scroll
  (tarjeta + burbujas) y en sus flotantes (.floatTop/.floatBottom), que se
  alinean con el contenido. Explorar (16px) queda como referencia del gutter
  de la app.
- Sello NURA_BUILD → 2026.07.04-bu.

## 2026-07-04 — La bienvenida asienta JUSTO encima del input

- Quitar el spacer en bienvenida (-bs) dejó el saludo pegado al fondo real
  del contenedor, que pasa por detrás del input → quedaba tapado. Cura:
  `.welcomeSpacer` (altura del input, sin la barra) reserva la burbuja en
  bienvenida, así el flex-end deja el saludo justo encima del input; en
  conversación sigue el .chatSpacer completo.
- Sello NURA_BUILD → 2026.07.04-bt.

## 2026-07-04 — La bienvenida vuelve a asentar abajo

- Efecto colateral de -bq: el .chatSpacer (que reserva input+barra dentro del
  scroll) también se renderizaba en bienvenida, y con `justify-content:
  flex-end` empujaba el saludo hacia arriba — quedaba centrado en vez de
  asentado contra el input. Cura: el spacer solo se renderiza con
  conversación (messages.length > 1); en bienvenida, flex-end asienta el
  saludo abajo como antes.
- Sello NURA_BUILD → 2026.07.04-bs.

## 2026-07-04 — Los pocos píxeles: la barra medía distinto de lo reservado

- Síntoma final: hueco de pocos px entre el fondo y la barra, solo en Home.
  Causa: `.nav` NO tenía `height` — se autodimensionaba por contenido +
  padding(6px) + border(0.5px), mientras `--nav-h` reservaba un 65px
  estimado. Reserva y realidad no coincidían al píxel.
- Cura definitiva: `.nav` gana `height: var(--nav-h)` + `box-sizing:
  border-box`, así mide EXACTAMENTE lo que se reserva — el hueco desaparece
  por definición. Afecta a todas las pestañas por igual (mejora la precisión
  global), pero solo se notaba en Home por su fondo scrollable.
- Sello NURA_BUILD → 2026.07.04-br.

## 2026-07-04 — El fondo scrollea tras el input (matiz del fundador)

- El margin-bottom de -bp cortaba el fondo donde empieza el input; pero el
  input es una burbuja flotante y el chat debe scrollear POR DETRÁS de ella
  hasta la barra. Corregido: `.messages` sin recorte (fondo hasta la barra) y
  `.chatSpacer` reserva input+barra, de modo que la última tarjeta sube por
  encima de ambos mientras el fondo pasa por detrás. El límite real del
  scroll es la barra, no el input.
- Sello NURA_BUILD → 2026.07.04-bq.

## 2026-07-04 — EL BORDE, RESUELTO: el fondo del chat pasaba tras la nav

- Diagnóstico definitivo tras mapear TODAS las cajas ancladas a .page: el
  input (.floatBottom) estaba bien, en bottom:var(--nav-h). El culpable era
  .messages (el fondo scrollable del chat): llegaba al borde del viewport y
  **pasaba 65px por detrás de la barra**. Solo Home tiene ese scroller de
  fondo — por eso solo Home fallaba, y las demás pestañas no.
- Cura mínima sin tocar un solo anclaje: .messages gana
  `margin-bottom: var(--nav-h)` (termina en la línea de la nav); el spacer
  vuelve a reservar solo el input. Input y cabecera no se mueven.
- Sello NURA_BUILD → 2026.07.04-bp.

## 2026-07-04 — REVERSIÓN DEFINITIVA del borde inferior

- El cambio de patrón de layout (fixed→relative) rompe el posicionamiento de
  Home incluso recolocando los anclajes. Revertidos Home.module.css e
  index.css al estado c3cc3e9. **Este borde NO se vuelve a tocar sin poder
  medir la geometría real en el dispositivo** (headless bloqueado en el
  sandbox, capturas no disponibles). Dos intentos, dos reversiones: seguir
  probando reglas a ciegas cuesta más de lo que arregla.
- Sello NURA_BUILD → 2026.07.04-bm.

## 2026-07-04 — El borde inferior, corregido de raíz (cirugía completa)

- Segundo intento del cambio de patrón, esta vez recolocando **los tres
  anclajes a la vez** (el fallo del primero fue cambiar el contenedor y
  dejar los hijos absolutos con sus offsets antiguos):
  1. `.page` pasa de `fixed; inset: 0` a `position: relative; height: 100%`
     — fluye dentro del layout, que ya reserva la BottomNav (patrón de
     Explorar, la pestaña que siempre renderizó correcta).
  2. `.floatBottom` de `bottom: var(--nav-h)` a `bottom: 0` — la caja de
     `.page` ya termina en la línea de la nav.
  3. `.chatSpacer` vuelve a reservar solo el input.
  4. `.desktopMain` gana `display:flex; flex-direction:column; min-height:0`
     para dar referencia de altura real al hijo con `height: 100%`.
  `.floatTop` no cambia: se ancla arriba, donde ambos patrones coinciden.
- Sello `NURA_BUILD` → `2026.07.04-bl`.

## 2026-07-04 — Limpieza del borde inferior (tras la reversión)

- Con todo el árbol a la vista: `.messages` tenía `height: 100%` **además**
  de `flex: 1` — en un contenedor flex column eso fuerza altura completa
  ignorando el reparto, y su caja podía desbordar la del padre. Retirado
  (redundante) y restaurado `overflow: hidden` en `.page`. La reserva del
  spacer (input + nav) es correcta porque `.floatBottom` se ancla sobre la
  nav: el contenido debe librar ambos para verse entero.
- Sello `NURA_BUILD` → `2026.07.04-bk`.

## 2026-07-04 — REVERSIÓN: el cambio a flujo rompió el posicionamiento

- Pasar .page de 'fixed; inset:0' a flujo desplazó todo lo anclado a ella
  (cabecera flotante, barra del input, spacer). Revertido Home.module.css al
  estado -bh, que no estaba roto. El problema del límite inferior queda
  ABIERTO: la hipótesis del contenedor raíz era correcta en el diagnóstico
  pero su aplicación exigía recolocar los tres anclajes a la vez, no solo
  cambiar el contenedor.
- Sello NURA_BUILD → 2026.07.04-bj.

## 2026-07-04 — LA DIFERENCIA CON EXPLORAR (causa definitiva)

- Dato decisivo del fundador: **el límite es correcto en Profesionales y solo
  falla en Inicio**. Comparando ambos contenedores raíz: Explorar usa
  `height: 100%` y **fluye** dentro del layout de la app (que ya reserva la
  BottomNav); Home usaba `position: fixed; inset: 0`, saliéndose del flujo y
  pegándose al viewport — ignorando esa reserva. De ahí que su límite
  inferior cayera antes que la barra.
- Cura: Home adopta el patrón que funciona (flujo + `height: 100%` +
  `overflow: hidden`), `.floatBottom` se ancla a `bottom: 0` de la caja ya
  reservada y `.chatSpacer` vuelve a reservar solo el input.
- Sello `NURA_BUILD` → `2026.07.04-bi`.

## 2026-07-04 — El recorte del padre (`overflow: hidden` en .page)

- Síntoma preciso del fundador: una tarjeta a medias **se corta por encima**
  de la línea de la nav. Ese corte es un `overflow: hidden` — y lo tenía
  `.page`, el contenedor padre. Su caja de contenido terminaba antes del
  borde del viewport, así que recortaba el scroller y todo lo que asomara.
- Cura: `.page` pasa a `overflow: visible` (el scroller interno ya gestiona
  su propio desbordamiento) y `.messages` toma `height: 100%` para llegar al
  borde real. La nav se dibuja encima al ser `fixed`; la reserva de espacio
  la sigue haciendo `.chatSpacer` dentro del scroll.
- Sello `NURA_BUILD` → `2026.07.04-bh`.

## 2026-07-04 — EL SCROLLER ANIDADO (la causa que faltaba)

- Tras corregir `.page` y `.chatSpacer`, la línea persistía: el culpable
  estaba **un piso más arriba**. `.desktopMain` (el envoltorio de las
  pestañas vivas, en index.css) tenía su propio `overflow-y: auto` — dos
  scrollers anidados. Ese contenedor creaba una segunda área con su propio
  límite inferior, visible como corte por encima de la BottomNav.
- Cura: `.desktopMain` deja de scrollear (cada pestaña ya gestiona su scroll
  interno). Lección para el próximo bug de layout: **revisar los ancestros
  antes que el componente.**
- Sello `NURA_BUILD` → `2026.07.04-bg`.

## 2026-07-04 — La geometría del borde inferior (causa raíz)

- **Causa**: `.page` tenía `position: fixed; inset: 0` **y**
  `padding-bottom: var(--nav-h)`. Con la altura ya fijada por `inset: 0`, ese
  padding encogía el área útil desde dentro: `.messages` (flex:1, el
  contenedor con `overflow-y: auto`) terminaba 65px+safe-area por encima de
  la nav, y el fondo con él. De ahí la banda de nadie, el corte visual y la
  sensación de dos capas mal encajadas — doble reserva de la misma barra.
- **Cura geométrica (2 líneas, cero fondos artificiales)**: fuera el
  `padding-bottom` de `.page` (el scroller llega al borde real y la nav se
  dibuja encima, fija) y la reserva se muda **dentro del scroll**:
  `.chatSpacer` pasa a `calc(--float-bottom-h + --nav-h)`, así el último
  contenido se ve entero por encima del input y de la navegación.
- Sello `NURA_BUILD` → `2026.07.04-bf`.

## 2026-07-04 — El fondo llega hasta abajo (la aurora vivía en el scroller)

- **Causa real** (más de fondo que la de -bd): las auroras se pintaban sobre
  `.messages`, el contenedor de scroll — cuya caja termina donde termina el
  contenido. El área bajo el input quedaba con el papel liso de `.page`: un
  trozo visiblemente sin degradado antes de la nav.
- **Cura**: el degradado se muda a `.page`, que cubre desde el borde superior
  hasta la línea de la nav — el fondo llega siempre al final. Nav, input y
  geometría intactos; cero JSX.
- Sello `NURA_BUILD` → `2026.07.04-be`.

## 2026-07-04 — La franja bajo la nav (composición, no geometría)

- **Causa**: la BottomNav es translúcida (86% + blur 32px), así que filtra lo
  que hay detrás. En Home, detrás vivía el radial cian del Alma Visible
  posicionado `at 50% 104%` — justo en la franja inferior. La nav lo mezclaba
  con su papel y el ojo leía dos fondos superpuestos. La geometría (`.page`,
  `--nav-h`, `.floatBottom` transparente) era correcta.
- **Cambio mínimo**: el radial se recoge a `at 50% 88%` con menor extensión e
  intensidad — su cola se apaga antes del borde. Nav intacta (fondo, blur,
  altura, safe-area, posición); auroras superiores intactas; cero JSX.
- Sello `NURA_BUILD` → `2026.07.04-bd`.

## 2026-07-04 — El fondo termina en la línea de la nav

- Regresión propia del sello -ay: se añadió `height: 100dvh` a un `.page`
  que ya estaba en `position: fixed; inset: 0`. Con el `padding-bottom` de
  la nav, el contenedor medía 100dvh **más** la barra y el fondo se pasaba
  por debajo de la línea. `inset: 0` ya fija la altura al viewport visual:
  la altura explícita sobraba.
- Sello `NURA_BUILD` → `2026.07.04-bc`.

## 2026-07-04 — Los filtros se explican solos (feedback del fundador)

- Tras mudarlos bajo la respuesta heredaban el look de sugerencia flotante y
  no se leían como filtros. Ahora: **rótulo "AJUSTAR ESTA BÚSQUEDA"**, chips
  con icono (📍 💰 ★ 💻), borde y texto en morado (acción de Nüra, no
  sugerencia pasiva), y ritmo propio (14px arriba, 7px entre chips).
- **Hueco muerto eliminado**: el spacer del chat seguía reservando la altura
  de unos chips que ya no viven en la barra del input (133px → 76px).
- Sello `NURA_BUILD` → `2026.07.04-bb`.

## 2026-07-04 — Los filtros, bajo la respuesta (feedback del fundador)

- Los chips de refinamiento (Más cerca · Mejor valorado · Más barato) vivían
  anclados a la barra del input, lejos de lo que refinan. Ahora cierran el
  bloque de respuesta y leen los chips **del propio mensaje** (no del último
  de la conversación): cada respuesta lleva los suyos y el input queda
  limpio.
- Sello `NURA_BUILD` → `2026.07.04-ba`.

## 2026-07-04 — EL CULPABLE: `justify-content: flex-end` (autopsia)

- Cinco intentos de arreglar por JS un problema que era **de CSS**: el
  contenedor de mensajes tenía `justify-content: flex-end` con el comentario
  *"content always anchored to bottom — no JS scroll needed"*. El contenido
  estaba anclado al fondo por layout: **cada mensaje nuevo empujaba lo
  anterior hacia arriba**, sacando la recomendación de la pantalla sin que
  nadie hiciera scroll. Ningún cambio de JavaScript podía curarlo.
- Cura: `flex-start` en conversación (crece hacia abajo, la respuesta se
  queda donde nace) manteniendo `flex-end` solo en el estado de bienvenida,
  donde el asentado inferior es deseable. Lección: **cuando el
  comportamiento no responde al JS, el culpable es el layout.**
- Sello `NURA_BUILD` → `2026.07.04-az`.

## 2026-07-04 — El teclado de iOS (última pieza del salto)

- Con cero scroll programado el salto persistía: el culpable restante es el
  **reajuste de viewport de Safari al cerrarse el teclado**. Cura: altura del
  contenedor a `100dvh` (viewport visual, no layout), `overscroll-behavior`
  contenido para que el scroll no encadene con el documento, y blur
  controlado al enviar.
- Sello `NURA_BUILD` → `2026.07.04-ay`.

## 2026-07-04 — Cero scroll automático (decisión final)

- Tercer intento fallido en dispositivo: se elimina **todo** scroll
  programado y se añade `overflow-anchor: none` para que el navegador
  tampoco reancle al crecer el contenido. La vista se queda donde el usuario
  la dejó al enviar; la respuesta entra debajo y él baja cuando quiere. Ley
  en design-system: la conversación no se mueve sola.
- Sello `NURA_BUILD` → `2026.07.04-ax`.

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
