<script lang="ts">
  import BuildingPage from '$lib/components/BuildingPage.svelte';
  import { useQuery } from '@sanity/sveltekit';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const query = useQuery(data);
  const building = $derived($query.data);
</script>

{#if building}
  <BuildingPage {building} />
{/if}
