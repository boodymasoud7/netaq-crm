import React from 'react'
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

export default function PerformanceChart({ 
  clients = [], 
  leads = [], 
  sales = [], 
  type = 'conversion',
  chartType = 'radial' 
}) {
  
  const calculateConversionRate = () => {
    if (leads.length === 0) return 0
    return ((clients.length / leads.length) * 100).toFixed(1)
  }

  const calculateSalesConversion = () => {
    if (clients.length === 0) return 0
    return ((sales.length / clients.length) * 100).toFixed(1)
  }

  const calculateActivityScore = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const thisMonthClients = clients.filter(client => {
      const createdDate = client.createdAt?.toDate?.() || new Date(client.createdAt)
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
    }).length

    const thisMonthSales = sales.filter(sale => {
      const saleDate = sale.saleDate?.toDate?.() || new Date(sale.saleDate)
      return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear
    }).length

    // نقاط الأداء بناء على النشاط
    const score = Math.min(100, (thisMonthClients * 10) + (thisMonthSales * 20))
    return score
  }

  const generateRadialData = () => {
    const conversionRate = parseFloat(calculateConversionRate())
    const salesConversion = parseFloat(calculateSalesConversion())
    const activityScore = calculateActivityScore()

    return [
      {
        name: 'معدل التحويل',
        value: conversionRate,
        fill: '#3b82f6'
      },
      {
        name: 'تحويل المبيعات',
        value: salesConversion,
        fill: '#10b981'
      },
      {
        name: 'نقاط النشاط',
        value: activityScore,
        fill: '#f59e0b'
      }
    ]
  }

  const generateTrendData = () => {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو']
    const currentMonth = new Date().getMonth()
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      // حساب العملاء الجدد لكل شهر
      const monthClients = clients.filter(client => {
        const createdDate = client.createdAt?.toDate?.() || new Date(client.createdAt)
        return createdDate.getMonth() === index
      }).length

      // حساب المبيعات لكل شهر
      const monthSales = sales.filter(sale => {
        const saleDate = sale.saleDate?.toDate?.() || new Date(sale.saleDate)
        return saleDate.getMonth() === index
      }).length

      return {
        month,
        clients: monthClients,
        sales: monthSales,
        conversion: monthClients > 0 ? ((monthSales / monthClients) * 100) : 0
      }
    })
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}
              {entry.name.includes('معدل') || entry.name.includes('تحويل') ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (type === 'trend' || chartType === 'area') {
    const trendData = generateTrendData()
    
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="clientsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="clients"
              stackId="1"
              stroke="#3b82f6"
              fill="url(#clientsGradient)"
              name="العملاء الجدد"
            />
            <Area
              type="monotone"
              dataKey="sales"
              stackId="2"
              stroke="#10b981"
              fill="url(#salesGradient)"
              name="المبيعات"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const radialData = generateRadialData()
  
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="20%" 
          outerRadius="90%" 
          data={radialData}
        >
          <RadialBar
            minAngle={15}
            label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
            background
            clockWise
            dataKey="value"
          />
          <Tooltip content={<CustomTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* مؤشرات الأداء */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        {radialData.map((item, index) => (
          <div key={index} className="text-center">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-1"
              style={{ backgroundColor: item.fill }}
            />
            <p className="text-xs text-gray-600">{item.name}</p>
            <p className="text-sm font-bold text-gray-900">
              {item.value.toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

