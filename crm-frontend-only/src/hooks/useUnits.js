import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useUnits = () => {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchUnits = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getUnits()
      setUnits(response.data || [])
    } catch (err) {
      console.error('Error fetching units:', err)
      setError(err.message || 'Failed to fetch units')
      setUnits([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUnits()
  }, [])

  const refetch = () => {
    fetchUnits()
  }

  const addUnit = async (unitData) => {
    try {
      const response = await api.addUnit(unitData)
      await fetchUnits() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateUnit = async (id, unitData) => {
    try {
      const response = await api.updateUnit(id, unitData)
      await fetchUnits() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteUnit = async (id) => {
    try {
      const response = await api.deleteUnit(id)
      await fetchUnits() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    units,
    loading,
    error,
    refetch,
    addUnit,
    updateUnit,
    deleteUnit
  }
}

export default useUnits