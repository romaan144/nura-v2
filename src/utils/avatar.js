import { createAvatar } from '@dicebear/core'
import { personas } from '@dicebear/collection'

// ═══════════════════════════════════════════════════════════════
// AVATARES LOCALES.
// Antes venian de api.dicebear.com: 138 peticiones a un tercero, una por
// foto de profesional. Mismo problema de privacidad que las fuentes (la IP
// del visitante viaja fuera), mas la latencia y la dependencia de que ese
// servicio siga en pie.
// Medido: generar los 123 cuesta 12ms en total (0.10ms cada uno).
// Mismo estilo ('personas'), mismas semillas: los avatares NO cambian.
// ═══════════════════════════════════════════════════════════════
const cache = new Map()

export function avatarDe(seed) {
  if (!seed) return null
  if (cache.has(seed)) return cache.get(seed)
  const uri = createAvatar(personas, { seed: String(seed) }).toDataUri()
  cache.set(seed, uri)
  return uri
}
