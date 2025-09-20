import React, { useState, useEffect } from 'react'
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Database,
  Download,
  Upload,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  Globe,
  Building2,
  DollarSign,
  Calendar,
  Users,
  Settings as SettingsIcon,
  AlertTriangle,
  MessageSquare,
  Key,
  Send,
  RefreshCw,
  Check,
  Activity,
  BarChart3,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Edit,
  Plus,
  X,
  Home,
  Briefcase,
  CreditCard,
  HardDrive,
  Monitor,
  Smartphone
} from 'lucide-react'
import WhatsAppSettings from '../components/settings/WhatsAppSettings'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import LoadingPage from '../components/ui/loading'
import { useAuth } from '../contexts/AuthContext'
import { useClients } from '../hooks/useClients'
import { useLeads } from '../hooks/useLeads'
import { useSales } from '../hooks/useSales'
import { useProjects } from '../hooks/useProjects'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, userProfile } = useAuth()
  const { clients, loading: clientsLoading } = useClients()
  const { leads, loading: leadsLoading } = useLeads()
  const { sales, loading: salesLoading } = useSales()
  const { projects, loading: projectsLoading } = useProjects()
  
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  
  // Settings data
  const [settingsData, setSettingsData] = useState({
    // Profile settings
    profile: {
      displayName: userProfile?.displayName || 'محمد أحمد',
      email: user?.email || 'your-email@company.com',
      phone: '+201234567890',
      position: 'مدير المبيعات',
      department: 'المبيعات',
      avatar: null,
      bio: 'مدير مبيعات خبير في العقارات لأكثر من 10 سنوات'
    },
    
    // System settings
    system: {
      language: 'ar',
    timezone: 'Africa/Cairo',
      dateFormat: 'dd/mm/yyyy',
      currency: 'EGP',
      theme: 'light',
      autoSave: true,
      sessionTimeout: 60
    },
    
    // Notification settings
    notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
      newLeads: true,
    taskReminders: true,
      salesUpdates: true,
      systemAlerts: true,
      weeklyReports: true,
      monthlyReports: true,
      notificationSound: true,
      notificationTime: '09:00'
    },
    
    // Security settings
    security: {
    twoFactorAuth: false,
    passwordExpiry: 90,
      loginHistory: true,
      sessionLogging: true,
      ipWhitelist: false,
      allowedIPs: [],
      autoLockout: true,
      maxLoginAttempts: 5,
      securityQuestions: []
    },
    
    // Company settings
    company: {
      name: 'اسم شركتك',
      address: 'عنوان الشركة',
      phone: '+20xxxxxxxxxx',
      email: 'info@company.com',
      website: 'www.company.com',
      taxNumber: 'الرقم الضريبي',
      commercialNumber: 'رقم السجل التجاري',
      logo: null,
      currency: 'EGP',
      workingHours: '09:00 - 18:00',
      workingDays: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء']
    },
    
    // Integration settings
    integrations: {
      whatsapp: {
        enabled: false,
        accessToken: '',
        phoneNumberId: '',
        businessAccountId: '',
        webhookVerifyToken: '',
        webhookUrl: `${window.location.origin}/api/whatsapp/webhook`,
        status: 'disconnected', // disconnected, connecting, connected, error
        lastChecked: null,
        phoneNumber: '',
        displayPhoneNumber: '',
        features: {
          textMessages: false,
          templateMessages: false,
          mediaMessages: false,
          bulkMessages: false,
          webhooks: false
        }
      },
      email: {
        enabled: true,
        provider: 'gmail',
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        username: 'your-email@company.com',
        password: '***************'
      },
      sms: {
        enabled: false,
        provider: 'local',
        apiKey: '',
        sender: 'RealEstate'
      },
      calendar: {
        enabled: true,
        provider: 'google',
        syncInterval: 15
      }
    }
  })

  // Calculate stats
  const stats = {
    totalSettings: Object.keys(settingsData).length,
    activeIntegrations: Object.values(settingsData.integrations).filter(i => i.enabled).length,
    notifications: Object.values(settingsData.notifications).filter(n => n === true).length,
    securityLevel: calculateSecurityLevel(),
    lastSync: new Date(Date.now() - 6 * 60 * 60 * 1000),
    storageUsed: 2.4 // GB
  }

  function calculateSecurityLevel() {
    let score = 0
    if (settingsData.security.twoFactorAuth) score += 30
    if (settingsData.security.passwordExpiry <= 90) score += 20
    if (settingsData.security.loginHistory) score += 15
    if (settingsData.security.autoLockout) score += 20
    if (settingsData.security.sessionLogging) score += 15
    return Math.min(score, 100)
  }

  // WhatsApp API functions
  const loadWhatsAppStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSettingsData(prev => ({
          ...prev,
          integrations: {
            ...prev.integrations,
            whatsapp: {
              ...prev.integrations.whatsapp,
              status: result.data.connected ? 'connected' : 'disconnected',
              enabled: result.data.configured && result.data.connected,
              lastChecked: new Date().toISOString(),
              phoneNumber: result.data.phoneNumber?.phone_number || '',
              displayPhoneNumber: result.data.phoneNumber?.display_phone_number || '',
              features: result.data.features || {}
            }
          }
        }))
      }
    } catch (error) {
      console.error('Error loading WhatsApp status:', error)
      setSettingsData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          whatsapp: {
            ...prev.integrations.whatsapp,
            status: 'error',
            lastChecked: new Date().toISOString()
          }
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const saveWhatsAppSettings = async (whatsappData) => {
    try {
      setLoading(true)
      
      // Update local state
      setSettingsData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          whatsapp: {
            ...prev.integrations.whatsapp,
            ...whatsappData,
            status: 'connecting'
          }
        }
      }))

      // Test connection with new settings
      await testWhatsAppConnection()
      
      toast.success('تم حفظ إعدادات واتساب بنجاح')
      
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error)
      toast.error('حدث خطأ في حفظ إعدادات واتساب')
      
      setSettingsData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          whatsapp: {
            ...prev.integrations.whatsapp,
            status: 'error'
          }
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const testWhatsAppConnection = async () => {
    try {
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        const isConnected = result.data.connected && result.data.configured
        
        setSettingsData(prev => ({
          ...prev,
          integrations: {
            ...prev.integrations,
            whatsapp: {
              ...prev.integrations.whatsapp,
              status: isConnected ? 'connected' : 'disconnected',
              enabled: isConnected,
              lastChecked: new Date().toISOString(),
              features: result.data.features || {}
            }
          }
        }))

        if (isConnected) {
          toast.success('تم الاتصال بواتساب بنجاح')
        } else {
          toast.error('فشل الاتصال بواتساب - تحقق من الإعدادات')
        }
      }
    } catch (error) {
      console.error('Error testing WhatsApp connection:', error)
      toast.error('حدث خطأ في اختبار الاتصال')
    }
  }

  const sendTestMessage = async () => {
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          phone: user?.phone || '01234567890',
          message: 'رسالة اختبار من نظام إدارة العقارات',
          contactName: userProfile?.displayName || user?.name
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('تم إرسال رسالة الاختبار بنجاح')
      } else {
        toast.error(result.message || 'فشل في إرسال الرسالة')
      }
    } catch (error) {
      toast.error('حدث خطأ في إرسال الرسالة')
    }
  }

  // Load settings from backend
  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/system/settings/${user?.id || 1}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSettingsData(prev => ({
          ...prev,
          ...result.data
        }))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save settings to backend
  const saveSettingsToBackend = async (category, categorySettings) => {
    try {
      const response = await fetch(`/api/system/settings/${user?.id || 1}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          category,
          settings: categorySettings
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message || 'حدث خطأ في حفظ الإعدادات')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('حدث خطأ في حفظ الإعدادات')
    }
  }

  // Enhanced handleUpdateSetting function
  const handleUpdateSetting = (category, key, value) => {
    setSettingsData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  // Save specific category
  const handleSaveCategory = async (category) => {
    try {
      setLoading(true)
      await saveSettingsToBackend(category, settingsData[category])
    } finally {
      setLoading(false)
    }
  }

  // Save all settings
  const handleSaveAll = async () => {
    try {
      setLoading(true)
      
      // Save each category
      for (const category of ['profile', 'system', 'notifications', 'security', 'company']) {
        await saveSettingsToBackend(category, settingsData[category])
      }
      
      toast.success('تم حفظ جميع الإعدادات بنجاح')
    } catch (error) {
      toast.error('حدث خطأ في حفظ الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  // Export settings
  const handleExportSettings = async () => {
    try {
      const response = await fetch(`/api/system/settings/${user?.id || 1}/export`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `settings-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('تم تصدير الإعدادات بنجاح')
      } else {
        toast.error('حدث خطأ في تصدير الإعدادات')
      }
    } catch (error) {
      console.error('Error exporting settings:', error)
      toast.error('حدث خطأ في تصدير الإعدادات')
    }
  }

  // Import settings
  const handleImportSettings = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result)
        
        const response = await fetch(`/api/system/settings/${user?.id || 1}/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(importedSettings)
        })
        
        const result = await response.json()
        
        if (result.success) {
          toast.success('تم استيراد الإعدادات بنجاح')
          loadSettings() // Reload settings
        } else {
          toast.error(result.message || 'حدث خطأ في استيراد الإعدادات')
        }
      } catch (error) {
        console.error('Error importing settings:', error)
        toast.error('ملف الإعدادات غير صحيح')
      }
    }
    reader.readAsText(file)
  }

  // Reset settings to defaults
  const handleResetToDefaults = async (category = null) => {
    try {
      const response = await fetch(`/api/system/settings/${user?.id || 1}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ category })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(result.message)
        loadSettings() // Reload settings
      } else {
        toast.error(result.message || 'حدث خطأ في إرجاع الإعدادات للافتراضي')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast.error('حدث خطأ في إرجاع الإعدادات للافتراضي')
    }
  }

  // Load settings and WhatsApp status on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (activeTab === 'integrations') {
      loadWhatsAppStatus()
    }
  }, [activeTab])

  // Setting categories
  const settingCategories = [
    {
      id: 'profile',
      name: 'الملف الشخصي',
      icon: <User className="h-4 w-4" />,
      description: 'معلوماتك الشخصية والمهنية',
      color: 'blue'
    },
    {
      id: 'system',
      name: 'النظام',
      icon: <SettingsIcon className="h-4 w-4" />,
      description: 'إعدادات النظام العامة',
      color: 'gray'
    },
    {
      id: 'notifications',
      name: 'الإشعارات',
      icon: <Bell className="h-4 w-4" />,
      description: 'تفضيلات الإشعارات والتنبيهات',
      color: 'yellow'
    },
    {
      id: 'security',
      name: 'الأمان',
      icon: <Shield className="h-4 w-4" />,
      description: 'إعدادات الأمان والحماية',
      color: 'red'
    },
    {
      id: 'company',
      name: 'الشركة',
      icon: <Building2 className="h-4 w-4" />,
      description: 'معلومات وإعدادات الشركة',
      color: 'green'
    },
    {
      id: 'integrations',
      name: 'التكاملات',
      icon: <Globe className="h-4 w-4" />,
      description: 'ربط الخدمات الخارجية',
      color: 'purple'
    }
  ]

  // Get category color
  const getCategoryColor = (color) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'red': return 'bg-red-100 text-red-800 border-red-200'
      case 'green': return 'bg-green-100 text-green-800 border-green-200'
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Old functions removed - using new backend-connected functions

  if (loading) return <LoadingPage />

  // Get current date and time in Arabic format
  const formatDateTimeArabic = () => {
    const now = new Date()
    const timeOptions = { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }
    const dateOptions = { timeZone: 'Africa/Cairo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    const time = now.toLocaleTimeString('ar-EG', timeOptions)
    const date = now.toLocaleDateString('ar-EG', dateOptions)
    return { time, date }
  }

  const { time, date } = formatDateTimeArabic()

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-10 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
        
        <div className="relative px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <SettingsIcon className="h-8 w-8 text-white" />
          </div>
                    <div>
                  <h1 className="text-3xl font-bold">الإعدادات</h1>
                  <p className="text-slate-100 text-lg">إدارة إعدادات النظام والتفضيلات الشخصية</p>
                    </div>
                    </div>

              <div className="flex items-center gap-4 mt-3">
                <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">📅 {date}</span>
                <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">🕐 {time}</span>
                    </div>
                    </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={handleExportSettings}
                variant="outline"
                className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 font-medium px-4"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير الإعدادات
              </Button>
              <Button 
                onClick={handleSaveAll}
                className="bg-white text-slate-600 hover:bg-slate-50 border-0 shadow-lg font-medium px-6"
              >
                <Save className="h-4 w-4 ml-2" />
                حفظ الإعدادات
              </Button>
            </div>
          </div>
                    </div>
                  </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* إجمالي الإعدادات */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-500 to-slate-600 text-white hover:shadow-xl hover:shadow-slate-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <SettingsIcon className="h-5 w-5 text-white" />
                  </div>
              <div className="text-right">
                <p className="text-slate-100 text-xs font-medium">إجمالي الإعدادات</p>
                <p className="text-2xl font-bold text-white">{stats.totalSettings || 0}</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-full"></div>
            </div>
            <p className="text-slate-100 text-xs">أقسام الإعدادات</p>
              </div>
            </Card>

        {/* التكاملات النشطة */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500 to-green-600 text-white hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-5 w-5 text-white" />
                    </div>
              <div className="text-right">
                <p className="text-green-100 text-xs font-medium">التكاملات النشطة</p>
                <p className="text-2xl font-bold text-white">{stats.activeIntegrations || 0}</p>
                    </div>
                    </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-3/4"></div>
                    </div>
            <p className="text-green-100 text-xs">خدمات مربوطة</p>
                    </div>
        </Card>

        {/* الإشعارات المفعلة */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Bell className="h-5 w-5 text-white" />
                    </div>
              <div className="text-right">
                <p className="text-yellow-100 text-xs font-medium">إشعارات مفعلة</p>
                <p className="text-2xl font-bold text-white">{stats.notifications || 0}</p>
                    </div>
                  </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-4/5"></div>
                  </div>
            <p className="text-yellow-100 text-xs">أنواع التنبيهات</p>
              </div>
            </Card>

        {/* مستوى الأمان */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl hover:shadow-red-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-5 w-5 text-white" />
                      </div>
              <div className="text-right">
                <p className="text-red-100 text-xs font-medium">مستوى الأمان</p>
                <p className="text-2xl font-bold text-white">{stats.securityLevel || 0}%</p>
                    </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full" style={{width: `${stats.securityLevel}%`}}></div>
            </div>
            <p className="text-red-100 text-xs">نقاط الحماية</p>
          </div>
        </Card>

        {/* آخر نسخة احتياطية */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Database className="h-5 w-5 text-white" />
                      </div>
              <div className="text-right">
                <p className="text-blue-100 text-xs font-medium">آخر نسخة احتياطية</p>
                <p className="text-2xl font-bold text-white">6ساعات</p>
                    </div>
                  </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-5/6"></div>
            </div>
            <p className="text-blue-100 text-xs">منذ آخر حفظ</p>
          </div>
        </Card>

        {/* مساحة التخزين */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 cursor-pointer">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <HardDrive className="h-5 w-5 text-white" />
                  </div>
              <div className="text-right">
                <p className="text-purple-100 text-xs font-medium">مساحة التخزين</p>
                <p className="text-2xl font-bold text-white">{stats.storageUsed}GB</p>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full h-1 mb-2">
              <div className="bg-white h-1 rounded-full w-1/4"></div>
            </div>
            <p className="text-purple-100 text-xs">من 10GB</p>
              </div>
            </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">أقسام الإعدادات</h3>
                    </div>
            <div className="p-2">
              {settingCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`w-full text-right p-4 rounded-lg transition-all duration-200 mb-2 ${
                    activeTab === category.id
                      ? `${getCategoryColor(category.color)} border-2`
                      : 'text-gray-600 hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs opacity-75">{category.description}</div>
                  </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
                </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settingCategories.find(c => c.id === activeTab)?.icon}
                    <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {settingCategories.find(c => c.id === activeTab)?.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {settingCategories.find(c => c.id === activeTab)?.description}
                    </p>
                  </div>
                </div>
              </div>
                    </div>

            <div className="p-6">
              {/* Profile Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                      <Input
                        value={settingsData.profile.displayName}
                        onChange={(e) => handleUpdateSetting('profile', 'displayName', e.target.value)}
                        placeholder="محمد أحمد"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                      <Input
                        type="email"
                        value={settingsData.profile.email}
                        onChange={(e) => handleUpdateSetting('profile', 'email', e.target.value)}
                        placeholder="your-email@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                      <Input
                        value={settingsData.profile.phone}
                        onChange={(e) => handleUpdateSetting('profile', 'phone', e.target.value)}
                        placeholder="+201234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المنصب</label>
                      <Input
                        value={settingsData.profile.position}
                        onChange={(e) => handleUpdateSetting('profile', 'position', e.target.value)}
                        placeholder="مدير المبيعات"
                      />
                    </div>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">نبذة شخصية</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      rows="3"
                      value={settingsData.profile.bio}
                      onChange={(e) => handleUpdateSetting('profile', 'bio', e.target.value)}
                      placeholder="اكتب نبذة قصيرة عنك..."
                      />
                    </div>
                  
                  {/* Profile Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleSaveCategory('profile')}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          حفظ الملف الشخصي
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* System Settings */}
          {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اللغة</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        value={settingsData.system.language}
                        onChange={(e) => handleUpdateSetting('system', 'language', e.target.value)}
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة الزمنية</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        value={settingsData.system.timezone}
                        onChange={(e) => handleUpdateSetting('system', 'timezone', e.target.value)}
                      >
                        <option value="Africa/Cairo">القاهرة</option>
                        <option value="Asia/Riyadh">الرياض</option>
                        <option value="Asia/Dubai">دبي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">صيغة التاريخ</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        value={settingsData.system.dateFormat}
                        onChange={(e) => handleUpdateSetting('system', 'dateFormat', e.target.value)}
                      >
                        <option value="dd/mm/yyyy">يوم/شهر/سنة</option>
                        <option value="mm/dd/yyyy">شهر/يوم/سنة</option>
                        <option value="yyyy-mm-dd">سنة-شهر-يوم</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                        value={settingsData.system.currency}
                        onChange={(e) => handleUpdateSetting('system', 'currency', e.target.value)}
                      >
                        <option value="EGP">جنيه مصري</option>
                        <option value="SAR">ريال سعودي</option>
                        <option value="AED">درهم إماراتي</option>
                        <option value="USD">دولار أمريكي</option>
                      </select>
                    </div>
                    </div>

                      <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الحفظ التلقائي</label>
                        <p className="text-xs text-gray-500">حفظ التغييرات تلقائياً</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                          checked={settingsData.system.autoSave}
                          onChange={(e) => handleUpdateSetting('system', 'autoSave', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
                        </label>
                    </div>
                  </div>
                  
                  {/* System Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleSaveCategory('system')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          حفظ إعدادات النظام
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(settingsData.notifications).map(([key, value]) => {
                      if (typeof value === 'boolean') {
                        const labels = {
                          emailNotifications: 'إشعارات البريد الإلكتروني',
                          smsNotifications: 'إشعارات الرسائل النصية',
                          pushNotifications: 'الإشعارات المنبثقة',
                          newLeads: 'العملاء المحتملين الجدد',
                          taskReminders: 'تذكيرات المهام',
                          salesUpdates: 'تحديثات المبيعات',
                          systemAlerts: 'تنبيهات النظام',
                          weeklyReports: 'التقارير الأسبوعية',
                          monthlyReports: 'التقارير الشهرية',
                          notificationSound: 'صوت الإشعارات'
                        }
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div>
                              <label className="text-sm font-medium text-gray-700">{labels[key]}</label>
                  </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={value}
                                onChange={(e) => handleUpdateSetting('notifications', key, e.target.checked)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                            </label>
              </div>
                        )
                      }
                      return null
                    })}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">وقت الإشعارات اليومية</label>
                    <Input 
                      type="time"
                      value={settingsData.notifications.notificationTime}
                      onChange={(e) => handleUpdateSetting('notifications', 'notificationTime', e.target.value)}
                    />
                  </div>
                  
                  {/* Notifications Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleSaveCategory('notifications')}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          حفظ إعدادات الإشعارات
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Security Settings */}
          {activeTab === 'security' && (
                  <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                    <div>
                        <label className="text-sm font-medium text-gray-700">المصادقة الثنائية</label>
                        <p className="text-xs text-gray-500">طبقة حماية إضافية للحساب</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settingsData.security.twoFactorAuth}
                          onChange={(e) => handleUpdateSetting('security', 'twoFactorAuth', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">تسجيل تاريخ الدخول</label>
                        <p className="text-xs text-gray-500">حفظ سجل بجميع عمليات الدخول</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settingsData.security.loginHistory}
                          onChange={(e) => handleUpdateSetting('security', 'loginHistory', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                      </label>
                      </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">الحظر التلقائي</label>
                        <p className="text-xs text-gray-500">حظر المحاولات المشبوهة</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settingsData.security.autoLockout}
                          onChange={(e) => handleUpdateSetting('security', 'autoLockout', e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">انتهاء صلاحية كلمة المرور (أيام)</label>
                        <Input
                          type="number"
                        value={settingsData.security.passwordExpiry}
                        onChange={(e) => handleUpdateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                        placeholder="90"
                        />
                      </div>
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى لمحاولات الدخول</label>
                        <Input
                          type="number"
                        value={settingsData.security.maxLoginAttempts}
                        onChange={(e) => handleUpdateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                        placeholder="5"
                        />
                      </div>
                    </div>
                  
                  {/* Security Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleSaveCategory('security')}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          حفظ إعدادات الأمان
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Company Settings */}
              {activeTab === 'company' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">اسم الشركة</label>
                      <Input 
                        value={settingsData.company.name}
                        onChange={(e) => handleUpdateSetting('company', 'name', e.target.value)}
                        placeholder="شركة العقارات المتميزة"
                      />
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                      <Input 
                        type="email"
                        value={settingsData.company.email}
                        onChange={(e) => handleUpdateSetting('company', 'email', e.target.value)}
                        placeholder="info@realestate.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                      <Input 
                        value={settingsData.company.phone}
                        onChange={(e) => handleUpdateSetting('company', 'phone', e.target.value)}
                        placeholder="+201234567890"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الموقع الإلكتروني</label>
                      <Input 
                        value={settingsData.company.website}
                        onChange={(e) => handleUpdateSetting('company', 'website', e.target.value)}
                        placeholder="www.realestate.com"
                      />
                        </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الرقم الضريبي</label>
                      <Input 
                        value={settingsData.company.taxNumber}
                        onChange={(e) => handleUpdateSetting('company', 'taxNumber', e.target.value)}
                        placeholder="123456789"
                      />
                      </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">السجل التجاري</label>
                      <Input 
                        value={settingsData.company.commercialNumber}
                        onChange={(e) => handleUpdateSetting('company', 'commercialNumber', e.target.value)}
                        placeholder="987654321"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                      rows="3"
                      value={settingsData.company.address}
                      onChange={(e) => handleUpdateSetting('company', 'address', e.target.value)}
                      placeholder="العنوان الكامل للشركة..."
                    />
                      </div>
                  
                  {/* Company Save Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleSaveCategory('company')}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          حفظ إعدادات الشركة
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Integration Settings */}
              {activeTab === 'integrations' && (
                <WhatsAppSettings />
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleResetToDefaults}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 ml-2" />
                    إرجاع للافتراضي
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportSettings}
                    className="hidden"
                    id="import-settings"
                  />
                  <Button 
                    onClick={() => document.getElementById('import-settings').click()}
                    variant="outline"
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    استيراد
                  </Button>
                  <Button 
                    onClick={handleExportSettings}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تصدير
                  </Button>
                  <Button 
                    onClick={handleSaveAll}
                    disabled={loading}
                    className="bg-slate-600 hover:bg-slate-700 text-white"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 ml-2" />
                        حفظ جميع الإعدادات
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}