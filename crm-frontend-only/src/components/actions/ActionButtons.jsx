import React, { useState } from 'react'
import { 
  MessageCircle, 
  Phone, 
  Edit, 
  Trash2, 
  Bell, 
  Eye,
  UserCheck,
  CheckSquare,
  MoreHorizontal,
  X,
  StickyNote
} from 'lucide-react'
import { Button } from '../ui/button'

import toast from 'react-hot-toast'

// زر WhatsApp
export function WhatsAppButton({ phone, name, message }) {
  const handleWhatsApp = () => {
    if (!phone) {
      toast.error('رقم الهاتف غير متوفر')
      return
    }
    
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const defaultMessage = message || `مرحباً ${name}، نود التواصل معك من شركة نطاق العقارية.`
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`
    
    window.open(whatsappUrl, '_blank')
    toast.success('تم فتح محادثة WhatsApp')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleWhatsApp}
      className="text-green-600 hover:text-white hover:bg-green-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
      title="تواصل عبر WhatsApp"
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  )
}

// زر الاتصال
export function CallButton({ phone }) {
  const handleCall = () => {
    if (!phone) {
      toast.error('رقم الهاتف غير متوفر')
      return
    }
    
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    window.open(`tel:${cleanPhone}`, '_blank')
    toast.success('جاري الاتصال...')
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCall}
      className="text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
      title="اتصال"
    >
      <Phone className="h-4 w-4" />
    </Button>
  )
}

// زر التفاعلات - البديل للملاحظات
export function InteractionsButton({ onAddInteraction, itemId, itemName, itemType = 'client' }) {
  const [showModal, setShowModal] = useState(false)
  const [interactionData, setInteractionData] = useState({
    type: 'call',
    title: '',
    description: '',
    outcome: 'positive'
  })

  const handleSubmit = () => {
    if (!interactionData.title.trim()) {
      toast.error('يرجى إدخال عنوان للتفاعل')
      return
    }
    
    if (!interactionData.description.trim()) {
      toast.error('يرجى إدخال وصف للتفاعل')
      return
    }

    const interaction = {
      ...interactionData,
      itemType,
      itemId,
      duration: 0
    }

    onAddInteraction(interaction)
      setShowModal(false)
    setInteractionData({
      type: 'call',
      title: '',
      description: '',
      outcome: 'positive'
    })
    toast.success('تم إضافة التفاعل بنجاح')
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="text-purple-600 hover:text-white hover:bg-purple-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
        title="إضافة تفاعل"
      >
        <UserCheck className="h-4 w-4" />
      </Button>

            {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">إضافة تفاعل جديد</h3>
                    <p className="text-purple-100 text-sm">مع {itemName}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* نوع التفاعل */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">نوع التفاعل</label>
                <select
                  value={interactionData.type}
                  onChange={(e) => setInteractionData({...interactionData, type: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="call">📞 اتصال هاتفي</option>
                  <option value="whatsapp">💬 رسالة WhatsApp</option>
                  <option value="meeting">🤝 اجتماع</option>
                  <option value="email">📧 بريد إلكتروني</option>
                  <option value="visit">🏢 زيارة</option>
                </select>
              </div>

              {/* النتيجة - أزرار كبيرة */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">النتيجة</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setInteractionData({...interactionData, outcome: 'positive'})}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      interactionData.outcome === 'positive'
                        ? 'border-green-500 bg-green-50 shadow-lg'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-1">✅</div>
                      <div className="text-sm font-bold text-green-700">إيجابي</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInteractionData({...interactionData, outcome: 'neutral'})}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      interactionData.outcome === 'neutral'
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-1">⚪</div>
                      <div className="text-sm font-bold text-yellow-700">محايد</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInteractionData({...interactionData, outcome: 'negative'})}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      interactionData.outcome === 'negative'
                        ? 'border-red-500 bg-red-50 shadow-lg'
                        : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-1">❌</div>
                      <div className="text-sm font-bold text-red-700">سلبي</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* القوالب السريعة الشاملة */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">قوالب سريعة</label>
                
                {/* قوالب إيجابية */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-green-700 mb-2">🟢 إيجابية</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'positive',
                        type: 'call',
                        title: 'مهتم جداً',
                        description: 'العميل أبدى اهتمام كبير بالخدمة وطلب المزيد من التفاصيل'
                      })}
                      className="p-2 text-sm bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-right transition-all"
                    >
                      👍 مهتم جداً
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'positive',
                        type: 'email',
                        title: 'طلب عرض سعر',
                        description: 'العميل طلب إرسال عرض سعر تفصيلي للخدمات'
                      })}
                      className="p-2 text-sm bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-right transition-all"
                    >
                      💰 طلب عرض سعر
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'positive',
                        type: 'meeting',
                        title: 'حجز موعد',
                        description: 'تم حجز موعد لاجتماع أو زيارة لمناقشة التفاصيل'
                      })}
                      className="p-2 text-sm bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-right transition-all"
                    >
                      📅 حجز موعد
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'positive',
                        type: 'call',
                        title: 'جاهز للشراء',
                        description: 'العميل جاهز لاتخاذ قرار الشراء قريباً'
                      })}
                      className="p-2 text-sm bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-right transition-all"
                    >
                      ✅ جاهز للشراء
                    </button>
                  </div>
                </div>

                {/* قوالب محايدة */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-yellow-700 mb-2">🟡 محايدة</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'neutral',
                        type: 'call',
                        title: 'يفكر في الأمر',
                        description: 'العميل يحتاج وقت للتفكير قبل اتخاذ القرار'
                      })}
                      className="p-2 text-sm bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg text-right transition-all"
                    >
                      🤔 يفكر في الأمر
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'neutral',
                        type: 'call',
                        title: 'طلب معاودة الاتصال',
                        description: 'العميل طلب الاتصال به في وقت لاحق'
                      })}
                      className="p-2 text-sm bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg text-right transition-all"
                    >
                      📞 معاودة اتصال
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'neutral',
                        type: 'call',
                        title: 'مشغول حالياً',
                        description: 'العميل مشغول ولم يتمكن من إكمال المحادثة'
                      })}
                      className="p-2 text-sm bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg text-right transition-all"
                    >
                      ⏳ مشغول
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'neutral',
                        type: 'call',
                        title: 'يحتاج استشارة',
                        description: 'العميل يحتاج استشارة شخص آخر قبل القرار'
                      })}
                      className="p-2 text-sm bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg text-right transition-all"
                    >
                      👥 يحتاج استشارة
                    </button>
                  </div>
                </div>

                {/* قوالب سلبية */}
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-2">🔴 سلبية</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'negative',
                        type: 'call',
                        title: 'غير مهتم',
                        description: 'العميل غير مهتم بالخدمة في الوقت الحالي'
                      })}
                      className="p-2 text-sm bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-right transition-all"
                    >
                      🚫 غير مهتم
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'negative',
                        type: 'call',
                        title: 'السعر مرتفع',
                        description: 'العميل يرى أن السعر غير مناسب له'
                      })}
                      className="p-2 text-sm bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-right transition-all"
                    >
                      💸 السعر مرتفع
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'negative',
                        type: 'call',
                        title: 'أجل القرار',
                        description: 'العميل قرر تأجيل القرار لفترة لاحقة'
                      })}
                      className="p-2 text-sm bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-right transition-all"
                    >
                      ⏸️ أجل القرار
                    </button>
                    <button
                      type="button"
                      onClick={() => setInteractionData({
                        ...interactionData,
                        outcome: 'negative',
                        type: 'call',
                        title: 'رفض العرض',
                        description: 'العميل رفض العرض المقدم بشكل نهائي'
                      })}
                      className="p-2 text-sm bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-right transition-all"
                    >
                      ❌ رفض العرض
                    </button>
                  </div>
                </div>
              </div>

              {/* حقول قابلة للتعديل */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">عنوان التفاعل</label>
                <input
                  type="text"
                  value={interactionData.title}
                  onChange={(e) => setInteractionData({...interactionData, title: e.target.value})}
                  placeholder="يمكنك التعديل أو اختيار قالب سريع"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">تفاصيل التفاعل</label>
                <textarea
                  value={interactionData.description}
                  onChange={(e) => setInteractionData({...interactionData, description: e.target.value})}
                  placeholder="يمكنك إضافة تفاصيل إضافية..."
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  إضافة التفاعل
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// زر المهام
export function TaskButton({ onAddTask, itemId, itemName }) {
  const [showModal, setShowModal] = useState(false)
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  })

  const handleSubmit = () => {
    if (!taskData.title.trim()) {
      toast.error('يرجى إدخال عنوان للمهمة')
      return
    }

      const task = {
      id: Date.now(),
        ...taskData,
        itemId,
        itemName,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    onAddTask(task)
    setShowModal(false)
      setTaskData({
        title: '',
        description: '',
      priority: 'medium',
      dueDate: ''
    })
    toast.success('تم إضافة المهمة بنجاح')
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="text-orange-600 hover:text-white hover:bg-orange-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
        title="إضافة مهمة"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">إضافة مهمة جديدة</h3>
                <Button
                variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium mb-2">عنوان المهمة</label>
                  <input
                    type="text"
                    value={taskData.title}
                    onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                  placeholder="عنوان المهمة"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الوصف</label>
                <textarea
                  value={taskData.description}
                  onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                  placeholder="تفاصيل المهمة"
                  rows="3"
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الأولوية</label>
                <select
                  value={taskData.priority}
                  onChange={(e) => setTaskData({...taskData, priority: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={taskData.dueDate}
                  onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
                <Button
                onClick={handleSubmit}
                className="flex-1"
                >
                إضافة المهمة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                className="flex-1"
                >
                  إلغاء
                </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// زر الملاحظات - بديل زر التذكيرات
export function NotesButton({ onAddNote, itemId, itemName, notesCount = 0 }) {
  const [showModal, setShowModal] = useState(false)
  const [noteData, setNoteData] = useState({
    title: '',
    content: '',
    type: 'general'
  })

  const handleSubmit = () => {
    if (!noteData.content.trim()) {
      toast.error('يرجى إدخال محتوى الملاحظة')
      return
    }

    const note = {
      id: Date.now(),
      ...noteData,
      itemId,
      itemName,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user'
    }

    onAddNote(note)
    setShowModal(false)
    setNoteData({
      title: '',
      content: '',
      type: 'general'
    })
    toast.success('تم إضافة الملاحظة بنجاح')
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="relative text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
        title={`إضافة ملاحظة ${notesCount > 0 ? `(${notesCount} ملاحظة)` : ''}`}
      >
        <StickyNote className="h-4 w-4" />
        {notesCount > 0 && (
          <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px] leading-none">
            {notesCount > 9 ? '9+' : notesCount}
          </div>
        )}
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                    <StickyNote className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">إضافة ملاحظة جديدة</h3>
                    <p className="text-blue-100 text-sm mt-1">📝 لـ {itemName}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-blue-100">
                      <div className="w-1.5 h-1.5 bg-blue-300 rounded-full"></div>
                      <span>{new Date().toLocaleDateString('ar-EG', { 
                        timeZone: 'Africa/Cairo',
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Enhanced Content */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    نوع الملاحظة
                  </label>
                  <select
                    value={noteData.type}
                    onChange={(e) => setNoteData({...noteData, type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="general">📝 عامة</option>
                    <option value="important">⭐ مهمة</option>
                    <option value="follow-up">🔄 متابعة</option>
                    <option value="meeting">🤝 اجتماع</option>
                    <option value="call">📞 مكالمة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    الأولوية
                  </label>
                  <select
                    value={noteData.priority || 'medium'}
                    onChange={(e) => setNoteData({...noteData, priority: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">🟢 منخفضة</option>
                    <option value="medium">🟡 متوسطة</option>
                    <option value="high">🔴 عالية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  عنوان الملاحظة
                </label>
                <input
                  type="text"
                  value={noteData.title}
                  onChange={(e) => setNoteData({...noteData, title: e.target.value})}
                  placeholder="مثال: مناقشة تفاصيل المشروع الجديد"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  محتوى الملاحظة *
                </label>
                <textarea
                  value={noteData.content}
                  onChange={(e) => setNoteData({...noteData, content: e.target.value})}
                  placeholder="اكتب تفاصيل الملاحظة، النقاط المهمة، والمتابعة المطلوبة..."
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {noteData.content.length}/500 حرف
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    <span>اضغط Ctrl+Enter للحفظ السريع</span>
                  </div>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  قوالب سريعة
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNoteData({...noteData, title: 'مكالمة هاتفية', content: 'تم التواصل مع العميل هاتفياً لمناقشة المتطلبات والإجابة على الاستفسارات.', type: 'call'})}
                    className="p-3 text-sm bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl text-right transition-all duration-200 border border-blue-200"
                  >
                    📞 مكالمة هاتفية
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteData({...noteData, title: 'اجتماع عمل', content: 'تم عقد اجتماع لمناقشة تفاصيل المشروع والاتفاق على الخطوات التالية.', type: 'meeting'})}
                    className="p-3 text-sm bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl text-right transition-all duration-200 border border-green-200"
                  >
                    🤝 اجتماع عمل
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteData({...noteData, title: 'متابعة مطلوبة', content: 'العميل بحاجة إلى متابعة خلال الأسبوع القادم لاستكمال الإجراءات.', type: 'follow-up', priority: 'high'})}
                    className="p-3 text-sm bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-xl text-right transition-all duration-200 border border-yellow-200"
                  >
                    🔄 متابعة مطلوبة
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteData({...noteData, title: 'ملاحظة مهمة', content: 'معلومات مهمة تحتاج إلى تسجيل وحفظ للمراجعة المستقبلية.', type: 'important', priority: 'high'})}
                    className="p-3 text-sm bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl text-right transition-all duration-200 border border-red-200"
                  >
                    ⭐ ملاحظة مهمة
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  💾 حفظ الملاحظة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 py-3 rounded-xl transition-all duration-200"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// زر التعديل
export function EditButton({ onEdit, item }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onEdit(item)}
      className="text-purple-600 hover:text-white hover:bg-purple-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
      title="تعديل"
    >
      <Edit className="h-4 w-4" />
    </Button>
  )
}

// زر الحذف
export function DeleteButton({ onDelete, item, itemName }) {
  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف ${itemName || 'هذا العنصر'}؟`)) {
      onDelete(item)
      toast.success('تم الحذف بنجاح')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      className="text-red-600 hover:text-white hover:bg-red-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
      title="حذف"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}

// زر العرض
export function ViewButton({ onView, item }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onView(item)}
      className="text-blue-600 hover:text-white hover:bg-blue-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
      title="عرض التفاصيل"
    >
      <Eye className="h-4 w-4" />
    </Button>
  )
}

// قائمة منسدلة للإجراءات - تفتح في وسط الشاشة
export function ActionDropdown({ 
  item, 
  onEdit, 
  onDelete, 
  onView, 
  onReminder,
  additionalActions = []
}) {
  const [isOpen, setIsOpen] = useState(false)

  // إنشاء قائمة الإجراءات الافتراضية مع الأيقونات
  const defaultActions = [
    { 
      label: 'عرض التفاصيل',
      icon: Eye, 
      color: 'text-blue-600 hover:bg-blue-50',
      onClick: () => onView?.(item)
    },
    { 
      label: 'تعديل البيانات',
      icon: Edit, 
      color: 'text-purple-600 hover:bg-purple-50',
      onClick: () => onEdit?.(item)
    },
    { 
      label: 'إضافة تذكير',
      icon: Bell, 
      color: 'text-yellow-600 hover:bg-yellow-50',
      onClick: () => onReminder?.(item)
    },
    ...additionalActions,
    { 
      label: 'حذف نهائياً',
      icon: Trash2, 
      color: 'text-red-600 hover:bg-red-50',
      onClick: () => onDelete?.(item)
    }
  ]

  // تصفية الإجراءات المتاحة فقط
  const availableActions = defaultActions.filter(action => action.onClick)

  // إغلاق القائمة عند الضغط خارجها
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-white hover:bg-gray-600 transition-all duration-200 hover:scale-110 rounded-lg p-2 shadow-sm hover:shadow-md"
        title="المزيد من الإجراءات"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

            {/* القائمة المنسدلة في وسط الشاشة */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-lg flex items-center justify-center">
                    <MoreHorizontal className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">الإجراءات المتاحة</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 space-y-1">
              {availableActions.map((action, index) => {
                const IconComponent = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => {
                      action.onClick()
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 text-right transition-all duration-200 ${action.color} hover:bg-gray-50 rounded-xl hover:shadow-sm transform hover:scale-[1.02]`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm flex-1">{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// تصدير افتراضي
export default {
  WhatsAppButton,
  CallButton,
  InteractionsButton,
  TaskButton,
  NotesButton,
  EditButton,
  DeleteButton,
  ViewButton,
  ActionDropdown
}
