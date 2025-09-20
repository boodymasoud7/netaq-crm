/**
 * مودال تعديل المتابعة - Edit Follow-up Modal
 * يسمح بتعديل موعد ووقت وتفاصيل المتابعة
 */

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare, 
  Mail, 
  Video,
  Flag,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
// Import removed - formatDate not needed here

const EditFollowUpModal = ({ 
  isOpen, 
  onClose, 
  followUp, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'call',
    priority: 'medium',
    scheduledDate: '',
    scheduledTime: '',
    quickDateOption: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // تحديث البيانات عند فتح المودال
  useEffect(() => {
    if (followUp && isOpen) {
      const scheduledDateTime = new Date(followUp.scheduledDate)
      const date = scheduledDateTime.toISOString().split('T')[0]
      const time = scheduledDateTime.toTimeString().slice(0, 5)
      
      setFormData({
        title: followUp.title || '',
        description: followUp.description || '',
        type: followUp.type || 'call',
        priority: followUp.priority || 'medium',
        scheduledDate: date,
        scheduledTime: time,
        quickDateOption: 'custom' // افتراضياً نضع "تاريخ مخصص"
      })
    }
  }, [followUp, isOpen])

  const typeOptions = [
    { value: 'call', label: 'مكالمة', icon: Phone },
    { value: 'whatsapp', label: 'واتساب', icon: MessageSquare },
    { value: 'email', label: 'إيميل', icon: Mail },
    { value: 'meeting', label: 'اجتماع', icon: Video }
  ]

  const priorityOptions = [
    { value: 'low', label: 'منخفضة', color: 'text-green-600' },
    { value: 'medium', label: 'متوسطة', color: 'text-yellow-600' },
    { value: 'high', label: 'عالية', color: 'text-red-600' }
  ]

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // دالة عرض التاريخ بشكل جميل
  const getDateDisplayText = () => {
    if (!formData.scheduledDate) return ''
    
    const date = new Date(formData.scheduledDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'اليوم'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'غداً'
    } else {
      // تحويل للتاريخ الميلادي باللغة العربية
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      }
      
      // استخدام en-US للحصول على التاريخ الميلادي ثم ترجمة الأشهر
      const englishDate = date.toLocaleDateString('en-US', options)
      
      // ترجمة أسماء الأيام والشهور للعربية
      const dayNames = {
        'Sunday': 'الأحد',
        'Monday': 'الاثنين', 
        'Tuesday': 'الثلاثاء',
        'Wednesday': 'الأربعاء',
        'Thursday': 'الخميس',
        'Friday': 'الجمعة',
        'Saturday': 'السبت'
      }
      
      const monthNames = {
        'January': 'يناير',
        'February': 'فبراير',
        'March': 'مارس',
        'April': 'أبريل',
        'May': 'مايو',
        'June': 'يونيو',
        'July': 'يوليو',
        'August': 'أغسطس',
        'September': 'سبتمبر',
        'October': 'أكتوبر',
        'November': 'نوفمبر',
        'December': 'ديسمبر'
      }
      
      let arabicDate = englishDate
      Object.entries(dayNames).forEach(([eng, ar]) => {
        arabicDate = arabicDate.replace(eng, ar)
      })
      Object.entries(monthNames).forEach(([eng, ar]) => {
        arabicDate = arabicDate.replace(eng, ar)
      })
      
      return arabicDate
    }
  }

  // دالة عرض الوقت بشكل جميل
  const getTimeDisplayText = () => {
    if (!formData.scheduledTime) return ''
    
    const [hour, minute] = formData.scheduledTime.split(':')
    const hourNum = parseInt(hour)
    
    if (hourNum < 12) {
      return `${hourNum}:${minute} صباحاً`
    } else if (hourNum === 12) {
      return `${hourNum}:${minute} ظهراً`
    } else {
      return `${hourNum - 12}:${minute} مساءً`
    }
  }

  // دالة التعامل مع التواريخ السريعة
  const handleQuickDateChange = (option) => {
    const today = new Date()
    let targetDate = new Date(today)

    switch (option) {
      case 'today':
        // اليوم
        break
      case 'tomorrow':
        targetDate.setDate(today.getDate() + 1)
        break
      case '2days':
        targetDate.setDate(today.getDate() + 2)
        break
      case '3days':
        targetDate.setDate(today.getDate() + 3)
        break
      case '5days':
        targetDate.setDate(today.getDate() + 5)
        break
      case 'week':
        targetDate.setDate(today.getDate() + 7)
        break
      case '2weeks':
        targetDate.setDate(today.getDate() + 14)
        break
      case 'month':
        targetDate.setMonth(today.getMonth() + 1)
        break
      case 'custom':
        // لا نغير التاريخ، سيقوم المستخدم بإدخاله يدوياً
        setFormData(prev => ({
          ...prev,
          quickDateOption: option
        }))
        return
      default:
        break
    }

    const dateString = targetDate.toISOString().split('T')[0]
    
    setFormData(prev => ({
      ...prev,
      quickDateOption: option,
      scheduledDate: dateString
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.scheduledDate || !formData.scheduledTime) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setIsSubmitting(true)
    try {
      // دمج التاريخ والوقت
      const combinedDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00`)
      
      const updatedData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        scheduledDate: combinedDateTime.toISOString()
      }

      await onSave(followUp.id, updatedData)
      onClose()
    } catch (error) {
      console.error('Error updating follow-up:', error)
      alert('فشل في حفظ التغييرات')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: 'call',
      priority: 'medium',
      scheduledDate: '',
      scheduledTime: '',
      quickDateOption: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              تعديل المتابعة
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              تعديل موعد ووقت وتفاصيل المتابعة
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* العنوان */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان المتابعة *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="مثال: متابعة عرض السعر"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          {/* الوصف */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف (اختياري)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="تفاصيل إضافية عن المتابعة..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* النوع والأولوية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* نوع المتابعة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع المتابعة *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* الأولوية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الأولوية *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* التوقيت السريع */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* اختيار سريع للتاريخ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تأجيل المتابعة إلى *
              </label>
              <select
                value={formData.quickDateOption || 'custom'}
                onChange={(e) => handleQuickDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="today">اليوم</option>
                <option value="tomorrow">غداً</option>
                <option value="2days">بعد يومين</option>
                <option value="3days">بعد 3 أيام</option>
                <option value="5days">بعد 5 أيام</option>
                <option value="week">بعد أسبوع</option>
                <option value="2weeks">بعد أسبوعين</option>
                <option value="month">بعد شهر</option>
                <option value="custom">تاريخ مخصص</option>
              </select>
            </div>

            {/* الوقت */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وقت المتابعة *
              </label>
              <select
                value={formData.scheduledTime}
                onChange={(e) => handleChange('scheduledTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="09:00">9:00 صباحاً</option>
                <option value="10:00">10:00 صباحاً</option>
                <option value="11:00">11:00 صباحاً</option>
                <option value="12:00">12:00 ظهراً</option>
                <option value="13:00">1:00 بعد الظهر</option>
                <option value="14:00">2:00 بعد الظهر</option>
                <option value="15:00">3:00 بعد الظهر</option>
                <option value="16:00">4:00 بعد الظهر</option>
                <option value="17:00">5:00 مساءً</option>
                <option value="18:00">6:00 مساءً</option>
                <option value="19:00">7:00 مساءً</option>
                <option value="20:00">8:00 مساءً</option>
              </select>
            </div>
          </div>

          {/* التاريخ المخصص (يظهر فقط عند اختيار "تاريخ مخصص") */}
          {formData.quickDateOption === 'custom' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ المخصص *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          )}

          {/* معاينة التغييرات */}
          {formData.scheduledDate && formData.scheduledTime && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                معاينة التغييرات
              </h4>
              <div className="space-y-1 text-sm text-purple-800">
                <p><strong>العنوان:</strong> {formData.title}</p>
                <p><strong>النوع:</strong> {typeOptions.find(t => t.value === formData.type)?.label}</p>
                <p><strong>الأولوية:</strong> {priorityOptions.find(p => p.value === formData.priority)?.label}</p>
                <p><strong>الموعد الجديد:</strong> {getDateDisplayText()} في الساعة {getTimeDisplayText()}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.scheduledDate || !formData.scheduledTime}
              className="min-w-[120px] px-4 py-2 text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditFollowUpModal



