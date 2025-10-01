import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  Eye,
  MoreHorizontal,
  UserCheck,
  Calendar,
  UserPlus,
  User,
  X,
  Users,
  CheckCircle,
  Star,
  UserX,
  AlertCircle,
  TrendingUp,
  Download,
  Archive,
  XCircle,
  FileText,
  MessageCircle
} from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Pagination } from '../components/ui/pagination'
import { useApi, usePaginatedApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { formatDateArabic, formatPhoneNumber } from '../lib/utils'
import LoadingPage from '../components/ui/loading'
import AdvancedSearch from '../components/search/AdvancedSearch'
import SearchResults from '../components/search/SearchResults'
import { useAdvancedSearch } from '../hooks/useAdvancedSearch'
import ClientsTable from '../components/tables/ClientsTable'
import ViewDetailsModal from '../components/modals/ViewDetailsModal'
import ClientDetailsModal from '../components/modals/ClientDetailsModal'
import SimpleAddReminderModal from '../components/reminders/SimpleAddReminderModal'
import QuickReminderModal from '../components/reminders/QuickReminderModal'
import CreateFollowUpModal from '../components/modals/CreateFollowUpModal'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import WhatsAppSender from '../components/whatsapp/WhatsAppSender'
// تم حذف خدمات الإشعارات مؤقتاً
import toast from 'react-hot-toast'

export default function ClientsSimple() {
  const { currentUser, userProfile } = useAuth()
  const { notifyNewClient, notifySuccess, notifyError } = useNotifications()
  const { sendNewClientNotification, sendInteractionAddedNotification, sendNoteAddedNotification } = useSSENotificationSender()
  const api = useApi()
  
  // تم حذف إعدادات الإشعارات مؤقتاً
  const { 
    isAdmin, 
    isSalesManager, 
    isSales, 
    checkPermission,
    filterByRole 
  } = usePermissions()
  
  const {
    data: clients,
    pagination,
    loading,
    error,
    updateParams,
    nextPage,
    prevPage,
    refetch
  } = usePaginatedApi(api.getClients, { page: 1, limit: 50 })
  const [pageSize, setPageSize] = useState(50)

  // دالة تغيير حجم الصفحة
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    updateParams({ page: 1, limit: newSize }) // العودة للصفحة الأولى مع الحجم الجديد
  }

  // دوال التحقق من الصلاحيات للعملاء
  const canViewAllClients = () => {
    return isAdmin() || checkPermission('view_all_clients')
  }

  // تخصيص فلترة العملاء حسب الصلاحيات (العملاء الذين أنشأهم الموظف)
  const customFilter = (client) => {
    // فلترة الصلاحيات
    let hasPermission = false
    if (canViewAllClients()) {
      // إذا كان له صلاحية رؤية جميع العملاء (Admin/Manager)
      hasPermission = true
      console.log('👑 Admin/Manager - showing client:', client.id)
    } else if (isSales()) {
      // موظفو المبيعات يرون العملاء الذين أنشأوهم فقط (assignedTo يعني من أنشأ العميل)
      const userId = currentUser?.id || currentUser?.uid || userProfile?.id
      const userName = currentUser?.name || currentUser?.username || userProfile?.name || userProfile?.displayName
      const userEmail = currentUser?.email || userProfile?.email
      
      // في صفحة العملاء: assignedTo = المستخدم الذي أنشأ العميل
      hasPermission = (
        client.assignedTo == userId ||
        client.assignedTo == userName || 
        client.assignedTo == userEmail
      )
      
      if (hasPermission) {
        console.log(`✅ Client ${client.id} (${client.firstName || 'No name'}) - belongs to user ${userId}`)
      }
    }
    
    return hasPermission
  }

  // تعطيل جلب الملاحظات والتفاعلات مؤقتاً لتقليل الضغط على الخادم
  // const clientIds = clients?.map(client => client.id) || []
  // const { allNotes: clientNotes, loading: notesLoading } = useAllClientNotes(clientIds)
  // const { allInteractions: clientInteractions, loading: interactionsLoading } = useAllClientInteractions(clientIds)
  const clientNotes = {} // بيانات فارغة مؤقتاً
  const clientInteractions = {} // بيانات فارغة مؤقتاً

  // دوال التحقق من الصلاحيات
  const canEditClient = (client) => {
    // تم إزالة console.log للإنتاج
    
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('manage_clients')
    if (isSales()) {
      // موظف المبيعات يتحقق من الصلاحية أولاً ثم من التخصيص
      const hasPermission = checkPermission('manage_clients')
      if (!hasPermission || !client) return false
      
      const userId = currentUser?.id || currentUser?.uid || userProfile?.id
      const canEdit = client.assignedTo == userId || client.createdBy == userId
      // تم إزالة console.log للإنتاج
      return canEdit
    }
    return false
  }

  const canDeleteClient = (client) => {
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('manage_clients')
    if (isSales()) {
      // موظف المبيعات يتحقق من الصلاحية أولاً ثم من التخصيص
      const hasPermission = checkPermission('manage_clients')
      if (!hasPermission || !client) return false
      
      const userId = currentUser?.id || currentUser?.uid || userProfile?.id
      const canDelete = client.assignedTo == userId || client.createdBy == userId
      return canDelete
    }
    return false
  }

  // دوال للعمليات الجماعية (بدون عميل محدد)
  const canBulkDeleteClients = () => {
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('delete_clients')
    if (isSales()) return checkPermission('delete_clients')
    return false
  }

  const canBulkEditClients = () => {
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('edit_clients')
    if (isSales()) return checkPermission('edit_clients')
    return false
  }

  // دالة لاستخراج اسم مفهوم من البيانات
  const getDisplayName = (client) => {
    
    // أولوية للاسم المحفوظ في Firebase
    if (client.assignedToName && client.assignedToName !== 'مستخدم غير معروف' && !client.assignedToName.includes('undefined')) {
      return client.assignedToName
    }
    if (client.createdByName && client.createdByName !== 'مستخدم غير معروف' && !client.createdByName.includes('undefined')) {
      return client.createdByName
    }
    
    // backup من userNames - تم تعطيله مؤقتاً
    // if (client.assignedTo && userNames[client.assignedTo]) {
    //   return userNames[client.assignedTo]
    // }
    // if (client.createdBy && userNames[client.createdBy]) {
    //   return userNames[client.createdBy]
    // }
    
    // fallback نهائي
    return 'موظف مبيعات'
  }
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [viewingClient, setViewingClient] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [quickSearchTerm, setQuickSearchTerm] = useState('')
  const [showWhatsAppSender, setShowWhatsAppSender] = useState(false)
  
  // مودال التذكير السريع
  const [showQuickReminderModal, setShowQuickReminderModal] = useState(false)
  const [selectedClientForReminder, setSelectedClientForReminder] = useState(null)
  const [selectedClients, setSelectedClients] = useState([])
  
  // مودال إنشاء المتابعة
  const [showCreateFollowUpModal, setShowCreateFollowUpModal] = useState(false)
  const [selectedClientForFollowUp, setSelectedClientForFollowUp] = useState(null)

  // إعداد البحث المتقدم
  const searchOptions = {
    searchFields: ['name', 'email', 'phone', 'address'],
    filterFields: ['status', 'clientType', 'source', 'assignedTo'],
    sortFields: ['name', 'email', 'createdAt', 'lastContact'],
    defaultSort: 'name',
    defaultOrder: 'asc',
    itemsPerPage: 12
  }

  // إعداد البحث المتقدم بعد تحميل البيانات مع تطبيق فلترة الصلاحيات
  console.log('🔍 Raw clients from API:', clients?.length || 0, 'clients')
  console.log('🔍 Current user:', currentUser?.id, currentUser?.role)
  
  const searchData = (clients || []).filter(customFilter)
  console.log('🔍 Filtered clients after customFilter:', searchData?.length || 0, 'clients')
  
  const {
    results: filteredClients,
    totalCount,
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    currentPage,
    viewMode,
    savedSearches,
    handleSearch,
    handleFilter,
    handleSort,
    handlePageChange,
    setViewMode,
    saveSearch,
    loadSearch,
    exportResults,
    resetSearch,
    hasFilters
  } = useAdvancedSearch(searchData, searchOptions)

  // خيارات الفلاتر
  const filterOptions = {
    status: {
      label: 'الحالة',
      options: [
        { value: 'active', label: 'نشط' },
        { value: 'potential', label: 'محتمل' },
        { value: 'inactive', label: 'غير نشط' }
      ]
    },
    clientType: {
      label: 'نوع العميل',
      options: [
        { value: 'فردي', label: 'فردي' },
        { value: 'company', label: 'شركة' }
      ]
    },
    source: {
      label: 'المصدر',
      options: [
        { value: 'website', label: 'الموقع الإلكتروني' },
        { value: 'social', label: 'وسائل التواصل' },
        { value: 'referral', label: 'إحالة' },
        { value: 'advertising', label: 'إعلان' },
        { value: 'exhibition', label: 'معرض' }
      ]
    },
    assignedTo: {
      label: 'المسؤول',
      options: [
        { value: 'current_user', label: 'أنا' },
        { value: 'sales_team', label: 'فريق المبيعات' }
      ]
    }
  }

  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    status: 'active',
    clientType: 'فردي',
    source: 'website',
    assignedTo: ''
  })

  const handleAddClient = async (e) => {
    e.preventDefault()
    try {
      // Validate required fields
      if (!newClient.name || newClient.name.length < 2) {
        toast.error('اسم العميل مطلوب ويجب أن يكون على الأقل حرفين')
        return
      }
      if (!newClient.phone || newClient.phone.length < 10) {
        toast.error('رقم الهاتف مطلوب ويجب أن يكون على الأقل 10 أرقام')
        return
      }
      if (!newClient.source) {
        newClient.source = 'website' // Default source
      }
      if (newClient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) {
        toast.error('البريد الإلكتروني غير صحيح')
        return
      }

      // Clean data for backend - only send required fields
      const clientData = {
        name: newClient.name.trim(),
        phone: newClient.phone.trim(),
        status: newClient.status || 'active',
        source: newClient.source || 'website'
      }
      
      // Add optional fields only if they have values
      if (newClient.email && newClient.email.trim()) {
        clientData.email = newClient.email.trim()
      }
      if (newClient.address && newClient.address.trim()) {
        clientData.address = newClient.address.trim()
      }
      if (newClient.notes && newClient.notes.trim()) {
        clientData.notes = newClient.notes.trim()
      }
      if (newClient.budget && !isNaN(parseFloat(newClient.budget))) {
        clientData.budget = parseFloat(newClient.budget)
      }
      
      const result = await api.addClient(clientData)
      
      // Refresh the clients list
      refetch()
      
      // إشعار نجاح الإضافة للموظف الحالي
      notifyNewClient(newClient.name)
      
      // إرسال إشعار فوري للمديرين عبر SSE مع اسم الموظف
      await sendNewClientNotification(newClient.name, currentUser?.displayName || currentUser?.email || 'موظف')
      
      setNewClient({ 
        name: '', 
        email: '', 
        phone: '', 
        address: '', 
        notes: '', 
        status: 'active',
        clientType: 'فردي',
        source: '',
        assignedTo: ''
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('خطأ في إضافة العميل:', error)
    }
  }

  const handleEditClient = (client) => {
    setEditingClient(client)
  }

  const handleUpdateClient = async (e) => {
    e.preventDefault()
    try {
      // Clean the data before sending - remove null values and prepare for backend
      const cleanData = {
        name: editingClient.name?.trim(),
        phone: editingClient.phone?.trim(),
        status: editingClient.status || 'active',
        source: editingClient.source?.trim() || 'website'
      }
      
      // Add optional fields only if they have valid values
      if (editingClient.email && editingClient.email.trim() && editingClient.email !== 'null') {
        cleanData.email = editingClient.email.trim()
      }
      if (editingClient.address && editingClient.address.trim()) {
        cleanData.address = editingClient.address.trim()
      }
      if (editingClient.notes && editingClient.notes.trim()) {
        cleanData.notes = editingClient.notes.trim()
      }
      if (editingClient.budget && !isNaN(parseFloat(editingClient.budget))) {
        cleanData.budget = parseFloat(editingClient.budget)
      }
      if (editingClient.assignedTo) {
        cleanData.assignedTo = editingClient.assignedTo
      }

      await api.updateClient(editingClient.id, cleanData)
      refetch()
      setEditingClient(null)
      toast.success('تم تحديث العميل بنجاح')
    } catch (error) {
      console.error('خطأ في تحديث العميل:', error)
      toast.error('فشل في تحديث العميل')
    }
  }

  const handleDeleteClient = async (client) => {
    setClientToDelete(client)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return
    
    try {
      // تحديث حالة العميل للأرشفة بدلاً من الحذف النهائي
      await api.deleteClient(clientToDelete.id)
      refetch()
      toast.success('تم نقل العميل للأرشيف بنجاح')
    } catch (error) {
      console.error('خطأ في أرشفة العميل:', error)
      toast.error('حدث خطأ أثناء أرشفة العميل')
    } finally {
      setShowDeleteConfirm(false)
      setClientToDelete(null)
    }
  }

  // إضافة تذكير سريع للعميل
  const handleReminder = (client) => {
    setSelectedClientForReminder(client)
    setShowQuickReminderModal(true)
  }

  // إغلاق مودال التذكير
  const handleCloseReminderModal = () => {
    setShowQuickReminderModal(false)
    setSelectedClientForReminder(null)
  }

  // نجاح إنشاء التذكير
  const handleReminderSuccess = () => {
    // يمكن إضافة أي إجراءات إضافية هنا مثل تحديث العداد
    console.log('Reminder created successfully for client:', selectedClientForReminder?.name)
  }

  // عرض تفاصيل العميل
  const handleViewClient = (client) => {
    setViewingClient(client)
  }

  // تحويل العميل لعميل محتمل
  const handleConvertToLead = async (client) => {
    // منطق تحويل العميل لعميل محتمل
    toast.info('ميزة التحويل ستكون متاحة قريباً')
  }

  // إنشاء متابعة للعميل
  const handleCreateFollowUp = (client) => {
    setSelectedClientForFollowUp(client)
    setShowCreateFollowUpModal(true)
  }

  // عند إنشاء المتابعة بنجاح
  const handleFollowUpCreated = (followUp) => {
    console.log('✅ Follow-up created:', followUp)
    // يمكن إضافة تحديث للبيانات أو إشعارات هنا
  }

  // إغلاق مودال المتابعة
  const handleCloseCreateFollowUpModal = () => {
    setShowCreateFollowUpModal(false)
    setSelectedClientForFollowUp(null)
  }

  // إضافة ملاحظة
  const handleAddNote = async (note) => {
    try {
      if (!note?.itemId || !note?.content) {
        toast.error('بيانات الملاحظة غير مكتملة')
        return
      }

      // التأكد من وجود العميل
      const client = clients?.find(c => c.id === note.itemId)
      if (!client) {
        toast.error('العميل غير موجود')
        return
      }

      // إنشاء الملاحظة باستخدام Notes API
      const noteData = {
        content: note.content,
        itemType: 'client',
        itemId: note.itemId
      }

      const result = await api.addNote(noteData)
      
      console.log('تم إضافة ملاحظة:', result)
      toast.success('تم إضافة الملاحظة بنجاح')
      
      // إرسال إشعار للمديرين عن الملاحظة الجديدة
      await sendNoteAddedNotification(client.name, 'عميل', note.content)
      
      // إعادة تحميل التفاصيل إذا كان العميل معروضاً
      if (viewingClient && note?.itemId === viewingClient.id) {
        setViewingClient({...viewingClient, updatedAt: new Date()})
      }
    } catch (error) {
      console.error('خطأ في حفظ الملاحظة:', error)
      toast.error('حدث خطأ أثناء حفظ الملاحظة')
    }
  }

  // إضافة تفاعل
  const handleAddInteraction = async (interactionData) => {
    try {
      console.log('📋 Adding interaction:', interactionData)
      await api.addInteraction(interactionData)
      console.log('✅ Interaction added successfully')
      toast.success('تم إضافة التفاعل بنجاح')
      
      // البحث عن العميل لإرسال الإشعار
      const client = clients?.find(c => c.id === interactionData.itemId)
      if (client) {
        await sendInteractionAddedNotification(client.name, 'عميل', interactionData.type || 'تفاعل')
      }
      
      // إعادة تحميل التفاصيل إذا كان العميل معروضاً
      if (viewingClient && interactionData?.itemId === viewingClient.id) {
        setViewingClient({...viewingClient, updatedAt: new Date()})
      }
    } catch (error) {
      console.error('❌ Error adding interaction:', error)
      toast.error('حدث خطأ أثناء إضافة التفاعل')
    }
  }



  // === الإجراءات الجماعية ===
  
  const handleBulkDelete = async (clientIds) => {
    try {
      // نقل العملاء للأرشيف بدلاً من الحذف النهائي
      await Promise.all(
        clientIds.map(id => api.deleteClient(id))
      )
      toast.success(`تم نقل ${clientIds.length} عميل للأرشيف بنجاح`)
      // Refresh data to show changes
      refetch()
    } catch (error) {
      console.error('خطأ في نقل العملاء للأرشيف:', error)
      toast.error('فشل في نقل العملاء للأرشيف')
    }
  }

  // تم دمج وظيفة الأرشفة مع الحذف (كلاهما ينقل للأرشيف)

  const handleBulkExport = (selectedClientsData) => {
    try {
      // تحويل البيانات إلى CSV
      const csvHeaders = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'الموقع', 'النوع', 'الحالة', 'المصدر']
      const csvData = selectedClientsData.map(client => [
        client.name || '',
        client.phone || '',
        client.email || '',
        client.address || '',
        client.clientType || '',
        client.status || '',
        client.source || ''
      ])
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.join(','))
        .join('\n')
      
      // تنزيل الملف
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success(`تم تصدير ${selectedClientsData.length} عميل بنجاح`)
    } catch (error) {
      console.error('خطأ في التصدير:', error)
      toast.error('فشل في تصدير العملاء')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'secondary'
      case 'potential': return 'warning'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط'
      case 'inactive': return 'غير نشط'
      case 'potential': return 'محتمل'
      default: return 'غير محدد'
    }
  }

  if (loading) {
    return <LoadingPage message="جاري تحميل بيانات العملاء..." />
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8 text-white" />
              </div>
        <div>
                <h1 className="text-3xl font-bold text-white">
                  إدارة العملاء
                </h1>
                <p className="text-blue-100 mt-1">
                  {isSales() ? 
                    'العملاء الذين قمت بإضافتهم للنظام' :
                    'إدارة قاعدة بيانات العملاء والمعلومات الخاصة بهم'
                  }
                </p>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-blue-100 rounded-lg">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-bold">إضافة عميل جديد</span>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30 backdrop-blur-sm"
              >
                <Filter className="h-4 w-4 ml-2" />
                تصفية متقدمة
              </Button>
              
              <Button 
                onClick={() => setShowWhatsAppSender(true)}
                variant="outline"
                className="bg-green-600 bg-opacity-90 border-green-500 text-white hover:bg-green-700 backdrop-blur-sm"
              >
                <MessageCircle className="h-4 w-4 ml-2" />
                واتساب جماعي
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <Users className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <UserPlus className="h-16 w-16 text-white" />
        </div>
      </div>



      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي العملاء */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">إجمالي العملاء</p>
                <p className="text-3xl font-bold text-green-900">{filteredClients?.length || 0}</p>
                <p className="text-sm text-green-600 mt-1">+15% من الشهر الماضي</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* العملاء النشطين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">العملاء النشطين</p>
                <p className="text-3xl font-bold text-blue-900">
                  {filteredClients?.filter(c => c.status === 'active').length || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {filteredClients?.length ? Math.round((filteredClients.filter(c => c.status === 'active').length / filteredClients.length) * 100) : 0}% من الإجمالي
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* العملاء المحتملين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">العملاء المحتملين</p>
                <p className="text-3xl font-bold text-orange-900">
                  {filteredClients?.filter(c => c.status === 'potential').length || 0}
                </p>
                <p className="text-sm text-orange-600 mt-1">
                  {filteredClients?.length ? Math.round((filteredClients.filter(c => c.status === 'potential').length / filteredClients.length) * 100) : 0}% من الإجمالي
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* غير النشطين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">غير النشطين</p>
                <p className="text-3xl font-bold text-gray-900">
                  {filteredClients?.filter(c => c.status === 'inactive').length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredClients?.length ? Math.round((filteredClients.filter(c => c.status === 'inactive').length / filteredClients.length) * 100) : 0}% من الإجمالي
                </p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserX className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* قسم البحث المتقدم المخفي (يظهر عند الضغط على فلترة) */}
      {showAdvancedSearch && (
        <Card className="bg-white border-0 shadow-md rounded-xl overflow-hidden mb-6">
          <div className="border-b border-gray-100 bg-gray-50">
            <div className="p-4">
              <AdvancedSearch
                onSearch={handleSearch}
                onFilter={handleFilter}
                filters={filters}
                filterOptions={filterOptions}
                savedSearches={savedSearches}
                onSaveSearch={saveSearch}
                onLoadSearch={loadSearch}
              />
            </div>
          </div>
        </Card>
      )}
      
      <ClientsTable
          clients={filteredClients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onView={handleViewClient}
          onReminder={handleReminder}
          onConvertToLead={handleConvertToLead}
          onCreateFollowUp={handleCreateFollowUp}
          onAddNote={handleAddNote}
          onAddInteraction={handleAddInteraction}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          canEditClient={canEditClient}
          canDeleteClient={canDeleteClient}
          canBulkEditClients={canBulkEditClients}
          canBulkDeleteClients={canBulkDeleteClients}
          selectedClients={selectedClients}
          onSelectedClientsChange={setSelectedClients}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          clientNotes={clientNotes}
          clientInteractions={clientInteractions}
        />

      {/* منطقة الترقيم المدمجة */}
      {totalCount > searchOptions.itemsPerPage && (
        <Card className="bg-white border-0 shadow-md rounded-xl">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-600">
                <span>عرض {((currentPage - 1) * searchOptions.itemsPerPage) + 1}-{Math.min(currentPage * searchOptions.itemsPerPage, totalCount)}</span>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                {currentPage} / {Math.ceil(totalCount / searchOptions.itemsPerPage)}
              </Badge>
            </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalCount / searchOptions.itemsPerPage)}
          onPageChange={handlePageChange}
          totalItems={totalCount}
          itemsPerPage={searchOptions.itemsPerPage}
        />
          </div>
        </Card>
      )}



      {/* نتائج البحث القديمة - مخفية */}
      <div className="hidden">
      <SearchResults
        results={filterByRole(filteredClients || [], 'clients')}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        itemsPerPage={searchOptions.itemsPerPage}
        onSort={handleSort}
        onViewChange={setViewMode}
        onExport={exportResults}
        viewMode={viewMode}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchQuery={searchTerm}
        renderItem={(client) => (
          <Card key={client.id} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Header with gradient */}
            <div className={`relative overflow-hidden bg-gradient-to-br ${
              client.status === 'active' ? 'from-green-50 to-emerald-50 border-green-100' :
              client.status === 'inactive' ? 'from-gray-50 to-slate-50 border-gray-100' :
              client.status === 'potential' ? 'from-orange-50 to-red-50 border-orange-100' :
              'from-blue-50 to-indigo-50 border-blue-100'
            } border rounded-t-xl p-4`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${
                    client.status === 'active' ? 'from-green-500 to-green-600' :
                    client.status === 'inactive' ? 'from-gray-500 to-gray-600' :
                    client.status === 'potential' ? 'from-orange-500 to-orange-600' :
                    'from-blue-500 to-blue-600'
                  } rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-lg">
                      {client.name?.charAt(0) || 'ع'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
                    <Badge className={`${
                      client.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                      client.status === 'inactive' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                      client.status === 'potential' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                      'bg-blue-100 text-blue-800 border-blue-200'
                    } font-medium`}>
                      {getStatusText(client.status)}
                    </Badge>
                  </div>
                </div>
                <div className="relative">
                  <Button variant="ghost" size="sm" className="hover:bg-white hover:bg-opacity-50">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute top-2 right-2 opacity-20">
                <User className={`h-6 w-6 ${
                  client.status === 'active' ? 'text-green-600' :
                  client.status === 'inactive' ? 'text-gray-600' :
                  client.status === 'potential' ? 'text-orange-600' :
                  'text-blue-600'
                }`} />
              </div>
            </div>
            
            {/* Content */}
            <CardContent className="p-4 space-y-3">
              {client.email && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700 truncate">{client.email}</span>
                </div>
              )}
              
              {client.phone && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{formatPhoneNumber(client.phone)}</span>
                </div>
              )}
              
              {client.address && (
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-700 truncate">{client.address}</span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-700">آخر تواصل: {formatDateArabic(client.lastContact)}</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">تاريخ الإضافة: {formatDateArabic(client.createdAt)}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                {canEditClient(client) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    onClick={() => setEditingClient(client)}
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                )}
                {canDeleteClient(client) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    onClick={() => handleDeleteClient(client)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        renderListItem={(client) => (
          <Card key={client.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4 p-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${
                client.status === 'active' ? 'from-green-500 to-green-600' :
                client.status === 'inactive' ? 'from-gray-500 to-gray-600' :
                client.status === 'potential' ? 'from-orange-500 to-orange-600' :
                'from-blue-500 to-blue-600'
              } rounded-full flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold">
                  {client.name?.charAt(0) || 'ع'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <Badge className={`${
                    client.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                    client.status === 'inactive' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    client.status === 'potential' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  } font-medium`}>
                    {getStatusText(client.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-3 w-3 text-blue-600" />
                      </div>
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-3 w-3 text-green-600" />
                      </div>
                      <span>{formatPhoneNumber(client.phone)}</span>
                    </div>
                  )}
                </div>
                {/* عرض اسم الموظف المسؤول للمدير */}
                {(userProfile?.role === 'admin' || userProfile?.role === 'sales_manager') && (
                  <div className="flex items-center gap-2 text-xs text-purple-600 mt-2">
                    <div className="w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-2 w-2" />
                    </div>
                    <span>بواسطة: {getDisplayName(client)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {canEditClient(client) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingClient(client)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {canDeleteClient(client) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteClient(client)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
        emptyState={(
          <Card className="bizmax-card">
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء</h3>
              <p className="text-gray-500 mb-4">
                {isSales() ? (
                  'لم تقم بإضافة أي عملاء بعد. ابدأ بإضافة عميلك الأول.'
                ) : hasFilters ? 'لم يتم العثور على عملاء تطابق معايير البحث' : 'ابدأ بإضافة عميلك الأول'}
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة عميل جديد
              </Button>
            </div>
          </Card>
        )}
      />
      </div>

      {/* Add Client Modal - Enhanced */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 rounded-t-xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إضافة عميل جديد</h3>
                    <p className="text-blue-100 text-sm">املأ البيانات الأساسية للعميل</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleAddClient} className="flex flex-col flex-1 min-h-0">
              {/* محتوى النموذج القابل للتمرير */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👤 الاسم <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                      placeholder="أدخل اسم العميل الكامل"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    required
                      className="pl-10 w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📧 البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="example@company.com"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      className="pl-10 w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📱 رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <img src="https://flagcdn.com/w20/eg.png" alt="مصر" className="w-4 h-2.5" />
                      <span className="text-xs text-gray-600">+20</span>
                    </div>
                    <Input
                      placeholder="أدخل رقم الهاتف"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="pl-10 pr-16 w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📍 الموقع <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="أدخل موقع العميل"
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    required
                      className="pl-10 w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👥 نوع العميل
                  </label>
                  <div className="relative">
                  <select
                    value={newClient.clientType || 'فردي'}
                    onChange={(e) => setNewClient({...newClient, clientType: e.target.value})}
                      className="w-full py-2 px-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                      <option value="فردي">👤 فردي</option>
                      <option value="شركة">🏢 شركة</option>
                  </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🌐 مصدر العميل
                  </label>
                  <div className="relative">
                  <select
                    value={newClient.source || ''}
                    onChange={(e) => setNewClient({...newClient, source: e.target.value})}
                      className="w-full py-2 px-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">اختر المصدر</option>
                      <option value="website">🌐 الموقع الإلكتروني</option>
                      <option value="social">📱 وسائل التواصل</option>
                      <option value="referral">🤝 إحالة من عميل</option>
                      <option value="advertising">📢 إعلان</option>
                      <option value="phone">📞 مكالمة هاتفية</option>
                      <option value="visit">🏢 زيارة المكتب</option>
                  </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📊 الحالة
                  </label>
                  <div className="relative">
                  <select
                    value={newClient.status || 'active'}
                    onChange={(e) => setNewClient({...newClient, status: e.target.value})}
                      className="w-full py-2 px-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="نشط">🟢 نشط</option>
                      <option value="potential">🟡 محتمل</option>
                      <option value="inactive">🔴 غير نشط</option>
                  </select>
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    💰 الميزانية المتوقعة
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400 text-sm">ج.م</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newClient.budget || ''}
                      onChange={(e) => setNewClient({...newClient, budget: e.target.value})}
                      className="pl-12 w-full py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 ملاحظات
                  </label>
                  <div className="relative">
                  <textarea
                      placeholder="اكتب أي ملاحظات إضافية عن العميل..."
                    value={newClient.notes || ''}
                    onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                    <div className="absolute bottom-2 right-3 text-xs text-gray-400">
                      {(newClient.notes || '').length}/500
                    </div>
                  </div>
                </div>
              </div>

              </div>

              {/* أزرار الحفظ والإلغاء - ثابتة في الأسفل */}
              <div className="flex-shrink-0 p-4 border-t bg-gray-50 rounded-b-xl">
                <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddModal(false)}
                    className="px-6 py-2"
                >
                  إلغاء
                </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-2 font-medium"
                  >
                    <UserPlus className="h-4 w-4 ml-2" />
                  إضافة العميل
                </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-6">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">تعديل بيانات العميل</h3>
                    <p className="text-blue-100 text-sm">تحديث معلومات {editingClient.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingClient(null)}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm"
                >
                  <XCircle className="h-5 w-5 text-white" />
                </button>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
              <form onSubmit={handleUpdateClient} className="p-8">
                {/* Main Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    المعلومات الأساسية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">اسم العميل *</label>
                      <div className="relative">
                        <Input
                          value={editingClient.name || ''}
                          onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                          className="w-full pl-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          placeholder="أدخل اسم العميل"
                          required
                        />
                        <User className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">رقم الهاتف *</label>
                      <div className="relative">
                        <Input
                          value={editingClient.phone || ''}
                          onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                          className="w-full pl-10 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                          placeholder="رقم الهاتف"
                          required
                        />
                        <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">البريد الإلكتروني</label>
                      <div className="relative">
                        <Input
                          type="email"
                          value={editingClient.email || ''}
                          onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                          className="w-full pl-10 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                          placeholder="البريد الإلكتروني (اختياري)"
                        />
                        <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">حالة العميل</label>
                      <div className="relative">
                        <select
                          value={editingClient.status || 'active'}
                          onChange={(e) => setEditingClient({...editingClient, status: e.target.value})}
                          className="w-full pl-10 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none bg-white"
                        >
                          <option value="active">✅ نشط</option>
                          <option value="potential">🎯 محتمل</option>
                          <option value="inactive">⏸️ غير نشط</option>
                        </select>
                        <CheckCircle className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    معلومات إضافية
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">العنوان</label>
                      <Input
                        value={editingClient.address || ''}
                        onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                        className="w-full py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                        placeholder="عنوان العميل (اختياري)"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">الميزانية المقدرة</label>
                      <Input
                        type="number"
                        value={editingClient.budget || ''}
                        onChange={(e) => setEditingClient({...editingClient, budget: e.target.value})}
                        className="w-full py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">ملاحظات</label>
                    <textarea
                      value={editingClient.notes || ''}
                      onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                      className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                      rows="3"
                      placeholder="أي ملاحظات إضافية عن العميل..."
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingClient(null)} 
                    className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    حفظ التغييرات
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* مودال عرض التفاصيل المحسن */}
      {viewingClient && (
        <ClientDetailsModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
          onUpdateClient={(clientId, updates) => {
            // تحديث بيانات العميل
            console.log('تحديث العميل:', clientId, updates)
            // 🔥 إعادة تحميل البيانات بعد التحديث
            refetch()
          }}
        />
      )}

      {/* حوار تأكيد الحذف */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setClientToDelete(null)
        }}
        onConfirm={confirmDeleteClient}
        title="تأكيد نقل العميل للأرشيف"
        message={`هل أنت متأكد من نقل العميل "${clientToDelete?.name}" إلى الأرشيف؟ يمكنك استعادته لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />

      {/* مودال التذكير السريع */}
      <QuickReminderModal
        isOpen={showQuickReminderModal}
        onClose={handleCloseReminderModal}
        client={selectedClientForReminder}
        onSuccess={handleReminderSuccess}
      />

      {/* مودال واتساب */}
      {showWhatsAppSender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إرسال رسائل واتساب للعملاء</h3>
                    <p className="text-green-100 text-sm">اختر العملاء وأرسل رسائل جماعية</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWhatsAppSender(false)}
                  className="text-white hover:bg-white/20 p-2 h-auto"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden p-6">
              <WhatsAppSender
                contacts={filteredClients?.filter(client => client.phone) || []}
                onSend={(selectedIds, message) => {
                  console.log('Sending WhatsApp to:', selectedIds, 'Message:', message)
                  setShowWhatsAppSender(false)
                }}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Follow-Up Modal */}
      <CreateFollowUpModal
        isOpen={showCreateFollowUpModal}
        onClose={handleCloseCreateFollowUpModal}
        client={selectedClientForFollowUp}
        onFollowUpCreated={handleFollowUpCreated}
        api={api}
      />
    </div>
  )
}