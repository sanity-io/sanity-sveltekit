<script lang="ts">
  import type { SanityClient } from '@sanity/client';
  import { useLiveMode } from './store/createQueryStore';
  import { type Snippet } from 'svelte';
  import { setLoader, type LoaderType } from '$lib/context/loader';

  const {
    children,
    client,
    enabled = true
  }: { children?: Snippet; client: SanityClient; enabled?: boolean } = $props();

  const loader = $state<{ value: LoaderType }>({
    value: undefined
  });
  setLoader(loader);

  $effect(() => {
    if (enabled) {
      loader.value = 'query';
      useLiveMode({ client });
    } else {
      loader.value = undefined;
    }
  });
</script>

{@render children?.()}
