import { useState } from 'react'
import { 
  Star, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Award,
  Target,
  BarChart,
  Save,
  Edit,
  X
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import toast from 'react-hot-toast'

const ClientRating = ({ client, onUpdateRating }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [newRating, setNewRating] = useState(parseFloat(client?.rating) || 0)
  const [newLeadScore, setNewLeadScore] = useState(parseInt(client?.leadScore) || 0)

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-500'
    if (rating >= 3.5) return 'text-yellow-500'
    if (rating >= 2.5) return 'text-orange-500'
    return 'text-red-500'
  }

  const getRatingText = (rating) => {
    if (rating >= 4.5) return 'عميل ممتاز'
    if (rating >= 3.5) return 'عميل جيد'
    if (rating >= 2.5) return 'عميل متوسط'
    if (rating >= 1.5) return 'عميل ضعيف'
    return 'يحتاج متابعة'
  }

  const getLeadScoreColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    if (score >= 40) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-red-600'
  }

  const getLeadScoreText = (score) => {
    if (score >= 80) return 'عميل محتمل عالي'
    if (score >= 60) return 'عميل محتمل متوسط'
    if (score >= 40) return 'عميل محتمل منخفض'
    return 'يحتاج تطوير'
  }

  const getScoreIcon = (score) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4" />
    if (score >= 60) return <Minus className="h-4 w-4" />
    return <TrendingDown className="h-4 w-4" />
  }

  const handleSaveRating = () => {
    if (onUpdateRating) {
      onUpdateRating(client.id, {
        rating: newRating,
        leadScore: newLeadScore
      })
    }
    setIsEditing(false)
    toast.success('تم تحديث التقييم بنجاح')
  }

  const renderStars = (rating, size = 'normal', interactive = false) => {
    const starSize = size === 'large' ? 'h-6 w-6' : 'h-4 w-4'
    const stars = []
    
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= Math.floor(rating)
      const isHalfFilled = i === Math.floor(rating) + 1 && rating % 1 >= 0.5
      
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setNewRating(i)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform duration-200`}
        >
          <Star
            className={`${starSize} ${
              isFilled || isHalfFilled 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        </button>
      )
    }
    
    return <div className="flex items-center gap-1">{stars}</div>
  }

  const renderScoreBar = (score, interactive = false) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">نقاط العميل المحتمل</span>
          <span className="text-sm font-semibold text-gray-900">{score}/100</span>
        </div>
        
        {interactive ? (
          <input
            type="range"
            min="0"
            max="100"
            value={newLeadScore}
            onChange={(e) => setNewLeadScore(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f97316 25%, #eab308 50%, #22c55e 75%, #10b981 100%)`
            }}
          />
        ) : (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${getLeadScoreColor(score)} transition-all duration-500`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Award className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">تقييم العميل</h3>
            <p className="text-sm text-gray-600">تقييم جودة العميل واحتمالية التحويل</p>
          </div>
        </div>
        
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 ml-2" />
            تعديل التقييم
          </Button>
        )}
      </div>

      {/* كروت التقييم */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* تقييم العميل */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-5 w-5 text-yellow-500" />
            <h4 className="text-base font-semibold text-gray-900">تقييم العميل</h4>
          </div>
          
          <div className="space-y-4">
            {/* النجوم */}
            <div className="flex items-center justify-between">
              {renderStars(isEditing ? newRating : parseFloat(client?.rating) || 0, 'large', isEditing)}
              <div className="text-right">
                <div className={`text-2xl font-bold ${getRatingColor(isEditing ? newRating : parseFloat(client?.rating) || 0)}`}>
                  {(isEditing ? newRating : parseFloat(client?.rating) || 0).toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">من 5.0</div>
              </div>
            </div>
            
            {/* وصف التقييم */}
            <div className="text-center">
              <Badge className={`${getRatingColor(isEditing ? newRating : client?.rating || 0)} bg-opacity-10 border-current`}>
                {getRatingText(isEditing ? newRating : client?.rating || 0)}
              </Badge>
            </div>
          </div>
        </div>

        {/* نقاط العميل المحتمل */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-5 w-5 text-blue-500" />
            <h4 className="text-base font-semibold text-gray-900">نقاط العميل المحتمل</h4>
          </div>
          
          <div className="space-y-4">
            {/* شريط النقاط */}
            {renderScoreBar(isEditing ? newLeadScore : parseInt(client?.leadScore) || 0, isEditing)}
            
            {/* وصف النقاط */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-full bg-gradient-to-r ${getLeadScoreColor(isEditing ? newLeadScore : parseInt(client?.leadScore) || 0)}`}>
                  <div className="text-white">
                    {getScoreIcon(isEditing ? newLeadScore : parseInt(client?.leadScore) || 0)}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {getLeadScoreText(isEditing ? newLeadScore : parseInt(client?.leadScore) || 0)}
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {isEditing ? newLeadScore : parseInt(client?.leadScore) || 0}
                </div>
                <div className="text-xs text-gray-500">من 100</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* أزرار التحكم في وضع التعديل */}
      {isEditing && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Button
            onClick={handleSaveRating}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
          >
            <Save className="h-4 w-4 ml-2" />
            حفظ التقييم
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false)
              setNewRating(parseFloat(client?.rating) || 0)
              setNewLeadScore(parseInt(client?.leadScore) || 0)
            }}
          >
            <X className="h-4 w-4 ml-2" />
            إلغاء
          </Button>
        </div>
      )}

      {/* معايير التقييم */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <BarChart className="h-5 w-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">معايير التقييم</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">تقييم العميل (النجوم):</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• جودة التواصل والاستجابة</li>
              <li>• الالتزام بالمواعيد والاتفاقيات</li>
              <li>• وضوح المتطلبات والأهداف</li>
              <li>• إمكانية الدفع والجدية</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">نقاط العميل المحتمل:</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• مستوى الاهتمام والتفاعل</li>
              <li>• الميزانية المتاحة</li>
              <li>• التوقيت المناسب للشراء</li>
              <li>• مطابقة المتطلبات للعروض المتاحة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientRating



