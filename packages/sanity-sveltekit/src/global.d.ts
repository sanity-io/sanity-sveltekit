/// <reference types="@sveltejs/kit" />

import { SanityLocals } from './lib/types';

declare global {
  namespace App {
    interface Locals {
      sanity?: Partial<SanityLocals['sanity']>;
    }
  }
}
