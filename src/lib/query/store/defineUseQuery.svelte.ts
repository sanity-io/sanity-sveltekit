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

/**
 * @public
 */
export interface UseQueryOptions<QueryResponseResult = unknown> {
  initial?: QueryResponseInitial<QueryResponseResult>;
}

export type UseQueryParams<QueryResponseResult> = {
  query: string;
  params?: QueryParams;
  options?: UseQueryOptions<QueryResponseResult>;
};

export type UseQueryUpdate<QueryResponseResult> = (
  options: Partial<UseQueryParams<QueryResponseResult>>
) => void;

/**
 * @public
 */
export type UseQuery = <QueryResponseResult = unknown, QueryResponseError = unknown>(
  query: string | UseQueryParams<QueryResponseResult>,
  params?: QueryParams,
  options?: UseQueryOptions<QueryResponseResult>
) => Readable<
  CoreQueryStoreState<QueryResponseResult, QueryResponseError> & WithEncodeDataAttribute
>;
// export type UseQuery = <QueryResponseResult = unknown, QueryResponseError = unknown>(
//   query: string | UseQueryParams<QueryResponseResult>,
//   params?: QueryParams,
//   options?: UseQueryOptions<QueryResponseResult>
// ) => {
//   update: UseQueryUpdate<QueryResponseResult>;
//   value: Readable<
//     CoreQueryStoreState<QueryResponseResult, QueryResponseError> & WithEncodeDataAttribute
//   >;
// };

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

    // If fetcher were returned directly, svelte would trigger the nanostores onMount method
    // on the server, so create a new store and keep it in sync
    const snapshot = writable<CoreQueryStoreState<QueryResponseResult, QueryResponseError>>(
      fetcherStore.value
    );
    // const snapshot = $state<CoreQueryStoreState<QueryResponseResult, QueryResponseError>>(fetcherStore.value!);

    // Only call subscribe on the client
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
