import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

const COLORS = {
  active: '#10b981',    // أخضر
  potential: '#f59e0b', // برتقالي
  inactive: '#6b7280',  // رمادي
  hot: '#ef4444',       // أحمر
  warm: '#f59e0b',      // برتقالي
  cold: '#3b82f6'       // أزرق
}

export default function SalesChart({ 
  clients = [], 
  leads = [], 
  type = 'clients-status', 
  chartType = 'pie' 
}) {
  
  const generateClientsStatusData = () => {
    const statusCount = clients.reduce((acc, client) => {
      const status = client.status || 'inactive'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    return [
      { name: 'نشط', value: statusCount.active || 0, color: COLORS.active },
      { name: 'محتمل', value: statusCount.potential || 0, color: COLORS.potential },
      { name: 'غير نشط', value: statusCount.inactive || 0, color: COLORS.inactive }
    ].filter(item => item.value > 0)
  }

  const generateLeadsStatusData = () => {
    const statusCount = leads.reduce((acc, lead) => {
      const status = lead.status || 'cold'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})
    
    return [
      { name: 'ساخن', value: statusCount.hot || 0, color: COLORS.hot },
      { name: 'دافئ', value: statusCount.warm || 0, color: COLORS.warm },
      { name: 'بارد', value: statusCount.cold || 0, color: COLORS.cold }
    ].filter(item => item.value > 0)
  }

  const generateSourceData = () => {
    const sourceCount = [...clients, ...leads].reduce((acc, item) => {
      const source = item.source || 'غير محدد'
      const sourceLabel = {
        'website': 'الموقع الإلكتروني',
        'social': 'وسائل التواصل',
        'referral': 'إحالة',
        'advertising': 'إعلان',
        'exhibition': 'معرض',
        'غير محدد': 'غير محدد'
      }[source] || source
      
      acc[sourceLabel] = (acc[sourceLabel] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(sourceCount).map(([name, value], index) => ({
      name,
      value,
      color: Object.values(COLORS)[index % Object.values(COLORS).length]
    }))
  }

  const getData = () => {
    switch (type) {
      case 'clients-status':
        return generateClientsStatusData()
      case 'leads-status':
        return generateLeadsStatusData()
      case 'sources':
        return generateSourceData()
      default:
        return generateClientsStatusData()
    }
  }

  const data = getData()
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            العدد: <span className="font-medium">{data.value}</span>
          </p>
          <p className="text-sm text-gray-600">
            النسبة: <span className="font-medium">
              {((data.value / data.payload.total) * 100).toFixed(1)}%
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null // لا تظهر التسمية إذا كانت النسبة أقل من 5%
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">لا توجد بيانات للعرض</p>
        </div>
      </div>
    )
  }

  if (chartType === 'bar') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '10px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

