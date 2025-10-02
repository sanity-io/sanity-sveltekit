import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './schemaTypes';
import { presentationTool } from 'sanity/presentation';
import {
  PUBLIC_SANITY_PROJECT_ID as projectId,
  PUBLIC_SANITY_DATASET as dataset,
  PUBLIC_SANITY_APP_URL as origin
} from '$env/static/public';

export default defineConfig({
  name: 'default',
  title: 'sanity-sveltekit',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: {
        origin,
        initial: '/',
        previewMode: {
          enable: '/preview/enable',
          disable: '/preview/disable'
        }
      }
    })
  ],
  schema
});
