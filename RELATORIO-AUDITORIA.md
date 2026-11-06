# Relatório de auditoria — Tranças da Jhenny
Data: 23/10/2026. Escopo: código do site, funções Supabase e migrações. **Não é parecer jurídico nem garantia de proteção total.**

## 1. Arquitetura
React/Vite (front) → Supabase (Postgres + RLS + Auth + Edge Functions). Pix direto na chave Nubank da Jhenny, confirmação manual no painel. Sem Supabase: modo demonstração (nada é gravado; aviso visível).

## 2. Vulnerabilidades/achados e correções
| Achado | Correção |
|---|---|
| Sem limite de requisições (dava para segurar a agenda em massa) | `consume_rate_limit` + `_shared/guard.ts` (hash do IP com sal) em create-booking, claim-paid, manage-booking, privacy-request |
| CORS `*` por padrão | `ALLOWED_ORIGIN` documentado como obrigatório em produção |
| Reenvio duplicava reserva | `requestId` idempotente (índice único) |
| Token de acompanhamento na URL de consulta | Função `manage-booking` por POST (token no corpo); `booking-status` removida |
| Aceite dos Termos não registrado | Checkbox desmarcado; guarda data e versão; servidor recusa sem aceite |
| Dados pessoais salvos sem consentimento no aparelho | "Lembrar meus dados" opcional |
| Instagram carregava sem consentimento | Clique para carregar |
| Privilégios amplos no banco | Revogado de `anon`; mínimo necessário a `authenticated`; 38 testes |
| Sem logout no servidor/recuperação de senha | `/auth/v1/logout` e fluxo de recuperação |
| Sem cabeçalhos de segurança | `public/_headers` e `vercel.json` (CSP, HSTS…) |
| `.env.example` ignorado pelo git | corrigido |
| Corpo de requisição sem limite | `readJson` (8 KB) |
Nenhum segredo encontrado no código (service_role só via variável de ambiente).

## 3. Arquivos principais
`supabase/migrations/004_seguranca_lgpd.sql`, `supabase/functions/{create-booking,claim-paid,manage-booking,privacy-request,_shared/guard.ts,_shared/http.ts}`, `supabase/tests/*`, `src/{api.ts,Legal.tsx,legalConfig.ts,LiveAdmin.tsx,BraidCalculator.tsx,App.tsx}`, `public/_headers`, `vercel.json`, `scripts/check-pendencias.mjs`.

## 4. Migrações
Nova: `004` (colunas de idempotência/aceite/pedidos, status `refunded`, `rate_limits`, `privacy_requests`, `anonymize_client`, privilégios). Não apaga tabelas nem dados.

## 5. Testes — o que foi e o que NÃO foi executado
Executado: 38 testes de banco em PostgreSQL 16 real com shim do Supabase (RLS, privilégios, rate limit, idempotência, anonimização); fluxo completo do site (demo e "ao vivo" com Supabase simulado: 409, aceite obrigatório, requestId, "já paguei", confirmação); páginas legais, rotas e rodapé; clique-para-carregar do Instagram; sem estouro de largura no celular; QR Pix decodificado.
**Não executado:** Supabase real, edge functions (sem Deno aqui), pagamento Pix real, e-mail de recuperação de senha, `pnpm build` oficial (registro npm bloqueado), checagem de tipos TypeScript. Faça o roteiro do passo 7 do `ATIVAR-BACKEND.md`.

## 6. Integrações
- Pix Nubank: manual, sem API. Mercado Pago removido. Nenhuma integração simulada é apresentada como real.
- **Avaliações do Google / Maps:** NÃO implementadas (não há URL do perfil/Place ID; a API Places é paga). Precisam da sua decisão.
- **Portfólio/Instagram:** apenas link ao perfil oficial e embeds com consentimento; fotos só com o seu envio.

## 7. Depende de você
Ver `PENDENCIAS-ANTES-DE-PUBLICAR.md`.

## 8. Riscos pendentes
Texto "Agendamento confirmado!" aparece antes da confirmação do Pix (mantido por sua escolha; há aviso de que o pagamento só vale após confirmação — risco de reclamação de consumidor); depoimentos e números (500+/8/20+) sem verificação; sem MFA obrigatório nem CAPTCHA; fontes do Google carregam de terceiros; gerenciamento de serviços/preços/portfólio pelo painel não existe (exige nova tabela — precisa da sua aprovação); backups dependem do plano Supabase.

## 9. Testar localmente
`node scripts/check-pendencias.mjs`; `cd supabase/tests && PGHOST=... PGPORT=... PGUSER=postgres ./run.sh` (precisa de um PostgreSQL local); `pnpm install && pnpm dev`.
