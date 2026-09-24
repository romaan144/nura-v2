-- ── Tope diario de la IA (perfil-ia) ────────────────────────────────────
-- La funcion `perfil-ia` es publica y cada llamada cuesta dinero. Antes de
-- llamar a Claude suma 1 al contador del dia y, si pasa del tope
-- (NURA_IA_MAX_DIA), no llama. Atomico: dos llamadas a la vez no se pisan.
-- Solo la ejecuta service_role.
create or replace function public.sumar_uso(p_clave text)
returns integer language sql security definer set search_path = public as $$
  insert into ajustes (clave, valor) values (p_clave, '1'::jsonb)
  on conflict (clave) do update set valor = to_jsonb((ajustes.valor)::text::int + 1)
  returning (valor)::text::int
$$;
revoke execute on function public.sumar_uso(text) from public, anon, authenticated;
grant execute on function public.sumar_uso(text) to service_role;
