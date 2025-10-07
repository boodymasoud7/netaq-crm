/**
 * مودال نتيجة المتابعة الذكي - Smart Follow-up Result Modal
 * يسمح للمستخدم باختيار نتيجة المتابعة وتحديد الإجراء التالي بذكاء
 */

import React, { useState } from 'react'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Trophy,
  Phone,
  MessageCircle,
  Mail,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react'

const FollowUpResultModal = ({ 
  isOpen, 
  onClose, 
  followUp, 
  onResult 
}) => {
  const [selectedResult, setSelectedResult] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resultOptions = [
    // النتائج الإيجابية 🟢
    {
      id: 'مهتم',
      title: '😊 مهتم',
      description: 'العميل مهتم ويريد المتابعة',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: '📞 متابعة ثانية خلال يومين',
      category: 'positive'
    },
    {
      id: 'مهتم جداً',
      title: '🤩 مهتم جداً',
      description: 'العميل متحمس جداً للخدمة',
      icon: Trophy,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      action: '🚀 عرض تقديمي عاجل خلال يومين',
      category: 'positive'
    },
    {
      id: 'طلب عرض سعر',
      title: '💰 طلب عرض سعر',
      description: 'العميل طلب عرض سعر تفصيلي',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      action: '📧 إرسال عرض سعر ومتابعة خلال يومين',
      category: 'positive'
    },
    {
      id: 'يريد اجتماع',
      title: '🤝 يريد اجتماع',
      description: 'العميل يريد اجتماع أو عرض تقديمي',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: '📅 جدولة اجتماع خلال يومين',
      category: 'positive'
    },
    {
      id: 'يريد معلومات أكثر',
      title: '📋 يريد معلومات أكثر',
      description: 'العميل يحتاج معلومات إضافية',
      icon: MessageCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      action: '📄 إرسال معلومات ومتابعة خلال يومين',
      category: 'positive'
    },

    // النتائج المؤجلة 🟡
    {
      id: 'يحتاج وقت',
      title: '⏳ يحتاج وقت',
      description: 'العميل يحتاج وقت إضافي للقرار',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      action: '🔄 متابعة دورية بعد أسبوع',
      category: 'delayed'
    },
    {
      id: 'سيتصل لاحقاً',
      title: '📞 سيتصل لاحقاً',
      description: 'العميل وعد بالاتصال لاحقاً',
      icon: Phone,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      action: '⏰ متابعة للتأكد خلال 5 أيام',
      category: 'delayed'
    },
    {
      id: 'مشغول',
      title: '⏰ مشغول',
      description: 'العميل مشغول الآن',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      action: '🔄 إعادة الاتصال غداً',
      category: 'delayed'
    },
    {
      id: 'في اجتماع',
      title: '👥 في اجتماع',
      description: 'العميل في اجتماع',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      action: '🔄 إعادة الاتصال غداً',
      category: 'delayed'
    },

    // النتائج المحايدة/المشكوك فيها 🔶
    {
      id: 'لا يرد',
      title: '📵 لا يرد',
      description: 'العميل لا يجيب على الهاتف',
      icon: Phone,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      action: '🔔 محاولة أخيرة بعد أسبوع',
      category: 'neutral'
    },

    // النتائج السلبية ❌
    {
      id: 'غير مهتم',
      title: '😐 غير مهتم',
      description: 'العميل غير مهتم حالياً',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: '⏸️ إيقاف المتابعة مؤقتاً',
      category: 'negative'
    },
    {
      id: 'غير مهتم نهائياً',
      title: '❌ غير مهتم نهائياً',
      description: 'العميل رفض نهائياً',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: '🛑 إيقاف جميع المتابعات',
      category: 'negative'
    },
    {
      id: 'رقم خطأ',
      title: '📱 رقم خطأ',
      description: 'الرقم خطأ أو غير صحيح',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: '🚫 إيقاف المتابعة',
      category: 'negative'
    },

    // النتائج النجاح 🎉
    {
      id: 'محول',
      title: '✅ محول لعميل',
      description: 'تم تحويل العميل المحتمل لعميل فعلي',
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: '🎉 تمت المهمة بنجاح!',
      category: 'success'
    },
    {
      id: 'مكتمل',
      title: '🎉 مكتمل',
      description: 'تمت الصفقة بنجاح',
      icon: Trophy,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: '🏆 تم إنجاز الهدف!',
      category: 'success'
    }
  ]

  // تجميع النتائج حسب الفئة
  const groupedOptions = {
    positive: resultOptions.filter(opt => opt.category === 'positive'),
    delayed: resultOptions.filter(opt => opt.category === 'delayed'),
    neutral: resultOptions.filter(opt => opt.category === 'neutral'),
    negative: resultOptions.filter(opt => opt.category === 'negative'),
    success: resultOptions.filter(opt => opt.category === 'success')
  }

  const categoryLabels = {
    positive: '✅ نتائج إيجابية',
    delayed: '⏳ يحتاج وقت',
    neutral: '🔶 محايد',
    negative: '❌ غير مهتم',
    success: '🎉 نجاح'
  }

  const handleSubmit = async () => {
    if (!selectedResult) {
      alert('يرجى اختيار نتيجة المتابعة')
      return
    }

    setIsSubmitting(true)
    try {
      // استخدام النتيجة الجديدة
      if (onResult) {
        await onResult(followUp.id, selectedResult, notes)
      }
      onClose()
    } catch (error) {
      console.error('Error submitting result:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedResult('')
    setNotes('')
    onClose()
  }

  if (!isOpen) return null

  const selectedOption = resultOptions.find(opt => opt.id === selectedResult)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🧠 نتيجة المتابعة الذكية</h2>
            <p className="text-sm text-gray-600 mt-1">
              {followUp?.leadName ? `العميل: ${followUp.leadName}` : 'تحديد نتيجة المتابعة'}
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
        <div className="p-6">
          {/* Follow-up Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">{followUp?.title}</h3>
            </div>
            <p className="text-gray-600 text-sm">{followUp?.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-md bg-white">
                {followUp?.type === 'call' ? '📞 مكالمة' : 
                 followUp?.type === 'whatsapp' ? '💬 واتساب' : 
                 followUp?.type === 'email' ? '📧 إيميل' : followUp?.type}
              </span>
              <span className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-md bg-white">
                {followUp?.priority === 'urgent' ? '🔴 عاجل' :
                 followUp?.priority === 'high' ? '🟠 عالية' :
                 followUp?.priority === 'medium' ? '🟡 متوسطة' : 
                 followUp?.priority === 'low' ? '🟢 منخفضة' : followUp?.priority}
              </span>
            </div>
          </div>

          {/* Result Options by Category */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-4">ما هي نتيجة المتابعة؟</h4>
            
            {Object.entries(groupedOptions).map(([category, options]) => {
              if (options.length === 0) return null
              
              return (
                <div key={category} className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3 px-2">
                    {categoryLabels[category]}
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {options.map((option) => {
                      const Icon = option.icon
                      const isSelected = selectedResult === option.id
                      
                      return (
                        <div
                          key={option.id}
                          onClick={() => setSelectedResult(option.id)}
                          className={`
                            cursor-pointer rounded-lg border-2 p-3 transition-all
                            ${isSelected 
                              ? `${option.borderColor} ${option.bgColor} shadow-md transform scale-105` 
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-1 ${isSelected ? option.color : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <h6 className={`font-semibold text-sm ${isSelected ? option.color : 'text-gray-900'}`}>
                                {option.title}
                              </h6>
                              <p className="text-xs text-gray-600 mt-1 leading-tight">{option.description}</p>
                              <p className={`text-xs mt-2 font-medium ${isSelected ? option.color : 'text-gray-500'}`}>
                                → {option.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected Result Preview */}
          {selectedOption && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${selectedOption.borderColor} ${selectedOption.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <selectedOption.icon className={`w-5 h-5 ${selectedOption.color}`} />
                <span className={`font-semibold ${selectedOption.color}`}>
                  الإجراء المحدد: {selectedOption.title}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{selectedOption.action}</p>
              <div className="mt-2 text-xs text-gray-600">
                ✨ سيتم إنشاء المتابعة التالية تلقائياً حسب هذه النتيجة
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات إضافية (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات حول المحادثة أو تفاصيل إضافية..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedResult || isSubmitting}
            className="min-w-[140px] px-4 py-2 text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري المعالجة...
              </div>
            ) : (
              '🚀 تطبيق النتيجة'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FollowUpResultModal