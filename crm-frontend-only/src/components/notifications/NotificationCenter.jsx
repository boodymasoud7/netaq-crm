import { useState, useRef, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Trash2, RefreshCw } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'
import { useSSENotifications } from '../../hooks/useSSENotifications'
import useUserNotifications from '../../hooks/useUserNotifications'
import { useApi } from '../../hooks/useApi'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('all') // all, unread, read
  const dropdownRef = useRef(null)
  const api = useApi()
  
  const {
    notifications = [], // إضافة قيمة افتراضية
    unreadCount = 0, // إضافة قيمة افتراضية
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  } = useNotifications() || {} // إضافة fallback للـ context

  // إشعارات المديرين عبر SSE الجديد
  const { 
    managerNotifications = [], // إضافة قيمة افتراضية
    unreadCount: unreadManagerCount = 0, // إضافة قيمة افتراضية
    isConnected,
    connectionError,
    markAsRead: markManagerNotificationAsRead,
    removeNotification: removeManagerNotification,
    debugInfo
  } = useSSENotifications() || {} // إضافة fallback
  
  // إشعارات المستخدم المحفوظة
  const {
    notifications: savedNotifications = [], // إضافة قيمة افتراضية
    unreadCount: savedUnreadCount = 0, // إضافة قيمة افتراضية
    loading: notificationsLoading,
    markAsRead: markSavedAsRead,
    markAllAsRead: markAllSavedAsRead,
    addNotification,
    refreshNotifications
  } = useUserNotifications() || {} // إضافة fallback
  
  // التحقق من كون المستخدم مدير
  const isManager = debugInfo?.isManager || false

  // ربط SSE مع نظام الإشعارات المحفوظة
  useEffect(() => {
    // عند وصول إشعار جديد للمدير عبر SSE، احفظه أيضاً
    if (managerNotifications && managerNotifications.length > 0) {
      const latestNotification = managerNotifications[0];
      if (latestNotification && !latestNotification.saved) {
        addNotification({
          ...latestNotification,
          saved: true
        });
      }
    }
  }, [managerNotifications, addNotification]);

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // دمج الإشعارات العادية وإشعارات المديرين والمحفوظة
  const allNotifications = [
    ...notifications.map(n => ({ ...n, source: 'regular' })),
    ...(isManager ? managerNotifications.map(n => ({ ...n, source: 'manager' })) : []),
    ...savedNotifications.map(n => ({ 
      ...n, 
      source: 'saved',
      read: n.isRead,
      timestamp: n.createdAt
    }))
  ]
  // إزالة المكررات بناءً على ID أو المحتوى
  .filter((notification, index, self) => 
    index === self.findIndex(n => 
      n.id === notification.id || 
      (n.title === notification.title && n.message === notification.message)
    )
  )
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  // حساب إجمالي الإشعارات بعد دمج وإزالة المكررات
  const unreadNotifications = allNotifications.filter(n => !n.read && !n.isRead);
  const totalUnreadCount = unreadNotifications.length;

  // فلترة الإشعارات
  const filteredNotifications = allNotifications.filter(notification => {
    const isRead = notification.read || notification.isRead || false;
    if (filter === 'unread') return !isRead
    if (filter === 'read') return isRead
    return true
  })


  // ألوان الإشعارات
  const getNotificationStyle = (notification, read) => {
    const baseStyle = `p-4 border-r-4 transition-colors duration-200 cursor-pointer ${read ? 'bg-gray-50' : 'bg-white'}`
    
    // إشعارات أنشطة الفريق لها تصميم خاص
    if (notification.category === 'team_activity') {
      return `${baseStyle} border-purple-500 ${read ? 'hover:bg-purple-50' : 'hover:bg-purple-25'} bg-gradient-to-l from-purple-25 to-white`
    }
    
    switch (notification.type) {
      case 'success':
        return `${baseStyle} border-green-500 ${read ? 'hover:bg-green-50' : 'hover:bg-green-25'}`
      case 'error':
        return `${baseStyle} border-red-500 ${read ? 'hover:bg-red-50' : 'hover:bg-red-25'}`
      case 'warning':
        return `${baseStyle} border-yellow-500 ${read ? 'hover:bg-yellow-50' : 'hover:bg-yellow-25'}`
      case 'info':
        return `${baseStyle} border-blue-500 ${read ? 'hover:bg-blue-50' : 'hover:bg-blue-25'}`
      default:
        return `${baseStyle} border-gray-500 ${read ? 'hover:bg-gray-100' : 'hover:bg-gray-25'}`
    }
  }

  // تنسيق الوقت
  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true, 
        locale: ar 
      })
    } catch (error) {
      return 'منذ قليل'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* زر الإشعارات */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {totalUnreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </div>
        )}
      </Button>

      {/* قائمة الإشعارات */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-96 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* هيدر مركز الإشعارات */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">الإشعارات</h3>
                {totalUnreadCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {totalUnreadCount} جديد
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshNotifications}
                  className="h-6 w-6 p-0 hover:bg-green-100 text-green-600"
                  disabled={notificationsLoading}
                  title="تحديث الإشعارات"
                >
                  <RefreshCw className={`h-3 w-3 ${notificationsLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* فلاتر */}
            <div className="flex gap-2 mt-2">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs h-7"
              >
                الكل ({allNotifications.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="text-xs h-7"
              >
                غير مقروء ({totalUnreadCount})
              </Button>
              <Button
                variant={filter === 'read' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('read')}
                className="text-xs h-7"
              >
                مقروء ({allNotifications.length - totalUnreadCount})
              </Button>
              {/* مؤشر حالة الاتصال للمديرين */}
              {isManager && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'متصل' : 'منقطع'}
                  </span>
                  <div 
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    title={`حالة الاتصال: ${isConnected ? 'متصل' : 'منقطع'}${connectionError ? ' - ' + connectionError : ''}`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* قائمة الإشعارات */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={getNotificationStyle(notification, notification.read || notification.isRead)}
                    onClick={() => {
                      const isRead = notification.read || notification.isRead;
                      if (!isRead) {
                        if (notification.source === 'saved') {
                          markSavedAsRead([notification.id]);
                        } else if (notification.source === 'manager') {
                          markManagerNotificationAsRead(notification.id);
                        } else {
                          markAsRead(notification.id);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* أيقونة الإشعار */}
                      <div className="flex-shrink-0 mt-0.5">
                        <span className="text-lg">{notification.icon}</span>
                      </div>

                      {/* محتوى الإشعار */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${(notification.read || notification.isRead) ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${(notification.read || notification.isRead) ? 'text-gray-500' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>

                          {/* إجراءات الإشعار */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (notification.source === 'manager') {
                                    markManagerNotificationAsRead(notification.id)
                                  } else {
                                    markAsRead(notification.id)
                                  }
                                }}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                                title="وضع علامة مقروء"
                              >
                                <Check className="h-3 w-3 text-blue-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (notification.source === 'manager') {
                                  // حذف إشعار المدير من localStorage
                                  const updated = managerNotifications.filter(n => n.id !== notification.id)
                                  localStorage.setItem('managerNotifications', JSON.stringify(updated))
                                  window.location.reload() // إعادة تحميل لتحديث الواجهة
                                } else {
                                  removeNotification(notification.id)
                                }
                              }}
                              className="h-6 w-6 p-0 hover:bg-red-100"
                              title="حذف الإشعار"
                            >
                              <X className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* مؤشر عدم القراءة */}
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* فوتر مع الإجراءات */}
          {allNotifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {totalUnreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        // قراءة جميع الإشعارات العادية
                        if (unreadCount > 0 && markAllAsRead) {
                          markAllAsRead()
                        }
                        // قراءة جميع إشعارات المديرين
                        if (isManager && unreadManagerCount > 0 && markManagerNotificationAsRead) {
                          managerNotifications.forEach(notification => {
                            if (!notification.read) {
                              markManagerNotificationAsRead(notification.id)
                            }
                          })
                        }
                        // قراءة جميع الإشعارات المحفوظة
                        if (savedUnreadCount > 0 && markAllSavedAsRead) {
                          try {
                            await markAllSavedAsRead()
                          } catch (error) {
                            console.error('❌ Error marking all saved notifications as read:', error)
                          }
                        }
                      }}
                      className="text-xs flex items-center gap-1 hover:bg-blue-100 text-blue-600"
                    >
                      <CheckCheck className="h-3 w-3" />
                      قراءة الكل
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      // مسح جميع الإشعارات العادية
                      clearAllNotifications()
                      // مسح جميع إشعارات المديرين
                      if (isManager && managerNotifications.length > 0) {
                        managerNotifications.forEach(notification => {
                          removeManagerNotification(notification.id)
                        })
                      }
                      // مسح جميع الإشعارات المحفوظة
                      if (savedNotifications.length > 0) {
                        try {
                          console.log('🗑️ Clearing all notifications using API...')
                          
                          // استخدام useApi للتعامل مع authentication تلقائياً
                          const response = await api.clearAllNotifications()
                          
                          console.log('✅ All notifications cleared successfully:', response)
                          // تحديث الإشعارات بعد المسح
                          refreshNotifications()
                        } catch (error) {
                          console.error('❌ Error clearing saved notifications:', error)
                        }
                      }
                    }}
                    className="text-xs flex items-center gap-1 hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                    مسح الكل
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      refreshNotifications()
                    }}
                    className="text-xs flex items-center gap-1 hover:bg-blue-100 text-blue-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    تحديث
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

