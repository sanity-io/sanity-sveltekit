import { buildingsQuery } from '$lib/sanity/queries';
import type { BuildingQueryResult } from '$lib/sanity/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { sanity } }) => {
  const { client, previewEnabled } = sanity;
  const buildings = await client.fetch<BuildingQueryResult>(
    buildingsQuery,
    {},
    { stega: previewEnabled ? true : false }
  );
  return { buildings };
};
