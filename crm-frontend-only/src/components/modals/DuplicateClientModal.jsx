import { AlertTriangle, Users, Phone, Mail, Calendar, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDateArabic } from '../../lib/utils';

export default function DuplicateClientModal({ duplicates, onCancel, onViewDuplicate }) {
    if (!duplicates || duplicates.length === 0) {
        return null;
    }

    const getStatusBadge = (status) => {
        const statusMap = {
            'active': { bg: 'bg-green-100', text: 'text-green-700', label: 'نشط' },
            'inactive': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'غير نشط' },
            'potential': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'محتمل' },
            'converted': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'محول' }
        };

        const statusInfo = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                {statusInfo.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">عميل موجود مسبقاً!</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                يوجد {duplicates.length} {duplicates.length === 1 ? 'عميل مشابه' : 'عملاء مشابهين'} في النظام
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                            <strong>تنبيه:</strong> لا يمكن إضافة هذا العميل لأنه موجود مسبقاً في النظام. يرجى التواصل مع المدير لمزيد من المعلومات.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {duplicates.map((duplicate, index) => (
                            <div
                                key={duplicate.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg text-gray-900">{duplicate.name}</h3>
                                            {getStatusBadge(duplicate.status)}
                                        </div>
                                        {duplicate.source && (
                                            <p className="text-xs text-gray-500">المصدر: {duplicate.source}</p>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewDuplicate && onViewDuplicate(duplicate)}
                                        className="flex items-center gap-1"
                                    >
                                        <Eye className="w-4 h-4" />
                                        <span>عرض</span>
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{duplicate.phone || 'لا يوجد'}</span>
                                    </div>

                                    {duplicate.email && (
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{duplicate.email}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs">تم الإضافة: {formatDateArabic(duplicate.createdAt)}</span>
                                    </div>

                                    {duplicate.assignedToName && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs">المسؤول: {duplicate.assignedToName}</span>
                                        </div>
                                    )}
                                </div>

                                {duplicate.budget > 0 && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                        <span className="text-xs text-gray-500">
                                            الميزانية: <span className="font-semibold text-gray-700">{duplicate.budget} جنيه</span>
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="min-w-[120px]"
                        >
                            إغلاق
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
