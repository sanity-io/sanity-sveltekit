<script lang="ts">
  import { LiveLoader } from '@sanity/sveltekit';
  import { client } from '$lib/sanity/client';
  import Features from '$lib/components/Features.svelte';
  import type { LayoutProps } from './$types';

  const { children, data }: LayoutProps = $props();
  const { browserToken, previewEnabled, previewPerspective } = $derived(data);
</script>

<LiveLoader {client} {previewEnabled} {previewPerspective} {browserToken}>
  {@render children()}
  <Features />
</LiveLoader>
