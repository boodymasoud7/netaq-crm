const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const zlib = require('zlib');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Google Drive credentials
const GOOGLE_DRIVE_CREDENTIALS = require('../config/googleDrive.json');
const FOLDER_NAME = 'CRM Backups';

class BackupService {
  constructor() {
    this.drive = null;
    this.backupFolderId = null;
    this.initializeGoogleDrive();
  }

  async initializeGoogleDrive() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: GOOGLE_DRIVE_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      this.drive = google.drive({ version: 'v3', auth });
      
      // Create or find backup folder
      await this.ensureBackupFolder();
      console.log('✅ Google Drive initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive:', error.message);
    }
  }

  async ensureBackupFolder() {
    try {
      // Search for existing folder
      const response = await this.drive.files.list({
        q: `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.data.files.length > 0) {
        this.backupFolderId = response.data.files[0].id;
        console.log(`📁 Found existing backup folder: ${this.backupFolderId}`);
      } else {
        // Create new folder
        const folderResponse = await this.drive.files.create({
          requestBody: {
            name: FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
          },
          fields: 'id'
        });
        
        this.backupFolderId = folderResponse.data.id;
        console.log(`📁 Created new backup folder: ${this.backupFolderId}`);
      }
    } catch (error) {
      console.error('❌ Failed to ensure backup folder:', error.message);
      throw error;
    }
  }

  async createDatabaseBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `backup_${timestamp}.dump`;
      const compressedFilename = `${filename}.gz`;
      const backupDir = path.join(__dirname, '../../backups');
      
      // Ensure backup directory exists
      await fs.ensureDir(backupDir);
      
      const backupPath = path.join(backupDir, filename);
      const compressedPath = path.join(backupDir, compressedFilename);

      // Database connection details from config
      const config = require('../../config/config.json').development;
      const dbConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      };

      // Create pg_dump command
      const pgDumpCommand = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} -f "${backupPath}" --verbose --format=custom`;
      
      console.log('🔄 Creating database backup...');
      
      // Execute pg_dump
      const execAsync = promisify(exec);
      await execAsync(pgDumpCommand, {
        env: { ...process.env, PGPASSWORD: dbConfig.password }
      });

      // Compress the backup
      console.log('🗜️ Compressing backup...');
      const readStream = fs.createReadStream(backupPath);
      const writeStream = fs.createWriteStream(compressedPath);
      const gzipStream = zlib.createGzip({ level: 9 });
      
      await pipeline(readStream, gzipStream, writeStream);

      // Remove uncompressed file
      await fs.remove(backupPath);

      console.log(`✅ Database backup created: ${compressedFilename}`);
      
      return {
        filename: compressedFilename,
        path: compressedPath,
        size: (await fs.stat(compressedPath)).size,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to create database backup:', error.message);
      throw error;
    }
  }

  async uploadToGoogleDrive(backupInfo) {
    try {
      if (!this.drive || !this.backupFolderId) {
        await this.initializeGoogleDrive();
      }

      console.log('☁️ Uploading backup to Google Drive...');

      const fileMetadata = {
        name: backupInfo.filename,
        parents: [this.backupFolderId]
      };

      const media = {
        mimeType: 'application/gzip',
        body: fs.createReadStream(backupInfo.path)
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, size, createdTime'
      });

      // Clean up local file after successful upload
      console.log('🗑️ Cleaning up local file:', backupInfo.path);
      await fs.remove(backupInfo.path);

      console.log(`✅ Backup uploaded to Google Drive: ${response.data.id}`);
      
      return {
        id: response.data.id,
        name: response.data.name,
        size: parseInt(response.data.size),
        createdTime: response.data.createdTime,
        localPath: null // File removed after upload
      };
    } catch (error) {
      console.error('❌ Failed to upload backup to Google Drive:', error.message);
      throw error;
    }
  }

  async listGoogleDriveBackups() {
    try {
      if (!this.drive || !this.backupFolderId) {
        await this.initializeGoogleDrive();
      }

      const response = await this.drive.files.list({
        q: `'${this.backupFolderId}' in parents and trashed=false`,
        fields: 'files(id, name, size, createdTime, modifiedTime)',
        orderBy: 'createdTime desc'
      });

      return response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        size: parseInt(file.size),
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime
      }));
    } catch (error) {
      console.error('❌ Failed to list Google Drive backups:', error.message);
      throw error;
    }
  }

  async downloadFromGoogleDrive(fileId, filename) {
    try {
      if (!this.drive) {
        await this.initializeGoogleDrive();
      }

      const backupDir = path.join(__dirname, '../../backups');
      await fs.ensureDir(backupDir);
      
      const downloadPath = path.join(backupDir, filename);

      console.log(`⬇️ Downloading backup from Google Drive: ${filename}`);

      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'stream' });

      const writeStream = fs.createWriteStream(downloadPath);
      
      await pipeline(response.data, writeStream);

      console.log(`✅ Backup downloaded: ${filename}`);
      
      return {
        filename,
        path: downloadPath,
        size: (await fs.stat(downloadPath)).size
      };
    } catch (error) {
      console.error('❌ Failed to download backup from Google Drive:', error.message);
      throw error;
    }
  }

  async restoreDatabase(backupPath) {
    try {
      console.log('🔄 Restoring database...');

      // Database connection details from config
      const config = require('../../config/config.json').development;
      const dbConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password
      };

      // Decompress the backup first
      const decompressedPath = backupPath.replace('.gz', '');
      console.log('🗜️ Decompressing backup...');
      
      const readStream = fs.createReadStream(backupPath);
      const writeStream = fs.createWriteStream(decompressedPath);
      const gunzipStream = zlib.createGunzip();
      
      await pipeline(readStream, gunzipStream, writeStream);

      // Create pg_restore command
      const pgRestoreCommand = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --clean --if-exists --verbose "${decompressedPath}"`;
      
      // Execute pg_restore
      const execAsync = promisify(exec);
      await execAsync(pgRestoreCommand, {
        env: { ...process.env, PGPASSWORD: dbConfig.password }
      });

      // Clean up decompressed file
      await fs.remove(decompressedPath);
      await fs.remove(backupPath);

      console.log('✅ Database restored successfully');
      
      return { success: true, message: 'Database restored successfully' };
    } catch (error) {
      console.error('❌ Failed to restore database:', error.message);
      throw error;
    }
  }

  async deleteFromGoogleDrive(fileId) {
    try {
      if (!this.drive) {
        await this.initializeGoogleDrive();
      }

      await this.drive.files.delete({ fileId });
      console.log(`🗑️ Backup deleted from Google Drive: ${fileId}`);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete backup from Google Drive:', error.message);
      throw error;
    }
  }

  async rotateBackups(keepCount = 7) {
    try {
      const backups = await this.listGoogleDriveBackups();
      
      if (backups.length > keepCount) {
        const backupsToDelete = backups.slice(keepCount);
        
        console.log(`🔄 Rotating backups, keeping ${keepCount}, deleting ${backupsToDelete.length}`);
        
        for (const backup of backupsToDelete) {
          await this.deleteFromGoogleDrive(backup.id);
        }
      }
      
      return { success: true, deleted: Math.max(0, backups.length - keepCount) };
    } catch (error) {
      console.error('❌ Failed to rotate backups:', error.message);
      throw error;
    }
  }

  async createAndUploadBackup() {
    try {
      console.log('🚀 Starting full backup process...');
      
      // Create database backup
      console.log('📊 Step 1: Creating database backup...');
      const backupInfo = await this.createDatabaseBackup();
      console.log('✅ Step 1 completed:', backupInfo.filename);
      
      // Upload to Google Drive
      console.log('☁️ Step 2: Uploading to Google Drive...');
      const uploadResult = await this.uploadToGoogleDrive(backupInfo);
      console.log('✅ Step 2 completed:', uploadResult.id);
      
      // Rotate old backups
      console.log('🔄 Step 3: Rotating old backups...');
      await this.rotateBackups(7);
      console.log('✅ Step 3 completed');
      
      console.log('🎉 Full backup process completed successfully');
      
      return {
        success: true,
        backup: uploadResult,
        message: 'Backup created and uploaded successfully'
      };
    } catch (error) {
      console.error('❌ Full backup process failed at step:', error.message);
      console.error('Error details:', error.stack);
      throw error;
    }
  }

  async getStorageInfo() {
    try {
      if (!this.drive) {
        await this.initializeGoogleDrive();
      }

      const about = await this.drive.about.get({
        fields: 'storageQuota'
      });

      const backups = await this.listGoogleDriveBackups();
      const totalBackupSize = backups.reduce((sum, backup) => sum + backup.size, 0);

      return {
        totalBackups: backups.length,
        totalBackupSize,
        driveQuota: about.data.storageQuota
      };
    } catch (error) {
      console.error('❌ Failed to get storage info:', error.message);
      throw error;
    }
  }
}

module.exports = new BackupService();