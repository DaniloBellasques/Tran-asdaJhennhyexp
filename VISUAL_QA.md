# Checklist de QA visual e funcional
Marque só o que foi realmente executado e anote data/ambiente.

## Viewports: 1440, 768, 390
- [ ] Sem rolagem horizontal; nada cortado (logo, tabelas, modais).
- [ ] Hierarquia de títulos clara; espaçamento consistente; alinhamento de bordas.
- [ ] Imagens com proporção correta, sem estouro nem pixelização.
- [ ] Barra fixa mobile não cobre conteúdo/rodapé.

## Identidade
- [ ] Roxo/lilás protagonista; sem bege, sem gradiente roxo+azul genérico, sem blocos repetitivos de 3 cards.

## Fluxos
- [ ] Calculadora: todas as escolhas, preço e tempo coerentes.
- [ ] Agendamento: data/hora indisponíveis desabilitados; serviço longo bloqueia dias seguintes; aceite dos Termos obrigatório; erro 409 volta ao horário; Pix (QR + copia-e-cola); "Já paguei"; tela de status.
- [ ] WhatsApp: links abrem com mensagem correta.
- [ ] Admin: login; agenda; Pix recebido; cancelar; reembolsar; bloquear; novo agendamento manual; pedidos de privacidade; sem link público para `#/admin`.
- [ ] Páginas legais abrem, voltam e não deixam "A DEFINIR" na publicação (`node scripts/check-pendencias.mjs`).
- [ ] Nenhum botão sem ação.

## Estados
- [ ] Vazio, carregando, erro de rede, sessão expirada, Pix expirado.

## Acessibilidade
- [ ] Foco visível; navegação por teclado; labels em campos; `role="alert"` em erros; alvos ≥ 44px.
- [ ] Contraste de texto ≥ 4.5:1 (checar textos a 45–55% de opacidade).
- [ ] `prefers-reduced-motion` respeitado.

## Segurança
- [ ] `supabase/tests/run.sh` passa; sem segredos no bundle; cabeçalhos ativos em produção.
