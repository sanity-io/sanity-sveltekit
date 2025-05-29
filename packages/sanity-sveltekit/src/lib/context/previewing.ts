import { getContext, setContext } from 'svelte';

/**
 * @internal
 */
const previewingContextKey = Symbol('previewing');

/**
 * @public
 */
export function setIsPreviewing(previewing: boolean) {
  setContext(previewingContextKey, previewing);
}

/**
 * @public
 */
export function getIsPreviewing(): boolean {
  return getContext(previewingContextKey);
}
