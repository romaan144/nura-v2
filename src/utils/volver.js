import { useNavigate } from 'react-router-dom'

// ── LA FLECHA NUNCA SACA DE NÜRA (Sergio, 2026-10-02) ───────────────────
// Si se entra directo (un perfil compartido por WhatsApp, un aviso), no hay
// pantalla anterior dentro de Nüra y «atrás» llevaba a una página en blanco.
// React Router guarda en `history.state.idx` cuántos pasos lleva dentro de
// la app: con 0, la flecha va a la portada.
export function hayPasoAnterior() {
  try { return (window.history.state?.idx ?? 0) > 0 } catch { return false }
}

export function useVolver() {
  const navigate = useNavigate()
  return () => (hayPasoAnterior() ? navigate(-1) : navigate('/', { replace: true }))
}
