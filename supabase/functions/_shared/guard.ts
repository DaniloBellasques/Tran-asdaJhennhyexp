// Limite de requisições por visitante. Só guardamos um hash (com sal secreto), nunca o IP em texto.
import { json } from './http.ts'

async function sha256(s: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

export function clientIp(req: Request) {
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'desconhecido'
}

/** Devolve uma Response 429 quando o limite foi excedido; senão null. */
// deno-lint-ignore no-explicit-any
export async function rateLimit(sb: any, scope: string, id: string, max: number, windowSeconds: number): Promise<Response | null> {
  const key = scope + ':' + await sha256(id + '|' + (Deno.env.get('RATE_SALT') ?? ''))
  const { data, error } = await sb.rpc('consume_rate_limit', { p_key: key, p_max: max, p_window_seconds: windowSeconds })
  if (error) { console.error('rate_limit', error.code); return null } // falha do limitador não derruba o site
  return data === false ? json({ error: 'Muitas tentativas. Aguarde um pouco e tente novamente.' }, 429) : null
}
