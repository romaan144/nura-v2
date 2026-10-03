import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { SEED_COMMENTS, SEED_REACCIONES } from '../data/obraPosts'
import { cancelarCitaServidor } from '../utils/escrituras'

import { DEMO_MODE } from '../config'
import { guardarPerfilDemo } from '../utils/cuentaDemo'
import { avatarVigente } from '../utils/avatar'
import { initialFollowing, hasFollowed, addFollowed, removeFollowed } from '../utils/following'

const UserContext = createContext(null)

// Los avatares guardados (chats, citas, seguidos…) se ponen al día al
// leerlos: uno generado con el estilo anterior se rehace con el actual.
const alDia = v => Array.isArray(v)
  ? v.map(x => x && typeof x === 'object' && typeof x.avatarUrl === 'string'
    ? { ...x, avatarUrl: avatarVigente(x.avatarUrl, x.helperName || x.name) || x.avatarUrl } : x)
  : v

export function UserProvider({ children }) {
  const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? alDia(JSON.parse(v)) : def } catch { return def } }
  const save = (key, val) => { try { if (val === null) { localStorage.removeItem(key) } else { localStorage.setItem(key, JSON.stringify(val)) } } catch(e) { console.warn('localStorage write failed:', e) } }

  const [user, setUser] = useState(() => load('nura_user', null))
  const [chats, setChats] = useState(() => load('nura_chats', []))
  const [ratings, setRatings] = useState(() => load('nura_ratings', []))
  // LAS FRASES DE BÚSQUEDA NO SE GUARDAN (regla de Sergio). Desde hace
  // tiempo nada las escribe, pero las que guardaron versiones anteriores
  // seguían en esos móviles y el saludo las leía: se borran al abrir.
  const [searchHistory, setSearchHistory] = useState([])
  useEffect(() => {
    try { localStorage.removeItem('nura_history'); localStorage.removeItem('nura_search_history') } catch { /* sin almacenamiento */ }
  }, [])
  const [contactedHelpers, setContactedHelpers] = useState(() => load('nura_contacted', []))
  const [personas, setPersonas] = useState(() => load('nura_personas', []))
  const [citas, setCitas] = useState(() => load('nura_citas', []))
  const [myStories, setMyStories] = useState(() => load('nura_my_stories', []))
  const [obraComments, setObraComments] = useState(() => load('nura_obra_comments', {}))
  const [utiles, setUtiles] = useState(() => load('nura_utiles', []))
  const [misObras, setMisObras] = useState(() => load('nura_obra_mias', []))
  const [helpersCache, setHelpersCache] = useState({})
  const [following, setFollowing] = useState(() => initialFollowing(
    load('nura_following', null), load('nura_favorites', null), DEMO_MODE,
  ))
  // La referencia permite encadenar acciones antes del siguiente render.
  const followingRef = useRef(following)
  const [notifications, setNotifications] = useState(() => load('nura_notifications', []))
  // Compatibilidad con consumidores antiguos: una sola lista, nunca dos estados.
  const favorites = following
  const [nuraChatMessages, setNuraChatMessages] = useState([])  // always starts fresh
  const [chatHistories, setChatHistories] = useState(() => load('nura_chat_histories', {}))
  const [services, setServices] = useState(() => load('nura_services', []))
  const [nuraLastMatches, setNuraLastMatches] = useState(null)

  useEffect(() => {
    try {
    const savedUser = load('nura_user', null)
    if (savedUser) setUser(savedUser)
    const savedChats = load('nura_chats', [])
    if (savedChats.length) setChats(savedChats)
    const savedRatings = load('nura_ratings', [])
    if (savedRatings.length) setRatings(savedRatings)
    const savedContacted = localStorage.getItem('nura_contacted')
    if (savedContacted) setContactedHelpers(JSON.parse(savedContacted))
    const savedNotifs = localStorage.getItem('nura_notifications')
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
    } catch (e) { console.warn('localStorage unavailable:', e) }
  }, [])

  // Auto-persist key state
  useEffect(() => { save('nura_user', user) }, [user])
  useEffect(() => { save('nura_chats', chats) }, [chats])
  useEffect(() => { save('nura_ratings', ratings) }, [ratings])
  useEffect(() => {
    save('nura_following', following)
    save('nura_favorites', following)
  }, [following])
  useEffect(() => { save('nura_notifications', notifications) }, [notifications])
  useEffect(() => { try { window.__nuraMisObras = misObras } catch { /* noop */ } }, [misObras])
  // nuraChatMessages: intentionally NOT persisted — Nüra always starts fresh
  useEffect(() => { save('nura_chat_histories', chatHistories) }, [chatHistories])
  useEffect(() => { save('nura_services', services) }, [services])

  // LA CITA, CONTESTADA. Cuando llegan las respuestas de los profesionales
  // (utils/escrituras.js avisa con «nura:respuestas») y una trae la cita
  // aceptada, rechazada o cancelada por el profesional, se marca aquí:
  // «Mis servicios», el recordatorio y la agenda lo ven.
  useEffect(() => {
    const aplicar = e => {
      const porPro = r => r.cita.estado === 'cancelada' && r.cita.cancela === 'profesional'
      const hechas = (e.detail || []).filter(r => r.cita && r.helperId && (r.cita.estado === 'aceptada' || r.cita.estado === 'rechazada' || porPro(r)))
      if (!hechas.length) return
      const de = (hid, f, h) => hechas.find(r => String(r.helperId) === String(hid) && r.cita.fecha === f && r.cita.hora === h)
      setServices(prev => prev.map(s => {
        const r = de(s.helperId, s.date, s.time)
        if (!r || s.status === 'completed' || s.status === 'cancelled') return s
        // La canceló el profesional: se guarda quién y su nota, para decirlo.
        if (porPro(r)) return { ...s, status: 'cancelled', canceladaPor: 'profesional', notaCancelacion: r.cita.nota || null }
        const status = r.cita.estado === 'aceptada' ? 'confirmed' : 'rejected'
        return s.status === status ? s : { ...s, status }
      }))
      setCitas(prev => {
        const nuevas = prev.map(c => {
          const r = c.estado === 'cancelada' ? null : de(c.helperId, c.fecha, c.hora)
          const estado = r ? (porPro(r) ? 'cancelada' : r.cita.estado === 'aceptada' ? 'confirmada' : 'rechazada') : c.estado
          return estado === c.estado ? c : { ...c, estado }
        })
        save('nura_citas', nuevas)
        return nuevas
      })
    }
    window.addEventListener('nura:respuestas', aplicar)
    return () => window.removeEventListener('nura:respuestas', aplicar)
  }, [])

  function login(userData) {
    setUser(userData)
    save('nura_user', userData)
    // Demostración: su cuenta guarda siempre el perfil al día. Si no, quien
    // volvía a entrar sin haber cerrado sesión recuperaba uno viejo.
    if (DEMO_MODE) guardarPerfilDemo(userData)
  }

  /**
   * `sustituye`: el id de la cita cancelada (o rechazada) a la que reemplaza.
   * La antigua queda marcada con la nueva hora, para decir «ya has pedido
   * otra» en vez de volver a ofrecer el botón.
   */
  function addService(helper, date, time, note, sustituye = null) {
    const service = {
      id: Date.now(),
      helperId: helper.id,
      helperName: helper.name,
      specialty: helper.specialty,
      category: helper.category,
      avatarUrl: helper.avatarUrl,
      avatarColor: helper.avatarColor,
      avatar: helper.avatar,
      date,
      time,
      note,
      price: helper.price,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...(sustituye != null ? { sustituye } : {}),
    }
    setServices(prev => [service, ...prev.map(s => sustituye != null && s.id === sustituye
      ? { ...s, reprogramada: { date, time } } : s)])
    return service
  }

  function updateService(id, updates) {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  function updateUser(updates) {
    const updated = { ...user, ...updates }
    setUser(updated)
    save('nura_user', updated)
    if (DEMO_MODE) guardarPerfilDemo(updated)
  }

  function logout() {
    // Demostración: su perfil (también el de profesional) vuelve al entrar.
    if (DEMO_MODE) guardarPerfilDemo(user)
    setUser(null)
    setChats([]); setRatings([]); setSearchHistory([])
    setContactedHelpers([]); updateFollowing([]); setNotifications([])
    save('nura_user', null)
    save('nura_chats', null)
    save('nura_following', [])
    save('nura_favorites', [])
  }

  function saveChatHistory(helperId, messages) {
    setChatHistories(prev => ({ ...prev, [String(helperId)]: messages }))
  }

  function getChatHistory(helperId) {
    return chatHistories[String(helperId)] || []
  }

  /**
   * `deQuien`: 'user' si el mensaje lo escribe la persona, 'helper' si llega
   * del profesional. Solo lo que LLEGA cuenta como no leido.
   *
   * Antes sumaba +1 en cada mensaje, tambien en los propios: escribias tres
   * y la insignia de la barra decia 2 sin leer, apuntando a tus propias
   * palabras. Medido en navegador.
   */
  // `avatarUrl`: su foto o avatar. Sin ella, la lista de Chats enseñaba sus
  // iniciales en vez de la cara que se ve en el chat.
  function addChat(helperId, helperName, helperColor, helperAvatar, lastMsg, deQuien = 'helper', avatarUrl) {
    const existing = (chats||[]).find(c => c.helperId === helperId)
    // Lo que llega mientras ese chat está abierto ya se está leyendo: no
    // cuenta como «sin leer» (antes, al salir, el chat seguía resaltado).
    const abierto = typeof window !== 'undefined' && window.location.pathname === `/chat/${helperId}`
    const suma = deQuien === 'user' || abierto ? 0 : 1
    let updated
    if (existing) {
      updated = (chats||[]).map(c => c.helperId === helperId
        ? { ...c, lastMsg, lastTime: new Date().toISOString(), unread: (c.unread || 0) + suma, avatarUrl: c.avatarUrl || avatarUrl }
        : c)
    } else {
      updated = [...chats, { helperId, helperName, helperColor, helperAvatar, avatarUrl, lastMsg, lastTime: new Date().toISOString(), unread: 0 }]
    }
    setChats(updated)
    save('nura_chats', updated)
    if (!contactedHelpers.find(c => (c.id || c) === helperId)) {
      const entry = { id: helperId, name: helperName, contactedAt: Date.now() }
      const c = [...contactedHelpers, entry]
      setContactedHelpers(c)
      save('nura_contacted', c)
    }
    // El Espejo — vincular este contacto a la persona activa de la búsqueda
    try {
      if (window.__nuraActivePersona) {
        linkPersonaContact(window.__nuraActivePersona, helperId)
        window.__nuraActivePersona = null
      }
    } catch {}
  }

  // Sobre el estado más reciente, no sobre el de cuando se creó la función:
  // así no pisa un mensaje que acabe de entrar.
  function markRead(helperId) {
    setChats(prev => {
      const updated = (prev||[]).map(c => String(c.helperId) === String(helperId) ? { ...c, unread: 0 } : c)
      save('nura_chats', updated)
      return updated
    })
  }

  function addRating(helperId, rating, comment) {
    const updated = [...ratings, { helperId, rating, comment, date: new Date().toISOString() }]
    setRatings(updated)
    save('nura_ratings', updated)
  }

  function hasRated(helperId) {
    return (ratings||[]).some(r => String(r.helperId) === String(helperId))
  }

  function addSearch(query, category) {
    // Solo en memoria mientras la app está abierta: nunca en el móvil.
    const updated = [{ query, category, date: new Date().toISOString(), ts: Date.now() }, ...searchHistory].slice(0, 10)
    setSearchHistory(updated)
  }

  function cacheHelpers(helpers) {
    const map = {}
    helpers.forEach(h => { map[h.id] = h })
    setHelpersCache(prev => ({ ...prev, ...map }))
  }

  function updateFollowing(updated) {
    followingRef.current = updated
    setFollowing(updated)
  }

  function follow(id) {
    const previous = followingRef.current
    const updated = addFollowed(previous, id)
    if (updated === previous) return
    updateFollowing(updated)
    const notif = { id: Date.now(), type: 'followed', profileId: id, date: new Date().toISOString(), read: false }
    setNotifications(prev => [notif, ...prev].slice(0, 50))
  }

  function unfollow(id) {
    updateFollowing(removeFollowed(followingRef.current, id))
  }

  function isFollowing(id) {
    return hasFollowed(following, id)
  }

  function toggleFollow(helperId) {
    const wasFollowing = hasFollowed(followingRef.current, helperId)
    if (wasFollowing) unfollow(helperId)
    else follow(helperId)
    return !wasFollowing
  }

  function markNotifsRead() {
    const updated = (notifications||[]).map(n => ({ ...n, read: true }))
    setNotifications(updated)
    save('nura_notifications', updated)
  }

  // ── El Espejo — las personas de la vida del usuario ──
  // Solo con permiso (decision del fundador, 2026-09-24): Home pregunta
  // «¿Quieres que me acuerde de tu madre?» y solo entonces se llama aqui.
  // Nunca se guarda la frase de la busqueda: solo quien es y sus rasgos.
  function upsertPersona(extracted) {
    if (!extracted?.relacion) return null
    const existing = personas.find(p => p.relacion === extracted.relacion)
    let id, updated
    if (existing) {
      id = existing.id
      const atributos = [...new Set([...(existing.atributos || []), ...(extracted.atributos || [])])]
      updated = personas.map(p => p.id === id
        ? { ...p, atributos, lastMentioned: Date.now() }
        : p)
    } else {
      id = 'p_' + Date.now()
      updated = [...personas, {
        id, relacion: extracted.relacion, label: extracted.label, suyo: extracted.suyo,
        atributos: extracted.atributos || [],
        firstMentioned: Date.now(), lastMentioned: Date.now(),
        contactedHelperIds: [],
      }]
    }
    setPersonas(updated)
    save('nura_personas', updated)
    return id
  }

  function linkPersonaContact(personaId, helperId) {
    const updated = personas.map(p => p.id === personaId && !(p.contactedHelperIds || []).includes(helperId)
      ? { ...p, contactedHelperIds: [...(p.contactedHelperIds || []), helperId] }
      : p)
    setPersonas(updated)
    save('nura_personas', updated)
  }

  function removePersona(personaId) {
    const updated = personas.filter(p => p.id !== personaId)
    setPersonas(updated)
    save('nura_personas', updated)
  }

  // ── La Cita — la memoria que mira hacia adelante ──
  // ── El profesional publica su obra ──
  function addObra({ type, title, body, result }) {
    if (!title?.trim() || !body?.trim()) return
    const hid = user?.helperId || user?.id
    const pieza = {
      id: 'my' + Date.now(), helperId: hid, mine: true,
      who: { name: user?.name || 'Yo', specialty: user?.helperProfile?.specialty || 'Profesional' },
      type: type || 'caso', title: title.trim(), body: body.trim(),
      result: result?.trim() || undefined, dateLabel: 'hoy', verified: false,
    }
    const updated = [pieza, ...misObras]
    setMisObras(updated)
    save('nura_obra_mias', updated)
    try { window.__nuraMisObras = updated } catch { /* noop */ }
  }

  // ── La demanda que no supimos atender ──
  // Hoy vive en el movil de cada persona: el fundador NO la ve hasta que
  // haya backend. Se registra desde ahora para que, el dia del enchufe,
  // exista historico en vez de empezar de cero. Le dira que profesionales
  // fichar y en que zona — un marketplace que no mide su demanda
  // insatisfecha recluta a ciegas.
  // Sin la frase de la busqueda: solo la categoria que no tuvo cobertura.
  function registrarDemanda({ categoria, fecha }) {
    if (!categoria) return
    const prev = load('nura_demanda_no_cubierta', [])
    const updated = [...prev, { categoria, fecha: fecha || Date.now() }].slice(-100)
    save('nura_demanda_no_cubierta', updated)
  }

  // ── Me sirve: no mide popularidad, mide utilidad ──
  function toggleUtil(postId) {
    if (!postId) return
    const yaEsta = (utiles || []).includes(postId)
    const updated = yaEsta ? utiles.filter(x => x !== postId) : [...utiles, postId]
    setUtiles(updated)
    save('nura_utiles', updated)
  }
  function utilesDe(postId) {
    return (SEED_REACCIONES[postId] || 0) + ((utiles || []).includes(postId) ? 1 : 0)
  }
  function meSirve(postId) {
    return (utiles || []).includes(postId)
  }

  // ── Los Comentarios Profesionales ──
  function addComment(postId, text) {
    const t = String(text || '').trim()
    if (!postId || !t) return
    const c = { id: 'u' + Date.now(), author: (user?.name?.split(' ')?.[0] || 'Tú'), text: t, ago: 'ahora', mine: true }
    const updated = { ...obraComments, [postId]: [...(obraComments[postId] || []), c] }
    setObraComments(updated)
    save('nura_obra_comments', updated)
  }
  function commentsFor(postId) {
    return [...(SEED_COMMENTS[postId] || []), ...(obraComments[postId] || [])]
  }

  // ── El Muro que crece contigo ──
  function addStory(story) {
    if (!story?.helperId) return
    if (myStories.some(s => s.helperId === story.helperId)) return  // una historia por conexión
    const updated = [story, ...myStories]
    setMyStories(updated)
    save('nura_my_stories', updated)
  }

  function addCita({ helperId, helperName, personaId, personaLabel, label, fecha, hora, estado }) {
    const nueva = {
      id: 'c_' + Date.now(), helperId, helperName,
      personaId: personaId || null, personaLabel: personaLabel || null,
      // fecha y hora estructuradas: sin ellas no hay ocupacion posible.
      // El label se conserva porque tres pantallas ya lo leen (Chats, el
      // saludo de Inicio y Tu semana): romperlo dejaria a Nura diciendo undefined.
      fecha: fecha || null, hora: hora || null, estado: estado || 'pendiente',
      label, createdAt: Date.now(),
    }
    const updated = [...citas, nueva]
    setCitas(updated)
    save('nura_citas', updated)
    return nueva
  }

  // CANCELAR UNA CITA. Primero se avisa al servidor (la hora vuelve a
  // quedar libre para todos y el profesional lo ve); si no hay conexión no
  // se toca nada y se devuelve 'fallo' para que la pantalla lo diga. En demo
  // o sin conversación guardada ('nada'), solo cambia en este móvil.
  async function cancelarCita({ helperId, fecha, hora, motivo }) {
    const r = await cancelarCitaServidor(helperId, fecha, hora, motivo)
    if (r === 'fallo') return r
    const es = (hid, f, h) => String(hid) === String(helperId) && f === fecha && h === hora
    setServices(prev => prev.map(s => es(s.helperId, s.date, s.time) && s.status !== 'completed' ? { ...s, status: 'cancelled' } : s))
    setCitas(prev => {
      const nuevas = prev.map(c => es(c.helperId, c.fecha, c.hora) ? { ...c, estado: 'cancelada' } : c)
      save('nura_citas', nuevas)
      return nuevas
    })
    return r
  }

  function confirmContact(helperId, confirmed) {
    const updated = contactedHelpers.map(c =>
      (c.id || c) === helperId ? { ...c, confirmed, confirmedAt: Date.now() } : c
    )
    setContactedHelpers(updated)
    save('nura_contacted', updated)
  }

  const unreadNotifs = (notifications||[]).filter(n => !n.read).length
  const totalUnreadChats = chats.reduce((s, c) => s + (c.unread || 0), 0)

  return (
    <UserContext.Provider value={{
      user, login, logout,
      chats, addChat, markRead, totalUnreadChats,
      ratings, addRating, hasRated,
      searchHistory, addSearch,
      contactedHelpers, confirmContact,
      personas, upsertPersona, linkPersonaContact, removePersona,
      citas, addCita, cancelarCita,
      myStories, addStory,
      addComment, commentsFor,
      toggleUtil, utilesDe, meSirve,
      registrarDemanda,
      misObras, addObra,
      helpersCache, cacheHelpers,
      following, follow, unfollow, isFollowing,
      notifications, markNotifsRead, unreadNotifs,
      favorites, toggleFollow,
      nuraChatMessages, setNuraChatMessages,
      nuraLastMatches, setNuraLastMatches,
      services, addService, updateService,
      updateUser,
      chatHistories, saveChatHistory, getChatHistory,
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() { return useContext(UserContext) }
