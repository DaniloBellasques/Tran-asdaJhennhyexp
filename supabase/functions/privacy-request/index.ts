// Canal de direitos da titular (LGPD): registra o pedido; a Jhenny confirma a identidade antes de atender.
// A resposta nunca revela se existem dados da pessoa (evita que terceiros descubram informações).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors, json, readJson } from '../_shared/http.ts'
import { clientIp, rateLimit } from '../_shared/guard.ts'

const KINDS = ['acesso', 'correcao', 'exclusao', 'portabilidade', 'outro']
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const limited = await rateLimit(sb, 'pr-ip', clientIp(req), 3, 86400)
  if (limited) return limited
  const b = await readJson(req)
  if (!b) return json({ error: 'Requisição inválida' }, 400)

  const kind = String(b.kind ?? '')
  const phone = String(b.phone ?? '').replace(/\D/g, '')
  const email = String(b.email ?? '').trim().toLowerCase()
  const message = String(b.message ?? '').trim().slice(0, 1000)
  if (!KINDS.includes(kind)) return json({ error: 'Escolha o tipo de pedido.' }, 400)
  if (phone && (phone.length < 10 || phone.length > 11)) return json({ error: 'WhatsApp inválido.' }, 400)
  if (email && (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return json({ error: 'E-mail inválido.' }, 400)
  if (!phone && !email) return json({ error: 'Informe um WhatsApp ou e-mail para contato.' }, 400)

  const { error } = await sb.from('privacy_requests').insert({ kind, contact_phone: phone || null, contact_email: email || null, message: message || null })
  if (error) { console.error('privacy', error.code); return json({ error: 'Não foi possível registrar. Tente novamente.' }, 500) }
  return json({ ok: true })
})
