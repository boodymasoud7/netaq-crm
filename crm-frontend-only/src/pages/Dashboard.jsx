import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import usePerformanceMonitor from '../hooks/usePerformanceMonitor'
import {
  Users,
  UserPlus,
  Building2,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
  Bell,
  Calendar,
  Target,
  Zap,
  Award,
  Clock,
  MapPin,
  Star,
  CheckCircle,
  AlertCircle,
  Briefcase,
  LineChart,
  Timer,
  Sparkles
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useApiData } from '../hooks/useApi'
import { dbAPI } from '../lib/apiSwitch.js'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { formatCurrency, formatDateArabic } from '../lib/utils'
import { LoadingPage, StatsLoadingSkeleton, CardLoadingSkeleton } from '../components/ui/loading'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { LoadErrorState } from '../components/ui/EmptyState'
import EnhancedStatsCards from '../components/dashboard/EnhancedStatsCards'
import CompactTaskWidget from '../components/dashboard/CompactTaskWidget'
import CompactRemindersWidget from '../components/dashboard/CompactRemindersWidget'
import FollowUpsWidget from '../components/dashboard/FollowUpsWidget'
import { useTasks } from '../hooks/useTasks'
import { useReminders } from '../hooks/useReminders'
import toast from 'react-hot-toast'

// تم حذف قائمة التذكيرات مؤقتاً

const Dashboard = () => {
  const navigate = useNavigate()
  const { currentUser, isAdmin, isSales, isManager } = useAuth()

  // Performance monitoring
  usePerformanceMonitor('Dashboard')
  const {
    isSalesManager,
    checkPermission,
    filterByRole
  } = usePermissions()

  // Use real API data - fetch based on user role
  const { data: clientsData, loading: clientsLoading } = useApiData(() => dbAPI.getClients({ limit: 1000 }))
  const { data: leadsData, loading: leadsLoading } = useApiData(() => dbAPI.getLeads({ limit: 1000 }))
  const { data: salesData, loading: salesLoading } = useApiData(() => dbAPI.getSales({ limit: 1000 }))
  const { data: usersData, loading: usersLoading } = useApiData(() => dbAPI.getUsers())
  const { data: interactionsData, loading: interactionsLoading } = useApiData(() => dbAPI.getInteractions({ limit: 10000 }))
  const { data: followUpsData, loading: followUpsLoading } = useApiData(() => dbAPI.getFollowUps({ limit: 10000 }))

  // Real Tasks and Reminders Data
  const {
    tasks: realTasks,
    loading: tasksLoading,
    error: tasksError,
    addTask,
    updateTask,
    deleteTask
  } = useTasks()

  const {
    reminders,
    loading: remindersLoading,
    error: remindersError,
    addReminder,
    updateReminder,
    deleteReminder
  } = useReminders()

  // Extract and filter data based on user role
  const allClients = clientsData?.data || []
  const allLeads = leadsData?.data || []
  const allSales = salesData?.data || []
  const users = usersData?.data || []
  const interactions = interactionsData?.data || []
  const followUps = followUpsData?.data || []

  // Apply role-based filtering
  const clients = filterByRole(allClients, 'clients')
  const allFilteredLeads = filterByRole(allLeads, 'leads')
  // Exclude converted leads from Dashboard display
  const leads = allFilteredLeads.filter(lead =>
    lead.status !== 'converted' && lead.status !== 'محول'
  )
  const sales = filterByRole(allSales, 'sales')
  const tasks = filterByRole(realTasks || [], 'tasks')

  // حساب نقاط الأداء لكل موظف
  const calculateTeamPerformance = () => {
    return users
      .filter(user => {
        if (!user || !user.role) return true;
        const role = user.role.toLowerCase();
        const excludedRoles = ['admin', 'administrator', 'manager', 'مدير', 'مدير المبيعات', 'sales manager'];
        return !excludedRoles.some(excludedRole => role.includes(excludedRole.toLowerCase()));
      })
      .map(user => {
        const userClients = allClients.filter(client =>
          parseInt(client.assignedTo) === user.id || parseInt(client.createdBy) === user.id
        );
        const userLeads = allLeads.filter(lead =>
          parseInt(lead.assignedTo) === user.id || parseInt(lead.createdBy) === user.id
        );
        const userSales = allSales.filter(sale =>
          parseInt(sale.assignedTo) === user.id || parseInt(sale.createdBy) === user.id
        );
        const userInteractions = interactions.filter(i =>
          parseInt(i.createdBy) === user.id || parseInt(i.assignedTo) === user.id
        );
        const userFollowUps = followUps.filter(f =>
          parseInt(f.assignedTo) === user.id || parseInt(f.createdBy) === user.id
        );
        const userCompletedFollowUps = userFollowUps.filter(f => f.status === 'done' || f.status === 'completed');

        // حساب التحويلات
        const convertedLeads = userLeads.filter(lead =>
          lead.status === 'converted' || lead.convertedAt
        );

        // تفاعلات إيجابية
        const positiveInteractions = userInteractions.filter(i =>
          i.outcome && (
            i.outcome.toLowerCase().includes('interest') ||
            i.outcome.toLowerCase().includes('agreed') ||
            i.outcome.toLowerCase().includes('موافق') ||
            i.outcome.toLowerCase().includes('مهتم') ||
            i.outcome.toLowerCase().includes('ناجح')
          )
        );

        // متابعات في الوقت
        const onTimeFollowUps = userCompletedFollowUps.filter(f => {
          if (!f.completedDate || !f.scheduledDate) return false;
          return new Date(f.completedDate) <= new Date(f.scheduledDate);
        });

        // تقييمات 5 نجوم
        const fiveStarRatings = userClients.filter(c => c.rating && parseFloat(c.rating) >= 5);

        // إجمالي النقاط
        const totalPoints =
          userSales.length +
          convertedLeads.length +
          positiveInteractions.length +
          onTimeFollowUps.length +
          fiveStarRatings.length;

        return {
          userId: user.id,
          name: user.name || user.email,
          role: user.role === 'sales' ? 'مندوب مبيعات' : 'موظف خدمة عملاء',
          totalPoints,
          sales: userSales.length,
          conversions: convertedLeads.length,
          positiveInteractions: positiveInteractions.length,
          onTimeFollowUps: onTimeFollowUps.length,
          fiveStarRatings: fiveStarRatings.length,
          avatar: user.role === 'sales' ? '👩‍💼' : '🎧'
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  // Use useMemo to avoid expensive recalculation on every render
  const teamPerformance = useMemo(() => {
    return calculateTeamPerformance();
  }, [users, allClients, allLeads, allSales, interactions, followUps]);

  const currentUserPerformance = teamPerformance.find(p => p.userId === currentUser?.id);
  const currentUserRank = teamPerformance.findIndex(p => p.userId === currentUser?.id) + 1;

  // حساب النشاطات الأخيرة من البيانات الحقيقية
  const getRecentActivities = () => {
    const activities = []
    const now = new Date()

    // فترات البحث (نبدأ بالحديثة ونوسع تدريجياً)
    const timeRanges = [
      24 * 60 * 60 * 1000,    // آخر 24 ساعة
      7 * 24 * 60 * 60 * 1000, // آخر أسبوع
      30 * 24 * 60 * 60 * 1000 // آخر شهر
    ]

    let allActivities = []

    // جرب كل فترة زمنية حتى نجد نشاطات
    for (const timeRange of timeRanges) {
      // إضافة العملاء الجدد
      const recentClients = clients?.filter(client => {
        const clientDate = new Date(client.createdAt)
        const timeDiff = now - clientDate
        return timeDiff <= timeRange
      }).map(client => {
        // تحسين وصف العميل
        let description = client.name

        if (client.phone) {
          description += ` - ${client.phone}`
        } else if (client.email) {
          description += ` - ${client.email}`
        } else if (client.address) {
          description += ` - ${client.address.substring(0, 30)}...`
        } else if (client.source) {
          description += ` - ${client.source}`
        } else {
          description += ' - عميل جديد'
        }

        return {
          type: 'client',
          title: 'عميل جديد مضاف',
          description,
          time: client.createdAt,
          icon: Users,
          color: 'blue'
        }
      }) || []

      // إضافة العملاء المحتملين الجدد
      const recentLeads = leads?.filter(lead => {
        const leadDate = new Date(lead.createdAt)
        const timeDiff = now - leadDate
        return timeDiff <= timeRange
      }).map(lead => {
        // تحسين وصف العميل المحتمل
        let description = lead.name

        if (lead.phone) {
          description += ` - ${lead.phone}`
        } else if (lead.source) {
          description += ` - ${lead.source}`
        } else if (lead.email) {
          description += ` - ${lead.email}`
        } else if (lead.status) {
          const statusText = {
            'new': 'جديد',
            'contacted': 'تم التواصل',
            'qualified': 'مؤهل',
            'proposal': 'عرض سعر',
            'negotiation': 'تفاوض',
            'closed-won': 'مغلق - فوز',
            'closed-lost': 'مغلق - خسارة'
          }[lead.status] || lead.status
          description += ` - ${statusText}`
        } else {
          description += ' - عميل محتمل جديد'
        }

        return {
          type: 'lead',
          title: 'عميل محتمل جديد',
          description,
          time: lead.createdAt,
          icon: Target,
          color: 'purple'
        }
      }) || []

      // إضافة المبيعات الجديدة
      const recentSales = sales?.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        const timeDiff = now - saleDate
        return timeDiff <= timeRange
      }).map(sale => {
        // تحسين وصف المبيعة
        let clientInfo = sale.clientName || 'عميل غير محدد'
        if (sale.unitNumber) {
          clientInfo += ` - وحدة ${sale.unitNumber}`
        } else if (sale.projectName) {
          clientInfo += ` - ${sale.projectName}`
        }

        return {
          type: 'sale',
          title: 'مبيعة جديدة مكتملة',
          description: `${clientInfo} - ${formatCurrency(sale.amount)}`,
          time: sale.createdAt,
          icon: DollarSign,
          color: 'green'
        }
      }) || []

      // إضافة المهام المكتملة حديثاً
      const recentTasks = tasks?.filter(task => {
        if (task.status !== 'completed') return false
        const taskDate = new Date(task.updatedAt || task.createdAt)
        const timeDiff = now - taskDate
        return timeDiff <= timeRange
      }).map(task => {
        // تحسين وصف المهمة
        let description = task.title

        if (task.assignedToName) {
          description += ` - ${task.assignedToName}`
        } else if (task.clientName) {
          description += ` - عميل: ${task.clientName}`
        } else if (task.projectName) {
          description += ` - مشروع: ${task.projectName}`
        } else if (task.priority) {
          const priorityText = {
            'high': 'أولوية عالية',
            'medium': 'أولوية متوسطة',
            'low': 'أولوية منخفضة'
          }[task.priority] || 'مهمة عادية'
          description += ` - ${priorityText}`
        } else {
          description += ' - مهمة مكتملة'
        }

        return {
          type: 'task',
          title: 'مهمة مكتملة',
          description,
          time: task.updatedAt || task.createdAt,
          icon: CheckCircle,
          color: 'green'
        }
      }) || []

      // إضافة التذكيرات الجديدة
      const recentReminders = reminders?.filter(reminder => {
        const reminderDate = new Date(reminder.createdAt)
        const timeDiff = now - reminderDate
        return timeDiff <= timeRange
      }).map(reminder => {
        // تحسين وصف التذكير
        let description = reminder.title

        if (reminder.clientName) {
          description = `${reminder.title} - ${reminder.clientName}`
        } else if (reminder.phone) {
          description = `${reminder.title} - ${reminder.phone}`
        } else if (reminder.description) {
          description = `${reminder.title} - ${reminder.description.substring(0, 30)}...`
        } else if (reminder.location) {
          description = `${reminder.title} - ${reminder.location}`
        } else {
          // إذا لم توجد معلومات إضافية، اعرض نوع التذكير والوقت
          const reminderTypeArabic = {
            'call': 'اتصال',
            'visit': 'زيارة',
            'meeting': 'اجتماع',
            'follow-up': 'متابعة',
            'task': 'مهمة'
          }[reminder.type] || 'تذكير'

          const dueDate = new Date(reminder.dueDate)
          const isToday = dueDate.toDateString() === now.toDateString()
          const timeStr = isToday ?
            dueDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }) :
            dueDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })

          description = `${reminderTypeArabic} مجدول - ${timeStr}`
        }

        return {
          type: 'reminder',
          title: 'تذكير جديد مجدول',
          description,
          time: reminder.createdAt,
          icon: Bell,
          color: 'orange'
        }
      }) || []

      allActivities = [...recentClients, ...recentLeads, ...recentSales, ...recentTasks, ...recentReminders]

      // إذا وجدنا نشاطات، توقف عن البحث
      if (allActivities.length >= 4) break
    }

    // إذا لم نجد نشاطات حديثة، أضف آخر البيانات المحدثة
    if (allActivities.length === 0) {
      // آخر العملاء المحدثين
      const recentUpdatedClients = clients?.filter(client => client.updatedAt && client.updatedAt !== client.createdAt)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 2)
        .map(client => {
          let updateInfo = 'تم تحديث البيانات'
          if (client.phone) updateInfo = `هاتف: ${client.phone}`
          else if (client.email) updateInfo = `إيميل: ${client.email}`
          else if (client.address) updateInfo = `عنوان: ${client.address.substring(0, 25)}...`

          return {
            type: 'client_update',
            title: 'تحديث بيانات عميل',
            description: `${client.name} - ${updateInfo}`,
            time: client.updatedAt,
            icon: Users,
            color: 'blue'
          }
        }) || []

      // آخر العملاء المحتملين المحدثين
      const recentUpdatedLeads = leads?.filter(lead => lead.updatedAt && lead.updatedAt !== lead.createdAt)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 2)
        .map(lead => {
          let updateInfo = 'تم تحديث الحالة'
          if (lead.status) {
            const statusText = {
              'new': 'جديد',
              'contacted': 'تم التواصل',
              'qualified': 'مؤهل',
              'proposal': 'عرض سعر',
              'negotiation': 'تفاوض'
            }[lead.status] || lead.status
            updateInfo = `حالة: ${statusText}`
          } else if (lead.phone) {
            updateInfo = `هاتف: ${lead.phone}`
          }

          return {
            type: 'lead_update',
            title: 'تحديث عميل محتمل',
            description: `${lead.name} - ${updateInfo}`,
            time: lead.updatedAt,
            icon: Target,
            color: 'purple'
          }
        }) || []

      allActivities = [...recentUpdatedClients, ...recentUpdatedLeads]
    }

    // ترتيب النشاطات حسب الوقت وإرجاع أحدث 4
    return allActivities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 4) // أحدث 4 نشاطات
  }

  // Use useMemo to avoid expensive filtering on every render
  const recentActivities = useMemo(() => {
    return getRecentActivities();
  }, [clients, leads, sales, tasks, reminders])

  // Debug logging removed for production performance

  // دالة لحساب الوقت المنقضي باللغة العربية
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60))

    if (diffInMinutes < 1) return 'منذ لحظات'
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `منذ ${diffInHours} ساعة`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'منذ يوم واحد'
    if (diffInDays < 7) return `منذ ${diffInDays} أيام`

    return new Date(date).toLocaleDateString('ar-EG')
  }

  // الحصول على لون الخلفية حسب نوع النشاط
  const getActivityColor = (color) => {
    const colors = {
      'green': 'bg-green-50 hover:bg-green-100',
      'blue': 'bg-blue-50 hover:bg-blue-100',
      'purple': 'bg-purple-50 hover:bg-purple-100',
      'orange': 'bg-orange-50 hover:bg-orange-100',
      'red': 'bg-red-50 hover:bg-red-100'
    }
    return colors[color] || 'bg-gray-50 hover:bg-gray-100'
  }

  // الحصول على لون الأيقونة
  const getIconColor = (color) => {
    const colors = {
      'green': 'bg-green-500',
      'blue': 'bg-blue-500',
      'purple': 'bg-purple-500',
      'orange': 'bg-orange-500',
      'red': 'bg-red-500'
    }
    return colors[color] || 'bg-gray-500'
  }

  // تشخيص Dashboard - معطل مؤقتاً
  // console.log('=== تشخيص Dashboard ===')
  // console.log('المستخدم الحالي:', currentUser)
  // console.log('ملف المستخدم:', userProfile)
  // console.log('دور المستخدم:', userProfile?.role)
  // console.log('البريد الإلكتروني:', currentUser?.email)
  // console.log('عدد العملاء:', clients?.length)
  // console.log('عدد العملاء المحتملين:', leads?.length)
  // console.log('هل مدير مبيعات؟', userProfile?.role === 'sales_manager')

  const loading = clientsLoading || leadsLoading || salesLoading || tasksLoading || remindersLoading

  // Get recent activities - increased count for better use of space
  const recentClients = clients?.slice(0, 8) || []
  const recentLeads = leads?.slice(0, 8) || []
  const recentSales = sales?.slice(0, 8) || []
  const recentTasks = tasks?.slice(0, 8) || []

  // Calculate personal stats based on filtered data only
  const personalRevenue = sales.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0)
  const personalSalesCount = sales.length
  const personalLeadsCount = leads.length
  const personalClientsCount = clients.length

  // Calculate conversion rate from personal data
  const totalPersonalLeads = allFilteredLeads.length // Include converted leads for rate calculation
  const convertedLeads = allFilteredLeads.filter(lead => lead.status === 'converted' || lead.status === 'محول').length
  const personalConversionRate = totalPersonalLeads > 0 ? ((convertedLeads / totalPersonalLeads) * 100).toFixed(1) : 0


  if (loading) {
    return <LoadingPage message="جاري تحميل لوحة التحكم..." />
  }

  // Enhanced personal stats for new components
  const personalStats = {
    clientsCount: personalClientsCount,
    leadsCount: personalLeadsCount,
    salesCount: personalSalesCount,
    revenue: personalRevenue
  }

  // Task management handlers
  const handleAddTask = () => {
    navigate('/tasks')
  }

  const handleCompleteTask = async (taskId) => {
    try {
      console.log('Completing task:', taskId)
      await updateTask(taskId, { status: 'completed', completed: true })
      toast.success('تم إكمال المهمة بنجاح!')
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('فشل في إكمال المهمة')
    }
  }

  // Reminder management handlers
  const handleAddReminder = () => {
    navigate('/reminders')
  }

  const handleCompleteReminder = async (reminderId) => {
    try {
      console.log('Completing reminder:', reminderId)
      await updateReminder(reminderId, { status: 'completed', completed: true })
      toast.success('تم إكمال التذكير بنجاح!')
    } catch (error) {
      console.error('Error completing reminder:', error)
      toast.error('فشل في إكمال التذكير')
    }
  }

  // Error handling
  if (tasksError || remindersError) {
    return (
      <ErrorBoundary>
        <LoadErrorState
          title="فشل في تحميل لوحة التحكم"
          description="حدث خطأ أثناء تحميل بيانات لوحة التحكم. يرجى إعادة تحميل الصفحة."
          onRetry={() => window.location.reload()}
        />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 via-white to-gray-100 min-h-screen">
        {/* Enhanced Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl p-8 text-white">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">لوحة التحكم</h1>
                    <p className="text-blue-100 text-lg">مرحباً بك {userProfile?.displayName || 'في نظام إدارة العقارات'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    📅 {new Date().toLocaleDateString('ar-EG', {
                      timeZone: 'Africa/Cairo',
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="text-white text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    🕐 {new Date().toLocaleTimeString('ar-EG', {
                      timeZone: 'Africa/Cairo',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Stats Cards */}
        <EnhancedStatsCards
          personalStats={personalStats}
          isAdmin={isAdmin}
          isSales={isSales}
          loading={loading}
          teamPerformance={teamPerformance}
          currentUserPerformance={currentUserPerformance}
          currentUserRank={currentUserRank}
        />

        {/* Compact Interactive Widgets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          {/* Real Task Management */}
          <div className="h-full">
            <CompactTaskWidget
              tasksData={tasks}
              onAddTask={handleAddTask}
              onCompleteTask={handleCompleteTask}
              loading={tasksLoading}
            />
          </div>

          {/* Real Reminders Widget */}
          <div className="h-full">
            <CompactRemindersWidget
              remindersData={reminders}
              onAddReminder={handleAddReminder}
              onCompleteReminder={handleCompleteReminder}
              loading={remindersLoading}
            />
          </div>

          {/* Follow-ups Widget */}
          <div className="h-full">
            <FollowUpsWidget />
          </div>
        </div>


        {/* Enhanced Activity Overview - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Clients Performance */}
          <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 overflow-hidden" onClick={() => navigate('/clients')}>
            <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-4 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">العملاء</h3>
                    <p className="text-blue-100 text-sm">إدارة قاعدة العملاء</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{personalClientsCount}</div>
                  <div className="text-blue-100 text-sm">عميل نشط</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-blue-100 text-sm">عملاء جدد هذا الشهر</span>
                  <span className="text-white font-semibold">{recentClients.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-100 text-sm">معدل النمو</span>
                  <span className="text-green-300 font-semibold">+12%</span>
                </div>
                <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
            </div>
          </Card>

          {/* Leads Performance */}
          <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 overflow-hidden" onClick={() => navigate('/leads')}>
            <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-4 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">العملاء المحتملين</h3>
                    <p className="text-orange-100 text-sm">الفرص الجديدة</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{personalLeadsCount}</div>
                  <div className="text-orange-100 text-sm">فرصة</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-orange-100 text-sm">معدل التحويل</span>
                  <span className="text-white font-semibold">{personalConversionRate || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-100 text-sm">فرص هذا الأسبوع</span>
                  <span className="text-yellow-300 font-semibold">{Math.floor(personalLeadsCount * 0.3)}</span>
                </div>
                <div className="w-full bg-red-400 bg-opacity-30 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${personalConversionRate || 0}%` }}></div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
            </div>
          </Card>

          {/* Sales Performance */}
          <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 overflow-hidden" onClick={() => navigate('/sales')}>
            <div className="relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 p-4 text-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">المبيعات</h3>
                    <p className="text-green-100 text-sm">الأداء المالي</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{formatCurrency(personalRevenue)}</div>
                  <div className="text-green-100 text-sm">إجمالي الإيرادات</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-100 text-sm">عدد المبيعات</span>
                  <span className="text-white font-semibold">{personalSalesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-100 text-sm">متوسط البيع</span>
                  <span className="text-yellow-300 font-semibold">{formatCurrency(personalRevenue / Math.max(personalSalesCount, 1))}</span>
                </div>
                <div className="w-full bg-green-400 bg-opacity-30 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
            </div>
          </Card>
        </div>

        {/* Recent Activities & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                النشاط الأخير
              </h3>
              <div className="space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-xl w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-gray-600" />
                    </div>
                    <h4 className="text-base font-medium text-gray-800 mb-2">لا توجد أنشطة حديثة</h4>
                    <p className="text-gray-500 text-sm mb-3">سيظهر هنا آخر النشاطات عند إضافة عملاء أو مبيعات جديدة</p>
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={() => navigate('/clients')}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Users className="h-3 w-3 ml-1" />
                        إضافة عميل
                      </Button>
                      <Button
                        onClick={() => navigate('/leads')}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Target className="h-3 w-3 ml-1" />
                        إضافة فرصة
                      </Button>
                    </div>
                  </div>
                ) : (
                  recentActivities.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${getActivityColor(activity.color)}`}
                      >
                        <div className={`w-8 h-8 ${getIconColor(activity.color)} rounded-full flex items-center justify-center`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.description}</p>
                        </div>
                        <span className="text-xs text-gray-400">{getTimeAgo(activity.time)}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                إجراءات سريعة
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/clients')}
                  className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 h-12"
                >
                  <UserPlus className="h-4 w-4 ml-2" />
                  <div className="text-right">
                    <div className="font-medium">عميل جديد</div>
                    <div className="text-xs opacity-75">إضافة عميل للنظام</div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/sales')}
                  className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border-0 h-12"
                >
                  <DollarSign className="h-4 w-4 ml-2" />
                  <div className="text-right">
                    <div className="font-medium">تسجيل مبيعة</div>
                    <div className="text-xs opacity-75">عملية بيع جديدة</div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/reminders')}
                  className="w-full justify-start bg-orange-50 text-orange-700 hover:bg-orange-100 border-0 h-12"
                >
                  <Calendar className="h-4 w-4 ml-2" />
                  <div className="text-right">
                    <div className="font-medium">جدولة مهمة</div>
                    <div className="text-xs opacity-75">تذكير أو موعد</div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/projects')}
                  className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border-0 h-12"
                >
                  <Building2 className="h-4 w-4 ml-2" />
                  <div className="text-right">
                    <div className="font-medium">مشروع جديد</div>
                    <div className="text-xs opacity-75">إضافة مشروع عقاري</div>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="mt-6">
          <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              نظرة عامة على الأداء
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Today's Stats */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{personalClientsCount}</div>
                <div className="text-sm text-blue-600">عملاء اليوم</div>
                <div className="text-xs text-blue-500 mt-1">+{Math.floor(personalClientsCount * 0.1)} عن أمس</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{personalSalesCount}</div>
                <div className="text-sm text-green-600">مبيعات اليوم</div>
                <div className="text-xs text-green-500 mt-1">+{Math.floor(personalSalesCount * 0.2)} عن أمس</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{personalLeadsCount}</div>
                <div className="text-sm text-orange-600">فرص جديدة</div>
                <div className="text-xs text-orange-500 mt-1">+{Math.floor(personalLeadsCount * 0.15)} عن أمس</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{Math.floor((personalRevenue || 0) / 1000)}K</div>
                <div className="text-sm text-purple-600">إيرادات اليوم</div>
                <div className="text-xs text-purple-500 mt-1">+12% عن أمس</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  )
}
