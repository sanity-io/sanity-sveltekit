import { getContext, setContext } from 'svelte';

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
