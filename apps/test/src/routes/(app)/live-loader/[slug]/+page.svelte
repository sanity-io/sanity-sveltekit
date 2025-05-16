<script lang="ts">
  import BuildingPage from '$lib/components/BuildingPage.svelte';

  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const { data: building } = $derived(data);
</script>

{#if building}
  <BuildingPage {building} />
{/if}
