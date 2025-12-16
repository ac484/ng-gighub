/**
 * Breadcrumb Component
 *
 * 麵包屑導航元件
 *
 * Displays breadcrumb navigation trail using ng-zorro-antd breadcrumb component.
 * Automatically updates when breadcrumb service state changes.
 *
 * @module shared/components
 */

import { CommonModule } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzIconModule } from 'ng-zorro-antd/icon';

import { BreadcrumbService } from '../../services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, NzBreadCrumbModule, NzIconModule],
  template: `
    @if (breadcrumbs().length > 0) {
      <nz-breadcrumb class="breadcrumb-container">
        @for (crumb of breadcrumbs(); track $index) {
          <nz-breadcrumb-item>
            @if (crumb.url) {
              <a [routerLink]="crumb.url">
                @if (crumb.icon) {
                  <span nz-icon [nzType]="crumb.icon" class="mr-xs"></span>
                }
                {{ crumb.label }}
              </a>
            } @else {
              @if (crumb.icon) {
                <span nz-icon [nzType]="crumb.icon" class="mr-xs"></span>
              }
              {{ crumb.label }}
            }
          </nz-breadcrumb-item>
        }
      </nz-breadcrumb>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        margin-bottom: 16px;
      }

      .breadcrumb-container {
        padding: 12px 0;
        font-size: 14px;
      }

      .mr-xs {
        margin-right: 4px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreadcrumbComponent {
  private breadcrumbService = inject(BreadcrumbService);
  breadcrumbs = this.breadcrumbService.breadcrumbs;
}
