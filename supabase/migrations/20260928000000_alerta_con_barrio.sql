-- ── «Te aviso si aparece», cerca de tu barrio ──────────────────────────
-- Si la persona buscaba en un barrio («cerca de Gràcia») y quiere, la
-- alerta guarda ESE barrio (nombre y el centro aproximado del barrio, nunca
-- una direccion). Solo avisa de quien trabaja a 5 km o menos, online o en
-- toda Barcelona. Sin barrio, como antes: avisa de todos.
alter table public.alertas add column if not exists zona jsonb;
