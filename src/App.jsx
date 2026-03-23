import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Clients from './pages/Clients'
import Affaires from './pages/Affaires'
import Reclamations from './pages/Reclamations'
import Emails from './pages/Emails'
import Social from './pages/Social'
import Wix from './pages/Wix'
import Settings from './pages/Settings'
import Documents from './pages/Documents'
import Charges from './pages/Charges'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="clients" element={<Clients />} />
            <Route path="affaires" element={<Affaires />} />
            <Route path="reclamations" element={<Reclamations />} />
            <Route path="emails" element={<Emails />} />
            <Route path="social" element={<Social />} />
            <Route path="wix" element={<Wix />} />
            <Route path="documents" element={<Documents />} />
            <Route path="charges" element={<Charges />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
