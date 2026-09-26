-- El horario del profesional: qué días y a qué horas trabaja.
-- Hasta ahora Nüra lo suponía por el oficio (una logopeda, tardes de lunes
-- a viernes). Con esto, cada profesional marca el suyo desde su perfil.
--
-- Forma: { "dias": [1,2,3,4,5], "horas": ["16:00","17:00",...] }
--   dias: 0 = domingo … 6 = sábado.  Nulo = se usa el del oficio.

alter table public.helpers add column if not exists horario jsonb;

alter table public.helpers drop constraint if exists helpers_horario_forma;
alter table public.helpers add constraint helpers_horario_forma check (
  horario is null or (
    jsonb_typeof(horario) = 'object'
    and jsonb_typeof(horario -> 'dias') = 'array'
    and jsonb_typeof(horario -> 'horas') = 'array'
    and jsonb_array_length(horario -> 'dias') between 1 and 7
    and jsonb_array_length(horario -> 'horas') between 1 and 24
  )
);

-- Todos pueden verlo (va en la ficha pública).
grant select (horario) on public.helpers to anon, authenticated;

-- La profesional con cuenta puede cambiar su horario y su ciudad (la
-- política helpers_owner_update ya limita a SU fila). `city` faltaba: al
-- editar la ficha se envía la ciudad leída de la zona y, sin permiso,
-- fallaba el guardado entero.
grant update (horario, city) on public.helpers to authenticated;
