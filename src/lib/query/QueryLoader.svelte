<script lang="ts">
  import type { SanityClient } from '@sanity/client';
  import { useLiveMode } from './store/createQueryStore';

  const { client }: { client: SanityClient } = $props();

  $effect(() => useLiveMode({ client }));
</script>
