import type { QueryParams } from '@sanity/client';
import type {
  QueryStore as CoreQueryStore,
  QueryStoreState as CoreQueryStoreState
} from '@sanity/core-loader';
import isEqual from 'fast-deep-equal';
import { derived, get, writable, type Readable } from 'svelte/store';
import type { WithEncodeDataAttribute } from '../../types';
import { useEncodeDataAttribute } from '../../useEncodeDataAttribute';
import { defineStudioUrlStore } from './defineStudioUrlStore';
import type { QueryResponseInitial } from '../../types';
import { onMount } from 'svelte';
import { browser } from '$app/environment';

/**
 * @public
 */
export interface UseQueryOptions<QueryResponseResult = unknown> {
  initial?: QueryResponseInitial<QueryResponseResult>;
}

/**
 * @public
 */
export type UseQuery = <QueryResponseResult = unknown, QueryResponseError = unknown>(
  query:
    | string
    | {
        query: string;
        params?: QueryParams;
        options?: UseQueryOptions<QueryResponseResult>;
      },
  params?: QueryParams,
  options?: UseQueryOptions<QueryResponseResult>
) => Readable<
  CoreQueryStoreState<QueryResponseResult, QueryResponseError> & WithEncodeDataAttribute
>;

/**
 * @public
 */
export function defineUseQuery({
  createFetcherStore,
  studioUrlStore
}: Pick<CoreQueryStore, 'createFetcherStore'> & {
  studioUrlStore: ReturnType<typeof defineStudioUrlStore>;
}): UseQuery {
  const DEFAULT_PARAMS = {};
  const DEFAULT_OPTIONS = {};

  return <QueryResponseResult, QueryResponseError>(
    query:
      | string
      | {
          query: string;
          params?: QueryParams;
          options?: UseQueryOptions<QueryResponseResult>;
        },
    params: QueryParams = DEFAULT_PARAMS,
    options: UseQueryOptions<QueryResponseResult> = DEFAULT_OPTIONS
  ) => {
    if (typeof query === 'object') {
      params = query.params || DEFAULT_PARAMS;
      options = query.options || DEFAULT_OPTIONS;
      query = query.query;
    }

    const initial = options.initial
      ? { perspective: 'published' as const, ...options.initial }
      : undefined;

    const parsedParams = JSON.parse(JSON.stringify(params)) as QueryParams;

    const fetcherStore = createFetcherStore<QueryResponseResult, QueryResponseError>(
      query,
      parsedParams,
      initial
    );

    if (!browser) {
      // Overwrite the loading state on the server as `@sanity/core-loader` will
      // set it to true if no source map is provided, which we don't want if
      // we're displaying published data.
      // @todo This might not be the best way to do this, but it works for now.
      fetcherStore.setKey('loading', false);
    }

    // Create a snapshot store to keep track of the latest state
    const snapshot = writable<CoreQueryStoreState<QueryResponseResult, QueryResponseError>>(
      fetcherStore.value
    );

    // Subscribe to the store on the client and sync snapshots as they arrive
    onMount(() => {
      return fetcherStore.subscribe((newSnapshot) => {
        const prev = get(snapshot);
        if (
          prev.error !== newSnapshot.error ||
          prev.loading !== newSnapshot.loading ||
          prev.perspective !== newSnapshot.perspective ||
          !isEqual(prev.data, newSnapshot.data)
        ) {
          snapshot.set(newSnapshot);
        }
      });
    });

    // Return the store data with encodeDataAttribute
    const queryValue = derived([snapshot, studioUrlStore], ([value, studioUrl]) => ({
      ...value,
      encodeDataAttribute: useEncodeDataAttribute(value.data, value.sourceMap, studioUrl)
    }));

    return queryValue;
  };
}
