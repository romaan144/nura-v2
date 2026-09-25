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

// ── ACCESO ADMINISTRATIVO ────────────────────────────────────────────────
// `avisar`, `pendientes` y `aviso-enviado` devuelven contactos, mensajes de
// la gente y la llave con la que el profesional responde. Son solo para el
// guion `npm run avisar`. Comprobar el origen NO basta: la cabecera `origin`
// la escribe quien llama, y fuera de un navegador se pone cualquiera.
//
// El secreto vive SOLO aqui (secreto de la funcion en Supabase) y en el
// entorno de quien ejecuta el guion. Viaja en una cabecera que el CORS no
// admite, asi que un navegador no puede mandarla aunque quisiera. Si falta o
// es corto, el acceso queda CERRADO: nunca abierto por defecto.
const ADMIN_SECRET = Deno.env.get('NURA_ADMIN_SECRET') ?? ''
const OPS_ADMIN = new Set(['avisar', 'pendientes', 'aviso-enviado'])

async function sha256(texto: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)))
}

/** Compara resumenes de igual longitud sin salir antes: no filtra por tiempo. */
function igualesSinPrisa(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let dif = 0
  for (let i = 0; i < a.length; i++) dif |= a[i] ^ b[i]
  return dif === 0
}

async function esAdmin(req: Request): Promise<boolean> {
  if (ADMIN_SECRET.length < 32) return false
  const dada = req.headers.get('x-nura-admin') ?? ''
  if (!dada) return false
  return igualesSinPrisa(await sha256(dada), await sha256(ADMIN_SECRET))
}

// ── LLAVES DE LOS AVISOS ─────────────────────────────────────────────────
// Cada aviso tiene DOS llaves distintas, sin relacion entre ellas:
//   · `token`         la del profesional: va en su enlace y deja abrir y
//                     RESPONDER. Se guarda tal cual: `pendientes` la necesita
//                     para montar el enlace.
//   · llave de lectura la de quien escribio: solo deja LEER la respuesta de
//                     su conversacion. Se le entrega una vez al encolar y
//                     aqui solo se guarda su resumen (`lectura_hash`).
// Quien tiene una no puede sacar la otra: el usuario no puede hacerse pasar
// por el profesional.
const hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('')
const llaveAleatoria = () => hex(crypto.getRandomValues(new Uint8Array(16)))
const FORMATO_LLAVE = /^[0-9a-f]{32}$/

// ── PERFIL VIVO: lo que puede decir un cliente al terminar ──────────────
// Lista cerrada: son toques, no texto libre, asi que nadie puede colar
// nada aqui. Las etiquetas visibles viven en src/utils/cualidades.js; si se
// añade una, va en los dos sitios.
const CUALIDADES = new Set([
  'paciente', 'puntual', 'trato_cercano', 'de_confianza', 'resuelve_bien',
  'explica_bien', 'motiva', 'se_adapta', 'deja_limpio', 'precio_claro',
  'amable', 'cuidadoso', 'rapido', 'buen_consejo', 'creativo',
])

// ── «TE AVISO SI APARECE ALGUIEN» (docs/perfil-vivo.md §10) ─────────────
// Notificaciones del movil SIN contenido: el aviso solo dice «hay algo
// nuevo» y la app, al abrirse, pregunta que es con su llave. Asi no hace
// falta cifrar nada y el servicio de notificaciones del navegador (Google,
// Apple, Mozilla) nunca ve que buscaba nadie. Se firma con VAPID; las llaves
// las crea esta funcion la primera vez y se guardan en `ajustes`.
const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const CATEGORIA_OK = /^[a-z_]{2,30}$/
// Solo se envia a servicios de notificaciones reales: una suscripcion es una
// URL que manda el movil, y sin esto la funcion podria llamar a cualquier sitio.
const PUSH_OK = /^https:\/\/([a-z0-9-]+\.)*(googleapis\.com|mozilla\.com|mozaws\.net|push\.apple\.com|notify\.windows\.com)\//
const MAX_ALERTAS_CORREO = 10

type Vapid = { publica: string, privada: JsonWebKey }

async function llavesVapid(): Promise<Vapid | null> {
  const lee = async () => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/ajustes?clave=eq.vapid&select=valor`, { headers: rest })
    if (!r.ok) return null
    const [f] = await r.json()
    return (f?.valor as Vapid) ?? null
  }
  const ya = await lee()
  if (ya) return ya
  const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair
  const publica = b64url(new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey)))
  const privada = await crypto.subtle.exportKey('jwk', par.privateKey)
  // Si dos llamadas las crean a la vez, gana la primera y las dos leen esa.
  await fetch(`${SUPABASE_URL}/rest/v1/ajustes?on_conflict=clave`, {
    method: 'POST', headers: { ...rest, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify({ clave: 'vapid', valor: { publica, privada } }),
  })
  return await lee()
}

/** Toca el movil. Devuelve false si la suscripcion ya no existe (hay que olvidarla). */
async function tocarMovil(push: { endpoint?: string }, vapid: Vapid): Promise<boolean> {
  const endpoint = String(push?.endpoint || '')
  if (!PUSH_OK.test(endpoint)) return false
  const cab = b64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const cuerpo = b64url(new TextEncoder().encode(JSON.stringify({
    aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: 'mailto:' + (Deno.env.get('NURA_CONTACTO') || 'hola@nura.app'),
  })))
  const llave = await crypto.subtle.importKey('jwk', vapid.privada, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const firma = b64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, llave, new TextEncoder().encode(`${cab}.${cuerpo}`))))
  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { TTL: '86400', Urgency: 'normal', Authorization: `vapid t=${cab}.${cuerpo}.${firma}, k=${vapid.publica}` },
    })
    return !(r.status === 404 || r.status === 410)
  } catch { return true }
}

const escHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

/** Correo por Resend. Sin RESEND_API_KEY y NURA_EMAIL_FROM no se envia nada. */
async function enviarCorreo(para: string, asunto: string, html: string): Promise<boolean> {
  const clave = Deno.env.get('RESEND_API_KEY'), de = Deno.env.get('NURA_EMAIL_FROM')
  if (!clave || !de) return false
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: [para], subject: asunto, html }),
    })
    return r.ok
  } catch { return false }
}

// ── EL BARRIO DE UNA ALERTA ─────────────────────────────────────────────
// Copia de src/data/barrios.js (nombre, lat, lng, alias). Una prueba de
// `npm run test:avisos` comprueba que las dos listas coinciden. Sirve para
// no avisar de alguien que trabaja lejos de donde lo necesitan.
const BARRIOS: [string, number, number, string[]][] = [
  ['Gràcia', 41.4036, 2.1560, ['gracia', 'vila de gracia']],
  ['Vallcarca', 41.4130, 2.1440, ['vallcarca']],
  ['El Putxet', 41.4080, 2.1420, ['putxet', 'el putxet']],
  ['Eixample', 41.3888, 2.1590, ['eixample', "l'eixample", 'ensanche']],
  ['Dreta de l\'Eixample', 41.3950, 2.1680, ['dreta eixample', "dreta de l'eixample", 'derecha del ensanche']],
  ['Esquerra de l\'Eixample', 41.3850, 2.1520, ['esquerra eixample', "esquerra de l'eixample", 'izquierda del ensanche']],
  ['Sagrada Família', 41.4036, 2.1744, ['sagrada familia']],
  ['Fort Pienc', 41.3960, 2.1820, ['fort pienc']],
  ['Sant Antoni', 41.3780, 2.1610, ['sant antoni', 'san antonio']],
  ['Sarrià', 41.4000, 2.1220, ['sarria']],
  ['Sant Gervasi', 41.4010, 2.1390, ['sant gervasi', 'san gervasio', 'sarria sant gervasi', 'sarria-sant gervasi']],
  ['La Bonanova', 41.4050, 2.1300, ['bonanova', 'la bonanova']],
  ['Pedralbes', 41.3890, 2.1120, ['pedralbes']],
  ['Les Corts', 41.3850, 2.1300, ['les corts', 'las corts']],
  ['Sants', 41.3750, 2.1370, ['sants']],
  ['Hostafrancs', 41.3750, 2.1430, ['hostafrancs']],
  ['Poble Sec', 41.3730, 2.1620, ['poble sec', 'poble-sec', 'pueblo seco']],
  ['Montjuïc', 41.3640, 2.1580, ['montjuic']],
  ['Raval', 41.3800, 2.1690, ['raval', 'el raval']],
  ['Gòtic', 41.3830, 2.1770, ['gotic', 'barri gotic', 'barrio gotico', 'gotico']],
  ['Born', 41.3850, 2.1830, ['born', 'el born', 'la ribera', 'sant pere']],
  ['Ciutat Vella', 41.3820, 2.1760, ['ciutat vella', 'ciudad vieja', 'centro de barcelona', 'casco antiguo']],
  ['Barceloneta', 41.3800, 2.1890, ['barceloneta', 'la barceloneta']],
  ['Vila Olímpica', 41.3890, 2.1970, ['vila olimpica', 'villa olimpica']],
  ['Poblenou', 41.4000, 2.2000, ['poblenou', 'poble nou', 'pueblo nuevo']],
  ['Diagonal Mar', 41.4090, 2.2160, ['diagonal mar']],
  ['Sant Martí', 41.4180, 2.1990, ['sant marti', 'san marti', 'san martin']],
  ['Glòries', 41.4030, 2.1870, ['glories']],
  ['Clot', 41.4090, 2.1870, ['clot', 'el clot']],
  ['La Verneda', 41.4240, 2.2020, ['verneda', 'la verneda']],
  ['La Sagrera', 41.4230, 2.1900, ['sagrera', 'la sagrera']],
  ['Sant Andreu', 41.4350, 2.1900, ['sant andreu', 'san andres']],
  ['Guinardó', 41.4180, 2.1700, ['guinardo', 'el guinardo']],
  ['Horta', 41.4300, 2.1600, ['horta']],
  ['Horta-Guinardó', 41.4200, 2.1650, ['horta guinardo', 'horta-guinardo']],
  ['El Carmel', 41.4230, 2.1550, ['carmel', 'el carmel', 'el carmelo']],
  ['Nou Barris', 41.4420, 2.1770, ['nou barris']],
  ['Verdun', 41.4430, 2.1730, ['verdun']],
  ['L\'Hospitalet', 41.3597, 2.0997, ['hospitalet', "l'hospitalet", 'hospitalet de llobregat']],
  ['Badalona', 41.4500, 2.2474, ['badalona']],
  ['Esplugues', 41.3760, 2.0880, ['esplugues', 'esplugues de llobregat']],
  ['Santa Coloma', 41.4520, 2.2080, ['santa coloma', 'santa coloma de gramenet']],
]
const RADIO_ALERTA_KM = 5
const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’`]/g, "'")
const ALIAS_BARRIOS = BARRIOS.flatMap(b => b[3].map(a => ({ a: sinTildes(a), b }))).sort((x, y) => y.a.length - x.a.length)

/** El barrio que nombra la zona de un profesional, o null. */
function barrioDeTexto(texto: string): [string, number, number, string[]] | null {
  const t = ' ' + sinTildes(texto).replace(/[^a-z0-9' -]/g, ' ') + ' '
  for (const { a, b } of ALIAS_BARRIOS) {
    if (new RegExp(`[^a-z0-9']${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9']`).test(t)) return b
  }
  const exacto = BARRIOS.find(b => sinTildes(b[0]) === sinTildes(texto).trim())
  return exacto || null
}

function kmEntre(la1: number, ln1: number, la2: number, ln2: number): number {
  const R = 6371, rad = (x: number) => x * Math.PI / 180
  const dLat = rad(la2 - la1), dLng = rad(ln2 - ln1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * ¿Le vale a esta alerta un profesional de esta zona? Si no se sabe (zona
 * sin barrio conocido, «toda Barcelona», online), SI: mejor un aviso de mas
 * que perder al unico que ha llegado.
 */
function cercaDeLaAlerta(zonaAlerta: { lat?: unknown, lng?: unknown } | null, h: { zone?: unknown, online?: unknown }): boolean {
  if (!zonaAlerta || typeof zonaAlerta.lat !== 'number' || typeof zonaAlerta.lng !== 'number') return true
  if (h.online === true) return true
  const zona = String(h.zone || '')
  if (/toda barcelona|toda la ciudad|cualquier zona|me desplazo/i.test(sinTildes(zona))) return true
  const b = barrioDeTexto(zona)
  if (!b) return true
  return kmEntre(zonaAlerta.lat, zonaAlerta.lng, b[1], b[2]) <= RADIO_ALERTA_KM
}

/** El barrio que manda la app para una alerta: solo si es uno de la lista. */
function zonaDeAlerta(entrada: unknown): { nombre: string, lat: number, lng: number } | null {
  const nombre = String((entrada as { nombre?: unknown })?.nombre ?? '')
  const b = BARRIOS.find(x => x[0] === nombre)
  return b ? { nombre: b[0], lat: b[1], lng: b[2] } : null
}

/**
 * Ha llegado un profesional: avisa a quien lo estaba esperando. Nunca hace
 * fallar el alta: si algo no sale, el profesional queda dado de alta igual.
 */
async function avisarAlertas(h: { id?: unknown, name?: unknown, specialty?: unknown, category?: unknown, zone?: unknown, online?: unknown }) {
  try {
    const cat = String(h?.category || '')
    if (!CATEGORIA_OK.test(cat) || h?.id === undefined) return
    const ahora = new Date().toISOString()
    // De paso se borran las caducadas: caducar es borrar, no esconder.
    await fetch(`${SUPABASE_URL}/rest/v1/alertas?caduca_en=lt.${ahora}`, { method: 'DELETE', headers: rest })
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/alertas?categorias=cs.{${cat}}&caduca_en=gt.${ahora}&select=id,que,correo,push,baja,encontrados,zona`,
      { headers: rest },
    )
    if (!r.ok) return
    // Si la pidio para un barrio, solo cuenta quien trabaja cerca.
    const alertas = (await r.json()).filter((a: { zona?: { lat?: unknown, lng?: unknown } | null }) => cercaDeLaAlerta(a.zona ?? null, h))
    if (!alertas.length) return
    const vapid = alertas.some((a: { push?: unknown }) => a.push) ? await llavesVapid() : null
    const nombre = String(h.name || '').split(' ')[0] || 'Alguien'
    const oficio = String(h.specialty || '')
    const origen = ORIGENES[0] || ''
    for (const a of alertas) {
      const encontrados = [...(a.encontrados || []), { id: h.id, nombre, especialidad: oficio, fecha: ahora }].slice(-20)
      const cambios: Record<string, unknown> = { encontrados, avisada_en: ahora }
      if (a.push && vapid && !(await tocarMovil(a.push, vapid))) cambios.push = null
      if (a.correo) {
        await enviarCorreo(a.correo, `Ha llegado a Nüra: ${oficio || a.que}`,
          `<p>Hola:</p><p>Nos pediste que te avisáramos si llegaba a Nüra alguien de <b>${escHtml(a.que)}</b>${a.zona?.nombre ? ` cerca de ${escHtml(a.zona.nombre)}` : ''}.</p>` +
          `<p><b>${escHtml(nombre)}</b>${oficio ? ` (${escHtml(oficio)})` : ''} acaba de darse de alta.</p>` +
          `<p><a href="${origen}/helper/${encodeURIComponent(String(h.id))}">Ver su ficha</a></p>` +
          `<p style="color:#777;font-size:13px">¿Ya no lo necesitas? <a href="${origen}/baja/${a.baja}">Deja de avisarme</a>. ` +
          `Este aviso se borra solo a los 3 meses.</p>`)
      }
      await fetch(`${SUPABASE_URL}/rest/v1/alertas?id=eq.${a.id}`, {
        method: 'PATCH', headers: { ...rest, Prefer: 'return=minimal' }, body: JSON.stringify(cambios),
      })
    }
  } catch { /* el alta ya esta hecha: un aviso perdido no la deshace */ }
}

// ── EL AVISO AL PROFESIONAL, POR CORREO ─────────────────────────────────
// Solo si dio un correo como contacto y hay proveedor (Resend). Con
// NURA_AVISOS_MANUALES=1 se apaga y todo vuelve a `npm run avisar`. Tope por
// profesional: si en la ultima hora ya se le enviaron 5, el resto espera al
// envio manual (nadie puede usar Nüra para llenarle el buzon).
const MAX_CORREOS_HORA = 5
const esCorreo = (c: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c.trim())

async function avisoPorCorreo(avisoId: unknown, helperId: string, h: { name?: unknown, contacto?: unknown } | null, mensaje: string, token: string): Promise<boolean> {
  try {
    const contacto = String(h?.contacto || '').trim()
    if (!esCorreo(contacto) || Deno.env.get('NURA_AVISOS_MANUALES') === '1') return false
    if (!Deno.env.get('RESEND_API_KEY') || !Deno.env.get('NURA_EMAIL_FROM')) return false
    const hace1h = new Date(Date.now() - 3600e3).toISOString()
    const r = await fetch(`${SUPABASE_URL}/rest/v1/avisos?helper_id=eq.${encodeURIComponent(helperId)}&estado=eq.enviado&enviado_en=gt.${hace1h}&select=id`, { headers: rest })
    if (!r.ok || (await r.json()).length >= MAX_CORREOS_HORA) return false
    const origen = ORIGENES[0] || ''
    const nombre = String(h?.name || '').split(' ')[0]
    const ok = await enviarCorreo(contacto, 'Alguien te busca en Nüra',
      `<p>Hola${nombre ? ' ' + escHtml(nombre) : ''}:</p><p>Alguien te ha escrito en Nüra:</p>` +
      `<blockquote style="margin:0;padding:12px 16px;border-left:3px solid #7c3aed;background:#f6f3ff;white-space:pre-wrap">${escHtml(mensaje)}</blockquote>` +
      `<p><a href="${origen}/r/${token}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:999px;text-decoration:none;font-weight:600">Responder</a></p>` +
      `<p style="color:#777;font-size:13px">No hace falta cuenta: el enlace es solo tuyo. No lo compartas.</p>`)
    if (!ok) return false
    await fetch(`${SUPABASE_URL}/rest/v1/avisos?id=eq.${avisoId}`, {
      method: 'PATCH', headers: { ...rest, Prefer: 'return=minimal' },
      body: JSON.stringify({ estado: 'enviado', enviado_en: new Date().toISOString() }),
    })
    return true
  } catch { return false }
}

// ── LO DECLARADO (perfil vivo §4) ───────────────────────────────────────
// La IA (funcion `perfil-ia`) PROPONE; aqui solo entra lo que el profesional
// CONFIRMA. Vocabulario cerrado (el de perfil-ia): cualquier otra clave se
// descarta. Se guarda con fuente «declarado» y la fecha de la confirmacion.
const DISPONIBLES = new Set(['mañanas', 'tardes', 'noches', 'fines de semana', 'urgencias'])
const TEXTO_DECLARADO = /^[\p{L}\p{N} .,'()/-]{1,60}$/u

function limpiarDeclarado(entrada: unknown): { clave: string, valor: unknown }[] {
  if (!Array.isArray(entrada)) return []
  const vistas = new Set<string>()
  const salida: { clave: string, valor: unknown }[] = []
  for (const a of entrada.slice(0, 40)) {
    const clave = String((a as { clave?: unknown })?.clave ?? '')
    const valor = (a as { valor?: unknown })?.valor
    let ok = false
    if (clave === 'vehiculo') ok = typeof valor === 'boolean'
    else if (clave === 'anos_experiencia') ok = Number.isInteger(valor) && (valor as number) >= 0 && (valor as number) <= 70
    else {
      const m = /^(idioma|especialidad|personas|titulo|disponibilidad):(.+)$/u.exec(clave)
      if (m && valor === true && TEXTO_DECLARADO.test(m[2]) && (m[1] !== 'disponibilidad' || DISPONIBLES.has(m[2]))) ok = true
    }
    if (ok && !vistas.has(clave)) { vistas.add(clave); salida.push({ clave, valor }) }
  }
  return salida
}

/** Reemplaza TODO lo declarado de un profesional por lo que acaba de confirmar. */
async function guardarDeclarado(helperId: string, atributos: { clave: string, valor: unknown }[]): Promise<boolean> {
  const del = await fetch(`${SUPABASE_URL}/rest/v1/perfil_atributos?helper_id=eq.${encodeURIComponent(helperId)}&fuente=eq.declarado`, { method: 'DELETE', headers: rest })
  if (!del.ok) return false
  if (!atributos.length) return true
  const fecha = new Date().toISOString().slice(0, 10)
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/perfil_atributos`, {
    method: 'POST', headers: { ...rest, Prefer: 'return=minimal' },
    body: JSON.stringify(atributos.map(a => ({ helper_id: helperId, clave: a.clave, fuente: 'declarado', valor: a.valor, prueba: `lo confirmó el ${fecha}` }))),
  })
  return ins.ok
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

  if (OPS_ADMIN.has(op)) {
    if (ADMIN_SECRET.length < 32) return json({ error: 'acceso administrativo sin configurar' }, 503, cors)
    if (!(await esAdmin(req))) return json({ error: 'no autorizado' }, 401, cors)
  }

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
    // Lo que confirmo al darse de alta (la IA lo propuso en la app). Si no
    // se guarda, el alta vale igual: se puede confirmar despues.
    const declarado = limpiarDeclarado(cuerpo.declarado)
    if (declarado.length && datos?.[0]?.id !== undefined) await guardarDeclarado(String(datos[0].id), declarado)
    // Quien estaba esperando a alguien asi recibe el aviso. En segundo plano
    // si el entorno lo permite: el alta no espera a los correos.
    const avisos = avisarAlertas(datos?.[0] ?? fila)
    const er = (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime
    if (er?.waitUntil) er.waitUntil(avisos); else await avisos
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

    // La llave de lectura sale UNA vez, hacia quien escribio; aqui solo
    // queda su resumen. Ver "LLAVES DE LOS AVISOS" arriba.
    const lectura = llaveAleatoria()
    const token = llaveAleatoria()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/avisos`, {
      method: 'POST',
      headers: { ...rest, Prefer: 'return=representation' },
      body: JSON.stringify({
        helper_id: String(id),
        helper_nombre: h?.name ?? null,
        mensaje,
        alcanzable: Boolean(h?.contacto),
        estado: 'pendiente',
        // La llave de vuelta: va en el enlace y deja al profesional abrir y
        // responder SIN cuenta. Quien lo tiene es quien recibio el mensaje.
        token,
        lectura_hash: hex(await sha256(lectura)),
      }),
    })
    if (!res.ok) return json({ error: 'aviso no encolado', estado: res.status }, 502, cors)
    const [nuevo] = await res.json()
    // Si el profesional dio un CORREO, el aviso le llega solo (sin esperar a
    // `npm run avisar`). Los moviles siguen por WhatsApp, a mano.
    const enviado = nuevo?.id !== undefined ? await avisoPorCorreo(nuevo.id, String(id), h, mensaje, token) : false
    return json({ ok: true, alcanzable: Boolean(h?.contacto), lectura, enviado }, 200, cors)
  }

  // ── los avisos pendientes, con su enlace ya montado ──
  if (op === 'pendientes') {
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?estado=eq.pendiente&lectura_hash=not.is.null&select=id,helper_id,helper_nombre,mensaje,token,fecha&order=id.asc&limit=50`,
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
      // `enviado_en` mide desde cuando tiene el aviso el profesional: de ahi
      // sale cuanto tarda en contestar (perfil vivo, fuente «medido»).
      body: JSON.stringify({ estado: 'enviado', enviado_en: new Date().toISOString() }),
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
    if (!FORMATO_LLAVE.test(token)) return json({ error: 'no existe' }, 404, cors)
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
    if (!FORMATO_LLAVE.test(token)) return json({ error: 'no existe' }, 404, cors)
    // Se responde UNA vez: `respuesta=is.null` impide reescribir una
    // respuesta ya dada (antes cualquiera con el token podia cambiarla).
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?token=eq.${encodeURIComponent(token)}&respuesta=is.null`,
      { method: 'PATCH', headers: { ...rest, Prefer: 'return=representation' },
        body: JSON.stringify({ respuesta, estado: 'respondido', respondido_en: new Date().toISOString() }) },
    )
    if (!res.ok) return json({ error: 'no guardado', estado: res.status }, 502, cors)
    const filas = await res.json()
    if (!filas.length) {
      // O no existe, o ya estaba respondido. Se distingue para la pantalla.
      const ya = await fetch(
        `${SUPABASE_URL}/rest/v1/avisos?token=eq.${encodeURIComponent(token)}&select=id&limit=1`,
        { headers: rest },
      )
      const [av] = ya.ok ? await ya.json() : []
      return av ? json({ error: 'ya respondido' }, 409, cors) : json({ error: 'no existe' }, 404, cors)
    }
    // Si quien escribio pidio «avisame cuando conteste», se le toca el movil
    // (sin contenido) y se olvida su suscripcion: ya no hace falta.
    if (filas[0]?.push) {
      const vapid = await llavesVapid()
      if (vapid) await tocarMovil(filas[0].push, vapid)
      await fetch(`${SUPABASE_URL}/rest/v1/avisos?id=eq.${filas[0].id}`, {
        method: 'PATCH', headers: { ...rest, Prefer: 'return=minimal' }, body: JSON.stringify({ push: null }),
      })
    }
    return json({ ok: true }, 200, cors)
  }

  // ── «AVISAME CUANDO CONTESTE» ──
  // Quien escribio (con SU llave de lectura) deja la suscripcion de su movil
  // en ESE aviso. Solo mientras no haya respuesta; al responder se usa una
  // vez y se borra. Solo servicios de notificaciones reales (PUSH_OK).
  if (op === 'avisar-respuesta') {
    const llave = String(cuerpo.llave ?? '')
    const p = cuerpo.push as { endpoint?: unknown, keys?: unknown } | undefined
    if (!FORMATO_LLAVE.test(llave)) return json({ error: 'no existe' }, 404, cors)
    if (!p || typeof p.endpoint !== 'string' || !PUSH_OK.test(p.endpoint)) return json({ error: 'suscripcion no valida' }, 400, cors)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/avisos?lectura_hash=eq.${hex(await sha256(llave))}&respuesta=is.null`, {
      method: 'PATCH', headers: { ...rest, Prefer: 'return=representation' },
      body: JSON.stringify({ push: { endpoint: p.endpoint.slice(0, 1000), keys: p.keys ?? null } }),
    })
    if (!r.ok) return json({ error: 'no guardado', estado: r.status }, 502, cors)
    return (await r.json()).length ? json({ ok: true }, 200, cors) : json({ error: 'no existe o ya respondido' }, 404, cors)
  }

  // ── SEGUIR LA CONVERSACION ──
  // Antes solo el PRIMER mensaje llegaba al profesional: lo que la persona
  // escribia despues no iba a ningun sitio. Ahora, mientras el profesional
  // no ha contestado, lo nuevo se AÑADE a su aviso (lo vera todo junto al
  // abrir su enlace). Si ya contesto, responde 409 y la app encola un aviso
  // nuevo. Solo con la llave de lectura de esa conversacion.
  if (op === 'ampliar-aviso') {
    const llave = String(cuerpo.llave ?? '')
    const mensaje = String(cuerpo.mensaje ?? '').trim().slice(0, 1000)
    if (!FORMATO_LLAVE.test(llave)) return json({ error: 'no existe' }, 404, cors)
    if (!mensaje) return json({ error: 'falta mensaje' }, 400, cors)
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?lectura_hash=eq.${hex(await sha256(llave))}&select=id,mensaje,respuesta&limit=1`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const [av] = await lec.json()
    if (!av) return json({ error: 'no existe' }, 404, cors)
    if (av.respuesta) return json({ error: 'ya respondido' }, 409, cors)
    const nuevo = `${av.mensaje}\n\n—\n${mensaje}`
    if (nuevo.length > 6000) return json({ error: 'demasiado largo' }, 413, cors)
    // `respuesta=is.null` tambien aqui: si contesta justo ahora, no se pisa.
    const res = await fetch(`${SUPABASE_URL}/rest/v1/avisos?id=eq.${av.id}&respuesta=is.null`, {
      method: 'PATCH', headers: { ...rest, Prefer: 'return=representation' }, body: JSON.stringify({ mensaje: nuevo }),
    })
    if (!res.ok) return json({ error: 'no guardado', estado: res.status }, 502, cors)
    return (await res.json()).length ? json({ ok: true }, 200, cors) : json({ error: 'ya respondido' }, 409, cors)
  }

  // ── el usuario pregunta si ya le han respondido ──
  // Solo con SUS llaves de lectura: cada una abre la respuesta de UNA
  // conversacion. Preguntar por un profesional ya no devuelve nada: antes
  // devolvia lo que ese profesional hubiera contestado a cualquiera.
  // Los avisos anteriores a las llaves no tienen `lectura_hash` y no salen
  // nunca por aqui (ver supabase/migrations).
  if (op === 'respuestas') {
    const llaves = Array.isArray(cuerpo.llaves)
      ? [...new Set(cuerpo.llaves.map(String).filter(l => FORMATO_LLAVE.test(l)))].slice(0, 50)
      : []
    if (!llaves.length) return json({ ok: true, respuestas: [] }, 200, cors)
    const resumenes = await Promise.all(llaves.map(async l => hex(await sha256(l))))
    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?lectura_hash=in.(${resumenes.join(',')})&respuesta=not.is.null&select=lectura_hash,respuesta,respondido_en`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const deLlave = new Map(resumenes.map((r, i) => [r, llaves[i]]))
    const filas: { lectura_hash: string, respuesta: string, respondido_en: string }[] = await lec.json()
    return json({ ok: true, respuestas: filas.map(f => ({
      llave: deLlave.get(f.lectura_hash), respuesta: f.respuesta, respondido_en: f.respondido_en,
    })) }, 200, cors)
  }

  // ── VALORAR (perfil vivo, docs/perfil-vivo.md §3) ──────────────────────
  // Solo valora quien de verdad escribio a ese profesional: la prueba es su
  // llave de lectura, que solo tiene quien envio el mensaje. El profesional
  // se saca del aviso, NUNCA de lo que mande el movil. Una vez por
  // conversacion (aviso_id unico). El comentario solo se guarda si el
  // cliente acepta que sea publico: si no, ni siquiera se guarda.
  if (op === 'valorar') {
    const llave = String(cuerpo.llave ?? '')
    if (!FORMATO_LLAVE.test(llave)) return json({ error: 'no existe' }, 404, cors)
    const e = cuerpo.estrellas
    const estrellas = Number.isInteger(e) && (e as number) >= 1 && (e as number) <= 5 ? e : null
    const volveria = typeof cuerpo.volveria === 'boolean' ? cuerpo.volveria : null
    const cualidades = Array.isArray(cuerpo.cualidades)
      ? [...new Set(cuerpo.cualidades.map(String).filter(c => CUALIDADES.has(c)))].slice(0, 3)
      : []
    if (estrellas === null && volveria === null && !cualidades.length) {
      return json({ error: 'valoracion vacia' }, 400, cors)
    }
    const publico = cuerpo.publico === true
    const comentario = publico ? (String(cuerpo.comentario ?? '').trim().slice(0, 500) || null) : null

    const lec = await fetch(
      `${SUPABASE_URL}/rest/v1/avisos?lectura_hash=eq.${hex(await sha256(llave))}&select=id,helper_id&limit=1`,
      { headers: rest },
    )
    if (!lec.ok) return json({ error: 'lectura rechazada', estado: lec.status }, 502, cors)
    const [av] = await lec.json()
    if (!av) return json({ error: 'no existe' }, 404, cors)

    const res = await fetch(`${SUPABASE_URL}/rest/v1/valoraciones`, {
      method: 'POST',
      headers: { ...rest, Prefer: 'return=minimal' },
      body: JSON.stringify({ helper_id: String(av.helper_id), aviso_id: av.id, estrellas, volveria,
        cualidades, comentario, comentario_publico: publico && Boolean(comentario) }),
    })
    if (res.status === 409) return json({ error: 'ya valorado' }, 409, cors)
    if (!res.ok) return json({ error: 'no guardado', estado: res.status }, 502, cors)
    return json({ ok: true }, 200, cors)
  }

  // ── «TE AVISO SI APARECE ALGUIEN» ───────────────────────────────────────
  // La llave publica para que el movil se suscriba a las notificaciones.
  if (op === 'clave-push') {
    const v = await llavesVapid()
    return v ? json({ ok: true, clave: v.publica }, 200, cors) : json({ error: 'sin llaves' }, 502, cors)
  }

  // Guardar una alerta. Solo con el SI de la persona (lo pide la app antes).
  // Se guarda el oficio, nunca la frase. El correo sale de SU cuenta con el
  // correo confirmado, nunca de lo que escriba el movil: asi nadie puede
  // apuntar a otra persona a recibir correos.
  if (op === 'crear-alerta') {
    const categorias = Array.isArray(cuerpo.categorias)
      ? [...new Set(cuerpo.categorias.map(String).filter(c => CATEGORIA_OK.test(c)))].slice(0, 6)
      : []
    const que = String(cuerpo.que ?? '').trim().slice(0, 60)
    if (!categorias.length || !que) return json({ error: 'falta el oficio' }, 400, cors)

    let push: { endpoint: string, keys?: unknown } | null = null
    const p = cuerpo.push as { endpoint?: unknown, keys?: unknown } | undefined
    if (p && typeof p.endpoint === 'string') {
      if (!PUSH_OK.test(p.endpoint)) return json({ error: 'suscripcion no valida' }, 400, cors)
      push = { endpoint: p.endpoint.slice(0, 1000), keys: p.keys ?? null }
    }

    let correo: string | null = null
    if (cuerpo.sesion) {
      const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${String(cuerpo.sesion)}` } })
      if (!u.ok) return json({ error: 'sesion no valida' }, 401, cors)
      const usuario = await u.json()
      if (!usuario?.email || (!usuario.email_confirmed_at && !usuario.confirmed_at)) return json({ error: 'correo sin confirmar' }, 400, cors)
      correo = String(usuario.email).trim().toLowerCase()
      const ya = await fetch(`${SUPABASE_URL}/rest/v1/alertas?correo=eq.${encodeURIComponent(correo)}&select=id`, { headers: rest })
      if (ya.ok && (await ya.json()).length >= MAX_ALERTAS_CORREO) return json({ error: 'demasiadas alertas' }, 429, cors)
    }

    const llave = llaveAleatoria()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/alertas`, {
      method: 'POST',
      headers: { ...rest, Prefer: 'return=representation' },
      body: JSON.stringify({ categorias, que, correo, push, zona: zonaDeAlerta(cuerpo.zona), llave_hash: hex(await sha256(llave)), baja: llaveAleatoria() }),
    })
    if (!res.ok) return json({ error: 'no guardada', estado: res.status }, 502, cors)
    const [fila] = await res.json()
    return json({ ok: true, llave, caduca_en: fila?.caduca_en ?? null,
      canales: { movil: Boolean(push), correo: Boolean(correo) },
      correoActivo: Boolean(Deno.env.get('RESEND_API_KEY') && Deno.env.get('NURA_EMAIL_FROM')) }, 200, cors)
  }

  // Las alertas de ESTE movil (por sus llaves) y quien ha llegado.
  if (op === 'alertas') {
    const llaves = Array.isArray(cuerpo.llaves)
      ? [...new Set(cuerpo.llaves.map(String).filter(l => FORMATO_LLAVE.test(l)))].slice(0, 20)
      : []
    if (!llaves.length) return json({ ok: true, alertas: [] }, 200, cors)
    const resumenes = await Promise.all(llaves.map(async l => hex(await sha256(l))))
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/alertas?llave_hash=in.(${resumenes.join(',')})&caduca_en=gt.${new Date().toISOString()}&select=llave_hash,que,caduca_en,encontrados,correo,push,zona`,
      { headers: rest },
    )
    if (!r.ok) return json({ error: 'lectura rechazada', estado: r.status }, 502, cors)
    const deLlave = new Map(resumenes.map((h, i) => [h, llaves[i]]))
    const filas: { llave_hash: string, que: string, caduca_en: string, encontrados: unknown[], correo: string | null, push: unknown, zona: { nombre?: string } | null }[] = await r.json()
    return json({ ok: true, alertas: filas.map(f => ({
      llave: deLlave.get(f.llave_hash), que: f.que, zona: f.zona?.nombre ?? null, caduca_en: f.caduca_en, encontrados: f.encontrados || [],
      canales: { movil: Boolean(f.push), correo: Boolean(f.correo) },
    })) }, 200, cors)
  }

  // Renovar una alerta que va a caducar: 3 meses mas desde HOY (nunca mas).
  // Solo con la llave del movil y solo si sigue viva: lo caducado se borro.
  if (op === 'renovar-alerta') {
    const llave = String(cuerpo.llave ?? '')
    if (!FORMATO_LLAVE.test(llave)) return json({ error: 'no existe' }, 404, cors)
    const ahora = new Date()
    const caduca_en = new Date(ahora.getTime() + 90 * 864e5).toISOString()
    const r = await fetch(`${SUPABASE_URL}/rest/v1/alertas?llave_hash=eq.${hex(await sha256(llave))}&caduca_en=gt.${ahora.toISOString()}`, {
      method: 'PATCH', headers: { ...rest, Prefer: 'return=representation' }, body: JSON.stringify({ caduca_en }),
    })
    if (!r.ok) return json({ error: 'no renovada', estado: r.status }, 502, cors)
    return (await r.json()).length ? json({ ok: true, caduca_en }, 200, cors) : json({ error: 'no existe' }, 404, cors)
  }

  // Borrar una alerta: con la llave del movil o con el enlace del correo.
  if (op === 'quitar-alerta') {
    const llave = String(cuerpo.llave ?? ''), baja = String(cuerpo.baja ?? '')
    let filtro = ''
    if (FORMATO_LLAVE.test(llave)) filtro = `llave_hash=eq.${hex(await sha256(llave))}`
    else if (FORMATO_LLAVE.test(baja)) filtro = `baja=eq.${baja}`
    else return json({ error: 'no existe' }, 404, cors)
    const r = await fetch(`${SUPABASE_URL}/rest/v1/alertas?${filtro}`, { method: 'DELETE', headers: { ...rest, Prefer: 'return=representation' } })
    if (!r.ok) return json({ error: 'no borrada', estado: r.status }, 502, cors)
    const borradas = await r.json()
    return borradas.length ? json({ ok: true }, 200, cors) : json({ error: 'no existe' }, 404, cors)
  }

  // ── Confirmar lo declarado desde «Editar mi ficha» ──
  // Solo la profesional con sesion, y solo sobre SU ficha (owner_id).
  if (op === 'confirmar-declarado') {
    const token = String(cuerpo.sesion || '')
    if (!token) return json({ error: 'falta la sesion' }, 401, cors)
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${token}` } })
    if (!u.ok) return json({ error: 'sesion no valida' }, 401, cors)
    const usuario = await u.json()
    if (!usuario?.id) return json({ error: 'sesion sin usuario' }, 401, cors)
    const f = await fetch(`${SUPABASE_URL}/rest/v1/helpers?owner_id=eq.${usuario.id}&select=id&limit=1`, { headers: rest })
    if (!f.ok) return json({ error: 'lectura rechazada', estado: f.status }, 502, cors)
    const [ficha] = await f.json()
    if (!ficha) return json({ error: 'sin ficha' }, 404, cors)
    const ok = await guardarDeclarado(String(ficha.id), limpiarDeclarado(cuerpo.atributos))
    return ok ? json({ ok: true }, 200, cors) : json({ error: 'no guardado' }, 502, cors)
  }

  // ── EL PULSO: la semana de la profesional, con datos REALES ──
  // Antes el Pulso se inventaba las cifras con un numero al azar («9
  // personas buscaron…»). Ahora cuenta lo que ha pasado de verdad en 7 dias:
  // busquedas de su oficio (solo la categoria: nunca la frase), veces que su
  // ficha salio recomendada y mensajes recibidos y contestados. Solo con
  // sesion y solo de SU ficha.
  if (op === 'mi-pulso') {
    const token = String(cuerpo.sesion || '')
    if (!token) return json({ error: 'falta la sesion' }, 401, cors)
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${token}` } })
    if (!u.ok) return json({ error: 'sesion no valida' }, 401, cors)
    const usuario = await u.json()
    if (!usuario?.id) return json({ error: 'sesion sin usuario' }, 401, cors)
    const f = await fetch(`${SUPABASE_URL}/rest/v1/helpers?owner_id=eq.${usuario.id}&select=id,category&limit=1`, { headers: rest })
    if (!f.ok) return json({ error: 'lectura rechazada', estado: f.status }, 502, cors)
    const [ficha] = await f.json()
    if (!ficha) return json({ error: 'sin ficha' }, 404, cors)

    const desde = new Date(Date.now() - 7 * 864e5).toISOString()
    const id = encodeURIComponent(String(ficha.id))
    // Las busquedas se anotan con la categoria de la APP; la ficha guarda la
    // de la base de datos (mismo mapeo que src/utils/matching.js).
    const APP: Record<string, string> = { matematicas: 'clases', limpieza: 'hogar', educacion: 'clases' }
    const cat = String(ficha.category || '')
    const catApp = APP[cat] || cat
    const contar = async (ruta: string) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}&limit=5000`, { headers: rest })
      return r.ok ? (await r.json()).length : null
    }
    const [busquedas, apariciones, recibidos, respondidos] = await Promise.all([
      CATEGORIA_OK.test(catApp) ? contar(`eventos?tipo=in.(busqueda,sin_cobertura)&categoria=eq.${catApp}&fecha=gt.${desde}&select=id`) : null,
      contar(`eventos?tipo=eq.recomendacion_vista&helper_id=eq.${id}&fecha=gt.${desde}&select=id`),
      contar(`avisos?helper_id=eq.${id}&fecha=gt.${desde}&select=id`),
      contar(`avisos?helper_id=eq.${id}&fecha=gt.${desde}&respondido_en=not.is.null&select=id`),
    ])
    return json({ ok: true, pulso: { busquedas, apariciones, recibidos, respondidos } }, 200, cors)
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
      // Lo que se sabe de ella (perfil vivo): opiniones y atributos. 404 = la
      // tabla aun no existe: no hay nada que borrar.
      for (const t of ['valoraciones', 'perfil_atributos']) {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?helper_id=eq.${encodeURIComponent(String(f.id))}`, { method: 'DELETE', headers: rest })
        if (!r.ok && r.status !== 404) return json({ error: 'no se pudo borrar ' + t, estado: r.status }, 502, cors)
      }
      const fi = await fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${f.id}&owner_id=eq.${usuario.id}`, { method: 'DELETE', headers: rest })
      if (!fi.ok) return json({ error: 'no se pudo borrar la ficha', estado: fi.status }, 502, cors)
    }
    // Sus alertas «te aviso si aparece» con el correo de la cuenta.
    if (usuario.email) {
      const al = await fetch(`${SUPABASE_URL}/rest/v1/alertas?correo=eq.${encodeURIComponent(String(usuario.email).trim().toLowerCase())}`, { method: 'DELETE', headers: rest })
      if (!al.ok && al.status !== 404) return json({ error: 'no se pudieron borrar las alertas', estado: al.status }, 502, cors)
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
