// ── Compartir un enlace ──────────────────────────────────────────────────
// En el móvil abre el menú de compartir del sistema (WhatsApp, Telegram,
// correo…); donde no lo hay, copia el enlace. Antes solo se copiaba, y si
// el navegador no daba portapapeles (`navigator.clipboard` indefinido),
// `undefined.then` rompía el botón.
//
// Devuelve 'compartido' | 'copiado' | 'cancelado' | 'fallo'.
export async function compartirEnlace({ url, titulo, texto }) {
  if (navigator.share) {
    try {
      await navigator.share({ url, title: titulo, text: texto })
      return 'compartido'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado'
      // Otros fallos (permiso, contexto): se intenta copiar.
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copiado'
  } catch { /* sin portapapeles moderno */ }
  try {
    const t = document.createElement('textarea')
    t.value = url
    t.setAttribute('readonly', '')
    t.style.position = 'fixed'; t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok ? 'copiado' : 'fallo'
  } catch { return 'fallo' }
}

/** El enlace público de una ficha, en esta misma web. */
export const enlaceDeFicha = id => `${window.location.origin}/helper/${id}`
