# NÜRA 2 — ARQUITECTURA

> Cómo funciona el sistema por dentro: flujos, contratos, estado y datos.
> Los valores concretos (tiempos, umbrales) viven en el código —
> **fuente de verdad: `src/config.js` y los módulos citados** — aquí se documentan
> nombres y comportamiento, no literales. Última actualización: 2026-07-04

---

## 1. Stack y despliegue

- **React + Vite**, CSS Modules, React Router, Lucide icons, avatares DiceBear.
- **Deploy:** Vercel con CI automático desde la rama `main` del repo
  `github.com/romaan144/nura-v2`.
- **Supabase:** proyecto `oxmohciswebonoumghhu.supabase.co`. La clave anon está
  hardcodeada en `src/utils/supabase.js` (sin variables de entorno)
  [PENDIENTE: migrar a env — ver `engineering.md` §Secretos].
- **Directorio de trabajo:** el clon local del repo en la sesión de desarrollo.

## 2. Doctrina Supabase-opcional

**Ninguna pantalla ni flujo puede depender de que Supabase responda.**
- Toda lectura remota lleva timeout por `AbortSignal` (en `supabase.js`) y las
  llamadas críticas además compiten en `Promise.race` con un temporizador
  (matching).
- El **pool local** de profesionales demo sostiene búsqueda, Explorar y Muro por
  sí solo; los remotos **suman** cuando llegan.
- Toda lista procedente de Supabase se trata como potencialmente sucia:
  null-guards antes de `find/findIndex/map` (ver `engineering.md` §Lecciones).

## 3. Datos demo

- `src/data/helpers.js` — catálogo local; los perfiles demo usan `id >= 2000`
  (uno por subcategoría).
- `src/data/demoEnrichments.js` — enriquecimiento por id (educación,
  experiencia, posts, reseñas, cita, personalidad). **Regla de merge:** el `id`
  se fuerza explícito — `{ ...enriched, ...base, id }` — y se filtran nulos.
- El matching da **boost** a los perfiles demo para que la demo siempre muestre
  perfiles ricos primero.
- `src/data/connectionStories.js` — historias semilla del Muro, construidas
  **desde la especialidad real** de cada helper para que texto y tarjeta nunca
  se contradigan.

## 4. Flujo completo de una búsqueda (Home)

Orden real de ejecución en `handleSend` de `src/pages/Home.jsx`:

1. **Publicar mensaje del usuario** y activar `loading`
   (el input **nunca** se deshabilita — decisión registrada en `changelog.md`).
2. **Corrección pendiente** (Comprensión Visible): si `correctionRef` tiene la
   consulta original, se combina con el texto nuevo y se limpia.
3. **Interceptores por chips exactos** — solo responden a sus strings literales;
   cualquier otro texto sigue al flujo normal:
   - La Pregunta (`Para mí` / `Para alguien de mi familia` / `Para mi hogar o negocio`)
   - El Pulso (sus chips)
   - La Confirmación Humana (`Sí, genial` / `No del todo` — persiste vía
     `confirmContact`)
4. **Respuestas contextuales** (`detectIntent`, seguimiento sobre
   `lastMatches`) cuando aplican.
5. **Análisis:** `analyzeNeed(msg)` con **fallback garantizado** (si devuelve
   vacío, se construye un análisis mínimo con las palabras del usuario:
   la búsqueda nunca se queda sin análisis).
6. **Contexto blindado** (en `try` propio — si falla, la búsqueda sigue):
   `analysis.paraQuien` desde La Pregunta; `extractPersona` →
   `upsertPersona` → persona activa en `window.__nuraActivePersona`;
   globals `window.__nuraLastAnalysis` (+ persistencia ligera del análisis).
7. **Mensaje de comprensión:** línea empática + `comprehensionChips`
   (de `buildComprehension(analysis)`) + `originalQuery` para la corrección.
8. **Mensaje de carga** (`loading: true`) con pasos rotatorios vía interval
   expuesto en `window.__nuraStatusInterval` (para poder limpiarlo desde
   cualquier camino).
9. **Matching:** `matchHelpers(analysis, N)` — internamente, la llamada a
   Supabase compite con un timeout y está en try/catch; **red final:** si el
   resultado queda vacío, se sirven los mejores locales por rating.
   La búsqueda **no puede** colgarse ni devolver vacío.
10. **Cierre de carga:** limpiar interval + retirar el mensaje `loading`.
11. **Construcción del resultado:** `resultMsg` con línea de resultado
    (incluye tiempo real medido con `searchStartTime`), contexto de precio,
    línea de personalización si aplica, explicación de match
    (`buildMatchReason`, también volcado a `window.__nuraMatchReasons` por id)
    y `refineChips` contextuales por categoría (`CONTEXT_CHIPS`).
12. **Publicar resultado + liberar `loading`.**
13. **Render — La Revelación Progresiva:** `ResultsBlock` muestra la
    recomendación (✦ convicción + razones + persona si existe) con la tarjeta
    destacada, y revela las alternativas una a una con estado interno
    temporizado. La orquestación vive en el componente: el flujo de mensajes no
    se toca.
14. **Errores:** todo el flujo está en `try/catch (err)`; el catch limpia
    interval y mensaje de carga, libera `loading` y publica el error con su
    detalle técnico (línea ⚙️) para diagnóstico en dispositivo.

## 5. Contrato de mensajes del chat de Home

Un mensaje es un objeto en `nuraChatMessages` (contexto, **no persistido**:
Nüra arranca fresca; la memoria vive en el estado del usuario, §7).

| Campo | Tipo | Significado |
|---|---|---|
| `id` | number/string | único |
| `from` | `'user' \| 'nura'` | emisor |
| `text` | string | cuerpo (mensajes de usuario) |
| `lines` | string[] | párrafos de Nüra (admite `**negrita**`) |
| `chips` | string[] | respuestas rápidas tocables |
| `results` | helper[] | tarjetas de profesionales (activa `ResultsBlock`) |
| `refineChips` | string[] | refinamiento tras resultados |
| `loading` | boolean | mensaje de estado de carga (se retira al terminar) |
| `comprehensionChips` | string[] | chips de "Lo he entendido así" |
| `originalQuery` | string | consulta original para la corrección |
| `isPregunta` | boolean | mensaje de La Pregunta |
| `isConfirmacion` + `confirmacionHelperId/Name` | — | Confirmación Humana |
| `isPulso` | boolean | mensaje de El Pulso |

**Regla:** los flags conversacionales solo actúan vía sus chips exactos (§4.3).
Chat de conversación 1:1 (`src/pages/Chat.jsx`) usa su propio contrato
(`from: 'user' | 'helper' | 'nura'`, `text`, `time`) e integra
`introLetterText` como primer mensaje real con respuesta contextual
(`getHelperReply` con flag `isIntroLetter`).

## 6. Rutas principales

`/` Home (chat) · `/explore` (Escaparate + categorías por necesidad + lista) ·
`/helper/:id` perfil · `/intro/:id` Carta de Presentación (se entra desde el CTA
del perfil **solo si hay contexto de búsqueda**; sin contexto → chat directo) ·
`/chat/:id` conversación · `/chats` lista con memoria · `/feed` Muro/Siguiendo ·
`/profile` perfil de usuario (incluye El Espejo y el sello de versión) ·
`/results` → **redirect** a `/explore` (arquitectura antigua eliminada).

## 7. Estado del usuario — `src/context/UserContext.jsx`

**Expuesto:** `user/login/logout` · `chats/addChat/markRead/totalUnreadChats` ·
`ratings/addRating/hasRated` · `searchHistory/addSearch` ·
`contactedHelpers/confirmContact` ·
`personas/upsertPersona/linkPersonaContact/removePersona` ·
`helpersCache/cacheHelpers` · `following/follow/unfollow/isFollowing` ·
`notifications` · `favorites/toggleFollow` ·
`nuraChatMessages/setNuraChatMessages` · `nuraLastMatches/setNuraLastMatches` ·
`services/addService/updateService` · `updateUser` ·
`chatHistories/saveChatHistory/getChatHistory`.

**Reglas internas:** las funciones calculan con el valor en closure y llaman a
`setState(updated)` — no se depende de updaters síncronos para devolver valores.
`addChat` registra el contacto con timestamp y **vincula la persona activa**
(`window.__nuraActivePersona`) al helper, limpiándola después para evitar
vínculos erróneos.

**Persistencia (localStorage):** `nura_contacted` (contactos + `confirmed`/
`confirmedAt`) · `nura_personas` (El Espejo) · `nura_citas` (La Cita — acuerdos de visita) · `nura_chats` ·
`nura_search_history` · `nura_mc_last_shown` (Momento Cero) ·
`nura_last_pulso` · `nura_onboarded` · `nura_last_analysis` ·
[PENDIENTE: clave exacta de ratings].
**sessionStorage:** `nura_for_whom` (La Pregunta) · `nura_intent_query` ·
`nura_pending_chat` · `nura_just_onboarded` · `nura_helper_registered`.
**window (efímero):** `__nuraLastQuery` · `__nuraLastAnalysis` ·
`__nuraMatchReasons` · `__nuraActivePersona` · `__nuraStatusInterval`.

## 8. El Espejo — modelo de personas

`src/utils/personas.js`: extracción por relación ("mi madre", "mi hijo"…;
18 relaciones) + atributos relevantes (Alzheimer, vive sola, edad, habla…).
Entidad: `{ id, relacion, label ('tu madre'), suyo ('su madre'), atributos[],
firstMentioned, lastMentioned, lastQuery, contactedHelperIds[] }`.
Consumidores: saludo (`getWelcome`, con prioridades: conexión confirmada con
persona → confirmada → pendiente → persona sin conexión → búsqueda reciente →
genérico), Confirmación Humana, Carta (`suyoDe`), Chats, Perfil (visible y
borrable — principio de transparencia, ver `manifesto.md`).

## 9. Configuración central y sello de versión

`src/config.js` es el **único interruptor** demo/producción (`DEMO_MODE`
gobierna los umbrales de Confirmación, Pulso y Momento Cero) y define
`NURA_BUILD`, el sello de versión visible al final del Perfil y en consola —
el mecanismo oficial para verificar qué build corre un dispositivo (caché).

## 10. Arranque de la app

`Splash` → `MomentoCero` (según cooldown en localStorage/config) → app con
`PageTransition` global, `BottomNav` (oculta en `/login`, `/onboarding`,
`/chat/`) y `ErrorBoundary` amable (detalle técnico plegado).
