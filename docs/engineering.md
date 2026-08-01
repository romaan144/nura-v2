# NÜRA 2 — REGLAS DE INGENIERÍA

> Cómo se cambia el código sin romper nada, y qué errores no se repiten jamás.
> Cada lección viene de un bug real ocurrido y corregido en este proyecto.
> Colaboración con la IA (comandos, aprobaciones): `ai-collaboration.md`.
> Última actualización: 2026-07-04

---

## 1. Regla suprema

**Nüra 1 está congelada; todo el desarrollo ocurre en Nüra 2.**
Repos, deploys y tabla canónica: `context.md` §2.

## 2. Flujo obligatorio por cada cambio

1. **Leer el código real antes de editar.** Localizar anclas exactas
   (grep/sed); nunca editar de memoria.
2. Ediciones por script con **asserts** sobre cadenas exactas. Si un assert
   falla: mirar el archivo — no forzar el parche.
3. **Build con puerta real antes de cualquier push:**
   ```
   npm run build > /tmp/b.log 2>&1 && grep -q "✓ built" /tmp/b.log && …push
   ```
   El push exige TRES puertas con exit real: build, **lint (`no-undef` = 0)**
   y la suite dorada. Nunca `build | grep` encadenado a push: el filtro devuelve éxito aunque el
   build falle (así se coló un build roto a `main` — una vez, y última).
3-bis. **Tests de comprensión** — si el cambio toca `matching.js` o el
   análisis, `npm run test:matching` debe estar en verde antes del push
   (suite dorada de consultas reales en `scripts/test-matching.mjs`).
   El exit code de la suite debe gatear el push — nunca encadenar su salida
   a pipes que traguen el código de salida.
4. **Análisis estático de hooks** tras early-return. Falsos positivos
   conocidos: componentes con callbacks `.map` definidos a nivel de módulo —
   verificar el patrón antes de "corregir" nada.
5. Commit descriptivo (**qué + por qué**). Push con el token en la URL del
   remote y **restaurar la URL limpia** después.
6. Verificar en deploy cuando aplique. Ante dudas de caché en dispositivo:
   subir `NURA_BUILD` en `src/config.js` y comprobar el sello en el Perfil.

## 3. Lecciones grabadas a fuego

1. **Null-guards siempre en datos remotos.** Las listas de Supabase pueden
   traer nulos: filtrar (`x != null && x.id != null`) antes de
   `find/findIndex/map`. (Crash real, dos veces.)
2. **Jamás `catch {}` si el cuerpo usa `err`.** Un catch que crashea silencia
   el error real: ni mensaje, ni log, app congelada. Siempre `catch (err)` con
   cuerpo a prueba de fallos. (El bug que ocultó todo lo demás durante días.)
3. **Toda espera remota lleva timeout.** Un fetch colgado no lanza error:
   congela para siempre. Patrón doble: `signal: AbortSignal.timeout(…)` en cada
   fetch de `supabase.js` + `Promise.race` con temporizador en la lógica
   crítica (matching). Doctrina completa: `architecture.md` §2.
4. **`loading` se libera en TODOS los caminos** (éxito, error, intercepciones)
   y **ningún input se deshabilita con el loading**: un fallo aguas arriba no
   puede dejar el teclado muerto.
5. **Interceptores conversacionales solo con strings exactos.** Nunca "si
   existe el mensaje X en el historial, interceptar" — eso secuestró todas las
   búsquedas de una sesión. (Contrato de mensajes: `architecture.md` §5.)
6. **Comprobar imports existentes antes de añadir uno.** Un import duplicado
   rompió el build.
7. **No depender de que los updaters de React se ejecuten síncronamente** para
   devolver valores: calcular con el valor en closure, `setState(updated)`,
   devolver.
8. **`id` explícito en merges de enriquecimiento:**
   `{ ...enriched, ...base, id }` + filtro final — el spread puede perder el id.
9. **Reproducir antes que teorizar.** El pipeline puro se ejecuta en node:
   copiar `src/utils` + `src/data` a un directorio temporal, reescribir los
   imports relativos añadiendo `.js`, y correr `analyzeNeed` + `matchHelpers`
   con la red caída. Siete parches "a ciegas" no valieron lo que una
   reproducción real.
10. **Los archivos generados en sesiones anteriores no persisten** (PDFs, SQL,
    exports): regenerarlos cuando hagan falta.
11. En pantallas tipo chat, el contenido de flujo va en el área scrollable —
    nunca en la barra flotante inferior (regla canónica y motivo:
    `design-system.md` §4).
12. Animaciones y iOS: regla canónica en `design-system.md` §4.
13. **La salida de las herramientas escapa backslashes** (render JSON): el
    código generado que contiene regex se verifica por EJECUCIÓN, nunca por
    lectura visual de la salida. Y al endurecer un matcher, endurecer también
    sus tributarios (la expansión de sinónimos): la subcadena tenía dos sedes.

## 4. Secretos y credenciales

- El **token de GitHub** lo proporciona el fundador en sesión. **Nunca** se
  escribe en documentación, ni en commits, ni en el código. Tras el push se
  restaura la URL limpia del remote.
- La **clave anon de Supabase** está hardcodeada en `src/utils/supabase.js`.
  [PENDIENTE — deuda aceptada temporalmente: migrar a variables de entorno
  antes de crecer el equipo o abrir el repo.]

## 5. Checklist de lanzamiento a producción

- [ ] `DEMO_MODE = false` en `src/config.js` (un solo cambio gobierna
      Confirmación, Pulso y Momento Cero).
- [ ] Subir `NURA_BUILD` y verificar el sello en dispositivo.
- [ ] Revisar `context.md` §Pendientes y `changelog.md` antes de publicar.

## 6. Estado, claves y estructura

El inventario de estado (localStorage / sessionStorage / window), el contrato
de mensajes y la estructura del repo viven en **`architecture.md`** — este
documento define comportamiento, no inventario.


### La Cuarta Puerta — verificación de superficie (2026-07-04)

`npm run smoke` monta **8 pantallas × 2 escenarios** (invitado y profesional
con obra, seguidos y conexión confirmada) con Vite SSR + `renderToString`,
sobre un `UserProvider` real con localStorage presembrado. Falla si alguna
lanza al renderizar.

**Por qué existe**: build, lint y suite no ven si una pantalla *renderiza*.
Prueba de fuego documentada: con `pulsoDelDia` saboteado, el build salió
**verde** y el smoke cazó `pulsoDelDiaX is not defined` en las dos variantes.

**Límite honesto**: SSR no ejecuta `useEffect` — caza render, no efectos. No
sustituye la verificación en dispositivo; elimina la clase de fallos que
jamás debería llegar a ella.

**Obligatoria antes de cada push**, junto a build, lint y suite.


### Lección: cuando el JS no lo arregla, es CSS (2026-07-04)

Cinco iteraciones intentando frenar por JavaScript un desplazamiento que
causaba `justify-content: flex-end` en el contenedor de chat. Antes de
iterar sobre efectos y timeouts, **leer el layout del contenedor**.


### La Quinta Puerta — preflight (2026-07-04)

`npm run preflight`. **No entra en las cuatro de cada push**: es la puerta
del DIA DEL LANZAMIENTO. Verifica lo que las otras no pueden ver:

1. **Que la app no salga en modo demostracion.** `DEMO_MODE` ya no es una
   constante manual: deriva del entorno (`VITE_DEMO`), con `DEFAULT_DEMO`
   como respaldo. Hoy sigue en `true` a proposito, para no romper la demo
   del fundador en su dispositivo.
2. **Restos de desarrollo** (`console.log`). Las excepciones deliberadas se
   marcan con `// preflight-ok` en la misma linea: una puerta que obliga a
   romper algo util es una puerta mal escrita.
3. **Imprime el aviso de RLS**, que ninguna comprobacion automatica puede
   hacer por ti.

**Sobre la clave anon**: moverla a `.env` NO la protege — una anon key de
Supabase viaja al navegador por diseño y Vite la incrusta en el paquete
igual. Vive en `.env` para poder **rotarla** sin tocar codigo. Lo que
protege es el RLS.


### Leccion: siete intentos por no preguntar si se podia hacer scroll

El fundador reportaba que Login "aparecia desplazado hacia abajo". Siete
ciclos corrigiendo CSS de layout — centrado vertical, min-height, vh/dvh,
reglas duplicadas, autoFocus — todos partiendo de la hipotesis equivocada.

La pregunta que lo resolvio en un mensaje: **"¿subiendo con el dedo aparece
bien?"**. Si la respuesta es si, **no es layout: es posicion de scroll**, y
ninguna correccion de CSS podia arreglarlo.

Causa real: las pestañas viven dentro de un contenedor `position: fixed`
(el documento no se desplaza) pero Login esta en `SELF_LAYOUT` de AppShell
y renderiza fuera de el (el documento SI se desplaza). Al navegar entre
ambos mundos, el navegador restauraba la posicion anterior.

**Regla**: ante "se ve desplazado", preguntar SIEMPRE si se puede recuperar
con scroll antes de tocar una sola linea de CSS.


### `includes` sobre lenguaje natural es una trampa (2026-08-01)

`t.includes('si')` se disparaba con *necesito*, *psicologa*,
*fisioterapeuta*, *sesion*. Medido: **el 21% de las consultas doradas**.

**Regla**: para detectar intencion en castellano, nunca subcadena. Palabra
completa con limite de letra Unicode:

```js
new RegExp(`(^|[^\\p{L}])${palabra}($|[^\\p{L}])`, 'iu')
```

`\\b` no basta: falla con acentos y con la ñ. Y añadir una condicion de
**longitud** cuando la intencion implica brevedad — un asentimiento no
ocupa doce palabras.

### Una puerta debe distinguir "bien" de "no lo se" (2026-08-01)

La sonda de RLS dio verde sin llegar a Supabase: el 403 venia del proxy de
egress de la maquina, no del servidor. Un tick verde que en realidad
significa "no he podido comprobarlo" es peor que no tener sonda.

**Regla**: toda comprobacion contra un servicio externo necesita **prueba
positiva de haber hablado con ese servicio** (forma del cuerpo, cabecera
caracteristica, ausencia de cabecera de denegacion del proxy). Sin esa
prueba, el resultado es TERCER ESTADO: *sin comprobar*, con el motivo — ni
pasa ni falla.

### Un array disperso es invisible hasta que usas find (2026-08-01)

Una coma suelta en `helpers.js` dejo un agujero en el indice 12.
`length` decia 123; elementos reales, 122.

**`filter`, `map` y `forEach` SALTAN los agujeros. `find` los PISA** y
entrega `undefined` al callback. `HELPERS.find(x => String(x.id) === id)`
reventaba para los 110 perfiles posteriores al hueco: la ficha entera
caida por enlace directo, con las cuatro puertas verdes.

**Regla**: cualquier dataset que se recorra con `find` necesita
(a) verificacion de densidad en la puerta y (b) `x && ...` en el callback.
Y al escribir un censo, no fiarse de `for...of` ni de `filter` para
recorrer: tambien saltan huecos. Contar con `for (let i...)` y `i in arr`.

### El censo de las piezas: la Cuarta Puerta monta pantallas vacias (2026-08-01)

Las 8 pantallas del smoke se montan **sin datos**: Home sin resultados
nunca le pasa un profesional a `HelperCardTall`. Por ese hueco entero se
colo un crash que tumbaba la pantalla, con las cuatro puertas verdes.

Se añade **el censo**: el dataset completo (123 perfiles × 2 tamaños) pasa
por la pieza. **Probado devolviendo el bug original a proposito**: el censo
lo caza y sale con codigo 1. Un guardia que nunca ha fallado no vale nada;
hay que verlo fallar una vez.

Y encontro mas que la medicion manual: yo habia contado 2 perfiles rotos
midiendo por el camino del usuario; el censo encontro **12, en 9
categorias**. Medir el camino encuentra lo que se ve; medir el dato
encuentra lo que hay.

**Regla**: cuando una pieza recibe datos de un dataset, la puerta debe
pasarle el dataset ENTERO, no un ejemplar de muestra.

### Un dato con dos formas tumba la pantalla (2026-08-01)

`experience` llegaba como **texto** en unos perfiles y como **array de
puestos** en otros. La tarjeta lo pintaba con `{helper.experience}` y React
caia entero (#31) en toda la categoria de logopedia.

**Regla**: antes de pintar un campo que viene de datos, comprobar que su
forma es UNA. Si el dataset tiene dos generaciones de un campo, derivar el
valor seguro una vez (`typeof x === 'string' ? … : ''`) y usar ese en la
condicion Y en el cuerpo — no solo en el cuerpo, o el contenedor renderiza
vacio.

**Y lo que enseña sobre las puertas**: las cuatro estaban verdes. El smoke
monta las pantallas con SSR pero **no ejecuta una busqueda**, asi que el
fallo vivia detras de una interaccion. Un render que solo ocurre tras
interactuar no lo ve ninguna puerta actual.

### El tamaño de un componente no depende de cuantos hermanos tenga (2026-08-01)

`repeat(${alts.length}, 1fr)` parecia razonable y estiraba la unica
alternativa a 358px — la misma tarjeta que en el caso lleno mide 114px.

**Regla**: una rejilla de tarjetas se declara con el numero de columnas del
**sistema**, no con el numero de elementos que hoy toque pintar. Si sobran
huecos, que sobren: hueco blanco se lee como "solo hay estos"; una tarjeta
estirada se lee como layout roto.

### Codigo muerto: mirar si falta la puerta, no solo si sobra (2026-08-01)

Dos features muertas juntas. Una sobraba (La Comprension Visible: chips de
confirmacion cuya correccion era de un solo sentido y que reescribian las
tarjetas en silencio). La otra **estaba entera menos la entrada**: el motor
de La Correccion se consumia bien en `handleSend`, pero nadie llamaba a
`startCorrection`.

**Regla**: ante codigo muerto, separar *lo que no sirve* de *lo que no
tiene puerta*. Lo segundo suele ser lo mas valioso del archivo — ya esta
diseñado, probado y escrito, y cuesta una linea encenderlo. Borrar los dos
juntos por estar igual de muertos habria tirado la mejor feature de Home.

### Lo que se produce y no se pinta no existe (2026-08-01)

Home producia `msg.chips` en **nueve** sitios y no los renderizaba en
ninguno; el unico lector estaba en otra pantalla. Nura hacia preguntas sin
forma de contestarlas, y features enteras (Los Dos Silencios, La Pregunta,
el reintento) estaban escritas y eran invisibles.

**Regla**: al dar por terminada una feature conversacional, verificar el
**productor Y el lector**. Un `grep` del campo en TODO `src/` cuesta diez
segundos. Y contar botones reales en el navegador, no clases en el CSS.

### Medir el DOM renderizado, no las variables (2026-07-05)

Tres ciclos calculando espaciados leyendo variables CSS dieron 8px donde el
dispositivo tenia **86**. El error: mirar la regla base de `.page` sin ver
que en `@media (max-width: 767px)` habia un `padding-bottom: var(--nav-h)`
— la barra se reservaba DOS veces.

**Se puede medir de verdad en este entorno**: Chromium llega por el registro
de npm (`npm i -D puppeteer-core @sparticuz/chromium`; el binario viene
comprimido en brotli en `bin/chromium.br`, se extrae con `brotli -d`). Se
sirve el build con `vite preview --host 127.0.0.1` y se leen los
`getBoundingClientRect()` reales. Las dependencias se retiran despues para
no cargar el despliegue.

**Regla**: ante cualquier queja de espaciado, medir el DOM renderizado antes
de tocar una linea. Un calculo teorico que ignora una media query es una
respuesta segura y equivocada.
