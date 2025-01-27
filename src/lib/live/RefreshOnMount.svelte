<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';

  /**
   * Revalidate data on mount
   */
  onMount(() => {
    invalidateAll();
  });
</script>
