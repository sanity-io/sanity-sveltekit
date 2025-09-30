import { buildingsQuery } from '$lib/sanity/queries';
import type { BuildingsQueryResult } from '$lib/sanity/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { sanity } }) => {
  const { client, previewEnabled } = sanity;
  const buildings = await client.fetch<BuildingsQueryResult>(
    buildingsQuery,
    {},
    { stega: previewEnabled ? true : false }
  );
  return { buildings };
};
