import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Star,
  MessageSquare,
  Clock,
  BarChart,
  Users,
  Home,
  Target
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import ActivityTimeline from '../clients/ActivityTimeline'
import NotesSystem from '../clients/NotesSystem'
import ClientRating from '../clients/ClientRating'
import EmployeeAssignment from '../clients/EmployeeAssignment'
import { formatDateArabic, formatPhoneNumber } from '../../lib/utils'
// import { useClientInteractions } from '../../hooks/useMockData'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const ClientDetailsModal = ({ client, onClose, onUpdateClient }) => {
  console.log('🚀 ClientDetailsModal RENDERED with client:', client?.id, client?.name)
  const [activeTab, setActiveTab] = useState('info')
  const [clientData, setClientData] = useState(client) // Local client state
  const [notes, setNotes] = useState([])
  const [interactions, setInteractions] = useState([])
  const api = useApi()
  const { userProfile } = useAuth()

  // تحديد دور المستخدم الحالي (مؤقتاً نخليه مدير للاختبار)
  const currentUserRole = userProfile?.role || 'admin' // مؤقتاً مدير للاختبار

  // تحديث البيانات المحلية عند تغيير الـ client prop
  useEffect(() => {
    setClientData(client)
  }, [client])

  // جلب الملاحظات والتفاعلات عند فتح المودال
  useEffect(() => {
    if (client?.id) {
      console.log('📝 Loading notes for client:', client.id)
      loadNotes()
      loadInteractions()
    }
  }, [client?.id])

  const loadNotes = async () => {
    try {
      console.log('🔄 Making API call to get notes...')
      const response = await api.getNotes('client', client.id, {})
      console.log('✅ Notes API response:', response)
      setNotes(response?.data || [])
      console.log('📋 Notes loaded, count:', response?.data?.length || 0)
    } catch (error) {
      console.error('❌ Error loading notes:', error)
      setNotes([])
    }
  }

  const loadInteractions = async () => {
    try {
      console.log('📋 Loading interactions for client:', client.id)
      const response = await api.getInteractions({ itemType: 'client', itemId: client.id })
      console.log('✅ Interactions loaded:', response)
      setInteractions(response.data || [])
    } catch (error) {
      console.error('❌ Error loading interactions:', error)
      setInteractions([])
    }
  }

  const handleAddNote = async (noteData) => {
    try {
      const apiNoteData = {
        content: noteData.content,
        itemType: 'client',
        itemId: client.id
      }
      await api.addNote(apiNoteData)
      console.log('✅ Note added successfully')
      toast.success('تم إضافة الملاحظة بنجاح')
      loadNotes() // إعادة تحميل الملاحظات
    } catch (error) {
      console.error('❌ Error adding note:', error)
      toast.error('حدث خطأ أثناء إضافة الملاحظة')
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
      toast.success('تم تحديث الملاحظة بنجاح')
      loadNotes() // إعادة تحميل الملاحظات
    } catch (error) {
      console.error('❌ Error updating note:', error)
      toast.error('حدث خطأ أثناء تحديث الملاحظة')
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteNote(noteId)
      console.log('✅ Note deleted successfully')
      toast.success('تم حذف الملاحظة بنجاح')
      loadNotes() // إعادة تحميل الملاحظات
    } catch (error) {
      console.error('❌ Error deleting note:', error)
      toast.error('حدث خطأ أثناء حذف الملاحظة')
    }
  }

  const handleAddInteraction = async (interactionData) => {
    try {
      const apiInteractionData = {
        ...interactionData,
        itemType: 'client',
        itemId: client.id
      }
      console.log('📋 Adding interaction:', apiInteractionData)
      await api.addInteraction(apiInteractionData)
      console.log('✅ Interaction added successfully')
      toast.success('تم إضافة التفاعل بنجاح')
      loadInteractions() // إعادة تحميل التفاعلات
    } catch (error) {
      console.error('❌ Error adding interaction:', error)
      toast.error('حدث خطأ أثناء إضافة التفاعل')
    }
  }

  const tabs = [
    { id: 'info', label: 'المعلومات', icon: <User className="h-4 w-4" /> },
    { id: 'interactions', label: 'التفاعلات', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'notes', label: 'الملاحظات', icon: <Star className="h-4 w-4" /> },
    { id: 'rating', label: 'التقييم', icon: <BarChart className="h-4 w-4" /> },
    { id: 'assignment', label: 'الموظف المسؤول', icon: <Users className="h-4 w-4" /> }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'potential': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط'
      case 'potential': return 'محتمل'
      case 'inactive': return 'غير نشط'
      default: return 'غير محدد'
    }
  }

  const getClientTypeText = (type) => {
    switch (type) {
      case 'فردي': return 'عميل فردي'
      case 'شركة': return 'شركة'
      default: return 'غير محدد'
    }
  }

  const getSourceText = (source) => {
    const sources = {
      'website': 'الموقع الإلكتروني',
      'social_media': 'وسائل التواصل',
      'facebook': 'فيسبوك',
      'referral': 'إحالة',
      'advertising': 'إعلان',
      'phone': 'مكالمة هاتفية',
      'visit': 'زيارة المكتب'
    }
    return sources[source] || source || 'غير محدد'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-bold">
                {clientData?.name?.charAt(0) || 'ع'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{clientData?.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={`${getStatusColor(clientData?.status)} border-0`}>
                    {getStatusText(clientData?.status)}
                  </Badge>
                  <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
                    <Tag className="h-3 w-3 ml-1" />
                    {getClientTypeText(clientData?.clientType)}
                  </Badge>
                  <span className="text-blue-100 text-sm">
                    📅 انضم في {formatDateArabic(clientData?.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-50 border-b px-6 py-3 flex-shrink-0">
          <div className="flex space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* تبويبة المعلومات */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* معلومات الاتصال */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-blue-600" />
                  معلومات الاتصال
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">البريد الإلكتروني</div>
                      <div className="font-medium text-gray-900">{client.email || 'غير متوفر'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">رقم الهاتف</div>
                      <div className="font-medium text-gray-900">{formatPhoneNumber(client.phone)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">العنوان</div>
                      <div className="font-medium text-gray-900">{client.address || 'غير متوفر'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">آخر تواصل</div>
                      <div className="font-medium text-gray-900">{formatDateArabic(client.lastContact)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* معلومات العمل */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  معلومات العمل والميزانية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {client.budget ? `${(client.budget / 1000000).toFixed(1)}M` : 'غير محدد'}
                    </div>
                    <div className="text-sm text-gray-600">الميزانية (جنيه)</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{getSourceText(client.source)}</div>
                    <div className="text-sm text-gray-600">مصدر العميل</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{client.assignedToName || 'غير مخصص'}</div>
                    <div className="text-sm text-gray-600">الموظف المسؤول</div>
                  </div>
                </div>
              </div>

              {/* التفضيلات العقارية */}
              {client.propertyPreferences && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Home className="h-5 w-5 text-indigo-600" />
                    التفضيلات العقارية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">نوع العقار والمساحة</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">النوع:</span>
                          <span className="font-medium">{client.propertyPreferences.type === 'apartment' ? 'شقة' : 
                                                          client.propertyPreferences.type === 'villa' ? 'فيلا' : 
                                                          client.propertyPreferences.type === 'office' ? 'مكتب' : 'غير محدد'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">المساحة:</span>
                          <span className="font-medium">{client.propertyPreferences.minArea}-{client.propertyPreferences.maxArea} م²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">عدد الغرف:</span>
                          <span className="font-medium">{client.propertyPreferences.minRooms}-{client.propertyPreferences.maxRooms} غرفة</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">المناطق المفضلة</h4>
                      <div className="flex flex-wrap gap-2">
                        {client.propertyPreferences.preferredAreas?.map((area, index) => (
                          <Badge key={index} className="bg-indigo-100 text-indigo-800">
                            <MapPin className="h-3 w-3 ml-1" />
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* الاهتمامات */}
              {client.interests && client.interests.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-pink-600" />
                    الاهتمامات والمتطلبات
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {client.interests.map((interest, index) => (
                      <Badge key={index} className="bg-pink-100 text-pink-800">
                        <Star className="h-3 w-3 ml-1" />
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* الملاحظات الأساسية */}
              {client.notes && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                    ملاحظات أساسية
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{client.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* تبويبة التفاعلات */}
          {activeTab === 'interactions' && (
            <ActivityTimeline 
              interactions={interactions} 
              clientId={client.id}
              clientName={client.name}
              onAddInteraction={handleAddInteraction}
              showAddButton={true}
            />
          )}

          {/* تبويبة الملاحظات */}
          {activeTab === 'notes' && (
            <NotesSystem 
              notes={notes} 
              clientId={client.id}
              currentUserRole={currentUserRole}
              clientName={client.name}
              clientType="عميل"
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {/* تبويبة التقييم */}
          {activeTab === 'rating' && (
            <ClientRating 
              client={clientData}
              onUpdateRating={async (clientId, ratingData) => {
                try {
                  console.log('تحديث تقييم العميل:', clientId, ratingData)
                  
                  // تحديث البيانات محلياً فوراً لـ UI responsiveness
                  setClientData(prev => ({
                    ...prev,
                    rating: ratingData.rating,
                    leadScore: ratingData.leadScore
                  }))
                  
                  // 🔥 إرسال التحديث للباك اند
                  await api.updateClient(clientId, ratingData)
                  
                  // إشعار الـ parent component
                  if (onUpdateClient) {
                    onUpdateClient(clientId, ratingData)
                  }
                } catch (error) {
                  console.error('❌ Error updating rating:', error)
                  // إعادة البيانات للحالة الأصلية في حالة الخطأ
                  setClientData(client)
                  throw error // إعادة throw للخطأ عشان يظهر للمستخدم
                }
              }}
            />
          )}

          {/* تبويبة الموظف المسؤول */}
          {activeTab === 'assignment' && (
            <EmployeeAssignment 
              client={client}
              onUpdateAssignment={(clientId, assignment) => {
                console.log('تحديث تخصيص الموظف:', clientId, assignment)
                if (onUpdateClient) {
                  onUpdateClient(clientId, assignment)
                }
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t flex-shrink-0">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>آخر تحديث: {formatDateArabic(new Date())}</span>
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="h-3 w-3 ml-1" />
              ID: {client.id}
            </Badge>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              إغلاق
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white"
            >
              <Phone className="h-4 w-4 ml-2" />
              اتصال سريع
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDetailsModal
