-- Cambiar la hora de una cita: la antigua se cancela «por cambio» (no es
-- una cancelación a secas) y la propuesta nueva guarda de qué hora viene.
-- Así el profesional ve un solo aviso («te han cambiado una cita del … al
-- …») en vez de una cancelación y una propuesta sueltas.

alter table public.avisos drop constraint if exists avisos_cita_cancela_forma;
alter table public.avisos add constraint avisos_cita_cancela_forma check (
  (cita_cancela is null or cita_cancela in ('cliente', 'profesional', 'cambio'))
  and (cita_nota is null or char_length(cita_nota) <= 300)
);

-- «AAAA-MM-DD HH:00» de la cita que esta propuesta sustituye.
alter table public.avisos add column if not exists cita_cambia_de text;
alter table public.avisos drop constraint if exists avisos_cita_cambia_de_forma;
alter table public.avisos add constraint avisos_cita_cambia_de_forma check (
  cita_cambia_de is null or cita_cambia_de ~ '^\d{4}-\d{2}-\d{2} ([01]?[0-9]|2[0-3]):00$'
);
