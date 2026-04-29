/**
 * ============================================
 * useApi Hook - Abstracción de API
 * Sistema Francisco
 * Aplicando SOLID - Open/Closed
 * ============================================
 */

import { useState, useCallback } from 'react'

/**
 * Hook genérico para operaciones CRUD
 * @param {Object} service - Servicio de API inyectable
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y métodos para CRUD
 */
function useApi(service, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getAll = useCallback(async (params) => {
    setLoading(true)
    setError(null)
    try {
      const response = await service.getAll(params)
      setData(response.data)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const getById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await service.getById(id)
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service])

  const create = useCallback(async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await service.create(payload)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service, options])

  const update = useCallback(async (id, payload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await service.update(id, payload)
      if (options.onSuccess) {
        options.onSuccess(response.data)
      }
      return response.data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service, options])

  const remove = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await service.delete(id)
      if (options.onDelete) {
        options.onDelete(id)
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [service, options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove,
    reset
  }
}

export default useApi