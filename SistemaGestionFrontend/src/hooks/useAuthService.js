/**
 * ============================================
 * useAuthService - Abstracción de Autenticación
 * Sistema Francisco
 * Aplicando SOLID - Dependency Inversion
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react'
import { authService } from '../services/api'

/**
 * Hook para operaciones de autenticación
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y métodos de auth
 */
function useAuthService(options = {}) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const initializeAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (!token) {
      setLoading(false)
      return
    }

    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser)
        setUser(userObj)
      } catch {
        localStorage.removeItem('user')
      }
    }

    try {
      const { data } = await authService.validate()
      if (data.usuario) {
        localStorage.setItem('user', JSON.stringify(data.usuario))
        setUser(data.usuario)
      } else if (!storedUser) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } catch (err) {
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser)
          setUser(userObj)
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setError(null)
    try {
      const { data } = await authService.login(username, password)
      if (data.token && data.usuario) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.usuario))
        setUser(data.usuario)
        return data
      }
      throw new Error('Respuesta de login inválida')
    } catch (err) {
      const message = err.response?.data?.message || err.message
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    if (options.onLogout) {
      options.onLogout()
    }
  }, [options])

  const validate = useCallback(async () => {
    try {
      const { data } = await authService.validate()
      if (data.usuario) {
        setUser(data.usuario)
        return data.usuario
      }
      return null
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    validate
  }
}

export default useAuthService