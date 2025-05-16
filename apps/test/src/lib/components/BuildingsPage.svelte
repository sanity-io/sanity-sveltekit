<script lang="ts">
  import BuildingsGrid from '$lib/components/BuildingsGrid.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import type { BuildingsQueryResult } from '$lib/sanity/types';

  const {
    buildings
  }: {
    buildings: BuildingsQueryResult;
  } = $props();

  const architects = $derived(
    [...new Set(buildings.flatMap(({ architect }) => (architect ? architect : [])))].sort()
  );
</script>

<div>
  <BuildingsGrid {buildings} />
  <Footer {architects} />
</div>
