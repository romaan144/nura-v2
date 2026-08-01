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

// ── 3. `vh` en vez de `dvh` ──
// Nos ha mordido dos veces (las hojas y la puerta de registro): en iOS
// saca el contenido de la pantalla. Merece vigilancia, no confianza.
const cssFiles = jsFiles('src').concat(
  (function css(dir, acc = []) {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f)
      if (statSync(p).isDirectory()) css(p, acc)
      else if (/\.css$/.test(f)) acc.push(p)
    }
    return acc
  })('src')
)
const conVh = cssFiles.filter(f => /\b\d+vh\b/.test(readFileSync(f, 'utf8')))
if (conVh.length) {
  mal(`${conVh.length} archivo(s) usan vh en vez de dvh:`)
  conVh.slice(0, 6).forEach(f => console.log(`   · ${f}`))
} else bien('sin `vh` (siempre dvh)')

// ── 3. El aviso que ninguna puerta automatica puede comprobar ──
// ── 5. El RLS, COMPROBADO (no advertido) ──
// Un aviso en prosa se lee y se sigue adelante. Esto lo intenta de verdad.
// La sonda es inofensiva: PATCH sobre id=-1, que no existe. Si el RLS
// bloquea al rol anon devuelve 401/403; si permite escribir devuelve 204
// habiendo tocado cero filas. Nunca modifica un dato real.
{
  const env = readFileSync('src/utils/supabase.js', 'utf8')
  const url = (env.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)/) || [])[1]
  const key = (env.match(/SUPABASE_(?:ANON_)?KEY\s*=\s*['"`]([^'"`]+)/) || [])[1]
  if (!url || !key) {
    console.log('~ RLS: no localizo URL/clave en supabase.js — comprobar a mano')
  } else {
    try {
      const r = await fetch(`${url}/rest/v1/helpers?id=eq.-1`, {
        method: 'PATCH',
        headers: { apikey: key, Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ai_analyzed_at: new Date().toISOString() }),
        signal: AbortSignal.timeout(8000),
      })
      // NO fiarse del codigo a secas. Un 403 puede venir de un proxy, una
      // VPN o un cortafuegos que ni llego a Supabase — y entonces la puerta
      // daria VERDE sin haber comprobado nada. Un verde que no significa
      // nada es peor que no tener sonda: crea confianza falsa justo en el
      // unico punto marcado como bloqueo de lanzamiento.
      // (Comprobado: en un entorno con egress restringido esta sonda daba
      //  "RLS correcto" cuando la peticion ni salia de la maquina.)
      const cuerpo = await r.text()
      const deSupabase = !r.headers.get('x-deny-reason') && (() => {
        if (r.status === 204 || cuerpo === '') return true
        try { const j = JSON.parse(cuerpo); return !!(j && (j.message || j.code || j.hint || j.details)) }
        catch { return false }
      })()
      if (!deSupabase) {
        console.log(`~ RLS: SIN COMPROBAR — la respuesta (HTTP ${r.status}) no viene de Supabase.`)
        console.log(`   Motivo probable: ${r.headers.get('x-deny-reason') || 'proxy, VPN o cortafuegos'}.`)
        console.log('   Repetir el preflight desde una red con salida a Supabase.')
      }
      else if (r.status === 401 || r.status === 403) bien('RLS: el rol anonimo NO puede escribir en `helpers`')
      else if (r.ok || r.status === 204) {
        mal(`RLS ABIERTO — el rol anonimo puede ESCRIBIR en \`helpers\` (HTTP ${r.status}).`)
        console.log('   Cualquiera con la clave publica puede reescribir a tus')
        console.log('   profesionales. Mover la clave a .env NO protege nada:')
        console.log('   una anon key viaja al navegador siempre.')
        console.log('   → Politicas minimas, en el editor SQL de Supabase:')
        console.log('')
        console.log('     alter table helpers enable row level security;')
        console.log('     drop policy if exists helpers_anon_read on helpers;')
        console.log('     create policy helpers_anon_read on helpers')
        console.log('       for select to anon using (true);')
        console.log('     -- sin policy de insert/update/delete para anon:')
        console.log('     -- lo que no se concede, queda denegado.')
        console.log('')
        console.log('   Y las escrituras que hoy hace el cliente (ai_data,')
        console.log('   chat_log en claudeApi.js; el alta en RegisterHelper.jsx)')
        console.log('   deben pasar a una Edge Function con la service key.')
      } else console.log(`~ RLS: respuesta inesperada (HTTP ${r.status}) — comprobar a mano`)
    } catch (e) {
      console.log(`~ RLS: no he podido comprobarlo (${String(e.message).slice(0, 60)}) — comprobar a mano`)
    }
  }
}

// ── 6. Lo que el cliente se descarga de mas ──
{
  const sb = readFileSync('src/utils/supabase.js', 'utf8')
  const usaChatLog = /chat_log/.test(sb.replace(/\/\/.*$/gm, ''))
  if (/select=\*/.test(sb) && !usaChatLog) {
    console.log('~ `select=*` sobre `helpers`: el cliente se descarga tambien')
    console.log('   `chat_log` — las conversaciones de los usuarios — y NO lo usa.')
    console.log('   En Nura esas frases son intimas ("mi madre vive sola").')
    console.log('   → acotar el select a las columnas que normalize() lee.')
  }
}

console.log('\n⚠ REVISION MANUAL que la sonda no cubre:')
console.log('   El INSERT. RegisterHelper.jsx hace POST a `helpers` con la')
console.log('   clave anonima: sin policy de insert, cualquiera puede dar de')
console.log('   alta profesionales falsos. Comprobarlo a mano tras aplicar')
console.log('   las politicas de arriba.')

console.log(fallos === 0
  ? '\n✅ PREFLIGHT VERDE — listo para produccion (tras revisar el RLS)'
  : `\n❌ ${fallos} bloqueo(s) antes de lanzar`)
process.exit(fallos === 0 ? 0 : 1)
