import { defineQuery } from '@sanity/sveltekit';

export const buildingsQuery = defineQuery(`*[_type == "building" && defined(slug.current)]{
  _id,
  name,
  "architect": architect->name,
  "slug": slug.current,
  images[]
} | order(name asc)`);

export const buildingQuery = defineQuery(`*[_type == "building" && slug.current == $slug]{
  _id,
  name,
  yearCompleted,
  "architect": architect->name,
  "slug": slug.current,
  images[]
}[0]`);
