import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'members', pathMatch: 'full' },
  {
    path: 'members',
    loadComponent: () => import('./members/team-members.component').then(m => m.TeamMembersComponent),
    data: { title: '團隊成員' }
  }
];
