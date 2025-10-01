import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, MessageSquare, Target, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateArabic } from '../../lib/utils';

const FollowUpsWidget = ({ className = "" }) => {
  const [todayFollowUps, setTodayFollowUps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchTodayFollowUps();
    fetchStats();
  }, [currentUser?.id]); // إعادة تحميل البيانات عند تغيير المستخدم

  const fetchTodayFollowUps = async () => {
    try {
      // فلترة متابعات اليوم - المدير يرى كل المتابعات، الموظف يرى متابعاته فقط
      const filterParams = {};
      
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'admin' && currentUser?.id) {
        filterParams.assignedTo = currentUser.id;
      }
      
      const response = await api.getTodayFollowUps(filterParams);
      if (response.success) {
        setTodayFollowUps(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching today follow-ups:', error);
      setError('فشل في تحميل متابعات اليوم');
    }
  };

  const fetchStats = async () => {
    try {
      // فلترة الإحصائيات - المدير يرى كل الإحصائيات، الموظف يرى إحصائياته فقط
      const filterParams = {};
      
      if (currentUser?.role !== 'manager' && currentUser?.role !== 'admin' && currentUser?.id) {
        filterParams.assignedTo = currentUser.id;
      }
      
      const response = await api.getFollowUpStats(filterParams);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching follow-up stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      call: Phone,
      whatsapp: MessageSquare,
      email: MessageSquare,
      meeting: Calendar,
      demo: Target,
      visit: Target
    };
    return icons[type] || Calendar;
  };

  const getTypeColor = (type) => {
    const colors = {
      call: 'text-blue-500',
      whatsapp: 'text-green-500',
      email: 'text-red-500',
      meeting: 'text-purple-500',
      demo: 'text-indigo-500',
      visit: 'text-orange-500'
    };
    return colors[type] || 'text-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatTimeUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return 'متأخر';
    } else if (diffHours < 1) {
      return 'الآن';
    } else if (diffHours < 24) {
      return `خلال ${diffHours} ساعة`;
    }
    return formatDateArabic(date);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 ml-2" />
            متابعات اليوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 rtl:space-x-reverse animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Calendar className="w-5 h-5 ml-2" />
            متابعات اليوم
          </CardTitle>
          {stats && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <span className="text-blue-600 font-medium">
                {stats.today?.pending || 0}
              </span>
              <span className="text-gray-500">متبقية</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {error ? (
          <div className="text-center py-4 text-red-600 text-sm">
            {error}
          </div>
        ) : todayFollowUps.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">لا توجد متابعات لليوم</p>
            <p className="text-xs text-gray-400 mt-1">جميع المهام مكتملة!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayFollowUps.slice(0, 5).map((followUp) => {
              const TypeIcon = getTypeIcon(followUp.type);
              const typeColor = getTypeColor(followUp.type);
              
              return (
                <div
                  key={followUp.id}
                  className="flex items-start space-x-3 rtl:space-x-reverse p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <div className={`p-2 rounded-lg bg-gray-50 ${typeColor}`}>
                    <TypeIcon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm truncate">
                          {followUp.title}
                        </h4>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mt-1">
                          {followUp.lead && (
                            <span className="text-xs text-gray-600">
                              {followUp.lead.name}
                            </span>
                          )}
                          {followUp.client && (
                            <span className="text-xs text-gray-600">
                              {followUp.client.name}
                            </span>
                          )}
                          <Badge className={`text-xs ${getPriorityColor(followUp.priority)}`}>
                            {followUp.priority === 'urgent' ? 'عاجل' :
                             followUp.priority === 'high' ? 'عالية' :
                             followUp.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right text-xs text-gray-500">
                        <Clock className="w-3 h-3 inline ml-1" />
                        {formatTimeUntil(followUp.scheduledDate)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {todayFollowUps.length > 5 && (
              <div className="pt-2 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-blue-600 hover:text-blue-700"
                  onClick={() => window.location.href = '/follow-ups'}
                >
                  عرض المزيد ({todayFollowUps.length - 5})
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Quick stats */}
        {stats && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {stats.today?.total || 0}
                </div>
                <div className="text-xs text-gray-500">إجمالي</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {stats.today?.completed || 0}
                </div>
                <div className="text-xs text-gray-500">مكتملة</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {stats.overdue || 0}
                </div>
                <div className="text-xs text-gray-500">متأخرة</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick action */}
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.location.href = '/follow-ups'}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة متابعة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowUpsWidget;



