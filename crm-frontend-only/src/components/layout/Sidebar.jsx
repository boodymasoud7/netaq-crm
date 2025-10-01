import { NavLink, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Building2, 
  ShoppingCart, 
  UserCog,
  Calculator,
  FileText,
  BarChart3,
  Settings,
  Archive,
  CheckSquare,
  Bell,
  Home,
  Building,
  Shield,
  Sparkles,
  Database,
  Activity
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../lib/roles'
import { cn } from '../../lib/utils'

const menuItems = [
  {
    category: 'الرئيسية',
    items: [
      { 
        name: 'لوحة التحكم', 
        path: '/dashboard', 
        icon: LayoutDashboard, 
        permission: 'view_dashboard',
        color: 'text-blue-600'
      },
      { 
        name: '📊 لوحة المدير', 
        path: '/manager-dashboard', 
        icon: LayoutDashboard, 
        permission: 'ADMIN_ONLY',
        color: 'text-purple-600'
      },
    ]
  },
  {
    category: 'إدارة العملاء',
    items: [
      { 
        name: 'العملاء', 
        path: '/clients', 
        icon: Users, 
        permission: 'view_clients',
        color: 'text-green-600'
      },
      { 
        name: 'العملاء المحتملين', 
        path: '/leads', 
        icon: UserPlus, 
        permission: 'view_leads',
        color: 'text-orange-600'
      },
    ]
  },
  {
    category: 'المشاريع والمبيعات',
    items: [
      { 
        name: 'المطورين', 
        path: '/developers', 
        icon: Building, 
        permission: 'view_developers',
        color: 'text-yellow-600'
      },
      { 
        name: 'المشاريع', 
        path: '/projects', 
        icon: Building2, 
        permission: 'view_projects',
        color: 'text-purple-600'
      },
      { 
        name: 'الوحدات', 
        path: '/units', 
        icon: Home, 
        permission: 'view_units',
        color: 'text-pink-600'
      },
      { 
        name: 'المبيعات', 
        path: '/sales', 
        icon: ShoppingCart, 
        permission: 'view_sales',
        color: 'text-emerald-600'
      },
    ]
  },
  {
    category: 'المهام والأنشطة',
    items: [
      { 
        name: 'المهام', 
        path: '/tasks', 
        icon: CheckSquare, 
        permission: 'view_tasks',
        color: 'text-teal-600'
      },
      { 
        name: 'التذكيرات', 
        path: '/reminders', 
        icon: Bell, 
        permission: 'view_reminders',
        color: 'text-orange-600'
      },
    ]
  },
  {
    category: 'الإدارة',
    items: [
      { 
        name: 'إدارة المستخدمين', 
        path: '/user-management', 
        icon: UserCog, 
        permission: 'view_users', // صلاحية ديناميكية
        color: 'text-red-600'
      },
      { 
        name: 'إدارة الأدوار', 
        path: '/roles', 
        icon: Shield, 
        permission: 'view_roles', // صلاحية ديناميكية
        color: 'text-purple-600'
      },
      // REMOVED: تذكيرات الفريق - unused page
      { 
        name: 'الأرشيف', 
        path: '/archive', 
        icon: Archive, 
        permission: 'manage_archive',
        color: 'text-gray-600'
      },
      { 
        name: 'النسخ الاحتياطي', 
        path: '/backup-management', 
        icon: Database, 
        permission: 'manage_backups',
        color: 'text-blue-600'
      },
      // REMOVED: سجل العمليات - unused page
    ]
  },
  {
    category: 'أدوات',
    items: [

      { 
        name: 'الإضافات والمميزات', 
        path: '/features', 
        icon: Sparkles, 
        permission: 'view_features',
        color: 'text-yellow-600'
      },
      // REMOVED: إعدادات التنبيهات - unused page
      // REMOVED: أتمتة المتابعات - removed as requested by user
    ]
  },
  {
    category: 'النظام',
    items: [
      { 
        name: 'الإعدادات', 
        path: '/settings', 
        icon: Settings, 
        permission: 'manage_settings',
        color: 'text-gray-600'
      },
    ]
  }
]

export default function Sidebar({ isOpen, onClose }) {
  const { checkPermission, isAdmin } = usePermissions()
  const location = useLocation()

  const isActiveLink = (path) => {
    return location.pathname === path
  }

  // فحص الصلاحيات مع معالجة خاصة لـ ADMIN_ONLY
  const hasItemPermission = (permission) => {
    if (permission === 'ADMIN_ONLY') {
      return isAdmin() // مدير النظام فقط
    }
    return checkPermission(permission)
  }

  const filteredMenuItems = menuItems.map(category => ({
    ...category,
    items: category.items.filter(item => hasItemPermission(item.permission))
  })).filter(category => category.items.length > 0)

  return (
    <>
      {/* Mobile Overlay - يظهر فقط على الموبايل عند فتح القائمة */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          // للموبايل: fixed من اليمين مع انتقال
          "fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-50 w-64 shadow-xl transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">نطاق CRM</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-6">
            {filteredMenuItems.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    const isActive = isActiveLink(item.path)
                    
                    return (
                      <NavLink
                        key={itemIndex}
                        to={item.path}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon 
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-blue-600" : item.color
                          )} 
                        />
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-auto"></div>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:border-l lg:border-gray-200",
        isOpen ? "lg:flex" : "lg:hidden"
      )}>
        {/* Desktop Content */}
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-6">
            {filteredMenuItems.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    const isActive = isActiveLink(item.path)
                    
                    return (
                      <NavLink
                        key={itemIndex}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon 
                          className={cn(
                            "h-5 w-5 flex-shrink-0",
                            isActive ? "text-blue-600" : item.color
                          )} 
                        />
                        <span className="truncate">{item.name}</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-auto"></div>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Desktop Footer */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 text-white text-center">
            <p className="text-sm font-medium">نطاق CRM</p>
            <p className="text-xs opacity-90">نظام إدارة العقارات</p>
          </div>
        </div>
      </aside>
    </>
  )
}