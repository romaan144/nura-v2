// ── Nüra · escrituras sobre `helpers` ────────────────────────────────────
//
// POR QUE EXISTE
// Las dos unicas escrituras vivas del cliente iban con la clave publica
// `anon`. Esa clave viaja al navegador por diseño, asi que cualquiera podia
// reescribir el perfil de un profesional o dar de alta profesionales falsos.
// Moverla a `.env` no protege nada: acaba igual en el bundle.
//
// Al cerrar el RLS (ver docs/lanzamiento-rls.md) el rol `anon` pierde la
// escritura y estas dos operaciones dejan de funcionar. Su sitio es aqui:
// una funcion de servidor con `service_role`, que NUNCA sale de Supabase.
//
// DOS OPERACIONES, NINGUNA MAS
//   · alta      → INSERT en helpers (el alta profesional)
//   · chat-log  → append a helpers.chat_log (registro de conversacion)
//
// Deno. Desplegar con:  supabase functions deploy helpers-write

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// El origen desde el que se sirve Nüra. Sin esto, cualquier web podria
// llamar a esta funcion desde el navegador de un visitante.
const ORIGENES = (Deno.env.get('NURA_ORIGINS') || '').split(',').map(o => o.trim()).filter(Boolean)

function cabecerasCors(origen: string | null) {
  const permitido = origen && ORIGENES.includes(origen) ? origen : ORIGENES[0] || ''
  return {
    'Access-Control-Allow-Origin': permitido,
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const json = (cuerpo: unknown, estado: number, cors: Record<string, string>) =>
  new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

// Cabeceras con las que ESTA funcion habla con PostgREST. La clave de
// servicio se queda aqui dentro.
const rest = {
  apikey: SERVICE_KEY ?? '',
  Authorization: `Bearer ${SERVICE_KEY ?? ''}`,
  'Content-Type': 'application/json',
}

// El alta llega desde un formulario publico: no se confia en su forma. Solo
// pasan estos campos y con el tipo esperado. Asi un `payload` manipulado no
// puede escribir `verified: true` ni tocar columnas que no le tocan.
const CAMPOS_ALTA: Record<string, 'texto' | 'numero' | 'lista' | 'objeto'> = {
  name: 'texto', specialty: 'texto', category: 'texto', bio: 'texto',
  zone: 'texto', city: 'texto', price: 'texto', avatar_url: 'texto',
  response_time: 'texto', qualification_level: 'texto',
  rating: 'numero', reviews: 'numero', completion_rate: 'numero',
  tags: 'lista', skills: 'lista', languages: 'lista',
  ai_data: 'objeto',
}

function limpiarAlta(entrada: Record<string, unknown>) {
  const salida: Record<string, unknown> = {}
  for (const [campo, tipo] of Object.entries(CAMPOS_ALTA)) {
    const v = entrada?.[campo]
    if (v === undefined || v === null) continue
    if (tipo === 'texto' && typeof v === 'string') salida[campo] = v.slice(0, 2000)
    else if (tipo === 'numero' && typeof v === 'number' && Number.isFinite(v)) salida[campo] = v
    else if (tipo === 'lista' && Array.isArray(v)) salida[campo] = v.slice(0, 40)
    else if (tipo === 'objeto' && typeof v === 'object' && !Array.isArray(v)) salida[campo] = v
  }
  // Estos NO los decide el cliente, nunca.
  salida.verified = false
  salida.dni_verified = false
  salida.available = true
  return salida
}

Deno.serve(async (req: Request) => {
  const cors = cabecerasCors(req.headers.get('origin'))

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'metodo no permitido' }, 405, cors)
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: 'funcion sin configurar' }, 500, cors)

  const origen = req.headers.get('origin')
  if (ORIGENES.length && (!origen || !ORIGENES.includes(origen))) {
    return json({ error: 'origen no permitido' }, 403, cors)
  }

  let cuerpo: Record<string, unknown>
  try { cuerpo = await req.json() } catch { return json({ error: 'json invalido' }, 400, cors) }

  const op = String(cuerpo?.op || '')

  // ── alta profesional ──
  if (op === 'alta') {
    const fila = limpiarAlta((cuerpo.payload || {}) as Record<string, unknown>)
    if (!fila.name || !fila.category) return json({ error: 'faltan name o category' }, 400, cors)

    const res = await fetch(`${SUPABASE_URL}/rest/v1/helpers`, {
      method: 'POST',
      headers: { ...rest, Prefer: 'return=representation' },
      body: JSON.stringify(fila),
    })
    if (!res.ok) return json({ error: 'insert rechazado', estado: res.status }, 502, cors)
    const datos = await res.json()
    return json({ ok: true, helper: datos?.[0] ?? null }, 200, cors)
  }

  // ── registro de conversacion ──
  if (op === 'chat-log') {
    const id = cuerpo.helperId
    const userMsg = String(cuerpo.userMsg ?? '').slice(0, 4000)
    const helperReply = String(cuerpo.helperReply ?? '').slice(0, 4000)
    if (id === undefined || id === null) return json({ error: 'falta helperId' }, 400, cors)

    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${encodeURIComponent(String(id))}&select=chat_log`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const [actual] = await lec.json()

    const entrada = `[${new Date().toISOString()}]\nU: ${userMsg}\nH: ${helperReply}\n---\n`
    // Tope duro: sin esto, chat_log crece sin limite en la fila del
    // profesional y acaba pesando en cada lectura del catalogo.
    const acumulado = ((actual?.chat_log || '') + entrada).slice(-200_000)

    const esc = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${encodeURIComponent(String(id))}`,
      { method: 'PATCH', headers: { ...rest, Prefer: 'return=minimal' }, body: JSON.stringify({ chat_log: acumulado }) },
    )
    if (!esc.ok) return json({ error: 'escritura rechazada', estado: esc.status }, 502, cors)
    return json({ ok: true }, 200, cors)
  }

  return json({ error: 'operacion desconocida' }, 400, cors)
})
