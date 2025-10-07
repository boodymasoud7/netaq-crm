import { useState, useEffect } from 'react'
import { useApi } from './useApi'

const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.getProjects()
      setProjects(response.data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message || 'Failed to fetch projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const refetch = () => {
    fetchProjects()
  }

  const addProject = async (projectData) => {
    try {
      const response = await api.addProject(projectData)
      await fetchProjects() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const updateProject = async (id, projectData) => {
    try {
      const response = await api.updateProject(id, projectData)
      await fetchProjects() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  const deleteProject = async (id) => {
    try {
      const response = await api.deleteProject(id)
      await fetchProjects() // Refresh the list
      return response
    } catch (err) {
      throw err
    }
  }

  return {
    projects,
    loading,
    error,
    refetch,
    addProject,
    updateProject,
    deleteProject
  }
}

export { useProjects }
export default useProjects