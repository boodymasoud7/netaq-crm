import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Filter, 
  User,
  MapPin,
  Phone,
  Star,
  Timer,
  Target,
  Zap
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { formatDateArabic } from '../../lib/utils'

export default function TaskManagementWidget({ tasksData = [], onAddTask, onCompleteTask, loading = false }) {
  const [filter, setFilter] = useState('all') // all, today, overdue, completed
  const [animationKey, setAnimationKey] = useState(0)

  // Use real tasks data or empty array
  const tasks = tasksData || []

  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [filter])

  const filteredTasks = tasks.filter(task => {
    const today = new Date()
    const taskDate = new Date(task.dueDate)
    
    switch (filter) {
      case 'today':
        return taskDate.toDateString() === today.toDateString() && task.status !== 'completed'
      case 'overdue':
        return taskDate < today && task.status !== 'completed'
      case 'completed':
        return task.status === 'completed'
      default:
        return true
    }
  })

  const getTaskStats = () => {
    const today = new Date()
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => new Date(t.dueDate) < today && t.status !== 'completed').length,
      today: tasks.filter(t => new Date(t.dueDate).toDateString() === today.toDateString() && t.status !== 'completed').length
    }
  }

  const stats = getTaskStats()

  const getTaskIcon = (type) => {
    switch (type) {
      case 'call': return Phone
      case 'visit': return MapPin
      case 'proposal': return Target
      case 'follow-up': return CheckCircle
      case 'meeting': return User
      default: return Clock
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-red-600'
      case 'medium': return 'from-orange-500 to-orange-600'
      case 'low': return 'from-blue-500 to-blue-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200'
      case 'medium': return 'bg-orange-50 border-orange-200'
      case 'low': return 'bg-blue-50 border-blue-200'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  const getTaskStatus = (task) => {
    const today = new Date()
    const taskDate = new Date(task.dueDate)
    
    if (task.status === 'completed') return { label: 'مكتملة', color: 'text-green-600', bg: 'bg-green-100' }
    if (task.status === 'in-progress') return { label: 'قيد التنفيذ', color: 'text-blue-600', bg: 'bg-blue-100' }
    if (taskDate < today) return { label: 'متأخرة', color: 'text-red-600', bg: 'bg-red-100' }
    if (taskDate.toDateString() === today.toDateString()) return { label: 'اليوم', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { label: 'مجدولة', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">إدارة المهام</h3>
              <p className="text-sm text-gray-600">تنظيم وتتبع المهام اليومية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={onAddTask}
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              مهمة جديدة
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
            <div className="text-sm text-gray-600">إجمالي المهام</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.today}</div>
            <div className="text-sm text-gray-600">مهام اليوم</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">متأخرة</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">مكتملة</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'all', label: 'الكل', count: stats.total },
            { key: 'today', label: 'اليوم', count: stats.today },
            { key: 'overdue', label: 'متأخرة', count: stats.overdue },
            { key: 'completed', label: 'مكتملة', count: stats.completed }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.key 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مهام</h4>
            <p className="text-gray-600">
              {filter === 'completed' ? 'لم تكمل أي مهام بعد' : 
               filter === 'today' ? 'لا توجد مهام لليوم' :
               filter === 'overdue' ? 'لا توجد مهام متأخرة' :
               'لا توجد مهام حالياً'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task, index) => {
              const Icon = getTaskIcon(task.type)
              const status = getTaskStatus(task)
              const delay = index * 0.1
              
              return (
                <div 
                  key={`task-${animationKey}-${task.id}`}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${getPriorityBg(task.priority)} ${
                    task.status === 'completed' ? 'opacity-75' : ''
                  }`}
                  style={{ animation: `slideInUp 0.6s ease-out ${delay}s both` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Task Icon & Priority */}
                    <div className="flex-shrink-0">
                      <div className={`p-3 bg-gradient-to-r ${getPriorityColor(task.priority)} rounded-lg shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      {/* Priority Indicator */}
                      <div className="flex justify-center mt-2">
                        {[...Array(3)].map((_, i) => (
                          <div 
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
                              i < (task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1)
                                ? `bg-gradient-to-r ${getPriorityColor(task.priority)}`
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-semibold text-gray-900 mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}>
                            {task.title}
                          </h4>
                          
                          {/* Task Details */}
                          <div className="space-y-2">
                            {task.client && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="h-4 w-4" />
                                <span>{task.client}</span>
                                {task.phone && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <Phone className="h-3 w-3" />
                                    <span className="text-blue-600">{task.phone}</span>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {task.location && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{task.location}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDateArabic(task.dueDate)}</span>
                              </div>
                              
                              {task.estimatedTime && (
                                <div className="flex items-center gap-1">
                                  <Timer className="h-4 w-4" />
                                  <span>{task.estimatedTime} دقيقة</span>
                                </div>
                              )}
                            </div>

                            {task.notes && (
                              <div className="text-sm text-gray-500 italic bg-gray-100 p-2 rounded-lg">
                                {task.notes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                            {status.label}
                          </span>
                          
                          {task.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => onCompleteTask?.(task.id)}
                              className="text-green-600 border-green-200 hover:bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              إكمال
                            </Button>
                          )}

                          {task.status === 'completed' && task.completedAt && (
                            <div className="text-xs text-green-600">
                              تم في {formatDateArabic(task.completedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar for In-Progress Tasks */}
                  {task.status === 'in-progress' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>التقدم</span>
                        <span>65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Card>
  )
}
