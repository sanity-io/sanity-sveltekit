import crypto from 'crypto';
import type { SanityClient } from '@sanity/client';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { redirect as defaultRedirect, error, type Handle, type RequestEvent } from '@sveltejs/kit';

/**
 * @public
 */
export interface HandlePreviewModeConfig {
  /**
   * The Sanity client instance for fetching data and listening to mutations
   */
  client: SanityClient;
  preview?: {
    /**
     * The preview secret to use for verifying preview access
     */
    secret?: string;
    /**
     * The name of the cookie used to store preview secret
     * @defaultValue '__sanity_preview'
     */
    cookie?: string;
    /**
     * The endpoints to use for enabling and disabling preview
     * @defaultValue { enable: '/preview/enable', disable: '/preview/disable' }
     */
    endpoints?: {
      enable?: string;
      disable?: string;
    };
    /**
     * For explicitly providing a redirect function in case of mistmatched
     * Svelte specific dependency versions, not needed in most cases. See
     * https://github.com/sveltejs/kit/issues/11749 for more information
     */
    redirect?: (status: number, location: string | URL) => never;
  };
}

const handleEnablePreview = async ({
  client,
  event,
  previewCookieName,
  previewSecret,
  redirect
}: {
  client: SanityClient;
  event: RequestEvent;
  previewCookieName: string;
  previewSecret: string;
  redirect: (status: number, location: string | URL) => never;
}) => {
  const {
    isValid,
    redirectTo = '/',
    studioPreviewPerspective
  } = await validatePreviewUrl(client, event.url.toString());

  if (!isValid) {
    throw error(401, 'Invalid secret');
  }

  const devMode = process.env['NODE_ENV'] === 'development';
  event.cookies.set(previewCookieName, previewSecret, {
    httpOnly: true,
    path: '/',
    sameSite: devMode ? 'lax' : 'none',
    secure: !devMode
  });

  if (studioPreviewPerspective) {
    event.cookies.set(perspectiveCookieName, studioPreviewPerspective, {
      httpOnly: true,
      path: '/',
      sameSite: devMode ? 'lax' : 'none',
      secure: !devMode
    });
  }

  return redirect(307, redirectTo);
};

const handleDisablePreview = ({
  event,
  previewCookieName,
  redirect
}: {
  event: RequestEvent;
  previewCookieName: string;
  redirect: (status: number, location: string | URL) => never;
}) => {
  event.cookies.delete(previewCookieName, { path: '/' });
  return redirect(307, event.url.searchParams.get('redirect') || '/');
};

/**
 * Set `sanity` properties on the `event.locals` object
 */
const setLocals = ({
  client: providedClient,
  event,
  previewCookieName,
  previewSecret
}: {
  client: SanityClient;
  event: RequestEvent;
  previewCookieName: string;
  previewSecret: string;
}) => {
  // Check the cookie to see if preview is enabled
  const previewEnabled = event.cookies.get(previewCookieName) === previewSecret;

  // Set default perspective and useCdn based on preview status
  const perspective = previewEnabled ? 'previewDrafts' : 'published';
  const useCdn = previewEnabled ? false : true;

  const client = providedClient.withConfig({
    perspective,
    useCdn
  });

  if (event.locals.sanity) {
    // eslint-disable-next-line no-console
    console.warn(
      'Sequence `handlePreviewMode` before `handleQueryLoader` or `handleLiveLoader` in `hooks.server.ts` to ensure the `event.locals.sanity` properties are set correctly'
    );
  }

  event.locals.sanity = event.locals.sanity ?? {};

  event.locals.sanity.client = client;
  event.locals.sanity.previewEnabled = previewEnabled;
};

/**
 * @public
 */
export const handlePreviewMode = ({ client, preview }: HandlePreviewModeConfig): Handle => {
  const disablePath = preview?.endpoints?.disable || '/preview/disable';
  const enablePath = preview?.endpoints?.enable || '/preview/enable';
  const previewCookieName = preview?.cookie || '__sanity_preview';
  const previewSecret = preview?.secret || crypto.randomBytes(16).toString('hex');
  const redirect = preview?.redirect || defaultRedirect;

  if (!client) throw new Error('No client configured for preview');

  return async ({ event, resolve }) => {
    // Handle requests to enable preview mode
    if (event.url.pathname === enablePath) {
      return handleEnablePreview({
        client,
        event,
        previewCookieName,
        previewSecret,
        redirect
      });
    }

    // Handle requests to disable preview mode
    if (event.url.pathname === disablePath) {
      return handleDisablePreview({
        event,
        previewCookieName,
        redirect
      });
    }

    // Set `sanity` properties on the `event.locals` object
    setLocals({
      client,
      event,
      previewCookieName,
      previewSecret
    });

    return await resolve(event);
  };
};
