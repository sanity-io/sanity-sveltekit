<script lang="ts">
  import { setPreviewing } from '../context/preview';
  import type { Snippet } from 'svelte';

  const { children, enabled = true }: { children?: Snippet; enabled?: boolean } = $props();

  setPreviewing(enabled);

  $effect(() => {
    setPreviewing(enabled);
  });
</script>

{#if enabled}
  {@render children?.()}
{/if}
