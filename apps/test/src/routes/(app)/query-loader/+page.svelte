<script lang="ts">
  import { useQuery } from '@sanity/sveltekit';
  import BuildingsPage from '$lib/components/BuildingsPage.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const query = useQuery(data);
  const buildings = $derived($query.data);
</script>

{#if buildings}
  <BuildingsPage {buildings} />
{/if}
