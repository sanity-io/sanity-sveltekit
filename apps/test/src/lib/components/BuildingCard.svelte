<script lang="ts">
  import { Image, isImageWithAsset } from '@sanity/sveltekit/image';
  import { page } from '$app/state';
  import type { BuildingsQueryResult } from '$lib/sanity/types';

  const {
    name,
    slug,
    architect,
    images
  }: {
    name?: string | null;
    slug?: string | null;
    architect?: string | null;
    images?: BuildingsQueryResult[number]['images'];
  } = $props();

  const href = $derived(`${page.url.pathname}/${slug}`);
  const image = $derived(images?.[0]);
  /* eslint-disable svelte/no-navigation-without-resolve */
</script>

<a class=" bg-white aspect-[3/4] overflow-hidden relative @container group" {href}>
  {#if isImageWithAsset(image)}
    <Image
      src={image}
      alt={name ?? ''}
      fill
      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
      placeholder="blur"
      class="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
    />
  {/if}
  <div
    class="p-2 pt-6 @sm:p-3 @md:p-4 absolute bottom-0 left-0 right-0 text-white text-xs @sm:text-sm flex justify-between bg-linear-to-t from-black/60 to-black/0"
  >
    <div>{name}</div>
    <div>{architect}</div>
  </div>
</a>
