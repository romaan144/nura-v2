// La fila «Instala Nüra en tu móvil» del perfil. No aparece si ya está
// instalada. Nada salta solo: se explica cuando la persona lo toca.
import { useEffect, useState } from 'react'
import { Smartphone, ChevronRight } from 'lucide-react'
import { comoInstalar, instalarAhora, alCambiar } from '../utils/instalar'
import { showToast } from './Toast'

const PASOS = {
  ios: ['Toca el botón Compartir de Safari (el cuadrado con una flecha hacia arriba).',
        'Elige «Añadir a pantalla de inicio».',
        'Abre Nüra desde el icono nuevo: así también te pueden llegar avisos.'],
  manual: ['Abre el menú de tu navegador (los tres puntos).',
           'Elige «Instalar aplicación» o «Añadir a pantalla de inicio».'],
}

export default function InstalarApp({ estilos }) {
  const [modo, setModo] = useState(comoInstalar)
  const [abierta, setAbierta] = useState(false)
  useEffect(() => alCambiar(() => setModo(comoInstalar())), [])
  if (modo === 'instalada') return null

  async function tocar() {
    if (modo === 'directa') {
      if (await instalarAhora()) showToast('Nüra ya está en tu pantalla de inicio')
      return
    }
    setAbierta(v => !v)
  }

  return (
    <>
      <button className={estilos.fila} onClick={tocar} aria-expanded={modo === 'directa' ? undefined : abierta}>
        <span className={estilos.filaIcono} aria-hidden="true"><Smartphone size={17} strokeWidth={1.9} /></span>
        <span className={estilos.filaTexto}>
          <span className={estilos.filaTitulo}>Instala Nüra en tu móvil</span>
          <span className={estilos.filaDetalle} style={{whiteSpace:'normal'}}>
            Se abre como una app{modo === 'ios' ? ' y te pueden llegar avisos' : ''}.
          </span>
        </span>
        <ChevronRight size={18} className={estilos.chevron} aria-hidden="true"
          style={modo !== 'directa' && abierta ? { transform: 'rotate(90deg)' } : undefined} />
      </button>
      {abierta && PASOS[modo] && (
        <ol className={estilos.tarjetaTexto} style={{margin:0, padding:'var(--space-4) var(--space-16) var(--space-14) calc(var(--space-32) + var(--space-6))', display:'grid', gap:'var(--space-6)'}}>
          {PASOS[modo].map(p => <li key={p}>{p}</li>)}
        </ol>
      )}
    </>
  )
}
