import { Routes } from '@angular/router';
import { TasksShellComponent } from './tasks-shell.component';
import { TasksListComponent } from './components/tasks-list.component';

export const TASKS_ROUTES: Routes = [
  {
    path: '',
    component: TasksShellComponent,
    children: [
      {
        path: '',
        component: TasksListComponent
      }
    ]
  }
];
