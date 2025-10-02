<script lang="ts">
  import BuildingsPage from '$lib/components/BuildingsPage.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const buildings = $derived(data.data);
</script>

<BuildingsPage {buildings} />
