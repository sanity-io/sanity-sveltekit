<script lang="ts">
  import { Image, isImageWithAsset } from '@sanity/sveltekit/image';
  import type { BuildingQueryResult } from '$lib/sanity/types';

  const {
    building
  }: {
    building: NonNullable<BuildingQueryResult>;
  } = $props();
</script>

<div class="px-3">
  <h1 class="text-4xl font-medium mt-3">
    {building.name}.
    <span class="font-medium text-lg">{building.architect}, {building.yearCompleted}.</span>
  </h1>
  {#if building.images}
    <div class="mt-3 gap-3 grid grid-cols-1 sm:grid-cols-2">
      {#each building.images as image (image._key)}
        {#if isImageWithAsset(image)}
          <Image
            src={image}
            alt={building.name ?? ''}
            sizes="(min-width: 640px) 50vw, 100vw"
            placeholder="blur"
            class="w-full h-auto"
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>
