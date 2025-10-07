// Frontend-Only API - No Backend Required
// جميع البيانات محلية (Mock Data) - لا يتم الاتصال بأي خادم

console.log('🚀 Loading Frontend-Only API - No Backend Required!')

// Configuration - Frontend Only
const API_CONFIG = {
  mode: 'frontend-only',
  enableMockData: true,
  noBackend: true
}

// Mock Authentication API - No Server Calls
export const authAPI = {
  login: async (email, password) => {
    console.log('🔐 Frontend-Only authAPI.login called:', { email, hasPassword: !!password })
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Available mock accounts
    const mockUsers = {
      'admin@example.com': {
        password: 'admin123',
        user: {
          uid: 'mock-admin-1',
          email: 'admin@example.com',
          displayName: 'المدير العام',
          role: 'admin',
          name: 'المدير العام',
          department: 'الإدارة',
          permissions: ['ALL_PERMISSIONS']
        }
      },
      'ahmed.samir@company.com': {
        password: 'sales123',
        user: {
          uid: 'mock-sales-manager-1',
          email: 'ahmed.samir@company.com',
          displayName: 'أحمد سمير',
          role: 'sales_manager',
          name: 'أحمد سمير',
          department: 'المبيعات'
        }
      },
      'sara.ahmed@company.com': {
        password: 'agent123',
        user: {
          uid: 'mock-sales-agent-1',
          email: 'sara.ahmed@company.com',
          displayName: 'سارة أحمد',
          role: 'sales_agent',
          name: 'سارة أحمد',
          department: 'المبيعات'
        }
      },
      'omar.hassan@company.com': {
        password: 'emp123',
        user: {
          uid: 'mock-employee-1',
          email: 'omar.hassan@company.com',
          displayName: 'عمر حسن',
          role: 'employee',
          name: 'عمر حسن',
          department: 'التطوير'
        }
      }
    }
    
    const mockAccount = mockUsers[email]
    
    if (!mockAccount) {
      throw new Error('البريد الإلكتروني غير صحيح')
    }
    
    if (password !== mockAccount.password) {
      throw new Error('كلمة المرور غير صحيحة')
    }
    
    // Store mock user in localStorage for persistence
    const authData = {
      token: `mock-jwt-token-${mockAccount.user.uid}`,
      user: mockAccount.user,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    
    localStorage.setItem('authToken', authData.token)
    localStorage.setItem('user', JSON.stringify(authData.user))
    
    console.log('✅ Frontend-Only login successful for:', mockAccount.user.name)
    
    return authData
  },

  logout: async () => {
    console.log('🚪 Frontend-Only logout')
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Clear localStorage
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    console.log('✅ Frontend-Only logout successful')
    
    return { message: 'تم تسجيل الخروج بنجاح' }
  },

  getCurrentUser: async () => {
    console.log('👤 Frontend-Only getCurrentUser')
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      throw new Error('المستخدم غير مسجل دخول')
    }
    
    const user = JSON.parse(userStr)
    
    console.log('✅ Frontend-Only getCurrentUser successful for:', user.name)
    
    return { user }
  },

  updateProfile: async (data) => {
    console.log('📝 Frontend-Only updateProfile:', data)
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const userStr = localStorage.getItem('user')
    
    if (!userStr) {
      throw new Error('المستخدم غير مسجل دخول')
    }
    
    const user = JSON.parse(userStr)
    const updatedUser = { ...user, ...data }
    
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    console.log('✅ Frontend-Only updateProfile successful')
    
    return { user: updatedUser }
  },

  changePassword: async (oldPassword, newPassword) => {
    console.log('🔒 Frontend-Only changePassword')
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // In a real mock, you'd validate the old password
    // For now, just simulate success
    
    console.log('✅ Frontend-Only changePassword successful')
    
    return { message: 'تم تغيير كلمة المرور بنجاح' }
  }
}

// Mock Database API - Placeholder for compatibility
export const dbAPI = {
  // Archive methods - Mock implementations
  getArchivedClients: async (params = {}) => {
    console.log('🎭 Mock getArchivedClients called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedLeads: async (params = {}) => {
    console.log('🎭 Mock getArchivedLeads called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedSales: async (params = {}) => {
    console.log('🎭 Mock getArchivedSales called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedProjects: async (params = {}) => {
    console.log('🎭 Mock getArchivedProjects called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedUnits: async (params = {}) => {
    console.log('🎭 Mock getArchivedUnits called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedDevelopers: async (params = {}) => {
    console.log('🎭 Mock getArchivedDevelopers called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedFollowUps: async (params = {}) => {
    console.log('🎭 Mock getArchivedFollowUps called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedTasks: async (params = {}) => {
    console.log('🎭 Mock getArchivedTasks called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  getArchivedReminders: async (params = {}) => {
    console.log('🎭 Mock getArchivedReminders called')
    return { data: [], pagination: { totalItems: 0 } }
  },
  
  // Restore methods
  restoreClient: async (id) => ({ success: true }),
  restoreLead: async (id) => ({ success: true }),
  restoreSale: async (id) => ({ success: true }),
  restoreProject: async (id) => ({ success: true }),
  restoreUnit: async (id) => ({ success: true }),
  restoreDeveloper: async (id) => ({ success: true }),
  restoreFollowUp: async (id) => ({ success: true }),
  restoreTask: async (id) => ({ success: true }),
  restoreReminder: async (id) => ({ success: true }),
  
  // Delete methods
  permanentDeleteClient: async (id) => ({ message: 'Deleted' }),
  permanentDeleteLead: async (id) => ({ message: 'Deleted' }),
  permanentDeleteSale: async (id) => ({ message: 'Deleted' }),
  permanentDeleteProject: async (id) => ({ message: 'Deleted' }),
  permanentDeleteUnit: async (id) => ({ message: 'Deleted' }),
  permanentDeleteDeveloper: async (id) => ({ message: 'Deleted' }),
  permanentDeleteFollowUp: async (id) => ({ message: 'Deleted' }),
  permanentDeleteTask: async (id) => ({ message: 'Deleted' }),
  permanentDeleteReminder: async (id) => ({ message: 'Deleted' }),
  
  // Bulk delete methods
  permanentDeleteAllClients: async () => ({ deletedCount: 0 }),
  permanentDeleteAllLeads: async () => ({ deletedCount: 0 }),
  permanentDeleteAllSales: async () => ({ deletedCount: 0 }),
  permanentDeleteAllProjects: async () => ({ deletedCount: 0 }),
  permanentDeleteAllUnits: async () => ({ deletedCount: 0 }),
  permanentDeleteAllDevelopers: async () => ({ deletedCount: 0 }),
  permanentDeleteAllFollowUps: async () => ({ deletedCount: 0 }),
  permanentDeleteAllTasks: async () => ({ deletedCount: 0 }),
  permanentDeleteAllReminders: async () => ({ deletedCount: 0 }),
  
  // Other methods - placeholders
  getClients: async () => ({ data: [], pagination: { totalItems: 0 } }),
  getLeads: async () => ({ data: [], pagination: { totalItems: 0 } }),
  getTasks: async () => ({ data: [], pagination: { totalItems: 0 } }),
  getClientById: async (id) => ({ data: null }),
  addClient: async (data) => ({ data: null }),
  updateClient: async (id, data) => ({ data: null }),
  deleteClient: async (id) => ({ success: true }),
  
  // Add more placeholder methods as needed...
}

// Export default for compatibility with apiSwitch.js
export default {
  authAPI,
  dbAPI,
  config: API_CONFIG
}