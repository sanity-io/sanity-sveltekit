<script lang="ts">
  import { type Snippet } from 'svelte';
  import { setIsPreviewing } from '../context/previewing';

  const { children, enabled = true }: { children: Snippet; enabled?: boolean } = $props();

  setIsPreviewing(enabled);
</script>

{@render children?.()}
