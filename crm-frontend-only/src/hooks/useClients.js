import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useClients = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getClients()
      setClients(response.data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err.message || 'Failed to fetch clients')
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const refetch = () => {
    fetchClients()
  }

  const addClient = async (clientData) => {
    try {
      const response = await api.addClient(clientData)
      await fetchClients() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateClient = async (id, clientData) => {
    try {
      const response = await api.updateClient(id, clientData)
      await fetchClients() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteClient = async (id) => {
    try {
      const response = await api.deleteClient(id)
      await fetchClients() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    clients,
    loading,
    error,
    refetch,
    addClient,
    updateClient,
    deleteClient
  }
}

export { useClients }
export default useClients