import { useState } from 'react'
import {
  Stepper, FlowHeader, DayScroller, SlotGrid, Field,
  CheckIcon, ClockIcon, CalendarIcon, ArrowRight, ArrowLeft, WhatsAppIcon,
  WEEKDAYS_SHORT, WHATSAPP_NUMBER,
} from './ui'

// ─── Constants (inalterados) ──────────────────────────────────────────────────

const SERVICES = [
  { id: 'box-braids',   name: 'Box Braids',      duration: '4–6h',  price: 250, desc: 'Tranças soltas e atemporais com proteção total dos fios' },
  { id: 'knotless',     name: 'Knotless Braids',  duration: '5–7h',  price: 320, desc: 'Sem nó na raiz — mais natural, leve e confortável' },
  { id: 'nago',         name: 'Tranças Nagô',     duration: '2–4h',  price: 180, desc: 'Coladas ao couro cabeludo com padrões geométricos precisos' },
  { id: 'fulani',       name: 'Fulani Braids',    duration: '3–5h',  price: 280, desc: 'Soltas e coladas com missangas e detalhes exclusivos' },
  { id: 'goddess',      name: 'Goddess Braids',   duration: '3–5h',  price: 220, desc: 'Volumosas com ondas expostas — femininas e marcantes' },
  { id: 'micro',        name: 'Micro Braids',     duration: '6–10h', price: 380, desc: 'Ultra finas para um visual ultra sofisticado e duradouro' },
]

const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho',
                     'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const ALL_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
]

const STEP_LABELS = ['Serviço', 'Data & horário', 'Seus dados']

// ─── Helpers (inalterados) ────────────────────────────────────────────────────

function generateDays(count = 28) {
  const days: { date: Date; available: boolean }[] = []
  const today = new Date()
  for (let i = 1; i <= count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dow = d.getDay()
    days.push({ date: d, available: dow !== 0 }) // closed Sundays
  }
  return days
}

function getOccupied(date: Date): Set<string> {
  const seed = date.getDate() + date.getMonth() * 31
  const set = new Set<string>()
  ALL_SLOTS.forEach((s, i) => { if ((i * 7 + seed) % 5 === 0) set.add(s) })
  return set
}

function formatDateLong(date: Date) {
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} de ${MONTHS_FULL[date.getMonth()]}`
}

type Service = typeof SERVICES[0]
interface FormData { name: string; whatsapp: string; email: string; notes: string }

// ─── Resumo ───────────────────────────────────────────────────────────────────

function SummarySidebar({ service, day, time }: { service: Service | null; day: Date | null; time: string | null }) {
  const empty = !service && !day && !time
  const row = 'pt-4 mt-4 border-t border-white/10'
  return (
    <aside aria-label="Resumo do agendamento" className="rounded-2xl p-6 border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] md:sticky md:top-24">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/50 mb-5">Resumo</p>
      {empty ? (
        <p className="text-white/40 text-sm italic">Suas seleções aparecerão aqui.</p>
      ) : (
        <div>
          {service && (
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/45 mb-1">Serviço</p>
              <p className="h-display text-[1.6rem] leading-none text-white">{service.name}</p>
              <p className="text-xs text-white/50 mt-2">{service.duration} · R$ {service.price}</p>
            </div>
          )}
          {day && (
            <div className={row}>
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/45 mb-1">Data</p>
              <p className="text-sm font-semibold text-white">{formatDateLong(day)}</p>
            </div>
          )}
          {time && (
            <div className={row}>
              <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/45 mb-1">Horário</p>
              <p className="text-sm font-semibold text-white">{time}</p>
            </div>
          )}
          {service && (
            <div className={`${row} flex items-end justify-between`}>
              <p className="text-sm text-white/55">Valor estimado</p>
              <p className="h-display text-[1.9rem] leading-none text-lavender">R$ {service.price}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}

// ─── Passo 1: serviço ─────────────────────────────────────────────────────────

function Step1Services({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="anim-fade-up">
      <h2 className="h-display text-[clamp(2rem,5vw,2.8rem)] text-white">Qual serviço você deseja?</h2>
      <p className="text-white/55 text-sm mt-2 mb-8">Selecione o tipo de trança para sua sessão.</p>
      <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Serviço">
        {SERVICES.map((s) => {
          const sel = selected === s.id
          return (
            <button
              key={s.id} role="radio" aria-checked={sel} onClick={() => onSelect(s.id)}
              className={`text-left p-5 rounded-2xl border transition-all duration-300 active:scale-[0.985] ${sel
                ? 'border-violet bg-violet/12 shadow-[0_0_0_1px_#8b5cf6,0_18px_40px_-20px_rgba(139,92,246,0.8)]'
                : 'border-white/12 bg-white/[0.03] hover:border-lilac/60 hover:bg-white/[0.06]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="h-display text-[1.65rem] leading-none text-white">{s.name}</p>
                  <p className="text-white/55 text-sm mt-2.5 leading-snug">{s.desc}</p>
                </div>
                <span aria-hidden className={`w-5 h-5 rounded-full border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center transition-all ${sel ? 'bg-violet border-violet text-white' : 'border-white/30'}`}>
                  {sel && <CheckIcon className="w-3 h-3" />}
                </span>
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/10">
                <span className="text-xs text-white/50 flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" /> {s.duration}</span>
                <span className={`text-sm font-semibold ${sel ? 'text-lavender' : 'text-white/75'}`}>R$ {s.price}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Passo 2: data e horário ──────────────────────────────────────────────────

function Step2DateTime({
  days, selectedDay, onDaySelect, selectedTime, onTimeSelect, occupied,
}: {
  days: { date: Date; available: boolean }[]
  selectedDay: Date | null
  onDaySelect: (d: Date) => void
  selectedTime: string | null
  onTimeSelect: (t: string) => void
  occupied: Set<string>
}) {
  return (
    <div className="anim-fade-up">
      <h2 className="h-display text-[clamp(2rem,5vw,2.8rem)] text-white">Quando você quer vir?</h2>
      <p className="text-white/55 text-sm mt-2 mb-7">Escolha um dia disponível e o horário ideal.</p>

      <DayScroller days={days} selected={selectedDay} onSelect={onDaySelect} />

      <div className="mt-9">
        {selectedDay ? (
          <div key={selectedDay.toDateString()} className="anim-fade-up">
            <p className="flex items-center gap-2.5 text-sm font-semibold text-white mb-6"><CalendarIcon className="w-4 h-4 text-lilac" /> {formatDateLong(selectedDay)}</p>
            <SlotGrid slots={ALL_SLOTS} occupied={occupied} selected={selectedTime} onSelect={onTimeSelect} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center border border-dashed border-white/20 rounded-2xl">
            <CalendarIcon className="w-8 h-8 mb-3 text-white/30" />
            <p className="text-white/55 text-sm">Selecione um dia para ver os horários</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Passo 3: dados ───────────────────────────────────────────────────────────

function Step3Form({
  form, onChange, onSubmit, service, day, time,
}: {
  form: FormData
  onChange: (f: FormData) => void
  onSubmit: () => void
  service: Service | null
  day: Date | null
  time: string | null
}) {
  const valid = form.name.trim() !== '' && form.whatsapp.trim() !== ''
  const [touched, setTouched] = useState({ name: false, whatsapp: false })

  return (
    <div className="anim-fade-up">
      <h2 className="h-display text-[clamp(2rem,5vw,2.8rem)] text-white">Seus dados</h2>
      <p className="text-white/55 text-sm mt-2 mb-7">Preencha seus dados para confirmar o agendamento.</p>

      <div className="md:hidden mb-7">
        <SummarySidebar service={service} day={day} time={time} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); setTouched({ name: true, whatsapp: true }); if (valid) onSubmit() }} className="space-y-5" noValidate>
        <Field label="Nome completo" required value={form.name} onChange={(v) => onChange({ ...form, name: v })} onBlur={() => setTouched(t => ({ ...t, name: true }))}
          placeholder="Seu nome completo" autoComplete="name" error={touched.name && !form.name.trim() ? 'Informe seu nome.' : undefined} />
        <Field label="WhatsApp" required type="tel" inputMode="tel" value={form.whatsapp} onChange={(v) => onChange({ ...form, whatsapp: v })} onBlur={() => setTouched(t => ({ ...t, whatsapp: true }))}
          placeholder="(11) 99999-9999" autoComplete="tel" error={touched.whatsapp && !form.whatsapp.trim() ? 'Informe seu WhatsApp para a confirmação.' : undefined} />
        <Field label="E-mail" type="email" inputMode="email" value={form.email} onChange={(v) => onChange({ ...form, email: v })} placeholder="seu@email.com" autoComplete="email" />
        <Field label="Observações" multiline value={form.notes} onChange={(v) => onChange({ ...form, notes: v })} placeholder="Alguma preferência, alergia ou dúvida?" />

        <p className="text-xs text-white/45 leading-relaxed">
          Ao agendar, você concorda com nossa política de cancelamento: reagendamentos com até 24h de antecedência são gratuitos.
        </p>

        <button type="submit" disabled={!valid} className="btn btn-primary w-full">Confirmar agendamento</button>
      </form>
    </div>
  )
}

// ─── Confirmação ──────────────────────────────────────────────────────────────

function SuccessScreen({ form, service, day, time, onBack }: { form: FormData; service: Service | null; day: Date | null; time: string | null; onBack: () => void }) {
  return (
    <div className="min-h-screen font-sans flex flex-col bg-ink text-cream relative overflow-hidden">
      <div aria-hidden className="absolute -top-32 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle,#8b5cf6,transparent 70%)' }} />
      <FlowHeader onBack={onBack} backLabel="Voltar ao site" />
      <div className="relative flex-1 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-md text-center anim-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 bg-gradient-to-br from-violet to-brand text-white shadow-[0_20px_50px_-10px_rgba(139,92,246,0.9)]">
            <CheckIcon className="w-9 h-9" />
          </div>

          <h2 className="h-display text-[clamp(2.4rem,7vw,3.2rem)] text-white">Agendamento confirmado!</h2>
          <p className="text-white/60 leading-relaxed mt-3 mb-9">
            Olá <span className="font-medium text-white">{form.name}</span>! Entraremos em contato pelo WhatsApp <span className="font-medium text-white">{form.whatsapp}</span> para confirmar sua sessão.
          </p>

          <div className="rounded-2xl p-6 text-left mb-8 border border-white/12 bg-white/[0.04]">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/50 mb-3">Detalhes do agendamento</p>
            <dl>
              {[
                { label: 'Serviço', value: service?.name ?? '' },
                { label: 'Data', value: day ? formatDateLong(day) : '' },
                { label: 'Horário', value: time ?? '' },
                { label: 'Duração estimada', value: service?.duration ?? '' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-white/8">
                  <dt className="text-sm text-white/55">{label}</dt>
                  <dd className="text-sm font-semibold text-white text-right">{value}</dd>
                </div>
              ))}
              <div className="pt-4 flex items-center justify-between">
                <dt className="text-sm text-white/55">Valor</dt>
                <dd className="h-display text-[1.8rem] leading-none text-lavender">R$ {service?.price}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onBack} className="btn btn-primary">Voltar ao início</button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Acabei de agendar uma sessão de ${service?.name} para ${day ? formatDateLong(day) : ''} às ${time}.`)}`}
              className="btn btn-ghost"
            >
              <WhatsAppIcon className="w-4 h-4" /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal (estados e fluxo inalterados) ───────────────────────

export default function Booking({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({ name: '', whatsapp: '', email: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  const days = generateDays(28)
  const service = SERVICES.find((s) => s.id === serviceId) ?? null
  const occupied = selectedDay ? getOccupied(selectedDay) : new Set<string>()
  const canNext = step === 1 ? !!serviceId : step === 2 ? !!selectedDay && !!selectedTime : false

  function handleDaySelect(date: Date) {
    setSelectedDay(date)
    setSelectedTime(null)
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.whatsapp.trim()) return
    setSubmitted(true)
  }

  if (submitted) {
    return <SuccessScreen form={form} service={service} day={selectedDay} time={selectedTime} onBack={onBack} />
  }

  return (
    <div className="min-h-screen font-sans bg-ink text-cream" style={{ background: 'radial-gradient(90% 50% at 85% 0%, rgba(108,43,217,0.22), transparent 60%), #0c0612' }}>
      <FlowHeader onBack={() => (step > 1 ? setStep((s) => s - 1) : onBack())} backLabel={step > 1 ? 'Voltar' : 'Voltar ao site'} />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 pb-36 md:pb-16">
        <div className="mb-9">
          <p className="eyebrow">Agendamento online</p>
          <h1 className="h-display mt-4 text-[clamp(2.4rem,6vw,3.6rem)] text-white">Agende sua sessão</h1>
        </div>

        <Stepper steps={STEP_LABELS} current={step} />

        <div className="mt-10 grid md:grid-cols-[1fr_300px] gap-8 lg:gap-12 items-start">
          <div>
            {step === 1 && <Step1Services selected={serviceId} onSelect={setServiceId} />}
            {step === 2 && (
              <Step2DateTime
                days={days}
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
                occupied={occupied}
              />
            )}
            {step === 3 && (
              <Step3Form
                form={form}
                onChange={setForm}
                onSubmit={handleSubmit}
                service={service}
                day={selectedDay}
                time={selectedTime}
              />
            )}

            {step < 3 && (
              <div
                className="fixed md:static bottom-0 inset-x-0 glass md:bg-transparent md:backdrop-blur-none border-t border-white/10 md:border-none px-4 md:px-0 pt-3 md:pt-0 md:mt-10 flex items-center justify-between gap-4 z-40"
                style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
              >
                <button
                  onClick={() => (step > 1 ? setStep((s) => s - 1) : onBack())}
                  className="inline-flex items-center gap-2 min-h-12 px-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
                >
                  <ArrowLeft /> {step === 1 ? 'Início' : 'Voltar'}
                </button>
                <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn btn-primary">
                  {step === 2 ? 'Continuar' : 'Próximo'} <ArrowRight />
                </button>
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <SummarySidebar service={service} day={selectedDay} time={selectedTime} />
          </div>
        </div>
      </div>
    </div>
  )
}
