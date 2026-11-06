-- 004 — Segurança, LGPD e acompanhamento da cliente. Alterações aditivas e reversíveis (nada é apagado).

-- ── Agendamentos: idempotência, aceite dos termos, pedidos de alteração, estado "reembolsado" ──
alter table public.appointments
  add column if not exists request_id         uuid,
  add column if not exists terms_accepted_at  timestamptz,
  add column if not exists terms_version      text check (terms_version is null or char_length(terms_version) <= 20),
  add column if not exists change_request     text check (change_request in ('cancel','reschedule')),
  add column if not exists change_request_note text check (change_request_note is null or char_length(change_request_note) <= 600),
  add column if not exists change_requested_at timestamptz;

-- o mesmo envio repetido (falha de rede, duplo clique) não cria um segundo agendamento
create unique index if not exists appointments_request_id_key on public.appointments (request_id) where request_id is not null;

alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('pending','confirmed','cancelled','expired','needs_review','refunded'));

-- telefone: só dígitos (evita lixo e links manipulados). NOT VALID = vale para novas linhas; valide depois de conferir dados antigos.
alter table public.appointments drop constraint if exists appointments_phone_digits;
alter table public.appointments add constraint appointments_phone_digits check (client_phone ~ '^[0-9]{10,13}$') not valid;

-- ── Limite de requisições (anti-abuso). Guarda só um hash (nunca o IP puro); linhas antigas são apagadas. ──
create table if not exists public.rate_limits (
  key          text        not null,
  window_start timestamptz not null,
  hits         integer     not null default 0,
  primary key (key, window_start)
);
alter table public.rate_limits enable row level security;

create or replace function public.consume_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_start timestamptz; v_hits integer;
begin
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, v_start, 1)
    on conflict (key, window_start) do update set hits = r.hits + 1
    returning hits into v_hits;
  if random() < 0.02 then delete from public.rate_limits where window_start < now() - interval '2 days'; end if;
  return v_hits <= p_max;
end $$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- ── Solicitações da titular (LGPD): acesso, correção, exclusão... Só a administradora lê. ──
create table if not exists public.privacy_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  kind          text not null check (kind in ('acesso','correcao','exclusao','portabilidade','outro')),
  contact_phone text check (contact_phone is null or contact_phone ~ '^[0-9]{10,13}$'),
  contact_email text check (contact_email is null or char_length(contact_email) <= 200),
  message       text check (message is null or char_length(message) <= 1000),
  status        text not null default 'aberta' check (status in ('aberta','em_andamento','concluida','recusada')),
  handled_at    timestamptz,
  handler_note  text check (handler_note is null or char_length(handler_note) <= 1000),
  check (contact_phone is not null or contact_email is not null)
);
alter table public.privacy_requests enable row level security;
drop policy if exists "admin lê solicitações de privacidade" on public.privacy_requests;
create policy "admin lê solicitações de privacidade" on public.privacy_requests for select to authenticated using (public.is_admin());
drop policy if exists "admin atualiza solicitações de privacidade" on public.privacy_requests;
create policy "admin atualiza solicitações de privacidade" on public.privacy_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── Anonimização de uma cliente (somente administradora). Não mexe em atendimentos futuros ativos. ──
create or replace function public.anonymize_client(p_phone text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not public.is_admin() then raise exception 'não autorizado' using errcode = '42501'; end if;
  update public.appointments
     set client_name = 'Cliente removido(a)', client_phone = '00000000000', client_email = null, notes = null, change_request_note = null
   where client_phone = p_phone
     and (status in ('cancelled','expired','refunded') or end_at < now());
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.anonymize_client(text) from public, anon;
grant execute on function public.anonymize_client(text) to authenticated;

-- ── Privilégios mínimos (defesa em profundidade além da RLS) ──
revoke all on public.appointments, public.blocks, public.admins, public.rate_limits, public.privacy_requests from anon;
revoke all on public.admins, public.rate_limits from authenticated;
revoke all on public.appointments, public.blocks, public.privacy_requests from authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, update on public.privacy_requests to authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
-- busy_slots continua público de propósito: devolve só intervalos de tempo, sem dados pessoais.
