// Gerador de QR Code (modo byte, correção M, versões 1–12) sem dependências.
// Estrutura baseada no padrão ISO/IEC 18004.
const BLOCKS: [number, number, number, number, number][] = [
  // [EC por bloco, blocos G1, dados G1, blocos G2, dados G2] — nível M, versões 1..12
  [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0], [16, 4, 27, 0, 0],
  [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44], [30, 1, 50, 4, 51], [22, 6, 36, 2, 37],
]
const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58]]

const EXP = new Uint8Array(512), LOG = new Uint8Array(256)
;(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255] })()
const mul = (a: number, b: number) => (a && b ? EXP[LOG[a] + LOG[b]] : 0)

function rsEncode(data: number[], ecLen: number): number[] {
  let gen = [1]
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0)
    gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, EXP[i]) })
    gen = next
  }
  const res = new Array(ecLen).fill(0)
  for (const d of data) {
    const f = d ^ res[0]
    res.shift(); res.push(0)
    if (f) for (let i = 0; i < ecLen; i++) res[i] ^= mul(gen[i + 1], f)
  }
  return res
}

export function qrMatrix(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text))
  let ver = 0
  for (let v = 1; v <= 12; v++) {
    const [, g1, d1, g2, d2] = BLOCKS[v - 1]
    const cap = g1 * d1 + g2 * d2
    if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= cap * 8) { ver = v; break }
  }
  if (!ver) throw new Error('Texto longo demais para o QR Code')
  const [ecLen, g1, d1, g2, d2] = BLOCKS[ver - 1]
  const capBits = (g1 * d1 + g2 * d2) * 8

  // bits de dados
  const bits: number[] = []
  const push = (v: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1) }
  push(4, 4); push(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => push(b, 8))
  push(0, Math.min(4, capBits - bits.length))
  while (bits.length % 8) bits.push(0)
  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2))
  for (let p = 0xec; data.length < capBits / 8; p ^= 0xec ^ 0x11) data.push(p)

  // blocos + correção de erros, intercalados
  const blocks: number[][] = []
  let pos = 0
  for (let i = 0; i < g1 + g2; i++) { const n = i < g1 ? d1 : d2; blocks.push(data.slice(pos, pos + n)); pos += n }
  const ecs = blocks.map(b => rsEncode(b, ecLen))
  const out: number[] = []
  const maxD = Math.max(d1, d2)
  for (let i = 0; i < maxD; i++) blocks.forEach(b => { if (i < b.length) out.push(b[i]) })
  for (let i = 0; i < ecLen; i++) ecs.forEach(e => out.push(e[i]))

  // matriz
  const size = 17 + 4 * ver
  const m: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const fn: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false))
  const set = (x: number, y: number, v: boolean) => { m[y][x] = v; fn[y][x] = true }

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0) }
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy
      if (x < 0 || y < 0 || x >= size || y >= size) continue
      set(x, y, Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4)
    }
  }
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4)
  const ap = ALIGN[ver - 1]
  ap.forEach((cy, i) => ap.forEach((cx, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === ap.length - 1) || (i === ap.length - 1 && j === 0)) return
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }))

  const drawFormat = (mask: number) => {
    const d = (0 << 3) | mask // nível M = 00
    let rem = d
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const f = ((d << 10) | rem) ^ 0x5412
    const bit = (i: number) => ((f >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) set(8, i, bit(i))
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8))
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i))
    set(8, size - 8, true)
  }
  drawFormat(0) // reserva as áreas
  if (ver >= 7) {
    let rem = ver
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const v = (ver << 12) | rem
    for (let i = 0; i < 18; i++) {
      const bit = ((v >>> i) & 1) === 1, a = size - 11 + (i % 3), b = Math.floor(i / 3)
      set(a, b, bit); set(b, a, bit)
    }
  }

  // dados em zigue-zague
  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, upward = ((right + 1) & 2) === 0, y = upward ? size - 1 - vert : vert
      if (!fn[y][x] && i < out.length * 8) { m[y][x] = ((out[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++ }
    }
  }

  const masks = [
    (x: number, y: number) => (x + y) % 2 === 0, (_: number, y: number) => y % 2 === 0, (x: number) => x % 3 === 0,
    (x: number, y: number) => (x + y) % 3 === 0, (x: number, y: number) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x: number, y: number) => ((x * y) % 2) + ((x * y) % 3) === 0, (x: number, y: number) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x: number, y: number) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ]
  const applyMask = (k: number) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[k](x, y)) m[y][x] = !m[y][x] }
  const penalty = () => {
    let p = 0, dark = 0
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (m[y][x]) dark++
      if (x < size - 1 && y < size - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3
    }
    for (let a = 0; a < size; a++) for (const horiz of [true, false]) {
      let run = 1
      for (let b = 1; b < size; b++) {
        const cur = horiz ? m[a][b] : m[b][a], prev = horiz ? m[a][b - 1] : m[b - 1][a]
        if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++ } else run = 1
      }
    }
    return p + Math.floor(Math.abs((dark * 20) / (size * size) - 10)) * 10
  }
  let best = 0, bestP = Infinity
  for (let k = 0; k < 8; k++) { applyMask(k); drawFormat(k); const p = penalty(); if (p < bestP) { bestP = p; best = k } applyMask(k) }
  applyMask(best); drawFormat(best)
  return m
}

/** Caminho SVG (um único <path>) com zona de silêncio de 4 módulos. */
export function qrPath(text: string): { d: string; size: number } {
  const m = qrMatrix(text), q = 4
  let d = ''
  m.forEach((row, y) => { let x = 0; while (x < row.length) { if (row[x]) { let w = 1; while (x + w < row.length && row[x + w]) w++; d += `M${x + q} ${y + q}h${w}v1h-${w}z`; x += w } else x++ } })
  return { d, size: m.length + q * 2 }
}
