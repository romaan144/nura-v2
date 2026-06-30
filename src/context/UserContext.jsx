import { createContext, useContext, useState, useEffect } from 'react'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch { return def } }
  const save = (key, val) => { try { if (val === null) { localStorage.removeItem(key) } else { localStorage.setItem(key, JSON.stringify(val)) } } catch(e) { console.warn('localStorage write failed:', e) } }

  const [user, setUser] = useState(() => load('nura_user', null))
  const [chats, setChats] = useState(() => load('nura_chats', []))
  const [ratings, setRatings] = useState(() => load('nura_ratings', []))
  const [searchHistory, setSearchHistory] = useState(() => load('nura_search_history', []))
  const [contactedHelpers, setContactedHelpers] = useState(() => load('nura_contacted', []))
  const [helpersCache, setHelpersCache] = useState({})
  const [following, setFollowing] = useState(() => {
    const stored = load('nura_following', null)
    // Demo: pre-seed with Carlos (1) and Elena (5) if no real data
    if (stored !== null) return stored
    return [1, 5]  // Carlos logopeda + Elena cuidadora
  })
  const [notifications, setNotifications] = useState(() => load('nura_notifications', []))
  const [favorites, setFavorites] = useState(() => load('nura_following', []))
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
    const savedHistory = localStorage.getItem('nura_history')
    if (savedHistory) setSearchHistory(JSON.parse(savedHistory))
    const savedContacted = localStorage.getItem('nura_contacted')
    if (savedContacted) setContactedHelpers(JSON.parse(savedContacted))
    const savedFollowing = localStorage.getItem('nura_following')
    if (savedFollowing) setFollowing(JSON.parse(savedFollowing))
    const savedNotifs = localStorage.getItem('nura_notifications')
    if (savedNotifs) setNotifications(JSON.parse(savedNotifs))
    const savedFavs = localStorage.getItem('nura_following')
    if (savedFavs) setFavorites(JSON.parse(savedFavs))
    } catch (e) { console.warn('localStorage unavailable:', e) }
  }, [])

  // Auto-persist key state
  useEffect(() => { save('nura_user', user) }, [user])
  useEffect(() => { save('nura_chats', chats) }, [chats])
  useEffect(() => { save('nura_ratings', ratings) }, [ratings])
  useEffect(() => { save('nura_search_history', searchHistory) }, [searchHistory])
  useEffect(() => { save('nura_following', following) }, [following])
  useEffect(() => { save('nura_following', favorites) }, [favorites])
  // nuraChatMessages: intentionally NOT persisted — Nüra always starts fresh
  useEffect(() => { save('nura_chat_histories', chatHistories) }, [chatHistories])
  useEffect(() => { save('nura_services', services) }, [services])

  function login(userData) {
    setUser(userData)
    save('nura_user', userData)
  }

  function addService(helper, date, time, note) {
    const service = {
      id: Date.now(),
      helperId: helper.id,
      helperName: helper.name,
      specialty: helper.specialty,
      avatarUrl: helper.avatarUrl,
      avatarColor: helper.avatarColor,
      avatar: helper.avatar,
      date,
      time,
      note,
      price: helper.price,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    setServices(prev => [service, ...prev])
    return service
  }

  function updateService(id, updates) {
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  function updateUser(updates) {
    const updated = { ...user, ...updates }
    setUser(updated)
    save('nura_user', updated)
  }

  function logout() {
    setUser(null)
    setChats([]); setRatings([]); setSearchHistory([])
    setContactedHelpers([]); setFollowing([]); setNotifications([])
    save('nura_user', null)
    save('nura_chats', null)
    save('nura_following', null)
  }

  function saveChatHistory(helperId, messages) {
    setChatHistories(prev => ({ ...prev, [String(helperId)]: messages }))
  }

  function getChatHistory(helperId) {
    return chatHistories[String(helperId)] || []
  }

  function addChat(helperId, helperName, helperColor, helperAvatar, lastMsg) {
    const existing = (chats||[]).find(c => c.helperId === helperId)
    let updated
    if (existing) {
      updated = (chats||[]).map(c => c.helperId === helperId
        ? { ...c, lastMsg, lastTime: new Date().toISOString(), unread: (c.unread || 0) + 1 }
        : c)
    } else {
      updated = [...chats, { helperId, helperName, helperColor, helperAvatar, lastMsg, lastTime: new Date().toISOString(), unread: 0 }]
    }
    setChats(updated)
    save('nura_chats', updated)
    if (!contactedHelpers.includes(helperId)) {
      const c = [...contactedHelpers, helperId]
      setContactedHelpers(c)
      save('nura_contacted', c)
    }
  }

  function markRead(helperId) {
    const updated = (chats||[]).map(c => c.helperId === helperId ? { ...c, unread: 0 } : c)
    setChats(updated)
    save('nura_chats', updated)
  }

  function addRating(helperId, rating, comment) {
    const updated = [...ratings, { helperId, rating, comment, date: new Date().toISOString() }]
    setRatings(updated)
    save('nura_ratings', updated)
  }

  function hasRated(helperId) {
    return (ratings||[]).some(r => r.helperId === helperId)
  }

  function addSearch(query, category) {
    const updated = [{ query, category, date: new Date().toISOString(), ts: Date.now() }, ...searchHistory].slice(0, 10)
    setSearchHistory(updated)
    save('nura_history', updated)
  }

  function cacheHelpers(helpers) {
    const map = {}
    helpers.forEach(h => { map[h.id] = h })
    setHelpersCache(prev => ({ ...prev, ...map }))
  }

  function follow(id) {
    if ((following||[]).includes(id)) return
    const updated = [...following, id]
    setFollowing(updated)
    save('nura_following', updated)
    // Add notification
    const notif = { id: Date.now(), type: 'followed', profileId: id, date: new Date().toISOString(), read: false }
    const updatedNotifs = [notif, ...notifications].slice(0, 50)
    setNotifications(updatedNotifs)
    save('nura_notifications', updatedNotifs)
  }

  function unfollow(id) {
    const updated = (following||[]).filter(f => f !== id)
    setFollowing(updated)
    save('nura_following', updated)
  }

  function isFollowing(id) {
    return (following||[]).includes(id)
  }

  function toggleFollow(helperId) {
    const isFav = favorites.includes(helperId)
    const updated = isFav ? (favorites||[]).filter(f => f !== helperId) : [...favorites, helperId]
    setFavorites(updated)
    return !isFav
  }
  // isFollowing already defined above from the following system

  function markNotifsRead() {
    const updated = (notifications||[]).map(n => ({ ...n, read: true }))
    setNotifications(updated)
    save('nura_notifications', updated)
  }

  const unreadNotifs = (notifications||[]).filter(n => !n.read).length
  const totalUnreadChats = chats.reduce((s, c) => s + (c.unread || 0), 0)

  return (
    <UserContext.Provider value={{
      user, login, logout,
      chats, addChat, markRead, totalUnreadChats,
      ratings, addRating, hasRated,
      searchHistory, addSearch,
      contactedHelpers,
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
