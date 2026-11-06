-- Tranças da Jhenny — banco de dados (Supabase / Postgres)
-- Rode este arquivo no SQL Editor do Supabase (ou via `supabase db push`).

create extension if not exists btree_gist;

-- ─── Administradoras (quem pode ver o painel) ───────────────────────────────
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ─── Agendamentos ────────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  access_token     uuid not null default gen_random_uuid(),   -- permite à cliente consultar o próprio status
  client_name      text not null check (char_length(client_name) between 2 and 120),
  client_phone     text not null check (char_length(client_phone) between 10 and 20),
  client_email     text,
  notes            text check (notes is null or char_length(notes) <= 600),
  style_id         text not null,
  length_id        text not null,
  thickness_id     text not null,
  volume_id        text not null,
  own_material     boolean not null default true,
  addon_ids        text[] not null default '{}',
  price            integer not null check (price > 0),
  signal           integer not null check (signal > 0),
  duration_min     integer not null check (duration_min > 0),
  start_at         timestamptz not null,
  end_at           timestamptz not null,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','cancelled','expired','needs_review')),
  payment_id       text,
  pix_copy_paste   text,
  pix_qr_base64    text,
  pix_expires_at   timestamptz,
  created_at       timestamptz not null default now(),
  check (end_at > start_at),
  -- impede dois atendimentos ativos no mesmo horário (uma profissional)
  constraint no_overlap exclude using gist (tstzrange(start_at, end_at) with &&)
    where (status in ('pending','confirmed'))
);
create index if not exists appointments_start_idx on public.appointments (start_at);
create index if not exists appointments_payment_idx on public.appointments (payment_id);

-- ─── Bloqueios de agenda (folgas, imprevistos) ───────────────────────────────
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  start_at   timestamptz not null,
  end_at     timestamptz not null check (end_at > start_at),
  reason     text,
  created_at timestamptz not null default now()
);

-- ─── Segurança (RLS): o público NÃO lê nem grava direto nas tabelas ──────────
alter table public.admins       enable row level security;
alter table public.appointments enable row level security;
alter table public.blocks       enable row level security;

create policy "admin lê agendamentos"   on public.appointments for select to authenticated using (public.is_admin());
create policy "admin altera agendamentos" on public.appointments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin gerencia bloqueios" on public.blocks for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- admins: sem policy => ninguém lê pela API (só o service role / SQL Editor)

-- ─── Horários ocupados (público, sem dados pessoais) ─────────────────────────
create or replace function public.busy_slots(from_ts timestamptz, to_ts timestamptz)
returns table (start_at timestamptz, end_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.start_at, a.end_at from public.appointments a
   where (a.status in ('confirmed','needs_review')
          or (a.status = 'pending' and a.pix_expires_at > now()))
     and a.start_at < to_ts and a.end_at > from_ts
  union all
  select b.start_at, b.end_at from public.blocks b
   where b.start_at < to_ts and b.end_at > from_ts;
$$;
grant execute on function public.busy_slots(timestamptz, timestamptz) to anon, authenticated;

-- ─── Libera reservas Pix não pagas ───────────────────────────────────────────
create or replace function public.expire_stale() returns void
language sql security definer set search_path = public as $$
  update public.appointments set status = 'expired'
   where status = 'pending' and pix_expires_at < now();
$$;
revoke all on function public.expire_stale() from public, anon, authenticated;

-- Depois de criar sua conta de admin em Authentication > Users, cadastre o e-mail:
-- insert into public.admins (email) values ('seu-email@exemplo.com');
