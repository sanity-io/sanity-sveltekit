import { defineField, defineType } from 'sanity';

const architect = defineType({
  type: 'document',
  name: 'architect',
  title: 'Architect',
  fields: [
    defineField({
      type: 'string',
      name: 'name',
      title: 'Name'
    }),
    defineField({
      type: 'slug',
      name: 'slug',
      title: 'Slug',
      options: {
        source: 'name',
        maxLength: 96
      }
    }),
    defineField({
      type: 'date',
      name: 'birthDate',
      title: 'Birth Date'
    }),
    defineField({
      type: 'image',
      name: 'photo',
      title: 'Photo'
    })
  ]
});

const building = defineType({
  type: 'document',
  name: 'building',
  title: 'Building',
  preview: {
    select: {
      title: 'name',
      media: 'images'
    },
    prepare({ title, media }) {
      return {
        title,
        media: media?.[0]
      };
    }
  },
  fields: [
    defineField({
      type: 'string',
      name: 'name',
      title: 'Name'
    }),
    defineField({
      type: 'slug',
      name: 'slug',
      title: 'Slug',
      options: {
        source: 'name',
        maxLength: 96
      }
    }),
    defineField({
      type: 'reference',
      name: 'architect',
      title: 'Architect',
      to: [{ type: 'architect' }]
    }),
    defineField({
      type: 'number',
      name: 'yearCompleted',
      title: 'Year Completed'
    }),
    defineField({
      type: 'array',
      name: 'images',
      title: 'Images',
      of: [{ type: 'image' }]
    }),
    defineField({
      type: 'text',
      name: 'description',
      title: 'Description'
    }),
    defineField({
      type: 'geopoint',
      name: 'location',
      title: 'Location'
    })
  ]
});

export const schema = {
  types: [architect, building]
};
