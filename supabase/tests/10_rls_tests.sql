\set QUIET on
\pset format unaligned
\pset tuples_only on
-- helpers de teste
create or replace function pg_temp.t(name text, ok boolean) returns void language plpgsql as
$$ begin raise notice '% : %', case when ok then 'PASS' else 'FAIL' end, name; end $$;

insert into public.admins(email) values ('jhenny@exemplo.com');
-- dados de apoio (como service_role, que ignora RLS)
set role service_role;
insert into public.appointments (client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at, status, pix_expires_at)
values ('Maria Teste','11987654321','box','costas','media','medio',270,81,348, now()+interval '3 days', now()+interval '3 days 6 hours','confirmed', now()+interval '1 day');
insert into public.blocks (start_at, end_at, reason) values (now()+interval '9 days', now()+interval '9 days 1 hour','Folga');
reset role;

-- ── anon (visitante) ──
create or replace function pg_temp.vazio_ou_negado(q text) returns boolean language plpgsql as
$$ declare n int; begin execute 'select count(*) from (' || q || ') s' into n; return n = 0; exception when insufficient_privilege then return true; end $$;
set role anon; select set_config('request.jwt.claims','{"role":"anon"}',false);
do $$ declare n int; begin
  perform pg_temp.t('anon NÃO lê agendamentos', pg_temp.vazio_ou_negado('select * from public.appointments'));
  perform pg_temp.t('anon NÃO lê bloqueios', pg_temp.vazio_ou_negado('select * from public.blocks'));
  perform pg_temp.t('anon NÃO lê admins', pg_temp.vazio_ou_negado('select * from public.admins'));
  begin insert into public.appointments (client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at) values ('X','11999999999','box','costas','media','medio',1,1,60,now(),now()+interval '1 hour'); perform pg_temp.t('anon NÃO insere agendamento', false); exception when others then perform pg_temp.t('anon NÃO insere agendamento', true); end;
  begin insert into public.admins(email) values ('hacker@x.com'); perform pg_temp.t('anon NÃO vira admin', false); exception when others then perform pg_temp.t('anon NÃO vira admin', true); end;
  begin perform public.expire_stale(); perform pg_temp.t('anon NÃO executa expire_stale', false); exception when others then perform pg_temp.t('anon NÃO executa expire_stale', true); end;
  begin perform public.is_admin(); perform pg_temp.t('anon NÃO executa is_admin()', false); exception when insufficient_privilege then perform pg_temp.t('anon NÃO executa is_admin()', true); end;
  select count(*) into n from public.busy_slots(now(), now()+interval '30 days'); perform pg_temp.t('anon vê horários ocupados (só intervalos)', n >= 2);
end $$;
reset role;

-- ── usuária logada que NÃO é administradora ──
set role authenticated; select set_config('request.jwt.claims','{"role":"authenticated","email":"cliente@exemplo.com"}',false);
do $$ declare n int; begin
  select count(*) into n from public.appointments; perform pg_temp.t('autenticada comum NÃO lê agendamentos', n=0);
  update public.appointments set status='cancelled'; get diagnostics n = row_count; perform pg_temp.t('autenticada comum NÃO altera agendamentos', n=0);
  begin insert into public.blocks(start_at,end_at) values (now(), now()+interval '1 hour'); perform pg_temp.t('autenticada comum NÃO cria bloqueio', false); exception when others then perform pg_temp.t('autenticada comum NÃO cria bloqueio', true); end;
  begin insert into public.admins(email) values ('cliente@exemplo.com'); perform pg_temp.t('autenticada comum NÃO se torna admin', false); exception when others then perform pg_temp.t('autenticada comum NÃO se torna admin', true); end;
  begin insert into public.appointments (client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at, status) values ('X','11999999999','box','costas','media','medio',1,0,60,now(),now()+interval '1 hour','confirmed'); perform pg_temp.t('autenticada comum NÃO insere agendamento', false); exception when others then perform pg_temp.t('autenticada comum NÃO insere agendamento', true); end;
end $$;
reset role;

-- ── administradora ──
set role authenticated; select set_config('request.jwt.claims','{"role":"authenticated","email":"jhenny@exemplo.com"}',false);
do $$ declare n int; begin
  select count(*) into n from public.appointments; perform pg_temp.t('admin lê agendamentos', n=1);
  update public.appointments set notes='ok'; get diagnostics n = row_count; perform pg_temp.t('admin altera agendamentos', n=1);
  begin insert into public.blocks(start_at,end_at,reason) values (now()+interval '20 days', now()+interval '20 days 1 hour','x'); perform pg_temp.t('admin cria bloqueio', true); exception when others then perform pg_temp.t('admin cria bloqueio', false); end;
  begin insert into public.admins(email) values ('outra@x.com'); perform pg_temp.t('admin NÃO altera tabela admins pela API', false); exception when others then perform pg_temp.t('admin NÃO altera tabela admins pela API', true); end;
end $$;
reset role;

-- ── regra de conflito (como service_role) ──
set role service_role;
do $$ begin
  begin insert into public.appointments (client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at, status, pix_expires_at)
    values ('Conflito','11911112222','nago','ombro','media','pouco',180,54,150, now()+interval '3 days 2 hours', now()+interval '3 days 4 hours','pending', now()+interval '15 minutes');
    perform pg_temp.t('banco NÃO aceita horário sobreposto', false);
  exception when exclusion_violation then perform pg_temp.t('banco NÃO aceita horário sobreposto', true); end;
end $$;
reset role;

-- ═══ Testes da migração 004 ═══
-- privilégios: o visitante nem chega às tabelas
set role anon; select set_config('request.jwt.claims','{"role":"anon"}',false);
do $$ declare n int; begin
  begin perform 1 from public.appointments limit 1; perform pg_temp.t('anon sem privilégio em appointments (negado antes da RLS)', false); exception when insufficient_privilege then perform pg_temp.t('anon sem privilégio em appointments (negado antes da RLS)', true); end;
  begin perform 1 from public.privacy_requests limit 1; perform pg_temp.t('anon NÃO lê solicitações de privacidade', false); exception when insufficient_privilege then perform pg_temp.t('anon NÃO lê solicitações de privacidade', true); end;
  begin perform public.consume_rate_limit('x',1,60); perform pg_temp.t('anon NÃO usa consume_rate_limit', false); exception when insufficient_privilege then perform pg_temp.t('anon NÃO usa consume_rate_limit', true); end;
  begin perform public.anonymize_client('11987654321'); perform pg_temp.t('anon NÃO anonimiza clientes', false); exception when insufficient_privilege then perform pg_temp.t('anon NÃO anonimiza clientes', true); end;
  select count(*) into n from public.busy_slots(now(), now()+interval '30 days'); perform pg_temp.t('anon ainda vê horários ocupados', n >= 2);
end $$;
reset role;

set role authenticated; select set_config('request.jwt.claims','{"role":"authenticated","email":"cliente@exemplo.com"}',false);
do $$ declare n int; begin
  begin perform public.anonymize_client('11987654321'); perform pg_temp.t('autenticada comum NÃO anonimiza clientes', false); exception when others then perform pg_temp.t('autenticada comum NÃO anonimiza clientes', true); end;
  select count(*) into n from public.privacy_requests; perform pg_temp.t('autenticada comum NÃO lê solicitações de privacidade', n=0);
  begin perform 1 from public.rate_limits limit 1; perform pg_temp.t('autenticada comum NÃO lê rate_limits', false); exception when insufficient_privilege then perform pg_temp.t('autenticada comum NÃO lê rate_limits', true); end;
end $$;
reset role;

-- service_role (funções do servidor): limite de requisições e idempotência
set role service_role;
do $$ declare a boolean; b boolean; c boolean; begin
  a := public.consume_rate_limit('ip-teste', 2, 3600); b := public.consume_rate_limit('ip-teste', 2, 3600); c := public.consume_rate_limit('ip-teste', 2, 3600);
  perform pg_temp.t('limite de requisições: 2 permitidas e a 3ª bloqueada', a and b and not c);
  insert into public.privacy_requests(kind, contact_phone, message) values ('acesso','11987654321','quero meus dados');
  perform pg_temp.t('solicitação de privacidade gravada pelo servidor', (select count(*) from public.privacy_requests)=1);
  begin insert into public.privacy_requests(kind, message) values ('acesso','sem contato'); perform pg_temp.t('solicitação sem contato é rejeitada', false); exception when check_violation then perform pg_temp.t('solicitação sem contato é rejeitada', true); end;
  insert into public.appointments (request_id, client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at, status, pix_expires_at)
    values ('11111111-1111-4111-8111-111111111111','Dup','11922223333','box','costas','media','medio',100,30,60, now()+interval '12 days', now()+interval '12 days 1 hour','pending', now()+interval '15 minutes');
  begin insert into public.appointments (request_id, client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at, status, pix_expires_at)
    values ('11111111-1111-4111-8111-111111111111','Dup','11922223333','box','costas','media','medio',100,30,60, now()+interval '14 days', now()+interval '14 days 1 hour','pending', now()+interval '15 minutes');
    perform pg_temp.t('mesmo request_id NÃO cria 2º agendamento', false); exception when unique_violation then perform pg_temp.t('mesmo request_id NÃO cria 2º agendamento', true); end;
  begin insert into public.appointments (client_name, client_phone, style_id, length_id, thickness_id, volume_id, price, signal, duration_min, start_at, end_at)
    values ('Tel ruim','(11) 9999','box','costas','media','medio',100,30,60, now()+interval '16 days', now()+interval '16 days 1 hour');
    perform pg_temp.t('telefone fora do padrão é rejeitado', false); exception when check_violation then perform pg_temp.t('telefone fora do padrão é rejeitado', true); end;
  update public.appointments set status='refunded' where client_name='Maria Teste'; perform pg_temp.t('estado "refunded" aceito', true);
end $$;
reset role;

-- administradora continua com acesso após o endurecimento
set role authenticated; select set_config('request.jwt.claims','{"role":"authenticated","email":"jhenny@exemplo.com"}',false);
do $$ declare n int; begin
  select count(*) into n from public.appointments; perform pg_temp.t('admin ainda lê agendamentos', n >= 2);
  select count(*) into n from public.privacy_requests; perform pg_temp.t('admin lê solicitações de privacidade', n = 1);
  update public.privacy_requests set status='concluida', handled_at=now(); get diagnostics n=row_count; perform pg_temp.t('admin atualiza solicitação', n=1);
  insert into public.blocks(start_at,end_at,reason) values (now()+interval '30 days', now()+interval '30 days 1 hour','t'); perform pg_temp.t('admin ainda cria bloqueio', true);
  delete from public.blocks where reason='t'; get diagnostics n=row_count; perform pg_temp.t('admin remove bloqueio', n=1);
  perform public.anonymize_client('11987654321');
  perform pg_temp.t('admin anonimiza cliente (atendimento passado/cancelado/reembolsado)', (select count(*) from public.appointments where client_name='Cliente removido(a)') >= 1);
end $$;
reset role;
