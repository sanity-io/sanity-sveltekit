import { readonly, writable } from 'svelte/store';

const previewStore = writable(false);

/**
 * @public
 */
export const isPreviewing = readonly(previewStore);

/**
 * @public
 */
export const setPreviewing = previewStore.set;
