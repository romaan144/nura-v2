import { useCallback, useEffect, useRef, useState } from 'react'

// Solo cierre visual solicitado por la persona. Navegación y envíos conservan
// sus callbacks inmediatos. El temporizador coincide con ModalMotion.module.css.
export default function useModalMotion(onClose) {
  const [closing, setClosing] = useState(false)
  const lifecycle = useRef({ mounted: false, closing: false, timer: null })
  const latestClose = useRef(onClose)
  useEffect(() => { latestClose.current = onClose }, [onClose])
  useEffect(() => {
    const current = lifecycle.current
    current.mounted = true
    return () => {
      current.mounted = false
      clearTimeout(current.timer)
    }
  }, [])

  const dismiss = useCallback(() => {
    const current = lifecycle.current
    if (!current.mounted || current.closing) return
    current.closing = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      latestClose.current()
      return
    }
    setClosing(true)
    current.timer = setTimeout(() => {
      if (current.mounted) latestClose.current()
    }, 180)
  }, [])

  // El fondo sigue interceptando toques durante la salida. Evitar una segunda
  // acción (p. ej. enviar) mientras la persona ya está cerrando la ventana.
  const blockWhileClosing = event => {
    if (!lifecycle.current.closing) return
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    dismiss,
    motionProps: {
      'data-closing': closing || undefined,
      onClickCapture: blockWhileClosing,
      onKeyDownCapture: blockWhileClosing,
    },
  }
}
