/**
 * QA Standards Component
 * 品質標準列表元件 - 顯示品質標準與規範
 *
 * Features:
 * - Display quality standards list
 * - Link to cloud module for document management
 *
 * Part of QA Module - Feature-based architecture
 * ✅ High Cohesion: Focused on standards display
 * ✅ Low Coupling: Communicates via clear interfaces
 *
 * @module QaStandardsComponent
 * @author GigHub Development Team
 * @date 2025-12-19
 */

import { Component, ChangeDetectionStrategy, input, signal, OnInit } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

interface QaStandard {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-qa-standards',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SHARED_IMPORTS, NzAlertModule, NzEmptyModule, NzAvatarModule],
  template: `
    <nz-alert nzType="warning" nzMessage="品質標準管理" nzDescription="品質標準與規範文件請使用「雲端」模組管理。" nzShowIcon class="mb-md">
    </nz-alert>

    @if (standards().length === 0) {
      <nz-empty nzNotFoundContent="暫無品質標準記錄"></nz-empty>
    } @else {
      <nz-list [nzDataSource]="standards()" nzBordered>
        @for (standard of standards(); track standard.id) {
          <nz-list-item>
            <nz-list-item-meta [nzTitle]="standard.name" [nzDescription]="standard.description">
              <nz-list-item-meta-avatar>
                <nz-avatar nzIcon="file-text" [nzShape]="'square'" style="background-color: #1890ff;"></nz-avatar>
              </nz-list-item-meta-avatar>
            </nz-list-item-meta>
          </nz-list-item>
        }
      </nz-list>
    }
  `,
  styles: [
    `
      .mb-md {
        margin-bottom: 16px;
      }
    `
  ]
})
export class QaStandardsComponent implements OnInit {
  blueprintId = input.required<string>();

  // State
  standards = signal<QaStandard[]>([]);

  ngOnInit(): void {
    this.loadStandards();
  }

  /** Load standards data */
  private loadStandards(): void {
    // TODO: Integrate with QA services from core module
    this.standards.set([
      { id: '1', name: 'CNS 3090 混凝土標準', description: '混凝土強度與配比規範' },
      { id: '2', name: 'CNS 560 鋼筋標準', description: '鋼筋規格與品質要求' }
    ]);
  }
}
