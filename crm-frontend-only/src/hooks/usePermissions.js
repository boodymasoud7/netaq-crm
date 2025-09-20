import { useAuth } from '../contexts/AuthContext'
import rolesService from '../services/rolesService'
import { useState, useEffect } from 'react'
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions, 
  getRolePermissions,
  canAccessPage,
  filterDataByRole,
  ROLES,
  PERMISSIONS
} from '../lib/roles'

export function usePermissions() {
  const { user, userProfile } = useAuth()
  const [dynamicPermissions, setDynamicPermissions] = useState({})
  
  const userRole = userProfile?.role || ROLES.EMPLOYEE
  // Try multiple sources for user ID to ensure compatibility
  const userId = userProfile?.id || user?.id || user?.uid || user?.email
  const userName = userProfile?.name || user?.name || user?.displayName

  // تحميل الصلاحيات الديناميكية
  useEffect(() => {
    const loadDynamicPermissions = async () => {
      if (userRole) {
        try {
          const permissions = await rolesService.getRolePermissions(userRole)
          setDynamicPermissions(prev => ({
            ...prev,
            [userRole]: permissions
          }))
        } catch (error) {
          console.error('خطأ في تحميل الصلاحيات الديناميكية:', error)
        }
      }
    }

    loadDynamicPermissions()
  }, [userRole])
  
  // التحقق من صلاحية واحدة (مع الدعم الديناميكي)
  const checkPermission = (permission) => {
    // إذا كان مدير النظام، فله جميع الصلاحيات
    if (userRole === ROLES.ADMIN) return true
    
    // استخدام الصلاحيات الديناميكية إذا كانت متاحة
    if (dynamicPermissions[userRole]) {
      return dynamicPermissions[userRole].includes(permission)
    }
    
    // العودة للطريقة التقليدية كـ fallback
    return hasPermission(userRole, permission)
  }
  
  // التحقق من صلاحيات متعددة (أي منها)
  const checkAnyPermission = (permissions) => {
    return hasAnyPermission(userRole, permissions)
  }
  
  // التحقق من جميع الصلاحيات
  const checkAllPermissions = (permissions) => {
    return hasAllPermissions(userRole, permissions)
  }
  
  // الحصول على جميع صلاحيات المستخدم
  const getUserPermissions = () => {
    return getRolePermissions(userRole)
  }
  
  // التحقق من إمكانية الوصول للصفحة
  const checkPageAccess = (page) => {
    return canAccessPage(userRole, page)
  }
  
  // فلترة البيانات بناءً على الدور
  const filterByRole = (data, dataType = 'general') => {
    return filterDataByRole(userRole, userId, data, dataType, userName)
  }
  
  // التحقق من الأدوار
  const isAdmin = () => userRole === ROLES.ADMIN
  const isSalesManager = () => userRole === ROLES.SALES_MANAGER
  const isSales = () => userRole === ROLES.SALES
  const isEmployee = () => userRole === ROLES.EMPLOYEE
  
  // التحقق من إمكانية تعديل البيانات (مع النظام الديناميكي)
  const canEdit = (item) => {
    if (isAdmin()) return true
    
    // فحص الصلاحيات الديناميكية لمدير المبيعات
    if (isSalesManager()) {
      const hasEditPermission = checkPermission(PERMISSIONS.EDIT_CLIENTS)
      return hasEditPermission
    }
    
    if (isSales()) {
      return item.assignedTo === userId || 
             item.createdBy === userId || 
             item.agentId === userId ||
             item.userId === userId
    }
    return false
  }
  
  // التحقق من إمكانية حذف البيانات (مع النظام الديناميكي)
  const canDelete = (item) => {
    if (isAdmin()) return true
    
    // فحص الصلاحيات الديناميكية
    if (isSalesManager()) {
      // التحقق من صلاحية حذف العملاء للمدير
      const hasDeletePermission = checkPermission(PERMISSIONS.DELETE_CLIENTS)
      return hasDeletePermission
    }
    
    if (isSales()) {
      return item.createdBy === userId
    }
    return false
  }
  
  // التحقق من إمكانية عرض البيانات الحساسة
  const canViewSensitiveData = () => {
    return isAdmin() || isSalesManager()
  }
  
  // التحقق من إمكانية إدارة المستخدمين - مدير النظام فقط
  const canManageUsers = () => {
    return isAdmin() // مدير النظام فقط يستطيع إدارة المستخدمين والأدوار
  }
  
  // التحقق من إمكانية عرض التقارير المتقدمة
  const canViewAdvancedReports = () => {
    return checkPermission(PERMISSIONS.GENERATE_REPORTS)
  }
  
  // التحقق من إمكانية تصدير البيانات
  const canExportData = () => {
    return checkPermission(PERMISSIONS.EXPORT_DATA)
  }
  
  return {
    // معلومات المستخدم والدور
    userRole,
    userId,
    userName,
    
    // فحص الصلاحيات
    hasPermission: checkPermission, // إضافة hasPermission كـ alias
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    getUserPermissions,
    checkPageAccess,
    
    // فلترة البيانات
    filterByRole,
    
    // فحص الأدوار
    isAdmin,
    isSalesManager,
    isSales,
    isEmployee,
    
    // فحص إمكانيات محددة
    canEdit,
    canDelete,
    canViewSensitiveData,
    canManageUsers,
    canViewAdvancedReports,
    canExportData,
    
    // الثوابت
    ROLES,
    PERMISSIONS
  }
}

export default usePermissions
