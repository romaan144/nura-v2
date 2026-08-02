// ── CLAUDE API BRIDGE ─────────────────────────────────────────────────────
import { SUPABASE_URL, SUPABASE_KEY } from './supabase'   // fuente unica: ver supabase.js
// These utilities prepare Nüra for Claude API integration.
// Claude writes to ai_data (JSONB) — no schema changes ever needed.
// ──────────────────────────────────────────────────────────────────────────

// AVISO: mover esta clave a una variable de entorno NO la protege. Una
// anon key de Supabase esta diseñada para viajar al navegador, y Vite
// incrusta cualquier VITE_* en el paquete compilado. Vive aqui para poder
// ROTARLA sin tocar codigo, nada mas.
// Lo que de verdad protege es el RLS: este archivo hace PATCH sobre la
// tabla `helpers`, asi que el rol anonimo NO debe tener escritura. Ver
// context.md antes de abrir al publico.

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
}

// ── WRITE AI DATA ──────────────────────────────────────────────────────────
// Claude API calls this to update a helper's ai_data field.
// Merges with existing data — never overwrites everything.
// Claude can write ANY keys, inventing new ones freely.
//
// Example:
//   await writeHelperAiData(42, {
//     summary: "Logopeda con especial sensibilidad para niños con TEA...",
//     skills: ["Logopedia infantil", "TEA", "Dislalia funcional"],
//     personality: { paciencia: 92, empatia: 88 },
//     ideal_for: ["Niños 3-8 años", "Casos de TEA"],
//     cualquier_clave_nueva: "Claude lo decide"
//   })

export async function writeHelperAiData(helperId, aiDataUpdates) {
  // First read existing ai_data
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}&select=ai_data`,
    { headers }
  )
  const [existing] = await res.json()
  const merged = { ...(existing?.ai_data || {}), ...aiDataUpdates }

  // Write merged data back
  await fetch(
    `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        ai_data: merged,
        ai_analyzed_at: new Date().toISOString()
      })
    }
  )
  return merged
}

// ── APPEND CHAT LOG ────────────────────────────────────────────────────────
// Appends a chat exchange to chat_log so Claude can analyze it later.

export async function appendHelperChatLog(helperId, userMsg, helperReply) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}&select=chat_log`,
      { headers }
    )
    const [existing] = await res.json()
    const entry = `[${new Date().toISOString()}]\nU: ${userMsg}\nH: ${helperReply}\n---\n`
    const updated = (existing?.chat_log || '') + entry

    await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ chat_log: updated })
      }
    )
  } catch (e) {
    // No bloquear la interfaz: si el registro del chat falla, al usuario le
    // da igual. Pero SE AVISA en consola — fallaba en absoluto silencio y
    // nadie sabria nunca que esta persistencia esta rota.
    console.warn('[Nüra] registro del chat no guardado:', e?.message || e)
  }
}

// ── READ FOR CLAUDE ANALYSIS ───────────────────────────────────────────────
// Claude API calls this to get everything needed to analyze a helper.
// Pass this to Claude with a prompt like:
//   "Analiza este perfil y escribe en ai_data lo que descubras"

export async function getHelperForAnalysis(helperId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}&select=*`,
    { headers }
  )
  const [data] = await res.json()
  return data
}
