// ═══════════════════════════════════════════════════════════════
// Suite dorada de comprensión — Nüra 2
// Ejecuta el pipeline REAL (analyzeNeed + matchHelpers) contra un
// set de consultas humanas con expectativas en vocabulario de app.
// Rojo = la comprensión se ha degradado. No pushear en rojo.
// Uso: npm run test:matching
// ═══════════════════════════════════════════════════════════════
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const stage = '/tmp/nura-golden'
rmSync(stage, { recursive: true, force: true })
mkdirSync(join(stage, 'utils'), { recursive: true })
mkdirSync(join(stage, 'data'), { recursive: true })
cpSync(join(root, 'src/utils'), join(stage, 'utils'), { recursive: true })
cpSync(join(root, 'src/data'), join(stage, 'data'), { recursive: true })
for (const dir of ['utils', 'data']) {
  for (const f of readdirSync(join(stage, dir))) {
    if (!f.endsWith('.js')) continue
    const p = join(stage, dir, f)
    writeFileSync(p, readFileSync(p, 'utf8').replace(/from '(\.\.?\/[^']+?)(?<!\.js)'/g, "from '$1.js'"))
  }
}

const { analyzeNeed, matchHelpers } = await import(join(stage, 'utils/matching.js'))

const ALIAS = { matematicas: 'clases', limpieza: 'hogar' }
const cat_ = c => ALIAS[c] || c

const GOLDEN = [
  { q: 'Sesión de entrenamiento personal', cat: 'entrenador' },
  { q: 'Necesito un cerrajero urgente', cat: 'tecnico' },
  { q: 'Logopeda infantil', cat: 'logopedia' },
  { q: 'Alguien que cuide a mi madre por las mañanas', cat: 'cuidado' },
  { q: 'Profesor de inglés online', cat: 'clases' },
  { q: 'Psicóloga cerca de mí', cat: 'salud' },
  { q: 'Electricista para revisar una instalación', cat: 'tecnico' },
  { q: 'Limpieza semanal del hogar', cat: 'hogar' },
  { q: 'Abogado laboralista', cat: 'legal' },
  { q: 'Paseador de perros', cat: 'mascotas' },
  { q: 'fisioterapeuta a domicilio', cat: 'salud' },
  { q: 'mi madre tiene alzheimer y vive sola, necesito ayuda las mañanas', cat: 'cuidado' },
  { q: 'clases de inglés para mi hija', cat: 'clases' },
  { q: 'fontanero urgente, tengo una fuga en la cocina', cat: 'tecnico' },
  { q: 'reforma del baño, busco presupuesto', cat: 'hogar' },
  { q: 'cuidar a mi gato el fin de semana', cat: 'mascotas' },
  { q: 'una cuidadora con experiencia para mi padre', cat: 'cuidado' },
  { q: 'entrenadora para volver a ponerme en forma', cat: 'entrenador' },
  { q: 'cuidado de mascotas', cat: 'mascotas' },
  { q: 'cuidado de niños por las tardes', cat: 'cuidado' },
  { q: 'pasear a mi abuela por el parque', cat: 'cuidado' },
  { q: 'alguien que cuide de mi perro este finde', cat: 'mascotas' },
  { q: 'profesor particular para mi hijo', cat: 'clases' },
  { q: 'cuidar el jardín semanalmente', cat: 'hogar' },
]
const HONESTY = ['asdfgh qwerty zzz', 'necesito algo no sé muy bien qué']
const NEGATIVE = [
  { q: 'Sesión de entrenamiento personal', forbid: 'tecnico' },
  { q: 'Abogado laboralista', forbid: 'salud' },
  { q: 'Profesor de inglés online', forbid: 'cuidado' },
  { q: 'Necesito un cerrajero urgente', forbid: 'entrenador' },
  { q: 'cuidado de mascotas', forbid: 'cuidado' },
  { q: 'pasear a mi abuela por el parque', forbid: 'mascotas' },
]

let failed = 0
for (const t of GOLDEN) {
  const a = await analyzeNeed(t.q)
  const m = await matchHelpers(a, 4)
  const catOk = a.categoria === t.cat
  const nonEmpty = (m?.length || 0) > 0
  const allCompat = nonEmpty && m.every(x => cat_(x.category) === t.cat)
  const ok = catOk && nonEmpty && allCompat
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} ${t.q.slice(0, 46).padEnd(46)} → ${a.categoria}${catOk ? '' : `≠${t.cat}`} · ${m?.length || 0}${allCompat ? '' : ' [INCOMPATIBLES]'}`)
}
for (const q of HONESTY) {
  const a = await analyzeNeed(q)
  const m = await matchHelpers(a, 4)
  const ok = a.categoria === 'otro' && (m?.length || 0) === 0
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} [honestidad] ${q.slice(0, 34).padEnd(34)} → ${a.categoria} · ${m?.length || 0} tarjetas`)
}
for (const t of NEGATIVE) {
  const a = await analyzeNeed(t.q)
  const m = await matchHelpers(a, 4)
  const ok = !(m || []).some(x => cat_(x.category) === t.forbid)
  if (!ok) failed++
  console.log(`${ok ? '✓' : '✗'} [negativa] ${t.q.slice(0, 34).padEnd(34)} sin ${t.forbid}`)
}
console.log(failed === 0 ? `\n✅ SUITE v2 VERDE — ${GOLDEN.length + HONESTY.length + NEGATIVE.length}/${GOLDEN.length + HONESTY.length + NEGATIVE.length}` : `\n❌ ${failed} FALLOS`)
process.exit(failed === 0 ? 0 : 1)
