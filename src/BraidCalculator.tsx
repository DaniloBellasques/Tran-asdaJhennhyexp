import { useState, useEffect, useMemo, useCallback } from 'react'
import p05 from './assets/portfolio-05-box-braids.jpg'
import p06 from './assets/portfolio-06-trancas-soltas.jpg'
import p09 from './assets/portfolio-09-gipsy-braids.jpg'
import p04 from './assets/portfolio-04-nago-desenhada.jpg'
import { TERMS_VERSION } from './legalConfig'
import { isLive, directPix, PIX_CONF, fetchBusy, createBooking, bookingStatus, claimPaid, ymd, ApiError, type BookingResult } from './api'
import { qrPath } from './qr'
import { workSegments, workEnd, slotMs } from './schedule'
import { pixPayload } from './pix'
import { Stepper, FlowHeader, DayScroller, SlotGrid, Field, WHATSAPP_NUMBER, CheckIcon, CalendarIcon, ClockIcon, LockIcon, CopyIcon, WhatsAppIcon, ArrowRight } from './ui'

// ─── Data (inalterado) ────────────────────────────────────────────────────────
export const STYLES = [
  { id: 'box',     name: 'Box Braids',     img: p05, basePrice: 200, baseTime: 240, desc: 'Clássica e versátil' },
  { id: 'goddess', name: 'Goddess Braids', img: p06, basePrice: 250, baseTime: 300, desc: 'Ondas expostas e volume' },
  { id: 'gypsy',   name: 'Gypsy Braids',  img: p09, basePrice: 280, baseTime: 330, desc: 'Boêmio e fluido' },
  { id: 'nago',    name: 'Nagô',           img: p04, basePrice: 180, baseTime: 150, desc: 'Geométrica e precisa' },
]

export const LENGTHS = [
  { id: 'ombro',   name: 'Ombro',   priceMult: 1.0, timeMult: 1.0, heightPct: 25, desc: 'Prática e estilosa' },
  { id: 'costas',  name: 'Costas',  priceMult: 1.2, timeMult: 1.3, heightPct: 45, desc: 'Clássica e elegante' },
  { id: 'cintura', name: 'Cintura', priceMult: 1.4, timeMult: 1.6, heightPct: 65, desc: 'Impactante e feminina' },
  { id: 'bumbum',  name: 'Bumbum',  priceMult: 1.65, timeMult: 1.9, heightPct: 90, desc: 'Longa e majestosa' },
]

export const THICKNESSES = [
  { id: 'grossa', name: 'Grossa',  priceMult: 0.85, timeMult: 0.75 },
  { id: 'media',  name: 'Média',   priceMult: 1.0,  timeMult: 1.0 },
  { id: 'fina',   name: 'Fina',    priceMult: 1.2,  timeMult: 1.3 },
  { id: 'micro',  name: 'Micro',   priceMult: 1.55, timeMult: 1.8 },
]

export const VOLUMES = [
  { id: 'pouco',    name: 'Pouco',    priceAdd: 0,  desc: 'Cabelo fino ou liso' },
  { id: 'medio',    name: 'Médio',    priceAdd: 30, desc: 'Volume normal' },
  { id: 'volumoso', name: 'Volumoso', priceAdd: 60, desc: 'Muito volumoso' },
]

export const ADDONS = [
  { id: 'touca',  name: 'Touca de Cetim',    price: 25, desc: 'Protege as tranças ao dormir' },
  { id: 'mousse', name: 'Mousse Finalizador', price: 35, desc: 'Brilho e definição extra' },
]

const WEEKDAYS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_FL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const STEP_LABELS = ['Estilo', 'Comprimento', 'Detalhes', 'Extras', 'Horário', 'Seus dados', 'Pagamento']

// ─── Helpers (lógica inalterada) ──────────────────────────────────────────────
type StyleItem = typeof STYLES[0]
type LengthItem = typeof LENGTHS[0]
type ThicknessItem = typeof THICKNESSES[0]
type VolumeItem = typeof VOLUMES[0]
type AddonItem = typeof ADDONS[0]
type View = 'step1'|'step2'|'step3'|'step4'|'datetime'|'client'|'pix'|'success'
type Client = { name: string; phone: string; email: string; notes: string }

export function calcPrice(s: StyleItem|null, l: LengthItem|null, t: ThicknessItem|null, v: VolumeItem|null, own: boolean, addons: AddonItem[]) {
  if (!s || !l || !t || !v) return 0
  let p = s.basePrice * l.priceMult * t.priceMult + v.priceAdd
  if (!own) p += 60
  addons.forEach(a => { p += a.price })
  return Math.round(p)
}

export function calcTime(s: StyleItem|null, l: LengthItem|null, t: ThicknessItem|null) {
  if (!s || !l || !t) return 0
  return Math.round(s.baseTime * l.timeMult * t.timeMult)
}

export function fmtMin(m: number) {
  const h = Math.floor(m / 60), mn = m % 60
  return mn > 0 ? `${h}h ${String(mn).padStart(2,'0')}min` : `${h}h`
}

export function fmtDate(d: Date) {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS_FL[d.getMonth()]}`
}

export function genDays(n = 28) {
  const out: { date: Date; avail: boolean }[] = []
  const today = new Date()
  for (let i = 1; i <= n; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i)
    out.push({ date: d, avail: d.getDay() !== 0 })
  }
  return out
}

export const ALL_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30']

const PIX_KEY = 'jhenny.trancas@pix.br'

// ─── Agenda: o atendimento ocupa todo o tempo que dura ────────────────────────
export type Busy = { start: number; end: number }
const RESERVAS_KEY = 'trancas-jhenny:reservas-demo'

function loadLocalReservas(): Busy[] {
  try { const a = JSON.parse(localStorage.getItem(RESERVAS_KEY) || '[]'); return Array.isArray(a) ? a.filter((x: Busy) => x.end > Date.now()) : [] } catch { return [] }
}
function saveLocalReserva(b: Busy) {
  try { localStorage.setItem(RESERVAS_KEY, JSON.stringify([...loadLocalReservas(), b])) } catch { /* sem armazenamento */ }
}
// demonstração (sem banco): só as reservas feitas neste navegador ocupam a agenda (sem horários inventados)
function demoBusy(): Busy[] {
  return loadLocalReservas()
}
/** O horário está livre se o atendimento inteiro (com a duração real) não bate em nada ocupado. */
export function slotFree(day: Date, slot: string, minutes: number, busy: Busy[]) {
  const st = slotMs(ymd(day), slot)
  if (day.getDay() === 0 || st < Date.now() + 3600e3) return false
  const en = workEnd(st, minutes)
  return !busy.some(b => b.start < en && b.end > st)
}
export const fmtDay = (ms: number) => { const d = new Date(ms - 3 * 3600e3); return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} de ${MONTHS_FL[d.getUTCMonth()]}` }
export const fmtHour = (ms: number) => { const d = new Date(ms - 3 * 3600e3); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` }

// ─── Dados da cliente: máscara, rascunho local e calendário (.ics) ────────────
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}
const DRAFT_KEY = 'trancas-jhenny:cliente'
function loadClient(): Client {
  try {
    const raw = localStorage.getItem(DRAFT_KEY) // só existe se a cliente marcou "lembrar meus dados"

    if (raw) { const o = JSON.parse(raw); return { name: o.name ?? '', phone: o.phone ?? '', email: o.email ?? '', notes: '' } }
  } catch { /* sem armazenamento: segue em branco */ }
  return { name: '', phone: '', email: '', notes: '' }
}
function saveClient(c: Client, remember: boolean) {
  try {
    if (remember) localStorage.setItem(DRAFT_KEY, JSON.stringify({ name: c.name, phone: c.phone, email: c.email }))
    else localStorage.removeItem(DRAFT_KEY)
  } catch { /* ignora */ }
}
const hasSaved = () => { try { return !!localStorage.getItem(DRAFT_KEY) } catch { return false } }
function clientErrors(c: Client) {
  const e: Partial<Record<keyof Client, string>> = {}
  if (c.name.trim().length < 2) e.name = 'Informe seu nome.'
  const digits = c.phone.replace(/\D/g, '')
  if (digits.length < 10) e.phone = 'Informe um WhatsApp com DDD.'
  if (c.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = 'E-mail inválido.'
  return e
}

function downloadIcs(style: StyleItem, day: Date, time: string, minutes: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const f = (ms: number) => { const d = new Date(ms - 3 * 3600e3); return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00` }
  const segs = workSegments(slotMs(ymd(day), time), minutes)
  const events = segs.flatMap(([a, b], i) => [
    'BEGIN:VEVENT', `UID:${f(a)}-${i}-trancas-jhenny@local`, `DTSTAMP:${f(Date.now())}`,
    `DTSTART;TZID=America/Sao_Paulo:${f(a)}`, `DTEND;TZID=America/Sao_Paulo:${f(b)}`,
    `SUMMARY:${style.name} — Tranças da Jhenny${segs.length > 1 ? ` (dia ${i + 1}/${segs.length})` : ''}`,
    'DESCRIPTION:Agendamento no studio. Sinal via PIX; saldo no dia.',
    'BEGIN:VALARM', 'TRIGGER:-PT24H', 'ACTION:DISPLAY', 'DESCRIPTION:Amanhã: seu horário na Tranças da Jhenny', 'END:VALARM',
    'END:VEVENT',
  ])
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tranças da Jhenny//PT-BR', ...events, 'END:VCALENDAR'].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = 'agendamento-trancas-da-jhenny.ics'
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── QR Code real do Pix (gerado no navegador) ─────────────────────────────────
function PixQr({ value }: { value: string }) {
  const { d, size } = useMemo(() => qrPath(value), [value])
  return (
    <div className="p-3 rounded-2xl bg-white inline-block shadow-[0_24px_50px_-20px_rgba(139,92,246,0.7)]">
      <svg viewBox={`0 0 ${size} ${size}`} width={192} height={192} role="img" aria-label="QR Code do PIX" shapeRendering="crispEdges">
        <rect width={size} height={size} fill="#fff" /><path d={d} fill="#0c0612" />
      </svg>
    </div>
  )
}

// ─── QR Code (placeholder visual — inalterado) ────────────────────────────────
function QRCode() {
  const cells = useMemo(() => {
    const n = 21
    const result: boolean[] = []
    const inFinder = (r: number, c: number, or: number, oc: number) => {
      const rr = r - or, cc = c - oc
      if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return false
      return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4)
    }
    for (let i = 0; i < n * n; i++) {
      const r = Math.floor(i / n), c = i % n
      if (inFinder(r,c,0,0) || inFinder(r,c,0,14) || inFinder(r,c,14,0)) { result.push(true); continue }
      if ((r === 6 && c > 7 && c < 13) || (c === 6 && r > 7 && r < 13)) { result.push((r+c)%2===0); continue }
      result.push(((i * 6364136223846793005 + 1442695040888963407) ^ (i * 2654435761)) % 3 === 0)
    }
    return result
  }, [])

  return (
    <div className="p-3.5 rounded-2xl bg-white inline-block shadow-[0_24px_50px_-20px_rgba(139,92,246,0.7)]" role="img" aria-label="QR Code do PIX">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(21, 1fr)', gap: '1px', width: 168, height: 168 }}>
        {cells.map((filled, i) => (
          <div key={i} style={{ background: filled ? '#0c0612' : 'white' }} />
        ))}
      </div>
    </div>
  )
}

// ─── Barra de resumo fixa ─────────────────────────────────────────────────────
function SummaryBar({ style, length, thickness, volume, ownMaterial, addons, canContinue, onContinue, view }:
  { style: StyleItem|null; length: LengthItem|null; thickness: ThicknessItem|null; volume: VolumeItem|null; ownMaterial: boolean; addons: AddonItem[]; canContinue: boolean; onContinue: () => void; view: View }) {
  const price = calcPrice(style, length, thickness, volume, ownMaterial, addons)
  const time  = calcTime(style, length, thickness)
  const signal = Math.round(price * 0.3)

  if (!style) return null

  const labels: Record<View, string> = {
    step1: 'Próximo: Comprimento', step2: 'Próximo: Espessura & Volume',
    step3: 'Próximo: Material & Extras', step4: 'Continuar para Data e Horário',
    datetime: 'Confirmar Horário', client: 'Ir para o pagamento', pix: 'Já paguei', success: ''
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 glass border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <dl className="flex gap-5 sm:gap-8 min-w-0">
          {time > 0 && (
            <div className="hidden min-[400px]:block">
              <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-white/50">Tempo</dt>
              <dd className="text-sm font-semibold text-white mt-0.5">{fmtMin(time)}</dd>
            </div>
          )}
          {price > 0 ? (
            <>
              <div>
                <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-white/50">Valor total</dt>
                <dd className="h-display text-[1.6rem] leading-none text-lavender mt-0.5">R$ {price}</dd>
              </div>
              <div className="hidden sm:block">
                <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-white/50">Sinal (30%)</dt>
                <dd className="text-sm font-semibold text-white mt-1.5">R$ {signal}</dd>
              </div>
            </>
          ) : (
            <div>
              <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-white/50">Seu estilo</dt>
              <dd className="text-sm font-semibold text-white mt-0.5">{style.name}</dd>
            </div>
          )}
        </dl>
        {view !== 'success' && (
          <button onClick={onContinue} disabled={!canContinue} className="btn btn-primary btn-sm !min-h-12 shrink-0 !px-5 sm:!px-7 !tracking-[0.1em]">
            <span className="max-w-[9.5rem] sm:max-w-none truncate">{labels[view] ?? 'Continuar'}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Estrutura de cada passo ──────────────────────────────────────────────────
function StepShell({ eyebrow, title, subtitle, children, narrow = false }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto px-4 sm:px-8 pt-8 pb-36 anim-fade-up ${narrow ? 'max-w-lg' : 'max-w-4xl'}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h-display mt-4 text-[clamp(2.2rem,6vw,3.2rem)] text-white">{title}</h2>
      <p className="mt-3 mb-9 text-white/60 text-[0.98rem]">{subtitle}</p>
      {children}
    </div>
  )
}

const optBase = 'text-left rounded-2xl border transition-all duration-300 active:scale-[0.985]'
const optOn  = 'border-violet bg-violet/12 shadow-[0_0_0_1px_#8b5cf6,0_18px_40px_-20px_rgba(139,92,246,0.8)]'
const optOff = 'border-white/12 bg-white/[0.03] hover:border-lilac/60 hover:bg-white/[0.06]'

function Radio({ on, square = false }: { on: boolean; square?: boolean }) {
  return (
    <span aria-hidden className={`w-5 h-5 shrink-0 mt-0.5 border-[1.5px] flex items-center justify-center transition-all ${square ? 'rounded-md' : 'rounded-full'} ${on ? 'bg-violet border-violet text-white' : 'border-white/30'}`}>
      {on && <CheckIcon className="w-3 h-3" />}
    </span>
  )
}

// ─── Passo 1: Estilo ──────────────────────────────────────────────────────────
function Step1({ selected, onSelect }: { selected: StyleItem|null; onSelect: (s: StyleItem) => void }) {
  return (
    <StepShell eyebrow="Passo 1 de 4" title="Qual estilo você quer?" subtitle="Escolha o tipo de trança para simular o preço.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" role="radiogroup" aria-label="Estilo de trança">
        {STYLES.map(s => {
          const sel = selected?.id === s.id
          return (
            <button key={s.id} role="radio" aria-checked={sel} onClick={() => onSelect(s)}
              className={`${optBase} group overflow-hidden ${sel ? optOn : optOff}`}>
              <span className="relative block aspect-[3/4] bg-card overflow-hidden">
                <img src={s.img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                {sel && <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-violet text-white flex items-center justify-center shadow-lg"><CheckIcon className="w-3.5 h-3.5" /></span>}
              </span>
              <span className="block p-3.5 sm:p-4">
                <span className="block h-display text-[1.45rem] leading-none text-white">{s.name}</span>
                <span className="block text-xs mt-1.5 text-white/55">{s.desc}</span>
                <span className="block text-xs font-semibold mt-3 text-lavender">A partir de R$ {s.basePrice}</span>
              </span>
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}

// ─── Passo 2: Comprimento ─────────────────────────────────────────────────────
function Step2({ selected, onSelect }: { selected: LengthItem|null; onSelect: (l: LengthItem) => void }) {
  return (
    <StepShell eyebrow="Passo 2 de 4" title="Qual comprimento?" subtitle="O comprimento influencia no tempo e no valor final.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" role="radiogroup" aria-label="Comprimento">
        {LENGTHS.map(l => {
          const sel = selected?.id === l.id
          return (
            <button key={l.id} role="radio" aria-checked={sel} onClick={() => onSelect(l)} className={`${optBase} overflow-hidden ${sel ? optOn : optOff}`}>
              <span aria-hidden className="relative flex items-end justify-center h-32 px-3 pb-4 bg-gradient-to-b from-white/[0.02] to-violet/10">
                <span className="flex flex-col items-center gap-0.5 opacity-60">
                  <span className="w-5 h-5 rounded-full border-2 border-white/40" />
                  <span className="w-px h-4 bg-white/40" />
                  <span className="w-8 h-1.5 rounded bg-white/40" />
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 w-2 rounded-b-full transition-all duration-500" style={{ height: `${l.heightPct * 0.9}px`, bottom: 16, background: 'linear-gradient(to bottom, #8b5cf6, #dcc8f5)', opacity: sel ? 1 : 0.75 }} />
              </span>
              <span className="block p-4">
                <span className="block h-display text-[1.45rem] leading-none text-white">{l.name}</span>
                <span className="block text-xs mt-1.5 text-white/55">{l.desc}</span>
              </span>
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}

// ─── Passo 3: Espessura e volume ──────────────────────────────────────────────
function Step3({ thickness, volume, onThickness, onVolume }:
  { thickness: ThicknessItem|null; volume: VolumeItem|null; onThickness: (t: ThicknessItem) => void; onVolume: (v: VolumeItem) => void }) {
  return (
    <StepShell eyebrow="Passo 3 de 4" title="Espessura & volume" subtitle="Isso define o nível de detalhamento das tranças.">
      <fieldset className="mb-10">
        <legend className="text-sm font-semibold text-white mb-4">Espessura da trança</legend>
        <div className="flex gap-2.5 flex-wrap" role="radiogroup" aria-label="Espessura">
          {THICKNESSES.map(t => {
            const sel = thickness?.id === t.id
            return (
              <button key={t.id} role="radio" aria-checked={sel} onClick={() => onThickness(t)}
                className={`min-h-12 px-6 rounded-full text-sm font-medium border transition-all duration-300 active:scale-95 ${sel ? 'bg-gradient-to-b from-violet to-brand border-transparent text-white shadow-[0_12px_26px_-10px_rgba(139,92,246,0.9)]' : 'border-white/20 text-white/75 hover:border-lilac hover:text-white'}`}>
                {t.name}
              </button>
            )
          })}
        </div>
        <p className="text-xs mt-4 text-white/50">Tranças finas = mais tempo + mais detalhadas. Grossas = acabamento mais rápido.</p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-white mb-4">Volume do cabelo natural</legend>
        <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Volume">
          {VOLUMES.map(v => {
            const sel = volume?.id === v.id
            return (
              <button key={v.id} role="radio" aria-checked={sel} onClick={() => onVolume(v)} className={`${optBase} p-5 ${sel ? optOn : optOff}`}>
                <span className="flex items-center justify-between mb-1.5">
                  <span className="h-display text-[1.45rem] leading-none text-white">{v.name}</span>
                  {v.priceAdd > 0 && <span className="text-xs font-semibold text-lavender">+R$ {v.priceAdd}</span>}
                </span>
                <span className="block text-xs text-white/55">{v.desc}</span>
              </button>
            )
          })}
        </div>
      </fieldset>
    </StepShell>
  )
}

// ─── Passo 4: Material e extras ───────────────────────────────────────────────
function Step4({ ownMaterial, setOwnMaterial, addons, toggleAddon }:
  { ownMaterial: boolean; setOwnMaterial: (v: boolean) => void; addons: AddonItem[]; toggleAddon: (a: AddonItem) => void }) {
  return (
    <StepShell eyebrow="Passo 4 de 4" title="Material & extras" subtitle="Você vai trazer o cabelo ou comprar no estúdio?">
      <fieldset className="mb-10">
        <legend className="text-sm font-semibold text-white mb-4">Material (cabelo sintético)</legend>
        <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Material">
          {[
            { own: true,  label: 'Vou trazer meu material', sub: 'Você escolhe e traz o Jumbo', extra: 'Incluso' },
            { own: false, label: 'Comprar Jumbo no estúdio', sub: 'Jumbo de qualidade + R$ 60', extra: '+R$ 60' },
          ].map(opt => {
            const sel = ownMaterial === opt.own
            return (
              <button key={String(opt.own)} role="radio" aria-checked={sel} onClick={() => setOwnMaterial(opt.own)} className={`${optBase} p-5 ${sel ? optOn : optOff}`}>
                <span className="flex items-start gap-3.5">
                  <Radio on={sel} />
                  <span className="flex-1">
                    <span className="block font-semibold text-sm text-white">{opt.label}</span>
                    <span className="block text-xs mt-1 text-white/55">{opt.sub}</span>
                  </span>
                  <span className={`text-xs font-semibold shrink-0 ${sel ? 'text-lavender' : 'text-white/50'}`}>{opt.extra}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-white mb-4">Produtos pós-trança <span className="font-normal text-xs text-white/45">(opcional)</span></legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {ADDONS.map(a => {
            const checked = addons.some(x => x.id === a.id)
            return (
              <button key={a.id} role="checkbox" aria-checked={checked} onClick={() => toggleAddon(a)} className={`${optBase} p-5 ${checked ? optOn : optOff}`}>
                <span className="flex items-start gap-3.5">
                  <Radio on={checked} square />
                  <span className="flex-1">
                    <span className="block font-semibold text-sm text-white">{a.name}</span>
                    <span className="block text-xs mt-1 text-white/55">{a.desc}</span>
                  </span>
                  <span className="text-xs font-semibold shrink-0 text-lavender">+R$ {a.price}</span>
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>
    </StepShell>
  )
}

// ─── Data e horário ───────────────────────────────────────────────────────────
function DateTimeStep({ day, onDay, time, onTime, minutes, notice }:
  { day: Date|null; onDay: (d: Date) => void; time: string|null; onTime: (t: string) => void; minutes: number; notice?: string }) {
  const [busy, setBusy] = useState<Busy[] | null>(() => isLive ? null : demoBusy())
  const [busyErr, setBusyErr] = useState('')
  useEffect(() => {
    if (!isLive) return
    const from = new Date(); const to = new Date(Date.now() + 60 * 86400e3)
    fetchBusy(from, to).then(setBusy).catch(e => setBusyErr(e instanceof Error ? e.message : 'Erro ao carregar horários.'))
  }, [])
  const dur = Math.max(minutes, 30)
  const days = useMemo(() => genDays(28).map(({ date, avail }) => ({
    date, available: avail && (busy === null || ALL_SLOTS.some(t => slotFree(date, t, dur, busy))),
  })), [busy, dur])
  const occupied = useMemo(() => {
    const set = new Set<string>()
    if (!day) return set
    ALL_SLOTS.forEach(t => { if (!slotFree(day, t, dur, busy ?? [])) set.add(t) })
    return set
  }, [day, busy, dur])
  const segs = day && time ? workSegments(slotMs(ymd(day), time), dur) : []

  return (
    <StepShell eyebrow="Quase lá!" title="Escolha data e horário" subtitle="Domingos não disponíveis.">
      {notice && <p role="alert" className="mb-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{notice}</p>}
      {busyErr && <p role="alert" className="mb-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{busyErr}</p>}
      <DayScroller days={days} selected={day} onSelect={onDay} />

      <div className="mt-9">
        {day ? (
          <div className="anim-fade-up" key={day.toDateString()}>
            <p className="flex items-center gap-2.5 text-sm font-semibold text-white mb-6"><CalendarIcon className="w-4 h-4 text-lilac" /> {fmtDate(day)}</p>
            <SlotGrid slots={ALL_SLOTS} occupied={occupied} selected={time} onSelect={onTime} />
            {occupied.size === ALL_SLOTS.length && <p className="mt-5 text-sm text-white/55">Sem horários neste dia para a duração do seu serviço. Escolha outro dia.</p>}
            {segs.length > 0 && (
              <div className="mt-7 rounded-2xl border border-violet/40 bg-violet/10 p-5 anim-fade-up" role="status">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-lavender">Seu atendimento</p>
                <p className="mt-2 text-sm text-white/85">Começa <strong className="text-white">{fmtDay(segs[0][0])}, {fmtHour(segs[0][0])}</strong> e termina <strong className="text-white">{fmtDay(segs[segs.length - 1][1])}, {fmtHour(segs[segs.length - 1][1])}</strong>.</p>
                <p className="mt-1 text-xs text-white/55">Duração estimada: {fmtMin(dur)}{segs.length > 1 ? ` · em ${segs.length} dias de atendimento` : ''}. Todo esse tempo fica reservado para você na agenda.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-white/20 text-center">
            <CalendarIcon className="w-8 h-8 mb-3 text-white/30" />
            <p className="text-sm text-white/55">Selecione um dia para ver os horários</p>
          </div>
        )}
      </div>
    </StepShell>
  )
}


// ─── Dados da cliente ─────────────────────────────────────────────────────────
function ClientStep({ accepted, onAccept, remember, onRemember, client, onChange, touched, onTouch, error }: { accepted: boolean; onAccept: (v: boolean) => void; remember: boolean; onRemember: (v: boolean) => void; client: Client; onChange: (c: Client) => void; touched: Partial<Record<keyof Client, boolean>>; onTouch: (k: keyof Client) => void; error?: string }) {
  const err = clientErrors(client)
  const set = (k: keyof Client) => (v: string) => onChange({ ...client, [k]: k === 'phone' ? maskPhone(v) : v })
  const show = (k: keyof Client) => (touched[k] ? err[k] : undefined)
  return (
    <StepShell eyebrow="Quase lá" title="Seus dados" subtitle="Para a Jhenny confirmar seu horário e falar com você." narrow>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      <form className="space-y-5" onSubmit={e => e.preventDefault()} noValidate>
        <Field label="Nome" required value={client.name} onChange={set('name')} onBlur={() => onTouch('name')} error={show('name')} autoComplete="name" placeholder="Como podemos te chamar?" />
        <Field label="WhatsApp" required type="tel" inputMode="tel" value={client.phone} onChange={set('phone')} onBlur={() => onTouch('phone')} error={show('phone')} autoComplete="tel" placeholder="(11) 90000-0000" />
        <Field label="E-mail" type="email" inputMode="email" value={client.email} onChange={set('email')} onBlur={() => onTouch('email')} error={show('email')} autoComplete="email" placeholder="voce@email.com" />
        <Field label="Observações" multiline value={client.notes} onChange={set('notes')} placeholder="Alergias, referência de foto, cabelo com química…" />
      </form>
      <p className="mt-6 flex items-start gap-2 text-xs text-white/55"><LockIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Usamos nome, WhatsApp e e-mail só para este agendamento e contato sobre ele (veja a <a href="#/privacidade" target="_blank" rel="noopener noreferrer" className="text-lilac underline">Política de Privacidade</a>). Evite escrever dados de saúde nas observações.</p>
      <label className="mt-4 flex items-start gap-3 text-sm text-white/80 cursor-pointer">
        <input type="checkbox" checked={accepted} onChange={e => onAccept(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-violet" />
        <span>Li e aceito os <a href="#/termos" target="_blank" rel="noopener noreferrer" className="text-lilac underline">Termos de Uso</a> e as regras de <a href="#/pagamentos" target="_blank" rel="noopener noreferrer" className="text-lilac underline">pagamento e cancelamento</a>. <span className="text-white/50">(obrigatório)</span></span>
      </label>
      <label className="mt-3 flex items-start gap-3 text-sm text-white/65 cursor-pointer">
        <input type="checkbox" checked={remember} onChange={e => onRemember(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-violet" />
        <span>Lembrar meus dados neste aparelho para o próximo agendamento <span className="text-white/45">(opcional)</span></span>
      </label>
      {!isLive && <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">Modo demonstração: nenhum agendamento é registrado de verdade. Para marcar, fale pelo WhatsApp.</p>}
    </StepShell>
  )
}

// ─── PIX ──────────────────────────────────────────────────────────────────────
function PixScreen({ price, day, time, style, client, extras, live, onConfirm, onExpired }: { price: number; day: Date|null; time: string|null; style: StyleItem|null; client: Client; extras: [string, string][]; live: BookingResult|null; onConfirm: () => void; onExpired: () => void }) {
  const signal = live ? live.signal : Math.round(price * 0.3)
  // Pix real: do servidor (ao vivo) ou gerado aqui com a chave configurada; senão, demonstração
  const localCode = useMemo(() => (!live && directPix) ? pixPayload({ key: PIX_CONF.key, name: PIX_CONF.name, city: PIX_CONF.city, amount: signal, txid: 'TJ' + Math.random().toString(36).slice(2, 12) }) : '', [live, signal])
  const realCode = live ? live.pixCopyPaste : localCode
  const pixCode = realCode || PIX_KEY
  const [claimed, setClaimed] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimErr, setClaimErr] = useState('')
  const [timer, setTimer] = useState(() => live ? Math.max(0, Math.floor((Date.parse(live.expiresAt) - Date.now()) / 1000)) : 15 * 60)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTimer(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  // ao vivo: consulta se a Jhenny já confirmou o pagamento no painel
  useEffect(() => {
    if (!live) return
    const t = setInterval(async () => {
      try { if ((await bookingStatus(live.id, live.token)) === 'confirmed') onConfirm() } catch { /* tenta de novo */ }
    }, 5000)
    return () => clearInterval(t)
  }, [live, onConfirm])

  async function iPaid() {
    if (!live) { onConfirm(); return }
    setClaiming(true); setClaimErr('')
    try { await claimPaid(live.id, live.token); setClaimed(true); onConfirm() }
    catch (e) { setClaimErr(e instanceof Error ? e.message : 'Erro inesperado.') }
    finally { setClaiming(false) }
  }
  const waProof = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá Jhenny! Fiz o Pix do sinal (R$ ${signal}).\nNome: ${client.name.trim()}\nEstilo: ${style?.name ?? ''}\nData: ${day ? fmtDate(day) : ''} às ${time ?? ''}`)}`

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')
  const expired = timer === 0 && !claimed

  async function copyKey() {
    try { await navigator.clipboard.writeText(pixCode); setCopied(true); setTimeout(() => setCopied(false), 2200) } catch { /* sem permissão: usuário pode copiar manualmente */ }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-8 pt-8 pb-14 text-center anim-fade-up">
      <p className="eyebrow justify-center">Último passo</p>
      <h2 className="h-display mt-4 text-[clamp(2.2rem,6vw,3.2rem)] text-white">Pague o sinal via PIX</h2>
      <p className="mt-3 text-white/60">30% para garantir seu horário — <strong className="text-lavender font-semibold">R$ {signal}</strong></p>

      {!claimed && <div role="timer" aria-live="off" className={`mt-7 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border ${expired ? 'bg-red-500/10 border-red-400/40 text-red-300' : 'bg-violet/12 border-violet/40 text-lavender'}`}>
        <ClockIcon className="w-4 h-4" />
        {expired ? 'Código expirado' : `Expira em ${mm}:${ss}`}
      </div>}
      {expired && (
        <div className="mt-3"><button onClick={() => live ? onExpired() : setTimer(15 * 60)} className="text-sm text-lilac underline underline-offset-4">{live ? 'Escolher o horário novamente' : 'Gerar novo código'}</button></div>
      )}

      <div className={`flex justify-center mt-7 mb-5 transition-opacity ${expired ? 'opacity-30 grayscale' : ''}`}>
        {realCode ? <PixQr value={realCode} /> : <QRCode />}
      </div>

      <div className="rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 border border-white/12 bg-white/[0.04]">
        <div className="text-left min-w-0">
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/50">{realCode ? 'Pix copia e cola' : 'Chave PIX'}</p>
          <p className="text-sm font-mono font-medium text-white mt-1 truncate">{pixCode}</p>
        </div>
        <button onClick={copyKey} className={`shrink-0 inline-flex items-center gap-2 min-h-11 px-4 rounded-xl text-xs font-semibold transition-colors ${copied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet/20 text-lavender hover:bg-violet/30'}`}>
          {copied ? <><CheckIcon className="w-3.5 h-3.5" /> Copiado</> : <><CopyIcon className="w-3.5 h-3.5" /> Copiar</>}
        </button>
      </div>
      <p className="sr-only" role="status">{copied ? 'Chave PIX copiada' : ''}</p>

      {day && time && style && (
        <div className="rounded-2xl p-5 mb-7 text-left border border-white/12 bg-gradient-to-b from-white/[0.05] to-transparent">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] mb-3 text-white/50">Resumo do agendamento</p>
          <dl>
            {[
              ['Cliente', client.name.trim()],
              ['Estilo', style.name],
              ...extras,
              ['Data', fmtDate(day)],
              ['Horário', time],
              ['Total', `R$ ${price}`],
              ['Sinal (PIX)', `R$ ${signal}`],
              ['Saldo no dia', `R$ ${price - signal}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-white/8 last:border-0">
                <dt className="text-sm text-white/55">{label}</dt>
                <dd className={`text-sm font-semibold ${label === 'Sinal (PIX)' ? 'text-lavender' : 'text-white'}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {claimed ? (
        <div className="mb-4 rounded-2xl border border-violet/40 bg-violet/10 p-5">
          <p role="status" className="flex items-center justify-center gap-2 text-sm font-semibold text-lavender"><span aria-hidden className="w-4 h-4 rounded-full border-2 border-lilac border-t-transparent" style={{ animation: 'spin 0.9s linear infinite' }} /> Aguardando a Jhenny confirmar seu Pix…</p>
          <p className="mt-2 text-xs text-white/60">Seu horário está reservado. Esta tela atualiza sozinha. Para agilizar, envie o comprovante:</p>
          <a href={waProof} target="_blank" rel="noopener noreferrer" className="btn btn-sm mt-4 text-white" style={{ background: 'linear-gradient(135deg,#2fe57a,#1fb85a)' }}><WhatsAppIcon className="w-4 h-4" /> Enviar comprovante</a>
        </div>
      ) : (
        <>
          <button onClick={iPaid} disabled={claiming || expired} className="btn btn-primary w-full mb-4">{claiming ? 'Enviando…' : live ? 'Já paguei' : directPix ? 'Já paguei — enviar pedido' : 'Já paguei — confirmar agendamento'}</button>
          {claimErr && <p role="alert" className="mb-3 text-sm text-red-300">{claimErr}</p>}
        </>
      )}
      <p className="flex items-center justify-center gap-2 text-xs text-white/50"><LockIcon className="w-3.5 h-3.5" /> Seu horário só é confirmado depois que a Jhenny validar o pagamento</p>
    </div>
  )
}

// ─── Confirmação ──────────────────────────────────────────────────────────────
function SuccessScreen({ style, day, time, price, minutes, client, extras, awaiting, myLink, onBack }: { myLink?: string; style: StyleItem|null; day: Date|null; time: string|null; price: number; minutes: number; client: Client; extras: [string, string][]; awaiting: boolean; onBack: () => void }) {
  const signal = Math.round(price * 0.3)
  const msg = [
    awaiting ? 'Olá Jhenny! Fiz o Pix do sinal e estou enviando o comprovante do meu agendamento.' : 'Olá Jhenny! Acabei de confirmar meu agendamento.',
    `Nome: ${client.name.trim()}`,
    `Estilo: ${style?.name ?? ''}`,
    ...extras.map(([k, v]) => `${k}: ${v}`),
    `Data: ${day ? fmtDate(day) : ''} às ${time ?? ''}`,
    `Total: R$ ${price} (sinal R$ ${signal})`,
    ...(client.notes.trim() ? [`Observações: ${client.notes.trim()}`] : []),
  ].join('\n')
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle,#8b5cf6,transparent 70%)' }} />
      <div className="relative max-w-lg mx-auto px-4 sm:px-8 py-16 text-center anim-fade-up">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-violet to-brand text-white shadow-[0_20px_50px_-10px_rgba(139,92,246,0.9)]">
          <CheckIcon className="w-9 h-9" />
        </div>
        <h2 className="h-display text-[clamp(2.4rem,7vw,3.4rem)] text-white">Agendamento confirmado!</h2>
        <p className="mt-3 mb-9 text-white/60">{awaiting ? 'Seu horário está reservado. A Jhenny confere o Pix do sinal; o pagamento só é considerado confirmado quando ela confirmar. Envie o comprovante pelo WhatsApp para agilizar.' : 'Seu horário está garantido. Nos vemos em breve!'}</p>
        {myLink && <p className="mb-6 text-sm"><a href={myLink} className="text-lilac underline">Acompanhar ou pedir alteração do meu agendamento</a><span className="block mt-1 text-xs text-white/45">Guarde este link: ele é pessoal e dá acesso ao seu agendamento.</span></p>}

        <div className="rounded-2xl p-6 text-left mb-8 border border-white/12 bg-white/[0.04]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] mb-3 text-white/50">Detalhes do agendamento</p>
          <dl>
            {[
              ['Cliente', client.name.trim()],
              ['Estilo', style?.name ?? ''],
              ...extras,
              ['Data', day ? fmtDate(day) : ''],
              ['Horário', time ?? ''],
              [awaiting ? 'Sinal (Pix)' : 'Sinal pago', `R$ ${signal}`],
              ['Saldo no dia', `R$ ${price - signal}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-white/8 last:border-0">
                <dt className="text-sm text-white/55">{label}</dt>
                <dd className="text-sm font-semibold text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`}
          className="btn w-full mb-3 text-white" style={{ background: 'linear-gradient(135deg,#2fe57a,#1fb85a)' }}
        >
          <WhatsAppIcon className="w-5 h-5" /> {awaiting ? 'Enviar comprovante no WhatsApp' : 'Enviar detalhes no WhatsApp'}
        </a>
        {style && day && time && (
          <button onClick={() => downloadIcs(style, day, time, minutes)} className="btn btn-ghost w-full mb-3">
            <CalendarIcon className="w-4 h-4" /> Adicionar ao calendário
          </button>
        )}
        <button onClick={onBack} className="btn btn-ghost w-full">Voltar ao início</button>
      </div>
    </div>
  )
}

// ─── Principal (estados e navegação inalterados) ──────────────────────────────
export default function BraidCalculator({ onBack }: { onBack: () => void }) {
  const [view,         setView]         = useState<View>('step1')
  const [style,        setStyle]        = useState<StyleItem|null>(null)
  const [length,       setLength]       = useState<LengthItem|null>(null)
  const [thickness,    setThickness]    = useState<ThicknessItem|null>(null)
  const [volume,       setVolume]       = useState<VolumeItem|null>(null)
  const [ownMaterial,  setOwnMaterial]  = useState(true)
  const [addons,       setAddons]       = useState<AddonItem[]>([])
  const [selDay,       setSelDay]       = useState<Date|null>(null)
  const [selTime,      setSelTime]      = useState<string|null>(null)
  const [client,       setClient]       = useState<Client>(loadClient)
  const [booking,      setBooking]      = useState<BookingResult|null>(null)
  const [submitting,   setSubmitting]   = useState(false)
  const [flowError,    setFlowError]    = useState('')
  const [accepted,     setAccepted]     = useState(false)
  const [remember,     setRemember]     = useState(hasSaved)
  const [requestId,    setRequestId]    = useState(() => crypto.randomUUID())
  const [touched,      setTouched]      = useState<Partial<Record<keyof Client, boolean>>>({})

  const totalPrice = useMemo(() => calcPrice(style, length, thickness, volume, ownMaterial, addons), [style, length, thickness, volume, ownMaterial, addons])

  const extras: [string, string][] = [
    ...(length ? [['Comprimento', length.name] as [string, string]] : []),
    ...(thickness ? [['Espessura', thickness.name] as [string, string]] : []),
    ...(volume ? [['Volume', volume.name] as [string, string]] : []),
    ...(addons.length ? [['Extras', addons.map(a => a.name).join(', ')] as [string, string]] : []),
    ['Material', ownMaterial ? 'Traz o próprio' : 'Fornecido pelo studio'],
    ...(selDay && selTime && style ? (() => {
      const mins = calcTime(style, length, thickness)
      const sg = workSegments(slotMs(ymd(selDay), selTime), mins)
      const out: [string, string][] = [['Duração', fmtMin(mins)]]
      if (sg.length > 1) out.push(['Término', `${fmtDay(sg[sg.length - 1][1])}, ${fmtHour(sg[sg.length - 1][1])}`])
      return out
    })() : []),
  ]

  const confirmPaid = useCallback(() => {
    // sem banco: guarda a reserva neste navegador para o horário (e a duração toda) ficar bloqueado
    if (!isLive && style && selDay && selTime) {
      const st = slotMs(ymd(selDay), selTime)
      saveLocalReserva({ start: st, end: workEnd(st, calcTime(style, length, thickness)) })
    }
    setView('success')
  }, [style, selDay, selTime, length, thickness])

  const toggleAddon = useCallback((a: AddonItem) => {
    setAddons(prev => prev.some(x => x.id === a.id) ? prev.filter(x => x.id !== a.id) : [...prev, a])
  }, [])

  const canContinue = useMemo(() => {
    if (view === 'step1') return !!style
    if (view === 'step2') return !!length
    if (view === 'step3') return !!thickness && !!volume
    if (view === 'step4') return true
    if (view === 'datetime') return !!selDay && !!selTime
    if (view === 'client') return Object.keys(clientErrors(client)).length === 0 && accepted
    return false
  }, [view, style, length, thickness, volume, selDay, selTime, client, accepted])

  async function submitLive() {
    if (!style || !length || !thickness || !volume || !selDay || !selTime) return
    setSubmitting(true); setFlowError('')
    try {
      const r = await createBooking({
        name: client.name.trim(), phone: client.phone, email: client.email.trim(), notes: client.notes.trim(),
        styleId: style.id, lengthId: length.id, thicknessId: thickness.id, volumeId: volume.id,
        ownMaterial, addonIds: addons.map(a => a.id), date: ymd(selDay), time: selTime,
        requestId, acceptedTerms: accepted, termsVersion: TERMS_VERSION,
      })
      setBooking(r); setView('pix')
    } catch (e) {
      if (e instanceof ApiError && e.code === 'slot_taken') { setSelTime(null); setView('datetime'); setRequestId(crypto.randomUUID()) }
      setFlowError(e instanceof Error ? e.message : 'Erro inesperado.')
    } finally { setSubmitting(false) }
  }

  function advance() {
    if (view === 'client' && isLive) { saveClient(client, remember); void submitLive(); return }
    const next: Record<View, View> = {
      step1: 'step2', step2: 'step3', step3: 'step4', step4: 'datetime', datetime: 'client', client: 'pix', pix: 'success', success: 'success'
    }
    if (view === 'client') saveClient(client, remember)
    setView(next[view])
  }

  function goBack() {
    const prev: Record<View, View|null> = {
      step1: null, step2: 'step1', step3: 'step2', step4: 'step3', datetime: 'step4', client: 'datetime', pix: 'client', success: null
    }
    const p = prev[view]
    if (p) setView(p); else onBack()
  }

  // cada passo abre no topo da tela
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [view])

  const stepIndex = { step1:1, step2:2, step3:3, step4:4, datetime:5, client:6, pix:7, success:0 }[view] ?? 0
  const showNav = view !== 'success'

  return (
    <div className="min-h-screen font-sans bg-ink text-cream" style={{ background: 'radial-gradient(90% 50% at 85% 0%, rgba(108,43,217,0.22), transparent 60%), #0c0612' }}>
      {showNav && (
        <>
          <FlowHeader onBack={goBack} backLabel="Voltar" right={<button onClick={onBack} className="hover:text-white transition-colors min-h-11 pl-3">Sair</button>} />
          <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-6"><Stepper steps={STEP_LABELS} current={stepIndex} /></div>
        </>
      )}

      {view === 'step1'    && <Step1 selected={style} onSelect={setStyle} />}
      {view === 'step2'    && <Step2 selected={length} onSelect={setLength} />}
      {view === 'step3'    && <Step3 thickness={thickness} volume={volume} onThickness={setThickness} onVolume={setVolume} />}
      {view === 'step4'    && <Step4 ownMaterial={ownMaterial} setOwnMaterial={setOwnMaterial} addons={addons} toggleAddon={toggleAddon} />}
      {view === 'datetime' && <DateTimeStep day={selDay} onDay={d => { setSelDay(d); setSelTime(null); setFlowError('') }} time={selTime} onTime={setSelTime} minutes={calcTime(style, length, thickness)} notice={flowError} />}
      {view === 'client'   && <ClientStep accepted={accepted} onAccept={setAccepted} remember={remember} onRemember={setRemember} client={client} onChange={setClient} touched={touched} onTouch={k => setTouched(t => ({ ...t, [k]: true }))} error={flowError} />}
      {view === 'pix'      && <PixScreen price={totalPrice} day={selDay} time={selTime} style={style} client={client} extras={extras} live={isLive ? booking : null} onConfirm={confirmPaid} onExpired={() => { setBooking(null); setSelTime(null); setView('datetime') }} />}
      {view === 'success'  && <SuccessScreen style={style} day={selDay} time={selTime} price={totalPrice} minutes={calcTime(style, length, thickness)} client={client} extras={extras} awaiting={directPix} myLink={isLive && booking ? `#/agendamento/${booking.id}/${booking.token}` : undefined} onBack={onBack} />}

      {['step1','step2','step3','step4','datetime','client'].includes(view) && (
        <SummaryBar style={style} length={length} thickness={thickness} volume={volume} ownMaterial={ownMaterial} addons={addons} canContinue={canContinue && !submitting} onContinue={advance} view={view} />
      )}
    </div>
  )
}
