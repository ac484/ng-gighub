import { Routes } from '@angular/router';
import { TasksShellComponent } from './tasks-shell.component';
import { TasksModuleViewComponent } from './tasks-module-view.component';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksShellComponent,
    children: [
      {
        path: '',
        component: TasksModuleViewComponent
      }
    ]
  }
];
