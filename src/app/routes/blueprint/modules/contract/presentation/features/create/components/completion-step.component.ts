/**
 * Completion Step Component
 * 完成步驟元件
 *
 * Feature: Create
 * Responsibility: Display success message and actions
 * Interface: Created contract input, action outputs
 */

import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import type { Contract } from '@core/blueprint/modules/implementations/contract/models';
import { SHARED_IMPORTS } from '@shared';
import { NzResultModule } from 'ng-zorro-antd/result';

@Component({
  selector: 'app-completion-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzResultModule],
  template: `
    <div class="step-content">
      <nz-result nzStatus="success" nzTitle="合約建立成功！" [nzSubTitle]="'合約編號: ' + createdContract()?.contractNumber">
        <div nz-result-extra>
          <button nz-button nzType="primary" (click)="viewContract.emit()"> 查看合約 </button>
          <button nz-button nzType="default" (click)="createAnother.emit()"> 建立另一筆合約 </button>
        </div>
      </nz-result>
    </div>
  `,
  styles: [
    `
      .step-content {
        max-width: 800px;
        margin: 0 auto;
      }
    `
  ]
})
export class CompletionStepComponent {
  createdContract = input<Contract | null>(null);

  readonly viewContract = output<void>();
  readonly createAnother = output<void>();
}
