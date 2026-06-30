import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useUser } from './context/UserContext'

import Splash from './pages/Splash'
import Home from './pages/Home'
import Results from './pages/Results'
const HelperProfile = lazy(() => import('./pages/HelperProfile'))
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
  const [searchState, setSearchState] = useState(null)
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  const { user } = useUser()
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (user) return false
    return !localStorage.getItem('nura_onboarded')
  })

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />
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
            <Route path="/" element={<Home setSearchState={setSearchState} />} />
            <Route path="/results" element={
              searchState
                ? <Results searchState={searchState} setSearchState={setSearchState} />
                : <Navigate to="/" />
            } />
            <Route path="/helper/:id" element={<HelperProfile />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/my-services" element={<MyServices />} />
            <Route path="/siguiendo" element={<Siguiendo />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/register-helper" element={<RegisterHelper />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </PageTransition>
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
