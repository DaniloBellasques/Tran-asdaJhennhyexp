# Design system — Tranças da Jhenny
Fonte da verdade: `@theme` em `src/index.css`.

## Cores
| Token | Hex | Uso |
|---|---|---|
| ink | #0c0612 | fundo base |
| plum | #150b22 | seções alternadas |
| card | #1e1130 | superfícies/cartões |
| orchid | #2a1546 | superfícies elevadas |
| brand | #6c2bd9 | ação primária, destaque |
| brand-dark | #35145f | profundidade/sombras |
| violet | #8b5cf6 | foco, seleção, acentos |
| lilac | #a875e8 | links, ênfase em texto |
| lavender | #dcc8f5 | texto secundário claro, anel de foco |
| cream / mist | #f7f3fb / #ece3f6 | texto principal / seções claras (`.on-light`) |
Texto sobre fundo escuro: branco com 55–80% de opacidade para hierarquia (mínimo ~55% em textos informativos). Alerta: âmbar; erro: vermelho; sucesso: esmeralda — sempre com texto, nunca só cor.

## Tipografia
Display **Outfit** (200–700) para títulos (`.h-display`, tracking justo, `em` sem itálico). Texto **Manrope**. Rótulos pequenos (`.eyebrow`): caixa-alta, tracking largo. Corpo ≥ 14–16px; títulos com `clamp()`.

## Espaçamento e forma
Seções `py-24 md:py-32`; container `max-w-7xl px-5 sm:px-8`; formulários `max-w-4xl`/`narrow`. Cantos: cartões 1.5–1.75rem, campos 0.75rem, botões pílula. Superfícies: `border-white/10–14`, `bg-white/[0.04–0.05]`, vidro (`.glass`) só em barras fixas.

## Componentes (src/ui.tsx e afins)
`Logo`, `Reveal` (entrada ao rolar), `Field` (label, erro, dica), `FlowHeader`, `Stepper`, `.btn` (`primary`, `ghost`, `sm`; alvo ≥ 44px), `SummaryBar` (barra fixa de passo), `Modal` (admin), `ReelFrame` (embed com consentimento), `V` (valor ou "A DEFINIR").

## Movimento
Ease `cubic-bezier(0.22,1,0.36,1)`; entradas 280–420ms; botões `:active` 0.97; carrossel desliza 420ms; `prefers-reduced-motion` desliga animações.

## Padrões de produto
Fluxo de agendamento: estilo → comprimento → espessura/volume → extras → data/hora → dados (+aceite) → Pix → status. Erros inline e `role="alert"`; estados vazio/carregando em listas; texto de pagamento sempre diz que a confirmação é da Jhenny.
