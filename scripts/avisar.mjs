// ── Nüra · avisar a un profesional ───────────────────────────────────────
//
//   npm run avisar
//
// POR QUE ES UN GUION Y NO UNA PANTALLA
// La app le promete al usuario "le aviso de que le has escrito". Con treinta
// personas, quien cumple esa promesa eres tu, a mano. Eso NO es una version
// pobre: es la version correcta. Cada aviso que mandas te enseña quien
// contesta, en cuanto tiempo y con que palabras — y eso no lo da un panel.
//
// No es una pantalla porque el `contacto` del profesional **no viaja al
// navegador** a proposito (COLUMNAS_OCULTAS). El aviso se arma en la Edge
// Function, que tiene la clave de servicio; de aqui solo sale un enlace.
//
// NECESITA
//   NURA_EDGE_URL       la funcion desplegada
//   NURA_ADMIN_SECRET   el mismo secreto que la funcion (Supabase → Edge
//                       Functions → Secrets). Solo en TU terminal: nunca en
//                       .env de la app, ni VITE_, ni el repositorio.
//   La tabla `helpers` con la columna `contacto`
//
//   NURA_EDGE_URL=https://xxx.functions.supabase.co/helpers-write npm run avisar

const EDGE = process.env.NURA_EDGE_URL
const ORIGEN = process.env.NURA_ORIGIN || 'https://nura-v2-two.vercel.app'
const SECRETO = process.env.NURA_ADMIN_SECRET || ''

// El secreto va en una cabecera propia y NUNCA se imprime: ni aqui ni en
// los errores. La funcion rechaza sin el (401) o si no lo tiene configurado (503).
const cabeceras = { 'Content-Type': 'application/json', origin: ORIGEN, 'x-nura-admin': SECRETO }
const explicarRechazo = (estado) => {
  if (estado === 401) return '✗ La función rechazó el secreto (401). Revisa NURA_ADMIN_SECRET.'
  if (estado === 503) return '✗ La función no tiene configurado NURA_ADMIN_SECRET (503).'
  return `✗ La función respondió ${estado}.`
}

if (EDGE && !SECRETO) {
  console.log(`
Falta NURA_ADMIN_SECRET en esta terminal (el mismo que tiene la función).
Escríbelo sin que quede en el historial, por ejemplo:

  read -rs NURA_ADMIN_SECRET && export NURA_ADMIN_SECRET
`)
  process.exit(1)
}

if (!EDGE) {
  console.log(`
Falta NURA_EDGE_URL.

  NURA_EDGE_URL=https://<tu-proyecto>.functions.supabase.co/helpers-write \\
    npm run avisar -- --id 1 --mensaje "..."

Y antes, en Supabase:
  alter table public.helpers add column contacto text;
  supabase functions deploy helpers-write
`)
  process.exit(1)
}

const args = process.argv.slice(2)
const arg = (n) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null }

// ── los pendientes, de golpe ─────────────────────────────────────────────
// La app encola el aviso sola en cuanto alguien escribe a un profesional.
// Esto los saca todos: un enlace por aviso, listo para abrir y enviar.
if (args.includes('--pendientes')) {
  const res = await fetch(EDGE, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ op: 'pendientes' }),
  })
  if (!res.ok) { console.log(explicarRechazo(res.status)); process.exit(1) }
  const r = await res.json()
  const avisos = r.avisos || []
  if (!avisos.length) { console.log('\nNo hay avisos pendientes.\n'); process.exit(0) }

  console.log(`\n${avisos.length} aviso(s) pendiente(s):\n`)
  for (const a of avisos) {
    if (!a.enlace) {
      console.log(`✗ ${a.nombre} — sin forma de contacto. Se dio de alta antes`)
      console.log(`   de que el alta lo pidiera: aparece en las búsquedas y`)
      console.log(`   nadie puede avisarle.\n`)
      continue
    }
    console.log(`✓ ${a.nombre}`)
    console.log(`   ${a.enlace}`)
    console.log(`   al enviarlo:  npm run avisar -- --enviado ${a.id}\n`)
  }
  process.exit(0)
}

// ── marcar uno como enviado ──
const enviado = arg('enviado')
if (enviado) {
  const res = await fetch(EDGE, {
    method: 'POST',
    headers: cabeceras,
    body: JSON.stringify({ op: 'aviso-enviado', avisoId: enviado }),
  })
  console.log(res.ok ? `✓ Aviso ${enviado} marcado como enviado.` : explicarRechazo(res.status))
  process.exit(res.ok ? 0 : 1)
}

const id = arg('id')
const mensaje = arg('mensaje')

if (!id || !mensaje) {
  console.log(`
Uso:
  npm run avisar -- --pendientes          ← lo normal: los que la app encoló
  npm run avisar -- --enviado 7           ← marcar uno como enviado
  npm run avisar -- --id 1 --mensaje "…"  ← uno suelto, a mano

El texto lo genera \`src/utils/aviso.js\` (construirAviso). Si tienes el
aviso en la consola del navegador:

  copy(construirAviso({ helper, analysis, userQuery, user }).cuerpo)
`)
  process.exit(1)
}

const res = await fetch(EDGE, {
  method: 'POST',
  headers: cabeceras,
  body: JSON.stringify({ op: 'avisar', helperId: id, mensaje }),
})

if (!res.ok) {
  console.log(res.status === 403
    ? `✗ La función respondió 403. ¿NURA_ORIGINS incluye ${ORIGEN}?`
    : explicarRechazo(res.status))
  process.exit(1)
}

const r = await res.json()

if (r.ok === false && r.motivo === 'sin_contacto') {
  console.log(`
✗ ${r.nombre} no dejó forma de contacto.

  Se dio de alta antes de que el alta lo pidiera. No hay manera de avisarle
  y aparece en las búsquedas igual: alguien puede escribirle y no enterarse
  nunca. Merece una llamada o borrar el perfil.
`)
  process.exit(1)
}

console.log(`
✓ ${r.nombre} · por ${r.via === 'movil' ? 'WhatsApp' : 'correo'}

Abre esto para enviarlo:

${r.enlace}
`)
