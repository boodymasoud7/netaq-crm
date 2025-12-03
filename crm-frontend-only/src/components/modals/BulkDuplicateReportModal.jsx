import { AlertTriangle, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { Button } from '../ui/button';

export default function BulkDuplicateReportModal({
    duplicates = [],
    duplicateCount = 0,
    newCount = 0,
    totalCount = 0,
    onSkipDuplicates,
    onAddAll,
    onCancel,
    isManager = false
}) {
    if (totalCount === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">📊 تقرير الاستيراد الجماعي</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                تم فحص {totalCount} سجل من الملف
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* New Records */}
                        <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">سجلات جديدة</p>
                                    <p className="text-2xl font-bold text-green-600">{newCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Duplicate Records */}
                        <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">سجلات مكررة</p>
                                    <p className="text-2xl font-bold text-red-600">{duplicateCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Total Records */}
                        <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">إجمالي السجلات</p>
                                    <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Duplicates List */}
                {duplicateCount > 0 && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                السجلات المكررة ({duplicateCount})
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                السجلات التالية موجودة مسبقاً في النظام
                            </p>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {duplicates.slice(0, 50).map((duplicate, index) => (
                                <div
                                    key={duplicate.id || index}
                                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{duplicate.name}</p>
                                            <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                                <span>📱 {duplicate.phone}</span>
                                                {duplicate.email && <span>📧 {duplicate.email}</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {duplicate.source && <span className="bg-gray-100 px-2 py-1 rounded">{duplicate.source}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {duplicates.length > 50 && (
                                <p className="text-sm text-gray-500 text-center py-2">
                                    ... و {duplicates.length - 50} سجل آخر
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>ملاحظة:</strong> {isManager
                                ? 'يمكنك اختيار تخطي السجلات المكررة (الافتراضي) أو إضافة الكل بما في ذلك المكرر.'
                                : 'سيتم تخطي السجلات المكررة تلقائياً. سيتم إضافة السجلات الجديدة فقط.'}
                        </p>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="min-w-[120px]"
                        >
                            إلغاء
                        </Button>

                        <Button
                            onClick={onSkipDuplicates}
                            className="bg-green-500 hover:bg-green-600 text-white min-w-[150px]"
                        >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تخطي المكرر ({newCount} سجل)
                        </Button>

                        {isManager && duplicateCount > 0 && (
                            <Button
                                onClick={onAddAll}
                                className="bg-amber-500 hover:bg-amber-600 text-white min-w-[150px]"
                            >
                                <AlertTriangle className="w-4 h-4 ml-2" />
                                إضافة الكل ({totalCount} سجل)
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
