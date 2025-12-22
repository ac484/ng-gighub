import { Routes } from '@angular/router';
import { ContractShellComponent } from './contract-shell.component';
import { ContractListComponent } from './components/contract-list.component';

export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    component: ContractShellComponent,
    children: [
      {
        path: '',
        component: ContractListComponent
      }
    ]
  }
];
