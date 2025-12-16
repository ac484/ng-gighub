# Construction Log Module (工地施工日誌模組)

## Overview

The Construction Log module provides a streamlined solution for managing daily construction site logs with photo attachments. It follows modern Angular 20 patterns with Signals and Firebase/Firestore backend.

**Design Philosophy**: Occam's Razor - minimum complexity, maximum clarity.

## Features

- ✅ **Daily Log Management**: Create, view, edit, and delete construction logs
- ✅ **Photo Upload**: Upload and manage multiple photos per log with Supabase Storage
- ✅ **Weather Tracking**: Record weather conditions and temperature
- ✅ **Work Details**: Track work hours, worker count, and equipment used
- ✅ **Real-time Updates**: Automatic sync with Supabase Realtime (ready for future implementation)
- ✅ **Row Level Security**: Secure data access with Supabase RLS policies
- ✅ **Statistics**: View total logs, monthly logs, daily logs, and photo counts
- ✅ **Responsive UI**: Built with ng-zorro-antd components

## Architecture

This module follows a simplified two-layer architecture:

```
Construction Log Module
├── construction-log.component.ts       # Presentation Layer (UI)
├── construction-log-modal.component.ts # Modal for create/edit/view
└── construction-log.store.ts          # Business Logic Layer (Signals Store)
    └── Uses LogFirestoreRepository     # Data Access (from @core/repositories)
```

### Layer Responsibilities

1. **Presentation Layer** (`*.component.ts`)
   - Display data using ng-alain ST table
   - Handle user interactions
   - Manage modal dialogs
   - Use Angular Signals for reactive updates

2. **Business Logic Layer** (`*.store.ts`)
   - Manage application state with Angular Signals
   - Provide computed statistics
   - Coordinate data operations via LogFirestoreRepository
   - Handle error states

3. **Data Access Layer** (`LogFirestoreRepository` in @core/repositories)
   - Interact with Firebase Firestore
   - Handle file uploads to Firebase Storage
   - Map database models to domain entities
   - Implement query filtering
   - **Shared across all modules** (not duplicated)

## Usage

### Integration in Blueprint Detail

The module is integrated as a tab in the Blueprint Detail page:

```typescript
// blueprint-detail.component.ts
import { ConstructionLogComponent } from './construction-log/construction-log.component';

@Component({
  // ...
  imports: [
    // ...
    ConstructionLogComponent
  ],
  template: `
    <nz-tab nzTitle="日誌">
      <ng-template nz-tab>
        @if (blueprint()?.id) {
          <app-construction-log [blueprintId]="blueprint()!.id" />
        }
      </ng-template>
    </nz-tab>
  `
})
```

### Standalone Usage

You can also use the component standalone:

```typescript
import { ConstructionLogComponent } from '@routes/blueprint/construction-log';

@Component({
  template: `
    <app-construction-log [blueprintId]="blueprintId" />
  `
})
export class MyComponent {
  blueprintId = 'your-blueprint-id';
}
```

## API Reference

### ConstructionLogComponent

**Inputs:**
- `blueprintId: string` (required) - The blueprint ID to load logs for

**Features:**
- ST table with sorting, pagination, and filtering
- Create/Edit/View/Delete operations
- Photo upload and preview
- Statistics display

### ConstructionLogStore

**State Signals:**
- `logs: Signal<Log[]>` - List of logs (readonly)
- `loading: Signal<boolean>` - Loading state (readonly)
- `error: Signal<string | null>` - Error message (readonly)

**Computed Signals:**
- `totalCount: Signal<number>` - Total number of logs
- `thisMonthCount: Signal<number>` - Logs created this month
- `todayCount: Signal<number>` - Logs created today
- `totalPhotos: Signal<number>` - Total number of photos across all logs

**Actions:**
- `loadLogs(blueprintId: string, options?: LogQueryOptions): Promise<void>`
- `createLog(request: CreateLogRequest): Promise<Log | null>`
- `updateLog(blueprintId: string, logId: string, request: UpdateLogRequest): Promise<Log | null>`
- `deleteLog(blueprintId: string, logId: string): Promise<void>`
- `uploadPhoto(blueprintId: string, logId: string, file: File): Promise<string | null>`
- `deletePhoto(blueprintId: string, logId: string, photoId: string): Promise<void>`

### LogFirestoreRepository (from @core/repositories)

**Key Methods:**
- `findByBlueprint(blueprintId: string, options?: LogQueryOptions): Promise<Log[]>`
- `findById(id: string): Promise<Log | null>`
- `create(request: CreateLogRequest): Promise<Log>`
- `update(id: string, request: UpdateLogRequest): Promise<void>`
- `delete(id: string): Promise<void>` (soft delete)
- `uploadPhoto(logId: string, file: File, caption?: string): Promise<LogPhoto>`
- `deletePhoto(logId: string, photoId: string): Promise<void>`

## Data Model

### Log Interface (Simplified)

```typescript
interface Log {
  id: string;
  blueprintId: string;
  date: Date;
  title: string;
  description?: string;
  workHours?: number;
  workers?: number;
  equipment?: string;
  weather?: string;
  temperature?: number;
  photos: LogPhoto[];
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
```

**Note**: Reserved fields (voiceRecords, documents, metadata) have been removed to reduce complexity. They can be added back when actually needed.

### LogPhoto Interface

```typescript
interface LogPhoto {
  id: string;
  url: string;
  publicUrl?: string;
  caption?: string;
  uploadedAt: Date;
  size?: number;
  fileName?: string;
}
```

## Firebase/Firestore Setup

### Required Firestore Collection

Collection: `logs`
- Automatic creation on first write
- Security rules managed at project level
- Indexes created automatically by Firestore

### Required Firebase Storage Bucket

Bucket: `log-photos`
- Used for storing log photo attachments
- Security rules managed at project level
- Automatic public URL generation

## Development Guidelines

### Adding New Fields

To add new fields to logs:

1. Update type definition in `@core/types/log/log.types.ts`
2. Update `LogFirestoreRepository.toEntity()` and `toDocument()` methods
3. Add form field in `construction-log-modal.component.ts`
4. Update ST column in `construction-log.component.ts`

### Extending Functionality

The module follows a minimalist approach. Add features only when needed:

- **Voice Records**: Can be added to Log interface when feature is planned
- **Documents**: Can be added similar to photos using Firebase Storage
- **Realtime Updates**: Can subscribe to Firestore changes using AngularFire
- **Export**: Can add PDF/Excel export when business requirement emerges

**Principle**: Don't add complexity for "future-proofing" - add it when you need it.

## Best Practices

1. **Always use Signals** for state management
2. **Use input() function** instead of @Input() decorator (Angular 19+)
3. **Use new control flow** syntax (@if, @for) instead of *ngIf, *ngFor
4. **Keep components thin** - delegate logic to Store
5. **Type everything** - use strict TypeScript
6. **Test with RLS enabled** - ensure security policies work correctly

## Potential Future Enhancements

*Note: Add these only when there's a clear business need*

- [ ] Realtime updates when other users add logs
- [ ] Export to PDF/Excel
- [ ] Advanced filtering and search
- [ ] Voice recording support (if needed)
- [ ] Document attachments (if needed)
- [ ] Weather API integration for auto-fill

## Troubleshooting

### Photos not uploading
- Check Firebase Storage bucket exists: `log-photos`
- Verify Firebase security rules allow access
- Ensure file size is under 5MB
- Check browser console for errors

### Logs not appearing
- Verify blueprint ID is correct
- Check Firestore security rules allow read access
- Check browser network tab for API errors
- Verify LogFirestoreRepository is properly injected

### Permission denied errors
- Check Firestore security rules
- Verify user authentication status
- Ensure Firebase project configuration is correct

## Support

For issues or questions:
1. Check this README first
2. Review code comments in source files
3. Refer to project architecture documentation
4. Contact GigHub development team

## License

Part of GigHub Construction Management System
© 2025 GigHub Development Team
