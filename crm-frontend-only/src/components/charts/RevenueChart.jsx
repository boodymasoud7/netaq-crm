import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { formatCurrency } from '../../lib/utils'

// بيانات وهمية للرسم البياني - يمكن استبدالها ببيانات حقيقية
const generateMonthlyData = (sales = []) => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ]
  
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    // حساب الإيرادات الفعلية للشهر
    const monthSales = sales.filter(sale => {
      const saleDate = sale.saleDate?.toDate?.() || new Date(sale.saleDate)
      return saleDate.getMonth() === index && saleDate.getFullYear() === currentYear
    })
    
    const revenue = monthSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0)
    
    return {
      month,
      revenue,
      sales: monthSales.length,
      target: Math.max(revenue * 1.2, 500000) // هدف افتراضي
    }
  })
}

export default function RevenueChart({ sales = [], type = 'line' }) {
  const data = generateMonthlyData(sales)
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'revenue' ? 'الإيرادات' : 
               entry.name === 'sales' ? 'عدد المبيعات' : 
               entry.name === 'target' ? 'الهدف' : entry.name}: {' '}
              {entry.name === 'revenue' || entry.name === 'target' 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (type === 'bar') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#e5e5e5' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#666' }}
              axisLine={{ stroke: '#e5e5e5' }}
              tickFormatter={(value) => formatCurrency(value, true)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="revenue" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="revenue"
            />
            <Bar 
              dataKey="target" 
              fill="#e5e7eb" 
              radius={[4, 4, 0, 0]}
              name="target"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e5e5e5' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickFormatter={(value) => formatCurrency(value, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            name="revenue"
          />
          <Line 
            type="monotone" 
            dataKey="target" 
            stroke="#10b981" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
            name="target"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

