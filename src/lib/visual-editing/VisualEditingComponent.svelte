<script lang="ts">
  import { enableVisualEditing, type HistoryAdapterNavigate } from '@sanity/visual-editing';
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { VisualEditingProps } from '../types';

  const {
    refresh,
    zIndex
  }: {
    refresh?: VisualEditingProps['refresh'];
    zIndex?: VisualEditingProps['zIndex'];
  } = $props();

  let navigate: HistoryAdapterNavigate | undefined;
  let navigatingFromUpdate = false;

  onMount(() =>
    enableVisualEditing({
      zIndex,
      refresh: (payload) => {
        function refreshDefault() {
          if (payload.source === 'mutation' && payload.livePreviewEnabled) {
            return false;
          }
          return new Promise<void>(async (resolve) => {
            await invalidateAll();
            resolve();
          });
        }
        return refresh ? refresh(payload, refreshDefault) : refreshDefault();
      },
      history: {
        subscribe: (_navigate) => {
          navigate = _navigate;
          // Initial navigation
          navigate({
            type: 'replace',
            url: window.location.pathname + window.location.search
          });
          return () => {
            navigate = undefined;
          };
        },
        update: (update) => {
          if (update.type === 'push' || update.type === 'replace') {
            navigatingFromUpdate = true;
            goto(update.url, { replaceState: update.type === 'replace' });
          } else if (update.type === 'pop') {
            history.back();
          }
        }
      }
    })
  );

  afterNavigate(async ({ to, complete }) => {
    if (navigate && to && !navigatingFromUpdate) {
      await complete;
      navigate({ type: 'push', url: to.url.pathname + to.url.search });
    }
    navigatingFromUpdate = false;
  });
</script>
