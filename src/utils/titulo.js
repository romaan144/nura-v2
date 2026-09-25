// ── El título de la pestaña ──────────────────────────────────────────────
// Cada pantalla, el suyo: el historial del navegador, los lectores de
// pantalla (lo anuncian al cambiar de página) y los buscadores distinguen
// así una ficha de otra. Antes todas se llamaban igual.
import { useEffect } from 'react'

export const TITULO_INICIO = 'Nüra — Encuentra a la persona adecuada en Barcelona'

export function ponerTitulo(texto) {
  document.title = texto ? `${texto} — Nüra` : TITULO_INICIO
}

/** Para pantallas con datos (una ficha, un chat): el título llega con ellos. */
export function useTitulo(texto) {
  useEffect(() => { if (texto) ponerTitulo(texto) }, [texto])
}

// Las pantallas fijas. Las de datos (/helper/, /chat/, /legal/) ponen el
// suyo con useTitulo.
const FIJOS = {
  '/': null,
  '/explore': 'Explorar profesionales',
  '/feed': 'Novedades',
  '/chats': 'Mis chats',
  '/profile': 'Mi perfil',
  '/my-services': 'Mis servicios',
  '/siguiendo': 'Siguiendo',
  '/entrar': 'Entrar',
  '/login': 'Entrar',
  '/restablecer': 'Nueva contraseña',
  '/profesionales': 'Para profesionales',
  '/register-helper': 'Darme de alta como profesional',
}
const CON_DATOS = ['/helper/', '/chat/', '/legal/', '/intro/']

export function tituloDeRuta(ruta) {
  if (CON_DATOS.some(p => ruta.startsWith(p))) return undefined
  if (ruta.startsWith('/r/')) return 'Contestar un mensaje'
  if (ruta.startsWith('/baja/')) return 'Dejar de recibir avisos'
  return ruta in FIJOS ? FIJOS[ruta] : 'Página no encontrada'
}
