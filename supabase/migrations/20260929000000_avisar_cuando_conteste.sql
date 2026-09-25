-- ── «Avísame cuando conteste» ─────────────────────────────────────────
-- Quien escribe a un profesional puede pedir una notificación en su móvil
-- cuando le conteste. Se guarda la suscripción de SU móvil en ese aviso,
-- solo hasta la respuesta: al contestar se usa una vez y se borra. La
-- notificación va vacía; el móvil pregunta qué es con su llave de lectura.
alter table public.avisos add column if not exists push jsonb;
