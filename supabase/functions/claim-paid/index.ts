// A cliente avisa "já paguei": a reserva fica retida por mais tempo até a Jhenny confirmar no painel.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { cors, json, readJson } from '../_shared/http.ts'
import { clientIp, rateLimit } from '../_shared/guard.ts'

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
const HOLD_HOURS = 12

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)
  const limited = await rateLimit(sb, 'cp-ip', clientIp(req), 30, 3600)
  if (limited) return limited
  const b = (await readJson(req)) ?? {}
  const id = String(b.id ?? ''), token = String(b.token ?? '')
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuid.test(id) || !uuid.test(token)) return json({ error: 'parâmetros inválidos' }, 400)
  const until = new Date(Date.now() + HOLD_HOURS * 3600e3).toISOString()
  const { data } = await sb.from('appointments')
    .update({ paid_claimed_at: new Date().toISOString(), pix_expires_at: until })
    .eq('id', id).eq('access_token', token).eq('status', 'pending').gt('pix_expires_at', new Date().toISOString())
    .select('id').maybeSingle()
  if (!data) return json({ error: 'Reserva expirada ou não encontrada.' }, 409)
  return json({ ok: true })
})
