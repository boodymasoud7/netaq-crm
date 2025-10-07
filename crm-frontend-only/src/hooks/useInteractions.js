import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApi } from './useApi'

// Hook for managing interactions with real API
export function useInteractions(itemType, itemId) {
  const [interactions, setInteractions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchInteractions = useCallback(async () => {
    if (!itemType || !itemId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await api.getInteractions({ itemType, itemId })
      setInteractions(response.data || [])
    } catch (err) {
      console.error(`Error fetching interactions for ${itemType} ${itemId}:`, err)
      setError(err.message || 'Failed to fetch interactions')
      setInteractions([])
    } finally {
      setLoading(false)
    }
  }, [api, itemType, itemId])

  useEffect(() => {
    fetchInteractions()
  }, [fetchInteractions])

  const addInteraction = useCallback(async (interactionData) => {
    try {
      const response = await api.addInteraction({
        ...interactionData,
        itemType,
        itemId
      })
      setInteractions(prev => [response.data, ...prev])
      return response.data
    } catch (err) {
      console.error('Error adding interaction:', err)
      throw err
    }
  }, [api, itemType, itemId])

  const updateInteraction = useCallback(async (interactionId, interactionData) => {
    try {
      const response = await api.updateInteraction(interactionId, interactionData)
      setInteractions(prev => prev.map(interaction => 
        interaction.id === interactionId ? response.data : interaction
      ))
      return response.data
    } catch (err) {
      console.error('Error updating interaction:', err)
      throw err
    }
  }, [api])

  const deleteInteraction = useCallback(async (interactionId) => {
    try {
      await api.deleteInteraction(interactionId)
      setInteractions(prev => prev.filter(interaction => interaction.id !== interactionId))
    } catch (err) {
      console.error('Error deleting interaction:', err)
      throw err
    }
  }, [api])

  return {
    interactions,
    loading,
    error,
    refetch: fetchInteractions,
    addInteraction,
    updateInteraction,
    deleteInteraction
  }
}

// Hook for getting all client interactions (for ClientsTable)
export function useAllClientInteractions(clientIds = []) {
  const [allInteractions, setAllInteractions] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  // Memoize clientIds to prevent unnecessary re-fetches
  const memoizedClientIds = useMemo(() => 
    Array.isArray(clientIds) ? clientIds.sort() : []
  , [clientIds])

  const fetchAllClientInteractions = useCallback(async () => {
    if (!memoizedClientIds.length) {
      setAllInteractions({})
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const interactionsMap = {}
      
      console.log(`💬 Fetching interactions for ${memoizedClientIds.length} clients...`)
      
      // Fetch interactions for each client with throttling
      const batchSize = 5
      for (let i = 0; i < memoizedClientIds.length; i += batchSize) {
        const batch = memoizedClientIds.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map(async (clientId) => {
            try {
              const response = await api.getInteractions({ itemType: 'client', itemId: clientId })
              interactionsMap[clientId] = response.data || []
            } catch (err) {
              if (err.message !== 'Validation failed') {
                console.error(`Error fetching interactions for client ${clientId}:`, err)
              }
              interactionsMap[clientId] = []
            }
          })
        )
        
        if (i + batchSize < memoizedClientIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      setAllInteractions(interactionsMap)
      console.log(`✅ Loaded interactions for ${Object.keys(interactionsMap).length} clients`)
    } catch (err) {
      console.error('Error fetching all client interactions:', err)
      setError(err.message || 'Failed to fetch client interactions')
      setAllInteractions({})
    } finally {
      setLoading(false)
    }
  }, [api, memoizedClientIds])

  useEffect(() => {
    fetchAllClientInteractions()
  }, [fetchAllClientInteractions])

  return {
    allInteractions,
    loading,
    error,
    refetch: fetchAllClientInteractions
  }
}

// Hook for getting all lead interactions (for LeadsTable)
export function useAllLeadInteractions(leadIds = []) {
  const [allInteractions, setAllInteractions] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  // Memoize leadIds to prevent unnecessary re-fetches
  const memoizedLeadIds = useMemo(() => 
    Array.isArray(leadIds) ? leadIds.sort() : []
  , [leadIds])

  const fetchAllLeadInteractions = useCallback(async () => {
    if (!memoizedLeadIds.length) {
      setAllInteractions({})
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const interactionsMap = {}
      
      console.log(`💬 Fetching interactions for ${memoizedLeadIds.length} leads...`)
      
      // Fetch interactions for each lead with throttling
      const batchSize = 5
      for (let i = 0; i < memoizedLeadIds.length; i += batchSize) {
        const batch = memoizedLeadIds.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map(async (leadId) => {
            try {
              const response = await api.getInteractions({ itemType: 'lead', itemId: leadId })
              interactionsMap[leadId] = response.data || []
            } catch (err) {
              if (err.message !== 'Validation failed') {
                console.error(`Error fetching interactions for lead ${leadId}:`, err)
              }
              interactionsMap[leadId] = []
            }
          })
        )
        
        if (i + batchSize < memoizedLeadIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      setAllInteractions(interactionsMap)
      console.log(`✅ Loaded interactions for ${Object.keys(interactionsMap).length} leads`)
    } catch (err) {
      console.error('Error fetching all lead interactions:', err)
      setError(err.message || 'Failed to fetch lead interactions')
      setAllInteractions({})
    } finally {
      setLoading(false)
    }
  }, [api, memoizedLeadIds])

  useEffect(() => {
    fetchAllLeadInteractions()
  }, [fetchAllLeadInteractions])

  return {
    allInteractions,
    loading,
    error,
    refetch: fetchAllLeadInteractions
  }
}

export { useInteractions as default }


