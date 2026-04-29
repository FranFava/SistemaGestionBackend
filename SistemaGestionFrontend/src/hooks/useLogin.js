/**
 * ============================================
 * useLogin Hook - Lógica de Autenticación
 * Sistema Francisco
 * Aplicando SOLID - Single Responsibility
 * ============================================
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Hook personalizado para manejar autenticación
 * @returns {Object} - Estado y handlers para login
 */
function useLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      await login(username, password)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }, [username, password, login])

  const handleUsernameChange = useCallback((value) => {
    setUsername(value)
  }, [])

  const handlePasswordChange = useCallback((value) => {
    setPassword(value)
  }, [])

  const reset = useCallback(() => {
    setUsername('')
    setPassword('')
    setError('')
    setLoading(false)
  }, [])

  const isValid = username.trim() !== '' && password.trim() !== ''

  return {
    username,
    password,
    error,
    loading,
    user,
    isValid,
    handleSubmit,
    handleUsernameChange,
    handlePasswordChange,
    reset,
    navigate
  }
}

export default useLogin