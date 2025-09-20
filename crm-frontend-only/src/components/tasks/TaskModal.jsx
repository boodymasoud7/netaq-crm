import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Flag, Target, Tag, FileText, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { useAuth } from '../../contexts/AuthContext'

export default function TaskModal({ isOpen, onClose, task = null, onTaskAdded, onTaskUpdated, leads = [], users = [], clients = [], dataLoading = false }) {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignedTo: currentUser?.name || '',
    assignedToName: '',
    category: 'follow_up',
    leadName: '',
    dueDate: '',
    tags: [],
    progress: 0
  })
  const [newTag, setNewTag] = useState('')

  // Initialize form data when editing
  useEffect(() => {
    if (task) {
      // Helper function to safely format date
      const formatDate = (dateValue) => {
        if (!dateValue) return ''
        try {
          const date = new Date(dateValue)
          if (isNaN(date.getTime())) return ''
          return date.toISOString().slice(0, 16)
        } catch (error) {
          console.error('Error formatting date:', error)
          return ''
        }
      }

      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        assignedTo: task.assignedTo || currentUser?.name || '',
        assignedToName: task.assignedToName || '',
        category: task.category || 'follow_up',
        leadName: task.leadName || '',
        dueDate: formatDate(task.dueDate),
        tags: task.tags || [],
        progress: task.progress || 0
      })
    } else {
      // Reset form for new task
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        assignedTo: currentUser?.name || '',
        assignedToName: '',
        category: 'follow_up',
        leadName: '',
        dueDate: '',
        tags: [],
        progress: 0
      })
    }
  }, [task, currentUser])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Find the assigned user's name - if user selected by ID, get their name
    let assignedToName = formData.assignedTo
    if (formData.assignedTo) {
      const assignedUser = users.find(user => user.id.toString() === formData.assignedTo.toString())
      if (assignedUser) {
        assignedToName = assignedUser.displayName
      }
    }
    
    // Process the due date
    let processedDueDate = formData.dueDate
    if (formData.dueDate) {
      try {
        // Convert to ISO string for consistency
        processedDueDate = new Date(formData.dueDate).toISOString()
      } catch (error) {
        console.error('Error processing due date:', error)
        processedDueDate = formData.dueDate // Keep original if conversion fails
      }
    }

    const taskData = {
      title: formData.title,
      description: formData.description.trim() || undefined, // إرسال undefined بدلاً من string فارغ
      priority: formData.priority,
      status: formData.status,
      category: formData.category,
      assignedTo: assignedToName, // Send name, not ID
      dueDate: processedDueDate,
      leadName: formData.leadName || undefined, // إرسال undefined بدلاً من string فارغ
      tags: formData.tags || [],
      progress: Number(formData.progress) || 0,
      // Don't include ID for new tasks
      ...(task && { id: task.id })
    }


    if (task) {
      onTaskUpdated?.(taskData)
    } else {
      onTaskAdded?.(taskData)
    }
    
    // Close modal after successful submission
    onClose()
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {task ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
                </h3>
                <p className="text-purple-100 text-sm">
                  {task ? 'تحديث بيانات المهمة' : 'املأ البيانات الأساسية للمهمة'}
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Enhanced Title */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 text-purple-500" />
                عنوان المهمة *
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="أدخل عنوان المهمة"
                required
                className="w-full focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Enhanced Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 text-purple-500" />
                الوصف (اختياري)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="أدخل وصف المهمة (اختياري - أو اتركه فارغاً)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Enhanced Priority and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Flag className="h-4 w-4 text-orange-500" />
                  الأولوية
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                  <option value="urgent">عاجل</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
            </div>

            {/* Enhanced Due Date */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                تاريخ الاستحقاق *
              </label>
              <Input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
                className="w-full focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Assigned User - المرحلة الأولى */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline ml-1" />
                موظف المبيعات المكلف *
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => {
                  const selectedUser = users.find(user => user.id.toString() === e.target.value.toString())
                  setFormData(prev => ({ 
                    ...prev, 
                    assignedTo: selectedUser ? selectedUser.displayName : e.target.value,
                    assignedToName: selectedUser?.displayName || e.target.value,
                    leadName: '' // إعادة تعيين العميل عند تغيير الموظف
                  }))
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={dataLoading}
                required
              >
                <option value="">
                  {dataLoading ? '⏳ جاري تحميل الموظفين...' : 'اختر موظف المبيعات أولاً'}
                </option>
                {!dataLoading && users.filter(user => 
                  user.role === 'sales' || 
                  user.role === 'sales_manager' || 
                  user.role === 'admin'
                ).map(user => (
                  <option key={user.id} value={user.displayName}>
                    {user.displayName} - {
                      user.role === 'admin' ? 'مدير عام' :
                      user.role === 'sales_manager' ? 'مدير مبيعات' :
                      user.role === 'sales' ? 'موظف مبيعات' :
                      user.role
                    }
                  </option>
                ))}
              </select>
            </div>

            {/* Category and Lead Name - المرحلة الثانية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="h-4 w-4 inline ml-1" />
                  نوع المهمة
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="follow_up">متابعة</option>
                  <option value="meeting">اجتماع</option>
                  <option value="call">مكالمة</option>
                  <option value="email">ايميل</option>
                  <option value="site_visit">زيارة موقع</option>
                  <option value="documentation">وثائق</option>
                  <option value="other">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Target className="h-4 w-4 inline ml-1" />
                  اسم العميل (اختياري)
                </label>
                <select
                  value={formData.leadName}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      leadName: e.target.value
                    }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={dataLoading || !formData.assignedTo}
                >
                  <option value="">
                    {!formData.assignedTo ? 'اختر الموظف أولاً' :
                     dataLoading ? '⏳ جاري تحميل العملاء...' : 'اختر العميل (اختياري)'}
                  </option>
                  
                  {!dataLoading && formData.assignedTo && (() => {
                    // العثور على الموظف المختار
                    const selectedUser = users.find(user => user.displayName === formData.assignedTo)
                    if (!selectedUser) return null
                    
                    // فلترة العملاء المحتملين والفعليين حسب الموظف المختار
                    const userLeads = leads.filter(lead => {
                      if (!lead.assignedTo) return false // تجاهل العملاء غير المخصصين
                      
                      // التحويل للمقارنة
                      const leadAssignedTo = lead.assignedTo.toString().toLowerCase()
                      const userId = selectedUser.id.toString()
                      const userName = (selectedUser.displayName || '').toLowerCase()
                      const userNameAlt = (selectedUser.name || '').toLowerCase()
                      
                      return leadAssignedTo === userId || 
                             leadAssignedTo === userName ||
                             leadAssignedTo === userNameAlt
                    })
                    
                    const userClients = clients.filter(client => {
                      if (!client.assignedTo) return false // تجاهل العملاء غير المخصصين
                      
                      // التحويل للمقارنة
                      const clientAssignedTo = client.assignedTo.toString().toLowerCase()
                      const userId = selectedUser.id.toString()
                      const userName = (selectedUser.displayName || '').toLowerCase()
                      const userNameAlt = (selectedUser.name || '').toLowerCase()
                      
                      return clientAssignedTo === userId || 
                             clientAssignedTo === userName ||
                             clientAssignedTo === userNameAlt
                    })
                    
                    return (
                      <>
                        {/* العملاء المحتملين للموظف */}
                        {userLeads.length > 0 && (
                          <optgroup label={`العملاء المحتملين - ${selectedUser.displayName}`}>
                            {userLeads.map(lead => (
                              <option key={`lead-${lead.id}`} value={lead.name}>
                                🔍 {lead.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        
                        {/* العملاء الفعليين للموظف */}
                        {userClients.length > 0 && (
                          <optgroup label={`العملاء الفعليين - ${selectedUser.displayName}`}>
                            {userClients.map(client => (
                              <option key={`client-${client.id}`} value={client.name}>
                                ✅ {client.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        
                        {/* عرض العملاء غير المخصصين إذا لم يكن هناك عملاء مخصصين */}
                        {userLeads.length === 0 && userClients.length === 0 && (
                          <>
                            {/* العملاء المحتملين غير المخصصين */}
                            {leads.filter(lead => !lead.assignedTo || lead.assignedTo === '').length > 0 && (
                              <optgroup label="العملاء المحتملين غير المخصصين">
                                {leads.filter(lead => !lead.assignedTo || lead.assignedTo === '').map(lead => (
                                  <option key={`unassigned-lead-${lead.id}`} value={lead.name}>
                                    🔍 {lead.name} (غير مخصص)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            
                            {/* العملاء الفعليين غير المخصصين */}
                            {clients.filter(client => !client.assignedTo || client.assignedTo === '').length > 0 && (
                              <optgroup label="العملاء الفعليين غير المخصصين">
                                {clients.filter(client => !client.assignedTo || client.assignedTo === '').map(client => (
                                  <option key={`unassigned-client-${client.id}`} value={client.name}>
                                    ✅ {client.name} (غير مخصص)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            
                            {/* رسالة إذا لم يكن هناك عملاء مخصصين أو غير مخصصين */}
                            {leads.length === 0 && clients.length === 0 && (
                              <option disabled>لا يوجد عملاء في النظام</option>
                            )}
                          </>
                        )}
                      </>
                    )
                  })()}
                </select>
                
                {/* رسالة توضيحية */}
                {formData.assignedTo && (
                  <p className="text-xs text-gray-500 mt-1">
                    📋 يتم عرض العملاء المخصصين للموظف المختار أولاً، ثم العملاء غير المخصصين
                  </p>
                )}
              </div>
            </div>

            {/* Progress (only for in_progress tasks) */}
            {formData.status === 'in_progress' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة الإنجاز: {formData.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline ml-1" />
                العلامات
              </label>
              
              {/* Existing Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add New Tag */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="إضافة علامة جديدة"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  إضافة
                </Button>
              </div>
            </div>

            {/* Enhanced Actions */}
          </div>

          {/* أزرار الحفظ والإلغاء - ثابتة في الأسفل */}
          <div className="flex-shrink-0 p-4 border-t bg-gray-50 rounded-b-xl">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-2"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white py-2 font-medium"
              >
                <FileText className="h-4 w-4 ml-2" />
                {task ? 'تحديث المهمة' : 'إضافة المهمة'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}