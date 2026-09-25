// ── Instalar Nüra en el móvil ────────────────────────────────────────────
// Instalada, Nüra se abre como una app y, en iPhone, es la ÚNICA forma de
// recibir avisos (Apple solo los permite desde la pantalla de inicio).
//
// Android/Chrome avisa UNA vez de que se puede instalar (`beforeinstallprompt`)
// y hay que guardar ese aviso para usarlo cuando la persona toque «Instalar».
// Por eso se escucha nada más arrancar (se importa en main.jsx).

let aviso = null
const oyentes = new Set()
const avisar = () => oyentes.forEach(f => f())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); aviso = e; avisar() })
  window.addEventListener('appinstalled', () => { aviso = null; avisar() })
}

export const yaInstalada = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone)

export const esIOS = () => typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/** 'directa' (Chrome la instala con un toque) | 'ios' | 'manual' | 'instalada' */
export function comoInstalar() {
  if (yaInstalada()) return 'instalada'
  if (aviso) return 'directa'
  if (esIOS()) return 'ios'
  return 'manual'
}

/** Abre el cuadro de instalación del navegador. true si la instalan. */
export async function instalarAhora() {
  if (!aviso) return false
  const e = aviso
  aviso = null
  e.prompt()
  const { outcome } = await e.userChoice
  avisar()
  return outcome === 'accepted'
}

export function alCambiar(f) { oyentes.add(f); return () => oyentes.delete(f) }
