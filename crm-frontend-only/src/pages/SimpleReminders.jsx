import React, { useState, useEffect } from 'react'
import { 
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  Bell,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  Target,
  Zap,
  Star,
  MessageSquare,
  Eye,
  MoreVertical,
  UserCheck,
  Users,
  X,
  FileText,
  Phone,
  RefreshCw,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { ConfirmDialog } from '../components/ui/confirm-dialog'
import { getDefaultReminderTime, toEgyptDateTimeLocal, fromEgyptDateTimeLocal, formatEgyptDateTime, isInFuture } from '../utils/timezone'
import toast from 'react-hot-toast'

// مكون إضافة تذكير جديد - محسن ومتقدم - مع دعم توقيت مصر
const AddReminderModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    note: '',
    remindAt: '',
    priority: 'medium',
    type: 'general',
    description: '',
    clientId: '',
    leadId: ''
  })
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [leads, setLeads] = useState([])

  const { addReminder, getClients, getLeads } = useApi()
  const { currentUser } = useAuth()
  const { isAdmin } = usePermissions()

  // تحميل العملاء والعملاء المحتملين عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      loadClientsAndLeads()
      // تعيين وقت افتراضي (5 دقائق من الآن) بتوقيت مصر
      const defaultTimeString = getDefaultReminderTime(5)
      setFormData(prev => ({ ...prev, remindAt: defaultTimeString }))
    }
  }, [isOpen])

  const loadClientsAndLeads = async () => {
    try {
      setDataLoading(true)
      const [clientsResponse, leadsResponse] = await Promise.all([
        getClients(),
        getLeads()
      ])

      // فلترة العملاء حسب الصلاحيات - المدير يرى الجميع، الموظفين يروا عملاءهم فقط
      const userClients = isAdmin()
        ? clientsResponse?.data || []
        : clientsResponse?.data?.filter(client =>
            client.assignedTo === currentUser?.name ||
            client.assignedTo === currentUser?.email ||
            client.user_id === currentUser?.id ||
            client.createdBy === currentUser?.id
          ) || []

      const userLeads = isAdmin()
        ? leadsResponse?.data || []
        : leadsResponse?.data?.filter(lead =>
            lead.assignedTo === currentUser?.name ||
            lead.assignedTo === currentUser?.email ||
            lead.user_id === currentUser?.id ||
            lead.createdBy === currentUser?.id
          ) || []

      setClients(userClients)
      setLeads(userLeads)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل بيانات العملاء')
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.note.trim()) {
      toast.error('يرجى كتابة محتوى التذكير')
      return
    }
    
    if (!formData.remindAt) {
      toast.error('يرجى تحديد وقت التذكير')
      return
    }

    // التحقق من أن الوقت في المستقبل بتوقيت مصر
    if (!isInFuture(formData.remindAt)) {
      toast.error('وقت التذكير يجب أن يكون في المستقبل (بتوقيت مصر)')
      return
    }

    setLoading(true)
    try {
      // تحويل الوقت من datetime-local إلى ISO بتوقيت مصر  
      const reminderTime = fromEgyptDateTimeLocal(formData.remindAt)

      const reminderData = {
        note: formData.note.trim(),
        remind_at: reminderTime.toISOString()
      }

      // إضافة الحقول الإضافية إذا كانت مدعومة (ستتم إضافتها لاحقاً للباك إند)
      if (formData.priority && formData.priority !== 'medium') {
        reminderData.priority = formData.priority
      }
      if (formData.type && formData.type !== 'general') {
        reminderData.type = formData.type
      }
      if (formData.description && formData.description.trim()) {
        reminderData.description = formData.description.trim()
      }

      // إضافة ربط العميل أو العميل المحتمل (ستتم إضافتها لاحقاً للباك إند)
      if (formData.clientId) {
        reminderData.client_id = parseInt(formData.clientId)
      } else if (formData.leadId) {
        reminderData.lead_id = parseInt(formData.leadId)
      }

      await addReminder(reminderData)
      
      toast.success('تم إضافة التذكير بنجاح')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('خطأ في إضافة التذكير:', error)
      toast.error(error.message || 'حدث خطأ أثناء إضافة التذكير')
    } finally {
      setLoading(false)
    }
  }

  const handleClientChange = (clientId) => {
    setFormData(prev => ({ 
      ...prev, 
      clientId, 
      leadId: clientId ? '' : prev.leadId // إزالة العميل المحتمل إذا تم اختيار عميل
    }))
  }

  const handleLeadChange = (leadId) => {
    setFormData(prev => ({ 
      ...prev, 
      leadId, 
      clientId: leadId ? '' : prev.clientId // إزالة العميل إذا تم اختيار عميل محتمل
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">إضافة تذكير جديد</h3>
                <p className="text-indigo-100 text-sm">املأ البيانات الأساسية للتذكير</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* محتوى التذكير */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              📝 محتوى التذكير *
              </label>
              <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="3"
              placeholder="اكتب محتوى التذكير هنا..."
                required
              />
            </div>

          {/* وقت التذكير */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ⏰ وقت التذكير *
              </label>
              <input
                type="datetime-local"
              value={formData.remindAt}
              onChange={(e) => setFormData({ ...formData, remindAt: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

          {/* الأولوية */}
          <div>
            {/* الأولوية */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🎯 الأولوية
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>

          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              📄 وصف تفصيلي (اختياري)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="2"
              placeholder="أضف تفاصيل إضافية للتذكير..."
            />
          </div>

          {/* ربط العملاء */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* العملاء */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👥 ربط بعميل (اختياري)
              </label>
              {dataLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  جاري التحميل...
                </div>
              ) : (
                <>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={formData.leadId} // منع اختيار عميل إذا تم اختيار عميل محتمل
                  >
                    <option value="">-- اختر عميل --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && !dataLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      {isAdmin() ? 'لا يوجد عملاء في النظام' : 'لا يوجد عملاء مخصصون لك'}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* العملاء المحتملين */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🎯 ربط بعميل محتمل (اختياري)
              </label>
              {dataLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  جاري التحميل...
                </div>
              ) : (
                <>
                  <select
                    value={formData.leadId}
                    onChange={(e) => handleLeadChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={formData.clientId} // منع اختيار عميل محتمل إذا تم اختيار عميل
                  >
                    <option value="">-- اختر عميل محتمل --</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                  {leads.length === 0 && !dataLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      {isAdmin() ? 'لا يوجد عملاء محتملين في النظام' : 'لا يوجد عملاء محتملين مخصصين لك'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ملاحظة عن الربط */}
          {(formData.clientId || formData.leadId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ يمكنك ربط التذكير بعميل أو عميل محتمل واحد فقط
              </p>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={onClose}
              variant="outline"
              className="px-6 py-3 font-medium"
              disabled={loading}
              >
                إلغاء
              </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-8 py-3 font-medium shadow-lg"
              disabled={loading}
            >
              {loading ? 'جاري الإضافة...' : 'إضافة التذكير'}
              </Button>
            </div>
          </form>
      </div>
    </div>
  )
}

// مكون تحرير التذكير - محسن ومتقدم
const EditReminderModal = ({ isOpen, onClose, onSuccess, reminder }) => {
  const [formData, setFormData] = useState({
    note: '',
    remindAt: '',
    priority: 'medium',
    type: 'general', 
    description: '',
    clientId: '',
    leadId: ''
  })
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [clients, setClients] = useState([])
  const [leads, setLeads] = useState([])

  const { updateReminder, getClients, getLeads } = useApi()
  const { currentUser } = useAuth()
  const { isAdmin } = usePermissions()

  // تحميل بيانات التذكير المطلوب تحريره
  useEffect(() => {
    if (isOpen && reminder) {
      loadClientsAndLeads()
      
      // تحويل التاريخ إلى صيغة datetime-local بتوقيت مصر
      const remindAtFormatted = toEgyptDateTimeLocal(reminder.remind_at)

      setFormData({
        note: reminder.note || '',
        remindAt: remindAtFormatted,
        priority: reminder.priority || 'medium',
        type: reminder.type || 'general',
        description: reminder.description || '',
        clientId: reminder.client_id || '',
        leadId: reminder.lead_id || ''
      })
    }
  }, [isOpen, reminder])

  const loadClientsAndLeads = async () => {
    try {
      setDataLoading(true)
      const [clientsResponse, leadsResponse] = await Promise.all([
        getClients(),
        getLeads()
      ])

      // فلترة العملاء حسب الصلاحيات - المدير يرى الجميع، الموظفين يروا عملاءهم فقط
      const userClients = isAdmin()
        ? clientsResponse?.data || []
        : clientsResponse?.data?.filter(client =>
            client.assignedTo === currentUser?.name ||
            client.assignedTo === currentUser?.email ||
            client.user_id === currentUser?.id ||
            client.createdBy === currentUser?.id
          ) || []

      const userLeads = isAdmin()
        ? leadsResponse?.data || []
        : leadsResponse?.data?.filter(lead =>
            lead.assignedTo === currentUser?.name ||
            lead.assignedTo === currentUser?.email ||
            lead.user_id === currentUser?.id ||
            lead.createdBy === currentUser?.id
          ) || []

      setClients(userClients)
      setLeads(userLeads)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      toast.error('فشل في تحميل بيانات العملاء')
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.note.trim()) {
      toast.error('يرجى كتابة محتوى التذكير')
      return
    }
    
    if (!formData.remindAt) {
      toast.error('يرجى تحديد وقت التذكير')
      return
    }

    // التحقق من أن الوقت في المستقبل بتوقيت مصر
    if (!isInFuture(formData.remindAt)) {
      toast.error('وقت التذكير يجب أن يكون في المستقبل (بتوقيت مصر)')
      return
    }

    setLoading(true)
    try {
      // تحويل الوقت من datetime-local إلى ISO بتوقيت مصر  
      const reminderTime = fromEgyptDateTimeLocal(formData.remindAt)

      const reminderData = {
        note: formData.note.trim(),
        remind_at: reminderTime.toISOString()
      }

      // إضافة الحقول الإضافية إذا كانت مدعومة (ستتم إضافتها لاحقاً للباك إند)
      if (formData.priority && formData.priority !== 'medium') {
        reminderData.priority = formData.priority
      }
      if (formData.type && formData.type !== 'general') {
        reminderData.type = formData.type
      }
      if (formData.description && formData.description.trim()) {
        reminderData.description = formData.description.trim()
      }

      // إضافة ربط العميل أو العميل المحتمل (ستتم إضافتها لاحقاً للباك إند)
      if (formData.clientId) {
        reminderData.client_id = parseInt(formData.clientId)
      } else if (formData.leadId) {
        reminderData.lead_id = parseInt(formData.leadId)
      }

      await updateReminder(reminder.id, reminderData)
      
      toast.success('تم تحديث التذكير بنجاح')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('خطأ في تحديث التذكير:', error)
      toast.error(error.message || 'حدث خطأ أثناء تحديث التذكير')
    } finally {
      setLoading(false)
    }
  }

  const handleClientChange = (clientId) => {
    setFormData(prev => ({ 
      ...prev, 
      clientId, 
      leadId: clientId ? '' : prev.leadId // إزالة العميل المحتمل إذا تم اختيار عميل
    }))
  }

  const handleLeadChange = (leadId) => {
    setFormData(prev => ({ 
      ...prev, 
      leadId, 
      clientId: leadId ? '' : prev.clientId // إزالة العميل إذا تم اختيار عميل محتمل
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Edit className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">تحرير التذكير</h3>
                <p className="text-orange-100 text-sm">عدّل بيانات التذكير حسب الحاجة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* محتوى التذكير */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              📝 محتوى التذكير *
              </label>
              <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows="3"
              placeholder="اكتب محتوى التذكير هنا..."
                required
              />
            </div>

          {/* وقت التذكير */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              ⏰ وقت التذكير *
              </label>
              <input
                type="datetime-local"
              value={formData.remindAt}
              onChange={(e) => setFormData({ ...formData, remindAt: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

          {/* الأولوية */}
          <div>
            {/* الأولوية */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🎯 الأولوية
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="urgent">عاجلة</option>
              </select>
            </div>

          </div>

          {/* الوصف */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              📄 وصف تفصيلي (اختياري)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows="2"
              placeholder="أضف تفاصيل إضافية للتذكير..."
            />
          </div>

          {/* ربط العملاء */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* العملاء */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👥 ربط بعميل (اختياري)
              </label>
              {dataLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  جاري التحميل...
                </div>
              ) : (
                <>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={formData.leadId} // منع اختيار عميل إذا تم اختيار عميل محتمل
                  >
                    <option value="">-- اختر عميل --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && !dataLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      {isAdmin() ? 'لا يوجد عملاء في النظام' : 'لا يوجد عملاء مخصصون لك'}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* العملاء المحتملين */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🎯 ربط بعميل محتمل (اختياري)
              </label>
              {dataLoading ? (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  جاري التحميل...
                </div>
              ) : (
                <>
                  <select
                    value={formData.leadId}
                    onChange={(e) => handleLeadChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={formData.clientId} // منع اختيار عميل محتمل إذا تم اختيار عميل
                  >
                    <option value="">-- اختر عميل محتمل --</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                  {leads.length === 0 && !dataLoading && (
                    <p className="text-sm text-gray-500 mt-1">
                      {isAdmin() ? 'لا يوجد عملاء محتملين في النظام' : 'لا يوجد عملاء محتملين مخصصين لك'}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ملاحظة عن الربط */}
          {(formData.clientId || formData.leadId) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ يمكنك ربط التذكير بعميل أو عميل محتمل واحد فقط
              </p>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={onClose}
              variant="outline"
              className="px-6 py-3 font-medium"
              disabled={loading}
              >
                إلغاء
              </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-3 font-medium shadow-lg"
              disabled={loading}
            >
              {loading ? 'جاري التحديث...' : 'تحديث التذكير'}
              </Button>
            </div>
          </form>
      </div>
    </div>
  )
}

export default function SimpleReminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0
  })
  
  // إدارة التحديد المتعدد
  const [selectedReminders, setSelectedReminders] = useState([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  
  // Pagination state
  const [pageSize, setPageSize] = useState(50) // حجم الصفحة المختار
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // دالة تغيير حجم الصفحة
  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setCurrentPage(1) // العودة للصفحة الأولى
    // إعادة جلب البيانات بالحجم الجديد - سيتم تطبيقها في useEffect
  }
  
  // دالة تغيير الصفحة
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // State لبيانات العملاء والعملاء المحتملين
  const [clientsData, setClientsData] = useState({})
  const [leadsData, setLeadsData] = useState({})


  
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    reminderId: null
  })
  
  const { getReminders, deleteReminder, markReminderAsDone, getRemindersStats, getClientById, getLeadById } = useApi()
  const { currentUser } = useAuth()
  const { isAdmin } = usePermissions()

  // تحميل البيانات عند تحميل الصفحة أو تغيير pagination
  useEffect(() => {
    loadData()
  }, [currentPage, pageSize])

  // تحديث تلقائي كل دقيقة (اختياري)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true) // تحديث صامت
    }, 60000) // كل دقيقة

    return () => clearInterval(interval)
  }, [])

  // استمع لحدث إتمام التذكير من popup
  useEffect(() => {
    const handleReminderCompleted = (event) => {
      const { reminderId, reminderNote } = event.detail
      
      // تحديث البيانات فوراً (بدون toast لأن popup سيعرض toast)
      loadDataSilently()
    }

    // إضافة listener
    window.addEventListener('reminderCompleted', handleReminderCompleted)

    // تنظيف listener عند unmount
    return () => {
      window.removeEventListener('reminderCompleted', handleReminderCompleted)
    }
  }, [])

  // جلب بيانات العملاء والعملاء المحتملين
  const fetchClientAndLeadData = async (reminders) => {
    
    const clientIds = new Set()
    const leadIds = new Set()
    
    reminders.forEach(reminder => {
      if (reminder.client_id !== null && reminder.client_id !== undefined && reminder.client_id !== "" && reminder.client_id !== "0" && reminder.client_id !== 0) {
        clientIds.add(reminder.client_id)
      }
      if (reminder.lead_id !== null && reminder.lead_id !== undefined && reminder.lead_id !== "" && reminder.lead_id !== "0" && reminder.lead_id !== 0) {
        leadIds.add(reminder.lead_id)
      }
    })


    // جلب بيانات العملاء
    const newClientsData = {}
    for (const clientId of clientIds) {
      try {
        const clientResponse = await getClientById(clientId)
        
        if (clientResponse?.data) {
          newClientsData[clientId] = clientResponse.data
        } else if (clientResponse?.name) {
          newClientsData[clientId] = clientResponse
        } else {
          // لا توجد بيانات حقيقية للعميل
          newClientsData[clientId] = { 
            name: `عميل #${clientId}`,
            phone: 'غير محدد'
          }
        }
      } catch (error) {
        // خطأ في تحميل بيانات العميل
        newClientsData[clientId] = { 
          name: `عميل #${clientId}`,
          phone: 'غير محدد'
        }
      }
    }

    // جلب بيانات العملاء المحتملين
    const newLeadsData = {}
    for (const leadId of leadIds) {
      try {
        const leadResponse = await getLeadById(leadId)
        
        if (leadResponse?.data) {
          newLeadsData[leadId] = leadResponse.data
        } else if (leadResponse?.name) {
          newLeadsData[leadId] = leadResponse
        } else {
          // لا توجد بيانات حقيقية للعميل المحتمل
          newLeadsData[leadId] = { 
            name: `عميل محتمل #${leadId}`,
            phone: 'غير محدد'
          }
        }
      } catch (error) {
        // خطأ في تحميل بيانات العميل المحتمل
        newLeadsData[leadId] = { 
          name: `عميل محتمل #${leadId}`,
          phone: 'غير محدد'
        }
      }
    }


    setClientsData(newClientsData)
    setLeadsData(newLeadsData)
  }

  const loadData = async (silent = false) => {
setLoading(true)
    try {
      const [remindersResponse, statsResponse] = await Promise.all([
        getReminders({ page: currentPage, limit: pageSize }),
        getRemindersStats()
      ])
      
      
      const remindersData = remindersResponse?.data || remindersResponse || []
      const statsData = statsResponse?.data || statsResponse || {}
      
      // تحديث pagination data
      if (remindersResponse?.pagination) {
        setCurrentPage(remindersResponse.pagination.currentPage || 1)
        setTotalPages(remindersResponse.pagination.totalPages || 1)
        setTotalItems(remindersResponse.pagination.totalItems || 0)
      }
      
      // التأكد من أن كل تذكير له الحقول المطلوبة
      const processedReminders = remindersData.map(reminder => ({
        ...reminder,
        // تعيين تاريخ إنشاء افتراضي إذا لم يوجد
        createdAt: reminder.createdAt || reminder.created_at || new Date().toISOString(),
        // تعيين نوع افتراضي إذا لم يوجد
        type: reminder.type || 'general',
        // تعيين أولوية افتراضية إذا لم توجد
        priority: reminder.priority || 'medium'
      }))
      
      
      setReminders(processedReminders)
      setStats({
        total: statsData.total || processedReminders.length,
        pending: statsData.pending || processedReminders.filter(r => r.status === 'pending').length,
        completed: statsData.completed || statsData.done || processedReminders.filter(r => r.status === 'done').length,
        overdue: statsData.overdue || 0
      })

      // جلب بيانات العملاء والعملاء المحتملين
      if (processedReminders.length > 0) {
        await fetchClientAndLeadData(processedReminders)
        if (!silent) {
          toast.success(`✅ تم تحديث ${processedReminders.length} تذكير بنجاح`)
        }
      } else {
        if (!silent) {
          toast('📭 لا توجد تذكيرات حالياً')
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      if (!silent) {
        toast.error('حدث خطأ في تحميل التذكيرات')
      }
    } finally {
      setLoading(false)
    }
  }

  // دالة تحديث البيانات بدون إشعارات (للاستخدام الداخلي)
  const loadDataSilently = () => loadData(true)

  // دالة للحصول على التذكيرات المفلترة
  const getFilteredReminders = () => {
    let filtered = reminders

    // تطبيق البحث
    if (searchQuery.trim()) {
      filtered = filtered.filter(reminder => 
        reminder.note?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // تطبيق الفلتر
    switch (activeFilter) {
      case 'pending':
        filtered = filtered.filter(reminder => reminder.status === 'pending')
        break
      case 'completed':
        filtered = filtered.filter(reminder => reminder.status === 'done')
        break
      case 'overdue':
        filtered = filtered.filter(reminder => {
          if (reminder.status !== 'pending') return false
          const remindTime = new Date(reminder.remind_at)
          const now = new Date()
          return remindTime < now
        })
        break
      case 'all':
      default:
        // عرض الجميع
        break
    }

    // ترتيب التذكيرات: غير المكتملة (pending) أولاً، ثم المكتملة (done)
    return filtered.sort((a, b) => {
      // أولاً: ترتيب حسب الحالة (pending أولاً، done أخيراً)
      if (a.status === 'pending' && b.status === 'done') {
        return -1 // a يأتي قبل b
      }
      if (a.status === 'done' && b.status === 'pending') {
        return 1 // b يأتي قبل a
      }
      
      // ثانياً: في نفس الحالة، ترتيب حسب تاريخ التذكير
      const dateA = new Date(a.remind_at)
      const dateB = new Date(b.remind_at)
      
      if (a.status === 'pending' && b.status === 'pending') {
        // للتذكيرات النشطة: الأقرب في الوقت أولاً
        return dateA - dateB
      } else {
        // للتذكيرات المكتملة: الأحدث إكمالاً أولاً
        return dateB - dateA
      }
    })
  }

  // حساب إحصائيات محدثة بناءً على الفلترة
  const filteredReminders = getFilteredReminders()
  const dynamicStats = {
    all: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    completed: reminders.filter(r => r.status === 'done').length,
    overdue: reminders.filter(r => {
      if (r.status !== 'pending') return false
      const remindTime = new Date(r.remind_at)
      const now = new Date()
      return remindTime < now
    }).length
  }

  const handleEdit = (reminder) => {
    setEditingReminder(reminder)
    setShowEditModal(true)
  }

  const handleMarkAsDone = async (reminderId) => {
    try {
      await markReminderAsDone(reminderId)
      toast.success('تم تحديد التذكير كمنجز')
      loadData(true) // تحديث صامت لأن toast تم عرضه بالفعل
    } catch (error) {
      console.error('خطأ في تحديث التذكير:', error)
      toast.error(error.message || 'حدث خطأ أثناء تحديث التذكير')
    }
  }

  const handleDeleteConfirm = (reminderId) => {
    setConfirmDialog({ isOpen: true, reminderId })
  }

  const handleDelete = async (reminderId) => {
    try {
      await deleteReminder(reminderId)
      toast.success('تم حذف التذكير')
      loadData(true); // تحديث صامت لأن toast تم عرضه بالفعل
      setConfirmDialog({ isOpen: false, reminderId: null });
    } catch (error) {
      console.error('خطأ في حذف التذكير:', error)
      toast.error('حدث خطأ أثناء حذف التذكير')
    }
  }

  // الحذف المتعدد للتذكيرات
  const handleBulkDelete = async () => {
    if (selectedReminders.length === 0) return
    
    try {
      const deletePromises = selectedReminders.map(reminderId => deleteReminder(reminderId))
      await Promise.all(deletePromises)
      
      toast.success(`تم حذف ${selectedReminders.length} تذكير بنجاح`)
      setSelectedReminders([])
      setShowBulkDeleteConfirm(false)
      loadData(true)
    } catch (error) {
      console.error('خطأ في الحذف المتعدد:', error)
      toast.error('حدث خطأ أثناء حذف بعض التذكيرات')
    }
  }

  // التحكم في التحديد المتعدد
  const handleSelectAll = (checked) => {
    if (checked) {
      const visibleReminderIds = filteredReminders.map(r => r.id)
      setSelectedReminders(visibleReminderIds)
    } else {
      setSelectedReminders([])
    }
  }

  const handleSelectReminder = (reminderId, checked) => {
    if (checked) {
      setSelectedReminders(prev => [...prev, reminderId])
    } else {
      setSelectedReminders(prev => prev.filter(id => id !== reminderId))
    }
  }

  const clearSelection = () => {
    setSelectedReminders([])
  }

  // تنسيق التاريخ والوقت
  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = date - now
      const diffMins = Math.round(diffMs / (1000 * 60))
      
      if (diffMins === 0) {
        return { text: 'الآن', status: 'now', color: 'blue' }
      } else if (diffMins > 0 && diffMins < 60) {
        return { text: `خلال ${diffMins} دقيقة`, status: 'upcoming', color: 'green' }
      } else if (diffMins > 0) {
        const diffHours = Math.round(diffMins / 60)
        if (diffHours < 24) {
          return { text: `خلال ${diffHours} ساعة`, status: 'upcoming', color: 'green' }
        } else {
          const diffDays = Math.round(diffHours / 24)
          return { text: `خلال ${diffDays} يوم`, status: 'upcoming', color: 'green' }
        }
      } else {
        const pastMins = Math.abs(diffMins)
        if (pastMins < 60) {
          return { text: `متأخر ${pastMins} دقيقة`, status: 'overdue', color: 'red' }
        } else {
          const pastHours = Math.round(pastMins / 60)
          if (pastHours < 24) {
            return { text: `متأخر ${pastHours} ساعة`, status: 'overdue', color: 'red' }
          } else {
            const pastDays = Math.round(pastHours / 24)
            return { text: `متأخر ${pastDays} يوم`, status: 'overdue', color: 'red' }
          }
        }
      }
    } catch (error) {
      return { text: 'وقت غير صحيح', status: 'error', color: 'gray' }
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">⏳ معلق</Badge>
      case 'done':
        return <Badge className="bg-green-100 text-green-800 border-green-200">✅ مكتمل</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">❓ غير محدد</Badge>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800 border-red-200">🚨 عاجل</Badge>
      case 'high':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⭐ عالي</Badge>
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">📋 متوسط</Badge>
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">📄 منخفض</Badge>
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl"></div>
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-2xl"></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white bg-opacity-10 rounded-full blur-lg"></div>
        
        <div className="relative backdrop-blur-sm bg-white bg-opacity-10 rounded-2xl p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <Bell className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">التذكيرات</h1>
                  <p className="text-indigo-100 text-lg">إدارة التذكيرات والمهام الشخصية</p>
                </div>
          </div>
          
              <div className="flex items-center gap-2 text-sm bg-white bg-opacity-20 rounded-lg px-3 py-2 backdrop-blur-sm w-fit">
                <User className="h-4 w-4" />
                <span className="font-medium">
                  {currentUser?.displayName || currentUser?.name || userProfile?.displayName || userProfile?.name || 'المستخدم'} - {isAdmin() ? '👑 مدير النظام' : '👤 موظف مبيعات'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
                className="bg-white text-purple-600 hover:bg-purple-50 shadow-lg font-semibold px-6 py-3 rounded-xl border-2 border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:scale-105"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-purple-100 rounded-lg">
                    <Plus className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-bold">إضافة تذكير جديد</span>
                </div>
            </Button>
            
            {/* أزرار إضافية */}
            <Button
              onClick={() => {
                toast.loading('🔄 جاري تحديث البيانات...')
                loadData(false) // عرض toast للتحديث اليدوي
              }}
              className="bg-green-100 text-green-700 hover:bg-green-200 shadow-lg font-semibold px-4 py-3 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-200 rounded-lg">
                  <RefreshCw className="h-4 w-4 text-green-700" />
                </div>
                <span className="font-bold">تحديث البيانات</span>
              </div>
            </Button>

            
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-indigo-100 text-sm font-medium">إجمالي التذكيرات</p>
                <p className="text-3xl font-bold mt-2">{dynamicStats.all}</p>
            </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Bell className="h-6 w-6" />
          </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min((dynamicStats.all / Math.max(dynamicStats.all, 10)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-orange-100 text-sm font-medium">تذكيرات معلقة</p>
                <p className="text-3xl font-bold mt-2">{dynamicStats.pending}</p>
            </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <Clock className="h-6 w-6" />
          </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min((dynamicStats.pending / Math.max(dynamicStats.all, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-green-100 text-sm font-medium">تذكيرات مكتملة</p>
                <p className="text-3xl font-bold mt-2">{dynamicStats.completed}</p>
            </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6" />
          </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min((dynamicStats.completed / Math.max(dynamicStats.all, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-500 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-red-100 text-sm font-medium">تذكيرات متأخرة</p>
                <p className="text-3xl font-bold mt-2">{dynamicStats.overdue}</p>
            </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <AlertTriangle className="h-6 w-6" />
          </div>
            </div>
            <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.min((dynamicStats.overdue / Math.max(dynamicStats.all, 1)) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filter Section - Integrated Card */}
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="البحث في التذكيرات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
            {/* Page Size Selector - تصميم أنيق */}
            <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-1">
              <span className="text-purple-700 text-xs font-medium">عرض:</span>
              <select 
                value={pageSize} 
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="bg-transparent border-0 text-purple-700 text-xs rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={2000}>2000</option>
                <option value={5000}>5000</option>
                <option value={10000}>الكل (10000)</option>
              </select>
              <span className="text-purple-700 text-xs font-medium">تذكير</span>
            </div>
          
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
            <Button
                variant={activeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
                onClick={() => setActiveFilter('all')}
                className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                  activeFilter === 'all' 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-purple-600 hover:bg-white'
                }`}
              >
                الجميع ({dynamicStats.all})
            </Button>
            <Button
                variant={activeFilter === 'pending' ? 'default' : 'ghost'}
              size="sm"
                onClick={() => setActiveFilter('pending')}
                className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                  activeFilter === 'pending' 
                    ? 'bg-orange-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-orange-500 hover:bg-white'
                }`}
              >
                معلقة ({dynamicStats.pending})
            </Button>
            <Button
                variant={activeFilter === 'completed' ? 'default' : 'ghost'}
              size="sm"
                onClick={() => setActiveFilter('completed')}
                className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                  activeFilter === 'completed' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-green-500 hover:bg-white'
                }`}
              >
                مكتملة ({dynamicStats.completed})
              </Button>
              <Button
                variant={activeFilter === 'overdue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('overdue')}
                className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 ${
                  activeFilter === 'overdue' 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-red-500 hover:bg-white'
                }`}
              >
                متأخرة ({dynamicStats.overdue})
            </Button>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* شريط التحديد المتعدد */}
      {selectedReminders.length > 0 && (
        <Card className="bg-blue-50 border-b border-blue-200 border-0 shadow-md">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  تم تحديد {selectedReminders.length} تذكير
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-blue-600 hover:text-blue-800"
                >
                  إلغاء التحديد
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف المحددة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* شريط التحديد الكامل */}
      {filteredReminders.length > 0 && (
        <Card className="bg-gray-50 border-0 shadow-sm">
          <CardContent className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="select-all-reminders"
                  className="rounded border-gray-300"
                  checked={filteredReminders.length > 0 && selectedReminders.length === filteredReminders.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <label htmlFor="select-all-reminders" className="text-sm font-medium text-gray-700 cursor-pointer">
                  تحديد جميع التذكيرات المعروضة ({filteredReminders.length})
                </label>
              </div>
              
              <div className="text-sm text-gray-500">
                {selectedReminders.length > 0 ? `${selectedReminders.length} محدد` : 'لا يوجد تحديد'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Reminders List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">جاري تحميل التذكيرات...</p>
          </div>
        </div>
      ) : filteredReminders.length === 0 ? (
        <Card className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 border-0">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تذكيرات</h3>
            <p className="text-gray-600">ابدأ بإضافة تذكير جديد</p>
          </Card>
        ) : (
        <div className="space-y-4">
          {filteredReminders.map((reminder) => {
            const timeInfo = formatDateTime(reminder.remind_at)
            const isOverdue = timeInfo.status === 'overdue'
            
            return (
              <Card 
                key={reminder.id} 
                className={`group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden ${
                  isOverdue 
                    ? 'bg-gradient-to-br from-red-50 via-red-25 to-pink-50 border-l-4 border-l-red-500 shadow-red-100' 
                    : reminder.status === 'done'
                    ? 'bg-gradient-to-br from-green-50 via-emerald-25 to-teal-50 border-l-4 border-l-green-500 shadow-green-100'
                    : 'bg-gradient-to-br from-blue-50 via-indigo-25 to-purple-50 border-l-4 border-l-blue-500 shadow-blue-100'
                } hover:scale-[1.01] transform shadow-lg`}
              >
                {/* Header Section */}
                <div className={`px-6 py-4 ${
                  isOverdue ? 'bg-gradient-to-r from-red-600 to-red-700' :
                  reminder.status === 'done' ? 'bg-gradient-to-r from-green-600 to-green-700' :
                  'bg-gradient-to-r from-blue-600 to-indigo-700'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Checkbox للتحديد */}
                      <input
                        type="checkbox"
                        className="rounded border-white border-2 bg-white bg-opacity-20"
                        checked={selectedReminders.includes(reminder.id)}
                        onChange={(e) => handleSelectReminder(reminder.id, e.target.checked)}
                      />
                      <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                        <Bell className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">
                          تذكير
                        </h3>
                        <div className="flex items-center gap-2 text-white text-opacity-90 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>{formatEgyptDateTime(reminder.remind_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Priority Badge */}
                      <Badge className={`${
                        reminder.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                        reminder.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {reminder.priority === 'high' ? '🔴 عالية' :
                         reminder.priority === 'medium' ? '🟡 متوسطة' :
                         '🟢 منخفضة'}
                      </Badge>
                      
                      {/* Status Badge */}
                      <Badge className={`${
                        reminder.status === 'done' ? 'bg-green-100 text-green-800 border-green-200' :
                        isOverdue ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {reminder.status === 'done' ? '✅ مكتمل' :
                         isOverdue ? '⚠️ متأخر' :
                         '⏳ نشط'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Main Content */}
                    <div className="bg-white bg-opacity-80 rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                      <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg leading-relaxed">
                          {reminder.note}
                          </h4>
                          {reminder.description && (
                            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border-r-4 border-blue-300">
                              📄 {reminder.description}
                            </p>
                          )}
                        </div>
                      </div>
                          </div>
                          
                    {/* Client/Lead Information - Always show, even if not linked */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          {(reminder.client_id || reminder.lead_id) ? (
                            <Users className="h-5 w-5 text-purple-600" />
                          ) : (
                            <User className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          {(reminder.client_id !== null && reminder.client_id !== undefined && reminder.client_id !== "" && reminder.client_id !== "0" && reminder.client_id !== 0) || 
                           (reminder.lead_id !== null && reminder.lead_id !== undefined && reminder.lead_id !== "" && reminder.lead_id !== "0" && reminder.lead_id !== 0) ? (
                            <>
                              <h5 className="font-medium text-purple-900 mb-1">
                                {(reminder.client_id !== null && reminder.client_id !== undefined && reminder.client_id !== "" && reminder.client_id !== "0" && reminder.client_id !== 0) ? '👤 مرتبط بعميل' : '🎯 مرتبط بعميل محتمل'}
                              </h5>
                              <p className="text-purple-700 text-sm font-semibold">
                                {(reminder.client_id !== null && reminder.client_id !== undefined && reminder.client_id !== "" && reminder.client_id !== "0" && reminder.client_id !== 0) ? 
                                  (clientsData[reminder.client_id]?.name || `عميل #${reminder.client_id}`) :
                                  (leadsData[reminder.lead_id]?.name || `عميل محتمل #${reminder.lead_id}`)
                                }
                              </p>
                              <p className="text-purple-600 text-xs mt-1 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {(reminder.client_id !== null && reminder.client_id !== undefined && reminder.client_id !== "" && reminder.client_id !== "0" && reminder.client_id !== 0) ? 
                                  (clientsData[reminder.client_id]?.phone || 'غير محدد') :
                                  (leadsData[reminder.lead_id]?.phone || 'غير محدد')
                                }
                              </p>
                              <p className="text-purple-500 text-xs mt-1">
                                {(reminder.client_id !== null && reminder.client_id !== undefined && reminder.client_id !== "" && reminder.client_id !== "0" && reminder.client_id !== 0) ? `🆔 عميل رقم: ${reminder.client_id}` : `🎯 عميل محتمل رقم: ${reminder.lead_id}`}
                              </p>
                            </>
                          ) : (
                            <>
                              <h5 className="font-medium text-purple-900 mb-1">
                                📋 تذكير عام
                              </h5>
                              <p className="text-purple-700 text-sm">
                                {reminder.description ? reminder.description.substring(0, 50) + '...' : 'تذكير عام غير مرتبط بعميل محدد'}
                              </p>
                            </>
                          )}
                        </div>
                        </div>
                      </div>
                      

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                          <Button
                          variant="outline"
                            size="sm"
                          onClick={() => handleEdit(reminder)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          >
                          <Edit className="h-4 w-4 mr-2" />
                          تعديل
                          </Button>
                        
                        {reminder.status === 'pending' && (
                        <Button
                          variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsDone(reminder.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            إكمال
                        </Button>
                        )}
                      </div>
                        
                        <Button
                          variant="outline"
                        size="sm"
                        onClick={() => handleDeleteConfirm(reminder.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                        >
                        <Trash2 className="h-4 w-4 mr-2" />
                        حذف
                        </Button>
                      </div>

                    {/* Progress Bar for Pending Reminders */}
                    {reminder.status === 'pending' && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                          <span>حالة التذكير</span>
                          <span>{isOverdue ? 'متأخر' : 'في الانتظار'}</span>
                    </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isOverdue ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ 
                              width: isOverdue ? '100%' : '70%'
                            }}
                          ></div>
                  </div>
                </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>
      )}

      {/* منطقة الترقيم */}
      {totalPages > 1 && (
        <Card className="bg-white border-0 shadow-md rounded-xl mt-6">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  <span>عرض {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalItems)}</span>
                </div>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-sm">
                  الصفحة {currentPage} من {totalPages}
                </Badge>
      </div>
              
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
                السابق
              </button>
              
              {/* أرقام الصفحات */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                      pageNum === currentPage
                        ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <AddReminderModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />
      
      <EditReminderModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingReminder(null)
        }}
        onSuccess={loadData}
        reminder={editingReminder}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, reminderId: null })}
        onConfirm={() => handleDelete(confirmDialog.reminderId)}
        title="حذف التذكير"
        message="هل أنت متأكد من رغبتك في حذف هذا التذكير؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
      />

      {/* Confirm Bulk Delete Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="حذف التذكيرات المحددة"
        message={`هل أنت متأكد من رغبتك في حذف ${selectedReminders.length} تذكير؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف الكل"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  )
}


