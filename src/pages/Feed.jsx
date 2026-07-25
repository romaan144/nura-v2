import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, SectionLabel } from '../components/ui'
import { useUser } from '../context/UserContext'
import HelperCard from '../components/HelperCard'
import { getConnectionStories, getDestacados } from '../data/connectionStories'
import ObraCard from '../components/ObraCard'
import { getObra } from '../data/obraPosts'

// ═══════════════════════════════════════════════════════════════
// COMUNIDAD — El Latido del Barrio (desde 0)
// No es un feed: es la prueba social como experiencia. El pulso del
// día, tu conexión primero, el río de historias sobre la Tarjeta
// canon, tres personas cerca de ti, y el cierre que alimenta el
// círculo. Manifiesto puro: conexiones reales generan la siguiente.
// ═══════════════════════════════════════════════════════════════

function pulsoDelDia(extra = 0) {
  const day = new Date().toISOString().slice(0, 10)
  let h = 0
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) >>> 0
  return { conexiones: 2 + (h % 4) + extra, citas: 1 + ((h >> 3) % 3) }
}

export default function Feed() {
  const navigate = useNavigate()
  const { user, myStories, following } = useUser()
  const [modo, setModo] = useState('todos')

  const seeds = getConnectionStories()
  const seen = new Set()
  const stories = [...(myStories || []), ...seeds].filter(s => {
    const k = s?.helper?.id ?? s?.helperId
    if (k == null || seen.has(k)) return false
    seen.add(k)
    return true
  })
  const mia = (myStories || [])[0]
  const rio = mia ? stories.filter(s => s.id !== mia.id) : stories
  const obrasAll = getObra()
  const sigue = id => (following || []).includes(id)
  const obras = modo === 'siguiendo' ? obrasAll.filter(o => sigue(o.helperId)) : obrasAll
  const rioF = modo === 'siguiendo' ? rio.filter(s => sigue(s.helper?.id ?? s.helperId)) : rio
  const destacados = getDestacados(3)
  const pulso = pulsoDelDia((myStories || []).length)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', paddingBottom: '96px' }}>
      <div className="aurora" style={{ padding: 'calc(var(--header-h) - var(--space-8)) var(--space-16) 18px' }}>
        <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: '26px',
          letterSpacing: '-0.9px', color: 'var(--ink)', margin: 0 }}>
          Comunidad
        </h1>
        <div className="hilo" style={{ width: '64px', margin: 'var(--space-8) 0 var(--space-10)' }} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
          Esta semana en tu zona: <strong style={{ color: 'var(--ink)' }}>{pulso.conexiones} conexiones ✓</strong>
          {' '}· <strong style={{ color: 'var(--ink)' }}>{pulso.citas} citas acordadas</strong>
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)' }}>
          {['todos', 'siguiendo'].map(m => (
            <button key={m} onClick={() => setModo(m)}
              style={{ background: modo === m ? 'var(--purple)' : 'white',
                color: modo === m ? 'white' : 'var(--ink)',
                border: '1px solid ' + (modo === m ? 'var(--purple)' : 'var(--ink-border)'),
                borderRadius: 'var(--radius-full)', padding: 'var(--space-6) var(--space-14)', fontSize: 'var(--text-xs)',
                fontWeight: 700, cursor: 'pointer' }}>
              {m === 'todos' ? 'Todos' : 'Siguiendo'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 var(--space-16)' }}>
        {mia && (
          <div style={{ margin: 'var(--space-6) 0 22px' }}>
            <SectionLabel tone="brand" style={{marginBottom: 'var(--space-8)'}}>
              Tu conexión
            </SectionLabel>
            <div style={{ background: 'white', border: '1px solid var(--purple-20)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: 'var(--space-14)' }}>
              <p style={{ fontFamily: 'var(--font-voice)', fontSize: 'var(--text-base)',
                lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 var(--space-12)' }}>
                {mia.text}
              </p>
              <HelperCard helper={mia.helper} />
            </div>
          </div>
        )}

        <SectionLabel tone="muted" style={{margin: '0 0 var(--space-10)'}}>
          La obra del barrio
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {modo === 'siguiendo' && obras.length === 0 && rioF.length === 0 ? (
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', lineHeight: 1.55, padding: 'var(--space-6) var(--space-2)' }}>
              Aún no sigues a nadie. Toca ♡ en un perfil para seguir su evolución profesional.
            </p>
          ) : (() => {
            const mixto = []
            let o = 0, c = 0
            while (o < obras.length || c < rioF.length) {
              if (o < obras.length) mixto.push({ kind: 'obra', it: obras[o++] })
              if (o < obras.length) mixto.push({ kind: 'obra', it: obras[o++] })
              if (c < rioF.length) mixto.push({ kind: 'conexion', it: rioF[c++] })
            }
            return mixto.map((m, i) => (
              <div key={(m.it.id || i) + m.kind} >
                {m.kind === 'obra' ? (
                  <ObraCard post={m.it} />
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-voice)', fontSize: 'var(--text-sm)',
                      lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 var(--space-8)' }}>
                      {m.it.text}
                    </p>
                    <HelperCard helper={m.it.helper} />
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', marginTop: '5px' }}>
                      {m.it.seconds != null ? <>⚡ encontrado en {m.it.seconds}s · </> : <>✓ conexión real · </>}{m.it.timeAgo}
                    </div>
                  </>
                )}
              </div>
            ))
          })()}
        </div>

        {destacados.length > 0 && (
          <>
            <SectionLabel tone="muted" style={{margin: 'var(--space-28) 0 var(--space-10)'}}>
              Cerca de ti, esta semana
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
              {destacados.map(h => <HelperCard key={h.id} helper={h} showPrice />)}
            </div>
          </>
        )}

        <div style={{ margin: '30px 0 var(--space-8)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-voice)', fontSize: 'var(--text-md)', color: 'var(--ink)',
            letterSpacing: '-0.3px', margin: '0 0 var(--space-10)' }}>
            ¿Y tú? Cuéntale a Nüra qué necesitas.
          </p>
          <Button variant="primary" onClick={() => navigate('/')}
            aria-label="Ir a buscar"
            style={{ boxShadow: '0 4px 14px var(--purple-30)' }}>
            Buscar a mi persona
          </Button>
        </div>
      </div>
    </div>
  )
}
