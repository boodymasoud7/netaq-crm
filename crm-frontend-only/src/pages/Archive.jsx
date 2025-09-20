import React, { useState, useEffect, useCallback } from 'react'
import { 
  Archive as ArchiveIcon, 
  RotateCcw, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  Clock,
  User,
  Building2,
  Target,
  TrendingUp,
  FileText,
  Download,
  Upload,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  UserCheck,
  DollarSign,
  Home,
  Code,
  X,
  Plus,
  UserPlus,
  UserX,
  Star,
  MessageCircle
} from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import LoadingPage from '../components/ui/loading'
import toast from 'react-hot-toast'
import { useApi } from '../hooks/useApi'

export default function Archive() {
  const api = useApi()
  
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [itemToRestore, setItemToRestore] = useState(null)
  const [itemToDelete, setItemToDelete] = useState(null)

  // Real archived data from API
  const [archivedItems, setArchivedItems] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  })
  const [pageSize, setPageSize] = useState(50)

  // دالة تغيير حجم الصفحة
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      itemsPerPage: newSize
    }))
    // إعادة جلب البيانات بالحجم الجديد
    fetchArchivedData(1, newSize)
  }
  
  // Safe API call wrapper
  const safeApiCall = useCallback(async (apiFunction, params, name) => {
    try {
      if (typeof apiFunction !== 'function') {
        console.warn(`⚠️ ${name} API function not available`)
        if (name === 'FollowUps') { // Specific debugging for FollowUps
          console.log('🔍 API object keys:', Object.keys(api))
          console.log('🔍 getArchivedFollowUps type:', typeof api.getArchivedFollowUps)
        }
        return { data: [], pagination: { totalItems: 0 } }
      }
      console.log(`📡 Calling ${name} API with params:`, params)
      const result = await apiFunction(params)
      console.log(`✅ ${name} API result:`, result)
      return result || { data: [], pagination: { totalItems: 0 } }
    } catch (error) {
      console.error(`❌ ${name} API call failed:`, error)
      console.error(`❌ ${name} API error details:`, error.message, error.stack)
      return { data: [], pagination: { totalItems: 0 } }
    }
  }, [api])
  
  // Fetch archived data with proper error handling
  const fetchArchivedData = useCallback(async (page = 1, limit = pageSize) => {
      // منع الاستدعاءات المتعددة
      if (loading) {
        console.log('⏳ Already loading archived data, skipping...')
        return
      }

      setLoading(true)
      console.log('📥 Fetching archived data:', { page, limit })
      
      try {
        // Fetch all archived data types safely
        const [
          archivedClients,
          archivedLeads,
          archivedSales,
          archivedProjects,
          archivedUnits,
          archivedDevelopers,
          archivedFollowUps,
          archivedTasks,
          archivedReminders
        ] = await Promise.all([
          safeApiCall(api.getArchivedClients, { page, limit }, 'Clients'),
          safeApiCall(api.getArchivedLeads, { page, limit }, 'Leads'),
          safeApiCall(api.getArchivedSales, { page, limit }, 'Sales'),
          safeApiCall(api.getArchivedProjects, { page, limit }, 'Projects'),
          safeApiCall(api.getArchivedUnits, { page, limit }, 'Units'),
          safeApiCall(api.getArchivedDevelopers, { page, limit }, 'Developers'),
          safeApiCall(api.getArchivedFollowUps, { page, limit }, 'FollowUps'),
          safeApiCall(api.getArchivedTasks, { page, limit }, 'Tasks'),
          safeApiCall(api.getArchivedReminders, { page, limit }, 'Reminders')
        ])
        
        console.log('✅ All API calls completed:', {
          clients: archivedClients?.data?.length || 0,
          leads: archivedLeads?.data?.length || 0,
          sales: archivedSales?.data?.length || 0,
          projects: archivedProjects?.data?.length || 0,
          units: archivedUnits?.data?.length || 0,
          developers: archivedDevelopers?.data?.length || 0,
          followUps: archivedFollowUps?.data?.length || 0,
          tasks: archivedTasks?.data?.length || 0,
          reminders: archivedReminders?.data?.length || 0
        })
        
        console.log('🔍 Tasks API Response Structure:', {
          hasTasksData: !!archivedTasks?.data,
          tasksDataType: Array.isArray(archivedTasks?.data) ? 'array' : typeof archivedTasks?.data,
          tasksLength: archivedTasks?.data?.length,
          tasksPagination: archivedTasks?.pagination,
          sampleTask: archivedTasks?.data?.[0] ? {
            id: archivedTasks.data[0].id,
            title: archivedTasks.data[0].title,
            deleted_at: archivedTasks.data[0].deleted_at,
            deletedByUser: archivedTasks.data[0].deletedByUser
          } : 'No sample task'
        })
        
        // حساب العدد الإجمالي من جميع APIs
        const totalItemsCount = [
          archivedClients?.pagination?.totalItems || archivedClients?.data?.length || 0,
          archivedLeads?.pagination?.totalItems || archivedLeads?.data?.length || 0,
          archivedSales?.pagination?.totalItems || archivedSales?.data?.length || 0,
          archivedProjects?.pagination?.totalItems || archivedProjects?.data?.length || 0,
          archivedUnits?.pagination?.totalItems || archivedUnits?.data?.length || 0,
          archivedDevelopers?.pagination?.totalItems || archivedDevelopers?.data?.length || 0,
          archivedFollowUps?.pagination?.totalItems || archivedFollowUps?.data?.length || 0,
          archivedTasks?.pagination?.totalItems || archivedTasks?.data?.length || 0,
          archivedReminders?.pagination?.totalItems || archivedReminders?.data?.length || 0
        ].reduce((sum, count) => sum + count, 0)
        
        let allArchivedItems = []
        
        // Format clients
        if (archivedClients?.data && Array.isArray(archivedClients.data)) {
          const formattedClients = archivedClients.data.map(client => ({
            id: `client-${client.id}`,
            name: client.name,
            email: client.email,
            phone: client.phone,
            type: 'client',
            typeName: 'عميل',
            archivedAt: client.deletedAt || client.deleted_at,
            archivedBy: client.deletedByUser?.name || client.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${client.deletedByUser?.name || client.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              source: client.source || 'غير محدد',
              status: client.status || 'غير محدد',
              assignedTo: client.assignedTo || 'غير محدد',
              budget: client.budget || 'غير محدد',
              location: client.location || 'غير محدد',
              notes: client.notes || 'لا توجد ملاحظات'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedClients]
        }
        
        // Format leads
        if (archivedLeads?.data && Array.isArray(archivedLeads.data)) {
          const formattedLeads = archivedLeads.data.map(lead => ({
            id: `lead-${lead.id}`,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            type: 'lead',
            typeName: 'عميل محتمل',
            archivedAt: lead.deletedAt || lead.deleted_at,
            archivedBy: lead.deletedByUser?.name || lead.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${lead.deletedByUser?.name || lead.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              source: lead.source || 'غير محدد',
              status: lead.status || 'غير محدد',
              assignedTo: lead.assignedTo || 'غير محدد',
              budget: lead.budget || 'غير محدد',
              location: lead.location || 'غير محدد',
              notes: lead.notes || 'لا توجد ملاحظات'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedLeads]
        }
        
        // Format sales
        if (archivedSales?.data && Array.isArray(archivedSales.data)) {
          const formattedSales = archivedSales.data.map(sale => ({
            id: `sale-${sale.id}`,
            name: sale.clientName || sale.leadName || 'غير محدد',
            email: sale.clientEmail || sale.leadEmail || 'غير محدد',
            phone: sale.clientPhone || sale.leadPhone || 'غير محدد',
            type: 'sale',
            typeName: 'مبيعة',
            archivedAt: sale.deletedAt || sale.deleted_at,
            archivedBy: sale.deletedByUser?.name || sale.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${sale.deletedByUser?.name || sale.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              unitName: sale.unitName || 'غير محدد',
              salePrice: sale.salePrice || 'غير محدد',
              commission: sale.commission || 'غير محدد',
              saleDate: sale.saleDate || 'غير محدد',
              paymentMethod: sale.paymentMethod || 'غير محدد',
              status: sale.status || 'غير محدد',
              notes: sale.notes || 'لا توجد ملاحظات'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedSales]
        }
        
        // Format projects
        if (archivedProjects?.data && Array.isArray(archivedProjects.data)) {
          const formattedProjects = archivedProjects.data.map(project => ({
            id: `project-${project.id}`,
            name: project.name,
            email: 'غير محدد',
            phone: 'غير محدد',
            type: 'project',
            typeName: 'مشروع',
            archivedAt: project.deletedAt || project.deleted_at,
            archivedBy: project.deletedByUser?.name || project.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${project.deletedByUser?.name || project.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              location: project.location || 'غير محدد',
              developerId: project.developerId || 'غير محدد',
              status: project.status || 'غير محدد',
              startDate: project.startDate || 'غير محدد',
              endDate: project.endDate || 'غير محدد',
              description: project.description || 'لا يوجد وصف'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedProjects]
        }
        
        // Format units
        if (archivedUnits?.data && Array.isArray(archivedUnits.data)) {
          const formattedUnits = archivedUnits.data.map(unit => ({
            id: `unit-${unit.id}`,
            name: unit.unitNumber || 'غير محدد',
            email: 'غير محدد',
            phone: 'غير محدد',
            type: 'unit',
            typeName: 'وحدة',
            archivedAt: unit.deletedAt || unit.deleted_at,
            archivedBy: unit.deletedByUser?.name || unit.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${unit.deletedByUser?.name || unit.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              projectName: unit.projectName || 'غير محدد',
              floor: unit.floor || 'غير محدد',
              area: unit.area || 'غير محدد',
              rooms: unit.rooms || 'غير محدد',
              bathrooms: unit.bathrooms || 'غير محدد',
              price: unit.price || 'غير محدد',
              status: unit.status || 'غير محدد'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedUnits]
        }
        
        // Format developers
        if (archivedDevelopers?.data && Array.isArray(archivedDevelopers.data)) {
          const formattedDevelopers = archivedDevelopers.data.map(developer => ({
            id: `developer-${developer.id}`,
            name: developer.name,
            email: developer.email || 'غير محدد',
            phone: developer.phone || 'غير محدد',
            type: 'developer',
            typeName: 'مطور',
            archivedAt: developer.deletedAt || developer.deleted_at,
            archivedBy: developer.deletedByUser?.name || developer.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${developer.deletedByUser?.name || developer.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              company: developer.company || 'غير محدد',
              website: developer.website || 'غير محدد',
              rating: developer.rating || 'غير محدد',
              description: developer.description || 'لا يوجد وصف'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedDevelopers]
        }
        
        // Format follow-ups (المتابعات المحذوفة)
        if (archivedFollowUps?.data && Array.isArray(archivedFollowUps.data)) {
          console.log('✅ Processing archived follow-ups:', archivedFollowUps.data.length, 'items')
          const formattedFollowUps = archivedFollowUps.data.map(followUp => ({
            id: `followup-${followUp.id}`,
            name: followUp.title || 'متابعة',
            email: followUp.clientEmail || followUp.leadEmail || 'غير محدد',
            phone: followUp.clientPhone || followUp.leadPhone || 'غير محدد',
            type: 'followup',
            typeName: 'متابعة',
            archivedAt: followUp.deletedAt || followUp.deleted_at,
            archivedBy: followUp.deletedByUser?.name || followUp.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${followUp.deletedByUser?.name || followUp.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              scheduledDate: followUp.scheduledDate || 'غير محدد',
              status: followUp.status || 'غير محدد',
              priority: followUp.priority || 'غير محدد',
              type: followUp.type || 'غير محدد',
              notes: followUp.notes || 'لا توجد ملاحظات',
              result: followUp.result || 'لا توجد نتيجة'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedFollowUps]
        }
        
        // Format tasks
        if (archivedTasks?.data && Array.isArray(archivedTasks.data)) {
          console.log('✅ Processing archived tasks:', archivedTasks.data.length, 'items')
          const formattedTasks = archivedTasks.data.map(task => ({
            id: `task-${task.id}`,
            name: task.title,
            email: 'غير محدد',
            phone: 'غير محدد',
            type: 'task',
            typeName: 'مهمة',
            archivedAt: task.deletedAt || task.deleted_at,
            archivedBy: task.deletedByUser?.name || task.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${task.deletedByUser?.name || task.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              description: task.description || 'لا يوجد وصف',
              priority: task.priority || 'غير محدد',
              status: task.status || 'غير محدد',
              dueDate: task.dueDate || 'غير محدد',
              assignedTo: task.assignedTo || 'غير محدد',
              createdBy: task.createdBy || 'غير محدد'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedTasks]
        }
        
        // Format reminders
        if (archivedReminders?.data && Array.isArray(archivedReminders.data)) {
          const formattedReminders = archivedReminders.data.map(reminder => ({
            id: `reminder-${reminder.id}`,
            name: reminder.title || 'تذكير',
            email: 'غير محدد',
            phone: 'غير محدد',
            type: 'reminder',
            typeName: 'تذكير',
            archivedAt: reminder.deletedAt || reminder.deleted_at,
            archivedBy: reminder.deletedByUser?.name || reminder.deletedByUser?.username || 'النظام',
            reason: `تم الحذف من قبل ${reminder.deletedByUser?.name || reminder.deletedByUser?.username || 'المستخدم'}`,
            originalData: {
              status: reminder.status || 'غير محدد',
              type: reminder.type || 'غير محدد',
              reminderDate: reminder.reminderDate || 'غير محدد',
              userId: reminder.userId || 'غير محدد',
              relatedType: reminder.relatedType || 'غير محدد',
              relatedId: reminder.relatedId || null,
              message: reminder.message || 'لا توجد رسالة'
            }
          }))
          allArchivedItems = [...allArchivedItems, ...formattedReminders]
        }
        
        // Sort by archivedAt (newest first)
        allArchivedItems.sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
        
        setArchivedItems(allArchivedItems)
        
        // تحديث معلومات الصفحات
        setPagination({
          currentPage: page,
          totalPages: Math.max(1, Math.ceil(totalItemsCount / limit)),
          totalItems: totalItemsCount,
          itemsPerPage: limit
        })
        
        console.log('✅ Archive data loaded successfully:', {
          totalItems: allArchivedItems.length,
          totalItemsCount,
          pagination: {
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalItemsCount / limit)),
            totalItems: totalItemsCount
          }
        })
        
      } catch (error) {
        console.error('❌ Error fetching archived data:', error)
        toast.error('خطأ في جلب البيانات المؤرشفة')
      } finally {
        setLoading(false)
      }
    }, [api, pageSize, safeApiCall])

  // Load data on mount with timeout to prevent rapid calls
  useEffect(() => {
    let mounted = true
    let timeoutId = null
    
    const loadData = () => {
      timeoutId = setTimeout(() => {
        if (mounted && !loading) {
          fetchArchivedData()
        }
      }, 300)
    }
    
    loadData()
    
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, []) // Empty deps - fetchArchivedData handles its own deps

  // Calculate stats using total items from pagination
  const stats = {
    total: pagination.totalItems,
    clients: archivedItems.filter(item => item.type === 'client').length,
    leads: archivedItems.filter(item => item.type === 'lead').length,
    sales: archivedItems.filter(item => item.type === 'sale').length,
    projects: archivedItems.filter(item => item.type === 'project').length,
    units: archivedItems.filter(item => item.type === 'unit').length,
    developers: archivedItems.filter(item => item.type === 'developer').length,
    followups: archivedItems.filter(item => item.type === 'followup').length,
    tasks: archivedItems.filter(item => item.type === 'task').length,
    reminders: archivedItems.filter(item => item.type === 'reminder').length
  }

  // Filter items
  const filteredItems = archivedItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phone?.includes(searchQuery)
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    
    const matchesDate = dateFilter === 'all' || (() => {
      const archivedDate = new Date(item.archivedAt)
      const now = new Date()
      const diffDays = Math.floor((now - archivedDate) / (1000 * 60 * 60 * 24))
      
      switch (dateFilter) {
        case 'today': return diffDays === 0
        case 'week': return diffDays <= 7
        case 'month': return diffDays <= 30
        default: return true
      }
    })()
    
    return matchesSearch && matchesType && matchesDate
  })

  // Filter tabs
  const filterTabs = [
    { key: 'all', label: 'الكل', count: archivedItems.length },
    { key: 'clients', label: 'العملاء', count: stats.clients },
    { key: 'leads', label: 'العملاء المحتملين', count: stats.leads },
    { key: 'sales', label: 'المبيعات', count: stats.sales },
    { key: 'projects', label: 'المشاريع', count: stats.projects },
    { key: 'units', label: 'الوحدات', count: stats.units },
    { key: 'developers', label: 'المطورين', count: stats.developers },
    { key: 'followups', label: 'المتابعات', count: stats.followups },
    { key: 'tasks', label: 'المهام', count: stats.tasks },
    { key: 'reminders', label: 'التذكيرات', count: stats.reminders }
  ]

  // Restore item function
  const handleRestoreItem = async (item) => {
    try {
      const realId = parseInt(item.id.split('-')[1])
      let success = false
      
      if (item.type === 'client') {
        const result = await safeApiCall(api.restoreClient, realId, 'RestoreClient')
        success = result && (result.data || result.success)
      } else if (item.type === 'lead') {
        const result = await safeApiCall(api.restoreLead, realId, 'RestoreLead')
        success = result && (result.data || result.success)
      } else if (item.type === 'sale') {
        const result = await safeApiCall(api.restoreSale, realId, 'RestoreSale')
        success = result && (result.data || result.success)
      } else if (item.type === 'project') {
        const result = await safeApiCall(api.restoreProject, realId, 'RestoreProject')
        success = result && (result.data || result.success)
      } else if (item.type === 'unit') {
        const result = await safeApiCall(api.restoreUnit, realId, 'RestoreUnit')
        success = result && (result.data || result.success)
      } else if (item.type === 'developer') {
        console.log(`♻️ Calling api.restoreDeveloper(${realId}) for developer: ${item.name}`)
        const result = await safeApiCall(api.restoreDeveloper, realId, 'RestoreDeveloper')
        console.log('✅ RestoreDeveloper result:', result)
        success = result && (result.data || result.success)
      } else if (item.type === 'followup') {
        const result = await safeApiCall(api.restoreFollowUp, realId, 'RestoreFollowUp')
        success = result && (result.data || result.success)
      } else if (item.type === 'task') {
        const result = await safeApiCall(api.restoreTask, realId, 'RestoreTask')
        success = result && (result.data || result.success)
      } else if (item.type === 'reminder') {
        const result = await safeApiCall(api.restoreReminder, realId, 'RestoreReminder')
        success = result && (result.data || result.success)
      }
      
      if (success) {
        // Remove from archived items
        setArchivedItems(prevItems => prevItems.filter(i => i.id !== item.id))
        toast.success(`تم استعادة ${item.typeName} "${item.name}" بنجاح`)
      } else {
        toast.error('فشل في استعادة العنصر')
      }
    } catch (error) {
      console.error('Error restoring item:', error)
      toast.error('حدث خطأ أثناء استعادة العنصر')
    } finally {
      setShowRestoreDialog(false)
      setItemToRestore(null)
    }
  }

  // Delete item function
  const handleDeleteItem = async (item) => {
    try {
      const realId = parseInt(item.id.split('-')[1])
      let success = false
      
      if (item.type === 'client') {
        const result = await safeApiCall(api.permanentDeleteClient, realId, 'DeleteClient')
        success = result && result.message
      } else if (item.type === 'lead') {
        const result = await safeApiCall(api.permanentDeleteLead, realId, 'DeleteLead')
        success = result && result.message
      } else if (item.type === 'sale') {
        const result = await safeApiCall(api.permanentDeleteSale, realId, 'DeleteSale')
        success = result && result.message
      } else if (item.type === 'project') {
        const result = await safeApiCall(api.permanentDeleteProject, realId, 'DeleteProject')
        success = result && result.message
      } else if (item.type === 'unit') {
        const result = await safeApiCall(api.permanentDeleteUnit, realId, 'DeleteUnit')
        success = result && result.message
      } else if (item.type === 'developer') {
        const result = await safeApiCall(api.permanentDeleteDeveloper, realId, 'DeleteDeveloper')
        success = result && result.message
      } else if (item.type === 'followup') {
        const result = await safeApiCall(api.permanentDeleteFollowUp, realId, 'DeleteFollowUp')
        success = result && result.message
      } else if (item.type === 'task') {
        const result = await safeApiCall(api.permanentDeleteTask, realId, 'DeleteTask')
        success = result && result.message
      } else if (item.type === 'reminder') {
        const result = await safeApiCall(api.permanentDeleteReminder, realId, 'DeleteReminder')
        success = result && result.message
      }
      
      if (success) {
        // Remove from archived items
        setArchivedItems(prevItems => prevItems.filter(i => i.id !== item.id))
        toast.success(`تم حذف ${item.typeName} "${item.name}" نهائياً`)
      } else {
        toast.error('فشل في حذف العنصر نهائياً')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('حدث خطأ أثناء حذف العنصر')
    } finally {
      setShowDeleteDialog(false)
      setItemToDelete(null)
    }
  }

  // Delete all archived items function
  const handleDeleteAll = async () => {
    try {
      setLoading(true)
      
      const results = await Promise.allSettled([
        safeApiCall(api.permanentDeleteAllClients, null, 'DeleteAllClients'),
        safeApiCall(api.permanentDeleteAllLeads, null, 'DeleteAllLeads'),
        safeApiCall(api.permanentDeleteAllDevelopers, null, 'DeleteAllDevelopers'),
        safeApiCall(api.permanentDeleteAllFollowUps, null, 'DeleteAllFollowUps'),
        safeApiCall(api.permanentDeleteAllTasks, null, 'DeleteAllTasks'),
        safeApiCall(api.permanentDeleteAllReminders, null, 'DeleteAllReminders')
      ])
      
      let totalDeleted = 0
      results.forEach((result, index) => {
        const types = ['Clients', 'Leads', 'Developers', 'FollowUps', 'Tasks', 'Reminders']
        if (result.status === 'fulfilled' && result.value?.deletedCount) {
          totalDeleted += result.value.deletedCount
          console.log(`✅ ${types[index]}: ${result.value.deletedCount} deleted`)
        } else if (result.status === 'rejected') {
          console.warn(`⚠️ ${types[index]} deletion failed:`, result.reason)
        }
      })
      
      if (totalDeleted > 0) {
        // Clear archived items list
        setArchivedItems([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
        })
        toast.success(`تم حذف ${totalDeleted} عنصر نهائياً من الأرشيف`)
      } else {
        toast.info('لا توجد عناصر مؤرشفة للحذف')
      }
      
    } catch (error) {
      console.error('Error deleting all archived items:', error)
      toast.error('حدث خطأ أثناء حذف العناصر المؤرشفة')
    } finally {
      setLoading(false)
      setShowDeleteAllDialog(false)
    }
  }

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'client': return <User className="w-4 h-4" />
      case 'lead': return <UserCheck className="w-4 h-4" />
      case 'sale': return <DollarSign className="w-4 h-4" />
      case 'project': return <Building2 className="w-4 h-4" />
      case 'unit': return <Home className="w-4 h-4" />
      case 'developer': return <Code className="w-4 h-4" />
      case 'followup': return <Target className="w-4 h-4" />
      case 'task': return <CheckCircle className="w-4 h-4" />
      case 'reminder': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  // Get type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'client': return 'bg-blue-100 text-blue-800'
      case 'lead': return 'bg-green-100 text-green-800'
      case 'sale': return 'bg-emerald-100 text-emerald-800'
      case 'project': return 'bg-purple-100 text-purple-800'
      case 'unit': return 'bg-orange-100 text-orange-800'
      case 'developer': return 'bg-pink-100 text-pink-800'
      case 'followup': return 'bg-indigo-100 text-indigo-800'
      case 'task': return 'bg-teal-100 text-teal-800'
      case 'reminder': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && archivedItems.length === 0) {
    return <LoadingPage />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Header - Similar to ClientsSimple */}
      <div className="relative bg-gradient-to-r from-gray-600 via-gray-700 to-slate-800 rounded-3xl p-8 mb-8 overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ArchiveIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">أرشيف النظام</h1>
                <p className="text-gray-200 text-lg">عرض وإدارة العناصر المحذوفة</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
                    {stats.total} عنصر مؤرشف
                  </Badge>
                  <Badge className="bg-blue-500 bg-opacity-80 text-white">
                    {stats.followups} متابعة
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Page Size Selector */}
              <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-xl px-4 py-3 backdrop-blur-sm">
                <span className="text-sm text-white">عرض:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="bg-transparent text-white text-sm focus:outline-none"
                >
                  <option value={50} className="text-black">50</option>
                  <option value={100} className="text-black">100</option>
                  <option value={200} className="text-black">200</option>
                  <option value={500} className="text-black">500</option>
                  <option value={1000} className="text-black">1000</option>
                </select>
              </div>
              
              <Button 
                onClick={() => fetchArchivedData(pagination.currentPage, pageSize)}
                disabled={loading}
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              
              {stats.total > 0 && (
                <Button 
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={loading}
                  className="bg-red-500 bg-opacity-80 border-red-400 border-opacity-50 text-white hover:bg-red-600 hover:bg-opacity-90 backdrop-blur-sm"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف الجميع
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <ArchiveIcon className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <RefreshCw className="h-16 w-16 text-white" />
        </div>
      </div>

      {/* Enhanced Stats Cards - Similar to ClientsSimple */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* إجمالي العناصر */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">إجمالي العناصر</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600 mt-1">عنصر مؤرشف</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ArchiveIcon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* العملاء */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">العملاء</p>
                <p className="text-3xl font-bold text-blue-900">{stats.clients}</p>
                <p className="text-sm text-blue-600 mt-1">عميل</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* العملاء المحتملين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">العملاء المحتملين</p>
                <p className="text-3xl font-bold text-green-900">{stats.leads}</p>
                <p className="text-sm text-green-600 mt-1">عميل محتمل</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* المتابعات */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">المتابعات</p>
                <p className="text-3xl font-bold text-purple-900">{stats.followups}</p>
                <p className="text-sm text-purple-600 mt-1">متابعة</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* المبيعات */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">المبيعات</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.sales}</p>
                <p className="text-sm text-emerald-600 mt-1">مبيعة</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white border-0 shadow-md rounded-xl mb-6">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-64">
              <Input
                type="text"
                placeholder="البحث في العناصر المؤرشفة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                فلترة
              </Button>
              
              {showFilterDropdown && (
                <div className="absolute left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg p-4 z-50">
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">نوع العنصر:</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">جميع الأنواع</option>
                      <option value="client">عملاء</option>
                      <option value="lead">عملاء محتملين</option>
                      <option value="sale">مبيعات</option>
                      <option value="project">مشاريع</option>
                      <option value="unit">وحدات</option>
                      <option value="developer">مطورين</option>
                      <option value="followup">متابعات</option>
                      <option value="task">مهام</option>
                      <option value="reminder">تذكيرات</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">فترة الحذف:</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="all">جميع الفترات</option>
                      <option value="today">اليوم</option>
                      <option value="week">هذا الأسبوع</option>
                      <option value="month">هذا الشهر</option>
                    </select>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTypeFilter('all')
                      setDateFilter('all')
                      setShowFilterDropdown(false)
                    }}
                    className="w-full"
                  >
                    مسح الفلاتر
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'all') {
                  setActiveFilter('all')
                  setTypeFilter('all')
                } else {
                  setActiveFilter(tab.key)
                  setTypeFilter(tab.key === 'clients' ? 'client' : 
                               tab.key === 'leads' ? 'lead' :
                               tab.key === 'sales' ? 'sale' :
                               tab.key === 'projects' ? 'project' :
                               tab.key === 'units' ? 'unit' :
                               tab.key === 'developers' ? 'developer' :
                               tab.key === 'followups' ? 'followup' :
                               tab.key === 'tasks' ? 'task' :
                               tab.key === 'reminders' ? 'reminder' : 'all')
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === tab.key || (activeFilter === 'all' && tab.key === 'all')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <Card className="p-12 text-center">
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            جاري تحميل البيانات...
          </div>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <ArchiveIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">لا توجد عناصر مؤرشفة</h3>
          <p className="text-gray-500">
            {searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
              ? 'لا توجد عناصر تطابق معايير البحث المحددة'
              : 'لم يتم حذف أي عناصر بعد'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                        <Badge variant="outline" className={`text-xs ${getTypeColor(item.type)}`}>
                          {item.typeName}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.email && item.email !== 'غير محدد' && <div>📧 {item.email}</div>}
                        {item.phone && item.phone !== 'غير محدد' && <div>📱 {item.phone}</div>}
                        <div className="flex items-center gap-4">
                          <span>🗑️ بواسطة: {item.archivedBy}</span>
                          <span>📅 في: {new Date(item.archivedAt).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item)
                        setShowViewModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setItemToRestore(item)
                        setShowRestoreDialog(true)
                      }}
                      className="text-green-600 hover:text-green-700"
                    >
                      <RotateCcw className="w-4 h-4 ml-1" />
                      استعادة
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setItemToDelete(item)
                        setShowDeleteDialog(true)
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      حذف نهائي
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span>عرض {((pagination.currentPage - 1) * pageSize) + 1}-{Math.min(pagination.currentPage * pageSize, pagination.totalItems)}</span>
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <Button
                  onClick={() => fetchArchivedData(pagination.currentPage - 1, pageSize)}
                  disabled={pagination.currentPage === 1 || loading}
                  variant="outline"
                  size="sm"
                  className="px-3 py-2"
                >
                  السابق
                </Button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = pagination.currentPage <= 3 
                    ? i + 1 
                    : pagination.currentPage + i - 2
                  
                  if (pageNum > pagination.totalPages) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => fetchArchivedData(pageNum, pageSize)}
                      variant={pageNum === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      className="px-3 py-2"
                      disabled={loading}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                
                <Button
                  onClick={() => fetchArchivedData(pagination.currentPage + 1, pageSize)}
                  disabled={pagination.currentPage === pagination.totalPages || loading}
                  variant="outline"
                  size="sm"
                  className="px-3 py-2"
                >
                  التالي
                </Button>
              </div>
              
              <Badge variant="outline" className="text-xs">
                {pagination.currentPage} / {pagination.totalPages}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => setShowRestoreDialog(false)}
        title="تأكيد الاستعادة"
        message={`هل أنت متأكد من استعادة ${itemToRestore?.typeName} "${itemToRestore?.name}"؟`}
        confirmText="استعادة"
        cancelText="إلغاء"
        onConfirm={() => handleRestoreItem(itemToRestore)}
        type="success"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="تأكيد الحذف النهائي"
        message={`هل أنت متأكد من الحذف النهائي لـ ${itemToDelete?.typeName} "${itemToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف نهائي"
        cancelText="إلغاء"
        onConfirm={() => handleDeleteItem(itemToDelete)}
        type="danger"
      />

      <ConfirmDialog
        isOpen={showDeleteAllDialog}
        onClose={() => setShowDeleteAllDialog(false)}
        title="تأكيد حذف جميع العناصر المؤرشفة"
        message={`هل أنت متأكد من الحذف النهائي لجميع العناصر المؤرشفة (${stats.total} عنصر)؟ هذا الإجراء لا يمكن التراجع عنه وسيحذف جميع البيانات المؤرشفة نهائياً.`}
        confirmText="حذف الجميع نهائياً"
        cancelText="إلغاء"
        onConfirm={handleDeleteAll}
        type="danger"
      />

      {/* View Details Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(selectedItem.type)}`}>
                    {getTypeIcon(selectedItem.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedItem.name}</CardTitle>
                    <p className="text-sm text-gray-600">{selectedItem.typeName}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">معلومات الاتصال</h4>
                  <div className="space-y-2 text-sm">
                    {selectedItem.email && selectedItem.email !== 'غير محدد' && 
                      <div><span className="text-gray-600">البريد:</span> {selectedItem.email}</div>}
                    {selectedItem.phone && selectedItem.phone !== 'غير محدد' && 
                      <div><span className="text-gray-600">الهاتف:</span> {selectedItem.phone}</div>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">معلومات الأرشفة</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">أُرشف بواسطة:</span> {selectedItem.archivedBy}</div>
                    <div><span className="text-gray-600">تاريخ الأرشفة:</span> {new Date(selectedItem.archivedAt).toLocaleString('ar-EG')}</div>
                    <div><span className="text-gray-600">السبب:</span> {selectedItem.reason}</div>
                  </div>
                </div>
              </div>
              
              {selectedItem.originalData && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">البيانات الأصلية</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {Object.entries(selectedItem.originalData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 font-medium">{key}:</span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}