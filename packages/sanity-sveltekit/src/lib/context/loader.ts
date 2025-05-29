import { getContext, setContext } from 'svelte';

/**
 * @internal
 */
const queryContextKey = Symbol('loader');

/**
 * @public
 */
export type LoaderType = 'live' | 'query' | undefined;

/**
 * @public
 */
export function setLoader(live: { value: LoaderType }) {
  setContext(queryContextKey, live);
}

/**
 * @public
 */
export function getLoader(): { value: LoaderType } {
  return getContext(queryContextKey);
}
