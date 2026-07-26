import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, SectionLabel, EmptyState } from '../components/ui'
import { useUser } from '../context/UserContext'
import HelperCard from '../components/HelperCard'
import { getConnectionStories, getDestacados, historiasDeCategoria } from '../data/connectionStories'
import ObraCard from '../components/ObraCard'
import { getObra } from '../data/obraPosts'

// ═══════════════════════════════════════════════════════════════
// COMUNIDAD — El Latido del Barrio (desde 0)
// No es un feed: es la prueba social como experiencia. El pulso del
// día, tu conexión primero, el río de historias sobre la Tarjeta
// canon, tres personas cerca de ti, y el cierre que alimenta el
// círculo. Manifiesto puro: conexiones reales generan la siguiente.
// ═══════════════════════════════════════════════════════════════

// EL PULSO HONESTO — un numero solo es honesto si puedes verificarlo
// bajando por la pantalla. El anterior salia de un hash de la fecha de hoy:
// no describia nada. Este cuenta lo que la pestaña muestra de verdad.
function pulsoReal(historias, obras) {
  return { vecinos: historias.length, profesionales: new Set(obras.map(o => o.helperId)).size }
}

export default function Feed() {
  const navigate = useNavigate()
  const { user, myStories, following, searchHistory } = useUser()
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
  const pulso = pulsoReal(stories, obrasAll)
  // Lo que buscaste: Comunidad deja de hablar en general y responde a tu caso
  const ultima = (searchHistory || [])[0]
  const suHistoria = historiasDeCategoria(ultima?.category, 1)[0]
  const suObra = suHistoria ? obrasAll.find(o => o.helperId === suHistoria.helper?.id) : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', paddingBottom: '96px' }}>
      <div className="aurora" style={{ padding: 'calc(var(--header-h) - var(--space-8)) var(--space-16) 18px' }}>
        <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: '26px',
          letterSpacing: '-0.9px', color: 'var(--ink)', margin: 0 }}>
          Comunidad
        </h1>
        <div className="hilo" style={{ width: '64px', margin: 'var(--space-8) 0 var(--space-10)' }} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink)' }}>{pulso.vecinos} vecinos</strong> han encontrado a su persona
          {' '}· <strong style={{ color: 'var(--ink)' }}>{pulso.profesionales} profesionales</strong> han contado su trabajo.{(myStories || []).length > 0 && ' Una de ellas es la tuya.'}
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

        {/* PORQUE BUSCASTE X — Comunidad deja de hablar en general y
            responde a la preocupacion concreta con la que llegaste.
            Si no hay nada de tu categoria, este bloque no aparece. */}
        {modo === 'todos' && suHistoria && (
          <div style={{ marginBottom: 'var(--space-28)' }}>
            <SectionLabel tone="brand" style={{marginBottom: 'var(--space-8)'}}>
              Porque buscaste {ultima?.query}
            </SectionLabel>
            <p style={{ fontFamily: 'var(--font-voice)', fontSize: 'var(--text-sm)',
              lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 var(--space-8)' }}>
              {suHistoria.text}
            </p>
            <HelperCard helper={suHistoria.helper} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', marginTop: 'var(--space-4)' }}>
              ✓ conexión real · {suHistoria.timeAgo}
            </div>
            {suObra && <div style={{ marginTop: 'var(--space-12)' }}><ObraCard post={suObra} /></div>}
          </div>
        )}


        <SectionLabel tone="muted" style={{margin: '0 0 var(--space-10)'}}>
          Lo que se ha resuelto cerca de ti
        </SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {modo === 'siguiendo' && obras.length === 0 && rioF.length === 0 ? (
            <EmptyState
              title="Aún no sigues a nadie."
              hint="Cuando sigas a un profesional, su obra irá apareciendo aquí — su currículum, vivo."
              actionLabel="Ver a todo el barrio"
              onAction={() => setModo('todos')}
            />
          ) : (
            <>
              {/* LA DEMANDA TESTIFICA PRIMERO: quien duda necesita oir a otro
                  vecino, no a un profesional presentandose. */}
              {rioF.map((s, i) => (
                <div key={s.id || 'c' + i}>
                  <p style={{ fontFamily: 'var(--font-voice)', fontSize: 'var(--text-sm)',
                    lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 var(--space-8)' }}>
                    {s.text}
                  </p>
                  <HelperCard helper={s.helper} />
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-tertiary)', marginTop: 'var(--space-4)' }}>
                    {s.seconds != null ? <>⚡ encontrado en {s.seconds}s · </> : <>✓ conexión real · </>}{s.timeAgo}
                  </div>
                </div>
              ))}

              {obras.length > 0 && (
                <>
                  <SectionLabel tone="muted" style={{margin: 'var(--space-20) 0 var(--space-4)'}}>
                    Quién lo ha demostrado
                  </SectionLabel>
                  {obras.map((o, i) => <ObraCard key={o.id || 'o' + i} post={o} />)}
                </>
              )}
            </>
          )}
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
