import React, { useState } from 'react'
import { MessageCircle, Phone, Send, Users } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import toast from 'react-hot-toast'

const WhatsAppSender = ({ contacts = [], onSend, className = "" }) => {
  const [selectedContacts, setSelectedContacts] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const quickMessages = [
    "مرحباً! كيف يمكنني مساعدتك اليوم؟",
    "شكراً لاهتمامك بعقاراتنا. هل تود معرفة المزيد؟",
    "لدينا عروض جديدة قد تناسبك. هل يمكننا ترتيب موعد؟",
    "تم تحديث قائمة العقارات المتاحة. تفضل بالاطلاع عليها."
  ]

  const handleSend = async () => {
    if (!message.trim() || selectedContacts.length === 0) {
      toast.error('يرجى اختيار جهات الاتصال وكتابة الرسالة')
      return
    }

    setLoading(true)
    try {
      // Prepare contacts data
      const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id))
      
      // Send via backend API
      const response = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          contacts: selectedContactsData,
          message: message
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`تم إرسال الرسالة لـ ${result.data.successCount} من أصل ${selectedContacts.length} جهة اتصال`)
        
        if (result.data.failureCount > 0) {
          toast.error(`فشل في إرسال ${result.data.failureCount} رسالة`)
        }
        
        if (onSend) {
          onSend(selectedContacts, message)
        }
        
        setMessage('')
        setSelectedContacts([])
      } else {
        toast.error(result.message || 'حدث خطأ في إرسال الرسالة')
      }
    } catch (error) {
      console.error('WhatsApp send error:', error)
      toast.error('حدث خطأ في الاتصال بالخدمة')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(contacts.map(c => c.id))
    }
  }

  const openWhatsApp = (phone, message = '') => {
    const cleanPhone = phone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold">إرسال رسائل واتساب</h3>
        <Badge variant="secondary">{contacts.length} جهة اتصال</Badge>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>لا توجد جهات اتصال متاحة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Contact Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">اختيار جهات الاتصال</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedContacts.length === contacts.length ? 'إلغاء الكل' : 'اختيار الكل'}
              </Button>
            </div>
            
            <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
              {contacts.map(contact => (
                <label
                  key={contact.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContacts([...selectedContacts, contact.id])
                      } else {
                        setSelectedContacts(selectedContacts.filter(id => id !== contact.id))
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{contact.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      openWhatsApp(contact.phone, message)
                    }}
                    className="text-green-600 hover:text-green-700 p-1 h-auto"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </label>
              ))}
            </div>
            
            {selectedContacts.length > 0 && (
              <div className="text-sm text-blue-600 mt-1">
                تم اختيار {selectedContacts.length} جهة اتصال
              </div>
            )}
          </div>

          {/* Quick Messages */}
          <div>
            <label className="text-sm font-medium mb-2 block">رسائل سريعة</label>
            <div className="flex flex-wrap gap-1">
              {quickMessages.map((msg, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(msg)}
                  className="text-xs h-auto py-1 px-2"
                >
                  {msg.substring(0, 20)}...
                </Button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">نص الرسالة</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="w-full h-24 p-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length} حرف
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={loading || !message.trim() || selectedContacts.length === 0}
            className="w-full bg-green-600 hover:bg-green-700"
            size="sm"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                إرسال لـ {selectedContacts.length} جهة اتصال
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  )
}

export default WhatsAppSender




