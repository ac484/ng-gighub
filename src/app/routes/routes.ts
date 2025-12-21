import { Routes } from '@angular/router';
import { startPageGuard } from '@core';
import { authSimpleCanActivate, authSimpleCanActivateChild } from '@delon/auth';

import { LayoutBasicComponent } from '../layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutBasicComponent,
    canActivate: [startPageGuard, authSimpleCanActivate],
    canActivateChild: [authSimpleCanActivateChild],
    data: {},
    children: [
      // Redirect to user blueprints as default dashboard
      { path: '', redirectTo: 'blueprints/user', pathMatch: 'full' },
      { path: 'dashboard', redirectTo: 'blueprints/user', pathMatch: 'full' },
      { path: 'dashboard/user', redirectTo: 'blueprints/user', pathMatch: 'full' },
      {
        path: 'user',
        loadChildren: () => import('./user/routes').then(m => m.routes),
        data: { title: '個人設定' }
      },
      {
        path: 'organization',
        loadChildren: () => import('./organization/routes').then(m => m.routes),
        data: { title: '組織管理' }
      },
      {
        path: 'team',
        loadChildren: () => import('./team/routes').then(m => m.routes),
        data: { title: '團隊管理' }
      },
      {
        path: 'partner',
        loadChildren: () => import('./partner/routes').then(m => m.routes),
        data: { title: '夥伴管理' }
      },
      // Blueprint module - lazy loaded feature module
      {
        path: 'blueprints/user',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes),
        data: { title: '我的藍圖' }
      },
      { path: 'module-manager/:id', redirectTo: 'blueprints/user/:id/modules', pathMatch: 'full' },
      {
        path: 'blueprints/organization',
        loadChildren: () => import('./blueprint/routes').then(m => m.routes),
        data: { title: '組織藍圖' }
      },
      // Monitoring module - lazy loaded
      {
        path: 'monitoring',
        loadChildren: () => import('./monitoring/routes').then(m => m.routes),
        data: { title: '系統監控' }
      },
      // Explore search module - lazy loaded
      {
        path: 'explore',
        loadChildren: () => import('./explore/routes').then(m => m.routes),
        data: { title: '探索' }
      },
      // AI Assistant - Google Generative AI powered chat assistant
      {
        path: 'ai-assistant',
        loadComponent: () => import('./ai-assistant/ai-assistant.component').then(m => m.AIAssistantComponent),
        data: { title: 'AI 助理' }
      }
    ]
  },
  // passport - lazy loaded
  { path: '', loadChildren: () => import('./passport/routes').then(m => m.routes) },
  // exception - lazy loaded
  { path: 'exception', loadChildren: () => import('./exception/routes').then(m => m.routes) },
  // 404 fallback
  { path: '**', redirectTo: 'exception/404' }
];
