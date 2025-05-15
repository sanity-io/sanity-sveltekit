<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { perspectiveCookieEndpoint } from '$lib/constants';
  import { createNode, createNodeMachine } from '@sanity/comlink';
  import {
    createCompatibilityActors,
    type LoaderControllerMsg,
    type LoaderNodeMsg
  } from '@sanity/presentation-comlink';
  import { onMount } from 'svelte';

  const {
    onConnect
  }: {
    onConnect: () => void;
  } = $props();

  /**
   * Handle perspective messages: set the cookie with the new value and call invalidateAll
   */
  onMount(() => {
    let controller: AbortController | undefined;
    const handlePerspectiveChange = (
      data: Extract<LoaderControllerMsg, { type: 'loader/perspective' }>['data']
    ) => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      // Set a cookie so the perspective is maintained in the next request
      fetch(perspectiveCookieEndpoint, {
        method: 'POST',
        body: data.perspective as string
      })
        .then(() => {
          if (signal.aborted) return;
          invalidateAll();
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to set the preview perspective cookie', err);
        });
    };

    const comlink = createNode<LoaderNodeMsg, LoaderControllerMsg>(
      { name: 'loaders', connectTo: 'presentation' },
      createNodeMachine<LoaderNodeMsg, LoaderControllerMsg>().provide({
        actors: createCompatibilityActors<LoaderNodeMsg>()
      })
    );

    comlink.on('loader/perspective', handlePerspectiveChange);

    comlink.onStatus(onConnect, 'connected');

    const unsubscribe = comlink.start();

    return unsubscribe;
  });
</script>
