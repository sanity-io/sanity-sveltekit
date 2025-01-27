<script lang="ts">
  import { setPreviewing } from '../context/preview';
  import { browser } from '$app/environment';
  import type { Snippet } from 'svelte';

  const { children, enabled = true }: { children?: Snippet; enabled?: boolean } = $props();

  $effect(() => {
    if (browser) {
      setPreviewing(enabled);
    }
  });
</script>

{#if enabled}
  {@render children?.()}
{/if}
