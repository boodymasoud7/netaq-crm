import { useState } from 'react'
import { 
  User, 
  Users, 
  Edit, 
  Save, 
  X, 
  Clock,
  Calendar,
  Award,
  Phone,
  MessageSquare,
  BarChart,
  TrendingUp
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { formatDateArabic } from '../../lib/utils'
import toast from 'react-hot-toast'

const EmployeeAssignment = ({ client, employees = [], onUpdateAssignment }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(client?.assignedTo || '')

  // بيانات وهمية للموظفين إذا لم تكن متوفرة
  const mockEmployees = [
    {
      id: 'user1',
      name: 'مصطفى أحمد',
      role: 'مدير مبيعات',
      performance: 95,
      activeClients: 12,
      completedDeals: 8,
      phone: '01234567890',
      avatar: null
    },
    {
      id: 'user2',
      name: 'سمر علي',
      role: 'موظف مبيعات',
      performance: 88,
      activeClients: 8,
      completedDeals: 5,
      phone: '01123456789',
      avatar: null
    },
    {
      id: 'user3',
      name: 'أمير محمد',
      role: 'موظف مبيعات',
      performance: 92,
      activeClients: 10,
      completedDeals: 7,
      phone: '01012345678',
      avatar: null
    },
    {
      id: 'user4',
      name: 'فاطمة محمد',
      role: 'موظف مبيعات',
      performance: 85,
      activeClients: 6,
      completedDeals: 4,
      phone: '01098765432',
      avatar: null
    },
    {
      id: 'user5',
      name: 'يوسف علي',
      role: 'موظف مبيعات',
      performance: 90,
      activeClients: 9,
      completedDeals: 6,
      phone: '01187654321',
      avatar: null
    }
  ]

  const employeesList = employees.length > 0 ? employees : []
  const currentEmployee = employeesList.find(emp => emp.id === (client?.assignedTo || selectedEmployee))

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return 'text-green-500'
    if (performance >= 80) return 'text-yellow-500'
    if (performance >= 70) return 'text-orange-500'
    return 'text-red-500'
  }

  const getPerformanceBadge = (performance) => {
    if (performance >= 90) return 'bg-green-100 text-green-800'
    if (performance >= 80) return 'bg-yellow-100 text-yellow-800'
    if (performance >= 70) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getPerformanceText = (performance) => {
    if (performance >= 90) return 'ممتاز'
    if (performance >= 80) return 'جيد جداً'
    if (performance >= 70) return 'جيد'
    return 'يحتاج تحسين'
  }

  const handleSaveAssignment = () => {
    if (!selectedEmployee) {
      toast.error('يرجى اختيار موظف')
      return
    }

    const selectedEmp = employeesList.find(emp => emp.id === selectedEmployee)
    
    if (onUpdateAssignment) {
      onUpdateAssignment(client.id, {
        assignedTo: selectedEmployee,
        assignedToName: selectedEmp?.name || 'غير محدد',
        assignedAt: new Date()
      })
    }
    
    setIsEditing(false)
    toast.success('تم تحديث تخصيص الموظف بنجاح')
  }

  return (
    <div className="space-y-6">
      {/* رأس القسم */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">الموظف المسؤول</h3>
            <p className="text-sm text-gray-600">إدارة تخصيص العميل للموظفين</p>
          </div>
        </div>
        
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 ml-2" />
            تغيير المسؤول
          </Button>
        )}
      </div>

      {/* معلومات الموظف الحالي */}
      {currentEmployee && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {/* صورة الموظف */}
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {currentEmployee.name?.charAt(0) || 'م'}
            </div>

            {/* معلومات الموظف */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-xl font-bold text-gray-900">{currentEmployee.name}</h4>
                <Badge className="bg-blue-100 text-blue-800">
                  <User className="h-3 w-3 ml-1" />
                  {currentEmployee.role}
                </Badge>
                <Badge className={getPerformanceBadge(currentEmployee.performance)}>
                  <Award className="h-3 w-3 ml-1" />
                  {getPerformanceText(currentEmployee.performance)}
                </Badge>
              </div>

              {/* إحصائيات الموظف */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-lg font-bold ${getPerformanceColor(currentEmployee.performance)}`}>
                    {currentEmployee.performance}%
                  </div>
                  <div className="text-xs text-gray-600">معدل الأداء</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{currentEmployee.activeClients}</div>
                  <div className="text-xs text-gray-600">عملاء نشطين</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{currentEmployee.completedDeals}</div>
                  <div className="text-xs text-gray-600">صفقات مكتملة</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {Math.round((currentEmployee.completedDeals / currentEmployee.activeClients) * 100) || 0}%
                  </div>
                  <div className="text-xs text-gray-600">معدل التحويل</div>
                </div>
              </div>

              {/* معلومات الاتصال */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>{currentEmployee.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>تم التخصيص: {formatDateArabic(client?.assignedAt || client?.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* أزرار التواصل السريع */}
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Phone className="h-4 w-4 ml-2" />
                اتصال
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <MessageSquare className="h-4 w-4 ml-2" />
                واتساب
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* قائمة الموظفين للاختيار (في وضع التعديل) */}
      {isEditing && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">اختيار موظف جديد</h4>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {employeesList.map((employee) => (
              <div
                key={employee.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedEmployee === employee.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setSelectedEmployee(employee.id)}
              >
                <div className="flex items-center gap-4">
                  {/* صورة الموظف */}
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {employee.name?.charAt(0) || 'م'}
                  </div>

                  {/* معلومات الموظف */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h5 className="font-semibold text-gray-900">{employee.name}</h5>
                      <Badge className="bg-gray-100 text-gray-800 text-xs">
                        {employee.role}
                      </Badge>
                      <Badge className={`${getPerformanceBadge(employee.performance)} text-xs`}>
                        {employee.performance}%
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>عملاء: {employee.activeClients}</span>
                      <span>صفقات: {employee.completedDeals}</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {Math.round((employee.completedDeals / employee.activeClients) * 100) || 0}%
                      </span>
                    </div>
                  </div>

                  {/* مؤشر الاختيار */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedEmployee === employee.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedEmployee === employee.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* أزرار التحكم */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t">
            <Button
              onClick={handleSaveAssignment}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <Save className="h-4 w-4 ml-2" />
              حفظ التخصيص
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setSelectedEmployee(client?.assignedTo || '')
              }}
            >
              <X className="h-4 w-4 ml-2" />
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {/* إحصائيات الأداء */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <BarChart className="h-5 w-5 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">إحصائيات الفريق</h4>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{employeesList.length}</div>
            <div className="text-xs text-gray-600">إجمالي الموظفين</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.round(employeesList.reduce((sum, emp) => sum + emp.performance, 0) / employeesList.length)}%
            </div>
            <div className="text-xs text-gray-600">متوسط الأداء</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {employeesList.reduce((sum, emp) => sum + emp.activeClients, 0)}
            </div>
            <div className="text-xs text-gray-600">إجمالي العملاء</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {employeesList.reduce((sum, emp) => sum + emp.completedDeals, 0)}
            </div>
            <div className="text-xs text-gray-600">إجمالي الصفقات</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeAssignment



