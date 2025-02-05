<script lang="ts">
  import type { SanityClient } from '@sanity/client';
  import { useLiveMode } from './store/createQueryStore';
  import { type Snippet } from 'svelte';

  const {
    children,
    client,
    enabled = true
  }: { children?: Snippet; client: SanityClient; enabled?: boolean } = $props();

  $effect(() => {
    if (enabled) {
      useLiveMode({ client });
    }
  });
</script>

{@render children?.()}
