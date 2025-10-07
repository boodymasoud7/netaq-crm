import { useState, useEffect } from 'react'
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  Menu, 
  User, 
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import NotificationCenter from '../notifications/NotificationCenter'
import { useNavigate } from 'react-router-dom'

export default function ModernHeader({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout, userProfile } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error)
    }
  }


  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b border-gray-200/50 shadow-sm">
      <div className="flex items-center justify-between w-full px-6 py-3">
        {/* Left Section - Logo + Mobile Toggle + Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Logo */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Safqa Pro CRM
              </h1>
            </div>
          </div>
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden hover:bg-gray-100 rounded-xl p-2 flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Extended Search Section */}
          <div className="flex-1 max-w-2xl">
            {/* Enhanced Search */}
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="البحث الذكي... (Ctrl + K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className="w-full bg-gray-50/70 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:bg-gray-50"
              />
              
              {/* Search Suggestions */}
              {showSearch && searchQuery && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700">نتائج البحث</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {/* Search results would go here */}
                    <div className="p-3 text-sm text-gray-500 text-center">
                      ابدأ الكتابة للبحث...
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {/* Time & Date - Desktop Only */}
          <div className="hidden xl:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {currentTime.toLocaleTimeString('ar-EG', { 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: 'Africa/Cairo'
              })}
            </p>
            <p className="text-xs text-gray-500">
              {currentTime.toLocaleDateString('ar-EG', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                timeZone: 'Africa/Cairo'
              })}
            </p>
          </div>


          {/* Notification Center */}
          <div className="relative">
            <NotificationCenter />
          </div>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title="الإعدادات"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.displayName || userProfile?.name || user?.displayName || user?.name || user?.email || 'المستخدم'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </Button>

            {/* Enhanced User Dropdown */}
            {showUserMenu && (
              <div className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {userProfile?.displayName || userProfile?.name || user?.displayName || user?.name || user?.email}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/profile')
                    }}
                    className="w-full px-4 py-3 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <User className="h-4 w-4 text-blue-600" />
                    <span>الملف الشخصي</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/settings')
                    }}
                    className="w-full px-4 py-3 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span>الإعدادات</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/features')
                    }}
                    className="w-full px-4 py-3 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>الميزات والإضافات</span>
                  </button>
                  
                  <hr className="my-2" />
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="w-full px-4 py-3 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Global Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      )}
    </header>
  )
}
