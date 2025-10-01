import React, { useState } from 'react'
import { 
  Users, 
  Plus, 
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Shield,
  X,
  Loader2,
  Crown,
  UserCheck,
  UserX,
  TrendingUp,
  Download,
  Check
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useUsers } from '../hooks/useUsers'
import { toast } from 'react-hot-toast'
import LoadingPage from '../components/ui/loading'

export default function UserManagement() {
  const { currentUser } = useAuth()
  const { isAdmin } = usePermissions()
  const { users, loading, error, addUser, updateUser, deleteUser, updateUserStatus } = useUsers()
  
  // State
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'sales',
    department: '',
    status: 'active'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      }
      
      // Auto-generate username from name
      if (name === 'name' && value) {
        // Convert Arabic/English name to username format
        const username = value
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[أإآا]/g, 'a')
          .replace(/[ة]/g, 'h')
          .replace(/[ي]/g, 'y')
          .replace(/[و]/g, 'w')
          .replace(/[ر]/g, 'r')
          .replace(/[ت]/g, 't')
          .replace(/[ط]/g, 't')
          .replace(/[ظ]/g, 'z')
          .replace(/[ع]/g, 'a')
          .replace(/[غ]/g, 'gh')
          .replace(/[ف]/g, 'f')
          .replace(/[ق]/g, 'q')
          .replace(/[ك]/g, 'k')
          .replace(/[ل]/g, 'l')
          .replace(/[م]/g, 'm')
          .replace(/[ن]/g, 'n')
          .replace(/[ه]/g, 'h')
          .replace(/[ج]/g, 'j')
          .replace(/[ح]/g, 'h')
          .replace(/[خ]/g, 'kh')
          .replace(/[د]/g, 'd')
          .replace(/[ذ]/g, 'th')
          .replace(/[ز]/g, 'z')
          .replace(/[س]/g, 's')
          .replace(/[ش]/g, 'sh')
          .replace(/[ص]/g, 's')
          .replace(/[ض]/g, 'd')
          .replace(/[^\w_]/g, '')
        
        newData.username = username || value.toLowerCase().replace(/\s+/g, '_')
      }
      
      return newData
    })
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      role: 'sales',
      department: '',
      status: 'active'
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح')
      return
    }

    // Password validation
    if (formData.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    try {
      setIsSubmitting(true)
      await addUser(formData)
      toast.success('تم إضافة المستخدم بنجاح')
    setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error(error.message || 'فشل في إضافة المستخدم')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle user deletion
  const handleDeleteUser = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error('لا يمكن حذف حسابك الشخصي')
      return
    }

    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return
    }

    try {
      await deleteUser(user.id)
      toast.success('تم حذف المستخدم بنجاح')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'فشل في حذف المستخدم')
    }
  }

  // Handle status toggle
  const handleStatusToggle = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error('لا يمكن تغيير حالة حسابك الشخصي')
      return
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    
    try {
      await updateUserStatus(user.id, newStatus)
      toast.success(`تم ${newStatus === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`)
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error(error.message || 'فشل في تحديث حالة المستخدم')
    }
  }

  // Handle bulk operations
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return
    
    if (!confirm(`هل أنت متأكد من حذف ${selectedUsers.length} مستخدم؟`)) {
      return
    }

    try {
      await Promise.all(
        selectedUsers.map(userId => deleteUser(userId))
      )
      toast.success(`تم حذف ${selectedUsers.length} مستخدم بنجاح`)
      setSelectedUsers([])
    } catch (error) {
      console.error('Error bulk deleting users:', error)
      toast.error('فشل في حذف المستخدمين')
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.department?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    admins: users.filter(u => u.role === 'admin').length,
    sales: users.filter(u => u.role === 'sales' || u.role === 'sales_manager').length
  }

  // Get role label
  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'مدير النظام'
      case 'sales_manager': return 'مدير مبيعات'
      case 'sales': return 'موظف مبيعات'
      case 'employee': return 'موظف'
      default: return role
    }
  }

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'sales_manager': return 'bg-blue-100 text-blue-800'
      case 'sales': return 'bg-green-100 text-green-800'
      case 'employee': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Permission check
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">غير مصرح</h2>
          <p className="text-gray-600">ليس لديك صلاحية للوصول لهذه الصفحة</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                <h1 className="text-3xl font-bold text-white">إدارة المستخدمين</h1>
                <p className="text-indigo-100 mt-1">إدارة ومتابعة جميع مستخدمي النظام والصلاحيات</p>
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
                onClick={() => setShowAddModal(true)}
                className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-indigo-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-indigo-100 rounded-lg">
                    <Plus className="h-4 w-4 text-indigo-600" />
                  </div>
                  <span className="font-bold">إضافة مستخدم جديد</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 opacity-10">
          <Users className="h-24 w-24 text-white" />
      </div>
        <div className="absolute bottom-4 left-4 opacity-10">
          <Shield className="h-16 w-16 text-white" />
              </div>
              </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* إجمالي المستخدمين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 mb-1">إجمالي المستخدمين</p>
                <p className="text-3xl font-bold text-indigo-900">{stats.total}</p>
                <p className="text-sm text-indigo-600 mt-1">جميع المستخدمين</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
              </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-400 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-white" />
            </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* المستخدمين النشطين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">نشط</p>
                <p className="text-3xl font-bold text-green-900">{stats.active}</p>
                <p className="text-sm text-green-600 mt-1">مستخدمين نشطين</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserCheck className="h-8 w-8 text-white" />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* المديرين */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">المديرين</p>
                <p className="text-3xl font-bold text-purple-900">{stats.admins}</p>
                <p className="text-sm text-purple-600 mt-1">مديري النظام</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Crown className="h-8 w-8 text-white" />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* فريق المبيعات */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">فريق المبيعات</p>
                <p className="text-3xl font-bold text-blue-900">{stats.sales}</p>
                <p className="text-sm text-blue-600 mt-1">موظفي المبيعات</p>
              </div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <User className="h-8 w-8 text-white" />
              </div>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters with Integrated Users Table */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Search Header Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-lg font-semibold text-indigo-800">المستخدمين</h3>
                <p className="text-sm text-indigo-600">
                  {users.length} مستخدم مسجل
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث سريع..."
                    className="pl-10 pr-10 h-8 w-48 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
              
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                className="h-8 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="all">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                            <option value="sales_manager">مدير مبيعات</option>
                <option value="sales">موظف مبيعات</option>
                <option value="employee">موظف</option>
                          </select>
            </div>
          </div>
                        </div>
                        
        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-indigo-100 border-b border-indigo-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-900">
                  تم تحديد {selectedUsers.length} مستخدم
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  إلغاء التحديد
                </Button>
        </div>

              <div className="flex items-center gap-2">
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
          
        {/* Users Table Content */}
        <div className="p-6">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستخدمين</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة المستخدم الأول لإدارة النظام</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة مستخدم جديد
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">المستخدم</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الدور</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">القسم</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الحالة</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">تاريخ الإنشاء</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 group">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{user.name}</p>
                            <p className="text-sm text-gray-500 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </p>
                            )}
                        </div>
                          </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getRoleColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 group-hover:text-gray-700 transition-colors">{user.department || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getStatusColor(user.status)}>
                          {user.status === 'active' ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-600 group-hover:text-gray-700 transition-colors">
                          {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <Button
                          size="sm"
                          variant="outline"
                            onClick={() => handleStatusToggle(user)}
                            disabled={user.id === currentUser?.id}
                            className={`text-xs font-medium ${
                            user.status === 'active' 
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                              : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                            }`}
                        >
                          {user.status === 'active' ? (
                            <>
                                <UserX className="h-3 w-3 ml-1" />
                                إلغاء تفعيل
                            </>
                          ) : (
                            <>
                                <UserCheck className="h-3 w-3 ml-1" />
                              تفعيل
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            className="text-red-600 hover:text-red-700 bg-red-50 border-red-200 hover:bg-red-100 text-xs font-medium"
                        >
                          <Trash2 className="h-3 w-3 ml-1" />
                          حذف
                        </Button>
                      </div>
                      </td>
                    </tr>
              ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="bg-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  إضافة مستخدم جديد
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="مثال: أحمد محمد علي" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المستخدم <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="سيتم توليده تلقائياً من الاسم" 
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 سيتم توليد اسم المستخدم تلقائياً عند كتابة الاسم، يمكنك تعديله
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="email"
                    type="email" 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ahmed@example.com" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <Input 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+966xxxxxxxxx" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الدور <span className="text-red-500">*</span>
                    </label>
                    <select 
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="sales">موظف مبيعات</option>
                      <option value="sales_manager">مدير مبيعات</option>
                      <option value="admin">مدير النظام</option>
                      <option value="employee">موظف</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                  <Input 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="مثال: المبيعات" 
                  />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    name="password"
                    type="password" 
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="كلمة مرور قوية (6 أحرف على الأقل)" 
                    required
                    minLength={6}
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
              <Button 
                    type="button"
                variant="outline" 
                    onClick={() => {
                      setShowAddModal(false)
                      resetForm()
                    }}
                    disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button 
                    type="submit"
                className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        جاري الحفظ...
                  </>
                ) : (
                      'حفظ المستخدم'
                )}
              </Button>
            </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}