<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { VisualEditingProps } from '../types';

  const {
    children,
    components,
    enabled = true,
    keepStegaOnCopy,
    onSuspiciousStega,
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
    <VisualEditing
      {components}
      {keepStegaOnCopy}
      {onSuspiciousStega}
      {plugins}
      {refresh}
      {zIndex}
    />
  {/await}
{/if}
