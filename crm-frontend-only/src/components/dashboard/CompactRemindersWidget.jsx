import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { 
  Bell, 
  Plus, 
  Clock, 
  Phone, 
  MapPin, 
  CheckCircle, 
  User, 
  Calendar,
  AlertCircle,
  Timer,
  Star,
  Zap,
  Target,
  Gift,
  Sparkles,
  Award
} from 'lucide-react'

export default function CompactRemindersWidget({ remindersData = [], onAddReminder, onCompleteReminder, loading = false }) {
  const [filter, setFilter] = useState('today')
  const [animationKey, setAnimationKey] = useState(0)

  // Debug incoming data
  console.log('🔍 CompactRemindersWidget received:', {
    remindersData,
    remindersDataLength: remindersData?.length,
    loading
  })

  // Use real reminders data from backend (no fallback to avoid confusion)
  const reminders = remindersData || []

  console.log('📋 Final reminders for display:', reminders)

  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [filter])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredReminders = reminders.filter(reminder => {
    const reminderDate = new Date(reminder.dueDate)
    reminderDate.setHours(0, 0, 0, 0)
    
    switch (filter) {
      case 'today':
        return reminderDate.getTime() === today.getTime() && !reminder.completed
      case 'overdue':
        return (reminderDate.getTime() < today.getTime() || reminder.overdue) && !reminder.completed
      case 'all':
        return true
      default:
        return true
    }
  })

  const getReminderStats = () => {
    return {
      total: reminders.length,
      overdue: reminders.filter(r => (new Date(r.dueDate) < today || r.overdue) && !r.completed).length,
      today: reminders.filter(r => new Date(r.dueDate).toDateString() === today.toDateString() && !r.completed).length,
      completed: reminders.filter(r => r.completed).length
    }
  }

  const stats = getReminderStats()

  const getReminderIcon = (type) => {
    switch (type) {
      case 'call':
      case 'اتصال': 
        return Phone
      case 'visit':
      case 'زيارة': 
        return MapPin
      case 'task':
      case 'مهمة': 
        return Target
      case 'follow-up':
      case 'متابعة': 
        return User
      case 'meeting':
      case 'اجتماع':
        return Calendar
      default: 
        return Bell
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-pink-600'
      case 'medium': return 'from-orange-500 to-yellow-500'
      case 'low': return 'from-blue-500 to-indigo-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getReminderStatus = (reminder) => {
    const now = new Date()
    const reminderTime = new Date(reminder.dueDate) // استخدام dueDate بدلاً من reminderTime
    
    if (reminder.completed) return { label: 'مكتمل', color: 'text-green-600' }
    if (reminder.overdue || reminderTime < now) return { label: 'متأخر', color: 'text-red-600' }
    if (reminderTime.toDateString() === now.toDateString()) return { label: 'اليوم', color: 'text-orange-600' }
    return { label: 'مجدول', color: 'text-blue-600' }
  }

  const formatTimeArabic = (date) => {
    const reminderDate = new Date(date)
    const now = new Date()
    
    // إذا كان نفس اليوم، اظهر الوقت فقط
    if (reminderDate.toDateString() === now.toDateString()) {
      return reminderDate.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      })
    }
    
    // إذا كان يوم مختلف، اظهر التاريخ والوقت
    return reminderDate.toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </Card>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] overflow-hidden border border-gray-100 h-full flex flex-col">
      {/* Compact Header */}
      <div className="relative bg-gradient-to-br from-rose-600 via-pink-600 to-purple-700 p-4 text-white overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl backdrop-blur-lg">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">التذكيرات</h3>
                <p className="text-pink-100 text-xs">لا تفوت موعد</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onAddReminder?.()}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 backdrop-blur-lg rounded-lg px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4 ml-1" />
              جديد
            </Button>
          </div>
          
          {/* Compact Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
              <div className="text-xl font-medium text-white">{stats.today}</div>
              <div className="text-xs text-pink-100">اليوم</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
              <div className="text-xl font-medium text-white">{stats.overdue}</div>
              <div className="text-xs text-pink-100">متأخرة</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
              <div className="text-xl font-medium text-white">{stats.completed}</div>
              <div className="text-xs text-pink-100">مكتملة</div>
            </div>
          </div>
        </div>
        
        {/* Advanced Decorative Elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-5 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white bg-opacity-10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-12 w-3 h-3 bg-white bg-opacity-40 rounded-full animate-ping"></div>
        <div className="absolute top-16 right-28 w-2 h-2 bg-white bg-opacity-50 rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-8 right-20 w-1 h-1 bg-white bg-opacity-60 rounded-full animate-ping delay-1000"></div>
      </div>

      {/* Compact Filter Tabs */}
      <div className="p-3 bg-gray-50">
        <div className="flex gap-2">
          {[
            { key: 'today', label: 'اليوم', count: stats.today, icon: Clock, color: 'from-orange-500 to-red-500' },
            { key: 'overdue', label: 'متأخرة', count: stats.overdue, icon: AlertCircle, color: 'from-red-500 to-pink-600' },
            { key: 'all', label: 'الكل', count: stats.total, icon: Bell, color: 'from-purple-500 to-indigo-600' }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === tab.key
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    filter === tab.key 
                      ? 'bg-white bg-opacity-25 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Compact Reminders List */}
      <div className="p-3 flex-1 overflow-y-auto min-h-0">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-3 bg-pink-100 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <Bell className="h-6 w-6 text-pink-600" />
            </div>
            <h4 className="text-base font-medium text-gray-800 mb-2">
              {filter === 'today' && 'لا توجد تذكيرات لليوم'}
              {filter === 'overdue' && 'لا توجد تذكيرات متأخرة'}
              {filter === 'all' && 'لا توجد تذكيرات'}
            </h4>
            <p className="text-gray-500 text-sm mb-3">
              {filter === 'today' && 'يومك خال من التذكيرات! 🌟'}
              {filter === 'overdue' && 'ممتاز! لا توجد مهام متأخرة 👏'}
              {filter === 'all' && 'ابدأ بإضافة أول تذكير لك 📝'}
            </p>
            {filter === 'all' && (
              <Button 
                onClick={() => onAddReminder?.()}
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 text-xs"
              >
                <Plus className="h-3 w-3 ml-1" />
                إضافة تذكير
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.slice(0, 5).map((reminder, index) => {
              const Icon = getReminderIcon(reminder.type)
              const status = getReminderStatus(reminder)
              const delay = index * 0.1
              
              return (
                <div 
                  key={`reminder-${animationKey}-${reminder.id}`}
                  className="group relative bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg hover:border-pink-200 transition-all duration-300 cursor-pointer"
                  style={{ animation: `slideInRight 0.5s ease-out ${delay}s both` }}
                  onClick={() => onCompleteReminder?.(reminder.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-gradient-to-r ${getPriorityColor(reminder.priority)} rounded-lg flex-shrink-0 shadow-md`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-pink-700 transition-colors leading-tight">
                          {reminder.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          status.label === 'متأخر' ? 'bg-red-100 text-red-700 animate-pulse' :
                          status.label === 'اليوم' ? 'bg-orange-100 text-orange-700' :
                          status.label === 'مكتمل' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        } flex-shrink-0 ml-2`}>
                          {status.label}
                        </span>
                      </div>
                      
                      <div className="space-y-1 mb-2">
                        {reminder.clientName && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-700">{reminder.clientName}</span>
                            {reminder.phone && (
                              <span className="text-xs text-gray-500">• {reminder.phone}</span>
                            )}
                          </div>
                        )}
                        
                        {reminder.description && (
                          <p className="text-xs text-gray-600 line-clamp-1">
                            {reminder.description}
                          </p>
                        )}
                        
                        {reminder.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-gray-600">{reminder.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatTimeArabic(reminder.dueDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {reminder.type === 'call' ? 'اتصال' :
                               reminder.type === 'visit' ? 'زيارة' :
                               reminder.type === 'meeting' ? 'اجتماع' :
                               reminder.type === 'follow-up' ? 'متابعة' :
                               reminder.type === 'task' ? 'مهمة' :
                               reminder.type || 'تذكير'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Priority Indicator */}
                  <div className={`absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b ${getPriorityColor(reminder.priority)} rounded-r-full`}></div>
                  
                  {/* Sparkle Effect for High Priority */}
                  {reminder.priority === 'high' && (
                    <div className="absolute top-1 right-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <Sparkles className="h-3 w-3 text-yellow-400 animate-pulse" />
                    </div>
                  )}
                </div>
              )
            })}
            
            {filteredReminders.length > 5 && (
              <div className="text-center pt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs text-pink-600 border-pink-200 hover:bg-pink-50"
                  onClick={() => onAddReminder?.()}
                >
                  عرض المزيد ({filteredReminders.length - 5})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}