import React, { useState } from 'react';
import { MessageCircle, Phone, Settings, Save } from 'lucide-react';

const WhatsAppSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    apiKey: '',
    phoneNumber: '',
    businessName: '',
    autoReply: false,
    autoReplyMessage: 'شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.'
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would save the settings to your backend
      console.log('Saving WhatsApp settings:', settings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <MessageCircle className="w-6 h-6 text-green-600 mr-3" />
        <h2 className="text-xl font-bold text-gray-800">إعدادات واتساب</h2>
      </div>

      <div className="space-y-6">
        {/* Enable WhatsApp */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">تفعيل واتساب</label>
            <p className="text-sm text-gray-500">تفعيل خدمة واتساب للأعمال</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            مفتاح API
          </label>
          <input
            type="text"
            value={settings.apiKey}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            placeholder="أدخل مفتاح API الخاص بواتساب"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!settings.enabled}
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="inline w-4 h-4 mr-1" />
            رقم الهاتف
          </label>
          <input
            type="text"
            value={settings.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="مثال: +966501234567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!settings.enabled}
          />
        </div>

        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اسم الشركة
          </label>
          <input
            type="text"
            value={settings.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="اسم شركتك"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!settings.enabled}
          />
        </div>

        {/* Auto Reply */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">الرد التلقائي</label>
            <p className="text-sm text-gray-500">إرسال رد تلقائي للرسائل الواردة</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoReply}
              onChange={(e) => handleInputChange('autoReply', e.target.checked)}
              className="sr-only peer"
              disabled={!settings.enabled}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Auto Reply Message */}
        {settings.autoReply && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رسالة الرد التلقائي
            </label>
            <textarea
              value={settings.autoReplyMessage}
              onChange={(e) => handleInputChange('autoReplyMessage', e.target.value)}
              placeholder="اكتب رسالة الرد التلقائي..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!settings.enabled}
            />
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={loading || !settings.enabled}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;