# @sanity/sveltekit

The Official Sanity toolkit for SvelteKit applications.

## Installation

Inside your existing SvelteKit application, install `@sanity/sveltekit`:

```bash
npm install @sanity/sveltekit
```

## Features

### Visual Editing

See the [Visual Editing with SvelteKit](https://www.sanity.io/docs/visual-editing/visual-editing-with-sveltekit) guide for a full implementation.

### Embedded Sanity Studio

Create and populate a `.env.local` file at the root of your application if it does not already exist.

```bash
# .env.local
PUBLIC_SANITY_PROJECT_ID=<your-project-id>
PUBLIC_SANITY_DATASET=<your-dataset-name>
```

Create a `sanity.config.ts` file.

```ts
// src/lib/sanity/sanity.config.ts
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import {
  PUBLIC_SANITY_PROJECT_ID as projectId,
  PUBLIC_SANITY_DATASET as dataset
} from '$env/static/public';

export default defineConfig({
  basePath: '/studio', // `basePath` must match the route of your Studio
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: [] }
});
```

Next, create a catch all route using [rest parameters](https://svelte.dev/docs/kit/advanced-routing#Rest-parameters)

```svelte
<!-- src/routes/studio/[...catchall]/+page.svelte -->
<script lang="ts">
  import config from '$lib/sanity/sanity.config';
  import { SanityStudio } from '@sanity/sveltekit';
</script>

<SanityStudio {config} />
```

Note: When embedding a studio in your application, you should wrap the rest of your routes in a [(group)](<https://svelte.dev/docs/kit/advanced-routing#Advanced-layouts-(group)>) to separate your studio and user-facing application layouts.

### Convenience exports

`@sanity/sveltekit` exports Sanity client and groq related helper functions directly, no need to install separate dependencies.

```ts
import { createClient, defineQuery, groq } from '@sanity/sveltekit';
```
