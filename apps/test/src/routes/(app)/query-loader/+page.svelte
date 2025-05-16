<script lang="ts">
  import { useQuery } from '@sanity/sveltekit';
  import BuildingsPage from '$lib/components/BuildingsPage.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const value = $derived(useQuery(data));
  const { data: buildings } = $derived($value);
</script>

{#if buildings}
  <BuildingsPage {buildings} />
{/if}
