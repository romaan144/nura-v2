// ── La vista previa de una ficha al compartirla ─────────────────────────
//
// WhatsApp, Telegram, Google… no ejecutan JavaScript: leen el HTML tal cual
// llega. Sin esto, compartir la ficha de Marta enseñaba «Nüra — Cuéntame qué
// necesitas», igual que cualquier otro enlace. Aquí, solo para /helper/:id,
// se pide a Supabase su nombre, oficio y barrio (lo mismo que ya ve
// cualquiera en la ficha) y se ponen en las etiquetas de la página.
//
// Middleware de Vercel (sirve para cualquier framework). A prueba de fallos:
// si algo va mal o tarda, no devuelve nada y Vercel sirve la página normal.
// Ningún secreto: la clave publicable es la misma que usa el navegador.

export const config = { matcher: '/helper/:path*' }

const SUPABASE_URL = 'https://oxmohciswebonoumghhu.supabase.co'
const SUPABASE_KEY = 'sb_publishable_-_N1S0ni6t27kX41oPBw0g_nBlu9jcQ'

const escapar = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const recortar = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t
}

/** El HTML de la app con las etiquetas de la ficha. Puro: se prueba solo. */
export function conFicha(html, h, url) {
  const origen = new URL(url).origin
  const oficio = h.specialty || ''
  const barrio = h.zone || h.city || ''
  const titulo = [h.name, oficio].filter(Boolean).join(' · ')
  const desc = recortar(h.bio, 150) || `${[oficio, barrio].filter(Boolean).join(' en ') || 'Profesional'}. Escríbele por Nüra.`
  const foto = /^https:\/\/[^"<>\s]+\.(jpe?g|png|webp)(\?[^"<>\s]*)?$/i.test(h.avatarUrl || '')
    ? h.avatarUrl : null
  const poner = (html, atributo, clave, valor) => html.replace(
    new RegExp(`(<meta ${atributo}="${clave}" content=")[^"]*(")`), `$1${escapar(valor)}$2`)
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapar(titulo)} — Nüra</title>`)
  out = poner(out, 'name', 'description', desc)
  out = poner(out, 'property', 'og:type', 'profile')
  out = poner(out, 'property', 'og:title', `${titulo} — Nüra`)
  out = poner(out, 'property', 'og:description', desc)
  if (foto) {
    // Su foto: otras medidas y otro formato. Se quitan las de la imagen de
    // Nüra para que WhatsApp no la deforme.
    out = out.replace(/\s*<meta property="og:image:(type|width|height)" content="[^"]*" \/>/g, '')
    out = poner(out, 'property', 'og:image', foto)
    out = poner(out, 'property', 'og:image:secure_url', foto)
    out = poner(out, 'name', 'twitter:image', foto)
  } else {
    // La de Nüra, siempre con la direccion completa de ESTA web.
    for (const [a, k] of [['property', 'og:image'], ['property', 'og:image:secure_url'], ['name', 'twitter:image']])
      out = poner(out, a, k, `${origen}/og-compartir.jpg`)
  }
  out = poner(out, 'property', 'og:url', url)
  out = poner(out, 'name', 'twitter:title', `${titulo} — Nüra`)
  out = poner(out, 'name', 'twitter:description', desc)
  return out
}

export default async function middleware(request) {
  try {
    const url = new URL(request.url)
    const id = url.pathname.split('/')[2]
    if (!/^\d{1,12}$/.test(id || '')) return
    const [pagina, datos] = await Promise.all([
      fetch(new URL('/index.html', url), { signal: AbortSignal.timeout(1500) }),
      fetch(`${SUPABASE_URL}/rest/v1/helpers?id=eq.${id}&select=name,specialty,zone,city,bio,avatarUrl&limit=1`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        signal: AbortSignal.timeout(1500),
      }),
    ])
    if (!pagina.ok || !datos.ok) return
    const h = (await datos.json())?.[0]
    if (!h?.name) return
    return new Response(conFicha(await pagina.text(), h, url.origin + url.pathname), {
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache, no-store, must-revalidate' },
    })
  } catch {
    return
  }
}
