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
  Shield
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import toast from 'react-hot-toast'
import { useSSENotificationSender } from '../../hooks/useSSENotificationSender'

const NotesSystem = ({ 
  notes = [], 
  clientId, 
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  currentUserRole = 'sales',
  title = "نظام الملاحظات",
  emptyMessage = "لا توجد ملاحظات لهذا العميل حتى الآن",
  clientName = '', // اسم العميل للإشعارات
  clientType = 'عميل' // نوع العميل للإشعارات
}) => {

  const { sendNoteReplyNotification } = useSSENotificationSender()

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
  const [editingNoteData, setEditingNoteData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium'
  })

  // فلترة الملاحظات أولاً وإضافة الحقول المطلوبة
  const clientNotes = notes
    .filter(note => 
      (note.itemId === clientId || note.itemId === String(clientId))
    )
    .map(note => ({
      ...note,
      // إضافة الحقول المطلوبة إذا لم تكن موجودة
      title: note.title || 'ملاحظة',
      type: note.type || 'general',
      priority: note.priority || 'medium',
      createdBy: note.createdByName || note.createdBy || 'غير محدد',
      createdAt: note.createdAt || new Date().toISOString()
    }))
  
  const sortedNotes = clientNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // التحقق من صلاحيات المدير
  const isManager = currentUserRole === 'admin' || currentUserRole === 'sales_manager'
  


  const noteTypes = [
    { value: 'general', label: 'عام', color: 'bg-gray-100 text-gray-800' },
    { value: 'preference', label: 'تفضيلات', color: 'bg-blue-100 text-blue-800' },
    { value: 'financial', label: 'مالي', color: 'bg-green-100 text-green-800' },
    { value: 'requirement', label: 'متطلبات', color: 'bg-orange-100 text-orange-800' },
    { value: 'personal', label: 'شخصي', color: 'bg-purple-100 text-purple-800' },
    { value: 'business', label: 'عمل', color: 'bg-red-100 text-red-800' }
  ]

  const priorityLevels = [
    { value: 'low', label: 'منخفض', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
    { value: 'medium', label: 'متوسط', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="h-3 w-3" /> },
    { value: 'high', label: 'عالي', color: 'bg-red-100 text-red-800', icon: <Star className="h-3 w-3" /> }
  ]

  const getTypeInfo = (type) => noteTypes.find(t => t.value === type) || noteTypes[0]
  const getPriorityInfo = (priority) => priorityLevels.find(p => p.value === priority) || priorityLevels[1]

  const handleAddNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error('يرجى ملء العنوان والمحتوى')
      return
    }

    const noteData = {
      ...newNote,
      // Don't send clientId to API, let the parent handle itemType and itemId
      createdBy: 'current-user',
      createdByName: 'المستخدم الحالي',
      createdAt: new Date().toISOString()
    }

    if (onAddNote) {
      onAddNote(noteData)
    }

    setNewNote({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium'
    })
    setShowAddNote(false)
    toast.success('تم إضافة الملاحظة بنجاح')
  }

  const handleUpdateNote = () => {
    if (!editingNoteData.title.trim() || !editingNoteData.content.trim()) {
      toast.error('يرجى ملء العنوان والمحتوى')
      return
    }

    if (onUpdateNote && editingNote) {
      onUpdateNote(editingNote, editingNoteData)
    }
    setEditingNote(null)
    setEditingNoteData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium'
    })
    toast.success('تم تحديث الملاحظة بنجاح')
  }

  const handleDeleteNote = (noteId) => {
    if (onDeleteNote) {
      onDeleteNote(noteId)
    }
    toast.success('تم حذف الملاحظة بنجاح')
  }

  const handleAddManagerComment = async (noteId) => {
    if (!newManagerComment.trim()) {
      toast.error('يرجى كتابة التعليق')
      return
    }

    // التحقق من وجود تعليق سابق
    const existingNote = clientNotes.find(note => note.id === noteId)
    const isUpdating = existingNote && existingNote.managerComment

    const commentData = {
      managerComment: newManagerComment,
      managerCommentBy: 'محمد المدير', // سيتم استبداله بالمستخدم الحالي
      managerCommentAt: new Date().toISOString()
    }

    if (onUpdateNote) {
      onUpdateNote(noteId, commentData)
    }

    // إرسال إشعار للموظف الذي كتب الملاحظة (إذا لم يكن المدير)
    console.log('🔍 Manager reply debug:', {
      existingNote: !!existingNote,
      createdBy: existingNote?.createdBy,
      createdByName: existingNote?.createdByName,
      isUpdating,
      clientName,
      newManagerComment
    });

    if (existingNote && existingNote.createdBy && !isUpdating) {
      try {
        // استخدام createdBy (ID) لإيجاد البريد الإلكتروني من المستخدمين
        // أو استخدام createdByName للبحث عن المستخدم
        let employeeEmail = null;
        
        // إذا كان createdBy يحتوي على @ فهو بريد إلكتروني
        if (existingNote.createdBy && existingNote.createdBy.includes('@')) {
          employeeEmail = existingNote.createdBy;
          console.log('📧 Using createdBy as email:', employeeEmail);
        } else if (existingNote.createdByName) {
          // البحث عن البريد الإلكتروني بالاسم - سيتم التعامل معه في الباك إند
          employeeEmail = existingNote.createdByName; // سيتم البحث في الباك إند
          console.log('👤 Using createdByName for lookup:', employeeEmail);
        }
        
        if (employeeEmail) {
          console.log('📤 Sending note reply notification to:', employeeEmail);
          await sendNoteReplyNotification(
            employeeEmail,
            clientName,
            clientType,
            newManagerComment
          )
          console.log('✅ Note reply notification sent successfully');
        } else {
          console.warn('⚠️ Could not determine employee email for note reply notification');
        }
      } catch (error) {
        console.error('❌ Error sending note reply notification:', error)
      }
    } else {
      console.log('ℹ️ Not sending notification:', {
        hasExistingNote: !!existingNote,
        hasCreatedBy: !!existingNote?.createdBy,
        isUpdating
      });
    }

    setNewManagerComment('')
    setAddingCommentTo(null)
    toast.success(isUpdating ? 'تم تحديث تعليق المدير بنجاح' : 'تم إضافة تعليق المدير بنجاح')
  }


  
  return (
    <div className="space-y-4">
      {/* الرأس */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <StickyNote className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">الملاحظات</h3>
            <p className="text-sm text-gray-600">ملاحظات مهمة حول العميل</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddNote(true)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة ملاحظة
        </Button>
      </div>

      {/* نموذج إضافة ملاحظة جديدة */}
      {showAddNote && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">إضافة ملاحظة جديدة</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddNote(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* العنوان */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الملاحظة</label>
              <Input
                placeholder="أدخل عنوان الملاحظة"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>

            {/* النوع والأولوية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملاحظة</label>
                <select
                  value={newNote.type}
                  onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {noteTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                <select
                  value={newNote.priority}
                  onChange={(e) => setNewNote({ ...newNote, priority: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {priorityLevels.map(priority => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* المحتوى */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">محتوى الملاحظة</label>
              <textarea
                placeholder="اكتب تفاصيل الملاحظة هنا..."
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* أزرار الحفظ */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddNote}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              >
                <Save className="h-4 w-4 ml-2" />
                حفظ الملاحظة
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddNote(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الملاحظات */}
      <div className="space-y-3">
        
          {sortedNotes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد ملاحظات حتى الآن</h3>
            <p className="text-gray-500 mb-4">{emptyMessage}</p>
            <Button
              onClick={() => setShowAddNote(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة أول ملاحظة
            </Button>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const typeInfo = getTypeInfo(note.type)
            const priorityInfo = getPriorityInfo(note.priority)

            return (
              <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* رأس الملاحظة */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-gray-900">{note.title}</h4>
                      <Badge className={typeInfo.color}>
                        <Tag className="h-3 w-3 ml-1" />
                        {typeInfo.label}
                      </Badge>
                      <Badge className={priorityInfo.color}>
                        {priorityInfo.icon}
                        <span className="mr-1">{priorityInfo.label}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* زر إضافة/تعديل تعليق مدير - محسن */}
                    {isManager && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setAddingCommentTo(note.id)
                          setNewManagerComment(note.managerComment || '')
                        }}
                        className={`${
                          note.managerComment 
                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                        } transition-all duration-200`}
                        title={note.managerComment ? "تعديل تعليق المدير" : "إضافة تعليق مدير"}
                      >
                        {note.managerComment ? (
                          <>
                            <Edit className="h-4 w-4 ml-1" />
                            تعديل
                          </>
                        ) : (
                          <>
                            <Reply className="h-4 w-4 ml-1" />
                            رد مدير
                          </>
                        )}
                      </Button>
                    )}
                    

                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNote(note.id)
                        setEditingNoteData({
                          title: note.title,
                          content: note.content,
                          type: note.type,
                          priority: note.priority
                        })
                      }}
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      title="تعديل الملاحظة"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="حذف الملاحظة"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* معلومات الإنشاء */}
                <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>{note.createdByName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateArabic(note.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* نموذج إضافة/تعديل تعليق مدير - محسن */}
                {addingCommentTo === note.id && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-blue-900">
                          {note.managerComment ? "تعديل تعليق المدير" : "إضافة تعليق مدير"}
                        </h4>
                        <p className="text-xs text-blue-600">أضف توجيهاتك أو ملاحظاتك للموظف</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-blue-200 mb-4">
                      <textarea
                        value={newManagerComment}
                        onChange={(e) => setNewManagerComment(e.target.value)}
                        placeholder="اكتب تعليقك أو توجيهاتك للموظف..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleAddManagerComment(note.id)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        {note.managerComment ? "حفظ التعديل" : "إضافة التعليق"}
                      </Button>
                      <Button
                        onClick={() => {
                          setAddingCommentTo(null)
                          setNewManagerComment('')
                        }}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}

                {/* تعليق المدير الموجود */}
                {note.managerComment && addingCommentTo !== note.id && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-blue-900">تعليق المدير</span>
                        <div className="flex items-center gap-4 text-xs text-blue-600">
                          <span>{note.managerCommentBy}</span>
                          <span>{formatDateArabic(note.managerCommentAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-800 leading-relaxed">{note.managerComment}</p>
                    </div>
                  </div>
                )}

                {/* نموذج تعديل الملاحظة */}
                {editingNote === note.id && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <Edit className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">تعديل الملاحظة</h4>
                        <p className="text-xs text-gray-600">قم بتعديل بيانات الملاحظة</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                      {/* العنوان */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الملاحظة</label>
                        <input
                          type="text"
                          value={editingNoteData.title}
                          onChange={(e) => setEditingNoteData({ ...editingNoteData, title: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="أدخل عنوان الملاحظة"
                        />
                      </div>

                      {/* النوع والأولوية */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملاحظة</label>
                          <select
                            value={editingNoteData.type}
                            onChange={(e) => setEditingNoteData({ ...editingNoteData, type: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {noteTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">الأولوية</label>
                          <select
                            value={editingNoteData.priority}
                            onChange={(e) => setEditingNoteData({ ...editingNoteData, priority: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {priorityLevels.map(priority => (
                              <option key={priority.value} value={priority.value}>{priority.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* المحتوى */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">محتوى الملاحظة</label>
                        <textarea
                          value={editingNoteData.content}
                          onChange={(e) => setEditingNoteData({ ...editingNoteData, content: e.target.value })}
                          placeholder="اكتب تفاصيل الملاحظة هنا..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={handleUpdateNote}
                        className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-md"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        حفظ التعديلات
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingNote(null)
                          setEditingNoteData({
                            title: '',
                            content: '',
                            type: 'general',
                            priority: 'medium'
                          })
                        }}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* إحصائيات الملاحظات */}
      {sortedNotes.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">إحصائيات الملاحظات</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{sortedNotes.length}</div>
              <div className="text-xs text-gray-600">إجمالي الملاحظات</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {sortedNotes.filter(n => n.priority === 'high').length}
              </div>
              <div className="text-xs text-gray-600">أولوية عالية</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {sortedNotes.filter(n => n.managerComment).length}
              </div>
              <div className="text-xs text-gray-600">بتعليق مدير</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotesSystem
