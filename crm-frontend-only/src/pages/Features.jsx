import React, { useState, useEffect } from 'react'
import { 
  Sparkles, 
  Search, 
  Filter, 
  Calculator as CalcIcon, 
  MessageCircle,
  BarChart3,
  Download,
  Upload,
  Shield,
  Zap,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Eye,
  Plus,
  X,
  Phone,
  Mail,
  Globe,
  Smartphone,
  Activity,
  TrendingUp,
  FileText,
  Users,
  Building2,
  Lock,
  Clock,
  Target,
  Layers,
  Map,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Maximize,
  Image,
  FileImage,
  MapPin
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import LoadingPage from '../components/ui/loading'
import toast from 'react-hot-toast'
import { useClients } from '../hooks/useClients'
import { useLeads } from '../hooks/useLeads'
import { useSales } from '../hooks/useSales'
import { useProjects } from '../hooks/useProjects'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import WikiMapiaViewer from '../components/maps/WikiMapiaViewer'

// WhatsApp Integration Component
const WhatsAppCenter = ({ clients, leads }) => {
  const [selectedContacts, setSelectedContacts] = useState([])
  const [message, setMessage] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [loading, setLoading] = useState(false)

  const messageTemplates = [
    {
      id: 'welcome',
      name: 'رسالة ترحيب',
      content: `مرحباً {name}! 👋

نشكركم لاختيار شركتنا العقارية. نحن هنا لمساعدتكم في العثور على العقار المثالي.

للاستفسارات:
📞 {phone}
🌐 {website}

فريق المبيعات`
    },
    {
      id: 'followup',
      name: 'متابعة استفسار',
      content: `أهلاً {name} 🏠

نود متابعة استفسارك حول {property_type} في منطقة {location}.

لدينا عروض جديدة قد تناسبك:
✨ أسعار مميزة
🏗️ تشطيب فاخر
📍 مواقع متميزة

هل يمكننا ترتيب موعد لمعاينة العقارات؟

{agent_name}
{agent_phone}`
    },
    {
      id: 'offer',
      name: 'عرض خاص',
      content: `عرض خاص لك {name}! 🎉

🏠 {property_details}
💰 السعر: {price}
📅 العرض ساري حتى: {expiry_date}

مميزات العرض:
✅ {feature_1}
✅ {feature_2}  
✅ {feature_3}

للحجز أو الاستفسار:
📞 {contact_number}

لا تفوت هذه الفرصة!`
    },
    {
      id: 'appointment',
      name: 'تأكيد موعد',
      content: `تأكيد موعد المعاينة 📅

عزيزي {name}،

تم تأكيد موعد معاينة العقار:
📍 العنوان: {address}
⏰ التاريخ: {date}
🕐 الوقت: {time}

سيكون في انتظارك:
👤 {agent_name}
📞 {agent_phone}

نتطلع لرؤيتك!`
    }
  ]

  const handleSendMessage = async () => {
    if (!message.trim() || selectedContacts.length === 0) {
      toast.error('يرجى اختيار جهات الاتصال وكتابة الرسالة')
      return
    }

    setLoading(true)
    try {
      // Simulate sending WhatsApp messages
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`تم إرسال الرسالة لـ ${selectedContacts.length} جهة اتصال`)
      setMessage('')
      setSelectedContacts([])
    } catch (error) {
      toast.error('حدث خطأ في إرسال الرسائل')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template) => {
    setMessage(template.content)
    setMessageTemplate(template.id)
  }

  const allContacts = [
    ...clients.map(client => ({ ...client, type: 'client' })),
    ...leads.map(lead => ({ ...lead, type: 'lead' }))
  ].filter(contact => contact.phone)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <MessageCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">مركز واتساب للأعمال</h2>
            <p className="text-green-100">إدارة محادثات العملاء وإرسال العروض بشكل احترافي</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm">جهات الاتصال</span>
            </div>
            <div className="text-2xl font-bold mt-1">{allContacts.length}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">الرسائل المرسلة</span>
            </div>
            <div className="text-2xl font-bold mt-1">247</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">معدل الاستجابة</span>
            </div>
            <div className="text-2xl font-bold mt-1">78%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Selection */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            اختيار جهات الاتصال
          </h3>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allContacts.map(contact => (
              <label key={`${contact.type}-${contact.id}`} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
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
                <div className="flex-1">
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                    <Badge variant={contact.type === 'client' ? 'default' : 'secondary'} className="text-xs">
                      {contact.type === 'client' ? 'عميل' : 'محتمل'}
                    </Badge>
                  </div>
                </div>
              </label>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600">
              تم اختيار {selectedContacts.length} جهة اتصال
            </div>
          </div>
        </Card>

        {/* Message Composition */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            إنشاء الرسالة
          </h3>
          
          {/* Templates */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">قوالب الرسائل</label>
            <div className="grid grid-cols-2 gap-2">
              {messageTemplates.map(template => (
                <Button
                  key={template.id}
                  variant={messageTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTemplateSelect(template)}
                  className="text-xs"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Message Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">نص الرسالة</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              className="w-full h-40 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length} حرف
            </div>
          </div>
          
          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={loading || !message.trim() || selectedContacts.length === 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                جاري الإرسال...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                إرسال الرسالة ({selectedContacts.length})
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}

// Finance Calculator Component  
const FinanceCalculator = () => {
  const [loanAmount, setLoanAmount] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [loanTerm, setLoanTerm] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [results, setResults] = useState(null)

  const calculateLoan = () => {
    const principal = parseFloat(loanAmount) - parseFloat(downPayment || 0)
    const monthlyRate = parseFloat(interestRate) / 100 / 12
    const numPayments = parseFloat(loanTerm) * 12

    if (principal > 0 && monthlyRate > 0 && numPayments > 0) {
      const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                           (Math.pow(1 + monthlyRate, numPayments) - 1)
      
      const totalPayment = monthlyPayment * numPayments
      const totalInterest = totalPayment - principal

      setResults({
        monthlyPayment: monthlyPayment.toFixed(2),
        totalPayment: totalPayment.toFixed(2),
        totalInterest: totalInterest.toFixed(2),
        principal: principal.toFixed(2)
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <CalcIcon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">حاسبة التمويل العقاري</h2>
            <p className="text-blue-100">احسب القسط الشهري والفوائد بدقة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">بيانات القرض</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">مبلغ العقار (ج.م)</label>
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="مثال: 2000000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">الدفعة المقدمة (ج.م)</label>
              <Input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                placeholder="مثال: 400000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">معدل الفائدة السنوي (%)</label>
              <Input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="مثال: 12.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">مدة القرض (سنوات)</label>
              <Input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                placeholder="مثال: 20"
              />
            </div>
            
            <Button onClick={calculateLoan} className="w-full">
              <CalcIcon className="h-4 w-4 mr-2" />
              احسب القسط
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">نتائج الحساب</h3>
          
          {results ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">القسط الشهري</div>
                <div className="text-2xl font-bold text-green-700">
                  {parseFloat(results.monthlyPayment).toLocaleString()} ج.م
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">مبلغ التمويل</div>
                  <div className="text-xl font-bold text-blue-700">
                    {parseFloat(results.principal).toLocaleString()} ج.م
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">إجمالي الفوائد</div>
                  <div className="text-xl font-bold text-orange-700">
                    {parseFloat(results.totalInterest).toLocaleString()} ج.م
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">إجمالي المبلغ المسدد</div>
                  <div className="text-xl font-bold text-purple-700">
                    {parseFloat(results.totalPayment).toLocaleString()} ج.م
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <CalcIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>أدخل بيانات القرض لعرض النتائج</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


export default function Features() {
  const { currentUser } = useAuth()
  const { isAdmin, isManager } = usePermissions()
  const { clients, loading: clientsLoading } = useClients()
  const { leads, loading: leadsLoading } = useLeads()
  const { sales, loading: salesLoading } = useSales()
  const { projects, loading: projectsLoading } = useProjects()
  
  const [activeTab, setActiveTab] = useState('wikimapia')
  const [loading, setLoading] = useState(false)

  const features = [
    {
      id: 'wikimapia',
      name: 'خريطة دمياط التفاعلية',
      icon: Globe,
      description: 'استكشاف دمياط الجديدة باستخدام WikiMapia التفاعلي',
      component: <WikiMapiaViewer />
    },
    {
      id: 'whatsapp',
      name: 'واتساب للأعمال',
      icon: MessageCircle,
      description: 'إدارة محادثات العملاء وإرسال العروض',
      component: <WhatsAppCenter clients={clients || []} leads={leads || []} />
    },
    {
      id: 'calculator',
      name: 'حاسبة التمويل',
      icon: CalcIcon,
      description: 'حساب القسط الشهري والفوائد',
      component: <FinanceCalculator />
    },
  ]

  if (clientsLoading || leadsLoading || salesLoading || projectsLoading) {
    return <LoadingPage message="جاري تحميل المميزات..." />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg overflow-hidden">
          <div className="px-8 py-12 text-white">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/20 p-4 rounded-xl">
                <Sparkles className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">المميزات والأدوات</h1>
                <p className="text-xl text-indigo-100">
                  أدوات متقدمة لتحسين إدارة العقارات والعملاء
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon
                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(feature.id)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      activeTab === feature.id
                        ? 'bg-white/20 border-2 border-white/30'
                        : 'bg-white/10 hover:bg-white/15 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6" />
                      <h3 className="font-semibold">{feature.name}</h3>
                    </div>
                    <p className="text-sm text-indigo-100">{feature.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active Feature Content */}
      <div className="min-h-[600px]">
        {features.find(f => f.id === activeTab)?.component}
      </div>
    </div>
  )
}
