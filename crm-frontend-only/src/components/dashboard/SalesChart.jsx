import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Award } from 'lucide-react'
import { Card } from '../ui/card'
import { formatCurrency } from '../../lib/utils'

export default function SalesChart({ salesData = [], loading = false }) {
  const [chartData, setChartData] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('week') // week, month, year
  const [animationKey, setAnimationKey] = useState(0)

  // Process real sales data for chart
  const processRealSalesData = (realData, period) => {
    if (!realData || !Array.isArray(realData)) {
      return []
    }
    
    const today = new Date()
    const data = []
    
    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        // Find sales for this date
        const daySales = realData.filter(sale => {
          if (!sale.createdAt) return false
          const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
          return saleDate === dateStr
        })
        
        const totalSales = daySales.reduce((sum, sale) => sum + (sale.totalAmount || sale.price || 0), 0)
        const clients = daySales.length
        const leads = Math.floor(clients * 1.5) // Estimate based on conversion rate
        
        data.push({
          date: date.toLocaleDateString('ar-EG', { weekday: 'short' }),
          fullDate: date.toLocaleDateString('ar-EG'),
          sales: totalSales,
          clients,
          leads
        })
      }
    } else if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        // Find sales for this date
        const daySales = realData.filter(sale => {
          if (!sale.createdAt) return false
          const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
          return saleDate === dateStr
        })
        
        const totalSales = daySales.reduce((sum, sale) => sum + (sale.totalAmount || sale.price || 0), 0)
        const clients = daySales.length
        const leads = Math.floor(clients * 1.5) // Estimate based on conversion rate
        
        data.push({
          date: date.getDate().toString(),
          fullDate: date.toLocaleDateString('ar-EG'),
          sales: totalSales,
          clients,
          leads
        })
      }
    }
    
    return data
  }

  useEffect(() => {
    setChartData(processRealSalesData(salesData, selectedPeriod))
    setAnimationKey(prev => prev + 1)
  }, [selectedPeriod, salesData])

  const maxSales = Math.max(...chartData.map(d => d.sales))
  const totalSales = chartData.reduce((sum, d) => sum + d.sales, 0)
  const avgSales = chartData.length > 0 ? totalSales / chartData.length : 0
  const trend = chartData.length > 1 ? 
    ((chartData[chartData.length - 1]?.sales || 0) - (chartData[0]?.sales || 0)) / (chartData[0]?.sales || 1) * 100 : 0

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-80 bg-gray-200 rounded-lg"></div>
      </Card>
    )
  }

  // If no real data, show empty chart
  if (!salesData || salesData.length === 0 || chartData.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">أداء المبيعات</h3>
                <p className="text-sm text-gray-600">لا توجد بيانات مبيعات</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مبيعات</h3>
            <p className="text-gray-600">سيتم عرض الرسم البياني عند إضافة المبيعات</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">أداء المبيعات</h3>
              <p className="text-sm text-gray-600">تحليل مفصل للإيرادات</p>
            </div>
          </div>
          
          {/* Period Selector */}
          <div className="flex bg-white rounded-lg p-1 shadow-sm border">
            {[
              { key: 'week', label: 'أسبوع' },
              { key: 'month', label: 'شهر' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === period.key
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalSales)}</div>
            <div className="text-sm text-gray-600">إجمالي المبيعات</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(avgSales)}</div>
            <div className="text-sm text-gray-600">متوسط يومي</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">نمو الفترة</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="relative h-80 bg-gradient-to-b from-gray-50 to-white rounded-xl p-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-4">
            <span>{formatCurrency(maxSales)}</span>
            <span>{formatCurrency(maxSales * 0.75)}</span>
            <span>{formatCurrency(maxSales * 0.5)}</span>
            <span>{formatCurrency(maxSales * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-16 mr-4 h-full flex items-end justify-between gap-1">
            {chartData.map((item, index) => {
              const height = (item.sales / maxSales) * 100
              const delay = index * 0.1
              
              return (
                <div key={`${animationKey}-${index}`} className="flex-1 flex flex-col items-center group">
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer relative overflow-hidden"
                    style={{ 
                      height: `${height}%`,
                      animation: `slideUp 0.8s ease-out ${delay}s both`
                    }}
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div className="font-semibold">{item.fullDate}</div>
                        <div className="text-blue-300">{formatCurrency(item.sales)}</div>
                        <div className="text-green-300">{item.clients} عملاء</div>
                        <div className="text-orange-300">{item.leads} فرص</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* X-axis label */}
                  <div className="mt-2 text-xs text-gray-600 font-medium">{item.date}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="p-2 bg-blue-500 rounded-lg">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">{chartData.filter(d => d.sales > 0).length}</div>
              <div className="text-xs text-blue-700">أيام نشطة</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {chartData.length > 0 ? Math.round((chartData.filter(d => d.sales > 0).length / chartData.length) * 100) : 0}%
              </div>
              <div className="text-xs text-green-700">تحقيق الهدف</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">{chartData.reduce((sum, d) => sum + d.clients, 0)}</div>
              <div className="text-xs text-orange-700">عملاء جدد</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Award className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">{Math.max(...chartData.map(d => d.sales)) === Math.min(...chartData.map(d => d.sales)) ? 0 : Math.round(((Math.max(...chartData.map(d => d.sales)) - Math.min(...chartData.map(d => d.sales))) / Math.min(...chartData.map(d => d.sales))) * 100)}%</div>
              <div className="text-xs text-purple-700">تحسن الأداء</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: var(--final-height);
            opacity: 1;
          }
        }
      `}</style>
    </Card>
  )
}
