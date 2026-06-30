import { useLocation } from 'react-router-dom'
import styles from './AppShell.module.css'

// Pages that manage their own full-screen layout
const SELF_LAYOUT = ['/', '/login', '/onboarding', '/register-helper', '/chat/']

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
