import { useState } from 'react'
import { Logo, ArrowLeft, CheckIcon, CalendarIcon, ClockIcon, WhatsAppIcon, StarIcon, SparkIcon } from './ui'

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  green:   '#4ade80',
  amber:   '#fbbf24',
  red:     '#f87171',
}

// ─── Data (inalterado) ────────────────────────────────────────────────────────
const APPOINTMENTS = [
  { time:'09:00', client:'Mariana Souza',  style:'Box Braids',   total:250, signal:75,  sigStatus:'pago',      blocked:false },
  { time:'09:30', client:'—',              style:'—',            total:0,   signal:0,   sigStatus:'bloqueado',  blocked:true, note:'Almoço' },
  { time:'10:30', client:'Ana Ferreira',   style:'Nagô',         total:200, signal:60,  sigStatus:'pago',      blocked:false },
  { time:'13:00', client:'Camila Rocha',   style:'Goddess',      total:300, signal:90,  sigStatus:'pendente',  blocked:false },
  { time:'14:30', client:'Júlia Lima',     style:'Knotless',     total:360, signal:108, sigStatus:'pago',      blocked:false },
  { time:'16:00', client:'—',              style:'—',            total:0,   signal:0,   sigStatus:'bloqueado',  blocked:true, note:'Folga Pessoal' },
  { time:'17:00', client:'Beatriz Costa',  style:'Micro Braids', total:420, signal:126, sigStatus:'pendente',  blocked:false },
]

const REMINDERS = [
  { client:'Camila Rocha',  time:'Hoje 13:00', sent:false, style:'Goddess Braids' },
  { client:'Júlia Lima',    time:'Hoje 14:30', sent:true,  style:'Knotless Braids' },
  { client:'Beatriz Costa', time:'Hoje 17:00', sent:false, style:'Micro Braids' },
]

const CRM_ALERTS = [
  { client:'Fernanda Oliveira', days:32, style:'Box Braids',   phone:'11 91234-5678' },
  { client:'Larissa Mendes',    days:45, style:'Nagô',          phone:'11 98765-4321' },
  { client:'Tainá Santos',      days:28, style:'Fulani Braids', phone:'11 97654-3210' },
]

const DONUT_DATA = [
  { label:'Box Braids',   value:32, color:'#8b5cf6' },
  { label:'Knotless',     value:24, color:'#a875e8' },
  { label:'Nagô',         value:20, color:'#c7a6f2' },
  { label:'Goddess',      value:14, color:'#e6d6f8' },
  { label:'Outros',       value:10, color:'#4a2f72' },
]

const KPI = [
  { label:'Faturamento (mês)', value:'R$ 4.250', sub:'+15% vs. mês anterior', icon:'money', positive:true },
  { label:'Sinais recebidos',  value:'R$ 850',   sub:'Pix confirmados',        icon:'spark', positive:true },
  { label:'Horas trabalhadas', value:'48h',       sub:'Este mês',               icon:'clock', positive:null },
  { label:'Atendimentos',      value:'8',         sub:'Agendados hoje',          icon:'cal',   positive:null },
]

const KPI_ICON: Record<string, React.ReactNode> = {
  money: <StarIcon className="w-4 h-4" />,
  spark: <SparkIcon className="w-4 h-4" />,
  clock: <ClockIcon className="w-4 h-4" />,
  cal:   <CalendarIcon className="w-4 h-4" />,
}

const SECTIONS = [
  { id: 'agenda',    label: 'Agenda' },
  { id: 'lembretes', label: 'Lembretes' },
  { id: 'clientes',  label: 'Clientes em espera' },
  { id: 'estilos',   label: 'Estilos populares' },
]

// ─── Donut (inalterado) ───────────────────────────────────────────────────────
function DonutChart({ data, size = 140 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const r = size / 2 - 14
  const cx = size / 2, cy = size / 2
  const total = data.reduce((s, d) => s + d.value, 0)
  const gap = 2

  let cursor = -90
  const segments = data.map(d => {
    const deg = (d.value / total) * (360 - gap * data.length)
    const start = cursor + gap / 2
    const end = start + deg
    cursor = end + gap / 2
    const a1 = (start * Math.PI) / 180, a2 = (end * Math.PI) / 180
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    const large = deg > 180 ? 1 : 0
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}` }
  })

  return (
    <div className="flex flex-col items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Distribuição dos estilos mais populares">
        {segments.map((s, i) => (
          <path key={i} d={s.path} fill="none" stroke={s.color} strokeWidth={18} strokeLinecap="round" />
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#f7f3fb" fontSize={26} fontWeight={500} fontFamily="Outfit, sans-serif">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(247,243,251,0.55)" fontSize={9} letterSpacing="1.2">ATENDIMENTOS</text>
      </svg>
      <ul className="w-full space-y-2.5">
        {data.map(d => (
          <li key={d.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-xs text-white/65">{d.label}</span>
            </span>
            <span className="text-xs font-semibold text-white tabular-nums">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Badge de sinal ───────────────────────────────────────────────────────────
function SigBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pago:      { label: 'Pago',      cls: 'bg-emerald-400/12 text-emerald-300' },
    revisar:   { label: 'Revisar',   cls: 'bg-red-400/15 text-red-300' },
    cancelado: { label: 'Cancelado', cls: 'bg-white/8 text-white/50' },
    pendente:  { label: 'Pendente',  cls: 'bg-amber-400/12 text-amber-300' },
    bloqueado: { label: 'Bloqueado', cls: 'bg-white/8 text-white/60' },
  }
  const s = map[status] ?? map.pendente
  return <span className={`inline-block text-[0.68rem] font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>
}

const panel = 'rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02]'
const cols = 'grid grid-cols-[4.2rem_1fr_auto] md:grid-cols-[5rem_1fr_6rem_5.5rem_6.5rem_3.5rem] lg:grid-cols-[5rem_1fr_6rem_5.5rem_6.5rem_6rem_3.5rem] gap-x-3 md:gap-x-4'

// ─── Tipos da visão (a mesma tela serve ao modo demonstração e ao painel real) ─
export type AgendaRow = {
  key: string; id?: string; blockId?: string
  dayLabel?: string; time: string; client: string; style: string; sub?: string
  total: number; signal: number; sigStatus: 'pago' | 'pendente' | 'bloqueado' | 'cancelado' | 'revisar'
  note?: string; blocked: boolean
}
export type Kpi = { label: string; value: string; sub: string; icon: 'money' | 'spark' | 'clock' | 'cal'; positive: boolean | null }
export type PaymentItem = { id: string; client: string; style: string; when: string; signal: number; claimed: boolean }
export type ReminderItem = { id: string; client: string; style: string; when: string; sent: boolean; href?: string }
export type CrmItem = { client: string; style: string; days: number; href: string }
export type Tab = 'hoje' | 'semana' | 'mes'

export type AdminViewProps = {
  onBack: () => void
  demo?: boolean
  kpis: Kpi[]
  rows: Record<Tab, AgendaRow[]>
  payments?: PaymentItem[]
  reminders: ReminderItem[]
  crm: CrmItem[]
  donut: { label: string; value: number; color: string }[]
  donutCenter?: string
  loading?: boolean
  error?: string
  onNew?: () => void
  onBlock?: () => void
  onOpenRow?: (r: AgendaRow) => void
  onRemoveBlock?: (id: string) => void
  onConfirmPay?: (id: string) => void
  onCancelPay?: (id: string) => void
  onRemind?: (id: string) => void
  onRefresh?: () => void
  onLogout?: () => void
}

const SECTIONS_ALL = [
  { id: 'pagamentos', label: 'Pix para conferir' },
  ...SECTIONS,
]

export function AdminView(p: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('hoje')
  const rows = p.rows[activeTab]
  const sections = p.payments ? SECTIONS_ALL : SECTIONS
  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const multiDay = activeTab !== 'hoje'

  return (
    <div className="min-h-screen font-sans text-sm bg-ink text-cream lg:grid lg:grid-cols-[250px_1fr]" style={{ background: 'radial-gradient(70% 40% at 90% 0%, rgba(108,43,217,0.16), transparent 60%), #0c0612' }}>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-white/10 px-6 py-8 bg-plum/60">
        <div style={{ transform: 'scale(0.86)', transformOrigin: 'left center' }}><Logo size="sm" /></div>
        <p className="mt-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/40">Painel administrativo</p>
        <nav aria-label="Seções do painel" className="mt-10 flex flex-col gap-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => goTo(s.id)} className="text-left px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors">
              {s.label}{s.id === 'pagamentos' && p.payments && p.payments.length > 0 && <span className="ml-2 text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200">{p.payments.length}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1">
          {p.onRefresh && <button onClick={p.onRefresh} className="text-left text-sm text-white/60 hover:text-white min-h-11">Atualizar dados</button>}
          {p.onLogout && <button onClick={p.onLogout} className="text-left text-sm text-white/60 hover:text-white min-h-11">Sair</button>}
          <button onClick={p.onBack} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors min-h-11"><ArrowLeft /> Voltar ao site</button>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Topo */}
        <header className="sticky top-0 z-40 glass border-b border-white/10">
          <div className="px-4 sm:px-8 h-16 flex items-center gap-3">
            <button onClick={p.onBack} aria-label="Voltar ao site" className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center text-white/70 hover:text-white"><ArrowLeft /></button>
            <h1 className="h-display text-[1.6rem] text-white mr-auto">Olá, <em className="text-lilac font-medium">Jhenny</em></h1>
            <div className="hidden sm:flex items-center gap-2.5">
              <button className="btn btn-primary btn-sm" onClick={p.onNew} disabled={!p.onNew}><span aria-hidden>+</span> Novo agendamento</button>
              <button className="btn btn-ghost btn-sm" onClick={p.onBlock} disabled={!p.onBlock}>Criar bloqueio</button>
            </div>
            {p.demo && (
              <span className="hidden md:flex items-center gap-2 text-xs px-3 py-2 rounded-full bg-emerald-400/10 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> WhatsApp conectado
              </span>
            )}
            {p.onLogout && <button onClick={p.onLogout} className="lg:hidden text-xs text-white/60 min-h-11 px-2">Sair</button>}
          </div>
          {/* seções (mobile/tablet) */}
          <nav aria-label="Seções do painel" className="lg:hidden no-scrollbar overflow-x-auto flex gap-2 px-4 sm:px-8 pb-3">
            {sections.map(s => (
              <button key={s.id} onClick={() => goTo(s.id)} className="shrink-0 min-h-9 px-4 rounded-full border border-white/15 text-xs text-white/75 hover:bg-white/10">{s.label}</button>
            ))}
          </nav>
        </header>

        <main className="px-4 sm:px-8 py-7 max-w-[88rem]">
          {p.demo && (
            <p className="mb-6 inline-flex items-center gap-2 text-xs text-amber-200/90 bg-amber-400/10 border border-amber-300/20 rounded-full px-3.5 py-2">
              Dados de exemplo — ainda não conectados a um banco de dados.
            </p>
          )}
          {p.error && <p role="alert" className="mb-6 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{p.error}</p>}

          {/* mobile: ações rápidas */}
          <div className="sm:hidden flex gap-2 mb-6">
            <button className="btn btn-primary btn-sm flex-1" onClick={p.onNew} disabled={!p.onNew}>+ Novo agendamento</button>
            <button className="btn btn-ghost btn-sm" onClick={p.onBlock} disabled={!p.onBlock}>Bloqueio</button>
          </div>

          {/* KPIs */}
          <section aria-label="Indicadores" className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {p.kpis.map(k => (
              <div key={k.label} className={`${panel} p-4 sm:p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-9 h-9 rounded-xl bg-violet/15 text-lavender flex items-center justify-center">{KPI_ICON[k.icon]}</span>
                  {k.positive === true && <span className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/12 text-emerald-300" aria-label="em alta">↑</span>}
                </div>
                <p className="h-display text-[2.1rem] sm:text-[2.5rem] leading-none text-white">{k.value}</p>
                <p className="text-xs text-white/60 mt-2">{k.label}</p>
                <p className="text-[0.7rem] mt-1.5" style={{ color: k.positive ? C.green : 'rgba(247,243,251,0.4)' }}>{k.sub}</p>
              </div>
            ))}
          </section>

          {/* Pix para conferir (painel real) */}
          {p.payments && (
            <section id="pagamentos" className={`${panel} p-5 mb-8`} aria-label="Pix para conferir">
              <div className="flex items-center justify-between mb-4">
                <h2 className="h-display text-[1.6rem] text-white">Pix para conferir</h2>
                <span className="text-[0.68rem] px-2.5 py-1 rounded-full bg-amber-400/12 text-amber-300">{p.payments.length} pendente{p.payments.length === 1 ? '' : 's'}</span>
              </div>
              {p.payments.length === 0 ? <p className="text-sm text-white/50">Nenhum pagamento aguardando conferência.</p> : (
                <ul className="divide-y divide-white/[0.07]">
                  {p.payments.map(x => (
                    <li key={x.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{x.client} <span className="text-white/50 font-normal">· {x.style}</span></p>
                        <p className="text-xs mt-0.5 text-white/55">{x.when} · sinal de <strong className="text-lavender">R$ {x.signal}</strong>{x.claimed ? <span className="ml-2 text-violet-200">• cliente avisou que pagou</span> : <span className="ml-2 text-amber-200/80">• ainda não avisou</span>}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => p.onConfirmPay?.(x.id)} className="btn btn-primary btn-sm">Pix recebido</button>
                        <button onClick={() => p.onCancelPay?.(x.id)} className="btn btn-ghost btn-sm">Cancelar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-white/40">Confira o valor no app do Nubank antes de tocar em "Pix recebido".</p>
            </section>
          )}

          <div className="flex flex-col 2xl:flex-row gap-6">
            {/* Agenda */}
            <section id="agenda" className="2xl:flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="h-display text-[1.9rem] text-white">{activeTab === 'hoje' ? 'Agenda do dia' : activeTab === 'semana' ? 'Próximos 7 dias' : 'Próximos 30 dias'}</h2>
                <div role="tablist" aria-label="Período" className="flex gap-1 p-1 rounded-full bg-white/[0.06]">
                  {(['hoje','semana','mes'] as const).map(t => (
                    <button key={t} role="tab" aria-selected={activeTab === t} onClick={() => setActiveTab(t)}
                      className={`text-xs font-medium px-3.5 min-h-9 rounded-full transition-colors ${activeTab === t ? 'bg-violet text-white' : 'text-white/60 hover:text-white'}`}>
                      {t === 'mes' ? 'Mês' : t === 'hoje' ? 'Hoje' : 'Semana'}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${panel} overflow-hidden`}>
                <div className={`${cols} px-4 py-3 text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-white/45 border-b border-white/10`} aria-hidden>
                  <span>Horário</span>
                  <span>Cliente / estilo</span>
                  <span className="hidden md:block">Total</span>
                  <span className="hidden md:block">Sinal</span>
                  <span className="text-right md:text-left">Status</span>
                  <span className="hidden lg:block">Saldo</span>
                  <span className="hidden md:block" />
                </div>

                {p.loading && rows.length === 0 && <p className="px-4 py-8 text-center text-white/50">Carregando…</p>}
                {!p.loading && rows.length === 0 && <p className="px-4 py-10 text-center text-white/50">Nenhum atendimento neste período.</p>}

                {rows.map(a => (
                  <div
                    key={a.key}
                    className={`${cols} px-4 py-3.5 items-center border-b border-white/[0.07] last:border-b-0 transition-colors hover:bg-white/[0.03]`}
                    style={a.blocked ? { background: 'repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(139,92,246,0.07) 5px,rgba(139,92,246,0.07) 10px)' } : undefined}
                  >
                    <span className={`font-mono text-sm font-semibold tabular-nums leading-tight ${a.blocked ? 'text-white/45' : 'text-lavender'}`}>
                      {multiDay && a.dayLabel && <span className="block text-[0.62rem] font-sans font-medium uppercase tracking-wide text-white/45">{a.dayLabel}</span>}
                      {a.time}
                    </span>
                    {a.blocked ? (
                      <span className="col-span-2 md:col-span-5 lg:col-span-6 text-xs italic text-white/50 flex items-center justify-between gap-3">
                        <span>{a.note || 'Bloqueio'} · horário bloqueado{a.sub ? ` · ${a.sub}` : ''}</span>
                        {a.blockId && p.onRemoveBlock && <button onClick={() => p.onRemoveBlock?.(a.blockId!)} className="not-italic shrink-0 text-[0.7rem] px-2.5 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/10">Remover</button>}
                      </span>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{a.client}</p>
                          <p className="text-xs mt-0.5 text-white/55 truncate">{a.style}{a.sub ? ` · ${a.sub}` : ''}<span className="md:hidden"> · R$ {a.total}</span></p>
                        </div>
                        <span className="hidden md:block text-sm font-semibold text-white">R$ {a.total}</span>
                        <span className="hidden md:block text-sm text-lavender">R$ {a.signal}</span>
                        <span className="justify-self-end md:justify-self-start"><SigBadge status={a.sigStatus} /></span>
                        <span className="hidden lg:block text-sm" style={{ color: a.sigStatus === 'pago' ? 'rgba(247,243,251,0.55)' : C.amber }}>
                          {a.sigStatus === 'pago' ? `R$ ${a.total - a.signal}` : '—'}
                        </span>
                        <button onClick={() => p.onOpenRow?.(a)} className="hidden md:block text-[0.7rem] px-2.5 py-1.5 rounded-lg border border-white/15 text-white/70 hover:bg-white/10 transition-colors">Ver</button>
                      </>
                    )}
                    {!a.blocked && <button onClick={() => p.onOpenRow?.(a)} className="md:hidden col-span-3 mt-2 text-xs text-lilac text-left">Ver detalhes</button>}
                  </div>
                ))}
              </div>
            </section>

            {/* Painel lateral */}
            <div className="2xl:w-[22rem] shrink-0 grid gap-6 sm:grid-cols-2 2xl:grid-cols-1 content-start">
              <section id="lembretes" className={`${panel} p-5`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="h-display text-[1.5rem] text-white">Lembretes WhatsApp</h3>
                  <WhatsAppIcon className="w-5 h-5 text-emerald-300" />
                </div>
                {p.reminders.length === 0 && <p className="text-sm text-white/50">Nenhum atendimento confirmado nas próximas 48 horas.</p>}
                <ul className="space-y-4">
                  {p.reminders.map(r => (
                    <li key={r.id} className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.07] last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{r.client}</p>
                        <p className="text-xs mt-0.5 text-white/55 truncate">{r.style} · {r.when}</p>
                      </div>
                      {r.sent ? (
                        <span className="shrink-0 flex items-center gap-1 text-xs text-emerald-300"><CheckIcon className="w-3 h-3" /> Enviado</span>
                      ) : r.href ? (
                        <a href={r.href} target="_blank" rel="noopener noreferrer" onClick={() => p.onRemind?.(r.id)} aria-label={`Enviar lembrete para ${r.client}`} className="shrink-0 inline-flex items-center min-h-9 text-xs font-semibold px-3.5 rounded-full bg-violet/20 text-lavender hover:bg-violet/35 transition-colors">Enviar</a>
                      ) : (
                        <button onClick={() => p.onRemind?.(r.id)} aria-label={`Enviar lembrete para ${r.client}`} className="shrink-0 min-h-9 text-xs font-semibold px-3.5 rounded-full bg-violet/20 text-lavender hover:bg-violet/35 transition-colors">Enviar</button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="clientes" className={`${panel} p-5`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="h-display text-[1.5rem] text-white">Clientes em espera</h3>
                  <span className="text-[0.68rem] px-2.5 py-1 rounded-full bg-amber-400/12 text-amber-300">{p.crm.length} alertas</span>
                </div>
                {p.crm.length === 0 && <p className="text-sm text-white/50">Ninguém com retorno atrasado por enquanto.</p>}
                <ul className="space-y-4">
                  {p.crm.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.07] last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{a.client}</p>
                        <p className="text-xs mt-0.5 text-white/55 truncate">{a.style}</p>
                        <p className="text-xs mt-0.5 font-semibold" style={{ color: a.days > 40 ? C.red : C.amber }}>{a.days} dias sem agendar</p>
                      </div>
                      <a href={a.href} target="_blank" rel="noopener noreferrer" aria-label={`Chamar ${a.client} no WhatsApp`}
                        className="shrink-0 inline-flex items-center min-h-9 text-xs font-semibold px-3.5 rounded-full bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 transition-colors">
                        Chamar
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="estilos" className={`${panel} p-5 sm:col-span-2 2xl:col-span-1`}>
                <h3 className="h-display text-[1.5rem] text-white mb-5">Estilos populares</h3>
                {p.donut.length === 0 ? <p className="text-sm text-white/50">Ainda não há atendimentos para mostrar.</p> : <div className="max-w-xs mx-auto"><DonutChart data={p.donut} size={160} /></div>}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── Demonstração (só no ambiente de desenvolvimento, sem banco) ──────────────
export default function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [reminders, setReminders] = useState(REMINDERS)
  const rows: AgendaRow[] = APPOINTMENTS.map((a, i) => ({
    key: String(i), time: a.time, client: a.client, style: a.style, total: a.total, signal: a.signal,
    sigStatus: a.sigStatus as AgendaRow['sigStatus'], note: (a as { note?: string }).note, blocked: a.blocked,
  }))
  return (
    <AdminView
      demo onBack={onBack} kpis={KPI as Kpi[]} rows={{ hoje: rows, semana: rows, mes: rows }}
      reminders={reminders.map((r, i) => ({ id: String(i), client: r.client, style: r.style, when: r.time, sent: r.sent }))}
      crm={CRM_ALERTS.map(a => ({ client: a.client, style: a.style, days: a.days, href: `https://wa.me/55${a.phone.replace(/\D/g, '')}` }))}
      donut={DONUT_DATA} onRemind={id => setReminders(prev => prev.map((r, i) => String(i) === id ? { ...r, sent: true } : r))}
    />
  )
}
