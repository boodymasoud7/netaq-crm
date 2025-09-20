import { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { dbAPI } from '../../lib/apiSwitch.js'
import {
  Activity,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Building2,
  Target,
  Zap,
  Bell,
  Eye,
  RefreshCw,
  Play,
  Pause
} from 'lucide-react'

export default function RealTimeMonitor({ hasData = false }) {
  const [isLive, setIsLive] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Process real activities data
  
  // Add new activity every 3-8 seconds when live
  // Fetch real activity data
  const fetchActivities = async () => {
    if (!hasData) {
      console.log('📡 No data available, skipping activity fetch')
      return
    }
    
    setLoading(true)
    try {
      console.log('📡 Fetching activity feed...')
      const response = await dbAPI.getActivityFeed({ limit: 20 })
      console.log('📡 Activity Feed Response:', response)
      
      if (response?.success && response?.data) {
        // Backend returns data.activities, not data directly
        const activitiesData = response.data.activities || response.data || []
        setActivities(activitiesData)
        console.log('📡 Real activities loaded:', activitiesData.length)
        console.log('📡 Sample activity:', activitiesData[0])
      } else {
        console.warn('📡 No activities in response or API failed')
        setActivities([])
      }
    } catch (error) {
      console.error('❌ Error fetching activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasData) return
    
    // Initial fetch
    fetchActivities()
    
    // Set up interval for live updates
    if (!isLive) return
    
    const interval = setInterval(() => {
      fetchActivities()
      setLastUpdate(new Date())
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [isLive, hasData])
  
  // Real-time activities from backend
  
  const formatTimeAgo = (dateInput) => {
    try {
      const now = new Date()
      const date = new Date(dateInput)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'منذ لحظات'
      }
      
      const diffInSeconds = Math.floor((now - date) / 1000)
      
      // Handle negative differences (future dates)
      if (diffInSeconds < 0) {
        return 'منذ لحظات'
      }
      
      if (diffInSeconds < 60) return `منذ ${diffInSeconds} ثانية`
      if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`
      if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`
      return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`
    } catch (error) {
      console.error('Error formatting time:', error, dateInput)
      return 'منذ لحظات'
    }
  }
  
  const getActivityColor = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      green: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
    }
    return colors[color] || colors.blue
  }
  
  // Real-time stats
  const stats = [
    {
      label: 'نشاط اليوم',
      value: activities.length,
      icon: Activity,
      color: 'blue'
    },
    {
      label: 'عملاء جدد',
      value: activities.filter(a => a.type === 'client').length,
      icon: Users,
      color: 'green'
    },
    {
      label: 'عملاء محتملين',
      value: activities.filter(a => a.type === 'lead').length,
      icon: Target,
      color: 'purple'
    },
    {
      label: 'مبيعات',
      value: activities.filter(a => a.type === 'sale').length,
      icon: DollarSign,
      color: 'emerald'
    }
  ]
  
  // Show empty state when no data
  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">المراقبة المباشرة</h3>
          <p className="text-gray-600 mb-4">
            لا توجد بيانات في قاعدة البيانات لعرضها
          </p>
          <div className="text-sm text-gray-500 space-y-2">
            <p>📡 سيتم تفعيل المراقبة المباشرة عند إضافة:</p>
            <div className="flex justify-center gap-4 text-xs">
              <span>• عملاء</span>
              <span>• عملاء محتملين</span>
              <span>• مبيعات</span>
              <span>• مهام</span>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">المراقبة المباشرة</h2>
              <p className="text-purple-100">تتبع النشاط في الوقت الفعلي</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live Status */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              isLive 
                ? 'bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30' 
                : 'bg-gray-500 bg-opacity-20 border border-gray-400 border-opacity-30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium">
                {isLive ? 'مباشر' : 'متوقف'}
              </span>
            </div>
            
            {/* Controls */}
            <Button
              onClick={() => setIsLive(!isLive)}
              variant="outline"
              size="sm"
              className="bg-white bg-opacity-10 border-white border-opacity-20 text-white hover:bg-opacity-20"
            >
              {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isLive ? 'إيقاف' : 'تشغيل'}
            </Button>
            
            <Button
              onClick={() => {
                fetchActivities()
                setLastUpdate(new Date())
              }}
              variant="outline"
              size="sm"
              disabled={loading}
              className="bg-white bg-opacity-10 border-white border-opacity-20 text-white hover:bg-opacity-20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </div>
        
        {/* Last Update */}
        <div className="mt-4 text-sm text-purple-200">
          آخر تحديث: {lastUpdate.toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </div>
      </Card>
      
      {/* Real-time Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colors = getActivityColor(stat.color)
          
          return (
            <Card key={index} className={`p-4 ${colors.light} ${colors.border} border`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 ${colors.bg} rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colors.text}`}>{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      
      {/* Activity Stream */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">تدفق الأنشطة</h3>
              <p className="text-sm text-gray-600">آخر الأحداث والأنشطة</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{activities.length} نشاط</span>
          </div>
        </div>
        
        {/* Activities List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-gray-600">جاري تحميل الأنشطة...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>لا توجد أنشطة حالياً</p>
              <p className="text-sm">سيتم عرض الأنشطة الجديدة هنا</p>
            </div>
          ) : (
            activities.map((activity, index) => {
              // Default icon based on activity type
              const getIconForActivity = (type) => {
                switch(type?.toLowerCase()) {
                  case 'client': return Users
                  case 'lead': return Target
                  case 'sale': return DollarSign
                  case 'project': return Building2
                  case 'task': return Clock
                  case 'create': return Users
                  case 'update': return Phone
                  case 'interaction': return MessageSquare
                  case 'delete': return Bell
                  default: return Activity
                }
              }
              
              const Icon = getIconForActivity(activity.type)
              const colors = getActivityColor(activity.color || 'blue')
              
              return (
                <div 
                  key={activity.id}
                  className={`flex items-start gap-4 p-4 rounded-xl ${colors.light} ${colors.border} border hover:shadow-md transition-all duration-300 animate-fadeIn`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`p-2 ${colors.bg} rounded-lg flex-shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${colors.text} text-sm`}>
                          {activity.title || activity.description || activity.message || 'نشاط جديد'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          بواسطة: {activity.user || 'النظام'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 flex-shrink-0">
                        {formatTimeAgo(activity.createdAt || activity.timestamp || new Date())}
                      </div>
                    </div>
                  </div>
                  
                  {/* New Activity Indicator */}
                  {index < 3 && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0 mt-2"></div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
        {activities.length > 0 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="text-sm">
              <Eye className="h-4 w-4 mr-2" />
              عرض جميع الأنشطة
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
