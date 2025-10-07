// Real-time Data Monitor
// مراقب البيانات في الوقت الفعلي

const { Client, Lead, Project, Sale, Task } = require('../../models');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class DataMonitor {
  constructor() {
    this.lastCounts = {
      clients: 0,
      leads: 0,
      projects: 0,
      sales: 0,
      tasks: 0
    };
    this.isRunning = false;
  }

  async getCurrentCounts() {
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
      return this.lastCounts;
    }
  }

  async getLatestRecords() {
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
  }

  formatTimestamp() {
    return new Date().toLocaleString('ar-EG', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  logChange(entity, oldCount, newCount, latestRecord) {
    const timestamp = this.formatTimestamp();
    const diff = newCount - oldCount;
    const arrow = diff > 0 ? '↗️' : diff < 0 ? '↘️' : '➡️';
    const color = diff > 0 ? colors.green : diff < 0 ? colors.red : colors.yellow;
    
    console.log(`${color}[${timestamp}] ${arrow} ${entity}: ${oldCount} → ${newCount} (${diff > 0 ? '+' : ''}${diff})${colors.reset}`);
    
    if (diff > 0 && latestRecord) {
      const name = latestRecord.name || latestRecord.title || latestRecord.clientName || 'غير محدد';
      console.log(`${colors.cyan}   📝 الجديد: ${name}${colors.reset}`);
    }
  }

  async checkForChanges() {
    const currentCounts = await getCurrentCounts();
    const latestRecords = await getLatestRecords();
    
    let hasChanges = false;

    // Check each entity
    Object.keys(currentCounts).forEach(entity => {
      const oldCount = this.lastCounts[entity];
      const newCount = currentCounts[entity];
      
      if (oldCount !== newCount) {
        this.logChange(entity, oldCount, newCount, latestRecords[entity.slice(0, -1)]);
        hasChanges = true;
      }
    });

    // Update last counts
    this.lastCounts = currentCounts;

    if (!hasChanges) {
      const timestamp = this.formatTimestamp();
      console.log(`${colors.white}[${timestamp}] ✅ لا توجد تغييرات جديدة${colors.reset}`);
    }

    return hasChanges;
  }

  async start(interval = 5000) {
    if (this.isRunning) {
      console.log('Monitor is already running!');
      return;
    }

    this.isRunning = true;
    console.log(`${colors.bright}🔍 بدء مراقبة البيانات كل ${interval/1000} ثانية...${colors.reset}`);
    console.log(`${colors.yellow}اضغط Ctrl+C للإيقاف${colors.reset}\n`);

    // Initial counts
    this.lastCounts = await this.getCurrentCounts();
    console.log(`${colors.blue}📊 العدد الحالي:${colors.reset}`);
    Object.entries(this.lastCounts).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    // Start monitoring
    const monitorInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(monitorInterval);
        return;
      }
      
      await this.checkForChanges();
    }, interval);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      this.stop();
      clearInterval(monitorInterval);
      process.exit(0);
    });
  }

  stop() {
    this.isRunning = false;
    console.log(`\n${colors.red}🛑 توقف المراقب${colors.reset}`);
  }

  async showCurrentStats() {
    const counts = await this.getCurrentCounts();
    const latest = await this.getLatestRecords();
    
    console.log(`${colors.bright}📊 إحصائيات النظام الحالية:${colors.reset}`);
    console.log(`${colors.green}العملاء: ${counts.clients}${colors.reset}`);
    console.log(`${colors.yellow}العملاء المحتملين: ${counts.leads}${colors.reset}`);
    console.log(`${colors.blue}المشاريع: ${counts.projects}${colors.reset}`);
    console.log(`${colors.magenta}المبيعات: ${counts.sales}${colors.reset}`);
    console.log(`${colors.cyan}المهام: ${counts.tasks}${colors.reset}`);
    
    if (latest.client) {
      console.log(`\n${colors.bright}آخر إضافات:${colors.reset}`);
      if (latest.client) console.log(`${colors.green}آخر عميل: ${latest.client.name}${colors.reset}`);
      if (latest.lead) console.log(`${colors.yellow}آخر عميل محتمل: ${latest.lead.name}${colors.reset}`);
      if (latest.project) console.log(`${colors.blue}آخر مشروع: ${latest.project.name}${colors.reset}`);
      if (latest.sale) console.log(`${colors.magenta}آخر مبيعة: ${latest.sale.clientName}${colors.reset}`);
      if (latest.task) console.log(`${colors.cyan}آخر مهمة: ${latest.task.title}${colors.reset}`);
    }
  }
}

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

module.exports = { DataMonitor, getCurrentCounts, getLatestRecords };



