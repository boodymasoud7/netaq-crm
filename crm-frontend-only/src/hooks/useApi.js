import { useState, useEffect } from 'react'
import { authAPI, dbAPI } from '../lib/apiSwitch.js'
import toast from 'react-hot-toast'

// Custom hook for API operations
export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const makeApiCall = async (apiFunction, ...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(...args)
      setLoading(false)
      return result
    } catch (err) {
      setError(err.message)
      setLoading(false)
      toast.error(err.message)
      throw err
    }
  }

  const clearError = () => setError(null)

  return {
    loading,
    error,
    clearError,
    makeApiCall,
    // Auth methods
    login: (email, password) => makeApiCall(authAPI.login, email, password),
    logout: () => makeApiCall(authAPI.logout),
    getCurrentUser: () => makeApiCall(authAPI.getCurrentUser),
    updateProfile: (data) => makeApiCall(authAPI.updateProfile, data),
    changePassword: (oldPass, newPass) => makeApiCall(authAPI.changePassword, oldPass, newPass),
    
    // Clients methods
    getClients: (params) => makeApiCall(dbAPI.getClients, params),
    getClientById: (id) => makeApiCall(dbAPI.getClientById, id),
    addClient: (data) => makeApiCall(dbAPI.addClient, data),
    updateClient: (id, data) => makeApiCall(dbAPI.updateClient, id, data),
    deleteClient: (id) => makeApiCall(dbAPI.deleteClient, id),
    getClientStats: () => makeApiCall(dbAPI.getClientStats),
    
    // Archive methods
    getArchivedClients: (params) => makeApiCall(dbAPI.getArchivedClients, params),
    restoreClient: (id) => makeApiCall(dbAPI.restoreClient, id),
    permanentDeleteClient: (id) => makeApiCall(dbAPI.permanentDeleteClient, id),
    permanentDeleteAllClients: () => makeApiCall(dbAPI.permanentDeleteAllClients),
    
    getArchivedLeads: (params) => makeApiCall(dbAPI.getArchivedLeads, params),
    restoreLead: (id) => makeApiCall(dbAPI.restoreLead, id),
    permanentDeleteLead: (id) => makeApiCall(dbAPI.permanentDeleteLead, id),
    permanentDeleteAllLeads: () => makeApiCall(dbAPI.permanentDeleteAllLeads),
    
    getArchivedSales: (params) => makeApiCall(dbAPI.getArchivedSales, params),
    restoreSale: (id) => makeApiCall(dbAPI.restoreSale, id),
    permanentDeleteSale: (id) => makeApiCall(dbAPI.permanentDeleteSale, id),
    
    getArchivedProjects: (params) => makeApiCall(dbAPI.getArchivedProjects, params),
    restoreProject: (id) => makeApiCall(dbAPI.restoreProject, id),
    permanentDeleteProject: (id) => makeApiCall(dbAPI.permanentDeleteProject, id),
    
    getArchivedUnits: (params) => makeApiCall(dbAPI.getArchivedUnits, params),
    restoreUnit: (id) => makeApiCall(dbAPI.restoreUnit, id),
    permanentDeleteUnit: (id) => makeApiCall(dbAPI.permanentDeleteUnit, id),
    
    getArchivedDevelopers: (params) => makeApiCall(dbAPI.getArchivedDevelopers, params),
    restoreDeveloper: (id) => makeApiCall(dbAPI.restoreDeveloper, id),
    permanentDeleteDeveloper: (id) => makeApiCall(dbAPI.permanentDeleteDeveloper, id),
    permanentDeleteAllDevelopers: () => makeApiCall(dbAPI.permanentDeleteAllDevelopers),
    
    // Follow-ups Archive methods
    getArchivedFollowUps: (params) => makeApiCall(dbAPI.getArchivedFollowUps, params),
    restoreFollowUp: (id) => makeApiCall(dbAPI.restoreFollowUp, id),
    permanentDeleteFollowUp: (id) => makeApiCall(dbAPI.permanentDeleteFollowUp, id),
    permanentDeleteAllFollowUps: () => makeApiCall(dbAPI.permanentDeleteAllFollowUps),
    
    // Tasks Archive methods
    getArchivedTasks: (params) => makeApiCall(dbAPI.getArchivedTasks, params),
    restoreTask: (id) => makeApiCall(dbAPI.restoreTask, id),
    permanentDeleteTask: (id) => makeApiCall(dbAPI.permanentDeleteTask, id),
    permanentDeleteAllTasks: () => makeApiCall(dbAPI.permanentDeleteAllTasks),
    
    // Reminders Archive methods
    getArchivedReminders: (params) => makeApiCall(dbAPI.getArchivedReminders, params),
    restoreReminder: (id) => makeApiCall(dbAPI.restoreReminder, id),
    permanentDeleteReminder: (id) => makeApiCall(dbAPI.permanentDeleteReminder, id),
    permanentDeleteAllReminders: () => makeApiCall(dbAPI.permanentDeleteAllReminders),
    
    // Leads methods
    getLeads: (params) => makeApiCall(dbAPI.getLeads, params),
    getLeadById: (id) => makeApiCall(dbAPI.getLeadById, id),
    addLead: (data) => makeApiCall(dbAPI.addLead, data),
    updateLead: (id, data) => makeApiCall(dbAPI.updateLead, id, data),
    deleteLead: (id) => makeApiCall(dbAPI.deleteLead, id),
    convertLeadToClient: (id) => makeApiCall(dbAPI.convertLeadToClient, id),
    getLeadStats: () => makeApiCall(dbAPI.getLeadStats),
    
    // Projects methods
    getProjects: (params) => makeApiCall(dbAPI.getProjects, params),
    getProjectById: (id) => makeApiCall(dbAPI.getProjectById, id),
    addProject: (data) => makeApiCall(dbAPI.addProject, data),
    updateProject: (id, data) => makeApiCall(dbAPI.updateProject, id, data),
    deleteProject: (id) => makeApiCall(dbAPI.deleteProject, id),
    getProjectStats: () => makeApiCall(dbAPI.getProjectStats),
    
    // Sales methods
    getSales: (params) => makeApiCall(dbAPI.getSales, params),
    getSaleById: (id) => makeApiCall(dbAPI.getSaleById, id),
    addSale: (data) => makeApiCall(dbAPI.addSale, data),
    updateSale: (id, data) => makeApiCall(dbAPI.updateSale, id, data),
    deleteSale: (id) => makeApiCall(dbAPI.deleteSale, id),
    getSalesStats: (params) => makeApiCall(dbAPI.getSalesStats, params),
    
    // Tasks methods
    getTasks: (params) => makeApiCall(dbAPI.getTasks, params),
    getMyTasks: (params) => makeApiCall(dbAPI.getMyTasks, params),
    getTaskById: (id) => makeApiCall(dbAPI.getTaskById, id),
    addTask: (data) => makeApiCall(dbAPI.addTask, data),
    updateTask: (id, data) => makeApiCall(dbAPI.updateTask, id, data),
    deleteTask: (id) => makeApiCall(dbAPI.deleteTask, id),
    getTaskStats: (params) => makeApiCall(dbAPI.getTaskStats, params),
    
    // Notes methods
    getNotes: (itemType, itemId, params = {}) => makeApiCall(dbAPI.getNotes, itemType, itemId, params),
    addNote: (data) => makeApiCall(dbAPI.addNote, data),
    updateNote: (id, data) => makeApiCall(dbAPI.updateNote, id, data),
    deleteNote: (id) => makeApiCall(dbAPI.deleteNote, id),
    
    // User Notifications methods
    getUserNotifications: (params) => makeApiCall(dbAPI.getUserNotifications, params),
    getUnreadNotificationsCount: () => makeApiCall(dbAPI.getUnreadNotificationsCount),
    markNotificationsAsRead: (notificationIds) => makeApiCall(dbAPI.markNotificationsAsRead, notificationIds),
    clearAllNotifications: () => makeApiCall(dbAPI.clearAllNotifications),
    
    // Interactions methods
    getInteractions: (params) => makeApiCall(dbAPI.getInteractions, params),
    addInteraction: (data) => makeApiCall(dbAPI.addInteraction, data),
    updateInteraction: (id, data) => makeApiCall(dbAPI.updateInteraction, id, data),
    deleteInteraction: (id) => makeApiCall(dbAPI.deleteInteraction, id),
    
    // Follow-ups methods
    getFollowUps: (params) => makeApiCall(dbAPI.getFollowUps, params),
    getFollowUpById: (id) => makeApiCall(dbAPI.followUpsAPI.getFollowUpById, id),
    createFollowUp: (data) => makeApiCall(dbAPI.createFollowUp, data),
    updateFollowUp: (id, data) => makeApiCall(dbAPI.updateFollowUp, id, data),
    deleteFollowUp: (id) => makeApiCall(dbAPI.deleteFollowUp, id),
    completeFollowUp: (id, data) => makeApiCall(dbAPI.completeFollowUp, id, data),
    getTodayFollowUps: () => makeApiCall(dbAPI.getTodayFollowUps),
    getFollowUpStats: (params) => makeApiCall(dbAPI.getFollowUpStats, params),
    getDueFollowUps: (params) => makeApiCall(dbAPI.getDueFollowUps, params),
    getOverdueFollowUps: (params) => makeApiCall(dbAPI.getOverdueFollowUps, params),

    // Developers methods
    getDevelopers: (params) => makeApiCall(dbAPI.getDevelopers, params),
    addDeveloper: (data) => makeApiCall(dbAPI.addDeveloper, data),
    updateDeveloper: (id, data) => makeApiCall(dbAPI.updateDeveloper, id, data),
    deleteDeveloper: (id) => makeApiCall(dbAPI.deleteDeveloper, id),

    // Units methods
    getUnits: (params) => makeApiCall(dbAPI.getUnits, params),
    addUnit: (data) => makeApiCall(dbAPI.addUnit, data),
    updateUnit: (id, data) => makeApiCall(dbAPI.updateUnit, id, data),
    deleteUnit: (id) => makeApiCall(dbAPI.deleteUnit, id),

    // Reminders methods
    getReminders: (params) => makeApiCall(dbAPI.getReminders, params),
    addReminder: (data) => makeApiCall(dbAPI.addReminder, data),
    updateReminder: (id, data) => makeApiCall(dbAPI.updateReminder, id, data),
    deleteReminder: (id) => makeApiCall(dbAPI.deleteReminder, id),
    markReminderAsDone: (id) => makeApiCall(dbAPI.markReminderAsDone, id),
    getReminderStats: () => makeApiCall(dbAPI.getReminderStats),
    getRemindersStats: () => makeApiCall(dbAPI.getRemindersStats),

    // Projects methods
    getProjects: (params) => makeApiCall(dbAPI.getProjects, params),
    addProject: (data) => makeApiCall(dbAPI.addProject, data),
    updateProject: (id, data) => makeApiCall(dbAPI.updateProject, id, data),
    deleteProject: (id) => makeApiCall(dbAPI.deleteProject, id),

    // Units methods
    getUnits: (params) => makeApiCall(dbAPI.getUnits, params),
    addUnit: (data) => makeApiCall(dbAPI.addUnit, data),
    updateUnit: (id, data) => makeApiCall(dbAPI.updateUnit, id, data),
    deleteUnit: (id) => makeApiCall(dbAPI.deleteUnit, id),

    // Sales methods
    getSales: (params) => makeApiCall(dbAPI.getSales, params),
    addSale: (data) => makeApiCall(dbAPI.addSale, data),
    updateSale: (id, data) => makeApiCall(dbAPI.updateSale, id, data),
    deleteSale: (id) => makeApiCall(dbAPI.deleteSale, id),

    // Tasks methods
    getTasks: (params) => makeApiCall(dbAPI.getTasks, params),
    addTask: (data) => makeApiCall(dbAPI.addTask, data),
    updateTask: (id, data) => makeApiCall(dbAPI.updateTask, id, data),
    deleteTask: (id) => makeApiCall(dbAPI.deleteTask, id),

    // Note: Reminder methods are already defined above

    // Users methods
    getUsers: (params) => makeApiCall(dbAPI.getUsers, params),
    getUserById: (id) => makeApiCall(dbAPI.getUserById, id),
    addUser: (data) => makeApiCall(dbAPI.addUser, data),
    updateUser: (id, data) => makeApiCall(dbAPI.updateUser, id, data),
    deleteUser: (id) => makeApiCall(dbAPI.deleteUser, id),
    updateUserStatus: (id, status) => makeApiCall(dbAPI.updateUserStatus, id, status),
    
    // Combined stats
    getStats: () => makeApiCall(dbAPI.getStats),
    getManagerStats: () => makeApiCall(dbAPI.getManagerStats),
    getActivityFeed: (params) => makeApiCall(dbAPI.getActivityFeed, params)
  }
}

// Hook for data fetching with loading states
export const useApiData = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction()
      setData(result)
    } catch (err) {
      setError(err.message)
      console.error('useApiData error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return {
    data,
    loading,
    error,
    refetch: fetchData
  }
}

// Hook for paginated data
export const usePaginatedApi = (apiFunction, initialParams = {}) => {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [params, setParams] = useState(initialParams)

  const fetchData = async (newParams = params) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(newParams)
      setData(result.data || [])
      setPagination(result.pagination || {})
      setParams(newParams)
    } catch (err) {
      setError(err.message)
      console.error('usePaginatedApi error:', err)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateParams = (newParams) => {
    const updatedParams = { ...params, ...newParams }
    fetchData(updatedParams)
  }

  const nextPage = () => {
    if (pagination.hasNextPage) {
      updateParams({ page: pagination.currentPage + 1 })
    }
  }

  const prevPage = () => {
    if (pagination.hasPrevPage) {
      updateParams({ page: pagination.currentPage - 1 })
    }
  }

  const goToPage = (page) => {
    updateParams({ page })
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    pagination,
    loading,
    error,
    params,
    updateParams,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchData(params)
  }
}
