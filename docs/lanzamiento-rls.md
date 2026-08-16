# Nüra 2 · Manual de lanzamiento — RLS y `DEMO_MODE`

*Resultado de la auditoría del 2026-08-02. La auditoría está completa; la
**ejecución es tuya**: requiere tu red y tus credenciales de Supabase.*

---

## ✅ EJECUTADO por el fundador — 2026-08-08

El bloqueo de lanzamiento **está cerrado**. Estado final de `helpers`:

```
policyname          cmd      roles
helpers_anon_read   SELECT   {anon}     ← única política
```

Cualquiera puede leer profesionales. **Nadie puede escribir con la clave
pública.** Verificado por el fundador: la búsqueda sigue funcionando.

**Lo que apareció al ejecutarlo, y que este documento no preveía:** la tabla
ya tenía dos políticas anteriores, y una era

```
Auth insert | INSERT | {public} | with_check: true
```

`with_check: true` es **sin condición ninguna**: encender el RLS no servía
de nada mientras esa política existiera. Habría dado un falso cierre — RLS
activo y la puerta abierta. Se encontró porque se listaron las políticas en
vez de fiarse del `Success` de Supabase.

Hecho también: columna `contacto`, tabla `eventos` con RLS y sin políticas,
y retirada la política `Public read`, redundante con la nueva.

**Pendiente**: desplegar la Edge Function. Hasta entonces el alta
profesional **no publica** — es lo esperado, y la app lo dice en vez de
fingir que funcionó.

## ✅ CADENA COMPLETA VERIFICADA EN PRODUCCIÓN (2026-08-16)

El alta profesional **publica de verdad**. Probado de extremo a extremo con
`VITE_DEMO=false`: siete preguntas → fila creada con `id 1105`, categoría
`logopedia` y el contacto guardado. Fila de prueba borrada después;
**1008 profesionales, 0 con contacto**, como estaba.

Estado final: RLS cerrado, función desplegada, secreto puesto, JWT apagado,
variables en Vercel, secuencia de `id` creada. **Y `VITE_DEMO` retirado a
propósito**: la demo sigue viva para enseñar Nüra.

### El interruptor que hay que recordar

`RegisterHelper.jsx` tiene esta línea:

```js
const publicado = DEMO_MODE ? true : !!(await saveHelperToSupabase(...))
```

**Con `DEMO_MODE` encendido, el alta NO escribe.** Es deliberado —evita que
cada demostración llene la base de perfiles falsos— pero significa que
**hoy, en producción, el alta profesional no publica**.

El día que llegue el primer profesional real hay que añadir en Vercel:

```
VITE_DEMO = false
```

…y redesplegar. Eso apaga también los chats sembrados, los seguidos falsos
y las respuestas guionizadas del chat. Es el paso de "producto que se
enseña" a "producto que se usa", y **es una decisión, no un trámite**.

## ⚠ La columna `id` no tenía autoincremento (2026-08-16)

**El alta profesional fallaba en producción aunque todo lo demás estuviera
bien.** Sintoma: se completaban las siete preguntas, la cuenta local se
creaba, y el profesional **no aparecia ni en búsquedas ni en la tabla**.

Diagnostico, midiendo en vez de suponer:

1. `select ... where contacto is not null` → **0 filas**. No llegaba nada.
2. Invocaciones de la funcion → **HTTP 200**, la app sí llamaba.
3. Probando la funcion a mano → `{"error":"insert rechazado","estado":400}`.
4. `information_schema` → **`id` con `is_nullable: NO` y `column_default:
   NULL`**.

La columna era obligatoria y **sin secuencia**: los 1008 perfiles se habian
cargado con ids explícitos. PostgREST rechazaba todo insert que no la
enviara, y la funcion no la envía a propósito —el id lo debe poner la base—.

**Cura aplicada en producción:**

```sql
create sequence if not exists helpers_id_seq owned by helpers.id;
select setval('helpers_id_seq', (select coalesce(max(id),0)+1 from helpers), false);
alter table helpers alter column id set default nextval('helpers_id_seq');
```

Verificado después: alta de prueba creada con `id: 1104` y `"ok": true`, y
borrada a continuación.

**Leccion**: el `200` de la invocación no significa que la operación
funcionara — la función responde 200 al recibir la petición y devuelve el
error dentro del cuerpo. Hay que leer el cuerpo, no el código HTTP.

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
