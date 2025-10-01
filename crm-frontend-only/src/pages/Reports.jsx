import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Building2,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { formatCurrency, formatDateArabic } from '../lib/utils'
import { useApiData } from '../hooks/useApi'
import { dbAPI } from '../lib/apiSwitch'
import { LoadingPage } from '../components/ui/loading'

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedReport, setSelectedReport] = useState('sales')

  const reportTypes = [
    { id: 'sales', name: 'تقرير المبيعات', icon: DollarSign, color: 'text-green-600' },
    { id: 'clients', name: 'تقرير العملاء', icon: Users, color: 'text-blue-600' },
    { id: 'projects', name: 'تقرير المشاريع', icon: Building2, color: 'text-purple-600' },
    { id: 'performance', name: 'تقرير الأداء', icon: TrendingUp, color: 'text-orange-600' }
  ]

  // Real data from API
  const { data: salesResponse, loading: salesLoading, error: salesError } = useApiData(() => dbAPI.getSales({ limit: 1000 }))
  const { data: clientsResponse, loading: clientsLoading, error: clientsError } = useApiData(() => dbAPI.getClients({ limit: 1000 }))
  const { data: projectsResponse, loading: projectsLoading, error: projectsError } = useApiData(() => dbAPI.getProjects({ limit: 1000 }))
  
  // Process real data
  const allSales = salesResponse?.data || []
  const allClients = clientsResponse?.data || []
  const allProjects = projectsResponse?.data || []
  
  // Calculate real sales data
  const salesData = {
    totalSales: allSales.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0),
    monthlyGrowth: calculateMonthlyGrowth(allSales),
    transactionCount: allSales.length,
    averageValue: allSales.length > 0 ? allSales.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0) / allSales.length : 0
  }

  // Calculate real clients data
  const clientsData = {
    totalClients: allClients.length,
    newClients: calculateNewClients(allClients),
    activeClients: allClients.filter(client => client.status === 'active' || client.status === 'نشط').length,
    conversionRate: calculateConversionRate(allClients)
  }
  
  // Helper functions
  function calculateMonthlyGrowth(sales) {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const currentMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    }).reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0)
    
    const lastMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt || sale.date)
      return saleDate.getMonth() === lastMonth && saleDate.getFullYear() === lastMonthYear
    }).reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0)
    
    if (lastMonthSales === 0) return 0
    return ((currentMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1)
  }
  
  function calculateNewClients(clients) {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    return clients.filter(client => {
      const clientDate = new Date(client.createdAt)
      return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear
    }).length
  }
  
  function calculateConversionRate(clients) {
    const activeClients = clients.filter(client => client.status === 'active' || client.status === 'نشط').length
    return clients.length > 0 ? ((activeClients / clients.length) * 100).toFixed(1) : 0
  }

  if (salesLoading || clientsLoading || projectsLoading) {
    return <LoadingPage />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير والتحليلات</h1>
          <p className="text-gray-600 mt-1">عرض وتصدير التقارير التفصيلية للأداء</p>
        </div>
        <Button className="bizmax-button-primary">
          <Download className="h-4 w-4 ml-2" />
          تصدير التقرير
        </Button>
      </div>

      {/* Filters */}
      <Card className="bizmax-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع التقرير</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {reportTypes.map((report) => {
                  const Icon = report.icon
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedReport === report.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mx-auto mb-1 ${
                        selectedReport === report.id ? 'text-primary-600' : report.color
                      }`} />
                      <p className={`text-xs font-medium ${
                        selectedReport === report.id ? 'text-primary-900' : 'text-gray-700'
                      }`}>
                        {report.name}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">الفترة الزمنية</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bizmax-input w-full"
              >
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
                <option value="quarter">هذا الربع</option>
                <option value="year">هذا العام</option>
                <option value="custom">فترة مخصصة</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {selectedReport === 'sales' && (
        <>
          {/* Sales Summary */}
          <div className="bizmax-grid-4">
            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.totalSales)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">النمو الشهري</p>
                  <p className="text-2xl font-bold text-gray-900">+{salesData.monthlyGrowth}%</p>
                </div>
              </div>
            </Card>

            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">عدد المعاملات</p>
                  <p className="text-2xl font-bold text-gray-900">{salesData.transactionCount}</p>
                </div>
              </div>
            </Card>

            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">متوسط قيمة البيع</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesData.averageValue)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sales Chart */}
          <Card className="bizmax-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary-600" />
                اتجاه المبيعات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">مخطط بياني للمبيعات</p>
                  <p className="text-sm text-gray-400 mt-1">سيتم تطوير المخططات قريباً</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedReport === 'clients' && (
        <>
          {/* Clients Summary */}
          <div className="bizmax-grid-4">
            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي العملاء</p>
                  <p className="text-2xl font-bold text-gray-900">{clientsData.totalClients}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">عملاء جدد</p>
                  <p className="text-2xl font-bold text-gray-900">+{clientsData.newClients}</p>
                </div>
              </div>
            </Card>

            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">عملاء نشطين</p>
                  <p className="text-2xl font-bold text-gray-900">{clientsData.activeClients}</p>
                </div>
              </div>
            </Card>

            <Card className="bizmax-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PieChart className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">معدل التحويل</p>
                  <p className="text-2xl font-bold text-gray-900">{clientsData.conversionRate}%</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Client Activity Chart */}
          <Card className="bizmax-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                نشاط العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">مخطط بياني لنشاط العملاء</p>
                  <p className="text-sm text-gray-400 mt-1">سيتم تطوير المخططات قريباً</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Export Options */}
      <Card className="bizmax-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-600" />
            خيارات التصدير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">PDF</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Excel</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">CSV</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Word</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

