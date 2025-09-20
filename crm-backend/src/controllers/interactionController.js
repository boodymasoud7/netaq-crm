const { Interaction, Lead, Client, User, FollowUp } = require('../../models');
const { Op } = require('sequelize');

// جلب جميع التفاعلات مع الفلترة
exports.getAllInteractions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      leadId,
      clientId,
      userId,
      type,
      status,
      outcome,
      dateFrom,
      dateTo,
      search,
      // Support للـ Frontend format
      itemType,
      itemId
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // فلاتر البحث
    if (leadId) where.leadId = leadId;
    if (clientId) where.clientId = clientId;
    
    // Support للـ Frontend itemType/itemId format
    if (itemType && itemId) {
      where.itemType = itemType;
      where.itemId = itemId;
    }
    if (userId) where.userId = userId;
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;
    if (outcome && outcome !== 'all') where.outcome = outcome;

    // فلتر التاريخ
    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.completedAt[Op.lte] = new Date(dateTo);
    }

    // البحث النصي
    if (search) {
      where[Op.or] = [
        { subject: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { clientResponse: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Try to get interactions from database, fallback to empty if table doesn't exist
    let interactions;
    try {
      interactions = await Interaction.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });
    } catch (dbError) {
      // Table doesn't exist or other DB error, return empty result
      interactions = { count: 0, rows: [] };
    }

    res.json({
      success: true,
      data: interactions.rows,
      pagination: {
        total: interactions.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(interactions.count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error getting interactions:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
    });
    
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التفاعلات',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
      errorType: error.name
    });
  }
};

// جلب الخط الزمني للتفاعلات (لعميل أو عميل محتمل)
exports.getTimeline = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    console.log(`📅 Getting timeline for ${entityType}:`, entityId);

    if (!['lead', 'client'].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: 'نوع الكيان غير صحيح (lead أو client فقط)'
      });
    }

    const timeline = await Interaction.getTimeline(entityType, entityId);

    // جلب معلومات الكيان أيضاً
    let entityInfo = null;
    if (entityType === 'lead') {
      entityInfo = await Lead.findByPk(entityId, {
        attributes: ['id', 'name', 'phone', 'email', 'status', 'createdAt']
      });
    } else {
      entityInfo = await Client.findByPk(entityId, {
        attributes: ['id', 'name', 'phone', 'email', 'status', 'createdAt']
      });
    }

    if (!entityInfo) {
      return res.status(404).json({
        success: false,
        message: 'الكيان غير موجود'
      });
    }

    console.log(`✅ Found ${timeline.length} interactions in timeline`);

    res.json({
      success: true,
      data: {
        entity: entityInfo,
        timeline,
        summary: {
          totalInteractions: timeline.length,
          completedInteractions: timeline.filter(i => i.status === 'completed').length,
          lastInteraction: timeline[0] || null,
          mostCommonType: getMostCommonValue(timeline, 'type'),
          mostCommonOutcome: getMostCommonValue(timeline, 'outcome')
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting timeline:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الخط الزمني',
      error: error.message
    });
  }
};

// إنشاء تفاعل جديد (مكالمة، اجتماع، إلخ)
exports.createInteraction = async (req, res) => {
  try {
    console.log('➕ Creating new interaction:', req.body);

    const {
      leadId,
      clientId,
      itemType,
      itemId,
      followUpId,
      type,
      direction = 'outbound',
      subject,
      title,
      description,
      clientResponse,
      outcome,
      status = 'completed',
      duration,
      scheduledAt,
      completedAt,
      priority = 'medium',
      nextAction,
      tags,
      attachments
    } = req.body;

    // Map frontend values to backend values
    let finalLeadId = leadId;
    let finalClientId = clientId;
    let finalSubject = subject || title;

    // Handle itemType/itemId format from frontend
    if (itemType && itemId) {
      if (itemType === 'lead') {
        finalLeadId = itemId;
      } else if (itemType === 'client') {
        finalClientId = itemId;
      }
    }

    // Map outcome values from frontend to backend
    const outcomeMapping = {
      'positive': 'interested',
      'negative': 'not_interested',
      'neutral': 'no_response',
      'callback': 'callback_requested',
      'meeting': 'meeting_scheduled',
      'demo': 'demo_requested',
      'visit': 'visit_scheduled',
      'contract': 'contract_discussed',
      'objection': 'objection_raised'
    };
    
    const finalOutcome = outcomeMapping[outcome] || outcome;

    // التحقق من وجود واحد على الأقل من المرجعيات
    if (!finalLeadId && !finalClientId && (!itemType || !itemId)) {
      return res.status(400).json({
        success: false,
        message: 'يجب ربط التفاعل بعميل أو عميل محتمل'
      });
    }

    // Determine itemType and itemId based on what we have
    let actualItemType, actualItemId;
    if (finalClientId) {
      actualItemType = 'client';
      actualItemId = finalClientId;
    } else if (finalLeadId) {
      actualItemType = 'lead'; 
      actualItemId = finalLeadId;
    } else if (itemType && itemId) {
      actualItemType = itemType;
      actualItemId = itemId;
    }

    console.log('🔧 Creating interaction with actual schema:', {
      itemType: actualItemType,
      itemId: actualItemId,
      type,
      title: finalSubject,
      description,
      outcome: finalOutcome,
      duration: duration ? parseInt(duration) : null,
      createdBy: req.user.id.toString(),
      createdByName: req.user.name || req.user.email
    });

    const interaction = await Interaction.create({
      itemType: actualItemType,
      itemId: actualItemId,
      type,
      title: finalSubject,
      description,
      outcome: finalOutcome,
      duration: duration ? parseInt(duration) : null,
      nextAction,
      notes: clientResponse || null,
      createdBy: req.user.id.toString(),
      createdByName: req.user.name || req.user.email
    });

    console.log('✅ Interaction created successfully:', interaction.id);

    // Return simple response without complex includes for now
    res.status(201).json({
      success: true,
      message: 'تم إنشاء التفاعل بنجاح',
      data: {
        id: interaction.id,
        itemType: interaction.itemType,
        itemId: interaction.itemId,
        type: interaction.type,
        title: interaction.title,
        description: interaction.description,
        outcome: interaction.outcome,
        duration: interaction.duration,
        createdBy: interaction.createdBy,
        createdByName: interaction.createdByName,
        createdAt: interaction.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error creating interaction:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء التفاعل',
      error: error.message
    });
  }
};

// تحديث تفاعل
exports.updateInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('✏️ Updating interaction:', id, req.body);

    const interaction = await Interaction.findByPk(id);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'التفاعل غير موجود'
      });
    }

    // التحقق من الصلاحيات - المستخدم يمكنه فقط تحديث تفاعلاته
    if (interaction.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتعديل هذا التفاعل'
      });
    }

    await interaction.update(req.body);

    // جلب التفاعل المحدث مع العلاقات
    const updatedInteraction = await Interaction.findByPk(id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'phone', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: FollowUp,
          as: 'followUp',
          attributes: ['id', 'title', 'type']
        }
      ]
    });

    console.log('✅ Interaction updated successfully');

    res.json({
      success: true,
      message: 'تم تحديث التفاعل بنجاح',
      data: updatedInteraction
    });

  } catch (error) {
    console.error('❌ Error updating interaction:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التفاعل',
      error: error.message
    });
  }
};

// حذف تفاعل
exports.deleteInteraction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting interaction:', id);

    const interaction = await Interaction.findByPk(id);

    if (!interaction) {
      return res.status(404).json({
        success: false,
        message: 'التفاعل غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (interaction.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بحذف هذا التفاعل'
      });
    }

    await interaction.destroy(); // Soft delete

    console.log('✅ Interaction deleted successfully');

    res.json({
      success: true,
      message: 'تم حذف التفاعل بنجاح'
    });

  } catch (error) {
    console.error('❌ Error deleting interaction:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التفاعل',
      error: error.message
    });
  }
};

// إحصائيات التفاعلات
exports.getInteractionStats = async (req, res) => {
  try {
    const { userId, dateFrom, dateTo } = req.query;
    const targetUserId = userId || req.user.id;

    console.log('📊 Getting interaction statistics for user:', targetUserId);

    let dateRange = {};
    if (dateFrom || dateTo) {
      if (dateFrom) dateRange.start = new Date(dateFrom);
      if (dateTo) dateRange.end = new Date(dateTo);
    }

    const stats = await Interaction.getStats(targetUserId, dateRange);

    // إحصائيات إضافية
    const today = new Date();
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [weeklyStats, monthlyStats] = await Promise.all([
      Interaction.getStats(targetUserId, { start: startOfWeek, end: today }),
      Interaction.getStats(targetUserId, { start: startOfMonth, end: today })
    ]);

    console.log('✅ Interaction statistics calculated');

    res.json({
      success: true,
      data: {
        overall: stats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        trends: {
          weeklyAverage: Math.round(weeklyStats.completed / 7),
          monthlyAverage: Math.round(monthlyStats.completed / new Date().getDate()),
          avgCallDuration: stats.avgDuration,
          successRate: stats.completionRate
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting interaction statistics:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات التفاعلات',
      error: error.message
    });
  }
};

// تسجيل مكالمة سريع
exports.quickCallLog = async (req, res) => {
  try {
    const {
      leadId,
      clientId,
      duration,
      outcome,
      clientResponse,
      nextAction
    } = req.body;

    console.log('📞 Quick call log:', req.body);

    // التحقق من وجود العميل أو العميل المحتمل
    let entityName = 'غير محدد';
    if (leadId) {
      const lead = await Lead.findByPk(leadId, { attributes: ['name'] });
      entityName = lead ? lead.name : 'عميل محتمل غير موجود';
    } else if (clientId) {
      const client = await Client.findByPk(clientId, { attributes: ['name'] });
      entityName = client ? client.name : 'عميل غير موجود';
    }

    const interaction = await Interaction.create({
      leadId: leadId || null,
      clientId: clientId || null,
      userId: req.user.id,
      type: 'call',
      direction: 'outbound',
      subject: `مكالمة مع ${entityName}`,
      description: `مكالمة هاتفية - ${outcome || 'غير محدد'}`,
      clientResponse,
      outcome,
      status: 'completed',
      duration: duration ? parseInt(duration) : null,
      completedAt: new Date(),
      nextAction,
      priority: 'medium'
    });

    console.log('✅ Quick call logged successfully:', interaction.id);

    res.status(201).json({
      success: true,
      message: 'تم تسجيل المكالمة بنجاح',
      data: interaction
    });

  } catch (error) {
    console.error('❌ Error logging quick call:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل المكالمة',
      error: error.message
    });
  }
};

// Helper function
function getMostCommonValue(array, field) {
  const counts = {};
  array.forEach(item => {
    const value = item[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  
  let mostCommon = null;
  let maxCount = 0;
  for (const [value, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = value;
    }
  }
  
  return mostCommon;
}


