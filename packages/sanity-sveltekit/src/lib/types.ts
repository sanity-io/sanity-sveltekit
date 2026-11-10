import type { HistoryRefresh, VisualEditingOptions } from '@sanity/visual-editing';
import type {
  ClientParams,
  ClientPerspective,
  ClientReturn,
  ContentSourceMap,
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

/**
 * A `params` property that is required when `Params` has required keys, which is only the
 * case for a query branded with `__groqParams`, and optional otherwise.
 */
export type ParamsProperty<Params> = {} extends Params ? { params?: Params } : { params: Params };

/**
 * The positional `params` argument followed by `Rest`, required on the same terms as
 * {@link ParamsProperty}.
 */
export type ParamsArguments<Params, Rest> = {} extends Params
  ? [params?: Params, options?: Rest]
  : [params: Params, options?: Rest];

/**
 * The result of a branded query, or `Fallback` for anything else. Unlike `ClientReturn` this
 * doesn't look queries up in `SanityQueries`, so helpers that never did keep their result type.
 * A plain string never matches the optional brand property, so only branded queries reach
 * `ClientReturn`, which reads the brand before the registry.
 */
export type BrandedQueryResult<QueryString extends string, Fallback> = QueryString extends {
  readonly __groqResult?: unknown;
}
  ? ClientReturn<QueryString, Fallback>
  : Fallback;

export type SanityFetchOptions<QueryString extends string> = {
  query: QueryString;
  perspective?: Exclude<ClientPerspective, 'raw'>;
  stega?: boolean;
  tag?: string;
} & ParamsProperty<ClientParams<QueryString> | Promise<ClientParams<QueryString>>>;

// /** @public */
export type SanityFetch = <
  TServerLoadEvent extends ServerLoadEvent,
  const QueryString extends string
>(
  event: TServerLoadEvent,
  options: SanityFetchOptions<QueryString>
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
export type LoadQuery = <QueryResponseResult = unknown, const QueryString extends string = string>(
  query: QueryString,
  ...args: LoadQueryArguments<QueryString>
) => Promise<QueryResponseInitial<BrandedQueryResult<QueryString, QueryResponseResult>>>;

/**
 * The `params` and `options` arguments of {@link LoadQuery}.
 * @public
 */
export type LoadQueryArguments<QueryString extends string> = ParamsArguments<
  ClientParams<QueryString>,
  LoadQueryOptions
>;

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
