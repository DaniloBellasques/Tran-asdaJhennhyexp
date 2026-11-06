// Camada de dados. Se as variáveis do Supabase não estiverem definidas, o site
// roda em modo demonstração (dados simulados), exatamente como antes.
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isLive = !!URL_ && !!KEY

// Pix direto na conta da Jhenny (sem gateway). Defina no .env; sem isso o Pix é só demonstração.
const PIX_KEY_ENV = (import.meta.env.VITE_PIX_KEY as string | undefined)?.trim()
export const PIX_CONF = {
  key: PIX_KEY_ENV ?? '',
  name: (import.meta.env.VITE_PIX_NAME as string | undefined) ?? '',
  city: (import.meta.env.VITE_PIX_CITY as string | undefined) ?? '',
}
/** true quando o Pix é real: a chave está configurada (site) ou o banco gera o código (servidor). */
export const directPix = isLive || (!!PIX_CONF.key && !!PIX_CONF.name && !!PIX_CONF.city)

const base = { apikey: KEY ?? '', 'Content-Type': 'application/json' }

export type BookingInput = {
  name: string; phone: string; email: string; notes: string
  styleId: string; lengthId: string; thicknessId: string; volumeId: string
  ownMaterial: boolean; addonIds: string[]
  date: string; time: string
  requestId: string; acceptedTerms: boolean; termsVersion: string
}
export type BookingResult = { id: string; token: string; price: number; signal: number; pixCopyPaste: string; expiresAt: string }

export class ApiError extends Error { constructor(public code: string, msg: string) { super(msg) } }

export const pad = (n: number) => String(n).padStart(2, '0')
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Intervalos ocupados (sem dados pessoais) entre duas datas. */
export async function fetchBusy(from: Date, to: Date): Promise<{ start: number; end: number }[]> {
  const r = await fetch(`${URL_}/rest/v1/rpc/busy_slots`, {
    method: 'POST', headers: { ...base, Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ from_ts: from.toISOString(), to_ts: to.toISOString() }),
  })
  if (!r.ok) throw new ApiError('busy', 'Não foi possível carregar os horários.')
  const rows: { start_at: string; end_at: string }[] = await r.json()
  return rows.map(x => ({ start: Date.parse(x.start_at), end: Date.parse(x.end_at) }))
}

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const r = await fetch(`${URL_}/functions/v1/create-booking`, {
    method: 'POST', headers: { ...base, Authorization: `Bearer ${KEY}` }, body: JSON.stringify(input),
  })
  const body = await r.json().catch(() => ({}))
  if (r.status === 409) throw new ApiError('slot_taken', 'Esse horário acabou de ser reservado. Escolha outro.')
  if (!r.ok) throw new ApiError('create', body?.error || 'Não foi possível concluir. Tente novamente.')
  return body as BookingResult
}

/** A cliente avisa que pagou; a reserva fica retida até a Jhenny confirmar. */
export async function claimPaid(id: string, token: string): Promise<void> {
  const r = await fetch(`${URL_}/functions/v1/claim-paid`, { method: 'POST', headers: { ...base, Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ id, token }) })
  if (!r.ok) throw new ApiError('claim', r.status === 409 ? 'O tempo da reserva acabou. Escolha o horário novamente.' : 'Não foi possível avisar o pagamento. Tente novamente.')
}

const fnPost = (name: string, body: unknown) =>
  fetch(`${URL_}/functions/v1/${name}`, { method: 'POST', headers: { ...base, Authorization: `Bearer ${KEY}` }, body: JSON.stringify(body) })

/** Status simples (token vai no corpo, nunca na URL). */
export async function bookingStatus(id: string, token: string): Promise<string> {
  const r = await fnPost('manage-booking', { id, token, action: 'status' })
  if (!r.ok) return 'pending'
  return (await r.json()).status as string
}

export type MyBooking = {
  status: Appt['status']; styleId: string; price: number; signal: number; durationMin: number
  startAt: string; endAt: string; paidClaimed: boolean; changeRequest: 'cancel' | 'reschedule' | null; changeRequestedAt: string | null
}
export async function myBooking(id: string, token: string): Promise<MyBooking> {
  const r = await fnPost('manage-booking', { id, token, action: 'status' })
  if (!r.ok) throw new ApiError('nf', 'Agendamento não encontrado. Confira o link recebido.')
  return r.json()
}
/** Pedido de cancelamento/remarcação: não cancela sozinho; a Jhenny analisa e responde. */
export async function requestChange(id: string, token: string, kind: 'cancel' | 'reschedule', message: string) {
  const r = await fnPost('manage-booking', { id, token, action: kind === 'cancel' ? 'request_cancel' : 'request_reschedule', message })
  const b = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError('chg', b?.error || 'Não foi possível enviar o pedido.')
}

/** Pedido de direitos da titular (LGPD). */
export async function sendPrivacyRequest(p: { kind: string; phone: string; email: string; message: string }) {
  const r = await fnPost('privacy-request', p)
  const b = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError('priv', b?.error || 'Não foi possível enviar. Tente novamente.')
}

/** Recuperação de senha do painel (e-mail enviado pelo Supabase Auth). */
export async function adminRecover(email: string) {
  await fetch(`${URL_}/auth/v1/recover`, { method: 'POST', headers: base, body: JSON.stringify({ email }) }).catch(() => {})
}
export async function adminSetPassword(token: string, password: string) {
  const r = await fetch(`${URL_}/auth/v1/user`, { method: 'PUT', headers: { ...base, Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) })
  if (!r.ok) throw new ApiError('pw', 'Não foi possível definir a senha (mínimo 10 caracteres).')
}
/** Encerra a sessão também no servidor. */
export async function adminLogout(token: string) {
  await fetch(`${URL_}/auth/v1/logout`, { method: 'POST', headers: { ...base, Authorization: `Bearer ${token}` } }).catch(() => {})
}

// ─── Admin (login Supabase Auth; leitura/edição protegidas por RLS) ───────────
export type Appt = {
  id: string; client_name: string; client_phone: string; client_email: string | null; notes: string | null
  style_id: string; length_id: string; thickness_id: string; volume_id: string; own_material: boolean; addon_ids: string[]
  price: number; signal: number; duration_min: number
  paid_claimed_at: string | null; pix_expires_at: string | null
  start_at: string; end_at: string; status: 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'needs_review' | 'refunded'
  change_request: 'cancel' | 'reschedule' | null; change_request_note: string | null; change_requested_at: string | null
}

export async function adminLogin(email: string, password: string): Promise<string> {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: 'POST', headers: base, body: JSON.stringify({ email, password }) })
  const b = await r.json().catch(() => ({}))
  if (!r.ok || !b.access_token) throw new ApiError('auth', 'E-mail ou senha incorretos.')
  return b.access_token as string
}

export async function adminList(token: string): Promise<Appt[]> {
  const from = new Date(Date.now() - 180 * 86400e3).toISOString() // histórico para faturamento, clientes e estilos
  const r = await fetch(`${URL_}/rest/v1/appointments?select=*&start_at=gte.${from}&order=start_at.asc`, { headers: { ...base, Authorization: `Bearer ${token}` } })
  if (r.status === 401) throw new ApiError('auth', 'Sessão expirada.')
  if (!r.ok) throw new ApiError('list', 'Não foi possível carregar os agendamentos.')
  return r.json()
}

export async function adminSetStatus(token: string, id: string, status: Appt['status']) {
  const r = await fetch(`${URL_}/rest/v1/appointments?id=eq.${id}`, {
    method: 'PATCH', headers: { ...base, Authorization: `Bearer ${token}`, Prefer: 'return=minimal' }, body: JSON.stringify({ status }),
  })
  if (!r.ok) throw new ApiError('update', 'Não foi possível atualizar.')
}

// ─── Admin: bloqueios e agendamento manual ────────────────────────────────────
export type Block = { id: string; start_at: string; end_at: string; reason: string | null }
const authH = (t: string) => ({ ...base, Authorization: `Bearer ${t}` })

export async function adminBlocks(token: string): Promise<Block[]> {
  const from = new Date(Date.now() - 7 * 86400e3).toISOString()
  const r = await fetch(`${URL_}/rest/v1/blocks?select=*&end_at=gte.${from}&order=start_at.asc`, { headers: authH(token) })
  if (r.status === 401) throw new ApiError('auth', 'Sessão expirada.')
  if (!r.ok) throw new ApiError('list', 'Não foi possível carregar os bloqueios.')
  return r.json()
}
export async function adminAddBlock(token: string, b: { start_at: string; end_at: string; reason: string }) {
  const r = await fetch(`${URL_}/rest/v1/blocks`, { method: 'POST', headers: { ...authH(token), Prefer: 'return=minimal' }, body: JSON.stringify({ ...b, reason: b.reason || null }) })
  if (!r.ok) throw new ApiError('block', 'Não foi possível criar o bloqueio.')
}
export async function adminRemoveBlock(token: string, id: string) {
  const r = await fetch(`${URL_}/rest/v1/blocks?id=eq.${id}`, { method: 'DELETE', headers: authH(token) })
  if (!r.ok) throw new ApiError('block', 'Não foi possível remover o bloqueio.')
}
export async function adminAddAppointment(token: string, a: Record<string, unknown>) {
  const r = await fetch(`${URL_}/rest/v1/appointments`, { method: 'POST', headers: { ...authH(token), Prefer: 'return=minimal' }, body: JSON.stringify(a) })
  if (r.status === 409 || (await r.clone().text()).includes('23P01')) throw new ApiError('slot_taken', 'Esse horário já está ocupado.')
  if (!r.ok) throw new ApiError('add', 'Não foi possível salvar o agendamento.')
}

export type PrivacyReq = { id: string; created_at: string; kind: string; contact_phone: string | null; contact_email: string | null; message: string | null; status: 'aberta' | 'em_andamento' | 'concluida' | 'recusada' }
export async function adminPrivacy(token: string): Promise<PrivacyReq[]> {
  const r = await fetch(`${URL_}/rest/v1/privacy_requests?select=*&order=created_at.desc&limit=100`, { headers: authH(token) })
  if (!r.ok) throw new ApiError('list', 'Não foi possível carregar os pedidos de privacidade.')
  return r.json()
}
export async function adminSetPrivacy(token: string, id: string, status: PrivacyReq['status']) {
  const r = await fetch(`${URL_}/rest/v1/privacy_requests?id=eq.${id}`, { method: 'PATCH', headers: { ...authH(token), Prefer: 'return=minimal' }, body: JSON.stringify({ status }) })
  if (!r.ok) throw new ApiError('update', 'Não foi possível atualizar.')
}
export async function adminAnonymize(token: string, phone: string): Promise<number> {
  const r = await fetch(`${URL_}/rest/v1/rpc/anonymize_client`, { method: 'POST', headers: authH(token), body: JSON.stringify({ p_phone: phone }) })
  if (!r.ok) throw new ApiError('anon', 'Não foi possível anonimizar.')
  return Number(await r.json())
}
