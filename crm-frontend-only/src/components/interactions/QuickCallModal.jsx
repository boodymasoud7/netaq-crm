import React, { useState } from 'react';
import { 
  Phone, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  User
} from 'lucide-react';

const QuickCallModal = ({ isOpen, onClose, entity, entityType = 'lead', onCallRecorded }) => {
  const [callData, setCallData] = useState({
    duration: '',
    outcome: '',
    clientResponse: '',
    nextAction: '',
    status: 'completed'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const outcomes = [
    { value: 'interested', label: 'مهتم', color: 'text-green-600', icon: CheckCircle },
    { value: 'not_interested', label: 'غير مهتم', color: 'text-red-600', icon: XCircle },
    { value: 'callback_requested', label: 'طلب اتصال مرة أخرى', color: 'text-blue-600', icon: Phone },
    { value: 'meeting_scheduled', label: 'تم تحديد موعد اجتماع', color: 'text-purple-600', icon: Calendar },
    { value: 'demo_requested', label: 'طلب عرض تقديمي', color: 'text-indigo-600', icon: MessageSquare },
    { value: 'no_response', label: 'لا يوجد رد', color: 'text-gray-600', icon: AlertCircle },
    { value: 'objection_raised', label: 'اعتراض أو تحفظ', color: 'text-orange-600', icon: AlertCircle }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...callData,
        [`${entityType}Id`]: entity.id,
        duration: callData.duration ? parseInt(callData.duration) : null
      };

      const response = await fetch('/api/interactions/quick-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Call logged successfully:', result.data);
        
        // إشعار نجاح
        if (window.showNotification) {
          window.showNotification('تم تسجيل المكالمة بنجاح', 'success');
        }
        
        // إعادة تحميل البيانات إذا كان هناك callback
        if (window.refreshInteractions) {
          window.refreshInteractions();
        }

        // استدعاء callback للمكالمة المسجلة
        if (onCallRecorded) {
          onCallRecorded(result.data);
        }

        onClose();
      } else {
        throw new Error(result.message || 'حدث خطأ أثناء تسجيل المكالمة');
      }
    } catch (error) {
      console.error('❌ Error logging call:', error);
      if (window.showNotification) {
        window.showNotification(error.message, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCallData({
      duration: '',
      outcome: '',
      clientResponse: '',
      nextAction: '',
      status: 'completed'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">تسجيل مكالمة سريع</h2>
              <p className="text-sm text-gray-600">
                مع: {entity?.name} ({entity?.phone})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* مدة المكالمة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline ml-1" />
              مدة المكالمة (بالدقائق)
            </label>
            <input
              type="number"
              min="0"
              max="999"
              placeholder="مثال: 15"
              value={callData.duration}
              onChange={(e) => setCallData(prev => ({ ...prev, duration: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* نتيجة المكالمة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <CheckCircle className="w-4 h-4 inline ml-1" />
              نتيجة المكالمة
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outcomes.map((outcome) => {
                const IconComponent = outcome.icon;
                return (
                  <label
                    key={outcome.value}
                    className={`
                      flex items-center p-3 border rounded-lg cursor-pointer transition-all
                      ${callData.outcome === outcome.value 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={outcome.value}
                      checked={callData.outcome === outcome.value}
                      onChange={(e) => setCallData(prev => ({ ...prev, outcome: e.target.value }))}
                      className="sr-only"
                    />
                    <IconComponent className={`w-5 h-5 ml-2 ${outcome.color}`} />
                    <span className="text-sm font-medium text-gray-700">
                      {outcome.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* رد العميل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline ml-1" />
              رد العميل أو تعليقاته
            </label>
            <textarea
              rows="3"
              placeholder="مثال: أبدى اهتماماً بالمشروع وطلب مزيد من التفاصيل..."
              value={callData.clientResponse}
              onChange={(e) => setCallData(prev => ({ ...prev, clientResponse: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* الخطوة التالية */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline ml-1" />
              الخطوة التالية (اختياري)
            </label>
            <input
              type="text"
              placeholder="مثال: إرسال كتالوج المشاريع عبر الواتساب"
              value={callData.nextAction}
              onChange={(e) => setCallData(prev => ({ ...prev, nextAction: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !callData.outcome}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 rtl:space-x-reverse"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري التسجيل...</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4" />
                  <span>تسجيل المكالمة</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickCallModal;




