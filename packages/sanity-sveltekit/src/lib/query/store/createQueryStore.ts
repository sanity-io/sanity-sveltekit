import {
  createQueryStore as createCoreQueryStore,
  type CreateQueryStoreOptions
} from '@sanity/core-loader';
import type { ContentSourceMap, SanityClient } from '@sanity/client';
import { defineStudioUrlStore } from './defineStudioUrlStore';
import { defineUseLiveMode } from './defineUseLiveMode';
import { defineUseQuery, type UseQuery } from './defineUseQuery';
import type { LoadQuery, UseLiveMode } from '../../types';

/**
 * @public
 */
export interface QueryStore {
  loadQuery: LoadQuery;
  setServerClient: ReturnType<typeof createCoreQueryStore>['setServerClient'];
  useQuery: UseQuery;
  useLiveMode: UseLiveMode;
  unstable__serverClient: {
    instance: SanityClient | undefined;
    canPreviewDrafts?: boolean | undefined;
  };
}

/**
 * Create a query store
 * @public
 */
export const createQueryStore = (options: CreateQueryStoreOptions): QueryStore => {
  const {
    createFetcherStore,
    setServerClient,
    enableLiveMode,
    unstable__cache,
    unstable__serverClient
  } = createCoreQueryStore({
    tag: 'svelte-loader',
    ...options
  });

  const studioUrlStore = defineStudioUrlStore(options.client);
  const useQuery = defineUseQuery({ createFetcherStore, studioUrlStore });
  const useLiveMode: UseLiveMode = defineUseLiveMode({
    enableLiveMode,
    studioUrlStore
  });

  const loadQuery: LoadQuery = async <QueryResponseResult>(
    query: Parameters<LoadQuery>[0],
    params: Parameters<LoadQuery>[1] = {},
    options: Parameters<LoadQuery>[2] = {}
  ): Promise<{
    data: QueryResponseResult;
    sourceMap: ContentSourceMap | undefined;
  }> => {
    const { headers, tag } = options;
    const perspective =
      options.perspective || unstable__serverClient.instance?.config().perspective || 'published';
    const stega = options.stega ?? unstable__serverClient.instance?.config().stega ?? false;

    if (typeof document !== 'undefined') {
      throw new Error(
        'Cannot use `loadQuery` in a browser environment, you should use it inside a load function.'
      );
    }
    if (perspective !== 'published' && !unstable__serverClient.instance) {
      throw new Error(
        `You cannot use other perspectives than "published" unless call "setServerClient" first.`
      );
    }

    if (perspective === 'published') {
      const useCdn = options.useCdn || unstable__serverClient.instance!.config().useCdn;

      const { result, resultSourceMap } = await unstable__cache.instance.fetch<QueryResponseResult>(
        JSON.stringify({ query, params, perspective, useCdn, stega })
      );
      return { data: result, sourceMap: resultSourceMap };
    }
    if (!unstable__serverClient.canPreviewDrafts) {
      throw new Error(
        `You cannot use "drafts" unless you set a "token" in the "client" instance passed to "setServerClient".`
      );
    }

    const { result, resultSourceMap } =
      await unstable__serverClient.instance!.fetch<QueryResponseResult>(query, params, {
        filterResponse: false,
        resultSourceMap: 'withKeyArraySelector',
        perspective,
        useCdn: false,
        headers,
        tag,
        stega
      });
    return { data: result, sourceMap: resultSourceMap };
  };

  return {
    loadQuery,
    useQuery,
    setServerClient,
    useLiveMode,
    unstable__serverClient
  };
};

/**
 * Shortcut setup for the main SSR use-case.
 * @public
 */
export const {
  /** @public */
  loadQuery,
  /** @public */
  setServerClient,
  /** @public */
  useLiveMode,
  /** @public */
  useQuery,
  /** @internal */
  unstable__serverClient
} = createQueryStore({
  client: false,
  ssr: true
});
