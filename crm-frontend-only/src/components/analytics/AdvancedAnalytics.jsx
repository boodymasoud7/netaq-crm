import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  Award,
  Activity,
  Users,
  DollarSign,
  Building2,
  Phone
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import RevenueChart from '../charts/RevenueChart'
import SalesChart from '../charts/SalesChart'
import PerformanceChart from '../charts/PerformanceChart'
import { formatCurrency, formatDateArabic } from '../../lib/utils'

const TIME_PERIODS = [
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'quarter', label: 'هذا الربع' },
  { value: 'year', label: 'هذا العام' }
]

const METRIC_CATEGORIES = {
  sales: { name: 'المبيعات', icon: DollarSign, color: 'text-green-600' },
  clients: { name: 'العملاء', icon: Users, color: 'text-blue-600' },
  projects: { name: 'المشاريع', icon: Building2, color: 'text-purple-600' },
  performance: { name: 'الأداء', icon: Activity, color: 'text-orange-600' }
}

export default function AdvancedAnalytics({ 
  clients = [], 
  leads = [], 
  sales = [], 
  projects = [],
  className = "" 
}) {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('sales')
  const [metrics, setMetrics] = useState({})
  const [trends, setTrends] = useState({})

  // حساب المؤشرات
  useEffect(() => {
    calculateMetrics()
    calculateTrends()
  }, [clients, leads, sales, projects, selectedPeriod])

  const calculateMetrics = () => {
    const now = new Date()
    const periodData = filterDataByPeriod(now, selectedPeriod)

    setMetrics({
      // مؤشرات المبيعات
      totalRevenue: sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      averageSaleValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0) / sales.length : 0,
      salesCount: periodData.sales.length,
      conversionRate: leads.length > 0 ? (clients.length / leads.length) * 100 : 0,

      // مؤشرات العملاء
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      newClients: periodData.clients.length,
      clientRetention: calculateRetentionRate(),

      // مؤشرات الأداء
      responseTime: calculateAverageResponseTime(),
      meetingConversion: calculateMeetingConversion(),
      followUpRate: calculateFollowUpRate(),
      customerSatisfaction: 4.2 // يمكن ربطها بنظام تقييم حقيقي
    })
  }

  const calculateTrends = () => {
    const previousPeriodData = getPreviousPeriodData()
    const currentPeriodData = getCurrentPeriodData()

    setTrends({
      revenue: calculateTrendPercentage(
        currentPeriodData.revenue, 
        previousPeriodData.revenue
      ),
      clients: calculateTrendPercentage(
        currentPeriodData.clients, 
        previousPeriodData.clients
      ),
      sales: calculateTrendPercentage(
        currentPeriodData.sales, 
        previousPeriodData.sales
      ),
      conversion: calculateTrendPercentage(
        currentPeriodData.conversion, 
        previousPeriodData.conversion
      )
    })
  }

  const filterDataByPeriod = (date, period) => {
    const startDate = getStartDate(date, period)
    
    return {
      clients: clients.filter(c => {
        const createdDate = c.createdAt?.toDate?.() || new Date(c.createdAt)
        return createdDate >= startDate
      }),
      leads: leads.filter(l => {
        const createdDate = l.createdAt?.toDate?.() || new Date(l.createdAt)
        return createdDate >= startDate
      }),
      sales: sales.filter(s => {
        const saleDate = s.saleDate?.toDate?.() || new Date(s.saleDate)
        return saleDate >= startDate
      })
    }
  }

  const getStartDate = (date, period) => {
    const start = new Date(date)
    switch (period) {
      case 'week':
        start.setDate(date.getDate() - 7)
        break
      case 'month':
        start.setMonth(date.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(date.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(date.getFullYear() - 1)
        break
    }
    return start
  }

  const calculateRetentionRate = () => {
    // حساب معدل الاحتفاظ بالعملاء
    const activeClients = clients.filter(c => c.status === 'active').length
    return clients.length > 0 ? (activeClients / clients.length) * 100 : 0
  }

  const calculateAverageResponseTime = () => {
    // حساب متوسط وقت الاستجابة (بالساعات)
    // هذا مثال - يمكن ربطه ببيانات حقيقية
    return 2.5
  }

  const calculateMeetingConversion = () => {
    // حساب معدل تحويل الاجتماعات إلى مبيعات
    const meetingsCount = leads.filter(l => l.lastContact).length
    return meetingsCount > 0 ? (sales.length / meetingsCount) * 100 : 0
  }

  const calculateFollowUpRate = () => {
    // حساب معدل المتابعة
    const clientsWithFollowUp = clients.filter(c => 
      c.lastContact && new Date() - new Date(c.lastContact) < 7 * 24 * 60 * 60 * 1000
    ).length
    return clients.length > 0 ? (clientsWithFollowUp / clients.length) * 100 : 0
  }

  const getCurrentPeriodData = () => {
    const periodData = filterDataByPeriod(new Date(), selectedPeriod)
    return {
      revenue: periodData.sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      clients: periodData.clients.length,
      sales: periodData.sales.length,
      conversion: periodData.leads.length > 0 ? (periodData.clients.length / periodData.leads.length) * 100 : 0
    }
  }

  const getPreviousPeriodData = () => {
    const previousDate = new Date()
    switch (selectedPeriod) {
      case 'week':
        previousDate.setDate(previousDate.getDate() - 14)
        break
      case 'month':
        previousDate.setMonth(previousDate.getMonth() - 2)
        break
      case 'quarter':
        previousDate.setMonth(previousDate.getMonth() - 6)
        break
      case 'year':
        previousDate.setFullYear(previousDate.getFullYear() - 2)
        break
    }
    
    const periodData = filterDataByPeriod(previousDate, selectedPeriod)
    return {
      revenue: periodData.sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0),
      clients: periodData.clients.length,
      sales: periodData.sales.length,
      conversion: periodData.leads.length > 0 ? (periodData.clients.length / periodData.leads.length) * 100 : 0
    }
  }

  const calculateTrendPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const getTrendIcon = (trend) => {
    return trend >= 0 ? TrendingUp : TrendingDown
  }

  const getTrendColor = (trend) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getTopPerformers = () => {
    // حساب أفضل الأداءات (يمكن تطويرها حسب المتطلبات)
    return [
      { name: 'أعلى مبيعة', value: formatCurrency(Math.max(...sales.map(s => s.totalAmount || 0))), icon: Award },
      { name: 'أكثر عميل نشاطاً', value: clients.find(c => c.status === 'active')?.name || 'غير محدد', icon: Users },
      { name: 'أفضل مشروع', value: projects[0]?.name || 'غير محدد', icon: Building2 }
    ]
  }

  const getGoalProgress = () => {
    // أهداف شهرية (يمكن جعلها قابلة للتخصيص)
    const monthlyTarget = 1000000 // مليون جنيه
    const currentRevenue = metrics.totalRevenue || 0
    const progress = (currentRevenue / monthlyTarget) * 100

    return {
      target: monthlyTarget,
      current: currentRevenue,
      progress: Math.min(progress, 100)
    }
  }

  const topPerformers = getTopPerformers()
  const goalProgress = getGoalProgress()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">التحليلات المتقدمة</h2>
          <p className="text-gray-600">رؤى تفصيلية حول أداء الأعمال</p>
        </div>
        
        <div className="flex gap-2">
          {/* Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {TIME_PERIODS.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>

          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Object.entries(METRIC_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.totalRevenue)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                {React.createElement(getTrendIcon(trends.revenue), {
                  className: `h-3 w-3 ${getTrendColor(trends.revenue)}`
                })}
                <span className={`text-xs ${getTrendColor(trends.revenue)}`}>
                  {trends.revenue?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">العملاء الجدد</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.newClients}</p>
              <div className="flex items-center gap-1 mt-1">
                {React.createElement(getTrendIcon(trends.clients), {
                  className: `h-3 w-3 ${getTrendColor(trends.clients)}`
                })}
                <span className={`text-xs ${getTrendColor(trends.clients)}`}>
                  {trends.clients?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">معدل التحويل</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.conversionRate?.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1 mt-1">
                {React.createElement(getTrendIcon(trends.conversion), {
                  className: `h-3 w-3 ${getTrendColor(trends.conversion)}`
                })}
                <span className={`text-xs ${getTrendColor(trends.conversion)}`}>
                  {trends.conversion?.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">متوسط قيمة البيع</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics.averageSaleValue, true)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-600">نشط</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Goal Progress */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary-600" />
            <h3 className="font-semibold text-gray-900">تقدم الهدف الشهري</h3>
          </div>
          <Badge variant={goalProgress.progress >= 100 ? 'default' : 'secondary'}>
            {goalProgress.progress.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">الهدف: {formatCurrency(goalProgress.target)}</span>
            <span className="text-gray-600">المحقق: {formatCurrency(goalProgress.current)}</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                goalProgress.progress >= 100 ? 'bg-green-500' : 'bg-primary-500'
              }`}
              style={{ width: `${Math.min(goalProgress.progress, 100)}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-500">
            {goalProgress.progress >= 100 
              ? '🎉 تم تحقيق الهدف!' 
              : `باقي ${formatCurrency(goalProgress.target - goalProgress.current)} لتحقيق الهدف`
            }
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">اتجاه الإيرادات</h3>
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
          <RevenueChart sales={sales} type="line" />
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">مؤشرات الأداء</h3>
            <Button variant="ghost" size="sm">
              <Activity className="h-4 w-4" />
            </Button>
          </div>
          <PerformanceChart 
            clients={clients} 
            leads={leads} 
            sales={sales} 
            type="conversion" 
          />
        </Card>
      </div>

      {/* Top Performers & Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">أفضل الأداءات</h3>
          </div>
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <performer.icon className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                    <p className="text-xs text-gray-600">{performer.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Key Insights */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">رؤى مهمة</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">نمو إيجابي</span>
              </div>
              <p className="text-xs text-blue-700">
                زيادة في عدد العملاء الجدد بنسبة {trends.clients?.toFixed(1)}% مقارنة بالفترة السابقة
              </p>
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">معدل احتفاظ ممتاز</span>
              </div>
              <p className="text-xs text-green-700">
                معدل الاحتفاظ بالعملاء {metrics.clientRetention?.toFixed(1)}% وهو أعلى من المتوسط
              </p>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">سرعة الاستجابة</span>
              </div>
              <p className="text-xs text-orange-700">
                متوسط وقت الاستجابة {metrics.responseTime} ساعة - ممتاز!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}


