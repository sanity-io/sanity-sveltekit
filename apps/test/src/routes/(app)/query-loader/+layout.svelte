<script lang="ts">
  import { getIsPreviewing, QueryLoader } from '@sanity/sveltekit';
  import { client } from '$lib/sanity/client';
  import Features from '$lib/components/Features.svelte';

  const { children } = $props();
  const isPreviewing = getIsPreviewing();
</script>

<QueryLoader enabled={isPreviewing} {client}>
  {@render children()}
  <Features />
</QueryLoader>
