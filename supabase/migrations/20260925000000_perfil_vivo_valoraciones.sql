-- ── Perfil vivo, pieza 1: valoraciones y atributos con prueba ─────────────
-- Diseño: docs/perfil-vivo.md (secciones 3 y 5). Solo añade; no toca nada.
--
-- · `valoraciones`: lo que dice el cliente al terminar. Una por conversación
--   (`aviso_id` único): solo valora quien de verdad escribió a ese
--   profesional, y una vez. La escribe SOLO la función `helpers-write`.
-- · `perfil_atributos`: cada dato de un profesional con su FUENTE y su
--   PRUEBA. Se recalcula solo (disparadores). Lectura pública: es la ficha.
-- · `avisos.enviado_en`: para medir cuánto tarda en contestar un profesional
--   desde que le llega el aviso (no desde que se encoló).

create table if not exists public.valoraciones (
  id                 bigserial primary key,
  helper_id          text not null,
  aviso_id           bigint unique references public.avisos(id) on delete set null,
  estrellas          smallint check (estrellas between 1 and 5),
  volveria           boolean,
  cualidades         text[] not null default '{}',
  comentario         text,
  comentario_publico boolean not null default false,
  fecha              timestamptz not null default now()
);
alter table public.valoraciones enable row level security;
-- Sin políticas: solo la función (service_role) lee y escribe.
create index if not exists valoraciones_helper on public.valoraciones (helper_id);

create table if not exists public.perfil_atributos (
  helper_id      text not null,
  clave          text not null,
  fuente         text not null check (fuente in ('medido','clientes','declarado','verificado')),
  valor          jsonb not null,
  prueba         text,
  actualizado_en timestamptz not null default now(),
  primary key (helper_id, clave, fuente)
);
alter table public.perfil_atributos enable row level security;
drop policy if exists perfil_atributos_lectura on public.perfil_atributos;
create policy perfil_atributos_lectura on public.perfil_atributos
  for select to anon, authenticated using (true);
grant select on public.perfil_atributos to anon, authenticated;
revoke insert, update, delete, truncate on public.perfil_atributos from anon, authenticated;
revoke all on public.valoraciones from anon, authenticated;

alter table public.avisos add column if not exists enviado_en timestamptz;

-- ── Lo que dicen los clientes, recalculado en cada valoración ──
create or replace function public.recalcular_clientes(p_helper text)
returns void language plpgsql security definer set search_path = public as $$
declare
  total int; si int; media numeric; n_estrellas int;
begin
  delete from perfil_atributos where helper_id = p_helper and fuente = 'clientes';

  select count(*) filter (where volveria is not null),
         count(*) filter (where volveria)
    into total, si from valoraciones where helper_id = p_helper;
  if total > 0 then
    insert into perfil_atributos (helper_id, clave, fuente, valor, prueba)
    values (p_helper, 'volveria', 'clientes',
            jsonb_build_object('si', si, 'total', total),
            si || ' de ' || total || case when total = 1 then ' cliente volvería' else ' clientes volverían' end || ' a llamarle');
  end if;

  select round(avg(estrellas)::numeric, 1), count(estrellas)
    into media, n_estrellas from valoraciones where helper_id = p_helper and estrellas is not null;
  if n_estrellas > 0 then
    insert into perfil_atributos (helper_id, clave, fuente, valor, prueba)
    values (p_helper, 'estrellas', 'clientes',
            jsonb_build_object('media', media, 'total', n_estrellas),
            media || ' de media en ' || n_estrellas || case when n_estrellas = 1 then ' valoración' else ' valoraciones' end);
  end if;

  insert into perfil_atributos (helper_id, clave, fuente, valor, prueba)
  select p_helper, 'cualidad:' || c, 'clientes',
         jsonb_build_object('n', count(*), 'total', (select count(*) from valoraciones where helper_id = p_helper)),
         case when count(*) = 1 then 'lo dice 1 cliente' else 'lo dicen ' || count(*) || ' clientes' end
    from valoraciones v, unnest(v.cualidades) c
   where v.helper_id = p_helper
   group by c;
end $$;

create or replace function public.tras_valoracion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recalcular_clientes(coalesce(new.helper_id, old.helper_id));
  return null;
end $$;

drop trigger if exists valoraciones_recalcular on public.valoraciones;
create trigger valoraciones_recalcular after insert or update or delete on public.valoraciones
  for each row execute function public.tras_valoracion();

-- ── Lo medido: cuánto tarda en contestar desde que le llega el aviso ──
-- Solo con 3 respuestas o más: con una sola no es una medida, es un dato.
create or replace function public.recalcular_medido(p_helper text)
returns void language plpgsql security definer set search_path = public as $$
declare
  n int; mediana_min numeric; recibidos int; respondidos int;
begin
  delete from perfil_atributos where helper_id = p_helper and fuente = 'medido';

  select count(*), percentile_cont(0.5) within group (order by extract(epoch from (respondido_en - enviado_en)) / 60)
    into n, mediana_min
    from avisos where helper_id = p_helper and respondido_en is not null and enviado_en is not null
     and respondido_en >= enviado_en;
  if n >= 3 then
    insert into perfil_atributos (helper_id, clave, fuente, valor, prueba)
    values (p_helper, 'tiempo_respuesta', 'medido',
            jsonb_build_object('mediana_minutos', round(mediana_min), 'n', n),
            'medido en ' || n || ' mensajes');
  end if;

  select count(*), count(*) filter (where respondido_en is not null)
    into recibidos, respondidos
    from avisos where helper_id = p_helper and enviado_en is not null
     and enviado_en < now() - interval '48 hours';
  if recibidos >= 3 then
    insert into perfil_atributos (helper_id, clave, fuente, valor, prueba)
    values (p_helper, 'tasa_respuesta', 'medido',
            jsonb_build_object('respondidos', respondidos, 'recibidos', recibidos),
            'contestó ' || respondidos || ' de ' || recibidos || ' mensajes');
  end if;
end $$;

create or replace function public.tras_aviso() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recalcular_medido(new.helper_id);
  return null;
end $$;

drop trigger if exists avisos_recalcular on public.avisos;
create trigger avisos_recalcular after update of respondido_en, enviado_en on public.avisos
  for each row execute function public.tras_aviso();

-- Nadie de fuera ejecuta estas funciones: las disparan los disparadores.
revoke execute on function public.recalcular_clientes(text), public.tras_valoracion(),
  public.recalcular_medido(text), public.tras_aviso() from public, anon, authenticated;
