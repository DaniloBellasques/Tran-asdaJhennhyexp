// Catálogo e regras de preço — espelho de src/BraidCalculator.tsx.
// O servidor recalcula tudo: o navegador nunca decide o valor cobrado.
export const STYLES: Record<string, { name: string; basePrice: number; baseTime: number }> = {
  box: { name: 'Box Braids', basePrice: 200, baseTime: 240 },
  goddess: { name: 'Goddess Braids', basePrice: 250, baseTime: 300 },
  gypsy: { name: 'Gypsy Braids', basePrice: 280, baseTime: 330 },
  nago: { name: 'Nagô', basePrice: 180, baseTime: 150 },
}
export const LENGTHS: Record<string, { priceMult: number; timeMult: number }> = {
  ombro: { priceMult: 1.0, timeMult: 1.0 },
  costas: { priceMult: 1.2, timeMult: 1.3 },
  cintura: { priceMult: 1.4, timeMult: 1.6 },
  bumbum: { priceMult: 1.65, timeMult: 1.9 },
}
export const THICKNESSES: Record<string, { priceMult: number; timeMult: number }> = {
  grossa: { priceMult: 0.85, timeMult: 0.75 },
  media: { priceMult: 1.0, timeMult: 1.0 },
  fina: { priceMult: 1.2, timeMult: 1.3 },
  micro: { priceMult: 1.55, timeMult: 1.8 },
}
export const VOLUMES: Record<string, { priceAdd: number }> = {
  pouco: { priceAdd: 0 }, medio: { priceAdd: 30 }, volumoso: { priceAdd: 60 },
}
export const ADDONS: Record<string, { price: number }> = {
  touca: { price: 25 }, mousse: { price: 35 },
}
export const ALL_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30']

export function quote(i: { styleId: string; lengthId: string; thicknessId: string; volumeId: string; ownMaterial: boolean; addonIds: string[] }) {
  const s = STYLES[i.styleId], l = LENGTHS[i.lengthId], t = THICKNESSES[i.thicknessId], v = VOLUMES[i.volumeId]
  if (!s || !l || !t || !v) return null
  const addons = [...new Set(i.addonIds)]
  if (addons.some(a => !ADDONS[a])) return null
  let p = s.basePrice * l.priceMult * t.priceMult + v.priceAdd
  if (!i.ownMaterial) p += 60
  addons.forEach(a => { p += ADDONS[a].price })
  const price = Math.round(p)
  return { price, signal: Math.round(price * 0.3), duration: Math.round(s.baseTime * l.timeMult * t.timeMult), styleName: s.name, addons }
}
