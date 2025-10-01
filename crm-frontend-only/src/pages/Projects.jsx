import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MapPin, 
  Calendar,
  DollarSign,
  Building2,
  Eye,
  MoreHorizontal,
  Home,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  UserPlus,
  Sparkles,
  Award,
  Target,
  Timer,
  XCircle,
  FileText
} from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useProjects } from '../hooks/useProjects'
import { useDevelopers } from '../hooks/useDevelopers'
import { usePermissions } from '../hooks/usePermissions'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
// Removed firestore service - using local data only
import { useSSENotificationSender } from '../hooks/useSSENotificationSender'
import { formatCurrency, formatDateArabic } from '../lib/utils'
import LoadingPage from '../components/ui/loading'
import ProjectsTable from '../components/tables/ProjectsTable'
import ViewDetailsModal from '../components/modals/ViewDetailsModal'
import toast from 'react-hot-toast'

export default function Projects() {
  const api = useApi()
  const { currentUser } = useAuth()
  const { sendNewProjectNotification } = useSSENotificationSender()
  const { projects, loading, refetch } = useProjects()
  const { developers, loading: developersLoading } = useDevelopers()
  const { 
    isAdmin, 
    isSalesManager, 
    isSales, 
    checkPermission 
  } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [quickSearchTerm, setQuickSearchTerm] = useState('')

  // دوال التحقق من الصلاحيات للمشاريع
  const canCreateProject = () => {
    return isAdmin() || checkPermission('create_projects')
  }

  const canEditProject = (project) => {
    if (!project) return false
    return isAdmin() || checkPermission('edit_projects')
  }

  const canDeleteProject = (project) => {
    if (!project) return false
    return isAdmin() || checkPermission('delete_projects')
  }

  const canViewProject = () => {
    return isAdmin() || checkPermission('view_projects')
  }
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [viewingProject, setViewingProject] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    status: 'planning',
    developer: '',
    amenities: [],
    totalUnits: '',
    availableUnits: '',
    priceRange: '',
    completion: ''
  })

  // Active projects (non-archived)
  const activeProjects = projects?.filter(p => p.status !== 'archived' && p.status !== 'مؤرشف') || []
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null)
    }
    
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])
  
  // Filter projects
  const filteredProjects = projects?.filter(project => {
    // استبعاد المشاريع المؤرشفة من العرض العادي
    if (project.status === 'archived' || project.status === 'مؤرشف') return false
    
    const matchesSearch = searchTerm === '' || 
                         project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.developer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesQuickSearch = quickSearchTerm === '' ||
                              project.name?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                              project.location?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                              project.developer?.toLowerCase().includes(quickSearchTerm.toLowerCase()) ||
                              project.description?.toLowerCase().includes(quickSearchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus
    const matchesType = selectedType === 'all' || true // Type filtering disabled
    return matchesSearch && matchesQuickSearch && matchesStatus && matchesType
  }) || []

  const handleAddProject = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // البحث عن بيانات المطور المحدد
      const selectedDeveloper = developers?.find(dev => dev.name === newProject.developer)
      
      // تنظيف البيانات - إزالة القيم الفارغة للحقول الاختيارية
      const projectData = {
        name: newProject.name,
        description: newProject.description || '',
        location: newProject.location,
        developer: newProject.developer,
        status: newProject.status,
        amenities: newProject.amenities || []
      }

      // إضافة الحقول الاختيارية فقط إذا كان لها قيمة
      if (newProject.totalUnits && parseInt(newProject.totalUnits) > 0) {
        projectData.totalUnits = parseInt(newProject.totalUnits)
      }
      if (newProject.availableUnits && parseInt(newProject.availableUnits) >= 0) {
        projectData.availableUnits = parseInt(newProject.availableUnits)
      }
      if (newProject.priceRange && newProject.priceRange.trim()) {
        projectData.priceRange = newProject.priceRange.trim()
      }
      if (newProject.completion && parseInt(newProject.completion) >= 0) {
        projectData.completion = parseInt(newProject.completion)
      }

      const result = await api.addProject(projectData)
      setNewProject({
        name: '',
        description: '',
        location: '',
        status: 'planning',
        developer: '',
        amenities: [],
        totalUnits: '',
        availableUnits: '',
        priceRange: '',
        completion: ''
      })
      setShowAddModal(false)
      
      // إرسال إشعار للمديرين عن المشروع الجديد
      try {
        await sendNewProjectNotification(newProject.name, 'مشروع جديد')
        console.log('✅ تم إرسال إشعار المشروع الجديد')
      } catch (notificationError) {
        console.warn('⚠️ فشل في إرسال إشعار المشروع:', notificationError)
      }
      
      // إعادة تحميل قائمة المشاريع
      refetch()
      
      toast.success('تم إضافة المشروع بنجاح وإرسال إشعار للفريق!')
    } catch (error) {
      console.error('خطأ في إضافة المشروع:', error)
      toast.error('فشل في إضافة المشروع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProject = (project) => {
    // تحويل البيانات القديمة للصيغة الجديدة
    const editProject = {
      ...project,
      deliveryTime: '', // سيتم استخراجه من deliveryInfo إذا كان موجود
      deliveryUnit: 'months' // افتراضي
    }
    
    // محاولة استخراج معلومات الاستلام من النص المحفوظ
    if (project.deliveryInfo && project.deliveryInfo !== 'استلام فوري') {
      const match = project.deliveryInfo.match(/(\d+)\s*(شهر|سنة)/);
      if (match) {
        editProject.deliveryTime = match[1];
        editProject.deliveryUnit = match[2] === 'شهر' ? 'months' : 'years';
      }
    }
    
    setEditingProject(editProject)
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // البحث عن بيانات المطور المحدد
      const selectedDeveloper = developers?.find(dev => dev.name === editingProject.developer)
      
      const updateData = {
        ...editingProject,
        deliveryInfo: editingProject.deliveryTime 
          ? `${editingProject.deliveryTime} ${editingProject.deliveryUnit === 'months' ? 'شهر' : 'سنة'}` 
          : 'استلام فوري', // تحويل إلى نص واضح
        developerId: selectedDeveloper?.id || null, // حفظ معرف المطور
        developerInfo: selectedDeveloper ? {
          id: selectedDeveloper.id,
          name: selectedDeveloper.name,
          contactPerson: selectedDeveloper.contactPerson,
          phone: selectedDeveloper.phone,
          email: selectedDeveloper.email
        } : null, // حفظ معلومات المطور للسرعة
        updatedAt: new Date()
      }
      await api.updateProject(editingProject.id, updateData)
      setEditingProject(null)
      
      // إعادة تحميل قائمة المشاريع
      refetch()
      toast.success('تم تحديث المشروع بنجاح!')
    } catch (error) {
      console.error('خطأ في تحديث المشروع:', error)
      toast.error('فشل في تحديث المشروع')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async (project) => {
    setProjectToDelete(project)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    
    try {
      // تحديث حالة المشروع للأرشفة بدلاً من الحذف النهائي
      await api.updateProject(projectToDelete.id, { 
        status: 'مؤرشف',
        archivedAt: new Date(),
        archivedBy: currentUser?.uid || 'unknown'
      })
      
      // إعادة تحميل قائمة المشاريع
      refetch()
      toast.success('تم نقل المشروع للأرشيف بنجاح')
    } catch (error) {
      console.error('خطأ في أرشفة المشروع:', error)
      toast.error('حدث خطأ أثناء أرشفة المشروع')
    } finally {
      setProjectToDelete(null)
      setShowDeleteConfirm(false)
    }
  }

  // إضافة تذكير
  const handleReminder = (reminder) => {
    console.log('تم إضافة تذكير:', reminder)
    // إعادة تحميل البيانات إذا كان المشروع معروضاً في التفاصيل
    if (viewingProject && reminder?.itemId === viewingProject.id) {
      setViewingProject({...viewingProject, updatedAt: new Date()})
    }
  }

  // عرض تفاصيل المشروع
  const handleViewProject = (project) => {
    setViewingProject(project)
  }

  // عرض الوحدات
  const handleViewUnits = (project) => {
    console.log('عرض وحدات المشروع:', project)
    toast.success(`عرض وحدات ${project.name}`)
  }

  // عرض المبيعات
  const handleViewSales = (project) => {
    console.log('عرض مبيعات المشروع:', project)
    toast.success(`عرض مبيعات ${project.name}`)
  }

  // إنشاء تقرير
  const handleGenerateReport = (project) => {
    console.log('إنشاء تقرير المشروع:', project)
    toast.success(`جاري إنشاء تقرير ${project.name}`)
  }

  // إضافة ملاحظة
  const handleAddNote = (note) => {
    console.log('تم إضافة ملاحظة:', note)
    // إعادة تحميل البيانات إذا كان المشروع معروضاً في التفاصيل
    if (viewingProject && note?.itemId === viewingProject.id) {
      setViewingProject({...viewingProject, updatedAt: new Date()})
    }
  }

  // إضافة مهمة
  const handleAddTask = (task) => {
    console.log('تم إضافة مهمة:', task)
    // إعادة تحميل البيانات إذا كان المشروع معروضاً في التفاصيل
    if (viewingProject && task?.itemId === viewingProject.id) {
      setViewingProject({...viewingProject, updatedAt: new Date()})
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'info'
      case 'construction': return 'warning'
      case 'completed': return 'success'
      case 'cancelled': return 'destructive'
      case 'on_hold': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'planning': return 'التخطيط'
      case 'construction': return 'قيد الإنشاء'
      case 'completed': return 'مكتمل'
      case 'cancelled': return 'ملغي'
      case 'on_hold': return 'متوقف'
      default: return 'غير محدد'
    }
  }

  const getTypeText = (type) => {
    switch (type) {
      case 'residential': return 'سكني'
      case 'commercial': return 'تجاري'
      case 'mixed': return 'مختلط'
      case 'industrial': return 'صناعي'
      default: return 'غير محدد'
    }
  }

  const getProgressPercentage = (project) => {
    if (project.status === 'completed') return 100
    if (project.status === 'cancelled') return 0
    if (project.status === 'planning') return 10
    if (project.status === 'construction') return 50
    return 0
  }

  if (loading) {
    return <LoadingPage message="جاري تحميل المشاريع..." />
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Page Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-700 to-cyan-800 rounded-2xl shadow-xl">
        <div className="relative px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">إدارة المشاريع</h1>
                <p className="text-emerald-100 mt-1">إدارة المشاريع العقارية ومتابعة حالة التطوير</p>
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
              {canCreateProject() && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-emerald-100 rounded-lg">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="font-bold">إضافة مشروع جديد</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <Building2 className="h-24 w-24 text-white" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Home className="h-16 w-16 text-white" />
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* إجمالي المشاريع */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">إجمالي المشاريع</p>
                <p className="text-3xl font-bold text-emerald-900">{activeProjects.length}</p>
                <p className="text-sm text-emerald-600 mt-1">+15% من الشهر الماضي</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* مشاريع مكتملة */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">مشاريع مكتملة</p>
                <p className="text-3xl font-bold text-green-900">
                  {activeProjects.filter(p => p.status === 'completed').length}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {activeProjects.length > 0 ? `${Math.round((activeProjects.filter(p => p.status === 'completed').length / activeProjects.length) * 100)}%` : '0%'} من الإجمالي
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

        {/* مشاريع قيد الإنشاء */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">قيد الإنشاء</p>
                <p className="text-3xl font-bold text-orange-900">
                  {activeProjects.filter(p => p.status === 'construction').length}
                </p>
                <p className="text-sm text-orange-600 mt-1">مشاريع تحت التطوير</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                  <Timer className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* المطورين النشطين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">المطورين النشطين</p>
                <p className="text-3xl font-bold text-blue-900">
                  {developers?.filter(dev => dev.status === 'نشط').length || 0}
                </p>
                <p className="text-sm text-blue-600 mt-1">شركة تطوير عقاري</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid with Cards */}
      <Card className="rounded-xl border border-gray-200 shadow-lg bg-white overflow-hidden">
        {/* Grid Header with Search and Filters */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">المشاريع العقارية</h3>
                <p className="text-sm text-blue-600">
                  {projects?.length || 0} مشروع عقاري
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
              </div>
              
              <div className="flex items-center gap-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-xs"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="planning">التخطيط</option>
                  <option value="construction">قيد الإنشاء</option>
                  <option value="completed">مكتمل</option>
                  <option value="on_hold">متوقف</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-8 px-3 border border-gray-300 rounded-md bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-200 text-xs"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="residential">سكني</option>
                  <option value="commercial">تجاري</option>
                  <option value="mixed">مختلط</option>
                  <option value="industrial">صناعي</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredProjects.map((project) => (
                <Card key={project.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-cyan-50 overflow-hidden">
                  {/* Card Header with Gradient */}
                  <div className="relative bg-gradient-to-r from-blue-600 to-cyan-700 p-4 text-white">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
                    
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-blue-100" />
                          <h3 className="font-bold text-lg text-white truncate">{project.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`${
                              project.status === 'completed' ? 'bg-green-500 text-white' :
                              project.status === 'construction' ? 'bg-yellow-500 text-white' :
                              project.status === 'planning' ? 'bg-blue-500 text-white' :
                              project.status === 'on_hold' ? 'bg-orange-500 text-white' :
                              'bg-gray-500 text-white'
                            } border-0 font-medium`}
                          >
                            {project.status === 'completed' ? 'مكتمل' :
                             project.status === 'construction' ? 'قيد الإنشاء' :
                             project.status === 'planning' ? 'تخطيط' :
                             project.status === 'on_hold' ? 'متوقف' : 'غير محدد'}
                          </Badge>
                          <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30 font-medium">
                            {project.type === 'residential' ? 'سكني' :
                             project.type === 'commercial' ? 'تجاري' :
                             project.type === 'mixed' ? 'مختلط' :
                             project.type === 'industrial' ? 'صناعي' : 'غير محدد'}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-white hover:bg-white hover:bg-opacity-20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === project.id ? null : project.id);
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        
                        {/* Dropdown Menu */}
                        {openDropdownId === project.id && (
                          <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                          <div className="py-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                handleViewProject(project);
                              }}
                              className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              عرض التفاصيل
                            </button>
                            {canEditProject && canEditProject(project) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  handleEditProject(project);
                                }}
                                className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                تعديل
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                toast.success(`تم إضافة ${project.name} للمفضلة`);
                              }}
                              className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Star className="h-4 w-4" />
                              إضافة للمفضلة
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            {canDeleteProject && canDeleteProject(project) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(null);
                                  handleDeleteProject(project);
                                }}
                                className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                حذف المشروع
                              </button>
                            )}
                          </div>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-4">
                    {/* Project Location */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">الموقع</p>
                        <p className="font-semibold text-gray-800">{project.location || 'غير محدد'}</p>
                      </div>
                    </div>

                    {/* Project Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Building2 className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500 mb-1">المطور</p>
                        <p className="font-semibold text-gray-800 text-sm truncate" title={project.developer}>
                          {project.developer || 'غير محدد'}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <Calendar className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500 mb-1">فترة الاستلام</p>
                        <p className="font-semibold text-gray-800 text-sm">
                          {project.deliveryInfo || 'استلام فوري'}
                        </p>
                      </div>
                    </div>

                    {/* Project Description */}
                    {project.description && (
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                              {project.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewProject(project)}>
                        <Eye className="h-3 w-3 ml-1" />
                        عرض
                      </Button>
                      {canEditProject && canEditProject(project) && (
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditProject(project)}>
                          <Edit className="h-3 w-3 ml-1" />
                          تعديل
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewUnits(project)}>
                        <Home className="h-3 w-3 ml-1" />
                        الوحدات
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد مشاريع
            </h3>
            <p className="text-gray-600 mb-4">
              ابدأ بإضافة المشاريع لإدارة قاعدة بياناتك
            </p>
            {canCreateProject && canCreateProject() && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 ml-1" />
                إضافة مشروع جديد
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Old Table View - Hidden */}
      <div className="hidden">
      <ProjectsTable
          projects={filteredProjects}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
          onView={handleViewProject}
          onReminder={handleReminder}
          onAddTask={handleAddTask}
          onViewUnits={handleViewUnits}
          onViewSales={handleViewSales}
          onGenerateReport={handleGenerateReport}
          canEditProject={canEditProject}
          canDeleteProject={canDeleteProject}
        />
      </div>

      {/* العرض القديم - مخفي */}
      <div className="hidden">
      {filteredProjects.length > 0 ? (
        <div className="bizmax-grid-2">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="bizmax-card hover:shadow-medium transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusColor(project.status)}>
                        {getStatusText(project.status)}
                      </Badge>
                      <Badge variant="outline">
                        {getTypeText(project.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                  </div>
                  <div className="relative">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {project.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                  
                  {project.developer && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>المطور: {project.developer}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Home className="h-4 w-4" />
                    <span>الوحدات: {project.totalUnits || 0} (متاح: {project.availableUnits || 0})</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      السعر: {formatCurrency(project.startPrice)} - {formatCurrency(project.endPrice)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      التاريخ المتوقع: {formatDateArabic(project.expectedCompletion)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">التقدم</span>
                    <span className="text-sm font-medium text-gray-900">
                      {getProgressPercentage(project)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(project)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingProject(project)}
                  >
                    <Edit className="h-3 w-3 ml-1" />
                    تعديل
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 ml-1" />
                    عرض
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
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
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مشاريع</h3>
            <p className="text-gray-500 mb-4">ابدأ بإضافة أول مشروع عقاري</p>
            {canCreateProject() && (
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مشروع جديد
              </Button>
            )}
          </div>
        </Card>
      )}
      </div>

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إضافة مشروع عقاري جديد</h3>
                    <p className="text-emerald-100 text-sm">املأ بيانات المشروع العقاري</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-emerald-100">
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
              <form onSubmit={handleAddProject} className="p-6 space-y-4">
              {/* الصف الأول */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    اسم المشروع <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="أدخل اسم المشروع"
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    required
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    شركة التطوير <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProject.developer}
                    onChange={(e) => setNewProject({...newProject, developer: e.target.value})}
                    className="bizmax-input h-9"
                    required
                    disabled={developersLoading}
                  >
                    <option value="">
                      {developersLoading ? 'جاري تحميل المطورين...' : 'اختر المطور'}
                    </option>
                    {developers?.map((developer) => (
                      <option key={developer.id} value={developer.name}>
                        {developer.name} {developer.status !== 'active' ? ' (غير نشط)' : ''}
                      </option>
                    ))}
                    {!developersLoading && developers?.length === 0 && (
                      <option value="" disabled>لا توجد شركات تطوير متاحة</option>
                    )}
                  </select>
                  {!developersLoading && developers?.length === 0 && (
                    <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      لا توجد شركات تطوير متاحة. 
                      <button 
                        type="button"
                        onClick={() => window.open('/developers', '_blank')}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        إضافة مطور جديد
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* الصف الثاني */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    حالة المشروع <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                    className="bizmax-input h-9"
                    required
                  >
                    <option value="">حدد الحالة</option>
                    <option value="planning">تخطيط</option>
                    <option value="under_construction">قيد الإنشاء</option>
                    <option value="completed">مكتمل</option>
                    <option value="on_hold">متوقف</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الموقع <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="أدخل موقع المشروع"
                    value={newProject.location}
                    onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                    required
                    className="h-9"
                  />
                </div>
              </div>

              {/* الصف الثالث - حقول إضافية */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    إجمالي الوحدات
                  </label>
                  <Input
                    type="number"
                    placeholder="عدد الوحدات الكلي (اختياري)"
                    value={newProject.totalUnits}
                    onChange={(e) => setNewProject({...newProject, totalUnits: e.target.value})}
                    className="h-9"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    الوحدات المتاحة
                  </label>
                  <Input
                    type="number"
                    placeholder="عدد الوحدات المتاحة (اختياري)"
                    value={newProject.availableUnits}
                    onChange={(e) => setNewProject({...newProject, availableUnits: e.target.value})}
                    className="h-9"
                    min="0"
                    max={newProject.totalUnits}
                  />
                </div>
              </div>

              {/* الصف الرابع - النطاق السعري والتقدم */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    النطاق السعري
                  </label>
                  <Input
                    placeholder="مثال: 500,000 - 1,000,000 جنيه (اختياري)"
                    value={newProject.priceRange}
                    onChange={(e) => setNewProject({...newProject, priceRange: e.target.value})}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    نسبة الإنجاز (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="0-100 (اختياري)"
                    value={newProject.completion}
                    onChange={(e) => setNewProject({...newProject, completion: e.target.value})}
                    className="h-9"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* الوصف والصور */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    وصف المشروع
                  </label>
                  <textarea
                    className="bizmax-input h-20 resize-none"
                    placeholder="وصف مختصر"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    صور المشروع
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center h-20">
                    <div className="space-y-1">
                      <svg className="mx-auto h-6 w-6 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs text-gray-500">اختر الصور</p>
                    </div>
                  </div>
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
                <Button 
                  type="submit" 
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={isSubmitting || developersLoading}
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إضافة المشروع'}
                </Button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal - Modern Design */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Enhanced Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <Edit className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">تعديل المشروع العقاري</h3>
                    <p className="text-blue-100 text-sm">تحديث بيانات المشروع</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-blue-100">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date().toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo' })}</span>
                      <span className="mx-1">•</span>
                      <Clock className="h-3 w-3" />
                      <span>{new Date().toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProject(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <form onSubmit={handleUpdateProject} className="p-6 space-y-4">
                {/* الصف الأول */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      اسم المشروع <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="أدخل اسم المشروع"
                      value={editingProject.name || ''}
                      onChange={(e) => setEditingProject({...editingProject, name: e.target.value})}
                      required
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      شركة التطوير <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingProject.developer || ''}
                      onChange={(e) => setEditingProject({...editingProject, developer: e.target.value})}
                      className="bizmax-input h-9"
                      required
                      disabled={developersLoading}
                    >
                      <option value="">
                        {developersLoading ? 'جاري تحميل المطورين...' : 'اختر المطور'}
                      </option>
                      {developers?.map((developer) => (
                        <option key={developer.id} value={developer.name}>
                          {developer.name} {developer.status !== 'active' ? ' (غير نشط)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* الصف الثاني */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      حالة المشروع <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingProject.status || 'planning'}
                      onChange={(e) => setEditingProject({...editingProject, status: e.target.value})}
                      className="bizmax-input h-9"
                      required
                    >
                      <option value="">حدد الحالة</option>
                      <option value="planning">تخطيط</option>
                      <option value="under_construction">قيد الإنشاء</option>
                      <option value="completed">مكتمل</option>
                      <option value="on_hold">متوقف</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      الموقع <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="أدخل موقع المشروع"
                      value={editingProject.location || ''}
                      onChange={(e) => setEditingProject({...editingProject, location: e.target.value})}
                      required
                      className="h-9"
                    />
                  </div>
                </div>

                {/* الصف الثالث - حقل الاستلام */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      فترة الاستلام
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="اتركه فارغ للاستلام الفوري"
                        value={editingProject.deliveryTime || ''}
                        onChange={(e) => setEditingProject({...editingProject, deliveryTime: e.target.value})}
                        className="h-9 flex-1"
                        min="1"
                      />
                      <select
                        value={editingProject.deliveryUnit || 'months'}
                        onChange={(e) => setEditingProject({...editingProject, deliveryUnit: e.target.value})}
                        className="bizmax-input h-9 w-20"
                        disabled={!editingProject.deliveryTime}
                      >
                        <option value="months">شهر</option>
                        <option value="years">سنة</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {editingProject.deliveryTime 
                        ? `استلام خلال ${editingProject.deliveryTime} ${editingProject.deliveryUnit === 'months' ? 'شهر' : 'سنة'}`
                        : 'استلام فوري'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      نوع المشروع
                    </label>
                    <select
                      value={editingProject.type || 'residential'}
                      onChange={(e) => setEditingProject({...editingProject, type: e.target.value})}
                      className="bizmax-input h-9"
                    >
                      <option value="residential">سكني</option>
                      <option value="commercial">تجاري</option>
                      <option value="mixed">مختلط</option>
                      <option value="administrative">إداري</option>
                    </select>
                  </div>
                </div>

                {/* الوصف */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    وصف المشروع
                  </label>
                  <textarea
                    className="bizmax-input h-20 resize-none"
                    placeholder="وصف مختصر"
                    value={editingProject.description || ''}
                    onChange={(e) => setEditingProject({...editingProject, description: e.target.value})}
                    rows={3}
                  />
                </div>

                {/* أزرار الحفظ */}
                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري الحفظ...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        حفظ التغييرات
                      </div>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingProject(null)}
                    className="px-6 py-2.5 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* مودال عرض التفاصيل */}
      {viewingProject && (
        <ViewDetailsModal
          item={viewingProject}
          type="project"
          onClose={() => setViewingProject(null)}
        />
      )}

      {/* حوار تأكيد الحذف */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setProjectToDelete(null)
        }}
        onConfirm={confirmDeleteProject}
        title="تأكيد نقل المشروع للأرشيف"
        message={`هل أنت متأكد من نقل المشروع "${projectToDelete?.name}" إلى الأرشيف؟ يمكنك استعادته لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />
    </div>
  )
}