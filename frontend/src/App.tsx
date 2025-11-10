import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { useMqttBridge } from './hooks/useMqttBridge'
import { useTankStore } from './store/tankStore'
import { useAuthStore } from './store/authStore'
import { LoginPanel } from './components/auth/LoginPanel'

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const TankDetailPage = lazy(() =>
  import('./pages/TankDetailPage').then((module) => ({ default: module.TankDetailPage })),
)
const AlarmsPage = lazy(() =>
  import('./pages/AlarmsPage').then((module) => ({ default: module.AlarmsPage })),
)
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

function App() {
  const initializeTanks = useTankStore((state) => state.initialize)
  const authStatus = useAuthStore((state) => state.status)
  const initializeAuth = useAuthStore((state) => state.initialize)
  useMqttBridge()

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (authStatus === 'authenticated') {
      void initializeTanks()
    }
  }, [authStatus, initializeTanks])

  if (authStatus === 'idle' || authStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Chargement…
      </div>
    )
  }

  if (authStatus === 'unauthenticated') {
    return <LoginPanel />
  }

  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Chargement…</div>
        }
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/cuves/:id" element={<TankDetailPage />} />
          <Route path="/alarmes" element={<AlarmsPage />} />
          <Route path="/historique" element={<HistoryPage />} />
          <Route path="/reglages" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}

export default App

