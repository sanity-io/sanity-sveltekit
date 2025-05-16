<script lang="ts">
  import BuildingPage from '$lib/components/BuildingPage.svelte';
  import { useQuery } from '@sanity/sveltekit';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const value = $derived(useQuery(data));
  const { data: building } = $derived($value);
</script>

{#if building}
  <BuildingPage {building} />
{/if}
