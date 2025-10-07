import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit, 
  Trash2, 
  Users, 
  Crown,
  Settings,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  X,
  Key,
  Award,
  Target,
  TrendingUp,
  MoreHorizontal,
  Sparkles
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useRoles } from '../hooks/useRoles'
import LoadingPage from '../components/ui/loading'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

export default function RoleManagement() {
  const { currentUser, userProfile } = useAuth()
  const { isAdmin, checkPermission } = usePermissions()
  const { 
    roles, 
    loading, 
    error, 
    addRole, 
    updateRole, 
    deleteRole, 
    toggleRoleStatus,
    getAvailablePermissions,
    getPermissionLabel,
    ROLES 
  } = useRoles()

  // State management
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    type: 'operational',
    level: 'medium',
    status: 'active',
    permissions: [],
    color: 'blue'
  })
  const [isSaving, setIsSaving] = useState(false)

  // Check permissions
  const canManageRoles = checkPermission('manage_roles') || isAdmin
  const canViewRoles = checkPermission('view_roles') || isAdmin

  if (!canViewRoles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">غير مسموح</h2>
          <p className="text-gray-600">ليس لديك صلاحية لعرض إدارة الأدوار</p>
        </Card>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: roles.length,
    active: roles.filter(r => r.status === 'active').length,
    inactive: roles.filter(r => r.status === 'inactive').length,
    system: roles.filter(r => r.type === 'system').length,
    management: roles.filter(r => r.type === 'management').length,
    operational: roles.filter(r => r.type === 'operational').length
  }

  // Filter roles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = activeFilter === 'all' || 
                         role.status === activeFilter ||
                         role.type === activeFilter

    return matchesSearch && matchesFilter
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      description: '',
      type: 'operational',
      level: 'medium',
      status: 'active',
      permissions: [],
      color: 'blue'
    })
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.key || !formData.description) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      setIsSaving(true)
      
      if (selectedRole) {
        // Update existing role
        await updateRole(selectedRole.id, formData)
        setShowEditModal(false)
      } else {
        // Add new role
        await addRole(formData)
        setShowAddModal(false)
      }
      
      resetForm()
      setSelectedRole(null)
    } catch (error) {
      console.error('Error saving role:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return

    try {
      await deleteRole(roleToDelete.id)
      setShowDeleteDialog(false)
      setRoleToDelete(null)
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  // Handle toggle status
  const handleToggleStatus = async (role) => {
    try {
      await toggleRoleStatus(role.id)
    } catch (error) {
      console.error('Error toggling role status:', error)
    }
  }

  // Get role color class
  const getRoleColorClass = (color, type = 'bg') => {
    const colors = {
      purple: type === 'bg' ? 'bg-purple-500' : type === 'text' ? 'text-purple-600' : 'border-purple-200',
      blue: type === 'bg' ? 'bg-blue-500' : type === 'text' ? 'text-blue-600' : 'border-blue-200',
      green: type === 'bg' ? 'bg-green-500' : type === 'text' ? 'text-green-600' : 'border-green-200',
      orange: type === 'bg' ? 'bg-orange-500' : type === 'text' ? 'text-orange-600' : 'border-orange-200',
      red: type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-600' : 'border-red-200',
      gray: type === 'bg' ? 'bg-gray-500' : type === 'text' ? 'text-gray-600' : 'border-gray-200'
    }
    return colors[color] || colors.blue
  }

  // Get type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'system': return Crown
      case 'management': return Shield
      case 'operational': return Users
      default: return Target
    }
  }

  // Get level badge color
  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-white to-gray-100 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-2xl backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">إدارة الأدوار</h1>
                <p className="text-purple-100">إدارة أدوار المستخدمين والصلاحيات في النظام</p>
              </div>
            </div>
            
            {canManageRoles && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-white text-cyan-600 hover:bg-cyan-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-cyan-100 hover:border-cyan-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-cyan-100 rounded-lg">
                    <Plus className="h-4 w-4 text-cyan-600" />
                  </div>
                  <span className="font-bold">إضافة دور جديد</span>
                </div>
              </Button>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">إجمالي الأدوار</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-200" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">نشط</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-200" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm">غير نشط</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
            <Lock className="h-8 w-8 text-gray-200" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">النظام</p>
              <p className="text-2xl font-bold">{stats.system}</p>
            </div>
            <Crown className="h-8 w-8 text-purple-200" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">إدارية</p>
              <p className="text-2xl font-bold">{stats.management}</p>
            </div>
            <Settings className="h-8 w-8 text-indigo-200" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm">تشغيلية</p>
              <p className="text-2xl font-bold">{stats.operational}</p>
            </div>
            <Users className="h-8 w-8 text-teal-200" />
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الأدوار..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                فلترة
              </Button>
              
              {showFilterDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border rounded-lg shadow-lg p-2 z-10 min-w-48">
                  {[
                    { key: 'all', label: 'جميع الأدوار', count: stats.total },
                    { key: 'active', label: 'نشط', count: stats.active },
                    { key: 'inactive', label: 'غير نشط', count: stats.inactive },
                    { key: 'system', label: 'النظام', count: stats.system },
                    { key: 'management', label: 'إدارية', count: stats.management },
                    { key: 'operational', label: 'تشغيلية', count: stats.operational }
                  ].map(filter => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setActiveFilter(filter.key)
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full text-right px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between ${
                        activeFilter === filter.key ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      <span>{filter.label}</span>
                      <Badge variant="secondary">{filter.count}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredRoles.length} من {roles.length} دور
          </div>
        </div>
      </Card>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role, index) => {
          const TypeIcon = getTypeIcon(role.type)
          const delay = index * 0.1
          
          return (
            <Card 
              key={role.id}
              className="group hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden border-0"
              style={{ animation: `slideInUp 0.6s ease-out ${delay}s both` }}
            >
              {/* Header */}
              <div className={`relative bg-gradient-to-r ${getRoleColorClass(role.color)} p-6 text-white`}>
                <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{role.name}</h3>
                        <p className="text-sm opacity-90">{role.key}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`${getLevelBadgeColor(role.level)} text-xs`}>
                        {role.level === 'high' ? 'عالي' : role.level === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                      <Badge className={role.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {role.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm opacity-90 leading-relaxed">{role.description}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{role.usersCount}</div>
                    <div className="text-sm text-gray-600">المستخدمين</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{role.permissionsCount}</div>
                    <div className="text-sm text-gray-600">الصلاحيات</div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  <div className="flex justify-between">
                    <span>تم الإنشاء:</span>
                    <span>{role.createdAt.toLocaleDateString('ar-EG')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>آخر تحديث:</span>
                    <span>{role.updatedAt.toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRole(role)
                      setShowViewModal(true)
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    عرض
                  </Button>
                  
                  {canManageRoles && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role)
                          setFormData({
                            name: role.name,
                            key: role.key,
                            description: role.description,
                            type: role.type,
                            level: role.level,
                            status: role.status,
                            permissions: role.permissions || [],
                            color: role.color
                          })
                          setShowEditModal(true)
                        }}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      
                      {role.type !== 'system' && role.usersCount === 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoleToDelete(role)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredRoles.length === 0 && (
        <Card className="p-12 text-center">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد أدوار</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || activeFilter !== 'all' 
              ? 'لم يتم العثور على أدوار تطابق البحث أو الفلتر المحدد'
              : 'لم يتم إنشاء أي أدوار بعد'
            }
          </p>
          {canManageRoles && !searchQuery && activeFilter === 'all' && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة دور جديد
            </Button>
          )}
        </Card>
      )}

      {/* Add/Edit Role Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedRole ? 'تعديل الدور' : 'إضافة دور جديد'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setSelectedRole(null)
                    resetForm()
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الدور *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: مدير المبيعات"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مفتاح الدور *
                  </label>
                  <Input
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="مثال: sales_manager"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الدور
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="operational">تشغيلية</option>
                    <option value="management">إدارية</option>
                    <option value="system">النظام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مستوى الدور
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">منخفض</option>
                    <option value="medium">متوسط</option>
                    <option value="high">عالي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحالة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون
                  </label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="blue">أزرق</option>
                    <option value="green">أخضر</option>
                    <option value="purple">بنفسجي</option>
                    <option value="orange">برتقالي</option>
                    <option value="red">أحمر</option>
                    <option value="gray">رمادي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف الدور *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="وصف مفصل للدور والمسؤوليات..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  الصلاحيات
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {getAvailablePermissions().map(permission => (
                    <label key={permission.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              permissions: [...prev.permissions, permission.value]
                            }))
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              permissions: prev.permissions.filter(p => p !== permission.value)
                            }))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{permission.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setSelectedRole(null)
                    resetForm()
                  }}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'جاري الحفظ...' : selectedRole ? 'تحديث الدور' : 'إضافة الدور'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Role Modal */}
      {showViewModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">تفاصيل الدور</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedRole(null)
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">معلومات أساسية</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">الاسم:</span>
                      <span className="font-medium">{selectedRole.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المفتاح:</span>
                      <span className="font-mono text-sm">{selectedRole.key}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">النوع:</span>
                      <Badge>{selectedRole.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المستوى:</span>
                      <Badge className={getLevelBadgeColor(selectedRole.level)}>
                        {selectedRole.level === 'high' ? 'عالي' : selectedRole.level === 'medium' ? 'متوسط' : 'منخفض'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الحالة:</span>
                      <Badge className={selectedRole.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedRole.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">إحصائيات</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد المستخدمين:</span>
                      <span className="font-bold text-blue-600">{selectedRole.usersCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد الصلاحيات:</span>
                      <span className="font-bold text-green-600">{selectedRole.permissionsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">تاريخ الإنشاء:</span>
                      <span className="text-sm">{selectedRole.createdAt.toLocaleDateString('ar-EG')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">آخر تحديث:</span>
                      <span className="text-sm">{selectedRole.updatedAt.toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">الوصف</h3>
                <p className="text-gray-700 leading-relaxed">{selectedRole.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">الصلاحيات ({selectedRole.permissionsCount})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {selectedRole.permissions?.map(permission => (
                    <div key={permission} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{getPermissionLabel(permission)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setRoleToDelete(null)
        }}
        onConfirm={handleDeleteRole}
        title="حذف الدور"
        message={`هل أنت متأكد من حذف الدور "${roleToDelete?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  )
}