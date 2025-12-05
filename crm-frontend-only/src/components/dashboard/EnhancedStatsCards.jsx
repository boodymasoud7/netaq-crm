import { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Award,
  Zap,
  Activity
} from 'lucide-react'
import { Card } from '../ui/card'
import { formatCurrency } from '../../lib/utils'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function EnhancedStatsCards({
  personalStats,
  isAdmin,
  isSales,
  loading = false,
  teamPerformance = [],
  currentUserPerformance = null,
  currentUserRank = null,
  summaryData = null, // Real data from Dashboard Summary API
  chartData = [] // Last 7 days data for charts
}) {
  const [animatedValues, setAnimatedValues] = useState({})
  const [animationKey, setAnimationKey] = useState(0)

  // Use real data from summaryData if available, otherwise fallback to personalStats
  const statsData = [
    {
      id: 'clients',
      title: isAdmin ? 'إجمالي العملاء' : isSales ? 'عملائي' : 'عملاء الفريق',
      value: summaryData?.clients?.current || personalStats?.clientsCount || 0,
      previousValue: summaryData?.clients?.previous || Math.floor((personalStats?.clientsCount || 0) * 0.88),
      change: summaryData?.clients?.change ? `${summaryData.clients.change > 0 ? '+' : ''}${summaryData.clients.change}% ` : '+12%',
      trend: summaryData?.clients?.trend || 'up',
      icon: Users,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      description: 'نمو مستمر في قاعدة العملاء',
      target: 150,
      achievement: 'متفوق',
      period: 'هذا الشهر',
      chartKey: 'clients'
    },
    {
      id: 'leads',
      title: isAdmin ? 'العملاء المحتملين' : isSales ? 'عملائي المحتملين' : 'عملاء الفريق المحتملين',
      value: summaryData?.leads?.current || personalStats?.leadsCount || 0,
      previousValue: summaryData?.leads?.previous || Math.floor((personalStats?.leadsCount || 0) * 0.92),
      change: summaryData?.leads?.change ? `${summaryData.leads.change > 0 ? '+' : ''}${summaryData.leads.change}% ` : '+8%',
      trend: summaryData?.leads?.trend || 'up',
      icon: UserPlus,
      gradient: 'from-orange-500 via-orange-600 to-red-600',
      bgGradient: 'from-orange-50 to-red-50',
      description: 'فرص واعدة تحتاج متابعة',
      target: 100,
      achievement: 'جيد',
      period: 'هذا الأسبوع',
      chartKey: 'leads'
    },
    {
      id: 'projects',
      title: isAdmin ? 'المشاريع النشطة' : isSales ? 'مشاريعي' : 'مشاريع الفريق',
      value: summaryData?.sales?.current || personalStats?.salesCount || 0,
      previousValue: summaryData?.sales?.previous || Math.floor((personalStats?.salesCount || 0) * 0.95),
      change: summaryData?.sales?.change ? `${summaryData.sales.change > 0 ? '+' : ''}${summaryData.sales.change}% ` : '+5%',
      trend: summaryData?.sales?.trend || 'up',
      icon: Building2,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      description: 'مبيعات مكتملة بنجاح',
      target: 25,
      achievement: 'ممتاز',
      period: 'الربع الحالي',
      chartKey: 'sales'
    },
    {
      id: 'revenue',
      title: isAdmin ? 'إجمالي المبيعات' : isSales ? 'إيراداتي' : 'إيرادات الفريق',
      value: formatCurrency(summaryData?.revenue?.current || personalStats?.revenue || 0),
      previousValue: summaryData?.revenue?.previous || Math.floor((personalStats?.revenue || 0) * 0.85),
      change: summaryData?.revenue?.change ? `${summaryData.revenue.change > 0 ? '+' : ''}${summaryData.revenue.change}% ` : '+15%',
      trend: summaryData?.revenue?.trend || 'up',
      icon: DollarSign,
      gradient: 'from-green-500 via-green-600 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      description: 'نمو قوي في الإيرادات',
      target: 500000,
      achievement: 'استثنائي',
      period: 'هذا الشهر',
      chartKey: 'sales'
    }
  ]

  // Animate values on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const newAnimatedValues = {}
      statsData.forEach(stat => {
        if (typeof stat.value === 'number') {
          newAnimatedValues[stat.id] = stat.value
        }
      })
      setAnimatedValues(newAnimatedValues)
    }, 100)

    return () => clearTimeout(timer)
  }, [personalStats, summaryData])

  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [personalStats, summaryData])

  const getAchievementColor = (achievement) => {
    switch (achievement) {
      case 'استثنائي': return 'text-purple-600 bg-purple-100'
      case 'ممتاز': return 'text-green-600 bg-green-100'
      case 'متفوق': return 'text-blue-600 bg-blue-100'
      case 'جيد': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
        const delay = index * 0.1
        const progress = typeof stat.value === 'number' ? Math.min((stat.value / stat.target) * 100, 100) : 0

        // Get chart data for this stat
        const statChartData = chartData.map(day => ({
          value: day[stat.chartKey] || 0
        }))

        return (
          <Card
            key={`stat-${animationKey}-${stat.id}`}
            className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group cursor-pointer"
            style={{ animation: `slideInUp 0.8s ease-out ${delay}s both` }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>

            {/* Floating Elements */}
            <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <div className="w-16 h-16 rounded-full bg-white"></div>
            </div>

            <div className="relative p-6 z-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p - 4 rounded - 2xl bg - gradient - to - br ${stat.gradient} shadow - xl group - hover: scale - 110 transition - transform duration - 300`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>

                {/* Trend Indicator */}
                <div className={`flex items - center gap - 1 px - 3 py - 1.5 rounded - full ${stat.trend === 'up'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
                  } shadow - sm`}>
                  <TrendIcon className="h-4 w-4" />
                  <span className="text-sm font-bold">{stat.change}</span>
                </div>
              </div>

              {/* Main Content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">{stat.title}</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-300">
                      {typeof stat.value === 'number' ?
                        (animatedValues[stat.id] || 0) :
                        stat.value
                      }
                    </p>
                    {/* Sparkline Chart */}
                    {statChartData.length > 0 && (
                      <div className="flex-1">
                        <ResponsiveContainer width="100%" height={40}>
                          <LineChart data={statChartData}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={stat.trend === 'up' ? '#10b981' : '#ef4444'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                </div>

                {/* Progress Bar */}
                {typeof stat.value === 'number' && stat.target && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>التقدم نحو الهدف</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h - 2.5 rounded - full bg - gradient - to - r ${stat.gradient} transition - all duration - 1000 ease - out relative overflow - hidden`}
                        style={{ width: `${progress}% ` }}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Info */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`px - 2 py - 1 rounded - md text - xs font - medium ${getAchievementColor(stat.achievement)} `}>
                      {stat.achievement}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{stat.period}</div>
                </div>
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"></div>
          </Card>
        )
      })}

    </div>
  )
}
