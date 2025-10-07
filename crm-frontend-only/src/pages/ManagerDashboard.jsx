import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Calendar, 
  Download,
  Settings,
  Users, 
  Target,
  TrendingUp, 
  Activity,
  BarChart3,
  DollarSign,
  UserCheck,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  FileText,
  PieChart,
  LineChart,
  Briefcase,
  Clock,
  Star,
  Zap,
  Bell,
  Phone,
  UserPlus,
  Building2,
  Package,
  Percent,
  Timer,
  Gauge,
  MessageSquare,
  CalendarCheck,
  Mail,
  MapPin,
  ThumbsUp,
  HeadphonesIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useManagerDashboard } from '../hooks/useManagerDashboard';
import { useAuth } from '../contexts/AuthContext';
import { formatDateArabic, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useApiData, useApi } from '../hooks/useApi';
import { useTasks } from '../hooks/useTasks';
import { useReminders } from '../hooks/useReminders';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const api = useApi();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Helper function to filter out managers and admins
  const isRegularEmployee = (user) => {
    if (!user || !user.role) return true;
    
    const role = user.role.toLowerCase();
    const excludedRoles = [
      'admin', 'administrator', 
      'manager', 'مدير', 
      'مدير المبيعات', 'مدير مبيعات',
      'sales manager', 'salesmanager'
    ];
    
    return !excludedRoles.some(excludedRole => 
      role.includes(excludedRole.toLowerCase()) || 
      role === excludedRole.toLowerCase()
    );
  };
  
  // Real data from API
  const { data: managerData, loading: managerLoading, error: managerError } = useApiData(() => api.getManagerStats());
  const { data: statsData, loading: statsLoading } = useApiData(() => api.getStats());
  const { data: clientsData, loading: clientsLoading } = useApiData(() => api.getClients({ limit: 1000 }));
  const { data: salesData, loading: salesLoading } = useApiData(() => api.getSales({ limit: 1000 }));
  const { data: leadsData, loading: leadsLoading } = useApiData(() => api.getLeads({ limit: 1000 }));
  const { data: usersData, loading: usersLoading } = useApiData(() => api.getUsers());
  const { data: followUpsData, loading: followUpsLoading } = useApiData(() => api.getFollowUps({ limit: 1000 }));
  const { data: interactionsData, loading: interactionsLoading } = useApiData(() => api.getInteractions({ limit: 1000 }));
  const { data: activityData, loading: activityLoading } = useApiData(() => api.getActivityFeed({ limit: 50 }));
  
  // Hooks for tasks and reminders
  const { tasks, loading: tasksLoading } = useTasks();
  const { reminders, loading: remindersLoading } = useReminders();

  const loading = managerLoading || statsLoading || clientsLoading || salesLoading || leadsLoading || 
                 usersLoading || followUpsLoading || interactionsLoading || activityLoading || tasksLoading || remindersLoading;

  // Process real data
  const clients = clientsData?.data || [];
  const sales = salesData?.data || [];
  const leads = leadsData?.data || [];
  const users = usersData?.data || [];
  const followUps = followUpsData?.data || [];
  const interactions = interactionsData?.data || [];
  const activities = activityData?.data || [];

  // Debug: Check follow-ups data
  console.log('🔍 Follow-ups from API:', {
    total: followUps.length,
    apiResponse: followUpsData,
    sample: followUps.slice(0, 3).map(f => ({ 
      id: f.id, 
      status: f.status, 
      title: f.title,
      deleted_at: f.deleted_at,
      createdAt: f.createdAt 
    })),
    statusCounts: followUps.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] || 0) + 1;
      return acc;
    }, {}),
    debugInfo: followUpsData?.debug
  });
  
  // Alert if we detect deleted follow-ups
  if (followUps.some(f => f.deleted_at)) {
    console.warn('⚠️ Found follow-ups with deleted_at timestamps in API response!');
    console.warn('This indicates soft delete is not working properly.');
  }

  // Calculate employee interaction metrics instead of sales metrics
  const totalInteractions = interactions.length;
  const completedFollowUps = followUps.filter(f => f.status === 'done').length;
  const pendingFollowUps = followUps.filter(f => f.status === 'pending').length;
  const avgResponseTime = 1.8; // This would be calculated from actual interaction timestamps
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;
  
  // Customer interaction focused KPIs
  const kpis = [
    {
      title: 'تفاعل العملاء',
      value: `${totalInteractions}`,
      change: '+15',
      trend: 'up',
      target: '200',
      progress: Math.min((totalInteractions / 200) * 100, 100),
      icon: MessageSquare,
      color: 'blue'
    },
    {
      title: 'معدل الاستجابة',
      value: `${avgResponseTime} ساعة`,
      change: '-0.3ساعة',
      trend: 'up',
      target: '2 ساعة',
      progress: Math.max(100 - ((avgResponseTime / 2) * 100), 0),
      icon: Clock,
      color: 'green'
    },
    {
      title: 'المتابعات المكتملة',
      value: `${completedFollowUps}`,
      change: '+12',
      trend: 'up',
      target: '50',
      progress: Math.min((completedFollowUps / 50) * 100, 100),
      icon: CheckCircle,
      color: 'purple'
    },
    {
      title: 'رضا العملاء',
      value: '4.7/5',
      change: '+0.2',
      trend: 'up',
      target: '4.8/5',
      progress: (4.7 / 4.8) * 100,
      icon: Star,
      color: 'orange'
    }
  ];

  // Debug: Log data counts
  console.log('📊 Team Performance Data:', {
    totalUsers: users.length,
    regularEmployees: users.filter(isRegularEmployee).length,
    totalClients: clients.length,
    totalFollowUps: followUps.length,
    totalInteractions: interactions.length,
    totalTasks: tasks.length,
    followUpStatuses: followUps.map(f => f.status),
    sampleUser: users[0],
    sampleClient: clients[0],
    sampleFollowUp: followUps[0]
  });

  // Team performance focused on customer interactions
  const teamPerformance = users
    .filter(isRegularEmployee)
    .map(user => {
      const userClients = clients.filter(client => 
        parseInt(client.assignedTo) === user.id || parseInt(client.createdBy) === user.id
      );
      const userLeads = leads.filter(lead => 
        parseInt(lead.assignedTo) === user.id || parseInt(lead.createdBy) === user.id
      );
      const userFollowUps = followUps.filter(f => 
        parseInt(f.assignedTo) === user.id || parseInt(f.createdBy) === user.id
      );
      const userInteractions = interactions.filter(i => 
        parseInt(i.createdBy) === user.id || parseInt(i.assignedTo) === user.id
      );
      // Separate lead interactions from client interactions
      const userLeadInteractions = userInteractions.filter(i => 
        i.itemType === 'lead' || i.itemType === 'Lead'
      );
      const userClientInteractions = userInteractions.filter(i => 
        i.itemType === 'client' || i.itemType === 'Client'
      );
      const userTasks = tasks.filter(task => 
        parseInt(task.assignedTo) === user.id || parseInt(task.createdBy) === user.id
      );
      const userCompletedTasks = userTasks.filter(task => task.status === 'completed');
      const userCompletedFollowUps = userFollowUps.filter(f => f.status === 'done' || f.status === 'completed' || f.status === 'مكتمل');
      
      console.log(`👤 User ${user.name} (ID: ${user.id}):`, {
        clients: userClients.length,
        leads: userLeads.length,
        followUps: userFollowUps.length,
        completedFollowUps: userCompletedFollowUps.length,
        totalInteractions: userInteractions.length,
        leadInteractions: userLeadInteractions.length,
        clientInteractions: userClientInteractions.length,
        tasks: userTasks.length
      });
      
      // نظام النقاط البسيط - كل حاجة = 1 نقطة
      const userSales = sales.filter(sale => 
        parseInt(sale.assignedTo) === user.id || parseInt(sale.createdBy) === user.id
      );
      
      // حساب التحويلات (Leads تم تحويلها لـ Clients)
      const convertedLeads = userLeads.filter(lead => 
        lead.status === 'converted' || lead.convertedAt
      );
      
      // تفاعلات إيجابية (outcome: interested, agreed, موافق، مهتم)
      const positiveInteractions = userInteractions.filter(i => 
        i.outcome && (
          i.outcome.toLowerCase().includes('interest') ||
          i.outcome.toLowerCase().includes('agreed') ||
          i.outcome.toLowerCase().includes('موافق') ||
          i.outcome.toLowerCase().includes('مهتم') ||
          i.outcome.toLowerCase().includes('ناجح')
        )
      );
      
      // متابعات مكتملة في الوقت
      const onTimeFollowUps = userCompletedFollowUps.filter(f => {
        if (!f.completedDate || !f.scheduledDate) return false;
        const completed = new Date(f.completedDate);
        const scheduled = new Date(f.scheduledDate);
        return completed <= scheduled;
      });
      
      // تقييمات 5 نجوم من العملاء
      const fiveStarRatings = userClients.filter(c => 
        c.rating && parseFloat(c.rating) >= 5
      );
      
      // إجمالي النقاط = كل حاجة × 1
      const totalPoints = 
        userSales.length +                    // صفقات
        convertedLeads.length +               // تحويلات
        positiveInteractions.length +         // تفاعلات إيجابية
        onTimeFollowUps.length +              // متابعات في الوقت
        fiveStarRatings.length;               // تقييمات 5 نجوم
      
      const responseRate = userFollowUps.length > 0 ? (userCompletedFollowUps.length / userFollowUps.length) * 100 : 0;

      return {
        userId: user.id,
        name: user.name || user.email,
        role: user.role === 'sales' ? 'مندوب مبيعات' : 'موظف خدمة عملاء',
        
        // البيانات الأساسية
        clients: userClients.length,
        leads: userLeads.length,
        interactions: userInteractions.length,
        leadInteractions: userLeadInteractions.length,
        clientInteractions: userClientInteractions.length,
        followUps: userCompletedFollowUps.length,
        pendingFollowUps: userFollowUps.length - userCompletedFollowUps.length,
        tasks: userTasks.length,
        completionRate: Math.round(responseRate),
        
        // نظام النقاط الجديد
        totalPoints: totalPoints,
        sales: userSales.length,
        conversions: convertedLeads.length,
        positiveInteractions: positiveInteractions.length,
        onTimeFollowUps: onTimeFollowUps.length,
        fiveStarRatings: fiveStarRatings.length,
        
        // بيانات التفاعلات التفصيلية
        allInteractions: userInteractions,
        allFollowUps: userFollowUps,
        
        interactionScore: totalPoints, // استخدام totalPoints بدلاً من الحساب القديم
        avatar: user.role === 'sales' ? '👩‍💼' : '🎧'
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints) // ترتيب حسب النقاط
    .slice(0, 10);

  // Real alerts focused on customer service
  const generateRealAlerts = () => {
    const alerts = [];
    
    // Clients needing urgent follow-up
    const urgentClients = leads.filter(lead => {
      const createdDate = new Date(lead.createdAt);
      const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
      return daysSinceCreated > 2 && (lead.status === 'جديد' || lead.status === 'new');
    });

    if (urgentClients.length > 0) {
      alerts.push({
        type: 'urgent',
        title: `${urgentClients.length} عميل يحتاج متابعة عاجلة`,
        description: `عملاء لم يتم التواصل معهم منذ أكثر من يومين`,
        time: 'الآن',
        icon: Phone,
        color: 'red'
      });
    }

    // Pending follow-ups
    if (pendingFollowUps > 5) {
      alerts.push({
        type: 'warning',
        title: `${pendingFollowUps} متابعة معلقة`,
        description: 'متابعات مجدولة تحتاج إلى تنفيذ',
        time: 'منذ ساعة',
        icon: CalendarCheck,
        color: 'orange'
      });
    }

    // High interaction volume
    if (totalInteractions > 50) {
      alerts.push({
        type: 'success',
        title: 'نشاط تفاعلي مرتفع',
        description: `${totalInteractions} تفاعل مع العملاء اليوم`,
        time: 'منذ ساعتين',
        icon: MessageSquare,
        color: 'green'
      });
    }

    // Task completion reminder
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < new Date();
    });

    if (overdueTasks.length > 0) {
      alerts.push({
        type: 'info',
        title: `${overdueTasks.length} مهمة متأخرة`,
        description: 'مهام تحتاج إلى متابعة عاجلة',
        time: 'منذ 30 دقيقة',
        icon: AlertTriangle,
        color: 'blue'
      });
    }

    return alerts.slice(0, 5);
  };

  const alerts = generateRealAlerts();

  // Export functionality
  const exportReport = async (reportType) => {
    try {
      const reportData = {
        reportType,
        period: selectedPeriod,
        generatedAt: new Date().toISOString(),
        data: {
          teamPerformance,
          kpis,
          alerts,
          summary: {
            totalEmployees: users.filter(isRegularEmployee).length,
            totalClients: clients.length,
            totalInteractions,
            completedFollowUps,
            pendingFollowUps
          }
        }
      };

      // Convert to CSV format
      let csvContent = '';
      
      if (reportType === 'team') {
        csvContent = 'اسم الموظف,العملاء,التفاعلات,المتابعات المكتملة,المتابعات المعلقة,معدل الإنجاز\n';
        teamPerformance.forEach(member => {
          csvContent += `${member.name},${member.clients},${member.interactions},${member.followUps},${member.pendingFollowUps},${member.completionRate}%\n`;
        });
      } else if (reportType === 'kpis') {
        csvContent = 'المؤشر,القيمة الحالية,الهدف,نسبة الإنجاز\n';
        kpis.forEach(kpi => {
          csvContent += `${kpi.title},${kpi.value},${kpi.target},${kpi.progress.toFixed(1)}%\n`;
        });
      } else {
        // Executive summary
        csvContent = 'التقرير التنفيذي الشامل\n';
        csvContent += `تاريخ التقرير: ${formatDateArabic(new Date())}\n`;
        csvContent += `الفترة: ${selectedPeriod}\n\n`;
        csvContent += `إجمالي الموظفين: ${users.filter(isRegularEmployee).length}\n`;
        csvContent += `إجمالي العملاء: ${clients.length}\n`;
        csvContent += `إجمالي التفاعلات: ${totalInteractions}\n`;
        csvContent += `المتابعات المكتملة: ${completedFollowUps}\n`;
        csvContent += `المتابعات المعلقة: ${pendingFollowUps}\n`;
        csvContent += `معدل إنجاز المهام: ${taskCompletionRate}%\n\n`;
        csvContent += 'أفضل الموظفين:\n';
        teamPerformance.slice(0, 5).forEach((member, index) => {
          csvContent += `${index + 1}. ${member.name} - ${member.interactionScore} نقطة\n`;
        });
      }

      // Download the file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `تقرير_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('تم تصدير التقرير بنجاح!');
    } catch (error) {
      toast.error('خطأ في تصدير التقرير: ' + error.message);
    }
  };

  const refresh = async () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">جاري تحميل لوحة متابعة الموظفين...</p>
        </div>
      </div>
    );
  }

  if (managerError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              👥 لوحة متابعة الموظفين
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              خطأ في تحميل البيانات: {managerError}
            </p>
            <Button onClick={refresh} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className="h-4 w-4 mr-2" />
              إعادة تحميل البيانات
            </Button>
          </Card>
              </div>
              </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 rounded-2xl p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                  <Users className="h-10 w-10 text-white" />
              </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-1">لوحة متابعة الموظفين</h1>
                  <p className="text-purple-100 text-lg">مراقبة شاملة لأداء الفريق وتفاعله مع العملاء</p>
              </div>
            </div>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">{users.filter(isRegularEmployee).length} موظف نشط</span>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-sm font-medium">{totalInteractions} تفاعل مع العملاء</span>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">متوسط الاستجابة: {avgResponseTime}ساعة</span>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">{formatDateArabic(new Date())}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white bg-opacity-20 border border-white border-opacity-30 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <option value="thisMonth" className="text-gray-900">الشهر الحالي</option>
                <option value="lastMonth" className="text-gray-900">الشهر الماضي</option>
                <option value="quarter" className="text-gray-900">الربع الحالي</option>
                <option value="year" className="text-gray-900">العام الحالي</option>
              </select>
              
              <Button 
                onClick={refresh}
                variant="outline"
                className="bg-white bg-opacity-20 border-white border-opacity-30 text-white hover:bg-white hover:bg-opacity-30"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              
              <Button 
                onClick={() => exportReport('executive')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير تقرير شامل
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('🧹 Checking follow-ups data...');
                  const deletedCount = followUps.filter(f => f.deleted_at).length;
                  if (deletedCount > 0) {
                    toast.error(`تم العثور على ${deletedCount} متابعة محذوفة في البيانات!`);
                  } else {
                    toast.success('لا توجد متابعات محذوفة في البيانات ✅');
                  }
                }}
                variant="outline"
                className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <Zap className="h-4 w-4 ml-2" />
                فحص البيانات
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white bg-opacity-5 rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white bg-opacity-5 rounded-full translate-y-36 -translate-x-36"></div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'نظرة عامة', icon: Users },
            { id: 'team', label: 'أداء الموظفين', icon: UserCheck },
            { id: 'interactions', label: 'التفاعل مع العملاء', icon: MessageSquare },
            { id: 'goals', label: 'الأهداف والمتابعة', icon: Target },
            { id: 'reports', label: 'التقارير التفصيلية', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
  return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
              </div>
            </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Customer Interaction KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              const isPositive = kpi.trend === 'up';
              const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
              
              return (
                <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${
                        kpi.color === 'blue' ? 'bg-blue-100' :
                        kpi.color === 'green' ? 'bg-green-100' :
                        kpi.color === 'purple' ? 'bg-purple-100' :
                        'bg-orange-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          kpi.color === 'blue' ? 'text-blue-600' :
                          kpi.color === 'green' ? 'text-green-600' :
                          kpi.color === 'purple' ? 'text-purple-600' :
                          'text-orange-600'
                        }`} />
            </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                        isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <TrendIcon className="h-3 w-3" />
                        {kpi.change}
          </div>
        </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</h3>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
      </div>

                <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>الهدف: {kpi.target}</span>
                          <span>{Math.round(kpi.progress)}%</span>
                  </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              kpi.color === 'blue' ? 'bg-blue-500' :
                              kpi.color === 'green' ? 'bg-green-500' :
                              kpi.color === 'purple' ? 'bg-purple-500' :
                              'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(kpi.progress, 100)}%` }}
                          ></div>
                </div>
                  </div>
                  </div>
            </CardContent>
          </Card>
              );
            })}
          </div>

          {/* Employee Activity Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity Trend */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  نشاط الموظفين اليومي
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
              <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{totalInteractions + completedFollowUps}</p>
                      <p className="text-sm text-gray-600">إجمالي الأنشطة اليوم</p>
                  </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-blue-600">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="font-semibold">+22%</span>
                </div>
                      <p className="text-xs text-gray-500">مقارنة بالأمس</p>
                  </div>
                  </div>
                  
                  {/* Activity breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        التفاعلات مع العملاء
                      </span>
                      <span className="font-semibold text-blue-600">{totalInteractions}</span>
                </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        المتابعات المكتملة
                      </span>
                      <span className="font-semibold text-green-600">{completedFollowUps}</span>
              </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        المتابعات المعلقة
                      </span>
                      <span className="font-semibold text-orange-600">{pendingFollowUps}</span>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

            {/* Customer Satisfaction */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  رضا العملاء وجودة الخدمة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="flex justify-center items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star 
                          key={star} 
                          className={`h-8 w-8 ${star <= 4 ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                  </div>
                    <p className="text-3xl font-bold text-yellow-600 mb-1">4.7/5</p>
                    <p className="text-sm text-gray-600">متوسط تقييم العملاء</p>
                </div>
                  
                  <div className="space-y-3">
                    {[
                      { label: 'سرعة الاستجابة', rating: 4.8, color: 'bg-blue-500' },
                      { label: 'جودة الخدمة', rating: 4.7, color: 'bg-green-500' },
                      { label: 'الود والاحترام', rating: 4.9, color: 'bg-purple-500' },
                      { label: 'حل المشاكل', rating: 4.5, color: 'bg-orange-500' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{item.label}</span>
                          <span className="font-semibold">{item.rating}/5</span>
                  </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                            style={{ width: `${(item.rating / 5) * 100}%` }}
                          ></div>
                  </div>
                </div>
                    ))}
              </div>
                </div>
            </CardContent>
          </Card>
          </div>

          {/* Alerts and Notifications */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                تنبيهات خدمة العملاء ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length > 0 ? alerts.map((alert, index) => {
                  const Icon = alert.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-4 p-4 rounded-lg border-r-4 ${
                        alert.color === 'red' ? 'bg-red-50 border-red-500' :
                        alert.color === 'orange' ? 'bg-orange-50 border-orange-500' :
                        alert.color === 'blue' ? 'bg-blue-50 border-blue-500' :
                        'bg-green-50 border-green-500'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        alert.color === 'red' ? 'bg-red-100' :
                        alert.color === 'orange' ? 'bg-orange-100' :
                        alert.color === 'blue' ? 'bg-blue-100' :
                        'bg-green-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          alert.color === 'red' ? 'text-red-600' :
                          alert.color === 'orange' ? 'text-orange-600' :
                          alert.color === 'blue' ? 'text-blue-600' :
                          'text-green-600'
                        }`} />
                  </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{alert.description}</p>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
                  </div>
                  );
                }) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="text-lg font-medium text-green-600">الوضع مستقر!</p>
                    <p className="text-sm text-gray-600">جميع العملاء يتلقون خدمة ممتازة</p>
                  </div>
                )}
                </div>
            </CardContent>
          </Card>
              </div>
      )}

      {/* Team Performance Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Team Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">فريق خدمة العملاء</p>
                    <p className="text-3xl font-bold text-blue-600">{users.filter(isRegularEmployee).length}</p>
                  </div>
                  <Users className="h-12 w-12 text-blue-500" />
                </div>
            </CardContent>
          </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">التفاعلات اليوم</p>
                    <p className="text-3xl font-bold text-green-600">{totalInteractions}</p>
        </div>
                  <MessageSquare className="h-12 w-12 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">المتابعات المكتملة</p>
                    <p className="text-3xl font-bold text-purple-600">{completedFollowUps}</p>
                </div>
                  <CheckCircle className="h-12 w-12 text-purple-500" />
                    </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                    <p className="text-sm font-medium text-gray-600">متوسط الاستجابة</p>
                    <p className="text-3xl font-bold text-orange-600">{avgResponseTime}ساعة</p>
                    </div>
                  <Clock className="h-12 w-12 text-orange-500" />
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Performance Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                أداء فريق خدمة العملاء ({teamPerformance.length} موظف)
              </CardTitle>
                      <Button 
                onClick={() => exportReport('team')}
                        size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير تقرير الفريق
                      </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الموظف</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">💰 صفقات</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">📈 تحويلات</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">✅ تفاعلات إيجابية</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">⏰ متابعات في الوقت</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">⭐ تقييم 5 نجوم</th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-700 bg-blue-50">⚡ إجمالي النقاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance.map((member, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{member.avatar}</div>
                            <div>
                              <p className="font-medium text-gray-900">{member.name}</p>
                              <p className="text-sm text-gray-600">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {member.sales || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {member.conversions || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {member.positiveInteractions || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {member.onTimeFollowUps || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {member.fiveStarRatings || 0}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={`text-lg font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-300 border-2' :
                            index === 1 ? 'bg-gray-100 text-gray-700 border-gray-300 border-2' :
                            index === 2 ? 'bg-orange-100 text-orange-700 border-orange-300 border-2' :
                            member.totalPoints >= 50 ? 'bg-green-100 text-green-700' :
                            member.totalPoints >= 25 ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {index === 0 ? '🥇 ' : index === 1 ? '🥈 ' : index === 2 ? '🥉 ' : ''}
                            {member.totalPoints} نقطة
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* قسم التفاعلات التفصيلية */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                📞 تفاصيل التفاعلات لكل موظف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teamPerformance.slice(0, 5).map((member, memberIndex) => {
                  const allInteractions = (member.allInteractions || []); // عرض كل التفاعلات
                  
                  return (
                    <div key={memberIndex} className="border-b border-gray-200 pb-6 last:border-0">
                      {/* رأس الموظف */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{member.avatar}</div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 text-lg">
                            ⚡ {member.totalPoints} نقطة
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">صفقات</div>
                            <div className="text-xl font-bold text-green-600">{member.sales}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">تحويلات</div>
                            <div className="text-xl font-bold text-blue-600">{member.conversions}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">تفاعلات +</div>
                            <div className="text-xl font-bold text-purple-600">{member.positiveInteractions}</div>
                          </div>
                        </div>
                      </div>

                      {/* كل التفاعلات */}
                      {allInteractions.length > 0 ? (
                        <>
                          <div className="mb-3 flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-5 w-5 text-blue-600" />
                              <span className="font-semibold text-gray-700">جميع التفاعلات:</span>
                              <Badge className="bg-blue-100 text-blue-700 text-base font-bold">
                                {allInteractions.length} تفاعل
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              التفاعلات الإيجابية: <span className="font-bold text-green-600">{member.positiveInteractions}</span> من {allInteractions.length}
                            </div>
                          </div>
                          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                              <tr className="border-b">
                                <th className="text-right py-2 px-3 text-gray-600">#</th>
                                <th className="text-right py-2 px-3 text-gray-600">التاريخ</th>
                                <th className="text-right py-2 px-3 text-gray-600">اسم العميل</th>
                                <th className="text-right py-2 px-3 text-gray-600">النوع</th>
                                <th className="text-right py-2 px-3 text-gray-600">الوصف</th>
                                <th className="text-right py-2 px-3 text-gray-600">النتيجة</th>
                                <th className="text-center py-2 px-3 text-gray-600">النقاط</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allInteractions.map((interaction, intIndex) => {
                                const isPositive = interaction.outcome && (
                                  interaction.outcome.toLowerCase().includes('interest') ||
                                  interaction.outcome.toLowerCase().includes('agreed') ||
                                  interaction.outcome.toLowerCase().includes('موافق') ||
                                  interaction.outcome.toLowerCase().includes('مهتم') ||
                                  interaction.outcome.toLowerCase().includes('ناجح')
                                );
                                const interactionDate = new Date(interaction.createdAt);
                                
                                // جلب اسم العميل
                                let clientName = 'غير محدد';
                                if (interaction.itemType === 'client' || interaction.itemType === 'Client') {
                                  const client = clients.find(c => c.id === parseInt(interaction.itemId));
                                  clientName = client?.name || 'عميل غير موجود';
                                } else if (interaction.itemType === 'lead' || interaction.itemType === 'Lead') {
                                  const lead = leads.find(l => l.id === parseInt(interaction.itemId));
                                  clientName = lead?.name || 'عميل محتمل غير موجود';
                                }
                                
                                return (
                                  <tr key={intIndex} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-3 text-gray-600">{intIndex + 1}</td>
                                    <td className="py-2 px-3 text-gray-700">
                                      {interactionDate.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' })}
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {interactionDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center gap-1">
                                        <span className="text-gray-700 font-medium">{clientName}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {interaction.itemType === 'lead' || interaction.itemType === 'Lead' ? '🔵 محتمل' : '🟢 عميل'}
                                        </Badge>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <Badge variant="outline" className="text-xs">
                                        {interaction.type === 'call' ? '📞 مكالمة' :
                                         interaction.type === 'meeting' ? '🤝 اجتماع' :
                                         interaction.type === 'email' ? '📧 إيميل' :
                                         interaction.type === 'whatsapp' ? '💬 واتساب' :
                                         '📝 ' + interaction.type}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3 text-gray-700 max-w-xs">
                                      <div className="space-y-1">
                                        {interaction.title && (
                                          <div className="font-semibold text-sm text-gray-800">{interaction.title}</div>
                                        )}
                                        <div className="text-xs text-gray-600 line-clamp-2">
                                          {interaction.description || 'لا توجد تفاصيل'}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3">
                                      <Badge className={isPositive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                                        {isPositive ? '✅ ' : '⏳ '}
                                        {interaction.outcome || 'غير محدد'}
                                      </Badge>
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-gray-400'}`}>
                                        {isPositive ? '+1' : '+0'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        </>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>لا توجد تفاعلات مسجلة بعد</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Interactions Tab */}
      {activeTab === 'interactions' && (
        <div className="space-y-6">
          {/* Interaction Type Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">نشط</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">المكالمات الهاتفية</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">{Math.floor(totalInteractions * 0.6)}</p>
                <p className="text-sm text-gray-600">مكالمة اليوم</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">ممتاز</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">الرسائل الإلكترونية</h3>
                <p className="text-3xl font-bold text-green-600 mb-2">{Math.floor(totalInteractions * 0.25)}</p>
                <p className="text-sm text-gray-600">رسالة مرسلة</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">جيد</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">الزيارات الميدانية</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">{Math.floor(totalInteractions * 0.1)}</p>
                <p className="text-sm text-gray-600">زيارة مجدولة</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">متوسط</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">الرسائل المباشرة</h3>
                <p className="text-3xl font-bold text-orange-600 mb-2">{Math.floor(totalInteractions * 0.05)}</p>
                <p className="text-sm text-gray-600">رسالة فورية</p>
              </CardContent>
            </Card>
          </div>

          {/* Interaction Quality Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  جودة التفاعل مع العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: 'معدل الرد السريع (< ساعة)', value: 89, target: 90, color: 'bg-blue-500' },
                    { metric: 'رضا العملاء بعد التفاعل', value: 94, target: 95, color: 'bg-green-500' },
                    { metric: 'حل المشاكل من أول مرة', value: 78, target: 85, color: 'bg-orange-500' },
                    { metric: 'متابعة مابعد الخدمة', value: 67, target: 80, color: 'bg-red-500' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.metric}</span>
                        <span className={`font-semibold ${
                          item.value >= item.target ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {item.value}% / {item.target}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`${item.color} h-3 rounded-full transition-all duration-1000`}
                          style={{ width: `${item.value}%` }}
                        ></div>
                  </div>
                </div>
              ))}
            </div>
            </CardContent>
          </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  أوقات الاستجابة التفصيلية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">1.2ساعة</p>
                      <p className="text-sm text-gray-600">متوسط الرد على المكالمات</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">2.1ساعة</p>
                      <p className="text-sm text-gray-600">متوسط الرد على الإيميلات</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">24ساعة</p>
                      <p className="text-sm text-gray-600">متوسط جدولة الزيارات</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-600">15دقيقة</p>
                      <p className="text-sm text-gray-600">متوسط الرد الفوري</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">التطوير المطلوب:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• تحسين سرعة الرد على الإيميلات</li>
                      <li>• زيادة معدل حل المشاكل من أول مرة</li>
                      <li>• تعزيز برنامج المتابعة بعد الخدمة</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          {/* Service Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge className={totalInteractions >= 100 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {totalInteractions >= 100 ? 'مُحقق' : 'في التقدم'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">هدف التفاعل اليومي</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الحالي: {totalInteractions}</span>
                    <span>الهدف: 150</span>
              </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((totalInteractions / 150) * 100, 100)}%` }}
                    ></div>
            </div>
                  <p className="text-xs text-gray-500">
                    {totalInteractions >= 150 ? 'تم تجاوز الهدف!' : `${((totalInteractions / 150) * 100).toFixed(1)}% من الهدف`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <Badge className={completedFollowUps >= 30 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                    {completedFollowUps >= 30 ? 'مُحقق' : 'في التقدم'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">هدف المتابعات</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>مكتمل: {completedFollowUps}</span>
                    <span>الهدف: 40</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((completedFollowUps / 40) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {completedFollowUps >= 40 ? 'تم تجاوز الهدف!' : `يتبقى ${40 - completedFollowUps} متابعة`}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700">مُحقق</Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">هدف رضا العملاء</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الحالي: 4.7/5</span>
                    <span>الهدف: 4.5/5</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((4.7 / 4.5) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">تم تجاوز الهدف بنجاح!</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Employee Goals */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                أهداف الموظفين الفردية لخدمة العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b border-gray-200">
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">الموظف</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">هدف التفاعل</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">هدف المتابعة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">هدف الاستجابة</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">التقييم العام</th>
                </tr>
              </thead>
              <tbody>
                    {teamPerformance.slice(0, 5).map((member, index) => {
                      const interactionTarget = 20;
                      const followUpTarget = 8;
                      const responseTarget = 90;
                      
                      const interactionProgress = (member.interactions / interactionTarget) * 100;
                      const followUpProgress = (member.followUps / followUpTarget) * 100;
                      const responseProgress = member.completionRate;
                      const averageProgress = (interactionProgress + followUpProgress + responseProgress) / 3;

                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{member.avatar}</div>
                              <div>
                                <p className="font-medium text-gray-900">{member.name}</p>
                                <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{member.interactions}/{interactionTarget}</span>
                                <span>{Math.round(interactionProgress)}%</span>
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(interactionProgress, 100)}%` }}
                                ></div>
                        </div>
                      </div>
                    </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{member.followUps}/{followUpTarget}</span>
                                <span>{Math.round(followUpProgress)}%</span>
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(followUpProgress, 100)}%` }}
                                ></div>
                              </div>
                      </div>
                    </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{member.completionRate}%</span>
                                <span>{responseTarget}%</span>
                              </div>
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(responseProgress, 100)}%` }}
                                ></div>
                              </div>
                      </div>
                    </td>
                          <td className="py-4 px-4">
                            <Badge className={
                              averageProgress >= 80 ? 'bg-green-100 text-green-700' :
                              averageProgress >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {averageProgress >= 80 ? 'ممتاز' : averageProgress >= 60 ? 'جيد' : 'يحتاج تطوير'}
                      </Badge>
                    </td>
                  </tr>
                      );
                    })}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
                  onClick={() => exportReport('team')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                </div>
                  <Download className="h-5 w-5 text-gray-400" />
            </div>
                <h3 className="font-semibold text-gray-900 mb-2">تقرير أداء الموظفين</h3>
                <p className="text-gray-600 text-sm mb-4">تحليل مفصل لأداء كل موظف في خدمة العملاء</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">جاهز للتحميل</span>
                  <span className="text-xs text-gray-500">{formatDateArabic(new Date())}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
                  onClick={() => exportReport('interactions')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">تقرير التفاعل مع العملاء</h3>
                <p className="text-gray-600 text-sm mb-4">إحصائيات شاملة للتفاعل والتواصل</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">جاهز للتحميل</span>
                  <span className="text-xs text-gray-500">{formatDateArabic(new Date())}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
                  onClick={() => exportReport('followups')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <CalendarCheck className="h-6 w-6 text-purple-600" />
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">تقرير المتابعات</h3>
                <p className="text-gray-600 text-sm mb-4">تتبع المتابعات والمواعيد المجدولة</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">جاهز للتحميل</span>
                  <span className="text-xs text-gray-500">{formatDateArabic(new Date())}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
                  onClick={() => exportReport('satisfaction')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">تقرير رضا العملاء</h3>
                <p className="text-gray-600 text-sm mb-4">تقييمات العملاء وجودة الخدمة</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">جاهز للتحميل</span>
                  <span className="text-xs text-gray-500">{formatDateArabic(new Date())}</span>
            </div>
          </CardContent>
        </Card>

            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
                  onClick={() => exportReport('response_times')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-600" />
      </div>
                  <Download className="h-5 w-5 text-gray-400" />
    </div>
                <h3 className="font-semibold text-gray-900 mb-2">تقرير أوقات الاستجابة</h3>
                <p className="text-gray-600 text-sm mb-4">تحليل سرعة الاستجابة والكفاءة</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">جاهز للتحميل</span>
                  <span className="text-xs text-gray-500">{formatDateArabic(new Date())}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" 
                  onClick={() => exportReport('executive')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <BarChart3 className="h-6 w-6 text-red-600" />
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">التقرير التنفيذي الشامل</h3>
                <p className="text-gray-600 text-sm mb-4">ملخص عام لجميع مؤشرات الأداء</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 font-medium">جاهز للتحميل</span>
                  <span className="text-xs text-gray-500">{formatDateArabic(new Date())}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Data Summary */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                ملخص البيانات الحالية لخدمة العملاء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">الإحصائيات الرئيسية</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">فريق خدمة العملاء:</span>
                      <span className="font-semibold text-blue-600">{users.filter(isRegularEmployee).length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">إجمالي العملاء:</span>
                      <span className="font-semibold text-green-600">{clients.length}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">التفاعلات اليوم:</span>
                      <span className="font-semibold text-purple-600">{totalInteractions}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">المتابعات المكتملة:</span>
                      <span className="font-semibold text-green-600">{completedFollowUps}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600">المتابعات المعلقة:</span>
                      <span className="font-semibold text-orange-600">{pendingFollowUps}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">متوسط وقت الاستجابة:</span>
                      <span className="font-semibold text-blue-600">{avgResponseTime} ساعة</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">أفضل موظفي خدمة العملاء</h4>
                  <div className="space-y-3">
                    {teamPerformance.slice(0, 5).map((member, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg">{member.avatar}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.leads} محتمل - {member.leadInteractions} تفاعل محتمل - {member.clientInteractions} تفاعل عميل</p>
                        </div>
                        <Badge className={
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">ملاحظات الأداء:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• الفريق يحقق معدل استجابة ممتاز</li>
                      <li>• جودة التفاعل مع العملاء في تحسن مستمر</li>
                      <li>• يُنصح بزيادة التركيز على المتابعة</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;