// ── Que el dedo no arrastre la web entera ────────────────────────────────
//
// En el iPhone, si el dedo se desliza sobre algo que no tiene nada que
// desplazar (un chat nuevo, la cabecera, la barra de escribir), Safari pasa
// el gesto a la página y se mueve TODA la web. Sergio lo vio en un chat sin
// mensajes: «se desplaza todo, como toda la web».
//
// Aquí, dentro de `raiz`, un deslizamiento vertical solo se permite si
// empieza sobre algo que de verdad puede desplazarse en esa dirección (el
// historial con mensajes de sobra, una lista larga, la página misma). Si no,
// se anula. Los toques, las pulsaciones y el zoom con dos dedos no se tocan.
// Se aplica a TODA la app, una vez (App.jsx): pasaba en Inicio, en el chat
// y en cualquier pantalla con poco contenido («Ver todos» → viajar).
export function sinArrastreDePagina(raiz) {
  let x0 = 0, y0 = 0
  const inicio = e => {
    const t = e.touches[0]
    x0 = t.clientX; y0 = t.clientY
  }
  // ¿Hay algo, desde donde empieza el dedo hacia fuera, que pueda moverse en
  // esa dirección? Un contenedor con scroll o la propia página (el
  // documento). Si el de dentro ya está en su tope, puede moverse el de fuera.
  const puede = (el, dy) => {
    if (dy > 0) return el.scrollTop > 0
    return el.scrollTop + el.clientHeight < el.scrollHeight - 1
  }
  const puedeDesplazar = (el, dy) => {
    for (; el && el.nodeType === 1 && el !== document.documentElement; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1 && puede(el, dy)) return true
    }
    const doc = document.scrollingElement || document.documentElement
    return doc.scrollHeight > doc.clientHeight + 1 && puede(doc, dy)
  }
  const mover = e => {
    if (e.touches.length !== 1 || !e.cancelable) return
    const t = e.touches[0]
    const dx = t.clientX - x0, dy = t.clientY - y0
    // Un gesto horizontal (una fila de sugerencias) no es asunto de esto.
    if (Math.abs(dx) > Math.abs(dy)) return
    if (!puedeDesplazar(e.target, dy)) e.preventDefault()
  }
  raiz.addEventListener('touchstart', inicio, { passive: true })
  raiz.addEventListener('touchmove', mover, { passive: false })
  return () => {
    raiz.removeEventListener('touchstart', inicio)
    raiz.removeEventListener('touchmove', mover)
  }
}
