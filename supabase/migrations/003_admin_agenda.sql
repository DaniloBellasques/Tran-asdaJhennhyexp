-- A administradora pode registrar atendimentos manualmente (ex.: pedidos feitos pelo WhatsApp)
-- e o sinal pode ser R$ 0 nesses casos.
alter table public.appointments drop constraint if exists appointments_signal_check;
alter table public.appointments add constraint appointments_signal_check check (signal >= 0);

drop policy if exists "admin cria agendamentos" on public.appointments;
create policy "admin cria agendamentos" on public.appointments
  for insert to authenticated with check (public.is_admin());
