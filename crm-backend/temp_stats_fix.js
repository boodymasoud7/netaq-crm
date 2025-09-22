// إضافة حل مؤقت للـ stats
const { FollowUp } = require('../../models');

async function getFollowUpStats(req, res) {
  try {
    const userId = req.user.id;
    
    const total = await FollowUp.count({
      where: { assignedTo: userId }
    });
    
    const pending = await FollowUp.count({
      where: { assignedTo: userId, status: 'pending' }
    });
    
    const done = await FollowUp.count({
      where: { assignedTo: userId, status: 'done' }
    });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        done,
        cancelled: 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الإحصائيات',
      error: error.message
    });
  }
}

console.log('✅ Temp stats function ready');
