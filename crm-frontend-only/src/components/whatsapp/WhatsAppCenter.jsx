import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Send, 
  Users, 
  FileText, 
  Clock,
  Check,
  CheckCheck,
  Phone,
  Image,
  Paperclip,
  Smile,
  Search,
  Filter,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContext'
import { useClients } from '../../hooks/useClients'
import { formatDateArabic } from '../../lib/utils'
import toast from 'react-hot-toast'

const WhatsAppCenter = ({ isOpen, onClose }) => {
  const { userProfile } = useAuth()
  const { clients } = useClients()
  
  const [selectedContact, setSelectedContact] = useState(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [broadcastMode, setBroadcastMode] = useState(false)
  const [selectedContacts, setSelectedContacts] = useState([])

  // قوالب الرسائل المعدة مسبقاً
  const messageTemplates = [
    {
      id: 'welcome',
      name: 'رسالة ترحيب',
      content: `أهلاً وسهلاً {name}! 🏠

نشكرك لاختيار شركة نطاق العقارية.
نحن هنا لمساعدتك في العثور على العقار المناسب.

فريق شركة نطاق`,
      category: 'welcome'
    },
    {
      id: 'appointment',
      name: 'تأكيد موعد',
      content: `مرحباً {name} 📅

تذكير بموعدك معنا:
📍 التاريخ: {date}
🕐 الوقت: {time}
📍 المكان: {location}

نتطلع لرؤيتك!
فريق شركة نطاق`,
      category: 'appointment'
    },
    {
      id: 'follow_up',
      name: 'متابعة عميل',
      content: `مرحباً {name} 👋

نود متابعة طلبك للعقار في {area}.
هل لديك أي استفسارات جديدة؟

نحن في خدمتك دائماً!
فريق شركة نطاق`,
      category: 'follow_up'
    },
    {
      id: 'new_property',
      name: 'عقار جديد',
      content: `🏠 عقار جديد قد يهمك!

{property_title}
📍 الموقع: {location}
💰 السعر: {price}
📏 المساحة: {area}

للاستفسار اتصل بنا الآن!
فريق شركة نطاق`,
      category: 'marketing'
    },
    {
      id: 'deal_closed',
      name: 'إتمام صفقة',
      content: `تهانينا {name}! 🎉

تم إتمام عملية شراء العقار بنجاح.
نشكرك لثقتك في شركة نطاق العقارية.

نتمنى لك حياة سعيدة في منزلك الجديد!
فريق شركة نطاق`,
      category: 'success'
    }
  ]

  // محادثات WhatsApp من Firebase (محاكاة للعملاء الحقيقيين)
  const [conversations, setConversations] = useState([])

  // تحويل العملاء من Firebase لمحادثات WhatsApp
  useEffect(() => {
    if (clients && clients.length > 0) {
      const clientConversations = clients.slice(0, 10).map((client, index) => ({
        id: client.id,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone || '+20xxxxxxxxxx',
        lastMessage: index === 0 ? 'مرحباً، أريد الاستفسار عن خدماتكم' : 
                     index === 1 ? 'شكراً لكم على المتابعة' : 
                     'نتطلع للتواصل معكم',
        lastMessageTime: new Date(Date.now() - (index + 1) * 60 * 60 * 1000),
        unreadCount: index < 2 ? Math.floor(Math.random() * 3) : 0,
        status: 'delivered',
        messages: [
          {
            id: 1,
            content: 'مرحباً، أريد الاستفسار عن خدماتكم',
            sender: 'client',
            timestamp: new Date(Date.now() - (index + 1) * 2 * 60 * 60 * 1000),
            status: 'delivered'
          },
          {
            id: 2,
            content: `أهلاً وسهلاً ${client.name}! نحن سعداء لخدمتك. كيف يمكننا مساعدتك؟`,
            sender: 'agent',
            timestamp: new Date(Date.now() - (index + 1) * 60 * 60 * 1000),
            status: 'read'
          }
        ]
      }))
      setConversations(clientConversations)
    }
  }, [clients])

  // فلترة المحادثات
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.clientPhone.includes(searchTerm)
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'unread' && conv.unreadCount > 0) ||
                         (filterStatus === 'read' && conv.unreadCount === 0)
    
    return matchesSearch && matchesStatus
  })

  // إرسال رسالة
  const sendMessage = () => {
    if (!message.trim() || !selectedContact) {
      toast.error('يرجى كتابة رسالة واختيار جهة اتصال')
      return
    }

    // إضافة الرسالة للمحادثة
    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedContact.id) {
        const newMessage = {
          id: Date.now(),
          content: message,
          sender: 'agent',
          timestamp: new Date(),
          status: 'sent'
        }
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: message,
          lastMessageTime: new Date()
        }
      }
      return conv
    }))

    setMessage('')
    toast.success('تم إرسال الرسالة بنجاح!')
    
    // محاكاة تغيير حالة الرسالة
    setTimeout(() => {
      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedContact.id) {
          const updatedMessages = conv.messages.map(msg => 
            msg.status === 'sent' ? { ...msg, status: 'delivered' } : msg
          )
          return { ...conv, messages: updatedMessages }
        }
        return conv
      }))
    }, 1000)
  }

  // استخدام قالب رسالة
  const useTemplate = (template) => {
    let content = template.content
    
    if (selectedContact) {
      content = content.replace('{name}', selectedContact.clientName)
      content = content.replace('{date}', formatDateArabic(new Date()))
      content = content.replace('{time}', new Date().toLocaleTimeString('ar-SA'))
      // يمكن إضافة المزيد من المتغيرات حسب الحاجة
    }
    
    setMessage(content)
    setSelectedTemplate('')
  }

  // إرسال رسالة جماعية
  const sendBroadcastMessage = () => {
    if (!message.trim() || selectedContacts.length === 0) {
      toast.error('يرجى كتابة رسالة واختيار جهات الاتصال')
      return
    }

    toast.success(`تم إرسال الرسالة إلى ${selectedContacts.length} جهة اتصال`)
    setBroadcastMode(false)
    setSelectedContacts([])
    setMessage('')
  }

  // أيقونة حالة الرسالة
  const getMessageStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check className="h-4 w-4 text-gray-400" />
      case 'delivered':
        return <CheckCheck className="h-4 w-4 text-gray-400" />
      case 'read':
        return <CheckCheck className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-green-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">WhatsApp Business</h2>
                <p className="text-green-100 text-sm">مركز المراسلة</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setBroadcastMode(!broadcastMode)}
                variant={broadcastMode ? "secondary" : "outline"}
                size="sm"
                className={broadcastMode ? "bg-white text-green-600" : "text-white border-white"}
              >
                <Users className="h-4 w-4 ml-1" />
                رسالة جماعية
              </Button>
              <Button onClick={onClose} variant="outline" size="sm" className="text-white border-white">
                إغلاق
              </Button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* قائمة المحادثات */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* البحث */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث في المحادثات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* فلترة */}
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className={filterStatus === 'all' ? "bg-green-600" : ""}
                >
                  الكل
                </Button>
                <Button
                  variant={filterStatus === 'unread' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus('unread')}
                  className={filterStatus === 'unread' ? "bg-green-600" : ""}
                >
                  غير مقروءة
                </Button>
              </div>

              {/* الإحصائيات */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded text-center">
                  <div className="text-lg font-bold text-green-600">{conversations.length}</div>
                  <div className="text-xs text-gray-600">محادثة</div>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                  </div>
                  <div className="text-xs text-gray-600">غير مقروءة</div>
                </div>
              </div>
            </div>

            {/* قائمة المحادثات */}
            <div className="space-y-1 px-2">
              {filteredConversations.map(conversation => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedContact?.id === conversation.id
                      ? 'bg-green-100 border-green-300'
                      : 'bg-white hover:bg-gray-50'
                  } ${broadcastMode ? 'cursor-default' : ''}`}
                  onClick={() => {
                    if (broadcastMode) {
                      if (selectedContacts.includes(conversation.id)) {
                        setSelectedContacts(prev => prev.filter(id => id !== conversation.id))
                      } else {
                        setSelectedContacts(prev => [...prev, conversation.id])
                      }
                    } else {
                      setSelectedContact(conversation)
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {broadcastMode && (
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(conversation.id)}
                        onChange={() => {}}
                        className="rounded border-gray-300"
                      />
                    )}
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                      {conversation.clientName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">
                          {conversation.clientName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatDateArabic(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-green-500 text-white text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* منطقة المحادثة */}
          <div className="flex-1 flex flex-col">
            {selectedContact && !broadcastMode ? (
              <>
                {/* عنوان المحادثة */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">
                        {selectedContact.clientName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{selectedContact.clientName}</h3>
                        <p className="text-sm text-gray-600">{selectedContact.clientPhone}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 ml-1" />
                      اتصال
                    </Button>
                  </div>
                </div>

                {/* الرسائل */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {selectedContact.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'agent'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          msg.sender === 'agent' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">
                            {msg.timestamp.toLocaleTimeString('ar-SA', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {msg.sender === 'agent' && getMessageStatusIcon(msg.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* منطقة الإدخال */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  {/* قوالب الرسائل */}
                  <div className="mb-3">
                    <select
                      value={selectedTemplate}
                      onChange={(e) => {
                        const template = messageTemplates.find(t => t.id === e.target.value)
                        if (template) useTemplate(template)
                      }}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    >
                      <option value="">اختر قالب رسالة...</option>
                      {messageTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب رسالتك..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows="3"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={sendMessage}
                        className="bg-green-500 hover:bg-green-600"
                        disabled={!message.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : broadcastMode ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-blue-50">
                  <h3 className="font-medium text-gray-900">
                    رسالة جماعية ({selectedContacts.length} جهة اتصال محددة)
                  </h3>
                </div>
                
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        اختر قالب رسالة
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => {
                          const template = messageTemplates.find(t => t.id === e.target.value)
                          if (template) setMessage(template.content)
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">اختر قالب...</option>
                        {messageTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        نص الرسالة
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="اكتب رسالتك الجماعية..."
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="8"
                      />
                    </div>
                    
                    <Button 
                      onClick={sendBroadcastMessage}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      disabled={!message.trim() || selectedContacts.length === 0}
                    >
                      <Send className="h-4 w-4 ml-2" />
                      إرسال لـ {selectedContacts.length} جهة اتصال
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">اختر محادثة</h3>
                  <p>اختر محادثة من القائمة لبدء المراسلة</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsAppCenter
