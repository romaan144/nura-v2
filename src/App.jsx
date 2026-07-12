import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUser } from './context/UserContext'

import Splash from './pages/Splash'
import MomentoCero from './pages/MomentoCero'
import { MOMENTO_CERO_COOLDOWN, NURA_BUILD } from './config'
console.log('[Nüra] build', NURA_BUILD)
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
import OnboardingOverlay from './components/OnboardingOverlay'
const MyServices = lazy(() => import('./pages/MyServices'))
import Siguiendo from './pages/Siguiendo'
import Toast from './components/Toast'
import PageTransition from './components/PageTransition'
import './index.css'
import AppErrorBoundary from './components/AppErrorBoundary'

function AppRoutes() {
  const [showSplash, setShowSplash] = useState(true)
  const [showMomentoCero, setShowMomentoCero] = useState(false)
  const location = useLocation()
  const { user } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (user) return false
    return !localStorage.getItem('nura_onboarded')
  })

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

  if (showSplash) {
    return <Splash onFinish={() => {
      setShowSplash(false)
      // El Ritmo del Momento Cero — la demostración solo cuando toca.
      // Primera vez siempre; después según cooldown (demo: 2h, producción: nunca más).
      let lastShown = 0
      try { lastShown = parseInt(localStorage.getItem('nura_mc_last_shown') || '0') } catch {}
      const shouldShow = lastShown === 0 || (Date.now() - lastShown >= MOMENTO_CERO_COOLDOWN)
      if (shouldShow) {
        try { localStorage.setItem('nura_mc_last_shown', String(Date.now())) } catch {}
        setShowMomentoCero(true)
      }
    }} />
  }

  if (showMomentoCero) {
    return <MomentoCero onFinish={() => setShowMomentoCero(false)} />
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingOverlay onComplete={() => {
          localStorage.setItem('nura_onboarded', '1')
          setShowOnboarding(false)
        }} />
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
                height:'100dvh',background:'#F7F7F9'}}>
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
