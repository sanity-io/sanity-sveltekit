<script lang="ts">
  import { urlFor } from '$lib/sanity/image';
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
        <img src={urlFor(image).toString()} alt={building.name} />
      {/each}
    </div>
  {/if}
</div>
