import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from './useApi';
import { useAuth } from '../contexts/AuthContext';

const useUserNotifications = () => {
  const { currentUser } = useAuth();
  const api = useApi();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // إضافة throttling لمنع الطلبات المتكررة
  const lastFetchRef = useRef(0);
  const lastCountFetchRef = useRef(0);
  const THROTTLE_DELAY = 3000; // 3 ثوان (أقل من 5)
  const isManualRef = useRef(false); // للتمييز بين التحديث اليدوي والتلقائي

  // جلب الإشعارات
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!currentUser || loading) return; // منع الطلبات المتعددة
    
    // Throttling - منع الطلبات المتكررة
    const now = Date.now();
    if (now - lastFetchRef.current < THROTTLE_DELAY) {
      console.log('⏳ Throttling fetchNotifications');
      return;
    }
    lastFetchRef.current = now;

    try {
      setLoading(true);
      setError(null);

      const params = {
        page: 1,
        limit: 50,
        unreadOnly: false,
        ...options
      };

      console.log('🔔 Fetching user notifications:', params);
      const response = await api.getUserNotifications(params);

      if (response.data) {
        setNotifications(response.data);
        console.log(`✅ Loaded ${response.data.length} notifications`);
      } else {
        console.log('📭 No notifications found');
        setNotifications([]);
      }

    } catch (err) {
      console.error('❌ Error fetching notifications:', err);
      setError(err.message || 'فشل في جلب الإشعارات');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, api]);

  // جلب عدد الإشعارات غير المقروءة
  const fetchUnreadCount = useCallback(async (isManual = false) => {
    if (!currentUser || loading) return; // منع الطلبات المتعددة
    
    // Throttling - منع الطلبات المتكررة (تخطي للطلبات اليدوية)
    const now = Date.now();
    if (!isManual && (now - lastCountFetchRef.current < THROTTLE_DELAY)) {
      console.log('⏳ Throttling fetchUnreadCount (auto)');
      return;
    }
    lastCountFetchRef.current = now;

    try {
      console.log('🔔 Fetching unread count');
      const response = await api.getUnreadNotificationsCount();

      if (typeof response.count === 'number') {
        setUnreadCount(response.count);
        console.log(`✅ Unread notifications: ${response.count}`);
      }

    } catch (err) {
      console.error('❌ Error fetching unread count:', err);
      setUnreadCount(0);
    }
  }, [currentUser, api]);

  // تحديد الإشعارات كمقروءة
  const markAsRead = useCallback(async (notificationIds) => {
    if (!notificationIds || notificationIds.length === 0) return;

    try {
      console.log('✅ Marking notifications as read:', notificationIds);
      const response = await api.markNotificationsAsRead(notificationIds);

      if (response.updatedCount > 0) {
        // تحديث الحالة المحلية
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        );

        // تحديث العدد
        setUnreadCount(prev => Math.max(0, prev - response.updatedCount));
        
        console.log(`✅ Marked ${response.updatedCount} notifications as read`);
      }

      return response;

    } catch (err) {
      console.error('❌ Error marking notifications as read:', err);
      throw err;
    }
  }, [api]);

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = useCallback(async () => {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const unreadIds = unreadNotifications.map(n => n.id);
    return await markAsRead(unreadIds);
  }, [notifications, markAsRead]);

  // إضافة إشعار جديد (من SSE)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // تجنب التكرار
      const exists = prev.find(n => n.id === notification.id);
      if (exists) return prev;

      // إضافة الإشعار الجديد في المقدمة
      const updated = [notification, ...prev].slice(0, 100); // الاحتفاظ بآخر 100 إشعار
      return updated;
    });

    // تحديث العدد إذا كان الإشعار غير مقروء
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }

    console.log('🔔 New notification added:', notification.title);
  }, []);

  // جلب الإشعارات عند تسجيل الدخول
  useEffect(() => {
    if (currentUser && !isInitialized) {
      console.log('👤 User logged in, fetching notifications... (useUserNotifications)', {
        userEmail: currentUser.email,
        isInitialized
      });
      setIsInitialized(true);
      
      // Force fetch notifications with a slight delay to ensure backend is ready
      setTimeout(() => {
        console.log('🔄 Force fetching notifications after login...');
        fetchNotifications();
        fetchUnreadCount();
      }, 1000);
    } else if (!currentUser) {
      // مسح البيانات عند تسجيل الخروج
      console.log('👤 User logged out, cleaning up notifications...');
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setIsInitialized(false);
    }
  }, [currentUser, isInitialized]); // إضافة isInitialized للتحكم

  // تحديث دوري ذكي للعدد (كل 5 دقائق)
  useEffect(() => {
    if (!currentUser || !isInitialized) return;

    // تحديث أول بعد دقيقتين من التهيئة
    const initialTimeout = setTimeout(() => {
      fetchUnreadCount();
    }, 2 * 60 * 1000); // 2 دقيقة

    // ثم تحديث دوري كل 5 دقائق
    const interval = setInterval(() => {
      // تحقق إضافي: فقط إذا كان المستخدم ما زال متصل وليس هناك loading
      if (currentUser && !loading) {
        fetchUnreadCount();
        fetchNotifications(); // تحديث الإشعارات كمان
      }
    }, 5 * 60 * 1000); // 5 دقائق

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentUser, isInitialized, loading]); // إضافة loading للتحكم

  // تحديث عند العودة للنافذة (Window Focus)
  useEffect(() => {
    if (!currentUser || !isInitialized) return;

    const handleWindowFocus = () => {
      console.log('🪟 Window focused, checking for new notifications...');
      // تحديث مع throttling
      setTimeout(() => {
        if (currentUser && !loading) {
          fetchUnreadCount();
          fetchNotifications(); // تحديث الإشعارات عند العودة للنافذة
        }
      }, 1000); // انتظار ثانية واحدة
    };

    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [currentUser, isInitialized, loading]);

  // دالة للتحديث اليدوي (بدون throttling)
  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    console.log('🔄 Manual refresh requested');
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(true) // isManual = true
    ]);
  }, [currentUser, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    refreshNotifications, // للتحديث اليدوي
    // للاستخدام المباشر
    hasUnread: unreadCount > 0,
    isEmpty: notifications.length === 0
  };
};

export default useUserNotifications;
