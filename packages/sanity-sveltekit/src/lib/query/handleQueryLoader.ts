import type { ClientPerspective, SanityClient } from '@sanity/client';
import { type Handle, type RequestEvent } from '@sveltejs/kit';
import { loadQuery as defaultLoadQuery, unstable__serverClient } from './store/createQueryStore';
import type { LoadQuery, LoadQueryArguments } from '../types';

/**
 * @public
 */
export interface HandleQueryLoaderConfig {
  client?: SanityClient;
  loadQuery?: LoadQuery;
}

const defineLoadQuery = ({
  previewEnabled,
  loadQuery,
  perspective,
  useCdn
}: {
  previewEnabled?: boolean;
  loadQuery: LoadQuery;
  perspective?: ClientPerspective;
  useCdn: boolean;
}): LoadQuery => {
  return <QueryResponseResult, const QueryString extends string>(
    query: QueryString,
    ...args: LoadQueryArguments<QueryString>
  ) => {
    const [params, options = {}] = args;
    const stega = previewEnabled ? options.stega : false;

    return loadQuery<QueryResponseResult, QueryString>(
      query,
      ...([params, { ...options, perspective, useCdn, stega }] as LoadQueryArguments<QueryString>)
    );
  };
};

const setLocals = ({
  event,
  loadQuery,
  perspective,
  useCdn
}: {
  event: RequestEvent;
  loadQuery: LoadQuery;
  perspective?: ClientPerspective;
  useCdn: boolean;
}) => {
  const previewEnabled = event.locals.sanity?.previewEnabled;

  event.locals.sanity = event.locals.sanity ?? {};

  event.locals.sanity.loadQuery = defineLoadQuery({
    previewEnabled,
    loadQuery,
    perspective,
    useCdn
  });
};

/**
 * @public
 */
export const handleQueryLoader = (config?: HandleQueryLoaderConfig): Handle => {
  const client = config?.client || unstable__serverClient.instance;
  if (!client) throw new Error('No client instance provided to handleLoadQuery');

  const loadQuery = config?.loadQuery || defaultLoadQuery;
  const { perspective, useCdn } = client.config();

  return async ({ event, resolve }) => {
    // Set `sanity` properties on the `event.locals` object
    setLocals({
      event,
      loadQuery,
      perspective,
      useCdn
    });

    return await resolve(event);
  };
};
