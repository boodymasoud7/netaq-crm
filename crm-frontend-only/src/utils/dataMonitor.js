// Real-time Data Monitor
// مراقب البيانات في الوقت الفعلي

const { Client, Lead, Project, Sale, Task } = require('../../models');

// Export functions for standalone use
const getCurrentCounts = async () => {
  try {
    const [clients, leads, projects, sales, tasks] = await Promise.all([
      Client.count(),
      Lead.count(),
      Project.count(),
      Sale.count(),
      Task.count()
    ]);
    return { clients, leads, projects, sales, tasks };
  } catch (error) {
    console.error('Error getting counts:', error);
    return { clients: 0, leads: 0, projects: 0, sales: 0, tasks: 0 };
  }
};

const getLatestRecords = async () => {
  try {
    const [latestClient, latestLead, latestProject, latestSale, latestTask] = await Promise.all([
      Client.findOne({ order: [['createdAt', 'DESC']] }),
      Lead.findOne({ order: [['createdAt', 'DESC']] }),
      Project.findOne({ order: [['createdAt', 'DESC']] }),
      Sale.findOne({ order: [['createdAt', 'DESC']] }),
      Task.findOne({ order: [['createdAt', 'DESC']] })
    ]);

    return {
      client: latestClient,
      lead: latestLead,
      project: latestProject,
      sale: latestSale,
      task: latestTask
    };
  } catch (error) {
    console.error('Error getting latest records:', error);
    return {};
  }
};

module.exports = { getCurrentCounts, getLatestRecords };




