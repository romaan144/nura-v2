// ═══════════════════════════════════════════════════════════════
// Configuración central de Nüra 2
// Un solo lugar para pasar de demo a producción: cambiar DEMO_MODE.
// ═══════════════════════════════════════════════════════════════

// ── EL INTERRUPTOR ──
// Deriva del entorno para que una compilacion de produccion no pueda salir
// en modo demo por olvido. Hoy DEFAULT_DEMO sigue en true para no romper la
// demo del fundador en su dispositivo: el dia del lanzamiento se pone a
// false (o se define VITE_DEMO=false en Vercel) y `npm run preflight` lo
// verifica antes de abrir.
const DEFAULT_DEMO = true
export const DEMO_MODE = import.meta?.env?.VITE_DEMO !== undefined
  ? import.meta.env.VITE_DEMO === 'true'
  : DEFAULT_DEMO

// ── La Confirmación Humana ──
// Cuánto esperar tras un contacto para preguntar "¿Pudiste resolverlo?"
// Las dos escrituras sobre `helpers` pasan por la Edge Function
// `helpers-write` (service_role) en vez de ir con la clave publica.
// APAGADO por defecto A PROPOSITO: mientras la funcion no este desplegada,
// activarlo romperia el alta. Se enciende con VITE_EDGE_WRITES=true en
// Vercel DESPUES de `supabase functions deploy helpers-write`.
// Ver docs/lanzamiento-rls.md.
export const EDGE_WRITES = String(import.meta?.env?.VITE_EDGE_WRITES ?? '') === 'true'
export const EDGE_URL = import.meta?.env?.VITE_EDGE_URL || ''

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
export const NURA_BUILD = '2026.07.07-u'
