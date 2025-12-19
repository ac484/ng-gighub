import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./blueprint-list.component').then(m => m.BlueprintListComponent),
    data: { title: '藍圖管理' }
  },
  {
    path: ':id',
    loadComponent: () => import('./blueprint-detail.component').then(m => m.BlueprintDetailComponent),
    data: { title: '藍圖詳情' }
  },
  {
    path: ':id/designer',
    loadComponent: () => import('./blueprint-designer.component').then(m => m.BlueprintDesignerComponent),
    data: { title: '藍圖設計器' }
  },
  {
    path: ':id/members',
    loadComponent: () => import('./members/blueprint-members.component').then(m => m.BlueprintMembersComponent),
    data: { title: '成員管理' }
  },
  {
    path: ':id/audit',
    loadComponent: () => import('@core/blueprint/modules/implementations/audit-logs').then(m => m.AuditLogsComponent),
    data: { title: '審計日誌' }
  },
  {
    path: ':id/finance',
    loadChildren: () => import('./finance/routes').then(m => m.financeRoutes),
    data: { title: '財務管理' }
  }
];
