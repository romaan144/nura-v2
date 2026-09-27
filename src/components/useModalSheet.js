import { useEffect, useRef } from 'react'

// Comportamiento visual común: foco contenido y nota visible al abrir teclado.
export default function useModalSheet(onClose, done) {
  const dialog = useRef(null)
  const body = useRef(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement
    const sheet = dialog.current
    sheet.focus()
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return }
      if (event.key !== 'Tab') return
      const controls = [...sheet.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
        .filter(el => el.getClientRects().length)
      const first = controls[0], last = controls[controls.length - 1]
      if (!controls.length) { event.preventDefault(); sheet.focus(); return }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === sheet)) {
        event.preventDefault(); first.focus()
      }
    }
    sheet.addEventListener('keydown', onKey)
    return () => { sheet.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [])
  useEffect(() => { if (done) dialog.current?.focus() }, [done])
  useEffect(() => {
    let frame
    const revealField = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const field = document.activeElement
        const scroller = body.current
        if (!scroller?.contains(field) || !field.matches('textarea')) return
        const visible = scroller.getBoundingClientRect()
        const box = field.getBoundingClientRect()
        if (box.bottom > visible.bottom - 12) scroller.scrollTop += box.bottom - visible.bottom + 12
        else if (box.top < visible.top + 12) scroller.scrollTop += box.top - visible.top - 12
      })
    }
    window.visualViewport?.addEventListener('resize', revealField)
    window.addEventListener('resize', revealField)
    return () => {
      cancelAnimationFrame(frame)
      window.visualViewport?.removeEventListener('resize', revealField)
      window.removeEventListener('resize', revealField)
    }
  }, [])

  return { dialog, body }
}
