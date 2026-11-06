# Ativar agendamentos reais (Supabase + Pix direto no Nubank)

Sem estas etapas o site continua em **modo demonstração**. Nada aqui foi testado com um pagamento real — faça os testes do passo 7 antes de divulgar.

## 1. Supabase
1. Crie um projeto em supabase.com.
2. **SQL Editor** → cole e rode, nesta ordem, `supabase/migrations/001_init.sql`, `002_pix_direto.sql` e `003_admin_agenda.sql`.
3. **Authentication → Providers → Email**: desative "Allow new users to sign up".
4. **Authentication → Users → Add user**: crie o login da Jhenny (e-mail e senha forte).
5. **Authentication → Providers → Email**: exija senha forte (mín. 10 caracteres) e, em **Authentication → MFA**, ative a verificação em duas etapas para o login da Jhenny (recomendado). Em **URL Configuration**, informe o endereço do site (para o link de "Esqueci a senha").
6. No SQL Editor: `insert into public.admins (email) values ('email-da-jhenny@exemplo.com');`

## 2. Pix direto no Nubank (sem gateway)
O Nubank não oferece API pública para cobrar e confirmar Pix automaticamente. Por isso o sinal cai **direto na chave Pix da Jhenny**, sem taxa e sem intermediário:
- o site gera o QR Code e o "copia e cola" **com o valor do sinal já preenchido**;
- a cliente paga no app dela e toca em "Já paguei": a tela mostra **Agendamento confirmado** e o horário fica reservado por 12 horas;
- a Jhenny confere o Pix no app do Nubank e toca em **Confirmar pagamento** no painel. Se o Pix não chegar, ela cancela o horário (ou ele libera sozinho após as 12 horas).

Você vai precisar de: a **chave Pix** do Nubank (CPF, e-mail, celular no formato `+5511999999999` ou chave aleatória, exatamente como cadastrada), o **nome** do recebedor (até 25 letras) e a **cidade** (até 15).

## 3. Funções do servidor (Supabase CLI)
```bash
npm i -g supabase
supabase login
supabase link --project-ref SEU-PROJETO
supabase secrets set PIX_KEY="+5511999999999" PIX_NAME="Jhenny Silva" PIX_CITY="Sao Paulo" ALLOWED_ORIGIN=https://seudominio.com.br RATE_SALT="$(openssl rand -hex 24)"
supabase functions deploy create-booking
supabase functions deploy manage-booking
supabase functions deploy privacy-request
supabase functions deploy claim-paid
```

## 4. Site
Defina `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API) no `.env.local` e/ou na hospedagem (Vercel, Netlify…), depois `pnpm install && pnpm build`.

## 5. Como funciona
- A cliente escolhe serviço, dia e horário. Os horários ocupados vêm do banco (`busy_slots`), sem dados pessoais.
- Ao ir para o pagamento, `create-booking` **recalcula o preço no servidor**, reserva o horário por 15 min e monta o Pix com o valor do sinal.
- O banco impede dois atendimentos no mesmo horário (restrição `no_overlap`).
- Quando a cliente avisa que pagou, `claim-paid` mantém a reserva por 12 h. A Jhenny confirma no painel e a tela da cliente atualiza sozinha.
- Se a reserva expirar e a cliente pagar mesmo assim, o pedido continua na lista "Pix para conferir" (se a cliente tiver avisado) e a Jhenny pode confirmar, se o horário continuar livre, ou devolver o Pix.
- Painel admin: **não há botão nem link no site**. Só a Jhenny abre, digitando `seudominio.com.br/#/admin`, e precisa de e-mail e senha. A proteção de verdade está no servidor: sem login (e sem estar na tabela `admins`), o banco não devolve nenhum agendamento. A página também pede aos buscadores que não a indexem.
- **O painel mostra os dados reais**, atualizados a cada 30 segundos: agenda (hoje, 7 dias, 30 dias), faturamento, sinais e horas do mês, lista "Pix para conferir" (botões *Pix recebido* e *Cancelar*), lembretes de WhatsApp para atendimentos das próximas 48 h, clientes com mais de 28 dias sem voltar e estilos mais pedidos.
- **Novo agendamento** (para pedidos feitos pelo WhatsApp) e **Criar bloqueio** (folgas, dia inteiro ou horário) funcionam e passam a bloquear o horário no site na hora.
- Sem o backend ligado, `/#/admin` mostra "Indisponível" (o painel de exemplo só aparece no ambiente de desenvolvimento).
- **Sem o Supabase**, mas com `VITE_PIX_*` preenchido: o QR é real, e a confirmação é pelo WhatsApp (a cliente envia o comprovante).

## 6. Importante
- **Duração na agenda:** o atendimento ocupa a agenda por todo o tempo estimado. Um serviço de 8 horas bloqueia o dia inteiro e continua no próximo dia útil; o intervalo do almoço e os domingos são pulados. O expediente usado é o dos horários que já existiam no site (09:00–12:00 e 13:00–17:00, fuso de São Paulo). **Confirme se esse é o expediente real**; se for outro, ajuste `SESSIONS` em `src/schedule.ts` e em `supabase/functions/_shared/schedule.ts` (os dois arquivos são iguais) e a lista `ALL_SLOTS`.
- As durações são estimativas calculadas pelo site (estilo, comprimento e espessura).
- Não há confirmação automática: a Jhenny precisa conferir o Nubank e confirmar no painel. Confirme só depois de ver o Pix recebido.
- Se mudar preços/serviços em `src/BraidCalculator.tsx`, altere também `supabase/functions/_shared/catalog.ts` (o servidor é quem cobra).
- Horário de atendimento (`ALL_SLOTS`, domingo fechado) também existe nos dois lugares.
- **Textos legais:** preencha `src/legalConfig.ts` (rode `node scripts/check-pendencias.mjs`) e peça revisão a um(a) advogado(a) antes de publicar. Os textos são um rascunho técnico fiel ao que o sistema faz, não parecer jurídico.
- **Cabeçalhos de segurança:** `public/_headers` (Netlify/Cloudflare) e `vercel.json` já trazem CSP, HSTS etc. Se trocar de provedor, replique-os.
- **Backup:** no plano gratuito do Supabase não há backups diários automáticos; exporte os dados periodicamente (Table Editor → Export) ou use plano pago. Teste restaurar.
- **Incidente (vazamento/acesso indevido):** troque a senha do painel, gire as chaves do projeto (Project Settings → API), avalie o que foi exposto e comunique as pessoas afetadas e a ANPD se houver risco relevante.

## 7. Teste antes de divulgar
Faça um agendamento de verdade com valor baixo, pague o Pix, toque em "Já paguei", confirme no painel e veja a tela da cliente atualizar; confira também que o valor no app do Nubank é o do sinal; tente reservar o mesmo horário em duas abas (a segunda deve avisar que ocupou); deixe um Pix expirar.
