/**
 * Shared utilities barrel for the workspace.
 *
 * Note: This repo uses standalone components and `inject()` for DI. This file
 * is a lightweight collection of small, well-typed helper exports intended
 * to be imported directly by features under `src/saas`.
 */

/**
 * Assert that a value is defined (not null/undefined). Throws a clear error
 * that helps tests and runtime debugging.
 */
export function assertDefined<T>(value: T | null | undefined, name = 'value'): T {
	if (value === null || value === undefined) {
		throw new Error(`Expected ${name} to be defined`);
	}
	return value as T;
}

/**
 * Format a Date as an ISO date string (UTC). Small helper used by invoices, logs.
 */
export function formatISODate(d: Date | string | number): string {
	const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
	return date.toISOString();
}

/**
 * Small classNames helper (keeps templates concise). Accepts truthy/falsy parts.
 */
export function classNames(...parts: Array<string | false | null | undefined>): string {
	return parts.filter(Boolean).join(' ');
}

export const SHARED_HELPERS = {
	assertDefined,
	formatISODate,
	classNames,
};

