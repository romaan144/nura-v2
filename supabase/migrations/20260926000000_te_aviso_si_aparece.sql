-- ── «Te aviso si aparece alguien» (docs/perfil-vivo.md §10) ─────────────
-- Decision del fundador: Nüra solo recuerda algo de quien busca si esa
-- persona dice que si, guarda lo MINIMO, caduca y se puede borrar.
--
-- Lo que se guarda de cada alerta:
--   · el oficio (`categorias`, las de la base de datos, y `que`, el nombre
--     humano). NUNCA la frase que escribio.
--   · por donde avisar: la suscripcion de notificaciones de SU movil y/o el
--     correo de SU cuenta (confirmado). Ninguno de los dos es obligatorio
--     para guardarla, pero sin ninguno solo se ve al abrir la app.
--   · `llave_hash`: el resumen de la llave que tiene el movil. Con ella se
--     consulta y se borra. `baja`: la llave del enlace «dejar de avisarme»
--     del correo; solo sirve para borrar ESA alerta.
-- Caduca a los 90 dias. Solo la funcion `helpers-write` lee y escribe.

create table if not exists public.alertas (
  id           bigserial primary key,
  categorias   text[] not null,
  que          text not null,
  correo       text,
  push         jsonb,
  llave_hash   text not null unique,
  baja         text not null unique,
  creada_en    timestamptz not null default now(),
  caduca_en    timestamptz not null default now() + interval '90 days',
  encontrados  jsonb not null default '[]'::jsonb,
  avisada_en   timestamptz
);
alter table public.alertas enable row level security;
revoke all on public.alertas from anon, authenticated;
create index if not exists alertas_categorias on public.alertas using gin (categorias);
create index if not exists alertas_caduca on public.alertas (caduca_en);

-- Ajustes del servidor que no son secretos de usuario: aqui la funcion
-- guarda las llaves con las que firma las notificaciones (VAPID). Las crea
-- ella misma la primera vez: la privada nunca sale de Supabase.
create table if not exists public.ajustes (
  clave  text primary key,
  valor  jsonb not null,
  creado timestamptz not null default now()
);
alter table public.ajustes enable row level security;
revoke all on public.ajustes from anon, authenticated;
