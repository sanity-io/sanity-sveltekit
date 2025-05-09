import { getContext, setContext } from 'svelte';
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

export const environmentContextKey = Symbol('environment');

/**
 * @public
 */
export function setEnvironment(environment: { value: DraftEnvironment }) {
  setContext(environmentContextKey, environment);
}

/**
 * @public
 */
export function getEnvironment(): { value: DraftEnvironment } {
  return getContext(environmentContextKey);
}
