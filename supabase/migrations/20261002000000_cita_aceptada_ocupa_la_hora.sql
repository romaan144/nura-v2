-- La propuesta de cita viaja con su día y su hora, y el profesional la
-- acepta o la rechaza con un botón. Una cita aceptada ocupa esa hora en su
-- agenda para TODOS (antes solo lo sabía el móvil de quien la pidió).

alter table public.avisos
  add column if not exists cita_fecha date,
  add column if not exists cita_hora text,
  add column if not exists cita_estado text;

alter table public.avisos drop constraint if exists avisos_cita_forma;
alter table public.avisos add constraint avisos_cita_forma check (
  (cita_fecha is null and cita_hora is null and cita_estado is null)
  or (cita_fecha is not null and cita_hora ~ '^([01]?[0-9]|2[0-3]):00$'
      and cita_estado in ('propuesta', 'aceptada', 'rechazada'))
);

-- Dos citas aceptadas a la misma hora con el mismo profesional: imposible.
create unique index if not exists avisos_una_cita_por_hora
  on public.avisos (helper_id, cita_fecha, cita_hora)
  where cita_estado = 'aceptada';

-- Para leer rápido las horas ocupadas de un profesional.
create index if not exists avisos_citas_aceptadas
  on public.avisos (helper_id, cita_fecha)
  where cita_estado = 'aceptada';
