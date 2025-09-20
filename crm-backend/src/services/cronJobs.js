const cron = require('node-cron');
const backupService = require('./backupService');
const AutoFollowUpService = require('./autoFollowUpService');
const FollowUpIntegrationService = require('./followUpIntegrationService');
const { Backup } = require('../../models');

class CronJobService {
  constructor() {
    this.jobs = new Map();
    // Initialize jobs asynchronously
    this.initializeJobs().catch(console.error);
  }

  async initializeJobs() {
    // Fix stuck backups on server restart
    await this.fixStuckBackups();
    
    // Daily backup at 3 AM (0 3 * * *)
    this.scheduleBackupJob();
    
    // Weekly cleanup at 2 AM on Sundays (0 2 * * 0)
    this.scheduleCleanupJob();
    
    // Daily follow-up automation at 9 AM (0 9 * * *)
    this.scheduleFollowUpJob();
    
    console.log('✅ Cron jobs initialized');
  }

  async fixStuckBackups() {
    try {
      console.log('🔍 Checking for stuck backups...');
      
      // Find backups that are stuck in 'creating' status
      const stuckBackups = await Backup.findAll({
        where: {
          status: 'creating'
        }
      });

      if (stuckBackups.length > 0) {
        console.log(`🔧 Found ${stuckBackups.length} stuck backup(s), fixing...`);
        
        for (const backup of stuckBackups) {
          const LocalBackupService = require('./localBackupService');
          const localService = new LocalBackupService();
          
          // Check if backup file actually exists
          const backupFiles = await localService.listLocalBackups();
          const existingFile = backupFiles.find(file => 
            file.name === backup.filename || 
            file.name.includes(backup.filename.replace('.dump.gz', ''))
          );
          
          if (existingFile) {
            // File exists, update status to completed
            await backup.update({
              status: 'completed',
              size: existingFile.size,
              googleDriveId: `local_${backup.filename}`,
              metadata: {
                ...backup.metadata,
                fixedOnRestart: true,
                fixedAt: new Date().toISOString()
              }
            });
            console.log(`✅ Fixed backup: ${backup.filename} -> completed`);
          } else {
            // File doesn't exist, mark as failed
            await backup.update({
              status: 'failed',
              metadata: {
                ...backup.metadata,
                error: 'Backup file not found after server restart',
                failedAt: new Date().toISOString(),
                fixedOnRestart: true
              }
            });
            console.log(`❌ Marked backup as failed: ${backup.filename} (file not found)`);
          }
        }
      } else {
        console.log('✅ No stuck backups found');
      }
    } catch (error) {
      console.error('❌ Error fixing stuck backups:', error);
    }
  }

  scheduleBackupJob() {
    const backupJob = cron.schedule('0 3 * * *', async () => {
      try {
        console.log('🕒 Starting scheduled backup at 3 AM...');
        
        // Create backup record
        const backupRecord = await Backup.create({
          filename: `backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.dump.gz`,
          googleDriveId: 'pending',
          size: 0,
          status: 'creating',
          type: 'automatic',
          createdBy: 'system'
        });

        // Create and upload backup
        const result = await backupService.createAndUploadBackup();
        
        // Update backup record
        await backupRecord.update({
          googleDriveId: result.backup.id,
          size: result.backup.size,
          status: 'completed',
          filename: result.backup.name,
          metadata: {
            uploadedAt: result.backup.createdTime,
            originalSize: result.backup.size,
            scheduledBackup: true
          }
        });

        console.log('✅ Scheduled backup completed successfully');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
        
        // Update backup record with error
        try {
          const failedBackup = await Backup.findOne({
            where: { status: 'creating', type: 'automatic' },
            order: [['createdAt', 'DESC']]
          });
          
          if (failedBackup) {
            await failedBackup.update({
              status: 'failed',
              metadata: {
                error: error.message,
                failedAt: new Date(),
                scheduledBackup: true
              }
            });
          }
        } catch (updateError) {
          console.error('❌ Failed to update backup record:', updateError.message);
        }
      }
    }, {
      scheduled: false,
      timezone: 'Africa/Cairo'
    });

    this.jobs.set('dailyBackup', backupJob);
    backupJob.start();
    console.log('📅 Daily backup job scheduled for 3 AM');
  }

  scheduleCleanupJob() {
    const cleanupJob = cron.schedule('0 2 * * 0', async () => {
      try {
        console.log('🧹 Starting weekly cleanup...');
        
        // Rotate Google Drive backups (keep 7)
        const rotateResult = await backupService.rotateBackups(7);
        
        // Clean up failed backup records older than 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const deletedRecords = await Backup.destroy({
          where: {
            status: 'failed',
            createdAt: {
              [require('sequelize').Op.lt]: thirtyDaysAgo
            }
          }
        });

        console.log(`✅ Weekly cleanup completed. Rotated ${rotateResult.deleted} backups, cleaned ${deletedRecords} failed records`);
      } catch (error) {
        console.error('❌ Weekly cleanup failed:', error.message);
      }
    }, {
      scheduled: false,
      timezone: 'Africa/Cairo'
    });

    this.jobs.set('weeklyCleanup', cleanupJob);
    cleanupJob.start();
    console.log('📅 Weekly cleanup job scheduled for 2 AM on Sundays');
  }

  // Manual backup trigger
  async triggerManualBackup(userId = 'system') {
    try {
      console.log('🔧 Manual backup triggered');
      
      const backupRecord = await Backup.create({
        filename: `backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.dump.gz`,
        googleDriveId: 'pending',
        size: 0,
        status: 'creating',
        type: 'manual',
        createdBy: userId
      });

      // Start backup process
      backupService.createAndUploadBackup()
        .then(async (result) => {
          await backupRecord.update({
            googleDriveId: result.backup.id,
            size: result.backup.size,
            status: 'completed',
            filename: result.backup.name,
            metadata: {
              uploadedAt: result.backup.createdTime,
              originalSize: result.backup.size,
              manualBackup: true
            }
          });
        })
        .catch(async (error) => {
          await backupRecord.update({
            status: 'failed',
            metadata: {
              error: error.message,
              failedAt: new Date(),
              manualBackup: true
            }
          });
        });

      return backupRecord;
    } catch (error) {
      console.error('❌ Manual backup trigger failed:', error.message);
      throw error;
    }
  }

  // Get job status
  getJobStatus() {
    const status = {};
    
    this.jobs.forEach((job, name) => {
      status[name] = {
        running: job.running || false,
        scheduled: job.scheduled || false,
        lastDate: job.lastDate || null,
        nextDate: job.nextDate || null
      };
    });

    return status;
  }

  // Stop all jobs
  stopAllJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️ Stopped job: ${name}`);
    });
  }

  // Start all jobs
  startAllJobs() {
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`▶️ Started job: ${name}`);
    });
  }

  // Schedule daily follow-up automation
  scheduleFollowUpJob() {
    const followUpJob = cron.schedule('0 9 * * *', async () => {
      try {
        console.log('🤖 Starting daily follow-up automation...');
        await AutoFollowUpService.scheduleAutomaticFollowUps();
        console.log('✅ Daily follow-up automation completed');
      } catch (error) {
        console.error('❌ Error in daily follow-up automation:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Africa/Cairo'
    });

    this.jobs.set('followUpAutomation', followUpJob);
    followUpJob.start();
    console.log('⏰ Follow-up automation scheduled for 9:00 AM daily');
  }
  
  // Schedule follow-up notifications check (every 15 minutes)
  scheduleFollowUpNotificationJob() {
    const followUpNotificationJob = cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('🔔 Checking due and overdue follow-ups...');
        await FollowUpIntegrationService.checkFollowUpsDueAndOverdue();
        console.log('✅ Follow-up notification check completed');
      } catch (error) {
        console.error('❌ Error in follow-up notification check:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Africa/Cairo'
    });

    this.jobs.set('followUpNotifications', followUpNotificationJob);
    followUpNotificationJob.start();
    console.log('🔔 Follow-up notification check scheduled every 15 minutes');
  }

  // Restart specific job
  restartJob(jobName) {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      job.start();
      console.log(`🔄 Restarted job: ${jobName}`);
      return true;
    }
    return false;
  }
}

// Create singleton instance
const cronJobService = new CronJobService();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Stopping cron jobs...');
  cronJobService.stopAllJobs();
});

process.on('SIGINT', () => {
  console.log('📴 Stopping cron jobs...');
  cronJobService.stopAllJobs();
});

module.exports = cronJobService;



