import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const name = localStorage.getItem('admin_name')
    if (token && name) {
      setAdmin({ name })
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const res = await authAPI.login(username, password)
    const { access_token, admin_name } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('admin_name', admin_name)
    setAdmin({ name: admin_name })
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('admin_name')
    setAdmin(null)
  }

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
