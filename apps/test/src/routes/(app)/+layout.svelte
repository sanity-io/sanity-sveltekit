<script lang="ts">
  import { PreviewMode } from '@sanity/sveltekit/preview';
  import { VisualEditing } from '@sanity/sveltekit/visual-editing';
  import type { LayoutProps } from './$types';
  import Header from '$lib/components/Header.svelte';

  const { children, data }: LayoutProps = $props();
  const { previewEnabled } = data;
</script>

<div class="app">
  <VisualEditing enabled={previewEnabled}>
    <PreviewMode enabled={previewEnabled}>
      <div class="flex flex-col min-h-screen">
        <Header />
        {@render children()}
      </div>
    </PreviewMode>
  </VisualEditing>
</div>
