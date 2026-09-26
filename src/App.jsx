import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUser } from './context/UserContext'
import { ponerTitulo, tituloDeRuta } from './utils/titulo'

import { NURA_BUILD } from './config'
console.log('[Nüra] build', NURA_BUILD)   // preflight-ok: el sello es como se sabe QUE hay desplegado; no lleva dato de nadie
// El navegador restauraba la posicion de scroll al navegar. Con rutas que
// alternan entre contenedor fijo (pestañas) y documento desplazable
// (Login, overlays), esa restauracion dejaba la pantalla llegando ya
// desplazada hacia abajo. La gestionamos nosotros.
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual' } catch { /* noop */ }   // preflight-ok: el sello en consola es deliberado
import Home from './pages/Home'
const HelperProfile = lazy(() => import('./pages/HelperProfile'))
const IntroLetter = lazy(() => import('./pages/IntroLetter'))
const Chat = lazy(() => import('./pages/Chat'))
const Login = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))
const Chats = lazy(() => import('./pages/Chats'))
const RegisterHelper = lazy(() => import('./pages/RegisterHelper'))
const Explore = lazy(() => import('./pages/Explore'))
const Feed = lazy(() => import('./pages/Feed'))
const NotFound = lazy(() => import('./pages/NotFound'))
import BottomNav from './components/BottomNav'
import AppShell from './components/AppShell'
import DesktopSidebar from './components/DesktopSidebar'
import ScrollToTop from './components/ScrollToTop'
const MyServices = lazy(() => import('./pages/MyServices'))
const Responder = lazy(() => import('./pages/Responder'))
const BajaAlerta = lazy(() => import('./pages/BajaAlerta'))
const Profesionales = lazy(() => import('./pages/Profesionales'))
const Siguiendo = lazy(() => import('./pages/Siguiendo'))
const Legal = lazy(() => import('./pages/Legal'))
// Carga PEREZOSA a proposito: estas dos pantallas traen la libreria de
// cuentas de Supabase (~220 kB). Solo las abre quien crea o recupera su
// acceso; el resto de la app no tiene por que descargarla.
const Entrar = lazy(() => import('./pages/Entrar'))
const Restablecer = lazy(() => import('./pages/Restablecer'))
import Toast from './components/Toast'
import PageTransition from './components/PageTransition'
import './index.css'
import './design-system.css'
import ErrorBoundary from './components/ErrorBoundary'

function AppRoutes() {
  // Entrada directa: un solo respiro del iso mientras arranca el JS
  const [booting, setBooting] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setBooting(false), 750)
    return () => clearTimeout(t)
  }, [])
  const location = useLocation()
  const { user } = useUser()

  // ── La primera vez ──
  // Sin pantallas de bienvenida (decisión del fundador, 2026-09-25): se
  // entra directo a la principal; buscar o crear cuenta, cuando uno quiera.

  // El título de la pestaña, por pantalla (las de datos ponen el suyo).
  useEffect(() => {
    const t = tituloDeRuta(location.pathname)
    if (t !== undefined) ponerTitulo(t)
  }, [location.pathname])

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

  // Lo que casi seguro se abrira despues (Chats, Perfil, un chat) se
  // descarga en segundo plano cuando la app ya esta quieta: abrir primero
  // es rapido y cambiar de pestaña sigue siendo instantaneo.
  useEffect(() => {
    // Si falla (red, versión nueva), no pasa nada: se pedirá al abrirla.
    const precargar = () => { for (const p of [import('./pages/Chats'), import('./pages/Profile'), import('./pages/Chat')]) p.catch(() => {}) }
    const id = window.requestIdleCallback ? window.requestIdleCallback(precargar, { timeout: 4000 }) : setTimeout(precargar, 2500)
    return () => { window.cancelIdleCallback ? window.cancelIdleCallback(id) : clearTimeout(id) }
  }, [])



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
      <div className="desktopMain" data-screen={location.pathname.split('/')[1] || 'home'} data-layout={['/login', '/register-helper'].includes(location.pathname) ? 'focus' : 'app'}>
        {/* Pestañas vivas: montadas tras su primera visita, visibles según ruta.
            Solo Inicio va en el archivo principal: el resto se descarga al
            visitarlas por primera vez (la app abre antes). */}
        <div style={tabStyle('/')}><Home /></div>
        {seenTabs['/explore'] && <div style={tabStyle('/explore')}><Suspense fallback={null}><Explore /></Suspense></div>}
        {seenTabs['/feed'] && (
          <div style={tabStyle('/feed')}>
            <Suspense fallback={null}><Feed /></Suspense>
          </div>
        )}
        {seenTabs['/chats'] && <div style={tabStyle('/chats')}><Suspense fallback={null}><Chats /></Suspense></div>}
        {seenTabs['/profile'] && <div style={tabStyle('/profile')}><Suspense fallback={null}><Profile /></Suspense></div>}

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
              <Route path="/legal/:doc" element={<Legal />} />
              <Route path="/entrar" element={<Suspense fallback={null}><Entrar /></Suspense>} />
              <Route path="/restablecer" element={<Suspense fallback={null}><Restablecer /></Suspense>} />
              {/* LA VUELTA: aqui aterriza el profesional desde el enlace
                  de su aviso. Corta y sin cuenta a proposito. */}
              <Route path="/r/:token" element={<Responder />} />
              <Route path="/baja/:token" element={<BajaAlerta />} />
              <Route path="/profesionales" element={<Profesionales />} />
              <Route path="/onboarding" element={<Navigate to="/" replace />} />
              {/* Con sesion, /login lleva a donde iba (nura_return_to), no a Inicio:
                  si no, al entrar se perdia el chat que la persona queria abrir. */}
              <Route path="/login" element={user ? <Navigate to={leerDestino()} replace /> : <Login />} />
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

function leerDestino() {
  try { return sessionStorage.getItem('nura_return_to') || '/' } catch { return '/' }
}

export default function App() {
  return (
    // La pantalla de error amable (antes: una roja con el código y un botón
    // que BORRABA todo lo guardado en el móvil, sesión incluida).
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
