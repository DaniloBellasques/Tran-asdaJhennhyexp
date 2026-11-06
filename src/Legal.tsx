import { useEffect, useState, type ReactNode } from 'react'
import { FlowHeader, Field, WHATSAPP_URL } from './ui'
import { LEGAL, LEGAL_UPDATED, TERMS_VERSION, isPending } from './legalConfig'
import { isLive, sendPrivacyRequest, myBooking, requestChange, type MyBooking } from './api'

/** Valor configurado ou marcador visível "A DEFINIR" (nunca inventamos dados). */
export function V({ v }: { v: string }) {
  return isPending(v)
    ? <mark className="rounded bg-amber-300/20 px-1.5 py-0.5 text-amber-200 text-[0.8em] font-semibold tracking-wide">A DEFINIR</mark>
    : <>{v}</>
}
const anyPending = Object.values(LEGAL).some(isPending)

function Page({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  useEffect(() => {
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'
    document.head.appendChild(m)
    return () => { m.remove() }
  }, [])
  return (
    <div className="min-h-screen font-sans text-cream" style={{ background: 'radial-gradient(90% 40% at 85% 0%, rgba(108,43,217,0.2), transparent 60%), #0c0612' }}>
      <FlowHeader onBack={onBack} backLabel="Voltar ao site" />
      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
        <h1 className="h-display text-3xl sm:text-4xl text-white">{title}</h1>
        <p className="mt-2 text-xs text-white/45">Última atualização: {LEGAL_UPDATED} · versão {TERMS_VERSION}</p>
        {anyPending && (
          <p role="note" className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            Este texto ainda está em preparação: os campos marcados como <b>A DEFINIR</b> serão preenchidos pela Jhenny antes da publicação oficial.
          </p>
        )}
        <div className="legal mt-8 space-y-5 text-[0.95rem] leading-relaxed text-white/75 [&_h2]:mt-9 [&_h2]:mb-1 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-lilac [&_a]:underline">
          {children}
        </div>
      </main>
    </div>
  )
}

export function Privacy({ onBack }: { onBack: () => void }) {
  return (
    <Page title="Política de Privacidade" onBack={onBack}>
      <p>Esta política explica, em linguagem simples, quais dados o site da <b>{LEGAL.tradeName}</b> usa e por quê, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

      <h2>1. Quem é a responsável</h2>
      <p>Controladora: <V v={LEGAL.legalName} /> ({LEGAL.tradeName}), documento: <V v={LEGAL.document} />. Contato de privacidade: <V v={LEGAL.privacyEmail} /> ou WhatsApp {LEGAL.whatsapp}.</p>

      <h2>2. Quais dados coletamos</h2>
      <ul>
        <li><b>No agendamento:</b> nome, WhatsApp, e-mail (opcional), observações que você escrever, o serviço escolhido, data e horário, valores e o aceite dos Termos (com data e versão).</li>
        <li><b>No pagamento do sinal:</b> o Pix é feito diretamente para a chave da Jhenny no seu banco. O site <u>não</u> recebe nem guarda dados do seu cartão ou da sua conta; registra apenas que você avisou que pagou e, depois, se a Jhenny confirmou.</li>
        <li><b>Segurança:</b> para evitar abuso, guardamos temporariamente uma sequência embaralhada (hash) derivada do seu endereço de rede, sem armazenar o IP em texto, apenas para limitar tentativas excessivas.</li>
        <li><b>Pedidos de privacidade:</b> o que você informar no formulário “Meus dados”.</li>
      </ul>
      <p>Não coletamos dados sensíveis de propósito. Evite escrever informações de saúde nas observações; se houver alergia que a Jhenny precise saber, informe só o necessário.</p>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Reservar o horário, calcular valores e confirmar o atendimento (execução do serviço que você solicitou).</li>
        <li>Falar com você pelo WhatsApp ou e-mail sobre o agendamento.</li>
        <li>Controlar pagamentos do sinal e atender pedidos de cancelamento, remarcação ou reembolso.</li>
        <li>Proteger o site contra fraudes e uso abusivo e cumprir obrigações legais.</li>
      </ul>
      <p>Não vendemos seus dados e não os usamos para publicidade de terceiros.</p>

      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li><b>Supabase</b>, serviço de banco de dados e autenticação onde os agendamentos ficam armazenados (quando o site está em modo completo).</li>
        <li><b>Provedor de hospedagem do site:</b> <V v={LEGAL.hosting} />.</li>
        <li><b>WhatsApp (Meta)</b>, apenas se você clicar para conversar; <b>seu banco</b>, ao pagar o Pix.</li>
        <li><b>Google Fonts</b> (fontes das letras): o navegador baixa as fontes dos servidores do Google, que recebem seu IP.</li>
        <li><b>Instagram (Meta)</b>: os vídeos do carrossel só carregam depois que você clica em “Carregar vídeo”; a partir daí o Instagram pode registrar o acesso conforme a política dele.</li>
      </ul>
      <p>Alguns desses serviços podem processar dados fora do Brasil. Ao usar o site você reconhece essa transferência necessária ao funcionamento.</p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>Dados de agendamento: <V v={LEGAL.retention} />. Depois disso, são apagados ou anonimizados, salvo obrigação legal de guarda.</p>

      <h2>6. Cookies e armazenamento no seu aparelho</h2>
      <p>O site não usa cookies de publicidade nem de análise. Usamos o armazenamento do navegador apenas para: lembrar seus dados no próximo agendamento <b>se você marcar essa opção</b>; manter a sessão do painel administrativo (somente para a equipe). Você pode apagar isso nas configurações do navegador. Sem o backend ativo (modo demonstração), nenhum dado é enviado a servidor.</p>

      <h2>7. Seus direitos</h2>
      <p>Você pode pedir: confirmação de que tratamos seus dados e acesso a eles; correção; anonimização ou exclusão; portabilidade; informações sobre compartilhamento; e revogação de consentimento. Use o formulário em <a href="#/meus-dados">Meus dados</a>. Para sua segurança, a Jhenny confirmará sua identidade (por exemplo, respondendo pelo mesmo WhatsApp usado no agendamento) antes de entregar ou apagar qualquer informação. Alguns dados podem ser mantidos quando a lei exigir.</p>
      <p>Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <h2>8. Segurança</h2>
      <p>Usamos conexão criptografada (HTTPS), controle de acesso no banco de dados, limite de tentativas e login restrito para a equipe. Nenhum sistema é totalmente imune a falhas; em caso de incidente com risco relevante, comunicaremos as pessoas afetadas e a ANPD, conforme a lei.</p>

      <h2>9. Mudanças</h2>
      <p>Podemos atualizar esta política; a data e a versão aparecem no topo.</p>
    </Page>
  )
}

export function Terms({ onBack }: { onBack: () => void }) {
  return (
    <Page title="Termos de Uso" onBack={onBack}>
      <p>Ao agendar pelo site, você concorda com estes termos. Eles complementam o Código de Defesa do Consumidor e não retiram direitos seus.</p>

      <h2>1. Quem presta o serviço</h2>
      <p><V v={LEGAL.legalName} /> — {LEGAL.tradeName}. Documento: <V v={LEGAL.document} />. Endereço: <V v={LEGAL.commercialAddress} />. WhatsApp: {LEGAL.whatsapp}. E-mail: <V v={LEGAL.email} />. Atendimento: <V v={LEGAL.hours} />.</p>

      <h2>2. O que o site faz</h2>
      <p>Permite simular o valor de penteados em tranças, escolher data e horário e solicitar a reserva. A simulação segue a tabela de preços e tempos exibida no site; ela é estimativa baseada nas opções que você escolhe (veja “Como calculamos” na simulação).</p>

      <h2>3. Reserva e confirmação</h2>
      <ul>
        <li>O horário fica reservado para você por um tempo limitado enquanto o Pix do sinal é feito.</li>
        <li>O pagamento é feito diretamente para a chave Pix da Jhenny e <b>confirmado por ela manualmente</b>. Voltar ao site depois de pagar não confirma o pagamento por si só; o status do agendamento mostra quando houve confirmação.</li>
        <li>Serviços longos ocupam a agenda por todo o tempo de trabalho, podendo seguir em mais de um dia útil.</li>
      </ul>

      <h2>4. Sinal, cancelamento, remarcação e reembolso</h2>
      <p>Valem as regras da página <a href="#/pagamentos">Pagamentos e cancelamento</a>. Nada nestes termos limita direitos previstos em lei.</p>

      <h2>5. Suas responsabilidades</h2>
      <ul>
        <li>Informar dados verdadeiros e um WhatsApp em que você seja encontrada.</li>
        <li>Informar corretamente as características do cabelo e do serviço escolhido, pois isso define tempo e valor.</li>
        <li>Avisar sobre alergias ou condições do couro cabeludo que possam afetar o procedimento.</li>
        <li>Chegar no horário combinado (tolerância: <V v={LEGAL.latePolicy} />).</li>
      </ul>

      <h2>6. Alteração de valor</h2>
      <p><V v={LEGAL.priceChangePolicy} /></p>

      <h2>7. Imagens e conteúdo</h2>
      <p>Fotos e vídeos do site pertencem à Jhenny ou são usados com autorização. Não copie sem permissão.</p>

      <h2>8. Disponibilidade do site</h2>
      <p>Empenhamo-nos em manter o site no ar, mas ele pode ficar indisponível por manutenção ou falhas de terceiros. Nesses casos, fale conosco pelo WhatsApp.</p>

      <h2>9. Privacidade</h2>
      <p>O tratamento de dados está descrito na <a href="#/privacidade">Política de Privacidade</a>.</p>

      <h2>10. Contato e foro</h2>
      <p>Dúvidas ou reclamações: WhatsApp {LEGAL.whatsapp}. Fica ressalvado o direito da consumidora de ajuizar ação no foro de seu domicílio.</p>
    </Page>
  )
}

export function Payments({ onBack }: { onBack: () => void }) {
  return (
    <Page title="Pagamentos e cancelamento" onBack={onBack}>
      <h2>Como o pagamento funciona</h2>
      <ul>
        <li>Para reservar, pede-se um sinal pago por Pix, direto na conta da Jhenny. O valor do sinal aparece antes de você pagar.</li>
        <li>O sinal: <V v={LEGAL.depositPolicy} /></li>
        <li>A Jhenny confirma o recebimento manualmente. Estados possíveis do agendamento: aguardando pagamento, confirmado, expirado (Pix não pago a tempo), cancelado, reembolsado ou em análise.</li>
        <li>Se o Pix não for pago no prazo, o horário é liberado automaticamente.</li>
        <li>Guarde o comprovante do Pix. Se houver dúvida na confirmação, fale pelo WhatsApp.</li>
      </ul>

      <h2>Cancelamento</h2>
      <p><V v={LEGAL.cancelPolicy} /></p>
      <h2>Remarcação</h2>
      <p><V v={LEGAL.reschedulePolicy} /></p>
      <h2>Reembolso</h2>
      <p><V v={LEGAL.refundPolicy} /></p>

      <h2>Direito de arrependimento</h2>
      <p>Contratações feitas a distância (pela internet) podem dar direito de arrependimento em até 7 dias, nos termos do art. 49 do Código de Defesa do Consumidor. Como o serviço é agendado para uma data específica, a Jhenny deve informar aqui como isso é aplicado: <V v={LEGAL.refundPolicy} />. Para exercer seu direito, use o link “Meu agendamento” ou fale pelo WhatsApp.</p>

      <h2>Como pedir cancelamento ou remarcação</h2>
      <p>Pelo link “Meu agendamento” que aparece ao final da reserva, ou pelo WhatsApp <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">{LEGAL.whatsapp}</a>. O pedido é analisado pela Jhenny, que responde confirmando.</p>
    </Page>
  )
}

export function MyData({ onBack }: { onBack: () => void }) {
  const [kind, setKind] = useState('acesso')
  const [phone, setPhone] = useState(''); const [email, setEmail] = useState(''); const [msg, setMsg] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle'); const [err, setErr] = useState('')
  async function send() {
    setErr(''); setState('sending')
    try { await sendPrivacyRequest({ kind, phone, email, message: msg }); setState('done') }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erro inesperado.'); setState('idle') }
  }
  return (
    <Page title="Meus dados (LGPD)" onBack={onBack}>
      <p>Use este formulário para pedir acesso, correção, exclusão ou portabilidade dos seus dados. Para sua proteção, <b>não entregamos nem apagamos nada sem confirmar que é você</b>: a Jhenny responderá no WhatsApp ou e-mail informado e poderá pedir uma confirmação simples (como um dado do seu agendamento).</p>
      {!isLive ? (
        <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">O formulário online ainda não está ativo. Enquanto isso, envie seu pedido por WhatsApp ({LEGAL.whatsapp}) ou e-mail <V v={LEGAL.privacyEmail} />.</p>
      ) : state === 'done' ? (
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-emerald-100">Pedido recebido. Responderemos no contato informado. Não é necessário enviar de novo.</p>
      ) : (
        <form className="space-y-5" onSubmit={e => { e.preventDefault(); void send() }}>
          <label className="block text-sm font-medium text-white">Tipo de pedido
            <select value={kind} onChange={e => setKind(e.target.value)} className="mt-2 w-full min-h-12 rounded-xl border border-white/14 bg-white/[0.05] px-4 text-white">
              <option value="acesso">Acesso aos meus dados</option><option value="correcao">Correção de dados</option>
              <option value="exclusao">Exclusão / anonimização</option><option value="portabilidade">Portabilidade</option><option value="outro">Outro</option>
            </select>
          </label>
          <Field label="WhatsApp usado no agendamento" type="tel" inputMode="tel" value={phone} onChange={setPhone} autoComplete="tel" placeholder="(11) 90000-0000" />
          <Field label="E-mail (opcional)" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Detalhes (não escreva dados sensíveis)" multiline value={msg} onChange={setMsg} />
          {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
          <button type="submit" disabled={state === 'sending'} className="btn btn-primary">{state === 'sending' ? 'Enviando…' : 'Enviar pedido'}</button>
        </form>
      )}
    </Page>
  )
}

const STATUS_PT: Record<string, string> = {
  pending: 'Aguardando confirmação do pagamento', confirmed: 'Confirmado pela Jhenny', cancelled: 'Cancelado', expired: 'Expirado (Pix não pago no prazo)',
  needs_review: 'Em análise pela Jhenny', refunded: 'Reembolsado',
}
export function MyBookingPage({ id, token, onBack }: { id: string; token: string; onBack: () => void }) {
  const [b, setB] = useState<MyBooking | null>(null); const [err, setErr] = useState('')
  const [msg, setMsg] = useState(''); const [sent, setSent] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { myBooking(id, token).then(setB).catch(e => setErr(e.message)) }, [id, token])
  async function ask(kind: 'cancel' | 'reschedule') {
    setBusy(true); setErr('')
    try { await requestChange(id, token, kind, msg); setSent(kind === 'cancel' ? 'Pedido de cancelamento enviado.' : 'Pedido de remarcação enviado.'); setB(await myBooking(id, token)) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erro inesperado.') } finally { setBusy(false) }
  }
  const open = b && (b.status === 'pending' || b.status === 'confirmed')
  return (
    <Page title="Meu agendamento" onBack={onBack}>
      {err && <p role="alert" className="text-red-300">{err}</p>}
      {!b && !err && <p>Carregando…</p>}
      {b && (<>
        <div className="rounded-2xl border border-white/12 bg-white/5 p-5 space-y-1.5">
          <p><b className="text-white">Situação:</b> {STATUS_PT[b.status] ?? b.status}</p>
          <p><b className="text-white">Início:</b> {new Date(b.startAt).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}</p>
          <p><b className="text-white">Valor total:</b> R$ {b.price} · <b className="text-white">Sinal:</b> R$ {b.signal}</p>
          {b.changeRequest && <p className="text-amber-200">Você já enviou um pedido de {b.changeRequest === 'cancel' ? 'cancelamento' : 'remarcação'}; aguarde a resposta da Jhenny.</p>}
        </div>
        <p>O pagamento só é considerado confirmado quando a Jhenny o confirma; esta página mostra o status atual. Regras: <a href="#/pagamentos">Pagamentos e cancelamento</a>.</p>
        {open && !b.changeRequest && (
          <div className="space-y-3">
            <Field label="Mensagem (opcional)" multiline value={msg} onChange={setMsg} />
            <div className="flex flex-wrap gap-3">
              <button disabled={busy} onClick={() => ask('reschedule')} className="btn btn-ghost">Pedir remarcação</button>
              <button disabled={busy} onClick={() => ask('cancel')} className="btn btn-ghost">Pedir cancelamento</button>
            </div>
            <p className="text-xs text-white/50">O pedido não cancela nem remarca automaticamente: a Jhenny analisa e responde.</p>
          </div>
        )}
        {sent && <p role="status" className="text-emerald-200">{sent}</p>}
      </>)}
    </Page>
  )
}
