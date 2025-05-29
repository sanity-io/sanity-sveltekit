import { getContext, setContext } from 'svelte';

/**
 * @internal
 */
export const environmentContextKey = Symbol('environment');

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
