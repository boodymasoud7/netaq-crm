import React from 'react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { 
  Calendar,
  Clock, 
  User, 
  Phone, 
  Mail, 
  Target,
  Flag,
  FileText,
  MessageSquare,
  Video,
  MapPin,
  Award,
  X
} from 'lucide-react'
import { formatDateArabic, formatPhoneNumber } from '../../lib/utils'
import { getResponsibleEmployeeName } from '../../lib/userUtils'

const typeIcons = {
  call: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  meeting: Video,
  demo: Award,
  visit: MapPin
}

const typeColors = {
  call: 'from-blue-500 to-blue-600',
  whatsapp: 'from-green-500 to-green-600',
  email: 'from-red-500 to-red-600',
  meeting: 'from-purple-500 to-purple-600',
  demo: 'from-indigo-500 to-indigo-600',
  visit: 'from-orange-500 to-orange-600'
}

const typeLabels = {
  call: 'مكالمة',
  whatsapp: 'واتساب',
  email: 'إيميل',
  meeting: 'اجتماع',
  demo: 'عرض تقديمي',
  visit: 'زيارة'
}

const statusLabels = {
  scheduled: 'مجدولة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  cancelled: 'ملغية',
  overdue: 'متأخرة',
  missed: 'فائتة'
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
  missed: 'bg-orange-100 text-orange-800'
}

const priorityLabels = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}

const FollowUpDetailsModal = ({ isOpen, onClose, followUp }) => {
  if (!isOpen || !followUp) return null

  const TypeIcon = typeIcons[followUp.type] || FileText
  const typeColor = typeColors[followUp.type] || 'from-gray-500 to-gray-600'
  const typeLabel = typeLabels[followUp.type] || followUp.type
  const statusLabel = statusLabels[followUp.status] || followUp.status
  const statusColor = statusColors[followUp.status] || 'bg-gray-100 text-gray-800'
  const priorityLabel = priorityLabels[followUp.priority] || followUp.priority
  const priorityColor = priorityColors[followUp.priority] || 'bg-gray-100 text-gray-800'

  const responsibleEmployee = getResponsibleEmployeeName(followUp)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <div className="bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${typeColor} flex items-center justify-center`}>
                  <TypeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 text-right">
                    {followUp.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={statusColor}>
                      {statusLabel}
                    </Badge>
                    <Badge className={priorityColor}>
                      <Flag className="w-3 h-3 mr-1" />
                      {priorityLabel}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800">
                      {typeLabel}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="font-medium">تاريخ المتابعة</span>
                </div>
                <p className="text-gray-900 pr-6">
                  {formatDateArabic(followUp.scheduledDate)}
                </p>
              </div>

              {followUp.duration && (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="font-medium">المدة المتوقعة</span>
                  </div>
                  <p className="text-gray-900 pr-6">
                    {followUp.duration} دقيقة
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">الموظف المسؤول</span>
                </div>
                <p className="text-gray-900 pr-6">
                  {responsibleEmployee}
                </p>
              </div>

              {followUp.assignedUser && (
                <div className="space-y-2">
                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span className="font-medium">مخصص إلى</span>
                  </div>
                  <p className="text-gray-900 pr-6">
                    {followUp.assignedUser.name}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {followUp.description && (
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="font-medium">الوصف</span>
                </div>
                <p className="text-gray-900 pr-6 bg-gray-50 p-3 rounded-lg">
                  {followUp.description}
                </p>
              </div>
            )}

            {/* Notes */}
            {followUp.notes && (
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="font-medium">ملاحظات</span>
                </div>
                <p className="text-gray-900 pr-6 bg-gray-50 p-3 rounded-lg">
                  {followUp.notes}
                </p>
              </div>
            )}
          </div>

          {/* Client Information */}
          {(followUp.lead || followUp.client) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                معلومات العميل
              </h3>
              
              {followUp.lead && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">عميل محتمل</h4>
                    <Badge className="bg-blue-100 text-blue-800">Lead</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-blue-700">الاسم:</span>
                      <p className="text-blue-900">{followUp.lead.name}</p>
                    </div>
                    
                    {followUp.lead.phone && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">الهاتف:</span>
                        <p className="text-blue-900 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {formatPhoneNumber(followUp.lead.phone)}
                        </p>
                      </div>
                    )}
                    
                    {followUp.lead.email && (
                      <div>
                        <span className="text-sm font-medium text-blue-700">الإيميل:</span>
                        <p className="text-blue-900 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {followUp.lead.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {followUp.client && (
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-900">عميل</h4>
                    <Badge className="bg-green-100 text-green-800">Client</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-green-700">الاسم:</span>
                      <p className="text-green-900">{followUp.client.name}</p>
                    </div>
                    
                    {followUp.client.phone && (
                      <div>
                        <span className="text-sm font-medium text-green-700">الهاتف:</span>
                        <p className="text-green-900 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {formatPhoneNumber(followUp.client.phone)}
                        </p>
                      </div>
                    )}
                    
                    {followUp.client.email && (
                      <div>
                        <span className="text-sm font-medium text-green-700">الإيميل:</span>
                        <p className="text-green-900 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {followUp.client.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline Information */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              معلومات زمنية
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">تاريخ الإنشاء:</span>
                <p className="text-gray-900">{formatDateArabic(followUp.createdAt)}</p>
              </div>
              
              <div>
                <span className="text-gray-600">آخر تحديث:</span>
                <p className="text-gray-900">{formatDateArabic(followUp.updatedAt)}</p>
              </div>
              
              {followUp.completedAt && (
                <div>
                  <span className="text-gray-600">تاريخ الإكمال:</span>
                  <p className="text-gray-900">{formatDateArabic(followUp.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              إغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FollowUpDetailsModal
