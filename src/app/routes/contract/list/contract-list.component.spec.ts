import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ContractListComponent } from './contract-list.component';
import { ContractFacade } from '@core/facades/contract.facade';
import { Contract, ContractStatus } from '@core/domain/models/contract.model';
import { BehaviorSubject } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('ContractListComponent', () => {
  let component: ContractListComponent;
  let fixture: ComponentFixture<ContractListComponent>;
  let contractFacade: jasmine.SpyObj<ContractFacade>;
  let router: jasmine.SpyObj<Router>;
  let queryParamsSubject: BehaviorSubject<any>;
  let paramMapSubject: BehaviorSubject<any>;
  let messageService: jasmine.SpyObj<NzMessageService>;

  // Mock data
  const mockContracts: Contract[] = [
    {
      id: 'contract-1',
      blueprintId: 'blueprint-1',
      title: 'Test Contract 1',
      contractNumber: 'CT-2024-001',
      status: 'draft' as ContractStatus,
      owner: { id: 'owner-1', name: 'Owner Company', type: 'organization' as const },
      contractor: { id: 'contractor-1', name: 'Contractor Company', type: 'organization' as const },
      totalAmount: { amount: 1000000, currency: 'TWD' },
      signingDate: '2024-01-15',
      startDate: '2024-02-01',
      endDate: '2024-12-31',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 1
    },
    {
      id: 'contract-2',
      blueprintId: 'blueprint-1',
      title: 'Test Contract 2',
      contractNumber: 'CT-2024-002',
      status: 'active' as ContractStatus,
      owner: { id: 'owner-1', name: 'Owner Company', type: 'organization' as const },
      contractor: { id: 'contractor-2', name: 'Another Contractor', type: 'organization' as const },
      totalAmount: { amount: 2000000, currency: 'TWD' },
      signingDate: '2024-02-01',
      startDate: '2024-03-01',
      endDate: '2025-02-28',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-01'),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 1
    },
    {
      id: 'contract-3',
      blueprintId: 'blueprint-1',
      title: 'Completed Contract',
      contractNumber: 'CT-2023-099',
      status: 'completed' as ContractStatus,
      owner: { id: 'owner-1', name: 'Owner Company', type: 'organization' as const },
      contractor: { id: 'contractor-1', name: 'Contractor Company', type: 'organization' as const },
      totalAmount: { amount: 500000, currency: 'TWD' },
      signingDate: '2023-06-01',
      startDate: '2023-07-01',
      endDate: '2023-12-31',
      createdAt: new Date('2023-05-15'),
      updatedAt: new Date('2023-12-31'),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 1
    }
  ];

  beforeEach(async () => {
    // Create Facade spy with signal mocks
    const contractsSignal: WritableSignal<Contract[]> = signal(mockContracts);
    const loadingSignal: WritableSignal<boolean> = signal(false);
    const errorSignal: WritableSignal<string | null> = signal(null);

    contractFacade = jasmine.createSpyObj('ContractFacade', [
      'loadContracts',
      'deleteContract',
      'reset'
    ], {
      contracts: contractsSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      error: errorSignal.asReadonly()
    });

    // Create Router spy
    router = jasmine.createSpyObj('Router', ['navigate']);

    // Create ActivatedRoute spy with queryParams observable
    const queryParamsSubject = new Subject<any>();
    activatedRoute = jasmine.createSpyObj('ActivatedRoute', [], {
      queryParams: queryParamsSubject.asObservable()
    });

    // Create MessageService spy
    messageService = jasmine.createSpyObj('NzMessageService', [
      'success',
      'error',
      'warning',
      'info'
    ]);

    await TestBed.configureTestingModule({
      imports: [ContractListComponent],
      providers: [
        { provide: ContractFacade, useValue: contractFacade },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: NzMessageService, useValue: messageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load contracts on init', () => {
      fixture.detectChanges();
      expect(contractFacade.loadContracts).toHaveBeenCalledWith('blueprint-1');
    });

    it('should restore filters from URL query params', () => {
      const queryParams = {
        search: 'test',
        status: 'draft,active',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      };

      // Emit query params before init
      (activatedRoute.queryParams as any).next(queryParams);
      fixture.detectChanges();

      expect(component.searchText()).toBe('test');
      expect(component.selectedStatuses()).toEqual(['draft', 'active']);
      expect(component.dateRangeFrom()).toBe('2024-01-01');
      expect(component.dateRangeTo()).toBe('2024-12-31');
    });

    it('should set default blueprint ID if not provided', () => {
      fixture.detectChanges();
      expect(component.blueprintId()).toBe('blueprint-1');
    });
  });

  describe('Statistics Computed Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate total contracts', () => {
      expect(component.totalContracts()).toBe(3);
    });

    it('should calculate draft count', () => {
      expect(component.draftCount()).toBe(1);
    });

    it('should calculate pending activation count', () => {
      expect(component.pendingActivationCount()).toBe(0);
    });

    it('should calculate active count', () => {
      expect(component.activeCount()).toBe(1);
    });

    it('should calculate completed count', () => {
      expect(component.completedCount()).toBe(1);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by search text (title)', () => {
      component.searchText.set('Completed');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].title).toBe('Completed Contract');
    });

    it('should filter by search text (contract number)', () => {
      component.searchText.set('CT-2024-001');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractNumber).toBe('CT-2024-001');
    });

    it('should filter by status', () => {
      component.selectedStatuses.set(['draft']);
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].status).toBe('draft');
    });

    it('should filter by multiple statuses', () => {
      component.selectedStatuses.set(['draft', 'active']);
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(2);
    });

    it('should filter by date range (from)', () => {
      component.dateRangeFrom.set('2024-01-01');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(2); // Excludes 2023 contract
    });

    it('should filter by date range (to)', () => {
      component.dateRangeTo.set('2023-12-31');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1); // Only 2023 contract
    });

    it('should filter by complete date range', () => {
      component.dateRangeFrom.set('2024-01-01');
      component.dateRangeTo.set('2024-02-28');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(2);
    });

    it('should combine all filters', () => {
      component.searchText.set('Test');
      component.selectedStatuses.set(['active']);
      component.dateRangeFrom.set('2024-01-01');
      const filtered = component.filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('contract-2');
    });

    it('should calculate active filters count', () => {
      expect(component.activeFiltersCount()).toBe(0);

      component.searchText.set('test');
      expect(component.activeFiltersCount()).toBe(1);

      component.selectedStatuses.set(['draft']);
      expect(component.activeFiltersCount()).toBe(2);

      component.dateRangeFrom.set('2024-01-01');
      expect(component.activeFiltersCount()).toBe(3);
    });

    it('should show active filters indicator', () => {
      expect(component.hasActiveFilters()).toBe(false);

      component.searchText.set('test');
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('Search Debouncing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should debounce search input', (done) => {
      let callCount = 0;
      component.searchSubject.subscribe(() => {
        callCount++;
      });

      // Emit multiple values rapidly
      component.onSearchChange('a');
      component.onSearchChange('ab');
      component.onSearchChange('abc');

      // Should only trigger once after debounce time
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 400);
    });

    it('should update search text signal', () => {
      component.onSearchChange('test search');
      setTimeout(() => {
        expect(component.searchText()).toBe('test search');
      }, 400);
    });
  });

  describe('Filter Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update URL params when filters change', () => {
      component.searchText.set('test');
      component.selectedStatuses.set(['draft', 'active']);
      component.dateRangeFrom.set('2024-01-01');
      component.updateUrlParams();

      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: activatedRoute,
        queryParams: jasmine.objectContaining({
          search: 'test',
          status: 'draft,active',
          dateFrom: '2024-01-01'
        }),
        queryParamsHandling: 'merge'
      });
    });

    it('should clear all filters', () => {
      component.searchText.set('test');
      component.selectedStatuses.set(['draft']);
      component.dateRangeFrom.set('2024-01-01');
      component.dateRangeTo.set('2024-12-31');

      component.clearAllFilters();

      expect(component.searchText()).toBe('');
      expect(component.selectedStatuses()).toEqual([]);
      expect(component.dateRangeFrom()).toBeNull();
      expect(component.dateRangeTo()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith([], {
        relativeTo: activatedRoute,
        queryParams: {},
        queryParamsHandling: 'merge'
      });
    });
  });

  describe('Bulk Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select all contracts', () => {
      component.selectAll();
      expect(component.selectedContracts().length).toBe(3);
    });

    it('should deselect all contracts', () => {
      component.selectAll();
      component.deselectAll();
      expect(component.selectedContracts().length).toBe(0);
    });

    it('should toggle selection', () => {
      component.selectAll();
      component.toggleSelection();
      expect(component.selectedContracts().length).toBe(0);

      component.toggleSelection();
      expect(component.selectedContracts().length).toBe(3);
    });

    it('should clear selection', () => {
      component.selectAll();
      component.clearSelection();
      expect(component.selectedContracts().length).toBe(0);
    });

    it('should calculate selected contracts', () => {
      expect(component.hasSelectedContracts()).toBe(false);

      component.selectAll();
      expect(component.hasSelectedContracts()).toBe(true);
    });

    it('should calculate deletable contracts', () => {
      component.selectAll();
      const deletable = component.deletableSelected();
      expect(deletable.length).toBe(1); // Only draft can be deleted
      expect(deletable[0].status).toBe('draft');
    });
  });

  describe('Bulk Delete', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show warning if no contracts selected', async () => {
      await component.bulkDelete();
      expect(messageService.warning).toHaveBeenCalledWith('請先選擇要刪除的合約');
    });

    it('should show warning if no deletable contracts', async () => {
      // Select only non-draft contracts
      component.selectedContracts.set([mockContracts[1], mockContracts[2]]);
      await component.bulkDelete();
      expect(messageService.warning).toHaveBeenCalledWith('只能刪除草稿狀態的合約');
    });

    it('should delete contracts after confirmation', async () => {
      // Select draft contract
      component.selectedContracts.set([mockContracts[0]]);

      // Mock confirm dialog
      spyOn(window, 'confirm').and.returnValue(true);

      contractFacade.deleteContract.and.returnValue(Promise.resolve());

      await component.bulkDelete();

      expect(contractFacade.deleteContract).toHaveBeenCalledWith('contract-1');
      expect(messageService.success).toHaveBeenCalledWith('成功刪除 1 筆合約');
    });

    it('should cancel delete if not confirmed', async () => {
      component.selectedContracts.set([mockContracts[0]]);
      spyOn(window, 'confirm').and.returnValue(false);

      await component.bulkDelete();

      expect(contractFacade.deleteContract).not.toHaveBeenCalled();
    });

    it('should handle delete errors gracefully', async () => {
      component.selectedContracts.set([mockContracts[0]]);
      spyOn(window, 'confirm').and.returnValue(true);

      contractFacade.deleteContract.and.returnValue(Promise.reject(new Error('Delete failed')));

      await component.bulkDelete();

      expect(messageService.warning).toHaveBeenCalledWith(
        jasmine.stringContaining('失敗 1 筆')
      );
    });
  });

  describe('Bulk Export', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show warning if no contracts selected', async () => {
      await component.bulkExport();
      expect(messageService.warning).toHaveBeenCalledWith('請先選擇要匯出的合約');
    });

    it('should export selected contracts to CSV', async () => {
      component.selectedContracts.set([mockContracts[0], mockContracts[1]]);

      // Spy on document methods
      const createElementSpy = spyOn(document, 'createElement').and.callThrough();
      const appendChildSpy = spyOn(document.body, 'appendChild').and.callThrough();
      const removeChildSpy = spyOn(document.body, 'removeChild').and.callThrough();

      await component.bulkExport();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(messageService.success).toHaveBeenCalledWith('已匯出 2 筆合約');
    });

    it('should handle export errors', async () => {
      component.selectedContracts.set([mockContracts[0]]);

      // Mock error in CSV generation
      spyOn(document, 'createElement').and.throwError('Export failed');

      await component.bulkExport();

      expect(messageService.error).toHaveBeenCalledWith('匯出合約失敗');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to create page', () => {
      component.onCreateContract();
      expect(router.navigate).toHaveBeenCalledWith(['create'], {
        relativeTo: activatedRoute
      });
    });

    it('should navigate to detail page', () => {
      component.onViewContract('contract-1');
      expect(router.navigate).toHaveBeenCalledWith(['contract-1'], {
        relativeTo: activatedRoute
      });
    });

    it('should navigate to edit page', () => {
      component.onEditContract('contract-1');
      expect(router.navigate).toHaveBeenCalledWith(['contract-1', 'edit'], {
        relativeTo: activatedRoute
      });
    });
  });

  describe('Delete Single Contract', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should delete contract after confirmation', async () => {
      spyOn(window, 'confirm').and.returnValue(true);
      contractFacade.deleteContract.and.returnValue(Promise.resolve());

      await component.onDeleteContract('contract-1');

      expect(contractFacade.deleteContract).toHaveBeenCalledWith('contract-1');
      expect(messageService.success).toHaveBeenCalledWith('合約刪除成功');
    });

    it('should cancel delete if not confirmed', async () => {
      spyOn(window, 'confirm').and.returnValue(false);

      await component.onDeleteContract('contract-1');

      expect(contractFacade.deleteContract).not.toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      spyOn(window, 'confirm').and.returnValue(true);
      contractFacade.deleteContract.and.returnValue(Promise.reject(new Error('Delete failed')));

      await component.onDeleteContract('contract-1');

      expect(messageService.error).toHaveBeenCalledWith('合約刪除失敗');
    });
  });

  describe('Component Cleanup', () => {
    it('should reset facade on destroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(contractFacade.reset).toHaveBeenCalled();
    });
  });
});
