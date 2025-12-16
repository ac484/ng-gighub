/**
 * Breadcrumb Service
 *
 * 麵包屑導航服務
 *
 * Manages breadcrumb navigation state using Angular Signals.
 * Provides a reactive way to update breadcrumbs across the application.
 *
 * @module shared/services
 */

import { Injectable, signal } from '@angular/core';

export interface Breadcrumb {
  label: string;
  url?: string | null;
  icon?: string;
}

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  /**
   * Breadcrumbs signal - reactive state for current breadcrumb trail
   */
  breadcrumbs = signal<Breadcrumb[]>([]);

  /**
   * Set breadcrumbs for the current page
   *
   * @param crumbs Array of breadcrumb items
   */
  setBreadcrumbs(crumbs: Breadcrumb[]): void {
    this.breadcrumbs.set(crumbs);
  }

  /**
   * Reset breadcrumbs to empty state
   */
  reset(): void {
    this.breadcrumbs.set([]);
  }

  /**
   * Add a breadcrumb to the end of the trail
   *
   * @param crumb Breadcrumb item to add
   */
  addBreadcrumb(crumb: Breadcrumb): void {
    this.breadcrumbs.update(crumbs => [...crumbs, crumb]);
  }
}
