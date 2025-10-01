import { useState, useEffect } from 'react'
import { useApi } from './useApi'

function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getLeads()
      setLeads(response.data || response || [])
    } catch (err) {
      console.error('Error fetching leads:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const refetch = () => {
    fetchLeads()
  }

  const addLead = async (leadData) => {
    try {
      const result = await api.addLead(leadData)
      await refetch()
      return result
    } catch (err) {
      console.error('Error adding lead:', err)
      throw err
    }
  }

  const updateLead = async (id, leadData) => {
    try {
      const result = await api.updateLead(id, leadData)
      await refetch()
      return result
    } catch (err) {
      console.error('Error updating lead:', err)
      throw err
    }
  }

  const deleteLead = async (id) => {
    try {
      const result = await api.deleteLead(id)
      await refetch()
      return result
    } catch (err) {
      console.error('Error deleting lead:', err)
      throw err
    }
  }

  return {
    leads,
    loading,
    error,
    refetch,
    addLead,
    updateLead,
    deleteLead
  }
}

export { useLeads }
export default useLeads
