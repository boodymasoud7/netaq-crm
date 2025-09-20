import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Phone, 
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
  Mail,
  MessageSquare,
  Video,
  MapPin,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
// Removed Select components - using native select elements for consistency
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '../contexts/NotificationContext'
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import LoadingPage from '../components/ui/loading'
import { autoFollowUpService } from '../services/autoFollowUpService'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import FollowUpResultModal from '../components/followups/FollowUpResultModal'
import EditFollowUpModal from '../components/followups/EditFollowUpModal'
import FollowUpDetailsModal from '../components/followups/FollowUpDetailsModal'
import GroupedFollowUpsTable from '../components/followups/GroupedFollowUpsTable'
import { useApi, usePaginatedApi } from '../hooks/useApi'
import { formatDateArabic, formatPhoneNumber } from '../lib/utils'
import { getResponsibleEmployeeName } from '../lib/userUtils'
import toast from 'react-hot-toast'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { LoadingButton } from '../components/ui/LoadingButton'

const typeOptions = [
  { value: 'call', label: 'مكالمة', color: 'from-blue-500 to-blue-600', icon: Phone },
  { value: 'whatsapp', label: 'واتساب', color: 'from-green-500 to-green-600', icon: MessageSquare },
  { value: 'email', label: 'إيميل', color: 'from-red-500 to-red-600', icon: Mail },
  { value: 'meeting', label: 'اجتماع', color: 'from-purple-500 to-purple-600', icon: Video },
  { value: 'demo', label: 'عرض تقديمي', color: 'from-indigo-500 to-indigo-600', icon: Award },
  { value: 'visit', label: 'زيارة', color: 'from-orange-500 to-orange-600', icon: MapPin }
]

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار', color: 'from-yellow-500 to-yellow-600', icon: Clock },
  { value: 'done', label: 'مكتملة', color: 'from-green-500 to-green-600', icon: CheckCircle },
  { value: 'cancelled', label: 'ملغاة', color: 'from-gray-500 to-gray-600', icon: XCircle }
]

const priorityOptions = [
  { value: 'urgent', label: 'عاجل', color: 'from-red-500 to-red-600', icon: AlertTriangle },
  { value: 'high', label: 'عالية', color: 'from-orange-500 to-orange-600', icon: Flag },
  { value: 'medium', label: 'متوسطة', color: 'from-yellow-500 to-amber-600', icon: Flag },
  { value: 'low', label: 'منخفضة', color: 'from-green-500 to-green-600', icon: Flag }
]

export default function FollowUps() {
  const { currentUser } = useAuth()
  const { checkPermission } = usePermissions()
  const notifications = useNotifications()
  const { sendFollowUpCompletedNotification } = useSSENotificationSender()
  const api = useApi()
  
  // State management
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState(null)
  const [followUpToDelete, setFollowUpToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [currentFollowUp, setCurrentFollowUp] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Filter states
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // View mode state
  const [viewMode, setViewMode] = useState('grouped') // 'grouped' | 'list'
  
  // View scope - عرض جميع المتابعات للمستخدم
  const viewScope = 'all'
  
  // Pagination state
  const [pageSize, setPageSize] = useState(50) // حجم الصفحة المختار
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // إدارة التحديد المتعدد للمتابعات
  const [selectedFollowUps, setSelectedFollowUps] = useState([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  
  // دالة تغيير حجم الصفحة
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1) // العودة للصفحة الأولى
    // إعادة جلب البيانات بالحجم الجديد - سيتم تطبيقها في useEffect
  }
  
  // دالة تغيير الصفحة
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Form state for new follow-up
  const [newFollowUp, setNewFollowUp] = useState({
    type: 'call',
    title: '',
    description: '',
    scheduledDate: '',
    priority: 'medium',
    leadId: 'none',
    clientId: 'none'
  })

  // Data for dropdowns
  const [leads, setLeads] = useState([])
  const [clients, setClients] = useState([])
  const [dataLoading, setDataLoading] = useState(false)

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    missed: 0,
    overdue: 0,
    today: 0
  })

  useEffect(() => {
    fetchFollowUps()
  }, [currentUser?.id])

  // إعادة جلب البيانات عند تغيير الفلاتر أو النطاق أو الصفحة
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchFollowUps()
    }, 300) // تأخير بسيط لتجنب الكثير من الطلبات أثناء الكتابة
    
    return () => clearTimeout(delayedSearch)
  }, [searchQuery, statusFilter, typeFilter, priorityFilter, viewScope, currentPage, pageSize])

  // Load dropdown data when modal opens
  useEffect(() => {
    if (showAddModal) {
      console.log('🔄 Modal opened, loading dropdown data...')
      loadDropdownData()
    }
  }, [showAddModal])

  // Debug state changes
  useEffect(() => {
    console.log('📊 Dropdown state:', { 
      leads: leads.length, 
      clients: clients.length, 
      dataLoading 
    })
  }, [leads, clients, dataLoading])

  const loadDropdownData = async () => {
    try {
      setDataLoading(true)
      console.log('🔄 Loading dropdown data...')
      
      const [leadsResponse, clientsResponse] = await Promise.allSettled([
        api.getLeads({ limit: 100 }),
        api.getClients({ limit: 100 })
      ])

      // Process leads - more flexible data handling
      if (leadsResponse.status === 'fulfilled') {
        const response = leadsResponse.value
        let leadsData = []
        
        if (response?.success && response?.data) {
          leadsData = response.data
        } else if (response?.data) {
          leadsData = response.data
        } else if (Array.isArray(response)) {
          leadsData = response
        }
        
        console.log('📋 Leads loaded:', leadsData.length)
        setLeads(leadsData.map(lead => ({
          id: lead.id,
          name: lead.name || lead.firstName || lead.fullName || 'غير محدد',
          phone: lead.phone || lead.phoneNumber || ''
        })))
      } else {
        console.warn('⚠️ Failed to load leads:', leadsResponse.reason)
        setLeads([])
      }

      // Process clients - more flexible data handling  
      if (clientsResponse.status === 'fulfilled') {
        const response = clientsResponse.value
        let clientsData = []
        
        if (response?.success && response?.data) {
          clientsData = response.data
        } else if (response?.data) {
          clientsData = response.data
        } else if (Array.isArray(response)) {
          clientsData = response
        }
        
        console.log('👥 Clients loaded:', clientsData.length)
        setClients(clientsData.map(client => ({
          id: client.id,
          name: client.name || client.firstName || client.fullName || 'غير محدد',
          phone: client.phone || client.phoneNumber || ''
        })))
      } else {
        console.warn('⚠️ Failed to load clients:', clientsResponse.reason)
        setClients([])
      }
    } catch (error) {
      console.error('❌ Error loading dropdown data:', error)
      setLeads([])
      setClients([])
      toast.error('فشل في تحميل بيانات العملاء')
    } finally {
      setDataLoading(false)
    }
  }

  // دالة لإثراء بيانات المتابعات بمعلومات العملاء والعملاء المحتملين
  const enrichFollowUpsWithClientData = useCallback(async (followUps) => {
    try {
      console.log('🔄 Enriching follow-ups with client data...')
      
      // جمع معرفات العملاء والعملاء المحتملين والمستخدمين
      const leadIds = [...new Set(followUps.filter(f => f.leadId).map(f => f.leadId))]
      const clientIds = [...new Set(followUps.filter(f => f.clientId).map(f => f.clientId))]
      const userIds = [...new Set(followUps.filter(f => f.assignedTo).map(f => f.assignedTo))]
      
      console.log('📊 Lead IDs to fetch:', leadIds)
      console.log('📊 Client IDs to fetch:', clientIds)
      console.log('👥 User IDs to fetch:', userIds)
      
      // جلب بيانات العملاء المحتملين
      let leadsMap = {}
      if (leadIds.length > 0) {
        try {
          const leadsResponse = await api.getLeads()
          if (leadsResponse.success) {
            const leadsData = leadsResponse.data || []
            leadsMap = leadsData.reduce((map, lead) => {
              map[lead.id] = {
                id: lead.id,
                name: lead.name || lead.firstName || lead.fullName || 'غير محدد',
                phone: lead.phone || lead.phoneNumber || 'غير محدد',
                source: lead.source || 'غير محدد'
              }
              return map
            }, {})
            console.log('📞 Leads map created:', leadsMap)
          }
        } catch (error) {
          console.error('Error fetching leads:', error)
        }
      }
      
      // جلب بيانات العملاء
      let clientsMap = {}
      if (clientIds.length > 0) {
        try {
          const clientsResponse = await api.getClients()
          if (clientsResponse.success) {
            const clientsData = clientsResponse.data || []
            clientsMap = clientsData.reduce((map, client) => {
              map[client.id] = {
                id: client.id,
                name: client.name || client.firstName || client.fullName || 'غير محدد',
                phone: client.phone || client.phoneNumber || 'غير محدد',
                source: client.source || 'غير محدد'
              }
              return map
            }, {})
            console.log('👥 Clients map created:', clientsMap)
          }
        } catch (error) {
          console.error('Error fetching clients:', error)
        }
      }
      
      // جلب بيانات المستخدمين
      let usersMap = {}
      if (userIds.length > 0) {
        try {
          const usersResponse = await api.getUsers()
          if (usersResponse.success) {
            const usersData = usersResponse.data || []
            usersMap = usersData.reduce((map, user) => {
              map[user.id] = {
                id: user.id,
                name: user.name || user.firstName || user.fullName || 'غير محدد',
                email: user.email || 'غير محدد'
              }
              return map
            }, {})
            console.log('👤 Users map created:', usersMap)
          }
        } catch (error) {
          console.error('Error fetching users:', error)
        }
      }
      
      // إثراء بيانات المتابعات
      const enrichedFollowUps = followUps.map(followUp => {
        const enriched = { ...followUp }
        
        if (followUp.leadId && leadsMap[followUp.leadId]) {
          enriched.lead = leadsMap[followUp.leadId]
        }
        
        if (followUp.clientId && clientsMap[followUp.clientId]) {
          enriched.client = clientsMap[followUp.clientId]
        }
        
        if (followUp.assignedTo && usersMap[followUp.assignedTo]) {
          enriched.assignedUser = usersMap[followUp.assignedTo]
        }
        
        return enriched
      })
      
      console.log('✅ Follow-ups enriched successfully')
      return enrichedFollowUps
      
    } catch (error) {
      console.error('Error enriching follow-ups:', error)
      return followUps // إرجاع البيانات الأصلية في حالة الخطأ
    }
  }, [api])

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true)
      
      // فلترة المتابعات حسب المستخدم الحالي مع pagination
      const filterParams = { 
        search: searchQuery,
        status: statusFilter === 'all' ? '' : statusFilter,
        type: typeFilter === 'all' ? '' : typeFilter,
        priority: priorityFilter === 'all' ? '' : priorityFilter,
        page: currentPage,
        limit: pageSize
      }

      // فلترة حسب الدور والنطاق المحدد
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'admin' && currentUser?.id) {
        if (viewScope === 'assigned') {
          // المتابعات المخصصة لي
          filterParams.assignedTo = currentUser.id
        } else if (viewScope === 'created') {
          // المتابعات التي أنشأتها
          filterParams.createdBy = currentUser.id
        } else if (viewScope === 'all') {
          // جميع المتابعات المرتبطة بي (مخصصة لي أو أنشأتها)
          filterParams.userFilter = currentUser.id
        }
      }

      const response = await api.getFollowUps(filterParams)
      
      if (response.success) {
        const followUpsData = response.data || []
        
        // إزالة التكرارات إذا وُجدت بطريقة أكثر قوة
        const uniqueFollowUpsMap = new Map();
        followUpsData.forEach(followUp => {
          if (followUp && followUp.id) {
            uniqueFollowUpsMap.set(followUp.id, followUp);
          }
        });
        
        const uniqueFollowUps = Array.from(uniqueFollowUpsMap.values());
        
        // تحديث pagination data
        if (response.pagination) {
          setCurrentPage(response.pagination.currentPage || 1)
          setTotalPages(response.pagination.totalPages || 1)
          setTotalItems(response.pagination.totalItems || 0)
        }
        
        // إثراء البيانات بمعلومات العملاء والعملاء المحتملين
        const enrichedData = await enrichFollowUpsWithClientData(uniqueFollowUps)
        setFollowUps(enrichedData)
        calculateStats(enrichedData)
      }
    } catch (error) {
      console.error('Error fetching follow-ups:', error)
      toast.error('فشل في تحميل المتابعات')
    } finally {
      setLoading(false)
    }
  }, [
    searchQuery, 
    statusFilter, 
    typeFilter, 
    priorityFilter, 
    currentPage, 
    pageSize, 
    currentUser?.role, 
    currentUser?.id, 
    viewScope, 
    api, 
    enrichFollowUpsWithClientData
  ])

  const calculateStats = (data) => {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    const newStats = {
      total: data.length,
      pending: data.filter(f => f.status === 'pending').length,
      done: data.filter(f => f.status === 'done').length,
      cancelled: data.filter(f => f.status === 'cancelled').length,
      overdue: data.filter(f => {
        if (f.status === 'done') return false
        const scheduledDate = new Date(f.scheduledDate)
        return scheduledDate < today
      }).length,
      today: data.filter(f => {
        const scheduledDate = new Date(f.scheduledDate)
        return scheduledDate >= startOfDay && scheduledDate < endOfDay
      }).length
    }
    
    setStats(newStats)
  }

  const handleCreateFollowUp = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Prepare data for submission
      const followUpData = {
        ...newFollowUp,
        status: 'pending', // إضافة status مطلوب للباك اند
        assignedTo: currentUser?.id,
        createdBy: currentUser?.id,
        // Convert string IDs to numbers, handle 'none' value
        leadId: newFollowUp.leadId && newFollowUp.leadId !== 'none' ? parseInt(newFollowUp.leadId) : null,
        clientId: newFollowUp.clientId && newFollowUp.clientId !== 'none' ? parseInt(newFollowUp.clientId) : null
      }

      // Remove empty fields
      Object.keys(followUpData).forEach(key => {
        if (followUpData[key] === '' || followUpData[key] === null) {
          delete followUpData[key]
        }
      })

      const response = await api.createFollowUp(followUpData)
      
      if (response.success) {
        const createdFollowUp = response.data
        
        // إشعار إنشاء المتابعة (يمكن إضافته لاحقاً)
        console.log('📋 New follow-up created:', createdFollowUp.title)
        
        toast.success('تم إنشاء المتابعة بنجاح')
        setShowAddModal(false)
        setNewFollowUp({
          type: 'call',
          title: '',
          description: '',
          scheduledDate: '',
          priority: 'medium',
          leadId: 'none',
          clientId: 'none'
        })
        fetchFollowUps()
      }
    } catch (error) {
      console.error('Error creating follow-up:', error)
      toast.error('فشل في إنشاء المتابعة')
    } finally {
      setIsSubmitting(false)
    }
  }

  // إكمال المتابعة وإنشاء التالية تلقائياً
  const handleCompleteFollowUp = async (followUpIdOrObject, followUpObj = null) => {
    try {
      console.log('🔄 إكمال المتابعة وإنشاء التالية...')
      
      console.log('📢 handleCompleteFollowUp called')
      
      // تحديد المعاملات بناءً على نوع الاستدعاء
      let followUpId, followUp
      
      if (followUpObj === null) {
        // تم تمرير followUp object فقط
        followUp = followUpIdOrObject
        followUpId = followUp.id
      } else {
        // تم تمرير followUpId و followUp منفصلين
        followUpId = followUpIdOrObject
        followUp = followUpObj
      }
      
      if (followUp.leadId) {
        // فتح مودال اختيار نتيجة المتابعة
        setCurrentFollowUp({ ...followUp, id: followUpId })
        setShowResultModal(true)
        return // Exit early to wait for modal result
      } else {
        // إكمال المتابعة فقط بدون إنشاء متابعة جديدة
        await api.updateFollowUp(followUpId, {
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: currentUser?.id
        })
        
        // إرسال إشعار للمديرين عن إكمال المتابعة
        if (currentUser?.role === 'sales' || currentUser?.role === 'sales_agent') {
          const clientName = followUp.lead?.name || followUp.client?.name || 'عميل غير محدد'
          await sendFollowUpCompletedNotification(followUp.title, clientName, 'إكمال بسيط')
          console.log('📤 Follow-up completion notification sent to managers')
        }
        
        toast.success('تم إكمال المتابعة بنجاح')
      }
      
      fetchFollowUps()
      
    } catch (error) {
      console.error('Error completing follow-up:', error)
      toast.error('فشل في إكمال المتابعة')
    }
  }

  // معالجة حفظ تعديل المتابعة
  const handleSaveEdit = async (followUpId, updatedData) => {
    try {
      const originalFollowUp = followUps.find(f => f.id === followUpId)
      
      await api.updateFollowUp(followUpId, updatedData)
      
      // إرسال إشعار إذا تم تغيير الموعد
      if (updatedData.scheduledDate && originalFollowUp) {
        const oldDate = originalFollowUp.scheduledDate
        const newDate = updatedData.scheduledDate
        
        if (oldDate !== newDate) {
          console.log('📅 Follow-up rescheduled:', { oldDate, newDate })
          // يمكن إضافة إشعار للتعديل لاحقاً إذا لزم الأمر
        }
      }
      
      toast.success('تم حفظ التعديلات بنجاح')
      fetchFollowUps()
    } catch (error) {
      console.error('Error updating follow-up:', error)
      toast.error('فشل في حفظ التعديلات')
      throw error
    }
  }

  // تحويل النتائج العربية إلى إنجليزية للباك إند
  const mapArabicOutcomeToEnglish = (arabicResult) => {
    const mappings = {
      // نتائج إيجابية
      'مهتم': 'interested',
      'مهتم جداً': 'interested',
      'طلب عرض سعر': 'quotation_sent',
      'يريد اجتماع': 'meeting_scheduled',
      'يريد معلومات أكثر': 'needs_info',
      
      // نتائج مؤجلة
      'يحتاج وقت': 'call_later',
      'سيتصل لاحقاً': 'call_later',
      'مشغول': 'call_later',
      'في اجتماع': 'call_later',
      
      // نتائج محايدة
      'لا يرد': 'no_answer',
      
      // نتائج سلبية
      'غير مهتم': 'not_interested',
      'غير مهتم نهائياً': 'not_interested',
      'رقم خطأ': 'not_interested',
      
      // نتائج نجاح
      'محول': 'converted',
      'مكتمل': 'converted'
    }
    
    return mappings[arabicResult] || 'interested' // default fallback
  }

  // معالجة نتيجة المودال
  const handleFollowUpResult = async (followUpId, result, notes) => {
    if (!currentFollowUp) return

    try {
      const followUp = currentFollowUp
      
      // تحويل النتيجة العربية إلى إنجليزية
      const englishOutcome = mapArabicOutcomeToEnglish(result)
      console.log('🔄 Mapping result:', result, '→', englishOutcome)
      
      // استدعاء API مع النتيجة المحولة
      const response = await api.completeFollowUp(followUpId, {
        notes: notes || `تم إكمال المتابعة - ${result}`,
        outcome: englishOutcome,
        next_action: `متابعة بناءً على النتيجة: ${result}`
      })
      
      console.log('✅ Complete follow-up response:', response)
      
      // إرسال إشعار للمديرين عن النتيجة الإيجابية
      if ((currentUser?.role === 'sales' || currentUser?.role === 'sales_agent') && 
          ['مهتم', 'مهتم جداً', 'طلب عرض سعر', 'يريد اجتماع', 'محول', 'مكتمل'].includes(result)) {
        const clientName = followUp.lead?.name || followUp.client?.name || 'عميل غير محدد'
        await sendFollowUpCompletedNotification(followUp.title, clientName, `${result} - تم جدولة المتابعة التالية`)
        console.log('📤 Positive follow-up result notification sent to managers')
      }
      
      if (response.success) {
        if (response.data?.nextFollowUp) {
          const nextTitle = response.data.nextFollowUp.title
          const nextDate = new Date(response.data.nextFollowUp.scheduledDate).toLocaleDateString('ar-EG')
          toast.success(`✅ تم إكمال المتابعة وجدولة: "${nextTitle}" في ${nextDate}`)
          console.log('🎯 Next follow-up created:', nextTitle)
        } else {
          toast.success(`تم إكمال المتابعة بنجاح - ${result} ✅`)
        }
        
        // تحديث حالة العميل المحتمل حسب النتيجة
        if (result === 'غير مهتم' || result === 'غير مهتم نهائياً') {
          try {
            await api.updateLead(followUp.leadId, { 
              status: 'not_interested',
              notes: `العميل غير مهتم - تم إيقاف المتابعات${notes ? `\n\nملاحظات إضافية: ${notes}` : ''}`
            })
          } catch (error) {
            console.log('Failed to update lead status:', error)
          }
        } else if (result === 'محول' || result === 'مكتمل') {
          try {
            await api.updateLead(followUp.leadId, { 
              status: 'converted',
              notes: `تم تحويل العميل المحتمل إلى عميل${notes ? `\n\nملاحظات: ${notes}` : ''}`
            })
          } catch (error) {
            console.log('Failed to update lead status:', error)
          }
        }
        
      } else {
        toast.error('فشل في إكمال المتابعة')
      }
      
      // إعادة تحميل البيانات وإغلاق المودال
      console.log('🔄 Refreshing follow-ups list...')
      await fetchFollowUps()
      setShowResultModal(false)
      setCurrentFollowUp(null)
      
      // إضافة تأخير قصير لضمان تحديث UI
      setTimeout(() => {
        console.log('✅ Follow-ups list refreshed')
      }, 500)
      
    } catch (error) {
      console.error('Error handling follow-up result:', error)
      toast.error('فشل في معالجة نتيجة المتابعة')
    }
  }

  const handleDeleteFollowUp = async () => {
    if (!followUpToDelete) return

    try {
      toast.loading('جاري أرشفة المتابعة...', { id: 'single-delete' })
      
      // المرحلة الأولى: أرشفة المتابعة (soft delete)
      await api.deleteFollowUp(followUpToDelete.id)
      
      toast.loading('جاري الحذف النهائي...', { id: 'single-delete' })
      
      // المرحلة الثانية: الحذف النهائي (permanent delete)
      await api.permanentDeleteFollowUp(followUpToDelete.id)
      
      toast.success('تم حذف المتابعة نهائياً', { id: 'single-delete' })
      setShowDeleteDialog(false)
      setFollowUpToDelete(null)
      fetchFollowUps()
    } catch (error) {
      console.error('Error permanently deleting follow-up:', error)
      toast.error('فشل في حذف المتابعة', { id: 'single-delete' })
    }
  }

  // الحذف المتعدد للمتابعات (أرشفة ثم حذف نهائي)
  const handleBulkDelete = async () => {
    if (selectedFollowUps.length === 0) return
    
    try {
      toast.loading('جاري أرشفة المتابعات...', { id: 'bulk-delete' })
      
      // المرحلة الأولى: أرشفة المتابعات (soft delete)
      const archivePromises = selectedFollowUps.map(followUpId => api.deleteFollowUp(followUpId))
      await Promise.all(archivePromises)
      
      toast.loading('جاري الحذف النهائي...', { id: 'bulk-delete' })
      
      // المرحلة الثانية: الحذف النهائي (permanent delete)
      const permanentDeletePromises = selectedFollowUps.map(followUpId => api.permanentDeleteFollowUp(followUpId))
      await Promise.all(permanentDeletePromises)
      
      toast.success(`تم حذف ${selectedFollowUps.length} متابعة نهائياً`, { id: 'bulk-delete' })
      setSelectedFollowUps([])
      setShowBulkDeleteConfirm(false)
      fetchFollowUps()
    } catch (error) {
      console.error('خطأ في الحذف المتعدد:', error)
      toast.error('حدث خطأ أثناء حذف بعض المتابعات', { id: 'bulk-delete' })
    }
  }

  // التحكم في التحديد المتعدد
  const handleSelectAll = (checked) => {
    if (checked) {
      const visibleFollowUpIds = filteredFollowUps.map(f => f.id)
      setSelectedFollowUps(visibleFollowUpIds)
    } else {
      setSelectedFollowUps([])
    }
  }

  const handleSelectFollowUp = (followUpId, checked) => {
    if (checked) {
      setSelectedFollowUps(prev => [...prev, followUpId])
    } else {
      setSelectedFollowUps(prev => prev.filter(id => id !== followUpId))
    }
  }

  const clearSelection = () => {
    setSelectedFollowUps([])
  }


  // Filter follow-ups using useMemo for performance

  const filteredFollowUps = useMemo(() => {
    console.log('🔍 getFilteredFollowUps: Starting with', followUps.length, 'follow-ups');
    
    // التحقق من وجود تكرار في followUps الأصلي
    const originalIds = followUps.map(f => f.id);
    const uniqueOriginalIds = [...new Set(originalIds)];
    if (originalIds.length !== uniqueOriginalIds.length) {
      console.error('❌ DUPLICATES FOUND in original followUps array!', originalIds.length - uniqueOriginalIds.length, 'duplicates');
      console.error('🔍 Duplicate IDs:', originalIds.filter((id, index, arr) => arr.indexOf(id) !== index));
    }
    
    let filtered = followUps

    // Apply active filter
    if (activeFilter !== 'all') {
      switch (activeFilter) {
        case 'scheduled':
          filtered = filtered.filter(f => f.status === 'scheduled')
          break
        case 'completed':
          filtered = filtered.filter(f => f.status === 'completed')
          break
        case 'missed':
          filtered = filtered.filter(f => f.status === 'missed')
          break
        case 'overdue':
          const now = new Date()
          filtered = filtered.filter(f => {
            if (f.status === 'completed') return false
            const scheduledDate = new Date(f.scheduledDate)
            return scheduledDate < now
          })
          break
        case 'today':
          const today = new Date()
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
          filtered = filtered.filter(f => {
            const scheduledDate = new Date(f.scheduledDate)
            return scheduledDate >= startOfDay && scheduledDate < endOfDay
          })
          break
      }
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.lead?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(f => f.priority === priorityFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(f => f.type === typeFilter)
    }

    // ترتيب المتابعات: المجدولة أولاً، ثم المكتملة في النهاية
    const sortedFiltered = filtered.sort((a, b) => {
      // الأولوية الأولى: الحالة (المكتملة تنزل تحت)
      const statusPriority = {
        'scheduled': 1,
        'in_progress': 2,
        'overdue': 3,
        'missed': 4,
        'completed': 5  // المكتملة في النهاية
      }
      
      const aStatusPriority = statusPriority[a.status] || 3
      const bStatusPriority = statusPriority[b.status] || 3
      
      if (aStatusPriority !== bStatusPriority) {
        return aStatusPriority - bStatusPriority
      }
      
      // الأولوية الثانية: التاريخ المجدول (الأقرب أولاً)
      const aDate = new Date(a.scheduledDate)
      const bDate = new Date(b.scheduledDate)
      
      return aDate - bDate
    });
    
    // التحقق من وجود تكرار في النتيجة النهائية
    const finalIds = sortedFiltered.map(f => f.id);
    const uniqueFinalIds = [...new Set(finalIds)];
    if (finalIds.length !== uniqueFinalIds.length) {
      console.error('❌ DUPLICATES FOUND in final filtered array!', finalIds.length - uniqueFinalIds.length, 'duplicates');
      console.error('🔍 Final Duplicate IDs:', finalIds.filter((id, index, arr) => arr.indexOf(id) !== index));
    }
    
    console.log('✅ getFilteredFollowUps: Returning', sortedFiltered.length, 'follow-ups');
    return sortedFiltered;
  }, [followUps, activeFilter, searchQuery, priorityFilter, statusFilter, typeFilter])

  const formatFollowUpDate = (dateString) => {
    if (!dateString) return 'غير محدد'
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    let timeClass = ''
    let timeText = ''
    
    if (diffDays < 0) {
      timeClass = 'text-red-600'
      timeText = `متأخر ${Math.abs(diffDays)} يوم`
    } else if (diffDays === 0) {
      timeClass = 'text-orange-600'
      timeText = 'اليوم'
    } else if (diffDays === 1) {
      timeClass = 'text-blue-600'
      timeText = 'غداً'
    } else {
      timeClass = 'text-gray-600'
      timeText = `خلال ${diffDays} يوم`
    }
    
    return (
      <div className="text-sm">
        <div className="text-gray-900">{formatDateArabic(date)}</div>
        <div className={`text-xs ${timeClass} font-medium`}>{timeText}</div>
      </div>
    )
  }

  const getTypeInfo = (type) => {
    return typeOptions.find(opt => opt.value === type) || { label: type, color: 'from-gray-500 to-gray-600', icon: Phone }
  }

  const getStatusInfo = (status) => {
    return statusOptions.find(opt => opt.value === status) || { label: status, color: 'from-gray-500 to-gray-600', icon: Clock }
  }

  const getPriorityInfo = (priority) => {
    return priorityOptions.find(opt => opt.value === priority) || { label: priority, color: 'from-gray-500 to-gray-600', icon: Flag }
  }

  if (loading) {
    return <LoadingPage />
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 via-white to-gray-100 min-h-screen">
        {/* Enhanced Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      {currentUser?.role === 'manager' || currentUser?.role === 'admin' 
                        ? 'إدارة المتابعات' 
                        : 'متابعاتي الشخصية'}
                    </h1>
                    <p className="text-green-100 text-lg">
                      {currentUser?.role === 'manager' || currentUser?.role === 'admin' 
                        ? `جميع المتابعات - ${currentUser?.displayName || currentUser?.name || 'المدير'}` 
                        : `المتابعات المخصصة لك - ${currentUser?.displayName || currentUser?.name || 'المستخدم الحالي'}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    📅 {new Date().toLocaleDateString('ar-EG', { 
                      timeZone: 'Africa/Cairo',
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    🕐 {new Date().toLocaleTimeString('ar-EG', { 
                      timeZone: 'Africa/Cairo',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  {/* طريقة العرض */}
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">طريقة العرض:</span>
                    <div className="flex bg-white bg-opacity-20 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grouped')}
                        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                          viewMode === 'grouped'
                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                            : 'text-white hover:bg-white hover:bg-opacity-20'
                        }`}
                      >
                        📊 مجمع حسب العميل
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
                          viewMode === 'list'
                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                            : 'text-white hover:bg-white hover:bg-opacity-20'
                        }`}
                      >
                        📋 قائمة تفصيلية
                      </button>
                    </div>
                  </div>

                </div>

                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-teal-600 hover:bg-teal-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-teal-100 hover:border-teal-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-teal-100 rounded-lg">
                      <Plus className="h-4 w-4 text-teal-600" />
                    </div>
                    <span className="font-bold">إضافة متابعة جديدة</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>


        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* إجمالي المتابعات */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs font-medium">إجمالي المتابعات</p>
                  <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
                <div className="bg-white h-1 rounded-full w-full"></div>
              </div>
              <p className="text-blue-100 text-xs">جميع المتابعات</p>
            </div>
          </Card>

          {/* مجدولة */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-xs font-medium">مجدولة</p>
                  <p className="text-2xl font-bold text-white">{stats.scheduled || 0}</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
                <div className="bg-white h-1 rounded-full w-3/4"></div>
              </div>
              <p className="text-purple-100 text-xs">في الانتظار</p>
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

          {/* اليوم */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-xs font-medium">اليوم</p>
                  <p className="text-2xl font-bold text-white">{stats.today || 0}</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
                <div className="bg-white h-1 rounded-full w-2/3"></div>
              </div>
              <p className="text-orange-100 text-xs">اليوم</p>
            </div>
          </Card>

          {/* فائتة */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500 to-amber-600 text-white hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 cursor-pointer">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-yellow-100 text-xs font-medium">فائتة</p>
                  <p className="text-2xl font-bold text-white">{stats.missed || 0}</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
                <div className="bg-white h-1 rounded-full w-1/2"></div>
              </div>
              <p className="text-yellow-100 text-xs">لم تتم</p>
            </div>
          </Card>
        </div>

        {/* Follow-ups List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle>قائمة المتابعات ({filteredFollowUps?.length || 0})</CardTitle>
                <p className="text-sm text-gray-600">{totalItems || 0} متابعة نشطة</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* البحث */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث سريع..."
                    className="pl-10 pr-10 h-8 w-48 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* اختيار حجم الصفحة - تصميم أنيق */}
                <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-1">
                  <span className="text-blue-700 text-xs font-medium">عرض:</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-transparent border-0 text-blue-700 text-xs rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                  <span className="text-blue-700 text-xs font-medium">متابعة</span>
                </div>

                {/* الفلاتر */}
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-xs"
                >
                  <option value="all">جميع الحالات</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-xs"
                >
                  <option value="all">جميع الأنواع</option>
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select 
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-xs"
                >
                  <option value="all">جميع الأولويات</option>
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <Button 
                  onClick={fetchFollowUps} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                >
                  <RefreshCw className="h-3 w-3 ml-1" />
                  تحديث
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* شريط التحديد المتعدد - يظهر في list mode فقط */}
          {viewMode === 'list' && (
            <>
              {/* شريط المتابعات المحددة */}
              {selectedFollowUps.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-blue-900">
                        تم تحديد {selectedFollowUps.length} متابعة
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
                        حذف نهائياً
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* شريط التحديد الكامل - يظهر فقط عند وجود متابعات */}
              {filteredFollowUps.length > 0 && (
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="select-all-followups"
                        className="rounded border-gray-300"
                        checked={filteredFollowUps.length > 0 && selectedFollowUps.length === filteredFollowUps.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                      <label htmlFor="select-all-followups" className="text-sm font-medium text-gray-700 cursor-pointer">
                        تحديد جميع المتابعات المعروضة ({filteredFollowUps.length})
                      </label>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      {selectedFollowUps.length > 0 ? `${selectedFollowUps.length} محدد` : 'لا يوجد تحديد'}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <CardContent className="p-0">
            {filteredFollowUps.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">لا توجد متابعات</p>
                <p className="text-sm">ابدأ بإضافة متابعة جديدة</p>
              </div>
            ) : viewMode === 'grouped' ? (
              <div className="p-4">
                <GroupedFollowUpsTable
                  followUps={filteredFollowUps}
                  onEdit={(followUp) => {
                    setSelectedFollowUp(followUp)
                    setShowEditModal(true)
                  }}
                  onDelete={(followUp) => {
                    setFollowUpToDelete(followUp)
                    setShowDeleteDialog(true)
                  }}
                  onComplete={handleCompleteFollowUp}
                  onView={(followUp) => {
                    setSelectedFollowUp(followUp)
                    setShowDetailsModal(true)
                  }}
                  currentUser={currentUser}
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredFollowUps.map((followUp, index) => {
                  const typeInfo = getTypeInfo(followUp.type)
                  const statusInfo = getStatusInfo(followUp.status)
                  const priorityInfo = getPriorityInfo(followUp.priority)
                  const IconComponent = typeInfo.icon

                  return (
                    <div key={`followup-${followUp.id}-${index}`} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start space-x-3 rtl:space-x-reverse">
                            {/* Checkbox للتحديد */}
                            <div className="flex-shrink-0 pt-1">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={selectedFollowUps.includes(followUp.id)}
                                onChange={(e) => handleSelectFollowUp(followUp.id, e.target.checked)}
                              />
                            </div>
                            <div className="flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${typeInfo.color} flex items-center justify-center`}>
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">
                                {followUp.title}
                              </h3>
                              
                              {followUp.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {followUp.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2">
                                <Badge className={`bg-gradient-to-r ${typeInfo.color} text-white`}>
                                  {typeInfo.label}
                                </Badge>
                                
                                <Badge className={`bg-gradient-to-r ${statusInfo.color} text-white`}>
                                  {statusInfo.label}
                                </Badge>
                                
                                <Badge className={`bg-gradient-to-r ${priorityInfo.color} text-white`}>
                                  {priorityInfo.label}
                                </Badge>
                                
                                {followUp.isAutoGenerated && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    تلقائي
                                  </Badge>
                                )}
                              </div>
                              
                              {(followUp.lead || followUp.client) && (
                                <div className="space-y-1 mt-2 text-sm text-gray-500">
                                  {followUp.lead && (
                                    <div className="space-y-1">
                                      <div className="flex items-center">
                                        <Target className="w-3 h-3 ml-1" />
                                        <span>عميل محتمل: {followUp.lead.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs">
                                        <div className="flex items-center">
                                          <Phone className="w-3 h-3 ml-1" />
                                          <span>الهاتف: {followUp.lead.phone || 'غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <User className="w-3 h-3 ml-1" />
                                          <span>المسؤول: {getResponsibleEmployeeName(followUp)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                      {followUp.client && (
                                    <div className="space-y-1">
                                      <div className="flex items-center">
                                        <User className="w-3 h-3 ml-1" />
                                        <span>عميل: {followUp.client.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs">
                                        <div className="flex items-center">
                                          <Phone className="w-3 h-3 ml-1" />
                                          <span>الهاتف: {followUp.client.phone || 'غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <User className="w-3 h-3 ml-1" />
                                          <span>المسؤول: {getResponsibleEmployeeName(followUp)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0 text-right">
                          {formatFollowUpDate(followUp.scheduledDate)}
                          
                          <div className="mt-2 flex items-center gap-1">
                            {followUp.status === 'scheduled' && (
                              <button
                                className="h-7 px-2 text-green-600 hover:text-green-700 bg-white border border-gray-300 rounded hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                onClick={() => handleCompleteFollowUp(followUp)}
                                title="إكمال المتابعة"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </button>
                            )}
                            
                            <button
                              className="h-7 px-2 text-blue-600 hover:text-blue-700 bg-white border border-gray-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                              onClick={() => {
                                setSelectedFollowUp(followUp)
                                setShowDetailsModal(true)
                              }}
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            
                            {followUp.status !== 'completed' && (
                              <button
                                className="h-7 px-2 text-purple-600 hover:text-purple-700 bg-white border border-gray-300 rounded hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                                onClick={() => {
                                  setSelectedFollowUp(followUp)
                                  setShowEditModal(true)
                                }}
                                title="تعديل المتابعة"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                            
                            {/* Show delete button for users with follow-up access */}
                            {(currentUser?.role === 'admin' || currentUser?.role === 'manager' || checkPermission('view_follow_ups') || checkPermission('manage_clients')) && (
                              <button
                                className="h-7 px-2 text-red-600 hover:text-red-700 bg-white border border-gray-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                onClick={() => {
                                  setFollowUpToDelete(followUp)
                                  setShowDeleteDialog(true)
                                }}
                                title="حذف المتابعة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* منطقة الترقيم */}
        {totalPages > 1 && (
          <Card className="bg-white border-0 shadow-md rounded-xl mt-6">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span>عرض {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)}</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
                    الصفحة {currentPage} من {totalPages}
                  </Badge>
                </div>
                
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  السابق
                </button>
                
                {/* أرقام الصفحات */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                        pageNum === currentPage
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                          : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
                >
                  التالي
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Add Follow-up Modal */}
        {showAddModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              {/* Enhanced Header */}
              <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-6 rounded-t-xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">إضافة متابعة جديدة</h3>
                      <p className="text-green-100 text-sm">املأ البيانات الأساسية للمتابعة</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateFollowUp} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        نوع المتابعة *
                      </label>
                    <select
                      value={newFollowUp.type}
                      onChange={(e) => setNewFollowUp(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">اختر نوع المتابعة</option>
                      {typeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Flag className="h-4 w-4 text-green-500" />
                        الأولوية *
                      </label>
                    <select
                      value={newFollowUp.priority}
                      onChange={(e) => setNewFollowUp(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">اختر الأولوية</option>
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Target className="h-4 w-4 text-green-500" />
                      عنوان المتابعة *
                    </label>
                  <Input
                    id="title"
                    value={newFollowUp.title}
                    onChange={(e) => setNewFollowUp(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان المتابعة..."
                    required
                  />
                </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      الوصف (اختياري)
                    </label>
                  <Textarea
                    id="description"
                    value={newFollowUp.description}
                    onChange={(e) => setNewFollowUp(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="تفاصيل المتابعة..."
                    rows={3}
                  />
                </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      الموعد المحدد *
                    </label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={newFollowUp.scheduledDate}
                    onChange={(e) => setNewFollowUp(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    required
                  />
                </div>
                
                  {/* Client/Lead Selection Section */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-800">ربط المتابعة بعميل</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-600">
                        يمكنك ربط هذه المتابعة بعميل محتمل أو عميل حالي. اختيار أحدهما سيلغي الآخر تلقائياً.
                      </p>
                      <button
                        type="button"
                        onClick={loadDropdownData}
                        disabled={dataLoading}
                        className="px-3 py-1 text-sm text-blue-600 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {dataLoading ? (
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4" />
                            تحديث
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User className="h-4 w-4 text-green-500" />
                        عميل محتمل
                      </label>
                      <select
                        value={newFollowUp.leadId}
                        onChange={(e) => {
                          const value = e.target.value
                          setNewFollowUp(prev => ({ 
                            ...prev, 
                            leadId: value,
                            clientId: value !== 'none' ? 'none' : prev.clientId // Clear client if lead is selected
                          }))
                        }}
                        disabled={dataLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="none">لا يوجد</option>
                        {dataLoading ? (
                          <option disabled>جاري التحميل...</option>
                        ) : leads.length === 0 ? (
                          <option disabled>لا توجد عملاء محتملين</option>
                        ) : (
                          leads.map(lead => (
                            <option key={lead.id} value={lead.id.toString()}>
                              {lead.name} {lead.phone && `- ${lead.phone}`}
                            </option>
                          ))
                        )}
                      </select>
                  </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Users className="h-4 w-4 text-green-500" />
                        عميل
                      </label>
                      <select
                        value={newFollowUp.clientId}
                        onChange={(e) => {
                          const value = e.target.value
                          setNewFollowUp(prev => ({ 
                            ...prev, 
                            clientId: value,
                            leadId: value !== 'none' ? 'none' : prev.leadId // Clear lead if client is selected
                          }))
                        }}
                        disabled={dataLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="none">لا يوجد</option>
                        {dataLoading ? (
                          <option disabled>جاري التحميل...</option>
                        ) : clients.length === 0 ? (
                          <option disabled>لا توجد عملاء</option>
                        ) : (
                          clients.map(client => (
                            <option key={client.id} value={client.id.toString()}>
                              {client.name} {client.phone && `- ${client.phone}`}
                            </option>
                          ))
                        )}
                      </select>
                  </div>
                </div>

                </div>
                
                {/* Enhanced Footer with Buttons */}
                <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-2 rtl:space-x-reverse">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    disabled={isSubmitting}
                    className="min-w-[100px] px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || dataLoading}
                    className="min-w-[120px] px-4 py-2 text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        إنشاء المتابعة
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          title="تأكيد الحذف النهائي"
          message={`هل أنت متأكد من حذف المتابعة "${followUpToDelete?.title}" نهائياً؟ سيتم حذفها بشكل دائم ولن تظهر في الأرشيف. لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف نهائياً"
          cancelText="إلغاء"
          onConfirm={handleDeleteFollowUp}
          type="danger"
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showBulkDeleteConfirm}
          onClose={() => setShowBulkDeleteConfirm(false)}
          onConfirm={handleBulkDelete}
          title="حذف المتابعات المحددة نهائياً"
          message={`هل أنت متأكد من رغبتك في حذف ${selectedFollowUps.length} متابعة نهائياً؟ سيتم حذفها بشكل دائم ولن تظهر في الأرشيف. لا يمكن التراجع عن هذا الإجراء.`}
          confirmText="حذف نهائياً"
          cancelText="إلغاء"
          type="danger"
        />

        {/* Follow-up Result Modal */}
        <FollowUpResultModal
          isOpen={showResultModal}
          onClose={() => {
            setShowResultModal(false)
            setCurrentFollowUp(null)
          }}
          followUp={currentFollowUp}
          onResult={handleFollowUpResult}
        />

        {/* Edit Follow-up Modal */}
        <EditFollowUpModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedFollowUp(null)
          }}
          followUp={selectedFollowUp}
          onSave={handleSaveEdit}
        />

        {/* Follow-up Details Modal */}
        <FollowUpDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedFollowUp(null)
          }}
          followUp={selectedFollowUp}
        />
      </div>
    </ErrorBoundary>
  )
}





