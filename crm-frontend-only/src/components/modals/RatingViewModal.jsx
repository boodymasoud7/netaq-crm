import { useState } from 'react'
import { 
  X, 
  Star, 
  Target,
  TrendingUp,
  Award,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const RatingViewModal = ({ 
  isOpen, 
  onClose, 
  lead
}) => {
  if (!isOpen || !lead) return null

  // حساب التقييم الإجمالي
  const overallScore = parseInt(lead.score) || 0
  
  // تفاصيل التقييم
  const ratingBreakdown = {
    interest: lead.interest === 'عالي' ? 25 : lead.interest === 'متوسط' ? 15 : 10,
    budget: lead.clientType === 'مؤسسة' ? 25 : 15,
    contact: lead.phone && lead.email ? 20 : lead.phone || lead.email ? 10 : 0,
    location: lead.location ? 15 : 0,
    source: lead.source === 'مرجع' ? 15 : lead.source === 'موقع' ? 10 : 5
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'ممتاز'
    if (score >= 60) return 'جيد'
    if (score >= 40) return 'متوسط'
    return 'ضعيف'
  }

  const getRatingIcon = (score) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (score >= 60) return <Star className="h-5 w-5 text-yellow-600" />
    if (score >= 40) return <Activity className="h-5 w-5 text-orange-600" />
    return <AlertCircle className="h-5 w-5 text-red-600" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">تقييم العميل المحتمل</h3>
                <p className="text-blue-100 text-sm">{lead.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-160px)] overflow-y-auto">
          {/* Overall Score */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreColor(overallScore)} mb-4`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{overallScore}</div>
                <div className="text-xs">نقطة</div>
              </div>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              التقييم الإجمالي: {getScoreLabel(overallScore)}
            </h4>
            <div className="flex items-center justify-center gap-2">
              {getRatingIcon(overallScore)}
              <span className="text-sm text-gray-600">
                {overallScore >= 80 ? 'عميل عالي الجودة - جاهز للتحويل' :
                 overallScore >= 60 ? 'عميل جيد - يحتاج متابعة' :
                 overallScore >= 40 ? 'عميل متوسط - يحتاج تطوير' :
                 'عميل ضعيف - يحتاج عمل إضافي'}
              </span>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-4 mb-6">
            <h5 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              تفاصيل التقييم
            </h5>
            
            <div className="grid gap-3">
              {/* Interest Level */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">مستوى الاهتمام</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lead.interest || 'غير محدد'}</Badge>
                  <span className="text-sm font-bold text-blue-600">{ratingBreakdown.interest} نقطة</span>
                </div>
              </div>

              {/* Budget/Client Type */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">نوع العميل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lead.clientType || 'غير محدد'}</Badge>
                  <span className="text-sm font-bold text-blue-600">{ratingBreakdown.budget} نقطة</span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">بيانات التواصل</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {lead.phone && <Badge variant="secondary" className="text-xs">هاتف</Badge>}
                    {lead.email && <Badge variant="secondary" className="text-xs">إيميل</Badge>}
                  </div>
                  <span className="text-sm font-bold text-blue-600">{ratingBreakdown.contact} نقطة</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">الموقع</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lead.location || 'غير محدد'}</Badge>
                  <span className="text-sm font-bold text-blue-600">{ratingBreakdown.location} نقطة</span>
                </div>
              </div>

              {/* Source */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">مصدر العميل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{lead.source || 'غير محدد'}</Badge>
                  <span className="text-sm font-bold text-blue-600">{ratingBreakdown.source} نقطة</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Information Summary */}
          <div className="border-t pt-4">
            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              معلومات العميل
            </h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">الاسم:</span>
                <p className="font-medium">{lead.name}</p>
              </div>
              <div>
                <span className="text-gray-500">الهاتف:</span>
                <p className="font-medium">{lead.phone || 'غير متوفر'}</p>
              </div>
              <div>
                <span className="text-gray-500">الإيميل:</span>
                <p className="font-medium">{lead.email || 'غير متوفر'}</p>
              </div>
              <div>
                <span className="text-gray-500">تاريخ الإنشاء:</span>
                <p className="font-medium">
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('ar-EG') : 'غير متوفر'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            آخر تحديث: {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('ar-EG') : 'غير متوفر'}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <TrendingUp className="h-4 w-4 mr-2" />
              تحديث التقييم
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RatingViewModal







