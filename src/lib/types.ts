import type { HistoryRefresh, VisualEditingOptions } from '@sanity/visual-editing';
import type {
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
  QueryParams,
  ResolveStudioUrl,
  ResponseQueryOptions,
  SanityClient,
  StudioUrl
} from '@sanity/client';
import type { EncodeDataAttributeFunction } from '@sanity/core-loader/encode-data-attribute';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { EnableLiveModeOptions } from '@sanity/core-loader';

export type * from '@sanity/core-loader';

/**
 * @public
 */
export interface VisualEditingProps extends Omit<VisualEditingOptions, 'history' | 'refresh'> {
  /**
   * @deprecated The history adapter is already implemented
   */
  history?: never;
  refresh?: (
    payload: HistoryRefresh,
    refreshDefault: () => false | Promise<void>
  ) => false | Promise<void>;
}

/**
 * @public
 */
export interface SanityLocals {
  sanity: {
    client: SanityClient;
    fetch: SanityFetch;
    loadQuery: LoadQuery;
    previewEnabled: boolean;
    previewPerspective: ClientPerspective;
  };
}

/**
 * @public
 */
export type WithEncodeDataAttribute = {
  encodeDataAttribute: EncodeDataAttributeFunction;
};

export interface SanityFetchOptions<QueryString extends string> {
  query: QueryString;
  params?: QueryParams | Promise<QueryParams>;
  perspective?: Exclude<ClientPerspective, 'raw'>;
  stega?: boolean;
  tag?: string;
}

// /** @public */
export type SanityFetch = <
  TServerLoadEvent extends ServerLoadEvent,
  const QueryString extends string
>(
  event: TServerLoadEvent,
  options: {
    query: QueryString;
    params?: QueryParams | Promise<QueryParams>;
    perspective?: Exclude<ClientPerspective, 'raw'>;
    stega?: boolean;
    tag?: string;
  }
) => Promise<{
  data: ClientReturn<QueryString>;
  sourceMap: ContentSourceMap | null;
  tags: string[];
}>;

/**
 * @public
 */
export type NonUndefinedGuard<T> = T extends undefined ? never : T;

/**
 * @public
 */
export interface QueryResponseInitial<QueryResponseResult> {
  data: QueryResponseResult;
  sourceMap: ContentSourceMap | undefined;
  /**
   * The perspective used to fetch the data, if not provided it'll assume 'published'
   */
  perspective?: ClientPerspective;
  encodeDataAttribute?: EncodeDataAttributeFunction;
}

/**
 * @public
 */
export type LoadQueryOptions = Pick<
  ResponseQueryOptions,
  'perspective' | 'cache' | 'next' | 'useCdn' | 'tag' | 'headers' | 'stega'
>;

/**
 * @public
 */
export type LoadQuery = <QueryResponseResult>(
  query: string,
  params?: QueryParams,
  options?: LoadQueryOptions
) => Promise<QueryResponseInitial<QueryResponseResult>>;

/**
 * @public
 */
export type UseLiveMode = (
  options?: EnableLiveModeOptions & {
    /**
     * Set this option to activate `encodeDataAttribute` on `useQuery` hooks when stega isn't used.
     */
    studioUrl?: StudioUrl | ResolveStudioUrl | undefined;
  }
) => void;
