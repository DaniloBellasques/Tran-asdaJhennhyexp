// Dados da empresa e políticas. NADA aqui é inventado: campo vazio aparece no site como "A DEFINIR"
// e é listado por `node scripts/check-pendencias.mjs`. Preencha com dados reais e aprovados pela Jhenny.
export const TERMS_VERSION = '2026-10-rascunho-1'
export const LEGAL_UPDATED = '22/10/2026'

export const LEGAL = {
  tradeName: 'Tranças da Jhenny',
  legalName: '',          // razão social ou nome completo da titular (MEI/autônoma)
  document: '',           // CNPJ (ou CPF, se a titular aceitar divulgar)
  commercialAddress: '',  // endereço comercial, SOMENTE se autorizado a divulgar
  whatsapp: '(11) 97507-6649',   // número já usado no site original
  email: '',              // e-mail de atendimento
  privacyEmail: '',       // e-mail do canal de privacidade (pode ser o mesmo)
  hours: '',              // horário de atendimento real (ex.: dias e faixas)
  retention: '',          // por quanto tempo guarda dados de agendamentos
  hosting: '',            // provedor onde o site está publicado

  // Políticas comerciais (definidas pela Jhenny; o site não presume valores)
  depositPolicy: '',      // o que é o sinal e como é abatido do valor total
  cancelPolicy: '',       // prazos e condições de cancelamento
  reschedulePolicy: '',   // prazos e limite de remarcações
  refundPolicy: '',       // quando e como há devolução do sinal
  latePolicy: '',         // tolerância de atraso
  priceChangePolicy: '', // quando o valor pode mudar (ex.: cabelo diferente do informado)
}

export const isPending = (v: string) => !v.trim()
