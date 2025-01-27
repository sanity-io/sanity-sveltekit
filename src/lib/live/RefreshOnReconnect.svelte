<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';

  /**
   * Handle online event to revalidate data
   */
  onMount(() => {
    const controller = new AbortController();
    const { signal } = controller;
    window.addEventListener('online', invalidateAll, { passive: true, signal });
    return () => controller.abort();
  });
</script>
