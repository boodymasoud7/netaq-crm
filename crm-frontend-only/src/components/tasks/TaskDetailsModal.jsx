import React, { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Target, 
  Tag, 
  FileText, 
  CheckCircle,
  Clock,
  MessageSquare,
  Edit,
  Trash2,
  StickyNote
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import TaskNotesSystem from './TaskNotesSystem'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import toast from 'react-hot-toast'

export default function TaskDetailsModal({ 
  isOpen, 
  onClose, 
  task = null, 
  onEdit,
  onDelete,
  onUpdateTask
}) {
  const { currentUser } = useAuth()
  const api = useApi()
  const [taskNotes, setTaskNotes] = useState([])
  const [activeTab, setActiveTab] = useState('details') // 'details' or 'notes'
  const [loadingNotes, setLoadingNotes] = useState(false)

  // جلب الملاحظات من API
  const fetchTaskNotes = async () => {
    if (!task?.id) return

    try {
      setLoadingNotes(true)
      const response = await api.getNotes('task', task.id)
      if (response.data) {
        setTaskNotes(response.data)
      }
    } catch (error) {
      console.error('Error fetching task notes:', error)
      // لا نظهر toast error هنا لأن عدم وجود ملاحظات أمر طبيعي
    } finally {
      setLoadingNotes(false)
    }
  }

  useEffect(() => {
    if (task?.id) {
      fetchTaskNotes()
    }
  }, [task?.id])

  if (!isOpen || !task) return null

  const priorityColors = {
    low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
    urgent: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  }

  const statusColors = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
  }

  const statusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ', 
    completed: 'مكتملة',
    cancelled: 'ملغية'
  }

  const priorityLabels = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة'
  }

  const categoryLabels = {
    follow_up: 'متابعة',
    meeting: 'اجتماع',
    call: 'مكالمة',
    email: 'ايميل',
    site_visit: 'زيارة موقع',
    documentation: 'وثائق',
    other: 'أخرى'
  }

  const handleAddNote = async (noteData) => {
    try {
      // إعداد بيانات الملاحظة للـ API
      const apiNoteData = {
        content: noteData.content,
        itemType: 'task',
        itemId: task.id,
        title: noteData.title,
        type: noteData.type || 'general',
        priority: noteData.priority || 'medium'
      }

      console.log('📝 Creating note via API:', apiNoteData)
      const response = await api.addNote(apiNoteData)
      
      if (response.data) {
        // إضافة الملاحظة للقائمة المحلية
        setTaskNotes(prev => [response.data, ...prev])
        toast.success('تم إضافة الملاحظة بنجاح')
      } else {
        throw new Error(response.message || 'فشل في إضافة الملاحظة')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('فشل في إضافة الملاحظة: ' + (error.message || 'خطأ غير معروف'))
      throw error // إعادة إرسال الخطأ للمكون المستدعي
    }
  }

  const handleProgressUpdate = (newProgress) => {
    // تحديث تقدم المهمة
    if (onUpdateTask) {
      const updatedTask = {
        ...task,
        progress: newProgress
      }
      onUpdateTask(updatedTask)
    }
  }

  const handleUpdateNote = async (noteId, updateData) => {
    try {
      if (updateData.action === 'addComment') {
        // إضافة تعليق مدير
        const apiUpdateData = {
          managerComment: updateData.comment.content,
          managerCommentBy: updateData.comment.author,
          managerCommentAt: updateData.comment.createdAt
        }

        const response = await api.updateNote(noteId, apiUpdateData)
        
        if (response.data) {
          // تحديث القائمة المحلية
          setTaskNotes(prev => prev.map(note => 
            note.id === noteId ? response.data : note
          ))
          toast.success('تم إضافة تعليق المدير بنجاح')
        } else {
          throw new Error(response.message || 'فشل في إضافة تعليق المدير')
        }
      } else {
        // تحديث عادي للملاحظة
        const response = await api.updateNote(noteId, updateData)
        
        if (response.data) {
          setTaskNotes(prev => prev.map(note => 
            note.id === noteId ? response.data : note
          ))
          toast.success('تم تحديث الملاحظة بنجاح')
        } else {
          throw new Error(response.message || 'فشل في تحديث الملاحظة')
        }
      }
    } catch (error) {
      console.error('Error updating note:', error)
      toast.error('فشل في تحديث الملاحظة: ' + (error.message || 'خطأ غير معروف'))
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      const response = await api.deleteNote(noteId)
      
      if (response.message && response.message.includes('successfully')) {
        setTaskNotes(prev => prev.filter(note => note.id !== noteId))
        toast.success('تم حذف الملاحظة بنجاح')
      } else {
        throw new Error(response.message || 'فشل في حذف الملاحظة')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('فشل في حذف الملاحظة: ' + (error.message || 'خطأ غير معروف'))
    }
  }

  const priority = priorityColors[task.priority] || priorityColors.medium
  const status = statusColors[task.status] || statusColors.pending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{task.title}</h3>
                <p className="text-purple-100 text-sm">
                  تفاصيل المهمة #{task.id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(task)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Edit className="h-4 w-4 ml-1" />
                تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(task)}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <Trash2 className="h-4 w-4 ml-1" />
                حذف
              </Button>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex space-x-8 rtl:space-x-reverse">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline ml-2" />
              تفاصيل المهمة
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <StickyNote className="h-4 w-4 inline ml-2" />
              الملاحظات ({taskNotes.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            /* Task Details */
            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">الحالة:</span>
                  <Badge className={`${status.bg} ${status.text}`}>
                    {statusLabels[task.status]}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <Flag className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">الأولوية:</span>
                  <Badge className={`${priority.bg} ${priority.text}`}>
                    {priorityLabels[task.priority]}
                  </Badge>
                </div>
              </div>

              {/* Assigned User and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">المكلف:</span>
                  <span className="text-gray-900">{task.assignedTo || 'غير محدد'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">تاريخ الاستحقاق:</span>
                  <span className="text-gray-900">
                    {task.dueDate ? formatDateArabic(task.dueDate) : 'غير محدد'}
                  </span>
                </div>
              </div>

              {/* Category and Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700 font-medium">النوع:</span>
                  <span className="text-gray-900">{categoryLabels[task.category] || task.category}</span>
                </div>
                
                {task.leadName && (
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">العميل:</span>
                    <span className="text-gray-900">{task.leadName}</span>
                  </div>
                )}
              </div>

              {/* Progress */}
              {task.status === 'in_progress' && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-700 font-medium">نسبة الإنجاز:</span>
                    <span className="text-gray-900">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Description */}
              {task.description && (
                <div>
                  <h4 className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    الوصف
                  </h4>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg leading-relaxed">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    العلامات
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span>
                    <span className="mr-2">{formatDateArabic(task.createdAt)}</span>
                  </div>
                  {task.updatedAt && (
                    <div>
                      <span className="font-medium">آخر تحديث:</span>
                      <span className="mr-2">{formatDateArabic(task.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Task Notes */
            <div className="p-6">
              {loadingNotes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                    <p className="text-gray-600">جاري تحميل الملاحظات...</p>
                  </div>
                </div>
              ) : (
                <TaskNotesSystem
                  notes={taskNotes}
                  taskId={task.id}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  currentUserRole={currentUser?.role || 'sales'}
                  taskTitle={task.title}
                  assignedUser={task.assignedTo}
                  onProgressUpdate={handleProgressUpdate}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
