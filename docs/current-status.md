# Nüra 2 · Estado actual

> Documento **operativo**. Se lee en pocos minutos y es la única fuente de
> verdad sobre dónde está el proyecto. El histórico largo vive en
> `docs/improvement-roadmap.md` y no debe usarse para saber el estado.

**Última actualización:** 2026-08-02 (`select` acotado)
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

1. **Embudo profesional** — ¿el alta pasa por registro básico, o pide el
   teléfono dentro del chat?
2. **Boost de +80** — dejarlo, bajarlo o quitarlo.
3. **`Favorites.jsx`** — huérfana y ya divergida de `Siguiendo`: retirar o
   dar puerta.
4. **RLS + `DEMO_MODE`** — el único bloqueo de lanzamiento real.
5. **Onboarding** — enchufar `/onboarding` o retirarlo.

---

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
| Limpieza de tokens muertos | `5a2d0f5` | no |
| 5 guardias nuevos en smoke/preflight | varios | no |
| `docs/estrategia-fundacion.md` | `0123354` | no — **ajeno a Nüra 2** |

---

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
- 5 pantallas construidas y no alcanzables: `Favorites`, `HowItWorks`,
  `MomentoCero`, `Splash`, `Onboarding`.
- `nura_demanda_no_cubierta` sigue solo en local; requiere backend.
- Chats y Comunidad necesitarán estado de carga cuando haya backend.

---

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

**No hay tarea siguiente propuesta.** La superficie de datos queda cerrada
por el lado del cliente; lo que resta son tus cinco decisiones y la
ejecución en Supabase.
