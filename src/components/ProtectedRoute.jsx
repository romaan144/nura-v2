import { Navigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'

export default function ProtectedRoute({ children, redirectTo = '/login' }) {
  const { user } = useUser()
  if (!user) return <Navigate to={redirectTo} replace />
  return children
}
