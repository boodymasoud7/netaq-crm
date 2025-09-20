import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  Activity,
  ChevronRight,
  ChevronDown,
  Zap,
  TrendingUp,
  Star,
  Award,
  Target,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { PERMISSIONS } from '../../lib/roles'
import { cn } from '../../lib/utils'

const menuItems = [
  {
    category: 'الرئيسية',
    icon: Home,
    items: [
      { 
        name: 'لوحة التحكم', 
        path: '/dashboard', 
        icon: LayoutDashboard, 
        permission: 'view_dashboard',
        gradient: 'from-blue-500 to-blue-600',
        description: 'نظرة عامة على النظام'
      },
      { 
        name: 'لوحة المدير', 
        path: '/manager-dashboard', 
        icon: Award, 
        permission: 'ADMIN_ONLY',
        gradient: 'from-purple-500 to-purple-600',
        description: 'إحصائيات متقدمة للإدارة'
      },
    ]
  },
  {
    category: 'إدارة العملاء',
    icon: Users,
    items: [
      { 
        name: 'العملاء', 
        path: '/clients', 
        icon: Users, 
        permission: 'view_clients',
        gradient: 'from-green-500 to-green-600',
        description: 'قاعدة بيانات العملاء'
      },
      { 
        name: 'العملاء المحتملين', 
        path: '/leads', 
        icon: UserPlus, 
        permission: 'view_leads',
        gradient: 'from-orange-500 to-orange-600',
        description: 'فرص البيع المستقبلية'
      },
    ]
  },
  {
    category: 'المشاريع والمبيعات',
    icon: Building2,
    items: [
      { 
        name: 'المطورين', 
        path: '/developers', 
        icon: Building, 
        permission: 'view_developers',
        gradient: 'from-yellow-500 to-yellow-600',
        description: 'شركات التطوير العقاري'
      },
      { 
        name: 'المشاريع', 
        path: '/projects', 
        icon: Building2, 
        permission: 'view_projects',
        gradient: 'from-purple-500 to-purple-600',
        description: 'المشاريع العقارية'
      },
      { 
        name: 'الوحدات', 
        path: '/units', 
        icon: Home, 
        permission: 'view_units',
        gradient: 'from-pink-500 to-pink-600',
        description: 'الوحدات السكنية والتجارية'
      },
      { 
        name: 'المبيعات', 
        path: '/sales', 
        icon: ShoppingCart, 
        permission: 'view_sales',
        gradient: 'from-emerald-500 to-emerald-600',
        description: 'عمليات البيع والعمولات'
      },
    ]
  },
  {
    category: 'المهام والأنشطة',
    icon: CheckSquare,
    items: [
      { 
        name: 'المهام', 
        path: '/tasks', 
        icon: CheckSquare, 
        permission: 'view_tasks',
        gradient: 'from-teal-500 to-teal-600',
        description: 'إدارة المهام اليومية'
      },
      { 
        name: 'التذكيرات', 
        path: '/reminders', 
        icon: Bell, 
        permission: 'view_reminders',
        gradient: 'from-orange-500 to-red-500',
        description: 'مواعيد ومتابعات مهمة'
      },
      { 
        name: 'المتابعات', 
        path: '/follow-ups', 
        icon: Target, 
        permission: 'view_clients',
        gradient: 'from-purple-500 to-pink-500',
        description: 'متابعة العملاء والصفقات'
      },
    ]
  },
  {
    category: 'الإدارة',
    icon: Shield,
    items: [
      { 
        name: 'إدارة المستخدمين', 
        path: '/user-management', 
        icon: UserCog, 
        permission: 'view_users',
        gradient: 'from-red-500 to-red-600',
        description: 'إدارة حسابات المستخدمين'
      },
      { 
        name: 'إدارة الأدوار', 
        path: '/roles', 
        icon: Shield, 
        permission: 'view_roles',
        gradient: 'from-purple-500 to-purple-600',
        description: 'صلاحيات وأدوار النظام'
      },
      { 
        name: 'الأرشيف', 
        path: '/archive', 
        icon: Archive, 
        permission: 'manage_archive',
        gradient: 'from-gray-500 to-gray-600',
        description: 'البيانات المؤرشفة'
      },
      { 
        name: 'النسخ الاحتياطي', 
        path: '/backup-management', 
        icon: Database, 
        permission: 'manage_backups',
        gradient: 'from-blue-500 to-blue-600',
        description: 'حماية وأمان البيانات'
      },
    ]
  },
  {
    category: 'أدوات',
    icon: Sparkles,
    items: [
      { 
        name: 'الميزات والإضافات', 
        path: '/features', 
        icon: Sparkles, 
        permission: 'view_features',
        gradient: 'from-yellow-500 to-yellow-600',
        description: 'أدوات وميزات متقدمة'
      },
      // REMOVED: أتمتة المتابعات - removed as requested by user
    ]
  },
  {
    category: 'النظام',
    icon: Settings,
    items: [
      { 
        name: 'الإعدادات', 
        path: '/settings', 
        icon: Settings, 
        permission: 'manage_settings',
        gradient: 'from-gray-500 to-gray-600',
        description: 'إعدادات النظام العامة'
      },
    ]
  }
]

export default function ModernSidebar({ isOpen, onClose }) {
  const { checkPermission, isAdmin } = usePermissions()
  const { userProfile } = useAuth()
  const location = useLocation()
  const [expandedCategories, setExpandedCategories] = useState([])
  const [hoveredItem, setHoveredItem] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const isActiveLink = (path) => {
    return location.pathname === path
  }

  // Auto-expand category containing active link
  useEffect(() => {
    menuItems.forEach(category => {
      if (category.items.some(item => isActiveLink(item.path))) {
        setExpandedCategories(prev => 
          prev.includes(category.category) ? prev : [...prev, category.category]
        )
      }
    })
  }, [location.pathname])

  // Initialize all categories as expanded
  useEffect(() => {
    setExpandedCategories(menuItems.map(category => category.category))
  }, [])

  // Auto-expand all categories in both modes
  useEffect(() => {
    setExpandedCategories(menuItems.map(category => category.category))
  }, [isCollapsed])

  const hasItemPermission = (permission) => {
    if (permission === 'ADMIN_ONLY') {
      return isAdmin()
    }
    return checkPermission(permission)
  }


  const filteredMenuItems = menuItems.map(category => ({
    ...category,
    items: category.items.filter(item => hasItemPermission(item.permission))
  })).filter(category => category.items.length > 0)

  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Safqa Pro CRM
                </h2>
              </div>
            )}
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      </div>

      {/* Navigation */}
      <div className={cn(
        "flex-1 overflow-y-auto transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <nav className={cn(
          "space-y-2",
          isCollapsed ? "space-y-1" : "space-y-2"
        )}>
          {filteredMenuItems.map((category, categoryIndex) => {
            const CategoryIcon = category.icon
            const isExpanded = expandedCategories.includes(category.category)
            
            return (
              <div key={categoryIndex} className={cn(
                isCollapsed ? "mb-2" : "mb-6"
              )}>
                {/* Category Header - Non-clickable when expanded */}
                {!isCollapsed && (
                  <div className="flex items-center justify-between p-3 text-sm font-semibold text-gray-600">
                    <div className="flex items-center gap-3">
                      <CategoryIcon className="h-5 w-5 text-gray-500" />
                      <span>{category.category}</span>
                    </div>
                  </div>
                )}

                {/* Category Items - Show in collapsed mode as icons only */}
                {isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {category.items.map((item, itemIndex) => {
                      const Icon = item.icon
                      const isActive = isActiveLink(item.path)
                      
                      return (
                        <NavLink
                          key={itemIndex}
                          to={item.path}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-center p-2 rounded-lg transition-all duration-200 group relative",
                            isActive 
                              ? "bg-blue-100 text-blue-700 shadow-sm" 
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          )}
                          title={item.name}
                        >
                          <Icon className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
                          )} />
                        </NavLink>
                      )
                    })}
                  </div>
                )}

                {/* Category Items - Normal expanded mode */}
                {isExpanded && !isCollapsed && (
                  <div className="mt-2 space-y-1 pr-6">
                    {category.items.map((item, itemIndex) => {
                      const Icon = item.icon
                      const isActive = isActiveLink(item.path)
                      
                      return (
                        <NavLink
                          key={itemIndex}
                          to={item.path}
                          onClick={onClose}
                          onMouseEnter={() => setHoveredItem(`${categoryIndex}-${itemIndex}`)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "group relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                            isActive
                              ? "bg-gradient-to-r text-white shadow-lg scale-[1.02]"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                          )}
                          style={isActive ? {
                            backgroundImage: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
                            '--tw-gradient-from': `rgb(${item.gradient.includes('blue') ? '59 130 246' : 
                                                       item.gradient.includes('green') ? '34 197 94' :
                                                       item.gradient.includes('purple') ? '147 51 234' :
                                                       item.gradient.includes('orange') ? '249 115 22' :
                                                       item.gradient.includes('red') ? '239 68 68' :
                                                       item.gradient.includes('yellow') ? '234 179 8' :
                                                       item.gradient.includes('pink') ? '236 72 153' :
                                                       item.gradient.includes('emerald') ? '16 185 129' :
                                                       item.gradient.includes('teal') ? '20 184 166' :
                                                       '107 114 128'})`,
                            '--tw-gradient-to': `rgb(${item.gradient.includes('blue') ? '37 99 235' : 
                                                     item.gradient.includes('green') ? '22 163 74' :
                                                     item.gradient.includes('purple') ? '126 34 206' :
                                                     item.gradient.includes('orange') ? '234 88 12' :
                                                     item.gradient.includes('red') ? '220 38 38' :
                                                     item.gradient.includes('yellow') ? '202 138 4' :
                                                     item.gradient.includes('pink') ? '219 39 119' :
                                                     item.gradient.includes('emerald') ? '5 150 105' :
                                                     item.gradient.includes('teal') ? '13 148 136' :
                                                     '75 85 99'})`
                          } : {}}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg"></div>
                          )}
                          
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                            isActive 
                              ? "bg-white/20" 
                              : "bg-gray-100 group-hover:bg-gray-200"
                          )}>
                            <Icon 
                              className={cn(
                                "h-4 w-4 transition-all duration-200",
                                isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
                              )} 
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <span className="truncate block">{item.name}</span>
                            {hoveredItem === `${categoryIndex}-${itemIndex}` && !isActive && (
                              <span className="text-xs text-gray-500 truncate block">
                                {item.description}
                              </span>
                            )}
                          </div>

                          {/* Hover effect */}
                          {!isActive && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          )}

                          {/* Active glow effect */}
                          {isActive && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent pointer-events-none"></div>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className={cn(
        "border-t border-gray-200/50 mt-auto transition-all duration-300",
        isCollapsed ? "p-2" : "p-4"
      )}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Star className="h-4 w-4 text-white fill-current" />
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <p className="font-semibold">Safqa Pro CRM</p>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
                <Star className="h-3 w-3 fill-current" />
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 right-0 h-full bg-white z-50 w-80 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex lg:flex-col lg:bg-white lg:border-l lg:border-gray-200 lg:shadow-sm transition-all duration-300 relative",
        isCollapsed ? "lg:w-20" : "lg:w-80"
      )}>
        {sidebarContent}
        
        {/* Floating Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -left-3 top-20 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-200 shadow-md z-50"
          title={isCollapsed ? "توسيع الشريط الجانبي" : "طي الشريط الجانبي"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3 text-gray-600" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-gray-600" />
          )}
        </button>
      </aside>
    </>
  )
}
