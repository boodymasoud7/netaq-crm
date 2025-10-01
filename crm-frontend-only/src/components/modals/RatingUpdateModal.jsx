import { useState } from 'react'
import { 
  X, 
  Star, 
  Target,
  TrendingUp,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import toast from 'react-hot-toast'

const RatingUpdateModal = ({ 
  isOpen, 
  onClose, 
  lead,
  onUpdateRating
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ratingData, setRatingData] = useState({
    interest: lead?.interest || 'متوسط',
    clientType: lead?.clientType || 'فردي',
    budget: lead?.budget || 0,
    source: lead?.source || 'أخرى',
    notes: ''
  })

  if (!isOpen || !lead) return null

  const interestOptions = [
    { value: 'عالي', label: 'عالي', points: 25, color: 'bg-green-100 text-green-800' },
    { value: 'متوسط', label: 'متوسط', points: 15, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'منخفض', label: 'منخفض', points: 10, color: 'bg-red-100 text-red-800' }
  ]

  const clientTypeOptions = [
    { value: 'مؤسسة', label: 'مؤسسة', points: 25, color: 'bg-purple-100 text-purple-800' },
    { value: 'استثماري', label: 'استثماري', points: 20, color: 'bg-blue-100 text-blue-800' },
    { value: 'فردي', label: 'فردي', points: 15, color: 'bg-gray-100 text-gray-800' }
  ]

  const sourceOptions = [
    { value: 'مرجع', label: 'مرجع', points: 15, color: 'bg-emerald-100 text-emerald-800' },
    { value: 'موقع', label: 'موقع إلكتروني', points: 10, color: 'bg-blue-100 text-blue-800' },
    { value: 'إعلان', label: 'إعلان', points: 8, color: 'bg-orange-100 text-orange-800' },
    { value: 'أخرى', label: 'أخرى', points: 5, color: 'bg-gray-100 text-gray-800' }
  ]

  // حساب النقاط الجديدة
  const calculateNewScore = () => {
    const interestPoints = interestOptions.find(opt => opt.value === ratingData.interest)?.points || 0
    const clientTypePoints = clientTypeOptions.find(opt => opt.value === ratingData.clientType)?.points || 0
    const sourcePoints = sourceOptions.find(opt => opt.value === ratingData.source)?.points || 0
    
    // نقاط إضافية
    const contactPoints = (lead.phone && lead.email) ? 20 : (lead.phone || lead.email) ? 10 : 0
    const locationPoints = lead.location ? 15 : 0
    const budgetPoints = ratingData.budget > 1000000 ? 15 : ratingData.budget > 500000 ? 10 : 5

    return interestPoints + clientTypePoints + sourcePoints + contactPoints + locationPoints + budgetPoints
  }

  const newScore = calculateNewScore()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedLead = {
        ...lead,
        interest: ratingData.interest,
        clientType: ratingData.clientType,
        budget: ratingData.budget,
        source: ratingData.source,
        score: newScore,
        updatedAt: new Date().toISOString()
      }

      await onUpdateRating(updatedLead)
      
      toast.success(`تم تحديث تقييم ${lead.name} بنجاح!`)
      onClose()
    } catch (error) {
      console.error('خطأ في تحديث التقييم:', error)
      toast.error('فشل في تحديث التقييم')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetToDefaults = () => {
    setRatingData({
      interest: 'متوسط',
      clientType: 'فردي',
      budget: 0,
      source: 'أخرى',
      notes: ''
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-700 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">تحديث تقييم العميل</h3>
                <p className="text-orange-100 text-sm">{lead.name}</p>
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
        <form onSubmit={handleSubmit} className="max-h-[calc(90vh-160px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Current vs New Score */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-2">التقييم الحالي</h4>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(lead.score || 0)} mb-2`}>
                  <span className="text-lg font-bold">{lead.score || 0}</span>
                </div>
                <p className="text-sm text-gray-600">{getScoreLabel(lead.score || 0)}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
                <h4 className="text-sm font-medium text-gray-600 mb-2">التقييم الجديد</h4>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(newScore)} mb-2`}>
                  <span className="text-lg font-bold">{newScore}</span>
                </div>
                <p className="text-sm text-gray-600">{getScoreLabel(newScore)}</p>
              </div>
            </div>

            {/* Interest Level */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                مستوى الاهتمام
              </label>
              <div className="grid grid-cols-3 gap-3">
                {interestOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRatingData(prev => ({ ...prev, interest: option.value }))}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      ratingData.interest === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`inline-block px-2 py-1 rounded mb-1 ${option.color}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600">{option.points} نقطة</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Client Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                نوع العميل
              </label>
              <div className="grid grid-cols-3 gap-3">
                {clientTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRatingData(prev => ({ ...prev, clientType: option.value }))}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      ratingData.clientType === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`inline-block px-2 py-1 rounded mb-1 ${option.color}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600">{option.points} نقطة</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                الميزانية المتوقعة (جنيه)
              </label>
              <Input
                type="number"
                value={ratingData.budget}
                onChange={(e) => setRatingData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                placeholder="مثال: 1000000"
                className="w-full"
              />
              <p className="text-xs text-gray-600 mt-1">
                أكثر من مليون: 15 نقطة | 500 ألف - مليون: 10 نقاط | أقل من 500 ألف: 5 نقاط
              </p>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                مصدر العميل
              </label>
              <div className="grid grid-cols-2 gap-3">
                {sourceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRatingData(prev => ({ ...prev, source: option.value }))}
                    className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                      ratingData.source === option.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`inline-block px-2 py-1 rounded mb-1 ${option.color}`}>
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600">{option.points} نقطة</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                ملاحظات التحديث
              </label>
              <textarea
                value={ratingData.notes}
                onChange={(e) => setRatingData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                placeholder="أسباب تحديث التقييم أو ملاحظات إضافية..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetToDefaults}
                className="text-sm"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                إعادة تعيين
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    حفظ التقييم
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default RatingUpdateModal







