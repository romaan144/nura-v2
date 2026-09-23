# Cuentas de profesionales · lo que hay que hacer en Supabase

> Etapa 6b de `docs/estudio-perfil.md`. Sin estos pasos, la app funciona
> igual que antes: las cuentas se crean, pero la ficha no se vincula y lo
> que se edita se queda en el móvil.

---

## 1 · El SQL

**Supabase → SQL Editor → New query**, pega todo y pulsa **Run**. Se puede
ejecutar más de una vez sin romper nada.

```sql
-- ── 1. A quién pertenece cada ficha ─────────────────────────────────────
alter table public.helpers
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- Una cuenta, una ficha.
create unique index if not exists helpers_owner_unico
  on public.helpers (owner_id) where owner_id is not null;

-- ── 2. El contacto deja de poder leerse desde fuera ─────────────────────
-- Hasta ahora la app no PEDIA el contacto, pero la base de datos dejaba
-- leerlo a cualquiera con la clave publica (que viaja dentro de la app).
-- Se quita el permiso de lectura de la tabla entera y se devuelve columna
-- a columna, todas menos las privadas. Se calcula solo: no hace falta
-- saber la lista de columnas.
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ') into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'helpers'
    and column_name not in ('contacto', 'chat_log', 'owner_id');
  execute 'revoke select on public.helpers from anon, authenticated';
  execute format('grant select (%s) on public.helpers to anon, authenticated', cols);
end $$;

-- ── 3. Lo único que una profesional puede cambiar de su ficha ───────────
-- NUNCA verificada, nota, valoraciones ni servicios: si no, cualquiera
-- podria ponerse un 5 con 999 opiniones.
revoke update on public.helpers from anon, authenticated;
grant update (specialty, bio, zone, price, online, contacto)
  on public.helpers to authenticated;

-- ── 4. Y solo la SUYA ────────────────────────────────────────────────────
drop policy if exists helpers_owner_update on public.helpers;
create policy helpers_owner_update on public.helpers
  for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Con sesion abierta, la app lee como 'authenticated' y no como 'anon':
-- necesita el mismo permiso de lectura publica.
drop policy if exists helpers_auth_read on public.helpers;
create policy helpers_auth_read on public.helpers
  for select to authenticated using (true);
```

### 1b · La foto de perfil *(etapa 7)*

```sql
-- La columna que ya lee la app (normalize() en utils/supabase.js).
alter table public.helpers add column if not exists "avatarUrl" text;
grant update ("avatarUrl") on public.helpers to authenticated;
grant select ("avatarUrl") on public.helpers to anon, authenticated;

-- Carpeta de fotos: publica para mirar, 1 MB como maximo y solo JPEG
-- (la app las reduce a unos 50 kB antes de subir).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 1048576, array['image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 1048576,
  allowed_mime_types = array['image/jpeg'];

-- Cada profesional solo puede escribir en SU carpeta: fotos/<su cuenta>/
drop policy if exists fotos_subir_propia on storage.objects;
create policy fotos_subir_propia on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_cambiar_propia on storage.objects;
create policy fotos_cambiar_propia on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists fotos_borrar_propia on storage.objects;
create policy fotos_borrar_propia on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
```

### Comprobar que ha ido bien

```sql
-- Debe dar 'owner_id'
select column_name from information_schema.columns
where table_name = 'helpers' and column_name = 'owner_id';

-- Debe listar helpers_owner_update y helpers_auth_read
select policyname from pg_policies where tablename = 'helpers';
```

---

## 2 · Volver a desplegar la función

La función `helpers-write` tiene **dos** operaciones nuevas: **`reclamar-ficha`** (une la cuenta a su ficha) y **`borrar-cuenta`** (borra avisos, ficha y cuenta).

**Supabase → Edge Functions → helpers-write → Code**: sustituye todo el
código por el de `supabase/functions/helpers-write/index.ts` del
repositorio y pulsa **Deploy**.

---

## 3 · Cómo se vincula una ficha

1. La profesional crea su acceso con **el mismo correo** que puso como
   contacto al darse de alta.
2. **Confirma el correo** pulsando el enlace que le llega.
3. Al abrir su perfil, la app pide al servidor que busque su ficha. El
   servidor comprueba que la sesión es válida, que el correo está
   **confirmado** y que coincide **exactamente** con el contacto del alta.
   Solo entonces la une a su cuenta.

**Por qué la confirmación importa**: sin ella, cualquiera podría crear una
cuenta con el correo de otra persona y quedarse con su ficha.

Si al darse de alta puso **su móvil** en vez de un correo, no hay forma
segura de vincularla automáticamente: la app se lo dice, y hay que
resolverlo a mano.
