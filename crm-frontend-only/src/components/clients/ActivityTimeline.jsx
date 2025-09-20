import { useState } from 'react'
import { 
  Phone, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowRight,
  Plus
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import AddInteractionModal from '../interactions/AddInteractionModal'

const ActivityTimeline = ({ 
  interactions = [], 
  clientId, 
  clientName = "العميل",
  itemType = 'client',  // Default to 'client' for backward compatibility
  onAddInteraction,
  showAddButton = true
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const getInteractionIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      case 'visit':
        return <MapPin className="h-4 w-4" />
      case 'conversion':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getInteractionColor = (type) => {
    switch (type) {
      case 'call':
        return 'from-green-500 to-emerald-600'
      case 'whatsapp':
        return 'from-green-600 to-green-700'
      case 'meeting':
        return 'from-blue-500 to-blue-600'
      case 'visit':
        return 'from-purple-500 to-purple-600'
      case 'conversion':
        return 'from-yellow-500 to-orange-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getOutcomeIcon = (outcome) => {
    switch (outcome) {
      case 'excellent':
        return <Star className="h-3 w-3 text-yellow-500" />
      case 'positive':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'neutral':
        return <Clock className="h-3 w-3 text-gray-500" />
      case 'negative':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  const getOutcomeText = (outcome) => {
    switch (outcome) {
      case 'excellent': return 'ممتاز'
      case 'positive': return 'إيجابي'
      case 'neutral': return 'محايد'
      case 'negative': return 'سلبي'
      default: return ''
    }
  }

  const handleAddInteraction = async (interactionData) => {
    if (onAddInteraction) {
      await onAddInteraction(interactionData)
    }
    console.log('تفاعل جديد:', interactionData)
  }

  console.log('🔍 ActivityTimeline DEBUG:', {
    interactions,
    clientId,
    interactionsCount: interactions.length
  })
  
  const clientInteractions = interactions.filter(int => 
    int.itemId === clientId || int.itemId === String(clientId) || int.clientId === clientId
  )
  console.log('📋 Filtered interactions:', clientInteractions)
  
  const sortedInteractions = clientInteractions.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))

  if (sortedInteractions.length === 0) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">خط زمني للتفاعلات</h3>
              <p className="text-sm text-gray-600">جميع التفاعلات والأنشطة مع العميل</p>
            </div>
          </div>
          {showAddButton && (
            <Button 
              size="sm" 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة تفاعل
            </Button>
          )}
        </div>

        {/* Empty State */}
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تفاعلات حتى الآن</h3>
          <p className="text-gray-500 mb-4">ابدأ بإضافة أول تفاعل مع هذا العميل</p>
          {showAddButton && (
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة تفاعل جديد
            </Button>
          )}
        </div>

        {/* Add Interaction Modal */}
        <AddInteractionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          clientName={clientName}
          clientId={clientId}
          itemType={itemType}
          onAddInteraction={handleAddInteraction}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">خط زمني للتفاعلات</h3>
            <p className="text-sm text-gray-600">جميع التفاعلات والأنشطة مع العميل</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {sortedInteractions.length} تفاعل
          </Badge>
          {showAddButton && (
            <Button 
              size="sm" 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 ml-1" />
              إضافة تفاعل
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* الخط الزمني */}
        <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-green-200 to-purple-200"></div>

        {sortedInteractions.map((interaction, index) => (
          <div key={interaction.id} className="relative flex items-start gap-4 pb-6">
            {/* الأيقونة */}
            <div className={`relative z-10 w-12 h-12 bg-gradient-to-r ${getInteractionColor(interaction.type)} rounded-full flex items-center justify-center text-white shadow-lg`}>
              {getInteractionIcon(interaction.type)}
            </div>

            {/* المحتوى */}
            <div className="flex-1 min-w-0">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* الرأس */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{interaction.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{interaction.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatDateArabic(interaction.createdAt || interaction.date)}
                  </div>
                </div>

                {/* التفاصيل */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* الموظف */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {(interaction.createdByName || interaction.employeeName)?.charAt(0) || 'م'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{interaction.createdByName || interaction.employeeName}</span>
                  </div>

                  {/* المدة (إذا كانت متاحة) */}
                  {interaction.duration && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{interaction.duration} دقيقة</span>
                    </div>
                  )}

                  {/* النتيجة */}
                  {interaction.outcome && (
                    <div className="flex items-center gap-2">
                      {getOutcomeIcon(interaction.outcome)}
                      <span className="text-sm text-gray-700">{getOutcomeText(interaction.outcome)}</span>
                    </div>
                  )}

                  {/* الإجراء التالي */}
                  {interaction.nextAction && (
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-700">{interaction.nextAction}</span>
                    </div>
                  )}
                </div>

                {/* الملاحظات */}
                {interaction.notes && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <p className="text-sm text-gray-700">{interaction.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* إحصائيات سريعة */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 mt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">إحصائيات التفاعل</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {sortedInteractions.filter(i => i.type === 'call').length}
            </div>
            <div className="text-xs text-gray-600">مكالمة</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {sortedInteractions.filter(i => i.type === 'whatsapp').length}
            </div>
            <div className="text-xs text-gray-600">رسالة</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {sortedInteractions.filter(i => i.type === 'meeting').length}
            </div>
            <div className="text-xs text-gray-600">اجتماع</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {sortedInteractions.filter(i => i.type === 'visit').length}
            </div>
            <div className="text-xs text-gray-600">زيارة</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {sortedInteractions.filter(i => i.type === 'conversion').length}
            </div>
            <div className="text-xs text-gray-600">تحويل</div>
          </div>
        </div>
      </div>

      {/* Add Interaction Modal */}
      <AddInteractionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        clientName={clientName}
        clientId={clientId}
        itemType={itemType}
        onAddInteraction={handleAddInteraction}
      />
    </div>
  )
}

export default ActivityTimeline
