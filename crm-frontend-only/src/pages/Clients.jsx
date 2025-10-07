import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { useAuth } from '../contexts/AuthContext'
import { useApi, usePaginatedApi } from '../hooks/useApi'
import { formatDateArabic, formatPhoneNumber } from '../lib/utils'
import toast from 'react-hot-toast'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { LoadingButton, SubmitButton, DeleteButton } from '../components/ui/LoadingButton'
import { TableSkeleton, CardSkeleton } from '../components/ui/SkeletonLoader'
import { NoDataState, LoadErrorState, NoSearchResults } from '../components/ui/EmptyState'
import ResponsiveTable from '../components/ui/ResponsiveTable'

const statusOptions = [
  { value: 'active', label: 'نشط', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'متوقف', color: 'bg-red-100 text-red-800' },
  { value: 'potential', label: 'محتمل', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'converted', label: 'محول', color: 'bg-blue-100 text-blue-800' }
]

const priorityOptions = [
  { value: 'عالية', label: 'عالية', color: 'bg-red-100 text-red-800' },
  { value: 'متوسطة', label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'منخفضة', label: 'منخفضة', color: 'bg-green-100 text-green-800' }
]

export default function Clients() {
  const { currentUser } = useAuth()
  const api = useApi()
  
  // Use paginated API hook for clients
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
  
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [clientToDelete, setClientToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    budget: '',
    status: 'active',
    source: '',
    assignedTo: '',
    notes: ''
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      // جلب المستخدمين الحقيقيين من قاعدة البيانات
      const usersResponse = await api.getUsers()
      
      if (usersResponse?.success && usersResponse?.data) {
        // فلترة المستخدمين النشطين فقط وتنسيق البيانات
        const activeUsers = usersResponse.data
          .filter(user => user.status === 'active')
          .map(user => ({
            name: user.name || user.displayName || user.email,
            id: user.id || user.email,
            role: user.role
          }))
        
        setUsers(activeUsers)
        console.log('✅ تم جلب المستخدمين الحقيقيين:', activeUsers.length)
      } else {
        // fallback للأسماء الوهمية في حالة فشل API
        console.warn('⚠️ فشل في جلب المستخدمين، استخدام قائمة احتياطية')
        const salesTeam = [
          'أحمد سمير',
          'سارة أحمد', 
          'مريم يوسف',
          'المدير العام'
        ]
        setUsers(salesTeam.map(name => ({ name, id: name })))
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error)
      // fallback للأسماء الوهمية في حالة الخطأ
      const salesTeam = [
        'أحمد سمير',
        'سارة أحمد', 
        'مريم يوسف',
        'المدير العام'
      ]
      setUsers(salesTeam.map(name => ({ name, id: name })))
    }
  }

  // Handle search and filters
  useEffect(() => {
    const params = {
      page: 1,
      limit: 50
    }
    
    if (searchTerm) params.search = searchTerm
    if (statusFilter) params.status = statusFilter
    if (assignedToFilter) params.assignedTo = assignedToFilter
    
    updateParams(params)
  }, [searchTerm, statusFilter, assignedToFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedClient) {
        await api.updateClient(selectedClient.id, formData)
        toast.success('تم تحديث العميل بنجاح')
        setIsEditModalOpen(false)
      } else {
        await api.addClient({
          ...formData,
          assignedTo: formData.assignedTo || currentUser?.name
        })
        toast.success('تم إضافة العميل بنجاح')
        setIsAddModalOpen(false)
      }
      refetch()
      resetForm()
    } catch (error) {
      console.error('خطأ في حفظ العميل:', error)
      toast.error('خطأ في حفظ بيانات العميل')
    }
  }

  const showDeleteConfirm = (client) => {
    setClientToDelete(client)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    setDeleteLoading(true)
    try {
      await api.deleteClient(clientToDelete.id)
      toast.success('تم حذف العميل بنجاح')
      refetch()
      setShowDeleteDialog(false)
      setClientToDelete(null)
    } catch (error) {
      console.error('خطأ في حذف العميل:', error)
      toast.error('خطأ في حذف العميل')
    } finally {
      setDeleteLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      budget: '',
      status: 'active',
      source: '',
      assignedTo: '',
      notes: ''
    })
    setSelectedClient(null)
  }

  const openEditModal = (client) => {
    setSelectedClient(client)
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      budget: client.budget || '',
      status: client.status || 'active',
      source: client.source || '',
      assignedTo: client.assignedTo || '',
      notes: client.notes || ''
    })
    setIsEditModalOpen(true)
  }

    // No need for local filtering - backend handles it
  const filteredClients = clients

  const getStatusBadge = (status) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.color : 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority)
    return option ? option.color : 'bg-gray-100 text-gray-800'
  }

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : 'غير محدد'
  }

  // Error state
  if (error) {
    return (
      <ErrorBoundary>
        <LoadErrorState
          title="فشل في تحميل بيانات العملاء"
          description="حدث خطأ أثناء تحميل قائمة العملاء. يرجى المحاولة مرة أخرى."
          onRetry={refetch}
        />
      </ErrorBoundary>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Filters Skeleton */}
        <div className="flex gap-4">
          <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Table Skeleton */}
        <TableSkeleton rows={8} columns={6} />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">إدارة العملاء</h1>
        <Button 
          onClick={() => setIsAddModalOpen(true)} 
          className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
        >
          <div className="flex items-center gap-3">
            <div className="p-1 bg-blue-100 rounded-lg">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-bold">إضافة عميل جديد</span>
          </div>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            البحث والفلترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث في العملاء..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الحالات</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الأولويات</SelectItem>
                {priorityOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
              <SelectTrigger>
                <SelectValue placeholder="المسؤول" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع المسؤولين</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setPriorityFilter('')
                setAssignedToFilter('')
              }}
            >
              مسح الفلاتر
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Card key={client.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showDeleteConfirm(client)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusBadge(client.status)}>
                  {client.status}
                </Badge>
                <Badge className={getPriorityBadge(client.priority)}>
                  {client.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  {formatPhoneNumber(client.phone)}
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  {client.address}
                </div>
              )}
              <div className="text-sm text-gray-500">
                المسؤول: {getUserName(client.assignedTo)}
              </div>
              {client.createdAt && (
                <div className="text-xs text-gray-400">
                  تاريخ الإضافة: {formatDateArabic(client.createdAt)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">لا توجد عملاء مطابقين للبحث</p>
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة عميل جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم العميل *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="status">الحالة</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">الأولوية</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assignedTo">المسؤول</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({...formData, assignedTo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المسؤول" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}>
                إلغاء
              </Button>
              <Button type="submit">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل العميل</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">اسم العميل *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">البريد الإلكتروني</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">رقم الهاتف</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">الحالة</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">الأولوية</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-assignedTo">المسؤول</Label>
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData({...formData, assignedTo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المسؤول" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">العنوان</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditModalOpen(false)
                resetForm()
              }}>
                إلغاء
              </Button>
              <Button type="submit">حفظ التغييرات</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog تأكيد الحذف */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setClientToDelete(null)
        }}
        onConfirm={handleDelete}
        title="حذف العميل"
        message={`هل أنت متأكد من حذف العميل "${clientToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        loading={deleteLoading}
      />
    </div>
    </ErrorBoundary>
  )
}

