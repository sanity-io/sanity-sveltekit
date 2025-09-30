<script lang="ts">
  import { enableVisualEditing, type HistoryAdapterNavigate } from '@sanity/visual-editing';
  import { afterNavigate, goto, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { VisualEditingProps } from '../types';

  const { components, plugins, refresh, zIndex }: VisualEditingProps = $props();

  let navigate: HistoryAdapterNavigate | undefined;
  let navigatingFromUpdate = false;

  onMount(() => {
    const disable = enableVisualEditing({
      components,
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
            // Seems to be a problematic eslint rule as of 30/09/25:
            // https://github.com/sveltejs/eslint-plugin-svelte/issues?q=is%3Aissue%20no-navigation-without-resolve
            // eslint-disable-next-line svelte/no-navigation-without-resolve
            goto(update.url, { replaceState: update.type === 'replace' });
          } else if (update.type === 'pop') {
            history.back();
          }
        }
      },
      plugins,
      refresh: (payload) => {
        function refreshDefault() {
          if (payload.source === 'mutation' && payload.livePreviewEnabled) {
            return false;
          }

          return new Promise<void>((resolve) => {
            invalidateAll().then(resolve);
          });
        }

        return refresh ? refresh(payload, refreshDefault) : refreshDefault();
      },
      zIndex
    });
    return () => disable();
  });

  afterNavigate(async ({ to, complete }) => {
    if (navigate && to && !navigatingFromUpdate) {
      await complete;
      navigate({ type: 'push', url: to.url.pathname + to.url.search });
    }
    navigatingFromUpdate = false;
  });
</script>
