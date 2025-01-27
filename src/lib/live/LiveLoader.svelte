<script lang="ts">
  import {
    createClient,
    type ClientPerspective,
    type LiveEventMessage,
    type LiveEventReconnect,
    type LiveEventRestart,
    type LiveEventWelcome,
    type SanityClient
  } from '@sanity/client';
  import { isMaybePresentation, isMaybePreviewIframe } from '@sanity/presentation-comlink';
  import { browser } from '$app/environment';
  import { invalidate, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setEnvironment } from '../context/environment';
  import { setPerspective } from '../context/perspective';
  import { isCorsOriginError } from '../util';
  import ComlinkPerspective from './ComlinkPerspective.svelte';
  import RefreshOnFocus from './RefreshOnFocus.svelte';
  import RefreshOnReconnect from './RefreshOnReconnect.svelte';
  import RefreshOnMount from './RefreshOnMount.svelte';

  const handleError = (error: unknown): void => {
    if (isCorsOriginError(error)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Sanity Live is unable to connect to the Sanity API as the current origin - ${window.origin} - is not in the list of allowed CORS origins for this Sanity Project.`,
        error.addOriginUrl && `Add it here:`,
        error.addOriginUrl?.toString()
      );
    } else {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  const {
    browserToken,
    client,
    onError = handleError,
    previewEnabled = false,
    previewPerspective,
    refreshOnFocus = browser ? isMaybePreviewIframe() : false,
    refreshOnMount = false,
    refreshOnReconnect = true
  }: {
    browserToken?: string;
    client: SanityClient;
    onError?: (error: unknown) => void;
    previewEnabled?: boolean;
    previewPerspective?: ClientPerspective;
    refreshOnFocus?: boolean;
    refreshOnMount?: boolean;
    refreshOnReconnect?: boolean;
  } = $props();

  const {
    projectId,
    dataset,
    apiHost,
    apiVersion: _apiVersion,
    useProjectHostname,
    requestTagPrefix
  } = client.config();

  let apiVersion = _apiVersion;
  // @TODO temporarily handle the Live Draft Content API only being available on vX
  if (typeof browserToken === 'string' && previewEnabled) {
    // if (true) {
    apiVersion = 'vX';
  }

  const liveClient = createClient({
    projectId,
    dataset,
    apiHost,
    apiVersion,
    useProjectHostname,
    ignoreBrowserTokenWarning: true,
    token: browserToken,
    useCdn: false,
    requestTagPrefix
  });

  /**
   * Handle Live Events and call invalidate or invalidateAll when needed
   */
  onMount(() => {
    const includeDrafts = !!browserToken;
    const tag = 'svelte-loader.live';
    const handleLiveEvent = (
      event: LiveEventMessage | LiveEventRestart | LiveEventWelcome | LiveEventReconnect
    ) => {
      if (process.env.NODE_ENV !== 'production' && event.type === 'welcome') {
        // eslint-disable-next-line no-console
        console.info(
          'Sanity is live with',
          browserToken
            ? 'automatic revalidation for draft content changes as well as published content'
            : previewEnabled
              ? 'automatic revalidation for only published content. Provide a `browserToken` to `defineLive` to support draft content outside of Presentation Tool.'
              : 'automatic revalidation of published content'
        );
      } else if (event.type === 'message') {
        for (const _tag of event.tags) {
          const tag = `sanity:${_tag}`;
          invalidate(tag);
        }
      } else if (event.type === 'restart') {
        invalidateAll();
      }
    };

    const { unsubscribe } = liveClient.live.events({ includeDrafts, tag }).subscribe({
      next: handleLiveEvent,
      error: onError
    });

    return unsubscribe;
  });

  /**
   * Set the perspective based on the preview state
   */
  $effect(() => {
    if (previewEnabled && previewPerspective) {
      setPerspective(previewPerspective);
    } else {
      setPerspective('unknown');
    }
  });

  /**
   * Set the environment based on the browser and the preview state
   */
  $effect(() => {
    if (!isMaybePresentation()) {
      if (browserToken) {
        setEnvironment('live');
      } else if (previewEnabled) {
        setEnvironment('static');
      } else {
        setEnvironment('unknown');
      }
    }
  });
</script>

{#if previewEnabled}
  <ComlinkPerspective />
{:else}
  {#if refreshOnFocus}<RefreshOnFocus />{/if}
  {#if refreshOnMount}<RefreshOnMount />{/if}
  {#if refreshOnReconnect}<RefreshOnReconnect />{/if}
{/if}
