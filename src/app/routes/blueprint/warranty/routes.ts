/**
 * Warranty Routes Configuration
 *
 * SETC-038: Warranty UI Components
 *
 * 保固管理相關路由配置
 *
 * @module WarrantyRoutes
 * @author GigHub Development Team
 * @date 2025-12-16
 */

import { Routes } from '@angular/router';

export const WARRANTY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./warranty-list.component').then(m => m.WarrantyListComponent)
  },
  {
    path: ':warrantyId/defects',
    loadComponent: () => import('./warranty-defect-list.component').then(m => m.WarrantyDefectListComponent)
  }
];

export default WARRANTY_ROUTES;
