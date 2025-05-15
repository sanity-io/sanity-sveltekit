import { CorsOriginError, validateApiPerspective, type ClientPerspective } from '@sanity/client';

/** @public */
export function isCorsOriginError(error: unknown): error is CorsOriginError {
  return error instanceof CorsOriginError;
}

export type { CorsOriginError };

/** @internal */
export function sanitizePerspective(
  _perspective: unknown,
  fallback: 'previewDrafts' | 'published'
): Exclude<ClientPerspective, 'raw'> {
  const perspective =
    typeof _perspective === 'string' && _perspective.includes(',')
      ? _perspective.split(',')
      : _perspective;
  try {
    validateApiPerspective(perspective);
    return perspective === 'raw' ? fallback : perspective;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid perspective:`, _perspective, perspective, err);
    return fallback;
  }
}

// @todo maybe unused, remove
/** @internal */
export function getPerspective(
  perspective?: ClientPerspective,
  cookieValue?: string,
  isPreviewing?: boolean
): ClientPerspective {
  return (
    perspective ??
    (isPreviewing
      ? cookieValue
        ? sanitizePerspective(cookieValue, 'previewDrafts')
        : 'previewDrafts'
      : 'published')
  );
}
