import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Dos pasadas: la primera al cambiar de ruta, la segunda tras el layout
    // tardio (imagenes, fuentes), que es cuando el navegador reajustaba.
    const arriba = () => {
      try {
        window.scrollTo(0, 0)
        if (document.scrollingElement) document.scrollingElement.scrollTop = 0
      } catch { /* noop */ }
    }
    arriba()
    const t = setTimeout(arriba, 120)
    return () => clearTimeout(t)
  }, [pathname])
  return null
}
