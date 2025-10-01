import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Home, 
  MapPin,
  DollarSign,
  Eye,
  MoreHorizontal,
  Building2,
  Bed,
  Bath,
  Square,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle,
  Star,
  Award,
  TrendingUp,
  Target,
  XCircle,
  Timer,
  UserPlus,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'

import { formatCurrency } from '../lib/utils'
import useUnits from '../hooks/useUnits'
import useProjects from '../hooks/useProjects'
import { useSelectOptions } from '../hooks/useSelectOptions'
import { usePermissions } from '../hooks/usePermissions'
// Removed firestore service - using local data only
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

export default function Units() {
  const api = useApi()
  const { sendNewUnitNotification } = useSSENotificationSender()
  const [searchParams] = useSearchParams()
  const { 
    isAdmin, 
    isSalesManager, 
    isSales, 
    checkPermission 
  } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [quickSearchTerm, setQuickSearchTerm] = useState('')
  
  // استقبال معايير الفلترة من URL
  const projectIdFromUrl = searchParams.get('projectId')
  const projectNameFromUrl = searchParams.get('projectName')

  // تطبيق فلترة المشروع تلقائياً عند الوصول من صفحة المشاريع
  useEffect(() => {
    if (projectIdFromUrl && projectNameFromUrl) {
      setSelectedProject(projectIdFromUrl)
      toast.info(`عرض وحدات مشروع: ${decodeURIComponent(projectNameFromUrl)}`)
    }
  }, [projectIdFromUrl, projectNameFromUrl])

  // دوال التحقق من الصلاحيات للوحدات
  const canCreateUnit = () => {
    return isAdmin() || checkPermission('create_units')
  }

  const canEditUnit = () => {
    return isAdmin() || checkPermission('edit_units')
  }

  const canDeleteUnit = () => {
    return isAdmin() || checkPermission('delete_units')
  }
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedProject, setSelectedProject] = useState('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [unitToDelete, setUnitToDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [formData, setFormData] = useState({
    projectId: '',
    projectName: '',
    unitNumber: '',
    type: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    price: '',
    status: 'available',
    floor: '',
    description: '',
    amenities: []
  })

  // جلب البيانات الحقيقية من Firebase
  const { units, loading, error, refetch } = useUnits()
  const { projects, loading: projectsLoading } = useProjects()
  
  // استخدام الـ hook المشترك للقوائم المنسدلة
  const {
    unitTypeOptions,
    unitStatusOptions,
    unitTypeFilterOptions,
    unitStatusFilterOptions
  } = useSelectOptions()

  // تحويل المشاريع إلى خيارات القائمة المنسدلة
  const projectOptions = projects?.filter(p => p.status !== 'archived').map(project => ({
    value: project.id,
    label: project.name,
    icon: '🏗️'
  })) || []

  const filteredUnits = units?.filter(unit => {
    // استبعاد الوحدات المؤرشفة من العرض العادي
    if (unit.status === 'archived') return false
    
    const matchesSearch = searchTerm === '' || 
                         unit.unitNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesQuickSearch = quickSearchTerm === '' ||
                              unit.unitNumber?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                              unit.projectName?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                              unit.type?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                              unit.description?.toLowerCase().includes(quickSearchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || unit.status === selectedStatus
    const matchesType = selectedType === 'all' || unit.type === selectedType
    const matchesProject = selectedProject === 'all' || unit.projectId === selectedProject
    
    return matchesSearch && matchesQuickSearch && matchesStatus && matchesType && matchesProject
  }) || []

  // وظائف تحويل النصوص
  const getStatusText = (status) => {
    const statusMap = {
      available: 'متاح',
      reserved: 'محجوز',
      sold: 'مباع',
      maintenance: 'صيانة'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      available: 'success',
      reserved: 'warning',
      sold: 'default',
      maintenance: 'destructive'
    }
    return colorMap[status] || 'default'
  }

  const getTypeText = (type) => {
    const typeMap = {
      // وحدات سكنية
      apartment: 'شقة',
      villa: 'فيلا',
      studio: 'استوديو',
      duplex: 'دوبلكس',
      penthouse: 'بنتهاوس',
      
      // وحدات تجارية وإدارية
      shop: 'محل تجاري',
      office: 'مكتب',
      clinic: 'عيادة',
      restaurant: 'مطعم',
      cafe: 'كافيه',
      
      // وحدات أخرى
      warehouse: 'مستودع',
      garage: 'جراج',
      
      // احتفاظ بالأنواع القديمة للتوافق مع البيانات الموجودة
      other: 'أخرى'
    }
    return typeMap[type] || type
  }

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      projectId: '',
      projectName: '',
      unitNumber: '',
      type: '',
      area: '',
      bedrooms: '',
      bathrooms: '',
      price: '',
      status: 'available',
      floor: '',
      description: '',
      amenities: []
    })
  }

  // دالة لإضافة أو تحديث وحدة
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // البحث عن المشروع المحدد
      const selectedProject = projects.find(p => p.id === formData.projectId)
      
      const unitData = {
        ...formData,
        name: formData.unitNumber, // Backend expects 'name' field
        projectName: selectedProject?.name || '',
        area: formData.area ? parseInt(formData.area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        floor: formData.floor ? parseInt(formData.floor) : null,
        amenities: formData.amenities || [],
        createdAt: selectedUnit ? selectedUnit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (selectedUnit) {
        // تحديث وحدة موجودة
        await api.updateUnit(selectedUnit.id, unitData)
        toast.success('تم تحديث الوحدة بنجاح!')
      } else {
        // إضافة وحدة جديدة
        const result = await api.addUnit(unitData)
        
        // إرسال إشعار للمديرين عن الوحدة الجديدة
        try {
          const selectedProject = projects.find(p => p.id === parseInt(unitData.projectId))
          await sendNewUnitNotification(
            unitData.unitNumber || 'غير محدد',
            selectedProject?.name || 'مشروع غير محدد',
            unitData.type || 'وحدة'
          )
          console.log('✅ تم إرسال إشعار الوحدة الجديدة')
        } catch (notificationError) {
          console.warn('⚠️ فشل في إرسال إشعار الوحدة:', notificationError)
        }
        
        toast.success('تم إضافة الوحدة بنجاح وإرسال إشعار للفريق!')
      }

      // إعادة تحميل قائمة الوحدات
      refetch()
      
      // إعادة تعيين النموذج
      resetForm()
      setShowAddModal(false)
      setShowEditModal(false)
      setSelectedUnit(null)

    } catch (error) {
      console.error('Error saving unit:', error)
      toast.error(selectedUnit ? 'حدث خطأ أثناء تحديث الوحدة' : 'حدث خطأ أثناء إضافة الوحدة')
    } finally {
      setIsSubmitting(false)
    }
  }

  // دالة لعرض تفاصيل الوحدة
  const handleViewUnit = (unit) => {
    setSelectedUnit(unit)
    setShowViewModal(true)
  }

  // دالة لتعديل الوحدة
  const handleEditUnit = (unit) => {
    setSelectedUnit(unit)
    setFormData({
      projectId: unit.projectId || '',
      projectName: unit.projectName || '',
      unitNumber: unit.unitNumber || '',
      type: unit.type || '',
      area: unit.area || '',
      bedrooms: unit.bedrooms || '',
      bathrooms: unit.bathrooms || '',
      price: unit.price || '',
      status: unit.status || 'available',
      floor: unit.floor || '',
      description: unit.description || '',
      amenities: unit.amenities || []
    })
    setShowEditModal(true)
  }

  // دالة لحذف وحدة (أرشفة)
  const handleDeleteUnit = (unit) => {
    setUnitToDelete(unit)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return

    try {
      // حذف الوحدة (سوف تنتقل للأرشيف تلقائياً)
      await api.deleteUnit(unitToDelete.id)
      
      // إعادة تحميل قائمة الوحدات
      refetch()
      toast.success('تم نقل الوحدة إلى الأرشيف بنجاح')
      setShowDeleteConfirm(false)
      setUnitToDelete(null)
    } catch (error) {
      console.error('Error deleting unit:', error)
      toast.error('حدث خطأ أثناء حذف الوحدة')
    }
  }

  // دالة لتحديث حقول النموذج
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // دالة لإنشاء رقم وحدة تلقائي
  const generateUnitNumber = (projectId) => {
    if (!projectId || !units) return 'U-001'
    
    // الحصول على وحدات المشروع الحالي
    const projectUnits = units.filter(unit => unit.projectId === projectId && unit.status !== 'archived')
    
    // استخراج الأرقام الموجودة من أرقام الوحدات
    const existingNumbers = projectUnits
      .map(unit => {
        const match = unit.unitNumber?.match(/U-(\d+)/)
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => num > 0)
    
    // العثور على أول رقم غير مستخدم
    let nextNumber = 1
    while (existingNumbers.includes(nextNumber)) {
      nextNumber++
    }
    
    // إنشاء رقم الوحدة (مثال: U-001, U-002, ...)
    return `U-${nextNumber.toString().padStart(3, '0')}`
  }

  // معالجة تغيير المشروع
  const handleProjectChange = (projectId) => {
    const selectedProject = projects.find(p => p.id === projectId)
    setFormData(prev => ({
      ...prev,
      projectId,
      projectName: selectedProject?.name || '',
      // إنشاء رقم وحدة تلقائي عند اختيار مشروع (فقط للوحدات الجديدة)
      unitNumber: !selectedUnit ? generateUnitNumber(projectId) : prev.unitNumber
    }))
  }

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-4" />
          <span className="text-gray-600">جاري تحميل الوحدات...</span>
        </div>
      </div>
    )
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-red-600 mb-2">حدث خطأ في تحميل البيانات</div>
          <Button onClick={() => window.location.reload()} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Page Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-700 to-yellow-800 rounded-2xl shadow-xl">
        <div className="relative px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Home className="h-8 w-8 text-white" />
        </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">إدارة الوحدات العقارية</h1>
                <p className="text-orange-100 mt-1">إدارة وتتبع الوحدات العقارية في المشاريع</p>
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
        {canCreateUnit() && (
          <Button 
            onClick={() => setShowAddModal(true)}
                  className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-orange-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-orange-100 rounded-lg">
                      <Home className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="font-bold">إضافة وحدة جديدة</span>
                  </div>
          </Button>
        )}
      </div>
            </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <Home className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Building2 className="h-16 w-16 text-white" />
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي الوحدات */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-orange-600 mb-1">إجمالي الوحدات</p>
                <p className="text-3xl font-bold text-orange-900">{units?.length || 0}</p>
                <p className="text-sm text-orange-600 mt-1">+12% من الشهر الماضي</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Home className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* وحدات متاحة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-green-600 mb-1">وحدات متاحة</p>
                <p className="text-3xl font-bold text-green-900">
                {units?.filter(u => u.status === 'available').length || 0}
              </p>
                <p className="text-sm text-green-600 mt-1">
                  {units?.length > 0 ? `${Math.round((units.filter(u => u.status === 'available').length / units.length) * 100)}%` : '0%'} من الإجمالي
                </p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <Award className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* وحدات محجوزة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-yellow-600 mb-1">وحدات محجوزة</p>
                <p className="text-3xl font-bold text-yellow-900">
                {units?.filter(u => u.status === 'reserved').length || 0}
              </p>
                <p className="text-sm text-yellow-600 mt-1">قيد الانتظار</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Timer className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Clock className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* وحدات مباعة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-blue-600 mb-1">وحدات مباعة</p>
                <p className="text-3xl font-bold text-blue-900">
                {units?.filter(u => u.status === 'sold').length || 0}
              </p>
                <p className="text-sm text-blue-600 mt-1">مبيعات مؤكدة</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <Target className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Units Grid with Integrated Search */}
      <Card className="rounded-xl border border-gray-200 shadow-lg bg-white overflow-hidden">
        {/* Grid Header with Search and Filters */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-orange-600" />
              <div>
                <h3 className="text-lg font-semibold text-orange-800">الوحدات العقارية</h3>
                <p className="text-sm text-orange-600">
                  {units?.length || 0} وحدة عقارية
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
              
              <div className="flex items-start gap-1" style={{ alignItems: 'flex-start' }}>
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
                </div>
                
                <div className="flex items-center gap-1">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
                    className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-200 text-xs"
            >
              <option value="all">جميع الحالات</option>
              <option value="available">متاح</option>
              <option value="reserved">محجوز</option>
              <option value="sold">مباع</option>
              <option value="maintenance">صيانة</option>
            </select>
                  
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
                    className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-orange-400 focus:ring-1 focus:ring-orange-200 text-xs"
            >
              <option value="all">جميع الأنواع</option>
              <option value="apartment">شقة</option>
              <option value="villa">فيلا</option>
              <option value="studio">استوديو</option>
              <option value="duplex">دوبلكس</option>
              <option value="penthouse">بنتهاوس</option>
              <option value="shop">محل تجاري</option>
              <option value="office">مكتب</option>
              <option value="clinic">عيادة</option>
              <option value="restaurant">مطعم</option>
              <option value="cafe">كافيه</option>
              <option value="warehouse">مستودع</option>
              <option value="garage">جراج</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        </div>
            </div>
          </div>
        </div>

        {/* Enhanced Units Grid */}
      {filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredUnits.map((unit) => (
              <Card key={unit.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-orange-50 hover:to-amber-50 overflow-hidden">
                {/* Card Header with Gradient */}
                <div className="relative bg-gradient-to-r from-orange-600 to-amber-700 p-4 text-white">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-5 w-5 text-orange-100" />
                        <h3 className="font-bold text-lg text-white truncate">{unit.projectName}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${
                            unit.status === 'available' ? 'bg-green-500 text-white' :
                            unit.status === 'reserved' ? 'bg-yellow-500 text-white' :
                            unit.status === 'sold' ? 'bg-blue-500 text-white' :
                            'bg-gray-500 text-white'
                          } border-0 font-medium`}
                        >
                        {getStatusText(unit.status)}
                      </Badge>
                        <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30 font-medium">
                        {getTypeText(unit.type)}
                      </Badge>
                    </div>
                  </div>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                </div>
                
                <CardContent className="p-4 space-y-4">
                  {/* Unit Number */}
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Building2 className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">رقم الوحدة</p>
                      <p className="font-semibold text-gray-800">{unit.unitNumber}</p>
                    </div>
                </div>

                  {/* Specifications Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Square className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-1">المساحة</p>
                      <p className="font-semibold text-gray-800 text-sm">{unit.area}م²</p>
                  </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Bed className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-1">غرف النوم</p>
                      <p className="font-semibold text-gray-800 text-sm">{unit.bedrooms}</p>
                  </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Bath className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-1">الحمامات</p>
                      <p className="font-semibold text-gray-800 text-sm">{unit.bathrooms}</p>
                  </div>
                </div>

                  {/* Price Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-100">
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-xl font-bold text-green-700">{formatCurrency(unit.price)}</span>
                </div>
                    <p className="text-xs text-green-600 text-center mt-1">السعر الإجمالي</p>
                  </div>

                  {/* Amenities */}
                {unit.amenities && unit.amenities.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">المرافق والخدمات</p>
                  <div className="flex flex-wrap gap-1">
                        {unit.amenities.slice(0, 3).map((amenity, index) => (
                          <span key={index} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                        {amenity}
                      </span>
                    ))}
                        {unit.amenities.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            +{unit.amenities.length - 3} أخرى
                          </span>
                        )}
                      </div>
                  </div>
                )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {canEditUnit() && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 hover:from-orange-600 hover:to-amber-700 font-medium"
                      onClick={() => handleEditUnit(unit)}
                    >
                      <Edit className="h-3 w-3 ml-1" />
                      تعديل
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 font-medium"
                    onClick={() => handleViewUnit(unit)}
                  >
                      <Eye className="h-3 w-3 ml-1" />
                      عرض
                  </Button>
                  {canDeleteUnit() && (
                    <Button 
                      variant="outline" 
                      size="sm"
                        className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 font-medium"
                      onClick={() => handleDeleteUnit(unit)}
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
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد وحدات</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة أول وحدة عقارية</p>
            {canCreateUnit() && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة وحدة جديدة
              </Button>
            )}
          </div>
      )}
      </Card>

      {/* Add/Edit Unit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-700 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Home className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {showEditModal ? 'تعديل بيانات الوحدة' : 'إضافة وحدة عقارية جديدة'}
                </h3>
                    <p className="text-orange-100 text-sm">املأ بيانات الوحدة العقارية</p>
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
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setSelectedUnit(null)
                    resetForm()
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Unit Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المشروع *
                  </label>
                  <select 
                    value={formData.projectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                    >
                      <option value="">اختر المشروع</option>
                      {projectOptions.map(project => (
                        <option key={project.value} value={project.value}>
                          {project.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الوحدة *
                    </label>
                    <Input
                      type="text"
                      value={formData.unitNumber}
                      onChange={(e) => handleFormChange('unitNumber', e.target.value)}
                      placeholder="مثل: U-001"
                      required
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع الوحدة *
                  </label>
                  <select 
                    value={formData.type}
                      onChange={(e) => handleFormChange('type', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                      <option value="">اختر نوع الوحدة</option>
                    <option value="apartment">شقة</option>
                    <option value="villa">فيلا</option>
                    <option value="studio">استوديو</option>
                    <option value="duplex">دوبلكس</option>
                    <option value="penthouse">بنتهاوس</option>
                    <option value="shop">محل تجاري</option>
                    <option value="office">مكتب</option>
                    <option value="clinic">عيادة</option>
                    <option value="restaurant">مطعم</option>
                    <option value="cafe">كافيه</option>
                    <option value="warehouse">مستودع</option>
                    <option value="garage">جراج</option>
                    <option value="other">أخرى</option>
                  </select>
              </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المساحة (م²) *
                  </label>
                    <Input 
                      type="number"
                      value={formData.area}
                      onChange={(e) => handleFormChange('area', e.target.value)}
                      placeholder="مثل: 120"
                      required 
                      min="1"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عدد الغرف
                  </label>
                  <Input 
                    type="number" 
                      value={formData.bedrooms}
                      onChange={(e) => handleFormChange('bedrooms', e.target.value)}
                      placeholder="مثل: 3"
                      min="0"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
              </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عدد الحمامات
                  </label>
                  <Input 
                    type="number" 
                      value={formData.bathrooms}
                      onChange={(e) => handleFormChange('bathrooms', e.target.value)}
                      placeholder="مثل: 2"
                      min="0"
                      className="focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      السعر *
                  </label>
                  <Input 
                    type="number" 
                      value={formData.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      placeholder="السعر بالجنيه المصري"
                    required
                      min="0"
                      step="0.01"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
              </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      حالة الوحدة *
                  </label>
                  <select 
                    value={formData.status}
                      onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="available">متاح</option>
                    <option value="reserved">محجوز</option>
                    <option value="sold">مباع</option>
                    <option value="maintenance">صيانة</option>
                  </select>
                </div>
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الطابق
                  </label>
                  <Input 
                    type="number" 
                      value={formData.floor}
                      onChange={(e) => handleFormChange('floor', e.target.value)}
                      placeholder="مثل: 3"
                      min="0"
                      className="focus:ring-orange-500 focus:border-orange-500"
                    />
              </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                    وصف الوحدة
                  </label>
                  <textarea
                    value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="وصف مختصر للوحدة والمزايا الخاصة بها"
                    rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setSelectedUnit(null)
                      resetForm()
                    }}
                    className="px-6 py-2"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit" 
                    className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  disabled={isSubmitting || projectsLoading}
                >
                  {isSubmitting ? 'جاري الحفظ...' : selectedUnit ? 'تحديث الوحدة' : 'إضافة الوحدة'}
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* View Unit Details Modal */}
      {showViewModal && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">تفاصيل الوحدة العقارية</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedUnit(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Unit Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-500">المشروع</label>
                    <p className="text-lg font-semibold">{selectedUnit.projectName}</p>
                    </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">رقم الوحدة</label>
                    <p className="text-lg font-semibold">{selectedUnit.unitNumber}</p>
                      </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">نوع الوحدة</label>
                    <p className="text-lg font-semibold">{getTypeText(selectedUnit.type)}</p>
                </div>
                
                <div>
                    <label className="text-sm font-medium text-gray-500">المساحة</label>
                    <p className="text-lg font-semibold">{selectedUnit.area} متر مربع</p>
                    </div>
                    </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">الحالة</label>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(selectedUnit.status)}>
                        {getStatusText(selectedUnit.status)}
                      </Badge>
                    </div>
                      </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">عدد الغرف</label>
                    <p className="text-lg font-semibold">{selectedUnit.bedrooms || 'غير محدد'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">عدد الحمامات</label>
                    <p className="text-lg font-semibold">{selectedUnit.bathrooms || 'غير محدد'}</p>
              </div>

              <div>
                    <label className="text-sm font-medium text-gray-500">السعر</label>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(selectedUnit.price)}</p>
                  </div>
                </div>
              </div>

              {selectedUnit.description && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-500">الوصف</label>
                  <p className="mt-2 text-gray-700">{selectedUnit.description}</p>
                </div>
              )}

              {selectedUnit.amenities && selectedUnit.amenities.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-500">المرافق والخدمات</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUnit.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedUnit(null)
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setUnitToDelete(null)
        }}
        onConfirm={confirmDeleteUnit}
        title="تأكيد نقل الوحدة للأرشيف"
        message={`هل أنت متأكد من نقل الوحدة "${unitToDelete?.unitNumber || ''}" من مشروع "${unitToDelete?.projectName || ''}" إلى الأرشيف؟ يمكنك استعادتها لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />
    </div>
  )
}
