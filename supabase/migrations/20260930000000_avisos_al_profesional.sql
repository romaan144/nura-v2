-- ── «Avísame cuando me escriban» (lado del profesional) ────────────────
-- La profesional con cuenta puede recibir una notificación en su móvil
-- cuando alguien le escribe. Se guarda la suscripción de SU móvil, una por
-- ficha, hasta que la quite (o el móvil deje de aceptarla). La notificación
-- va vacía, como todas. Solo la función (service_role) lee y escribe.
create table if not exists public.avisos_pro (
  helper_id text primary key,
  push      jsonb not null,
  creado    timestamptz not null default now()
);
alter table public.avisos_pro enable row level security;
revoke all on public.avisos_pro from anon, authenticated;
