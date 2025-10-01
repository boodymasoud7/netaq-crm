const { Interaction, Lead, Client, User, FollowUp } = require('../../models');
const { Op } = require('sequelize');

// جلب جميع التفاعلات مع الفلترة
exports.getAllInteractions = async (req, res) => {
  try {
    console.log('📋 Getting all interactions with filters:', req.query);

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
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // فلاتر البحث - استخدام itemType/itemId بدلاً من leadId/clientId
    if (leadId) {
      where.itemType = 'lead';
      where.itemId = leadId;
    }
    if (clientId) {
      where.itemType = 'client';
      where.itemId = clientId;
    }
    if (userId) where.createdBy = userId.toString();
    if (type && type !== 'all') where.type = type;
    if (outcome && outcome !== 'all') where.outcome = outcome;

    // فلتر التاريخ
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    // البحث النصي
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { notes: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const interactions = await Interaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    console.log(`✅ Found ${interactions.count} interactions`);

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
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب التفاعلات',
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
    let finalItemType = itemType;
    let finalItemId = itemId;
    let finalTitle = title || subject || 'تفاعل جديد';

    // Handle itemType/itemId format from frontend
    if (itemType && itemId) {
      finalItemType = itemType;
      finalItemId = itemId;
    } else if (leadId) {
      finalItemType = 'lead';
      finalItemId = leadId;
    } else if (clientId) {
      finalItemType = 'client';
      finalItemId = clientId;
    }

    // Map outcome values from frontend to backend (keep original mapping from backup)
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
    if (!finalItemType || !finalItemId) {
      return res.status(400).json({
        success: false,
        message: 'يجب ربط التفاعل بعميل أو عميل محتمل'
      });
    }

    console.log('🔧 Creating interaction with actual schema:', {
      itemType: finalItemType,
      itemId: finalItemId,
      type,
      title: finalTitle,
      description,
      outcome: finalOutcome,
      duration: duration ? parseInt(duration) : null,
      createdBy: req.user.id.toString(),
      createdByName: req.user.name || req.user.email
    });

    const interaction = await Interaction.create({
      itemType: finalItemType,
      itemId: finalItemId,
      type,
      title: finalTitle,
      description,
      outcome: finalOutcome,
      duration: duration ? parseInt(duration) : null,
      nextAction,
      notes: clientResponse || null,
      createdBy: req.user.id.toString(),
      createdByName: req.user.name || req.user.email || 'مستخدم'
    });

    console.log('✅ Interaction created successfully:', interaction.id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التفاعل بنجاح',
      data: interaction
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

    // Get interactions using itemType/itemId instead of leadId/clientId
    const interactions = await Interaction.findAll({
      where: {
        itemType: entityType,
        itemId: parseInt(entityId)
      },
      order: [['createdAt', 'DESC']]
    });

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

    console.log(`✅ Found ${interactions.length} interactions in timeline`);

    res.json({
      success: true,
      data: {
        entity: entityInfo,
        timeline: interactions,
        summary: {
          totalInteractions: interactions.length,
          lastInteraction: interactions[0] || null,
          mostCommonType: getMostCommonValue(interactions, 'type'),
          mostCommonOutcome: getMostCommonValue(interactions, 'outcome')
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
    if (interaction.createdBy !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتعديل هذا التفاعل'
      });
    }

    await interaction.update(req.body);

    console.log('✅ Interaction updated successfully');

    res.json({
      success: true,
      message: 'تم تحديث التفاعل بنجاح',
      data: interaction
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
    if (interaction.createdBy !== req.user.id.toString() && req.user.role !== 'admin') {
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

    const where = {};
    if (targetUserId) where.createdBy = targetUserId.toString();
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) where.createdAt[Op.lte] = new Date(dateTo);
    }

    const totalInteractions = await Interaction.count({ where });
    
    const byType = await Interaction.findAll({
      attributes: [
        'type',
        [Interaction.sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: 'type'
    });

    const byOutcome = await Interaction.findAll({
      attributes: [
        'outcome',
        [Interaction.sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: 'outcome'
    });

    console.log('✅ Interaction statistics calculated');

    res.json({
      success: true,
      data: {
        total: totalInteractions,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        byOutcome: byOutcome.reduce((acc, item) => {
          acc[item.outcome] = parseInt(item.dataValues.count);
          return acc;
        }, {})
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

    let finalItemType, finalItemId, entityName = 'غير محدد';

    // التحقق من وجود العميل أو العميل المحتمل
    if (leadId) {
      finalItemType = 'lead';
      finalItemId = leadId;
      const lead = await Lead.findByPk(leadId, { attributes: ['name'] });
      entityName = lead ? lead.name : 'عميل محتمل غير موجود';
    } else if (clientId) {
      finalItemType = 'client';
      finalItemId = clientId;
      const client = await Client.findByPk(clientId, { attributes: ['name'] });
      entityName = client ? client.name : 'عميل غير موجود';
    }

    const interaction = await Interaction.create({
      itemType: finalItemType,
      itemId: finalItemId,
      type: 'call',
      title: `مكالمة مع ${entityName}`,
      description: `مكالمة هاتفية - ${outcome || 'غير محدد'}`,
      notes: clientResponse,
      outcome,
      duration: duration ? parseInt(duration) : null,
      nextAction,
      createdBy: req.user.id.toString(),
      createdByName: req.user.name || req.user.email
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
