import { useState, useEffect } from 'react'
import { useApi } from './useApi'
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS } from '../lib/roles'
import toast from 'react-hot-toast'

const useRoles = () => {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const api = useApi()

  // Default roles based on our system
  const defaultRoles = [
    {
      id: 'role-1',
      name: 'مشرف النظام',
      key: ROLES.ADMIN,
      description: 'مشرف النظام مع صلاحيات كاملة للوصول إلى جميع الميزات والإعدادات',
      type: 'system',
      status: 'active',
      usersCount: 2,
      permissions: ROLE_PERMISSIONS[ROLES.ADMIN] || [],
      permissionsCount: ROLE_PERMISSIONS[ROLES.ADMIN]?.length || 0,
      level: 'high',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      color: 'purple'
    },
    {
      id: 'role-2',
      name: 'مدير المبيعات',
      key: ROLES.SALES_MANAGER,
      description: 'مدير المبيعات مع صلاحيات إدارة الفريق والعملاء والصفقات',
      type: 'management',
      status: 'active',
      usersCount: 3,
      permissions: ROLE_PERMISSIONS[ROLES.SALES_MANAGER] || [],
      permissionsCount: ROLE_PERMISSIONS[ROLES.SALES_MANAGER]?.length || 0,
      level: 'high',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      color: 'blue'
    },
    {
      id: 'role-3',
      name: 'مندوب مبيعات',
      key: ROLES.SALES,
      description: 'مندوب مبيعات مع صلاحيات أساسية للتعامل مع العملاء والصفقات',
      type: 'operational',
      status: 'active',
      usersCount: 8,
      permissions: ROLE_PERMISSIONS[ROLES.SALES] || [],
      permissionsCount: ROLE_PERMISSIONS[ROLES.SALES]?.length || 0,
      level: 'medium',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      color: 'green'
    },
    {
      id: 'role-4',
      name: 'موظف',
      key: ROLES.EMPLOYEE,
      description: 'موظف مع صلاحيات محدودة للوصول للميزات الأساسية',
      type: 'operational',
      status: 'active',
      usersCount: 5,
      permissions: ROLE_PERMISSIONS[ROLES.EMPLOYEE] || [],
      permissionsCount: ROLE_PERMISSIONS[ROLES.EMPLOYEE]?.length || 0,
      level: 'low',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      color: 'gray'
    }
  ]

  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fetching roles from API...')
      
      try {
        // Try to fetch from API first
        const response = await api.getRoles?.()
        console.log('✅ Roles API response:', response)
        
        const rolesData = response.data || response || []
        console.log('📋 Processed roles data:', rolesData)
        
        setRoles(rolesData.length > 0 ? rolesData : defaultRoles)
      } catch (apiError) {
        console.warn('⚠️ Roles API not available, using default roles:', apiError.message)
        
        // Use default roles based on our system
        setRoles(defaultRoles)
      }
      
    } catch (err) {
      console.error('❌ Error in fetchRoles:', err)
      setError(err.message || 'Failed to fetch roles')
      setRoles(defaultRoles) // Fallback to default roles
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const refetch = () => {
    fetchRoles()
  }

  const addRole = async (roleData) => {
    try {
      console.log('➕ Adding role:', roleData.name)
      
      // Create new role with generated ID
      const newRole = {
        id: `role-${Date.now()}`,
        ...roleData,
        usersCount: 0,
        permissionsCount: roleData.permissions?.length || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      try {
        // Try API first
        const response = await api.addRole?.(newRole)
        await fetchRoles() // Refresh the list
        toast.success('تم إضافة الدور بنجاح!')
        return response
      } catch (apiError) {
        // Fallback to local state
        setRoles(prev => [...prev, newRole])
        toast.success('تم إضافة الدور بنجاح!')
        return newRole
      }
    } catch (err) {
      console.error('❌ Error adding role:', err)
      toast.error('فشل في إضافة الدور')
      throw err
    }
  }

  const updateRole = async (id, roleData) => {
    try {
      console.log('🔄 Updating role:', id)
      
      const updatedRole = {
        ...roleData,
        permissionsCount: roleData.permissions?.length || 0,
        updatedAt: new Date()
      }

      try {
        // Try API first
        const response = await api.updateRole?.(id, updatedRole)
        await fetchRoles() // Refresh the list
        toast.success('تم تحديث الدور بنجاح!')
        return response
      } catch (apiError) {
        // Fallback to local state
        setRoles(prev => prev.map(role => 
          role.id === id ? { ...role, ...updatedRole } : role
        ))
        toast.success('تم تحديث الدور بنجاح!')
        return updatedRole
      }
    } catch (err) {
      console.error('❌ Error updating role:', err)
      toast.error('فشل في تحديث الدور')
      throw err
    }
  }

  const deleteRole = async (id) => {
    try {
      console.log('🗑️ Deleting role:', id)
      
      // Check if role has users
      const role = roles.find(r => r.id === id)
      if (role?.usersCount > 0) {
        toast.error('لا يمكن حذف دور يحتوي على مستخدمين')
        return
      }

      try {
        // Try API first
        const response = await api.deleteRole?.(id)
        await fetchRoles() // Refresh the list
        toast.success('تم حذف الدور بنجاح!')
        return response
      } catch (apiError) {
        // Fallback to local state
        setRoles(prev => prev.filter(role => role.id !== id))
        toast.success('تم حذف الدور بنجاح!')
        return true
      }
    } catch (err) {
      console.error('❌ Error deleting role:', err)
      toast.error('فشل في حذف الدور')
      throw err
    }
  }

  const toggleRoleStatus = async (id) => {
    try {
      const role = roles.find(r => r.id === id)
      if (!role) return

      const newStatus = role.status === 'active' ? 'inactive' : 'active'
      await updateRole(id, { ...role, status: newStatus })
    } catch (err) {
      console.error('❌ Error toggling role status:', err)
      throw err
    }
  }

  // Get available permissions
  const getAvailablePermissions = () => {
    return Object.entries(PERMISSIONS).map(([key, value]) => ({
      key,
      value,
      label: getPermissionLabel(value)
    }))
  }

  // Get permission label in Arabic
  const getPermissionLabel = (permission) => {
    const labels = {
      // إدارة النظام
      'manage_system': 'إدارة النظام',
      'manage_settings': 'إدارة الإعدادات',
      
      // إدارة المستخدمين
      'manage_users': 'إدارة المستخدمين',
      'view_users': 'عرض المستخدمين',
      'create_users': 'إضافة المستخدمين',
      'edit_users': 'تعديل المستخدمين',
      'delete_users': 'حذف المستخدمين',
      
      // إدارة الأدوار
      'manage_roles': 'إدارة الأدوار',
      'view_roles': 'عرض الأدوار',
      
      // إدارة العملاء
      'manage_clients': 'إدارة العملاء',
      'view_clients': 'عرض العملاء',
      'create_clients': 'إضافة العملاء',
      'edit_clients': 'تعديل العملاء',
      'delete_clients': 'حذف العملاء',
      'view_all_clients': 'عرض جميع العملاء',
      
      // إدارة العملاء المحتملين
      'manage_leads': 'إدارة العملاء المحتملين',
      'view_leads': 'عرض العملاء المحتملين',
      'create_leads': 'إضافة العملاء المحتملين',
      'edit_leads': 'تعديل العملاء المحتملين',
      'delete_leads': 'حذف العملاء المحتملين',
      'view_all_leads': 'عرض جميع العملاء المحتملين',
      'convert_leads': 'تحويل العملاء المحتملين',
      'import_leads': 'استيراد العملاء المحتملين',
      
      // التقارير والإحصائيات
      'view_reports': 'عرض التقارير',
      'view_analytics': 'عرض الإحصائيات',
      'generate_reports': 'إنشاء التقارير',
      'export_data': 'تصدير البيانات',
      
      // صفحات خاصة
      'view_dashboard': 'عرض لوحة التحكم',
      'view_calculator': 'عرض الحاسبة',
      'manage_archive': 'إدارة الأرشيف'
    }
    
    return labels[permission] || permission
  }

  return {
    roles,
    loading,
    error,
    refetch,
    addRole,
    updateRole,
    deleteRole,
    toggleRoleStatus,
    getAvailablePermissions,
    getPermissionLabel,
    // Export constants for easy access
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS
  }
}

export { useRoles }
export default useRoles
