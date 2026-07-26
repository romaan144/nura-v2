// ═══════════════════════════════════════════════════════════════
// LA QUINTA PUERTA — preflight, la del dia del lanzamiento.
// No entra en las cuatro de cada push: se ejecuta ANTES de abrir al
// publico. Verifica lo que las otras no pueden ver — que la app no
// salga en modo demostracion y que no queden restos de desarrollo.
// ═══════════════════════════════════════════════════════════════
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

let fallos = 0
const mal = m => { console.log(`✗ ${m}`); fallos++ }
const bien = m => console.log(`✓ ${m}`)

// ── 1. El modo demostracion ──
const cfg = readFileSync('src/config.js', 'utf8')
const m = cfg.match(/const DEFAULT_DEMO = (true|false)/)
if (!m) mal('config.js: no encuentro DEFAULT_DEMO')
else if (m[1] === 'true') {
  mal('DEMO_MODE sigue activo por defecto — plazos de 30s en vez de 3 dias.')
  console.log('   → pon DEFAULT_DEMO = false en src/config.js, o define')
  console.log('     VITE_DEMO=false en Vercel antes de desplegar.')
} else bien('modo produccion: plazos reales')

// ── 2. Restos de desarrollo ──
function jsFiles(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) jsFiles(p, acc)
    else if (/\.(jsx?|mjs)$/.test(f)) acc.push(p)
  }
  return acc
}
const archivos = jsFiles('src')
const conLogs = archivos.filter(f => {
  const s = readFileSync(f, 'utf8')
  // 'preflight-ok' en la misma linea = excepcion declarada a proposito
  return s.split('\n').some(l => /^\s*console\.(log|debug)\(/.test(l) && !l.includes('preflight-ok'))
})
if (conLogs.length) {
  mal(`${conLogs.length} archivos con console.log:`)
  conLogs.slice(0, 6).forEach(f => console.log(`   · ${f}`))
} else bien('sin restos de console.log')

// ── 3. El aviso que ninguna puerta automatica puede comprobar ──
console.log('\n⚠ REVISION MANUAL OBLIGATORIA antes de abrir:')
console.log('   Las politicas RLS de Supabase. src/utils/claudeApi.js hace')
console.log('   PATCH sobre la tabla `helpers` con la clave ANONIMA: si el')
console.log('   rol anon tiene escritura, cualquiera puede reescribir los')
console.log('   datos de tus profesionales. Mover la clave a .env NO')
console.log('   protege nada — una anon key viaja al navegador siempre.')

console.log(fallos === 0
  ? '\n✅ PREFLIGHT VERDE — listo para produccion (tras revisar el RLS)'
  : `\n❌ ${fallos} bloqueo(s) antes de lanzar`)
process.exit(fallos === 0 ? 0 : 1)
