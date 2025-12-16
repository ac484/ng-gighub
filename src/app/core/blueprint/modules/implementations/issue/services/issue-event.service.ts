/**
 * Issue Event Service
 *
 * Centralized event handling for Issue Module.
 * Provides type-safe event emission and subscription methods.
 * Integrates with Blueprint Event Bus.
 *
 * @author GigHub Development Team
 * @date 2025-12-15
 */

import { Injectable, inject, DestroyRef } from '@angular/core';
import { LoggerService } from '@core';
import { EventBus } from '@core/blueprint/events';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ISSUE_MODULE_EVENTS } from '../module.metadata';

/**
 * Issue event payload types
 */
export interface IssueCreatedEventData {
  issueId: string;
  source: 'manual' | 'acceptance' | 'qc' | 'warranty' | 'safety';
  blueprintId: string;
}

export interface IssueUpdatedEventData {
  issueId: string;
  action?: string;
  previousStatus?: string;
  newStatus?: string;
  changedBy?: string;
}

export interface IssueAssignedEventData {
  issueId: string;
  assignedTo: string;
}

export interface IssueResolvedEventData {
  issueId: string;
  resolution: {
    method: string;
    resolvedBy: string;
    cost?: number;
  };
}

export interface IssueVerifiedEventData {
  issueId: string;
  verifiedBy: string;
}

export interface IssueClosedEventData {
  issueId: string;
  closedBy?: string;
  notes?: string;
}

export interface IssuesCreatedFromSourceEventData {
  sourceId: string;
  issueIds: string[];
  count: number;
}

/**
 * Union type for all issue event data types
 */
export type IssueEventData =
  | IssueCreatedEventData
  | IssueUpdatedEventData
  | IssueAssignedEventData
  | IssueResolvedEventData
  | IssueVerifiedEventData
  | IssueClosedEventData
  | IssuesCreatedFromSourceEventData;

/**
 * Issue event type (from module metadata)
 */
export type IssueEventType = (typeof ISSUE_MODULE_EVENTS)[keyof typeof ISSUE_MODULE_EVENTS];

@Injectable({ providedIn: 'root' })
export class IssueEventService {
  private readonly eventBus = inject(EventBus);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  /** Local event subject for internal module communication */
  private readonly localEvents = new Subject<{ type: IssueEventType; data: IssueEventData }>();

  /**
   * Emit an issue event via the Event Bus
   *
   * @param eventType Type of event to emit
   * @param data Event payload
   */
  emit(eventType: IssueEventType, data: IssueEventData): void {
    this.logger.debug('[IssueEventService]', `Emitting event: ${eventType}`, data);

    // Emit via global Event Bus
    this.eventBus.emit(eventType, data, 'issue');

    // Also emit locally for internal subscriptions
    this.localEvents.next({ type: eventType, data });
  }

  /**
   * Subscribe to a specific issue event type
   *
   * @param eventType Type of event to listen for
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  on<T extends IssueEventData>(eventType: IssueEventType, handler: (data: T) => void): () => void {
    return this.eventBus.on<T>(eventType, event => {
      handler(event.payload);
    });
  }

  /**
   * Subscribe to issue events once
   *
   * @param eventType Type of event to listen for
   * @param handler Event handler function
   * @returns Unsubscribe function
   */
  once<T extends IssueEventData>(eventType: IssueEventType, handler: (data: T) => void): () => void {
    return this.eventBus.once<T>(eventType, event => {
      handler(event.payload);
    });
  }

  /**
   * Get observable for local events (for component subscriptions)
   *
   * @param eventType Optional: filter by event type
   * @returns Observable of issue events
   */
  getLocalEvents(eventType?: IssueEventType): Observable<{ type: IssueEventType; data: IssueEventData }> {
    if (eventType) {
      return this.localEvents.pipe(filter(event => event.type === eventType));
    }
    return this.localEvents.asObservable();
  }

  /**
   * Subscribe to events from other modules that may trigger issue creation
   * This sets up listeners for acceptance failures, QC failures, etc.
   */
  setupExternalEventListeners(
    handlers: {
      onAcceptanceFailed?: (data: { acceptanceId: string; blueprintId: string; failedItems: unknown[] }) => void;
      onQCFailed?: (data: { inspectionId: string; blueprintId: string; failedItems: unknown[] }) => void;
      onWarrantyDefect?: (data: { defectId: string; blueprintId: string }) => void;
      onSafetyIncident?: (data: { incidentId: string; blueprintId: string }) => void;
    } = {}
  ): Array<() => void> {
    const unsubscribers: Array<() => void> = [];

    if (handlers.onAcceptanceFailed) {
      const unsub = this.eventBus.on('acceptance.failed', event => {
        this.logger.info('[IssueEventService]', 'Received acceptance.failed event');
        handlers.onAcceptanceFailed?.(event.payload as { acceptanceId: string; blueprintId: string; failedItems: unknown[] });
      });
      unsubscribers.push(unsub);
    }

    if (handlers.onQCFailed) {
      const unsub = this.eventBus.on('qa.inspection_failed', event => {
        this.logger.info('[IssueEventService]', 'Received qa.inspection_failed event');
        handlers.onQCFailed?.(event.payload as { inspectionId: string; blueprintId: string; failedItems: unknown[] });
      });
      unsubscribers.push(unsub);
    }

    if (handlers.onWarrantyDefect) {
      const unsub = this.eventBus.on('warranty.defect_reported', event => {
        this.logger.info('[IssueEventService]', 'Received warranty.defect_reported event');
        handlers.onWarrantyDefect?.(event.payload as { defectId: string; blueprintId: string });
      });
      unsubscribers.push(unsub);
    }

    if (handlers.onSafetyIncident) {
      const unsub = this.eventBus.on('safety.incident_reported', event => {
        this.logger.info('[IssueEventService]', 'Received safety.incident_reported event');
        handlers.onSafetyIncident?.(event.payload as { incidentId: string; blueprintId: string });
      });
      unsubscribers.push(unsub);
    }

    return unsubscribers;
  }
}
