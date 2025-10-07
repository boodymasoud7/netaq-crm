import React, { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Tag, 
  FileText,
  Building2,
  Target,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { formatDateArabic, formatPhoneNumber, formatCurrency } from '../../lib/utils'
import NotesSystem from '../clients/NotesSystem'

// دالة تنسيق التاريخ والوقت بالميلادي
const formatDateTimeEnglish = (date) => {
  if (!date) return 'غير محدد'
  
  const dateObj = date instanceof Date ? date : 
                  date.toDate ? date.toDate() : 
                  new Date(date)
  
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }
  
  return dateObj.toLocaleString('en-US', options)
}
// Removed firestore services - using local data only

export default function ViewDetailsModal({ item, type, onClose }) {
  console.log('ViewDetailsModal opened with:', { item, type })
  const api = useApi()
  const [notes, setNotes] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [userNames, setUserNames] = useState({})

  useEffect(() => {
    console.log('ViewDetailsModal useEffect triggered with item:', item)
    if (item?.id) {
      console.log('Loading related data for item ID:', item.id)
      loadRelatedData()
    } else {
      console.log('No item ID found, skipping data load')
    }
  }, [item?.id, item?.updatedAt])

  // دالة لجلب اسم المستخدم من Firebase
  const getUserName = async (userId) => {
    if (!userId) return 'مستخدم غير معروف'
    
    // إذا كان الاسم محفوظ مسبقاً
    if (userNames[userId]) {
      return userNames[userId]
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const name = userData.displayName || userData.email || 'مستخدم غير معروف'
        setUserNames(prev => ({ ...prev, [userId]: name }))
        return name
      }
      return 'مستخدم غير معروف'
    } catch (error) {
      console.error('خطأ في جلب اسم المستخدم:', error)
      return 'مستخدم غير معروف'
    }
  }

  // تحديد نوع الكيان حسب الصفحة
  const getItemType = () => {
    if (item.status && (item.status === 'new' || item.status === 'contacted')) return 'lead'
    if (item.salePrice || item.saleDate) return 'sale'
    if (item.startDate || item.expectedCompletion) return 'project'
    return 'client' // default
  }

  const loadRelatedData = async () => {
    setLoading(true)
    try {
      const itemType = getItemType()
      console.log('Loading notes for:', { itemId: item.id, itemType, item })
      
      const [notesResponse, remindersResponse] = await Promise.all([
        api.getNotes(itemType, item.id, {}).catch((error) => {
          console.error('Error loading notes:', error)
          return { data: [] }
        }),
        // Reminders API not implemented yet, return empty for now
        Promise.resolve({ data: [] })
      ])
      
      const notesData = notesResponse.data || []
      const remindersData = remindersResponse.data || []
      
      console.log('Loaded notes data:', notesData)
      console.log('Notes response structure:', notesResponse)
      
      // جلب أسماء المستخدمين للملاحظات والتذكيرات
      const userIds = [
        ...notesData.map(note => note.userId || note.createdBy).filter(Boolean),
        ...remindersData.map(reminder => reminder.userId || reminder.createdBy).filter(Boolean)
      ]
      
      // إزالة التكرار
      const uniqueUserIds = [...new Set(userIds)]
      
      // جلب أسماء المستخدمين
      await Promise.all(
        uniqueUserIds.map(userId => getUserName(userId))
      )
      
      setNotes(notesData)
      setReminders(remindersData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  // Note handlers
  const handleAddNote = async (noteText) => {
    try {
      const itemType = getItemType()
      await api.addNote({
        content: noteText,
        itemType,
        itemId: item.id
      })
      console.log('✅ Note added successfully')
      loadRelatedData() // إعادة تحميل الملاحظات
    } catch (error) {
      console.error('❌ Error adding note:', error)
    }
  }

  const handleUpdateNote = async (noteIdOrNote, updatedDataOrContent) => {
    try {
      // التعامل مع الحالتين: (noteId, content) أو (note, data)
      let noteId, updateData
      
      if (typeof noteIdOrNote === 'object') {
        // الحالة الأولى: (note, data) - تحديث ملاحظة
        noteId = noteIdOrNote.id
        updateData = updatedDataOrContent
      } else {
        // الحالة الثانية: (noteId, content) - تعليق مدير
        noteId = noteIdOrNote
        updateData = updatedDataOrContent
      }
      
      console.log('🔄 Updating note:', { noteId, updateData })
      await api.updateNote(noteId, updateData)
      console.log('✅ Note updated successfully')
      loadRelatedData() // إعادة تحميل الملاحظات
    } catch (error) {
      console.error('❌ Error updating note:', error)
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteNote(noteId)
      console.log('✅ Note deleted successfully')
      loadRelatedData() // إعادة تحميل الملاحظات
    } catch (error) {
      console.error('❌ Error deleting note:', error)
    }
  }

  const renderClientDetails = () => (
    <div className="space-y-6">
      {/* معلومات أساسية */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <User className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">الاسم</p>
            <p className="font-medium">{item.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Phone className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">الهاتف</p>
            <p className="font-medium">{formatPhoneNumber(item.phone)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Mail className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">البريد الإلكتروني</p>
            <p className="font-medium">{item.email || 'غير محدد'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">العنوان</p>
            <p className="font-medium">{item.address || 'غير محدد'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Tag className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">النوع</p>
            <Badge variant="secondary">{item.clientType || 'غير محدد'}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Calendar className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">تاريخ الإضافة</p>
            <p className="font-medium">{formatDateArabic(item.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* معلومات إضافية */}
      {item.notes && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ملاحظات</h4>
          <p className="text-sm text-blue-800">{item.notes}</p>
        </div>
      )}
    </div>
  )

  const renderLeadDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Target className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">الاسم</p>
            <p className="font-medium">{item.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Star className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">التقييم</p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{item.score || 50}</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (item.score || 50) >= 80 ? 'bg-green-500' :
                    (item.score || 50) >= 60 ? 'bg-yellow-500' :
                    (item.score || 50) >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${item.score || 50}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <AlertCircle className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">الأولوية</p>
            <Badge variant="secondary">{item.priority || 'متوسطة'}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Tag className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">المصدر</p>
            <p className="font-medium">{item.source || 'غير محدد'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProjectDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Building2 className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">اسم المشروع</p>
            <p className="font-medium">{item.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <MapPin className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">الموقع</p>
            <p className="font-medium">{item.location || 'غير محدد'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <User className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">المطور</p>
            <p className="font-medium">{item.developer || 'غير محدد'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">الوحدات</p>
            <p className="font-medium">
              {item.totalUnits || item.units || 0} وحدة
              <span className="text-xs text-gray-500 block">
                مباع: {item.soldUnits || 0}
              </span>
            </p>
          </div>
        </div>

        {item.priceFrom && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg col-span-2">
            <div>
              <p className="text-xs text-gray-500">النطاق السعري</p>
              <p className="font-medium">
                {formatCurrency(item.priceFrom)} - {formatCurrency(item.priceTo)}
              </p>
            </div>
          </div>
        )}
      </div>

      {item.description && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">وصف المشروع</h4>
          <p className="text-sm text-blue-800">{item.description}</p>
        </div>
      )}
    </div>
  )

  const renderNotes = () => {
    // إضافة default values للملاحظات لتتوافق مع NotesSystem
    const mappedNotes = notes.map(note => ({
      ...note,
      title: note.title || 'ملاحظة عامة',
      type: note.type || 'general',
      priority: note.priority || 'medium',
      createdBy: note.createdBy || note.userId,
      createdAt: note.createdAt
    }))

    return (
      <NotesSystem
        notes={mappedNotes}
        clientId={item.id}
        onAddNote={handleAddNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
        currentUserRole="admin"
        title="ملاحظات العنصر"
      />
    )
  }



  const renderReminders = () => (
    <div className="space-y-3">
      {reminders.length > 0 ? (
        reminders.map((reminder) => (
          <div key={reminder.id} className="p-4 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h5 className="font-medium text-orange-900">
                {reminder.title || reminder.type || 'تذكير'}
              </h5>
              <span className="text-xs text-orange-600">
                {formatDateArabic(reminder.dueDate)} - {reminder.dueDate?.toLocaleTimeString('ar-EG', {
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </span>
            </div>
            <p className="text-sm text-orange-800 mb-2">
              {reminder.description || reminder.message || 'لا يوجد وصف'}
            </p>
            <div className="flex justify-between items-center">
              <p className="text-xs text-orange-600">
                بواسطة: {reminder.createdByName || userNames[reminder.userId] || userNames[reminder.createdBy] || reminder.createdBy || 'مستخدم غير معروف'}
              </p>
              <span className={`text-xs px-2 py-1 rounded ${
                reminder.status === 'completed' ? 'bg-green-100 text-green-800' :
                reminder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {reminder.status === 'completed' ? 'مكتمل' :
                 reminder.status === 'pending' ? 'معلق' : 'غير محدد'}
              </span>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">لا توجد تذكيرات</p>
      )}
    </div>
  )

  if (!item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {type === 'client' && <User className="h-6 w-6 text-blue-600" />}
            {type === 'lead' && <Target className="h-6 w-6 text-orange-600" />}
            {type === 'project' && <Building2 className="h-6 w-6 text-green-600" />}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-600">
                {type === 'client' && 'تفاصيل العميل'}
                {type === 'lead' && 'تفاصيل العميل المحتمل'}
                {type === 'project' && 'تفاصيل المشروع'}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            التفاصيل
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            الملاحظات ({notes.length})
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reminders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            التذكيرات ({reminders.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري التحميل...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'details' && (
                <>
                  {type === 'client' && renderClientDetails()}
                  {type === 'lead' && renderLeadDetails()}
                  {type === 'project' && renderProjectDetails()}
                </>
              )}
              {activeTab === 'notes' && renderNotes()}
              {activeTab === 'reminders' && renderReminders()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

