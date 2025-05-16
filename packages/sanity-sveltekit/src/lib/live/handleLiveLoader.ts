import type { ClientPerspective, QueryOptions, SanityClient } from '@sanity/client';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import { unstable__serverClient } from '../query/store/createQueryStore';
import type { SanityFetch } from '../types';
import { lastLiveEventCookieName, perspectiveCookieEndpoint } from '../constants';
import { sanitizePerspective } from '../util';

/**
 * @public
 */
export interface HandleLiveLoaderConfig {
  /**
   * Required for `sanityFetch` and `LiveLoader` to work
   */
  client?: SanityClient;
  /**
   * Optional. If provided then the token needs to have permissions to query documents with `drafts.` prefixes in order for `perspective: 'drafts'` to work.
   * This token is not shared with the browser.
   */
  serverToken?: string;
  /**
   * Fetch options used by `sanityFetch`
   */
  fetchOptions?: {
    /**
     * Optional, enables time based revalidation in addition to the EventSource connection.
     * @defaultValue `false`
     */
    revalidate?: number | false;
  };
  /**
   * Optional. Include stega encoding when draft mode is enabled.
   *  @defaultValue `true`
   */
  stega?: boolean;
}

const getLastLiveEvent = (event: RequestEvent) => {
  try {
    const lastLiveEventCookie = event.cookies.get(lastLiveEventCookieName);
    const [id, lastTags] = lastLiveEventCookie?.split('|') || [];
    const tags = lastTags?.split(',') || [];
    return { id, tags };
  } catch {
    return undefined;
  }
};

const defineSanityFetch = ({
  client,
  stegaEnabled,
  perspective: _perspective,
  serverToken
}: {
  client: SanityClient;
  stegaEnabled?: boolean;
  perspective: ClientPerspective;
  serverToken?: string;
}): SanityFetch => {
  const clientConfig = client.config();
  const clientToken = clientConfig.token;
  const studioUrlDefined = typeof clientConfig.stega.studioUrl !== 'undefined';

  return async (event, _options) => {
    const { query, params, stega: _stega, tag = 'svelte-loader.fetch' } = _options;

    const perspective = (_options.perspective || _perspective) as ClientPerspective;
    const useCdn = perspective === 'published';
    const stega =
      _stega ?? (stegaEnabled && studioUrlDefined && event.locals.sanity?.previewEnabled);
    const token = perspective !== 'published' && serverToken ? serverToken : clientToken;

    const options: QueryOptions = {
      cacheMode: useCdn ? 'noStale' : undefined,
      filterResponse: false,
      perspective,
      resultSourceMap: 'withKeyArraySelector',
      stega,
      token,
      useCdn
    };

    const { syncTags } = await client.fetch(query, await params, {
      ...options,
      resultSourceMap: false,
      returnQuery: false,
      stega: false,
      tag: [tag, 'fetch-sync-tags'].filter(Boolean).join('.')
    });

    const tags = syncTags?.map((tag) => `sanity:${tag}`) || [];
    tags.forEach((tag) => event.depends(tag));

    const lastLiveEvent = getLastLiveEvent(event);
    if (lastLiveEvent) {
      const tagsSet = new Set(lastLiveEvent.tags);
      if (tags.some((tag) => tagsSet.has(tag))) {
        options.lastLiveEventId = lastLiveEvent.id;
      }
    }

    const { result, resultSourceMap } = await client.fetch(query, await params, options);

    return { data: result, sourceMap: resultSourceMap || null, tags };
  };
};

const setLocals = ({
  client,
  event,
  serverToken,
  stegaEnabled
}: {
  client: SanityClient;
  event: RequestEvent;
  serverToken?: string;
  stegaEnabled?: boolean;
}) => {
  // If previewing, use the sanitized perspective from the preview cookie or
  // fall back to `drafts` if no cookie is present. If not previewing,
  // always use the `published` perspective.
  const perspectiveCookie = event.cookies.get(perspectiveCookieName);
  const perspective = event.locals.sanity?.previewEnabled
    ? sanitizePerspective(perspectiveCookie, 'drafts')
    : 'published';

  event.locals.sanity = event.locals.sanity ?? {};

  event.locals.sanity.previewPerspective = perspective;
  event.locals.sanity.fetch = defineSanityFetch({
    client,
    stegaEnabled,
    perspective,
    serverToken
  });
};

const handlePerspectiveCookie = async (event: RequestEvent) => {
  const devMode = process.env['NODE_ENV'] === 'development';
  const perspective = await event.request.text();
  if (typeof perspective !== 'string') {
    return new Response(null, { status: 400 });
  }

  return new Response(null, {
    headers: {
      'Set-Cookie': event.cookies.serialize(perspectiveCookieName, perspective, {
        httpOnly: true,
        sameSite: devMode ? 'lax' : 'none',
        secure: !devMode,
        path: '/'
      })
    }
  });
};

const parseLastEvent = (
  payload?: string
): {
  tags: string[];
  eventId: string;
} => {
  if (!payload) {
    return { eventId: '', tags: [] };
  }

  const parsed = JSON.parse(payload);
  if (
    parsed &&
    typeof parsed === 'object' &&
    'tags' in parsed &&
    'eventId' in parsed &&
    Array.isArray(parsed.tags) &&
    parsed.tags.every((tag: unknown) => typeof tag === 'string') &&
    typeof parsed.eventId === 'string'
  ) {
    return parsed;
  }

  throw new Error();
};

const handleLastEventCookie = async (event: RequestEvent) => {
  try {
    const lastEvent = parseLastEvent(await event.request.text());
    const devMode = process.env['NODE_ENV'] === 'development';

    return new Response(null, {
      headers: {
        'Set-Cookie': event.cookies.serialize(lastLiveEventCookieName, JSON.stringify(lastEvent), {
          httpOnly: true,
          maxAge: 5,
          sameSite: devMode ? 'lax' : 'none',
          secure: !devMode,
          path: '/'
        })
      }
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * @public
 */
export const handleLiveLoader = (config?: HandleLiveLoaderConfig): Handle => {
  const { client: configClient, serverToken, stega: stegaEnabled = true } = config || {};

  const _client = configClient || unstable__serverClient.instance;
  if (!_client) throw new Error('No client instance provided to handleLiveLoader');

  const client = _client.withConfig({ allowReconfigure: false, useCdn: false });

  return async ({ event, resolve }) => {
    // Handle requests for setting the perspective cookie
    if (event.url.pathname === perspectiveCookieEndpoint && event.request.method === 'POST') {
      return handlePerspectiveCookie(event);
    }

    // Handle requests for setting the perspective cookie
    if (event.url.pathname === '/last' && event.request.method === 'POST') {
      return handleLastEventCookie(event);
    }

    // Set `sanity` properties on the `event.locals` object
    setLocals({
      client,
      event,
      serverToken,
      stegaEnabled
    });

    return await resolve(event);
  };
};
