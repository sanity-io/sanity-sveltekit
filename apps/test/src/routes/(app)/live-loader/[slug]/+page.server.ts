import { sanityFetch } from '@sanity/sveltekit';
import { buildingQuery } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  const result = await sanityFetch(event, {
    query: buildingQuery,
    params: { slug: event.params.slug }
  });

  if (!result.data) {
    error(404, {
      message: 'Not found'
    });
  }

  return result;
};
