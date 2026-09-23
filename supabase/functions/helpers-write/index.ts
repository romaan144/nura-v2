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
// Nombres EXACTOS de la tabla real (comprobados contra information_schema
// el 2026-08-08): camelCase, y sin `ai_data` ni `chat_log`, que no existen.
const CAMPOS_ALTA: Record<string, 'texto' | 'numero' | 'lista' | 'booleano'> = {
  name: 'texto', specialty: 'texto', category: 'texto', bio: 'texto',
  zone: 'texto', city: 'texto', price: 'texto', avatarUrl: 'texto',
  responseTime: 'texto', qualificationLevel: 'texto', contacto: 'texto',
  rating: 'numero', reviews: 'numero', completionRate: 'numero', services: 'numero',
  tags: 'lista', skills: 'lista', languages: 'lista',
  presential: 'booleano', online: 'booleano', founder: 'booleano',
}

function limpiarAlta(entrada: Record<string, unknown>) {
  const salida: Record<string, unknown> = {}
  for (const [campo, tipo] of Object.entries(CAMPOS_ALTA)) {
    const v = entrada?.[campo]
    if (v === undefined || v === null) continue
    if (tipo === 'texto' && typeof v === 'string') salida[campo] = v.slice(0, 2000)
    else if (tipo === 'numero' && typeof v === 'number' && Number.isFinite(v)) salida[campo] = v
    else if (tipo === 'lista' && Array.isArray(v)) salida[campo] = v.slice(0, 40)
    else if (tipo === 'booleano' && typeof v === 'boolean') salida[campo] = v
  }
  // Estos NO los decide el cliente, nunca.
  salida.verified = false
  salida.dniVerified = false
  salida.criminalRecordClear = false
  salida.available = true
  return salida
}

/** El enlace que abre el canal del profesional con el mensaje ya escrito. */
function enlaceDe(contacto: string, mensaje: string): string {
  const c = contacto.trim()
  const esCorreo = c.includes('@') && /\.[a-z]{2,}$/i.test(c)
  if (esCorreo) {
    return `mailto:${encodeURIComponent(c)}?subject=${encodeURIComponent('Alguien te busca en Nüra')}&body=${encodeURIComponent(mensaje)}`
  }
  const n = c.replace(/[^\d+]/g, '').replace(/^00/, '+')
  const tel = n.startsWith('+') ? n.slice(1) : (n.length === 9 ? '34' + n : n)
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
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

  // ── un evento de uso ──
  // Lista blanca estricta: aqui NUNCA entra el texto de una consulta. Basta
  // la categoria para saber a quien reclutar, y guardar las frases de la
  // gente en una tabla de analitica es otra cosa.
  if (op === 'evento') {
    const e = (cuerpo.payload || {}) as Record<string, unknown>
    const TIPOS = ['busqueda', 'sin_cobertura', 'recomendacion_vista', 'contacto', 'servicio_confirmado', 'resultado_registrado']
    if (!TIPOS.includes(String(e.tipo))) return json({ error: 'tipo desconocido' }, 400, cors)
    const fila = {
      tipo: String(e.tipo),
      dispositivo: String(e.dispositivo ?? '').slice(0, 40),
      categoria: e.categoria ? String(e.categoria).slice(0, 40) : null,
      helper_id: e.helperId ? String(e.helperId).slice(0, 40) : null,
      resultados: typeof e.resultados === 'number' ? e.resultados : null,
      valoracion: typeof e.valoracion === 'number' ? e.valoracion : null,
      fecha: e.fecha ? String(e.fecha).slice(0, 40) : new Date().toISOString(),
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/eventos`, {
      method: 'POST',
      headers: { ...rest, Prefer: 'return=minimal' },
      body: JSON.stringify(fila),
    })
    if (!res.ok) return json({ error: 'evento rechazado', estado: res.status }, 502, cors)
    return json({ ok: true }, 200, cors)
  }

  // ── el aviso a un profesional ──
  // El `contacto` NO viaja al navegador (ver COLUMNAS_OCULTAS): un panel
  // dentro de la app no puede verlo, y esa restriccion es correcta. Asi que
  // el aviso se arma AQUI, donde esta la clave de servicio, y solo sale el
  // enlace ya construido — nunca la lista de telefonos.
  if (op === 'avisar') {
    const id = cuerpo.helperId
    const mensaje = String(cuerpo.mensaje ?? '').slice(0, 2000)
    if (id === undefined || id === null) return json({ error: 'falta helperId' }, 400, cors)
    if (!mensaje) return json({ error: 'falta mensaje' }, 400, cors)

    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${encodeURIComponent(String(id))}&select=name,contacto`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const [h] = await lec.json()
    if (!h) return json({ error: 'no existe' }, 404, cors)
    if (!h.contacto) return json({ ok: false, motivo: 'sin_contacto', nombre: h.name }, 200, cors)

    const esCorreo = String(h.contacto).includes('@')
    return json({ ok: true, via: esCorreo ? 'email' : 'movil', nombre: h.name,
      enlace: enlaceDe(String(h.contacto), mensaje) }, 200, cors)
  }

  // ── encolar un aviso ──
  // El aviso ya no depende de que alguien ejecute un comando: la app lo
  // encola sola en cuanto una persona escribe a un profesional. Aqui se
  // guarda; `npm run avisar --pendientes` los saca todos de una vez.
  //
  // Se guarda el MENSAJE, no el enlace: el enlace se construye al enviar,
  // con el contacto de ese momento. Y el contacto NO se guarda en la cola,
  // porque la cola es una tabla mas y no debe multiplicar donde vive un
  // dato personal.
  if (op === 'encolar-aviso') {
    const id = cuerpo.helperId
    const mensaje = String(cuerpo.mensaje ?? '').slice(0, 2000)
    if (id === undefined || id === null) return json({ error: 'falta helperId' }, 400, cors)
    if (!mensaje) return json({ error: 'falta mensaje' }, 400, cors)

    // Sin contacto no hay aviso posible: se guarda igual, para que el
    // fundador SEPA que alguien quedo sin poder ser avisado.
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?id=eq.${encodeURIComponent(String(id))}&select=name,contacto`,
      { headers: rest },
    )
    const [h] = lec.ok ? await lec.json() : [null]

    const res = await fetch(`${SUPABASE_URL}/rest/v1/avisos`, {
      method: 'POST',
      headers: { ...rest, Prefer: 'return=minimal' },
      body: JSON.stringify({
        helper_id: String(id),
        helper_nombre: h?.name ?? null,
        mensaje,
        alcanzable: Boolean(h?.contacto),
        estado: 'pendiente',
        // La llave de vuelta: va en el enlace y deja al profesional abrir y
        // responder SIN cuenta. Quien lo tiene es quien recibio el mensaje.
        token: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      }),
    })
    if (!res.ok) return json({ error: 'aviso no encolado', estado: res.status }, 502, cors)
    return json({ ok: true, alcanzable: Boolean(h?.contacto) }, 200, cors)
  }

  // ── los avisos pendientes, con su enlace ya montado ──
  if (op === 'pendientes') {
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?estado=eq.pendiente&select=id,helper_id,helper_nombre,mensaje,token,fecha&order=id.asc&limit=50`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const filas = await lec.json()

    const salida = []
    for (const f of filas) {
      const c2 = await fetch(
        `${SUPABASE_URL}/rest/v1/helpers?id=eq.${encodeURIComponent(String(f.helper_id))}&select=name,contacto`,
        { headers: rest },
      )
      const [hh] = c2.ok ? await c2.json() : [null]
      salida.push({
        id: f.id,
        nombre: hh?.name ?? f.helper_nombre ?? '(sin nombre)',
        enlace: hh?.contacto
          ? enlaceDe(String(hh.contacto), `${f.mensaje}\n\nResponde aquí: ${ORIGENES[0] || ''}/r/${f.token}`)
          : null,
        fecha: f.fecha,
      })
    }
    return json({ ok: true, avisos: salida }, 200, cors)
  }

  // ── marcar un aviso como enviado ──
  if (op === 'aviso-enviado') {
    const id = cuerpo.avisoId
    if (id === undefined || id === null) return json({ error: 'falta avisoId' }, 400, cors)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/avisos?id=eq.${encodeURIComponent(String(id))}`, {
      method: 'PATCH',
      headers: { ...rest, Prefer: 'return=minimal' },
      body: JSON.stringify({ estado: 'enviado' }),
    })
    if (!res.ok) return json({ error: 'no actualizado', estado: res.status }, 502, cors)
    return json({ ok: true }, 200, cors)
  }

  // ── LA VUELTA: el profesional abre su aviso ──
  // El enlace trae un `token`. No hace falta cuenta ni contraseña: quien
  // tiene el token es quien recibio el mensaje en su propio movil.
  // Devuelve el mensaje y su nombre — NUNCA el contacto ni la lista.
  if (op === 'abrir-aviso') {
    const token = String(cuerpo.token ?? '').trim()
    if (!token) return json({ error: 'falta token' }, 400, cors)
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?token=eq.${encodeURIComponent(token)}&select=id,helper_id,helper_nombre,mensaje,respuesta,fecha&limit=1`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const [av] = await lec.json()
    if (!av) return json({ error: 'no existe' }, 404, cors)
    return json({ ok: true, aviso: {
      id: av.id, nombre: av.helper_nombre, mensaje: av.mensaje,
      respuesta: av.respuesta ?? null, fecha: av.fecha,
    } }, 200, cors)
  }

  // ── LA VUELTA: el profesional responde ──
  if (op === 'responder-aviso') {
    const token = String(cuerpo.token ?? '').trim()
    const respuesta = String(cuerpo.respuesta ?? '').trim().slice(0, 4000)
    if (!token) return json({ error: 'falta token' }, 400, cors)
    if (!respuesta) return json({ error: 'falta respuesta' }, 400, cors)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?token=eq.${encodeURIComponent(token)}`,
      { method: 'PATCH', headers: { ...rest, Prefer: 'return=minimal' },
        body: JSON.stringify({ respuesta, estado: 'respondido', respondido_en: new Date().toISOString() }) },
    )
    if (!res.ok) return json({ error: 'no guardado', estado: res.status }, 502, cors)
    return json({ ok: true }, 200, cors)
  }

  // ── el usuario pregunta si ya le han respondido ──
  if (op === 'respuestas') {
    const ids = Array.isArray(cuerpo.helperIds) ? cuerpo.helperIds.map(String).slice(0, 20) : []
    if (!ids.length) return json({ ok: true, respuestas: [] }, 200, cors)
    const lista = ids.map(encodeURIComponent).join(',')
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?helper_id=in.(${lista})&respuesta=not.is.null&select=helper_id,respuesta,respondido_en`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    return json({ ok: true, respuestas: await lec.json() }, 200, cors)
  }

  // ── RECLAMAR LA FICHA (etapa 6b de docs/estudio-perfil.md) ─────────────
  // Une una cuenta (correo y contraseña) con SU ficha publica. El movil no
  // guarda que ficha es la suya, asi que la prueba es esta: el correo de la
  // cuenta, CONFIRMADO, coincide con el contacto que puso en el alta. Sin la
  // confirmacion, cualquiera podria crear una cuenta con el correo de otra
  // persona y quedarse con su ficha. La sesion viaja en el cuerpo (no en una
  // cabecera) porque el CORS de esta funcion solo admite content-type.
  if (op === 'reclamar-ficha') {
    const token = String(cuerpo.token || '')
    if (!token) return json({ error: 'falta la sesion' }, 401, cors)
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${token}` } })
    if (!u.ok) return json({ error: 'sesion no valida' }, 401, cors)
    const usuario = await u.json()
    const email = String(usuario?.email || '').trim().toLowerCase()
    if (!email || !usuario?.id) return json({ error: 'sesion sin correo' }, 400, cors)
    if (!usuario.email_confirmed_at && !usuario.confirmed_at) return json({ ok: false, motivo: 'sin-confirmar' }, 200, cors)

    // Se devuelve la ficha entera (no solo el id): al entrar desde un MOVIL
    // NUEVO, el movil no sabe nada de la profesional y la reconstruye con esto.
    // Solo columnas que crea el alta: pedir una que no exista rompe la consulta.
    const CAMPOS = 'id,name,specialty,zone,price,online,bio,contacto'
    const ya = await fetch(`${SUPABASE_URL}/rest/v1/helpers?owner_id=eq.${usuario.id}&select=${CAMPOS}`, { headers: rest })
    if (!ya.ok) return json({ error: 'lectura rechazada', estado: ya.status }, 502, cors)
    const suyas = await ya.json()
    if (suyas.length) return json({ ok: true, helper: suyas[0] }, 200, cors)

    const cand = await fetch(
      `${SUPABASE_URL}/rest/v1/helpers?contacto=ilike.${encodeURIComponent(email)}&owner_id=is.null&select=${CAMPOS}`,
      { headers: rest },
    )
    if (!cand.ok) return json({ error: 'lectura rechazada', estado: cand.status }, 502, cors)
    // ilike trata _ y * como comodines: se confirma la coincidencia EXACTA aqui.
    const filas = (await cand.json()).filter((f: { contacto?: string }) => String(f.contacto || '').trim().toLowerCase() === email)
    if (filas.length !== 1) return json({ ok: false, motivo: filas.length ? 'varias' : 'sin-ficha' }, 200, cors)

    const pat = await fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${filas[0].id}&owner_id=is.null`, {
      method: 'PATCH', headers: { ...rest, Prefer: 'return=minimal' }, body: JSON.stringify({ owner_id: usuario.id }),
    })
    if (!pat.ok) return json({ error: 'escritura rechazada', estado: pat.status }, 502, cors)
    return json({ ok: true, helper: filas[0] }, 200, cors)
  }

  // ── BORRAR LA CUENTA (etapa 6c · RGPD, derecho de supresion) ───────────
  // Borra, por este orden: los avisos que le llegaron (mensajes de clientes:
  // datos de terceros que solo existen por su ficha), su ficha publica y su
  // cuenta. Solo lo SUYO: la ficha se busca por owner_id = la cuenta de la
  // sesion, nunca por un id que mande el movil.
  if (op === 'borrar-cuenta') {
    const token = String(cuerpo.token || '')
    if (!token) return json({ error: 'falta la sesion' }, 401, cors)
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${token}` } })
    if (!u.ok) return json({ error: 'sesion no valida' }, 401, cors)
    const usuario = await u.json()
    if (!usuario?.id) return json({ error: 'sesion sin usuario' }, 400, cors)

    const suyas = await fetch(`${SUPABASE_URL}/rest/v1/helpers?owner_id=eq.${usuario.id}&select=id`, { headers: rest })
    if (!suyas.ok) return json({ error: 'lectura rechazada', estado: suyas.status }, 502, cors)
    for (const f of await suyas.json()) {
      const av = await fetch(`${SUPABASE_URL}/rest/v1/avisos?helper_id=eq.${encodeURIComponent(String(f.id))}`, { method: 'DELETE', headers: rest })
      // Si la tabla avisos aun no existe (404), no hay avisos que borrar.
      if (!av.ok && av.status !== 404) return json({ error: 'no se pudieron borrar los avisos', estado: av.status }, 502, cors)
      const fi = await fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${f.id}&owner_id=eq.${usuario.id}`, { method: 'DELETE', headers: rest })
      if (!fi.ok) return json({ error: 'no se pudo borrar la ficha', estado: fi.status }, 502, cors)
    }
    // La foto (etapa 7). 404 = no tenia foto: no es un error.
    const fo = await fetch(`${SUPABASE_URL}/storage/v1/object/fotos/${usuario.id}/perfil.jpg`, {
      method: 'DELETE', headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    if (!fo.ok && fo.status !== 404 && fo.status !== 400) return json({ error: 'no se pudo borrar la foto', estado: fo.status }, 502, cors)
    const cu = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${usuario.id}`, {
      method: 'DELETE', headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    })
    if (!cu.ok) return json({ error: 'no se pudo borrar la cuenta', estado: cu.status }, 502, cors)
    return json({ ok: true }, 200, cors)
  }

  return json({ error: 'operacion desconocida' }, 400, cors)
})
