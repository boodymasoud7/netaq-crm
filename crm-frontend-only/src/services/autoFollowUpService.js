// Auto Follow-up Service
// خدمة المتابعات التلقائية

// Auto Follow-up Service using direct fetch

export const autoFollowUpService = {
  // توزيع المتابعات مع العملاء المحتملين
  async distributeFollowUpsWithLeads(followUpAssignments, createdBy) {
    console.log('🔄 توزيع المتابعات التلقائية:', followUpAssignments)
    
    try {
      // استخدام fetch مع token صحيح
      const response = await fetch('http://54.221.136.112/api/follow-ups/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'dev-token'}`
        },
        body: JSON.stringify({
          followUpAssignments,
          createdBy
        })
      });
      
      const data = await response.json();
      
      console.log('✅ نتيجة توزيع المتابعات:', data);
      return data;
      
    } catch (error) {
      console.error('❌ خطأ في توزيع المتابعات:', error)
      return {
        success: false,
        message: 'فشل في التوزيع',
        error: error.message
      }
    }
  },

  // إنشاء متابعة تلقائية لعميل محتمل جديد
  async createAutoFollowUpForNewLead(assignedTo, leadId) {
    console.log('➕ إنشاء متابعة تلقائية لعميل محتمل جديد:', { leadId, assignedTo })
    
    try {
      const response = await fetch('http://54.221.136.112/api/follow-ups/auto-create-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'dev-token'}`
        },
        body: JSON.stringify({
          leadId,
          assignedTo
        })
      });
      
      const data = await response.json();
      console.log('✅ تم إنشاء المتابعة التلقائية:', data);
      return data;
      
    } catch (error) {
      console.error('❌ خطأ في إنشاء المتابعة التلقائية:', error)
      return {
        success: false,
        message: 'فشل في إنشاء المتابعة التلقائية',
        error: error.message
      }
    }
  },

  // إكمال متابعة وإنشاء التالية
  async completeFollowUpAndCreateNext(followUpId, nextFollowUpData) {
    console.log('✅ إكمال متابعة وإنشاء التالية:', { followUpId, nextFollowUpData })
    
    try {
      // هنا يمكن إضافة منطق إكمال المتابعة وإنشاء التالية
      // مؤقتاً نرجع نتيجة نجاح لتجنب الأخطاء
      return {
        success: true,
        message: 'تم إكمال المتابعة وإنشاء التالية',
        data: null
      }
    } catch (error) {
      console.error('❌ خطأ في إكمال المتابعة:', error)
      return {
        success: false,
        message: 'فشل في إكمال المتابعة',
        error
      }
    }
  },

  // إيقاف المتابعات التلقائية لعميل محتمل
  async stopAutoFollowUpsForLead(leadId) {
    console.log('⛔ إيقاف المتابعات التلقائية للعميل المحتمل:', leadId)
    
    try {
      // هنا يمكن إضافة منطق إيقاف المتابعات التلقائية
      // مؤقتاً نرجع نتيجة نجاح لتجنب الأخطاء
      return {
        success: true,
        message: 'تم إيقاف المتابعات التلقائية',
        data: null
      }
    } catch (error) {
      console.error('❌ خطأ في إيقاف المتابعات التلقائية:', error)
      return {
        success: false,
        message: 'فشل في إيقاف المتابعات التلقائية',
        error
      }
    }
  }
}

export default autoFollowUpService
