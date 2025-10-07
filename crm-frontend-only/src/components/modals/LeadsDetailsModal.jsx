import { useState, useEffect } from 'react'
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
  Target,
  TrendingUp,
  Award,
  Zap
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
import { useApi } from '../../hooks/useApi'
import toast from 'react-hot-toast'

const LeadsDetailsModal = ({ lead, onClose, onUpdateLead }) => {
  const [activeTab, setActiveTab] = useState('info')
  const [interactions, setInteractions] = useState([])
  const [notes, setNotes] = useState([])
  const { userProfile } = useAuth()
  const api = useApi()

  // تحديد دور المستخدم الحالي (مؤقتاً نخليه مدير للاختبار)
  const currentUserRole = userProfile?.role || 'admin' // مؤقتاً مدير للاختبار

  // تحميل الملاحظات والتفاعلات
  useEffect(() => {
    loadNotes()
    loadInteractions()
  }, [lead.id])

  const loadNotes = async () => {
    try {
      const response = await api.getNotes('lead', lead.id, {})
      console.log('📝 Notes loaded for lead:', lead.id, response)
      setNotes(response.data || [])
    } catch (error) {
      console.error('❌ Error loading notes:', error)
      setNotes([])
    }
  }

  const loadInteractions = async () => {
    try {
      console.log('📋 Loading interactions for lead:', lead.id)
      const response = await api.getInteractions({ itemType: 'lead', itemId: lead.id })
      console.log('✅ Interactions loaded for lead:', response)
      setInteractions(response.data || [])
    } catch (error) {
      console.error('❌ Error loading interactions:', error)
      setInteractions([])
    }
  }

  const handleAddNote = async (noteData) => {
    try {
      // التعامل مع الحالتين: string (من quick actions) أو object (من NotesSystem)
      const noteToAdd = typeof noteData === 'string' 
        ? {
            content: noteData,
            itemType: 'lead',
            itemId: lead.id,
            title: 'ملاحظة عامة',
            type: 'general',
            priority: 'medium'
          }
        : {
            ...noteData,
            itemType: 'lead',
            itemId: lead.id
          }

      await api.addNote(noteToAdd)
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
        itemType: 'lead',
        itemId: lead.id
      }
      console.log('📋 Adding interaction for lead:', apiInteractionData)
      await api.addInteraction(apiInteractionData)
      console.log('✅ Interaction added successfully for lead')
      toast.success('تم إضافة التفاعل بنجاح')
      loadInteractions() // إعادة تحميل التفاعلات
    } catch (error) {
      console.error('❌ Error adding interaction:', error)
      toast.error('حدث خطأ أثناء إضافة التفاعل')
    }
  }

  const tabs = [
    { id: 'info', label: 'المعلومات', icon: <Target className="h-4 w-4" /> },
    { id: 'interactions', label: 'التفاعلات', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'notes', label: 'الملاحظات', icon: <Star className="h-4 w-4" /> },
    { id: 'scoring', label: 'Lead Scoring', icon: <Award className="h-4 w-4" /> },
    { id: 'assignment', label: 'الموظف المسؤول', icon: <Users className="h-4 w-4" /> }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': case 'ساخن': case 'مهتم جداً': return 'bg-red-100 text-red-800 border-red-200'
      case 'warm': case 'دافئ': case 'مهتم': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cold': case 'بارد': case 'جديد': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'converted': case 'محول': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'hot': return 'ساخن 🔥'
      case 'warm': return 'دافئ 🟡'
      case 'cold': return 'بارد 🔵'
      case 'converted': return 'محول ✅'
      case 'ساخن': return 'ساخن 🔥'
      case 'دافئ': return 'دافئ 🟡'
      case 'بارد': return 'بارد 🔵'
      case 'جديد': return 'جديد 🔵'
      case 'مهتم جداً': return 'مهتم جداً 🔥'
      case 'مهتم': return 'مهتم 🟡'
      case 'محول': return 'محول ✅'
      default: return status || 'غير محدد'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50'
    if (score >= 60) return 'text-orange-600 bg-orange-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-blue-600 bg-blue-50'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'عالي جداً'
    if (score >= 60) return 'عالي'
    if (score >= 40) return 'متوسط'
    return 'منخفض'
  }

  if (!lead) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
        {/* Header مطور بتدرج جميل */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 px-6 py-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{lead.name}</h2>
                  <p className="text-orange-100 text-sm">تفاصيل العميل المحتمل</p>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge className={`${getStatusColor(lead.status)} text-xs font-medium px-2 py-1`}>
                      {getStatusText(lead.status)}
                    </Badge>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getScoreColor(lead.score || 0)}`}>
                      النقاط: {lead.score || 0}/100
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
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-10">
            <Zap className="h-16 w-16" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-10">
            <Award className="h-12 w-12" />
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-orange-600 border-b-2 border-orange-500 shadow-sm'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-white hover:bg-opacity-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* المعلومات الشخصية */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    المعلومات الشخصية
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{lead.name?.charAt(0) || 'ع'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <p className="text-sm text-gray-600">العميل المحتمل</p>
                      </div>
                    </div>
                    
                    {lead.phone && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{formatPhoneNumber(lead.phone)}</span>
                        <a 
                          href={`tel:${lead.phone}`}
                          className="text-blue-600 hover:text-blue-800 text-sm bg-blue-100 px-2 py-1 rounded-md"
                        >
                          اتصال
                        </a>
                      </div>
                    )}
                    
                    {lead.email && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{lead.email}</span>
                      </div>
                    )}
                    
                    {lead.address && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{lead.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* معلومات المبيعات */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    معلومات المبيعات
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">المصدر</p>
                        <p className="font-semibold text-gray-900">{lead.source || 'غير محدد'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-gray-600 uppercase tracking-wide">الأولوية</p>
                        <p className="font-semibold text-gray-900">{lead.priority || 'متوسطة'}</p>
                      </div>
                    </div>
                    
                    {lead.budget && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">الميزانية: {lead.budget?.toLocaleString()} جنيه</span>
                      </div>
                    )}
                    
                    {lead.interestedIn && (
                      <div className="flex items-center gap-3 text-gray-700">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="font-medium">مهتم بـ: {lead.interestedIn}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline معلومات */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  معلومات التوقيت
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">تاريخ الإنشاء</p>
                    <p className="font-semibold text-gray-900">{formatDateArabic(lead.createdAt)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">آخر تواصل</p>
                    <p className="font-semibold text-gray-900">{formatDateArabic(lead.lastContact)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">آخر تحديث</p>
                    <p className="font-semibold text-gray-900">{formatDateArabic(lead.updatedAt || lead.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* ملاحظات سريعة */}
              {lead.notes && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    الملاحظات السريعة
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{lead.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interactions' && (
            <ActivityTimeline 
              interactions={interactions} 
              clientId={lead.id}
              clientName={lead.name}
              itemType="lead"
              title="تفاعلات العميل المحتمل"
              onAddInteraction={handleAddInteraction}
              showAddButton={true}
            />
          )}

          {activeTab === 'notes' && (
            <NotesSystem
              notes={notes.map(note => ({
                ...note,
                title: note.title || 'ملاحظة عامة',
                type: note.type || 'general',
                priority: note.priority || 'medium',
                createdBy: note.createdBy || note.userId,
                createdAt: note.createdAt
              }))}
              clientId={lead.id}
              currentUserRole={currentUserRole}
              clientName={lead.name}
              clientType="عميل محتمل"
              isManager={currentUserRole === 'admin' || currentUserRole === 'manager'}
              title="ملاحظات العميل المحتمل"
              emptyMessage="لا توجد ملاحظات لهذا العميل المحتمل حتى الآن"
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-6">
              {/* Lead Score الحالي */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Award className="h-6 w-6 text-indigo-600" />
                    Lead Scoring System
                  </h3>
                  <div className={`px-4 py-2 rounded-full font-bold text-lg ${getScoreColor(lead.score || 0)}`}>
                    {lead.score || 0}/100
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">مستوى التأهيل</span>
                    <span className="text-sm text-gray-600">{getScoreLabel(lead.score || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        (lead.score || 0) >= 80 ? 'bg-red-500' :
                        (lead.score || 0) >= 60 ? 'bg-orange-500' :
                        (lead.score || 0) >= 40 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${lead.score || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Scoring Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-gray-900 mb-3">عوامل التقييم</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">معلومات الاتصال</span>
                        <span className="text-sm font-medium">
                          {lead.phone && lead.email ? '20/20' : lead.phone || lead.email ? '10/20' : '0/20'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">مستوى الاهتمام</span>
                        <span className="text-sm font-medium">
                          {lead.status === 'hot' || lead.status === 'ساخن' ? '30/30' :
                           lead.status === 'warm' || lead.status === 'دافئ' ? '20/30' : '10/30'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">الميزانية المحددة</span>
                        <span className="text-sm font-medium">{lead.budget ? '25/25' : '0/25'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">التفاعل الأخير</span>
                        <span className="text-sm font-medium">15/25</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-indigo-200">
                    <h4 className="font-semibold text-gray-900 mb-3">التوصيات</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      {(lead.score || 0) >= 80 && (
                        <div className="flex items-center gap-2 text-red-700">
                          <Zap className="h-4 w-4" />
                          <span>جاهز للتحويل - اتصل فوراً!</span>
                        </div>
                      )}
                      {(lead.score || 0) >= 60 && (lead.score || 0) < 80 && (
                        <div className="flex items-center gap-2 text-orange-700">
                          <Clock className="h-4 w-4" />
                          <span>يحتاج متابعة مكثفة</span>
                        </div>
                      )}
                      {(lead.score || 0) < 60 && (
                        <div className="flex items-center gap-2 text-blue-700">
                          <MessageSquare className="h-4 w-4" />
                          <span>يحتاج تنمية العلاقة أولاً</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-3">
                        آخر تحديث للنقاط: {formatDateArabic(lead.updatedAt || lead.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Award className="h-4 w-4 ml-2" />
                  إعادة حساب النقاط
                </Button>
                <Button variant="outline">
                  <TrendingUp className="h-4 w-4 ml-2" />
                  عرض التاريخ
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'assignment' && (
            <EmployeeAssignment
              assignedTo={lead.assignedTo}
              onUpdateAssignment={(newAssignment) => console.log('تحديث التخصيص:', newAssignment)}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex gap-3">
            <Button 
              onClick={() => onConvertToClient && onConvertToClient(lead)}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              disabled={lead.status === 'converted' || lead.status === 'محول'}
            >
              <User className="h-4 w-4 ml-2" />
              تحويل إلى عميل
              {(lead.score || 0) >= 80 && (
                <Badge className="bg-yellow-400 text-yellow-900 ml-2 text-xs">
                  جاهز!
                </Badge>
              )}
            </Button>
            <Button variant="outline">
              <MessageSquare className="h-4 w-4 ml-2" />
              إضافة ملاحظة
            </Button>
            <Button variant="outline">
              <Zap className="h-4 w-4 ml-2" />
              إضافة تفاعل
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Lead Score</p>
              <p className={`text-lg font-bold ${
                (lead.score || 0) >= 80 ? 'text-green-600' :
                (lead.score || 0) >= 60 ? 'text-orange-600' :
                'text-blue-600'
              }`}>
                {lead.score || 0}/100
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadsDetailsModal
