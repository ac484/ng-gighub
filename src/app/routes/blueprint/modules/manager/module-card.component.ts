/**
 * Module Card Component
 * Interactive card displaying module information and quick actions.
 */

import { Component, input, output } from '@angular/core';
import { BlueprintModuleDocument } from '@core/models/blueprint-module.model';
import { SHARED_IMPORTS } from '@shared';

import { ModuleStatusBadgeComponent } from './module-status-badge.component';

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [SHARED_IMPORTS, ModuleStatusBadgeComponent],
  template: `
    <nz-card [nzActions]="[enableAction, configAction, deleteAction]">
      <nz-card-meta [nzTitle]="cardTitle" [nzDescription]="module().description || 'No description'"> </nz-card-meta>

      <div class="module-info mt-3">
        <p><strong>Version:</strong> {{ module().version }}</p>
        <p><strong>Type:</strong> {{ module().moduleType }}</p>
        <p><strong>Dependencies:</strong> {{ module().dependencies?.length || 0 }}</p>
        @if (module().updatedAt) {
          <p><strong>Updated:</strong> {{ module().updatedAt | date: 'short' }}</p>
        }
      </div>
    </nz-card>

    <ng-template #cardTitle>
      <div class="card-title-row">
        <label nz-checkbox [(ngModel)]="isSelected" (ngModelChange)="selectionChange.emit($event)"></label>
        <span class="module-name">{{ module().name }}</span>
        <app-module-status-badge [status]="module().status" size="small" />
      </div>
    </ng-template>

    <ng-template #enableAction>
      <button nz-button nzType="link" (click)="enableChange.emit()">
        @if (module().enabled) {
          <span nz-icon nzType="pause-circle" nzTheme="outline"></span>
          Disable
        } @else {
          <span nz-icon nzType="play-circle" nzTheme="outline"></span>
          Enable
        }
      </button>
    </ng-template>

    <ng-template #configAction>
      <button nz-button nzType="link" (click)="configClick.emit()">
        <span nz-icon nzType="setting" nzTheme="outline"></span>
        Config
      </button>
    </ng-template>

    <ng-template #deleteAction>
      <button nz-button nzType="link" nzDanger (click)="deleteClick.emit()">
        <span nz-icon nzType="delete" nzTheme="outline"></span>
        Delete
      </button>
    </ng-template>
  `,
  styles: [
    `
      .card-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .module-name {
        flex: 1;
        font-weight: 600;
      }
      .module-info p {
        margin: 4px 0;
        font-size: 13px;
      }
      .mt-3 {
        margin-top: 1rem;
      }
    `
  ]
})
export class ModuleCardComponent {
  module = input.required<BlueprintModuleDocument>();
  selected = input(false);
  isSelected = false;

  selectionChange = output<boolean>();
  enableChange = output<void>();
  configClick = output<void>();
  deleteClick = output<void>();
}
