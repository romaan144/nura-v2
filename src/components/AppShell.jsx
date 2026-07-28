import { useLocation } from 'react-router-dom'
import styles from './AppShell.module.css'

// Pages that manage their own full-screen layout
// '/login' salio de aqui: era la unica pantalla de formulario sin el
// contenedor de la app, y por eso flotaba sin altura de referencia.
const SELF_LAYOUT = ['/', '/onboarding', '/register-helper', '/chat/']

export default function AppShell({ children }) {
  const location = useLocation()
  const isSelf = SELF_LAYOUT.some(p =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  )

  // Self-layout pages manage their own fixed positioning
  if (isSelf) return <>{children}</>

  // All other pages get the standard scroll container
  // PageHeader (fixed, z-indexed) renders inside each page
  // BottomNav (fixed, z-indexed) renders in App.jsx
  // This shell just provides: fixed inset, correct padding, overflow
  return (
    <div className={styles.shell}>
      {children}
    </div>
  )
}
