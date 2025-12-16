import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'members', pathMatch: 'full' },
  {
    path: 'members',
    loadComponent: () => import('./members/organization-members.component').then(m => m.OrganizationMembersComponent),
    data: { title: '組織成員' }
  },
  {
    path: 'teams',
    loadComponent: () => import('./teams/organization-teams.component').then(m => m.OrganizationTeamsComponent),
    data: { title: '團隊管理' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/organization-settings.component').then(m => m.OrganizationSettingsComponent),
    data: { title: '組織設定' }
  }
];
