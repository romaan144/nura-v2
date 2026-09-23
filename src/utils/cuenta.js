import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase'

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

export async function entrar(email, contrasena) {
  const { data, error } = await cuentas.auth.signInWithPassword({ email: email.trim(), password: contrasena })
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

export async function sesionActual() {
  try { const { data } = await cuentas.auth.getSession(); return data.session || null } catch { return null }
}

export function escucharSesion(fn) {
  const { data } = cuentas.auth.onAuthStateChange((evento, sesion) => fn(evento, sesion))
  return () => data.subscription.unsubscribe()
}
