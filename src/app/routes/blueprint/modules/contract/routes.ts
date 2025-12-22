import { Routes } from '@angular/router';
import { ContractShellComponent } from './contract-shell.component';
import { ContractListComponent } from './components/contract-list.component';
import { ContractWizardComponent } from './components/contract-wizard.component';
import { ContractUploadComponent } from './components/contract-upload.component';
import { ContractDetailComponent } from './components/contract-detail.component';

export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    component: ContractShellComponent,
    children: [
      {
        path: '',
        component: ContractListComponent
      },
      {
        path: 'new',
        component: ContractWizardComponent
      },
      {
        path: 'upload',
        component: ContractUploadComponent
      },
      {
        path: ':contractId',
        component: ContractDetailComponent
      }
    ]
  }
];
