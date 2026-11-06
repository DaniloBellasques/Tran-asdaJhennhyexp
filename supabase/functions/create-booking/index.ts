// Cria a reserva (pendente) e o Pix copia-e-cola para a chave da Jhenny (confirmação manual no painel).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { ALL_SLOTS, quote } from '../_shared/catalog.ts'
import { cors, json, readJson } from '../_shared/http.ts'
import { clientIp, rateLimit } from '../_shared/guard.ts'
import { pixPayload } from '../_shared/pix.ts'
import { workEnd } from '../_shared/schedule.ts'

const PIX_MINUTES = 15
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const limited = await rateLimit(sb, 'cb-ip', clientIp(req), 10, 3600)
  if (limited) return limited

  const b = await readJson(req)
  if (!b) return json({ error: 'Requisição inválida' }, 400)

  const requestId = String(b.requestId ?? '')
  if (!UUID.test(requestId)) return json({ error: 'Requisição inválida' }, 400)
  if (b.acceptedTerms !== true) return json({ error: 'Aceite os Termos de Uso para continuar.' }, 400)
  const termsVersion = String(b.termsVersion ?? '').slice(0, 20) || null

  const name = String(b.name ?? '').trim()
  const phone = String(b.phone ?? '').replace(/\D/g, '')
  const email = String(b.email ?? '').trim().toLowerCase()
  const notes = String(b.notes ?? '').trim().slice(0, 600)
  if (name.length < 2 || name.length > 120) return json({ error: 'Nome inválido' }, 400)
  if (phone.length < 10 || phone.length > 11) return json({ error: 'WhatsApp inválido' }, 400)
  if (email && (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return json({ error: 'E-mail inválido' }, 400)

  // repetição do mesmo envio (falha de rede / duplo clique): devolve a reserva já criada
  const { data: prev } = await sb.from('appointments')
    .select('id, access_token, price, signal, pix_copy_paste, pix_expires_at, status').eq('request_id', requestId).maybeSingle()
  if (prev) {
    if (prev.status === 'pending' || prev.status === 'confirmed') {
      return json({ id: prev.id, token: prev.access_token, price: prev.price, signal: prev.signal, pixCopyPaste: prev.pix_copy_paste, expiresAt: prev.pix_expires_at })
    }
    return json({ error: 'Esta reserva não está mais disponível. Escolha o horário novamente.' }, 409)
  }

  const limitedPhone = await rateLimit(sb, 'cb-ph', phone, 5, 3600)
  if (limitedPhone) return limitedPhone

  const q = quote({
    styleId: String(b.styleId ?? ''), lengthId: String(b.lengthId ?? ''), thicknessId: String(b.thicknessId ?? ''), volumeId: String(b.volumeId ?? ''),
    ownMaterial: !!b.ownMaterial, addonIds: Array.isArray(b.addonIds) ? b.addonIds.slice(0, 10).map(String) : [],
  })
  if (!q) return json({ error: 'Serviço inválido' }, 400)

  // data/hora no fuso de São Paulo (UTC-3, sem horário de verão)
  const date = String(b.date ?? ''), time = String(b.time ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !ALL_SLOTS.includes(time)) return json({ error: 'Horário inválido' }, 400)
  const start = new Date(`${date}T${time}:00-03:00`)
  if (isNaN(start.getTime())) return json({ error: 'Data inválida' }, 400)
  if (new Date(`${date}T12:00:00-03:00`).getUTCDay() === 0) return json({ error: 'Fechado aos domingos' }, 400)
  const now = Date.now()
  if (start.getTime() < now + 3600e3 || start.getTime() > now + 31 * 86400e3) return json({ error: 'Data fora do período de agendamento' }, 400)
  // o atendimento ocupa a agenda pelo tempo de trabalho (pula almoço e domingos; segue no dia útil seguinte)
  const end = new Date(workEnd(start.getTime(), q.duration))

  const key = Deno.env.get('PIX_KEY'), pname = Deno.env.get('PIX_NAME'), pcity = Deno.env.get('PIX_CITY')
  if (!key || !pname || !pcity) {
    console.error('PIX_KEY/PIX_NAME/PIX_CITY não configurados')
    return json({ error: 'Pagamento indisponível no momento.' }, 503)
  }

  await sb.rpc('expire_stale')
  // uma reserva Pix pendente por telefone (evita bloquear o próprio horário ao voltar e reenviar)
  await sb.from('appointments').update({ status: 'cancelled' }).eq('status', 'pending').eq('client_phone', phone)

  const pixExpires = new Date(now + PIX_MINUTES * 60000)
  const { data: appt, error } = await sb.from('appointments').insert({
    request_id: requestId, terms_accepted_at: new Date().toISOString(), terms_version: termsVersion,
    client_name: name, client_phone: phone, client_email: email || null, notes: notes || null,
    style_id: b.styleId, length_id: b.lengthId, thickness_id: b.thicknessId, volume_id: b.volumeId,
    own_material: !!b.ownMaterial, addon_ids: q.addons, price: q.price, signal: q.signal, duration_min: q.duration,
    start_at: start.toISOString(), end_at: end.toISOString(), pix_expires_at: pixExpires.toISOString(),
  }).select('id, access_token').single()

  if (error) {
    if (error.code === '23P01') return json({ error: 'slot_taken' }, 409)
    if (error.code === '23505') return json({ error: 'Tente novamente.' }, 409) // corrida do mesmo request_id
    console.error('insert', error.code); return json({ error: 'Não foi possível reservar' }, 500)
  }

  // Pix direto para a chave da Jhenny (valor calculado aqui, no servidor)
  const code = pixPayload({ key, name: pname, city: pcity, amount: q.signal, txid: 'TJ' + appt.id.replace(/-/g, '').slice(0, 23) })
  await sb.from('appointments').update({ pix_copy_paste: code }).eq('id', appt.id)

  return json({ id: appt.id, token: appt.access_token, price: q.price, signal: q.signal, pixCopyPaste: code, expiresAt: pixExpires.toISOString() })
})
