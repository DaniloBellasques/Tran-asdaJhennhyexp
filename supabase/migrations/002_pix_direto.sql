-- Pix direto na conta (sem gateway): a cliente avisa que pagou e a Jhenny confirma no painel.
alter table public.appointments add column if not exists paid_claimed_at timestamptz;
