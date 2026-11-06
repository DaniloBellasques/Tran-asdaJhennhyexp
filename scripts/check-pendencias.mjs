// Lista os campos legais ainda não preenchidos em src/legalConfig.ts. Uso: node scripts/check-pendencias.mjs
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../src/legalConfig.ts', import.meta.url), 'utf8')
const body = src.slice(src.indexOf('export const LEGAL'))
const pend = [...body.matchAll(/^\s{2}(\w+):\s*'([^']*)',?\s*(?:\/\/\s*(.*))?$/gm)].filter(m => !m[2].trim())
if (!pend.length) console.log('Nenhuma pendência em legalConfig.ts.')
else { console.log(`${pend.length} campo(s) a preencher antes de publicar:`); pend.forEach(m => console.log(` - ${m[1]}  ${m[3] ?? ''}`)); process.exitCode = 1 }
