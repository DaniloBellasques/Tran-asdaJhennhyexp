import { useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from 'react'

export const WHATSAPP_NUMBER = '5511975076649'
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`

export const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// ─── Scroll reveal ─────────────────────────────────────────────────────────────
export function Reveal({
  children, delay = 0, className = '', as: Tag = 'div',
}: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' | 'article' }) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(
      (entries) => { if (entries.some(e => e.isIntersecting)) { setShown(true); io.disconnect() } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const T = Tag as any
  return (
    <T ref={ref} className={`reveal ${shown ? 'is-in' : ''} ${className}`} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </T>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
type IconProps = { className?: string }
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true } as const

export const ArrowRight = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const ArrowLeft = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
export const ArrowUpRight = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M7 17L17 7M8 7h9v9" /></svg>
export const CheckIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2.6}><path d="M5 13l4 4L19 7" /></svg>
export const ClockIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
export const CloseIcon = ({ className = 'w-5 h-5' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
export const MenuIcon = ({ className = 'w-5 h-5' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
export const ChevronDown = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M6 9l6 6 6-6" /></svg>
export const ChevronLeft = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M15 6l-6 6 6 6" /></svg>
export const ChevronRight = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base} strokeWidth={2}><path d="M9 6l6 6-6 6" /></svg>
export const PinIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base}><path d="M12 21s7-5.8 7-11a7 7 0 10-14 0c0 5.2 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
export const CalendarIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
export const LockIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base}><rect x="5" y="11" width="14" height="9.5" rx="2.5" /><path d="M8 11V8a4 4 0 118 0v3" /></svg>
export const CopyIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} {...base}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6.5A2.5 2.5 0 017.5 4H15" /></svg>
export const PlayIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M8 5v14l11-7z" /></svg>
export const PauseIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
export const StarIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.3a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.8l-2.8 2.04a1 1 0 00-.37 1.12l1.07 3.3c.3.92-.76 1.69-1.54 1.12l-2.8-2.04a1 1 0 00-1.17 0l-2.8 2.04c-.79.57-1.84-.2-1.54-1.12l1.07-3.3a1 1 0 00-.37-1.12L2.98 8.72c-.78-.57-.38-1.8.59-1.8h3.46a1 1 0 00.95-.69l1.07-3.3z" /></svg>
export const SparkIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
export const InstagramIcon = ({ className = 'w-5 h-5' }: IconProps) => <svg className={className} {...base}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="3.9" /><circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" /></svg>
export const TikTokIcon = ({ className = 'w-4 h-4' }: IconProps) => <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.73a8.27 8.27 0 004.84 1.55V6.83a4.84 4.84 0 01-1.07-.14z" /></svg>
export const WhatsAppIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.89.53 3.66 1.44 5.17L2 22l4.91-1.43A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18a7.96 7.96 0 01-4.07-1.12l-.29-.17-3.03.88.86-3.13-.19-.31A7.96 7.96 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8z" />
  </svg>
)

// ─── Brand wordmark ────────────────────────────────────────────────────────────
export function Logo({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'text-[1.2rem] sm:text-[1.7rem]' : size === 'sm' ? 'text-[0.95rem] sm:text-[1.05rem]' : 'text-[1.05rem] sm:text-[1.3rem]'
  return (
    <span className={`font-display leading-none text-white whitespace-nowrap uppercase tracking-[0.18em] ${s} ${className}`}>
      <span className="font-semibold">Tranças</span>{' '}
      <span className="font-light text-lavender">da Jhenny</span>
    </span>
  )
}

// ─── Floating WhatsApp button ──────────────────────────────────────────────────
export function WhatsAppFloat({ className = '', raised = false }: { className?: string; raised?: boolean }) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Jhenny no WhatsApp"
      className={`fixed right-4 sm:right-6 z-40 w-14 h-14 rounded-full items-center justify-center text-white transition-transform hover:scale-110 active:scale-95 ${className}`}
      style={{
        bottom: raised ? 96 : 24,
        background: 'linear-gradient(135deg,#2fe57a,#1fb85a)',
        animation: 'pulseRing 2.8s ease-out infinite',
      }}
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  )
}

// ─── Stepper (jornada de agendamento) ──────────────────────────────────────────
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const pct = Math.round(((current - 1) / Math.max(1, steps.length - 1)) * 100)
  return (
    <nav aria-label="Progresso do agendamento">
      {/* mobile: barra compacta */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="font-semibold tracking-[0.18em] uppercase text-lilac">Passo {current} de {steps.length}</span>
          <span className="text-white/60">{steps[current - 1]}</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={current}>
          <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(8, pct)}%`, background: 'linear-gradient(90deg,#8b5cf6,#dcc8f5)' }} />
        </div>
      </div>

      {/* desktop: etapas */}
      <ol className="hidden sm:flex items-center">
        {steps.map((label, i) => {
          const n = i + 1
          const done = n < current
          const active = n === current
          return (
            <li key={label} className="flex items-center flex-1 last:flex-none" aria-current={active ? 'step' : undefined}>
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 border ${
                    done ? 'bg-violet border-violet text-white' : active ? 'border-lilac text-white bg-brand/40 shadow-[0_0_0_4px_rgba(139,92,246,0.18)]' : 'border-white/15 text-white/40'
                  }`}
                >
                  {done ? <CheckIcon className="w-3.5 h-3.5" /> : n}
                </span>
                <span className={`text-[0.8rem] font-medium whitespace-nowrap transition-colors ${active ? 'text-white' : done ? 'text-lavender' : 'text-white/40'}`}>{label}</span>
              </div>
              {i < steps.length - 1 && <span className="flex-1 h-px mx-3 min-w-4 transition-colors duration-300" style={{ background: done ? '#8b5cf6' : 'rgba(255,255,255,0.12)' }} />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── Seletor de dias ───────────────────────────────────────────────────────────
export function DayScroller({
  days, selected, onSelect,
}: {
  days: { date: Date; available: boolean }[]
  selected: Date | null
  onSelect: (d: Date) => void
}) {
  const scroller = useRef<HTMLDivElement | null>(null)
  const nudge = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * 260, behavior: 'smooth' })
  const month = (selected ?? days[0]?.date)
  const monthLabel = month ? ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][month.getMonth()] + ' ' + month.getFullYear() : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-white/80 capitalize">{monthLabel}</p>
        <div className="hidden sm:flex gap-2">
          <button type="button" onClick={() => nudge(-1)} aria-label="Dias anteriores" className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-lilac transition-colors"><ChevronLeft /></button>
          <button type="button" onClick={() => nudge(1)} aria-label="Próximos dias" className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-lilac transition-colors"><ChevronRight /></button>
        </div>
      </div>
      <div ref={scroller} className="no-scrollbar overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 snap-x" role="listbox" aria-label="Escolha o dia">
        <div className="flex gap-2.5 min-w-max">
          {days.map(({ date, available }) => {
            const isSel = selected?.toDateString() === date.toDateString()
            return (
              <button
                key={date.toISOString()}
                type="button"
                role="option"
                aria-selected={isSel}
                onClick={() => available && onSelect(date)}
                disabled={!available}
                aria-label={`${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} de ${MONTHS_SHORT[date.getMonth()]}${available ? '' : ' — fechado'}`}
                className={`snap-start flex flex-col items-center justify-center w-[62px] h-[86px] rounded-2xl border transition-all duration-200 ${
                  isSel
                    ? 'bg-gradient-to-b from-violet to-brand border-transparent text-white shadow-[0_12px_26px_-10px_rgba(139,92,246,0.9)] -translate-y-0.5'
                    : available
                      ? 'bg-white/[0.04] border-white/12 text-white hover:border-lilac hover:bg-white/[0.08]'
                      : 'bg-transparent border-white/6 text-white/25 cursor-not-allowed'
                }`}
              >
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] opacity-70">{WEEKDAYS_SHORT[date.getDay()]}</span>
                <span className="font-display text-[1.6rem] font-semibold leading-none my-1">{date.getDate()}</span>
                <span className="text-[0.62rem] opacity-60">{available ? MONTHS_SHORT[date.getMonth()] : 'fechado'}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Grade de horários ─────────────────────────────────────────────────────────
export function SlotGrid({
  slots, occupied, selected, onSelect,
}: {
  slots: string[]
  occupied: Set<string>
  selected: string | null
  onSelect: (t: string) => void
}) {
  const morning = slots.filter(s => parseInt(s) < 12)
  const afternoon = slots.filter(s => parseInt(s) >= 12)
  // função (e não componente) para não remontar os botões a cada render e perder o foco do teclado
  const renderGroup = (title: string, list: string[]) => list.length === 0 ? null : (
    <div key={title}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/45 mb-3">{title}</p>
      <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-6 gap-2.5" role="group" aria-label={title}>
        {list.map(slot => {
          const occ = occupied.has(slot)
          const sel = selected === slot
          return (
            <button
              key={slot}
              type="button"
              disabled={occ}
              aria-pressed={sel}
              aria-label={occ ? `${slot} — indisponível` : `${slot} — disponível`}
              onClick={() => !occ && onSelect(slot)}
              className={`h-12 rounded-xl text-sm font-medium tabular-nums border transition-all duration-200 ${
                sel
                  ? 'bg-gradient-to-b from-violet to-brand border-transparent text-white shadow-[0_10px_22px_-10px_rgba(139,92,246,0.95)] scale-[1.03]'
                  : occ
                    ? 'bg-white/[0.02] border-white/5 text-white/25 line-through decoration-white/25 cursor-not-allowed'
                    : 'bg-white/[0.05] border-white/14 text-white hover:border-lilac hover:bg-white/[0.1]'
              }`}
            >
              {slot}
            </button>
          )
        })}
      </div>
    </div>
  )
  return (
    <div className="space-y-6">
      {renderGroup('Manhã', morning)}
      {renderGroup('Tarde', afternoon)}
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] text-white/50" aria-label="Legenda">
        <li className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-white/[0.07] border border-white/20" /> Disponível</li>
        <li className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-gradient-to-b from-violet to-brand" /> Selecionado</li>
        <li className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded bg-white/[0.02] border border-white/8" /> Indisponível</li>
      </ul>
    </div>
  )
}

// ─── Campos de formulário ──────────────────────────────────────────────────────
export function Field({
  label, required = false, error, hint, multiline = false, value, onChange, onBlur, type = 'text', placeholder, autoComplete, inputMode,
}: {
  label: string; required?: boolean; error?: string; hint?: string; multiline?: boolean
  value: string; onChange: (v: string) => void; onBlur?: () => void
  type?: string; placeholder?: string; autoComplete?: string; inputMode?: 'text' | 'tel' | 'email' | 'numeric'
}) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  const cls = `w-full px-4 rounded-xl border bg-white/[0.05] text-[0.95rem] text-white placeholder:text-white/30 transition-colors focus:outline-none focus:border-lilac focus:bg-white/[0.08] focus:ring-4 focus:ring-violet/20 ${error ? 'border-red-400/70' : 'border-white/14'}`
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium text-white mb-2">
        <span>{label}{required && <span className="text-lilac ml-1" aria-hidden>*</span>}</span>
        {!required && <span className="text-xs font-normal text-white/40">opcional</span>}
      </label>
      {multiline ? (
        <textarea
          id={id} rows={3} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)} onBlur={onBlur}
          aria-invalid={!!error} aria-describedby={describedBy}
          className={`${cls} py-3 resize-none`}
        />
      ) : (
        <input
          id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete} inputMode={inputMode}
          required={required} aria-required={required} aria-invalid={!!error} aria-describedby={describedBy}
          onChange={e => onChange(e.target.value)} onBlur={onBlur}
          className={`${cls} h-[3.1rem]`}
        />
      )}
      {error ? <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-red-300">{error}</p>
        : hint ? <p id={`${id}-hint`} className="mt-1.5 text-xs text-white/40">{hint}</p> : null}
    </div>
  )
}

// ─── Barra superior das telas de agendamento ───────────────────────────────────
export function FlowHeader({ onBack, backLabel = 'Voltar', right }: { onBack: () => void; backLabel?: string; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
        <button type="button" onClick={onBack} className="justify-self-start inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors min-h-11 pr-3">
          <ArrowLeft /> <span className="hidden min-[380px]:inline">{backLabel}</span>
        </button>
        <Logo size="sm" />
        <div className="justify-self-end text-xs text-white/50">{right}</div>
      </div>
    </header>
  )
}
