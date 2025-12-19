/**
 * File Backup Scheduler
 * Scheduled function for automated file backups
 * Based on Firebase Functions v2 API - onSchedule
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import { BackupResult } from '../types';
import { info, warn, error as logError, logPerformanceMetric } from '../utils/logger';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Automated file backup job
 * Runs daily at 4:00 AM Asia/Taipei time
 *
 * Features:
 * - Scheduled daily backups
 * - Progress tracking
 * - Error resilience (continues on individual file failures)
 * - Backup result logging to Firestore
 * - Performance metrics
 */
export const backupFiles = onSchedule(
  {
    schedule: '0 4 * * *', // Daily at 4:00 AM
    timeZone: 'Asia/Taipei',
    region: 'asia-east1',
    memory: '2GiB',
    timeoutSeconds: 540, // 9 minutes
    maxInstances: 1 // Only one backup job at a time
  },
  async (event): Promise<void> => {
    const startTime = Date.now();

    info('Starting scheduled file backup', {
      scheduleTime: event.scheduleTime,
      timestamp: new Date().toISOString()
    });

    try {
      // Configuration
      const SOURCE_BUCKET_NAME = process.env.SOURCE_BUCKET || 'default';
      const BACKUP_BUCKET_NAME = process.env.BACKUP_BUCKET || 'gighub-backups';
      const BACKUP_PREFIX = process.env.BACKUP_PREFIX || 'projects/';

      // Get bucket references
      const sourceBucket = admin.storage().bucket(SOURCE_BUCKET_NAME);
      const backupBucket = admin.storage().bucket(BACKUP_BUCKET_NAME);

      // Generate backup path with date
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const backupPath = `backups/${timestamp}/`;

      info('Backup configuration', {
        sourceBucket: SOURCE_BUCKET_NAME,
        backupBucket: BACKUP_BUCKET_NAME,
        backupPath,
        prefix: BACKUP_PREFIX
      });

      // Step 1: List all files to backup
      const [files] = await sourceBucket.getFiles({
        prefix: BACKUP_PREFIX
      });

      info('Files discovered for backup', {
        count: files.length
      });

      if (files.length === 0) {
        info('No files to backup');
        return;
      }

      // Step 2: Backup files with progress tracking
      let backedUpCount = 0;
      let errorCount = 0;
      const errors: Array<{ fileName: string; error: string }> = [];

      for (const file of files) {
        try {
          const destFileName = `${backupPath}${file.name}`;

          // Copy file to backup bucket
          await file.copy(backupBucket.file(destFileName));
          backedUpCount++;

          // Log progress every 100 files
          if (backedUpCount % 100 === 0) {
            info('Backup progress', {
              backedUpCount,
              total: files.length,
              percentComplete: Math.round((backedUpCount / files.length) * 100)
            });
          }
        } catch (fileError) {
          errorCount++;
          const errorMessage = fileError instanceof Error ? fileError.message : 'Unknown error';

          errors.push({
            fileName: file.name,
            error: errorMessage
          });

          warn('File backup failed', {
            fileName: file.name,
            error: errorMessage
          });

          // Log individual errors but continue with other files
          if (errors.length <= 10) {
            // Only store first 10 errors to avoid memory issues
            console.error(`Failed to backup file ${file.name}:`, fileError);
          }
        }
      }

      // Step 3: Calculate results
      const duration = Date.now() - startTime;
      const result: BackupResult = {
        success: errorCount === 0,
        totalFiles: files.length,
        backedUpCount,
        errorCount,
        backupPath,
        duration,
        errors: errors.slice(0, 10) // Only store first 10 errors
      };

      // Step 4: Log backup result to Firestore
      try {
        await admin.firestore().collection('backup_logs').add({
          type: 'files',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          filesCount: files.length,
          backedUpCount,
          errorCount,
          backupPath,
          duration,
          success: result.success,
          errors: result.errors
        });

        info('Backup log saved to Firestore', {
          backupPath,
          backedUpCount,
          errorCount
        });
      } catch (firestoreError) {
        // Log but don't fail the function
        logError('Failed to save backup log to Firestore', firestoreError as Error);
      }

      // Log performance metric
      logPerformanceMetric('backup-duration', duration, {
        filesCount: files.length,
        backedUpCount,
        errorCount
      });

      // Log final result
      if (result.success) {
        info('File backup completed successfully', {
          total: files.length,
          backedUpCount,
          duration: `${(duration / 1000).toFixed(2)}s`,
          backupPath
        });
      } else {
        warn('File backup completed with errors', {
          total: files.length,
          backedUpCount,
          errorCount,
          duration: `${(duration / 1000).toFixed(2)}s`,
          backupPath
        });
      }

      // Return void as required by onSchedule
      return;
    } catch (error) {
      const duration = Date.now() - startTime;

      logError('File backup failed', error as Error);

      // Log failure to Firestore
      try {
        await admin
          .firestore()
          .collection('backup_logs')
          .add({
            type: 'files',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            duration
          });
      } catch (firestoreError) {
        console.error('Failed to log backup failure to Firestore:', firestoreError);
      }

      // Re-throw to mark function as failed
      throw error;
    }
  }
);
