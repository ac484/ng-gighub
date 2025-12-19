/**
 * Parties Tab Component
 * 合約方資訊標籤元件
 *
 * Feature: Detail
 * Responsibility: Display owner and contractor information
 * Coupling: Low - only requires contract input
 */

import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import type { Contract } from '@core/blueprint/modules/implementations/contract/models';
import { SHARED_IMPORTS } from '@shared';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzDividerModule } from 'ng-zorro-antd/divider';

@Component({
  selector: 'app-parties-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzDescriptionsModule, NzDividerModule],
  template: `
    <nz-divider nzText="業主資訊" nzOrientation="left"></nz-divider>
    @if (contract().owner) {
      <nz-descriptions nzBordered [nzColumn]="1">
        <nz-descriptions-item nzTitle="公司名稱">
          {{ contract().owner!.name }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="聯絡人">
          {{ contract().owner!.contactPerson }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="電話">
          {{ contract().owner!.contactPhone }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="電子郵件">
          {{ contract().owner!.contactEmail }}
        </nz-descriptions-item>
        @if (contract().owner!.address) {
          <nz-descriptions-item nzTitle="地址">
            {{ contract().owner!.address }}
          </nz-descriptions-item>
        }
        @if (contract().owner!.taxId) {
          <nz-descriptions-item nzTitle="統一編號">
            {{ contract().owner!.taxId }}
          </nz-descriptions-item>
        }
      </nz-descriptions>
    }

    <nz-divider nzText="承商資訊" nzOrientation="left"></nz-divider>
    @if (contract().contractor) {
      <nz-descriptions nzBordered [nzColumn]="1">
        <nz-descriptions-item nzTitle="公司名稱">
          {{ contract().contractor!.name }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="聯絡人">
          {{ contract().contractor!.contactPerson }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="電話">
          {{ contract().contractor!.contactPhone }}
        </nz-descriptions-item>
        <nz-descriptions-item nzTitle="電子郵件">
          {{ contract().contractor!.contactEmail }}
        </nz-descriptions-item>
        @if (contract().contractor!.address) {
          <nz-descriptions-item nzTitle="地址">
            {{ contract().contractor!.address }}
          </nz-descriptions-item>
        }
        @if (contract().contractor!.taxId) {
          <nz-descriptions-item nzTitle="統一編號">
            {{ contract().contractor!.taxId }}
          </nz-descriptions-item>
        }
      </nz-descriptions>
    }
  `
})
export class PartiesTabComponent {
  contract = input.required<Contract>();
}
