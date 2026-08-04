# Nüra 2 · Manual de lanzamiento — RLS y `DEMO_MODE`

*Resultado de la auditoría del 2026-08-02. La auditoría está completa; la
**ejecución es tuya**: requiere tu red y tus credenciales de Supabase.*

---

## 1 · Qué toca la base de datos, exactamente

Una sola tabla: **`helpers`**. Nada más.

| # | operación | dónde | cuándo ocurre | ¿gated por `DEMO_MODE`? |
|---|---|---|---|---|
| L1 | `GET /helpers?select=*&limit=100` | `supabase.js:183` | cada búsqueda | **no** |
| L2 | `GET /helpers?id=eq.X&select=*` | `supabase.js:205` | abrir ficha/chat en frío | **no** |
| L3 | `GET /helpers?select=*&limit=1000` | `supabase.js:214` | carga del catálogo | **no** |
| E1 | `POST /helpers` | `RegisterHelper.jsx:37` | alta profesional | **sí** (desde el sello `-y`) |
| E2 | `PATCH /helpers` (`chat_log`) | `claudeApi.js:74` | **cada mensaje** en un chat con profesional remoto | **no** |
| — | `PATCH` (`ai_data`) | `claudeApi.js:47` | *sin llamadas* — código muerto | — |
| — | `GET` (`getHelperForAnalysis`) | `claudeApi.js:96` | *sin llamadas* — código muerto | — |

### Dos consecuencias que conviene tener claras antes de tocar nada

**a) `DEMO_MODE` no aísla la base de datos.** Solo tapa el alta profesional.
Las tres lecturas y la escritura de `chat_log` van a producción **también en
modo demo**. Cada conversación de demostración con un profesional que venga
de Supabase queda escrita en la fila de ese profesional.

**b) Dos de las tres rutas de escritura son código muerto.** `writeHelperAiData`
y `getHelperForAnalysis` no las llama nadie. La superficie real de escritura
es: **el alta (E1) y el registro de conversación (E2)**.

---

## 2 · La exposición hoy

La clave `anon` viaja en el navegador **por diseño**; no es un secreto y
moverla a `.env` no protege nada. Lo único que protege es el RLS.

Si el rol `anon` tiene escritura sobre `helpers`, cualquiera con esa clave
puede:

- **reescribir o vaciar** el perfil de cualquier profesional;
- **dar de alta profesionales falsos**;
- **leerse `chat_log`** de todos: las conversaciones de tus usuarios, con
  frases del tipo *"mi madre vive sola"*.

Lo tercero pasa además **sin ser un atacante**: `select=*` se descarga
`chat_log` al navegador de cada visitante aunque la app no lo use nunca.

---

## 3 · SQL exacto

Ejecutar en el editor SQL de Supabase.

```sql
-- 1 · Encender RLS (sin políticas, todo queda denegado)
alter table public.helpers enable row level security;

-- 2 · Lectura pública: la app la necesita para buscar
drop policy if exists helpers_anon_read on public.helpers;
create policy helpers_anon_read
  on public.helpers
  for select
  to anon
  using (true);

-- 3 · NO se crea ninguna política de insert/update/delete para `anon`.
--     Lo que no se concede queda denegado.
```

### Comprobación posterior (mismo editor)

```sql
select policyname, cmd, roles
from pg_policies
where tablename = 'helpers';
-- Debe devolver EXACTAMENTE una fila: helpers_anon_read · SELECT · {anon}
```

### Y lo que hay que dejar de exponer en la lectura

`chat_log` no lo usa el cliente. Mientras la política de `select` sea
`using (true)` sobre todas las columnas, sigue viajando. Dos salidas, **a
decidir por ti** (fuera del alcance de esta tarea):

- **Vista**: crear `helpers_publicos` sin `chat_log` y apuntar el cliente ahí.
- **Grants por columna**: `revoke select (chat_log) on helpers from anon;`

---

## 4 · Lo que se rompe al cerrar el RLS, y ya está preparado

**Al aplicar el SQL, `POST /helpers` empezará a devolver 401/403.** Es lo
correcto: el alta profesional no debe escribir con la clave pública.

Eso significa que **el alta profesional dejará de publicar**. Está previsto:
desde el sello `2026.07.07-a` el alta espera el resultado, comprueba
`res.ok` y **dice la verdad** en vez de dar la enhorabuena:

> *"Tu perfil está guardado aquí, pero todavía no he podido publicarlo para
> que te encuentren."*

Verificado en navegador contra una red sin salida, que reproduce
exactamente un insert rechazado.

**La solución definitiva** es mover E1 y E2 a una Edge Function con la
`service_role key` (que nunca viaja al navegador). **Eso es una tarea
principal propia, no parte de esta.**

---

## 5 · Orden de ejecución recomendado

| # | paso | quién | verificación |
|---|---|---|---|
| 1 | `npm run preflight` **desde tu red** | tú | la sonda debe decir *"RLS: el rol anónimo NO puede escribir"* o *"RLS ABIERTO"*. Si dice **SIN COMPROBAR**, tu red tampoco llega |
| 2 | Limpiar filas de prueba | tú | `select id,name from helpers where ai_data->>'self_registered'='true'` → borrar las que no sean reales |
| 3 | Aplicar el SQL del §3 | tú | la consulta de `pg_policies` devuelve 1 fila |
| 4 | Repetir `npm run preflight` | tú | ahora debe decir que **no** puede escribir |
| 5 | Probar el alta profesional | tú | debe aparecer el mensaje honesto, **no** la enhorabuena |
| 6 | Apagar demo: `VITE_DEMO=false` en Vercel | tú | preflight sin bloqueos |
| 7 | Desplegar y comprobar el sello en consola | tú | `[Nüra] build 2026.07.07-f` o superior |

**El paso 2 va antes del 3 a propósito**: una vez cerrado el RLS ya no
podrás borrar esas filas con la clave pública.

---

## 6 · Qué cambia al poner `VITE_DEMO=false`

| | demo | producción |
|---|---|---|
| Chats sembrados | 5 conversaciones | ninguna — estado vacío real |
| Seguidos sembrados | 2 profesionales | ninguno |
| Servicios de escaparate (invitado) | sí | no |
| Alta profesional escribe en Supabase | **no** | **sí** |
| Confirmación de servicio | 30 s | 3 días |
| El Pulso | 35 s | 7 días |
| Momento Cero | cada 2 h | nunca |

**No cambia**: las tres lecturas y la escritura de `chat_log`, que van a
producción en ambos modos.

---

## 7 · Lo que esta auditoría NO puede verificar

Desde el entorno de trabajo **no hay salida de red a Supabase** (el proxy
devuelve `host_not_allowed`). Por eso la sonda distingue tres estados y no
dos: *puede escribir*, *no puede escribir*, y **sin comprobar**.

Nunca des por buena una sonda que no haya hablado con Supabase.
