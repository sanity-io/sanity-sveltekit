import { readonly, writable } from 'svelte/store';
/**
 *
 * @public
 */
export type DraftEnvironment =
  | 'checking'
  | 'presentation-iframe'
  | 'presentation-window'
  | 'live'
  | 'static'
  | 'unknown';

const environmentStore = writable<DraftEnvironment>('checking');

/**
 * @public
 */
export const environment = readonly(environmentStore);

/**
 * @public
 */
export const setEnvironment = environmentStore.set;
