// CORS restrito ao site (defina ALLOWED_ORIGIN) e respostas sem cache.
const origin = Deno.env.get('ALLOWED_ORIGIN') ?? '*'
export const cors = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })

/** Lê o corpo JSON com limite de tamanho (evita abusos). */
export async function readJson(req: Request, maxBytes = 8192): Promise<Record<string, any> | null> {
  const len = Number(req.headers.get('content-length') ?? 0)
  if (len > maxBytes) return null
  try {
    const text = await req.text()
    if (text.length > maxBytes) return null
    const v = JSON.parse(text)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null
  } catch { return null }
}
