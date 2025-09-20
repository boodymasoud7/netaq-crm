import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  Users,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Zap
} from 'lucide-react'

export default function AdvancedCharts({ stats, salesData = [], clientsData = [], leadsData = [] }) {
  const [activeChart, setActiveChart] = useState('revenue')
  const [timeRange, setTimeRange] = useState('monthly')
  
  console.log('📊 AdvancedCharts received data:', { stats, salesData, clientsData, leadsData })
  
  // Check if we have any meaningful data
  const hasData = (salesData.length > 0 || clientsData.length > 0 || leadsData.length > 0) &&
                  (stats?.sales?.totalRevenue > 0 || stats?.sales?.totalSales > 0)
  
  if (!hasData) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">التحليلات المتقدمة</h3>
        <p className="text-gray-600 mb-4">
          لا توجد بيانات كافية لإنشاء التحليلات والرسوم البيانية.
        </p>
        <div className="text-sm text-gray-500">
          📈 سيتم عرض التحليلات المتقدمة عند وجود مبيعات وبيانات كافية
        </div>
      </Card>
    )
  }
  
  // Generate revenue trend data using real data where possible
  const totalRevenue = stats?.sales?.totalRevenue || 0
  const totalSales = stats?.sales?.totalSales || 0
  const totalLeads = stats?.leads?.totalLeads || 0
  
  const revenueData = [
    { month: 'يناير', revenue: Math.round(totalRevenue * 0.15), target: Math.round(totalRevenue * 0.17), sales: Math.round(totalSales * 0.15), leads: Math.round(totalLeads * 0.15) },
    { month: 'فبراير', revenue: Math.round(totalRevenue * 0.18), target: Math.round(totalRevenue * 0.17), sales: Math.round(totalSales * 0.18), leads: Math.round(totalLeads * 0.18) },
    { month: 'مارس', revenue: Math.round(totalRevenue * 0.16), target: Math.round(totalRevenue * 0.17), sales: Math.round(totalSales * 0.16), leads: Math.round(totalLeads * 0.16) },
    { month: 'أبريل', revenue: Math.round(totalRevenue * 0.20), target: Math.round(totalRevenue * 0.17), sales: Math.round(totalSales * 0.20), leads: Math.round(totalLeads * 0.20) },
    { month: 'مايو', revenue: Math.round(totalRevenue * 0.17), target: Math.round(totalRevenue * 0.17), sales: Math.round(totalSales * 0.17), leads: Math.round(totalLeads * 0.17) },
    { month: 'يونيو', revenue: Math.round(totalRevenue * 0.14), target: Math.round(totalRevenue * 0.17), sales: Math.round(totalSales * 0.14), leads: Math.round(totalLeads * 0.14) }
  ]
  
  // Sales performance by category
  const salesByCategory = [
    { name: 'شقق سكنية', value: 45, color: '#3B82F6' },
    { name: 'فيلات', value: 25, color: '#10B981' },
    { name: 'محلات تجارية', value: 20, color: '#F59E0B' },
    { name: 'أراضي', value: 10, color: '#EF4444' }
  ]
  
  // Team performance data - Use real data from backend stats
  const teamPerformance = stats?.sales?.topSalespeople || []
  
  // Conversion funnel data - Use real conversion data
  const totalLeadsCount = stats?.leads?.totalLeads || 0
  const convertedLeadsCount = stats?.leads?.convertedLeads || 0
  const totalSalesCount = stats?.sales?.totalSales || 0
  
  const conversionData = [
    { 
      stage: 'عملاء محتملين', 
      count: totalLeadsCount, 
      percentage: 100 
    },
    { 
      stage: 'عملاء محولين', 
      count: convertedLeadsCount, 
      percentage: totalLeadsCount > 0 ? Math.round((convertedLeadsCount / totalLeadsCount) * 100) : 0 
    },
    { 
      stage: 'مبيعات مكتملة', 
      count: totalSalesCount, 
      percentage: totalLeadsCount > 0 ? Math.round((totalSalesCount / totalLeadsCount) * 100) : 0 
    }
  ]
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.dataKey}:</span>
              <span className="font-medium text-gray-900">
                {entry.dataKey === 'revenue' || entry.dataKey === 'target' 
                  ? formatCurrency(entry.value) 
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }
  
  const charts = [
    {
      id: 'revenue',
      title: 'تطور الإيرادات',
      icon: DollarSign,
      description: 'مقارنة الإيرادات مع الأهداف',
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'sales',
      title: 'أداء المبيعات',
      icon: BarChart3,
      description: 'توزيع المبيعات حسب النوع',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'team',
      title: 'أداء الفريق',
      icon: Users,
      description: 'مقارنة أداء أعضاء الفريق',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'conversion',
      title: 'قمع التحويل',
      icon: Target,
      description: 'معدلات التحويل في كل مرحلة',
      color: 'from-orange-500 to-red-500'
    }
  ]
  
  const renderChart = () => {
    switch (activeChart) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
                fill="url(#revenueGradient)"
                name="الإيرادات الفعلية"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#targetGradient)"
                name="الهدف المطلوب"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
        
      case 'sales':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={salesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {salesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )
        
      case 'team':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={teamPerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="sales" fill="#3B82F6" name="عدد المبيعات" radius={[4, 4, 0, 0]} />
              <Bar dataKey="efficiency" fill="#10B981" name="كفاءة الأداء %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
        
      case 'conversion':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={conversionData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" stroke="#6B7280" fontSize={12} />
              <YAxis dataKey="stage" type="category" stroke="#6B7280" fontSize={12} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#8B5CF6" name="العدد" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
        
      default:
        return null
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Chart Navigation */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">التحليلات المتقدمة</h2>
            <p className="text-gray-600">رؤى تفصيلية لأداء الأعمال</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['weekly', 'monthly', 'quarterly', 'yearly'].map(range => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-sm"
              >
                {range === 'weekly' && 'أسبوعي'}
                {range === 'monthly' && 'شهري'}
                {range === 'quarterly' && 'ربعي'}
                {range === 'yearly' && 'سنوي'}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Chart Type Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {charts.map(chart => {
            const Icon = chart.icon
            return (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id)}
                className={`p-4 rounded-xl text-right transition-all duration-300 ${
                  activeChart === chart.id
                    ? `bg-gradient-to-r ${chart.color} text-white shadow-lg transform scale-105`
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    activeChart === chart.id 
                      ? 'bg-white bg-opacity-20' 
                      : 'bg-gray-200'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      activeChart === chart.id ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{chart.title}</h3>
                    <p className={`text-xs ${
                      activeChart === chart.id ? 'text-white text-opacity-80' : 'text-gray-500'
                    }`}>
                      {chart.description}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Chart Container */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {charts.find(c => c.id === activeChart)?.title}
            </h3>
            
            {/* Chart Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                تصدير
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                تقرير
              </Button>
            </div>
          </div>
          
          {/* Chart */}
          <div className="w-full">
            {renderChart()}
          </div>
        </div>
      </Card>
      
      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-800">نمو الإيرادات</h4>
              <p className="text-2xl font-bold text-green-700">+22%</p>
              <p className="text-sm text-green-600">مقارنة بالشهر الماضي</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-blue-800">معدل التحويل</h4>
              <p className="text-2xl font-bold text-blue-700">18.5%</p>
              <p className="text-sm text-blue-600">من العملاء المحتملين</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-purple-800">أفضل مبيع</h4>
              <p className="text-lg font-bold text-purple-700">محمد علي</p>
              <p className="text-sm text-purple-600">18 مبيعة هذا الشهر</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
