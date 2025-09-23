// AUTO FOLLOW-UP SERVICE DISABLED

const { Lead, FollowUp } = require('../../models');

class AutoFollowUpService {
  static async createLeadFollowUps(leadId, assignedToUserId, createdByUserId = null) {
    console.log('⚠️ Auto follow-ups disabled - no follow-ups created');
    return [];
  }

  static async distributeFollowUpsWithLeads(followUpAssignments, createdBy) {
    console.log('⚠️ Auto follow-ups disabled - distribution skipped');
    return { success: true, data: [], message: 'Auto follow-ups disabled' };
  }
}

module.exports = AutoFollowUpService;
