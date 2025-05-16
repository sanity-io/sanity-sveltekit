import type { SanityLocals } from '@sanity/sveltekit';

declare global {
  namespace App {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Locals extends SanityLocals {}
  }
}

export {};
