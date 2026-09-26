-- El profesional también puede cancelar una cita que ya aceptó (por
-- ejemplo, al bloquear ese día). Quién la canceló y, si quiere, una nota
-- para la otra persona. La hora vuelve a quedar libre: el índice único solo
-- cuenta las aceptadas.

alter table public.avisos
  add column if not exists cita_cancela text,
  add column if not exists cita_nota text;

alter table public.avisos drop constraint if exists avisos_cita_cancela_forma;
alter table public.avisos add constraint avisos_cita_cancela_forma check (
  (cita_cancela is null or cita_cancela in ('cliente', 'profesional'))
  and (cita_nota is null or char_length(cita_nota) <= 300)
);
