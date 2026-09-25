// ── Cuando se publica una versión nueva con la app abierta ──────────────
// Las pantallas se cargan aparte (App.jsx, `lazy`) y cada publicación les
// cambia el nombre. Quien tenía Nüra abierta desde antes pide el archivo
// VIEJO al abrir otra pantalla, y ya no existe. Se recarga la página una
// vez: llega la versión nueva y la persona sigue donde estaba. Nada se
// borra. Un tope evita recargar en bucle si el fallo es otro.

const CLAVE = 'nura_recarga_version'

export const esVersionVieja = e => /dynamically imported module|Importing a module script failed|error loading dynamically imported|Failed to fetch dynamically|ChunkLoadError|Unable to preload CSS/i
  .test(String(e?.message || e || ''))

/** Recarga una vez (máximo una cada 30 s). true si va a recargar. */
export function recargarPorVersionNueva() {
  try {
    const antes = Number(sessionStorage.getItem(CLAVE) || 0)
    if (Date.now() - antes < 30000) return false
    sessionStorage.setItem(CLAVE, String(Date.now()))
  } catch { /* sin almacenamiento: se recarga igual, una vez por carga */ }
  window.location.reload()
  return true
}

// Vite avisa con este evento cuando no puede traer una pantalla.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', e => {
    if (recargarPorVersionNueva()) e.preventDefault()
  })
}
