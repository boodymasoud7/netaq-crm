// خدمة إشعارات المتابعات
// ربط نظام المتابعات بنظام الإشعارات

class FollowUpNotificationService {
  constructor() {
    this.notificationContext = null
  }

  // تعيين سياق الإشعارات
  setNotificationContext(context) {
    this.notificationContext = context
  }

  // إشعار عند إنشاء متابعة جديدة
  notifyFollowUpCreated(followUp, assignedUser) {
    if (!this.notificationContext) return

    const notification = {
      type: 'info',
      icon: '📋',
      title: 'متابعة جديدة',
      message: `تم إنشاء متابعة جديدة: ${followUp.title}`,
      data: {
        followUpId: followUp.id,
        type: 'followup_created',
        assignedTo: assignedUser?.id,
        scheduledDate: followUp.scheduledDate
      },
      actions: [
        {
          label: 'عرض المتابعة',
          action: () => this.navigateToFollowUp(followUp.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('📋 Follow-up creation notification sent:', followUp.title)
    
    // إشعار المدير أيضاً إذا كان المنشئ موظف
    if (assignedUser?.role !== 'manager' && assignedUser?.role !== 'admin') {
      this.notifyManagerAboutNewFollowUp(followUp, assignedUser)
    }
  }

  // إشعار المدير عند إنشاء متابعة جديدة من موظف
  notifyManagerAboutNewFollowUp(followUp, createdBy) {
    if (!this.notificationContext) return

    const notification = {
      type: 'info',
      icon: '👨‍💼',
      title: 'متابعة جديدة من الفريق',
      message: `${createdBy?.name || 'موظف'} أنشأ متابعة جديدة: ${followUp.title}`,
      priority: 'normal',
      data: {
        followUpId: followUp.id,
        type: 'manager_new_followup_alert',
        createdBy: createdBy?.id
      },
      actions: [
        {
          label: 'عرض المتابعة',
          action: () => this.navigateToFollowUp(followUp.id)
        },
        {
          label: 'عرض متابعات الموظف',
          action: () => this.viewEmployeeFollowUps(createdBy?.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('👨‍💼 Manager notification sent for new follow-up by:', createdBy?.name)
  }

  // إشعار عند حلول موعد المتابعة (قبل 30 دقيقة)
  notifyFollowUpDue(followUp, assignedUser) {
    if (!this.notificationContext) return

    const notification = {
      type: 'warning',
      icon: '⏰',
      title: 'موعد المتابعة قريب',
      message: `متابعة "${followUp.title}" مجدولة خلال 30 دقيقة`,
      priority: 'high',
      data: {
        followUpId: followUp.id,
        type: 'followup_due',
        assignedTo: assignedUser?.id
      },
      actions: [
        {
          label: 'بدء المتابعة',
          action: () => this.startFollowUp(followUp.id)
        },
        {
          label: 'تأجيل',
          action: () => this.postponeFollowUp(followUp.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('⏰ Follow-up due notification sent:', followUp.title)
  }

  // إشعار عند تأخر المتابعة
  notifyFollowUpOverdue(followUp, assignedUser) {
    if (!this.notificationContext) return

    const notification = {
      type: 'error',
      icon: '🚨',
      title: 'متابعة متأخرة',
      message: `متابعة "${followUp.title}" متأخرة عن موعدها`,
      priority: 'urgent',
      data: {
        followUpId: followUp.id,
        type: 'followup_overdue',
        assignedTo: assignedUser?.id
      },
      actions: [
        {
          label: 'إكمال الآن',
          action: () => this.completeFollowUp(followUp.id)
        },
        {
          label: 'إعادة جدولة',
          action: () => this.rescheduleFollowUp(followUp.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('🚨 Follow-up overdue notification sent:', followUp.title)
  }

  // إشعار عند إكمال المتابعة
  notifyFollowUpCompleted(followUp, completedBy, result) {
    if (!this.notificationContext) return

    const notification = {
      type: 'success',
      icon: '✅',
      title: 'تم إكمال المتابعة',
      message: `تم إكمال متابعة "${followUp.title}" بنجاح`,
      data: {
        followUpId: followUp.id,
        type: 'followup_completed',
        completedBy: completedBy?.id,
        result: result
      },
      actions: [
        {
          label: 'عرض النتيجة',
          action: () => this.viewFollowUpResult(followUp.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('✅ Follow-up completion notification sent:', followUp.title)
    
    // إشعار المدير ومدير المبيعات عند إكمال أي متابعة من موظفي المبيعات
    console.log('🔍 Checking if manager notification needed:', {
      completedByRole: completedBy?.role,
      completedByName: completedBy?.name,
      shouldNotify: completedBy?.role === 'sales' || completedBy?.role === 'sales_agent'
    })
    
    if (completedBy?.role === 'sales' || completedBy?.role === 'sales_agent') {
      console.log('📤 Sending manager notification for completed follow-up...')
      // استخدام الطريقة المبسطة مباشرة
      setTimeout(() => {
        this.fallbackManagerNotification(followUp, completedBy, result)
      }, 500) // تأخير بسيط للتأكد من تحديث البيانات
    }
  }

  // إشعار المدير ومدير المبيعات عند إكمال متابعة من موظفي المبيعات
  async notifyManagerAboutCompletedFollowUp(followUp, completedBy, result) {
    if (!this.notificationContext) return

    try {
      // جلب جميع المستخدمين وفلترة المديرين
      const { default: api } = await import('../lib/realApi')
      const usersResponse = await api.getUsers()

      console.log('👥 Users API response:', usersResponse)

      if (!usersResponse.success || !usersResponse.data) {
        console.warn('⚠️ Could not fetch users for notification')
        // استخدام طريقة بديلة - إرسال للمستخدم الحالي إذا كان مديراً
        return this.fallbackManagerNotification(followUp, completedBy, result)
      }

      const managers = usersResponse.data.filter(user => 
        user.role === 'admin' || user.role === 'sales_manager'
      )

      console.log('👨‍💼 Managers found:', managers.map(m => ({ name: m.name, role: m.role })))

      if (managers.length === 0) {
        console.warn('⚠️ No managers found to notify')
        // استخدام طريقة بديلة
        return this.fallbackManagerNotification(followUp, completedBy, result)
      }

      const isPositiveResult = result?.includes('مهتم') || result?.includes('تحويل')
      const icon = isPositiveResult ? '🎉' : '✅'
      const type = isPositiveResult ? 'success' : 'info'
      
      // تحديد العنوان بناءً على النتيجة
      let title = 'متابعة مكتملة من الفريق'
      if (isPositiveResult) {
        title = 'نتيجة إيجابية من الفريق!'
      }

      // جلب اسم العميل من بيانات المتابعة المثراة
      const clientName = followUp.lead?.name || followUp.client?.name || followUp.leadName || followUp.clientName || 'عميل غير محدد'
      
      const notification = {
        type: type,
        icon: icon,
        title: title,
        message: `الموظف: ${completedBy?.name || 'غير محدد'}\nالعميل: ${clientName}\nالمتابعة: ${followUp.title}${result ? `\nالنتيجة: ${result}` : ''}`,
        priority: isPositiveResult ? 'high' : 'normal',
        targetRoles: ['admin', 'sales_manager'], // تحديد الأدوار المستهدفة
        targetUsers: managers.map(m => m.id), // تحديد المستخدمين المستهدفين
        data: {
          followUpId: followUp.id,
          type: 'manager_completion_alert',
          completedBy: completedBy?.id,
          employeeName: completedBy?.name,
          clientName: clientName,
          result: result,
          isManagerNotification: true
        },
        actions: [
          {
            label: 'عرض تفاصيل المتابعة',
            action: () => this.navigateToFollowUp(followUp.id)
          },
          {
            label: 'عرض أداء الموظف',
            action: () => this.viewEmployeeFollowUps(completedBy?.id)
          }
        ]
      }

      // إرسال الإشعار (سيتم فلترته في NotificationContext حسب الدور)
      console.log('📤 Attempting to send notification with targets:', {
        targetRoles: notification.targetRoles,
        targetUsers: notification.targetUsers,
        managersFound: managers.length
      })
      
      this.notificationContext.addNotification(notification)
      
      console.log('👨‍💼 Manager notification sent successfully to:', managers.length, 'managers')
      console.log('📊 Notification details:', {
        employeeName: completedBy?.name,
        employeeRole: completedBy?.role,
        followUpTitle: followUp.title,
        result: result,
        notificationType: type,
        priority: notification.priority,
        managersNotified: managers.map(m => m.name)
      })

    } catch (error) {
      console.error('❌ Error sending manager notification:', error)
      // استخدام طريقة بديلة عند فشل API
      this.fallbackManagerNotification(followUp, completedBy, result)
    }
  }

  // طريقة بديلة لإرسال إشعار المدير (بدون فلترة معقدة)
  fallbackManagerNotification(followUp, completedBy, result) {
    if (!this.notificationContext) {
      console.error('❌ No notification context available')
      return
    }

    console.log('🔄 Using fallback manager notification method')
    console.log('📊 Follow-up data available:', {
      followUpTitle: followUp.title,
      completedByName: completedBy?.name,
      completedByRole: completedBy?.role,
      result: result,
      leadData: followUp.lead,
      clientData: followUp.client,
      leadName: followUp.leadName,
      clientName: followUp.clientName,
      leadId: followUp.leadId,
      clientId: followUp.clientId
    })

    const isPositiveResult = result?.includes('مهتم') || result?.includes('تحويل')
    const icon = isPositiveResult ? '🎉' : '✅'
    const type = isPositiveResult ? 'success' : 'info'
    
    // تحديد العنوان بناءً على النتيجة
    let title = '👨‍💼 متابعة مكتملة من الفريق'
    if (isPositiveResult) {
      title = '🎉 نتيجة إيجابية من الفريق!'
    }

    // جلب اسم العميل من بيانات المتابعة المثراة
    const clientName = followUp.lead?.name || followUp.client?.name || followUp.leadName || followUp.clientName || 'عميل غير محدد'
    
    const notification = {
      type: type,
      icon: icon,
      title: title,
      message: `الموظف: ${completedBy?.name || 'غير محدد'}\nالعميل: ${clientName}\nالمتابعة: ${followUp.title}${result ? `\nالنتيجة: ${result}` : ''}`,
      priority: isPositiveResult ? 'high' : 'normal',
      // إرسال لجميع المستخدمين - سيتم فلترة المديرين في NotificationContext
      targetRoles: ['admin', 'sales_manager'],
      data: {
        followUpId: followUp.id,
        type: 'manager_completion_alert',
        completedBy: completedBy?.id,
        employeeName: completedBy?.name,
        clientName: clientName,
        result: result,
        isManagerNotification: true,
        isFallback: true
      },
      actions: [
        {
          label: 'عرض تفاصيل المتابعة',
          action: () => this.navigateToFollowUp(followUp.id)
        },
        {
          label: 'عرض أداء الموظف',
          action: () => this.viewEmployeeFollowUps(completedBy?.id)
        }
      ]
    }

    console.log('📤 About to send notification:', notification)

    // إرسال الإشعار
    try {
      this.notificationContext.addNotification(notification)
      console.log('✅ Fallback manager notification sent successfully')
      
      // إرسال إشعار اختبار إضافي (بدون فلترة)
      this.notificationContext.addNotification({
        type: 'info',
        icon: '🔔',
        title: 'اختبار إشعار المدير',
        message: `تم إرسال إشعار للمدير عن إكمال متابعة من ${completedBy?.name}`,
        priority: 'normal'
      })
      console.log('📢 Test notification sent without filtering')
      
    } catch (error) {
      console.error('❌ Error sending fallback notification:', error)
    }
  }

  // إشعار عند تعديل موعد المتابعة
  notifyFollowUpRescheduled(followUp, oldDate, newDate, rescheduledBy) {
    if (!this.notificationContext) return

    const notification = {
      type: 'info',
      icon: '📅',
      title: 'تم تعديل موعد المتابعة',
      message: `تم تغيير موعد متابعة "${followUp.title}"`,
      data: {
        followUpId: followUp.id,
        type: 'followup_rescheduled',
        oldDate: oldDate,
        newDate: newDate,
        rescheduledBy: rescheduledBy?.id
      },
      actions: [
        {
          label: 'عرض الموعد الجديد',
          action: () => this.navigateToFollowUp(followUp.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('📅 Follow-up reschedule notification sent:', followUp.title)
  }

  // إشعار للمدير عند تأخر موظف في المتابعات
  notifyManagerAboutOverdueFollowUps(employee, overdueCount) {
    if (!this.notificationContext) return

    const notification = {
      type: 'warning',
      icon: '👨‍💼',
      title: 'متابعات متأخرة',
      message: `الموظف ${employee.name} لديه ${overdueCount} متابعات متأخرة`,
      priority: 'high',
      data: {
        type: 'manager_overdue_alert',
        employeeId: employee.id,
        overdueCount: overdueCount
      },
      actions: [
        {
          label: 'عرض المتابعات',
          action: () => this.viewEmployeeFollowUps(employee.id)
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('👨‍💼 Manager overdue alert sent for:', employee.name)
  }

  // إشعار يومي بملخص المتابعات
  notifyDailyFollowUpSummary(user, todayCount, overdueCount, completedCount) {
    if (!this.notificationContext) return

    const notification = {
      type: 'info',
      icon: '📊',
      title: 'ملخص المتابعات اليومي',
      message: `اليوم: ${todayCount} متابعات، متأخرة: ${overdueCount}، مكتملة: ${completedCount}`,
      data: {
        type: 'daily_summary',
        userId: user.id,
        todayCount,
        overdueCount,
        completedCount
      },
      actions: [
        {
          label: 'عرض المتابعات',
          action: () => this.navigateToFollowUps()
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('📊 Daily summary notification sent to:', user.name)
  }

  // دوال المساعدة للتنقل والإجراءات
  navigateToFollowUp(followUpId) {
    window.location.href = `/follow-ups?highlight=${followUpId}`
  }

  navigateToFollowUps() {
    window.location.href = '/follow-ups'
  }

  startFollowUp(followUpId) {
    // فتح مودال بدء المتابعة
    console.log('Starting follow-up:', followUpId)
  }

  completeFollowUp(followUpId) {
    // فتح مودال إكمال المتابعة
    console.log('Completing follow-up:', followUpId)
  }

  postponeFollowUp(followUpId) {
    // فتح مودال تأجيل المتابعة
    console.log('Postponing follow-up:', followUpId)
  }

  rescheduleFollowUp(followUpId) {
    // فتح مودال إعادة جدولة المتابعة
    console.log('Rescheduling follow-up:', followUpId)
  }

  viewFollowUpResult(followUpId) {
    // عرض نتيجة المتابعة
    console.log('Viewing follow-up result:', followUpId)
  }

  viewEmployeeFollowUps(employeeId) {
    // عرض متابعات الموظف للمدير
    window.location.href = `/follow-ups?employee=${employeeId}`
  }

  // فحص المتابعات المستحقة والمتأخرة (يتم استدعاؤها دورياً)
  async checkFollowUpsDue() {
    console.log('🔍 Due follow-ups check is disabled')
    return // تعطيل هذا الفحص مؤقتاً
    
    try {
      console.log('🔍 Checking for due follow-ups...')
      
      // استيراد الـ API
      const { default: api } = await import('../lib/realApi')
      
      // التحقق من وجود الدالة قبل استدعائها
      if (typeof api.getDueFollowUps !== 'function') {
        console.warn('⚠️ getDueFollowUps function not available')
        return
      }
      
      const response = await api.getDueFollowUps()
      if (response.success && response.data?.length > 0) {
        response.data.forEach(followUp => {
          this.notifyFollowUpDue(followUp, followUp.assignedUser)
        })
        console.log(`⏰ Found ${response.data.length} due follow-ups`)
      }
      
    } catch (error) {
      console.error('Error checking due follow-ups:', error)
    }
  }

  // فحص المتابعات المتأخرة - معطل مؤقتاً
  async checkOverdueFollowUps() {
    console.log('🔍 Overdue follow-ups check is disabled')
    return // تعطيل هذا الفحص مؤقتاً
    
    try {
      console.log('🔍 Checking for overdue follow-ups...')
      
      // استيراد الـ API
      const { default: api } = await import('../lib/realApi')
      
      const response = await api.getOverdueFollowUps()
      if (response.success && response.data?.length > 0) {
        // إشعار الموظفين بمتابعاتهم المتأخرة
        response.data.forEach(followUp => {
          this.notifyFollowUpOverdue(followUp, followUp.assignedUser)
        })
        
        // إشعار المدير بالموظفين المتأخرين
        await this.notifyManagerAboutOverdueEmployees(response.data)
        
        console.log(`🚨 Found ${response.data.length} overdue follow-ups`)
      }
      
    } catch (error) {
      console.error('Error checking overdue follow-ups:', error)
    }
  }

  // إشعار المدير عن الموظفين المتأخرين في المتابعات
  async notifyManagerAboutOverdueEmployees(overdueFollowUps) {
    try {
      // تجميع المتابعات المتأخرة حسب الموظف
      const employeeOverdueMap = {}
      
      overdueFollowUps.forEach(followUp => {
        const employeeId = followUp.assignedTo
        if (employeeId) {
          if (!employeeOverdueMap[employeeId]) {
            employeeOverdueMap[employeeId] = {
              employee: followUp.assignedUser || { id: employeeId, name: 'موظف غير معروف' },
              count: 0
            }
          }
          employeeOverdueMap[employeeId].count++
        }
      })
      
      // إرسال إشعار للمدير عن كل موظف متأخر
      Object.values(employeeOverdueMap).forEach(({ employee, count }) => {
        if (count > 0) {
          this.notifyManagerAboutOverdueFollowUps(employee, count)
        }
      })
      
      console.log(`👨‍💼 Notified manager about ${Object.keys(employeeOverdueMap).length} employees with overdue follow-ups`)
      
    } catch (error) {
      console.error('Error notifying manager about overdue employees:', error)
    }
  }

  // بدء الفحص الدوري للمتابعات - معطل مؤقتاً
  startPeriodicChecks() {
    console.log('🔄 Periodic follow-up checks are disabled')
    return // تعطيل الفحص الدوري مؤقتاً
    
    // فحص كل 5 دقائق للمتابعات المستحقة
    setInterval(() => {
      this.checkFollowUpsDue()
    }, 5 * 60 * 1000) // 5 دقائق

    // فحص كل 15 دقيقة للمتابعات المتأخرة
    setInterval(() => {
      this.checkOverdueFollowUps()
    }, 15 * 60 * 1000) // 15 دقيقة

    // فحص يومي في الساعة 9 صباحاً لإرسال الملخص اليومي
    const now = new Date()
    const tomorrow9AM = new Date(now)
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1)
    tomorrow9AM.setHours(9, 0, 0, 0)
    
    const timeUntil9AM = tomorrow9AM.getTime() - now.getTime()
    
    setTimeout(() => {
      this.sendDailySummary()
      // ثم كررها كل 24 ساعة
      setInterval(() => {
        this.sendDailySummary()
      }, 24 * 60 * 60 * 1000)
    }, timeUntil9AM)

    // ملخص أسبوعي للمدير كل يوم أحد الساعة 10 صباحاً
    const nextSunday10AM = new Date(now)
    const daysUntilSunday = (7 - now.getDay()) % 7
    nextSunday10AM.setDate(nextSunday10AM.getDate() + daysUntilSunday)
    nextSunday10AM.setHours(10, 0, 0, 0)
    
    const timeUntilSunday = nextSunday10AM.getTime() - now.getTime()
    
    setTimeout(() => {
      this.sendWeeklyManagerSummary()
      // ثم كررها كل أسبوع
      setInterval(() => {
        this.sendWeeklyManagerSummary()
      }, 7 * 24 * 60 * 60 * 1000)
    }, timeUntilSunday)
  }

  // إرسال الملخص اليومي
  async sendDailySummary() {
    try {
      console.log('📊 Sending daily follow-up summary...')
      
      // استيراد الـ API
      const { default: api } = await import('../lib/realApi')
      
      const response = await api.getFollowUpStats()
      if (response.success && response.data) {
        const stats = response.data
        // يتم إرسال الملخص للمستخدم الحالي (سيتم تحديده لاحقاً)
        this.notifyDailyFollowUpSummary(
          { name: 'المستخدم' }, // سيتم تحديث هذا لاحقاً
          stats.today || 0, 
          stats.overdue || 0, 
          stats.completed || 0
        )
      }
      
    } catch (error) {
      console.error('Error sending daily summary:', error)
    }
  }

  // إرسال الملخص الأسبوعي للمدير
  async sendWeeklyManagerSummary() {
    try {
      console.log('📊 Sending weekly manager summary...')
      
      // استيراد الـ API
      const { default: api } = await import('../lib/realApi')
      
      // جلب إحصائيات الأسبوع الماضي
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const response = await api.getFollowUpStats({
        startDate: weekAgo.toISOString(),
        endDate: new Date().toISOString()
      })
      
      if (response.success && response.data) {
        const stats = response.data
        this.notifyWeeklyManagerSummary(stats)
      }
      
    } catch (error) {
      console.error('Error sending weekly manager summary:', error)
    }
  }

  // إشعار الملخص الأسبوعي للمدير
  notifyWeeklyManagerSummary(stats) {
    if (!this.notificationContext) return

    const totalFollowUps = stats.total || 0
    const completedFollowUps = stats.completed || 0
    const overdueFollowUps = stats.overdue || 0
    const completionRate = totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 0

    const notification = {
      type: 'info',
      icon: '📊',
      title: 'التقرير الأسبوعي للمتابعات',
      message: `الأسبوع الماضي: ${completedFollowUps}/${totalFollowUps} متابعة مكتملة (${completionRate}%)`,
      priority: 'high',
      data: {
        type: 'weekly_manager_summary',
        stats: stats
      },
      actions: [
        {
          label: 'عرض التقرير التفصيلي',
          action: () => this.navigateToFollowUps()
        },
        {
          label: 'عرض الأداء',
          action: () => this.viewTeamPerformance()
        }
      ]
    }

    this.notificationContext.addNotification(notification)
    console.log('📊 Weekly manager summary sent')
  }

  // عرض أداء الفريق (للمدير)
  viewTeamPerformance() {
    window.location.href = '/follow-ups?view=team-performance'
  }
}

// إنشاء مثيل واحد من الخدمة
const followUpNotificationService = new FollowUpNotificationService()

export default followUpNotificationService
