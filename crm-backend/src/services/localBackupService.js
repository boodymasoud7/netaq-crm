const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class LocalBackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
  }

  async ensureBackupDirectory() {
    try {
      await fs.ensureDir(this.backupDir);
    } catch (error) {
      console.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  async createAndStoreBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `backup_${timestamp}.json.gz`;
      const backupPath = path.join(this.backupDir, filename);

      console.log('🚀 Creating database backup:', filename);

      // Get all models
      const models = require('../../models/index.js');
      
      // Create real backup with actual data
      console.log('📊 Exporting all table data...');
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        type: 'json_backup_with_data',
        tables: {},
        metadata: {
          created_by: 'LocalBackupService',
          backup_method: 'sequelize_export',
          compressed: true,
          database: process.env.DB_NAME || 'crm_database'
        }
      };

      // Export data from all models
      const modelNames = Object.keys(models).filter(name => name !== 'sequelize' && name !== 'Sequelize');
      
      for (const modelName of modelNames) {
        try {
          const Model = models[modelName];
          if (!Model || typeof Model.findAll !== 'function') {
            console.warn(`⚠️ Skipping ${modelName}: not a valid Sequelize model`);
            continue;
          }
          
          console.log(`📋 Exporting ${modelName}...`);
          
          // Get all data including soft-deleted items
          const data = await Model.findAll({ 
            paranoid: false, // Include soft-deleted records
            raw: true // Get plain objects
          });
          
          backupData.tables[modelName] = {
            tableName: Model.tableName || modelName,
            rowCount: data.length,
            data: data,
            exportedAt: new Date().toISOString()
          };
          
          console.log(`✅ Exported ${data.length} records from ${modelName}`);
        } catch (modelError) {
          console.warn(`⚠️ Failed to export ${modelName}:`, modelError.message);
          backupData.tables[modelName] = {
            tableName: modelName,
            rowCount: 0,
            data: [],
            error: modelError.message,
            exportedAt: new Date().toISOString()
          };
        }
      }

      const totalRecords = Object.values(backupData.tables).reduce((sum, table) => sum + table.rowCount, 0);
      console.log(`📊 Total records exported: ${totalRecords} across ${modelNames.length} tables`);

      // Convert to JSON
      const backupJson = JSON.stringify(backupData, null, 2);
      console.log(`📦 Backup JSON size: ${this.formatFileSize(Buffer.byteLength(backupJson, 'utf8'))}`);

      // Compress the JSON
      console.log('🗜️ Compressing backup...');
      
      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(backupPath);
        const gzipStream = zlib.createGzip();
        
        writeStream.on('finish', async () => {
          try {
            const stats = await fs.stat(backupPath);
            console.log(`✅ Backup created successfully: ${filename} (${this.formatFileSize(stats.size)})`);
            
            resolve({
              backup: {
                id: `local_${filename}`,
                name: filename,
                size: stats.size,
                path: backupPath,
                createdTime: new Date().toISOString(),
                type: 'local',
                recordCount: totalRecords,
                tables: Object.keys(backupData.tables)
              }
            });
          } catch (error) {
            reject(error);
          }
        });

        writeStream.on('error', reject);
        gzipStream.on('error', reject);

        gzipStream.pipe(writeStream);
        gzipStream.end(backupJson);
      });

    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  async listLocalBackups() {
    try {
      await this.ensureBackupDirectory();
      
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.endsWith('.dump.gz') || file.endsWith('.json.gz'));
      
      const backups = await Promise.all(
        backupFiles.map(async (filename) => {
          const filepath = path.join(this.backupDir, filename);
          const stats = await fs.stat(filepath);
          
          return {
            name: filename,
            path: filepath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: 'local'
          };
        })
      );

      return backups.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('❌ Failed to list local backups:', error);
      return [];
    }
  }

  async getStorageInfo() {
    try {
      await this.ensureBackupDirectory();
      
      const backups = await this.listLocalBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      // Get available disk space
      let freeSpace = 0;
      try {
        if (process.platform === 'win32') {
          const { stdout } = await execAsync(`dir /-c "${this.backupDir}"`);
          const match = stdout.match(/(\d{1,3}(,\d{3})*)\s+bytes free/);
          if (match) {
            freeSpace = parseInt(match[1].replace(/,/g, ''));
          }
        } else {
          const { stdout } = await execAsync(`df -k "${this.backupDir}" | tail -1`);
          const parts = stdout.trim().split(/\s+/);
          freeSpace = parseInt(parts[3]) * 1024; // Convert from KB to bytes
        }
      } catch (diskError) {
        console.warn('Could not get disk space info:', diskError.message);
      }

      return {
        totalBackups: backups.length,
        totalSize: totalSize,
        freeSpace: freeSpace,
        backupDirectory: this.backupDir,
        storageType: 'local',
        lastBackup: backups.length > 0 ? backups[0].created : null
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        freeSpace: 0,
        backupDirectory: this.backupDir,
        storageType: 'local',
        lastBackup: null
      };
    }
  }

  async downloadBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      
      // Check if file exists
      const exists = await fs.pathExists(backupPath);
      if (!exists) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      const stats = await fs.stat(backupPath);
      const readStream = fs.createReadStream(backupPath);

      return {
        stream: readStream,
        size: stats.size,
        path: backupPath,
        filename: filename
      };
    } catch (error) {
      console.error('❌ Failed to download backup:', error);
      throw error;
    }
  }

  async deleteBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      
      // Check if file exists
      const exists = await fs.pathExists(backupPath);
      if (!exists) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      // Delete the file
      await fs.remove(backupPath);
      console.log(`🗑️ Deleted backup file: ${filename}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to delete backup:', error);
      throw error;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async restoreBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      
      // Check if file exists
      const exists = await fs.pathExists(backupPath);
      if (!exists) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      console.log('🔄 Starting backup restore from:', filename);
      
      // First, decompress the backup
      const tempJsonFile = path.join(this.backupDir, `temp_restore_${Date.now()}.json`);
      
      // Decompress backup file
      const readStream = fs.createReadStream(backupPath);
      const writeStream = fs.createWriteStream(tempJsonFile);
      const gunzip = zlib.createGunzip();
      
      await new Promise((resolve, reject) => {
        readStream
          .pipe(gunzip)
          .pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      // Read and parse the JSON backup
      const backupContent = await fs.readFile(tempJsonFile, 'utf8');
      const backupData = JSON.parse(backupContent);
      
      console.log('📥 Backup data loaded, type:', backupData.type);
      console.log('📅 Backup timestamp:', backupData.timestamp);
      
      // Clean up temporary file
      await fs.remove(tempJsonFile);

      // Get all models for restoration
      const models = require('../../models/index.js');
      const { sequelize } = models;
      
      // Start database transaction
      const transaction = await sequelize.transaction();
      
      try {
        console.log('🗑️ Clearing existing data...');
        
        // Define the correct order for deleting tables (child tables first due to foreign key constraints)
        const deletionOrder = [
          // Tables with foreign keys (child tables) first
          'FollowUp',
          'SimpleReminder', 
          'Reminder',
          'Interaction',
          'Note',
          'Notification',
          'backup',
          'backups',
          
          // Main entity tables (can have dependencies)
          'Lead',
          'Client', 
          'Task',
          'Sale',
          'Unit',
          
          // Reference tables
          'Project',
          'Developer',
          
          // Core tables last
          'User'
        ];
        
        // Clear all tables first (PostgreSQL compatible)
        console.log('🧹 Starting table cleanup for PostgreSQL with proper order...');
        
        // Use the correct deletion order to avoid foreign key constraint issues
        for (const modelName of deletionOrder) {
          try {
            const Model = models[modelName];
            if (!Model || typeof Model.destroy !== 'function') {
              console.warn(`⚠️ Model ${modelName} not found, skipping...`);
              continue;
            }
            
            console.log(`🧹 Clearing ${modelName}...`);
            
            // Delete all records with force (including paranoid/soft deleted)
            const deletedCount = await Model.destroy({ 
              where: {}, 
              force: true, 
              transaction
            });
            
            console.log(`✅ Cleared ${modelName} (${deletedCount} records)`);
          } catch (clearError) {
            console.warn(`⚠️ Failed to clear ${modelName}:`, clearError.message);
            // Continue with other tables even if one fails
          }
        }
        
        // Clear any remaining tables that might not be in our list
        const allModelNames = Object.keys(models).filter(name => name !== 'sequelize' && name !== 'Sequelize');
        const remainingModels = allModelNames.filter(name => !deletionOrder.includes(name));
        
        for (const modelName of remainingModels) {
          try {
            const Model = models[modelName];
            if (!Model || typeof Model.destroy !== 'function') continue;
            
            console.log(`🧹 Clearing remaining table ${modelName}...`);
            
            await Model.destroy({ 
              where: {}, 
              force: true, 
              transaction
            });
            
            console.log(`✅ Cleared remaining table ${modelName}`);
          } catch (clearError) {
            console.warn(`⚠️ Failed to clear remaining table ${modelName}:`, clearError.message);
          }
        }
        
        console.log('📥 Restoring data from backup...');
        
        // Define the correct order for restoring tables (parent tables first)
        const restorationOrder = [
          // Core tables first (no dependencies)
          'User',
          
          // Reference tables
          'Developer', 
          'Project',
          
          // Main entity tables
          'Unit',
          'Sale',
          'Task',
          'Client',
          'Lead',
          
          // Tables with foreign keys (child tables) last
          'backup',
          'backups',
          'Notification',
          'Note',
          'Interaction',
          'Reminder',
          'SimpleReminder',
          'FollowUp'
        ];
        
        // Restore data to each table in the correct order
        let totalRestoredRecords = 0;
        const restoredTables = [];
        
        // First, restore tables in the defined order
        for (const modelName of restorationOrder) {
          if (!backupData.tables || !backupData.tables[modelName]) {
            console.log(`📭 No backup data found for ${modelName}, skipping...`);
            continue;
          }
          
          const tableData = backupData.tables[modelName];
          try {
            if (!models[modelName] || typeof models[modelName].bulkCreate !== 'function') {
              console.warn(`⚠️ Model ${modelName} not found or invalid, skipping...`);
              restoredTables.push({
                table: modelName,
                records: 0,
                error: 'Model not found or invalid'
              });
              continue;
            }
            
            const Model = models[modelName];
            const records = tableData.data || [];
            
            if (records.length > 0) {
              console.log(`📋 Restoring ${records.length} records to ${modelName}...`);
              
              // Bulk create records
              await Model.bulkCreate(records, {
                transaction,
                validate: false, // Skip validation for speed
                ignoreDuplicates: false
                // Removed updateOnDuplicate: false as it requires an array
              });
              
              totalRestoredRecords += records.length;
              restoredTables.push({
                table: modelName,
                records: records.length
              });
              
              console.log(`✅ Restored ${records.length} records to ${modelName}`);
            } else {
              console.log(`📭 No data to restore for ${modelName}`);
              restoredTables.push({
                table: modelName,
                records: 0
              });
            }
          } catch (tableError) {
            console.error(`❌ Failed to restore ${modelName}:`, tableError.message);
            console.error('Stack trace:', tableError.stack);
            restoredTables.push({
              table: modelName,
              records: 0,
              error: tableError.message
            });
          }
        }
        
        // Now restore any remaining tables that weren't in our restoration order
        const allBackupTables = Object.keys(backupData.tables || {});
        const remainingTables = allBackupTables.filter(tableName => !restorationOrder.includes(tableName));
        
        for (const modelName of remainingTables) {
          const tableData = backupData.tables[modelName];
          try {
            if (!models[modelName] || typeof models[modelName].bulkCreate !== 'function') {
              console.warn(`⚠️ Remaining model ${modelName} not found or invalid, skipping...`);
              restoredTables.push({
                table: modelName,
                records: 0,
                error: 'Model not found or invalid'
              });
              continue;
            }
            
            const Model = models[modelName];
            const records = tableData.data || [];
            
            if (records.length > 0) {
              console.log(`📋 Restoring ${records.length} records to remaining table ${modelName}...`);
              
              // Bulk create records
              await Model.bulkCreate(records, {
                transaction,
                validate: false, // Skip validation for speed
                ignoreDuplicates: false
              });
              
              totalRestoredRecords += records.length;
              restoredTables.push({
                table: modelName,
                records: records.length
              });
              
              console.log(`✅ Restored ${records.length} records to remaining table ${modelName}`);
            } else {
              console.log(`📭 No data to restore for remaining table ${modelName}`);
              restoredTables.push({
                table: modelName,
                records: 0
              });
            }
          } catch (tableError) {
            console.error(`❌ Failed to restore remaining table ${modelName}:`, tableError.message);
            console.error('Stack trace:', tableError.stack);
            restoredTables.push({
              table: modelName,
              records: 0,
              error: tableError.message
            });
          }
        }
        
        // Reset PostgreSQL sequences for auto-increment columns
        console.log('🔄 Resetting PostgreSQL sequences...');
        try {
          // Get all tables with auto-increment primary keys and reset their sequences
          const sequenceResetQueries = [
            "SELECT setval('\"Clients_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Clients\"), 1), true);",
            "SELECT setval('\"Leads_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Leads\"), 1), true);", 
            "SELECT setval('\"FollowUps_id_seq\"', COALESCE((SELECT MAX(id) FROM \"FollowUps\"), 1), true);",
            "SELECT setval('\"Users_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Users\"), 1), true);",
            "SELECT setval('\"Tasks_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Tasks\"), 1), true);",
            "SELECT setval('\"Sales_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Sales\"), 1), true);",
            "SELECT setval('\"Projects_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Projects\"), 1), true);",
            "SELECT setval('\"Developers_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Developers\"), 1), true);",
            "SELECT setval('\"units_id_seq\"', COALESCE((SELECT MAX(id) FROM \"units\"), 1), true);",
            "SELECT setval('\"interactions_id_seq\"', COALESCE((SELECT MAX(id) FROM \"interactions\"), 1), true);",
            "SELECT setval('\"reminders_id_seq\"', COALESCE((SELECT MAX(id) FROM \"reminders\"), 1), true);",
            "SELECT setval('\"simple_reminders_id_seq\"', COALESCE((SELECT MAX(id) FROM \"simple_reminders\"), 1), true);",
            "SELECT setval('\"backups_id_seq\"', COALESCE((SELECT MAX(id) FROM \"backups\"), 1), true);",
            "SELECT setval('\"Notifications_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Notifications\"), 1), true);",
            "SELECT setval('\"Notes_id_seq\"', COALESCE((SELECT MAX(id) FROM \"Notes\"), 1), true);"
          ];

          for (const query of sequenceResetQueries) {
            try {
              await sequelize.query(query, { transaction });
              console.log('✅ Reset sequence:', query.split('\"')[1]);
            } catch (seqError) {
              console.warn('⚠️ Failed to reset sequence:', seqError.message);
              // Continue with other sequences
            }
          }
          
          console.log('✅ PostgreSQL sequences reset completed');
        } catch (sequenceError) {
          console.warn('⚠️ Failed to reset some sequences:', sequenceError.message);
          // This is not critical, continue with commit
        }
        
        // PostgreSQL doesn't need to re-enable foreign keys like SQLite
        console.log('✅ Data restoration completed (PostgreSQL)');
        
        // Commit transaction
        await transaction.commit();
        
        console.log(`✅ Database restore completed!`);
        console.log(`📊 Total records restored: ${totalRestoredRecords}`);
        console.log(`📋 Tables processed: ${restoredTables.length}`);
        
        return {
          success: true,
          filename: filename,
          restoredAt: new Date().toISOString(),
          backupData: {
            type: backupData.type,
            timestamp: backupData.timestamp,
            totalTables: Object.keys(backupData.tables || {}).length,
            totalRecords: totalRestoredRecords
          },
          restoredTables: restoredTables
        };
        
      } catch (restoreError) {
        // Rollback transaction on error
        await transaction.rollback();
        console.error('❌ Restore failed, rolling back changes:', restoreError);
        throw restoreError;
      }
      
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }
}

module.exports = LocalBackupService;