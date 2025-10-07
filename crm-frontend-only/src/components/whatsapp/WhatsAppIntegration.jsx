import React, { useState } from 'react'
import { MessageCircle, Phone, Send, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import toast from 'react-hot-toast'

// قوالب الرسائل المعدة مسبقاً
const MESSAGE_TEMPLATES = {
  welcome: {
    title: 'رسالة ترحيب',
    text: 'مرحباً {name}، نشكرك على اهتمامك بخدماتنا. نحن هنا لمساعدتك.'
  },
  followUp: {
    title: 'متابعة العميل',
    text: 'مرحباً {name}، أردنا متابعتك بخصوص طلبك. هل لديك أي استفسارات إضافية؟'
  },
  appointment: {
    title: 'تحديد موعد',
    text: 'مرحباً {name}، نود تحديد موعد لزيارة العقار في {location}. هل يناسبك {date} في {time}؟'
  },
  offer: {
    title: 'عرض خاص',
    text: 'مرحباً {name}، لدينا عرض خاص على العقار في {location} بسعر {price}. العرض محدود لفترة قصيرة.'
  },
  reminder: {
    title: 'تذكير بالموعد',
    text: 'مرحباً {name}، نذكرك بموعدنا غداً في {time} لزيارة العقار في {location}.'
  }
}

export default function WhatsAppIntegration({ 
  clientData, 
  onSendMessage, 
  className = "" 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [messageVariables, setMessageVariables] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // تنسيق رقم الهاتف للواتساب
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return ''
    
    // إزالة جميع الرموز غير الرقمية
    let cleanPhone = phone.replace(/\D/g, '')
    
    // إضافة كود الدولة إذا لم يكن موجوداً
    if (!cleanPhone.startsWith('20') && cleanPhone.length === 11) {
      cleanPhone = '2' + cleanPhone
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone
    }
    
    return cleanPhone
  }

  // إنشاء رابط الواتساب
  const generateWhatsAppLink = (phone, message) => {
    const formattedPhone = formatPhoneForWhatsApp(phone)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  }

  // معالجة متغيرات القالب
  const processTemplate = (template) => {
    let processedText = template.text
    
    // استبدال المتغيرات الأساسية
    processedText = processedText.replace('{name}', clientData?.name || '[الاسم]')
    
    // استبدال المتغيرات المخصصة
    Object.entries(messageVariables).forEach(([key, value]) => {
      processedText = processedText.replace(`{${key}}`, value)
    })
    
    return processedText
  }

  // إرسال الرسالة
  const handleSendMessage = async () => {
    if (!clientData?.phone) {
      toast.error('رقم هاتف العميل غير متوفر')
      return
    }

    setIsLoading(true)

    try {
      let messageText = customMessage
      
      if (selectedTemplate && MESSAGE_TEMPLATES[selectedTemplate]) {
        messageText = processTemplate(MESSAGE_TEMPLATES[selectedTemplate])
      }

      if (!messageText.trim()) {
        toast.error('يرجى كتابة رسالة أو اختيار قالب')
        setIsLoading(false)
        return
      }

      const whatsappLink = generateWhatsAppLink(clientData.phone, messageText)
      
      // فتح الواتساب
      window.open(whatsappLink, '_blank')
      
      // حفظ سجل الرسالة (إذا كانت الدالة متوفرة)
      if (onSendMessage) {
        await onSendMessage({
          clientId: clientData.id,
          clientName: clientData.name,
          phone: clientData.phone,
          message: messageText,
          platform: 'whatsapp',
          timestamp: new Date()
        })
      }

      toast.success('تم فتح الواتساب بنجاح')
      
      // إعادة تعيين النموذج
      setCustomMessage('')
      setSelectedTemplate('')
      setMessageVariables({})
      
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error)
      toast.error('حدث خطأ في إرسال الرسالة')
    } finally {
      setIsLoading(false)
    }
  }

  // نسخ رقم الهاتف
  const copyPhoneNumber = () => {
    const formattedPhone = formatPhoneForWhatsApp(clientData?.phone)
    if (formattedPhone) {
      navigator.clipboard.writeText(formattedPhone)
      toast.success('تم نسخ رقم الهاتف')
    }
  }

  // إجراءات سريعة
  const quickActions = [
    {
      title: 'اتصال مباشر',
      icon: Phone,
      action: () => window.open(`tel:${clientData?.phone}`, '_self'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'واتساب',
      icon: MessageCircle,
      action: () => {
        const link = generateWhatsAppLink(clientData?.phone, `مرحباً ${clientData?.name || ''}`)
        window.open(link, '_blank')
      },
      color: 'bg-green-500 hover:bg-green-600'
    }
  ]

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">تكامل الواتساب</h3>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            متصل
          </Badge>
        </div>

        {/* Client Info */}
        {clientData && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{clientData.name}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  {clientData.phone}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPhoneNumber}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </p>
              </div>
              <div className="flex gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    onClick={action.action}
                    className={`${action.color} text-white`}
                  >
                    <action.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Templates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            قوالب الرسائل
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">اختر قالب...</option>
            {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>
                {template.title}
              </option>
            ))}
          </select>
        </div>

        {/* Template Variables */}
        {selectedTemplate && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              متغيرات القالب
            </label>
            {selectedTemplate === 'appointment' && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="الموقع"
                  value={messageVariables.location || ''}
                  onChange={(e) => setMessageVariables({
                    ...messageVariables,
                    location: e.target.value
                  })}
                />
                <Input
                  placeholder="التاريخ"
                  value={messageVariables.date || ''}
                  onChange={(e) => setMessageVariables({
                    ...messageVariables,
                    date: e.target.value
                  })}
                />
                <Input
                  placeholder="الوقت"
                  value={messageVariables.time || ''}
                  onChange={(e) => setMessageVariables({
                    ...messageVariables,
                    time: e.target.value
                  })}
                />
              </div>
            )}
            {selectedTemplate === 'offer' && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="الموقع"
                  value={messageVariables.location || ''}
                  onChange={(e) => setMessageVariables({
                    ...messageVariables,
                    location: e.target.value
                  })}
                />
                <Input
                  placeholder="السعر"
                  value={messageVariables.price || ''}
                  onChange={(e) => setMessageVariables({
                    ...messageVariables,
                    price: e.target.value
                  })}
                />
              </div>
            )}
          </div>
        )}

        {/* Message Preview */}
        {selectedTemplate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              معاينة الرسالة
            </label>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              {processTemplate(MESSAGE_TEMPLATES[selectedTemplate])}
            </div>
          </div>
        )}

        {/* Custom Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            رسالة مخصصة
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !clientData?.phone}
          className="w-full bg-green-500 hover:bg-green-600 text-white"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              جاري الإرسال...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              إرسال عبر الواتساب
            </div>
          )}
        </Button>

        {/* Quick Links */}
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500 mb-2">روابط سريعة:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://business.whatsapp.com/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 ml-1" />
              WhatsApp Business
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://wa.me/', '_blank')}
            >
              <ExternalLink className="h-3 w-3 ml-1" />
              WhatsApp Web
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

