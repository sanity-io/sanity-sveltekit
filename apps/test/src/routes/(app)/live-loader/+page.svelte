<script lang="ts">
  import BuildingsPage from '$lib/components/BuildingsPage.svelte';
  import type { PageProps } from './$types';

  const { data }: PageProps = $props();
  const { data: buildings } = $derived(data);
</script>

<BuildingsPage {buildings} />
