import React, { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { Briefcase, Users2, Award, Bookmark, Check, MessageCircle, Share2, Shield, UserPlus, Heart, Star, Rss } from 'lucide-react'
import RegisterGate from '../components/RegisterGate'
import { useNavigate } from 'react-router-dom'
import { getAllHelpers } from '../utils/supabase'
import { HELPERS as LOCAL_HELPERS } from '../data/helpers'
import { DEMO_ENRICHMENTS } from '../data/demoEnrichments'
import HelperCarousel from '../components/HelperCarousel'
import HelperCard from '../components/HelperCard'
import { generateDynamicPosts } from '../utils/feedGenerator'
import { COMPANIES } from '../data/companies'
import { useUser } from '../context/UserContext'
import { showToast } from '../components/Toast'

import styles from './Feed.module.css'

// ── Build feed — deterministic order, not random ───────────────────────────
// Daily seed: changes once per day, making feed feel fresh on return visits
const DAILY_SEED = Math.floor(Date.now() / (1000 * 60 * 60 * 24))

function buildFeed(following, helpers, companies) {
  const posts = []

  // Following content first
  const followedHelpers = helpers.filter(h =>
    (following||[]).includes(h.id) || (following||[]).includes(String(h.id))
  )
  const followedCompanies = companies.filter(c => (following||[]).includes(c.id))

  followedHelpers.forEach(h => {
    h.posts?.forEach(p => posts.push({ ...p, author: h, authorType: 'helper', following: true }))
  })
  followedCompanies.forEach(c => {
    c.posts?.forEach(p => posts.push({ ...p, author: c, authorType: 'company', following: true }))
  })

  // Then suggested (not following)
  const unfollowedHelpers = helpers.filter(h =>
    !(following||[]).includes(h.id) && !(following||[]).includes(String(h.id))
  )
  const unfollowedCompanies = companies.filter(c => !(following||[]).includes(c.id))

  unfollowedHelpers.forEach(h => {
    h.posts?.slice(0,1).forEach(p => posts.push({ ...p, author: h, authorType: 'helper', suggested: true }))
  })
  unfollowedCompanies.forEach(c => {
    c.posts?.slice(0,1).forEach(p => posts.push({ ...p, author: c, authorType: 'company', suggested: true }))
  })

  // Add dynamic AI-generated posts (availability, tips, new helpers)
  const dynamicPosts = generateDynamicPosts(helpers, 20)
  posts.push(...dynamicPosts)

  // Sort by most recent (by date string priority) — following first, then suggested
  // Score: following=2pts, dynamic(Hoy)=1pt, cert posts=0.5pt
  function postScore(p) {
    let s = 0
    if (p.following)               s += 10  // followed content first
    if (p.dynamic)                 s += 6   // AI-generated always fresh
    if (p.type === 'availability') s += 4   // availability = action
    if (p.type === 'tip')          s += 3   // Nüra tips useful
    if (p.date === 'Hoy')          s += 3   // recency
    if (p.type === 'cert')         s += 2   // credentials = trust
    if (p.badge)                   s += 2   // social proof
    if (p.verifiedWork)            s += 1   // work post
    // Daily jitter: same post scores differently each day → feed feels fresh
    const jitter = ((p.id || 0) * 17 + DAILY_SEED * 7) % 3
    s += jitter * 0.1
    return s
  }
  return posts.sort((a, b) => postScore(b) - postScore(a))
}

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({ post }) {
  const navigate = useNavigate()
  const { follow, unfollow, isFollowing, user } = useUser()
  const [showGateLocal, setShowGateLocal] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes || 0)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isLong = post.text?.length > 200
  const author = post.author
  const followed = isFollowing(author.id)

  function handleFollow(e) {
    e.stopPropagation()
    if (!user) { setShowGateLocal(true); return }
    if (followed) {
      unfollow(author.id)
      showToast('Dejaste de seguir')
    } else {
      follow(author.id)
      showToast(`Siguiendo a ${author.name?.split(' ')?.[0]}`)
    }
  }

  return (
    <div className={styles.card}>
      {/* Suggested label */}
      {post.suggested && !post.following && (
        <div className={styles.suggestedLabel}>Sugerido para ti</div>
      )}

      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.authorRow}
          onClick={() => post.authorType === 'helper' && navigate(`/helper/${author.id}`, { state: { helper: author } })}>
          <div className={styles.avatarWrap}>
            {author.avatarUrl
              ? <img src={author.avatarUrl} alt="" className={styles.avatarImg} />
              : <div className={styles.avatarFallback} style={{background: author.avatarColor}}>
                  {author.avatar || author.name?.[0]}
                </div>
            }
            {(author.verified || author.dniVerified) && (
              <span className={styles.verifiedDot}><Shield size={8} color="white" /></span>
            )}
          </div>
          <div className={styles.authorMeta}>
            <div className={styles.authorName}>
              {author.name}
              {author.founder && <Award size={11} color='#92400E' style={{marginLeft:'4px'}} />}
            </div>
            <div className={styles.authorSub}>
              {post.authorType === 'company' ? author.handle : author.specialty} · {post.date}
            </div>
          </div>
        </div>

        {/* Follow button */}
        {post.authorType !== 'nura' && (
        <button
          className={followed ? styles.followingBtn : styles.followBtn}
          onClick={handleFollow}>
          {followed ? <><Check size={12} /> Siguiendo</> : <><UserPlus size={12} /> Seguir</>}
        </button>
        )}
      </div>

      {/* Content */}
      <p className={styles.postText} data-expanded={expanded}>{post.text}</p>
      {isLong && !expanded && (
        <div className={styles.fadeWrap}>
          <button className={styles.verMasBtn} onClick={() => setExpanded(true)}>
            Ver más
          </button>
        </div>
      )}

      {/* Badge */}
      {post.badge && <div className={styles.badge}>{post.badge}</div>}
      {post.type === 'availability' && !post.badge && (
        <div className={styles.availabilityBadge}><span style={{display:'inline-block',width:'7px',height:'7px',borderRadius:'50%',background:'var(--green)',marginRight:'5px',verticalAlign:'middle'}}/>Disponible esta semana</div>
      )}
      {post.type === 'tip' && !post.badge && (
        <div className={styles.tipBadge}>Consejo profesional</div>
      )}
      {post.type === 'hiring' && (
        <div className={styles.hiringBadge}><Briefcase size={10} style={{marginRight:'4px'}}/> Oferta de empleo · Perfil Nüra requerido</div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.action} ${liked ? styles.actionLiked : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n-1 : n+1) }}>
          <Heart size={17} fill={liked?'var(--red)':'none'} color={liked?'var(--red)':'rgba(0,0,0,0.35)'} />
          <span>{likes}</span>
        </button>
        <button className={styles.action}>
          <MessageCircle size={17} color="rgba(0,0,0,0.35)" />
          <span>{post.comments || 0}</span>
        </button>
        <button className={styles.action}>
          <Share2 size={17} color="rgba(0,0,0,0.35)" />
        </button>
        <button className={`${styles.action} ${styles.actionEnd} ${saved ? styles.actionSaved : ''}`}
          onClick={() => setSaved(s => !s)}>
          <Bookmark size={17} fill={saved?'var(--purple)':'none'} color={saved?'var(--purple)':'rgba(0,0,0,0.35)'} />
        </button>
      </div>
      {showGateLocal && <RegisterGate reason="follow" onClose={() => setShowGateLocal(false)} />}
    </div>
  )
}

// ── Main Feed ──────────────────────────────────────────────────────────────
export default function Feed() {
  const navigate = useNavigate()
  const { following, searchHistory } = useUser()
  const [tab, setTab] = useState('para-ti')
  const [feedLoading, setFeedLoading] = useState(true)
  const [supabaseHelpers, setSupabaseHelpers] = useState(LOCAL_HELPERS)
  useEffect(() => {
    // Show local helpers immediately, replace with Supabase when ready
    setFeedLoading(false)
    async function loadHelpers() {
      try {
        const remote = await getAllHelpers()
        if (remote?.length > 0) setSupabaseHelpers(remote)
      } catch (e) { console.error('Feed Supabase:', e) }
    }
    loadHelpers()
  }, [])
  const [showGate, setShowGate] = useState(false)

  // Merge demo enrichments so posts appear in feed
  const enrichedLocalHelpers = LOCAL_HELPERS.map(h =>
    h.id >= 2000 && DEMO_ENRICHMENTS[h.id]
      ? { ...DEMO_ENRICHMENTS[h.id], ...h, posts: DEMO_ENRICHMENTS[h.id].posts }
      : h
  )
  const feedHelpers = [...enrichedLocalHelpers, ...supabaseHelpers]
    .filter(h => h != null && h.id != null)
    .filter((h, i, arr) => arr.findIndex(x => x != null && x.id === h.id) === i)

  // Memoize daily pick so it doesn't disappear on tab switch
  const dailyPick = React.useMemo(() => {
    const available = feedHelpers.filter(h => h.available)
    if (!available.length) return null
    return available[DAILY_SEED % available.length]
  }, [feedHelpers])
  const allPosts = buildFeed(following, feedHelpers, COMPANIES)
  const displayPosts = tab === 'siguiendo'
    ? allPosts.filter(p => p.following)
    : allPosts

  const followingCount = allPosts.filter(p => p.following).length

  return (
    <div className={styles.page}>
      <PageHeader />

      {/* Tabs */}
      <div className={styles.tabs} style={{animation:"fadeInUp 0.25s ease-out forwards"}}>
        <div className={styles.tabsInner}>
          <button
            className={`${styles.tab} ${tab==='para-ti' ? styles.tabActive : ''}`}
            onClick={() => setTab('para-ti')}>
            Para ti
          </button>
          <button
            className={`${styles.tab} ${tab==='siguiendo' ? styles.tabActive : ''}`}
            onClick={() => setTab('siguiendo')}>
            Siguiendo{followingCount > 0 ? ` (${followingCount})` : ''}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className={styles.feed}>

        {/* Nüra personalized section — based on last search */}
        
        {/* ── Profesional del día ── */}
        {tab === 'para-ti' && dailyPick && (
          <div className={styles.nuraPick} key="nura-pick"
            onClick={() => navigate(`/helper/${dailyPick.id}`, { state: { helper: dailyPick } })}>
            <div className={styles.nuraPickHeader}>
              <span className={styles.nuraPickLabel}>Profesional del día</span>
            </div>
            <HelperCard helper={dailyPick} />
          </div>
        )}

{tab === 'para-ti' && searchHistory?.length > 0 && (() => {
          const lastQ = searchHistory[0]?.query
          const lastCat = searchHistory[0]?.category
          const words = lastQ.toLowerCase().split(/\s+/).filter(w => w.length > 3)
          const related = feedHelpers.filter(h =>
            h.available && (
              (lastCat && h.category === lastCat) ||
              words.some(w =>
                h.specialty?.toLowerCase().includes(w) ||
                h.category?.toLowerCase().includes(w) ||
                h.bio?.toLowerCase().includes(w) ||
                (h.tags||[]).some(t => t.toLowerCase().includes(w))
              )
            )
          ).slice(0, 3)
          if (!related.length || !lastQ) return null
          return (
            <div style={{
              background:'linear-gradient(135deg,rgba(123,47,255,0.06),rgba(0,212,200,0.04))',
              border:'1px solid rgba(123,47,255,0.1)',
              borderRadius:'20px',padding:'16px',marginBottom:'10px',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'12px'}}>
                <img src="/logo-iso.png" alt="Nüra" style={{width:'14px',height:'14px',objectFit:'contain'}} />
                <span style={{fontSize:'var(--text-xs)',fontWeight:700,color:'var(--purple)',letterSpacing:'0.4px',textTransform:'uppercase'}}>
                  Basado en tu búsqueda
                </span>
              </div>
              <p style={{fontSize:'var(--text-sm)',color:'rgba(0,0,0,0.55)',margin:'0 0 12px',lineHeight:1.5}}>
                Buscaste <strong style={{color:'rgba(0,0,0,0.75)'}}>{lastQ}</strong>. Estos profesionales están disponibles ahora.
              </p>
              <HelperCarousel helpers={related} />
            </div>
          )
        })()}

        {feedLoading && (
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {[1,2].map(i => (
              <div key={i} style={{background:'rgba(255,255,255,0.85)',borderRadius:'20px',padding:'16px',
                animation:'pulse 1.5s ease-in-out infinite',boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
                <div style={{display:'flex',gap:'10px',alignItems:'center',marginBottom:'14px'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(0,0,0,0.06)',flexShrink:0}} />
                  <div style={{flex:1}}>
                    <div style={{height:'13px',borderRadius:'7px',background:'rgba(0,0,0,0.06)',width:'50%',marginBottom:'6px'}} />
                    <div style={{height:'10px',borderRadius:'5px',background:'rgba(0,0,0,0.04)',width:'35%'}} />
                  </div>
                  <div style={{width:'60px',height:'26px',borderRadius:'13px',background:'rgba(0,0,0,0.06)'}} />
                </div>
                <div style={{height:'12px',borderRadius:'6px',background:'rgba(0,0,0,0.04)',width:'95%',marginBottom:'8px'}} />
                <div style={{height:'12px',borderRadius:'6px',background:'rgba(0,0,0,0.04)',width:'80%'}} />
              </div>
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
          </div>
        )}
        {!feedLoading && displayPosts.length === 0 ? (
          <div className={styles.empty}>
            <Users2 size={44} color='rgba(0,0,0,0.12)' strokeWidth={1.2} />
            <h3>Aún no sigues a nadie</h3>
            <p>Sigue a profesionales para ver sus publicaciones aquí. Están en la tab "Para ti".</p>
            <button className={styles.emptyBtn} onClick={() => setTab('para-ti')}>
              Descubrir profesionales
            </button>
          </div>
        ) : (
          !feedLoading && (<>
            {tab === 'para-ti' && displayPosts.length > 0 && (
              <div style={{
                margin:'0 0 6px', padding:'14px 16px',
                background:'linear-gradient(135deg,rgba(123,47,255,0.08),rgba(123,47,255,0.03))',
                borderRadius:'16px', border:'1px solid rgba(123,47,255,0.12)'
              }}>
                <div style={{fontSize:'10px',fontWeight:700,color:'var(--purple)',letterSpacing:'0.6px',textTransform:'uppercase',marginBottom:'8px'}}>
                  ✦ Nuevas ayudas cerca de ti
                </div>
                <div style={{display:'flex',gap:'10px',overflowX:'auto',paddingBottom:'2px'}}>
                  {displayPosts
                    .filter(p => p?.author?.name && p?.authorType === 'helper')
                    .filter((p,i,arr) => arr.findIndex(x => x.author.id === p.author.id) === i)
                    .slice(0,5)
                    .map((p,i) => (
                      <div key={p.author.id || i} style={{minWidth:'250px',flexShrink:0}}>
                        <HelperCard helper={p.author} showContact={false} showPrice />
                      </div>
                    ))}
                </div>
              </div>
            )}
            {displayPosts.map((post, i) => (
              <div key={post.id || i} style={{animation:`cardCascade 0.45s ease-out ${i*80}ms both`}}>
                <PostCard post={post} />
              </div>
            ))}
          </>)
        )}
      </div>
      {showGate && <RegisterGate reason="follow" onClose={() => setShowGate(false)} />}
    </div>
  )
}
