import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals: { sanity } }) => {
  const { browserToken, previewEnabled, previewPerspective } = sanity;
  return { browserToken, previewEnabled, previewPerspective };
};
