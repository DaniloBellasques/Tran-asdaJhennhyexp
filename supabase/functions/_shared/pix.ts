// Pix "copia e cola" estático (BR Code) com valor — idêntico em supabase/functions/_shared/pix.ts.
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim()
const f = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v

export function crc16(s: string) {
  let crc = 0xffff
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function pixPayload(o: { key: string; name: string; city: string; amount: number; txid: string }) {
  const txid = o.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***'
  const body =
    f('00', '01') + f('01', '11') +
    f('26', f('00', 'br.gov.bcb.pix') + f('01', o.key.trim())) +
    f('52', '0000') + f('53', '986') + f('54', o.amount.toFixed(2)) + f('58', 'BR') +
    f('59', (strip(o.name) || 'RECEBEDOR').slice(0, 25)) + f('60', (strip(o.city) || 'SAO PAULO').slice(0, 15)) +
    f('62', f('05', txid)) + '6304'
  return body + crc16(body)
}
