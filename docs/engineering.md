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
