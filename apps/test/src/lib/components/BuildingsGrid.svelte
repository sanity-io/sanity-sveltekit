<script lang="ts">
  import type { BuildingsQueryResult } from '$lib/sanity/types';
  import BuildingCard from '$lib/components/BuildingCard.svelte';

  const {
    buildings
  }: {
    buildings: BuildingsQueryResult;
  } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-3 mt-3">
  {#each buildings as building (building._id)}
    <BuildingCard {...building} />
  {/each}
</div>
