/**
 * Warranty Module Routes Configuration
 *
 * Feature-based routing for warranty management
 *
 * @module WarrantyRoutes
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Routes } from '@angular/router';

export const warrantyRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/list').then(m => m.WarrantyListComponent),
    data: { title: '保固管理' }
  },
  {
    path: ':warrantyId/defects',
    loadComponent: () => import('./features/defects').then(m => m.WarrantyDefectsComponent),
    data: { title: '缺失管理' }
  }
];

export default warrantyRoutes;
