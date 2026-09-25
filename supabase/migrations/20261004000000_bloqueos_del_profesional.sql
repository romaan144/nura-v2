-- Días u horas sueltas en que el profesional NO puede (vacaciones, un
-- médico, un día libre). Salen ocupadas para todos y nadie puede pedirlas.
-- Solo se guarda cuándo, nunca por qué.
--
-- Forma: [ { "fecha": "2026-10-09" }, { "fecha": "2026-10-10", "horas": ["10:00","11:00"] } ]
--   sin "horas" = el día entero.

alter table public.helpers add column if not exists bloqueos jsonb;

alter table public.helpers drop constraint if exists helpers_bloqueos_forma;
alter table public.helpers add constraint helpers_bloqueos_forma check (
  bloqueos is null or (
    jsonb_typeof(bloqueos) = 'array'
    and jsonb_array_length(bloqueos) <= 200
  )
);

-- Todos pueden verlo (la agenda pública tacha esas horas).
grant select (bloqueos) on public.helpers to anon, authenticated;

-- La profesional con cuenta puede cambiar los suyos (la política
-- helpers_owner_update ya limita a SU fila).
grant update (bloqueos) on public.helpers to authenticated;
