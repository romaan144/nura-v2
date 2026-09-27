import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, SlidersHorizontal } from 'lucide-react'
import { paginateResponse } from '../utils/responseLayout'
import styles from './ResponseScreen.module.css'


// Los bloques se miden y se reparten en páginas. Los que no están activos
// quedan fuera de interacción/lectura, pero conservan su estado (p. ej. citas).
export default function ResponseScreen({ blocks, welcome, query }) {
  const areaRef = useRef(null)
  const blockRefs = useRef(new Map())
  const [layout, setLayout] = useState({ height: 0, sizes: [] })
  const [anchor, setAnchor] = useState(0)
  const signature = blocks.map(b => b.id).join('|')
  useLayoutEffect(() => {
    const area = areaRef.current
    if (!area) return
    const measure = () => {
      const sizes = [...area.children].map(el => Math.ceil(el.getBoundingClientRect().height))
      const height = Math.floor(area.clientHeight)
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
  const adjustments = blocks.findIndex(block => block.section === 'Ajustar esta búsqueda')
  function goTo(index) {
    setAnchor(index)
    areaRef.current?.focus({ preventScroll: true })
  }
  return (
    <section className={styles.screen} aria-label="Respuesta de Nüra">
      <header className={styles.header}>
        <img src="/logo-iso.png" alt="" width="32" height="32" />
        <div className={styles.heading}>
          <span className={styles.label}>{section || (welcome ? 'Cerca de ti' : 'Tu búsqueda')}</span>
          {query && <p className={styles.query} title={query}>{query}</p>}
        </div>
        {adjustments >= 0 && !section
          ? <button type="button" className={styles.adjust} onClick={() => goTo(adjustments)} aria-label="Ir a ajustes de búsqueda" title="Ajustar búsqueda"><SlidersHorizontal size={18} aria-hidden="true" /></button>
          : section && <SlidersHorizontal size={18} aria-hidden="true" />}
      </header>
      <div ref={areaRef} className={styles.body} tabIndex={-1} aria-label="Contenido de la respuesta">
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
      <footer className={styles.footer}>
        <button type="button" onClick={() => goTo(pages[selected - 1].items[0].index)} disabled={selected === 0} aria-label="Parte anterior de la respuesta"><ArrowLeft size={17} aria-hidden="true" /></button>
        <span className={styles.progress} role="status" aria-live="polite">{pages.length > 1 ? `${selected + 1} de ${pages.length}` : 'A tu ritmo'}</span>
        {next ? <button type="button" className={styles.next} onClick={() => goTo(next.items[0].index)}>{nextSection ? 'Ajustar búsqueda' : 'Siguiente'}<ArrowRight size={16} aria-hidden="true" /></button>
          : pages.length > 1 ? <button type="button" className={styles.restart} onClick={() => goTo(pages[0].items[0].index)}>Volver al principio</button>
          : <span className={styles.hint}>Puedes escribir abajo</span>}
      </footer>
    </section>
  )
}
