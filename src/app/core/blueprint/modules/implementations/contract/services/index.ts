/**
 * Contract Module - Services Export
 *
 * Specialized service implementations for file handling and AI parsing.
 * Business logic has been migrated to ContractFacade.
 *
 * @author GigHub Development Team
 * @date 2025-12-17
 */

// Specialized services (kept)
export * from './contract-upload.service';
export * from './contract-parsing.service';

// Removed services (migrated to ContractFacade):
// - contract-management.service → ContractFacade (CRUD operations)
// - contract-creation.service → ContractFacade.createContract()
// - contract-status.service → ContractFacade.changeContractStatus()
// - contract-lifecycle.service → ContractFacade (lifecycle workflows)
// - contract-work-items.service → ContractFacade (work item logic)
// - contract-event.service → ContractFacade (integrated with BlueprintEventBus)
