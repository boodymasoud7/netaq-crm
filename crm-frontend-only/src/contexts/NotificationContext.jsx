import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const NotificationContext = createContext({})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const { currentUser } = useAuth()

  // إضافة إشعار جديد
  const addNotification = useCallback((notification) => {
    console.log('📥 Attempting to add notification:', {
      title: notification.title,
      targetRoles: notification.targetRoles,
      targetUsers: notification.targetUsers,
      currentUserRole: currentUser?.role,
      currentUserId: currentUser?.id,
      currentUserName: currentUser?.name
    })

    // معالجة الإشعارات بشكل طبيعي
    console.log('📥 Processing notification:', notification.title)
    
    if (notification.data?.isManagerNotification) {
      console.log('📋 Manager notification detected')
    }

    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      priority: 'normal',
      ...notification
    }

    console.log('📢 Adding notification to state for user:', currentUser?.name, 'Role:', currentUser?.role)
    console.log('📢 Notification details:', newNotification)
    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      console.log('📢 Total notifications now:', updated.length)
      return updated
    })

    // عرض Toast notification
    const toastOptions = {
      duration: 4000,
      position: 'top-left',
      style: {
        background: getNotificationColor(notification.type),
        color: 'white',
        fontSize: '14px',
        fontFamily: 'system-ui'
      }
    }

    switch (notification.type) {
      case 'success':
        toast.success(`${notification.icon || '✅'} ${notification.title}`, toastOptions)
        break
      case 'error':
        toast.error(`${notification.icon || '❌'} ${notification.title}`, toastOptions)
        break
      case 'warning':
        toast(`${notification.icon || '⚠️'} ${notification.title}`, toastOptions)
        break
      default:
        toast(`${notification.icon || 'ℹ️'} ${notification.title}`, toastOptions)
    }

    return newNotification.id
  }, [currentUser])

  // وضع علامة مقروء على إشعار
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }, [])

  // وضع علامة مقروء على جميع الإشعارات
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  // حذف إشعار
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    )
  }, [])

  // مسح جميع الإشعارات
  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // الحصول على عدد الإشعارات غير المقروءة
  const unreadCount = notifications.filter(n => !n.read).length

  // إشعارات سريعة للعمليات الشائعة
  const notifySuccess = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      icon: '✅',
      ...options
    })
  }, [addNotification])

  const notifyError = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'error', 
      title,
      message,
      icon: '❌',
      priority: 'high',
      ...options
    })
  }, [addNotification])

  const notifyWarning = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'warning',
      title, 
      message,
      icon: '⚠️',
      priority: 'high',
      ...options
    })
  }, [addNotification])

  const notifyInfo = useCallback((title, message, options = {}) => {
    return addNotification({
      type: 'info',
      title,
      message, 
      icon: 'ℹ️',
      ...options
    })
  }, [addNotification])

  // إشعارات خاصة بالـ CRM
  const notifyNewClient = useCallback((clientName) => {
    console.log('📢 Adding new client notification:', clientName)
    return notifySuccess(
      'عميل جديد',
      `تم إضافة ${clientName} بنجاح`,
      { icon: '👤', priority: 'normal' }
    )
  }, [notifySuccess])

  const notifyNewLead = useCallback((leadName) => {
    return notifySuccess(
      'عميل محتمل جديد',
      `تم إضافة ${leadName} كعميل محتمل`,
      { icon: '🎯', priority: 'normal' }
    )
  }, [notifySuccess])

  const notifyLeadConverted = useCallback((leadName) => {
    return notifySuccess(
      'تحويل ناجح',
      `تم تحويل ${leadName} إلى عميل فعلي`,
      { icon: '🎉', priority: 'high' }
    )
  }, [notifySuccess])

  // إشعارات للمديرين عن أنشطة الموظفين
  const notifyManagerAboutLeadConversion = useCallback((employeeName, leadName) => {
    console.log('📢 Adding manager notification for lead conversion:', { employeeName, leadName })
    return notifySuccess(
      'تحويل عميل محتمل - إنجاز موظف',
      `قام ${employeeName} بتحويل العميل المحتمل "${leadName}" إلى عميل فعلي`,
      { icon: '🎯✨', priority: 'high', category: 'team_activity' }
    )
  }, [notifySuccess])

  const notifyManagerAboutNewClient = useCallback((employeeName, clientName) => {
    return notifyInfo(
      'عميل جديد - إضافة موظف',
      `قام ${employeeName} بإضافة عميل جديد: "${clientName}"`,
      { icon: '👤✨', priority: 'normal', category: 'team_activity' }
    )
  }, [notifyInfo])

  const notifyManagerAboutNewLead = useCallback((employeeName, leadName) => {
    return notifyInfo(
      'عميل محتمل جديد - إضافة موظف',
      `قام ${employeeName} بإضافة عميل محتمل جديد: "${leadName}"`,
      { icon: '🎯🆕', priority: 'normal', category: 'team_activity' }
    )
  }, [notifyInfo])

  const notifyManagerAboutNewSale = useCallback((employeeName, amount, clientName) => {
    return notifySuccess(
      'مبيعة جديدة - إنجاز موظف',
      `حقق ${employeeName} مبيعة بقيمة ${amount} جنيه للعميل "${clientName}"`,
      { icon: '💰🏆', priority: 'high', category: 'team_activity' }
    )
  }, [notifySuccess])

  const notifyNewSale = useCallback((amount, clientName) => {
    return notifySuccess(
      'مبيعة جديدة',
      `مبيعة بقيمة ${amount} جنيه لـ ${clientName}`,
      { icon: '💰', priority: 'high' }
    )
  }, [notifySuccess])

  const notifyReminder = useCallback((title, message, time) => {
    return notifyWarning(
      title,
      `${message} - ${time}`,
      { icon: '⏰', priority: 'high' }
    )
  }, [notifyWarning])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    // إشعارات سريعة
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    // إشعارات CRM
    notifyNewClient,
    notifyNewLead,
    notifyLeadConverted,
    notifyNewSale,
    notifyReminder,
    // إشعارات المديرين
    notifyManagerAboutLeadConversion,
    notifyManagerAboutNewClient,
    notifyManagerAboutNewLead,
    notifyManagerAboutNewSale
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// دالة مساعدة للألوان
function getNotificationColor(type) {
  switch (type) {
    case 'success': return '#10B981'
    case 'error': return '#EF4444'
    case 'warning': return '#F59E0B'
    case 'info': return '#3B82F6'
    default: return '#6B7280'
  }
}