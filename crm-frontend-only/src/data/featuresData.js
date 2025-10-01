import { 
  Calculator, 
  MessageSquare, 
  Map, 
  BarChart3, 
  Palette,
  FileText,
  Mail,
  Phone,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  MapPin,
  CreditCard,
  Download
} from 'lucide-react'

export const featuresData = [
  // قسم الأدوات المساعدة
  {
    id: 'finance_calculator',
    title: 'حاسبة الأقساط',
    description: 'احسب الأقساط الشهرية والفوائد للقروض العقارية',
    icon: Calculator,
    status: 'active',
    buttonText: 'فتح الحاسبة',
    category: 'tools',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'area_calculator',
    title: 'حاسبة المساحات',
    description: 'تحويل بين وحدات القياس المختلفة',
    icon: MapPin,
    status: 'active',
    buttonText: 'فتح الحاسبة',
    category: 'tools',
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'commission_calculator',
    title: 'حاسبة العمولة',
    description: 'حساب عمولة المبيعات والمكافآت',
    icon: CreditCard,
    status: 'active',
    buttonText: 'فتح الحاسبة',
    category: 'tools',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'calculator',
    title: 'حاسبة التمويل العقاري',
    description: 'احسب أقساط التمويل العقاري والمدفوعات الشهرية',
    icon: Calculator,
    status: 'active',
    buttonText: 'فتح الحاسبة',
    category: 'finance',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'reports',
    title: 'التقارير التفصيلية',
    description: 'عرض وتصدير التقارير التفصيلية للأداء',
    icon: FileText,
    status: 'active',
    buttonText: 'عرض التقارير',
    category: 'analytics',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    id: 'analytics',
    title: 'التحليلات المتقدمة',
    description: 'تحليلات متقدمة وإحصائيات تفصيلية للبيانات',
    icon: BarChart3,
    status: 'active',
    buttonText: 'عرض التحليلات',
    category: 'analytics',
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'report_generator',
    title: 'منشئ التقارير',
    description: 'إنشاء تقارير مخصصة وتصديرها',
    icon: FileText,
    status: 'coming_soon',
    buttonText: 'قريباً',
    category: 'tools',
    color: 'bg-purple-100 text-purple-600'
  },

  // قسم التواصل
  {
    id: 'whatsapp_business',
    title: 'WhatsApp Business',
    description: 'إرسال رسائل جماعية ومتابعة العملاء',
    icon: MessageSquare,
    status: 'active',
    buttonText: 'فتح WhatsApp',
    category: 'communication',
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'email_marketing',
    title: 'التسويق بالبريد الإلكتروني',
    description: 'حملات بريدية احترافية للعملاء',
    icon: Mail,
    status: 'premium',
    buttonText: 'ترقية للمميز',
    category: 'communication',
    color: 'bg-red-100 text-red-600'
  },
  {
    id: 'sms_gateway',
    title: 'الرسائل النصية',
    description: 'إرسال رسائل SMS للعملاء والموظفين',
    icon: Phone,
    status: 'premium',
    buttonText: 'ترقية للمميز',
    category: 'communication',
    color: 'bg-blue-100 text-blue-600'
  },



  // قسم التحليلات
  {
    id: 'sales_analytics',
    title: 'تحليل المبيعات',
    description: 'رسوم بيانية تفاعلية لأداء المبيعات',
    icon: BarChart3,
    status: 'active',
    buttonText: 'عرض التحليلات',
    category: 'analytics',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    id: 'client_analytics',
    title: 'تحليل العملاء',
    description: 'تحليل سلوك وتفضيلات العملاء',
    icon: Users,
    status: 'coming_soon',
    buttonText: 'قريباً',
    category: 'analytics',
    color: 'bg-indigo-100 text-indigo-600'
  },
  {
    id: 'performance_analytics',
    title: 'تحليل الأداء',
    description: 'قياس كفاءة الموظفين والفرق',
    icon: TrendingUp,
    status: 'premium',
    buttonText: 'ترقية للمميز',
    category: 'analytics',
    color: 'bg-pink-100 text-pink-600'
  },

  // قسم التخصيص
  {
    id: 'theme_customizer',
    title: 'تخصيص المظهر',
    description: 'تغيير ألوان وشعار النظام',
    icon: Palette,
    status: 'active',
    buttonText: 'فتح المخصص',
    category: 'customization',
    color: 'bg-violet-100 text-violet-600'
  },
  {
    id: 'advanced_settings',
    title: 'الإعدادات المتقدمة',
    description: 'تخصيص تفصيلي لجميع جوانب النظام',
    icon: Settings,
    status: 'active',
    buttonText: 'فتح الإعدادات',
    category: 'customization',
    color: 'bg-gray-100 text-gray-600'
  }
]

export const categories = [
  {
    id: 'all',
    name: 'الكل',
    icon: Sparkles
  },
  {
    id: 'tools',
    name: 'الأدوات المساعدة',
    icon: Calculator
  },
  {
    id: 'communication',
    name: 'التواصل',
    icon: MessageSquare
  },

  {
    id: 'analytics',
    name: 'التحليلات',
    icon: BarChart3
  },
  {
    id: 'customization',
    name: 'التخصيص',
    icon: Palette
  }
]

export const statusConfig = {
  active: {
    label: 'متاح',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅'
  },
  coming_soon: {
    label: 'قريباً',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🚧'
  },
  premium: {
    label: 'مميز',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '👑'
  }
}
