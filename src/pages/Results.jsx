import { useState, useEffect } from 'react'
import { MapPin, Monitor, Zap, User, Star, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import HelperCard from '../components/HelperCard'
import { matchHelpers } from '../utils/matching'
import { useUser } from '../context/UserContext'
import styles from './Results.module.css'


export default function Results({ searchState }) {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('nura_view_mode') || 'list')
  const { cacheHelpers } = useUser()

  const safeMatches = Array.isArray(searchState?.matches) ? searchState.matches : []
  const [refineText, setRefineText] = useState('')
  const [refinements, setRefinements] = useState([])
  const [currentMatches, setCurrentMatches] = useState(safeMatches)
  const [refining, setRefining] = useState(false)

  useEffect(() => {
    if (!searchState) navigate('/')
  }, [searchState])

  useEffect(() => {
    if (searchState?.matches?.length > 0) {
      try { sessionStorage.setItem('nura_last_search', JSON.stringify(searchState)) } catch {}
    }
  }, [])

  useEffect(() => {
    if (safeMatches.length > 0) {
      cacheHelpers?.(safeMatches)
      setCurrentMatches(safeMatches)
    }
  }, [])

  if (!searchState) return null

  const { query, analysis, matches } = searchState
  const resultCount = currentMatches?.length || 0

  async function handleRefine() {
    if (!refineText.trim()) return
    setRefining(true)
    try {
      const refined = await matchHelpers(analysis, 5, refineText, currentMatches)
      setCurrentMatches(Array.isArray(refined) ? refined : currentMatches)
      setRefinements(prev => [...prev, refineText])
      setRefineText('')
    } finally {
      setRefining(false)
    }
  }

  function removeRefinement(idx) {
    const newR = refinements.filter((_, i) => i !== idx)
    setCurrentMatches(safeMatches)
    setRefinements(newR)
  }

  function handleKey(e) { if (e.key === 'Enter') handleRefine() }

  return (
    <div className={styles.page}>
      <PageHeader showBack />

      <div className={styles.content}>
        {/* Query */}
        <div className={styles.queryBox} style={{animation:"fadeInUp 0.28s ease-out forwards"}}>
          <div className={styles.queryLabel}>Tu búsqueda</div>
          <p className={styles.queryText}>"{query}"</p>
          {currentMatches?.length > 0 && (
            <div style={{
              marginTop:'10px', padding:'10px 12px',
              background:'rgba(123,47,255,0.07)', borderRadius:'10px',
              fontSize:'13px', color:'var(--ink)', lineHeight:1.5
            }}>
              He encontrado <strong>{currentMatches.length} profesionales</strong> que encajan con lo que describes.
              {currentMatches[0] && (() => {
                const top = currentMatches[0]
                const name = top.name?.split(' ')?.[0]
                return <span> Mi recomendación principal es <strong>{name}</strong> — {top.rating}★ y {top.reviews} valoraciones.</span>
              })()}
            </div>
          )}
        </div>

        {/* Analysis pills */}
        {analysis && (
          <div className={styles.analysisPill}>
            <span className={styles.pill + ' ' + styles.pillNormal}>
              {analysis.presencial ? 'Presencial' : 'Online'}
            </span>
            {analysis.urgente && <span className={styles.pill + ' ' + styles.pillUrgent}>Urgente</span>}
            <span className={styles.pill + ' ' + styles.pillNormal}>
              {{ student:'Sin titulación', experienced:'Con experiencia', professional:'Profesional' }[analysis.nivelRequerido] || 'Con experiencia'}
            </span>
          </div>
        )}

        {/* Refine */}
        <div className={styles.refineBox}>
          <div className={styles.refineTitle}><Search size={13} /> Refina tu búsqueda</div>
          <div className={styles.refineInputWrap}>
            <input className={styles.refineInput}
              placeholder='Ej: "disponible hoy y menos de 1 km"'
              value={refineText} onChange={e => setRefineText(e.target.value)}
              onKeyDown={handleKey} disabled={refining} />
            <button className={styles.refineBtn} onClick={handleRefine} disabled={!refineText.trim() || refining}>
              {refining ? <div className={styles.spinner} /> : <Search size={14} />}
            </button>
          </div>
          {refinements.length > 0 && (
            <div className={styles.refinementsApplied}>
              {(refinements||[]).map((r, i) => (
                <span key={i} className={styles.refinementTag}>
                  {r} <button onClick={() => removeRefinement(i)}><X size={9} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>{(currentMatches||[]).length} personas encontradas</h2>
          {analysis && (
            <div className={styles.analysisBox}>
              <span className={styles.analysisLabel}>Nüra entendió</span>
              <p className={styles.analysisText}>{analysis.resumen}</p>
              {analysis.urgente && <span className={styles.analysisBadge}>Urgente</span>}
              {analysis.presencial && <span className={styles.analysisBadge}>Presencial</span>}
              {analysis.online && <span className={styles.analysisBadge}>Online</span>}
            </div>
          )}
        </div>

        {(currentMatches||[]).length > 0 ? (
          <>
            <div className={styles.topBar}>
              <button className={`${styles.viewBtn} ${viewMode==='list'?styles.viewBtnActive:''}`}
                onClick={() => { setViewMode('list'); localStorage.setItem('nura_view_mode','list') }}>≡ Lista</button>
              <button className={`${styles.viewBtn} ${viewMode==='grid'?styles.viewBtnActive:''}`}
                onClick={() => { setViewMode('grid'); localStorage.setItem('nura_view_mode','grid') }}>⊞ Cuadrícula</button>
            </div>
            <div className={styles.sortRow}>
              {['relevance','rating','distance','price'].map(s => (
                <button key={s} className={`${styles.sortBtn} ${sortBy===s?styles.sortBtnActive:''}`} onClick={() => setSortBy(s)}>
                  {{'relevance':'Relevancia','rating':'Valoración','distance':'Distancia','price':'Precio'}[s]}
                </button>
              ))}
            </div>
            <div className={`${styles.cards} ${viewMode==='grid'?styles.cardsGrid:''}`}>
              {(currentMatches||[]).map((h, i) => h && <div key={h.id || i} style={{animation:`cardCascade 0.45s ease-out ${i*80}ms both`}}><HelperCard helper={h} showPrice /></div>)}
            </div>
          </>
        ) : (
          <div style={{padding:'32px 20px',textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
            <Search size={44} color='rgba(0,0,0,0.12)' strokeWidth={1.3} />
            <div>
              <h3 style={{fontSize:'var(--text-md)',fontWeight:800,color:'rgba(0,0,0,0.75)',margin:'0 0 8px',letterSpacing:'-0.3px'}}>
                Sin resultados ahora mismo
              </h3>
              <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.45)',margin:0,lineHeight:1.6,maxWidth:'260px'}}>
                No encontramos profesionales exactamente para esta búsqueda. Prueba a ampliar los criterios.
              </p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'100%',maxWidth:'280px'}}>
              <button
                onClick={() => navigate('/')}
                style={{padding:'13px',background:'var(--purple)',color:'white',border:'none',
                  borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:700,cursor:'pointer'}}>
                Buscar de nuevo con Nüra
              </button>
              <button
                onClick={() => navigate('/explore')}
                style={{padding:'12px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.6)',
                  border:'none',borderRadius:'100px',fontSize:'var(--text-sm)',fontWeight:600,cursor:'pointer'}}>
                Explorar todos los profesionales
              </button>
            </div>
          </div>
        )}

        <button className={styles.newSearch} onClick={() => navigate('/')}>Nueva búsqueda</button>
      </div>
    </div>
  )
}
