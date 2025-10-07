import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useDevelopers = () => {
  const [developers, setDevelopers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchDevelopers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching developers...')
      const response = await api.getDevelopers()
      console.log('📦 Developers API response:', response)
      const developersData = response.data || []
      console.log('👥 Setting developers:', developersData.length, 'developers')
      setDevelopers(developersData)
    } catch (err) {
      console.error('❌ Error fetching developers:', err)
      setError(err.message || 'Failed to fetch developers')
      setDevelopers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevelopers()
  }, [])

  const refetch = () => {
    fetchDevelopers()
  }

  const addDeveloper = async (developerData) => {
    try {
      const response = await api.addDeveloper(developerData)
      await fetchDevelopers() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateDeveloper = async (id, developerData) => {
    try {
      const response = await api.updateDeveloper(id, developerData)
      await fetchDevelopers() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteDeveloper = async (id) => {
    try {
      console.log(`🗑️ Deleting developer with ID: ${id}`)
      console.log('👥 Current developers before delete:', developers.length)
      
      const response = await api.deleteDeveloper(id)
      console.log('✅ Delete API response:', response)
      
      // إزالة المطور من القائمة فوراً (optimistic update)
      console.log('🔄 Removing developer from local state...')
      setDevelopers(prevDevelopers => {
        const newDevelopers = prevDevelopers.filter(dev => dev.id !== parseInt(id))
        console.log(`👥 Developers after local removal: ${newDevelopers.length} (removed ID: ${id})`)
        return newDevelopers
      })
      
      console.log('🔄 Refreshing developers list from server...')
      await fetchDevelopers() // Refresh the list from server
      console.log('✅ Developers list refreshed from server')
      return response
    } catch (err) {
      console.error('❌ Error in deleteDeveloper:', err)
      // في حالة الخطأ، استعد البيانات من الخادم
      await fetchDevelopers()
      throw err
    }
  }

  return {
    developers,
    loading,
    error,
    refetch,
    addDeveloper,
    updateDeveloper,
    deleteDeveloper
  }
}

export { useDevelopers }
export default useDevelopers