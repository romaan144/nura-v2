# Nüra 2 · Manual de lanzamiento — RLS y `DEMO_MODE`

*Resultado de la auditoría del 2026-08-02. La auditoría está completa; la
**ejecución es tuya**: requiere tu red y tus credenciales de Supabase.*

---

## 0 · El esquema REAL (comprobado el 2026-08-08)

Antes de nada: la tabla `helpers` de producción **no era la que el código
suponía**. Comprobado con `information_schema`:

- **1008 profesionales**, no los 122 del dataset local.
- Las columnas van en **`camelCase`** (`dniVerified`, `responseTime`,
  `completionRate`, `qualificationLevel`), no en `snake_case`.
- **No existe `ai_data`.** Tampoco **`chat_log`**.

El código escribía `dni_verified`, `response_time`, `completion_rate` y
`ai_data`: PostgREST rechaza el insert entero al primer campo desconocido,
así que **el alta profesional no habría publicado nunca**, ni con el RLS
abierto. Corregido en `RegisterHelper.jsx` y en la Edge Function.

Dos consecuencias buenas: no hay filas de prueba que borrar (no existe
`ai_data->>'self_registered'`), y `chat_log` —lo que más preocupaba en
privacidad— **nunca ha existido**. El registro de conversaciones queda
apagado tras `VITE_CHAT_LOG`, que exige crear la columna a propósito.

**Lección**: nunca escribir SQL contra un esquema supuesto. Mirar primero:

```sql
select column_name, data_type from information_schema.columns
where table_name = 'helpers' order by ordinal_position;
```

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

**Curado en el cliente el 2026-08-02.** `supabase.js` descubre las columnas
reales pidiendo el OpenAPI (`GET /rest/v1/`: una petición, **cero filas**) y
pide todas menos `chat_log`. Si el descubrimiento falla, vuelve a `select=*`
—el comportamiento anterior— y avisa en consola: nunca rompe una lectura.

**No bloquea la primera búsqueda**: el descubrimiento se lanza al cargar y
quien pregunta recibe lo que haya. Esperarlo costaría hasta 2,5 s en la
búsqueda que define el producto. Precio aceptado: `chat_log` viaja **una vez
por sesión** en lugar de en todas las lecturas.

**La cura definitiva sigue siendo tuya**, y hace innecesario lo anterior:

```sql
revoke select (chat_log) on public.helpers from anon;
```

Con eso `chat_log` no sale de Supabase aunque alguien pida `select=*` a mano
con la clave pública — que es lo único que el cliente no puede impedir.

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

**La solución definitiva ya está construida** (2026-08-02):
`supabase/functions/helpers-write`, una Edge Function con `service_role`
que es dueña de las dos escrituras.

### Cómo activarla

El cliente trae un interruptor **apagado por defecto** (`VITE_EDGE_WRITES`).
Mientras esté apagado se sigue por el camino directo, es decir, el
comportamiento de hoy. Desplegar el frontend **no cambia nada** hasta que lo
enciendas. Orden:

```bash
# 1 · secretos de la funcion (SUPABASE_URL y SERVICE_ROLE_KEY los pone
#     Supabase solo; NURA_ORIGINS lo pones tu)
supabase secrets set NURA_ORIGINS="https://nura-v2-two.vercel.app"

# 2 · desplegar
supabase functions deploy helpers-write

# 3 · probar el alta SIN tocar el frontend
curl -X POST "https://<tu-proyecto>.functions.supabase.co/helpers-write" \
  -H "content-type: application/json" \
  -H "origin: https://nura-v2-two.vercel.app" \
  -d '{"op":"alta","payload":{"name":"Prueba Borrar","category":"tecnico"}}'
# → {"ok":true,...}  y despues BORRA esa fila
```

Y en Vercel:

```
VITE_EDGE_WRITES = true
VITE_EDGE_URL    = https://<tu-proyecto>.functions.supabase.co/helpers-write
```

### Lo que la función NO deja hacer al cliente

El alta llega de un formulario público, así que la función **no confía en su
forma**: solo pasan campos de una lista blanca y con el tipo esperado, y
`verified`, `dni_verified` y `available` los fija ella. Un `payload`
manipulado no puede declararse verificado. El `chat_log` tiene además un
tope duro de 200 KB por fila: antes crecía sin límite y pesaba en cada
lectura del catálogo.

### La tabla de eventos

Los seis eventos de uso (ver `docs/que-puede-medir-nura.md`) viajan por la
misma función. Crear la tabla antes de encender `VITE_EDGE_WRITES`:

```sql
create table if not exists public.eventos (
  id          bigserial primary key,
  tipo        text not null,
  dispositivo text,
  categoria   text,
  helper_id   text,
  resultados  int,
  valoracion  int,
  fecha       timestamptz default now()
);

-- Nadie la lee desde el navegador. Solo escribe la funcion, con service_role.
alter table public.eventos enable row level security;
-- Sin politicas para `anon`: lo que no se concede, queda denegado.

create index if not exists eventos_tipo_fecha on public.eventos (tipo, fecha desc);
```

Las tres consultas que responden a las preguntas que importan:

```sql
-- Embudo
select tipo, count(*) from eventos group by tipo order by count(*) desc;

-- A quien hay que reclutar
select categoria, count(*) from eventos
where tipo = 'sin_cobertura' group by categoria order by count(*) desc;

-- Conexiones completadas (el criterio de graduacion del MVP)
select count(*) from eventos where tipo = 'resultado_registrado';
```

### Lo único que queda con clave pública

`writeHelperAiData` en `claudeApi.js` sigue siendo un `PATCH` con la clave
`anon`, pero **no lo llama nadie** (código muerto censado el 2026-08-01). Al
cerrar el RLS dejaría de funcionar igualmente. Retirarlo es una tarea
aparte.

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
