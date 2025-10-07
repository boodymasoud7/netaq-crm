import { useState, useEffect } from 'react'
import { useApi } from './useApi'

function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getUsers()
      setUsers(response.data || response || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const addUser = async (userData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.addUser(userData)
      await fetchUsers() // Refresh the list
      return response
    } catch (err) {
      console.error('Error adding user:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.deleteUser(userId)
      await fetchUsers() // Refresh the list
      return response
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.updateUser(userId, userData)
      await fetchUsers() // Refresh the list
      return response
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId, status) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.updateUserStatus(userId, status)
      await fetchUsers() // Refresh the list
      return response
    } catch (err) {
      console.error('Error updating user status:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchUsers()
  }

  return {
    users,
    loading,
    error,
    refetch,
    addUser,
    deleteUser,
    updateUser,
    updateUserStatus
  }
}

export { useUsers }
export default useUsers