import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Compass, MessageCircle, User, Rss } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './NavBar.module.css'

// MenuButton kept as empty stub to avoid breaking imports
export function MenuButton() { return null }

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnreadChats } = useUser()

  const hideOn = ['/login', '/register-helper', '/chat/']
  if (hideOn.some(p => location.pathname.startsWith(p))) return null

  const tabs = [
    { path: '/',              icon: Search,        label: 'Buscar' },
    { path: '/explore',       icon: Compass,       label: 'Profesionales' },
    { path: '/chats',         icon: MessageCircle, label: 'Chats',     badge: totalUnreadChats },
    { path: '/feed',          icon: Rss,           label: 'Comunidad' },
    { path: '/profile',       icon: User,          label: 'Perfil' },
  ]

  return (
    <nav className={styles.bottomNav}>
      {tabs.map(({ path, icon: Icon, label, badge }) => {
        const active = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path)
        return (
          <button key={path}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => navigate(path)}>
            <span className={styles.iconWrap}>
              <Icon size={22} strokeWidth={active ? 2 : 1.6} />
              {badge > 0 && <span className={styles.badge}>{badge > 9 ? '9+' : badge}</span>}
            </span>
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
