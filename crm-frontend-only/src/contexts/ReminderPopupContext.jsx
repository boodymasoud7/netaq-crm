import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useSSENotifications } from '../hooks/useSSENotifications'
import { useApi } from '../hooks/useApi'
import toast from 'react-hot-toast'

const ReminderPopupContext = createContext({})

export function useReminderPopup() {
  return useContext(ReminderPopupContext)
}

export function ReminderPopupProvider({ children }) {
  const [activeReminder, setActiveReminder] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [reminderQueue, setReminderQueue] = useState([])
  
  const { currentUser } = useAuth()
  const { managerNotifications } = useSSENotifications()
  const api = useApi()

  // عرض تذكير في popup
  const showReminderPopup = useCallback((reminder) => {
    if (!reminder) {
      console.warn('⚠️ No reminder provided to showReminderPopup')
      return
    }
    
    // إضافة التذكير إلى القائمة إذا كان هناك popup مفتوح
    if (isPopupOpen) {
      setReminderQueue(prev => [...prev, reminder])
      return
    }
    
    setActiveReminder(reminder)
    setIsPopupOpen(true)
  }, [isPopupOpen])

  // إغلاق popup الحالي وعرض التالي من القائمة
  const closeReminderPopup = useCallback(() => {
    setIsPopupOpen(false)
    setActiveReminder(null)
    
    // عرض التذكير التالي من القائمة إن وُجد
    setTimeout(() => {
      setReminderQueue(prev => {
        if (prev.length > 0) {
          const [nextReminder, ...remaining] = prev
          setActiveReminder(nextReminder)
          setIsPopupOpen(true)
          return remaining
        }
        return prev
      })
    }, 500) // تأخير قصير لتجنب التداخل
  }, [])

  // معالجة إتمام التذكير
  const completeReminder = useCallback(async (reminder) => {
    try {
      console.log('✅ إتمام التذكير:', reminder.id)
      
      // التحقق من أن التذكير ليس مكتمل بالفعل
      if (reminder.status === 'done') {
        toast.success('✅ هذا التذكير مكتمل بالفعل', { id: `completing-${reminder.id}` })
        closeReminderPopup()
        return
      }

      // للتذكيرات في حالة 'notified'، يمكن تحديثها لـ 'done'
      if (reminder.status === 'notified') {
        console.log('🔄 تحديث تذكير من "notified" إلى "done":', reminder.id)
      }
      
      // إشعار فوري للمستخدم
      toast.loading('جاري إنجاز التذكير...', { id: `completing-${reminder.id}` })
      
      // استخدام markReminderAsDone فقط - طريقة واحدة لتجنب التكرار
      await api.markReminderAsDone(reminder.id)
      
      // إغلاق popup مع تأكيد الإنجاز
      closeReminderPopup()
      
      // إشعار بالنجاح
      toast.success(
        `✅ تم إنجاز التذكير: ${reminder.note?.substring(0, 40)}...`,
        { 
          id: `completing-${reminder.id}`,
          duration: 4000
        }
      )
      
      // إرسال حدث مخصص لتحديث الصفحة
      window.dispatchEvent(new CustomEvent('reminderCompleted', { 
        detail: { 
          reminderId: reminder.id,
          reminderNote: reminder.note 
        } 
      }))
      
    } catch (error) {
      console.error('❌ خطأ في إتمام التذكير:', error)
      
      // التحقق من نوع الخطأ للتعامل مع "already completed"
      const errorMessage = error?.message || error?.toString() || ''
      
      if (errorMessage.includes('already marked as done') || errorMessage.includes('already completed')) {
        // التذكير مكتمل بالفعل - اقفل الـ popup بدون error
        toast.success('✅ هذا التذكير مكتمل بالفعل', { id: `completing-${reminder.id}` })
        closeReminderPopup()
        
        // إرسال حدث التحديث برده عشان الجدول يتحدث
        window.dispatchEvent(new CustomEvent('reminderCompleted', { 
          detail: { 
            reminderId: reminder.id,
            reminderNote: reminder.note 
          } 
        }))
      } else {
        // خطأ حقيقي
        toast.error(
          'حدث خطأ في إنجاز التذكير. حاول مرة أخرى.',
          { 
            id: `completing-${reminder.id}`,
            duration: 4000
          }
        )
      }
    }
  }, [closeReminderPopup]) // إزالة api من dependencies

  // تجاهل التذكير (بدون تغيير الحالة)
  const dismissReminder = useCallback((reminder) => {
    closeReminderPopup()
  }, [closeReminderPopup])

  // مراقبة الإشعارات الواردة للبحث عن تذكيرات
  useEffect(() => {
    if (!managerNotifications || managerNotifications.length === 0) return

    const latestNotification = managerNotifications[0]
    
    // التحقق من أن الإشعار هو تذكير وغير مقروء
    if (latestNotification.type === 'reminder' && !latestNotification.read) {
      
      // التحقق من الحالة الفعلية للتذكير قبل عرضه
      const checkAndShowReminder = async () => {
        try {
          const reminderId = latestNotification.relatedId || latestNotification.id
          
          // جلب حالة التذكير الفعلية من الخادم
          const response = await api.getReminders({ limit: 1000 })
          const reminders = response?.data || response || []
          const actualReminder = reminders.find(r => r.id == reminderId)
          
          if (!actualReminder) {
            console.log('🚫 Reminder not found, skipping popup:', reminderId)
            return
          }
          
          // فقط إذا كان التذكير غير مكتمل
          if (actualReminder.status === 'done') {
            console.log('✅ Reminder already completed, skipping popup:', reminderId)
            return
          }
          
          // تحويل بيانات الإشعار إلى صيغة التذكير المطلوبة
          const reminderData = {
            ...actualReminder, // استخدام البيانات الفعلية
            // إضافة بيانات إضافية من الإشعار إذا لزم الأمر
            ...latestNotification.data
          }
          
          showReminderPopup(reminderData)
        } catch (error) {
          console.error('❌ Error checking reminder status:', error)
          // في حالة الخطأ، لا نعرض popup لتجنب المشاكل
        }
      }
      
      checkAndShowReminder()
    }
  }, [managerNotifications?.length, currentUser?.id, api]) // إضافة api

  // فحص دوري للتذكيرات المستحقة (backup للـ SSE)
  useEffect(() => {
    if (!currentUser) return

    // تقليل تكرار الفحص في وضع التطوير بدلاً من إيقافه تماماً
    const IS_PRODUCTION = process.env.NODE_ENV === 'production'
    
    // في التطوير: كل 30 ثانية، في الإنتاج: كل 5 دقائق
    const POLLING_INTERVAL = IS_PRODUCTION ? 300000 : 30000
    
    console.log(`🔔 ReminderPopupContext: Polling enabled every ${IS_PRODUCTION ? '5 minutes' : '30 seconds'}`)

    let isCheckingReminders = false // منع الطلبات المتداخلة

    const checkReminders = async () => {
      if (isCheckingReminders) {
        return
      }
      
      if (isPopupOpen) {
        return
      }
      
      isCheckingReminders = true
      
      try {
        const response = await api.getReminders({ limit: 1000 })
        const reminders = response?.data || response || []
        
        // البحث عن التذكيرات المستحقة
        const now = new Date()
        const dueReminders = reminders.filter(reminder => {
          // قبول التذكيرات pending أو notified (التي تم إرسالها ولكن لم يتم إنجازها)
          if (!['pending', 'notified'].includes(reminder.status)) return false
          const reminderTime = new Date(reminder.remind_at)
          return reminderTime <= now
        })
        
        // عرض أول تذكير مستحق (مع فحص إضافي)
        if (dueReminders.length > 0) {
          const dueReminder = dueReminders[0]
          
          // فحص إضافي: تأكد من أن التذكير ليس مكتمل
          if (dueReminder.status !== 'done') {
            console.log('🔔 Found due reminder, showing popup:', dueReminder.id, 'Status:', dueReminder.status)
            showReminderPopup(dueReminder)
          } else {
            console.log('✅ Skipping completed reminder:', dueReminder.id)
          }
        }
        
      } catch (error) {
        console.error('❌ Error checking reminders:', error)
      } finally {
        isCheckingReminders = false
      }
    }

    // فحص حسب البيئة
    const interval = setInterval(checkReminders, POLLING_INTERVAL)
    
    // فحص فوري عند التحميل (فقط مرة واحدة)
    setTimeout(checkReminders, 2000) // تأخير 2 ثانية
    
    return () => {
      clearInterval(interval)
      isCheckingReminders = false
      console.log('🛑 ReminderPopupContext: Polling stopped')
    }
  }, [currentUser?.id]) // فقط عند تغيير ID المستخدم

  const value = {
    // الحالة
    activeReminder,
    isPopupOpen,
    reminderQueueLength: reminderQueue.length,
    
    // الدوال
    showReminderPopup,
    closeReminderPopup,
    completeReminder,
    dismissReminder
  }

  return (
    <ReminderPopupContext.Provider value={value}>
      {children}
    </ReminderPopupContext.Provider>
  )
}
