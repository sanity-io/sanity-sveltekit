import { buildingsQuery as query } from '$lib/sanity/queries';
import type { BuildingsQueryResult } from '$lib/sanity.types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { sanity } }) => ({
  query,
  params: {},
  options: { initial: await sanity.loadQuery<BuildingsQueryResult>(query) }
});
