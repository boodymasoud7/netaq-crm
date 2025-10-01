import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import {
  XCircle,
  Calendar,
  Target,
  MessageSquare,
  Flag,
  Phone,
  User,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

const CreateFollowUpModal = ({ isOpen, onClose, client, onFollowUpCreated, api }) => {
  const { user: currentUser } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // الحالة الأولية للمتابعة الجديدة
  const getInitialState = () => ({
    type: 'call',
    title: client ? `متابعة مع العميل - ${client.name}` : '',
    description: '',
    scheduledDate: '',
    priority: 'medium',
    leadId: null,
    clientId: client?.id || null,
    status: 'pending' // <-- تم إضافة الحالة الافتراضية هنا
  })

  const [newFollowUp, setNewFollowUp] = useState(getInitialState())

  // إعادة تعيين البيانات عند تغيير العميل أو فتح المودال
  useEffect(() => {
    if (isOpen) {
      setNewFollowUp(getInitialState())
    }
  }, [isOpen, client])

  // خيارات نوع المتابعة
  const typeOptions = [
    { value: 'call', label: 'مكالمة' },
    { value: 'meeting', label: 'اجتماع' },
    { value: 'email', label: 'بريد إلكتروني' },
    { value: 'visit', label: 'زيارة' },
    { value: 'whatsapp', label: 'واتساب' },
    { value: 'demo', label: 'عرض توضيحي' }
  ]

  // خيارات الأولوية
  const priorityOptions = [
    { value: 'low', label: 'منخفضة' },
    { value: 'medium', label: 'متوسطة' },
    { value: 'high', label: 'عالية' },
    { value: 'urgent', label: 'عاجلة' }
  ]

  // --- دالة الإرسال المعدلة ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // التحقق من البيانات المطلوبة
      if (!newFollowUp.title?.trim()) {
        toast.error('يرجى إدخال عنوان المتابعة')
        setIsSubmitting(false)
        return
      }
      
      if (!newFollowUp.scheduledDate) {
        toast.error('يرجى تحديد موعد المتابعة')
        setIsSubmitting(false)
        return
      }

      // إعداد بيانات المتابعة لإرسالها
      const followUpData = {
        ...newFollowUp,
        assignedTo: currentUser?.id,
        createdBy: currentUser?.id,
        // التأكد من أن القيم النصية نظيفة
        title: newFollowUp.title.trim(),
        description: newFollowUp.description?.trim() || null,
      }
      
      console.log('📋 Creating follow-up with data:', followUpData)

      const response = await api.createFollowUp(followUpData)
      
      if (response.success) {
        const createdFollowUp = response.data
        
        console.log('✅ Follow-up created successfully:', createdFollowUp.title)
        toast.success(`تم إنشاء متابعة للعميل: ${client?.name}`)
        
        onFollowUpCreated?.(createdFollowUp)
        onClose() // إغلاق المودال بعد النجاح

      } else {
        const errorMessage = response.message || 'فشل في إنشاء المتابعة'
        console.error('❌ Failed to create follow-up:', errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('❌ Error creating follow-up:', error)
      const errorMessage = error.message || 'حدث خطأ غير متوقع'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-700 text-white p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">إضافة متابعة جديدة</h3>
                <p className="text-green-100 text-sm">
                  {client ? `للعميل: ${client.name}` : 'املأ البيانات الأساسية للمتابعة'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  نوع المتابعة *
                </label>
                <select
                  value={newFollowUp.type}
                  onChange={(e) => setNewFollowUp(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                  disabled={isSubmitting}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Flag className="h-4 w-4 text-green-500" />
                  الأولوية *
                </label>
                <select
                  value={newFollowUp.priority}
                  onChange={(e) => setNewFollowUp(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                  disabled={isSubmitting}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* عنوان المتابعة */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Target className="h-4 w-4 text-green-500" />
                عنوان المتابعة *
              </label>
              <Input
                value={newFollowUp.title}
                onChange={(e) => setNewFollowUp(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان المتابعة..."
                required
                disabled={isSubmitting}
              />
            </div>

            {/* الوصف */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                الوصف (اختياري)
              </label>
              <Textarea
                value={newFollowUp.description}
                onChange={(e) => setNewFollowUp(prev => ({ ...prev, description: e.target.value }))}
                placeholder="تفاصيل المتابعة..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            {/* الموعد المحدد */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 text-green-500" />
                الموعد المحدد *
              </label>
              <Input
                type="datetime-local"
                value={newFollowUp.scheduledDate}
                onChange={(e) => setNewFollowUp(prev => ({ ...prev, scheduledDate: e.target.value }))}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Client Info */}
            {client && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">مرتبط بالعميل</h4>
                </div>
                <div className="text-sm text-blue-600">
                  <p><strong>الاسم:</strong> {client.name}</p>
                  {client.phone && <p><strong>الهاتف:</strong> {client.phone}</p>}
                  {client.email && <p><strong>البريد:</strong> {client.email}</p>}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with Buttons */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-xl flex justify-end space-x-2 rtl:space-x-reverse">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px] px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] px-4 py-2 text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  إنشاء المتابعة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateFollowUpModal