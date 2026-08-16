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
//   NURA_EDGE_URL   la funcion desplegada
//   La tabla `helpers` con la columna `contacto`
//
//   NURA_EDGE_URL=https://xxx.functions.supabase.co/helpers-write npm run avisar

const EDGE = process.env.NURA_EDGE_URL
const ORIGEN = process.env.NURA_ORIGIN || 'https://nura-v2-two.vercel.app'

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

const id = arg('id')
const mensaje = arg('mensaje')

if (!id || !mensaje) {
  console.log(`
Uso:
  npm run avisar -- --id 1 --mensaje "Hola Marta, soy Nüra. Sergio te ha escrito..."

El texto lo genera \`src/utils/aviso.js\` (construirAviso). Si tienes el
aviso en la consola del navegador:

  copy(construirAviso({ helper, analysis, userQuery, user }).cuerpo)
`)
  process.exit(1)
}

const res = await fetch(EDGE, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', origin: ORIGEN },
  body: JSON.stringify({ op: 'avisar', helperId: id, mensaje }),
})

if (!res.ok) {
  console.log(`✗ La función respondió ${res.status}. ¿Está desplegada y NURA_ORIGINS incluye ${ORIGEN}?`)
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
