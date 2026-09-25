import { useLocation, useNavigate } from 'react-router-dom'
import { Search, MessageCircle, User } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { DEMO_MODE } from '../config'
import { useSinContestar } from '../utils/sinContestar'
import styles from './BottomNav.module.css'

const TABS = [
  { path: '/',        icon: Search,        label: 'Buscar'     },
  /* PROFESIONALES, RETIRADA DE LA BARRA (2026-08-16). Era una segunda
     puerta a lo mismo: su buscador ya mandaba a Inicio. Lo que si aportaba
     —ver que hay sin saber que pedir— vive ahora bajo la capsula de Inicio,
     con el enlace "¿No sabes que buscar?". La ruta /explore sigue viva.
     Barra final: Nüra · Chats · Perfil. */
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
  // El «1» de Elena (conversacion de ejemplo) SOLO en la demo. Fuera de
  // ella era un mensaje sin leer que no existia, el primer dia de alguien.
  const { chats, user } = useUser()
  // A la profesional le cuentan tambien los mensajes que le han escrito y
  // aun no ha contestado (su bandeja «Te han escrito»).
  const sinContestar = useSinContestar(user)
  const effectiveUnread = (DEMO_MODE && !(chats?.length > 0) ? totalUnreadChats + 1 : totalUnreadChats) + sinContestar

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
