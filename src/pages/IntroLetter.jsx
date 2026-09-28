import { Navigate, useLocation, useParams } from 'react-router-dom'

// Los enlaces antiguos abren el chat; nunca convierten la carta en un envío.
export default function IntroLetter() {
  const { id } = useParams()
  const { state } = useLocation()
  return <Navigate replace to={`/chat/${id}`} state={{
    helper: state?.helper,
    userQuery: state?.userQuery,
    analysis: state?.analysis,
  }} />
}
