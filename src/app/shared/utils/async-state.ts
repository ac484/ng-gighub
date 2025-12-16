/**
 * AsyncState Utility for Angular 20 Signals
 *
 * Provides a unified pattern for managing async operations with Signals.
 * Based on Angular 20 best practices and PendingTasks pattern.
 *
 * @example
 * ```typescript
 * const blueprintsState = createAsyncState<Blueprint[]>([]);
 *
 * // Load data
 * await blueprintsState.load(
 *   firstValueFrom(this.service.getBlueprints())
 * );
 *
 * // Use in template
 * @if (blueprintsState.loading()) {
 *   <nz-spin />
 * } @else if (blueprintsState.error()) {
 *   <nz-alert [nzMessage]="blueprintsState.error()?.message" />
 * } @else {
 *   <div>{{ blueprintsState.data() }}</div>
 * }
 * ```
 */

import { signal, computed, Signal } from '@angular/core';

/**
 * Loading state types
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state interface
 */
export interface AsyncState<T> {
  data: T | null;
  state: LoadingState;
  error: Error | null;
}

/**
 * Async state manager return type
 */
export interface AsyncStateManager<T> {
  /** Read-only state signal */
  readonly state: Signal<AsyncState<T>>;
  /** Read-only data signal */
  readonly data: Signal<T | null>;
  /** Read-only loading signal */
  readonly loading: Signal<boolean>;
  /** Read-only error signal */
  readonly error: Signal<Error | null>;
  /** Read-only success signal */
  readonly success: Signal<boolean>;
  /** Load data from a promise */
  load(promise: Promise<T>): Promise<void>;
  /** Reset to initial state */
  reset(): void;
  /** Set data directly (for optimistic updates) */
  setData(data: T): void;
}

/**
 * Create an async state manager with Signals
 *
 * This helper provides a unified pattern for managing async operations:
 * - Automatic loading/error/success state management
 * - Type-safe data access
 * - Computed signals for derived state
 * - Clean API for components
 *
 * @param initialData - Initial data value (default: null)
 * @returns AsyncStateManager with load/reset methods and computed signals
 */
export function createAsyncState<T>(initialData: T | null = null): AsyncStateManager<T> {
  // Internal writable state
  const _state = signal<AsyncState<T>>({
    data: initialData,
    state: 'idle',
    error: null
  });

  // Computed signals for derived state
  const data = computed(() => _state().data);
  const loading = computed(() => _state().state === 'loading');
  const error = computed(() => _state().error);
  const success = computed(() => _state().state === 'success');

  /**
   * Load data from a promise
   * Automatically manages loading/error/success states
   */
  const load = async (promise: Promise<T>): Promise<void> => {
    // Set loading state
    _state.update(s => ({
      ...s,
      state: 'loading',
      error: null
    }));

    try {
      const result = await promise;

      // Set success state with data
      _state.update(s => ({
        ...s,
        data: result,
        state: 'success',
        error: null
      }));
    } catch (err) {
      // Set error state
      const error = err instanceof Error ? err : new Error(String(err));

      _state.update(s => ({
        ...s,
        state: 'error',
        error
      }));

      // Re-throw for caller to handle if needed
      throw error;
    }
  };

  /**
   * Reset to initial state
   */
  const reset = (): void => {
    _state.set({
      data: initialData,
      state: 'idle',
      error: null
    });
  };

  /**
   * Set data directly (useful for optimistic updates)
   */
  const setData = (newData: T): void => {
    _state.update(s => ({
      ...s,
      data: newData,
      state: 'success',
      error: null
    }));
  };

  return {
    state: _state.asReadonly(),
    data,
    loading,
    error,
    success,
    load,
    reset,
    setData
  };
}

/**
 * Async state for arrays with helper methods
 */
export interface AsyncArrayStateManager<T> extends AsyncStateManager<T[]> {
  /** Add item to array */
  add(item: T): void;
  /** Remove item from array by predicate */
  remove(predicate: (item: T) => boolean): void;
  /** Update item in array */
  update(predicate: (item: T) => boolean, updater: (item: T) => T): void;
  /** Get array length */
  readonly length: Signal<number>;
  /** Check if array is empty */
  readonly isEmpty: Signal<boolean>;
}

/**
 * Create async state for arrays with additional helper methods
 */
export function createAsyncArrayState<T>(initialData: T[] = []): AsyncArrayStateManager<T> {
  const base = createAsyncState<T[]>(initialData);

  const add = (item: T): void => {
    const current = base.data() || [];
    base.setData([...current, item]);
  };

  const remove = (predicate: (item: T) => boolean): void => {
    const current = base.data() || [];
    base.setData(current.filter(item => !predicate(item)));
  };

  const update = (predicate: (item: T) => boolean, updater: (item: T) => T): void => {
    const current = base.data() || [];
    base.setData(current.map(item => (predicate(item) ? updater(item) : item)));
  };

  const length = computed(() => base.data()?.length || 0);
  const isEmpty = computed(() => length() === 0);

  return {
    ...base,
    add,
    remove,
    update,
    length,
    isEmpty
  };
}
