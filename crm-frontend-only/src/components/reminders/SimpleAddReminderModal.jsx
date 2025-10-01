import React, { useState, useEffect } from 'react'
import { X, Clock, Calendar, Flag, User, FileText } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import toast from 'react-hot-toast'

export default function SimpleAddReminderModal({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth()
  const { addReminder } = useApi()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    remind_at: '',
    priority: 'medium',
    client_name: ''
  })
  const [loading, setLoading] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentDateTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now
      const localDateTime = currentDateTime.toISOString().slice(0, 16) // Format for datetime-local

      setFormData({
        title: '',
        description: '',
        remind_at: localDateTime,
        priority: 'medium',
        client_name: ''
      })
    }
  }, [isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان التذكير')
      return
    }

    if (!formData.remind_at) {
      toast.error('يرجى تحديد وقت التذكير')
      return
    }

    setLoading(true)
    try {
      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        remind_at: formData.remind_at,
        priority: formData.priority,
        client_name: formData.client_name.trim() || null,
        status: 'pending',
        completed: false,
        assignedTo: currentUser?.id,
        createdBy: currentUser?.id
      }

      await addReminder(reminderData)
      toast.success('✅ تم إنشاء التذكير بنجاح!')
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating reminder:', error)
      toast.error('خطأ في إنشاء التذكير')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            إضافة تذكير جديد
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              عنوان التذكير *
            </label>
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="مثال: اتصال مع العميل أحمد"
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف التذكير
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="تفاصيل إضافية حول التذكير..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              وقت التذكير *
            </label>
            <Input
              type="datetime-local"
              value={formData.remind_at}
              onChange={(e) => handleInputChange('remind_at', e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* Priority and Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="h-4 w-4 inline mr-1" />
                الأولوية
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                اسم العميل
              </label>
              <Input
                value={formData.client_name}
                onChange={(e) => handleInputChange('client_name', e.target.value)}
                placeholder="اختياري"
                className="w-full"
              />
            </div>
          </div>

          {/* Quick Time Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              أوقات سريعة
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: 'بعد ساعة',
                  action: () => {
                    const later = new Date(Date.now() + 60 * 60 * 1000)
                    handleInputChange('remind_at', later.toISOString().slice(0, 16))
                  }
                },
                {
                  label: 'غداً 9 ص',
                  action: () => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    tomorrow.setHours(9, 0, 0, 0)
                    handleInputChange('remind_at', tomorrow.toISOString().slice(0, 16))
                  }
                },
                {
                  label: 'غداً 2 ظ',
                  action: () => {
                    const tomorrow = new Date()
                    tomorrow.setDate(tomorrow.getDate() + 1)
                    tomorrow.setHours(14, 0, 0, 0)
                    handleInputChange('remind_at', tomorrow.toISOString().slice(0, 16))
                  }
                },
                {
                  label: 'الأسبوع القادم',
                  action: () => {
                    const nextWeek = new Date()
                    nextWeek.setDate(nextWeek.getDate() + 7)
                    nextWeek.setHours(10, 0, 0, 0)
                    handleInputChange('remind_at', nextWeek.toISOString().slice(0, 16))
                  }
                }
              ].map((option, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={option.action}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التذكير'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

