<script lang="ts">
  import { urlFor } from '$lib/sanity/image';
  import { page } from '$app/state';

  const {
    name,
    slug,
    architect,
    images
  }: {
    name?: string | null;
    slug?: string | null;
    architect?: string | null;
    images?: Array<{ asset?: { _ref: string } }> | null;
  } = $props();

  const href = $derived(`${page.url.pathname}/${slug}`);
</script>

<a class=" bg-white aspect-[3/4] overflow-hidden relative @container group" {href}>
  {#if images}
    <img
      src={urlFor(images[0]).toString()}
      alt={name}
      class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
    />
  {/if}
  <div
    class="p-2 pt-6 @sm:p-3 @md:p-4 absolute bottom-0 left-0 right-0 text-white text-xs @sm:text-sm flex justify-between bg-linear-to-t from-black/60 to-black/0"
  >
    <div>{name}</div>
    <div>{architect}</div>
  </div>
</a>
