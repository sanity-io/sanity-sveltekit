<script lang="ts">
  import { QueryLoader } from '@sanity/sveltekit';
  import { client } from '$lib/sanity/client';
  import Features from '$lib/components/Features.svelte';
  import type { LayoutProps } from './$types';

  const { children, data }: LayoutProps = $props();
  const { previewEnabled } = $derived(data);
</script>

<QueryLoader enabled={previewEnabled} {client}>
  {@render children()}
  <Features />
</QueryLoader>
