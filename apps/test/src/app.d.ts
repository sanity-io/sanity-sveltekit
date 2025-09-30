import type { ResolvedPathname } from '$app/types';
import type { SanityLocals } from '@sanity/sveltekit';

declare global {
  namespace App {
    interface Locals extends SanityLocals {}
  }
}

declare module '$app/paths' {
  export function resolve(
    path: '/preview/disable',
    options?: { redirect?: string }
  ): ResolvedPathname;
}

export {};
