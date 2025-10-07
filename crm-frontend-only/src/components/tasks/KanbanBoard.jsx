import React, { useState } from 'react'
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Flag,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { usePermissions } from '../../hooks/usePermissions'

export default function KanbanBoard({ tasks, onTaskUpdate, onTaskEdit, onTaskDelete, onAddTask }) {
  const [draggedTask, setDraggedTask] = useState(null)
  const { checkPermission } = usePermissions()

  const getTasksByStatus = (status) => {
    return tasks.filter(task => {
      // Handle different status formats
      if (status === 'pending') {
        return task.status === 'pending' || task.status === 'todo'
      }
      if (status === 'completed') {
        return task.status === 'completed' || task.status === 'done'
      }
      return task.status === status
    })
  }

  const columns = [
    {
      id: 'pending',
      title: 'قيد الانتظار',
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      textColor: 'text-white',
      icon: <Clock className="h-5 w-5 text-white" />,
      count: getTasksByStatus('pending').length
    },
    {
      id: 'in_progress',
      title: 'قيد التنفيذ',
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-gradient-to-r from-orange-500 to-orange-600',
      textColor: 'text-white',
      icon: <AlertTriangle className="h-5 w-5 text-white" />,
      count: getTasksByStatus('in_progress').length
    },
    {
      id: 'completed',
      title: 'مكتمل',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-gradient-to-r from-green-500 to-green-600',
      textColor: 'text-white',
      icon: <CheckCircle className="h-5 w-5 text-white" />,
      count: getTasksByStatus('completed').length
    }
  ]

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-orange-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-orange-600 bg-orange-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'عالية'
      case 'medium': return 'متوسطة'
      case 'low': return 'منخفضة'
      default: return priority
    }
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, newStatus) => {
    e.preventDefault()
    
    if (draggedTask && draggedTask.status !== newStatus) {
      // Call the update function passed from parent
      onTaskUpdate(draggedTask.id, newStatus)
    }
    
    setDraggedTask(null)
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && dueDate
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map(column => (
        <div key={column.id} className="flex flex-col">
          {/* Enhanced Column Header */}
          <Card className={`relative overflow-hidden ${column.headerColor} border-0 shadow-lg mb-4`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    {column.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold ${column.textColor}`}>{column.title}</h3>
                    <p className="text-white text-opacity-80 text-sm">{column.count} مهمة</p>
                  </div>
                </div>
                {checkPermission('add_tasks') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white hover:bg-white hover:bg-opacity-20 border-white border-opacity-30"
                    onClick={onAddTask}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Enhanced Tasks Column */}
          <div
            className={`flex-1 min-h-[500px] p-4 rounded-xl border-2 border-dashed ${column.color} transition-all duration-300 hover:border-solid hover:shadow-lg`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="space-y-4">
              {getTasksByStatus(column.id).map(task => (
                <Card
                  key={task.id}
                  className={`group cursor-move hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 hover:from-purple-50 hover:to-indigo-50 border-l-4 ${getPriorityColor(task.priority)} ${
                    isOverdue(task.dueDate) && task.status !== 'done' ? 'hover:from-red-50 hover:to-pink-50' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                >
                  <div className="p-4">
                    {/* Enhanced Task Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                        }`} />
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors text-sm leading-tight">
                          {task.title}
                        </h4>
                      </div>
                      <div className="relative group/menu">
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                        
                        {/* Enhanced Dropdown Menu */}
                        <div className="absolute left-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => onTaskEdit?.(task)}
                              className="w-full text-right px-3 py-2 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => onTaskDelete?.(task)}
                              className="w-full text-right px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Task Description */}
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Enhanced Progress Bar */}
                    {task.status === 'in_progress' && (
                      <div className="mb-3 bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                          <span className="font-medium">التقدم</span>
                          <span className="font-bold text-purple-600">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Enhanced Task Meta */}
                    <div className="space-y-2 mb-3">
                      {/* Lead Info */}
                      {task.leadName && (
                        <div className="flex items-center gap-2 text-xs bg-purple-50 p-2 rounded-lg">
                          <Target className="h-3 w-3 text-purple-500" />
                          <span className="truncate font-medium text-purple-700">{task.leadName}</span>
                        </div>
                      )}

                      {/* Assigned User */}
                      <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded-lg">
                        <User className="h-3 w-3 text-blue-500" />
                        <span className="truncate font-medium text-blue-700">{task.assignedTo || 'غير محدد'}</span>
                      </div>

                      {/* Due Date */}
                      <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
                        isOverdue(task.dueDate) && task.status !== 'done' 
                          ? 'bg-red-50 text-red-700' 
                          : 'bg-green-50 text-green-700'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ar-EG', {
                            timeZone: 'Africa/Cairo',
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric'
                          }) : 'لا يوجد تاريخ'}
                        </span>
                        {isOverdue(task.dueDate) && task.status !== 'done' && (
                          <span className="font-bold">(متأخر)</span>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Priority and Tags */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <Badge className={`text-xs ${getPriorityBadgeColor(task.priority)} font-medium`}>
                        <Flag className="h-2 w-2 ml-1" />
                        {getPriorityLabel(task.priority)}
                      </Badge>

                      {/* Enhanced Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          {task.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs px-2 py-0 border-purple-200 text-purple-600">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs px-2 py-0 border-gray-200 text-gray-600">
                              +{task.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {/* Enhanced Empty State */}
              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">لا توجد مهام</p>
                  <p className="text-xs text-gray-400 mt-1">اسحب المهام هنا</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}