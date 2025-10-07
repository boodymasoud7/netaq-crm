import React, { useState } from 'react'
import { 
  NotesButton,
  InteractionsButton,
  TaskButton,
  EditButton, 
  DeleteButton,
  ViewButton,
  ActionDropdown
} from '../actions/ActionButtons'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { formatDateArabic, formatCurrency } from '../../lib/utils'
import { 
  Building2, 
  MapPin, 
  Calendar,
  DollarSign,
  Users,
  Home,
  Eye,
  Share,
  FileText,
  BarChart3,
  Settings,
  Star,
  Search,
  Filter,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProjectsTable({ 
  projects, 
  onEdit, 
  onDelete, 
  onView,
  onReminder,
  onAddNote,
  onAddTask,
  onViewUnits,
  onViewSales,
  onGenerateReport,
  canEditProject,
  canDeleteProject
}) {
  const [selectedProjects, setSelectedProjects] = useState([])

  // عرض الوحدات
  const viewUnits = (project) => {
    onViewUnits?.(project)
    toast.success(`عرض وحدات ${project.name}`)
  }

  // عرض المبيعات
  const viewSales = (project) => {
    onViewSales?.(project)
    toast.success(`عرض مبيعات ${project.name}`)
  }

  // مشاركة المشروع
  const shareProject = (project) => {
    const projectUrl = `${window.location.origin}/projects/${project.id}`
    navigator.clipboard.writeText(projectUrl)
    toast.success('تم نسخ رابط المشروع')
  }

  // تقرير المشروع
  const generateReport = (project) => {
    onGenerateReport?.(project)
    toast.success(`جاري إنشاء تقرير ${project.name}`)
  }

  // إضافة للمفضلة
  const addToFavorites = (project) => {
    toast.success(`تم إضافة ${project.name} للمفضلة`)
  }

  // إجراءات إضافية لكل مشروع
  const getAdditionalActions = (project) => [
    {
      icon: Home,
      label: 'عرض الوحدات',
      onClick: () => viewUnits(project),
      color: 'text-blue-600'
    },
    {
      icon: BarChart3,
      label: 'عرض المبيعات',
      onClick: () => viewSales(project),
      color: 'text-green-600'
    },
    {
      icon: Share,
      label: 'مشاركة المشروع',
      onClick: () => shareProject(project),
      color: 'text-purple-600'
    },
    {
      icon: FileText,
      label: 'تقرير المشروع',
      onClick: () => generateReport(project),
      color: 'text-orange-600'
    },
    {
      icon: Star,
      label: 'إضافة للمفضلة',
      onClick: () => addToFavorites(project),
      color: 'text-yellow-600'
    }
  ]

  // ألوان الحالات
  const getStatusColor = (status) => {
    const colors = {
      'تخطيط': 'bg-blue-100 text-blue-800',
      'تطوير': 'bg-yellow-100 text-yellow-800',
      'تسويق': 'bg-green-100 text-green-800',
      'مكتمل': 'bg-emerald-100 text-emerald-800',
      'متوقف': 'bg-red-100 text-red-800',
      'مؤجل': 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  // حساب نسبة المبيعات
  const getSalesPercentage = (soldUnits, totalUnits) => {
    if (!totalUnits || totalUnits === 0) return 0
    return Math.round((soldUnits / totalUnits) * 100)
  }

  // لون نسبة المبيعات
  const getSalesColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100'
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100'
    if (percentage >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-8 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مشاريع</h3>
        <p className="text-gray-600">ابدأ بإضافة أول مشروع لك</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 shadow-lg bg-white overflow-hidden">
      {/* Table Header with Integrated Search - نفس تصميم المطورين */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-blue-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">قائمة المشاريع</h3>
              <p className="text-sm text-blue-600">{projects.length} من أصل {projects.length} مشروع</p>
            </div>
          </div>
          {/* البحث والفلاتر المدمجة */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  placeholder="بحث سريع..."
                  className="pl-10 pr-10 h-8 w-48 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs"
              >
                <Filter className="h-3 w-3 ml-1" />
                فلترة
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                حفظ البحث
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                تصدير
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* شريط الإجراءات الجماعية */}
      {selectedProjects.length > 0 && (
        <div className="bg-blue-100 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                تم تحديد {selectedProjects.length} مشروع
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProjects([])}
                className="text-blue-600 hover:text-blue-800"
              >
                إلغاء التحديد
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            لا توجد مشاريع
          </h3>
          <p className="text-gray-600 mb-4">
            ابدأ بإضافة المشاريع لإدارة قاعدة بياناتك
          </p>
        </div>
      ) : (
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input 
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProjects(projects.map(p => p.id))
                    } else {
                      setSelectedProjects([])
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                المشروع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                الموقع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                المطور
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                فترة الاستلام
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                إجراءات سريعة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                المزيد
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {projects.map((project) => (
                <tr 
                  key={project.id} 
                  className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-25 hover:to-cyan-25 transition-all duration-200 cursor-pointer"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, rgb(239 246 255), rgb(236 254 255))'; // blue-50 to cyan-50
                    e.currentTarget.style.borderLeftColor = 'rgb(59 130 246)'; // blue-500
                    e.currentTarget.style.borderLeftWidth = '4px';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.borderLeftColor = 'transparent';
                    e.currentTarget.style.borderLeftWidth = '0px';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  {/* تحديد */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjects([...selectedProjects, project.id])
                        } else {
                          setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>

                  {/* المشروع */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {project.imageUrl ? (
                        <img 
                          src={project.imageUrl} 
                          alt={project.name}
                          className="w-10 h-10 rounded-xl object-cover shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-500 max-w-40 truncate">
                          {project.description}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* الموقع */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-3 w-3 text-gray-400 ml-1" />
                      <span className="truncate max-w-32">
                        {project.location || 'غير محدد'}
                      </span>
                    </div>
                  </td>

                  {/* المطور */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="h-3 w-3 text-gray-400 ml-1" />
                      <div className="truncate max-w-32">
                        {project.developerInfo ? (
                          <div 
                            className="cursor-help"
                            title={`شركة: ${project.developerInfo.name}\nالمسؤول: ${project.developerInfo.contactPerson || 'غير محدد'}\nالهاتف: ${project.developerInfo.phone || 'غير محدد'}`}
                          >
                            {project.developerInfo.name}
                          </div>
                        ) : (
                          project.developer || 'غير محدد'
                        )}
                      </div>
                    </div>
                  </td>

                  {/* النوع */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building2 className="h-3 w-3 text-gray-400 ml-1" />
                      <span className="truncate max-w-24">
                        {project.type === 'residential' ? 'سكني' :
                         project.type === 'commercial' ? 'تجاري' :
                         project.type === 'mixed' ? 'مختلط' :
                         project.type === 'administrative' ? 'إداري' :
                         'غير محدد'}
                      </span>
                    </div>
                  </td>

                  {/* فترة الاستلام */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-3 w-3 text-gray-400 ml-1" />
                      <span className="truncate max-w-28">
                        {project.deliveryInfo || 'استلام فوري'}
                      </span>
                    </div>
                  </td>

                  {/* الحالة */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(project.status)}
                    >
                      {project.status || 'غير محدد'}
                    </Badge>
                  </td>


                  {/* إجراءات سريعة */}
                  <td className="px-3 py-3 align-middle min-w-[200px]">
                    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg shadow-sm w-full">
                      <InteractionsButton 
                        onAddInteraction={onAddNote}
                        itemId={project.id}
                        itemName={project.name}
                      />
                      <TaskButton 
                        onAddTask={onAddTask}
                        itemId={project.id}
                        itemName={project.name}
                      />
                      <NotesButton 
                        onAddNote={onAddNote}
                        itemId={project.id}
                        itemName={project.name}
                      />
                    </div>
                  </td>

                  {/* المزيد من الإجراءات */}
                  <td className="px-3 py-3 align-middle min-w-[80px]">
                    <ActionDropdown
                      item={project}
                      onEdit={canEditProject && canEditProject(project) ? onEdit : null}
                      onDelete={canDeleteProject && canDeleteProject(project) ? onDelete : null}
                      onView={onView}
                      onReminder={onReminder}
                      additionalActions={getAdditionalActions(project)}
                    />
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        
        {/* Table Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>إجمالي المشاريع: {projects.length}</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>نشط: {projects.filter(p => p.status === 'نشط').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span>مكتمل: {projects.filter(p => p.status === 'مكتمل').length}</span>
              </div>
            </div>
            <div>عرض {projects.length} من أصل {projects.length}</div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
