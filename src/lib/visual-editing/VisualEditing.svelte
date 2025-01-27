<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { VisualEditingProps } from '../types';

  const {
    children,
    enabled = true,
    refresh,
    zIndex
  }: {
    children?: Snippet;
    enabled?: boolean;
    /**
     * The refresh API allows smarter refresh logic than the default
     * `location.reload()` behavior. You can call the refreshDefault argument to
     * trigger the default refresh behavior so you don't have to reimplement it.
     */
    refresh?: VisualEditingProps['refresh'];
    zIndex?: VisualEditingProps['zIndex'];
  } = $props();
</script>

{#if enabled}
  {#await import('./VisualEditingComponent.svelte') then { default: VisualEditing }}
    {@render children?.()}
    <VisualEditing {zIndex} {refresh} />
  {/await}
{/if}
