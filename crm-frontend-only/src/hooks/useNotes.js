import { useState, useEffect, useCallback, useMemo } from 'react'
import { useApi } from './useApi'

// Hook for managing notes with real API
export function useNotes(itemType, itemId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchNotes = useCallback(async () => {
    if (!itemType || !itemId) return
    
    setLoading(true)
    setError(null)
    try {
      const response = await api.getNotes(itemType, itemId, {})
      setNotes(response.data || [])
    } catch (err) {
      console.error(`Error fetching notes for ${itemType} ${itemId}:`, err)
      setError(err.message || 'Failed to fetch notes')
      setNotes([])
    } finally {
      setLoading(false)
    }
  }, [api, itemType, itemId])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const addNote = useCallback(async (noteData) => {
    try {
      const response = await api.addNote({
        ...noteData,
        itemType,
        itemId
      })
      setNotes(prev => [response.data, ...prev])
      return response.data
    } catch (err) {
      console.error('Error adding note:', err)
      throw err
    }
  }, [api, itemType, itemId])

  const updateNote = useCallback(async (noteId, noteData) => {
    try {
      const response = await api.updateNote(noteId, noteData)
      setNotes(prev => prev.map(note => 
        note.id === noteId ? response.data : note
      ))
      return response.data
    } catch (err) {
      console.error('Error updating note:', err)
      throw err
    }
  }, [api])

  const deleteNote = useCallback(async (noteId) => {
    try {
      await api.deleteNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))
    } catch (err) {
      console.error('Error deleting note:', err)
      throw err
    }
  }, [api])

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    addNote,
    updateNote,
    deleteNote
  }
}

// Hook for getting all client notes (for ClientsTable)
export function useAllClientNotes(clientIds = []) {
  const [allNotes, setAllNotes] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  // Memoize clientIds to prevent unnecessary re-fetches
  const memoizedClientIds = useMemo(() => 
    Array.isArray(clientIds) ? clientIds.sort() : []
  , [clientIds])

  const fetchAllClientNotes = useCallback(async () => {
    if (!memoizedClientIds.length) {
      setAllNotes({})
      return
    }
    
    // تقليل الطلبات المتكررة بتأخير قصير
    setLoading(true)
    setError(null)
    
    try {
      const notesMap = {}
      
      // تحسين: تقليل console.log والطلبات المتكررة
      console.log(`📝 Fetching notes for ${memoizedClientIds.length} clients...`)
      
      // Fetch notes for each client with throttling
      const batchSize = 5 // معالجة 5 عملاء في المرة الواحدة
      for (let i = 0; i < memoizedClientIds.length; i += batchSize) {
        const batch = memoizedClientIds.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map(async (clientId) => {
            try {
              const response = await api.getNotes('client', clientId, {})
              notesMap[clientId] = response.data || []
            } catch (err) {
              // تقليل console.error للأخطاء المتكررة
              if (err.message !== 'Validation failed') {
                console.error(`Error fetching notes for client ${clientId}:`, err)
              }
              notesMap[clientId] = []
            }
          })
        )
        
        // تأخير قصير بين المجموعات
        if (i + batchSize < memoizedClientIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      setAllNotes(notesMap)
      console.log(`✅ Loaded notes for ${Object.keys(notesMap).length} clients`)
    } catch (err) {
      console.error('Error fetching all client notes:', err)
      setError(err.message || 'Failed to fetch client notes')
      setAllNotes({})
    } finally {
      setLoading(false)
    }
  }, [api, memoizedClientIds])

  useEffect(() => {
    fetchAllClientNotes()
  }, [fetchAllClientNotes])

  return {
    allNotes,
    loading,
    error,
    refetch: fetchAllClientNotes
  }
}

export { useNotes as default }
