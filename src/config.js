// ═══════════════════════════════════════════════════════════════
// Configuración central de Nüra 2
// Un solo lugar para pasar de demo a producción: cambiar DEMO_MODE.
// ═══════════════════════════════════════════════════════════════

export const DEMO_MODE = true

// ── La Confirmación Humana ──
// Cuánto esperar tras un contacto para preguntar "¿Pudiste resolverlo?"
export const CONFIRMACION_THRESHOLD = DEMO_MODE ? 30 * 1000 : 3 * 24 * 60 * 60 * 1000
export const CONFIRMACION_DELAY = DEMO_MODE ? 4000 : 500

// ── El Pulso ──
// Frecuencia del resumen semanal al profesional
export const PULSO_THRESHOLD = DEMO_MODE ? 35 * 1000 : 7 * 24 * 60 * 60 * 1000
export const PULSO_DELAY = DEMO_MODE ? 5000 : 1000

// ── El Momento Cero ──
// Cada cuánto puede volver a mostrarse la demostración inicial.
// Demo: cada 2 horas (para enseñar a inversores sin que moleste en uso continuo).
// Producción: solo la primera vez.
export const MOMENTO_CERO_COOLDOWN = DEMO_MODE ? 2 * 60 * 60 * 1000 : Infinity

// Sello de build visible — para verificar qué versión corre el dispositivo
export const NURA_BUILD = '2026.07.04-ca'
