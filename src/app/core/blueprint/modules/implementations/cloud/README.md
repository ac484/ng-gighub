# Cloud Storage Module (雲端儲存模組)

## Overview

The Cloud Storage Module provides comprehensive file management, cloud synchronization, and backup capabilities for the GigHub Blueprint system. It integrates with Firebase Storage and Firestore, and communicates with other modules via the Blueprint EventBus.

## Features

- **File Management**: Upload, download, and delete files
- **Cloud Sync**: Automatic synchronization with Firebase Storage
- **Backup & Restore**: Create and restore backups of blueprint files
- **Event-Driven**: Publishes events through the Blueprint EventBus
- **Storage Statistics**: Real-time storage usage tracking

## Quick Start

### Prerequisites

1. Firebase project configured with:
   - Firebase Storage enabled
   - Firestore database enabled
   - Authentication enabled

2. Required configuration files:
   - `firebase.json` - Firebase project configuration
   - `storage.rules` - Firebase Storage security rules
   - `firestore.rules` - Firestore security rules
   - `firestore.indexes.json` - Firestore indexes

### Deployment Steps

```bash
# 1. Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# 2. Deploy Storage rules
firebase deploy --only storage

# 3. Build and deploy application
yarn build
firebase deploy --only hosting

# 4. Verify deployment
firebase open hosting:site
```

### Required Firestore Indexes

The following indexes are required for optimal performance:

```json
{
  "collectionGroup": "cloud_files",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "blueprint_id", "order": "ASCENDING" },
    { "fieldPath": "uploaded_at", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "cloud_backups",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "blueprint_id", "order": "ASCENDING" },
    { "fieldPath": "created_at", "order": "DESCENDING" }
  ]
}
```

These are automatically created when you deploy `firestore.indexes.json`.

## Architecture

```
CloudModule (IBlueprintModule)
├─ CloudStorageService (Business Logic)
├─ CloudRepository (Data Access)
│   ├─ FirebaseStorageRepository (File Storage)
│   └─ Firestore (Metadata Storage)
└─ Models (Data Structures)
```

### Integration Points

1. **Blueprint Container**: Manages module lifecycle
2. **Event Bus**: Publishes/subscribes to events
3. **Execution Context**: Provides shared resources
4. **Firebase Storage**: Cloud storage backend for files
5. **Firestore**: Database for file metadata

## Module Lifecycle

```
UNINITIALIZED → INITIALIZING → INITIALIZED → STARTING → STARTED → READY → RUNNING
                                                                              ↓
                                                                           STOPPING → STOPPED → DISPOSED
```

## Events

### Published Events

- `cloud.file_uploaded` - File successfully uploaded
- `cloud.file_download_started` - File download started
- `cloud.file_downloaded` - File successfully downloaded
- `cloud.file_deleted` - File deleted
- `cloud.backup_created` - Backup created
- `cloud.backup_restore_started` - Backup restore started
- `cloud.backup_restored` - Backup restored
- `cloud.backup_restore_failed` - Backup restore failed
- `cloud.module_started` - Module started
- `cloud.module_stopped` - Module stopped
- `cloud.error_occurred` - Error occurred

### Subscribed Events

The module subscribes to its own events for logging and auditing purposes.

## Usage

### In UI Component

The Cloud Module is already integrated in the Blueprint Detail page:

```typescript
// src/app/routes/blueprint/blueprint-detail.component.ts
<nz-tab nzTitle="雲端">
  <ng-template nz-tab>
    @if (blueprint()?.id) {
      <app-cloud-module-view [blueprintId]="blueprint()!.id" />
    }
  </ng-template>
</nz-tab>
```

### Using the Service

```typescript
// Get module instance via execution context
const cloudModule = context.getModule('cloud');
const cloudService = cloudModule.exports.service();

// Upload file
await cloudService.uploadFile(blueprintId, {
  file: fileObject,
  metadata: {
    description: 'Blueprint CAD file',
    tags: ['design', 'floor-plan']
  },
  isPublic: false
});

// Download file
const blob = await cloudService.downloadFile(blueprintId, {
  fileId: 'file-id-here'
});

// Delete file
await cloudService.deleteFile(blueprintId, 'file-id-here');

// Create backup
await cloudService.createBackup(blueprintId, {
  name: 'Weekly Backup',
  description: 'Automated weekly backup',
  options: {
    compress: true,
    encrypt: false
  }
});

// Restore backup
await cloudService.restoreBackup(blueprintId, {
  backupId: 'backup-id-here',
  options: {
    overwrite: false
  }
});
```

### Event Subscription

```typescript
// Subscribe to file upload events
context.eventBus.on('cloud.file_uploaded', (event) => {
  console.log('File uploaded:', event.payload);
});

// Subscribe to error events
context.eventBus.on('cloud.error_occurred', (event) => {
  console.error('Cloud error:', event.payload);
});
```

## Configuration

Default configuration is defined in `module.metadata.ts`:

```typescript
{
  features: {
    maxFileSize: 104857600, // 100MB
    allowedFileTypes: ['image/*', 'application/pdf', '.dwg', '.dxf', '.rvt']
  },
  settings: {
    autoSync: false,
    syncInterval: 3600000, // 1 hour
    retentionDays: 90
  },
  limits: {
    maxItems: 50000,
    maxStorage: 10737418240, // 10GB
    maxRequests: 10000
  }
}
```

## Firebase Integration

### Storage Structure

Files are stored in Firebase Storage with the following structure:
```
blueprint-{blueprintId}/
  ├─ files/
  │   ├─ {timestamp}-{filename}
  │   └─ ...
  └─ backups/
      ├─ {timestamp}-{backupname}.zip
      └─ ...
```

### Firestore Collections

#### `cloud_files` Collection
- Document ID: Auto-generated
- Fields:
  - `blueprint_id` (string) - Blueprint ID reference
  - `name` (string) - Original filename
  - `path` (string) - Storage path
  - `size` (number) - File size in bytes
  - `mime_type` (string) - MIME type
  - `extension` (string) - File extension
  - `url` (string) - Download URL
  - `public_url` (string, optional) - Public URL if file is public
  - `status` (string) - Upload status: synced, pending, error
  - `uploaded_by` (string) - User ID who uploaded
  - `uploaded_at` (Timestamp) - Upload timestamp
  - `updated_at` (Timestamp) - Last update timestamp
  - `metadata` (map, optional) - Custom metadata
  - `bucket` (string) - Storage bucket name
  - `is_public` (boolean) - Public access flag

#### `cloud_backups` Collection
- Document ID: Auto-generated
- Fields:
  - `blueprint_id` (string) - Blueprint ID reference
  - `name` (string) - Backup name
  - `description` (string, optional) - Backup description
  - `type` (string) - Backup type: manual, automatic, scheduled
  - `status` (string) - Backup status: creating, ready, restoring, error
  - `size` (number) - Backup size in bytes
  - `file_count` (number) - Number of files in backup
  - `path` (string) - Backup file path
  - `created_at` (Timestamp) - Creation timestamp
  - `created_by` (string) - User ID who created
  - `is_encrypted` (boolean) - Encryption flag
  - `metadata` (map, optional) - Custom metadata

### Security Rules

Security rules are defined in:
- **Firestore Rules**: `firestore.rules`
- **Storage Rules**: `storage.rules`

Both files implement blueprint-scoped access control:
- Users can only access files from blueprints they have permission to
- File size limits enforced (100MB)
- Allowed file types validated
- Upload/download tracked for auditing

## Testing

```bash
# Run unit tests
yarn test src/app/core/blueprint/modules/implementations/cloud

# Run integration tests (if available)
yarn test:integration cloud

# Test with Firebase emulators
firebase emulators:start
```

### Manual Testing Checklist

- [ ] Upload a file (image, PDF, etc.)
- [ ] Verify file appears in file list
- [ ] Download uploaded file
- [ ] Delete a file
- [ ] Create a backup
- [ ] Verify backup appears in backup list
- [ ] Check storage statistics update correctly
- [ ] Verify error handling (upload invalid file type)
- [ ] Check file size limit enforcement

## Troubleshooting

### Files not appearing after upload

1. Check Firebase Storage rules are deployed:
   ```bash
   firebase deploy --only storage
   ```

2. Check Firestore rules are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. Check Firestore indexes are created:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. Check browser console for errors

### Download not working

1. Verify file exists in Firebase Storage console
2. Check download URL is generated correctly
3. Verify user has read permission on the blueprint
4. Check CORS configuration in Firebase Storage

### Upload fails silently

1. Check file size (must be <= 100MB)
2. Verify file type is allowed
3. Check Firebase Storage quota
4. Verify user is authenticated
5. Check browser console for errors

## Future Enhancements

- [ ] File versioning
- [ ] Automatic sync scheduling
- [ ] File compression before upload
- [ ] Image thumbnail generation
- [ ] CDN integration for faster downloads
- [ ] File sharing with expiry links
- [ ] Incremental backups
- [ ] Backup encryption implementation
- [ ] Progress tracking for large uploads
- [ ] Drag-and-drop file upload
- [ ] Bulk file operations

## Dependencies

- `@angular/core`: ^20.3.0
- `@angular/fire`: ^20.0.1
- `firebase`: ^11.1.0

## License

Proprietary - GigHub Development Team

---

**Last Updated**: 2025-12-14  
**Version**: 1.0.0  
**Status**: Production Ready ✅
