<script lang="ts">
  import Features from '$lib/components/Features.svelte';
  const { children } = $props();
</script>

{@render children()}
<Features />
