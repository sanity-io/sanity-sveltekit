import { sanityFetch } from '@sanity/sveltekit';
import { buildingsQuery } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  return sanityFetch(event, { query: buildingsQuery });
};
