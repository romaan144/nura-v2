import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { SectionLabel, EmptyState } from '../components/ui'
import PostCard from '../components/PostCard'
import ObraComposer from '../components/ObraComposer'
import HelperCard from '../components/HelperCard'
import { getConnectionStories, getDestacados } from '../data/connectionStories'
import { getObra } from '../data/obraPosts'

// ═══════════════════════════════════════════════════════════════
// EL MURO — un solo idioma. Antes convivian dos componentes
// distintos alternandose (obra como tarjeta, conexion como parrafo
// suelto): nunca se leia como una comunidad, sino como dos listas
// peleandose. Ahora todo es PostCard: cambia el contenido, no la forma.
// ═══════════════════════════════════════════════════════════════

// El pulso honesto: verificable bajando por la pantalla.
function pulsoReal(posts) {
  return {
    voces: posts.length,
    gente: new Set(posts.map(p => p.autor)).size,
  }
}

export default function Feed() {
  const navigate = useNavigate()
  const { user, myStories, following } = useUser()
  const [modo, setModo] = useState('todos')
  const [composerOpen, setComposerOpen] = useState(false)

  // ── Todo se normaliza a la MISMA unidad ──
  const deObra = getObra().map(o => ({
    id: o.id, helperId: o.helperId, autor: o.who?.name, rol: o.who?.specialty,
    verified: o.verified, dateLabel: o.dateLabel, type: o.type,
    title: o.title, body: o.body, result: o.result, kind: 'obra',
  }))

  const deConexion = [...(myStories || []), ...getConnectionStories()].map((s, i) => ({
    id: s.id || 'cx' + i,
    helperId: s.helper?.id,
    autor: s.mine ? (user?.name || 'Tú') : (s.autor || 'Un vecino del barrio'),
    rol: s.mine ? 'Tu historia' : 'Vecino',
    autorColor: s.mine ? 'var(--purple)' : undefined,
    dateLabel: s.timeAgo,
    body: s.text,
    mention: s.helper?.name?.split(' ')?.[0],
    kind: 'conexion',
    mine: s.mine,
  }))

  // Intercalados: la variedad es lo que hace legible un muro.
  const todos = []
  let a = 0, b = 0
  while (a < deConexion.length || b < deObra.length) {
    if (a < deConexion.length) todos.push(deConexion[a++])
    if (b < deObra.length) todos.push(deObra[b++])
    if (b < deObra.length && a % 2 === 0) todos.push(deObra[b++])
  }

  const sigue = id => (following || []).includes(id)
  const posts = modo === 'siguiendo' ? todos.filter(p => sigue(p.helperId)) : todos
  const pulso = pulsoReal(todos)
  const destacados = getDestacados(3)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--paper)', paddingBottom: 'calc(var(--nav-h) + var(--space-24))' }}>
      <div className="aurora" style={{ padding: 'calc(var(--header-h) - var(--space-8)) var(--space-16) var(--space-16)' }}>
        <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: 'var(--text-xl)',
          letterSpacing: '-0.9px', color: 'var(--ink)', margin: 0 }}>
          El barrio
        </h1>
        <div className="hilo" style={{ width: '64px', margin: 'var(--space-8) 0 var(--space-10)' }} />
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink)' }}>{pulso.voces} historias</strong> de{' '}
          <strong style={{ color: 'var(--ink)' }}>{pulso.gente} personas</strong> que viven cerca de ti.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-12)' }}>
          {['todos', 'siguiendo'].map(m => (
            <button key={m} onClick={() => setModo(m)}
              style={{ background: modo === m ? 'var(--purple)' : 'white',
                color: modo === m ? 'white' : 'var(--ink)',
                border: '1px solid ' + (modo === m ? 'var(--purple)' : 'var(--ink-border)'),
                borderRadius: 'var(--radius-full)', padding: 'var(--space-6) var(--space-14)',
                fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {m === 'todos' ? 'Todo el barrio' : 'A quien sigues'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 var(--space-16)' }}>
        {/* El gesto de publicar deja de estar escondido en el Perfil */}
        <button onClick={() => user ? (user.isHelper ? setComposerOpen(true) : navigate('/')) : navigate('/login')}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-10)', width: '100%',
            background: 'white', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-sm)', padding: 'var(--space-12) var(--space-14)',
            margin: 'var(--space-16) 0 var(--space-20)', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-10)',
            color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0 }}>
            {(user?.name || '+')[0]}
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)' }}>
            {user?.isHelper ? 'Comparte algo con el barrio…' : 'Cuenta cómo te fue…'}
          </span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {posts.length === 0 ? (
            <EmptyState
              title="Aún no sigues a nadie."
              hint="Cuando sigas a un profesional, lo que publique aparecerá aquí."
              actionLabel="Ver a todo el barrio"
              onAction={() => setModo('todos')}
            />
          ) : posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>

        {modo === 'todos' && (
          <>
            <SectionLabel tone="muted" style={{ margin: 'var(--space-28) 0 var(--space-10)' }}>
              Cerca de ti
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
              {destacados.map(h => <HelperCard key={h.id} helper={h} showPrice />)}
            </div>
          </>
        )}
      </div>

      {composerOpen && <ObraComposer onClose={() => setComposerOpen(false)} />}
    </div>
  )
}
