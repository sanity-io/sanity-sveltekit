import { buildingQuery as query } from '$lib/sanity/queries';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { BuildingQueryResult } from '$lib/sanity/types';

export const load: PageServerLoad = async ({ locals: { sanity }, params: { slug } }) => {
  const { loadQuery } = sanity;
  const params = { slug };

  const initial = await loadQuery<BuildingQueryResult>(query, params);
  if (!initial.data) {
    error(404, {
      message: 'Not found'
    });
  }

  return {
    query,
    params,
    options: { initial }
  };
};
