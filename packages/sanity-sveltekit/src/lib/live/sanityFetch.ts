import type { SanityFetch } from '../types';

export const sanityFetch: SanityFetch = (event, options) => {
  if (!event.locals.sanity?.fetch) {
    throw new Error('Sequence `handleLiveLoader()` in `hooks.server.ts` to enable `sanityFetch`');
  }
  return event.locals.sanity.fetch(event, options);
};
