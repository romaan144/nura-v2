import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Compass, MessageCircle, User } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './BottomNav.module.css'

const TABS = [
  { path: '/',        icon: Search,        label: 'Buscar'     },
  { path: '/explore', icon: Compass,       label: 'Profesionales' },
  { path: '/chats',   icon: MessageCircle, label: 'Chats'    },
  /* COMUNIDAD, RETIRADA DE LA BARRA (2026-08-16). Era un muro de 91
     acciones y 8,4 pantallas que no ayudaba a nadie a encontrar ayuda, y
     sus publicaciones ya vivian en la ficha de cada profesional, que es
     donde sirven. La ruta /feed sigue existiendo: se llega desde una
     publicacion, no desde una pestaña. Ver docs/revision-profunda.md. */
  { path: '/profile', icon: User,          label: 'Perfil'   },
]

const HIDE_ON = ['/login', '/onboarding', '/chat/', '/r/']

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { totalUnreadChats } = useUser()
  // Add 1 demo unread (Elena's message) if no real chats yet
  const { chats } = useUser()
  const effectiveUnread = chats?.length > 0 ? totalUnreadChats : totalUnreadChats + 1

  if (HIDE_ON.some(p => location.pathname.startsWith(p))) return null

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path)
        return (
          <button
            key={path}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
          >
            <div className={styles.iconWrap}>
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
              {path === '/chats' && effectiveUnread > 0 && (
                <span className={styles.badge}>{effectiveUnread > 9 ? '9+' : effectiveUnread}</span>
              )}
            </div>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
// Thu Jun 25 11:45:52 UTC 2026
