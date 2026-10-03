import { telefonoInternacional } from './telefono'

// ── CUENTAS DE LA DEMOSTRACIÓN (Sergio, 2026-10-03) ──────────────────────
//
// Primero una cuenta completa (teléfono y contraseña); dentro, en el perfil,
// «Hazte profesional». Sin proveedor de SMS (de momento no se paga), el SMS
// se simula: el código aparece en pantalla como si llegara al móvil.
//
// Todo vive en ESTE móvil, bajo una clave `nura_`: «Borrar mis datos de este
// móvil» también la borra. La contraseña no se guarda tal cual, solo su
// huella. Al cerrar sesión se guarda el perfil de la cuenta; al volver a
// entrar se recupera, también el de profesional.

const CLAVE = 'nura_cuentas_demo'
// La misma que las cuentas de verdad (utils/cuenta.js), sin cargar su librería.
export const MIN_CONTRASENA_DEMO = 8

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '{}') || {} } catch { return {} }
}
function guardar(cuentas) {
  try { localStorage.setItem(CLAVE, JSON.stringify(cuentas)) } catch { /* sin almacenamiento */ }
}

async function huella(tel, contrasena) {
  const texto = `nura:${tel}:${contrasena}`
  try {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
    return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Sin `crypto.subtle` (página sin https): una huella sencilla basta para
    // una demostración que nunca sale del móvil.
    let h = 0
    for (const c of texto) h = (h * 31 + c.charCodeAt(0)) | 0
    return 'h' + (h >>> 0).toString(16)
  }
}

export const existeCuentaDemo = telefono => {
  const tel = telefonoInternacional(telefono)
  return !!(tel && leer()[tel])
}

// Seis cifras, como el SMS de verdad.
export const codigoSms = () => String(Math.floor(100000 + Math.random() * 900000))

export async function crearCuentaDemo({ telefono, nombre, contrasena }) {
  const tel = telefonoInternacional(telefono)
  if (!tel) return { error: 'Ese teléfono no parece válido.' }
  const cuentas = leer()
  if (cuentas[tel]) return { error: 'Ya hay una cuenta con este teléfono. Entra con tu contraseña.', existe: true }
  const usuario = { name: nombre.trim(), phone: tel.replace(/^\+34/, ''), cuentaDemo: tel, verified: true, joined: new Date().toISOString() }
  cuentas[tel] = { huella: await huella(tel, contrasena), usuario }
  guardar(cuentas)
  return { usuario }
}

export async function entrarDemo(telefono, contrasena) {
  const tel = telefonoInternacional(telefono)
  const c = tel && leer()[tel]
  if (!c || c.huella !== await huella(tel, contrasena)) return { error: 'El móvil o la contraseña no son correctos.' }
  return { usuario: { ...c.usuario, cuentaDemo: tel } }
}

export async function nuevaContrasenaDemo(telefono, contrasena) {
  const tel = telefonoInternacional(telefono)
  const cuentas = leer()
  if (!tel || !cuentas[tel]) return { error: 'No hay ninguna cuenta con ese móvil.' }
  cuentas[tel].huella = await huella(tel, contrasena)
  guardar(cuentas)
  return { usuario: { ...cuentas[tel].usuario, cuentaDemo: tel } }
}

// Al cerrar sesión: lo que tenía el perfil (también la ficha de profesional)
// queda en su cuenta para la próxima vez que entre.
export function guardarPerfilDemo(usuario) {
  const tel = usuario?.cuentaDemo
  if (!tel) return
  const cuentas = leer()
  if (!cuentas[tel]) return
  cuentas[tel].usuario = usuario
  guardar(cuentas)
}
