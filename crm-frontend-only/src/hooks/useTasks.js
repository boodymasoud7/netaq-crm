import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useTasks = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getTasks()
      setTasks(response.data || [])
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError(err.message || 'Failed to fetch tasks')
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const refetch = () => {
    fetchTasks()
  }

  const addTask = async (taskData) => {
    try {
      const response = await api.addTask(taskData)
      await fetchTasks() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateTask = async (id, taskData) => {
    try {
      const response = await api.updateTask(id, taskData)
      await fetchTasks() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteTask = async (id) => {
    try {
      const response = await api.deleteTask(id)
      await fetchTasks() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    tasks,
    loading,
    error,
    refetch,
    addTask,
    updateTask,
    deleteTask
  }
}

export { useTasks }
export default useTasks