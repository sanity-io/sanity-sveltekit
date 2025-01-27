import type { ClientPerspective } from '@sanity/client';
import { readonly, writable } from 'svelte/store';

/**
 *
 * @public
 */
export type DraftPerspective = 'checking' | 'unknown' | ClientPerspective;

const perspectiveStore = writable<DraftPerspective>('checking');

/**
 * @public
 */
export const perspective = readonly(perspectiveStore);
/**
 * @public
 */
export const setPerspective = perspectiveStore.set;
