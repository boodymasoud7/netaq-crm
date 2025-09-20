import React, { useState, useEffect } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Phone, 
  MapPin, 
  CheckCircle, 
  User, 
  Timer,
  AlertCircle,
  Calendar,
  Target,
  Zap
} from 'lucide-react'

export default function CompactTaskWidget({ tasksData = [], onAddTask, onCompleteTask, loading = false }) {
  const [filter, setFilter] = useState('today')
  const [animationKey, setAnimationKey] = useState(0)

  // Use only real tasks data from backend - no fake data
  const tasks = tasksData || []

  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [filter])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate)
    taskDate.setHours(0, 0, 0, 0)
    
    switch (filter) {
      case 'today':
        return taskDate.getTime() === today.getTime() && task.status !== 'completed'
      case 'overdue':
        return taskDate.getTime() < today.getTime() && task.status !== 'completed'
      case 'all':
        return true
      default:
        return true
    }
  })

  const getTaskStats = () => {
    return {
      total: tasks.length,
      overdue: tasks.filter(t => new Date(t.dueDate) < today && t.status !== 'completed').length,
      today: tasks.filter(t => new Date(t.dueDate).toDateString() === today.toDateString() && t.status !== 'completed').length,
      completed: tasks.filter(t => t.status === 'completed').length
    }
  }

  const stats = getTaskStats()

  const getTaskIcon = (type) => {
    switch (type) {
      case 'call': return Phone
      case 'visit': return MapPin
      case 'proposal': return Target
      case 'follow-up': return User
      default: return Clock
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

  const getTaskStatus = (task) => {
    const today = new Date()
    const taskDate = new Date(task.dueDate)
    
    if (task.status === 'completed') return { label: 'مكتملة', color: 'text-green-600' }
    if (taskDate < today) return { label: 'متأخرة', color: 'text-red-600' }
    if (taskDate.toDateString() === today.toDateString()) return { label: 'اليوم', color: 'text-orange-600' }
    return { label: 'مجدولة', color: 'text-blue-600' }
  }

  const formatDateArabic = (date) => {
    return new Date(date).toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 h-full flex flex-col">
        <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl backdrop-blur-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">إدارة المهام</h3>
                <p className="text-purple-100 text-xs">جاري التحميل...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">جاري تحميل المهام...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] overflow-hidden border border-gray-100 h-full flex flex-col">
      {/* Compact Header */}
      <div className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 text-white overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-xl backdrop-blur-lg">
                <CheckSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">إدارة المهام</h3>
                <p className="text-purple-100 text-xs">تنظيم المهام</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onAddTask?.()}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 backdrop-blur-lg rounded-lg px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4 ml-1" />
              جديدة
            </Button>
          </div>
          
          {/* Compact Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
              <div className="text-xl font-medium text-white">{stats.today}</div>
              <div className="text-xs text-purple-100">اليوم</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
              <div className="text-xl font-medium text-white">{stats.overdue}</div>
              <div className="text-xs text-purple-100">متأخرة</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-lg p-2 text-center">
              <div className="text-xl font-medium text-white">{stats.completed}</div>
              <div className="text-xs text-purple-100">مكتملة</div>
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
            { key: 'all', label: 'الكل', count: stats.total, icon: CheckSquare, color: 'from-purple-500 to-indigo-600' }
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

      {/* Compact Tasks List */}
      <div className="p-3 flex-1 overflow-y-auto min-h-0">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-3 bg-purple-100 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="text-base font-medium text-gray-800 mb-2">
              {filter === 'today' && 'لا توجد مهام لليوم'}
              {filter === 'overdue' && 'لا توجد مهام متأخرة'}
              {filter === 'all' && 'لا توجد مهام'}
            </h4>
            <p className="text-gray-500 text-sm">
              {filter === 'all' 
                ? 'ابدأ بإضافة مهامك الأولى!' 
                : 'رائع! إنجازك ممتاز 🎉'
              }
            </p>
            {filter === 'all' && (
              <Button 
                onClick={() => onAddTask?.()}
                className="mt-3 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2"
                size="sm"
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة مهمة جديدة
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.slice(0, 5).map((task, index) => {
              const Icon = getTaskIcon(task.type)
              const status = getTaskStatus(task)
              const delay = index * 0.1
              
              return (
                <div 
                  key={`task-${animationKey}-${task.id}`}
                  className="group relative bg-white rounded-xl border border-gray-200 p-3 hover:shadow-lg hover:border-purple-200 transition-all duration-300 cursor-pointer"
                  style={{ animation: `slideInRight 0.5s ease-out ${delay}s both` }}
                  onClick={() => onCompleteTask?.(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-gradient-to-r ${getPriorityColor(task.priority)} rounded-lg flex-shrink-0 shadow-md`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors leading-tight">
                          {task.title}
                        </h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          status.label === 'متأخرة' ? 'bg-red-100 text-red-700' :
                          status.label === 'اليوم' ? 'bg-orange-100 text-orange-700' :
                          status.label === 'مكتملة' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        } flex-shrink-0 ml-2`}>
                          {status.label}
                        </span>
                      </div>
                      
                      {task.client && (
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{task.client}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatDateArabic(task.dueDate)}
                            </span>
                          </div>
                          {task.estimatedTime && (
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{task.estimatedTime}د</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Priority Indicator */}
                  <div className={`absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b ${getPriorityColor(task.priority)} rounded-r-full`}></div>
                </div>
              )
            })}
            
            {filteredTasks.length > 5 && (
              <div className="text-center pt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs text-purple-600 border-purple-200 hover:bg-purple-50"
                  onClick={() => onAddTask?.()}
                >
                  عرض المزيد ({filteredTasks.length - 5})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}