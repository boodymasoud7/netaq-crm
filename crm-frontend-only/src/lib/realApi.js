// Real Backend API Integration
// اتصال حقيقي بـ Backend APIs

console.log('🚀 Loading Real Backend API Integration!')

// Configuration
const API_CONFIG = {
  mode: 'full-stack',
  baseURL: 'http://localhost:8000/api',
  enableMockData: false, // Using real backend only
  hasBackend: true // Real backend is available
}

// Development user switching - use current logged in user
const getDevUser = () => {
  if (process.env.NODE_ENV === 'development') {
    // First try to get from devUser override (for manual switching)
    const devUserOverride = localStorage.getItem('devUser');
    if (devUserOverride) {
      return devUserOverride;
    }
    
    // Otherwise use the actual logged in user
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('🔍 Using current logged user ID:', user.id);
        return user.id.toString();
      }
    } catch (error) {
      console.warn('Error parsing user data:', error);
    }
    
    // Fallback to admin only if no user is logged in
    return '46';
  }
  return null;
};

// Development utilities
window.switchToUser = (userId) => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('devUser', userId.toString());
    console.log(`🔄 Switched to user ${userId}. Reload page to see changes.`);
  }
};

window.showCurrentUser = () => {
  const devUser = getDevUser();
  const users = {
    46: 'Admin (المدير الرئيسي)',
    47: 'Sales (omayma)', 
    48: 'Sales (esraa)',
    49: 'Sales Manager (maged)'
  };
  console.log(`👤 Current user: ${users[devUser] || 'Unknown'} (ID: ${devUser})`);
  console.log('Available users:', users);
  console.log('Switch with: switchToUser(48) for sales user');
};

// Show current user on load in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    console.log('🔧 Development Mode - User Switching Available');
    window.showCurrentUser();
  }, 1000);
}

// Utility function for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken')
  const devUser = getDevUser();
  
  // Add devUser parameter for development
  let fullEndpoint = endpoint;
  if (devUser) {
    const separator = fullEndpoint.includes('?') ? '&' : '?';
    fullEndpoint += `${separator}devUser=${devUser}`;
    console.log(`🔧 API Call as user ${devUser}:`, fullEndpoint);
  }
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(devUser && { 'X-Dev-User-Id': devUser })
    }
  }

  // Handle query parameters for GET requests
  let url = `${API_CONFIG.baseURL}${fullEndpoint}`
  if (options.params && Object.keys(options.params).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}${searchParams.toString()}`
  }

  // Remove params from options to avoid sending them in the request body
  const { params, ...restOptions } = options

  const finalOptions = {
    ...defaultOptions,
    ...restOptions,
    headers: {
      ...defaultOptions.headers,
      ...restOptions.headers
    }
  }
  
  try {
    const response = await fetch(url, finalOptions)
    
      if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    // Only log errors in development and if it's not a 404 (backend not available)
    if (process.env.NODE_ENV === 'development' && response.status !== 404) {
      console.error(`API Error Details [${endpoint}]:`)
      console.error('Status:', response.status, response.statusText)
      console.error('Error Data:', errorData)
      console.error('Request URL:', url)
      console.error('Request Body:', finalOptions.body)
      console.error('Request Headers:', finalOptions.headers)
    }
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }
    
    return await response.json()
  } catch (error) {
    // Only log errors in development and if it's not a network error (backend not available)
    if (process.env.NODE_ENV === 'development' && !error.message.includes('fetch')) {
      console.error(`API Error [${endpoint}]:`, error)
    }
    throw error
  }
}

// Real Authentication API
export const authAPI = {
  login: async (email, password) => {
    console.log('🔐 Real authAPI.login called:', { email })
    
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    if (response.token && response.user) {
      localStorage.setItem('authToken', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      console.log('✅ Login successful, token and user saved to localStorage')
    }
    
    return response
  },

  logout: async () => {
    console.log('🚪 Real logout')
    
    try {
      await apiCall('/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('Logout API call failed, proceeding with local cleanup')
    }
    
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    return { success: true }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiCall('/auth/me')
      return response.user
    } catch (error) {
      // If API fails, try to get from localStorage
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
  },

  updateProfile: async (profileData) => {
    console.log('👤 Updating profile')
    return await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  },

  changePassword: async (oldPassword, newPassword) => {
    console.log('🔐 Changing password')
    return await apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword })
    })
  }
}

// Real Database API
export const dbAPI = {
  // Clients
  getClients: async (params = {}) => {
    console.log('📋 Getting clients from backend')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/clients${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  getClientById: async (id) => {
    console.log('📋 Getting client by ID:', id)
    return await apiCall(`/clients/${id}`)
  },

  addClient: async (clientData) => {
    console.log('➕ Adding client:', clientData.name)
    return await apiCall('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    })
  },

  updateClient: async (id, data) => {
    console.log('✏️ Updating client:', id)
    return await apiCall(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteClient: async (id) => {
    console.log('🗑️ Deleting client (soft delete):', id)
    return await apiCall(`/clients/${id}`, { method: 'DELETE' })
  },

  // === ARCHIVE APIs ===
  getArchivedClients: async (params = {}) => {
    console.log('📁 Getting archived clients:', params)
    return await apiCall('/clients/archive', {
      method: 'GET',
      params
    })
  },

  restoreClient: async (id) => {
    console.log('♻️ Restoring client:', id)
    return await apiCall(`/clients/${id}/restore`, {
      method: 'PATCH'
    })
  },

  permanentDeleteClient: async (id) => {
    console.log('⚠️ Permanently deleting client:', id)
    return await apiCall(`/clients/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllClients: async () => {
    console.log('⚠️ Permanently deleting all archived clients')
    return await apiCall('/clients/archive/all', {
      method: 'DELETE'
    })
  },

  // === LEADS ARCHIVE APIs ===
  getArchivedLeads: async (params = {}) => {
    console.log('📁 Getting archived leads:', params)
    return await apiCall('/leads/archive', {
      method: 'GET',
      params
    })
  },

  restoreLead: async (id) => {
    console.log('♻️ Restoring lead:', id)
    return await apiCall(`/leads/${id}/restore`, {
      method: 'PATCH'
    })
  },

  permanentDeleteLead: async (id) => {
    console.log('⚠️ Permanently deleting lead:', id)
    return await apiCall(`/leads/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllLeads: async () => {
    console.log('⚠️ Permanently deleting all archived leads')
    return await apiCall('/leads/archive/all', {
      method: 'DELETE'
    })
  },

  // === SALES ARCHIVE APIs ===
  getArchivedSales: async (params = {}) => {
    console.log('📁 Getting archived sales:', params)
    return await apiCall('/sales/archive', {
      method: 'GET',
      params
    })
  },

  restoreSale: async (id) => {
    console.log('♻️ Restoring sale:', id)
    return await apiCall(`/sales/${id}/restore`, {
      method: 'PATCH'
    })
  },

  permanentDeleteSale: async (id) => {
    console.log('⚠️ Permanently deleting sale:', id)
    return await apiCall(`/sales/${id}/permanent`, {
      method: 'DELETE'
    })
  },

  // === PROJECTS ARCHIVE APIs ===
  getArchivedProjects: async (params = {}) => {
    console.log('📁 Getting archived projects:', params)
    return await apiCall('/projects/archive', {
      method: 'GET',
      params
    })
  },

  restoreProject: async (id) => {
    console.log('♻️ Restoring project:', id)
    return await apiCall(`/projects/${id}/restore`, {
      method: 'PATCH'
    })
  },

  permanentDeleteProject: async (id) => {
    console.log('⚠️ Permanently deleting project:', id)
    return await apiCall(`/projects/${id}/permanent`, {
      method: 'DELETE'
    })
  },

  // === UNITS ARCHIVE APIs ===
  getArchivedUnits: async (params = {}) => {
    console.log('📁 Getting archived units:', params)
    return await apiCall('/units/archive', {
      method: 'GET',
      params
    })
  },

  restoreUnit: async (id) => {
    console.log('♻️ Restoring unit:', id)
    return await apiCall(`/units/${id}/restore`, {
      method: 'PATCH'
    })
  },

  permanentDeleteUnit: async (id) => {
    console.log('⚠️ Permanently deleting unit:', id)
    return await apiCall(`/units/${id}/permanent`, {
      method: 'DELETE'
    })
  },

  // === DEVELOPERS ARCHIVE APIs ===
  getArchivedDevelopers: async (params = {}) => {
    console.log('📁 Getting archived developers:', params)
    return await apiCall('/developers/archive', {
      method: 'GET',
      params
    })
  },

  restoreDeveloper: async (id) => {
    console.log('♻️ Restoring developer:', id)
    console.log('📡 Making PATCH request to:', `/developers/${id}/restore`)
    const response = await apiCall(`/developers/${id}/restore`, {
      method: 'PATCH'
    })
    console.log('✅ Restore API response:', response)
    return response
  },

  permanentDeleteDeveloper: async (id) => {
    console.log('⚠️ Permanently deleting developer:', id)
    return await apiCall(`/developers/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllDevelopers: async () => {
    console.log('⚠️ Permanently deleting all archived developers')
    return await apiCall('/developers/archive/all', {
      method: 'DELETE'
    })
  },

  getClientStats: async () => {
    console.log('📊 Getting client statistics')
    return await apiCall('/clients/stats')
  },

  // Leads
  getLeads: async (params = {}) => {
    console.log('🎯 Getting leads from backend')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/leads${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  getLeadById: async (id) => {
    console.log('🎯 Getting lead by ID:', id)
    return await apiCall(`/leads/${id}`)
  },

  addLead: async (leadData) => {
    console.log('➕ Adding lead:', leadData.name)
    return await apiCall('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    })
  },

  updateLead: async (id, data) => {
    console.log('✏️ Updating lead:', id)
    return await apiCall(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteLead: async (id) => {
    console.log('🗑️ Deleting lead:', id)
    return await apiCall(`/leads/${id}`, { method: 'DELETE' })
  },

  // === NOTES API ===
  getNotes: async (params = {}) => {
    // تقليل الـ logs المتكررة - فقط عند الحاجة للتشخيص
    // console.log('📝 getNotes called with params:', params)
    const searchParams = new URLSearchParams(params).toString()
    return await apiCall(`/notes?${searchParams}`)
  },

  addNote: async (noteData) => {
    console.log('➕ Adding note:', noteData.content?.substring(0, 50) + '...')
    return await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    })
  },

  updateNote: async (id, data) => {
    console.log('✏️ Updating note:', id)
    return await apiCall(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteNote: async (id) => {
    console.log('🗑️ Deleting note:', id)
    return await apiCall(`/notes/${id}`, {
      method: 'DELETE'
    })
  },

  convertLeadToClient: async (id) => {
    console.log('🔄 Converting lead to client:', id)
    return await apiCall(`/leads/${id}/convert`, { method: 'POST' })
  },

  getLeadStats: async () => {
    console.log('📊 Getting lead statistics')
    return await apiCall('/leads/stats')
  },

  // Projects
  getProjects: async (params = {}) => {
    console.log('🏗️ Getting projects from backend')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/projects${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  getProjectById: async (id) => {
    console.log('🏗️ Getting project by ID:', id)
    return await apiCall(`/projects/${id}`)
  },

  addProject: async (projectData) => {
    console.log('➕ Adding project:', projectData.name)
    return await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
  },

  updateProject: async (id, data) => {
    console.log('✏️ Updating project:', id)
    return await apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteProject: async (id) => {
    console.log('🗑️ Deleting project:', id)
    return await apiCall(`/projects/${id}`, { method: 'DELETE' })
  },

  getProjectStats: async () => {
    console.log('📊 Getting project statistics')
    return await apiCall('/projects/stats')
  },

  // Sales
  getSales: async (params = {}) => {
    console.log('💰 Getting sales from backend')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/sales${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  getSaleById: async (id) => {
    console.log('💰 Getting sale by ID:', id)
    return await apiCall(`/sales/${id}`)
  },

  addSale: async (saleData) => {
    console.log('➕ Adding sale:', saleData)
    return await apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    })
  },

  updateSale: async (id, data) => {
    console.log('✏️ Updating sale:', id)
    return await apiCall(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteSale: async (id) => {
    console.log('🗑️ Deleting sale:', id)
    return await apiCall(`/sales/${id}`, { method: 'DELETE' })
  },

  getSalesStats: async (params = {}) => {
    console.log('📊 Getting sales statistics')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/sales/stats${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  // Tasks
  getTasks: async (params = {}) => {
    console.log('✅ Getting tasks from backend')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  getMyTasks: async (params = {}) => {
    console.log('✅ Getting my tasks')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/tasks/my${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  getTaskById: async (id) => {
    console.log('✅ Getting task by ID:', id)
    return await apiCall(`/tasks/${id}`)
  },

  addTask: async (taskData) => {
    console.log('➕ Adding task:', taskData.title)
    return await apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    })
  },

  updateTask: async (id, data) => {
    console.log('✏️ Updating task:', id)
    return await apiCall(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteTask: async (id) => {
    console.log('🗑️ Deleting task:', id)
    return await apiCall(`/tasks/${id}`, { method: 'DELETE' })
  },

  getTaskStats: async (params = {}) => {
    console.log('📊 Getting task statistics')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/tasks/stats${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  // Statistics (Combined)
  getStats: async () => {
    console.log('📊 Getting combined statistics')
    
    try {
      const [clientStats, leadStats, projectStats, salesStats, taskStats] = await Promise.all([
        apiCall('/clients/stats'),
        apiCall('/leads/stats'),
        apiCall('/projects/stats'),
        apiCall('/sales/stats'),
        apiCall('/tasks/stats')
      ])

      return {
        clients: clientStats.data,
        leads: leadStats.data,
        projects: projectStats.data,
        sales: salesStats.data,
        tasks: taskStats.data
      }
    } catch (error) {
      console.error('Error getting combined stats:', error)
      throw error
    }
  },

  // Manager Statistics (Enhanced for ManagerDashboard)
  getManagerStats: async () => {
    console.log('📊 Getting manager-level statistics from backend API')
    
    try {
      // Try to use the new backend manager stats API first
      const response = await apiCall('/stats/manager')
      
      console.log('📊 Manager Stats Backend Response:', response)
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      } else {
        throw new Error('Invalid manager stats response from backend')
      }
    } catch (backendError) {
      console.error('❌ Backend manager stats failed, using fallback:', backendError)
      
      try {
        // Fallback: Get all the data needed for manager dashboard
        const [clientsRes, leadsRes, salesRes, projectsRes, tasksRes, usersRes] = await Promise.all([
          apiCall('/clients?limit=1000'),
          apiCall('/leads?limit=1000'),
          apiCall('/sales?limit=1000'),
          apiCall('/projects?limit=1000'),
          apiCall('/tasks?limit=1000'),
          apiCall('/users?limit=1000')
        ])

      const clients = clientsRes.data || []
      const leads = leadsRes.data || []
      const sales = salesRes.data || []
      const projects = projectsRes.data || []
      const tasks = tasksRes.data || []
      const users = usersRes.data || []

      // Calculate comprehensive statistics
      const today = new Date()
      const todayStr = today.toDateString()

      const stats = {
        // Basic counts
        totalClients: clients.length,
        totalLeads: leads.length,
        totalSales: sales.length,
        totalProjects: projects.length,
        totalTasks: tasks.length,
        totalEmployees: users.filter(u => ['sales', 'sales_agent', 'sales_manager'].includes(u.role)).length,
        
        // Today's activities
        todayLeads: leads.filter(l => new Date(l.createdAt).toDateString() === todayStr).length,
        todayConversions: leads.filter(l => 
          (l.status === 'محول' || l.status === 'converted') &&
          new Date(l.updatedAt).toDateString() === todayStr
        ).length,
        todaySales: sales.filter(s => new Date(s.createdAt).toDateString() === todayStr).length,
        
        // Performance metrics
        conversionRate: leads.length > 0 ? 
          ((leads.filter(l => l.status === 'محول' || l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0,
        
        totalRevenue: sales.reduce((sum, sale) => sum + (parseFloat(sale.amount) || parseFloat(sale.totalAmount) || 0), 0),
        
        hotLeads: leads.filter(l => 
          l.priority === 'high' || 
          l.status === 'hot' || 
          l.status === 'ساخن' ||
          (l.budget && parseInt(l.budget) > 1000000)
        ).length,

        // Task statistics
        completedTasks: tasks.filter(t => t.status === 'completed' || t.status === 'مكتملة').length,
        pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'قيد الانتظار').length,
        
        // Project statistics
        activeProjects: projects.filter(p => p.status === 'active' || p.status === 'نشط').length,
        completedProjects: projects.filter(p => p.status === 'completed' || p.status === 'مكتمل').length
      }

        return {
          success: true,
          data: {
            stats,
            clients,
            leads,
            sales,
            projects,
            tasks,
            users
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        throw fallbackError
      }
    }
  },

  // Activity Feed for Real-time Monitor
  getActivityFeed: async (params = {}) => {
    console.log('📊 Getting activity feed from backend API')
    
    try {
      // Use the new backend activity feed API
      const queryParams = new URLSearchParams(params).toString()
      const response = await apiCall(`/stats/activity-feed${queryParams ? '?' + queryParams : ''}`)
      
      console.log('📊 Activity Feed Backend Response:', response)
      
      return {
        success: true,
        data: response.data || {}
      }
    } catch (error) {
      console.error('❌ Error getting activity feed:', error)
      return {
        success: false,
        data: { activities: [] },
        error: error.message
      }
    }
  },

  // Fallback Activity Feed (if backend fails)
  getActivityFeedFallback: async (params = {}) => {
    console.log('📊 Getting activity feed (fallback)')
    
    try {
      // Get recent activities from multiple sources + users for mapping
      const [clientsRes, leadsRes, salesRes, projectsRes, tasksRes, usersRes] = await Promise.all([
        apiCall('/clients?limit=10&sort=createdAt:desc'),
        apiCall('/leads?limit=10&sort=createdAt:desc'),
        apiCall('/sales?limit=10&sort=createdAt:desc'),
        apiCall('/projects?limit=10&sort=createdAt:desc'),
        apiCall('/tasks?limit=10&sort=createdAt:desc'),
        apiCall('/users?limit=100')
      ])

      // Create user mapping for ID to name conversion
      const userMap = {}
      if (usersRes.data) {
        usersRes.data.forEach(user => {
          userMap[user.id] = user.name
          userMap[String(user.id)] = user.name
        })
        console.log('👥 User mapping created:', userMap)
      } else {
        console.warn('👥 No users data available for mapping')
      }

      const activities = []

      // Process clients
      if (clientsRes.data) {
        clientsRes.data.forEach(client => {
          const userName = userMap[client.assignedTo] || userMap[client.createdBy] || 'النظام'
          activities.push({
            id: `client-${client.id}`,
            type: 'client',
            action: 'created',
            title: `عميل جديد: ${client.name}`,
            description: `تم إضافة عميل جديد - ${client.phone || 'بدون رقم'}`,
            timestamp: client.createdAt,
            user: userName,
            data: client
          })
        })
      }

      // Process leads
      if (leadsRes.data) {
        leadsRes.data.forEach(lead => {
          const userName = userMap[lead.assignedTo] || userMap[lead.createdBy] || 'النظام'
          activities.push({
            id: `lead-${lead.id}`,
            type: 'lead',
            action: 'created',
            title: `عميل محتمل جديد: ${lead.name}`,
            description: `تم إضافة عميل محتمل - ${lead.status || 'جديد'}`,
            timestamp: lead.createdAt,
            user: userName,
            data: lead
          })
        })
      }

      // Process sales
      if (salesRes.data) {
        salesRes.data.forEach(sale => {
          const userName = userMap[sale.salesPersonId] || userMap[sale.assignedTo] || userMap[sale.createdBy] || sale.salesPerson || 'النظام'
          activities.push({
            id: `sale-${sale.id}`,
            type: 'sale',
            action: 'created',
            title: `مبيعة جديدة: ${sale.clientName || 'عميل'}`,
            description: `تم إنجاز مبيعة بقيمة ${sale.totalAmount || sale.amount || 0} جنيه`,
            timestamp: sale.createdAt,
            user: userName,
            data: sale
          })
        })
      }

      // Process projects
      if (projectsRes.data) {
        projectsRes.data.forEach(project => {
          const userName = userMap[project.assignedTo] || userMap[project.createdBy] || 'النظام'
          activities.push({
            id: `project-${project.id}`,
            type: 'project',
            action: 'created',
            title: `مشروع جديد: ${project.name}`,
            description: `تم إنشاء مشروع جديد - ${project.status || 'نشط'}`,
            timestamp: project.createdAt,
            user: userName,
            data: project
          })
        })
      }

      // Process tasks
      if (tasksRes.data) {
        tasksRes.data.forEach(task => {
          const userName = userMap[task.assignedTo] || userMap[task.createdBy] || 'النظام'
          activities.push({
            id: `task-${task.id}`,
            type: 'task',
            action: 'created',
            title: `مهمة جديدة: ${task.title}`,
            description: `تم إضافة مهمة - ${task.status || 'قيد الانتظار'}`,
            timestamp: task.createdAt,
            user: userName,
            data: task
          })
        })
      }

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return {
        success: true,
        data: activities.slice(0, params.limit || 20)
      }
    } catch (error) {
      console.error('❌ Error getting activity feed:', error)
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  },

  // Users (Admin only)
  getUsers: async (params = {}) => {
    console.log('👥 Getting users from backend')
    const queryString = new URLSearchParams(params).toString()
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`
    return await apiCall(endpoint)
  },

  addUser: async (userData) => {
    console.log('➕ Adding user:', userData.name)
    return await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  updateUser: async (id, data) => {
    console.log('✏️ Updating user:', id)
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteUser: async (id) => {
    console.log('🗑️ Deleting user:', id)
    return await apiCall(`/users/${id}`, { method: 'DELETE' })
  },

  // Reminders (will be implemented later)
  getReminders: async () => {
    console.log('⏰ Getting reminders from backend')
    const token = localStorage.getItem('authToken')
    const response = await fetch(`${API_CONFIG.baseURL}/reminders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    return result.data || []
  },

  addReminder: async (reminderData) => {
    console.log('➕ Adding reminder:', reminderData.title || reminderData.type)
    return await apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    })
  },

  updateReminder: async (id, data) => {
    console.log('✏️ Updating reminder:', id)
    return await apiCall(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteReminder: async (id) => {
    console.log('🗑️ Deleting reminder:', id)
    return await apiCall(`/reminders/${id}`, { method: 'DELETE' })
  },

  // === INTERACTIONS API ===
  getInteractions: async (params = {}) => {
    console.log('📋 Getting interactions:', params)
    const searchParams = new URLSearchParams(params).toString()
    return await apiCall(`/interactions?${searchParams}`)
  },

  addInteraction: async (interactionData) => {
    console.log('➕ Adding interaction:', interactionData.title)
    return await apiCall('/interactions', {
      method: 'POST',
      body: JSON.stringify(interactionData)
    })
  },

  updateInteraction: async (id, data) => {
    console.log('✏️ Updating interaction:', id)
    return await apiCall(`/interactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteInteraction: async (id) => {
    console.log('🗑️ Deleting interaction:', id)
    return await apiCall(`/interactions/${id}`, {
      method: 'DELETE'
    })
  },

  // === DEVELOPERS API ===
  getDevelopers: async (params = {}) => {
    console.log('🏢 Getting developers:', params)
    return await apiCall('/developers', {
      method: 'GET',
      params
    })
  },

  addDeveloper: async (developerData) => {
    console.log('➕ Adding developer:', developerData.name)
    return await apiCall('/developers', {
      method: 'POST',
      body: JSON.stringify(developerData)
    })
  },

  updateDeveloper: async (id, developerData) => {
    console.log('🔄 Updating developer:', id)
    return await apiCall(`/developers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(developerData)
    })
  },

  deleteDeveloper: async (id) => {
    console.log('🗑️ Deleting developer:', id)
    const response = await apiCall(`/developers/${id}`, {
      method: 'DELETE'
    })
    console.log('✅ Delete response:', response)
    return response
  },

  // === UNITS API ===
  getUnits: async (params = {}) => {
    console.log('🏠 Getting units:', params)
    return await apiCall('/units', {
      method: 'GET',
      params
    })
  },

  addUnit: async (data) => {
    console.log('➕ Adding unit:', data)
    return await apiCall('/units', {
      method: 'POST',
      body: data
    })
  },

  updateUnit: async (id, data) => {
    console.log('📝 Updating unit:', id, data)
    return await apiCall(`/units/${id}`, {
      method: 'PUT',
      body: data
    })
  },

  deleteUnit: async (id) => {
    console.log('🗑️ Deleting unit:', id)
    return await apiCall(`/units/${id}`, {
      method: 'DELETE'
    })
  },

  // === REMINDERS API ===
  getReminders: async (params = {}) => {
    console.log('⏰ Getting reminders:', params)
    return await apiCall('/reminders', {
      method: 'GET',
      params
    })
  },

  addReminder: async (data) => {
    console.log('➕ Adding reminder:', data)
    return await apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  updateReminder: async (id, data) => {
    console.log('📝 Updating reminder:', id, data)
    return await apiCall(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  deleteReminder: async (id) => {
    console.log('🗑️ Deleting reminder:', id)
    return await apiCall(`/reminders/${id}`, {
      method: 'DELETE'
    })
  },

  // === PROJECTS API ===
  getProjects: async (params = {}) => {
    console.log('🏗️ Getting projects:', params)
    return await apiCall('/projects', {
      method: 'GET',
      params
    })
  },

  addProject: async (projectData) => {
    console.log('➕ Adding project:', projectData.name)
    return await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
  },

  updateProject: async (id, projectData) => {
    console.log('🔄 Updating project:', id)
    return await apiCall(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    })
  },

  deleteProject: async (id) => {
    console.log('🗑️ Deleting project:', id)
    return await apiCall(`/projects/${id}`, {
      method: 'DELETE'
    })
  },

  // === UNITS API ===
  getUnits: async (params = {}) => {
    console.log('🏠 Getting units:', params)
    return await apiCall('/units', {
      method: 'GET',
      params
    })
  },

  addUnit: async (unitData) => {
    console.log('➕ Adding unit:', unitData.unitNumber)
    return await apiCall('/units', {
      method: 'POST',
      body: JSON.stringify(unitData)
    })
  },

  updateUnit: async (id, unitData) => {
    console.log('🔄 Updating unit:', id)
    return await apiCall(`/units/${id}`, {
      method: 'PUT',
      body: JSON.stringify(unitData)
    })
  },

  deleteUnit: async (id) => {
    console.log('🗑️ Deleting unit:', id)
    return await apiCall(`/units/${id}`, {
      method: 'DELETE'
    })
  },

  // === SALES API ===
  getSales: async (params = {}) => {
    console.log('💰 Getting sales:', params)
    return await apiCall('/sales', {
      method: 'GET',
      params
    })
  },

  addSale: async (saleData) => {
    console.log('➕ Adding sale:', saleData.clientName, '-', saleData.unitNumber)
    return await apiCall('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    })
  },

  updateSale: async (id, saleData) => {
    console.log('🔄 Updating sale:', id)
    return await apiCall(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData)
    })
  },

  deleteSale: async (id) => {
    console.log('🗑️ Deleting sale:', id)
    return await apiCall(`/sales/${id}`, {
      method: 'DELETE'
    })
  },

  // === TASKS API ===
  getTasks: async (params = {}) => {
    console.log('📋 Getting tasks:', params)
    return await apiCall('/tasks', {
      method: 'GET',
      params
    })
  },

  addTask: async (taskData) => {
    console.log('➕ Adding task:', taskData.title)
    return await apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    })
  },

  updateTask: async (id, taskData) => {
    console.log('🔄 Updating task:', id)
    return await apiCall(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    })
  },

  deleteTask: async (id) => {
    console.log('🗑️ Deleting task:', id)
    return await apiCall(`/tasks/${id}`, {
      method: 'DELETE'
    })
  },

  // === NEW REMINDERS API ===
  getReminders: async (params = {}) => {
    // Log only when there are specific parameters or in debug mode
    if (Object.keys(params).length > 0) {
      console.log('⏰ Getting reminders with params:', params)
    }
    return await apiCall('/reminders', {
      method: 'GET',
      params
    })
  },

  addReminder: async (reminderData) => {
    console.log('➕ Adding reminder:', reminderData)
    return await apiCall('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    })
  },

  updateReminder: async (id, reminderData) => {
    console.log('✏️ Updating reminder:', id, reminderData)
    return await apiCall(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reminderData)
    })
  },

  deleteReminder: async (id) => {
    console.log('🗑️ Deleting reminder:', id)
    return await apiCall(`/reminders/${id}`, {
      method: 'DELETE'
    })
  },

  markReminderAsDone: async (id) => {
    console.log('✅ Marking reminder as done:', id)
    return await apiCall(`/reminders/${id}/done`, {
      method: 'PATCH'
    })
  },

  getReminderStats: async () => {
    console.log('📊 Getting reminder stats')
    return await apiCall('/reminders/stats', {
      method: 'GET'
    })
  },

  getRemindersStats: async () => {
    console.log('📊 Getting reminders stats')
    return await apiCall('/reminders/stats', {
      method: 'GET'
    })
  },

  // === USERS API ===
  getUsers: async (params = {}) => {
    console.log('👥 Getting users:', params)
    return await apiCall('/users', {
      method: 'GET',
      params
    })
  },

  getUserById: async (id) => {
    console.log('👤 Getting user:', id)
    return await apiCall(`/users/${id}`, {
      method: 'GET'
    })
  },

  addUser: async (userData) => {
    console.log('➕ Adding user:', userData.name)
    return await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  updateUser: async (id, userData) => {
    console.log('🔄 Updating user:', id)
    return await apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  },

  deleteUser: async (id) => {
    console.log('🗑️ Deleting user:', id)
    return await apiCall(`/users/${id}`, {
      method: 'DELETE'
    })
  },

  updateUserStatus: async (id, status) => {
    console.log('🔄 Updating user status:', id, status)
    return await apiCall(`/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  },

  // === NOTES API ===
  getNotes: async (itemType, itemId, params = {}) => {
    console.log('📝 Getting notes for:', itemType, itemId)
    return await apiCall('/notes', {
      method: 'GET',
      params: { itemType, itemId, ...params }
    })
  },

  addNote: async (noteData) => {
    console.log('➕ Adding note:', noteData.title || noteData.content?.substring(0, 50))
    return await apiCall('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    })
  },

  updateNote: async (id, noteData) => {
    console.log('🔄 Updating note:', id)
    return await apiCall(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData)
    })
  },

  deleteNote: async (id) => {
    console.log('🗑️ Deleting note:', id)
    return await apiCall(`/notes/${id}`, {
      method: 'DELETE'
    })
  },

  // === USER NOTIFICATIONS API ===
  getUserNotifications: async (params = {}) => {
    console.log('🔔 Getting user notifications:', params)
    return await apiCall('/notifications', {
      method: 'GET',
      params: params
    })
  },

  getUnreadNotificationsCount: async () => {
    console.log('🔔 Getting unread notifications count')
    return await apiCall('/notifications/unread-count', {
      method: 'GET'
    })
  },

  markNotificationsAsRead: async (notificationIds) => {
    console.log('✅ Marking notifications as read:', notificationIds)
    return await apiCall('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify({ notificationIds })
    })
  },

  clearAllNotifications: async () => {
    console.log('🗑️ Clearing all user notifications')
    return await apiCall('/notifications/clear-all', {
      method: 'DELETE'
    })
  },

  // === BACKUP MANAGEMENT API ===
  getBackups: async (params = {}) => {
    console.log('💾 Getting backups:', params)
    return await apiCall('/backups', {
      method: 'GET',
      params: params
    })
  },

  createBackup: async (backupData) => {
    console.log('➕ Creating backup:', backupData.name)
    return await apiCall('/backups', {
      method: 'POST',
      body: JSON.stringify(backupData)
    })
  },

  restoreBackup: async (backupId) => {
    console.log('🔄 Restoring backup:', backupId)
    return await apiCall(`/backups/${backupId}/restore`, {
      method: 'POST'
    })
  },

  deleteBackup: async (backupId) => {
    console.log('🗑️ Deleting backup:', backupId)
    return await apiCall(`/backups/${backupId}`, {
      method: 'DELETE'
    })
  },

  downloadBackup: async (backupId) => {
    console.log('⬇️ Downloading backup:', backupId)
    return await apiCall(`/backups/${backupId}/download`, {
      method: 'GET'
    })
  },

  validateBackup: async (backupId) => {
    console.log('✅ Validating backup:', backupId)
    return await apiCall(`/backups/${backupId}/validate`, {
      method: 'POST'
    })
  },

  getBackupSettings: async () => {
    console.log('⚙️ Getting backup settings')
    return await apiCall('/backups/settings', {
      method: 'GET'
    })
  },

  updateBackupSettings: async (settings) => {
    console.log('⚙️ Updating backup settings:', settings)
    return await apiCall('/backups/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
  },

  getStorageInfo: async () => {
    console.log('💽 Getting storage info')
    return await apiCall('/backups/storage-info', {
      method: 'GET'
    })
  },

  // === GOOGLE DRIVE BACKUP API ===
  uploadToGoogleDrive: async (backupId) => {
    console.log('☁️ Uploading backup to Google Drive:', backupId)
    return await apiCall(`/backups/${backupId}/upload-to-drive`, {
      method: 'POST'
    })
  },

  listGoogleDriveBackups: async () => {
    console.log('☁️ Listing Google Drive backups')
    return await apiCall('/backups/google-drive', {
      method: 'GET'
    })
  },

  downloadFromGoogleDrive: async (driveFileId) => {
    console.log('☁️ Downloading backup from Google Drive:', driveFileId)
    return await apiCall(`/backups/google-drive/${driveFileId}/download`, {
      method: 'POST'
    })
  },

  deleteFromGoogleDrive: async (driveFileId) => {
    console.log('☁️ Deleting backup from Google Drive:', driveFileId)
    return await apiCall(`/backups/google-drive/${driveFileId}`, {
      method: 'DELETE'
    })
  },

  getGoogleDriveAuth: async () => {
    console.log('🔐 Getting Google Drive auth URL')
    return await apiCall('/backups/google-drive/auth', {
      method: 'GET'
    })
  },

  setGoogleDriveCredentials: async (credentials) => {
    console.log('🔐 Setting Google Drive credentials')
    return await apiCall('/backups/google-drive/credentials', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  },

  // Follow-ups methods
  getFollowUps: async (params = {}) => {
    console.log('📋 Getting follow-ups with params:', params)
    return await apiCall('/follow-ups', { params })
  },

  getTodayFollowUps: async (params = {}) => {
    console.log('📅 Getting today\'s follow-ups with params:', params)
    return await apiCall('/follow-ups/today', { params })
  },

  getFollowUpStats: async (params = {}) => {
    console.log('📊 Getting follow-up stats with params:', params)
    return await apiCall('/follow-ups/stats', { params })
  },

  // جلب المتابعات المستحقة (خلال 30 دقيقة)
  getDueFollowUps: async (params = {}) => {
    console.log('⏰ Getting due follow-ups with params:', params)
    return await apiCall('/follow-ups/due', { params })
  },

  // جلب المتابعات المتأخرة
  getOverdueFollowUps: async (params = {}) => {
    console.log('🚨 Getting overdue follow-ups with params:', params)
    return await apiCall('/follow-ups/overdue', { params })
  },

  createFollowUp: async (followUpData) => {
    console.log('➕ Creating new follow-up:', followUpData.title)
    return await apiCall('/follow-ups', {
      method: 'POST',
      body: JSON.stringify(followUpData)
    })
  },

  updateFollowUp: async (id, data) => {
    console.log('✏️ Updating follow-up:', id)
    return await apiCall(`/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  completeFollowUp: async (id, data) => {
    console.log('✅ Completing follow-up:', id)
    return await apiCall(`/follow-ups/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Removed duplicate deleteFollowUp - keeping the one below with better comments

  // استعادة متابعة محذوفة
  restoreFollowUp: async (id) => {
    console.log('♻️ Restoring follow-up:', id)
    return await apiCall(`/follow-ups/${id}/restore`, {
      method: 'POST'
    })
  },

  // حذف متابعة نهائياً
  permanentDeleteFollowUp: async (id) => {
    console.log('⚠️ Permanently deleting follow-up:', id)
    return await apiCall(`/follow-ups/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllFollowUps: async () => {
    console.log('⚠️ Permanently deleting all archived follow-ups')
    return await apiCall('/follow-ups/archive/all', {
      method: 'DELETE'
    })
  },

  // جلب المهام المأرشفة
  getArchivedTasks: async (params = {}) => {
    console.log('📦 Getting archived tasks with params:', params)
    return await apiCall('/tasks/archive', { params })
  },

  // استعادة مهمة محذوفة
  restoreTask: async (id) => {
    console.log('♻️ Restoring task:', id)
    return await apiCall(`/tasks/${id}/restore`, {
      method: 'POST'
    })
  },

  // حذف مهمة نهائياً
  permanentDeleteTask: async (id) => {
    console.log('⚠️ Permanently deleting task:', id)
    return await apiCall(`/tasks/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllTasks: async () => {
    console.log('⚠️ Permanently deleting all archived tasks')
    return await apiCall('/tasks/archive/all', {
      method: 'DELETE'
    })
  },

  // جلب التذكيرات المأرشفة
  getArchivedReminders: async (params = {}) => {
    console.log('📦 Getting archived reminders with params:', params)
    return await apiCall('/reminders/archived', { params })
  },

  // استعادة تذكير محذوف
  restoreReminder: async (id) => {
    console.log('♻️ Restoring reminder:', id)
    return await apiCall(`/reminders/${id}/restore`, {
      method: 'POST'
    })
  },

  // حذف تذكير نهائياً
  permanentDeleteReminder: async (id) => {
    console.log('⚠️ Permanently deleting reminder:', id)
    return await apiCall(`/reminders/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllReminders: async () => {
    console.log('⚠️ Permanently deleting all archived reminders')
    return await apiCall('/reminders/archive/all', {
      method: 'DELETE'
    })
  },

  // حذف متابعة (أرشفة)
  deleteFollowUp: async (id) => {
    console.log('🗑️ Archiving follow-up (soft delete):', id)
    return await apiCall(`/follow-ups/${id}`, {
      method: 'DELETE'
    })
  }
}

// Follow-ups API
const followUpsAPI = {
  // جلب كل المتابعات مع الفلترة
  getFollowUps: async (params = {}) => {
    console.log('📋 Getting follow-ups with params:', params)
    return await apiCall('/follow-ups', { params })
  },

  // جلب متابعات اليوم
  getTodayFollowUps: async (params = {}) => {
    console.log('📅 Getting today\'s follow-ups with params:', params)
    return await apiCall('/follow-ups/today', { params })
  },

  // جلب إحصائيات المتابعات
  getFollowUpStats: async (params = {}) => {
    console.log('📊 Getting follow-up statistics with params:', params)
    return await apiCall('/follow-ups/stats', { params })
  },

  // جلب المتابعات المستحقة (خلال 30 دقيقة)
  getDueFollowUps: async (params = {}) => {
    console.log('⏰ Getting due follow-ups with params:', params)
    return await apiCall('/follow-ups/due', { params })
  },

  // جلب المتابعات المتأخرة
  getOverdueFollowUps: async (params = {}) => {
    console.log('🚨 Getting overdue follow-ups with params:', params)
    return await apiCall('/follow-ups/overdue', { params })
  },

  // جلب متابعة واحدة بالمعرف
  getFollowUpById: async (id) => {
    console.log('🔍 Getting follow-up by ID:', id)
    return await apiCall(`/follow-ups/${id}`)
  },

  // إنشاء متابعة جديدة
  createFollowUp: async (followUpData) => {
    console.log('➕ Creating new follow-up:', followUpData.title)
    return await apiCall('/follow-ups', {
      method: 'POST',
      body: JSON.stringify(followUpData)
    })
  },

  // تحديث متابعة
  updateFollowUp: async (id, data) => {
    console.log('✏️ Updating follow-up:', id)
    return await apiCall(`/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },


  // جلب المتابعات المأرشفة
  getArchivedFollowUps: async (params = {}) => {
    console.log('📦 Getting archived follow-ups with params:', params)
    return await apiCall('/follow-ups/archived', { params })
  },

  // استعادة متابعة محذوفة
  restoreFollowUp: async (id) => {
    console.log('♻️ Restoring follow-up:', id)
    return await apiCall(`/follow-ups/${id}/restore`, {
      method: 'POST'
    })
  },

  // حذف متابعة نهائياً
  permanentDeleteFollowUp: async (id) => {
    console.log('⚠️ Permanently deleting follow-up:', id)
    return await apiCall(`/follow-ups/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllFollowUps: async () => {
    console.log('⚠️ Permanently deleting all archived follow-ups')
    return await apiCall('/follow-ups/archive/all', {
      method: 'DELETE'
    })
  },

  // جلب المهام المأرشفة
  getArchivedTasks: async (params = {}) => {
    console.log('📦 Getting archived tasks with params:', params)
    return await apiCall('/tasks/archive', { params })
  },

  // استعادة مهمة محذوفة
  restoreTask: async (id) => {
    console.log('♻️ Restoring task:', id)
    return await apiCall(`/tasks/${id}/restore`, {
      method: 'POST'
    })
  },

  // حذف مهمة نهائياً
  permanentDeleteTask: async (id) => {
    console.log('⚠️ Permanently deleting task:', id)
    return await apiCall(`/tasks/${id}/permanent`, {
      method: 'DELETE'
    })
  },
  permanentDeleteAllTasks: async () => {
    console.log('⚠️ Permanently deleting all archived tasks')
    return await apiCall('/tasks/archive/all', {
      method: 'DELETE'
    })
  },

  // جلب التذكيرات المأرشفة
  getArchivedReminders: async (params = {}) => {
    console.log('📦 Getting archived reminders with params:', params)
    return await apiCall('/reminders/archived', { params })
  },

  // استعادة تذكير محذوف
  restoreReminder: async (id) => {
    console.log('♻️ Restoring reminder:', id)
    return await apiCall(`/reminders/${id}/restore`, {
      method: 'POST'
    })
  },

  // حذف تذكير نهائياً
  permanentDeleteReminder: async (id) => {
    console.log('⚠️ Permanently deleting reminder:', id)
    return await apiCall(`/reminders/${id}/permanent`, {
      method: 'DELETE'
    })
  }
}

console.log('✅ Real Backend API loaded successfully!')

// Dashboard API
const dashboardAPI = {
  // Get optimized manager dashboard data
  getManagerDashboard: async () => {
    console.log('📊 Getting manager dashboard data');
    return await apiCall('/dashboard/manager');
  },

  // Get quick stats for header
  getQuickStats: async () => {
    console.log('⚡ Getting quick stats');
    return await apiCall('/dashboard/quick-stats');
  }
};

// Export API_CONFIG separately for direct access
export { API_CONFIG }

export default {
  authAPI,
  dbAPI,
  followUpsAPI,
  dashboardAPI,
  config: API_CONFIG
}
