import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  User,
  Building2,
  Eye,
  MoreHorizontal,
  TrendingUp,
  CreditCard,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Download,
  ArchiveX,
  XCircle,
  Star,
  X
} from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import useSales from '../hooks/useSales'
import useClients from '../hooks/useClients'
import useProjects from '../hooks/useProjects'
import useUnits from '../hooks/useUnits'
import { usePermissions } from '../hooks/usePermissions'
// Removed firestore service - using local data only
// تم حذف خدمة إشعارات المبيعات مؤقتاً
import { formatCurrency, formatDateArabic } from '../lib/utils'
import { LoadingPage } from '../components/ui/loading'
import { useAuth } from '../contexts/AuthContext'
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import toast from 'react-hot-toast'

export default function Sales() {
  const api = useApi()
  const { currentUser, userProfile } = useAuth()
  const { sendNewSaleNotification } = useSSENotificationSender()
  const { sales, loading: salesLoading, refetch } = useSales()
  const { clients, loading: clientsLoading } = useClients()
  const { projects, loading: projectsLoading } = useProjects()
  const { units, loading: unitsLoading } = useUnits()
  const { 
    isAdmin, 
    isSalesManager, 
    isSales, 
    checkPermission,
    filterByRole 
  } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [quickSearchTerm, setQuickSearchTerm] = useState('')

  // دوال التحقق من الصلاحيات للمبيعات
  const canCreateSale = () => {
    return isAdmin() || checkPermission('create_sales')
  }

  const canEditSale = (sale) => {
    if (!sale) return false
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('edit_sales')
    if (isSales()) {
      const hasPermission = checkPermission('edit_sales')
      if (!hasPermission) return false
      return sale.assignedTo === currentUser?.uid || sale.createdBy === currentUser?.uid
    }
    return false
  }

  const canDeleteSale = (sale) => {
    if (!sale) return false
    if (isAdmin()) return true
    if (isSalesManager()) return checkPermission('delete_sales')
    if (isSales()) {
      const hasPermission = checkPermission('delete_sales')
      if (!hasPermission) return false
      return sale.assignedTo === currentUser?.uid || sale.createdBy === currentUser?.uid
    }
    return false
  }

  const canViewAllSales = () => {
    return isAdmin() || checkPermission('view_all_sales')
  }
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState(null)
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableUnits, setAvailableUnits] = useState([])
  const [selectedUnit, setSelectedUnit] = useState(null)
  
  // Pagination state
  const [pageSize, setPageSize] = useState(50) // حجم الصفحة المختار
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // دالة تغيير حجم الصفحة
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1) // العودة للصفحة الأولى
    // إعادة جلب البيانات بالحجم الجديد
    refetch() // استخدام refetch من useSales hook
  }
  
  // دالة تغيير الصفحة
  const handlePageChange = (page) => {
    setCurrentPage(page)
    refetch() // إعادة جلب البيانات للصفحة الجديدة
  }

  const loading = salesLoading || clientsLoading || projectsLoading || unitsLoading

  const [newSale, setNewSale] = useState({
    clientId: '',
    clientName: '',
    projectId: '',
    projectName: '',
    unitId: '',
    unitNumber: '',
    salePrice: 0,
    downPayment: 0,
    installments: 0,
    commissionRate: 0,
    commissionAmount: 0,
    totalAmount: 0,
    saleDate: '',
    status: 'pending',
    paymentStatus: 'pending',
    notes: ''
  })

  // دالة لتحديث الوحدات المتاحة عند تغيير المشروع
  const updateAvailableUnits = (projectId) => {
    if (!projectId || !units) {
      setAvailableUnits([])
      return
    }

    // فلترة الوحدات المتاحة للبيع في هذا المشروع
    const projectUnits = units.filter(unit => 
      unit.projectId == projectId && // == للمقارنة بين string و number
      unit.status === 'available' // الوحدات المتاحة فقط (غير مباعة وغير مؤرشفة)
    )

    console.log('🏗️ جميع الوحدات:', units)
    console.log('🎯 المشروع المحدد:', projectId, typeof projectId)
    console.log('🔍 فلترة الوحدات للمشروع:', units?.filter(unit => unit.projectId == projectId))
    console.log('📊 حالة كل وحدة:', units?.filter(unit => unit.projectId == projectId)?.map(u => ({id: u.id, status: u.status, projectId: u.projectId})))
    console.log('✅ الوحدات المتاحة للمشروع:', projectUnits)
    setAvailableUnits(projectUnits)
    
    // إعادة تعيين الوحدة المحددة
    setSelectedUnit(null)
    setNewSale(prev => ({
      ...prev,
      unitId: '',
      unitNumber: '',
      salePrice: 0,
      totalAmount: 0
    }))
  }

  // دالة لتحديث بيانات البيع عند اختيار الوحدة
  const handleUnitSelection = (unitId) => {
    console.log('🚀 تم استدعاء handleUnitSelection مع:', unitId)
    console.log('🎯 Unit ID المحدد:', unitId, typeof unitId)
    console.log('🏠 الوحدات المتاحة:', availableUnits?.map(u => ({id: u.id, type: typeof u.id})))
    const unit = availableUnits.find(u => u.id == unitId) // == للمقارنة بين string و number
    console.log('🔍 الوحدة الموجودة:', unit)
    if (unit) {
      setSelectedUnit(unit)
      const unitPrice = Math.round(unit.price || 0) // تقريب السعر لأقرب عدد صحيح
      const commissionAmount = Math.round(unitPrice * (newSale.commissionRate / 100))
      setNewSale(prev => ({
        ...prev,
        unitId: unit.id.toString(), // تحويل لـ string عشان الـ select
        unitNumber: unit.unitNumber,
        salePrice: unitPrice,
        totalAmount: unitPrice + commissionAmount,
        commissionAmount
      }))
      console.log('✅ تم اختيار الوحدة:', unit)
      console.log('💰 السعر الأصلي:', unit.price)
      console.log('💰 السعر بعد التقريب:', unitPrice)
      console.log('💼 نسبة العمولة:', newSale.commissionRate)
      console.log('💰 مبلغ العمولة:', commissionAmount)
    } else {
      console.log('❌ لم يتم العثور على الوحدة!')
      setSelectedUnit(null)
      setNewSale(prev => ({
        ...prev,
        unitId: '',
        unitNumber: '',
        salePrice: 0,
        totalAmount: 0,
        commissionAmount: 0
      }))
    }
  }

  // Apply role-based filtering first, then search filters
  const roleFilteredSales = filterByRole(sales || [], 'sales')
  
  const filteredSales = roleFilteredSales?.filter(sale => {
    // استبعاد المبيعات المؤرشفة من العرض العادي
    if (sale.status === 'archived') return false
    
    // البحث العادي
    const matchesSearch = !searchTerm || 
      sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // البحث السريع
    const matchesQuickSearch = !quickSearchTerm || 
      sale.clientName?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      sale.projectName?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      sale.unitNumber?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      sale.agentName?.toLowerCase().includes(quickSearchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || sale.status === selectedStatus
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || sale.paymentStatus === selectedPaymentStatus
    
    return matchesSearch && matchesQuickSearch && matchesStatus && matchesPaymentStatus
  }) || []

  const handleAddSale = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // تحضير البيانات للباك إند
      const selectedClient = clients?.find(c => c.id == newSale.clientId)
      const selectedUnit = availableUnits?.find(u => u.id == newSale.unitId)
      
      const saleData = {
        clientId: parseInt(newSale.clientId) || null,
        clientName: selectedClient?.name || 'عميل غير محدد',
        projectId: parseInt(newSale.projectId) || null,
        projectName: newSale.projectName,
        unitType: selectedUnit?.type || 'غير محدد',
        price: newSale.salePrice,
        commission: newSale.commissionAmount,
        status: newSale.status === 'contract_signed' ? 'pending' : newSale.status, // تحويل للقيم المقبولة
        saleDate: newSale.saleDate ? new Date(newSale.saleDate) : new Date(),
        notes: newSale.notes || '',
        // إضافة البيانات الإضافية
        unitId: parseInt(newSale.unitId) || null,
        unitNumber: newSale.unitNumber,
        downPayment: newSale.downPayment,
        installments: newSale.installments,
        commissionRate: newSale.commissionRate,
        totalAmount: newSale.totalAmount,
        paymentStatus: newSale.paymentStatus
      }
      
      console.log('📤 البيانات المرسلة للباك إند:', saleData)
      const result = await api.addSale(saleData)
      const saleId = result.data.id
      
      // إرسال إشعار للمديرين عن البيعة الجديدة
      try {
        await sendNewSaleNotification(
          selectedClient?.name || 'عميل غير محدد', 
          newSale.salePrice || 0, 
          newSale.projectName || ''
        )
        console.log('✅ تم إرسال إشعار البيعة الجديدة')
      } catch (notificationError) {
        console.warn('⚠️ فشل في إرسال إشعار البيعة:', notificationError)
      }
      
      // تحديث حالة الوحدة إلى "مباعة" أو "محجوزة" حسب حالة البيع
      if (newSale.unitId && newSale.status === 'confirmed') {
        // TODO: إضافة دالة لتحديث حالة الوحدة في unitsService
        console.log('سيتم تحديث حالة الوحدة إلى مباعة:', newSale.unitId)
      }
      
      setNewSale({
        clientId: '',
        clientName: '',
        projectId: '',
        projectName: '',
        unitId: '',
        unitNumber: '',
        salePrice: 0,
        downPayment: 0,
        installments: 0,
        commissionRate: 0,
        commissionAmount: 0,
        totalAmount: 0,
        saleDate: '',
        status: 'pending',
        paymentStatus: 'pending',
        notes: ''
      })
      setAvailableUnits([])
      setSelectedUnit(null)
      setShowAddModal(false)
      
      // إعادة تحميل قائمة المبيعات
      refetch()
      
      toast.success('تم إضافة البيع بنجاح وإرسال إشعار للفريق!')
    } catch (error) {
      console.error('خطأ في إضافة البيع:', error)
      toast.error('فشل في إضافة البيع')
    } finally {
      setIsSubmitting(false)
    }
  }

  // إضافة تذكير
  const handleReminder = (reminder) => {
    console.log('تم إضافة تذكير:', reminder)
    toast.success('تم إضافة التذكير بنجاح')
  }

  // إضافة ملاحظة
  const handleAddNote = async (note) => {
    try {
      if (!note?.itemId || !note?.content) {
        toast.error('بيانات الملاحظة غير مكتملة')
        return
      }

      // التأكد من وجود المبيعة
      const sale = sales?.find(s => s.id === note.itemId)
      if (!sale) {
        toast.error('المبيعة غير موجودة')
        return
      }

      // إنشاء الملاحظة باستخدام Notes API
      const noteData = {
        content: note.content,
        itemType: 'sale',
        itemId: note.itemId
      }

      const result = await api.addNote(noteData)
      
      console.log('تم إضافة ملاحظة:', result)
      toast.success('تم إضافة الملاحظة بنجاح')
      
      // إعادة تحميل التفاصيل إذا كانت المبيعة معروضة
      if (viewingSale && note?.itemId === viewingSale.id) {
        setViewingSale({...viewingSale, updatedAt: new Date()})
      }
    } catch (error) {
      console.error('خطأ في حفظ الملاحظة:', error)
      toast.error('حدث خطأ أثناء حفظ الملاحظة')
    }
  }

  // إضافة مهمة
  const handleAddTask = (task) => {
    console.log('تم إضافة مهمة:', task)
    toast.success('تم إضافة المهمة بنجاح')
  }

  // === الإجراءات الجماعية ===
  const [selectedSales, setSelectedSales] = useState([])
  
  const handleBulkDelete = async (saleIds) => {
    try {
      await Promise.all(saleIds.map(id => api.deleteSale(id)))
      toast.success(`تم نقل ${saleIds.length} بيعة للأرشيف بنجاح`)
      setSelectedSales([])
    } catch (error) {
      console.error('خطأ في نقل المبيعات للأرشيف:', error)
      toast.error('فشل في نقل المبيعات للأرشيف')
    }
  }



  const handleBulkExport = (selectedSalesData) => {
    try {
      const csvHeaders = ['العميل', 'المشروع', 'رقم الوحدة', 'السعر', 'المقدم', 'العمولة', 'الحالة', 'حالة الدفع', 'التاريخ', 'الوكيل']
      const csvData = selectedSalesData.map(sale => [
        sale.clientName || '',
        sale.projectName || '',
        sale.unitNumber || '',
        sale.price || sale.salePrice || '',
        sale.downPayment || '',
        sale.commission || sale.commissionAmount || '',
        sale.status || '',
        sale.paymentStatus || '',
        sale.saleDate ? new Date(sale.saleDate.seconds * 1000).toLocaleDateString('ar-EG') : '',
        sale.agentName || sale.createdByName || ''
      ])
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.join(','))
        .join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `sales_export_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      toast.success(`تم تصدير ${selectedSalesData.length} بيعة بنجاح`)
    } catch (error) {
      console.error('خطأ في التصدير:', error)
      toast.error('فشل في تصدير المبيعات')
    }
  }

  // دالة لعرض تفاصيل المبيعة
  const handleViewSale = (sale) => {
    setSelectedSale(sale)
    setShowViewModal(true)
  }

  const handleUpdateSale = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const updateData = {
        ...editingSale,
        saleDate: editingSale.saleDate instanceof Date ? 
          editingSale.saleDate : 
          new Date(editingSale.saleDate),
        updatedAt: new Date()
      }
      await api.updateSale(editingSale.id, updateData)
      setEditingSale(null)
      toast.success('تم تحديث البيع بنجاح!')
    } catch (error) {
      console.error('خطأ في تحديث البيع:', error)
      toast.error('فشل في تحديث البيع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSale = async (saleId) => {
    const sale = sales.find(s => s.id === saleId)
    if (sale) {
      setSaleToDelete(sale)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return
    
    try {
      // حذف البيع (soft delete - سينتقل للأرشيف)
      await api.deleteSale(saleToDelete.id)
      
      // إعادة تحميل قائمة المبيعات
      refetch()
      toast.success('تم نقل البيع للأرشيف بنجاح')
    } catch (error) {
      console.error('خطأ في أرشفة البيع:', error)
      toast.error('حدث خطأ أثناء أرشفة البيع')
    } finally {
      setSaleToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'success'
      case 'cancelled': return 'destructive'
      case 'contract_signed': return 'info'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'معلق'
      case 'confirmed': return 'مؤكد'
      case 'cancelled': return 'ملغي'
      case 'contract_signed': return 'عقد موقع'
      default: return 'غير محدد'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'partial': return 'info'
      case 'completed': return 'success'
      case 'overdue': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'pending': return 'معلق'
      case 'partial': return 'جزئي'
      case 'completed': return 'مكتمل'
      case 'overdue': return 'متأخر'
      default: return 'غير محدد'
    }
  }

  // دالة لترجمة نوع الوحدة
  const getUnitTypeText = (type) => {
    const typeMap = {
      // وحدات سكنية
      'apartment': 'شقة',
      'villa': 'فيلا',
      'duplex': 'دوبلكس',
      'penthouse': 'بنتهاوس',
      'studio': 'استوديو',
      // وحدات تجارية
      'shop': 'محل تجاري',
      'showroom': 'معرض',
      'restaurant': 'مطعم',
      'cafe': 'كافيه',
      'supermarket': 'سوبر ماركت',
      'mall_unit': 'وحدة مول',
      // وحدات إدارية
      'office': 'مكتب',
      'admin_floor': 'طابق إداري',
      'meeting_room': 'قاعة اجتماعات',
      'coworking': 'مساحة عمل مشتركة',
      // وحدات طبية
      'clinic': 'عيادة',
      'pharmacy': 'صيدلية',
      'lab': 'معمل',
      'medical_center': 'مركز طبي',
      'dental_clinic': 'عيادة أسنان',
      'hospital_room': 'غرفة مستشفى',
      // وحدات أخرى
      'warehouse': 'مستودع',
      'garage': 'جراج',
      'storage': 'مخزن'
    }
    return typeMap[type] || type || 'غير محدد'
  }

  // Calculate totals (excluding archived sales)
  const activeSales = sales?.filter(sale => sale.status !== 'archived') || []
  const totalRevenue = activeSales.reduce((sum, sale) => sum + (sale.price || sale.totalAmount || 0), 0)
  const totalCommissions = activeSales.reduce((sum, sale) => sum + (sale.commission || sale.commissionAmount || 0), 0)
  
  console.log('📊 إحصائيات المبيعات:')
  console.log('📈 جميع المبيعات النشطة:', activeSales.length)
  console.log('💰 تفاصيل كل بيعة:', activeSales.map(sale => ({
    id: sale.id,
    price: sale.price,
    totalAmount: sale.totalAmount,
    commission: sale.commission,
    commissionAmount: sale.commissionAmount,
    status: sale.status
  })))
  console.log('📊 إجمالي الإيرادات:', totalRevenue)
  console.log('💼 إجمالي العمولات:', totalCommissions)
  
  // تحقق من البيانات المنطقية
  if (totalRevenue > 1000000000) { // أكثر من مليار
    console.warn('⚠️ تحذير: إجمالي الإيرادات كبير جداً ومشكوك فيه!', totalRevenue)
  }
  if (totalCommissions > 100000000) { // أكثر من 100 مليون  
    console.warn('⚠️ تحذير: إجمالي العمولات كبير جداً ومشكوك فيه!', totalCommissions)
  }
  const confirmedSales = activeSales.filter(sale => sale.status === 'confirmed').length
  const pendingSales = activeSales.filter(sale => sale.status === 'pending').length

  if (loading) {
    return <LoadingPage message="جاري تحميل بيانات المبيعات..." />
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Enhanced Page Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-700 to-teal-800 rounded-2xl shadow-xl mb-6">
        <div className="relative px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">إدارة المبيعات</h1>
                <p className="text-green-100 mt-1">إدارة وتتبع عمليات البيع والعقود والمدفوعات</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span>{new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30 backdrop-blur-sm"
              >
                <Filter className="h-4 w-4 ml-2" />
                تصفية
              </Button>
              {canCreateSale() && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-emerald-600 hover:bg-green-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-green-100 hover:border-green-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-green-100 rounded-lg">
                      <Plus className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-bold">إضافة بيع جديد</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي الإيرادات */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-green-900">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-green-600 mt-1">+12% من الشهر الماضي</p>
                {totalRevenue > 1000000000 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-500 mb-1">⚠️ قد تكون هناك بيانات وهمية</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={async () => {
                        const confirmation = window.confirm('هل تريد حذف المبيعات ذات الأسعار غير المنطقية (أكثر من 100 مليون)؟')
                        if (confirmation) {
                          try {
                            const fakeSales = sales.filter(sale => (sale.price || sale.salePrice || 0) > 100000000)
                            console.log('🗑️ سيتم حذف المبيعات الوهمية:', fakeSales)
                            
                            for (const sale of fakeSales) {
                              await api.deleteSale(sale.id)
                            }
                            
                            toast.success(`تم حذف ${fakeSales.length} بيعة وهمية`)
                            // إعادة تحميل البيانات
                            window.location.reload()
                          } catch (error) {
                            console.error('خطأ في حذف البيانات:', error)
                            toast.error('فشل في حذف البيانات الوهمية')
                          }
                        }
                      }}
                    >
                      🗑️ تنظيف
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* إجمالي العمولات */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">إجمالي العمولات</p>
                <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalCommissions)}</p>
                <p className="text-sm text-blue-600 mt-1">+8% من الشهر الماضي</p>
                {totalCommissions > 100000000 && (
                  <div className="mt-2">
                    <p className="text-xs text-red-500 mb-1">⚠️ قد تكون هناك بيانات وهمية</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      onClick={async () => {
                        const confirmation = window.confirm('هل تريد حذف المبيعات ذات العمولات غير المنطقية (أكثر من 10 مليون)؟')
                        if (confirmation) {
                          try {
                            const fakeSales = sales.filter(sale => (sale.commission || sale.commissionAmount || 0) > 10000000)
                            console.log('🗑️ سيتم حذف المبيعات ذات العمولات الوهمية:', fakeSales)
                            
                            for (const sale of fakeSales) {
                              await api.deleteSale(sale.id)
                            }
                            
                            toast.success(`تم حذف ${fakeSales.length} بيعة ذات عمولة وهمية`)
                            // إعادة تحميل البيانات
                            window.location.reload()
                          } catch (error) {
                            console.error('خطأ في حذف البيانات:', error)
                            toast.error('فشل في حذف البيانات الوهمية')
                          }
                        }
                      }}
                    >
                      🗑️ تنظيف
                    </Button>
                  </div>
                )}
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* مبيعات مؤكدة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">مبيعات مؤكدة</p>
                <p className="text-3xl font-bold text-emerald-900">{confirmedSales}</p>
                <p className="text-sm text-emerald-600 mt-1">+{confirmedSales} هذا الشهر</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* مبيعات معلقة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">مبيعات معلقة</p>
                <p className="text-3xl font-bold text-orange-900">{pendingSales}</p>
                <p className="text-sm text-orange-600 mt-1">{pendingSales} تحتاج متابعة</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters with Integrated Cards */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <div>
                <h3 className="text-lg font-semibold text-emerald-800">المبيعات</h3>
                <p className="text-sm text-emerald-600">
                  {sales?.filter(s => s.status !== 'archived')?.length || 0} بيعة نشطة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* البحث والفلاتر المدمجة */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث سريع..."
                    className="pl-10 pr-10 h-8 w-48 text-xs"
                    value={quickSearchTerm}
                    onChange={(e) => setQuickSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                >
                  <Filter className="h-3 w-3 ml-1" />
                  فلترة
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                  حفظ البحث
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                  تصدير
                </Button>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 text-xs"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">معلق</option>
                  <option value="confirmed">مؤكد</option>
                  <option value="contract_signed">عقد موقع</option>
                  <option value="cancelled">ملغي</option>
                </select>
                
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 text-xs"
                >
                  <option value="all">جميع المدفوعات</option>
                  <option value="pending">معلق</option>
                  <option value="partial">جزئي</option>
                  <option value="completed">مكتمل</option>
                  <option value="overdue">متأخر</option>
                </select>
                
                {/* Page Size Selector - تصميم أنيق */}
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-1">
                  <span className="text-green-700 text-xs font-medium">عرض:</span>
                  <select 
                    value={pageSize} 
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-transparent border-0 text-green-700 text-xs rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                  <span className="text-green-700 text-xs font-medium">مبيعة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Grid Section */}
        {filteredSales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-emerald-50 hover:to-green-50 overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="relative bg-gradient-to-r from-emerald-600 to-green-700 p-4 text-white">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <input 
                        type="checkbox"
                        checked={selectedSales.includes(sale.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSales([...selectedSales, sale.id])
                          } else {
                            setSelectedSales(selectedSales.filter(id => id !== sale.id))
                          }
                        }}
                        className="rounded border-white border-opacity-50 bg-white bg-opacity-20 text-emerald-600 mt-1"
                      />
                      <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-100" />
                      <h3 className="font-bold text-lg text-white truncate">{sale.clientName}</h3>
                    </div>
                    
                    <p className="text-green-100 text-sm mb-3">{sale.projectName}</p>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        className={`${
                          sale.status === 'confirmed' ? 'bg-green-500 text-white' :
                          sale.status === 'pending' ? 'bg-yellow-500 text-white' :
                          sale.status === 'contract_signed' ? 'bg-blue-500 text-white' :
                          sale.status === 'cancelled' ? 'bg-red-500 text-white' :
                          'bg-gray-500 text-white'
                        } border-0 font-medium`}
                      >
                        {getStatusText(sale.status)}
                      </Badge>
                      <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30 font-medium">
                        {getPaymentStatusText(sale.paymentStatus)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4 space-y-4">
                  {/* Unit Number Section */}
                  {sale.unitNumber && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Building2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">رقم الوحدة</p>
                        <p className="font-semibold text-gray-800">{sale.unitNumber}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Financial Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <DollarSign className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-1">السعر</p>
                      <p className="font-semibold text-gray-800 text-sm">{formatCurrency(sale.price || sale.salePrice)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <CreditCard className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-1">المقدم</p>
                      <p className="font-semibold text-gray-800 text-sm">{formatCurrency(sale.downPayment || 0)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <TrendingUp className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-1">العمولة</p>
                      <p className="font-semibold text-gray-800 text-sm">{formatCurrency(sale.commission || sale.commissionAmount)}</p>
                    </div>
                  </div>
                  
                  {/* Payment Progress */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-lg font-bold text-green-700">
                        {sale.downPayment && sale.totalAmount ? Math.round((sale.downPayment / sale.totalAmount) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-green-100 rounded-full h-2 mb-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${sale.downPayment && sale.totalAmount ? Math.round((sale.downPayment / sale.totalAmount) * 100) : 0}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-green-600 text-center">تقدم الدفع</p>
                  </div>

                  {/* Date and Agent */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateArabic(sale.saleDate)}</span>
                    </div>
                    
                    {/* عرض اسم الوكيل للمدير */}
                    {(userProfile?.role === 'admin' || userProfile?.role === 'sales_manager') && (sale.agentName || sale.createdByName) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>بواسطة: {sale.agentName || sale.createdByName}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {canEditSale(sale) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 hover:from-emerald-600 hover:to-green-700 font-medium"
                        onClick={() => setEditingSale(sale)}
                      >
                        <Edit className="h-3 w-3 ml-1" />
                        تعديل
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 font-medium"
                      onClick={() => handleViewSale(sale)}
                    >
                      <Eye className="h-3 w-3 ml-1" />
                      عرض
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 font-medium"
                      onClick={() => {
                        // TODO: إضافة وظيفة طباعة العقد
                        toast.info('سيتم إضافة وظيفة طباعة العقد قريباً')
                      }}
                    >
                      <FileText className="h-3 w-3 ml-1" />
                      طباعة
                    </Button>
                    {canDeleteSale(sale) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 p-6">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مبيعات</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة أول عملية بيع</p>
            {canCreateSale() && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة بيع جديد
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* شريط الإجراءات الجماعية */}
      {selectedSales.length > 0 && (
        <Card className="bizmax-card">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  تم تحديد {selectedSales.length} بيعة
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSales([])}
                  className="text-blue-600 hover:text-blue-800"
                >
                  إلغاء التحديد
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkExport(filteredSales.filter(sale => selectedSales.includes(sale.id)))}
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Download className="h-4 w-4" />
                  تصدير
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkArchive(selectedSales)}
                  className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <ArchiveX className="h-4 w-4" />
                  أرشفة
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkDelete(selectedSales)}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <ArchiveX className="h-4 w-4" />
                  نقل للأرشيف
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}



      {/* Enhanced Add Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إضافة بيع جديد</h3>
                    <p className="text-green-100 text-sm">تسجيل عملية بيع جديدة وإدارة التفاصيل المالية</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-green-100">
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
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[calc(90vh-160px)] overflow-y-auto">
              <form onSubmit={handleAddSale} className="p-6 space-y-6">
                {/* أساسيات البيع */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <User className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">بيانات العميل والوحدة</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        العميل <span className="text-red-500">*</span>
                      </label>
                  <select
                    value={newSale.clientId}
                    onChange={(e) => {
                      const selectedClient = clients?.find(c => c.id === e.target.value)
                      setNewSale({
                        ...newSale, 
                        clientId: e.target.value,
                        clientName: selectedClient?.name || ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={clientsLoading}
                  >
                    <option value="">
                      {clientsLoading ? 'جاري تحميل العملاء...' : 'اختر العميل'}
                    </option>
                    {clients?.filter(c => c.status !== 'archived').map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                    {!clientsLoading && clients?.filter(c => c.status !== 'archived').length === 0 && (
                      <option value="" disabled>لا توجد عملاء متاحون</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
                  <select
                    value={newSale.projectId}
                    onChange={(e) => {
                      const projectId = e.target.value
                      const projectIdNumber = parseInt(projectId) || null
                      const selectedProject = projects?.find(p => p.id == projectId) // == للمقارنة بين string و number
                      setNewSale({
                        ...newSale, 
                        projectId: projectId,
                        projectName: selectedProject?.name || ''
                      })
                      // تحديث الوحدات المتاحة عند تغيير المشروع
                      updateAvailableUnits(projectIdNumber)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    disabled={projectsLoading}
                  >
                    <option value="">
                      {projectsLoading ? 'جاري تحميل المشاريع...' : 'اختر المشروع'}
                    </option>
                    {projects?.filter(p => p.status !== 'archived').map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                    {!projectsLoading && projects?.filter(p => p.status !== 'archived').length === 0 && (
                      <option value="" disabled>لا توجد مشاريع متاحة</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة المتاحة</label>
                <select
                  value={newSale.unitId}
                  onChange={(e) => handleUnitSelection(e.target.value)}
                  className="bizmax-input w-full"
                  required
                  disabled={!newSale.projectId || availableUnits.length === 0}
                >
                  <option value="">
                    {!newSale.projectId 
                      ? 'اختر المشروع أولاً' 
                      : availableUnits.length === 0 
                      ? 'لا توجد وحدات متاحة' 
                      : 'اختر الوحدة'}
                  </option>
                  {availableUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber} - {getUnitTypeText(unit.type)} - {unit.area}م² - {formatCurrency(unit.price)}
                    </option>
                  ))}
                </select>
                
                {/* عرض تفاصيل الوحدة المحددة */}
                {selectedUnit && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">النوع:</span>
                        <span className="font-medium ml-1">{getUnitTypeText(selectedUnit.type)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">المساحة:</span>
                        <span className="font-medium ml-1">{selectedUnit.area}م²</span>
                      </div>
                      <div>
                        <span className="text-gray-600">الغرف:</span>
                        <span className="font-medium ml-1">{selectedUnit.bedrooms}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">الحمامات:</span>
                        <span className="font-medium ml-1">{selectedUnit.bathrooms}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">السعر:</span>
                        <span className="font-bold text-green-600 ml-1">{formatCurrency(selectedUnit.price)}</span>
                      </div>
                      {selectedUnit.floor && (
                        <div>
                          <span className="text-gray-600">الطابق:</span>
                          <span className="font-medium ml-1">{selectedUnit.floor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* رسالة عندما لا توجد وحدات متاحة */}
                {newSale.projectId && availableUnits.length === 0 && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-700">
                        لا توجد وحدات متاحة للبيع في هذا المشروع
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سعر البيع 
                    <span className="text-xs text-gray-500">(يتم جلبه تلقائياً من الوحدة)</span>
                  </label>
                  <Input
                    type="number"
                    value={newSale.salePrice}
                    readOnly
                    className="bg-gray-50 text-gray-700"
                    placeholder="سيتم تحديده عند اختيار الوحدة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المقدم</label>
                  <Input
                    type="number"
                    value={newSale.downPayment}
                    onChange={(e) => setNewSale({...newSale, downPayment: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نسبة العمولة (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newSale.commissionRate}
                    onChange={(e) => {
                      const commissionRate = parseFloat(e.target.value) || 0
                      const commissionAmount = Math.round(newSale.salePrice * (commissionRate / 100))
                      setNewSale({
                        ...newSale, 
                        commissionRate,
                        commissionAmount,
                        totalAmount: newSale.salePrice + commissionAmount
                      })
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ العمولة</label>
                  <Input
                    type="number"
                    value={newSale.commissionAmount}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select
                    value={newSale.status}
                    onChange={(e) => setNewSale({...newSale, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="contract_signed">عقد موقع</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدفع</label>
                  <select
                    value={newSale.paymentStatus}
                    onChange={(e) => setNewSale({...newSale, paymentStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="partial">جزئي</option>
                    <option value="completed">مكتمل</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البيع</label>
                <Input
                  type="date"
                  value={newSale.saleDate}
                  onChange={(e) => setNewSale({...newSale, saleDate: e.target.value})}
                />
              </div>
            </div>

                {/* Enhanced Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                  <div className="text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      تأكد من صحة البيانات قبل الحفظ
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowAddModal(false)}
                      disabled={isSubmitting}
                      className="px-6 py-2"
                    >
                      إلغاء
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !newSale.clientId || !newSale.projectId || !newSale.unitId}
                      className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          إضافة البيع
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sale Modal - Enhanced structure matching add modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">تعديل بيانات البيع</h3>
                    <p className="text-emerald-100 text-sm">تحديث معلومات البيعة #{editingSale.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingSale(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[calc(95vh-160px)] overflow-y-auto">
              <form onSubmit={handleUpdateSale} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
                  <select
                    value={editingSale.clientId || ''}
                    onChange={(e) => {
                      const selectedClient = clients?.find(c => c.id === e.target.value)
                      setEditingSale({
                        ...editingSale, 
                        clientId: e.target.value,
                        clientName: selectedClient?.name || ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">اختر العميل</option>
                    {clients?.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
                  <select
                    value={editingSale.projectId || ''}
                    onChange={(e) => {
                      const selectedProject = projects?.find(p => p.id === e.target.value)
                      setEditingSale({
                        ...editingSale, 
                        projectId: e.target.value,
                        projectName: selectedProject?.name || ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">اختر المشروع</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* المعلومات المالية */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-800 border-b pb-2">المعلومات المالية</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
                    <Input
                      type="number"
                      value={editingSale.price || editingSale.salePrice || ''}
                      onChange={(e) => setEditingSale({...editingSale, price: parseInt(e.target.value) || 0, salePrice: parseInt(e.target.value) || 0})}
                      className="w-full"
                      placeholder="السعر"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المقدم</label>
                    <Input
                      type="number"
                      value={editingSale.downPayment || ''}
                      onChange={(e) => setEditingSale({...editingSale, downPayment: parseInt(e.target.value) || 0})}
                      className="w-full"
                      placeholder="المقدم"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">نسبة العمولة (%)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingSale.commissionRate || ''}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0
                        const commissionAmount = Math.round((editingSale.price || editingSale.salePrice || 0) * (rate / 100))
                        setEditingSale({
                          ...editingSale, 
                          commissionRate: rate,
                          commission: commissionAmount,
                          commissionAmount: commissionAmount
                        })
                      }}
                      className="w-full"
                      placeholder="2.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">العمولة (محسوبة)</label>
                    <Input
                      type="number"
                      value={editingSale.commission || editingSale.commissionAmount || ''}
                      readOnly
                      className="bg-gray-50 text-gray-700"
                      placeholder="سيتم حسابها تلقائياً"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ البيع</label>
                    <Input
                      type="date"
                      value={editingSale.saleDate ? new Date(editingSale.saleDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditingSale({...editingSale, saleDate: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select
                    value={editingSale.status || 'pending'}
                    onChange={(e) => setEditingSale({...editingSale, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="contract_signed">عقد موقع</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدفع</label>
                  <select
                    value={editingSale.paymentStatus || 'pending'}
                    onChange={(e) => setEditingSale({...editingSale, paymentStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="pending">معلق</option>
                    <option value="partial">جزئي</option>
                    <option value="completed">مكتمل</option>
                    <option value="overdue">متأخر</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  value={editingSale.notes || ''}
                  onChange={(e) => setEditingSale({...editingSale, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="أضف أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingSale(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* منطقة الترقيم */}
      {totalPages > 1 && (
        <Card className="bg-white border-0 shadow-md rounded-xl mt-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span>عرض {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)}</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm">
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
                        ? 'bg-green-500 text-white border-green-500 shadow-sm'
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

      {/* View Sale Details Modal */}
      {showViewModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">تفاصيل البيع</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedSale(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">معلومات العميل والمشروع</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">العميل:</span>
                      <span className="text-sm font-medium">{selectedSale.clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">المشروع:</span>
                      <span className="text-sm font-medium">{selectedSale.projectName}</span>
                    </div>
                    {selectedSale.unitNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">رقم الوحدة:</span>
                        <span className="text-sm font-medium">{selectedSale.unitNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">تاريخ البيع:</span>
                      <span className="text-sm font-medium">{formatDateArabic(selectedSale.saleDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">حالة البيع</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">حالة البيع:</span>
                      <Badge variant={getStatusColor(selectedSale.status)}>
                        {getStatusText(selectedSale.status)}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">حالة الدفع:</span>
                      <Badge variant={getPaymentStatusColor(selectedSale.paymentStatus)}>
                        {getPaymentStatusText(selectedSale.paymentStatus)}
                      </Badge>
                    </div>
                    {(userProfile?.role === 'admin' || userProfile?.role === 'sales_manager') && (selectedSale.agentName || selectedSale.createdByName) && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">مندوب المبيعات:</span>
                        <span className="text-sm font-medium">{selectedSale.agentName || selectedSale.createdByName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* المعلومات المالية */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">المعلومات المالية</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-1">سعر البيع</div>
                    <div className="font-semibold text-green-900">{formatCurrency(selectedSale.salePrice)}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-1">المقدم</div>
                    <div className="font-semibold text-blue-900">{formatCurrency(selectedSale.downPayment)}</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-1">العمولة</div>
                    <div className="font-semibold text-purple-900">{formatCurrency(selectedSale.commissionAmount)}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <FileText className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-1">الإجمالي</div>
                    <div className="font-semibold text-yellow-900">{formatCurrency(selectedSale.totalAmount)}</div>
                  </div>
                </div>
              </div>

              {/* شريط التقدم */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">تقدم المدفوعات</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">المبلغ المدفوع</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedSale.downPayment)} من {formatCurrency(selectedSale.totalAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.round((selectedSale.downPayment / selectedSale.totalAmount) * 100), 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">0%</span>
                    <span className="font-medium text-gray-900">
                      {Math.min(Math.round((selectedSale.downPayment / selectedSale.totalAmount) * 100), 100)}%
                    </span>
                    <span className="text-gray-500">100%</span>
                  </div>
                </div>
              </div>

              {/* العمولة والمعدل */}
              {selectedSale.commissionRate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">تفاصيل العمولة</h4>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">نسبة العمولة</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedSale.commissionRate}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">مبلغ العمولة</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(selectedSale.commissionAmount)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* الملاحظات */}
              {selectedSale.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">الملاحظات</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedSale.notes}</p>
                  </div>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-4 border-t">
                {canEditSale(selectedSale) && (
                  <Button 
                    onClick={() => {
                      setShowViewModal(false)
                      setEditingSale(selectedSale)
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 ml-2" />
                    تعديل البيع
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    // TODO: إضافة وظيفة طباعة العقد
                    toast.info('سيتم إضافة وظيفة طباعة العقد قريباً')
                  }}
                  className="px-6"
                >
                  <FileText className="h-4 w-4 ml-2" />
                  طباعة العقد
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedSale(null)
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

      {/* حوار تأكيد الحذف */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setSaleToDelete(null)
        }}
        onConfirm={confirmDeleteSale}
        title="تأكيد نقل البيع للأرشيف"
        message={`هل أنت متأكد من نقل البيع "${saleToDelete?.clientName || saleToDelete?.projectName}" إلى الأرشيف؟ يمكنك استعادته لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />
    </div>
  )
}