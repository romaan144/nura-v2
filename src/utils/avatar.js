import { createAvatar } from '@dicebear/core'
import { micah } from '@dicebear/collection'

// ═══════════════════════════════════════════════════════════════
// AVATARES LOCALES.
// Antes venian de api.dicebear.com: 138 peticiones a un tercero, una por
// foto de profesional. Mismo problema de privacidad que las fuentes (la IP
// del visitante viaja fuera), mas la latencia y la dependencia de que ese
// servicio siga en pie.
// Medido: generar los 123 cuesta 12ms en total (0.10ms cada uno).
// Estilo «micah» sobre lila suave (elegido por Sergio, 2026-09-29; antes
// «personas»). Mismas semillas: cada persona conserva su avatar.
// ═══════════════════════════════════════════════════════════════
const cache = new Map()

export function avatarDe(seed) {
  if (!seed) return null
  if (cache.has(seed)) return cache.get(seed)
  const uri = createAvatar(micah, { seed: String(seed), backgroundColor: ['efe7fb'] }).toDataUri()
  cache.set(seed, uri)
  return uri
}

/**
 * El avatar que toca mostrar. Una foto de verdad, tal cual. Un avatar
 * generado de antes —enlace a api.dicebear.com (así vienen las fichas de la
 * base) o uno de estilo «personas» guardado en el móvil— se rehace aquí, con
 * el estilo actual y sin llamar a nadie de fuera.
 */
export function avatarVigente(url, nombre) {
  const u = typeof url === 'string' ? url : ''
  const semilla = u.match(/^https?:\/\/api\.dicebear\.com\/[^?]*\?(?:.*&)?seed=([^&]+)/)
  if (semilla) return avatarDe(decodeURIComponent(semilla[1]))
  const antiguo = u.startsWith('data:image/svg') && /Personas(%20| )by(%20| )Draftbit/.test(u)
  if (u && !antiguo) return u
  const n = String(nombre || '').trim().split(' ')[0]
  return n ? avatarDe(encodeURIComponent(n)) : null
}
