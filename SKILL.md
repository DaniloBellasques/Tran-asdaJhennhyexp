# SKILL — Regras permanentes do projeto Tranças da Jhenny

## Identidade (prioridade absoluta)
- Marca já existente: **não criar marca nova**. Roxo e lilás são protagonistas; neutros têm subtom violeta (ver DESIGN_SYSTEM.md).
- Tom: feminino, sofisticado, maduro, profissional. Evitar: salão genérico, loja de cosméticos, estética infantil, gradiente roxo+azul genérico, templates, ícones decorativos sem função, três cards iguais só para preencher.
- Sem bege/off-white como fundo. Em conflito entre tendência e identidade, vence a identidade.

## Regras de negócio e dados
- Não inventar dados, preços, depoimentos, avaliações, endereços ou documentos. Campo desconhecido = "A DEFINIR" em `src/legalConfig.ts`.
- Preços e durações vivem em `src/BraidCalculator.tsx` **e** `supabase/functions/_shared/catalog.ts` (o servidor cobra). Alterar os dois.
- Expediente em `src/schedule.ts` e `supabase/functions/_shared/schedule.ts` (idênticos).
- Serviço longo ocupa a agenda pelo tempo todo (pula almoço e domingos).
- Pix direto na chave Nubank; confirmação **manual** no painel. Voltar ao site não confirma pagamento.
- Backend: **Supabase** (a escolha final do projeto; o briefing original citava Neon, mas não existe integração Neon no código). Não trocar o banco sem decisão da dona.
- Não remover funcionalidades, não deixar botão sem ação, não usar dado fictício como real (demo precisa de aviso visível).

## Segurança e privacidade
- Admin: login Supabase Auth + tabela `admins` + RLS. URL escondida não é proteção.
- Nunca expor `service_role`, chaves Pix do servidor ou `.env`. Só `VITE_*` públicas no front.
- Toda função do servidor: limite de tentativas, validação, corpo limitado, CORS por `ALLOWED_ORIGIN`.
- Dados pessoais no aparelho só com opt-in. Terceiros (Instagram) só com clique.
- Alterou migração? Rode `supabase/tests/run.sh`.

## Código
- React 19 + Vite + Tailwind v4 + TS. Navegação por estado em `App.tsx` + hashes (`#/admin`, `#/privacidade`…).
- Mudanças pequenas e reversíveis; mobile primeiro (390px), checar 768 e 1440.

## Movimento (princípios Emil Kowalski)
- Entradas discretas (≤ 420ms), easing `--ease-out-soft`; feedback de toque (`:active` scale 0.97); animar só `transform`/`opacity`; respeitar `prefers-reduced-motion`; nada que atrase uma ação.

## Antes de entregar
Seguir VISUAL_QA.md; rodar `node scripts/check-pendencias.mjs`; declarar honestamente o que não foi testado.
