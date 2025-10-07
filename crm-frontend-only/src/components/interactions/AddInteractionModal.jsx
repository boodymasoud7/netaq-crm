import { useState } from 'react'
import { 
  X, 
  Phone, 
  MessageSquare, 
  Users, 
  MapPin,
  Mail,
  FileText,
  Clock,
  Save,
  Zap,
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  Timer,
  User
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import toast from 'react-hot-toast'

const AddInteractionModal = ({ 
  isOpen, 
  onClose, 
  clientName, 
  clientId, 
  itemType = 'client',  // Default to 'client' for backward compatibility
  onAddInteraction 
}) => {
  const [interaction, setInteraction] = useState({
    type: 'call',
    title: '',
    description: '',
    duration: '',
    outcome: 'neutral',
    nextAction: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // أنواع التفاعلات مع الألوان والأيقونات
  const interactionTypes = [
    {
      id: 'call',
      label: 'مكالمة هاتفية',
      icon: <Phone className="h-4 w-4" />,
      color: 'bg-blue-500',
      defaultTitle: 'مكالمة هاتفية مع العميل'
    },
    {
      id: 'whatsapp',
      label: 'رسالة واتساب',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'bg-green-500',
      defaultTitle: 'تواصل عبر الواتساب'
    },
    {
      id: 'meeting',
      label: 'اجتماع',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-purple-500',
      defaultTitle: 'اجتماع مع العميل'
    },
    {
      id: 'visit',
      label: 'زيارة موقع',
      icon: <MapPin className="h-4 w-4" />,
      color: 'bg-orange-500',
      defaultTitle: 'زيارة موقع المشروع'
    },
    {
      id: 'email',
      label: 'بريد إلكتروني',
      icon: <Mail className="h-4 w-4" />,
      color: 'bg-red-500',
      defaultTitle: 'مراسلة عبر البريد الإلكتروني'
    },
    {
      id: 'proposal',
      label: 'إرسال عرض',
      icon: <FileText className="h-4 w-4" />,
      color: 'bg-indigo-500',
      defaultTitle: 'إرسال عرض سعر'
    }
  ]

  // نتائج التفاعل
  const outcomeOptions = [
    { id: 'positive', label: 'إيجابي', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
    { id: 'neutral', label: 'محايد', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-3 w-3" /> },
    { id: 'negative', label: 'سلبي', color: 'bg-red-100 text-red-800', icon: <X className="h-3 w-3" /> }
  ]

  // القوالب السريعة
  const quickTemplates = {
    call: [
      { title: 'مكالمة استفسار', description: 'الرد على استفسارات العميل حول المشروع', nextAction: 'إرسال كتالوج المشروع' },
      { title: 'مكالمة متابعة', description: 'متابعة اهتمام العميل بعد العرض', nextAction: 'تحديد موعد زيارة' },
      { title: 'مكالمة تأكيد', description: 'تأكيد موعد الزيارة أو الاجتماع', nextAction: 'إرسال تفاصيل الموعد' }
    ],
    whatsapp: [
      { title: 'إرسال صور الوحدات', description: 'مشاركة صور للوحدات المتاحة', nextAction: 'انتظار رد العميل' },
      { title: 'إرسال الأسعار', description: 'مشاركة قائمة الأسعار المحدثة', nextAction: 'مناقشة إمكانيات الدفع' },
      { title: 'إرسال الموقع', description: 'مشاركة موقع المشروع والمعارض', nextAction: 'تحديد موعد زيارة' }
    ],
    meeting: [
      { title: 'اجتماع تعريفي', description: 'لقاء أول للتعريف بالمشروع والخدمات', nextAction: 'تحضير عرض مخصص' },
      { title: 'اجتماع متابعة', description: 'مناقشة العرض المقدم والإجابة على الاستفسارات', nextAction: 'إرسال عرض نهائي' },
      { title: 'اجتماع توقيع', description: 'إتمام إجراءات التوقيع والحجز', nextAction: 'تحضير العقد' }
    ]
  }

  // التايمر
  useState(() => {
    let interval
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, startTime])

  const startTimer = () => {
    setStartTime(Date.now())
    setIsTimerRunning(true)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    if (startTime) {
      const totalMinutes = Math.floor((Date.now() - startTime) / 60000)
      setInteraction(prev => ({ ...prev, duration: totalMinutes.toString() }))
    }
  }

  const formatElapsedTime = (ms) => {
    const seconds = Math.floor(ms / 1000) % 60
    const minutes = Math.floor(ms / 60000)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleTypeChange = (typeId) => {
    const type = interactionTypes.find(t => t.id === typeId)
    setInteraction(prev => ({
      ...prev,
      type: typeId,
      title: type.defaultTitle
    }))
  }

  const applyTemplate = (template) => {
    setInteraction(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      nextAction: template.nextAction
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!interaction.title.trim() || !interaction.description.trim()) {
      toast.error('يرجى ملء العنوان والوصف')
      return
    }

    setIsSubmitting(true)
    
    try {
      const interactionData = {
        ...interaction,
        itemType: itemType,
        itemId: clientId,
        duration: parseInt(interaction.duration) || 0
      }
      
      await onAddInteraction(interactionData)
      toast.success('تم إضافة التفاعل بنجاح')
      
      // إعادة تعيين النموذج
      setInteraction({
        type: 'call',
        title: '',
        description: '',
        duration: '',
        outcome: 'neutral',
        nextAction: '',
        notes: ''
      })
      setElapsedTime(0)
      setStartTime(null)
      setIsTimerRunning(false)
      
      onClose()
    } catch (error) {
      console.error('خطأ في إضافة التفاعل:', error)
      toast.error('فشل في إضافة التفاعل')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const currentType = interactionTypes.find(t => t.id === interaction.type)
  const availableTemplates = quickTemplates[interaction.type] || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">إضافة تفاعل جديد</h2>
                <p className="text-blue-100 text-sm">تسجيل تفاعل مع العميل: {clientName}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-blue-100">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateArabic(new Date())}</span>
                  <span className="mx-1">•</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* نوع التفاعل */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">نوع التفاعل</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interactionTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      interaction.type === type.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${type.color} rounded-lg flex items-center justify-center text-white`}>
                        {type.icon}
                      </div>
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* القوالب السريعة */}
            {availableTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">قوالب سريعة</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availableTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      <h4 className="font-medium text-gray-900 text-sm">{template.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* معلومات أساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* العنوان */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  عنوان التفاعل <span className="text-red-500">*</span>
                </label>
                <Input
                  value={interaction.title}
                  onChange={(e) => setInteraction(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان التفاعل"
                  required
                />
              </div>

              {/* المدة والتايمر */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">المدة (بالدقائق)</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={interaction.duration}
                    onChange={(e) => setInteraction(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="flex-1"
                  />
                  <div className="flex gap-1">
                    {!isTimerRunning ? (
                      <Button
                        type="button"
                        onClick={startTimer}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white px-3"
                      >
                        <Timer className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={stopTimer}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white px-3"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {isTimerRunning && (
                  <p className="text-sm text-green-600 mt-1 font-mono">
                    جاري التوقيت: {formatElapsedTime(elapsedTime)}
                  </p>
                )}
              </div>
            </div>

            {/* الوصف */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                وصف التفاعل <span className="text-red-500">*</span>
              </label>
              <textarea
                value={interaction.description}
                onChange={(e) => setInteraction(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب تفاصيل التفاعل هنا..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                required
              />
            </div>

            {/* النتيجة والإجراء التالي */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* نتيجة التفاعل */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">نتيجة التفاعل</label>
                <div className="space-y-2">
                  {outcomeOptions.map((outcome) => (
                    <button
                      key={outcome.id}
                      type="button"
                      onClick={() => setInteraction(prev => ({ ...prev, outcome: outcome.id }))}
                      className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                        interaction.outcome === outcome.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {outcome.icon}
                      <span className="font-medium">{outcome.label}</span>
                      <Badge className={`ml-auto ${outcome.color}`}>
                        {outcome.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>

              {/* الإجراء التالي */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الإجراء التالي</label>
                <Input
                  value={interaction.nextAction}
                  onChange={(e) => setInteraction(prev => ({ ...prev, nextAction: e.target.value }))}
                  placeholder="ما هو الإجراء التالي المطلوب؟"
                />
              </div>
            </div>

            {/* ملاحظات إضافية */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">ملاحظات إضافية</label>
              <textarea
                value={interaction.notes}
                onChange={(e) => setInteraction(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="أي ملاحظات أو تفاصيل إضافية..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>

            {/* أزرار التحكم */}
            <div className="flex justify-end gap-3 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6"
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ التفاعل
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddInteractionModal



