<script lang="ts">
  import {
    createClient,
    type ClientPerspective,
    type LiveEvent,
    type SanityClient
  } from '@sanity/client';
  import {
    isMaybePresentation,
    isMaybePreviewIframe,
    isMaybePreviewWindow
  } from '@sanity/presentation-comlink';
  import { browser as isBrowser } from '$app/environment';
  import { invalidate, invalidateAll } from '$app/navigation';
  import { onMount, type Snippet } from 'svelte';
  import { setEnvironment, type DraftEnvironment } from '../context/environment';
  import { setPerspective, type DraftPerspective } from '../context/perspective';
  import { isCorsOriginError } from '../util';
  import ComlinkPerspective from './ComlinkPerspective.svelte';
  import RefreshOnFocus from './RefreshOnFocus.svelte';
  import RefreshOnReconnect from './RefreshOnReconnect.svelte';
  import RefreshOnMount from './RefreshOnMount.svelte';
  import { lastLiveEventCookieName } from '$lib/constants';
  import { setLoader, type LoaderType } from '$lib/context/loader';

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
    children,
    client,
    onError = handleError,
    previewEnabled = false,
    previewPerspective,
    refreshOnFocus = isBrowser ? isMaybePreviewIframe() : false,
    refreshOnMount = false,
    refreshOnReconnect = true
  }: {
    browserToken?: string;
    children: Snippet;
    client: SanityClient;
    onError?: (error: unknown) => void;
    previewEnabled?: boolean;
    previewPerspective?: ClientPerspective;
    refreshOnFocus?: boolean;
    refreshOnMount?: boolean;
    refreshOnReconnect?: boolean;
  } = $props();

  const { projectId, dataset, apiHost, apiVersion, useProjectHostname, requestTagPrefix } =
    client.config();

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
    const handleLiveEvent = async (event: LiveEvent) => {
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
        const devMode = process.env['NODE_ENV'] === 'development';
        // Set a cookie with the last live event id and tags, this will be sent
        // when `invalidate` is called, and can be read by the server load
        // function
        document.cookie = [
          `${lastLiveEventCookieName}=${event.id}|${event.tags.join(',')}`,
          `max-age=5`,
          `path=/`,
          `${!devMode ? 'secure; samesite=none' : 'samesite=lax'}`
        ].join('; ');

        const tags = event.tags.map((tag) => `sanity:${tag}`);
        for (const tag of tags) {
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
  const perspective = $state<{ value: DraftPerspective }>({
    value: 'checking'
  });
  setPerspective(perspective);

  setLoader({ value: 'live' });

  $effect(() => {
    if (previewEnabled && previewPerspective) {
      perspective.value = previewPerspective;
    } else {
      perspective.value = 'unknown';
    }
  });

  /**
   * Set the environment based on the browser and the preview state
   */
  let environment = $state<{ value: DraftEnvironment }>({ value: 'checking' });
  setEnvironment(environment);

  $effect(() => {
    if (!isMaybePresentation()) {
      if (browserToken) {
        environment.value = 'live';
      } else if (previewEnabled) {
        environment.value = 'static';
      } else {
        environment.value = 'unknown';
      }
    }
  });

  const onComlinkConnect = () => {
    if (isMaybePresentation()) {
      environment.value = isMaybePreviewWindow() ? 'presentation-window' : 'presentation-iframe';
    }
  };
</script>

{#if previewEnabled}
  <ComlinkPerspective onConnect={onComlinkConnect} />
{:else}
  {#if refreshOnFocus}<RefreshOnFocus />{/if}
  {#if refreshOnMount}<RefreshOnMount />{/if}
  {#if refreshOnReconnect}<RefreshOnReconnect />{/if}
{/if}

{@render children?.()}
