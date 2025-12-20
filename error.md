PS D:\ac484\ng-gighub> yarn start                                      
Application bundle generation failed. [14.857 seconds] - 2025-12-20T18:15:30.662Z                                                                       X [ERROR] TS6133: 'LoggerService' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/context/execution-context.interface.ts:0:0: 
      0 │
        ╵ ^


X [ERROR] TS6133: 'IBlueprintConfig' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/context/execution-context.interface.ts:5:0: 
      5 │ import type { IBlueprintConfig } from '../config/blueprint-config.i...
        ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'handler' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/events/event-bus.ts:183:23:
      183 │   off<T>(type: string, handler: EventHandler<T>): void {   
          ╵                        ~~~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/cloud/repositories/cloud.repository.ts:10:79:
      10 │ ...c, updateDoc, query, where, orderBy, Timestamp } from '@angular...
         ╵                                ~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/cloud/repositories/cloud.repository.ts:225:23:
      225 │   async updateFilePath(blueprintId: string, fileId: string, newPa...
          ╵                        ~~~~~~~~~~~


X [ERROR] TS6133: 'approvalService' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/components/invoice-list.component.ts:106:10:
      106 │   private approvalService = inject(InvoiceApprovalService);
          ╵           ~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'doc' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/services/invoice-generation.service.ts:18:32:
      18 │ import { Firestore, collection, doc, addDoc, Timestamp } from '@an...
         ╵                                 ~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/services/invoice-generation.service.ts:330:38:
      330 │ ...ync generateInvoiceNumber(blueprintId: string, invoiceType: In...
          ╵                              ~~~~~~~~~~~


X [ERROR] TS6133: 'doc' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/services/payment-generation.service.ts:18:32:
      18 │ import { Firestore, collection, doc, addDoc, Timestamp } from '@an...
         ╵                                 ~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/services/payment-generation.service.ts:346:38:
      346 │ ...ync generatePaymentNumber(blueprintId: string): Promise<string> {
          ╵                              ~~~~~~~~~~~


X [ERROR] TS6133: 'takeUntilDestroyed' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/services/payment-status-tracking.service.ts:18:0:
      18 │ import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
         ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'destroyRef' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/finance/services/payment-status-tracking.service.ts:43:19:
      43 │   private readonly destroyRef = inject(DestroyRef);
         ╵                    ~~~~~~~~~~


X [ERROR] TS6133: 'computed' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/components/task-assign-modal/task-assign-modal.component.ts:14:44:
      14 │ ...omponent, OnInit, inject, signal, computed } from '@angular/core';
         ╵                                      ~~~~~~~~


X [ERROR] TS6133: 'FirebaseService' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/components/task-assign-modal/task-assign-modal.component.ts:20:0:
      20 │ import { FirebaseService } from '@core/services/firebase.service';
         ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'teamRepository' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/components/task-assign-modal/task-assign-modal.component.ts:205:10:
      205 │   private teamRepository = inject(TeamRepository);
          ╵           ~~~~~~~~~~~~~~


X [ERROR] TS6133: 'partnerRepository' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/components/task-assign-modal/task-assign-modal.component.ts:206:10:
      206 │   private partnerRepository = inject(PartnerRepository);   
          ╵           ~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'effect' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/components/task-context-menu/task-context-menu.component.ts:14:64:
      14 │ ...utput, computed, inject, ViewChild, effect } from '@angular/core';
         ╵                                        ~~~~~~


X [ERROR] TS6133: 'action' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/services/task-context-menu.service.ts:389:26:
      389 │   private isSubmenuAction(action: MenuAction): boolean {   
          ╵                           ~~~~~~


X [ERROR] TS6133: 'task' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/services/task-context-menu.service.ts:402:22:
      402 │   private hasChildren(task: Task): boolean {
          ╵                       ~~~~


X [ERROR] TS6133: 'teamRepo' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/task-modal.component.ts:285:10:
      285 │   private teamRepo = inject(TeamRepository);
          ╵           ~~~~~~~~


X [ERROR] TS6133: 'partnerRepo' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/task-modal.component.ts:286:10:
      286 │   private partnerRepo = inject(PartnerRepository);
          ╵           ~~~~~~~~~~~


X [ERROR] TS6133: 'destroyRef' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/views/task-gantt-view.component.ts:364:10:
      364 │   private destroyRef = inject(DestroyRef);
          ╵           ~~~~~~~~~~


X [ERROR] TS6133: 'task' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/views/task-gantt-view.component.ts:538:28:
      538 │   getDependencyLinePosition(task: GanttTask, depId: string): numb...
          ╵                             ~~~~


X [ERROR] TS6133: 'ganttTask' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/views/task-gantt-view.component.ts:589:19:
      589 │   getPriorityColor(ganttTask: GanttTask & { task?: Task }): string {
          ╵                    ~~~~~~~~~


X [ERROR] TS6133: 'message' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/modules/implementations/tasks/views/task-list-view.component.ts:173:10:
      173 │   private message = inject(NzMessageService);
          ╵           ~~~~~~~


X [ERROR] TS6133: 'throwError' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/blueprint/repositories/blueprint-member.repository.ts:19:32:
      19 │ import { Observable, from, map, throwError } from 'rxjs';   
         ╵                                 ~~~~~~~~~~


X [ERROR] TS6133: 'expectedExternal' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/repositories/blueprint-member.repository.ts:96:10:
      96 │     const expectedExternal = member.memberType === BlueprintMember...
         ╵           ~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'QueryConstraint' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/repositories/blueprint-module.repository.ts:27:2:
      27 │   QueryConstraint,
         ╵   ~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/repositories/blueprint-module.repository.ts:72:50:
      72 │ ...nt(data: any, id: string, blueprintId: string): BlueprintModule...
         ╵                              ~~~~~~~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/repositories/blueprint.repository.ts:11:2:  
      11 │   orderBy,
         ╵   ~~~~~~~


X [ERROR] TS6133: 'inject' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/blueprint/services/dependency-validator.service.ts:1:21:
      1 │ import { Injectable, inject } from '@angular/core';
        ╵                      ~~~~~~


X [ERROR] TS6133: 'setDoc' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/base/firestore-base.repository.ts:8:2:
      8 │   setDoc,
        ╵   ~~~~~~


X [ERROR] TS6133: 'query' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/base/firestore-base.repository.ts:11:2:
      11 │   query,
         ╵   ~~~~~


X [ERROR] TS6133: 'where' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/base/firestore-base.repository.ts:12:2:
      12 │   where,
         ╵   ~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/base/firestore-base.repository.ts:13:2:
      13 │   orderBy,
         ╵   ~~~~~~~


X [ERROR] TS6133: 'limit' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/base/firestore-base.repository.ts:14:2:
      14 │   limit,
         ╵   ~~~~~


X [ERROR] TS6133: 'QueryConstraint' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/base/firestore-base.repository.ts:15:2:
      15 │   QueryConstraint,
         ╵   ~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/shared/organization.repository.ts:13:2:
      13 │   orderBy,
         ╵   ~~~~~~~


X [ERROR] TS6133: 'QueryConstraint' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/shared/organization.repository.ts:17:2:
      17 │   QueryConstraint
         ╵   ~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/shared/team-member.repository.ts:12:2:
      12 │   orderBy
         ╵   ~~~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/shared/team.repository.ts:13:2:
      13 │   orderBy,
         ╵   ~~~~~~~


X [ERROR] TS6133: 'inject' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/task-firestore.repository.ts:1:21:
      1 │ import { Injectable, inject } from '@angular/core';
        ╵                      ~~~~~~


X [ERROR] TS6133: 'collection' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/data-access/repositories/task-firestore.repository.ts:2:9:
      2 │ import { collection, query, where, orderBy, limit as firestoreLimit...
        ╵          ~~~~~~~~~~


X [ERROR] TS6133: 'AssigneeType' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/data-access/repositories/task-firestore.repository.ts:3:83:
      3 │ ...equest, TaskQueryOptions, AssigneeType } from '@core/types/task/...
        ╵                              ~~~~~~~~~~~~


X [ERROR] TS6133: 'destroyRef' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/facades/ai/ai.store.ts:36:10:
      36 │   private destroyRef = inject(DestroyRef);
         ╵           ~~~~~~~~~~


X [ERROR] TS6133: 'FirebaseUploadResult' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/infrastructure/storage/firebase-storage.repository.ts:11:18:
      11 │   UploadResult as FirebaseUploadResult,
         ╵                   ~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'ListResult' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/infrastructure/storage/firebase-storage.repository.ts:12:2:
      12 │   ListResult
         ╵   ~~~~~~~~~~


X [ERROR] TS6133: 'options' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/infrastructure/storage/firebase-storage.repository.ts:172:51:
      172 │ ...cket: string, path: string, options?: DownloadOptions): Promis...
          ╵                                ~~~~~~~


X [ERROR] TS6133: 'options' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/infrastructure/storage/storage.repository.ts:25:51:   
      25 │ ...cket: string, path: string, options?: DownloadOptions): Promise...
         ╵                                ~~~~~~~


X [ERROR] TS6133: 'options' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/infrastructure/storage/storage.repository.ts:33:51:   
      33 │ ...t: string, folder?: string, options?: ListOptions): Promise<Fil...
         ╵                                ~~~~~~~


X [ERROR] TS6133: 'ITokenService' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/services/firebase-auth.service.ts:5:27:
      5 │ import { DA_SERVICE_TOKEN, ITokenService } from '@delon/auth';
        ╵                            ~~~~~~~~~~~~~


X [ERROR] TS6133: 'from' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/services/firebase.service.ts:7:0:
      7 │ import { from } from 'rxjs';
        ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'destroyRef' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/core/services/push-messaging.service.ts:66:19:
      66 │   private readonly destroyRef = inject(DestroyRef);
         ╵                    ~~~~~~~~~~


X [ERROR] TS6133: 'LogPhoto' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/state/stores/construction-log.store.ts:22:50:
      22 │ ...gRequest, UpdateLogRequest, LogPhoto } from '@core/types/log/lo...
         ╵                                ~~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/state/stores/construction-log.store.ts:124:18:        
      124 │   async updateLog(blueprintId: string, logId: string, request: Up...
          ╵                   ~~~~~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/state/stores/construction-log.store.ts:148:18:        
      148 │   async deleteLog(blueprintId: string, logId: string): Promise<vo...
          ╵                   ~~~~~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/state/stores/construction-log.store.ts:162:20:        
      162 │   async uploadPhoto(blueprintId: string, logId: string, file: Fil...
          ╵                     ~~~~~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/state/stores/construction-log.store.ts:187:20:        
      187 │   async deletePhoto(blueprintId: string, logId: string, photoId: ...
          ╵                     ~~~~~~~~~~~


X [ERROR] TS6133: 'partnerId' is declared but its value is never read. [plugin angular-compiler]

    src/app/core/state/stores/partner.store.ts:413:43:
      413 │ ...mberRole(memberId: string, partnerId: string, newRole: Partner...
          ╵                               ~~~~~~~~~


X [ERROR] TS6133: 'CommonModule' is declared but its value is never read. [plugin angular-compiler]

    src/app/layout/basic/widgets/context-switcher.component.ts:16:0:   
      16 │ import { CommonModule } from '@angular/common';
         ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'Bot' is declared but its value is never read. [plugin angular-compiler]

    src/app/layout/basic/widgets/context-switcher.component.ts:18:37:  
      18 │ import { ContextType, Team, Partner, Bot } from '@core';    
         ╵                                      ~~~


X [ERROR] TS6133: 'router' is declared but its value is never read. [plugin angular-compiler]

    src/app/layout/basic/widgets/user.component.ts:49:19:
      49 │   private readonly router = inject(Router);
         ╵                    ~~~~~~


X [ERROR] TS6133: 'route' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/container/container-dashboard.component.ts:201:19:
      201 │   private readonly route = inject(ActivatedRoute);
          ╵                    ~~~~~


X [ERROR] TS6133: 'router' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/container/container-dashboard.component.ts:202:19:
      202 │   private readonly router = inject(Router);
          ╵                    ~~~~~~


X [ERROR] TS6133: 'orderBy' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/agreement/agreement.repository.ts:2:79:
      2 │ ...entData, Firestore, getDocs, orderBy, query, setDoc, Timestamp, ...
        ╵                                 ~~~~~~~


X [ERROR] TS6133: 'blueprintId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/agreement/agreement.service.ts:41:25:
      41 │   async uploadAttachment(blueprintId: string, agreementId: string,...
         ╵                          ~~~~~~~~~~~


X [ERROR] TS6133: 'signal' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/cloud/features/file-list/file-list.component.ts:9:60:
      9 │ ...ngeDetectionStrategy, input, output, signal } from '@angular/core';
        ╵                                         ~~~~~~


X [ERROR] TS6133: 'signal' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/cloud/features/folder-management/folder-tree.component.ts:9:60:
      9 │ ...ngeDetectionStrategy, input, output, signal } from '@angular/core';
        ╵                                         ~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/contract.service.ts:224:97:
      224 │ ... newStatus: ContractStatus, actorId: string = 'system'): Promi...
          ╵                                ~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/contract.service.ts:329:64:
      329 │ ...string, contractId: string, actorId: string = 'system'): Promi...
          ╵                                ~~~~~~~


X [ERROR] TS6133: 'SystemEventType' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:20:0:
      20 │ import { SystemEventType } from '@core/blueprint/events/types/syst...
         ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'eventBus' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:54:19:
      54 │   private readonly eventBus = inject(EnhancedEventBusService);
         ╵                    ~~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:129:88:
      129 │ ...ng, dto: CreateWorkItemDto, actorId: string): Promise<Contract...
          ╵                                ~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:222:4:
      222 │     actorId: string
          ╵     ~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:267:4:
      267 │     actorId: string
          ╵     ~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:322:104:
      322 │ ...ItemId: string, taskId: string, actorId: string): Promise<void> {
          ╵                                    ~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:361:4:
      361 │     actorId: string
          ╵     ~~~~~~~


X [ERROR] TS6133: 'actorId' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/services/work-item.service.ts:400:84:
      400 │ ...Id: string, workItemId: string, actorId: string): Promise<void> {
          ╵                                    ~~~~~~~


X [ERROR] TS6196: 'CreateContractDto' is declared but never used. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/state/contract.store.ts:28:57:
      28 │ ...lters, ContractStatus, CreateContractDto, UpdateContractDto } f...
         ╵                           ~~~~~~~~~~~~~~~~~


X [ERROR] TS6196: 'UpdateContractDto' is declared but never used. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/application/state/contract.store.ts:28:76:
      28 │ ...us, CreateContractDto, UpdateContractDto } from '../../data/mod...
         ╵                           ~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'contract' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/contract-module-view-refactored.component.ts:281:27:
      281 │   private downloadContract(contract: Contract): void {     
          ╵                            ~~~~~~~~


X [ERROR] TS6133: 'getTimeInMs' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/infrastructure/repositories/work-item.repository.ts:55:10:
      55 │   private getTimeInMs(timestamp: unknown): number {
         ╵           ~~~~~~~~~~~


X [ERROR] TS6133: 'ContractStore' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/create/contract-creation-wizard.component.ts:14:0:
      14 │ import { ContractStore } from '@routes/blueprint/modules/contract/...
         ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'STEP_CONFIRM' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/create/contract-creation-wizard.component.ts:31:6:
      31 │ const STEP_CONFIRM = 2;
         ╵       ~~~~~~~~~~~~


X [ERROR] TS6133: 'inject' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/detail/contract-detail-drawer.component.ts:12:53:
      12 │ ...geDetectionStrategy, OnInit, inject, input, output, computed } ...
         ╵                                 ~~~~~~


X [ERROR] TS6133: 'store' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/edit/contract-edit-modal.component.ts:77:19:
      77 │   private readonly store = inject(ContractStore);
         ╵                    ~~~~~


X [ERROR] TS6133: 'auth' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/edit/contract-edit-modal.component.ts:79:19:
      79 │   private readonly auth = inject(Auth);
         ╵                    ~~~~


X [ERROR] TS6133: 'signal' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/list/components/contract-filters.component.ts:10:45:
      10 │ ...nt, ChangeDetectionStrategy, signal, output } from '@angular/co...
         ╵                                 ~~~~~~


X [ERROR] TS6133: 'event' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/list/components/contract-table.component.ts:143:20:
      143 │   handleTableChange(event: STChange): void {
          ╵                     ~~~~~


X [ERROR] TS6133: 'input' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/contract/presentation/features/preview/contract-preview-modal.component.ts:10:53:
      10 │ ...geDetectionStrategy, inject, input, signal } from '@angular/core';
         ╵                                 ~~~~~


X [ERROR] TS6133: 'record' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/finance/features/invoice-list/invoice-list.component.ts:290:9:
      290 │   submit(record: Invoice): void {
          ╵          ~~~~~~


X [ERROR] TS6133: 'formatStatusText' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/issues/issues-module-view.component.ts:34:21:
      34 │ import { escapeHtml, formatStatusText, formatSeverityText, formatS...
         ╵                      ~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'formatSeverityText' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/issues/issues-module-view.component.ts:34:39:
      34 │ ...tml, formatStatusText, formatSeverityText, formatSourceText } f...
         ╵                           ~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'formatSourceText' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/issues/issues-module-view.component.ts:34:59:
      34 │ ...tatusText, formatSeverityText, formatSourceText } from './shared';
         ╵                                   ~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'signal' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/log-module-view.component.ts:6:68:
      6 │ ...tionStrategy, OnInit, inject, input, signal } from '@angular/core';
        ╵                                         ~~~~~~


X [ERROR] TS6133: 'BlueprintRole' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/members/features/member-list/member-list.component.ts:2:26:
      2 │ import { BlueprintMember, BlueprintRole, LoggerService } from '@core';
        ╵                           ~~~~~~~~~~~~~


X [ERROR] TS6133: 'inject' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/qa/features/qa-stats/qa-stats.component.ts:19:60:
      19 │ ...tionStrategy, input, signal, inject, OnInit } from '@angular/co...
         ╵                                 ~~~~~~


X [ERROR] TS6133: 'takeUntilDestroyed' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/warranty/features/defects/warranty-defects.component.ts:14:0:
      14 │ import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
         ╵ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


X [ERROR] TS6133: 'destroyRef' is declared but its value is never read.
 [plugin angular-compiler]

    src/app/routes/blueprint/modules/warranty/features/defects/warranty-defects.component.ts:73:19:
      73 │   private readonly destroyRef = inject(DestroyRef);
         ╵                    ~~~~~~~~~~


X [ERROR] TS6133: 'inject' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/warranty/features/detail/warranty-detail-drawer.component.ts:13:45:
      13 │ ...nt, ChangeDetectionStrategy, inject, input, output, signal } fr...
         ╵                                 ~~~~~~


X [ERROR] TS6133: 'signal' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/warranty/features/detail/warranty-detail-drawer.component.ts:13:68:
      13 │ ...ionStrategy, inject, input, output, signal } from '@angular/core';
         ╵                                        ~~~~~~


X [ERROR] TS6133: 'route' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/blueprint/modules/warranty/features/list/warranty-list.component.ts:67:19:
      67 │   private readonly route = inject(ActivatedRoute);
         ╵                    ~~~~~


X [ERROR] TS6133: 'type' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/explore/components/result-grid.component.ts:332:20: 
      332 │   getEntityTagColor(type: string): string {
          ╵                     ~~~~


X [ERROR] TS6133: 'CACHE_TTL_MS' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/explore/services/explore-search.facade.ts:88:19:    
      88 │   private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
         ╵                    ~~~~~~~~~~~~


X [ERROR] TS6133: 'router' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/partner/members/partner-members.component.ts:204:19:
      204 │   private readonly router = inject(Router);
          ╵                    ~~~~~~


X [ERROR] TS6133: 'router' is declared but its value is never read. [plugin angular-compiler]

    src/app/routes/team/members/team-members.component.ts:168:19:      
      168 │   private readonly router = inject(Router);
          ╵                    ~~~~~~


Watch mode enabled. Watching for file changes...