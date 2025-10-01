// تعريف الأدوار والصلاحيات في النظام

// الأدوار المتاحة
export const ROLES = {
  ADMIN: 'admin',
  SALES_MANAGER: 'sales_manager', 
  SALES: 'sales',
  SALES_AGENT: 'sales_agent',
  EMPLOYEE: 'employee'
}

// الصلاحيات المتاحة
export const PERMISSIONS = {
  // إدارة النظام
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_SETTINGS: 'manage_settings',
  
  // إدارة المستخدمين
  MANAGE_USERS: 'manage_users',
  VIEW_USERS: 'view_users',
  CREATE_USERS: 'create_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  
  // إدارة الأدوار
  MANAGE_ROLES: 'manage_roles',
  
  // إدارة العملاء
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_CLIENTS: 'view_clients',
  CREATE_CLIENTS: 'create_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',
  VIEW_ALL_CLIENTS: 'view_all_clients',
  
  // إدارة العملاء المحتملين
  MANAGE_LEADS: 'manage_leads',
  VIEW_LEADS: 'view_leads',
  CREATE_LEADS: 'create_leads',
  EDIT_LEADS: 'edit_leads',
  DELETE_LEADS: 'delete_leads',
  VIEW_ALL_LEADS: 'view_all_leads',
  CONVERT_LEADS: 'convert_leads',
  IMPORT_LEADS: 'import_leads',
  
  // إدارة المشاريع
  MANAGE_PROJECTS: 'manage_projects',
  VIEW_PROJECTS: 'view_projects',
  CREATE_PROJECTS: 'create_projects',
  EDIT_PROJECTS: 'edit_projects',
  DELETE_PROJECTS: 'delete_projects',
  
  // إدارة المبيعات
  MANAGE_SALES: 'manage_sales',
  VIEW_SALES: 'view_sales',
  CREATE_SALES: 'create_sales',
  EDIT_SALES: 'edit_sales',
  DELETE_SALES: 'delete_sales',
  VIEW_ALL_SALES: 'view_all_sales',
  
  // إدارة المتابعات
  MANAGE_FOLLOW_UPS: 'manage_follow_ups',
  VIEW_FOLLOW_UPS: 'view_follow_ups',
  CREATE_FOLLOW_UPS: 'create_follow_ups',
  EDIT_FOLLOW_UPS: 'edit_follow_ups',
  DELETE_FOLLOW_UPS: 'delete_follow_ups',
  COMPLETE_FOLLOW_UPS: 'complete_follow_ups',
  
  // إدارة المطورين
  MANAGE_DEVELOPERS: 'manage_developers',
  VIEW_DEVELOPERS: 'view_developers',
  CREATE_DEVELOPERS: 'create_developers',
  EDIT_DEVELOPERS: 'edit_developers',
  DELETE_DEVELOPERS: 'delete_developers',
  
  // إدارة الوحدات
  MANAGE_UNITS: 'manage_units',
  VIEW_UNITS: 'view_units',
  CREATE_UNITS: 'create_units',
  EDIT_UNITS: 'edit_units',
  DELETE_UNITS: 'delete_units',
  
  // التقارير والإحصائيات
  VIEW_REPORTS: 'view_reports',
  VIEW_ANALYTICS: 'view_analytics',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_DATA: 'export_data',
  
  // الإجراءات الخاصة
  ADD_NOTES: 'add_notes',
  ADD_TASKS: 'add_tasks',
  ADD_REMINDERS: 'add_reminders',
  VIEW_NOTES: 'view_notes',
  VIEW_TASKS: 'view_tasks',
  MANAGE_TASKS: 'manage_tasks',
  EDIT_OWN_TASKS: 'edit_own_tasks',
  VIEW_REMINDERS: 'view_reminders',
  
  // صفحات خاصة
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_CALCULATOR: 'view_calculator',
  MANAGE_ARCHIVE: 'manage_archive',
  
  // صلاحيات القائمة الجانبية
  VIEW_ROLES: 'view_roles',
  VIEW_TEAM_REMINDERS: 'view_team_reminders',
  VIEW_NOTIFICATION_SETTINGS: 'view_notification_settings',
  VIEW_FEATURES: 'view_features'
}

// مجموعة الصلاحيات لكل دور
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // المدير له جميع الصلاحيات
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.SALES_MANAGER]: [
    // لوحة التحكم والإحصائيات
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    
    // إدارة العملاء
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    
    // إدارة العملاء المحتملين
    PERMISSIONS.MANAGE_LEADS,
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.DELETE_LEADS,
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.CONVERT_LEADS,
    PERMISSIONS.IMPORT_LEADS,
    
    // إدارة المشاريع
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CREATE_PROJECTS,
    PERMISSIONS.EDIT_PROJECTS,
    PERMISSIONS.DELETE_PROJECTS,
    
    // إدارة المبيعات
    PERMISSIONS.MANAGE_SALES,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.EDIT_SALES,
    PERMISSIONS.DELETE_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    
    // إدارة المتابعات
    PERMISSIONS.MANAGE_FOLLOW_UPS,
    PERMISSIONS.VIEW_FOLLOW_UPS,
    PERMISSIONS.CREATE_FOLLOW_UPS,
    PERMISSIONS.EDIT_FOLLOW_UPS,
    PERMISSIONS.DELETE_FOLLOW_UPS,
    PERMISSIONS.COMPLETE_FOLLOW_UPS,
    
    // إدارة المطورين والوحدات
    PERMISSIONS.MANAGE_DEVELOPERS,
    PERMISSIONS.VIEW_DEVELOPERS,
    PERMISSIONS.CREATE_DEVELOPERS,
    PERMISSIONS.EDIT_DEVELOPERS,
    PERMISSIONS.DELETE_DEVELOPERS,
    PERMISSIONS.MANAGE_UNITS,
    PERMISSIONS.VIEW_UNITS,
    PERMISSIONS.CREATE_UNITS,
    PERMISSIONS.EDIT_UNITS,
    PERMISSIONS.DELETE_UNITS,
    
    // الإجراءات
    PERMISSIONS.ADD_NOTES,
    PERMISSIONS.ADD_TASKS,
    PERMISSIONS.ADD_REMINDERS,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_REMINDERS,
    
    // صفحات خاصة
    PERMISSIONS.VIEW_CALCULATOR,
    PERMISSIONS.MANAGE_ARCHIVE,
    
    // المستخدمين والأدوار
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.VIEW_ROLES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_TEAM_REMINDERS,
    PERMISSIONS.VIEW_NOTIFICATION_SETTINGS
  ],
  
  [ROLES.SALES_MANAGER]: [
    // لوحة التحكم
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    
    // العملاء (جميع العملاء)
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    
    // العملاء المحتملين (جميع العملاء)
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.DELETE_LEADS,
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.CONVERT_LEADS,
    PERMISSIONS.IMPORT_LEADS,
    
    // المشاريع (عرض فقط)
    PERMISSIONS.VIEW_PROJECTS,
    
    // المبيعات (جميع المبيعات)
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.EDIT_SALES,
    PERMISSIONS.DELETE_SALES,
    PERMISSIONS.VIEW_ALL_SALES,
    
    // المتابعات (جميع المتابعات)
    PERMISSIONS.MANAGE_FOLLOW_UPS,
    PERMISSIONS.VIEW_FOLLOW_UPS,
    PERMISSIONS.CREATE_FOLLOW_UPS,
    PERMISSIONS.EDIT_FOLLOW_UPS,
    PERMISSIONS.DELETE_FOLLOW_UPS,
    PERMISSIONS.COMPLETE_FOLLOW_UPS,
    
    // المطورين والوحدات (عرض فقط)
    PERMISSIONS.VIEW_DEVELOPERS,
    PERMISSIONS.VIEW_UNITS,
    
    // التقارير
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    
    // الإجراءات
    PERMISSIONS.ADD_NOTES,
    PERMISSIONS.ADD_TASKS,
    PERMISSIONS.ADD_REMINDERS,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_REMINDERS,
    PERMISSIONS.VIEW_TEAM_REMINDERS,
    
    // صفحات خاصة
    PERMISSIONS.VIEW_CALCULATOR,
    PERMISSIONS.MANAGE_ARCHIVE,
    PERMISSIONS.VIEW_NOTIFICATION_SETTINGS
  ],
  
  [ROLES.SALES]: [
    // لوحة التحكم
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    
    // العملاء (المخصصين له فقط)
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    
    // العملاء المحتملين (المخصصين له فقط)
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.CONVERT_LEADS,
    
    // المشاريع (عرض فقط)
    PERMISSIONS.VIEW_PROJECTS,
    
    // المبيعات (المخصصة له فقط)
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.EDIT_SALES,
    
    // المطورين والوحدات (عرض فقط)
    PERMISSIONS.VIEW_DEVELOPERS,
    PERMISSIONS.VIEW_UNITS,
    
    // التقارير (محدودة)
    PERMISSIONS.VIEW_REPORTS,
    
    // الإجراءات
    PERMISSIONS.ADD_NOTES,
    PERMISSIONS.ADD_REMINDERS,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
    PERMISSIONS.VIEW_REMINDERS,
    
    // صفحات خاصة
    PERMISSIONS.VIEW_CALCULATOR,
    PERMISSIONS.VIEW_FEATURES,
    PERMISSIONS.VIEW_NOTIFICATION_SETTINGS
  ],
  
  [ROLES.SALES_AGENT]: [
    // لوحة التحكم
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS,
    
    // العملاء (المخصصين له فقط)
    PERMISSIONS.VIEW_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.MANAGE_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    
    // العملاء المحتملين (المخصصين له فقط)
    PERMISSIONS.VIEW_LEADS,
    PERMISSIONS.CREATE_LEADS,
    PERMISSIONS.EDIT_LEADS,
    PERMISSIONS.CONVERT_LEADS,
    
    // المشاريع (عرض فقط)
    PERMISSIONS.VIEW_PROJECTS,
    
    // المبيعات (المخصصة له فقط)
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_SALES,
    PERMISSIONS.EDIT_SALES,
    
    // المطورين والوحدات (عرض فقط)
    PERMISSIONS.VIEW_DEVELOPERS,
    PERMISSIONS.VIEW_UNITS,
    
    // التقارير (محدودة)
    PERMISSIONS.VIEW_REPORTS,
    
    // الإجراءات
    PERMISSIONS.ADD_NOTES,
    PERMISSIONS.ADD_REMINDERS,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.EDIT_OWN_TASKS,
    PERMISSIONS.VIEW_REMINDERS,
    
    // صفحات خاصة
    PERMISSIONS.VIEW_CALCULATOR,
    PERMISSIONS.VIEW_FEATURES,
    PERMISSIONS.VIEW_NOTIFICATION_SETTINGS
  ],
  
  [ROLES.EMPLOYEE]: [
    // لوحة التحكم (محدودة)
    PERMISSIONS.VIEW_DASHBOARD,
    
    // العملاء (عرض فقط)
    PERMISSIONS.VIEW_CLIENTS,
    
    // العملاء المحتملين (عرض فقط)
    PERMISSIONS.VIEW_LEADS,
    
    // المشاريع (عرض فقط)
    PERMISSIONS.VIEW_PROJECTS,
    
    // المبيعات (عرض فقط)
    PERMISSIONS.VIEW_SALES,
    
    // المطورين والوحدات (عرض فقط)
    PERMISSIONS.VIEW_DEVELOPERS,
    PERMISSIONS.VIEW_UNITS,
    
    // الإجراءات (محدودة)
    PERMISSIONS.ADD_NOTES,
    PERMISSIONS.VIEW_NOTES,
    PERMISSIONS.VIEW_TASKS,
    PERMISSIONS.MANAGE_TASKS,
    PERMISSIONS.VIEW_REMINDERS,
    
    // صفحات خاصة
    PERMISSIONS.VIEW_CALCULATOR,
    PERMISSIONS.VIEW_FEATURES,
    PERMISSIONS.VIEW_NOTIFICATION_SETTINGS
  ]
}

// وصف الأدوار باللغة العربية
export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: {
    name: 'مدير النظام',
    description: 'صلاحيات كاملة لإدارة النظام والمستخدمين والبيانات',
    color: 'red'
  },
  [ROLES.SALES_MANAGER]: {
    name: 'مدير المبيعات',
    description: 'إدارة فريق المبيعات والعملاء والمشاريع والتقارير',
    color: 'blue'
  },
  [ROLES.SALES]: {
    name: 'موظف مبيعات',
    description: 'إدارة العملاء المخصصين والعملاء المحتملين والمبيعات',
    color: 'green'
  },
  [ROLES.SALES_AGENT]: {
    name: 'وكيل مبيعات',
    description: 'إدارة العملاء المخصصين والعملاء المحتملين والمبيعات (نفس صلاحيات موظف المبيعات)',
    color: 'teal'
  },
  [ROLES.EMPLOYEE]: {
    name: 'موظف',
    description: 'صلاحيات محدودة للعرض والإجراءات الأساسية',
    color: 'gray'
  }
}

// وصف الصلاحيات باللغة العربية
export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.MANAGE_SYSTEM]: 'إدارة النظام',
  [PERMISSIONS.MANAGE_SETTINGS]: 'إدارة الإعدادات',
  [PERMISSIONS.MANAGE_USERS]: 'إدارة المستخدمين',
  [PERMISSIONS.VIEW_USERS]: 'عرض المستخدمين',
  [PERMISSIONS.CREATE_USERS]: 'إضافة مستخدمين',
  [PERMISSIONS.EDIT_USERS]: 'تعديل المستخدمين',
  [PERMISSIONS.DELETE_USERS]: 'حذف المستخدمين',
  [PERMISSIONS.MANAGE_CLIENTS]: 'إدارة العملاء',
  [PERMISSIONS.VIEW_CLIENTS]: 'عرض العملاء',
  [PERMISSIONS.CREATE_CLIENTS]: 'إضافة عملاء',
  [PERMISSIONS.EDIT_CLIENTS]: 'تعديل العملاء',
  [PERMISSIONS.DELETE_CLIENTS]: 'حذف العملاء',
  [PERMISSIONS.VIEW_ALL_CLIENTS]: 'عرض جميع العملاء',
  [PERMISSIONS.MANAGE_LEADS]: 'إدارة العملاء المحتملين',
  [PERMISSIONS.VIEW_LEADS]: 'عرض العملاء المحتملين',
  [PERMISSIONS.CREATE_LEADS]: 'إضافة عملاء محتملين',
  [PERMISSIONS.EDIT_LEADS]: 'تعديل العملاء المحتملين',
  [PERMISSIONS.DELETE_LEADS]: 'حذف العملاء المحتملين',
  [PERMISSIONS.VIEW_ALL_LEADS]: 'عرض جميع العملاء المحتملين',
  [PERMISSIONS.CONVERT_LEADS]: 'تحويل العملاء المحتملين',
  [PERMISSIONS.MANAGE_PROJECTS]: 'إدارة المشاريع',
  [PERMISSIONS.VIEW_PROJECTS]: 'عرض المشاريع',
  [PERMISSIONS.CREATE_PROJECTS]: 'إضافة مشاريع',
  [PERMISSIONS.EDIT_PROJECTS]: 'تعديل المشاريع',
  [PERMISSIONS.DELETE_PROJECTS]: 'حذف المشاريع',
  [PERMISSIONS.MANAGE_SALES]: 'إدارة المبيعات',
  [PERMISSIONS.VIEW_SALES]: 'عرض المبيعات',
  [PERMISSIONS.CREATE_SALES]: 'إضافة مبيعات',
  [PERMISSIONS.EDIT_SALES]: 'تعديل المبيعات',
  [PERMISSIONS.DELETE_SALES]: 'حذف المبيعات',
  [PERMISSIONS.VIEW_ALL_SALES]: 'عرض جميع المبيعات',
  [PERMISSIONS.VIEW_REPORTS]: 'عرض التقارير',
  [PERMISSIONS.VIEW_ANALYTICS]: 'عرض الإحصائيات',
  [PERMISSIONS.GENERATE_REPORTS]: 'إنشاء التقارير',
  [PERMISSIONS.EXPORT_DATA]: 'تصدير البيانات',
  [PERMISSIONS.ADD_NOTES]: 'إضافة ملاحظات',
  [PERMISSIONS.ADD_TASKS]: 'إضافة مهام',
  [PERMISSIONS.ADD_REMINDERS]: 'إضافة تذكيرات',
  [PERMISSIONS.VIEW_NOTES]: 'عرض الملاحظات',
  [PERMISSIONS.VIEW_TASKS]: 'عرض المهام',
  [PERMISSIONS.MANAGE_TASKS]: 'إدارة المهام',
  [PERMISSIONS.VIEW_REMINDERS]: 'عرض التذكيرات',
  [PERMISSIONS.VIEW_DASHBOARD]: 'عرض لوحة التحكم',
  [PERMISSIONS.VIEW_CALCULATOR]: 'عرض الحاسبة',
  [PERMISSIONS.MANAGE_ARCHIVE]: 'إدارة الأرشيف',
  [PERMISSIONS.VIEW_ROLES]: 'عرض الأدوار والصلاحيات',
  [PERMISSIONS.MANAGE_ROLES]: 'إدارة الأدوار والصلاحيات',
  [PERMISSIONS.VIEW_TEAM_REMINDERS]: 'عرض تذكيرات الفريق',
  [PERMISSIONS.VIEW_NOTIFICATION_SETTINGS]: 'عرض إعدادات التنبيهات'
}

// التحقق من الصلاحيات
export function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false
  
  // المدير له جميع الصلاحيات
  if (userRole === ROLES.ADMIN) return true
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || []
  return rolePermissions.includes(permission)
}

// التحقق من صلاحيات متعددة
export function hasAnyPermission(userRole, permissions) {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false
  return permissions.some(permission => hasPermission(userRole, permission))
}

// التحقق من جميع الصلاحيات
export function hasAllPermissions(userRole, permissions) {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false
  return permissions.every(permission => hasPermission(userRole, permission))
}

// الحصول على جميع صلاحيات الدور
export function getRolePermissions(userRole) {
  return ROLE_PERMISSIONS[userRole] || []
}

// التحقق من إمكانية الوصول للصفحة
export function canAccessPage(userRole, page) {
  const pagePermissions = {
    '/': [PERMISSIONS.VIEW_DASHBOARD],
    '/clients': [PERMISSIONS.VIEW_CLIENTS],
    '/leads': [PERMISSIONS.VIEW_LEADS],
    '/projects': [PERMISSIONS.VIEW_PROJECTS],
    '/sales': [PERMISSIONS.VIEW_SALES],
    '/users': [PERMISSIONS.VIEW_USERS],
    '/developers': [PERMISSIONS.VIEW_DEVELOPERS],
    '/units': [PERMISSIONS.VIEW_UNITS],
    '/reports': [PERMISSIONS.VIEW_REPORTS],
    '/calculator': [PERMISSIONS.VIEW_CALCULATOR],
    '/archive': [PERMISSIONS.MANAGE_ARCHIVE],
    '/tasks': [PERMISSIONS.VIEW_TASKS],
    '/settings': [PERMISSIONS.MANAGE_SETTINGS]
  }
  
  const requiredPermissions = pagePermissions[page]
  if (!requiredPermissions) return true // صفحة غير محمية
  
  return hasAnyPermission(userRole, requiredPermissions)
}

// فلترة البيانات بناءً على الدور
export function filterDataByRole(userRole, userId, data, dataType, userName = null) {
  console.log('🔍 filterDataByRole:', { 
    userRole, 
    userId, 
    dataType, 
    dataCount: data?.length || 0,
    sampleItem: data?.[0]
  })
  
  // المدير ومدير المبيعات يرون جميع البيانات
  if (userRole === ROLES.ADMIN || userRole === ROLES.SALES_MANAGER) {
    console.log('👑 Admin/Manager - showing all data')
    return data
  }
  
  // موظف المبيعات ووكيل المبيعات يرون البيانات المخصصة لهم فقط
  if (userRole === ROLES.SALES || userRole === ROLES.SALES_AGENT) {
    const filtered = data.filter(item => {
      // Convert values to strings for comparison to handle mixed types
      const userIdStr = String(userId)
      
      const isAssigned = String(item.assignedTo) === userIdStr || 
                        String(item.createdBy) === userIdStr ||
                        String(item.agentId) === userIdStr ||
                        String(item.userId) === userIdStr ||
                        // Also check by username for tasks
                        (dataType === 'tasks' && userName && String(item.assignedTo) === userName)
      
      // Debug individual items
      if (data.length < 5) { // Only log for small datasets
        console.log('🔍 Item filter check:', {
          item: item.id || item.name,
          assignedTo: item.assignedTo,
          createdBy: item.createdBy,
          agentId: item.agentId,
          userId: item.userId,
          currentUserId: userId,
          userName,
          userIdStr,
          dataType,
          isAssigned
        })
      }
      
      return isAssigned
    })
    
    console.log(`👤 Sales/Agent - filtered ${data.length} → ${filtered.length} items`)
    return filtered
  }
  
  // الموظف العادي يرى جميع البيانات (للقراءة فقط)
  if (userRole === ROLES.EMPLOYEE) {
    console.log('👷 Employee - showing all data')
    return data
  }
  
  console.log('❌ Unknown role - returning empty array')
  return []
}

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  PERMISSION_DESCRIPTIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRolePermissions,
  canAccessPage,
  filterDataByRole
}
