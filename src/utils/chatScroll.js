// Solo el historial se desplaza. Leer mensajes anteriores nunca obliga a bajar.
export function attachChatScroll(element) {
  let following = true
  let touching = false
  let initialized = false
  let lastId
  const atBottom = () => element.scrollHeight - element.clientHeight - element.scrollTop <= 48
  const readPosition = () => { following = atBottom() }
  const startTouch = () => { touching = true }
  const endTouch = () => { touching = false; readPosition() }
  const toBottom = () => {
    // Sin animación que compita con el gesto nativo ni scroll en ancestros.
    element.scrollTop = element.scrollHeight
    following = true
  }
  const resize = () => { if (following && !touching) toBottom() }
  element.addEventListener('scroll', readPosition, { passive: true })
  element.addEventListener('touchstart', startTouch, { passive: true })
  element.addEventListener('touchend', endTouch, { passive: true })
  element.addEventListener('touchcancel', endTouch, { passive: true })
  const observer = new ResizeObserver(resize)
  observer.observe(element)
  return {
    update(lastMessage) {
      const sent = initialized && lastMessage?.id !== lastId && lastMessage?.from === 'user'
      if (!touching && (!initialized || following || sent)) toBottom()
      initialized = true
      lastId = lastMessage?.id
    },
    destroy() {
      observer.disconnect()
      element.removeEventListener('scroll', readPosition)
      element.removeEventListener('touchstart', startTouch)
      element.removeEventListener('touchend', endTouch)
      element.removeEventListener('touchcancel', endTouch)
    },
  }
}
