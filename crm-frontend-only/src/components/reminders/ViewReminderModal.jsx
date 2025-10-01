import React from 'react';
import { 
  X, 
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  FileText,
  Flag,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Target,
  Users,
  Car,
  Home,
  Briefcase,
  Coffee,
  Zap,
  Star,
  Edit3,
  Trash2
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

/**
 * مودال عرض تفاصيل التذكير المحسن
 */
export default function ViewReminderModal({ 
  isOpen, 
  onClose, 
  reminder, 
  onEdit, 
  onDelete, 
  onComplete 
}) {
  if (!isOpen || !reminder) return null;

  // أيقونات الأنواع
  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="h-5 w-5" />;
      case 'visit': return <Car className="h-5 w-5" />;
      case 'meeting': return <Users className="h-5 w-5" />;
      case 'follow-up': return <Target className="h-5 w-5" />;
      case 'presentation': return <Briefcase className="h-5 w-5" />;
      case 'inspection': return <Home className="h-5 w-5" />;
      case 'contract': return <FileText className="h-5 w-5" />;
      default: return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  // تسميات الأنواع
  const getTypeLabel = (type) => {
    switch (type) {
      case 'call': return 'اتصال هاتفي';
      case 'visit': return 'زيارة ميدانية';
      case 'meeting': return 'اجتماع';
      case 'follow-up': return 'متابعة';
      case 'presentation': return 'عرض تقديمي';
      case 'inspection': return 'معاينة عقار';
      case 'contract': return 'توقيع عقد';
      default: return 'مهمة عامة';
    }
  };

  // ألوان الأولوية
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'low': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle2, 
          label: 'منخفضة' 
        };
      case 'medium': 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: Clock, 
          label: 'متوسطة' 
        };
      case 'high': 
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          icon: AlertTriangle, 
          label: 'عالية' 
        };
      case 'urgent': 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          icon: Zap, 
          label: 'عاجلة' 
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Clock, 
          label: 'متوسطة' 
        };
    }
  };

  // ألوان الحالة
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': 
        return { 
          color: 'bg-blue-100 text-blue-800', 
          label: 'في الانتظار' 
        };
      case 'in-progress': 
        return { 
          color: 'bg-yellow-100 text-yellow-800', 
          label: 'قيد التنفيذ' 
        };
      case 'completed': 
        return { 
          color: 'bg-green-100 text-green-800', 
          label: 'مكتمل' 
        };
      case 'cancelled': 
        return { 
          color: 'bg-red-100 text-red-800', 
          label: 'ملغي' 
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800', 
          label: 'غير محدد' 
        };
    }
  };

  const priorityConfig = getPriorityConfig(reminder.priority);
  const statusConfig = getStatusConfig(reminder.status);
  const PriorityIcon = priorityConfig.icon;

  // تحديد ما إذا كان التذكير متأخر
  const isOverdue = reminder.dueDate && new Date(reminder.dueDate) < new Date() && reminder.status !== 'completed';
  const timeLeft = reminder.dueDate ? new Date(reminder.dueDate) - new Date() : null;
  const daysLeft = timeLeft ? Math.ceil(timeLeft / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className={`
          p-6 text-white
          ${isOverdue 
            ? 'bg-gradient-to-r from-red-600 to-red-700' 
            : reminder.priority === 'urgent'
              ? 'bg-gradient-to-r from-red-500 to-pink-600'
              : reminder.priority === 'high'
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600'
          }
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                {getTypeIcon(reminder.type)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{reminder.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30">
                    {getTypeLabel(reminder.type)}
                  </Badge>
                  {isOverdue && (
                    <Badge className="bg-red-900/50 text-red-100 border-red-300/50">
                      ⚠️ متأخر
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 h-10 w-10 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* معلومات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70">الأولوية</div>
              <div className="flex items-center gap-1 mt-1">
                <PriorityIcon className="h-4 w-4" />
                <span className="font-medium">{priorityConfig.label}</span>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70">الحالة</div>
              <div className="font-medium mt-1">{statusConfig.label}</div>
            </div>
            
            {daysLeft !== null && (
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-white/70">المتبقي</div>
                <div className="font-medium mt-1">
                  {isOverdue 
                    ? `متأخر ${Math.abs(daysLeft)} يوم` 
                    : daysLeft === 0 
                      ? 'اليوم' 
                      : `${daysLeft} يوم`
                  }
                </div>
              </div>
            )}
            
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-white/70">المسؤول</div>
              <div className="font-medium mt-1 truncate">{reminder.assignedToName || 'غير محدد'}</div>
            </div>
          </div>
        </div>

        {/* محتوى المودال */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* الوصف */}
            {reminder.description && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">الوصف</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-blue-500">
                  <p className="text-gray-700 leading-relaxed">{reminder.description}</p>
                </div>
              </div>
            )}

            {/* التاريخ والوقت */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">الموعد المحدد</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">التاريخ والوقت</div>
                  <div className="font-medium text-gray-900">
                    {reminder.dueDate ? new Date(reminder.dueDate).toLocaleString('ar-EG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'لا يوجد تاريخ'}
                  </div>
                </div>
                
                {reminder.reminderTime && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">وقت التذكير</div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-500" />
                      {new Date(reminder.reminderTime).toLocaleString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* معلومات العميل */}
            {(reminder.clientName || reminder.phone || reminder.location) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">معلومات العميل</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reminder.clientName && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">اسم العميل</div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        {reminder.clientName}
                      </div>
                    </div>
                  )}
                  
                  {reminder.phone && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">رقم الهاتف</div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <a href={`tel:${reminder.phone}`} className="text-blue-600 hover:underline">
                          {reminder.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
                
                {reminder.location && (
                  <div className="bg-gray-50 rounded-lg p-4 mt-4">
                    <div className="text-sm text-gray-600 mb-1">الموقع</div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      {reminder.location}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* معلومات إضافية */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">تفاصيل إضافية</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">تم الإشعار</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {reminder.notified ? '✅ نعم' : '❌ لا'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">تاريخ الإنشاء</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {reminder.createdAt ? new Date(reminder.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">المنشئ</div>
                  <div className="font-medium text-gray-900 mt-1">
                    {reminder.createdByName || 'غير محدد'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer مع الأزرار */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            {reminder.status !== 'completed' && (
              <Button 
                onClick={() => onComplete && onComplete(reminder)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                إنهاء التذكير
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              إغلاق
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onEdit && onEdit(reminder)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              تعديل
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onDelete && onDelete(reminder)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              حذف
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

