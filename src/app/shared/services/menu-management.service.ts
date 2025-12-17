/**
 * Menu Management Service
 *
 * 菜單管理服務
 * Menu management service
 *
 * Loads menu configuration from app-data.json and updates menu based on workspace context.
 *
 * @module shared/services
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { ContextType } from '@core';
import { Menu, MenuService } from '@delon/theme';
import { firstValueFrom } from 'rxjs';

/**
 * 菜單配置
 */
interface MenuConfig {
  user?: Menu[];
  organization?: Menu[];
  team?: Menu[];
  partner?: Menu[];
  bot?: Menu[];
}

/**
 * 應用資料結構
 */
interface AppData {
  app?: {
    name: string;
    description: string;
  };
  menus?: MenuConfig;
}

@Injectable({
  providedIn: 'root'
})
export class MenuManagementService {
  private readonly http = inject(HttpClient);
  private readonly menuService = inject(MenuService);

  private readonly configState = signal<MenuConfig | null>(null);
  private readonly loadingState = signal<boolean>(false);

  // 防重複更新機制
  private lastMenuContext?: { type: ContextType };

  readonly config = this.configState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  /**
   * 載入菜單配置
   */
  async loadConfig(): Promise<void> {
    if (this.configState()) return; // 已載入

    this.loadingState.set(true);
    try {
      const data = await firstValueFrom(this.http.get<AppData>('./assets/tmp/app-data.json'));
      this.configState.set(data.menus || {});
      console.log('[MenuManagementService] Config loaded:', data.menus);
    } catch (error) {
      console.error('[MenuManagementService] Load failed:', error);
      this.configState.set({});
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * 更新菜單
   * Update menu based on context type
   */
  updateMenu(contextType: ContextType): void {
    const config = this.configState();
    if (!config) {
      console.warn('[MenuManagementService] Config not loaded yet, skipping menu update');
      return;
    }

    // 檢查是否與上次相同，避免重複更新
    if (this.lastMenuContext?.type === contextType) {
      console.log('[MenuManagementService] Menu unchanged, skipping update:', { contextType });
      return;
    }

    const menu = this.getBaseMenu(contextType, config);

    if (!menu || menu.length === 0) {
      console.warn('[MenuManagementService] No menu found for context:', contextType);
      return;
    }

    try {
      this.menuService.add(menu);
      // 記錄本次更新的上下文
      this.lastMenuContext = { type: contextType };
      console.log('[MenuManagementService] Menu updated successfully:', { contextType, items: menu.length });
    } catch (error) {
      console.error('[MenuManagementService] Failed to update menu:', error);
    }
  }

  /**
   * 獲取基礎菜單
   */
  private getBaseMenu(contextType: ContextType, config: MenuConfig): Menu[] {
    switch (contextType) {
      case ContextType.USER:
        return config.user || [];
      case ContextType.ORGANIZATION:
        return config.organization || [];
      case ContextType.TEAM:
        return config.team || [];
      case ContextType.PARTNER:
        return config.partner || [];
      case ContextType.BOT:
        return config.bot || [];
      default:
        return config.user || [];
    }
  }
}
