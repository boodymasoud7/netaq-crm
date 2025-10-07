import React, { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Plus, 
  Calendar,
  Clock,
  Filter,
  Search,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Flag,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowRight,
  Target,
  TrendingUp,
  Sparkles,
  Award,
  Download
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import LoadingPage from '../components/ui/loading'
import TaskModal from '../components/tasks/TaskModal'
import TaskDetailsModal from '../components/tasks/TaskDetailsModal'
import KanbanBoard from '../components/tasks/KanbanBoard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import useTasks from '../hooks/useTasks'
import { useApi } from '../hooks/useApi'
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import toast from 'react-hot-toast'

export default function Tasks() {
  const { currentUser, userProfile } = useAuth()
  const { isAdmin, filterByRole, checkPermission } = usePermissions()
  const api = useApi()
  const { tasks, loading, error, refetch } = useTasks()
  const { sendTaskAssignedNotification, sendTaskActionNotification } = useSSENotificationSender()
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [taskToView, setTaskToView] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('list')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  
  // إدارة التحديد المتعدد للمهام
  const [selectedTasks, setSelectedTasks] = useState([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  
  // Filter and date states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  })

  // Real data from backend
  const [leads, setLeads] = useState([])
  const [users, setUsers] = useState([])
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  // Fetch real data for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setDataLoading(true)
        
        const [leadsResponse, usersResponse, clientsResponse] = await Promise.allSettled([
          api.getLeads({ limit: 100 }),
          api.getUsers({ limit: 100 }),
          api.getClients({ limit: 100 })
        ])

        // Process leads
        if (leadsResponse.status === 'fulfilled' && leadsResponse.value?.data) {
          setLeads(leadsResponse.value.data.map(lead => ({
            id: lead.id,
            name: lead.name,
            assignedTo: lead.assignedTo
          })))
        }

        // Process users  
        if (usersResponse.status === 'fulfilled' && usersResponse.value?.data) {
          setUsers(usersResponse.value.data.map(user => ({
            id: user.id,
            displayName: user.name || user.displayName,
            email: user.email,
            role: user.role
          })))
        }

        // Process clients
        if (clientsResponse.status === 'fulfilled' && clientsResponse.value?.data) {
          setClients(clientsResponse.value.data.map(client => ({
            id: client.id,
            name: client.name,
            assignedTo: client.assignedTo
          })))
        }

      } catch (error) {
        console.error('Error fetching dropdown data:', error)
        toast.error('فشل في جلب بيانات العملاء والمستخدمين')
      } finally {
        setDataLoading(false)
      }
    }

    fetchDropdownData()
  }, [])

  // Calculate stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'done').length,
    overdue: tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'done') return false
      return t.dueDate && new Date(t.dueDate) < new Date()
    }).length,
    today: tasks.filter(t => {
      if (!t.dueDate) return false
      const today = new Date()
      const taskDate = new Date(t.dueDate)
      return taskDate.toDateString() === today.toDateString() && t.status !== 'done'
    }).length,
    highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
  }

  // Helper functions
  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status)
  }

  const handleTaskAdded = async (newTask) => {
    try {
      // إزالة الحقول التي لا يجب إرسالها للباك إند
      const { createdAt, updatedAt, id, ...taskData } = newTask
      
      await api.addTask(taskData)
      
      // إرسال إشعار للموظف المكلف بالمهمة
      if (taskData.assignedTo && taskData.assignedTo !== currentUser?.name) {
        try {
          // البحث عن البريد الإلكتروني للموظف المكلف
          const assignedUser = users.find(user => 
            user.displayName === taskData.assignedTo || 
            user.email === taskData.assignedTo ||
            user.id.toString() === taskData.assignedTo.toString()
          )
          
          const assignedToEmail = assignedUser?.email || ''
          
          console.log('🔍 البحث عن الموظف المكلف:', {
            assignedTo: taskData.assignedTo,
            foundUser: assignedUser,
            assignedToEmail: assignedToEmail
          })
          
          if (assignedToEmail) {
            await sendTaskAssignedNotification({
              title: taskData.title,
              id: Date.now(), // سيتم استبداله بـ ID الحقيقي من الباك إند
              assignedTo: taskData.assignedTo,
              assignedToEmail: assignedToEmail,
              priority: taskData.priority,
              dueDate: taskData.dueDate
            })
            console.log('✅ تم إرسال إشعار التكليف للبريد:', assignedToEmail)
          } else {
            console.warn('⚠️ لم يتم العثور على البريد الإلكتروني للموظف:', taskData.assignedTo)
          }
        } catch (notificationError) {
          console.warn('فشل في إرسال إشعار التكليف:', notificationError)
        }
      }
      
      await refetch() // Refresh the tasks list
      setShowAddModal(false)
      toast.success('تم إضافة المهمة بنجاح وإرسال إشعار للموظف!')
    } catch (error) {
      console.error('خطأ في إضافة المهمة:', error)
      toast.error('فشل في إضافة المهمة')
    }
  }

  const handleTaskUpdated = async (updatedTask) => {
    try {
      // تنظيف البيانات - إزالة الحقول التي لا يجب إرسالها للباك إند
      const { id, createdAt, updatedAt, ...cleanTaskData } = updatedTask
      
      const taskData = {
        ...cleanTaskData,
        // تعيين undefined للحقول الفارغة
        description: cleanTaskData.description?.trim() || undefined
      }
      
      console.log('🔄 Updating task with clean data:', taskData)
      
      await api.updateTask(updatedTask.id, taskData)
      await refetch() // Refresh the tasks list
      setSelectedTask(null)
      setShowDetailsModal(false) // Close details modal if open
      toast.success('تم تحديث المهمة بنجاح!')
    } catch (error) {
      console.error('خطأ في تحديث المهمة:', error)
      toast.error('فشل في تحديث المهمة')
    }
  }

  const handleTaskDeleted = async (taskId) => {
    try {
      await api.deleteTask(taskId)
      await refetch() // Refresh the tasks list
      setShowDeleteDialog(false)
      setTaskToDelete(null)
      toast.success('تم حذف المهمة بنجاح!')
    } catch (error) {
      console.error('خطأ في حذف المهمة:', error)
      toast.error('فشل في حذف المهمة')
    }
  }

  const handleViewTaskDetails = (task) => {
    setTaskToView(task)
    setShowDetailsModal(true)
  }

  const handleEditFromDetails = (task) => {
    setShowDetailsModal(false)
    setTaskToView(null)
    setSelectedTask(task)
  }

  const handleDeleteFromDetails = (task) => {
    setShowDetailsModal(false)
    setTaskToView(null)
    setTaskToDelete(task)
    setShowDeleteDialog(true)
  }

  const handleTaskCompleted = async (task) => {
    const updatedTask = {
      ...task,
      status: 'done',
      progress: 100
    }
    
    // إرسال إشعار للمدير عن إكمال المهمة
    try {
      await sendTaskActionNotification({
        taskTitle: task.title,
        taskId: task.id,
        action: 'إكمال المهمة',
        details: 'تم تغيير حالة المهمة إلى مكتملة'
      })
    } catch (notificationError) {
      console.warn('فشل في إرسال إشعار إكمال المهمة:', notificationError)
    }
    
    handleTaskUpdated(updatedTask)
  }

  // الحذف المتعدد للمهام
  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return
    
    try {
      const deletePromises = selectedTasks.map(taskId => api.deleteTask(taskId))
      await Promise.all(deletePromises)
      
      toast.success(`تم حذف ${selectedTasks.length} مهمة بنجاح`)
      setSelectedTasks([])
      setShowBulkDeleteConfirm(false)
      await refetch()
    } catch (error) {
      console.error('خطأ في الحذف المتعدد:', error)
      toast.error('حدث خطأ أثناء حذف بعض المهام')
    }
  }

  // التحكم في التحديد المتعدد
  const handleSelectAll = (checked) => {
    if (checked) {
      const visibleTaskIds = filteredTasks.map(t => t.id)
      setSelectedTasks(visibleTaskIds)
    } else {
      setSelectedTasks([])
    }
  }

  const handleSelectTask = (taskId, checked) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId])
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId))
    }
  }

  const clearSelection = () => {
    setSelectedTasks([])
  }

  // Filter tasks
  const getFilteredTasks = () => {
    // Apply role-based filtering first
    let filtered = filterByRole(tasks || [], 'tasks')

    // Filter by status/type
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'todo':
        case 'pending':
          filtered = filtered.filter(task => task.status === 'pending' || task.status === 'todo')
          break
        case 'in_progress':
          filtered = filtered.filter(task => task.status === 'in_progress')
          break
        case 'done':
        case 'completed':
          filtered = filtered.filter(task => task.status === 'completed' || task.status === 'done')
          break
        case 'overdue':
          const now = new Date()
          filtered = filtered.filter(task => {
            if (task.status === 'completed' || task.status === 'done') return false
            const dueDate = new Date(task.dueDate)
            return dueDate < now
          })
          break
        case 'today':
          const today = new Date()
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          filtered = filtered.filter(task => {
            const dueDate = new Date(task.dueDate)
            return dueDate >= startOfDay && dueDate < endOfDay
          })
          break
        case 'high_priority':
          filtered = filtered.filter(task => task.priority === 'high' && task.status !== 'completed')
          break
        default:
          filtered = getTasksByStatus(activeFilter)
      }
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => {
        if (statusFilter === 'pending') return task.status === 'pending' || task.status === 'todo'
        if (statusFilter === 'completed') return task.status === 'completed' || task.status === 'done'
        return task.status === statusFilter
      })
    }

    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from)
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
          return taskDate >= fromDate && taskDate <= toDate
        } else if (dateRange.from) {
          return taskDate >= new Date(dateRange.from)
        } else if (dateRange.to) {
          const toDate = new Date(dateRange.to)
          toDate.setHours(23, 59, 59, 999)
          return taskDate <= toDate
        }
        return true
      })
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.leadName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }

  const filteredTasks = getFilteredTasks()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown')) {
        setShowFilterDropdown(false)
      }
      if (!event.target.closest('.date-filter')) {
        setShowDateFilter(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-orange-100 text-orange-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-orange-100 text-orange-800'
      case 'done': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار'
      case 'in_progress': return 'قيد التنفيذ'
      case 'done': return 'مكتملة'
      default: return status
    }
  }

  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'عالية'
      case 'medium': return 'متوسطة'
      case 'low': return 'منخفضة'
      default: return priority
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  // Get current date and time in Arabic format
  const formatDateTimeArabic = () => {
    const now = new Date()
    const timeOptions = {
      timeZone: 'Africa/Cairo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
    const dateOptions = {
      timeZone: 'Africa/Cairo',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    
    const time = now.toLocaleTimeString('ar-EG', timeOptions)
    const date = now.toLocaleDateString('ar-EG', dateOptions)
    
    return { time, date }
  }

  const { time, date } = formatDateTimeArabic()

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-10 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
        
        <div className="relative px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <CheckSquare className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {isAdmin() ? 'مهام الفريق' : 'المهام'}
                  </h1>
                  <p className="text-purple-100 text-lg">
                    {isAdmin() 
                      ? 'إدارة ومتابعة جميع مهام الموظفين'
                      : 'إدارة وتتبع جميع المهام والمشاريع'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-3">
                <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  📅 {date}
                </span>
                <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  🕐 {time}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`text-xs h-8 px-3 ${
                    viewMode === 'list' ? 'bg-white text-purple-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  قائمة
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className={`text-xs h-8 px-3 ${
                    viewMode === 'kanban' ? 'bg-white text-purple-600' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  كانبان
                </Button>
              </div>
              
              {checkPermission('add_tasks') && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-purple-100 rounded-lg">
                      <Plus className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-bold">إضافة مهمة جديدة</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* إجمالي المهام */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-purple-100 text-xs font-medium">إجمالي المهام</p>
                <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-full"></div>
            </div>
            <p className="text-purple-100 text-xs">جميع المهام</p>
          </div>
        </Card>

        {/* قيد الانتظار */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs font-medium">قيد الانتظار</p>
                <p className="text-2xl font-bold text-white">{stats.pending || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-3/4"></div>
            </div>
            <p className="text-blue-100 text-xs">في انتظار البدء</p>
          </div>
        </Card>

        {/* قيد التنفيذ */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-orange-100 text-xs font-medium">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-white">{stats.inProgress || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-2/3"></div>
            </div>
            <p className="text-orange-100 text-xs">قيد العمل</p>
          </div>
        </Card>

        {/* مكتملة */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-green-100 text-xs font-medium">مكتملة</p>
                <p className="text-2xl font-bold text-white">{stats.completed || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-full"></div>
            </div>
            <p className="text-green-100 text-xs">تم الإنجاز</p>
          </div>
        </Card>

        {/* متأخرة */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-red-100 text-xs font-medium">متأخرة</p>
                <p className="text-2xl font-bold text-white">{stats.overdue || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-1/4"></div>
            </div>
            <p className="text-red-100 text-xs">تحتاج متابعة</p>
          </div>
        </Card>

        {/* أولوية عالية */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500 to-amber-600 text-white hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Flag className="h-5 w-5 text-white" />
              </div>
              <div className="text-right">
                <p className="text-yellow-100 text-xs font-medium">أولوية عالية</p>
                <p className="text-2xl font-bold text-white">{stats.highPriority || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-5/6"></div>
            </div>
            <p className="text-yellow-100 text-xs">مهمة عاجلة</p>
          </div>
        </Card>
      </div>

      {/* Enhanced Search and Filters with Integrated Tasks */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
        {/* Search Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-purple-800">المهام</h3>
                <p className="text-sm text-purple-600">
                  {tasks?.length || 0} مهمة مسجلة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث سريع..."
                    className="pl-10 pr-10 h-8 w-48 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Advanced Filter Button */}
                <div className="relative filter-dropdown">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`h-8 px-3 text-xs ${
                      (priorityFilter !== 'all' || statusFilter !== 'all') ? 'bg-blue-50 border-blue-300' : ''
                    }`}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className="h-3 w-3 ml-1" />
                    فلترة
                    {(priorityFilter !== 'all' || statusFilter !== 'all') && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        •
                      </span>
                    )}
                  </Button>
                  
                  {/* Filter Dropdown */}
                  {showFilterDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                          <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="all">جميع الأولويات</option>
                            <option value="high">عالية</option>
                            <option value="medium">متوسطة</option>
                            <option value="low">منخفضة</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="all">جميع الحالات</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="in_progress">قيد التنفيذ</option>
                            <option value="completed">مكتملة</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'kanban' ? (
          <div className="p-6">
            <KanbanBoard
              tasks={filteredTasks}
              onTaskUpdated={handleTaskUpdated}
              onTaskDeleted={(task) => {
                setTaskToDelete(task)
                setShowDeleteDialog(true)
              }}
              onAddTask={() => setShowAddModal(true)}
            />
          </div>
        ) : (
          <div className="border-t border-gray-200 p-6">
            {/* شريط التحديد المتعدد */}
            {selectedTasks.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      تم تحديد {selectedTasks.length} مهمة
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      إلغاء التحديد
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف المحددة
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* شريط التحديد الكامل */}
            {filteredTasks.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="select-all-tasks"
                      className="rounded border-gray-300"
                      checked={filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <label htmlFor="select-all-tasks" className="text-sm font-medium text-gray-700 cursor-pointer">
                      تحديد جميع المهام المعروضة ({filteredTasks.length})
                    </label>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {selectedTasks.length > 0 ? `${selectedTasks.length} محدد` : 'لا يوجد تحديد'}
                  </div>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex flex-wrap gap-6" aria-label="Tabs">
                  {[
                    { key: 'all', label: 'جميع المهام', count: stats.total },
                    { key: 'today', label: 'اليوم', count: stats.today },
                    { key: 'todo', label: 'قيد الانتظار', count: stats.pending },
                    { key: 'in_progress', label: 'قيد التنفيذ', count: stats.inProgress },
                    { key: 'done', label: 'مكتملة', count: stats.completed },
                    { key: 'overdue', label: 'متأخرة', count: stats.overdue },
                    { key: 'high_priority', label: 'أولوية عالية', count: stats.highPriority }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`${
                        activeFilter === tab.key
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {tab.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* Tasks Content */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مهام</h3>
                <p className="text-gray-500">لا توجد مهام متاحة في الوقت الحالي</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map(task => (
                  <Card key={task.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-purple-50 hover:to-indigo-50">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {/* Checkbox للتحديد */}
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={selectedTasks.includes(task.id)}
                              onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                            />
                            <div className={`w-3 h-3 rounded-full ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                            }`} />
                            <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">{task.title}</h4>
                            <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                              {getStatusLabel(task.status)}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          
                          <div className="grid grid-cols-3 gap-4 text-xs text-gray-500 mb-3">
                            {task.leadName && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-purple-500" />
                                <span className="font-medium">{task.leadName}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-blue-500" />
                              <span className="font-medium">{task.assignedTo || 'غير محدد'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-green-500" />
                              <span className="font-medium">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-EG', {
                                  timeZone: 'Africa/Cairo',
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric'
                                }) : 'لا يوجد تاريخ'}
                              </span>
                            </div>
                          </div>

                          {task.progress !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                <span>التقدم</span>
                                <span>{task.progress}%</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTaskDetails(task)}
                            className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 font-medium"
                          >
                            <ArrowRight className="h-3 w-3 ml-1" />
                            التفاصيل
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTask(task)}
                            className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 font-medium"
                          >
                            <Edit className="h-3 w-3 ml-1" />
                            تعديل
                          </Button>
                          
                          {task.status !== 'done' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTaskCompleted(task)}
                              className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 font-medium"
                            >
                              <CheckCircle className="h-3 w-3 ml-1" />
                              إكمال
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTaskToDelete(task)
                              setShowDeleteDialog(true)
                            }}
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium"
                          >
                            <Trash2 className="h-3 w-3 ml-1" />
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Add Task Modal */}
      {showAddModal && (
        <TaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onTaskAdded={handleTaskAdded}
          leads={leads}
          users={users}
          clients={clients}
          dataLoading={dataLoading}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && (
        <TaskModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          leads={leads}
          users={users}
          clients={clients}
          dataLoading={dataLoading}
        />
      )}

      {/* Task Details Modal */}
      {showDetailsModal && taskToView && (
        <TaskDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setTaskToView(null)
          }}
          task={taskToView}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteFromDetails}
          onUpdateTask={handleTaskUpdated}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setTaskToDelete(null)
        }}
        onConfirm={() => {
          if (taskToDelete) {
            handleTaskDeleted(taskToDelete.id)
          }
        }}
        title="حذف المهمة"
        message={`هل أنت متأكد من حذف المهمة "${taskToDelete?.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="حذف المهام المحددة"
        message={`هل أنت متأكد من رغبتك في حذف ${selectedTasks.length} مهمة؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف الكل"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  )
}
