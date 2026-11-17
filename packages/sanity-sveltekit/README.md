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

Embedding a Studio requires the `sanity` package, install it alongside `@sanity/sveltekit`:

```bash
npm install sanity
```

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
  import { SanityStudio } from '@sanity/sveltekit/studio';
</script>

<SanityStudio {config} />
```

Note: When embedding a studio in your application, you should wrap the rest of your routes in a [(group)](<https://svelte.dev/docs/kit/advanced-routing#Advanced-layouts-(group)>) to separate your studio and user-facing application layouts.

### Images

`<Image>` from `@sanity/sveltekit/image` renders images from the Sanity Image CDN with a responsive `srcset`. Pass the whole image value from your query:

```groq
fn image::asset($asset) = $asset->{url, metadata{lqip}};
fn image::field($image) = $image{crop, hotspot, "asset": image::asset(asset)};

*[_type == "post" && slug.current == $slug][0]{
  title,
  "mainImage": image::field(mainImage)
}
```

```svelte
<script lang="ts">
  import { Image, isImageWithAsset } from '@sanity/sveltekit/image';

  let { data } = $props();
</script>

{#if isImageWithAsset(data.post.mainImage)}
  <Image
    src={data.post.mainImage}
    alt={data.post.title}
    width={800}
    sizes="(min-width: 800px) 800px, 100vw"
    placeholder="blur"
  />
{/if}
```

- `src` accepts image objects (the TypeGen image shapes, stega-encoded results included), asset references, asset documents, asset ids and Sanity CDN URLs.
- The Studio crop is applied. When the requested aspect ratio differs, the crop is positioned around the hotspot.
- `width` and `height` are optional: they are inferred from the CDN URL, the crop, or the dimensions in the asset filename. Given only one, the other follows the aspect ratio.
- `placeholder="blur"` uses `asset->metadata.lqip`, no `blurDataURL` needed.
- `fill` stretches the image over its positioned parent (use with `class="object-cover"`), with `object-position` defaulting to the hotspot.
- `queryParams` adds [image transformation params](https://www.sanity.io/docs/image-urls), e.g. `queryParams={{ sat: -100 }}`.
- `preload` adds a `<link rel="preload">` for images above the fold.
- `projectId` and `dataset` are read from `asset->url`. Pass them as props when the query only selects the asset reference.

`getImageProps` returns the same `<img>` attributes without rendering, for art direction with `<picture>`:

```svelte
<script lang="ts">
  import { getImageProps } from '@sanity/sveltekit/image';

  let { image } = $props();
  const common = { src: image, alt: '', sizes: '100vw' };
  const desktop = $derived(getImageProps({ ...common, width: 1440, height: 640 }).props);
  const mobile = $derived(getImageProps({ ...common, width: 750, height: 1000 }).props);
</script>

<picture>
  <source media="(min-width: 1000px)" srcset={desktop.srcset} />
  <img {...mobile} />
</picture>
```

`InferImageValue`, `InferStrictImageValue` and `isImageWithAsset` from `@sanity/image-url` are re-exported, with the `Infer*` types accepting stega-encoded query results.

### Convenience exports

`@sanity/sveltekit` exports Sanity client and groq related helper functions directly, no need to install separate dependencies.

```ts
import { createClient, defineQuery, groq } from '@sanity/sveltekit';
```
