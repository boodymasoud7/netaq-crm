import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { Edit, Trash2, Eye, Phone, Mail, Star } from 'lucide-react'
import { Badge } from '../ui/badge'
import { formatDateArabic, formatPhoneNumber } from '../../lib/utils'

const VirtualizedLeadsTable = ({
    leads = [],
    onEdit,
    onDelete,
    onView,
    onCall,
    onEmail,
    loading = false
}) => {
    const parentRef = useRef(null)

    const virtualizer = useVirtualizer({
        count: leads.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80, // Estimated row height
        overscan: 5 // Render 5 extra items above/below viewport
    })

    const getStatusBadge = (status) => {
        const statusMap = {
            'new': { label: 'جديد', className: 'bg-blue-100 text-blue-800' },
            'جديد': { label: 'جديد', className: 'bg-blue-100 text-blue-800' },
            'contacted': { label: 'تم التواصل', className: 'bg-yellow-100 text-yellow-800' },
            'تم التواصل': { label: 'تم التواصل', className: 'bg-yellow-100 text-yellow-800' },
            'qualified': { label: 'مؤهل', className: 'bg-green-100 text-green-800' },
            'مؤهل': { label: 'مؤهل', className: 'bg-green-100 text-green-800' },
            'converted': { label: 'محول', className: 'bg-purple-100 text-purple-800' },
            'محول': { label: 'محول', className: 'bg-purple-100 text-purple-800' },
            'lost': { label: 'مفقود', className: 'bg-red-100 text-red-800' },
            'مفقود': { label: 'مفقود', className: 'bg-red-100 text-red-800' }
        }
        const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
        return <Badge className={config.className}>{config.label}</Badge>
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">جاري التحميل...</p>
                </div>
            </div>
        )
    }

    if (leads.length === 0) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-gray-600 text-lg">لا توجد بيانات</p>
                </div>
            </div>
        )
    }

    return (
        <div className="border rounded-lg overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-gray-50 border-b sticky top-0 z-10">
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-semibold text-gray-700">
                    <div className="col-span-2">الاسم</div>
                    <div className="col-span-2">الهاتف</div>
                    <div className="col-span-2">البريد</div>
                    <div className="col-span-1">الحالة</div>
                    <div className="col-span-1">النقاط</div>
                    <div className="col-span-2">التاريخ</div>
                    <div className="col-span-2 text-center">الإجراءات</div>
                </div>
            </div>

            {/* Virtualized List */}
            <div
                ref={parentRef}
                className="h-[600px] overflow-auto"
                style={{ contain: 'strict' }}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative'
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const lead = leads[virtualRow.index]

                        return (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={virtualizer.measureElement}
                                className="absolute top-0 left-0 w-full border-b border-gray-200 hover:bg-gray-50 transition-colors"
                                style={{
                                    transform: `translateY(${virtualRow.start}px)`
                                }}
                            >
                                <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                                    {/* Name */}
                                    <div className="col-span-2">
                                        <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
                                        {lead.company && (
                                            <p className="text-xs text-gray-500 truncate">{lead.company}</p>
                                        )}
                                    </div>

                                    {/* Phone */}
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-700">{formatPhoneNumber(lead.phone)}</p>
                                    </div>

                                    {/* Email */}
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-700 truncate">{lead.email || '-'}</p>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1">
                                        {getStatusBadge(lead.status)}
                                    </div>

                                    {/* Score */}
                                    <div className="col-span-1">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                                            <span className="text-sm font-semibold">{lead.score || 0}</span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-600">{formatDateArabic(lead.createdAt)}</p>
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-2 flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => onView(lead)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="عرض"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onEdit(lead)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        {onCall && (
                                            <button
                                                onClick={() => onCall(lead)}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="اتصال"
                                            >
                                                <Phone className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => onDelete(lead)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t px-4 py-3">
                <p className="text-sm text-gray-600">
                    إجمالي: <span className="font-semibold">{leads.length.toLocaleString('ar-EG')}</span> عميل محتمل
                </p>
            </div>
        </div>
    )
}

export default VirtualizedLeadsTable
