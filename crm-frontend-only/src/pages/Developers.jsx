import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Eye,
  MoreHorizontal,
  Building2,
  Star,
  Loader2,
  Calendar,
  Filter,
  Clock,
  Users,
  TrendingUp,
  Award,
  Code,
  Briefcase
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import useDevelopers from '../hooks/useDevelopers'
import { usePermissions } from '../hooks/usePermissions'
// Removed firestore service - using local data only
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { LoadingPage, CardLoadingSkeleton } from '../components/ui/loading'
import toast from 'react-hot-toast'

export default function Developers() {
  const api = useApi()
  const { 
    isAdmin, 
    isSalesManager, 
    isSales, 
    checkPermission 
  } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [quickSearchTerm, setQuickSearchTerm] = useState('')

  // دوال التحقق من الصلاحيات للمطورين
  const canCreateDeveloper = () => {
    return isAdmin() || checkPermission('create_developers')
  }

  const canEditDeveloper = () => {
    return isAdmin() || checkPermission('edit_developers')
  }

  const canDeleteDeveloper = () => {
    return isAdmin() || checkPermission('delete_developers')
  }
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: '',
    description: '',
    license: '',
    established: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [developerToDelete, setDeveloperToDelete] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDeveloper, setSelectedDeveloper] = useState(null)

  // استخدام hook للحصول على البيانات الحقيقية من Firebase
  const { developers, loading, error, refetch, deleteDeveloper } = useDevelopers()

  // تشخيص البيانات - للتحقق من المشكلة
  console.log('🏢 Developers Page Debug:', { 
    developers: !!developers, 
    developersLength: developers?.length, 
    loading, 
    error,
    actualDevelopers: developers 
  })

  const filteredDevelopers = (developers || []).filter(dev => {
    const matchesSearch = searchTerm === '' || (
      dev.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const matchesQuickSearch = quickSearchTerm === '' || (
      dev.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      dev.address?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      dev.contactPerson?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      dev.email?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      dev.phone?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
      dev.description?.toLowerCase().includes(quickSearchTerm.toLowerCase())
    )
    
    return matchesSearch && matchesQuickSearch
  })

  // دالة لإضافة مطور جديد
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Frontend validation
    if (!formData.name || !formData.phone) {
      toast.error('الاسم والهاتف مطلوبان')
      setIsSubmitting(false)
      return
    }

    // إذا لم يتم إدخال إيميل، سنضع واحد افتراضي
    if (!formData.email || formData.email.trim() === '') {
      // لا نفعل شيء - سيتم تعيين قيمة افتراضية في API call
    }

    // Email validation (only if provided)
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('يرجى إدخال إيميل صحيح')
        setIsSubmitting(false)
        return
      }
    }

    try {
      const result = await api.addDeveloper({
        name: formData.name,
        email: formData.email || 'no-email@example.com', // إجباري في Backend
        phone: formData.phone,
        location: formData.address, // تصحيح mapping
        specialization: formData.contactPerson || '', // استخدام contactPerson كـ specialization
        established: formData.established || new Date().getFullYear(),
        description: formData.description,
        website: '', // قيمة افتراضية
        license_number: formData.license || '' // تصحيح mapping
      })

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        status: '',
        description: '',
        license: '',
        established: ''
      })
      
      // إعادة تحميل قائمة المطورين
      refetch()
      
      setShowAddModal(false)
      toast.success('تم إضافة المطور بنجاح!')
    } catch (error) {
      console.error('خطأ في إضافة المطور:', error)
      toast.error('فشل في إضافة المطور')
    } finally {
      setIsSubmitting(false)
    }
  }

  // دالة لحذف مطور
  const handleDelete = (developerId, developerName) => {
    setDeveloperToDelete({ id: developerId, name: developerName })
    setShowDeleteConfirm(true)
  }

  // دالة لعرض تفاصيل المطور
  const handleView = (developer) => {
    setSelectedDeveloper(developer)
    setShowViewModal(true)
  }

  // دالة لتعديل المطور
  const handleEdit = (developer) => {
    setSelectedDeveloper(developer)
    setFormData({
      name: developer.name || '',
      contactPerson: developer.specialization || '',
      email: developer.email || '',
      phone: developer.phone || '',
      address: developer.location || '',
      status: developer.status || '',
      description: developer.description || '',
      license: developer.license || '',
      established: developer.established || ''
    })
    setShowEditModal(true)
  }

  // دالة لحفظ التعديلات
  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await api.updateDeveloper(selectedDeveloper.id, {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        status: formData.status,
        description: formData.description,
        license: formData.license,
        established: formData.established
      })

      setShowEditModal(false)
      setSelectedDeveloper(null)
      // إعادة تعيين النموذج
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        status: '',
        description: '',
        license: '',
        established: ''
      })
      toast.success('تم تحديث المطور بنجاح!')
    } catch (error) {
      console.error('خطأ في تحديث المطور:', error)
      toast.error('فشل في تحديث المطور')
    } finally {
      setIsSubmitting(false)
    }
  }

  // تأكيد أرشفة المطور
  const confirmDelete = async () => {
    if (!developerToDelete) return
    
    try {
      // استخدام deleteDeveloper من الـ hook الذي يقوم بالحذف والتحديث معاً
      await deleteDeveloper(developerToDelete.id)
      toast.success(`تم حذف المطور "${developerToDelete.name}" بنجاح`)
      console.log('✅ Developer deleted and list refreshed')
    } catch (error) {
      console.error('خطأ في حذف المطور:', error)
      toast.error('فشل في حذف المطور')
    } finally {
      setDeveloperToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  // دالة لتحديث حقول النموذج
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // عرض حالة التحميل
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">جاري تحميل المطورين...</span>
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
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-2xl shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <Code className="h-8 w-8 text-white" />
              </div>
        <div>
                <h1 className="text-3xl font-bold text-white">إدارة المطورين</h1>
                <p className="text-purple-100 mt-1">إدارة قاعدة بيانات شركات التطوير العقاري والتكنولوجيا</p>
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
            <div className="flex items-center gap-3">
              <Button 
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-30 backdrop-blur-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                تصفية
              </Button>
        {canCreateDeveloper() && (
          <Button 
            onClick={() => setShowAddModal(true)}
                  className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-purple-100 rounded-lg">
                      <Code className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="font-bold">إضافة مطور جديد</span>
                  </div>
          </Button>
        )}
      </div>
            </div>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي المطورين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-purple-600 mb-1">إجمالي المطورين</p>
                <p className="text-3xl font-bold text-purple-900">{(developers || []).length}</p>
                <p className="text-sm text-purple-600 mt-1">+8% من الشهر الماضي</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* المشاريع النشطة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-green-600 mb-1">المشاريع النشطة</p>
                <p className="text-3xl font-bold text-green-900">
                  {(developers || []).reduce((sum, dev) => sum + (dev.projectsCount || 0), 0)}
                </p>
                <p className="text-sm text-green-600 mt-1">+12% من الشهر الماضي</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* متوسط التقييم */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-orange-600 mb-1">متوسط التقييم</p>
                <p className="text-3xl font-bold text-orange-900">
                  {(developers || []).length > 0 ? ((developers || []).reduce((sum, dev) => sum + (dev.rating || 0), 0) / (developers || []).length).toFixed(1) : '0.0'}
                </p>
                <p className="text-sm text-orange-600 mt-1">من 5 نجوم</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Award className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* المدن */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-blue-600 mb-1">المدن المغطاة</p>
                <p className="text-3xl font-bold text-blue-900">
                  {new Set((developers || []).map(dev => dev.address?.split(',')[0]?.trim())).size}
                </p>
                <p className="text-sm text-blue-600 mt-1">عبر مصر</p>
            </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-8 w-8 text-white" />
          </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <Briefcase className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Developers Table */}
      <Card className="rounded-xl border border-gray-200 shadow-lg bg-white overflow-hidden">
        {/* Table Header with Integrated Search */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Code className="h-6 w-6 text-purple-600" />
              <div>
                <h3 className="text-lg font-semibold text-purple-900">قائمة المطورين</h3>
                <p className="text-sm text-purple-600">{(developers || []).length} مطور مسجل</p>
              </div>
            </div>
            {/* البحث والفلاتر المدمجة */}
            <div className="flex items-center gap-3">
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
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <CardLoadingSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ في التحميل</h3>
            <p className="text-gray-600 mb-4">{error.message || 'فشل في تحميل بيانات المطورين'}</p>
            <Button onClick={() => window.location.reload()} className="bg-purple-600 hover:bg-purple-700 text-white">
              إعادة المحاولة
            </Button>
          </div>
        ) : filteredDevelopers.length === 0 ? (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'لا توجد نتائج' : 'لا توجد شركات تطوير'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'لم يتم العثور على شركات تطوير تطابق بحثك'
              : 'ابدأ بإضافة شركات التطوير العقاري لإدارة مشاريعك'
            }
          </p>
          {!searchTerm && canCreateDeveloper() && (
              <Button onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول مطور
            </Button>
          )}
        </div>
      ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <tr>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <div className="flex items-center justify-center">
                      <input type="checkbox" className="rounded border-purple-300" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-purple-600" />
                      <span>اسم المطور</span>
                      </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span>المسؤول</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>الهاتف</span>
                  </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>الموقع</span>
                </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span>المشاريع</span>
              </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span>التقييم</span>
                </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    <div className="flex items-center gap-2">
                      <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      <span>الإجراءات</span>
                </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDevelopers.map((developer) => (
                  <tr 
                    key={developer.id} 
                    className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-25 hover:to-indigo-25 transition-all duration-200 cursor-pointer"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, rgb(250 245 255), rgb(239 246 255))'; // purple-50 to blue-50
                      e.currentTarget.style.borderLeftColor = 'rgb(147 51 234)'; // purple-600
                      e.currentTarget.style.borderLeftWidth = '4px';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.borderLeftColor = 'transparent';
                      e.currentTarget.style.borderLeftWidth = '0px';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center justify-center w-12">
                        <input type="checkbox" className="rounded border-gray-300" />
                </div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Building className="h-5 w-5 text-white" />
                  </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{developer.name}</div>
                          <div className="text-xs text-gray-500">{developer.description?.substring(0, 30)}...</div>
                  </div>
                  </div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="text-sm text-gray-900">{developer.specialization || 'غير محدد'}</div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="text-sm text-gray-900">{developer.phone || 'غير محدد'}</div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="text-sm text-gray-900">{developer.location?.split(',')[0] || 'غير محدد'}</div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        {developer.projectsCount || 0} مشروع
                      </Badge>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{developer.rating || 0}</span>
              </div>
                    </td>
                    <td className="py-3 px-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg shadow-sm">
                          {developer.phone && (
                            <>
                              {/* WhatsApp Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`https://wa.me/${developer.phone?.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`مرحباً، نود التواصل معكم بخصوص المشاريع المتاحة.`)}`)}
                                className="text-green-600 hover:text-white hover:bg-green-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
                                title="تواصل عبر WhatsApp"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              
                              {/* Call Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`tel:${developer.phone?.replace(/[^\d]/g, '')}`)}
                                className="text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
                                title="اتصال هاتفي"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(developer)}
                            className="text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canEditDeveloper() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(developer)}
                              className="text-purple-600 hover:text-white hover:bg-purple-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
                              title="تعديل"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canDeleteDeveloper() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(developer.id, developer.name)}
                              className="text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Table Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>إجمالي المطورين: {(developers || []).length}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>نشط: {(developers || []).filter(d => d.status === 'نشط').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span>غير نشط: {(developers || []).filter(d => d.status === 'غير نشط').length}</span>
                  </div>
                </div>
                <div>عرض {filteredDevelopers.length} مطور</div>
              </div>
            </div>
        </div>
      )}
      </Card>

      {/* Add Developer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Code className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إضافة مطور جديد</h3>
                    <p className="text-purple-100 text-sm">املأ بيانات شركة التطوير</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-purple-100">
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* الصف الأول */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    اسم الشركة <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الشركة" 
                    required 
                    className="h-9" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الشخص المسؤول <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الشخص المسؤول" 
                    required 
                    className="h-9" 
                  />
                </div>
              </div>

              {/* الصف الثاني */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    البريد الإلكتروني
                  </label>
                  <Input 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email" 
                    placeholder="example@company.com (اختياري)" 
                    className="h-9" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <img src="https://flagcdn.com/w20/eg.png" alt="مصر" className="w-4 h-2.5" />
                      <span className="text-xs text-gray-600">+20</span>
                    </div>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="مثال: 01234567890"
                      className="pr-16 h-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* الصف الثالث */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    العنوان <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوان الشركة" 
                    required 
                    className="h-9" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الحالة <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                    required
                  >
                    <option value="">حدد الحالة</option>
                    <option value="نشط">نشط</option>
                    <option value="غير نشط">غير نشط</option>
                  </select>
                </div>
              </div>

              {/* الوصف */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  الوصف
                </label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" 
                  placeholder="وصف مختصر عن الشركة"
                  rows={3}
                />
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
                <Button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة الشركة'}
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Developer Modal */}
      {showEditModal && selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">تعديل شركة التطوير</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedDeveloper(null)
                    setFormData({
                      name: '',
                      contactPerson: '',
                      email: '',
                      phone: '',
                      address: '',
                      status: '',
                      description: '',
                      license: '',
                      established: ''
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {/* نفس حقول النموذج كما في modal الإضافة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    اسم الشركة <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الشركة" 
                    required 
                    className="h-9" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الشخص المسؤول <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الشخص المسؤول" 
                    required 
                    className="h-9" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    البريد الإلكتروني
                  </label>
                  <Input 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    type="email" 
                    placeholder="example@company.com (اختياري)" 
                    className="h-9" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="مثال: 01234567890"
                    className="h-9"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    العنوان <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="أدخل عنوان الشركة" 
                    required 
                    className="h-9" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الحالة <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                    required
                  >
                    <option value="">حدد الحالة</option>
                    <option value="نشط">نشط</option>
                    <option value="غير نشط">غير نشط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  الوصف
                </label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" 
                  placeholder="وصف مختصر عن الشركة"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedDeveloper(null)
                    setFormData({
                      name: '',
                      contactPerson: '',
                      email: '',
                      phone: '',
                      address: '',
                      status: '',
                      description: '',
                      license: '',
                      established: ''
                    })
                  }}
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
      )}

      {/* View Developer Modal */}
      {showViewModal && selectedDeveloper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">تفاصيل شركة التطوير</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedDeveloper(null)
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">المعلومات الأساسية</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">اسم الشركة:</span>
                      <p className="font-medium">{selectedDeveloper.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">الشخص المسؤول:</span>
                      <p className="font-medium">{selectedDeveloper.contactPerson || 'غير محدد'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">الحالة:</span>
                      <Badge variant={selectedDeveloper.status === 'نشط' ? 'default' : 'secondary'}>
                        {selectedDeveloper.status || 'غير محدد'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">معلومات الاتصال</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedDeveloper.phone || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedDeveloper.email || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedDeveloper.address || 'غير محدد'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* إحصائيات */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">الإحصائيات</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">عدد المشاريع</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900">{selectedDeveloper.projectsCount || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-600">التقييم</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-900">{selectedDeveloper.rating || 0}</p>
                  </div>
                </div>
              </div>

              {/* الوصف */}
              {selectedDeveloper.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">الوصف</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedDeveloper.description}
                  </p>
                </div>
              )}

              {/* معلومات إضافية */}
              {(selectedDeveloper.license || selectedDeveloper.established) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">معلومات إضافية</h4>
                  <div className="space-y-2">
                    {selectedDeveloper.license && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">رقم الترخيص:</span>
                        <span className="text-sm font-medium">{selectedDeveloper.license}</span>
                      </div>
                    )}
                    {selectedDeveloper.established && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">سنة التأسيس:</span>
                        <span className="text-sm font-medium">{selectedDeveloper.established}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* حوار تأكيد أرشفة المطور */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeveloperToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="تأكيد نقل المطور للأرشيف"
        message={`هل أنت متأكد من نقل المطور "${developerToDelete?.name}" للأرشيف؟ يمكنك استعادته لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />
    </div>
  )
}
