/**
 * Workflow Handlers Index
 *
 * 工作流程處理器導出
 *
 * @author GigHub Development Team
 * @date 2025-12-16
 */

// SETC-020: Task Completed Handler
export { TaskCompletedHandler, TaskCompletedEventData, AutoLogFromTaskData } from './task-completed.handler';

// SETC-021: Log Created Handler
export { LogCreatedHandler, LogCreatedEventData, QCPendingInspectionData } from './log-created.handler';

// SETC-022: QC Passed/Failed Handlers
export { QCPassedHandler, QCPassedEventData } from './qc-passed.handler';
export { QCFailedHandler, QCFailedEventData } from './qc-failed.handler';

// SETC-023: Acceptance Finalized Handler
export { AcceptanceFinalizedHandler, AcceptanceFinalizedEventData } from './acceptance-finalized.handler';
