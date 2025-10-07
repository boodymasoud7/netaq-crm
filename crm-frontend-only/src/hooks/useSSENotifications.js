import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from './usePermissions'
import toast from 'react-hot-toast'

// Hook للإشعارات الفورية عبر Server-Sent Events
export function useSSENotifications() {
  const [managerNotifications, setManagerNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  
  const { currentUser } = useAuth()
  const { isAdmin, isSalesManager } = usePermissions()
  
  const eventSourceRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const isManager = isAdmin() || isSalesManager()

  // تحميل الإشعارات المحفوظة من localStorage
  const loadSavedNotifications = useCallback(() => {
    if (!isManager) return []
    
    try {
      const saved = JSON.parse(localStorage.getItem('managerNotifications') || '[]')
      return saved
    } catch (error) {
      console.error('❌ Error loading saved notifications:', error)
      return []
    }
  }, [isManager])

  // حفظ الإشعارات في localStorage
  const saveNotifications = useCallback((notifications) => {
    if (!isManager) return
    
    try {
      // الاحتفاظ بآخر 100 إشعار
      const limited = notifications.slice(0, 100)
      localStorage.setItem('managerNotifications', JSON.stringify(limited))
    } catch (error) {
      console.error('❌ Error saving notifications:', error)
    }
  }, [isManager])

  // إضافة إشعار جديد
  const addNotification = useCallback((notification) => {
    setManagerNotifications(prev => {
      const updated = [notification, ...prev.filter(n => n.id !== notification.id)]
      saveNotifications(updated)
      return updated
    })
  }, [saveNotifications])

  // الاتصال بـ SSE
  const connectSSE = useCallback(() => {
    if (!isManager || !currentUser) {
      console.log('❌ Cannot connect SSE: not manager or no user', { isManager, currentUser: !!currentUser })
      return
    }

    console.log('📡 Connecting to SSE stream...', { user: currentUser.email })
    
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('❌ No auth token found')
      setConnectionError('No authentication token')
      return
    }
    
    // تحقق من صحة الـ token قبل الاتصال
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        console.error('❌ Token expired')
        setConnectionError('Authentication token expired')
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        return
      }
      console.log('🔑 Token valid, expires:', new Date(payload.exp * 1000).toISOString())
    } catch (error) {
      console.error('❌ Invalid token format:', error)
      setConnectionError('Invalid authentication token')
      return
    }
    
    console.log('🔑 Using token:', token.substring(0, 20) + '...')

    // إنشاء اتصال SSE مع token كـ query parameter - use current domain
    const apiBase = window.location.origin;
    const eventSource = new EventSource(`${apiBase}/api/notifications-stream/stream?token=${encodeURIComponent(token)}`)

    eventSource.onopen = () => {
      console.log('✅ SSE connection established')
      setIsConnected(true)
      setConnectionError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 Received SSE message:', data)

        if (data.type === 'heartbeat') {
          console.log('💓 Heartbeat received')
          return
        }

        if (data.type === 'connected') {
          console.log('🔗 SSE connection confirmed')
          return
        }

        // إضافة الإشعار الجديد
        const allowedNotificationTypes = [
          'managerNotification', 'leadConverted', 'newLead', 'newClient', 
          'interactionAdded', 'noteAdded', 'noteReply', 'taskAssigned', 
          'taskAction', 'taskNoteAdded', 'taskNoteReply', 'newProject', 
          'newSale', 'newUnit'
        ]
        
        if (allowedNotificationTypes.includes(data.type)) {
          // تحديد ما إذا كان الإشعار للمديرين فقط أم للجميع
          const isManagerOnly = [
            'leadConverted', 'newLead', 'newClient', 'interactionAdded', 
            'noteAdded', 'taskAction', 'taskNoteAdded', 'newSale'
          ].includes(data.type)
          
          const isForThisUser = !isManagerOnly || isManager
          
          if (isForThisUser) {
            const notification = {
              id: data.id || `sse-${Date.now()}`,
              timestamp: data.timestamp || new Date().toISOString(),
              read: false,
              forManagers: isManagerOnly,
              forEveryone: !isManagerOnly,
              ...data
            }
          
            addNotification(notification)
            
            // عرض toast notification
            toast.success(data.message || 'إشعار جديد', {
              icon: data.icon || '🔔',
              duration: 4000
            })
          }
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error)
      setIsConnected(false)
      setConnectionError(`Connection error (state: ${eventSource.readyState})`)
      
      // Check if backend is available before attempting reconnection
      fetch(`${import.meta.env.VITE_API_URL || 'http://54.221.136.112'}/api/health`)
        .then(response => {
          if (response.ok) {
            // Backend is available, try to reconnect after 10 seconds
            console.log('🔄 Backend is available, attempting to reconnect SSE in 10 seconds...')
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE()
            }, 10000)
          } else {
            console.log('⚠️ Backend not available, SSE reconnection postponed')
          }
        })
        .catch(() => {
          console.log('⚠️ Backend not available, SSE reconnection postponed')
        })
    }

    eventSourceRef.current = eventSource
  }, [isManager, currentUser, addNotification])

  // إغلاق الاتصال
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 Closing SSE connection')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
    setConnectionError(null)
  }, [])

  // إعداد الاتصال عند التحميل
  useEffect(() => {
    // تحميل الإشعارات المحفوظة أولاً
    const saved = loadSavedNotifications()
    setManagerNotifications(saved)

    // الاتصال بـ SSE إذا كان مدير
    if (isManager && currentUser) {
      connectSSE()
    }

    return () => {
      disconnectSSE()
    }
  }, [isManager, currentUser, connectSSE, disconnectSSE, loadSavedNotifications])

  // وضع علامة مقروء
  const markAsRead = useCallback((notificationId) => {
    setManagerNotifications(prev => {
      const updated = prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
      saveNotifications(updated)
      return updated
    })
  }, [saveNotifications])

  // حذف إشعار
  const removeNotification = useCallback((notificationId) => {
    setManagerNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId)
      saveNotifications(updated)
      return updated
    })
  }, [saveNotifications])

  // إحصائيات
  const unreadCount = managerNotifications.filter(n => !n.read).length

  return {
    managerNotifications,
    unreadCount,
    isConnected,
    connectionError,
    markAsRead,
    removeNotification,
    addNotification, // للاختبار
    // Debug functions
    debugInfo: {
      isManager,
      currentUser: currentUser?.email,
      notificationsCount: managerNotifications.length,
      unreadCount,
      isConnected,
      connectionError
    }
  }
}

export default useSSENotifications
