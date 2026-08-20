import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from './context/UserContext'

import { MOMENTO_CERO_COOLDOWN, NURA_BUILD } from './config'
console.log('[Nüra] build', NURA_BUILD)   // preflight-ok: el sello es como se sabe QUE hay desplegado; no lleva dato de nadie
// El navegador restauraba la posicion de scroll al navegar. Con rutas que
// alternan entre contenedor fijo (pestañas) y documento desplazable
// (Login, overlays), esa restauracion dejaba la pantalla llegando ya
// desplazada hacia abajo. La gestionamos nosotros.
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual' } catch { /* noop */ }   // preflight-ok: el sello en consola es deliberado
import Home from './pages/Home'
const HelperProfile = lazy(() => import('./pages/HelperProfile'))
const IntroLetter = lazy(() => import('./pages/IntroLetter'))
import Chat from './pages/Chat'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Chats from './pages/Chats'
const RegisterHelper = lazy(() => import('./pages/RegisterHelper'))
import Explore from './pages/Explore'
const Feed = lazy(() => import('./pages/Feed'))
import NotFound from './pages/NotFound'
import BottomNav from './components/BottomNav'
import AppShell from './components/AppShell'
import DesktopSidebar from './components/DesktopSidebar'
import ScrollToTop from './components/ScrollToTop'
import OnboardingPage from './pages/Onboarding'
const MyServices = lazy(() => import('./pages/MyServices'))
import Siguiendo from './pages/Siguiendo'
import Toast from './components/Toast'
import PageTransition from './components/PageTransition'
import './index.css'
import AppErrorBoundary from './components/AppErrorBoundary'

function AppRoutes() {
  // Entrada directa: un solo respiro del iso mientras arranca el JS
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 750)
    return () => clearTimeout(t)
  }, [])
  const location = useLocation()
  const { user } = useUser()
  const navigate = useNavigate()

  // ── La primera vez ──
  // `/onboarding` estaba enrutada, funcionaba entera y NADIE navegaba a
  // ella: solo aparecia en tres listas de "ocultar la barra aqui". Un
  // dispositivo virgen entraba directo a Home y la promesa de marca no se
  // veia nunca.
  // Solo desde la raiz: un enlace profundo (una ficha compartida, un chat)
  // no debe secuestrarse. Y solo una vez: se marca al MOSTRARLA, no al
  // terminarla, para que abandonar a medias no deje a nadie atrapado.
  useEffect(() => {
    if (user) return
    if (location.pathname !== '/') return
    // COMPROBAR QUE EL ALMACENAMIENTO PERSISTE DE VERDAD, no solo que no
    // lanza. En navegacion privada de iOS y en algunos contextos embebidos,
    // `setItem` no falla pero no guarda: entonces `nura_onboarded` nunca
    // queda escrito y el onboarding se repite EN CADA ENTRADA. La persona
    // se queda atrapada en la primera pantalla para siempre.
    // Si no podemos garantizar la salida, no metemos a nadie.
    let visto = null
    try {
      const sonda = '__nura_probe'
      localStorage.setItem(sonda, '1')
      if (localStorage.getItem(sonda) !== '1') return   // no persiste: no redirigir
      localStorage.removeItem(sonda)
      visto = localStorage.getItem('nura_onboarded')
    } catch { return }
    if (!visto) navigate('/onboarding', { replace: true })
  }, [user, location.pathname])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Las pestañas viven ──
  // Montadas siempre tras su primera visita; solo alternan visibilidad.
  // Las animaciones de entrada ocurren UNA vez por vida de pestaña, el
  // estado y el scroll se conservan, y nada parpadea al cambiar.
  const TAB_PATHS = ['/', '/explore', '/feed', '/chats', '/profile']
  const isTab = TAB_PATHS.includes(location.pathname)
  const [seenTabs, setSeenTabs] = useState({ '/': true })
  useEffect(() => {
    if (isTab && !seenTabs[location.pathname]) {
      setSeenTabs(s => ({ ...s, [location.pathname]: true }))
    }
  }, [location.pathname, isTab, seenTabs])
  const tabStyle = p => ({ display: location.pathname === p ? 'block' : 'none', height: '100%' })



  return (
    <>

      {booting && (
        <div style={{position:'fixed', inset:0, zIndex:9999, background:'var(--paper)',
          display:'flex', alignItems:'center', justifyContent:'center',
          animation:'bootBreath 0.45s ease 0.25s both'}}>
          <img src="/logo-iso.png" alt="" style={{width:44, opacity:0.9}} />
        </div>
      )}

      <ScrollToTop />
      <DesktopSidebar />

      <AppShell>
      <div className="desktopMain">
        {/* Pestañas vivas: montadas tras su primera visita, visibles según ruta */}
        <div style={tabStyle('/')}><Home /></div>
        {seenTabs['/explore'] && <div style={tabStyle('/explore')}><Explore /></div>}
        {seenTabs['/feed'] && (
          <div style={tabStyle('/feed')}>
            <Suspense fallback={null}><Feed /></Suspense>
          </div>
        )}
        {seenTabs['/chats'] && <div style={tabStyle('/chats')}><Chats /></div>}
        {seenTabs['/profile'] && <div style={tabStyle('/profile')}><Profile /></div>}

        {!isTab && (
          <PageTransition>
            <Suspense fallback={
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',
                height:'100dvh',background:'var(--paper)'}}>
                <img src="/logo-iso.png" alt="" style={{width:'36px',opacity:0.35,
                  animation:'pulse 1.5s ease-in-out infinite'}} />
                <style>{`@keyframes pulse{0%,100%{opacity:0.35}50%{opacity:0.7}}`}</style>
              </div>
            }>
            <Routes location={location} key={location.pathname}>
              <Route path="/results" element={<Navigate to="/explore" replace />} />
              <Route path="/helper/:id" element={<HelperProfile />} />
              <Route path="/intro/:id" element={<IntroLetter />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/my-services" element={<MyServices />} />
              <Route path="/siguiendo" element={<Siguiendo />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/register-helper" element={<RegisterHelper />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </PageTransition>
        )}
      </div>
      </AppShell>

      <BottomNav />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
