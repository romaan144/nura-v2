import { useNavigate } from 'react-router-dom'
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
  const { user, myStories } = useUser()

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
  const destacados = getDestacados(3)
  const pulso = pulsoDelDia((myStories || []).length)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', paddingBottom: '96px' }}>
      <div className="aurora" style={{ padding: '54px 20px 18px' }}>
        <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 500, fontSize: '26px',
          letterSpacing: '-0.6px', color: 'var(--ink)', margin: 0 }}>
          Comunidad
        </h1>
        <div className="hilo" style={{ width: '64px', margin: '8px 0 10px' }} />
        <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
          Esta semana en tu zona: <strong style={{ color: 'var(--ink)' }}>{pulso.conexiones} conexiones ✓</strong>
          {' '}· <strong style={{ color: 'var(--ink)' }}>{pulso.citas} citas acordadas</strong>
        </p>
      </div>

      <div style={{ padding: '0 16px' }}>
        {mia && (
          <div style={{ margin: '6px 0 22px', animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--purple)',
              letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: '8px' }}>
              Tu conexión
            </div>
            <div style={{ background: 'white', border: '1px solid var(--purple-20)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '14px' }}>
              <p style={{ fontFamily: 'var(--font-voice)', fontStyle: 'italic', fontSize: '14.5px',
                lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 12px' }}>
                {mia.text}
              </p>
              <HelperCard helper={mia.helper} />
            </div>
          </div>
        )}

        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-tertiary)',
          letterSpacing: '0.6px', textTransform: 'uppercase', margin: '0 0 10px' }}>
          La obra del barrio
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {(() => {
            const obras = getObra()
            const mixto = []
            let o = 0, c = 0
            while (o < obras.length || c < rio.length) {
              if (o < obras.length) mixto.push({ kind: 'obra', it: obras[o++] })
              if (o < obras.length) mixto.push({ kind: 'obra', it: obras[o++] })
              if (c < rio.length) mixto.push({ kind: 'conexion', it: rio[c++] })
            }
            return mixto.map((m, i) => (
              <div key={(m.it.id || i) + m.kind} style={{ animation: `fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${Math.min(i, 5) * 70}ms both` }}>
                {m.kind === 'obra' ? (
                  <ObraCard post={m.it} />
                ) : (
                  <>
                    <p style={{ fontFamily: 'var(--font-voice)', fontStyle: 'italic', fontSize: '14px',
                      lineHeight: 1.55, color: 'var(--ink)', margin: '0 0 8px' }}>
                      {m.it.text}
                    </p>
                    <HelperCard helper={m.it.helper} />
                    <div style={{ fontSize: '11px', color: 'var(--ink-tertiary)', marginTop: '5px' }}>
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
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink-tertiary)',
              letterSpacing: '0.6px', textTransform: 'uppercase', margin: '28px 0 10px' }}>
              Cerca de ti, esta semana
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {destacados.map(h => <HelperCard key={h.id} helper={h} showPrice />)}
            </div>
          </>
        )}

        <div style={{ margin: '30px 0 8px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-voice)', fontSize: '17px', color: 'var(--ink)',
            letterSpacing: '-0.3px', margin: '0 0 10px' }}>
            ¿Y tú? Cuéntale a Nüra qué necesitas.
          </p>
          <button onClick={() => navigate('/')}
            aria-label="Ir a buscar"
            style={{ background: 'var(--purple)', color: 'white', border: 'none',
              borderRadius: 'var(--radius-full)', padding: '11px 22px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(123,47,255,0.3)' }}>
            Buscar a mi persona
          </button>
        </div>
      </div>
    </div>
  )
}
