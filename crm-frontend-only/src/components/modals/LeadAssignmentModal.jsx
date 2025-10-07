import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { 
  X, 
  User, 
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Star,
  UserCheck,
  Calendar,
  Target,
  ArrowRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeadAssignmentModal({ 
  isOpen, 
  onClose, 
  selectedLeads = [], 
  salesUsers = [],
  onAssignLeads 
}) {
  const [selectedSalesUser, setSelectedSalesUser] = useState('')
  const [notes, setNotes] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // إعادة تعيين النموذج عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setSelectedSalesUser('')
      setNotes('')
      setIsAssigning(false)
    }
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedSalesUser) {
      toast.error('يرجى اختيار موظف المبيعات')
      return
    }

    if (selectedLeads.length === 0) {
      toast.error('لا يوجد عملاء محتملين محددين')
      return
    }

    setIsAssigning(true)
    try {
      await onAssignLeads(selectedLeads, selectedSalesUser, notes)
      toast.success(`تم توزيع ${selectedLeads.length} عميل محتمل بنجاح`)
      onClose()
    } catch (error) {
      console.error('خطأ في توزيع العملاء المحتملين:', error)
      toast.error('فشل في توزيع العملاء المحتملين')
    } finally {
      setIsAssigning(false)
    }
  }

  const getSelectedUser = () => {
    return salesUsers.find(user => user.id === selectedSalesUser)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">توزيع العملاء المحتملين</h2>
                <p className="text-blue-100 text-sm">
                  اختر موظف المبيعات لتوزيع {selectedLeads.length} عميل محتمل
                </p>
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

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          
          {/* العملاء المحتملين المحددين */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              العملاء المحتملين المحددين ({selectedLeads.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {selectedLeads.map((lead) => (
                <Card key={lead.id} className="border border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{lead.name}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {lead.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{lead.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant={
                            lead.status === 'hot' ? 'destructive' :
                            lead.status === 'warm' ? 'default' :
                            'secondary'
                          }
                        >
                          {lead.status === 'hot' ? 'ساخن' :
                           lead.status === 'warm' ? 'دافئ' :
                           lead.status === 'cold' ? 'بارد' : lead.status}
                        </Badge>
                        {lead.score && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-gray-600">{lead.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* اختيار موظف المبيعات */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              اختيار موظف المبيعات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {salesUsers.map((user) => (
                <Card 
                  key={user.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedSalesUser === user.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedSalesUser(user.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedSalesUser === user.id 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-blue-600">
                            {user.leadsCount || 0} عميل محتمل
                          </span>
                          <span className="text-xs text-green-600">
                            {user.salesCount || 0} مبيعة
                          </span>
                        </div>
                      </div>
                      {selectedSalesUser === user.id && (
                        <UserCheck className="h-5 w-5 text-blue-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ملاحظات إضافية */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              ملاحظات إضافية (اختياري)
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أضف أي ملاحظات أو تعليمات خاصة بالتوزيع..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* ملخص التوزيع */}
          {selectedSalesUser && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                ملخص التوزيع
              </h4>
              <div className="text-green-800">
                سيتم توزيع <span className="font-bold">{selectedLeads.length}</span> عميل محتمل 
                على <span className="font-bold">{getSelectedUser()?.name}</span>
                {notes && <div className="mt-2 text-sm">الملاحظات: {notes}</div>}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedLeads.length} عميل محتمل محدد للتوزيع
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isAssigning}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleAssign}
                disabled={!selectedSalesUser || isAssigning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    جاري التوزيع...
                  </>
                ) : (
                  <>
                    <Target className="h-4 w-4 mr-2" />
                    توزيع العملاء المحتملين
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}







