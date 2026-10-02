import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react'
import { paginateResponse } from '../utils/responseLayout'
import styles from './ResponseScreen.module.css'


// Los bloques se miden y se reparten en páginas. Los que no están activos
// quedan fuera de interacción/lectura, pero conservan su estado (p. ej. citas).
export default function ResponseScreen({ blocks, welcome, query, onNuevaBusqueda }) {
  const areaRef = useRef(null)
  const blockRefs = useRef(new Map())
  const directionRef = useRef(1)
  const [layout, setLayout] = useState({ height: 0, sizes: [] })
  const [anchor, setAnchor] = useState(0)
  const signature = blocks.map(b => b.id).join('|')
  useLayoutEffect(() => {
    const area = areaRef.current
    if (!area) return
    const measure = () => {
      const sizes = [...area.children].map(el => Math.ceil(el.getBoundingClientRect().height))
      const height = Math.floor(area.getBoundingClientRect().height)
      setLayout(old => old.height === height && old.sizes.join(',') === sizes.join(',') ? old : { height, sizes })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    blockRefs.current.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [signature])
  const pages = paginateResponse(layout.sizes, blocks.map(b => b.section || ''), layout.height, 12)
  const selected = Math.max(0, pages.findIndex(page => page.items.some(item => item.index === anchor)))
  const page = pages[selected] || { items: [], height: 0 }
  const current = new Map(page.items.map(item => [item.index, item.top]))
  const next = pages[selected + 1]
  const nextSection = next && blocks[next.items[0]?.index]?.section
  const section = blocks[page.items[0]?.index]?.section
  const ready = layout.height > 0
  // Animar el área, no cada bloque: ResizeObserver mide el contenido real.
  // Cambios de tamaño/teclado no reinician la entrada. No se retienen respuestas
  // antiguas ni se demora la navegación: solo la página actual es interactiva.
  useLayoutEffect(() => {
    const area = areaRef.current
    if (!ready || !area?.animate) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return
    const animation = area.animate([
      { opacity: 0.3, transform: `translateY(${directionRef.current * 18}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 240, easing: 'cubic-bezier(.22, 1, .36, 1)' })
    const stop = () => animation.cancel()
    preference.addEventListener('change', stop)
    return () => {
      stop()
      preference.removeEventListener('change', stop)
    }
  }, [anchor, ready])

  // ── PASAR DE PÁGINA DESLIZANDO (Sergio, 2026-10-02) ──────────────────
  // Además del botón: hacia arriba, la siguiente; hacia abajo, la anterior.
  // El contenido sigue al dedo (frenado) y, si no llega, vuelve a su sitio.
  const gesto = useRef(null)
  const prev = pages[selected - 1]
  function empezar(e) {
    if (pages.length < 2 || e.touches.length !== 1) return
    gesto.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dy: 0, vertical: null }
  }
  function mover(e) {
    const g = gesto.current
    if (!g) return
    const dx = e.touches[0].clientX - g.x, dy = e.touches[0].clientY - g.y
    if (g.vertical === null && Math.hypot(dx, dy) > 8) g.vertical = Math.abs(dy) > Math.abs(dx)
    if (!g.vertical) return
    // Sin página hacia ese lado, apenas se mueve: se nota el tope.
    const hay = dy < 0 ? next : prev
    g.dy = dy
    const area = areaRef.current
    if (!area) return
    area.style.transition = 'none'
    // Como mucho 22px: se nota el gesto sin montarse sobre el título.
    const tope = hay ? 22 : 8
    area.style.transform = `translateY(${Math.max(-tope, Math.min(tope, dy * 0.3))}px)`
    area.style.opacity = String(hay ? Math.max(0.55, 1 - Math.abs(dy) / 400) : 1)
  }
  function soltar() {
    const g = gesto.current
    gesto.current = null
    const area = areaRef.current
    if (!g?.vertical || !area) return
    area.style.transition = 'transform 220ms cubic-bezier(.22, 1, .36, 1), opacity 220ms ease'
    area.style.transform = ''
    area.style.opacity = ''
    if (g.dy < -50 && next) goTo(next.items[0].index)
    else if (g.dy > 50 && prev) goTo(prev.items[0].index)
  }

  function goTo(index) {
    directionRef.current = index < anchor ? -1 : 1
    setAnchor(index)
    areaRef.current?.focus({ preventScroll: true })
  }
  return (
    <section className={styles.screen} data-paged={pages.length > 1} aria-label="Respuesta de Nüra"
      onTouchStart={empezar} onTouchMove={mover} onTouchEnd={soltar} onTouchCancel={soltar}>
      <header className={styles.header}>
        <img src="/logo-iso.png" alt="" width="32" height="32" />
        <div className={styles.heading}>
          <span className={styles.label}>{section || (welcome ? 'Cerca de ti' : 'Tu búsqueda')}</span>
          {query && <p className={styles.query} title={query}>{query}</p>}
        </div>
        {onNuevaBusqueda && <button type="button" className={styles.nueva} onClick={onNuevaBusqueda}><RotateCcw size={14} aria-hidden="true" />Nueva búsqueda</button>}
      </header>
      <div ref={areaRef} className={styles.body} style={{ '--response-height': layout.height > 0 ? `${layout.height}px` : undefined }} tabIndex={-1} aria-label="Contenido de la respuesta">
        {blocks.map((block, index) => {
          const visible = ready && current.has(index)
          const top = current.get(index) || 0
          return <div key={block.id} ref={el => { if (el) blockRefs.current.set(block.id, el); else blockRefs.current.delete(block.id) }}
            className={styles.block} inert={!visible} aria-hidden={!visible}
            style={{ top, visibility: visible ? 'visible' : 'hidden' }}>
            {block.content}
          </div>
        })}
      </div>
      {pages.length > 1 && <footer className={styles.footer}>
        {selected > 0 && <button type="button" onClick={() => goTo(pages[selected - 1].items[0].index)} aria-label="Parte anterior de la respuesta"><ArrowUp size={17} aria-hidden="true" /></button>}
        <span className={styles.progress} role="status" aria-live="polite">{`${selected + 1} de ${pages.length}`}</span>
        {next ? <button type="button" className={styles.next} onClick={() => goTo(next.items[0].index)}>{nextSection === 'Otras opciones' ? 'Ver otras opciones' : nextSection === 'Ajustar esta búsqueda' ? 'Ajustar búsqueda' : 'Siguiente'}<ArrowDown size={16} aria-hidden="true" /></button>
          : <button type="button" className={styles.restart} onClick={() => goTo(pages[0].items[0].index)}>Volver al principio</button>}
      </footer>}
    </section>
  )
}
