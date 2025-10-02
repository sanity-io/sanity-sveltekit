import type { ClientPerspective } from '@sanity/client';
import { getContext, setContext } from 'svelte';

/**
 * @internal
 */
const perspectiveContextKey = Symbol('perspective');

/**
 * @public
 */
export type PreviewPerspective = 'checking' | 'unknown' | ClientPerspective;

/**
 * @public
 */
export function setPerspective(perspective: { value: PreviewPerspective }) {
  setContext(perspectiveContextKey, perspective);
}

/**
 * @public
 */
export function getPerspective(): { value: PreviewPerspective } {
  return getContext(perspectiveContextKey);
}
