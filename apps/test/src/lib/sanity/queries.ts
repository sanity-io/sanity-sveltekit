import { defineQuery } from '@sanity/sveltekit';

/**
 * Projects image fields for `<Image>` from `@sanity/sveltekit/image`: the Studio crop and
 * hotspot, plus the asset URL and LQIP. Custom GROQ functions must be declared at the start of
 * every query that calls them.
 */
const imageFunctions = /* groq */ `
fn image::asset($asset) = $asset->{url, metadata{lqip}};
fn image::field($image) = $image{_key, crop, hotspot, "asset": image::asset(asset)};
`;

export const buildingsQuery = defineQuery(`${imageFunctions}
*[_type == "building" && defined(slug.current)]{
  _id,
  name,
  "architect": architect->name,
  "slug": slug.current,
  "images": images[]{...image::field(@)}
} | order(name asc)`);

export const buildingQuery = defineQuery(`${imageFunctions}
*[_type == "building" && slug.current == $slug]{
  _id,
  name,
  yearCompleted,
  "architect": architect->name,
  "slug": slug.current,
  "images": images[]{...image::field(@)}
}[0]`);
