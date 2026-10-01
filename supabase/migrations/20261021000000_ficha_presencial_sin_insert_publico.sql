-- ── Editar mi ficha: «solo online» de verdad, y sin altas desde el navegador ──
-- (2026-10-01)
--
-- 1. Al elegir «Online», la ficha solo cambiaba `online`: `presential` seguía
--    en sí y la profesional salía en búsquedas presenciales. Se le deja
--    cambiar esa columna, como las demás de su ficha: la regla
--    `helpers_owner_update` sigue limitándolo a SU fila (owner_id = su cuenta).
grant update (presential) on public.helpers to authenticated;

-- 2. Los roles públicos conservaban permiso de INSERT en todas las columnas
--    (incluidas verified, rating, reviews y owner_id). Hoy no se podía usar
--    —no hay ninguna regla de inserción y la seguridad por filas está
--    activa—, pero sobraba: el alta va siempre por la función helpers-write,
--    con su clave de servidor, que no depende de estos permisos. Regla del
--    fundador: no mantener acceso público por compatibilidad.
revoke insert on public.helpers from anon, authenticated;
