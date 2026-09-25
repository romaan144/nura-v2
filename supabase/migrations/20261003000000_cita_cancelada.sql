-- Quien pidió la cita puede cancelarla. Una cita cancelada deja de ocupar
-- la hora (el índice único solo cuenta las aceptadas) y el profesional lo
-- ve en su enlace.

alter table public.avisos drop constraint if exists avisos_cita_forma;
alter table public.avisos add constraint avisos_cita_forma check (
  (cita_fecha is null and cita_hora is null and cita_estado is null)
  or (cita_fecha is not null and cita_hora ~ '^([01]?[0-9]|2[0-3]):00$'
      and cita_estado in ('propuesta', 'aceptada', 'rechazada', 'cancelada'))
);
