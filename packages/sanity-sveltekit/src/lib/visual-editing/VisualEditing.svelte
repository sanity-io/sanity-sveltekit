<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { VisualEditingProps } from '../types';

  const {
    children,
    components,
    enabled = true,
    plugins,
    refresh,
    zIndex
  }: VisualEditingProps & {
    children?: Snippet;
    enabled?: boolean;
  } = $props();
</script>

{@render children?.()}

{#if enabled}
  {#await import('./VisualEditingComponent.svelte') then { default: VisualEditing }}
    <VisualEditing {components} {plugins} {refresh} {zIndex} />
  {/await}
{/if}
