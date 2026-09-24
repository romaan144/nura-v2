-- APLICADA en produccion el 2026-09-24 (con el conector de Supabase).
--
-- `rls_auto_enable()` es la funcion de Supabase que enciende el RLS en cada
-- tabla nueva (disparador `ensure_rls`). Es SECURITY DEFINER y el asesor de
-- seguridad avisaba de que anon y authenticated podian ejecutarla. En la
-- practica no se puede llamar por la API (devuelve event_trigger), pero
-- nadie de fuera necesita ese permiso: se retira.
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
