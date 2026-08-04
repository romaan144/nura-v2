// ── Las dos escrituras sobre `helpers`, en un solo sitio ─────────────────
//
// Antes iban con la clave publica `anon` desde dos ficheros distintos. Al
// cerrar el RLS dejan de funcionar, y su sitio es una Edge Function con
// `service_role` (supabase/functions/helpers-write).
//
// El interruptor esta APAGADO por defecto: hasta que la funcion este
// desplegada se sigue por el camino directo, que es el comportamiento
// actual. Asi desplegar el frontend no rompe nada, y el cambio ocurre
// cuando el fundador enciende VITE_EDGE_WRITES.

import { EDGE_WRITES, EDGE_URL } from '../config'
import { SUPABASE_URL, SUPABASE_KEY } from './supabase'

const directas = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

function porLaFuncion() {
  return EDGE_WRITES && Boolean(EDGE_URL)
}

async function llamarFuncion(cuerpo) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return { ok: false, estado: res.status }
  return await res.json()
}

/** Alta profesional. Devuelve la fila creada, o null si no se publico. */
export async function altaProfesional(payload) {
  try {
    if (porLaFuncion()) {
      const r = await llamarFuncion({ op: 'alta', payload })
      if (!r?.ok) { console.warn('[Nüra] alta rechazada por la funcion:', r?.estado ?? '?'); return null }
      return r.helper ?? null
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers`, {
      method: 'POST',
      headers: { ...directas, Prefer: 'return=representation' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) { console.warn('[Nüra] alta profesional rechazada:', res.status); return null }
    const data = await res.json()
    return data?.[0] || null
  } catch (e) {
    console.warn('[Nüra] alta profesional no guardada:', e?.message || e)
    return null
  }
}

/** Registro de conversacion. No bloquea la interfaz si falla. */
export async function registrarConversacion(helperId, userMsg, helperReply) {
  try {
    if (porLaFuncion()) {
      const r = await llamarFuncion({ op: 'chat-log', helperId, userMsg, helperReply })
      if (!r?.ok) console.warn('[Nüra] registro del chat rechazado:', r?.estado ?? '?')
      return
    }
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}&select=chat_log`, { headers: directas })
    const [existing] = await res.json()
    const entry = `[${new Date().toISOString()}]\nU: ${userMsg}\nH: ${helperReply}\n---\n`
    await fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${helperId}`, {
      method: 'PATCH',
      headers: directas,
      body: JSON.stringify({ chat_log: (existing?.chat_log || '') + entry }),
    })
  } catch (e) {
    console.warn('[Nüra] registro del chat no guardado:', e?.message || e)
  }
}
