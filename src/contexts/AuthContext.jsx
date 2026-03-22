import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('crm_token')
    const savedUser = localStorage.getItem('crm_user')
    if (token && savedUser) setUser(JSON.parse(savedUser))
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('crm_token', res.data.token)
    localStorage.setItem('crm_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }

  const logout = () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
