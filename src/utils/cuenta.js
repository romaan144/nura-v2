import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase'
import { telefonoInternacional, pareceTelefono } from './telefono'
export { telefonoInternacional, pareceTelefono }

// ── CUENTAS: CORREO Y CONTRASEÑA ─────────────────────────────────────────
//
// Etapa 6 de docs/estudio-perfil.md. Decision del fundador: correo y
// contraseña, y "restablecer contraseña" por correo si se olvida — como
// casi todas las apps.
//
// Hasta aqui "entrar" era escribir un nombre y un telefono que se guardaban
// en el movil. Nadie podia demostrar quien era, asi que nada de lo que toca
// la ficha PUBLICA se podia hacer con seguridad: editarla, poner foto, ver
// los avisos, borrarla.
//
// Se usa la libreria oficial de Supabase y no llamadas a mano: sesiones que
// caducan, renovacion de claves y los enlaces de restablecer son justo lo
// que no conviene reinventar.
//
// La sesion se guarda con la clave `nura_sesion`: empieza por `nura_`, asi
// que "Borrar mis datos de este móvil" (etapa 3) tambien la borra.

export const cuentas = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'nura_sesion' },
})

export const MIN_CONTRASENA = 8

const origen = () => (typeof window !== 'undefined' ? window.location.origin : '')

// Los errores de Supabase llegan en ingles y en jerga. Se traducen a lo que
// una persona puede hacer con ellos.
export function explicar(error) {
  const m = String(error?.message || error || '').toLowerCase()
  if (m.includes('invalid login')) return 'El correo o la contraseña no son correctos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya hay una cuenta con ese correo. Prueba a entrar.'
  if (m.includes('not confirmed')) return 'Falta confirmar tu correo: te enviamos un enlace al crear la cuenta.'
  if (m.includes('password') && (m.includes('at least') || m.includes('short') || m.includes('weak'))) return `La contraseña necesita al menos ${MIN_CONTRASENA} caracteres.`
  if (m.includes('invalid') && m.includes('email')) return 'Ese correo no parece válido.'
  if (m.includes('rate') || m.includes('too many') || m.includes('security purposes')) return 'Demasiados intentos seguidos. Espera un minuto y vuelve a probar.'
  if (m.includes('fetch') || m.includes('network')) return 'No hay conexión. Revisa tu internet y vuelve a probar.'
  // Teléfono: sin proveedor de SMS en Supabase no sale ningún mensaje.
  if (m.includes('phone provider') || m.includes('sms provider') || m.includes('unsupported phone') || (m.includes('sms') && m.includes('send'))) return 'Todavía no podemos enviar SMS. Tu correo sigue siendo tu acceso; vuelve a probar más adelante.'
  if (m.includes('token') && (m.includes('expired') || m.includes('invalid'))) return 'El código no es correcto o ha caducado. Pide uno nuevo.'
  if (m.includes('phone') && (m.includes('already') || m.includes('exists') || m.includes('registered'))) return 'Ese teléfono ya está en otra cuenta de Nüra.'
  if (m.includes('phone') && m.includes('invalid')) return 'Ese teléfono no parece válido.'
  if (m.includes('email') && (m.includes('already') || m.includes('exists'))) return 'Ese correo ya está en otra cuenta de Nüra.'
  return 'Algo no ha ido bien. Vuelve a probar en un momento.'
}

export async function crearCuenta(email, contrasena) {
  if ((contrasena || '').length < MIN_CONTRASENA) return { error: `La contraseña necesita al menos ${MIN_CONTRASENA} caracteres.` }
  const { data, error } = await cuentas.auth.signUp({
    email: email.trim(), password: contrasena,
    options: { emailRedirectTo: origen() + '/profile' },
  })
  if (error) return { error: explicar(error) }
  // Si el proyecto pide confirmar el correo, no hay sesion todavia.
  return { usuario: data.user, pendienteConfirmar: !data.session }
}

// ── TELÉFONO, SIEMPRE CONFIRMADO (Sergio, 2026-10-01) ────────────────────
// Cada cuenta tiene correo y teléfono, para no perderla si cambia uno de
// los dos. Primero el correo (gratis, y ya era el acceso); después el
// teléfono, confirmado con un código por SMS: nadie puede poner el número
// de otra persona. Cambiar cualquiera de los dos solo surte efecto al
// confirmarlo (enlace al correo nuevo, código al teléfono nuevo).
export async function entrar(identificador, contrasena) {
  const tel = pareceTelefono(identificador) ? telefonoInternacional(identificador) : null
  const { data, error } = await cuentas.auth.signInWithPassword(tel
    ? { phone: tel, password: contrasena }
    : { email: String(identificador || '').trim(), password: contrasena })
  if (error) return { error: explicar(error) }
  return { usuario: data.user }
}

export async function salir() {
  try { await cuentas.auth.signOut() } catch { /* sin red: la sesion local se borra igual */ }
}

export async function pedirRestablecer(email) {
  const { error } = await cuentas.auth.resetPasswordForEmail(email.trim(), { redirectTo: origen() + '/restablecer' })
  // Por seguridad no se dice si el correo existe: la respuesta es la misma.
  if (error && !String(error.message || '').toLowerCase().includes('not found')) return { error: explicar(error) }
  return { ok: true }
}

export async function nuevaContrasena(contrasena) {
  if ((contrasena || '').length < MIN_CONTRASENA) return { error: `La contraseña necesita al menos ${MIN_CONTRASENA} caracteres.` }
  const { error } = await cuentas.auth.updateUser({ password: contrasena })
  if (error) return { error: explicar(error) }
  return { ok: true }
}

// Sin acceso al correo y sin contraseña: un código por SMS al teléfono de la
// cuenta. No crea cuentas nuevas. Con el código se abre sesión y se pone una
// contraseña nueva en /restablecer.
export async function pedirCodigoParaEntrar(telefono) {
  const tel = telefonoInternacional(telefono)
  if (!tel) return { error: 'Ese teléfono no parece válido.' }
  const { error } = await cuentas.auth.signInWithOtp({ phone: tel, options: { shouldCreateUser: false } })
  // Como con el correo, no se dice si el teléfono tiene cuenta.
  if (error && !/not found|signups not allowed|no user/i.test(String(error.message || ''))) return { error: explicar(error) }
  return { ok: true, telefono: tel }
}
export async function entrarConCodigo(telefono, codigo) {
  const tel = telefonoInternacional(telefono)
  const { data, error } = await cuentas.auth.verifyOtp({ phone: tel, token: String(codigo || '').replace(/\D/g, ''), type: 'sms' })
  if (error) return { error: explicar(error) }
  return { usuario: data.user }
}

// Cambiar el correo: Supabase manda un enlace y el cambio solo se aplica al
// pulsarlo (con «cambio seguro», también se confirma desde el correo actual).
export async function cambiarCorreo(nuevo) {
  const { error } = await cuentas.auth.updateUser({ email: String(nuevo || '').trim() }, { emailRedirectTo: origen() + '/profile' })
  if (error) return { error: explicar(error) }
  return { ok: true }
}

// Añadir o cambiar el teléfono: se manda un código por SMS al número nuevo y
// no se guarda hasta escribirlo bien.
export async function pedirCodigoTelefono(telefono) {
  const tel = telefonoInternacional(telefono)
  if (!tel) return { error: 'Escribe un móvil válido, por ejemplo 612 34 56 78.' }
  const { error } = await cuentas.auth.updateUser({ phone: tel })
  if (error) return { error: explicar(error) }
  return { ok: true, telefono: tel }
}
export async function confirmarCodigoTelefono(telefono, codigo) {
  const { data, error } = await cuentas.auth.verifyOtp({ phone: telefonoInternacional(telefono), token: String(codigo || '').replace(/\D/g, ''), type: 'phone_change' })
  if (error) return { error: explicar(error) }
  return { ok: true, usuario: data.user }
}

export async function usuarioActual() {
  try { const { data } = await cuentas.auth.getUser(); return data.user || null } catch { return null }
}

export async function sesionActual() {
  try { const { data } = await cuentas.auth.getSession(); return data.session || null } catch { return null }
}

export function escucharSesion(fn) {
  const { data } = cuentas.auth.onAuthStateChange((evento, sesion) => fn(evento, sesion))
  return () => data.subscription.unsubscribe()
}
