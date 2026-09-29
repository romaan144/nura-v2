-- ── Qué oficios faltan y dónde ───────────────────────────────────────────
-- `sin_cobertura` solo decía la categoría («técnico»), y eso no dice a quién
-- fichar. Ahora también el OFICIO entendido (identificador del mapa de
-- oficios, como `electronica`) y la CIUDAD. Nunca la frase: las
-- restricciones impiden que aquí quepa un texto libre.

alter table public.eventos
  add column if not exists oficio text,
  add column if not exists ciudad text;

alter table public.eventos
  add constraint eventos_oficio_es_identificador check (oficio is null or oficio ~ '^[a-z0-9_]{1,40}$'),
  add constraint eventos_ciudad_corta check (ciudad is null or (char_length(ciudad) <= 40 and ciudad !~ '[0-9@/:]'));

-- Para el fundador (Supabase → Table Editor, o SQL): lo que se buscó y no
-- tenía a nadie, por oficio y ciudad. `solo_parecido`: había algo parecido,
-- pero no del oficio. Cerrada al público, como la tabla.
create or replace view public.demanda_sin_cubrir
with (security_invoker = true) as
select
  coalesce(oficio, 'categoría: ' || coalesce(categoria, '?')) as oficio,
  coalesce(ciudad, 'sin decir') as ciudad,
  count(*) as veces,
  count(*) filter (where coalesce(resultados, 0) > 0) as solo_parecido,
  count(distinct dispositivo) as personas,
  max(fecha) as ultima_vez
from public.eventos
where tipo = 'sin_cobertura'
group by 1, 2
order by veces desc, ultima_vez desc;

revoke all on public.demanda_sin_cubrir from anon, authenticated;
