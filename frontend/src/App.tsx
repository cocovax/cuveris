import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { TankDetailPage } from './pages/TankDetailPage'
import { AlarmsPage } from './pages/AlarmsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useMqttBridge } from './hooks/useMqttBridge'
import { useTankStore } from './store/tankStore'
import { useAuthStore } from './store/authStore'
import { LoginPanel } from './components/auth/LoginPanel'

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
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/cuves/:id" element={<TankDetailPage />} />
        <Route path="/alarmes" element={<AlarmsPage />} />
        <Route path="/reglages" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App

