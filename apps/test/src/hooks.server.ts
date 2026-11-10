import { handleLiveLoader } from '@sanity/sveltekit/live';
import { handlePreviewMode } from '@sanity/sveltekit/preview';
import { handleQueryLoader, setServerClient } from '@sanity/sveltekit/query';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { SANITY_API_READ_TOKEN } from '$env/static/private';
import { serverClient } from '$lib/sanity/client.server';

setServerClient(serverClient);

export const handle = sequence(
  handlePreviewMode({
    client: serverClient,
    preview: { redirect }
  }),
  handleQueryLoader(),
  handleLiveLoader({
    browserToken: SANITY_API_READ_TOKEN,
    serverToken: SANITY_API_READ_TOKEN
  })
);
