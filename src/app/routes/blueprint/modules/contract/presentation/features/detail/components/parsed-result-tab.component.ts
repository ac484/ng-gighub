import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, computed, effect, inject, input, signal } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { firstValueFrom } from 'rxjs';

import type { Contract } from '../../../../data/models';

type ParsedSource = 'contract' | 'sample';

@Component({
  selector: 'app-parsed-result-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SHARED_IMPORTS, NzAlertModule, NzButtonModule, NzEmptyModule, NzSpinModule],
  template: `
    <div class="parsed-result-tab">
      @if (error()) {
        <nz-alert nzType="error" nzShowIcon [nzMessage]="error()" class="mb-sm" />
      }

      @if (loading()) {
        <div class="loading-state" aria-live="polite">
          <nz-spin nzTip="載入解析結果..."></nz-spin>
        </div>
      }

      @if (hasData()) {
        <div class="parsed-meta" aria-label="解析來源"> 來源：{{ sourceLabel() }} </div>
        <pre class="json-view" aria-label="解析結果">{{ parsedContent() | json }}</pre>
      } @else if (!loading()) {
        <nz-empty nzNotFoundContent="尚無解析結果">
          <button nz-button nzType="default" (click)="loadSample()" [disabled]="loading()"> 載入範例 </button>
        </nz-empty>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .parsed-result-tab {
        padding: 12px 0;
      }
      .json-view {
        background: #0a0a0a;
        color: #f5f5f5;
        border-radius: 6px;
        padding: 12px;
        white-space: pre-wrap;
        word-break: break-word;
        min-height: 160px;
      }
      .parsed-meta {
        color: #4b5563;
        margin-bottom: 8px;
      }
      .loading-state {
        display: flex;
        justify-content: center;
        padding: 24px 0;
      }
    `
  ]
})
export class ParsedResultTabComponent {
  private readonly http = inject(HttpClient);

  contract = input.required<Contract>();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly parsedContent = signal<unknown | null>(null);
  readonly source = signal<ParsedSource | null>(null);

  readonly hasData = computed(() => this.parsedContent() !== null);
  readonly sourceLabel = computed(() => {
    const current = this.source();
    if (current === 'contract') return '合約原始解析資料';
    if (current === 'sample') return '範例檔 /parsed.json';
    return '未指定來源';
  });

  constructor() {
    effect(() => {
      const current = this.contract();
      if (!current?.parsedData) {
        this.parsedContent.set(null);
        this.source.set(null);
        return;
      }

      this.tryParse(current.parsedData, 'contract');
    });
  }

  async loadSample(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await firstValueFrom(this.http.get('/parsed.json'));
      this.parsedContent.set(response);
      this.source.set('sample');
    } catch (err) {
      this.error.set('無法載入範例解析結果，請稍後再試。');
    } finally {
      this.loading.set(false);
    }
  }

  private tryParse(raw: string, source: ParsedSource): void {
    this.error.set(null);
    try {
      const parsed = JSON.parse(raw);
      this.parsedContent.set(parsed);
      this.source.set(source);
    } catch (err) {
      this.parsedContent.set(null);
      this.source.set(null);
      this.error.set('合約解析資料不是有效的 JSON 格式。');
    }
  }
}
