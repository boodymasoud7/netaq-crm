import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Star
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';

/**
 * مودال إضافة تذكير سريع من صفحة العملاء
 */
export default function QuickReminderModal({ 
  isOpen, 
  onClose, 
  client, 
  onSuccess 
}) {
  const { currentUser } = useAuth();
  const api = useApi();
  
  // حالات النموذج
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'call',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    reminderBefore: '15'
  });
  
  const [loading, setLoading] = useState(false);

  // إعادة تعيين النموذج عند الفتح
  useEffect(() => {
    if (isOpen && client) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      setFormData({
        title: `📞 اتصال مع ${client.name}`,
        description: `متابعة مع العميل ${client.name}`,
        type: 'call',
        priority: 'medium',
        dueDate: tomorrowStr,
        dueTime: '10:00',
        reminderBefore: '15'
      });
    }
  }, [isOpen, client]);

  // أنواع التذكيرات السريعة
  const quickTypes = [
    { value: 'call', label: '📞 اتصال', color: 'bg-green-100 text-green-800' },
    { value: 'visit', label: '🚗 زيارة', color: 'bg-blue-100 text-blue-800' },
    { value: 'meeting', label: '👥 اجتماع', color: 'bg-purple-100 text-purple-800' },
    { value: 'follow-up', label: '🎯 متابعة', color: 'bg-orange-100 text-orange-800' }
  ];

  // مستويات الأولوية
  const priorities = [
    { value: 'low', label: 'منخفضة', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    { value: 'medium', label: 'متوسطة', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'high', label: 'عالية', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    { value: 'urgent', label: 'عاجلة', color: 'bg-red-100 text-red-800', icon: Zap }
  ];

  // تحديث البيانات
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // تحديث العنوان تلقائياً عند تغيير النوع
      if (field === 'type' && client) {
        const typeLabels = {
          'call': `📞 اتصال مع ${client.name}`,
          'visit': `🚗 زيارة ${client.name}`,
          'meeting': `👥 اجتماع مع ${client.name}`,
          'follow-up': `🎯 متابعة مع ${client.name}`
        };
        newData.title = typeLabels[value] || `مهمة مع ${client.name}`;
      }
      
      return newData;
    });
  };

  // حفظ التذكير
  const handleSubmit = async () => {
    // التحقق من البيانات الأساسية
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان التذكير');
      return;
    }
    if (!formData.dueDate) {
      toast.error('يرجى تحديد تاريخ التذكير');
      return;
    }
    if (!formData.dueTime) {
      toast.error('يرجى تحديد وقت التذكير');
      return;
    }

    setLoading(true);
    try {
      // تكوين التاريخ والوقت
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      
      // حساب وقت التذكير المسبق
      const reminderTime = new Date(dueDateTime.getTime() - (parseInt(formData.reminderBefore) * 60 * 1000));

      const reminderData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        priority: formData.priority,
        dueDate: dueDateTime.toISOString(),
        reminderTime: reminderTime.toISOString(),
        assignedTo: currentUser?.id,
        assignedToName: currentUser?.name,
        clientName: client?.name || '',
        phone: client?.phone || '',
        location: client?.address || client?.location || '',
        status: 'pending',
        completed: false,
        notified: false,
        createdBy: currentUser?.id,
        createdByName: currentUser?.name
      };

      await api.addReminder(reminderData);
      
      // إرسال إشعار للنظام المتقدم
      window.dispatchEvent(new Event('reminderAdded'));
      
      toast.success(`🎉 تم إنشاء التذكير لـ ${client.name} بنجاح!`, {
        duration: 4000,
        icon: '✅'
      });
      
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('فشل في إنشاء التذكير. حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header - مدمج */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-white" />
              <h2 className="text-lg font-bold">تذكير سريع</h2>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-white hover:bg-white/20 p-1 h-8 w-8 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* معلومات العميل - مدمجة */}
        <div className="px-6 py-3 bg-blue-50 border-b">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">{client.name}</span>
            {client.phone && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{client.phone}</span>
              </>
            )}
          </div>
        </div>

        {/* محتوى النموذج - قابل للتمرير */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* نوع التذكير - صف واحد */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Star className="h-4 w-4 inline mr-1 text-orange-500" />
              نوع التذكير
            </label>
            <div className="grid grid-cols-4 gap-1">
              {quickTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleInputChange('type', type.value)}
                  className={`
                    p-2 rounded-lg border-2 transition-all text-xs font-medium
                    ${formData.type === type.value 
                      ? 'border-orange-500 bg-orange-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* عنوان التذكير */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              العنوان
            </label>
            <Input 
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="عنوان التذكير"
              className="py-2"
            />
          </div>

          {/* التاريخ والوقت */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1 text-blue-500" />
                التاريخ
              </label>
              <Input 
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className="py-2"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1 text-blue-500" />
                الوقت
              </label>
              <Input 
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange('dueTime', e.target.value)}
                className="py-2"
              />
            </div>
          </div>

          {/* الأولوية - صف واحد */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-red-500" />
              الأولوية
            </label>
            <div className="grid grid-cols-4 gap-1">
              {priorities.map(priority => {
                const Icon = priority.icon;
                return (
                  <button
                    key={priority.value}
                    onClick={() => handleInputChange('priority', priority.value)}
                    className={`
                      p-2 rounded-lg border-2 transition-all text-xs font-medium flex items-center justify-center gap-1
                      ${formData.priority === priority.value 
                        ? 'border-orange-500 bg-orange-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{priority.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* وقت التذكير المسبق */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Bell className="h-4 w-4 inline mr-1 text-green-500" />
              تذكيرني قبل الموعد بـ
            </label>
            <select 
              value={formData.reminderBefore}
              onChange={(e) => handleInputChange('reminderBefore', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="5">5 دقائق</option>
              <option value="15">15 دقيقة</option>
              <option value="30">30 دقيقة</option>
              <option value="60">ساعة واحدة</option>
              <option value="120">ساعتين</option>
              <option value="1440">يوم كامل</option>
            </select>
          </div>

          {/* ملاحظة اختيارية */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ملاحظة (اختياري)
            </label>
            <textarea 
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="تفاصيل إضافية..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>
        </div>

        {/* Footer - ثابت في الأسفل */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 px-6"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                إنشاء التذكير
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
