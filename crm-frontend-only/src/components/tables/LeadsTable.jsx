import React, { useState, useEffect, useMemo } from 'react'
import { 
  WhatsAppButton, 
  InteractionsButton, 
  NotesButton, 
  EditButton, 
  DeleteButton,
  ViewButton,
  ActionDropdown
} from '../actions/ActionButtons'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatDateArabic, formatPhoneNumber } from '../../lib/utils'
import { 
  User, 
  MapPin, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  Star,
  UserPlus,
  Archive,
  Target,
  Award,
  Trash2,
  Download,
  ArchiveX,
  Edit3,
  Check,
  X,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { useApi } from '../../hooks/useApi'
import ConfirmDialog from '../ui/ConfirmDialog'

export default function LeadsTable({ 
  leads, 
  onEdit, 
  onDelete, 
  onView,
  onReminder,
  onViewRating,
  onUpdateRating,
  onConvertToClient,
  onUpdateScore,
  onAddNote,
  onAddInteraction,
  onAddTask,
  onBulkDelete,
  onBulkArchive,
  onBulkExport,
  canEditLead,
  canDeleteLead,
  canConvertLead,
  onSelectedLeadsChange,
  selectedLeads: propSelectedLeads,
  pageSize,
  onPageSizeChange
}) {
  // LeadsTable rendered successfully
  const { currentUser, userProfile } = useAuth()
  const { canEdit, canDelete, checkPermission, isAdmin, isSalesManager, isSales } = usePermissions()
  const api = useApi()
  const [users, setUsers] = useState([])
  
  // استخدام selectedLeads من الصفحة الرئيسية إذا كان متاح، وإلا استخدام الـ state المحلي
  const [localSelectedLeads, setLocalSelectedLeads] = useState([])
  const selectedLeads = propSelectedLeads || localSelectedLeads
  const setSelectedLeads = onSelectedLeadsChange || setLocalSelectedLeads
  const [editingAssignee, setEditingAssignee] = useState(null)
  const [salesStaff, setSalesStaff] = useState([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  
  // حالات الفلاتر
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSource, setFilterSource] = useState('all')
  const [filterEmployee, setFilterEmployee] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Helper functions للملاحظات والتفاعلات من بيانات الـ lead نفسه
  const getNotesCount = (lead) => {
    return lead?.notesCount || 0
  }

  const getInteractionsCount = (lead) => {
    return lead?.interactionsCount || 0
  }

  // نظام الصلاحيات المحدث مع النظام الديناميكي
  const hasAdminPermissions = useMemo(() => isAdmin() || isSalesManager(), [isAdmin, isSalesManager])

  // استخدام دوال الصلاحيات المُمررة من الصفحة الأساسية أو fallback للمحلية
  const checkEditPermission = useMemo(() => {
    return canEditLead || ((lead) => {
      if (isAdmin()) return true
      if (isSalesManager()) return checkPermission('edit_leads')
      return false
    })
  }, [canEditLead, isAdmin, isSalesManager, checkPermission])

  const checkDeletePermission = useMemo(() => {
    return canDeleteLead || ((lead) => {
      if (isAdmin()) return true
      if (isSalesManager()) return checkPermission('delete_leads')
      return false
    })
  }, [canDeleteLead, isAdmin, isSalesManager, checkPermission])

  const checkConvertPermission = useMemo(() => {
    // إذا تم تمرير دالة من الصفحة الرئيسية، استخدمها
    if (canConvertLead && typeof canConvertLead === 'function') {
      return canConvertLead
    }
    
    // وإلا استخدم المنطق المحلي
    return (lead) => {
      if (isAdmin()) return true
      if (isSalesManager()) return checkPermission('convert_leads')
      // السماح لموظفي المبيعات بتحويل العملاء المحتملين المخصصين لهم أو الذين أنشأوهم
      if (isSales()) {
        // فحص الصلاحية أولاً
        const hasPermission = checkPermission('convert_leads')
        if (!hasPermission) return false
        
        // ثم فحص الملكية مع multiple identifiers
        const userId = currentUser?.uid || currentUser?.id || userProfile?.id
        const userEmail = currentUser?.email || userProfile?.email
        const userName = userProfile?.displayName || userProfile?.name || currentUser?.displayName
        
        // فحص مع تحويل للنص للمقارنة الصحيحة
        const leadAssignedTo = String(lead.assignedTo || '').toLowerCase()
        const leadCreatedBy = String(lead.createdBy || '').toLowerCase()
        
        return leadAssignedTo === String(userId || '').toLowerCase() || 
               leadAssignedTo === String(userEmail || '').toLowerCase() || 
               leadAssignedTo === String(userName || '').toLowerCase() ||
               leadCreatedBy === String(userId || '').toLowerCase() ||
               leadCreatedBy === String(userEmail || '').toLowerCase() ||
               leadCreatedBy === String(userName || '').toLowerCase()
      }
      return checkPermission('convert_leads')
    }
  }, [canConvertLead, isAdmin, isSalesManager, isSales, checkPermission, currentUser, userProfile])

  // التحقق من صلاحيات تحويل لعميل (باستخدام النظام الديناميكي)
  const canConvertToClient = (lead) => {
    if (isAdmin()) {
      return true // مدير النظام له جميع الصلاحيات
    }
    if (isSalesManager()) {
      return checkPermission('convert_leads') // فحص الصلاحية الديناميكية
    }
    if (isSales()) {
      // استخدام نفس منطق checkConvertPermission
      return checkConvertPermission(lead)
    }
    return false
  }

  // التحقق من صلاحيات تغيير المسؤول (باستخدام النظام الديناميكي)
  const canChangeAssignee = (lead) => {
    if (isAdmin()) {
      return true // مدير النظام له جميع الصلاحيات
    }
    if (isSalesManager()) {
      return checkPermission('edit_leads') // فحص الصلاحية الديناميكية
    }
    return false
  }

  // جلب المستخدمين من الـ API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.getUsers()
        if (response.success && response.data) {
          setUsers(response.data)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setUsers([])
      }
    }
    
    fetchUsers()
  }, [])

  // جلب موظفي المبيعات
  useEffect(() => {
    if (users && users.length > 0) {
      const salesEmployees = users.filter(user => 
        (user.role === 'sales' || user.role === 'sales_manager') && user.status === 'active'
      )
      setSalesStaff(salesEmployees)
    }
  }, [users])

  // تحديث المسؤول
  const handleUpdateAssignee = async (leadId, newAssigneeId) => {
    try {
      // تحويل إلى number إذا كان string
      const assigneeId = parseInt(newAssigneeId)
      const newAssignee = salesStaff.find(staff => staff.id === assigneeId || staff.id === newAssigneeId)
      if (!newAssignee) {

        toast.error('موظف المبيعات غير موجود')
        return
      }

      // تحديث العميل المحتمل في الـ API
      await api.updateLead(leadId, {
        assignedTo: assigneeId,
        assignedToName: newAssignee.name
      })

      toast.success(`تم تخصيص ${newAssignee.name} كمسؤول بنجاح`)
      setEditingAssignee(null)
      
      // إعادة تحميل البيانات
      if (typeof window !== 'undefined' && window.location) {
        window.location.reload()
      }
    } catch (error) {
      console.error('خطأ في تحديث المسؤول:', error)
      toast.error('فشل في تحديث المسؤول')
    }
  }

  // تحويل إلى عميل
  const convertToClient = (lead) => {
    onConvertToClient?.(lead)
    toast.success(`تم تحويل ${lead.name} إلى عميل`)
  }

  // تحديث نقاط العميل المحتمل
  const updateLeadScore = (lead, newScore) => {
    onUpdateScore?.(lead.id, newScore)
    toast.success(`تم تحديث تقييم ${lead.name}`)
  }

  // تحديد أولوية عالية
  const setHighPriority = (lead) => {
    toast.success(`تم تحديد ${lead.name} كأولوية عالية`)
  }

  // === الإجراءات الجماعية ===
  
  // حذف العملاء المحتملين المحددين
  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) return
    setShowBulkDeleteConfirm(true)
  }

  // تأكيد الحذف الجماعي
  const confirmBulkDelete = async () => {
    try {
      await onBulkDelete?.(selectedLeads)
      setSelectedLeads([])
      setShowBulkDeleteConfirm(false)
    } catch (error) {
      console.error('خطأ في العملية الجماعية:', error)
    }
  }



  // تصدير العملاء المحتملين المحددين
  const handleBulkExport = () => {
    if (selectedLeads.length === 0) return
    
    const selectedLeadsData = leads.filter(lead => selectedLeads.includes(lead.id))
    onBulkExport?.(selectedLeadsData)
    toast.success(`تم تصدير ${selectedLeads.length} عميل محتمل`)
  }

  // إلغاء تحديد جميع العملاء المحتملين
  const clearSelection = () => {
    setSelectedLeads([])
  }
  
  // فلترة البيانات
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
      const matchesSource = filterSource === 'all' || lead.source === filterSource
      const matchesEmployee = filterEmployee === 'all' || 
        String(lead.assignedTo) === String(filterEmployee) ||
        lead.assignedToName === filterEmployee
      
      return matchesSearch && matchesStatus && matchesSource && matchesEmployee
    })
  }, [leads, searchTerm, filterStatus, filterSource, filterEmployee])
  
  // حفظ البحث
  const handleSaveSearch = () => {
    const searchCriteria = {
      searchTerm,
      filterStatus,
      filterSource,
      filterEmployee,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('savedLeadsSearch', JSON.stringify(searchCriteria))
    toast.success('تم حفظ معايير البحث بنجاح')
  }
  
  // تصدير البيانات المفلترة
  const handleExportFiltered = () => {
    const dataToExport = filteredLeads
    if (dataToExport.length === 0) {
      toast.error('لا توجد بيانات للتصدير')
      return
    }
    onBulkExport?.(dataToExport)
    toast.success(`تم تصدير ${dataToExport.length} عميل محتمل`)
  }
  
  // إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    setFilterStatus('all')
    setFilterSource('all')
    setFilterEmployee('all')
    setSearchTerm('')
    toast.success('تم إعادة تعيين الفلاتر')
  }

  // إجراءات إضافية لكل عميل محتمل (حسب نظام الصلاحيات الجديد)
  const getAdditionalActions = (lead) => {
    // Getting actions for lead
    const actions = []
    
    // عرض التقييم
    actions.push({
      icon: Target,
      label: 'عرض التقييم',
      onClick: () => onViewRating && onViewRating(lead),
      color: 'text-blue-600'
    })
    
    const canConvert = checkConvertPermission(lead)
    
    if (canConvert) {
      actions.push({
        icon: UserPlus,
        label: 'تحويل لعميل فعلي',
        onClick: () => onConvertToClient(lead),
        color: 'text-green-600'
      })
    }
    
    if (hasAdminPermissions) {
      actions.push(
        {
          icon: Star,
          label: 'أولوية عالية',
          onClick: () => setHighPriority(lead),
          color: 'text-yellow-600'
        },
        {
          icon: Target,
          label: 'تحديث التقييم',
          onClick: () => onUpdateRating && onUpdateRating(lead),
          color: 'text-blue-600'
        }
      )
    }
    
    return actions
  }

  // ألوان الحالات
  const getStatusColor = (status) => {
    const colors = {
      'جديد': 'bg-blue-100 text-blue-800',
      'مهتم': 'bg-green-100 text-green-800',
      'مؤهل': 'bg-emerald-100 text-emerald-800',
      'غير مهتم': 'bg-red-100 text-red-800',
      'محول': 'bg-purple-100 text-purple-800',
      'مؤجل': 'bg-yellow-100 text-yellow-800',
      'بارد': 'bg-blue-100 text-blue-800',
      'دافئ': 'bg-yellow-100 text-yellow-800',
      'ساخن': 'bg-red-100 text-red-800',
      'cold': 'bg-blue-100 text-blue-800',
      'warm': 'bg-yellow-100 text-yellow-800',
      'hot': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // ترجمة الحالات للعربية
  const translateStatus = (status) => {
    const translations = {
      'cold': 'بارد',
      'warm': 'دافئ', 
      'hot': 'ساخن',
      'converted': 'محول',
      'qualified': 'مؤهل',
      'new': 'جديد',
      'interested': 'مهتم',
      'not_interested': 'غير مهتم',
      'postponed': 'مؤجل'
    }
    return translations[status] || status || 'جديد'
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-8 text-center">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء محتملين</h3>
        <p className="text-gray-600">ابدأ بإضافة أول عميل محتمل لك</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 shadow-lg bg-white overflow-hidden">
      {/* Table Header with Integrated Search - نفس تصميم المطورين */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-orange-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-orange-600" />
            <div>
              <h3 className="text-lg font-semibold text-orange-900">قائمة العملاء المحتملين</h3>
              <p className="text-sm text-orange-600">{filteredLeads.length} من أصل {leads.length} عميل محتمل</p>
            </div>
          </div>
          {/* البحث والفلاتر المدمجة */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث سريع..."
                  className="pl-10 pr-10 h-8 w-48 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* اختيار حجم الصفحة */}
              {onPageSizeChange && (
                <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-1">
                  <span className="text-orange-700 text-xs font-medium">عرض:</span>
                  <select 
                    value={pageSize || 100} 
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="bg-transparent border-0 text-orange-700 text-xs rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                    <option value={2000}>2000</option>
                    <option value={5000}>5000</option>
                    <option value={10000}>الكل (10000)</option>
                  </select>
                  <span className="text-orange-700 text-xs font-medium">عميل</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                  onClick={() => setShowFilterModal(true)}
                >
                  <Filter className="h-3 w-3 ml-1" />
                  فلترة
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                  onClick={handleSaveSearch}
                >
                  حفظ البحث
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                  onClick={handleExportFiltered}
                >
                  تصدير
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط الإجراءات الجماعية */}
      {selectedLeads.length > 0 && (
        <div className="bg-orange-100 border-b border-orange-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-orange-900">
                تم تحديد {selectedLeads.length} عميل محتمل
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-orange-600 hover:text-orange-800"
              >
                إلغاء التحديد
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
                className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredLeads.length === 0 ? (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد عملاء محتملين
          </h3>
          <p className="text-gray-600 mb-4">
            ابدأ بإضافة العملاء المحتملين لإدارة قاعدة بياناتك
          </p>
        </div>
      ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gradient-to-r from-orange-50 to-red-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input 
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLeads(filteredLeads.map(l => l.id))
                    } else {
                      setSelectedLeads([])
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                العميل المحتمل
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                معلومات التواصل
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                الحالة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                المسؤول
              </th>
              {(isAdmin() || isSalesManager()) && (
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">
                  مورد البيانات
                </th>
              )}
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                تاريخ الإضافة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                إجراءات سريعة
              </th>
              <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[60px]">
                المزيد
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-orange-25 hover:to-red-25 transition-all duration-200 cursor-pointer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(255 247 237), rgb(254 226 226))'; // orange-50 to red-100
                  e.currentTarget.style.borderLeftColor = 'rgb(249 115 22)'; // orange-500
                  e.currentTarget.style.borderLeftWidth = '4px';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(249, 115, 22, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.borderLeftWidth = '0px';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* تحديد */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLeads([...selectedLeads, lead.id])
                      } else {
                        setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </td>

                {/* العميل المحتمل */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{lead.name}</span>
                        {/* Indicators للتفاعلات والملاحظات */}
                        <div className="flex items-center gap-1">
                          {getInteractionsCount(lead) > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-1.5 py-0.5 text-xs flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{getInteractionsCount(lead)}</span>
                            </Badge>
                          )}
                          {getNotesCount(lead) > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-1.5 py-0.5 text-xs flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{getNotesCount(lead)}</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                {/* معلومات التواصل */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    {lead.phone && (
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="h-3 w-3 text-gray-400 ml-1" />
                        {formatPhoneNumber(lead.phone)}
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400 ml-1" />
                        {lead.email}
                      </div>
                    )}
                  </div>
                </td>

                {/* الحالة */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(lead.status)}
                  >
                    {translateStatus(lead.status)}
                  </Badge>
                </td>

                {/* المسؤول */}
                <td className="px-3 py-4 whitespace-nowrap">
                  {editingAssignee === lead.id && canChangeAssignee(lead) ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
                        defaultValue={lead.assignedTo?.toString() || ''}
                        onChange={(e) => handleUpdateAssignee(lead.id, e.target.value)}
                      >
                        <option value="">غير محدد</option>
                        {salesStaff.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name || staff.email}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAssignee(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-sm text-gray-900">
                        {lead.assignedToName || lead.createdByName || 'غير محدد'}
                      </span>
                      {canChangeAssignee(lead) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAssignee(lead.id)}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="تغيير المسؤول (المدير فقط)"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </td>

                {/* مورد البيانات */}
                {(isAdmin() || isSalesManager()) && (
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {lead.source || 'غير محدد'}
                    </div>
                  </td>
                )}

                {/* تاريخ الإضافة */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-3 w-3 text-gray-400 ml-1" />
                    {formatDateArabic(lead.createdAt)}
                  </div>
                </td>

                {/* إجراءات سريعة */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg shadow-sm">
                    <WhatsAppButton 
                      phone={lead.phone}
                      name={lead.name}
                      message={`مرحباً ${lead.name}، نود مناقشة اهتمامك بخدماتنا العقارية وتقديم أفضل العروض.`}
                    />
                    <InteractionsButton 
                      onAddInteraction={onAddInteraction}
                      itemId={lead.id}
                      itemName={lead.name}
                      itemType="lead"
                    />
                    <NotesButton 
                      onAddNote={onAddNote}
                      itemId={lead.id}
                      itemName={lead.name}
                    />
                  </div>
                </td>

                {/* المزيد من الإجراءات */}
                <td className="px-3 py-4 whitespace-nowrap">
                  <ActionDropdown
                    item={lead}
                    onEdit={checkEditPermission(lead) ? onEdit : null}
                    onDelete={checkDeletePermission(lead) ? onDelete : null}
                    onView={onView}
                    onReminder={onReminder}
                    additionalActions={getAdditionalActions(lead)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Table Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>إجمالي العملاء المحتملين: {leads.length}</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>نشط: {leads.filter(l => l.status === 'نشط').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>غير نشط: {leads.filter(l => l.status === 'غير نشط').length}</span>
              </div>
            </div>
            <div>عرض {leads.length} من أصل {leads.length}</div>
          </div>
        </div>
      </div>
      )}

      {/* Modal الفلتر المتقدم */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">الفلاتر المتقدمة</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* فلتر الحالة */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">الكل</option>
                  <option value="new">جديد</option>
                  <option value="contacted">تم التواصل</option>
                  <option value="interested">مهتم</option>
                  <option value="qualified">مؤهل</option>
                  <option value="cold">بارد</option>
                  <option value="warm">دافئ</option>
                  <option value="hot">ساخن</option>
                </select>
              </div>

              {/* فلتر المصدر */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المصدر
                </label>
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">الكل</option>
                  <option value="website">موقع إلكتروني</option>
                  <option value="social_media">وسائل التواصل</option>
                  <option value="referral">إحالة</option>
                  <option value="cold_call">اتصال بارد</option>
                  <option value="exhibition">معرض</option>
                  <option value="advertising">إعلان</option>
                </select>
              </div>

              {/* فلتر الموظف المسؤول - للمديرين فقط */}
              {(isAdmin() || isSalesManager()) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الموظف المسؤول
                  </label>
                  <select
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">الكل</option>
                    {salesStaff.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role === 'sales' ? 'مبيعات' : 'مندوب مبيعات'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-3 mt-6">
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="flex-1"
              >
                <X className="h-4 w-4 ml-2" />
                إعادة تعيين
              </Button>
              <Button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Check className="h-4 w-4 ml-2" />
                تطبيق
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* حوار تأكيد نقل العملاء المحتملين للأرشيف */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="تأكيد نقل العملاء المحتملين للأرشيف"
        message={`هل أنت متأكد من نقل ${selectedLeads.length} عميل محتمل إلى الأرشيف؟ يمكنك استعادتهم لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />
    </div>
  )
}
