/**
 * Check if the user's connection is configured and fast enough
 * to preload data in the background.
 */
export function networkSupportsPreloading(): boolean {
	if (navigator.connection) {
		if (navigator.connection.saveData) {
			return false;
		}
		if (navigator.connection.effectiveType?.endsWith('2g')) {
			return false;
		}
	}
	return true;
}

/**
 * Does this device support true hover/pointer interactions?
 */
export function deviceSupportsHover() {
	return window.matchMedia('(hover: hover)').matches;
}

/**
 * Safe requestIdleCallback function that falls back to setTimeout
 */
export const whenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
