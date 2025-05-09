<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';

  /**
   * Handle focus and visibility changes to revalidate data
   */
  onMount(() => {
    const focusThrottleInterval = 5_000;
    const controller = new AbortController();
    let nextFocusRevalidatedAt = 0;
    const callback = () => {
      const now = Date.now();
      if (now > nextFocusRevalidatedAt && document.visibilityState !== 'hidden') {
        invalidateAll();
        nextFocusRevalidatedAt = now + focusThrottleInterval;
      }
    };
    const { signal } = controller;
    document.addEventListener('visibilitychange', callback, { passive: true, signal });
    window.addEventListener('focus', callback, { passive: true, signal });
    return () => controller.abort();
  });
</script>
