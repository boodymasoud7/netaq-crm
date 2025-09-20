import React, { useEffect, useRef, useState } from 'react'
import { X, Clock, CheckCircle, AlertTriangle, Bell, User, Users, Phone, Calendar, Flag, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { formatEgyptDateTime } from '../../utils/timezone'
import { useApi } from '../../hooks/useApi'
import toast from 'react-hot-toast'

export default function ReminderPopupModal({ 
  reminder, 
  isOpen, 
  onComplete, 
  onDismiss, 
  onClose 
}) {
  const audioRef = useRef(null)
  const [relatedData, setRelatedData] = useState({
    client: null,
    lead: null,
    user: null,
    loading: false
  })
  const [isCompleting, setIsCompleting] = useState(false)
  const api = useApi()

  // تحميل البيانات المرتبطة بالتذكير
  useEffect(() => {
    const loadRelatedData = async () => {
      if (!isOpen || !reminder) {
        setRelatedData({ client: null, lead: null, user: null, loading: false })
        return
      }

      setRelatedData(prev => ({ ...prev, loading: true }))

      try {
        const promises = []
        const dataTypes = []

        // تحميل بيانات العميل إذا كان موجود
        if (reminder.client_id) {
          promises.push(api.getClientById(reminder.client_id))
          dataTypes.push('client')
        }

        // تحميل بيانات العميل المحتمل إذا كان موجود
        if (reminder.lead_id) {
          promises.push(api.getLeadById(reminder.lead_id))
          dataTypes.push('lead')
        }

        // تحميل بيانات المستخدم الذي أنشأ التذكير
        if (reminder.user_id) {
          promises.push(api.getUserById(reminder.user_id))
          dataTypes.push('user')
        }

        if (promises.length > 0) {
          const results = await Promise.allSettled(promises)
          const newData = { client: null, lead: null, user: null, loading: false }

          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              const dataType = dataTypes[index]
              newData[dataType] = result.value.data || result.value
            }
          })

          setRelatedData(newData)
        } else {
          setRelatedData(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        console.error('خطأ في تحميل البيانات المرتبطة:', error)
        setRelatedData(prev => ({ ...prev, loading: false }))
      }
    }

    loadRelatedData()
  }, [isOpen, reminder?.id]) // إزالة api من dependencies وإضافة reminder.id بدلاً من reminder كامل

  useEffect(() => {
    if (isOpen && reminder) {
      // تشغيل صوت التنبيه
      if (audioRef.current) {
        audioRef.current.play().catch(console.error)
      }
    }
  }, [isOpen, reminder])

  if (!isOpen || !reminder) return null

  const formatDateTime = (dateString) => {
    // استخدام دالة التوقيت المصري المحسنة
    return formatEgyptDateTime(dateString)
  }

  const isOverdue = () => {
    if (!reminder.remind_at) return false
    const reminderTime = new Date(reminder.remind_at)
    const now = new Date()
    const diffInMinutes = (now - reminderTime) / (1000 * 60)
    
    // يعتبر التذكير متأخر فقط إذا تأخر أكثر من دقيقتين
    return diffInMinutes > 2
  }

  const getLateness = () => {
    if (!reminder.remind_at) return 0
    const reminderTime = new Date(reminder.remind_at)
    const now = new Date()
    return Math.floor((now - reminderTime) / (1000 * 60))
  }

  const getTimingStatus = () => {
    if (!reminder.remind_at) return { text: 'غير محدد', isOverdue: false }
    
    const reminderTime = new Date(reminder.remind_at)
    const now = new Date()
    const diffInMinutes = Math.floor((now - reminderTime) / (1000 * 60))
    
    if (diffInMinutes < -5) {
      return { text: `مبكر بـ ${Math.abs(diffInMinutes)} دقيقة`, isOverdue: false }
    } else if (diffInMinutes <= 2) {
      return { text: '⏰ في الوقت المناسب!', isOverdue: false }
    } else {
      return { text: `متأخر بـ ${diffInMinutes} دقيقة`, isOverdue: true }
    }
  }

  // دالة لعرض نوع التذكير
  const getReminderTypeInfo = (type) => {
    const types = {
      general: { label: 'عام', icon: '📋', color: 'text-gray-600' },
      call: { label: 'مكالمة', icon: '📞', color: 'text-blue-600' },
      meeting: { label: 'اجتماع', icon: '👥', color: 'text-purple-600' },
      followup: { label: 'متابعة', icon: '🔄', color: 'text-green-600' },
      deadline: { label: 'موعد نهائي', icon: '⏰', color: 'text-red-600' }
    }
    return types[type] || types.general
  }

  // دالة لعرض الأولوية
  const getPriorityInfo = (priority) => {
    const priorities = {
      low: { label: 'منخفضة', icon: '🟢', color: 'text-green-600', bg: 'bg-green-50' },
      medium: { label: 'متوسطة', icon: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-50' },
      high: { label: 'عالية', icon: '🔴', color: 'text-red-600', bg: 'bg-red-50' }
    }
    return priorities[priority] || priorities.medium
  }

  return (
    <>
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <Card className="w-full max-w-lg bg-white rounded-xl shadow-2xl animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className={`p-6 rounded-t-xl ${
            reminder?.status === 'done'
              ? 'bg-gradient-to-r from-green-500 to-green-600'
              : isOverdue() 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : 'bg-gradient-to-r from-orange-500 to-yellow-500'
          }`}>
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  {reminder?.status === 'done' ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : isOverdue() ? (
                    <AlertTriangle className="h-6 w-6 text-white" />
                  ) : (
                    <Bell className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {reminder?.status === 'done' 
                      ? '✅ تذكير مكتمل' 
                      : isOverdue() ? '⚠️ تذكير متأخر!' : '🔔 تذكير!'
                    }
                  </h3>
                  <p className="text-sm opacity-90">
                    {reminder?.status === 'done' 
                      ? 'تم إنجاز هذا التذكير بالفعل'
                      : getTimingStatus().text
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Status Badge */}
                {reminder?.status === 'done' && (
                  <span className="px-2 py-1 bg-white bg-opacity-30 rounded-full text-xs font-medium">
                    مكتمل
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Reminder Note */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">📝 محتوى التذكير:</label>
              <div className="p-3 bg-gray-50 rounded-lg border-r-4 border-orange-500">
                <p className="text-gray-900 font-medium">{reminder.note}</p>
              </div>
            </div>

            {/* Reminder Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">⏰ وقت التذكير:</label>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900 font-medium">
                  {formatDateTime(reminder.remind_at)}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            {(() => {
              const status = getTimingStatus()
              const bgColor = status.isOverdue ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              const textColor = status.isOverdue ? 'text-red-800' : 'text-green-800'
              const icon = status.isOverdue ? AlertTriangle : CheckCircle
              const Icon = icon
              
              return (
                <div className={`p-3 border rounded-lg ${bgColor}`}>
                  <div className={`flex items-center gap-2 ${textColor}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {status.text}
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* نوع التذكير والأولوية */}
            {(reminder.type || reminder.priority) && (
              <div className="grid grid-cols-2 gap-3">
                {/* نوع التذكير */}
                {reminder.type && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">النوع</label>
                    <div className={`p-2 rounded-lg bg-gray-50 border`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getReminderTypeInfo(reminder.type).icon}</span>
                        <span className={`text-sm font-medium ${getReminderTypeInfo(reminder.type).color}`}>
                          {getReminderTypeInfo(reminder.type).label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* الأولوية */}
                {reminder.priority && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">الأولوية</label>
                    <div className={`p-2 rounded-lg border ${getPriorityInfo(reminder.priority).bg}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getPriorityInfo(reminder.priority).icon}</span>
                        <span className={`text-sm font-medium ${getPriorityInfo(reminder.priority).color}`}>
                          {getPriorityInfo(reminder.priority).label}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* الوصف التفصيلي */}
            {reminder.description && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">📄 وصف تفصيلي:</label>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-indigo-900 text-sm leading-relaxed">{reminder.description}</p>
                </div>
              </div>
            )}

            {/* البيانات المرتبطة */}
            {(relatedData.client || relatedData.lead || relatedData.user) && (
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  البيانات المرتبطة
                </label>

                {/* بيانات العميل */}
                {relatedData.client && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">عميل</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-green-900">{relatedData.client.name}</p>
                      {relatedData.client.phone && (
                        <div className="flex items-center gap-1 text-green-700">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{relatedData.client.phone}</span>
                        </div>
                      )}
                      {relatedData.client.email && (
                        <p className="text-xs text-green-600">{relatedData.client.email}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* بيانات العميل المحتمل */}
                {relatedData.lead && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">عميل محتمل</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-blue-900">{relatedData.lead.name}</p>
                      {relatedData.lead.phone && (
                        <div className="flex items-center gap-1 text-blue-700">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{relatedData.lead.phone}</span>
                        </div>
                      )}
                      {relatedData.lead.email && (
                        <p className="text-xs text-blue-600">{relatedData.lead.email}</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* مؤشر التحميل */}
            {relatedData.loading && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">جاري تحميل البيانات المرتبطة...</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <Button
              onClick={async () => {
                // منع الضغط المتكرر
                if (isCompleting || reminder?.status === 'done') {
                  console.log('🚫 Button click prevented - reminder status:', reminder?.status, 'isCompleting:', isCompleting)
                  return
                }
                
                setIsCompleting(true)
                try {
                  await onComplete(reminder)
                } catch (error) {
                  console.error('خطأ في إتمام التذكير:', error)
                  
                  // التحقق من نوع الخطأ
                  const errorMessage = error?.message || error?.toString() || ''
                  
                  if (errorMessage.includes('already marked as done') || errorMessage.includes('already completed')) {
                    // التذكير مكتمل بالفعل - أقفل الـ popup
                    toast.success('✅ هذا التذكير مكتمل بالفعل')
                    onClose()
                  } else {
                    // خطأ آخر - أعرض رسالة خطأ
                    toast.error('❌ حدث خطأ في إتمام التذكير')
                    setIsCompleting(false)
                  }
                }
                // لا نعيد setIsCompleting(false) هنا لأن popup سيختفي في الحالة الطبيعية
              }}
              disabled={isCompleting || reminder?.status === 'done'}
              className={`flex-1 font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${
                isCompleting || reminder?.status === 'done'
                  ? 'bg-green-400 cursor-not-allowed' 
                  : reminder?.status === 'notified'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {reminder?.status === 'done' ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  مكتمل بالفعل
                </>
              ) : isCompleting ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  جاري الإنجاز...
                </div>
              ) : reminder?.status === 'notified' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ✅ إنجاز التذكير
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ✅ تم الإنجاز
                </>
              )}
            </Button>
            <Button
              onClick={() => onDismiss(reminder)}
              disabled={isCompleting}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <X className="h-4 w-4 mr-2" />
              ❌ تجاهل
            </Button>
          </div>
        </Card>
      </div>

      {/* Notification Sound */}
      <audio 
        ref={audioRef} 
        preload="auto"
        className="hidden"
      >
        {/* Using data URL for a simple ding sound */}
        <source 
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+D2u2gfCCaH0fPTgjMGHm7A7+OZURE="
          type="audio/wav"
        />
      </audio>
    </>
  )
}




