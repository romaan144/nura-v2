import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    // Dos pasadas: la primera al cambiar de ruta, la segunda tras el layout
    // tardio (imagenes, fuentes), que es cuando el navegador reajustaba.
    const arriba = () => {
      try {
        window.scrollTo(0, 0)
        if (document.scrollingElement) document.scrollingElement.scrollTop = 0
        // El elemento que se desplaza NO siempre es el documento: segun la
        // ruta puede serlo un contenedor interno (las pestañas viven en un
        // contenedor fijo, los overlays no). En vez de adivinar cual, se
        // resetea cualquiera que tenga desplazamiento. Solo corre al
        // cambiar de ruta, asi que el coste es irrelevante.
        // Salvo lo que gestiona su propio desplazamiento (el historial del
        // chat empieza abajo, en el último mensaje): si la pantalla aparece
        // antes de esta pasada, la devolvía al principio y dejaba de seguir
        // la conversación. Pasaba al abrir el chat desde una ficha.
        document.querySelectorAll('*').forEach(el => { if (el.scrollTop && !el.closest('[data-scroll-propio]')) el.scrollTop = 0 })
      } catch { /* noop */ }
    }
    // Un regreso a comentarios conserva el hilo concreto. El perfil puede
    // llegar después de una carga remota o del módulo de la página.
    const anchor = hash.startsWith('#comentarios-') ? hash.slice(1) : ''
    let observer
    const colocar = () => {
      // Feed y Perfil pueden seguir montados pero ocultos: solo el visible.
      const target = anchor && Array.from(document.querySelectorAll('[data-comment-anchor]'))
        .find(el => el.dataset.commentAnchor === anchor && el.getClientRects().length > 0)
      if (!target) return false
      target.scrollIntoView({ block: 'start', behavior: 'instant' })
      observer?.disconnect()
      return true
    }
    if (!colocar()) arriba()
    if (anchor) {
      observer = new MutationObserver(colocar)
      observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'data-comment-anchor'] })
      colocar()
    }
    const t = setTimeout(() => { if (!colocar()) arriba() }, 120)
    // Un enlace antiguo o inexistente nunca deja un observador permanente.
    const stop = anchor ? setTimeout(() => observer?.disconnect(), 10000) : null
    return () => { clearTimeout(t); clearTimeout(stop); observer?.disconnect() }
  }, [pathname, hash])
  return null
}
