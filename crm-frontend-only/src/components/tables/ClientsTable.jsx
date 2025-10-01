import React, { useState } from 'react'
import { 
  WhatsAppButton, 
  InteractionsButton, 
  NotesButton, 
  EditButton, 
  DeleteButton,
  ViewButton,
  ActionDropdown
} from '../actions/ActionButtons'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatDateArabic, formatPhoneNumber } from '../../lib/utils'
import UnifiedTableHeader from './UnifiedTableHeader'
import { 
  User, 
  MapPin, 
  Building, 
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  UserCheck,
  Copy,
  Trash2,
  Download,
  FileText,
  MoreHorizontal,
  Zap,
  Search,
  Filter,
  CalendarPlus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'
// Removed useMockData - using real API data
import ConfirmDialog from '../ui/ConfirmDialog'

export default function ClientsTable({ 
  clients, 
  onEdit, 
  onDelete, 
  onView,
  onReminder,
  onConvertToLead,
  onCreateFollowUp,
  onAddNote,
  onAddInteraction,
  onBulkDelete,
  onBulkExport,
  canEditClient,
  canDeleteClient,
  canBulkEditClients,
  canBulkDeleteClients,
  selectedClients = [],
  onSelectedClientsChange,
  pageSize,
  onPageSizeChange
}) {
  const { currentUser, userProfile } = useAuth()
  const { canEdit, canDelete, checkPermission, isAdmin, isSalesManager } = usePermissions()
  // Note: Client notes now come from real API through props
  
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Helper functions to get counts from client data (comes from API)
  const getNotesCount = (client) => {
    return client?.notesCount || 0
  }

  const getInteractionsCount = (client) => {
    return client?.interactionsCount || 0
  }

  // نسخ رقم الهاتف
  const copyPhone = (phone) => {
    navigator.clipboard.writeText(phone)
    toast.success('تم نسخ رقم الهاتف')
  }



  // تحويل إلى عميل محتمل
  const convertToLead = (client) => {
    onConvertToLead?.(client)
    toast.success(`تم تحويل ${client.name} إلى عميل محتمل`)
  }

  // استخدام دوال الصلاحيات الممررة من المكون الأب
  const checkEditPermission = canEditClient || (() => false)
  const checkDeletePermission = canDeleteClient || (() => false)

  // === الإجراءات الجماعية ===
  
  // حذف العملاء المحددين
  const handleBulkDelete = () => {
    if (selectedClients.length === 0) return
    
    // فحص الصلاحية قبل الحذف
    if (!canDeleteClient()) {
      toast.error('لا تملك صلاحية حذف العملاء')
      return
    }
    
    // فتح حوار التأكيد
    setShowBulkDeleteConfirm(true)
  }

  // تأكيد الحذف الجماعي
  const confirmBulkDelete = async () => {
    try {
      await onBulkDelete?.(selectedClients)
      onSelectedClientsChange?.([])
      setShowBulkDeleteConfirm(false)
    } catch (error) {
      console.error('خطأ في العملية الجماعية:', error)
    }
  }



  // تصدير العملاء المحددين
  const handleBulkExport = () => {
    if (selectedClients.length === 0) return
    
    const selectedClientsData = clients.filter(client => selectedClients.includes(client.id))
    onBulkExport?.(selectedClientsData)
    toast.success(`تم تصدير ${selectedClients.length} عميل`)
  }

  // إلغاء تحديد جميع العملاء
  const clearSelection = () => {
    onSelectedClientsChange?.([])
  }

  // إجراءات إضافية لكل عميل
  const getAdditionalActions = (client) => [
    {
      icon: Calendar,
      label: 'إنشاء متابعة',
      onClick: () => onCreateFollowUp?.(client),
      color: 'text-blue-600'
    },
    {
      icon: Copy,
      label: 'نسخ رقم الهاتف',
      onClick: () => copyPhone(client.phone),
      color: 'text-gray-600'
    }
  ]

  // ألوان الحالات
  const getStatusColor = (status) => {
    const colors = {
      'نشط': 'bg-green-100 text-green-800',
      'غير نشط': 'bg-red-100 text-red-800',
      'محتمل': 'bg-yellow-100 text-yellow-800',
      'مؤرشف': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // ترجمة حالات العملاء للعربية
  const translateStatus = (status) => {
    const translations = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'potential': 'محتمل',
      'archived': 'مؤرشف'
    }
    return translations[status] || status || 'غير محدد'
  }

  // ترجمة أنواع العملاء للعربية
  const translateClientType = (type) => {
    const translations = {
      'individual': 'فردي',
      'company': 'شركة',
      'investor': 'مستثمر',
      'developer': 'مطور'
    }
    return translations[type] || type || 'غير محدد'
  }

  // ألوان أنواع العملاء
  const getClientTypeColor = (type) => {
    const colors = {
      'فردي': 'bg-blue-100 text-blue-800',
      'شركة': 'bg-purple-100 text-purple-800',
      'مستثمر': 'bg-emerald-100 text-emerald-800',
      'مطور': 'bg-orange-100 text-orange-800',
      'فرد': 'bg-blue-100 text-blue-800',
      'individual': 'bg-blue-100 text-blue-800',
      'company': 'bg-purple-100 text-purple-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-8 text-center">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد عملاء</h3>
        <p className="text-gray-600">ابدأ بإضافة أول عميل لك</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 shadow-lg bg-white overflow-hidden">
      {/* Table Header with Integrated Search - نفس تصميم المطورين بالضبط */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">قائمة العملاء</h3>
              <p className="text-sm text-green-600">{clients.length} من أصل {clients.length} عميل</p>
            </div>
          </div>
          {/* البحث والفلاتر المدمجة */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  placeholder="بحث سريع..."
                  className="pl-10 pr-10 h-8 w-48 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* اختيار حجم الصفحة */}
              {onPageSizeChange && (
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-1">
                  <span className="text-green-700 text-xs font-medium">عرض:</span>
                  <select 
                    value={pageSize || 50} 
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className="bg-transparent border-0 text-green-700 text-xs rounded px-1 py-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                  </select>
                  <span className="text-green-700 text-xs font-medium">عميل</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-3 text-xs"
                >
                  <Filter className="h-3 w-3 ml-1" />
                  فلترة
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                  حفظ البحث
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                  تصدير
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* شريط الإجراءات الجماعية */}
      {selectedClients.length > 0 && (
        <div className="bg-green-50 border-b border-green-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-green-900">
                تم تحديد {selectedClients.length} عميل
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectedClientsChange?.([])}
                className="text-green-600 hover:text-green-800"
              >
                إلغاء التحديد
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkExport?.(clients.filter(client => selectedClients.includes(client.id)))}
                className="flex items-center gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete?.(selectedClients)}
                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد عملاء
          </h3>
          <p className="text-gray-600 mb-4">
            ابدأ بإضافة العملاء لإدارة قاعدة بياناتك
          </p>
        </div>
      ) : (
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-green-300"
                        checked={clients.length > 0 && selectedClients.length === clients.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onSelectedClientsChange?.(clients.map(client => client.id))
                          } else {
                            onSelectedClientsChange?.([])
                          }
                        }}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-600" />
                      <span>العميل</span>
                      </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-indigo-600" />
                      <span>المسؤول</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <span>الهاتف</span>
                  </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span>الموقع</span>
                </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span>تاريخ الإضافة</span>
              </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span>إجراءات سريعة</span>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                    <div className="flex items-center gap-2">
                      <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      <span>الإجراءات</span>
                </div>
                  </th>
                </tr>
              </thead>
          <tbody className="bg-white">
            {clients.map((client) => (
                            <tr 
                key={client.id} 
                className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-green-25 hover:to-emerald-25 transition-all duration-200 cursor-pointer"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(240 253 244), rgb(220 252 231))'; // green-50 to green-100
                  e.currentTarget.style.borderLeftColor = 'rgb(34 197 94)'; // green-500
                  e.currentTarget.style.borderLeftWidth = '4px';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '';
                  e.currentTarget.style.borderLeftColor = 'transparent';
                  e.currentTarget.style.borderLeftWidth = '0px';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* تحديد */}
                <td className="py-3 px-4 align-middle">
                  <div className="flex items-center justify-center w-12">
                    <input 
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelectedClientsChange?.([...selectedClients, client.id])
                        } else {
                          onSelectedClientsChange?.(selectedClients.filter(id => id !== client.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </div>
                </td>

                {/* العميل */}
                <td className="py-3 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{client.name}</span>
                        {/* Indicators للتفاعلات والملاحظات */}
                        <div className="flex items-center gap-1">
                          {getInteractionsCount(client) > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-1.5 py-0.5 text-xs flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              <span>{getInteractionsCount(client)}</span>
                            </Badge>
                          )}
                          {getNotesCount(client) > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-1.5 py-0.5 text-xs flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{getNotesCount(client)}</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{client.source && `المصدر: ${client.source}`.substring(0, 30)}...</div>
                    </div>
                  </div>
                </td>

                {/* المسؤول */}
                <td className="py-3 px-4 align-middle">
                  <div className="text-sm text-gray-900">{client.assignedToName || client.createdByName || 'غير محدد'}</div>
                </td>

                {/* الهاتف */}
                <td className="py-3 px-4 align-middle">
                  <div className="text-sm text-gray-900">{formatPhoneNumber(client.phone) || 'غير محدد'}</div>
                </td>

                {/* الموقع */}
                <td className="py-3 px-4 align-middle">
                  <div className="text-sm text-gray-900">{client.address?.split(',')[0] || 'غير محدد'}</div>
                </td>

                {/* تاريخ الإضافة */}
                <td className="py-3 px-4 align-middle">
                  <div className="text-sm text-gray-900">
                    {formatDateArabic(client.createdAt)}
                  </div>
                </td>

                {/* إجراءات سريعة */}
                <td className="py-3 px-4 align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg shadow-sm">
                    <WhatsAppButton 
                      phone={client.phone}
                      name={client.name}
                      message={`مرحباً ${client.name}، نود التواصل معك بخصوص خدماتنا العقارية.`}
                    />
                    <InteractionsButton 
                      onAddInteraction={onAddInteraction}
                      itemId={client.id}
                      itemName={client.name}
                      itemType="client"
                    />
                    <NotesButton 
                      onAddNote={onAddNote}
                      itemId={client.id}
                      itemName={client.name}
                      notesCount={getNotesCount(client.id)}
                    />
                                      </div>
                  </div>
                </td>

                {/* المزيد من الإجراءات */}
                <td className="py-3 px-4 align-middle">
                  <div className="flex items-center justify-center gap-2">
                  <ActionDropdown
                    item={client}
                    onEdit={checkEditPermission(client) ? onEdit : null}
                    onDelete={checkDeletePermission(client) ? onDelete : null}
                    onView={onView}
                    onReminder={onReminder}
                    additionalActions={getAdditionalActions(client)}
                  />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Table Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>إجمالي العملاء: {clients.length}</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>نشط: {clients.filter(c => c.status === 'نشط').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>غير نشط: {clients.filter(c => c.status === 'غير نشط').length}</span>
              </div>
            </div>
            <div>عرض {clients.length} من أصل {clients.length}</div>
          </div>
        </div>
      </div>
      )}

      {/* حوار تأكيد نقل العملاء للأرشيف */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title="تأكيد نقل العملاء للأرشيف"
        message={`هل أنت متأكد من نقل ${selectedClients.length} عميل إلى الأرشيف؟ يمكنك استعادتهم لاحقاً من صفحة الأرشيف.`}
        confirmText="نقل للأرشيف"
        cancelText="إلغاء"
        type="warning"
      />
    </div>
  )
}