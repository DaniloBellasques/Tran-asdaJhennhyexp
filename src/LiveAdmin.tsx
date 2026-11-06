import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminAddAppointment, adminAddBlock, adminBlocks, adminList, adminLogin, adminRemoveBlock, adminSetStatus, adminLogout, adminRecover, adminSetPassword, adminPrivacy, adminSetPrivacy, adminAnonymize, ApiError, type Appt, type Block, type PrivacyReq } from './api'
import { ADDONS, ALL_SLOTS, LENGTHS, STYLES, THICKNESSES, VOLUMES, calcPrice, calcTime, fmtDay, fmtHour, fmtMin, genDays, slotFree, type Busy } from './BraidCalculator'
import { AdminView, type AgendaRow, type CrmItem, type Kpi, type PaymentItem, type ReminderItem, type Tab } from './AdminDashboard'
import { workEnd, workSegments, slotMs } from './schedule'
import { ymd } from './api'
import { FlowHeader, Field } from './ui'

const TOKEN_KEY = 'trancas-jhenny:admin'
const SENT_KEY = 'trancas-jhenny:lembretes'
const DONUT_COLORS = ['#8b5cf6', '#a875e8', '#c7a6f2', '#e6d6f8', '#4a2f72']
const WD = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const DAY = 86400e3
const spYmd = (ms: number) => new Date(ms - 3 * 3600e3).toISOString().slice(0, 10)
const first = (n: string) => n.trim().split(/\s+/)[0]
const styleName = (id: string) => STYLES.find(s => s.id === id)?.name ?? id
const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`
/** Ocupa a agenda: confirmado, em revisão, ou Pix pendente ainda dentro do prazo (ou já avisado como pago). */
const isActive = (a: Appt, now: number) => a.status === 'confirmed' || a.status === 'needs_review' || (a.status === 'pending' && (!!a.paid_claimed_at || Date.parse(a.pix_expires_at ?? '0') > now))

function loadSent(): Set<string> { try { return new Set(JSON.parse(localStorage.getItem(SENT_KEY) || '[]')) } catch { return new Set() } }

// ─── Janela modal acessível ───────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus() }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6 anim-fade-in" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/12 bg-plum p-6 sm:p-7 outline-none anim-fade-up">
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 className="h-display text-[1.7rem] text-white">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="w-10 h-10 -mr-2 -mt-1 rounded-full text-white/60 hover:text-white hover:bg-white/10">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-white mb-2">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full h-[3.1rem] px-4 rounded-xl border border-white/14 bg-white/[0.05] text-[0.95rem] text-white focus:outline-none focus:border-lilac">
        {children}
      </select>
    </label>
  )
}

// ─── Novo agendamento (manual) ────────────────────────────────────────────────
function NewAppointment({ busy, onSave, onClose }: { busy: Busy[]; onSave: (a: Record<string, unknown>) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [notes, setNotes] = useState('')
  const [st, setSt] = useState(STYLES[0].id); const [le, setLe] = useState(LENGTHS[0].id); const [th, setTh] = useState('media'); const [vo, setVo] = useState('pouco')
  const [own, setOwn] = useState(true); const [adds, setAdds] = useState<string[]>([])
  const [dayIdx, setDayIdx] = useState(''); const [time, setTime] = useState('')
  const [signalIn, setSignalIn] = useState(''); const [err, setErr] = useState(''); const [saving, setSaving] = useState(false)

  const S = STYLES.find(x => x.id === st)!, L = LENGTHS.find(x => x.id === le)!, T = THICKNESSES.find(x => x.id === th)!, V = VOLUMES.find(x => x.id === vo)!
  const addons = ADDONS.filter(a => adds.includes(a.id))
  const price = calcPrice(S, L, T, V, own, addons), minutes = calcTime(S, L, T)
  const days = useMemo(() => genDays(45).filter(d => d.avail), [])
  const day = dayIdx === '' ? null : days[Number(dayIdx)]?.date ?? null
  const free = day ? ALL_SLOTS.filter(t => slotFree(day, t, minutes, busy)) : []
  const signal = signalIn === '' ? Math.round(price * 0.3) : Math.max(0, Math.round(Number(signalIn) || 0))

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    const digits = phone.replace(/\D/g, '')
    if (name.trim().length < 2) return setErr('Informe o nome.')
    if (digits.length < 10) return setErr('Informe o WhatsApp com DDD.')
    if (!day || !time) return setErr('Escolha o dia e o horário.')
    const start = slotMs(ymd(day), time)
    setSaving(true)
    try {
      await onSave({
        client_name: name.trim(), client_phone: digits, notes: notes.trim() || null,
        style_id: st, length_id: le, thickness_id: th, volume_id: vo, own_material: own, addon_ids: adds,
        price, signal, duration_min: minutes, start_at: new Date(start).toISOString(), end_at: new Date(workEnd(start, minutes)).toISOString(), status: 'confirmed',
      })
    } catch (x) { setErr(x instanceof Error ? x.message : 'Erro'); setSaving(false) }
  }

  return (
    <Modal title="Novo agendamento" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nome" required value={name} onChange={setName} autoComplete="off" />
        <Field label="WhatsApp" required type="tel" inputMode="tel" value={phone} onChange={setPhone} placeholder="(11) 90000-0000" />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Estilo" value={st} onChange={setSt}>{STYLES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
          <Select label="Comprimento" value={le} onChange={setLe}>{LENGTHS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
          <Select label="Espessura" value={th} onChange={setTh}>{THICKNESSES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
          <Select label="Volume" value={vo} onChange={setVo}>{VOLUMES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
        </div>
        <label className="flex items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={own} onChange={e => setOwn(e.target.checked)} className="w-5 h-5 accent-violet" /> Cliente traz o próprio material</label>
        <div className="flex flex-wrap gap-x-5 gap-y-2">{ADDONS.map(a => (
          <label key={a.id} className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={adds.includes(a.id)} onChange={e => setAdds(p => e.target.checked ? [...p, a.id] : p.filter(x => x !== a.id))} className="w-5 h-5 accent-violet" /> {a.name} (+R$ {a.price})</label>
        ))}</div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Dia" value={dayIdx} onChange={v => { setDayIdx(v); setTime('') }}>
            <option value="">Escolha…</option>
            {days.map((d, i) => <option key={i} value={i}>{WD[d.date.getDay()]} {String(d.date.getDate()).padStart(2, '0')}/{String(d.date.getMonth() + 1).padStart(2, '0')}</option>)}
          </Select>
          <Select label="Horário" value={time} onChange={setTime}>
            <option value="">{day ? (free.length ? 'Escolha…' : 'Sem horários') : '—'}</option>
            {free.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        {day && time && (() => { const sg = workSegments(slotMs(ymd(day), time), minutes); return <p className="text-xs text-white/60">Ocupa a agenda até {fmtDay(sg[sg.length - 1][1])}, {fmtHour(sg[sg.length - 1][1])} ({fmtMin(minutes)}).</p> })()}
        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3"><p className="text-xs text-white/50">Total calculado</p><p className="h-display text-2xl text-lavender">{brl(price)}</p></div>
          <Field label="Sinal recebido (R$)" type="text" inputMode="numeric" value={signalIn} onChange={setSignalIn} placeholder={String(Math.round(price * 0.3))} hint="0 se ainda não pagou" />
        </div>
        <Field label="Observações" multiline value={notes} onChange={setNotes} />
        {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
        <div className="flex gap-3 pt-2"><button className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Salvando…' : 'Salvar agendamento'}</button><button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button></div>
        <p className="text-xs text-white/40">O agendamento entra como confirmado e bloqueia o horário no site.</p>
      </form>
    </Modal>
  )
}

// ─── Criar bloqueio ───────────────────────────────────────────────────────────
function NewBlock({ onSave, onClose }: { onSave: (b: { start_at: string; end_at: string; reason: string }) => Promise<void>; onClose: () => void }) {
  const [date, setDate] = useState(''); const [allDay, setAllDay] = useState(true)
  const [from, setFrom] = useState('09:00'); const [to, setTo] = useState('17:00'); const [reason, setReason] = useState('')
  const [err, setErr] = useState(''); const [saving, setSaving] = useState(false)
  const ends = [...ALL_SLOTS.slice(1), '17:00']
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (!date) return setErr('Escolha a data.')
    const a = slotMs(date, allDay ? '00:00' : from), b = slotMs(date, allDay ? '23:59' : to)
    if (!(b > a)) return setErr('O fim precisa ser depois do início.')
    setSaving(true)
    try { await onSave({ start_at: new Date(a).toISOString(), end_at: new Date(b).toISOString(), reason: reason.trim() }) }
    catch (x) { setErr(x instanceof Error ? x.message : 'Erro'); setSaving(false) }
  }
  return (
    <Modal title="Criar bloqueio" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block"><span className="block text-sm font-medium text-white mb-2">Data</span>
          <input type="date" value={date} min={ymd(new Date())} onChange={e => setDate(e.target.value)} className="w-full h-[3.1rem] px-4 rounded-xl border border-white/14 bg-white/[0.05] text-white [color-scheme:dark]" /></label>
        <label className="flex items-center gap-3 text-sm text-white/80"><input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="w-5 h-5 accent-violet" /> Dia inteiro</label>
        {!allDay && <div className="grid grid-cols-2 gap-3">
          <Select label="Das" value={from} onChange={setFrom}>{ALL_SLOTS.map(t => <option key={t}>{t}</option>)}</Select>
          <Select label="Até" value={to} onChange={setTo}>{ends.map(t => <option key={t}>{t}</option>)}</Select>
        </div>}
        <Field label="Motivo" value={reason} onChange={setReason} placeholder="Folga, consulta, almoço…" />
        {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
        <div className="flex gap-3 pt-2"><button className="btn btn-primary flex-1" disabled={saving}>{saving ? 'Salvando…' : 'Bloquear'}</button><button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button></div>
        <p className="text-xs text-white/40">Atendimentos já marcados nesse horário não são cancelados automaticamente.</p>
      </form>
    </Modal>
  )
}

// ─── Detalhes ─────────────────────────────────────────────────────────────────
function Detail({ a, onClose, onConfirm, onCancel, onRefund, onAnonymize }: { a: Appt; onClose: () => void; onConfirm: () => void; onCancel: () => void; onRefund: () => void; onAnonymize: () => void }) {
  const segs = workSegments(Date.parse(a.start_at), a.duration_min)
  const rows: [string, string][] = [
    ['Estilo', styleName(a.style_id)], ['Comprimento', LENGTHS.find(x => x.id === a.length_id)?.name ?? a.length_id],
    ['Espessura', THICKNESSES.find(x => x.id === a.thickness_id)?.name ?? a.thickness_id], ['Volume', VOLUMES.find(x => x.id === a.volume_id)?.name ?? a.volume_id],
    ['Material', a.own_material ? 'Traz o próprio' : 'Fornecido pelo studio'],
    ...(a.addon_ids?.length ? [['Extras', a.addon_ids.map(i => ADDONS.find(x => x.id === i)?.name ?? i).join(', ')] as [string, string]] : []),
    ['Início', `${fmtDay(segs[0]?.[0] ?? Date.parse(a.start_at))}, ${fmtHour(segs[0]?.[0] ?? Date.parse(a.start_at))}`],
    ['Término', `${fmtDay(Date.parse(a.end_at))}, ${fmtHour(Date.parse(a.end_at))}`], ['Duração', fmtMin(a.duration_min)],
    ['Total', brl(a.price)], ['Sinal', brl(a.signal)], ['Saldo no dia', brl(a.price - a.signal)],
  ]
  const needsPay = a.status === 'pending' || a.status === 'needs_review' || a.status === 'expired'
  return (
    <Modal title={a.client_name} onClose={onClose}>
      <p className="text-sm text-white/60 -mt-3 mb-4">{a.client_phone}{a.client_email ? ` · ${a.client_email}` : ''}</p>
      <dl>{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2 border-b border-white/[0.07] last:border-0"><dt className="text-sm text-white/55">{k}</dt><dd className="text-sm font-semibold text-white text-right">{v}</dd></div>)}</dl>
      {a.change_request && <p className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">Pedido da cliente: <b>{a.change_request === 'cancel' ? 'cancelamento' : 'remarcação'}</b>{a.change_request_note ? ` — “${a.change_request_note}”` : ''}. Responda pelo WhatsApp e, se acordado, cancele/reembolse aqui.</p>}
      {a.notes && <p className="mt-4 rounded-xl bg-white/[0.05] p-3 text-sm text-white/80">“{a.notes}”</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <a href={`https://wa.me/55${a.client_phone}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">WhatsApp</a>
        {needsPay && <button onClick={onConfirm} className="btn btn-primary btn-sm">Pix recebido</button>}
        {a.status !== 'cancelled' && a.status !== 'refunded' && <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancelar horário</button>}
        {(a.status === 'cancelled' || a.status === 'confirmed') && <button onClick={onRefund} className="btn btn-ghost btn-sm">Marcar reembolsado</button>}
        {(a.status === 'cancelled' || a.status === 'expired' || a.status === 'refunded' || Date.parse(a.end_at) < Date.now()) && <button onClick={onAnonymize} className="btn btn-ghost btn-sm">Anonimizar dados (LGPD)</button>}
      </div>
    </Modal>
  )
}


const PKIND: Record<string, string> = { acesso: 'Acesso', correcao: 'Correção', exclusao: 'Exclusão', portabilidade: 'Portabilidade', outro: 'Outro' }
function PrivacyModal({ reqs, onClose, onSet }: { reqs: PrivacyReq[]; onClose: () => void; onSet: (id: string, s: PrivacyReq['status']) => void }) {
  return (
    <Modal title="Pedidos de privacidade (LGPD)" onClose={onClose}>
      <p className="text-xs text-white/55 -mt-2 mb-4">Antes de entregar ou apagar dados, confirme que é a própria cliente (ex.: responder pelo WhatsApp do agendamento).</p>
      {reqs.length === 0 && <p className="text-sm text-white/60">Nenhum pedido.</p>}
      <ul className="space-y-3">{reqs.map(r => (
        <li key={r.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm">
          <p className="font-semibold text-white">{PKIND[r.kind] ?? r.kind} · {new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
          <p className="text-white/65">{r.contact_phone ?? ''} {r.contact_email ?? ''}</p>
          {r.message && <p className="mt-1 text-white/80">“{r.message}”</p>}
          <label className="mt-2 flex items-center gap-2 text-white/60">Situação
            <select value={r.status} onChange={e => onSet(r.id, e.target.value as PrivacyReq['status'])} className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white">
              <option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="concluida">Concluída</option><option value="recusada">Recusada</option>
            </select>
          </label>
        </li>))}</ul>
    </Modal>
  )
}

// ─── Painel ───────────────────────────────────────────────────────────────────
export default function LiveAdmin({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState<string | null>(() => { try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null } })
  const [email, setEmail] = useState(''); const [pass, setPass] = useState('')
  const [appts, setAppts] = useState<Appt[] | null>(null); const [blocks, setBlocks] = useState<Block[]>([])
  const [err, setErr] = useState(''); const [busy, setBusyFlag] = useState(false)
  const [modal, setModal] = useState<null | { t: 'new' } | { t: 'block' } | { t: 'detail'; id: string }>(null)
  const [sent, setSent] = useState<Set<string>>(loadSent)
  const [recTok, setRecTok] = useState<string | null>(() => { const m = window.location.hash.match(/access_token=([^&]+).*type=recovery|type=recovery.*access_token=([^&]+)/); return m ? (m[1] ?? m[2]) : null })
  const [newPass, setNewPass] = useState(''); const [info, setInfo] = useState('')

  const logout = useCallback(() => { if (token) void adminLogout(token); setToken(null); setAppts(null); try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* ignora */ } }, [token])
  const load = useCallback(async (t: string) => {
    try { const [a, b] = await Promise.all([adminList(t), adminBlocks(t)]); setAppts(a); setBlocks(b); setErr('') }
    catch (e) { if (e instanceof ApiError && e.code === 'auth') logout(); setErr(e instanceof Error ? e.message : 'Erro') }
  }, [logout])
  const [privacy, setPrivacy] = useState<PrivacyReq[]>([]); const [showPriv, setShowPriv] = useState(false)
  useEffect(() => { if (token) adminPrivacy(token).then(setPrivacy).catch(() => {}) }, [token, showPriv])
  useEffect(() => {
    if (!token) return
    void load(token)
    const id = setInterval(() => { if (!document.hidden) void load(token) }, 30000)
    return () => clearInterval(id)
  }, [token, load])

  async function recover() {
    if (!email.trim()) { setErr('Digite seu e-mail acima e toque em “Esqueci a senha”.'); return }
    await adminRecover(email.trim()); setErr(''); setInfo('Se o e-mail for de um administrador, enviamos um link para criar nova senha.')
  }
  async function savePass(e: React.FormEvent) {
    e.preventDefault(); setErr('')
    if (newPass.length < 10) { setErr('Use ao menos 10 caracteres.'); return }
    try { await adminSetPassword(recTok!, newPass); history.replaceState(null, '', window.location.pathname + '#/admin'); setRecTok(null); setInfo('Senha alterada. Entre com a nova senha.') }
    catch (x) { setErr(x instanceof Error ? x.message : 'Erro') }
  }
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusyFlag(true); setErr('')
    try { const t = await adminLogin(email.trim(), pass); try { sessionStorage.setItem(TOKEN_KEY, t) } catch { /* ignora */ } setToken(t) }
    catch (x) { setErr(x instanceof Error ? x.message : 'Erro') } finally { setBusyFlag(false) }
  }
  async function act(fn: () => Promise<void>) {
    try { await fn(); if (token) await load(token); setErr('') } catch (x) { setErr(x instanceof Error ? x.message : 'Erro') }
  }
  const setStatus = (id: string, s: Appt['status'], ask?: string) => {
    if (ask && !window.confirm(ask)) return
    setModal(null); return act(() => adminSetStatus(token!, id, s))
  }

  // ── derivações ──
  const data = useMemo(() => {
    const list = appts ?? []
    const now = Date.now(), today = spYmd(now), month = today.slice(0, 7)
    const active = list.filter(a => isActive(a, now))
    const confirmed = list.filter(a => a.status === 'confirmed')

    const winStart = slotMs(today, '00:00')
    const mk = (days: number): AgendaRow[] => {
      const a0 = winStart, a1 = winStart + days * DAY
      const out: { at: number; row: AgendaRow }[] = []
      active.forEach(a => {
        const segs = workSegments(Date.parse(a.start_at), a.duration_min)
        segs.forEach(([s], i) => {
          if (s < a0 || s >= a1) return
          const d = new Date(s - 3 * 3600e3)
          out.push({ at: s, row: {
            key: `${a.id}-${i}`, id: a.id, dayLabel: `${WD[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}`, time: fmtHour(s),
            client: a.client_name, style: styleName(a.style_id), sub: segs.length > 1 ? `dia ${i + 1}/${segs.length}` : undefined,
            total: a.price, signal: a.signal, blocked: false,
            sigStatus: a.status === 'confirmed' ? 'pago' : a.status === 'needs_review' ? 'revisar' : 'pendente',
          } })
        })
      })
      blocks.forEach(b => {
        const s = Date.parse(b.start_at), e = Date.parse(b.end_at)
        if (e <= a0 || s >= a1) return
        const sh = Math.max(s, a0), d = new Date(sh - 3 * 3600e3)
        const full = e - s >= 20 * 3600e3
        out.push({ at: sh, row: {
          key: `b-${b.id}`, blockId: b.id, dayLabel: `${WD[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, '0')}`,
          time: full ? 'Dia todo' : fmtHour(sh), client: '—', style: '—', total: 0, signal: 0, sigStatus: 'bloqueado', note: b.reason || 'Bloqueio',
          sub: full ? undefined : `até ${fmtHour(e)}`, blocked: true,
        } })
      })
      return out.sort((x, y) => x.at - y.at).map(x => x.row)
    }
    const rows: Record<Tab, AgendaRow[]> = { hoje: mk(1), semana: mk(7), mes: mk(30) }

    const inMonth = confirmed.filter(a => spYmd(Date.parse(a.start_at)).startsWith(month))
    const kpis: Kpi[] = [
      { label: 'Faturamento (mês)', value: brl(inMonth.reduce((s, a) => s + a.price, 0)), sub: `${inMonth.length} atendimento${inMonth.length === 1 ? '' : 's'} confirmado${inMonth.length === 1 ? '' : 's'}`, icon: 'money', positive: null },
      { label: 'Sinais recebidos', value: brl(inMonth.reduce((s, a) => s + a.signal, 0)), sub: 'Pix confirmados no mês', icon: 'spark', positive: null },
      { label: 'Horas agendadas', value: `${Math.round(inMonth.reduce((s, a) => s + a.duration_min, 0) / 60)}h`, sub: 'Este mês', icon: 'clock', positive: null },
      { label: 'Atendimentos', value: String(rows.hoje.filter(r => !r.blocked).length), sub: 'Agendados hoje', icon: 'cal', positive: null },
    ]

    const payments: PaymentItem[] = list
      .filter(a => a.status === 'needs_review' || (a.status === 'pending' && (a.paid_claimed_at || Date.parse(a.pix_expires_at ?? '0') > now)) || (a.status === 'expired' && !!a.paid_claimed_at))
      .map(a => ({ id: a.id, client: a.client_name, style: styleName(a.style_id), when: `${fmtDay(Date.parse(a.start_at))}, ${fmtHour(Date.parse(a.start_at))}`, signal: a.signal, claimed: !!a.paid_claimed_at }))

    const reminders: ReminderItem[] = confirmed
      .filter(a => { const s = Date.parse(a.start_at); return s > now && s < now + 2 * DAY })
      .map(a => {
        const s = Date.parse(a.start_at)
        const msg = `Oi ${first(a.client_name)}! Passando para lembrar do seu horário de ${styleName(a.style_id)}: ${fmtDay(s)} às ${fmtHour(s)}. Qualquer imprevisto é só me avisar. 💜`
        return { id: a.id, client: a.client_name, style: styleName(a.style_id), when: `${fmtDay(s)} ${fmtHour(s)}`, sent: sent.has(a.id), href: `https://wa.me/55${a.client_phone}?text=${encodeURIComponent(msg)}` }
      })

    const byPhone = new Map<string, Appt[]>()
    confirmed.forEach(a => byPhone.set(a.client_phone, [...(byPhone.get(a.client_phone) ?? []), a]))
    const futurePhones = new Set(active.filter(a => Date.parse(a.start_at) > now).map(a => a.client_phone))
    const crm: CrmItem[] = [...byPhone.entries()]
      .filter(([ph]) => !futurePhones.has(ph))
      .map(([, v]) => { const last = v[v.length - 1]; return { last, days: Math.floor((now - Date.parse(last.end_at)) / DAY) } })
      .filter(x => x.days >= 28).sort((x, y) => y.days - x.days).slice(0, 6)
      .map(x => ({ client: x.last.client_name, style: styleName(x.last.style_id), days: x.days, href: `https://wa.me/55${x.last.client_phone}?text=${encodeURIComponent(`Oi ${first(x.last.client_name)}! Que saudade! Bora renovar seu ${styleName(x.last.style_id)}? 😊`)}` }))

    const counts = new Map<string, number>()
    list.filter(a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'needs_review').forEach(a => counts.set(a.style_id, (counts.get(a.style_id) ?? 0) + 1))
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 4).map(([id, n], i) => ({ label: styleName(id), value: n, color: DONUT_COLORS[i] }))
    const rest = sorted.slice(4).reduce((s, [, n]) => s + n, 0)
    const donut = rest ? [...top, { label: 'Outros', value: rest, color: DONUT_COLORS[4] }] : top

    const busyList: Busy[] = [
      ...list.filter(a => isActive(a, now)).map(a => ({ start: Date.parse(a.start_at), end: Date.parse(a.end_at) })),
      ...blocks.map(b => ({ start: Date.parse(b.start_at), end: Date.parse(b.end_at) })),
    ]
    return { rows, kpis, payments, reminders, crm, donut, busyList }
  }, [appts, blocks, sent])

  const openRow = (r: AgendaRow) => { if (r.id) setModal({ t: 'detail', id: r.id }) }
  const detail = modal?.t === 'detail' ? (appts ?? []).find(a => a.id === modal.id) : undefined

  if (recTok) {
    return (
      <div className="min-h-screen bg-ink text-cream"><main className="mx-auto max-w-sm px-4 py-14">
        <form onSubmit={savePass} className="space-y-5">
          <h1 className="h-display text-3xl text-white">Nova senha</h1>
          <Field label="Nova senha (mín. 10 caracteres)" required type="password" value={newPass} onChange={setNewPass} autoComplete="new-password" />
          {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
          <button className="btn btn-primary w-full">Salvar senha</button>
        </form></main></div>
    )
  }
  if (!token) {
    return (
      <div className="min-h-screen bg-ink text-cream" style={{ background: 'radial-gradient(90% 50% at 85% 0%, rgba(108,43,217,0.22), transparent 60%), #0c0612' }}>
        <FlowHeader onBack={onBack} backLabel="Site" />
        <main className="mx-auto max-w-sm px-4 py-14">
          <form onSubmit={login} className="space-y-5">
            <p className="eyebrow">Área administrativa</p>
            <h1 className="h-display text-4xl text-white">Entrar</h1>
            <Field label="E-mail" required type="email" value={email} onChange={setEmail} autoComplete="username" />
            <Field label="Senha" required type="password" value={pass} onChange={setPass} autoComplete="current-password" />
            {err && <p role="alert" className="text-sm text-red-300">{err}</p>}
            {info && <p role="status" className="text-sm text-emerald-200">{info}</p>}
            <button className="btn btn-primary w-full" disabled={busy || !email || !pass}>{busy ? 'Entrando…' : 'Entrar'}</button>
            <button type="button" onClick={() => void recover()} className="w-full text-center text-sm text-lilac underline">Esqueci a senha</button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <>
      <AdminView
        onBack={onBack} onLogout={logout} onRefresh={() => load(token)} loading={appts === null} error={err}
        kpis={data.kpis} rows={data.rows} payments={data.payments} reminders={data.reminders} crm={data.crm} donut={data.donut}
        onNew={() => setModal({ t: 'new' })} onBlock={() => setModal({ t: 'block' })} onOpenRow={openRow}
        onRemoveBlock={id => { if (window.confirm('Remover este bloqueio?')) void act(() => adminRemoveBlock(token, id)) }}
        onConfirmPay={id => { if (window.confirm('Confirmar o recebimento do Pix? Confira o valor no app do Nubank antes.')) void setStatus(id, 'confirmed') }}
        onCancelPay={id => void setStatus(id, 'cancelled', 'Cancelar este agendamento e liberar o horário?')}
        onRemind={id => setSent(prev => { const n = new Set(prev).add(id); try { localStorage.setItem(SENT_KEY, JSON.stringify([...n])) } catch { /* ignora */ } return n })}
      />
      {modal?.t === 'new' && <NewAppointment busy={data.busyList} onClose={() => setModal(null)} onSave={async a => { await adminAddAppointment(token, a); setModal(null); await load(token) }} />}
      {modal?.t === 'block' && <NewBlock onClose={() => setModal(null)} onSave={async b => { await adminAddBlock(token, b); setModal(null); await load(token) }} />}
      {detail && <Detail a={detail} onClose={() => setModal(null)}
        onConfirm={() => { if (window.confirm('Confirmar o recebimento do Pix? Confira o valor no app do Nubank antes.')) void setStatus(detail.id, 'confirmed') }}
        onCancel={() => void setStatus(detail.id, 'cancelled', `Cancelar o horário de ${detail.client_name} e liberar a agenda?`)}
        onRefund={() => void setStatus(detail.id, 'refunded', 'Marcar como reembolsado? Faça a devolução do Pix no app do banco antes; este botão só registra.')}
        onAnonymize={() => { if (window.confirm(`Anonimizar os dados de ${detail.client_name}? Isso apaga nome, telefone, e-mail e observações dos agendamentos encerrados dessa cliente e NÃO pode ser desfeito.`)) void act(async () => { await adminAnonymize(token, detail.client_phone); setModal(null) }) }} />}
      <button onClick={() => setShowPriv(true)} className="fixed bottom-4 left-4 z-30 rounded-full border border-white/20 bg-ink/90 px-4 py-2 text-xs text-white/80">Privacidade{privacy.filter(r => r.status === 'aberta').length ? ` (${privacy.filter(r => r.status === 'aberta').length})` : ''}</button>
      {(() => { const rq = (appts ?? []).filter(a => a.change_request && (a.status === 'pending' || a.status === 'confirmed')); return rq.length ? <button onClick={() => setModal({ t: 'detail', id: rq[0].id })} className="fixed bottom-4 left-36 z-30 rounded-full border border-amber-300/50 bg-ink/90 px-4 py-2 text-xs text-amber-200">Pedidos de cliente ({rq.length})</button> : null })()}
      {showPriv && <PrivacyModal reqs={privacy} onClose={() => setShowPriv(false)} onSet={(id, st) => void adminSetPrivacy(token, id, st).then(() => adminPrivacy(token)).then(setPrivacy)} />}
    </>
  )
}
