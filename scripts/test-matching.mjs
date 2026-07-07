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

const GOLDEN = [
  { q: 'fisioterapeuta a domicilio', cat: 'salud' },
  { q: 'mi madre tiene alzheimer y vive sola, necesito ayuda las mañanas', cat: 'cuidado' },
  { q: 'clases de inglés para mi hija', cat: 'clases' },
  { q: 'mi hijo de 5 años no pronuncia bien la r', cat: 'logopedia' },
  { q: 'fontanero urgente, tengo una fuga en la cocina', cat: 'tecnico' },
  { q: 'necesito un abogado para un despido', cat: 'legal' },
  { q: 'alguien que pasee a mi perro entre semana', cat: 'mascotas' },
  { q: 'limpieza a fondo del piso antes de una mudanza', cat: 'hogar' },
  { q: 'entrenador personal para volver a ponerme en forma', cat: 'entrenador' },
  { q: 'profesor de matemáticas para selectividad', cat: 'clases' },
  { q: 'psicólogo para la ansiedad', cat: 'salud' },
  { q: 'electricista para revisar un enchufe que salta', cat: 'tecnico' },
  { q: 'canguro para mi bebé los viernes por la noche', cat: 'cuidado' },
  { q: 'reforma del baño, busco presupuesto', cat: 'hogar' },
  { q: 'cuidar a mi gato el fin de semana', cat: 'mascotas' },
  { q: 'gestor para la declaración de la renta', cat: 'legal' },
  { q: 'asdfgh qwerty zzz', cat: 'otro' },
]

let failed = 0
for (const t of GOLDEN) {
  const a = (await analyzeNeed(t.q)) || { categoria: 'otro', palabrasClave: t.q.split(' '), complexSignals: {} }
  const matches = await matchHelpers(a, 4)
  const catOk = a.categoria === t.cat
  const nonEmpty = (matches?.length || 0) > 0
  const ok = catOk && nonEmpty
  if (!ok) failed++
  const mark = ok ? '✓' : '✗'
  const detail = catOk ? '' : ` [cat=${a.categoria}≠${t.cat}]`
  const empty = nonEmpty ? '' : ' [SIN RESULTADOS]'
  console.log(`${mark} ${t.q.slice(0, 52).padEnd(52)} → ${a.categoria}${detail}${empty} · ${matches?.length || 0} matches`)
}
console.log(failed === 0 ? `\n✅ SUITE VERDE — ${GOLDEN.length}/${GOLDEN.length}` : `\n❌ ${failed} FALLOS de ${GOLDEN.length}`)
process.exit(failed === 0 ? 0 : 1)
