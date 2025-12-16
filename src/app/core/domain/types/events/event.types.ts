import { BlueprintEventType } from './event-type.enum';

/**
 * Blueprint event interface
 * 藍圖事件介面
 */
export interface BlueprintEvent<T = unknown> {
  id: string;
  type: BlueprintEventType;
  blueprintId: string;
  timestamp: Date | string;
  userId: string;
  data: T;
  metadata?: Record<string, unknown>;
}

/**
 * Event handler type
 * 事件處理函式型別
 */
export type EventHandler<T = unknown> = (event: BlueprintEvent<T>) => void;
