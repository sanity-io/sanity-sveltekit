<script lang="ts">
  import { renderStudio, type StudioProps } from 'sanity';
  import { onMount } from 'svelte';

  const {
    config
  }: {
    config: StudioProps['config'];
  } = $props();

  let studioEl: HTMLDivElement | undefined = $state();

  onMount(() => {
    if (studioEl) {
      renderStudio(studioEl, config);
    }
  });
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="robots" content="noindex" />
  <meta name="referrer" content="same-origin" />
</svelte:head>

<div id="app" bind:this={studioEl}></div>

<style>
  #app {
    height: 100vh;
    max-height: 100dvh;
    overscroll-behavior: none;
    -webkit-font-smoothing: antialiased;
    overflow: auto;
  }
</style>
