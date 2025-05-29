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
  /**
   * The refresh API allows smarter refresh logic than the default
   * `location.reload()` behavior. You can call the refreshDefault argument to
   * trigger the default refresh behavior so you don't have to reimplement it.
   */
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
    /**
     * The token used for receiving draft content updates. You can safely pass
     * this value to client as it will only be set when preview mode is enabled.
     */
    browserToken: string | undefined;
    /**
     * A Sanity client instance configured for visual editing.
     */
    client: SanityClient;
    /**
     * The fetch method used internally by `sanityFetch`.
     */
    fetch: SanityFetch;
    /**
     * The method used to fetch data on the server if using query loaders.
     */
    loadQuery: LoadQuery;
    /**
     * Helper property to check if preview mode is currently enabled.
     */
    previewEnabled: boolean;
    /**
     * Helper property to check if the current preview perspective.
     */
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
