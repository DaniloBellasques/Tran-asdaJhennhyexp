// Acompanhamento da cliente (id + token secreto): status e pedidos de cancelamento/remarcação.
// Os pedidos NÃO cancelam nada sozinhos: a Jhenny analisa e responde (regras de cancelamento/reembolso são dela).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors, json, readJson } from '../_shared/http.ts'
import { clientIp, rateLimit } from '../_shared/guard.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const b = await readJson(req)
  if (!b) return json({ error: 'Requisição inválida' }, 400)
  const id = String(b.id ?? ''), token = String(b.token ?? ''), action = String(b.action ?? 'status')
  if (!UUID.test(id) || !UUID.test(token)) return json({ error: 'não encontrado' }, 404)

  const limited = await rateLimit(sb, action === 'status' ? 'mb-st' : 'mb-rq', clientIp(req), action === 'status' ? 1200 : 10, 3600)
  if (limited) return limited

  const { data: a } = await sb.from('appointments')
    .select('id, status, style_id, price, signal, duration_min, start_at, end_at, pix_expires_at, paid_claimed_at, change_request, change_requested_at')
    .eq('id', id).eq('access_token', token).maybeSingle()
  if (!a) return json({ error: 'não encontrado' }, 404)

  if (action === 'request_cancel' || action === 'request_reschedule') {
    if (a.status !== 'pending' && a.status !== 'confirmed') return json({ error: 'Este agendamento não pode mais ser alterado por aqui.' }, 409)
    if (new Date(a.start_at).getTime() < Date.now()) return json({ error: 'O horário já passou.' }, 409)
    const note = String(b.message ?? '').trim().slice(0, 600)
    const { error } = await sb.from('appointments').update({
      change_request: action === 'request_cancel' ? 'cancel' : 'reschedule', change_request_note: note || null, change_requested_at: new Date().toISOString(),
    }).eq('id', id).eq('access_token', token)
    if (error) { console.error('request', error.code); return json({ error: 'Não foi possível registrar o pedido.' }, 500) }
    return json({ ok: true })
  }
  if (action !== 'status') return json({ error: 'Requisição inválida' }, 400)

  const expired = a.status === 'pending' && !a.paid_claimed_at && new Date(a.pix_expires_at).getTime() < Date.now()
  return json({
    status: expired ? 'expired' : a.status, styleId: a.style_id, price: a.price, signal: a.signal, durationMin: a.duration_min,
    startAt: a.start_at, endAt: a.end_at, paidClaimed: !!a.paid_claimed_at, changeRequest: a.change_request, changeRequestedAt: a.change_requested_at,
  })
})
