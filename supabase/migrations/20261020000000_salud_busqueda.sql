-- ── Cómo va la búsqueda, día a día ───────────────────────────────────────
-- Desde el 2026-09-29 cada búsqueda deja exactamente un evento `busqueda`:
-- categoría `otro` si no se entendió, y `resultados` 0 si no había nadie.
-- Nunca la frase. Para el fundador (Table Editor o SQL), cerrada al público.
create or replace view public.salud_busqueda
with (security_invoker = true) as
with ev as (
  select tipo, categoria, resultados, (fecha at time zone 'Europe/Madrid')::date as dia
  from public.eventos
  where tipo in ('busqueda', 'sin_cobertura')
)
select
  dia,
  count(*) filter (where tipo = 'busqueda') as busquedas,
  count(*) filter (where tipo = 'busqueda' and categoria = 'otro') as no_entendidas,
  count(*) filter (where tipo = 'busqueda' and categoria <> 'otro' and coalesce(resultados, 0) = 0) as sin_nadie,
  count(*) filter (where tipo = 'sin_cobertura' and coalesce(resultados, 0) > 0) as solo_parecido,
  round(100.0 * count(*) filter (where tipo = 'busqueda' and categoria <> 'otro')
    / nullif(count(*) filter (where tipo = 'busqueda'), 0)) as pct_entendidas
from ev
group by dia
order by dia desc;

revoke all on public.salud_busqueda from anon, authenticated;
