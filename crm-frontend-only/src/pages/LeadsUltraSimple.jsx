import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Star,
  Eye,
  MoreHorizontal,
  UserPlus,
  UserCheck,
  UserX,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Shuffle,
  Upload,
  Download,
  FileText,
  AlertCircle,
  Zap,
  Timer,
  Award,
  BarChart3,
  Target
} from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useApi, usePaginatedApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
// تم حذف خدمات الإشعارات مؤقتاً
import { formatDateArabic, formatPhoneNumber } from '../lib/utils'
import LoadingPage from '../components/ui/loading'
import { autoFollowUpService } from '../services/autoFollowUpService'
import LeadsTable from '../components/tables/LeadsTable'
import LeadsDetailsModal from '../components/modals/LeadsDetailsModal'
import SimpleAddReminderModal from '../components/reminders/SimpleAddReminderModal'
import QuickReminderModal from '../components/reminders/QuickReminderModal'
import RatingViewModal from '../components/modals/RatingViewModal'
import RatingUpdateModal from '../components/modals/RatingUpdateModal'
import LeadAssignmentModal from '../components/modals/LeadAssignmentModal'
// تم حذف زر التذكير السريع مؤقتاً
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import { useAllLeadNotes, useAllLeadInteractions } from '../hooks/useNotes'
import toast from 'react-hot-toast'

function LeadsUltraSimple() {
  const { currentUser, userProfile } = useAuth()
  const { notifyNewLead, notifyLeadConverted, notifySuccess, notifyError } = useNotifications()
  const { sendLeadConvertedNotification, sendNewLeadNotification, sendInteractionAddedNotification, sendNoteAddedNotification } = useSSENotificationSender()
  const api = useApi()
  const navigate = useNavigate()
  const {
    data: leads,
    pagination,
    loading,
    error,
    updateParams,
    nextPage,
    prevPage,
    refetch
  } = usePaginatedApi(api.getLeads, { page: 1, limit: 100 })
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState(100) // عدد العملاء في الصفحة
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  // دالة تغيير حجم الصفحة
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    updateParams({ page: 1, limit: newSize }) // العودة للصفحة الأولى مع الحجم الجديد
  }
  const [quickSearchTerm, setQuickSearchTerm] = useState('')
  
  // جلب الملاحظات والتفاعلات للعدادات
  const leadIds = leads?.map(lead => lead.id) || []
  const { allNotes: leadNotes = {}, loading: notesLoading } = useAllLeadNotes(leadIds)
  const { allInteractions: leadInteractions = {}, loading: interactionsLoading } = useAllLeadInteractions(leadIds)
  
  // استيراد نظام الصلاحيات
  const { 
    isAdmin, 
    isSalesManager, 
    isSales, 
    checkPermission,
    filterByRole 
  } = usePermissions()

  // دوال التحقق من الصلاحيات للعملاء المحتملين
  const canViewAllLeads = () => {
    return isAdmin() || checkPermission('view_all_leads')
  }

  const canCreateLead = () => {
    return isAdmin() || checkPermission('create_leads')
  }

  const canEditLead = (lead) => {
    if (!lead) return false
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('edit_leads')
    if (isSales()) {
      const hasPermission = checkPermission('edit_leads')
      if (!hasPermission) return false
      return lead.assignedTo === currentUser?.uid || lead.createdBy === currentUser?.uid
    }
    return false
  }

  const canDeleteLead = (lead) => {
    if (!lead) return false
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('delete_leads')
    if (isSales()) {
      const hasPermission = checkPermission('delete_leads')
      if (!hasPermission) return false
      return lead.assignedTo === currentUser?.uid || lead.createdBy === currentUser?.uid
    }
    return false
  }

  const canConvertLead = useMemo(() => {
    return (lead) => {
    if (!lead) return false
    if (isAdmin()) return true
      if (isSalesManager()) return checkPermission('convert_leads')
      
      // السماح لموظفي المبيعات بتحويل العملاء المحتملين المخصصين لهم أو الذين أنشأوهم
      if (isSales()) {
        // فحص الصلاحية أولاً
    const hasPermission = checkPermission('convert_leads')
    if (!hasPermission) return false
        
        // ثم فحص الملكية - استخدام multiple identifiers
        const userId = currentUser?.uid || currentUser?.id || userProfile?.id
        const userEmail = currentUser?.email || userProfile?.email
        const userName = userProfile?.displayName || userProfile?.name || currentUser?.displayName
        
        // Ownership check with multiple identifiers - convert to strings for comparison
        const leadAssignedTo = String(lead.assignedTo || '')
        const leadCreatedBy = String(lead.createdBy || '')
        
        return leadAssignedTo === String(userId || '') || 
               leadAssignedTo === String(userEmail || '') || 
               leadAssignedTo === String(userName || '') ||
               leadCreatedBy === String(userId || '') ||
               leadCreatedBy === String(userEmail || '') ||
               leadCreatedBy === String(userName || '')
      }
      return checkPermission('convert_leads')
    }
  }, [isAdmin, isSalesManager, isSales, checkPermission, currentUser, userProfile])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [viewingLead, setViewingLead] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState(null)
  const [showConvertConfirm, setShowConvertConfirm] = useState(false)
  
  // مودال التذكير السريع
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false)
  const [selectedLeadForReminder, setSelectedLeadForReminder] = useState(null)
  const [leadToConvert, setLeadToConvert] = useState(null)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [reminderForLead, setReminderForLead] = useState(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingForLead, setRatingForLead] = useState(null)
  const [showUpdateRatingModal, setShowUpdateRatingModal] = useState(false)
  const [updateRatingForLead, setUpdateRatingForLead] = useState(null)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  
  // Lead assignment state
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [salesUsers, setSalesUsers] = useState([])
  
  // Fetch sales users from API
  useEffect(() => {
    const fetchSalesUsers = async () => {
      try {
        const response = await api.getUsers({ status: 'active' })
        if (response.success && response.data) {
          // فلترة المستخدمين للحصول على sales فقط (بدون مديري المبيعات)
          const salesUsersData = response.data
            .filter(user => user.role === 'sales' || user.role === 'sales_agent')
            .map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            leadsCount: 0, // Will be updated from leads data
            salesCount: 0  // Will be updated from sales data
            }))
          setSalesUsers(salesUsersData)

        }
      } catch (error) {
        console.error('Error fetching sales users:', error)
        // Fallback to empty array
        setSalesUsers([])
      }
    }
    
    fetchSalesUsers()
  }, [])

  // Component لعرض عدد العملاء غير المخصصين
  const UnassignedLeadsCount = () => {
    const [count, setCount] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const fetchUnassignedCount = async () => {
        try {
          setLoading(true)

          const response = await api.getLeads({ limit: 10000 })
          if (response.success && response.data) {

            const unassignedCount = response.data.filter(lead => {
              const isUnassigned = !lead.assignedTo || lead.assignedTo === '' || lead.assignedTo === null
              if (isUnassigned) {

              }
              return isUnassigned
            }).length

            setCount(unassignedCount)
          }
        } catch (error) {
          console.error('❌ Error fetching unassigned leads count:', error)
          setCount(0)
        } finally {
          setLoading(false)
        }
      }

      fetchUnassignedCount()
    }, []) // تأكد من عدم وجود dependencies إضافية

    if (loading) return <span className="animate-pulse">...</span>
    return <span>{count}</span>
  }

  // Component بسيط لعرض عدد العملاء غير المخصصين بدون API calls إضافية
  const UnassignedLeadsCountSimple = ({ leads }) => {
    const unassignedCount = useMemo(() => {
      if (!leads || leads.length === 0) return 0
      
      const count = leads.filter(lead => 
        // استبعاد العملاء المحولين
        (lead.status !== 'converted' && lead.status !== 'محول') &&
        // العملاء غير المخصصين
        (!lead.assignedTo || lead.assignedTo === '' || lead.assignedTo === null)
      ).length
      

      return count
    }, [leads])

    return <span>{unassignedCount}</span>
  }

  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [bulkImportSource, setBulkImportSource] = useState('')

  const [selectedLeads, setSelectedLeads] = useState([])

  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'بارد',
    score: 0,
    notes: '',
    interests: [],
    clientType: 'فردي',
    assignedTo: '',
    priority: 'متوسطة'
  })

  // دالة التوزيع التلقائي
  const handleAutoDistribute = async () => {
    try {
      // استخدام salesUsers من الـ state (موظفي مبيعات فقط، بدون مديرين)
      const allSalesStaff = salesUsers.filter(user => user.role === 'sales' || user.role === 'sales_agent')

      
      if (allSalesStaff.length === 0) {
        toast.error('لا يوجد موظفي مبيعات متاحين للتوزيع')
        return
      }

      // جلب جميع العملاء المحتملين غير المخصصين من الـ API (بدون حد pagination)

      const allLeadsResponse = await api.getLeads({ limit: 10000 }) // رقم كبير لجلب الكل
      

      
      if (!allLeadsResponse || !allLeadsResponse.data) {
        toast.error('فشل في جلب العملاء المحتملين')
        console.error('❌ Invalid API response:', allLeadsResponse)
        return
      }

      // فلترة العملاء المحتملين غير المخصصين فقط
      const unassignedLeads = allLeadsResponse.data.filter(lead => 
        !lead.assignedTo || lead.assignedTo === '' || lead.assignedTo === null
      )



      if (unassignedLeads.length === 0) {
        toast.error('لا يوجد عملاء محتملين للتوزيع')
        return
      }

      // توزيع العملاء بالعدل باستخدام Round Robin Algorithm
      const updates = []
      for (let i = 0; i < unassignedLeads.length; i++) {
        const assignedEmployee = allSalesStaff[i % allSalesStaff.length]
        updates.push({
          leadId: unassignedLeads[i].id,
          assignedTo: assignedEmployee.id,
          assignedToName: assignedEmployee.name
        })
      }

      // تطبيق التحديثات وإنشاء متابعات تلقائية
      const followUpAssignments = []
      for (const update of updates) {
        await api.updateLead(update.leadId, {
          assignedTo: update.assignedTo,
          assignedToName: update.assignedToName,
          updatedAt: new Date()
        })
        
        // إضافة للمتابعات التلقائية
        followUpAssignments.push({
          leadId: update.leadId,
          leadName: unassignedLeads.find(l => l.id === update.leadId)?.name || 'غير محدد',
          assignedTo: update.assignedTo
        })
      }

      // إنشاء متابعات تلقائية للعملاء المحتملين الموزعين
      try {
        console.log('🎯 إنشاء متابعات تلقائية للعملاء الموزعين...')
        const followUpResults = await autoFollowUpService.distributeFollowUpsWithLeads(
          followUpAssignments,
          currentUser?.id
        )
        
        console.log('📋 Follow-up distribution result:', followUpResults)
        
        if (followUpResults.success) {
          const createdFollowUps = followUpResults.data || []
          console.log(`✅ تم إنشاء ${createdFollowUps.length} متابعة تلقائية من أصل ${followUpAssignments.length}`)
        } else {
          console.error('❌ فشل في إنشاء المتابعات:', followUpResults.message)
        }
        
      } catch (followUpError) {
        console.error('⚠️ خطأ في إنشاء المتابعات التلقائية:', followUpError)
        // لا نوقف العملية، فقط نسجل الخطأ
      }

      toast.success(`تم توزيع ${unassignedLeads.length} عميل محتمل على ${allSalesStaff.length} موظف مبيعات بنجاح`)
      setShowDistributeModal(false)
      refetch() // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ في التوزيع التلقائي:', error)
      toast.error('فشل في التوزيع التلقائي')
    }
  }

  // Filter leads with additional permission check
  const filteredLeads = leads?.filter(lead => {
    // فلترة أساسية (البحث والحالة والمصدر)
    const matchesSearch = lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.phone?.includes(searchTerm)
    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource
    
    // فلترة الصلاحيات
    let hasPermission = false
    if (canViewAllLeads()) {
      // إذا كان له صلاحية رؤية جميع العملاء المحتملين
      hasPermission = true
    } else if (isSales()) {
      // موظفو المبيعات يرون عملاءهم المخصصين أو الذين أنشؤوهم
      const userId = currentUser?.id || currentUser?.uid || userProfile?.id
      // استخدام == بدلاً من === للمقارنة بغض النظر عن نوع البيانات (string vs number)
      hasPermission = (lead.createdBy == userId || lead.assignedTo == userId)
    }
    
    return matchesSearch && matchesStatus && matchesSource && hasPermission
  }) || []
  
  // ثم استبعاد العملاء المحولين من النتيجة النهائية (بعد فلترة الصلاحيات)
  const finalFilteredLeads = filteredLeads.filter(lead => 
    lead.status !== 'converted' && lead.status !== 'محول'
  )
  
  


  const handleAddLead = async (e) => {
    e.preventDefault()
    try {
      // Validate required fields
      if (!newLead.name || newLead.name.length < 2) {
        toast.error('اسم العميل المحتمل مطلوب ويجب أن يكون على الأقل حرفين')
        return
      }
      if (!newLead.phone || newLead.phone.length < 10) {
        toast.error('رقم الهاتف مطلوب ويجب أن يكون على الأقل 10 أرقام')
        return
      }
      if (!newLead.source) {
        newLead.source = 'website' // Default source
      }
      if (!newLead.assignedTo) {
        toast.error('يجب اختيار الموظف المسؤول')
        return
      }
      if (newLead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newLead.email)) {
        toast.error('البريد الإلكتروني غير صحيح')
        return
      }

      // Map Arabic values to English for backend
      const mapStatus = (status) => {
        const statusMap = {
          'بارد': 'new',
          'فاتر': 'contacted', 
          'مهتم': 'interested',
          'ساخن': 'qualified',
          'مؤهل': 'qualified',
          'محول': 'converted',
          'مفقود': 'lost'
        }
        return statusMap[status] || status || 'new'
      }

      const mapSource = (source) => {
        // Keep the source as is, just make sure it's not empty
        return source && source.trim() ? source.trim() : 'غير محدد'
      }

      // Clean data for backend
      const leadData = {
        name: newLead.name.trim(),
        phone: newLead.phone.trim(),
        status: mapStatus(newLead.status),
        source: mapSource(newLead.source),
        interest: newLead.interest || 'عقارات', // Default interest
        priority: 'medium', // Default priority
        assignedTo: newLead.assignedTo // الموظف المخصص
      }
      
      // Add optional fields only if they have values
      if (newLead.email && newLead.email.trim()) {
        leadData.email = newLead.email.trim()
      }
      if (newLead.notes && newLead.notes.trim()) {
        leadData.notes = newLead.notes.trim()
      }
      if (newLead.budget && !isNaN(parseFloat(newLead.budget))) {
        leadData.budget = parseFloat(newLead.budget)
      }

      const result = await api.addLead(leadData)

      // المتابعات ستُنشأ تلقائياً في الباك إند
      
      // Refresh the leads list
      refetch()
      
      // إشعار نجاح الإضافة للموظف الحالي
      notifyNewLead(newLead.name)
      
      // إرسال إشعار فوري للمديرين عبر SSE
      await sendNewLeadNotification(newLead.name)
      
      setNewLead({ 
        name: '', 
        email: '', 
        phone: '', 
        source: '', 
        status: 'بارد', 
        score: 0, 
        notes: '', 
        interests: [],
        clientType: 'فردي',
        assignedTo: '',
        priority: 'متوسطة'
      })
      setShowAddModal(false)
      toast.success('تم إضافة العميل المحتمل بنجاح')
    } catch (error) {
      console.error('خطأ في إضافة العميل المحتمل:', error)
      toast.error('فشل في إضافة العميل المحتمل')
    }
  }

  const handleEditLead = (lead) => {
    setEditingLead(lead)
  }

  const handleUpdateLead = async (e) => {
    e.preventDefault()
    try {
      await api.updateLead(editingLead.id, editingLead)
      refetch()
      setEditingLead(null)
    } catch (error) {
      console.error('خطأ في تحديث العميل المحتمل:', error)
    }
  }

  const handleDeleteLead = async (lead) => {
    setLeadToDelete(lead)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return
    
    try {
      // تحديث حالة العميل المحتمل للأرشفة بدلاً من الحذف النهائي
      await api.deleteLead(leadToDelete.id)
      refetch()
      toast.success('تم نقل العميل المحتمل للأرشيف بنجاح')
    } catch (error) {
      console.error('خطأ في أرشفة العميل المحتمل:', error)
      toast.error('حدث خطأ أثناء أرشفة العميل المحتمل')
    } finally {
      setLeadToDelete(null)
    }
  }

  // إضافة تذكير
  const handleReminder = (lead) => {
    setSelectedLeadForReminder(lead)
    setShowQuickReminderModal(true)
  }

  // إغلاق مودال التذكير
  const handleCloseReminderModal = () => {
    setShowQuickReminderModal(false)
    setSelectedLeadForReminder(null)
  }

  // نجاح إنشاء التذكير
  const handleReminderSuccess = () => {
    console.log('Reminder created successfully for lead:', selectedLeadForReminder?.name)
  }

  const handleAddReminder = async (reminderData) => {
    try {
      // Here you would call the real API to save the reminder
      // For now, we'll just log it and show success

      
      // In the future, this would be:
      // await api.addReminder(reminderData)
      
      // Show success message
      toast.success(`تم إضافة تذكير لـ ${reminderData.itemName} بنجاح`)
      
      // Close modal
      setShowReminderModal(false)
      setReminderForLead(null)
    } catch (error) {
      console.error('خطأ في إضافة التذكير:', error)
      toast.error('فشل في إضافة التذكير')
    }
  }

  // عرض تقييم العميل المحتمل
  const handleViewRating = (lead) => {
    setRatingForLead(lead)
    setShowRatingModal(true)
  }

  // تحديث تقييم العميل المحتمل
  const handleUpdateRating = (lead) => {
    setUpdateRatingForLead(lead)
    setShowUpdateRatingModal(true)
  }

  // حفظ التقييم المحدث
  const handleSaveUpdatedRating = async (updatedLead) => {
    try {
      await api.updateLead(updatedLead.id, updatedLead)
      
      // إعادة تحميل البيانات
      await refetch()
      
      toast.success('تم تحديث التقييم بنجاح!')
    } catch (error) {
      console.error('خطأ في تحديث التقييم:', error)
      toast.error('فشل في تحديث التقييم')
      throw error
    }
  }

  // عرض تفاصيل العميل المحتمل
  const handleViewLead = (lead) => {
    setViewingLead(lead)
  }

  // تحديث نقاط العميل المحتمل
  const handleUpdateScore = async (leadId, newScore) => {
    try {
      await api.updateLead(leadId, { score: newScore })
      toast.success('تم تحديث التقييم بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث التقييم:', error)
      toast.error('فشل في تحديث التقييم')
    }
  }

  // إضافة ملاحظة
  const handleAddNote = async (note) => {
    try {
      if (!note?.itemId || !note?.content) {
        toast.error('بيانات الملاحظة غير مكتملة')
        return
      }

      // التأكد من وجود العميل المحتمل
      const lead = leads?.find(l => l.id === note.itemId)
      if (!lead) {
        toast.error('العميل المحتمل غير موجود')
        return
      }

      // إنشاء الملاحظة باستخدام Notes API
      const noteData = {
        content: note.content,
        itemType: 'lead',
        itemId: note.itemId
      }

      const result = await api.addNote(noteData)
      

      toast.success('تم إضافة الملاحظة بنجاح')
      
      // إرسال إشعار للمديرين عن الملاحظة الجديدة
      await sendNoteAddedNotification(lead.name, 'عميل محتمل', note.content)
      
      // إعادة تحميل التفاصيل إذا كان العميل المحتمل معروضاً
      if (viewingLead && note?.itemId === viewingLead.id) {
        // تحديث الملاحظات في الـ viewingLead
        setViewingLead({...viewingLead, updatedAt: new Date()})
      }
    } catch (error) {
      console.error('خطأ في حفظ الملاحظة:', error)
      toast.error('حدث خطأ أثناء حفظ الملاحظة')
    }
  }

  // إضافة تفاعل
  const handleAddInteraction = async (interactionData) => {
    try {

      // تغيير itemType إلى lead
      const leadInteractionData = {
        ...interactionData,
        itemType: 'lead'
      }
      await api.addInteraction(leadInteractionData)

      toast.success('تم إضافة التفاعل بنجاح')
      
      // البحث عن العميل المحتمل لإرسال الإشعار
      const lead = leads?.find(l => l.id === interactionData.itemId)
      if (lead) {
        await sendInteractionAddedNotification(lead.name, 'عميل محتمل', interactionData.type || 'تفاعل')
      }
      
      // إعادة تحميل التفاصيل إذا كان العميل المحتمل معروضاً
      if (viewingLead && interactionData?.itemId === viewingLead.id) {
        setViewingLead({...viewingLead, updatedAt: new Date()})
      }
    } catch (error) {
      console.error('❌ Error adding lead interaction:', error)
      toast.error('حدث خطأ أثناء إضافة التفاعل')
    }
  }



  // === الإجراءات الجماعية ===
  
  const handleBulkDelete = async (leadIds) => {
    try {
      await Promise.all(leadIds.map(id => api.deleteLead(id)))
      toast.success(`تم حذف ${leadIds.length} عميل محتمل بنجاح`)
      // Refresh data to show changes
      refetch()
    } catch (error) {
      console.error('خطأ في الحذف الجماعي:', error)
      toast.error('فشل في حذف العملاء المحتملين')
    }
  }



  const handleBulkExport = (selectedLeadsData) => {
    try {
      const csvHeaders = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'الشركة', 'المصدر', 'الحالة', 'التقييم']
      const csvData = selectedLeadsData.map(lead => [
        lead.name || '',
        lead.phone || '',
        lead.email || '',
        lead.company || '',
        lead.source || '',
        lead.status || '',
        lead.score || ''
      ])
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.join(','))
        .join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success(`تم تصدير ${selectedLeadsData.length} عميل محتمل بنجاح`)
    } catch (error) {
      console.error('خطأ في التصدير:', error)
      toast.error('فشل في تصدير العملاء المحتملين')
    }
  }

  const handleConvertToClient = (lead) => {
    setLeadToConvert(lead)
    setShowConvertConfirm(true)
  }

  const confirmConvertToClient = async () => {
    console.log('🚀 confirmConvertToClient called for lead:', leadToConvert?.name)
    try {
      // Add as client with proper backend validation
      const clientData = {
        name: leadToConvert.name,
        email: leadToConvert.email || null,
        phone: leadToConvert.phone,
        address: leadToConvert.address || '',
        notes: `تحويل من عميل محتمل - Score: ${leadToConvert.score || 0}. ${leadToConvert.notes || ''}`.trim(),
        status: 'active', // Backend expects: active, inactive, potential, converted
        source: leadToConvert.source || 'تحويل من عميل محتمل',
        budget: leadToConvert.budget || null
      }
      
      const result = await api.addClient(clientData)
      const clientId = result.data.id
      console.log('🔄 Client created from lead conversion - ID:', clientId, 'Name:', clientData.name)
      
      // إضافة تفاعل التحويل في Timeline
      const conversionInteraction = {
        clientId: leadToConvert.id,
        type: 'conversion',
        title: 'تحويل إلى عميل فعلي',
        description: `تم تحويل العميل المحتمل إلى عميل فعلي بنجاح`,
        date: new Date(),
        employeeId: currentUser?.uid,
        employeeName: userProfile?.displayName || userProfile?.name || currentUser?.displayName || currentUser?.name || userProfile?.email || 'المستخدم الحالي',
        outcome: 'excellent',
        nextAction: 'متابعة ما بعد البيع',
        notes: `Lead Score وقت التحويل: ${leadToConvert.score || 0}/100. تم إنشاء عميل جديد برقم: ${clientId}`,
        conversionData: {
          leadId: leadToConvert.id,
          clientId: clientId,
          leadScore: leadToConvert.score || 0,
          conversionDate: new Date()
        }
      }
      
      // هنا سيتم حفظ التفاعل في قاعدة البيانات مستقبلاً

      
      // إرسال تنبيه للمديرين بالعميل الجديد المحول
      // تم حذف إشعار الفريق مؤقتاً
      
      // إرسال تنبيه إضافي للمديرين عن تحويل العميل المحتمل (إذا كان المس��خدم موظف مبيعات)
      if (isSales()) {
        // تم حذف إشعار تحويل العميل المحتمل مؤقتاً
      }
      
      // Update lead status to converted instead of deleting
      await api.updateLead(leadToConvert.id, { 
        status: 'converted',
        convertedAt: new Date().toISOString(),
        convertedTo: clientId,
        convertedBy: currentUser?.uid || currentUser?.id || userProfile?.id
      })
      
      // Refresh leads list
      refetch()
      
      // إشعار نجاح التحويل للموظف الحالي
      notifyLeadConverted(leadToConvert.name)
      
      // إرسال إشعار فوري للمديرين عبر SSE
      await sendLeadConvertedNotification(leadToConvert.name)
      
      toast.success(`تم تحويل العميل المحتمل إلى عميل بنجاح! سيتم توجيهك لصفحة العملاء...`)
      setShowConvertConfirm(false)
      setLeadToConvert(null)
      
      // Navigate to clients page after a short delay
      setTimeout(() => {
        navigate('/clients')
      }, 2000)
    } catch (error) {
      console.error('خطأ في تحويل العميل المحتمل:', error)
      toast.error('فشل في تحويل العميل المحتمل')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'destructive'
      case 'warm': return 'warning'
      case 'cold': return 'info'
      case 'converted': return 'success'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'hot': return 'ساخن'
      case 'warm': return 'دافئ'
      case 'cold': return 'بارد'
      case 'converted': return 'محول'
      default: return 'غير محدد'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-orange-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-blue-600'
  }



  // === وظائف الاستيراد الجماعي ===
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      // التحقق من نوع الملف
      const allowedTypes = ['.csv', '.xlsx', '.xls']
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error('يرجى اختيار ملف CSV أو Excel فقط')
        return
      }
      
      setBulkImportFile(selectedFile)
      toast.success('تم اختيار الملف بنجاح')
    }
  }

  // دالة لمعالجة بيانات Excel
  const parseExcelData = (jsonData) => {

    
    if (jsonData.length < 2) {
      throw new Error('الملف فارغ أو لا يحتوي على بيانات صالحة')
    }

    const headers = jsonData[0].map(h => String(h || '').toLowerCase())
    console.log('🏷️ العناوين المستخرجة:', headers)
    
    const data = []

    // Map English and Arabic headers to array indices
    const getFieldIndex = (fieldNames) => {
      for (const fieldName of fieldNames) {
        const index = headers.indexOf(fieldName.toLowerCase())
        if (index !== -1) return index
      }
      return -1
    }

    const nameIndex = getFieldIndex(['name', 'الاسم', 'اسم', 'full name', 'client name', 'الاسم الكامل'])
    const emailIndex = getFieldIndex(['email', 'البريد الإلكتروني', 'بريد', 'e-mail', 'mail', 'البريد'])
    const phoneIndex = getFieldIndex(['phone', 'رقم الهاتف', 'هاتف', 'mobile', 'tel', 'telephone', 'الهاتف', 'الجوال'])
    const companyIndex = getFieldIndex(['company', 'الشركة', 'شركة', 'organization', 'المؤسسة'])
    const statusIndex = getFieldIndex(['status', 'الحالة', 'حالة'])
    const notesIndex = getFieldIndex(['notes', 'الملاحظات', 'ملاحظات', 'note', 'comment', 'تعليق'])

    console.log('📊 مؤشرات الحقول:', {
      name: nameIndex,
      email: emailIndex,
      phone: phoneIndex,
      company: companyIndex,
      status: statusIndex,
      notes: notesIndex
    })

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i]
      if (!row || row.length === 0) continue

      console.log(`📝 السطر ${i}:`, row)
      
      let rawName = nameIndex >= 0 ? String(row[nameIndex] || '') : ''
      let rawPhone = phoneIndex >= 0 ? String(row[phoneIndex] || '') : ''
      
      // إصلاح الاسم العربي
      let cleanName = cleanArabicText(rawName)
      
      // إصلاح رقم الهاتف
      let cleanPhone = fixPhoneNumber(rawPhone)

      // التحقق من وجود البيانات المطلوبة وطول رقم الهاتف (Backend requires >= 10 chars)
      if (cleanName.trim() && cleanPhone.trim() && cleanPhone.length >= 10) {
        // تحديد الحالة - Backend expects: new, contacted, interested, qualified, converted, lost
        let status = 'new' // Default to English
        if (statusIndex >= 0) {
          const statusValue = String(row[statusIndex] || '').toLowerCase()
          if (['cold', 'جديد', 'بارد', 'new'].includes(statusValue)) status = 'new'
          else if (['warm', 'دافئ', 'متابعة', 'contacted'].includes(statusValue)) status = 'contacted'
          else if (['hot', 'ساخن', 'مؤهل', 'qualified'].includes(statusValue)) status = 'qualified'
          else if (['interested', 'مهتم'].includes(statusValue)) status = 'interested'
          else if (['not interested', 'غير مهتم', 'lost'].includes(statusValue)) status = 'lost'
          else if (['converted', 'محول'].includes(statusValue)) status = 'converted'
        }

        const lead = {
          name: cleanName,
          email: emailIndex >= 0 ? String(row[emailIndex] || '') : '',
          phone: cleanPhone,
          company: companyIndex >= 0 ? String(row[companyIndex] || '') : '',
          source: (bulkImportSource?.trim() && bulkImportSource.trim().length >= 2) ? bulkImportSource.trim() : 'bulk_import',
          status: status,
          notes: notesIndex >= 0 ? String(row[notesIndex] || '') : '',
          interest: 'General', // Backend accepts any string
          clientType: 'Individual',
          priority: 'medium', // Backend expects: low, medium, high, urgent
          score: 0
          // Only send fields that backend expects and validates
        }
        
        console.log('✅ عميل محتمل تم إنشاؤه:', lead)
        data.push(lead)
      } else {
        console.log('⚠️ تم تخطي السطر - بيانات ناقصة:', { name: cleanName, phone: rawPhone })
      }
    }

    console.log(`📊 إجمالي العملاء المحتملين المستخرجين: ${data.length}`)
    return data
  }

  // دالة لتنظيف النص العربي
  const cleanArabicText = (text) => {
    if (!text) return ''
    
    let cleanText = String(text).trim()
    
    // إصلاح مشاكل الترميز الشائعة
    if (cleanText.includes('?') || cleanText.includes('�')) {
      console.log('⚠️ مشكلة في ترميز النص:', cleanText)
      // يمكن إضافة منطق إصلاح الترميز هنا إذا لزم الأمر
    }
    
    return cleanText
  }

  // دالة لإصلاح رقم الهاتف
  const fixPhoneNumber = (phone) => {
    if (!phone) return ''
    
    let cleanPhone = String(phone).trim()

    
    // إزالة المسافات والرموز غير المرغوبة (باستثناء الأرقام و +)
    cleanPhone = cleanPhone.replace(/[^\d+]/g, '')
    
    // إصلاح المشكلة الرئيسية: الرقم المعكوس (ينتهي بـ + أو يحتوي على + في مكان خاطئ)
    if (cleanPhone.includes('+') && !cleanPhone.startsWith('+')) {

      
      // إزالة جميع علامات + وإعادة ترتيب الرقم
      let numbersOnly = cleanPhone.replace(/\+/g, '')
      console.log('🔢 الأرقام فقط:', numbersOnly)
      
      // التحقق إذا كان الرقم يحتوي على كود الدولة 20
      if (numbersOnly.includes('20')) {
        // العثور على موضع 20 وإعادة ترتيب الرقم
        let countryCodeIndex = numbersOnly.indexOf('20')
        
        if (countryCodeIndex === numbersOnly.length - 2) {
          // كود الدولة في النهاية (معكوس تماماً)
          let mainNumber = numbersOnly.substring(0, countryCodeIndex)
          // عكس الرقم الرئيسي
          mainNumber = mainNumber.split('').reverse().join('')
          cleanPhone = '+20' + mainNumber

        } else if (countryCodeIndex > 0) {
          // كود الدولة في الوسط
          let beforeCountryCode = numbersOnly.substring(0, countryCodeIndex)
          let afterCountryCode = numbersOnly.substring(countryCodeIndex + 2)
          cleanPhone = '+20' + afterCountryCode + beforeCountryCode

        } else {
          // كود الدولة في البداية (صحيح)
          cleanPhone = '+' + numbersOnly
        }
      } else {
        // لا يحتوي على كود دولة، قد يكون رقم مصري
        // عكس الرقم وإضافة كود الدولة
        let reversedNumber = numbersOnly.split('').reverse().join('')
        if (reversedNumber.startsWith('1')) {
          cleanPhone = '+20' + reversedNumber
        } else {
          cleanPhone = '+20' + numbersOnly
        }

      }
    }
    // إصلاح الأرقام العادية
    else if (cleanPhone.startsWith('0')) {
      // رقم مصري يبدأ بـ 0
      if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
        cleanPhone = '+20' + cleanPhone.substring(1)
      } else if (cleanPhone.length === 10) {
        cleanPhone = '+20' + cleanPhone
      }
    } else if (!cleanPhone.startsWith('+')) {
      // رقم بدون كود دولة
      if (cleanPhone.match(/^1\d{9}$/)) {
        // رقم مصري من 10 أرقام يبدأ بـ 1
        cleanPhone = '+20' + cleanPhone
      } else if (cleanPhone.match(/^\d{8,11}$/)) {
        // رقم من 8-11 أرقام
        cleanPhone = '+20' + cleanPhone
      }
    }
    
    // التأكد من صحة تنسيق الرقم المصري
    if (cleanPhone.startsWith('+20')) {
      let numberPart = cleanPhone.substring(3)
      // التأكد من أن الرقم يبدأ بـ 1 (للأرقام المصرية)
      if (!numberPart.startsWith('1') && numberPart.length >= 9) {
        // إضافة 1 في البداية إذا لم تكن موجودة
        if (numberPart.length === 9) {
          cleanPhone = '+201' + numberPart
        }
      }
    }
    

    return cleanPhone
  }

  const parseCSV = (csvText) => {
    console.log('🔍 بدء تحليل CSV...')
    console.log('📄 أول 500 حرف من الملف:', csvText.substring(0, 500))
    
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('الملف فارغ أو لا يحتوي على بيانات صالحة')
    }

    console.log('📋 عدد الأسطر:', lines.length)
    console.log('🏷️ سطر العناوين:', lines[0])

    // تحسين تحليل CSV للتعامل مع الفواصل داخل النصوص
    const parseCSVLine = (line) => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      result.push(current.trim())
      return result.map(v => v.replace(/^"|"$/g, '')) // إزالة علامات التنصيص
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase())
    console.log('🏷️ العناوين المستخرجة:', headers)
    
    const data = []

    // Map English and Arabic headers to array indices
    const getFieldIndex = (fieldNames) => {
      for (const fieldName of fieldNames) {
        const index = headers.indexOf(fieldName.toLowerCase())
        if (index !== -1) return index
      }
      return -1
    }

    const nameIndex = getFieldIndex(['name', 'الاسم', 'اسم', 'full name', 'client name', 'الاسم الكامل'])
    const emailIndex = getFieldIndex(['email', 'البريد الإلكتروني', 'بريد', 'e-mail', 'mail', 'البريد'])
    const phoneIndex = getFieldIndex(['phone', 'رقم الهاتف', 'هاتف', 'mobile', 'tel', 'telephone', 'الهاتف', 'الجوال'])
    const companyIndex = getFieldIndex(['company', 'الشركة', 'شركة', 'organization', 'المؤسسة'])
    const statusIndex = getFieldIndex(['status', 'الحالة', 'حالة'])
    const notesIndex = getFieldIndex(['notes', 'الملاحظات', 'ملاحظات', 'note', 'comment', 'تعليق'])

    console.log('📊 مؤشرات الحقول:', {
      name: nameIndex,
      email: emailIndex,
      phone: phoneIndex,
      company: companyIndex,
      status: statusIndex,
      notes: notesIndex
    })

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      console.log(`📝 السطر ${i}:`, values)
      
      let rawName = nameIndex >= 0 ? values[nameIndex] : ''
      let rawPhone = phoneIndex >= 0 ? values[phoneIndex] : ''
      
      // إصلاح الاسم العربي
      let cleanName = cleanArabicText(rawName)
      
      // إصلاح رقم الهاتف
      let cleanPhone = fixPhoneNumber(rawPhone)

      // التحقق من وجود البيانات المطلوبة وطول رقم الهاتف (Backend requires >= 10 chars)
      if (cleanName.trim() && cleanPhone.trim() && cleanPhone.length >= 10) {
        // تحديد الحالة - Backend expects: new, contacted, interested, qualified, converted, lost
        let status = 'new' // Default to English
        if (statusIndex >= 0) {
          const statusValue = String(values[statusIndex] || '').toLowerCase()
          if (['cold', 'جديد', 'بارد', 'new'].includes(statusValue)) status = 'new'
          else if (['warm', 'دافئ', 'متابعة', 'contacted'].includes(statusValue)) status = 'contacted'
          else if (['hot', 'ساخن', 'مؤهل', 'qualified'].includes(statusValue)) status = 'qualified'
          else if (['interested', 'مهتم'].includes(statusValue)) status = 'interested'
          else if (['not interested', 'غير مهتم', 'lost'].includes(statusValue)) status = 'lost'
          else if (['converted', 'محول'].includes(statusValue)) status = 'converted'
        }

        const lead = {
          name: cleanName,
          email: emailIndex >= 0 ? values[emailIndex] : '',
          phone: cleanPhone,
          company: companyIndex >= 0 ? values[companyIndex] : '',
          source: (bulkImportSource?.trim() && bulkImportSource.trim().length >= 2) ? bulkImportSource.trim() : 'bulk_import',
          status: status,
          notes: notesIndex >= 0 ? values[notesIndex] : '',
          interest: 'General', // Backend accepts any string
          clientType: 'Individual',
          priority: 'medium', // Backend expects: low, medium, high, urgent
          score: 0
          // Only send fields that backend expects and validates
        }
        
        console.log('✅ عميل محتمل تم إنشاؤه:', lead)
        data.push(lead)
      } else {
        console.log('⚠️ تم تخطي السطر - بيانات ناقصة:', { name: cleanName, phone: rawPhone })
      }
    }

    console.log(`📊 إجمالي العملاء المحتملين المستخرجين: ${data.length}`)
    return data
  }

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      toast.error('يرجى اختيار ملف أولاً')
      return
    }

    setIsImporting(true)
    try {
      let leadsData = []
      
      // التحقق من نوع الملف
      const fileName = bulkImportFile.name.toLowerCase()
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')
      const isCsv = fileName.endsWith('.csv')

      if (isExcel) {
        // معالجة ملفات Excel
        console.log('🔍 معالجة ملف Excel...')
        
        const XLSX = await import('xlsx')
        
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.onerror = reject
          reader.readAsArrayBuffer(bulkImportFile)
        })

        // قراءة ملف Excel مع دعم الترميز العربي
        const workbook = XLSX.read(arrayBuffer, { 
          type: 'array',
          codepage: 65001, // UTF-8
          cellText: true,
          cellDates: true
        })
        
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // تحويل إلى JSON مع الحفاظ على الترميز العربي
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
          raw: false // استخدام النص المنسق بدلاً من القيم الخام
        })

        console.log('📊 بيانات Excel المستخرجة:', jsonData.slice(0, 3))
        leadsData = parseExcelData(jsonData)
        
      } else if (isCsv) {
        // معالجة ملفات CSV مع إصلاح الترميز العربي
        console.log('🔍 معالجة ملف CSV...')
        
        const fileText = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            let result = e.target.result
            
            // إصلاح مشاكل الترميز العربي الشائعة
            if (result.includes('Ø') || result.includes('Ù') || result.includes('Ú') || result.includes('Û')) {
              // محاولة إصلاح ترميز Windows-1256 إلى UTF-8
              try {
                const bytes = new Uint8Array(result.length)
                for (let i = 0; i < result.length; i++) {
                  bytes[i] = result.charCodeAt(i)
                }
                result = new TextDecoder('windows-1256').decode(bytes)
              } catch (error) {
                console.log('فشل في إصلاح الترميز، استخدام النص الأصلي')
              }
            }
            
            resolve(result)
          }
          reader.onerror = reject
          reader.readAsText(bulkImportFile, 'UTF-8')
      })

      console.log('📄 محتوى الملف:', fileText.substring(0, 200) + '...')
        leadsData = parseCSV(fileText)
      } else {
        throw new Error('نوع الملف غير مدعوم. يرجى استخدام ملفات CSV أو Excel فقط.')
      }
      
      if (leadsData.length === 0) {
        toast.error('لم يتم العثور على بيانات صالحة في الملف')
        return
      }

      console.log('📊 البيانات المستخرجة:', leadsData)

      // إضافة العملاء المحتملين إلى Firebase
      let successCount = 0
      let errorCount = 0

      for (const leadData of leadsData) {
        try {
          console.log('➕ إضافة عميل محتمل:', leadData.name)
          const result = await api.addLead(leadData)
          
          // المتابعات ستُنشأ تلقائياً في الباك إند
          
          successCount++
        } catch (error) {
          console.error('خطأ في إضافة عميل محتمل:', error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`تم استيراد ${successCount} عميل محتمل بنجاح${errorCount > 0 ? ` (${errorCount} فشل)` : ''}`)
        // Refresh data to show new leads
        refetch()
      } else {
        toast.error('فشل في استيراد العملاء المحتملين')
      }

      setBulkImportFile(null)
      setBulkImportSource('')
      setShowBulkImportModal(false)
    } catch (error) {
      console.error('خطأ في الاستيراد الجماعي:', error)
      toast.error('حدث خطأ أثناء معالجة الملف: ' + error.message)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    // إنشاء ملف CSV نموذجي يدعم اللغة العربية والإنجليزية
    const csvContent = `Name,Email,Phone,Company,Source,Status,Notes
أحمد محمد,ahmed@example.com,01234567890,شركة ABC,موقع إلكتروني,جديد,عميل محتمل مهتم بالخدمات
فاطمة علي,fatima@example.com,01987654321,شركة XYZ,إحالة,متابعة,تم التواصل معها
محمد حسن,mohamed@example.com,01122334455,شركة DEF,معرض,مؤهل,جاهز للعرض التقديمي
Sarah Ahmed,sarah@example.com,01555666777,Tech Solutions,social media,interested,Contacted through LinkedIn`

    // إنشاء Blob مع BOM للدعم الصحيح للغة العربية في Excel
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'نموذج_العملاء_المحتملين.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('تم تحميل النموذج بنجاح - يدعم اللغة العربية والإنجليزية')
  }

  // === وظائف توزيع العملاء المحتملين ===
  
  const handleAssignLeads = async (leadsToAssign, salesUserId, notes) => {
    try {
      // Assign leads to sales user via API
      console.log('Assigning leads:', {
        leads: leadsToAssign.map(l => l.id),
        salesUserId,
        notes
      })

      // Update leads with new assignment
      const updatePromises = leadsToAssign.map(lead => 
        api.updateLead(lead.id, {
          assignedTo: salesUserId,
          status: 'assigned',
          notes: notes || lead.notes
        })
      )

      await Promise.all(updatePromises)

      // Clear selected leads after assignment
      setSelectedLeads([])
      
      // Refresh data
      refetch()
    } catch (error) {
      console.error('خطأ في توزيع العملاء المحتملين:', error)
      throw error
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">إدارة العملاء المحتملين</h1>
                <p className="text-orange-100 mt-1">تتبع وإدارة العملاء المحتملين ودورة المبيعات</p>
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
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canCreateLead() && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="font-bold">إضافة عميل محتمل</span>
                  </div>
                </Button>
              )}
              
              {canCreateLead() && checkPermission('import_leads') && (
                <Button 
                  onClick={() => setShowBulkImportModal(true)}
                  className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30 backdrop-blur-sm transition-all duration-200"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  استيراد جماعي
                </Button>
              )}
              
              {(isAdmin() || isSalesManager()) && (
                <Button 
                  onClick={() => setShowDistributeModal(true)}
                  className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30 backdrop-blur-sm transition-all duration-200"
                >
                  <Shuffle className="h-4 w-4 ml-2" />
                  توزيع تلقائي
                </Button>
              )}

              {(isAdmin() || isSalesManager()) && (
                <Button 
                  onClick={() => setShowAssignmentModal(true)}
                  disabled={selectedLeads.length === 0}
                  className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30 backdrop-blur-sm disabled:opacity-50 transition-all duration-200"
                >
                  <UserCheck className="h-4 w-4 ml-2" />
                  توزيع العملاء ({selectedLeads.length})
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <UserPlus className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Star className="h-16 w-16 text-white" />
        </div>
      </div>








      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* إجمالي العملاء المحتملين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">إجمالي العملاء المحتملين</p>
                <p className="text-3xl font-bold text-orange-900">{finalFilteredLeads?.length || 0}</p>
                <p className="text-sm text-orange-600 mt-1">+12% من الشهر الماضي</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* العملاء الساخنون */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">العملاء الساخنون</p>
                <p className="text-3xl font-bold text-red-900">
                  {finalFilteredLeads?.filter(l => l.status === 'hot' || l.status === 'ساخن' || l.status === 'مهتم جداً').length || 0}
                </p>
                <p className="text-sm text-red-600 mt-1">أولوية قصوى</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center">
                  <Zap className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* معدل التحويل */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">معدل التحويل</p>
                <p className="text-3xl font-bold text-green-900">
                  {leads?.length ? Math.round((leads.filter(l => l.status === 'converted' || l.status === 'محول').length / leads.length) * 100) : 0}%
                </p>
                <p className="text-sm text-green-600 mt-1">نجاح المبيعات</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* نقاط عالية */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">نقاط عالية (80+)</p>
                <p className="text-3xl font-bold text-blue-900">
                  {finalFilteredLeads?.filter(l => (l.score || 0) >= 80).length || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">جاهز للتحويل</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <Target className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول العملاء المحتملين */}
      <LeadsTable
          leads={finalFilteredLeads}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
          onView={handleViewLead}
          onReminder={handleReminder}
          onViewRating={handleViewRating}
          onUpdateRating={handleUpdateRating}
          onConvertToClient={handleConvertToClient}
          onUpdateScore={handleUpdateScore}
          onAddNote={handleAddNote}
          onAddInteraction={handleAddInteraction}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          canEditLead={canEditLead}
          canDeleteLead={canDeleteLead}
          canConvertLead={canConvertLead}
          onSelectedLeadsChange={setSelectedLeads}
          selectedLeads={selectedLeads}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          leadNotes={leadNotes} // تمرير ملاحظات العملاء المحتملين الحقيقية
          leadInteractions={leadInteractions} // تمرير تفاعلات العملاء المحتملين الحقيقية
        />

      {/* منطقة الترقيم */}
      {pagination && pagination.totalPages > 1 && (
        <Card className="bg-white border-0 shadow-md rounded-xl mt-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span>عرض {((pagination.currentPage - 1) * pageSize) + 1}-{Math.min(pagination.currentPage * pageSize, pagination.totalItems)}</span>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm">
                  الصفحة {pagination.currentPage} من {pagination.totalPages}
                </Badge>
              </div>
              
              {/* اختيار حجم الصفحة في الأسفل أيضاً */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">عرض:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                </select>
                <span className="text-sm text-gray-600">عميل</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={prevPage}
                disabled={!pagination.hasPrevPage}
                variant="outline"
                size="sm"
                className="px-3 py-1"
              >
                السابق
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                  const pageNum = Math.max(1, pagination.currentPage - 2) + i
                  if (pageNum > pagination.totalPages) return null
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => updateParams({ page: pageNum })}
                      variant={pageNum === pagination.currentPage ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                onClick={nextPage}
                disabled={!pagination.hasNextPage}
                variant="outline"
                size="sm"
                className="px-3 py-1"
              >
                التالي
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* العرض القديم - مخفي */}
      <div className="hidden">
      {finalFilteredLeads.length > 0 ? (
        <div className="bizmax-grid-3">
          {finalFilteredLeads.map((lead) => (
            <Card key={lead.id} className="bizmax-card hover:shadow-medium transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {lead.name?.charAt(0) || 'ع'}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(lead.status)}>
                          {getStatusText(lead.status)}
                        </Badge>
                        <span className={`text-sm font-medium ${getScoreColor(lead.score || 0)}`}>
                          {lead.score || 0}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}
                
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{formatPhoneNumber(lead.phone)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>المصدر: {lead.source === 'website' ? 'الموقع' : 
                                  lead.source === 'social' ? 'وسائل التواصل' :
                                  lead.source === 'referral' ? 'إحالة' : 'إعلان'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>آخر تواصل: {formatDateArabic(lead.lastContact)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingLead(lead)}
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button 
                    variant="success" 
                    size="sm"
                    onClick={() => handleConvertToClient(lead)}
                    disabled={lead.status === 'converted'}
                  >
                    <CheckCircle className="h-3 w-3 ml-1" />
                    تحويل
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteLead(lead.id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bizmax-card">
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء محتملين</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة أول عميل محتمل</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة عميل محتمل
            </Button>
          </div>
        </Card>
      )}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إضافة عميل محتمل جديد</h3>
                    <p className="text-orange-100 text-sm">املأ البيانات الأساسية للعميل المحتمل</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-orange-100">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</span>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
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
            
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <form onSubmit={handleAddLead} className="p-6 space-y-4">
              {/* الصف الأول */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="أدخل الاسم الكامل"
                    value={newLead.name}
                    onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                    required
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    رقم الموبايل <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <img src="https://flagcdn.com/w20/eg.png" alt="مصر" className="w-4 h-2.5" />
                      <span className="text-xs text-gray-600">+20</span>
                    </div>
                    <Input
                      placeholder="أدخل رقم الموبايل"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({...newLead, phone: e.target.value})}
                      className="pr-16 h-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* الصف الثاني */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    placeholder="example@company.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({...newLead, email: e.target.value})}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    مورد البيانات <span className="text-red-500">*</span>
                  </label>
                  <Input
                                            placeholder="مثال: ماجد"
                    value={newLead.source}
                    onChange={(e) => setNewLead({...newLead, source: e.target.value})}
                    className="h-9"
                    required
                  />
                </div>
              </div>

              {/* الصف الثالث */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    نوع العميل
                  </label>
                  <select
                    value={newLead.clientType || 'فردي'}
                    onChange={(e) => setNewLead({...newLead, clientType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="فردي">فردي</option>
                    <option value="شركة">شركة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الأولوية
                  </label>
                  <select
                    value={newLead.priority || 'متوسطة'}
                    onChange={(e) => setNewLead({...newLead, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="منخفضة">منخفضة</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="عالية">عالية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الحالة
                  </label>
                  <select
                    value={newLead.status || 'بارد'}
                    onChange={(e) => setNewLead({...newLead, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="بارد">بارد</option>
                    <option value="دافئ">دافئ</option>
                    <option value="ساخن">ساخن</option>
                  </select>
                </div>
              </div>

              {/* الصف الرابع */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الموظف المسؤول <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newLead.assignedTo || ''}
                    onChange={(e) => setNewLead({...newLead, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 h-9"
                    required
                  >
                    <option value="">-- اختر الموظف المسؤول --</option>
                    {salesUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'sales' ? 'مبيعات' : 'مندوب مبيعات'})
                      </option>
                    ))}
                    {/* إضافة المستخدم الحالي كخيار افتراضي إذا كان admin أو sales_manager */}
                    {(isAdmin() || isSalesManager()) && (
                      <option value={currentUser?.id || userProfile?.id}>
                        {userProfile?.displayName || userProfile?.email || 'أنا'} (مدير)
                      </option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    ملاحظات
                  </label>
                  <textarea
                    placeholder="ملاحظات إضافية..."
                    value={newLead.notes || ''}
                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    rows={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2"
                >
                  إلغاء
                </Button>
                <Button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  حفظ
                </Button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">تعديل بيانات العميل المحتمل</h3>
                <button
                  onClick={() => setEditingLead(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                <Input
                  value={editingLead.name || ''}
                  onChange={(e) => setEditingLead({...editingLead, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <Input
                  type="email"
                  value={editingLead.email || ''}
                  onChange={(e) => setEditingLead({...editingLead, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <Input
                  value={editingLead.phone || ''}
                  onChange={(e) => setEditingLead({...editingLead, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المصدر</label>
                <select
                  value={editingLead.source || 'website'}
                  onChange={(e) => setEditingLead({...editingLead, source: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="website">الموقع</option>
                  <option value="social">وسائل التواصل</option>
                  <option value="referral">إحالة</option>
                  <option value="advertising">إعلان</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  value={editingLead.status || 'بارد'}
                  onChange={(e) => setEditingLead({...editingLead, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="بارد">بارد</option>
                  <option value="دافئ">دافئ</option>
                  <option value="ساخن">ساخن</option>
                  <option value="محول">محول</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">النقاط (0-100)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingLead.score || 0}
                  onChange={(e) => setEditingLead({...editingLead, score: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setEditingLead(null)} className="px-4 py-2">
                  إلغاء
                </Button>
                <Button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال عرض التفاصيل */}
      {viewingLead && (
        <LeadsDetailsModal
          lead={viewingLead}
          onClose={() => setViewingLead(null)}
          onUpdateLead={(updatedLead) => console.log('تحديث العميل المحتمل:', updatedLead)}
          onConvertToClient={handleConvertToClient}
        />
      )}

      {/* مودال التوزيع التلقائي */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-gray-200 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Shuffle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">التوزيع التلقائي</h3>
                    <p className="text-sm text-gray-600">توزيع العملاء المحتملين على موظفي المبيعات</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDistributeModal(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-purple-200"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">كيف يعمل التوزيع التلقائي؟</h4>
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• يتم توزيع العملاء المحتملين غير المخصصين على موظفي المبيعات النشطين</li>
                  <li>• التوزيع يتم بالعدل (Round Robin) لضمان العدالة</li>
                  <li>• يشمل التوزيع مندوبي المبيعات ومدراء المبيعات</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {/* استخدام البيانات الموجودة بدلاً من API call جديد */}
                      <UnassignedLeadsCountSimple leads={leads} />
                    </div>
                    <div className="text-sm text-gray-600">عملاء للتوزيع</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {salesUsers?.filter(user => user.role === 'sales' || user.role === 'sales_agent').length || 0}
                    </div>
                    <div className="text-sm text-gray-600">موظفي مبيعات</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAutoDistribute}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  بدء التوزيع
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDistributeModal(false)}
                  className="px-6"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* حوار تأكيد الحذف */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setLeadToDelete(null)
        }}
        onConfirm={confirmDeleteLead}
        title="تأكيد نقل العميل المحتمل للأرشيف"
        message={`هل أنت متأكد من نقل العميل المحتمل "${leadToDelete?.name}" إلى الأرشيف؟ يمكنك استعادته لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />

      {/* حوار تأكيد التحويل */}
      <ConfirmDialog
        isOpen={showConvertConfirm}
        onClose={() => {
          setShowConvertConfirm(false)
          setLeadToConvert(null)
        }}
        onConfirm={confirmConvertToClient}
        title="تأكيد تحويل العميل المحتمل"
        message={
          <div className="space-y-4">
            <p>هل أنت متأكد من تحويل <strong>"{leadToConvert?.name}"</strong> إلى عميل فعلي؟</p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">تفاصيل التحويل:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Lead Score:</span>
                  <span className={`font-bold ml-2 ${
                    (leadToConvert?.score || 0) >= 80 ? 'text-green-600' :
                    (leadToConvert?.score || 0) >= 60 ? 'text-orange-600' :
                    'text-blue-600'
                  }`}>
                    {leadToConvert?.score || 0}/100
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">المصدر:</span>
                  <span className="font-medium ml-2">{leadToConvert?.source}</span>
                </div>
                <div>
                  <span className="text-gray-600">الحالة:</span>
                  <span className="font-medium ml-2">{leadToConvert?.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">الميزانية:</span>
                  <span className="font-medium ml-2">
                    {leadToConvert?.budget ? `${leadToConvert.budget.toLocaleString()} جنيه` : 'غير محددة'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                ⚠️ سيتم حذف العميل من قائمة العملاء المحتملين وإضافته لقائمة العملاء الفعليين.
              </p>
            </div>
          </div>
        }
        confirmText="تحويل إلى عميل"
        cancelText="إلغاء"
        type="info"
      />

      {/* مودال الاستيراد الجماعي */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">استيراد العملاء المحتملين بالجملة</h3>
                    <p className="text-sm text-gray-600">رفع ملف CSV أو Excel لإضافة عدة عملاء محتملين دفعة واحدة</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBulkImportModal(false)
                    setBulkImportFile(null)
                    setBulkImportSource('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* بطاقة رفع الملف */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      رفع ملف العملاء المحتملين
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        id="bulk-file-upload"
                      />
                      <label
                        htmlFor="bulk-file-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <FileText className="h-12 w-12 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          اضغط لاختيار ملف أو اسحب الملف هنا
                        </span>
                        <span className="text-xs text-gray-500">
                          CSV, Excel (.xlsx, .xls)
                        </span>
                      </label>
                    </div>

                    {bulkImportFile && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>الملف المحدد:</strong> {bulkImportFile.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          الحجم: {(bulkImportFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    )}

                    {/* حقل مورد البيانات */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        مورد البيانات <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="مثال: ماجد"
                        value={bulkImportSource}
                        onChange={(e) => setBulkImportSource(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        سيتم تطبيق هذا المورد على جميع البيانات في الملف
                      </p>
                    </div>

                    <Button
                      onClick={handleBulkImport}
                      disabled={!bulkImportFile || isImporting || !bulkImportSource.trim()}
                      className="w-full"
                    >
                      {isImporting ? 'جاري الاستيراد...' : 'استيراد ومعالجة الملف'}
                    </Button>
                  </CardContent>
                </Card>

                {/* بطاقة تحميل النموذج */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      تحميل النموذج
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      قم بتحميل النموذج لمعرفة التنسيق المطلوب لملف العملاء المحتملين
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">الحقول المطلوبة:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• <strong>الاسم</strong> (مطلوب)</li>
                        <li>• البريد الإلكتروني</li>
                        <li>• <strong>رقم الهاتف</strong> (مطلوب)</li>
                        <li>• الشركة</li>
                        <li>• المصدر</li>
                        <li>• الحالة</li>
                        <li>• الملاحظات</li>
                      </ul>
                    </div>

                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      تحميل النموذج
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* معلومات إضافية */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>تعليمات الاستيراد</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">نصائح مهمة:</h4>
                      <ul className="space-y-1">
                        <li>• تأكد من أن الملف بتنسيق CSV أو Excel</li>
                        <li>• يجب أن تكون الأسماء وأرقام الهواتف مطلوبة</li>
                        <li>• تحقق من صحة عناوين البريد الإلكتروني</li>
                        <li>• استخدم النموذج المتوفر لضمان التنسيق الصحيح</li>
                        <li>• سيتم تخصيص العملاء المحتملين لك تلقائياً</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">حالات العملاء المحتملين:</h4>
                      <ul className="space-y-1">
                        <li>• <strong>بارد</strong> - عميل محتمل جديد</li>
                        <li>• <strong>دافئ</strong> - يحتاج متابعة</li>
                        <li>• <strong>ساخن</strong> - مؤهل للشراء</li>
                        <li>• إذا تُرك فارغاً، سيتم تعيين "بارد" تلقائياً</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowBulkImportModal(false)
                    setBulkImportFile(null)
                    setBulkImportSource('')
                  }}
                  className="px-6"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Add Reminder Modal */}
      <SimpleAddReminderModal
        isOpen={showReminderModal}
        onClose={() => {
          setShowReminderModal(false)
          setReminderForLead(null)
        }}
        onSuccess={() => {
          handleAddReminder()
          setShowReminderModal(false)
          setReminderForLead(null)
        }}
      />

      {/* Rating View Modal */}
      <RatingViewModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false)
          setRatingForLead(null)
        }}
        lead={ratingForLead}
      />

      {/* Rating Update Modal */}
      <RatingUpdateModal
        isOpen={showUpdateRatingModal}
        onClose={() => {
          setShowUpdateRatingModal(false)
          setUpdateRatingForLead(null)
        }}
        lead={updateRatingForLead}
        onUpdateRating={handleSaveUpdatedRating}
      />

      {/* Lead Assignment Modal */}
      <LeadAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        selectedLeads={selectedLeads}
        salesUsers={salesUsers}
        onAssignLeads={handleAssignLeads}
      />

      {/* مودال التذكير السريع */}
      <QuickReminderModal
        isOpen={showQuickReminderModal}
        onClose={handleCloseReminderModal}
        client={selectedLeadForReminder}
        onSuccess={handleReminderSuccess}
      />

    </div>
  )
}

export default LeadsUltraSimple
