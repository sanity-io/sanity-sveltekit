import type { ClientPerspective } from '@sanity/client';
import { getContext, setContext } from 'svelte';

const perspectiveContextKey = Symbol('perspective');

/**
 * @public
 */
export type DraftPerspective = 'checking' | 'unknown' | ClientPerspective;

/**
 * @public
 */
export function setPerspective(perspective: { value: DraftPerspective }) {
  setContext(perspectiveContextKey, perspective);
}

/**
 * @public
 */
export function getPerspective(): { value: DraftPerspective } {
  return getContext(perspectiveContextKey);
}
