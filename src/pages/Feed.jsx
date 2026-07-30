import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { SectionLabel, EmptyState } from '../components/ui'
import PostCard from '../components/PostCard'
import ObraComposer from '../components/ObraComposer'
import HelperCard from '../components/HelperCard'
import { getConnectionStories, getDestacados } from '../data/connectionStories'
import { getObra, obraAPost } from '../data/obraPosts'
import { HELPERS } from '../data/helpers'
import { CAT_HUMANA } from '../data/categorias'

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
  const { user, myStories, following, utilesDe, contactedHelpers } = useUser()
  const [modo, setModo] = useState('todos')
  const [composerOpen, setComposerOpen] = useState(false)
  const [tema, setTema] = useState(null)

  // ── Todo se normaliza a la MISMA unidad ──
  const deObra = getObra().map(obraAPost)

  const confirmadas = new Set((contactedHelpers || []).filter(c => c?.confirmed).map(c => c.id || c))

  const deConexion = [...(myStories || []), ...getConnectionStories()].map((s, i) => ({
    id: s.id || 'cx' + i,
    helperId: s.helper?.id,
    autor: s.mine ? (user?.name || 'Tú') : (s.autor || 'Alguien cerca de ti'),
    rol: s.mine ? 'Tu historia' : 'Vecino',
    autorColor: s.mine ? 'var(--purple)' : undefined,
    dateLabel: s.timeAgo,
    // Prueba social ESPECIFICA Y LOCAL (manifesto): la zona y la distancia
    // ya viven en los datos del profesional; hasta hoy no se usaban.
    lugar: s.helper?.zone
      ? `${s.helper.zone}${s.helper.distance ? ` · a ${Math.round(s.helper.distance * 1000)} m` : ''}`
      : null,
    // El sello solo si la confirmacion es real
    confirmado: s.mine ? confirmadas.has(s.helper?.id) : !!s.confirmed,
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

  // Temas: la comunidad se recorre por lo que te preocupa
  // HELPERS puede traer huecos nulos: filtrar antes de buscar (lo cazo el smoke)
  const POOL = HELPERS.filter(Boolean)
  const temaDe = p => POOL.find(h => h.id === p.helperId)?.category || null
  const temas = [...new Set(todos.map(temaDe).filter(Boolean))].slice(0, 6)

  // Lo mas util: usa la senal nueva, no una cifra inventada
  const masUtil = [...todos].sort((a, b) => (utilesDe?.(b.id) || 0) - (utilesDe?.(a.id) || 0)).slice(0, 2)

  // A quien seguir: profesionales con obra a los que aun no sigues
  const sugeridos = POOL
    .filter(h => deObra.some(o => o.helperId === h.id) && !sigue(h.id))
    .slice(0, 3)
  // "con las del propio usuario primero (✓ Tu conexion)" — context.md #13.
  // Mi reescritura anterior la disolvio en el rio: era una regresion contra
  // el diseño documentado.
  const mias = todos.filter(p => p.mine)
  const delBarrio = todos.filter(p => !p.mine)

  // ④ El orden es jerarquia de PRUEBA, no cronologia: lo que mas demuestra,
  //    mas arriba.
  const porPrueba = [...delBarrio].sort((a, b) => (b.confirmado ? 1 : 0) - (a.confirmado ? 1 : 0))
  const porTema = tema ? porPrueba.filter(p => temaDe(p) === tema) : porPrueba
  const posts = modo === 'siguiendo' ? porTema.filter(p => sigue(p.helperId)) : porTema
  const pulso = pulsoReal(todos)
  const destacados = getDestacados(3)

  return (
    // EL CONTRATO DE LAYOUT: esta pantalla es su propio scroller. Antes no
    // tenia contenedor y scrolleaba `desktopMain`, el elemento que envuelve
    // TODAS las pestañas (montadas a la vez): su scroll no estaba aislado.
    // La reserva inferior vive solo aqui, en un token medido.
    <div style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      background: 'var(--paper)',
      paddingBottom: 'var(--reserva-nav)',
    }}>
      <div className="aurora" style={{ padding: 'calc(var(--header-h) - var(--space-8)) var(--space-16) var(--space-16)' }}>
        <h1 style={{ fontFamily: 'var(--font-voice)', fontWeight: 700, fontSize: 'var(--text-xl)',
          letterSpacing: '-0.9px', color: 'var(--ink)', margin: 0 }}>
          Cerca de ti
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
              {m === 'todos' ? 'Todo' : 'A quien sigues'}
            </button>
          ))}
        </div>
      </div>

      {/* Los temas: la comunidad se recorre por lo que te preocupa */}
      {temas.length > 1 && (
        <div style={{ display: 'flex', gap: 'var(--space-6)', overflowX: 'auto',
          padding: '0 var(--space-16) var(--space-4)', margin: 'var(--space-14) 0 0' }}>
          {[null, ...temas].map(t => (
            <button key={t || 'all'} onClick={() => setTema(t)}
              style={{ flexShrink: 0, background: tema === t ? 'var(--ink)' : 'white',
                color: tema === t ? 'white' : 'var(--ink-secondary)',
                border: '1px solid ' + (tema === t ? 'var(--ink)' : 'var(--ink-border)'),
                borderRadius: 'var(--radius-full)', padding: 'var(--space-6) var(--space-12)',
                fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t ? (CAT_HUMANA[t] || t) : 'Todo'}
            </button>
          ))}
        </div>
      )}

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
            {user?.isHelper ? 'Comparte algo con la comunidad…' : 'Cuenta cómo te fue…'}
          </span>
        </button>

        {modo === 'todos' && !tema && mias.length > 0 && (
          <div style={{ marginBottom: 'var(--space-24)' }}>
            <SectionLabel tone="brand" style={{ marginBottom: 'var(--space-10)' }}>
              Tu conexión
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
              {mias.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          </div>
        )}

        {modo === 'todos' && !tema && mias.length > 0 && (
          <SectionLabel tone="muted" style={{ margin: '0 0 var(--space-10)' }}>
            Lo que ha pasado cerca de ti
          </SectionLabel>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {posts.length === 0 ? (
            <EmptyState
              title="Aún no sigues a nadie."
              hint="Cuando sigas a un profesional, lo que publique aparecerá aquí."
              actionLabel="Ver toda la comunidad"
              onAction={() => setModo('todos')}
            />
          ) : posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>

        {modo === 'todos' && !tema && masUtil.length > 0 && (
          <>
            <SectionLabel tone="brand" style={{ margin: 'var(--space-28) 0 var(--space-10)' }}>
              Lo que más ha servido
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
              {masUtil.map(p => <PostCard key={'u' + p.id} post={p} />)}
            </div>
          </>
        )}

        {modo === 'todos' && sugeridos.length > 0 && (
          <>
            <SectionLabel tone="muted" style={{ margin: 'var(--space-28) 0 var(--space-10)' }}>
              A quién seguir
            </SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>
              {sugeridos.map(h => <HelperCard key={'s' + h.id} helper={h} />)}
            </div>
          </>
        )}

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
