import React, { useState, useMemo } from 'react'
import { 
  ChevronDown, 
  ChevronRight,
  Phone, 
  Clock,
  User,
  Flag,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  Mail,
  MessageSquare,
  Video,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Plus,
  Users
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import { getResponsibleEmployee } from '../../lib/userUtils'

const GroupedFollowUpsTable = ({ 
  followUps = [], 
  onEdit, 
  onDelete, 
  onComplete, 
  onView,
  currentUser 
}) => {
  const [expandedClients, setExpandedClients] = useState(new Set())


  // تجميع المتابعات حسب العميل
  const groupedFollowUps = useMemo(() => {
    console.log('🔍 GroupedFollowUpsTable: Raw follow-ups:', followUps.length);
    
    // إزالة التكرارات باستخدام Map مع ID كمفتاح - طريقة أقوى وأسرع
    const uniqueFollowUpsMap = new Map();
    followUps.forEach(followUp => {
      if (followUp && followUp.id) {
        // استخدام ID كمفتاح يضمن عدم التكرار
        uniqueFollowUpsMap.set(followUp.id, followUp);
      }
    });
    
    const uniqueFollowUps = Array.from(uniqueFollowUpsMap.values());
    
    if (followUps.length !== uniqueFollowUps.length) {
      console.warn(`⚠️ GroupedFollowUpsTable: Removed ${followUps.length - uniqueFollowUps.length} duplicates!`);
      const duplicateIds = followUps.map(f => f.id).filter((id, index, arr) => arr.indexOf(id) !== index);
      console.warn('🔍 Duplicate IDs:', duplicateIds);
    }
    
    console.log('✅ GroupedFollowUpsTable: Final unique follow-ups:', uniqueFollowUps.length);
    
    const groups = {}
    
    uniqueFollowUps.forEach(followUp => {
      let clientKey, clientName, clientPhone, clientType
      
      if (followUp.lead?.id) {
        clientKey = `lead-${followUp.lead.id}`
        clientName = followUp.lead.name || 'عميل محتمل غير محدد'
        clientPhone = followUp.lead.phone
        clientType = 'lead'
      } else if (followUp.client?.id) {
        clientKey = `client-${followUp.client.id}`
        clientName = followUp.client.name || 'عميل غير محدد'
        clientPhone = followUp.client.phone
        clientType = 'client'
      } else {
        clientKey = 'no-client'
        clientName = 'بدون عميل محدد'
        clientPhone = null
        clientType = 'none'
      }
      
      if (!groups[clientKey]) {
        groups[clientKey] = {
          clientName,
          clientPhone,
          clientType,
          clientId: followUp.lead?.id || followUp.client?.id,
          followUps: [],
          // إضافة معلومات الموظف المسؤول عن العميل (وليس المخصص له المتابعة)
          assignedEmployee: getResponsibleEmployee(followUp)
        }
      }
      
      // تحديث معلومات الموظف المسؤول عن العميل إذا لم تكن موجودة
      if (!groups[clientKey].assignedEmployee) {
        groups[clientKey].assignedEmployee = getResponsibleEmployee(followUp)
      }
      
      groups[clientKey].followUps.push(followUp)
    })
    
    // ترتيب المجموعات حسب أحدث متابعة
    return Object.entries(groups)
      .map(([key, group]) => ({
        ...group,
        key,
        // ترتيب المتابعات داخل المجموعة
        followUps: group.followUps.sort((a, b) => {
          const statusPriority = {
            'scheduled': 1,
            'in_progress': 2, 
            'overdue': 3,
            'missed': 4,
            'completed': 5
          }
          
          const aStatus = statusPriority[a.status] || 3
          const bStatus = statusPriority[b.status] || 3
          
          if (aStatus !== bStatus) return aStatus - bStatus
          
          return new Date(a.scheduledDate) - new Date(b.scheduledDate)
        }),
        // إحصائيات المجموعة
        stats: {
          total: group.followUps.length,
          scheduled: group.followUps.filter(f => f.status === 'scheduled').length,
          completed: group.followUps.filter(f => f.status === 'completed').length,
          overdue: group.followUps.filter(f => f.status === 'overdue').length,
          nextFollowUp: group.followUps
            .filter(f => f.status === 'scheduled')
            .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0]
        }
      }))
      .sort((a, b) => {
        // ترتيب المجموعات: التي بها متابعات مجدولة أولاً
        if (a.stats.scheduled > 0 && b.stats.scheduled === 0) return -1
        if (a.stats.scheduled === 0 && b.stats.scheduled > 0) return 1
        
        // ثم حسب أقرب متابعة
        if (a.stats.nextFollowUp && b.stats.nextFollowUp) {
          return new Date(a.stats.nextFollowUp.scheduledDate) - new Date(b.stats.nextFollowUp.scheduledDate)
        }
        
        return 0
      })
  }, [followUps])

  const toggleClientExpansion = (clientKey) => {
    const newExpanded = new Set(expandedClients)
    if (newExpanded.has(clientKey)) {
      newExpanded.delete(clientKey)
    } else {
      newExpanded.add(clientKey)
    }
    setExpandedClients(newExpanded)
  }

  const getTypeInfo = (type) => {
    const types = {
      'call': { 
        icon: Phone, 
        label: 'مكالمة', 
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      },
      'email': { 
        icon: Mail, 
        label: 'إيميل', 
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      },
      'meeting': { 
        icon: Users, 
        label: 'اجتماع', 
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100', 
        textColor: 'text-green-700'
      },
      'demo': { 
        icon: Video, 
        label: 'عرض تقديمي', 
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700'
      },
      'whatsapp': { 
        icon: MessageSquare, 
        label: 'واتساب', 
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      },
      'visit': { 
        icon: MapPin, 
        label: 'زيارة', 
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700'
      }
    }
    return types[type] || types['call']
  }

  const getStatusInfo = (status) => {
    const statuses = {
      'scheduled': { 
        label: 'مجدولة', 
        color: 'bg-blue-100 text-blue-700',
        icon: Clock
      },
      'in_progress': { 
        label: 'قيد التنفيذ', 
        color: 'bg-yellow-100 text-yellow-700',
        icon: Target
      },
      'completed': { 
        label: 'مكتملة', 
        color: 'bg-green-100 text-green-700',
        icon: CheckCircle
      },
      'missed': { 
        label: 'فائتة', 
        color: 'bg-gray-100 text-gray-700',
        icon: XCircle
      },
      'overdue': { 
        label: 'متأخرة', 
        color: 'bg-red-100 text-red-700',
        icon: AlertTriangle
      }
    }
    return statuses[status] || statuses['scheduled']
  }

  const getPriorityInfo = (priority) => {
    const priorities = {
      'low': { label: 'منخفضة', color: 'bg-gray-100 text-gray-600' },
      'medium': { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-600' },
      'high': { label: 'عالية', color: 'bg-orange-100 text-orange-600' },
      'urgent': { label: 'عاجلة', color: 'bg-red-100 text-red-600' }
    }
    return priorities[priority] || priorities['medium']
  }

  if (groupedFollowUps.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium">لا توجد متابعات</p>
        <p className="text-sm">ابدأ بإضافة متابعة جديدة</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groupedFollowUps.map((group) => {
        const isExpanded = expandedClients.has(group.key)
        const hasScheduled = group.stats.scheduled > 0
        const hasOverdue = group.stats.overdue > 0
        
        return (
          <div key={group.key} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Client Header Row */}
            <div 
              className={`p-4 cursor-pointer transition-all duration-200 ${
                isExpanded ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => toggleClientExpansion(group.key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  {/* Expand/Collapse Icon */}
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  
                  {/* Client Type Icon */}
                  <div className={`w-10 h-10 rounded-full ${
                    group.clientType === 'lead' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                      : group.clientType === 'client'
                      ? 'bg-gradient-to-r from-green-500 to-teal-500'
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  } flex items-center justify-center`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Client Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <h3 className="font-semibold text-gray-900">
                        {group.clientName}
                      </h3>
                      <Badge className={`text-xs ${
                        group.clientType === 'lead' 
                          ? 'bg-orange-100 text-orange-700' 
                          : group.clientType === 'client'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {group.clientType === 'lead' ? 'عميل محتمل' : 
                         group.clientType === 'client' ? 'عميل' : 'غير محدد'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 rtl:space-x-reverse mt-1">
                      {group.clientPhone && (
                        <p className="text-sm text-gray-600">
                          📱 {group.clientPhone}
                        </p>
                      )}
                      {group.assignedEmployee && (
                        <p className="text-sm text-blue-600 font-medium">
                          👤 {group.assignedEmployee.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Summary Stats */}
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  {/* Next Follow-up */}
                  {group.stats.nextFollowUp && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        المتابعة القادمة
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDateArabic(group.stats.nextFollowUp.scheduledDate)}
                      </p>
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {hasOverdue && (
                      <Badge className="bg-red-100 text-red-700 text-xs">
                        {group.stats.overdue} متأخرة
                      </Badge>
                    )}
                    {hasScheduled && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs">
                        {group.stats.scheduled} مجدولة
                      </Badge>
                    )}
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      {group.stats.completed} مكتملة
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-700 text-xs">
                      {group.stats.total} الإجمالي
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Expanded Follow-ups List */}
            {isExpanded && (
              <div className="border-t border-gray-200">
                {group.followUps.map((followUp) => {
                  const typeInfo = getTypeInfo(followUp.type)
                  const statusInfo = getStatusInfo(followUp.status)
                  const priorityInfo = getPriorityInfo(followUp.priority)
                  const IconComponent = typeInfo.icon
                  
                  return (
                    <div key={followUp.id} className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse flex-1">
                          {/* Type Icon */}
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          
                          {/* Follow-up Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {followUp.title}
                              </h4>
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                              <Badge className={priorityInfo.color}>
                                <Flag className="w-3 h-3 mr-1" />
                                {priorityInfo.label}
                              </Badge>
                            </div>
                            
                            {followUp.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                {followUp.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs text-gray-500">
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDateArabic(followUp.scheduledDate)}
                              </span>
                              {getResponsibleEmployee(followUp) && (
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {getResponsibleEmployee(followUp).name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onView?.(followUp)
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {followUp.status !== 'completed' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit?.(followUp)
                                }}
                                className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onComplete?.(followUp.id, followUp)
                                }}
                                className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="إكمال المتابعة"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete?.(followUp)
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default GroupedFollowUpsTable
