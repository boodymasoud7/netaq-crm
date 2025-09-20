import React from 'react';
import { Card, CardContent } from '../ui/card';
import { 
  Users, 
  Building2, 
  Target, 
  DollarSign, 
  Briefcase, 
  CheckSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const StatsCards = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // If no data, show empty state
  if (!data || !data.overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="bg-white border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="text-xs text-gray-400">--</div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">لا توجد بيانات</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-400">يرجى إضافة البيانات</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'إجمالي العملاء',
      value: data?.overview?.totalClients || 0,
      icon: Building2,
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600',
      growth: data?.growth?.clientsGrowth || '0',
      subtitle: `${data?.metrics?.newClientsThisMonth || 0} جديد هذا الشهر`
    },
    {
      title: 'العملاء المحتملين',
      value: data?.overview?.totalLeads || 0,
      icon: Target,
      color: 'purple',
      bgColor: 'from-purple-500 to-purple-600',
      growth: data?.growth?.leadsGrowth || '0',
      subtitle: `${data?.metrics?.newLeadsToday || 0} جديد اليوم`
    },
    {
      title: 'إجمالي المبيعات',
      value: data?.overview?.totalSales || 0,
      icon: DollarSign,
      color: 'green',
      bgColor: 'from-green-500 to-green-600',
      growth: data?.growth?.salesGrowth || '0',
      subtitle: `${data?.metrics?.salesThisMonth || 0} هذا الشهر`
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${(data?.overview?.totalRevenue || 0).toLocaleString('ar-EG')} ج.م`,
      icon: DollarSign,
      color: 'emerald',
      bgColor: 'from-emerald-500 to-emerald-600',
      growth: data?.growth?.revenueGrowth || '0',
      subtitle: `${(data?.metrics?.monthlyRevenue || 0).toLocaleString('ar-EG')} ج.م هذا الشهر`,
      isRevenue: true
    },
    {
      title: 'فريق المبيعات',
      value: data?.overview?.salesTeam || 0,
      icon: Users,
      color: 'indigo',
      bgColor: 'from-indigo-500 to-indigo-600',
      growth: '+0',
      subtitle: `${data?.overview?.activeUsers || 0} موظف نشط`
    },
    {
      title: 'المشاريع',
      value: data?.overview?.totalProjects || 0,
      icon: Briefcase,
      color: 'orange',
      bgColor: 'from-orange-500 to-orange-600',
      growth: '+0',
      subtitle: `معدل الإنجاز ${data?.metrics?.projectCompletionRate || 0}%`
    },
    {
      title: 'المهام',
      value: data?.overview?.totalTasks || 0,
      icon: CheckSquare,
      color: 'teal',
      bgColor: 'from-teal-500 to-teal-600',
      growth: '+0',
      subtitle: `${data?.metrics?.pendingTasks || 0} قيد التنفيذ`
    },
    {
      title: 'معدل التحويل',
      value: `${data?.metrics?.conversionRate || 0}%`,
      icon: TrendingUp,
      color: 'rose',
      bgColor: 'from-rose-500 to-rose-600',
      growth: '+0',
      subtitle: 'عملاء محتملين إلى عملاء'
    }
  ];

  const getGrowthIcon = (growth) => {
    const numGrowth = parseFloat(growth.replace('%', '').replace('+', ''));
    return numGrowth > 0 ? ArrowUpRight : numGrowth < 0 ? ArrowDownRight : TrendingUp;
  };

  const getGrowthColor = (growth) => {
    const numGrowth = parseFloat(growth.replace('%', '').replace('+', ''));
    return numGrowth > 0 ? 'text-green-600 bg-green-100' : 
           numGrowth < 0 ? 'text-red-600 bg-red-100' : 
           'text-gray-600 bg-gray-100';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const GrowthIcon = getGrowthIcon(card.growth);
        
        return (
          <Card 
            key={index} 
            className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 overflow-hidden"
          >
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${card.bgColor} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-white/80 text-sm font-medium">{card.title}</p>
                    <p className="text-2xl font-bold">
                      {card.isRevenue ? card.value : card.value.toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">{card.subtitle}</p>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getGrowthColor(card.growth)}`}>
                    <GrowthIcon className="h-3 w-3" />
                    {card.growth}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
