import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HousesPage from './pages/HousesPage'
import TenantsPage from './pages/TenantsPage'
import PaymentsPage from './pages/PaymentsPage'

function PrivateRoute({ children }) {
  const { admin, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-estate-950">
      <div className="text-gold-500 font-serif text-xl animate-pulse">Loading…</div>
    </div>
  )
  return admin ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { admin } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1A1A24',
              color: '#E0E0F0',
              border: '1px solid #2A2A3A',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#C5A028', secondary: '#0A0A0F' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
