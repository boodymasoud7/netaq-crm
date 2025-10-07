import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useReminders = () => {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchReminders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching reminders from API...')
      
      const response = await api.getReminders()
      console.log('✅ Reminders API response:', response)
      
      const remindersData = response.data || response || []
      console.log('📋 Processed reminders data:', remindersData)
      
      setReminders(remindersData)
      
    } catch (err) {
      console.error('❌ Error in fetchReminders:', err)
      setError(err.message || 'Failed to fetch reminders')
      setReminders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const refetch = () => {
    fetchReminders()
  }

  const addReminder = async (reminderData) => {
    try {
      const response = await api.addReminder(reminderData)
      await fetchReminders() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateReminder = async (id, reminderData) => {
    try {
      const response = await api.updateReminder(id, reminderData)
      await fetchReminders() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteReminder = async (id) => {
    try {
      const response = await api.deleteReminder(id)
      await fetchReminders() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    reminders,
    loading,
    error,
    refetch,
    addReminder,
    updateReminder,
    deleteReminder
  }
}

export { useReminders }
export default useReminders