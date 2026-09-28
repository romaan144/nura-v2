import assert from 'node:assert/strict'
import { attachChatScroll } from '../src/utils/chatScroll.js'
let resize, disconnected = false
const OriginalObserver = globalThis.ResizeObserver
globalThis.ResizeObserver = class {
  constructor(callback) { resize = callback }
  observe() {}
  disconnect() { disconnected = true }
}
class History extends EventTarget {
  scrollHeight = 2400
  clientHeight = 800
  position = 0
  get scrollTop() { return this.position }
  set scrollTop(value) { this.position = Math.max(0, Math.min(value, this.scrollHeight - this.clientHeight)) }
  move(value) { this.scrollTop = value; this.dispatchEvent(new Event('scroll')) }
}
try {
  const history = new History()
  const scroll = attachChatScroll(history)
  scroll.update({ id: 1, from: 'helper' })
  assert.equal(history.scrollTop, 1600, 'al entrar se ve el último mensaje')
  history.move(500)
  history.scrollHeight += 200
  scroll.update({ id: 2, from: 'helper' })
  assert.equal(history.scrollTop, 500, 'una respuesta no quita el lugar de lectura')
  scroll.update({ id: 2, from: 'helper' })
  assert.equal(history.scrollTop, 500, 'escribiendo no fuerza el desplazamiento')
  history.clientHeight = 440
  resize()
  assert.equal(history.scrollTop, 500, 'el teclado no cambia el lugar de lectura')
  scroll.update({ id: 3, from: 'user' })
  assert.equal(history.scrollTop, 2160, 'un envío propio muestra el mensaje enviado')
  history.clientHeight = 800
  resize()
  assert.equal(history.scrollTop, 1800, 'cerrar teclado conserva el final visible')
  history.scrollHeight += 150
  scroll.update({ id: 4, from: 'helper' })
  assert.equal(history.scrollTop, 1950, 'al estar abajo se sigue la conversación')
  history.dispatchEvent(new Event('touchstart'))
  history.scrollHeight += 150
  scroll.update({ id: 5, from: 'helper' })
  assert.equal(history.scrollTop, 1950, 'una llegada no mueve el historial bajo el dedo')
  history.move(900)
  history.dispatchEvent(new Event('touchend'))
  scroll.update({ id: 5, from: 'helper' })
  assert.equal(history.scrollTop, 900, 'soltar el dedo no provoca rebote al final')
  history.move(history.scrollHeight)
  history.dispatchEvent(new Event('touchstart'))
  history.dispatchEvent(new Event('touchcancel'))
  history.scrollHeight += 50
  scroll.update({ id: 6, from: 'helper' })
  assert.equal(history.scrollTop, 2150, 'cancelar un toque no bloquea el seguimiento')
  scroll.destroy()
  assert.ok(disconnected, 'el observador se desconecta al salir del chat')
  console.log('Chat: lectura estable, respuesta entrante, envío propio, teclado, gesto táctil y limpieza verificados.')
} finally {
  globalThis.ResizeObserver = OriginalObserver
}
