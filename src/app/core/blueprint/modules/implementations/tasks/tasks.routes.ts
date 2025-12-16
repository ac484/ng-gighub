/**
 * Tasks Module Routes
 *
 * Route configuration for Tasks module.
 */

import { Routes } from '@angular/router';

import { TasksComponent } from './tasks.component';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksComponent,
    data: { title: '任務管理' }
  }
];
