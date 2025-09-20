import { useState } from 'react'
import { 
  StickyNote, 
  Plus, 
  MessageSquare, 
  User, 
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
  Star,
  Trash2,
  Edit,
  Save,
  X,
  Reply,
  Shield,
  Briefcase
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useSSENotificationSender } from '../../hooks/useSSENotificationSender'

const TaskNotesSystem = ({ 
  notes = [], 
  taskId, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  currentUserRole = 'sales',
  title = "ملاحظات المهمة",
  emptyMessage = "لا توجد ملاحظات لهذه المهمة حتى الآن",
  taskTitle = '', // عنوان المهمة للإشعارات
  assignedUser = '', // المستخدم المكلف بالمهمة
  onProgressUpdate = null // دالة لتحديث تقدم المهمة
}) => {

  const { sendNoteReplyNotification, sendTaskNoteAddedNotification, sendTaskNoteReplyNotification } = useSSENotificationSender()

  const [showAddNote, setShowAddNote] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [addingCommentTo, setAddingCommentTo] = useState(null)
  const [newManagerComment, setNewManagerComment] = useState('')
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium'
  })

  // أنواع الملاحظات المخصصة للمهام
  const noteTypes = {
    general: { label: 'عام', color: 'bg-gray-100 text-gray-800', icon: MessageSquare },
    progress: { label: 'تحديث التقدم', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    issue: { label: 'مشكلة', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    important: { label: 'مهم', color: 'bg-yellow-100 text-yellow-800', icon: Star },
    meeting: { label: 'اجتماع', color: 'bg-purple-100 text-purple-800', icon: User },
    task: { label: 'مهمة فرعية', color: 'bg-green-100 text-green-800', icon: Briefcase }
  }

  const priorityColors = {
    low: 'border-l-green-500',
    medium: 'border-l-yellow-500', 
    high: 'border-l-red-500'
  }

  const priorityLabels = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية'
  }

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error('يرجى ملء عنوان الملاحظة والمحتوى')
      return
    }

    try {
      const noteData = {
        ...newNote,
        taskId,
        createdAt: new Date().toISOString(),
        author: 'المستخدم الحالي', // يجب استبداله بالمستخدم الحقيقي
        managerComments: []
      }

      await onAddNote(noteData)
      
      // إرسال إشعار للمدير عن الملاحظة الجديدة
      try {
        await sendTaskNoteAddedNotification({
          taskTitle: taskTitle,
          taskId: taskId,
          title: noteData.title,
          type: noteData.type,
          priority: noteData.priority
        })
      } catch (notificationError) {
        console.warn('فشل في إرسال إشعار الملاحظة:', notificationError)
      }
      
      // تحديث التقدم بناءً على الملاحظات الجديدة
      const updatedNotes = [...notes, noteData]
      updateTaskProgress(updatedNotes)
      
      // إعادة تعيين النموذج
      setNewNote({
        title: '',
        content: '',
        type: 'general',
        priority: 'medium'
      })
      setShowAddNote(false)
      toast.success('تم إضافة الملاحظة بنجاح وإرسال إشعار للمدير')
    } catch (error) {
      console.error('خطأ في إضافة الملاحظة:', error)
      toast.error('فشل في إضافة الملاحظة')
    }
  }

  const handleAddManagerComment = async (noteId, originalNoteAuthor) => {
    if (!newManagerComment.trim()) {
      toast.error('يرجى كتابة تعليق')
      return
    }

    try {
      const comment = {
        content: newManagerComment,
        author: 'المدير', // يجب استبداله بالمستخدم الحقيقي
        createdAt: new Date().toISOString()
      }

      await onUpdateNote(noteId, { 
        action: 'addComment', 
        comment 
      })

      // إرسال إشعار للموظف الذي كتب الملاحظة الأصلية
      if (originalNoteAuthor && originalNoteAuthor !== 'المدير') {
        try {
          await sendTaskNoteReplyNotification({
            originalAuthor: originalNoteAuthor,
            taskTitle: taskTitle,
            taskId: taskId,
            replyContent: newManagerComment
          })
        } catch (notificationError) {
          console.warn('فشل في إرسال إشعار الرد:', notificationError)
        }
      }

      // تحديث التقدم بناءً على التعليق الجديد
      const updatedNotes = notes.map(note => 
        note.id === noteId 
          ? { ...note, managerComment: newManagerComment, managerCommentBy: 'المدير', managerCommentAt: new Date().toISOString() }
          : note
      )
      updateTaskProgress(updatedNotes)

      setNewManagerComment('')
      setAddingCommentTo(null)
      toast.success('تم إضافة التعليق بنجاح وتحديث التقدم')
    } catch (error) {
      console.error('خطأ في إضافة التعليق:', error)
      toast.error('فشل في إضافة التعليق')
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
      try {
        await onDeleteNote(noteId)
        toast.success('تم حذف الملاحظة بنجاح')
      } catch (error) {
        console.error('خطأ في حذف الملاحظة:', error)
        toast.error('فشل في حذف الملاحظة')
      }
    }
  }

  const isManager = currentUserRole === 'admin' || currentUserRole === 'sales_manager'

  // حساب تقدم المهمة بناءً على الملاحظات
  const calculateProgress = (notesArray) => {
    if (!notesArray || notesArray.length === 0) return 0
    
    // تعيين نقاط لكل نوع ملاحظة
    const noteScores = {
      general: 5,
      progress: 20,
      issue: -5, // المشاكل تقلل التقدم
      important: 15,
      meeting: 10,
      task: 25 // المهام الفرعية لها قيمة عالية
    }
    
    let totalScore = 0
    let maxScore = notesArray.length * 20 // متوسط النقاط للملاحظة الواحدة
    
    notesArray.forEach(note => {
      const score = noteScores[note.type] || 10
      totalScore += score
      
      // إضافة نقاط للتعليقات الإدارية (تشير للتفاعل والمتابعة)
      if (note.managerComment) {
        totalScore += 5
      }
    })
    
    // حساب النسبة المئوية مع حد أقصى 100%
    const percentage = Math.min(Math.round((totalScore / Math.max(maxScore, 1)) * 100), 100)
    return Math.max(percentage, 0) // منع القيم السالبة
  }

  // تحديث التقدم عند تغيير الملاحظات
  const updateTaskProgress = (updatedNotes) => {
    if (onProgressUpdate) {
      const newProgress = calculateProgress(updatedNotes)
      onProgressUpdate(newProgress)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <Badge variant="secondary" className="text-xs">
              {notes.length} ملاحظة
            </Badge>
          </div>
          
          <Button
            onClick={() => setShowAddNote(!showAddNote)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 ml-1" />
            إضافة ملاحظة
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">تقدم المهمة</span>
            <span className="text-sm font-bold text-purple-600">{calculateProgress(notes)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${calculateProgress(notes)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>💡 التقدم يزيد تلقائياً مع إضافة الملاحظات والتعليقات</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                📝 {notes.filter(n => n.type === 'progress').length} تحديث تقدم
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                🎯 {notes.filter(n => n.type === 'task').length} مهمة فرعية
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                💬 {notes.reduce((acc, note) => acc + (note.managerComments?.length || 0), 0)} تعليق إداري
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="عنوان الملاحظة"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="text-sm"
              />
              
              <div className="flex gap-2">
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote(prev => ({ ...prev, type: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(noteTypes).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
                
                <select
                  value={newNote.priority}
                  onChange={(e) => setNewNote(prev => ({ ...prev, priority: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">أولوية منخفضة</option>
                  <option value="medium">أولوية متوسطة</option>
                  <option value="high">أولوية عالية</option>
                </select>
              </div>
            </div>
            
            <textarea
              placeholder="محتوى الملاحظة..."
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNote(false)}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Save className="h-4 w-4 ml-1" />
                حفظ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="p-4">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <StickyNote className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              const noteType = noteTypes[note.type] || noteTypes.general
              const IconComponent = noteType.icon
              
              return (
                <div
                  key={note.id}
                  className={`border-l-4 ${priorityColors[note.priority]} bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow`}
                >
                  {/* Note Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-gray-600" />
                        <h4 className="font-medium text-gray-900">{note.title}</h4>
                        <Badge className={noteType.color} variant="secondary">
                          {noteType.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {priorityLabels[note.priority]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isManager && !note.managerComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingCommentTo(addingCommentTo === note.id ? null : note.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Reply className="h-3 w-3 ml-1" />
                            رد
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Note Content */}
                    <p className="text-gray-700 mb-3 leading-relaxed">{note.content}</p>
                    
                    {/* Note Meta */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{note.createdByName || note.author || 'مستخدم غير معروف'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateArabic(note.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Manager Comments */}
                  {note.managerComment && (
                    <div className="bg-blue-50 border-t border-blue-100">
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">تعليق الإدارة</span>
                        </div>
                        
                        <div className="bg-white rounded p-3">
                          <p className="text-sm text-gray-700 mb-2">{note.managerComment}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{note.managerCommentBy || 'المدير'}</span>
                            {note.managerCommentAt && (
                              <span>{formatDateArabic(note.managerCommentAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Manager Comment */}
                  {isManager && addingCommentTo === note.id && !note.managerComment && (
                    <div className="bg-blue-50 border-t border-blue-100 p-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="اكتب تعليقك هنا..."
                          value={newManagerComment}
                          onChange={(e) => setNewManagerComment(e.target.value)}
                          className="flex-1 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddManagerComment(note.id, note.createdByName || note.author)
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddManagerComment(note.id, note.createdByName || note.author)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Reply className="h-3 w-3 ml-1" />
                          إرسال
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddingCommentTo(null)
                            setNewManagerComment('')
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskNotesSystem
