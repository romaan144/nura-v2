// ── Los chats de ejemplo que ya se han leído (solo la demo) ───────────────
//
// Los chats de ejemplo (Elena, Carlos…) llevan su «sin leer» escrito en el
// código. Al abrirlos no cambiaba nada: seguían resaltados para siempre y la
// barra sumaba un «1» fijo (Sergio, 2026-09-29). Aquí se recuerda, en este
// móvil, cuáles se han abierto ya.
const CLAVE = 'nura_demo_leidos'

export function demoLeidos() {
  try { return new Set(JSON.parse(localStorage.getItem(CLAVE) || '[]').map(String)) } catch { return new Set() }
}

export function marcarDemoLeido(helperId) {
  try {
    const s = demoLeidos(); s.add(String(helperId))
    localStorage.setItem(CLAVE, JSON.stringify([...s]))
  } catch { /* sin memoria: volverá a salir sin leer, sin más */ }
}

/** El chat de ejemplo que empieza sin leer (Elena). */
export const DEMO_SIN_LEER = '5'
