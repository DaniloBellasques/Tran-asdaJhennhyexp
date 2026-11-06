// Agenda por tempo de trabalho. O atendimento ocupa a agenda pelo tempo que dura:
// segue pelo expediente, pula o intervalo do almoço e os domingos, e continua no dia útil seguinte.
// (O expediente vem dos horários já existentes no site: 09:00–12:00 e 13:00–17:00, fuso de São Paulo.)
// Este arquivo é idêntico a supabase/functions/_shared/schedule.ts.
const OFF = 3 * 3600e3 // São Paulo = UTC-3 (sem horário de verão)
const DAY = 86400e3
const SESSIONS: [number, number][] = [[540, 720], [780, 1020]] // minutos do dia

/** Trechos de trabalho por dia (início, fim) em ms UTC. */
export function workSegments(startMs: number, minutes: number): [number, number][] {
  const out: [number, number][] = []
  const shifted = startMs - OFF
  let dayStart = Math.floor(shifted / DAY) * DAY
  let minute = Math.round((shifted - dayStart) / 60000)
  let remaining = Math.max(1, Math.round(minutes))
  for (let guard = 0; guard < 120 && remaining > 0; guard++) {
    if (new Date(dayStart).getUTCDay() !== 0) {
      let segStart = -1, segEnd = -1
      for (const [a, b] of SESSIONS) {
        if (minute >= b || remaining <= 0) continue
        const cur = Math.max(minute, a), use = Math.min(b - cur, remaining)
        if (segStart < 0) segStart = cur
        segEnd = cur + use; remaining -= use; minute = segEnd
      }
      if (segStart >= 0) out.push([dayStart + segStart * 60000 + OFF, dayStart + segEnd * 60000 + OFF])
    }
    dayStart += DAY; minute = 0
  }
  return out
}

export function workEnd(startMs: number, minutes: number): number {
  const s = workSegments(startMs, minutes)
  return s.length ? s[s.length - 1][1] : startMs + minutes * 60000
}

/** Instante de um dia (AAAA-MM-DD) e horário (HH:MM) em São Paulo. */
export const slotMs = (ymd: string, hhmm: string) => new Date(`${ymd}T${hhmm}:00-03:00`).getTime()
