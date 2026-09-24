-- ── Avisos: llaves separadas y cierre de los avisos antiguos ─────────────
--
-- PREPARADA, NO EJECUTADA. Se ejecuta en Supabase → SQL Editor ANTES de
-- desplegar la nueva version de `helpers-write` (la funcion nueva escribe y
-- lee `lectura_hash`; sin la columna, encolar un aviso fallaria).
-- Se puede ejecutar mas de una vez sin romper nada.
--
-- QUE CAMBIA
-- Hasta ahora `respuestas` devolvia lo que un profesional hubiera contestado
-- a CUALQUIERA que preguntase por el, y `pendientes` (abierta a cualquiera
-- que falsease el origen) devolvia el enlace con la llave del profesional.
-- Ahora cada aviso tiene dos llaves sin relacion:
--   · token         la del profesional (responder). Pasa de 16 a 32 cifras.
--   · lectura_hash  el resumen SHA-256 de la llave de quien escribio (leer).

alter table public.avisos add column if not exists lectura_hash text;

create unique index if not exists avisos_lectura_hash
  on public.avisos (lectura_hash) where lectura_hash is not null;

-- ── Los avisos antiguos ─────────────────────────────────────────────────
-- Todo aviso creado antes de este cambio:
--   1. Pierde su enlace (`token = null`). Mientras `pendientes` estuvo
--      abierta, cualquiera pudo sacar esas llaves: se dan por expuestas y no
--      se reutilizan. (La funcion nueva, ademas, ya no acepta el formato
--      antiguo de 16 cifras.)
--   2. Si no se habia respondido, pasa a `caducado`: no vuelve a salir en
--      `pendientes`. Aunque se reenviara, quien escribio no tiene llave de
--      lectura y nunca veria la respuesta en la app.
--   3. Si se habia respondido, conserva la respuesta en la tabla, pero la
--      app ya no la muestra: no hay forma de saber a quien pertenecia.
-- No hay compatibilidad publica: ningun aviso antiguo se puede leer desde
-- la app. Los mensajes siguen en la tabla; que hacer con ellos (avisar a
-- mano, borrarlos) es decision del fundador.

update public.avisos
   set estado = 'caducado'
 where lectura_hash is null
   and respuesta is null
   and estado in ('pendiente', 'enviado');

update public.avisos
   set token = null
 where lectura_hash is null
   and token is not null;

-- ── Comprobar ───────────────────────────────────────────────────────────
-- Debe dar 0: ningun aviso antiguo conserva enlace.
--   select count(*) from public.avisos where lectura_hash is null and token is not null;
-- Cuantos quedaron caducados (sin leer su contenido):
--   select estado, count(*) from public.avisos group by estado;
