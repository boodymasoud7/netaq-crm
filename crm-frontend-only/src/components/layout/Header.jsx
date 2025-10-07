import { useState } from 'react'
import { Search, Settings, LogOut, Menu, User, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
import { ROLE_DESCRIPTIONS } from '../../lib/roles'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import NotificationCenter from '../notifications/NotificationCenter'

export default function Header({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, userProfile } = useAuth()
  const { userRole } = usePermissions()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const roleInfo = ROLE_DESCRIPTIONS[userRole] || { name: 'غير محدد', color: 'gray' }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error)
    }
  }

  return (
    <header className="bizmax-header sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between w-full">
        {/* Left side - Logo and Menu */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">نطاق CRM</h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="البحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Right side - Actions and User */}
        <div className="flex items-center gap-3">
          {/* Role Badge */}
          <Badge 
            variant="outline" 
            className={`hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-medium ${
              roleInfo.color === 'red' ? 'border-red-200 text-red-700 bg-red-50' :
              roleInfo.color === 'blue' ? 'border-blue-200 text-blue-700 bg-blue-50' :
              roleInfo.color === 'green' ? 'border-green-200 text-green-700 bg-green-50' :
              'border-gray-200 text-gray-700 bg-gray-50'
            }`}
          >
            <Shield className="h-3 w-3" />
            {roleInfo.name}
          </Badge>


          {/* Notification Center */}
          <NotificationCenter />

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 px-3"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.displayName || userProfile?.name || user?.displayName || user?.name || user?.email || 'المستخدم'}
                </p>
                <p className="text-xs text-gray-500">
                  {roleInfo.name}
                </p>
              </div>
            </Button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-strong border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile?.displayName || userProfile?.name || user?.displayName || user?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  الملف الشخصي
                </button>
                
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  الإعدادات
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden mt-2 pb-2">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors duration-200"
          />
        </div>
      </div>
    </header>
  )
}